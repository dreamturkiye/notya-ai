/**
 * NOTYA-ULKE-MESAJ-01 — CONSULTATION BETWEEN DOCTORS OF THE SAME COUNTRY DATABASE (migration 142). Server only.
 *
 * WHAT HAPPENS. A doctor asks another account of the same country for an opinion on ONE patient: a written question
 * and — if the doctor chooses — a READ-ONLY COPY of one approved note of that patient, or of that note's summary
 * for the patient. The colleague answers, once. The asking doctor closes it.
 *
 * WHAT THE CONSULTED DOCTOR SEES: THE COPY IN THE CONSULTATION'S OWN ROW, AND NOTHING ELSE. No function here reads
 * a patient's table for the consulted doctor; what they are answered holds no patient id and no patient name; the
 * copy is taken once, when the consultation is asked, and never follows the file afterwards. They see it ONLY WHILE
 * IT IS OPEN — and never later than the pack's period — PLUS THE PACK'S PERIOD AFTER CLOSING. After that the row
 * answers them exactly like one that does not exist.
 *
 * FINDING A COLLEAGUE: BY THE COLLEAGUE'S CONSULTATION CODE, typed exactly. There is NO DIRECTORY: nothing here
 * lists accounts or codes, searches by name, or answers with anybody the caller did not name by an exact code.
 * (Finding by e-mail is not built: the account table of a country database holds no e-mail address.)
 *
 * CONSENT. The asking doctor ticks the pack's sentence that the patient agreed to the sharing; without the tick
 * nothing is written. The stamp of the wording that was ticked (`konsultasyonRizasi.surum`) is stored with the row.
 *
 * THE ROW IS THE RECORD: who asked whom about which patient, what was shared from which note, on which consent
 * wording, when; when it was first read, answered and closed. Nothing of it can be changed afterwards (the database
 * holds that by trigger), and nothing here deletes a row.
 *
 * NO MODEL, NOTHING SENT. Nothing here calls a model, and nothing tells the colleague: the asking doctor does.
 *
 * HEALTH DATA. The question, the copy and the answer are encrypted values (lib/security/encryption.ts), each bound
 * to its own row, its part, the asking doctor and the consulted one.
 *
 * ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation. Every
 * statement on a consultation carries the country AND the signed-in account — as the asking doctor (`doctor_id`) or
 * as the consulted one (`danisilan_id`), whichever the action belongs to. A third doctor matches neither.
 */
import { createHash, randomInt, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { rolAdi } from '../arayuz'
import { ozetGetir, hastaninOzetleri } from '../portal/ozet'
import { aktifUlke, ozellikAcik, ulkePaketi } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { notGetir } from '../uygulama/notlar'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import { CEVAP_AZAMI, KOD_ALFABESI, KOD_UZUNLUGU, koduDuzelt, KONSULTASYON_GUNLUK_AZAMI, KONSULTASYON_LISTE_AZAMI, konsultasyonMetniAl, paylasimTuruMu, SORU_AZAMI, type GelenKonsultasyon, type GidenKonsultasyon, type Meslektas, type PaylasilabilirNot, type PaylasilanKopya, type PaylasimTuru } from './sabitler'

const TABLO = 'ulke_konsultasyonlar'
const KODLAR = 'ulke_konsultasyon_kodlari'
const GUN_MS = 86_400_000
const KOLONLAR = 'id, doctor_id, patient_id, danisilan_id, paylasim_turu, note_id, soru_encrypted, paylasim_encrypted, riza_surumu, okundu_at, cevap_encrypted, cevap_at, kapandi_at, son_gecerlilik, erisim_bitis, created_at'
type Satir = { id: string; doctor_id: string; patient_id: string; danisilan_id: string; paylasim_turu: string; note_id: string | null; soru_encrypted: string | null; paylasim_encrypted: string | null; riza_surumu: string; okundu_at: string | null; cevap_encrypted: string | null; cevap_at: string | null; kapandi_at: string | null; son_gecerlilik: string; erisim_bitis: string | null; created_at: string }

/** The pack's two periods, or null: a pack that does not state them has no consultation. */
function sureler(): { acikGun: number; kapanisSonrasiGun: number } | null {
  const k = ulkePaketi().uygulama?.konsultasyon
  return k && Number.isInteger(k.acikGun) && k.acikGun >= 1 && Number.isInteger(k.kapanisSonrasiGun) && k.kapanisSonrasiGun >= 0 ? { acikGun: k.acikGun, kapanisSonrasiGun: k.kapanisSonrasiGun } : null
}
const rizaSurumu = (): string | null => { const s = AKTIF_KLINIK?.konsultasyonRizasi?.surum; return typeof s === 'string' && s.trim() ? s.trim() : null }

/** true = consultation between doctors exists in this country: the feature, both periods and the consent's stamp. */
export const konsultasyonAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('konsultasyon') && sureler() !== null && rizaSurumu() !== null

export type KonsultasyonRetKodu = 'NOT_FOUND' | 'RIZA_GEREKLI' | 'SORU_GEREKLI' | 'CEVAP_GEREKLI' | 'UZUN' | 'MESLEKTAS_YOK' | 'PAYLASIM' | 'NOT_UYGUN' | 'OZET_YOK' | 'LIMIT' | 'DURUM' | 'BASARISIZ'
export const KONSULTASYON_DURUMU: Record<KonsultasyonRetKodu, number> = { NOT_FOUND: 404, RIZA_GEREKLI: 400, SORU_GEREKLI: 400, CEVAP_GEREKLI: 400, UZUN: 400, MESLEKTAS_YOK: 404, PAYLASIM: 400, NOT_UYGUN: 409, OZET_YOK: 409, LIMIT: 429, DURUM: 409, BASARISIZ: 500 }
type Ret = { tamam: false; kod: KonsultasyonRetKodu }

// ───────────────────────── encrypted values: each bound to its row and its part ─────────────────────────

type Parca = 'soru' | 'kopya' | 'cevap' | 'kod'
type Zarf = { v: 1; u: string; k: string; t: Parca; d: string; x: string; m: unknown }
/** `k` the row's id, `t` which part, `d` the asking doctor, `x` the consulted one. */
const sifrele = (z: Omit<Zarf, 'v' | 'u'>): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), ...z } satisfies Zarf))
function coz(ham: unknown, k: string, t: Parca, d: string, x: string): unknown {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf> | null
    return z && z.v === 1 && z.u === aktifUlke() && z.k === k && z.t === t && z.d === d && z.x === x ? z.m ?? null : null
  } catch { return null }
}
const metinCoz = (ham: unknown, s: Satir, t: 'soru' | 'cevap'): string | null => { const m = coz(ham, s.id, t, s.doctor_id, s.danisilan_id); return typeof m === 'string' ? m : null }
function kopyaCoz(s: Satir): PaylasilanKopya | null {
  const m = coz(s.paylasim_encrypted, s.id, 'kopya', s.doctor_id, s.danisilan_id) as Partial<PaylasilanKopya> | null
  if (!m || typeof m !== 'object' || typeof m.muayeneGunu !== 'string' || typeof m.dil !== 'string') return null
  if (m.tur === 'ozet' && s.paylasim_turu === 'ozet' && typeof m.metin === 'string') return { tur: 'ozet', muayeneGunu: m.muayeneGunu, dil: m.dil, metin: m.metin }
  if (m.tur === 'not' && s.paylasim_turu === 'not' && typeof m.sablon === 'string' && [m.s, m.o, m.a, m.p].every((b) => typeof b === 'string')) {
    const alanlar = m.alanlar && typeof m.alanlar === 'object' ? Object.fromEntries(Object.entries(m.alanlar).filter(([, v]) => typeof v === 'string')) : {}
    return { tur: 'not', muayeneGunu: m.muayeneGunu, dil: m.dil, sablon: m.sablon, s: m.s as string, o: m.o as string, a: m.a as string, p: m.p as string, alanlar }
  }
  return null
}

// ───────────────────────── the consultation code ─────────────────────────

const kodHash = (kod: string): string => createHash('sha256').update(`${aktifUlke()}:${kod}`).digest('hex')
const yeniKod = (): string => Array.from({ length: KOD_UZUNLUGU }, () => KOD_ALFABESI[randomInt(KOD_ALFABESI.length)]).join('')

/** THIS account's own code, or null where it has none (nobody can then ask it for a consultation). */
export async function kodumuOku(supabase: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data } = await ulkeTablosu(supabase, KODLAR).select('id, kod_hash, kod_encrypted').eq('doctor_id', doktorId).maybeSingle()
  const s = data as unknown as { id: string; kod_hash: string; kod_encrypted: string } | null
  if (!s) return null
  const kod = coz(s.kod_encrypted, doktorId, 'kod', doktorId, doktorId)
  // A value that is not this account's own, or does not belong to the stored hash, is no code.
  return typeof kod === 'string' && koduDuzelt(kod) === kod && kodHash(kod) === s.kod_hash ? kod : null
}

/** Gives THIS account a code — a new one replaces the old, which finds nobody from then on. */
export async function kodUret(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<{ tamam: true; kod: string } | Ret> {
  const an = new Date(simdi).toISOString()
  // Two tries: a code that another account already has (a collision in 31^10) is not handed out twice.
  for (let deneme = 0; deneme < 2; deneme++) {
    const kod = yeniKod()
    const deger = { kod_hash: kodHash(kod), kod_encrypted: sifrele({ k: doktorId, t: 'kod', d: doktorId, x: doktorId, m: kod }), updated_at: an }
    const { data: var_ } = await ulkeTablosu(supabase, KODLAR).select('id').eq('doctor_id', doktorId).maybeSingle()
    const { error } = var_
      ? await ulkeTablosu(supabase, KODLAR).update(deger).eq('doctor_id', doktorId)
      : await ulkeTablosu(supabase, KODLAR).insert({ doctor_id: doktorId, ...deger, created_at: an })
    if (!error) return { tamam: true, kod }
  }
  return { tamam: false, kod: 'BASARISIZ' }
}

/**
 * The account a code belongs to — by an EXACT match of the code, in this country, and never the caller's own.
 * null for anything else: a malformed code, a code nobody has, an old code, the caller's own code.
 */
async function koddanHesap(supabase: SupabaseClient, doktorId: string, kodHam: unknown): Promise<string | null> {
  const kod = koduDuzelt(kodHam)
  if (!kod) return null
  const { data } = await ulkeTablosu(supabase, KODLAR).select('doctor_id').eq('kod_hash', kodHash(kod)).maybeSingle()
  const id = (data as unknown as { doctor_id?: string } | null)?.doctor_id
  return typeof id === 'string' && id !== doktorId ? id : null
}

/** Names and roles of accounts THE CALLER ALREADY NAMED (by a code, or by a consultation of their own): never a list to browse. */
async function hesaplar(supabase: SupabaseClient, idler: readonly string[], dil: string): Promise<Map<string, Meslektas>> {
  const cikti = new Map<string, Meslektas>()
  const tek = [...new Set(idler)]
  if (!tek.length) return cikti
  const { data } = await ulkeTablosu(supabase, 'ulke_hesaplari').select('id, full_name').in('id', tek)
  for (const h of (data as unknown as { id: string; full_name: string | null }[] | null) ?? []) {
    const rol = await hekimRolunuOku(supabase, h.id)
    cikti.set(h.id, { ad: String(h.full_name ?? ''), rol: (rol ? rolAdi(rol, dil) : null) ?? '' })
  }
  return cikti
}

/** The colleague a code names, as the asking doctor is shown them before anything is shared. null = nobody. */
export async function meslektasBul(supabase: SupabaseClient, doktorId: string, kodHam: unknown): Promise<Meslektas | null> {
  const id = await koddanHesap(supabase, doktorId, kodHam)
  if (!id) return null
  return (await hesaplar(supabase, [id], (await hekimDilleri(supabase, doktorId)).arayuzDili)).get(id) ?? null
}

// ───────────────────────── asking ─────────────────────────

/** The approved notes of one of THIS doctor's patients that can be shared, newest visit first. null = not this doctor's patient. */
export async function paylasilabilirNotlar(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<PaylasilabilirNot[] | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data: m } = await ulkeTablosu(supabase, 'ulke_muayeneler').select('id, started_at').eq('doctor_id', doktorId).eq('patient_id', hasta.id)
  const muayeneler = (m as unknown as { id: string; started_at: string | null }[] | null) ?? []
  if (!muayeneler.length) return []
  // Ids and dates only: no note's text is read to build the list.
  const { data: n } = await ulkeTablosu(supabase, 'ulke_notlar').select('id, session_id, approved_at').eq('doctor_id', doktorId).in('session_id', muayeneler.map((x) => x.id))
  const ozetler = await hastaninOzetleri(supabase, doktorId, hasta.id)
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const gun = new Map(muayeneler.map((x) => [x.id, x.started_at ? yerelAn(x.started_at, dilim).gun : '']))
  return ((n as unknown as { id: string; session_id: string; approved_at: string | null }[] | null) ?? [])
    .filter((x) => x.approved_at && gun.get(x.session_id))
    .map((x) => ({ notId: x.id, gun: gun.get(x.session_id) as string, ozetVar: ozetler.has(x.id) }))
    .sort((a, b) => (a.gun < b.gun ? 1 : a.gun > b.gun ? -1 : 0))
}

export type IstekGirdisi = { hastaId: string; kod: unknown; soru: unknown; paylasimTuru: unknown; notId: unknown; riza: unknown }

/**
 * The doctor asks a colleague for an opinion on one of THEIR OWN patients. Nothing is written unless everything
 * holds: the patient is the doctor's, the consent sentence is ticked, the code names a colleague, and — where
 * something is shared — the note is this doctor's, APPROVED, and about THIS patient.
 */
export async function konsultasyonIste(supabase: SupabaseClient, doktorId: string, g: IstekGirdisi, simdi = Date.now()): Promise<{ tamam: true; id: string } | Ret> {
  const sure = sureler(), riza = rizaSurumu()
  if (!sure || !riza) return { tamam: false, kod: 'NOT_FOUND' }
  // ISOLATION: the patient must be this doctor's before anything else is looked at.
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  if (g.riza !== true) return { tamam: false, kod: 'RIZA_GEREKLI' }
  const soru = konsultasyonMetniAl(g.soru)
  if (!soru) return { tamam: false, kod: 'SORU_GEREKLI' }
  if (soru.length > SORU_AZAMI) return { tamam: false, kod: 'UZUN' }
  if (!paylasimTuruMu(g.paylasimTuru)) return { tamam: false, kod: 'PAYLASIM' }
  const tur: PaylasimTuru = g.paylasimTuru
  const danisilan = await koddanHesap(supabase, doktorId, g.kod)
  if (!danisilan) return { tamam: false, kod: 'MESLEKTAS_YOK' }

  // THE COPY, taken now: one approved note of THIS patient, or that note's summary — and nothing else of the file.
  let kopya: PaylasilanKopya | null = null
  let notId: string | null = null
  if (tur !== 'yok') {
    if (typeof g.notId !== 'string' || !g.notId) return { tamam: false, kod: 'PAYLASIM' }
    // Note id + doctor in one query; its visit and that visit's patient are read with the doctor's id again.
    const not = await notGetir(supabase, doktorId, g.notId)
    if (!not || !not.onayli || not.muayene.hasta?.id !== hasta.id) return { tamam: false, kod: 'NOT_UYGUN' }
    notId = not.notId
    const muayeneGunu = yerelAn(not.muayene.baslangic, await hesapSaatDilimi(supabase, doktorId)).gun
    if (tur === 'not') {
      kopya = { tur: 'not', muayeneGunu, dil: not.dil, sablon: not.muayene.sablon, s: not.icerik.s, o: not.icerik.o, a: not.icerik.a, p: not.icerik.p, alanlar: { ...(not.icerik.alanlar ?? {}) } }
    } else {
      const o = await ozetGetir(supabase, doktorId, not.notId)
      if (!o?.ozet || !o.ozet.metin.trim()) return { tamam: false, kod: 'OZET_YOK' }
      kopya = { tur: 'ozet', muayeneGunu, dil: o.ozet.dil, metin: o.ozet.metin }
    }
  }

  const { data: bugun } = await ulkeTablosu(supabase, TABLO).select('id').eq('doctor_id', doktorId).gt('created_at', new Date(simdi - GUN_MS).toISOString()).limit(KONSULTASYON_GUNLUK_AZAMI + 1)
  if (Array.isArray(bugun) && bugun.length >= KONSULTASYON_GUNLUK_AZAMI) return { tamam: false, kod: 'LIMIT' }

  // The id is made here so that it can be written INTO every encrypted value: each then belongs to this row only.
  const id = randomUUID()
  const an = new Date(simdi).toISOString()
  const { error } = await ulkeTablosu(supabase, TABLO).insert({
    id, doctor_id: doktorId, patient_id: hasta.id, danisilan_id: danisilan, paylasim_turu: tur, note_id: notId,
    soru_encrypted: sifrele({ k: id, t: 'soru', d: doktorId, x: danisilan, m: soru }),
    paylasim_encrypted: kopya ? sifrele({ k: id, t: 'kopya', d: doktorId, x: danisilan, m: kopya }) : null,
    riza_surumu: riza, riza_at: an, okundu_at: null, cevap_encrypted: null, cevap_at: null, kapandi_at: null,
    son_gecerlilik: new Date(simdi + sure.acikGun * GUN_MS).toISOString(), erisim_bitis: null, created_at: an, updated_at: an,
  })
  if (error) return { tamam: false, kod: (error as { code?: string }).code === '23514' ? 'NOT_UYGUN' : 'BASARISIZ' }
  return { tamam: true, id }
}

// ───────────────────────── the asking doctor's side ─────────────────────────

/**
 * The consultations THIS doctor asked, newest first — all of them, or those about one of their patients.
 * null = `hastaId` was given and is not this doctor's patient.
 */
export async function gidenKonsultasyonlar(supabase: SupabaseClient, doktorId: string, hastaId?: string, simdi = Date.now()): Promise<GidenKonsultasyon[] | null> {
  let sorgu = ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId)
  if (hastaId !== undefined) {
    const hasta = await hastaGetir(supabase, doktorId, hastaId)
    if (!hasta) return null
    sorgu = sorgu.eq('patient_id', hasta.id)
  }
  const { data, error } = await sorgu.order('created_at', { ascending: false }).limit(KONSULTASYON_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = data as unknown as Satir[]
  // Names by doctor_id AND patient id: a row that points at a patient who is not this doctor's is not shown.
  const adlar = await hastaAdlari(supabase, doktorId, [...new Set(satirlar.map((s) => s.patient_id))])
  const kisiler = await hesaplar(supabase, satirlar.map((s) => s.danisilan_id), (await hekimDilleri(supabase, doktorId)).arayuzDili)
  return satirlar.filter((s) => adlar.has(s.patient_id) && paylasimTuruMu(s.paylasim_turu)).map((s) => ({
    id: s.id, hastaId: s.patient_id, hastaAdi: adlar.get(s.patient_id) ?? '', meslektas: kisiler.get(s.danisilan_id) ?? { ad: '', rol: '' },
    soru: metinCoz(s.soru_encrypted, s, 'soru') ?? '', paylasimTuru: s.paylasim_turu as PaylasimTuru, kopya: kopyaCoz(s), rizaSurumu: s.riza_surumu,
    olusturuldu: s.created_at, okundu: s.okundu_at ?? null, cevap: metinCoz(s.cevap_encrypted, s, 'cevap'), cevapAni: s.cevap_at ?? null,
    kapandi: s.kapandi_at ?? null, sonGecerlilik: s.son_gecerlilik, erisimBitis: s.erisim_bitis ?? null,
    suresiDoldu: !s.kapandi_at && !(new Date(s.son_gecerlilik).getTime() > simdi),
  }))
}

/**
 * The asking doctor closes one of THEIR OWN consultations. Once. From then on no answer; the colleague reads it for
 * the pack's period more. CLOSING NEVER GIVES BACK WHAT HAD ALREADY ENDED: a consultation that is closed after its
 * open period ran out stays unreadable for the colleague — the period after closing follows a consultation that was
 * still open, not one the colleague could no longer read.
 */
export async function konsultasyonKapat(supabase: SupabaseClient, doktorId: string, id: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const sure = sureler()
  if (!sure) return { tamam: false, kod: 'NOT_FOUND' }
  // ISOLATION: consultation id + the ASKING doctor in the same statement. The consulted doctor does not match.
  const { data: s, error } = await ulkeTablosu(supabase, TABLO).select('id, kapandi_at, son_gecerlilik').eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  const satir = s as unknown as { kapandi_at: string | null; son_gecerlilik: string } | null
  if (!satir) return { tamam: false, kod: 'NOT_FOUND' }
  if (satir.kapandi_at) return { tamam: false, kod: 'DURUM' }
  const an = new Date(simdi).toISOString()
  const { data, error: yazmaHatasi } = await ulkeTablosu(supabase, TABLO).update({ kapandi_at: an, erisim_bitis: new Date(satir.son_gecerlilik).getTime() > simdi ? new Date(simdi + sure.kapanisSonrasiGun * GUN_MS).toISOString() : an, updated_at: an }).eq('id', id).eq('doctor_id', doktorId).is('kapandi_at', null).select('id')
  if (yazmaHatasi) return { tamam: false, kod: 'BASARISIZ' }
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'DURUM' }
  return { tamam: true }
}

// ───────────────────────── the consulted doctor's side: the row's own copy, and nothing of the patient ─────────────────────────

/** Until when the consulted doctor may read a row: the open period's end, or — once closed — the end set at closing. */
const okunabilir = (s: Pick<Satir, 'kapandi_at' | 'son_gecerlilik' | 'erisim_bitis'>): string => (s.kapandi_at ? s.erisim_bitis ?? s.kapandi_at : s.son_gecerlilik)
const okunurMu = (s: Pick<Satir, 'kapandi_at' | 'son_gecerlilik' | 'erisim_bitis'>, simdi: number): boolean => new Date(okunabilir(s)).getTime() > simdi

/**
 * The consultations THIS doctor was asked and may still read, newest first. A row whose period is over is left out
 * BEFORE anything of it is decrypted. Nothing here reads a patient's table, and the answer names no patient.
 */
export async function gelenKonsultasyonlar(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<GelenKonsultasyon[]> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('danisilan_id', doktorId).order('created_at', { ascending: false }).limit(KONSULTASYON_LISTE_AZAMI)
  if (error || !data) return []
  const satirlar = (data as unknown as Satir[]).filter((s) => okunurMu(s, simdi) && paylasimTuruMu(s.paylasim_turu))
  const kisiler = await hesaplar(supabase, satirlar.map((s) => s.doctor_id), (await hekimDilleri(supabase, doktorId)).arayuzDili)
  return satirlar.map((s) => ({
    id: s.id, isteyen: kisiler.get(s.doctor_id) ?? { ad: '', rol: '' }, soru: metinCoz(s.soru_encrypted, s, 'soru') ?? '', paylasimTuru: s.paylasim_turu as PaylasimTuru, kopya: kopyaCoz(s),
    olusturuldu: s.created_at, okundu: s.okundu_at ?? null, cevap: metinCoz(s.cevap_encrypted, s, 'cevap'), cevapAni: s.cevap_at ?? null, kapandi: s.kapandi_at ?? null, okunabilir: okunabilir(s),
  }))
}

/** One row THIS doctor was asked and may still read, or null — for another doctor's, an expired one, and one that does not exist alike. */
async function gelenSatir(supabase: SupabaseClient, doktorId: string, id: string, simdi: number): Promise<Pick<Satir, 'id' | 'doctor_id' | 'danisilan_id' | 'okundu_at' | 'cevap_at' | 'kapandi_at' | 'son_gecerlilik' | 'erisim_bitis'> | null> {
  // ISOLATION: consultation id + the CONSULTED doctor in the same statement. The asking doctor does not match here.
  const { data } = await ulkeTablosu(supabase, TABLO).select('id, doctor_id, danisilan_id, okundu_at, cevap_at, kapandi_at, son_gecerlilik, erisim_bitis').eq('id', id).eq('danisilan_id', doktorId).maybeSingle()
  const s = data as unknown as Pick<Satir, 'id' | 'doctor_id' | 'danisilan_id' | 'okundu_at' | 'cevap_at' | 'kapandi_at' | 'son_gecerlilik' | 'erisim_bitis'> | null
  return s && okunurMu(s, simdi) ? s : null
}

/** The consulted doctor has opened it: the first reading is recorded, once. */
export async function konsultasyonOkundu(supabase: SupabaseClient, doktorId: string, id: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const s = await gelenSatir(supabase, doktorId, id, simdi)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.okundu_at) return { tamam: true }
  const { error } = await ulkeTablosu(supabase, TABLO).update({ okundu_at: new Date(simdi).toISOString() }).eq('id', id).eq('danisilan_id', doktorId).is('okundu_at', null)
  return error ? { tamam: false, kod: 'BASARISIZ' } : { tamam: true }
}

/** The consulted doctor answers — once, and only while the consultation is open and its period is not over. */
export async function konsultasyonCevapla(supabase: SupabaseClient, doktorId: string, id: string, ham: unknown, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const s = await gelenSatir(supabase, doktorId, id, simdi)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.kapandi_at || s.cevap_at) return { tamam: false, kod: 'DURUM' }
  const cevap = konsultasyonMetniAl(ham)
  if (!cevap) return { tamam: false, kod: 'CEVAP_GEREKLI' }
  if (cevap.length > CEVAP_AZAMI) return { tamam: false, kod: 'UZUN' }
  const an = new Date(simdi).toISOString()
  const { data, error } = await ulkeTablosu(supabase, TABLO).update({ cevap_encrypted: sifrele({ k: s.id, t: 'cevap', d: s.doctor_id, x: s.danisilan_id, m: cevap }), cevap_at: an, ...(s.okundu_at ? {} : { okundu_at: an }), updated_at: an }).eq('id', id).eq('danisilan_id', doktorId).is('cevap_at', null).is('kapandi_at', null).select('id')
  if (error) return { tamam: false, kod: (error as { code?: string }).code === '23514' ? 'DURUM' : 'BASARISIZ' }
  // Closed, or answered from another window, between the read and this write.
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'DURUM' }
  return { tamam: true }
}
