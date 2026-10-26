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
import { izinVarMi, personelRoluMu, yolIzniVarMi, type PratikRol, type Yetki } from './personelYetki'
import { hesapBuUlkedeMi } from '@/lib/ulke/hesapUlkesi'

/**
 * MOBIL-PERSONEL-01: 'doktor' | 'sekreter' | 'asistan' | 'hasta_danismani'. The permission map lives in
 * lib/doktor/personelYetki.ts. NEVER test `rol === 'sekreter'` to mean "is staff" — use personelMi().
 */
export type { PratikRol } from './personelYetki'

export type PratikOturum = {
  user: User
  supabase: SupabaseClient
  /** Whose practice this request acts on — always the scoping key for patients/randevular/etc. */
  doktorId: string
  rol: PratikRol
  /** Present for every staff role (sekreter / asistan / hasta_danismani); absent for the doctor. */
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
  // NOTYA-ULKE-01: an account of another country has no session here — same answer as no session at all.
  if (!hesapBuUlkedeMi(data.user)) return hata()
  const user = data.user

  const { data: personelRow } = await supabase
    .from('personel')
    .select('id, doktor_id, aktif, rol')
    .eq('user_id', user.id)
    .eq('aktif', true)
    .maybeSingle()

  if (personelRow) {
    // A row written before migration 172 has rol 'sekreter' (the only value the old CHECK allowed).
    const hamRol = personelRow.rol ?? 'sekreter'
    if (!personelRoluMu(hamRol)) {
      return { hata: NextResponse.json({ error: 'Hesap rolü tanınmıyor. Doktorunuzla görüşün.' }, { status: 403 }) }
    }
    // Server-side role gate. The doctor and the (unchanged) secretary pass; asistan / hasta_danismani only
    // reach the paths listed for them in personelYetki.ts. UI hiding is cosmetic — this is the enforcement.
    const yol = req.nextUrl?.pathname ?? new URL(req.url).pathname
    const karar = yolIzniVarMi(hamRol, yol, req.method)
    if (!karar.izin) {
      return { hata: NextResponse.json({ error: ROL_ENGEL_MESAJI }, { status: 403 }) }
    }
    return { user, supabase, doktorId: personelRow.doktor_id, rol: hamRol, personelId: personelRow.id }
  }

  return { user, supabase, doktorId: user.id, rol: 'doktor' }
}

export const ROL_ENGEL_MESAJI = 'Bu işlem için rolünüzün yetkisi yok.'

/** True for every staff role (secretary, assistant, patient liaison); false for the doctor. */
export function personelMi(oturum: Pick<PratikOturum, 'rol'>): boolean {
  return oturum.rol !== 'doktor'
}

/**
 * In-route capability check for routes that serve several roles with different field sets
 * (e.g. patient file: the liaison gets contact data only). Returns a 403 response, or null when allowed.
 */
export function yetkiYoksa(oturum: Pick<PratikOturum, 'rol'>, yetki: Yetki): NextResponse | null {
  if (izinVarMi(oturum.rol, yetki)) return null
  return NextResponse.json({ error: ROL_ENGEL_MESAJI }, { status: 403 })
}

/** Guard for routes a secretary must never reach (clinical notes, e-reçete, SGK, billing, staff mgmt). */
export function sadeceDoktor(oturum: PratikOturum): NextResponse | null {
  if (oturum.rol !== 'doktor') {
    return NextResponse.json({ error: 'Bu işlem yalnızca doktor hesabı içindir.' }, { status: 403 })
  }
  return null
}
