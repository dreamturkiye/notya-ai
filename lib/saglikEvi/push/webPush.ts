/**
 * HASTA-PORTALI-GUNLUK — Web Push for Sağlığım (closes ESNEK-B-BILDIRIM for the patient portal). Server only.
 *
 * Implemented on node:crypto, no new dependency:
 *  - VAPID (RFC 8292): an ES256 JWT `{aud, exp, sub}` in `Authorization: vapid t=…, k=…`.
 *  - Message encryption (RFC 8291, content coding aes128gcm, RFC 8188): ECDH P-256 with the browser's p256dh key,
 *    HKDF with the browser's auth secret, one record.
 * Keys come from the environment: NOTYA_VAPID_PUBLIC_KEY (base64url, 65-byte uncompressed point), NOTYA_VAPID_PRIVATE_KEY
 * (base64url, 32-byte scalar), NOTYA_VAPID_SUBJECT (mailto: or https: URL). Without them push is simply off.
 *
 * Privacy: the payload never carries a medicine name, a value or a diagnosis — only a generic line and a portal path.
 * Every send has a 10 s timeout (performans-butcesi-koruma: no external call without one); 404/410 means the browser
 * dropped the subscription and the caller deletes it.
 */
import { createECDH, createHmac, createCipheriv, createPrivateKey, randomBytes, sign as imzala, generateKeyPairSync, type KeyObject } from 'node:crypto'

export const PUSH_ZAMAN_ASIMI_MS = 10_000

export const b64u = {
  kodla: (b: Buffer | Uint8Array) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  coz: (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4), 'base64'),
}

export interface VapidAnahtarlari { acik: string; gizli: string; konu: string }

export function vapidAnahtarlari(env: Record<string, string | undefined> = process.env): VapidAnahtarlari | null {
  const acik = env.NOTYA_VAPID_PUBLIC_KEY?.trim(), gizli = env.NOTYA_VAPID_PRIVATE_KEY?.trim()
  if (!acik || !gizli) return null
  return { acik, gizli, konu: env.NOTYA_VAPID_SUBJECT?.trim() || 'https://www.notya.io' }
}

/** One-off helper (scripts / tests): a fresh VAPID key pair in the env formats above. */
export function vapidUret(): { acik: string; gizli: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwkO = privateKey.export({ format: 'jwk' }) as { d: string }
  const jwkA = publicKey.export({ format: 'jwk' }) as { x: string; y: string }
  return { gizli: jwkO.d, acik: b64u.kodla(Buffer.concat([Buffer.from([4]), b64u.coz(jwkA.x), b64u.coz(jwkA.y)])) }
}

function vapidOzelAnahtar(v: VapidAnahtarlari): KeyObject {
  const nokta = b64u.coz(v.acik)
  if (nokta.length !== 65 || nokta[0] !== 4) throw new Error('vapid: public key must be a 65-byte uncompressed point')
  return createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: v.gizli, x: b64u.kodla(nokta.subarray(1, 33)), y: b64u.kodla(nokta.subarray(33, 65)) }, format: 'jwk' })
}

/** The VAPID Authorization header for one push service origin. */
export function vapidBasligi(endpoint: string, v: VapidAnahtarlari, simdiSn = Math.floor(Date.now() / 1000)): string {
  const aud = new URL(endpoint).origin
  const bas = b64u.kodla(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const govde = b64u.kodla(Buffer.from(JSON.stringify({ aud, exp: simdiSn + 12 * 3600, sub: v.konu })))
  const imza = imzala('sha256', Buffer.from(`${bas}.${govde}`), { key: vapidOzelAnahtar(v), dsaEncoding: 'ieee-p1363' })
  return `vapid t=${bas}.${govde}.${b64u.kodla(imza)}, k=${v.acik}`
}

const hmac = (anahtar: Buffer, veri: Buffer) => createHmac('sha256', anahtar).update(veri).digest()

/** RFC 8291 message encryption. `tuz` / `sunucuAnahtari` are injectable for tests only. */
export function sifrele(icerik: Buffer, p256dh: string, auth: string, test?: { tuz?: Buffer; sunucuOzel?: Buffer }): Buffer {
  const uaAcik = b64u.coz(p256dh)
  const authSirri = b64u.coz(auth)
  if (uaAcik.length !== 65 || authSirri.length < 16) throw new Error('push: bad subscription keys')
  const ecdh = createECDH('prime256v1')
  if (test?.sunucuOzel) ecdh.setPrivateKey(test.sunucuOzel)
  else ecdh.generateKeys()
  const asAcik = ecdh.getPublicKey()
  const ortak = ecdh.computeSecret(uaAcik)
  const prkKey = hmac(authSirri, ortak)
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaAcik, asAcik, Buffer.from([1])]))
  const tuz = test?.tuz ?? randomBytes(16)
  const prk = hmac(tuz, ikm)
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16)
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12)
  const c = createCipheriv('aes-128-gcm', cek, nonce)
  const sifreli = Buffer.concat([c.update(Buffer.concat([icerik, Buffer.from([2])])), c.final(), c.getAuthTag()])
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096)
  return Buffer.concat([tuz, rs, Buffer.from([asAcik.length]), asAcik, sifreli])
}

export interface PushAboneligi { endpoint: string; p256dh: string; auth: string }

/** The notification the service worker shows. Generic words only (no PHI). */
export interface PushIcerigi { baslik: string; govde: string; yol: string; etiket: string }

export type PushSonucu = { ok: true } | { ok: false; sil: boolean; durum: number | null; hata: string }

export async function pushGonder(a: PushAboneligi, icerik: PushIcerigi, v: VapidAnahtarlari, o: { fetch?: typeof fetch; ttlSn?: number; acil?: boolean } = {}): Promise<PushSonucu> {
  let govde: Buffer
  try { govde = sifrele(Buffer.from(JSON.stringify(icerik)), a.p256dh, a.auth) } catch (e) { return { ok: false, sil: true, durum: null, hata: (e as Error).message } }
  try {
    const r = await (o.fetch ?? fetch)(a.endpoint, {
      method: 'POST',
      headers: { Authorization: vapidBasligi(a.endpoint, v), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: String(o.ttlSn ?? 3600), Urgency: o.acil ? 'high' : 'normal' },
      body: new Uint8Array(govde),
      signal: AbortSignal.timeout(PUSH_ZAMAN_ASIMI_MS),
    })
    if (r.status >= 200 && r.status < 300) return { ok: true }
    return { ok: false, sil: r.status === 404 || r.status === 410, durum: r.status, hata: `http_${r.status}` }
  } catch (e) {
    return { ok: false, sil: false, durum: null, hata: (e as Error).name === 'TimeoutError' ? 'zaman_asimi' : 'ag' }
  }
}

/** Only https endpoints of real push services are stored (no internal hosts). */
export function abonelikGecerliMi(x: unknown): x is PushAboneligi {
  const a = x as PushAboneligi
  if (!a || typeof a.endpoint !== 'string' || typeof a.p256dh !== 'string' || typeof a.auth !== 'string') return false
  try {
    const u = new URL(a.endpoint)
    if (u.protocol !== 'https:' || a.endpoint.length > 1024) return false
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname) || u.hostname.endsWith('.internal')) return false
  } catch { return false }
  return b64u.coz(a.p256dh).length === 65 && b64u.coz(a.auth).length >= 16
}
