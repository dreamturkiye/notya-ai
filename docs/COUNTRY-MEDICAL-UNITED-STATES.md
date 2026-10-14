# United States — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the United States pack (`countries/us`). It does not change Turkish files. Nothing here is a live connection to a federal or state service.

The Turkish product holds a full reimbursed pack list, dosing and interaction monographs, ICD-10 titles, national prescription and health-record adapters, a vaccination calendar, a lab catalogue and a notifiable-disease list. Those files were not copied. Where this pack still has an empty slot, the slot is the honest state: the source was not in a form this product may load, or the page was not retrieved.

## Authorities

| Role | Body | Page read |
| --- | --- | --- |
| Payer | Centers for Medicare & Medicaid Services, inside the Department of Health and Human Services. The about page says CMS provides coverage through Medicare, Medicaid, the Children's Health Insurance Program, and the Health Insurance Marketplace, to more than 160 million people. | https://www.cms.gov/about-cms opened 14 October 2026 |
| Part D claims statistic used below | The same agency, Medicare Part D Spending by Drug, manufacturer field Overall, 2024 claims | https://data.cms.gov/summary-statistics-on-use-and-payments/medicare-medicaid-spending-by-drug/medicare-part-d-spending-by-drug and the data API dataset `7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b` |
| Medicines regulator | Food and Drug Administration, part of the same department. The about page says it works on the safety and effectiveness of human and veterinary medicines, biologics, and medical devices, and also food, cosmetics, radiation-emitting devices, and tobacco. No drug register was copied from it in this job. | https://www.fda.gov/about-fda opened 14 October 2026 |
| Controlled substances | Drug Enforcement Administration. The scheduling page describes five schedules by medical use and abuse potential, and says its example lists are general references and not comprehensive. Those example lists were not copied. | https://www.dea.gov/drug-information/drug-scheduling opened 14 October 2026 |
| Immunization and public health | Centers for Disease Control and Prevention. The child and adolescent age table and the adult age table were read. A separate priorities page was also opened and was not used as clinical content. | https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html and https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html |
| Claims API | CMS Blue Button. Homepage only. | https://bluebutton.cms.gov/ |
| Nationwide exchange | Trusted Exchange Framework and Common Agreement, described by the Recognized Coordinating Entity. Applications to be a Qualified Health Information Network are accepted on a rolling basis. Common Agreement Version 2.1 was released in November 2024. This product has no application. | https://rce.sequoiaproject.org/tefca/ opened 14 October 2026 |
| Copyright caveat | USAGov, "Learn about copyright and federal government materials", updated April 30, 2026. A U.S. government work is a work of an officer or employee as part of official duties. Not every file on a federal site is one. Use must not imply endorsement. | https://www.usa.gov/government-copyright |

State medical boards, state prescription-drug monitoring programs, and Surescripts were not opened on 14 October 2026, so they are not configured.

## What was already in the pack

Switched on before this job: body mass index, the 2021 eGFR equation, pack-years, blood-sugar ranges, a fall-risk screen, PHQ-9 by item number, and ECOG by grade number. Shared laboratory units already live on the tools that use a laboratory value. No reference range was invented, so no second catalogue was added.

Empty slots that are still empty, on purpose:

- `prescription` — a full prescription form, controlled-substance writing particulars, and transmission. The regulation site blocked automated reading on 14 October 2026 (a captcha page, then an HTTP 500 from the versioner). The note does not replace this slot. No 21 CFR field was invented.
- `medicine-interactions` — no interaction pair was loaded. `countries/us/kayit/etkilesim.ts` records that a commercial contract is required. First Databank is named as one contract path. No pair is stored.
- `diagnosis-coding` — the shared slot stays. The FY2027 order file is stored at `countries/us/referans/icd10cm-order-2027.txt` (98,403 lines: 74,879 marked valid for submission, 23,524 headers). It is not shown as a screen list, because the pack is loaded in the browser. The Node lookup is `countries/us/referans/icd10cm.ts`.
- `vaccination-schedule` — the shared slot stays. Catch-up intervals and the medical-indication tables are not loaded. The child and adult age tables are separate records.
- `notifiable-diseases` — the shared slot stays. The national protocol is a separate record. State and territorial lists were not copied. The case-definition search index was not used, because it mixes current and historical names.
- `lab-izlem` — units already in the pack (`mg/dL` creatinine and glucose, `g/dL` hemoglobin, and the others in `countries/us/ayarlar.ts`). No numeric reference range and no panel was added.

ClinCalc's Top 300 is CC BY-SA and was not copied into the product. The earlier research file `docs/medicines/UNITED-STATES.md` keeps that secondary ranking beside the official tables. This job uses only the CMS Part D extract.

## What this job added

| Tool | Count | Source and date |
| --- | --- | --- |
| `us-part-d-medicines` | 250 drugs | CMS Medicare Part D Spending by Drug, 2024, manufacturer field Overall, sorted by total claims. Retrieved 14 October 2026. Rank 1 is Atorvastatin Calcium, 73,349,032 claims. Rank 250 is Omega-3 Acid Ethyl Esters, 947,283 claims. A source row label is kept only when it differs from the generic name (89 labels, including Apixaban / Eliquis). No strength, dosage form, or schedule. |
| `us-prescription-note` | the same 250, plus a quantity and directions the doctor types | Same extract. The quantity is not a suggested dose. The note is not sent. |
| `us-immunization-schedule` | 34 rows | CDC child and adolescent immunization schedule by age, United States, 2025, page updated 2 July 2025. Opened 14 October 2026. Product names on that page are not shown. |
| `us-adult-immunization` | 18 rows | CDC adult immunization schedule by age, United States, 2025, page dated 2 July 2025. Opened 14 October 2026. Cell words only. The color legend was not kept with the cells. Notes, Table 2, the appendix, and the addendum text are not loaded. Product names are not shown. The row count is not shown on the result. |
| `us-notifiable-diseases` | 94 rows | CDC protocol for public health agencies to notify CDC about nationally notifiable conditions, 2026, updated 2 January 2026. Opened 14 October 2026. https://ndc.services.cdc.gov/wp-content/uploads/NNC_Notification_Requirements_2026_v2.pdf One animal-rabies sentence was not copied. Nothing is sent. The row count is not shown on the result. |
| `us-blue-button-link` | a link | https://bluebutton.cms.gov/ |
| Local FHIR draft | one MedicationRequest, status `draft` | `countries/us/kayit/fhirTaslak.ts`. No patient identifier. No network call. |
| Service register | 2 services, each `bagli: false` | `countries/us/kayit/sistemler.ts`. Blue Button and TEFCA. |

The claim count is stored in `countries/us/referans/ilaclar.json` and is not shown on the tool.

## Registration — not started

No credential, conformance certificate or contract is held.

| Service | What was read, and what is still missing |
| --- | --- |
| CMS Blue Button | The homepage offers a developer sandbox and says a person with Medicare allows a third-party app to see Part A, B, and D claims. It says the API covers more than 60 million people. The developer documentation URL was not retrieved on 14 October 2026, so the conformance tests, the production contract, and the registration fields are not stated. This product has no sandbox account and makes no call. |
| TEFCA | The RCE page says a network joins by applying to be designated a Qualified Health Information Network, on a rolling basis, under the Common Agreement (version 2.1, November 2024). This product has not applied and is not a participant of a QHIN. The application form itself was not opened, so its fields are not listed. |
| Surescripts, state prescription-drug monitoring programs, and state health information exchanges | Not opened. Not configured. |

## Clinician and lawyer

No clinician and no lawyer has signed these tools. They are listed in `countries/us/araclar/onayBekleyen.ts`.

- Lawyer: whether the Part D extract is a U.S. government work. The dataset page calls it a Public Use File (Free). USAGov says not every file on a federal site is a government work, and that use must not imply endorsement.
- Lawyer: the CDC agency-materials notice was read on 10 October 2026 for the earlier CDC tools. The immunization rows use that same notice. Product names on the schedule page were omitted.
- Clinician: Part D is one payer, not every prescription in the country.
- Clinician: the prescription note is not a transmitted prescription and states no controlled-substance schedule. The DEA page's example lists were not copied because the page says they are not comprehensive. Writing particulars in the regulation were not loaded.
- Lawyer: the CDC agency-materials notice covers the adult age table and the 2026 notification protocol as well. Both credit the agency.
- Clinician: the child record still does not apply the notes, the catch-up table, or the medical-indication table. The adult record is separate and does not apply its notes, Table 2, the appendix, or the addendum text, and it does not color a cell.
- Clinician: the notification protocol is for public health agencies. A tick is not a notice. State lists are not in the product.
- Clinician: the order file is stored and is not a screen of 98,403 titles. A later server lookup can read it. No code was invented.
- Not loaded: interaction pairs, dosing, controlled-substance writing particulars, catch-up intervals, state disease lists, and any live API.
