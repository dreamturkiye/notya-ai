/**
 * Doctor client auth — THE convention for reading the doctor's session in the browser.
 *
 * NOTYA-AUTH-01: every doctor page and component gets its token from this file and nothing else. Two bugs came
 * from pages inventing their own localStorage read: ILAC-04 (a component read the literal 'auth-token' key,
 * Supabase had stored the session under 'sb-<ref>-auth-token', the API got `Bearer null`) and the dashboard
 * itself, which read the token synchronously with no refresh.
 *
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — doctors were logged out ~1 hour after login ("Oturum geçersiz", reload did
 * not recover). Root cause: TWO independent refreshers used ONE Supabase refresh-token family.
 *   1. this file refreshed the copy in 'auth-token' over REST, ~60 s before expiry;
 *   2. the Supabase JS SDK's auto-refresh ticker refreshed the copy in 'sb-<ref>-auth-token' ~90 s before expiry.
 *      The login page's own createClient() kept ticking after the client-side navigation to the dashboard, and
 *      the muayene page created more default clients.
 * Supabase refresh tokens are single-use. The SDK spent the token first; this file then presented the spent one
 * (> 10 s later) → refresh-token reuse detection revoked the WHOLE session → every API call 401, no refresh
 * possible, a reload could not recover. The same race happened between two open tabs, and between parallel
 * callers in one tab.
 *
 * Fix, one refresher only:
 *   - this file is the single owner of the doctor session ('auth-token'); no doctor screen runs a persisting /
 *     auto-refreshing SDK client any more (login pages sign in with a non-persisting client, the muayene page's
 *     storage client takes its token from here — lib/doktor/doktorSupabase.ts);
 *   - a refresh runs under a cross-tab Web Lock, re-reads storage inside the lock (another tab may have refreshed
 *     already) and is shared by every caller in the tab (one network call);
 *   - `oturumuCanliTut()` keeps the session alive while a tab is open: a timer before expiry, plus a check on
 *     visibilitychange / online / focus (laptop sleep, backgrounded tab);
 *   - a refresh that fails because the network is down is TRANSIENT (session kept, retried); only a refusal by the
 *     auth server ends the session (`jetonCoz` → 'bitti') — that is the one case the app sends the doctor to login.
 * The SDK is deliberately not imported here: this module is in nearly every doctor route's bundle and the SDK
 * would add ~23–54 kB gzip per route (performans-butcesi-koruma ceiling is 10 kB).
 *
 * Making requests: use `doktorFetch` (lib/doktor/oturumFetch.ts) — it adds the header, refreshes once on a 401,
 * retries once and handles an expired session. Building `Authorization: Bearer …` by hand is refused by
 * lib/doktor/oturumFetch-koruma.test.ts.
 */
const AUTH_KEY = 'auth-token'
const KILIT_ADI = 'notya-doktor-oturum'
/** ensureDoctorAccessToken refreshes when the token expires within this window. */
const ISTEK_PAYI_MS = 60_000
/** The keep-alive timer refreshes this long before expiry. */
const CANLI_PAY_MS = 120_000
/** Retry delay after a transient (network) refresh failure. */
const GECICI_TEKRAR_MS = 30_000

/** Where an unauthenticated doctor is sent. One string, so no page redirects to '/giris' by mistake. */
export const DOKTOR_GIRIS = '/giris/doktor'

type StoredSession = {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export type JetonCozumu =
  | { durum: 'tamam'; jeton: string }
  /** Could not refresh because of the network / a 5xx; the session is kept. `jeton` = the last known one (may be stale). */
  | { durum: 'gecici'; jeton: string | null }
  /** No session, or the auth server refused the refresh token: the doctor must sign in again. */
  | { durum: 'bitti' }

type Kilitler = { request: (ad: string, fn: () => Promise<unknown>) => Promise<unknown> }

/** Everything this module touches outside itself — swapped in tests (`__oturumOrtaminiAyarla`). */
type Ortam = {
  depo: () => Storage | null
  fetch: typeof fetch
  simdi: () => number
  kilitler: () => Kilitler | null
}

const varsayilanOrtam: Ortam = {
  depo: () => {
    if (typeof window === 'undefined') return null
    try { return window.localStorage } catch { return null }
  },
  fetch: (...a) => fetch(...a),
  simdi: () => Date.now(),
  kilitler: () => {
    if (typeof navigator === 'undefined') return null
    const l = (navigator as Navigator & { locks?: Kilitler }).locks
    return l && typeof l.request === 'function' ? l : null
  },
}
let ortam: Ortam = varsayilanOrtam

function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://anjayzospuurymjmmtim.supabase.co'
}

function supabaseAnon(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE'
  )
}

/** The SDK's default storage key for this project ('sb-<ref>-auth-token'). */
function sdkAnahtari(): string {
  try { return `sb-${new URL(supabaseUrl()).hostname.split('.')[0]}-auth-token` } catch { return '' }
}

/** `exp` of a JWT in unix seconds, or undefined. */
function jwtBitis(jeton: string): number | undefined {
  try {
    const b64 = jeton.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!b64) return undefined
    const metin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8')
    const exp = (JSON.parse(metin) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp : undefined
  } catch {
    return undefined
  }
}

function oturumCoz(raw: string | null): StoredSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredSession & { session?: StoredSession; currentSession?: StoredSession }
    // Supabase has used three shapes across versions: at the root, under `session`, under `currentSession`.
    const s = parsed.access_token ? parsed : parsed.session?.access_token ? parsed.session : parsed.currentSession
    if (!s?.access_token) return null
    return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at ?? jwtBitis(s.access_token) }
  } catch {
    return null
  }
}

function readRawSession(): StoredSession | null {
  const depo = ortam.depo()
  if (!depo) return null
  try {
    // 'auth-token' is the doctor session. The SDK key is read only as a migration source (sessions written by
    // the old login pages / the generic /giris page); the first refresh moves it into 'auth-token'.
    return oturumCoz(depo.getItem(AUTH_KEY)) || oturumCoz(depo.getItem(sdkAnahtari()))
  } catch {
    return null
  }
}

function bitisMs(s: StoredSession): number | null {
  if (!s.expires_at) return null
  // expires_at may be unix seconds (Supabase) — treat small numbers as seconds
  return s.expires_at < 1e12 ? s.expires_at * 1000 : s.expires_at
}

function dolmakUzere(s: StoredSession, payMs: number): boolean {
  const b = bitisMs(s)
  return b !== null && ortam.simdi() >= b - payMs
}

export function saveDoctorSession(session: { access_token: string; refresh_token?: string; expires_at?: number }): void {
  const depo = ortam.depo()
  if (!depo) return
  const payload: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? jwtBitis(session.access_token),
  }
  try {
    depo.setItem(AUTH_KEY, JSON.stringify(payload))
    // One copy of the refresh-token family, never two: an SDK copy left behind is exactly what an SDK
    // auto-refresh ticker would spend behind our back.
    const sdk = sdkAnahtari()
    if (sdk) depo.removeItem(sdk)
  } catch { /* storage full / blocked: the in-memory token still serves this page */ }
  zamanlayiciKur()
}

/** Sign-out / dead session: removes every copy of the doctor session from this browser. */
export function doktorOturumuSil(): void {
  const depo = ortam.depo()
  if (!depo) return
  try {
    depo.removeItem(AUTH_KEY)
    const sdk = sdkAnahtari()
    if (sdk) depo.removeItem(sdk)
  } catch { /* nothing to remove */ }
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null }
}

/** Sync read — may be expired. Only for "is anybody signed in at all" checks; requests use doktorFetch. */
export function getDoctorAccessToken(): string {
  return readRawSession()?.access_token || ''
}

type YenilemeSonucu = { durum: 'tamam'; oturum: StoredSession } | { durum: 'gecici' } | { durum: 'bitti' }

async function sunucudanYenile(refreshToken: string): Promise<YenilemeSonucu> {
  let resp: Response
  try {
    resp = await ortam.fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnon() },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
      signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(15_000) : undefined,
    })
  } catch {
    return { durum: 'gecici' } // offline, DNS, timeout
  }
  const data = (await resp.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    expires_at?: number
  }
  if (resp.ok && data.access_token) {
    return {
      durum: 'tamam',
      oturum: {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: data.expires_at || (data.expires_in ? Math.floor(ortam.simdi() / 1000) + data.expires_in : jwtBitis(data.access_token)),
      },
    }
  }
  // 400/401/403 = the auth server refused the refresh token (revoked, already used, user gone): definitive.
  // 408/429/5xx = try again later.
  if (resp.status >= 400 && resp.status < 500 && resp.status !== 408 && resp.status !== 429) return { durum: 'bitti' }
  return { durum: 'gecici' }
}

let yenilemeSuruyor: Promise<JetonCozumu> | null = null

/**
 * One refresh for the whole tab (parallel callers share it) and, through the Web Lock, for the whole browser.
 * `reddedilen` = the access token a server just refused: if storage already holds a different, valid token
 * (another caller / tab refreshed meanwhile) that one is returned without spending the refresh token again.
 */
function yenile(reddedilen?: string): Promise<JetonCozumu> {
  if (yenilemeSuruyor) return yenilemeSuruyor
  const is = async (): Promise<JetonCozumu> => {
    const s = readRawSession()
    if (!s?.access_token) return { durum: 'bitti' }
    if (reddedilen !== undefined) {
      if (s.access_token !== reddedilen && !dolmakUzere(s, ISTEK_PAYI_MS)) return { durum: 'tamam', jeton: s.access_token }
    } else if (!dolmakUzere(s, ISTEK_PAYI_MS)) {
      return { durum: 'tamam', jeton: s.access_token } // another tab refreshed while we waited for the lock
    }
    if (!s.refresh_token) {
      // A session without a refresh token (very old login) can only be used until it expires.
      return dolmakUzere(s, 0) || reddedilen !== undefined ? { durum: 'bitti' } : { durum: 'tamam', jeton: s.access_token }
    }
    const sonuc = await sunucudanYenile(s.refresh_token)
    if (sonuc.durum === 'tamam') {
      saveDoctorSession(sonuc.oturum)
      return { durum: 'tamam', jeton: sonuc.oturum.access_token }
    }
    if (sonuc.durum === 'bitti') {
      // Another tab may have rotated the token between our read and the server's answer (only possible without
      // Web Locks): if storage now holds a different, valid session, that one wins.
      const simdiki = readRawSession()
      if (simdiki?.refresh_token && simdiki.refresh_token !== s.refresh_token && !dolmakUzere(simdiki, 0)) {
        return { durum: 'tamam', jeton: simdiki.access_token }
      }
      doktorOturumuSil()
      // Tell the shell (OturumBekcisi): login with ?next=, or the "Giriş yap" banner while a recording runs.
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(OTURUM_BITTI_OLAYI))
      return { durum: 'bitti' }
    }
    return { durum: 'gecici', jeton: dolmakUzere(s, 0) ? null : s.access_token }
  }
  const kilitler = ortam.kilitler()
  const p = (kilitler ? (kilitler.request(KILIT_ADI, is) as Promise<JetonCozumu>) : is())
    .catch((): JetonCozumu => ({ durum: 'gecici', jeton: readRawSession()?.access_token ?? null }))
    .finally(() => { yenilemeSuruyor = null })
  yenilemeSuruyor = p
  return p
}

/**
 * The session as a decision: a usable token, a transient failure, or "sign in again".
 * `zorla` = a server just answered 401 to `reddedilen`; refresh unless that already happened.
 */
export async function jetonCoz(secenek?: { zorla?: boolean; reddedilen?: string }): Promise<JetonCozumu> {
  oturumuCanliTut()
  const s = readRawSession()
  if (!s?.access_token) return { durum: 'bitti' }
  if (secenek?.zorla) return yenile(secenek.reddedilen ?? s.access_token)
  if (!dolmakUzere(s, ISTEK_PAYI_MS)) return { durum: 'tamam', jeton: s.access_token }
  return yenile()
}

/**
 * Returns a valid access token, refreshing if needed. Returns null when the doctor must sign in again (or, after a
 * network failure, when the last token has already expired). Kept for existing callers; new code uses doktorFetch.
 */
export async function ensureDoctorAccessToken(opts?: { forceRefresh?: boolean }): Promise<string | null> {
  const c = await jetonCoz(opts?.forceRefresh ? { zorla: true } : undefined)
  if (c.durum === 'tamam') return c.jeton
  if (c.durum === 'gecici') return c.jeton
  return null
}

// ---- keep-alive -------------------------------------------------------------------------------------------------

let zamanlayici: ReturnType<typeof setTimeout> | null = null
let canliKuruldu = false

function zamanlayiciKur(gecikmeMs?: number): void {
  if (!canliKuruldu) return
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null }
  const s = readRawSession()
  if (!s?.refresh_token) return
  const b = bitisMs(s)
  if (b === null && gecikmeMs === undefined) return
  // Small per-tab jitter so two tabs do not wake in the same millisecond (the lock serialises them anyway).
  const bekle = gecikmeMs ?? Math.max(1_000, (b as number) - CANLI_PAY_MS - ortam.simdi() + Math.floor(Math.random() * 5_000))
  zamanlayici = setTimeout(() => { void canliDenetle() }, Math.min(bekle, 2_147_000_000))
}

async function canliDenetle(): Promise<void> {
  const s = readRawSession()
  if (!s?.refresh_token) return
  if (!dolmakUzere(s, CANLI_PAY_MS)) { zamanlayiciKur(); return }
  const c = await yenile()
  if (c.durum === 'gecici') zamanlayiciKur(GECICI_TEKRAR_MS)
  else if (c.durum === 'tamam') zamanlayiciKur()
}

/** Fired on window when a background refresh finds the session dead (OturumBekcisi sends the doctor to login). */
export const OTURUM_BITTI_OLAYI = 'notya:oturum-bitti'

/**
 * Keeps the session alive while this tab is open: refresh before expiry, and re-check after the tab comes back
 * (visibilitychange), the network returns (online) or the window regains focus — a laptop that slept through the
 * expiry refreshes on wake instead of failing the next request. Idempotent; called by jetonCoz and OturumBekcisi.
 */
export function oturumuCanliTut(): void {
  if (canliKuruldu || typeof window === 'undefined' || typeof document === 'undefined') return
  canliKuruldu = true
  const uyan = () => { if (document.visibilityState !== 'hidden') void canliDenetle() }
  document.addEventListener('visibilitychange', uyan)
  window.addEventListener('online', uyan)
  window.addEventListener('focus', uyan)
  // Another tab refreshed: reschedule from the new expiry.
  window.addEventListener('storage', (e) => { if (e.key === AUTH_KEY) zamanlayiciKur() })
  zamanlayiciKur()
}

/** Test-only: swap storage / fetch / clock / locks and reset module state. */
export function __oturumOrtaminiAyarla(yeni?: Partial<Ortam>): void {
  ortam = yeni ? { ...varsayilanOrtam, ...yeni } : varsayilanOrtam
  yenilemeSuruyor = null
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null }
  canliKuruldu = false
}

/** True when profile indicates onboarding already finished. */
export function isOnboardingDone(profile: {
  onboarding_completed?: boolean | null
  profession_type?: string | null
  specialty?: string | null
} | null | undefined): boolean {
  if (!profile) return false
  if (profile.onboarding_completed) return true
  if (profile.profession_type) return true
  if (profile.specialty) return true
  return false
}
