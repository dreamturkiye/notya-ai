/**
 * NOTYA-RANDEVU-01 — THE convention for authenticating a PRACTICE (doktor + personel) on the
 * server, wherever a route serves both a doctor and their secretary on the same data.
 *
 * doktorOturum() (serverAuth.ts) resolves a user to themself: it assumes doctor_id === auth.uid().
 * That assumption breaks the moment a secretary logs in — their own auth.uid() is a `personel`
 * row, not a doctor. Since every route uses a SERVICE-ROLE client and enforces ownership in
 * application code (RLS is bypassed on purpose — see serverAuth.ts), "which doctor's data can
 * this caller touch" has to be resolved explicitly, once, here — not re-derived per route.
 *
 * Resolution: if the authenticated user has an active `personel` row (their own auth id in
 * personel.user_id), they act for personel.doktor_id with role 'sekreter'. Otherwise they are
 * the doctor themself, doktorId = their own id, role 'doktor'.
 *
 * Usage:
 *   const oturum = await pratikOturum(req)
 *   if ('hata' in oturum) return oturum.hata
 *   const { user, supabase, doktorId, rol } = oturum
 *   // ALWAYS scope queries by doktorId, never by user.id — user.id is who is logged in,
 *   // doktorId is whose practice/calendar/patient roster this request touches.
 *
 * Routes that must stay doctor-only (clinical notes, e-reçete, SGK, billing) should keep using
 * doktorOturum() so a secretary account can never reach them, even by URL.
 */
import { NextRequest, NextResponse } from 'next/server'
import { type SupabaseClient, type User } from '@supabase/supabase-js'
import { servisSupabase, OTURUM_YOK } from './serverAuth'

export type PratikRol = 'doktor' | 'sekreter'

export type PratikOturum = {
  user: User
  supabase: SupabaseClient
  /** Whose practice this request acts on — always the scoping key for patients/randevular/etc. */
  doktorId: string
  rol: PratikRol
  /** Present only when rol === 'sekreter'. */
  personelId?: string
}

export async function pratikOturum(
  req: NextRequest
): Promise<PratikOturum | { hata: NextResponse }> {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const hata = () => ({ hata: NextResponse.json({ error: OTURUM_YOK }, { status: 401 }) })
  if (!token || token === 'null' || token === 'undefined') return hata()

  const supabase = servisSupabase()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return hata()
  const user = data.user

  const { data: personelRow } = await supabase
    .from('personel')
    .select('id, doktor_id, aktif')
    .eq('user_id', user.id)
    .eq('aktif', true)
    .maybeSingle()

  if (personelRow) {
    return { user, supabase, doktorId: personelRow.doktor_id, rol: 'sekreter', personelId: personelRow.id }
  }

  return { user, supabase, doktorId: user.id, rol: 'doktor' }
}

/** Guard for routes a secretary must never reach (clinical notes, e-reçete, SGK, billing, staff mgmt). */
export function sadeceDoktor(oturum: PratikOturum): NextResponse | null {
  if (oturum.rol !== 'doktor') {
    return NextResponse.json({ error: 'Bu işlem yalnızca doktor hesabı içindir.' }, { status: 403 })
  }
  return null
}
