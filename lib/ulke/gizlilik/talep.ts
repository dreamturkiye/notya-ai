/**
 * AU-BETA-01 — ACCESS AND CORRECTION REQUESTS (APP 12 / APP 13). Server only.
 *
 * Patient side: made by a signed-in portal session for THAT session's doctor and patient (neither id from the
 * request). Doctor side: every statement carries the doctor's id; another doctor's request answers like a missing one.
 * The patient's text and the doctor's answer are health information and are encrypted like the rest.
 *
 * Initial compliance draft – external legal review later.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { hastaAdlari } from '../uygulama/hastalar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import { acikDurumMu, AYRINTI_AZAMI, kalanGun, talepSonTarihi, TALEP_DURUMLARI, TALEP_TURLERI, YANIT_AZAMI, type TalepDurumu, type TalepTuru } from './hesap'

export type Talep = { id: string; tur: TalepTuru; durum: TalepDurumu; alindiAt: string; sonTarih: string; ayrinti: string; yanit: string; yanitlandiAt: string | null }
export type HekimTalebi = Talep & { hastaId: string; hastaAdi: string; kalanGun: number }

const KOLON = 'id, patient_id, tur, durum, alindi_at, son_tarih, ayrinti_encrypted, yanit_encrypted, yanitlandi_at'
type Satir = { id: string; patient_id: string; tur: TalepTuru; durum: TalepDurumu; alindi_at: string; son_tarih: string; ayrinti_encrypted: string | null; yanit_encrypted: string | null; yanitlandi_at: string | null }
const coz = (h: string | null): string => { if (!h) return ''; try { return decrypt(h) } catch { return '' } }
const donustur = (s: Satir): Talep => ({ id: s.id, tur: s.tur, durum: s.durum, alindiAt: s.alindi_at, sonTarih: s.son_tarih, ayrinti: coz(s.ayrinti_encrypted), yanit: coz(s.yanit_encrypted), yanitlandiAt: s.yanitlandi_at })

export type TalepRet = 'GECERSIZ' | 'BEKLEYEN_VAR' | 'NOT_FOUND' | 'BASARISIZ'

export async function talepOlustur(supabase: SupabaseClient, doktorId: string, hastaId: string, g: { tur: unknown; ayrinti: unknown }, simdi = Date.now()): Promise<{ tamam: true; talep: Talep } | { tamam: false; kod: TalepRet }> {
  if (!TALEP_TURLERI.includes(g.tur as TalepTuru)) return { tamam: false, kod: 'GECERSIZ' }
  const ayrinti = typeof g.ayrinti === 'string' ? g.ayrinti.trim().slice(0, AYRINTI_AZAMI) : ''
  const acik = await ulkeTablosu(supabase, 'ulke_erisim_talepleri').select('id').eq('doctor_id', doktorId).eq('patient_id', hastaId).eq('tur', g.tur as string).in('durum', ['yeni', 'islemde']).limit(1)
  if (acik.error) return { tamam: false, kod: 'BASARISIZ' }
  if ((acik.data as unknown[] | null)?.length) return { tamam: false, kod: 'BEKLEYEN_VAR' }
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const { data, error } = await ulkeTablosu(supabase, 'ulke_erisim_talepleri')
    .insert({ doctor_id: doktorId, patient_id: hastaId, tur: g.tur, ayrinti_encrypted: ayrinti ? encrypt(ayrinti) : null, alindi_at: new Date(simdi).toISOString(), son_tarih: talepSonTarihi(simdi, dilim) })
    .select(KOLON).single()
  if (error || !data) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, talep: donustur(data as unknown as Satir) }
}

export async function hastaninTalepleri(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<Talep[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_erisim_talepleri').select(KOLON).eq('doctor_id', doktorId).eq('patient_id', hastaId).order('alindi_at', { ascending: false }).limit(20)
  return ((data as Satir[] | null) ?? []).map(donustur)
}

export async function hekimTalepleri(supabase: SupabaseClient, doktorId: string, simdi = Date.now()): Promise<HekimTalebi[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_erisim_talepleri').select(KOLON).eq('doctor_id', doktorId).order('alindi_at', { ascending: false }).limit(200)
  const satirlar = (data as Satir[] | null) ?? []
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const bugun = yerelAn(simdi, dilim).gun
  const liste = satirlar.map((s) => ({ ...donustur(s), hastaId: s.patient_id, hastaAdi: adlar.get(s.patient_id) ?? '', kalanGun: kalanGun(s.son_tarih, bugun) }))
  // Open first, then by due date (the most overdue at the top); closed ones after, newest first.
  return liste.sort((a, b) => Number(acikDurumMu(b.durum)) - Number(acikDurumMu(a.durum)) || (acikDurumMu(a.durum) ? a.kalanGun - b.kalanGun : 0))
}

export async function talepGuncelle(supabase: SupabaseClient, doktorId: string, talepId: string, g: { durum: unknown; yanit: unknown }, simdi = Date.now()): Promise<'TAMAM' | 'GECERSIZ' | 'NOT_FOUND' | 'BASARISIZ'> {
  if (!TALEP_DURUMLARI.includes(g.durum as TalepDurumu) || g.durum === 'yeni') return 'GECERSIZ'
  const yanit = typeof g.yanit === 'string' ? g.yanit.trim().slice(0, YANIT_AZAMI) : ''
  const kapanis = g.durum === 'tamamlandi' || g.durum === 'reddedildi'
  const { data, error } = await ulkeTablosu(supabase, 'ulke_erisim_talepleri')
    .update({ durum: g.durum, ...(yanit ? { yanit_encrypted: encrypt(yanit) } : {}), ...(kapanis ? { yanitlandi_at: new Date(simdi).toISOString() } : {}) })
    .eq('doctor_id', doktorId).eq('id', talepId).select('id')
  if (error) return 'BASARISIZ'
  return (data as unknown[] | null)?.length ? 'TAMAM' : 'NOT_FOUND'
}
