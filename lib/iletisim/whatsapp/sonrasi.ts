/**
 * WHATSAPP-CANCEL-01 — the follow-ups the portal and calendar routes run after they change an appointment, for changes made
 * from a WhatsApp reply or the inbox card: push the change to Google Calendar. (The queued patient notice / reminder jobs
 * are picked up by the randevu-v2 cron exactly as for any other change — the webhook must answer Meta quickly, so it does
 * not run them inline.) Best effort: never throws; the cron catch-up covers a miss.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { googleaGonder } from '@/lib/randevu/v2/google/senk'

export async function randevuSonrasi(sb: SupabaseClient, doktorId: string, randevuId: string): Promise<void> {
  try { await googleaGonder(sb, doktorId, randevuId) } catch { /* the cron catch-up retries */ }
}
