# Doctor tools and specialties: what is right for Australia (`au`)

Written 2026-10-10 for Kaan (NOTYA-ARACLAR-DENETIM). Branch `araclar-denetim/au`, from `feat/ulke-butun`. The same decisions as data: `docs/araclar-denetim/au-kararlar.json`.

**What this is worth.** A machine wrote it by reading official Australian pages on one day. Nobody in Australia has read it: no clinician, no lawyer, no editor. It changes no code. "Keep" means "matches the page named beside it", never "approved". Where no Australian page could be read, the verdict is **unverified: needs a local clinician** and nothing is guessed. No dose, schedule, formula or threshold here comes from memory: a number appears only as a short quotation from the page it was read on. Nothing here says the product complies with, or is endorsed by, anything.

## Second pass (2026-10-10)

The first pass ran out of its search allowance after about 25 searches: 69 of the 100 verdicts were left "unverified" and 11 of the 25 proposed tools had no national source. This pass had an allowance of its own (120 searches; 95 were used) and went back to the sources. It changed this document and the data file and nothing else: no code, pack, test or kit file. Rows it resolved carry `pass: 2` in `au-kararlar.json`; in the tables of Part 1 a verdict cell that says "second pass" was changed here. Everything under the heading "First pass" is the first pass as it was written, except those verdict cells.

**How the sources were read.** Through a reading tool that returns the text of a page. Every figure taken from a source is as that tool returned it; nothing was written from memory. Before any number in the code is changed, an Australian clinician opens the source again. Nobody in Australia (no clinician, no lawyer) has read this, and no body named here has reviewed or endorsed anything.

**What was not checked again.** The arithmetic of the shared kit (the PASI, EASI, SCORAD and DAS28 formulas, the 28 joints, the antibiotic day count, the ASA class list, the kidney "low risk without a urine result" fault, the training-ratio warning) was checked against primary publications by the second pass of the United States audit. Those results are carried here by reference and marked "US second pass": `docs/araclar-denetim/US.md`, section "Second pass (2026-10-10)", on the branch `araclar-denetim/us` [135]. The searches of this pass went to what is specific to Australia.

### Counts before and after

| | First pass | Second pass |
|---|---|---|
| Keep | 8 | **29** |
| Revise | 22 | **52** |
| Remove | 1 | 1 |
| Unverified | 69 | **18** |
| of the 42 tools that are on: unverified | 23 | **1** |
| of the 52 shared slots: unverified | 45 | **16** |
| Proposed tools without a national source | 11 | **0** (10 now rest on an Australian source that was read; 1 merged into a slot) |
| Web searches used | about 25 | 95 of the 120 allowed |

Of the 29 kept: 22 are record lists with no number in them (below), 2 are the product's own screens, and 5 are tools checked against a source (patch-test days, visual acuity, expected height, DAS28, the 28-joint count). Of the 42 tools that are on: keep 29, revise 12, unverified 1.

### Faults confirmed, safety first

Rows 1, 3, 4, 5 and 8 are specific to Australia (row 1 because the tool is switched on here and not in the United States). Rows 2, 6, 7 and 9 are faults of the shared kit, the same in every country build that has the tool. Row 10 is both. Each example was run on the kit's own code today.

| # | Tool | State | What the code does | What the source read says | One example |
|---|---|---|---|---|---|
| 1 | Dose arithmetic by body weight (`doz-hesabi`) | **on** (off in the United States) | Prints every result with a fixed number of decimals | The national recommendations on medicines terminology: no trailing zeros, "use '5' not '5.0'", because 5.0 can be read as 50 [62] | A child of 16 kg at 10 mg/kg for one dose, liquid of 160 mg in 5 mL: the screen shows "160.00 mg" and "5.0 mL" |
| 2 | EASI score (`easi`) | **on** | Uses one set of region weights and never asks the age | The instrument's guide has a second set for children under 8 (US second pass) | A young child, head and neck only, all four signs 3, area score 6: the tool gives 7.2; with the guide's multiplier for that age the score is 14.4 |
| 3 | Stages of return to sport (`rtp-basamak`) | **on** | Records one of six stages numbered 0 to 5; holds no day count | The national framework: contact "Not before day 21 post concussion", only after 14 symptom-free days and a health practitioner's clearance; no earlier clearance under 19 [26] | "Stage 5: full training and return to competition" can be recorded on day 10 and the screen does not object |
| 4 | Pure-tone audiometry (`odyometri-pta`) | **on** | Averages four frequencies and calls up to 25 dB "Within normal limits" | The Government hearing program: a three-frequency average (0.5, 1, 2 kHz) of "23.3 decibel or more" is its minimum hearing loss threshold, each ear by itself [37] [60] | All four thresholds at 25 dB: "Within normal limits (up to 25 dB)"; the program's average is 25 dB and meets its threshold |
| 5 | PASI and EASI bands (`pasi`, `easi`) | **on** | "Moderate" from 10 to 19.9 (PASI) and from 7 to 20.9 (EASI) | The subsidy rules: severe psoriasis is a whole-body PASI above 15 [41]; severe atopic dermatitis starts at an EASI of at least 20 [125] | PASI 16 and EASI 20.0 both read "Moderate" on the screen and both meet the subsidy's limit for severe disease |
| 6 | Antibiotic course (`antibiyotik-sure`) | **on** | "Last day of the course" = start date plus the number of days | Counted from day 1, a course ends one day earlier (US second pass) | 7 days from 1 October: the tool shows 8 October; the last day is 7 October |
| 7 | ASA class (`asa-preop`) | **on** | Offers I to V and "E" as if E were a class; no VI | Six classes; E is a marker added to a class (US second pass). The Australian college asks for the "ASA risk classification" in the record and lists no classes of its own [123] | Choosing E gives "ASA E" with no class; ASA VI cannot be recorded |
| 8 | PSA: rate of change (`psa-hizi`) | **on** | Works out a yearly rate | The 2026 national guideline has no yearly rate: it uses levels by age and risk, a repeat test, MRI, density, and doubling time for men on surveillance [22] | The screen shows "Change in a year"; the national pathway gives that figure no meaning |
| 9 | Injury log (`sakatlik-gunlugu`) | **on** | Warns from a training ratio of 1.3 inclusive; divides minutes by minutes | The paper it cites puts 1.3 at the top of its low-risk range and uses effort multiplied by minutes (US second pass) | 390 minutes this week against a usual 300: ratio 1.3, "needs attention" |
| 10 | Kidney tools (`kdigo-evre`, `kdigo-serit`) | off | Classify in mg/g after converting; show a risk colour with no urine result | The handbook's limits are 3.0 and 30 mg/mmol, one set for everybody [13]; the risk cell needs two results (US second pass) | 3.0 mg/mmol is called A1 (the handbook: microalbuminuria); 31 mg/mmol is called A2 (the handbook: macroalbuminuria); an eGFR of 75 alone reads "low risk" |

Smaller faults of the shared code that apply here (US second pass): a PASI form with one box filled is scored as if every empty box were 0; a PASI, EASI or SCORAD of 0 is called "Mild"; a SCORAD of exactly 50 is called "Severe"; EASI half points cannot be entered; the audiometry tool flags a difference between the ears at exactly 15 dB. Standing from the first pass and not examined again: the made-up severity grade of the pain-and-function rating; the breast categories of the report outline (off); the American triage scale (off).

**Also for a lawyer.** The regulator's document on excluded software (July 2024) describes a calculator as excluded when it calculates from published clinical standards or authoritative sources, or shows its working so that the user can check it, and does not control the giving of a dose [111]. Its page on clinical decision support says exempt software is still a medical device, with a notice to the regulator and other duties, and gives a clinical scoring tool inside practice software as an example of exempt software [110]. This audit does not say which applies to any tool of this product.

### Checked against a source and found right

- **DAS28** for Australia: both formulas and the four bands (US second pass); the units are the Australian ones — the subsidy form for rheumatoid arthritis writes C-reactive protein in mg/L and the sedimentation rate in mm/hr [64], and a state public laboratory reports C-reactive protein in mg/L [65]. The unit trap found in the United States does not arise here.
- **The 28 joints**, the **PASI formula**, **EASI for a patient of 8 or over**, the **SCORAD formula** (all US second pass).
- **Expected height**: the first pass's "keep" stands (the Royal Children's Hospital's formula and its 8.5 cm either side). The paediatric endocrine society's page says nothing about it [63].
- **The pack's laboratory units**: mg/mmol for the urine albumin ratio (the handbook, read again [13]), µg/L for PSA (the guideline, read again [22]), and HbA1c written in both units (the RACGP's preventive-care guideline [67]).
- **Dose volume rounded to 0.1 mL**: no Australian source read states a rounding step, for or against [62] [124].
- **Growth charts**: the WHO standards under 2 are confirmed by both the paediatric endocrine society and the RACGP guideline. From 2, the society endorses its own charts for 2 to 18 and lists the CDC 2000 data set; the RACGP guideline allows CDC or WHO body-mass-index charts [63] [73].
- **"Anaesthetist"** in the two surgical checklists is the right word in Australia (the fault found in the United States does not apply).

### Every verdict that changed, and why

**(a) 22 tools that are on: unverified → keep, as record lists.** Each was opened in the code again. None holds a formula, weight, cut-off, band, grade, interval or stage: they are tick-boxes, choices and dates, so no guideline can confirm or contradict them and they no longer count as unverified clinical tools. Their wording still waits for an Australian clinician. In the data file: `recordOnly: true`.

Critical conditions checklist (`kritik-yol`) · Airway note (`hava-yolu-notu`) · Post-operative pain follow-up (`postop-agri`) · Checklist after a neurosurgical operation (`noro-postop`) · Seizure and consciousness follow-up (`nobet-bilinc`) · Checklist before and after an operation (`cocuk-prepost-op`) · Wound, drain and stitches follow-up (`yara-dren-izlem`) · Pre-operative checklist (`genel-preop`) · Insulin and thyroid treatment: date card (`rejim-karti`) · Checklist before a chest operation (`toraks-preop`) · Chest drain and wound follow-up (`toraks-tup-yara`) · Checklist before a heart or vascular operation (`kalp-damar-preop`) · Vascular graft and wound follow-up (`greft-yara-izlem`) · Antithrombotic treatment: review dates (`antikoagulan-vadeleri`) · Otoscopy note (`otoskopi-notu`) · Dialysis session and next date (`diyaliz-seans`) · Treatment cycle counter (`kur-sayaci`) · Side effects checklist (`toksisite-listesi`) · Fracture, cast and brace follow-up (`kirik-alci-takip`) · Post-operative checklist (`ortopedi-op-protokol`) · Wound, graft and flap follow-up (`plastik-yara-greft`) · Examination queue (`tetkik-kuyrugu`)

Twenty of them are the lists the United States second pass classed the same way. Two more are record lists here: the two surgical checklists, which the United States audit marks "revise" for a word that is correct in Australia. Three notes: the national sepsis standard was read and sets a time limit that the critical-conditions list does not name (the list neither repeats nor contradicts it) [82]; the College's guideline on the anaesthesia record gives no list of airway items to compare the airway note with [123]; and the cancer treatments site of the Cancer Institute NSW grades side effects, which the tick list does not (an option is proposed below) [85].

**(b) 3 tools that are on: the verdict changed on a source.**

| Tool | Was | Now | Why |
|---|---|---|---|
| ASA class and pre-operative checklist (`asa-preop`) | keep | **revise** | The shared class list is wrong (fault 7). Add VI; record E beside a class. |
| Dose arithmetic by body weight (`doz-hesabi`) | keep | **revise** | It is on here and writes trailing zeros against the national recommendations (fault 1). Print without them. |
| DAS28 (`das28`) | revise | **keep** | What the first pass could not confirm is confirmed, and the units are Australia's. The subsidy form does not use the score: it is for clinical follow-up. |

**(c) 29 slots: unverified → revise.** For each, the Australian source that would fill it, or its owner's licence terms, is now known and should be written into the slot. A slot stays empty and switched off until an Australian clinician (or a lawyer) supplies and signs its content.

| Slot | What is now known | Source |
|---|---|---|
| Prescription drafting (`prescription`) | Electronic prescriptions come from software that declares conformance with the Digital Health Agency's framework and connects to a prescription delivery service; anything printed follows the national terminology recommendations | [109] [62] |
| Visit and discharge summary (`visit-summary-document`) | National guidelines set sixteen components for a hospital discharge summary; they do not cover a specialist's letter | [132] |
| Medicine interactions (`medicine-interactions`) | One publisher's terms: a paid licence for internal use, nothing to be copied into another product | [134] |
| Certificates for patients (`patient-certificates`) | The Centrelink Medical Certificate (SU415); a doctor's own certificate is also accepted. State certificates not read | [112] |
| Laboratory and imaging requests (`test-requests`) | The details a request must carry under Medicare; a request may be electronic | [131] |
| Vaccination schedule and screening programmes (`family-vaccination-screening`) | The national schedule, handbook and catch-up calculator (under 20); the RACGP's preventive-care guideline, 10th edition; the lung screening criteria on the Department's page | [100] [67] [97] |
| Diabetes and blood pressure follow-up intervals (`family-chronic`) | The RACGP's diabetes handbook gives an interval for each check; the hypertension guideline gives none | [118] [114] |
| Review of medicines in older patients (`polypharmacy`) | The RACGP's aged care guide names the criteria lists and the two funded reviews; it sets no interval | [119] |
| Anticoagulation review (`anticoagulation-review`) | The Australian guideline uses the CHA2DS2-VA score and says bleeding scores are not a reason to withhold | [76] |
| Bone densitometry repeat (`dxa-tekrar`) | Medicare's intervals for people of 70 and over; the RACGP guideline's rule against early repeats | [106] [68] |
| HIV and viral hepatitis follow-up (`viral-izlem`) | ASHM's hepatitis B toolkit and HIV monitoring table; the hepatitis C consensus statement (2016 summary) | [107] [133] [122] |
| Isolation and notification (`notifiable-diseases`) | A national list under the National Health Security Act 2007, and a list in each state and territory | [101] |
| BASDAI (`basdai`) | The subsidy form requires "a BASDAI score of at least 4 on a 0–10 scale" and prints the questions; the owner's terms were not found | [102] |
| Blood pressure, heart failure and atrial fibrillation follow-up (`kardiyo-izlem`) | The three Australian guidelines, read in summary: none gives review intervals | [114] [115] [76] |
| COPD Assessment Test with the mMRC grade (`cat-mmrc`) | The COPD-X Handbook names and prints both; the test's owner requires a signed agreement (US second pass) | [79] |
| Bowel disease activity index (`ibd-skor`) | The subsidy system uses the Crohn's Disease Activity Index for adults (form PB393) | [116] |
| Hepatitis B and C follow-up (`hepatit-izlem`) | As for the infectious-diseases slot | [107] [122] |
| Pregnancy calendar (`pregnancy-calendar`) | The obstetricians' college statement (no arithmetic) and a state body's rule; the national guideline refuses automated readers | [120] [92] |
| Maternity leave dates and certificate (`maternity-leave`) | Parental Leave Pay is claimed from Services Australia with proof of birth; the page names no doctor's certificate with dates. Do not build as designed | [113] |
| Medical eligibility for contraception (`contraception-eligibility`) | An RACGP journal article follows the UK criteria, endorsed by Family Planning Alliance Australia | [105] |
| Stroke and TIA red flags (`stroke-red-flags`) | The Stroke Foundation's guidelines: FAST, urgent assessment of every suspected TIA, no reliance on one score | [117] |
| MIDAS (`midas`) | All rights reserved (US second pass) | [135] |
| Vaccination schedule and catch-up (`vaccination-schedule`) | The national schedule, handbook and catch-up calculator | [100] |
| M-CHAT-R/F (`mchat-rf`) | The national autism guideline names no instrument; the authors' agreement is needed (US second pass) | [104] |
| PHQ-9 and GAD-7 (`phq9-gad7`) | Free to use (US second pass), but Australian documents name the K10 and the DASS-21 first | [89] [70] |
| Critical-finding notice (`critical-finding-notice`) | The radiologists' college has a position statement (2024); only its page was read | [108] |
| IPSS (`ipss`) | A Government-funded body calls it a validated tool; no guideline and no licence read | [103] |
| Session plan (`rehabilitation-session-plan`) | Medicare: five allied health services a year under a general practitioner's plan, with reports back | [121] |
| Pain scale with the Oswestry Disability Index (`pain-odi`) | A fee for commercial users (US second pass) | [135] |

**(d) Verdict unchanged, findings added** (the rows in the data file say what): PASI, EASI and SCORAD (formulas confirmed; band faults; the subsidy limit for eczema confirmed on a 2025 document), the antibiotic day count, pure-tone audiometry, PSA rate of change, return to sport, the injury log, the 28-joint count, both kidney tools, the report outline, the American triage scale, and the slots for cardiovascular risk, HbA1c and TSH, the asthma and COPD action plan, and growth charts.

### The Australian versions of the shared items

| Item | What the Australian source says | Where the code stands |
|---|---|---|
| Hearing grades and frequencies | The Government program averages three frequencies and sets 23.3 dB; no grade table from the audiologists' body was found; one table read (a Senate report) begins "mild" at 25 dB for adults [60] [61] | Four frequencies, "normal" up to 25 dB: **revise** (fault 4) |
| Concussion: stages and minimum days | The framework, read again [26] | Six stages, no days: **revise** (fault 3) |
| Albuminuria categories and referral | Categories read again: 3.0 and 30 mg/mmol [13]. The handbook's referral list is **still unread**: the text returned stops before it | Tools off; limits differ: **revise** (fault 10) |
| PSA in the 2026 guideline | Read again: no velocity [22] | **revise** (fault 8) |
| Growth charts and expected height | WHO standards under 2; from 2, the paediatric endocrine society's own charts (2 to 18) or the CDC 2000 data set [63] [73]; the height tool matches the Royal Children's Hospital (first pass) | Height tool: **keep**; the chart slot: a paediatrician chooses between the society's charts and the CDC data for ages 2 and over |
| DAS28 and CRP/ESR units | mg/L and mm/hr [64] [65]; the subsidy form uses no composite score | **keep** |
| PASI and EASI in the subsidy criteria | PASI above 15 [41]; EASI at least 20, confirmed on a 2025 document [125]; two PASI forms (whole body; face, hand and foot) [126] | Bands disagree: **revise** (fault 5) |
| ASA classes as the college writes them | The College asks for the classification in the record and lists no classes [123]; the Medicare pages read show a "physical status indicator" without a class list [84]. No Australian page writes the classes out | The list is the American society's and the tool has it wrong: **revise** (fault 7) |
| Dose-volume rounding | **None was found.** The national recommendations cover how a dose is written (no trailing zeros) and give no rounding step [62] | Rounding stands unverified; trailing zeros: **revise** (fault 1) |

### The pages the first pass could not read

| Page | Now |
|---|---|
| RACGP preventive-care guideline (10th edition) | **Read in part**: diabetes, osteoporosis, dementia, depression, overweight, kidney, childhood, and the first 66 pages of the whole file [67] [68] [69] [70] [71] [72] [73] [74]. Not read: cardiovascular risk, anxiety, perinatal depression, the licence page |
| Heart Foundation guidelines | **Read in journal summaries**: atrial fibrillation, heart failure, hypertension [76] [115] [114]. Acute coronary syndromes: not read |
| The asthma handbook and the COPD guideline | **Read**: the handbook's page on action plans; the COPD-X summary and Handbook [77] [78] [79] |
| The national cancer-protocols site | **Read**: two pages (the patient assessment tool; a grading table) [85] [86] |
| The diabetes risk tool | **Read**: the Department's page and the tool [80] [81] |
| The sepsis standard | **Read** (the first 100,000 characters) [82] |
| The breast-category comparison | **Still not read**: the reading tool would not fetch the document; the College's page was read again |
| The pathologists' PSA reporting guideline | **Still not read**: it failed with an error again; the pathologists' manual page was read instead [87] |
| The heart-risk calculator's terms of use | **Read again**: the page is a disclaimer with a copyright line and no licence terms [17] |
| Medicare's page on anaesthesia items | **Read** this time; it has no class list [84] |

### Licence terms, as read

On the owner's own page unless the row says otherwise. "Free" and "needs permission" are my reading of the page, not legal advice.

| What | Result | What the page says | Page |
|---|---|---|---|
| Australasian Triage Scale | **needs permission** | First pass: the College's two documents are marked all rights reserved. Not read again | [10] [11] |
| Aus CVD Risk calculator | **unclear: treat as needing permission** | The owner's "terms of use" page holds a disclaimer and a Commonwealth copyright line; no licence, no way to ask for one | [17] |
| Kidney Health Australia chart | **needs permission** | No part may be reproduced without written permission. The limits themselves are facts | [13] |
| Concussion framework | **needs permission for a commercial product** | A Creative Commons licence, non-commercial and no derivatives: "This licence does not provide for the commercial or derivative use of ASC copyright material." A request form exists | [98] |
| Breast imaging categories | **needs permission** | First pass (Cancer Australia's document); the College reserves all rights. BI-RADS needs the American College of Radiology's licence (US second pass) | [29] [28] |
| PHQ-9, GAD-7 | **free** | US second pass: the owner's notice, as copied by LOINC; the owner's own site refuses automated readers, so a person should open it once | [135] |
| K10 | **free** | "Use of the K6 and K10 is free and does not require any formal permission or approval." Cite the article; show the copyright line | [88] |
| DASS-21 | **free, with conditions** | Public domain. Not on a public-facing site or app; scores not shown to the respondent; not to be sold | [90] |
| AUSDRISK | **needs permission** | The Commonwealth owns the copyright; the Department prefers a link and must be contacted before the tool is reproduced | [80] |
| Growth data | **CDC free; WHO needs permission** | US second pass. The paediatric endocrine society's own charts carry no terms on the page read | [135] [63] |
| ASA class text | **needs permission** | US second pass: the society's terms forbid reproduction without written consent. The tool shows class numbers only. The Australian college's guideline is marked all rights reserved | [135] [123] |
| PASI, EASI, SCORAD, DAS28 | **unclear** (EASI leaning free) | US second pass, on the owners' pages where one exists | [135] |
| 2026 prostate guideline | **needs permission** | Read again: personal use, no commercial purpose | [22] |
| Edinburgh Postnatal Depression Scale | **needs permission** | US second pass: copyright of the Royal College of Psychiatrists | [135] |
| GPCOG | **unclear: treat as needing permission** | Copyright of the University of New South Wales; "Used with permission." on the copy read. The owner's site was not read | [99] |
| FRAX; the Garvan calculator | **unclear: link, do not rebuild** | The RACGP says the FRAX algorithm is not publicly available; the Garvan terms were not found | [75] |
| Epworth Sleepiness Scale | **needs a licence** | US second pass: a licence for every use. STOP-Bang, OSA50 and the Berlin Questionnaire were not read | [135] |
| ECOG; CTCAE | **ECOG free with a credit line; CTCAE unclear** | US second pass. The cancer site's own pages are copyright of the Cancer Institute NSW | [135] [85] |
| FIB-4; CHA2DS2-VA | **free as arithmetic** | Published in the Australian statements that recommend them; the statements' text is not free to copy | [94] [76] |
| The Commission's documents (terminology, sepsis, discharge summaries) | **text needs permission for commercial use** | Creative Commons, non-commercial, no derivatives. The rules they state are facts | [62] [82] [132] |
| RACGP preventive-care guideline | **unclear** | Its licence page could not be read | [74] |
| Australian Medicines Handbook | **paid** | Internal use only; no copying or passing on | [134] |
| Questionnaires named in slots | **needs permission** (each) | US second pass: the COPD Assessment Test, M-CHAT-R/F, the Oswestry index, MIDAS. BASDAI and IPSS: not found or not read | [135] |

### The 11 proposals that had no national source

**10 kept.** For each, an Australian body's page naming or recommending it was read today. "Publication" says how far the paper that defines the tool was reached: for most, only as far as its citation, or not at all — the formula, items and limits were **not** read from it and none is given here. A clinician confirms each; the owner opens the rights holder's terms before anything is built.

| Proposal | Australian source read | The defining publication | Licence | Note |
|---|---|---|---|---|
| Body mass index and waist measurement (`au-body-size`) | The Department's page [96]; the RACGP guideline [71] | The arithmetic is on the Department's page | free as arithmetic | Body surface area is dropped: no Australian page naming a formula was found. Not for children. The RACGP guideline gives lower limits for people of several backgrounds |
| K10, with the DASS-21 as a second choice (`au-mental-health-screen`) | The Department's information on the GP mental health treatment plan [89] | Kessler and colleagues 2003 (as cited by the owner; not opened) | free; the DASS-21 with conditions | The plan must include an outcome tool unless clinically inappropriate. Screening everybody is not recommended [70] |
| AUSDRISK (`au-diabetes-risk`) | The Department [80] [81]; the RACGP guideline [67] | The tool itself; its paper found by title only | needs permission | A link and a field for the score until the Department agrees |
| Absolute fracture risk: record a FRAX result (`au-fracture-risk`) | The RACGP guideline: "Use FRAX®" [68] | Not reachable: the algorithm is not public [75] | unclear: link only | The Garvan calculator is named as an alternative |
| Stroke risk in atrial fibrillation: CHA2DS2-VA (`au-af-stroke-bleeding-risk`) | The 2018 guideline, in summary [76] | Brieger and colleagues 2018 (summary read; the points are in the full guideline) | arithmetic | The bleeding half is dropped: the guideline says such scores are not a reason to withhold anticoagulation |
| Edinburgh Postnatal Depression Scale (`au-perinatal-depression-screen`) | The 2023 national perinatal guideline, summary for general practitioners [91] | Not opened | needs permission | The guideline states when to screen and what to do at each score range |
| Cognitive tests for case finding: GPCOG, RUDAS, KICA-Cog (`au-cognitive-screen`) | The RACGP guideline [69] | Not opened | unclear | Screening everybody is NOT recommended; these are for a doctor who has a concern |
| Sleep apnoea questionnaires for direct referral (`au-sleepiness-scale`) | Medicare's note for the sleep study items [93] | Not opened | Epworth needs a licence | The payer asks for a screening questionnaire with an Epworth score. The note read is from 2019. For general practice too |
| ECOG performance status and graded side effects (`au-oncology-grading`) | The Cancer Institute NSW's assessment tool [85] [86] | Oken and colleagues 1982 (as cited by the group; not opened); CTCAE version 5.0 | ECOG free with a credit line; CTCAE unclear | A state body's tool: an oncologist says whether other states grade the same way |
| Liver fibrosis index, FIB-4 (`au-liver-fibrosis`) | The consensus statement, accepted by the RACGP [94] [95] | Adams and colleagues 2025 (read: it gives the limits); the index's own paper not opened | arithmetic | A second test for a middle result; referral above the upper limit |

**1 merged.** Pregnancy dating (`au-pregnancy-dating`) is merged into the existing slot `pregnancy-calendar`, whose sources are now named.

The 14 proposals that already had a source stand. Four were confirmed further: lung screening on the Department's own page [97], the hearing-program rule [60], the eczema subsidy limit [125], and the concussion framework's licence [98].

One clinic-role verdict of Part 3 was confirmed: only psychologists who hold an endorsement may use the titles of the endorsed areas, so "Psychologist" is the safe name [128].

### Still unverified, and why

**1 tool that is on.** Vertigo: positional test note (`vertigo-notu`). It holds no number, but it holds a clinical rule (any of six "central signs" means a repositioning manoeuvre is "not indicated"). The RACGP's handbook entry on the manoeuvre was read and has no such rule and no list of central signs [66]; no Australian guideline on positional vertigo was found.

**16 slots and 1 kit screen**, in six groups:

| Group | Which | Exact reason |
|---|---|---|
| Wait on other slots (4) | End-of-visit flow; the follow-up panels of general practice, obstetrics and gynaecology, paediatrics | Nothing to check until the slots they collect from are filled |
| Law (2 slots, 1 kit screen) | Consent for an operation on a child; safety and emergency triage in psychiatry; consultations between doctors | State and territory law, or a consent wording: a lawyer, not a web page |
| A search found no Australian source (5) | Isotretinoin pregnancy-prevention checks; CRP and ESR follow-up; monitoring of antiseizure medicines; monitoring of psychotropic medicines; haematuria and stone triage | Isotretinoin: two searches surfaced no Australian routine. CRP and ESR: the only limits read are subsidy criteria. Antiseizure medicines: a 2007 journal commentary only [129]. Psychotropic medicines: one review, lithium only [130]. Haematuria: state referral criteria only, not read |
| Not searched for (3) | Emergency admission, referral and discharge package; referral and emergency triage in primary care; obstetric risk prompts | No search was spent on them |
| Partly read (1) | Development and screening panel | The RACGP guideline's childhood chapter was read [73]; its chapter on developmental delay was not; the states run their own child health checks |
| To be written locally (1) | Home exercise sheet | Every sentence is an instruction to a patient |

**Inside tools that now have a verdict**, these remain open: the kidney handbook's list of reasons to refer to a nephrologist and the Kidney Failure Risk Equation; an Australian grade table for hearing loss; an Australian page that writes out the ASA classes; an Australian rule for rounding a dose volume; and the points and limits of every proposed score, which a clinician takes from the named source.

Part 3's open questions (how common the proposed specialties are; whether hair transplantation, "longevity" clinics, podiatry and speech pathology are a market) were not reopened.

### Pages that could not be read in this pass

Recorded and left: no cache, mirror or other tool was used to get round a refusal, and no robot check was answered.

- **Refused to automated readers:** the national data standard for degree of hearing impairment (meteor.aihw.gov.au); the regulator's page of examples of regulated and excluded software (tga.gov.au); the national pregnancy care guidelines (beta.health.gov.au).
- **The reading tool would not fetch the address:** the Medicare item for the anaesthesia physical-status modifier (www9.health.gov.au; no search surfaced it); the radiologists' comparison of the two breast-category systems; four pages of the RACGP guideline (cardiovascular risk, anxiety, perinatal depression, "provided under licence"). For the last five, and for five other chapters that were read later, the tool turned a direct request into a permission request, which went unanswered. After that no address was tried unless a search had surfaced it.
- **The fetch failed:** the pathologists' guideline on reporting PSA (rcpa.edu.au), as in the first pass.
- **Returned nothing useful:** the online kidney handbook (handbook.kidney.org.au: no text); the live subsidy restriction for atopic dermatitis ("Cannot find restriction", as in the first pass); a Psychology Board page (not found); a copy of the PSA statement on the urologists' site (a webinar notice).
- **Read only in part:** the kidney handbook (the text stops before the referral section); the RACGP guideline as one file (about the first 66 pages); the sepsis standard (the first 100,000 characters); the RACGP diabetes handbook page (all but its last 2,400 characters).
- **Read only as the page that links to it:** the radiologists' position statement on critical results; the electronic prescribing requirements.

### Where the searching stopped

95 of the 120 searches were used, in the order asked: the tools that are on and the Australian versions of the shared items first, then the pages the first pass could not read, then licences, then the 11 proposals, then slots. The allowance was not refused. The search stopped because what is left is one of four kinds: rows that no web page settles (law; panels that wait on other slots; a sheet a clinician must write), rows whose source refuses automated readers or returns no text, rows for which a search found no Australian source, and three slots that were not searched for. Those three, and the kidney handbook's referral page, are named above so that a later pass, or a person with the printed handbook, can begin with them.

## First pass (2026-10-10, earlier the same day)

What follows is the first pass as it was written. Its counts are the first pass's; where the second pass changed a verdict, the verdict cell in Part 1 says so and the section above gives the reason.

## The answer in one paragraph

The Australian build is safe today mostly because it is nearly empty. Its inventory holds 100 tools: 42 are switched on, 56 are empty or closed slots, and 2 exist only in the kit. All but one of the tools that are on belong to a single specialty, so **general practice sees one tile: "Patient's page"**; so do cardiology, neurology, psychiatry, obstetrics, gastroenterology, general medicine, rehabilitation medicine and all ten clinic roles. Checked against Australian sources: **8 tools can stay as they are, 22 must change (11 of them are on today), 1 must go (the American triage scale; Australia has its own), and 69 could not be checked against any Australian page in this session** and stay as they are until a local clinician reads them. The corrections that matter most: the kidney tool, rightly off, must be rebuilt on Kidney Health Australia's handbook (other units, other limits, and a colour chart that differs from the international one in two cells); the return-to-sport tool, which is on, does not carry Australia's 14-day and 21-day concussion rules; the PSA tool, on, works out a figure the 2026 national guideline does not use; the hearing tool, on, can say "within normal limits" where the Government hearing program counts a loss; the psoriasis and eczema bands, on, disagree with the subsidy limits; and the antibiotic day-counter, on in every country, is one day out. The core set proposed for Australia has 15 tools, of which 3 exist, 6 more rest on a national source that was read, and 6 wait for a local clinician. The Australian tools doctors would expect first (the national heart-risk calculator, the triage scale, the kidney chart, the PSA pathway) all belong to bodies that reserve their rights: permission comes before building. Specialties: 24 of the 30 names are right, 6 need the Medical Board's wording (three were already corrected on the earlier audit branch), none needs removing, 5 recognised specialties could be added. Of the 10 clinic roles, 5 stay, 2 are renamed, 1 should go and 2 are for a lawyer. **The kit cannot yet apply most of this to Australia alone**: the five English-speaking countries share one tool list, one set of forty roles and one answer to "who sees which tool".

## How to read the tables

- **Verdicts.** *keep*: matches the Australian source named. *revise*: something must change, and the cell says what. *remove*: not used here. *unverified*: no Australian page could be read; leave it as it is and have a local clinician decide.
- **State.** *on*: a doctor can open it today. *slot*: an empty, switched-off place-holder that no screen shows. *absent*: the kit has it, the English texts do not.
- **Base or specialty.** *base*: every role sees it. *specialty*: only the roles named.
- **Source.** A number in square brackets is a page in "Sources read" at the end; all were read on 2026-10-10.

## Part 1: every existing tool

100 tools in the inventory. Verdicts: keep 8, revise 22, remove 1, unverified 69. Of the 42 that are on: keep 8, revise 11, unverified 23. *(Those are the first pass's counts. After the second pass: keep 29, revise 52, remove 1, unverified 18; of the 42 that are on: keep 29, revise 12, unverified 1. A verdict cell that says "second pass" was changed there; the reason is in the section at the top and in the data file.)*

### 1.1 Tools whose result would be wrong or misleading in Australia

In order of concern. The first two are already off; the rest are on.

| # | Tool | State | What is wrong | Source |
|---|---|---|---|---|
| 1 | Chronic kidney disease categories (and the nephrology grid, `kdigo-serit`) (`kdigo-evre`) | off | Wrong limits for Australian units, and a colour chart that is not Australia's. The handbook's categories are "<3.0", "3.0-30" and ">30" mg/mmol; the kit's arithmetic would call 3.0 to about 3.4 normal. In the handbook macroalbuminuria is red "irrespective of eGFR" and an eGFR of 30 to 44 with microalbuminuria is orange; the kit shows orange and red the other way round in those two cells. | [13] |
| 2 | Structured report outline (`rapor-taslagi`) | off | Offers the American breast categories (0 to 6) only. Australian screening and, traditionally, diagnostic radiology use a five-category list where "3" means something else. | [28] |
| 3 | Stages of return to sport (`rtp-basamak`) | **on** | Six stages in the product's own words and no time rule, where the national guidelines require 14 symptom-free days before contact training and at least 21 days before competition, with a practitioner's review. | [25] |
| 4 | PSA: rate of change (`psa-hizi`) | **on** | Works out a yearly rate. The 2026 national guideline decides by PSA level for age and risk, a repeat test, MRI and PSA density; it does not use a yearly rate. | [22] |
| 5 | Pure-tone audiometry: average threshold (`odyometri-pta`) | **on** | Four-frequency average, "normal" up to 25 dB. The Government hearing program uses a three-frequency average and a threshold of 23.3 dB. | [37] |
| 6 | PASI score (and `easi`) (`pasi`) | **on** | The score is right; the words beside it are not. "Moderate" on the screen can be "severe" for the subsidy (PASI above 15; EASI of at least 20). | [41] |
| 7 | Antibiotic course: counting days (`antibiyotik-sure`) | **on, every country** | Shows the day AFTER the course ends as its "last day". | — |
| 8 | Pain and function rating (`vas-fonksiyon`) | **on, every country** | Gives a "mild / moderate / severe" grade from a weighting the product invented. | — |
| 9 | EASI score (`easi`) | **on** | Uses the weights for patients aged 8 or over and does not stop a younger child being scored. | [58] |
| 10 | DAS28 (`das28`) | **on** | Only the sedimentation-rate version and two of its three limits could be confirmed; the C-reactive-protein version shows the same bands unconfirmed. | [49] |
| 11 | Injury log (`sakatlik-gunlugu`) | **on** | Raises "high" and "needs attention" from two limits the literature itself disputes. | [50] |
| 12 | ESI triage level (`esi-triyaj`) | off | Not wrong arithmetic: the wrong scale. Australia uses the Australasian Triage Scale. | [10] |

**Also for a lawyer before any calculator is shown to Australian doctors:** the medicines regulator treats some software as a medical device and gives, as an example, apps that "calculate insulin doses based on a patient's blood glucose levels" [53]. Whether the dose arithmetic, the scores and the risk tools of this product fall under that rule was not established.

### 1.2 Switched on (42)

| Key | Name on screen | Base or specialty | Who sees it | Verdict | Finding, and what to change | Source | Licence |
|---|---|---|---|---|---|---|---|
| `hasta-portali` | Patient's page | base | every role | **keep** | None. A screen of the product with no clinical content; nothing national to check it against. | — | product screen |
| `takip-paneli` | Follow-up list | specialty | Emergency medicine, Anaesthesia, Neurosurgery, Paediatric surgery, Dermatology, Endocrinology, Infectious diseases, General surgery, Thoracic surgery, Respiratory and sleep medicine, Ophthalmology, Cardiac and vascular surgery, Otolaryngology, head and neck surgery, Nephrology, Oncology, Orthopaedic surgery, Paediatrics, Plastic surgery, Radiology, Rheumatology, Urology, Sport and exercise medicine | **keep** | A screen of the product with no clinical content. Make it a base tool in Australia: today the 18 roles without a tool of their own (general practice among them) do not have it. | — | product screen |
| `kritik-yol` | Critical conditions checklist | specialty | Emergency medicine | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. The national sepsis and acute coronary syndrome standards were not reachable, so the items (early ECG, sepsis measures, primary survey) were not compared with them. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `asa-preop` | ASA class and pre-operative checklist | specialty | Anaesthesia | **revise** (second pass, was keep) | Its items on fasting, consent and the written record match topics of the ANZCA guideline (5.10, 5.14, 5.20). That guideline does not name the ASA class; Medicare anaesthesia items do carry a "physical status indicator". The tool shows class numbers only and no definitions. | [47] | The class definitions belong to the American Society of Anesthesiologists; their terms were not read (unclear). The tool shows the class numbers only. |
| `hava-yolu-notu` | Airway note | specialty | Anaesthesia | **keep** (record list; second pass, was unverified) | The ANZCA guideline read has no airway-assessment section; the college's airway documents were not reached. Leave as it is until a local clinician of this specialty has read it. | [47] | the product's own list: no third-party content |
| `postop-agri` | Post-operative pain follow-up | specialty | Anaesthesia | **keep** (record list; second pass, was unverified) | A 0 to 10 pain score and observation flags, no medicine. The college's acute-pain documents were not reached. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `noro-postop` | Checklist after a neurosurgical operation | specialty | Neurosurgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `nobet-bilinc` | Seizure and consciousness follow-up | specialty | Neurosurgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `cocuk-prepost-op` | Checklist before and after an operation | specialty | Paediatric surgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Its consent line ("a parent or guardian") depends on state and territory law: for a lawyer. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `yara-dren-izlem` | Wound, drain and stitches follow-up | specialty | Paediatric surgery, General surgery | **keep** (record list; second pass, was unverified) | A record of dates and of drain output in mL; it holds no threshold. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `genel-preop` | Pre-operative checklist | specialty | General surgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `pasi` | PASI score | specialty | Dermatology | **revise** | The arithmetic is the published index. THE BAND LABELS MISLEAD HERE: the tool calls 10 to 19.9 "moderate" and 20 or above "severe", while the subsidy rule defines severe chronic plaque psoriasis as "a whole body PASI score > 15", and the Australian consensus counts PASI above 10 as moderate to severe. Remove the three bands (show the number only) or replace them with the Australian limits, signed by a dermatologist. The face, palm and sole rule of the subsidy form is not in the tool. | [41] | The index itself is a published formula (Fredriksson and Pettersson 1978; free to implement, primary paper not re-read). The subsidy criteria are Commonwealth copyright, reusable for personal reference only. |
| `easi` | EASI score | specialty | Dermatology | **revise** | Two things. (1) The tool calls 7 to 20.9 "moderate" and 21 or above "severe"; the subsidy rule for chronic severe atopic dermatitis starts at an EASI "baseline score of at least 20", so a patient at 20 is "moderate" on this screen and severe for the subsidy. The published severity bands themselves could not be read (the paper sits behind a page that refused the reader). Remove the bands or have a dermatologist set them. (2) The weights are those for a patient aged 8 or over only; the screen says so, but nothing stops its use for a younger child, where the result would be wrong. | [42] | Published index (Hanifin 2001); the terms of the authors for use inside a product were not read: unclear. |
| `scorad` | SCORAD index | specialty | Dermatology | **revise** | Small. The one source read gives the bands as below 25, 25 to 50, above 50; the tool calls exactly 50 "severe". The formula was not re-read from its primary paper in this session. A dermatologist confirms the bands, or they are removed. | [57] | Published index of the European Task Force on Atopic Dermatitis (1993); terms for use inside a product not read: unclear. |
| `yama-okuma` | Patch test: reading days | specialty | Dermatology | **keep** | Matches how the national funding protocol describes the visits: patches removed and read on day 2, final reading on day 4. | [45] | date arithmetic; free to implement |
| `rejim-karti` | Insulin and thyroid treatment: date card | specialty | Endocrinology | **keep** (record list; second pass, was unverified) | A record of dates only, no medicine and no dose. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `antibiyotik-sure` | Antibiotic course: counting days | specialty | Infectious diseases | **revise** | THE RESULT IS ONE DAY LATE. The tool adds the number of days to the start date and labels the answer "Last day of the course": a 7-day course started on 1 March is shown as ending on 8 March, which is its eighth day. Either subtract one day or relabel the result ("day after the course ends"). This is in the kit, so it is the same in every country build. The national antimicrobial stewardship standard was not reached. | — | date arithmetic; free to implement |
| `toraks-preop` | Checklist before a chest operation | specialty | Thoracic surgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. If the role is renamed "Cardio-thoracic surgery" (Part 3) this tool stays with it. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `toraks-tup-yara` | Chest drain and wound follow-up | specialty | Thoracic surgery | **keep** (record list; second pass, was unverified) | A record of dates and states. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `inhaler-teknik` | Inhaler technique | specialty | Respiratory and sleep medicine | **revise** | The steps agree with the national checklists of August 2025 (breath held "for about 5 - 10 seconds or as long as comfortable"; slow for a puffer and a soft mist inhaler, quick and deep for a dry powder inhaler; rinse after a corticosteroid). CHANGE WHO SEES IT: the national advice is to "check inhaler technique at every opportunity", which in Australia is mostly general practice and paediatrics, and today only respiratory physicians have the tool. Consider one line for the spacer with tidal breathing for young children, which the national checklist has and the tool lacks. | [34] | The tool is the product's own wording. The national checklists are "adapted with permission" from the Australian Commission on Safety and Quality in Health Care and are not to be copied. |
| `gorme-keskinligi` | Visual acuity: logMAR | specialty | Ophthalmology | **keep** | The conversion is arithmetic and takes any Snellen fraction, so the metric form used here (6/12, 6/9, as the national driving standard writes it) works as typed. An example in the label ("6/12") would help. | [40] | arithmetic; free to implement |
| `kalp-damar-preop` | Checklist before a heart or vascular operation | specialty | Cardiac and vascular surgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Australia divides this work into cardio-thoracic surgery and vascular surgery (Part 3): both would need it. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `greft-yara-izlem` | Vascular graft and wound follow-up | specialty | Cardiac and vascular surgery | **keep** (record list; second pass, was unverified) | A record of dates and states. No national page on this subject could be read in this session. Belongs with vascular surgery if the roles are renamed. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `antikoagulan-vadeleri` | Antithrombotic treatment: review dates | specialty | Cardiac and vascular surgery | **keep** (record list; second pass, was unverified) | A record of dates by class of medicine; no dose and no target. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `odyometri-pta` | Pure-tone audiometry: average threshold | specialty | Otolaryngology, head and neck surgery | **revise** | MISLEADING HERE. The tool averages four frequencies (0.5, 1, 2 and 4 kHz) and calls up to 25 dB "within normal limits". The Australian Government hearing program works with a THREE-frequency average (0.5, 1 and 2 kHz) and sets its minimum hearing loss threshold at 23.3 dB, so a patient the program counts as having a hearing loss can read "within normal limits" on this screen. The scale the tool cites (Clark 1981) also has a "slight" grade from 16 to 25 dB that the tool folds into "normal". Which average and which grades Australian audiology uses must be set by a local audiologist or ENT surgeon; until then show the average without a grade. Audiologists (a clinic role) do not see the tool at all today. | [37] | Arithmetic; free to implement. The grade names are from a published classification. |
| `otoskopi-notu` | Otoscopy note | specialty | Otolaryngology, head and neck surgery | **keep** (record list; second pass, was unverified) | A structured note of findings; no diagnosis. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `vertigo-notu` | Vertigo: positional test note | specialty | Otolaryngology, head and neck surgery | **unverified** | Its one rule (any sign of a central cause means a repositioning manoeuvre is "not indicated") was not compared with a national source. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `diyaliz-seans` | Dialysis session and next date | specialty | Nephrology | **keep** (record list; second pass, was unverified) | A record of dates. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `kur-sayaci` | Treatment cycle counter | specialty | Oncology | **keep** (record list; second pass, was unverified) | A counter and dates; no regimen. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `toksisite-listesi` | Side effects checklist | specialty | Oncology | **keep** (record list; second pass, was unverified) | A tick list with no grade. Oncology records side effects by grade (the United States National Cancer Institute criteria, five grades); whether and how Australian services require that could not be read (the national cancer-treatment site was not reachable). A local oncologist decides whether a tick list without grades is of use. | [59] | the product's own list: no third-party content |
| `kirik-alci-takip` | Fracture, cast and brace follow-up | specialty | Orthopaedic surgery | **keep** (record list; second pass, was unverified) | A record of dates and of the nerve and circulation check. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `ortopedi-op-protokol` | Post-operative checklist | specialty | Orthopaedic surgery | **keep** (record list; second pass, was unverified) | No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `vas-fonksiyon` | Pain and function rating | specialty | Orthopaedic surgery | **revise** | Remove the grade. The tool turns a pain score and four function items into "mild / moderate / severe" by a weighting of the product's own (the code says so: "not a published instrument"). A severity grade that no study stands behind should not be put in a patient's file in any country. Keep the two numbers; drop the band. What Australian orthopaedic practice uses for outcome scores was not reached. | — | The composite is the product's own; a replacement score would be somebody's instrument and need its licence. |
| `hedef-boy` | Expected height from the parents' heights | specialty | Paediatrics | **keep** | Checked line by line: the formula and the range are exactly those of the Royal Children's Hospital guideline (reviewed July 2025), including "8.5 cm on either side". General practice should see it too (Part 3). | [31] | Published formula (Tanner 1970); free to implement. The hospital's page is its own copyright and is not copied. |
| `doz-hesabi` | Dose arithmetic by body weight | specialty | Paediatrics | **revise** (second pass, was keep) | Arithmetic on numbers the doctor types, in kilograms, milligrams and millilitres; it holds no medicine and no dose, so there is no national content to check. TWO THINGS FOR OTHERS: (1) a lawyer must say whether a dose calculator is a medical device here: one of the regulator's own examples of software that is a medical device is an app that calculates insulin doses; (2) general practice sees children and would use it. | [53] | arithmetic; free to implement. Dosing references used here are subscription products and are not in the tool. |
| `plastik-yara-greft` | Wound, graft and flap follow-up | specialty | Plastic surgery | **keep** (record list; second pass, was unverified) | A record of dates. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `tetkik-kuyrugu` | Examination queue | specialty | Radiology | **keep** (record list; second pass, was unverified) | A worklist entry. No national page on this subject could be read in this session. Leave as it is until a local clinician of this specialty has read it. | — | the product's own list: no third-party content |
| `das28` | DAS28 disease activity score | specialty | Rheumatology | **keep** (second pass, was revise) | The version with the sedimentation rate matches the published formula, and the limits 2.6 and 3.2 match the published cut points. NOT VERIFIED in this session: the version with C-reactive protein (its formula and whether the same limits apply to it) and the upper limit 5.1. Until a rheumatologist confirms, show the bands for the sedimentation-rate version only. The laboratory units (mg/L, mm/h) were not confirmed from an Australian page. Whether Australian subsidy rules use this score at all was not read. | [49] | Published formula (Prevoo 1995); terms for use inside a product not read: unclear. |
| `eklem-28` | 28-joint count | specialty | Rheumatology | **keep** | A count of tender and swollen joints out of 28, as the published score takes them. | [49] | a count; free to implement |
| `psa-hizi` | Prostate-specific antigen: rate of change | specialty | Urology | **revise** | NOT WHAT THE NATIONAL GUIDELINE USES. The guideline approved by the NHMRC on 18 May 2026 works with PSA action levels by age and risk, a repeat test within one to three months, MRI as the next test and PSA density; the words "PSA velocity" do not appear in its summary of recommendations, and the only rate it names is "PSA doubling time < 3 years" for men on active surveillance. The tool therefore produces a number the national pathway gives no meaning to. Replace it with the pathway (Part 2) or, at least, with doubling time and density, set by a urologist. The unit is right: the guideline writes µg/L. | [22] | Arithmetic; free to implement. The guideline is copyright of the Prostate Cancer Foundation of Australia: no commercial use without written permission. |
| `rtp-basamak` | Stages of return to sport | specialty | Sport and exercise medicine | **revise** | DOES NOT CARRY THE AUSTRALIAN RULES. The tool records one of six stages of the product's own wording and "proposes no timing". The national guidelines (February 2024) have a different, longer sequence with fixed checkpoints: "at least 14 days symptom free (at rest) before return to contact/collision training" and "a minimum period of 21 days until the resumption of competitive contact/collision sport", with review by a health practitioner before contact, and no early clearance for athletes under 19. A doctor can record "Stage 5: full training and return to competition" on day 10 and the screen will not object. Rebuild on the national framework (with the owner's permission) or switch off. | [25] | The product's own wording today. The national framework is copyright of the Australian Sports Commission; its terms of reuse were not read: needs permission. |
| `sakatlik-gunlugu` | Injury log | specialty | Sport and exercise medicine | **revise** | The two limits (1.3 and 1.5) are the ones the literature attributes to Gabbett and to Blanch and Gabbett (2016), but the same paper lists their weaknesses and found no protective "sweet spot" in its own athletes. The primary paper could not be opened. Either drop the two warnings and show the ratio alone, or keep them with a line that the limits are disputed; a sport and exercise physician decides. | [50] | Arithmetic; free to implement. |

### 1.3 In the shared English set, kept off for Australia (4)

| Key | Name on screen | Base or specialty | Who sees it | Verdict | Finding, and what to change | Source | Licence |
|---|---|---|---|---|---|---|---|
| `esi-triyaj` | ESI triage level | specialty | Emergency medicine | **remove** | Not Australia's scale. Emergency departments here use the Australasian Triage Scale (five categories, each with a maximum waiting time), owned by the Australasian College for Emergency Medicine. Remove this tool from the Australian build and propose an ATS record in its place (Part 2). | [10] | The Emergency Severity Index has its own owner; not relevant here. |
| `kdigo-evre` | Chronic kidney disease: KDIGO categories | specialty | General medicine | **revise** | Rightly kept off. With the national handbook now read, TWO things must change before it is switched on. (1) Units and limits: Australian reports give the ratio in mg/mmol and the handbook's categories are "<3.0", "3.0-30" and ">30" mg/mmol; the kit converts to mg/g and uses 30 and 300, so a result from 3.0 to about 3.4 mg/mmol is called normal and one from just over 30 to about 33.9 is called micro- rather than macroalbuminuria. (2) The colours: the Australian handbook is not the KDIGO grid. In Australia macroalbuminuria is red "irrespective of eGFR" (the kit shows orange when the eGFR is 60 or above), and an eGFR of 30 to 44 with microalbuminuria is orange (the kit shows red). Rebuild on the handbook, rename it, and give it to general practice first: the handbook is written for primary care. | [13] | The handbook is copyright of Kidney Health Australia: "no part may be reproduced without written permission". The category limits are facts; the colour chart and action plans are theirs. |
| `kdigo-serit` | KDIGO grid: GFR and albuminuria | specialty | Nephrology | **revise** | The same two faults as the tool above (limits in mg/mmol; two cells of the colour chart differ from the Australian handbook). A nephrologist may prefer the international grid: that is a decision for a local nephrologist, and the screen must then say which grid it shows. | [13] | As above. |
| `rapor-taslagi` | Structured report outline | specialty | Radiology | **revise** | Rightly kept off. The only category list it offers is BI-RADS 0 to 6. The radiologists' college says the "Tabar/RANZCR classification" is "used in BreastScreen Australia" and "traditionally in diagnostic radiology as well": and the national synoptic breast imaging report lists five categories, 1 to 5, whose numbers do not all mean what the same BI-RADS numbers mean (3 is "Indeterminate/equivocal findings" here and "Probably benign" there; BI-RADS 0 and 6 have no counterpart). A report outline for Australia needs the Australian list as a choice (and must always print the name with the number), signed by a radiologist. The general outline without categories could be switched on by itself. | [28] | BI-RADS is "published and trademarked by the American College of Radiology": a licence question. The Australian category wording is copyright of the National Breast Cancer Centre (now Cancer Australia): written permission. |

### 1.4 Empty slots that every English-speaking build carries (52)

A slot is never shown. "Keep empty" means: right to leave off; build it only with Australian content, supplied and signed by a local clinician.

| Key | Name on screen | Base or specialty | Who sees it | Verdict | Finding, and what to change | Source | Licence |
|---|---|---|---|---|---|---|---|
| `prescription` | (slot) Prescription drafting | base | every role | **revise** (second pass, was unverified) | Keep empty. Medicine NAMES have a national source (the Australian Medicines Terminology, under licence: Part 2). The rules for electronic prescribing software and for controlled medicines were not read; the product must make no claim about them. | [51] | Medicine names: registration and two licence agreements. Dosing content: subscription publications, not read. |
| `visit-summary-document` | (slot) Visit and discharge summary as a document | base | every role | **revise** (second pass, was unverified) | No national page on this subject could be read in this session. In specialist practice the document is usually the letter back to the referring general practitioner; a local clinician sets the headings. | — | unclear |
| `diagnosis-coding` | (slot) Diagnosis coding | base | every role | **revise** | Say which coding. ICD-10-AM is the hospital classification ("to classify episodes of admitted patient care"); a clinic outside hospital would code, if at all, in SNOMED CT-AU from the National Clinical Terminology Service. Rewrite the slot to name SNOMED CT-AU and its licence, and leave ICD-10-AM out unless a hospital customer asks. | [51] | SNOMED CT-AU: registration, the SNOMED CT Affiliate Licence and the Australian National Terminology Licence Agreement, and a yearly statement of usage. ICD-10-AM: licence terms not on the page read (unclear). |
| `medicine-interactions` | (slot) Medicine interactions | base | every role | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. Interaction data is sold by publishers; no page was read. | — | paid licence expected; not read |
| `patient-certificates` | (slot) Certificates for patients | base | every role | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. Certificate forms (work, workers' compensation, social security) are set by Commonwealth and state bodies: for a lawyer. | — | unclear |
| `test-requests` | (slot) Laboratory and imaging requests | base | every role | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `end-of-visit` | (slot) End-of-visit flow | base | every role | **unverified** | Keep empty: it waits for the prescription and certificate slots. | — | product flow |
| `emergency-referral` | (slot) Emergency admission, referral and discharge package | specialty | Emergency medicine | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `family-vaccination-screening` | (slot) Vaccination schedule and screening programmes | specialty | General practice | **revise** (second pass, was unverified) | Keep empty. The national immunisation schedule and the college's preventive-care guideline could not be opened. One programme was confirmed and belongs here: the National Lung Cancer Screening Program (from 1 July 2025). | [56] | Commonwealth and college copyright; terms not read |
| `family-chronic` | (slot) Diabetes and blood pressure follow-up intervals | specialty | General practice | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `family-referral` | (slot) Referral and emergency triage in primary care | specialty | General practice | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `family-follow-up-panel` | (slot) Follow-up panel of general practice | specialty | General practice | **unverified** | Keep empty: it waits for the three slots above. | — | product screen |
| `child-surgery-consent` | (slot) Consent for an operation on a child | specialty | Paediatric surgery | **unverified** | Keep empty. Consent of minors is state and territory law: for a lawyer. | — | legal text |
| `cardiovascular-risk` | (slot) Cardiovascular risk | specialty | General medicine, Cardiology | **revise** | Three changes. (1) Name it: the Australian calculator (2023) gives FIVE-year risk (high is 10% or more), not ten-year. (2) Who sees it: the guideline is for primary prevention, so general practice comes first, then general medicine, cardiology, endocrinology and nephrology. (3) It cannot simply be built in: a major practice-software vendor (Best Practice) reported it "was not provided permission to embed the tool" and was told to link to the web version, while the Heart Foundation says a technical specification and an integration route exist. Until the owner has that permission, the tool is a link to the national calculator and a field to record the result. | [16] | Copyright of the Commonwealth (Department of Health); the site names no open licence. Needs permission. |
| `polypharmacy` | (slot) Review of medicines in older patients | specialty | General medicine | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | criteria under licence; not read |
| `anticoagulation-review` | (slot) Anticoagulation review | specialty | General medicine | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. The Heart Foundation's atrial fibrillation guideline could not be opened. | — | unclear |
| `isotretinoin-pregnancy-prevention` | (slot) Isotretinoin pregnancy-prevention checks | specialty | Dermatology | **unverified** | Keep empty. No national page on this subject could be read in this session. Whether Australia has a formal programme at all was not established. | — | unclear |
| `lab-izlem` | (slot) HbA1c and TSH follow-up | specialty | Endocrinology | **revise** | Keep empty, and change the mechanism first: Australian laboratories report HbA1c in both per cent and mmol/mol (the pathologists' manual writes both), and the kit's field has one unnamed unit. The twelve numbers were not found. An English-speaking pack also has no way to state a tool's numbers today (see "What the kit lacks"). | [55] | numbers from national guidance; not read |
| `dxa-tekrar` | (slot) Bone densitometry repeat | specialty | Endocrinology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `viral-izlem` | (slot) HIV and viral hepatitis follow-up | specialty | Infectious diseases | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `notifiable-diseases` | (slot) Isolation and notification | specialty | Infectious diseases | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. Notification is a Commonwealth list plus state and territory lists. | — | unclear |
| `anemi-izlem` | (slot) Anaemia follow-up in chronic kidney disease | specialty | Nephrology | **revise** | Keep empty, but the content exists: the national kidney handbook states a target ("Hb 100 – 115 g/L") in the unit the pack already uses. The intervals were not found in the part read. A nephrologist supplies the six numbers from the handbook; an English-speaking pack cannot state them today (see "What the kit lacks"). | [13] | Kidney Health Australia copyright: written permission to reproduce. |
| `iltihap-lab-izlem` | (slot) CRP and ESR follow-up | specialty | Rheumatology | **unverified** | No national page on this subject could be read in this session. No national guidance that sets bands and intervals for these two tests was found; a rheumatologist should say whether the tool is wanted at all. | — | unclear |
| `basdai` | (slot) BASDAI | specialty | Rheumatology | **revise** (second pass, was unverified) | Keep empty. A published questionnaire; its licence was not read. | — | unclear: not read; treat as needing permission |
| `kardiyo-izlem` | (slot) Blood pressure, heart failure and atrial fibrillation follow-up | specialty | Cardiology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. The Heart Foundation's guideline pages could not be opened. | — | unclear |
| `cat-mmrc` | (slot) COPD Assessment Test with the mMRC grade | specialty | Respiratory and sleep medicine | **revise** (second pass, was unverified) | Keep empty. The Australian COPD guideline and the questionnaire's licence page were not reached. | — | unclear: not read; treat as needing permission |
| `lung-action-plan` | (slot) Written action plan for asthma and COPD | specialty | Respiratory and sleep medicine | **revise** | Do not write one: Australia has a standard asthma action plan from the National Asthma Council (PDF, fillable PDF and a letter template), and the Council says it is "working towards inclusion of the asthma action plan in medical prescribing software programs". The tool is the Council's plan, by permission, and general practice and paediatrics need it more than respiratory physicians do. The COPD plan of the Lung Foundation was not reached. | [36] | National Asthma Council, all rights reserved: needs permission. |
| `ibd-skor` | (slot) Bowel disease activity index follow-up | specialty | Gastroenterology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `hepatit-izlem` | (slot) Hepatitis B and C follow-up | specialty | Gastroenterology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `pregnancy-calendar` | (slot) Pregnancy calendar | specialty | Obstetrics and gynaecology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `maternity-leave` | (slot) Maternity leave dates and certificate | specialty | Obstetrics and gynaecology | **revise** (second pass, was unverified) | No national page on this subject could be read in this session. The tool was designed around another country's leave law; whether doctors here issue anything like it is for a lawyer. Likely to be removed. | — | legal text |
| `contraception-eligibility` | (slot) Medical eligibility for contraception | specialty | Obstetrics and gynaecology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | criteria owned by their publisher; not read |
| `obstetric-risk` | (slot) Obstetric risk prompts and caesarean note | specialty | Obstetrics and gynaecology | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `obstetric-follow-up-panel` | (slot) Follow-up panel of obstetrics and gynaecology | specialty | Obstetrics and gynaecology | **unverified** | Keep empty: it waits for the slots above. | — | product screen |
| `stroke-red-flags` | (slot) Stroke and TIA red flags | specialty | Neurology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `midas` | (slot) MIDAS | specialty | Neurology | **revise** (second pass, was unverified) | Keep empty. A published questionnaire; its licence was not read. | — | unclear: not read; treat as needing permission |
| `antiseizure-monitoring` | (slot) Monitoring of antiseizure medicines | specialty | Neurology | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `growth-percentiles` | (slot) Growth and percentiles | specialty | Paediatrics | **revise** | The question the slot asks is answered: in 2012 "all Australian States and Territories agreed to adopt the World Health Organization (WHO) Growth Standards (2006) for all children aged 0 to 2 years"; the CDC charts "remain in use in most jurisdictions" for ages 2 to 18; the Northern Territory uses the WHO charts for that group too. The source is from 2013 and should be confirmed by a paediatrician. Build with those two data sets, a setting for the Northern Territory, and give it to general practice as well. | [32] | The WHO and CDC data are published by their owners; their terms for use inside a product were not read: unclear. |
| `vaccination-schedule` | (slot) Vaccination schedule and catch-up | specialty | Paediatrics | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. The national schedule and handbook could not be opened. | — | Commonwealth copyright; terms not read |
| `development-screening` | (slot) Development and screening panel | specialty | Paediatrics | **unverified** | Keep empty. No national page on this subject could be read in this session. Child health checks are run by the states and territories and differ. | — | unclear |
| `mchat-rf` | (slot) M-CHAT-R/F | specialty | Paediatrics | **revise** (second pass, was unverified) | Keep empty. A published questionnaire; its licence and whether Australian guidance prefers another instrument were not read. | — | unclear: not read; treat as needing permission |
| `paediatric-follow-up-panel` | (slot) Follow-up panel of paediatrics | specialty | Paediatrics | **unverified** | Keep empty: it waits for the slots above. | — | product screen |
| `plastic-surgery-consent` | (slot) Informed-consent checklist for plastic surgery | specialty | Plastic surgery | **revise** | The content is known and is strict: the Medical Board's guidelines (issued 1 July 2023) require, for cosmetic surgery, a referral, screening for body dysmorphic disorder with "a validated psychological screening tool" (none is named), at least two consultations, a cooling-off period of at least seven days (three months under 18), surgery in an accredited facility, and consent that cannot be delegated. Rebuild the slot as a checklist of those requirements, give it also to the "Cosmetic surgery" clinic role, and have a lawyer read it. It applies to cosmetic surgery, not to reconstructive plastic surgery. | [4] | Medical Board / Ahpra copyright; terms of reuse not read. Checklist items would be the product's own wording of public requirements: for a lawyer. |
| `phq9-gad7` | (slot) PHQ-9 and GAD-7 | specialty | Psychiatry | **revise** (second pass, was unverified) | Keep empty. The licence page was not read. Which questionnaires Australian general practice and mental health services use (other instruments are common here) could not be read either; general practice and psychologists, not only psychiatry, would need whichever is chosen. | — | unclear: not read; treat as needing permission |
| `psychiatry-safety-triage` | (slot) Safety and emergency triage | specialty | Psychiatry | **unverified** | Keep empty. No national page on this subject could be read in this session. Involuntary admission is state and territory law. | — | legal text |
| `psychotropic-monitoring` | (slot) Monitoring calendar of psychotropic medicines | specialty | Psychiatry | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `critical-finding-notice` | (slot) Critical-finding notice | specialty | Radiology | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. The radiologists' college standards could not be opened. | — | unclear |
| `ipss` | (slot) IPSS | specialty | Urology | **revise** (second pass, was unverified) | Keep empty. A published questionnaire; its licence was not read. | — | unclear: not read; treat as needing permission |
| `urology-emergency-triage` | (slot) Haematuria and stone emergency triage | specialty | Urology | **unverified** | Keep empty. No national page on this subject could be read in this session. | — | unclear |
| `rehabilitation-session-plan` | (slot) Session plan | specialty | Rehabilitation medicine | **revise** (second pass, was unverified) | Keep empty. No national page on this subject could be read in this session. Any limit on sessions here would come from Medicare or an insurer: payer rules, not read. | — | unclear |
| `pain-odi` | (slot) Pain scale with the Oswestry Disability Index | specialty | Rehabilitation medicine | **revise** (second pass, was unverified) | Keep empty. A questionnaire under licence; not read. | — | paid licence expected; not read |
| `home-exercise` | (slot) Home exercise sheet | specialty | Rehabilitation medicine | **unverified** | Keep empty: every sentence is an instruction to a patient and needs a local clinician. | — | to be written locally |

### 1.5 In the kit, not in the English set (2)

| Key | Name on screen | Base or specialty | Who sees it | Verdict | Finding, and what to change | Source | Licence |
|---|---|---|---|---|---|---|---|
| `sablonlarim` | My templates (no English name yet) | base | every role | **revise** | Switch on as a base tool. It is a screen of the kit for a doctor's own text blocks and brings no clinical content; the English set does not list it and the Australian pack does not switch the feature on. | — | product screen |
| `konsultasyonlar` | Consultations between doctors (no English name yet) | base | every role | **unverified** | Leave off. It needs a consent sentence and two periods that only a lawyer can settle for Australia. | — | product screen; legal text |

### 1.6 Laboratory units, settled or still open

The earlier audit left these to "a local person". Read in this session:

- **Urine albumin-to-creatinine ratio: mg/mmol** in the national kidney handbook [13]. The pathologists' manual page still writes its categories in mg/g [54]. The pack states mg/mmol; that matches the handbook. A pathologist should confirm.
- **Creatinine: µmol/L** (the national eGFR calculator [15]). **Haemoglobin: g/L** (the handbook [13]). **PSA: µg/L** (the 2026 guideline [22]). All three match the pack.
- **HbA1c: both per cent and mmol/mol** [55]; the kit's field has no unit choice.
- **C-reactive protein and sedimentation rate:** not confirmed.

## Part 2: Australia's core set, and tools to add

### 2.1 The core set (15 tools)

Türkiye's base set is built on Türkiye's state systems, and none of that carries over. What every Australian doctor needs regardless of specialty falls into two groups. "Ready" says honestly how far each is.

| # | Tool | For whom | National body or source | Ready? | Licence |
|---|---|---|---|---|---|
| 1 | Patient's page (`hasta-portali`) | every role | the product's own screen | on today | none |
| 2 | Follow-up list (`takip-paneli`) | every role | the product's own screen | on for 22 roles; make it base | none |
| 3 | My templates (no English name yet) (`sablonlarim`) | every role | the product's own screen | in the kit; needs English texts and the switch | none |
| 4 | (slot) Diagnosis coding (`diagnosis-coding`) | every role | SNOMED CT-AU, National Clinical Terminology Service [51]; ICD-10-AM is for hospital admissions [52] | slot; source read | registration and two licence agreements |
| 5 | Medicine names from the Australian Medicines Terminology (names only, no doses) (`au-medicine-names`) | every role | Australian Medicines Terminology, same service [51] | new; source read | registration and two licence agreements |
| 6 | (slot) Visit and discharge summary as a document (`visit-summary-document`) | every role | not read | slot; **unverified: needs a local clinician** | unclear |
| 7 | (slot) Certificates for patients (`patient-certificates`) | every role | not read | slot; **unverified: needs a lawyer and a local clinician** | unclear |
| 8 | (slot) Laboratory and imaging requests (`test-requests`) | every role | not read | slot; **unverified: needs a local clinician** | unclear |
| 9 | (slot) Medicine interactions (`medicine-interactions`) | every role | not read | slot; **unverified** | paid data expected; not read |
| 10 | Laboratory unit converter, with HbA1c in per cent and mmol/mol (`au-unit-converter`) | every role | RCPA Manual shows HbA1c in both units [55] | new; the HbA1c conversion equation was not read | arithmetic |
| 11 | Body mass index and body surface area (`au-body-size`) | every role | not read | new; **unverified: needs a local clinician** | expected free; not verified |
| 12 | Kidney function and CKD stage (eGFR, urine albumin-to-creatinine ratio, Kidney Health Australia colours) (`au-kidney-ckd`) | doctors who treat adults | Kidney Health Australia handbook, 5th edition [13]; eGFR calculator [15] | new (replaces two closed tools); source read | equation free; chart needs written permission |
| 13 | Aus CVD Risk: five-year cardiovascular risk (open the national calculator, record the result) (`au-cvd-risk`) | doctors who treat adults | Australian CVD risk guideline and calculator 2023 [16] | new (replaces a slot); source read; **link and record only until permission** | needs permission |
| 14 | Fitness to drive: record against the national medical standards (vision first) (`au-fitness-to-drive`) | doctors who treat adults | Austroads, Assessing Fitness to Drive 2022 [40] | new; one section read (vision) | needs permission |
| 15 | A mental health screening questionnaire chosen for Australia (`au-mental-health-screen`) | doctors who treat adults | not read | new; **unverified: needs a local clinician** | unclear: treat as needing permission |

"Doctors who treat adults" is every doctor role except paediatrics and paediatric surgery; the allied professions are not doctors. The kit can already express that as a list of roles.

### 2.2 Specialty tools doctors here expect, with a national source that was read

| Proposed tool | Who would see it | National source | Where the formula or content is published | Licence | Note |
|---|---|---|---|---|---|
| Australasian Triage Scale: record the category and re-triage (`au-ats-triage`) | Emergency medicine | [10] | ACEM policy P06 (the five categories and their maximum waiting times) and guideline G24 (the clinical descriptors and what a triage record holds). | Needs permission: both documents are marked "All rights reserved" by the College; the national training kit is Commonwealth copyright. | Replaces "ESI triage level". The category is chosen by the trained clinician; the tool records it, never works it out. |
| Concussion: graded return to sport and learning, with the national checkpoints (`au-concussion-return`) | Sport and exercise medicine, General practice, Emergency medicine, Paediatrics, Physiotherapist | [25] | Australian Concussion Guidelines for Youth and Community Sport (February 2024), figure 3, and the Graded Return to Sport Framework. | Needs permission: copyright of the Australian Sports Commission; terms not read. | Replaces "Stages of return to sport". The assessment tools the guidelines name for practitioners (SCAT6, SCOAT6) belong to their own owners and were not read. |
| PSA testing pathway by age and risk, with PSA density (`au-psa-pathway`) | General practice, Urology | [22] | 2026 Guidelines for the Early Detection of Prostate Cancer in Australia, chapters 5 and 6. | Needs permission: the Foundation allows personal and internal non-commercial use only. | Replaces "rate of change". The primary-care chapter is approved only until 17 May 2028: the tool needs an expiry date. |
| Lung cancer screening: eligibility and pack-years (`au-lung-screening`) | General practice, Respiratory and sleep medicine | [56] | Program criteria as the Lung Foundation states them; the Department of Health's own program page was not read. | unclear: program criteria are public facts; the program's forms are Commonwealth copyright. | The program began on 1 July 2025. Confirm the criteria on the Department's page before building. |
| Cosmetic surgery: requirements before the operation (`au-cosmetic-surgery-checklist`) | Plastic surgery, Cosmetic surgery, Hair transplantation | [4] | Not a formula: the Medical Board's guidelines of 1 July 2023. | unclear: Board copyright, terms not read; for a lawyer. | Whether hair transplantation falls under these guidelines was not established: for a lawyer. |
| Non-surgical cosmetic procedures: consultation and suitability checklist (`au-non-surgical-cosmetic-checklist`) | Cosmetic medicine | [4] | Not a formula: the Medical Board's guidelines, and the Ahpra guidelines in effect from 2 September 2025. | unclear: Board and Ahpra copyright, terms not read; for a lawyer. | Includes the rule on patients under 18 and a consultation each time a prescription-only injectable is prescribed. |
| Subsidy criteria helper for psoriasis and atopic dermatitis (`au-pbs-skin-authority`) | Dermatology | [41] | Services Australia form PB112 (psoriasis) and the PBAC public summary document for dupilumab, March 2022 (atopic dermatitis). | Needs permission: the PBS site allows reproduction "for personal use as general reference material only". | A tool of Australia's payer system: it must never appear in another country's build, and it changes whenever the listing changes. |
| Hearing Services Program: three-frequency average and the program threshold (`au-hearing-program-eligibility`) | Otolaryngology, head and neck surgery, Audiologist | [37] | Hearing Services Program service and device requirements (the average at 0.5, 1 and 2 kHz). | unclear: Commonwealth material; terms not read. | A tool of an Australian Government program: Australia only. |
| Fasting before anaesthesia (the College's appendix) (`au-anaesthesia-fasting`) | Anaesthesia | [47] | ANZCA PG07(A) 2023, Appendix 1. | Needs permission: "All rights reserved". | Reference content: a slot until the College permits it and an anaesthetist signs it. |

Changes to existing tools that belong in the same list (Part 1 has the detail): the inhaler check, the height tool and the dose arithmetic also for general practice; audiometry also for audiologists; the growth-chart slot built on the WHO and CDC charts; the asthma plan as the National Asthma Council's own plan; the consent slot rebuilt on the Medical Board's cosmetic-surgery guidelines; the radiology outline with the Australian breast categories.

### 2.3 Expected by doctors here, but NOT verified in this session

*(Second pass: all eleven now have a verdict. Ten rest on an Australian source that was read and are named; one is merged into a slot. See "The 11 proposals that had no national source" in the section at the top. The table below is the first pass's.)*

Each of these is a proposal a local clinician must confirm before anything is built: the Australian page that recommends it could not be read, so the instrument is not named, and neither its formula nor its licence is stated.

| Proposed tool | Who would see it | Status |
|---|---|---|
| Body mass index and body surface area (`au-body-size`) | every role | unverified — needs a local clinician: no Australian page naming the formulas or the cut-offs was read. Licence: Arithmetic; expected to be free to implement (not verified). |
| A mental health screening questionnaire chosen for Australia (`au-mental-health-screen`) | every doctor role that treats adults | unverified — needs a local clinician: which instrument Australian general practice uses, and its owner's terms, could not be read. Licence: unclear: no licence page was read; treat every questionnaire as needing permission. |
| Type 2 diabetes risk questionnaire used in Australia (`au-diabetes-risk`) | General practice, Endocrinology | unverified — needs a local clinician. Licence: unclear: not read. |
| Absolute fracture risk (`au-fracture-risk`) | General practice, Endocrinology, Rheumatology | unverified — needs a local clinician. Licence: unclear: not read; such calculators are usually licensed. |
| Stroke and bleeding risk in atrial fibrillation, in the form the Australian guideline uses (`au-af-stroke-bleeding-risk`) | Cardiology, General medicine, General practice | unverified — needs a local clinician. The Heart Foundation guideline could not be opened. Licence: unclear: not read. |
| Perinatal depression screening questionnaire (`au-perinatal-depression-screen`) | Obstetrics and gynaecology, General practice | unverified — needs a local clinician. Licence: unclear: not read; treat as needing permission. |
| Cognitive screening test for general practice (`au-cognitive-screen`) | General practice, Neurology | unverified — needs a local clinician. Licence: unclear: not read; several such tests are sold under licence. |
| Pregnancy dating: expected date of birth and gestational age (`au-pregnancy-dating`) | Obstetrics and gynaecology, General practice | unverified — needs a local clinician. Licence: Arithmetic; expected to be free (not verified). |
| Daytime sleepiness questionnaire for sleep medicine (`au-sleepiness-scale`) | Respiratory and sleep medicine | unverified — needs a local clinician. The role is named "Respiratory and sleep medicine" and has no sleep tool. Licence: unclear: not read; treat as needing permission. |
| Performance status and graded side effects (`au-oncology-grading`) | Oncology | unverified — needs a local clinician. Would replace the tick list without grades. Licence: unclear: the grading text is reported to be public domain by a secondary source only. |
| Non-invasive liver fibrosis scores (`au-liver-fibrosis`) | Gastroenterology, General practice | unverified — needs a local clinician. Licence: unclear: not read. |

### 2.4 Licences and copyright, plainly

| What | Position, as read | Status |
|---|---|---|
| Australasian Triage Scale | Australasian College for Emergency Medicine: both documents are marked "All rights reserved". The national training kit is Commonwealth copyright ("no part may be reproduced by any process without prior written permission"). | **needs permission** |
| Aus CVD Risk calculator | Commonwealth copyright (Department of Health), delivered by the Heart Foundation. No open licence is named on the site; one vendor reported being refused permission to embed it; the Heart Foundation speaks of a technical specification and an integration application. | **needs permission** |
| Kidney Health Australia handbook (colour chart, action plans) | "no part may be reproduced without written permission from Kidney Health Australia". | **needs permission (the equation and the category limits themselves are published facts)** |
| 2026 prostate cancer early-detection guideline | Prostate Cancer Foundation of Australia: personal and internal use, no commercial purpose, otherwise written permission. | **needs permission** |
| Concussion guidelines and graded return framework | Australian Sports Commission copyright; the terms page was not read. The assessment forms the guidelines name (SCAT6, SCOAT6, CRT6) have their own owners; not read. | **needs permission / unclear** |
| BI-RADS | "published and trademarked by the American College of Radiology" (secondary source). | **unclear: licence question open** |
| Australian breast imaging categories | National Breast Cancer Centre 2007 (now Cancer Australia): no reproduction "without prior written permission". | **needs permission** |
| ANZCA pre-anaesthesia guideline (fasting appendix) | "All rights reserved". | **needs permission** |
| Assessing Fitness to Drive | Austroads: "All rights reserved". | **needs permission** |
| PBS subsidy criteria and forms | Commonwealth: reproduction "for personal use as general reference material only"; all other rights reserved. | **needs permission** |
| National asthma action plan and inhaler checklists | National Asthma Council: "All Rights Reserved"; the checklists are themselves "adapted with permission". | **needs permission** |
| SNOMED CT-AU and the Australian Medicines Terminology | Registration, the SNOMED CT Affiliate License Agreement and the Australian National Terminology Licence Agreement, with a yearly statement of usage. Whether a fee applies is not stated on the page read. | **licence by registration** |
| ICD-10-AM | Licence terms are not on the page read. | **unclear** |
| ASA physical status classes | Owned by the American Society of Anesthesiologists; terms not read. The tool shows class numbers only. | **unclear** |
| Medical Board and Ahpra cosmetic guidelines | Regulator copyright; terms of reuse not read. A checklist would restate public requirements in the product's own words: for a lawyer. | **unclear** |
| Every published questionnaire named in a slot | No owner's licence page was read in this session. | **unclear: treat as needing permission; none is shown today** |
| WHO and CDC growth chart data | Terms for use inside a product not read. | **unclear** |
| PASI, EASI, SCORAD, DAS28 (already on) | Published formulas; whether their authors set terms for use inside a commercial product was not read. | **unclear** |

## Part 3: specialties and clinic roles

The official list is the Medical Board of Australia's "List of specialties, fields of specialty practice and related specialist titles", dated 22 September 2025 [1]: 23 specialties, with fields under several of them. The allied professions are checked against the 16 professions regulated under the National Law [2].

### 3.1 Doctor specialties: 24 keep, 6 rename, 0 remove, 5 add

"Tools" lists the specialty's own tools from Parts 1 and 2 (existing keys and proposed `au-…` keys). Every role also sees the core set of 2.1.

| Key | Shown today | Verdict | Official name, exactly | Tools it should see | Note |
|---|---|---|---|---|---|
| `emergency-medicine` | Emergency medicine | **keep** | Emergency medicine | `kritik-yol`; `au-ats-triage`; `au-concussion-return`; `emergency-referral` |  |
| `family-medicine` | General practice | **keep** | General practice | `au-kidney-ckd`; `au-cvd-risk`; `au-psa-pathway`; `au-lung-screening`; `au-concussion-return`; `inhaler-teknik`; `lung-action-plan`; `growth-percentiles`; `hedef-boy`; `doz-hesabi`; `family-vaccination-screening`; `family-chronic`; `family-referral`; `au-diabetes-risk`; `au-fracture-risk`; `au-perinatal-depression-screen`; `au-cognitive-screen`; `au-pregnancy-dating` | The pack already shows the official name. Today this role has no tool of its own. |
| `anaesthesia` | Anaesthesia | **keep** | Anaesthesia | `asa-preop`; `hava-yolu-notu`; `postop-agri`; `au-anaesthesia-fasting` |  |
| `neurosurgery` | Neurosurgery | **keep** | Neurosurgery | `noro-postop`; `nobet-bilinc` | A field of the specialty "Surgery". |
| `paediatric-surgery` | Paediatric surgery | **keep** | Paediatric surgery | `cocuk-prepost-op`; `yara-dren-izlem`; `child-surgery-consent` | A field of "Surgery". |
| `internal-medicine` | General medicine | **keep** | General medicine | `au-kidney-ckd`; `au-cvd-risk`; `polypharmacy`; `anticoagulation-review`; `au-af-stroke-bleeding-risk` | A field of the specialty "Physician"; the pack already shows the official name. |
| `dermatology` | Dermatology | **keep** | Dermatology | `pasi`; `easi`; `scorad`; `yama-okuma`; `au-pbs-skin-authority`; `isotretinoin-pregnancy-prevention` |  |
| `endocrinology` | Endocrinology | **keep** | Endocrinology | `rejim-karti`; `lab-izlem`; `dxa-tekrar`; `au-cvd-risk`; `au-kidney-ckd`; `au-diabetes-risk`; `au-fracture-risk` |  |
| `infectious-diseases` | Infectious diseases | **keep** | Infectious diseases | `antibiyotik-sure`; `viral-izlem`; `notifiable-diseases` |  |
| `gastroenterology` | Gastroenterology | **rename** | Gastroenterology and hepatology | `ibd-skor`; `hepatit-izlem`; `au-liver-fibrosis` | Already renamed on the earlier audit branch (origin/audit/au), not yet on the development branch. |
| `general-surgery` | General surgery | **keep** | General surgery | `genel-preop`; `yara-dren-izlem` |  |
| `thoracic-surgery` | Thoracic surgery | **rename** | Cardio-thoracic surgery | `toraks-preop`; `toraks-tup-yara`; `kalp-damar-preop`; `antikoagulan-vadeleri` | Not a name on the list. Australia has "Cardio-thoracic surgery" (heart and chest together) and "Vascular surgery". Renaming moves heart surgery INTO this role: its note template, intake questions and tools must move with it. For a local surgeon to confirm. |
| `respiratory-medicine` | Respiratory and sleep medicine | **keep** | Respiratory and sleep medicine | `inhaler-teknik`; `cat-mmrc`; `lung-action-plan`; `au-lung-screening`; `au-sleepiness-scale` |  |
| `ophthalmology` | Ophthalmology | **keep** | Ophthalmology | `gorme-keskinligi`; `au-fitness-to-drive` |  |
| `obstetrics-gynaecology` | Obstetrics and gynaecology | **keep** | Obstetrics and gynaecology | `pregnancy-calendar`; `contraception-eligibility`; `obstetric-risk`; `au-pregnancy-dating`; `au-perinatal-depression-screen` | Today this role has no tool of its own. |
| `cardiovascular-surgery` | Cardiac and vascular surgery | **rename** | Vascular surgery | `greft-yara-izlem`; `kalp-damar-preop`; `antikoagulan-vadeleri` | Not a name on the list. See "thoracic-surgery": heart surgery leaves this role and what remains is vascular surgery. For a local surgeon to confirm. |
| `cardiology` | Cardiology | **keep** | Cardiology | `au-cvd-risk`; `kardiyo-izlem`; `au-af-stroke-bleeding-risk` | Today this role has no tool of its own. |
| `otolaryngology` | Otolaryngology, head and neck surgery | **rename** | Otolaryngology – head and neck surgery | `odyometri-pta`; `otoskopi-notu`; `vertigo-notu`; `au-hearing-program-eligibility` | The list writes it with a dash. Already corrected on the earlier audit branch. |
| `nephrology` | Nephrology | **keep** | Nephrology | `au-kidney-ckd`; `diyaliz-seans`; `anemi-izlem` |  |
| `neurology` | Neurology | **keep** | Neurology | `stroke-red-flags`; `midas`; `antiseizure-monitoring`; `au-cognitive-screen` | Today this role has no tool of its own. |
| `oncology` | Oncology | **rename** | Medical oncology | `kur-sayaci`; `toksisite-listesi`; `au-oncology-grading`; `au-body-size` | "Oncology" alone is not on the list: "Medical oncology" is a field of "Physician" and "Radiation oncology" is a specialty of its own (see the additions). |
| `orthopaedics` | Orthopaedic surgery | **keep** | Orthopaedic surgery | `kirik-alci-takip`; `ortopedi-op-protokol`; `vas-fonksiyon` |  |
| `paediatrics` | Paediatrics | **rename** | Paediatrics and child health | `hedef-boy`; `doz-hesabi`; `growth-percentiles`; `vaccination-schedule`; `development-screening`; `mchat-rf`; `inhaler-teknik`; `lung-action-plan`; `au-concussion-return` | Already renamed on the earlier audit branch. |
| `plastic-surgery` | Plastic surgery | **keep** | Plastic surgery | `plastik-yara-greft`; `au-cosmetic-surgery-checklist` |  |
| `psychiatry` | Psychiatry | **keep** | Psychiatry | `au-mental-health-screen`; `phq9-gad7`; `psychiatry-safety-triage`; `psychotropic-monitoring` | Today this role has no tool of its own. |
| `radiology` | Radiology | **keep** | Radiology | `tetkik-kuyrugu`; `rapor-taslagi`; `critical-finding-notice` | The specialty is "Radiology"; its fields are "Diagnostic radiology", "Diagnostic ultrasound" and "Nuclear medicine". |
| `rheumatology` | Rheumatology | **keep** | Rheumatology | `das28`; `eklem-28`; `basdai`; `au-fracture-risk` |  |
| `urology` | Urology | **keep** | Urology | `au-psa-pathway`; `ipss`; `urology-emergency-triage` | A field of "Surgery". |
| `sports-medicine` | Sport and exercise medicine | **keep** | Sport and exercise medicine | `au-concussion-return`; `sakatlik-gunlugu` |  |
| `rehabilitation-medicine` | Rehabilitation medicine | **keep** | Rehabilitation medicine | `rehabilitation-session-plan`; `pain-odi`; `home-exercise` | Today this role has no tool of its own. |
| `geriatric-medicine` | (not offered) | **add** | Geriatric medicine | `au-kidney-ckd`; `au-cognitive-screen`; `polypharmacy`; `au-fracture-risk` | Recognised (a field of "Physician"). How common it is in private outpatient practice was not verified: for a local lead. |
| `immunology-and-allergy` | (not offered) | **add** | Immunology and allergy | (none that could be verified) | Recognised (a field of "Physician"). Commonness not verified. No tool can be named for it from what was read. |
| `haematology` | (not offered) | **add** | Haematology | `kur-sayaci`; `antikoagulan-vadeleri` | Recognised (a field of "Physician" and of "Pathology"). Commonness not verified. |
| `pain-medicine` | (not offered) | **add** | Pain medicine | `postop-agri`; `pain-odi` | A recognised specialty. Commonness not verified. |
| `radiation-oncology` | (not offered) | **add** | Radiation oncology | `kur-sayaci`; `toksisite-listesi`; `au-oncology-grading` | A recognised specialty, separate from medical oncology. Commonness not verified. |

**Recognised on the list and not proposed now** (not outpatient specialties, or no evidence of demand was read): Addiction medicine, Intensive care medicine, Medical administration, Occupational and environmental medicine, Palliative medicine, Pathology, Public health medicine, Sexual health medicine, Clinical genetics, Clinical pharmacology, Nuclear medicine, Oral and maxillofacial surgery.

**The earlier audit** (`origin/audit/au`) had already renamed three: "Gastroenterology and hepatology", "Otolaryngology – head and neck surgery", "Paediatrics and child health". This audit adds three: "Cardio-thoracic surgery", "Vascular surgery" and "Medical oncology". The first two are more than a new label: Australia puts heart surgery with chest surgery, the product puts it with vascular surgery, so the note template, the intake questions and the tools of the two roles have to be re-divided, and a local surgeon should confirm.

### 3.2 Clinic roles: 5 keep, 2 rename, 1 remove, 2 for a lawyer, 2 add

The product has no separate list of clinic types: the "Klinik" side is these ten roles (five clinic doctors, five allied professions).

| Key | Shown today | Verdict | Official name, exactly | Tools it should see | Note | Source |
|---|---|---|---|---|---|---|
| `hair-transplant` | Hair transplantation | **unverified** | — | `au-cosmetic-surgery-checklist` | Not a specialty or field of the list. Whether it counts as cosmetic surgery under the Medical Board's guidelines was not established: for a lawyer and a local clinician. Shown under "Clinic doctor"; the landing page must not call it a specialty. | [1] |
| `aesthetic-surgery` | Cosmetic surgery | **keep** | Cosmetic surgery | `au-cosmetic-surgery-checklist`; `plastik-yara-greft` | Not a specialty: an area of practice for which the regulator is setting up an endorsement. The words "cosmetic surgery" are the regulator's own. NEVER "cosmetic surgeon": only doctors with specialist registration in surgery, obstetrics and gynaecology or ophthalmology may use "surgeon", and the endorsement "does not enable a medical practitioner to call themselves a 'cosmetic surgeon'". | [7] |
| `aesthetic-medicine` | Cosmetic medicine | **rename** | Non-surgical cosmetic procedures | `au-non-surgical-cosmetic-checklist` | "Cosmetic medicine" is not a term of the regulator; its guidelines are for "practitioners who perform non-surgical cosmetic procedures". | [5] |
| `clinic-dermatology` | Dermatology (clinic) | **remove** | — | (none that could be verified) | "Dermatology" is a recognised specialty with the title "Specialist dermatologist", and the doctor list already has it. A second role with the same word, offered to doctors who are not dermatologists, duplicates it and risks suggesting a specialist where there is none: for a lawyer. If a clinic type for skin work by general practitioners is wanted, it needs its own name from a local clinician (none could be verified). | [1] |
| `longevity` | Preventive and longevity medicine | **unverified** | — | `au-cvd-risk`; `au-kidney-ckd`; `au-body-size` | Not a specialty or field of the list. Whether such clinics are a market here, and what advertising law allows them to be called, was not read: for the owner and a lawyer. | [1] |
| `physiotherapy` | Physiotherapist | **keep** | Physiotherapist | `au-concussion-return`; `home-exercise` | A regulated profession (Physiotherapy Board of Australia). | [2] |
| `clinical-psychology` | Clinical psychologist | **rename** | Psychologist | `au-mental-health-screen`; `phq9-gad7` | The regulated profession is "Psychologist". "Clinical psychologist" depends on an area-of-practice endorsement; the Board page read does not list the endorsed titles, so the narrower name is unverified. The broader name is safe and admits more customers. | [2] |
| `dietetics` | Dietitian | **keep** | — | `au-body-size` | Not one of the 16 professions regulated under the National Law (verified by its absence from the list). How the profession is credentialled was not read. | [2] |
| `occupational-therapy` | Occupational therapist | **keep** | Occupational therapist | (none that could be verified) | A regulated profession (Occupational Therapy Board of Australia). | [2] |
| `audiology` | Audiologist | **keep** | — | `odyometri-pta`; `au-hearing-program-eligibility` | Not one of the 16 regulated professions (verified by absence). Audiologists do not see the audiometry tool today; they should. | [2] |
| `podiatry` | (not offered) | **add** | Podiatrist | (none that could be verified) | A regulated profession. That podiatry clinics are a market for this product was not verified: for the owner. | [2] |
| `speech-pathology` | (not offered) | **add** | — | (none that could be verified) | Not one of the 16 regulated professions (verified by absence); the official name and the credentialling body were not read. Commonness not verified. | [2] |

Two facts for every clinic role [3] [4] [5]. First, "surgeon" is a protected title: only doctors with specialist registration in surgery, obstetrics and gynaecology or ophthalmology may use it, and misuse is a criminal offence. A role name must stay an area of work and never become a title. Second, cosmetic work is closely regulated: the Medical Board's guidelines for cosmetic surgery and procedures (1 July 2023) and the guidelines for non-surgical cosmetic procedures (in effect from 2 September 2025, all regulated professions) set what must happen before a procedure. A product that offers these roles should carry those requirements as tools (2.2) before it carries anything else for them.

## What the kit lacks to apply these decisions to Australia alone

| Missing | Detail |
|---|---|
| One shared tool list for five countries | An English-speaking pack takes the whole shared list and may only switch a tool OFF (`araclar.kapali` in `countries/au/ayarlar.ts`). The shared test (`countries/_dil/en/testing/paketSinamasi.ts`) requires that the switched-on tools equal the shared list minus the closed ones, plus exactly two. So Australia cannot have a tool of its own (triage scale, PSA pathway, subsidy helper, hearing program), nor a slot of its own that is not a closed shared tool. |
| Who sees a tool is fixed for all five countries | `roller` is written once in `countries/_dil/en/araclar/arac1-3.ts`. Australia cannot give the inhaler check, the height tool and the dose arithmetic to general practice, or audiometry to audiologists, without giving them to the same roles in every English-speaking country. |
| A country cannot state a tool's numbers | The kit lets a pack state thresholds and intervals (`parametreler`), but the English set never passes any: `araciBicimle` returns the key, the roles and the words only, and `EnAraclarGirdisi` has no place for numbers. The eight tools whose mechanism is ready (HbA1c and TSH, bone density, viral follow-up, kidney anaemia, CRP and ESR, cardiology follow-up, bowel index, hepatitis) can therefore not be switched on in any English-speaking country even when a clinician supplies the numbers. |
| A country can change only some of a tool's words | `degisen` covers field labels, numbers, bands, warnings and the description. It does not cover the tool's name, the names of options, the dates or the line under the result, so Australia cannot rename a tool or relabel a list of choices. |
| Kit arithmetic that assumes one country's convention | Albuminuria is classified in mg/g against one grid (`kdigoA`, `kdigoRisk`): a country needs its own limits in its own unit and its own colour chart. HbA1c has one unnamed unit. The hearing average is always four frequencies with one grading. The triage tool is one scale. The radiology outline has one category list. Each needs a setting the pack states. |
| The forty roles are fixed for all five countries | Every English-speaking pack must carry exactly the forty shared role keys (the same test). Australia can rename a role (`rolAdlari`) but cannot add one (geriatric medicine, pain medicine, radiation oncology, podiatrist), remove one ("Dermatology (clinic)"), or move content between two (heart surgery from one surgical role to the other): note templates, intake questions and tool lists are tied to the key and shared. |
| No way to say "this is not a specialty here" | The landing page and the role picker group the five clinic-doctor roles under headings that read as specialties; Australia cannot reword the heading (already recorded by the earlier audit). |
| The follow-up list follows the role tools | It is given only to roles that have a tool of their own, so it cannot be a base tool for Australia. |

What CAN be applied today without touching the kit: closing more tools for Australia (`kapali`), the names of roles (`rolAdlari`: the six doctor names and the two clinic names above), and unit names. Everything else in this report waits for the kit.

## Could not verify

### Pages that were not read, exactly

No refusal was worked around: no cache, no mirror, no other tool, no test solved.

| Page | What happened |
|---|---|
| https://www.servicesaustralia.gov.au/mbs-billing-for-anaesthesia-items?context=20 | Refused: the site forbids automated readers. (How Medicare uses the anaesthesia physical-status classes.) |
| https://pubmed.ncbi.nlm.nih.gov/28485036/ | Failed with an error. (The paper holding the published severity bands of the eczema index.) |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC4789704 | Answered with a "checking your browser" test, which was not attempted. (Gabbett 2016, the source of the training-load limits.) |
| https://www.rcpa.edu.au/getattachment/75ca004c-4bc3-4104-8e1c-7e6a37f4ce15/PSA-Test-Reporting.aspx | Failed with an error. (The pathologists' guideline on reporting PSA.) |
| https://www.racgp.org.au/FSDEDEV/media/documents/Clinical%20Resources/Guidelines/Red%20Book/Guidelines-for-preventive-activities-in-general-practice.pdf | Answered "This resource no longer exists" and pointed to the 10th edition. |
| https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/guidelines-for-preventive-activities-in-general-pr/preamble/introduction | Not read: the reading tool opens only addresses it has already been shown, asked for a permission, and none was given. (The general practitioners' preventive-care guideline, 10th edition: the single most important source for the general-practice tools.) |
| https://www.heartfoundation.org.au/bundles/for-professionals/key-stats-cardiovascular-disease | Not read, same reason. (The route to the Heart Foundation's atrial fibrillation, heart failure, blood pressure and acute coronary syndrome guidelines.) |
| https://www.asthmahandbook.org.au/ | Not read, same reason. (The Australian Asthma Handbook.) |
| https://lungfoundation.com.au/health-professionals/ | Not read, same reason: the request for permission was not answered in time. (The route to the Australian COPD guideline.) |
| https://www.eviq.org.au/ | Not read, same reason. (The national cancer-treatment protocols site.) |
| https://www.health.gov.au/resources/apps-and-tools/the-australian-type-2-diabetes-risk-assessment-tool-ausdrisk | Not read, same reason. (The national diabetes risk questionnaire.) |
| https://www.safetyandquality.gov.au/standards/clinical-care-standards/sepsis-clinical-care-standard | Not read, same reason. (The national sepsis standard.) |
| https://www.ranzcr.com/wp-content/uploads/edocman/training/clinical-radiology/training-program/Breast%20Imaging%20Grading%20Comparison%20and%20Lesion%20Classification%20FINAL.pdf | Not read, same reason. (The college's comparison of the two breast-imaging category systems; only its cover page was read.) |
| https://files.nationalasthma.org.au/images/Inhaler-technique-device-specific-checklist.pdf | Not read, same reason; the same checklists were then read at another address of the same publisher. |
| https://www.pbs.gov.au/pbs/restriction/rstrXd4e5251270-rstrXd4e5251276-rstrXd4e5251282-rstrXd4e5251288 | Answered "Cannot find restriction". (The live subsidy restriction for atopic dermatitis; the criteria were read from the PBAC summary document instead.) |
| https://cdn.clinicaltrials.gov/large-docs/49/NCT02305849/Prot_000.pdf | Only the first part of this trial protocol was returned; the section with the DAS28 formulas was not in it. |
| https://www.cvdcheck.org.au/terms-of-use | Returned the site's disclaimer, not its terms of use: the licence of the national heart-risk calculator was therefore not read in the owner's own words. |
| https://www.psychologyboard.gov.au/Endorsement.aspx | Read, but the list of endorsed titles is on another page that was not reached. |
| Kidney Health Australia handbook, pages 73 to 74 | The handbook was read, but its list of reasons to refer to a nephrologist, and any passage on the Kidney Failure Risk Equation, were not in the text returned. |
| Web search | About 25 searches were made. The allowance is shared with the other jobs of the same session and ran out ("limit: 200 WebSearch calls per turn, shared by every agent in it"): two searches (cancer side-effect grading in Australia; the national diabetes risk tool) were refused and none could follow. National pages for the subjects listed below were therefore never located. |

### Subjects that are therefore unverified: each needs a local clinician (or a lawyer where it says so)

- General practice: the preventive-care guideline (10th edition), the diabetes and osteoporosis guidance, the immunisation schedule and handbook, the cervical, bowel and breast screening programs, mental health treatment plans and the questionnaires used with them.
- Every published questionnaire the slots name (PHQ-9, GAD-7, BASDAI, the COPD Assessment Test, MIDAS, IPSS, the Oswestry index, M-CHAT-R/F) and the ones doctors here might expect instead: no owner's licence page was read. Treat each as needing permission.
- Heart: the atrial fibrillation, heart failure, blood pressure and acute coronary syndrome guidelines.
- Lungs: the COPD guideline, the asthma handbook, spirometry reference values, sleep questionnaires.
- Emergency, anaesthesia and surgery: the sepsis and stewardship standards, the college documents on airway assessment and acute pain, the surgeons' checklists, blood-clot prevention.
- Cancer: how Australian services grade side effects and record performance status; the national protocols site.
- Women's health: the pregnancy care guidelines, the obstetricians' college statements, contraception eligibility, what a doctor certifies for parental leave.
- Children: the state and territory child health checks, development screening instruments, the dosing reference.
- Kidney and liver: the Kidney Failure Risk Equation, the nephrologists' guideline group, the liver societies' consensus statements.
- Laboratory units of C-reactive protein and the sedimentation rate; the DAS28 formula with C-reactive protein and the limit 5.1; the published bands of the eczema index; the primary papers behind PASI, SCORAD, the height formula and the training-load limits.
- Law and payer rules: electronic prescribing, controlled medicines, certificates, consent of minors, involuntary admission, Medicare limits on allied-health sessions and on bone-density scans, notifiable diseases.
- Whether any calculator in this product is a medical device in Australia: the regulator's page read gives examples but not the rule for clinical calculators.
- How common each proposed new specialty is in private outpatient practice, and whether hair transplantation, "longevity" clinics, podiatry and speech pathology are a market: no source was read.

In the tables above this is 69 of 100 tools and 11 of 25 proposed tools. *(First pass. After the second pass: 18 of 100 tools and none of the proposals; what is left, and why, is in the section at the top.)*

## Sources read (all on 2026-10-10)

| # | Title | Address |
|---|---|---|
| 1 | Medical Board of Australia, "List of specialties, fields of specialty practice and related specialist titles" (22 September 2025) | https://www.ahpra.gov.au/documents/default.aspx?record=WD10%2f106&dbid=AP&chksum=07LyDUkqqYa5O5LXuqbSzg%3d%3d |
| 2 | Ahpra, "Professions and divisions" (the 16 regulated professions) | https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Professions-and-Divisions.aspx |
| 3 | Medical Board of Australia, FAQ: protection of the title "surgeon" | https://www.medicalboard.gov.au/Codes-Guidelines-Policies/FAQ/FAQ-Protection-of-the-title-surgeon.aspx |
| 4 | Medical Board of Australia, guidelines for medical practitioners who perform cosmetic surgery and procedures (issued 1 July 2023) | https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Cosmetic-medical-and-surgical-procedures-guidelines |
| 5 | Ahpra, "New cosmetic procedure guidelines" (3 June 2025; guidelines in effect 2 September 2025) | https://www.ahpra.gov.au/News/2025-06-03-New-cosmetic-procedure-guidelines |
| 6 | Ahpra, Cosmetic surgery hub | https://www.ahpra.gov.au/Resources/Cosmetic-surgery-hub |
| 7 | Ahpra, "Establishing an endorsement for cosmetic surgery" (page reviewed 2 September 2025) | https://www.ahpra.gov.au/Resources/Cosmetic-surgery-hub/About-endorsement |
| 8 | Psychology Board of Australia, "Endorsement" (page reviewed 13 July 2026; the page read does not list the endorsed titles) | https://www.psychologyboard.gov.au/Endorsement.aspx |
| 9 | Australasian College for Emergency Medicine (ACEM), "Triage" | https://acem.org.au/Content-Sources/Advancing-Emergency-Medicine/Better-Outcomes-for-Patients/Triage |
| 10 | ACEM, P06 Policy on the Australasian Triage Scale, version 5 (November 2023) | https://acem.org.au/getmedia/484b39f1-7c99-427b-b46e-005b0cd6ac64/P06_Policy_Australasian_Triage_Scale |
| 11 | ACEM, G24 Guidelines on the implementation of the Australasian Triage Scale in emergency departments, version 6 (November 2023) | https://acem.org.au/getmedia/51dc74f7-9ff0-42ce-872a-0437f3db640a/G24_04 |
| 12 | Commonwealth of Australia, Emergency Triage Education Kit (2007; copyright 2009) | https://acem.org.au/getmedia/c9ba86b7-c2ba-4701-9b4f-86a12ab91152/Triage-Education-Kit.aspx |
| 13 | Kidney Health Australia, "Chronic Kidney Disease (CKD) Management in Primary Care", 5th edition (2024) | https://kidney.org.au/wp-content/uploads/2025/11/KHA-CKD-Handbook-5th-Ed-July2024.pdf |
| 14 | Kidney Health Australia, CKD handbook page | https://kidney.org.au/ckdhandbook |
| 15 | Kidney Health Australia, eGFR calculator page | https://kidney.org.au/health-professionals/egfr-calculator |
| 16 | Australian guideline and calculator for assessing and managing cardiovascular disease risk (2023), Heart Foundation for the Commonwealth | https://www.cvdcheck.org.au/ |
| 17 | cvdcheck.org.au, terms and disclaimer page | https://www.cvdcheck.org.au/terms-of-use |
| 18 | RACGP newsGP, 21 July 2023, on the new CVD guideline and calculator | https://www1.racgp.org.au/newsgp/clinical/new-cvd-guideline-and-risk-calculator-expected-to |
| 19 | The Medical Republic, 31 July 2024, "Best Practice not to blame for CVD calculator change" | https://www.medicalrepublic.com.au/?p=109497 |
| 20 | Agostino J et al., "Inaccuracy of cardiovascular disease calculators in Australian primary healthcare software", Aust J Gen Pract 2024;53(10) | https://www1.racgp.org.au/ajgp/2024/october/inaccuracy-of-cardiovascular-disease-calculators |
| 21 | Cardiology Today (Medicine Today), October 2024, practical guide to the 2023 Australian CVD risk guideline | https://cardiology.medicinetoday.com.au/ct/2024/october/regular-series/whats-my-heart-disease-risk-doctor-practical-guide-2023-australian-cvd-risk-guideline |
| 22 | Prostate Cancer Foundation of Australia, "2026 Guidelines for the Early Detection of Prostate Cancer in Australia: Summary of Recommendations" (NHMRC approval 18 May 2026) | https://www.prostate.org.au/wp-content/uploads/2026/08/2026-Guidelines-for-the-Early-Detection-of-Prostate-Cancer-Summary-of-Recommendations.pdf |
| 23 | Prostate Cancer Foundation of Australia, 2026 Guidelines for the Early Detection of Prostate Cancer in Australia (full document; read in part) | https://www.prostate.org.au/wp-content/uploads/2026/08/2026-Guidelines-for-the-Early-Detection-of-Prostate-Cancer.pdf |
| 24 | The Medical Republic, 13 August 2026, "New prostate guidelines reset PSA thresholds" | https://medicalrepublic.com.au/new-prostate-guidelines-reset-psa-thresholds/128167 |
| 25 | Australian Institute of Sport, ACSEP, Sports Medicine Australia, Australian Physiotherapy Association, "Australian Concussion Guidelines for Youth and Community Sport" (February 2024) | https://sma.org.au/wp-content/uploads/2024/04/37382_Concussion-Guidelines-for-community-and-youth-FA-acc-v2.2.pdf |
| 26 | Australian Sports Commission, "Graded Return to Sport Framework: Community and Youth" | https://www.concussioninsport.gov.au/__data/assets/pdf_file/0006/1133466/GRADED-RETURN-TO-SPORT-FRAMEWORK-COMMUNITY-AND-YOUTH.pdf |
| 27 | Australian Sports Commission, concussion resources page | https://www.ausport.gov.au/concussion/resource |
| 28 | RANZCR, "Breast Imaging Lesion Classification" (document page; the PDF behind it could not be opened) | https://www.ranzcr.com/document/breast-imaging-grading-comparison-and-lesion-classification/ |
| 29 | National Breast Cancer Centre (now Cancer Australia), "Synoptic breast imaging report" (April 2007) | https://canceraustralia.gov.au/sites/default/files/migrated-files/publications//big-2-synoptic-breast-imaging-report_504af02c46210.pdf |
| 30 | Wikipedia, "BI-RADS" (secondary source, for ownership only) | https://en.wikipedia.org/wiki/BI-RADS |
| 31 | The Royal Children's Hospital Melbourne, primary care liaison guideline "Short stature" (reviewed July 2025) | https://www.rch.org.au/primary-care-liaison/prereferral_guidelines/Short_stature/ |
| 32 | The Royal Children's Hospital Melbourne, child growth monitoring: questions and answers for health professionals (2013) | https://www.rch.org.au/uploadedfiles/main/content/childgrowth/healthprofessionals_faqschild_growth_monitoring.pdf |
| 33 | The Royal Children's Hospital Melbourne, "Growth charts" | https://www.rch.org.au/childgrowth/about_child_growth/Growth_charts/ |
| 34 | Lung Foundation Australia, National Asthma Council Australia, Asthma Australia, "Inhaler technique: device-specific checklists" (published August 2025) | https://files.nationalasthma.org.au/resources/OYO250527_Inhaler-Technique_Digital.pdf |
| 35 | National Asthma Council Australia, "Inhaler technique checklists" (last reviewed 1 August 2025) | https://www.nationalasthma.org.au/resources/inhaler-technique-checklists |
| 36 | National Asthma Council Australia, asthma action plan library | https://www.nationalasthma.org.au/health-professionals/asthma-action-plan-library |
| 37 | Australian Government, Hearing Services Program, service and device requirements | https://health.gov.au/our-work/hearing-services-program/providing-services/service-device-requirements |
| 38 | American Speech-Language-Hearing Association, "Degree of hearing loss" (reproduces Clark 1981, the scale the tool cites) | https://asha.org/public/hearing/degree-of-hearing-loss |
| 39 | Deaf Children Australia, "Degrees of hearing loss" (2019; a charity, not a regulator) | https://www.deafchildrenaustralia.org.au/wp-content/uploads/2021/06/degrees-hearing-loss.pdf |
| 40 | Austroads, "Assessing Fitness to Drive" 2022 (edition 6), vision and eye disorders, medical standards for licensing | https://austroads.gov.au/publications/assessing-fitness-to-drive/ap-g56/vision-and-eye-disorders/medical-standards-for-licensing-11 |
| 41 | Services Australia, form PB112 "Severe chronic plaque psoriasis: initial authority application" (2405) | https://servicesaustralia.gov.au/sites/default/files/2024-04/pb112-2405en-f.pdf |
| 42 | PBAC public summary document, dupilumab, March 2022 | https://prod3.pbs.gov.au/industry/pbac/psd/2022/03/dupilumab-psd-march-2022.pdf?variant=3 |
| 43 | Australasian College of Dermatologists, submission to the PBS post-market review of biologics for psoriasis | https://prod3.pbs.gov.au/reviews/biologics-files/06-australasian-college-dermatologists-psoriasis.pdf |
| 44 | Pharmaceutical Benefits Scheme website, copyright statement (updated 6 July 2022) | https://www.pbs.gov.au/info/general/copyright |
| 45 | Medical Services Advisory Committee, application 1390 draft protocol, patch testing (October 2014) | https://msac.gov.au/sites/default/files/documents/1390-PatchTesting-Att1-DraftProtocol-accessible.pdf |
| 46 | DermNet, "Baseline series of patch test allergens" | https://dermnetnz.org/topics/baseline-series-of-patch-test-allergens |
| 47 | Australian and New Zealand College of Anaesthetists, PG07(A) Guideline on pre-anaesthesia consultation and patient preparation (November 2023) | https://anzca.edu.au/resources/professional-documents/guidelines/ps07-guidelines-on-pre-anaesthesia-consultation-an |
| 48 | Services Australia, operational blueprint, anaesthetic services assessing rules in Medicare | https://operational.servicesaustralia.gov.au/public/Pages/your-health/011-42060010-05.html |
| 49 | Fransen J, van Riel PLCM. DAS remission cut points. Clin Exp Rheumatol 2006;24(Suppl 43):S29-S32 | https://www.clinexprheumatol.org/article.asp?a=2935 |
| 50 | Sedeaud A et al. Front Physiol 2020;11:1034 (reports and criticises the workload-ratio limits of Gabbett 2016 and Blanch and Gabbett 2016) | https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2020.01034/pdf |
| 51 | Australian Digital Health Agency, National Clinical Terminology Service | https://www.healthterminologies.gov.au |
| 52 | Independent Health and Aged Care Pricing Authority, "ICD-10-AM/ACHI/ACS" | https://www.ihacpa.gov.au/health-care/classification/icd-10-amachiacs |
| 53 | Therapeutic Goods Administration, "Regulation of software as a medical device" | https://www.tga.gov.au/regulation-software-medical-device |
| 54 | RCPA Manual, "Albumin urine" | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/A/Albumin-urine |
| 55 | RCPA Manual, "HbA1c" | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/H/HbA1c |
| 56 | Lung Foundation Australia, "National Lung Cancer Screening Program" | https://lungfoundation.com.au/lung-diseases/national-lung-cancer-screening-program/ |
| 57 | Sanofi Campus, "SCORAD" (a company page that cites the European Task Force on Atopic Dermatitis 1993 and Oranje 2007; secondary source) | https://pro.campus.sanofi/uk/atopic-dermatitis/tools/scorad |
| 58 | MDCalc, "Eczema Area and Severity Index (EASI)" (secondary source; states the index is for patients over 8 years) | https://www.mdcalc.com/calc/10427 |
| 59 | Wikipedia, "Common Terminology Criteria for Adverse Events" (secondary source) | https://en.wikipedia.org/wiki/Common_Terminology_Criteria_for_Adverse_Events |

### Sources read in the second pass (all on 2026-10-10)

| # | Title | Address |
|---|---|---|
| 60 | Australian Government, Hearing Services Program, "Minimum Hearing Loss Threshold (MHLT) Guidelines" (updated and effective 1 July 2022) | https://hearingservices.gov.au/wps/wcm/connect/hso/aaf886d4-7b74-4698-aed3-9ebfba731e70/Minimum+Hearing+Loss+Threshold+(MHLT)+Guidelines_Aug2021.pdf?MOD=AJPERES |
| 61 | Parliament of Australia, Senate Community Affairs committee, inquiry into hearing health in Australia (2008-10), report chapter 2 (Table 2.1, citing Access Economics 2006) | https://www.aph.gov.au/parliamentary_business/committees/senate/community_affairs/completed_inquiries/2008-10/hearing_health/report/c02 |
| 62 | Australian Commission on Safety and Quality in Health Care, "Recommendations for safe use of medicines terminology" (November 2024) | https://www.safetyandquality.gov.au/sites/default/files/2024-12/recommendations-for-safe-use-of-medicines-terminology.pdf |
| 63 | Australia and New Zealand Society for Paediatric Endocrinology and Diabetes (ANZSPED), "Growth and growth charts" (charts last updated October 2025) | https://anzsped.org/clinical-resources-links/growth-growth-charts/ |
| 64 | Services Australia, form PB109 "Rheumatoid arthritis: initial authority application" (2606) | https://www.servicesaustralia.gov.au/sites/default/files/2026-05/pb109-2606en-f.pdf |
| 65 | PathWest (Western Australia public pathology), test directory, C-reactive protein | https://pathwesttd.health.wa.gov.au/testdirectory/testdetail.aspx?TestID=141 |
| 66 | RACGP Handbook of Non-Drug Interventions project team, "The Epley manoeuvre", Australian Family Physician 2013;42(1) | https://www.racgp.org.au/afp/2013/january-february/the-epley-manoeuvre |
| 67 | RACGP, Guidelines for preventive activities in general practice (Red Book), 10th edition, "Diabetes" (recommendations as of 28 June 2024) | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/metabolic/diabetes |
| 68 | RACGP Red Book, 10th edition, "Osteoporosis" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/musculoskeletal/osteoporosis |
| 69 | RACGP Red Book, 10th edition, "Dementia" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/mental-health/dementia |
| 70 | RACGP Red Book, 10th edition, "Depression" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/mental-health/depression |
| 71 | RACGP Red Book, 10th edition, "Overweight and obesity" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/metabolic/overweight-and-obesity |
| 72 | RACGP Red Book, 10th edition, "Kidney" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/cardiovascular/kidney |
| 73 | RACGP Red Book, 10th edition, "Preventive activities in childhood" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice/development-and-behaviour/childhood-development |
| 74 | RACGP Red Book, 10th edition, the whole guideline as one file (header "Last updated: 01 08 2025"; only about the first 66 pages were returned) | https://www.racgp.org.au/getattachment/9755764e-25f8-4799-bbca-29ddaf8c6d65/Guidelines-for-preventive-activities-in-general-practice.aspx |
| 75 | RACGP, osteoporosis guideline, "Assessment of absolute fracture risk" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/osteoporosis/risk-factors/assessment-of-absolute-fracture-risk |
| 76 | Brieger D, et al. National Heart Foundation of Australia and Cardiac Society of Australia and New Zealand: Australian clinical guidelines for the diagnosis and management of atrial fibrillation 2018. Med J Aust 2018;209(8):356-362 (summary) | https://www.mja.com.au/journal/2018/209/8/national-heart-foundation-australia-and-cardiac-society-australia-and-new |
| 77 | National Asthma Council Australia, Australian Asthma Handbook, "Action plans" (adults and adolescents) | https://www.asthmahandbook.org.au/management/adults/self-management/action-plans |
| 78 | Dabscheck E, et al. COPD-X Australian guidelines for the diagnosis and management of chronic obstructive pulmonary disease: 2022 update. Med J Aust 2022;217(8):415-423 (summary) | https://mja.com.au/journal/2022/217/8/copd-x-australian-guidelines-diagnosis-and-management-chronic-obstructive |
| 79 | Lung Foundation Australia, "COPD-X Handbook: summary clinical practice guidelines for the management of COPD" (2024) | https://lungfoundation.com.au/wp-content/uploads/2025/06/COPD-X_Handbook_Version1-1.pdf |
| 80 | Australian Government Department of Health, "The Australian Type 2 Diabetes Risk Assessment Tool (AUSDRISK)" | https://www.health.gov.au/resources/apps-and-tools/the-australian-type-2-diabetes-risk-assessment-tool-ausdrisk |
| 81 | Australian Government Department of Health, AUSDRISK, PDF version (February 2025) | https://www.health.gov.au/sites/default/files/2025-03/the-australian-type-2-diabetes-risk-assessment-tool-ausdrisk-pdf-version.pdf |
| 82 | Australian Commission on Safety and Quality in Health Care, "Sepsis Clinical Care Standard" (2022; the first 100,000 characters were read) | https://www.safetyandquality.gov.au/sites/default/files/2022-06/sepsis_clinical_care_standard_2022.pdf |
| 83 | Kidney Health Australia, CKD management handbook page (fifth edition: what is new) | https://old.kidney.org.au/health-professionals/ckd-management-handbook |
| 84 | Services Australia, "Anaesthesia items" (billing rules) | https://servicesaustralia.gov.au/mbs-billing-for-anaesthesia-items |
| 85 | Cancer Institute NSW, eviQ, "Anti-cancer drug patient assessment tool", version 7 (last reviewed October 2023) | https://www.eviq.org.au/getmedia/8f74651c-cc7a-433d-805c-eb48883d9df9/ID-4-Anticancer-drug-patient-assessment-tool-2023-V-7.pdf.aspx?ext=.pdf |
| 86 | Cancer Institute NSW, eviQ, dose modification gradings, standard CTCAE, "Peripheral neuropathy" | https://www.eviq.org.au/dose-mod-gradings/standard-ctcae/peripheral-neuropathy |
| 87 | RCPA Manual, "Prostate specific antigen" | https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/P/Prostate-specific-antigen |
| 88 | Ronald C. Kessler (Harvard), "K10 and K6 Scales" (the owner's page) | https://rckessler.scholars.harvard.edu/k10-and-k6-scales |
| 89 | Australian Government Department of Health, "Better Access: GP Mental Health Treatment Plan template information" (last updated March 2026) | https://www.health.gov.au/sites/default/files/2026-03/better-access-gp-mental-health-treatment-plan-template-information.pdf |
| 90 | University of New South Wales, DASS FAQ (the owner's page) | https://www2.psy.unsw.edu.au/Dass/DASSFAQ.htm |
| 91 | Centre of Perinatal Excellence (COPE), "Perinatal Mental Health Guideline: summary for general practitioners" (2023 guideline) | https://www.cope.org.au/health-professionals/health-professional-information-hubs/for-general-practitioners/perinatal-mental-health-guideline-summary-for-general-practitioners |
| 92 | Safer Care Victoria (a state body), "Accurate pregnancy dating: estimated due date" (November 2020; past its review date) | https://www.safercare.vic.gov.au/clinical-guidance/maternity/accurate-pregnancy-dating-estimated-due-date |
| 93 | MBS Online, sleep study items: item descriptors and explanatory notes (note DN.1.17; current as of 25 September 2019) | https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/77445A0AF0D01FACCA25847F00195DF4/$File/Minor%20changes%20to%20sleep%20study%20items%20-%20item%20descriptors%20and%20explanatory%20notes.pdf |
| 94 | Adams LA, et al. Assessment of metabolic dysfunction-associated fatty liver disease in primary care: a consensus statement summary. Med J Aust 2025;223(5):268-276 | https://www.mja.com.au/journal/2025/223/5/assessment-metabolic-dysfunction-associated-fatty-liver-disease-primary-care |
| 95 | RACGP, "Recommendations for the assessment of MAFLD in primary care: a consensus statement" (accepted by the RACGP) | https://www.racgp.org.au/clinical-resources/clinical-guidelines/guidelines-by-topic/view-all-guidelines-by-topic/chronic-disease/recommendations-for-the-assessment-of-mafld |
| 96 | Australian Government Department of Health, "Body mass index (BMI) and waist measurement" | https://www.health.gov.au/topics/overweight-and-obesity/bmi-and-waist |
| 97 | Australian Government Department of Health, "How the National Lung Cancer Screening Program works" | https://health.gov.au/our-work/nlcsp/how-it-works |
| 98 | Australian Sports Commission, "Copyright" | https://www.ausport.gov.au/legal_information/copyright |
| 99 | LOINC, entry 79115-2 (GPCOG), copyright notice | https://loinc.org/79115-2 |
| 100 | Australian Government Department of Health, "Catch-up immunisations" | https://www.health.gov.au/topics/immunisation/immunisation-information-for-health-professionals/catch-up-immunisations |
| 101 | Australian Government Department of Health, "Nationally notifiable diseases" | https://www.health.gov.au/topics/communicable-diseases/nationally-notifiable-diseases |
| 102 | Services Australia, form PB255 "Non-radiographic axial spondyloarthritis: initial authority application" (2606) | https://www.servicesaustralia.gov.au/sites/default/files/2026-05/pb255-2606en-f.pdf |
| 103 | Healthy Male (funded by the Australian Government), "Nursing care for male urinary issues" | https://www.healthymale.org.au/news/nursing-care-for-male-urinary-issues |
| 104 | Autism CRC, "A National Guideline for the Assessment and Diagnosis of Autism Spectrum Disorders in Australia: Summary and Recommendations" (October 2018) | https://autismcrc.com.au/best-practice/sites/default/files/resources/National_Guideline_Summary_and_Recommendations.pdf |
| 105 | Moore P, Streeton C. Oral hormonal contraception in special circumstances. Australian Family Physician 2017 (October) | https://www.racgp.org.au/afp/2017/october/oral-hormonal-contraception-in-special-circumstanc |
| 106 | MBS Online, fact sheet "Changes to Medicare Benefits Schedule items for bone densitometry" (changes of 1 November 2017) | https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-MBSBoneDensitometryItems |
| 107 | ASHM, hepatitis B toolkit, "Management and care of hepatitis B" | https://ashm.org.au/hepatitis-b-toolkit/management-and-care-of-hepatitis-b/ |
| 108 | RANZCR, "Clinical radiology critical results and adverse outcomes notification" (position statement, version 1.1, 2024; the page only) | https://www.ranzcr.com/college/document-library/cliniradiology-critical-results-and-adverse-outcomes-notification |
| 109 | Australian Digital Health Agency, developer centre, "Electronic prescriptions" | https://developer.digitalhealth.gov.au/initiatives-and-programs/electronic-prescriptions |
| 110 | Therapeutic Goods Administration, "Understanding clinical decision support system software regulation" | https://www.tga.gov.au/node/452893 |
| 111 | Therapeutic Goods Administration, "Excluded software: interpretation of software exclusion criteria", version 1.0 (July 2024) | https://tga.gov.au/sites/default/files/2024-07/excluded-software.pdf |
| 112 | Services Australia, "Medical certificates" (the Centrelink Medical Certificate, form SU415) | https://servicesaustralia.gov.au/complete-medical-certificate-for-centrelink |
| 113 | Services Australia, "How to claim" (Parental Leave Pay) | https://www.servicesaustralia.gov.au/how-to-claim-parental-leave-pay |
| 114 | Gabb GM, et al. Guideline for the diagnosis and management of hypertension in adults: 2016. Med J Aust 2016;205(2):85-89 (summary of the Heart Foundation guideline) | https://www.mja.com.au/journal/2016/205/2/guideline-diagnosis-and-management-hypertension-adults-2016 |
| 115 | Atherton JJ, et al. National Heart Foundation of Australia and Cardiac Society of Australia and New Zealand: Australian clinical guidelines for the management of heart failure 2018. Med J Aust 2018;209(8):363-369 (summary) | https://mja.com.au/journal/2018/209/8/national-heart-foundation-australia-and-cardiac-society-australia-and-new-0 |
| 116 | Services Australia, "Adult Crohn's Disease Activity Index form (PB393)" | https://www.servicesaustralia.gov.au/pb393 |
| 117 | Stroke Foundation, "Clinical Guidelines for Stroke Management: summary for general practitioners" (June 2025) | https://informme.org.au/media/grmfajgt/general-practitioners-clinical-guidelines-summary_jun25.pdf |
| 118 | RACGP, "Management of type 2 diabetes: a handbook for general practice", "Assessment of the person with type 2 diabetes" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/management-of-type-2-diabetes/assessment-of-the-person-with-type-2-diabetes |
| 119 | RACGP aged care clinical guide (Silver Book), Part A, "Polypharmacy" | https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/silver-book/part-a/polypharmacy |
| 120 | RANZCOG, "Routine antenatal assessment in the absence of pregnancy complications" (C-Obs 3b, March 2022) | https://ranzcog.edu.au/wp-content/uploads/Routine-Antenatal-Assessment.pdf |
| 121 | Australian Government Department of Health, fact sheet "Chronic disease individual allied health services: MBS items 10950 to 10970" | https://www.health.gov.au/sites/default/files/documents/2021/12/chronic-disease-individual-allied-health-services-mbs-items-10950-10970.pdf |
| 122 | Thompson AJV. Australian recommendations for the management of hepatitis C virus infection: a consensus statement (summary). Med J Aust 2016;204(7):268-272 | https://mja.com.au/journal/2016/204/7/australian-recommendations-management-hepatitis-c-virus-infection-consensus |
| 123 | Australian and New Zealand College of Anaesthetists, PG06(A) "Guideline on the anaesthesia record" (2020) | https://www.anzca.edu.au/getattachment/7a980821-2346-4659-80ab-b85c209d8254/PG06(A)-Guideline-on-the-anaesthesia-record-(PS06) |
| 124 | National Prescribing Service, fact sheet "Measuring liquid medicines for children" (2012) | https://resources-psa.amh.net.au/public/measuring-liquid-medicines.pdf |
| 125 | PBAC public summary document, nemolizumab, July 2025 | https://prod3.pbs.gov.au/industry/pbac/psd/2025/07/nemolizumab-psd-july-2025.pdf?variant=3 |
| 126 | Services Australia, "Severe chronic plaque psoriasis" (forms page) | https://www.servicesaustralia.gov.au/psoriasis-severe-chronic-plaque-psoriasis |
| 127 | Nelson MR, et al. 2023 Australian guideline for assessing and managing cardiovascular disease risk. Med J Aust 2024;220(9) (summary) | https://www.mja.com.au/journal/2024/220/9/2023-australian-guideline-assessing-and-managing-cardiovascular-disease-risk |
| 128 | Psychology Board of Australia, "Endorsement FAQ" (reviewed 17 April 2024) | https://www.psychologyboard.gov.au/Endorsement/FAQ.aspx |
| 129 | Vajda FJE. Monitoring antiepileptic drug therapy with serum level measurements. Med J Aust 2007;187(10):581 (a commentary, not a guideline) | https://www.mja.com.au/journal/2007/187/10/monitoring-antiepileptic-drug-therapy-serum-level-measurements |
| 130 | Malhi GS, et al. Lithium therapy and its interactions. Aust Prescr 2020;43(3):91-93 (a review, not a guideline) | https://www.nps.org.au/assets/p91-Malhi-et-al-v3.pdf |
| 131 | Services Australia, "Referring and requesting Medicare services" | https://www.servicesaustralia.gov.au/refer-or-request-medicare-services |
| 132 | Australian Commission on Safety and Quality in Health Care, "National guidelines for presentation of electronic discharge summaries" (September 2025) | https://www.safetyandquality.gov.au/sites/default/files/2025-11/national-guidelines-for-presentation-of-electronic-discharge-summaries.pdf |
| 133 | ASHM, HIV management site, laboratory monitoring table (the page's title and date were not in the text returned) | https://hivmanagement.ashm.org.au/?p=4022 |
| 134 | Australian Medicines Handbook, terms and conditions (multi-user licence) | https://shop.amh.net.au/about/termsandconditions/multi |
| 135 | Notya audit of the United States, second pass (the shared kit arithmetic checked against primary publications) | docs/araclar-denetim/US.md, section "Second pass (2026-10-10)" (branch araclar-denetim/us, commit 5a19decf) |

Read again in the second pass, under their first-pass numbers: [13] (the kidney handbook), [17] (the heart-risk calculator's terms page), [22] (the prostate guideline's summary), [26] (the graded return to sport framework), [28] (the College's breast imaging page), [37] (the hearing program's requirements).
