import type { SupabaseClient } from '@supabase/supabase-js'
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify'

const THROTTLE_MS = 30 * 60 * 1000

/**
 * Throttled WhatsApp ping to the doctor when a patient sends a portal message.
 * Never includes message body, patient name, or other PHI — Epic-style “open the portal” only.
 */
export async function pingDoctorNewMessage(
  sb: SupabaseClient,
  doctorId: string
): Promise<{ sent: boolean; reason?: string }> {
  const { data: doctor } = await sb
    .from('users')
    .select('whatsapp_number, whatsapp_enabled, mesaj_ping_at')
    .eq('id', doctorId)
    .maybeSingle()

  if (!doctor?.whatsapp_enabled || !doctor?.whatsapp_number) {
    return { sent: false, reason: 'whatsapp_off' }
  }

  const last = doctor.mesaj_ping_at ? new Date(doctor.mesaj_ping_at).getTime() : 0
  if (last && Date.now() - last < THROTTLE_MS) {
    return { sent: false, reason: 'throttled' }
  }

  const body =
    'Notya · Sağlığım: Yeni hasta mesajınız var. Panele girip Mesajlar’dan yanıtlayın. (Mesaj içeriği güvenlik için burada gösterilmez.)'

  const result = await sendTwilioMessage({
    channel: 'whatsapp',
    toPhone: String(doctor.whatsapp_number),
    body,
  })

  if (!result.ok) {
    return { sent: false, reason: result.error }
  }

  await sb.from('users').update({ mesaj_ping_at: new Date().toISOString() }).eq('id', doctorId)
  return { sent: true }
}
