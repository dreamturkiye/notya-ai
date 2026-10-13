/**
 * NOTYA-ULKE-01 — browser Supabase client for the core country screens (/login, /signup, /welcome).
 *
 * Reads the project from the deployment's own settings and from nowhere else. No setting = no client: the screen
 * says login is unavailable. It NEVER falls back to another project — each country has its own database, and a
 * default here would send one country's doctors to another country's database.
 *
 * NOTYA-UZ-MUAYENE-01 — the session's storage key names the COUNTRY. A country may be served under a path of the main
 * site (notya.io/uzbek), and then it shares the browser's storage with every other country on that address. The
 * library's default key is derived from the project address; this one says whose session it is in words, so two
 * countries can never read each other's session even if their settings were ever mixed up. No cookie is set.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { aktifUlke } from './ulke'

/** localStorage key of the session: 'sb-notya-uz-auth-token'. */
export const ulkeOturumAnahtari = (): string => `sb-notya-${aktifUlke()}-auth-token`

let istemci: SupabaseClient | null = null

export function ulkeIstemciSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anahtar) return null
  if (!istemci) istemci = createClient(url, anahtar, { auth: { storageKey: ulkeOturumAnahtari() }, global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
  return istemci
}
