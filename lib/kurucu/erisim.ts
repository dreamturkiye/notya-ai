/**
 * KURUCU-KONSOL-01 — who may open the founder console: the e-mail of a valid session must be on FOUNDER_EMAILS
 * (comma-separated; default kaan@notya.io). Decided on the server, in every route behind the console. Anyone else —
 * no token, a bad token, a valid account not on the list — gets the same 404 as a page that does not exist.
 * (Dr. Gökhan Mamur is NOT on the default list: the code knows two login addresses for him, so the right one is Kaan's
 * call — FOUNDER_EMAILS can carry it; docs/OPEN-COMMITMENTS.md KURUCU-KONSOL-01.)
 */
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { kurucuEpostalari } from './denemeBildirimi'

export const yokCevabi = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })

export function kurucuEpostasiMi(eposta: unknown, liste: readonly string[] = kurucuEpostalari()): boolean {
  return typeof eposta === 'string' && liste.includes(eposta.trim().toLowerCase())
}

export async function kurucuOturumu(req: NextRequest, supabase: SupabaseClient): Promise<User | null> {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token || token === 'null' || token === 'undefined' || token.length > 4096) return null
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return kurucuEpostasiMi(data.user.email) ? data.user : null
  } catch {
    return null
  }
}
