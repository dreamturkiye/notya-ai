/**
 * NOTYA-FISILTI-UNIVERSAL — mute a patient's fısıltı entry. Patient-level for v1 (see migration
 * 088's own note on why). Single write path -- the eylem action's `calistir` and its `geriAl`
 * both call through here, never a second insert/update path.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function fisiltiSessizeAlEkle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string,
  brans: string,
  sebep: string,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('fisilti_sessizler')
    .insert({ doctor_id: doktorId, patient_id: patientId, brans, sebep })
    .select('id')
    .single()
  if (error || !data) throw new Error('Sessize alınamadı.')
  return { id: data.id }
}

export async function fisiltiSessizeAlGeriAl(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from('fisilti_sessizler').update({ kaldirildi_at: new Date().toISOString() }).eq('id', id)
}
