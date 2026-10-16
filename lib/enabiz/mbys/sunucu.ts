/**
 * MBYS server-side readers shared by the queue route and the one-click "Muayeneyi Bildir" route.
 * Every read is scoped to the doctor (HASTA-IZOLASYON): the note by id AND doctor_id, the session through
 * seansSahibi (session AND its patient are the doctor's), the patient by doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'
import { notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { decrypt } from '@/lib/security/encryption'
import { formlariBirlestir, sifreliFormlariCoz } from '@/lib/intake/formBirlestir'
import {
  mbysAyarCoz,
  mbysDurum,
  mbysDurumCoz,
  mbysDuzMetin,
  mbysKontrol,
  type MbysAyar,
  type MbysDurum,
  type MbysEksik,
  type MbysKayit,
} from './kontrol'
import { mbysKayitKur, type MbysKimlikEk } from './kayit'

type Sb = SupabaseClient

export const NOT_ALANLARI = 'id, session_id, created_at, approved_at, basvuru_yakinmasi, content_subjektif, content_objektif, content_degerlendirme, content_plan, icd10_codes, vitaller'

export function coz(v: unknown): string {
  if (!v) return ''
  try { return String(decrypt(String(v)) || '') } catch { return '' }
}

export async function ayarOku(supabase: Sb, doktorId: string): Promise<MbysAyar> {
  const { data } = await supabase.from('users').select('mbys_ayar').eq('id', doktorId).maybeSingle()
  return mbysAyarCoz((data as { mbys_ayar?: unknown } | null)?.mbys_ayar)
}

/** Everything the record needs about the patients, read under the doctor. */
export async function hastaBilgileri(supabase: Sb, doktorId: string, hastaIds: string[]) {
  const harita = new Map<string, { ad: string; dogum: string; cinsiyet: string; kartTc: string; kilit: boolean; form: Record<string, unknown> | null; ek: MbysKimlikEk | null }>()
  if (!hastaIds.length) return harita
  const [hastaQ, formQ, ekQ] = await Promise.all([
    supabase.from('patients').select('id, name_encrypted, dob_encrypted, gender_encrypted, notes_encrypted, enabiz_gonderilmesin').eq('doctor_id', doktorId).in('id', hastaIds),
    supabase.from('hasta_intake_formlari').select('patient_id, form_data_encrypted, created_at').eq('doktor_id', doktorId).in('patient_id', hastaIds).not('form_data_encrypted', 'is', null).order('created_at', { ascending: false }).limit(hastaIds.length * 3 + 10),
    supabase.from('mbys_hasta_kimlik').select('patient_id, kimlik_encrypted').eq('doctor_id', doktorId).in('patient_id', hastaIds),
  ])
  for (const p of (hastaQ.data || []) as Record<string, unknown>[]) {
    const id = String(p.id)
    const kart = notAlanlariCoz(p.notes_encrypted as string | null)
    const formSatir = ((formQ.data || []) as { patient_id: string; form_data_encrypted: string; created_at: string }[]).filter((f) => f.patient_id === id)
    const birlesik = formlariBirlestir(sifreliFormlariCoz(formSatir).formlar)
    const ekSatir = ((ekQ.data || []) as { patient_id: string; kimlik_encrypted: string }[]).find((e) => e.patient_id === id)
    let ek: MbysKimlikEk | null = null
    try { ek = ekSatir ? (JSON.parse(coz(ekSatir.kimlik_encrypted) || 'null') as MbysKimlikEk | null) : null } catch { ek = null }
    harita.set(id, {
      ad: hastaAdiCoz(p.name_encrypted as string),
      dogum: coz(p.dob_encrypted),
      cinsiyet: coz(p.gender_encrypted),
      kartTc: String(kart.tcKimlik || kart.tcKimlikNo || '').trim(),
      kilit: p.enabiz_gonderilmesin === true,
      form: birlesik?.yanitlar ?? null,
      ek,
    })
  }
  return harita
}

export const KILIT_EKSIK = { alan: 'izin', mesaj: 'Hasta e-Nabız’a gönderilmesini istemiyor', duzelt: 'yok' as const }

export type NotKaydi = {
  not: Record<string, unknown>
  hastaId: string
  hastaAd: string
  onayli: boolean
  kilit: boolean
  eksikler: MbysEksik[]
  /** null when the patient refused e-Nabız sharing: no record exists to hand over. */
  kayit: MbysKayit | null
  metin: string
  durum: MbysDurum
}

/** One visit's MBYS record, read under the doctor. null = not found / not this doctor's (callers answer 404). */
export async function notKaydiHazirla(supabase: Sb, doktorId: string, notId: string, muayeneDahil: boolean): Promise<NotKaydi | null> {
  const { data: not } = await arsivsizNotlar(supabase, NOT_ALANLARI).eq('id', notId).eq('doctor_id', doktorId).maybeSingle()
  if (!not) return null
  const n = not as unknown as Record<string, unknown>
  const seans = await seansSahibi(supabase, doktorId, String(n.session_id))
  if (!seans?.patient_id) return null
  const hastaId = String(seans.patient_id)
  const h = (await hastaBilgileri(supabase, doktorId, [hastaId])).get(hastaId)
  if (!h) return null
  const ayar = await ayarOku(supabase, doktorId)
  const { data: akt } = await supabase.from('mbys_aktarimlar').select('durum').eq('doctor_id', doktorId).eq('note_id', notId).maybeSingle()
  const kayit = mbysKayitKur({ hastaAd: h.ad, dogum: h.dogum, cinsiyet: h.cinsiyet, kartTc: h.kartTc, form: h.form, ek: h.ek, not: n, ayar, muayeneDahil })
  const eksikler = [...(h.kilit ? [KILIT_EKSIK] : []), ...mbysKontrol(kayit)]
  return {
    not: n,
    hastaId,
    hastaAd: h.ad,
    onayli: !!n.approved_at,
    kilit: h.kilit,
    eksikler,
    kayit: h.kilit ? null : kayit,
    metin: h.kilit ? '' : mbysDuzMetin(kayit),
    durum: mbysDurum(eksikler, mbysDurumCoz((akt as { durum?: string } | null)?.durum)),
  }
}
