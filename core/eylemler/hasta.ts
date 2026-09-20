/**
 * NOTYA-EYLEM — resolve the patient SERVER-SIDE.
 *
 * docs §2: "Tool payloads must never carry a patient identity from the model; hasta_id is resolved
 * SERVER-SIDE from the session/context, never from model output." Every entry point into this layer
 * goes through here, and here the row is fetched with `.eq('doctor_id', …)` — so an id that is not
 * this doctor's simply resolves to null and the caller answers 404 (HASTA-IZOLASYON-01: a foreign
 * id must be indistinguishable from a non-existent one).
 *
 * The name is decrypted only for the confirm card's header (hasta adı + doğum tarihi, large), which
 * is the wrong-patient guard — the one thing the doctor must be able to check at a glance.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { bugunTRT, yasAyHesapla, type HastaOzeti } from './types'
import { dogumTarihiTara } from '@/lib/doktor/dosyaAlanTara'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try {
    return decrypt(v) || ''
  } catch {
    return ''
  }
}

/** `patients.name_encrypted` holds JSON (`{ ad }`) on newer rows and a bare string on older ones. */
export function hastaAdiCoz(nameEncrypted: string | null | undefined): string {
  const ham = coz(nameEncrypted)
  if (!ham) return 'Hasta'
  try {
    const o = JSON.parse(ham)
    if (o && typeof o === 'object') return String((o as { ad?: string }).ad || '').trim() || 'Hasta'
  } catch { /* plain string */ }
  return ham.trim() || 'Hasta'
}

export async function hastaOzetiGetir(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string | null | undefined
): Promise<HastaOzeti | null> {
  if (!doktorId || !patientId) return null
  const { data } = await supabase
    .from('patients')
    .select('id, name_encrypted, dob_encrypted, gender_encrypted')
    .eq('id', String(patientId))
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!data) return null
  const dogum = coz(data.dob_encrypted as string | null)
  let iso = /^\d{4}-\d{2}-\d{2}$/.test(dogum) ? dogum : null
  // Form satırı boşsa epikriz / SOAP / belge özetinden aynı "Doğum Tarihi" başlığını tara.
  if (!iso) iso = await dosyadanDogumTarihi(supabase, doktorId, String(data.id))
  return {
    id: String(data.id),
    ad: hastaAdiCoz(data.name_encrypted as string | null),
    dogumTarihi: iso,
    yasAy: yasAyHesapla(iso, bugunTRT()),
    cinsiyet: coz(data.gender_encrypted as string | null) || null,
  }
}

/** Doctor-scoped: notes + approved belge özetleri only — never another doctor's row. */
async function dosyadanDogumTarihi(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string
): Promise<string | null> {
  const { data: seanslar } = await supabase
    .from('sessions')
    .select('id')
    .eq('patient_id', patientId)
    .eq('doctor_id', doktorId)
    .limit(30)
  const seansIdler = (seanslar || []).map((s) => String(s.id))
  const [notlar, analiz, belgeler, intake] = await Promise.all([
    seansIdler.length
      ? supabase
          .from('notes')
          .select('content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani')
          .eq('doctor_id', doktorId)
          .in('session_id', seansIdler)
          .limit(20)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    supabase
      .from('belge_analizleri')
      .select('hekim_ozet, sonuc')
      .eq('patient_id', patientId)
      .eq('doctor_id', doktorId)
      .in('durum', ['onaylandi', 'muayene_onaylandi'])
      .limit(8),
    supabase
      .from('hasta_belgeler')
      .select('ai_ozet')
      .eq('patient_id', patientId)
      .eq('doctor_id', doktorId)
      .limit(12),
    supabase
      .from('hasta_intake_formlari')
      .select('form_data_encrypted')
      .eq('patient_id', patientId)
      .eq('doktor_id', doktorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const parca: string[] = []
  const formHam = intake.data?.form_data_encrypted ? coz(String(intake.data.form_data_encrypted)) : ''
  if (formHam) {
    try {
      const o = JSON.parse(formHam) as { dogumTarihi?: unknown }
      const d = typeof o.dogumTarihi === 'string' ? o.dogumTarihi.trim() : ''
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    } catch { /* düz metin */ }
    parca.push(formHam)
  }
  for (const n of notlar.data || []) {
    for (const k of ['content_subjektif', 'content_objektif', 'content_degerlendirme', 'content_plan', 'content_tani'] as const) {
      const v = (n as Record<string, unknown>)[k]
      if (v) parca.push(String(v))
    }
  }
  for (const a of analiz.data || []) {
    if (a.hekim_ozet) parca.push(String(a.hekim_ozet))
    const s = a.sonuc as { ozet?: string } | null
    if (s?.ozet) parca.push(s.ozet)
  }
  for (const b of belgeler.data || []) {
    if (b.ai_ozet) parca.push(typeof b.ai_ozet === 'string' ? b.ai_ozet : JSON.stringify(b.ai_ozet))
  }
  return dogumTarihiTara(parca.join('\n'))?.deger ?? null
}
