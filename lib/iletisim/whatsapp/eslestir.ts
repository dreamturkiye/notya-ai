/**
 * WHATSAPP-API-01 — inbound number → patient(s), scoped to the doctor who OWNS the WhatsApp number.
 *
 * HASTA-IZOLASYON-01: the doctor comes from the connection row found by the webhook's phone_number_id — never from the
 * payload's sender, never from anything the patient wrote. Candidates are read with doctor_id AND is_active; a number that
 * also belongs to another doctor's patient is invisible here by construction (there is no plaintext phone index to query
 * across doctors — the compare is decrypt-and-match inside this doctor's roster, the same pattern as lib/iletisim/kalkan
 * and the SMS STOP webhook).
 *
 * The phone number is normalised with whatsappNumarasi (Turkish spellings → 90XXXXXXXXXX; explicit international
 * prefixes accepted). Several patients can share a number (siblings on a parent's phone): the caller then gets all of
 * them and must NOT guess — automatic actions run only on exactly one match.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import { hastaAdiCoz } from '@/lib/iletisim/sunucu'

export interface EslesenHasta { id: string; ad: string; cocuk: boolean }
export type EslesmeTuru = 'bilinen_hasta' | 'veli' | 'coklu' | 'bilinmeyen'

/** Digits-only normal form used to compare two spellings of one number. */
export function numaraRakam(numara: string | null | undefined): string {
  const ham = String(numara || '')
  return whatsappNumarasi(ham) || ham.replace(/\D/g, '')
}

export async function hastalariEslestir(sb: SupabaseClient, doktorId: string, numara: string): Promise<{ eslesme: EslesmeTuru; hastalar: EslesenHasta[] }> {
  const hedef = numaraRakam(numara)
  if (!hedef) return { eslesme: 'bilinmeyen', hastalar: [] }
  const { data, error } = await sb.from('patients')
    .select('id, phone_encrypted, name_encrypted, dob_encrypted, is_active')
    .eq('doctor_id', doktorId).eq('is_active', true).limit(2000)
  if (error || !data) return { eslesme: 'bilinmeyen', hastalar: [] }
  const hastalar: EslesenHasta[] = []
  for (const p of data) {
    let tel = ''
    try { tel = decryptPII(String(p.phone_encrypted || '')) } catch { continue }
    if (!tel || numaraRakam(tel) !== hedef) continue
    let cocuk = false
    try {
      const dob = decryptPII(String(p.dob_encrypted || '')).slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) cocuk = (Date.now() - new Date(dob).getTime()) / (365.25 * 86_400_000) < 18
    } catch { /* no birth date */ }
    hastalar.push({ id: String(p.id), ad: hastaAdiCoz(p.name_encrypted) || 'Hasta', cocuk })
  }
  if (!hastalar.length) return { eslesme: 'bilinmeyen', hastalar }
  if (hastalar.length > 1) return { eslesme: 'coklu', hastalar }
  return { eslesme: hastalar[0].cocuk ? 'veli' : 'bilinen_hasta', hastalar }
}
