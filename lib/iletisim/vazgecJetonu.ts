/**
 * NOTYA-HASTA-ILETISIMI-01 — signed, no-expiry unsubscribe link. Same HMAC pattern as
 * lib/randevu/v2/jeton.ts / lib/portal/pinAuth.ts: HMAC-SHA256 over a typed payload with
 * PORTAL_TOKEN_SECRET, base64url, constant-time compare. No secret → no token (never a fallback
 * secret — a signed link that cannot be verified must not be handed out).
 *
 * Deliberately no expiry: an unsubscribe link in a years-old e-mail must still work.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { IletisimKanali } from './tipler'

export type VazgecIcerigi = { doktorId: string; patientId: string; kanal: IletisimKanali }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KANALLAR: readonly IletisimKanali[] = ['whatsapp', 'eposta', 'sms']

function gizliAnahtar(gizli?: string): string | null {
  const s = gizli ?? process.env.PORTAL_TOKEN_SECRET
  return s && s.trim() ? s : null
}

function imza(gizli: string, doktorId: string, patientId: string, kanal: string): string {
  return createHmac('sha256', gizli).update(`vazgec:${doktorId}|${patientId}|${kanal}`).digest('base64url')
}

/** true when unsubscribe links can be signed — callers check this BEFORE sending anything that must carry one. */
export function vazgecAnahtariVarMi(): boolean {
  return gizliAnahtar() !== null
}

/** null when the secret is not configured — the e-mail then carries no unsubscribe link (and so must not be sent — see kampanya.ts). */
export function vazgecJetonu(doktorId: string, patientId: string, kanal: IletisimKanali, gizli?: string): string | null {
  const g = gizliAnahtar(gizli)
  if (!g || !UUID.test(doktorId) || !UUID.test(patientId) || !KANALLAR.includes(kanal)) return null
  return `${doktorId}.${patientId}.${kanal}.${imza(g, doktorId, patientId, kanal)}`
}

export function vazgecJetonuCoz(jeton: string, gizli?: string): VazgecIcerigi | null {
  const g = gizliAnahtar(gizli)
  if (!g || typeof jeton !== 'string' || jeton.length > 300) return null
  const p = jeton.split('.')
  if (p.length !== 4) return null
  const [doktorId, patientId, kanal, gelenImza] = p
  if (!UUID.test(doktorId) || !UUID.test(patientId) || !KANALLAR.includes(kanal as IletisimKanali)) return null
  const beklenen = Buffer.from(imza(g, doktorId, patientId, kanal))
  const gelen = Buffer.from(gelenImza)
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null
  return { doktorId, patientId, kanal: kanal as IletisimKanali }
}

/** Public unsubscribe URL to embed in the footer of every bulk e-mail. null → do not send without one (vazgecKosulu). */
export function vazgecBaglantisi(doktorId: string, patientId: string, kanal: IletisimKanali, siteKoku = 'https://www.notya.io'): string | null {
  const jeton = vazgecJetonu(doktorId, patientId, kanal)
  return jeton ? `${siteKoku}/api/iletisim/vazgec/${jeton}` : null
}

/** STOP/DUR keywords checked against the inbound SMS body (trimmed, case-folded). */
export function vazgecKelimesiMi(govde: string): boolean {
  // tr-TR lower-casing turns a dotless "I" into "ı" ("IPTAL" → "ıptal"), which would silently miss an
  // opt-out typed in capitals on a Turkish keyboard — fold ı back to i, and ignore trailing punctuation.
  const t = String(govde || '').trim().toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[.!\s]+$/, '')
  return t === 'stop' || t === 'dur' || t === 'iptal'
}
