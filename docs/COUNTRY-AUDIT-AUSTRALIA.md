# Country audit: Australia (`au`)

Audit of the pack `countries/au/` (served at `/au`, language form `en-AU`) against Australia's own standards. Done on 2026-10-09 on branch `audit/au`, from `feat/ulke-butun` at `d7bc33a0`. Companion to `docs/COUNTRY-PACK-AUSTRALIA.md` (the pack's record, written from the pack by `scripts/ulke-en-kayit.mts`).

**Who did this and what it is worth.** A machine did it, by reading official pages. Nobody in Australia — no clinician, no lawyer, no editor — has read it. A row marked CONFORMS means "the pack matches the page cited beside it", not "approved". Legal matters are written as questions for a lawyer and nothing here is a statement of what the law requires. No clinical reference content was written: no medicine, dose, schedule, protocol, threshold or screening programme.

**How to read a source.** Each standard has the page it was read from. Where a page could not be read by the audit's tools (several government sites refuse automated readers), the row says **UNVERIFIED** and says what was found instead. An UNVERIFIED row was never used to change the pack.

**Scope of the changes.** Only `countries/au/` (four files), the pack's own test, the pack's generated record, this document and the images under `docs/audit/au/` were changed. Nothing was changed in the shared kit (`lib/ulke/`, `components/ulke/`, `app/`), in the shared English set (`countries/_dil/`), in another country's folder or in any Turkish file. Nothing was merged or deployed and no remote system was touched.

---

## Summary

| Verdict | Rows |
|---|---|
| CONFORMS | 19 |
| DIFFERS — fixed in the country's folder | 2 rows (4 values a user sees) |
| DIFFERS — cannot be fixed in the country's folder (reported under "Core" or "Shared English set") | 6 |
| NOT HANDLED BY THE PRODUCT | 11 |
| NEEDS A LOCAL PERSON | 12 |

50 rows, in Part B. The fixes are in Part D. What was seen on screens is in Part C.

---

## Part A — the standards sheet

### A1. Written dates

- Day, month, year. In running text the month is a word: "Use numerals for the day and the year but spell out the month in words." Numeric dates are for tables and tight spaces: "Use numeric dates only in tables or when space is limited." "In Australia and the United Kingdom, the sequence is day, month, year." "Separate the numbers in a numeric date with an unspaced slash, using the format 'day/month/year'." — Australian Government Style Manual, *Dates and time*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/dates-and-time
- ISO form for international exchange (`2020-12-07`): same page.
- Clinical documents: the National Inpatient Medication Chart user guide asks for the date an order was written and prescribes no numeric pattern (ACSQHC, *NIMC User Guide*, section 3.4): https://www.safetyandquality.gov.au/sites/default/files/migrated/NIMC-User-Guide.pdf — a separate national rule for the date pattern on clinical screens was **not found: UNVERIFIED**.

### A2. Clock

- Everyday: 12-hour, "Use 'am' and 'pm' in lower case, with a non-breaking space after the number", a colon between hours and minutes ("9:30 am"); "Use 'noon', 'midday' or 'midnight' instead of '12 am' or '12 pm'." The 24-hour system "if it helps people understand your content" and it "always uses at least 4 digits". — Style Manual, same page as A1.
- Clinical documentation: "Times should be entered using the 24 hour clock which is the universal standard." — ACSQHC, *NIMC User Guide*, section 3.4 (medication charts): https://www.safetyandquality.gov.au/sites/default/files/migrated/NIMC-User-Guide.pdf. This is a rule for medication charts; a general rule for appointment screens of practice software was **not found**.

### A3. First day of the week

- Monday. **UNVERIFIED from a government page.** What was found: the Unicode locale data that browsers and Node carry for `en-AU` gives Monday (checked on this machine: `new Intl.Locale('en-AU').getWeekInfo()` → `firstDay: 1`). The international standard for dates (ISO 8601, adopted in Australia as AS ISO 8601) numbers Monday as day 1; the Standards Australia page was not read.

### A4. Decimal and thousands separators

- Thousands: "Numbers from 1,000 need a comma. Separate the digits into groups of 3". "Don't use a space or non-breaking space instead of a comma." Decimals are written with a point (the page's own examples: "3,547.8 mm"). — Style Manual, *Choosing numerals or words*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/choosing-numerals-or-words
- Pathology reports have their own rendering rules for numbers in the RCPA's SPIA guidelines ("rendering of numeric results"): https://developer.digitalhealth.gov.au/standards/standardised-pathology-informatics-in-australia-spia-guidelines-v4-1 — the guideline's text could not be opened: **UNVERIFIED in detail**.

### A5. Currency

- Australian dollar, code AUD, sign `$` before the amount, two decimal places for cents. **UNVERIFIED from the Style Manual** (its currency page refuses automated readers: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/currency). What was found: the platform's `en-AU` data writes 1234.5 dollars as `$1,234.50`.

### A6. Time zones and how appointment times are shown

- "New South Wales, Victoria, South Australia, Tasmania, and the Australian Capital Territory observe daylight saving." "Queensland, Western Australia, and the Northern Territory do not." Next change dates on the page: Sunday 4 October 2026 (start) and Sunday 4 April 2027 (end); the page names "Eastern Standard Time (AEST)" and "Eastern Daylight Time (AEDT)". — NSW Government, *Daylight saving in NSW*: https://www.nsw.gov.au/about-nsw/daylight-saving
- Three standard times on the mainland (eastern UTC+10, central UTC+9:30, western UTC+8), so with daylight saving five different clock times in summer. **The offsets are UNVERIFIED from a government page** (the Australian Government's own page refuses automated readers: https://info.australia.gov.au/about-australia/facts-and-figures/time-zones-and-daylight-saving). What was found: the time-zone database on this machine gives exactly these offsets for the seven zones of the pack, and the pack's test now holds them.
- Not on the mainland list, **UNVERIFIED**: Lord Howe Island (its own half-hour zone), and the external territories (Norfolk Island, Christmas Island, Cocos (Keeling) Islands). Broken Hill keeps South Australian time.
- Naming a time: abbreviations such as AEST and AEDT; "Add an 'A' … to the front if you think it might be confused with a time zone in another part of the world." — Style Manual, same page as A1.
- How an appointment time should be shown: in the time of the place where the appointment happens, with the zone named when the reader may be elsewhere. This is the audit's reading of the Style Manual, not a quoted rule.

### A7. Units for body weight, height, temperature

- "Australia uses the metric system for most quantities." "The National Measurement Institute oversees Australian units of measurement." Symbols `kg`, `cm`; a non-breaking space between number and unit. — Style Manual, *Measurement and units*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/measurement-and-units ; law: National Measurement Act 1960 (Cth), https://www.legislation.gov.au/C1960A00064/latest/text
- Clinical use: kilograms, centimetres, degrees Celsius. The medication-chart guide writes weights in kilograms ("mg/kg/dose"). Degrees Celsius for body temperature: **UNVERIFIED from a clinical source** (general knowledge only).

### A8. Laboratory units

Publisher of the national rules: the Royal College of Pathologists of Australasia (RCPA), *Standardised Pathology Informatics in Australia (SPIA)* — "terminology, units, and rendering related to pathology requesting and reporting in Australia": https://developer.digitalhealth.gov.au/standards/standardised-pathology-informatics-in-australia-spia-guidelines-v4-1 and https://www.rcpa.edu.au/Library/Practising-Pathology/PTIS/SPIA-Guidelines-and-Tools . The guideline document itself could not be opened by the audit's tools; the rows below come from the pages of the RCPA Manual that could.

| Value | Unit found | Source |
|---|---|---|
| Glucose | mmol/L ("Fasting: 3.0-5.4 mmol/L" is how the page writes an interval; no number of it is used here) | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/G/Glucose |
| Cholesterol | mmol/L | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/C/Cholesterol |
| HbA1c | reported in both per cent and mmol/mol | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/H/HbA1c |
| Creatinine | µmol/L — **UNVERIFIED**: the creatinine page could not be opened; the creatinine-clearance page writes "plasma creatinine (mmol/L)" inside a formula | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/C/Creatinine-clearance |
| Haemoglobin | g/L — **UNVERIFIED**: the page could not be opened | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/H/Haemoglobin |
| Urine albumin-to-creatinine ratio | **CONFLICTING, UNVERIFIED**: the RCPA Manual page writes the categories in "mg albumin/g creatinine"; Kidney Health Australia's fact sheet for patients (a national charity, not a regulator or a college) writes the ratio in "mg/mmol", which is what the pack states | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/A/Albumin-urine ; https://kidney.org.au/wp-content/uploads/2025/10/KHA-Factsheet-Albuminuria-Jan2025.pdf |
| Prostate-specific antigen | µg/L — **UNVERIFIED**: the RCPA guideline *PSA Test Reporting* could not be opened | https://www.rcpa.edu.au/getattachment/75ca004c-4bc3-4104-8e1c-7e6a37f4ce15/PSA-Test-Reporting.aspx |
| C-reactive protein, erythrocyte sedimentation rate (the two other laboratory values a switched-on tool takes) | mg/L and mm/h — **UNVERIFIED** | not found |

### A9. Blood pressure

- Millimetres of mercury; the legal unit's symbol is written "mm Hg" in the Style Manual's table of other legal units (clinical writing commonly closes it up, "mmHg"): https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/measurement-and-units . The systolic/diastolic notation ("120/80") is general knowledge: **UNVERIFIED from an Australian clinical source**.

### A10. Emergency number

- "Triple Zero (000)": "call Triple Zero (000). Triple Zero calls are free." For police, fire or ambulance. A text service for people who are deaf or have a hearing or speech impairment: "Text Emergency Call 106". — https://www.triplezero.gov.au/
- 112 from mobile phones: **UNVERIFIED** (not on the page read).

### A11. Other numbers a "not for emergencies" notice could name

- healthdirect, the government health advice line: "1800 022 222", "Our registered nurses are available 24 hours a day, 7 days a week"; "known as NURSE-ON-CALL in Victoria"; "If you think you need an ambulance or your injury or illness is critical or life threatening, call triple zero (000) for an ambulance immediately." — https://www.healthdirect.gov.au/how-healthdirect-can-help-you
- Queensland's 13 HEALTH line and crisis lines: **UNVERIFIED** (not read).

### A12. Patient identifiers

- **Medicare card number.** The national data element is "Medicare card number", a "Person identifier, allocated by the Health Insurance Commission to eligible persons", format `N(11)` — AIHW METEOR 270101: https://meteor.aihw.gov.au/content/270101 . A card is not one person: "Your card has your name on it. If you have a partner or children, your card may also list their details." A person can be on two cards, and can have their own card from 15. — Services Australia: https://www.servicesaustralia.gov.au/your-medicare-card . So the number printed on a card identifies the card; the person is the number together with the reference number beside their name (the eleventh digit of the data element). The reference number's name ("individual reference number") is general knowledge: **UNVERIFIED**, the Services Australia page that describes the card refuses automated readers.
- **It is a government related identifier.** "APP 9 restricts the adoption, use and disclosure of government related identifiers by organisations." Examples given: "Medicare numbers". An organisation adopts one if it "organises the personal information that it holds about that individual with reference to that identifier". "An organisation must not use or disclose a government related identifier of an individual, unless an exception applies." "APP 9 does not specifically address the collection of government related identifiers", but collection falls under APP 3 (reasonably necessary for the organisation's functions). — OAIC, APP Guidelines, chapter 9: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-9-app-9-adoption,-use-or-disclosure-of-government-related-identifiers ; law: Privacy Act 1988 (Cth), Schedule 1: https://www.legislation.gov.au/C2004A03712/latest/text
- **Individual Healthcare Identifier (IHI).** "a unique number used to identify an individual for health care purposes"; a person has one if they have a Medicare card, a DVA card or are enrolled in Medicare — Services Australia: https://www.servicesaustralia.gov.au/individual-healthcare-identifiers . The service that issues it is "currently operated by the Chief Executive Medicare"; healthcare providers may collect it from that service "for the purpose of communicating or managing health information"; use outside what the Act permits can bring criminal and civil penalties. — OAIC: https://www.oaic.gov.au/privacy/privacy-legislation/related-legislation/healthcare-identifiers ; law: Healthcare Identifiers Act 2010 (Cth): https://www.legislation.gov.au/C2010A00072/latest/text (the Act's text could not be opened; section numbers are **UNVERIFIED**). Sixteen digits: general knowledge, **UNVERIFIED**.
- **What must never be collected: the tax file number.** Law to name to a lawyer: the Privacy (Tax File Number) Rule 2015 and the Taxation Administration Act 1953 (Cth) — **UNVERIFIED**, neither was read. A health product has no reason to ask for one.
- **The right label and rule, as far as the sources go:** label the field "Medicare card number"; keep it optional; never use it as the product's key for a patient, never search or sort by it; add no field for the IHI (it comes only from the national service, to registered providers) and none for a tax file number. Whether a product that does no Medicare claiming may hold the number at all is a question for a lawyer (Part A, legal question 1).

### A13. Doctors' seniority and titles; the names of the specialties

- **The official list.** Medical Board of Australia, *List of specialties, fields of specialty practice and related specialist titles*, dated 22 September 2025: https://www.ahpra.gov.au/documents/default.aspx?record=WD10%2f106&dbid=AP&chksum=07LyDUkqqYa5O5LXuqbSzg%3d%3d (linked from https://medicalboard.gov.au/registration-standards). 23 specialties: Addiction medicine; Anaesthesia; Dermatology; Emergency medicine; General practice; Intensive care medicine; Medical administration; Obstetrics and gynaecology; Occupational and environmental medicine; Ophthalmology; Paediatrics and child health; Pain medicine; Palliative medicine; Pathology; Physician; Psychiatry; Public health medicine; Radiation oncology; Radiology; Rehabilitation medicine; Sexual health medicine; Sport and exercise medicine; Surgery.
  - Fields under **Surgery**: Cardio-thoracic surgery; General surgery; Neurosurgery; Orthopaedic surgery; Otolaryngology – head and neck surgery; Oral and maxillofacial surgery; Paediatric surgery; Plastic surgery; Urology; Vascular surgery.
  - Fields under **Physician**: Cardiology; Clinical genetics; Clinical pharmacology; Endocrinology; Gastroenterology and hepatology; General medicine; Geriatric medicine; Haematology; Immunology and allergy; Infectious diseases; Medical oncology; Nephrology; Neurology; Nuclear medicine; Respiratory and sleep medicine; Rheumatology.
  - Fields under **Radiology**: Diagnostic radiology; Diagnostic ultrasound; Nuclear medicine. Under **General practice**: Rural generalist medicine.
  - **Not on the list** as a specialty or field: Oncology, Thoracic surgery, Cardiac surgery, Gastroenterology alone, Paediatrics alone, Internal medicine, Family medicine, Cosmetic surgery, Cosmetic medicine, Aesthetic medicine.
- **Seniority.** The Board registers *specialists* (specialist registration); titles on the list take the form "Specialist …" — for general practice "Specialist general practitioner". Hospital words (consultant, staff specialist, registrar, resident) were **not checked**.
- **"Surgeon" is a protected title.** "Only medical practitioners holding specialist registration in surgery, obstetrics and gynaecology, or ophthalmology" may use it; "The changes started on 20 September 2023 in most states and territories"; under "the *Health Practitioner Regulation National Law (Surgeons) Amendment Act 2023*". A practitioner without that registration "cannot call themselves a 'cosmetic surgeon'", and "a cosmetic surgery endorsement does not enable a medical practitioner to call themselves a 'cosmetic surgeon'". "Misuse of the newly protected title is a criminal offence". — Medical Board of Australia: https://www.medicalboard.gov.au/Codes-Guidelines-Policies/FAQ/FAQ-Protection-of-the-title-surgeon.aspx
- **"Cosmetic".** The regulator's own words are "cosmetic surgery" and "non-surgical cosmetic procedures": "Guidelines for practitioners who perform non-surgical cosmetic procedures" and "Guidelines for practitioners who advertise higher risk non-surgical cosmetic procedures", in effect from 2 September 2025 for "all regulated professions". — Ahpra: https://www.ahpra.gov.au/News/2025-06-03-New-cosmetic-procedure-guidelines . "Cosmetic medicine" is not a specialty, a field or a title of the list.

### A14. The allied professions' names

- Regulated under the National Law, named by their Boards: "Physiotherapist" (Physiotherapy Board of Australia), "Psychologist" (Psychology Board of Australia), "Occupational therapist" (Occupational Therapy Board of Australia). "Neither dietitian nor audiologist appears on the list" of regulated professions. — Ahpra: https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Professions-and-Divisions.aspx
- "Clinical psychologist" is a title tied to an area-of-practice endorsement of the Psychology Board: **UNVERIFIED** (general knowledge; the Board's page was not read). Dietitians and audiologists are self-regulated professions: **UNVERIFIED** beyond their absence from the list above.

### A15. Paper size

- A4. **UNVERIFIED** (general knowledge; no government page was read).

### A16. Telephone numbers

- Country code +61. Mobile, national: "0400 000 000" — "one block of four digits and two blocks of three"; international: "+61 400 000 000". Landline: "02 1234 4321", international "+61 2 1234 4321". "1300 975 707"; numbers in the 13 category "have only 6 digits". — Style Manual, *Telephone numbers*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/numbers-and-measurements/telephone-numbers
- Numbers set aside for creative works (never issued): published by the Australian Communications and Media Authority, *Phone numbers for use in TV shows, films and creative works*: https://www.acma.gov.au/phone-numbers-use-tv-shows-films-and-creative-works — **UNVERIFIED**: the page refuses automated readers, so the pack's example number was not checked against the current list.

### A17. Postal addresses

- Australia Post's addressing guidelines; the code is called a "postcode" and has four digits; the last line is the locality, the state or territory abbreviation and the postcode. **UNVERIFIED**: https://auspost.com.au/sending/guides-and-tools/addressing-guidelines could not be opened.

### A18. Names

- "In many English-speaking countries, the order of a name is given name then family name." "The order of names is culturally based." Use "'given name' instead of 'Christian name'" and "'family name' instead of 'surname'". — Style Manual, *Personal names*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/names-and-terms/personal-names
- The national health data dictionary holds the family name as an item of its own: "Person—family name", text of up to 40 characters, recorded "in the format preferred by the person"; a person with only one name has it recorded as the family name, with the given name left empty. — AIHW METEOR 613331: https://meteor.aihw.gov.au/content/613331
- **Sex and gender.** The national statistical standard's answers for sex are "Male", "Female", "Another term (please specify)"; gender is a separate question with its own answers. — ABS, *Standard for Sex, Gender, Variations of Sex Characteristics and Sexual Orientation Variables*: https://www.abs.gov.au/statistics/standards/standard-sex-gender-variations-sex-characteristics-and-sexual-orientation-variables/latest-release

### A19. Medicine naming convention (convention only; no list)

- The official names of ingredients are the **Australian Approved Names** published by the Therapeutic Goods Administration (TGA), aligned with the international non-proprietary names. Pages: https://www.tga.gov.au/products/regulations-all-products/ingredients-and-scheduling-medicines-and-chemicals/ingredients-therapeutic-goods/naming-ingredients and *TGA approved terminology for therapeutic goods*: https://www.tga.gov.au/sites/default/files/2024-10/tga-approved-terminology-therapeutic-goods.pdf — **UNVERIFIED**: tga.gov.au refuses automated readers, so nothing is quoted.
- Prescribers write the active ingredient (active ingredient prescribing): **UNVERIFIED** (general knowledge).
- In clinical systems the naming standard is the Australian Medicines Terminology: "A national, standards-based approach to the identification and naming of medicines in clinical systems for Australia." — https://www.healthterminologies.gov.au/library/amt-australian-medicines-terminology-fact-sheet.pdf (Part E).

### A20. Triage scale in emergency departments

- The Australasian Triage Scale: "a clinical tool for ensuring that presenting patients are prioritised according to clinical urgency", five categories ("ATS Categories 1 through to 5"). — Australasian College for Emergency Medicine, policy P06: https://policy.acem.org.au/index.php/policies-menu/p06-policy-on-the-australasian-triage-scale

### A21. Diagnosis coding

- "The ICD-10-AM/ACHI/ACS classification system is used for classifying admitted patient care", "used in public and private hospitals in Australia"; "In Australia, ICD-10 is used to classify causes of death." — Independent Health and Aged Care Pricing Authority: https://www.ihacpa.gov.au/health-care/classification/icd-10-amachiacs
- Clinical terminology in software: SNOMED CT-AU, published through the National Clinical Terminology Service (Part E). What a general practice codes with: **UNVERIFIED**, not found.

### A22. Age at which a person can consent to their own treatment

- No single national age. Adulthood is 18.
- **South Australia: 16.** "People over the age of 16 with decision making capacity have the right to consent or refuse" — SA Health, on the *Consent to Medical Treatment and Palliative Care Act 1995* (SA): https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/conditions/end+of+life+care/consent+to+medical+treatment+and+healthcare
- **New South Wales: capacity, with 14 and 16 named in statute.** "there is no set age at which a child or young person is capable of giving consent"; "if a Minor aged 14 and above consents to their own medical treatment" the practitioner may rely on it as a defence; a parent's consent covers "medical treatment of a Minor aged less than 16 years" (Minors (Property and Contracts) Act 1970 (NSW)). — NSW Health, *Consent to Medical and Healthcare Treatment Manual*, section 8: https://www.health.nsw.gov.au/policies/manuals/Documents/consent-section-8.pdf
- The other states and territories: capacity under the common law ("mature minor"), no fixed age: **UNVERIFIED** state by state.
- Other ages a product meets: a person can hold their own Medicare card from 15 (Services Australia, A12). Fourteen as the age from which a young person controls their own My Health Record: **UNVERIFIED** (the page refuses automated readers).

### A23. Spelling

- "Australian spellings generally follows British spellings, but there are exceptions"; the dictionaries are "the Australian concise Oxford dictionary (ACOD)" and "the Macquarie dictionary"; "we now write 'ement' not 'ment' in acknowledgement, lodgement and judgement". — Style Manual, *Spelling*: https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/spelling
- "program", not "programme": **UNVERIFIED from the page read** (general knowledge of the dictionaries above).

### A24. Languages a patient-facing page may need

- English. "Top 5 languages used at home, other than English, were Mandarin (2.7 per cent), Arabic (1.4 per cent)", then Vietnamese, Cantonese and Punjabi (2021 Census). — Australian Bureau of Statistics: https://www.abs.gov.au/statistics/people/people-and-communities/cultural-diversity-census/latest-release
- The national interpreting service (TIS National) and any duty to offer an interpreter: **UNVERIFIED** (https://www.health.gov.au/contacts/translating-and-interpreting-service-tis-national refuses automated readers). For the owner and a local clinician.

### Questions for a lawyer

Each is a question. None is answered here.

1. **Health-data privacy, federal and state, and what a vendor needs before real patient data.** Laws and regulators to put to the lawyer: Privacy Act 1988 (Cth) and the Australian Privacy Principles, with the Notifiable Data Breaches scheme (Office of the Australian Information Commissioner, https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/guide-to-health-privacy ; https://www.legislation.gov.au/C2004A03712/latest/text); Health Records and Information Privacy Act 2002 (NSW) (https://legislation.nsw.gov.au/view/html/inforce/current/act-2002-071); Health Records Act 2001 (Vic) (https://www.legislation.vic.gov.au/in-force/acts/health-records-act-2001); Health Records (Privacy and Access) Act 1997 (ACT) (https://www.legislation.act.gov.au/a/1997-125). Questions: Is Notya, as the vendor, itself bound by these laws, or only the clinic? What contract must stand between Notya and a clinic before a real patient is entered? What must a patient be told? May the product hold a Medicare card number (APP 3 and APP 9, A12)? Who notifies whom after a breach? How long must records be kept, and may a patient's page stay open for 30 days?
2. **Recording a consultation.** State and territory laws to name: Surveillance Devices Act 2007 (NSW); Surveillance Devices Act 1999 (Vic); Invasion of Privacy Act 1971 (Qld); Surveillance Devices Act 2016 (SA); Surveillance Devices Act 1998 (WA); Listening Devices Act 1991 (Tas); Surveillance Devices Act 2007 (NT); Listening Devices Act 1992 (ACT) — portals: https://legislation.nsw.gov.au , https://www.legislation.vic.gov.au , https://www.legislation.qld.gov.au , https://www.legislation.sa.gov.au , https://www.legislation.wa.gov.au , https://www.legislation.tas.gov.au , https://legislation.nt.gov.au , https://www.legislation.act.gov.au . The regulator's guidance to practitioners says to "obtain informed consent from your patient" and that "the AI transcription software should include an explicit consent requirement as an initial step" (Ahpra, https://www.ahpra.gov.au/Resources/Artificial-Intelligence-in-healthcare.aspx). Questions: Whose consent is needed in each state and territory, and must it be recorded in a set form? What of a telehealth visit across two states? Who may consent for a child or for an adult who cannot? Is the pack's one sentence enough everywhere? How long may the recording itself be kept?
3. **Medical-device rules.** Regulator: Therapeutic Goods Administration; Therapeutic Goods Act 1989 (Cth) (https://www.legislation.gov.au/C2004A03952/latest/text). Pages to give the lawyer (they refuse automated readers, so nothing is quoted): *Digital scribes*, https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence-ai/overview/types-software-based-medical-devices/digital-scribes ; *Artificial intelligence (AI) and medical device software regulation*, https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence-ai/manufacturing/artificial-intelligence-ai-and-medical-device-software-regulation ; *Understanding regulation of software-based medical devices*, https://www.tga.gov.au/regulation-software-medical-device . Questions: Is a tool that records a visit and drafts a note for the doctor to approve a medical device? Does drafting an "assessment" or a "plan" section change the answer? Are the calculators and checklists of the tools area devices, excluded software or exempt clinical decision support, and does each one need its own answer? What would inclusion in the register require of a company outside Australia?
4. **Data residency.** Questions: Does any law require that this product's data stay in Australia (APP 8 on sending personal information overseas; the state laws of question 1; the My Health Records Act 2012 (Cth), https://www.legislation.gov.au/C2012A00063/latest/text , which this product does not connect to)? What must a clinic be told about where the database, the speech provider and the model provider process data? Do public hospitals or state health departments add their own conditions?
5. **Advertising.** Laws and regulators to name: section 133 of the Health Practitioner Regulation National Law (advertising a regulated health service; Ahpra, https://www.ahpra.gov.au/Resources/Advertising-hub.aspx); the Therapeutic Goods Act 1989 and the Therapeutic Goods Advertising Code if any part of the product is a medical device (TGA); the Australian Consumer Law (Australian Competition and Consumer Commission, https://www.accc.gov.au). Questions: Do the rules on advertising regulated health services reach a software vendor's own page, or only its customers' pages? May the landing page list "Cosmetic surgery" and "Cosmetic medicine" among "specialties and professions" (A13)? May a patient-facing text produced with the product (a summary, a reminder) count as advertising by the clinic? What may be said about what the software does without it becoming a therapeutic claim?

---

## Part B — what the product does today

How the kit works (read, not changed): a day is written from the pack's pattern `bicim.tarihDeseni` by `gunYazDesenle` (`lib/ulke/uygulama/zaman.ts`, `lib/ulke/arayuz/bicim.ts`) — a pack pattern, not `Intl`. A time is stored and typed as 24-hour `HH:MM`; what is read follows the pack's `uygulama.saatBicimi`, and for 12 hours the words come from `Intl.DateTimeFormat(bicim.yerel, { hour12: true })` — the pack's locale. Numbers and amounts are written by `sayiYazKuralla` (`lib/ulke/arayuz/sayi.ts`) from the pack's two separators. Weekday names are the pack's text. Units are the pack's (`uygulama.birimler`, `araclar.labBirimleri`), converted with fixed factors in `lib/ulke/araclar/birimler.ts`. **Typing** a date or a time is different: every such field is the browser's own control (`<input type="date">`, `<input type="time">` in `components/ulke/uygulama/Hastalar.tsx`, `Takvim.tsx`, `OnBuro.tsx`, `Araclar.tsx`, `AracKayitlari.tsx`, `KlinikYetkiler.tsx`, `components/ulke/portal/HastaFormu.tsx`), which follows the browser's language setting and not the pack. A phone number is a free-text field with the pack's example as its hint; nothing validates it. A patient's name is one field.

| # | Item | What the pack says (file: line) | What the kit does | Verdict |
|---|---|---|---|---|
| 1 | Date order on screens (A1) | `tarihDeseni: 'DD/MM/YYYY'` (`countries/au/index.ts:45`); `tarihOrnegi: 'DD/MM/YYYY'` (`ayarlar.ts`) | writes every day from the pattern | **CONFORMS** |
| 2 | Typing a date (A1) | nothing: not a pack setting | the browser's own date control; its order follows the browser's language | **NOT HANDLED BY THE PRODUCT** — Core 1 |
| 3 | Clock, everyday (A2) | `saatBicimi: 12` (`index.ts`), locale `en-AU` | "2:30 pm": lower case, a space, a colon — as the Style Manual writes it | **CONFORMS** |
| 4 | Clock in clinical documentation (A2) | the same one setting | one setting for every screen; a spoken time stays in the note as it was said | **NEEDS A LOCAL PERSON** — a clinician chooses 12 or 24 for clinic screens |
| 5 | Typing a time (A2) | nothing | the browser's own time control | **NOT HANDLED BY THE PRODUCT** — Core 1 |
| 6 | Noon and midnight (A2) | nothing | "12:00 pm", "12:00 am" from the platform | **DIFFERS** (minor) — Core 2 |
| 7 | First day of the week (A3) | `haftaBasi: 1` | the week view starts on that day | **CONFORMS** (source UNVERIFIED) |
| 8 | Decimal and thousands separators (A4) | `ondalikAyraci: '.'`, `binlikAyraci: ','` | writes numbers with them | **CONFORMS** |
| 9 | Currency (A5) | `AUD`, `$`, two decimals; `'$% a month'` (`ayarlar.ts`) | not shown: every plan is by quote | **CONFORMS** (source UNVERIFIED) |
| 10 | Time zones offered (A6) | seven zones, default `Australia/Sydney` (`index.ts`; `derleme.mjs:15`) | an account chooses one in Settings; offsets from the platform | **CONFORMS** for the states and mainland territories |
| 11 | Zones not offered (A6) | no Lord Howe Island, no external territory | — | **NEEDS A LOCAL PERSON** — whether any clinic there matters; offsets unverified |
| 12 | How the zone is named to a doctor (A6) | the zone list | Settings shows the database's names ("Australia/Sydney"), with no state and no AEST/AEDT | **DIFFERS** — Core 3 |
| 13 | How appointment times are shown (A6) | `saatDilimiCumlesi` (`ayarlar.ts`); the set's patient sentence | calendar: "Times are shown in the time zone set for your account."; patient's page: "Times are shown in your doctor's time zone: …" | **CONFORMS** in principle; the name shown to a patient is Core 3 |
| 14 | Weight, height, temperature (A7) | `kg`, `cm`, `C` (`ayarlar.ts:25`) | shown as kg, cm, °C | **CONFORMS** |
| 15 | Glucose, cholesterol (A8) | `mmol/L` (`ayarlar.ts`, `labBirimleri`) | converts with fixed factors; no switched-on tool reads either today | **CONFORMS** |
| 16 | Creatinine, haemoglobin (A8) | `umol/L`, `g/L` | as above; no switched-on tool reads either today | **NEEDS A LOCAL PERSON** — unit not confirmed from a page that could be read |
| 17 | Urine albumin-to-creatinine ratio (A8) | `mg/mmol`; both tools that classify by it are OFF (`kdigo-evre`, `kdigo-serit`) | — | **NEEDS A LOCAL PERSON** — the one official page read writes mg/g; keep the tools off |
| 18 | Prostate-specific antigen (A8) | `'ng/mL': 'µg/L'` (`ayarlar.ts`, `birimAdlari`) | the tool `psa-hizi` shows µg/L | **NEEDS A LOCAL PERSON** — unit not confirmed |
| 19 | C-reactive protein, sedimentation rate (A8) | the set's units, mg/L and mm/h | the tool `das28` shows them | **NEEDS A LOCAL PERSON** — unit not confirmed |
| 20 | HbA1c (A8) | the slot `lab-izlem` is off | "the kit's field has no unit choice yet" | **NOT HANDLED BY THE PRODUCT** |
| 21 | Blood pressure (A9) | nothing | no field; a spoken value stays in the note as said | **NOT HANDLED BY THE PRODUCT** |
| 22 | Emergency number (A10) | `acilNumara: '000'` (`index.ts`) | the patient's page: "If you are very unwell, call an ambulance: 000." | **CONFORMS** |
| 23 | The number's name, "Triple Zero (000)" (A10) | the kit takes digits only | the sentence is the shared set's | **DIFFERS** (minor) — Shared English set 1 |
| 24 | Health advice line (A11) | none | one place for one number | **NOT HANDLED BY THE PRODUCT** — Core 4 |
| 25 | Identifier label (A12) | was `'Medicare number'` (`ayarlar.ts`, `index.ts`) | optional free text, encrypted, never validated, not searched | **DIFFERS → FIXED**: "Medicare card number" |
| 26 | Never collected: healthcare identifier, tax file number (A12) | no such field | no such field | **CONFORMS** — now held by a test |
| 27 | Senior-doctor word (A13) | `kidemliHekim: 'specialist'` | "You are an experienced specialist." opens the instruction to the model | **CONFORMS** |
| 28 | Specialty names, 27 of the 30 doctor roles (A13) | three differed: "Gastroenterology", "Otolaryngology, head and neck surgery", "Paediatrics" | shown in the role question, Settings, the landing page | **DIFFERS → FIXED**: the list's wording for all 27 |
| 29 | Thoracic surgery; Cardiac and vascular surgery; Oncology (A13) | the set's base names | — | **NEEDS A LOCAL PERSON** — the list divides the work differently; Shared English set 2 |
| 30 | The five clinic roles, "Cosmetic medicine" among them (A13) | "Hair transplantation", "Cosmetic surgery", "Cosmetic medicine", "Dermatology (clinic)", "Preventive and longevity medicine" | listed under "Clinic doctor"; on the landing page under "Specialties and professions" | **NEEDS A LOCAL PERSON** and a lawyer (legal question 5) |
| 31 | The title "surgeon" (A13) | no role name says "surgeon" | — | **CONFORMS** — now held by a test |
| 32 | Physiotherapist, Occupational therapist (A14) | the set's names | — | **CONFORMS** |
| 33 | Clinical psychologist, Dietitian, Audiologist (A14) | the set's names | — | **NEEDS A LOCAL PERSON** — titles not confirmed |
| 34 | Paper size (A15) | nothing | nothing is printed; no print layout exists | **NOT HANDLED BY THE PRODUCT** |
| 35 | Phone format and country code (A16) | `+61`, nine digits, example `+61 491 570 006` | free text with the example as a hint | **CONFORMS** — the Style Manual's blocks |
| 36 | The example is a number never issued (A16) | "UNVERIFIED" in `ayarlar.ts` | — | **NEEDS A LOCAL PERSON** — the regulator's list could not be read |
| 37 | Postal address, postcode (A17) | nothing | no address field | **NOT HANDLED BY THE PRODUCT** |
| 38 | Name fields (A18) | `adAlanlari: { ikinciAd: false }` | one field, "Full name"; the list sorts by the whole text | **NOT HANDLED BY THE PRODUCT** — no family name / given name; Core 5 |
| 39 | Sex (A18) | the set's "Sex": "Male", "Female", optional | two choices and empty | **DIFFERS** — Core 6 |
| 40 | Medicine names (A19) | no list; the instruction says "Leave the names of medicines as they were said." | the prescription and interaction slots are off | **NOT HANDLED BY THE PRODUCT** (by design; Part E) |
| 41 | Triage scale (A20) | the Emergency Severity Index tool is OFF (`ayarlar.ts`, `kapali`) | no Australasian Triage Scale tool exists | **CONFORMS** (the other country's scale is not offered) |
| 42 | Diagnosis coding (A21) | the slot `diagnosis-coding` is off | — | **NOT HANDLED BY THE PRODUCT** |
| 43 | Guardian wording below 16 (A22) | `AU_VELI_YASI = 16` (`ayarlar.ts:22`) | below it the history is "as the person with them reported" and the intake form is addressed to a parent or guardian | **NEEDS A LOCAL PERSON** — a lawyer; no single age exists |
| 44 | Spelling (A23) | `en-AU`: the British base with "program" | 1,928 texts pass the pack's spelling test | **CONFORMS** |
| 45 | "acknowledgement", "judgement" (A23) | the set's base spelling | — | **CONFORMS** |
| 46 | Patient languages (A24) | `hastaDilleri: ['en']` | a patient's page and form are in English only | **NOT HANDLED BY THE PRODUCT** |
| 47 | Recording-consent sentence (legal question 2) | `kayitRizasi` (`ayarlar.ts`), "NOT READ BY A LAWYER" | an explicit box before recording, as the regulator's guidance asks | **NEEDS A LOCAL PERSON** — a lawyer |
| 48 | Claims (legal questions 3, 5) | none | the pack's test refuses any claim word, regulator name or price | **CONFORMS** |
| 49 | The generated record's fixed sentence | — | `docs/COUNTRY-PACK-AUSTRALIA.md` still says `Label "Medicare number"` and "every one unverified" in sentences written inside `scripts/ulke-en-kayit.mts` | **DIFFERS** — Core 7 |
| 50 | Times in the landing page's example visits (A2) | nothing: the set's fixed text | "09:14", "11:03", "16:40" in the 24-hour form on a page of a 12-hour country | **DIFFERS** (minor) — Shared English set 6 |

**Sense check of the settings asked about.**

- *Identifier label.* "Medicare number" was loose; the data element and Services Australia say "Medicare card number". Fixed. The deeper question — whether to hold it at all — is legal question 1.
- *Guardian age 16.* Defensible as a starting value (South Australia's statute says 16; New South Wales names 14 and 16; elsewhere capacity decides) and not a fact. It only changes wording and who the intake form addresses. Left at 16, for a lawyer.
- *Time-zone setting.* The default `Australia/Sydney` is the most populous zone and the list covers every state and mainland territory. A new account in Perth or Brisbane starts on Sydney time until it opens Settings: see Core 3.
- *"Cosmetic medicine".* Not a specialty, field or title in Australia; the regulator speaks of "non-surgical cosmetic procedures". The pack's word is an area of work under the heading "Clinic doctor" and makes no title claim. Left as it is, marked UNVERIFIED in the pack, for a local clinician and a lawyer.
- *Senior-doctor word "specialist".* Matches the Board's own vocabulary, including for general practitioners. Kept.

---

## Part C — what was seen on real screens

**What was run.** `NOTYA_COUNTRY=au npm run build:ulke` on the fixed pack: built, exit 0, with the build proof ("`au` pack present (5 file(s)), no other country's pack"). The first two attempts did not finish: the machine (7 GB, shared by six audits) killed the type-check step for lack of memory; the third ran alone and passed. Then the repository's pack-neutral walk-through (`scripts/ulke-yuruyus/genel.mjs`) against the stand-ins on this machine only (application on `localhost:3161`, stand-in database on `127.0.0.1:54461`): **329 of 329 checks passed, exit 0**. Then twelve screenshots with the installed Playwright Chromium (1.56, no browser downloaded), signed in as the walk-through's stand-in account. No account was created on any deployed site and nothing outside this machine was contacted.

**What was NOT seen.** The pack before the fixes was never built (one build slot was to be had), so the "before" values of Part D were read from the code, not from a screen. No screen was seen on a real phone or in Safari or Firefox: the date and time controls are those of Chromium. No real speech was recorded: the walk-through's stand-in supplies the transcript and the note ("SYNTHETIC-…"). The sign-in page, the booking form's time field, the clinic screens and the front desk were walked by the walk-through but not looked at by eye. Nothing was printed.

Images are in `docs/audit/au/` (JPEG, 16–84 KB each).

| Image | What is on it | Against Part A |
|---|---|---|
| `01-landing.jpg` | The landing page's top: "A clinical assistant for doctors", "Note templates for 40 specialties and professions", "In English". Read from the page's text further down: the list of 40 names with "Gastroenterology and hepatology", "Otolaryngology – head and neck surgery", "Paediatrics and child health", and also "Thoracic surgery", "Cardiac and vascular surgery", "Oncology", "Cosmetic surgery", "Cosmetic medicine"; "organisation" in the request form; the phone example "+61 491 570 006"; "Price by quote", no amount; "© 2026 NOTYA". The example visit is headed "A VISIT · 09:14 · GENERAL TEMPLATE". | Names as fixed (A13). Spelling Australian (A23). No price, no claim. **The example's time is in the 24-hour form** while every time inside the product is 12-hour: Shared English set 6. |
| `02-signup.jpg` | "Create an account with an invitation code": invitation code, "Full name", email address, password twice. No date, no phone, no identifier. | One name field (A18, Core 5). |
| `03-calendar-week.jpg` | The week runs "Mon · 05/10" to "Sun · 11/10"; the appointment reads "2:30 pm"; under it "Times are shown in the time zone set for your account." | Monday first (A3). Day before month (A1). 12-hour, lower-case "pm" with a space (A2). The zone is not named on the calendar (Core 3). |
| `04-new-patient-browser-en-AU.jpg` | "Full name"; "Date of birth" as the browser's control, showing **04/03/2019** for 4 March 2019 in a Chromium started in Australian English; "Phone number" with the hint "+61 491 570 006"; "Sex": "Female", "Male"; "**Medicare card number** (optional)". | Identifier label as fixed (A12). Phone blocks as the Style Manual's (A16). Two answers for sex (A18, Core 6). |
| `05-new-patient-browser-en-US.jpg` | The same form, the same date given to the control, in a Chromium started in American English: the control shows **03/04/2019**. | **Core 1 seen**: the order a date is typed in follows the browser, while the product writes the same day as 04/03/2019 everywhere it shows it. |
| `06-patient-file.jpg` | "Date of birth 07/03/2021", "Age 5", "Sex Female", "Phone number +61 491 570 006"; coming appointments "11/10/2026 2:30 pm–2:40 pm" and "12/10/2026 9:30 am–9:40 am"; "Last saved: 10/10/2026"; tool results and notes dated "10/10/2026". | DD/MM/YYYY throughout (A1); 12-hour "am"/"pm" (A2). |
| `07-visit-note.jpg` | "Visit note · 10/10/2026 12:09 pm", "Approved 10/10/2026 12:09 pm", template "Emergency medicine", the four sections "History and presenting complaint", "Examination", "Assessment", "Plan"; "Summary for the patient". The machine's clock was 01:09 UTC. | The time is Sydney's with daylight saving, eleven hours ahead of UTC (A6). The content is the stand-in's. |
| `08-tool-psa-rate.jpg` | "Prostate-specific antigen: rate of change" (role set to Urology for this image): "Earlier value (µg/L)", "Accepted range: 0 to 1,000", result "1.67 µg/L per year", "273 days"; the two dates in the browser's control as 05/01/2026 and 05/10/2026 (5 January and 5 October, Australian-English browser). "No threshold and no grade is shown." | Unit as the pack states it (A8, unit not confirmed: B18). Decimal point and thousands comma (A4). |
| `09-settings-time-zone.jpg` | "Time zone": a list reading "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Darwin", "Australia/Perth", "Australia/Hobart"; "Specialty or profession" with the 40 names. | **Core 3 seen**: database names, no state, no AEST/AEDT. |
| `10-patient-portal.jpg` | The patient's page on a phone-sized screen: "Sunday, 11/10/2026" at "2:30 pm"; "Times are shown in your doctor's time zone: Australia/Sydney."; day buttons "Sun 11/10", "Mon 12/10"…; at the foot "This page is not for emergencies. If you are very unwell, call an ambulance: 000." | Emergency number right (A10); it is not written "Triple Zero (000)" and no advice line is named (Shared English set 1, Core 4). The zone's name is the database's (Core 3). |
| `11-intake-form-guardian.jpg` | The form for a patient aged 5: "Who is filling in this form", "What is your relationship to the child?" with "Mother", "Father", "Legal guardian", "Another close person". | Below the pack's guardian age (16) the form addresses a parent or guardian (A22, for a lawyer). |
| `12-intake-form-units.jpg` | "Measurements (if you know them)": the child's height in "cm", weight in "kg", temperature in "°C". | Units as A7. |

**Compared with Part A, in one paragraph.** Every date the product writes is day/month/year with slashes; every time is 12-hour with lower-case "am"/"pm" after a space; the week starts on Monday; numbers use a point and a comma; the units are metric; the phone example is in the Style Manual's blocks; the identifier reads "Medicare card number"; the specialty names are the Medical Board's wording where the pack could give it; the spelling is Australian; no currency amount is shown anywhere. Three things on the screens do not match: the date a person **types** follows their browser (images 04 and 05); the time zone is named "Australia/Sydney" to doctor and patient (images 09 and 10); the landing page's example visit carries a 24-hour time (image 01). None of the three can be changed in the country's folder.

---

## Part D — fixes made in `countries/au/`

| # | File | Before | After | Source |
|---|---|---|---|---|
| D1 | `countries/au/ayarlar.ts` (`sozler.kimlikEtiketi`), `countries/au/index.ts` (`ulusalKimlik.ad`) | `'Medicare number'` | `'Medicare card number'` | AIHW METEOR 270101, https://meteor.aihw.gov.au/content/270101 ; Services Australia, https://www.servicesaustralia.gov.au/your-medicare-card |
| D2 | `countries/au/ayarlar.ts` (`rolAdlari.gastroenterology`) | the set's base name, "Gastroenterology" | `'Gastroenterology and hepatology'` | Medical Board of Australia, list of specialties (22 September 2025), A13 |
| D3 | `countries/au/ayarlar.ts` (`rolAdlari.otolaryngology`) | `'Otolaryngology, head and neck surgery'` | `'Otolaryngology – head and neck surgery'` | the same list |
| D4 | `countries/au/ayarlar.ts` (`rolAdlari.paediatrics`) | the set's base name, "Paediatrics" | `'Paediatrics and child health'` | the same list |
| D5 | `countries/au/sizintiTerimleri.ts` | the leak list hunted `AHPRA` only | hunts `AHPRA` and `Ahpra` (the regulator writes its own name "Ahpra") | https://www.ahpra.gov.au |
| D6 | comments in `countries/au/ayarlar.ts` and `countries/au/index.ts` | "UNVERIFIED" on the role names, the senior-doctor word, the emergency number, the time zones and the clock | each says what was checked on 2026-10-09 and against which page, and what is still open | Part A |

D1 is row 25 of Part B and D2–D4 are row 28: two rows, four values a user sees. D5 and D6 change nothing a user sees.

**Tests that hold the fixes** (`countries/au/au.test.ts`, a new block "held by the audit against Australian sources", 10 tests; the file now has 84 passing tests): the 27 specialty names equal the list's wording and the three unmapped roles keep their base names until a clinician maps them; no role name says "surgeon" and none uses another country's usage; the allied professions' names; the separators and the currency; the emergency number, the phone prefix, the example's blocks and the mobile rule with five accepted and five refused spellings; the seven zones with their offsets in July and in January (daylight saving in four, none in three); "2:30 pm"; the laboratory units and the four closed tools; no text asks for a healthcare identifier or a tax file number; both spellings of the regulator's name in the leak list.

**Checks run, each by its own exit code:** type check (`npx tsc --noEmit`), wall check (`node scripts/ulke-duvarlari.mjs`), pack check (`NOTYA_COUNTRY=au node scripts/ulke-paket-denetimi.mjs`), the pack's tests, the record regenerated (`NOTYA_COUNTRY=au npx --yes tsx scripts/ulke-en-kayit.mts --ulke au`), and the country build. Results: pack tests 84 of 84 (exit 0); pack check exit 0 ("nothing is marked 'to be supplied'"); wall check exit 0; record regenerated and its own test passing; type check of the pack's files and everything they import exit 0; the country build exit 0, its own step "Checking validity of types" (the whole project) passed and the build proof passed; the walk-through 329 of 329, exit 0. The whole-repository type check on its own (`npx tsc --noEmit`) was killed once by the machine for lack of memory (exit 137, no type error printed) while other builds ran; repeated when the machine was free: exit 0, no output.

---

## Core — findings that can only be fixed in the kit (not fixed)

1. **Typing a date or a time follows the browser, not the country.** Every date and time field is the browser's own control: `components/ulke/uygulama/Hastalar.tsx:132` (date of birth), `Takvim.tsx:241, 623, 627, 640, 641`, `OnBuro.tsx:160, 161, 214`, `Araclar.tsx:130`, `AracKayitlari.tsx:90`, `KlinikYetkiler.tsx:93`, `components/ulke/portal/HastaFormu.tsx:146`. A doctor in Australia whose browser is set to "English (United States)" — a common factory setting — types the date of birth month first, while every date the product *shows* is day first. A patient on their own phone meets the same in the intake form. To change: a text field that takes the pack's pattern (`gunCoz` in `lib/ulke/uygulama/zaman.ts` already parses it and the booking form's error sentence already names the pattern), or a hint under each date field with the pack's `tarihOrnek`; and for times, a field that follows `uygulama.saatBicimi`.
2. **Noon and midnight.** `saatGoster` (`lib/ulke/arayuz/bicim.ts`) writes "12:00 pm" and "12:00 am"; the Style Manual asks for "noon"/"midday" and "midnight". To change: two optional words in the appointment catalogue, used by `saatGoster` in a 12-hour pack.
3. **Time zones are shown by their database names, and a new account silently starts on the default.** `components/ulke/uygulama/Ayarlar.tsx:85` writes `Australia/Sydney` as the choice; an Australian thinks "Queensland" or "AEST". A doctor in Canberra, Alice Springs or the Gold Coast has to know which city stands for them. And an account is not asked: it starts on `Australia/Sydney` (`lib/ulke/arayuz/bicim.ts`, `varsayilanSaatDilimi`), so a Perth clinic's calendar is three hours out in summer until somebody opens Settings. To change: a display name per zone in the pack's catalogue (a new optional key), and the time zone asked at first login when the pack lists more than one. The same raw name reaches the patient's page ("Times are shown in your doctor's time zone: …").
4. **One number on the patient's page.** `uygulama.portal.acilNumara` is one string of digits (`lib/ulke/paketDenetimi.ts:224`). A "not for emergencies" notice in Australia would normally also name the health advice line (A11). To change: a second optional setting for an advice line, with its own sentence.
5. **One name field.** `components/ulke/uygulama/Hastalar.tsx` holds "Full name" only; the patient list sorts by the whole text (`lib/ulke/uygulama/hastalar.ts:171`). Australian usage and the Style Manual separate "given name" and "family name". The pack's only switch is `adAlanlari.ikinciAd` (a second name, off). To change: optional family-name / given-name fields per pack.
6. **Sex has two choices.** `components/ulke/uygulama/Hastalar.tsx:139` offers female and male (type `'male' | 'female' | ''`). The national standard adds "Another term" for sex and treats gender as a separate question (A18). To change: a third value in the kit's type and catalogue, switched on by a pack.
7. **The generated record repeats the old label and a blanket "unverified".** `scripts/ulke-en-kayit.mts` (the block for `au`, about line 97) writes `Label "Medicare number"` and the heading "Settings — every one unverified" as fixed text, so the record now shows the new label in one cell and the old one beside it. To change: read the label from the pack, and let a country state which settings an audit has checked.
8. **The mobile rule is never used.** `telefon.cepGecerliMi` is asked of every pack (`lib/ulke/tipler.ts:132`) and read only by the pack check; no screen or route validates a phone number with it. Not a fault for Australia (landlines are common for clinics and patients, so validating as mobile-only would be wrong), but the pack carries a rule that does nothing.

## Shared English set — findings that can only be fixed in `countries/_dil/en/` (not fixed)

1. **The ambulance sentence.** `countries/_dil/en/portal.ts:135`, `acilNumara: 'If you are very unwell, call an ambulance: %.'` reads "call an ambulance: 000." in Australia, where the number is said and written "Triple Zero (000)" and serves police, fire and ambulance. The kit forbids digits in the sentence and letters in the number, so the country cannot write its own. To change: let a country state the whole sentence (as it already states its consent sentence), or let the number setting carry a spoken name.
2. **Three role keys do not match how Australia divides the work.** `countries/_dil/en/klinik/roller.ts`: `thoracic-surgery` ("Thoracic surgery") and `cardiovascular-surgery` ("Cardiac and vascular surgery") against Australia's "Cardio-thoracic surgery" and "Vascular surgery"; `oncology` against "Medical oncology" and "Radiation oncology". A country can rename a role but cannot split, merge or hide one (every English pack must carry all 40 keys, `countries/_dil/en/testing/paketSinamasi.ts`, "the role keys are the shared English set"). To change: let a pack leave a role out, or decide per country which template a renamed role carries.
3. **Role names are the only place a country can state "this is not a specialty here".** The landing page heading "Specialties and professions" and the group label "Medical specialty" (`countries/_dil/en/acilis.ts`, `uygulama.ts`) sit over a list that in Australia includes names that are not specialties of the Board's list (the five clinic roles). To change: a pack-level wording for the heading, or a separate list for clinic roles on the landing page.
4. **"Sex" with two answers** is also the set's wording (`countries/_dil/en/uygulama.ts:92-94`); see Core 6.
5. **The Australian column of the spelling table** (`countries/_dil/en/sozluk.ts`) has one word, "program". No Australian editor has read it; the Style Manual's dictionaries (ACOD, Macquarie) were not consulted word by word.
6. **The example visits on the landing page carry fixed 24-hour times.** `countries/_dil/en/acilis.ts:98, 109, 120` (`saat: '09:14'`, `'11:03'`, `'16:40'`) are shown as written ("A VISIT · 09:14 · GENERAL TEMPLATE", seen in Part C), while the product writes a time as "9:14 am" in a 12-hour country. To change: pass these through the kit's `saatGoster`, or let the set write them per form.

---

## Part E — medicines (research only; no medicine content was written)

**The official register and terminology.**

| What | Publisher | Where | Format and updates | Terms of reuse |
|---|---|---|---|---|
| **Australian Register of Therapeutic Goods (ARTG)** — the legal register of every medicine that may be supplied | Therapeutic Goods Administration (TGA), Department of Health, Disability and Ageing | https://www.tga.gov.au/resources/artg ; datasets: https://www.tga.gov.au/resources/datasets | a searchable register with public summaries; whether a bulk file exists and how often it is refreshed: **UNVERIFIED** (the site refuses automated readers) | Commonwealth copyright; the licence was **not read: UNVERIFIED**. A lawyer or the owner must read the TGA's copyright page before any reuse. |
| **Australian Medicines Terminology (AMT)**, part of SNOMED CT-AU — "A national, standards-based approach to the identification and naming of medicines in clinical systems for Australia" | National Clinical Terminology Service (NCTS), for the Australian Digital Health Agency; operated with CSIRO | https://www.healthterminologies.gov.au ; fact sheet: https://www.healthterminologies.gov.au/library/amt-australian-medicines-terminology-fact-sheet.pdf | "AMT is released monthly to include new items on the Australian Register of Therapeutic Goods from the TGA"; it "can be downloaded in a variety of formats" from the NCTS site; a terminology server is also offered. It defines products by "active ingredient(s), product trade name, dosage form, strength, pack size and container type". **It holds no dosing information.** | A user must "register on the NCTS website and accept" two "free licence agreements": the **"SNOMED CT Affiliate Licence Agreement"** and the **"Australian National Terminology Licence Agreement"**. Whether these allow use inside a commercial product sold from outside Australia, and what attribution they require, was **not read: for the owner and a lawyer**. |
| **Schedule of Pharmaceutical Benefits (PBS)** — the subsidised medicines, with their restrictions | Department of Health, Disability and Ageing | https://www.pbs.gov.au/info/browse/download | text files and XML (schema V3 since September 2017), with "the regular Schedule update that occurs on the first of each month" | "material contained on this website is copyright material"; reproduction is allowed "for personal use as general reference" with notices intact; **no open licence is named** (https://www.pbs.gov.au/info/general/copyright). Commercial reuse would need permission. |
| **Ingredient names** — the Australian Approved Names | TGA | https://www.tga.gov.au/products/regulations-all-products/ingredients-and-scheduling-medicines-and-chemicals/ingredients-therapeutic-goods/naming-ingredients | **UNVERIFIED** | **UNVERIFIED** |

**Dosing information.** No openly reusable official source of doses was found. The approved Product Information of each medicine is published through the TGA and belongs to its sponsor; the references Australian clinicians use for dosing are licensed publications — the Australian Medicines Handbook, Therapeutic Guidelines, MIMS, and AusDI — each sold by subscription. These names are general knowledge and their terms were **not read: UNVERIFIED**. Any dosing content in the product would need a licence from one of them; none may be copied in.

**What the pack would need to take a names list.** The slots exist and are empty and switched off (`countries/_dil/en/araclar/yuvalar.ts`, shown in the record as "Needs local content"): `prescription` ("the register of medicines authorised in Australia (names, forms, strengths), the prescription form and its mandatory fields, and the rules for controlled medicines"), `medicine-interactions` (interaction data from a licensed or official source, and the register of products to search by), `polypharmacy` and `anticoagulation-review` (the register "to recognise each medicine by the name it has there"). Today a slot is a description only: `icerik: null`. To take a names list the kit would need (a) a place for a country's medicine list that is data, not text — loaded on the server, versioned by release date, never bundled into the browser; (b) a record of the release used and of the licence accepted; (c) a monthly update path. None of that exists, and it is kit work.

**Risks.** (1) Licence: the NCTS agreements are personal to the registered organisation; using AMT without having read and accepted them, or outside their territory terms, would be a breach. (2) Staleness: AMT changes monthly; a list that is six months old misses new products and keeps withdrawn ones. (3) Names without doses invite a doctor to trust the product for more than a name; the note instruction's rule ("write the name, the dose and the frequency exactly as they were said") must stay. (4) A names list used to *check* or *suggest* a medicine moves the product toward the medical-device questions (legal question 3). (5) Brand names are trade marks; ingredient names are the safer first list. (6) Speech recognition of medicine names in Australian accents has not been measured.

**Recommendation — one route for the owner to decide on.** Register Notya with the National Clinical Terminology Service, have a lawyer read the two licence agreements for commercial use, and — only if they allow it — take the **ingredient (medicinal product) level of the Australian Medicines Terminology** as a names-only list for spelling medicine names correctly in a drafted note; no brand names, no strengths, no doses in the first step. Dosing stays out of the product until a licence with one of the compendia exists. Until both are done, the slots stay empty and off, as they are.

---

## Open items

| # | Item | Waits on |
|---|---|---|
| 1 | Read this audit and the pack's texts; confirm or correct every CONFORMS row | a local clinician |
| 2 | Clock for clinic screens: 12-hour (today) or 24-hour (B4) | a local clinician |
| 3 | Laboratory units not confirmed from a readable page: creatinine, haemoglobin, urine albumin-to-creatinine ratio (the one page read says mg/g), prostate-specific antigen, C-reactive protein, sedimentation rate (B16–B19). Until then the two KDIGO tools stay off | a local clinician (a pathologist or a clinical lead) |
| 4 | Map "Thoracic surgery", "Cardiac and vascular surgery" and "Oncology" to Australia's fields, or decide they are not offered (B29) | a local clinician, then Claude (Shared English set 2) |
| 5 | The five clinic roles' names, "Cosmetic medicine" first (B30) | a local clinician and a lawyer |
| 6 | "Clinical psychologist", "Dietitian", "Audiologist": are these the right words for an account's profession (B33) | a local clinician |
| 7 | Legal questions 1–5 of Part A, the Medicare card number among them; the guardian age (B43); the recording-consent sentence (B47) | a lawyer |
| 8 | Whether to offer Lord Howe Island and the external territories as time zones (B11) | Kaan |
| 9 | Re-check by a person with a browser the pages this audit could not open: the ACMA list of numbers for creative works (the example phone number), the Style Manual's currency page, the Australian Government's time-zone page, the TGA pages, Australia Post's addressing guide, the RCPA's SPIA guideline, the Healthcare Identifiers Act | Claude with Kaan (a person must open them), or a local person |
| 10 | Core findings 1–8 (date and time entry first; then the time-zone names and the first-login question) | Claude, on Kaan's word (kit work, outside this audit) |
| 11 | Shared English set findings 1–6 | Claude, on Kaan's word (shared set, outside this audit) |
| 12 | Medicines: decide on the recommendation of Part E (register with the National Clinical Terminology Service; lawyer reads the two licences) | Kaan, then a lawyer |
| 13 | Languages other than English on the patient's page and form (B46) | Kaan |
| 14 | Prices for Australia; opening sign-up; showing the site to search engines | Kaan (unchanged by this audit) |
