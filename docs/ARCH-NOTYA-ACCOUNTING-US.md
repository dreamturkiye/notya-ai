# Notya Accounting — United States country kit

Researched 2026-10-16, per `docs/ARCH-NOTYA-ACCOUNTING.md` §7's "document each country's kit"
instruction. Code: `lib/accounting/international/countries/us.ts`.

## 1. E-invoicing mandate?

**No.** No US federal or state law requires electronic invoicing for a private medical practice
billing patients, for either a sole proprietor or a company/clinic structure. Voluntary B2B
e-invoice exchange frameworks exist (the Business Payments Coalition / DBNAlliance), but nothing
compels a doctor or patient to use them, and there is no equivalent in development (unlike the
UK's announced 2029 mandate). — Fonoa's B2B e-invoicing overview and a 2026 US/Canada mandate
survey (Houseblend) were the clearest signals found; neither source's full text was fetched this
session (only search-result titles/links), so this is **BEST-EFFORT, not VERIFIED** — a direct
IRS/Treasury or state-DOR confirmation was not reached.

- [Fonoa — What is B2B e-invoicing? Definition, global mandates & more](https://www.fonoa.com/resources/blog/b2b-e-invoicing)
- [Houseblend — Mandats de facturation électronique USA/Canada, réglementations 2026](https://www.houseblend.io/articles/en/mandats-facturation-electronique-usa-canada-reglementations-2026)

## 2. Free official channel?

Does not apply — no mandate exists to have a channel for.

## 3. Correct implementation

A compliant invoice/receipt generator (this module's `simple_invoice` flow) — the complete,
correct answer for the US, consistent with option (b) in the task brief.

## 4. Tax line

Sales tax is state-level; there is no federal sales tax or VAT. Medical/professional services are
exempt from sales tax in the large majority of states — confirmed directly for Nebraska (Lutz
CPA guidance: medical/dental services not taxable; OTC goods sold alongside are) and via the
general principle that sales tax targets tangible goods plus a state-enumerated list of services.
Default: **no tax line** on an ordinary consultation invoice. **MODERATE confidence** — this is
genuinely state-by-state (South Carolina and West Virginia, for example, tax a noticeably wider
band of services than most states), so a real deployment needs the doctor's own state confirmed,
not a 50-state table assumed from two examples.

- [Lutz — Sales & use tax for medical/dental practice FAQs](https://www.lutz.us/blog/sales-use-tax-for-medical-dental-practices-faqs)
- [South Carolina DOR Reg. 117-308.1 — Professional Services](https://www.law.cornell.edu/regulations/south-carolina/R-117-308.1)
- [reversesalestaxcalc.org — which US states tax services (2026)](https://reversesalestaxcalc.org/en/blog/sales-tax-on-services-which-states-tax-2026)

## 5. Stopaj equivalent

**None, for patient billing.** There is no payer-withholds-at-source mechanism on a direct
patient-to-doctor fee. A self-employed doctor instead owes **self-employment tax directly**:
15.3% total — 12.4% Social Security (capped at a **$184,500 wage base for 2026**) + 2.9% Medicare
(uncapped) — paid via the doctor's own quarterly estimated payments, never deducted from an
invoice. Rate and 2026 wage base **VERIFIED** against two independent, consistent current sources.

- [US Tax Tools — self-employment tax rate 2026](https://ustax.tools/tax-insights/self-employment-tax-rate-2026/)
- [1800Accountant — Social Security wage base for 2026](https://1800accountant.com/blog/social-security-wage-base)

## 6. Built this pass

`lib/accounting/international/countries/us.ts` + shared `compliance.ts`/`simpleInvoiceAdapter.ts`
(see `lib/accounting/international/README.md`). Tested in
`lib/accounting/international/compliance.test.ts` / `adapters.test.ts`.

## 7. Flagged for human confirmation

- State sales-tax exemption for medical services, confirmed for the doctor's **actual** state
  before go-live (BEST-EFFORT today, one example state + general principle, not a 50-state table).
- The "no US e-invoicing mandate" finding itself is BEST-EFFORT (title/link-level search
  confirmation, not a fetched primary source) — low risk given how consistently every e-invoicing
  mandate tracker agrees, but named rather than silently upgraded to VERIFIED.
