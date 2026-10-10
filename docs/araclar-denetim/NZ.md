# New Zealand (`nz`): doctor tools and specialties, checked one by one

Written 2026-10-10. Research and decisions only: no product code, pack file, test or kit file was changed. The same decisions as data are in `docs/araclar-denetim/nz-kararlar.json`.

## The answer in one paragraph

The New Zealand build shows **42 tools** today and holds another **58 as switched-off placeholders or unused kit screens** (100 in all). Checked against New Zealand sources read today: **13 can stay as they are, 26 need a change, 1 should be removed** (the American ESI triage record: emergency departments here use the Australasian Triage Scale), and **60 could not be checked against any New Zealand source** and wait for a local clinician. Most of those 60 are the product's own checklists, which have no national source to be checked against. Three tools that are switched on today give a result that would be wrong or misleading here: the **return-to-sport stages** (they do not match ACC's national concussion guideline and carry none of its minimum stand-down days), the **EASI eczema score** (wrong for a child under 8) and the **antibiotic day counter** (its "last day" may be one day late). The list is also aimed at the wrong doctors: **general practice, the largest group in private outpatient practice, sees no tool at all** beyond the patient's page, and neither do 17 other roles. New Zealand has national tools of its own that the product lacks or describes wrongly, above all its **five-year cardiovascular risk equations**, which take the patient's ethnicity and a deprivation score as inputs. I propose a **core set of 17** for every doctor and **23 specialty tools**. On specialties: of the 30 doctor roles, **24 keep their name, 6 should be renamed** to the Medical Council's wording, **none is removed, and 9 recognised scopes are missing** (urgent care medicine first). Of the 10 clinic roles, 8 stay, 1 is renamed, 1 is unverified, and 7 regulated professions are missing.

**How to read the verdicts.** *Keep*: used here as it stands, on a source read today. *Revise*: used here, but something must change. *Remove*: not used here. *Unverified — needs a local clinician*: no New Zealand source could be read for it; where I have a leaning, it is written as a leaning and is not a decision. Every source was read on 2026-10-10 unless it says "earlier audit" (read 2026-10-09 by the localisation audit on branch `audit/nz`, which is not merged). A page read by a machine is a source check, not a clinician's confirmation. Nothing here says the product meets any law or standard.

---

## Part 1 — every existing tool

"Who sees it" uses the role names of the build. *Base* means every role. A *slot* is a named, empty, switched-off placeholder: no screen shows it.

### 1a. Switched on today (42)

| Key | Name on screen | Who sees it | Verdict | Why, and what changes | Source |
|---|---|---|---|---|---|
| `hasta-portali` | Patient's page | base | **keep** | No clinical content. | — |
| `takip-paneli` | Follow-up list | 22 roles that have a tool of their own | **keep** | No clinical content. General practice and 17 other roles do not get it, because they have no tool. | — |
| `kritik-yol` | Critical conditions checklist | Emergency medicine | unverified | The product's own list. Leaning: keep; also for urgent care. | [stroke guideline summary][stroke] |
| `asa-preop` | ASA class and pre-operative checklist | Anaesthesia | unverified | The pre-anaesthesia guideline that applies here (ANZCA PG07) does not name the ASA class. Whether anaesthetists here record one was not confirmed. Leaning: keep. | [ANZCA PG07][anzca] |
| `hava-yolu-notu` | Airway note | Anaesthesia | unverified | The product's own list. Leaning: keep. | [ANZCA PG07][anzca] |
| `postop-agri` | Post-operative pain follow-up | Anaesthesia | unverified | The product's own list. Leaning: keep. | — |
| `noro-postop` | Checklist after a neurosurgical operation | Neurosurgery | unverified | The product's own list. Leaning: keep. | — |
| `nobet-bilinc` | Seizure and consciousness follow-up | Neurosurgery | unverified | The product's own list. Leaning: keep. | — |
| `cocuk-prepost-op` | Checklist before and after an operation | Paediatric surgery | unverified | The product's own list; the consent item is a legal question. Leaning: keep. | — |
| `yara-dren-izlem` | Wound, drain and stitches follow-up | Paediatric surgery, General surgery | unverified | The product's own list. Leaning: keep. | — |
| `genel-preop` | Pre-operative checklist | General surgery | unverified | The product's own list. Leaning: keep. | — |
| `pasi` | PASI score | Dermatology | **revise** | Arithmetic matches DermNet. The three bands (mild, moderate, severe) have no source. Add the DLQI beside it (licence first). Show it to the clinic dermatology role. | [DermNet][pasi], [Pharmac][pharmac26] |
| `easi` | EASI score | Dermatology | **revise** | **Wrong for a child under 8** (see below). Bands have no source. | [DermNet][easi] |
| `scorad` | SCORAD index | Dermatology | **revise** | Formula matches DermNet. Bands have no source. | [DermNet][scorad] |
| `yama-okuma` | Patch test: reading days | Dermatology | unverified | Date arithmetic; local reading days not read from a source. Leaning: keep. | — |
| `rejim-karti` | Insulin and thyroid treatment: date card | Endocrinology | unverified | Dates only. Leaning: keep. | — |
| `antibiyotik-sure` | Antibiotic course: counting days | Infectious diseases | **revise** | **"Last day" may be one day late** (see below). Most courses are prescribed in general practice and urgent care: widen who sees it. | — (the code) |
| `toraks-preop` | Checklist before a chest operation | Thoracic surgery | unverified | The product's own list. The role is not a New Zealand scope (Part 3). Leaning: keep. | [MCNZ][mcnz] |
| `toraks-tup-yara` | Chest drain and wound follow-up | Thoracic surgery | unverified | The product's own list. Leaning: keep. | — |
| `inhaler-teknik` | Inhaler technique | Respiratory medicine | **revise** | Used here: technique is checked at each consultation in primary care. Show it to general practice too. The steps were read by no clinician. | [bpacnz COPD][copd] |
| `gorme-keskinligi` | Visual acuity: logMAR | Ophthalmology | **keep** | A mathematical conversion. New Zealand writes acuity as 6/x; the tool accepts it. | [NZTA guide][nzta] |
| `kalp-damar-preop` | Checklist before a heart or vascular operation | Cardiac and vascular surgery | unverified | The product's own list. Heart and vessel surgery are two scopes here. Leaning: keep. | [MCNZ][mcnz] |
| `greft-yara-izlem` | Vascular graft and wound follow-up | Cardiac and vascular surgery | unverified | The product's own list. Leaning: keep. | — |
| `antikoagulan-vadeleri` | Antithrombotic treatment: review dates | Cardiac and vascular surgery | unverified | Dates only. Leaning: keep. | — |
| `odyometri-pta` | Pure-tone audiometry: average threshold | Otolaryngology | unverified | The six-grade scale was found in no New Zealand source. ACC uses a different measure for claims (percentage loss of hearing). The audiologist role does not see this tool. | [ACC hearing][hearing] |
| `otoskopi-notu` | Otoscopy note | Otolaryngology | unverified | The product's own list. Leaning: keep. | — |
| `vertigo-notu` | Vertigo: positional test note | Otolaryngology | unverified | States a clinical rule of its own; a local clinician must read it. | — |
| `diyaliz-seans` | Dialysis session and next date | Nephrology | unverified | Dates only. Leaning: keep. | — |
| `kur-sayaci` | Treatment cycle counter | Oncology | unverified | A counter. The national library of regimen names is not used. Leaning: keep. | [Cancer agency][actnow] |
| `toksisite-listesi` | Side effects checklist | Oncology | unverified | The product's own list. Leaning: keep. | — |
| `kirik-alci-takip` | Fracture, cast and brace follow-up | Orthopaedic surgery | unverified | The product's own list. Leaning: keep. | — |
| `ortopedi-op-protokol` | Post-operative checklist | Orthopaedic surgery | unverified | The product's own list. Leaning: keep. | — |
| `vas-fonksiyon` | Pain and function rating | Orthopaedic surgery | unverified | Prints mild / moderate / severe from a formula of the product's own. Leaning: drop the grade, keep the scores. | — (the code) |
| `hedef-boy` | Expected height from the parents' heights | Paediatrics | **revise** | **Not the method of the national growth charts** (see below). | [Growth fact sheet 6][growth6] |
| `doz-hesabi` | Dose arithmetic by body weight | Paediatrics | **revise** | Arithmetic is right. Milligrams only; children here are mostly seen outside paediatrics. | [NZ Formulary][nzf] |
| `plastik-yara-greft` | Wound, graft and flap follow-up | Plastic surgery | unverified | The product's own list. Leaning: keep. | — |
| `tetkik-kuyrugu` | Examination queue | Radiology | unverified | The product's own list. Leaning: keep. | — |
| `das28` | DAS28 disease activity score | Rheumatology | unverified | **Arithmetic not checked** (search allowance ran out). Units fit. Funding criteria here use joint counts, not DAS28. | [Pharmac RA][pharmacra] |
| `eklem-28` | 28-joint count | Rheumatology | **revise** | No ankles or hips, which Pharmac's criteria name. Add a full joint count. | [Pharmac RA][pharmacra] |
| `psa-hizi` | Prostate-specific antigen: rate of change | Urology | **revise** | Unit right (µg/L). The national guidance uses age-banded thresholds and a repeat at 6 to 12 weeks; the tool's caution fires on that repeat. | [Ministry 2015][psa], [bpacnz][bpacpsa] |
| `rtp-basamak` | Stages of return to sport | Sport and exercise medicine | **revise** | **Does not match the national concussion guideline** (see below). | [ACC][concussion] |
| `sakatlik-gunlugu` | Injury log | Sport and exercise medicine | unverified | The two load limits were found in no New Zealand source. Leaning: keep. | — |

### 1b. Kept switched off by the New Zealand pack itself (4)

| Key | Name | Who would see it | Verdict | Why | Source |
|---|---|---|---|---|---|
| `esi-triyaj` | ESI triage level | Emergency medicine | **remove** | Not used here. Emergency departments use the Australasian Triage Scale, five categories. | [Health NZ][triage] |
| `kdigo-evre` | Chronic kidney disease: KDIGO categories | General medicine | **revise** | Keep off until fixed: confirmed unit fault, and referral prompts that are not New Zealand's (see below). | [bpacnz CKD][ckd] |
| `kdigo-serit` | KDIGO grid: GFR and albuminuria | Nephrology | **revise** | Keep off: the same unit fault. | [bpacnz CKD][ckd] |
| `rapor-taslagi` | Structured report outline | Radiology | **revise** | Offers BI-RADS 0 to 6. The national breast-screening programme grades 1 to 5 on its own scale. The category list must be the country's. | [BreastScreen standards][bsa] |

### 1c. Placeholders whose mechanism is already built (8)

| Key | What it is | Who | Verdict | Why | Source |
|---|---|---|---|---|---|
| `lab-izlem` | HbA1c and TSH follow-up | Endocrinology | **revise** | **Unusable here as built**: it refuses HbA1c values outside the per-cent scale, and New Zealand reports mmol/mol. | [Diabetes society][nzssd] |
| `ibd-skor` | Bowel disease activity index | Gastroenterology | **revise** | Offers the Mayo score; criteria here use CDAI, Harvey-Bradshaw and SCCAI. | [Pharmac][pharmacada] |
| `dxa-tekrar` | Bone density scan repeat | Endocrinology | unverified | The source read gives no repeat interval. | [Osteoporosis NZ][dxa] |
| `anemi-izlem` | Anaemia in kidney disease | Nephrology | unverified | No source. A trap in the kit: limits would have to be typed in g/dL though laboratories here report g/L. | — |
| `iltihap-lab-izlem` | CRP and ESR follow-up | Rheumatology | unverified | Units fit; no source for bands. | [Pharmac][pharmacada] |
| `viral-izlem`, `kardiyo-izlem`, `hepatit-izlem` | Follow-up intervals | Infectious diseases; Cardiology; Gastroenterology | unverified | No New Zealand source read for the numbers. | — |

### 1d. Placeholders with nothing built (44)

| Verdict | Slots | Note |
|---|---|---|
| **keep** as a slot (10) | `prescription`, `medicine-interactions`, `end-of-visit`, `family-vaccination-screening`, `family-chronic`, `family-follow-up-panel`, `basdai`, `stroke-red-flags`, `development-screening`, `paediatric-follow-up-panel` | The New Zealand content each waits for exists and is named in the data file (for example the Immunisation Handbook 2024, version 4; the BASDAI, on which Pharmac's criteria are written). |
| **revise** the slot (10) | `cardiovascular-risk`, `notifiable-diseases`, `diagnosis-coding`, `patient-certificates`, `anticoagulation-review`, `cat-mmrc`, `contraception-eligibility`, `growth-percentiles`, `vaccination-schedule`, `phq9-gad7` | The slot describes the wrong thing for New Zealand, or names the wrong doctors. Details below and in the data file. |
| unverified (24) | `visit-summary-document`, `test-requests`, `emergency-referral`, `family-referral`, `child-surgery-consent`, `polypharmacy`, `isotretinoin-pregnancy-prevention`, `lung-action-plan`, `pregnancy-calendar`, `maternity-leave`, `obstetric-risk`, `obstetric-follow-up-panel`, `midas`, `antiseizure-monitoring`, `mchat-rf`, `plastic-surgery-consent`, `psychiatry-safety-triage`, `psychotropic-monitoring`, `critical-finding-notice`, `ipss`, `urology-emergency-triage`, `rehabilitation-session-plan`, `pain-odi`, `home-exercise` | No New Zealand source was read. Three are legal questions (the two consent slots and maternity leave). |

The slots that need the most change:

- **`cardiovascular-risk`** speaks of "ten-year" risk. New Zealand uses **five-year** risk from its own equations, and general practice, its main user, is not among the slot's roles. Sources: [HISO 10071:2025][hiso], [bpacnz 2018][bpaccvd].
- **`notifiable-diseases`** is given to infectious-diseases specialists only. The duty to notify rests on health practitioners in general, on a well-founded suspicion. It should be base. Source: [Ministry of Health summary][notifiable].
- **`diagnosis-coding`** should name both systems that matter here: SNOMED CT (earlier audit) and the Read code an ACC claim asks for. Source: [ACC][acc].
- **`patient-certificates`** should name the three certificates doctors here write: ACC's work certificate (ACC18), Work and Income's work-capacity certificate, and the driver-licence medical certificate (DL9). Sources: [ACC][acc], [Work and Income][wcmc], [NZTA guide][nzta].

### 1e. In the kit but not in the New Zealand build (2)

| Key | Name | Verdict | Why |
|---|---|---|---|
| `sablonlarim` | My templates | **revise**: switch on | No clinical content; the pack simply does not list it. |
| `konsultasyonlar` | Consultations | unverified | A legal question (sharing a note with a colleague, and the consent sentence): for a lawyer, not a clinician. |

### Tools whose result would be wrong or misleading here

**Switched on today:**

1. **Return to sport (`rtp-basamak`).** ACC's national guideline (updated January 2026) has six stages numbered 1 to 6 and ties the last two to minimum days counted from the injury (the document gives day 14 for sport-specific training and day 21 for competition as the earliest). The tool has stages 0 to 5 with different names, asks for no injury date and knows no minimum. A doctor can record "full training and return to competition" two days after a concussion and nothing on the screen recalls the national stand-down. Source: [ACC guideline][concussion].
2. **EASI (`easi`).** The code uses one set of body-region weights. DermNet gives different weights for the head and neck and for the lower limbs in children aged 0 to 7. The tool has no age field; it mentions the limit only in its description. For a young child the total is wrong. Source: [DermNet][easi].
3. **Antibiotic day counter (`antibiyotik-sure`).** The code adds the number of days to the start date and calls the result "Last day of the course". If the start date is the first day of treatment, a seven-day course from the 1st ends on the 7th; the tool shows the 8th. This is in the shared kit, so it affects every country. A clinician must say which convention is meant; then the arithmetic or the label changes.
4. **PASI, EASI and SCORAD bands.** Each prints "mild", "moderate" or "severe". The arithmetic of each score matches DermNet; the band limits were found in no source read, and DermNet gives none.
5. **Expected height (`hedef-boy`).** The health ministry's growth-chart fact sheet predicts adult height from the child's own height centile. The tool uses a mid-parental formula with fixed numbers that no New Zealand source read states. The figure may differ from what the national chart gives.
6. **PSA rate of change (`psa-hizi`).** The arithmetic is right, but the caution "less than 90 days apart" appears on exactly the 6-to-12-week repeat test the national guidance asks for.
7. **Pain and function (`vas-fonksiyon`).** A grade from a formula nobody has published.
8. **28-joint count (`eklem-28`).** Correct as a 28-joint count; misleading if a doctor takes it for the joint count Pharmac's criteria ask for, which include ankles and hips.

**Switched off, and must stay off until fixed:**

9. **The two KDIGO tools.** Confirmed against bpacnz: the ratio is reported in mg/mmol and the categories are cut at 3 and 30. The kit converts to another unit and cuts at its own limits, so a value from 3.0 to about 3.3, or from just above 30 to about 33.9, lands one category too low. The internal-medicine tool also prints "KDIGO criterion for referral to a nephrologist" lines that are not the criteria bpacnz lists for New Zealand.
10. **HbA1c follow-up (`lab-izlem`).** Refuses every value outside 3 to 20. New Zealand values are in mmol/mol and sit far above 20.
11. **Anaemia follow-up (`anemi-izlem`).** The numbers a country states are compared in g/dL. Typed as New Zealand writes them (g/L), every limit would be ten times too high.

---

## Part 2 — what to add, and New Zealand's core set

No formula or cut-off is written here from memory. "Formula source" says where it is published; where I could not fetch the publication, it says so.

### 2a. The core set: 17 tools every doctor here should see

| # | Tool | State today | National source | Licence position |
|---|---|---|---|---|
| 1 | Patient's page (`hasta-portali`) | on | — | the kit's own |
| 2 | Follow-up list (`takip-paneli`) | on for 22 roles | — | the kit's own |
| 3 | My templates (`sablonlarim`) | in the kit, not switched on | — | the kit's own |
| 4 | Consultations (`konsultasyonlar`) | in the kit, not switched on | a lawyer first | the kit's own |
| 5 | Prescription drafting (`prescription`) | slot | Universal List of Medicines (earlier audit) | **needs permission**: terms of commercial use not stated |
| 6 | Visit summary document | slot | not found | unclear |
| 7 | Diagnosis coding | slot | SNOMED CT; Read codes for [ACC][acc] | **needs permission** |
| 8 | Medicine interactions | slot | [New Zealand Formulary][nzf] | **licence needed** (all rights reserved) |
| 9 | Certificates for patients | slot | [ACC][acc], [Work and Income][wcmc], [NZTA][nzta] | forms belong to the three agencies |
| 10 | Test requests | slot | not found | unclear |
| 11 | End-of-visit flow | slot | — | — |
| 12 | Notifiable disease prompt (`notifiable-diseases`, made base) | slot | [Ministry summary][notifiable]; the list is in the Health Act 1956 | legislation; terms not read |
| 13 | **New:** kidney function — estimated GFR and creatinine clearance, creatinine in µmol/L | absent | [bpacnz CKD][ckd], [bpacnz AF][af] | published equations; publications not fetched; **unclear**, usually free |
| 14 | **New:** ACC injury claim checklist | absent | [ACC][acc] | **needs permission**; a state-system tool, New Zealand only |
| 15 | **New:** Work and Income work-capacity certificate: what it records | absent | [Work and Income][wcmc] | **needs permission**; a state-system tool, New Zealand only |
| 16 | **New:** fitness to drive and the DL9 certificate | absent | [NZTA guide][nzta] | **free with attribution** (CC BY 4.0); the form is the agency's |
| 17 | **New:** body mass index and waist | absent | guideline could not be read | **unverified** |

Only the first of these works for every doctor today.

### 2b. Specialty tools doctors here expect and the product lacks (23)

| Tool | Who | National source | Formula source | Licence position |
|---|---|---|---|---|
| **New Zealand cardiovascular risk**, five-year (fills `cardiovascular-risk`) | General practice, General medicine, Cardiology, Endocrinology, Nephrology, longevity clinics | [HISO 10071:2025][hiso]; [2018 consensus statement][cvd18] | the standard itself; it cites Pylypchuk et al., Lancet 2018 | **free with attribution** (CC BY 4.0) |
| Australasian Triage Scale record | Emergency medicine | [Health NZ][triage] | [ACEM][acem], policy P06 and guideline G24 | **unclear**: ask the college |
| New Zealand early warning score (adult) | hospital roles | [HQSC user guide][nzews] | same | **needs permission** (copyright, no licence) |
| Maternity early warning score | Obstetrics and gynaecology | [HQSC][mews] | same | **needs permission** |
| Paediatric early warning score | Paediatrics, Paediatric surgery, Emergency medicine | [HQSC][pews] | same | **not usable as licensed**: non-commercial only |
| Diabetes review: HbA1c in mmol/mol against the patient's own target | General practice, Endocrinology, General medicine | [Diabetes society][nzssd] | same | **needs permission** (all rights reserved) |
| Kidney disease categories in mg/mmol with local referral prompts | General practice, General medicine, Nephrology, Endocrinology | [bpacnz CKD][ckd] | KDIGO 2024 (the kit's citation) | **unclear** / permission for bpacnz text |
| Atrial fibrillation: stroke and bleeding risk scores | General practice, Cardiology, General medicine, Neurology | [bpacnz AF][af] | not fetched | **unclear** |
| Gout: urate against target | General practice, Rheumatology, General medicine | [bpacnz gout][gout] | same | permission for bpacnz tables |
| Sore throat: rheumatic fever risk pathway | General practice, Paediatrics, Emergency medicine | [Heart Foundation][rf] | [2019 algorithm][rfalgo]; a 2024 edition exists | **needs permission** |
| Cognitive screening record (Mini-ACE, GPCOG, RUDAS) | General practice, Psychiatry, Neurology, General medicine, Rehabilitation medicine | [Dementia Foundation][miniace], [bpacnz][dementia] | not fetched | **unclear**; MoCA is **paid** (do not add) |
| HoNOS family and ADOM | Psychiatry | [Te Pou][honos], [ADOM][adom] | not fetched | **unclear** |
| Strengths and Difficulties Questionnaire score | Paediatrics, General practice | [B4 School Check][b4sc] | not fetched | **unclear**: expect a licence |
| Dermatology Life Quality Index | Dermatology | [Pharmac][pharmacada] | not fetched | **unclear**: expect a licence |
| Bowel disease indices used here (CDAI, Harvey-Bradshaw, SCCAI; children's versions) | Gastroenterology, Paediatrics | [Pharmac][pharmacada] | not fetched | **unclear** |
| Full swollen and active joint count | Rheumatology | [Pharmac RA][pharmacra] | a count, no formula | **free** |
| Concussion: graduated return, six stages with days | Sport and exercise medicine, General practice, Emergency medicine, Paediatrics | [ACC][concussion] | same | **needs permission** |
| Percentage loss of hearing for an ACC claim | Otolaryngology, Audiologist | [ACC][hearing] | the 1999 regulations (not fetched) | **unclear**; a state-system tool |
| Diabetic retinal screening grade | Ophthalmology | [Ministry 2016][retinal] | grading table not read | **needs permission** (copyright with a non-Crown party) |
| PSA: age-banded thresholds and referral urgency | Urology, General practice | [Ministry 2015][psa] | same | **free with attribution** (CC BY 4.0) |
| Breast screening lesion category 1 to 5 | Radiology | [BreastScreen standards][bsa] | same | **unclear** |
| Stroke severity record (NIHSS) | Neurology, Emergency medicine | [stroke guideline][stroke] | not fetched | **unclear** |
| National regimen names for the cycle counter | Oncology | [Cancer agency][actnow] | same | **needs written permission** |

**A caution about funding criteria.** Several scores above matter here because Pharmac writes its funding criteria on them. A tool that tells a doctor whether a patient *meets* those criteria would be a tool of New Zealand's payer system. The kit forbids such tools of one country from appearing in another. Build the scores; do not build an "eligible / not eligible" answer without the owner's decision and a lawyer.

### 2c. Māori and Pacific considerations in the national tools (reported as the sources state them, not interpreted)

- The cardiovascular equations take **ethnicity in five groups** (Māori; Pacific; Indian and other South Asian; Chinese and other Asian; European and other) and a **deprivation quintile** as inputs. [HISO 10071:2025][hiso]
- Risk assessment starts at a **younger age** for Māori, Pacific and South Asian people; the diabetes society ties an HbA1c test to every assessment. [bpacnz 2018][bpaccvd], [Diabetes society][nzssdscreen]
- The sore-throat algorithm counts **Māori or Pacific ethnicity** among its criteria for high risk of rheumatic fever, with an age band and household circumstances. [Heart Foundation 2019][rfalgo]
- bpacnz advises a **lower threshold for referral** in kidney disease for Māori and Pacific patients, and reports higher rates of kidney disease and gout and earlier atrial fibrillation in these groups, and higher COPD admission rates for Māori. [bpacnz CKD][ckd], [gout][gout], [COPD][copd], [AF][af]
- The 2015 prostate guidance reports worse outcomes for Māori men after diagnosis and attributes them mainly to access. [Ministry 2015][psa]
- A cognitive screen built for Māori was in development when bpacnz wrote in 2020. [bpacnz][dementia]
- The product records neither ethnicity nor deprivation today. How ethnicity is asked and stored is a matter for a local clinical lead and a lawyer (the earlier audit lists Māori data sovereignty among its legal questions).

---

## Part 3 — specialties and clinic specialties

The official list is the Medical Council of New Zealand's **36 vocational scopes** ([source][mcnz]). The build offers the 40 role keys all five English-speaking countries share: 30 doctor specialties, 5 clinic doctors and 5 allied professions.

### 3a. The 30 doctor roles

| Role key | Name shown now | Verdict | Official name | Tools it should see |
|---|---|---|---|---|
| `emergency-medicine` | Emergency medicine | keep | Emergency medicine | critical conditions checklist; Australasian Triage Scale; early warning scores; stroke severity; concussion return; sore throat pathway; dose arithmetic |
| `family-medicine` | General practice | keep | General practice | **none today.** Cardiovascular risk; diabetes review; kidney categories; atrial fibrillation scores; gout; sore throat pathway; cognitive screen; PHQ-9 and GAD-7; COPD test and inhaler technique; vaccination and screening; growth charts; contraception eligibility; PSA thresholds; dose arithmetic; antibiotic days; concussion return |
| `anaesthesia` | Anaesthesia | keep | Anaesthesia | its three tools; adult early warning score |
| `neurosurgery` | Neurosurgery | keep | Neurosurgery | its two tools |
| `paediatric-surgery` | Paediatric surgery | keep | Paediatric surgery | its two tools; paediatric early warning score; dose arithmetic |
| `internal-medicine` | General medicine | **rename** | **Internal medicine** | none today. Kidney categories; cardiovascular risk; diabetes review; atrial fibrillation scores; anticoagulation review; cognitive screen; gout |
| `dermatology` | Dermatology | keep | Dermatology | its four tools; DLQI |
| `endocrinology` | Endocrinology | keep | an area of Internal medicine | date card; diabetes review; cardiovascular risk; kidney categories |
| `infectious-diseases` | Infectious diseases | keep | an area of Internal medicine | antibiotic days; viral follow-up |
| `gastroenterology` | Gastroenterology | keep | an area of Internal medicine | none today. Bowel disease indices; hepatitis follow-up |
| `general-surgery` | General surgery | keep | General surgery | its two tools |
| `thoracic-surgery` | Thoracic surgery | **rename** | **Cardiothoracic surgery** | its two tools **and** the heart-operation checklist |
| `respiratory-medicine` | Respiratory medicine | keep | an area of Internal medicine | inhaler technique; COPD test; action plan |
| `ophthalmology` | Ophthalmology | keep | Ophthalmology | visual acuity; retinal screening grade |
| `obstetrics-gynaecology` | Obstetrics and gynaecology | keep | Obstetrics and gynaecology | none today. Its five slots; maternity early warning score |
| `cardiovascular-surgery` | Cardiac and vascular surgery | **rename** | **Vascular surgery** | graft follow-up; antithrombotic dates; operation checklist |
| `cardiology` | Cardiology | keep | an area of Internal medicine | none today. Cardiovascular risk; atrial fibrillation scores; anticoagulation review |
| `otolaryngology` | Otolaryngology, head and neck surgery | keep | Otolaryngology, head and neck surgery | its three tools; percentage loss of hearing |
| `nephrology` | Nephrology | keep | an area of Internal medicine | kidney categories; dialysis dates; anaemia follow-up |
| `neurology` | Neurology | keep | an area of Internal medicine | none today. Stroke slot and severity record; cognitive screen; atrial fibrillation scores |
| `oncology` | Oncology | **rename** | **Medical oncology** | its two tools; national regimen names |
| `orthopaedics` | Orthopaedic surgery | keep | Orthopaedic surgery | its three tools |
| `paediatrics` | Paediatrics | keep | Paediatrics | its two tools; growth charts; vaccination; development screening; paediatric early warning score; sore throat pathway |
| `plastic-surgery` | Plastic surgery | **rename** | **Plastic and reconstructive surgery** | its tool; consent slot |
| `psychiatry` | Psychiatry | keep | Psychiatry | none today. PHQ-9 and GAD-7; outcome measures; cognitive screen |
| `radiology` | Radiology | **rename** | **Diagnostic and interventional radiology** | examination queue; report outline with local categories |
| `rheumatology` | Rheumatology | keep | an area of Internal medicine | DAS28; joint counts; BASDAI; gout |
| `urology` | Urology | keep | Urology | PSA rate of change and thresholds; IPSS |
| `sports-medicine` | Sport and exercise medicine | keep | Sport and exercise medicine | concussion return; injury log |
| `rehabilitation-medicine` | Rehabilitation medicine | keep | Rehabilitation medicine | none today. Its three slots; cognitive screen |

Notes:

- **Eight roles are not registration scopes** (endocrinology, infectious diseases, gastroenterology, respiratory medicine, cardiology, nephrology, neurology, rheumatology). The council names each as an area inside the scope "Internal medicine". They are kept because physicians practise under those names; the product must never present them as a registration.
- **Three of the six renames are already made** on the branch `audit/nz` (Internal medicine; Plastic and reconstructive surgery; Diagnostic and interventional radiology). That branch is not merged.
- **Two renames need more than a name.** New Zealand joins heart and chest surgery in one scope and has vessel surgery as another. The shared role set divides them differently, so the heart-operation checklist must move with the rename.

### 3b. Recognised here and missing (9 to add)

| Official name | Why | Tools |
|---|---|---|
| **Urgent care medicine** | A scope particular to New Zealand | critical conditions checklist; sore throat pathway; dose arithmetic; antibiotic days; concussion return; fracture follow-up; cardiovascular risk |
| Musculoskeletal medicine | Outpatient work | pain and function; injury log |
| Occupational medicine | Outpatient work | percentage loss of hearing; the certificates |
| Pain medicine | Outpatient work | pain follow-up |
| Sexual health medicine | Outpatient work | contraception eligibility |
| Family planning and reproductive health | Outpatient work | contraception eligibility; pregnancy calendar |
| Palliative medicine | Outpatient and community work | core set only |
| Oral and maxillofacial surgery | Private surgical practice | pre-operative checklist; wound follow-up |
| Rural hospital medicine | A scope particular to New Zealand | as general practice and emergency medicine |

**Not verified:** how common each of these is in private outpatient practice. That part of the choice is a judgement for a local clinical lead. Six scopes are recognised and not proposed, because they are hospital-based or do not write visit notes: Clinical genetics, Intensive care medicine, Medical administration, Pathology, Public health medicine, Radiation oncology.

### 3c. The clinic list (10)

New Zealand has no official list of clinic types. The five clinic-doctor roles were compared with the council's scopes and its statement on cosmetic procedures; the five allied roles with the health ministry's list of regulated professions.

| Role key | Name shown now | Verdict | Official position | Source |
|---|---|---|---|---|
| `hair-transplant` | Hair transplantation | keep, as a clinic type | Not a specialty. The council's statement lists "hair replacement therapy" among non-surgical cosmetic procedures. | [MCNZ statement][cosmetic] |
| `aesthetic-surgery` | Cosmetic surgery | keep, as a clinic type | Not a specialty. Surgical cosmetic procedures are for doctors registered in a relevant surgical scope: the account should state that scope too. | [MCNZ statement][cosmetic] |
| `aesthetic-medicine` | Cosmetic medicine | keep, as a clinic type | Not a specialty. The statement names the New Zealand Society of Cosmetic Medicine. | [MCNZ statement][cosmetic] |
| `clinic-dermatology` | Dermatology (clinic) | **rename** | **Dermatology**: the same scope as the doctor role. It sees none of the dermatology tools today and should see all of them. | [MCNZ][mcnz] |
| `longevity` | Preventive and longevity medicine | unverified | Not a scope; no New Zealand body for it was read. The owner decides. | [MCNZ][mcnz] |
| `physiotherapy` | Physiotherapist | keep | Practice of physiotherapy (Physiotherapy Board) | [Ministry list][ra] |
| `clinical-psychology` | Clinical psychologist | keep | Practice of psychology (Psychologists Board) | [Ministry list][ra] |
| `dietetics` | Dietitian | keep | Practice of dietetics (Dietitians Board) | [Ministry list][ra] |
| `occupational-therapy` | Occupational therapist | keep | Practice of occupational therapy (Occupational Therapy Board) | [Ministry list][ra] |
| `audiology` | Audiologist | keep, flagged | **Not on the list of regulated professions.** What that means for access to a record is for a lawyer. | [Ministry list][ra] |

The council asks doctors who offer cosmetic procedures not to call themselves "specialist" without a matching vocational scope. None of the three cosmetic clinic types may ever be worded as a specialty or a qualification. A lawyer should read the three names.

**Regulated here and missing (7 to add):** nurse practitioner (Nursing Council), midwife (Midwifery Council), podiatrist, osteopath, chiropractor, optometrist, psychotherapist. ACC names physiotherapists, osteopaths, chiropractors and podiatrists among those who can lodge an injury claim; nurse practitioners can write ACC's work certificate and the Work and Income certificate. Sources: [Ministry list][ra], [ACC][acc], [Work and Income][wcmc]. Which of these the product should serve is the owner's decision.

No allied role sees any tool today. Proposed, for a local clinical lead to confirm: physiotherapist — pain and function, injury log, home exercise; clinical psychologist — PHQ-9 and GAD-7; dietitian — body mass index; occupational therapist — cognitive screen; audiologist — audiometry average and percentage loss of hearing.

---

## Licence and copyright, plainly

| Position | What |
|---|---|
| **Free to use with attribution** (CC BY 4.0) | the cardiovascular data standard and its equations; the 2018 cardiovascular consensus statement; the 2015 prostate guidance; the fitness-to-drive guide; the 2020 contraception guidance |
| **Not usable as licensed** | the paediatric early warning system: its licence forbids commercial use |
| **Needs written permission** | adult and maternity early warning scores (copyright, no licence); the national growth charts (copyright 2009 Royal College of Paediatrics and Child Health); ACC's concussion guideline; the Heart Foundation's rheumatic fever guideline; the stroke guidelines; the diabetes society's guidance; the anaesthetists' college guideline; the national regimen library; the retinal screening guidance; the New Zealand Formulary; the UK contraception criteria; the forms of ACC, Work and Income and the transport agency; the medicines list (terms not stated) |
| **Paid** | MoCA: no longer free since September 2020; training and certification are paid (bpacnz) |
| **Unclear: the owner's terms were not read** | PHQ-9, GAD-7, CAT, DLQI, BASDAI, IPSS, MIDAS, the Oswestry index, M-CHAT-R/F, the Strengths and Difficulties Questionnaire, the Mini-ACE, HoNOS, ADOM, NIHSS, BI-RADS, the Australasian Triage Scale, FRAX, the Garvan calculator, the KDIGO grid |

## What the kit cannot do yet for New Zealand alone

To apply these decisions to New Zealand without touching the other four English-speaking countries, the shared kit is missing:

1. **A country cannot change who sees a tool.** The roles sit on the shared English text. A pack can only switch a tool off or reword it.
2. **A country cannot add, drop or re-divide a role.** All five packs take the same 40 keys, and a test requires exactly forty.
3. **A country cannot bring a tool or a slot of its own.** Every tool must be in the catalogue all countries share.
4. **No list keeps New Zealand's state-system tools out of other countries.** The forbidden-tools file has entries for Türkiye only.
5. **Limits can only be applied in the kit's own unit.** A country whose published limits are in another unit cannot state them (the kidney tools).
6. **HbA1c has no unit choice**, and the numbers a country states are compared in the kit's unit without saying so (haemoglobin).
7. **The options of a choice are fixed in the kit**: report categories and return-to-sport stages cannot be the country's.
8. **Dose arithmetic knows one unit**, and the citation under a result cannot be the country's source.
9. **The patient file has no ethnicity and no deprivation score**, both needed by the national cardiovascular equations.
10. **A slot has no field for licence status.**

## Could not verify

**Pages that refused or failed** (none was reached another way, except Pharmac's criteria, which were read on Pharmac's own main site instead of its schedule site):

- Health New Zealand's growth-charts page; Pharmac's schedule form SA2525; the two pages of the national respiratory guidelines site; the cervical screening guidelines page; the weight-management guideline: all refuse automated readers.
- The transport agency's page for health practitioners came back empty. Two bpacnz addresses did not exist.
- The fetch tool would not open four addresses it had not been given by a search: Starship's guideline index, the PHQ screeners' terms page, the respiratory foundation's guideline page (after a redirect), and the DAS score site.

**Searches not made.** The session's web-search allowance, shared with the other country jobs, ran out. Not searched: the publication of the DAS28 formula; smoking and alcohol brief-advice guidance; maternity guidelines; interRAI; the rehabilitation outcomes centre; whether anaesthetists here record an ASA class; the audiological society's grade scale; the colleges of general practice and urgent care; and the licence terms of every questionnaire in the "unclear" row above.

**So, plainly unverified:**

- 60 tool verdicts (listed in Part 1), among them the DAS28 arithmetic.
- Body mass index as a core tool, and every obstetric tool: no source read.
- The band limits of PASI, EASI and SCORAD; the audiometry grade scale; the training-load limits; the patch-test reading days.
- Whether the stroke guidelines are formally endorsed for New Zealand (their site calls them Australian and New Zealand; the summary read cites Australian bodies only).
- Whether a chest-pain score is a national standard (one journal article, about rural hospitals, was read; it is not one).
- Which of the nine proposed scopes and seven professions are common in private outpatient practice.
- Every licence marked "unclear".

## Sources read (2026-10-10)

[mcnz]: https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/ "Medical Council of New Zealand — Types of vocational scope"
[cosmetic]: https://www.mcnz.org.nz/assets/standards/Statement-on-cosmetic-procedures.pdf "Medical Council of New Zealand — Statement on cosmetic procedures (November 2017)"
[ra]: https://www.health.govt.nz/regulation-legislation/health-practitioners/responsible-authorities "Ministry of Health — Responsible authorities under the Health Practitioners Competence Assurance Act 2003"
[triage]: https://tewhatuora.govt.nz/our-health-system/hospitals-and-specialist-services/emergency-departments/emergency-department-triage "Health New Zealand — Emergency department triage"
[acem]: https://acem.org.au/Content-Sources/Advancing-Emergency-Medicine/Better-Outcomes-for-Patients/Triage "Australasian College for Emergency Medicine — Triage"
[cvd18]: https://www.tewhatuora.govt.nz/publications/cardiovascular-disease-risk-assessment-and-management-for-primary-care "Ministry of Health — Cardiovascular Disease Risk Assessment and Management for Primary Care (2018)"
[hiso]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/HISO-100712025-Cardiovascular-Disease-Risk-Assessment-Data-Standard.pdf "Health New Zealand — HISO 10071:2025 Cardiovascular Disease Risk Assessment Data Standard"
[bpaccvd]: https://bpac.org.nz/2018/cvd.aspx "bpacnz — What's new in cardiovascular disease risk assessment and management for primary care clinicians (2018)"
[ckd]: https://bpac.org.nz/2022/ckd.aspx "bpacnz — Chronic kidney disease: the canary in the coal mine"
[nzews]: https://www.hqsc.govt.nz/assets/Our-work/Improved-service-delivery/Patient-deterioration/Publications-resources/Vital_sign_chart_user_guide_July_2017_.pdf "Health Quality & Safety Commission — New Zealand Early Warning Score Vital Sign Chart User Guide (July 2017)"
[mews]: https://www.hqsc.govt.nz/assets/Our-work/Improved-service-delivery/Patient-deterioration/Publications-resources/MVSC-user-guide-updated-September-2019.pdf "Health Quality & Safety Commission — National Maternity Early Warning System, Maternity Vital Signs Chart User Guide (2019)"
[pews]: https://www.hqsc.govt.nz/assets/Our-work/Improved-service-delivery/Patient-deterioration/Publications-resources/Paediatric-vital-signs-chart-user-guide-2023.pdf "Health Quality & Safety Commission — National paediatric early warning system user guide (March 2023)"
[growth1]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/Specific-life-stage/child-health/Growth-Charts-v2/factsheet-1-growth-charts-well-child.pdf "Ministry of Health — New Zealand–WHO Growth Charts, Fact Sheet 1 (July 2010)"
[growth6]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/Specific-life-stage/child-health/Growth-Charts-v2/factsheet-6-growth-charts-well-child.pdf "Ministry of Health — New Zealand–WHO Growth Charts, Fact Sheet 6 (July 2010)"
[imm]: https://www.tewhatuora.govt.nz/for-health-professionals/clinical-guidance/immunisation-handbook "Health New Zealand — Immunisation Handbook 2024, version 4"
[concussion]: https://www.acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf "ACC — Sport Concussion in New Zealand: National Guidelines (updated January 2026)"
[acc]: https://www.acc.co.nz/for-providers/lodging-claims/lodging-a-claim-for-a-patient "ACC — Lodging a claim for a patient"
[hearing]: https://www.acc.co.nz/assets/provider/assessment-hearing-loss-acc7917.pdf "ACC — Assessment of hearing loss (ACC7917)"
[nzssd]: https://t2dm.nzssd.org.nz/Section-114-Glycaemic-targets-in-the-treatment-of-diabetes "New Zealand Society for the Study of Diabetes — Glycaemic targets in the treatment of diabetes"
[nzssdscreen]: https://t2dm.nzssd.org.nz/Section-112-Screening-for-diabetes-in-asymptomatic-adults "New Zealand Society for the Study of Diabetes — Screening for diabetes in asymptomatic adults"
[copd]: https://bpac.org.nz/2020/docs/copd.pdf "bpacnz — COPD in primary care (respiratory issue)"
[dxa]: https://osteoporosis.org.nz/healthcare-professionals/diagnosis-of-osteoporosis-and-fracture-risk-assessment/bone-densitometry/ "Osteoporosis New Zealand — Bone densitometry"
[miniace]: https://nzdementia.org/Mini-ACE "New Zealand Dementia Foundation — Mini-ACE"
[dementia]: https://bpac.org.nz/2020/dementia.aspx "bpacnz — Recognising and managing early dementia (2020)"
[honos]: https://www.tepou.co.nz/resources/honos-guide-for-new-zealand-clinicians "Te Pou — HoNOS guide for New Zealand clinicians"
[adom]: https://www.tepou.co.nz/initiatives/alcohol-and-drug-outcome-measure "Te Pou — Alcohol and Drug Outcome Measure"
[b4sc]: https://tewhatuora.govt.nz/for-health-professionals/clinical-guidance/specific-life-stage-health-information/child-health/well-child-tamariki-programme/te-mahau-tarearea-o-tamariki-ora/b4-school-check "Health New Zealand — The B4 School Check for early learning services"
[rf]: https://www.heartfoundation.org.nz/professionals/health-professionals/guidelines-on-rheumatic-fever-rheumatic-heart-disease-and-strep-a-sore-throat "Heart Foundation — Guidelines on rheumatic fever, rheumatic heart disease and strep A sore throat"
[rfalgo]: https://assets.heartfoundation.org.nz/documents/shop/heart-healthcare/non-stock-resources/sore-throat-algorithm.pdf "Heart Foundation — sore throat management algorithm (June 2019)"
[af]: https://bpac.org.nz/2024/af.aspx "bpacnz — A progressive approach to managing atrial fibrillation (2024)"
[bsa]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/NSU/For-Health-professionals/Breast-screening-/BreastScreen-Aotearoa-National-Policy-and-Quality-Standards-2013-Revised-November-2022-pdf-2.6-MB.pdf "BreastScreen Aotearoa — National Policy and Quality Standards (revised November 2022); first 100,000 characters read"
[anzca]: https://www.anzca.edu.au/getContentAsset/d4eb4cab-69e6-4228-8568-bbc911c6c505/80feb437-d24d-46b8-a858-4a2a28b9b970/PG07-Pre-anaesthesia-consultation-2024.pdf?language=en "ANZCA — PG07 Guideline on pre-anaesthesia consultation and patient preparation (2024)"
[nzta]: https://www.nzta.govt.nz/assets/resources/medical-aspects/Medical-aspects-of-fitness-to-drive-a-guide-for-health-practitioners.pdf "NZ Transport Agency — Medical aspects of fitness to drive: a guide for health practitioners (December 2024)"
[retinal]: https://www.tewhatuora.govt.nz/publications/diabetic-retinal-screening-grading-monitoring-and-referral-guidance "Ministry of Health — Diabetic Retinal Screening, Grading, Monitoring and Referral Guidance (2016), publication page"
[stroke]: https://informme.org.au/media/rvroeucq/emergency-department-clinical-guidelines-summary_jun25.pdf "Stroke Foundation — Clinical Guidelines for Stroke Management, emergency department summary (June 2025)"
[pasi]: https://dermnetnz.org/topics/pasi-score "DermNet — PASI score"
[easi]: https://dermnetnz.org/topics/easi-score "DermNet — EASI score"
[scorad]: https://dermnetnz.org/topics/scorad "DermNet — SCORAD"
[pharmacada]: https://www.pharmac.govt.nz/assets/2021-11-Amgevita-Special-Authority.pdf "Pharmac — adalimumab (Amgevita) access criteria, effective 1 March 2022"
[pharmac26]: https://www.pharmac.govt.nz/news-and-resources/consultations-and-decisions/2026-02-decision-to-update-the-access-criteria-for-infliximab-etanercept-secukinumab-and-rituximab "Pharmac — decision of 11 February 2026 on access criteria; first 100,000 characters read"
[pharmacra]: https://www.pharmac.govt.nz/news-and-resources/consultations-and-decisions/2025-10-proposal-relating-to-funded-access-to-infliximab-etanercept-secukinumab-and-rituximab/proposed-changes-for-rheumatoid-arthritis "Pharmac — proposed changes for rheumatoid arthritis (October 2025)"
[actnow]: https://teaho.govt.nz/index.php/our-work/canshare/act-now-programme "Te Aho o Te Kahu, Cancer Control Agency — ACT-NOW programme"
[psa]: https://www.health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf "Ministry of Health — Prostate Cancer Management and Referral Guidance (September 2015)"
[bpacpsa]: https://bpac.org.nz/2020/prostate.aspx "bpacnz — Testing for prostate cancer: helping patients to decide (2020)"
[gout]: https://bpac.org.nz/2025/gout.aspx "bpacnz — Overcoming gout: from acute resolution to long-term prevention (2025)"
[wcmc]: https://www.workandincome.govt.nz/providers/health-and-disability/medical-certificates/work-capacity-medical-certificate.html "Work and Income — Work Capacity Medical Certificate"
[notifiable]: https://www.health.govt.nz/regulation-legislation/notifiable-diseases/summary-of-infectious-disease-management "Ministry of Health — Summary of infectious disease management under the Health Act 1956"
[nzf]: https://nzformulary.org/about.html "New Zealand Formulary — About"
[contraception]: https://health.govt.nz/system/files/2020-12/final_aotearoa_contraception_guidance.pdf "Ministry of Health — New Zealand Aotearoa's guidance on contraception (December 2020); first 100,000 characters read"

Each link in this document carries its title; open the file as text to see the list. The [2020 contraception guidance][contraception] is the source for the contraception slot. Also read and used for context: the fracture-risk page of Osteoporosis New Zealand, the Healthify page on short stature, Starship's calculator and guideline-development pages, the commission's pages on the early warning systems, ACC's concussion page, the stroke guidelines' landing page, Health New Zealand's notifiable diseases page, DermNet's page on biological agents, and one journal article on chest pain in rural hospitals. Every address is in the data file under `sourcesRead`.
