# Country pack: Canada (`ca`)

Answers to `docs/COUNTRY-PACK-CHECKLIST.md` for the country `ca`. Code: `countries/ca/`, on top of the English language set `countries/_dil/en/`. How a country is built: `docs/COUNTRY-PACK-HOWTO.md` ("Adding a country that shares a language").

**Written by `NOTYA_COUNTRY=ca npx --yes tsx scripts/ulke-en-kayit.mts` on 2026-10-09 (NOTYA-ULKE-EN-01). The tables below are read from the pack; do not edit them by hand — change the pack and run the command again.**

## Status

- **Nothing is live.** No deployment exists and **no database exists for this country.** One database per country: the owner creates a new, empty one, and the baseline (`lib/db/ulke/000_yeni_ulke_veritabani.sql`) is run on it once. No script of this country is ever run on the Turkish database or on another country's (section M).
- **The pack is complete and builds**: the pack check finds nothing, `NOTYA_COUNTRY=ca npm run build:ulke` builds it, and the pack-neutral walk-through passes on stand-ins.
- **Sign-up is closed** (invitation code only) and **the site is hidden from search**. Both are opened by the owner only.
- Language form: `en-CA`. Served at: `/ca`.
- **EVERY TEXT IS MACHINE-WRITTEN AND UNREAD.** No clinician, no lawyer and no native editor of Canada has read a line of it. **EVERY SETTING BELOW IS UNVERIFIED.**
- **No claim is made** anywhere in this pack that the product complies with any law or standard, is approved, cleared or certified by any authority, or is connected to any record system or state system.

## What building the pack does NOT prove

A pack that builds has every text and setting filled in. It says nothing about whether they are right. Each gate below is passed by a person and recorded here with a name and a date.

## What is in this pack, and where it comes from

- **From the shared English set** (`countries/_dil/en/`, written once for five countries): 1958 texts as this pack shows them or hands the model (the country's own, counted in the next line, among them) — the screens, the role names, 40 note templates, the instructions to the model, the intake questions, 43 tools, the landing copy — written in `en-CA` spelling by the set's spelling table.
- **This country's own** (`countries/ca/`, six small files): 23 texts it writes itself (its consent sentence, identifier label, time sentence, date example, name, word for a senior doctor, role names where they differ, what its closed tools are missing and who decides, unit names and tool words it writes differently, the example phone number and the pattern of an amount) and the settings in the table below.

## Settings — every one unverified

| Setting | Value in the pack | Waits on |
|---|---|---|
| Country code and path | `ca`, served at `/ca` | the owner (a routing rule on the live site is his decision) |
| Language form and spelling | `en-CA` | a native editor |
| Default time zone; zones an account may choose | America/Toronto; America/Toronto, America/St_Johns, America/Halifax, America/Winnipeg, America/Regina, America/Edmonton, America/Vancouver, America/Whitehorse | product, with a local lead. Several zones are offered (listed in the row) and an account chooses its own; the default (America/Toronto) and the list are unverified choices. |
| Date pattern; clock; first day of the week | YYYY-MM-DD; 12-hour; Sunday | a local lead |
| Units | weight kg, height cm, temperature °C | a local clinical lead — a clinical-safety setting |
| Laboratory units | urine albumin-to-creatinine ratio: mg/mmol; haemoglobin: g/L; creatinine: umol/L; glucose: mmol/L; cholesterol: mmol/L | a local clinical lead — a clinical-safety setting; the kit converts from the unit stated here |
| Currency | CAD | the owner |
| Prices | EMPTY, SWITCHED OFF: every plan "by quote" | **WAITING ON KAAN** |
| Emergency (ambulance) number on the patient's page | `911` — UNVERIFIED | a local source, before any patient sees the portal |
| Days a patient's link stays valid | 30 | the owner; how long access may stand: for a lawyer |
| Patient identifier | optional free text, encrypted, never validated; label "Health card number" | a local lead and a lawyer. Label "Provincial health card number". Format and name differ by province and territory; unverified. |
| Guardian age | 16 | **for a lawyer**. 16 as a starting value. Consent of minors is a matter of provincial law and differs by province; Quebec sets its own age. |
| Recording-consent sentence | "The patient, or the person who can consent for them, has agreed to this visit being recorded." — stamp `ca-draft-2026-10-09`, NOT READ BY A LAWYER | **for a lawyer**. A draft sentence. Federal and provincial rules on recording a consultation are open. |
| Intake-form consent sentence | the shared draft — stamp `ca-draft-2026-10-09`, NOT READ BY A LAWYER | **for a lawyer** |
| Word for a senior doctor (in the instructions to the model) | "staff physician" | a local clinical lead |
| Phone: prefix, example, rule | +1; 613-555-0123; a format rule only | a local lead. The example is one of the numbers the North American numbering plan sets aside for fiction (555-0100 to 555-0199 in every area code). Unverified. |
| Appointment norms | 09:00–17:00, 30 min; no public holiday | a local clinical lead |
| Speech: model, thresholds | scribe_v2; 0.8, -0.36, 40 characters | engineering, on real clinic audio of this country |
| Assistant names | NONE. Every role shows the neutral line | **WAITING ON KAAN** |
| Sign-up; search | invitation only; hidden | the owner |

- ENGLISH ONLY. French is not written: no screen, no note, no patient text. Waiting on Kaan.
- Canadian spelling is a mix stated word by word in the language set (colour, centre; organize, pediatric); no Canadian editor has read it.
- FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in µg/L (numerically the same as ng/mL).
- FOR A LOCAL CLINICAL LEAD: the report outline with the BI-RADS assessment categories is switched on here; the ESI triage record and the two KDIGO tools are kept as slots (below).
- The date is written year first (YYYY-MM-DD), the week starts on Sunday and the clock is 12-hour: unverified choices.

## Regulatory questions — none answered here; each is for a lawyer

1. PIPEDA, and THE PROVINCIAL HEALTH-PRIVACY LAWS that apply instead of it or beside it (each province has its own; some are deemed substantially similar): which law governs a private doctor in each province, the roles of the clinic and the product, and storing or processing patient data outside the province or outside Canada. **(for a lawyer)**
2. QUEBEC: its own privacy law and its own language law. FRENCH IS ABSENT from this pack: whether the product may be offered in Quebec, or anywhere in Canada to French-speaking patients, without French is a legal and a commercial question. WAITING ON KAAN. **(for a lawyer)**
3. Whether any tool or the drafting of a note is regulated as a medical device, and what that requires. **(for a lawyer)**
4. Minors: consent by province; what a guardian form may ask. **(for a lawyer)**
5. Recording a consultation: consent and retention, federally and by province. **(for a lawyer)**

## Roles — 40, names unverified

The keys are the shared English key set (`docs/COUNTRY-PACK-ROLE-KEYS.md`). The names are how each role is shown in this country; none was checked against the country's official list of specialties, and no role's template, questions or tools have been read by a clinician. **Waits on: a local clinical lead and a reviewer per role.**

| Key | Name shown | Kind |
|---|---|---|
| `emergency-medicine` | Emergency medicine | doctor specialty |
| `family-medicine` | Family medicine | doctor specialty |
| `anaesthesia` | Anesthesiology | doctor specialty |
| `neurosurgery` | Neurosurgery | doctor specialty |
| `paediatric-surgery` | Pediatric surgery | doctor specialty |
| `internal-medicine` | Internal medicine | doctor specialty |
| `dermatology` | Dermatology | doctor specialty |
| `endocrinology` | Endocrinology and metabolism | doctor specialty |
| `infectious-diseases` | Infectious diseases | doctor specialty |
| `gastroenterology` | Gastroenterology | doctor specialty |
| `general-surgery` | General surgery | doctor specialty |
| `thoracic-surgery` | Thoracic surgery | doctor specialty |
| `respiratory-medicine` | Respirology | doctor specialty |
| `ophthalmology` | Ophthalmology | doctor specialty |
| `obstetrics-gynaecology` | Obstetrics and gynecology | doctor specialty |
| `cardiovascular-surgery` | Cardiac and vascular surgery | doctor specialty |
| `cardiology` | Cardiology | doctor specialty |
| `otolaryngology` | Otolaryngology – head and neck surgery | doctor specialty |
| `nephrology` | Nephrology | doctor specialty |
| `neurology` | Neurology | doctor specialty |
| `oncology` | Oncology | doctor specialty |
| `orthopaedics` | Orthopedic surgery | doctor specialty |
| `paediatrics` | Pediatrics | doctor specialty |
| `plastic-surgery` | Plastic surgery | doctor specialty |
| `psychiatry` | Psychiatry | doctor specialty |
| `radiology` | Diagnostic radiology | doctor specialty |
| `rheumatology` | Rheumatology | doctor specialty |
| `urology` | Urology | doctor specialty |
| `sports-medicine` | Sport and exercise medicine | doctor specialty |
| `rehabilitation-medicine` | Physical medicine and rehabilitation | doctor specialty |
| `hair-transplant` | Hair transplantation | clinic doctor |
| `aesthetic-surgery` | Cosmetic surgery | clinic doctor |
| `aesthetic-medicine` | Aesthetic medicine | clinic doctor |
| `clinic-dermatology` | Dermatology (clinic) | clinic doctor |
| `longevity` | Preventive and longevity medicine | clinic doctor |
| `physiotherapy` | Physiotherapist | clinic allied profession |
| `clinical-psychology` | Clinical psychologist | clinic allied profession |
| `dietetics` | Dietitian | clinic allied profession |
| `occupational-therapy` | Occupational therapist | clinic allied profession |
| `audiology` | Audiologist | clinic allied profession |

## Tools

### Switched on (43) — with the unit each measured input takes

Units are a clinical-safety matter. A length or a weight is typed in this pack's unit and converted by the kit with the exact defined factors (1 in = 2.54 cm, 1 lb = 0.45359237 kg); a laboratory value is typed in the unit shown. `countries/ca/ca.test.ts` runs every tool below with this country's units against the kit's reference result. **Every tool's text is machine-written; each waits on a local clinical lead.**

| Tool | Name | Who sees it | Measured inputs and their units |
|---|---|---|---|
| `hasta-portali` | Patient's page | every role | no measured input |
| `kritik-yol` | Critical conditions checklist | Emergency medicine | no measured input |
| `asa-preop` | ASA class and pre-operative checklist | Anesthesiology | no measured input |
| `hava-yolu-notu` | Airway note | Anesthesiology | no measured input |
| `postop-agri` | Post-operative pain follow-up | Anesthesiology | no measured input |
| `noro-postop` | Checklist after a neurosurgical operation | Neurosurgery | no measured input |
| `nobet-bilinc` | Seizure and consciousness follow-up | Neurosurgery | no measured input |
| `cocuk-prepost-op` | Checklist before and after an operation | Pediatric surgery | no measured input |
| `yara-dren-izlem` | Wound, drain and stitches follow-up | Pediatric surgery, General surgery | Drain output (optional): **mL** · result in mL |
| `genel-preop` | Pre-operative checklist | General surgery | no measured input |
| `pasi` | PASI score | Dermatology | no measured input |
| `easi` | EASI score | Dermatology | no measured input |
| `scorad` | SCORAD index | Dermatology | Area of skin involved: **%** |
| `yama-okuma` | Patch test: reading days | Dermatology | no measured input |
| `rejim-karti` | Insulin and thyroid treatment: date card | Endocrinology and metabolism | no measured input |
| `antibiyotik-sure` | Antibiotic course: counting days | Infectious diseases | Length of the course: **days** |
| `toraks-preop` | Checklist before a chest operation | Thoracic surgery | no measured input |
| `toraks-tup-yara` | Chest drain and wound follow-up | Thoracic surgery | no measured input |
| `inhaler-teknik` | Inhaler technique | Respirology | Check the technique again after (optional): **months** |
| `gorme-keskinligi` | Visual acuity: logMAR | Ophthalmology | no measured input |
| `kalp-damar-preop` | Checklist before a heart or vascular operation | Cardiac and vascular surgery | no measured input |
| `greft-yara-izlem` | Vascular graft and wound follow-up | Cardiac and vascular surgery | no measured input |
| `antikoagulan-vadeleri` | Antithrombotic treatment: review dates | Cardiac and vascular surgery | no measured input |
| `odyometri-pta` | Pure-tone audiometry: average threshold | Otolaryngology – head and neck surgery | Threshold at 0.5 kHz: **dB**; Threshold at 1 kHz: **dB**; Threshold at 2 kHz: **dB**; Threshold at 4 kHz: **dB**; Earlier average threshold (optional): **dB**; Average threshold of the other ear (optional): **dB** · result in dB |
| `otoskopi-notu` | Otoscopy note | Otolaryngology – head and neck surgery | no measured input |
| `vertigo-notu` | Vertigo: positional test note | Otolaryngology – head and neck surgery | no measured input |
| `diyaliz-seans` | Dialysis session and next date | Nephrology | no measured input |
| `kur-sayaci` | Treatment cycle counter | Oncology | no measured input |
| `toksisite-listesi` | Side effects checklist | Oncology | no measured input |
| `kirik-alci-takip` | Fracture, cast and brace follow-up | Orthopedic surgery | no measured input |
| `ortopedi-op-protokol` | Post-operative checklist | Orthopedic surgery | no measured input |
| `vas-fonksiyon` | Pain and function rating | Orthopedic surgery | no measured input |
| `hedef-boy` | Expected height from the parents' heights | Pediatrics | Mother's height: **cm**; Father's height: **cm** · result in cm |
| `doz-hesabi` | Dose arithmetic by body weight | Pediatrics | Body weight: **kg**; Dose per kilogram: **mg/kg**; Concentration: milligrams (optional): **mg**; Concentration: millilitres (optional): **mL**; The limit you set for one dose (optional): **mg**; The limit you set for one day (optional): **mg** · result in mg, mL, hours |
| `plastik-yara-greft` | Wound, graft and flap follow-up | Plastic surgery | no measured input |
| `tetkik-kuyrugu` | Examination queue | Diagnostic radiology | no measured input |
| `rapor-taslagi` | Structured report outline | Diagnostic radiology | no measured input |
| `das28` | DAS28 disease activity score | Rheumatology | Patient's global assessment: **mm**; C-reactive protein: **mg/L**; Erythrocyte sedimentation rate: **mm/h** |
| `eklem-28` | 28-joint count | Rheumatology | no measured input |
| `psa-hizi` | Prostate-specific antigen: rate of change | Urology | Earlier value: **µg/L**; Latest value: **µg/L** · result in µg/L per year, days |
| `rtp-basamak` | Stages of return to sport | Sport and exercise medicine | no measured input |
| `sakatlik-gunlugu` | Injury log | Sport and exercise medicine | Training in the last 7 days (optional): **min**; Earlier average weekly training (optional): **min** |
| `takip-paneli` | Follow-up list | Emergency medicine, Anesthesiology, Neurosurgery, Pediatric surgery, Dermatology, Endocrinology and metabolism, Infectious diseases, General surgery, Thoracic surgery, Respirology, Ophthalmology, Cardiac and vascular surgery, Otolaryngology – head and neck surgery, Nephrology, Oncology, Orthopedic surgery, Pediatrics, Plastic surgery, Diagnostic radiology, Rheumatology, Urology, Sport and exercise medicine | no measured input |

### Kept as slots FOR THIS COUNTRY (3) — for a local clinical lead

The shared English set has the words of these tools and the kit has their mechanism; this country keeps them switched off for the reason given.

| Tool | Who would see it | Why it is off here | Waits on |
|---|---|---|---|
| `esi-triyaj` | Emergency medicine | The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in Canada use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say. | a clinical lead in Canada |
| `kdigo-evre` | Internal medicine | UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit. | a clinical lead in Canada |
| `kdigo-serit` | Nephrology | UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with. | a clinical lead in Canada |

### Slots in every English-speaking country (52) — empty, switched off

No national reference content is written by a machine, and no item of a published questionnaire is reproduced. The sentences of a slot are written for documents and reviewers and are never shown on a screen; in every pack they stay in the set's base spelling (British), whatever the pack's own form.

| Slot | Who would see it | What is missing | Waits on |
|---|---|---|---|
| `prescription` | every role | Prescription drafting: the register of medicines authorised in Canada (names, forms, strengths), the prescription form and its mandatory fields, and the rules for controlled medicines. Without the register no medicine can be offered or checked. | a local clinical lead, with the national source named |
| `visit-summary-document` | every role | Visit and discharge summary as a document: the headings and mandatory fields of the summary a clinic in Canada issues. | a local clinical lead, with the national source named |
| `diagnosis-coding` | every role | Diagnosis coding: the coding edition in force in Canada with its official titles. A coding table is reference content of an authority and is not written by a machine. | a local clinical lead, with the national source named |
| `medicine-interactions` | every role | Medicine interactions: the interaction data itself (by active substance) from a licensed or official source, and the register of products and brand names sold in Canada to search by. | a local clinical lead, with the national source named |
| `patient-certificates` | every role | Certificates for patients: the forms a clinic in Canada issues (sickness and fitness certificates, attendance notes), their fields and the periods the rules allow. | a lawyer of the country, with the local clinical lead |
| `test-requests` | every role | Laboratory and imaging requests: the catalogue of tests offered locally, the units and reference ranges of the local laboratories, and the request form layout. | a local clinical lead, with the national source named |
| `end-of-visit` | every role | End-of-visit flow: it strings together prescription, certificate, follow-up appointment and the summary for the patient. It waits for the prescription and certificate slots above; the appointment and the summary exist already as screens of their own. | a local clinical lead, with the national source named |
| `emergency-referral` | Emergency medicine | Admission, referral and discharge package of an emergency department in Canada: the documents that go with each, the levels of care a patient can be referred to, and who must be notified. | a local clinical lead, with the national source named |
| `family-vaccination-screening` | Family medicine | The vaccination schedule of Canada with its catch-up rules, and its screening programmes (which examination, at which age, how often). | a local clinical lead, with the national source named |
| `family-chronic` | Family medicine | Follow-up intervals for diabetes and high blood pressure in primary care, from the guidance followed in Canada. | a local clinical lead, with the national source named |
| `family-referral` | Family medicine | Referral and emergency triage in primary care: the referral routes of Canada, the criteria for each, and the emergency number confirmed by a local source. | a local clinical lead, with the national source named |
| `family-follow-up-panel` | Family medicine | The follow-up panel of family medicine: it lists patients by the three tools above and has nothing to list until they exist. | a local clinical lead, with the national source named |
| `child-surgery-consent` | Pediatric surgery | Consent for an operation on a child: the age below which a parent or guardian signs, who may sign, and the wording of the consent, under the law of Canada. | a lawyer of the country, with the local clinical lead |
| `cardiovascular-risk` | Internal medicine, Cardiology | Ten-year cardiovascular risk: the risk calculator recommended in Canada, with its calibration and its tables. A risk score calibrated for one population must not be shown in another. | a local clinical lead, with the national source named |
| `polypharmacy` | Internal medicine | Review of medicines in older patients: the criteria in a licensed edition, and the register of medicines sold in Canada to recognise each medicine by the name it has there. | a local clinical lead, with the national source named |
| `anticoagulation-review` | Internal medicine | Anticoagulation review: the dose-reduction criteria of each anticoagulant as authorised in Canada (age, weight, kidney function), targets and recheck intervals from the guidance followed there, and the local medicine names. | a local clinical lead, with the national source named |
| `isotretinoin-pregnancy-prevention` | Dermatology | Pregnancy-prevention checks for isotretinoin: the programme the regulator of Canada requires (tests, contraception, prescription validity). | a local clinical lead, with the national source named |
| `lab-izlem` | Endocrinology and metabolism | HbA1c and TSH follow-up: the thresholds between the bands (12 numbers: two HbA1c cut-offs, four TSH limits, six intervals in months) from the guidance followed in Canada; the unit HbA1c is reported in there (per cent or mmol/mol: the kit's field has no unit choice yet); and the reference range the local laboratories report for TSH. | a local clinical lead, with the national source named |
| `dxa-tekrar` | Endocrinology and metabolism | Bone densitometry repeat: the years between two scans for a low, a medium and a high risk band (3 numbers) from the guidance followed in Canada. | a local clinical lead, with the national source named |
| `viral-izlem` | Infectious diseases | HIV and viral hepatitis follow-up: the months between two checks (3 numbers) from the guidance followed in Canada. | a local clinical lead, with the national source named |
| `notifiable-diseases` | Infectious diseases | Isolation and notification: the list of notifiable diseases in Canada, to whom and by when each is reported, the report form, and isolation periods. | a local clinical lead, with the national source named |
| `anemi-izlem` | Nephrology | Anaemia follow-up in chronic kidney disease: the target haemoglobin range, the lower limit and the months until the next check (6 numbers) from the guidance followed in Canada, stated in the unit its laboratories report haemoglobin in. | a local clinical lead, with the national source named |
| `iltihap-lab-izlem` | Rheumatology | CRP and ESR follow-up: the thresholds between the bands and the months until the next check (7 numbers), with the reference ranges and the CRP unit the laboratories of Canada use. | a local clinical lead, with the national source named |
| `basdai` | Rheumatology | BASDAI (Bath Ankylosing Spondylitis Disease Activity Index): a published patient questionnaire of six questions. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `kardiyo-izlem` | Cardiology | High blood pressure, heart-failure and atrial-fibrillation follow-up: the clinic blood-pressure limits that raise a warning and the days until each next check (9 numbers), from the guidance followed in Canada. | a local clinical lead, with the national source named |
| `cat-mmrc` | Respirology | COPD Assessment Test (CAT) with the mMRC breathlessness grade: CAT is a published questionnaire whose wording belongs to its rights holder. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `lung-action-plan` | Respirology | Written action plan for asthma and COPD: a sheet the PATIENT reads (what to do in each zone), with the emergency number and the stop-smoking service of Canada. Every sentence is an instruction to a patient and must be supplied and signed by a local respiratory doctor. | a local clinical lead, with the national source named |
| `ibd-skor` | Gastroenterology | Activity index follow-up (partial Mayo, Harvey-Bradshaw, IBS severity total): the cut-offs between remission, mild, moderate and severe and the months until the next check (13 numbers), as the guidance followed in Canada states them. | a local clinical lead, with the national source named |
| `hepatit-izlem` | Gastroenterology | Hepatitis B and C follow-up: the months until the next check for a stable patient, one under active follow-up and one being assessed for treatment (3 numbers) from the guidance followed in Canada. | a local clinical lead, with the national source named |
| `pregnancy-calendar` | Obstetrics and gynecology | Pregnancy calendar: the antenatal visit schedule and the screening windows followed in Canada. (Gestational-age arithmetic alone is universal; the tool is its schedule.) | a local clinical lead, with the national source named |
| `maternity-leave` | Obstetrics and gynecology | Maternity leave dates and certificate: the periods the law of Canada gives before and after birth, how they move with an early or late birth, and the certificate form. | a lawyer of the country, with the local clinical lead |
| `contraception-eligibility` | Obstetrics and gynecology | Medical eligibility for contraception: the eligibility criteria in the edition used in Canada, entered from the source and signed by a local clinician, and for emergency contraception the products authorised there. An eligibility table is not copied by a machine. | a local clinical lead, with the national source named |
| `obstetric-risk` | Obstetrics and gynecology | Obstetric risk prompts and the caesarean indication note: the guidance followed in Canada (who is offered which prophylaxis, in which window) and the form of the note its rules require. | a local clinical lead, with the national source named |
| `obstetric-follow-up-panel` | Obstetrics and gynecology | The follow-up panel of obstetrics and gynaecology: it lists patients by the antenatal and screening schedule above and has nothing to list until that exists. | a local clinical lead, with the national source named |
| `stroke-red-flags` | Neurology | Stroke and TIA red flags: the emergency number confirmed by a local source and the stroke pathway of the region (where a patient is sent, within which time window). | a local clinical lead, with the national source named |
| `midas` | Neurology | MIDAS (Migraine Disability Assessment): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `antiseizure-monitoring` | Neurology | Laboratory monitoring of antiseizure medicines: which tests, how soon after starting and how often, from the guidance followed in Canada, and the register of medicines sold there to recognise each by name. | a local clinical lead, with the national source named |
| `growth-percentiles` | Pediatrics | Growth and percentiles: the growth charts used in Canada (which standard, which charts, from which age) with their reference tables. | a local clinical lead, with the national source named |
| `vaccination-schedule` | Pediatrics | Vaccination schedule and catch-up: the immunisation schedule of Canada with its catch-up rules. | a local clinical lead, with the national source named |
| `development-screening` | Pediatrics | Development and screening panel: the screening programme for children in Canada (hearing, vision, supplements: which, at which age). | a local clinical lead, with the national source named |
| `mchat-rf` | Pediatrics | M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised, with Follow-Up): a published questionnaire for parents. THE LICENCE QUESTION: the permission of its authors and their terms for use inside a product. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `paediatric-follow-up-panel` | Pediatrics | The follow-up panel of paediatrics: it lists patients by the vaccination schedule and the screening programme above and has nothing to list until they exist. | a local clinical lead, with the national source named |
| `plastic-surgery-consent` | Plastic surgery | Informed-consent checklist for a plastic-surgery procedure: the items and the wording the law of Canada requires. | a lawyer of the country, with the local clinical lead |
| `phq9-gad7` | Psychiatry | PHQ-9 and GAD-7: published patient questionnaires. THE LICENCE QUESTION: the terms of use of their owner for showing the original English wording inside a commercial product. No item is reproduced here; the scoring, and the safety prompt on the ninth item of PHQ-9, are not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `psychiatry-safety-triage` | Psychiatry | Safety and emergency triage: the emergency number and the crisis service confirmed by a local source, the referral path, the rules for involuntary admission in Canada, and the wording of a crisis plan signed by a local psychiatrist. | a local clinical lead, with the national source named |
| `psychotropic-monitoring` | Psychiatry | Monitoring calendar of psychotropic medicines: which tests and how often for each class, from the guidance followed in Canada, and the register of medicines sold there. A monitoring schedule by medicine is clinical reference content. | a local clinical lead, with the national source named |
| `critical-finding-notice` | Diagnostic radiology | Critical-finding notice: who must be told, how fast, by which channel, under the rules of the institution and of Canada. | a local clinical lead, with the national source named |
| `ipss` | Urology | IPSS (International Prostate Symptom Score): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `urology-emergency-triage` | Urology | Haematuria and stone emergency triage: the emergency number confirmed by a local source and the referral path. | a local clinical lead, with the national source named |
| `rehabilitation-session-plan` | Physical medicine and rehabilitation | Session plan: any rule of Canada on the number and frequency of sessions (a public programme or an insurer), and the form a plan is written in. | a local clinical lead, with the national source named |
| `pain-odi` | Physical medicine and rehabilitation | Pain scale with the Oswestry Disability Index (ODI): ODI is a published patient questionnaire under licence. THE LICENCE QUESTION: the licence and its terms for the English version. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `home-exercise` | Physical medicine and rehabilitation | Home exercise sheet: a sheet the PATIENT reads (exercise names, how often, when to stop, whom to call). Every sentence is an instruction to a patient and must be supplied and signed by a local rehabilitation doctor. | a local clinical lead, with the national source named |

## Intake form — what it does not ask (18 slots)

| Slot | What is missing | What the form asks today | Waits on |
|---|---|---|---|
| `red_flag_checklists` | Per role: the list of "red flag" symptoms a patient selects before a visit, and the sentence that tells a patient who selects one what to do now (which service to call, and its number). A triage rule and an instruction to a patient: both are clinical content, and the service and its number are Canada's. | Nothing. No question of any role tells a patient to seek emergency care; the patient's page says only that it is not for emergencies (the portal's own sentence). | a local clinical lead |
| `self_harm_screening` | The safety (self-harm) screening question in wording a clinician of Canada has chosen, and the clinic's procedure for a "yes" given on a form nobody is watching (who is told, how fast, which crisis service is named). | Nothing. The psychiatry and psychology sets ask about mood, sleep and what is hardest now, in free text; no question asks about self-harm. | a local clinical lead |
| `validated_questionnaires` | Published questionnaires and scores (for example PHQ-9, GAD-7, IPSS, CAT, MIDAS, BASDAI, ODI, M-CHAT-R/F, DLQI). THE LICENCE QUESTION: each belongs to its authors or a rights holder; whether, on which terms and at what cost its original English wording may be shown inside a commercial product must be answered for each instrument before one item is displayed. None of their item wording is reproduced here. | Plain questions only. Pain is asked as a number from 0 to 10 with its two ends described in words; nothing is scored or summed. | the rights holder of each questionnaire, through the owner |
| `vaccination_checklist` | The vaccination schedule of Canada as a checklist (which vaccine at which age), so that a parent can mark what was given. | One question: "are the vaccinations up to date, as far as you know?" — yes, no, I do not know. Paediatrics adds a line asking to bring the vaccination record. | a local clinical lead |
| `development_milestones` | The developmental milestone checklist in use in Canada, by age. | One yes/no question: whether the parent is worried about the child's development, with a free-text line. | a local clinical lead |
| `screening_programme` | The screening and check-up programmes of Canada by age and sex (which tests, how often), to ask which of them the patient has had. | Free text: "tests or check-ups in the last year" and "when was the last full check-up". No test is named as due. | a local clinical lead |
| `antenatal_schedule` | The antenatal visit and screening schedule followed in Canada, and the fields of any pregnancy record a clinic must keep. | The week of pregnancy, the number of pregnancies and births, the first day of the last period. Nothing is derived from them. | a local clinical lead |
| `preoperative_instructions` | Pre-operative instructions a form would ask the patient to confirm (fasting times, which medicines to stop and when) and the consent form the law of Canada requires. | Nothing is instructed and nothing is confirmed. The sets ask about earlier anaesthetics, a tendency to bleed and blood-thinning medicines (name as free text). | a local clinical lead |
| `imaging_safety_checklist` | The safety checklist before imaging with contrast or a magnet, as used in Canada (which implants and conditions, in which wording), and what a "yes" means for the examination. | Four plain yes/no questions with a free-text line: an earlier reaction to contrast, metal or a fitted device, a known kidney problem, fear of closed spaces. The form decides nothing from them. | a local clinical lead |
| `medicine_lists` | Medicines authorised in Canada with the names they are sold under there, to offer as choices (blood thinners, inhalers, diabetes and heart medicines). A medicine has different names in different English-speaking countries; none is written by a machine. | Free text everywhere: the patient writes the name as they know it. No medicine, brand or dose is named. | a local clinical lead |
| `registered_procedures` | Cosmetic procedures, products and devices authorised in Canada, to offer as choices. | Free text: "which treatment, and when". No product or device is named. | a local clinical lead |
| `sports_clearance` | Any pre-participation medical clearance form required for athletes in Canada, and the anti-doping declaration. | The sport, the reason for the visit, injuries in the last year, symptoms during exercise, an earlier heart examination. | a local clinical lead |
| `hearing_programme` | The newborn hearing screening programme of Canada and the hearing-loss grading in use there. | Which ear, how the hearing went down, noise at work, a hearing aid. Nothing is graded. | a local clinical lead |
| `nutrition_reference` | Nutrient reference values and food composition tables of Canada, and named diets to offer as choices. | Meals and glasses of water a day as numbers, the diet followed and foods not eaten as free text. | a local clinical lead |
| `birth_weight_unit` | How a parent in Canada states a birth weight (grams, or pounds and ounces), so that it can be asked as a number with its unit. The kit's weight measure is kilograms or decimal pounds and fits neither. | Free text: "weight at birth, with its unit, as you know it". Nothing is calculated from it. | a local clinical lead |
| `payer_and_insurance` | Whether the form should ask who pays (a public programme, an employer, an insurer) and which numbers that needs in Canada. | Not asked. The form asks for no identity, policy or insurance number of any kind. | the owner, with a local source |
| `consent_sentence` | The consent sentence shown before the first question, and the notice a parent or guardian reads, in wording a lawyer in Canada has approved (checklist I1, I2); and whether a guardian's identity must be confirmed. | A machine-written draft sentence, stamped as a draft and marked as not read by a lawyer; the guardian form asks the guardian's name, relationship and phone, and confirms nothing. | a lawyer |
| `scope_of_practice` | What each allied profession may ask, record and decide without a doctor under the law of Canada. | The sets ask about the problem, daily life and a doctor's referral; none asks for a diagnosis to be made. | a lawyer |

## The checklist

Every gate is unticked: a gate is ticked by a person, with a name and a date. The line under a gate says where this pack stands today.

## Rules that stop one country leaking into another

- [ ] 1. Türkiye is a country pack like any other; nothing Türkiye-specific stays in the core.
  - The pack holds nothing of Türkiye; the walls and the leak scan run for it (`npm run test:ulke`).
- [ ] 2. No fallback between countries: a missing item hides the feature.
  - Nothing falls back: the pack check finds nothing missing, and a tool this country does not have is a slot, not another country's tool.
- [ ] 3. Every tool, form, reference and feature declares the countries it is valid in; new ones start off everywhere except where they were built.
  - Every tool is classified (base, or these roles) and 3 tool(s) of the shared English set are kept off for this country (below).
- [ ] 4. The account carries its country and language, set at sign-up from that country's landing page.
  - As in the kit: country and language are stamped at sign-up. One language form, `en-CA`.
- [ ] 5. Ayşe answers only from the account's country pack and says so when no national source exists.
  - The assistant in text and voice is not part of a country build. No assistant is named.
- [ ] 6. Each country has its own deployment and its own database; no country script is ever run on another country's database or on the Turkish one; every country row still carries its country's code and no read or write crosses countries; a build contains only its own pack.
  - One pack per build: built with `NOTYA_COUNTRY=ca npm run build:ulke`, proven on the output. NO DATABASE EXISTS for this country (section M).
- [ ] 7. An automated leak test scans every screen, note, answer, message and PDF for another country's terms.
  - The leak scan runs over every screen of this pack for the terms of every other country, the other English-speaking countries included (countries/ca/sizintiTerimleri.ts states this country's).
- [ ] 8. Türkiye is compared before and after every structural change and must match.
  - Türkiye's build is untouched by this pack; the Turkish suite is compared with `main` by test name.
- [ ] 9. Sign-ups for a country stay closed until section A passes and the clinical lead signs off.
  - Sign-up is closed (invitation code only) and the site is hidden from search.

## A. Gates before money is spent

- [ ] A1 Data law: where data may be stored and processed, sending abroad, consent form, registration, breach deadlines.
  - NOT ANSWERED — for a lawyer. See "Regulatory questions".
- [ ] A2 Special data: health, children, biometric; does a voiceprint count.
  - NOT ANSWERED — for a lawyer. The voice profile is off.
- [ ] A3 Consent for recording a visit.
  - NOT ANSWERED — for a lawyer. A draft sentence. Federal and provincial rules on recording a consultation are open.
- [ ] A4 Whether note-writing, clinical advice or image evaluation is regulated as a medical device, and by whom.
  - NOT ANSWERED — for a lawyer. See "Regulatory questions" (the medical-device question for the tools and for note drafting). Image evaluation is off.
- [ ] A5 Speech gate: listening and speaking quality per language on real clinic audio, judged by native clinicians on the finished note.
  - NOT DONE. The speech thresholds are starting values; no clinic audio from this country has been heard.
- [ ] A6 Named local clinical lead and a reviewer per specialty.
  - NOBODY NAMED. Waits on the owner.
- [ ] A7 State systems a private doctor must use and whether outside software may connect.
  - NOT RESEARCHED. The pack connects to no state or record system and claims none.
- [ ] A8 Selling without a local company, tax, how doctors pay, price level.
  - NOT ANSWERED. Waits on the owner (company, tax, payment, price level). No price exists.
- [ ] A9 Competitors, including any state-provided tool.
  - NOT RESEARCHED.

## B. Authorities and law register

For each entry: official local name, what it governs, source link, date checked, lawyer-confirmed or not.

- [ ] B1 Health ministry and subordinate bodies.
  - Not answered.
- [ ] B2 Doctor licensing, clinic licensing, how to check a licence.
  - Not answered.
- [ ] B3 Medicines regulator and register.
  - Not answered.
- [ ] B4 Device regulator.
  - Not answered.
- [ ] B5 Data protection regulator.
  - Not answered.
- [ ] B6 Public and private payers.
  - Not answered.
- [ ] B7 Operator of national e-health and e-prescription.
  - Not answered.
- [ ] B8 Chambers and specialty associations.
  - Not answered.
- [ ] B9 Laws on health care, patient rights, medical secrecy, personal data, biometric data, electronic signature, telemedicine, AI, consumer and subscription sales.
  - Not answered.
- [ ] B10 Medical record law: mandatory forms and fields, language and script, retention, patient's right to a copy.
  - Not answered.
- [ ] B11 Prescription law: format, language, controlled drugs, who may prescribe.
  - Not answered.
- [ ] B12 Minors and consent.
  - Not answered.
- [ ] B13 Notifiable diseases and mandatory reports.
  - Not answered.
- [ ] B14 Advertising law for medical services and health software.
  - Not answered.
- [ ] B15 Official-language requirements for businesses.
  - Not answered.

## C. Clinical knowledge pack, once per specialty and per clinic type

- [ ] C1 The country's official specialty name and its mapping to Notya's; note specialties present in one and not the other.
  - UNVERIFIED. The 40 role names are from general knowledge and were not checked against the country's official list of specialties (table below).
- [ ] C2 National protocols and standards: issuer, title, version date, language, where published, binding or not.
  - Not answered.
- [ ] C3 Reference books and handbooks in real use, confirmed by the reviewer.
  - Not answered.
- [ ] C4 Foreign guidelines accepted in practice.
  - Not answered.
- [ ] C5 National centre and association.
  - Not answered.
- [ ] C6 Medicines: registered products, local brand names, forms and strengths, dosing references, reimbursed list.
  - ABSENT. No medicine is named anywhere; every tool that needs the country's register is a slot.
- [ ] C7 Diagnosis coding edition and language; procedure coding.
  - ABSENT (slot `diagnosis-coding`).
- [ ] C8 Laboratory units and reference ranges.
  - UNVERIFIED. The unit each laboratory value is reported in is a starting value (settings below). No reference range is in the pack.
- [ ] C9 Growth charts, vaccination calendar, screening programmes.
  - ABSENT. No growth chart, vaccination schedule or screening programme is in the pack: each is a slot.
- [ ] C10 Standard documents: reports, certificates, referrals, sick notes.
  - Not answered.
- [ ] C11 Local disease pattern that changes what Ayşe should think of first.
  - Not answered.
- [ ] C12 Note template per language.
  - MACHINE-BUILT. 40 templates, read by no clinician of this country.
- [ ] C13 Intake form per language.
  - MACHINE-WRITTEN. 23 core questions and 228 role questions, read by no clinician of this country.
- [ ] C14 Reviewer name, date, sign-off; a specialty is switched on only after this.
  - NOBODY. No role is signed off.
- [ ] C15 Owner and next review date for every source.
  - Not answered.

## D. Ayşe for the country

- [ ] D1 Locally natural name, title and background of a senior professor with 20+ years of practice in that country, decided with the clinical lead.
  - NO NAME PROPOSED. The pack builds without one; every role shows the neutral assistant line. WAITING ON KAAN.
- [ ] D2 Manner of address, formality, patronymics or honorifics.
  - Not answered.
- [ ] D3 Sources: only section C.
  - Not answered.
- [ ] D4 The clinical answer audit rewritten by local clinicians for every specialty and clinic type, with a pass mark set before launch.
  - Not answered.
- [ ] D5 Voice: model, voice chosen by native listeners, pronunciation list for drug names and terms, reading of numbers, dates and units.
  - Not part of this job: the assistant's voice.
- [ ] D6 One voice agent copy per language, one brain.
  - Not answered.
- [ ] D7 Spoken-versus-screen rule kept.
  - Not answered.
- [ ] D8 Colleague features (suggestions, whisper cards, learning from revisions) checked for local content.
  - Not answered.

## E. Language pack, once per language

- [ ] E1 All screen text, none written directly in code.
  - All screen text comes from the English language set and this folder; none is written in code.
- [ ] E2 Script variants.
  - One form, `en-CA`: the spelling is made from the set's base by the spelling table (countries/_dil/en/sozluk.ts). No native editor has read it.
- [ ] E3 Dates, numbers, currency, names and patronymics, addresses, phones, week start, holidays, time zone.
  - Settings below; every one unverified.
- [ ] E4 Clinician-approved glossary and abbreviations.
  - Not answered.
- [ ] E5 Speech recognition engine per language; mixed-language visits; second pass only on low confidence.
  - One engine, English; the one second pass (on low confidence) repeats the same recording in English. No second language.
- [ ] E6 Doctor's choices: screen language, note language, one-click rewrite of a note in another language, Ayşe's spoken language, prescription language; one question at setup, defaults for the rest.
  - Not answered.
- [ ] E7 Patient language set per patient.
  - Not answered.
- [ ] E8 Message and email templates, with delivery tested so mail does not land in junk.
  - Not answered.
- [ ] E9 PDFs and print render the script correctly.
  - Not answered.
- [ ] E10 Sorting, search and name matching across scripts.
  - Not answered.
- [ ] E11 Native review of all patient-facing and marketing text.
  - NOT DONE. No native reader has read any patient-facing or marketing text.

## F. Tools


- [ ] F1 Every core tool and every specialty tool gets a verdict per country: Remove, Adapt, Keep, or Add.
  - See "Tools" below: switched on, kept as a slot for this country, or a slot everywhere.
- [ ] F2 Remove: tools tied to another country's state or payer systems.
  - The 14 tools tied to Türkiye's state and payer systems are blocked for every other country (rule D7).
- [ ] F3 Adapt: same purpose, local content (vaccination, coding, drug names, document formats, consent forms, risk scores calibrated by region).
  - Not answered.
- [ ] F4 Keep: universal scales and calculators after translation and a unit check.
  - Unit check done by test for every switched-on tool (countries/ca/ca.test.ts); a clinician has not read them.
- [ ] F5 Add: tools the country needs that others do not, confirmed by the clinical lead.
  - Not answered.
- [ ] F6 The registry records the countries each tool is valid in; the gate before adding any tool asks "core or which specialty?" and "which countries?".
  - Not answered.
- [ ] F7 A specialty's tools are switched on with that specialty's sign-off.
  - NOT DONE. No specialty has a sign-off.

## G. Records, documents and identity

- [ ] G1 Mandatory record forms and fields.
  - Not answered.
- [ ] G2 Note structure doctors expect.
  - Not answered.
- [ ] G3 Prescription output; controlled drugs per law.
  - Not answered.
- [ ] G4 Certificates, referrals, sick notes.
  - Not answered.
- [ ] G5 National identity and insurance numbers: format and validation.
  - UNVERIFIED. Label "Provincial health card number". Format and name differ by province and territory; unverified.
- [ ] G6 Signature and stamp conventions.
  - Not answered.
- [ ] G7 Retention and deletion.
  - Not answered.
- [ ] G8 Export and patient copy.
  - Not answered.

## H. State systems and outside services

- [ ] H1 Other countries' state systems switched off.
  - No other country's state system exists in this build.
- [ ] H2 The country's own: where entry is mandatory, Notya prepares paste-ready content and the doctor enters it; nothing automated without registration.
  - Not answered.
- [ ] H3 No integration claims until one exists.
  - No integration is claimed anywhere (tested).
- [ ] H4 Messaging channels patients really use.
  - Not answered.
- [ ] H5 Calendar, maps, SMS, email and payment providers that work there.
  - Not answered.

## I. Privacy, consent and security

- [ ] I1 Consent text per feature and language, lawyer-reviewed: recording, AI processing, transfer abroad, portal, messaging, voice profile.
  - NOT DONE — for a lawyer. Both consent sentences are drafts.
- [ ] I2 Patient notice and guardian consent.
  - NOT DONE — for a lawyer. 16 as a starting value. Consent of minors is a matter of provincial law and differs by province; Quebec sets its own age.
- [ ] I3 Agreement with the clinic on data handling.
  - Not answered.
- [ ] I4 Regulator registration.
  - Not answered.
- [ ] I5 Breach procedure with local deadlines.
  - Not answered.
- [ ] I6 Where data lives and which outside providers receive it.
  - NOT DECIDED — for a lawyer and the owner. No database, no provider account exists for this country.
- [ ] I7 Features gated by law.
  - Not answered.
- [ ] I8 Messages between a doctor and a patient inside the product: whether the country's law permits them, what the patient must be told, who may be written to (minors, guardians), how long they are kept. Read by a lawyer before a patient is written to.
  - Not answered.
- [ ] I9 Sharing a patient's data with a colleague for a consultation: the consent sentence the asking doctor ticks, whether a consent recorded by the doctor is enough, and how long the colleague may read the copy. Read by a lawyer; the two periods confirmed by the owner.
  - Not answered.

## J. Product settings


- [ ] J1 Feature table.
  - Not answered.
- [ ] J2 Specialties and clinic types enabled.
  - All 40 roles are offered; none is reviewed.
- [ ] J3 Staff roles and local names.
  - See C1.
- [ ] J4 Appointment norms.
  - Starting values (settings below).
- [ ] J5 Onboarding: language question, licence field, local specialty list.
  - Not answered.
- [ ] J6 Plans, prices, tax display, invoices.
  - NO PRICE. Every plan is "by quote". WAITING ON KAAN.
- [ ] J7 Trial and discount rules.
  - None. No trial, no discount.

## K. Going to market

- [ ] K1 Landing page per language with sign-up and login.
  - One landing page, in English, machine-written.
- [ ] K2 Hidden from search until the pilot approves it.
  - Hidden: noindex on every response, robots.txt disallows everything.
- [ ] K3 No public demos, no integration claims.
  - No public demo, no integration claim (tested).
- [ ] K4 Legal pages.
  - ABSENT. No legal pages exist. for a lawyer.
- [ ] K5 Address.
  - Not answered.
- [ ] K6 Pilot of 5 to 10 doctors across city and region.
  - Not answered.
- [ ] K7 Deck and training material.
  - Not answered.
- [ ] K8 Support: who, which language, which hours.
  - Not answered.

## L. Running it

- [ ] L1 Cost per visit, second-pass rate, speech confidence.
  - Not answered.
- [ ] L2 Feedback channel in the local language.
  - Not answered.
- [ ] L3 Content update calendar.
  - Not answered.
- [ ] L4 Company, contracts, tax registration, payment account.
  - Not answered.

## M. The country's own database

How each step is done: `docs/COUNTRY-PACK-DB-ROLLOUT.md`, "Creating a new country's database".

- [ ] M1 The country's own database exists: a separate, empty project, in a region the country's data law allows (A1), created on the owner's word (it has a monthly cost).
  - NO DATABASE EXISTS. Waits on the owner.
- [ ] M2 The baseline (`lib/db/ulke/000_yeni_ulke_veritabani.sql`) was run on it once, and the result was checked against the file: tables, columns, row-level rules, functions, the ledger.
  - Not run.
- [ ] M3 Every country migration written after that copy of the baseline has been run on it, in order; the ledger lists them.
  - Not run.
- [ ] M4 Public sign-up is switched off in the country's own project; accounts are created only by the country's invitation route.
  - Not set.
- [ ] M5 The country's deployment holds its own settings: country code, its database's address and keys, and an encryption key of its own, never another country's.
  - Not set.
- [ ] M6 No script of this country was run on any other database: not another country's, not the Turkish one.
  - True: no script of this country was run on any database.

## Decisions and open questions

- 2026-10-09 (the coordinator, for the owner): spelling is converted when the pack loads; one English role-key set for the five countries; no assistant names; birth weight asked as free text; patient wording kept country-neutral.
- 2026-10-09 (the coordinator, for the owner): unit and scale decisions accepted as stated — each **for a local clinical lead**: the KDIGO tools are switched on only where laboratories report mg/g; the ESI triage record only in the United States; the BI-RADS report outline only in the United States and Canada; weight-based dose arithmetic is a slot where weight is measured in pounds; the DAS28 C-reactive protein field is labelled mg/L; prostate-specific antigen is shown in µg/L where that is the unit in use.
- 2026-10-09 (the coordinator, for the owner): an allied profession's instruction does not open with the senior-doctor line — its first sentence states the profession and that the colleague is not a doctor; the example phone number is from a range reserved for fiction where this job is certain of one, otherwise a shape that is no number; the sentences of the slots stay in British spelling in every pack (accepted).
- Open, with who each waits on: `docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-EN-01.
