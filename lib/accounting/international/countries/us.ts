/**
 * United States — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-US.md
 */
import type { CountryBillingKit } from '../types'

export const US_BILLING_KIT: CountryBillingKit = {
  countryCode: 'US',
  countryName: 'United States',
  languageTag: 'en-US',
  currencyCode: 'USD',
  docFlow: 'simple_invoice',
  docFlowNote:
    'No US federal or state mandate requires electronic invoicing for a private medical ' +
    "practice billing patients as of 2026. Voluntary B2B frameworks exist (the Business " +
    'Payments Coalition / DBNAlliance e-invoice exchange) but nothing compels their use, and ' +
    'there is no free official "portal" a solo doctor or clinic submits invoices through — ' +
    'a correctly-localized compliant invoice/receipt is the complete, correct implementation, ' +
    'not a stand-in for a flow that does not exist here.',
  resolveDocFlow: () => 'simple_invoice',
  requiredSellerFields: [
    { key: 'ein_or_ssn', label: 'EIN (or SSN for a sole proprietor)', required: true },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address', required: true },
    { key: 'npi', label: 'NPI (National Provider Identifier)', required: false },
  ],
  taxLine: {
    label: 'Sales tax',
    exemptByDefaultForMedicalServices: true,
    defaultRateBp: 0,
    confidence: 'moderate',
    note:
      'Sales tax is state-level (no federal sales/VAT tax), and the large majority of states do ' +
      'not tax professional medical services at all — several confirmed exemption patterns were ' +
      'checked (e.g. Nebraska DOR guidance), with the general principle that sales tax targets ' +
      'tangible goods and a specific, state-enumerated list of services. Default is NO tax line ' +
      "on a standard consultation invoice. This is genuinely state-by-state: a doctor's own " +
      'state should be confirmed before go-live (South Carolina and West Virginia, for example, ' +
      'tax a wider band of services than most states) — flagged, not hardcoded as a 50-state table.',
    citations: [
      { label: 'Lutz — Sales & use tax for medical/dental practice FAQs', url: 'https://www.lutz.us/blog/sales-use-tax-for-medical-dental-practices-faqs' },
      { label: 'South Carolina DOR Reg. 117-308.1 — Professional Services', url: 'https://www.law.cornell.edu/regulations/south-carolina/R-117-308.1' },
      { label: 'reversesalestaxcalc.org — which states tax services (2026)', url: 'https://reversesalestaxcalc.org/en/blog/sales-tax-on-services-which-states-tax-2026' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: 1530,
    confirmed: true,
    note:
      'There is no payer-withholds-at-source mechanism on a domestic patient-to-doctor fee (no ' +
      'stopaj analogue). A self-employed doctor instead owes self-employment tax directly — ' +
      '15.3% (12.4% Social Security, capped at a $184,500 wage base for 2026, + 2.9% Medicare, ' +
      "uncapped) — paid via the doctor's own quarterly estimated payments, never deducted from " +
      'an invoice. Stored here purely informationally for a future Raporlar-style summary, same ' +
      "role TR's own stopaj note plays when stopaj does not apply to a given invoice.",
    citations: [
      { label: 'US Tax Tools — self-employment tax rate 2026', url: 'https://ustax.tools/tax-insights/self-employment-tax-rate-2026/' },
      { label: '1800Accountant — Social Security wage base for 2026', url: 'https://1800accountant.com/blog/social-security-wage-base' },
    ],
  },
  citations: [
    { label: 'Fonoa — What is B2B e-invoicing? (global mandate tracker)', url: 'https://www.fonoa.com/resources/blog/b2b-e-invoicing' },
    { label: 'Houseblend — US/Canada e-invoicing mandates 2026 (US section)', url: 'https://www.houseblend.io/articles/en/mandats-facturation-electronique-usa-canada-reglementations-2026' },
  ],
  lastVerified: '2026-10-16',
}
