# Australia — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the Australian pack (`countries/au`). It does not change Turkish files. Nothing here is a live connection.

## Authorities

| Role | What was read |
| --- | --- |
| Subsidised medicines | Pharmaceutical Benefits Scheme, expenditure and prescriptions reports. The index was opened on 14 October 2026 and names a current report for 1 July 2024 to 30 June 2025. https://www.pbs.gov.au/info/statistics/expenditure-prescriptions/pbs-expenditure-and-prescriptions |
| Reuse | The copyright page (https://www.pbs.gov.au/general/copyright, last updated 6 July 2022) was read on 9 October 2026 and is quoted in `docs/medicines/AUSTRALIA.md`: the material is copyright, personal reference only, other rights reserved. No Creative Commons licence. The top-50 table was not copied. Department contact recorded there: HPP.Support@Health.gov.au. |
| Immunisation | Already in the pack as `au-immunisation-schedule`, twelve age milestones including pregnancy and ages 65 and 75, from NSW Health's rendering of the National Immunisation Program, read 13 October 2026. Not duplicated. Catch-up rules are still not in the tool. |
| Notifiable diseases | National Health Security (National Notifiable Disease List) Instrument 2018, compilation in force on 22 May 2026. Word file downloaded 14 October 2026 from https://www.legislation.gov.au/F2018L00450/2026-05-22. Register terms of use, read the same day: Creative Commons Attribution 4.0 International, including commercial reuse, with attribution. https://www.legislation.gov.au/terms-of-use |
| Poisons schedules | Therapeutic Goods (Poisons Standard—October 2026) Instrument 2026, F2026L01327, also SUSMP No. 51, commenced 1 October 2026. Word file downloaded 14 October 2026 from https://www.legislation.gov.au/F2026L01327/asmade/2026-09-30. Same Creative Commons Attribution 4.0 terms. Schedule classes, every Schedule 8 entry, and Appendix L clause 1 label details are stored. The clause 2 warning-statement table is not. |
| My Health Record | Provider pages timed out on the second pass. An earlier attempt the same day returned HTTP 500. eRx homepage returned HTTP 403. No registration form was read. The removed every-role link was not restored. |

## What was already in the pack

Body size, a mental-health screen, oncology grading, the immunisation record, a growth-chart link, and consultations.

## Read on 15 October 2026 and switched on

Still unsigned. Nothing below is a live connection.

| Tool | Source read that day | Who sees it |
| --- | --- | --- |
| `au-mandatory-notifications` | Health Practitioner Regulation National Law as set out in the Queensland Act, current as at 10 April 2026, sections 140 to 142. Queensland Legislation copyright page: Creative Commons Attribution 4.0. The regulator's guidance page was not copied. A treating practitioner is on sections 141A and 141B, not the section 140 test. The National Law outside Queensland was not read. | Medical practitioners, plus physiotherapy, occupational therapy, psychology and podiatry (the public professions list, page reviewed 11 April 2025). Not dietetics, audiology or speech pathology. |
| `au-pbs-prescription` | National Health (Pharmaceutical Benefits) Regulations 2017, compilation in force on 15 August 2026, sections 40, 41A and 42. Register terms: Creative Commons Attribution 4.0. Not a medicine list and not a State or Territory form. | Doctors |
| `au-medicare-particulars` | Health Insurance Regulations 2018, compilation in force on 1 March 2026, sections 47 to 56. Same register terms. Not a claim. Sections 52 and 57 are not ticks. | Doctors |
| `au-pbs-schedule-link` | Listings index, HTTP 200. No row copied. Same PBS copyright page as the report link. | Doctors |
| `au-mbs-online-link` | MBS Online home page, HTTP 200. No item copied. A reuse grant for the schedule was not read. | Doctors |
| `au-cvd-risk-link` | Calculator page, HTTP 200. The copyright page did not return a reuse grant. No equation or age band copied. This does not fill the shared cardiovascular-risk slot. | General practice, general medicine, cardiology, endocrinology, geriatric medicine |

Department of Health pages (Immunisation Handbook, cancer screening, real-time prescription monitoring) did not load in this session, so no link and no age was added from them.

## What is on a screen

| Tool | What it holds |
| --- | --- |
| `au-pbs-report-link` | A link for doctors to the report index. No drug row was copied. |
| `au-notifiable-diseases` | 71 disease names from the 22 May 2026 compilation, in table order. Doctors only. Item 1A is included; the compilation's amendment history says it expires at the end of 22 November 2026. Nothing is sent. |
| `au-poisons-schedules` | Nine schedule classes from the Poisons Standard that commenced on 1 October 2026. The result repeats that instrument's general description. Schedule 1 is blank and is not offered. Doctors only. |
| `au-schedule-8` | 86 Schedule 8 entries, each with the exception the instrument prints. A hash mark is the instrument's mark for Appendix D. This is the schedule, not a count of prescriptions. Doctors only. Nothing is sent. |
| `au-dispensing-label` | Appendix L clause 1 details for a human-medicine label, including the three lines that apply when supply is on a prescription. The veterinary line and the clause 2 warning table are not stored. Nothing is printed. |

No 250-drug list was added. PBS copyright does not allow the top-50 table into this product. The Australian Register of Therapeutic Goods was not copied: no Creative Commons licence for that dataset was found on a page that loaded.

## Still empty

| Gap | Why |
| --- | --- |
| A ranked list of 250 medicines | PBS copyright does not allow the tables. The ARTG search guidance (read via the June 2023 PDF on 14 October 2026) allows reproduction for personal or internal use and reserves commercial reuse unless the Commonwealth gives written permission. No ARTG row was copied. A third-party claim of a Creative Commons licence was not treated as the register's own licence. |
| Diagnosis codes | ICD-10-AM needs a licence. No code is stored. `countries/au/kayit/tani.ts` |
| Interactions | Unconnected adapter, no pairs. A commercial database needs its own contract. `countries/au/kayit/etkilesim.ts` |
| State and Territory prescription forms | The Poisons Standard says who may prescribe, and what a prescription must contain, is State or Territory law. No state's form was copied, so those fields are not invented. |
| Laboratory panels and ranges | Units already in the pack are repeated in `countries/au/kayit/laboratuvar.ts`. No panel and no reference range was added. |
| Immunisation catch-up | The Handbook pages were opened on 14 October 2026. The Department copyright notice (https://www.health.gov.au/using-our-websites/copyright, read the same day) does not allow commercial reuse. Catch-up rows were not copied. The existing milestone record was not duplicated. |

## Registration — not started

`countries/au/kayit/sistemler.ts`. Both records have `bagli: false`.

| Service | What happened on 14 October 2026 |
| --- | --- |
| My Health Record | Provider pages timed out. An earlier request returned HTTP 500. No registration fields were read. |
| eRx | Homepage returned HTTP 403. No registration steps were readable. |

A local FHIR draft can build one MedicationRequest with status `draft`. It is not submitted. Healthcare Identifiers were not configured.

## Clinician and lawyer

- Lawyer: PBS tables and ARTG rows stay out. Disease names, schedule classes, Schedule 8 entries and Appendix L clause 1 are stored under the register's Creative Commons Attribution 4.0 terms, with the required attribution on each tool. The 15 October 2026 checklists (notification grounds, PBS prescription particulars, Medicare account particulars) use the same register terms, or Queensland's, and say which compilation was read. Catch-up immunisation text stays out under the Department copyright notice. The National Law outside Queensland was not read.
- Clinician: the new tools are unsigned. Confirm the 22 May 2026 disease compilation is still in force, including the expiry of item 1A, and that the October 2026 Poisons Standard is still current. Confirm the 15 August 2026 PBS compilation, the 1 March 2026 Medicare compilation, and the Queensland Act current as at 10 April 2026 are still the text to show.
- Not loaded: interaction pairs, ICD-10-AM, a ranked medicine list, State or Territory prescription forms, catch-up immunisation rows, and any live API.
