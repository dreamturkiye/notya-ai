# Country audit: New Zealand (`nz`)

Written 2026-10-09 (NOTYA-ULKE-DENETIM-NZ). The owner's instruction: "Go audit all these and make sure they all confirm to each countries standards." This document compares the New Zealand pack (`countries/nz/`, served at `/nz`, language form `en-NZ`) with New Zealand's own standards, says what was fixed inside the country's folder, and lists what could not be fixed there.

**How to read it.** Every standard below was read on 2026-10-09 on the page linked beside it. A page read by a machine is a *source check*; it is not a person of New Zealand confirming anything. Where no official page could be read the item says **UNVERIFIED** and says what was found. Nothing here states that the product meets any law or standard. Every legal matter is written as a question for a lawyer.

**What this audit changed:** only `countries/nz/` (settings, comments, tests), the generated record `docs/COUNTRY-PACK-NEW-ZEALAND.md`, this document and the images under `docs/audit/nz/`. Nothing in the shared kit, the shared English set, another country's folder or any Turkish file. Nothing was merged or deployed; no remote database or account was touched.

Verdicts used in Part B: **CONFORMS** · **DIFFERS** (fixed, or not fixable in the country folder) · **NOT HANDLED BY THE PRODUCT** · **NEEDS A LOCAL PERSON**.

---

## Part A — the standards sheet

### A1. Dates

- **Order: day, month, year.** The national medication charting standard requires the "date prescribed in day/month/year format" and the date of birth "as DAY/MONTH/YEAR". Source: Health Quality & Safety Commission, *National Medication Chart user guide* (2021) — https://www.hqsc.govt.nz/assets/Our-work/System-safety/Reducing-harm/Medicines/Publications-resources/NMC_user_guide_update_2021.pdf
- **Everyday written form:** the government's writing guidance says "Write dates as day, month and year in full", without ordinals, for example "2 March 2020" and "Tuesday 8 July 2025". It gives no all-numeric form. Source: Digital.govt.nz, content design guidance, numbers — https://www.digital.govt.nz/standards-and-guidance/design-and-ux/content-design-guidance/writing-style/numbers
- **Separator in the numeric form:** the slash is what the medication charting standard writes ("day/month/year"). No official page was found that prescribes the separator for everyday use: **UNVERIFIED** beyond that.
- **Data exchange:** the national identity standard stores a date of birth in the ISO 8601 layout (year, month, day). Source: HISO 10046:2024 *Consumer Health Identity Standard* — https://tewhatuora.govt.nz/assets/Publications/HISO-Standards/hiso-10046-2024-Consumer-health-identity-standard.pdf

### A2. Clock

- **Everyday use: 12-hour.** "Show time using a 12-hour clock"; examples "5:30pm (not 17:30hrs)", "12 noon (not 12pm)", "10am to 11am". Source: Digital.govt.nz (link above).
- **Clinical documentation: 24-hour.** "Record time of administration using the 24-hour clock"; "Document times using the 24-hour clock format". Source: HQSC, *National Medication Chart user guide* (link above).
- The two differ. Which one a clinic expects on an appointment calendar is not stated by either source.

### A3. First day of the week

- **Monday**, as ISO 8601 numbers the days of the week. New Zealand's adoption is listed by Standards New Zealand as AS/NZS ISO 8601.1:2021 — https://standards.govt.nz/shop/ASNZS-ISO-8601-12021 . **UNVERIFIED:** the catalogue page could not be read by this job (it answers automated readers with a challenge page), and no government page was found that states the first day of the week on calendars.

### A4. Numbers

- **Decimal point; comma for thousands.** "Use commas to separate thousands when the number is over 999"; example of a decimal amount "$23.95". Source: Digital.govt.nz (link above).

### A5. Currency

- **New Zealand dollar, "$".** "Where the content is only talking about New Zealand dollars, use '$'"; "If users could be confused about the currency being referenced, use NZD$". Source: Digital.govt.nz (link above). ISO code NZD, two decimal places (general knowledge of ISO 4217; not read on an official page: **UNVERIFIED**).

### A6. Time zones

- **Two legal times.** New Zealand standard time is "the time 12 hours in advance of Co-ordinated Universal Time"; "the time for general purposes in the Chatham Islands shall be 45 minutes in advance of New Zealand standard time"; in the daylight period both move one hour ("New Zealand daylight time"). Source: Time Act 1974 — https://www.legislation.govt.nz/act/public/1974/0039/latest/whole.html
- **Daylight saving:** "starts each year at 2am on the last Sunday in September, and ends at 3am on the first Sunday in April." Source: Govt.nz — https://www.govt.nz/browse/recreation-and-the-environment/daylight-saving/
- **Is one fixed zone the right setting? No.** The law sets two times, so a pack with one fixed zone would show a Chatham Islands clinic the wrong time by 45 minutes. Two zones, chosen per account, with the main islands' zone as the default, is the right setting. In the time-zone database these are `Pacific/Auckland` and `Pacific/Chatham`.
- **Outside this audit:** Tokelau, the Cook Islands and Niue keep other times and have health services of their own. Whether the New Zealand pack is ever offered there is a decision for the owner; the pack does not list their zones.
- **How appointment times should be shown:** no official rule was found for appointment software. The government's writing guidance (12-hour, "10am to 11am") is for public content.

### A7. Units for body measurements

- **Weight: kilograms.** "Body weight in kilograms". Source: HISO 10071:2025 *Cardiovascular Disease Risk Assessment Data Standard* — https://www.tewhatuora.govt.nz/assets/For-the-health-sector/HISO-100712025-Cardiovascular-Disease-Risk-Assessment-Data-Standard.pdf
- **Height:** the same standard records "Body height in metres". Centimetres on a clinic screen are common practice, but no official page stating centimetres was read: **UNVERIFIED**.
- **Temperature: °C** — **UNVERIFIED**; no official page stating it was read.
- **Doses:** "in grams, milligrams or micrograms", "microgram" written in full, "unit" written in full. Source: HQSC medication chart user guide (link above). (A naming rule for units only; no dose is stated here.)

### A8. Laboratory units

| Value | Unit | Source |
|---|---|---|
| Serum creatinine | µmol/L | HISO 10071:2025 (link above): "serum creatinine measured in umol/L" |
| Total and HDL cholesterol | mmol/L | HISO 10071:2025: "total cholesterol measurement in mmol/L" |
| Urine albumin-to-creatinine ratio | mg/mmol | HISO 10071:2025: "Urinary ACR laboratory test measurement in mg/mmol" |
| Glycated haemoglobin (HbA1c) | mmol/mol | HISO 10071:2025: "glycated haemoglobin in mmol/mol"; Ministry of Health, *HbA1c: where are you now?*: "The measurement is in millimoles per mole (mmol/mol) instead of a percentage (%)" — https://www.tewhatuora.govt.nz/publications/hba1c-where-are-you-now |
| Estimated glomerular filtration rate | mL/min/1.73 m² | HISO 10071:2025 |
| Prostate-specific antigen | µg/L | Ministry of Health, *Prostate cancer management and referral guidance* (2015) writes every value in µg/L — https://health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf |
| Glucose | mmol/L | **UNVERIFIED** — general knowledge; no official page stating the unit was read |
| Haemoglobin | g/L | **UNVERIFIED** — general knowledge; no official page stating the unit was read |
| C-reactive protein, erythrocyte sedimentation rate | mg/L, mm/h | **UNVERIFIED** — general knowledge |

The national code set for laboratory orders and results is the *New Zealand Pathology Observation Code Sets* (HISO 10004), built on LOINC and SNOMED CT — https://tewhatuora.govt.nz/our-health-system/digital-health/data-and-digital-standards/approved-standards/laboratory-information-standards . Its pages did not state units where this job could read them.

### A9. Blood pressure

- **mmHg, systolic and diastolic.** "the average of two seated measurements in mmHg". Source: HISO 10071:2025 (link above).

### A10. Emergency number and other numbers for a "not for emergencies" notice

- **111.** "111 is the emergency number for Police, Fire and Ambulance." Source: New Zealand Police — https://www.police.govt.nz/contact-us/calling-emergency-111
- **Health advice line: Healthline, 0800 611 116.** "You can call Healthline any day or time for free on 0800 611 116." Source: Health New Zealand — https://info.health.nz/services-support/health-and-disability-providers/healthline . The government's writing guidance uses the same number as its example of a freephone number and writes it "Freephone: 0800 611 116 (NZ only)".
- Whether a patient-facing notice should also name a mental-health line is for a local clinician; none was verified here.

### A11. The national patient identifier (NHI number)

- **Name:** "NHI number" (National Health Index).
- **Format:** seven characters, two forms that "will co-exist indefinitely". The existing form is three letters, three digits and a numeric check digit; the new form is three letters, two digits, one letter and an alphabetic check character. The letters I and O are not used. "NHI numbers starting with the letter Z are reserved as test numbers." Sources: HISO 10046:2024 (link in A1); Health New Zealand, *Upcoming changes* — https://tewhatuora.govt.nz/health-services-and-programmes/health-identity/national-health-index/upcoming-changes-nhi
- **Since when:** "NHI numbers will start to be issued in the new format from 1 July 2026." (same page). That date has passed: numbers of both forms are in use.
- **So:** an NHI number is not a number of digits only, and a field or a search that assumes digits is wrong for it.
- **Who may assign and hold it:** rule 13 of the Health Information Privacy Code 2020 limits the assignment of unique identifiers; its Schedule 2 lists the agencies that may assign the NHI number to a person (Health New Zealand, the Ministry of Health, ACC, hospitals, primary health organisations and health agencies with a contract with or funding from a listed agency). Source: Privacy Commissioner — https://www.privacy.org.nz/privacy-act-2020/codes-of-practice/hipc2020/ and the code's text https://www.privacy.org.nz/assets/Codes-of-Practice-2020/Health-Information-Privacy-Code-2020-website-version.pdf . Whether a private doctor may record it in this product is a question for a lawyer (Part A, questions).
- **What must never be collected:** another agency's unique identifier used as the product's own key. The Privacy Commissioner names "driver's licence numbers, passport numbers, IRD numbers, or National Health Index (NHI) numbers" as unique identifiers, and an organisation "cannot give a person an identifier that another organisation has already assigned". Source: https://privacy.org.nz/privacy-principles/13/ . The product has no reason to ask for an IRD (tax) number, a passport number or a driver licence number and must not.

### A12. Doctors' titles and seniority

- The Medical Council of New Zealand registers doctors in a **general scope** ("typically resident doctors, resident medical officers (RMO) and doctors undergoing vocational training"), a **vocational scope** ("a form of permanent, specialist registration") or a special-purpose scope. Source: https://www.mcnz.org.nz/registration/scopes-of-practice/
- So "specialist" is the council's own word for a vocationally registered doctor. Hospitals also say "consultant" and "senior medical officer", and "house officer" and "registrar" for doctors in training: **UNVERIFIED** here (no official page read).
- The council asks doctors who offer cosmetic procedures not to use "specialist" unless they are registered in an appropriate vocational scope. Source: Medical Council, *Statement on cosmetic procedures* — https://www.mcnz.org.nz/assets/standards/Statement-on-cosmetic-procedures.pdf

### A13. Specialty names: the council's vocational scopes

The council lists 36 vocational scopes. Source: https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/

Anaesthesia · Cardiothoracic surgery · Clinical genetics · Dermatology · Diagnostic and interventional radiology · Emergency medicine · Family planning and reproductive health · General practice · General surgery · Intensive care medicine · Internal medicine · Medical administration · Musculoskeletal medicine · Neurosurgery · Obstetrics and gynaecology · Occupational medicine · Ophthalmology · Oral and maxillofacial surgery · Orthopaedic surgery · Otolaryngology, head and neck surgery · Paediatric surgery · Paediatrics · Pain medicine · Palliative medicine · Pathology · Plastic and reconstructive surgery · Psychiatry · Public health medicine · Radiation oncology · Rehabilitation medicine · Rural hospital medicine · Sexual health medicine · Sport and exercise medicine · Urgent care medicine · Urology · Vascular surgery

How the pack's 30 doctor roles compare is in Part B (B13).

### A14. Allied professions

- The health ministry lists the responsible authorities under the Health Practitioners Competence Assurance Act 2003: among them the **Physiotherapy Board** ("Practice of physiotherapy"), the **Psychologists Board** ("Practice of psychology"), the **Dietitians Board** ("Practice of dietetics") and the **Occupational Therapy Board** ("Practice of occupational therapy"). Source: https://www.health.govt.nz/regulation-legislation/health-practitioners/responsible-authorities
- The Psychologists Board's scopes are "Psychologist", "Clinical Psychologist", "Counselling Psychologist", "Educational Psychologist", "Neuropsychologist", and two training scopes. Source: https://psychologistsboard.org.nz/wp-content/uploads/2026/01/Scopes-of-Practice-and-Qualifications.pdf
- **Audiology does not appear** in the ministry's list: no responsible authority regulates it under that Act. What that means for an audiologist's access to a patient's record is a question for a lawyer.

### A15. Paper size

- **A4.** The High Court Rules 2016, rule 5.3, require that "Paper must be A4 sized" — quoted from the New Zealand Law Foundation's style guide, appendix 6 (https://www.lawfoundation.org.nz/style-guide/appendix-6.html); the rule itself was not read on legislation.govt.nz. No health-sector page stating a paper size was found: **UNVERIFIED** for clinical documents.

### A16. Telephone numbers

- **Country code +64**; a number is written with spaces, for example "Phone: +64 4 456 2390"; "use a non-breaking space to separate parts of a telephone number"; a free number is labelled "Freephone" and followed by "(NZ only)". Source: Digital.govt.nz (link in A1).
- Mobile numbers begin 02 after the trunk prefix 0. Their exact lengths are administered under the Number Administration Deed, whose register this job did not read: **UNVERIFIED** (general knowledge: most have nine digits after the 0; some have eight or ten).
- **A range reserved for fiction:** none was found on any official page. **UNVERIFIED** — the pack's example therefore stays a shape with X in place of digits.

### A17. Postal address

- Street number and name; suburb; town or city followed by the **postcode** (four digits) on the last line. Source: NZ Post, addressing standards — https://nzpost.co.nz/business/shipping-in-nz/addressing-standards . The identity standard's address fields (street address, suburb, town or city, postcode) are in HISO 10046:2024.

### A18. Names, and macrons

- The identity standard holds a name as **title, given name, other given name(s), family name**, with a mark for the **preferred name**; "A person can only have one preferred name at any given time."
- **Macrons:** "All name elements must be encoded in a form that preserves macrons and diacritics"; "UTF-8 is the minimum acceptable standard"; the standard's own example is telling "Kāhu" from "Kahu". Capital letters inside a family name are kept ("MacCall"). Source: HISO 10046:2024 (link in A1).
- **Gender** in the same standard: Female | Wahine, Male | Tāne, Another gender | He ira kē anō, Unspecified or unknown. Ethnicity is recorded with at least one value.

### A19. Medicine naming convention (the convention only)

- No law names one nomenclature: "The medicines legislation does not specify which nomenclature system is to be used to identify the active ingredients." Source: Medsafe — https://medsafe.govt.nz/profs/riss/INN.asp
- Medsafe advocates the international non-proprietary name for labelling, with one stated exception for two substances. Source: Health Quality & Safety Commission — https://hqsc.govt.nz/resources/resource-library/recommended-international-non-proprietary-names-rinns
- In clinical records: "Use approved or generic names only". Source: HQSC medication chart user guide (link in A1).
- The standard names and codes of medicines are those of the New Zealand Universal List of Medicines and the New Zealand Medicines Terminology (Part E).

### A20. Triage scale in emergency departments

- **The Australasian triage scale**, with five categories. Source: Health New Zealand — https://tewhatuora.govt.nz/our-health-system/hospitals-and-specialist-services/emergency-departments/emergency-department-triage

### A21. Diagnosis coding

- **SNOMED CT** is "our principal standard for terminology … the required source of codes and terms"; the migration of general practice from Read codes is still under way. Source: Health New Zealand — https://tewhatuora.govt.nz/health-services-and-programmes/digital-health/snomed-ct-national-release-centre/migrating-from-read-codes-to-snomed-ct
- **Hospital clinical coding** uses ICD-10-AM with ACHI under the Australian Coding Standards and New Zealand's own coding conventions. Source: Health New Zealand — https://tewhatuora.govt.nz/for-health-professionals/data-and-statistics/classification-information/new-zealand-clinical-coding . **UNVERIFIED:** which edition is in force (the page does not say).

### A22. Age of consent to one's own treatment

- **16.** "A consent, or refusal to consent, to any of the following, if given by a child of or over the age of 16 years, has effect as if the child were of full age: … any medical, surgical, or dental treatment or procedure". Source: Care of Children Act 2004, section 36 — https://legislation.govt.nz/act/public/2004/90/en/latest/ (text read at https://www.nzlii.org/nz/legis/consol_act/coca2004128/s36.html).
- The Code of Health and Disability Services Consumers' Rights presumes every consumer competent and names no age (Right 7). Source: Health and Disability Commissioner — https://www.hdc.org.nz/your-rights/about-the-code/code-of-health-and-disability-services-consumers-rights/ . What applies below 16 is a question for a lawyer.

### A23. Spelling

- New Zealand English: the British forms. The council's own list writes "Anaesthesia", "Paediatrics", "Orthopaedic surgery", "Obstetrics and gynaecology" (A13). No native editor has read the pack.

### A24. Languages, and te reo Māori

- "The Māori language is an official language of New Zealand." Source: Te Ture mō Te Reo Māori 2016 (Māori Language Act 2016), section 5 — https://legislation.govt.nz/act/public/2016/17/en/latest/
- Section 9 of that Act guides departments of State ("the Māori language should be used in the promotion to the public of government services"), "as far as is reasonably practicable", and "does not confer on any person any legal right that is enforceable in a court of law". The sections read place no duty on a private business.
- A patient has the right to "effective communication in a form, language, and manner that enables the consumer to understand the information provided", including "a competent interpreter" where necessary and reasonably practicable (Right 5, source in A22). That duty is the provider's.
- New Zealand Sign Language is also an official language (New Zealand Sign Language Act 2006): **UNVERIFIED** here, the Act was not read.
- **As a question, not a requirement:** should the patient's page and the intake form be offered in te reo Māori, and should the landing page carry a Māori greeting or name? For a local person and the owner. This audit writes no te reo Māori text.

### Questions for a lawyer

Each is a question. None is answered here.

1. **Privacy Act 2020 and the Health Information Privacy Code 2020** (Privacy Commissioner — https://www.privacy.org.nz/privacy-act-2020/codes-of-practice/hipc2020/ ; code text linked in A11). Is the vendor a "health agency" under the code, or does it hold information only as the agent of each doctor? What must be in place before the first real patient's data is entered: a written agreement with each doctor or clinic, a privacy impact assessment, a breach-notification procedure, a privacy officer? What must the patient be told (rule 3) when a visit is recorded and drafted by a model?
2. **Holding health information outside New Zealand — the precise question.** This country's database would be hosted in Sydney, Australia; the speech provider and the model provider process a visit's audio and text on their own servers, which may be in other countries; the vendor is not a New Zealand company. (a) When a doctor in New Zealand puts a patient's information into this product, is that a "disclosure" to a foreign person or entity under rule 12 of the code, or is the information treated as still held by the doctor because the vendor and its hosts act only as the doctor's agents (the Commissioner's page on section 11: information held by an agent "will be treated as being held by" the principal — https://www.privacy.org.nz/disclosing-personal-information-outside-new-zealand/ )? (b) If it is a disclosure, which ground of rule 12 can be relied on for Australia and for each other country — comparable safeguards, an agreement (the Commissioner's model clauses), or the patient's authorisation — and what must be written down? (c) Does any contract a private clinic holds with Health New Zealand, a primary health organisation or ACC require onshore storage or a cloud risk assessment, and does the Health Information Security Framework (HISO 10029, with its guidance for suppliers, HISO 10029.4:2025 — https://www.tewhatuora.govt.nz/our-health-system/digital-health/data-and-digital-standards/approved-standards/security-standards ) apply to this vendor? (d) Does rule 5 (storage and security) require anything specific of an overseas host?
3. **Retention.** The Health (Retention of Health Information) Regulations 1996 require a provider to keep health information for "10 years beginning on the day after the date shown" of the last service — https://legislation.govt.nz/secondary-legislation/pco-drafted/1996/343/en/latest/ . Does that duty reach the vendor, what must happen when an account is closed, and how long may the recording of a visit be kept?
4. **Māori data sovereignty.** Te Mana Raraunga's principles say "Whenever possible, Māori data shall be stored in Aotearoa New Zealand" and ask for free, prior and informed consent (https://www.temanararaunga.maori.nz/principles-of-maori-data-sovereignty ; text read at https://online.op.ac.nz/assets/LearningTeachingDevelopment/TMR+Maori+Data+Sovereignty+Principles+Oct+2018.pdf ). The government's cloud guidance asks its own agencies to "consider te ao Māori perspectives for Māori data" (https://www.digital.govt.nz/standards-and-guidance/technology-and-architecture/cloud-services/assess-the-risks/cloud-jurisdictional-risk-guidance ). What do these expect of a private vendor that hosts in Sydney: what clinics must be told, whether hosting in New Zealand must be offered, and what a Māori health provider would ask before using the product?
5. **Recording a consultation.** The Medical Council's guidance on artificial intelligence in patient care (March 2026) says informed consent is required when a doctor uses "an AI tool to record the consultation" and that doctors should "check the accuracy of any AI output" — https://www.mcnz.org.nz/assets/standards/Guidance-on-using-artificial-intelligence-AI-in-patient-care-March-2026.pdf . Is the pack's draft consent sentence enough, must consent be the patient's own and recorded how, and does any other law on recording conversations apply?
6. **Medical-device rules.** The Medicines Act 1981 defines a medical device by its intended "therapeutic purpose", and a sponsor in New Zealand must notify its devices to the WAND database (Medsafe — https://medsafe.govt.nz/regulatory/DevicesNew/1Definition.asp , https://medsafe.govt.nz/regulatory/DevicesNew/2Legislation.asp ). A Medical Products Bill is intended to replace that Act, and Cabinet has decided how it "will regulate … software as a medical device" (Ministry of Health — https://www.health.govt.nz/regulation-legislation/medicines-legislation/regulating-medicines-medical-devices-and-natural-health-products/documents-on-the-medical-products-bill ). Do the clinical calculators, or the drafting of a note, make the product a medical device today or under the Bill, and would the vendor need a sponsor in New Zealand?
7. **Advertising.** The Advertising Standards Authority's Therapeutic and Health Advertising Code (in force for all advertisements from 1 July 2026) requires claims to be "truthful, balanced and not misleading" with substantiation held beforehand, and restricts suggesting endorsement by health professionals; section 58 of the Medicines Act 1981 restricts advertisements that say a practitioner recommends a product (https://asa.co.nz/wp-content/uploads/2025/12/ASA-Therapeutic-and-Health-Advertising-Code-2025.pdf ). Which of these apply to a landing page that sells software to doctors, and may a doctor's testimonial ever be shown?
8. **The NHI number.** May this product hold a patient's NHI number for a private doctor (rule 13 and Schedule 2 of the code), and under which conditions?
9. **Minors.** Section 36 of the Care of Children Act 2004 covers consent from the age of 16. What applies to a patient under 16 who is competent, who may fill in the guardian form, and must the guardian's identity be confirmed?
10. **Who may read a record in a clinic account**, including an audiologist, whose profession has no responsible authority under the Health Practitioners Competence Assurance Act 2003.
11. **Prices.** When the owner sets prices: must an amount shown to a doctor or clinic include goods and services tax, and how must it be labelled?

---

## Part B — what the product does today

"Pack" = `countries/nz/`. "Kit" = the shared screens and rules (`components/ulke/`, `lib/ulke/`), read-only for this audit. "Set" = the shared English texts (`countries/_dil/en/`), read-only.

**How the kit writes things** (read in the code, then seen on screens in Part C):

- **A day** is written from the pack's pattern, digits only: `tarihYaz` in `lib/ulke/arayuz/bicim.ts` → `gunYazDesenle` in `lib/ulke/uygulama/zaman.ts`. The pattern is the pack's `bicim.tarihDeseni`. It is a pack pattern, not `Intl`.
- **A day is typed** in two ways. The appointment form has a text field with the pack's pattern as its hint and parses the pack's pattern (`components/ulke/uygulama/Takvim.tsx:237`, `gunCoz`). Every other date is a native browser date field (`type="date"`): date of birth (`Hastalar.tsx:132`, `OnBuro.tsx:214`), tool dates (`Araclar.tsx:130`, `AracKayitlari.tsx:90`), cover period (`KlinikYetkiler.tsx:93`), a date question of the intake form (`components/ulke/portal/HastaFormu.tsx:146`). A native date field is drawn in the **browser's** order, not the pack's.
- **A time** is stored and typed as 24-hour `HH:MM` in a native time field (`type="time"`, `Takvim.tsx:241` and the working-hours form), drawn as the browser draws it. What a person **reads** follows the pack's `uygulama.saatBicimi`: 24-hour as digits, or 12-hour through `Intl.DateTimeFormat` with the pack's locale (`bicim.yerel`, here `en-NZ`) — `saatGoster` in `lib/ulke/arayuz/bicim.ts`.
- **A number and an amount**: the pack's two separators and the currency's decimal places, no `Intl` (`lib/ulke/arayuz/sayi.ts`). The currency sign and its side are text of the pack.
- **Time zone**: the account's own, one of the pack's list; the pack's default until the account is known (`lib/ulke/arayuz/bicim.ts`, `lib/ulke/uygulama/zaman.ts`, offsets from the platform's time-zone database).
- **Units**: length, weight and temperature from the pack's `uygulama.birimler`; a laboratory value from the pack's `labBirimleri`, converted by the kit with fixed factors (`lib/ulke/araclar/birimler.ts`).
- **Phone**: a free text field with the pack's example as its hint; stored as typed. The pack's mobile rule (`cepGecerliMi`) is applied by no screen of the kit today.
- **Name**: one field, "Full name"; no separate family name, given name or preferred name. Stored encrypted, shown as typed.
- **Patient identifier**: one optional field with the pack's label; stored encrypted; validated only where the pack switches validation on (New Zealand: off).

| # | Item | What the pack says | What the kit does | Verdict |
|---|---|---|---|---|
| B1 | Date order and separator | `bicim.tarihDeseni: 'DD/MM/YYYY'` (`index.ts:63`); hint `tarihOrnegi: 'DD/MM/YYYY'` (`ayarlar.ts:57`) | Writes every day in that pattern | **CONFORMS** |
| B1a | Typing a date | — | Appointment form: the pack's pattern. Date of birth and five other places: the browser's own date field, in the browser's order | **DIFFERS — Core** (C3 below): right on a browser set to New Zealand English, month-first on one set to United States English |
| B2 | Clock | `uygulama.saatBicimi: 12` (`index.ts:125`) | 12-hour text from `Intl` for `en-NZ`: "2:30 pm" | **NEEDS A LOCAL PERSON** — matches the government's everyday rule, not the 24-hour rule of clinical records; the kit has one setting for every screen (Core C5). The written form "2:30 pm" has a space the government's guidance does not write ("2:30pm") — Core C6 |
| B3 | First day of the week | `bicim.haftaBasi: 1` (`index.ts:63`) | Week view starts on that day | **CONFORMS** with ISO 8601; the New Zealand source is UNVERIFIED |
| B4 | Decimal and thousands separators | `'.'` and `','` (`index.ts:63`) | `sayiYaz` uses them | **CONFORMS** |
| B5 | Currency | `NZD`, `$`, two decimals (`index.ts:58`); amount pattern `'$% a month'` (`ayarlar.ts:124`) | No amount is shown: every plan is "by quote" | **CONFORMS**; nothing to see until the owner sets prices |
| B6 | Time zones | default `Pacific/Auckland` (`index.ts:62`); choices `Pacific/Auckland`, `Pacific/Chatham` (`index.ts:121`) | The account chooses in settings; the calendar says "Times are shown in the time zone set for your account."; the patient's page says "Times are shown in your doctor's time zone: Pacific/Auckland." | **CONFORMS** — the two legal times, chosen per account. The zone is shown by its database identifier, not by a name (Core C13) |
| B7 | Body weight, height, temperature | `kg`, `cm`, `C` (`ayarlar.ts:37`) | Tool and intake fields show the pack's unit | **CONFORMS** for weight; centimetres and °C are **UNVERIFIED** (no official page read), for a local clinical lead |
| B8 | Laboratory units | ACR mg/mmol, haemoglobin g/L, creatinine µmol/L, glucose mmol/L, cholesterol mmol/L (`ayarlar.ts:100`); PSA shown in µg/L (`ayarlar.ts:112`) | Converts from the pack's unit; the two KDIGO tools are kept off because of the rounded limits | **CONFORMS** for creatinine, cholesterol, ACR and PSA (sourced); glucose and haemoglobin **UNVERIFIED**, for a local clinical lead |
| B8a | HbA1c | no setting | The kit's field has no unit choice; the tool that reads it is an empty slot (`lab-izlem`) | **NOT HANDLED BY THE PRODUCT** (already recorded) |
| B8b | CRP mg/L, ESR mm/h in the DAS28 tool | the set's labels | fixed units in the kit | **NEEDS A LOCAL PERSON** (unverified) |
| B9 | Blood pressure notation | none | No field of the kit takes a blood pressure; the tool that would is an empty slot (`kardiyo-izlem`) | **NOT HANDLED BY THE PRODUCT** |
| B10 | Emergency number | `uygulama.portal.acilNumara: '111'` (`index.ts:116`) | The patient's page writes the set's sentence with the number | **CONFORMS** (source-checked; still to be confirmed by a person) |
| B10a | Health advice line (Healthline) | no setting exists for it | One number only on the patient's page | **NOT HANDLED BY THE PRODUCT — Core** (C7) |
| B11 | Identifier label | `'NHI number'` (`ayarlar.ts:53`, `index.ts:68`) | Shown as the field's label | **CONFORMS** |
| B11a | Identifier format | optional free text, never validated, `hane: 0` (`index.ts:68`, `:128`) | The field asks a phone or tablet for the **number pad** (`inputMode="numeric"`, `Hastalar.tsx:145`); the patient search matches an identifier by its **digits only** (`lib/ulke/uygulama/hastalar.ts:167`) | **DIFFERS — Core** (C1, C2): an NHI number has letters |
| B11b | Never collected: tax, passport, licence numbers | none asked | none asked; the intake form asks for no identity, policy or insurance number | **CONFORMS** (held by a new test) |
| B12 | Senior-doctor word | `kidemliHekim: 'specialist'` (`ayarlar.ts:62`) | Opens the instruction to the model for every doctor role: "You are an experienced specialist." | **CONFORMS** with the council's wording; whether a general-scope doctor's notes should be drafted under that word is for a local clinical lead |
| B13 | Specialty names | see the table below | Role names are shown at first login, on the landing page and in the tools area | 3 **DIFFERED and were fixed**; 16 **CONFORM**; the rest **NEED A LOCAL PERSON** or are a finding for the shared set |
| B14 | Allied professions | Physiotherapist, Clinical psychologist, Dietitian, Occupational therapist, Audiologist (the set's names) | shown as written | **CONFORMS** for four; audiologist is not a profession regulated under the 2003 Act — **NEEDS A LOCAL PERSON** and a lawyer |
| B15 | Paper size | none | The country kit prints nothing and makes no PDF | **NOT HANDLED BY THE PRODUCT** |
| B16 | Phone format and country code | `+64`, nine national digits, example `+64 2X XXX XXXX`, mobile rule (`index.ts:64`, `:34`) | Example shown as the field's hint; nothing validated | **CONFORMS** in form; the lengths and the absence of a fiction range are **UNVERIFIED** |
| B17 | Postal address and postcode | none | No address is collected | **NOT HANDLED BY THE PRODUCT** |
| B18 | Name fields | `adAlanlari: { ikinciAd: false }` (`index.ts:127`) | One "Full name" field | **NOT HANDLED BY THE PRODUCT — Core** (C8): no family name, given name or preferred name |
| B18a | Macrons | — | Stored and shown as typed (seen on screen, Part C) | **CONFORMS** |
| B18b | Finding a name with a macron | was: no rule (plain lower case), so "potae" did not find "Pōtae" | The kit folds names with the pack's `aramaKatla` | **DIFFERED — fixed** in the pack (`index.ts:47`, `:103`) |
| B18c | Sex / gender | the set's label "Sex" with "Female" and "Male" | Two choices, optional | **DIFFERS — Core** (C8): the identity standard records gender with four values |
| B19 | Medicine naming | no medicine is named anywhere | The instruction to the model says "Leave the names of medicines as they were said." | **CONFORMS** (no convention is imposed); a register is an empty slot — Part E |
| B20 | Triage scale | the ESI tool is kept off (`ayarlar.ts:105`) | not offered | **CONFORMS**; the slot's sentence said the scale was unknown — **fixed** to state it |
| B21 | Diagnosis coding | none | An empty slot (`diagnosis-coding`) | **NOT HANDLED BY THE PRODUCT** (correctly a slot) |
| B22 | Guardian age | `veliYasi: 16` (`ayarlar.ts:29`, `index.ts:129`) | The guardian wording and the guardian form apply below it | **CONFORMS** with section 36; what applies under 16 is for a lawyer |
| B23 | Spelling | `en-NZ`, the British base | converted when the pack loads | **CONFORMS** by the pack's test; no native editor has read it — **NEEDS A LOCAL PERSON** |
| B24 | Patient languages; te reo Māori | `hastaDilleri: ['en']` (`index.ts:102`) | The patient's page and the intake form are in English only | **NEEDS A LOCAL PERSON** (a question, A24) |
| B25 | Appointment defaults | 09:00–17:00, Monday to Friday, 30 minutes, lunch 12:00–13:00, no public holidays (`index.ts:107`) | An account changes all of it | **NEEDS A LOCAL PERSON** — no standard exists; public holidays are absent on purpose |
| B26 | Example phone number | a shape, `+64 2X XXX XXXX` | shown as a hint on the landing page and the patient form | **CONFORMS** with the pack's own rule (it can be nobody's number); no reserved range was found |
| B27 | Portal link validity | 30 days (`index.ts:116`) | — | **NEEDS A LOCAL PERSON** (the owner; a lawyer for how long access may stand) |

### B13 in detail: the pack's roles against the council's vocational scopes

| Role key | Name shown before | Name shown now | The council's list | Verdict |
|---|---|---|---|---|
| `emergency-medicine` | Emergency medicine | same | Emergency medicine | CONFORMS |
| `family-medicine` | General practice | same | General practice | CONFORMS |
| `anaesthesia` | Anaesthesia | same | Anaesthesia | CONFORMS |
| `neurosurgery` | Neurosurgery | same | Neurosurgery | CONFORMS |
| `paediatric-surgery` | Paediatric surgery | same | Paediatric surgery | CONFORMS |
| `internal-medicine` | General medicine | **Internal medicine** | Internal medicine | DIFFERED — fixed |
| `dermatology` | Dermatology | same | Dermatology | CONFORMS |
| `general-surgery` | General surgery | same | General surgery | CONFORMS |
| `ophthalmology` | Ophthalmology | same | Ophthalmology | CONFORMS |
| `obstetrics-gynaecology` | Obstetrics and gynaecology | same | Obstetrics and gynaecology | CONFORMS |
| `otolaryngology` | Otolaryngology, head and neck surgery | same | Otolaryngology, head and neck surgery | CONFORMS |
| `orthopaedics` | Orthopaedic surgery | same | Orthopaedic surgery | CONFORMS |
| `paediatrics` | Paediatrics | same | Paediatrics | CONFORMS |
| `plastic-surgery` | Plastic surgery | **Plastic and reconstructive surgery** | Plastic and reconstructive surgery | DIFFERED — fixed |
| `psychiatry` | Psychiatry | same | Psychiatry | CONFORMS |
| `radiology` | Radiology | **Diagnostic and interventional radiology** | Diagnostic and interventional radiology | DIFFERED — fixed |
| `urology` | Urology | same | Urology | CONFORMS |
| `sports-medicine` | Sport and exercise medicine | same | Sport and exercise medicine | CONFORMS |
| `rehabilitation-medicine` | Rehabilitation medicine | same | Rehabilitation medicine | CONFORMS |
| `endocrinology`, `infectious-diseases`, `gastroenterology`, `respiratory-medicine`, `cardiology`, `nephrology`, `neurology`, `rheumatology` | as the set names them | same | **None of the eight is a vocational scope.** The list has "Internal medicine" | NEEDS A LOCAL PERSON — these are fields physicians work in, not registration scopes; whether each should be offered as a role of its own is for a local clinical lead |
| `oncology` | Oncology | same | "Radiation oncology" is a scope; "Oncology" is not | NEEDS A LOCAL PERSON — the role's tools are about treatment cycles and side effects, so it is not radiation oncology; the right local name is not established |
| `thoracic-surgery` | Thoracic surgery | same | "Cardiothoracic surgery" | DIFFERS — shared set (S1): not fixable by a name |
| `cardiovascular-surgery` | Cardiac and vascular surgery | same | "Cardiothoracic surgery" and "Vascular surgery" are two scopes | DIFFERS — shared set (S1): the set divides chest, heart and vessels differently from New Zealand |
| `hair-transplant`, `aesthetic-surgery`, `aesthetic-medicine`, `clinic-dermatology`, `longevity` | Hair transplantation, Cosmetic surgery, Cosmetic medicine, Dermatology (clinic), Preventive and longevity medicine | same | None is a scope. The council speaks of "cosmetic procedures" in two categories and says who may perform each | NEEDS A LOCAL PERSON and a lawyer — the names claim no registration, but offering "Cosmetic surgery" or "Cosmetic medicine" as what an account *is* should be read against the council's statement (A12) |

Scopes of the council's list for which the pack has **no role**: Cardiothoracic surgery, Clinical genetics, Family planning and reproductive health, Intensive care medicine, Medical administration, Musculoskeletal medicine, Occupational medicine, Oral and maxillofacial surgery, Pain medicine, Palliative medicine, Pathology, Public health medicine, Radiation oncology, Rural hospital medicine, Sexual health medicine, Urgent care medicine, Vascular surgery. Whether any should exist (urgent care and rural hospital medicine are specific to New Zealand) is for the owner with a local clinical lead.

### Count

The table above has 36 lines (B1 to B27 with their sub-lines). Counting each line once, by its main verdict:

- **19 conform:** B1, B3, B4, B5, B6, B7, B8, B10, B11, B11b, B12, B14, B16, B18a, B19, B20, B22, B23, B26. (B3, B7, B8 and B16 conform with a part that no official page confirmed, noted beside each; B14 conforms for four of the five professions; B20's slot sentence was corrected.)
- **5 differ:** B13 and B18b were fixed in the pack (three role names; finding a name with a macron). B1a, B11a and B18c are in the shared kit and are not fixed (typed dates follow the browser; the identifier field and search assume digits; two choices for sex). Two further roles of B13 differ in the shared English set.
- **7 are not handled by the product:** B8a, B9, B10a, B15, B17, B18, B21.
- **5 need a local person:** B2, B8b, B24, B25, B27 — and, inside B13 and B14, the roles that are no vocational scope and the audiologist.

---

## Part C — what was seen on real screens

**How it was run.** The fixed pack was built on this machine (`NOTYA_COUNTRY=nz npm run build:ulke`: built, type check included; build proof "the `nz` pack present, no other country's pack"). The built application was started on this machine against the repository's stand-ins (a stand-in database and stand-in providers; nothing left the machine, and no account was created anywhere else). The pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`) passed **329 of 329 checks**. The screens were then opened with the installed Playwright Chromium and read; twelve images are in `docs/audit/nz/`.

**Seen once, after the fixes.** The machine was shared with other builds and two earlier builds of the unfixed pack were killed for lack of memory, so the screens were not seen *before* the fixes. What the fixes change on screens is three role names and the name search; both are reported below as seen after the fix, and their earlier state is known from the pack's source only.

The dates and times below are New Zealand's on the day of the run (10 October 2026 in `Pacific/Auckland`, daylight time).

| Image | Screen | What was read on it | Against Part A |
|---|---|---|---|
| `01-landing.jpg` | Landing page (first screen) | "A clinical assistant for doctors"; "Request a quote"; "In English"; "Note templates for 40 specialties and professions". In the page's full text: the role names "General practice", "Internal medicine", "Plastic and reconstructive surgery", "Diagnostic and interventional radiology", "Cosmetic medicine"; the phone hint `+64 2X XXX XXXX`; "Price by quote", "By invitation. By quote."; no amount of money anywhere. Page language `en-NZ` | Role names as fixed (B13). No price seen. Only the first screen is in the image; the rest of the page was searched as text for these points and was not read sentence by sentence |
| `02-signup.jpg` | Sign-up | Invitation code, Full name, Email address, Password, Password (again) | Nothing of a country's format on it; sign-up is by invitation |
| `03-new-patient-form-browser-nz-english.jpg` | New patient, in a browser whose interface language is New Zealand English | "Full name": **Wiremu Pōtae** typed and kept; "Date of birth" 7 March 2011 drawn **07/03/2011**; phone hint `+64 2X XXX XXXX`; "Sex": Female, Male; "NHI number (optional)": ZZZ00AX accepted | Day first: conforms. Macron kept |
| `04-new-patient-form-browser-us-english.jpg` | The same form, the same pack, in a browser whose interface language is United States English | The same date of birth drawn **03/07/2011** — month first | **DIFFERS (Core C3).** The field is the browser's own; the pack's pattern does not reach it. On the patient file the same date is written 07/03/2011 |
| `10-patient-file.jpg` | Patient file | Heading "Wiremu Pōtae"; "Date of birth 07/03/2011"; "Age 15"; "Sex Male"; "Patient's language English"; "NHI number ZZZ00AX"; "Coming appointments 11/10/2026 9:00 am–9:30 am"; "The link works until 09/11/2026"; the invitation text holds no link and no PIN | Dates day/month/year: conforms. 12-hour clock. Macron shown. The stand-in database held no plain-text name (stored encrypted) |
| `05-calendar-day.jpg` | Calendar, one day | "Sunday, 11/10/2026"; "This is not a working day."; "9:00 am–9:30 am Wiremu Pōtae"; "2:30 pm–2:40 pm"; "Times are shown in the time zone set for your account." The week view (read as text, no image) runs from "Mon · 05/10" to "Sun · 11/10" | Day first; week from Monday; 12-hour clock written "9:00 am" (the government's guidance writes "9am" and "5:30pm": Core C6) |
| `06-booking-form.jpg` | Booking an appointment | "Date": a text field with the hint DD/MM/YYYY, 15/10/2026 typed; "Time": the browser's own time field, drawn **"03:45 PM"** by this browser; lengths from 10 to 90 min. A month-first date typed on purpose (10/15/2026) was refused: "The date is not valid. Enter it as DD/MM/YYYY." | The date follows the pack: conforms. The time field follows the browser, not the pack (Core C4) |
| `07-visit-note.jpg` | An approved visit note (the walk-through's synthetic note, emergency medicine) | "Visit note · 10/10/2026 1:51 pm"; "Language of the note: English"; headings "History and presenting complaint", "Examination", "Assessment", "Plan"; "Vital signs (figures as stated)"; "This draft was written by artificial intelligence. Read it and correct it where needed before you share it." | Date and clock as the pack says. The note itself has no measurement field and no unit |
| `08-tool-dose-arithmetic-units.jpg` | Tool: dose arithmetic by body weight (paediatrics) | "Body weight (kg)", "Dose per kilogram (mg/kg)", "(mg)", "(mL)"; "Accepted range: 0 to 1,000", "0 to 100,000"; "The tool knows no medicine, no recommended dose and no limit." | Kilograms and SI units; comma for thousands: conforms |
| `09-tool-psa-units.jpg` | Tool: prostate-specific antigen, rate of change (urology) | "Earlier value (µg/L)", "Latest value (µg/L)"; result "1.30 µg/L per year", "365 days"; the two dates are the browser's own date fields | µg/L: conforms (B8). Decimal point. Dates typed in the browser's order (Core C3) |
| `11-patient-portal-page.jpg` | The patient's page, phone width (a patient aged 15) | "Hello, Wiremu Pōtae"; "QA Shifokor Bir · Emergency medicine"; "The doctor asks you to answer a few questions about your child before the visit."; "9:00 am Sunday, 11/10/2026 30 min"; "Times are shown in your doctor's time zone: **Pacific/Auckland**."; days offered "Sun 11/10", "Mon 12/10" and so on; "This page is not for emergencies. If you are very unwell, call an ambulance: 111." | Guardian wording below 16: as the pack says. Emergency number 111: conforms. The time zone is named by its database identifier, not in words a patient uses (Core C13). No health advice line (Core C7) |
| `12-intake-form-questions.jpg` | Intake form of an adult patient, part 4 of 6 | "Your height" **cm**, "Your weight" **kg**, "If you took your temperature today, what was it?" **°C**. The other parts (read as text, no image): reason for the visit; long-term conditions, operations, medicines and allergies as questions with free text; lifestyle; a contact person; the role's own questions | Units as the pack says. No identity, tax or insurance number is asked. No medicine is named |

**Also seen, without an image**

- **Settings:** the account chooses between two zones, shown as "Pacific/Auckland" and "Pacific/Chatham" (the database identifiers, not names: Core C13).
- **Searching for a patient:** "potae", typed without the macron, found "Wiremu Pōtae", and so did "Pōtae": the pack's new search rule at work. Searching by the NHI number "ZZZ00AX" found **nothing** (Core C2).
- **The identifier field** carries `inputmode="numeric"` in the page (read from the page; what a phone's keyboard then shows was not seen: Core C1).
- **Tools area for emergency medicine:** "Critical conditions checklist" and "Follow-up list"; no triage tool, as the pack says.
- **The consent screen of the intake form** for a child: "You are filling in this form as the child's parent or guardian. Filling it in is voluntary." (a draft, not read by a lawyer).

**Not seen**

- The screens **before** the fixes (see above).
- A phone or tablet keyboard; anything printed (the country kit prints nothing).
- An account set to the Chatham Islands zone, and a clock change for daylight saving. (The pack's test checks both zones' offsets in winter and in summer.)
- The time field in a browser whose interface language is New Zealand English.
- Real speech: the walk-through uses stand-ins for the speech and model providers, so no real note was drafted.
- The clinic and front-desk screens: walked by the walk-through's checks, not looked at by eye.
- A deployed site: none exists for New Zealand, and none was touched.

---

## Part D — fixes made (all inside `countries/nz/`)

| File | Before | After | Source |
|---|---|---|---|
| `countries/nz/ayarlar.ts` (`rolAdlari`) | `'internal-medicine': 'General medicine'` | `'internal-medicine': 'Internal medicine'` | Medical Council list of vocational scopes (A13) |
| `countries/nz/ayarlar.ts` (`rolAdlari`) | no entry: the set's "Plastic surgery" | `'plastic-surgery': 'Plastic and reconstructive surgery'` | same |
| `countries/nz/ayarlar.ts` (`rolAdlari`) | no entry: the set's "Radiology" | `radiology: 'Diagnostic and interventional radiology'` | same |
| `countries/nz/ayarlar.ts` (`araclar.kapali['esi-triyaj']`) | "Which triage scale emergency departments in New Zealand use … is for a local emergency physician to say." | States that emergency departments use the Australasian triage scale, that the ESI tool is therefore off, and what is still needed. The tool stays off; no content of any scale is written | Health New Zealand (A20) |
| `countries/nz/index.ts` (`uygulama.aramaKatla`) | absent: a search compared names in plain lower case, so "potae" did not find "Pōtae" | `nzAramaKatla`: for comparison only, lower case with macrons and apostrophe variants dropped. Nothing stored or shown changes | HISO 10046:2024 requires names to keep their macrons (A18); the search rule is the pack's own setting (checklist E10) |
| `countries/nz/index.ts`, `countries/nz/ayarlar.ts` (comments) | every setting "UNVERIFIED" | each setting compared with an official page is marked SOURCE-CHECKED with what the page says: emergency number, the two legal times, day-first dates, the NHI number's two forms, guardian age, creatinine / cholesterol / ACR / PSA units, the dollar sign, the senior-doctor word. The header "MACHINE-WRITTEN AND UNVERIFIED" stands | Part A |
| `countries/nz/nz.test.ts` | 74 cases | 81 cases: seven new "AUDIT" cases hold the scope names, the emergency number and the two zones' offsets, both NHI forms kept as typed and no tax number asked, the formats, the macron search rule, the mobile rule, and the triage slot | — |
| `docs/COUNTRY-PACK-NEW-ZEALAND.md` | generated from the pack | generated again (`NOTYA_COUNTRY=nz npx --yes tsx scripts/ulke-en-kayit.mts`): three role names, the triage slot's sentence, 25 texts of the country's own instead of 23 | — |

**Not changed, on purpose:** the 12-hour clock (two official sources point two ways: for a local clinical lead); the example phone number (no reserved range found); the guardian age; every unit; the consent sentences (for a lawyer); "Cosmetic medicine" and the roles that are no vocational scope (not confirmable as wrong from a source); the leak list.

Gates, each by its own exit code: `countries/nz/nz.test.ts` 81 of 81; `node scripts/ulke-duvarlari.mjs` 0; `NOTYA_COUNTRY=nz node scripts/ulke-paket-denetimi.mjs` 0; the record check inside the pack's test 0. The pack-parameterised tests for New Zealand (`node scripts/ulke-test.mjs --paket nz`): 323 of 323, exit 0. `NOTYA_COUNTRY=nz npm run build:ulke`: exit 0, with its type check and the build proof. The pack-neutral walk-through on the built pack: 329 of 329, exit 0. A separate `npx tsc --noEmit` was not run: the shared machine could not hold it beside the other countries' builds; the build's own type check is the type check reported here.

---

## Core — findings in the shared kit (not fixed: outside this audit's reach)

| # | Where | What is wrong for New Zealand | What would have to change |
|---|---|---|---|
| C1 | `components/ulke/uygulama/Hastalar.tsx:145` | The identifier field carries `inputMode="numeric"`: a phone or tablet shows the number pad, and an NHI number (letters and digits) cannot be typed without switching keyboards | Let the pack state the identifier's alphabet (for example a field on `ulusalKimlik`), and set `inputMode` and `autoCapitalize` from it |
| C2 | `lib/ulke/uygulama/hastalar.ts:167`; the same pattern in `lib/ulke/klinikHesabi/onBuro.ts` and `paylasim.ts` | The patient search matches an identifier by its digits only and needs three digits: "ZZZ00AX" is never found by its NHI number, and a three-digit fragment matches unrelated patients | Compare the identifier as text (case-folded) where the pack's identifier is not all digits |
| C3 | `Hastalar.tsx:132`, `OnBuro.tsx:160` and `:214`, `Araclar.tsx:130`, `AracKayitlari.tsx:90`, `KlinikYetkiler.tsx:93`, `components/ulke/portal/HastaFormu.tsx:146` | Dates are typed in the browser's own date field, drawn in the **browser's** language order. A doctor in New Zealand whose browser is set to United States English sees month/day/year for a date of birth beside dates the product writes day/month/year | Use the appointment form's approach everywhere (`Takvim.tsx:237`): a text field with the pack's pattern as its hint, parsed by `gunCoz` |
| C4 | `Takvim.tsx:241`, `:623`, `:627`, `:640`, `:641`; `OnBuro.tsx:161` | Times are typed in the browser's own time field: 12- or 24-hour by the browser, not by the pack's `saatBicimi` | A text field or select that follows the pack's clock |
| C5 | `lib/ulke/tipler.ts` (`uygulama.saatBicimi`), `lib/ulke/arayuz/bicim.ts` | One clock setting for every screen. New Zealand's clinical records use the 24-hour clock and public writing the 12-hour clock | Two settings (clinic screens, patient's page), or the account's own choice |
| C6 | `lib/ulke/arayuz/bicim.ts` (`onIkilik`) | The 12-hour text comes from the runtime's data for `en-NZ`: "2:30 pm". The government's guidance writes "2:30pm" | Let the pack state its day-period form, or accept the difference |
| C7 | `lib/ulke/tipler.ts` (`uygulama.portal.acilNumara`), `components/ulke/portal/` | The patient's page can name one number. New Zealand has a free health advice line distinct from the emergency number, and the "not for emergencies" notice has no place for it | A second, optional setting and sentence (advice line), with the same rule that no digit is written into a sentence |
| C8 | `components/ulke/uygulama/Hastalar.tsx`, `lib/ulke/uygulama/hastalar.ts` | One "Full name" field: no family name, given name or preferred name. Sex has two choices; the identity standard records gender with four values, and no ethnicity is recorded | Pack-chosen name fields and choice lists |
| C9 | `lib/ulke/araclar/` (HbA1c field) | No unit choice: New Zealand reports mmol/mol | Already recorded in the pack's slot `lab-izlem` |
| C10 | `lib/ulke/araclar/` (the two KDIGO tools) | Classify in mg/g after an exact conversion; the published limits in mg/mmol are rounded | Already recorded in the pack (`ayarlar.ts`, `kdigo-evre`) |
| C11 | `scripts/ulke-en-kayit.mts` (the record generator) | Prints "UNVERIFIED" beside every setting and "none was checked against the country's official list of specialties", which is no longer true for the source-checked items | Let a pack mark a setting as source-checked, with its source, and print that |
| C12 | `lib/ulke/tipler.ts` (`telefon.cepGecerliMi`) | No screen applies the pack's mobile rule; a phone number is stored as typed | Decide whether to validate; a landline is a legitimate patient phone number, so the rule should not be applied to patients as it stands |
| C13 | `components/ulke/uygulama/Ayarlar.tsx`, the patient's page (`components/ulke/portal/`), the set's sentence at `countries/_dil/en/portal.ts:141` | A time zone is shown by its database identifier: the settings offer "Pacific/Auckland" and "Pacific/Chatham", and a patient reads "Times are shown in your doctor's time zone: Pacific/Auckland." | Let a pack name each of its zones in words (for example "New Zealand time", "Chatham Islands time") and show the name |

## Shared English set — findings (not fixed: `countries/_dil/en/` is shared by five countries)

| # | Where | What | What would have to change |
|---|---|---|---|
| S1 | `countries/_dil/en/klinik/roller.ts` | The role set divides surgery of the chest, heart and vessels into `thoracic-surgery` and `cardiovascular-surgery`. New Zealand registers "Cardiothoracic surgery" and "Vascular surgery". No renaming inside the country folder makes the two roles match | A way for a country to switch a role off, or to re-divide roles, with the role's tools and templates following |
| S2 | same file | Eight medical subspecialties and `oncology` are offered as roles of their own; in New Zealand none is a vocational scope (they sit inside "Internal medicine"; "Radiation oncology" is separate) | The same; or a local clinical lead confirms that offering them as roles is what doctors expect |
| S3 | same file | New Zealand scopes with no role, two of them particular to the country: "Urgent care medicine" and "Rural hospital medicine" | Roles a single country can add |
| S4 | `countries/_dil/en/portal.ts:135` | "If you are very unwell, call an ambulance: %." In New Zealand 111 is one number for police, fire and ambulance; the sentence is right but was read by no local person | A local reader |
| S5 | `countries/_dil/en/uygulama.ts:92` | The label "Sex" with two choices (see C8) | With C8 |
| S6 | the slots `family-referral`, `stroke-red-flags`, `psychiatry-safety-triage`, `urology-emergency-triage` | Each says "the emergency number confirmed by a local source" is missing. The number is now source-checked (A10); the rest of each slot is still missing | Nothing until a local clinician supplies the rest |
| S7 | `countries/nz/nz.test.ts` (the pack's own list of other countries' words) | "consultant" is treated as a word of another country. New Zealand hospitals use it too | Left as it is: the list only keeps the word off New Zealand's screens, which does no harm. Named here so that nobody reads it as a statement about New Zealand usage |

---

## Part E — medicines (research only; no medicine content is written)

**The official register and terminology**

- **New Zealand Universal List of Medicines (NZULM)** with the **New Zealand Medicines Terminology (NZMT)**. "A dictionary of trusted, standardised information about medicines" approved for supply in New Zealand, bringing together "medicines information from Medsafe, PHARMAC and the Pharmacy Guild", standardised in the NZMT's "common medicines language". Publisher: "a service of the New Zealand Ministry of Health" on its own site, described today on Health New Zealand's digital health pages. Sources: https://nzulm.org.nz/about ; https://www.tewhatuora.govt.nz/our-health-system/digital-health/emedicines-and-the-new-zealand-e-prescription-service/nz-universal-list-of-medicines
- **Format and updates:** the NZMT is "the standard code system used to identify each medicine" in the NZULM (canonical address `http://nzmt.org.nz`), served by the New Zealand Health Terminology Service as a FHIR interface with seven kinds of concept (generic and trade products at three levels, and the packaged trade product) and maps between them; that service "source[s] NZMT content once per month from the latest NZULM release". A monthly distribution list also exists. Source: https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/terminology-service/nzmt
- **Terms of reuse:** the pages say only "The NZULM is free to use" and carry "(c) Crown Copyright, New Zealand Ministry of Health". **No licence is named** on the pages this job could read: not a Creative Commons licence, and nothing about use inside a commercial product. **UNVERIFIED** — the terms must be asked for in writing. The terminology is built on SNOMED CT, whose own licence conditions may apply: also to be asked.
- **Medsafe's product register** (approved medicines, data sheets, consumer medicine information) — https://medsafe.govt.nz/DbSearch/infoSearch . Terms (https://medsafe.govt.nz/other/siteinfo.asp): Crown copyright material "may be reproduced for personal, academic or clinical use without formal permission or charge"; "Information from the Medsafe web site must not be used in a commercial context without the written permission of Medsafe"; data sheets and consumer medicine information "remain the property of the sponsor (pharmaceutical company)", and for commercial purposes one "should contact the medicine sponsor for permission".
- **Pharmac's Pharmaceutical Schedule** (what is funded) — not read by this audit: **UNVERIFIED**.

**Dosing information**

- Not openly reusable from any source found. The **New Zealand Formulary** (and its children's edition) is "an independent resource for health professionals", "free of charge to New Zealand health professionals" to read; it "builds on" the NZULM and includes interaction content licensed from other publishers. Source: https://www.health.govt.nz/our-work/digital-health/other-digital-health-initiatives/emedicines/new-zealand-formulary . Its own terms page could not be read by this job: **UNVERIFIED**, but nothing read suggests its content may be copied into a commercial product without a licence. Medsafe data sheets belong to each sponsor (above). **A licence would be needed** for any dosing content, and none should be assumed.

**What the pack would need to take a names list**

Empty, switched-off slots already exist for it: the tools `prescription`, `medicine-interactions`, `polypharmacy`, `anticoagulation-review`, `antiseizure-monitoring` and `psychotropic-monitoring`, and the intake slot `medicine_lists`. A names list would fill one of them with: the names and codes of the generic and trade products, the release it came from and its date, the licence it is used under, and who of New Zealand checked the import. The kit would need a place to hold a dated, replaceable list per country (it has none today).

**Risks**

- The terms for commercial reuse are not stated: using the list before they are in writing is the main risk.
- A list goes stale: the register changes monthly, and a name that has been withdrawn or changed must not linger.
- Brand names, generic names and unapproved medicines supplied under special provisions are different things in the register; mixing them up misleads.
- A list shown inside a note-drafting product can be read as a recommendation; with interaction or dose content it moves towards the medical-device question (question 6).
- Names handed to the model can be altered by it; the pack's instruction today is to leave names as they were said.

**Recommendation — one route for the owner to decide on**

Write to Health New Zealand's terminology service and the NZULM team and ask, in writing, for the terms under which a commercial product may use the names and codes of the NZMT. If the answer allows it, take **names only** (no dose, no interaction, no subsidy) through the terminology service's interface as a dated, monthly-refreshed search list for the doctor to pick from, in the `prescription` and `medicine_lists` slots, signed off by a local pharmacist or clinician. Leave dosing out of the product and point to the New Zealand Formulary, which clinicians already read free of charge; add dosing only under a signed licence from its publisher.

---

## Open items

| # | Item | Waits on |
|---|---|---|
| 1 | The eleven legal questions of Part A (privacy code and what a vendor needs; holding data in Sydney and with the speech and model providers; retention; Māori data sovereignty; recording consent; medical-device status; advertising; the NHI number; minors; who may read a record; prices and tax) | **a lawyer in New Zealand**, engaged by Kaan |
| 2 | Where New Zealand's database is hosted (Sydney, or a region in New Zealand) | **Kaan**, after the lawyer's answer to question 2 and with question 4 in mind |
| 3 | 12-hour or 24-hour clock on clinic screens (B2) | **a local clinician** |
| 4 | Roles that are no vocational scope; the two surgical roles that do not match; "Cosmetic medicine" and "Cosmetic surgery" as roles; whether urgent care and rural hospital medicine should exist (B13, S1–S3) | **a local clinician**, then Kaan |
| 5 | Units not found on an official page: centimetres, °C, glucose mmol/L, haemoglobin g/L, CRP mg/L, ESR mm/h (B7, B8, B8b) | **a local clinician** (or a local laboratory) |
| 6 | Whether "specialist" is the right word for the model's instruction, and whether "consultant" should be allowed on screens (B12, S7) | **a local clinician** |
| 7 | Whether the patient's page and the intake form should be offered in te reo Māori, and what the landing page should carry (A24) | **Kaan**, with a local person |
| 8 | A second number on the patient's page for the health advice line (C7); the identifier field's keyboard and search (C1, C2); typed dates and times that follow the pack (C3, C4); a clock setting per surface (C5); name fields and gender (C8); the record generator's "unverified" lines (C11); time zones named in words (C13) | **Claude**, in the shared kit, on Kaan's word (each changes every country) |
| 9 | Medicines: the written request for the NZMT's terms of commercial use (Part E) | **Kaan** |
| 10 | The example phone number: a number of a reserved range, if one exists | **a local person** |
| 11 | A native New Zealand editor for every patient-facing text; a clinician per role for templates, questions and tools | **Kaan** (to name them) |
| 12 | Confirming the emergency number and Healthline's number by a person of New Zealand before any patient sees the portal | **a local person** |
| 13 | What could not be verified from an official page, listed here so nobody takes it as checked: the first day of the week; ISO 4217 details; the edition of ICD-10-AM in force; the Number Administration Deed's lengths for mobile numbers; the paper size for clinical documents; the terms of the NZULM, the New Zealand Formulary and Pharmac's schedule; New Zealand Sign Language's status (the Act was not read); hospital titles (consultant, registrar, house officer) | **Claude** can retry the sources; a **local person** can simply confirm |
