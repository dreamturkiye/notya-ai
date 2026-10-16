/**
 * NOTYA-ACCOUNTING-INTL-01 — country billing kit contract for the 6 non-Turkey country modules
 * (US, GB, CA, AU, NZ, UZ — confirmed against `release/us|gb|ca|au|nz|uz` and
 * docs/OPEN-COMMITMENTS.md's "GORSEL-YAKALAMA-08" six-country list; Azerbaijan is NOT one of the
 * six despite being a plausible candidate — not present anywhere in the codebase's country scaffolding).
 *
 * Deliberately independent of `lib/accounting/types.ts` and `lib/accounting/ebelge/*`: those
 * files were being actively rewritten by a parallel session (NOTYA-ACCOUNTING-GIB-PORTAL-01, the
 * Paraşüt-removal work) while this module was built, so nothing here imports from them. The two
 * sides share only a *shape* (prepare → doctor submits externally → paste back a reference,
 * mirrored here by `PreparedTaxDocument`/`LinkedTaxDocument`), not any code or type. See
 * `lib/accounting/international/README.md` §"Reconciling with the TR GİB Portalı work" for the
 * exact reconciliation step this still needs.
 *
 * Money convention: integer **minor units** (cents/pence/tiyin — i.e. currency × 100), same
 * never-a-float rule as `lib/accounting/types.ts`'s `Money`, but intentionally a distinct type
 * (`MinorUnits`) rather than reusing `Money`, because `Money` is documented as TRY-kuruş and nothing
 * in this file should quietly assume that.
 */

export type MinorUnits = number

export type CountryCode = 'US' | 'GB' | 'CA' | 'AU' | 'NZ' | 'UZ'

export const COUNTRY_CODES: CountryCode[] = ['US', 'GB', 'CA', 'AU', 'NZ', 'UZ']

/**
 * 'simple_invoice' — no government e-invoicing mandate reaches this business (a solo/clinic
 *   medical practice billing a patient directly); a correctly-localized compliant invoice/receipt
 *   is the complete, correct implementation (task brief's option (b)) — not a stand-in for
 *   something more automated that doesn't exist.
 * 'portal_prepare_pastback' — a free, official, government-run e-invoicing channel exists and is
 *   mandatory for this doctor/clinic's registration tier; Notya prepares the exact data, the
 *   doctor enters/submits it on that channel themselves (doctor stays the legal issuer, same rule
 *   as TR's GİB Portalı pattern), and pastes back the resulting reference/document number to link
 *   the local record. Only UZ (once VAT-registered) uses this; see `countries/uz.ts`.
 */
export type DocFlowKind = 'simple_invoice' | 'portal_prepare_pastback'

export interface Citation {
  label: string
  url: string
}

/** Confidence convention mirrors the TR architecture doc's VERIFIED / BEST-EFFORT / MODERATE
 *  scale (docs/ARCH-NOTYA-ACCOUNTING.md §4.6.1 and others) rather than inventing a new one. */
export type ConfidenceLevel = 'verified' | 'best_effort' | 'moderate' | 'unconfirmed'

export interface TaxLineConfig {
  /** What the invoice calls this tax line, e.g. "Sales tax", "VAT", "GST/HST", "VAT (QQS)". */
  label: string
  /** True when this country's ordinary clinical/consultative medical service is exempt from this
   *  tax by default — i.e. the invoice shows no tax line at all for the common case. */
  exemptByDefaultForMedicalServices: boolean
  /** The standard/consumption-tax rate (basis points) applied when a line item is NOT exempt
   *  (ancillary goods, non-medical/cosmetic services, or — for countries where medical services
   *  are themselves taxable, e.g. NZ — the ordinary consultation itself). */
  defaultRateBp: number
  confidence: ConfidenceLevel
  note: string
  citations: Citation[]
}

/**
 * Deliberately NOT a stopaj-style deduction applied to an invoice automatically. Every country
 * researched for this pass resolves the same way TR's own `lib/accounting/reports/monthly.ts`
 * `STOPAJ_NOTU`/`lib/accounting/stopaj.ts` already documents for TR: a direct patient-to-doctor
 * fee is not subject to payer withholding anywhere in this set of 6 countries. `configuredRateBp`
 * exists only as a labelled, inert reference value for a FUTURE non-patient-billing scenario
 * (e.g. a clinic or institution paying a contracted doctor) — never read by the invoice engine
 * today, and `confirmed: false` cases must stay unset/null rather than guessed, per instruction.
 */
export interface WithholdingConfig {
  applicableToPatientBilling: boolean
  /** basis points, or null when either not applicable or not confirmed enough to set any number */
  configuredRateBp: number | null
  confirmed: boolean
  note: string
  citations: Citation[]
}

export interface RequiredSellerField {
  key: string
  label: string
  required: boolean
}

export interface CountryBillingKit {
  countryCode: CountryCode
  countryName: string
  languageTag: string // BCP-47, for the translation-key layer (see README §"Localization")
  currencyCode: string // ISO 4217
  docFlow: DocFlowKind
  docFlowNote: string
  /** Only meaningful for UZ today (see countries/uz.ts) — lets a doctor/clinic's registration
   *  tier pick between the mandatory portal flow and the simple-invoice fallback. Every other
   *  country kit ignores the argument and always returns its fixed `docFlow`. */
  resolveDocFlow: (isVatOrEquivalentRegistered: boolean) => DocFlowKind
  /** Set only when `docFlow` (or `resolveDocFlow(true)`) is 'portal_prepare_pastback'. */
  portal?: { name: string; url: string }
  requiredSellerFields: RequiredSellerField[]
  taxLine: TaxLineConfig
  withholding: WithholdingConfig
  citations: Citation[]
  /** When this kit's research was last checked against a live source, not merely written. */
  lastVerified: string // ISO date
}
