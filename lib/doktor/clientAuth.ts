/**
 * Doctor client auth helpers.
 * Persists session in localStorage (`auth-token`) and refreshes when access token expires
 * so iOS PWA reopen does not dump the doctor back into onboarding.
 */

const AUTH_KEY = 'auth-token'

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
      user?: unknown
    }
    if (parsed.access_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expires_at: parsed.expires_at,
      }
    }
    if (parsed.session?.access_token) {
      return {
        access_token: parsed.session.access_token,
        refresh_token: parsed.session.refresh_token,
        expires_at: parsed.session.expires_at,
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
export async function ensureDoctorAccessToken(): Promise<string | null> {
  const session = readRawSession()
  if (!session?.access_token) return null

  if (!isExpired(session.expires_at)) {
    return session.access_token
  }

  if (!session.refresh_token) return null
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
