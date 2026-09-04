import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

const PIN_LEN = 6
const UNLOCK_COOKIE = 'sagligim_unlock'
const UNLOCK_HOURS = 12
const SCRYPT_KEYLEN = 32

function portalSecret(): string {
  const s = process.env.PORTAL_TOKEN_SECRET
  if (!s) throw new Error('PORTAL_TOKEN_SECRET tanımlı değil')
  return s
}

/** Cryptographically random 6-digit PIN (000000–999999, zero-padded). */
export function generatePortalPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(PIN_LEN, '0')
}

export function isValidPortalPin(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

/** Store as saltHex:hashHex — never store plaintext. */
export function hashPortalPin(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, SCRYPT_KEYLEN)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPortalPin(pin: string, pinHash: string | null | undefined): boolean {
  if (!pinHash || !isValidPortalPin(pin)) return false
  const [saltHex, hashHex] = pinHash.split(':')
  if (!saltHex || !hashHex) return false
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = scryptSync(pin, salt, expected.length)
    if (actual.length !== expected.length) return false
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function unlockCookieValue(token: string, expiresMs: number): string {
  const payload = `${token}|${expiresMs}`
  const sig = createHmac('sha256', portalSecret()).update(`unlock:${payload}`).digest('base64url')
  return `${expiresMs}.${sig}`
}

export function verifyUnlockCookie(token: string, cookieVal: string | undefined): boolean {
  if (!cookieVal) return false
  const parts = cookieVal.split('.')
  if (parts.length !== 2) return false
  const expiresMs = Number(parts[0])
  if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) return false
  const expected = unlockCookieValue(token, expiresMs)
  try {
    const a = Buffer.from(cookieVal)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function readUnlockCookie(req: NextRequest, token: string): boolean {
  return verifyUnlockCookie(token, req.cookies.get(UNLOCK_COOKIE)?.value)
}

export function setUnlockCookie(res: NextResponse, token: string): void {
  const expiresMs = Date.now() + UNLOCK_HOURS * 60 * 60 * 1000
  const value = unlockCookieValue(token, expiresMs)
  res.cookies.set(UNLOCK_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/`,
    maxAge: UNLOCK_HOURS * 60 * 60,
  })
}

export function clearUnlockCookie(res: NextResponse): void {
  res.cookies.set(UNLOCK_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/`,
    maxAge: 0,
  })
}

export { UNLOCK_COOKIE }
