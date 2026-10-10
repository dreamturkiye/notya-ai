# Country audit: United Kingdom (`gb`, served at `/uk`, `en-GB`)

Audit of 2026-10-09, branch `audit/gb`, base `feat/ulke-butun` at `d7bc33a0`. Asked by the owner: "Go audit all these and make sure they all confirm to each countries standards."

What this is: the pack `countries/gb/` compared with the United Kingdom's own conventions, each read on an official page on the day of the audit; what the product does with each today; what was seen on real screens of a local build; what was fixed inside `countries/gb/`; and what cannot be fixed there.

What this is not: a review by anybody of the country. **A machine read the pages named below. No clinician, lawyer or native editor of the United Kingdom has read the pack or this document.** A standard marked UNVERIFIED could not be confirmed on an official page that the audit could open. Nothing here is a statement that the product complies with any law or standard, and every legal matter is a question for a lawyer.

## Summary

- 51 lines in the table of Part B. **24 conform; 8 differ (2 of them fixed in the pack, with five changes of text; 6 can only be changed in the kit or in the shared English set); 11 are not handled by the product; 7 need a local person; 1 is for a lawyer and the owner.**
- Fixed in `countries/gb/`: four specialty names brought to the regulator's wording; the patient-identifier label, which named the identifier of England and Wales only.
- The most important things that are wrong and cannot be fixed in the country's folder: (1) date and time **entry** fields are the browser's own and follow the browser's language, not the pack: a browser set to American English shows month first on the date-of-birth field of a British build; (2) the kit has one clock setting for the doctor and for the patient, so the patient's page and the reminder text show 24-hour times, where the health service writes "5:30pm" for patients; (3) the patient's page can name one number only: there is no place for the non-emergency line, and no way to say that Northern Ireland has none of that kind; (4) the shared English set has one word for a senior doctor in every doctor role, so the general-practice instruction opens "You are an experienced consultant".

## Part A — the standards sheet

Each line: the standard, then where it was read. "Read" means the page was opened by the audit on 2026-10-09 and says this.

### Dates, times, numbers, money

1. **Date order.** Day, month, year. For readers the health service writes the month as a word: "We use this format: 6 August 2018", with the weekday where it helps. The government style guide: "4 June 2017", no ordinal ("2 June and not 2nd June"), no comma. — NHS digital service manual, https://service-manual.nhs.uk/content/numbers-measurements-dates-time ; GOV.UK style guide, https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/
   - The all-numeric form with slashes (07/03/2021) is the everyday short form. UNVERIFIED as a rule: neither guide prescribes a numeric form; both prefer the month as a word. For data exchange the international form YYYY-MM-DD is used (https://www.iso.org/iso-8601-date-and-time-format.html).
2. **Clock.** Two standards, by reader.
   - A clinical record: "Every entry in the medical record should be dated, timed (24 hour clock), legible and signed by the person making the entry." — Royal College of Physicians, generic medical record keeping standards, https://www.rcp.ac.uk/resources/generic-medical-record-keeping-standards/
   - Text for the public: 12-hour with am and pm: "5:30pm (not 1730hrs)", "midnight (not 00:00)", "midday" — GOV.UK style guide (link above); the health service's guide gives "5pm" and "5:30pm" and says not to write "5.00pm or 1700hrs" (link above).
3. **First day of the week.** Monday. UNVERIFIED: this is the international standard's week (ISO 8601, adopted as a British Standard), but the standards body's public page that the audit could open does not state it (https://www.iso.org/iso-8601-date-and-time-format.html), and the standard's text is sold, not published.
4. **Decimal and thousands separators.** A point for decimals, a comma for thousands: "For numerals over 999, insert a comma for clarity: 9,000." — GOV.UK style guide; "For numbers over 999, use a comma for clarity – for example, 1,000" — NHS service manual (links above).
5. **Currency.** Pound sterling, the sign before the amount, no space: "Use the £ symbol: £75"; "Do not use decimals unless pence are included: £75.50 but not £75.00." — GOV.UK style guide.
6. **Time zones.** One. Greenwich Mean Time in winter, British Summer Time (one hour ahead) in summer: the clocks go forward "1 hour at 1am on the last Sunday in March" and back "1 hour at 2am on the last Sunday in October". — https://www.gov.uk/when-do-the-clocks-change . An appointment is shown in local wall-clock time; nothing needs to name the zone inside the country.
7. **Public holidays** differ between England and Wales, Scotland, and Northern Ireland. — https://www.gov.uk/bank-holidays

### Measurements

8. **Body weight, height, temperature.** Metric in clinical use: "We generally use metric"; imperial may be added in brackets where it helps readers, never for medicine doses or infant feeding; "We use Celsius for temperature". — NHS service manual (link above). GOV.UK: "Use Celsius for temperature: 37°C". Patients often know their own weight in stones and pounds and their height in feet and inches (this is why the health service's guide allows imperial in brackets): UNVERIFIED as a statement about patients; for a local clinical lead.
9. **Laboratory units.**
   - Glucose: mmol/L ("below 4mmol/L") — https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/
   - Creatinine: µmol/L ("Male Adult: 59 - 104 μmol/L") — an NHS laboratory, https://www.nbt.nhs.uk/severn-pathology/requesting/test-information/creatinine
   - Haemoglobin: g/L ("110 g/litre or less") — NICE guideline NG203, https://www.nice.org.uk/guidance/ng203/chapter/Recommendations
   - Cholesterol: mmol/L ("Below 5mmol/L") — https://www.nhs.uk/conditions/high-cholesterol/cholesterol-levels/
   - Urine albumin-to-creatinine ratio: mg/mmol, with the categories "less than 3 mg/mmol", "3 to 30 mg/mmol", "over 30 mg/mmol" — NICE NG203 (link above).
   - HbA1c: mmol/mol, with the percentage in brackets ("75 mmol/mol [9.0%]") — NICE NG28, https://www.nice.org.uk/guidance/ng28/chapter/Recommendations
   - Kidney function estimate: ml/min/1.73 m2 — NICE NG203.
   - Prostate-specific antigen: UNVERIFIED. The health service's page on the test names no unit (https://www.nhs.uk/tests-and-treatments/psa-test/) and the two NICE pages that would state one could not be opened. Nanograms per millilitre and micrograms per litre are the same number.
   - C-reactive protein (mg/L) and erythrocyte sedimentation rate (mm/h), which the DAS28 tool takes: UNVERIFIED, no official page was read.
10. **Blood pressure.** In mmHg, systolic and diastolic ("below 140 mmHg", "below 90 mmHg") — NICE NG203. The usual written form 140/90 mmHg is UNVERIFIED on a page the audit opened.

### Emergency and non-emergency numbers

11. **Emergency: 999.** "999 is for life-threatening emergencies like serious road traffic accidents, strokes and heart attacks." — https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ . Northern Ireland: "phone 999 and ask for the ambulance service" — https://www.nidirect.gov.uk/articles/emergency-healthcare . (112 also reaches the emergency services: UNVERIFIED, not read.)
12. **The non-emergency health line is NOT the same in the four nations.**
   - England: "NHS 111 can help if you think you need medical help right now"; call 111 or use 111 online. The page sends readers elsewhere in the United Kingdom to their own services. — https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/
   - Scotland: NHS 24 on 111, "if you think you need A&E but its not life or limb threatening". — https://www.nhs24.scot/111/
   - Wales: NHS 111 Wales exists (https://111.wales.nhs.uk/); its front page, as the audit could read it, does not say when to call. UNVERIFIED in detail.
   - Northern Ireland: the official page on emergency healthcare does not mention 111; it names "Phone First" (in four of the five trust areas) and the GP out-of-hours service. — https://www.nidirect.gov.uk/articles/emergency-healthcare
   - So a notice for the whole United Kingdom cannot simply say "call 111". For a local person.

### Identity

13. **The patient identifier.** In England and Wales the NHS number: "a unique identifier for a PATIENT within the NHS in England and Wales", "10 numeric digits in length", the tenth a check digit by the Modulus 11 algorithm. Scotland and Northern Ireland use other identifiers: the Community Health Index (CHI) number and the Health and Care (H&C) number. — NHS Data Dictionary, https://www.datadictionary.nhs.uk/attributes/nhs_number.html . How the number is spaced when written (3 3 4) is UNVERIFIED on that page.
   - Whether a private product or a private clinic may ask for it: **for a lawyer** (Part A, legal questions).
   - What must never be collected: no official page read by the audit lists forbidden fields. The principle that applies is data minimisation under the UK GDPR: **for a lawyer**. The product asks for no other identity number, no insurance number and no National Insurance number.
14. **Names.** One field: "A single field suits the widest range of names"; label it "Full name"; with several fields "First name" and "Last name" (for users from outside the country "Given names" and "Family name"); avoid asking for a title. — GOV.UK Design System, https://design-system.service.gov.uk/patterns/names/
15. **Telephone.** Country code +44. Written with the area or mobile code apart from the rest: "0131 496 0454", "020 7946 0457", "07700 900 265", "+44 (0)29 2018 0542". — GOV.UK style guide. Numbers set aside for drama, which are nobody's: mobile "07700 900000 to 900999", and ranges for several cities; they "cannot be allocated to communications providers for their customers". — Ofcom, https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama . The full numbering plan (which 07 ranges are mobiles, the length of every range) is UNVERIFIED: Ofcom's page could not be opened.
16. **Postal address.** Each part on its own line, the town and the postcode on separate lines, no commas at line ends, the country after the postcode and only when the letter may come from abroad. The code is called the **postcode**. — GOV.UK style guide. (Royal Mail's own page could not be opened.)
17. **Paper size.** A4. UNVERIFIED: the international standard (ISO 216) is sold, not published; no official page was read.

### The professions

18. **Doctors' seniority and titles.** The regulator is the General Medical Council; a senior hospital doctor is a consultant, on the regulator's Specialist Register; a general practitioner (GP) is on its GP Register and is not called a consultant. (The register names are from the regulator's page on applications, below; the grades between them were not read on an official page: UNVERIFIED.) **Surgeons** are addressed as Mr, Miss, Ms or Mrs, not Dr: one "becomes a Dr" in training and returns to Mr/Miss/Ms/Mrs as a surgeon. — Royal College of Surgeons of England, https://www.rcseng.ac.uk/patient-care/surgical-staff-and-regulation/qualifications-of-a-surgeon/
19. **Specialty names, as the regulator writes them** (65 specialties) — General Medical Council, https://www.gmc-uk.org/registration-and-licensing/join-our-registers/registration-applications/specialist-application-guides/applications-for-retrospective-ccts--certificates-of-completion-of-training . Those that bear on the pack's roles: Emergency medicine; General Practice; Anaesthetics; Neurosurgery; Paediatric surgery; General (internal) medicine; Dermatology; Endocrinology and diabetes mellitus; Infectious diseases; Gastro-enterology; General surgery; Cardio-thoracic surgery (also known as thoracic surgery); Vascular surgery; Respiratory medicine; Ophthalmology; Obstetrics and gynaecology; Cardiology; Otolaryngology; Renal medicine; Neurology; Clinical oncology; Medical oncology; Trauma and orthopaedic surgery; Paediatrics; Plastic surgery; General psychiatry (and Child and adolescent psychiatry, Forensic psychiatry, Old age psychiatry, Psychiatry of learning disability, Medical psychotherapy); Clinical radiology; Rheumatology; Urology; Sport and exercise medicine; Rehabilitation medicine.
20. **Allied professions.** Regulated by the Health and Care Professions Council, which protects these titles among others: Physiotherapist (and Physical therapist), Dietitian (and Dietician), Occupational therapist, Clinical psychologist (under practitioner psychologists), Hearing aid dispenser. **"Audiologist" is not on its list.** — https://www.hcpc-uk.org/about-us/who-we-regulate/the-professions/

### Clinical conventions

21. **Medicine names.** The official nonproprietary names are British Approved Names, which since 2003 follow the international names: "Since 1 December 2003, where the names differ the rINN is the correct name", with two exceptions kept on public-health grounds, adrenaline and noradrenaline. — letter of the Chief Medical Officer for Scotland, https://www.publications.scot.nhs.uk/files/cmo-2004-03.pdf . Well-known differences from the names used in the United States, as a naming convention only: adrenaline (there epinephrine); and, from general knowledge and not read on an official page (UNVERIFIED), paracetamol (there acetaminophen) and salbutamol (there albuterol). The medicines dictionary of the health service is in Part E.
22. **Triage in emergency departments.** A five-level acuity: 1 Immediate, 2 Very urgent, 3 Urgent, 4 Standard, 5 Low acuity, each mapped to a priority of the Manchester Triage System. — NHS Wales Data Dictionary, https://www.datadictionary.wales.nhs.uk/WordDocuments/urgentandemergencycareacuity.htm . In England the same item is recorded as a coded concept, set through a "formal triage process" or by placing the patient in a clinical area; its values are in a reference set the page does not print (https://www.datadictionary.nhs.uk/data_elements/emergency_care_acuity__snomed_ct_.html). Which triage system a department uses is UNVERIFIED for England, Scotland and Northern Ireland.
23. **Diagnosis coding.** ICD-10 for diagnoses of inpatient and day-case care ("must be recorded to this mandated version, ICD-10"); OPCS-4 for procedures; SNOMED CT as the vocabulary of the electronic record ("mandated as an NHS fundamental information standard"); dm+d for medicines. — NHS England, https://digital.nhs.uk/developer/guides-and-documentation/building-healthcare-software/clinical-coding-classifications-and-terminology . These are standards of the health service in England; what a private clinic must use, and the other three nations, are UNVERIFIED.
24. **Age of consent to treatment.** 16 in all four nations, by three different laws, with different rules below 16.
   - England and Wales: "The consent of a minor who has attained the age of sixteen years to any surgical, medical or dental treatment" is as effective as an adult's. — Family Law Reform Act 1969, section 8, https://www.legislation.gov.uk/ukpga/1969/46/section/8 . Under 16: a child with "enough intelligence, competence and understanding to fully appreciate what's involved" can consent (Gillick competence); otherwise someone with parental responsibility. A refusal by a young person can in limited cases be overruled by a court. — https://www.nhs.uk/conditions/consent-to-treatment/children/
   - Scotland: under 16, a person "shall have legal capacity to consent on his own behalf to any surgical, medical or dental procedure or treatment where, in the opinion of a qualified medical practitioner attending him, he is capable of understanding the nature and possible consequences". — Age of Legal Capacity (Scotland) Act 1991, section 2(4), https://www.legislation.gov.uk/ukpga/1991/50/section/2
   - Northern Ireland: a minor aged 16 or over can consent to surgical, medical or dental treatment as an adult. — Age of Majority Act (Northern Ireland) 1969, section 4, https://www.legislation.gov.uk/apni/1969/28/section/4
25. **Spelling.** British: "Use UK English spelling and grammar. For example, use 'organise' not 'organize'". — GOV.UK style guide.
26. **Languages of a patient-facing page.** English. Welsh: duties called Welsh language standards are "imposed on organisations by the Commissioner" one by one — https://www.welshlanguagecommissioner.wales/public-organisations/welsh-language-standards . Whether any reaches a private clinic or its software in Wales was not answered by the page: UNVERIFIED, **for a lawyer**. Other languages of the United Kingdom were not researched.

### Questions for a lawyer (none answered here)

1. **Health-data privacy: the UK GDPR and the Data Protection Act 2018** (https://www.legislation.gov.uk/ukpga/2018/12/contents), regulator: the Information Commissioner's Office. What does the vendor need before one real patient's data is processed: the lawful basis and the condition for special category data (https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-are-the-rules-on-special-category-data/); who is controller and who processor, and the contract between the clinic and the vendor; a data protection impact assessment (https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-impact-assessments/); registration and the fee; breach deadlines?
2. **Sending data abroad.** The speech provider, the model provider and the database host may be outside the United Kingdom. Which mechanism covers each transfer (adequacy regulations, the International Data Transfer Agreement or the Addendum, with a transfer risk assessment)? — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/
3. **Data residency.** The health service's guidance for its own organisations in England says: "Data may be hosted within the UK, or the European Economic Area (EEA) or a country deemed adequate by the UK" (https://digital.nhs.uk/data-and-information/looking-after-information/data-security-and-information-governance/nhs-and-social-care-data-off-shoring-and-the-use-of-public-cloud-services/guidance). Does anything of the kind bind a private clinic, and what will clinics expect in a contract?
4. **Recording a consultation.** What consent and what notice are required to record a visit and to have it transcribed by an outside provider, may the patient object, and how long may a recording be kept? The regulator's guidance has a section "Recordings made as part of a patient's care" with cases where separate consent is and is not required (https://www.gmc-uk.org/professional-standards/the-professional-standards/making-and-using-visual-and-audio-recordings-of-patients; the paragraphs themselves were not readable by the audit). The health service's guidance for England on ambient scribing asks that patients be informed in advance, "giving them the chance to object", and leaves "Is patient consent needed to use and/or retain the data?" as a question to resolve (https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/).
5. **Medical-device rules: the Medical Devices Regulations 2002, regulator MHRA.** (a) Note drafting: the health service's guidance for England says a product that only transcribes is "likely not" a medical device, while one that uses generative AI for summarisation "would be treated as high functionality and likely would qualify as a medical device", and that its supplier list expects "at least MHRA Class 1 Registration" (link in 4). Does drafting a visit note from a recording bring this product under the regulations, in which class, and does that hold outside the health service? (b) Calculators: the regulator's guidance "Medical devices: software applications" has an appendix on clinical calculators (https://www.gov.uk/government/publications/medical-devices-software-applications-apps; the appendix was not readable by the audit). Do the scores, the dose arithmetic and the other tools of the tools area fall under it?
6. **Standards of the health service for health software** named in the same guidance for England: the clinical safety standards DCB0129 (the supplier) and DCB0160 (the organisation that deploys), and the Digital Technology Assessment Criteria. Do they apply when the customer is a private clinic, and will customers ask for them anyway?
7. **Advertising.** The UK advertising code, section 12 (medicines, medical devices, health-related products), enforced by the Advertising Standards Authority: "Objective claims must be backed by evidence"; medical claims for a device only with "the applicable conformity marking" (https://www.asa.org.uk/type/non_broadcast/code_section/12.html). What may be said about this product to doctors and on a public landing page, and do the cosmetic and aesthetic roles of the pack bring further rules?
8. **The patient identifier.** May a private clinic record the NHS number, the CHI number or the H&C number in an outside product, and under which conditions?
9. **Children.** The guardian wording and the form a parent fills in start below 16 in the pack. A competent child under 16 can consent alone, and the rule is statutory in Scotland and case law elsewhere: what should the form do?
10. **Welsh.** Does a duty to offer Welsh reach a private clinic in Wales or its patient-facing pages?

## Part B — what the product does today

Where the kit decides: a day is written by the pack's pattern in digits (`lib/ulke/arayuz/bicim.ts`, `tarihYaz`, with `lib/ulke/uygulama/zaman.ts`, `gunYazDesenle`); a time of day by the pack's `saatBicimi`, 24-hour as `HH:MM` or 12-hour through `Intl.DateTimeFormat` with the pack's locale (`bicim.ts`, `saatGoster`); numbers and amounts by the pack's two separators and the currency's decimal places (`lib/ulke/arayuz/sayi.ts`); the time zone is the pack's, through the platform's time-zone database (`zaman.ts`); weekday names are text of the catalogue. **Entry is different:** the appointment day is a text field in the pack's pattern (`components/ulke/uygulama/Takvim.tsx:237`), but the date of birth, tool dates, follow-up dates, the intake form's dates and every time of day are the browser's own fields (`type="date"`, `type="time"`: `Hastalar.tsx:132`, `Araclar.tsx:130`, `AracKayitlari.tsx:90`, `portal/HastaFormu.tsx:146`, `Takvim.tsx:241`, `OnBuro.tsx:160–161`), whose order and clock follow the language of the browser, not the pack. The phone field is free text with the pack's example as placeholder; `telefon.cepGecerliMi` and `telefon.ulusalHane` are read by no screen today.

| # | Item | The pack (file:line after the fixes) | What the kit renders or accepts | Verdict |
|---|---|---|---|---|
| 1 | Date order on the doctor's screens | `index.ts:44` `tarihDeseni: 'DD/MM/YYYY'`; `ayarlar.ts` `tarihOrnegi` | digits in the pack's pattern | CONFORMS |
| 2 | Dates a patient reads (the patient's page, the reminder text, the form's "sent on") | the same pattern | digits only: `09/10/2026`; the month cannot be written as a word | DIFFERS from the health service's style for readers ("6 August 2018"). **Core.** |
| 3 | Typing a date of birth and other dates | none | the browser's own date field, in the browser's language | DIFFERS when the browser is not set to British English. **Core.** Seen in Part C. |
| 4 | Typing an appointment day | `tarihOrnegi: 'DD/MM/YYYY'` | text field, placeholder and parser from the pack | CONFORMS |
| 5 | Clock on the doctor's screens and in the record | `index.ts` `saatBicimi: 24` | `HH:MM` | CONFORMS (clinical record standard) |
| 6 | Clock a patient reads | the same setting | 24-hour on the patient's page and in the reminder text | DIFFERS from the style for the public ("5:30pm"). **Core:** one setting for both readers. |
| 7 | Typing a time | none | the browser's own time field | follows the browser. **Core** (same as 3) |
| 8 | First day of the week | `index.ts:44` `haftaBasi: 1` | week view starts on Monday | CONFORMS (the standard itself UNVERIFIED) |
| 9 | Decimal and thousands separators | `index.ts:44` `.` and `,` | `sayiYaz` | CONFORMS |
| 10 | Currency sign and place | `index.ts:42` GBP, `£`; `ayarlar.ts` `'£% a month'` | not shown: every plan is by quote | CONFORMS |
| 11 | An amount without pence | `ondalikHane: 2` | `tutarYaz` always writes two decimals: "£75.00" | Would DIFFER ("not £75.00") once a price is shown. **Core.** Nothing is shown today. |
| 12 | Time zone and daylight saving | `index.ts:43` `Europe/London`, one zone; "All times are UK time." | instants converted through the time-zone database; the test added holds 09:00 on both sides of the change | CONFORMS |
| 13 | Public holidays | none in the pack, said so on the working-hours screen | not handled | NOT HANDLED (stated to the doctor) |
| 14 | Weight, height, temperature | `ayarlar.ts` `GB_BIRIMLER` kg, cm, C | the intake form and the tools show kg, cm, °C | CONFORMS |
| 15 | A patient who knows only stones and pounds, feet and inches | — | the kit has no such entry | NEEDS A LOCAL PERSON (and the kit) |
| 16 | Glucose mmol/L | `ayarlar.ts` `labBirimleri.glukoz` | read by no switched-on tool | CONFORMS |
| 17 | Creatinine µmol/L | `labBirimleri.kreatinin: 'umol/L'` | read by no switched-on tool | CONFORMS |
| 18 | Haemoglobin g/L | `labBirimleri.hemoglobin` | read by no switched-on tool | CONFORMS |
| 19 | Cholesterol mmol/L | `labBirimleri.kolesterol` | read by no switched-on tool | CONFORMS |
| 20 | Albumin-to-creatinine ratio mg/mmol | `labBirimleri.albuminKreatinin`; both KDIGO tools kept off | off | CONFORMS. The reason the pack gives for keeping them off (the published limits 3 and 30 mg/mmol are not the exact conversion of the kit's mg/g limits) matches the categories NICE prints. |
| 21 | HbA1c mmol/mol | slot `lab-izlem`, empty | the kit's field has no unit choice | NOT HANDLED (slot) |
| 22 | Prostate-specific antigen | tool `psa-hizi` shows ng/mL | as the pack says | NEEDS A LOCAL PERSON (unit not confirmed; same number in µg/L) |
| 23 | C-reactive protein mg/L, sedimentation rate mm/h (DAS28) | the set's tool words | as the set says | NEEDS A LOCAL PERSON (not confirmed on an official page) |
| 24 | Blood pressure notation | no field | the note shows no measurement in a unit; `kardiyo-izlem` is a slot | NOT HANDLED |
| 25 | Emergency number | `index.ts` `portal.acilNumara: '999'` | "This page is not for emergencies. If you are very unwell, call an ambulance: 999." | CONFORMS |
| 26 | Non-emergency line | no place for one | one number only | NOT HANDLED. **Core and shared set**; the four nations differ. |
| 27 | Patient identifier: label | was "NHS number" in `index.ts:48` and `ayarlar.ts:38` | the label on the patient form and file | DIFFERED (England and Wales only). **FIXED**: "NHS number (CHI or H&C number)". |
| 28 | Patient identifier: format | `hane: 0`, `dogrula: false` | optional free text, encrypted, never checked; the field asks the numeric keyboard | CONFORMS as a setting (nothing is validated, so nothing wrong is enforced); whether to ask at all: for a lawyer |
| 29 | Nothing else collected | the intake form asks no identity or insurance number | — | CONFORMS |
| 30 | Name | "Full name", `adAlanlari.ikinciAd: false` | one field | CONFORMS |
| 31 | Phone: code and example | `index.ts:45` `+44`, `+44 7700 900123` | placeholder on the patient form and the landing form | CONFORMS (inside the regulator's drama range). A doctor would more often type 07700 900123: for a local person. |
| 32 | Phone: rule | `gbCepGecerliMi` accepts mobiles only; `ulusalHane: 10` | read by no screen | NOT HANDLED by the product today. If the kit starts to use it, landlines would be refused: recorded as an open item. |
| 33 | Postal address, postcode | — | no address is collected or printed | NOT HANDLED |
| 34 | Paper size | — | nothing is printed | NOT HANDLED |
| 35 | Senior doctor | `ayarlar.ts` `kidemliHekim: 'consultant'` | "You are an experienced consultant." opens every doctor role's instruction | CONFORMS for the hospital specialties |
| 36 | Senior doctor, general practice | the same word | the general-practice instruction opens the same way | DIFFERS (a GP is not a consultant). **Shared English set:** one word for every doctor role. |
| 37 | How a surgeon is addressed | noted in `ayarlar.ts`; no title is used anywhere | no assistant is named | NOT HANDLED (nothing to get wrong today) |
| 38 | Specialty names: 4 that differed | `ayarlar.ts` `rolAdlari` | role list, settings, tools heading, the model's instruction | DIFFERED. **FIXED** (below) |
| 39 | Specialty names: 22 that already matched | `rolAdlari` and the set's base names | | CONFORMS (Gastroenterology is written without the hyphen the legal list has) |
| 40 | Specialty roles with no specialty of the same scope: Thoracic surgery; Cardiac and vascular surgery; Oncology; Psychiatry | the set's base names | | NEEDS A LOCAL PERSON. The regulator has Cardio-thoracic surgery and Vascular surgery; Clinical and Medical oncology; General psychiatry and five more. Renaming would not make the role's template and tools fit. |
| 41 | The five clinic-doctor roles (hair transplantation, cosmetic surgery, aesthetic medicine, clinic dermatology, preventive and longevity medicine) | the set's names | | NEEDS A LOCAL PERSON: none is a specialty on the regulator's list |
| 42 | Allied professions: Physiotherapist, Dietitian, Occupational therapist, Clinical psychologist | the set's names | | CONFORMS (protected titles) |
| 43 | Audiologist | the set's name | | NEEDS A LOCAL PERSON: not a title of the professions' regulator, which protects "Hearing aid dispenser" |
| 44 | Medicine names | none anywhere; free text | the spelling table never rewrites a medicine's name | NOT HANDLED (slots; Part E) |
| 45 | Triage scale | `ayarlar.ts` keeps `esi-triyaj` off | off | CONFORMS (another country's scale is not offered); which tool belongs here: a local emergency physician |
| 46 | Diagnosis coding | slot `diagnosis-coding`, empty | off | NOT HANDLED (slot) |
| 47 | Guardian age | `ayarlar.ts` `GB_VELI_YASI = 16` | guardian wording and the guardian form below 16, in every role | CONFORMS with the age in all three laws; the competent under-16: for a lawyer |
| 48 | Spelling | `bicim: 'en-GB'` | every text tested for other forms' spelling | CONFORMS (no native editor) |
| 49 | Welsh and other languages | `hastaDilleri: ['en']` | English only | NOT HANDLED; for a lawyer |
| 50 | Appointment defaults (09:00–17:00, 30 minutes, lunch 13:00–14:00; lengths from 10 minutes) | `index.ts` `randevu` | each account changes its own | NEEDS A LOCAL PERSON (a starting value, not a standard) |
| 51 | Recording-consent sentence, portal link 30 days | `ayarlar.ts`, `index.ts` | | for a lawyer and the owner; not judged here |

Counting the 51 lines:

- CONFORMS, 24: lines 1, 4, 5, 8, 9, 10, 12, 14, 16, 17, 18, 19, 20, 25, 28, 29, 30, 31, 35, 39, 42, 45, 47, 48.
- DIFFERS, 8: lines 27 and 38 (fixed in the pack); lines 2, 3, 6, 7 and 11 (the kit), line 36 (the shared English set).
- NOT HANDLED BY THE PRODUCT, 11: lines 13, 21, 24, 26, 32, 33, 34, 37, 44, 46, 49.
- NEEDS A LOCAL PERSON, 7: lines 15, 22, 23, 40, 41, 43, 50.
- For a lawyer and the owner, 1: line 51.

## Part C — what was seen on real screens

**Run on this machine only, against the repository's stand-ins; no account was made on any deployed site and nothing left the machine.**

- Build: `NOTYA_COUNTRY=gb npm run build:ulke` exit 0, with the build proof ("gb" pack present, no other country's pack). It was built once, AFTER the fixes of Part D: three earlier attempts were killed by the machine for lack of memory while other builds ran, so there is no screenshot of the pack as it was before the fixes. What changed is text (four names, one label) and is visible below in its new form.
- Walk-through: `scripts/ulke-yuruyus/genel.mjs` exit 0, **329 of 329 checks**, among them: the birth date written 07/03/2021 on the patient file; the appointment shown at 14:30 on the calendar and on the patient's page with its weekday and day in the pack's pattern; the phone example as placeholder; the identifier field present; 999 on the patient's page; no term of another country on any screen.
- Screenshots: taken with the Chromium the repository's walk-through uses (`puppeteer-core` with `@sparticuz/chromium`, already installed beside the walk-through). **No Playwright Chromium was found on this machine**, and none was downloaded. Eight images are the audit's own script; the four marked W (landing, visit note, patient's page, intake form) are the walk-through's own, converted to JPEG. Twelve in all, each under 300 KB. The account name "QA Shifokor Bir" and the patient "QA-PATIENT Walkthrough" are the stand-in's test data, not text of the pack.
- The machine's clock was 9 October 2026, 21:06 in its own zone, which is 02:06 on 10 October in London: the screens show 10/10/2026, which is right.

| Image (`docs/audit/gb/`) | What is on it | Against Part A |
|---|---|---|
| `01-landing.jpg` (W) | "A clinical assistant for doctors"; "The patient leaves the room — and the note is already drafted."; menu The visit, Patient's page, Specialties, Safeguards, Plans; "Request a quote"; "In English". No price, no currency sign, no phone number on the first screen. | British spelling; nothing to compare for money. The request form further down (not in the image) carries the example phone number: read from the page by the walk-through, not seen by eye. |
| `02-sign-up.jpg` | "Create an account with an invitation code"; fields Invitation code, Full name, Email address, Password, Password (again); "Sign in". | One name field, "Full name": conforms. |
| `03-calendar-week.jpg` | Week from "Mon · 05/10" to "Sun · 11/10"; the appointment "14:30"; "Working hours · All times are UK time." | Monday first; day before month; 24-hour clock: conform. |
| `04-booking-form.jpg` | "Date" as a text field holding 10/10/2026; "Time" as the browser's own field ("--:--"); "Length 30 min"; "All times are UK time." | The day is typed in the pack's pattern: conforms. The time field is the browser's (Core 1). |
| `05-new-patient-browser-en-GB.jpg` | New patient: Full name; Date of birth (the browser's field, showing 07/03/2021 after the keys 0 7 0 3 2 0 2 1); Phone number with the placeholder +44 7700 900123; Sex: Female, Male; "NHS number (CHI or H&C number) (optional)". | In a browser set to British English the field sent **2021-03-07** (7 March): conforms. The new identifier label is on the screen. |
| `06-new-patient-browser-en-US.jpg` | The same form, the same keys, a browser set to American English. The picture is **identical**: 07/03/2021. | The field sent **2021-07-03** (3 July). The same digits on the same British screen mean a different date of birth, and nothing on the screen says so. This is Core finding 1, seen. |
| `07-patient-file.jpg` | Date of birth 07/03/2021; Age 5; Sex Female; Phone number +44 7700 900123; Patient's language English; "Coming appointments": 11/10/2026 14:30–14:40, 12/10/2026 09:30–09:40; "Last saved: 10/10/2026"; tool results and notes dated 10/10/2026. | Day first, 24-hour: conform. (This patient has no identifier, so its line is absent.) |
| `08-visit-note.jpg` (W) | "Visit note · 10/10/2026 02:06"; template Emergency medicine; "This note was drafted by artificial intelligence…"; sections History and presenting complaint, Examination, Assessment, Plan; for this five-year-old the field "Who gave the history (parent or guardian)"; "Vital signs (figures as stated)". | Date and 24-hour time as a clinical record wants them. The guardian field appears below 16. No measurement has a unit in the note (not handled, line 24). |
| `09-tool-dose-arithmetic.jpg` | "Dose arithmetic by body weight"; Body weight (kg); Dose per kilogram (mg/kg); Concentration: milligrams (mg), millilitres (mL); "Accepted range: 0 to 100,000"; with the audit's made-up numbers the result reads 277.50 mg, 555.00 mg, 12.0 hours, 11.6 mL, 23.13 mL. "The tool knows no medicine, no recommended dose and no limit." | kg, mg, mL; a comma for thousands and a point for decimals; "millilitres", "kilogram": conform. |
| `10-tool-expected-height.jpg` | "Expected height from the parents' heights"; Mother's height (cm), Father's height (cm); result 179.0 cm, 170.5 cm, 187.5 cm; the source is cited. | cm: conforms. |
| `11-patient-portal-page.jpg` (W) | On a phone: "Hello, …"; "Your doctor … · Emergency medicine"; "Your appointments": **14:30**, "Sunday, 11/10/2026", "10 min"; day buttons "Sun 11/10", "Mon 12/10"…; "This page is not for emergencies. If you are very unwell, call an ambulance: 999." | 999: conforms. The time is 24-hour and the date is digits where the health service would write "2:30pm" and "Sunday 11 October 2026" for a patient: Core findings 2 and 3, seen. No non-emergency line: Core 4. |
| `12-intake-form-patient.jpg` (W) | On a phone, the guardian form after sending: "You sent the form on 10/10/2026."; "Who is filling in this form"; "The child's height … cm", "The child's weight … kg", temperature "… °C". | Units conform. **A layout fault of the kit, seen and not country-specific:** on a phone the answers stand in a column so narrow that they break letter by letter ("D-i-a-b-e-t-e-s"). Reported under Core. |

Not seen by eye: the settings page, the tools grid of every role, the patient's page with a shared summary, the reminder text, the landing page below its first screen, any screen in a 12-hour browser for the time field, and nothing on paper (the product prints nothing). The walk-through read the settings page, the reminder and the landing anchors as text and found no fault.

## Part D — fixes made in `countries/gb/`

| File | Before | After | Source |
|---|---|---|---|
| `ayarlar.ts`, `rolAdlari['internal-medicine']` | General internal medicine | General (internal) medicine | General Medical Council, list of specialties (Part A, 19) |
| `ayarlar.ts`, `rolAdlari.endocrinology` | Endocrinology and diabetes | Endocrinology and diabetes mellitus | the same |
| `ayarlar.ts`, `rolAdlari.otolaryngology` | Ear, nose and throat (ENT) | Otolaryngology (ENT) | the same ("Otolaryngology"; the everyday abbreviation kept in brackets) |
| `ayarlar.ts`, `rolAdlari.orthopaedics` | Trauma and orthopaedics | Trauma and orthopaedic surgery | the same |
| `ayarlar.ts` `sozler.kimlikEtiketi` and `index.ts` `ulusalKimlik.ad` (now one constant, `GB_KIMLIK_ETIKETI`) | NHS number | NHS number (CHI or H&C number) | NHS Data Dictionary: the NHS number is of England and Wales; Scotland and Northern Ireland use the CHI number and the H&C number (Part A, 13) |
| `sizintiTerimleri.ts` | — | "CHI number" and "H&C number" added to the terms that must not show in another country's build | follows from the label |
| `ayarlar.ts`, `index.ts`: comments | "unverified … from general knowledge" | each setting the audit read on an official page now carries the link and the date, and still says that no person of the country has confirmed it | Part A |
| `gb.test.ts` | 4 tests of the pack's own | 11: the regulator's specialty names and the protected titles; day-first pattern, 24-hour clock, Monday, separators; the wall-clock hour on both sides of the clock change; pounds, metric units and the laboratory units; 999 as a setting and no digit in the sentence; the phone example inside the regulator's drama range and the format rule; the identifier label in the pack, the form and the screen catalogue; the four tools kept off | |
| `docs/COUNTRY-PACK-UNITED-KINGDOM.md` | | regenerated from the pack by `scripts/ulke-en-kayit.mts` (the pack's test requires it) | |

Not changed, on purpose: the 24-hour clock (right for a clinical record; the patient's side cannot be set apart in the pack); the units; the emergency number; the guardian age; the example phone number.

Checks after the fixes, each by its own exit code: type check 0; wall check 0; pack check 0; the pack's own tests 0 (80 of 80); the pack-parameterised tests for `gb` 0 (323 of 323); the record check (`scripts/ulke-en-kayit.mts --ulke gb --denetle`) 0; the country build `NOTYA_COUNTRY=gb npm run build:ulke` 0 with the build proof; the pack-neutral walk-through 0 (329 of 329).

## Findings not fixed: Core (the shared kit)

1. **Date and time entry follow the browser, not the pack.** `components/ulke/uygulama/Hastalar.tsx:132` (date of birth), `Araclar.tsx:130`, `AracKayitlari.tsx:90`, `KlinikYetkiler.tsx:93`, `OnBuro.tsx:160–161, 214`, `components/ulke/portal/HastaFormu.tsx:146`, and every `type="time"` in `Takvim.tsx` (241, 623, 627, 640, 641). To change: one date-entry component of the kit that types in the pack's pattern (the calendar's day field already does: `Takvim.tsx:237` with `gunCoz`), and a time entry that follows `saatBicimi`. A wrong date of birth is a patient-safety matter, not a cosmetic one.
2. **One clock for two readers.** `lib/ulke/arayuz/bicim.ts` (`saatBicimi`) is read by the doctor's screens, the patient's page (`components/ulke/portal/PortalSayfasi.tsx`) and the reminder text (`lib/ulke/arayuz/hatirlatma.ts`). To change: a second pack setting for what a patient reads (`uygulama.hastaSaatBicimi`, say), read by the portal and the reminder.
3. **Dates for patients are digits only.** `tarihYaz` cannot write "6 August 2018". To change: an optional pack pattern for patient-facing dates with the month as a word, and month names in the catalogue.
4. **One number on the patient's page.** `uygulama.portal.acilNumara` (`lib/ulke/tipler.ts:311`) and the two sentences `sayfa.acil`, `sayfa.acilNumara`. To change: an optional second slot for a non-emergency line with its own sentence, able to stay empty.
5. **An amount always has the currency's decimals.** `lib/ulke/arayuz/sayi.ts`, `tutarYaz`. To change: drop ".00" where the pack says so. Nothing is shown today.
6. **The record generator's note on the identifier** still reads 'Label "NHS number"…' (`scripts/ulke-en-kayit.mts:51`, `kimlikNotu`): the regenerated record shows the new label beside the old note. One sentence to update there.
7. **No stones-and-pounds or feet-and-inches entry** (`lib/ulke/intake/tipler.ts`, `olcu`), already recorded for birth weight as the slot `birth_weight_unit`.
8. **Sex has two values** on the patient form (`components/ulke/uygulama/Hastalar.tsx`). Not on the owner's list and not researched; noted for a local clinical lead.
9. **The patient's own answers break letter by letter on a phone** (`components/ulke/portal/HastaFormu.tsx`, the read-only "My answers" view; image `12-intake-form-patient.jpg`). A layout fault for every country.
10. `telefon.cepGecerliMi` and `telefon.ulusalHane` are read by no screen. If a screen starts to refuse numbers by them, a British landline (01, 02, 03) would be refused by this pack's rule: change the rule first.

## Findings not fixed: Shared English set (`countries/_dil/en/`)

1. **One word for a senior doctor in every doctor role** (`girdi.ts`, `kidemliHekim`; `klinik/talimatlar.ts`). In this country the general-practice role should read "general practitioner". To change: let a country state the word per role, as it does role names.
2. **The patient's emergency sentence** (`portal.ts:134–135`): "If you are very unwell, call an ambulance: %." The health service's own wording keeps 999 for life-threatening emergencies. A local reader should set the sentence; with Core 4, a second sentence for the non-emergency line.
3. **Base role names that have no specialty of the same scope here** (`klinik/roller.ts`): thoracic surgery, cardiac and vascular surgery, oncology, psychiatry; and "Audiologist". A country can rename a role but cannot split or drop one.
4. **Wording a native editor may change**, seen on the screens: "Visit" for a consultation or appointment, "Did not attend", "Book". None is wrong; none was changed.

## Part E — medicines (research only; no medicine content was written)

**The register.** The NHS dictionary of medicines and devices (dm+d): "a dictionary of descriptions and codes which cover product information about medicines and devices", the health service's standard for naming medicines between systems. "The NHSBSA authors and maintains dm+d with the support of NHS England", on behalf of the Department of Health and Social Care. — https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/dictionary-medicines-and-devices-dmd

**Format and updates.** XML files, a new release every week (the page listed weekly releases up to 5 October 2026), downloaded from the health service's distribution site TRUD with a free account. — https://isd.digital.nhs.uk/trud/users/guest/filters/0/categories/6/items/24/releases

**Terms of reuse.** The licence shown for the item is the **"Open Government Licence for TRUD"**: the content "may be used under the terms and conditions of the Open Government Licence"; an account is needed, and the page recommends recording how and where the content is used. — https://isd.digital.nhs.uk/trud/users/guest/filters/0/categories/6/items/24/licences . The Open Government Licence itself (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) could not be opened by the audit (the page answered with an error); that it allows commercial use with attribution is from general knowledge and is UNVERIFIED here. One more question for a lawyer: every dm+d identifier is a SNOMED CT code, and SNOMED CT has licence terms of its own.

**Dosing.** No openly reusable official dosing source was found. The national formulary (BNF, and BNF for Children) is published by Pharmaceutical Press, which offers its content to software "as a live feed", "full content files" or extracts through licensing, and lists its authorised licensees. — https://www.pharmaceuticalpress.com/services/content-licensing-and-integration/authorised-bnf-and-bnfc-licensees/ . A licence would be needed. The regulator's product information for each medicine (the summaries of product characteristics) was not researched for reuse terms. dm+d holds names, forms, strengths and packs: it is not a dosing source.

**What the pack would need to take a names list.** The slots exist, empty and switched off: in the tools, `prescription` and `medicine-interactions` (every role), `polypharmacy`, `anticoagulation-review`, `antiseizure-monitoring`, `psychotropic-monitoring`; in the intake form, `medicine_lists`. A names list alone would serve two of them: choosing a medicine by its name when a patient or a doctor types one (`medicine_lists`, and the name search of `prescription`). The kit has no table, loader or search for a register today: it would need a country-scoped names table filled by a script from the weekly files, the release stamp shown with every name, and a rule that a name is offered and never interpreted.

**Risks.** A stale list (weekly releases; a withdrawn product still offered); look-alike names and the generic-against-brand choice the health service makes on purpose for some medicines; a names list read as advice; the medical-device question (a product that offers medicines moves closer to one: legal question 5); the SNOMED terms; and that no pharmacist of the country has looked at any of it.

**Recommended route for the owner to decide.** Take **names only** from dm+d under its Open Government Licence terms — generic names and, where needed, product names, with form and strength, no dose and no interaction — into the two name slots, loaded by a script from each weekly release and stamped with its release; before any of it is switched on, a lawyer confirms the licence terms (including SNOMED CT) and a pharmacist of the country signs the selection. Leave dosing, interactions and the monitoring tools switched off until the owner decides whether to buy a formulary licence.

## Open items

| # | Item | Waits on |
|---|---|---|
| 1 | Date and time entry in the pack's form, not the browser's (Core 1) | Claude, on Kaan's word (a kit change, for every country) |
| 2 | A clock and a date style for what patients read (Core 2, 3) | Claude, on Kaan's word |
| 3 | A place for a non-emergency line on the patient's page, and what it says in each nation (Core 4, Shared 2) | Kaan (kit change), then a local clinician |
| 4 | "General practitioner" instead of "consultant" for the general-practice role (Shared 1) | Claude, on Kaan's word; the word itself: a local clinician |
| 5 | The four roles without a specialty of the same scope, the five clinic-doctor roles, "Audiologist" | a local clinician |
| 6 | The identifier: may a private clinic record it; is the new label right for clinics in Scotland and Northern Ireland | a lawyer; a local clinician |
| 7 | Units a patient types (stones and pounds, feet and inches); the units of prostate-specific antigen, C-reactive protein and sedimentation rate | a local clinician |
| 8 | Guardian form for a competent under-16; the recording-consent sentence; every question of Part A's legal list | a lawyer |
| 9 | Welsh for patient-facing pages | a lawyer, then Kaan |
| 10 | The record generator's stale note on the identifier (Core 6) | Claude |
| 11 | Medicines: the route of Part E | Kaan decides; then a lawyer and a pharmacist |
| 12 | A native editor for every text; the example phone number in the national form | a local person |
| 13 | Standards the audit could not confirm on an official page: the week's first day, paper size, the numbering plan, the 3 3 4 spacing of the NHS number, the units in item 7, the triage scale outside Wales, the non-emergency line in Wales, coding outside the health service in England | Claude can retry the pages; a local person confirms |
