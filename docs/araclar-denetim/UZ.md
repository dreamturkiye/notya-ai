# Tools and specialties audit: Uzbekistan (`uz`)

## Second pass (2026-10-10)

The first pass ran out of its search allowance after eighteen searches: 106 of the 158 verdicts were left "unverified", among them 27 of the 48 tools that are switched on and 48 of the 52 placeholders. This pass ran alone, with an allowance of its own (120 searches; 83 were used), and went back to the sources. It changed this document and the data file and nothing else: no code, pack, test or kit file; nothing was merged or deployed. Rows it resolved or re-read carry `pass: 2` in `uz-kararlar.json`; in the tables of Part 1 a verdict cell that says "second pass" was changed here. Everything under the heading "First pass" is the first pass as it was written, except those verdict cells. **The specialty part (Part 3) was not reopened.**

**How the sources were read.** Through a tool that opens only an address a search has surfaced and returns the text of the page or a summary of it. Sources are mostly in Uzbek and Russian and were read in the original; official names are given as the source writes them. Every figure taken from a source is as that tool returned it, and nothing was written from memory. Before a number in the code is changed, a local clinician opens the source again. Nobody of Uzbekistan (no clinician, no lawyer, no native reader) has read this, and no body named here has reviewed or endorsed anything. A source in square brackets with "P2" in front, like [P2-ORD121], is in the table "Sources read in the second pass" at the end of this section.

**What was not checked again.** The arithmetic of the shared kit was checked against primary publications by the second passes of the United States, Australia, New Zealand, the United Kingdom and Canada, and those results are carried here by reference: the PASI, EASI (with the weights under 8 and the band fault), SCORAD and DAS28 formulas; the 28 joints; the antibiotic "last day"; the ASA class list; the kidney tool's "low risk" with no urine result; the training-ratio warning; the dose tool's trailing zeros and its rounding; the vertigo note's missing warning signs; and which lists hold no number. They are marked [P2-US], [P2-AU], [P2-NZ], [P2-GB], [P2-CA]: `docs/araclar-denetim/US.md` on `araclar-denetim/us` (commit `5a19decf`), `AU.md` on `araclar-denetim/au` (`db93ed45`), `NZ.md` on `araclar-denetim/nz` (`b77460ce`), `GB.md` on `araclar-denetim/gb` (`25532d81`), `CA.md` on `araclar-denetim/ca` (`84b435aa`), each under "Second pass (2026-10-10)". The searches of this pass went to what is specific to Uzbekistan.

**The one thing that limited this pass.** The Ministry of Health publishes its national clinical protocols as files on the government portal, and its own pages list them by script: opened, those pages came back with their menu and no document. A protocol could be read only when a search happened to surface its file. Four did (two national standards of 2024, two national protocols of 2025) and the antenatal collection of 2021 surfaced on a United Nations site. The protocols for chronic kidney disease, psoriasis, atopic dermatitis, rheumatoid arthritis, hearing loss, asthma and COPD, stroke, prostate disease, hepatitis and HIV never surfaced, in Russian or in Uzbek, and the row of each tool that waits on one says so.

### Counts before and after

| | First pass | Second pass |
|---|---|---|
| Keep | 26 | **42** |
| Revise | 10 | **37** |
| Remove | 16 | **17** |
| Unverified | 106 | **62** |
| of the 48 tools that are on: unverified | 27 | **2** |
| of the 48 tools that are on: keep / revise / remove | 15 / 6 / 0 | **31 / 14 / 1** |
| of the 52 placeholders: unverified | 48 | **29** |
| of the 52 placeholders: revise | 4 | **23** |
| Record lists with no number in them (`recordOnly`) | not marked | **22** |
| Proposed tools | 10 | **5** (5 dropped) |
| Core set | 15 | **12** (3 dropped until their source is found) |
| Web searches used | 18, then the allowance ran out | 83 of the 120 allowed |

The 62 still unverified: 2 live tools, 29 placeholders, 1 absent tool, and the 30 clinic tools of the Turkish product that are not in the country kit and follow the role verdicts of Part 3 (not reopened). Of the 31 live tools kept: 22 are record lists, 3 are the product's own screens, the follow-up list, and 5 are tools checked against a source (visual acuity, DAS28, the 28-joint count, PSA rate of change, dose arithmetic).

### Faults confirmed, safety first

Rows 1 to 13 are **live**: a doctor in the Uzbek build sees them today. Rows 14 to 17 concern placeholders that are off. "Carried" means the fault is the shared kit's and was confirmed against its source by an earlier second pass; the example was read again in the Uzbek pack's own text. Rows 4, 5, 8 and 14 to 17 rest on a source of Uzbekistan read in this pass.

| # | Tool | State | What the code does | What the source read says | One example |
|---|---|---|---|---|---|
| 1 | Kidney tools (`kdigo-evre`, `kdigo-serit`) | **on** (off in several other packs) | Show a risk colour when no urine albumin result was typed. The internal-medicine tool also calls three things a "KDIGO boʻyicha nefrologga yoʻllash mezoni" | Carried [P2-US], which read KDIGO 2024: the risk cell is defined by two results; the guideline's referral list asks for a ratio of 300 mg/g or more together with haematuria (or a much higher ratio), a *sustained* fall of more than 20%, and does not list "the very-high-risk cell" | An eGFR of 75 and nothing else: "Past xavf (yashil katak)". eGFR 75, ratio 350 mg/g, no blood in the urine: the screen says a KDIGO referral criterion is met; by the list read it is not |
| 2 | EASI (`easi`) | **on** | One set of region weights at every age; never asks the age | Carried [P2-US]: the instrument's guide has a second set for a child under 8 | A young child, head and neck only, all four signs 3, area score 6: the tool gives 7.2; with the guide's multiplier for that age it is 14.4 |
| 3 | Vertigo note (`vertigo-notu`) | **on** | With any of six "central signs" ticked it says a repositioning manoeuvre is not suitable; its weakness item names the face only ("yuz asimmetriyasi, uvishish yoki kuchsizlik") | Carried [P2-CA]: a review of bedside diagnosis supports the rule and gives a longer list: weakness or altered sensation of the limbs, poor coordination, sustained headache or neck pain, among others | Weakness of an arm with the vertigo has no box, and the result reads "Markaziy sababga ishora qiluvchi belgi belgilanmagan" |
| 4 | Pure-tone audiometry (`odyometri-pta`) | **on** | Calls any average up to 25 dB "Meʼyor chegarasida (25 dB gacha)" and names five degrees after two American papers; flags a difference between the ears at exactly 15 dB | Carried [P2-US]: the cited paper's own table has a "slight" step from 16 to 25 dB; the source read on asymmetry says more than 15. Uzbekistan: no national surdology guidance was found. The one local source read, a 2023 paper from the Republican paediatric centre, writes the first degree as "1 степени (20-40 дБ)" and counts degrees by number [P2-HEAR-UZ] | All four thresholds at 22 dB: the screen says "within normal limits"; by the range that paper prints, it is a first-degree loss |
| 5 | Stages of return to sport (`rtp-basamak`) | **on** | Six stages numbered 0 to 5, beginning "0-bosqich: dam olish va simptomlarni nazorat qilish"; holds no day count and does not say it is for concussion | No national source found. The international consensus statement (Amsterdam 2022): six steps numbered 1 to 6, the first "Symptom-limited activity", strict rest to be avoided, each step typically at least 24 hours [P2-CONCUSSION] | "Stage 0: rest" is not a step of the consensus, and the tool counts 0 to 5 where the consensus counts 1 to 6 |
| 6 | ASA class (`asa-preop`) | **on** | Offers I to V and "E" as six choices of which one is taken | Carried [P2-US]: six classes, I to VI; E is a marker added to a class | Choosing E gives "ASA E" with no class; class VI cannot be recorded |
| 7 | Antibiotic course (`antibiyotik-sure`) | **on** | "The day the course ends" = first day plus the number of days | Carried [P2-US]: counted from day 1, a course ends one day earlier | 7 days from 01.10: the tool shows 08.10; the last day of treatment is 07.10 |
| 8 | ESI triage (`esi-triyaj`) | **on** | Shows the name, five levels and paraphrased decision points of an American scale | The national act orders admission departments that sort patients by severity ("triaj") and **names no scale** [P2-PQ283]. The scale's owner forbids use without written permission and holds the name as a registered mark [P2-US] | The screen title "ESI triaj darajasi" presents as the national practice a scale no national document read names, without its owner's licence |
| 9 | PASI and SCORAD (`pasi`, `scorad`) | **on** | PASI: three bands; an unfinished form is scored as zeros. SCORAD: exactly 50 is "severe"; 0 is "mild" | Carried [P2-US]: the formulas are right; no source read supports the PASI bands; the rights holder's page says above 50 | One erythema score alone gives "PASI 0", shown as mild |
| 10 | Injury log (`sakatlik-gunlugu`) | **on** | Warns from a training ratio of 1.3 inclusive; divides minutes by minutes | Carried [P2-US]: the cited paper puts 1.3 at the top of its low-risk range and multiplies effort by minutes | 390 minutes this week against a usual 300: ratio 1.3, a warning |
| 11 | Pain and function (`vas-fonksiyon`) | **on** | Names a severity from a formula nobody published | The same verdict in all six audits: keep the two numbers, drop the grade | Pain 5 of 10 with little loss of function reads "mild pain and limitation" |
| 12 | Inhaler technique (`inhaler-teknik`) | **on** | One item states "Nafas 5–10 soniya ushlab turildi" | No source for the figure was read for Uzbekistan; the United States pass found its national instructions worded otherwise [P2-US] | The tick-box asserts a breath-hold time the product cannot cite |
| 13 | Report outline (`rapor-taslagi`) | **on** | Offers the BI-RADS categories by name | Carried [P2-US], on the College's own page: commercial software needs a copyright licensing agreement; a registered trademark | Live without a licence |
| 14 | Cardiovascular risk (`kv-risk-score2`) | off | The Turkish tool behind the slot defaults to the "high" region and takes cholesterol in mg/dL | The national standard of 2024 names the "Шкала SCORE" at each visit to the general practitioner, with no region [P2-STD-AG]; the 2015 collection orders a yearly assessment "по таблице ВОЗ/МОГ" [P2-CARD15]; WHO's package puts Uzbekistan in its "Central Asia" region with cholesterol in mmol/L [P2-HEARTS]; the first pass read Uzbekistan in SCORE2's very-high-risk region | Three different charts are named for this country by the documents read. Switching the slot on with any one of them, before a cardiologist says which is meant, shows a doctor a risk from the wrong chart |
| 15 | Laboratory units (every slot that reads a result) | off | The kit computes in mg/dL and g/dL; the pack states one unit, unverified | National protocols write haemoglobin in g/l, glucose and cholesterol in mmol/l, HbA1c in %, C-reactive protein in mg/l, ESR in mm/h [P2-ANC], [P2-CARD15], [P2-PROT-JIA] | A haemoglobin limit typed as 110 into a mechanism that compares in g/dL would be wrong by a factor of ten: the pack must state "g/L" first |
| 16 | Certificates (`hasta-belgeleri`) | off | The slot assumes the product's doctors issue the incapacity certificate | The order read lets a private organisation issue it only under conditions that, as the summary read them, include working as an inpatient facility [P2-ORD25] | A private outpatient clinic may not be allowed to issue the certificate the slot would draft: a lawyer reads paragraph 5 before anything is built |
| 17 | Prescription (`recete`) | off | The slot is described as "prescription drafting" | Order No. 121: the name in Latin by international nonproprietary name, the way of use in the state language, a private organisation's licence shown, an electronic prescription only with a digital signature and recorded in a single database [P2-ORD121] | A printed draft is not a prescription here |

### Checked against a source and found right

- **Dose arithmetic: the fault found in the English packs does not carry here.** There the tool's fixed decimals ("160.00 mg", "5.0 mL") break national rules against a zero after the decimal mark. The Uzbek prescribing regulation writes its own examples with one: solid substances "grammlarda (0,001; 0,5; 1,0)", liquids in millilitres or drops (clause 19, for medicines made up to order) [P2-ORD121]. It has no rule on rounding a dose and none on dosing by body weight. No rounding step was found, for or against.
- **DAS28 for Uzbekistan.** Formulas, CRP in mg/L and the four bands: [P2-US], [P2-GB]. The units are the ones a national protocol writes: "мг/л" for C-reactive protein and "мм/ч" for ESR [P2-PROT-JIA]. The unit trap found in the United States does not arise here.
- **PSA rate of change.** The unit the tool shows, ng/ml, is the one the Republican Specialised Scientific-Practical Medical Centre of Urology writes ("нг/мл") [P2-PSA-UZ]. No band and no threshold, which fits what three other passes read in their national guidelines.
- **Visual acuity.** The conversion is a definition and the tool takes a decimal value or a fraction ([P2-AU], [P2-CA]). Which notation is recorded here was not found: not a fault.
- **The kit's conversion factors.** Creatinine: the paper that defines the 2021 kidney equation gives the same factor to micromoles per litre as `lib/ulke/araclar/birimler.ts` [P2-CKDEPI]. Cholesterol: WHO's package gives the same factor between mg/dL and mmol/L [P2-HEARTS].
- **Carried and right in every country:** the albumin categories at 30 and 300 mg/g and the GFR categories; the 28 joints; the PASI formula; EASI for a patient of 8 or over; the SCORAD formula [P2-US].
- **The first pass's readings confirmed on a second reading:** cholesterol and glucose in mmol/l in the 2015 collection [P2-CARD15]; the vaccination calendar's act, with the amendment of 19.07.2021 the latest shown [P2-IMM].
- **Twenty-two tools hold no number at all** (below).

### Every verdict that changed, and why

**(a) 12 live tools: unverified → keep, as record lists.** Each is the same shared tool the United States and Australian second passes opened in the code, each is switched on in the Uzbek pack, and the kit definition of each was read again here: tick-boxes, choices and dates, with no formula, weight, cut-off, band, grade, interval or stage. No guideline can confirm or contradict them. Their wording, machine-written in three forms, still waits for a native reader and a local clinician. In the data file: `recordOnly: true`.

Critical conditions checklist (`kritik-yol`) · Airway note (`hava-yolu-notu`) · Post-operative pain follow-up (`postop-agri`) · Checklist after a neurosurgical operation (`noro-postop`) · Seizure and consciousness follow-up (`nobet-bilinc`) · Checklist before and after an operation, paediatric surgery (`cocuk-prepost-op`) · Pre-operative checklist (`genel-preop`) · Checklist before a chest operation (`toraks-preop`) · Checklist before a heart or vascular operation (`kalp-damar-preop`) · Otoscopy note (`otoskopi-notu`) · Side effects checklist (`toksisite-listesi`) · Post-operative checklist, orthopaedics (`ortopedi-op-protokol`)

Ten more were already "keep" and are now marked record lists too: `yara-dren-izlem`, `rejim-karti`, `toraks-tup-yara`, `greft-yara-izlem`, `antikoagulan-vadeleri`, `diyaliz-seans`, `kur-sayaci`, `kirik-alci-takip`, `plastik-yara-greft`, `tetkik-kuyrugu`. The Uzbek pack switches on more tools than the English packs; the extra ones (ESI, both kidney tools, dose arithmetic, the report outline) are not record lists and have rows of their own.

**(b) 4 live tools: unverified → keep, on a source.**

| Tool | Why |
|---|---|
| Visual acuity (`gorme-keskinligi`) | A definition, found right by three passes; the local notation is still to be named, which changes only the order of two input forms |
| DAS28 (`das28`) | Formula and bands carried; the units are those of a national protocol [P2-PROT-JIA] |
| 28-joint count (`eklem-28`) | The joints are the developers' list [P2-US] |
| PSA rate of change (`psa-hizi`) | The unit is the national urology centre's; no threshold [P2-PSA-UZ] |

**(c) 8 live tools: unverified → revise.**

| Tool | Why |
|---|---|
| ASA class (`asa-preop`) | E offered as a class; no class VI (fault 6) |
| PASI (`pasi`) | Formula right; bands unsupported; an unfinished form scored as zeros (fault 9) |
| SCORAD (`scorad`) | Formula right; exactly 50 called severe (fault 9) |
| Inhaler technique (`inhaler-teknik`) | A record list in the code; one item carries a figure nobody can cite (fault 12) |
| Pure-tone audiometry (`odyometri-pta`) | Degrees and limits not those of the one local source read, nor of the kit's own citation (fault 4) |
| Vertigo note (`vertigo-notu`) | The rule stands; the list of central signs is too short (fault 3) |
| Stages of return to sport (`rtp-basamak`) | Not the steps of the international consensus (fault 5) |
| Injury log (`sakatlik-gunlugu`) | Warns at a figure its own source counts as low risk (fault 10) |

**(d) 1 live tool: unverified → remove (switch off, keep as a slot).** ESI triage (`esi-triyaj`), fault 8. Two grounds, either enough: the owner's licence is missing, and the national act names no scale. It returns as a neutral record of the triage level when a local emergency physician names the scale in use, or under the owner's written permission.

**(e) 19 placeholders: unverified → revise.** For each, the national source that would fill it, or its owner's terms, is now known and should be written into the slot. A slot stays empty and switched off until a local clinician (or a lawyer) supplies and signs its content.

| Slot | What is now known | Source |
|---|---|---|
| Prescription drafting (`recete`) | The regulation of order No. 121 of 01.07.2020 was read (fault 17) | [P2-ORD121] |
| Certificates for patients (`hasta-belgeleri`) | The instruction of order No. 25 of 20.03.2015 was read (fault 16) | [P2-ORD25] |
| Laboratory and imaging request (`tetkik-istek`) | Units as national protocols write them (fault 15); creatinine and the urine albumin ratio still not found | [P2-ANC], [P2-CARD15], [P2-PROT-JIA] |
| Diabetes and hypertension follow-up, family medicine (`aile-kronik`) | Two national clinical standards of order No. 290 of 09.09.2024, each listing examinations with a minimum number of times | [P2-STD-AG], [P2-STD-DM2] |
| Consent for an operation on a child (`cocuk-onam-veli`) | The law: a minor over 14 consents himself; informed consent is the precondition of an intervention. The clause on children under 14 was cut off | [P2-LAW265] |
| Informed-consent checklist, plastic surgery (`plastik-onam`) | The same law, article 26; what a cosmetic consent must contain: not found | [P2-LAW265] |
| Anticoagulation review (`antikoagulan`) | A national protocol estimates creatinine clearance by the Cockcroft-Gault formula when an anticoagulant is needed and lists CHA2DS2-VASc among its abbreviations | [P2-PROT-IHD] |
| HbA1c and TSH follow-up (`lab-izlem`) | The diabetes standard lists HbA1c with a minimum number of checks, no interval in months; HbA1c is written in % | [P2-STD-DM2], [P2-ANC] |
| Hypertension, heart-failure and atrial-fibrillation follow-up (`kardiyo-izlem`) | The hypertension standard; angina in four classes of the Canadian society; heart failure by NYHA | [P2-STD-AG], [P2-PROT-IHD], [P2-CARD15] |
| COPD Assessment Test with the mMRC grade (`cat-mmrc`) | The owner's terms: a signed agreement for use in an electronic record | [P2-US] |
| Pregnancy calendar (`gebelik-takvimi`) | The national antenatal protocols of 2021: the dating rule and a schedule of visits | [P2-ANC] |
| Maternity leave dates and certificate (`dogum-analik-raporu`) | The Labour Code as the government's legal-advice page states it; the certificate order | [P2-MATERNITY], [P2-ORD25] |
| Medical eligibility for contraception (`kontrasepsiyon-mec`) | The WHO edition: fifth (2015), "All rights reserved", and a sixth (2025) exists; commercial use needs WHO's permission | [P2-WHO-MEC], [P2-WHO-COPY] |
| Obstetric risk prompts and caesarean note (`obstetrik-risk`) | National protocols on hypertension and cardiovascular disease in pregnancy and on post-partum haemorrhage, by title | [P2-ANC] |
| MIDAS (`midas`) | All rights reserved | [P2-US] |
| M-CHAT-R/F (`mchat-rf`) | The owner's site lists an Uzbek translation and three Russian ones; rights retained by the authors | [P2-MCHAT-TR], [P2-US] |
| PHQ-9 and GAD-7 (`phq9-gad7`) | Free by the owner's notice (read on a copy; a person confirms on the owner's site) | [P2-US] |
| Safety and emergency triage, psychiatry (`psikiyatri-guvenlik-triyaj`) | The law on psychiatric care of 2021: who may provide care, the grounds and the time limits of admission without consent; it names no scale | [P2-LAW690] |
| Pain scale with the Oswestry index (`vas-odi`) | A licence through a rights agency; a fee for commercial users | [P2-US] |

**(f) Verdict unchanged, findings added** (the rows of the data file say what): both kidney tools (the safety fault is live here), EASI, the antibiotic course, the pain-and-function rating, the report outline (licence read), dose arithmetic (the English packs' fault does not carry), the cardiovascular-risk slot, diagnosis coding, the two vaccination slots, and fourteen slots that stay unverified with what was found.

### The Uzbekistan versions of the shared items

| Item | Uzbekistan, as read | Where the code stands |
|---|---|---|
| Cardiovascular risk chart | Three documents, three charts. The national clinical standard for arterial hypertension (annex 2 to order No. 290 of 09.09.2024): "Шкала SCORE" at each visit to the general practitioner; no region, no units, no SCORE2 [P2-STD-AG]. The 2015 collection: a yearly assessment "по таблице ВОЗ/МОГ" [P2-CARD15]. WHO's 2020 package: Uzbekistan in the "Central Asia" region, a laboratory chart with cholesterol in mmol/L and a non-laboratory one [P2-HEARTS]. The national hypertension *protocol* never surfaced | Slot off: **stays off** (fault 14) |
| Laboratory units | Haemoglobin g/l, glucose mmol/l, HbA1c % [P2-ANC]; cholesterol and glucose mmol/l [P2-CARD15]; C-reactive protein mg/l, ESR mm/h [P2-PROT-JIA]; PSA ng/ml [P2-PSA-UZ]. **Not found in any national text read:** creatinine and the urine albumin-to-creatinine ratio (the two standards of 2024 name both tests without a unit) | The pack states one unit (the ratio, mg/g), still unverified |
| Degrees of hearing loss | No national surdology document found. One paper of a national specialised centre: first degree 20 to 40 dB, degrees by number [P2-HEAR-UZ]. Newborn hearing screening is being extended to all maternity facilities (a Ministry statement of 2022) [P2-AUDIO22] | **revise** (fault 4) |
| Growth standard | **Not found** in five searches of this pass (Uzbek, Russian, English). A 2009 workshop resolution on child nutrition mentions an order "# 145" on complementary feeding, not growth | Slot off; unverified |
| Expected height | **Not found.** A 2025 review from the Republican endocrinology centre gives no formula and cites no national protocol | Formula correction right [P2-US]; the range of 8.5 cm either side has no local source: **unverified** |
| Visual acuity notation | **Not found.** The criteria annex of the resolution on medical-social expertise (Cabinet of Ministers, No. 62 of 08.02.2022), which may write acuity and hearing, was cut off in the text returned [P2-VMQ62] | **keep**: the tool takes both forms |
| Triage scale | Presidential resolution PQ-283 of 16.06.2022 orders emergency admission departments that sort by severity and names no scale, no number of levels and no colours; the Ministry's standards under it were not found [P2-PQ283] | **remove** the ESI tile (fault 8) |
| Immunisation calendar: legal basis | Law No. ZRU-393 of 26.08.2015, article 33: the National Calendar of Preventive Vaccinations is approved by the Chief State Sanitary Doctor [P2-LAW393]. The calendar: SanQvaM 0239-07/3, amendment of 19.07.2021 the latest shown [P2-IMM]. The schedule is not copied here | Slots off; **revise** (first pass) |
| Notifiable diseases: legal basis | **Not found** in five searches. The law above, as returned, holds no list, no form and no time limit for a doctor's notice | Slot off; unverified |
| Writing a dose | Order No. 121 of 01.07.2020 (registration No. 3277): quantities of solid substances in grams, with a zero after the comma in its own examples; liquids in millilitres or drops; no rounding rule; milligrams are not mentioned [P2-ORD121] | **keep** the dose tool |

### National documents found, by number and date

| Document | What was read |
|---|---|
| Minister of Health's order No. 290 of 09.09.2024, national clinical standards | Annex 2 (arterial hypertension) and the standard for type 2 diabetes [P2-STD-AG], [P2-STD-DM2] |
| Minister of Health's order No. 180 of 23.06.2025, national clinical protocols | Annex 3 (chronic ischaemic heart disease in older patients) and the protocol on systemic juvenile arthritis [P2-PROT-IHD], [P2-PROT-JIA] |
| The Ministry's page of its protocol orders (Nos. 84, 107, 195, 290, 401) | Titles only; the files it links could not be opened (their addresses were not surfaced by a search) [P2-REJA] |
| "Сборник национальных клинических протоколов по антенатальному уходу", 2021 (the "Нормальная беременность" protocol dated 24.07.2021; approved by the obstetric centre's scientific council on 29.07.2021, minutes No. 7) | Read [P2-ANC] |
| "Сборник клинических протоколов по диагностике, лечению и профилактике сердечно-сосудистых заболеваний", 2015 | Read again, as far as the arrhythmia section [P2-CARD15] |
| Presidential resolution PQ-283 of 16.06.2022, "Aholiga tez tibbiy yordam koʻrsatish tizimini takomillashtirish toʻgʻrisida" | Read [P2-PQ283] |
| Minister of Health's order No. 121 of 01.07.2020 (registration No. 3277), prescribing and prescriptions; editions of 28.07.2021, 16.12.2025 and 10.08.2026 listed. It replaced order No. 191 of 18.06.2010 (registration No. 2118) | Read [P2-ORD121], [P2-ORD191] |
| Minister of Health's order No. 25 of 20.03.2015 (registration No. 2667), incapacity certificates; latest edition 08.10.2025 | Read [P2-ORD25] |
| Law No. 265-I of 29.08.1996, "Fuqarolar sogʻligʻini saqlash toʻgʻrisida" (amendments shown up to 30.12.2025) | Read as far as article 26 [P2-LAW265] |
| Law No. OʻRQ-690 of 12.05.2021, "Psixiatriya yordami toʻgʻrisida" | Read as far as article 37 [P2-LAW690] |
| Law No. ZRU-393 of 26.08.2015 on sanitary-epidemiological well-being | Read (a copy on a United Nations legal database) [P2-LAW393] |
| SanQvaM 0239-07/3 (the vaccination calendar) | Read again for its status only [P2-IMM] |
| Cabinet of Ministers resolution No. 62 of 08.02.2022 on medical-social expertise | Read in part; the criteria annex was cut off [P2-VMQ62] |
| Presidential resolution PQ-2857 of 29.03.2017 on primary care | Read: the referral procedure is delegated to the Ministry and was not found [P2-PQ2857] |
| Presidential resolution of 16.05.2022 on viral infections | A press copy, without its number [P2-HEP22] |
| A Minister's order of 09.09.2026 (registration No. 3936) on vaccination when a quarantine infection threatens | Reported by a legal publisher on 11.09.2026; not opened on the legislation database [P2-NORMA-EMLASH] |
| The Ministry's digital-health platform guide (FHIR; a continuous build that says of itself it is not an official publication) | Two pages read: value sets for diagnosis type and for professions; no page for the classification of diseases, units, prescriptions or sick leave [P2-DHP], [P2-DHP-TOC] |
| ICD-11 in Uzbek on WHO's own browser (release 2024-01) | Seen [P2-ICD11-UZ] |

### Licence terms, as read

On the owner's own page unless the row says otherwise. "Free" and "needs permission" are a plain reading of the page, not legal advice.

| What | Result | What the page says | Page |
|---|---|---|---|
| Emergency Severity Index | **needs permission** | Registered marks of the Emergency Nurses Association; the handbook forbids use without written permission. Not read again | [P2-US] |
| ASA classes | **needs permission for the definitions** | The society's terms forbid reproduction without written consent; the tool shows class numbers only. Not read again | [P2-US] |
| KDIGO grid | **needs permission for a commercial product** | A non-commercial, no-adaptation Creative Commons licence. Not read again | [P2-US] |
| BI-RADS | **needs permission** | A copyright licensing agreement with the College for commercial software; a registered trademark. Not read again | [P2-US] |
| SCORE2 | **needs permission** | The European Society of Cardiology's copyright page, read in this pass: its guidelines are published for personal and educational use; "No commercial use is authorised"; nothing may be translated or reproduced without written permission, requested through Oxford University Press. Its SCORE2 page carries "© 2026 ESC. All rights reserved" and no licence. Neither page mentions software | [P2-ESC-COPY], [P2-ESC-SCORE2] |
| WHO cardiovascular risk charts | **needs permission for commercial use** | The HEARTS module (2020) is under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 IGO licence (read on a library's copy of the WHO file). The journal article on the charts is under CC BY 4.0 (first pass) | [P2-HEARTS], [P2-WHO-COPY] |
| WHO growth standards; WHO publications in general | **needs permission for commercial use** | WHO's copyright page, read in this pass: "Permission is required for commercial uses and licensing of WHO materials"; translations carry WHO's disclaimer. The same result as the United States pass | [P2-WHO-COPY], [P2-US] |
| ICD-10 and ICD-11 | **free to use unadapted, with citation** | WHO's classifications are under a no-derivatives licence and may be used for commercial and non-commercial purposes as long as the codes are not adapted and the work is cited; translations need a written agreement. An Uzbek ICD-11 is on WHO's browser | [P2-WHO-COPY], [P2-ICD11-UZ] |
| WHO medical eligibility criteria for contraception | **needs permission** | The fifth edition's page: "Copyright World Health Organization, 2015 - All rights reserved"; a sixth edition (2025) is available | [P2-WHO-MEC] |
| 2021 kidney equation (CKD-EPI) | **the equation is a fact; the article is not free** | "Copyright © 2021 Massachusetts Medical Society"; for personal use only (read on a repository copy) | [P2-CKDEPI] |
| PHQ-9, GAD-7 | **free** | The owner's notice, as copied by a terminology service; the owner's own site refuses automated readers. Not read again | [P2-US] |
| M-CHAT-R/F | **needs permission for a commercial or electronic product** | "Rights for the M-CHAT-R/F are retained by the original authors"; an Uzbek and three Russian translations are listed | [P2-MCHAT-TR], [P2-US] |
| COPD Assessment Test; Oswestry index; MIDAS | **needs permission** (each) | A signed agreement; a licence through a rights agency with a fee for commercial users; all rights reserved. Not read again | [P2-US] |
| IPSS | **unclear** | The two records reached show no terms. A local paper says a validated Uzbek version exists | [P2-IPSS-LOINC], [P2-IPSS-MAPI], [P2-URO-UZ] |
| BASDAI | **unclear** | The owner's terms were not reached; a third party's page reports two statements that contradict each other | [P2-BASDAI-3P] |
| STOPP/START | **unclear** | The record of the current version refused the reader | — |
| PASI, EASI, SCORAD, DAS28 | **unclear / unclear, leaning free / unclear / unclear** | As the United States pass read them; nothing of Uzbekistan changes this | [P2-US] |
| Return-to-sport steps of the consensus statement | **needs permission for the wording** | A journal publication; the tool should keep its own words | [P2-CONCUSSION] |
| National acts, standards and protocols | **official content** | No reuse statement was looked for; the texts are published by the state | — |
| The Ministry's digital-health platform guide | **unclear** | "IG © 2025+ Ministry of Health of the Republic of Uzbekistan"; no licence statement on the pages read | [P2-DHP] |

### The proposals and the core set

The rule of this pass: a proposal stays only if a national source **and** the publication that defines it were both read; otherwise it is dropped, and comes back when both are.

**5 proposals kept.**

| Proposal | National source read | Defining publication | Licence position |
|---|---|---|---|
| Body mass index and waist circumference | The antenatal protocols (2021) tell the clinician to work out the index and print its classes; the 2015 collection uses the index and waist circumference [P2-ANC], [P2-CARD15] | WHO's own page states the calculation and the adult classes and cites its Technical Report Series No. 854 (1995). It does not mention waist circumference, whose limits rest on the national text alone [P2-WHO-BMI] | Arithmetic free; WHO's wording needs permission |
| Kidney function: eGFR from creatinine | Partial: a national protocol lists CKD-EPI and MDRD among its abbreviations and prescribes Cockcroft-Gault for creatinine clearance [P2-PROT-IHD]. The protocol for chronic kidney disease never surfaced: **which equation it prescribes is unverified**, and a local nephrologist names it first | Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med 2021;385:1737-49, opened: the equation without race takes age, sex and serum creatinine, in mg/dL [P2-CKDEPI] | The equation is a fact; the article is for personal use only |
| Ten-year cardiovascular risk (stays a slot, off) | The hypertension standard of 2024 ("Шкала SCORE") and the 2015 collection (the WHO/ISH table) [P2-STD-AG], [P2-CARD15] | The SCORE2 paper (first pass) and WHO's HEARTS module [P2-HEARTS] | Needs permission for either chart |
| Gestational age and expected date of birth | The antenatal protocols (2021) state the dating rule [P2-ANC] | The same text is the rule's source | Official content |
| Vaccination status against the national calendar (stays a slot) | SanQvaM 0239-07/3 under article 33 of Law No. ZRU-393 [P2-IMM], [P2-LAW393] | No formula | An official act |

**5 dropped.**

| Proposal | Why |
|---|---|
| Infectious-disease notification as a core tool | No national source for the list, the form or the time limit in five searches. The slot `enfeksiyon-bildirim` stays, unverified, with its one specialty |
| NYHA functional class as a record | The national source stands [P2-CARD15]; the publication that defines the classes was not reached. Nothing is lost: the kit's `kardiyo-izlem` mechanism already records the class, and that slot now has national sources |
| Growth for age | No order or programme naming a standard was found. The slot `buyume-persentil` stays, unverified |
| Degree of hearing loss in the local classification | No national classification found; folded into the verdict on the audiometry tool |
| The seven candidates named from general knowledge | None confirmed. Two leads for a later pass, not proposals: CHA2DS2-VASc (in the abbreviation list of a national protocol that does not apply it) and creatinine clearance by Cockcroft-Gault (prescribed by the same protocol; its publication was not opened by any pass) [P2-PROT-IHD] |

**The core set: 12 of 15 stand.** Kept: the three product screens; the follow-up list; diagnosis coding (WHO's Uzbek edition and licence now read); prescription (order No. 121 read); certificates (order No. 25 read; **a lawyer decides whether an outpatient clinic may issue one at all**); laboratory and imaging requests (units partly read); the end-of-visit flow; body mass index; kidney function (after the kidney tool's faults are repaired, and with the equation named locally); dose arithmetic. **Dropped until their source is found**, each staying a slot: the visit and discharge summary document (the order on forms of medical documentation never surfaced), medicine interactions (the State Register's site never surfaced; no provider read), infectious-disease notification.

### Still unverified, and why

**2 live tools.**

- **Patch test: reading days** (`yama-okuma`). The arithmetic is not in doubt, and two other passes found the tool's two days in a source of their own. Nothing of Uzbekistan was found, and the European guideline the kit cites was reached only as a library record: its text is on the publisher's site. Two things for the reader: the society published an update in 2026 [P2-ESCD26], and a secondary summary of the 2015 guideline describes a further, later reading that the tool does not offer [P2-ESCD-NEWS]. Leaning: keep, and check the update.
- **Expected height** (`hedef-boy`), for the range only. The correction is right. The range of 8.5 cm either side is one country's figure: the sources of three other passes give 7, 8.5 and 10 cm, and nothing of Uzbekistan was found. A local paediatric endocrinologist states it.

**29 placeholders**, in six groups:

| Group | Slots | Exact reason |
|---|---|---|
| Wait on other slots (4) | End-of-visit flow; the follow-up panels of family medicine, obstetrics and gynaecology, paediatrics | Nothing to check until the slots they collect from are filled |
| The national protocol never surfaced (11) | HIV and viral hepatitis follow-up; hepatitis B and C follow-up; bowel-disease activity index; stroke and TIA red flags; antiseizure medicines; psychotropic medicines; bone densitometry; anaemia in kidney disease; CRP and ESR follow-up; written action plan for asthma and COPD; haematuria and stone triage | The Ministry's pages list protocols by script and came back empty; searches in Russian and Uzbek surfaced other countries' protocols. For anaemia and for CRP and ESR the units are now known (g/l; mg/l and mm/h) |
| The act, list or form was not found (6) | Visit and discharge summary; infectious-disease notification; admission, referral and discharge package; referral in primary care; development and screening panel; growth and percentiles | Two to five searches each. For referral the act that delegates the procedure was read (PQ-2857), not the procedure; for screening only press reports |
| The owner's terms were not reached (3) | Review of medicines in older patients (STOPP/START); BASDAI; IPSS | A refusal ("Access Denied"); a third party's contradictory report; two records without terms |
| Site never surfaced, no provider read (1) | Medicine interactions | The State Register's own site did not surface in two searches |
| Not searched: no web page settles it (4) | Pregnancy-prevention checks for isotretinoin; critical-finding notice; session plan; home exercise sheet | A regulator's programme, a local rule or a sheet a clinician writes |

**1 absent tool** (the phototherapy diary) and **the 30 clinic tools** of the Turkish product: unchanged. They follow the role verdicts of Part 3, which this pass did not reopen.

Also not settled, inside rows that now have a verdict: the unit of creatinine and of the urine albumin ratio; which revision of the classification of diseases doctors must code in today; which chart "SCORE" means in the 2024 standard; whether the national protocols for psoriasis, atopic dermatitis and rheumatoid arthritis use PASI, SCORAD and DAS28; how visual acuity is noted; the full text of articles 26 and 45 of the health law; paragraph 5 of the certificate instruction in the original.

### Pages that could not be read in this pass

Recorded and left: no cache, mirror or other tool was used to get round a refusal, and no robot check was answered.

- **Address not surfaced by a search, so the tool would not open it:** the five order files linked from the Ministry's page of protocol orders (Nos. 84, 107, 195, 290, 401).
- **Opened, and came back with a menu and no document:** the Ministry's sections "Kardiologiya", "Nefrologiya (Kattalar)", "Педиатрия" and "Стандарты диагностики и лечения".
- **Robot check:** one article on the WHO grades of hearing loss on PubMed Central. No other page of that site was tried.
- **Refused ("Access Denied"):** a university repository's record of STOPP/START version 3.
- **The fetch failed:** one branch page of the digital-health platform guide (another copy of its contents page loaded).
- **Cut off before the part needed:** the resolution on medical-social expertise (before its criteria annex, in Russian and in Uzbek); the health law (inside article 26); the law on psychiatric care (after article 37); the 2015 cardiology collection (in the arrhythmia section, as in the first pass).
- **Read as a record only, the text being on a publisher's site:** the European patch-test guideline of 2015 and its 2026 update.
- **Never surfaced by any search:** the national protocols named at the top of this section; the order naming a growth standard; the list of notifiable diseases and its form; the order on forms of medical documentation; the State Register of medicines; the Ministry's triage standard; any national audiology or ophthalmology guidance; WHO's own page of hearing grades; the owners' pages for IPSS and BASDAI.

### Where the searching stopped

83 of the 120 searches were used, in the order asked: the live tools and the Uzbekistan versions of the shared items first (more than half of them), then licences, then the proposals, then slots. The allowance was not refused. The search stopped because what is left is of three kinds: national protocols that the search engine does not index and the Ministry's pages do not show to a reader; questions no web page settles (a lawyer's reading of two acts, a clinician's choice of chart, range and notation, sheets a clinician writes); and owners' terms that need a person to ask. A later pass should begin with a person in Uzbekistan opening the Ministry's protocol list in a browser and naming the files.

### Sources read in the second pass (all on 2026-10-10)

In the data file the same keys are written with an underscore (`P2_ORD121`).

| Key | What | Where |
|---|---|---|
| P2-US, P2-AU, P2-NZ, P2-GB, P2-CA | The second passes of the five other country audits | `docs/araclar-denetim/{US,AU,NZ,GB,CA}.md` on `araclar-denetim/{us,au,nz,gb,ca}` |
| P2-REJA | Ministry of Health: page of its orders on clinical protocols and standards | <https://gov.uz/oz/ssv/pages/ishlab-chiqish-va-takomillashtirishi-reja-grafigi> |
| P2-STD-AG | "Национальный клинический стандарт медицинской помощи по нозологиям артериальной гипертензии", annex 2 to order No. 290 of 09.09.2024 | <https://api-portal.gov.uz/uploads/e2b0f23f-c841-0c15-6855-542b90832c07_media_.pdf> |
| P2-STD-DM2 | "Национальные клинические стандарты по нозологии «Сахарный диабет тип 2»", order No. 290 of 09.09.2024 | <https://api-portal.gov.uz/uploads/0a59cb90-914c-4b7f-343a-c7d1178b4142_media_.pdf> |
| P2-PROT-IHD | National clinical protocols on chronic ischaemic heart disease in older patients, annex 3 to order No. 180 of 23.06.2025 | <https://api-portal.gov.uz/uploads/10/2026/03/12/f12eec45-ef2e-1087-b039-e54e084eaba6_media_.pdf> |
| P2-PROT-JIA | "Национальный клинический протокол по ведению больных с ювенильным артритом с системным началом у детей", order No. 180 of 23.06.2025 | <https://api-portal.gov.uz/uploads/10/2026/03/07/c1e87c90-ebfe-7f4a-e9cd-655fdc8ee3a0_media_.pdf> |
| P2-ANC | "Сборник национальных клинических протоколов по антенатальному уходу", 2021 | <https://uzbekistan.unfpa.org/sites/default/files/submissions/protokoly_anu_1_2_3_4_5_6_12_13_rus.pdf> |
| P2-CARD15 | The 2015 cardiology collection, read again | <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| P2-PQ283 | Presidential resolution PQ-283 of 16.06.2022; a press note on it | <https://lex.uz/docs/-6076135> ; <https://yuz.uz/uz/news/bemorlarni-ogirlik-darajasi-boyicha-saralaydigan-shoshilinch-qabul-bolimlari-tashkil-etiladi> |
| P2-ORD121, P2-ORD191 | Order No. 121 of 01.07.2020 (registration No. 3277); the order it replaced | <https://lex.uz/docs/-4880063> ; <https://lex.uz/acts/-1653303> |
| P2-ORD25 | Order No. 25 of 20.03.2015 (registration No. 2667) | <https://www.lex.uz/acts/-2625878> |
| P2-LAW265 | Law No. 265-I of 29.08.1996 | <https://lex.uz/ru/acts/-26013> |
| P2-LAW690 | Law No. OʻRQ-690 of 12.05.2021 | <https://lex.uz/ru/acts/-5422209> |
| P2-LAW393 | Law No. ZRU-393 of 26.08.2015 | <https://faolex.fao.org/docs/pdf/uzb160237.pdf> |
| P2-IMM | SanQvaM 0239-07/3, read again for its status | <https://lex.uz/uz/acts/-5524039> |
| P2-NORMA-EMLASH | A legal publisher's note of 11.09.2026; the sanitary committee's news item of 23.09.2026 (names no act) | <https://www.norma.uz/uz/qonunchilikda_yangi/profilaktik_emlash_qachon_va_qanday_utkaziladi> ; <https://gov.uz/oz/sanepid/news/view/223776> |
| P2-MATERNITY | The government's legal-advice page on maternity leave | <https://gov.uz/oz/advice/673/document/2982> |
| P2-VMQ62 | Cabinet of Ministers resolution No. 62 of 08.02.2022 (in part) | <https://lex.uz/en/docs/5852492> ; <https://lex.uz/mact/-5852486> |
| P2-PQ2857 | Presidential resolution PQ-2857 of 29.03.2017 | <https://lex.uz/acts/-3177800> |
| P2-HEP22 | Presidential resolution of 16.05.2022 on viral infections (press copy) | <https://yuz.uz/uz/news/ayrim-dolzarb-virusli-infektsiyalar-tarqalishiga-qarshi-kurashish-chora-tadbirlarini-takomillashtirish-togrisida> |
| P2-HEAR-UZ | Inoyatova FI, et al. Hearing screening in Uzbekistan. Проблемы биологии и медицины 2023;6(150):121-125 | <https://sammu.uz/en/article/3560/download> |
| P2-AUDIO22, P2-SCREEN17 | A Ministry statement on newborn hearing screening (16.09.2022); a press report of the 2017 resolution on early detection of congenital disease | <https://yuz.uz/uz/news/yuqori-texnologik-operatsiyalar-yordamida-tugma-nuqson-bilan-dunyoga-kelgan-chaqaloqlarning-eshitish-qobiliyati-tiklanmoqda> ; <https://kun.uz/news/2017/12/25/bolalarda-tugma-va-irsij-kasalliklarni-barvakt-aniklas-dasturi-bujica-prezident-karori-imzolandi> |
| P2-PSA-UZ | Kadirov NU, et al. Early diagnosis of prostate cancer. Klinik va profilaktik tibbiyot jurnali 2024;4 (Republican urology centre) | <https://fjsti.uz/uploads/img/yangilikar/Klinik%20va%20profilaktik%20tibbiyot%20jurnali/JCPM%204-2024/Kadirov%20N.U..pdf> |
| P2-URO-UZ | Batirov BA, Gafarov RR. Проблемы биологии и медицины 2024;2(152) (Samarkand) | <https://sammu.uz/uz/article/3846/download> |
| P2-ICD11-UZ | ICD-11 in Uzbek on WHO's browser | <https://icd.who.int/browse/2024-01/mms/uz> |
| P2-DHP, P2-DHP-TOC | Uzbekistan Digital Health Platform implementation guide (two copies of a continuous build) | <https://build.fhir.org/ig/uzinfocom-org/digital-health-ig/uz/artifacts.html> ; <https://build.fhir.org/ig/vadi2/DHP-temp/uz/toc.html> |
| P2-WHO-COPY | WHO: copyright, licensing and permissions | <https://www.who.int/copyright> |
| P2-HEARTS | WHO, HEARTS technical package: risk-based CVD management, 2020 (a library's copy of the WHO file) | <https://medbox.org/dl/658041878feab530380db5f6> |
| P2-ESC-COPY, P2-ESC-SCORE2 | European Society of Cardiology: guidelines copyright; SCORE2 and SCORE2-OP page | <https://www.escardio.org/guidelines/clinical-practice-guidelines/ESC-Guidelines-Copyright/> ; <https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score-risk-charts/> |
| P2-CONCUSSION | Patricios JS, Schneider KJ, et al. Consensus statement on concussion in sport, Amsterdam 2022. Br J Sports Med 2023;57:695-711 (a sports federation's copy; the last 6,810 characters not read) | <https://usef.org/forms-pubs/W0WkvtCh7ak/2/consensus-statement> |
| P2-CKDEPI | Inker LA, et al. N Engl J Med 2021;385:1737-49 (a hospital repository's copy) | <https://iris.landspitali.is/ws/files/47615278/nejmoa2102953.pdf> |
| P2-WHO-BMI | WHO Nutrition Landscape Information System: body mass index | <https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women> |
| P2-WHO-MEC | WHO: Medical eligibility criteria for contraceptive use, fifth edition (publication page) | <https://who.int/publications/i/item/9789241549158> |
| P2-MCHAT-TR | M-CHAT-R/F translations (the owner's site) | <https://mchatscreen.com/mchat-rf/translations/> |
| P2-ESCD15, P2-ESCD26, P2-ESCD-NEWS | The European patch-test guideline of 2015 (a library record); its 2026 update (a record); a secondary summary | <https://www.lunduniversity.lu.se/lup/publication/cc32b413-055e-4436-99f5-7298e51a8a56> ; <https://www.citedrive.com/en/discovery/european-society-of-contact-dermatitis-guideline-for-diagnostic-patch-testingrecommendations-on-best-practice-update-2026/> ; <https://www.medznat.ru/en/news/medical-news/new-guideline-updates-best-practices-for-patch-tes> |
| P2-IPSS-LOINC, P2-IPSS-MAPI, P2-BASDAI-3P | Records reached for IPSS (no terms); a third party's page on BASDAI | <https://cdn.loinc.org/80976-4> ; <https://fairdata.mapi-trust.org/dataset/international-prostate-symptom-score> ; <https://camcops.readthedocs.io/en/latest/tasks/basdai.html> |

Opened and not used for any verdict: a 1999 regulation on the emergency service (lost force); Cabinet of Ministers resolution No. 526 of 19.07.2017; Presidential resolution PQ-215 of 25.04.2022; a joint order of 2013 on animal diseases; order No. 31 of 19.10.2021 on tuberculosis and occupations; an order of 2025 repealing rules of expert commissions; an attestation order of 2017; a 2019 press report on a draft regulation for cochlear implantation; a 2025 paper on its legal basis; four local papers on kidney disease, growth hormone deficiency and eye-care services; a 2018 note on the nephrology service; a 2023 press report on seven obstetric protocols; a 2009 workshop resolution on child nutrition.

## First pass (2026-10-10, earlier the same day)

Where a verdict cell below says "second pass", the reason is in the section above and in the data file; the text beside it is still the first pass's.

Written on 2026-10-10 by Claude, on branch `araclar-denetim/uz` from `feat/ulke-butun` (e254ebf8). The owner's order: for this country, decide which doctor tools and which specialties to keep, revise, remove or add, and propose a core tool set that is right for Uzbekistan and not Türkiye's.

**Nothing was changed.** This job wrote two files, this report and `docs/araclar-denetim/uz-kararlar.json` (the same decisions as data). No code, pack, test or kit file was touched; nothing was merged or deployed.

**Read this before the rest.** A verdict here stands only on a source that was opened in this session, or on the product's own code. Two things limited the sources:

- The web-search allowance is shared by the six country jobs and **ran out after eighteen searches of this job**. After that, only pages already found could be opened. Most clinical sources (the national protocols, the publications behind the scores, the licence terms of the questionnaires) could therefore not be looked for. Each such item is marked **unverified — needs a local clinician** and is not a decision.
- Pages are read through a tool that summarises. A name or a number quoted below was on the page; the sentence around it is a paraphrase. The legislation database lex.uz could be read through that tool only.

No dose, schedule, protocol, formula or cut-off in this report comes from memory. Where a threshold is named, it is the one written in the product's own code, and the file is named.

## The answer in one paragraph

The specialty list can be decided now; the tools mostly cannot. The Ministry of Health's nomenclature of medical specialties in force (the Minister's order No. 6 of 12.05.2021, registration No. 3303, annex revised in 2023) was found and read. Against it, of the 30 doctor specialties **24 keep their name, 6 should be renamed** (family medicine, therapy, surgery, radiology, rehabilitation, and cardiovascular surgery, which is two specialties here) and **5 recognised specialties are proposed to add**, dentistry first. Of the 10 clinic roles only one stands as it is: **5 need another name or another kind** (dietology and surdology are doctors' specialties here, not allied professions; "aesthetic surgery" and "clinic dermatology" are specialties the doctor list already has), **3 are not in the nomenclature at all** (hair transplantation, anti-ageing medicine, occupational therapy), and one could not be verified. For the tools, the build was confirmed as recorded (48 switched-on entries, 52 empty placeholders, 56 mechanisms in the kit; of Türkiye's 96 "keep" tools 66 done, 19 placeholders, 11 absent). Of the 48 switched-on entries **15 can stay as they are** (they record what the doctor enters and hold no clinical content), **6 must be revised** for reasons visible in the code itself, and **27 are unverified**: nothing found says doctors in Uzbekistan use them, and nothing says they do not. Read against the citations the code itself carries, no switched-on tool was seen to give a wrong number for an adult, though the publications themselves could not be opened; one (EASI) scores a young child with weights the kit itself says are for age 8 and over, and one placeholder (cardiovascular risk) would be wrong for this country if it were ever switched on with Türkiye's setting. A core set of 15 tools is proposed; twelve of them are tiles or placeholders of the build already.

## How to read the verdicts

| Word | Meaning |
|---|---|
| **keep** | Stays as it stands. Given only where the tool holds no clinical content of its own, or a source read today supports it. |
| **revise** | Stays, and something named must change. Given only where the code itself or a source read today shows what. |
| **remove** | Not for this country. |
| **unverified — needs a local clinician** | No source could be opened. Not a decision. "Leaning" says what the code suggests, so the local clinician knows where to look; it must not be applied. |

Class: **base** = the same for every role (in the pack, `roller: null`); **specialty** = only the roles named.

## The state of the build, confirmed

Read from the pack itself (`countries/uz/uygulama/araclar/`) and the kit (`lib/ulke/araclar/katalog.ts`) by a script, on 2026-10-10:

- **48 switched-on entries**: 3 base tiles for all 40 roles, 44 role tools for 23 roles, and the follow-up list for those 23 roles.
- **52 placeholders** ("slots"): empty, switched off, shown on no screen. Eight of them have their mechanism in the kit already and wait only for numbers the country must state.
- **56 mechanisms in the kit**; the eight not switched on are exactly those eight placeholders.
- Seventeen of the 40 roles have **no role tool at all**: family medicine, cardiology, neurology, psychiatry, gastroenterology, obstetrics and gynaecology, rehabilitation, and all ten clinic roles.
- The record "96 kept = 66 done / 19 placeholder / 11 absent" is the table in `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` and agrees with the pack: it counts the 144 tools of the Turkish registry, where one Uzbek tile often stands for several Turkish ones (the follow-up list alone stands for 22 "cohort" rows).

One laboratory unit is stated in the pack, the urine albumin-to-creatinine ratio in mg/g, and the pack itself marks it unverified.

## Part 1: every existing tool

Totals over everything the Uzbek build can show or has been refused: keep 26, revise 10, remove 16, unverified 106 (158 entries: 48 switched on, 52 placeholders, 11 absent, 14 blocked, 33 clinic tools that are not in the country kit).

### 1.1 What would be wrong or misleading here

In order of weight for a patient.

1. **Cardiovascular risk (placeholder `kv-risk-score2`, switched off).** The risk model is calibrated by region. The SCORE2 paper (Eur Heart J 2021;42:2439-2454, figure 5) and a 2022 table citing the 2021 European guideline put **Uzbekistan in the "very high risk" region**. The Turkish tool defaults to the "high" region, one step lower, and takes cholesterol in mg/dL (`specialties/dahiliye/engines/score2.ts`). Today nothing is shown, which is right. It must never be switched on with the Turkish setting. Which chart the current national hypertension protocol prescribes could not be read: local papers of 2023 use both the older SCORE and SCORE2, and primary care was trained on the WHO package of essential interventions, which has charts of its own.
2. **EASI (`easi`, switched on for dermatovenerology).** The tool uses one set of body-region weights. The kit's own comment says they are those of a patient aged 8 or older. The tool asks no age, and a dermatovenerologist here sees children. A young child's score is computed with the older patient's weights.
3. **Laboratory units.** The kit's arithmetic is written in mg/dL for creatinine, glucose and cholesterol and in g/dL for haemoglobin (`lib/ulke/araclar/birimler.ts`) and converts from whatever unit the pack states. The Uzbek pack states one unit only, and that one unverified. The 2015 national cardiology protocols write cholesterol and glucose in **mmol/l**. No switched-on tool reads those values today; every tool proposed below does, so the pack must state each unit, confirmed by a local laboratory, before any of them is switched on. A wrong unit is a wrong result by a fixed factor.
4. **ASA class (`asa-preop`).** The class field offers I, II, III, IV, V and E as six choices of which one is taken. Tried: the tool accepts "E" alone as the class. Whether that matches the ASA's own system was not checked against the ASA's text (not fetched).
5. **Antibiotic course (`antibiyotik-sure`).** Tried: first day 01.10.2026, 7 days, "the day the course ends" 08.10.2026. If the first day counts as day 1 the last day of treatment is the 7th.
6. **Pain and function (`vas-fonksiyon`).** Tried: pain 5 of 10 with little loss of function is named "mild pain and limitation". The band is the product's own invention, and the screen says so, but a named band reads as a grade.
7. **DAS28 (`das28`).** The pack words the bands "2,6–3,19 low" and "3,2–5,1 moderate", and uses the same cut-offs for the CRP form. Both points are to be checked against the cited sources, which were not fetched.
8. **Audiometry (`odyometri-pta`).** The degrees carry names from two papers of the United States. How local surdologists name the degrees was not found.
9. **Structured radiology report (`rapor-taslagi`).** It uses the BI-RADS categories of the American College of Radiology inside commercial software. The terms were not read: a licence question, not a clinical one.
10. **Kidney disease (`kdigo-evre`, `kdigo-serit`).** The doctor must type an eGFR; nothing in the build works it out from creatinine. The referral flags are guidance and no national protocol was found to hold them against.
11. **Triage (`esi-triyaj`).** Nothing found says emergency departments here work with this scale. The tool cannot give a wrong number, since it records the doctor's own choice; it can be the wrong scale.

### 1.2 Switched-on tools (48): keep 15, revise 6, remove 0, unverified 27 in the first pass; keep 31, revise 14, remove 1, unverified 2 after the second

Names on screen are machine-written and have been read by no native speaker; this audit did not judge wording. For every **keep** and **revise** in this table the source is the product's own code, read and run on the date above (the file is named in the data file); no outside source was needed for it, and none could be opened.

- **Note A**: the items are the product's own, carried over from the Turkish tool and translated. No source of this country exists to hold them against: the named reader reads the list and says what is missing or out of place.
- **Note B**: nothing to change in the arithmetic: the tool records what the doctor enters and holds no threshold, medicine or interval. A native reader still reads the wording.

| Key | Name on screen (Uzbek Latin / Russian) | Class | Who sees it | Verdict | What to change, and why | Licence |
|---|---|---|---|---|---|---|
| `hasta-portali` | Bemor sahifasi / Страница пациента | base | every role | **keep** | None. | none: a product screen |
| `sablonlarim` | Shablonlarim / Мои шаблоны | base | every role | **keep** | None. The pack brings no ready-made template, which is right. | none: a product screen |
| `konsultasyonlar` | Konsultatsiyalar / Консультации | base | every role | **keep** | None to the tool. The consent sentence waits on a lawyer (already recorded). | none: a product screen |
| `esi-triyaj` | ESI triaj darajasi / Уровень триажа ESI | specialty | Shoshilinch tibbiy yordam | **remove: switch off, keep as a slot** (second pass; was unverified) | Which triage scale emergency departments in Uzbekistan work with was not found in any source read. The tool records the level the doctor chose and works nothing out, so it cannot give a wrong number; it can be the wrong scale. A local emergency physician confirms, or names the scale used. | unclear: owned or published by others (the Emergency Severity Index handbook of the Emergency Nurses Association); terms not read |
| `kritik-yol` | Kritik holatlar nazorat roʻyxati / Контрольный список критических состояний | specialty | Shoshilinch tibbiy yordam | **keep: record list** (second pass; was unverified) | Note A. Reader: a local emergency physician. | none: the product's own |
| `asa-preop` | ASA va operatsiyadan oldingi nazorat roʻyxati / ASA и предоперационный контрольный список | specialty | Anesteziologiya va reanimatologiya | **revise** (second pass; was unverified) | The class field offers I, II, III, IV, V and E as six choices of which one is taken, so a class cannot be recorded together with E (tried: the tool accepts E alone). Whether that is a fault depends on the ASA's own statement of the system, which was not fetched: does E stand alone or is it added to a class, and does the system have a class the field does not offer? If so, correct the field. The checklist items beside it are the product's own: a local anaesthesiologist reads them. | unclear: owned or published by others (the ASA Physical Status Classification System of the American Society of Anesthesiologists); terms not read |
| `hava-yolu-notu` | Nafas yoʻllari boʻyicha qayd / Запись о дыхательных путях | specialty | Anesteziologiya va reanimatologiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local anaesthesiologist. | none: the product's own |
| `postop-agri` | Operatsiyadan keyingi ogʻriqni kuzatish / Наблюдение за послеоперационной болью | specialty | Anesteziologiya va reanimatologiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local anaesthesiologist. It holds a pain score from 0 to 10 and no analgesic or dose. | none: the product's own |
| `noro-postop` | Neyroxirurgik operatsiyadan keyingi nazorat roʻyxati / Контрольный список после нейрохирургической операции | specialty | Neyroxirurgiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local neurosurgeon. | none: the product's own |
| `nobet-bilinc` | Tutqanoq va ong holatini kuzatish / Наблюдение за приступами и сознанием | specialty | Neyroxirurgiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local neurosurgeon. | none: the product's own |
| `cocuk-prepost-op` | Operatsiyadan oldingi va keyingi nazorat roʻyxati / Контрольный список до и после операции | specialty | Bolalar xirurgiyasi | **keep: record list** (second pass; was unverified) | Note A. Reader: a local paediatric surgeon. Its consent item waits on the guardian-consent slot (a lawyer). | none: the product's own |
| `yara-dren-izlem` | Jarohat, drenaj va choklar kuzatuvi / Наблюдение за раной, дренажом и швами | specialty | Bolalar xirurgiyasi; Umumiy xirurgiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `kdigo-evre` | Buyrak surunkali kasalligi: KDIGO toifalari / Хроническая болезнь почек: категории KDIGO | specialty | Terapiya (ichki kasalliklar) | **revise** (second pass: findings added) | (1) The pack states the urine albumin-to-creatinine ratio in mg/g and marks that as unverified: confirm the unit local laboratories print before a doctor relies on it. (2) The doctor must type an eGFR; the build has no calculator from creatinine. Add one (Part 2), with creatinine in the unit local laboratories print. (3) The referral flags and the flag "fell by more than a quarter against a year ago" are guidance, not arithmetic: confirm them against the national protocol for chronic kidney disease, which was not found. (4) It answers a question every doctor of adults asks; in the core set it is shown to every doctor role, not to internal medicine alone. The grid itself was read against the kit's own citation only; the KDIGO text was not fetched. | unclear: owned or published by others (the KDIGO 2024 guideline); terms not read |
| `pasi` | PASI indeksi / Индекс PASI | specialty | Dermatovenerologiya | **revise** (second pass; was unverified) | The index follows the cited 1978 paper as the kit states it. The three bands (below 10, below 20, 20 and above) are not attributed to any source in the kit: cite where they come from or show the number alone. Whether the national protocol for psoriasis uses PASI: not found. | unclear: owned or published by others (Fredriksson and Pettersson, Dermatologica 1978); terms not read |
| `easi` | EASI indeksi / Индекс EASI | specialty | Dermatovenerologiya | **revise** (second pass: findings added) | The tool applies one set of body-region weights, and the kit's own comment says they are those of a patient aged 8 or older. It asks no age. A dermatovenerologist here sees children too, and a younger child is scored with weights the kit itself says are for age 8 and over. Add the age question with the younger child's weights taken from the source (not fetched), or say on the screen that the tool is for age 8 and over. Also cite the source of the bands (below 7, below 21, 21 and above). | unclear: owned or published by others (Hanifin et al., Exp Dermatol 2001); terms not read |
| `scorad` | SCORAD indeksi / Индекс SCORAD | specialty | Dermatovenerologiya | **revise** (second pass; was unverified) | The formula follows the cited 1993 paper as the kit states it. The bands (below 25, below 50, 50 and above) are not attributed: cite them, and check on which side exactly 50 falls. | unclear: owned or published by others (the European Task Force on Atopic Dermatitis, Dermatology 1993); terms not read |
| `yama-okuma` | Applikatsion test: natijani oʻqish kunlari / Аппликационный тест: дни чтения результата | specialty | Dermatovenerologiya | **unverified** (still, second pass; leaning: keep; check the 2026 update of the cited guideline) | Date arithmetic: the day of application plus 2 and plus 4. Whether local practice reads on these two days: a local dermatovenerologist confirms. | unclear: owned or published by others (the European Society of Contact Dermatitis guideline, Contact Dermatitis 2015); terms not read |
| `rejim-karti` | Insulin va qalqonsimon bez davosi: sanalar kartasi / Инсулин и терапия щитовидной железы: карта дат | specialty | Endokrinologiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `antibiyotik-sure` | Antibiotik kursi: kunlar hisobi / Курс антибиотика: счёт дней | specialty | Yuqumli kasalliklar | **revise** (second pass: findings added) | A first day of 01.10 and 7 days give "the day the course ends" as 08.10: the tool adds the number of days to the first day. If the first day counts as day 1, the last day of treatment is 07.10. Decide which is meant and say it in the label ("last day of treatment" or "first day without treatment"). | none: the product's own |
| `genel-preop` | Operatsiyadan oldingi nazorat roʻyxati / Предоперационный контрольный список | specialty | Umumiy xirurgiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local surgeon. Its consent item points to the local consent form (a lawyer). | none: the product's own |
| `toraks-preop` | Koʻkrak qafasi operatsiyasidan oldingi nazorat roʻyxati / Контрольный список перед торакальной операцией | specialty | Torakal xirurgiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local thoracic surgeon. | none: the product's own |
| `toraks-tup-yara` | Plevra drenaji va jarohat kuzatuvi / Наблюдение за плевральным дренажом и раной | specialty | Torakal xirurgiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `inhaler-teknik` | Ingalyatordan foydalanish texnikasi / Техника ингаляции | specialty | Pulmonologiya | **revise** (second pass; was unverified) | Note A. Reader: a local pulmonologist. It names device types, no medicine and no dose. | none: the product's own |
| `gorme-keskinligi` | Koʻrish oʻtkirligi: logMAR / Острота зрения: logMAR | specialty | Oftalmologiya | **keep** (second pass; was unverified) | The conversion is mathematics. Which notation local ophthalmologists record acuity in (a decimal value or a fraction) was not found: a local ophthalmologist confirms, and that notation is offered first. | unclear: owned or published by others (Bailey and Lovie 1976 and Ferris et al. 1982); terms not read |
| `kalp-damar-preop` | Yurak-qon tomir operatsiyasidan oldingi nazorat roʻyxati / Контрольный список перед сердечно-сосудистой операцией | specialty | Yurak-qon tomir xirurgiyasi | **keep: record list** (second pass; was unverified) | Note A. Reader: a local cardiac or vascular surgeon. | none: the product's own |
| `greft-yara-izlem` | Tomir grefti va jarohat kuzatuvi / Наблюдение за сосудистым графтом и раной | specialty | Yurak-qon tomir xirurgiyasi | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `antikoagulan-vadeleri` | Antitrombotik davo: nazorat sanalari / Антитромботическая терапия: даты контроля | specialty | Yurak-qon tomir xirurgiyasi | **keep: record list** (second pass: marked) | Note B. It names classes of medicine only. | none: the product's own |
| `odyometri-pta` | Tonal audiometriya: oʻrtacha eshitish boʻsagʻasi / Тональная аудиометрия: средний порог слуха | specialty | Otorinolaringologiya (LOR) | **revise** (second pass; was unverified) | The average is taken over 0,5, 1, 2 and 4 kHz and the degrees are named after two papers from the United States (mild, moderate, moderately severe, severe, profound). Which frequencies local practice averages and how it names the degrees was not found in any source read. A local surdolog confirms both; the degree names are the pack's text and can be changed without touching the arithmetic. It should also be shown to surdology if that becomes a role (Part 3). | unclear: owned or published by others (Goodman 1965 and Clark 1981); terms not read |
| `otoskopi-notu` | Otoskopiya qaydi / Запись отоскопии | specialty | Otorinolaringologiya (LOR) | **keep: record list** (second pass; was unverified) | Note A. Reader: a local otorhinolaryngologist. | none: the product's own |
| `vertigo-notu` | Bosh aylanishi: pozitsion sinamalar qaydi / Головокружение: запись позиционных проб | specialty | Otorinolaringologiya (LOR) | **revise** (second pass; was unverified) | Note A. Reader: a local otorhinolaryngologist. It holds one rule of its own: with any sign pointing to a central cause a repositioning manoeuvre is marked "not suitable". The reader confirms that rule. | none: the product's own |
| `kdigo-serit` | KDIGO jadvali: KFT va albuminuriya / Таблица KDIGO: СКФ и альбуминурия | specialty | Nefrologiya | **revise** (second pass: findings added) | The same grid as the internal-medicine tool, without its referral flags. Confirm the unit of the albumin-to-creatinine ratio; add the calculator from creatinine (Part 2). One tool with the role deciding whether the flags show would do for both. | unclear: owned or published by others (the KDIGO 2024 guideline); terms not read |
| `diyaliz-seans` | Dializ seansi va keyingi sana / Сеанс диализа и следующая дата | specialty | Nefrologiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `kur-sayaci` | Davolash kurslari hisobi / Счёт курсов лечения | specialty | Onkologiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `toksisite-listesi` | Nojoʻya taʼsirlar nazorat roʻyxati / Контрольный список побочных эффектов | specialty | Onkologiya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local oncologist. It records which side effects are present, with no grade. | none: the product's own |
| `kirik-alci-takip` | Sinish, gips va ortez kuzatuvi / Наблюдение за переломом, гипсом и ортезом | specialty | Travmatologiya va ortopediya | **keep: record list** (second pass: marked) | Note B. Its warnings follow only from dates the doctor entered. | none: the product's own |
| `ortopedi-op-protokol` | Operatsiyadan keyingi nazorat roʻyxati / Послеоперационный контрольный список | specialty | Travmatologiya va ortopediya | **keep: record list** (second pass; was unverified) | Note A. Reader: a local traumatologist-orthopaedist. | none: the product's own |
| `vas-fonksiyon` | Ogʻriq va funksiya bali / Оценка боли и функции | specialty | Travmatologiya va ortopediya | **revise** (second pass: findings added) | The band is the product's own composite, and the screen says so. Even so, pain of 5 out of 10 with little loss of function is named "mild pain and limitation of function". Show the two numbers without a band, or replace the tool with a published instrument once its licence is cleared. | none: the product's own |
| `hedef-boy` | Ota-ona boʻyiga koʻra kutilayotgan boʻy / Ожидаемый рост по росту родителей | specialty | Pediatriya | **unverified** (still, second pass; leaning: keep the formula; the range becomes a number the pack states) | The formula is the one the kit cites (1970). The range of 8,5 cm either side was not checked against the paper (not fetched). Whether local paediatric guidance uses this estimate: not found. | unclear: owned or published by others (Tanner et al., Arch Dis Child 1970); terms not read |
| `doz-hesabi` | Doza hisobi: vazn boʻyicha / Расчёт дозы по массе тела | specialty | Pediatriya | **keep** (second pass: findings added) | Arithmetic on numbers the doctor types; it holds no medicine, dose or ceiling. Show it to every role that treats children (family doctors, emergency care, anaesthesiology, infectious diseases, paediatric surgery), not to paediatrics alone. | none: the product's own |
| `plastik-yara-greft` | Jarohat, transplantat va laxtak kuzatuvi / Наблюдение за раной, трансплантатом и лоскутом | specialty | Plastik xirurgiya | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `tetkik-kuyrugu` | Tekshiruvlar navbati / Очередь исследований | specialty | Radiologiya (nur tashxisi) | **keep: record list** (second pass: marked) | Note B. | none: the product's own |
| `rapor-taslagi` | Tuzilgan xulosa qoralamasi / Черновик структурированного заключения | specialty | Radiologiya (nur tashxisi) | **revise** (second pass: findings added) | It offers the assessment categories of the ACR BI-RADS Atlas. BI-RADS belongs to the American College of Radiology, and its terms for use inside commercial software were not read. Clear the licence, or offer the general report only. Whether local radiologists report mammography in these categories: a local radiologist confirms. | needs permission — to confirm: the kit cites the ACR BI-RADS Atlas; the terms were not read in this session |
| `das28` | DAS28 kasallik faolligi indeksi / Индекс активности DAS28 | specialty | Revmatologiya | **keep** (second pass; was unverified) | The pack words the bands as "2,6–3,19 low" and "3,2–5,1 moderate" and uses the same cut-offs for the form with CRP. Check against the cited sources (not fetched) on which side exactly 3,2 falls and whether the CRP form shares the cut-offs of the ESR form. A local laboratory confirms CRP in mg/l and ESR in mm/h. | unclear: owned or published by others (Prevoo et al. 1995 and Fransen and van Riel 2005); terms not read |
| `eklem-28` | 28 boʻgʻim hisobi / Счёт 28 суставов | specialty | Revmatologiya | **keep** (second pass; was unverified) | A count of ticked joints; it feeds DAS28 only by the doctor retyping the two counts. | unclear: owned or published by others (Prevoo et al. 1995); terms not read |
| `psa-hizi` | Prostata spetsifik antigeni: oʻzgarish tezligi / Простатспецифический антиген: скорость изменения | specialty | Urologiya | **keep** (second pass; was unverified) | The difference of two values divided by the years between them; no band. A local laboratory confirms that PSA is printed in ng/ml. | none: the product's own |
| `rtp-basamak` | Sportga qaytish bosqichlari / Этапы возвращения в спорт | specialty | Sport tibbiyoti | **revise** (second pass; was unverified) | Note A. Reader: a local sports physician. It records a step from 0 to 5 and proposes no day. | none: the product's own |
| `sakatlik-gunlugu` | Shikastlanishlar kundaligi / Журнал травм | specialty | Sport tibbiyoti | **revise** (second pass; was unverified) | The load ratio is flagged from 1,3 and from 1,5; the kit cites one 2016 paper for both limits, which was not fetched. A local sports physician confirms the list of regions and mechanisms. | unclear: owned or published by others (Gabbett, Br J Sports Med 2016); terms not read |
| `takip-paneli` | Nazorat roʻyxati / Список контроля | specialty | 23 roles | **keep** | Seventeen roles do not see it because they have no tool whose result can be kept. Give it to each as it gains one; in the core set it becomes a tile of every doctor role. | none: a product screen |

### 1.3 Placeholders (52): keep 0, revise 4, remove 0, unverified 48 in the first pass; revise 23, unverified 29 after the second

Each is empty and switched off, so none can mislead a doctor today. "Unverified" here means: the local content it waits for was not found in any source read. ¹ = the mechanism is already in the kit; only the country's numbers are missing. **Note C**: every threshold and interval of the tool is a number the country states, and none was found in a national source.

| Key | What it would be | Who would see it | Verdict | What it needs | Licence |
|---|---|---|---|---|---|
| `recete` | Prescription drafting | base | **revise** (second pass; was unverified) | Wanted by every doctor. Needs the State Register of medicines and the prescription form. The earlier audit read the title of the Minister of Health's order No. 121 of 01.07.2020 (prescribing by international nonproprietary name); it was not re-read today. | none: official content |
| `muayene-ozeti-belgesi` | Visit and discharge summary as a document | base | **unverified** (still, second pass; leaning: keep as a slot) | Needs the form of the summary a clinic issues here. The order on primary medical documentation was not found. | none: official content |
| `tani-kodlama` | Diagnosis coding | base | **revise** (second pass: findings added) | The Ministry of Health's 2024 methodology for national protocols selects conditions by "XKT-10/11" codes, so the classification doctors here code in is the International Classification of Diseases, 10th revision, with the 11th named beside it. Build the slot on the 10th revision with titles in Uzbek and Russian from an official edition; a coding table is not written by a machine. Source: <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> | unclear — the classification is the World Health Organization's; the terms for the national edition were not read |
| `ilac-etkilesimi` | Medicine interactions | base | **unverified** (still, second pass; leaning: keep as a slot) | Needs interaction data from a licensed source and the State Register to search by. | paid licence likely — unclear: no provider was looked at |
| `hasta-belgeleri` | Certificates for patients | base | **revise** (second pass; was unverified) | Needs the forms and the periods the rules allow: a lawyer in Uzbekistan with the clinical lead. | none: official content |
| `tetkik-istek` | Laboratory and imaging request | base | **revise** (second pass; was unverified) | Needs the local test catalogue and units. The 2015 national cardiology protocols write cholesterol and glucose in mmol/l. | none: official content |
| `muayene-sonu` | End-of-visit flow | base | **unverified — needs a local clinician** (leaning: keep as a slot) | Waits on the prescription and certificate slots. | none: official content |
| `acil-sevk` | Admission, referral and discharge package (emergency) | Shoshilinch tibbiy yordam | **unverified** (still, second pass; leaning: keep as a slot) | Needs the documents and referral levels of the local system. | none: official content |
| `aile-asi-tarama` | Vaccination and screening (family medicine) | Oilaviy tibbiyot | **revise** (second pass: findings added) | The vaccination half has a named national source: the sanitary rules SanQvaM 0239-07/3 "Oʻzbekiston Respublikasida yuqumli kasalliklar immunoprofilaktikasi", section "PROFILAKTIK EMLASH KALENDARI", amended on 19.07.2021 (decision No. 02, registration No. 31). A local clinician enters the calendar from it and signs it. The screening half has no source yet. Source: <https://lex.uz/acts/5524039> | none: an official act |
| `aile-kronik` | Diabetes and hypertension follow-up (family medicine) | Oilaviy tibbiyot | **revise** (second pass; was unverified) | WHO Europe reports that WHO PEN protocols 1, 2 and 3 were adapted for primary care in Uzbekistan after 2013. The national document itself was not found. | none: official content |
| `aile-sevk` | Referral and emergency triage (family medicine) | Oilaviy tibbiyot | **unverified** (still, second pass; leaning: keep as a slot) | Needs the referral levels and criteria of the local system. | none: official content |
| `aile-kohort` | Follow-up panel (family medicine) | Oilaviy tibbiyot | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing to list until the three tools above exist. | none: official content |
| `cocuk-onam-veli` | Consent for an operation on a child | Bolalar xirurgiyasi | **revise** (second pass; was unverified) | A lawyer: who signs, below which age. | none: official content |
| `kv-risk-score2` | Ten-year cardiovascular risk | Terapiya (ichki kasalliklar); Kardiologiya | **revise** (second pass: findings added) | SAFETY. The risk model is calibrated by region. The published SCORE2 paper (figure 5) and a 2022 journal table that cites the 2021 European guideline place Uzbekistan in the "very high risk" region; the Turkish tool defaults to the "high" region, one step lower, and asks cholesterol in mg/dL (specialties/dahiliye/engines/score2.ts). Its numbers must not be shown here. Keep the slot off until it is rebuilt for the very-high-risk region, with cholesterol in mmol/l, and until a local cardiologist says which chart the current national protocol prescribes: the national hypertension protocol could not be read, local papers use both SCORE and SCORE2, and primary care was trained on the WHO package, which has charts of its own. Source: <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> ; <https://tidsskriftet.no/en/node/62283/pdf> | needs permission — to confirm: the copy of the SCORE2 paper read carries "© European Society of Cardiology 2021" and no open licence. The article on the WHO charts is published under CC BY 4.0 |
| `polifarmasi` | Review of medicines in patients aged 65 and over | Terapiya (ichki kasalliklar) | **unverified** (still, second pass; leaning: keep as a slot) | Needs a licensed edition of the criteria and the local register of medicines. If no licence is obtained, drop the slot for this country. | needs permission (the STOPP/START criteria); terms not read |
| `antikoagulan` | Anticoagulation review | Terapiya (ichki kasalliklar) | **revise** (second pass; was unverified) | Needs the local labels and the national protocol. The 2015 national arrhythmia protocol, as far as it could be read, names no stroke-risk or bleeding score. | none: official content |
| `izotretinoin-gebelik-onleme` | Pregnancy-prevention checks for isotretinoin | Dermatovenerologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the programme the local regulator requires. Not found. | none: official content |
| `lab-izlem` ¹ | HbA1c and TSH follow-up | Endokrinologiya | **revise** (second pass; was unverified) | Note C. | none: official content |
| `dxa-tekrar` ¹ | Bone densitometry repeat | Endokrinologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `viral-izlem` ¹ | HIV and viral hepatitis follow-up | Yuqumli kasalliklar | **unverified** (still, second pass; leaning: keep as a slot) | Note C. | none: official content |
| `enfeksiyon-bildirim` | Isolation and notification | Yuqumli kasalliklar | **unverified** (still, second pass; leaning: keep as a slot) | Needs the list of notifiable diseases and the report form. Every doctor meets this duty, so in the core set it is a base tool, not one of infectious diseases alone. | none: official content |
| `anemi-izlem` ¹ | Anaemia follow-up in chronic kidney disease | Nefrologiya | **unverified** (still, second pass; leaning: keep as a slot) | Note C. The unit local laboratories print for haemoglobin must be stated in the pack. | none: official content |
| `iltihap-lab-izlem` ¹ | CRP and ESR follow-up | Revmatologiya | **unverified** (still, second pass; leaning: keep as a slot) | Note C. | none: official content |
| `basdai` | BASDAI | Revmatologiya | **unverified** (still, second pass; leaning: keep as a slot) | Needs the authorised Uzbek and Russian versions. | needs permission (BASDAI); terms not read |
| `kardiyo-izlem` ¹ | Hypertension, heart-failure and atrial-fibrillation follow-up | Kardiologiya | **revise** (second pass; was unverified) | Note C. The 2015 national heart-failure protocol classifies by NYHA, which this mechanism already records. | none: official content |
| `cat-mmrc` | COPD Assessment Test with the mMRC grade | Pulmonologiya | **revise** (second pass; was unverified) | Needs the authorised translations and the licence. | needs permission (the COPD Assessment Test); terms not read |
| `akciger-aksiyon-plani` | Written action plan for asthma and COPD | Pulmonologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A sheet the patient reads: supplied and signed by a local pulmonologist. | none: official content |
| `ibd-skor` ¹ | Activity index follow-up (bowel disease) | Gastroenterologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Note C. | none: official content |
| `hepatit-izlem` ¹ | Hepatitis B and C follow-up | Gastroenterologiya | **unverified** (still, second pass; leaning: keep as a slot) | Note C. | none: official content |
| `gebelik-takvimi` | Pregnancy calendar | Akusherlik va ginekologiya | **revise** (second pass; was unverified) | Needs the national antenatal protocol (not found). Its date arithmetic alone needs nothing local and can be split off as a tool of its own (Part 2). | none: official content |
| `dogum-analik-raporu` | Maternity leave dates and certificate | Akusherlik va ginekologiya | **revise** (second pass; was unverified) | A lawyer: the periods of labour law and the certificate form. | none: official content |
| `kontrasepsiyon-mec` | Medical eligibility for contraception | Akusherlik va ginekologiya | **revise** (second pass; was unverified) | Needs the WHO table entered from the WHO edition and signed by a local clinician. | unclear — a WHO publication; its licence was not read |
| `obstetrik-risk` | Obstetric risk prompts and caesarean note | Akusherlik va ginekologiya | **revise** (second pass; was unverified) | Needs the local protocol and the form of the note. | none: official content |
| `kd-kohort` | Follow-up panel (obstetrics and gynaecology) | Akusherlik va ginekologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing to list until the antenatal schedule exists. | none: official content |
| `inme-kirmizi-bayrak` | Stroke and TIA red flags | Nevrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the regional stroke pathway. The ambulance number is already a setting of the pack. | none: official content |
| `midas` | MIDAS | Nevrologiya | **revise** (second pass; was unverified) | Needs the authorised versions and the licence. | needs permission (MIDAS); terms not read |
| `antiepileptik-izlem` | Laboratory monitoring of antiseizure medicines | Nevrologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national protocol and the local register. | none: official content |
| `buyume-persentil` | Growth and percentiles | Pediatriya | **unverified** (still, second pass; leaning: keep as a slot) | A 2025 paper from Fergana assessed children "in accordance with WHO standards" and cites the WHO Child Growth Standards of 2006. No order or programme of the Ministry of Health that prescribes a standard was found. A local paediatrician names the standard and the document; the tables are then entered from the WHO files, never from memory. | unclear — the WHO standards; their licence for use inside commercial software was not read |
| `asi-takvimi` | Vaccination calendar and catch-up | Pediatriya | **revise** (second pass: findings added) | The source is named: SanQvaM 0239-07/3, section "PROFILAKTIK EMLASH KALENDARI", with the amendment of 19.07.2021; the same act holds a second calendar for epidemic indications. A local clinician enters the calendar from the current edition and signs it. No vaccine or age is written in this report. Source: <https://lex.uz/acts/5524039> | none: an official act |
| `gelisim-tarama` | Development and screening panel | Pediatriya | **unverified** (still, second pass; leaning: keep as a slot) | Needs the national screening programme for children. Not found. | none: official content |
| `mchat-rf` | M-CHAT-R/F | Pediatriya | **revise** (second pass; was unverified) | Needs the authorised versions and the authors' permission. | needs permission (M-CHAT-R/F); terms not read |
| `pediatri-kohort` | Follow-up panel (paediatrics) | Pediatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Has nothing of its own to list until the calendar and screening exist. | none: official content |
| `plastik-onam` | Informed-consent checklist (plastic surgery) | Plastik xirurgiya | **revise** (second pass; was unverified) | A lawyer. | none: official content |
| `phq9-gad7` | PHQ-9 and GAD-7 | Psixiatriya | **revise** (second pass; was unverified) | Needs the authorised Uzbek and Russian versions and the owner's terms. | needs permission (PHQ-9 and GAD-7); terms not read |
| `psikiyatri-guvenlik-triyaj` | Safety and emergency triage (psychiatry) | Psixiatriya | **revise** (second pass; was unverified) | Needs the referral path and the rules for involuntary admission. The new edition of the law on psychiatric care (2021) lets private institutions provide psychiatric care; its text was not read. | none: official content |
| `psikotrop-izlem` | Monitoring calendar of psychotropic medicines | Psixiatriya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the national protocol and the local register. | none: official content |
| `radyo-kritik-bildirim` | Critical-finding notice (radiology) | Radiologiya (nur tashxisi) | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the local rule on who is told and how fast. | none: official content |
| `ipss` | IPSS | Urologiya | **unverified** (still, second pass; leaning: keep as a slot) | Needs the authorised versions and the permission. | needs permission (IPSS); terms not read |
| `uroloji-acil-triyaj` | Haematuria and stone emergency triage | Urologiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs the referral path. | none: official content |
| `ftr-seans-plani` | Session plan (rehabilitation) | Tibbiy reabilitatsiya va fizioterapiya | **unverified — needs a local clinician** (leaning: keep as a slot) | Needs any local rule on the number of sessions. | none: official content |
| `vas-odi` | Pain scale with the Oswestry Disability Index | Tibbiy reabilitatsiya va fizioterapiya | **revise** (second pass; was unverified) | Needs the authorised versions and the licence. | needs permission (the Oswestry Disability Index); terms not read |
| `ev-egzersiz` | Home exercise sheet | Tibbiy reabilitatsiya va fizioterapiya | **unverified — needs a local clinician** (leaning: keep as a slot) | A sheet the patient reads: supplied and signed by a local rehabilitation physician. | none: official content |

### 1.4 Absent

**Eleven tools of the Turkish registry with the earlier verdict "keep" that the Uzbek build does not have** (keep 10, revise 0, remove 0, unverified 1):

| Turkish route | Turkish title | Role | Verdict | Note |
|---|---|---|---|---|
| `derm-fototerapi` | Fototerapi defteri | Dermatovenerologiya | **unverified** | A dose diary needs a record of its own and a local protocol for the starting dose. Not built; a local dermatovenerologist says whether it is wanted. |
| `psik-kohort` | Psikiyatri kohort paneli | Psixiatriya | **keep** | It is the follow-up list. Shown when psychiatry gains its first tool whose result can be kept. |
| `kardio-kohort` | Kardiyoloji kohort paneli | Kardiologiya | **keep** | As above, for cardiology. |
| `noro-kohort` | Nöroloji kohort paneli | Nevrologiya | **keep** | As above, for neurology. |
| `ftr-kohort` | FTR kohort paneli | Tibbiy reabilitatsiya va fizioterapiya | **keep** | As above, for rehabilitation. |
| `gastro-kohort` | Gastroenteroloji kohort paneli | Gastroenterologiya | **keep** | As above, for gastroenterology. |
| `gastro-endoskopi` | Endoskopi belge köprüsü | Gastroenterologiya | **keep** | Nothing of a country in it. Waits on a kit feature: uploading documents. |
| `gc-patoloji` | Patoloji belge köprüsü | Umumiy xirurgiya | **keep** | As above. |
| `plastik-foto` | Foto zaman çizgisi köprü | Plastik xirurgiya | **keep** | Waits on uploading images; consent for photographs is a lawyer's question. |
| `bc-goruntu` | Görüntü belge köprü | Neyroxirurgiya | **keep** | Waits on uploading documents. |
| `gogus-cerrahi-patoloji` | Patoloji köprü | Torakal xirurgiya | **keep** | Waits on uploading documents. |

**Fourteen tools of Türkiye's state and payer systems: remove, confirmed.** They are blocked for every country build by `countries/yasak-araclar.json` and a build rule: `sgk-medula`, `enabiz`, `dahiliye-sgk`, `goz-sut-vegf`, `goz-sgk-rapor`, `goz-gil-kod`, `derm-biyolojik-sut`, `psik-sgk`, `kbb-sgk`, `kardio-sgk`, `gogus-sgk`, `nef-sgk`, `onko-sut`, `roma-biyolojik-sut`.

**Thirty-three clinic tools of the Turkish product: none exists in the country kit.** The ten clinic roles of the Uzbek build see the three base tiles and nothing else. Two of the 33 are tied to Turkish law and a Turkish state system (remove); one is the patient page, which exists; the other 30 are after-care calendars, session dates and follow-up lists of single clinic types. Whether each is wanted follows the role's verdict in Part 3 (three of the ten roles are not recognised here), then a local reader. They are listed one by one in the data file.

## Part 2: tools to add, and the core set

### 2.1 The core set proposed for Uzbekistan (15)

What every doctor role should see, whatever the specialty. "Doctor role" matters: a clinical calculator shown to a clinical psychologist is the leak the product's own rules forbid, so the core set is base for the doctor roles and the three product screens stay base for everybody. Thirteen of the fifteen exist in some form already: four tiles, eight placeholders, and one tool that a single role sees today. Two are new: body mass index, and the calculator that goes with the kidney tool the build already has. The core set is mostly a list of what to **finish**, not what to invent.

| # | Tool | Today | National body or source it is tied to |
|---|---|---|---|
| 1 | Bemor sahifasi (hasta-portali) | on, base | A screen of the product. |
| 2 | Shablonlarim (sablonlarim) | on, base | A screen of the product. |
| 3 | Konsultatsiyalar (konsultasyonlar) | on, base | A screen of the product. |
| 4 | Nazorat roʻyxati (takip-paneli) | on for 23 roles | A screen of the product; base for doctor roles once each has a tool whose result can be kept. |
| 5 | Diagnosis coding (tani-kodlama) | slot | Ministry of Health: its 2024 methodology for national protocols works by "XKT-10/11" codes. <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> |
| 6 | Prescription (recete) | slot | Ministry of Health, order No. 121 of 01.07.2020 on prescribing by international nonproprietary name: read by title in the earlier audit, not today. |
| 7 | Visit and discharge summary document (muayene-ozeti-belgesi) | slot | Ministry of Health forms of medical documentation: not found. |
| 8 | Certificates, with the temporary incapacity certificate (hasta-belgeleri) | slot | A lawyer in Uzbekistan: not found. |
| 9 | Laboratory and imaging request (tetkik-istek) | slot | Units as national protocols write them: mmol/l for cholesterol and glucose in the 2015 cardiology protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| 10 | Medicine interactions (ilac-etkilesimi) | slot | The State Register of medicines; licensed interaction data. |
| 11 | End-of-visit flow (muayene-sonu) | slot | Follows the prescription and certificate slots. |
| 12 | Infectious-disease notification (enfeksiyon-bildirim, moved from one specialty to base) | slot | The Committee for Sanitary-Epidemiological Welfare and Public Health (PP-4790 of 27.07.2020); its list and form were not read. <https://lex.uz/docs/4914450> |
| 13 | Body mass index and waist circumference | new | Used in the 2015 national cardiology protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| 14 | Kidney function: eGFR from creatinine, with the KDIGO category (kdigo-evre made base) | new + on for one role | National protocol for chronic kidney disease: not found. |
| 15 | Dose arithmetic by weight (doz-hesabi, shown to every role that treats children) | on for one role | Arithmetic on the doctor's own numbers; no national content. |

Four of the fifteen are screens of the product. Of the eleven clinical ones, four are tied to a source read today; the other seven are tied to a body or a document that could not be opened, and say so.

Why these and not Türkiye's: Türkiye's shared set is built around its payer system (SGK Medula, e-Nabız, SUT), which does not exist here. What every doctor in Uzbekistan meets instead is the Ministry's own documentation, coding by "XKT-10", prescribing by international name, the duty to notify infectious disease, and laboratory reports in molar units.

### 2.2 Tools proposed, with their sources

No formula or threshold is written here. Where the primary publication could not be opened, the row says so.

| Proposed tool | Core, or who sees it | National source | Primary publication | Licence |
|---|---|---|---|---|
| Body mass index and waist circumference | core | The 2015 national cardiology protocols (Ministry of Health, project "Zdorovye-3") use body mass index and waist circumference in the stable-angina and heart-failure protocols. <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> | Arithmetic on weight and height. The classification bands are the World Health Organization's; the publication was not fetched in this session, and neither the formula nor a band is written here. | unclear — the arithmetic is free; the WHO classification was not read |
| Kidney function: eGFR from creatinine in the laboratory's own unit, feeding the KDIGO category tool | core | The national protocol for chronic kidney disease was not found, so which equation it prescribes is unverified. | Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med 2021;385:1737-1749 (the 2021 CKD-EPI creatinine equation), as referenced on a secondary page read today; the article itself was not opened. <https://www.nejm.org/doi/full/10.1056/NEJMoa2102953> | unclear — not read |
| Infectious-disease notification (today the slot enfeksiyon-bildirim of one specialty) | core | The body is the Committee for Sanitary-Epidemiological Welfare and Public Health under the Ministry of Health (Presidential resolution PP-4790 of 27.07.2020). Its list of notifiable diseases and the report form were not read. <https://lex.uz/docs/4914450> | No formula: a form and a list of an authority. | not applicable — an official form |
| Ten-year cardiovascular risk for the very-high-risk region (today the slot kv-risk-score2) | Terapiya (ichki kasalliklar); Kardiologiya; Oilaviy tibbiyot; Endokrinologiya; Nefrologiya | WHO Europe: WHO PEN protocols 1, 2 and 3 were adapted for primary care in Uzbekistan (workshop report, 2017), and the pilot assessed total cardiovascular risk in adults of 40 and over (good-practice brief, 2018: https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0007/367288/gpb-hss-ncds-uzb-eng.pdf). Which chart the current national protocol prescribes is unverified. <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0005/335813/PEN-meeting-report-16.pdf> | SCORE2 working group and ESC Cardiovascular risk collaboration. Eur Heart J 2021;42:2439-2454, with its supplementary tables for the coefficients; SCORE2-OP: Eur Heart J 2021;42:2455-2467. WHO charts: Lancet Glob Health 2019;7:e1332-e1345 (https://dspace.library.uu.nl/handle/1874/390215). <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> | needs permission — to confirm for SCORE2 (© European Society of Cardiology 2021 on the copy read); the WHO chart article is CC BY 4.0 |
| NYHA functional class as a record | Kardiologiya; Terapiya (ichki kasalliklar); Oilaviy tibbiyot; Yurak-qon tomir xirurgiyasi | The 2015 national heart-failure protocol classifies by NYHA ("Классификация ХСН по NYHA"). <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> | The classification of the New York Heart Association; its primary publication was not fetched. The kit's switched-off follow-up mechanism (kardiyo-izlem) already has the field, with classes I to IV. | unclear — not read |
| Gestational age and expected date of birth (the arithmetic only, split from the antenatal schedule) | Akusherlik va ginekologiya; Oilaviy tibbiyot | The national antenatal protocol was not found; the dating rule must be taken from it. | Date arithmetic; the rule to count from is the protocol's. | unclear until the national rule is read |
| Vaccination status against the national calendar (today the slots asi-takvimi and aile-asi-tarama) | Pediatriya; Oilaviy tibbiyot | SanQvaM 0239-07/3, section "PROFILAKTIK EMLASH KALENDARI". <https://lex.uz/acts/5524039> | No formula: a calendar of an authority, entered and signed by a local clinician. | not applicable — an official act |
| Growth for age against the standard the national programme names (today the slot buyume-persentil) | Pediatriya; Oilaviy tibbiyot | No order naming the standard was found. A 2025 local paper uses WHO standards (https://inscience.uz/index.php/preventive-medicine/article/download/7502/7294/23221). | WHO Child Growth Standards (2006), as cited by that paper; the WHO tables were not fetched. | unclear — WHO; not read |
| Degree of hearing loss in the local classification (a revision of odyometri-pta) | Otorinolaringologiya (LOR); surdologiya (if added) | Not found. | To be named by a local surdolog. | unclear |
| Candidates no source was read for, each to be confirmed by a local specialist before anything is built: Glasgow Coma Scale record (emergency care, neurology, neurosurgery, anaesthesiology); Apgar record (paediatrics, obstetrics); a stroke-risk and a bleeding score for atrial fibrillation (cardiology, internal medicine); a liver-function class (gastroenterology, infectious diseases); a breathlessness grade (pulmonology); body surface area (oncology); a tooth chart (stomatology, if added) | Shoshilinch tibbiy yordam; Nevrologiya; Neyroxirurgiya; Anesteziologiya va reanimatologiya; Pediatriya; Akusherlik va ginekologiya; Kardiologiya; Terapiya (ichki kasalliklar); Gastroenterologiya; Yuqumli kasalliklar; Pulmonologiya; Onkologiya | unverified — needs a local clinician. No national protocol naming any of these was read. | Not fetched. No formula, item or cut-off is written here. | unclear — several are owned (for example by a society or a publisher); none was read |

### 2.3 Licences, stated plainly

**No licence text of any rights holder could be opened in this session.** What can be said:

- **Already held back correctly.** Seven published questionnaires are placeholders because their wording belongs to somebody: BASDAI, the COPD Assessment Test, MIDAS, M-CHAT-R/F, PHQ-9 with GAD-7, IPSS, the Oswestry Disability Index. So are the STOPP/START criteria and the WHO eligibility table for contraception. None is shown. Each needs the owner's terms and an authorised Uzbek and Russian version before it is.
- **Switched on today and owned by somebody, terms not read:** the Emergency Severity Index (cited to the Emergency Nurses Association), the ASA physical status classes (American Society of Anesthesiologists), the KDIGO categories and risk grid (KDIGO), **BI-RADS** (American College of Radiology; the one most likely to need a licence for commercial software), and the published indices PASI, EASI, SCORAD and DAS28. The tools use the names and the arithmetic, not the wording of a form. Whether that needs permission is a question for the owner's lawyer, per instrument.
- **Read today:** the copy of the SCORE2 paper carries "© European Society of Cardiology 2021" and no open licence. The article on the WHO cardiovascular risk charts is published under CC BY 4.0; the licence of WHO's own chart booklets was not read.
- **Not read, needed for the core set:** the national edition of the International Classification of Diseases; a source of interaction data (likely paid); the WHO growth standards for use in commercial software.

## Part 3: specialties and clinic specialties

### 3.1 The official list

**"Tibbiy faoliyat amalga oshiriladigan tibbiy ixtisosliklar turlari nomenklaturasini tasdiqlash toʻgʻrisida"**: order of the Minister of Health No. 6 of 12 May 2021, registered by the Ministry of Justice on 12.05.2021 under No. 3303; annex 1 in the wording of the Minister's order No. 27 of 22.07.2023 (registration No. 3303-1). <https://lex.uz/uz/docs/-5422572>, read 2026-10-10. It replaced order No. 97 of 25.07.2017 (registration No. 2908, <https://lex.uz/uz/docs/-3284314>), which several of the pack's names still follow.

It is the list a licence for medical activity is written from: Cabinet of Ministers resolution No. 405 of 21.06.2017 on licensing told the Ministry to approve such a nomenclature (<https://lex.uz/uz/docs/-3242574>), and a legal publisher's note on the 2017 order is headed with the question of which medical specialisations a licence states (<https://www.norma.uz/uz/qonunchilikda_yangi/licenziyada_qanday_tibbiy_ihtisosliklar_kursatiladi>). Its table has three columns: a bachelor-level specialty ("Bazaviy mutaxassisliklar"), main specialties of the master's degree and clinical residency ("Asosiy mutaxassisliklar"), and specialties that need additional or deepened training ("Qoʻshimcha yoki chuqurlashtirilgan tayyorgarlik talab etadigan mutaxassisliklar"). It has eight directions: "Davolash ishi", "Pediatriya ishi", "Tibbiy profilaktika ishi", "Stomatologiya", "Tibbiy biologik ish", "Biotibbiyot muhandisligi", "Klinik psixologiya", "Xalq tabobati".

Three cautions. The page is read as flat text, so which column a name stands in was inferred from the order of the text; the names themselves are as printed. The Russian page of lex.uz shows the same Uzbek text, so **no official Russian name was found**: the pack's Russian names stay machine-written. Other official texts name specialties differently (attestation orders of 2015, 2019 and 2020; the Ministry's 2024 list of 51 areas for national protocols); where they differ it is noted.

### 3.2 Doctor specialties (30): keep 24, rename 6, remove 0, add 5

| Key | Name in the pack (Uzbek Latin / Russian) | Verdict | Official name, exactly as the order writes it | Where, and notes |
|---|---|---|---|---|
| `acil-tip` | Shoshilinch tibbiy yordam / Скорая и неотложная помощь | **keep** | Shoshilinch tibbiy yordam | Order No. 6, annex 1, row 23. The Ministry's 2024 list of protocol areas writes "Shoshilinch va tez tibbiy yordam". |
| `aile-hekimligi` | Oilaviy tibbiyot / Семейная медицина | **rename** | Oilaviy shifokorlik | Order No. 6, annex 1, row 1, the bachelor-level specialty of "Davolash ishi". The pack says "Oilaviy tibbiyot". The repealed 2017 nomenclature said "Umumiy vrachlik amaliyoti va oilaviy tibbiyot", and a 2020 attestation order still lists «оилавий тиббиёт». |
| `anestezi` | Anesteziologiya va reanimatologiya / Анестезиология и реаниматология | **keep** | Anesteziologiya va reanimatologiya | Order No. 6, annex 1, row 2 |
| `beyin-cerrahisi` | Neyroxirurgiya / Нейрохирургия | **keep** | Neyroxirurgiya | Order No. 6, annex 1, row 13 |
| `cocuk-cerrahisi` | Bolalar xirurgiyasi / Детская хирургия | **keep** | Bolalar xirurgiyasi | Order No. 6, annex 1, row 28 |
| `dahiliye` | Terapiya (ichki kasalliklar) / Терапия (внутренние болезни) | **rename** | Terapiya | Order No. 6, annex 1, row 3. The pack says "Terapiya (ichki kasalliklar)"; the order in force says "Terapiya" alone (the repealed one said "Ichki kasalliklar (terapiya)"). |
| `dermatoloji` | Dermatovenerologiya / Дерматовенерология | **keep** | Dermatovenerologiya | Order No. 6, annex 1, row 5 |
| `endokrinoloji` | Endokrinologiya / Эндокринология | **keep** | Endokrinologiya | Order No. 6, annex 1, row 22 |
| `enfeksiyon-hastaliklari` | Yuqumli kasalliklar / Инфекционные болезни | **keep** | Yuqumli kasalliklar | Order No. 6, annex 1, row 6 |
| `gastroenteroloji` | Gastroenterologiya / Гастроэнтерология | **keep** | Gastroenterologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `genel-cerrahi` | Umumiy xirurgiya / Общая хирургия | **rename** | Xirurgiya | Order No. 6, annex 1, row 21. The pack says "Umumiy xirurgiya", the name of the repealed 2017 nomenclature. |
| `gogus-cerrahisi` | Torakal xirurgiya / Торакальная хирургия | **keep** | Torakal xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya" |
| `gogus-hastaliklari` | Pulmonologiya / Пульмонология | **keep** | Pulmonologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `goz-hastaliklari` | Oftalmologiya / Офтальмология | **keep** | Oftalmologiya | Order No. 6, annex 1, row 16 |
| `kadin-hastaliklari-dogum` | Akusherlik va ginekologiya / Акушерство и гинекология | **keep** | Akusherlik va ginekologiya | Order No. 6, annex 1, row 1 |
| `kalp-damar-cerrahisi` | Yurak-qon tomir xirurgiyasi / Сердечно-сосудистая хирургия | **rename** | Kardioxirurgiya; Qon tomirlar xirurgiyasi | Order No. 6, annex 1, row 21, two additional specialties under "Xirurgiya". The pack has one role, "Yurak-qon tomir xirurgiyasi". The nomenclature has two specialties and no joint one; the 2019 attestation order writes «кардиохирургия» and «ангиохирургия». Split the role into two; until the kit can, name it by both. |
| `kardiyoloji` | Kardiologiya / Кардиология | **keep** | Kardiologiya | Order No. 6, annex 1, row 4 |
| `kulak-burun-bogaz` | Otorinolaringologiya (LOR) / Оториноларингология (ЛОР) | **keep** | Otorinolaringologiya | Order No. 6, annex 1, row 15. The pack adds "(LOR)", which the order does not have; a label may keep it. |
| `nefroloji` | Nefrologiya / Нефрология | **keep** | Nefrologiya gemodializ bilan | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The Ministry's 2024 list of protocol areas writes "Nefrologiya", as the pack does. |
| `noroloji` | Nevrologiya / Неврология | **keep** | Nevrologiya | Order No. 6, annex 1, row 7 |
| `onkoloji` | Onkologiya / Онкология | **keep** | Umumiy onkologiya | Order No. 6, annex 1, row 14. The Ministry's 2024 list of protocol areas writes "Onkologiya", as the pack does. |
| `ortopedi` | Travmatologiya va ortopediya / Травматология и ортопедия | **keep** | Travmatologiya va ortopediya | Order No. 6, annex 1, row 18 |
| `pediatri` | Pediatriya / Педиатрия | **keep** | Pediatriya | Order No. 6, annex 1, row 25 |
| `plastik-cerrahi` | Plastik xirurgiya / Пластическая хирургия | **keep** | Plastik xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya". The 2019 attestation order writes «пластик хирургия ва микрохирургия». |
| `psikiyatri` | Psixiatriya / Психиатрия | **keep** | Psixiatriya | Order No. 6, annex 1, row 9 |
| `radyoloji` | Radiologiya (nur tashxisi) / Лучевая диагностика (радиология) | **rename** | Tibbiy radiologiya | Order No. 6, annex 1, row 12. The pack says "Radiologiya (nur tashxisi)". Attestation orders of 2019 and 2020 also list «ультратовуш текшируви» and «функционал диагностика» as specialties of their own; neither word is in the order in force as it was read. |
| `romatoloji` | Revmatologiya / Ревматология | **keep** | Revmatologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" |
| `uroloji` | Urologiya / Урология | **keep** | Urologiya | Order No. 6, annex 1, row 19 |
| `spor-hekimligi` | Sport tibbiyoti / Спортивная медицина | **keep** | Sport tibbiyoti | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The earlier audit did not find it in the two texts it read; it is in the nomenclature. |
| `fizik-tedavi` | Tibbiy reabilitatsiya va fizioterapiya / Медицинская реабилитация и физиотерапия | **rename** | Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya) | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The pack says "Tibbiy reabilitatsiya va fizioterapiya". The short form "Reabilitologiya" is the order's own word; "Davolash fizkulturasi" is listed beside it as a further specialty. |

**Recognised here, missing in the product, proposed to add.** That each is recognised is verified. That each is common in private outpatient practice is **not**: no figure was found, and a local clinician says which are worth building.

| Verdict | Official name | Where | Why |
|---|---|---|---|
| **add** | Stomatologiya | Order No. 6, annex 1, section IV, rows 42 to 52: "Umumiy stomatologiya", "Terapevtik stomatologiya", "Ortopedik stomatologiya", "Xirurgik stomatologiya (ogʻiz boʻshligʻi)", "Ortodontiya", "Dental implantologiya", "Bolalar stomatologiyasi" | A whole direction of the nomenclature that the product does not have. A 2021 presidential decree (PF-6318) freed new dental and cosmetology equipment from customs duty for private providers, which points to dentistry as a private field. It needs a note template, an intake set and tools of its own: the owner's decision. |
| **add** | Allergologiya va klinik immunologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya" | Recognised and missing. How common it is in private outpatient practice: a local clinician. |
| **add** | Reproduktologiya | Order No. 6, annex 1, row 1, additional specialty under "Akusherlik va ginekologiya" | Recognised and missing. How common: a local clinician. |
| **add** | Bolalar nevrologiyasi | Order No. 6, annex 1, row 25, additional specialty under "Pediatriya" | Recognised and missing; the order lists eight paediatric subspecialties and the product has paediatrics and paediatric surgery only. Which of them matter in private practice: a local clinician. |
| **add** | Narkologiya | Order No. 6, annex 1, row 11 | A main specialty of the order, missing. Whether private providers practise it: a lawyer and a local clinician. |

The note on dentistry's customs relief is from a legal publisher's summary of 2021 acts on private medicine (<https://buxgalter.uz/oz/publish/doc/text176299_2021_yildagi_12_ta_nhhning_hususiy_tibbiet_sohasiga_tasiri>). Also in the order and not proposed, because nothing found says they are private outpatient fields: "Ftiziatriya", "Neonatologiya", "Gematologiya va transfuziologiya", "Patologik anatomiya", "Sud-tibbiy ekspertiza", "Endoskopiya", "Andrologiya va seksopatologiya", "Tibbiy psixoterapiya", the other paediatric subspecialties, and the whole direction "Tibbiy profilaktika ishi".

### 3.3 Clinic roles (10): keep 1, rename 5, remove 3, unverified 1, add 2

The Uzbek build has no separate list of clinic types. What it calls the clinic side is ten roles: five clinic doctors and five allied professions.

| Key | Name in the pack (Uzbek Latin / Russian) | Verdict | Official name | Where, and notes |
|---|---|---|---|---|
| `sac-ekimi` | Soch koʻchirib oʻtkazish / Трансплантация волос | **remove** | — | not in the nomenclature. No specialty of hair transplantation or of hair is in the order. Under which licensed specialty a clinic may offer it, and what it may call it, is for a lawyer and the local clinical lead. |
| `estetik-cerrahi` | Estetik xirurgiya / Эстетическая хирургия | **rename** | Plastik xirurgiya | Order No. 6, annex 1, row 21, additional specialty under "Xirurgiya". The word "estetik" is nowhere in the order. The recognised specialty is the one the doctor role plastik-cerrahi already carries, so the two roles are one specialty here. |
| `medikal-estetik` | Kosmetologiya (estetik tibbiyot) / Косметология (эстетическая медицина) | **rename** | Tibbiy kosmetologiya | Order No. 6, annex 1, row 5, additional specialty under "Dermatovenerologiya". The pack says "Kosmetologiya (estetik tibbiyot)". A 2015 attestation order writes «дерматовенерология ва тиббий косметология», the Ministry's 2024 list "Dermatovenerologiya va kosmetologiya". |
| `klinik-dermatoloji` | Dermatologiya (klinika) / Дерматология (клиника) | **rename** | Dermatovenerologiya | Order No. 6, annex 1, row 5. The pack says "Dermatologiya (klinika)". The specialty is the one the doctor role dermatoloji already carries; a 2021 order removed the word "(dermatologiya)" from a heading of the licensing requirements. |
| `longevity` | Profilaktik va yoshga qarshi tibbiyot / Превентивная и антивозрастная медицина | **remove** | — | not in the nomenclature. Nothing of preventive or anti-ageing medicine is in the order ("Valeologiya" stands under health management, "Diyetologiya" under "Terapiya"; "Gerontologiya" is an area of the Ministry's 2024 protocol list but not a specialty of the order). |
| `fizyoterapi` | Jismoniy reabilitatsiya mutaxassisi / Специалист по физической реабилитации | **unverified** | — | not found. The order lists doctors' specialties ("Reabilitologiya …", "Davolash fizkulturasi"). Whether a non-doctor physical-rehabilitation profession is recognised, and under which name, was not found: needs a local clinician and a lawyer. |
| `klinik-psikolog` | Klinik psixolog / Клинический психолог | **keep** | Klinik psixologiya | Order No. 6, annex 1, section VII, row 56. A doctor's specialty "Tibbiy psixologiya" (row 10) stands beside it. |
| `diyetisyen` | Diyetolog / Диетолог | **rename** | Diyetologiya | Order No. 6, annex 1, row 3, additional specialty under "Terapiya". The name fits; the kind does not. In the order dietology is a doctor's specialty after therapy, not an allied profession. Move the role to the doctor side, which changes how the assistant addresses it. |
| `ergoterapi` | Ergoterapevt / Эрготерапевт | **remove** | — | not in the nomenclature. No occupational therapy is in the order. Needs a local clinician to say whether the profession is practised under another name. |
| `odyoloji` | Audiolog / Аудиолог | **rename** | Surdologiya | Order No. 6, annex 1, row 15, additional specialty under "Otorinolaringologiya". The pack says "Audiolog" as an allied profession. The order knows surdology as a doctor's specialty after otorhinolaryngology. The earlier audit found both «Аудиолог» and «Врач сурдолог» in the Ministry's list of positions; that list was not re-read today. |

| Verdict | Official name | Where | Why |
|---|---|---|---|
| **add** | Stomatologiya (as a clinic) | Order No. 6, annex 1, section IV | As above: the clinic side is where a dental practice would sit. |
| **add** | Xalq tabobati | Order No. 6, annex 1, section VIII, row 58; the Minister of Health's order No. 54 of 27.11.2018, registration No. 3111 | A recognised direction with an order of its own on how medical activity with traditional methods is provided. Whether Notya wants this field at all is the owner's decision. |

**Types of clinic.** The product has no such field. The licensing requirements read today speak of an outpatient-type and an inpatient-type medical organisation («амбулатор типдаги тиббиёт ташкилоти», «стационар типдаги тиббиёт ташкилоти»: order No. 71 of 07.03.2019, registration No. 2905-3, <https://lex.uz/uz/docs/4271534>), and since 2021 of a "tibbiy punkt" staffed by mid-level workers and of "mobil tibbiyot" (order No. 13 of 26.07.2021, registration No. 2905-5, <https://lex.uz/en/docs/-5563449>). The Ministry's nomenclature of health-care institutions was not found.

"Remove" for a clinic role means: not a recognised specialty in the order read. It does not mean a clinic may not offer the service. Under which licensed specialty a clinic offers hair transplantation or "anti-ageing" care, and what it may call it in public, is a question for a lawyer in Uzbekistan; until it is answered the product should not present these three as specialties.

### 3.4 Which tools each specialty should see

"Core set" is section 2.1. The follow-up list comes with the first tool whose result can be kept. Tools in the third column are switched on today; those in the fourth are placeholders that stay off until their content is supplied and signed.

| Specialty | Core | Switched on today | Placeholders of this role | Proposed (Part 2) |
|---|---|---|---|---|
| Shoshilinch tibbiy yordam (`acil-tip`) | core set | `esi-triyaj`, `kritik-yol` | `acil-sevk` | — |
| Oilaviy shifokorlik (`aile-hekimligi`) | core set | — | `aile-asi-tarama`, `aile-kronik`, `aile-sevk`, `aile-kohort` | ten-year cardiovascular risk; NYHA class record; gestational age and expected date of birth; vaccination status; growth for age |
| Anesteziologiya va reanimatologiya (`anestezi`) | core set | `asa-preop`, `hava-yolu-notu`, `postop-agri` | — | — |
| Neyroxirurgiya (`beyin-cerrahisi`) | core set | `noro-postop`, `nobet-bilinc` | — | — |
| Bolalar xirurgiyasi (`cocuk-cerrahisi`) | core set | `cocuk-prepost-op`, `yara-dren-izlem` | `cocuk-onam-veli` | — |
| Terapiya (`dahiliye`) | core set | `kdigo-evre` | `kv-risk-score2`, `polifarmasi`, `antikoagulan` | ten-year cardiovascular risk; NYHA class record |
| Dermatovenerologiya (`dermatoloji`) | core set | `pasi`, `easi`, `scorad`, `yama-okuma` | `izotretinoin-gebelik-onleme` | — |
| Endokrinologiya (`endokrinoloji`) | core set | `rejim-karti` | `lab-izlem`, `dxa-tekrar` | ten-year cardiovascular risk |
| Yuqumli kasalliklar (`enfeksiyon-hastaliklari`) | core set | `antibiyotik-sure` | `viral-izlem`, `enfeksiyon-bildirim` | — |
| Gastroenterologiya (`gastroenteroloji`) | core set | — | `ibd-skor`, `hepatit-izlem` | — |
| Xirurgiya (`genel-cerrahi`) | core set | `yara-dren-izlem`, `genel-preop` | — | — |
| Torakal xirurgiya (`gogus-cerrahisi`) | core set | `toraks-preop`, `toraks-tup-yara` | — | — |
| Pulmonologiya (`gogus-hastaliklari`) | core set | `inhaler-teknik` | `cat-mmrc`, `akciger-aksiyon-plani` | — |
| Oftalmologiya (`goz-hastaliklari`) | core set | `gorme-keskinligi` | — | — |
| Akusherlik va ginekologiya (`kadin-hastaliklari-dogum`) | core set | — | `gebelik-takvimi`, `dogum-analik-raporu`, `kontrasepsiyon-mec`, `obstetrik-risk`, `kd-kohort` | gestational age and expected date of birth |
| Kardioxirurgiya; Qon tomirlar xirurgiyasi (`kalp-damar-cerrahisi`) | core set | `kalp-damar-preop`, `greft-yara-izlem`, `antikoagulan-vadeleri` | — | NYHA class record |
| Kardiologiya (`kardiyoloji`) | core set | — | `kv-risk-score2`, `kardiyo-izlem` | ten-year cardiovascular risk; NYHA class record |
| Otorinolaringologiya (`kulak-burun-bogaz`) | core set | `odyometri-pta`, `otoskopi-notu`, `vertigo-notu` | — | degree of hearing loss in the local classification |
| Nefrologiya gemodializ bilan (`nefroloji`) | core set | `kdigo-serit`, `diyaliz-seans` | `anemi-izlem` | ten-year cardiovascular risk |
| Nevrologiya (`noroloji`) | core set | — | `inme-kirmizi-bayrak`, `midas`, `antiepileptik-izlem` | — |
| Umumiy onkologiya (`onkoloji`) | core set | `kur-sayaci`, `toksisite-listesi` | — | — |
| Travmatologiya va ortopediya (`ortopedi`) | core set | `kirik-alci-takip`, `ortopedi-op-protokol`, `vas-fonksiyon` | — | — |
| Pediatriya (`pediatri`) | core set | `hedef-boy`, `doz-hesabi` | `buyume-persentil`, `asi-takvimi`, `gelisim-tarama`, `mchat-rf`, `pediatri-kohort` | vaccination status; growth for age |
| Plastik xirurgiya (`plastik-cerrahi`) | core set | `plastik-yara-greft` | `plastik-onam` | — |
| Psixiatriya (`psikiyatri`) | core set | — | `phq9-gad7`, `psikiyatri-guvenlik-triyaj`, `psikotrop-izlem` | — |
| Tibbiy radiologiya (`radyoloji`) | core set | `tetkik-kuyrugu`, `rapor-taslagi` | `radyo-kritik-bildirim` | — |
| Revmatologiya (`romatoloji`) | core set | `das28`, `eklem-28` | `iltihap-lab-izlem`, `basdai` | — |
| Urologiya (`uroloji`) | core set | `psa-hizi` | `ipss`, `uroloji-acil-triyaj` | — |
| Sport tibbiyoti (`spor-hekimligi`) | core set | `rtp-basamak`, `sakatlik-gunlugu` | — | — |
| Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya) (`fizik-tedavi`) | core set | — | `ftr-seans-plani`, `vas-odi`, `ev-egzersiz` | — |
| Plastik xirurgiya (`estetik-cerrahi`) | core set | — | — | what Plastik xirurgiya sees: plastik-yara-greft, and its placeholder plastik-onam |
| Tibbiy kosmetologiya (`medikal-estetik`) | core set | — | — | — |
| Dermatovenerologiya (`klinik-dermatoloji`) | core set | — | — | what Dermatovenerologiya sees: pasi, easi, scorad, yama-okuma, and its placeholder izotretinoin-gebelik-onleme |
| Jismoniy reabilitatsiya mutaxassisi (`fizyoterapi`) | the three product screens only | — | — | — |
| Klinik psixologiya (`klinik-psikolog`) | the three product screens only | — | — | — |
| Diyetologiya (`diyetisyen`) | core set, once the role is moved to the doctor side | — | — | — |
| Surdologiya (`odyoloji`) | core set, once the role is moved to the doctor side | — | — | odyometri-pta (exists; to be shown here too); degree of hearing loss in the local classification |

For the specialties proposed to add: the core set, and nothing more until a local specialist names what is used. Dentistry would need a tooth chart, for which no source was read.

## What the kit cannot do yet for this country alone

1. **A country cannot have its own list of roles.** A test holds every country to the same forty roles as Türkiye (`lib/ulke/rolEslemesi.test.ts`: forty rows, none missing, none extra), and the Uzbek specialty list is typed by Türkiye's own list of keys (`countries/uz/klinik/branslar.ts`). Adding dentistry, splitting cardiovascular surgery in two, or dropping hair transplantation for Uzbekistan alone fails that test today. Renaming a role is possible now: a name is the pack's own text.
2. **A pack cannot supply a table.** A country may state single numbers for a tool (`parametreler`), and a placeholder's content is fixed as empty (`icerik: null` in `lib/ulke/araclar/tipler.ts`). A risk chart for one region, growth tables, a vaccination calendar or a coding table cannot be handed to a tool by a pack. Four tools of the proposed set need exactly that.
3. **A tool does not know the patient.** A tool is given today's date and the pack's numbers, nothing of the patient's file (`AracOrtami`). An age-dependent formula (EASI, growth, the age bands of a risk model) must ask the doctor to type the age again.
4. **One tool's result cannot feed another.** The joint count does not hand its two numbers to DAS28, and a future eGFR calculator could not hand its result to the KDIGO tool.
5. **"Every doctor role" has no short form.** A tool is for everybody (allied professions and accounts without a role included) or for a list of roles written out. A core clinical calculator must therefore name some thirty roles by hand, and the list must be kept right as roles change. Possible today, easy to get wrong.
6. **Changing a formula changes it for all six countries.** The arithmetic lives in the kit, shared by every country. That is right for a published formula (a fix to EASI is a fix everywhere) and it means the EASI, ASA and antibiotic findings above are the kit's to fix, not Uzbekistan's. A threshold that really differs by country must first be turned into a number the pack states.
7. **No clinic tools and no clinic type** exist in the country kit.

## Could not verify

**Pages that were not read, exactly.**

| Page | What happened |
|---|---|
| <https://static.norma.uz/documents3/3303.pdf> (the nomenclature order as a file) | the fetch failed; the same order was read on lex.uz |
| lex.uz, opened directly | refused by the session's network policy; lex.uz was read through the summarising tool only |
| <https://lex.uz/uz/docs/-5870213>, annex 27, "Tibbiy faoliyatni litsenziyalash PASPORTI" | the page was cut off before the annex |
| <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf>, section "Артериальная гипертония" (p. 46) | the text ended in the section before it |
| <https://academic.oup.com/eurheartj/article/42/25/2439/6297709> (the SCORE2 paper at its publisher) | not permitted; a repository copy of the same paper was read |
| the Ministry of Health's page of clinical protocols and standards (<https://gov.uz/oz/ssv/sections/klinik-qo-llanmalar>) | opened; it showed its menu and no document |
| the Ministry's list of positions in the DMED system (read by the earlier audit on 2026-10-09) | not re-read today |
| <https://pubmed.ncbi.nlm.nih.gov/34120185/> and two further pages of the secondary calculator site | not permitted; nothing in this report rests on them |
| The WHO cardiovascular risk charts and the WHO growth tables themselves, the KDIGO guideline, the ASA statement, the ACR atlas, and the papers behind PASI, EASI, SCORAD, DAS28, the audiometric degrees, the target-height formula and the load ratio | never reached: no address for them was found before the search allowance ran out |

**Never looked for, because the search allowance had run out:** every national clinical protocol except the 2015 cardiology collection (hypertension as now in force, diabetes, chronic kidney disease, asthma and COPD, antenatal care, child health, psoriasis and atopic dermatitis, rheumatoid arthritis, stroke, hearing loss, tuberculosis, hepatitis, HIV); the order that names the growth standard; the national screening programmes; the order on forms of medical documentation; the list of notifiable diseases; the nomenclature of health-care institutions; the primary publications behind every score in the kit; and the licence terms of every rights holder. A follow-up session with a fresh search allowance can take these up; the list in the data file says which tool waits on which.

**For a local clinician, by specialty:** every row marked unverified in sections 1.2 and 1.3; which triage scale emergency departments use; the notation of visual acuity; the classification and naming of hearing loss; the units local laboratories print (creatinine, glucose, cholesterol, haemoglobin, the albumin-to-creatinine ratio, CRP, PSA); which cardiovascular risk chart the protocol in force prescribes; which growth standard; which of the proposed specialties are worth building.

**For a lawyer in Uzbekistan:** under which licensed specialty a clinic may offer hair transplantation and "anti-ageing" care and what it may call them; whether a non-doctor rehabilitation profession and occupational therapy exist as professions; the use of the owned instruments named in section 2.3 inside commercial software.

## Sources read on 2026-10-10

| What | Where |
|---|---|
| Minister of Health, order No. 6 of 12.05.2021 (reg. No. 3303), nomenclature of medical specialties, annex 1 as revised 2023 | <https://lex.uz/uz/docs/-5422572> |
| The repealed nomenclature: order No. 97 of 25.07.2017 (reg. No. 2908) | <https://lex.uz/uz/docs/-3284314> |
| Legal publisher's notes on both nomenclature orders | <https://www.norma.uz/uz/qonunchilikda_yangi/qanday_mutahassisliklar_buyicha_tibbiet_faoliyati_amalga_oshiriladi> ; <https://www.norma.uz/uz/qonunchilikda_yangi/licenziyada_qanday_tibbiy_ihtisosliklar_kursatiladi> |
| Ministry of Health, "Milliy/mahalliy klinik protokol va standartlarni ishlab chiqish, tasdiqlash va tibbiyot amaliyotiga joriy etish metodologiyasi", Tashkent 2024 (51 protocol areas; "XKT-10/11" codes) | <https://api-portal.gov.uz/uploads/9601e5f7-7b41-8340-c074-d4e0a914804e_media_.pdf> |
| Attestation orders that name specialties: No. 401 of 19.10.2015, No. 94 of 08.04.2019, No. 54 of 03.03.2020 | <https://api-portal.gov.uz/uploads/672ec1d6-0290-6b8a-bdb6-0c7d1535be00_media_.pdf> ; <https://api-portal.gov.uz/uploads/b4b82a56-c1fe-bae1-d805-1657d47a3d94_media_.pdf> ; <https://api-portal.gov.uz/uploads/f412616f-92c1-2897-8adb-a0d82a7bccdc_media_.pdf> |
| Minimum requirements per specialty for licensing: order No. 71 of 07.03.2019 (reg. No. 2905-3); order No. 13 of 26.07.2021 (reg. No. 2905-5) | <https://lex.uz/uz/docs/4271534> ; <https://lex.uz/en/docs/-5563449> |
| Cabinet of Ministers resolutions on licensing medical activity: No. 405 of 21.06.2017 (superseded); No. 80 of 21.02.2022 | <https://lex.uz/uz/docs/-3242574> ; <https://lex.uz/uz/docs/-5870213> |
| Order No. 54 of 27.11.2018 (reg. No. 3111) on medical activity with traditional methods | <https://lex.uz/docs/4136809> |
| SanQvaM 0239-07/3, "Oʻzbekiston Respublikasida yuqumli kasalliklar immunoprofilaktikasi" (the vaccination calendar), and its amendment of 19.07.2021 | <https://lex.uz/acts/5524039> ; <https://lex.uz/docs/5524044> ; <https://lex.uz/docs/5520052> |
| Presidential resolution PP-4790 of 27.07.2020 on the sanitary-epidemiological committee | <https://lex.uz/docs/4914450> |
| "Сборник клинических протоколов по диагностике, лечению и профилактике сердечно-сосудистых заболеваний", Ministry of Health, Tashkent 2015 (read as far as the arrhythmia section) | <https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf> |
| WHO Regional Office for Europe: PEN workshop report, Samarkand 2016; good-practice brief on Uzbekistan 2018; news item; NCD country profile 2018 | <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0005/335813/PEN-meeting-report-16.pdf> ; <https://who-sandbox.squiz.cloud/__data/assets/pdf_file/0007/367288/gpb-hss-ncds-uzb-eng.pdf> ; <https://www.who.int/europe/news-room/20-04-2018-intervention-package-improves-men-s-health-in-uzbekistan> ; <https://cdn.who.int/media/docs/default-source/country-profiles/ncds/uzb_en.pdf> |
| SCORE2 working group, Eur Heart J 2021;42:2439-2454 (repository copy; figure 5) | <https://push-zb.helmholtz-munich.de/deliver.php?id=31109> |
| Meyer et al., Tidsskr Nor Legeforen 2022, table 1 (the four risk regions, citing the 2021 European guideline) | <https://tidsskriftet.no/en/node/62283/pdf> |
| A secondary calculator page listing the regions and its references; its page on the 2021 kidney equation | <https://www.evigrade.com/en/calculators/score2> ; <https://www.evigrade.com/en/calculators/egfr-ckd-epi-2021> |
| WHO cardiovascular disease risk charts, Lancet Glob Health 2019;7:e1332-e1345 (record pages; CC BY 4.0) | <https://dspace.library.uu.nl/handle/1874/390215> ; <https://repub.eur.nl/pub/121288> |
| Local papers: child growth, Fergana 2025; cardiovascular risk in a Tashkent polyclinic 2023; hypertension, Tashkent Medical Academy 2023; and a Tashkent paper on risk factors whose journal and year were not in the text read | <https://inscience.uz/index.php/preventive-medicine/article/download/7502/7294/23221> ; <https://sammu.uz/ru/article/3316/download> ; <https://journals.tma.uz/index.php/cajm/article/download/657/548/1618> ; <https://www.heartj.asia/jour/article/download/4039/4038> |
| Legal publisher's summary of twelve acts of 2021 on private medicine | <https://buxgalter.uz/oz/publish/doc/text176299_2021_yildagi_12_ta_nhhning_hususiy_tibbiet_sohasiga_tasiri> |
| UNICEF Uzbekistan, mother and child health (no standard named) | <https://www.unicef.org/uzbekistan/uz/ona-va-bola-salomatligi> |
| The product's own code and records | `lib/ulke/araclar/`, `countries/uz/`, `countries/rol-eslemesi.json`, `countries/yasak-araclar.json`, `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md`, `specialties/dahiliye/engines/score2.ts`; the earlier audit `docs/COUNTRY-AUDIT-UZBEKISTAN.md` on branch `audit/uz` |
