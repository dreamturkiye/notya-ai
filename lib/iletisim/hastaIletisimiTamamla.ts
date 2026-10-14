/**
 * NOTYA-INTAKE-EMAIL-01 — the WRITE half of "hasta kartında e-posta yoksa randevudaki e-postayı kullan".
 *
 * `hastaIletisimi` (lib/iletisim/sunucu.ts) only READS: when the patient card has no e-mail it answers with the
 * address typed on the patient's latest appointment and marks it `epostaRandevudan`. This helper is what the
 * message-preparing paths call (Hazır mesajlar, the iletişim kaydı route, Randevu V2 notifications): it reads the
 * same way and then saves that address on the empty card field, so "kayıtlı e-posta yok" does not come back.
 *
 * It lives in its own module on purpose. lib/iletisim/sunucu.ts is imported by code a chat / voice model turn runs
 * through (takip → Fısıltı → Ayşe's read tools), and NOTYA-EYLEM-24 (core/eylemler/tests/sessizYol.test.ts) forbids
 * a write to a clinical table anywhere in that import graph. Do not import this file from that graph.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/security/encryption'
import { hastaIletisimi, type HastaIletisimi } from './sunucu'

export async function hastaIletisimiTamamla(
  sb: SupabaseClient,
  doktorId: string,
  patientId: string,
  doktorBransi?: string | null,
): Promise<HastaIletisimi | null> {
  const hasta = await hastaIletisimi(sb, doktorId, patientId, doktorBransi)
  if (!hasta) return null
  const { epostaRandevudan, ...sade } = hasta
  if (epostaRandevudan && sade.eposta.includes('@')) {
    const { error } = await sb
      .from('patients')
      .update({ email_encrypted: encrypt(sade.eposta), updated_at: new Date().toISOString() })
      .eq('id', patientId)
      .eq('doctor_id', doktorId)
    if (error) console.error('[iletisim] randevu e-posta → hasta:', error.message)
  }
  return sade
}
