/**
 * NOTYA-ACCOUNTING-INTL-01 — country-agnostic tax-line computation for the 6 non-TR country
 * kits. Same integer-only convention as `lib/accounting/ledger/money.ts`, applied to generic
 * minor units instead of TRY kuruş specifically — see `types.ts`'s header comment for why this
 * is a parallel module rather than an import from the TR ledger.
 */
import type { CountryBillingKit, MinorUnits } from './types'

export function assertMinorUnits(value: number, label = 'amount'): MinorUnits {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer minor-unit amount, got ${value}`)
  }
  return value
}

export interface ComputeTaxLineInput {
  kit: CountryBillingKit
  subtotalMinorUnits: MinorUnits
  /** False for a non-medical/ancillary/cosmetic line item — forces the standard rate even in a
   *  country whose ordinary medical service is exempt. Defaults to true (the common case: an
   *  ordinary clinical consultation). */
  isMedicalService?: boolean
}

export interface ComputedTaxLine {
  label: string
  exempt: boolean
  rateBp: number
  taxMinorUnits: MinorUnits
  totalMinorUnits: MinorUnits
  note: string
}

/** Round-half-up, same convention as `roundKurus`. */
export function roundMinorUnits(value: number): MinorUnits {
  return Math.round(value)
}

export function computeTaxLine(input: ComputeTaxLineInput): ComputedTaxLine {
  const { kit, isMedicalService = true } = input
  const subtotal = assertMinorUnits(input.subtotalMinorUnits, 'subtotalMinorUnits')
  const exempt = isMedicalService && kit.taxLine.exemptByDefaultForMedicalServices
  const rateBp = exempt ? 0 : kit.taxLine.defaultRateBp
  const taxMinorUnits = exempt ? 0 : roundMinorUnits((subtotal * rateBp) / 10000)
  return {
    label: kit.taxLine.label,
    exempt,
    rateBp,
    taxMinorUnits,
    totalMinorUnits: subtotal + taxMinorUnits,
    note: kit.taxLine.note,
  }
}

export interface WithholdingSummary {
  applicable: boolean
  rateBp: number | null
  note: string
}

/**
 * Mirrors `lib/accounting/stopaj.ts`'s own finding for TR: in every one of the 6 countries
 * researched, a direct patient-to-doctor fee never carries a payer-withholding deduction. This
 * function therefore always returns `applicable: false` for the module's actual use case
 * (patient billing) — it exists so a Raporlar-style screen can show the SAME "why not" note TR's
 * own stopaj screen shows, not to compute a deduction that would never apply here.
 */
export function summarizeWithholdingForPatientInvoice(kit: CountryBillingKit): WithholdingSummary {
  return {
    applicable: false,
    rateBp: kit.withholding.confirmed ? kit.withholding.configuredRateBp : null,
    note: kit.withholding.note,
  }
}
