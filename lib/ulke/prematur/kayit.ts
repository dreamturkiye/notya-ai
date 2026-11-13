/**
 * PREMATUR-ULKE-01 — KEEPING THE PREMATURITY RECORDS of a country build (migration 200). Server only.
 *
 *   the baby's record       what the doctor entered about a preterm baby (gestation at birth, weight, days in intensive care,
 *                           the flags the follow-up rules read) and the doctor's own mark on each plan item
 *   the pregnancy record    the start of the pregnancy, the cervical measurements, the steroid courses, PPROM, magnesium,
 *                           progesterone — as the doctor entered them; no dose field exists
 *
 * NOTHING IS WORKED OUT HERE AND NOTHING IS SENT. The plan and the early-birth evaluation are pure functions the screen runs on
 * what these routes return; what is kept is the doctor's own entry. Every value is CLEANED here with the same functions the
 * screen uses (profilTemizle, erkenDogumTemizle), so a browser cannot keep an out-of-range value or a future date.
 *
 * HEALTH DATA. One value per row, encrypted with the same helper as the rest of a patient's data (lib/security/encryption.ts). The
 * country, the doctor and the patient are INSIDE the encrypted value as well as in the row's key: a value that is not this row's
 * own is read as "empty".
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation: a patient id
 * from a request is matched against the authenticated doctor (hastaGetir: id + doctor_id in one statement) BEFORE anything is
 * read or written with it; another doctor's patient answers exactly like one that does not exist. Every statement is bound to
 * this build's country (lib/ulke/uygulama/tablolar.ts) and carries the doctor's id. A cohort reads the doctor's own rows only.
 *
 * ROLE. A record opens only for an account whose role the pack names for it (`PrematurPaketi.roller`): the baby's plan for the
 * paediatric roles, the early-birth record for the obstetrics and gynaecology roles. Any other role: the same answer as "no such
 * thing".
 *
 * NEVER BREAKS A PAGE. When migration 200 is not on the database yet, a read answers with `depo: false` (an empty record) and a
 * write answers `DEPO_YOK`; nothing throws.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { arayuz } from '../arayuz'
import { aktifUlke } from '../ulke'
import { hastaGetir, hastaOzetleri } from '../uygulama/hastalar'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { gunGecerli, yerelAn } from '../uygulama/zaman'
import type { BebekKohortYuku, BebekYuku, GebelikGirdisi, GebelikKohortYuku, GebelikYuku, PrematurRetKodu } from './apiTipleri'
import { BOS_KAYIT } from './erkenDogum'
import { gebelikTemizle } from './gebelik'
import { KOHORT_AZAMI, type PrematurPaketi } from './paket'
import { HEKIM_DURUMLARI, OGE_KIMLIGI, OGE_NOT_AZAMI, profilTemizle, type HekimDurumu, type OgeKaydi, type PrematurProfil } from './tipler'

const BEBEK_TABLO = 'ulke_prematur_kayitlari'
const GEBELIK_TABLO = 'ulke_erken_dogum_kayitlari'
type Satir = { patient_id: string; kayit_encrypted: string | null }

/** The pack's prematurity block, or null where the pack states none (or the tools area is off). */
export const aktifPrematurPaketi = (): PrematurPaketi | null => arayuz().araclar?.prematur ?? null

// ───────────────────────── the stand-in for a missing table ─────────────────────────

/** true = the statement failed because the tables of migration 200 are not on this database (yet). */
export function tabloYokMu(hata: unknown): boolean {
  const h = hata as { code?: string; message?: string } | null
  if (!h) return false
  return h.code === '42P01' || h.code === 'PGRST205' || h.code === 'PGRST200' || /does not exist|schema cache|could not find the table/i.test(String(h.message ?? ''))
}

// ───────────────────────── the encrypted values ─────────────────────────

type Zarf<T> = { v: 1; u: string; d: string; h: string } & T
const sifrele = <T extends object>(doktorId: string, hastaId: string, icerik: T): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), d: doktorId, h: hastaId, ...icerik } satisfies Zarf<T>))
/** What a row's value holds, or null when it is not THIS country's, doctor's and patient's own value. */
function coz<T extends object>(ham: unknown, doktorId: string, hastaId: string): Partial<T> | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf<T>> | null
    if (!z || z.v !== 1 || z.u !== aktifUlke() || z.d !== doktorId || z.h !== hastaId) return null
    return z as Partial<T>
  } catch { return null }
}

// ───────────────────────── gate: role and patient ─────────────────────────

type Modul = 'bebek' | 'gebelik'
async function rolAcik(supabase: SupabaseClient, doktorId: string, modul: Modul): Promise<PrematurPaketi | null> {
  const p = aktifPrematurPaketi()
  if (!p) return null
  const rol = await hekimRolunuOku(supabase, doktorId)
  return rol && p.roller[modul].includes(rol) ? p : null
}
const bugunGunu = async (supabase: SupabaseClient, doktorId: string, simdi: number): Promise<string> => yerelAn(simdi, await hesapSaatDilimi(supabase, doktorId)).gun

// ───────────────────────── the baby ─────────────────────────

type BebekDegeri = { profil?: unknown; ogeler?: unknown }
const bos = (profil: PrematurProfil = {}) => ({ profil, durumlar: {} as Record<string, OgeKaydi> })

/** One mark, cleaned: the state, a real day not in the future, a short note. null = not a mark. */
export function ogeKaydiTemizle(ham: unknown, bugun: string): OgeKaydi | null {
  const r = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (!HEKIM_DURUMLARI.includes(r.durum as HekimDurumu)) return null
  const tarih = typeof r.tarih === 'string' && gunGecerli(r.tarih.slice(0, 10)) && r.tarih.slice(0, 10) <= bugun ? r.tarih.slice(0, 10) : null
  const not = typeof r.not === 'string' ? r.not.trim().slice(0, OGE_NOT_AZAMI) : ''
  return { durum: r.durum as HekimDurumu, ...(tarih ? { tarih } : {}), ...(not ? { not } : {}) }
}
function durumlariTemizle(ham: unknown, bugun: string): Record<string, OgeKaydi> {
  const out: Record<string, OgeKaydi> = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return out
  for (const [k, v] of Object.entries(ham as Record<string, unknown>).slice(0, 200)) {
    const kayit = OGE_KIMLIGI.test(k) ? ogeKaydiTemizle(v, bugun) : null
    if (kayit) out[k] = kayit
  }
  return out
}

async function bebekSatiri(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<{ satir: Satir | null; depo: boolean }> {
  const { data, error } = await ulkeTablosu(supabase, BEBEK_TABLO).select('patient_id, kayit_encrypted').eq('doctor_id', doktorId).eq('patient_id', hastaId).maybeSingle()
  if (error) return { satir: null, depo: !tabloYokMu(error) }
  return { satir: (data as unknown as Satir | null) ?? null, depo: true }
}

function bebekDegeri(satir: Satir | null, doktorId: string, hastaId: string, bugun: string) {
  const z = satir ? coz<BebekDegeri>(satir.kayit_encrypted, doktorId, hastaId) : null
  return z ? { profil: profilTemizle(z.profil), durumlar: durumlariTemizle(z.ogeler, bugun) } : bos()
}

/** The baby's record of one of THIS doctor's patients. null = not this doctor's patient, or not this role's record. */
export async function bebekOku(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<BebekYuku | null> {
  if (!(await rolAcik(supabase, doktorId, 'bebek'))) return null
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const bugun = await bugunGunu(supabase, doktorId, simdi)
  const { satir, depo } = await bebekSatiri(supabase, doktorId, hasta.id)
  return { hasta: { id: hasta.id, ad: [hasta.ad, hasta.otaIsmi].filter(Boolean).join(' '), dogumTarihi: hasta.dogumTarihi }, ...bebekDegeri(satir, doktorId, hasta.id, bugun), bugun, depo }
}

async function bebekYaz(supabase: SupabaseClient, doktorId: string, hastaId: string, deger: { profil: PrematurProfil; durumlar: Record<string, OgeKaydi> }, simdi: number): Promise<PrematurRetKodu | null> {
  const an = new Date(simdi).toISOString()
  const { error } = await ulkeTablosu(supabase, BEBEK_TABLO).upsert(
    { doctor_id: doktorId, patient_id: hastaId, kayit_encrypted: sifrele(doktorId, hastaId, { profil: deger.profil, ogeler: deger.durumlar }), updated_at: an },
    { onConflict: 'ulke,doctor_id,patient_id' },
  )
  return error ? (tabloYokMu(error) ? 'DEPO_YOK' : 'BASARISIZ') : null
}

/** The doctor enters (or corrects) the baby's history. The marks stay as they are. */
export async function bebekProfiliKaydet(supabase: SupabaseClient, doktorId: string, hastaId: string, hamProfil: unknown, simdi = Date.now()): Promise<{ tamam: true; yuk: BebekYuku } | { tamam: false; kod: PrematurRetKodu }> {
  const mevcut = await bebekOku(supabase, doktorId, hastaId, simdi)
  if (!mevcut) return { tamam: false, kod: 'NOT_FOUND' }
  if (!mevcut.depo) return { tamam: false, kod: 'DEPO_YOK' }
  const profil = profilTemizle(hamProfil)
  const kod = await bebekYaz(supabase, doktorId, mevcut.hasta.id, { profil, durumlar: mevcut.durumlar }, simdi)
  return kod ? { tamam: false, kod } : { tamam: true, yuk: { ...mevcut, profil } }
}

/** The doctor's mark on one plan item (`durum` null = take the mark off). `izinli` = the item ids the pack's table can produce. */
export async function bebekOgeIsaretle(supabase: SupabaseClient, doktorId: string, g: { hastaId: string; ogeId: unknown; durum: unknown; tarih?: unknown; not?: unknown }, izinli: ReadonlySet<string>, simdi = Date.now()): Promise<{ tamam: true; yuk: BebekYuku } | { tamam: false; kod: PrematurRetKodu }> {
  const mevcut = await bebekOku(supabase, doktorId, g.hastaId, simdi)
  if (!mevcut) return { tamam: false, kod: 'NOT_FOUND' }
  if (!mevcut.depo) return { tamam: false, kod: 'DEPO_YOK' }
  // THE ID MUST BE AN ITEM OF THE PACK'S OWN TABLE: nothing else is ever kept.
  if (typeof g.ogeId !== 'string' || !OGE_KIMLIGI.test(g.ogeId) || !izinli.has(g.ogeId)) return { tamam: false, kod: 'GECERSIZ' }
  const durumlar = { ...mevcut.durumlar }
  if (g.durum === null) delete durumlar[g.ogeId]
  else {
    const k = ogeKaydiTemizle({ durum: g.durum, tarih: g.tarih, not: g.not }, mevcut.bugun)
    if (!k) return { tamam: false, kod: 'GECERSIZ' }
    // A "done" day cannot be before the baby was born.
    if (k.tarih && mevcut.hasta.dogumTarihi && k.tarih < mevcut.hasta.dogumTarihi) return { tamam: false, kod: 'GECERSIZ' }
    durumlar[g.ogeId] = k
  }
  const kod = await bebekYaz(supabase, doktorId, mevcut.hasta.id, { profil: mevcut.profil, durumlar }, simdi)
  return kod ? { tamam: false, kod } : { tamam: true, yuk: { ...mevcut, durumlar } }
}

/** The doctor's own babies that have a record, most recently changed first. The plan of each is worked out by the screen. */
export async function bebekKohortu(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<BebekKohortYuku | null> {
  if (!(await rolAcik(supabase, doktorId, 'bebek'))) return null
  const bugun = await bugunGunu(supabase, doktorId, simdi)
  const { data, error } = await ulkeTablosu(supabase, BEBEK_TABLO).select('patient_id, kayit_encrypted').eq('doctor_id', doktorId).order('updated_at', { ascending: false }).limit(KOHORT_AZAMI)
  if (error || !data) return { bugun, satirlar: [], depo: !tabloYokMu(error) }
  const satirlar = data as unknown as Satir[]
  // One statement for the names and birth dates: an id that is not this doctor's patient has no entry, and no row.
  const ozet = await hastaOzetleri(supabase, doktorId, satirlar.map((s) => s.patient_id))
  const out: BebekKohortYuku['satirlar'] = []
  for (const s of satirlar) {
    const h = ozet.get(s.patient_id)
    if (!h || !h.dogumTarihi) continue
    const d = bebekDegeri(s, doktorId, s.patient_id, bugun)
    out.push({ hastaId: s.patient_id, ad: h.ad, dogumTarihi: h.dogumTarihi, profil: d.profil, durumlar: d.durumlar })
  }
  return { bugun, satirlar: out, depo: true }
}

// ───────────────────────── the pregnancy ─────────────────────────

type GebelikDegeri = { e?: unknown }
async function gebelikDegeri(satir: Satir | null, doktorId: string, hastaId: string, bugun: string): Promise<GebelikGirdisi> {
  const z = satir ? coz<GebelikDegeri>(satir.kayit_encrypted, doktorId, hastaId) : null
  return gebelikTemizle(z?.e, bugun).e
}
const bosGebelik = (): GebelikGirdisi => ({ sat: null, tdt: null, cogulTipi: null, durum: 'aktif', kayit: BOS_KAYIT })

/** The early-birth record of one of THIS doctor's patients. null = not this doctor's patient, or not this role's record. */
export async function gebelikOku(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<GebelikYuku | null> {
  if (!(await rolAcik(supabase, doktorId, 'gebelik'))) return null
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const bugun = await bugunGunu(supabase, doktorId, simdi)
  const { data, error } = await ulkeTablosu(supabase, GEBELIK_TABLO).select('patient_id, kayit_encrypted').eq('doctor_id', doktorId).eq('patient_id', hasta.id).maybeSingle()
  const depo = !error || !tabloYokMu(error)
  const e = !error && data ? await gebelikDegeri(data as unknown as Satir, doktorId, hasta.id, bugun) : bosGebelik()
  return { hasta: { id: hasta.id, ad: [hasta.ad, hasta.otaIsmi].filter(Boolean).join(' ') }, e, bugun, depo }
}

/** The doctor enters (or corrects) the early-birth record. The whole record is what the screen sent, cleaned. */
export async function gebelikKaydet(supabase: SupabaseClient, doktorId: string, hastaId: string, ham: unknown, simdi = Date.now()): Promise<{ tamam: true; yuk: GebelikYuku } | { tamam: false; kod: PrematurRetKodu; alan?: string }> {
  const mevcut = await gebelikOku(supabase, doktorId, hastaId, simdi)
  if (!mevcut) return { tamam: false, kod: 'NOT_FOUND' }
  if (!mevcut.depo) return { tamam: false, kod: 'DEPO_YOK' }
  const { e, hata } = gebelikTemizle(ham, mevcut.bugun)
  if (hata) return { tamam: false, kod: 'GECERSIZ', alan: hata }
  const an = new Date(simdi).toISOString()
  const { error } = await ulkeTablosu(supabase, GEBELIK_TABLO).upsert(
    { doctor_id: doktorId, patient_id: mevcut.hasta.id, kayit_encrypted: sifrele(doktorId, mevcut.hasta.id, { e }), updated_at: an },
    { onConflict: 'ulke,doctor_id,patient_id' },
  )
  if (error) return { tamam: false, kod: tabloYokMu(error) ? 'DEPO_YOK' : 'BASARISIZ' }
  return { tamam: true, yuk: { ...mevcut, e } }
}

/** The doctor's own pregnancies that have a record. The evaluation of each is worked out by the screen. */
export async function gebelikKohortu(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<GebelikKohortYuku | null> {
  if (!(await rolAcik(supabase, doktorId, 'gebelik'))) return null
  const bugun = await bugunGunu(supabase, doktorId, simdi)
  const { data, error } = await ulkeTablosu(supabase, GEBELIK_TABLO).select('patient_id, kayit_encrypted').eq('doctor_id', doktorId).order('updated_at', { ascending: false }).limit(KOHORT_AZAMI)
  if (error || !data) return { bugun, satirlar: [], depo: !tabloYokMu(error) }
  const satirlar = data as unknown as Satir[]
  const ozet = await hastaOzetleri(supabase, doktorId, satirlar.map((s) => s.patient_id))
  const out: GebelikKohortYuku['satirlar'] = []
  for (const s of satirlar) {
    const h = ozet.get(s.patient_id)
    if (!h) continue
    out.push({ hastaId: s.patient_id, ad: h.ad, e: await gebelikDegeri(s, doktorId, s.patient_id, bugun) })
  }
  return { bugun, satirlar: out, depo: true }
}
