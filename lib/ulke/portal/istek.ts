/**
 * NOTYA-ULKE-PORTAL-01 — A PATIENT ASKS FOR AN APPOINTMENT; the doctor accepts it by choosing a time, or declines.
 *
 * THE PATIENT'S SIDE. A request is made by a signed-in portal session, for THAT session's own doctor and patient:
 * neither id is taken from the request. It names up to ISTEK_GUN_AZAMI preferred days (calendar days of the doctor's
 * own time zone, from tomorrow, at most ISTEK_GUN_UFKU days ahead) and a short reason, stored encrypted. A patient
 * has at most ONE unanswered request (the database refuses a second). The patient books nothing: a request is not an
 * appointment and holds no time.
 *
 * THE DOCTOR'S SIDE. The request appears on the calendar screens. Accepting = choosing the slot: the same checks a
 * booking makes (clash, working hours), then ONE database function books the appointment and marks the request
 * accepted together (migration 137). NO DOUBLE BOOKING, as for every appointment: the guarantee is the database's
 * exclusion constraint; a taken time answers 'DOLU' and the request is still waiting.
 *
 * PATIENT ISOLATION. A request id from a doctor's request is read and written with the doctor's id in the same
 * statement; another doctor's request answers exactly like one that does not exist. Patient names are read by
 * doctor AND patient id. Every statement is bound to this build's country.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ozellikAcik } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { NEDEN_AZAMI, randevuGetir, randevuYeriHazirla, type Randevu, type RandevuRetKodu, type ZamanGirdisi } from '../uygulama/randevular'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { gunEkle, gunGecerli, yerelAn } from '../uygulama/zaman'
import type { PortalKimligi } from './giris'
import { ISTEK_GUN_AZAMI, ISTEK_GUN_UFKU, ISTEK_NEDEN_AZAMI } from './sabitler'

export type IstekDurumu = 'bekliyor' | 'kabul' | 'red'
export type RandevuIstegi = {
  id: string
  hastaId: string
  /** 'YYYY-MM-DD', ascending. */
  gunler: string[]
  neden: string
  durum: IstekDurumu
  olusturuldu: string
  randevuId: string | null
}
export type IstekRetKodu = RandevuRetKodu | 'BEKLEYEN_VAR' | 'CEVAPLANDI'
type Ret = { tamam: false; kod: IstekRetKodu; alan?: string }
const ret = (kod: IstekRetKodu, alan?: string): Ret => ({ tamam: false, kod, ...(alan ? { alan } : {}) })

/** HTTP status of the codes only requests answer with (the others: lib/ulke/uygulama/randevuDurumu.ts). */
export const ISTEK_DURUMU: Record<'BEKLEYEN_VAR' | 'CEVAPLANDI', number> = { BEKLEYEN_VAR: 409, CEVAPLANDI: 409 }

/** true = a patient may ask for an appointment in this country: the portal and appointments are both on. */
export const istekAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('hastaPortali') && ozellikAcik('randevu')

type Satir = { id: string; patient_id: string; gunler: unknown; neden_encrypted: string | null; durum: string; randevu_id: string | null; created_at: string }
const KOLONLAR = 'id, patient_id, gunler, neden_encrypted, durum, randevu_id, created_at'
const TABLO = 'ulke_randevu_istekleri'
const TEKIL_IHLALI = '23505'
const CAKISMA_KODU = '23P01'

const coz = (ham: unknown): string => {
  if (typeof ham !== 'string' || !ham) return ''
  try { return decrypt(ham) } catch { return '' }
}
const durumMu = (ham: unknown): ham is IstekDurumu => ham === 'bekliyor' || ham === 'kabul' || ham === 'red'
const satirdan = (s: Satir): RandevuIstegi => ({
  id: s.id, hastaId: s.patient_id,
  gunler: (Array.isArray(s.gunler) ? s.gunler.map(String) : []).filter(gunGecerli).sort(),
  neden: coz(s.neden_encrypted), durum: durumMu(s.durum) ? s.durum : 'bekliyor', olusturuldu: s.created_at, randevuId: s.randevu_id ?? null,
})

/** The days a patient may choose from, in the doctor's own zone: tomorrow and the ISTEK_GUN_UFKU - 1 days after it. */
export function istekGunleri(simdi: number, dilim: string): string[] {
  const bugun = yerelAn(simdi, dilim).gun
  return Array.from({ length: ISTEK_GUN_UFKU }, (_, i) => gunEkle(bugun, i + 1))
}

// ───────────────────────── the patient's side ─────────────────────────

/** A request from a signed-in portal session, for that session's own doctor and patient. */
export async function istekOlustur(supabase: SupabaseClient, kim: PortalKimligi, g: { gunler: unknown; neden: unknown }, simdi = Date.now()): Promise<{ tamam: true; istek: RandevuIstegi } | Ret> {
  if (!istekAcik()) return ret('NOT_FOUND')
  // The patient is read by the session's doctor AND patient: a session without its patient asks for nothing.
  const hasta = await hastaGetir(supabase, kim.doktorId, kim.hastaId)
  if (!hasta) return ret('NOT_FOUND')
  const secilebilir = istekGunleri(simdi, await hesapSaatDilimi(supabase, kim.doktorId))
  const gunler = Array.isArray(g.gunler) ? [...new Set(g.gunler.map((x) => String(x)))].sort() : []
  if (!gunler.length || gunler.length > ISTEK_GUN_AZAMI || gunler.some((x) => !secilebilir.includes(x))) return ret('GECERSIZ', 'gunler')
  const neden = typeof g.neden === 'string' ? g.neden.trim().slice(0, ISTEK_NEDEN_AZAMI) : ''
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .insert({ doctor_id: kim.doktorId, patient_id: hasta.id, gunler, neden_encrypted: neden ? encrypt(neden) : null, durum: 'bekliyor' })
    .select(KOLONLAR)
    .single()
  // The database's own refusal: this patient already has a request that is not answered.
  if (error) return ret((error as { code?: string }).code === TEKIL_IHLALI ? 'BEKLEYEN_VAR' : 'BASARISIZ')
  if (!data) return ret('BASARISIZ')
  return { tamam: true, istek: satirdan(data as Satir) }
}

/**
 * The patient's latest request and, where it was accepted, the appointment it became — read by the session's doctor
 * AND patient. null = the patient has made none.
 */
export async function hastaninSonIstegi(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<{ istek: RandevuIstegi; randevu: Pick<Randevu, 'gun' | 'saat' | 'sureDk' | 'durum'> | null } | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', hastaId).order('created_at', { ascending: false }).limit(1)
  const s = ((data as Satir[] | null) ?? [])[0]
  if (error || !s) return null
  const istek = satirdan(s)
  const r = istek.randevuId ? await randevuGetir(supabase, doktorId, istek.randevuId) : null
  // The appointment must be this patient's own: a request row never shows another patient's time.
  return { istek, randevu: r && r.hastaId === hastaId ? { gun: r.gun, saat: r.saat, sureDk: r.sureDk, durum: r.durum } : null }
}

// ───────────────────────── the doctor's side ─────────────────────────

/** This doctor's requests that are not answered yet, oldest first, with the patient's name. null = could not be read. */
export async function bekleyenIstekler(supabase: SupabaseClient, doktorId: string): Promise<(RandevuIstegi & { hastaAdi: string })[] | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).eq('durum', 'bekliyor').order('created_at', { ascending: true }).limit(200)
  if (error || !data) return null
  const satirlar = data as Satir[]
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  // A request whose patient is not this doctor's is not listed at all (the keys make it impossible; this is the second line).
  return satirlar.filter((s) => adlar.has(s.patient_id)).map((s) => ({ ...satirdan(s), hastaAdi: adlar.get(s.patient_id) ?? '' }))
}

async function satirOku(supabase: SupabaseClient, doktorId: string, id: string): Promise<Satir | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  return error || !data ? null : (data as Satir)
}

/**
 * The doctor accepts a request by choosing the time. `neden` is the doctor's own note for the appointment (the
 * patient's reason when none is given). The appointment and the request's answer are written together or not at all.
 */
export async function istekKabul(supabase: SupabaseClient, doktorId: string, istekId: string, g: ZamanGirdisi & { neden?: string }, simdi = Date.now()): Promise<{ tamam: true; randevuId: string } | Ret> {
  if (!istekAcik()) return ret('NOT_FOUND')
  const s = await satirOku(supabase, doktorId, istekId)
  if (!s) return ret('NOT_FOUND')
  if (s.durum !== 'bekliyor') return ret('CEVAPLANDI')
  // ISOLATION: the request's patient must be this doctor's before an appointment is written for them.
  const hasta = await hastaGetir(supabase, doktorId, s.patient_id)
  if (!hasta) return ret('NOT_FOUND')
  const yer = await randevuYeriHazirla(supabase, doktorId, g, simdi)
  if (!yer.tamam) return yer
  const neden = (typeof g.neden === 'string' && g.neden.trim() ? g.neden.trim() : coz(s.neden_encrypted)).slice(0, NEDEN_AZAMI)
  const { data, error } = await ulkeIslevi(supabase, 'ulke_randevu_istegi_kabul', {
    p_doctor_id: doktorId, p_istek_id: istekId,
    p_baslangic: new Date(yer.bas).toISOString(), p_bitis: new Date(yer.bit).toISOString(),
    p_neden_encrypted: neden ? encrypt(neden) : null, p_mesai_disi: yer.mesaiDisi, p_simdi: new Date(simdi).toISOString(),
  })
  // The database's own refusal: somebody took the time between the check and this statement. Nothing was written.
  if (error) return ret((error as { code?: string }).code === CAKISMA_KODU ? 'DOLU' : 'BASARISIZ')
  const d = data as { durum?: string; randevu_id?: string } | null
  if (d?.durum === 'NOT_FOUND') return ret('NOT_FOUND')
  if (d?.durum === 'CEVAPLANDI') return ret('CEVAPLANDI')
  if (d?.durum !== 'TAMAM' || !d.randevu_id) return ret('BASARISIZ')
  return { tamam: true, randevuId: d.randevu_id }
}

/** The doctor declines a request. The statement itself carries "not answered yet", so it cannot undo an acceptance. */
export async function istekReddet(supabase: SupabaseClient, doktorId: string, istekId: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  if (!istekAcik()) return ret('NOT_FOUND')
  const s = await satirOku(supabase, doktorId, istekId)
  if (!s) return ret('NOT_FOUND')
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .update({ durum: 'red', cevap_at: new Date(simdi).toISOString() })
    .eq('id', istekId)
    .eq('doctor_id', doktorId)
    .eq('durum', 'bekliyor')
    .select('id')
  if (error) return ret('BASARISIZ')
  return (data as unknown[] | null)?.length ? { tamam: true } : ret('CEVAPLANDI')
}
