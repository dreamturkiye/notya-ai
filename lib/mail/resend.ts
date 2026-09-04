/**
 * Thin Resend HTTP client — no SDK dependency.
 * No-ops cleanly when RESEND_API_KEY is missing (SMTP still founder-blocked for signup,
 * but transactional patient mail can use Resend once the key + from-domain are set).
 */

export type SendMailResult =
  | { ok: true; id: string }
  | { ok: false; reason: string }

export async function sendResendEmail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<SendMailResult> {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) return { ok: false, reason: 'resend_unconfigured' }

  const fromEmail = String(process.env.RESEND_FROM_EMAIL || 'merhaba@notya.ai').trim()
  const fromName = String(process.env.RESEND_FROM_NAME || 'Notya · Sağlığım').trim()
  const from = `${fromName} <${fromEmail}>`

  const to = String(opts.to || '').trim()
  if (!to.includes('@')) return { ok: false, reason: 'invalid_to' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html || undefined,
      }),
    })
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) {
      return { ok: false, reason: json.message || `resend_${res.status}` }
    }
    return { ok: true, id: String(json.id || '') }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'resend_error' }
  }
}
