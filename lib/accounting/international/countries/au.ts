/**
 * Australia — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-AU.md
 */
import type { CountryBillingKit } from '../types'

export const AU_BILLING_KIT: CountryBillingKit = {
  countryCode: 'AU',
  countryName: 'Australia',
  languageTag: 'en-AU',
  currencyCode: 'AUD',
  docFlow: 'simple_invoice',
  docFlowNote:
    'Peppol e-invoicing exists and the Commonwealth has progressively required its own ' +
    'agencies to receive e-invoices from suppliers (B2G), but there is no mandate for private ' +
    'B2B/B2C invoicing, and — importantly — no single free government portal: Peppol access is ' +
    'via accredited, decentralized Access Points, some bundled free into accounting software, ' +
    'others paid. That is NOT the same shape as GİB Portalı (one free, official, direct ' +
    'government channel), so forcing a "prepare → submit on a free portal" flow onto AU would ' +
    'misrepresent what actually exists. A compliant invoice/receipt is the correct implementation.',
  resolveDocFlow: () => 'simple_invoice',
  requiredSellerFields: [
    { key: 'abn', label: 'ABN (Australian Business Number)', required: true },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address', required: true },
    { key: 'medicare_provider_number', label: 'Medicare provider number', required: false },
  ],
  taxLine: {
    label: 'GST',
    exemptByDefaultForMedicalServices: true,
    defaultRateBp: 1000,
    confidence: 'moderate',
    note:
      'A medical service is "GST-free" under Subdivision 38-B (incl. s38-7) of the A New Tax ' +
      'System (GST) Act 1999 when a recognised medical practitioner provides it to the patient ' +
      '(the patient is normally the recipient) and the medical profession generally accepts it ' +
      'as necessary for the appropriate treatment of the recipient — the default, no-GST-line ' +
      'case for an ordinary consultation. Purely cosmetic procedures with no Medicare benefit ' +
      'fall outside the exemption and are taxable at the standard 10% rate. Confirmed via ' +
      "secondary professional commentary cross-referencing the Act; the ATO's own GST health " +
      'industry partnership ruling (gstir-health-industry) was found but not independently ' +
      're-fetched in full this session — MODERATE confidence.',
    citations: [
      { label: 'Bristax — GST and Health Services', url: 'https://bristax.com.au/gst-articles/gst-and-health-services/' },
      { label: 'ATO — GST Industry Issues: health industry partnership (ruling PDF)', url: 'https://www.ato.gov.au/law/view/pdf/adhoc-sgml/gstir-health-industry-ch01.pdf' },
      { label: 'Xero — Healthcare accounting in Australia (GST overview)', url: 'https://www.xero.com/au/guides/healthcare-accounting-australia/' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: 4700,
    confirmed: false,
    note:
      'The "no-ABN withholding" rule requires a BUSINESS payer to withhold 47% from a supplier ' +
      "that has not quoted an ABN; it exists to backstop GST/ABN compliance, not as a stopaj on " +
      'medical fees, and a private individual patient paying a doctor directly does not withhold ' +
      'under this rule in the ordinary case. The source reviewed (a law-firm explainer) did not ' +
      'specifically address a doctor/patient scenario, so whether any edge case (e.g. a self-' +
      "insured corporate patient) could trigger it is NOT CONFIRMED — rateBp is recorded as a " +
      'reference value only (confirmed:false blocks it from being read as settled); flagged for ' +
      'Kaan/an Australian tax agent to confirm before this is used for anything beyond the ' +
      '"informational, does not apply to ordinary patient billing" default shown on the invoice.',
    citations: [
      { label: 'Sprintlaw — No-ABN withholding in Australia: what to do and avoid penalties', url: 'https://www.sprintlaw.com.au/articles/no-abn-withholding-in-australia-what-to-do-and-avoid-penalties' },
    ],
  },
  citations: [
    { label: 'Invoice Data Extraction — Australia Peppol e-invoicing requirements & deadlines', url: 'https://invoicedataextraction.com/blog/australia-peppol-e-invoicing-requirements' },
  ],
  lastVerified: '2026-10-16',
}
