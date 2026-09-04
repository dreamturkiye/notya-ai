import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { sendResendEmail } from '@/lib/mail/resend'

function appBaseUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app').replace(/\/$/, '')
}

async function patientEmail(sb: SupabaseClient, patientId: string): Promise<string | null> {
  const { data } = await sb
    .from('patients')
    .select('email_encrypted')
    .eq('id', patientId)
    .maybeSingle()
  if (!data?.email_encrypted) return null
  try {
    const raw = decrypt(data.email_encrypted).trim()
    if (!raw.includes('@')) return null
    return raw
  } catch {
    return null
  }
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
 * Email the patient when practice sends/replies. No message body / clinical text in the mail.
 * Doctor/sekreter stay on in-app Mesajlar only for this path.
 */
export async function notifyPatientNewPracticeMessage(
  sb: SupabaseClient,
  opts: { doctorId: string; patientId: string }
): Promise<{ sent: boolean; reason?: string }> {
  const email = await patientEmail(sb, opts.patientId)
  if (!email) return { sent: false, reason: 'no_email' }

  const portalUrl = await ensurePatientPortalUrl(sb, opts.doctorId, opts.patientId)
  if (!portalUrl) return { sent: false, reason: 'no_portal_link' }

  const subject = 'Notya · Sağlığım — yeni mesajınız var'
  const text = [
    'Doktorunuz / klinik ekibiniz Sağlığım üzerinden size bir mesaj gönderdi.',
    '',
    'Mesaj içeriği güvenlik nedeniyle e-postada gösterilmez.',
    'Okumak ve yanıtlamak için portalınıza girin (doktorunuzun verdiği 6 haneli PIN gerekir):',
    portalUrl,
    '',
    'Acil durumda 112’yi veya muayenehaneyi arayın — portal mesajları acil değildir.',
    '',
    'Notya · Sağlığım',
  ].join('\n')

  const html = `
    <p>Doktorunuz / klinik ekibiniz <strong>Sağlığım</strong> üzerinden size bir mesaj gönderdi.</p>
    <p>Mesaj içeriği güvenlik nedeniyle e-postada gösterilmez.</p>
    <p><a href="${portalUrl}">Portalınıza girip mesajı okuyun</a> — doktorunuzun verdiği 6 haneli PIN gerekir.</p>
    <p style="color:#666;font-size:13px">Acil durumda 112’yi veya muayenehaneyi arayın — portal mesajları acil değildir.</p>
  `

  const result = await sendResendEmail({ to: email, subject, text, html })
  if (!result.ok) return { sent: false, reason: result.reason }
  return { sent: true }
}
