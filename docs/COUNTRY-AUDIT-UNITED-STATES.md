# Country audit: United States (`us`)

Audit of the country pack `countries/us/` against the standards of the United States (NOTYA-ULKE-DENETIM-US, 2026-10-09). Branch `audit/us`, from `feat/ulke-butun` at `d7bc33a0`. The pack's own record is `docs/COUNTRY-PACK-UNITED-STATES.md`; this document is the audit's.

**What this audit is and is not.** A machine read official pages on 2026-10-09 and compared them with the pack, the kit and the screens of a local build. Every standard below carries the page it was read on. Where no official page could be read, the line says **UNVERIFIED** and what was found instead. Nobody of the United States — no clinician, no lawyer, no native editor — has read the pack or this document. Nothing here says the product meets any law or standard; every legal matter is a question for a lawyer.

**What was changed.** Only files under `countries/us/`, this pack's regenerated record, this document and the images under `docs/audit/us/`. Nothing in the kit (`lib/ulke/`, `components/ulke/`, `app/`), nothing in the shared English set (`countries/_dil/`), no other country, no Turkish file. Nothing was merged or deployed and no remote system was touched.

## Summary

| Verdict | Items |
|---|---|
| CONFORMS | 20 of the 48 rows of Part B (3 of them only since this audit's fixes) |
| DIFFERS — fixed in the country folder | 3 (counted above as conforming now) |
| DIFFERS — cannot be fixed in the country folder (kit or shared set) | 8 |
| NOT HANDLED BY THE PRODUCT | 10 |
| NEEDS A LOCAL PERSON (a clinician or a lawyer) | 10 |

The five things that matter most are at the top of "Core" below: a typed comma is read as a decimal point, the date-of-birth and time fields follow the browser instead of the pack, the time-zone list shows technical names, a patient has one name field, and height cannot be typed in feet and inches.

## Part A — the standards sheet

Each line: the standard, then where it was read. All pages were read on 2026-10-09.

### Dates, times, numbers, money

- **A1. Written date, everyday.** Month, day, year, with the month spelled out and no ordinal: "June 29, 1985 (not June 29th, 1985)". Source: U.S. Government Publishing Office Style Manual, rule 12.9c — https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016-14.pdf
- **A2. Numeric date, in health administration.** Month, day, year. Medicare's claim form asks every date of birth as an 8-digit "MM | DD | CCYY" and other dates as "MM | DD | YY" or "MM | DD | CCYY". Source: Medicare Claims Processing Manual, chapter 26 — https://www.hhs.gov/guidance/sites/default/files/hhs-guidance-documents/CMS/clm104c26.pdf . The separator is not fixed by that source (the form has boxes). The slash is what the Unicode locale data for `en-US` writes (`10/9/2026`, read from the platform: Node 22, `Intl.DateTimeFormat('en-US')`). **UNVERIFIED from a government source: the slash, and leading zeros.**
- **A3. Clock, everyday.** 12-hour with a.m. and p.m.: "4:30 p.m."; noon and midnight "12 p.m. (12 noon)", "12 a.m. (12 midnight)". The 24-hour form ("0025, 2359") is named "astronomical and military time". Source: same manual, rule 12.9b.
- **A4. Clock, in clinical documentation.** No national format. The federal rule for hospital records asks that entries be "legible, complete, dated, timed, and authenticated … consistent with hospital policies and procedures". Source: 42 CFR 482.24(c)(1) — https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482/subpart-C/section-482.24 . **UNVERIFIED: how many hospitals chart in 24-hour time. A local clinician decides which clock a clinic's screens should show.**
- **A5. First day of the week.** Sunday. Source: the Unicode locale data for the United States as the platform holds it (`new Intl.Locale('en-US').getWeekInfo()` → `firstDay: 7`). **UNVERIFIED from a government source: no law or federal standard states it.**
- **A6. Decimal and thousands separators.** A point for decimals, with a zero before it ("0.25 inch"); a comma "in a number containing four or more digits" ("$1,270,000"). Sources: GPO Style Manual, rules 12.9d and 12.14 (link above); NIST Special Publication 811, 10.5.2 ("the dot on the line") — https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-10-more-printing-and-using-symbols-and-numbers . NIST 10.5.3 asks scientific writing to group digits with a thin space instead of a comma, because a comma is a decimal sign elsewhere: a comma in a number typed by an American is never a decimal point.
- **A7. Currency.** The dollar sign before the number, no space, two decimals for cents, none for whole dollars: "$3.65; $0.75; 75 cents"; "$3 (not $3.00)". Source: GPO Style Manual, rule 12.9k. **UNVERIFIED from an official source: the code "USD" (ISO 4217 was not read).**

### Time zones

- **A8. How many.** Nine, by law: "Atlantic, eastern, central, mountain, Pacific, Alaska, Hawaii–Aleutian, Samoa, and Chamorro". The Department of Transportation oversees them. Sources: https://www.transportation.gov/regulations/time-act ; 49 CFR part 71 — https://www.ecfr.gov/current/title-49/subtitle-A/part-71 . The Hawaii–Aleutian zone holds Hawaii and "that part of the Aleutian Islands that is west of 169 degrees 30 minutes west longitude" (49 CFR 71.12).
- **A9. Daylight saving.** From 2 a.m. on the second Sunday of March to 2 a.m. on the first Sunday of November; a state may exempt itself by law. Source: 15 U.S.C. 260a — https://www.law.cornell.edu/uscode/text/15/260a . "Daylight Saving Time is not observed in Hawaii, American Samoa, Guam, Northern Mariana Islands, Puerto Rico, and the Virgin Islands, and most of Arizona." Source: https://www.transportation.gov/regulations/daylight-saving-time . So the fifty states and the District keep eight different clocks: Eastern, Central, Mountain, Arizona, Pacific, Alaska, the western Aleutians (Hawaii–Aleutian time with daylight saving), Hawaii.
- **A10. How an appointment time should be shown.** No national standard was found. **NEEDS A LOCAL PERSON:** the usual practice is the clinic's local time, with the zone named when the reader may be somewhere else.

### Units

- **A11. Body weight, height, temperature — everyday.** U.S. customary units: the federal health agency's own calculator for the public offers "US Customary Units": height in "feet (ft)" and "inches (in)", weight in "pounds (lbs)", beside metric. Source: https://www.cdc.gov/bmi/adult-calculator/index.html . **UNVERIFIED from an official source: degrees Fahrenheit for body temperature in everyday use** (general knowledge only).
- **A12. Body weight — in clinical records.** Kilograms. The Emergency Nurses Association: "Patient weights are measured, recorded, communicated, and documented in the health record using kilograms only", naming the Institute for Safe Medication Practices, the Joint Commission and others as asking the same. Source: https://www.ena.org/sites/default/files/2025-08/Weighing%20All%20Patients%20in%20Kilograms%20Position%20Statement.pdf . This is a professional body's position, not a law. The federal data standard for exchange requires a unit code with every vital sign and fixes none (USCDI, vital signs: LOINC and UCUM "both standards are required") — https://isp.healthit.gov/uscdi-data-class/vital-signs
- **A13. Laboratory units** (conventional units, not SI):
  - glucose: mg/dL — https://www.cdc.gov/diabetes/diabetes-testing/index.html
  - creatinine: mg/dL ("standardized serum creatinine in mg/dL"); estimated GFR: mL/min/1.73 m² — https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults
  - hemoglobin: "grams per deciliter (g/dL)" — https://medlineplus.gov/ency/article/003645.htm
  - cholesterol: "milligrams per deciliter (mg/dL)" — https://www.cdc.gov/cholesterol/about/index.html
  - urine albumin-to-creatinine ratio: mg/g — https://www.niddk.nih.gov/health-information/professionals/advanced-search/quick-reference-uacr-gfr
  - prostate-specific antigen: ng/mL — https://www.cancer.gov/types/prostate/psa-fact-sheet
  - C-reactive protein: the National Library of Medicine's page for patients states results in mg/dL — https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/ . Laboratories also report mg/L: **UNVERIFIED which is more common.**
  - erythrocyte sedimentation rate (mm/h), hearing thresholds (dB), visual acuity written as a fraction of 20 feet ("20/40"): **UNVERIFIED — no official page was read.**
- **A14. Blood pressure.** Systolic over diastolic in millimetres of mercury, written "120/80 mm Hg". Source: https://www.cdc.gov/high-blood-pressure/about/index.html

### Numbers a patient-facing notice may name

- **A15. Emergencies.** 911: "In an emergency, dial 911 from your phone immediately." Source: the National 911 Program (National Highway Traffic Safety Administration) — https://www.911.gov/calling-911/
- **A16. Other numbers.** 988, "the three-digit, nationwide phone number to connect directly to the 988 Suicide and Crisis Lifeline", by call or text, since July 16, 2022 — https://www.fcc.gov/988-suicide-and-crisis-lifeline . Poison Help, 1-800-222-1222, which "connects you to your local poison center" — https://poisonhelp.hrsa.gov/

### Identity, names, addresses, phones, paper

- **A17. National patient identifier.** There is none. What exists: a **medical record number** given by each provider (the privacy rule lists "Medical record numbers" among identifiers, beside "Social security numbers" and "Health plan beneficiary numbers": 45 CFR 164.514(b)(2)(i)(G) to (I) — https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.514 ); and, for people on Medicare only, the **Medicare Beneficiary Identifier**: 11 characters, randomly generated, unlike the older number "based on the Social Security Numbers" — https://www.cms.gov/medicare/new-medicare-card/understanding-the-mbi.pdf . **UNVERIFIED from a primary source:** that Congress bars federal spending on a national patient identifier (only trade-body pages were found).
- **A18. What must never be collected.** The Social Security number. The Social Security Administration: "You should be careful about sharing your number, even when you're asked for it"; ask "why your number is needed, how it'll be used, and what will happen if you refuse" — https://www.ssa.gov/pubs/EN-05-10064.pdf . Whether a private product may ask for one at all, and for an insurance member number, is a question for a lawyer (L1).
- **A19. Name order and fields.** Given name first, family name last. The federal data standard has separate elements: First Name, Last Name, Middle Name (including middle initial), Name Suffix, Previous Name — https://isp.healthit.gov/uscdi-data-class/patient-demographicsinformation
- **A20. Telephone.** Country code 1 (the North American Numbering Plan, shared by 20 countries). Ten digits, written NXX-NXX-XXXX: a three-digit area code and a seven-digit number, the first digit of each part 2 to 9 — https://www.nanpa.com/about . 555-0100 to 555-0199 are "fictitious, non-working numbers" that "remain reserved for entertainment/advertising" — https://www.nanpa.com/numbering/555-line-numbers . Mobile and fixed numbers share the same area codes.
- **A21. Postal address.** Three lines: recipient, delivery address, last line; the last line holds city, state and the **ZIP Code** (five digits, or ZIP+4). Source: U.S. Postal Service Publication 28 — https://pe.usps.com/text/pub28/28c2_001.htm . **Partly UNVERIFIED:** the page read names the three lines and ZIP+4; the layout of the last line is in its section 22, which was not read.
- **A22. Paper.** Letter, 8½ by 11 inches. Read in one federal rule: "The brief must be on 8 1/2 by 11 inch paper" (Federal Rules of Appellate Procedure, rule 32(a)(4)) — https://www.law.cornell.edu/rules/frap/rule_32 . **UNVERIFIED as a general federal standard:** no page stating it for all documents was read.

### The professions

- **A23. Seniority.** "Attending physician": "the single identifiable physician ultimately responsible and accountable for an individual patient's care"; below: fellow, resident. Source: the glossary of the Accreditation Council for Graduate Medical Education — https://www.acgme.org/globalassets/pdfs/ab_acgmeglossary.pdf . **UNVERIFIED: the degrees (MD, DO) and "board-certified" as titles — not read.**
- **A24. Specialty names.** Two official lists were read and they do not always agree:
  - the certificates of the 24 member boards of the American Board of Medical Specialties — https://www.abms.org/member-boards/specialty-subspecialty-certificates/
  - Medicare's list of provider specialties — https://cms.gov/Medicare/Provider-Enrollment-and-Certification/MedicareProviderSupEnroll/Downloads/taxonomy.pdf

  | Role key | Pack shows | Specialty boards | Medicare |
  |---|---|---|---|
  | `emergency-medicine` | Emergency medicine | Emergency Medicine | Emergency Medicine |
  | `family-medicine` | Family medicine | Family Medicine | Family Practice |
  | `anaesthesia` | Anesthesiology | Anesthesiology | Anesthesiology |
  | `neurosurgery` | Neurosurgery | Neurological Surgery | Neurosurgery |
  | `paediatric-surgery` | Pediatric surgery | Pediatric Surgery (subspecialty of Surgery) | — |
  | `internal-medicine` | Internal medicine | Internal Medicine | Internal Medicine (not re-read) |
  | `dermatology` | Dermatology | Dermatology | Dermatology (not re-read) |
  | `endocrinology` | Endocrinology | Endocrinology, Diabetes and Metabolism | Endocrinology |
  | `infectious-diseases` | Infectious disease | Infectious Disease | Infectious Disease |
  | `gastroenterology` | Gastroenterology | Gastroenterology | (not re-read) |
  | `general-surgery` | General surgery | General Surgery | (not re-read) |
  | `thoracic-surgery` | Thoracic surgery | Thoracic and Cardiac Surgery | Thoracic Surgery |
  | `respiratory-medicine` | **Pulmonary disease** (was Pulmonology) | Pulmonary Disease | Pulmonary Disease |
  | `ophthalmology` | Ophthalmology | Ophthalmology | (not re-read) |
  | `obstetrics-gynaecology` | Obstetrics and gynecology | Obstetrics and Gynecology | Obstetrics Gynecology |
  | `cardiovascular-surgery` | Cardiac and vascular surgery | Thoracic and Cardiac Surgery; Vascular Surgery (two certificates) | Cardiac Surgery; Vascular Surgery (two specialties) |
  | `cardiology` | Cardiology | Cardiovascular Disease | Cardiology |
  | `otolaryngology` | Otolaryngology (ENT) | Otolaryngology – Head and Neck Surgery | Otolaryngology |
  | `nephrology` | Nephrology | Nephrology | (not re-read) |
  | `neurology` | Neurology | Neurology | (not re-read) |
  | `oncology` | Oncology | Medical Oncology; Radiation Oncology; others | Medical Oncology; Hematology/Oncology; Surgical Oncology; Radiation Oncology |
  | `orthopaedics` | Orthopedic surgery | Orthopaedic Surgery (the board's own spelling) | Orthopedic Surgery |
  | `paediatrics` | Pediatrics | Pediatrics | Pediatric Medicine |
  | `plastic-surgery` | Plastic surgery | Plastic Surgery | Plastic and Reconstructive Surgery |
  | `psychiatry` | Psychiatry | Psychiatry | (not re-read) |
  | `radiology` | Radiology | the board is "Radiology"; the certificate is Diagnostic Radiology | Diagnostic Radiology; Interventional Radiology |
  | `rheumatology` | Rheumatology | Rheumatology | (not re-read) |
  | `urology` | Urology | Urology | (not re-read) |
  | `sports-medicine` | Sports medicine | Sports Medicine (a subspecialty certificate) | — |
  | `rehabilitation-medicine` | Physical medicine and rehabilitation | Physical Medicine and Rehabilitation | Physical Medicine and Rehabilitation |
  | `hair-transplant` | Hair transplantation | not a certificate of any member board | — |
  | `aesthetic-surgery` | Cosmetic surgery | not a certificate of any member board | — |
  | `aesthetic-medicine` | Aesthetic medicine | not a certificate of any member board | — |
  | `clinic-dermatology` | Dermatology (clinic) | Dermatology | Dermatology |
  | `longevity` | Preventive and longevity medicine | "Public Health and General Preventive Medicine"; no certificate named longevity | — |

- **A25. Allied professions.** Medicare's list: Physical Therapist, Occupational Therapist, Clinical Psychologist (and Psychologist), Audiologist, Registered Dietitian/Nutrition Professional (link above). The Bureau of Labor Statistics names the occupations Physical Therapists, Occupational Therapists, Audiologists, Dietitians and Nutritionists — https://www.bls.gov/ooh/healthcare/home.htm . Each is licensed by the states: **UNVERIFIED, no state board was read.**

### Clinical conventions

- **A26. Medicine names.** The official nonproprietary names are the United States Adopted Names, set by the USAN Council ("responsible for naming all generic drugs") — https://www.ama-assn.org/about/united-states-adopted-names . They sometimes differ from the international names used elsewhere: the Food and Drug Administration notes that acetaminophen is "commonly known as paracetamol" outside the United States — https://www.fda.gov/drugs/information-drug-class/acetaminophen . **UNVERIFIED from an official page:** who sits on the council, how a USAN relates to a WHO international name, and other well-known pairs (general knowledge only: albuterol / salbutamol, epinephrine / adrenaline). A naming convention only: the pack holds no medicine name and gets none from this audit.
- **A27. Triage in emergency departments.** The Emergency Severity Index, "a 5-level triage acuity scale". The emergency physicians' college and the emergency nurses' association "support the adoption of a scientifically validated triage scale, such as the Emergency Severity Index (ESI)" — https://www.ena.org/sites/default/files/2025-08/Emergency%20Department%20Triage.pdf . **The scale is copyrighted**: "Copyright © 2023 by Emergency Nurses Association … No part of the material protected by this copyright may be reproduced or utilized in any form, electronic or mechanical … without written permission from the copyright owner" (ESI Handbook, fifth edition) — https://media.emscimprovement.center/documents/Emergency_Severity_Index_Handbook.pdf
- **A28. Diagnosis coding.** ICD-10-CM, which the Centers for Disease Control and Prevention "develops and maintains"; new codes take effect each October 1. Inpatient procedures: ICD-10-PCS. Sources: https://www.cms.gov/medicare/coding-billing/icd-10-codes ; https://www.cdc.gov/nchs/icd/icd-10-cm/index.html . **UNVERIFIED: the outpatient procedure code set (CPT) and its licence — not read.**
- **A29. Age of consent to one's own treatment.** Set by each state, not federally: the privacy rule "does not address consent to treatment, nor does it preempt or change State or other laws" on it — https://www.hhs.gov/hipaa/for-professionals/faq/personal-representatives-and-minors/index.html . What varies: the age of majority (Nebraska: "All persons under nineteen years of age are declared to be minors" — https://nebraskalegislature.gov/laws/statutes.php?statute=43-2101 ); a lower age for consent to medical care in some states (Oregon: 15, ORS 109.640, read on a mirror of the statute — https://oregon.public.law/statutes/ors_109.640 ); and separate ages by kind of care (Nebraska: 18 for mental health services, same section). **UNVERIFIED: that 18 is the age in most states; Alabama (19) and Mississippi (21).**
- **A30. Spelling.** American. The official lists above spell Anesthesiology, Pediatrics, Gynecology, Hematology; Medicare writes "Orthopedic Surgery" while the specialty board keeps "Orthopaedic Surgery".
- **A31. Languages a patient-facing page may need.** English; Spanish is "the most common non-English language spoken in U.S. homes (62%)" of the 67.8 million people who spoke another language at home in 2019 — https://www.census.gov/library/stories/2022/12/languages-we-speak-in-united-states.html . Health programs that take federal money "must take reasonable steps to provide meaningful access to each individual with limited English proficiency", and where machine translation is used for critical text "the translation must be reviewed by a qualified human translator" — 45 CFR 92.201 — https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-92/subpart-C/section-92.201

### Questions for a lawyer

None is answered here. Each names the law or the regulator.

- **L1. Health-data privacy; what a vendor needs before real patient data.** The HIPAA rules (45 CFR parts 160 and 164; Office for Civil Rights, Department of Health and Human Services). A "business associate" is one who creates, receives, maintains or transmits protected health information for a covered entity; the rules "permit a covered entity to disclose PHI to a business associate if the covered entity obtains satisfactory assurances, in the form of a contract" — https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html . A cloud provider holding such data "is a business associate under HIPAA" even if it cannot read it — https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html . *Questions:* Is Notya a business associate of each clinic, and from which moment? Which agreements must exist — with each clinic, and with the database host, the speech-recognition provider and the model provider — before the first real patient? What do the security and breach-notification duties require of a company that is not yet formed in the United States? Where a user is not a covered entity, does the Federal Trade Commission's Health Breach Notification Rule (16 CFR part 318 — https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule ) apply instead? Which state laws add to this (a state-by-state answer)? May the patient form hold an identifier at all, and which?
- **L2. Recording a consultation.** Federal law allows a recording "where one of the parties to the communication has given prior consent" (18 U.S.C. 2511(2)(d) — https://www.law.cornell.edu/uscode/text/18/2511 ). Some states require everyone's consent: California Penal Code 632 was to be read at https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632 and **could not be fetched (UNVERIFIED)**. *Questions:* In which states must every person in the room agree, and how must that be recorded? Is the doctor's tick beside the pack's sentence enough anywhere? What about a visit by video where the patient is in another state, and a parent or companion in the room? How long may the audio be kept?
- **L3. Medical-device rules.** Food and Drug Administration; section 520(o)(1)(E) of the Federal Food, Drug, and Cosmetic Act (the "Non-Device CDS criteria"), final guidance "Clinical Decision Support Software", issued January 2026 — https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software . *Questions:* Do the calculating tools (the KDIGO categories, DAS28, the PSA rate, expected height, the triage record) meet the four criteria, each one? Does drafting a note from a recording fall outside the device definition, and does that change if the draft proposes an assessment or a plan? What must the screens say, and not say, to stay there?
- **L4. Where data may be stored.** HIPAA has "no requirements specific to offshore storage" (cloud guidance above). State law can differ: Florida requires that patient information held with certified electronic health record technology be "physically maintained in the continental United States or its territories or Canada" (Florida Statutes 408.051(3) — http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0408/Sections/0408.051.html ); Texas Senate Bill 1188 (2025) requires records stored on or after January 1, 2026 to be "physically maintained in the United States or a U.S. territory", and asks a practitioner who uses artificial intelligence for diagnostic purposes to review what it creates and to tell patients (read in the bill analysis, not the enrolled text — https://capitol.texas.gov/tlodocs/89R/analysis/html/SB01188H.htm ). *Questions:* Do these reach Notya or only its customers? In which region must the country's database, the audio and the model calls sit? Does the Texas disclosure duty apply to a drafted note?
- **L5. Advertising.** Federal Trade Commission Act, sections 5 and 12: health claims "require substantiation in the form of competent and reliable scientific evidence" (staff guidance, not law — https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance ). *Questions:* Which claims about time saved, accuracy or safety may the landing page make, with what evidence? May it name a specialty that is not a board certificate (cosmetic surgery, hair transplantation, longevity) without implying certification, under state medical-board rules? What do the rules on marketing e-mail and on calls or texts to patients require (not read: **UNVERIFIED**)?
- **L6. Minors.** State law (A29). *Questions:* At what age, state by state, is the guardian wording wrong? May a parent's intake form ask what it asks? When may a parent NOT see a minor's page (services a minor may consent to alone)? The Texas bill above gives a parent "complete and unrestricted access" on request: how does that sit with the portal?
- **L7. Third-party scales and classifications in the tools.** The Emergency Severity Index is under copyright (A27). *Questions:* Does the triage tool, which is switched on in this pack, need the owner's written permission or a licence? The same question for each named instrument a tool carries (the report outline's assessment categories, the KDIGO grid, the published scores).
- **L8. Language access.** 45 CFR 92.201 (A31). *Question:* does a patient page offered only in English expose a clinic that takes federal money, and must a Spanish text be read by a qualified translator before use?

## Part B — what the product does today

Pack lines are those of `countries/us/` after this audit's commit. "Kit" is `lib/ulke/` and `components/ulke/`, read only.

**How the kit writes and reads these things.** A day is written and read by the **pack's pattern** (`bicim.tarihDeseni`; `lib/ulke/uygulama/zaman.ts`: `gunYazDesenle`, `gunCoz`), digits only, never through `Intl`. A time of day is written 24-hour or, where the pack says 12, through `Intl.DateTimeFormat(<pack locale>, { hour12: true })` (`lib/ulke/arayuz/bicim.ts`). Weeks start on the pack's day (`haftaninIlkGunu`). A number is written with the pack's two separators (`lib/ulke/arayuz/sayi.ts`); the currency sign is text of the pack. Units of length, weight and temperature are one pack setting (`uygulama.birimler`) used by tools and the intake form alike; a laboratory unit is the pack's (`araclar.labBirimleri`). **Fixed in the kit, whatever the pack says:** the native date field (`<input type="date">`: date of birth, dates in tools and in the intake form) and the native time field (`<input type="time">`) follow the **browser's** locale; a typed comma is turned into a decimal point; the time-zone list prints the technical zone name; a patient has one name field; the phone rule of the pack is never called.

| # | Item | The pack says | The kit renders or accepts | Verdict |
|---|---|---|---|---|
| 1 | Date order, shown | `index.ts:53` `MM/DD/YYYY`; `ayarlar.ts:56` | every day on a screen by the pattern: `10/09/2026` | **CONFORMS** (A2) |
| 2 | Date order, typed (appointments) | same; example `MM/DD/YYYY` | text field read by the pattern; `13/01/2026` and a two-digit year refused | **CONFORMS** |
| 3 | Date fields (birth date, tool dates, intake dates) | — | native date field: the browser's order, not the pack's | **DIFFERS — core** (right on a browser set to U.S. English, another order on any other) |
| 4 | Long date ("October 9, 2026") | — | never written; digits only | **NOT HANDLED** |
| 5 | Clock, everyday | `index.ts:119` `saatBicimi: 12` | `2:30 PM` from the platform's `en-US` data | **CONFORMS** (A3; capitals without points, the locale data's form) |
| 6 | Clock, clinical | one setting for all screens | — | **NEEDS A LOCAL PERSON** (A4) |
| 7 | Time fields (booking, working hours) | — | native time field: the browser's clock | **DIFFERS — core** (same reason as 3) |
| 8 | First day of the week | `index.ts:53` `haftaBasi: 7` | week view and week arithmetic start on Sunday | **CONFORMS** (A5) |
| 9 | Decimal and thousands, written | `index.ts:53` `.` and `,` | `1,234,567.50` | **CONFORMS** (A6) |
| 10 | A number typed with a comma | — | `lib/ulke/araclar/girdi.ts:35` and `components/ulke/portal/HastaFormu.tsx:64` turn the first comma into a point: "1,250" is read as 1.25 | **DIFFERS — core, clinical safety** |
| 11 | Currency | `index.ts:44` USD, `$`, 2; `ayarlar.ts:118` `$% a month` | not shown: every plan is by quote | **CONFORMS** (A7); a whole amount would be written `$49.00`, which rule 12.9k writes `$49` — for the owner when prices exist |
| 12 | Time zones offered | `index.ts:115`: eight zones (seven before this audit) | an account chooses one in settings | **CONFORMS since the fix** for the fifty states (A8, A9); was DIFFERS |
| 13 | Territories (Puerto Rico, Guam, …) | not listed, by a comment | — | **NOT HANDLED** — the owner decides whether the pack serves them |
| 14 | Names in the time-zone list | — | `components/ulke/uygulama/Ayarlar.tsx:85` prints the zone id: "America/New York", "America/Adak" | **DIFFERS — core** (the law's names are Eastern, Central, Mountain, Pacific, Alaska, Hawaii–Aleutian) |
| 15 | Appointment times and the zone | `ayarlar.ts:55` "Times are shown in the time zone set for your account." | calendar in the account's zone; the patient's page says "Times are shown in your doctor's time zone: America/New York." | **NEEDS A LOCAL PERSON** for the wording (A10); the zone id on a patient's page is the same core finding as 14 |
| 16 | Weight, height, temperature — what a patient types | `ayarlar.ts:38` lb, in, °F | intake form asks in these units, each named | **CONFORMS** (A11) |
| 17 | Height as feet and inches | — | one number in inches only | **DIFFERS — core** (A11: the public states height in feet and inches) |
| 18 | Weight in a clinician's tool | same single setting; weight-based dose arithmetic kept off (`ayarlar.ts:101`) | no live tool takes a weight (held by test) | **NEEDS A LOCAL PERSON** (A12); the kit has one unit setting for patients and clinicians |
| 19 | Glucose, creatinine, hemoglobin, cholesterol | `ayarlar.ts:99` mg/dL, mg/dL, g/dL, mg/dL | no live tool reads one today; the kit would take them unconverted | **CONFORMS** (A13) |
| 20 | Albumin-to-creatinine ratio; estimated GFR | `ayarlar.ts:99` mg/g | KDIGO tools show "mg/g" and "mL/min/1.73 m²" | **CONFORMS** (A13) |
| 21 | PSA | kit's own unit | "ng/mL" | **CONFORMS** (A13) |
| 22 | C-reactive protein in DAS28 | `ayarlar.ts:108`: the label says mg/L and how to convert from mg/dL | field in mg/L | **CONFORMS** (A13), wording for a clinician |
| 23 | ESR (mm/h), hearing (dB), visual acuity | kit's own | shown as such; acuity takes "a decimal acuity or a Snellen fraction" | **NEEDS A LOCAL PERSON** (unverified, A13) |
| 24 | Blood pressure notation | — | a free-text line of the note ("figures as stated"); no field, no unit | **NOT HANDLED** |
| 25 | Emergency number | `index.ts:106` `911` | on the patient's page as a setting, never in a sentence | **CONFORMS** (A15) |
| 26 | The sentence around it | shared set: "If you are very unwell, call an ambulance: %." | "… call an ambulance: 911." | **DIFFERS — shared English set** (here one says "call 911"; the number also reaches police and fire) |
| 27 | 988, Poison Help | — | the kit has room for one number | **NOT HANDLED** (A16) |
| 28 | Patient identifier | `index.ts:59`, `ayarlar.ts:53`: "Patient identifier", optional, free text, encrypted, never validated | one optional field | **CONFORMS** (A17: there is no national number and the label names none). A local lead may prefer "Medical record number (MRN)" |
| 29 | Identifier field keyboard | — | `components/ulke/uygulama/Hastalar.tsx:145` asks phones for a digits-only keyboard | **DIFFERS — core** (a record number may hold letters) |
| 30 | Social Security number | never asked; a test fails if any text mentions it | — | **CONFORMS** (A18) |
| 31 | Name fields | `index.ts:121` no second field | one field, "Full name" | **DIFFERS — core** (A19: first, middle, last, suffix; no sorting by family name) |
| 32 | Phone: code, length, example | `index.ts:55` `+1`, 10, `202-555-0123` (was `+1 202 555 0123`) | the example is the placeholder on the patient form and the request form | **CONFORMS since the fix** (A20) |
| 33 | Phone: checking what is typed | `index.ts:25` rule: NXX-NXX-XXXX with or without 1 | the kit never calls the pack's rule: any text is stored | **NOT HANDLED** |
| 34 | Postal address | — | no address is collected | **NOT HANDLED** (A21) |
| 35 | Paper size | — | no print view; no page size set | **NOT HANDLED** (A22) |
| 36 | Senior doctor's title | `ayarlar.ts:61` "attending physician" | first line of each doctor role's instruction to the model | **CONFORMS** (A23) |
| 37 | 27 specialty names that are on a list | `ayarlar.ts:69` and the set's names in American spelling | role list, instructions | **CONFORMS** (A24) — "Pulmonary disease" **since the fix** |
| 38 | Oncology; Radiology; Cardiac and vascular surgery | the set's names | — | **NEEDS A LOCAL PERSON** (A24: each covers two or more official specialties) |
| 39 | The five clinic roles | the set's names | — | **NEEDS A LOCAL PERSON** and L5 (four are no board certificate) |
| 40 | Allied professions | "Physical therapist" (pack); the set's four | — | **CONFORMS** (A25) |
| 41 | Medicine names | none | none: every tool that needs them is an empty slot | **NOT HANDLED**, by design (Part E) |
| 42 | Triage scale | ESI record switched on | tool on the emergency role's grid | **NEEDS A LOCAL PERSON**: the right scale for this country (A27), but its owner reserves all rights — a lawyer on the licence (L7) |
| 43 | Diagnosis coding | none | no code anywhere | **NOT HANDLED** (A28) |
| 44 | Guardian age | `ayarlar.ts:30` 18, marked for a lawyer | guardian wording and the guardian form below 18 | **NEEDS A LOCAL PERSON** (A29, L6): defensible as a starting value, wrong in some states |
| 45 | Recording-consent sentence | `ayarlar.ts:50`, marked not read by a lawyer | beside the box that unlocks recording | **NEEDS A LOCAL PERSON** (L2) |
| 46 | Spelling | `en-US` through the set's table | a test finds no other form's spelling in 1,996 texts | **CONFORMS** by machine (A30); **NEEDS A LOCAL PERSON** — no native editor has read it |
| 47 | Patient languages | `index.ts:93` English only | — | **NOT HANDLED** (A31): Spanish waits on the owner |
| 48 | Working hours, slot lengths, link validity | `index.ts` 09:00–17:00, 30 min; 30 days | — | **NEEDS A LOCAL PERSON** / the owner: no standard exists |

Settings checked for sense: the country is rightly marked as having several time zones; the identifier label names no national number, rightly; the guardian age is marked for a lawyer, rightly; the default zone (Eastern) is a product choice.

## Part C — what was seen on real screens

**It was run, once, on the pack as fixed** (commit `ccfe76c1`). `NOTYA_COUNTRY=us npm run build:ulke` built it on this machine (exit code 0; build proof: "us" pack present, no other country's pack). The built application was started on local ports against the repository's stand-ins for the database, the speech provider and the model; nothing outside this machine was contacted and no account was created anywhere else. The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`) passed **329 of 329** checks. Then a script of this audit drove the installed Chromium (browser language U.S. English, time zone Eastern) through the same running application, signed in with two of the stand-in's own accounts as a pediatrician and as a nephrologist, and took the pictures. Each picture below was opened and read.

**Not seen:** the screens BEFORE the fixes. A first build, of the unfixed pack, was killed for lack of memory while other countries' builds ran on the same machine; the "before" values in Part D are read from the source, not from a screen. Also not seen: any screen in a browser set to another language (so finding 2 of "Core" is read from the code, not seen); a phone's keyboard on the identifier field; the patient's form while it is being filled in (the picture is of the answers after sending); a printed page (there is none).

| Image (`docs/audit/us/`) | What is on it | Against Part A |
|---|---|---|
| `us-01-landing.jpg` | The landing page: "A clinical assistant for doctors", "Request a quote", "Note templates for 40 specialties and professions", "In English". No price, no claim, no logo of any body. | American spelling. Nothing to compare for money: no amount is shown. |
| (seen, not saved) the request form | "Clinic or organization"; the phone field's example reads **202-555-0123**. | A20: the national form, since the fix. A30: "organization". |
| `us-02-sign-up.jpg` | "Create an account with an invitation code"; fields: invitation code, full name, email address, password twice. | Asks no identifier, no phone, no address. One name field (A19). |
| `us-03-settings-time-zone.jpg` | Time zone: a list whose shown value is "**America/New York**"; the eight entries read America/New York, America/Chicago, America/Denver, America/Phoenix, America/Los Angeles, America/Anchorage, America/Adak, Pacific/Honolulu. Specialty: "Pediatrics". | A8: the eight clocks of the fifty states are there, since the fix. **Differs:** the names are technical ids, not Eastern, Central, Mountain, Pacific, Alaska, Hawaii–Aleutian (core 3). |
| `us-04-new-patient.jpg` | "Full name"; "Date of birth" in the browser's own date field, showing **03/07/2021** for March 7, 2021; "Phone number" taking "(202) 555-0123" as typed; "Sex: Female / Male"; "Patient identifier (optional)" taking "MRN-00417". | A2: month first — because this browser is set to U.S. English (core 2). A17: no national number asked; letters accepted on a desktop. A19: one name field. |
| (seen, not saved) the patient file | "Date of birth 03/07/2021", "Age 5", "Phone number (202) 555-0123", "Patient identifier MRN-00417". | A2 conforms; the phone is stored and shown exactly as typed (no rule applied). |
| `us-05-booking-form.jpg` | "Date" as text **10/12/2026**; "Time" in the browser's own time field showing "02:30 PM"; "Length 30 min"; "Times are shown in the time zone set for your account." | A2, A3 conform — the time field again by the browser, not the pack. |
| `us-06-calendar-week.jpg` | The week runs **Sun · 10/11** to **Sat · 10/17**; the appointment on Mon · 10/12 reads "2:30 PM … Booked". | A5: Sunday first. A3: 12-hour. Month before day. |
| `us-07-calendar-day.jpg` | "**Monday, 10/12/2026**"; slots "9:00 AM" to "4:30 PM"; "12:00 PM–1:00 PM Break"; "2:30 PM–3:00 PM QA-AUDIT Child Patient · Booked". | A2, A3 conform. Noon is written "12:00 PM", the form the style manual gives. |
| `us-08-visit-note.jpg` | "Visit note · **10/09/2026 8:55 PM**"; template "Emergency medicine"; "This note was drafted by artificial intelligence. Read it and correct it where needed before you approve it."; sections History and presenting complaint, Examination, Assessment, Plan; "Vital signs (figures as stated)" is a free-text box. | A2, A3 conform. A14: no blood-pressure field and no unit — whatever was said is written as said. No diagnosis code (A28). |
| `us-09-tool-expected-height.jpg` | "Mother's height (in)", "Father's height (in)", "Accepted range: 51.2 to 90.5"; with 64 and 70 for a boy: "Expected height **69.6 in**", range 66.2 in to 72.9 in. | A11: inches, named on every number; the result is the one worked by hand in the pack's test. Feet and inches are not possible (core 5). |
| `us-10-tool-kdigo-grid.jpg` | "Estimated GFR (mL/min/1.73 m²)", "Urine albumin-to-creatinine ratio (optional) (mg/g)", "Accepted range: 0 to **10,000**"; with 52.5 and 120: the categories with "mg/g". The page calls itself "A decision-support tool: diagnosis and treatment are the doctor's." | A13 conforms. A6: the screen itself writes ten thousand with a comma — and the same field reads a typed "1,250" as 1.25 (core 1). The words "decision-support tool" belong to question L3. |
| `us-11-patient-page.jpg` | The patient's page on a phone: "Your appointments · 2:30 PM · **Saturday, 10/10/2026** · 10 min"; "Times are shown in your doctor's time zone: **America/New York**."; day buttons "Sat 10/10", "Sun 10/11" …; at the foot: "This page is not for emergencies. If you are very unwell, **call an ambulance: 911**." | A2, A3, A15 conform. **Differs:** the zone's technical id on a patient's page (core 3); the sentence around the number (shared set 1). |
| `us-12-intake-form-answers.jpg` | The guardian's answers after sending, on a phone: "You sent the form on **10/09/2026**"; "The child's height … in", "The child's weight … lb", "… temperature … °F"; "Does the child take any medicines regularly?" as a plain question. | A11: the patient's units, each named. **Layout defect:** on a phone the answers column is so narrow that every answer breaks into one or two letters a line (core 12). |

Elsewhere on the walked screens (read from the logs of the walk-through and of the audit's script, not from a picture): the role list offers the forty names of A24 with "Pulmonary disease"; an account of another country is refused; no request left the machine.

## Part D — fixes made (all in `countries/us/`)

| # | File | Before | After | Source |
|---|---|---|---|---|
| 1 | `index.ts` `uygulama.saatDilimleri` | seven zones | eight: `America/Adak` added after `America/Anchorage` | 49 CFR 71.12: the western Aleutian Islands keep Hawaii–Aleutian time; Alaska keeps daylight saving, Hawaii does not, so that clock is neither Anchorage's nor Honolulu's (A8, A9) |
| 2 | `index.ts` `telefon.ornek`; `ayarlar.ts` `acilis.telefonOrnegi` | `+1 202 555 0123` | `202-555-0123` | the plan's administrator writes a number NXX-NXX-XXXX; the first form is the one for calling from abroad. Still one of the fictitious numbers (A20) |
| 3 | `ayarlar.ts` `rolAdlari['respiratory-medicine']` | Pulmonology | Pulmonary disease | the name on both official lists (A24). The everyday word is "pulmonology": a local clinical lead may reverse this |
| 4 | `sizintiTerimleri.ts` | listed "Pulmonology" as a mark of this country | removed, and "Pulmonary disease" deliberately not added | the pack no longer shows the first; the second is an ordinary clinical phrase in every English-speaking country |
| 5 | `ayarlar.ts`, `index.ts` comments | "UNVERIFIED … from general knowledge" on values now read against a source | each such value names its source and the date; the file's heading still says that nobody of the country has confirmed anything | this document |
| 6 | `us.test.ts` | 83 tests | 93 tests | see below |

Tests added (`countries/us/us.test.ts`, the last block): the date pattern written, typed and refused; the 12-hour clock as the platform writes it; the week from Sunday against the kit's arithmetic and the platform's locale data; separators and the amount pattern; the eight zones with their winter and summer offsets, no two alike; the emergency number as a setting and no emergency number inside any sentence; the phone code, length, example and what the rule takes and refuses; all forty role names; the unit of every measured field of every live tool, and that no live tool takes a body weight while weight is in pounds; and that the lawyer's and the clinical lead's open points stay marked in the pack's own file.

Checked with their own exit codes after the fixes: wall check 0; pack check 0; this pack's tests 0 (93 of 93); the pack-parameterised tests for `us` 0 (323 of 323); the record under `docs/` regenerated and its check 0; type check (`npx tsc --noEmit`) 0; `NOTYA_COUNTRY=us npm run build:ulke` 0 with the build proof; the walk-through 329 of 329 (Part C).

Not changed, deliberately: the identifier label; lb / in / °F; the guardian age; the consent sentence; the ESI tool's switch. Each needs a person, not a source.

## Core — found, not fixed (kit: `lib/ulke/`, `components/ulke/`)

1. **A typed comma becomes a decimal point.** `lib/ulke/araclar/girdi.ts:35` and `:48`, `components/ulke/portal/HastaFormu.tsx:64`: `.replace(',', '.')`. In this country a comma groups thousands (A6): "1,250" typed into a tool or by a patient is read as 1.25 wherever the field's range allows it. The screen invites it: the same tool prints its own range as "0 to 10,000" (`us-10-tool-kdigo-grid.jpg`). *Change needed:* which character is a decimal sign must come from the pack (`bicim.ondalikAyraci`); where it is a point, a comma is either refused or dropped as a grouping mark.
2. **Date and time fields follow the browser, not the pack.** `<input type="date">` in `Hastalar.tsx:132` (date of birth), `OnBuro.tsx:160,214`, `Araclar.tsx:130`, `AracKayitlari.tsx:90`, `KlinikYetkiler.tsx:93`, `portal/HastaFormu.tsx:146`; `<input type="time">` in `Takvim.tsx:241,623,627,640,641`, `OnBuro.tsx:161`. A doctor here whose browser is set to another language sees the day first in the date of birth while every other date on the screen is month first. *Change needed:* the text field that appointments already use (read by `gunCoz` with the pack's pattern), everywhere; a time field that follows `saatBicimi`.
3. **The time-zone list shows technical names.** `Ayarlar.tsx:85` (`d.replace(/_/g, ' ')`), and the patient's page (`PortalSayfasi.tsx:172`). *Change needed:* a name per zone from the pack (Eastern Time, Central Time, Mountain Time, Arizona, Pacific Time, Alaska, Hawaii–Aleutian (Aleutian Islands), Hawaii).
4. **One name field.** `Hastalar.tsx` and the patient row hold `ad` and an optional second field. *Change needed for this country:* given name, middle name or initial, family name, suffix as separate fields (A19), and sorting by family name.
5. **Height in one unit.** `Birimler.boy` is `cm` or `in`. *Change needed:* feet and inches as two boxes for a patient-facing height (A11).
6. **One unit setting for patients and clinicians.** `uygulama.birimler` serves the intake form and the tools. *Change needed:* a separate setting for clinical entry, so that a pack can ask patients in pounds and clinicians in kilograms (A12). Until then weight-based tools stay off here.
7. **The identifier field asks for a digits-only keyboard.** `Hastalar.tsx:145` `inputMode="numeric"`. *Change needed:* the keyboard from the pack, or none where `kimlikNumarasi.dogrula` is false.
8. **The pack's phone rule is never called.** `telefon.cepGecerliMi` is required by the type and used by no screen or route: a phone number is stored as typed. *Change needed:* call it where a number is saved, or drop it from the type.
9. **One emergency number.** `uygulama.portal.acilNumara` is one string. *Change needed, if the owner wants it:* a second, labelled line for a crisis line (A16).
10. **The record generator cannot record a check.** `scripts/ulke-en-kayit.mts` writes fixed sentences for this country: "`911` — UNVERIFIED", "The 40 role names … were not checked against the country's official list", and a note on the identifier label. After this audit `docs/COUNTRY-PACK-UNITED-STATES.md` still carries them. *Change needed:* let a pack state, per setting, the source it was read against.
11. **The price would be written `$49.00`.** `tutarYaz` always writes the currency's decimals (item 11 of Part B). For the owner when prices exist.
12. **The patient's answers are unreadable on a phone.** On the read-only form (`components/ulke/portal/HastaFormu.tsx`) the answer column shrinks until each answer breaks into one or two letters a line (`us-12-intake-form-answers.jpg`). Not a matter of this country: seen here, true for every pack.

## Shared English set — found, not fixed (`countries/_dil/en/`)

1. **"If you are very unwell, call an ambulance: %."** (`portal.ts:135`). With this pack's number it reads "call an ambulance: 911". Here the sentence would be "If this is an emergency, call 911." *Change needed:* let a country state this sentence (as it states its consent sentence), with the place for the number.
2. **"Times are shown in your doctor's time zone: %."** (`portal.ts:141`) receives the technical zone name (core 3).
3. **Role keys that do not match this country's specialties.** `cardiovascular-surgery` is two specialties here (cardiac surgery within thoracic surgery; vascular surgery), and `thoracic-surgery` already covers the heart in the board's certificate. `oncology` and `radiology` are groups of specialties. A country can rename a role, not split or merge one.
4. **Slot sentences stay in British spelling** in this pack ("programmes", "authorised"): accepted and documented in the how-to; noted because a U.S. reviewer will read them.
5. **"A decision-support tool: diagnosis and treatment are the doctor's."** (the tools' own line, seen on `us-10-tool-kdigo-grid.jpg`, and "A result supports a decision" on the grid). In this country "clinical decision support" is the term of the device law (L3): whether the screens should use these words is for a lawyer.
6. **Third-party instruments.** The triage tool carries the Emergency Severity Index, whose owner reserves all rights (A27, L7). The set already treats published questionnaires as slots; whether this scale, and the other named instruments, belong among them is a question for a lawyer and for the owner. The pack could switch the tool off by itself (`araclar.kapali`); it was left on because that is a legal decision.

## Part E — medicines (research only; no medicine content was written)

**Official public registers.**

| Register | Publisher | What it is | Format and updates | Reuse |
|---|---|---|---|---|
| Drugs@FDA data files — https://www.fda.gov/drugs/drug-approvals-and-databases/drugsfda-data-files | Food and Drug Administration | approved drug products with their applications | a ZIP of 12 tab-delimited text tables, "updated each morning, Monday through Friday" | a work of the federal government; no licence text on the page (**UNVERIFIED: the exact terms**) |
| Orange Book — https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-therapeutic-equivalence-evaluations-orange-book | FDA | products "approved on the basis of safety and effectiveness", with equivalence, patents, exclusivity | ZIP data files, "updated monthly" | as above |
| National Drug Code Directory — https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory | FDA | every listed product, prescription and over the counter, **approved and unapproved**: "Assignment of an NDC number does not in any way denote FDA approval" | zipped text and Excel, an API; "updated daily" | as above |
| openFDA — https://open.fda.gov | FDA | the same data and the product labels through an API | JSON; labels weekly | **Creative Commons CC0 1.0 public-domain dedication** for most content ("public domain"); credit asked, not required; some data sets marked as not public domain — https://open.fda.gov/terms/ |
| RxNorm — https://www.nlm.nih.gov/research/umls/rxnorm/ | National Library of Medicine | normalized names and codes for clinical drugs, linking the vocabularies | monthly releases, weekly updates | the names and codes created by the Library are "in the public domain"; the **full** release holds proprietary sources and needs a (free) UMLS licence — https://www.nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html . The **RxNorm Current Prescribable Content** subset is provided "without any licensing restrictions" and holds only the Library's own names and the label source — https://www.nlm.nih.gov/research/umls/rxnorm/docs/prescribe.html |
| DailyMed — https://dailymed.nlm.nih.gov | National Library of Medicine | the current product labels as submitted to FDA | XML or JSON through an API; ZIP downloads | no terms on the page read (**UNVERIFIED**) |

**Dosing information.** The official source is each product's label (DailyMed, openFDA). It is free to read, but it is prose written by each manufacturer, not a dosing table; FDA says of the label data: "Do not rely on openFDA to make decisions regarding medical care", and that it "may not match currently distributed products or approved labeling". Structured dosing, interaction and allergy data in U.S. clinical software comes from licensed compendia — First Databank, Medi-Span and Lexicomp (Wolters Kluwer), Micromedex, Clinical Pharmacology (Elsevier), AHFS Drug Information — each of which needs a commercial licence. **UNVERIFIED: these publishers and their terms come from general knowledge; none was read.** RxNorm's own page names First Databank and Micromedex as proprietary sources excluded from the free subset.

**What the pack would need.** The empty slots already exist in the shared set and name the register as missing: `prescription`, `medicine-interactions`, `polypharmacy`, `anticoagulation-review`, `antiseizure-monitoring`, `psychotropic-monitoring` (`countries/_dil/en/araclar/yuvalar.ts`), and the intake form's medicine question stays free text. To take a names list, the kit would need: a place for a country's list that is data and not text (generated from a dated download, never typed), a field that searches it, the release date and the attribution line shown with it, and a rule that a name not on the list can still be typed. None of this exists; a names list alone switches on no tool.

**Risks.** A register lists products, not advice: a name on a screen can be taken as a suggestion. The NDC directory includes unapproved products. Lists go stale within weeks. Brand names are trademarks. A look-alike name chosen from a list is a known cause of error. And a names list invites the next step — doses — which is licensed content and may move the product towards the device rules (L3).

**Recommended route, for the owner to decide.** Take **names only** from the **RxNorm Current Prescribable Content** subset: generic names as the United States names them, no licence restriction, monthly, with the Library's attribution line and the release date on the screen; use it first for one thing only — recognising and spelling medicine names in a drafted note and in the intake form's free-text answer — and offer no dose, no interaction and no suggestion. If dosing or interaction checking is ever wanted, license one compendium and have a lawyer answer L3 first. Before any of it, a U.S. pharmacist or physician reviews how names are shown.

## Open items

| # | Item | Waits on |
|---|---|---|
| 1 | Core 1: a typed comma read as a decimal point — decide the rule and change the kit | Claude (kit change), after Kaan agrees |
| 2 | Core 2 to 9 and 12: date and time fields, zone names, name fields, feet and inches, a clinical unit setting, the identifier keyboard, the phone rule, a second number, the answers column on a phone | Kaan (priority), then Claude |
| 3 | The triage tool carries a copyrighted scale; the other named instruments (L7); the words "decision-support tool" (L3) | a lawyer; Kaan decides whether the triage tool stays on meanwhile |
| 4 | "Pulmonary disease" or "Pulmonology"; names for oncology, radiology, cardiac and vascular surgery; the five clinic roles | a local clinician |
| 5 | Pounds or kilograms for a clinician's entries; 12- or 24-hour clock on clinic screens; ESR, hearing and acuity units; the C-reactive protein label | a local clinician |
| 6 | "Patient identifier" or "Medical record number (MRN)" | a local clinician |
| 7 | Guardian age by state; recording consent by state; the questions L1 to L8 | a lawyer |
| 8 | Whether the pack serves the territories (three more time zones, and Spanish) | Kaan |
| 9 | Spanish for patient-facing pages | Kaan |
| 10 | The emergency sentence and the role keys in the shared English set | Kaan, then Claude |
| 11 | Medicines: the recommended route in Part E | Kaan |
| 12 | A native editor reads the American text; the slot sentences are British | Kaan (to find one) |
| 13 | The record generator's fixed "unverified" sentences (core 10) | Claude |
| 14 | Everything in this document marked UNVERIFIED | Claude (sources), a local person (practice) |

## What could not be verified

Stated where it occurs above; gathered here: the slash and leading zeros in numeric dates and the Sunday week from a government source (only the Unicode locale data); the prevalence of 24-hour charting; degrees Fahrenheit in everyday use; units for ESR, hearing thresholds and visual acuity; the funding bar on a national patient identifier; a general federal paper standard; the layout of the last line of an address; MD and DO as titles; state licensing of the allied professions; the membership of the USAN Council and medicine-name pairs other than acetaminophen; the procedure code set; the age of majority in most states, Alabama and Mississippi; the Oregon statute on the legislature's own site; California's recording statute (the page could not be fetched); the enrolled text of the Texas bill; marketing e-mail and patient-text rules; the reuse terms of the FDA data files and of DailyMed; the licensed compendia. The Emergency Nurses Association's own page on licensing the triage scale could not be fetched: the copyright notice was read in the handbook.
