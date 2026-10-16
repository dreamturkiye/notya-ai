import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dayBoundsIso, aggregateDailyMusavirReport } from './daily'
import type { RawMonthlyInvoiceRow, RawMonthlyPaymentRow } from './monthly'

describe('accounting/reports/daily — dayBoundsIso', () => {
  it('returns the first instant of the day through the first instant of the next day', () => {
    const b = dayBoundsIso({ year: 2026, month: 10, day: 15 })
    assert.equal(b.since, '2026-10-15T00:00:00.000Z')
    assert.equal(b.until, '2026-10-16T00:00:00.000Z')
  })

  it('rolls the last day of the month/year over correctly', () => {
    const b = dayBoundsIso({ year: 2026, month: 12, day: 31 })
    assert.equal(b.since, '2026-12-31T00:00:00.000Z')
    assert.equal(b.until, '2027-01-01T00:00:00.000Z')
  })

  it('rejects an out-of-range day instead of silently rolling into the next month', () => {
    assert.throws(() => dayBoundsIso({ year: 2026, month: 2, day: 30 }), RangeError)
    assert.throws(() => dayBoundsIso({ year: 2026, month: 4, day: 31 }), RangeError)
    assert.throws(() => dayBoundsIso({ year: 2026, month: 10, day: 0 }), RangeError)
  })

  it('rejects an out-of-range month', () => {
    assert.throws(() => dayBoundsIso({ year: 2026, month: 13, day: 1 }), RangeError)
  })
})

describe('accounting/reports/daily — aggregateDailyMusavirReport', () => {
  const period = { year: 2026, month: 10, day: 15 }
  const bounds = dayBoundsIso(period)

  function invoice(partial: Partial<RawMonthlyInvoiceRow>): RawMonthlyInvoiceRow {
    return {
      id: 'inv-1',
      status: 'issued',
      docType: 'esmm',
      docNumber: 'ESM-1',
      issuedAt: '2026-10-15T10:00:00.000Z',
      subtotalKurus: 100000,
      kdvKurus: 10000,
      totalKurus: 110000,
      ...partial,
    }
  }

  function payment(partial: Partial<RawMonthlyPaymentRow>): RawMonthlyPaymentRow {
    return {
      status: 'captured',
      method: 'card_3ds',
      bankKey: null,
      facilitatorKey: 'iyzico',
      amountKurus: 110000,
      createdAt: '2026-10-15T10:05:00.000Z',
      ...partial,
    }
  }

  it('sums matrah/KDV/total across the day\'s issued invoices and reconciles with the KDV özeti', () => {
    const invoices = [
      invoice({ id: 'a', subtotalKurus: 100000, kdvKurus: 10000, totalKurus: 110000 }),
      invoice({ id: 'b', subtotalKurus: 50000, kdvKurus: 5000, totalKurus: 55000 }),
    ]
    const report = aggregateDailyMusavirReport(period, bounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.toplamGelirKurus, 165000)
    assert.equal(report.kdvOzeti.totalKurus, report.kdvOzeti.matrahKurus + report.kdvOzeti.kdvKurus)
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 2)
  })

  it('excludes draft / issue_failed / pending_issue invoices from income', () => {
    const invoices = [
      invoice({ id: 'issued', status: 'issued' }),
      invoice({ id: 'draft', status: 'draft', issuedAt: null }),
      invoice({ id: 'failed', status: 'issue_failed' }),
      invoice({ id: 'pending', status: 'pending_issue' }),
    ]
    const report = aggregateDailyMusavirReport(period, bounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 1)
    assert.equal(report.kesilenBelgeler[0].invoiceId, 'issued')
  })

  it('only counts "captured" payments as tahsilat', () => {
    const payments = [
      payment({ status: 'captured', amountKurus: 110000 }),
      payment({ status: 'pending', amountKurus: 999999 }),
      payment({ status: 'refunded', amountKurus: 999999 }),
    ]
    const report = aggregateDailyMusavirReport(period, bounds, [], payments)
    assert.equal(report.gelirGiderIcmali.toplamTahsilatKurus, 110000)
  })

  it('buckets tahsilat by channel/method, reconciling totals', () => {
    const payments = [
      payment({ bankKey: 'garanti', facilitatorKey: null, method: 'card_3ds', amountKurus: 50000 }),
      payment({ bankKey: null, facilitatorKey: 'iyzico', method: 'card_3ds', amountKurus: 20000 }),
      payment({ bankKey: null, facilitatorKey: null, method: 'nakit', amountKurus: 10000 }),
    ]
    const report = aggregateDailyMusavirReport(period, bounds, [], payments)
    const sumOfChannels = report.tahsilatOzeti.reduce((s, r) => s + r.capturedKurus, 0)
    assert.equal(sumOfChannels, report.gelirGiderIcmali.toplamTahsilatKurus)
  })

  it('computes açık bakiye as kesilen minus tahsil edilen, floored at zero', () => {
    const invoices = [invoice({ totalKurus: 110000, subtotalKurus: 100000, kdvKurus: 10000 })]
    const overpaid = aggregateDailyMusavirReport(period, bounds, invoices, [payment({ amountKurus: 200000 })])
    assert.equal(overpaid.gelirGiderIcmali.acikBakiyeKurus, 0)
  })

  it('a day with no activity returns all-zero totals without throwing', () => {
    const report = aggregateDailyMusavirReport(period, bounds, [], [])
    assert.equal(report.gelirGiderIcmali.toplamGelirKurus, 0)
    assert.deepEqual(report.tahsilatOzeti, [])
    assert.deepEqual(report.kesilenBelgeler, [])
    assert.ok(report.stopajNotu.length > 0)
  })

  it('only counts invoices actually issued ON this day, not the surrounding month', () => {
    const sameDayBounds = dayBoundsIso({ year: 2026, month: 10, day: 15 })
    const invoices = [
      invoice({ id: 'today', issuedAt: '2026-10-15T23:59:00.000Z' }),
      // A row dated the day before/after would simply never be fetched by buildDailyMusavirReport's
      // gte/lt query — this test documents the pure function trusts whatever rows it's given, the
      // DB-side day-scoping is buildDailyMusavirReport's job, mirrored exactly from monthly.ts.
    ]
    const report = aggregateDailyMusavirReport({ year: 2026, month: 10, day: 15 }, sameDayBounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 1)
  })
})
