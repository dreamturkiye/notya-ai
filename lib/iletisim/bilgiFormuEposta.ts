/**
 * NOTYA-INTAKE-EPOSTA (2026-10-07) — the designed intake invitation for the doctor's connected mailbox.
 *
 * The connected mailbox sends multipart/alternative: the text part is exactly the compose-link text
 * (bilgiFormuSatirlari → metin), the HTML part carries the same lines. Deliverability rules, all deliberate:
 *   • no images at all (no background, no leaves, no logo, no tracking pixel) — image-heavy mail and
 *     background images are spam signals and Outlook does not render them
 *   • table layout, inline CSS only, system fonts, no <style>, no <script>, no web fonts
 *   • one link target, the real notya.io intake link; the full link is repeated as visible text under the button
 *   • small: a few KB
 * Pure and client-safe.
 */
import { bilgiFormuSatirlari, type SablonGirdisi } from './sablonlar'

export const RENK = { krem: '#FAF8F4', cam: '#0e6b66', murekkep: '#102428', soluk: '#5a7176', kart: '#ffffff', cizgi: '#e7e1d6' } as const

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const kacir = (s: string) => s.replace(/[&<>"']/g, (h) => ESC[h])

/** Only an https link to our own domain is ever put behind the button. */
export function bilgiFormuLinkiGecerliMi(link: string): boolean {
  try {
    const u = new URL(link)
    return u.protocol === 'https:' && (u.hostname === 'notya.io' || u.hostname.endsWith('.notya.io'))
  } catch {
    return false
  }
}

export type BilgiFormuEpostasi = { metin: string; html: string | null }

/**
 * Text + HTML for the intake invitation. `html` is null when the link is not our own https address (the mail then
 * goes as plain text only, never with a button pointing elsewhere).
 */
export function bilgiFormuEpostasi(g: SablonGirdisi & { link: string; muayenehaneAdi?: string | null }): BilgiFormuEpostasi {
  const s = bilgiFormuSatirlari(g, g.link.trim())
  if (!bilgiFormuLinkiGecerliMi(s.link)) return { metin: s.metin, html: null }
  const baslik = String(g.muayenehaneAdi || '').replace(/\s+/g, ' ').trim() || s.doktor || 'Notya'
  const altBilgi = s.doktor ? `Bu e-posta ${s.doktor} adına Notya üzerinden gönderildi.` : 'Bu e-posta muayenehaneniz adına Notya üzerinden gönderildi.'
  const font = 'font-family:Arial,Helvetica,sans-serif;'
  const p = (metin: string, ek = '') => `<p style="margin:0 0 16px;${font}font-size:16px;line-height:24px;color:${RENK.murekkep};${ek}">${kacir(metin)}</p>`
  const href = kacir(s.link)
  const html = [
    '<!DOCTYPE html>',
    '<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>Hasta Bilgi Formu</title></head>`,
    `<body style="margin:0;padding:0;background-color:${RENK.krem};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${RENK.krem};">`,
    '<tr><td align="center" style="padding:24px 12px;">',
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${RENK.kart};border:1px solid ${RENK.cizgi};border-radius:12px;">`,
    `<tr><td style="background-color:${RENK.cam};padding:18px 24px;border-radius:12px 12px 0 0;${font}font-size:18px;line-height:24px;font-weight:bold;color:#ffffff;">${kacir(baslik)}</td></tr>`,
    '<tr><td style="padding:24px;">',
    p(s.selam),
    p(s.giris),
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 12px;"><tr>',
    `<td align="center" bgcolor="${RENK.cam}" style="border-radius:8px;background-color:${RENK.cam};">`,
    `<a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;${font}font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Formu doldur</a>`,
    '</td></tr></table>',
    `<p style="margin:0 0 20px;${font}font-size:13px;line-height:20px;color:${RENK.soluk};word-break:break-all;"><a href="${href}" target="_blank" style="color:${RENK.cam};text-decoration:underline;">${href}</a></p>`,
    p(s.neden),
    p(s.gizlilik),
    p('Saygılarımızla,', 'margin:0;'),
    ...(s.doktor ? [p(s.doktor, 'margin:0;font-weight:bold;')] : []),
    '</td></tr></table>',
    `<p style="margin:16px 0 0;${font}font-size:12px;line-height:18px;color:${RENK.soluk};">${kacir(altBilgi)}</p>`,
    '</td></tr></table>',
    '</body></html>',
  ].join('\n')
  return { metin: s.metin, html }
}
