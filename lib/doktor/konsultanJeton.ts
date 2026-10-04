/**
 * KONSULTASYONLAR-01 — konsültan portalı jetonu. Randevu eylem jetonuyla aynı desen:
 * HMAC-SHA256 over typed payload, base64url, constant-time compare, PORTAL_TOKEN_SECRET.
 * Stateless: names exactly one sevk and expires. Grants nothing else — no portal login, no patient file.
 */
import { createHmac, createHash, timingSafeEqual, randomBytes } from 'crypto'

export type KonsultanJetonIcerigi = { sevkId: string; son: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Varsayılan: istemden 30 gün (BEKLEME_KIRMIZI_GUN ile uyumlu üst sınır). */
export const PORTAL_JETON_OMRU_GUN = 30

function gizliAnahtar(gizli?: string): string | null {
  const s = gizli ?? process.env.PORTAL_TOKEN_SECRET
  return s && s.trim() ? s : null
}

function imza(gizli: string, sevkId: string, son: number): string {
  return createHmac('sha256', gizli).update(`konsultan:${sevkId}|${son}`).digest('base64url')
}

/** Ham rastgele jeton gövdesi (e-posta linkinde taşınır); hash DB'de saklanır. */
export function portalJetonHam(): string {
  return randomBytes(32).toString('base64url')
}

export function portalJetonHash(ham: string): string {
  return createHash('sha256').update(ham).digest('hex')
}

/** HMAC biçimli jeton — randevu deseni. null = secret yok. */
export function konsultanJetonu(sevkId: string, son: number, gizli?: string): string | null {
  const g = gizliAnahtar(gizli)
  if (!g || !UUID.test(sevkId) || !Number.isFinite(son)) return null
  const s = Math.floor(son)
  return `${sevkId}.${s}.${imza(g, sevkId, s)}`
}

export function konsultanJetonuCoz(jeton: string, simdi: number = Date.now(), gizli?: string): KonsultanJetonIcerigi | null {
  const g = gizliAnahtar(gizli)
  if (!g || typeof jeton !== 'string' || jeton.length > 300) return null
  const p = jeton.split('.')
  if (p.length !== 3) return null
  const [sevkId, sonHam, gelenImza] = p
  const son = Number(sonHam)
  if (!UUID.test(sevkId) || !Number.isInteger(son) || son < simdi) return null
  const beklenen = Buffer.from(imza(g, sevkId, son))
  const gelen = Buffer.from(gelenImza)
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null
  return { sevkId, son }
}

export function portalJetonSonu(istemIso: string | null | undefined, omurGun: number = PORTAL_JETON_OMRU_GUN): number {
  const bas = istemIso && /^\d{4}-\d{2}-\d{2}/.test(istemIso)
    ? Date.parse(`${String(istemIso).slice(0, 10)}T00:00:00+03:00`)
    : Date.now()
  return (Number.isFinite(bas) ? bas : Date.now()) + omurGun * 86_400_000
}

export function konsultanPortalYolu(jeton: string, site?: string): string {
  const kok = String(site ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.notya.io').replace(/\/$/, '')
  return `${kok}/konsultan/${encodeURIComponent(jeton)}`
}
