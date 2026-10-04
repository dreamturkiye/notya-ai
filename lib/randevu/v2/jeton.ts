/**
 * NOTYA-RANDEVU-V2 — signed single-appointment links (Geliyorum / Ertele / İptal / Kabul) for e-mails.
 *
 * Same HMAC pattern as the Sağlığım unlock cookie (lib/portal/pinAuth.ts): HMAC-SHA256 over a typed payload
 * with PORTAL_TOKEN_SECRET, base64url, constant-time compare. Stateless: the link names exactly one
 * appointment and one action and expires the day after the appointment. It grants nothing else — no
 * portal, no other appointment, no patient data beyond that appointment's time and the doctor's name.
 * No secret → no links (never a fallback secret; see SITE-MAP "Portal yapılandırılmamış").
 */
import { createHmac, timingSafeEqual } from 'crypto'

/** 'teklif' (PR3): the id is a waitlist offer (randevu_bekleme_teklifleri.id), not an appointment. */
export type JetonEylemi = 'geliyorum' | 'ertele' | 'iptal' | 'kabul' | 'teklif'
const EYLEMLER: readonly JetonEylemi[] = ['geliyorum', 'ertele', 'iptal', 'kabul', 'teklif']

export type JetonIcerigi = { randevuId: string; eylem: JetonEylemi; son: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function gizliAnahtar(gizli?: string): string | null {
  const s = gizli ?? process.env.PORTAL_TOKEN_SECRET
  return s && s.trim() ? s : null
}

function imza(gizli: string, randevuId: string, eylem: string, son: number): string {
  return createHmac('sha256', gizli).update(`randevu:${randevuId}|${eylem}|${son}`).digest('base64url')
}

/** null when the secret is not configured — callers then send the e-mail without action links. */
export function randevuJetonu(randevuId: string, eylem: JetonEylemi, son: number, gizli?: string): string | null {
  const g = gizliAnahtar(gizli)
  if (!g || !UUID.test(randevuId) || !EYLEMLER.includes(eylem) || !Number.isFinite(son)) return null
  const s = Math.floor(son)
  return `${randevuId}.${eylem}.${s}.${imza(g, randevuId, eylem, s)}`
}

export function randevuJetonuCoz(jeton: string, simdi: number = Date.now(), gizli?: string): JetonIcerigi | null {
  const g = gizliAnahtar(gizli)
  if (!g || typeof jeton !== 'string' || jeton.length > 300) return null
  const p = jeton.split('.')
  if (p.length !== 4) return null
  const [randevuId, eylem, sonHam, gelenImza] = p
  const son = Number(sonHam)
  if (!UUID.test(randevuId) || !EYLEMLER.includes(eylem as JetonEylemi) || !Number.isInteger(son) || son < simdi) return null
  const beklenen = Buffer.from(imza(g, randevuId, eylem, son))
  const gelen = Buffer.from(gelenImza)
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null
  return { randevuId, eylem: eylem as JetonEylemi, son }
}

/** Links live until the end of the day after the appointment (Istanbul is ≥ UTC+3, so +36 h covers it). */
export function jetonSonu(baslangicIso: string): number {
  return Date.parse(baslangicIso) + 36 * 3_600_000
}
