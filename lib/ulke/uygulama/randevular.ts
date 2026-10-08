/**
 * NOTYA-UZ-RANDEVU-01 — appointments of the signed-in application: book, move, change status, list, link to a visit.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 *   - a patient id from a request is proven to be THIS doctor's (hastaGetir: id and doctor in one query) before an
 *     appointment is written or read for them — a doctor can book only their own patients;
 *   - an appointment id from a request is read, and every later write is made, with the doctor's id in the same
 *     statement. Another doctor's appointment answers exactly like one that does not exist: 'NOT_FOUND';
 *   - lists are read by doctor; patient names are read by doctor AND patient id — an appointment row that points at
 *     a patient who is not this doctor's gets no name, it does not borrow one.
 *
 * NO DOUBLE BOOKING. The guarantee is the database's (migration 135: an exclusion constraint over doctor and time,
 * for appointments that still hold their time). The check made here first only gives the doctor the answer sooner;
 * two requests at the same moment both pass it, and the constraint refuses the second one (error 23P01 → 'DOLU').
 * A failed check is a failure, never "free". There is no way to book over another appointment.
 *
 * WORKING HOURS (lib/ulke/uygulama/calismaDuzeni.ts). Outside them the answer is 'MESAI_DISI' and nothing is
 * written, unless the request says "book anyway" (`yineDe`) — then the appointment is stored and marked.
 *
 * TIME. An appointment is stored as an instant; the day and hour a doctor types are the COUNTRY's (the pack's
 * `saatDilimi`), converted in lib/ulke/uygulama/zaman.ts. The server clock's own zone plays no part.
 *
 * Storage: `ulke_randevulari` (migration 135). The reason is encrypted like the rest of a patient's data.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkePaketi } from '../ulke'
import { calismaDuzeniniOku, mesaiIcinde, sureSecenekleri } from './calismaDuzeni'
import { hastaAdlari, hastaGetir } from './hastalar'
import { DAKIKA_MS, GUN_DK, gunEkle, gunGecerli, saatYazDk, yerelAn, yerelUtc } from './zaman'

export const RANDEVU_DURUMLARI = ['planlandi', 'geldi', 'tamamlandi', 'gelmedi', 'iptal'] as const
export type RandevuDurumu = (typeof RANDEVU_DURUMLARI)[number]
/** Statuses in which an appointment still holds its time. Same list as the constraint of migration 135. */
export const YER_TUTAN_DURUMLAR: readonly RandevuDurumu[] = ['planlandi', 'geldi', 'tamamlandi']
/** A visit can be started from, and linked to, an appointment in these statuses. */
export const MUAYENE_BASLATILABILIR: readonly RandevuDurumu[] = ['planlandi', 'geldi']
/** Target status → the statuses it may be reached from by hand. 'tamamlandi' and 'iptal' are final. */
const GECISLER: Readonly<Record<RandevuDurumu, readonly RandevuDurumu[]>> = {
  planlandi: ['geldi', 'gelmedi'],
  geldi: ['planlandi', 'gelmedi'],
  tamamlandi: ['planlandi', 'geldi'],
  gelmedi: ['planlandi', 'geldi'],
  iptal: ['planlandi', 'geldi', 'gelmedi'],
}
export const NEDEN_AZAMI = 200
/** How far ahead an appointment may be booked, in days. */
export const ILERI_GUN_AZAMI = 730

export type Randevu = {
  id: string
  hastaId: string
  /** '' when the row's patient is not this doctor's (never another doctor's patient's name). */
  hastaAdi: string
  /** ISO instants. */
  baslangic: string
  bitis: string
  /** The same start in the country's own day and hour: 'YYYY-MM-DD', 'HH:MM'. */
  gun: string
  saat: string
  sureDk: number
  neden: string
  durum: RandevuDurumu
  mesaiDisi: boolean
  /** The visit started from this appointment, if any. */
  seansId: string | null
}

export type RandevuRetKodu = 'NOT_FOUND' | 'GECERSIZ' | 'DOLU' | 'MESAI_DISI' | 'GECIS_YOK' | 'HAZIR_DEGIL' | 'BASARISIZ'
type Ret = { tamam: false; kod: RandevuRetKodu; alan?: string }
const ret = (kod: RandevuRetKodu, alan?: string): Ret => ({ tamam: false, kod, ...(alan ? { alan } : {}) })

export const randevuDurumuMu = (ham: unknown): ham is RandevuDurumu => typeof ham === 'string' && (RANDEVU_DURUMLARI as readonly string[]).includes(ham)

type Satir = { id: string; patient_id: string; baslangic: string; bitis: string; neden_encrypted: string | null; durum: string; mesai_disi: boolean | null; session_id: string | null }
const KOLONLAR = 'id, patient_id, baslangic, bitis, neden_encrypted, durum, mesai_disi, session_id'
const TABLO = 'ulke_randevulari'
/** PostgreSQL's code for a violated exclusion constraint: the time is taken. */
const CAKISMA_KODU = '23P01'

const coz = (ham: unknown): string => {
  if (typeof ham !== 'string' || !ham) return ''
  try { return decrypt(ham) } catch { return '' }
}

function satirdan(s: Satir, hastaAdi: string): Randevu {
  const dilim = ulkePaketi().saatDilimi
  const bas = new Date(s.baslangic).getTime()
  const bit = new Date(s.bitis).getTime()
  const y = yerelAn(bas, dilim)
  return {
    id: s.id,
    hastaId: s.patient_id,
    hastaAdi,
    baslangic: new Date(bas).toISOString(),
    bitis: new Date(bit).toISOString(),
    gun: y.gun,
    saat: saatYazDk(y.dakika),
    sureDk: Math.round((bit - bas) / DAKIKA_MS),
    neden: coz(s.neden_encrypted),
    durum: randevuDurumuMu(s.durum) ? s.durum : 'planlandi',
    mesaiDisi: s.mesai_disi === true,
    seansId: s.session_id ?? null,
  }
}

export type ZamanGirdisi = { gun: string; saatDk: number | null; sureDk: number; yineDe: boolean }

/** The instants of a requested time, or the field that is wrong. `simdi` is passed in so that tests own the clock. */
function zamanCoz(g: ZamanGirdisi, simdi: number): { tamam: true; bas: number; bit: number; haftaGunu: number } | Ret {
  const dilim = ulkePaketi().saatDilimi
  if (!gunGecerli(g.gun)) return ret('GECERSIZ', 'gun')
  if (g.saatDk === null || !Number.isInteger(g.saatDk) || g.saatDk < 0 || g.saatDk >= GUN_DK) return ret('GECERSIZ', 'saat')
  if (!sureSecenekleri().includes(g.sureDk)) return ret('GECERSIZ', 'sure')
  // Not before the country's today, and not further ahead than the ceiling: a mistyped year is refused, not stored.
  const bugun = yerelAn(simdi, dilim).gun
  if (g.gun < bugun || g.gun > gunEkle(bugun, ILERI_GUN_AZAMI)) return ret('GECERSIZ', 'gun')
  const bas = yerelUtc(g.gun, g.saatDk, dilim)
  // A wall-clock time that does not exist on that day (a clock change) does not survive the round trip.
  const geri = yerelAn(bas, dilim)
  if (geri.gun !== g.gun || geri.dakika !== g.saatDk) return ret('GECERSIZ', 'saat')
  return { tamam: true, bas, bit: bas + g.sureDk * DAKIKA_MS, haftaGunu: geri.haftaGunu }
}

/** true = another appointment of this doctor holds part of [bas, bit). null = the check itself failed. */
async function doluMu(supabase: SupabaseClient, doktorId: string, bas: number, bit: number, haricId?: string): Promise<boolean | null> {
  let q = supabase
    .from(TABLO)
    .select('id')
    .eq('doctor_id', doktorId)
    .in('durum', [...YER_TUTAN_DURUMLAR])
    .lt('baslangic', new Date(bit).toISOString())
    .gt('bitis', new Date(bas).toISOString())
  if (haricId) q = q.neq('id', haricId)
  const { data, error } = await q.limit(1)
  if (error || !data) return null
  return (data as unknown[]).length > 0
}

/** Clash first (never overridable), then working hours (overridable by `yineDe`). */
async function yerKontrolu(supabase: SupabaseClient, doktorId: string, z: { bas: number; bit: number; haftaGunu: number }, g: ZamanGirdisi, haricId?: string): Promise<{ tamam: true; mesaiDisi: boolean } | Ret> {
  const dolu = await doluMu(supabase, doktorId, z.bas, z.bit, haricId)
  if (dolu === null) return ret('BASARISIZ')
  if (dolu) return ret('DOLU')
  const d = await calismaDuzeniniOku(supabase, doktorId)
  if (!d) return ret('HAZIR_DEGIL')
  const icinde = mesaiIcinde(d.duzen, z.haftaGunu, g.saatDk as number, g.sureDk)
  if (!icinde && !g.yineDe) return ret('MESAI_DISI')
  return { tamam: true, mesaiDisi: !icinde }
}

export type RandevuGirdisi = ZamanGirdisi & { hastaId: string; neden: string }

/** Books an appointment for one of THIS doctor's patients. */
export async function randevuOlustur(supabase: SupabaseClient, doktorId: string, g: RandevuGirdisi, simdi = Date.now()): Promise<{ tamam: true; randevu: Randevu } | Ret> {
  // ISOLATION: the patient must be this doctor's before anything is read or written for them.
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return ret('NOT_FOUND')
  const z = zamanCoz(g, simdi)
  if (!z.tamam) return z
  const yer = await yerKontrolu(supabase, doktorId, z, g)
  if (!yer.tamam) return yer
  const neden = g.neden.trim().slice(0, NEDEN_AZAMI)
  const { data, error } = await supabase
    .from(TABLO)
    .insert({
      doctor_id: doktorId,
      patient_id: hasta.id,
      baslangic: new Date(z.bas).toISOString(),
      bitis: new Date(z.bit).toISOString(),
      neden_encrypted: neden ? encrypt(neden) : null,
      durum: 'planlandi',
      mesai_disi: yer.mesaiDisi,
    })
    .select(KOLONLAR)
    .single()
  // The database's own refusal: somebody else's request took the time between the check and this statement.
  if (error) return ret((error as { code?: string }).code === CAKISMA_KODU ? 'DOLU' : 'BASARISIZ')
  if (!data) return ret('BASARISIZ')
  return { tamam: true, randevu: satirdan(data as Satir, hasta.ad) }
}

async function satirOku(supabase: SupabaseClient, doktorId: string, id: string): Promise<Satir | null> {
  const { data, error } = await supabase.from(TABLO).select(KOLONLAR).eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  return error || !data ? null : (data as Satir)
}

/** One appointment of THIS doctor, or null — for a foreign id exactly as for one that does not exist. */
export async function randevuGetir(supabase: SupabaseClient, doktorId: string, id: string): Promise<(Randevu & { hastaDili: string }) | null> {
  const s = await satirOku(supabase, doktorId, id)
  if (!s) return null
  // The patient is read by doctor AND id: a row pointing at somebody else's patient shows no name and no language.
  const hasta = await hastaGetir(supabase, doktorId, s.patient_id)
  return { ...satirdan(s, hasta?.ad ?? ''), hastaDili: hasta?.dil ?? '' }
}

/** Moves an appointment to another time (and length). Only one that is planned or has arrived can be moved. */
export async function randevuTasi(supabase: SupabaseClient, doktorId: string, id: string, g: ZamanGirdisi, simdi = Date.now()): Promise<{ tamam: true; randevu: Randevu } | Ret> {
  const s = await satirOku(supabase, doktorId, id)
  if (!s) return ret('NOT_FOUND')
  if (!(MUAYENE_BASLATILABILIR as readonly string[]).includes(s.durum)) return ret('GECIS_YOK')
  const z = zamanCoz(g, simdi)
  if (!z.tamam) return z
  const yer = await yerKontrolu(supabase, doktorId, z, g, id)
  if (!yer.tamam) return yer
  const { data, error } = await supabase
    .from(TABLO)
    .update({ baslangic: new Date(z.bas).toISOString(), bitis: new Date(z.bit).toISOString(), mesai_disi: yer.mesaiDisi, updated_at: new Date(simdi).toISOString() })
    .eq('id', id)
    .eq('doctor_id', doktorId)
    .in('durum', [...MUAYENE_BASLATILABILIR])
    .select(KOLONLAR)
  if (error) return ret((error as { code?: string }).code === CAKISMA_KODU ? 'DOLU' : 'BASARISIZ')
  const yeni = ((data as Satir[] | null) ?? [])[0]
  if (!yeni) return ret('GECIS_YOK')
  const adlar = await hastaAdlari(supabase, doktorId, [yeni.patient_id])
  return { tamam: true, randevu: satirdan(yeni, adlar.get(yeni.patient_id) ?? '') }
}

/**
 * Changes the status by hand: arrived, done, did not come, cancelled, or back to planned. The statement itself
 * carries the statuses the change is allowed from, so two clicks at once cannot both win. "Done" and "cancelled"
 * are final — except a "done" set by hand on an appointment with no visit, which can be taken back to "arrived".
 */
export async function randevuDurumDegistir(supabase: SupabaseClient, doktorId: string, id: string, durum: RandevuDurumu): Promise<{ tamam: true; randevu: Randevu } | Ret> {
  const s = await satirOku(supabase, doktorId, id)
  if (!s) return ret('NOT_FOUND')
  const simdi = new Date().toISOString()
  const dene = async (nereden: readonly string[], seanssiz: boolean) => {
    let q = supabase.from(TABLO).update({ durum, updated_at: simdi }).eq('id', id).eq('doctor_id', doktorId).in('durum', [...nereden])
    if (seanssiz) q = q.is('session_id', null)
    return q.select(KOLONLAR)
  }
  let { data, error } = await dene(GECISLER[durum], false)
  if (!error && !(data as unknown[] | null)?.length && durum === 'geldi') ({ data, error } = await dene(['tamamlandi'], true))
  // Back from "did not come" the appointment needs its time again; if another one holds it now, the answer is "taken".
  if (error) return ret((error as { code?: string }).code === CAKISMA_KODU ? 'DOLU' : 'BASARISIZ')
  const yeni = ((data as Satir[] | null) ?? [])[0]
  if (!yeni) return ret('GECIS_YOK')
  const adlar = await hastaAdlari(supabase, doktorId, [yeni.patient_id])
  return { tamam: true, randevu: satirdan(yeni, adlar.get(yeni.patient_id) ?? '') }
}

async function adlandir(supabase: SupabaseClient, doktorId: string, satirlar: Satir[]): Promise<Randevu[]> {
  if (!satirlar.length) return []
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  return satirlar.map((s) => satirdan(s, adlar.get(s.patient_id) ?? ''))
}

/**
 * This doctor's appointments that START on the `gunSayisi` days from `ilkGun` (the country's days), in time order.
 * Cancelled ones included: the calendar decides what to show. null = could not be read.
 */
export async function randevulariListele(supabase: SupabaseClient, doktorId: string, ilkGun: string, gunSayisi: number): Promise<Randevu[] | null> {
  if (!gunGecerli(ilkGun) || !Number.isInteger(gunSayisi) || gunSayisi < 1 || gunSayisi > 42) return null
  const dilim = ulkePaketi().saatDilimi
  const { data, error } = await supabase
    .from(TABLO)
    .select(KOLONLAR)
    .eq('doctor_id', doktorId)
    .gte('baslangic', new Date(yerelUtc(ilkGun, 0, dilim)).toISOString())
    .lt('baslangic', new Date(yerelUtc(gunEkle(ilkGun, gunSayisi), 0, dilim)).toISOString())
    .order('baslangic', { ascending: true })
    .limit(1000)
  if (error || !data) return null
  return adlandir(supabase, doktorId, data as Satir[])
}

/** Appointments of ONE patient of this doctor from the country's today on, in time order. The caller has already proven the patient is the doctor's. */
export async function hastaninRandevulari(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<Randevu[] | null> {
  const dilim = ulkePaketi().saatDilimi
  const { data, error } = await supabase
    .from(TABLO)
    .select(KOLONLAR)
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .gte('baslangic', new Date(yerelUtc(yerelAn(simdi, dilim).gun, 0, dilim)).toISOString())
    .order('baslangic', { ascending: true })
    .limit(50)
  if (error || !data) return null
  return adlandir(supabase, doktorId, data as Satir[])
}

// ───────────────────────── from appointment to visit ─────────────────────────

/**
 * Before a visit is recorded "from an appointment": the appointment must be THIS doctor's and for THIS patient.
 * Anything else — another doctor's appointment, another patient's, an id that does not exist — is the same "no".
 */
export async function randevuMuayeneyeUygun(supabase: SupabaseClient, doktorId: string, randevuId: string, hastaId: string): Promise<boolean> {
  const { data, error } = await supabase.from(TABLO).select('id').eq('id', randevuId).eq('doctor_id', doktorId).eq('patient_id', hastaId).maybeSingle()
  return !error && Boolean(data)
}

/**
 * Links a recorded visit to the appointment it was started from, and marks the patient as arrived. One statement,
 * carrying doctor, patient, "no visit yet" and a status a visit can start from. false = not linked (the appointment
 * was cancelled, finished or linked meanwhile): the visit itself is kept either way — a recording is never lost
 * over its appointment.
 */
export async function randevuyuMuayeneyeBagla(supabase: SupabaseClient, doktorId: string, randevuId: string, hastaId: string, seansId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLO)
    .update({ session_id: seansId, durum: 'geldi', updated_at: new Date().toISOString() })
    .eq('id', randevuId)
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .is('session_id', null)
    .in('durum', [...MUAYENE_BASLATILABILIR])
    .select('id')
  return !error && Boolean((data as unknown[] | null)?.length)
}
