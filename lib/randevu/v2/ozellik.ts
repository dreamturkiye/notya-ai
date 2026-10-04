/**
 * NOTYA-RANDEVU-V2 — is the doctor's 'Hasta Portalı Randevu' ON? Read-only (Ayşe surfaces import it; they must
 * not pull write paths into the chat/voice graph). Before migration 116, or on any error: OFF.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function randevuV2Acik(sb: SupabaseClient, doktorId: string): Promise<boolean> {
  try {
    const { data, error } = await sb.from('randevu_portal_ayarlari').select('acik').eq('doktor_id', doktorId).maybeSingle()
    return !error && data?.acik === true
  } catch {
    return false
  }
}
