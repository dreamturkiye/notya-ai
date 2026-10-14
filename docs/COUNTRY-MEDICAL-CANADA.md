# Canada — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the Canadian pack (`countries/ca`). It does not change Turkish files. Nothing here is a live connection.

## Authorities

| Role | What was read |
| --- | --- |
| Federal health department | The department's own front page, opened 14 October 2026. It says it is a federal institution in the Health portfolio, responsible for helping people maintain and improve their health, and it lists drugs and health products among its work. https://www.canada.ca/en/health-canada.html |
| Electronic prescribing | PrescribeIT homepage, opened 14 October 2026. It calls itself the country's electronic prescription service and says the national prescribing standard is reached by joining the ePrescribing Standards Working Group. https://www.prescribeit.ca/ |
| Drug ranking | No official national ranking of individual medicines by number of prescriptions was found. The earlier research file `docs/medicines/CANADA.md` keeps eight separate official rankings that count different things and says they must not be merged. The Drug Product Database is a register, not a ranking, and the extract that was sampled is not a list of the most prescribed medicines. |

## What was already in the pack

A unit converter and the 2021 eGFR equation. Laboratory units already live on the tools that use them. Empty slots stay empty: prescription form, interactions, diagnosis codes (ICD-10-CA is licensed and was not pasted), vaccination schedule, and notifiable diseases.

## What was opened on the second pass and not copied

| Source | Why it is not a screen |
| --- | --- |
| Open Government Licence – Canada, version 2.0, read 14 October 2026 at https://open.canada.ca/en/open-government-licence-canada | Commercial use is allowed with attribution. The licence does not create a ranking of prescriptions. The approved human products are stored as a lookup (`ca-dpd-lookup`), not as a most-prescribed list. |
| Canadian Immunization Guide, recommended schedules, read 14 October 2026 at https://www.canada.ca/en/public-health/services/publications/healthy-living/canadian-immunization-guide-part-1-key-immunization-information/page-13-recommended-immunization-schedules.html | The chapter says it has not been updated with NACI guidance of May 2026 (meningococcal vaccines under 2 years), 30 January 2026 (rabies pre-exposure), and 15 November 2024 (pneumococcal vaccines in adults, including Pneu-C-21). It also says it contains no COVID-19 information. A schedule taken from that chapter would be stale. It was not copied. |
| Nationally notifiable diseases, page date modified 7 October 2026, https://diseases.canada.ca/notifiable/diseases-list | The HTML shell does not include the disease rows. They are drawn into the page by a script. The rows were not in the file that was saved, so none were copied. Historical names that are no longer notifiable were not taken from a search snippet. |
| Controlled-drug writing rules | No current regulation text was saved. No field was invented. |

`countries/ca/kayit/etkilesim.ts` stores no pair and names a commercial contract. First Databank is one path. `countries/ca/kayit/tani.ts` stores no code. The path is an ICD-10-CA licence from the Canadian Institute for Health Information, or a WHO ICD-10 licence. `countries/ca/kayit/laboratuvar.ts` restates the units already in the pack (`µmol/L` creatinine, `g/L` hemoglobin, and the others) with no panel and no numeric range.

## What the second pass stored

| Item | What it is |
| --- | --- |
| `ca-narcotic-note` | Five ticks from the Narcotic Control Regulations, C.R.C., c. 1041, sections 2 and 31(2), current to 2026-09-21 and last amended on 2024-06-05. Read 14 October 2026 at https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1041/FullText.html. Reproduction is under the Reproduction of Federal Law Order, SI/97-5, and the screen says it is not an official version. |
| `ca-dpd-lookup` | Approved human products from the Drug Product Database API (`status=1`, class Human), with English ingredient names, retrieved 14 October 2026. Open Government Licence – Canada. Not a ranking and not a dose. Disinfectants, veterinary products and radiopharmaceuticals are not in the file. |
| Interaction stub | `countries/ca/kayit/etkilesim.ts`. No pair. A commercial contract is required. First Databank is one path. No call. |
| Diagnosis stub | `countries/ca/kayit/tani.ts`. No code. Path: an ICD-10-CA licence from the Canadian Institute for Health Information, or a WHO ICD-10 licence. |
| Laboratory stub | `countries/ca/kayit/laboratuvar.ts`. Units already in the pack. No panel and no numeric range. |

The five ticks are: written; signed by a practitioner; dated; a stated amount; the person named or the animal identified. Diacetylmorphine (heroin) under section 31(2)(c) and a verbal prescription narcotic under section 34 are named in the description and are not extra ticks. Section 38 is the book a pharmacist keeps. Those lines were not turned into prescription fields. Targeted-substance regulations, the controlled-drug part of the Food and Drug Regulations, and provincial rules were not opened.

## What was not copied, and the licence that blocks it

The Public Health Agency of Canada terms, read 14 October 2026 at https://www.canada.ca/en/public-health/corporate/terms-conditions.html, allow non-commercial reproduction. Commercial redistribution needs prior written permission. The clearance form is https://www.canada.ca/en/public-health/corporate/terms-conditions/application-copyright-clearance.html. This product is commercial, so the Canadian Immunization Guide tables and the notifiable-disease names were not copied onto a screen.

The immunization chapter was read in full on 14 October 2026. Even with permission it would still be incomplete: the page itself says it lacks the May 2026 meningococcal statement for children under 2, the 30 January 2026 rabies pre-exposure statement, the 15 November 2024 adult pneumococcal statement (including Pneu-C-21), and any COVID-19 information. Last complete chapter revision: December 2013. Last partial content update: June 2026.

The notifiable HTML shell (date modified 7 October 2026) does not contain the rows. They are drawn by a script. Decoding that script and copying the names would still be a commercial reproduction of the agency's site. It was not done.

No official national top 250 by prescriptions was found. The Drug Product Database was not copied and then labelled as most prescribed. The Open Government Licence – Canada does not create that ranking.

## What this job added

| Item | What it is |
| --- | --- |
| `ca-prescribeit-link` | A link for doctors. No call is made. |
| Service register | `countries/ca/kayit/sistemler.ts`. One service, `bagli: false`. |

No 250-drug list was added. Inventing one from separate rankings, or from a register of licensed products, would label the wrong thing as "most prescribed".

## Registration — not started

Joining the ePrescribing Standards Working Group is what the homepage states. The production contract, conformance tests, and registration fields were not on that page. Provincial electronic record systems were not opened.

## Clinician and lawyer

- Lawyer: the Open Government Licence – Canada was read on 14 October 2026. It allows commercial use with attribution. It was not used to load a medicine list, because no national top 250 by prescriptions was in hand.
- Lawyer: the Public Health Agency of Canada terms were read on 14 October 2026. Commercial redistribution needs written permission. The immunization tables and the notifiable names were not copied. The clearance form is linked above.
- Lawyer: the narcotic checklist is a reproduction of a federal enactment under the Reproduction of Federal Law Order. The screen says it is not an official version. The regulations are current to 2026-09-21.
- Clinician: the five ticks are sections 2 and 31 only. Heroin, a verbal prescription narcotic, the pharmacist's book, other controlled-drug regulations, and provincial rules are named as not on the list.
- Clinician: the immunization chapter that was opened says it is missing later committee guidance. It was not copied.
- Clinician: the PrescribeIT tile is not a prescription and not a transmission.
- Not loaded: interaction pairs, ICD-10-CA, a vaccination calendar, a notifiable list, dosing, a 250-drug list, and any live API.
