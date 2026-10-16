/**
 * New Zealand — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-NZ.md
 *
 * NB: this is the one country of the six whose tax-line default genuinely diverges from the
 * other English-speaking markets — see `taxLine.note` before changing it.
 */
import type { CountryBillingKit } from '../types'

export const NZ_BILLING_KIT: CountryBillingKit = {
  countryCode: 'NZ',
  countryName: 'New Zealand',
  languageTag: 'en-NZ',
  currencyCode: 'NZD',
  docFlow: 'simple_invoice',
  docFlowNote:
    'NZ e-invoicing (via Peppol, facilitated by MBIE through einvoicing.govt.nz) is mandatory ' +
    'only in a B2G context: central government agencies since 2022, high-volume agencies from ' +
    "2026, and large (NZ$33m+ revenue) suppliers TO government from 2027. It is explicitly " +
    'voluntary for private B2B/B2C invoicing — a doctor billing a patient directly can keep ' +
    'using paper or PDF invoices. A compliant invoice/receipt is the correct implementation.',
  resolveDocFlow: () => 'simple_invoice',
  requiredSellerFields: [
    { key: 'ird_number', label: 'IRD number', required: true },
    { key: 'gst_number', label: 'GST number (if GST-registered)', required: false },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address', required: true },
  ],
  taxLine: {
    label: 'GST',
    exemptByDefaultForMedicalServices: false,
    defaultRateBp: 1500,
    confidence: 'moderate',
    note:
      "IMPORTANT, VERIFIED DIVERGENCE FROM UK/CA/AU: New Zealand does NOT carry a general " +
      'medical-services GST exemption. IRD\'s own official exempt-supplies page (fetched ' +
      'directly this session, not a secondary source) lists exactly eight exempt categories — ' +
      'donated goods-services, financial services, financial-planning fees, residential rent, ' +
      'residential accommodation under a head lease, penalty interest, statutory fines/' +
      'penalties, and fine metals — and healthcare/medical services are NOT among them. A GST-' +
      "registered doctor in private practice therefore charges standard-rate GST (15%) on " +
      'consultation fees. (A secondary, non-official source surfaced during this research — ' +
      'nztax.tools — claimed a blanket medical exemption; that claim is CONTRADICTED by IRD\'s ' +
      "own exempt-supplies list and should be disregarded.) Government-funded health/" +
      'disability services paid through specific funding arrangements (ACC, Vote Health ' +
      'contracts) may be treated differently under those specific arrangements, but that is a ' +
      'funding-mechanism question, not a general exemption, and is out of scope for this pass ' +
      '(this module bills patients directly). GST registration threshold is NZ$60,000 turnover ' +
      '(well-established, not independently re-fetched this session — MODERATE confidence).',
    citations: [
      { label: 'IRD (official) — Exempt supplies', url: 'https://www.ird.govt.nz/gst/charging-gst/exempt-supplies' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: null,
    confirmed: true,
    note:
      "NZ's \"schedular payments\" withholding tax (WT) applies to specified contractor " +
      "activities IRD lists by category (e.g. certain agricultural, cleaning, commission-agent " +
      'contracts) at rates that vary BY ACTIVITY, not a single number — relevant only if Notya ' +
      'later supports a doctor-as-contractor-to-clinic/PHO/DHB invoicing model, never to a ' +
      'patient billed directly by an independent doctor (the actual use case here). ' +
      'configuredRateBp is deliberately left null rather than picking one activity\'s rate.',
    citations: [
      { label: 'IRD — Schedular payments guide (activity-rate table)', url: 'https://www.ird.govt.nz/roles/non-residents/schedular-payments-for-non-resident-contractors' },
    ],
  },
  citations: [
    { label: 'fiscal-requirements.com — Mandatory electronic invoicing in New Zealand', url: 'https://www.fiscal-requirements.com/news/5752-mandatory-electronic-invoicing-in-new-zealand' },
    { label: 'einvoicing.govt.nz (MBIE) — official NZ eInvoicing programme', url: 'https://www.einvoicing.govt.nz/' },
  ],
  lastVerified: '2026-10-16',
}
