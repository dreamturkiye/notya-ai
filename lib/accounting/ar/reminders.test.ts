import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bucketFor } from './aging'
import {
  REMINDER_TIER_BY_BUCKET,
  reminderTierForAgeDays,
  buildReminderCandidates,
  odemeHatirlatmaAnahtari,
  toplamTutarKurus,
  type ReminderReceivable,
} from './reminders'

const ASOF = '2026-10-15T00:00:00.000Z'
const daysAgo = (n: number) => new Date(new Date(ASOF).getTime() - n * 86400000).toISOString()

const receivable = (over: Partial<ReminderReceivable>): ReminderReceivable => ({
  invoiceId: 'inv-1',
  doctorId: 'doc-1',
  patientId: 'pat-1',
  issuedAt: daysAgo(0),
  openBalanceKurus: 50000,
  faturaRef: '#inv-1',
  ...over,
})

describe('accounting/ar/reminders', () => {
  it('tier mapping aligns exactly with aging.ts buckets — 0-30 is grace, 31-60 gentle, 61-90/90+ firm', () => {
    assert.deepEqual(REMINDER_TIER_BY_BUCKET, { '0-30': 0, '31-60': 1, '61-90': 2, '90+': 2 })
    // Cross-check against the real bucketFor boundaries so a change to aging.ts's buckets cannot
    // silently desync this module's tiers.
    for (const days of [0, 15, 30, 31, 45, 60, 61, 75, 90, 91, 120]) {
      assert.equal(reminderTierForAgeDays(days), REMINDER_TIER_BY_BUCKET[bucketFor(days)])
    }
  })

  it('a fresh invoice (0-30) gets no reminder candidate', () => {
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(10) })], new Set())
    assert.equal(out.length, 0)
  })

  it('31-60 days overdue produces exactly one TIER 1 candidate', () => {
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(40) })], new Set(), ASOF)
    assert.equal(out.length, 1)
    assert.equal(out[0].tier, 1)
    assert.equal(out[0].bucket, '31-60')
    assert.equal(out[0].tekilAnahtar, 'odeme_hatirlatma:inv-1:31-60')
  })

  it('61-90 and 90+ both produce TIER 2 candidates', () => {
    const out61 = buildReminderCandidates([receivable({ issuedAt: daysAgo(70) })], new Set(), ASOF)
    const out90 = buildReminderCandidates([receivable({ issuedAt: daysAgo(120) })], new Set(), ASOF)
    assert.equal(out61[0].tier, 2)
    assert.equal(out61[0].bucket, '61-90')
    assert.equal(out90[0].tier, 2)
    assert.equal(out90[0].bucket, '90+')
  })

  it('a fully-paid invoice (zero open balance) never produces a candidate, however old', () => {
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(200), openBalanceKurus: 0 })], new Set(), ASOF)
    assert.equal(out.length, 0)
  })

  it('an invoice with no patient record is skipped — no one to message, matching the iletisim "serbest randevu" rule', () => {
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(40), patientId: null })], new Set(), ASOF)
    assert.equal(out.length, 0)
  })

  it('idempotent: a key that already exists (any status) is never re-proposed for the SAME bucket', () => {
    const existing = new Set([odemeHatirlatmaAnahtari('inv-1', '31-60')])
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(40) })], existing, ASOF)
    assert.equal(out.length, 0)
  })

  it('escalation: an existing tier-1 draft does not block a NEW tier-2 draft once the invoice ages further', () => {
    const existing = new Set([odemeHatirlatmaAnahtari('inv-1', '31-60')])
    const out = buildReminderCandidates([receivable({ issuedAt: daysAgo(70) })], existing, ASOF)
    assert.equal(out.length, 1)
    assert.equal(out[0].bucket, '61-90')
    assert.equal(out[0].tier, 2)
  })

  it('sums candidate amounts in integer kuruş', () => {
    const out = buildReminderCandidates(
      [receivable({ invoiceId: 'a', issuedAt: daysAgo(40), openBalanceKurus: 10000 }), receivable({ invoiceId: 'b', issuedAt: daysAgo(70), openBalanceKurus: 25000 })],
      new Set(),
      ASOF
    )
    assert.equal(toplamTutarKurus(out), 35000)
  })

  it('odemeHatirlatmaAnahtari matches the literal format lib/iletisim/kuyruk.ts duplicates by hand', () => {
    assert.equal(odemeHatirlatmaAnahtari('xyz', '90+'), 'odeme_hatirlatma:xyz:90+')
  })
})
