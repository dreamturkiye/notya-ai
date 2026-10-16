/**
 * NOTYA-ACCOUNTING-INTL-01 — the 'simple_invoice' flow: no external submission, because no
 * government mandate requires one for this business (task brief option (b)). "Issuing" a
 * document under this flow means validating the seller has every field this country legally
 * requires and recording that the doctor is the issuer of record — not calling anything.
 */
import type { CountryBillingKit, MinorUnits, RequiredSellerField } from './types'
import { computeTaxLine } from './compliance'

export interface SellerFieldValues {
  [key: string]: string | undefined
}

export interface SimpleInvoiceLine {
  description: string
  quantity: number
  unitPriceMinorUnits: MinorUnits
  isMedicalService?: boolean
}

export interface SimpleInvoiceDocument {
  countryCode: CountryBillingKit['countryCode']
  issuerIsDoctor: true
  missingSellerFields: string[]
  subtotalMinorUnits: MinorUnits
  taxLabel: string
  taxMinorUnits: MinorUnits
  totalMinorUnits: MinorUnits
  exempt: boolean
  readyToIssue: boolean
}

function findMissingFields(fields: RequiredSellerField[], values: SellerFieldValues): string[] {
  return fields.filter((f) => f.required && !String(values[f.key] || '').trim()).map((f) => f.label)
}

export function buildSimpleInvoiceDocument(
  kit: CountryBillingKit,
  lines: SimpleInvoiceLine[],
  sellerFieldValues: SellerFieldValues
): SimpleInvoiceDocument {
  const missingSellerFields = findMissingFields(kit.requiredSellerFields, sellerFieldValues)
  let subtotal = 0
  let tax = 0
  let total = 0
  let allExempt = true
  for (const line of lines) {
    const lineSubtotal = line.unitPriceMinorUnits * line.quantity
    const computed = computeTaxLine({ kit, subtotalMinorUnits: lineSubtotal, isMedicalService: line.isMedicalService })
    subtotal += lineSubtotal
    tax += computed.taxMinorUnits
    total += computed.totalMinorUnits
    allExempt = allExempt && computed.exempt
  }
  return {
    countryCode: kit.countryCode,
    issuerIsDoctor: true,
    missingSellerFields,
    subtotalMinorUnits: subtotal,
    taxLabel: kit.taxLine.label,
    taxMinorUnits: tax,
    totalMinorUnits: total,
    exempt: allExempt,
    readyToIssue: missingSellerFields.length === 0 && lines.length > 0,
  }
}
