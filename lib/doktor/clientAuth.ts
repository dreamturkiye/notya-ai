/**
 * Doctor client auth helpers — THE convention for reading the doctor's session in the browser.
 *
 * Persists session in localStorage (`auth-token`) and refreshes when the access token expires so
 * an iOS PWA reopen does not dump the doctor back into onboarding.
 *
 * NOTYA-AUTH-01: every doctor page and component must get its token from
 * `ensureDoctorAccessToken()` and nothing else. Two bugs came from pages inventing their own
 * localStorage read instead: ILAC-04 (a component read the literal 'auth-token' key, Supabase had
 * stored the session under 'sb-<ref>-auth-token', the API got `Bearer null`) and the dashboard
 * itself, which read the token synchronously with no refresh and sent every doctor who reopened
 * the app after an hour straight to the login screen — the exact failure this file exists to
 * prevent. The helper below knows all the storage shapes and refreshes; callers should not.
 */

const AUTH_KEY = 'auth-token'

/** Where an unauthenticated doctor is sent. One string, so no page redirects to '/giris' by mistake. */
export const DOKTOR_GIRIS = '/giris/doktor'

type StoredSession = {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

function supabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://anjayzospuurymjmmtim.supabase.co'
  )
}

function supabaseAnon(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE'
  )
}

function readRawSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw =
      localStorage.getItem(AUTH_KEY) ||
      localStorage.getItem(
        Object.keys(localStorage).find((k) => k.includes('auth-token') || (k.startsWith('sb-') && k.includes('auth'))) ||
          ''
      ) ||
      ''
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession & {
      session?: StoredSession
      currentSession?: StoredSession
      user?: unknown
    }
    // Supabase has used three shapes across versions: at the root, under `session`, under
    // `currentSession`. Accept all of them rather than depending on which client wrote the key.
    const s = parsed.access_token ? parsed : parsed.session?.access_token ? parsed.session : parsed.currentSession
    if (s?.access_token) {
      return {
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_at: s.expires_at,
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveDoctorSession(session: {
  access_token: string
  refresh_token?: string
  expires_at?: number
}): void {
  if (typeof window === 'undefined') return
  const payload: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
}

/** Sync read — may be expired. Prefer ensureDoctorAccessToken on app boot. */
export function getDoctorAccessToken(): string {
  return readRawSession()?.access_token || ''
}

function isExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false
  // expires_at may be unix seconds (Supabase) — treat small numbers as seconds
  const ms = expiresAt < 1e12 ? expiresAt * 1000 : expiresAt
  return Date.now() >= ms - 60_000
}

async function refreshAccessToken(refreshToken: string): Promise<StoredSession | null> {
  try {
    const resp = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnon(),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    const data = (await resp.json().catch(() => ({}))) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      expires_at?: number
    }
    if (!resp.ok || !data.access_token) return null
    const next: StoredSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at:
        data.expires_at ||
        (data.expires_in
          ? Math.floor(Date.now() / 1000) + data.expires_in
          : undefined),
    }
    saveDoctorSession(next)
    return next
  } catch {
    return null
  }
}

/**
 * Returns a valid access token, refreshing if needed.
 * Returns null when the doctor must sign in again.
 */
export async function ensureDoctorAccessToken(opts?: {
  forceRefresh?: boolean
}): Promise<string | null> {
  const session = readRawSession()
  if (!session?.access_token) return null

  const needsRefresh = opts?.forceRefresh || isExpired(session.expires_at)
  if (!needsRefresh) {
    return session.access_token
  }

  if (!session.refresh_token) {
    return opts?.forceRefresh ? null : session.access_token
  }
  const refreshed = await refreshAccessToken(session.refresh_token)
  return refreshed?.access_token || null
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
