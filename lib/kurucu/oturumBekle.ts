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
