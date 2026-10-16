/**
 * Canada — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-CA.md
 */
import type { CountryBillingKit } from '../types'

export const CA_BILLING_KIT: CountryBillingKit = {
  countryCode: 'CA',
  countryName: 'Canada',
  languageTag: 'en-CA',
  currencyCode: 'CAD',
  docFlow: 'simple_invoice',
  docFlowNote:
    'The CRA does not mandate e-invoicing for GST/HST purposes — electronic GST/HST *return* ' +
    'filing is common/required above certain thresholds, but that is filing a tax return, not ' +
    'issuing invoices through a government channel. No free official e-invoicing portal for a ' +
    'private medical practice exists or is proposed. A compliant invoice/receipt is the ' +
    'complete, correct implementation.',
  resolveDocFlow: () => 'simple_invoice',
  requiredSellerFields: [
    { key: 'bn_gst_hst', label: 'Business Number / GST-HST account (if registered)', required: false },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address (province determines HST rate)', required: true },
  ],
  taxLine: {
    label: 'GST/HST',
    exemptByDefaultForMedicalServices: true,
    defaultRateBp: 500,
    confidence: 'moderate',
    note:
      'A consultative, diagnostic, treatment or other health care service rendered to an ' +
      'individual by a medical practitioner is exempt under Part II of Schedule V to the Excise ' +
      'Tax Act — the default, no-GST/HST-line case for an ordinary consultation, and why many ' +
      'medical practitioners are not required to register for GST/HST at all on that core work. ' +
      '"Uninsured"/non-health-purpose services (e.g. purely cosmetic procedures, third-party ' +
      'medical-legal reports) can fall outside the exemption and become taxable at the rate of ' +
      'the province where supplied (5% GST-only provinces vs. HST provinces, e.g. 13% Ontario, ' +
      '15% most Atlantic provinces) — defaultRateBp here stores the federal 5% floor only; a ' +
      'production build needs the full province rate table before enabling non-exempt line ' +
      'items. The Excise Tax Act exemption itself was confirmed via its own text/regulations; ' +
      "the CRA's own current GI/P-248 guidance page was not independently re-fetched this " +
      'session (page unreachable) — MODERATE confidence, recommend a direct CRA check before go-live.',
    citations: [
      { label: 'Canada.ca — Proposed Exemption of Multidisciplinary Health Care Services (notice, cites the existing medical-practitioner exemption)', url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/notice311/proposed-exemption-multidisciplinary-health-care-services.html' },
      { label: 'Canada.ca — Qualifying health care supplies (GST/HST, P-256)', url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/p-256/qualifying-health-care-supplies-application-gst-hst-supplies-medical-examinations-assessments-reports-certificates.html' },
      { label: 'Doctors Manitoba — Uninsured services and the GST', url: 'https://doctorsmanitoba.ca/managing-your-practice/remuneration/uninsured-services/overview-of-uninsured-services-and-billing/uninsured-services-and-the-gst' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: null,
    confirmed: true,
    note:
      'Part XIII withholding (25%, often treaty-reduced) applies only to payments to NON-' +
      'residents — irrelevant to a resident patient paying a resident doctor. No domestic ' +
      'stopaj-equivalent withholding exists on fees paid to a Canadian-resident physician.',
    citations: [],
  },
  citations: [
    { label: 'BDO Canada — Are you required to register for GST/HST and QST as a medical practitioner?', url: 'https://www.bdo.ca/insights/if-you-are-a-medical-practitioner-are-you-required-to-be-registered-for-gst-hst-and-qst' },
    { label: 'InvoiceQuickly — Invoice requirements in Canada: legal rules for 2026', url: 'https://invoicequickly.com/blog/invoice-requirements-canada' },
  ],
  lastVerified: '2026-10-16',
}
