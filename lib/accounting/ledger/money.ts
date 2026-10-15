/**
 * NOTYA-ACCOUNTING-01 — integer kuruş money math. No floats anywhere.
 *
 * Every function here takes/returns `Money` (an integer number of kuruş) and asserts its inputs
 * are safe integers, so a float slipping in from a bad call site throws immediately instead of
 * silently rounding somewhere downstream in a tax computation.
 */
import type { Money } from '../types'

export function assertKurus(value: number, label = 'amount'): Money {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer kuruş amount, got ${value}`)
  }
  return value
}

export function addKurus(...values: number[]): Money {
  return values.reduce((sum, v) => sum + assertKurus(v, 'addend'), 0)
}

export function subtractKurus(a: number, b: number): Money {
  return assertKurus(a, 'minuend') - assertKurus(b, 'subtrahend')
}

/** Round-half-up to the nearest kuruş. Used wherever a percentage computation can be fractional. */
export function roundKurus(value: number): Money {
  return Math.round(value)
}

/**
 * Apply a KDV rate (in basis points, e.g. 1000 = 10.00%) to a matrah (tax base) in kuruş.
 * Returns the KDV amount in kuruş, rounded to the nearest kuruş.
 */
export function kdvOf(matrahKurus: number, kdvRateBp: number): Money {
  assertKurus(matrahKurus, 'matrah')
  if (!Number.isInteger(kdvRateBp) || kdvRateBp < 0) {
    throw new TypeError(`kdvRateBp must be a non-negative integer (basis points), got ${kdvRateBp}`)
  }
  return roundKurus((matrahKurus * kdvRateBp) / 10000)
}

export interface DiscountResult {
  discountKurus: Money
  netKurus: Money
}

/** Percent discount in basis points (e.g. 1000 = 10%) applied to a kuruş amount. */
export function applyPercentDiscount(amountKurus: number, percentBp: number): DiscountResult {
  assertKurus(amountKurus, 'amount')
  if (!Number.isInteger(percentBp) || percentBp < 0 || percentBp > 10000) {
    throw new RangeError(`percentBp must be an integer 0-10000, got ${percentBp}`)
  }
  const discountKurus = roundKurus((amountKurus * percentBp) / 10000)
  return { discountKurus, netKurus: amountKurus - discountKurus }
}

/** Fixed kuruş discount, clamped so it never makes the net amount negative. */
export function applyFixedDiscount(amountKurus: number, discountKurus: number): DiscountResult {
  assertKurus(amountKurus, 'amount')
  assertKurus(discountKurus, 'discountKurus')
  if (discountKurus < 0) throw new RangeError('discountKurus cannot be negative')
  const clamped = Math.min(discountKurus, amountKurus)
  return { discountKurus: clamped, netKurus: amountKurus - clamped }
}

export interface LineComputationInput {
  quantity: number
  unitPriceKurus: Money
  /** Line-level discount already resolved to kuruş (percent discounts are resolved by the caller
   *  via applyPercentDiscount/applyFixedDiscount before calling this). */
  discountKurus?: Money
  kdvRateBp: number
}

export interface LineComputationResult {
  grossKurus: Money
  discountKurus: Money
  matrahKurus: Money
  kdvKurus: Money
  lineTotalKurus: Money
}

/** Compute a single invoice line: gross → discount → matrah → KDV → total. */
export function computeLine(input: LineComputationInput): LineComputationResult {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new RangeError(`quantity must be positive, got ${input.quantity}`)
  }
  assertKurus(input.unitPriceKurus, 'unitPriceKurus')
  const discountKurus = assertKurus(input.discountKurus ?? 0, 'discountKurus')
  const grossKurus = roundKurus(input.quantity * input.unitPriceKurus)
  if (discountKurus > grossKurus) {
    throw new RangeError('line discount cannot exceed the line gross amount')
  }
  const matrahKurus = grossKurus - discountKurus
  const kdvKurus = kdvOf(matrahKurus, input.kdvRateBp)
  return {
    grossKurus,
    discountKurus,
    matrahKurus,
    kdvKurus,
    lineTotalKurus: matrahKurus + kdvKurus,
  }
}

export interface InvoiceTotals {
  subtotalKurus: Money // sum of line matrah (post line-discount, pre invoice-discount)
  discountKurus: Money // invoice-level discount only (line discounts already folded into subtotal)
  kdvKurus: Money
  totalKurus: Money
}

/**
 * Sum lines + apply an optional invoice-level discount (proportionally re-deriving KDV on the
 * reduced matrah — never just subtracting from the total, which would understate KDV owed).
 */
export function computeInvoiceTotals(
  lines: LineComputationResult[],
  invoiceDiscount?: { type: 'percent' | 'fixed'; value: number }
): InvoiceTotals {
  const grossMatrah = addKurus(...lines.map((l) => l.matrahKurus))
  const grossKdv = addKurus(...lines.map((l) => l.kdvKurus))
  const lineDiscounts = addKurus(...lines.map((l) => l.discountKurus))

  if (!invoiceDiscount) {
    return {
      subtotalKurus: grossMatrah,
      discountKurus: lineDiscounts,
      kdvKurus: grossKdv,
      totalKurus: grossMatrah + grossKdv,
    }
  }

  const grossWithKdv = grossMatrah + grossKdv
  let invoiceDiscountKurus: Money
  if (invoiceDiscount.type === 'percent') {
    invoiceDiscountKurus = applyPercentDiscount(grossWithKdv, Math.round(invoiceDiscount.value * 100)).discountKurus
  } else {
    invoiceDiscountKurus = applyFixedDiscount(grossWithKdv, invoiceDiscount.value).discountKurus
  }
  // Re-derive matrah/KDV proportionally so the KDV portion of the discount is tracked honestly
  // instead of silently discounting only the tax-inclusive total.
  const keepRatio = grossWithKdv === 0 ? 0 : (grossWithKdv - invoiceDiscountKurus) / grossWithKdv
  const newMatrah = roundKurus(grossMatrah * keepRatio)
  const newKdv = roundKurus(grossKdv * keepRatio)
  return {
    subtotalKurus: grossMatrah,
    discountKurus: lineDiscounts + invoiceDiscountKurus,
    kdvKurus: newKdv,
    totalKurus: newMatrah + newKdv,
  }
}
