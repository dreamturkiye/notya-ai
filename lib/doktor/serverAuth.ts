/**
 * NOTYA-AUTH-01 — THE convention for authenticating a doctor on the server.
 *
 * Every /api/doktor route receives `Authorization: Bearer <supabase access token>` from the
 * browser (see lib/doktor/clientAuth.ts for the client half) and must resolve it to a user with
 * the service-role client. Before this file, 22 route files each re-implemented that in slightly
 * different ways, with three different 401 messages — 'Yetkisiz erişim', 'Geçersiz token' and
 * 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' Only the last one tells the doctor what to do.
 *
 * Usage:
 *   const oturum = await doktorOturum(req)
 *   if ('hata' in oturum) return oturum.hata
 *   const { user, supabase } = oturum
 *
 * Migration is incremental: a route switches to this when it is next touched. Do not add a
 * fourth private copy.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const OTURUM_YOK = 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'

/** Service-role client. Bypasses RLS — every query MUST scope by user.id or patient ownership. */
export function servisSupabase(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function doktorOturum(
  req: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | { hata: NextResponse }> {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const hata = () => ({ hata: NextResponse.json({ error: OTURUM_YOK }, { status: 401 }) })
  // 'Bearer null' / 'Bearer undefined' is what a broken client reader sends (ILAC-04). Refuse it
  // before the round-trip to Supabase, and keep the message honest rather than 'Geçersiz token'.
  if (!token || token === 'null' || token === 'undefined') return hata()
  const supabase = servisSupabase()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return hata()
  return { user: data.user, supabase }
}
