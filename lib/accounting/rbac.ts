/**
 * NOTYA-ACCOUNTING-01 — role-based access for the accounting module.
 *
 * Doktor is always full access. Sekreter/Asistan is limited by default (can charge, generate,
 * email, print; cancel/credit restricted) and the doktor can grant specific extra capabilities
 * per practice via `accounting_role_grants` (migration 151). This file is the single source of
 * truth for "can this actor do X" — API routes call `canPerform`, they never re-derive policy.
 *
 * Every mutation this file allows still has to go through hasta-izolasyon / ownership checks
 * (doktorId scoping) separately — RBAC answers "is this role allowed to do this kind of thing at
 * all", not "does this id belong to them".
 */
import type { AccountingRole } from './types'

export type AccountingCapability =
  | 'module.toggle'
  | 'credentials.ebelge.write'
  | 'credentials.bank.write'
  | 'catalog.read'
  | 'catalog.write'
  | 'invoice.draft.create'
  | 'invoice.draft.edit'
  | 'invoice.issue'
  | 'invoice.cancel'
  | 'invoice.credit'
  | 'invoice.discount.apply'
  | 'invoice.discount.apply_above_threshold'
  | 'payment.charge'
  | 'ar.view.own_assigned'
  | 'ar.view.all'
  | 'reports.view'
  | 'reports.export'
  | 'portal_visibility.toggle'
  // NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15): late-payment reminder drafts (lib/accounting/ar/
  // reminders.ts). Day-to-day collections work, same tier as invoice.issue/payment.charge — NOT
  // cancel/credit tier. Mirrored in lib/iletisim/kuyruk.ts's PERSONEL_TURLERI, which is the actual
  // send-time gate (these drafts are opened/sent through the existing iletisim queue, not a
  // separate accounting endpoint) — keep both defaults in sync.
  | 'ar.reminder.view'
  | 'ar.reminder.send'

/** Grants a doktor can hand to a sekreter on top of the sekreter defaults below. */
export interface SekreterGrants {
  canCancel?: boolean
  canCredit?: boolean
  canApplyDiscountAboveThreshold?: boolean
  canViewAllReports?: boolean
}

const DOKTOR_CAPS: Set<AccountingCapability> = new Set([
  'module.toggle',
  'credentials.ebelge.write',
  'credentials.bank.write',
  'catalog.read',
  'catalog.write',
  'invoice.draft.create',
  'invoice.draft.edit',
  'invoice.issue',
  'invoice.cancel',
  'invoice.credit',
  'invoice.discount.apply',
  'invoice.discount.apply_above_threshold',
  'payment.charge',
  'ar.view.own_assigned',
  'ar.view.all',
  'reports.view',
  'reports.export',
  'portal_visibility.toggle',
  'ar.reminder.view',
  'ar.reminder.send',
])

/** Default sekreter capabilities per docs/ARCH-NOTYA-ACCOUNTING.md §2.8: day-to-day billing, not
 *  credentials, not cancel/credit, not full AR/reports unless granted. Payment-reminder drafts
 *  (§4.6.6, 2026-10-15) are day-to-day billing/collections work in that same sense — this file's
 *  own header already describes the sekreter default as "can charge, generate, email, print" —
 *  so they're placed at that existing tier, not a new one. */
const SEKRETER_DEFAULT_CAPS: Set<AccountingCapability> = new Set([
  'catalog.read',
  'invoice.draft.create',
  'invoice.draft.edit',
  'invoice.issue',
  'invoice.discount.apply',
  'payment.charge',
  'ar.view.own_assigned',
  'portal_visibility.toggle',
  'ar.reminder.view',
  'ar.reminder.send',
])

export function canPerform(
  role: AccountingRole,
  capability: AccountingCapability,
  grants?: SekreterGrants
): boolean {
  if (role === 'doktor') return DOKTOR_CAPS.has(capability)
  // MOBIL-PERSONEL-01 defence in depth: asistan / hasta_danismani never hold an accounting capability, even if a route
  // forgot the pratikOturum role gate (lib/doktor/personelYetki.ts closes /api/accounting to them as well).
  if (role !== 'sekreter') return false

  if (SEKRETER_DEFAULT_CAPS.has(capability)) return true

  switch (capability) {
    case 'invoice.cancel':
      return !!grants?.canCancel
    case 'invoice.credit':
      return !!grants?.canCredit
    case 'invoice.discount.apply_above_threshold':
      return !!grants?.canApplyDiscountAboveThreshold
    case 'ar.view.all':
    case 'reports.view':
    case 'reports.export':
      return !!grants?.canViewAllReports
    default:
      // credentials.*, module.toggle, catalog.write — doktor-only, never grantable.
      return false
  }
}

export function assertCan(
  role: AccountingRole,
  capability: AccountingCapability,
  grants?: SekreterGrants
): void {
  if (!canPerform(role, capability, grants)) {
    throw new AccountingForbiddenError(role, capability)
  }
}

export class AccountingForbiddenError extends Error {
  constructor(public readonly role: AccountingRole, public readonly capability: AccountingCapability) {
    super(`${role} is not permitted to perform "${capability}"`)
    this.name = 'AccountingForbiddenError'
  }
}
