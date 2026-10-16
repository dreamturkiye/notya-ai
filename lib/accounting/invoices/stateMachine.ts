/**
 * NOTYA-ACCOUNTING-01 — invoice lifecycle state machine.
 *
 * Pure, side-effect-free: given a current status and an action, returns the next status or
 * throws. The invoice engine (lib/accounting/invoices/engine.ts) is the only caller that is
 * allowed to persist a transition; nothing else in the module should set `invoices.status`
 * directly, so every transition is provably legal and auditable in one place.
 */
import type { InvoiceStatus } from '../types'

export type InvoiceAction =
  | 'validate' // draft -> pending_issue
  | 'issue_success' // pending_issue -> issued
  | 'issue_failure' // pending_issue -> issue_failed
  | 'retry_issue' // issue_failed -> pending_issue
  | 'edit_draft' // issue_failed -> draft (doctor abandons this submission, edits lines)
  | 'record_partial_payment' // issued -> partially_paid
  | 'record_full_payment' // issued | partially_paid -> paid
  | 'request_cancel' // draft | issued -> cancel_pending
  | 'cancel_success' // cancel_pending -> cancelled
  | 'cancel_failure' // cancel_pending -> issued (integrator refused the void)
  | 'request_credit' // issued | partially_paid | paid -> credit_pending
  | 'credit_success' // credit_pending -> credited
  | 'credit_failure' // credit_pending -> previous status (caller supplies it)
  // NOTYA-ACCOUNTING-GIB-PORTAL-01 (2026-10-16): pending_issue -> draft, for the GİB Portalı
  // manual-entry path only (lib/accounting/invoices/engine.ts's `abandonGibPortalPrepare`) — the
  // doctor prepared the numbers but spotted a mistake before actually issuing anything on GİB's
  // own site, so the lines go back to being editable. Gated to GİB-Portalı-vendor invoices at the
  // engine layer, not here — this state machine stays a pure "is this transition legal at all"
  // check, same as every other action in this file.
  | 'abandon_prepare' // pending_issue -> draft

const TRANSITIONS: Record<InvoiceAction, { from: InvoiceStatus[]; to: InvoiceStatus }> = {
  validate: { from: ['draft'], to: 'pending_issue' },
  issue_success: { from: ['pending_issue'], to: 'issued' },
  issue_failure: { from: ['pending_issue'], to: 'issue_failed' },
  retry_issue: { from: ['issue_failed'], to: 'pending_issue' },
  edit_draft: { from: ['issue_failed'], to: 'draft' },
  abandon_prepare: { from: ['pending_issue'], to: 'draft' },
  record_partial_payment: { from: ['issued', 'partially_paid'], to: 'partially_paid' },
  record_full_payment: { from: ['issued', 'partially_paid'], to: 'paid' },
  request_cancel: { from: ['draft', 'issued'], to: 'cancel_pending' },
  cancel_success: { from: ['cancel_pending'], to: 'cancelled' },
  cancel_failure: { from: ['cancel_pending'], to: 'issued' },
  request_credit: { from: ['issued', 'partially_paid', 'paid'], to: 'credit_pending' },
  credit_success: { from: ['credit_pending'], to: 'credited' },
  credit_failure: { from: ['credit_pending'], to: 'issued' },
}

export class InvalidInvoiceTransitionError extends Error {
  constructor(public readonly from: InvoiceStatus, public readonly action: InvoiceAction) {
    super(`Invoice cannot go from "${from}" via "${action}"`)
    this.name = 'InvalidInvoiceTransitionError'
  }
}

export function nextInvoiceStatus(current: InvoiceStatus, action: InvoiceAction): InvoiceStatus {
  const def = TRANSITIONS[action]
  if (!def.from.includes(current)) {
    throw new InvalidInvoiceTransitionError(current, action)
  }
  return def.to
}

export function canTransition(current: InvoiceStatus, action: InvoiceAction): boolean {
  return TRANSITIONS[action].from.includes(current)
}

/** Terminal states — no further action mutates status (credit notes create a new linked entity instead). */
export const TERMINAL_STATUSES: InvoiceStatus[] = ['cancelled', 'credited']

export function isTerminal(status: InvoiceStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/** Whether an invoice in this status may still have its draft lines edited. */
export function isEditable(status: InvoiceStatus): boolean {
  return status === 'draft'
}
