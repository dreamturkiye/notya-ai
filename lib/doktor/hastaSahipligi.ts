/**
 * HASTA-IZOLASYON-01 — THE ownership check for anything a request names by id.
 *
 * Every server route talks to Supabase with the SERVICE-ROLE client (serverAuth.ts), which bypasses
 * RLS by design. So "doctor A can never read or write doctor B's patient" is enforced HERE, in
 * application code, on every request — not by the database. A patient id, session id or any other
 * patient-derived id that arrives in the URL, query string or body is attacker-controlled until it
 * has been matched against the authenticated doctor.
 *
 * Usage (before ANY read or write that uses the id):
 *   if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
 *     return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
 *   }
 *
 * 404 (not 403) on purpose: a foreign patient id must be indistinguishable from a non-existent one.
 * Fails closed — empty id, malformed uuid, or a query error all answer `false`.
 *
 * This is the same query the vault (lib/vault/service.ts assertPatientOwned) and the chapter routes
 * (goz `hasta()`, jinekoloji `hastaDogrula()`, dahiliye `hastaBilgi()`) already run privately; new
 * routes call this one instead of adding another private copy. Enforced by
 * lib/security/hasta-izolasyon.test.ts and .cursor/skills/hasta-izolasyon/SKILL.md.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function hastaSahibiMi(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string | null | undefined
): Promise<boolean> {
  if (!doktorId || !patientId) return false
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('id', String(patientId))
    .eq('doctor_id', doktorId)
    .maybeSingle()
  return !error && !!data
}

/**
 * A session (muayene) the doctor owns, with its patient — or null. A session whose patient_id points
 * at another doctor's patient is treated as not owned: sessions can be inserted from the browser with
 * the anon key, so a session row alone does not prove the patient link is legitimate.
 */
export async function seansSahibi(
  supabase: SupabaseClient,
  doktorId: string,
  sessionId: string | null | undefined
): Promise<{ id: string; patient_id: string | null } | null> {
  if (!doktorId || !sessionId) return null
  const { data, error } = await supabase
    .from('sessions')
    .select('id, patient_id')
    .eq('id', String(sessionId))
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !data) return null
  const patientId = (data.patient_id as string | null) ?? null
  if (patientId && !(await hastaSahibiMi(supabase, doktorId, patientId))) return null
  return { id: String(data.id), patient_id: patientId }
}
