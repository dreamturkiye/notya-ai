import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { monthBoundsIso, aggregateMonthlyMusavirReport, type RawMonthlyInvoiceRow, type RawMonthlyPaymentRow } from './monthly'

describe('accounting/reports/monthly — monthBoundsIso', () => {
  it('returns the first instant of the month through the first instant of the next month', () => {
    const b = monthBoundsIso({ year: 2026, month: 10 })
    assert.equal(b.since, '2026-10-01T00:00:00.000Z')
    assert.equal(b.until, '2026-11-01T00:00:00.000Z')
  })

  it('rolls December over into January of the next year', () => {
    const b = monthBoundsIso({ year: 2026, month: 12 })
    assert.equal(b.since, '2026-12-01T00:00:00.000Z')
    assert.equal(b.until, '2027-01-01T00:00:00.000Z')
  })

  it('rejects an out-of-range month instead of silently wrapping', () => {
    assert.throws(() => monthBoundsIso({ year: 2026, month: 13 }), RangeError)
    assert.throws(() => monthBoundsIso({ year: 2026, month: 0 }), RangeError)
  })
})

describe('accounting/reports/monthly — aggregateMonthlyMusavirReport', () => {
  const period = { year: 2026, month: 10 }
  const bounds = monthBoundsIso(period)

  function invoice(partial: Partial<RawMonthlyInvoiceRow>): RawMonthlyInvoiceRow {
    return {
      id: 'inv-1',
      status: 'issued',
      docType: 'esmm',
      docNumber: 'ESM-1',
      issuedAt: '2026-10-05T10:00:00.000Z',
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
      createdAt: '2026-10-05T10:05:00.000Z',
      ...partial,
    }
  }

  it('sums matrah/KDV/total across all issued invoices and reconciles with the KDV özeti', () => {
    const invoices = [
      invoice({ id: 'a', subtotalKurus: 100000, kdvKurus: 10000, totalKurus: 110000 }),
      invoice({ id: 'b', subtotalKurus: 50000, kdvKurus: 5000, totalKurus: 55000 }),
    ]
    const report = aggregateMonthlyMusavirReport(period, bounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.toplamGelirKurus, 165000)
    assert.equal(report.kdvOzeti.matrahKurus, 150000)
    assert.equal(report.kdvOzeti.kdvKurus, 15000)
    // KDV özeti must reconcile: matrah + kdv === kdv-dahil total
    assert.equal(report.kdvOzeti.totalKurus, report.kdvOzeti.matrahKurus + report.kdvOzeti.kdvKurus)
    assert.equal(report.kdvOzeti.totalKurus, report.gelirGiderIcmali.toplamGelirKurus)
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 2)
  })

  it('excludes draft / issue_failed / pending_issue invoices from income — only real issued documents count', () => {
    const invoices = [
      invoice({ id: 'issued', status: 'issued' }),
      invoice({ id: 'draft', status: 'draft', issuedAt: null }),
      invoice({ id: 'failed', status: 'issue_failed' }),
      invoice({ id: 'pending', status: 'pending_issue' }),
    ]
    const report = aggregateMonthlyMusavirReport(period, bounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 1)
    assert.equal(report.kesilenBelgeler.length, 1)
    assert.equal(report.kesilenBelgeler[0].invoiceId, 'issued')
  })

  it('counts cancelled/credited invoices\' own totals as zero net income is NOT assumed — they still show as kesilen belgeler if issued, since cancellation accounting is out of this report\'s scope', () => {
    // Documents what the function actually does today rather than asserting unverified behaviour:
    // a cancelled invoice that WAS issued this month still counts (it was legally issued), credit
    // notes are a separate ledger entity this report does not currently net against it.
    const invoices = [invoice({ id: 'cancelled', status: 'cancelled' })]
    const report = aggregateMonthlyMusavirReport(period, bounds, invoices, [])
    assert.equal(report.gelirGiderIcmali.faturaSayisi, 1)
  })

  it('only counts "captured" payments as tahsilat — pending/failed/refunded never inflate collections', () => {
    const payments = [
      payment({ status: 'captured', amountKurus: 110000 }),
      payment({ status: 'pending', amountKurus: 999999 }),
      payment({ status: 'failed', amountKurus: 999999 }),
      payment({ status: 'refunded', amountKurus: 999999 }),
    ]
    const report = aggregateMonthlyMusavirReport(period, bounds, [], payments)
    assert.equal(report.gelirGiderIcmali.toplamTahsilatKurus, 110000)
  })

  it('buckets tahsilat by channel (bank key or facilitator key) and by method, reconciling totals', () => {
    const payments = [
      payment({ bankKey: 'garanti', facilitatorKey: null, method: 'card_3ds', amountKurus: 50000 }),
      payment({ bankKey: 'garanti', facilitatorKey: null, method: 'card_3ds', amountKurus: 30000 }),
      payment({ bankKey: null, facilitatorKey: 'iyzico', method: 'card_3ds', amountKurus: 20000 }),
      payment({ bankKey: null, facilitatorKey: null, method: 'nakit', amountKurus: 10000 }),
    ]
    const report = aggregateMonthlyMusavirReport(period, bounds, [], payments)
    const sumOfChannels = report.tahsilatOzeti.reduce((s, r) => s + r.capturedKurus, 0)
    assert.equal(sumOfChannels, report.gelirGiderIcmali.toplamTahsilatKurus)
    const garanti = report.tahsilatOzeti.find((r) => r.channelKey === 'garanti')
    assert.equal(garanti?.capturedKurus, 80000)
    assert.equal(garanti?.paymentCount, 2)
    const iyzico = report.tahsilatOzeti.find((r) => r.channelKey === 'iyzico')
    assert.equal(iyzico?.capturedKurus, 20000)
    const diger = report.tahsilatOzeti.find((r) => r.channelKey === 'diger')
    assert.equal(diger?.capturedKurus, 10000)
    assert.equal(diger?.method, 'nakit')
  })

  it('computes açık bakiye as kesilen minus tahsil edilen, floored at zero', () => {
    const invoices = [invoice({ totalKurus: 110000, subtotalKurus: 100000, kdvKurus: 10000 })]
    const underpaid = aggregateMonthlyMusavirReport(period, bounds, invoices, [payment({ amountKurus: 40000 })])
    assert.equal(underpaid.gelirGiderIcmali.acikBakiyeKurus, 70000)

    const overpaid = aggregateMonthlyMusavirReport(period, bounds, invoices, [payment({ amountKurus: 200000 })])
    assert.equal(overpaid.gelirGiderIcmali.acikBakiyeKurus, 0)
  })

  it('always states the stopaj note explicitly rather than omitting it', () => {
    const report = aggregateMonthlyMusavirReport(period, bounds, [], [])
    assert.ok(report.stopajNotu.length > 0)
  })

  it('sorts kesilen belgeler chronologically', () => {
    const invoices = [
      invoice({ id: 'late', issuedAt: '2026-10-20T00:00:00.000Z' }),
      invoice({ id: 'early', issuedAt: '2026-10-02T00:00:00.000Z' }),
    ]
    const report = aggregateMonthlyMusavirReport(period, bounds, invoices, [])
    assert.deepEqual(report.kesilenBelgeler.map((b) => b.invoiceId), ['early', 'late'])
  })

  it('handles an empty month without throwing and returns all-zero totals', () => {
    const report = aggregateMonthlyMusavirReport(period, bounds, [], [])
    assert.equal(report.gelirGiderIcmali.toplamGelirKurus, 0)
    assert.equal(report.gelirGiderIcmali.toplamTahsilatKurus, 0)
    assert.equal(report.kdvOzeti.invoiceCount, 0)
    assert.deepEqual(report.tahsilatOzeti, [])
    assert.deepEqual(report.kesilenBelgeler, [])
  })
})
