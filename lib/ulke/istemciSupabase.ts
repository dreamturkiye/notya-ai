/**
 * NOTYA-ULKE-01 — browser Supabase client for the core country screens (/login, /signup, /welcome).
 *
 * Reads the project from the deployment's own settings and from nowhere else. No setting = no client: the screen
 * says login is unavailable. It NEVER falls back to another project — each country has its own database, and a
 * default here would send one country's doctors to another country's database.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let istemci: SupabaseClient | null = null

export function ulkeIstemciSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anahtar) return null
  if (!istemci) istemci = createClient(url, anahtar, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
  return istemci
}
