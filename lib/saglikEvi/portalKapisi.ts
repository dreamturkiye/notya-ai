/**
 * HASTA-PORTALI-GUNLUK — the one gate every /api/portal/hasta/[token]/gunluk* route passes: token → (doctor_id,
 * patient_id), PIN unlock required (requirePortalUnlock). The scope returned here is the ONLY patient / doctor identity
 * the daily-health-home functions ever use (hasta-izolasyon).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import type { Kapsam } from './sunucu'

export function servisIstemcisi(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

export async function portalKapsami(req: NextRequest, token: string): Promise<{ sb: SupabaseClient; kapsam: Kapsam } | { hata: NextResponse }> {
  const sb = servisIstemcisi()
  if (!sb) return { hata: NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 }) }
  const tok = await resolvePortalToken(sb, token)
  if (!tok) return { hata: NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 }) }
  const kilit = requirePortalUnlock(req, token, tok)
  if (kilit) return { hata: kilit }
  return { sb, kapsam: { doktorId: String(tok.doctor_id), patientId: String(tok.patient_id) } }
}

export function sonucYaniti(r: { ok: boolean; status?: number; hata?: string; [k: string]: unknown }): NextResponse {
  if (r.ok) { const { ok: _o, ...geri } = r; return NextResponse.json({ ok: true, ...geri }) }
  return NextResponse.json({ error: r.hata }, { status: r.status || 400 })
}
