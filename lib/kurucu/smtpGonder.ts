/**
 * DENEME-BILDIRIM-02 (Kaan, 2026-11-08) — the ONE sender of the internal signup alerts: Kaan's own mailbox kaan@notya.io
 * (Purelymail; notya.io's SPF/DKIM already cover it), over SMTP with TLS. Türkiye build only: the mailbox password is set
 * on one Vercel project (notya-ai → Production, SMTP_PASS) and never on a country project. Country alerts reach this file
 * through /api/internal/signup-notify.
 *
 *   SMTP_HOST  default smtp.purelymail.com      SMTP_PORT  default 465 (implicit TLS)
 *   SMTP_USER  default kaan@notya.io            SMTP_PASS  Kaan sets it himself; until then every send is a logged no-op
 *
 * From and To are both kaan@notya.io, display name "Notya Bildirim". Never throws: the result says what happened, and the
 * callers log it. Timeouts are short (10 s) because the work runs after a doctor's response, never in front of it.
 */
import { createHash } from 'node:crypto'
import { BILDIRIM_ALICISI } from './denemeBildirimi'

export const SMTP_VARSAYILAN = { host: 'smtp.purelymail.com', port: 465, user: BILDIRIM_ALICISI } as const
export const BILDIRIM_GONDEREN_ADI = 'Notya Bildirim'

export type GonderimSonucu = { durum: 'gonderildi' | 'sifre-yok' | 'hata'; ayrinti?: string }

type Posta = { from: { name: string; address: string }; to: string; subject: string; text: string; html: string; messageId: string }
export type PostaTasiyici = { sendMail: (p: Posta) => Promise<unknown>; close?: () => void }
export type TasiyiciKur = (ayar: { host: string; port: number; secure: boolean; auth: { user: string; pass: string } }) => Promise<PostaTasiyici>

const nodemailerIle: TasiyiciKur = async (ayar) => {
  const { createTransport } = await import('nodemailer')
  return createTransport({
    ...ayar,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    tls: { minVersion: 'TLSv1.2', servername: ayar.host },
  })
}

export async function bildirimGonder(
  e: { konu: string; metin: string; html: string },
  tekrarAnahtari: string,
  ayar: { env?: Record<string, string | undefined>; tasiyiciKur?: TasiyiciKur } = {},
): Promise<GonderimSonucu> {
  const env = ayar.env ?? process.env
  const pass = env.SMTP_PASS
  if (!pass) return { durum: 'sifre-yok' }
  const host = (env.SMTP_HOST || SMTP_VARSAYILAN.host).trim()
  const port = Number(env.SMTP_PORT || SMTP_VARSAYILAN.port) || SMTP_VARSAYILAN.port
  const user = (env.SMTP_USER || SMTP_VARSAYILAN.user).trim()
  let tasiyici: PostaTasiyici | null = null
  try {
    tasiyici = await (ayar.tasiyiciKur ?? nodemailerIle)({ host, port, secure: port === 465, auth: { user, pass } })
    const kimlik = createHash('sha256').update(tekrarAnahtari).digest('hex').slice(0, 32)
    await tasiyici.sendMail({
      from: { name: BILDIRIM_GONDEREN_ADI, address: BILDIRIM_ALICISI },
      to: BILDIRIM_ALICISI,
      subject: e.konu,
      text: e.metin,
      html: e.html,
      messageId: `<deneme-${kimlik}@notya.io>`,
    })
    return { durum: 'gonderildi' }
  } catch (err) {
    // Only the error's class and SMTP code: never the message, which can echo the server's reply or credentials.
    const kod = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : ''
    return { durum: 'hata', ayrinti: [err instanceof Error ? err.name : 'smtp', kod].filter(Boolean).join(' ') }
  } finally {
    try { tasiyici?.close?.() } catch { /* nothing to do */ }
  }
}

/** One log line per outcome, the same wording from every caller. */
export function gonderimiGunlukle(s: GonderimSonucu): void {
  if (s.durum === 'sifre-yok') console.warn('[deneme-bildirim] SMTP_PASS is not set — trial signup recorded, e-mail not sent (DENEME-BILDIRIM-02).')
  else if (s.durum === 'hata') console.error('[deneme-bildirim] send failed', s.ayrinti)
}
