# Medicines research — United States (`us`)

Research only. Nothing in the product was changed: no code, no pack file, no medicine slot. The United States version of Notya still has no medicine content and the slots stay switched off. This document and the two CSV files beside it are for the owner to decide from.

- Read on: 9–10 October 2026.
- Files: `docs/medicines/us-most-prescribed.csv` (571 rows in three labelled blocks) and `docs/medicines/us-brand-generic-sample.csv` (372 rows).
- **No dosing, indication, interaction, warning or prescribing advice is written anywhere in these files.** Only names, the form of the name a source uses, ranks, and counts that the source table itself prints.

## How this was read, and its limits

1. Every medicine name in the CSV files was copied from a page fetched in this session. Nothing was added, completed, corrected or reordered from memory.
2. Only `raw.githubusercontent.com` could be downloaded as raw bytes from this environment. Every other site was read through a web-fetch tool that returns extracted text. Quotations below are therefore "as returned by the fetch tool" and should be re-read on the page itself before anyone relies on them legally.
3. Part-way through, the fetch tool began refusing every request with HTTP 429 (rate limited) and its instruction was not to retry. Eight requests were lost that way. They are listed under "Could not verify", and the sections they would have fed (mainly e-prescribing, the Part D formulary rules and the naming regulation) say so in place.
4. Direct downloads from `fda.gov`, `accessdata.fda.gov`, `nlm.nih.gov`, `cms.gov`, `ahrq.gov`, `va.gov` and `usdoj.gov` are blocked by this environment's network policy (HTTP 403 on connect). No data file from those hosts was downloaded, so sizes are stated only where a page printed them.

---

## 1. Most commonly prescribed medicines

### What exists

| Source | Status | What it counts | Latest year | Could it be read here? |
|---|---|---|---|---|
| AHRQ Medical Expenditure Panel Survey, Household Component (MEPS-HC), "Prescribed Drugs" summary table — [datatools.ahrq.gov/meps-hc](https://datatools.ahrq.gov/meps-hc?tab=prescribed-drugs&dash=18) | Official (Agency for Healthcare Research and Quality) | "Total purchases", "total expenditures" and "the number of persons with purchases", per generic drug name. The page says "For *prescription medicines,* an event is defined as a purchase or refill." | Not stated on the page | The page text, yes. The table itself is a Tableau application ([dataviz.ahrq.gov/views/MEPS-HC_Drugs_AHRQDTPDM_v2_1/DataDB](https://dataviz.ahrq.gov/views/MEPS-HC_Drugs_AHRQDTPDM_v2_1/DataDB)) and returned no content. It has a "Download Data" button (Excel) that needs a browser. |
| The same AHRQ table, machine-readable copy in AHRQ's own repository — [HHS-AHRQ/MEPS-summary-tables](https://github.com/HHS-AHRQ/MEPS-summary-tables), file [`totEVT__RXDRGNAM__ind__.json`](https://raw.githubusercontent.com/HHS-AHRQ/MEPS-summary-tables/master/mepstrends/hc_pmed/json/data/totEVT__RXDRGNAM__ind__.json) | Official | Caption in the file: "Total purchases in thousands (standard errors) by prescribed drug, United States" | **2018** (columns 1996–2018) | Yes, as raw bytes. 461 drug rows, 221 with a 2018 value. |
| ClinCalc DrugStats, "The Top 300 of 2024" — [clincalc.com/DrugStats/Top300Drugs.aspx](https://clincalc.com/DrugStats/Top300Drugs.aspx) | **SECONDARY** — a private compilation derived from the AHRQ MEPS Prescribed Medicines file | Columns "Total Prescriptions (2024)" and "Total Patients (2024)", one row per active ingredient or fixed combination | **2024** | Yes (300 ranks). Read twice before the rate limit. |
| CMS "Medicare Part D Spending by Drug" — [catalog entry](https://catalog.data.gov/dataset/medicare-part-d-spending-by-drug-401d2), [data API](https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?size=3) | Official (Centers for Medicare & Medicaid Services), **one programme only** | `Tot_Clms_<year>` (Part D claims) per brand-name line and manufacturer, with spending and beneficiary counts | **2024** (the API returns 2020–2024 columns) | Yes, through the API, sorted by `Tot_Clms_2024`. Ranks 1–100 were taken. |
| CMS/Medicaid "State Drug Utilization Data" — [medicaid.gov](https://www.medicaid.gov/medicaid/prescription-drugs/state-drug-utilization-data) | Official, one programme only | "reported by states since the start of the Medicaid Drug Rebate Program" for covered outpatient drugs paid for by state Medicaid agencies | Not stated | Page text only; the datasets on [data.medicaid.gov](https://data.medicaid.gov/) were not read. |

### Which list is the main one, and why it is the secondary one

The official general-outpatient table (AHRQ) exists, but the only copy of it that could be read here stops at **2018**. A 2018 list would mislead a 2026 product decision, so the working list is the **SECONDARY** ClinCalc ranking for **2024**, which is derived from the same AHRQ survey. The official 2018 table and the official 2024 Medicare ranking are given beside it as separate blocks so the owner can see where they agree. The three blocks count different things and are **not** spliced into one numbered list.

`us-most-prescribed.csv` holds:

| Block | Rows | Source | Counts | Year |
|---|---|---|---|---|
| 1 (main) | ranks 1–250 | SECONDARY — ClinCalc "The Top 300 of 2024", derived from AHRQ MEPS | Estimated total outpatient prescriptions, all payers | 2024 |
| 2 | ranks 1–100 | OFFICIAL — CMS Medicare Part D Spending by Drug, rows where `Mftr_Name` = `Overall` | `Tot_Clms_2024`, Medicare Part D only. Each row is a **brand-name line**, not an ingredient; the source's `Gnrc_Name` is kept in the `what_is_counted` column | 2024 |
| 3 | ranks 1–221 | OFFICIAL — AHRQ MEPS-HC summary table | Total purchases **in thousands**, all payers. AHRQ prints no rank; the rank is the position when the official 2018 column is sorted from largest to smallest | 2018 |

First ten of each block, exactly as each source writes them:

| # | Block 1 — ClinCalc 2024 (SECONDARY) | Block 2 — CMS Part D 2024 (`Brnd_Name`) | Block 3 — AHRQ 2018 |
|---|---|---|---|
| 1 | Atorvastatin | Atorvastatin Calcium | Atorvastatin |
| 2 | Levothyroxine | Amlodipine Besylate | Levothyroxine |
| 3 | Metformin | Levothyroxine Sodium* | Lisinopril |
| 4 | Amlodipine | Gabapentin | Metformin |
| 5 | Lisinopril | Lisinopril | Amlodipine |
| 6 | Albuterol | Losartan Potassium | Metoprolol |
| 7 | Losartan | Metoprolol Succinate | Albuterol |
| 8 | Metoprolol | Rosuvastatin Calcium | Omeprazole |
| 9 | Rosuvastatin | Omeprazole | Losartan |
| 10 | Omeprazole | Pantoprazole Sodium* | Simvastatin |

The asterisks in block 2 and the single asterisk in block 3 (`2,293*`) are the sources' own marks, copied as printed. Their meaning was not found in the text that could be read.

### What each ranking counts, in plain words

- **ClinCalc (block 1).** The page gives the column as "Total Prescriptions (2024)" and says "Prescription data source: Medical Expenditure Panel Survey (MEPS) 2014-2024." It also says "This data release represents survey data from two years prior." The page does not define "prescription". Its [About page](https://clincalc.com/DrugStats/About.aspx) says the data comes from "the annual Medical Expenditure Panel Survey (MEPS)" run by AHRQ, that brand and generic entries are merged under one active ingredient, that the FDA NDC Directory, the FDA Orange Book and NLM RxNorm are used to standardise names, and that some products are under-represented, including "Many over-the-counter products not adjudicated by a third party insurance", vaccinations, multivitamins and herbal products. Because MEPS is a household survey that AHRQ weights to the national population ([AHRQ repository README](https://raw.githubusercontent.com/HHS-AHRQ/MEPS-summary-tables/master/README.md)), these are **survey estimates, not dispensing counts**.
- **CMS Part D (block 2).** People covered by Medicare Part D only. A brand and its generic are separate lines (for example the source has both `Synthroid` and `Levothyroxine Sodium*`, and both `Metformin HCl` and `Metformin HCl ER`). The exact definition of `Tot_Clms` is in the CMS [data dictionary](https://data.cms.gov/resources/medicare-part-d-spending-by-drug-data-dictionary) and [methodology](https://data.cms.gov/resources/medicare-part-d-spending-by-drug-methodology), neither of which could be read.
- **AHRQ (block 3).** The [dashboard notes](https://datatools.ahrq.gov/meps-hc?tab=prescribed-drugs&dash=18) say "Estimates are for prescribed drugs obtained by household members", "The data do not include drugs administered in hospitals or provider offices", and "Prescribed drugs with inadequate precision for all years are not shown."

### How to produce the official, current top 250 where the data can be downloaded

1. Open the AHRQ dashboard in a browser → Prescribed Drugs → by prescribed drug → statistic "total purchases" → latest year → "Download Data" (Excel). Sort by total purchases. Or:
2. Download the MEPS Prescribed Medicines public-use file for the latest year from [meps.ahrq.gov](https://meps.ahrq.gov/mepsweb/data_stats/download_data_files.jsp) and repeat AHRQ's own calculation, which is published in [`build_hc_tables/run_pmed.R`](https://raw.githubusercontent.com/HHS-AHRQ/MEPS-summary-tables/master/build_hc_tables/run_pmed.R): a weighted total of purchase records by the variable `RXDRGNAM`, excluding records whose drug name or NDC is coded missing. That gives an official-data ranking of any length.

---

## 2. The country's "pharmacy lists"

There is no single national formulary among the sources read: reimbursement lists are per payer (each Medicare Part D plan, each state Medicaid programme, the Veterans Health Administration), while the federal government publishes registers of what is approved and marketed.

| List | Publisher | What it contains | How it is obtained and updated | Reuse terms found |
|---|---|---|---|---|
| **National Drug Code (NDC) Directory** — [fda.gov page](https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory), [openFDA API](https://open.fda.gov/apis/drug/ndc/) | FDA, Center for Drug Evaluation and Research | "active and certified finished and unfinished drugs" submitted in structured product labeling files: prescription and OTC, approved and unapproved, repackaged and relabeled. A record read here carried `product_ndc`, `generic_name`, `brand_name`, `labeler_name`, `active_ingredients` (name + strength), `dosage_form`, `route`, `product_type`, `marketing_category`, `application_number`, `packaging` (package NDC + description), `pharm_class`, and under `openfda` the `rxcui`, `spl_set_id`, `upc`, `unii`, `manufacturer_name`, `is_original_packager`. 138,234 records in the API on the day read; by product type: HUMAN OTC DRUG 56,914; HUMAN PRESCRIPTION DRUG 56,799; BULK INGREDIENT 15,780; DRUG FOR FURTHER PROCESSING 5,729; others smaller ([count query](https://api.fda.gov/drug/ndc.json?count=product_type.exact)). | "updated daily". Zip downloads: [text](https://www.accessdata.fda.gov/cder/ndctext.zip), [Excel](https://www.accessdata.fda.gov/cder/ndcxls.zip), plus unfinished, compounded and excluded files. Page current as of 03/04/2026. | FDA [website policy](https://www.fda.gov/about-fda/about-website/website-policies): "Unless otherwise noted, the contents of the FDA website (www.fda.gov) — both text and graphics — are not copyrighted." and "They are in the public domain and may be republished, reprinted and otherwise used freely". openFDA [terms](https://open.fda.gov/terms/): "Unless otherwise noted, the content, data, documentation, code, and related materials on openFDA is public domain." Disclaimers on the directory page: "Inclusion in the NDC Directory does not indicate that FDA has verified the information provided." and "Assignment of an NDC number does not in any way denote FDA approval of the product." |
| **Orange Book** (Approved Drug Products with Therapeutic Equivalence Evaluations) — [data files page](https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files) | FDA | Approved drug products. `products.txt` fields: Ingredient, Dosage form; Route of Administration, Trade Name, Applicant, Strength, New Drug Application Type, NDA Number, Product Number, TE Code, Approval Date, RLD, RS, Type ("Format is RX, OTC, DISCN."), Applicant Full Name. | One zip ([download](https://www.fda.gov/media/76860/download?attachment)); "All three files are in ASCII text, tilde (~) delimited format." The page does not state the file's update cycle; it says the openFDA Orange Book API is "updated monthly". Page current as of 08/18/2026. | Same FDA public-domain statement as above. |
| **DailyMed** — [about](https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm), [label downloads](https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm) | National Library of Medicine (NLM), NIH | "labeling, submitted to the Food and Drug Administration (FDA) by companies" — the most recent labeling "currently in use". | Full releases as zip files: human prescription labels in 6 parts (five of 3.00 GB and one of 1.69 GB), human OTC labels in 12 parts (eleven of about 3 GB and one of 8.83 MB), plus daily, weekly and monthly update files, from `https://dailymed-data.nlm.nih.gov/public-release-files/`. | The page carries only a link to the NLM copyright policy. See section B for the terms that bear on reproducing label text. Disclaimers: "The contents of the "in use" labeling on DailyMed may not have been verified by FDA." and "NLM does not review any SPL content prior to publication." |
| **RxNorm** — [overview](https://www.nlm.nih.gov/research/umls/rxnorm/overview.html), [files](https://www.nlm.nih.gov/research/umls/rxnorm/docs/rxnormfiles.html), [terms](https://www.nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html), [RxNav API](https://rxnav.nlm.nih.gov/REST/drugs.json?name=atorvastatin) | NLM | "RxNorm provides normalized names and unique identifiers for medicines and drugs." A normalised generic name "consists of the ingredient, strength, and dose form (in that order)"; brand names are a separate term type. It links the vocabularies of other sources, listed in section 6. | "The full RxNorm data set is released on the first Monday of each month", with weekly updates on Wednesdays. Latest release listed: 5 October 2026. "RxNorm files are pipe-delimited text files in Rich Release Format (RRF)". Two packages: the full release and the "Current Prescribable Content" release. | RxNorm's own names and codes: "is in the public domain as it is created by the U.S. government." and "Public domain information may be freely distributed and copied within and outside the U.S.,". But "A free UMLS license is required to download the full RxNorm monthly and weekly releases." and the full set "includes proprietary data from various terminology providers". The prescribable-content package is marked "(no license required)". Attribution asked for: "This product uses publicly available data courtesy of the U.S. National Library of Medicine (NLM), National Institutes of Health, Department of Health and Human Services; NLM is not responsible for the product and does not endorse or recommend this or any other product." Also: "Developers may not use the NLM name and/or logo in conjunction with their applications." |
| **VA National Formulary** — [pbm.va.gov](https://www.pbm.va.gov/nationalformulary.asp), [Formulary Advisor](https://www.va.gov/formularyadvisor/) | U.S. Department of Veterans Affairs, Pharmacy Benefits Management Services | The formulary of the veterans' health system. Files listed: "VA National Formulary September 2026" ([xlsx](https://www.pbm.va.gov/PBM/nationalformulary/VA_National_Formulary_SEPT_2026.xlsx)), a changes file, an Urgent/Emergent formulary, "VA Class Index", "VA Product Name List" (updated October 2026), "VA National Drug File Extract with NDC" ([csv](https://www.pbm.va.gov/PBM/nationalformulary/PharmacyProductSystem_NationalDrugCodeExtract.csv)), "National Products with Copay Tier List" (csv), and monthly decision newsletters. | Excel and CSV downloads; the file names are monthly; page last updated October 8, 2026. | No reuse statement on the page. It links a document titled "Copying PBM-MAP Documents" that was not read. |
| **Medicare Part D plan formularies** — [dataset page](https://data.cms.gov/provider-summary-by-type-of-service/medicare-part-d-prescribers/monthly-prescription-drug-plan-formulary-and-pharmacy-network-information), [formulary guidance](https://www.cms.gov/medicare/coverage/prescription-drug-coverage-contracting/formulary-guidance) | CMS; each plan sponsor builds its own formulary | **Not read** (the dataset page needs JavaScript; the guidance page was refused by the rate limit). From the task brief, to be confirmed: monthly plan-formulary data files and the rules plans must follow. | Not read. | The catalog entry for the sister Part D dataset gives its licence as `https://www.usa.gov/government-works`; the formulary files' own terms were not read. |
| **State Medicaid preferred drug lists** | Each state's Medicaid agency | **Not found on a federal page.** The federal [state prescription drug resources page](https://www.medicaid.gov/medicaid/prescription-drugs/state-prescription-drug-resources) (last updated September 15, 2026) does not mention preferred drug lists or link to any; it covers reimbursement methodologies. | Per state; not verified. | Not verified. |
| **Medicaid State Drug Utilization Data** — [medicaid.gov](https://www.medicaid.gov/medicaid/prescription-drugs/state-drug-utilization-data) | CMS | Utilisation "reported by states since the start of the Medicaid Drug Rebate Program". | Datasets on data.medicaid.gov (not read). Page last updated September 23, 2026. | Not read. |
| **MEPS summary tables** (the source of the usage ranking) — [repository README](https://raw.githubusercontent.com/HHS-AHRQ/MEPS-summary-tables/master/README.md) | AHRQ | See section 1. | See section 1. | "This application is in the public domain and may be used, reproduced, modified, built upon and distributed in the United States without further permission from AHRQ. Reproduction and distribution for a fee is prohibited. It is requested that in any subsequent use AHRQ be given appropriate acknowledgment." And: "AHRQ reserves the right to assert copyright protection internationally." Drug names in MEPS come from a commercial vocabulary: "Data source for generic drug name is Cerner Multum Inc." |
| **ClinCalc DrugStats** (SECONDARY) — [Top 300](https://clincalc.com/DrugStats/Top300Drugs.aspx), [About](https://clincalc.com/DrugStats/About.aspx) | ClinCalc LLC (private) | See section 1. | Annual. | The ranking page says "All ClinCalc DrugStats figures and graphs on this page are licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)." The About page shows "©2026 - ClinCalc LLC. All rights reserved." and the citation "Kane SP. About the ClinCalc DrugStats Database, Version 2026.08." Whether the table of names and counts is covered by the CC licence is not stated; share-alike terms matter for a commercial product. |

---

## 3. How medicines are classified for supply

A classification scheme only.

**Prescription versus over-the-counter.** FDA's [question-and-answer page](https://www.fda.gov/drugs/frequently-asked-questions-popular-topics/prescription-drugs-and-over-counter-otc-drugs-questions-and-answers) (content current as of 11/13/2017) describes prescription drugs as "Prescribed by a doctor", "Bought at a pharmacy", "Prescribed for and intended to be used by one person" and "Regulated by FDA through the New Drug Application (NDA) process."; and OTC drugs as "Drugs that do NOT require a doctor's prescription", "Bought off-the-shelf in stores" and "Regulated by FDA through OTC Drug monographs."

In the registers this appears as a field:
- NDC Directory `product_type`: `HUMAN PRESCRIPTION DRUG` or `HUMAN OTC DRUG` ([counts](https://api.fda.gov/drug/ndc.json?count=product_type.exact)).
- Orange Book `Type`: "Format is RX, OTC, DISCN." ([data files page](https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files)).

**Controlled substances.** The Drug Enforcement Administration's [drug scheduling page](https://www.dea.gov/drug-information/drug-scheduling) places controlled substances in five schedules under the Controlled Substances Act:

| Schedule | DEA's wording |
|---|---|
| I | "with no currently accepted medical use and a high potential for abuse" |
| II | "a high potential for abuse, with use potentially leading to severe psychological or physical dependence" |
| III | "a moderate to low potential for physical and psychological dependence" |
| IV | "a low potential for abuse and low risk of dependence" |
| V | "lower potential for abuse than Schedule IV and consist of preparations containing limited quantities of certain narcotics" |

DEA publishes alphabetical lists and notes they are "not comprehensive listings of all controlled substances." The NDC Directory carries the schedule per product in a `dea_schedule` field with the values CII (2,241 records), CIV (2,167), CIII (969), CV (946) and CI (12) on the day read ([count query](https://api.fda.gov/drug/ndc.json?count=dea_schedule)). State-level rules on top of the federal schedules were not researched.

---

## 4. Naming

What the sources read here show:

- **The US nonproprietary naming body.** The American Medical Association's [USAN page](https://www.ama-assn.org/about/united-states-adopted-names) says "The U.S. Adopted Names Council is responsible for developing simple, informative generic drug names." The regulation that makes such a name the "established name" on a label (21 CFR 299.4) could **not** be read — the request was refused by the rate limit.
- **Three levels of the same generic name are in use at once.** For one product the FDA register gave the generic name "atorvastatin calcium" and the active ingredient "ATORVASTATIN CALCIUM TRIHYDRATE" ([NDC record](https://api.fda.gov/drug/ndc.json?search=brand_name:%22Lipitor%22&limit=1)); RxNorm names the same product "atorvastatin 20 MG Oral Tablet [Lipitor]" ([RxNav](https://rxnav.nlm.nih.gov/REST/drugs.json?name=atorvastatin)); CMS writes "Atorvastatin Calcium" and abbreviates salts ("Metformin HCl", "Citalopram HBr"); AHRQ and ClinCalc drop the salt ("Atorvastatin"). AHRQ explains its own rule: "a component of a drug name such as a salt, chemical or estername is included only if it is important to identify the drug and a physician is likely to use it."
- **Brand and generic are separate fields in every register.** NDC `brand_name` / `generic_name`; Orange Book "Trade Name" / "Ingredient"; CMS `Brnd_Name` / `Gnrc_Name`; RxNorm term types "BN (Brand Name): A proprietary name for a family of products containing a specific active ingredient" and "IN (Ingredient)". RxNorm also has "PSN (Prescribable Name)", a display name for electronic prescribing applications.
- **For a generic product the "brand" field repeats the generic name, in inconsistent capitals.** The NDC Directory's proprietary names for atorvastatin products were "ATORVASTATIN CALCIUM" (156 records), "Atorvastatin Calcium" (142), "Atorvastatin calcium" (66), "atorvastatin calcium" (22), alongside "Lipitor" (4) and "Caduet" (16) ([count query](https://api.fda.gov/drug/ndc.json?search=generic_name:%22atorvastatin%22&count=brand_name.exact&limit=1000)). Any import has to fold these.
- **Combination products are written differently everywhere.** ClinCalc: "Acetaminophen; Hydrocodone". AHRQ: "Acetaminophen-Hydrocodone" ("In a combination drug with two ingredients, the ingredients are separated by a dash"). CMS: "Hydrocodone-Acetaminophen" with generic "Hydrocodone/Acetaminophen". RxNorm: ingredients joined with " / ".
- **Whether a prescription is written by brand or by generic name, and when a pharmacist may substitute**, is set out in the FDA Orange Book preface, which could not be read (rate limit). Not stated here.

**Names in the top list that differ from the international nonproprietary name (INN).** The rule for this section was to flag a difference only where a fetched source shows both names. One case met that bar: the FDA NDC Directory lists bulk-ingredient records whose generic name is written "Albuterol Salbutamol base" and "Albuterol Salbutamol base micro" ([query](https://api.fda.gov/drug/ndc.json?search=generic_name:%22albuterol%22+AND+NOT+brand_name:%22albuterol%22&limit=100)), so the register itself carries two names for the substance ranked 6 as "Albuterol". None of the sources read says which of the two is the WHO INN. No other US-versus-INN difference is asserted, because the lookups that would have shown both names side by side were refused by the rate limit; a full INN comparison of the 250 names is listed under "Could not verify".

---

## 5. Electronic prescribing reality

**No source for this section could be read**: the CMS [electronic prescribing page](https://www.cms.gov/medicare/regulations-guidance/electronic-prescribing) was refused by the rate limit, and the DEA pages on electronic prescriptions for controlled substances were never reached. Nothing below is a claim. These are the questions the owner needs answered before any US prescription feature is designed, and where the answers should sit:

1. Through which network or networks do prescriptions travel from a prescriber's software to a pharmacy, and what does joining cost? (CMS e-prescribing pages; the network operators' own terms.)
2. Which message standard and version must the software speak, and from what date? (CMS e-prescribing standards page.)
3. Must the software be certified, and by whom, before it may transmit? (CMS; the federal health IT certification programme.)
4. What extra requirements apply to electronic prescriptions for controlled substances? (DEA Diversion Control Division and its regulations in title 21 of the Code of Federal Regulations; the exact part was not looked up.)
5. Who may transmit: only the licensed prescriber, or staff acting for them? Does this differ by state?
6. Which drug identifier does the message carry — NDC, RxNorm concept (RXCUI), or both? This decides which register the product's list must be keyed to. (The NDC record read here carries both `product_ndc` and `rxcui`.)
7. Is electronic prescribing mandatory for some payers or some states, with paper allowed as an exception?
8. If Notya only drafts a medication line in the note and never transmits, does any of the above apply? This is the cheapest route and the question to settle first.

---

## 6. What a names list for the product would be

**Right source for a searchable list of names: the FDA NDC Directory, grouped with RxNorm.**

| | NDC Directory | RxNorm (Current Prescribable Content) |
|---|---|---|
| What a row is | One marketed product from one labeler | One normalised concept (ingredient, clinical drug, branded drug, brand name) |
| Name fields exactly as the register gives them | `generic_name`, `brand_name`, `active_ingredients[].name` + `.strength`, `dosage_form`, `route` | Normalised string "ingredient, strength, and dose form (in that order)", with the brand in square brackets for branded drugs |
| Size | 138,234 records on the day read (56,799 human prescription, 56,914 human OTC) | Not stated on the pages read |
| Format | Zip of text or Excel; JSON through openFDA | Zip of pipe-delimited RRF text; JSON through RxNav |
| Update cycle | "updated daily" | Monthly (first Monday) plus weekly updates |
| Licence | FDA public-domain statement; openFDA terms (public domain "unless otherwise noted") | Marked "(no license required)"; NLM attribution sentence requested |

Why both: the NDC Directory has every commercial name, manufacturer, strength, form, route, the prescription/OTC flag and the DEA schedule, but it is written by thousands of labelers in free text (four spellings of one generic name, repackagers listed as if they were manufacturers). RxNorm supplies one clean ingredient name and one clean brand name to group those rows under, and each NDC record already carries its RxNorm identifiers.

**One thing the import must check.** RxNav's unfiltered answer for an ingredient returns every branded concept RxNorm holds, with nothing in the answer saying what kind of product each is. Names such as "[Metacam]", "[RECONCILE]", "[Amoxi-tabs]", "[Salix - substance]" and "[UlcerGard]" (sample file, rows for Meloxicam, Fluoxetine, Amoxicillin, Furosemide and Omeprazole) look to me like products that are not human prescription brands — that is my reading, not something the fetched answer states. What the prescribable-content package includes and excludes is described on an NLM page that was refused by the rate limit, so this has to be checked on the first import, concept by concept, against the NDC Directory's `product_type`.

**What cannot be taken from either: dosing.** Neither register contains dosing, indications, interactions or warnings. Those live in the product labeling:

- **Open sources that hold dosing text, by name:** DailyMed (NLM) structured product labels; the openFDA drug label API (same labels); Drugs@FDA, which DailyMed names as the place for "current FDA-approved labeling". Reuse terms are discussed in section B. Dosing stays switched off in the product regardless.
- **Commercial drug-knowledge sources, by name, for which a licence is needed:** RxNorm lists these proprietary vocabularies among its sources — "Gold Standard Drug Database", "Multum MediSource Lexicon", "Micromedex RED BOOK", "FDB MedKnowledge (formerly NDDF Plus)". The RxNorm terms say "Contact the terminology source data provider directly to discuss uses of a terminology beyond those allowed under the UMLS license agreement and possible costs." Which dosing or interaction modules each vendor sells, and at what price, was not researched.

---

## A. How the Turkish product holds medicines (read-only look at this repository)

The Turkish product has **two separate things**, and they should not be confused.

**A1. The product list that the doctor searches** — `data/sgk-ilaclar.json`, type `IlacKaydi` in `lib/ilac/ilacArama.ts`, served by `app/api/doktor/ilac-ara/route.ts`.

- **8,649 records**, one per reimbursed pack. File header: `"guncelleme":"2026-08-26","kaynak":"SGK EK-4/A","titck":"2026-08-26"`.
- Where it came from, per the repository: `scripts/import-sgk-ilac.mjs` reads SGK's published "Bedeli Ödenecek İlaçlar Listesi (EK-4/A)" spreadsheets; `scripts/import-titck-etken.mjs` then adds active ingredient and ATC from TİTCK's weekly "Ruhsatlı Beşeri Tıbbi Ürünler Listesi", joined by barcode (the script's header records 23.001 products in the 21.08.2026 TİTCK list and a 95% direct barcode match).

| Field | Meaning | Filled in |
|---|---|---|
| `ad` | Full product line as SGK writes it, e.g. `LIPITOR 10 MG 30 FTB` — strength, pack size and form are **inside this text**, not separate fields | 8,649 |
| `marka` | Commercial name, cut from `ad` (the words before the first number or %) | 8,649 (4,713 distinct) |
| `etkenMadde` | Active ingredient, Turkish spelling, from TİTCK | 8,435 (2,369 distinct spellings) |
| `atc` | ATC code, from TİTCK | 8,396 (1,279 distinct) |
| `etkenKaynak` | How the ingredient was matched: `titck` (direct barcode, 8,240) or `esdeger` (inherited from an equivalence group, 195) | 8,435 |
| `barkod` | Pack barcode — the key e-reçete records | 8,648 |
| `kamuNo` | SGK public number | 8,648 |
| `esdegerGrubu` | SGK equivalent-medicine group | 7,548 |
| `sgk` | Reimbursed by SGK (true for every record, because the list *is* the reimbursement list) | 8,649 |
| `ruhsatAskida` | TİTCK licence-suspension code | 62 |
| `form`, `doz` | Declared in the type but **not present in any record** | 0 |

Not in the list: manufacturer, route, pack price, a prescription-status field. Prescription status is computed separately in `lib/doktor/receteRengi.ts` from a short hand-kept list of ingredients (normal / yeşil / kırmızı reçete).

**A2. The clinical safety table** — `lib/asistan/ilac/` (type `TürkishDrug` in `tipler.ts`, entries in `veri/*.ts`, engine in `lib/asistan/turkishDrugs.ts`).

- **176 molecule entries** (counted as `kaynak:` lines across the twelve `veri/` files), written by hand, each naming the document it was read from.
- Fields: `name`, `brand[]`, `dose`, `pediatricDose`, `pediatrik` (structured), `form`, `sgkCovered`, `sgkRestriction`, `category`, `siniflar`, `alerjiSinifi`, `contraindications`, `interactions`, `etkilesimler`, `yasKontrendikasyonAy`, `gebelik`, `emzirme`, `bobrekDozUyarisi`, `karacigerDozUyarisi`, `renkliRecete`, `notes`, `kaynak` (`belge`, `url`, `dogrulama`).
- This is the only place the Turkish product holds dosing text. It is curated per molecule from the regulator's product information, not imported in bulk.

So "the Turkish depth" is: every reimbursed pack with its commercial name, active ingredient, ATC code, barcode, equivalence group and reimbursement flag, searchable by brand or ingredient with typo tolerance — plus a separate, small, hand-verified clinical table.

---

## B. Field by field: which official United States dataset supplies it

| Turkish field | US equivalent | Dataset and field | URL | Format | Licence | Verdict |
|---|---|---|---|---|---|---|
| Active ingredient (`etkenMadde`) | Generic name | NDC Directory `generic_name` and `active_ingredients[].name`; RxNorm ingredient (IN) for one clean spelling | [NDC](https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory), [RxNorm files](https://www.nlm.nih.gov/research/umls/rxnorm/docs/rxnormfiles.html) | zip text / RRF | FDA public domain; RxNorm prescribable "(no license required)" | **Full** |
| Commercial name (`marka`) | Proprietary / brand name | NDC `brand_name` (repeats the generic name for generic products); RxNorm brand name (BN); Orange Book "Trade Name" | as above; [Orange Book](https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files) | as above; `~`-delimited text | FDA public domain | **Full** |
| Manufacturer (not held in Turkey) | Labeler / applicant | NDC `labeler_name`, `openfda.manufacturer_name`, `openfda.is_original_packager`; Orange Book "Applicant Full Name" | as above | as above | FDA public domain | **Full**, with a caveat: repackagers appear as labelers (the sample shows VENTOLIN HFA under five labeler names) |
| Strength (inside `ad` in Turkey) | Strength | NDC `active_ingredients[].strength`; RxNorm clinical-drug name; Orange Book "Strength" | as above | as above | as above | **Full** — a separate field, better than Turkey |
| Form (inside `ad`) | Dosage form | NDC `dosage_form`; RxNorm dose form (DF); Orange Book "Dosage form; Route of Administration" | as above | as above | as above | **Full** |
| Route (not held) | Route | NDC `route` | as above | as above | as above | **Full** |
| ATC code (`atc`) | ATC is not an FDA field | RxNorm lists "ATC — Anatomical Therapeutic Chemical Classification System" among its sources, i.e. in the full release | [RxNorm overview](https://www.nlm.nih.gov/research/umls/rxnorm/overview.html) | RRF | Full release needs "A free UMLS license"; each source has its own restriction level; the ATC owner's terms were not read | **Needs a licence check.** Open local alternatives: NDC `pharm_class` (e.g. "HMG-CoA Reductase Inhibitor [EPC]"), the VA "VA Class Index" |
| Prescription status (`receteRengi`) | Rx / OTC / controlled schedule | NDC `product_type` and `dea_schedule`; Orange Book "Type" | as above | as above | FDA public domain | **Full** |
| Reimbursement (`sgk`) | No national equivalent | Per payer: Medicare Part D plan formulary files (not read); VA National Formulary xlsx; state Medicaid lists (not found centrally) | [VA](https://www.pbm.va.gov/nationalformulary.asp) | xlsx / csv | VA: none stated; others not read | **Empty** for a general product. A single "covered" flag does not exist in the United States |
| Equivalence group (`esdegerGrubu`) | Therapeutic equivalence | Orange Book "TE Code"; RxNorm groups products under one clinical drug | as above | as above | FDA public domain | **Partly** (approved prescription products only) |
| Barcode (`barkod`), public number (`kamuNo`) | Product and pack identifier | NDC `product_ndc`, `packaging[].package_ndc`; `openfda.upc`; RxNorm `rxcui`; `openfda.spl_set_id` (the label) | as above | as above | as above | **Full** |
| Licence suspension (`ruhsatAskida`) | Marketing status | Orange Book "Type" value DISCN; NDC `listing_expiration_date`, `marketing_category` | as above | as above | as above | **Partly** — not the same concept |
| Usage rank (not held in Turkey) | Most-prescribed order | Section 1 | — | — | — | Available as an ordering signal only |
| Dosing text (Turkey: the hand-kept table) | Product labeling | DailyMed SPL; openFDA drug label API | [DailyMed](https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm) | zip of label files, about 17 GB for prescription labels | see below | **Stays off.** See below |

**Fields no open official source supplies:** a national reimbursement flag; ATC without going through the UMLS licence; a curated interaction, allergy-class or pregnancy field of the kind in the Turkish clinical table (label text is prose, not structured fields); price.

**Dosing text — may the FDA label / DailyMed be reproduced inside a product, or only linked?** The terms found, quoted:

- openFDA [terms of service](https://open.fda.gov/terms/): "Unless otherwise noted, the content, data, documentation, code, and related materials on openFDA is public domain." with the exception "Some data on openFDA may not be public domain." and a warning marker on such data: "This data is not in the public domain. Third party copy rights may apply." Credit is requested, not required: "Data provided by the U.S. Food and Drug Administration (<https://open.fda.gov>)". Every API answer also carries the disclaimer "Do not rely on openFDA to make decisions regarding medical care."
- FDA [website policies](https://www.fda.gov/about-fda/about-website/website-policies): contents "are not copyrighted" and "may be republished, reprinted and otherwise used freely"; also "FDA's preference is that people link to the material on the FDA site (rather than copying it to their personal websites)" and, if copied, "FDA strongly recommends that the copied item lists the date that the material was copied".
- NLM [web policies](https://www.nlm.nih.gov/web_policies.html): "Works produced by the U.S. government are not subject to copyright protection in the United States." but content may be "contributed by or licensed from private individuals, companies, or organizations that may be protected by U.S. and international copyright laws.", "a copyright notice is not required by law and therefore not all copyrighted content is necessarily marked in this way.", and "It is your responsibility to determine and satisfy copyright or other use restrictions." The policy does not mention DailyMed or drug labels by name.
- DailyMed [about page](https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm): the labeling is "submitted to the Food and Drug Administration (FDA) by companies", "may not have been verified by FDA", and "NLM does not review any SPL content prior to publication."

Reading of those terms: nothing found forbids reproducing label text, and openFDA's terms treat it as public domain unless marked otherwise. But the text is written by the companies, NLM puts the copyright check on the user, and no page read gives an explicit permission that names label text. **That is a question for a lawyer, not a settled permission.** Until it is answered the safe form is a link from each product to its DailyMed label (the NDC record's `spl_set_id` identifies it), with no label text copied into the product. This is separate from the product decision that dosing stays switched off.

---

## C. Sample of generic and commercial names — `us-brand-generic-sample.csv`

For the first 30 medicines of block 1, every branded product that NLM's RxNorm returned through RxNav, one row per branded product (351 rows), copied as returned. Then 21 rows from the FDA NDC Directory, which are the only ones that carry a manufacturer.

- Columns: `generic_name,commercial_name,manufacturer_if_shown,strength_and_form_if_shown,register_url`.
- RxNorm rows: `generic_name` is the name as in the most-prescribed list; `commercial_name` is the text RxNorm puts in square brackets; `strength_and_form_if_shown` is RxNorm's full name for the branded drug, followed by its RXCUI in parentheses; `manufacturer_if_shown` is empty because RxNorm does not carry a manufacturer.
- Combination products (RxNorm names containing " / ") were left out, because they are different medicines with their own generic name — except rank 15, which is itself a four-salt combination.
- NDC rows: all four fields as the FDA record gives them, including the register's own spelling of the generic name.

Commercial names found per medicine (RxNorm, single-ingredient branded products):

| # | Generic name as in the list | Commercial names RxNorm returned |
|---|---|---|
| 1 | Atorvastatin | Atorvaliq, Lipitor |
| 2 | Levothyroxine | Ermeza, Euthyrox, Levo-T, Levoxyl, Synthroid, Thyquidity, Thyro-Tabs, Thyrocryn, ThyroKare, Tirosint, Unithroid |
| 3 | Metformin | Glucophage, Glumetza, Riomet |
| 4 | Amlodipine | Amodip, Katerzia, Norliqva, Norvasc, Sdamlo |
| 5 | Lisinopril | Prinivil, Qbrelis, Zestril |
| 6 | Albuterol | ProAir, Proventil, Ventolin |
| 7 | Losartan | Arbli, Cozaar |
| 8 | Metoprolol | Kapspargo, Lopressor, Toprol |
| 9 | Rosuvastatin | Crestor, Ezallor |
| 10 | Omeprazole | Gastrobim, Prilosec, Primeguard, UlcerGard |
| 11 | Gabapentin | Gabarone, Gralise, Horizant, Neurontin, Relgaabi |
| 12 | Sertraline | Zoloft |
| 13 | Escitalopram | Lexapro |
| 14 | Semaglutide | Ozempic, Rybelsus, Wegovy |
| 15 | Dextroamphetamine; Dextroamphetamine Saccharate; Amphetamine; Amphetamine Aspartate | Adderall, Mydayis |
| 16 | Pantoprazole | Protonix |
| 17 | Bupropion | Aplenzin, Forfivo, Wellbutrin |
| 18 | Hydrochlorothiazide | Inzirqo |
| 19 | Fluoxetine | Prozac, RECONCILE |
| 20 | Trazodone | Raldesy |
| 21 | Montelukast | Singulair |
| 22 | Amoxicillin | Amoxi Drop, Amoxi-tabs, Biomox, Moxatag, Trimox |
| 23 | Fluticasone | Aller-Flo, Armonair, Arnuity, Beser, Clarispray, Cutivate, Flonase, Flonase Sensimist, Flovent, Fluticare, Nasopro 24, Xhance |
| 24 | Tamsulosin | Flomax |
| 25 | Apixaban | Eliquis |
| 26 | Simvastatin | Flolipid, Zocor |
| 27 | Insulin Glargine | Basaglar, Langlara, Lantus, Rezvoglar, Semglee, Toujeo |
| 28 | Empagliflozin | Jardiance |
| 29 | Furosemide | Disal, Furoscix, Lasix, Salix - substance |
| 30 | Meloxicam | Anjeso, Loxicom, Meloxidyl, Meloxivet, Metacam, Mobic, Ostilox, Qamzova, Qmiiz, Vivlodex, Xifyrm, Zybic |

Limits of the sample, stated plainly:

1. **Manufacturer is shown for two medicines only** (Atorvastatin: one Lipitor record; Albuterol: eleven records). The FDA register was being queried one medicine at a time when the fetch tool started refusing requests; the remaining 28 were not reached. The full NDC file has the manufacturer for every product.
2. Every name RxNorm returned is kept, including the ones questioned in section 6, because the rule was to copy what the dataset shows.
3. For gabapentin the fetch tool reported a count of 19 but listed 18 rows; 18 are in the file.
4. RxNorm's answer does not say whether a product is currently marketed. The NDC Directory, not RxNorm, is the test of what is on the market.

---

## D. Import plan to reach the Turkish depth for the United States

**The datasets are too large to fetch from this environment, and the hosts are blocked here. The import has to run on a machine that can download from `accessdata.fda.gov`, `download.nlm.nih.gov` and `pbm.va.gov`.**

| Step | Dataset | Download | Rough size | Gives |
|---|---|---|---|---|
| 1 | FDA NDC Directory, text version | `https://www.accessdata.fda.gov/cder/ndctext.zip` (daily) | 138,234 product records in the API on the day read; keep `HUMAN PRESCRIPTION DRUG` (56,799) and `HUMAN OTC DRUG` (56,914), drop bulk ingredients and the rest → about **113,700 product records**, more rows at pack level | Generic name, commercial name, labeler, strength, form, route, Rx/OTC, DEA schedule, product and pack NDC, label id |
| 2 | RxNorm Current Prescribable Content | `https://download.nlm.nih.gov/rxnorm/RxNorm_full_prescribe_10052026.zip` (monthly; no licence) | Not stated on the pages read | One clean ingredient name and one clean brand name per product, the grouping "ingredient → brands → strengths and forms", and the RXCUI |
| 3 | Join 1 to 2 | The `openfda.rxcui` list seen on the NDC record through the openFDA API; whether the plain zip file carries it, or the join must come from RxNorm's side, has to be checked on the first import | — | Folds the four spellings of one generic name; lets search work by ingredient or brand, as in Turkey |
| 4 | Usage order | Block 1 of `us-most-prescribed.csv` now; replace with the official AHRQ download when someone can fetch it (section 1) | 250 names | Puts the common medicine first in search results. Not shown to the doctor as a fact |
| 5 (optional) | FDA Orange Book `products.txt` | `https://www.fda.gov/media/76860/download?attachment` | Not stated | Applicant, therapeutic-equivalence code, discontinued flag |
| 6 (optional) | VA National Formulary, VA Class Index | `pbm.va.gov` files in section 2 | Not stated | A formulary flag and class for one payer only |

Fields after the import, against the Turkish record:

- **Full:** generic name, commercial name, strength, form, route, prescription/OTC, controlled schedule, product and pack identifier, manufacturer (with the repackager caveat).
- **Better than Turkey:** strength, form and route are separate fields; manufacturer exists.
- **Empty:** reimbursement (no national list), price.
- **Empty unless licensed:** ATC (through the full RxNorm release under the free UMLS licence, subject to the ATC owner's terms, which were not read). The FDA pharmacologic class in the NDC record is an open stand-in.
- **Empty on purpose:** dosing, interactions, pregnancy and the other clinical fields. Bulk import cannot produce the Turkish clinical table; that table was built by hand from the regulator's product information, molecule by molecule.

Work the import needs beyond downloading: case-folding and de-duplicating names; deciding whether repackager rows are shown; removing non-human entries; grouping packs under a brand, then a brand under an ingredient (the Turkish search already groups by brand); a monthly refresh job.

---

## Recommendation for the owner

**One route:** build the United States list from the **FDA NDC Directory grouped by RxNorm Current Prescribable Content**, order search results by the top-250 list, link each product to its DailyMed label, and leave dosing, interactions and reimbursement empty and off.

- **What it costs in licences:** nothing for the NDC Directory, RxNorm prescribable content or DailyMed links. NLM asks for one attribution sentence and forbids using its name or logo as an endorsement. Do not ship ClinCalc's table as product content: it is a private compilation whose licence wording is unclear for a commercial product. Use it internally as an ordering signal, or replace it with the official AHRQ download.
- **What it costs in effort (an estimate, not a quote):** about a week for one engineer — import script and name clean-up (3 days), join and grouping (1–2 days), wiring the list into the existing search behind the country switch (1–2 days) — plus a small monthly refresh job. It must run where the files can be downloaded.
- **What it does not give:** dosing or any clinical field; a reimbursement flag; ATC codes without a licence check; anything about transmitting prescriptions to pharmacies, which is a separate and much larger decision (section 5).
- **Before building:** (1) a lawyer's answer on reproducing label text, if the owner ever wants more than a link; (2) the e-prescribing questions in section 5, starting with whether Notya drafts only or transmits; (3) a human download of the official AHRQ table so the order signal is official and current.

---

## Checks performed on the CSV files

- **Block 1 (main list).** The ClinCalc page was read a second time, independently, and 18 rows (ranks 1–10, 15, 27, 31, 68, 110, 138, 171, 200) were compared with the CSV character by character on rank, name and prescription count: 18 of 18 identical. A third read, meant to cover ranks 201–250, was refused by the rate limit.
- **Block 1, whole block.** Ranks run 1 to 250 without a gap; the prescription count never increases from one rank to the next; the patient count never exceeds the prescription count; no name appears twice.
- **Block 2.** The first 40 rows were returned identically by two separate API calls; the counts never increase down the 100 rows.
- **Block 3.** Generated by script from the raw AHRQ file; ten rows (ranks 1, 2, 3, 10, 12, 23, 100, 151, 200, 221) were compared with the file's bytes: 10 of 10 identical.

---

## Could not verify

Requests refused by the fetch tool (HTTP 429, rate limited; not retried):

1. `https://api.fda.gov/drug/ndc.json?search=generic_name:"atorvastatin"+AND+product_type:PRESCRIPTION+AND+NOT+brand_name:"atorvastatin"&limit=100` — manufacturer rows for the brand sample. The same query was not attempted for the other 28 medicines.
2. `https://www.cms.gov/medicare/regulations-guidance/electronic-prescribing` — all of section 5.
3. `https://www.fda.gov/drugs/development-approval-process-drugs/orange-book-preface` — brand/generic substitution and how the Orange Book names products.
4. `https://www.law.cornell.edu/cfr/text/21/299.4` — the regulation on established names and USAN.
5. `https://www.nlm.nih.gov/research/umls/rxnorm/docs/prescribe.html` — what the prescribable-content package includes and excludes, and its size.
6. `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=paracetamol&maxEntries=4` — the first of the lookups meant to show US and international names side by side.
7. `https://www.cms.gov/medicare/coverage/prescription-drug-coverage-contracting/formulary-guidance` — Part D formulary rules.
8. `https://clincalc.com/DrugStats/Top300Drugs.aspx` (third read) — an extra row check for ranks 201–250.

Pages that returned nothing usable (they need a browser):

9. The AHRQ Tableau table `https://dataviz.ahrq.gov/views/MEPS-HC_Drugs_AHRQDTPDM_v2_1/DataDB` — the official current-year purchases by drug. This is why the main list is secondary.
10. `https://meps.ahrq.gov/mepstrends/hc_pmed/` — server error.
11. `https://data.cms.gov/summary-statistics-on-use-and-payments/medicare-medicaid-spending-by-drug/medicare-part-d-spending-by-drug` and the Part D monthly formulary dataset page — JavaScript only. The Part D *data* was read through the API instead; the methodology and data dictionary were not.
12. `https://www.va.gov/formularyadvisor/` — loading placeholder only.

Not established:

- The official AHRQ ranking for any year after 2018.
- The exact definition of "prescription" in the ClinCalc table and of `Tot_Clms` in the CMS table; the meaning of the asterisks in the CMS and AHRQ data.
- Whether the ClinCalc CC BY-SA statement covers the table of names and counts.
- Ranks 201–250 of block 1 were read once only. They pass the internal checks (ranks consecutive, counts never increasing, patients never above prescriptions, no repeated name) but were not compared against a second read.
- Record counts and file sizes for RxNorm and the Orange Book.
- The Part D formulary files (contents, format, terms); any state Medicaid preferred drug list; the Medicaid utilisation datasets.
- The licence terms of the ATC classification and of the UMLS licence's source categories.
- The reuse terms of the VA formulary files and of the RxNav API.
- A full comparison of the 250 names with international nonproprietary names.
- State-level controlled-substance and prescribing rules.
- Which commercial drug-knowledge vendors sell dosing content, and at what price.
- The CMS catalog entry for Part D Spending by Drug shows coverage "2022-01-01/2022-12-31" and "Data Last Modified 2024-06-13", while the API returned 2024 columns; the catalog metadata appears to lag and the true release date of the 2024 data was not confirmed.
