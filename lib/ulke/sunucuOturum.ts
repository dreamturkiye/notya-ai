/**
 * NOTYA-ULKE-01 — server session for the core country API (app/api/ulke/*).
 *
 * Same resolution as doktorOturum (service-role client, bearer token, account must belong to this deployment's
 * country), but it returns null instead of a ready-made response: these routes answer with machine codes only, never
 * with a sentence, because their callers show text in the visitor's own language.
 *
 * It builds its own service-role client instead of importing lib/doktor/serverAuth.ts on purpose: that file carries
 * the pre-split application's Turkish sentences, and nothing reachable from a *.ulke.* route may carry another
 * country's text (lib/ulke/ulkeDuvarlari.test.ts walks the import graph). Same client options, one extra copy until
 * the server messages are split (docs/COUNTRY-PACK-SPLIT-PLAN.md, job 5).
 */
import type { NextRequest } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { hesapBuUlkedeMi } from './hesapUlkesi'

/** Service-role client. Bypasses row-level security: every query MUST be scoped to the authenticated user. */
export function ulkeServisSupabase(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
}

export async function ulkeOturum(req: NextRequest): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const baslik = req.headers.get('authorization')
  const jeton = baslik?.startsWith('Bearer ') ? baslik.slice(7).trim() : ''
  if (!jeton || jeton === 'null' || jeton === 'undefined') return null
  const supabase = ulkeServisSupabase()
  const { data, error } = await supabase.auth.getUser(jeton)
  if (error || !data.user) return null
  if (!hesapBuUlkedeMi(data.user)) return null
  return { user: data.user, supabase }
}
