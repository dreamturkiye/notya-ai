/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — country port of the Türkiye fix: THE one authenticated request path of the
 * country application (every screen, every role).
 *
 *   ulkeFetch(url, init)  = fetch + the CURRENT access token of the deployment's own Supabase session (the SDK
 *                           singleton in ./istemciSupabase refreshes it; it is the only refresher). On a 401:
 *                           refreshSession() once, retry once. A session that cannot be renewed → `ulkeOturumDoldu()`:
 *                           the login page with `?oturum=expired&next=<this page>` and the notice in the account's
 *                           language (components/ulke/oturumDolduMetinleri.ts); after signing in the doctor comes back.
 *                           A refresh that failed on the network is not an expired session: nobody is logged out
 *                           because a laptop woke up offline.
 * Before: the shell cached the token in a ref, sent the stale one when getSession failed, and signed the account out on
 * the first 401 with no way back to the page. Do not build `Authorization: Bearer …` anywhere else
 * (lib/ulke/oturumFetch.test.ts guards it). Server-side checks and cross-doctor isolation are unchanged.
 */
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { ulkeIstemciSupabase } from './istemciSupabase'
import { ulkeYolOnEki, ulkeYolu } from './yol'

export type UlkeJeton = { durum: 'tamam'; jeton: string } | { durum: 'gecici' } | { durum: 'bitti' }

export const ULKE_OTURUM_PARAM = 'oturum'
export const ULKE_OTURUM_DEGER = 'expired'

/** The current token, refreshed by the SDK when needed. `zorla` = a server just refused it: refresh now. */
export async function ulkeJetonCoz(zorla = false): Promise<UlkeJeton> {
  const sb = ulkeIstemciSupabase()
  if (!sb) return { durum: 'bitti' }
  try {
    const { data, error } = zorla ? await sb.auth.refreshSession() : await sb.auth.getSession()
    if (data.session?.access_token) return { durum: 'tamam', jeton: data.session.access_token }
    if (error && isAuthRetryableFetchError(error)) return { durum: 'gecici' }
    return { durum: 'bitti' }
  } catch (e) {
    return isAuthRetryableFetchError(e) ? { durum: 'gecici' } : { durum: 'bitti' }
  }
}

function tekrarGonderilebilir(init?: RequestInit): boolean {
  return !(typeof ReadableStream !== 'undefined' && init?.body instanceof ReadableStream)
}

function basliklaIstek(init: RequestInit | undefined, jeton: string): RequestInit {
  const h = new Headers(init?.headers)
  h.set('Authorization', 'Bearer ' + jeton)
  return { cache: 'no-store', ...init, headers: h }
}

/** Builds ulkeFetch around injected parts (tests); the app uses the default instance below. */
export function ulkeOturumluFetchKur(k: { jetonCoz: (zorla?: boolean) => Promise<UlkeJeton>; fetch: typeof fetch; oturumBitti: () => void }) {
  return async function ulkeOturumluFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const ilk = await k.jetonCoz()
    if (ilk.durum === 'bitti') { k.oturumBitti(); return new Response('{"error":"session expired"}', { status: 401, headers: { 'Content-Type': 'application/json' } }) }
    if (ilk.durum === 'gecici') throw new TypeError('Failed to fetch')
    const yanit = await k.fetch(input, basliklaIstek(init, ilk.jeton))
    if (yanit.status !== 401 || !tekrarGonderilebilir(init)) return yanit
    const yeni = await k.jetonCoz(true)
    if (yeni.durum === 'bitti') { k.oturumBitti(); return yanit }
    if (yeni.durum !== 'tamam' || yeni.jeton === ilk.jeton) return yanit
    return k.fetch(input, basliklaIstek(init, yeni.jeton))
  }
}

/** `raw` when it is an internal path of THIS country build (under its path prefix), otherwise null. */
export function ulkeGuvenliNext(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const v = raw.trim()
  if (!v || v.length > 1024) return null
  let cozulmus = v
  try { cozulmus = decodeURIComponent(v) } catch { return null }
  for (const a of [v, cozulmus]) {
    if (!a.startsWith('/') || a.startsWith('//') || a.includes('\\') || /[\u0000-\u001f\u007f]/.test(a)) return null
  }
  let yol: string
  try {
    const u = new URL(v, 'https://notya.invalid')
    if (u.origin !== 'https://notya.invalid') return null
    yol = u.pathname + u.search + u.hash
  } catch { return null }
  const onEk = ulkeYolOnEki()
  if (onEk && yol !== onEk && !yol.startsWith(onEk + '/') && !yol.startsWith(onEk + '?')) return null
  const giris = ulkeYolu('/login')
  if (yol === giris || yol.startsWith(giris + '?') || yol.startsWith(giris + '/')) return null
  return yol
}

/** Login address for an expired session on `yol`. */
export function ulkeGirisYolu(yol: string | null | undefined): string {
  const q = new URLSearchParams()
  q.set(ULKE_OTURUM_PARAM, ULKE_OTURUM_DEGER)
  const next = ulkeGuvenliNext(yol)
  if (next) q.set('next', next)
  return `${ulkeYolu('/login')}?${q.toString()}`
}

/** What the login form reads from its own query string. */
export function ulkeGirisSorgusu(search: string): { next: string | null; doldu: boolean } {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return { next: ulkeGuvenliNext(q.get('next')), doldu: q.get(ULKE_OTURUM_PARAM) === ULKE_OTURUM_DEGER }
}

let yonlendiriliyor = false

/** The session cannot be renewed: clear it locally and go to the login page, coming back here afterwards. */
export function ulkeOturumDoldu(): void {
  if (typeof window === 'undefined' || yonlendiriliyor) return
  yonlendiriliyor = true
  const hedef = ulkeGirisYolu(window.location.pathname + window.location.search + window.location.hash)
  const sb = ulkeIstemciSupabase()
  void Promise.resolve(sb?.auth.signOut({ scope: 'local' })).catch(() => undefined).finally(() => window.location.assign(hedef))
}

export const ulkeFetch = ulkeOturumluFetchKur({
  jetonCoz: (z) => ulkeJetonCoz(z),
  fetch: (...a) => fetch(...a),
  oturumBitti: () => ulkeOturumDoldu(),
})

let canli = false
/**
 * Keeps the session alive while a tab is open. The SDK already refreshes before expiry and on visibilitychange;
 * this adds the return of the network (a laptop that slept offline through the expiry refreshes as soon as it is
 * back online) and makes sure the auto-refresh is running.
 */
export function ulkeOturumuCanliTut(): void {
  if (canli || typeof window === 'undefined') return
  canli = true
  const sb = ulkeIstemciSupabase()
  if (!sb) return
  const uyan = () => { void sb.auth.startAutoRefresh().catch(() => undefined); void sb.auth.getSession().catch(() => undefined) }
  window.addEventListener('online', uyan)
  uyan()
}
