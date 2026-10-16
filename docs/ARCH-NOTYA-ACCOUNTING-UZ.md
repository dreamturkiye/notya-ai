# Notya Accounting — Uzbekistan country kit

Researched 2026-10-16. Code: `lib/accounting/international/countries/uz.ts`.

**The task brief specifically flagged UZ (and AZ) as more likely than the others to have a
mandatory government e-invoice system, as a post-Soviet tax administration. Confirmed true —
this is the one of the six countries that genuinely needs the GİB-Portalı-style flow.**

## 1. E-invoicing mandate?

**Yes — for VAT-registered taxpayers.** Electronic invoicing (**e-Faktura**) has been mandatory
since **1 January 2020** for VAT-registered taxpayers, covering both B2B and B2G transactions.
Separately, **B2C retail transactions require an online fiscal cash register**, connected in
real time to the State Tax Committee, mandatory since 1 January 2021 — a distinct requirement
from e-Faktura, relevant if a practice takes walk-in cash/card payments, and **not built this
pass** (tracked below, not folded silently into the e-Faktura flow).

- [EDICOM — Electronic invoicing in Uzbekistan](https://edicomgroup.com/electronic-invoicing/uzbekistan)
- [e-invoice.app — Uzbekistan country page](https://www.e-invoice.app/country/UZ)

**Registration-tier nuance (not present in TR's mandate, which binds every serbest meslek
hekim):** a solo doctor under Uzbekistan's turnover-tax threshold is not yet a VAT payer and is
not yet pulled into the e-Faktura mandate. The threshold is **12,000 Basic Calculation Units
(BCU)** of turnover (rising from 1 September 2026 as the BCU value itself rises) — below that, a
sole individual entrepreneur ("yakka tartibdagi tadbirkor", the typical legal form for a solo
private doctor) is taxed under the simplified turnover-tax regime instead, and the e-Faktura
mandate does not yet bind them. This is modeled as `UZ_BILLING_KIT.resolveDocFlow(isVatRegistered)`
rather than one fixed flow for the whole country.

- [Rödl & Partner — Uzbekistan SME tax reforms 2026](https://www.roedl.com/en/insights/uzbekistan-sme-tax-reforms-2026)
- [daryo.uz — Uzbekistan's revised VAT policy may burden small sole proprietors](https://daryo.uz/en/2026/02/08/uzbekistans-revised-vat-policy-may-burden-small-sole-proprietors-economist-warns/)

## 2. Free official channel?

**my.soliq.uz** (also referred to as "SoliqOnline"), the State Tax Committee's own e-Faktura
platform, confirmed as the mandatory channel VAT-registered taxpayers issue/receive e-Faktura
through. **Whether it is explicitly fee-free was NOT independently confirmed in the text fetched
this session** — both sources checked describe it as the mandatory government channel without
stating a cost. Treated conservatively: this is very likely free, consistent with every other
mandatory government tax-compliance portal in this product's research (GİB Portalı included),
but **flagged rather than asserted as confirmed** — see §7.

## 3. Correct implementation

**Split by registration tier**, both built this pass:
- VAT-registered (above the 12,000 BCU threshold, or opted in): `portal_prepare_pastback` —
  Notya prepares the invoice data, the doctor enters/submits it on my.soliq.uz themselves (they
  remain the legal issuer, same ownership rule as every other flow in this module and in TR),
  and pastes back the resulting e-Faktura reference to link the local record.
- Below the threshold (ordinary solo private doctor, turnover-tax regime): `simple_invoice` — a
  compliant receipt is the correct fallback, not a gap, per option (b) in the task brief.

## 4. Tax line

Standard VAT rate is **12%** once VAT-registered — well-sourced, VERIFIED. Whether Uzbekistan's
Tax Code carries a **specific exemption for medical/healthcare services** (the way TR, UK, CA
and AU each do) was **NOT found and NOT confirmed** in the sources reached this session —
flagged rather than assumed either way, so `defaultRateBp` applies the full standard rate with
no exemption by default (the conservative choice until confirmed). Also unresolved: an optional
**6% simplified VAT regime (1 June 2026 – 1 January 2030)** exists for businesses primarily in
food service, retail/wholesale trade, or "service provision" — a solo medical practice *might*
qualify as a service provider, but the source reviewed did not mention medical/healthcare
services specifically, so this is **not applied by default either**.

- [trykintsugi — Uzbekistan VAT guide for 2026](https://trykintsugi.com/sales-tax-guides/europe/uzbekistan)
- [Rödl & Partner — Uzbekistan SME tax reforms 2026](https://www.roedl.com/en/insights/uzbekistan-sme-tax-reforms-2026)

## 5. Stopaj equivalent — UNCONFIRMED, explicitly flagged per instruction

**No domestic withholding mechanism on fees paid to a resident individual entrepreneur was found**
in the sources reached this session. The only confirmed withholding rates are for **cross-border
payments to non-residents**: 20% royalties, 10% dividends/interest, 12% rent — none apply to a
domestic patient paying a resident doctor. This is exactly the question the task brief asked to
verify rather than assume: per instruction, since it could not be confirmed with confidence,
`configuredRateBp` is left **`null`** (not guessed at any number) and flagged below for a real
Tax Code citation or a local Uzbek tax adviser before any value is entered.

- [PwC Tax Summaries — Republic of Uzbekistan, Individual income determination](https://taxsummaries.pwc.com/republic-of-uzbekistan/individual/income-determination)

## 6. Built this pass

`lib/accounting/international/countries/uz.ts` (including `resolveDocFlow` and
`UZ_VAT_REGISTRATION_THRESHOLD_BCU`) + the shared `portalAdapter.ts` (prepare → doctor submits on
my.soliq.uz → paste back reference) and `simpleInvoiceAdapter.ts` (threshold fallback). Both
flows tested end-to-end in `lib/accounting/international/adapters.test.ts`, including the
missing-STIR-blocks-readiness case and the paste-back-reference recording.

## 7. Flagged for human confirmation (highest-priority open items of all 6 countries)

- **Domestic withholding on individual-entrepreneur professional fees** (§5) — needs a primary
  Tax Code citation or local counsel; currently correctly unset rather than guessed.
- **Whether a medical-service VAT exemption exists** in the Tax Code (§4) — currently defaults
  to the full standard rate, conservatively, not assumed exempt.
- **Whether my.soliq.uz is explicitly free** to use (§2) — very likely, not independently
  confirmed in text fetched this session.
- **B2C online fiscal cash register requirement** (§1) — a real, separate mandate, not built
  this pass at all (only e-Faktura was in scope for this round).
