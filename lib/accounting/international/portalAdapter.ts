/**
 * NOTYA-ACCOUNTING-INTL-01 — the 'portal_prepare_pastback' flow. Used today only by UZ (once
 * VAT-registered, see countries/uz.ts). Shape mirrors the pattern the brief specified for a
 * free-official-channel country, same spirit as TR's own GİB Portalı flow
 * (NOTYA-ACCOUNTING-GIB-PORTAL-01, lib/accounting/ebelge/gibPortal.ts) being built in parallel —
 * but this file is intentionally self-contained (no shared import) because that TR file was
 * mid-rewrite while this was built. See README.md for the reconciliation step this still needs.
 *
 * Notya never submits anything on the doctor's behalf here and never becomes the party of record
 * on the government portal — it only prepares the exact data and later records the reference the
 * doctor pastes back, same ownership rule as every other flow in this module (and in TR).
 */
import type { CountryBillingKit, MinorUnits } from './types'
import { computeTaxLine } from './compliance'
import type { SellerFieldValues, SimpleInvoiceLine } from './simpleInvoiceAdapter'

export interface PreparedPortalDocument {
  countryCode: CountryBillingKit['countryCode']
  portalName: string
  portalUrl: string
  /** Exactly the fields/values the doctor needs to type (or copy-paste) into the portal's own
   *  form — labelled, not a raw object, so a UI can render them as a checklist. */
  fieldsForManualEntry: { label: string; value: string }[]
  subtotalMinorUnits: MinorUnits
  taxLabel: string
  taxMinorUnits: MinorUnits
  totalMinorUnits: MinorUnits
  instructions: string
  missingSellerFields: string[]
  readyToPrepare: boolean
}

export interface LinkedPortalDocument {
  invoiceId: string
  /** The reference/document number the doctor pasted back after submitting on the portal
   *  themselves — e.g. an e-Faktura number for UZ. Never fetched or verified by Notya; this is
   *  an honest record of what the doctor typed in, same trust model as TR's own paste-back step. */
  externalReference: string
  linkedAt: string
}

function findMissingFields(kit: CountryBillingKit, values: SellerFieldValues): string[] {
  return kit.requiredSellerFields.filter((f) => f.required && !String(values[f.key] || '').trim()).map((f) => f.label)
}

export function preparePortalDocument(
  kit: CountryBillingKit,
  lines: SimpleInvoiceLine[],
  sellerFieldValues: SellerFieldValues
): PreparedPortalDocument {
  if (!kit.portal) {
    throw new Error(`Country "${kit.countryCode}" has no configured portal — this kit's docFlow must resolve to 'simple_invoice'`)
  }
  const missingSellerFields = findMissingFields(kit, sellerFieldValues)
  let subtotal = 0
  let tax = 0
  let total = 0
  for (const line of lines) {
    const lineSubtotal = line.unitPriceMinorUnits * line.quantity
    const computed = computeTaxLine({ kit, subtotalMinorUnits: lineSubtotal, isMedicalService: line.isMedicalService })
    subtotal += lineSubtotal
    tax += computed.taxMinorUnits
    total += computed.totalMinorUnits
  }
  const fieldsForManualEntry = kit.requiredSellerFields.map((f) => ({
    label: f.label,
    value: String(sellerFieldValues[f.key] || ''),
  }))
  return {
    countryCode: kit.countryCode,
    portalName: kit.portal.name,
    portalUrl: kit.portal.url,
    fieldsForManualEntry,
    subtotalMinorUnits: subtotal,
    taxLabel: kit.taxLine.label,
    taxMinorUnits: tax,
    totalMinorUnits: total,
    instructions:
      `Enter this invoice on ${kit.portal.name} yourself — you remain the legal issuer. ` +
      'Once submitted, paste the reference/document number it gives you back into Notya to link this record.',
    missingSellerFields,
    readyToPrepare: missingSellerFields.length === 0 && lines.length > 0,
  }
}

export function linkPortalReference(invoiceId: string, externalReference: string): LinkedPortalDocument {
  const trimmed = externalReference.trim()
  if (!invoiceId.trim()) throw new TypeError('invoiceId is required')
  if (!trimmed) throw new TypeError('externalReference is required — paste the number the portal gave you')
  return { invoiceId, externalReference: trimmed, linkedAt: new Date().toISOString() }
}
