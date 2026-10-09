/**
 * NOTYA-UZ-MUAYENE-01 — daily ceiling on visits turned into notes, per account, counted by the COUNTRY's day.
 *
 * A country table of its own, `ulke_kullanim` (migration 132: ulke, doctor_id, gun, kova, sayac). In the shared
 * database a country never writes to Türkiye's counter (`ai_kullanim`), and Türkiye's helper
 * (lib/doktor/hizLimiti.ts) is not reused: it counts by Istanbul's day and carries a Turkish sentence. The ceiling
 * is the pack's (`gunlukMuayeneLimiti`).
 *
 * Fail open, like the original: if the counter cannot be read the visit goes on — a broken counter must not stop a
 * clinic. Scoped to the authenticated account's id; nothing here takes an id from a request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeGunu } from './gun'
import { hesapSaatDilimi } from './saatDilimi'
import { ulkeTablosu } from './tablolar'

const KOVA = 'soap'

export async function muayeneKotasiKullan(supabase: SupabaseClient, doktorId: string, limit: number): Promise<boolean> {
  try {
    // The day is the ACCOUNT's own (its time zone, one of the pack's list).
    const gun = ulkeGunu(new Date(), await hesapSaatDilimi(supabase, doktorId))
    const { data } = await ulkeTablosu(supabase, 'ulke_kullanim').select('sayac').eq('doctor_id', doktorId).eq('gun', gun).eq('kova', KOVA).maybeSingle()
    const mevcut = Number((data as { sayac?: number } | null)?.sayac ?? 0)
    if (mevcut >= limit) return false
    await ulkeTablosu(supabase, 'ulke_kullanim').upsert({ doctor_id: doktorId, gun, kova: KOVA, sayac: mevcut + 1 }, { onConflict: 'ulke,doctor_id,gun,kova' })
    return true
  } catch {
    return true
  }
}
