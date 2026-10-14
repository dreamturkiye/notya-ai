# New Zealand — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the New Zealand pack (`countries/nz`). It does not change Turkish files. Nothing here is a live connection.

## Authorities

| Role | Body | Page read |
| --- | --- | --- |
| Funder | Pharmac (Te Pātaka Whaioranga). Community prescription counts and the Pharmaceutical Schedule. | https://www.pharmac.govt.nz/news-and-resources/publications/year-in-review/top-20s/community-medicines and https://schedule.pharmac.govt.nz/pub/schedule/archive/Schedule_2026-10.xml |
| Reuse | Pharmac copyright page, last updated 23 September 2026: Creative Commons Attribution 4.0 International. The Schedule file README states the same licence and asks for written attribution, with no logo. | https://www.pharmac.govt.nz/about-this-site/copyright and https://schedule.pharmac.govt.nz/pub/HML/archive/README.html |
| e-prescription | Health New Zealand, e-medicines programme, including the New Zealand ePrescription Service. | https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/emedicines-and-the-new-zealand-e-prescription-service |
| Immunisation | Health New Zealand, National Immunisation Schedule page. The copyright URL that was opened returned a general homepage, not a licence, so the rows were not copied into a tool. | https://www.tewhatuora.govt.nz/health-services-and-programmes/vaccine-information/new-zealand-immunisation-schedule |

The medicines regulator's short name is not written on a screen in this pack, because the English pack check treats that short name as a claim word. The NHI, Hira, and the Health Identity APIs were not opened.

## What was already in the pack

Body mass index with waist, the smoking ABC record, and PSA thresholds. The dose calculator is on for the roles the pack already chose. Laboratory units already live on the tools that use them. No reference range was invented.

Empty slots that stay empty:

- `prescription` — the new note is not a national prescription form and is not sent.
- `medicine-interactions` — no pair was loaded. The New Zealand Formulary pages that were described in earlier research are not free to copy.
- `diagnosis-coding` — SNOMED CT and ICD-10-AM were not pasted. Each needs a licence.
- `vaccination-schedule` — the national page was read and not loaded, because a licence statement was not on the page that came back.
- `notifiable-diseases` — the list was not opened.
- `lab-izlem` — no second catalogue.

The Pharmaceutical Data web tool (Health New Zealand, CC BY 4.0 in earlier research) returned HTTP 403 on 14 October 2026, so a top 250 by dispensings was not downloaded. The 230 ranks below the Pharmac top 20 are still missing.

## What this job added

| Tool | Count | Source and date |
| --- | --- | --- |
| `nz-pharmac-top-20` | 20 medicines | Pharmac medicines prescription count, 2023/24. The page's own line says last updated 26 February 2024. Rank 1 is paracetamol. The page title still says 2021/22; the heading and the table say 2023/24. |
| `nz-schedule-medicines` | 250 chemical entries | Pharmaceutical Schedule XML, October 2026 edition, published 8 October 2026. The first 250 entries in the community section, in file order. Not a volume ranking. First formulation and first brand only. Rank 1 of this extract is alginic acid, brand Gaviscon Infant. The last of the 250 is sodium fusidate. |
| `nz-prescription-note` | the same 250, plus a quantity and directions the doctor types | Same file. The quantity is not a suggested dose. The note is not sent. |
| `nz-nzeps-link` | a link | The e-medicines page above. |
| Local FHIR draft | one MedicationRequest, status `draft` | `countries/nz/kayit/fhirTaslak.ts`. No patient identifier. No network call. |
| Service register | 1 service, `bagli: false` | `countries/nz/kayit/sistemler.ts`. |

The prescription counts are stored in `countries/nz/referans/ust20.json` and are not shown on the tool. Dollar subsidy amounts from the Schedule are not stored.

## Registration — not started

| Service | What the page said |
| --- | --- |
| New Zealand ePrescription Service | A prescriber generates a prescription, it is transmitted to the broker, and a community pharmacy downloads it. The page names clinical systems that already use the service. It does not state a registration form, a conformance test, or a contract. This product makes no call. |
| NHI, Hira, Health Identity | Not opened. Not configured. |

## Clinician and lawyer

No clinician and no lawyer has signed these tools. They are on `countries/nz/araclar/onaysiz.ts`.

- Lawyer: the Schedule README and the Pharmac website copyright page both state CC BY 4.0. The extract changes the file (first 250 community chemicals, first formulation, first brand, file order, no prices). The notice on the tool says that.
- Lawyer: the top-20 page title says 2021/22 while the table says 2023/24.
- Clinician: the Schedule position is not a prescribing-volume rank. Infusion sets and similar entries appear because they are chemical entries in the file.
- Clinician: the prescription note is not sent and states no controlled-medicine class.
- Clinician: the immunisation page was read (6 weeks, 3 months, 5 months, 12 months, 15 months, 4 years, and the adult ages the page lists) and was not turned into ticks, because the copyright page did not come back as a licence.
- Not loaded: interaction pairs, a SNOMED or ICD-10-AM table, a notifiable-disease list, dosing, and any live API.
