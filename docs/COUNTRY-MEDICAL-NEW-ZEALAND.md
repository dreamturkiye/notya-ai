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

Legislation published on legislation.govt.nz has no copyright. The copyright page was read on 14 October 2026: https://www.legislation.govt.nz/copyright/. It cites section 27 of the Copyright Act 1994 and says legislation may be reproduced in any format, free of charge, without specific permission.

## What was already in the pack

Body mass index with waist, the smoking ABC record, and PSA thresholds. The dose calculator is on for the roles the pack already chose. Laboratory units already live on the tools that use them. No reference range was invented.

Empty slots that stay empty:

- `prescription` — the new note is not a national prescription form and is not sent.
- `medicine-interactions` — no pair was loaded. The New Zealand Formulary pages that were described in earlier research are not free to copy.
- `diagnosis-coding` — SNOMED CT and ICD-10-AM were not pasted. Each needs a licence.
- `vaccination-schedule` — the national page was read and not loaded, because a licence statement was not on the page that came back.
- `notifiable-diseases` — a Ministry PDF was read and not copied. See below.
- `lab-izlem` — no second catalogue.

The Pharmaceutical Data web tool (Health New Zealand, CC BY 4.0 in earlier research) returned HTTP 403 on 14 October 2026, so a top 250 by dispensings was not downloaded. The 230 ranks below the Pharmac top 20 are still missing.

## What this job added

| Tool | Count | Source and date |
| --- | --- | --- |
| `nz-pharmac-top-20` | 20 medicines | Pharmac medicines prescription count, 2023/24. The page's own line says last updated 26 February 2024. Rank 1 is paracetamol. The page title still says 2021/22; the heading and the table say 2023/24. |
| `nz-schedule-medicines` | 250 chemical entries | Pharmaceutical Schedule XML, October 2026 edition, published 8 October 2026. The first 250 entries in the community section, in file order. Not a volume ranking. First formulation and first brand only. Rank 1 of this extract is alginic acid, brand Gaviscon Infant. The last of the 250 is sodium fusidate. |
| `nz-prescription-note` | the same 250, plus a quantity and directions the doctor types | Same file. The quantity is not a suggested dose. The note is not sent. |
| `nz-nzeps-link` | a link | The e-medicines page above. |
| `nz-controlled-drug-note` | 12 ticks | Misuse of Drugs Regulations 1977, regulation 29, consolidation as at 5 July 2024, read 14 October 2026. The first six ticks are regulation 29(4), for every controlled-drug prescription. The other six apply only in the case the label names. |
| Local FHIR draft | one MedicationRequest, status `draft` | `countries/nz/kayit/fhirTaslak.ts`. No patient identifier. No network call. |
| Service register | 1 service, `bagli: false` | `countries/nz/kayit/sistemler.ts`. |

The prescription counts are stored in `countries/nz/referans/ust20.json` and are not shown on the tool. Dollar subsidy amounts from the Schedule are not stored.

## What the second pass opened and did not copy

| Source | Why it is not a screen |
| --- | --- |
| Ministry of Health, “Schedule of notifiable diseases – Updated February 2025”, PDF dated 14 February 2025, https://www.health.govt.nz/system/files/2025-02/schedule-of-notifiable-diseases-updated-feb25.pdf | The file was downloaded on 14 October 2026. It is two pages. It lists 13 diseases in section A, 39 in section B, 4 in section C, and 6 other conditions. The Ministry copyright page that loaded the same day (https://www.health.govt.nz/about-this-site/copyright) does not grant a licence to copy the text. It was not copied. |
| Health Act 1956, Schedules 1 and 2, https://www.legislation.govt.nz/act/public/1956/0065/latest/DLM308729.html and https://www.legislation.govt.nz/act/public/1956/0065/latest/DLM308746.html | Those pages returned a robot check on 14 October 2026, so the statutory lists were not read in full. The PDF above does not show Schedule 2 section A (conditions arising from occupation). Those names were not invented. |
| National Immunisation Schedule | Still not loaded. The copyright address opened on the first pass did not come back as a licence. A Creative Commons notice on a different Health New Zealand publication is not a licence for this schedule. |
| Interaction pairs, diagnosis codes, laboratory ranges | `countries/nz/kayit/etkilesim.ts` stores no pair and names a commercial contract. The New Zealand Formulary was not copied. `countries/nz/kayit/tani.ts` stores no code. The path is an ICD-10-AM licence, a SNOMED CT licence, or a WHO ICD-10 licence. `countries/nz/kayit/laboratuvar.ts` restates the units already in the pack. No panel and no numeric range. |

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
- Clinician: the controlled-drug ticks are regulation 29 only. A tick is a record. Nothing is sent. The six later ticks apply only in the case each label names.
- Clinician: the immunisation page was read (6 weeks, 3 months, 5 months, 12 months, 15 months, 4 years, and the adult ages the page lists) and was not turned into ticks, because the copyright page did not come back as a licence.
- Lawyer: the February 2025 notifiable-disease PDF was read and not copied. The Ministry copyright page that loaded does not grant a text licence. The Act schedule pages did not load.
- Not loaded: interaction pairs, a SNOMED or ICD-10-AM table, a notifiable-disease list on a screen, an immunisation calendar, dosing, NHI, Hira, and any live API.
