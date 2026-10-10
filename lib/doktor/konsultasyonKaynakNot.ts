/**
 * HASTA-IZOLASYON — the muayene note a consultation request names as its source (`sevkler.kaynak_not_id`).
 *
 * The id arrives in the request body when the request is created. The account-less consultant portal
 * (app/api/konsultan/route.ts) later shows sentences of that note to the consultant and writes the consultant's
 * pre-note into it. So before it is stored, and again every time it is used, the note must be:
 *   - this doctor's note (`notes.doctor_id`),
 *   - of a muayene of THIS patient (`notes.session_id` → `sessions.patient_id`, the patient the doctor owns),
 *   - not archived (NOTYA-ARSIV-01: an archived muayene is invisible everywhere).
 * Anything else answers `null` — a foreign or mismatched id is indistinguishable from one that does not exist.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'

export async function konsultasyonKaynakNotu(
  sb: SupabaseClient,
  doktorId: string,
  patientId: string | null | undefined,
  noteId: string | null | undefined,
  secim = 'id',
): Promise<Record<string, unknown> | null> {
  if (!doktorId || !patientId || !noteId) return null
  const { data, error } = await arsivsizNotlar(sb, `${secim}, session_id`).eq('id', String(noteId)).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const seans = await seansSahibi(sb, doktorId, String((data as { session_id?: unknown }).session_id || ''))
  if (!seans || !seans.patient_id || seans.patient_id !== String(patientId)) return null
  return data as Record<string, unknown>
}
