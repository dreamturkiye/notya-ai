# Corrections to the shared doctor tools (NOTYA-ULKE-ARAC-DUZELTME-01)

Written 2026-10-10. Branch `fix/ulke-arac-duzeltmeleri`, into `feat/ulke-butun`.

Six country audits (`docs/araclar-denetim/<CODE>.md` on the branches `araclar-denetim/<code>`) checked the shared tools of the country kit against primary sources and found fourteen faults. This page says, fault by fault, what the tool showed before, what it shows now, which source was opened, and whether the fault is fixed, partly fixed or left.

**The rule of this job.** No number, weight, band, step or formula was changed without its primary source open on the day. Each source is cited beside the change in the code and in the test (`lib/ulke/araclar/duzeltmeler.test.ts`). Where a source prints a worked example it is a test; where it prints none, the audits' own example is the test and the page says so. Nothing clinical was written from memory.

**What this job did not do.** It switched no tool on or off in any country. It put no country's national table into any pack. It changed nothing of the Turkish product.

**Tools that are switched off today.** A separate job (pull request #608, merged 2026-10-10) switched off the dose calculator, the two kidney tools, ESI triage and the report outline in every country. Faults 1 and 5 below are corrected in the kit all the same; a doctor will see those corrections on the day the tools are switched back on. Every other correction on this page is visible wherever the tool is on.

## Summary

| # | Fault | State | One example: before → now |
|---|---|---|---|
| 1 | Dose calculator rounds the volume to 0.1 mL; trailing zeros | **Fixed** | 4 kg at 2 mg/kg, liquid 50 mg/mL: "0.2 mL" → "0.16 mL" with two cautions. 16 kg at 10 mg/kg, 160 mg in 5 mL: "160.00 mg, 5.0 mL" → "160 mg, 5 mL" in the five English-language countries; "160,00 mg, 5,00 mL" in Uzbekistan |
| 2 | EASI ignores the patient's age | **Fixed** (half points not built) | Child under 8, head and neck only, four signs at 3, area 6: 7.2 → 14.4 |
| 3 | Antibiotic course ends one day late | **Fixed** | 7 days from 1 October: ends 8 October → ends 7 October |
| 4 | ASA has five classes and "E" as a sixth | **Fixed** | "ASA E" with no class; class VI could not be recorded → classes I to VI, and "E" a tick beside the class |
| 5 | Kidney tools: risk cell without urine albumin; referral lines; limits per unit | **Fixed** | eGFR 75 alone: "low risk (green cell)" → no cell, "the ratio is missing". 3.0 mg/mmol: A1 → A2. 31 mg/mmol: A2 → A3. eGFR 75 with 350 mg/g: "a KDIGO referral criterion is met" → a line that says what the list asks for and that one result does not show it |
| 6 | Hearing average: grade table does not match its source; fixed to one country's practice | **Fixed** | Average 20 dB: "normal" → "slight hearing loss (16 to 25 dB)". Ears 30 and 15 dB apart: flagged → not flagged (the rule is "greater than 15 dB"). A country can now set its frequencies, its grade table and its asymmetry rule |
| 7 | Return to sport: six made-up stages, no injury date | **Fixed** (three things a table cannot hold are not built) | "Stage 5: return to competition" on day 3, no objection → no stages at all unless the country supplies its steps; then a step before its earliest day is warned |
| 8 | Vertigo note lacks arm weakness and neck pain | **Fixed** | A patient with a weak arm: "no sign of a central cause was marked" → three more boxes (limb weakness or altered sensation, poor coordination, significant neck pain) |
| 9 | PASI, SCORAD, EASI band edges and unsupported bands | **Fixed**, one edge **left** | PASI 12: "moderate" → "12.0 / 72", no severity word. SCORAD 50.0: "severe" → "moderate". EASI 0: "mild" → "clear"; 7.0: "moderate" → "mild"; 21.0: "severe" → "moderate". SCORAD exactly 25 is left as "moderate": the page opened does not settle it |
| 10 | Injury log warns at exactly 1.3 | **Fixed** | 390 minutes against a usual 300 (ratio 1.3): "needs attention" → no warning |
| 11 | Expected height range of 8.5 cm in every country | **Fixed** | Mother 160 cm, father 180 cm, a boy: "176.5 cm, 168.0 to 185.0 cm" → "176.5 cm" and no range until the country states its number |
| 12 | Units: DAS28 CRP; HbA1c, haemoglobin, ACR, CRP as quantities; limits with units | **Fixed** | DAS28, CRP 1.0 mg/dL typed as "1.0": 3.43 → the doctor chooses the unit, 4.04. HbA1c 53 mmol/mol: refused → read as 7.0% |
| 13 | Orthopaedic pain-and-function invents a severity word | **Fixed** | Pain 5 of 10 with little loss of function: "mild pain and limitation of function" → "Pain 5 / 10, function 2 / 16" and nothing else |
| 14 | PSA: unit label; "<90 days apart" caution | **Fixed** (the 90 days itself is unsourced and was left) | United Kingdom: "ng/mL" → "µg/L". A country can set the caution to another number of days or switch it off |

**Tools on the must-stay-off list: none.** Every source the fourteen corrections needed could be opened, so no tool had to be left as it was and listed. The list and its test exist (`countries/kapali-kalmali-araclar.json`, `lib/ulke/araclar/kapaliKalmali.paket.test.ts`) and are empty.

## Fault by fault

Dates read: all 2026-10-10.

### 1. Dose calculator

**Before.** The volume of one dose was rounded to the nearest 0.1 mL and only the rounded figure was shown. A baby of 4 kg at 2 mg/kg with a liquid of 50 mg in 1 mL needs 8 mg, which is 0.16 mL; the screen showed "0.2 mL", a quarter more, with no warning (audit CA, fault 2). Amounts were written with fixed decimals: "160.00 mg", "5.0 mL" (audits AU 1, GB 4, NZ 2, CA 3).

**Now.**

- The volume is not rounded to any step. It is the result of the arithmetic, written with at least two decimal places and at least three significant figures, so a small amount is never written "0.00". 0.16 mL is "0.16 mL"; 10 mg of a 3 mg/mL liquid is "3.33 mL".
- Two cautions, both in the result and in the copied summary. With every volume: "The volume is the result of the arithmetic and is not rounded to any measuring device: check that the device you use can measure it". Below 1 mL: "The volume for one dose is below 1 mL: a small volume needs a device graduated finely enough to measure it".
- How an amount is written is each country's setting (`dozYazimi`). The five English-language countries say "no zero after the last figure": "160 mg", "5 mL", "2.5 mL", "0.5 mL". Uzbekistan says the decimals stand: "160,00 mg", "5,00 mL".
- No rounding rule was invented. A rule for rounding belongs to a country and its measuring devices; no country has stated one.

**Sources opened.**

- United States: NCPDP, "Standardize the Dosing Designations on Prescription Container Labels for Oral Liquid Medications to Metric (mL) Only" (the white paper the FDA hosts), https://www.fda.gov/media/88498/download: "Do NOT use trailing zeros after a decimal point"; "Use leading zeros"; "Dosing devices should be of appropriate volume and graduated accuracy for the amount prescribed".
- United Kingdom: MHRA, "Best practice guidance on the labelling and packaging of medicines" (2026), section 4.3.2, https://assets.publishing.service.gov.uk/media/6a4770118effd97622f53be5/Best_practice_guidance_labelling_MHRA_Final_July_2026.pdf: "Trailing zeros should not appear i.e., 2.5 mg and NOT 2.50 mg." It is guidance on labels, not on prescription writing.
- Australia: Australian Commission on Safety and Quality in Health Care, "Recommendations for safe use of medicines terminology" (November 2024), https://www.safetyandquality.gov.au/sites/default/files/2024-12/recommendations-for-safe-use-of-medicines-terminology.pdf: "Do not use trailing zeros. For example, use '5' not '5.0' for doses of medicines expressed in whole numbers."
- New Zealand: Health Quality & Safety Commission, "Error-prone abbreviations, symbols and dose designations not to use" (May 2012), https://www.hqsc.govt.nz/assets/Medication-Safety/Alerts-PR/Poster-error-prone-abbreviations-not-to-use.pdf: "never write a zero after a decimal point. Write 1.0mg as 1mg."
- Canada: ISMP Canada, "Do Not Use: Dangerous Abbreviations, Symbols and Dose Designations" (2006, reaffirmed 2018), https://www.ismp-canada.org/download/ISMPC_List_of_Dangerous_Abbreviations.pdf: "Never use a zero by itself after a decimal point. Use "X mg"."
- Uzbekistan: Order No. 121 of the Minister of Health of 01.07.2020, clause 19, https://lex.uz/docs/-4880063: the order itself writes amounts as "(0,001; 0,5; 1,0)". The clause is about medicines made up to order and says nothing about rounding.
- Alberta Health Services, Connect Care, "Decimal precision for oral medication measurements" (2019-11-14), https://support.connect-care.ca/2019/11/14.html: "two digit rounding for volumes of liquid oral medications <1ml; and one digit rounding for volumes >1ml". One province's record system. **Not adopted as a rounding rule.** The 1 mL in it is the limit of the small-volume caution, and nothing else.

**State: fixed.** Open point for each country: nobody of that country has confirmed the trailing-zero setting; it is in each country's record under "Writing an amount of a medicine".

### 2. EASI and the patient's age

**Before.** The weights of a patient aged 8 or over (head and neck 0.1) were used for everybody. A child under 8 with only the head and neck involved, all four signs at 3 and an area score of 6, scored 7.2 (audit US, fault 3).

**Now.** The tool asks the age first ("under 8" or "8 or over") and gives no score without it. Under 8 the weights are 0.2 / 0.2 / 0.3 / 0.3, and the same child scores 14.4. A form that is not finished has no score: an empty box used to count as 0.

**Source opened.** Harmonising Outcome Measures for Eczema (HOME), "EASI User Guide", January 2017, v3, https://www.homeforeczema.org/documents/easi-user-guide-jan-2017-v3.pdf: "Patients 8 years or above" 0.1, 0.2, 0.3, 0.4; "Patients under 8 years of age" 0.2, 0.2, 0.3, 0.3; "The final EASI score ranges from 0-72". The guide prints no worked example, so the audit's example is the test.

**State: fixed. Not built:** the guide allows half points (1.5 and 2.5) for a sign; the fields take whole points only.

### 3. Antibiotic course

**Before.** The number of days was added to the first day: 7 days from 1 October "ended" on 8 October.

**Now.** The first day is day 1: 7 days from 1 October end on 7 October. A course of one day ends the day it starts. The description says "the start date counts as day 1".

**Source opened.** CDC, National Healthcare Safety Network, "FAQs: Antimicrobial Use (AU) Option", https://www.cdc.gov/nhsn/faqs/faq-au.html: an antimicrobial day is counted for each calendar day on which the medicine is given. The page prints no worked example; the audits' example is the test.

**State: fixed.** The Turkish product has the same count; see "The Turkish antibiotic tool" below.

### 4. ASA physical status

**Before.** The classes offered were I to V and "E" as a sixth: class VI could not be recorded, and choosing E gave "ASA E" with no class.

**Now.** Six classes, I to VI. "E" is a tick of its own that appears once a class is chosen, and the result shows the class with "E: emergency surgery" beside it. The classes are named by their numerals only: the society's definition text is not in the product, by the owner's instruction, and a test holds every language form to that.

**Source opened.** American Society of Anesthesiologists, "Statement on ASA Physical Status Classification System" (last approved 15 October 2014), https://asahq.org/resources/clinical-information/asa-physical-status-classification-system: classes ASA I to ASA VI; "The addition of "E" denotes Emergency surgery".

**State: fixed.**

### 5. Kidney tools (KDIGO category tool and the kidney strip)

**Before.**

- With no urine albumin result the tool read the missing value as category A1 and showed a risk cell: an eGFR of 75 alone was "low risk (green cell)".
- The limits were compared after converting mg/mmol to mg/g: 3.0 mg/mmol (26.5 mg/g) was A1 and 31 mg/mmol (274 mg/g) A2 (audits AU 10, GB 8, NZ 12).
- Referral lines labelled "KDIGO criterion" that are not on the guideline's list: category A3 alone, the "very-high-risk cell", and a fall of more than 25% in a year. An eGFR of 75 with 350 mg/g and no blood in the urine was told "a KDIGO referral criterion is met" (audit US, fault 1).

**Now.**

- No risk cell without the ratio. The result shows the GFR category and a line that says the ratio is missing and the cell needs both results.
- The limits are the guideline's as printed for each unit, compared in the unit the value was typed in: in mg/mmol A1 below 3, A2 3 to 30, A3 above 30; in mg/g A1 below 30, A2 30 to 300, A3 above 300. 3 mg/mmol is A2, 30 mg/mmol is A2, 31 mg/mmol is A3.
- The referral lines are the four of the list that the numbers typed can touch, at the list's own limits: eGFR below 30; a ratio of 300 mg/g (30 mg/mmol) or more, which the list names as a consistent finding together with haematuria; a ratio above 700 mg/g (70 mg/mmol), a consistent finding; an eGFR more than 20% below the earlier one, where the list names a sustained fall. Each line says what the list asks for beyond one result. No line says a criterion is met, and the words "KDIGO criterion" are gone from every language form.
- A fall from 44 to 32 (27%) was labelled by a 25% rule the guideline does not have; it is now held against the list's 20%.

**Sources opened.**

- KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease, Kidney Int 2024;105(4S), https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf: Table 3, albuminuria categories in both units; "CKD is classified based on Cause, GFR category (G1–G5), and Albuminuria category (A1–A3)".
- KDIGO 2024, Summary of Recommendation Statements and Practice Points, https://kdigo.org/wp-content/uploads/2026/05/KDIGO-2024-CKD-Guideline-Summary-Recommendations-and-Practice-Points.pdf: Practice Point 5.1.1 and Figure 48, the circumstances for referral.

**State: fixed.** Note: the Uzbek texts name mg/g only, the one unit that pack states. The on/off state of both tools is the other job's.

### 6. Hearing: pure-tone average

**Before.** Six grades, with everything up to 25 dB "normal". The table the tool cites ends "normal" at 15 dB. All four thresholds at 20 dB read "within normal limits" (audits US 6, CA 4). A difference of exactly 15 dB between the ears was flagged. The four frequencies, the grades and the rule were the same in every country.

**Now.** Seven grades, as the cited table prints them: normal up to 15, slight 16 to 25, mild 26 to 40, moderate 41 to 55, moderately severe 56 to 70, severe 71 to 90, profound 91 and above. The difference between the ears is shown as a number and flagged when it is greater than 15 dB. A country can replace all three: its frequencies, its grade table, its asymmetry rule.

**Sources opened.**

- American Speech-Language-Hearing Association, "Degree of Hearing Loss", https://asha.org/public/hearing/degree-of-hearing-loss: the table, "Source: Clark, J. G. (1981). Uses and abuses of hearing loss classification. Asha, 23, 493–500."
- American Academy of Otolaryngology–Head and Neck Surgery, position statement "Red Flags-Warning of Ear Disease" (reviewed July 2025), https://www.entnet.org/resource/position-statement-red-flags-warning-of-ear-disease/: "a difference of greater than 15 dB Pure Tone Average between ears".

**State: fixed.** Not built: a rule on single frequencies of both ears (the tool knows the other ear by its average only). The flag for a change of 10 dB against an earlier average was not in the brief, has no source in the tool, and was left as it was.

### 7. Return to sport

**Before.** Six stages numbered 0 to 5, beginning with "rest and control of symptoms", in every country. They match no guideline the audits read. There was no injury date, so "stage 5: return to competition" could be recorded on day 3 or day 10 without a word (audits GB 3, NZ 1, AU 3).

**Now.** The kit holds no staging. The tool asks the date of the injury and shows the days since it. The steps are a table a country supplies: one row per step, with the earliest day of that step counted from the injury. With the table, the doctor chooses the step; the result shows the day count, the step, its earliest date, and a warning when today is before it. **No country has supplied its steps, so in every country today the tool shows the days since the injury and a line that says no steps have been set for this country.** No stage is shown.

**Source opened.** CDC HEADS UP, "Returning to Sports", https://www.cdc.gov/heads-up/guidelines/returning-to-sports.html: six steps numbered 1 to 6, from "Back to regular activities" to "Competition", each of which "typically takes a minimum of 24 hours". Opened as one example of the mismatch; **its steps were not put into any pack**.

**State: fixed.** A table of earliest days cannot hold three things some guidelines ask for: a minimum time at each step, days free of symptoms, and medical clearance between two steps. A country that needs them brings a tool of its own.

### 8. Vertigo note

**Before.** Six central signs. Weakness and numbness were of the face only, and headache had no neck pain beside it. A patient with a weak arm or with neck pain had no box, and the result read "No sign of a central cause was marked" (audit CA, fault 8).

**Now.** Nine signs: added are weakness or altered sensation of a limb, poor coordination of a limb (dysmetria), and significant neck pain. The rule is unchanged: with any central sign a repositioning manoeuvre is flagged as not suitable.

**Source opened.** Johns P, Quinn J. Clinical diagnosis of benign paroxysmal positional vertigo and vestibular neuritis. CMAJ 2020;192(8):E182-6, https://cmaj.ca/content/cmaj/192/8/e182.full.pdf, Figure 1: "Focal weakness or paresthesia of face or limbs"; "Dysarthria, diplopia, dysphagia, dysmetria, dysphonia"; "Significant headache or neck pain".

**State: fixed.**

### 9. PASI, SCORAD and EASI bands

**Before.** PASI: below 10 mild, 10 to 19.9 moderate, 20 or more severe; PASI 12 was "moderate" (audit US 11). SCORAD: 50.0 was "severe" and 0 was "mild" (audit US 12). EASI: three bands, so that 0 was "mild", 7.0 "moderate", 21.0 "severe" (audit US 4). In all three an empty box counted as 0, so one box filled gave "PASI 0".

**Now.**

- **PASI: the score and no severity word.** No source was found for the three bands. The one page opened that prints any contradicts them.
- **EASI: the six published strata.** 0 clear; 0.1 to 1.0 almost clear; 1.1 to 7.0 mild; 7.1 to 21.0 moderate; 21.1 to 50.0 severe; 50.1 to 72.0 very severe.
- **SCORAD: severe is above 50**, so exactly 50 is moderate; 0 has no severity word.
- A form that is not finished has no score, in all three.
- A country whose own source states bands can supply them for any of the three.

**Sources opened.**

- Canadian Agency for Drugs and Technologies in Health, Clinical Review Report: Guselkumab, Appendix 5 "Validity of Outcome Measures" (2018), https://www.ncbi.nlm.nih.gov/books/NBK534046/: the PASI formula, weights and range, and "a PASI score of 5 to 10 is considered moderate disease, and a score over 10 is considered severe".
- Leshem YA, Hajar T, Hanifin JM, Simpson EL. Br J Dermatol 2015;172:1353–1357, abstract, https://academic.oup.com/bjd/article-abstract/172/5/1353/6616225: the six EASI strata.
- Pierre Fabre Eczema Foundation, PO-SCORAD, https://www.pierrefabreeczemafoundation.org/en/po-scorad-tool: "Between 0 and 25", "Between 25 and 50", "Above 50".
- Oranje A et al. Br J Dermatol 2007;157:645–648, repository page https://repub.eur.nl/pub/35156: the formula and the maximum of 103. **The full text could not be opened**, and the page returned no severity limits.

**State: fixed, with one edge left.** On which side exactly 25 falls in SCORAD is not settled by the page opened ("between 0 and 25" and "between 25 and 50" both name it). The tool keeps 25 as moderate, as it was. The paper that would settle it was not opened.

### 10. Injury log

**Before.** A warning from a ratio of 1.3 inclusive: 390 minutes this week against a usual 300 "needs attention" (audit US 13). The ratio was written to one decimal, so 1.26 and 1.34 both read "1.3".

**Now.** Exactly 1.3 raises nothing. At 1.5 or above the line says the paper calls this the "danger zone". Above 1.3 and below 1.5 the line says only that the ratio is above the range the paper calls the sweet spot; the paper states no risk for that stretch. The ratio is written to two decimals.

**Source opened.** Gabbett TJ. The training–injury prevention paradox. Br J Sports Med 2016;50:273–280, https://bjsm.bmj.com/content/50/5/273: "acute:chronic workload ratios within the range of 0.8–1.3 could be considered the training 'sweet spot'"; "ratios ≥1.5 represent the 'danger zone'".

**State: fixed.** Still true and now said in the description: the paper measures load as effort multiplied by minutes and the usual load over 3 to 6 weeks; this tool divides minutes by minutes.

### 11. Expected adult height

**Before.** A range of 8.5 cm either side in every country. Mother 160 cm, father 180 cm, a boy: 176.5 cm, "168.0 to 185.0 cm" (audit GB 6).

**Now.** The kit has no number. A country states its own (`aralik_cm`), with its source. No country has, so the tool shows the target height and no range. The formula (13 cm) was confirmed and is unchanged.

**Sources opened**, which state two different figures:

- Barstow C, Rerucha C. Evaluation of short and tall stature in children. Am Fam Physician 2015;92(1):43-50, https://www.aafp.org/afp/2015/0701/p43.pdf: the formula, and "within 10 cm (4 in)".
- UK growth chart, boys 2–18 years (© RCPCH 2012), https://www.sign.ac.uk/media/1436/boys_2-18_years_growth_chart.pdf: "Four boys out of five will have an adult height within ±7 cm of this target height".

Neither was put into a pack. With 7 the range would be 169.5 to 183.5 cm; with 10, 166.5 to 186.5 cm (both are tests).

**State: fixed.**

### 12. Units

**Before.** The DAS28 field said "CRP (mg/L)" in every country; the United States pack told the doctor to multiply by 10 by hand. 4 tender and 2 swollen joints, global score 50, CRP 10 mg/L is 4.04; the same result reported as 1.0 mg/dL and typed as "1.0" gave 3.43 (audit US 5). HbA1c, CRP and PSA had no unit choice; an HbA1c of 53 mmol/mol was refused as "above 20". Limits that are laboratory values were bare numbers.

**Now.**

- **Three new quantities in the kit**, each with a sourced conversion: HbA1c (per cent or mmol/mol), C-reactive protein (mg/L or mg/dL), PSA (ng/mL or µg/L). Haemoglobin and the albumin-to-creatinine ratio were already quantities.
- **DAS28**: the CRP field is the pack's unit. The United States accepts both mg/L and mg/dL; the doctor chooses beside the field, and a number without its unit gives no result. 1.0 with "mg/dL" chosen gives 4.04.
- **Limits with their unit** (`parametreOlculeri`): the two HbA1c cut-offs of the HbA1c and TSH follow-up; the three haemoglobin limits of the anaemia follow-up; the two CRP thresholds of the CRP and ESR follow-up. A bare number is refused by the pack check. These three tools are placeholders in every country; nothing a doctor sees changed.

**Sources opened.**

- NGSP, "IFCC Standardization", https://ngsp.org/ifccngsp.asp: "NGSP = (0.09148*IFCC) + 2.152", and the table of pairs from 5% = 31 mmol/mol to 12% = 108 mmol/mol. **The table's pairs are a test, both ways.**
- DAS28-CRP calculator of the score's developers, https://www.das-score.nl/das28/DAScalculators/DAS28_CRP_4VAR.html: the field is "CRP (mg/l)".
- CRP mg/dL to mg/L (×10) and PSA ng/mL = µg/L (×1) are changes of metric prefix, not clinical conversions.

**State: fixed.**

### 13. Orthopaedic pain and function

**Before.** A grade (mild, moderate, severe) from "pain × 0.8 + the function total", a weighting the product invented and published nowhere. Pain 5 of 10 with little loss of function read "mild pain and limitation of function".

**Now.** The pain score and the function total, as the doctor entered them, and no word.

**Source.** None exists to correct it to; that is the fault.

**State: fixed.**

### 14. PSA change over time

**Before.** The fields said "ng/mL" in the kit; a country that writes µg/L could only rename the code, and the United Kingdom showed "ng/mL". A caution appeared whenever two values were fewer than 90 days apart, in every country: 4.5 then 5.0 µg/L six weeks later raised it on every repeat test a guideline itself asks for (audit NZ 6).

**Now.** The unit is the pack's statement: ng/mL in the United States and Uzbekistan; µg/L in the United Kingdom, Australia, New Zealand and Canada. The yearly change is written in the same unit. The caution is a number a country may state: another number of days, or 0 to switch it off.

**Source opened.** NICE guideline NG12, draft for consultation of October 2021, Table 1, https://www.nice.org.uk/guidance/ng12/documents/draft-guideline-4: PSA in "micrograms/litre".

**State: fixed, with one thing left.** The 90 days is the earlier tool's own number and has no source. It was left as the default because nothing read says what else it should be. No country's setting was changed: New Zealand still sees the caution until somebody there decides.

## What is now open to each country, and what the country supplies

Every point is optional unless it says otherwise. A country that supplies nothing gets what is described above.

| Tool | What a country can supply | Without it |
|---|---|---|
| Dose calculator | **Required to switch the tool on:** how an amount of a medicine is written, with or without a zero after the decimal mark, with the national source | The pack check refuses the build |
| Expected height | The range either side of the target, in cm, with its source | Target height only, no range |
| Hearing average | The frequencies to average (two or more of 0.25, 0.5, 1, 2, 3, 4, 6, 8 kHz); its own grade table; its own asymmetry rule ("more than N dB" or "N dB or more") | 0.5, 1, 2 and 4 kHz; the seven grades of the cited table; more than 15 dB |
| Return to sport | The country's steps, in order, each with its earliest day after the injury | Days since the injury only; no step |
| PSA | The unit its laboratories print; the number of days for the short-interval caution, or 0 for none | The pack must state the unit; 90 days |
| PASI | Its own bands, from its own source | The score, no severity word |
| EASI, SCORAD, DAS28 | Its own bands, replacing the published ones | The published bands |
| DAS28, CRP follow-up | The unit CRP is reported in, or both | The pack must state it |
| HbA1c follow-up | The unit HbA1c is reported in; its two cut-offs with their unit | Stays a placeholder |
| Anaemia follow-up | Its three haemoglobin limits with their unit | Stays a placeholder |

## The Turkish antibiotic tool (read only; nothing changed)

`specialties/enfeksiyon-hastaliklari/engines/atbSure.ts` computes `const bitis = gunEkle(baslangic, sureGun)`. Its own test pins a 7-day course from 1 September 2026 to end on 8 September 2026, the screen labels that date "Bitiş", and the follow-up task "Antibiyotik süre bitişi kontrolü" falls on that day. **The Turkish product has the same one-day-late count.** It was not touched.

## Things that looked wrong outside the brief

- **The copied summary rounded a typed number to one decimal.** A dose typed as 0.15 mg/kg went into the note as "0.2 mg/kg". Fixed, because it sits in the same shared code as the dose writing: a typed number is repeated with every place it has.
- **The AAO-HNS page carries a clause against using its content with artificial intelligence.** The kit quotes one sentence of it as the source of "greater than 15 dB". For the lawyer.
- **The ASA page forbids reproducing its content without written consent.** The product names the classes by numeral only.
- **Kept results.** Band and warning keys were not renamed. Where a kept result of the old EASI, SCORAD or hearing tool exists, it would be shown with the new wording of the same key. The table that keeps results (migration 139) is reported as not applied in any country, so no such record should exist.
- **The hearing tool's flag for a change of 10 dB** and **the PSA tool's 90 days** are numbers of the earlier tool with no source.
- **Uzbek kidney texts name mg/g only.** The script that derives Cyrillic (`scripts/uz-kiril.mjs`) is outside this job's paths and would misspell "mmol"; the pack states mg/g as its one unit, so nothing shown is wrong.

## New Uzbek and Russian texts: machine-written, not read by a native speaker

Fifty-three texts of the Uzbek pack are new or changed. **Each was written by a machine and has been read by no native speaker of Uzbek or Russian and by no clinician.** The Cyrillic form is derived from the Latin by the pack's rule.

| Tool | Text | Uzbek (Latin) | Uzbek (Cyrillic) | Russian |
|---|---|---|---|---|
| `asa-preop` | `aciklama` | Anesteziyadan oldingi baholash bandlari va siz belgilagan ASA jismoniy holat klassi (I–VI); operatsiya shoshilinch boʻlsa, klassga E belgisi qoʻshiladi. | Анестезиядан олдинги баҳолаш бандлари ва сиз белгилаган ASA жисмоний ҳолат класси (I–VI); операция шошилинч бўлса, классга E белгиси қўшилади. | Пункты преданестезиологической оценки и указанный вами класс физического статуса ASA (I–VI); при экстренной операции к классу добавляется отметка E. |
| `asa-preop` | `asa_acil` | E: shoshilinch operatsiya (klassga qoʻshiladigan belgi) | E: шошилинч операция (классга қўшиладиган белги) | E: экстренная операция (отметка, добавляемая к классу) |
| `asa-preop` | `asa_acil` | E: shoshilinch operatsiya | E: шошилинч операция | E: экстренная операция |
| `kdigo-evre` | `aciklama` | KFT toifasi (G1–G5), albuminuriya toifasi (A1–A3) va, ikkala natija kiritilganda, ular tushadigan xavf katagi. Davolash rejasi va kuzatuv muddati yozilmaydi. | КФТ тоифаси (G1–G5), альбуминурия тоифаси (A1–A3) ва, иккала натижа киритилганда, улар тушадиган хавф катаги. Даволаш режаси ва кузатув муддати ёзилмайди. | Категория СКФ (G1–G5), категория альбуминурии (A1–A3) и, когда введены оба результата, ячейка риска, в которую они попадают. План лечения и сроки наблюдения не указываются. |
| `kdigo-evre` | `uacr` | Siydikda albumin va kreatinin nisbati (usiz xavf katagi koʻrsatilmaydi) | Сийдикда альбумин ва креатинин нисбати (усиз хавф катаги кўрсатилмайди) | Отношение альбумина к креатинину в моче (без него ячейка риска не показывается) |
| `kdigo-evre` | `egfr_bir_yil_once` | Oldingi KFT (ixtiyoriy) | Олдинги КФТ (ихтиёрий) | Прежняя СКФ (необязательно) |
| `kdigo-evre` | `uacr_yok` | Siydikda albumin va kreatinin nisbati kiritilmagan: xavf katagi ikkala natijani talab qiladi va koʻrsatilmaydi | Сийдикда альбумин ва креатинин нисбати киритилмаган: хавф катаги иккала натижани талаб қилади ва кўрсатилмайди | Отношение альбумина к креатинину в моче не введено: для ячейки риска нужны оба результата, и она не показывается |
| `kdigo-evre` | `sevk_egfr30` | KDIGO roʻyxatida, buyrak mutaxassisiga yoʻllash holatlari orasida: KFT 30 dan past | KDIGO рўйхатида, буйрак мутахассисига йўллаш ҳолатлари орасида: КФТ 30 дан паст | В перечне KDIGO среди обстоятельств для направления к специалисту по болезням почек: СКФ менее 30 |
| `kdigo-evre` | `sevk_acr_hematuri` | Nisbat 300 mg/g yoki undan yuqori. KDIGO roʻyxatida bu holat barqaror topilma sifatida va siydikda qon bilan birga koʻrsatilgan: bitta natija buni koʻrsatmaydi | Нисбат 300 мг/г ёки ундан юқори. KDIGO рўйхатида бу ҳолат барқарор топилма сифатида ва сийдикда қон билан бирга кўрсатилган: битта натижа буни кўрсатмайди | Отношение 300 мг/г или выше. В перечне KDIGO это названо как стойкая находка в сочетании с кровью в моче: один результат этого не показывает |
| `kdigo-evre` | `sevk_acr700` | Nisbat 700 mg/g dan yuqori. KDIGO roʻyxatida bu holat barqaror topilma sifatida koʻrsatilgan: bitta natija buni koʻrsatmaydi | Нисбат 700 мг/г дан юқори. KDIGO рўйхатида бу ҳолат барқарор топилма сифатида кўрсатилган: битта натижа буни кўрсатмайди | Отношение выше 700 мг/г. В перечне KDIGO это названо как стойкая находка: один результат этого не показывает |
| `kdigo-evre` | `sevk_dusus20` | KFT oldingi qiymatdan 20 foizdan koʻproq past. KDIGO roʻyxatida 20 foizdan ortiq barqaror pasayish koʻrsatilgan: ikki natija pasayish barqaror ekanini koʻrsatmaydi | КФТ олдинги қийматдан 20 фоиздан кўпроқ паст. KDIGO рўйхатида 20 фоиздан ортиқ барқарор пасайиш кўрсатилган: икки натижа пасайиш барқарор эканини кўрсатмайди | СКФ более чем на 20 % ниже прежнего значения. В перечне KDIGO названо устойчивое снижение более чем на 20 %: два результата не показывают, что снижение устойчиво |
| `pasi` | `aciklama` | Psoriaz maydoni va ogʻirligi indeksi. Toʻrt soha; har birida eritema, induratsiya va qipiqlanish (0–4) hamda maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Indeks har bir soha toʻliq kiritilganda chiqadi: maydon bali va, maydon 0 boʻlmasa, uchta belgi. Vosita ballni koʻrsatadi va ogʻirlik darajasini nomlamaydi. | Псориаз майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида эритема, индурация ва қипиқланиш (0–4) ҳамда майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Индекс ҳар бир соҳа тўлиқ киритилганда чиқади: майдон бали ва, майдон 0 бўлмаса, учта белги. Восита баллни кўрсатади ва оғирлик даражасини номламайди. | Индекс площади и тяжести псориаза. Четыре области; в каждой эритема, инфильтрация и шелушение (0–4) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Индекс появляется, когда каждая область заполнена: балл площади и, если площадь не 0, три признака. Инструмент показывает балл и не называет степень тяжести. |
| `easi` | `aciklama` | Ekzema maydoni va ogʻirligi indeksi. Toʻrt soha; har birida toʻrt belgi (0–3) va maydon bali (0 — zararlanmagan, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Har bir sohaning vazn koeffitsiyenti bemorning yoshiga bogʻliq: 8 yoshgacha yoki 8 yosh va undan katta. Indeks yosh tanlanganda va har bir soha toʻliq kiritilganda chiqadi: maydon bali va, maydon 0 boʻlmasa, toʻrtta belgi. | Экзема майдони ва оғирлиги индекси. Тўрт соҳа; ҳар бирида тўрт белги (0–3) ва майдон бали (0 — зарарланмаган, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Ҳар бир соҳанинг вазн коэффитсиенти беморнинг ёшига боғлиқ: 8 ёшгача ёки 8 ёш ва ундан катта. Индекс ёш танланганда ва ҳар бир соҳа тўлиқ киритилганда чиқади: майдон бали ва, майдон 0 бўлмаса, тўртта белги. | Индекс площади и тяжести экземы. Четыре области; в каждой четыре признака (0–3) и балл площади (0 — нет поражения, 1 — 1–9 %, 2 — 10–29 %, 3 — 30–49 %, 4 — 50–69 %, 5 — 70–89 %, 6 — 90–100 %). Весовой коэффициент каждой области зависит от возраста пациента: до 8 лет либо 8 лет и старше. Индекс появляется, когда выбран возраст и каждая область заполнена: балл площади и, если площадь не 0, четыре признака. |
| `easi` | `yas` | Bemorning yoshi | Беморнинг ёши | Возраст пациента |
| `easi` | `yedi_ve_alti` | 8 yoshgacha | 8 ёшгача | До 8 лет |
| `easi` | `sekiz_ve_ustu` | 8 yosh va undan katta | 8 ёш ва ундан катта | 8 лет и старше |
| `easi` | `temiz` | Toza (0) | Тоза (0) | Чисто (0) |
| `easi` | `neredeyse_temiz` | Deyarli toza (0,1–1,0) | Деярли тоза (0,1–1,0) | Почти чисто (0,1–1,0) |
| `easi` | `hafif` | Yengil (1,1–7,0) | Енгил (1,1–7,0) | Лёгкая степень (1,1–7,0) |
| `easi` | `orta` | Oʻrtacha (7,1–21,0) | Ўртача (7,1–21,0) | Средняя степень (7,1–21,0) |
| `easi` | `siddetli` | Ogʻir (21,1–50,0) | Оғир (21,1–50,0) | Тяжёлая степень (21,1–50,0) |
| `easi` | `cok_siddetli` | Juda ogʻir (50,1–72,0) | Жуда оғир (50,1–72,0) | Очень тяжёлая степень (50,1–72,0) |
| `scorad` | `aciklama` | Atopik dermatit ogʻirligi: A — zararlangan yuza foizi, B — olti belgining intensivligi (0–3), C — qichishish va uyqu buzilishi (0–10). Hisob: A ning beshdan biri, B ning uch yarim barobari va C yigʻindisi. Indeks barcha maydonlar toʻldirilganda chiqadi. | Атопик дерматит оғирлиги: A — зарарланган юза фоизи, B — олти белгининг интенсивлиги (0–3), C — қичишиш ва уйқу бузилиши (0–10). Ҳисоб: A нинг бешдан бири, B нинг уч ярим баробари ва C йиғиндиси. Индекс барча майдонлар тўлдирилганда чиқади. | Тяжесть атопического дерматита: A — процент поражённой поверхности, B — интенсивность шести признаков (0–3), C — зуд и нарушение сна (0–10). Расчёт: пятая часть A, B, умноженное на три с половиной, и C в сумме. Индекс появляется, когда заполнены все поля. |
| `scorad` | `hafif` | Yengil (25 dan past) | Енгил (25 дан паст) | Лёгкая степень (менее 25) |
| `scorad` | `orta` | Oʻrtacha (25–50) | Ўртача (25–50) | Средняя степень (25–50) |
| `scorad` | `siddetli` | Ogʻir (50 dan yuqori) | Оғир (50 дан юқори) | Тяжёлая степень (более 50) |
| `antibiyotik-sure` | `aciklama` | Boshlangan sana va kunlar sonidan kursning oxirgi kuni va nazorat sanasi hisoblanadi. Boshlangan sana 1-kun deb olinadi. Dori, doza va tavsiya etiladigan muddat yozilmaydi. | Бошланган сана ва кунлар сонидан курснинг охирги куни ва назорат санаси ҳисобланади. Бошланган сана 1-кун деб олинади. Дори, доза ва тавсия этиладиган муддат ёзилмайди. | По дате начала и числу дней рассчитываются последний день курса и дата контроля. Дата начала считается первым днём. Препарат, доза и рекомендуемая длительность не указываются. |
| `antibiyotik-sure` | `bitis` | Kursning oxirgi kuni | Курснинг охирги куни | Последний день курса |
| `odyometri-pta` | `kulak_farki` | Ikkinchi quloqdan farq | Иккинчи қулоқдан фарқ | Разница со вторым ухом |
| `odyometri-pta` | `normal` | Meʼyor (15 dB gacha) | Меъёр (15 дБ гача) | Норма (до 15 дБ) |
| `odyometri-pta` | `hafifce` | Juda yengil darajadagi eshitish pasayishi (16–25 dB) | Жуда енгил даражадаги эшитиш пасайиши (16–25 дБ) | Незначительное снижение слуха (16–25 дБ) |
| `odyometri-pta` | `asimetri` | Ikki quloqning oʻrtacha boʻsagʻalari orasidagi farq 15 dB dan koʻp | Икки қулоқнинг ўртача бўсағалари орасидаги фарқ 15 дБ дан кўп | Разница между средними порогами двух ушей более 15 дБ |
| `vertigo-notu` | `santral_uzuv` | Markaziy belgi: qoʻl yoki oyoqda kuchsizlik yoki sezgi oʻzgarishi | Марказий белги: қўл ёки оёқда кучсизлик ёки сезги ўзгариши | Центральный признак: слабость или изменение чувствительности в руке или ноге |
| `vertigo-notu` | `santral_koordinasyon` | Markaziy belgi: qoʻl yoki oyoq harakatlari muvofiqlashuvining buzilishi (dismetriya) | Марказий белги: қўл ёки оёқ ҳаракатлари мувофиқлашувининг бузилиши (дисметрия) | Центральный признак: нарушение координации движений конечности (дисметрия) |
| `vertigo-notu` | `santral_boyun_agrisi` | Markaziy belgi: kuchli boʻyin ogʻrigʻi | Марказий белги: кучли бўйин оғриғи | Центральный признак: выраженная боль в шее |
| `kdigo-serit` | `aciklama` | KFT toifasi (G1–G5), albuminuriya toifasi (A1–A3) va, ikkala natija kiritilganda, xavf katagi. Davolash rejasi va kuzatuv muddati yozilmaydi. | КФТ тоифаси (G1–G5), альбуминурия тоифаси (A1–A3) ва, иккала натижа киритилганда, хавф катаги. Даволаш режаси ва кузатув муддати ёзилмайди. | Категория СКФ (G1–G5), категория альбуминурии (A1–A3) и, когда введены оба результата, ячейка риска. План лечения и сроки наблюдения не указываются. |
| `kdigo-serit` | `uacr` | Siydikda albumin va kreatinin nisbati (usiz xavf katagi koʻrsatilmaydi) | Сийдикда альбумин ва креатинин нисбати (усиз хавф катаги кўрсатилмайди) | Отношение альбумина к креатинину в моче (без него ячейка риска не показывается) |
| `vas-fonksiyon` | `aciklama` | Ogʻriq 0 dan 10 gacha va toʻrtta funksiya bandi 0 dan 4 gacha (0 — qiyinchiliksiz, 4 — bajara olmaydi). Vosita ikki koʻrsatkichni koʻrsatadi va darajani nomlamaydi. | Оғриқ 0 дан 10 гача ва тўртта функция банди 0 дан 4 гача (0 — қийинчиликсиз, 4 — бажара олмайди). Восита икки кўрсаткични кўрсатади ва даражани номламайди. | Боль от 0 до 10 и четыре пункта функции от 0 до 4 (0 — без затруднений, 4 — не может выполнить). Инструмент показывает два показателя и не называет степень. |
| `hedef-boy` | `aciklama` | Ota va ona boʻyidan bolaning taxminiy yakuniy boʻyi hisoblanadi. Bu taxmin, kafolat emas. | Ота ва она бўйидан боланинг тахминий якуний бўйи ҳисобланади. Бу тахмин, кафолат эмас. | По росту отца и матери рассчитывается ориентировочный конечный рост ребёнка. Это оценка, а не гарантия. |
| `doz-hesabi` | `aciklama` | SIZ kiritgan sonlar boʻyicha hisob: vazn, bir kilogrammga milligramm, kuniga necha marta; konsentratsiya kiritilsa — bir martalik hajm. Hajm yaxlitlanmaydi. Vosita hech qanday dori, tavsiya etilgan doza yoki chegara bilmaydi. | СИЗ киритган сонлар бўйича ҳисоб: вазн, бир килограммга миллиграмм, кунига неча марта; консентрация киритилса — бир марталик ҳажм. Ҳажм яхлитланмайди. Восита ҳеч қандай дори, тавсия этилган доза ёки чегара билмайди. | Расчёт по числам, которые ввели ВЫ: масса тела, миллиграммы на килограмм, число приёмов в сутки; если указана концентрация — объём на приём. Объём не округляется. Инструмент не знает ни препаратов, ни рекомендуемых доз, ни пределов. |
| `doz-hesabi` | `ml_yuvarlanmadi` | Hajm hisob natijasi boʻlib, hech qanday oʻlchov asbobiga moslab yaxlitlanmagan: asbobingiz uni oʻlchay olishini tekshiring | Ҳажм ҳисоб натижаси бўлиб, ҳеч қандай ўлчов асбобига мослаб яхлитланмаган: асбобингиз уни ўлчай олишини текширинг | Объём — результат расчёта; он не округлён под какое-либо мерное устройство: проверьте, что ваше устройство может его отмерить |
| `doz-hesabi` | `ml_kucuk` | Bir martalik hajm 1 ml dan kam: kichik hajm uchun yetarlicha mayda boʻlinmali asbob kerak | Бир марталик ҳажм 1 мл дан кам: кичик ҳажм учун етарлича майда бўлинмали асбоб керак | Объём на приём меньше 1 мл: для малого объёма нужно устройство с достаточно мелкими делениями |
| `rtp-basamak` | `ad` | Sportga qaytish: shikastlanishdan keyingi kunlar | Спортга қайтиш: шикастланишдан кейинги кунлар | Возвращение в спорт: дни после травмы |
| `rtp-basamak` | `aciklama` | Shikastlanish sanasidan boshlab oʻtgan kunlar soni hisoblanadi. Bu mamlakat uchun sportga qaytish bosqichlari belgilanmagan, shuning uchun vosita bosqich koʻrsatmaydi va muddat taklif qilmaydi. | Шикастланиш санасидан бошлаб ўтган кунлар сони ҳисобланади. Бу мамлакат учун спортга қайтиш босқичлари белгиланмаган, шунинг учун восита босқич кўрсатмайди ва муддат таклиф қилмайди. | Рассчитывается число дней, прошедших с даты травмы. Этапы возвращения в спорт для этой страны не заданы, поэтому инструмент не показывает этап и не предлагает сроков. |
| `rtp-basamak` | `yaralanma` | Shikastlanish sanasi | Шикастланиш санаси | Дата травмы |
| `rtp-basamak` | `gun` | Shikastlanishdan keyin oʻtgan kunlar (shikastlanish kuni 0-kun hisoblanadi) | Шикастланишдан кейин ўтган кунлар (шикастланиш куни 0-кун ҳисобланади) | Дней после травмы (день травмы считается днём 0) |
| `rtp-basamak` | `basamak_tanimsiz` | Bu mamlakat uchun sportga qaytish bosqichlari belgilanmagan: faqat shikastlanishdan keyin oʻtgan kunlar koʻrsatiladi | Бу мамлакат учун спортга қайтиш босқичлари белгиланмаган: фақат шикастланишдан кейин ўтган кунлар кўрсатилади | Этапы возвращения в спорт для этой страны не заданы: показываются только дни после травмы |
| `rtp-basamak` | `erken` | Bugun bu bosqichning eng erta kunidan oldin | Бугун бу босқичнинг энг эрта кунидан олдин | Сегодня раньше самого раннего дня этого этапа |
| `rtp-basamak` | `en_erken` | Bu bosqichning eng erta kuni | Бу босқичнинг энг эрта куни | Самый ранний день этого этапа |
| `rtp-basamak` | `not` | Sportga qaytish qarori shifokorniki. | Спортга қайтиш қарори шифокорники. | Решение о возвращении в спорт принимает врач. |
| `sakatlik-gunlugu` | `aciklama` | Shikastlanish sohasi, mexanizmi, ogʻirligi va holati; oxirgi yetti kun va oldingi haftalik oʻrtacha yuklama daqiqalaridan ularning nisbati hisoblanadi. Keltirilgan maqolada yuklama zoʻriqish darajasi va daqiqalar koʻpaytmasi sifatida oʻlchanadi; bu nisbat faqat daqiqalar boʻyicha hisoblanadi. | Шикастланиш соҳаси, механизми, оғирлиги ва ҳолати; охирги етти кун ва олдинги ҳафталик ўртача юклама дақиқаларидан уларнинг нисбати ҳисобланади. Келтирилган мақолада юклама зўриқиш даражаси ва дақиқалар кўпайтмаси сифатида ўлчанади; бу нисбат фақат дақиқалар бўйича ҳисобланади. | Область, механизм, тяжесть и состояние травмы; по минутам нагрузки за последние семь дней и прежнему недельному среднему рассчитывается их отношение. В цитируемой статье нагрузка измеряется как произведение усилия на минуты; это отношение считается только по минутам. |
| `sakatlik-gunlugu` | `yuklenme_yuksek` | Yuklama nisbati 1,5 va undan yuqori: keltirilgan maqolada bu oraliq «xavfli zona» deb atalgan | Юклама нисбати 1,5 ва ундан юқори: келтирилган мақолада бу оралиқ «хавфли зона» деб аталган | Отношение нагрузок 1,5 и выше: в цитируемой статье этот диапазон назван «опасной зоной» |
| `sakatlik-gunlugu` | `yuklenme_dikkat` | Yuklama nisbati 1,3 dan yuqori: keltirilgan maqolada maqbul deb atalgan oraliqdan (0,8–1,3) yuqori | Юклама нисбати 1,3 дан юқори: келтирилган мақолада мақбул деб аталган оралиқдан (0,8–1,3) юқори | Отношение нагрузок выше 1,3: выше диапазона, который в цитируемой статье назван оптимальным (0,8–1,3) |
