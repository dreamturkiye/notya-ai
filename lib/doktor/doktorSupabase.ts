/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — the Supabase client a doctor screen uses for direct table / storage calls
 * (today: the muayene page's session row and audio upload).
 *
 * It has NO session of its own: every request asks clientAuth for the current access token (`accessToken`
 * option), so it never stores, never auto-refreshes and never spends the doctor's refresh token. A default
 * `createClient()` on a doctor screen did exactly that — a second refresher on the same token family — and was the
 * root cause of the "logged out after one hour" bug. Doctor screens must not create a default client.
 * The SDK is imported only by the screens that use this file (not by clientAuth), so route bundles do not grow.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { doktorJetonu } from './oturumFetch'

let istemci: SupabaseClient | null = null

export function doktorSupabase(): SupabaseClient {
  if (!istemci) {
    istemci = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: async () => (await doktorJetonu()) ?? '',
      global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
    })
  }
  return istemci
}

/** The signed-in doctor's user id (`sub` of the current access token), or null when there is no session. */
export async function doktorKullaniciId(): Promise<string | null> {
  const jeton = await doktorJetonu()
  if (!jeton) return null
  try {
    const b64 = jeton.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    return b64 ? (JSON.parse(atob(b64)) as { sub?: string }).sub || null : null
  } catch {
    return null
  }
}
