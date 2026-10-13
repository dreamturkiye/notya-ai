/**
 * NOTYA-ULKE-PORTAL-01 — the secrets of a portal link. SERVER ONLY.
 *
 *   token         256 random bits. Shown ONCE, to the doctor, inside the link. The database holds its SHA-256 only:
 *                 a fast hash is right for a value nobody can guess.
 *   PIN           six random digits. Read or sent to the patient by the doctor. The database holds a SLOW, salted
 *                 hash only (scrypt): a PIN has few possible values, so whoever saw the database must still pay for
 *                 every guess — and the link locks after a handful of wrong tries (lib/ulke/portal/giris.ts).
 *   session key   256 random bits in the patient's browser (an HttpOnly cookie). The database holds its SHA-256.
 *
 * Nothing here is ever logged. No dependency: node:crypto only.
 */
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { ANAHTAR_BICIMI, PIN_HANE, pinBicimiGecerli } from './sabitler'

const N = 16384, R = 8, P = 1, UZUNLUK = 32
const turet = (pin: string, tuz: Buffer, n: number, r: number, p: number, uzunluk: number) =>
  new Promise<Buffer>((coz, ret) => scrypt(pin, tuz, uzunluk, { N: n, r, p }, (e, k) => (e ? ret(e) : coz(k))))

/** A new token or session key: 256 random bits, base64url. */
export const anahtarUret = (): string => randomBytes(32).toString('base64url')
export const anahtarMi = (ham: unknown): ham is string => typeof ham === 'string' && ANAHTAR_BICIMI.test(ham)
/** SHA-256 (hex) of a token or a session key: what the database stores and looks up by. */
export const anahtarHash = (anahtar: string): string => createHash('sha256').update(anahtar, 'utf8').digest('hex')

/** A new PIN: uniformly random digits, leading zeros kept. */
export const pinUret = (): string => String(randomInt(0, 10 ** PIN_HANE)).padStart(PIN_HANE, '0')

/** The PIN as it is stored: `scrypt$N$r$p$salt$hash`. Never the PIN itself. */
export async function pinHashle(pin: string): Promise<string> {
  if (!pinBicimiGecerli(pin)) throw new Error('[ulke/portal] not a PIN')
  const tuz = randomBytes(16)
  const k = await turet(pin, tuz, N, R, P, UZUNLUK)
  return `scrypt$${N}$${R}$${P}$${tuz.toString('base64')}$${k.toString('base64')}`
}

/** true = `pin` is the PIN this hash was made from. Anything malformed is simply "no". */
export async function pinDogrula(pin: unknown, hash: unknown): Promise<boolean> {
  if (!pinBicimiGecerli(pin) || typeof hash !== 'string') return false
  const [ad, n, r, p, tuz64, k64] = hash.split('$')
  if (ad !== 'scrypt' || !tuz64 || !k64) return false
  const sayi = [Number(n), Number(r), Number(p)]
  // Only parameters this file could have written: a stored value never chooses how much work a request does.
  if (sayi[0] !== N || sayi[1] !== R || sayi[2] !== P) return false
  try {
    const beklenen = Buffer.from(k64, 'base64')
    if (beklenen.length !== UZUNLUK) return false
    const gelen = await turet(pin, Buffer.from(tuz64, 'base64'), N, R, P, UZUNLUK)
    return timingSafeEqual(gelen, beklenen)
  } catch {
    return false
  }
}
