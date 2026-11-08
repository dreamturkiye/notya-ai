/**
 * KURUCU-KONSOL-02 (Kaan, 2026-11-08) — the founder console decides "console or 404" only after the browser session has
 * had time to hydrate, and never on a single stale token.
 *
 * 2026-11-08 ~12:25 UTC: notya.io/kurucu showed the 404 page to Kaan in Safari. Supabase edge logs show NO auth call
 * (/auth/v1/user or /auth/v1/token) in that window, so the page found no stored session on that origin and decided on
 * the spot. Two things made that fragile and are fixed here:
 *   1. the session was read exactly once, at mount — a login that is still being written (another tab, the login page
 *      redirect, Safari restoring storage) was never seen;
 *   2. a token the client still thinks is fresh but the server rejects (revoked, rotated) went straight to 404 without
 *      one forced refresh.
 * Pure and dependency-injected so the hydration/token path is unit-tested (lib/kurucu/kurucu.test.ts). No login prompt and
 * no hint that the page exists: anyone without an allowed session still ends on the standard not-found page.
 */

export type KurucuSonuc<T> = { tur: 'yok' } | { tur: 'hata' } | { tur: 'tamam'; veri: T }

export type KurucuYanit = { status: number; ok: boolean; json: () => Promise<unknown> }

/** Offsets (ms from mount) at which the stored session is read again while none is found. ~2.6 s in total, local only. */
export const OTURUM_BEKLEME_ADIMLARI: readonly number[] = [0, 100, 200, 300, 500, 600, 900]

export async function oturumTokeniniBekle(
  tokenAl: () => Promise<string | null>,
  bekle: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  adimlar: readonly number[] = OTURUM_BEKLEME_ADIMLARI,
  iptalMi: () => boolean = () => false,
): Promise<string | null> {
  for (const ms of adimlar) {
    if (ms > 0) await bekle(ms)
    if (iptalMi()) return null
    const t = await tokenAl().catch(() => null)
    if (t) return t
  }
  return null
}

export async function kurucuVerisiniAl<T>(d: {
  tokenAl: (opts?: { forceRefresh?: boolean }) => Promise<string | null>
  getir: (token: string) => Promise<KurucuYanit>
  bekle?: (ms: number) => Promise<void>
  adimlar?: readonly number[]
  iptalMi?: () => boolean
}): Promise<KurucuSonuc<T>> {
  const token = await oturumTokeniniBekle(() => d.tokenAl(), d.bekle, d.adimlar, d.iptalMi)
  if (!token) return { tur: 'yok' }
  try {
    let r = await d.getir(token)
    if (r.status === 404) {
      // One forced refresh: a token that looks fresh to the browser may already be revoked or rotated on the server.
      const yeni = await d.tokenAl({ forceRefresh: true }).catch(() => null)
      if (yeni && yeni !== token) r = await d.getir(yeni)
    }
    if (r.status === 404) return { tur: 'yok' }
    if (!r.ok) return { tur: 'hata' }
    return { tur: 'tamam', veri: (await r.json()) as T }
  } catch {
    return { tur: 'hata' }
  }
}

/**
 * KURUCU-KONSOL-03 (2026-11-08) — the real cause of the founder 404: notya.io and www.notya.io are two browser origins
 * with two separate localStorage stores (both domains serve the app, no redirect between them). Kaan's current Mac Safari
 * session was created by a password login on https://www.notya.io (Supabase edge log, 2026-11-05 10:48 UTC, referer www)
 * and last refreshed there (13:50 UTC); https://notya.io/kurucu reads the apex store, finds nothing, and never calls the API.
 *
 * So when THIS origin holds no session at all, the console hops once to the sibling origin (notya.io <-> www.notya.io)
 * and decides there. The '#h' fragment marks the hop (never sent to the server) so it can never loop. Any other host
 * (preview, localhost) and any visitor whose session was read but refused go straight to not-found. Same 404 at the end
 * for everyone without an allowed session; no login prompt, no text.
 */
export const KARDES_ISARETI = '#h'
const KARDES: Readonly<Record<string, string>> = { 'notya.io': 'www.notya.io', 'www.notya.io': 'notya.io' }

export function kardesKokAdresi(href: string, tokenGoruldu: boolean): string | null {
  if (tokenGoruldu) return null
  let u: URL
  try { u = new URL(href) } catch { return null }
  if (u.protocol !== 'https:' || u.hash === KARDES_ISARETI) return null
  const kardes = KARDES[u.hostname.toLowerCase()]
  if (!kardes) return null
  return `https://${kardes}${u.pathname}${KARDES_ISARETI}`
}
