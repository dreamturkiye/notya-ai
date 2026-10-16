# Notya Accounting — Canada country kit

Researched 2026-10-16. Code: `lib/accounting/international/countries/ca.ts`.

## 1. E-invoicing mandate?

**No.** The CRA does not mandate e-invoicing for GST/HST purposes for either a sole proprietor or
a clinic/company. Electronic GST/HST *return* filing is common/required above certain revenue
thresholds, but that is filing a tax return, not issuing invoices through a government channel —
a materially different thing, confirmed by checking CRA's own electronic-filing page (about
returns, not invoices).

- [Canada.ca — Electronic Filing and Payment (GST/HST returns)](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/7-5/electronic-filing-remitting.html)

## 2. Free official channel?

Does not apply — no mandate exists to have a channel for.

## 3. Correct implementation

A compliant invoice/receipt generator (`simple_invoice`).

## 4. Tax line

A consultative, diagnostic, treatment, or other health care service rendered to an individual by
a medical practitioner is **exempt** under **Part II, Schedule V of the Excise Tax Act** — the
default, no-GST/HST-line case for an ordinary consultation, and the reason many medical
practitioners aren't required to register for GST/HST on that core work at all (a pattern a BDO
Canada article title itself confirms: "Are you required to be registered for GST/HST and QST?").
"Uninsured"/non-health-purpose services (purely cosmetic procedures, third-party medical-legal
reports) can fall outside the exemption and become taxable at the rate of the province where
supplied — federal GST-only provinces are 5%; HST provinces are higher (e.g. 13% Ontario, 15%
most Atlantic provinces). **MODERATE confidence** — the Excise Tax Act exemption framework itself
is well-established and cross-confirmed by two independent sources, but CRA's own current
GI-series guidance page on this exact point returned a "page not found" when fetched directly
this session, so the kit stores only the federal 5% floor as `defaultRateBp`, flagged as
incomplete for production (needs the full province-rate table before enabling non-exempt line
items for real).

- [Canada.ca — Proposed Exemption of Multidisciplinary Health Care Services (cites the existing medical-practitioner exemption)](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/notice311/proposed-exemption-multidisciplinary-health-care-services.html)
- [Canada.ca — Qualifying health care supplies (GST/HST, P-256)](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/p-256/qualifying-health-care-supplies-application-gst-hst-supplies-medical-examinations-assessments-reports-certificates.html)
- [Doctors Manitoba — Uninsured services and the GST](https://doctorsmanitoba.ca/managing-your-practice/remuneration/uninsured-services/overview-of-uninsured-services-and-billing/uninsured-services-and-the-gst)
- [BDO Canada — Are you required to be registered for GST/HST and QST?](https://www.bdo.ca/insights/if-you-are-a-medical-practitioner-are-you-required-to-be-registered-for-gst-hst-and-qst)

## 5. Stopaj equivalent

**None, for patient billing.** Part XIII withholding (25%, often treaty-reduced) applies only to
payments to **non-residents** — irrelevant to a resident patient paying a resident physician. No
domestic withholding exists on fees paid to a Canadian-resident doctor. **VERIFIED** by the
structure of Part XIII itself (a non-resident-only regime).

## 6. Built this pass

`lib/accounting/international/countries/ca.ts` + shared compliance/adapter modules. Tested.

## 7. Flagged for human confirmation

- The full province-by-province GST/HST rate table for non-exempt (uninsured) services — not
  built this pass; `defaultRateBp` is the federal 5% floor only.
- A direct re-check of CRA's own current GST/HST health-care-services guidance page (the one
  that returned "not found" this session) before production.
