# Notya Accounting — Australia country kit

Researched 2026-10-16. Code: `lib/accounting/international/countries/au.ts`.

## 1. E-invoicing mandate?

**No, not for private business.** Peppol e-invoicing exists in Australia and the Commonwealth has
progressively required its OWN agencies to be able to receive e-invoices from suppliers (B2G),
but there is no mandate for private B2B/B2C invoicing — a doctor's own practice billing patients
is unaffected, whether sole trader or a company structure.

- [Invoice Data Extraction — Australia Peppol e-invoicing requirements & deadlines](https://invoicedataextraction.com/blog/australia-peppol-e-invoicing-requirements)

## 2. Free official channel?

**No single one** — and this matters for the implementation choice. Peppol access in Australia is
via accredited, decentralized **Access Points**, some bundled free into accounting software,
others paid; there is no direct, single, free government portal analogous to GİB Portalı or UZ's
my.soliq.uz. Forcing a "prepare → submit on a free government portal" flow onto AU would
misrepresent what actually exists — correctly implemented here as `simple_invoice`, not a portal
flow, per the task brief's explicit instruction not to force a GİB-style flow where the law/
infrastructure doesn't have one.

## 3. Correct implementation

A compliant invoice/receipt generator (`simple_invoice`).

## 4. Tax line

A medical service is **"GST-free"** under Subdivision 38-B (incl. s38-7) of the *A New Tax
System (GST) Act 1999* when a recognised medical practitioner provides it to the patient (who is
normally the recipient) and the medical profession generally accepts it as necessary for the
patient's appropriate treatment — the default, no-GST-line case for an ordinary consultation.
Purely cosmetic procedures with no Medicare benefit fall outside the exemption and are taxable at
the standard **10%** rate. **MODERATE confidence** — confirmed via secondary professional
commentary cross-referencing the Act; the ATO's own GST health-industry partnership ruling (found
in search) was not independently re-fetched in full this session.

- [Bristax — GST and Health Services](https://bristax.com.au/gst-articles/gst-and-health-services/)
- [ATO — GST Industry Issues: health industry partnership (ruling)](https://www.ato.gov.au/law/view/pdf/adhoc-sgml/gstir-health-industry-ch01.pdf)
- [Xero — Healthcare accounting in Australia](https://www.xero.com/au/guides/healthcare-accounting-australia/)

## 5. Stopaj equivalent

**Not confirmed as applicable to patient billing — flagged, not guessed.** Australia's **"no-ABN
withholding"** rule requires a *business* payer to withhold **47%** from a supplier that hasn't
quoted an ABN — a GST/ABN-compliance backstop, not a general stopaj on medical fees. The source
reviewed (a law-firm explainer of the rule) did not address a doctor/patient scenario specifically,
and a private individual patient paying a doctor directly is very unlikely to be the kind of
"business payer" this rule targets — but that inference wasn't independently confirmed against
an ATO source this session, so `configuredRateBp: 4700` is stored as a reference value with
`confirmed: false`, deliberately blocking it from being read as a settled default. **Flagged for
Kaan or an Australian tax agent to confirm** before this is used for anything beyond the
"informational, does not apply to ordinary patient billing" note the invoice shows today.

- [Sprintlaw — No-ABN withholding in Australia: what to do and avoid penalties](https://www.sprintlaw.com.au/articles/no-abn-withholding-in-australia-what-to-do-and-avoid-penalties)

## 6. Built this pass

`lib/accounting/international/countries/au.ts` + shared compliance/adapter modules. Tested.

## 7. Flagged for human confirmation

- The no-ABN-withholding applicability question above (§5) — the single most important open
  item for AU.
- A direct ATO GST health-industry ruling check for edge cases (allied-health vs. medical
  practitioner distinctions) before production.
