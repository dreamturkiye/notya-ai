import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { nextInvoiceStatus, canTransition, isTerminal, isEditable, InvalidInvoiceTransitionError } from './stateMachine'

describe('accounting/invoices/stateMachine', () => {
  it('walks the happy path draft -> pending_issue -> issued -> paid', () => {
    let s = nextInvoiceStatus('draft', 'validate')
    assert.equal(s, 'pending_issue')
    s = nextInvoiceStatus(s, 'issue_success')
    assert.equal(s, 'issued')
    s = nextInvoiceStatus(s, 'record_full_payment')
    assert.equal(s, 'paid')
  })

  it('walks the partial-payment path', () => {
    let s = nextInvoiceStatus('issued', 'record_partial_payment')
    assert.equal(s, 'partially_paid')
    s = nextInvoiceStatus(s, 'record_full_payment')
    assert.equal(s, 'paid')
  })

  it('handles issue failure and retry', () => {
    let s = nextInvoiceStatus('pending_issue', 'issue_failure')
    assert.equal(s, 'issue_failed')
    s = nextInvoiceStatus(s, 'retry_issue')
    assert.equal(s, 'pending_issue')
  })

  it('allows editing a failed draft back to draft', () => {
    assert.equal(nextInvoiceStatus('issue_failed', 'edit_draft'), 'draft')
  })

  it('allows abandoning a GİB Portalı prepare back to draft', () => {
    assert.equal(nextInvoiceStatus('pending_issue', 'abandon_prepare'), 'draft')
  })

  it('rejects abandoning a prepare that is not actually pending', () => {
    assert.throws(() => nextInvoiceStatus('draft', 'abandon_prepare'), InvalidInvoiceTransitionError)
    assert.throws(() => nextInvoiceStatus('issued', 'abandon_prepare'), InvalidInvoiceTransitionError)
  })

  it('walks cancel path from issued', () => {
    let s = nextInvoiceStatus('issued', 'request_cancel')
    assert.equal(s, 'cancel_pending')
    s = nextInvoiceStatus(s, 'cancel_success')
    assert.equal(s, 'cancelled')
  })

  it('rejects cancelling an already-cancelled invoice', () => {
    assert.throws(() => nextInvoiceStatus('cancelled', 'request_cancel'), InvalidInvoiceTransitionError)
  })

  it('rejects issuing a draft directly (must validate first)', () => {
    assert.throws(() => nextInvoiceStatus('draft', 'issue_success'))
  })

  it('rejects paying a draft invoice', () => {
    assert.throws(() => nextInvoiceStatus('draft', 'record_full_payment'))
  })

  it('walks credit note path from a paid invoice', () => {
    let s = nextInvoiceStatus('paid', 'request_credit')
    assert.equal(s, 'credit_pending')
    s = nextInvoiceStatus(s, 'credit_success')
    assert.equal(s, 'credited')
  })

  it('credit failure reverts to issued', () => {
    assert.equal(nextInvoiceStatus('credit_pending', 'credit_failure'), 'issued')
  })

  it('canTransition mirrors nextInvoiceStatus legality', () => {
    assert.equal(canTransition('draft', 'validate'), true)
    assert.equal(canTransition('draft', 'issue_success'), false)
  })

  it('identifies terminal states', () => {
    assert.equal(isTerminal('cancelled'), true)
    assert.equal(isTerminal('credited'), true)
    assert.equal(isTerminal('paid'), false)
  })

  it('only draft invoices are editable', () => {
    assert.equal(isEditable('draft'), true)
    assert.equal(isEditable('issued'), false)
    assert.equal(isEditable('issue_failed'), false)
  })
})
