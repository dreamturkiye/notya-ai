# United Kingdom — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the England-facing pack (`countries/gb`). It does not change Turkish files. Nothing here is a live connection to an NHS service.

The Turkish product holds a full reimbursed pack list, dosing and interaction monographs, ICD-10 titles, national prescription and health-record adapters, a vaccination calendar, a lab catalogue and a notifiable-disease list. Those files were not copied. Where this pack still has an empty slot, the slot is the honest state: the source was not in a form this product may load.

## Authorities

| Role | Body | Page read |
| --- | --- | --- |
| Payer and community dispensing | NHS Business Services Authority, an arm's-length body of the Department of Health and Social Care. Prescription Cost Analysis is the dispensing statistic used below. | https://www.nhsbsa.nhs.uk/ and https://opendata.nhsbsa.net/dataset/prescription-cost-analysis-pca-annual-statistics |
| Health protection, immunisation, notification | UK Health Security Agency, an executive agency of the same department | https://www.gov.uk/government/organisations/uk-health-security-agency |
| National digital services | NHS England Digital: Spine, Electronic Prescription Service, GP Connect, Summary Care Record, NHS login | the service pages linked under Registration |
| Medicines regulator | Medicines and Healthcare products Regulatory Agency. Already cited in this pack for valproate. Not used as a drug register here. | https://www.gov.uk/guidance/valproate-reproductive-risks (opened earlier, 10 October 2026) |
| Guidance | NICE, including the BNF it publishes. Monographs were not copied. NICE's own terms restrict use for AI without written permission; items already in the pack are listed in `countries/gb/nice-kaynakli.json`. | not re-opened for this job |

## What was already in the pack

Switched on before this job: 4AT, the valproate annual-review dates, a link to the FRAX calculator, and the shared tools the country had already turned on (including the dose calculator for paediatrics, which does arithmetic the doctor supplies and holds no national dose table).

Empty slots that are still empty, on purpose:

- `prescription` — a full prescription form, controlled-drug rules, and transmission. The new note does not replace this slot.
- `medicine-interactions` — no interaction pair was loaded. DrugBank is CC BY-NC; the BNF is not free to copy into this product.
- `diagnosis-coding` — ICD-10 and SNOMED CT were not pasted. SNOMED CT needs a licence. The NHSBSA workbook has a SNOMED sheet; it was not imported.
- `vaccination-schedule` and `notifiable-diseases` — the shared slots stay, because the new tools are records and lists, not the full Green Book and not the laboratory organism list.
- `lab-izlem` — units for the tools that already use a laboratory value are in `countries/gb/araclar.ts` (`mg/mmol`, `g/L`, `µmol/L`, `mmol/L`, `mg/L`, `µg/L`). No reference range was invented, so no second catalogue was added.

## What this job added

| Tool | Count | Source and date |
| --- | --- | --- |
| `gb-medicine-list` | 250 chemical substances | NHSBSA Prescription Cost Analysis, England 2025/26, national summary workbook `pca_summary_tables_2025_26_v001.xlsx`, retrieved 14 October 2026. Chapters 01–15 only (medicines). Chapter 21 appliances were in the overall top and were left out. The presentation is the single presentation of that chemical with the highest item count, not every strength. Rank 1 is atorvastatin, 78,042,871 items, presentation "Atorvastatin 20mg tablets". |
| `gb-prescription-note` | the same 250, plus a quantity and directions the doctor types | Same workbook. The quantity is not a suggested dose. The note is not sent. |
| `gb-immunisation-schedule` | 20 routine rows | UKHSA, "Complete routine immunisation schedule from 1 September 2026", updated 24 September 2026. https://www.gov.uk/government/publications/the-complete-routine-immunisation-schedule/complete-routine-immunisation-schedule-from-1-july-2026 |
| `gb-notifiable-diseases` | 43 diseases | UKHSA, "Notifiable diseases and causative organisms: how to report", last updated 19 May 2026. https://www.gov.uk/guidance/notifiable-diseases-and-causative-organisms-how-to-report |
| `gb-eps-link` | a link | https://digital.nhs.uk/services/electronic-prescription-service |
| Local FHIR draft | one MedicationRequest, status `draft` | `countries/gb/kayit/fhirTaslak.ts`. No patient identifier. No network call. |
| Service register | 5 services, each `bagli: false` | `countries/gb/kayit/sistemler.ts` |

Licence: the NHSBSA dataset page states the Open Government Licence 3.0. GOV.UK pages state the same licence except where a page says otherwise. The immunisation page says third-party copyright needs the holders' permission. Trade names on that page were not copied. Four BNF chemical names that the workbook prints with "sulfate" are protected from the spelling table so the cited spelling is kept (`countries/_dil/en/sozluk.ts`).

The national item count is stored in `countries/gb/referans/ilaclar.json` and is not shown on the tool.

## Registration — not started

No credential, conformance certificate or contract is held. Each row is what the page read on 14 October 2026 said a newcomer has to do.

| Service | What the page requires before a connection |
| --- | --- |
| Electronic Prescription Service | Care Identity Service authentication to update a record. Supplier onboarding: epsonboarding@nhs.net. Support: epssupport@nhs.net. Implementation: england.digitalmedicines@nhs.net. The page says companion services must be used alongside EPS; the fetched text cut off before it named them, so they are not listed here. Wales is Digital Health and Care Wales. |
| Spine | Access through a clinical system or the Spine portal. The Warrantied Environment Specification, and a smartcard or other approved authenticator where the application needs one. An existing connection can be asked to move from the Health and Social Care Network to the internet. National Service Desk: ssd.nationalservicedesk@nhs.net. |
| GP Connect | Cannot be signed up to as its own login. The supplier completes national onboarding and assurance. Next steps on the page: review the prerequisites, check the consumer-portal assurance, submit a use case. england.gpconnectonboarding@nhs.net. The National Data Sharing Arrangement. The patient must be registered with a GP in England whose system is live, and must not have opted out. |
| Summary Care Record | No screen of its own. A local system, the National Care Records Service, or a supplier API (FHIR, described as currently only for GP software; or HL7 V3). A legitimate relationship, and permission unless urgent care proceeds in the patient's best interests. Smartcard with role-based access, or the National Care Records Service sign-in the page describes. Testing: sa.servicedesk@nhs.net. |
| NHS login | For a patient-facing service that is commissioned or sponsored by an NHS organisation and aligns with the NHS Long Term Plan. A private part of a mixed service cannot use it. Onboarding is the page's own "integrating with NHS login" route, which this product has not opened beyond the service overview. The page names standard DAPB3051. |

## Clinician and lawyer

No clinician and no lawyer has signed these tools. They are listed in `countries/gb/onaysiz-araclar.json`.

- Lawyer: immunisation rows under the Open Government Licence once trade names are removed; the page's third-party sentence is quoted on the tool.
- Lawyer: whether a commercial product may show the NHSBSA top 250 under the Open Government Licence with attribution (the dataset page states that licence).
- Clinician: the 18-month and 3-year-4-month rows name both birth cohorts in one tick and do not choose between them.
- Clinician: conditional notification rows (brucellosis, food poisoning, malaria, tetanus, tuberculosis, whooping cough, yellow fever).
- Clinician: the prescription note must not be used as an FP10 or as a controlled-drug rule. The workbook has no schedule column.
- Not loaded, because the source was not opened or is not free to copy: the Green Book, BNF monographs, interaction pairs, a SNOMED or ICD-10 table, controlled-drug writing particulars, and any live NHS API.
