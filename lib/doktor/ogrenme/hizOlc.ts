/**
 * NOTYA-MESLEKTAS-V2 — istek yolu gecikmesi. cagir.ts'e dokunulmaz.
 * soap / sohbet sarmalayıcıları yazar; içerik yok.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function hizYaz(
  sb: SupabaseClient,
  g: { doctorId?: string | null; gorev: string; sureMs: number; onbellekli?: boolean },
): Promise<void> {
  const sure = Math.max(0, Math.round(g.sureMs))
  if (!g.gorev) return
  try {
    await sb.from('ai_hiz_olcum').insert({
      doctor_id: g.doctorId || null,
      gorev: g.gorev.slice(0, 40),
      sure_ms: sure,
      onbellekli: Boolean(g.onbellekli),
    })
  } catch { /* ölçüm kritik değil */ }
}

export function sureMs(baslangic: number): number {
  return Math.max(0, Date.now() - baslangic)
}

/** soap / sohbet sarmalayıcıları — kendi servis istemcisini açar, çağrıyı düşürmez. */
export async function hizYazSessiz(g: { doctorId?: string | null; gorev: string; sureMs: number; onbellekli?: boolean }): Promise<void> {
  try {
    const { servisSupabase } = await import('@/lib/doktor/serverAuth')
    await hizYaz(servisSupabase(), g)
  } catch { /* ölçüm kritik değil */ }
}
