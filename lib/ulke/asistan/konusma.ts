/**
 * NOTYA-ULKE-ASISTAN-01 — THE ASSISTANT'S CONVERSATIONS (migration 143). Server only.
 *
 *   soruSor            a question is asked: the answer is streamed, and question and answer are kept together
 *   konusmaListesi     the history of ONE doctor, newest first (all of it, or the conversations about one patient)
 *   konusmaGetir       one conversation with its messages
 *   konusmaSil         the doctor deletes a conversation; its messages go with it
 *
 * WHO ANSWERS. The assistant of the account's ROLE, in the account's INTERFACE form. Its instruction is assembled
 * from the active pack's parts (./talimat.ts); the kit writes no sentence of it. A role without an assistant, or a
 * form the pack has no parts for, has no assistant: the question is refused, never answered by another role's.
 *
 * A CONVERSATION STAYS WHERE IT BEGAN. General, or about ONE patient — fixed when it starts (the database holds the
 * same rule in a trigger). It is continued only while the account still has the role it began with.
 *
 * THE PATIENT MODE (./hasta.ts). Only where the pack switches it on, only for a patient who is THIS doctor's, and
 * only with notes this doctor APPROVED. The patient's data is read again for every question, so a note approved a
 * minute ago is there and a patient who was removed is not. It is the second block of the instruction and is never
 * stored with the conversation.
 *
 * THE DAILY CEILING is the pack's (`gunlukSoruLimiti`), counted per account and per the ACCOUNT's own day through the
 * country's usage counter (../uygulama/kota.ts). A question is counted when it is sent to the model, answered or not.
 *
 * WHAT IS KEPT. Question and answer are written TOGETHER, after the answer: a question the model never answered is
 * not kept. Each text is ONE encrypted value (same helper as the rest of a patient's data) that also holds the
 * country, the doctor and the conversation it belongs to, so a value that is not its row's own is read as "cannot be
 * shown". An answer that broke off is kept as far as it got, marked. NO AUDIO is ever stored: a spoken question
 * arrives here as text.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * a conversation id or a patient id from a request is matched against the authenticated doctor in the same statement
 * that reads the row; another doctor's answers exactly like one that does not exist. Every statement is bound to
 * this build's country (../uygulama/tablolar.ts).
 *
 * NOTHING IS SENT TO A PATIENT and nothing is written to any other system from here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { asistanKimligi, rolAdi } from '../arayuz'
import type { DilKodu } from '../tipler'
import { aktifUlke, ozellikAcik } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { ASISTAN_KOVALARI, kotaKalan, kotaKullan } from '../uygulama/kota'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { modeldenAkis } from '../uygulama/notModeli'
import { hekimRolunuOku } from '../uygulama/rol'
import { ulkeTablosu } from '../uygulama/tablolar'
import { asistanHastaVerisi } from './hasta'
import { asistanHastaBlogu, asistanTalimati } from './talimat'
import type { AsistanIcerigi } from './tipler'

const KONUSMALAR = 'ulke_asistan_konusmalari'
const MESAJLAR = 'ulke_asistan_mesajlari'

/** How many of a conversation's latest messages travel with a new question. The rest stays on the screen only. */
export const GECMIS_MESAJ = 12
/** A conversation holds at most this many messages; after that the doctor starts a new one. */
export const KONUSMA_AZAMI_MESAJ = 200
/** The history shows at most this many conversations. */
export const KONUSMA_LISTE_AZAMI = 100
/** A conversation's title: the beginning of its first question. */
export const BASLIK_AZAMI = 80

/** The pack's assistant, or null where the country has none. */
export const aktifAsistan = (): AsistanIcerigi | null => (ozellikAcik('cekirdekMuayene') && ozellikAcik('ulkeAsistani') ? AKTIF_KLINIK?.asistan ?? null : null)

// ───────────────────────── the encrypted values ─────────────────────────

type Yazan = 'hekim' | 'asistan'
type BaslikZarfi = { v: 1; u: string; d: string; t: string }
type MesajZarfi = { v: 1; u: string; d: string; k: string; y: Yazan; m: string; kesik?: true }

const baslikSifrele = (doktorId: string, baslik: string): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), d: doktorId, t: baslik } satisfies BaslikZarfi))
const mesajSifrele = (doktorId: string, konusmaId: string, yazan: Yazan, metin: string, kesik: boolean): string =>
  encrypt(JSON.stringify({ v: 1, u: aktifUlke(), d: doktorId, k: konusmaId, y: yazan, m: metin, ...(kesik ? { kesik: true as const } : {}) } satisfies MesajZarfi))

/** A title — or null when the value is not THIS country's and doctor's own. */
function baslikCoz(ham: unknown, doktorId: string): string | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<BaslikZarfi> | null
    return z && z.v === 1 && z.u === aktifUlke() && z.d === doktorId && typeof z.t === 'string' ? z.t : null
  } catch { return null }
}
/** A message — or null when the value is not THIS country's, doctor's, conversation's and writer's own. */
function mesajCoz(ham: unknown, doktorId: string, konusmaId: string, yazan: string): { metin: string; kesik: boolean } | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<MesajZarfi> | null
    if (!z || z.v !== 1 || z.u !== aktifUlke() || z.d !== doktorId || z.k !== konusmaId || z.y !== yazan || typeof z.m !== 'string') return null
    return { metin: z.m, kesik: z.kesik === true }
  } catch { return null }
}

// ───────────────────────── who answers ─────────────────────────

/**
 * The assistant an account talks to NOW: its role, the form it reads in, and the instruction for the two. null = the
 * account has no role, or its role has no assistant in that form.
 */
async function hesabinAsistani(supabase: SupabaseClient, doktorId: string, icerik: AsistanIcerigi): Promise<{ rol: string; dil: DilKodu; talimat: string } | null> {
  const rol = await hekimRolunuOku(supabase, doktorId)
  if (!rol) return null
  const dil = (await hekimDilleri(supabase, doktorId)).arayuzDili
  const kimlik = asistanKimligi(rol, dil)
  const ad = rolAdi(rol, dil)
  const talimat = asistanTalimati(icerik, rol, dil, kimlik && ad ? { tamAd: kimlik.tamAd, rolAdi: ad } : null)
  return talimat ? { rol, dil, talimat } : null
}

// ───────────────────────── reading ─────────────────────────

type KonusmaSatiri = { id: string; patient_id: string | null; rol: string; baslik_encrypted: string | null; created_at: string; updated_at: string }
type MesajSatiri = { id: string; konusma_id: string; yazan: string; metin_encrypted: string | null; created_at: string }
const KONUSMA_KOLONLARI = 'id, patient_id, rol, baslik_encrypted, created_at, updated_at'
const MESAJ_KOLONLARI = 'id, konusma_id, yazan, metin_encrypted, created_at'

export type KonusmaOzeti = { id: string; /** null = cannot be shown. */ baslik: string | null; hastaId: string | null; hastaAdi: string | null; rol: string; guncellendi: string }
export type KonusmaMesaji = { id: string; yazan: Yazan; /** null = cannot be shown. */ metin: string | null; kesik: boolean; olusturuldu: string }
export type KonusmaDetayi = KonusmaOzeti & { mesajlar: KonusmaMesaji[]; /** true = the account still has the role the conversation began with: it can be continued. */ surdurulebilir: boolean }

/** ONE conversation of THIS doctor, or null — for a foreign id exactly as for one that does not exist. */
async function konusmaSatiri(supabase: SupabaseClient, doktorId: string, konusmaId: string): Promise<KonusmaSatiri | null> {
  const { data, error } = await ulkeTablosu(supabase, KONUSMALAR).select(KONUSMA_KOLONLARI).eq('id', konusmaId).eq('doctor_id', doktorId).maybeSingle()
  return error || !data ? null : (data as unknown as KonusmaSatiri)
}

/** The messages of one conversation of THIS doctor, in the order they were written. */
async function mesajSatirlari(supabase: SupabaseClient, doktorId: string, konusmaId: string): Promise<MesajSatiri[]> {
  const { data, error } = await ulkeTablosu(supabase, MESAJLAR).select(MESAJ_KOLONLARI).eq('doctor_id', doktorId).eq('konusma_id', konusmaId).order('created_at', { ascending: true }).limit(KONUSMA_AZAMI_MESAJ + 2)
  return error || !data ? [] : (data as unknown as MesajSatiri[])
}

/**
 * THE HISTORY of THIS doctor, newest first. With `hastaId`: only the conversations about that patient, and null when
 * the patient is not this doctor's. A conversation about a patient who is no longer this doctor's is not listed.
 */
export async function konusmaListesi(supabase: SupabaseClient, doktorId: string, hastaId?: string | null): Promise<KonusmaOzeti[] | null> {
  let hasta: string | null = null
  if (hastaId) {
    // ISOLATION: the patient must be this doctor's before a single conversation is looked up with the id.
    const h = await hastaGetir(supabase, doktorId, hastaId)
    if (!h) return null
    hasta = h.id
  }
  const sorgu = ulkeTablosu(supabase, KONUSMALAR).select(KONUSMA_KOLONLARI).eq('doctor_id', doktorId)
  const { data, error } = await (hasta ? sorgu.eq('patient_id', hasta) : sorgu).order('updated_at', { ascending: false }).limit(KONUSMA_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = data as unknown as KonusmaSatiri[]
  // Names are read by doctor_id AND patient id: an id that is not this doctor's has no name, and its row is dropped.
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id ?? '').filter(Boolean))
  return satirlar
    .filter((s) => !s.patient_id || adlar.has(s.patient_id))
    .map((s) => ({ id: s.id, baslik: baslikCoz(s.baslik_encrypted, doktorId), hastaId: s.patient_id, hastaAdi: s.patient_id ? adlar.get(s.patient_id) ?? '' : null, rol: s.rol, guncellendi: s.updated_at }))
}

/** One conversation of THIS doctor with its messages, or null. */
export async function konusmaGetir(supabase: SupabaseClient, doktorId: string, konusmaId: string): Promise<KonusmaDetayi | null> {
  const k = await konusmaSatiri(supabase, doktorId, konusmaId)
  if (!k) return null
  let hastaAdi: string | null = null
  if (k.patient_id) {
    const adlar = await hastaAdlari(supabase, doktorId, [k.patient_id])
    if (!adlar.has(k.patient_id)) return null
    hastaAdi = adlar.get(k.patient_id) ?? ''
  }
  const mesajlar = (await mesajSatirlari(supabase, doktorId, k.id)).filter((m): m is MesajSatiri & { yazan: Yazan } => m.yazan === 'hekim' || m.yazan === 'asistan').map((m) => {
    const z = mesajCoz(m.metin_encrypted, doktorId, k.id, m.yazan)
    return { id: m.id, yazan: m.yazan, metin: z?.metin ?? null, kesik: z?.kesik ?? false, olusturuldu: m.created_at }
  })
  return { id: k.id, baslik: baslikCoz(k.baslik_encrypted, doktorId), hastaId: k.patient_id, hastaAdi, rol: k.rol, guncellendi: k.updated_at, mesajlar, surdurulebilir: (await hekimRolunuOku(supabase, doktorId)) === k.rol }
}

/** The doctor deletes ONE conversation of THEIR OWN, with its messages. false = no such conversation for this doctor. */
export async function konusmaSil(supabase: SupabaseClient, doktorId: string, konusmaId: string): Promise<boolean | null> {
  const k = await konusmaSatiri(supabase, doktorId, konusmaId)
  if (!k) return false
  // The database removes the messages with the conversation (on delete cascade); they are removed here as well, so
  // that nothing depends on it. Both statements carry the doctor's id.
  const { error: mesajHatasi } = await ulkeTablosu(supabase, MESAJLAR).delete().eq('doctor_id', doktorId).eq('konusma_id', k.id)
  if (mesajHatasi) return null
  const { error } = await ulkeTablosu(supabase, KONUSMALAR).delete().eq('id', k.id).eq('doctor_id', doktorId)
  return error ? null : true
}

/** What the screen is told before a question is typed: whether this account has an assistant, and what is left of today. */
export async function asistanDurumu(supabase: SupabaseClient, doktorId: string, icerik: AsistanIcerigi): Promise<{ asistanVar: boolean; limit: number; kalan: number | null; soruAzami: number; hastaModu: boolean }> {
  return {
    asistanVar: Boolean(await hesabinAsistani(supabase, doktorId, icerik)),
    limit: icerik.gunlukSoruLimiti,
    kalan: await kotaKalan(supabase, doktorId, ASISTAN_KOVALARI.soru, icerik.gunlukSoruLimiti),
    soruAzami: icerik.soruAzamiKarakter,
    hastaModu: icerik.hastaModu.acik === true,
  }
}

// ───────────────────────── asking ─────────────────────────

export type SoruRetKodu = 'NOT_FOUND' | 'BOS' | 'UZUN' | 'ASISTAN_YOK' | 'ROL_DEGISTI' | 'KONUSMA_DOLU' | 'LIMIT' | 'CEVAP_YOK' | 'BASARISIZ'
export type SoruSonucu =
  | {
      tamam: true
      /** null = the answer was given and shown, but it could not be kept. */
      konusmaId: string | null
      yeniKonusma: boolean
      /** The answer stops short. */
      kesildi: boolean
      kaydedildi: boolean
    }
  | { tamam: false; kod: SoruRetKodu }
export type SoruGirdisi = { konusmaId?: string | null; hastaId?: string | null; soru: unknown }

const ret = (kod: SoruRetKodu): SoruSonucu => ({ tamam: false, kod })

/**
 * ONE QUESTION. `parca` receives the answer piece by piece while it is written. Everything that can refuse the
 * question is decided BEFORE the model is called, so a refusal never follows a word that was already shown.
 * `icerik` is the pack's assistant (the route passes `aktifAsistan()`); a test passes content of no country.
 */
export async function soruSor(supabase: SupabaseClient, doktorId: string, g: SoruGirdisi, parca: (metin: string) => void, icerik: AsistanIcerigi, secenek: { butceMs?: number; simdi?: number } = {}): Promise<SoruSonucu> {
  const soru = typeof g.soru === 'string' ? g.soru.trim() : ''
  if (!soru) return ret('BOS')
  if (soru.length > icerik.soruAzamiKarakter) return ret('UZUN')

  // ISOLATION, first: the conversation and the patient named by the request must be this doctor's.
  let konusma: KonusmaSatiri | null = null
  let hastaId: string | null = null
  if (g.konusmaId) {
    konusma = await konusmaSatiri(supabase, doktorId, g.konusmaId)
    if (!konusma) return ret('NOT_FOUND')
    // A conversation stays about whom it began with: a request that names another patient is not this conversation's.
    if (g.hastaId && g.hastaId !== konusma.patient_id) return ret('NOT_FOUND')
    hastaId = konusma.patient_id
  } else if (g.hastaId) hastaId = g.hastaId
  const hasta = hastaId ? (icerik.hastaModu.acik === true ? await hastaGetir(supabase, doktorId, hastaId) : null) : null
  if (hastaId && !hasta) return ret('NOT_FOUND')

  const kim = await hesabinAsistani(supabase, doktorId, icerik)
  if (!kim) return ret('ASISTAN_YOK')
  if (konusma && konusma.rol !== kim.rol) return ret('ROL_DEGISTI')

  const onceki = konusma ? await mesajSatirlari(supabase, doktorId, konusma.id) : []
  if (onceki.length + 2 > KONUSMA_AZAMI_MESAJ) return ret('KONUSMA_DOLU')

  // THE PATIENT'S DATA: read now, for this question, by this doctor's id. Age, sex and approved notes; nothing else.
  const hastaMetni = hasta ? icerik.hastaGirdisi(kim.dil, await asistanHastaVerisi(supabase, doktorId, hasta, icerik.hastaModu, secenek.simdi)) : null
  const ikinciBlok = asistanHastaBlogu(icerik, kim.rol, kim.dil, hastaMetni)
  if (!ikinciBlok) return ret('ASISTAN_YOK')

  if (!(await kotaKullan(supabase, doktorId, ASISTAN_KOVALARI.soru, icerik.gunlukSoruLimiti))) return ret('LIMIT')

  // What travels with the question: the latest messages that can be read, as whole question-and-answer pairs.
  const gecmis: { yazan: Yazan; metin: string }[] = []
  for (let i = 0; i + 1 < onceki.length; i += 2) {
    const s = onceki[i], c = onceki[i + 1]
    const sz = s.yazan === 'hekim' ? mesajCoz(s.metin_encrypted, doktorId, konusma!.id, 'hekim') : null
    const cz = c.yazan === 'asistan' ? mesajCoz(c.metin_encrypted, doktorId, konusma!.id, 'asistan') : null
    if (sz && cz) gecmis.push({ yazan: 'hekim', metin: sz.metin }, { yazan: 'asistan', metin: cz.metin })
  }
  const cevap = await modeldenAkis(
    { talimat: kim.talimat, ikinciBlok, ...(hastaMetni ? { guvenlikBaglami: hastaMetni } : {}), mesajlar: [...gecmis.slice(-GECMIS_MESAJ), { yazan: 'hekim', metin: soru }], doktorId, butceMs: secenek.butceMs, olcum: { supabase, gorev: 'asistan' } },
    parca,
  )
  if (!cevap) return ret('CEVAP_YOK')

  // KEEPING. The answer has been shown; whatever fails from here on is reported as "not kept", never as "no answer".
  // Never earlier than the conversation's last message: two questions in the same instant still read back in order.
  const sonAn = onceki.length ? new Date(onceki[onceki.length - 1].created_at).getTime() : Number.NaN
  const an = Math.max(secenek.simdi ?? Date.now(), Number.isFinite(sonAn) ? sonAn + 1 : 0)
  const simdi = new Date(an).toISOString()
  try {
    let konusmaId = konusma?.id ?? null
    if (!konusmaId) {
      const { data, error } = await ulkeTablosu(supabase, KONUSMALAR).insert({ doctor_id: doktorId, patient_id: hasta?.id ?? null, rol: kim.rol, baslik_encrypted: baslikSifrele(doktorId, soru.replace(/\s+/g, ' ').slice(0, BASLIK_AZAMI)), created_at: simdi, updated_at: simdi }).select('id').single()
      konusmaId = error ? null : (data as { id?: string } | null)?.id ?? null
      if (!konusmaId) return { tamam: true, konusmaId: null, yeniKonusma: true, kesildi: cevap.kesildi, kaydedildi: false }
    }
    const satir = (yazan: Yazan, metin: string, kesik: boolean, ani: number) => ({ doctor_id: doktorId, konusma_id: konusmaId, yazan, metin_encrypted: mesajSifrele(doktorId, konusmaId!, yazan, metin, kesik), created_at: new Date(ani).toISOString() })
    const { error: soruHatasi } = await ulkeTablosu(supabase, MESAJLAR).insert(satir('hekim', soru, false, an))
    // The answer is one millisecond later than its question, so the two never change places when they are read back.
    const { error: cevapHatasi } = soruHatasi ? { error: soruHatasi } : await ulkeTablosu(supabase, MESAJLAR).insert(satir('asistan', cevap.metin, cevap.kesildi, an + 1))
    if (soruHatasi || cevapHatasi) {
      // Never half a pair: a question without its answer is taken out again, and a conversation that was begun for it too.
      try {
        if (!soruHatasi) await ulkeTablosu(supabase, MESAJLAR).delete().eq('doctor_id', doktorId).eq('konusma_id', konusmaId).gte('created_at', new Date(an).toISOString())
        if (!konusma) await ulkeTablosu(supabase, KONUSMALAR).delete().eq('id', konusmaId).eq('doctor_id', doktorId)
      } catch { /* reported as "not kept" either way */ }
      return { tamam: true, konusmaId: konusma?.id ?? null, yeniKonusma: !konusma, kesildi: cevap.kesildi, kaydedildi: false }
    }
    if (konusma) await ulkeTablosu(supabase, KONUSMALAR).update({ updated_at: simdi }).eq('id', konusmaId).eq('doctor_id', doktorId)
    return { tamam: true, konusmaId, yeniKonusma: !konusma, kesildi: cevap.kesildi, kaydedildi: true }
  } catch {
    return { tamam: true, konusmaId: konusma?.id ?? null, yeniKonusma: !konusma, kesildi: cevap.kesildi, kaydedildi: false }
  }
}
