/**
 * United Kingdom — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-GB.md
 */
import type { CountryBillingKit } from '../types'

export const GB_BILLING_KIT: CountryBillingKit = {
  countryCode: 'GB',
  countryName: 'United Kingdom',
  languageTag: 'en-GB',
  currencyCode: 'GBP',
  docFlow: 'simple_invoice',
  docFlowNote:
    'No UK e-invoicing mandate is in force today. HMRC ran a 2025 consultation and the Autumn ' +
    'Budget 2025 confirmed e-invoicing WILL become mandatory for VAT invoices, but not until ' +
    'April 2029, with the implementation roadmap (including whatever official channel is ' +
    'offered) only due at Budget 2026 — nothing to build against yet. A compliant invoice/' +
    "receipt is the complete, correct implementation for now; this is a FLAGGED FUTURE CHANGE " +
    '(docs/OPEN-COMMITMENTS.md) to revisit once the 2026 roadmap is published, not a closed item.',
  resolveDocFlow: () => 'simple_invoice',
  requiredSellerFields: [
    { key: 'vat_number', label: 'VAT registration number (if VAT-registered)', required: false },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address', required: true },
    { key: 'utr', label: 'UTR (Unique Taxpayer Reference)', required: false },
  ],
  taxLine: {
    label: 'VAT',
    exemptByDefaultForMedicalServices: true,
    defaultRateBp: 2000,
    confidence: 'moderate',
    note:
      'Medical care supplied by a person on the relevant statutory register (a GMC-registered ' +
      'doctor, for example) is VAT-exempt under Group 7, Schedule 9, VATA 1994, when the service ' +
      "has a genuine health purpose (protection, maintenance or restoration of the patient's " +
      'health) — the default, no-VAT-line case for an ordinary consultation. Services that are ' +
      'primarily cosmetic with no therapeutic purpose fall outside the exemption and are ' +
      'standard-rated at 20%. This was confirmed via secondary professional-services commentary ' +
      "(not HMRC's own VAT Notice 701/57 text directly this session) — MODERATE confidence; " +
      'recommend a direct check of VAT Notice 701/57 "Health professionals and pharmaceutical ' +
      'products" before production.',
    citations: [
      { label: 'Xeinadin — VAT for Primary Care (GP practices)', url: 'https://www.xeinadin.com/blog/vat-for-primary-care-expanded-guidance-for-gp-practices/' },
      { label: 'UHY — HMRC clarification on VAT treatment of locum doctors', url: 'https://www.uhy-uk.com/insights/hmrc-provides-further-clarification-vat-treatment-locum-doctors' },
      { label: 'accountaxzone — VAT on healthcare: exempt and taxable services', url: 'https://accountaxzone.com/vat-on-healthcare-exempt-and-taxable-services/' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: null,
    confirmed: true,
    note:
      'No stopaj-equivalent withholding applies to a domestic patient paying a doctor directly. ' +
      'CIS (Construction Industry Scheme) withholding exists in UK tax law but is construction-' +
      'specific and irrelevant here. A self-employed doctor pays Income Tax and Class 2/4 ' +
      'National Insurance through Self Assessment, not through any deduction at invoice time.',
    citations: [],
  },
  citations: [
    { label: 'ICAS — Autumn Budget 2025: e-invoicing will go ahead from 2029', url: 'https://www.icas.com/news-insights-events/news/tax/autumn-budget-2025-e-invoicing-will-go-ahead-from-2029' },
    { label: 'TrueCommerce — E-Invoicing in the UK: what the 2029 mandate means', url: 'https://www.truecommerce.com/blog/e-invoicing-in-the-uk-what-the-2029-mandate-means-for-businesses/' },
  ],
  lastVerified: '2026-10-16',
}
