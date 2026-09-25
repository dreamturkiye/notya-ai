/**
 * NOTYA-GELEN-BELGELER — who may see and file incoming documents. DECIDED (Kaan, 2026-09-25): doctor-only by
 * default; the doctor turns the secretary's access (see AND file) on or off with one switch in Ayarlar
 * (users.gelen_belge_sekreter, migration 099). Enforced HERE on the server for every route; the RLS staff policy
 * in 099 is the second line.
 *
 * Before migration 099 the switch column does not exist → the read fails → treated as off (fail closed).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pratikOturum, type PratikOturum } from '@/lib/doktor/pratikOturum'

export const SEKRETER_KAPALI = 'Gelen belgeleri görmek için doktorunuzun Ayarlar’dan erişim vermesi gerekiyor.'

/** Pure rule: the doctor always; a secretary only when the doctor's switch is on. */
export function gelenBelgeErisimi(rol: PratikOturum['rol'], sekreterAcik: boolean | null | undefined): boolean {
  return rol === 'doktor' || (rol === 'sekreter' && sekreterAcik === true)
}

export async function sekreterErisimiAcikMi(sb: SupabaseClient, doktorId: string): Promise<boolean> {
  try {
    const { data, error } = await sb.from('users').select('gelen_belge_sekreter').eq('id', doktorId).maybeSingle()
    if (error) return false
    return data?.gelen_belge_sekreter === true
  } catch {
    return false
  }
}

/** pratikOturum + the switch. 401 without a session, 403 for a secretary whose doctor has not opened access. */
export async function gelenBelgeOturum(req: NextRequest): Promise<PratikOturum | { hata: NextResponse }> {
  const o = await pratikOturum(req)
  if ('hata' in o) return o
  if (o.rol === 'doktor') return o
  const acik = await sekreterErisimiAcikMi(o.supabase, o.doktorId)
  if (!gelenBelgeErisimi(o.rol, acik)) return { hata: NextResponse.json({ error: SEKRETER_KAPALI }, { status: 403 }) }
  return o
}
