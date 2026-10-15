/**
 * NOTYA-ACCOUNTING-01 — fetch a sekreter's extra grants (accounting_role_grants, migration 151)
 * to pass into lib/accounting/rbac.ts canPerform/assertCan. Returns undefined for a doktor (no
 * grants row applies — doktor is always full access) or when no grant row exists (sekreter
 * defaults only).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActingUser } from './types'
import type { SekreterGrants } from './rbac'

export async function loadGrants(supabase: SupabaseClient, actor: ActingUser): Promise<SekreterGrants | undefined> {
  if (actor.role !== 'sekreter' || !actor.personelId) return undefined
  const { data } = await supabase
    .from('accounting_role_grants')
    .select('can_cancel, can_credit, can_apply_discount_above_threshold, can_view_all_reports')
    .eq('doctor_id', actor.doktorId)
    .eq('personel_id', actor.personelId)
    .maybeSingle()
  if (!data) return undefined
  return {
    canCancel: !!data.can_cancel,
    canCredit: !!data.can_credit,
    canApplyDiscountAboveThreshold: !!data.can_apply_discount_above_threshold,
    canViewAllReports: !!data.can_view_all_reports,
  }
}
