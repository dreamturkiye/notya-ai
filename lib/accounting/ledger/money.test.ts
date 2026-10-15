import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertKurus,
  kdvOf,
  applyPercentDiscount,
  applyFixedDiscount,
  computeLine,
  computeInvoiceTotals,
  formatTRY,
} from './money'

describe('accounting/ledger/money', () => {
  it('rejects floats as amounts', () => {
    assert.throws(() => assertKurus(10.5), TypeError)
    assert.doesNotThrow(() => assertKurus(1050))
  })

  it('computes KDV at the default 10% health rate', () => {
    // 100.00 TRY matrah -> 10.00 TRY KDV
    assert.equal(kdvOf(10000, 1000), 1000)
  })

  it('rounds KDV to the nearest kuruş', () => {
    // 33 kuruş matrah * 10% = 3.3 -> rounds to 3
    assert.equal(kdvOf(33, 1000), 3)
  })

  it('applies a percent discount correctly', () => {
    const r = applyPercentDiscount(10000, 1000) // 10% of 100.00 TRY
    assert.equal(r.discountKurus, 1000)
    assert.equal(r.netKurus, 9000)
  })

  it('clamps a fixed discount so net never goes negative', () => {
    const r = applyFixedDiscount(500, 10000)
    assert.equal(r.discountKurus, 500)
    assert.equal(r.netKurus, 0)
  })

  it('computes a single line: 2x 500 TRY muayene, 10% KDV, no discount', () => {
    const line = computeLine({ quantity: 2, unitPriceKurus: 50000, kdvRateBp: 1000 })
    assert.equal(line.grossKurus, 100000)
    assert.equal(line.matrahKurus, 100000)
    assert.equal(line.kdvKurus, 10000)
    assert.equal(line.lineTotalKurus, 110000)
  })

  it('computes a line with a line-level discount', () => {
    const line = computeLine({ quantity: 1, unitPriceKurus: 100000, discountKurus: 20000, kdvRateBp: 1000 })
    assert.equal(line.matrahKurus, 80000)
    assert.equal(line.kdvKurus, 8000)
    assert.equal(line.lineTotalKurus, 88000)
  })

  it('rejects a line discount larger than the line gross', () => {
    assert.throws(() => computeLine({ quantity: 1, unitPriceKurus: 1000, discountKurus: 2000, kdvRateBp: 1000 }))
  })

  it('sums multiple lines with no invoice discount', () => {
    const l1 = computeLine({ quantity: 1, unitPriceKurus: 50000, kdvRateBp: 1000 })
    const l2 = computeLine({ quantity: 1, unitPriceKurus: 30000, kdvRateBp: 1000 })
    const totals = computeInvoiceTotals([l1, l2])
    assert.equal(totals.subtotalKurus, 80000)
    assert.equal(totals.kdvKurus, 8000)
    assert.equal(totals.totalKurus, 88000)
  })

  it('applies an invoice-level percent discount, re-deriving KDV proportionally', () => {
    const l1 = computeLine({ quantity: 1, unitPriceKurus: 100000, kdvRateBp: 1000 }) // 110000 incl KDV
    const totals = computeInvoiceTotals([l1], { type: 'percent', value: 10 }) // 10% off the 110000 total
    assert.equal(totals.discountKurus, 11000)
    // keepRatio = 0.9 -> matrah 90000, kdv 9000, total 99000
    assert.equal(totals.totalKurus, 99000)
    assert.equal(totals.kdvKurus, 9000)
  })

  it('applies an invoice-level fixed discount', () => {
    const l1 = computeLine({ quantity: 1, unitPriceKurus: 100000, kdvRateBp: 1000 })
    const totals = computeInvoiceTotals([l1], { type: 'fixed', value: 11000 })
    assert.equal(totals.discountKurus, 11000)
    assert.equal(totals.totalKurus, 99000)
  })

  it('formats kuruş as Turkish-locale TRY — dot thousands, comma decimals, ₺ suffix', () => {
    assert.equal(formatTRY(123456), '1.234,56 ₺')
    assert.equal(formatTRY(0), '0,00 ₺')
    assert.equal(formatTRY(50000), '500,00 ₺')
  })

  it('formatTRY rejects a float kuruş amount the same as every other money helper', () => {
    assert.throws(() => formatTRY(10.5), TypeError)
  })
})
