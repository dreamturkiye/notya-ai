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
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dogum) ? dogum : null
  return {
    id: String(data.id),
    ad: hastaAdiCoz(data.name_encrypted as string | null),
    dogumTarihi: iso,
    yasAy: yasAyHesapla(iso, bugunTRT()),
    cinsiyet: coz(data.gender_encrypted as string | null) || null,
  }
}
