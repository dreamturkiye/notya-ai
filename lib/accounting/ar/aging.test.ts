import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bucketFor, computeAgingReport } from './aging'

const ASOF = '2026-10-15T00:00:00.000Z'
const daysAgo = (n: number) => new Date(new Date(ASOF).getTime() - n * 86400000).toISOString()

describe('accounting/ar/aging', () => {
  it('buckets by exact day boundaries', () => {
    assert.equal(bucketFor(0), '0-30')
    assert.equal(bucketFor(30), '0-30')
    assert.equal(bucketFor(31), '31-60')
    assert.equal(bucketFor(60), '31-60')
    assert.equal(bucketFor(61), '61-90')
    assert.equal(bucketFor(90), '61-90')
    assert.equal(bucketFor(91), '90+')
  })

  it('treats negative age (clock skew / not yet due) as 0-30 instead of throwing', () => {
    assert.equal(bucketFor(-5), '0-30')
  })

  it('ignores fully-paid invoices (zero or negative open balance)', () => {
    const report = computeAgingReport([
      { invoiceId: 'paid-1', issuedAt: daysAgo(100), openBalanceKurus: 0 },
    ], ASOF)
    assert.equal(report.totalOpenKurus, 0)
    assert.equal(report.buckets['90+'].invoiceIds.length, 0)
  })

  it('places invoices into the correct buckets and totals them', () => {
    const report = computeAgingReport(
      [
        { invoiceId: 'a', issuedAt: daysAgo(5), openBalanceKurus: 10000 },
        { invoiceId: 'b', issuedAt: daysAgo(45), openBalanceKurus: 20000 },
        { invoiceId: 'c', issuedAt: daysAgo(75), openBalanceKurus: 30000 },
        { invoiceId: 'd', issuedAt: daysAgo(120), openBalanceKurus: 40000 },
      ],
      ASOF
    )
    assert.deepEqual(report.buckets['0-30'].invoiceIds, ['a'])
    assert.deepEqual(report.buckets['31-60'].invoiceIds, ['b'])
    assert.deepEqual(report.buckets['61-90'].invoiceIds, ['c'])
    assert.deepEqual(report.buckets['90+'].invoiceIds, ['d'])
    assert.equal(report.totalOpenKurus, 100000)
  })

  it('rejects an unparsable date instead of silently mis-bucketing', () => {
    assert.throws(() =>
      computeAgingReport([{ invoiceId: 'x', issuedAt: 'not-a-date', openBalanceKurus: 100 }], ASOF)
    )
  })
})
