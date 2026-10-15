import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canPerform, assertCan, AccountingForbiddenError } from './rbac'

describe('accounting/rbac', () => {
  it('doktor can do everything, including credential writes', () => {
    assert.equal(canPerform('doktor', 'credentials.ebelge.write'), true)
    assert.equal(canPerform('doktor', 'invoice.cancel'), true)
    assert.equal(canPerform('doktor', 'invoice.credit'), true)
    assert.equal(canPerform('doktor', 'module.toggle'), true)
  })

  it('sekreter can charge, draft, issue and view own-assigned AR by default', () => {
    assert.equal(canPerform('sekreter', 'invoice.draft.create'), true)
    assert.equal(canPerform('sekreter', 'invoice.issue'), true)
    assert.equal(canPerform('sekreter', 'payment.charge'), true)
    assert.equal(canPerform('sekreter', 'ar.view.own_assigned'), true)
  })

  it('sekreter cannot touch credentials or toggle the module, ever, even with grants', () => {
    assert.equal(
      canPerform('sekreter', 'credentials.ebelge.write', {
        canCancel: true,
        canCredit: true,
        canApplyDiscountAboveThreshold: true,
        canViewAllReports: true,
      }),
      false
    )
    assert.equal(canPerform('sekreter', 'module.toggle', { canCancel: true }), false)
  })

  it('sekreter cannot cancel or credit by default', () => {
    assert.equal(canPerform('sekreter', 'invoice.cancel'), false)
    assert.equal(canPerform('sekreter', 'invoice.credit'), false)
  })

  it('sekreter CAN cancel/credit when explicitly granted by the doktor', () => {
    assert.equal(canPerform('sekreter', 'invoice.cancel', { canCancel: true }), true)
    assert.equal(canPerform('sekreter', 'invoice.credit', { canCredit: true }), true)
    // granting one does not imply the other
    assert.equal(canPerform('sekreter', 'invoice.credit', { canCancel: true }), false)
  })

  it('sekreter cannot view full AR/reports unless granted', () => {
    assert.equal(canPerform('sekreter', 'ar.view.all'), false)
    assert.equal(canPerform('sekreter', 'ar.view.all', { canViewAllReports: true }), true)
    assert.equal(canPerform('sekreter', 'reports.export', { canViewAllReports: true }), true)
  })

  it('assertCan throws AccountingForbiddenError on a disallowed capability', () => {
    assert.throws(() => assertCan('sekreter', 'module.toggle'), AccountingForbiddenError)
    assert.doesNotThrow(() => assertCan('doktor', 'module.toggle'))
  })

  // NOTYA-ACCOUNTING-COMPLIANCE-01 (2026-10-15): payment-reminder drafts are day-to-day collections
  // work, explicitly the same tier as invoice.issue/payment.charge per §2.8's own "can charge,
  // generate, email, print" wording — sekreter has both by DEFAULT, no grant needed. This mirrors
  // lib/iletisim/kuyruk.ts's PERSONEL_TURLERI (which is the actual send-time gate for this feature,
  // since reminders are opened/sent through the existing iletisim queue) — a sekreter without an
  // explicit grant must still be able to view and send a reminder, and that is asserted here, not
  // assumed.
  it('sekreter can view and send payment-reminder drafts by default (no grant needed)', () => {
    assert.equal(canPerform('sekreter', 'ar.reminder.view'), true)
    assert.equal(canPerform('sekreter', 'ar.reminder.send'), true)
    assert.doesNotThrow(() => assertCan('sekreter', 'ar.reminder.view'))
    assert.doesNotThrow(() => assertCan('sekreter', 'ar.reminder.send'))
  })

  it('doktor can also view and send payment-reminder drafts', () => {
    assert.equal(canPerform('doktor', 'ar.reminder.view'), true)
    assert.equal(canPerform('doktor', 'ar.reminder.send'), true)
  })
})
