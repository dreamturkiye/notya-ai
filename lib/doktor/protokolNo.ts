/**
 * NOTYA-PROTOKOL-NO-01 — automatic, sequential, immutable "Protokol Numarası" for every
 * muayene (sessions row). Beta-pediatrician audit finding: a standard Turkish clinical-
 * practice field, printed on prescriptions/reports and required for future MBYS/e-Nabız/
 * private insurance export packages — closed here to a genuinely Strong implementation
 * (atomic DB counter + DB-enforced immutability + DB-enforced per-scope uniqueness), not a
 * token field. See lib/db/migrations/160_protokol_numarasi.sql for the schema and the full
 * reasoning this file's comments summarize.
 *
 * SCOPING: `clinics`/`clinic_members` (migration 004) is a real multi-doctor entity, and
 * `users.clinic_id` is genuinely set for any doctor who accepts a clinic invite
 * (app/api/klinik/invite/accept/route.ts) — not gated behind the superuser-only "Klinik
 * yüzü" preview dashboard (lib/klinik/klinikErisim.ts gates only that admin UI). So the
 * counter is scoped to the doctor's clinic when they have one, and to the doctor themself
 * otherwise — the closest real equivalent for every solo-doctor account today, which is
 * every real beta account. This degrades gracefully: the day a doctor's clinic_id is set,
 * their NEXT muayene's protokol numarası is drawn from the clinic's shared sequence with no
 * code change.
 *
 * ATOMICITY: the actual increment happens in ONE Postgres statement inside protokol_no_ata()
 * (INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING) — see the migration for why this can
 * never produce a duplicate under concurrent callers (row-level lock on the counter row for
 * the statement's duration; NOT the read-then-write "SELECT max+1" pattern the brief warns
 * against). This file's job is only: resolve the right scope, call that one atomic RPC, and
 * hand the caller a number to put directly into the SAME insert() payload as the new session
 * row — never as a follow-up update. Session creation call sites MUST fail (not silently
 * create a protokol_no-less muayene) if this allocation fails; see callers.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type ProtokolKapsam = { scopeType: 'clinic' | 'doctor'; scopeId: string }

/**
 * Resolves the counter scope for a doctor: their clinic if `users.clinic_id` is set (real
 * multi-doctor clinic membership — every doctor at that clinic shares this scope), else the
 * doctor's own id. Never throws — a lookup error degrades to doctor-scoped (the narrower,
 * always-safe choice: it can never collide with a clinic's sequence, it can only mean a
 * doctor who is genuinely in a clinic transiently gets their own number instead of the
 * shared one, which is still unique and never a duplicate).
 */
export async function protokolKapsamiCoz(sb: SupabaseClient, doctorId: string): Promise<ProtokolKapsam> {
  try {
    const { data } = await sb.from('users').select('clinic_id').eq('id', doctorId).maybeSingle()
    const clinicId = data?.clinic_id ? String(data.clinic_id).trim() : ''
    if (clinicId) return { scopeType: 'clinic', scopeId: clinicId }
  } catch { /* doctor-scoped fallback below */ }
  return { scopeType: 'doctor', scopeId: doctorId }
}

/**
 * Atomically allocates the next Protokol Numarası for a doctor's scope (clinic or solo) for
 * the given year (defaults to the current year in UTC — the counter resets per calendar
 * year, see migration). Returns the formatted "YYYY-NNNNNN" string and the scope it was
 * drawn from (store scopeId on the session row as protokol_scope_id — required for the
 * DB-level per-scope uniqueness index to mean anything). Returns null ONLY on a genuine RPC
 * failure (e.g. migration not applied) — callers must treat null as "could not create this
 * muayene", not as "create it without a number".
 */
export async function protokolNumarasiAta(
  sb: SupabaseClient,
  doctorId: string,
  yil: number = new Date().getUTCFullYear()
): Promise<{ protokolNo: string; scopeId: string } | null> {
  const kapsam = await protokolKapsamiCoz(sb, doctorId)
  const { data, error } = await sb.rpc('protokol_no_ata', {
    p_scope_type: kapsam.scopeType,
    p_scope_id: kapsam.scopeId,
    p_yil: yil,
  })
  if (error || !data) {
    console.error('[protokolNo] protokol_no_ata rpc', error?.message || 'boş yanıt')
    return null
  }
  return { protokolNo: String(data), scopeId: kapsam.scopeId }
}

/** Boş/null protokol_no için ekranda/belgede gösterilecek sabit metin — asla sayı icat edilmez. */
export function protokolNoGorunum(v: string | null | undefined): string {
  return String(v || '').trim() || '—'
}
