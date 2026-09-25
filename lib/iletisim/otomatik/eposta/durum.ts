/**
 * NOTYA-ILETISIM-02 — the one-time "connect" round trip: PKCE pair + a signed `state`.
 *
 * `state` travels through Google/Microsoft and comes back on the callback URL, so it carries no
 * secret: only who started (doctor id), which provider, a random nonce and an expiry, HMAC-signed.
 * The PKCE verifier and the same nonce stay in an encrypted, httpOnly cookie on our own origin.
 * The callback accepts only when the signature is valid, not expired, the provider matches the
 * URL, and the cookie's nonce equals the state's — i.e. the same browser that pressed the button
 * (CSRF / login-CSRF defence).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'

export const DURUM_OMRU_MS = 10 * 60 * 1000
export const CEREZ_ADI = 'notya_eposta_baglan'
export const CEREZ_YOLU = '/api/iletisim/eposta'

export type DurumYuku = { d: string; s: string; n: string; e: number }

function anahtar(): Buffer {
  const ana = process.env.ENCRYPTION_MASTER_KEY
  if (!ana) throw new Error('ENCRYPTION_MASTER_KEY tanımlı değil')
  return createHash('sha256').update(`notya-iletisim-eposta-durum:${ana}`).digest()
}

function imza(govde: string): string {
  return createHmac('sha256', anahtar()).update(govde).digest('base64url')
}

export function pkceUret(): { dogrulayici: string; meydanOkuma: string } {
  const dogrulayici = randomBytes(32).toString('base64url') // 43 chars, RFC 7636 §4.1
  const meydanOkuma = createHash('sha256').update(dogrulayici).digest('base64url')
  return { dogrulayici, meydanOkuma }
}

export function nonceUret(): string {
  return randomBytes(16).toString('base64url')
}

export function durumImzala(v: { doktorId: string; saglayici: string; nonce: string }, simdi = Date.now()): string {
  const yuk: DurumYuku = { d: v.doktorId, s: v.saglayici, n: v.nonce, e: simdi + DURUM_OMRU_MS }
  const govde = Buffer.from(JSON.stringify(yuk), 'utf8').toString('base64url')
  return `${govde}.${imza(govde)}`
}

export function durumDogrula(durum: string | null | undefined, simdi = Date.now()): DurumYuku | null {
  if (!durum) return null
  const [govde, verilen, fazla] = durum.split('.')
  if (!govde || !verilen || fazla !== undefined) return null
  const beklenen = Buffer.from(imza(govde))
  const gelen = Buffer.from(verilen)
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null
  try {
    const yuk = JSON.parse(Buffer.from(govde, 'base64url').toString('utf8')) as DurumYuku
    if (typeof yuk.d !== 'string' || typeof yuk.s !== 'string' || typeof yuk.n !== 'string' || typeof yuk.e !== 'number') return null
    if (simdi > yuk.e) return null
    return yuk
  } catch {
    return null
  }
}

export function ayniNonceMi(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
