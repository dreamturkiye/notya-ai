/**
 * AYSE-OGRENME-V3 / 1 — onay anında not başına gerçek düzeltme sayısı. LLM yok; waitUntil'den çağrılır.
 * Doktor kapsamı: doctor_id her sorguda. Not başına tek satır (yeniden onayda son hali).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OnayMetrigi } from './ivme'

export async function onayMetrigiYaz(sb: SupabaseClient, doctorId: string, noteId: string, duzeltmeSayisi: number): Promise<void> {
  if (!doctorId || !noteId || !Number.isFinite(duzeltmeSayisi) || duzeltmeSayisi < 0) return
  const { error } = await sb.from('doktor_ogrenme_metrik').upsert({
    doctor_id: doctorId,
    note_id: noteId,
    duzeltme_sayisi: Math.floor(duzeltmeSayisi),
    onay_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,note_id' })
  if (error && !/doktor_ogrenme_metrik/i.test(error.message || '')) console.error('[ogrenme] metrik', error.message)
}

export async function onayMetrikleriYukle(sb: SupabaseClient, doctorId: string, limit = 60): Promise<OnayMetrigi[]> {
  const { data, error } = await sb
    .from('doktor_ogrenme_metrik')
    .select('note_id, duzeltme_sayisi, onay_at')
    .eq('doctor_id', doctorId)
    .order('onay_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as OnayMetrigi[]).reverse()
}
