# Uzbekistan — medical depth against the Turkish product

Read on 14 October 2026. This file is the gap record for the Uzbekistan pack (`countries/uz`). It does not change Turkish files. Nothing here is a live connection.

Turkish depth this pass is measured against the SGK medicine list, the national vaccination calendar, e-Nabız / e-Reçete / MEDULA, and the interaction and laboratory tools. Those Turkish files were not edited. Counts below are what this pack now holds, not a claim that the Turkish product was copied.

## What is on a screen

| Tool | Rows | Source | Licence reading |
| --- | --- | --- | --- |
| `uz-asosiy-dorilar` | 502 annex rows | Minister of Health order No. 34 of 21 August 2023, Ministry of Justice registration No. 3455, annex. https://lex.uz/docs/-6590070 | Machine reading of Law OʻRQ-42 of 20 July 2006, articles 5 and 8: an official document is not an object of copyright. Not a lawyer's opinion. Unsigned. |
| `uz-retsept-qaydi` | the same 502 names, plus a quantity and directions the doctor types | The annex, for the name, form, and strength. The note is the product's own. | Same reading. The note is not sent and is not the pink narcotic form. |
| `uz-giyohvand-qoidalari` | 9 ticks | Order No. 3604 of 27 January 2025, paragraphs 33, 34, 36, and 37. https://lex.uz/uz/docs/-7349574 | Same reading. Other annexes of the order were not opened. The screen is not the pink blank and is not sent. |
| `uz-emlash-taqvimi` | 11 ages | Sanitary-service flyer `Calendar_new_a5_flyer_uzb.pdf`, opened 14 October 2026. No issue date on the page. | The flyer carries no licence notice. Same copyright-law reading. Paediatrics and family medicine only. |

The 502 rows are the essential-medicines annex in annex order. They are not a count of prescriptions and they are not brands from the State Register. Cyrillic and Russian spellings are a machine rendering of the annex's Latin spelling.

The flyer states no catch-up rule, no dose interval, and no sex on the 9–13 year row. Presidential resolution PQ-402 of 22 November 2024 tells the ministry to review the calendar; the re-approved text was not opened. The shared slots `asi-takvimi` and `aile-asi-tarama` stay empty for that reason. The older record tool `uz-emlash-qaydi` still holds no calendar.

## Still empty, and why

| Gap | What was opened | Block |
| --- | --- | --- |
| Diagnosis codes | No national code table. | World Health Organization ICD-10 is copyrighted and is not stored. Path: ask the Ministry of Health which edition is in force, or obtain a licence from the World Health Organization. `countries/uz/kayit/tani.ts` holds no rows. Slot `tani-kodlama` stays off. |
| Notifiable diseases | Orders that were opened are not the national list (including order 537 of 24 July 2017 and prison medical rules). | No complete national list was found. Slot `enfeksiyon-bildirim` stays off. |
| Drug interactions | No free licensed pair list. | `countries/uz/kayit/etkilesim.ts` is an unconnected adapter: `bagli: false`, no pairs. First Databank, Medscape, or the British National Formulary each need their own contract. No monograph is copied. Slot `ilac-etkilesimi` stays off. |
| Most-prescribed ranking of 250 | The annex is an essential list, not a volume ranking. The reimbursed outpatient list (order No. 18 of 23 April 2026, 69 rows, in force 1 January 2027) was not loaded. | State Register is open to consult and no reuse licence was found. Brands were not copied. |
| Laboratory panels and ranges | Units already in `countries/uz/uygulama/araclar/birimler.ts` (ANC, CARD, JIA, PSA). Serum creatinine was not found in a national text. | `countries/uz/kayit/laboratuvar.ts` stores no panel and no reference range. Slot `tetkik-istek` stays off. |
| Ordinary prescription blank | Paragraphs 33, 34, 36, and 37 of order 3604 only. | The ordinary blank, the psychotropic annex, and transmission are not in the product. Slot `recete` stays off. |

## Registration — not started

`countries/uz/kayit/sistemler.ts`. Both records have `bagli: false`. This product makes no call.

| Service | Page read | What the page actually says | What it does not say |
| --- | --- | --- | --- |
| DMED | https://dmed.uz/ on 14 October 2026 | Single operator of digital health, on the basis of Presidential Decree No. 415. It digitises state and private clinics and electronic prescriptions. Developers are offered an API, integrations, and access to data. | A registration form, a conformance test, or a contract. Marketing counts on the homepage are not repeated as this product's figures. |
| my.gov.uz | https://my.gov.uz/ on 14 October 2026 | The single portal of state services. | An electronic-prescription module, in the HTML that was saved. No third-party registration steps. |

A local FHIR R4 draft (`countries/uz/kayit/fhirTaslak.ts`) can build one MedicationRequest with status `draft`. It is not submitted. It carries no identifier of a person.

## Clinician and lawyer

Every new tool is on `countries/uz/uygulama/araclar/kendi/onay.ts` and has no clinician's name.

- Lawyer: confirm that storing the essential-medicines annex, the flyer rows, and the four narcotic paragraphs is allowed in a commercial product. The tools say the copyright reading is a machine's, not a lawyer's.
- Pharmacist: confirm the machine spellings of the 502 rows before a doctor relies on them.
- Paediatrician: confirm the flyer is the calendar in force. It has no issue date.
- Not loaded: State Register brands, interaction pairs, a diagnosis-code table, catch-up and adult immunisation rows, a notifiable list, dosing chosen by the tool, reference ranges, and any live API.
