/**
 * NOTYA-UZ-MUAYENE-01 — daily ceiling on visits turned into notes, per account, counted by the COUNTRY's day.
 *
 * Same table and same row shape as the pre-split application's quota (`ai_kullanim`: doctor_id, gun, kova, sayac),
 * so one account has one counter whichever code counts it. Its helper (lib/doktor/hizLimiti.ts) is not reused: it
 * counts by Istanbul's day and carries a Turkish sentence. The ceiling is the pack's (`gunlukMuayeneLimiti`).
 *
 * Fail open, like the original: if the counter cannot be read the visit goes on — a broken counter must not stop a
 * clinic. Scoped to the authenticated account's id; nothing here takes an id from a request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeGunu } from './gun'

const KOVA = 'soap'

export async function muayeneKotasiKullan(supabase: SupabaseClient, doktorId: string, limit: number): Promise<boolean> {
  const gun = ulkeGunu()
  try {
    const { data } = await supabase.from('ai_kullanim').select('sayac').eq('doctor_id', doktorId).eq('gun', gun).eq('kova', KOVA).maybeSingle()
    const mevcut = Number((data as { sayac?: number } | null)?.sayac ?? 0)
    if (mevcut >= limit) return false
    await supabase.from('ai_kullanim').upsert({ doctor_id: doktorId, gun, kova: KOVA, sayac: mevcut + 1 }, { onConflict: 'doctor_id,gun,kova' })
    return true
  } catch {
    return true
  }
}
