# Notya Accounting — New Zealand country kit

Researched 2026-10-16. Code: `lib/accounting/international/countries/nz.ts`.

**This is the one country of the six whose finding genuinely surprised the research — read §4
before changing the kit's tax default.**

## 1. E-invoicing mandate?

**No, not for private business.** NZ e-invoicing (via Peppol, facilitated by MBIE through
einvoicing.govt.nz) is mandatory only in a B2G context: central government agencies since 2022,
high-volume agencies from 2026, and large (NZ$33m+ revenue) suppliers *to* government from 2027.
Explicitly voluntary for private B2B/B2C — confirmed directly.

- [fiscal-requirements.com — Mandatory electronic invoicing in New Zealand](https://www.fiscal-requirements.com/news/5752-mandatory-electronic-invoicing-in-new-zealand)

## 2. Free official channel?

einvoicing.govt.nz exists but serves the B2G mandate above, not private patient billing — not
the GİB-style channel this task is looking for, and not relevant to this module's use case.

## 3. Correct implementation

A compliant invoice/receipt generator (`simple_invoice`).

## 4. Tax line — VERIFIED DIVERGENCE FROM UK/CA/AU

**New Zealand does NOT carry a general medical-services GST exemption.** IRD's own official
exempt-supplies page (**fetched directly this session**, not a secondary source) lists exactly
eight exempt categories: donated goods-services, financial services, financial-planning
implementation/administration/switching fees, residential rent, residential accommodation under
a head lease, penalty interest, statutory fines/penalties, and fine metals. **Healthcare/medical
services are not among them.** A GST-registered doctor in private practice therefore charges
standard-rate GST (**15%**) on consultation fees, unlike the UK, Canada and Australia.

A secondary, non-official source surfaced during this research (nztax.tools) claimed a blanket
medical-services GST exemption; **that claim is directly contradicted by IRD's own exempt-
supplies list and was rejected rather than used**, per the task's explicit "verify, don't assume"
instruction. GST registration threshold is NZ$60,000 turnover (well-established; not
independently re-fetched this session — MODERATE confidence on the threshold figure specifically,
VERIFIED on the no-exemption finding itself).

- [IRD (official) — Exempt supplies](https://www.ird.govt.nz/gst/charging-gst/exempt-supplies)

Government-funded health/disability services paid through specific funding arrangements (ACC,
Vote Health contracts) may be treated differently under those arrangements — a funding-mechanism
question, not a general exemption, and out of scope for this pass since this module bills
patients directly.

## 5. Stopaj equivalent

**None, for direct patient billing.** NZ's **"schedular payments" withholding tax (WT)** applies
to specified contractor activities IRD lists by category (certain agricultural, cleaning,
commission-agent contracts, etc.) at rates that vary **by activity**, not one fixed number —
relevant only if Notya later supports a doctor-as-contractor-to-clinic/PHO/DHB invoicing model,
never to a patient billed directly by an independent doctor (today's actual use case).
`configuredRateBp` is deliberately left `null` rather than picking one activity's rate.

- [IRD — Schedular payments (activity-rate table)](https://www.ird.govt.nz/roles/non-residents/schedular-payments-for-non-resident-contractors)

## 6. Built this pass

`lib/accounting/international/countries/nz.ts` + shared compliance/adapter modules. Tested
(`compliance.test.ts` has a dedicated test asserting NZ is non-exempt, specifically so a future
edit can't silently "fix" this back to the wrong, more-intuitive-looking default).

## 7. Flagged for human confirmation

- The NZ$60,000 GST registration threshold figure (MODERATE, not re-fetched this session —
  the no-exemption finding itself is VERIFIED and does not depend on this number).
- Whether any of Notya's actual NZ doctors bill through a funding arrangement (ACC, Vote Health)
  that would change this — out of scope for direct-patient billing today, flagged for whenever
  that model is considered.
