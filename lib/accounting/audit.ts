/**
 * NOTYA-ACCOUNTING-01 — audit log writer. Every mutation in this module calls this; nothing
 * writes `accounting_*` tables without an accompanying audit row (docs/ARCH-NOTYA-ACCOUNTING.md
 * §2.8). `before`/`after` must already be redacted (never raw credential secrets — pass through
 * lib/accounting/vault.ts maskSecrets() first for any credentials entity).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccountingRole } from './types'

export interface AuditEntry {
  doctorId: string
  actorId: string
  actorRole: AccountingRole
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  ip?: string
}

export async function writeAuditLog(supabase: SupabaseClient, entry: AuditEntry): Promise<void> {
  await supabase.from('accounting_audit_log').insert({
    doctor_id: entry.doctorId,
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before_json: entry.before ?? null,
    after_json: entry.after ?? null,
    ip: entry.ip ?? null,
  })
  // Audit writes are best-effort-logged but never block the caller — a failed audit insert must
  // not roll back a real invoice/payment mutation. Errors are swallowed here on purpose; Supabase
  // client calls above don't throw on a non-2xx by default (PostgREST client resolves with
  // `error` set), so there is nothing to catch — this comment documents that choice explicitly.
}
