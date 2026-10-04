/**
 * NOTYA-RANDEVU-V2 — job-table helpers shared by the V2 server code and Ayşe's appointment tool
 * (core/eylemler/randevuEylemleri.ts). Writes only randevu_isleri — never a clinical table — so the chat/voice
 * import graph stays clean (core/eylemler/tests/sessizYol.test.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { IsPlani } from './isPlani'

type Sb = SupabaseClient

/** Postgres exclusion_violation — the 111 constraint or trigger refused an overlapping new-flow row. */
export function cakismaHatasiMi(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as { code?: string }).code === '23P01'
}

export async function isEkle(sb: Sb, r: { id: string; doktor_id: string }, isler: IsPlani[]): Promise<void> {
  if (!isler.length) return
  await sb.from('randevu_isleri')
    .upsert(isler.map((i) => ({ randevu_id: r.id, doktor_id: r.doktor_id, tur: i.tur, zaman: i.zaman, durum: 'bekliyor' })), { onConflict: 'randevu_id,tur,zaman', ignoreDuplicates: true })
    .then(() => undefined, () => undefined)
}

/** Cancel/reschedule updates the jobs: everything still waiting for this appointment is dropped. */
export async function bekleyenIsleriIptal(sb: Sb, doktorId: string, randevuId: string): Promise<void> {
  await sb.from('randevu_isleri').update({ durum: 'iptal', updated_at: new Date().toISOString() })
    .eq('randevu_id', randevuId).eq('doktor_id', doktorId).eq('durum', 'bekliyor')
    .then(() => undefined, () => undefined)
}
