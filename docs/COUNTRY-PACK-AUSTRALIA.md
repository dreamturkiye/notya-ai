# Country pack: Australia (`au`)

Answers to `docs/COUNTRY-PACK-CHECKLIST.md` for the country `au`. Code: `countries/au/`, on top of the English language set `countries/_dil/en/`. How a country is built: `docs/COUNTRY-PACK-HOWTO.md` ("Adding a country that shares a language").

**Written by `NOTYA_COUNTRY=au npx --yes tsx scripts/ulke-en-kayit.mts` on 2026-10-09 (NOTYA-ULKE-EN-01). The tables below are read from the pack; do not edit them by hand — change the pack and run the command again.**

## Status

- **Nothing is live.** No deployment exists and **no database exists for this country.** One database per country: the owner creates a new, empty one, and the baseline (`lib/db/ulke/000_yeni_ulke_veritabani.sql`) is run on it once. No script of this country is ever run on the Turkish database or on another country's (section M).
- **The pack is complete and builds**: the pack check finds nothing, `NOTYA_COUNTRY=au npm run build:ulke` builds it, and the pack-neutral walk-through passes on stand-ins.
- **Sign-up is closed** (invitation code only) and **the site is hidden from search**. Both are opened by the owner only.
- Language form: `en-AU`. Served at: `/au`.
- **EVERY TEXT IS MACHINE-WRITTEN AND UNREAD.** No clinician, no lawyer and no native editor of Australia has read a line of it. **EVERY SETTING BELOW IS UNVERIFIED.**
- **No claim is made** anywhere in this pack that the product complies with any law or standard, is approved, cleared or certified by any authority, or is connected to any record system or state system.

## What building the pack does NOT prove

A pack that builds has every text and setting filled in. It says nothing about whether they are right. Each gate below is passed by a person and recorded here with a name and a date.

## What is in this pack, and where it comes from

- **From the shared English set** (`countries/_dil/en/`, written once for five countries): 22236 texts as this pack shows them or hands the model (the country's own, counted in the next line, among them) — the screens, the role names, 40 note templates, the instructions to the model, the intake questions, 746 tools, the landing copy — written in `en-AU` spelling by the set's spelling table.
- **This country's own** (`countries/au/`, six small files): 84 texts it writes itself (its consent sentence, identifier label, time sentence, date example, name, word for a senior doctor, role names where they differ, what its closed tools are missing and who decides, unit names and tool words it writes differently, the example phone number and the pattern of an amount) and the settings in the table below.

## Settings — every one unverified

| Setting | Value in the pack | Waits on |
|---|---|---|
| Country code and path | `au`, served at `/au` | the owner (a routing rule on the live site is his decision) |
| Language form and spelling | `en-AU` | a native editor |
| Default time zone; zones an account may choose | Australia/Sydney; Australia/Sydney, Australia/Melbourne, Australia/Brisbane, Australia/Adelaide, Australia/Darwin, Australia/Perth, Australia/Hobart | product, with a local lead. Several zones are offered (listed in the row) and an account chooses its own; the default (Australia/Sydney) and the list are unverified choices. |
| Date pattern; clock; first day of the week | DD/MM/YYYY; 12-hour; Monday | a local lead |
| Units | weight kg, height cm, temperature °C | a local clinical lead — a clinical-safety setting |
| Laboratory units | urine albumin-to-creatinine ratio: mg/mmol; haemoglobin: g/L; creatinine: µmol/L; glucose: mmol/L; cholesterol: mmol/L; C-reactive protein: mg/L; prostate-specific antigen: µg/L; HbA1c: % or mmol/mol | a local clinical lead — a clinical-safety setting; the kit converts from the unit stated here |
| Writing an amount of a medicine | no zero after the last figure ("5 mL", never "5.0 mL") | a local pharmacist or clinical lead — a clinical-safety setting; the source read is cited beside the setting in ayarlar.ts |
| Currency | AUD | the owner |
| Prices | EMPTY, SWITCHED OFF: every plan "by quote" | **WAITING ON KAAN** |
| Emergency (ambulance) number on the patient's page | `000` — UNVERIFIED | a local source, before any patient sees the portal |
| Days a patient's link stays valid | 30 | the owner; how long access may stand: for a lawyer |
| Patient identifier | optional free text, encrypted, never validated; label "Medicare card number" | a local lead and a lawyer. Label "Medicare number". Whether a private clinic should record it in this product at all is unverified. |
| Guardian age | 16 | **for a lawyer**. 16 as a starting value. Consent of minors differs by state and territory. |
| Recording-consent sentence | "Everyone recorded at this visit (the patient, or the person who can consent for them, and anyone else present) has been told that the visit will be recorded and that the audio and transcript will be processed by artificial intelligence tools, including services outside Australia, to draft a note that I will read and approve, and has agreed. I have checked that recording is lawful where this visit takes place." — stamp `au-draft-2026-10-24`, NOT READ BY A LAWYER | **for a lawyer**. A draft sentence. Recording a consultation is governed by state and territory law, which differs. |
| Intake-form consent sentence | the shared draft — stamp `au-draft-2026-10-24`, NOT READ BY A LAWYER | **for a lawyer** |
| Word for a senior doctor (in the instructions to the model) | "specialist" | a local clinical lead |
| Phone: prefix, example, rule | +61; +61 491 570 006; a format rule only | a local lead. The example is one of the mobile numbers the communications regulator sets aside for creative works (0491 570 006, 0491 570 110, 0491 570 156 to 159). Unverified. |
| Appointment norms | 09:00–17:00, 30 min; no public holiday | a local clinical lead |
| Speech: model, thresholds | scribe_v2; 0.8, -0.36, 40 characters | engineering, on real clinic audio of this country |
| Assistant names | NONE. Every role shows the neutral line | **WAITING ON KAAN** |
| Sign-up; search | invitation only; hidden | the owner |

- Australian spelling is the British base with "program"; no Australian editor has read it.
- FOR A LOCAL CLINICAL LEAD: prostate-specific antigen is shown in µg/L (numerically the same as ng/mL).
- FOR A LOCAL CLINICAL LEAD: the ESI triage record, the two KDIGO tools and the report outline with the BI-RADS assessment categories are kept as slots (below).
- The 12-hour clock is an unverified choice.

## Regulatory questions — none answered here; each is for a lawyer

1. The Privacy Act and the Australian Privacy Principles for health information; state and territory health-records laws; sending patient data overseas to the database host, the speech provider and the model provider; breach notification. **(for a lawyer)**
2. MY HEALTH RECORDS RULES: this product has no connection to the national record and claims none; whether anything a doctor copies from it into that record, or reads from it, brings obligations is open. **(for a lawyer)**
3. Whether any tool or the drafting of a note is regulated as a medical device (software as a medical device), and what that requires. **(for a lawyer)**
4. Minors: consent by state and territory; what a guardian form may ask. **(for a lawyer)**
5. Recording a consultation: consent by state and territory; retention. **(for a lawyer)**
6. Advertising rules for health services and for software sold to doctors. **(for a lawyer)**

## Roles — 40, names unverified

The keys are the shared English key set (`docs/COUNTRY-PACK-ROLE-KEYS.md`). The names are how each role is shown in this country; none was checked against the country's official list of specialties, and no role's template, questions or tools have been read by a clinician. **Waits on: a local clinical lead and a reviewer per role.**

| Key | Name shown | Kind |
|---|---|---|
| `emergency-medicine` | Emergency medicine | doctor specialty |
| `family-medicine` | General practice | doctor specialty |
| `anaesthesia` | Anaesthesia | doctor specialty |
| `neurosurgery` | Neurosurgery | doctor specialty |
| `paediatric-surgery` | Paediatric surgery | doctor specialty |
| `internal-medicine` | General medicine | doctor specialty |
| `dermatology` | Dermatology | doctor specialty |
| `endocrinology` | Endocrinology | doctor specialty |
| `infectious-diseases` | Infectious diseases | doctor specialty |
| `gastroenterology` | Gastroenterology and hepatology | doctor specialty |
| `general-surgery` | General surgery | doctor specialty |
| `cardio-thoracic-surgery` | Cardio-thoracic surgery | doctor specialty |
| `respiratory-medicine` | Respiratory and sleep medicine | doctor specialty |
| `ophthalmology` | Ophthalmology | doctor specialty |
| `obstetrics-gynaecology` | Obstetrics and gynaecology | doctor specialty |
| `vascular-surgery` | Vascular surgery | doctor specialty |
| `cardiology` | Cardiology | doctor specialty |
| `otolaryngology` | Otolaryngology – head and neck surgery | doctor specialty |
| `nephrology` | Nephrology | doctor specialty |
| `neurology` | Neurology | doctor specialty |
| `oncology` | Medical oncology | doctor specialty |
| `radiation-oncology` | Radiation oncology | doctor specialty |
| `orthopaedics` | Orthopaedic surgery | doctor specialty |
| `paediatrics` | Paediatrics and child health | doctor specialty |
| `plastic-surgery` | Plastic surgery | doctor specialty |
| `psychiatry` | Psychiatry | doctor specialty |
| `radiology` | Radiology | doctor specialty |
| `rheumatology` | Rheumatology | doctor specialty |
| `urology` | Urology | doctor specialty |
| `sports-medicine` | Sport and exercise medicine | doctor specialty |
| `rehabilitation-medicine` | Rehabilitation medicine | doctor specialty |
| `geriatric-medicine` | Geriatric medicine | doctor specialty |
| `immunology-and-allergy` | Immunology and allergy | doctor specialty |
| `haematology` | Haematology | doctor specialty |
| `pain-medicine` | Pain medicine | doctor specialty |
| `aesthetic-surgery` | Cosmetic surgery | clinic doctor |
| `aesthetic-medicine` | Non-surgical cosmetic procedures | clinic doctor |
| `physiotherapy` | Physiotherapist | clinic allied profession |
| `clinical-psychology` | Psychologist | clinic allied profession |
| `dietetics` | Dietitian | clinic allied profession |
| `occupational-therapy` | Occupational therapist | clinic allied profession |
| `audiology` | Audiologist | clinic allied profession |
| `podiatry` | Podiatrist | clinic allied profession |
| `speech-pathology` | Speech pathologist | clinic allied profession |

## Tools

### Switched on (746) — with the unit each measured input takes

Units are a clinical-safety matter. A length or a weight is typed in this pack's unit and converted by the kit with the exact defined factors (1 in = 2.54 cm, 1 lb = 0.45359237 kg); a laboratory value is typed in the unit shown. `countries/au/au.test.ts` runs every tool below with this country's units against the kit's reference result. **Every tool's text is machine-written; each waits on a local clinical lead.**

| Tool | Name | Who sees it | Measured inputs and their units |
|---|---|---|---|
| `hasta-portali` | Patient's page | every role | no measured input |
| `kritik-yol` | Critical conditions checklist | Emergency medicine | no measured input |
| `asa-preop` | ASA class and pre-operative checklist | Anaesthesia | no measured input |
| `hava-yolu-notu` | Airway note | Anaesthesia | no measured input |
| `postop-agri` | Post-operative pain follow-up | Anaesthesia, Pain medicine | no measured input |
| `noro-postop` | Checklist after a neurosurgical operation | Neurosurgery | no measured input |
| `nobet-bilinc` | Seizure and consciousness follow-up | Neurosurgery | no measured input |
| `cocuk-prepost-op` | Checklist before and after an operation | Paediatric surgery | no measured input |
| `yara-dren-izlem` | Wound, drain and stitches follow-up | Paediatric surgery, General surgery | Drain output (optional): **mL** · result in mL |
| `genel-preop` | Pre-operative checklist | General surgery | no measured input |
| `pasi` | PASI score | Dermatology | no measured input |
| `easi` | EASI score | Dermatology | no measured input |
| `scorad` | SCORAD index | Dermatology | Area of skin involved: **%** |
| `yama-okuma` | Patch test: reading days | Dermatology | no measured input |
| `rejim-karti` | Insulin and thyroid treatment: date card | Endocrinology | no measured input |
| `antibiyotik-sure` | Antibiotic course: counting days | Infectious diseases | Length of the course: **days** |
| `toraks-preop` | Checklist before a chest operation | Cardio-thoracic surgery | no measured input |
| `toraks-tup-yara` | Chest drain and wound follow-up | Cardio-thoracic surgery | no measured input |
| `inhaler-teknik` | Inhaler technique | Respiratory and sleep medicine, General practice, Paediatrics and child health | Check the technique again after (optional): **months** |
| `gorme-keskinligi` | Visual acuity: logMAR | Ophthalmology | no measured input |
| `kalp-damar-preop` | Checklist before a heart or vascular operation | Cardio-thoracic surgery, Vascular surgery | no measured input |
| `greft-yara-izlem` | Vascular graft and wound follow-up | Vascular surgery | no measured input |
| `antikoagulan-vadeleri` | Antithrombotic treatment: review dates | Cardio-thoracic surgery, Vascular surgery, Haematology | no measured input |
| `odyometri-pta` | Pure-tone audiometry: average threshold | Otolaryngology – head and neck surgery, Audiologist | Threshold at 0.5 kHz: **dB**; Threshold at 1 kHz: **dB**; Threshold at 2 kHz: **dB**; Threshold at 4 kHz: **dB**; Earlier average threshold (optional): **dB**; Average threshold of the other ear (optional): **dB** · result in dB |
| `otoskopi-notu` | Otoscopy note | Otolaryngology – head and neck surgery | no measured input |
| `vertigo-notu` | Vertigo: positional test note | Otolaryngology – head and neck surgery | no measured input |
| `diyaliz-seans` | Dialysis session and next date | Nephrology | no measured input |
| `kur-sayaci` | Treatment cycle counter | Medical oncology, Radiation oncology, Haematology | no measured input |
| `toksisite-listesi` | Side effects checklist | Medical oncology, Radiation oncology | no measured input |
| `kirik-alci-takip` | Fracture, cast and brace follow-up | Orthopaedic surgery | no measured input |
| `ortopedi-op-protokol` | Post-operative checklist | Orthopaedic surgery | no measured input |
| `vas-fonksiyon` | Pain and function rating | Orthopaedic surgery, Physiotherapist, Rehabilitation medicine | no measured input |
| `hedef-boy` | Expected height from the parents' heights | Paediatrics and child health, General practice | Mother's height: **cm**; Father's height: **cm** · result in cm |
| `doz-hesabi` | Dose arithmetic by body weight | Paediatrics and child health, General practice | Body weight: **kg**; Dose per kilogram: **mg/kg**; Concentration: milligrams (optional): **mg**; Concentration: millilitres (optional): **mL**; The limit you set for one dose (optional): **mg**; The limit you set for one day (optional): **mg** · result in mg, mL, hours |
| `plastik-yara-greft` | Wound, graft and flap follow-up | Plastic surgery, Cosmetic surgery | no measured input |
| `tetkik-kuyrugu` | Examination queue | Radiology | no measured input |
| `das28` | DAS28 disease activity score | Rheumatology | Patient's global assessment: **mm**; C-reactive protein: **mg/L**; Erythrocyte sedimentation rate: **mm/h** |
| `eklem-28` | 28-joint count | Rheumatology | no measured input |
| `psa-hizi` | Prostate-specific antigen: rate of change | Urology | Earlier value: **µg/L**; Latest value: **µg/L** · result in days |
| `rtp-basamak` | Return to sport: days since the injury | Sport and exercise medicine | no measured input · result in days |
| `sakatlik-gunlugu` | Injury log | Sport and exercise medicine | Training in the last 7 days (optional): **min**; Earlier average weekly training (optional): **min** |
| `endoskopi-kaydi` | Endoscopy record | Gastroenterology and hepatology | no measured input |
| `kronik-izlem-kaydi` | Chronic-condition record | General practice, General medicine, Geriatric medicine | no measured input |
| `birinci-acil-bayrak` | Danger signs | General practice | no measured input |
| `gebelik-gun` | Days since the last menstrual period | Obstetrics and gynaecology, General practice | no measured input · result in days, weeks |
| `kardiyo-not` | Cardiology note | Cardiology | Systolic pressure (optional): **mmHg**; Diastolic pressure (optional): **mmHg** · result in mmHg |
| `inme-bayraklari` | Stroke signs | Neurology | no measured input |
| `psikiyatri-guvenlik` | Safety signs | Psychiatry, Psychologist | no measured input |
| `seans-plani` | Session plan | Rehabilitation medicine, Physiotherapist, Occupational therapist, Pain medicine, Podiatrist | no measured input |
| `icf-ozet` | Functioning summary | Physiotherapist, Occupational therapist, Rehabilitation medicine, Pain medicine | no measured input |
| `estetik-cerrahi-vade` | Cosmetic-surgery reminders | Cosmetic surgery | no measured input |
| `estetik-islem-vade` | Aesthetic-procedure reminders | Non-surgical cosmetic procedures | no measured input |
| `makro-kaydi` | Intake record | Dietitian | Kilocalories: **kcal**; Protein: **g** · result in kcal, g |
| `sonraki-seans` | Next session | Psychologist, Audiologist, Speech pathologist | no measured input |
| `ameliyat-notu` | Operation note | General surgery, Obstetrics and gynaecology, Orthopaedic surgery, Urology, Otolaryngology – head and neck surgery, Ophthalmology, Neurosurgery, Plastic surgery, Paediatric surgery, Cosmetic surgery, Cardio-thoracic surgery, Vascular surgery | Estimated blood loss: **mL** |
| `ameliyat-notu-kd` | Operation note: obstetrics and gynaecology | Obstetrics and gynaecology | Estimated blood loss: **mL** |
| `usg-obstetrik` | Obstetric ultrasound report | Obstetrics and gynaecology | Crown-rump length: **mm**; Biparietal diameter: **mm**; Head circumference: **mm**; Abdominal circumference: **mm**; Femur length: **mm**; Amniotic fluid index: **cm**; Deepest vertical pool: **cm**; Middle cerebral artery PSV: **cm/s**; Nuchal translucency: **mm** |
| `usg-jinekolojik` | Gynaecological ultrasound report | Obstetrics and gynaecology | Uterus, length: **mm**; Uterus, anteroposterior: **mm**; Uterus, width: **mm**; Endometrial thickness: **mm**; Right ovary, length: **mm**; Right ovary, anteroposterior: **mm**; Right ovary, width: **mm**; Left ovary, length: **mm**; Left ovary, anteroposterior: **mm**; Left ovary, width: **mm**; Lesion 1, largest diameter: **mm**; Lesion 2, largest diameter: **mm** |
| `dogum-epikrizi` | Postnatal discharge summary | Obstetrics and gynaecology | Birth weight: **g**; Estimated blood loss: **mL** |
| `cerrahi-guvenlik-listesi` | WHO Surgical Safety Checklist | General surgery, Obstetrics and gynaecology, Orthopaedic surgery, Urology, Otolaryngology – head and neck surgery, Ophthalmology, Neurosurgery, Plastic surgery, Paediatric surgery, Cosmetic surgery, Cardio-thoracic surgery, Vascular surgery | no measured input |
| `caprini` | Caprini VTE risk score | General surgery, Obstetrics and gynaecology, Orthopaedic surgery, Urology, Otolaryngology – head and neck surgery, Ophthalmology, Neurosurgery, Plastic surgery, Paediatric surgery, Cosmetic surgery, Cardio-thoracic surgery, Vascular surgery | no measured input |
| `asa-siniflamasi` | ASA physical status | General surgery, Obstetrics and gynaecology, Orthopaedic surgery, Urology, Otolaryngology – head and neck surgery, Ophthalmology, Neurosurgery, Plastic surgery, Paediatric surgery, Cosmetic surgery, Cardio-thoracic surgery, Vascular surgery | no measured input |
| `antibiyotik-profilaksi-kd` | Antibiotic prophylaxis: caesarean and hysterectomy | Obstetrics and gynaecology | Weight (kg): **kg**; Hours since the first dose (optional): **hours**; Blood loss so far (optional): **mL** · result in g, mg |
| `iota-basit-kurallar` | IOTA Simple Rules | Obstetrics and gynaecology | no measured input |
| `rmi` | Risk of Malignancy Index (RMI I) | Obstetrics and gynaecology | Serum CA-125: **U/mL** |
| `palm-coein` | PALM-COEIN and fibroid mapping | Obstetrics and gynaecology | Fibroid 1: largest diameter: **mm**; Fibroid 2: largest diameter: **mm**; Fibroid 3: largest diameter: **mm**; Fibroid 4: largest diameter: **mm**; Fibroid 5: largest diameter: **mm**; Fibroid 6: largest diameter: **mm** · result in mm |
| `rasrm-endometriozis` | Revised ASRM endometriosis stage | Obstetrics and gynaecology | no measured input |
| `enzian` | #Enzian classification | Obstetrics and gynaecology | no measured input |
| `bishop` | Bishop score | Obstetrics and gynaecology | no measured input |
| `robson` | Robson Ten-Group Classification | Obstetrics and gynaecology | no measured input |
| `sezaryen-aciliyeti` | Caesarean urgency and decision-to-birth interval | Obstetrics and gynaecology | no measured input · result in min |
| `kanama-izlem` | Blood loss, shock index and the haemorrhage bundle | Obstetrics and gynaecology | Weight of the soaked swabs: **g**; Dry weight of the same swabs: **g**; Volume in the suction or drape: **mL**; Amniotic fluid in that volume: **mL**; Estimated loss (when not measured): **mL**; Systolic blood pressure: **mmHg** · result in mL |
| `histeroskopi-sivi` | Hysteroscopy fluid deficit | Obstetrics and gynaecology | Reading 1: fluid in (cumulative): **mL**; Reading 1: fluid out (cumulative): **mL**; Reading 2: fluid in (cumulative): **mL**; Reading 2: fluid out (cumulative): **mL**; Reading 3: fluid in (cumulative): **mL**; Reading 3: fluid out (cumulative): **mL**; Reading 4: fluid in (cumulative): **mL**; Reading 4: fluid out (cumulative): **mL**; Reading 5: fluid in (cumulative): **mL**; Reading 5: fluid out (cumulative): **mL**; Reading 6: fluid in (cumulative): **mL**; Reading 6: fluid out (cumulative): **mL** · result in mL, % |
| `eras-kd` | ERAS checklist: gynaecology and caesarean birth | Obstetrics and gynaecology | no measured input |
| `onam-formu-kd` | Procedure consent form | Obstetrics and gynaecology | no measured input |
| `ameliyat-notu-genital` | Operation note: genital aesthetic surgery (adults) | Obstetrics and gynaecology, Plastic surgery, Cosmetic surgery | Estimated blood loss: **mL** |
| `genital-sonuc-olcegi` | Outcome measure total (before / after) | Obstetrics and gynaecology | no measured input |
| `genital-foto-onam` | Consent to intimate clinical photographs | Obstetrics and gynaecology, Plastic surgery, Cosmetic surgery | no measured input |
| `onam-formu-genital` | Procedure consent form: genital aesthetic surgery | Plastic surgery, Cosmetic surgery | no measured input |
| `gebelik-tiroid` | Thyroid in pregnancy: TSH and free T4 by trimester | Obstetrics and gynaecology | no measured input |
| `hpv-asi-kaydi` | HPV vaccine record | Obstetrics and gynaecology | no measured input |
| `sma-tasiyicilik` | SMA carrier screening (prenatal record) | Obstetrics and gynaecology | no measured input |
| `pmdd-gunluk-ozeti` | PMS / PMDD: two-cycle diary summary and DSM-5-TR checklist | Obstetrics and gynaecology | no measured input |
| `prematur-takip` | Preterm follow-up plan | Paediatrics and child health | no measured input |
| `prematur-kohort` | Preterm babies list | Paediatrics and child health | no measured input |
| `erken-dogum` | Early-birth record | Obstetrics and gynaecology | no measured input |
| `au-body-size` | Body mass index and waist measurement (adults) | every role | Weight: **kg**; Height: **cm**; Waist measurement (optional): **cm** · result in kg/m², cm |
| `au-mental-health-screen` | K10 psychological distress scale: total score | Emergency medicine, General practice, Anaesthesia, Neurosurgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures, Psychologist | no measured input |
| `au-oncology-grading` | ECOG performance status: record the grade | Medical oncology, Radiation oncology | no measured input |
| `au-ctg-ranzcog` | CTG: normal or abnormal features (RANZCOG) | Obstetrics and gynaecology | Length of the trace: **min**; Minutes with variability of 5 bpm or less: **min**; Minutes with variability above 25 bpm: **min**; Minutes of a sinusoidal pattern: **min**; Minutes with the baseline above 160 bpm: **min**; Minutes the repetitive decelerations have lasted: **min**; Longest single deceleration (minutes): **min** |
| `konsultasyonlar` | Consultations | every role | no measured input |
| `au-immunisation-schedule` | National Immunisation Program schedule | every role | no measured input |
| `buyume-persentili` | WHO growth percentiles | Paediatrics and child health, General practice | Weight: **kg**; Height / length: **cm** |
| `au-immunisation-report` | Immunisation register report particulars | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-my-health-record` | My Health Record upload conditions | every role | no measured input |
| `au-wellness-plan` | Wellness and longevity plan | General practice | no measured input |
| `au-nonsurgical-plan` | Non-surgical cosmetic plan | Non-surgical cosmetic procedures | no measured input |
| `au-cosmetic-surgery-plan` | Cosmetic surgery plan | Cosmetic surgery | no measured input |
| `au-physio-plan` | Physiotherapy plan | Physiotherapist | no measured input |
| `au-psychology-plan` | Psychology plan | Psychologist | no measured input |
| `au-dietetics-plan` | Dietetics plan | Dietitian | no measured input |
| `au-ot-plan` | Occupational therapy plan | Occupational therapist | no measured input |
| `au-audiology-plan` | Audiology plan | Audiologist | no measured input |
| `au-emergency-medicine-review` | Emergency medicine review | Emergency medicine | no measured input |
| `au-anaesthesia-review` | Anaesthesia review | Anaesthesia | no measured input |
| `au-neurosurgery-review` | Neurosurgery review | Neurosurgery | no measured input |
| `au-paediatric-surgery-review` | Paediatric surgery review | Paediatric surgery | no measured input |
| `au-internal-medicine-review` | General medicine review | General medicine | no measured input |
| `au-dermatology-review` | Dermatology review | Dermatology | no measured input |
| `au-endocrinology-review` | Endocrinology review | Endocrinology | no measured input |
| `au-infectious-diseases-review` | Infectious diseases review | Infectious diseases | no measured input |
| `au-gastroenterology-review` | Gastroenterology review | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-review` | General surgery review | General surgery | no measured input |
| `au-respiratory-medicine-review` | Respiratory review | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-review` | Ophthalmology review | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-review` | Obstetrics and gynaecology review | Obstetrics and gynaecology | no measured input |
| `au-cardiology-review` | Cardiology review | Cardiology | no measured input |
| `au-otolaryngology-review` | Ear, nose and throat review | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-review` | Nephrology review | Nephrology | no measured input |
| `au-neurology-review` | Neurology review | Neurology | no measured input |
| `au-oncology-review` | Medical oncology review | Medical oncology | no measured input |
| `au-orthopaedics-review` | Orthopaedic review | Orthopaedic surgery | no measured input |
| `au-paediatrics-review` | Paediatrics review | Paediatrics and child health | no measured input |
| `au-plastic-surgery-review` | Plastic and reconstructive review | Plastic surgery | no measured input |
| `au-psychiatry-review` | Psychiatry review | Psychiatry | no measured input |
| `au-radiology-review` | Radiology review | Radiology | no measured input |
| `au-rheumatology-review` | Rheumatology review | Rheumatology | no measured input |
| `au-urology-review` | Urology review | Urology | no measured input |
| `au-sports-medicine-review` | Sport and exercise review | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-review` | Rehabilitation medicine review | Rehabilitation medicine | no measured input |
| `au-cardio-thoracic-surgery-review` | Cardio-thoracic surgery review | Cardio-thoracic surgery | no measured input |
| `au-vascular-surgery-review` | Vascular surgery review | Vascular surgery | no measured input |
| `au-radiation-oncology-review` | Radiation oncology review | Radiation oncology | no measured input |
| `au-geriatric-medicine-review` | Geriatric medicine review | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-review` | Immunology and allergy review | Immunology and allergy | no measured input |
| `au-haematology-review` | Haematology review | Haematology | no measured input |
| `au-pain-medicine-review` | Pain medicine review | Pain medicine | no measured input |
| `au-podiatry-review` | Podiatry review | Podiatrist | no measured input |
| `au-speech-pathology-review` | Speech pathology review | Speech pathologist | no measured input |
| `au-emergency-medicine-flags` | Emergency medicine danger signs | Emergency medicine | no measured input |
| `au-family-medicine-flags` | General practice danger signs | General practice | no measured input |
| `au-anaesthesia-flags` | Anaesthesia danger signs | Anaesthesia | no measured input |
| `au-neurosurgery-flags` | Neurosurgery danger signs | Neurosurgery | no measured input |
| `au-paediatric-surgery-flags` | Paediatric surgery danger signs | Paediatric surgery | no measured input |
| `au-internal-medicine-flags` | General medicine danger signs | General medicine | no measured input |
| `au-dermatology-flags` | Dermatology danger signs | Dermatology | no measured input |
| `au-endocrinology-flags` | Endocrinology danger signs | Endocrinology | no measured input |
| `au-infectious-diseases-flags` | Infectious diseases danger signs | Infectious diseases | no measured input |
| `au-gastroenterology-flags` | Gastroenterology danger signs | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-flags` | General surgery danger signs | General surgery | no measured input |
| `au-respiratory-medicine-flags` | Respiratory danger signs | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-flags` | Ophthalmology danger signs | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-flags` | Obstetrics and gynaecology danger signs | Obstetrics and gynaecology | no measured input |
| `au-cardiology-flags` | Cardiology danger signs | Cardiology | no measured input |
| `au-otolaryngology-flags` | Ear, nose and throat danger signs | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-flags` | Nephrology danger signs | Nephrology | no measured input |
| `au-neurology-flags` | Neurology danger signs | Neurology | no measured input |
| `au-oncology-flags` | Medical oncology danger signs | Medical oncology | no measured input |
| `au-orthopaedics-flags` | Orthopaedic danger signs | Orthopaedic surgery | no measured input |
| `au-paediatrics-flags` | Paediatrics danger signs | Paediatrics and child health | no measured input |
| `au-plastic-surgery-flags` | Plastic surgery danger signs | Plastic surgery | no measured input |
| `au-psychiatry-flags` | Psychiatry safety signs | Psychiatry | no measured input |
| `au-radiology-flags` | Radiology danger signs | Radiology | no measured input |
| `au-rheumatology-flags` | Rheumatology danger signs | Rheumatology | no measured input |
| `au-urology-flags` | Urology danger signs | Urology | no measured input |
| `au-sports-medicine-flags` | Sport and exercise danger signs | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-flags` | Rehabilitation medicine danger signs | Rehabilitation medicine | no measured input |
| `au-cardio-thoracic-surgery-flags` | Cardio-thoracic surgery danger signs | Cardio-thoracic surgery | no measured input |
| `au-vascular-surgery-flags` | Vascular surgery danger signs | Vascular surgery | no measured input |
| `au-radiation-oncology-flags` | Radiation oncology danger signs | Radiation oncology | no measured input |
| `au-geriatric-medicine-flags` | Geriatric medicine danger signs | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-flags` | Immunology and allergy danger signs | Immunology and allergy | no measured input |
| `au-haematology-flags` | Haematology danger signs | Haematology | no measured input |
| `au-pain-medicine-flags` | Pain medicine danger signs | Pain medicine | no measured input |
| `au-aesthetic-surgery-flags` | Cosmetic surgery danger signs | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-flags` | Non-surgical cosmetic danger signs | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-flags` | Physiotherapy danger signs | Physiotherapist | no measured input |
| `au-clinical-psychology-flags` | Clinical psychology safety signs | Psychologist | no measured input |
| `au-dietetics-flags` | Dietetics danger signs | Dietitian | no measured input |
| `au-occupational-therapy-flags` | Occupational therapy danger signs | Occupational therapist | no measured input |
| `au-audiology-flags` | Audiology danger signs | Audiologist | no measured input |
| `au-podiatry-flags` | Podiatry danger signs | Podiatrist | no measured input |
| `au-speech-pathology-flags` | Speech pathology danger signs | Speech pathologist | no measured input |
| `au-immunisation-cohort` | Overdue immunisation check (NIP age milestones) | Paediatrics and child health, General practice | no measured input |
| `au-review-cohort` | Overdue clinical review check | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Cardio-thoracic surgery, Vascular surgery, Radiation oncology, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures, Physiotherapist, Psychologist, Dietitian, Occupational therapist, Audiologist, Podiatrist, Speech pathologist | no measured input |
| `au-mst-score` | Malnutrition Screening Tool (MST): record the score | Dietitian | no measured input |
| `au-weight-change` | Weight change (kg and %) | Dietitian | Usual or earlier weight: **kg**; Current weight: **kg** |
| `au-energy-protein` | Estimated energy (kJ) and protein | Dietitian | Weight used for the estimate: **kg**; Kilojoules per kilogram per day (your factor): **kJ/kg**; Grams of protein per kilogram per day (your factor): **g/kg** · result in kJ, g |
| `au-iddsi-record` | IDDSI food and drink levels | Dietitian, Speech pathologist | no measured input |
| `au-refeeding-risk` | Refeeding risk signs (dietitian ticks) | Dietitian | no measured input |
| `au-enteral-rate` | Enteral feed rate (mL/h) | Dietitian | Total volume for the period: **mL**; Hours over which that volume will run: **hours** · result in mL/h |
| `au-nutrition-goals` | Nutrition care goals (with the client) | Dietitian | no measured input |
| `au-nutrition-labs` | Nutrition lab results (record values) | Dietitian | HbA1c: **% or mmol/mol**; Glucose: **mmol/L**; Haemoglobin: **g/L**; Total cholesterol: **mmol/L**; Creatinine: **µmol/L**; C-reactive protein: **mg/L**; Urine albumin-to-creatinine ratio: **mg/mmol**; Serum albumin: **g/L**; Ferritin: **µg/L**; Vitamin B12: **pmol/L**; Folate: **nmol/L**; Potassium: **mmol/L**; Phosphate: **mmol/L**; Magnesium: **mmol/L** · result in g/L, µg/L, pmol/L, nmol/L, mmol/L, mg/mmol, µmol/L, mg/L, %, mmol/mol |
| `au-meal-plan` | Meal plan (breakfast · lunch · dinner · snacks) | Dietitian | no measured input |
| `au-food-diary` | Food diary / intake note | Dietitian | no measured input |
| `au-emergency-medicine-care-plan` | After-care plan (keep on file) | Emergency medicine | no measured input |
| `au-emergency-medicine-between-visit-log` | Between-visit note (clinic or patient) | Emergency medicine | no measured input |
| `au-emergency-medicine-care-goals` | Care goals (ticks) | Emergency medicine | no measured input |
| `au-family-medicine-care-plan` | Your GP care plan (keep on file) | General practice | no measured input |
| `au-family-medicine-between-visit-log` | Between-visit note (clinic or patient) | General practice | no measured input |
| `au-family-medicine-care-goals` | Care goals (ticks) | General practice | no measured input |
| `au-anaesthesia-care-plan` | Before your anaesthetic (keep on file) | Anaesthesia | no measured input |
| `au-anaesthesia-between-visit-log` | Between-visit note (clinic or patient) | Anaesthesia | no measured input |
| `au-anaesthesia-care-goals` | Care goals (ticks) | Anaesthesia | no measured input |
| `au-neurosurgery-care-plan` | Neurosurgery care plan (keep on file) | Neurosurgery | no measured input |
| `au-neurosurgery-between-visit-log` | Between-visit note (clinic or patient) | Neurosurgery | no measured input |
| `au-neurosurgery-care-goals` | Care goals (ticks) | Neurosurgery | no measured input |
| `au-paediatric-surgery-care-plan` | Your child's surgery plan (keep on file) | Paediatric surgery | no measured input |
| `au-paediatric-surgery-between-visit-log` | Between-visit note (clinic or patient) | Paediatric surgery | no measured input |
| `au-paediatric-surgery-care-goals` | Care goals (ticks) | Paediatric surgery | no measured input |
| `au-internal-medicine-care-plan` | Physician care plan (keep on file) | General medicine | no measured input |
| `au-internal-medicine-between-visit-log` | Between-visit note (clinic or patient) | General medicine | no measured input |
| `au-internal-medicine-care-goals` | Care goals (ticks) | General medicine | no measured input |
| `au-dermatology-care-plan` | Skin care plan (keep on file) | Dermatology | no measured input |
| `au-dermatology-between-visit-log` | Between-visit note (clinic or patient) | Dermatology | no measured input |
| `au-dermatology-care-goals` | Care goals (ticks) | Dermatology | no measured input |
| `au-endocrinology-care-plan` | Hormone care plan (keep on file) | Endocrinology | no measured input |
| `au-endocrinology-between-visit-log` | Between-visit note (clinic or patient) | Endocrinology | no measured input |
| `au-endocrinology-care-goals` | Care goals (ticks) | Endocrinology | no measured input |
| `au-infectious-diseases-care-plan` | Infection care plan (keep on file) | Infectious diseases | no measured input |
| `au-infectious-diseases-between-visit-log` | Between-visit note (clinic or patient) | Infectious diseases | no measured input |
| `au-infectious-diseases-care-goals` | Care goals (ticks) | Infectious diseases | no measured input |
| `au-gastroenterology-care-plan` | Digestive care plan (keep on file) | Gastroenterology and hepatology | no measured input |
| `au-gastroenterology-between-visit-log` | Between-visit note (clinic or patient) | Gastroenterology and hepatology | no measured input |
| `au-gastroenterology-care-goals` | Care goals (ticks) | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-care-plan` | Surgery care plan (keep on file) | General surgery | no measured input |
| `au-general-surgery-between-visit-log` | Between-visit note (clinic or patient) | General surgery | no measured input |
| `au-general-surgery-care-goals` | Care goals (ticks) | General surgery | no measured input |
| `au-respiratory-medicine-care-plan` | Breathing care plan (keep on file) | Respiratory and sleep medicine | no measured input |
| `au-respiratory-medicine-between-visit-log` | Between-visit note (clinic or patient) | Respiratory and sleep medicine | no measured input |
| `au-respiratory-medicine-care-goals` | Care goals (ticks) | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-care-plan` | Eye care plan (keep on file) | Ophthalmology | no measured input |
| `au-ophthalmology-between-visit-log` | Between-visit note (clinic or patient) | Ophthalmology | no measured input |
| `au-ophthalmology-care-goals` | Care goals (ticks) | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-care-plan` | Pregnancy or gynaecology plan (keep on file) | Obstetrics and gynaecology | no measured input |
| `au-obstetrics-gynaecology-between-visit-log` | Between-visit note (clinic or patient) | Obstetrics and gynaecology | no measured input |
| `au-obstetrics-gynaecology-care-goals` | Care goals (ticks) | Obstetrics and gynaecology | no measured input |
| `au-cardiology-care-plan` | Heart care plan (keep on file) | Cardiology | no measured input |
| `au-cardiology-between-visit-log` | Between-visit note (clinic or patient) | Cardiology | no measured input |
| `au-cardiology-care-goals` | Care goals (ticks) | Cardiology | no measured input |
| `au-otolaryngology-care-plan` | ENT care plan (keep on file) | Otolaryngology – head and neck surgery | no measured input |
| `au-otolaryngology-between-visit-log` | Between-visit note (clinic or patient) | Otolaryngology – head and neck surgery | no measured input |
| `au-otolaryngology-care-goals` | Care goals (ticks) | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-care-plan` | Kidney care plan (keep on file) | Nephrology | no measured input |
| `au-nephrology-between-visit-log` | Between-visit note (clinic or patient) | Nephrology | no measured input |
| `au-nephrology-care-goals` | Care goals (ticks) | Nephrology | no measured input |
| `au-neurology-care-plan` | Neurology care plan (keep on file) | Neurology | no measured input |
| `au-neurology-between-visit-log` | Between-visit note (clinic or patient) | Neurology | no measured input |
| `au-neurology-care-goals` | Care goals (ticks) | Neurology | no measured input |
| `au-oncology-care-plan` | Oncology care plan (keep on file) | Medical oncology | no measured input |
| `au-oncology-between-visit-log` | Between-visit note (clinic or patient) | Medical oncology | no measured input |
| `au-oncology-care-goals` | Care goals (ticks) | Medical oncology | no measured input |
| `au-orthopaedics-care-plan` | Bone and joint plan (keep on file) | Orthopaedic surgery | no measured input |
| `au-orthopaedics-between-visit-log` | Between-visit note (clinic or patient) | Orthopaedic surgery | no measured input |
| `au-orthopaedics-care-goals` | Care goals (ticks) | Orthopaedic surgery | no measured input |
| `au-paediatrics-care-plan` | Your child's care plan (keep on file) | Paediatrics and child health | no measured input |
| `au-paediatrics-between-visit-log` | Between-visit note (clinic or patient) | Paediatrics and child health | no measured input |
| `au-paediatrics-care-goals` | Care goals (ticks) | Paediatrics and child health | no measured input |
| `au-plastic-surgery-care-plan` | Reconstructive care plan (keep on file) | Plastic surgery | no measured input |
| `au-plastic-surgery-between-visit-log` | Between-visit note (clinic or patient) | Plastic surgery | no measured input |
| `au-plastic-surgery-care-goals` | Care goals (ticks) | Plastic surgery | no measured input |
| `au-psychiatry-care-plan` | Psychiatry care plan (keep on file) | Psychiatry | no measured input |
| `au-psychiatry-between-visit-log` | Between-visit note (clinic or patient) | Psychiatry | no measured input |
| `au-psychiatry-care-goals` | Care goals (ticks) | Psychiatry | no measured input |
| `au-radiology-care-plan` | Imaging prep plan (keep on file) | Radiology | no measured input |
| `au-radiology-between-visit-log` | Between-visit note (clinic or patient) | Radiology | no measured input |
| `au-radiology-care-goals` | Care goals (ticks) | Radiology | no measured input |
| `au-rheumatology-care-plan` | Joint care plan (keep on file) | Rheumatology | no measured input |
| `au-rheumatology-between-visit-log` | Between-visit note (clinic or patient) | Rheumatology | no measured input |
| `au-rheumatology-care-goals` | Care goals (ticks) | Rheumatology | no measured input |
| `au-urology-care-plan` | Urology care plan (keep on file) | Urology | no measured input |
| `au-urology-between-visit-log` | Between-visit note (clinic or patient) | Urology | no measured input |
| `au-urology-care-goals` | Care goals (ticks) | Urology | no measured input |
| `au-sports-medicine-care-plan` | Return-to-activity plan (keep on file) | Sport and exercise medicine | no measured input |
| `au-sports-medicine-between-visit-log` | Between-visit note (clinic or patient) | Sport and exercise medicine | no measured input |
| `au-sports-medicine-care-goals` | Care goals (ticks) | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-care-plan` | Rehabilitation plan (keep on file) | Rehabilitation medicine | no measured input |
| `au-rehabilitation-medicine-between-visit-log` | Between-visit note (clinic or patient) | Rehabilitation medicine | no measured input |
| `au-rehabilitation-medicine-care-goals` | Care goals (ticks) | Rehabilitation medicine | no measured input |
| `au-aesthetic-surgery-care-plan` | Cosmetic surgery plan (keep on file) | Cosmetic surgery | no measured input |
| `au-aesthetic-surgery-between-visit-log` | Between-visit note (clinic or patient) | Cosmetic surgery | no measured input |
| `au-aesthetic-surgery-care-goals` | Care goals (ticks) | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-care-plan` | Cosmetic care plan (keep on file) | Non-surgical cosmetic procedures | no measured input |
| `au-aesthetic-medicine-between-visit-log` | Between-visit note (clinic or patient) | Non-surgical cosmetic procedures | no measured input |
| `au-aesthetic-medicine-care-goals` | Care goals (ticks) | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-care-plan` | Movement plan (keep on file) | Physiotherapist | no measured input |
| `au-physiotherapy-between-visit-log` | Between-visit note (clinic or patient) | Physiotherapist | no measured input |
| `au-physiotherapy-care-goals` | Care goals (ticks) | Physiotherapist | no measured input |
| `au-clinical-psychology-care-plan` | Session plan (keep on file) | Psychologist | no measured input |
| `au-clinical-psychology-between-visit-log` | Between-visit note (clinic or patient) | Psychologist | no measured input |
| `au-clinical-psychology-care-goals` | Care goals (ticks) | Psychologist | no measured input |
| `au-occupational-therapy-care-plan` | Daily-activity plan (keep on file) | Occupational therapist | no measured input |
| `au-occupational-therapy-between-visit-log` | Between-visit note (clinic or patient) | Occupational therapist | no measured input |
| `au-occupational-therapy-care-goals` | Care goals (ticks) | Occupational therapist | no measured input |
| `au-audiology-care-plan` | Hearing care plan (keep on file) | Audiologist | no measured input |
| `au-audiology-between-visit-log` | Between-visit note (clinic or patient) | Audiologist | no measured input |
| `au-audiology-care-goals` | Care goals (ticks) | Audiologist | no measured input |
| `au-cardio-thoracic-surgery-care-plan` | Chest surgery plan (keep on file) | Cardio-thoracic surgery | no measured input |
| `au-cardio-thoracic-surgery-between-visit-log` | Between-visit note (clinic or patient) | Cardio-thoracic surgery | no measured input |
| `au-cardio-thoracic-surgery-care-goals` | Care goals (ticks) | Cardio-thoracic surgery | no measured input |
| `au-vascular-surgery-care-plan` | Vascular care plan (keep on file) | Vascular surgery | no measured input |
| `au-vascular-surgery-between-visit-log` | Between-visit note (clinic or patient) | Vascular surgery | no measured input |
| `au-vascular-surgery-care-goals` | Care goals (ticks) | Vascular surgery | no measured input |
| `au-radiation-oncology-care-plan` | Radiotherapy plan (keep on file) | Radiation oncology | no measured input |
| `au-radiation-oncology-between-visit-log` | Between-visit note (clinic or patient) | Radiation oncology | no measured input |
| `au-radiation-oncology-care-goals` | Care goals (ticks) | Radiation oncology | no measured input |
| `au-geriatric-medicine-care-plan` | Later-life care plan (keep on file) | Geriatric medicine | no measured input |
| `au-geriatric-medicine-between-visit-log` | Between-visit note (clinic or patient) | Geriatric medicine | no measured input |
| `au-geriatric-medicine-care-goals` | Care goals (ticks) | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-care-plan` | Allergy care plan (keep on file) | Immunology and allergy | no measured input |
| `au-immunology-and-allergy-between-visit-log` | Between-visit note (clinic or patient) | Immunology and allergy | no measured input |
| `au-immunology-and-allergy-care-goals` | Care goals (ticks) | Immunology and allergy | no measured input |
| `au-haematology-care-plan` | Blood care plan (keep on file) | Haematology | no measured input |
| `au-haematology-between-visit-log` | Between-visit note (clinic or patient) | Haematology | no measured input |
| `au-haematology-care-goals` | Care goals (ticks) | Haematology | no measured input |
| `au-pain-medicine-care-plan` | Pain care plan (keep on file) | Pain medicine | no measured input |
| `au-pain-medicine-between-visit-log` | Between-visit note (clinic or patient) | Pain medicine | no measured input |
| `au-pain-medicine-care-goals` | Care goals (ticks) | Pain medicine | no measured input |
| `au-podiatry-care-plan` | Foot care plan (keep on file) | Podiatrist | no measured input |
| `au-podiatry-between-visit-log` | Between-visit note (clinic or patient) | Podiatrist | no measured input |
| `au-podiatry-care-goals` | Care goals (ticks) | Podiatrist | no measured input |
| `au-speech-pathology-care-plan` | Speech and swallow plan (keep on file) | Speech pathologist | no measured input |
| `au-speech-pathology-between-visit-log` | Between-visit note (clinic or patient) | Speech pathologist | no measured input |
| `au-speech-pathology-care-goals` | Care goals (ticks) | Speech pathologist | no measured input |
| `au-emergency-medicine-visit-prep` | ED disposition prep | Emergency medicine | no measured input |
| `au-family-medicine-visit-prep` | Your GP care plan — visit prep | General practice | no measured input |
| `au-anaesthesia-visit-prep` | Before your anaesthetic — visit prep | Anaesthesia | no measured input |
| `au-neurosurgery-visit-prep` | Neurosurgery care plan — visit prep | Neurosurgery | no measured input |
| `au-paediatric-surgery-visit-prep` | Your child's surgery plan — visit prep | Paediatric surgery | no measured input |
| `au-internal-medicine-visit-prep` | Physician care plan — visit prep | General medicine | no measured input |
| `au-dermatology-visit-prep` | Skin care plan — visit prep | Dermatology | no measured input |
| `au-endocrinology-visit-prep` | Hormone care plan — visit prep | Endocrinology | no measured input |
| `au-infectious-diseases-visit-prep` | Infection care plan — visit prep | Infectious diseases | no measured input |
| `au-gastroenterology-visit-prep` | Digestive care plan — visit prep | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-visit-prep` | Surgery care plan — visit prep | General surgery | no measured input |
| `au-respiratory-medicine-visit-prep` | Breathing care plan — visit prep | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-visit-prep` | Eye care plan — visit prep | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-visit-prep` | Pregnancy or gynaecology plan — visit prep | Obstetrics and gynaecology | no measured input |
| `au-cardiology-visit-prep` | Heart care plan — visit prep | Cardiology | no measured input |
| `au-otolaryngology-visit-prep` | ENT care plan — visit prep | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-visit-prep` | Kidney care plan — visit prep | Nephrology | no measured input |
| `au-neurology-visit-prep` | Neurology care plan — visit prep | Neurology | no measured input |
| `au-oncology-visit-prep` | Oncology care plan — visit prep | Medical oncology | no measured input |
| `au-orthopaedics-visit-prep` | Bone and joint plan — visit prep | Orthopaedic surgery | no measured input |
| `au-paediatrics-visit-prep` | Your child's care plan — visit prep | Paediatrics and child health | no measured input |
| `au-plastic-surgery-visit-prep` | Reconstructive care plan — visit prep | Plastic surgery | no measured input |
| `au-psychiatry-visit-prep` | Psychiatry care plan — session prep | Psychiatry | no measured input |
| `au-radiology-visit-prep` | Imaging prep plan — visit prep | Radiology | no measured input |
| `au-rheumatology-visit-prep` | Joint care plan — visit prep | Rheumatology | no measured input |
| `au-urology-visit-prep` | Urology care plan — visit prep | Urology | no measured input |
| `au-sports-medicine-visit-prep` | Return-to-activity plan — visit prep | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-visit-prep` | Rehabilitation plan — visit prep | Rehabilitation medicine | no measured input |
| `au-aesthetic-surgery-visit-prep` | Cosmetic surgery plan — visit prep | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-visit-prep` | Cosmetic care plan — visit prep | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-visit-prep` | Movement plan — visit prep | Physiotherapist | no measured input |
| `au-clinical-psychology-visit-prep` | Session plan — session prep | Psychologist | no measured input |
| `au-occupational-therapy-visit-prep` | Daily-activity plan — visit prep | Occupational therapist | no measured input |
| `au-audiology-visit-prep` | Hearing care plan — visit prep | Audiologist | no measured input |
| `au-cardio-thoracic-surgery-visit-prep` | Chest surgery plan — visit prep | Cardio-thoracic surgery | no measured input |
| `au-vascular-surgery-visit-prep` | Vascular care plan — visit prep | Vascular surgery | no measured input |
| `au-radiation-oncology-visit-prep` | Radiotherapy plan — visit prep | Radiation oncology | no measured input |
| `au-geriatric-medicine-visit-prep` | Later-life care plan — visit prep | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-visit-prep` | Allergy care plan — visit prep | Immunology and allergy | no measured input |
| `au-haematology-visit-prep` | Blood care plan — visit prep | Haematology | no measured input |
| `au-pain-medicine-visit-prep` | Pain care plan — visit prep | Pain medicine | no measured input |
| `au-podiatry-visit-prep` | Foot care plan — visit prep | Podiatrist | no measured input |
| `au-speech-pathology-visit-prep` | Speech and swallow plan — visit prep | Speech pathologist | no measured input |
| `au-dietetics-visit-prep` | Nutrition visit prep | Dietitian | no measured input |
| `au-cha2ds2-va` | CHA2DS2-VA stroke risk in atrial fibrillation | Cardiology, General practice, Geriatric medicine | no measured input |
| `au-has-bled` | HAS-BLED bleeding risk on anticoagulation | Cardiology, Haematology, General practice | no measured input |
| `au-heart-score` | HEART score for undifferentiated chest pain | Cardiology, Emergency medicine, General practice | no measured input |
| `au-qtc` | Corrected QT interval (Bazett and Fridericia) | Cardiology, Psychiatry, Emergency medicine | Measured QT interval: **ms**; Heart rate: **bpm** · result in ms, s |
| `au-nyha-class` | NYHA functional class (heart failure) | Cardiology, Cardio-thoracic surgery, General medicine | no measured input |
| `au-ccs-angina` | CCS angina grade (exertional angina) | Cardiology, Cardio-thoracic surgery | no measured input |
| `au-ppo-fev1` | Predicted postoperative FEV1 and DLCO (segment method) | Cardio-thoracic surgery, Respiratory and sleep medicine | Preoperative FEV1 (% predicted): **%**; Preoperative DLCO (% predicted): **%** · result in % |
| `au-thrcri` | Thoracic Revised Cardiac Risk Index (ThRCRI) | Cardio-thoracic surgery | no measured input |
| `au-abpi-tbi` | Ankle–brachial and toe–brachial index | Vascular surgery, Podiatrist, General practice | Higher brachial systolic pressure: **mmHg**; Higher ankle systolic pressure (this leg): **mmHg**; Toe systolic pressure (optional): **mmHg** |
| `au-rutherford-class` | Rutherford category of chronic limb ischaemia | Vascular surgery, Podiatrist | no measured input |
| `au-ceap-clinical` | CEAP clinical class (chronic venous disease) | Vascular surgery | no measured input |
| `au-wells-dvt` | Wells score for deep vein thrombosis | Vascular surgery, General medicine, Haematology | no measured input |
| `au-gcs` | Glasgow Coma Scale | Emergency medicine, Neurosurgery, Neurology | no measured input |
| `au-qsofa` | qSOFA (quick Sequential Organ Failure Assessment) | Emergency medicine, Infectious diseases | no measured input |
| `au-perc` | PERC rule (pulmonary embolism rule-out criteria) | Emergency medicine, Respiratory and sleep medicine | no measured input |
| `au-wells-pe` | Wells score for pulmonary embolism | Emergency medicine, Respiratory and sleep medicine, General medicine | no measured input |
| `au-ottawa-ankle` | Ottawa ankle and foot rules | Emergency medicine, Orthopaedic surgery, Sport and exercise medicine | no measured input |
| `au-ct-head-rule` | CT head rule for minor head injury (Stiell 2001) | Emergency medicine, Neurosurgery | no measured input |
| `au-rcri` | Revised Cardiac Risk Index (Lee) | Anaesthesia, General medicine, Geriatric medicine | no measured input |
| `au-stop-bang` | STOP-Bang screen for obstructive sleep apnoea | Anaesthesia, Respiratory and sleep medicine, Otolaryngology – head and neck surgery | no measured input |
| `au-apfel-ponv` | Simplified Apfel score for postoperative nausea and vomiting | Anaesthesia | no measured input |
| `au-aldrete` | Modified Aldrete score (recovery-room discharge) | Anaesthesia | no measured input |
| `au-mallampati` | Modified Mallampati class | Anaesthesia | no measured input |
| `au-wfns-grade` | WFNS grade of subarachnoid haemorrhage | Neurosurgery | no measured input |
| `au-spetzler-martin` | Spetzler–Martin grade of a brain arteriovenous malformation | Neurosurgery | no measured input |
| `au-mrs` | Modified Rankin Scale | Neurology, Neurosurgery, Rehabilitation medicine | no measured input |
| `au-mjoa` | Modified JOA score (cervical myelopathy) | Neurosurgery, Orthopaedic surgery | no measured input |
| `au-nihss` | NIH Stroke Scale | Neurology, Emergency medicine | no measured input |
| `au-abcd2` | ABCD2 score after transient ischaemic attack | Neurology, General practice | no measured input |
| `au-barthel` | Barthel Index of activities of daily living | Rehabilitation medicine, Geriatric medicine, Occupational therapist | no measured input |
| `au-fac` | Functional Ambulation Category | Rehabilitation medicine, Physiotherapist | no measured input |
| `au-berg-balance` | Berg Balance Scale | Rehabilitation medicine, Physiotherapist, Geriatric medicine | no measured input |
| `au-asia-ais` | ASIA Impairment Scale grade (spinal cord injury) | Rehabilitation medicine, Neurosurgery | no measured input |
| `au-curb-65` | CURB-65 severity of community-acquired pneumonia | General medicine, Respiratory and sleep medicine, Infectious diseases | no measured input |
| `au-corrected-calcium` | Albumin-adjusted calcium | General medicine, Endocrinology, Nephrology | Total calcium: **mmol/L**; Albumin: **g/L** · result in mmol/L |
| `au-anion-gap` | Anion gap (with albumin adjustment) | General medicine, Nephrology, Endocrinology | Sodium: **mmol/L**; Chloride: **mmol/L**; Bicarbonate: **mmol/L**; Albumin (optional): **g/L** · result in mmol/L |
| `au-calculated-osmolality` | Calculated serum osmolality and osmolal gap | General medicine, Endocrinology, Nephrology | Sodium: **mmol/L**; Glucose: **mmol/L**; Urea: **mmol/L**; Measured osmolality (optional): **mOsm/kg** · result in mOsm/kg |
| `au-homa-ir` | HOMA-IR (homeostasis model assessment of insulin resistance) | Endocrinology | Fasting glucose: **mmol/L**; Fasting insulin: **mU/L** |
| `au-burch-wartofsky` | Burch–Wartofsky point scale for thyroid storm | Endocrinology, Emergency medicine | no measured input |
| `au-mascc` | MASCC risk index for febrile neutropenia | Infectious diseases, Medical oncology, Haematology | no measured input |
| `au-pitt-bacteraemia` | Pitt bacteraemia score | Infectious diseases | no measured input |
| `au-cockcroft-gault` | Creatinine clearance (Cockcroft–Gault) | Infectious diseases, Nephrology, Geriatric medicine | Weight: **kg**; Serum creatinine: **µmol/L** · result in mL/min |
| `au-glasgow-blatchford` | Glasgow–Blatchford score (upper GI bleeding) | Gastroenterology and hepatology, Emergency medicine | no measured input |
| `au-child-pugh` | Child–Pugh score (cirrhosis) | Gastroenterology and hepatology, General medicine | no measured input |
| `au-meld-na` | MELD and MELD-Na | Gastroenterology and hepatology | Creatinine: **µmol/L**; Bilirubin: **µmol/L**; Sodium: **mmol/L** |
| `au-fib-4` | FIB-4 index (liver fibrosis) | Gastroenterology and hepatology, General practice | AST: **U/L**; ALT: **U/L**; Platelet count: **×10⁹/L** |
| `au-truelove-witts` | Truelove and Witts criteria (acute severe ulcerative colitis) | Gastroenterology and hepatology | no measured input |
| `au-dialysis-adequacy` | Haemodialysis adequacy (single-pool Kt/V and URR) | Nephrology | Pre-dialysis urea: **mmol/L**; Post-dialysis urea: **mmol/L**; Session length: **h**; Ultrafiltration volume: **L**; Post-dialysis weight: **kg** · result in % |
| `au-fena` | Fractional excretion of sodium | Nephrology, General medicine | Urine sodium: **mmol/L**; Plasma sodium: **mmol/L**; Urine creatinine: **mmol/L**; Plasma creatinine: **µmol/L** · result in % |
| `au-four-ts` | 4Ts score for heparin-induced thrombocytopenia | Haematology, General medicine | no measured input |
| `au-isth-dic` | ISTH overt DIC score | Haematology, General medicine | no measured input |
| `au-khorana` | Khorana score (cancer-associated venous thromboembolism) | Medical oncology, Haematology | no measured input |
| `au-bsa-mosteller` | Body surface area (Mosteller) | Medical oncology, Radiation oncology | Height: **cm**; Weight: **kg** · result in m² |
| `au-calvert-carboplatin` | Carboplatin dose by the Calvert formula | Medical oncology | Target AUC: **mg/mL·min**; GFR estimate (as the protocol specifies): **mL/min** · result in mg |
| `au-bed-eqd2` | Biologically effective dose and EQD2 | Radiation oncology | Total dose: **Gy**; α/β ratio: **Gy** · result in Gy |
| `au-karnofsky` | Karnofsky performance status | Radiation oncology, Medical oncology | no measured input |
| `au-gpa-brain-mets` | Graded Prognostic Assessment (brain metastases) | Radiation oncology | no measured input |
| `au-rpa-brain-mets` | RTOG recursive partitioning analysis class (brain metastases) | Radiation oncology | no measured input |
| `au-cdai` | Clinical Disease Activity Index (rheumatoid arthritis) | Rheumatology | no measured input |
| `au-basdai` | BASDAI (axial spondyloarthritis activity) | Rheumatology | no measured input |
| `au-asdas-crp` | ASDAS-CRP (axial spondyloarthritis) | Rheumatology | CRP: **mg/L** |
| `au-acr-eular-ra-2010` | 2010 ACR/EULAR classification criteria for rheumatoid arthritis | Rheumatology | no measured input |
| `au-spirometry-copd` | Spirometry: FEV1/FVC and COPD airflow grade | Respiratory and sleep medicine, General practice | Post-bronchodilator FEV1: **L**; Post-bronchodilator FVC: **L**; FEV1 % predicted: **%** |
| `au-mmrc` | mMRC dyspnoea scale | Respiratory and sleep medicine, Cardio-thoracic surgery | no measured input |
| `au-bode` | BODE index (COPD) | Respiratory and sleep medicine | no measured input |
| `au-pen-fast` | PEN-FAST penicillin allergy decision rule | Immunology and allergy, Infectious diseases | no measured input |
| `au-anaphylaxis-grade` | Anaphylaxis severity grade (Brown) | Immunology and allergy, Emergency medicine | no measured input |
| `au-tryptase-rule` | Acute vs baseline tryptase (20% + 2 rule) | Immunology and allergy | Acute tryptase (1–4 hours after onset): **µg/L**; Baseline tryptase (24 hours or more after recovery): **µg/L** · result in µg/L |
| `au-uas7` | Urticaria Activity Score over 7 days (UAS7) | Immunology and allergy, Dermatology | no measured input |
| `au-feno` | FeNO interpretation (eosinophilic airway inflammation) | Immunology and allergy, Paediatrics and child health | FeNO: **ppb** · result in ppb |
| `au-4at` | 4AT rapid assessment for delirium | Geriatric medicine, General medicine | no measured input |
| `au-rudas` | Rowland Universal Dementia Assessment Scale (RUDAS) | Geriatric medicine, General practice | no measured input |
| `au-abbey-pain` | Abbey Pain Scale (people who cannot verbalise) | Geriatric medicine, Pain medicine, Rehabilitation medicine | no measured input |
| `au-clinical-frailty` | Clinical Frailty Scale level | Geriatric medicine, General medicine | no measured input |
| `au-alvarado` | Alvarado score (acute appendicitis) | General surgery, Paediatric surgery | no measured input |
| `au-bisap` | BISAP score (acute pancreatitis) | General surgery, Gastroenterology and hepatology | no measured input |
| `au-glasgow-imrie` | Modified Glasgow (Imrie) criteria (acute pancreatitis) | General surgery, Gastroenterology and hepatology | no measured input |
| `au-boey` | Boey score (perforated peptic ulcer) | General surgery | no measured input |
| `au-hinchey` | Hinchey classification (perforated diverticulitis) | General surgery | no measured input |
| `au-paediatric-appendicitis` | Paediatric Appendicitis Score | Paediatric surgery, Paediatrics and child health | no measured input |
| `au-twist` | TWIST score (testicular torsion) | Urology, Paediatric surgery, Emergency medicine | no measured input |
| `au-maintenance-fluids` | Maintenance fluid volume (Holliday–Segar) | Paediatrics and child health, Paediatric surgery | Weight: **kg** · result in mL, mL/h |
| `au-westley-croup` | Westley croup score | Paediatrics and child health, General practice | no measured input |
| `au-pecarn-head` | PECARN head injury rule (children) | Paediatrics and child health, Emergency medicine, Paediatric surgery | no measured input |
| `au-burns-fluid` | Burns resuscitation fluid estimate | Plastic surgery, Emergency medicine | Weight: **kg**; Burn area (%TBSA, partial and full thickness): **%** · result in mL |
| `au-vancouver-scar` | Vancouver Scar Scale | Plastic surgery, Cosmetic surgery, Dermatology | no measured input |
| `au-baker-contracture` | Baker grade of capsular contracture (breast implant) | Plastic surgery, Cosmetic surgery | no measured input |
| `au-pressure-injury-stage` | Pressure injury stage | Plastic surgery, Rehabilitation medicine, Geriatric medicine | no measured input |
| `au-dysmorphic-concern` | Dysmorphic Concern Questionnaire (DCQ) | Cosmetic surgery, Non-surgical cosmetic procedures, Plastic surgery | no measured input |
| `au-regnault-ptosis` | Regnault classification of breast ptosis | Cosmetic surgery, Plastic surgery | no measured input |
| `au-dermoscopy-tds` | Dermoscopy ABCD rule (Total Dermoscopy Score) | Dermatology | no measured input |
| `au-seven-point-checklist` | Seven-point dermoscopy checklist | Dermatology, General practice | no measured input |
| `au-salt-alopecia` | SALT score (alopecia areata) | Dermatology, Non-surgical cosmetic procedures | Vertex — % hair loss: **%**; Right side — % hair loss: **%**; Left side — % hair loss: **%**; Posterior — % hair loss: **%** · result in % |
| `au-fitzpatrick` | Fitzpatrick skin phototype | Dermatology, Non-surgical cosmetic procedures | no measured input |
| `au-glogau` | Glogau photoageing classification | Non-surgical cosmetic procedures | no measured input |
| `au-hair-loss-pattern` | Pattern hair loss stage (Norwood–Hamilton / Ludwig) | Non-surgical cosmetic procedures, Dermatology | no measured input |
| `au-prostate-volume-psad` | Prostate volume (ellipsoid) and PSA density | Urology, Radiology | Length: **cm**; Width: **cm**; Height (antero-posterior): **cm**; PSA (optional): **µg/L** · result in mL |
| `au-guys-stone` | Guy's stone score (percutaneous nephrolithotomy) | Urology | no measured input |
| `au-ottawa-knee` | Ottawa knee rule | Orthopaedic surgery, Emergency medicine, Sport and exercise medicine | no measured input |
| `au-kellgren-lawrence` | Kellgren–Lawrence radiographic grade (osteoarthritis) | Orthopaedic surgery, Rheumatology | no measured input |
| `au-gustilo-anderson` | Gustilo–Anderson classification (open fractures) | Orthopaedic surgery, Plastic surgery | no measured input |
| `au-beighton` | Beighton score (joint hypermobility) | Orthopaedic surgery, Sport and exercise medicine, Physiotherapist | no measured input |
| `au-acwr` | Acute:chronic workload ratio | Sport and exercise medicine | no measured input |
| `au-cooper-vo2` | Estimated VO2max from the Cooper 12-minute run | Sport and exercise medicine | Distance covered in 12 minutes: **m** · result in mL/kg/min |
| `au-areds-simple` | AREDS simplified severity scale (AMD) | Ophthalmology | no measured input |
| `au-dr-severity` | International clinical diabetic retinopathy severity | Ophthalmology, Endocrinology | no measured input |
| `au-ocular-trauma-score` | Ocular Trauma Score | Ophthalmology, Emergency medicine | no measured input |
| `au-van-herick` | Van Herick anterior chamber angle grade | Ophthalmology | no measured input |
| `au-lund-mackay` | Lund–Mackay CT score (chronic rhinosinusitis) | Otolaryngology – head and neck surgery, Radiology | no measured input |
| `au-house-brackmann` | House–Brackmann facial nerve grade | Otolaryngology – head and neck surgery, Neurology | no measured input |
| `au-brodsky-tonsil` | Brodsky tonsil size grade | Otolaryngology – head and neck surgery, Paediatrics and child health | no measured input |
| `au-mcisaac` | Centor score with McIsaac age adjustment (sore throat) | General practice, Otolaryngology – head and neck surgery, Paediatrics and child health | no measured input |
| `au-adrenal-washout` | Adrenal washout (CT) | Radiology, Endocrinology | Unenhanced attenuation (optional): **HU**; Enhanced attenuation (60–70 s): **HU**; Delayed attenuation (15 min): **HU** · result in % |
| `au-ct-effective-dose` | CT effective dose estimate from DLP | Radiology | Dose–length product: **mGy·cm** · result in mSv |
| `au-bosniak` | Bosniak classification of cystic renal masses (2019) | Radiology, Urology | no measured input |
| `au-audit` | AUDIT (Alcohol Use Disorders Identification Test) | Psychiatry, Psychologist, General practice | no measured input |
| `au-epds` | Edinburgh Postnatal Depression Scale | Obstetrics and gynaecology, General practice, Psychiatry | no measured input |
| `au-ciwa-ar` | CIWA-Ar (alcohol withdrawal) | Psychiatry, Emergency medicine, General medicine | no measured input |
| `au-cows` | Clinical Opiate Withdrawal Scale (COWS) | Psychiatry, Pain medicine | no measured input |
| `au-pcl-5` | PTSD Checklist for DSM-5 (PCL-5) | Psychologist, Psychiatry | no measured input |
| `au-dass-21` | DASS-21 (Depression Anxiety Stress Scales) | Psychologist, Psychiatry | no measured input |
| `au-reliable-change` | Reliable Change Index (Jacobson–Truax) | Psychologist | no measured input |
| `au-dn4` | DN4 neuropathic pain questionnaire | Pain medicine, Neurology | no measured input |
| `au-peg-pain` | PEG three-item pain scale | Pain medicine, General practice | no measured input |
| `au-opioid-risk-tool` | Opioid Risk Tool | Pain medicine, General practice | no measured input |
| `au-psfs` | Patient-Specific Functional Scale | Physiotherapist, Occupational therapist | no measured input |
| `au-tug` | Timed Up and Go | Physiotherapist, Geriatric medicine | Time: **s** · result in s |
| `au-six-minute-walk` | Six-minute walk distance vs predicted | Physiotherapist, Respiratory and sleep medicine | Distance walked: **m**; Height: **cm**; Weight: **kg** · result in m, % |
| `au-modified-ashworth` | Modified Ashworth Scale (spasticity) | Physiotherapist, Occupational therapist, Rehabilitation medicine | no measured input |
| `au-lawton-iadl` | Lawton Instrumental Activities of Daily Living | Occupational therapist, Geriatric medicine | no measured input |
| `au-fes-i` | Falls Efficacy Scale – International (FES-I) | Occupational therapist, Physiotherapist | no measured input |
| `au-home-fast` | HOME FAST home falls hazard screen | Occupational therapist | no measured input |
| `au-tympanogram-type` | Tympanogram type (Jerger) | Audiologist, Otolaryngology – head and neck surgery | Peak pressure: **daPa**; Peak static admittance: **mL** · result in mL |
| `au-hearing-grade-who` | Four-frequency average and WHO hearing grade | Audiologist, Otolaryngology – head and neck surgery | Right 0.5 kHz: **dB HL**; Right 1 kHz: **dB HL**; Right 2 kHz: **dB HL**; Right 4 kHz: **dB HL**; Left 0.5 kHz: **dB HL**; Left 1 kHz: **dB HL**; Left 2 kHz: **dB HL**; Left 4 kHz: **dB HL** · result in dB HL |
| `au-hhie-s` | Hearing Handicap Inventory for the Elderly – Screening (HHIE-S) | Audiologist | no measured input |
| `au-thi` | Tinnitus Handicap Inventory | Audiologist, Otolaryngology – head and neck surgery | no measured input |
| `au-sinbad` | SINBAD diabetes-related foot ulcer score | Podiatrist, Vascular surgery | no measured input |
| `au-iwgdf-risk` | IWGDF foot ulcer risk category and screening interval | Podiatrist, Endocrinology, General practice | no measured input |
| `au-ut-wound` | University of Texas diabetic wound classification | Podiatrist | no measured input |
| `au-fois` | Functional Oral Intake Scale | Speech pathologist, Dietitian | no measured input |
| `au-penetration-aspiration` | Penetration–Aspiration Scale | Speech pathologist | no measured input |
| `au-doss` | Dysphagia Outcome and Severity Scale | Speech pathologist | no measured input |
| `au-vhi-10` | Voice Handicap Index-10 | Speech pathologist, Otolaryngology – head and neck surgery | no measured input |
| `au-emergency-medicine-consent` | Emergency medicine: consent discussion record | Emergency medicine | no measured input |
| `au-family-medicine-consent` | General practice: consent discussion record | General practice | no measured input |
| `au-anaesthesia-consent` | Anaesthesia: consent discussion record | Anaesthesia | no measured input |
| `au-neurosurgery-consent` | Neurosurgery: consent discussion record | Neurosurgery | no measured input |
| `au-paediatric-surgery-consent` | Paediatric surgery: consent discussion record | Paediatric surgery | no measured input |
| `au-internal-medicine-consent` | General medicine: consent discussion record | General medicine | no measured input |
| `au-dermatology-consent` | Dermatology: consent discussion record | Dermatology | no measured input |
| `au-endocrinology-consent` | Endocrinology: consent discussion record | Endocrinology | no measured input |
| `au-infectious-diseases-consent` | Infectious diseases: consent discussion record | Infectious diseases | no measured input |
| `au-gastroenterology-consent` | Gastroenterology and hepatology: consent discussion record | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-consent` | General surgery: consent discussion record | General surgery | no measured input |
| `au-cardio-thoracic-surgery-consent` | Cardio-thoracic surgery: consent discussion record | Cardio-thoracic surgery | no measured input |
| `au-respiratory-medicine-consent` | Respiratory and sleep medicine: consent discussion record | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-consent` | Ophthalmology: consent discussion record | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-consent` | Obstetrics and gynaecology: consent discussion record | Obstetrics and gynaecology | no measured input |
| `au-vascular-surgery-consent` | Vascular surgery: consent discussion record | Vascular surgery | no measured input |
| `au-cardiology-consent` | Cardiology: consent discussion record | Cardiology | no measured input |
| `au-otolaryngology-consent` | Otolaryngology – head and neck surgery: consent discussion record | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-consent` | Nephrology: consent discussion record | Nephrology | no measured input |
| `au-neurology-consent` | Neurology: consent discussion record | Neurology | no measured input |
| `au-oncology-consent` | Medical oncology: consent discussion record | Medical oncology | no measured input |
| `au-radiation-oncology-consent` | Radiation oncology: consent discussion record | Radiation oncology | no measured input |
| `au-orthopaedics-consent` | Orthopaedic surgery: consent discussion record | Orthopaedic surgery | no measured input |
| `au-paediatrics-consent` | Paediatrics and child health: consent discussion record | Paediatrics and child health | no measured input |
| `au-plastic-surgery-consent` | Plastic surgery: consent discussion record | Plastic surgery | no measured input |
| `au-psychiatry-consent` | Psychiatry: consent discussion record | Psychiatry | no measured input |
| `au-radiology-consent` | Radiology: consent discussion record | Radiology | no measured input |
| `au-rheumatology-consent` | Rheumatology: consent discussion record | Rheumatology | no measured input |
| `au-urology-consent` | Urology: consent discussion record | Urology | no measured input |
| `au-sports-medicine-consent` | Sport and exercise medicine: consent discussion record | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-consent` | Rehabilitation medicine: consent discussion record | Rehabilitation medicine | no measured input |
| `au-geriatric-medicine-consent` | Geriatric medicine: consent discussion record | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-consent` | Immunology and allergy: consent discussion record | Immunology and allergy | no measured input |
| `au-haematology-consent` | Haematology: consent discussion record | Haematology | no measured input |
| `au-pain-medicine-consent` | Pain medicine: consent discussion record | Pain medicine | no measured input |
| `au-aesthetic-surgery-consent` | Cosmetic surgery: consent discussion record | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-consent` | Non-surgical cosmetic procedures: consent discussion record | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-consent` | Physiotherapy: consent discussion record | Physiotherapist | no measured input |
| `au-clinical-psychology-consent` | Clinical psychology: consent discussion record | Psychologist | no measured input |
| `au-dietetics-consent` | Dietetics: consent discussion record | Dietitian | no measured input |
| `au-occupational-therapy-consent` | Occupational therapy: consent discussion record | Occupational therapist | no measured input |
| `au-audiology-consent` | Audiology: consent discussion record | Audiologist | no measured input |
| `au-podiatry-consent` | Podiatry: consent discussion record | Podiatrist | no measured input |
| `au-speech-pathology-consent` | Speech pathology: consent discussion record | Speech pathologist | no measured input |
| `au-emergency-medicine-report` | Emergency department discharge letter | Emergency medicine | no measured input |
| `au-family-medicine-report` | GP referral letter | General practice | no measured input |
| `au-anaesthesia-report` | Pre-anaesthetic assessment report | Anaesthesia | no measured input |
| `au-neurosurgery-report` | Neurosurgical consultation report | Neurosurgery | no measured input |
| `au-paediatric-surgery-report` | Paediatric surgical report | Paediatric surgery | no measured input |
| `au-internal-medicine-report` | General medicine consultation report | General medicine | no measured input |
| `au-dermatology-report` | Dermoscopy and skin examination report | Dermatology | no measured input |
| `au-endocrinology-report` | Endocrinology report | Endocrinology | no measured input |
| `au-infectious-diseases-report` | Infectious diseases consultation report | Infectious diseases | no measured input |
| `au-gastroenterology-report` | Endoscopy report | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-report` | Surgical consultation report | General surgery | no measured input |
| `au-cardio-thoracic-surgery-report` | Cardio-thoracic surgical report | Cardio-thoracic surgery | no measured input |
| `au-respiratory-medicine-report` | Spirometry and lung function report | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-report` | Ophthalmic examination report | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-report` | Obstetric / gynaecological report | Obstetrics and gynaecology | no measured input |
| `au-vascular-surgery-report` | Vascular assessment report | Vascular surgery | no measured input |
| `au-cardiology-report` | Echocardiography and ECG report | Cardiology | no measured input |
| `au-otolaryngology-report` | ENT examination report | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-report` | Nephrology report | Nephrology | no measured input |
| `au-neurology-report` | Neurophysiology / neurology report | Neurology | no measured input |
| `au-oncology-report` | Oncology treatment summary | Medical oncology | no measured input |
| `au-radiation-oncology-report` | Radiation therapy summary | Radiation oncology | no measured input |
| `au-orthopaedics-report` | Orthopaedic assessment report | Orthopaedic surgery | no measured input |
| `au-paediatrics-report` | Paediatric report | Paediatrics and child health | no measured input |
| `au-plastic-surgery-report` | Plastic surgery report | Plastic surgery | no measured input |
| `au-psychiatry-report` | Psychiatric assessment report | Psychiatry | no measured input |
| `au-radiology-report` | Imaging report | Radiology | no measured input |
| `au-rheumatology-report` | Rheumatology report | Rheumatology | no measured input |
| `au-urology-report` | Urology report | Urology | no measured input |
| `au-sports-medicine-report` | Sports medicine assessment report | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-report` | Rehabilitation assessment report | Rehabilitation medicine | no measured input |
| `au-geriatric-medicine-report` | Comprehensive geriatric assessment report | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-report` | Allergy assessment report | Immunology and allergy | no measured input |
| `au-haematology-report` | Haematology report | Haematology | no measured input |
| `au-pain-medicine-report` | Pain medicine assessment report | Pain medicine | no measured input |
| `au-aesthetic-surgery-report` | Cosmetic surgery consultation report | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-report` | Cosmetic procedure record | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-report` | Physiotherapy assessment report | Physiotherapist | no measured input |
| `au-clinical-psychology-report` | Psychological assessment report | Psychologist | no measured input |
| `au-dietetics-report` | Dietetic assessment report | Dietitian | no measured input |
| `au-occupational-therapy-report` | Occupational therapy functional report | Occupational therapist | no measured input |
| `au-audiology-report` | Audiological assessment report | Audiologist | no measured input |
| `au-podiatry-report` | Podiatric assessment report | Podiatrist | no measured input |
| `au-speech-pathology-report` | Swallowing / communication assessment report | Speech pathologist | no measured input |
| `au-emergency-medicine-dose` | Emergency medicine: dose calculator | Emergency medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-family-medicine-dose` | General practice: dose calculator | General practice | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-anaesthesia-dose` | Anaesthesia: dose calculator | Anaesthesia | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-neurosurgery-dose` | Neurosurgery: dose calculator | Neurosurgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-paediatric-surgery-dose` | Paediatric surgery: dose calculator | Paediatric surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-internal-medicine-dose` | General medicine: dose calculator | General medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-dermatology-dose` | Dermatology: dose calculator | Dermatology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-endocrinology-dose` | Endocrinology: dose calculator | Endocrinology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-infectious-diseases-dose` | Infectious diseases: dose calculator | Infectious diseases | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-gastroenterology-dose` | Gastroenterology and hepatology: dose calculator | Gastroenterology and hepatology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-general-surgery-dose` | General surgery: dose calculator | General surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-cardio-thoracic-surgery-dose` | Cardio-thoracic surgery: dose calculator | Cardio-thoracic surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-respiratory-medicine-dose` | Respiratory and sleep medicine: dose calculator | Respiratory and sleep medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-ophthalmology-dose` | Ophthalmology: dose calculator | Ophthalmology | Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-obstetrics-gynaecology-dose` | Obstetrics and gynaecology: dose calculator | Obstetrics and gynaecology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-vascular-surgery-dose` | Vascular surgery: dose calculator | Vascular surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-cardiology-dose` | Cardiology: dose calculator | Cardiology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-otolaryngology-dose` | Otolaryngology – head and neck surgery: dose calculator | Otolaryngology – head and neck surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-nephrology-dose` | Nephrology: dose calculator | Nephrology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-neurology-dose` | Neurology: dose calculator | Neurology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-oncology-dose` | Medical oncology: dose calculator | Medical oncology | Weight: **kg**; Height (optional, for body-surface area): **cm**; Body-surface area, your own figure (optional): **m²**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-radiation-oncology-dose` | Radiation oncology: dose calculator | Radiation oncology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-orthopaedics-dose` | Orthopaedic surgery: dose calculator | Orthopaedic surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-paediatrics-dose` | Paediatrics and child health: dose calculator | Paediatrics and child health | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-plastic-surgery-dose` | Plastic surgery: dose calculator | Plastic surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-psychiatry-dose` | Psychiatry: dose calculator | Psychiatry | Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-radiology-dose` | Radiology: dose calculator | Radiology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-rheumatology-dose` | Rheumatology: dose calculator | Rheumatology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-urology-dose` | Urology: dose calculator | Urology | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-sports-medicine-dose` | Sport and exercise medicine: dose calculator | Sport and exercise medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-rehabilitation-medicine-dose` | Rehabilitation medicine: dose calculator | Rehabilitation medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-geriatric-medicine-dose` | Geriatric medicine: dose calculator | Geriatric medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-immunology-and-allergy-dose` | Immunology and allergy: dose calculator | Immunology and allergy | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-haematology-dose` | Haematology: dose calculator | Haematology | Weight: **kg**; Height (optional, for body-surface area): **cm**; Body-surface area, your own figure (optional): **m²**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-pain-medicine-dose` | Pain medicine: dose calculator | Pain medicine | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-aesthetic-surgery-dose` | Cosmetic surgery: dose calculator | Cosmetic surgery | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-aesthetic-medicine-dose` | Non-surgical cosmetic procedures: dose calculator | Non-surgical cosmetic procedures | Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-podiatry-dose` | Podiatrist: dose calculator | Podiatrist | Weight: **kg**; Dose: per kilogram, per square metre or per dose: **mg**; Strength: milligrams (optional): **mg**; Strength: in millilitres (optional): **mL**; Your own maximum single dose (optional): **mg**; Your own maximum daily dose (optional): **mg** · result in mg, mL, hours, m² |
| `au-emergency-medicine-orders` | Emergency medicine: order presets | Emergency medicine | no measured input |
| `au-family-medicine-orders` | General practice: order presets | General practice | no measured input |
| `au-anaesthesia-orders` | Anaesthesia: order presets | Anaesthesia | no measured input |
| `au-neurosurgery-orders` | Neurosurgery: order presets | Neurosurgery | no measured input |
| `au-paediatric-surgery-orders` | Paediatric surgery: order presets | Paediatric surgery | no measured input |
| `au-internal-medicine-orders` | General medicine: order presets | General medicine | no measured input |
| `au-dermatology-orders` | Dermatology: order presets | Dermatology | no measured input |
| `au-endocrinology-orders` | Endocrinology: order presets | Endocrinology | no measured input |
| `au-infectious-diseases-orders` | Infectious diseases: order presets | Infectious diseases | no measured input |
| `au-gastroenterology-orders` | Gastroenterology and hepatology: order presets | Gastroenterology and hepatology | no measured input |
| `au-general-surgery-orders` | General surgery: order presets | General surgery | no measured input |
| `au-cardio-thoracic-surgery-orders` | Cardio-thoracic surgery: order presets | Cardio-thoracic surgery | no measured input |
| `au-respiratory-medicine-orders` | Respiratory and sleep medicine: order presets | Respiratory and sleep medicine | no measured input |
| `au-ophthalmology-orders` | Ophthalmology: order presets | Ophthalmology | no measured input |
| `au-obstetrics-gynaecology-orders` | Obstetrics and gynaecology: order presets | Obstetrics and gynaecology | no measured input |
| `au-vascular-surgery-orders` | Vascular surgery: order presets | Vascular surgery | no measured input |
| `au-cardiology-orders` | Cardiology: order presets | Cardiology | no measured input |
| `au-otolaryngology-orders` | Otolaryngology – head and neck surgery: order presets | Otolaryngology – head and neck surgery | no measured input |
| `au-nephrology-orders` | Nephrology: order presets | Nephrology | no measured input |
| `au-neurology-orders` | Neurology: order presets | Neurology | no measured input |
| `au-oncology-orders` | Medical oncology: order presets | Medical oncology | no measured input |
| `au-radiation-oncology-orders` | Radiation oncology: order presets | Radiation oncology | no measured input |
| `au-orthopaedics-orders` | Orthopaedic surgery: order presets | Orthopaedic surgery | no measured input |
| `au-paediatrics-orders` | Paediatrics and child health: order presets | Paediatrics and child health | no measured input |
| `au-plastic-surgery-orders` | Plastic surgery: order presets | Plastic surgery | no measured input |
| `au-psychiatry-orders` | Psychiatry: order presets | Psychiatry | no measured input |
| `au-radiology-orders` | Radiology: order presets | Radiology | no measured input |
| `au-rheumatology-orders` | Rheumatology: order presets | Rheumatology | no measured input |
| `au-urology-orders` | Urology: order presets | Urology | no measured input |
| `au-sports-medicine-orders` | Sport and exercise medicine: order presets | Sport and exercise medicine | no measured input |
| `au-rehabilitation-medicine-orders` | Rehabilitation medicine: order presets | Rehabilitation medicine | no measured input |
| `au-geriatric-medicine-orders` | Geriatric medicine: order presets | Geriatric medicine | no measured input |
| `au-immunology-and-allergy-orders` | Immunology and allergy: order presets | Immunology and allergy | no measured input |
| `au-haematology-orders` | Haematology: order presets | Haematology | no measured input |
| `au-pain-medicine-orders` | Pain medicine: order presets | Pain medicine | no measured input |
| `au-aesthetic-surgery-orders` | Cosmetic surgery: order presets | Cosmetic surgery | no measured input |
| `au-aesthetic-medicine-orders` | Non-surgical cosmetic procedures: order presets | Non-surgical cosmetic procedures | no measured input |
| `au-physiotherapy-orders` | Physiotherapist: order presets | Physiotherapist | no measured input |
| `au-clinical-psychology-orders` | Psychologist: order presets | Psychologist | no measured input |
| `au-dietetics-orders` | Dietitian: order presets | Dietitian | no measured input |
| `au-occupational-therapy-orders` | Occupational therapist: order presets | Occupational therapist | no measured input |
| `au-audiology-orders` | Audiologist: order presets | Audiologist | no measured input |
| `au-podiatry-orders` | Podiatrist: order presets | Podiatrist | no measured input |
| `au-speech-pathology-orders` | Speech pathologist: order presets | Speech pathologist | no measured input |
| `au-gpccmp` | GP chronic condition management plan (GPCCMP) record | General practice | no measured input |
| `au-mhtp` | GP mental health treatment plan and Better Access referral record | General practice | no measured input |
| `au-growth-chart-reference` | Which growth chart to use | every role | no measured input |
| `au-identifier-check` | Medicare card and provider number check | every role | no measured input |
| `au-privacy-principles` | Privacy Act record | every role | no measured input |
| `au-tax-invoice` | GST tax invoice particulars | every role | no measured input |
| `au-pbs-report-link` | PBS expenditure and prescriptions (link) | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-notifiable-diseases` | National Notifiable Disease List | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-poisons-schedules` | Poisons Standard schedules | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-schedule-8` | Schedule 8 controlled drugs | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-dispensing-label` | Dispensing label details | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-mandatory-notifications` | Mandatory notification grounds | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures, Physiotherapist, Occupational therapist, Psychologist, Podiatrist | no measured input |
| `au-pbs-prescription` | PBS prescription particulars | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-pbs-schedule-link` | PBS medicine listings (link) | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-mbs-online-link` | MBS Online (link) | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-medicare-particulars` | Medicare account particulars | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures | no measured input |
| `au-cvd-risk-link` | Australian CVD risk calculator (link) | General practice, General medicine, Cardiology, Endocrinology, Geriatric medicine | no measured input |
| `au-ahpra-registration` | Ahpra registration (link) | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures, Physiotherapist, Occupational therapist, Psychologist, Podiatrist | no measured input |
| `au-gp-red-book` | RACGP preventive activities (link) | General practice | no measured input |
| `au-rch-clinical-guide` | Royal Children's Hospital guidelines (link) | General practice, Paediatrics and child health, Paediatric surgery | no measured input |
| `au-ref-family-medicine` | RACGP guidelines (link) | General practice | no measured input |
| `au-ref-emergency-medicine` | ACEM (link) | Emergency medicine | no measured input |
| `au-ref-anaesthesia` | ANZCA (link) | Anaesthesia | no measured input |
| `au-ref-pain-medicine` | ANZCA — pain medicine (link) | Pain medicine | no measured input |
| `au-ref-psychiatry` | RANZCP guidelines (link) | Psychiatry | no measured input |
| `au-ref-obstetrics-gynaecology` | RANZCOG (link) | Obstetrics and gynaecology | no measured input |
| `au-ref-ophthalmology` | RANZCO (link) | Ophthalmology | no measured input |
| `au-ref-cardiology` | CSANZ (link) | Cardiology | no measured input |
| `au-ref-otolaryngology` | ASOHNS (link) | Otolaryngology – head and neck surgery | no measured input |
| `au-ref-neurology` | ANZAN (link) | Neurology | no measured input |
| `au-ref-orthopaedics` | AOA (link) | Orthopaedic surgery | no measured input |
| `au-ref-plastic-surgery` | ASPS (link) | Plastic surgery | no measured input |
| `au-ref-radiology` | RANZCR — radiology (link) | Radiology | no measured input |
| `au-ref-radiation-oncology` | RANZCR — radiation oncology (link) | Radiation oncology | no measured input |
| `au-ref-sports-medicine` | ACSEP (link) | Sport and exercise medicine | no measured input |
| `au-ref-haematology` | HSANZ (link) | Haematology | no measured input |
| `au-ref-oncology` | Cancer Council Australia (link) | Medical oncology | no measured input |
| `au-ref-paediatrics` | RACP (link) | Paediatrics and child health | no measured input |
| `au-ref-rehabilitation-medicine` | RACP — rehabilitation medicine (link) | Rehabilitation medicine | no measured input |
| `au-ref-internal-medicine` | RACP — general medicine (link) | General medicine | no measured input |
| `au-ref-endocrinology` | RACP — endocrinology (link) | Endocrinology | no measured input |
| `au-ref-infectious-diseases` | RACP — infectious diseases (link) | Infectious diseases | no measured input |
| `au-ref-gastroenterology` | RACP — gastroenterology (link) | Gastroenterology and hepatology | no measured input |
| `au-ref-respiratory-medicine` | RACP — respiratory medicine (link) | Respiratory and sleep medicine | no measured input |
| `au-ref-nephrology` | RACP — nephrology (link) | Nephrology | no measured input |
| `au-ref-rheumatology` | RACP — rheumatology (link) | Rheumatology | no measured input |
| `au-ref-geriatric-medicine` | RACP — geriatric medicine (link) | Geriatric medicine | no measured input |
| `au-ref-immunology-and-allergy` | RACP — immunology and allergy (link) | Immunology and allergy | no measured input |
| `au-ref-general-surgery` | RACS — general surgery (link) | General surgery | no measured input |
| `au-ref-neurosurgery` | RACS — neurosurgery (link) | Neurosurgery | no measured input |
| `au-ref-paediatric-surgery` | RACS — paediatric surgery (link) | Paediatric surgery | no measured input |
| `au-ref-cardio-thoracic-surgery` | RACS — cardio-thoracic surgery (link) | Cardio-thoracic surgery | no measured input |
| `au-ref-vascular-surgery` | RACS — vascular surgery (link) | Vascular surgery | no measured input |
| `au-ref-urology` | RACS — urology (link) | Urology | no measured input |
| `au-ref-dermatology` | Medical Board — dermatology (link) | Dermatology | no measured input |
| `au-ref-aesthetic-surgery` | Medical Board — cosmetic surgery (link) | Cosmetic surgery | no measured input |
| `au-ref-aesthetic-medicine` | Medical Board — cosmetic procedures (link) | Non-surgical cosmetic procedures | no measured input |
| `au-ref-physiotherapy` | Australian Physiotherapy Association (link) | Physiotherapist | no measured input |
| `au-ref-clinical-psychology` | Australian Psychological Society (link) | Psychologist | no measured input |
| `au-ref-dietetics` | Dietitians Australia (link) | Dietitian | no measured input |
| `au-ref-occupational-therapy` | Occupational Therapy Australia (link) | Occupational therapist | no measured input |
| `au-ref-audiology` | Audiology Australia (link) | Audiologist | no measured input |
| `au-ref-podiatry` | Australian Podiatry Association (link) | Podiatrist | no measured input |
| `au-ref-speech-pathology` | Speech Pathology Australia (link) | Speech pathologist | no measured input |
| `takip-paneli` | Follow-up list | Emergency medicine, General practice, Anaesthesia, Neurosurgery, Paediatric surgery, General medicine, Dermatology, Endocrinology, Infectious diseases, Gastroenterology and hepatology, General surgery, Cardio-thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Obstetrics and gynaecology, Vascular surgery, Cardiology, Otolaryngology – head and neck surgery, Nephrology, Neurology, Medical oncology, Radiation oncology, Orthopaedic surgery, Paediatrics and child health, Plastic surgery, Psychiatry, Radiology, Rheumatology, Urology, Sport and exercise medicine, Rehabilitation medicine, Geriatric medicine, Immunology and allergy, Haematology, Pain medicine, Cosmetic surgery, Non-surgical cosmetic procedures, Physiotherapist, Psychologist, Dietitian, Occupational therapist, Audiologist, Podiatrist, Speech pathologist | no measured input |

### Kept as slots FOR THIS COUNTRY (19) — for a local clinical lead

The shared English set has the words of these tools and the kit has their mechanism; this country keeps them switched off for the reason given.

| Tool | Who would see it | Why it is off here | Waits on |
|---|---|---|---|
| `midas` | Neurology | MIDAS (Migraine Disability Assessment): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. NOTYA-ULKE-ARACLAR-AU-07, 2026-10-17: the kit now holds the scoring mechanism (five numbered items, no item wording shown — the doctor reads from the instrument's own authorised form), proven against the equivalence suite; the licence question above is the only thing still missing. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `ipss` | Urology | IPSS (International Prostate Symptom Score): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. NOTYA-ULKE-ARACLAR-AU-07, 2026-10-17: the kit now holds the scoring mechanism (seven numbered items plus the optional quality-of-life item, no item wording shown — the doctor reads from the instrument's own authorised form), proven against the equivalence suite; the licence question above is the only thing still missing. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `esi-triyaj` | Emergency medicine | NOT AUSTRALIA'S SCALE: removed for Australia. Emergency departments here use the Australasian Triage Scale, which belongs to the Australasian College for Emergency Medicine and needs the College's permission before a tool may carry it. LICENCE, off by the owner's order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded. | the owner, with the rights holder's written permission; then a clinical lead in Australia |
| `kdigo-evre` | General medicine | Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol, and the national handbook for primary care writes its categories as below 3.0, 3.0 to 30 and above 30 mg/mmol and has a colour chart of its own that differs from the international grid in two cells; the handbook may not be reproduced without its publisher's written permission. Needed: a nephrologist's decision on which chart applies here, and that permission. Off by the owner's order of 2026-10-10. The faults found in the tool (a risk colour shown with no urine albumin result; referral flags the guideline does not state that way; limits compared after converting the unit) were corrected in the kit the same day; the tool stays off because the licence of the risk grid is unsettled and no clinician has read it. Needed: the rights holder's terms, recorded, and a nephrologist's reading. | a clinical lead in Australia |
| `kdigo-serit` | Nephrology | The same as the general-medicine kidney tool: the national handbook's categories in mg/mmol and its own colour chart, which needs its publisher's permission. A nephrologist may prefer the international grid; the screen must then say which grid it shows. Off by the owner's order of 2026-10-10. The faults found in the tool (a risk colour shown with no urine albumin result; referral flags the guideline does not state that way; limits compared after converting the unit) were corrected in the kit the same day; the tool stays off because the licence of the risk grid is unsettled and no clinician has read it. Needed: the rights holder's terms, recorded, and a nephrologist's reading. | a clinical lead in Australia |
| `kbh-risk-kategorisi` | Nephrology, General medicine, General practice, Endocrinology, Cardiology, Urology, Medical oncology | NEW TOOL, ships off pending a clinician's sign-off (the standing rule for every new tool, not the handbook-chart licence question above: this is the kit's own open-facts classifier, no coloured chart and no reproduction of Kidney Health Australia's own handbook chart, built for that reason — lib/ulke/araclar/tanimlar/kbhRiskKategorisi.ts). Needed: a nephrologist or general-medicine lead in Australia to confirm (a) the specialty roster the kit defaults to (nephrology, general medicine, general practice, endocrinology, cardiology, urology, oncology — diabetic and cardiorenal monitoring, transplant/obstructive follow-up and nephrotoxic-therapy monitoring, not only nephrology clinics) fits Australian practice, including whether Geriatric medicine and Radiation oncology (this pack's own added roles) should be added, and (b) whether this country's national handbook (Kidney Health Australia, cited above) should set the category boundaries here instead of KDIGO's international ones in mg/mmol, the same open question the KDIGO-grid slot above already raises. NOT given to emergency medicine or anaesthesia here: those specialties stage ACUTE kidney injury, a different KDIGO tool this kit does not yet have (see docs/OPEN-COMMITMENTS.md). | a clinical lead in Australia |
| `rapor-taslagi` | Radiology | The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in Australia use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole. LICENCE, off by the owner's order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded. | the owner, with the rights holder's written permission; then a clinical lead in Australia |
| `greft-tahmini` |  | Hair transplantation is not offered as its own role. The Medical Board guideline lists hair transplants with non-surgical cosmetic procedures. This graft estimate stays off. No graft count is stored. | a clinical lead in Australia |
| `sac-bakim-vade` |  | Hair transplantation is not offered as its own role. It is listed with non-surgical cosmetic procedures. These hair-care reminders stay off. They are a product calendar, not a national schedule. | a clinical lead in Australia |
| `akne-vade` |  | This country has no clinic-dermatology role, so this reminder calendar stays off. It is a product reminder for that role, not a national schedule. | a clinical lead in Australia |
| `lazer-vade` |  | This country has no clinic-dermatology role, so this interval record stays off. The interval is one the clinician chooses, and the role is not in this pack. | a clinical lead in Australia |
| `infuzyon-guvenlik` |  | Wellness and longevity are not a specialist title on the Medical Board list. A general-practice plan is the screen for that work. This infusion checklist stays off. Nothing is sent. | a clinical lead in Australia |
| `genital-enerji-seansi` | Obstetrics and gynaecology | NOT OFFERED IN AUSTRALIA. The Therapeutic Goods Administration cancelled every ARTG entry, or its vaginal-rejuvenation use, for radiofrequency, CO2 and Er:YAG devices used for vaginal laxity, incontinence, sexual dysfunction, labial hypertrophy, vulvovaginal atrophy and the genitourinary syndrome of menopause (Therapeutic Goods Administration, Post-market review: energy-based devices used for vaginal rejuvenation; effective dates 30 June 2023 to 15 November 2024). There is currently no device on the ARTG approved for this use. | the Therapeutic Goods Administration (a device included on the ARTG for the use), then the owner |
| `genital-enjeksiyon` | Obstetrics and gynaecology | NOT OFFERED IN AUSTRALIA until verified. Labial sites: State and territory FGM laws (Crimes Act 1900 NSW and ACT; Crimes Act 1958 Vic; Criminal Code 1899 Qld; Criminal Law Consolidation Act 1935 SA; Criminal Code Act Compilation Act 1913 WA; Criminal Code Act 1924 Tas; Criminal Code Act 1983 NT): consent is no defence, and whether a purely cosmetic procedure on the labia or clitoris falls within the medical exceptions is legally uncertain (RACGP, Female genital cosmetic surgery, 2015). Intravaginal ("G-spot") filler and PRP: no ARTG inclusion with a genital intended purpose was verified, and RANZCOG strongly discourages procedures without peer-reviewed evidence outside a properly designed trial (C-Gyn 24, Vaginal "rejuvenation" and cosmetic vaginal procedures, current March 2019). | an Australian health lawyer and the ARTG entry of the product, then the owner |
| `genital-beyazlatma` | Obstetrics and gynaecology | NOT OFFERED IN AUSTRALIA. Lightening applied to the labia: State and territory FGM laws (Crimes Act 1900 NSW and ACT; Crimes Act 1958 Vic; Criminal Code 1899 Qld; Criminal Law Consolidation Act 1935 SA; Criminal Code Act Compilation Act 1913 WA; Criminal Code Act 1924 Tas; Criminal Code Act 1983 NT): consent is no defence, and whether a purely cosmetic procedure on the labia or clitoris falls within the medical exceptions is legally uncertain (RACGP, Female genital cosmetic surgery, 2015). No Australian recognition of the procedure was found. | an Australian health lawyer, then the owner |
| `phq9` | Psychiatry, Psychologist | PHQ-9 (Patient Health Questionnaire-9): the kit holds the scoring mechanism (nine numbered items, no item wording shown, with the ninth item's safety flag) under this key, proven against the real psychiatry engine's arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set's own `phq9-gad7` slot already names: Pfizer's terms for showing the instrument's original English wording inside a commercial product were not read this session. Awaits a clinical lead's sign-off on top of the licence question. | a clinical lead in Australia, with the national source named |
| `gad7` | Psychiatry, Psychologist | GAD-7 (Generalized Anxiety Disorder-7): the kit holds the scoring mechanism (seven numbered items, no item wording shown) under this key, proven against the real psychiatry engine's arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set's own `phq9-gad7` slot already names. Awaits a clinical lead's sign-off on top of the licence question. | a clinical lead in Australia, with the national source named |
| `odi` | Physiotherapist, Rehabilitation medicine, Occupational therapist | ODI (Oswestry Disability Index): the kit holds the scoring mechanism (ten numbered items, no item wording shown) under this key, proven against the real physiotherapy engine's arithmetic in the equivalence suite. THE LICENCE QUESTION is the same one the shared set's own `pain-odi` slot already names: ODI is a published, licensed questionnaire and its rights holder's terms for showing the English wording inside a commercial product were not read this session. Awaits a clinical lead's sign-off on top of the licence question. | a clinical lead in Australia, with the national source named |
| `vas-agri` | Physiotherapist, Rehabilitation medicine, Occupational therapist | A 0–10 pain visual analogue scale: the kit holds the mechanism under this key, proven against the real physiotherapy engine's arithmetic in the equivalence suite. No published item text is involved (a VAS is a single numbered line, not a copyrighted questionnaire), so there is no licence question here — only a clinical lead's sign-off, per this pack's standing rule for a brand-new tool. | a clinical lead in Australia, with the national source named |

### Slots in every English-speaking country (59) — empty, switched off

No national reference content is written by a machine, and no item of a published questionnaire is reproduced. The sentences of a slot are written for documents and reviewers and are never shown on a screen; in every pack they stay in the set's base spelling (British), whatever the pack's own form.

| Slot | Who would see it | What is missing | Waits on |
|---|---|---|---|
| `prescription` | every role | Prescription drafting: the register of medicines authorised in Australia (names, forms, strengths), the prescription form and its mandatory fields, and the rules for controlled medicines. Without the register no medicine can be offered or checked. | a local clinical lead, with the national source named |
| `visit-summary-document` | every role | Visit and discharge summary as a document: the headings and mandatory fields of the summary a clinic in Australia issues. | a local clinical lead, with the national source named |
| `diagnosis-coding` | every role | Diagnosis coding: the coding edition in force in Australia with its official titles. A coding table is reference content of an authority and is not written by a machine. | a local clinical lead, with the national source named |
| `medicine-interactions` | every role | Medicine interactions: the interaction data itself (by active substance) from a licensed or official source, and the register of products and brand names sold in Australia to search by. | a local clinical lead, with the national source named |
| `patient-certificates` | every role | Certificates for patients: the forms a clinic in Australia issues (sickness and fitness certificates, attendance notes), their fields and the periods the rules allow. | a lawyer of the country, with the local clinical lead |
| `test-requests` | every role | Laboratory and imaging requests: the catalogue of tests offered locally, the units and reference ranges of the local laboratories, and the request form layout. | a local clinical lead, with the national source named |
| `end-of-visit` | every role | End-of-visit flow: it strings together prescription, certificate, follow-up appointment and the summary for the patient. It waits for the prescription and certificate slots above; the appointment and the summary exist already as screens of their own. | a local clinical lead, with the national source named |
| `emergency-referral` | Emergency medicine | Admission, referral and discharge package of an emergency department in Australia: the documents that go with each, the levels of care a patient can be referred to, and who must be notified. | a local clinical lead, with the national source named |
| `family-vaccination-screening` | General practice | The vaccination schedule of Australia with its catch-up rules, and its screening programmes (which examination, at which age, how often). | a local clinical lead, with the national source named |
| `family-chronic` | General practice | Follow-up intervals for diabetes and high blood pressure in primary care, from the guidance followed in Australia. | a local clinical lead, with the national source named |
| `family-referral` | General practice | Referral and emergency triage in primary care: the referral routes of Australia, the criteria for each, and the emergency number confirmed by a local source. | a local clinical lead, with the national source named |
| `family-follow-up-panel` | General practice | The follow-up panel of family medicine: it lists patients by the three tools above and has nothing to list until they exist. | a local clinical lead, with the national source named |
| `child-surgery-consent` | Paediatric surgery | Consent for an operation on a child: the age below which a parent or guardian signs, who may sign, and the wording of the consent, under the law of Australia. | a lawyer of the country, with the local clinical lead |
| `cardiovascular-risk` | General medicine, Cardiology | Ten-year cardiovascular risk: the risk calculator recommended in Australia, with its calibration and its tables. A risk score calibrated for one population must not be shown in another. | a local clinical lead, with the national source named |
| `polypharmacy` | General medicine | Review of medicines in older patients: the criteria in a licensed edition, and the register of medicines sold in Australia to recognise each medicine by the name it has there. | a local clinical lead, with the national source named |
| `anticoagulation-review` | General medicine | Anticoagulation review: the dose-reduction criteria of each anticoagulant as authorised in Australia (age, weight, kidney function), targets and recheck intervals from the guidance followed there, and the local medicine names. | a local clinical lead, with the national source named |
| `isotretinoin-pregnancy-prevention` | Dermatology | Pregnancy-prevention checks for isotretinoin: the programme the regulator of Australia requires (tests, contraception, prescription validity). | a local clinical lead, with the national source named |
| `lab-izlem` | Endocrinology | HbA1c and TSH follow-up: the thresholds between the bands (12 numbers: two HbA1c cut-offs, four TSH limits, six intervals in months) from the guidance followed in Australia; the unit HbA1c is reported in there (per cent or mmol/mol: the kit converts between the two, and the two cut-offs are stated with their unit); and the reference range the local laboratories report for TSH. | a local clinical lead, with the national source named |
| `dxa-tekrar` | Endocrinology | Bone densitometry repeat: the years between two scans for a low, a medium and a high risk band (3 numbers) from the guidance followed in Australia. | a local clinical lead, with the national source named |
| `viral-izlem` | Infectious diseases | HIV and viral hepatitis follow-up: the months between two checks (3 numbers) from the guidance followed in Australia. | a local clinical lead, with the national source named |
| `notifiable-diseases` | Infectious diseases | Isolation and notification: the list of notifiable diseases in Australia, to whom and by when each is reported, the report form, and isolation periods. | a local clinical lead, with the national source named |
| `anemi-izlem` | Nephrology | Anaemia follow-up in chronic kidney disease: the target haemoglobin range, the lower limit and the months until the next check (6 numbers) from the guidance followed in Australia, stated in the unit its laboratories report haemoglobin in. | a local clinical lead, with the national source named |
| `iltihap-lab-izlem` | Rheumatology | CRP and ESR follow-up: the thresholds between the bands and the months until the next check (7 numbers), with the reference ranges and the CRP unit the laboratories of Australia use. | a local clinical lead, with the national source named |
| `basdai` | Rheumatology | BASDAI (Bath Ankylosing Spondylitis Disease Activity Index): a published patient questionnaire of six questions. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `kardiyo-izlem` | Cardiology | High blood pressure, heart-failure and atrial-fibrillation follow-up: the clinic blood-pressure limits that raise a warning and the days until each next check (9 numbers), from the guidance followed in Australia. | a local clinical lead, with the national source named |
| `cat-mmrc` | Respiratory and sleep medicine | COPD Assessment Test (CAT) with the mMRC breathlessness grade: CAT is a published questionnaire whose wording belongs to its rights holder. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `lung-action-plan` | Respiratory and sleep medicine | Written action plan for asthma and COPD: a sheet the PATIENT reads (what to do in each zone), with the emergency number and the stop-smoking service of Australia. Every sentence is an instruction to a patient and must be supplied and signed by a local respiratory doctor. | a local clinical lead, with the national source named |
| `ibd-skor` | Gastroenterology and hepatology | Activity index follow-up (partial Mayo, Harvey-Bradshaw, IBS severity total): the cut-offs between remission, mild, moderate and severe and the months until the next check (13 numbers), as the guidance followed in Australia states them. | a local clinical lead, with the national source named |
| `hepatit-izlem` | Gastroenterology and hepatology | Hepatitis B and C follow-up: the months until the next check for a stable patient, one under active follow-up and one being assessed for treatment (3 numbers) from the guidance followed in Australia. | a local clinical lead, with the national source named |
| `pregnancy-calendar` | Obstetrics and gynaecology | Pregnancy calendar: the antenatal visit schedule and the screening windows followed in Australia. (Gestational-age arithmetic alone is universal; the tool is its schedule.) | a local clinical lead, with the national source named |
| `maternity-leave` | Obstetrics and gynaecology | Maternity leave dates and certificate: the periods the law of Australia gives before and after birth, how they move with an early or late birth, and the certificate form. | a lawyer of the country, with the local clinical lead |
| `contraception-eligibility` | Obstetrics and gynaecology | Medical eligibility for contraception: the eligibility criteria in the edition used in Australia, entered from the source and signed by a local clinician, and for emergency contraception the products authorised there. An eligibility table is not copied by a machine. | a local clinical lead, with the national source named |
| `obstetric-risk` | Obstetrics and gynaecology | Obstetric risk prompts and the caesarean indication note: the guidance followed in Australia (who is offered which prophylaxis, in which window) and the form of the note its rules require. | a local clinical lead, with the national source named |
| `obstetric-follow-up-panel` | Obstetrics and gynaecology | The follow-up panel of obstetrics and gynaecology: it lists patients by the antenatal and screening schedule above and has nothing to list until that exists. | a local clinical lead, with the national source named |
| `stroke-red-flags` | Neurology | Stroke and TIA red flags: the emergency number confirmed by a local source and the stroke pathway of the region (where a patient is sent, within which time window). | a local clinical lead, with the national source named |
| `antiseizure-monitoring` | Neurology | Laboratory monitoring of antiseizure medicines: which tests, how soon after starting and how often, from the guidance followed in Australia, and the register of medicines sold there to recognise each by name. | a local clinical lead, with the national source named |
| `growth-percentiles` | Paediatrics and child health | Growth and percentiles: the growth charts used in Australia (which standard, which charts, from which age) with their reference tables. | a local clinical lead, with the national source named |
| `vaccination-schedule` | Paediatrics and child health | Vaccination schedule and catch-up: the immunisation schedule of Australia with its catch-up rules. | a local clinical lead, with the national source named |
| `development-screening` | Paediatrics and child health | Development and screening panel: the screening programme for children in Australia (hearing, vision, supplements: which, at which age). | a local clinical lead, with the national source named |
| `mchat-rf` | Paediatrics and child health | M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised, with Follow-Up): a published questionnaire for parents. THE LICENCE QUESTION: the permission of its authors and their terms for use inside a product. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `paediatric-follow-up-panel` | Paediatrics and child health | The follow-up panel of paediatrics: it lists patients by the vaccination schedule and the screening programme above and has nothing to list until they exist. | a local clinical lead, with the national source named |
| `plastic-surgery-consent` | Plastic surgery | Informed-consent checklist for a plastic-surgery procedure: the items and the wording the law of Australia requires. | a lawyer of the country, with the local clinical lead |
| `phq9-gad7` | Psychiatry | PHQ-9 and GAD-7: published patient questionnaires. THE LICENCE QUESTION: the terms of use of their owner for showing the original English wording inside a commercial product. No item is reproduced here; the scoring, and the safety prompt on the ninth item of PHQ-9, are not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `psychiatry-safety-triage` | Psychiatry | Safety and emergency triage: the emergency number and the crisis service confirmed by a local source, the referral path, the rules for involuntary admission in Australia, and the wording of a crisis plan signed by a local psychiatrist. | a local clinical lead, with the national source named |
| `psychotropic-monitoring` | Psychiatry | Monitoring calendar of psychotropic medicines: which tests and how often for each class, from the guidance followed in Australia, and the register of medicines sold there. A monitoring schedule by medicine is clinical reference content. | a local clinical lead, with the national source named |
| `critical-finding-notice` | Radiology | Critical-finding notice: who must be told, how fast, by which channel, under the rules of the institution and of Australia. | a local clinical lead, with the national source named |
| `urology-emergency-triage` | Urology | Haematuria and stone emergency triage: the emergency number confirmed by a local source and the referral path. | a local clinical lead, with the national source named |
| `rehabilitation-session-plan` | Rehabilitation medicine | Session plan: any rule of Australia on the number and frequency of sessions (a public programme or an insurer), and the form a plan is written in. | a local clinical lead, with the national source named |
| `pain-odi` | Rehabilitation medicine | Pain scale with the Oswestry Disability Index (ODI): ODI is a published patient questionnaire under licence. THE LICENCE QUESTION: the licence and its terms for the English version. No item is reproduced here; the scoring is not switched on without it. | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `home-exercise` | Rehabilitation medicine | Home exercise sheet: a sheet the PATIENT reads (exercise names, how often, when to stop, whom to call). Every sentence is an instruction to a patient and must be supplied and signed by a local rehabilitation doctor. | a local clinical lead, with the national source named |
| `genital-fsfi-items` | Obstetrics and gynaecology | Item-level entry and scoring of the FSFI: the questionnaire's wording belongs to its author (Raymond C. Rosen), and permission to show it in a commercial product has not been obtained. Until then only the total is recorded (outcome measure total). | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `genital-fgsis-items` | Obstetrics and gynaecology | Item-level entry and scoring of the FGSIS: the questionnaire's wording belongs to its authors (Debby Herbenick, Michael Reece), and permission to show it in a commercial product has not been obtained. Until then only the total is recorded (outcome measure total). | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `genital-cops-l-items` | Obstetrics and gynaecology, Plastic surgery, Cosmetic surgery | Item-level entry and scoring of COPS-L: the questionnaire's wording belongs to its author (David Veale), and permission to show it in a commercial product has not been obtained. Until then only the total is recorded (outcome measure total). | the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version |
| `au-triage-scale` | Emergency medicine | The Australasian Triage Scale (ATS), the five-category scale Australian emergency departments actually use — NOT the Emergency Severity Index (ESI) the kit built, which ../ayarlar.ts already keeps off for Australia for exactly this reason. Read 2026-10-13: Australasian College for Emergency Medicine (ACEM), "Policy on the Australasian Triage Scale" (P06), https://policy.acem.org.au/index.php/policies-menu/p06-policy-on-the-australasian-triage-scale; the category descriptors are also published by the Australian Commission on Safety and Quality in Health Care's Emergency Triage Education Kit. LICENCE: the existing `esi-triyaj` slot's own note already finds that ATS "belongs to the Australasian College for Emergency Medicine and needs the College's permission before a tool may carry it" — the same permission question applies here, not a new one. | a lawyer of Australia, with the clinical lead |
| `au-diabetic-retinopathy-referral` | Ophthalmology | A referral-pathway reference for diabetic retinopathy screening — grading band, review interval and the threshold for an urgent referral — distinct from the kit's own generic visual-acuity tool. Read 2026-10-13: RANZCO, the region's ophthalmology college, "Referral Pathway for Diabetic Retinopathy", https://ranzco.edu/home/health-professionals/referral-pathway-for-diabetic-retinopathy/. The college's own copyright/permissions terms for reproducing the pathway's bands were not read this session. | a clinical lead in Australia, with the national source named |
| `au-oncology-care-pathway` | Medical oncology | A link to the national Optimal Care Pathway for the patient's cancer type (one per cancer, each setting the expected steps from presentation to survivorship/end-of-life) — a genuinely Australian resource with no equivalent elsewhere in this product. Read 2026-10-13: Cancer Australia, "Optimal Care Pathways", https://www.canceraustralia.gov.au (health-professionals pages per cancer type, e.g. breast, ovarian, endometrial, bowel). Cancer Australia's own copyright terms (https://canceraustralia.gov.au/copyright) were found to exist but were not read in enough depth this session to state a licence state with confidence. | a clinical lead in Australia, with the national source named |
| `au-anaesthesia-fasting` | Anaesthesia | Pre-anaesthesia fasting times (clear fluids, breast milk, formula/solids) by the college's own current table, plus its breastfeeding and smoking advice — distinct from the kit's own generic pre-operative checklist (asa-preop), which carries no times of its own. Read 2026-10-13: ANZCA, the region's anaesthesia college, "PG07 Appendix 1 — Fasting guideline" (2024 update), https://anzca.edu.au/getattachment/897f5bf5-b665-4c99-a56f-e72678f19f7e/PG07-Appendix-1-–-Fasting-guideline-2024. The college's own copyright/reproduction terms were not read this session. | a clinical lead in Australia, with the national source named |
| `au-rehab-outcome` | Rehabilitation medicine | The Functional Independence Measure (FIM), the outcome measure the region's rehabilitation medicine actually benchmarks against nationally — different content from the kit's own session-plan, pain-scale (ODI) and home-exercise slots, none of which measure function. Read 2026-10-13: University of Wollongong, Australasian Rehabilitation Outcomes Centre (AROC), "What is the FIM and WeeFIM instrument?", https://www.uow.edu.au/ahsri/aroc/fim-weefim/. FIM ITSELF IS A LICENSED INSTRUMENT, RESTRICTED TO CLINICIANS WHO HAVE COMPLETED ITS TRAINING, of the Uniform Data System for Medical Rehabilitation (UDSMR), administered overseas: no item is reproduced here, and a clinician who holds that training must confirm the licence before any score is shown. | a clinical lead in Australia, with the national source named |
| `au-fracture-risk` | Endocrinology | Which absolute-fracture-risk calculator this product uses for Australia: RACGP's own clinical guideline discusses BOTH FRAX (University of Sheffield) and the Garvan nomogram (Garvan Institute of Medical Research, Sydney) without the two tools agreeing with each other ("Australia's absolute fracture risk calculators 'don't tally'", read 2026-10-13, https://www.ausdoc.com.au/news/australias-absolute-fracture-risk-calculators-dont-tally/; RACGP, "Assessment of absolute fracture risk", https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/osteoporosis/risk-factors/assessment-of-absolute-fracture-risk, both read 2026-10-13). An endocrinologist must choose one (or show both with the same honest caveat this pack already uses for its growth-chart reference) before this is built; EITHER tool's own terms for embedding its algorithm in a product were not read this session. | a clinical lead in Australia, with the national source named |

## Intake form — what it does not ask (18 slots)

| Slot | What is missing | What the form asks today | Waits on |
|---|---|---|---|
| `red_flag_checklists` | Per role: the list of "red flag" symptoms a patient selects before a visit, and the sentence that tells a patient who selects one what to do now (which service to call, and its number). A triage rule and an instruction to a patient: both are clinical content, and the service and its number are Australia's. | A machine-written checklist on each role. The help line is the country's own emergency sentence, including its number. Pending a local clinician. Not a signed triage rule. | a local clinical lead |
| `self_harm_screening` | The safety (self-harm) screening question in wording a clinician of Australia has chosen, and the clinic's procedure for a "yes" given on a form nobody is watching (who is told, how fast, which crisis service is named). | Psychiatry and clinical psychology ask one safety question about thoughts of suicide or self-harm in the last two weeks. The help line uses the country's emergency sentence and says a clinician reviews the answer. The clinic's procedure for a yes on an unattended form is still missing. | a local clinical lead |
| `validated_questionnaires` | Published questionnaires and scores (for example PHQ-9, GAD-7, IPSS, CAT, MIDAS, BASDAI, ODI, M-CHAT-R/F, DLQI). THE LICENCE QUESTION: each belongs to its authors or a rights holder; whether, on which terms and at what cost its original English wording may be shown inside a commercial product must be answered for each instrument before one item is displayed. None of their item wording is reproduced here. | Plain questions only. Pain is asked as a number from 0 to 10 with its two ends described in words; nothing is scored or summed. | the rights holder of each questionnaire, through the owner |
| `vaccination_checklist` | The vaccination schedule of Australia as a checklist (which vaccine at which age), so that a parent can mark what was given. | One question: "are the vaccinations up to date, as far as you know?" — yes, no, I do not know. Paediatrics adds a line asking to bring the vaccination record. | a local clinical lead |
| `development_milestones` | The developmental milestone checklist in use in Australia, by age. | One yes/no question: whether the parent is worried about the child's development, with a free-text line. | a local clinical lead |
| `screening_programme` | The screening and check-up programmes of Australia by age and sex (which tests, how often), to ask which of them the patient has had. | Free text: "tests or check-ups in the last year" and "when was the last full check-up". No test is named as due. | a local clinical lead |
| `antenatal_schedule` | The antenatal visit and screening schedule followed in Australia, and the fields of any pregnancy record a clinic must keep. | The week of pregnancy, the number of pregnancies and births, the first day of the last period. Nothing is derived from them. | a local clinical lead |
| `preoperative_instructions` | Pre-operative instructions a form would ask the patient to confirm (fasting times, which medicines to stop and when) and the consent form the law of Australia requires. | Nothing is instructed and nothing is confirmed. The sets ask about earlier anaesthetics, a tendency to bleed and blood-thinning medicines (name as free text). | a local clinical lead |
| `imaging_safety_checklist` | The safety checklist before imaging with contrast or a magnet, as used in Australia (which implants and conditions, in which wording), and what a "yes" means for the examination. | Four plain yes/no questions with a free-text line: an earlier reaction to contrast, metal or a fitted device, a known kidney problem, fear of closed spaces. The form decides nothing from them. | a local clinical lead |
| `medicine_lists` | Medicines authorised in Australia with the names they are sold under there, to offer as choices (blood thinners, inhalers, diabetes and heart medicines). A medicine has different names in different English-speaking countries; none is written by a machine. | Free text everywhere: the patient writes the name as they know it. No medicine, brand or dose is named. | a local clinical lead |
| `registered_procedures` | Cosmetic procedures, products and devices authorised in Australia, to offer as choices. | Free text: "which treatment, and when". No product or device is named. | a local clinical lead |
| `sports_clearance` | Any pre-participation medical clearance form required for athletes in Australia, and the anti-doping declaration. | The sport, the reason for the visit, injuries in the last year, symptoms during exercise, an earlier heart examination. | a local clinical lead |
| `hearing_programme` | The newborn hearing screening programme of Australia and the hearing-loss grading in use there. | Which ear, how the hearing went down, noise at work, a hearing aid. Nothing is graded. | a local clinical lead |
| `nutrition_reference` | Nutrient reference values and food composition tables of Australia, and named diets to offer as choices. | Meals and glasses of water a day as numbers, the diet followed and foods not eaten as free text. | a local clinical lead |
| `birth_weight_unit` | How a parent in Australia states a birth weight (grams, or pounds and ounces), so that it can be asked as a number with its unit. The kit's weight measure is kilograms or decimal pounds and fits neither. | Free text: "weight at birth, with its unit, as you know it". Nothing is calculated from it. | a local clinical lead |
| `payer_and_insurance` | Whether the form should ask who pays (a public programme, an employer, an insurer) and which numbers that needs in Australia. | The country adds its own payer and identifier section. Draft wording, pending a local source and a lawyer. No identity number of another country is asked. | the owner, with a local source |
| `consent_sentence` | The consent sentence shown before the first question, and the notice a parent or guardian reads, in wording a lawyer in Australia has approved (checklist I1, I2); and whether a guardian's identity must be confirmed. | A machine-written draft sentence, stamped as a draft and marked as not read by a lawyer, plus acknowledgement questions the country adds. Still not read by a lawyer. The guardian form asks the guardian's name, relationship and phone, and confirms nothing. | a lawyer |
| `scope_of_practice` | What each allied profession may ask, record and decide without a doctor under the law of Australia. | The sets ask about the problem, daily life and a doctor's referral; none asks for a diagnosis to be made. | a lawyer |

## The checklist

Every gate is unticked: a gate is ticked by a person, with a name and a date. The line under a gate says where this pack stands today.

## Rules that stop one country leaking into another

- [ ] 1. Türkiye is a country pack like any other; nothing Türkiye-specific stays in the core.
  - The pack holds nothing of Türkiye; the walls and the leak scan run for it (`npm run test:ulke`).
- [ ] 2. No fallback between countries: a missing item hides the feature.
  - Nothing falls back: the pack check finds nothing missing, and a tool this country does not have is a slot, not another country's tool.
- [ ] 3. Every tool, form, reference and feature declares the countries it is valid in; new ones start off everywhere except where they were built.
  - Every tool is classified (base, or these roles) and 19 tool(s) of the shared English set are kept off for this country (below).
- [ ] 4. The account carries its country and language, set at sign-up from that country's landing page.
  - As in the kit: country and language are stamped at sign-up. One language form, `en-AU`.
- [ ] 5. Ayşe answers only from the account's country pack and says so when no national source exists.
  - The assistant in text and voice is not part of a country build. No assistant is named.
- [ ] 6. Each country has its own deployment and its own database; no country script is ever run on another country's database or on the Turkish one; every country row still carries its country's code and no read or write crosses countries; a build contains only its own pack.
  - One pack per build: built with `NOTYA_COUNTRY=au npm run build:ulke`, proven on the output. NO DATABASE EXISTS for this country (section M).
- [ ] 7. An automated leak test scans every screen, note, answer, message and PDF for another country's terms.
  - The leak scan runs over every screen of this pack for the terms of every other country, the other English-speaking countries included (countries/au/sizintiTerimleri.ts states this country's).
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
  - NOT ANSWERED — for a lawyer. A draft sentence. Recording a consultation is governed by state and territory law, which differs.
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
  - MACHINE-WRITTEN. 44 core questions and 412 role questions, read by no clinician of this country.
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
  - One form, `en-AU`: the spelling is made from the set's base by the spelling table (countries/_dil/en/sozluk.ts). No native editor has read it.
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
  - Unit check done by test for every switched-on tool (countries/au/au.test.ts); a clinician has not read them.
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
  - UNVERIFIED. Label "Medicare number". Whether a private clinic should record it in this product at all is unverified.
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
  - NOT DONE — for a lawyer. 16 as a starting value. Consent of minors differs by state and territory.
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
  - DRAFTS, UNREAD. Pages: /privacy, /terms, /cookies, /data-request, /accessibility, /medical-disclaimer, /security, and /.well-known/security.txt. Addresses: privacy@, support@, security@, legal@, billing@, hello@notya.io. for a lawyer.
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
