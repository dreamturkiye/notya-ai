# New Zealand (`nz`): doctor tools and specialties, checked one by one

Written 2026-10-10. Research and decisions only: no product code, pack file, test or kit file was changed. The same decisions as data are in `docs/araclar-denetim/nz-kararlar.json`.

## Second pass (2026-10-10)

The first pass ran out of its search allowance early: 60 of the 100 verdicts were left "unverified" and none of the questionnaire licences had been read. This pass had an allowance of its own (120 searches; 78 were used) and went back to the sources. It changed this document and the data file and nothing else: no code, pack, test or kit file. Rows it touched carry `pass: 2` in `nz-kararlar.json`; in the tables of Part 1 a verdict cell that says "second pass" was changed here. Everything under the heading "First pass" is the first pass as it was written, except those verdict cells.

**How the sources were read.** Through a reading tool that returns the text of a page. Every figure taken from a source is as that tool returned it; nothing was written from memory. Before any number in the code is changed, a New Zealand clinician opens the source again. Nobody in New Zealand (no clinician, no lawyer) has read this, and no body named here has reviewed or endorsed anything.

**What was not checked again.** The arithmetic of the shared kit was checked against primary publications by the second passes of the United States and Australian audits: the PASI, EASI, SCORAD and DAS28 formulas, the 28 joints, the antibiotic day count, the ASA class list, the kidney "low risk without a urine result" fault, the training-ratio warning, the dose tool's trailing zeros, and which plain record lists hold no number. Those results are carried here by reference and marked "US second pass" ([document][p2-us]) or "AU second pass" ([document][p2-au]). The Australian pass also read documents of three colleges that serve both countries (anaesthetists, obstetricians, radiologists); they are reused where this text says so. The searches of this pass went to what is specific to New Zealand.

### Counts before and after

| | First pass | Second pass |
|---|---|---|
| Keep | 13 | **37** |
| Revise | 26 | **48** |
| Remove | 1 | 1 |
| Unverified | 60 | **14** |
| of the 42 tools that are on: unverified | 29 | **2** |
| of the 58 slots and kit screens: unverified | 31 | **12** |
| Proposed tools | 28 | **29** (27 kept, 1 dropped, 2 new) |
| Core set | 17 | **18** |
| Web searches used | the first pass's ran out | 78 of the 120 allowed |

Of the 37 kept: 22 are record lists with no number in them (below), 3 are the product's own screens or a plain conversion (the patient's page, the follow-up list, visual acuity), 1 is DAS28, and 11 are slots that stay empty. Of the 42 tools that are on: keep 26, revise 14, unverified 2.

### Faults confirmed, safety first

Rows 1, 2, 4, 5, 6, 10, 11 and 12 are specific to New Zealand: the fault exists because of what a New Zealand source says. Rows 3, 7, 8 and 9 are faults of the shared kit, the same in every country build that has the tool. Each example follows from the kit's code as read today.

| # | Tool | State | What the code does | What the source read says | One example |
|---|---|---|---|---|---|
| 1 | Stages of return to sport (`rtp-basamak`) | **on** | Records one of six stages numbered 0 to 5; holds no injury date and no day count | ACC's national guideline (updated January 2026): six stages numbered 1 to 6, days counted from the day of the injury, stage 5 not before day 14 and only after 14 days free of symptoms at rest, stage 6 (competition) "Earliest Day 21" ([ACC][p2-concussion]) | "Stage 5: full training and return to competition" can be recorded on day 3. And the numbers differ: stage 5 means competition in the tool and sport-specific training in the guideline |
| 2 | Dose arithmetic by body weight (`doz-hesabi`) | **on** | Prints every result with a fixed number of decimals | New Zealand's national list of error-prone dose expressions: "never write a zero after a decimal point", because the dose can be read ten times too high ([poster][p2-abbrev]); the national charting standard says the same ([standard][p2-chartstd]) | A child of 16 kg at 10 mg/kg for one dose, liquid of 160 mg in 5 mL: the screen shows "160.00 mg" and "5.0 mL" (run by the AU second pass on the same code) |
| 3 | EASI score (`easi`) | **on** | Uses one set of region weights and never asks the age | The instrument's guide has a second set for children under 8 (US second pass) | A young child, head and neck only, all four signs 3, area score 6: the tool gives 7.2; with the guide's multiplier for that age the score is 14.4 |
| 4 | EASI and PASI bands (`easi`, `pasi`) | **on** | EASI: "Moderate" from 7 to 20.9, "Severe" from 21. PASI: "Moderate" from 10 to 19.9 | bpacnz (2025): moderate eczema is an EASI of 10 to 20, severe is above 20 ([article][p2-bpacad]). Pharmac: funding for psoriasis starts at a whole-body PASI "greater than 10" ([form][p2-sa2624]), a figure its consultation text ties to severe chronic plaque psoriasis ([text][p2-pharmacpsoriasis]) | An EASI of 20.5 reads "Moderate" and is severe in the bpacnz article; an EASI of 8 reads "Moderate" and is below the article's moderate range; a PASI of 12 reads "Moderate" and is above the funding limit |
| 5 | Pure-tone audiometry (`odyometri-pta`) | **on** | Averages four frequencies and prints one of six grades | No New Zealand grade table was found. The Hearing Aid Funding Scheme averages the three worst of the same four frequencies in the better ear and sets its line at 56 dB ([criteria][p2-hafs]); ACC uses a percentage loss of hearing from eight frequencies, not an average ([regulations][p2-hearingregs]) | Thresholds of 30, 60, 60 and 60 dB: the screen shows 52.5 dB and "Moderate hearing loss (41 to 55 dB)"; the scheme's average of the three worst is 60 dB, above its line |
| 6 | PSA: rate of change (`psa-hizi`) | **on** | Works out a yearly rate from two results and warns when they are less than 90 days apart | The national guidance has no rate of change; a raised result is confirmed by a repeat test after 6 to 12 weeks ([guidance][p2-psa]) | 4.5 µg/L, then 5.0 µg/L six weeks later: the screen shows "Change in a year: 4.35" and the caution about measurements less than 90 days apart. The caution appears on every repeat the guidance asks for |
| 7 | Antibiotic course (`antibiyotik-sure`) | **on** | "Last day of the course" = start date plus the number of days | Counted from day 1, a course ends one day earlier (US second pass) | 7 days from 1 October: the tool shows 8 October; the last day is 7 October |
| 8 | ASA class (`asa-preop`) | **on** | Offers I to V and "E" as if E were a class; no VI | Six classes; E is a marker added to a class (US second pass). New Zealand does record the class: the perioperative mortality committee asks for it in every anaesthetic record ([report][p2-pomrc]) | Choosing E gives "ASA E" with no class; ASA VI cannot be recorded |
| 9 | Injury log (`sakatlik-gunlugu`) | **on** | Warns from a training ratio of 1.3 inclusive; divides minutes by minutes | The paper it cites puts 1.3 at the top of its low-risk range and uses effort multiplied by minutes (US second pass) | 390 minutes this week against a usual 300: ratio 1.3, a warning |
| 10 | 28-joint count (`eklem-28`) | **on** | Counts 28 joints, with no ankle and no hip | Right as a 28-joint count (US second pass). Pharmac's criteria count joints with active disease and name the ankle and the hip ([etanercept form][p2-sa2619]) | The ankle and the hip, which the criteria name, cannot be marked on the tool at all; a count made with it is not the count the criteria ask for |
| 11 | Expected height (`hedef-boy`) | **on** | A mid-parental formula with 8.5 cm either side | The national growth-chart fact sheet predicts adult height from the child's own height centile, with an 80 per cent chance of being "within plus or minus 6 cm" for boys; it describes no mid-parental method ([fact sheet][p2-growth6]) | The screen shows a figure and a range that the national chart does not produce |
| 12 | Kidney tools (`kdigo-evre`, `kdigo-serit`) | off | Classify in mg/g after converting; show referral lines labelled as KDIGO criteria; show a risk colour with no urine result | bpacnz: limits at 3 and 30 mg/mmol for both sexes, and a referral list of its own ([article][p2-ckd]); the risk cell needs two results (US second pass) | 3.0 mg/mmol is called A1 (the article: microalbuminuria); 31 mg/mmol is called A2 (the article: macroalbuminuria). A patient with diabetes and an eGFR of 40 gets no referral line and meets a criterion of the article |

Two more unit faults in tools that are switched off, both confirmed again: the HbA1c follow-up refuses every New Zealand value (the health ministry's retinal guidance, read today, writes HbA1c in mmol/mol: [guidance][p2-retinal]); and the anaemia follow-up compares a pack's numbers in g/dL while a Health New Zealand laboratory reports haemoglobin in g/L ([laboratory][p2-cbc]).

Smaller faults of the shared code that apply here (US second pass): a PASI form with one box filled is scored as if every empty box were 0; a PASI, EASI or SCORAD of 0 is called "Mild"; a SCORAD of exactly 50 is called "Severe"; EASI half points cannot be entered; the audiometry tool folds a "slight" step of the scale it cites into "normal" and flags a difference between the ears at exactly 15 dB (ACC's guide speaks only of "a significant asymmetry": [guide][p2-acchearing]). Standing from the first pass and now given a verdict: the made-up severity grade of the pain-and-function rating.

### Checked against a source and found right

- **ACC's concussion stages**: the first pass's reading is confirmed, stage for stage and day for day ([ACC][p2-concussion]).
- **DAS28**: both formulas and the four bands (US second pass). The units are New Zealand's: Pharmac's forms write C-reactive protein in mg/L and the sedimentation rate in mm per hour ([form][p2-sa2624]). The unit trap found in the United States does not arise here.
- **The 28 joints**, the **PASI formula**, **EASI for a patient of 8 or over**, the **SCORAD formula** (all US second pass).
- **The pack's laboratory units**, which the pack itself marks unverified: mg/mmol for the urine albumin ratio ([bpacnz][p2-ckd]), µg/L for PSA ([guidance][p2-psa]), g/L for haemoglobin ([laboratory][p2-cbc]), µmol/L for creatinine ([Australasian recommendations][p2-accwg]). Not confirmed in this pass: mmol/L for glucose and cholesterol.
- **The Australasian Triage Scale** is what emergency departments here use, so removing the American scale stands ([Health NZ][p2-triage]).
- **Inhaler technique**: the tool's breath-hold time lies between those of two New Zealand check lists, and its slow breath for a puffer agrees with them ([children's lists][p2-inhalerpharmac], [patient sheet][p2-inhalerhealthify]). One difference for a clinician: the tool has a single "fast and strong" line for every dry powder inhaler, where the lists word the breath differently for the two devices they cover. Neither list is a current national guideline.
- **"Anaesthetist"** in the two surgical checklists is the right word here (the fault found in the United States does not apply).
- **Dose volume rounded to 0.1 mL**: no New Zealand source read states a rounding step, for or against ([poster][p2-abbrev], [standard][p2-chartstd], [Medsafe sheet][p2-medsafechild]).

### Every verdict that changed, and why

**(a) 22 tools that are on: unverified → keep, as record lists.** Each was opened in the kit's code again. None holds a formula, weight, cut-off, band, grade, interval or stage: they are tick-boxes, choices and dates, so no guideline can confirm or contradict them and they no longer count as unverified clinical tools. Their wording still waits for a New Zealand clinician. In the data file: `recordOnly: true`. Each is switched on in New Zealand: the pack closes four tools only.

Critical conditions checklist (`kritik-yol`) · Airway note (`hava-yolu-notu`) · Post-operative pain follow-up (`postop-agri`) · Checklist after a neurosurgical operation (`noro-postop`) · Seizure and consciousness follow-up (`nobet-bilinc`) · Checklist before and after an operation (`cocuk-prepost-op`) · Wound, drain and stitches follow-up (`yara-dren-izlem`) · Pre-operative checklist (`genel-preop`) · Insulin and thyroid treatment: date card (`rejim-karti`) · Checklist before a chest operation (`toraks-preop`) · Chest drain and wound follow-up (`toraks-tup-yara`) · Checklist before a heart or vascular operation (`kalp-damar-preop`) · Vascular graft and wound follow-up (`greft-yara-izlem`) · Antithrombotic treatment: review dates (`antikoagulan-vadeleri`) · Otoscopy note (`otoskopi-notu`) · Dialysis session and next date (`diyaliz-seans`) · Treatment cycle counter (`kur-sayaci`) · Side effects checklist (`toksisite-listesi`) · Fracture, cast and brace follow-up (`kirik-alci-takip`) · Post-operative checklist (`ortopedi-op-protokol`) · Wound, graft and flap follow-up (`plastik-yara-greft`) · Examination queue (`tetkik-kuyrugu`)

These are the same 22 lists the Australian second pass classed this way; 20 of them were classed so by the United States pass too.

**(b) 5 tools that are on: unverified → a verdict with a source.**

| Tool | Now | Why |
|---|---|---|
| ASA class and pre-operative checklist (`asa-preop`) | **revise** | New Zealand records the class; the shared class list is wrong (fault 8). Add VI; record E beside a class |
| Pure-tone audiometry (`odyometri-pta`) | **revise** | No New Zealand grade table; the two New Zealand rules read work differently (fault 5). Show the average without a grade until a local audiologist sets one |
| Pain and function rating (`vas-fonksiyon`) | **revise** | The grade comes from a formula of the product's own; the code says so. Keep the two numbers, drop the grade (as the US and AU audits decided) |
| Injury log (`sakatlik-gunlugu`) | **revise** | The limits are in the paper it cites, used otherwise than the paper describes (fault 9) |
| DAS28 (`das28`) | **keep** | Formula, bands and units confirmed. Pharmac's criteria do not use it: it is for clinical follow-up |

**(c) 18 slots: unverified → revise.** For each, the New Zealand source that would fill it, or its owner's licence terms, is now known and should be written into the slot. A slot stays empty and switched off until a New Zealand clinician (or a lawyer) supplies and signs its content.

| Slot | What is now known | Source |
|---|---|---|
| Bone density scan repeat (`dxa-tekrar`) | Osteoporosis New Zealand's 2017 guidance gives a shortest interval for most patients and a later repeat after starting treatment; it is past its own review date | [guidance][p2-osteo] |
| Anaemia in kidney disease (`anemi-izlem`) | Keep off: laboratories report haemoglobin in g/L and the kit compares in g/dL | [laboratory][p2-cbc] |
| Blood pressure, heart failure and atrial fibrillation follow-up (`kardiyo-izlem`) | bpacnz (2023) gives a review rhythm for blood pressure; nothing for the other two | [article][p2-hypertension] |
| Visit and discharge summary (`visit-summary-document`) | A national standard for the discharge-summary message exists (interim, 2015); it sets no clinical headings and does not cover a clinic letter | [HISO 10011.4][p2-edischarge] |
| Laboratory and imaging requests (`test-requests`) | One public laboratory's list of what a request must carry; no national standard read | [laboratory][p2-labform] |
| Emergency admission, referral and discharge (`emergency-referral`) | Two national standards for the documents; neither sets clinical content | [HISO 10011.1][p2-referrals], [HISO 10011.4][p2-edischarge] |
| Referral in primary care (`family-referral`) | The referral standard; clinical criteria are published subject by subject (maternity was read) | [HISO 10011.1][p2-referrals], [maternity][p2-maternityreferral] |
| Review of medicines in older patients (`polypharmacy`) | bpacnz's guide (about 2010): a four-step process and a review at least once a year; it finds the published criteria lists of limited use in primary care | [guide][p2-stopmeds] |
| Isotretinoin pregnancy-prevention checks (`isotretinoin-pregnancy-prevention`) | Medsafe's 2018 paper: New Zealand has no formal programme; the conditions are the data sheet's and the formulary's | [Medsafe][p2-isotretinoin] |
| Written action plan for asthma and COPD (`lung-action-plan`) | The respiratory foundation publishes a COPD self-management plan in five languages; its asthma pages could not be opened | [foundation][p2-copdguidelines] |
| Maternity leave certificate (`maternity-leave`) | A certificate from a doctor or midwife with the name and the due date, attached to a request made at least three months ahead. Not a calculation of leave dates | [Employment NZ][p2-parentalleave] |
| Obstetric risk prompts (`obstetric-risk`) | The national referral guidelines (2023): coded conditions, each with one of four levels of referral. Free to reuse with attribution | [guidelines][p2-maternityreferral] |
| MIDAS (`midas`) | All rights reserved (US second pass) | [US][p2-us] |
| M-CHAT-R/F (`mchat-rf`) | The authors' agreement is needed for a commercial or electronic product (US second pass); no New Zealand page naming it was found | [US][p2-us] |
| Monitoring of psychotropic medicines (`psychotropic-monitoring`) | One medicine only: bpacnz's lithium article of 2007 | [article][p2-lithium] |
| Critical-finding notice (`critical-finding-notice`) | The radiologists' college, which serves both countries, has a 2024 position statement (AU second pass read its page) | [AU][p2-au] |
| Rehabilitation session plan (`rehabilitation-session-plan`) | ACC's rule: prior approval once a stated number of treatments or a year is reached, with a treatment plan for a late request. A tool of the state insurer: New Zealand only | [ACC][p2-accprior] |
| Pain scale with the Oswestry index (`pain-odi`) | A fee for commercial users (US second pass) | [US][p2-us] |

**(d) 1 slot: unverified → keep.** The obstetric follow-up panel (`obstetric-follow-up-panel`) collects from the obstetric slots, two of which now have a named source; the first pass kept the two other panels on the same ground.

**(e) Verdict unchanged, findings added** (the rows in the data file say what): PASI, EASI and SCORAD, the antibiotic day count, inhaler technique, expected height, dose arithmetic, the 28-joint count, PSA rate of change, return to sport, both kidney tools, the report outline, the American triage scale, and the slots for HbA1c, the bowel-disease index, prescriptions, medicine interactions, vaccination, chronic-disease follow-up, BASDAI, stroke red flags, development screening, diagnosis coding, cardiovascular risk, anticoagulation review, the COPD test, growth charts, and PHQ-9 with GAD-7.

### The New Zealand versions of the shared items

| Item | What the New Zealand source says | Where the code stands |
|---|---|---|
| Hearing grades | No grade table from the audiological society was found (three searches). The funding scheme uses the three worst of four frequencies; ACC uses a percentage from eight ([criteria][p2-hafs], [regulations][p2-hearingregs]) | Four-frequency average with six grades: **revise** (fault 5) |
| Concussion: stages and minimum days | Re-read and confirmed ([ACC][p2-concussion]) | Six other stages, no days: **revise** (fault 1) |
| Albuminuria categories and referral | 3 and 30 mg/mmol; a referral list of its own, with a kidney-failure risk figure and a lower threshold for younger patients and for Māori and Pacific peoples, as the source states it ([bpacnz][p2-ckd]) | Tools off; limits and referral lines differ: **revise** (fault 12) |
| The 2015 prostate guidance | Three age bands; a repeat after 6 to 12 weeks; three referral urgencies; no rate of change ([guidance][p2-psa]) | **revise** (fault 6) |
| Expected height in the national growth charts | From the child's own centile; no mid-parental method ([fact sheet][p2-growth6]) | **revise** (fault 11) |
| DAS28 and joint counts in Pharmac's criteria | No DAS28. Joint counts (15 or 20 by form, or four from a named list), with C-reactive protein and sedimentation-rate limits for some indications ([etanercept][p2-sa2619], [secukinumab][p2-sa2624], [rituximab][p2-sa2622], [subcommittee record][p2-rheumrecord]) | DAS28: **keep**. 28-joint count: **revise** (fault 10) |
| PASI and EASI in Pharmac's criteria | PASI above 10 for whole-body psoriasis, with other routes for the face, palm, sole, genital and flexural disease; EASI of 16 or more, or a DLQI of 10 or more, for atopic dermatitis ([secukinumab][p2-sa2624], [upadacitinib][p2-sa2599]) | Bands disagree: **revise** (fault 4) |
| Whether anaesthetists record an ASA class | Yes: the national perioperative mortality committee asks for it in every anaesthetic record and reports how often it is missing ([report][p2-pomrc]); the college's record guideline asks for it too (AU second pass). No New Zealand page writes the classes out | The list is the American society's and the tool has it wrong: **revise** (fault 8) |
| HbA1c and haemoglobin units | mmol/mol ([retinal guidance][p2-retinal]; the diabetes society, first pass); g/L ([laboratory][p2-cbc]) | Both tools off and unusable as built: **revise** |
| Dose-volume rounding | **None was found.** The national list and the charting standard cover how a dose is written (no trailing zeros) and give no rounding step; the Commission's alert on prescribing by weight exists but its text is not on the page ([alert][p2-weightalert]) | Rounding stands unverified; trailing zeros: **revise** (fault 2) |

### The searches the first pass did not make

**Maternity.** Three things were found. The national **referral guidelines** (Health New Zealand, March 2023) are the source for the obstetric-risk slot: about 270 coded conditions, each with one of four levels of referral, licensed for reuse with attribution ([guidelines][p2-maternityreferral]). A **parental-leave certificate** is a short note with a name and a due date that a doctor or a midwife writes ([Employment NZ][p2-parentalleave]). The **dating rule** for the pregnancy calendar was not found: the referral guidelines do not mention it, the obstetricians' college statement holds no arithmetic (AU second pass), and two searches surfaced no New Zealand rule. The maternity early warning score stays as the first pass left it.

**Smoking and alcohol.** The health ministry's 2021 guidelines ask every health worker to ask about and record smoking status, give brief advice and offer support; they name no questionnaire and are free to reuse with attribution ([guidelines][p2-smoking]). bpacnz's 2018 article names the AUDIT-C as the first alcohol questionnaire in primary care ([article][p2-alcohol]). Both are added as proposals below: the smoking record for the core set, the alcohol score as a slot.

**Body mass index as a core tool.** Now sourced: the health ministry's 2017 guideline defines the index, gives the adult classes and two waist figures for each sex, and is free to reuse with attribution ([guideline][p2-weight]).

**The questionnaire licences.** In the licence table below.

### Licence terms, as read

On the owner's own page unless the row says otherwise. "Free" and "needs permission" are my reading of the page, not legal advice.

| What | Result | What the page says | Page |
|---|---|---|---|
| New Zealand cardiovascular risk equations and their data standard | **free with attribution** | Creative Commons Attribution 4.0; the coefficients are printed in the standard | [HISO 10071:2025][p2-hiso] |
| Adult and maternity early warning scores | **needs permission** | The Commission's site terms: free to reproduce if accurate and credited, but not to promote or endorse a product or service and not for sale; graphic work may not be lifted out of its document | [site terms][p2-hqscsite], [chart page][p2-nzewspage] |
| Paediatric early warning system | **not usable as licensed** | Creative Commons BY-NC 4.0, and in words: no commercial use | [user guide][p2-pews] |
| Growth charts | **needs permission** | The fact sheets are based on material copyright 2009 Royal College of Paediatrics and Child Health. The college: charts reproduced whole and unaltered; commercial printing needs its permission; digital charts by subscription | [college][p2-rcpch], [fact sheet][p2-growth1] |
| PHQ-9, GAD-7 | **free** | US second pass: the owner's notice, as copied by a standards body; the owner's own site refuses automated readers, so a person should open it once. bpacnz (2009) says the PHQ-9 is widely used in New Zealand and prefers the Kessler 10 as the first assessment | [US][p2-us], [bpacnz][p2-depression] |
| PASI, EASI, SCORAD, DAS28 | **unclear** (EASI leaning free) | US second pass, on the owners' pages where one exists | [US][p2-us] |
| DLQI | **needs permission** | Cardiff University owns it; no change of wording; its copyright line on every copy; a licence and fee may apply depending on the user | [Cardiff][p2-dlqi] |
| Strengths and Difficulties Questionnaire | **needs permission** | No electronic version for any purpose without prior authorisation; paper copies free for individuals and non-profit bodies | [owner][p2-sdq] |
| Mini-ACE | **free on paper; unclear for software** | Free of charge to New Zealand health professionals; nothing about building it into software | [foundation][p2-miniace] |
| HoNOS | **unclear** | Te Pou's page states no terms; the owner's page was not found | [Te Pou][p2-tepou] |
| AUDIT-C | **free for non-commercial use; commercial use unclear** | US second pass, on the questionnaire's own site | [US][p2-us] |
| COPD Assessment Test; M-CHAT-R/F; MIDAS; Oswestry index | **needs permission** (each) | US second pass: a signed agreement; the authors' agreement; all rights reserved; a fee for commercial users | [US][p2-us] |
| BASDAI; IPSS | **not found** | Neither this pass nor the US or AU pass found the owner's terms | — |
| Australasian Triage Scale | **needs permission** | The college's policy: "All rights reserved", no route for reuse | [policy][p2-atspolicy] |
| ASA class text; KDIGO grid; BI-RADS; ESI | **needs permission** (each) | US second pass, on the owners' pages | [US][p2-us] |
| ACC's concussion guideline | **needs permission** | No licence statement in the document; ACC's copyright page was not found by search | [ACC][p2-concussion] |
| bpacnz articles | **needs permission** | The resource is bpacnz's copyright and may not be reproduced outside its terms of use; all rights reserved | [article][p2-bpacad] |
| Health ministry and Health New Zealand guidance (prostate 2015, weight 2017, smoking 2021, retinal screening 2016, maternity referral 2023) | **free with attribution** | Each document states Creative Commons Attribution 4.0 | [ministry terms][p2-mohcopyright] |
| Rheumatic fever and sore throat guidelines, 3rd edition | **free with attribution** | Crown copyright, Creative Commons Attribution 4.0. (The first pass's "needs permission" was for the Heart Foundation's 2019 sheet, now superseded) | [publication page][p2-rfpage] |
| Health New Zealand's public site | **free with attribution** | Creative Commons Attribution 4.0 for that site's content, without photographs, logos and third-party work. It does not by itself cover the Immunisation Handbook, whose page states no terms | [terms][p2-healthnzcopyright] |
| HISO messaging standards | **may be copied, not adapted** | Creative Commons Attribution-No Derivative Works (2015 standard); reproduction unchanged with acknowledgement (2007 standard) | [10011.4][p2-edischarge], [10011.1][p2-referrals] |
| SNOMED CT | **licence needed, at no charge to affiliates** | Anyone who uses it or builds software with it in New Zealand must hold an Affiliate Licence | [Health NZ][p2-snomed] |
| Universal List of Medicines | **unclear, leaning free** | The page says it is free to use and names no licence | [Health NZ][p2-nzulm] |
| New Zealand Formulary | **needs permission** | Free of charge to health professionals; holds other publishers' interaction content; no terms for integration | [ministry page][p2-nzf] |
| Legislation (the hearing regulations, the Health Act) | **free** | "there is no copyright in New Zealand legislation"; limits can apply where overseas copyright is asserted | [Parliamentary Counsel Office][p2-legcopyright] |
| Garvan calculator | **not found** | One search surfaced no terms. FRAX: treat as not free (US second pass) | — |

### The proposals

**27 of the 28 are kept.** For each, a New Zealand source was read (in this pass unless the row in the data file says first pass). "Publication" below says how far the paper that defines a tool was reached; where it was not opened, its formula, items and limits were **not** read and none is given here. A clinician confirms each; the owner opens the rights holder's terms before anything is built.

| Proposal | What changed in this pass | Publication |
|---|---|---|
| Kidney function (`nz-kidney-function`) | Source read again. The Australasian recommendations that moved laboratories to the CKD-EPI equation cover New Zealand and write creatinine in µmol/L ([recommendations][p2-accwg]) | The 2009 paper as cited there; not opened. Cockcroft-Gault: not reached |
| Body mass index and waist (`nz-bmi-waist`) | **Now sourced** ([guideline][p2-weight]); free with attribution | In the guideline itself |
| Cardiovascular risk (`nz-cvd-risk`) | Standard read again in full: four equations; coefficients printed; the general equation differs from the 2018 paper, so build from the standard ([standard][p2-hiso]) | Lancet 2018, as cited; not opened |
| Australasian Triage Scale record (`nz-ats-triage`) | Use confirmed again; licence read: needs permission | The college's policy |
| Early warning scores, adult and maternity (`nz-ews-adult`, `nz-mews-maternity`) | Licence read: needs permission. Hospital tools: build only if hospital doctors are a target | The Commission's guides (first pass) |
| Paediatric early warning score (`nz-pews-paediatric`) | Licence confirmed: no commercial use. Not buildable without the Commission's permission | The Commission's guide |
| Kidney disease categories (`nz-ckd-staging`) | Source read again in full; the referral list is now set out in the tool row | KDIGO 2024 (US second pass) |
| Atrial fibrillation scores (`nz-af-stroke-bleeding-risk`) | A second bpacnz page read: different starting points for men and women ([audit][p2-afaudit]) | Not reached |
| Sore throat pathway (`nz-sore-throat-rheumatic-fever`) | **Source changed** to Health New Zealand's third edition (2025), free with attribution ([page][p2-rfpage], [summary][p2-rfsummary]) | The guideline itself |
| Cognitive screening (`nz-cognitive-screen`) | Source read again; free on paper, software unclear | Hsieh and colleagues 2015 ([record][p2-miniacepaper]); not opened |
| Strengths and Difficulties Questionnaire (`nz-sdq-b4sc`) | Licence read: needs permission for any electronic version | Not reached |
| DLQI (`nz-dlqi`) | Confirmed on Pharmac forms in force; licence read: needs permission | Held by Cardiff University; not opened |
| Bowel disease indices (`nz-ibd-indices`) | Confirmed on a Pharmac form in force ([form][p2-sa2599]) | Not reached |
| Full joint count (`nz-active-joint-count`) | Confirmed on three Pharmac forms in force | A count; no formula |
| Concussion: graduated return (`nz-concussion-return`) | Source read again in full | The guideline itself |
| Percentage loss of hearing (`nz-hearing-loss-percentage`) | The regulations were read: eight frequencies, tables, an age adjustment ([regulations][p2-hearingregs]) | The regulations themselves |
| Diabetic retinal screening grade (`nz-diabetic-retinal-grade`) | The document itself was read: two grade scales, each with its interval; it states a free licence ([guidance][p2-retinal]) | The guidance itself |
| PSA thresholds (`nz-psa-thresholds`) | Source read again | The guidance itself |
| Stroke severity record (`nz-nihss`) | **Kept with a caution**: no New Zealand page naming the scale was read ([stroke page][p2-acutestroke], [work plan][p2-strokeplan]) | A United States institute publishes it (US second pass) |
| The other seven (ACC claim checklist, work-capacity certificate, fitness to drive, diabetes review, gout, breast screening categories, regimen names) | Stand on the first pass's sources; not read again. The ACC checklist has a new note: ask ACC which diagnosis code its claim form accepts today | — |

**1 dropped.** Mental health outcome measures (`nz-honos-adom`). Te Pou's page says the HoNOS family is collected because public services and some non-government organisations are required to; those services report through their own systems. The page states no terms of use, the owner's terms were not found, and the page does not mention the alcohol and drug measure. Nothing read shows a use in private outpatient practice ([Te Pou][p2-tepou]; publication reached by its abstract page only: [Wing and colleagues 1998][p2-honospaper]). It can return if public mental health services become a target.

**2 new**, from the searches the first pass did not make:

| Proposal | Who | Source | Licence |
|---|---|---|---|
| Smoking status and brief advice, the ABC pathway: a record (`nz-smoking-abc`) | **core set** | [Ministry of Health 2021][p2-smoking] | free with attribution |
| Alcohol: AUDIT-C score, as a slot (`nz-alcohol-audit-c`) | General practice, Internal medicine, Psychiatry, Emergency medicine, Gastroenterology | [bpacnz 2018][p2-alcohol] | free for non-commercial use; commercial use unclear (US second pass) |

### Māori and Pacific elements read in this pass (as the sources state them, not interpreted)

- The rheumatic fever guidelines define high risk as "Māori or Pacific peoples who are 3-35 years (with emphasis on those 4-19 years)", or a personal or family history of the disease. [summary][p2-rfsummary]
- bpacnz says a lower threshold for referral in kidney disease is usually appropriate for younger patients and for Māori and Pacific peoples, and gives no figure. [article][p2-ckd]
- The weight-management guideline says there is no evidence that higher body-mass-index cut-offs are justified for Māori and Pacific people, and that a lower threshold should be considered for Asian people. [guideline][p2-weight]
- bpacnz says the DLQI "has not been validated in Māori or Pacific peoples". [article][p2-bpacad]
- The Australasian recommendations on kidney-function reporting (2012) say the equation needed validating in Māori and Pacific Islander peoples. [recommendations][p2-accwg]
- The cardiovascular standard takes prioritised ethnicity in five groups and a deprivation quintile as inputs (confirmed again). [standard][p2-hiso]
- The stop-smoking guidelines say interventions that work in the general population are at least as effective for Māori. [guidelines][p2-smoking]
- A chapter on stroke management for Māori is being written for the Australian and New Zealand stroke guidelines. [work plan][p2-strokeplan]

### Still unverified, and why

**2 tools that are on.**

- **Vertigo: positional test note** (`vertigo-notu`). It holds no number, but it holds a clinical rule (any of six "central signs" means a repositioning manoeuvre is not suitable). Two searches surfaced no New Zealand guidance on positional vertigo, and neither the US nor the AU pass could check the rule.
- **Patch test: reading days** (`yama-okuma`). Three searches surfaced no New Zealand page that states the reading days. The US and AU passes found the tool's two days in their own countries' sources. Leaning: keep.

**11 slots and 1 kit screen**, in five groups:

| Group | Which | Exact reason |
|---|---|---|
| Law (3 slots, 1 kit screen) | Consent for an operation on a child; consent checklist for plastic surgery; safety and emergency triage in psychiatry; consultations between doctors | A lawyer, not a web page. Two pages were read and are reported in the rows without interpreting them: the Code of Rights on written consent ([Code][p2-hdccode]) and the Privacy Commissioner's fact sheet on disclosure ([fact sheet][p2-hipc]). Psychiatric safety was not searched for |
| A search found no New Zealand source (5) | Pregnancy calendar; HIV and viral hepatitis follow-up; hepatitis B and C follow-up; monitoring of antiseizure medicines; haematuria and stone triage | Dating: two searches. Hepatitis: two searches; the one page read has no schedule ([listing][p2-hepfoundation]). Antiseizure medicines and haematuria: one search each |
| Only funding limits are known (1) | CRP and ESR follow-up | Pharmac's forms hold one funding limit for each marker, not follow-up bands or intervals |
| Owner's terms and local use not found (1) | IPSS | Two searches surfaced no New Zealand page naming it; no audit has found its licence |
| To be written locally (1) | Home exercise sheet | Every sentence is an instruction to a patient |

**Inside tools that now have a verdict**, these remain open: a New Zealand grade table for hearing loss; a New Zealand page that writes out the ASA classes; a New Zealand rule for rounding a dose volume; the current version of the Immunisation Handbook (the page returned "2024 version 3" today, where the first pass read version 4: [page][p2-immhandbook]); which code ACC's claim form accepts now that SNOMED CT replaces Read codes ([Health NZ][p2-snomed]); whether mmol/L is the unit for glucose and cholesterol; and the points and limits of every proposed score, which a clinician takes from the named source.

Part 3 (specialties and clinic roles) was not reopened. One list in it changes with the dropped proposal: psychiatry no longer has "outcome measures".

### Pages that could not be read in this pass

Recorded and left: no cache, mirror or other tool was used to get round a refusal, and no robot check was answered.

- **The reading tool would not open the address:** the page the Asthma and Respiratory Foundation's guidelines address redirects to (cardiacandrespiratory.org.nz), as in the first pass. The asthma action plans were therefore not read.
- **Returned something else:** a clinic's patch-test sheet that a search listed (the address now shows unrelated content; not used); the health ministry's listing for the asthma guidelines (a general list of publications).
- **Read only in part:** the perioperative mortality report (stops before the appendices); ACC's hearing-assessment guide (stops in an appendix); the weight-management guideline (the first 100,000 of 116,257 characters); growth-chart fact sheet 6 (the charts are not in the text); Medsafe's isotretinoin paper (the committee's advice is not in the text); the Commission's alert on prescribing by weight (a summary only).
- **Not tried:** the PHQ owner's site (the US pass found it refuses automated readers).
- **Read this time, though the first pass was refused:** Pharmac's schedule site (four forms) and the weight-management guideline (by its document address).

### Where the searching stopped

78 of the 120 searches were used, in the order asked: the tools that are on and the New Zealand versions of the shared items first, then maternity, smoking, alcohol and body mass index, then licences, then the proposals, then slots. The allowance was not refused. The search stopped because what is left is one of four kinds: rows that no web page settles (law; a sheet a clinician must write), rows for which one to three searches found no New Zealand source (listed above), owners' terms that three audits have now failed to find (BASDAI, IPSS), and subjects that were not searched for: psychiatric safety, antipsychotic monitoring, the screening programmes, what a specialist's letter must contain, the electronic prescription service, and the papers that define five of the proposed scores. Those are named so that a later pass can begin with them.

---

## First pass (2026-10-10, earlier the same day)

The text below is the first pass as written. The only later changes are the verdict cells marked "second pass", a short note in italics beside seven of them, the three rows of table 1d, and one line of Part 3. Where a first-pass sentence and the second-pass section disagree, the second pass stands.

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
| `kritik-yol` | Critical conditions checklist | Emergency medicine | **keep** (second pass: record list) | The product's own list. Leaning: keep; also for urgent care. | [stroke guideline summary][stroke] |
| `asa-preop` | ASA class and pre-operative checklist | Anaesthesia | **revise** (second pass) | The pre-anaesthesia guideline that applies here (ANZCA PG07) does not name the ASA class. Whether anaesthetists here record one was not confirmed. Leaning: keep. *Second pass: New Zealand does record the class; the shared class list is wrong (no VI; E offered as a class).* | [ANZCA PG07][anzca] |
| `hava-yolu-notu` | Airway note | Anaesthesia | **keep** (second pass: record list) | The product's own list. Leaning: keep. | [ANZCA PG07][anzca] |
| `postop-agri` | Post-operative pain follow-up | Anaesthesia | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `noro-postop` | Checklist after a neurosurgical operation | Neurosurgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `nobet-bilinc` | Seizure and consciousness follow-up | Neurosurgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `cocuk-prepost-op` | Checklist before and after an operation | Paediatric surgery | **keep** (second pass: record list) | The product's own list; the consent item is a legal question. Leaning: keep. | — |
| `yara-dren-izlem` | Wound, drain and stitches follow-up | Paediatric surgery, General surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `genel-preop` | Pre-operative checklist | General surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `pasi` | PASI score | Dermatology | **revise** | Arithmetic matches DermNet. The three bands (mild, moderate, severe) have no source. Add the DLQI beside it (licence first). Show it to the clinic dermatology role. | [DermNet][pasi], [Pharmac][pharmac26] |
| `easi` | EASI score | Dermatology | **revise** | **Wrong for a child under 8** (see below). Bands have no source. | [DermNet][easi] |
| `scorad` | SCORAD index | Dermatology | **revise** | Formula matches DermNet. Bands have no source. | [DermNet][scorad] |
| `yama-okuma` | Patch test: reading days | Dermatology | unverified (still, second pass) | Date arithmetic; local reading days not read from a source. Leaning: keep. | — |
| `rejim-karti` | Insulin and thyroid treatment: date card | Endocrinology | **keep** (second pass: record list) | Dates only. Leaning: keep. | — |
| `antibiyotik-sure` | Antibiotic course: counting days | Infectious diseases | **revise** | **"Last day" may be one day late** (see below). Most courses are prescribed in general practice and urgent care: widen who sees it. | — (the code) |
| `toraks-preop` | Checklist before a chest operation | Thoracic surgery | **keep** (second pass: record list) | The product's own list. The role is not a New Zealand scope (Part 3). Leaning: keep. | [MCNZ][mcnz] |
| `toraks-tup-yara` | Chest drain and wound follow-up | Thoracic surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `inhaler-teknik` | Inhaler technique | Respiratory medicine | **revise** | Used here: technique is checked at each consultation in primary care. Show it to general practice too. The steps were read by no clinician. | [bpacnz COPD][copd] |
| `gorme-keskinligi` | Visual acuity: logMAR | Ophthalmology | **keep** | A mathematical conversion. New Zealand writes acuity as 6/x; the tool accepts it. | [NZTA guide][nzta] |
| `kalp-damar-preop` | Checklist before a heart or vascular operation | Cardiac and vascular surgery | **keep** (second pass: record list) | The product's own list. Heart and vessel surgery are two scopes here. Leaning: keep. | [MCNZ][mcnz] |
| `greft-yara-izlem` | Vascular graft and wound follow-up | Cardiac and vascular surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `antikoagulan-vadeleri` | Antithrombotic treatment: review dates | Cardiac and vascular surgery | **keep** (second pass: record list) | Dates only. Leaning: keep. | — |
| `odyometri-pta` | Pure-tone audiometry: average threshold | Otolaryngology | **revise** (second pass) | The six-grade scale was found in no New Zealand source. ACC uses a different measure for claims (percentage loss of hearing). The audiologist role does not see this tool. *Second pass: No New Zealand grade table was found; the funding scheme and ACC measure differently. Show the average without a grade.* | [ACC hearing][hearing] |
| `otoskopi-notu` | Otoscopy note | Otolaryngology | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `vertigo-notu` | Vertigo: positional test note | Otolaryngology | unverified (still, second pass) | States a clinical rule of its own; a local clinician must read it. | — |
| `diyaliz-seans` | Dialysis session and next date | Nephrology | **keep** (second pass: record list) | Dates only. Leaning: keep. | — |
| `kur-sayaci` | Treatment cycle counter | Oncology | **keep** (second pass: record list) | A counter. The national library of regimen names is not used. Leaning: keep. | [Cancer agency][actnow] |
| `toksisite-listesi` | Side effects checklist | Oncology | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `kirik-alci-takip` | Fracture, cast and brace follow-up | Orthopaedic surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `ortopedi-op-protokol` | Post-operative checklist | Orthopaedic surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `vas-fonksiyon` | Pain and function rating | Orthopaedic surgery | **revise** (second pass) | Prints mild / moderate / severe from a formula of the product's own. Leaning: drop the grade, keep the scores. *Second pass: Drop the grade, keep the two numbers.* | — (the code) |
| `hedef-boy` | Expected height from the parents' heights | Paediatrics | **revise** | **Not the method of the national growth charts** (see below). | [Growth fact sheet 6][growth6] |
| `doz-hesabi` | Dose arithmetic by body weight | Paediatrics | **revise** | Arithmetic is right. Milligrams only; children here are mostly seen outside paediatrics. | [NZ Formulary][nzf] |
| `plastik-yara-greft` | Wound, graft and flap follow-up | Plastic surgery | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `tetkik-kuyrugu` | Examination queue | Radiology | **keep** (second pass: record list) | The product's own list. Leaning: keep. | — |
| `das28` | DAS28 disease activity score | Rheumatology | **keep** (second pass) | **Arithmetic not checked** (search allowance ran out). Units fit. Funding criteria here use joint counts, not DAS28. *Second pass: Formula, bands and units confirmed (US second pass; Pharmac forms).* | [Pharmac RA][pharmacra] |
| `eklem-28` | 28-joint count | Rheumatology | **revise** | No ankles or hips, which Pharmac's criteria name. Add a full joint count. | [Pharmac RA][pharmacra] |
| `psa-hizi` | Prostate-specific antigen: rate of change | Urology | **revise** | Unit right (µg/L). The national guidance uses age-banded thresholds and a repeat at 6 to 12 weeks; the tool's caution fires on that repeat. | [Ministry 2015][psa], [bpacnz][bpacpsa] |
| `rtp-basamak` | Stages of return to sport | Sport and exercise medicine | **revise** | **Does not match the national concussion guideline** (see below). | [ACC][concussion] |
| `sakatlik-gunlugu` | Injury log | Sport and exercise medicine | **revise** (second pass) | The two load limits were found in no New Zealand source. Leaning: keep. *Second pass: The limits are in the cited paper, used otherwise than it describes (US second pass).* | — |

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
| `dxa-tekrar` | Bone density scan repeat | Endocrinology | **revise** (second pass) | The source read gives no repeat interval. *Second pass: A second document of the same body gives an interval.* | [Osteoporosis NZ][dxa] |
| `anemi-izlem` | Anaemia in kidney disease | Nephrology | **revise** (second pass) | No source. A trap in the kit: limits would have to be typed in g/dL though laboratories here report g/L. *Second pass: The unit trap is confirmed: laboratories report g/L. Keep off.* | — |
| `iltihap-lab-izlem` | CRP and ESR follow-up | Rheumatology | unverified (still, second pass) | Units fit; no source for bands. | [Pharmac][pharmacada] |
| `viral-izlem`, `hepatit-izlem` | Follow-up intervals | Infectious diseases; Gastroenterology | unverified (still, second pass) | No New Zealand source read for the numbers. | — |
| `kardiyo-izlem` | Follow-up intervals | Cardiology | **revise** (second pass) | A source for the blood-pressure numbers is now known; none for heart failure or atrial fibrillation. | [bpacnz][p2-hypertension] |

### 1d. Placeholders with nothing built (44)

| Verdict | Slots | Note |
|---|---|---|
| **keep** as a slot (11; second pass: 1 more) | `prescription`, `medicine-interactions`, `end-of-visit`, `family-vaccination-screening`, `family-chronic`, `family-follow-up-panel`, `basdai`, `obstetric-follow-up-panel`, `stroke-red-flags`, `development-screening`, `paediatric-follow-up-panel` | The New Zealand content each waits for exists and is named in the data file (for example the Immunisation Handbook; the BASDAI, on which Pharmac's criteria are written). The obstetric follow-up panel joined this row in the second pass. |
| **revise** the slot (25; second pass: 15 more) | `visit-summary-document`, `diagnosis-coding`, `patient-certificates`, `test-requests`, `emergency-referral`, `family-referral`, `cardiovascular-risk`, `polypharmacy`, `anticoagulation-review`, `isotretinoin-pregnancy-prevention`, `notifiable-diseases`, `cat-mmrc`, `lung-action-plan`, `maternity-leave`, `contraception-eligibility`, `obstetric-risk`, `midas`, `growth-percentiles`, `vaccination-schedule`, `mchat-rf`, `phq9-gad7`, `psychotropic-monitoring`, `critical-finding-notice`, `rehabilitation-session-plan`, `pain-odi` | The slot describes the wrong thing for New Zealand, or names the wrong doctors; or (second pass) its New Zealand source or its owner's licence terms are now known and should be written into it. Details in the second-pass section and in the data file. |
| unverified (8; was 24) | `child-surgery-consent`, `pregnancy-calendar`, `antiseizure-monitoring`, `plastic-surgery-consent`, `psychiatry-safety-triage`, `ipss`, `urology-emergency-triage`, `home-exercise` | No New Zealand source was found, or the question is a legal one (the two consent slots and psychiatric safety). The exact reason for each is in the second-pass section. |

The slots that need the most change:

- **`cardiovascular-risk`** speaks of "ten-year" risk. New Zealand uses **five-year** risk from its own equations, and general practice, its main user, is not among the slot's roles. Sources: [HISO 10071:2025][hiso], [bpacnz 2018][bpaccvd].
- **`notifiable-diseases`** is given to infectious-diseases specialists only. The duty to notify rests on health practitioners in general, on a well-founded suspicion. It should be base. Source: [Ministry of Health summary][notifiable].
- **`diagnosis-coding`** should name both systems that matter here: SNOMED CT (earlier audit) and the Read code an ACC claim asks for. Source: [ACC][acc].
- **`patient-certificates`** should name the three certificates doctors here write: ACC's work certificate (ACC18), Work and Income's work-capacity certificate, and the driver-licence medical certificate (DL9). Sources: [ACC][acc], [Work and Income][wcmc], [NZTA guide][nzta].

### 1e. In the kit but not in the New Zealand build (2)

| Key | Name | Verdict | Why |
|---|---|---|---|
| `sablonlarim` | My templates | **revise**: switch on | No clinical content; the pack simply does not list it. |
| `konsultasyonlar` | Consultations | unverified (still, second pass) | A legal question (sharing a note with a colleague, and the consent sentence): for a lawyer, not a clinician. |

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
| `psychiatry` | Psychiatry | keep | Psychiatry | none today. PHQ-9 and GAD-7; cognitive screen; alcohol score (second pass: the outcome measures were dropped) |
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


### Read in the second pass (2026-10-10)

[p2-concussion]: https://acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf "ACC — Sport Concussion in New Zealand: National Guidelines (updated January 2026); read again"
[p2-ckd]: https://bpac.org.nz/2022/docs/ckd.pdf "bpacnz — Chronic kidney disease: the canary in the coal mine (2022, with a box on the 2024 KDIGO update); PDF, read in full"
[p2-psa]: https://health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf "Ministry of Health — Prostate Cancer Management and Referral Guidance (September 2015); read again"
[p2-sa2622]: https://schedule.pharmac.govt.nz/latest/SA2622.pdf "Pharmac — Special Authority form SA2622, rituximab (rheumatoid arthritis), the version in force when read"
[p2-sa2624]: https://schedule.pharmac.govt.nz/latest/SA2624.pdf "Pharmac — Special Authority form SA2624, secukinumab (plaque psoriasis, ankylosing spondylitis, psoriatic arthritis), October 2026"
[p2-sa2599]: https://schedule.pharmac.govt.nz/latest/SA2599.pdf "Pharmac — Special Authority form SA2599, upadacitinib (atopic dermatitis, Crohn's disease, ulcerative colitis, rheumatoid arthritis), October 2026"
[p2-sa2619]: https://schedule.pharmac.govt.nz/pub/schedule/archive/2026/2026-08-10/forms/SA2619.pdf "Pharmac — Special Authority form SA2619, etanercept (August 2026)"
[p2-rheumrecord]: https://pharmac.govt.nz/assets/2021-05-14-Rheumatology-Subcommittee-record.pdf "Pharmac — Record of the Rheumatology Subcommittee of PTAC, 14 May 2021 (excerpts)"
[p2-pharmacpsoriasis]: https://www.pharmac.govt.nz/news-and-resources/consultations-and-decisions/2025-10-proposal-relating-to-funded-access-to-infliximab-etanercept-secukinumab-and-rituximab/proposed-changes-for-dermatology-conditions-plaque-psoriasis "Pharmac — proposed changes for dermatology conditions: plaque psoriasis (last updated 3 November 2025)"
[p2-bpacad]: https://bpac.org.nz/2025/atopic-dermatitis.aspx "bpacnz — atopic dermatitis article (3 October 2025)"
[p2-growth6]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/Specific-life-stage/child-health/Growth-Charts-v2/factsheet-6-growth-charts-well-child.pdf "Ministry of Health — New Zealand–WHO Growth Charts, Fact Sheet 6 (July 2010); read again (the charts themselves are not in the text returned)"
[p2-growth1]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/Specific-life-stage/child-health/Growth-Charts-v2/factsheet-1-growth-charts-well-child.pdf "Ministry of Health — New Zealand–WHO Growth Charts, Fact Sheet 1 (July 2010); read again"
[p2-acchearing]: https://www.acc.co.nz/assets/provider/assessment-hearing-loss-acc7917.pdf "ACC — Assessment of hearing loss (ACC7917); read again; the text returned stops in Appendix B"
[p2-hafs]: https://www.enable.co.nz/media/documents/hearing-aid-funding-scheme-eligibility-criteria-1706649794.docx "Hearing Aid Funding Scheme — eligibility criteria, as published on Enable New Zealand's site (the document names no issuer and no date)"
[p2-pomrc]: https://www.hqsc.govt.nz/assets/Our-work/Mortality-review-committee/POMRC/Publications-resources/POMRC_6th_Report_2017.pdf "Health Quality & Safety Commission — Perioperative Mortality Review Committee, sixth report (June 2017); the text returned stops before the appendices"
[p2-abbrev]: https://www.hqsc.govt.nz/assets/Medication-Safety/Alerts-PR/Poster-error-prone-abbreviations-not-to-use.pdf "Health Quality & Safety Commission — poster 'Error-prone abbreviations, symbols and dose designations not to use' (Medication Safety Expert Advisory Group, May 2012)"
[p2-chartstd]: https://www.hqsc.govt.nz/assets/Our-work/System-safety/Reducing-harm/Medicines/Publications-resources/Medication_Chart_Standard_v3.pdf "Health Quality & Safety Commission — Medication Charting Standard, version 3 (September 2012)"
[p2-medsafechild]: https://medsafe.govt.nz/consumers/educational-material/How%20to%20Safely%20Give%20Medicine%20to%20Children%2022Dec15.pdf "Medsafe — How to safely give medicine to children (December 2015; marked archived)"
[p2-weightalert]: https://www.hqsc.govt.nz/resources/resource-library/alert-prescribing-by-weight-in-children/ "Health Quality & Safety Commission — Alert: prescribing by weight in children (page dated 16 November 2021; the alert's recommendations are not on the page)"
[p2-cbc]: https://lab.waikatodhb.health.nz/assets/test-attachments/230/CBC-reference-intervals.pdf "Health New Zealand Waikato laboratory — CBC reference intervals (effective 14 November 2024)"
[p2-inhalerhealthify]: https://healthify.nz/assets/using-your-inhaler.pdf "Healthify — 'Using your inhaler' (Airways Education Group, 2003, reviewed 2008)"
[p2-inhalerpharmac]: https://pharmac.govt.nz/assets/ss-childrens-8-inhaler-check-lists-david-mcnamara-v2.pdf "Pharmac (hosted) — inhaler check lists for children's devices (no author or date in the text returned)"
[p2-maternityreferral]: https://www.tewhatuora.govt.nz/assets/Publications/Maternity/FINAL-Guidelines-for-Consultation-with-Obstetric-and-Related-Medical-Services-v3-1-1.pdf "Health New Zealand — Guidelines for Consultation with Obstetric and Related Medical Services (Referral Guidelines), March 2023"
[p2-parentalleave]: https://www.employment.govt.nz/leave-and-holidays/parental-leave/taking-parental-leave/requesting-parental-leave "Employment New Zealand — Requesting parental leave (last modified 30 June 2025)"
[p2-smoking]: https://health.govt.nz/system/files/2014-06/the-new-zealand-guidelines-for-helping-people-to-stop-smoking-2021.pdf "Ministry of Health — The New Zealand Guidelines for Helping People to Stop Smoking: 2021 Update"
[p2-alcohol]: https://bpac.org.nz/2018/alcohol.aspx "bpacnz — Assessment and management of alcohol misuse by primary care (16 November 2018)"
[p2-weight]: https://health.govt.nz/system/files/2017-11/clinical-guidelines-for-weight-management-in-new-zealand-adultsv2.pdf "Ministry of Health — Clinical Guidelines for Weight Management in New Zealand Adults (November 2017); the first 100,000 of 116,257 characters read"
[p2-dlqi]: https://cardiff.ac.uk/medicine/resources/quality-of-life-questionnaires/dermatology-life-quality-index "Cardiff University — Dermatology Life Quality Index (the owner's page)"
[p2-nzewspage]: https://hqsc.govt.nz/resources/resource-library/vital-signs-chart-with-new-zealand-early-warning-score "Health Quality & Safety Commission — Vital signs chart with New Zealand early warning score (resource page, 19 November 2021)"
[p2-pews]: https://www.hqsc.govt.nz/assets/Our-work/Improved-service-delivery/Patient-deterioration/Publications-resources/PVSC-user-guide-national-final_29March2023.pdf "Health Quality & Safety Commission — national paediatric early warning system and paediatric vital signs chart: user guide (March 2023)"
[p2-hqscsite]: https://www.hqsc.govt.nz/about-us/about-this-site/ "Health Quality & Safety Commission — About this site (copyright terms)"
[p2-hiso]: https://www.tewhatuora.govt.nz/assets/For-the-health-sector/HISO-100712025-Cardiovascular-Disease-Risk-Assessment-Data-Standard.pdf "Health New Zealand — HISO 10071:2025 Cardiovascular Disease Risk Assessment Data Standard (October 2025); read again in full"
[p2-rcpch]: https://www.rcpch.ac.uk/resources/how-get-growth-charts-data-terms-conditions-use "Royal College of Paediatrics and Child Health — How to get growth charts and data, and terms and conditions of use"
[p2-sdq]: https://www.sdqinfo.org/ "sdqinfo.org — Strengths and Difficulties Questionnaire (the owner's site, copyright terms)"
[p2-honospaper]: https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/health-of-the-nation-outcome-scales-honos/55BD9DCA7F2A95AEC649AD202D031363 "Wing JK, Beevor AS, Curtis RH, et al. Health of the Nation Outcome Scales (HoNOS): research and development. Br J Psychiatry 1998;172(1):11-18 (abstract page)"
[p2-tepou]: https://www.tepou.co.nz/outcomes/measures "Te Pou — HoNOS family of measures"
[p2-accwg]: https://www.mja.com.au/journal/2012/197/4/chronic-kidney-disease-and-automatic-reporting-estimated-glomerular-filtration "Johnson DW, et al.; Australasian Creatinine Consensus Working Group. Chronic kidney disease and automatic reporting of estimated glomerular filtration rate: new developments and revised recommendations. Med J Aust 2012;197(4):222-223"
[p2-miniace]: https://nzdementia.org/Mini-ACE "New Zealand Dementia Foundation — Mini-ACE; read again"
[p2-miniacepaper]: https://ueaeprints.uea.ac.uk/56646/ "Hsieh S, et al. The Mini-Addenbrooke's Cognitive Examination: a new assessment tool for dementia. Dement Geriatr Cogn Disord 2015;39(1-2) (repository record)"
[p2-afaudit]: https://bpac.org.nz/audits/anticoagulants-audit.aspx "bpacnz — Clinical audit: reviewing the use of anticoagulants in patients with atrial fibrillation (20 October 2022)"
[p2-healthnzcopyright]: https://info.health.nz/copyright "Health New Zealand — Copyright (info.health.nz)"
[p2-mohcopyright]: https://www.health.govt.nz/about-this-site/copyright "Ministry of Health — Copyright"
[p2-rfpage]: https://www.tewhatuora.govt.nz/publications/aotearoa-new-zealand-guidelines-for-the-prevention-diagnosis-and-management-of-acute-rheumatic-fever-and-rheumatic-heart-disease "Health New Zealand — Aotearoa New Zealand Guidelines for the Prevention, Diagnosis, and Management of Acute Rheumatic Fever and Rheumatic Heart Disease, 3rd edition (publication page, issued 5 May 2025)"
[p2-rfsummary]: https://www.tewhatuora.govt.nz/assets/Publications/Rheumatic-fever/Aotearoa-New-Zealand-Guidelines-for-the-Prevention-Diagnosis-and-Management-of-Acute-Rheumatic-Fever-Summary-guide-for-clinicians.docx "Health New Zealand — the same guidelines, summary guide for clinicians (2024 update)"
[p2-retinal]: https://www.tewhatuora.govt.nz/assets/Publications/Diabetes/diabetic-retinal-screening-grading-monitoring-referral-guidance-mar16.pdf "Ministry of Health — Diabetic Retinal Screening, Grading, Monitoring and Referral Guidance (March 2016); the document itself"
[p2-hearingregs]: https://legislation.govt.nz/secondary-legislation/pco-drafted/1999/167/en/latest/ "Accident Compensation (Occupational Hearing Assessment Procedures) Regulations 1999 (version as at 27 November 2025)"
[p2-strokeplan]: https://tewhatuora.govt.nz/assets/Corporate-information/Our-health-system/Strategic-initiatives-in-research-and-innovation/National-Stroke-Network-Workplan.pdf "National Stroke Network — Work Plan 2024-2029 (July 2024), on Health New Zealand's site"
[p2-osteo]: https://osteoporosis.org.nz/wp-content/uploads/Osteoporosis-Guidance-NZ.pdf "Osteoporosis New Zealand — Guidance on the Diagnosis and Management of Osteoporosis in New Zealand (2017)"
[p2-hypertension]: https://bpac.org.nz/2023/docs/hypertension.pdf "bpacnz — Hypertension in adults: the silent killer (January 2023)"
[p2-isotretinoin]: https://medsafe.govt.nz/committees/MARC/reports/174-Isotretinoin-%20review%20of%20(1)%20pregnancy%20prevention%20measures%20and(2)%20obsessive%20compulsive%20disorder_Redacted.pdf "Medsafe — paper for the Medicines Adverse Reactions Committee, 3 July 2018: isotretinoin, review of pregnancy prevention measures (the committee's advice is not in the text returned)"
[p2-stopmeds]: https://www.hqsc.govt.nz/assets/Our-work/System-safety/Reducing-harm/Medicines/Publications-resources/Stopping-medicines-in-older-people-practical-guide.pdf "bpacnz — A practical guide to stopping medicines in older people (Best Practice Journal 27, about 2010), hosted by the Health Quality & Safety Commission"
[p2-hepfoundation]: https://www.healthpoint.co.nz/community-health-and-social-services/community-health/the-hepatitis-foundation-of-new-zealand-2/print/ "Healthpoint — The Hepatitis Foundation of New Zealand (directory listing; no monitoring schedule on it)"
[p2-depression]: https://bpac.org.nz/BPJ/2009/adultdep/assessment.aspx "bpacnz — Assessment of depression in adults in primary care (July 2009)"
[p2-accprior]: https://www.acc.co.nz/for-providers/treatment-recovery/prior-approval-treatment "ACC — Getting prior approval for further treatment for allied health providers (last published 16 June 2026)"
[p2-edischarge]: https://www.tewhatuora.govt.nz/assets/Our-health-system/Digital-health/Health-information-standards/HISO-10011.4-2015-eDischarge-Messaging-Standard.pdf "Ministry of Health — HISO 10011.4:2015 eDischarge Messaging Standard (interim standard, July 2015)"
[p2-referrals]: https://tewhatuora.govt.nz/assets/Our-health-system/Digital-health/Health-information-standards/HISO-10011-1-Referrals-Status-and-Discharges-Business-Process-Standard.pdf "Health Information Standards Organisation — HISO 10011.1 Referrals, Status and Discharges Business Process Standard (February 2007)"
[p2-lithium]: https://bpac.org.nz/magazine/2007/february/pdfs/bpj3_lithium_pages16-27.pdf "bpacnz — Lithium in general practice (Best Practice Journal 3, 2007)"
[p2-hdccode]: https://www.hdc.org.nz/your-rights/about-the-code/code-of-health-and-disability-services-consumers-rights/ "Health and Disability Commissioner — Code of Health and Disability Services Consumers' Rights"
[p2-hipc]: https://www.privacy.org.nz/assets/DOCUMENTS/HIPC-Fact-Sheets/HIPC-Factsheet-3-Disclosure-of-Information-2025-Brand-Update-A1084409.pdf "Office of the Privacy Commissioner — Health Information Privacy Code fact sheet 3: disclosure of information"
[p2-labform]: https://www.lab.waikatodhb.health.nz/assets/Uploads/laboratory-form-essentials.pdf "Health New Zealand Waikato laboratory — laboratory form essentials (no date)"
[p2-legcopyright]: https://legislation.govt.nz/copyright/ "Parliamentary Counsel Office — Copyright (legislation.govt.nz)"
[p2-atspolicy]: https://acem.org.au/getmedia/484b39f1-7c99-427b-b46e-005b0cd6ac64/P06_Policy_Australasian_Triage_Scale "Australasian College for Emergency Medicine — P06 Policy on the Australasian Triage Scale, version 5 (November 2023)"
[p2-immhandbook]: https://tewhatuora.govt.nz/for-health-professionals/clinical-guidance/immunisation-handbook "Health New Zealand — Immunisation Handbook (the page returned reads '2024 version 3, released 1 July 2024'); read again"
[p2-triage]: https://tewhatuora.govt.nz/our-health-system/hospitals-and-specialist-services/emergency-departments/emergency-department-triage "Health New Zealand — Emergency department triage; read again"
[p2-snomed]: https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/snomed-ct-national-release-centre/snomed-ct "Health New Zealand — SNOMED CT National Release Centre: what SNOMED CT is"
[p2-nzulm]: https://www.tewhatuora.govt.nz/our-health-system/digital-health/emedicines-and-the-new-zealand-e-prescription-service/nz-universal-list-of-medicines "Health New Zealand — About the NZULM"
[p2-nzf]: https://www.health.govt.nz/our-work/digital-health/other-digital-health-initiatives/emedicines/new-zealand-formulary "Ministry of Health — About the NZ Formulary"
[p2-acutestroke]: https://www.tewhatuora.govt.nz/for-health-professionals/clinical-guidance/diseases-and-conditions/stroke/acute-stroke "Health New Zealand — Hyper-acute stroke care (holds the National Stroke Network's service specifications of August 2014)"
[p2-copdguidelines]: https://asthmafoundation.org.nz/resources/nz-copd-guidelines "Asthma and Respiratory Foundation NZ — NZ COPD Guidelines (resource page)"
[p2-us]: US.md "Notya audit of the United States, second pass (the shared kit arithmetic checked against primary publications) — docs/araclar-denetim/US.md, section 'Second pass (2026-10-10)' (branch araclar-denetim/us, commit 5a19decf)"
[p2-au]: AU.md "Notya audit of Australia, second pass (sources shared with New Zealand: the anaesthetists', obstetricians' and radiologists' colleges) — docs/araclar-denetim/AU.md, section 'Second pass (2026-10-10)' (branch araclar-denetim/au, commit db93ed45)"

The two last entries are the second-pass sections of the United States and Australian audits, on their own branches (`araclar-denetim/us` at `5a19decf`, `araclar-denetim/au` at `db93ed45`); the links work once those branches are merged beside this one.

Each link in this document carries its title; open the file as text to see the list. The [2020 contraception guidance][contraception] is the source for the contraception slot. Also read and used for context: the fracture-risk page of Osteoporosis New Zealand, the Healthify page on short stature, Starship's calculator and guideline-development pages, the commission's pages on the early warning systems, ACC's concussion page, the stroke guidelines' landing page, Health New Zealand's notifiable diseases page, DermNet's page on biological agents, and one journal article on chest pain in rural hospitals. Every address is in the data file under `sourcesRead`.
