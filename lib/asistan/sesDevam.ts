/**
 * NOTYA-SES-DEVAM-01 — the unspoken remainder of a cut voice turn (asistan_sessions.active_context.sesDevam).
 *
 * Shared by the two voice routes (ElevenLabs Custom LLM: lib/asistan/sesLlm.ts; Fish: /api/asistan/fish-tur) so the
 * remainder has one owner: whoever reads it takes it, and a second "devam" cannot read it again.
 * HASTA-IZOLASYON-01: the session row is read and written with id AND doctor_id.
 * SES-OMURGA-V2 (F): the remainder is removed field-level (asistan_gecmis_ekle) — the rest of active_context is not
 * rewritten from a stale copy.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SesDevam } from '@/lib/asistan/ayseCevapla'
import { gecmisEkle } from '@/lib/asistan/oturumYaz'

/** Take the remainder (and clear it). Null when there is none. */
export async function sesDevamAl(supabase: SupabaseClient, doktorId: string, oturumId: string): Promise<string | null> {
  const { data } = await supabase.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = ((data as { active_context?: Record<string, unknown> } | null)?.active_context || null)
  const devam = baglam?.sesDevam as SesDevam | undefined
  if (!baglam || !devam) return null
  await gecmisEkle(supabase, { oturumId, doktorId, yeni: [], sil: ['sesDevam'] })
  return typeof devam.kalan === 'string' && devam.kalan.trim() ? devam.kalan : null
}
