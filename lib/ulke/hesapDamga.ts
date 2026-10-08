/**
 * NOTYA-ULKE-01 — writes the deployment's country onto an account (server only, service role).
 *
 * Used where an account first becomes a profile. Best effort ON PURPOSE for the pre-split sign-up path: the database
 * default already gives every Türkiye row 'tr' (migration 128), and until that migration is applied the column does
 * not exist — so a failure here must never break onboarding. The invitation sign-up of other countries does NOT use
 * this helper; it writes both stamps as part of creating the account and fails as a whole.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { aktifUlke } from './ulke'

export async function hesapUlkesiDamgala(
  supabase: SupabaseClient,
  userId: string,
  mevcutAppMeta: Record<string, unknown> | null | undefined,
): Promise<void> {
  const ulke = aktifUlke()
  if (mevcutAppMeta?.country === ulke) return
  try {
    await supabase.auth.admin.updateUserById(userId, { app_metadata: { ...(mevcutAppMeta || {}), country: ulke } })
  } catch { /* the legacy rule (no stamp = Türkiye) still holds */ }
  try {
    await supabase.from('users').update({ country: ulke }).eq('id', userId)
  } catch { /* column missing before migration 128 */ }
}
