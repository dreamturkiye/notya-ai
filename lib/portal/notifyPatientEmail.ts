import type { SupabaseClient } from '@supabase/supabase-js'
import { saglikimMesajiKuyrugaEkle } from '@/lib/iletisim/sunucu'

function appBaseUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, '')
}

/**
 * Prefer an existing unexpired PIN-gated portal token for this patient.
 * Does not auto-mint: a new link would create a PIN the patient never received.
 * Doctor must create the link (and share PIN) via Hasta Portalı first.
 */
export async function ensurePatientPortalUrl(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string
): Promise<string | null> {
  const { data: existing } = await sb
    .from('hasta_portal_tokens')
    .select('token_hash, expires_at, pin_hash')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .gt('expires_at', new Date().toISOString())
    .not('pin_hash', 'is', null)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.token_hash) {
    return `${appBaseUrl()}/portal/hasta/${existing.token_hash}/mesajlar`
  }

  return null
}

/**
 * The practice wrote to the patient in Sağlığım → a "Sağlığım'da yeni mesajınız var" item in the
 * doctor's Hazır mesajlar queue (NOTYA-ILETISIM-01). The doctor or the secretary opens it in their
 * OWN WhatsApp / mail with one tap. This used to send a Resend email from a Notya address; Resend is
 * retired for patient mail. One item per thread (or patient) per day — repeated messages never
 * pile up. No message body or clinical text ever leaves Sağlığım.
 *
 * Name kept so the ~35 existing callers (Mesajlar, konsültasyon, aşı and every branş kohort
 * hatırlatma) switch over without touching each one. Never throws.
 */
export async function notifyPatientNewPracticeMessage(
  sb: SupabaseClient,
  opts: { doctorId: string; patientId: string; konuId?: string | null }
): Promise<{ sent: boolean; queued: boolean; reason?: string }> {
  try {
    const eklenen = await saglikimMesajiKuyrugaEkle(sb, opts)
    return { sent: false, queued: eklenen > 0, reason: eklenen > 0 ? undefined : 'zaten_kuyrukta_veya_tablo_yok' }
  } catch {
    return { sent: false, queued: false, reason: 'kuyruk_hatasi' }
  }
}
