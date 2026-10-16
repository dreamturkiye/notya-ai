/**
 * Uzbekistan — researched 2026-10-16. Full citations/reasoning: docs/ARCH-NOTYA-ACCOUNTING-UZ.md
 *
 * The one country of the six confirmed to have a mandatory, government-run e-invoicing system —
 * matching the task brief's steer that post-Soviet tax administrations (UZ, AZ) were more likely
 * to need this than the other candidates. UZ's mandate is REGISTRATION-TIER-GATED, unlike TR's
 * (which binds every serbest meslek hekim): a solo doctor under the turnover-tax threshold is
 * not yet a VAT payer and is not yet pulled into the e-Faktura mandate — see `resolveDocFlow`.
 */
import type { CountryBillingKit, DocFlowKind } from '../types'

export const UZ_VAT_REGISTRATION_THRESHOLD_BCU = 12000

function resolveDocFlow(isVatRegistered: boolean): DocFlowKind {
  return isVatRegistered ? 'portal_prepare_pastback' : 'simple_invoice'
}

export const UZ_BILLING_KIT: CountryBillingKit = {
  countryCode: 'UZ',
  countryName: "O'zbekiston (Uzbekistan)",
  languageTag: 'uz-UZ',
  currencyCode: 'UZS',
  docFlow: 'portal_prepare_pastback',
  docFlowNote:
    'Electronic invoicing (e-Faktura) has been mandatory for VAT-registered taxpayers since ' +
    '1 January 2020 (B2B and B2G), issued/received through the State Tax Committee\'s own ' +
    'platform — my.soliq.uz (also referred to as SoliqOnline). This is the one of the 6 ' +
    'countries where a free-official-channel flow mirroring GİB Portalı genuinely applies: ' +
    'Notya prepares the invoice data, the doctor/clinic enters and submits it on my.soliq.uz ' +
    'themselves (they remain the legal issuer, same rule as every other country/TR), and pastes ' +
    'back the resulting e-Faktura reference number to link the local record. BUT this binds ' +
    'only once VAT-registered (turnover above 12,000 BCU, or opted in) — see `resolveDocFlow`. ' +
    "A solo doctor under that threshold, taxed under the simplified turnover-tax regime, is not " +
    'yet a VAT payer and is not yet pulled into the e-Faktura mandate; for that doctor the ' +
    "correct implementation is the simple-invoice fallback. B2C retail transactions separately " +
    'require an online fiscal cash register connected in real time to the State Tax Committee ' +
    '(mandatory since 2021) — relevant if a practice takes walk-in cash/card payments, tracked ' +
    'as a distinct, not-yet-built requirement in docs/OPEN-COMMITMENTS.md, not folded into this ' +
    'kit silently.',
  resolveDocFlow,
  portal: { name: 'my.soliq.uz (SoliqOnline / e-Faktura, State Tax Committee)', url: 'https://my.soliq.uz' },
  requiredSellerFields: [
    { key: 'stir', label: 'STIR (soliq toʼlovchining identifikatsion raqami / tax ID)', required: true },
    { key: 'vat_reg_number', label: 'VAT registration number (if VAT-registered)', required: false },
    { key: 'practice_name', label: 'Practice / legal name', required: true },
    { key: 'practice_address', label: 'Practice address', required: true },
  ],
  taxLine: {
    label: 'VAT (QQS)',
    exemptByDefaultForMedicalServices: false,
    defaultRateBp: 1200,
    confidence: 'unconfirmed',
    note:
      'Standard VAT rate is 12% once VAT-registered — this part is well-sourced. Whether ' +
      "Uzbekistan's Tax Code carries a specific exemption for medical/healthcare services " +
      '(the way TR, UK, CA and AU each do) was NOT found and NOT confirmed in the sources ' +
      'reached this session — flagged rather than assumed either way, so defaultRateBp is the ' +
      'full standard rate with no exemption applied by default, the conservative choice until ' +
      "confirmed. Also unresolved: an optional 6% simplified VAT regime (1 June 2026–1 Jan 2030) " +
      'exists for businesses primarily in food service, retail/wholesale trade, or "service ' +
      'provision" — a solo medical practice MIGHT qualify as a service provider, but the source ' +
      'reviewed did not mention medical/healthcare services specifically, so this is NOT applied ' +
      'by default either. Both points need a local tax adviser or a direct Tax Code read before ' +
      'treating either rate as final for a real doctor.',
    citations: [
      { label: 'trykintsugi — Uzbekistan VAT guide for 2026 (standard rate 12%)', url: 'https://trykintsugi.com/sales-tax-guides/europe/uzbekistan' },
      { label: 'Rödl & Partner — Uzbekistan SME tax reforms 2026 (6% optional VAT regime, turnover-tax threshold)', url: 'https://www.roedl.com/en/insights/uzbekistan-sme-tax-reforms-2026' },
    ],
  },
  withholding: {
    applicableToPatientBilling: false,
    configuredRateBp: null,
    confirmed: false,
    note:
      "No domestic withholding mechanism on fees paid to a resident individual entrepreneur " +
      '(the typical legal form for a solo private doctor — "yakka tartibdagi tadbirkor") was ' +
      'found in the sources reached this session. The only confirmed withholding rates are for ' +
      'CROSS-BORDER payments to non-residents (20% royalties, 10% dividends/interest, 12% rent) ' +
      '— none apply to a domestic patient paying a resident doctor. This is the TR-stopaj-' +
      'equivalent question the brief asked to verify explicitly: per instruction, since it could ' +
      'not be confirmed with confidence, configuredRateBp is left null (not guessed) and ' +
      'flagged in docs/OPEN-COMMITMENTS.md for Kaan or a local (Uzbek) tax adviser to confirm — ' +
      'a real Tax Code citation, not a secondary source, before any number is entered here.',
    citations: [
      { label: 'PwC Tax Summaries — Republic of Uzbekistan, Individual income determination', url: 'https://taxsummaries.pwc.com/republic-of-uzbekistan/individual/income-determination' },
    ],
  },
  citations: [
    { label: 'EDICOM — Electronic invoicing in Uzbekistan (mandatory since 2020, my.soliq.uz)', url: 'https://edicomgroup.com/electronic-invoicing/uzbekistan' },
    { label: 'e-invoice.app — Uzbekistan country page (e-Faktura B2B/B2G 2020, online cash registers B2C 2021)', url: 'https://www.e-invoice.app/country/UZ' },
    { label: 'daryo.uz — Uzbekistan\'s revised VAT policy may burden small sole proprietors', url: 'https://daryo.uz/en/2026/02/08/uzbekistans-revised-vat-policy-may-burden-small-sole-proprietors-economist-warns/' },
  ],
  lastVerified: '2026-10-16',
}
