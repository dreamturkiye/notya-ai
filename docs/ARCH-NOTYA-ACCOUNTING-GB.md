# Notya Accounting — United Kingdom country kit

Researched 2026-10-16. Code: `lib/accounting/international/countries/gb.ts`.

## 1. E-invoicing mandate?

**Not yet — but coming.** No UK e-invoicing mandate is in force today, for a sole practitioner or
a company. HMRC ran a public consultation in 2025, and the **Autumn Budget 2025 confirmed
e-invoicing will become mandatory for VAT invoices from April 2029**, with the implementation
roadmap (including whatever official channel is offered) due only at **Budget 2026** — i.e. not
yet published. **VERIFIED** (fetched directly, not a secondary paraphrase).

- [ICAS — Autumn Budget 2025: e-invoicing will go ahead from 2029](https://www.icas.com/news-insights-events/news/tax/autumn-budget-2025-e-invoicing-will-go-ahead-from-2029)
- [TrueCommerce — E-Invoicing in the UK: what the 2029 mandate means for businesses](https://www.truecommerce.com/blog/e-invoicing-in-the-uk-what-the-2029-mandate-means-for-businesses/)

## 2. Free official channel?

None exists yet, and none is confirmed even for 2029 — the roadmap (including the channel
mechanics) is what Budget 2026 is supposed to define. **This is a named future revisit, not a
closed item** — see §7.

## 3. Correct implementation

A compliant invoice/receipt generator (`simple_invoice`) for now.

## 4. Tax line

Medical care supplied by a person on the relevant statutory register (e.g. a GMC-registered
doctor) is **VAT-exempt** under Group 7, Schedule 9, VATA 1994, when the service has a genuine
health purpose. That's the default, no-VAT-line case for an ordinary consultation. Purely
cosmetic procedures with no therapeutic purpose are **standard-rated at 20%**. **MODERATE
confidence** — confirmed via professional-services secondary commentary (accountancy firms,
specialist VAT advisers), not HMRC's own VAT Notice 701/57 text directly this session.

- [Xeinadin — VAT for Primary Care: expanded guidance for GP practices](https://www.xeinadin.com/blog/vat-for-primary-care-expanded-guidance-for-gp-practices/)
- [UHY — HMRC provides further clarification on VAT treatment of locum doctors](https://www.uhy-uk.com/insights/hmrc-provides-further-clarification-vat-treatment-locum-doctors)
- [accountaxzone — VAT on Healthcare: exempt and taxable services](https://accountaxzone.com/vat-on-healthcare-exempt-and-taxable-services/)

## 5. Stopaj equivalent

**None, for patient billing.** CIS (Construction Industry Scheme) withholding exists in UK tax
law but is construction-specific. A self-employed doctor pays Income Tax and Class 2/4 National
Insurance through Self Assessment — no deduction at invoice time. **VERIFIED** by elimination
(no UK withholding regime found that covers a direct medical-service fee between an individual
patient and a self-employed/incorporated doctor).

## 6. Built this pass

`lib/accounting/international/countries/gb.ts` + shared compliance/adapter modules. Tested.

## 7. Flagged for human confirmation

- **The 2029 mandate itself** — revisit this kit once Budget 2026 publishes the implementation
  roadmap; the channel it names (free government portal vs. accredited intermediaries) decides
  whether GB eventually needs the `portal_prepare_pastback` flow instead of `simple_invoice`.
- The VAT-exemption scope (what exactly counts as "medical care" vs. a borderline
  cosmetic/aesthetic service) should be checked against HMRC's VAT Notice 701/57 directly, not
  only secondary commentary, before being treated as settled for edge-case services.
