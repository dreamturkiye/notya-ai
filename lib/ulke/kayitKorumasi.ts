/**
 * AU-ACIK-KAYIT-01 (Kaan, 2026-11-05) — the protections of a country's sign-up route (app/api/ulke/kayit) once sign-up
 * can be open (`uygulama.kayitAcik: true`, no invitation code): a per-IP attempt limit, and the address the email
 * confirmation link returns to.
 *
 * The limit is in memory, per server instance (the same simple limiter the patient page uses, lib/mali/portalRateLimit.ts):
 * it slows a script down, it is not a guarantee. The auth service's own limits on account emails stay in force behind it.
 *
 * Pure apart from the limiter's memory; no network, no database.
 */
import { checkRateLimit } from '@/lib/mali/portalRateLimit'

/** Sign-up attempts one address may make in one window. Generous enough for a practice behind one shared address. */
export const KAYIT_IP_SINIRI = 10
export const KAYIT_IP_PENCERESI_MS = 60 * 60 * 1000

type BaslikOkuyan = { get(ad: string): string | null }

/**
 * The caller's address as the hosting network reports it (first hop of x-forwarded-for, then x-real-ip); null = none
 * reported. On the hosting network every request carries it (the network sets it; a caller cannot remove it).
 */
export function istemciIp(basliklar: BaslikOkuyan): string | null {
  const ilk = basliklar.get('x-forwarded-for')?.split(',')[0]?.trim()
  return ilk || basliklar.get('x-real-ip')?.trim() || null
}

/**
 * true = this address may try once more now (the attempt is counted). A request with no reported address (a local
 * test harness — never a request through the hosting network) is not counted.
 */
export function kayitDenemesiIzinli(ip: string | null): boolean {
  if (!ip) return true
  return checkRateLimit(`ulke-kayit:${ip}`, KAYIT_IP_SINIRI, KAYIT_IP_PENCERESI_MS).allowed
}

const YEREL = /^(localhost|127\.0\.0\.1)(:\d+)?$/

/**
 * Where the confirmation link in the sign-up email may return to: ONLY this site's own sign-in page (same host as the
 * request, https, a path ending in /login; its query — the founding plan — is kept). Anything else = undefined, and the
 * auth service uses its own default address. Never an open redirect.
 */
export function onayDonusAdresi(ham: unknown, host: string | null | undefined): string | undefined {
  if (typeof ham !== 'string' || !host || ham.length > 500) return undefined
  let u: URL
  try { u = new URL(ham) } catch { return undefined }
  if (u.host !== host) return undefined
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && YEREL.test(u.host))) return undefined
  if (!/\/login$/.test(u.pathname) || u.username || u.password || u.hash) return undefined
  return u.toString()
}
