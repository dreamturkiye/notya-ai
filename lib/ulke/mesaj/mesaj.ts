/**
 * NOTYA-ULKE-MESAJ-01 — MESSAGES BETWEEN A DOCTOR AND A PATIENT, inside the patient portal (migration 140). Server only.
 *
 * WHO OPENS, WHO CLOSES. THE DOCTOR opens a conversation by writing to one of their own patients, and the doctor
 * closes it. THE PATIENT answers in a conversation that is open, and cannot start one: with none open, the
 * patient's page says so and still shows that messages are not for emergencies. A closed conversation can be read by
 * both and written in by neither; the doctor's next message opens a new one.
 *
 * NOTHING LEAVES THE PRODUCT. No SMS, no e-mail, no messenger: the kit has no outbound channel, and a pack's
 * `uygulama.mesaj.disBildirim` is a slot that can only say "off". The patient reads a message after signing in to
 * their page with their link and PIN; the doctor tells them that one is waiting.
 *
 * NO MODEL. Nothing in this file calls a model: no message is written, proposed, summarised or sent by one.
 * NO ATTACHMENT. A message is text; the table has no column for anything else.
 *
 * HEALTH DATA. A message's text is one value, encrypted with the same helper as the rest of a patient's data
 * (lib/security/encryption.ts). The country, the doctor, the patient, the conversation and the writer are INSIDE the
 * encrypted value as well as in the row's key: a value that is not this row's own is read as "cannot be shown".
 *
 * ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation.
 *   THE DOCTOR'S SIDE   a patient id or a conversation id from a request is matched against the authenticated doctor
 *                       in the same statement that reads the row; another doctor's is exactly "not found".
 *   THE PATIENT'S SIDE  takes NO id from a request at all: the doctor and the patient are those of the portal
 *                       session's own row (lib/ulke/portal/giris.ts), and every statement carries both.
 * Every statement is bound to this build's country (lib/ulke/uygulama/tablolar.ts). The database repeats all of it
 * in its keys and holds, by trigger, that a closed conversation takes no message and that a message never changes.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import type { PortalKimligi } from '../portal/giris'
import { aktifUlke, ozellikAcik } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { ulkeTablosu } from '../uygulama/tablolar'
import { MESAJ_AZAMI, MESAJ_GUNLUK_AZAMI, MESAJ_LISTE_AZAMI, mesajMetniAl, OKUNMAMIS_AZAMI, YAZISMA_LISTE_AZAMI, type HastaMesajGorunumu, type HekimMesajGorunumu, type Mesaj, type MesajGondereni, type OkunmamisHasta, type Yazisma } from './sabitler'

const YAZISMALAR = 'ulke_mesaj_yazismalari'
const MESAJLAR = 'ulke_hasta_mesajlari'
const GUN_MS = 86_400_000

/** true = messages between a doctor and a patient exist in this country. They live in the portal, so they need it. */
export const mesajAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('hastaPortali') && ozellikAcik('hastaMesajlari')

export type MesajRetKodu = 'NOT_FOUND' | 'BOS' | 'UZUN' | 'LIMIT' | 'KAPALI' | 'DURUM' | 'GECERSIZ' | 'BASARISIZ'
export const MESAJ_DURUMU: Record<MesajRetKodu, number> = { NOT_FOUND: 404, BOS: 400, UZUN: 400, LIMIT: 429, KAPALI: 409, DURUM: 409, GECERSIZ: 400, BASARISIZ: 500 }
type Ret = { tamam: false; kod: MesajRetKodu }
type Cift = { doktorId: string; hastaId: string }

// ───────────────────────── the encrypted value ─────────────────────────

type Zarf = { v: 1; u: string; d: string; h: string; y: string; g: MesajGondereni; m: string }
const sifrele = (z: Omit<Zarf, 'v' | 'u'>): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), ...z } satisfies Zarf))
/** The text of a row — or null when the value is not THIS country's, doctor's, patient's, conversation's and writer's own. */
function coz(ham: unknown, c: Cift, yazismaId: string, gonderen: string): string | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf> | null
    if (!z || z.v !== 1 || z.u !== aktifUlke() || z.d !== c.doktorId || z.h !== c.hastaId || z.y !== yazismaId || z.g !== gonderen || typeof z.m !== 'string') return null
    return z.m
  } catch { return null }
}

// ───────────────────────── shared by both sides: always by doctor AND patient ─────────────────────────

type YazismaSatiri = { id: string; kapandi_at: string | null; created_at: string }
type MesajSatiri = { id: string; yazisma_id: string; gonderen: string; metin_encrypted: string | null; okundu_at: string | null; created_at: string }

/** The one conversation of this pair that is open, or null. */
async function acikYazisma(supabase: SupabaseClient, c: Cift): Promise<YazismaSatiri | null> {
  const { data } = await ulkeTablosu(supabase, YAZISMALAR).select('id, kapandi_at, created_at').eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).is('kapandi_at', null).maybeSingle()
  return (data as unknown as YazismaSatiri | null) ?? null
}

/** The conversations of this pair with their messages, newest conversation first. A message whose value cannot be read is left out. */
async function yazismalariOku(supabase: SupabaseClient, c: Cift): Promise<Yazisma[]> {
  const { data: y } = await ulkeTablosu(supabase, YAZISMALAR).select('id, kapandi_at, created_at').eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).order('created_at', { ascending: false }).limit(YAZISMA_LISTE_AZAMI)
  const yazismalar = (y as unknown as YazismaSatiri[] | null) ?? []
  if (!yazismalar.length) return []
  const { data: m } = await ulkeTablosu(supabase, MESAJLAR).select('id, yazisma_id, gonderen, metin_encrypted, okundu_at, created_at').eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).in('yazisma_id', yazismalar.map((x) => x.id)).order('created_at', { ascending: true }).limit(MESAJ_LISTE_AZAMI)
  const mesajlar = (m as unknown as MesajSatiri[] | null) ?? []
  return yazismalar
    .map((x) => ({
      id: x.id, olusturuldu: x.created_at, kapandi: x.kapandi_at ?? null,
      mesajlar: mesajlar.filter((s) => s.yazisma_id === x.id && (s.gonderen === 'hekim' || s.gonderen === 'hasta')).flatMap((s): Mesaj[] => {
        const metin = coz(s.metin_encrypted, c, x.id, s.gonderen)
        return metin === null ? [] : [{ id: s.id, gonderen: s.gonderen as MesajGondereni, metin, an: s.created_at, okundu: s.okundu_at ?? null }]
      }),
    }))
    // A conversation that was opened and never got its first message (a failed write) is nothing to show.
    .filter((x) => x.mesajlar.length > 0)
}

/** How many messages this side wrote to this pair's conversations in the last 24 hours. */
async function gunlukAdet(supabase: SupabaseClient, c: Cift, gonderen: MesajGondereni, simdi: number): Promise<number> {
  const { data } = await ulkeTablosu(supabase, MESAJLAR).select('id').eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).eq('gonderen', gonderen).gt('created_at', new Date(simdi - GUN_MS).toISOString()).limit(MESAJ_GUNLUK_AZAMI + 1)
  return Array.isArray(data) ? data.length : 0
}

async function mesajEkle(supabase: SupabaseClient, c: Cift, yazismaId: string, gonderen: MesajGondereni, metin: string, simdi: number): Promise<{ tamam: true; id: string } | Ret> {
  const { data, error } = await ulkeTablosu(supabase, MESAJLAR).insert({ doctor_id: c.doktorId, patient_id: c.hastaId, yazisma_id: yazismaId, gonderen, metin_encrypted: sifrele({ d: c.doktorId, h: c.hastaId, y: yazismaId, g: gonderen, m: metin }), okundu_at: null, created_at: new Date(simdi).toISOString() }).select('id').single()
  const id = (data as { id?: string } | null)?.id
  // 23514: the conversation was closed between the read and this write (the database's own rule).
  if (error) return { tamam: false, kod: (error as { code?: string }).code === '23514' ? 'KAPALI' : 'BASARISIZ' }
  return id ? { tamam: true, id } : { tamam: false, kod: 'BASARISIZ' }
}

/**
 * Marks as read what THE OTHER side wrote to this pair, UP TO the newest message the reader's screen was showing
 * (`kadar`, the moment of that message). A message that arrived after the screen was drawn stays unread: nothing is
 * ever marked as read that was not shown. Messages of a closed conversation too.
 */
async function okunduYap(supabase: SupabaseClient, c: Cift, yazan: MesajGondereni, kadar: string, simdi: number): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, MESAJLAR).update({ okundu_at: new Date(simdi).toISOString() }).eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).eq('gonderen', yazan).is('okundu_at', null).lte('created_at', kadar)
  return !error
}

/** The moment a screen says it has shown messages up to: an ISO moment, never later than now. null = not a moment. */
function kadarAl(ham: unknown, simdi: number): string | null {
  if (typeof ham !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(ham)) return null
  const t = new Date(ham).getTime()
  return Number.isFinite(t) ? new Date(Math.min(t, simdi)).toISOString() : null
}

const metniDenetle = (ham: unknown): { tamam: true; metin: string } | Ret => {
  const metin = mesajMetniAl(ham)
  if (!metin) return { tamam: false, kod: 'BOS' }
  if (metin.length > MESAJ_AZAMI) return { tamam: false, kod: 'UZUN' }
  return { tamam: true, metin }
}

// ───────────────────────── the doctor's side ─────────────────────────

/** The conversations with one of THIS doctor's patients. null = not this doctor's patient. */
export async function hekimMesajlari(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<HekimMesajGorunumu | null> {
  // ISOLATION: the patient must be this doctor's before anything else is read.
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const c = { doktorId, hastaId: hasta.id }
  // Whether the patient can read at all: a link that is not withdrawn, not locked and not over. Dates only.
  const { data } = await ulkeTablosu(supabase, 'ulke_portal_erisimleri').select('id, kilitlendi_at, son_gecerlilik').eq('doctor_id', doktorId).eq('patient_id', hasta.id).is('iptal_at', null).maybeSingle()
  const e = data as unknown as { kilitlendi_at: string | null; son_gecerlilik: string } | null
  const erisim: HekimMesajGorunumu['erisim'] = !e ? 'yok' : e.kilitlendi_at ? 'kilitli' : new Date(e.son_gecerlilik).getTime() <= simdi ? 'suresi-doldu' : 'acik'
  return { yazismalar: await yazismalariOku(supabase, c), erisim }
}

/** The doctor writes to one of THEIR OWN patients. Opens a conversation where none is open. */
export async function hekimMesajYaz(supabase: SupabaseClient, doktorId: string, hastaId: string, ham: unknown, simdi = Date.now()): Promise<{ tamam: true; id: string; yazismaId: string } | Ret> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const m = metniDenetle(ham)
  if (!m.tamam) return m
  const c = { doktorId, hastaId: hasta.id }
  if ((await gunlukAdet(supabase, c, 'hekim', simdi)) >= MESAJ_GUNLUK_AZAMI) return { tamam: false, kod: 'LIMIT' }
  let y = await acikYazisma(supabase, c)
  if (!y) {
    const an = new Date(simdi).toISOString()
    const { data, error } = await ulkeTablosu(supabase, YAZISMALAR).insert({ doctor_id: doktorId, patient_id: hasta.id, kapandi_at: null, created_at: an, updated_at: an }).select('id, kapandi_at, created_at').single()
    // 23505: another request of the same doctor opened it at the same moment — that one is the conversation.
    y = error ? await acikYazisma(supabase, c) : (data as unknown as YazismaSatiri | null)
    if (!y) return { tamam: false, kod: 'BASARISIZ' }
  }
  const r = await mesajEkle(supabase, c, y.id, 'hekim', m.metin, simdi)
  return r.tamam ? { tamam: true, id: r.id, yazismaId: y.id } : r
}

/** The doctor has read what this patient wrote, up to the newest message their screen showed. */
export async function hekimOkudu(supabase: SupabaseClient, doktorId: string, hastaId: string, kadarHam: unknown, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const kadar = kadarAl(kadarHam, simdi)
  if (!kadar) return { tamam: false, kod: 'GECERSIZ' }
  return (await okunduYap(supabase, { doktorId, hastaId: hasta.id }, 'hasta', kadar, simdi)) ? { tamam: true } : { tamam: false, kod: 'BASARISIZ' }
}

/** The doctor closes one of THEIR OWN conversations. Once: a closed conversation stays closed. */
export async function yazismaKapat(supabase: SupabaseClient, doktorId: string, yazismaId: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  // ISOLATION: conversation id + doctor_id in the same statement; a foreign id is a missing id.
  const { data: s, error } = await ulkeTablosu(supabase, YAZISMALAR).select('id, kapandi_at').eq('id', yazismaId).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  const satir = s as unknown as Pick<YazismaSatiri, 'id' | 'kapandi_at'> | null
  if (!satir) return { tamam: false, kod: 'NOT_FOUND' }
  if (satir.kapandi_at) return { tamam: false, kod: 'DURUM' }
  const an = new Date(simdi).toISOString()
  const { data, error: yazmaHatasi } = await ulkeTablosu(supabase, YAZISMALAR).update({ kapandi_at: an, updated_at: an }).eq('id', yazismaId).eq('doctor_id', doktorId).is('kapandi_at', null).select('id')
  if (yazmaHatasi) return { tamam: false, kod: 'BASARISIZ' }
  // Two requests at the same moment: the second finds nothing left to close.
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'DURUM' }
  return { tamam: true }
}

/**
 * THE UNREAD LIST of THIS doctor: the patients whose messages the doctor has not read, newest first. No text of a
 * message is read here. Names are read by doctor_id AND patient id: an id that is not this doctor's has no row.
 */
export async function hekimOkunmamislari(supabase: SupabaseClient, doktorId: string): Promise<OkunmamisHasta[]> {
  const { data, error } = await ulkeTablosu(supabase, MESAJLAR).select('id, patient_id, created_at').eq('doctor_id', doktorId).eq('gonderen', 'hasta').is('okundu_at', null).order('created_at', { ascending: false }).limit(OKUNMAMIS_AZAMI)
  if (error || !data) return []
  const satirlar = data as unknown as { patient_id: string; created_at: string }[]
  const adlar = await hastaAdlari(supabase, doktorId, [...new Set(satirlar.map((s) => s.patient_id))])
  const liste = new Map<string, OkunmamisHasta>()
  for (const s of satirlar) {
    if (!adlar.has(s.patient_id)) continue
    const var_ = liste.get(s.patient_id)
    if (var_) var_.adet += 1
    else liste.set(s.patient_id, { hastaId: s.patient_id, hastaAdi: adlar.get(s.patient_id) ?? '', adet: 1, son: s.created_at })
  }
  return [...liste.values()]
}

// ───────────────────────── the patient's side: no id from a request, ever ─────────────────────────

/** What the signed-in PATIENT reads. null = the session's patient is not there any more. */
export async function hastaMesajlari(supabase: SupabaseClient, o: PortalKimligi): Promise<HastaMesajGorunumu | null> {
  const hasta = await hastaGetir(supabase, o.doktorId, o.hastaId)
  if (!hasta) return null
  const c = { doktorId: o.doktorId, hastaId: hasta.id }
  const yazismalar = await yazismalariOku(supabase, c)
  // The patient may answer only where a conversation is open AND the doctor has written in it.
  return { yazismalar, yazabilir: yazismalar.some((y) => !y.kapandi) }
}

/** The signed-in PATIENT answers in the conversation that is open. With none open nothing is written: a patient opens none. */
export async function hastaMesajYaz(supabase: SupabaseClient, o: PortalKimligi, ham: unknown, simdi = Date.now()): Promise<{ tamam: true; id: string } | Ret> {
  const hasta = await hastaGetir(supabase, o.doktorId, o.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const m = metniDenetle(ham)
  if (!m.tamam) return m
  const c = { doktorId: o.doktorId, hastaId: hasta.id }
  const y = await acikYazisma(supabase, c)
  if (!y) return { tamam: false, kod: 'KAPALI' }
  // "Open" for a patient means the doctor has written in it: an empty conversation is not an invitation.
  const { data: ilk } = await ulkeTablosu(supabase, MESAJLAR).select('id').eq('doctor_id', c.doktorId).eq('patient_id', c.hastaId).eq('yazisma_id', y.id).eq('gonderen', 'hekim').limit(1)
  if (!Array.isArray(ilk) || !ilk.length) return { tamam: false, kod: 'KAPALI' }
  if ((await gunlukAdet(supabase, c, 'hasta', simdi)) >= MESAJ_GUNLUK_AZAMI) return { tamam: false, kod: 'LIMIT' }
  const r = await mesajEkle(supabase, c, y.id, 'hasta', m.metin, simdi)
  return r.tamam ? { tamam: true, id: r.id } : r
}

/** The signed-in PATIENT has read what their doctor wrote, up to the newest message their page showed. */
export async function hastaOkudu(supabase: SupabaseClient, o: PortalKimligi, kadarHam: unknown, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const hasta = await hastaGetir(supabase, o.doktorId, o.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const kadar = kadarAl(kadarHam, simdi)
  if (!kadar) return { tamam: false, kod: 'GECERSIZ' }
  return (await okunduYap(supabase, { doktorId: o.doktorId, hastaId: hasta.id }, 'hekim', kadar, simdi)) ? { tamam: true } : { tamam: false, kod: 'BASARISIZ' }
}
