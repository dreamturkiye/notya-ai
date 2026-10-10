# United Kingdom (`gb`) — medicines research

Research only, written 2026-10-09 for the owner to decide on. No code and no country-pack file was changed; the product's medicine slots for this country stay empty and switched off. This document contains **no dosing, indications, interactions, warnings or prescribing advice**. It contains medicine names, counts, descriptions of official lists, and licence terms.

Files that belong to this document:

- `docs/medicines/gb-most-prescribed.csv` — the most-prescribed list (10 rows reached out of the 250 asked for; see section 1).
- `docs/medicines/gb-brand-generic-sample.csv` — sample of commercial product names for those 10 medicines (103 rows; see section C).

## How this was researched, and its limits

- Every medicine name below was copied from a page opened in this session, or from the page title of an official page returned by web search in this session. Nothing was added, completed, corrected or reordered from memory.
- Pages were read through a fetching tool that relays page text. Quotations are as that tool relayed them; some are shortened by it. Before relying on a quoted licence clause in a contract, open the linked page.
- This environment cannot download files. Direct downloads are blocked by the organisation's network policy, and the reading tool cannot open `.xlsx` files (and returned the Drug Tariff `.csv` as unreadable binary). That is why the most-prescribed list stops at 10 rows.
- Midway, the reading tool started refusing pages (rate limit, HTTP 429). The pages lost to that are listed under "Could not verify", each with what it was needed for.

Marks used below: **(read)** = the page was opened here. **(title only)** = found by web search, page not opened.

---

## 1. Most commonly prescribed medicines

### Main source — England

**Prescription Cost Analysis (PCA) – England 2025/26**, NHS Business Services Authority (NHSBSA), published 4 June 2026. Accredited official statistics. (read)
- Release page: <https://www.nhsbsa.nhs.uk/statistical-collections/prescription-cost-analysis-england/prescription-cost-analysis-england-202526>
- Statistical summary (the page the list was copied from): <https://nhsbsa-opendata.s3.eu-west-2.amazonaws.com/pca/pca_summary_narrative_2025_26_v001.html>
- Methodology note: <https://nhsbsa-opendata.s3.eu-west-2.amazonaws.com/pca/pca_background_info_methodology_june2026_v001.html>

What is counted: **items**. An item is "A single unit of medication listed separately on a prescription form." The statistics cover items "dispensed in the community in England", on prescriptions "issued by GPs and other authorised prescribers such as nurses, dentists, and allied health professionals". Not counted: "Prescriptions that are issued in hospitals and fulfilled by the hospital pharmacy or dispensary are not included"; the methodology note also excludes prisons and private prescriptions. Total for the year: "There were 1.30 billion items dispensed in the community." (all from the summary and methodology pages above)

The list is by **chemical substance**: "the name of the main active ingredient in a drug", classified by the BNF for drugs. The NHSBSA uses the BNF structure from before edition 70, including "pseudo" chapters 18 to 23 (methodology note). PCA covers "drugs, dressings, appliances, and medical devices", so a longer ranking will contain rows that are not medicines; the owner should decide whether to keep only the medicine chapters.

### The list reached: 10 of 250

The statistical summary publishes the top 10 only (its Table 10). The source table has no rank column; ranks below are the order of the rows in a table captioned as the highest number of items. Names, codes and counts are exactly as the source writes them.

| Rank | Chemical substance name | BNF code | Items |
|---|---|---|---|
| 1 | Atorvastatin | 0212000B0 | 78,042,871 |
| 2 | Amlodipine | 0206020A0 | 41,208,448 |
| 3 | Lansoprazole | 0103050L0 | 37,868,775 |
| 4 | Ramipril | 0205051R0 | 36,339,463 |
| 5 | Omeprazole | 0103050P0 | 35,562,793 |
| 6 | Levothyroxine sodium | 0602010V0 | 34,992,603 |
| 7 | Bisoprolol fumarate | 0204000H0 | 31,266,076 |
| 8 | Colecalciferol | 0906040G0 | 29,221,677 |
| 9 | Metformin hydrochloride | 0601022B0 | 27,395,015 |
| 10 | Sertraline hydrochloride | 0403030Q0 | 25,770,008 |

Source: <https://nhsbsa-opendata.s3.eu-west-2.amazonaws.com/pca/pca_summary_narrative_2025_26_v001.html>, data year 2025/26 (April 2025 to March 2026). One oddity in the source: the caption of Table 10 says "In England in 2024/25"; the figure caption above it and the sentence below it ("In England in 2025/26: Atorvastatin was the most dispensed chemical substance with 78 million items.") both say 2025/26. The CSV records 2025/26.

**240 ranks are missing.** The owner asked for the top 250. The full ranking exists in official data, but only in files this environment could not open.

### Where the full 250 is, and the steps to produce it

Run these where files can be downloaded (a laptop or a build machine with open internet access):

1. Dataset: **Prescription Cost Analysis (PCA) Annual Statistics**, NHSBSA Open Data Portal, <https://opendata.nhsbsa.net/dataset/prescription-cost-analysis-pca-annual-statistics> (read). Licence shown on the page: "Open Government Licence 3.0 (United Kingdom)".
2. Resource: **FY 2025/26 (corrected 2026-06-05)**, file `pca_icb_snomed_2025_2026.csv`, <https://opendata.nhsbsa.net/dataset/52423b6a-9605-4620-a425-2d4f9c323873/resource/72fa5515-4740-40fe-8ee7-5cbc390720a0/download/pca_icb_snomed_2025_2026.csv>. It has 29 columns, among them the BNF chemical substance code and name, the BNF chapter, and `ITEMS` (resource page, read).
3. Group the rows by chemical substance code and name, add up `ITEMS`, sort from largest to smallest, keep the first 250. The first ten must reproduce the table above exactly; if they do not, stop and find out why.
4. Decide whether to drop the non-medicine chapters (dressings, appliances, devices) before cutting at 250, and record the decision next to the list.

Two other official routes hold the same numbers; neither could be opened here, so their layout is not confirmed:
- "National summary tables - financial year (Excel: 15.8MB)", <https://nhsbsa-opendata.s3.eu-west-2.amazonaws.com/pca/pca_summary_tables_2025_26_v001.xlsx> (linked from the release page).
- The portal's data API for the same resource (resource name `PCA_ICB_SNOMED_2025_2026`), which can do the grouping on the server. The portal's `robots.txt` disallows `/api/` for automated readers, which is why it was not used here.

The NHSBSA's own code for the publication is public: <https://github.com/nhsbsa-data-analytics/prescription-cost-analysis> (linked from the release page; not opened).

### What the other three nations publish

These are separate rankings that count things in their own way. The NHSBSA methodology note warns that methods and classifications differ between nations. They are **not** merged into the list above or into the CSV.

- **Scotland** — Public Health Scotland, "Dispenser payments and prescription cost analysis - Financial year 2025 to 2026", published 29 September 2026, <https://publichealthscotland.scot/publications/dispenser-payments-and-prescription-cost-analysis/dispenser-payments-and-prescription-cost-analysis-financial-year-2025-to-2026/> (read). It reports that items reimbursed "increased by 1.3%, from 117.0 million to 118.5 million items." Downloads include `prescription_cost_analysis_2026.xlsx` (871.0KB) and `top10_2026_final.xlsx` (65.7KB). The page states: "All content is available under the Open Government Licence v3.0, except where stated otherwise." No medicine names appear on the page itself; the spreadsheets could not be opened here and the report PDF is closed to automated readers.
- **Wales** — NHS Wales Shared Services Partnership, <https://nwssp.nhs.wales/ourservices/primary-care-services/general-information/data-and-publications/prescription-cost-analysis/> (read). Described as "an all-Wales summary report derived from Community Prescribing data": number of items and net ingredient cost of prescriptions dispensed in the community in Wales, by calendar year, as a spreadsheet. The page read states no latest period and no licence.
- **Northern Ireland** — Business Services Organisation (BSO), <https://bso.hscni.net/directorates/operations/family-practitioner-services/directorates-operations-family-practitioner-services-information-unit/general-pharmaceutical-services-and-prescribing-statistics/prescription-cost-analysis/> (read). Annual, calendar year; the 2025 release was published 26 February 2026; accredited official statistics. Files: `PCA_2025.xlsx` and an HTML report, <https://datavis.nisra.gov.uk/bso/pca-report-2025.html> (read), which states "All content is available under the Open Government Licence v3.0, except where otherwise stated." The page notes "Private prescriptions are not included in the data".

Northern Ireland's HTML report is the only other ranking that could be read. It is reproduced here as its own list (calendar year 2025, prescription items dispensed in Northern Ireland; the source table has no rank column, the order is the source's):

"Table 4.1: Top 10 Chemicals by Number of Items Dispensed in 2025" — Atorvastatin 1,851,211; Omeprazole 1,492,453; Co-codamol 1,259,160; Levothyroxine 1,134,515; Sertraline 1,079,540; Bisoprolol 897,656; Amlodipine 866,572; Lansoprazole 848,943; Ramipril 803,338; Aspirin 737,902.

### OpenPrescribing

<https://openprescribing.net/api/> (read) — the site asks to be cited as "Bennett Institute for Applied Data Science, University of Oxford, 2025". Its documented API returns spending and items for one BNF code at a time, or for all prescribing together; it documents no endpoint that ranks chemicals nationally. Its stated reuse wording is "You are welcome to use data or graphs from this site in your academic output with attribution." That is not a licence for a commercial product; use the NHSBSA originals.

---

## 2. The country's "pharmacy lists"

| List | Who publishes it | What it holds | How it is obtained and updated | Reuse in a commercial product |
|---|---|---|---|---|
| **NHS Drug Tariff** | "NHS Prescription Services" (NHSBSA) "on behalf of the Department of Health and Social Care" | It "outlines what will be paid to pharmacy contractors for NHS services provided either for reimbursement or for remuneration"; includes dispensing rules, fees and drug and appliance prices. Parts listed on the page include II, IIIA, IIIB, VIIIA, VIIIB, VIIID, IX, XVIIA, XVIIB(I). | Monthly; viewable "3 working days before the 1st of each month". Whole tariff as PDF (7MB) and an online viewer; **Part VIIIA also as monthly XLSX and CSV**. <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/drug-tariff> and <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/drug-tariff/drug-tariff-part-viii> (both read) | No licence on the tariff pages. NHSBSA site terms: "Content from the NHSBSA website is covered by NHSBSA copyright." "Visitors can download material in accordance with the Open Government Licence." Attribution: "[NHSBSA Title of Information], NHSBSA Copyright [current calendar year]". <https://www.nhsbsa.nhs.uk/our-policies/terms-and-conditions> (read) |
| **Scottish Drug Tariff** | Public Health Scotland | Not read | <https://publichealthscotland.scot/services/scottish-drug-tariff> (title only; the page was refused) | Not verified |
| **Northern Ireland Drug Tariff** | Business Services Organisation | Not read | Monthly PDFs by part, e.g. <https://bso.hscni.net/wp-content/uploads/2026/08/DT_Part_0-General-Notes_2609.pdf> (title only) | Not verified |
| **NHS dictionary of medicines and devices (dm+d)** | NHSBSA authors and maintains it, with NHS England, on behalf of DHSC | "a dictionary of descriptions and codes which cover product information about medicines and devices in use across the NHS"; the NHS standard SCCI0052. Carries Drug Tariff reimbursement, availability and pricing, SNOMED CT codes, BNF data, GTIN barcodes and "Product information for over 700 suppliers and wholesalers". | "refreshed weekly"; "released through TRUD (Technology Reference Update Distribution)" as "dm+d in XML format"; latest seen: Release 10.0.0 (Week 41), 5 October 2026. Also a browser, <https://services.nhsbsa.nhs.uk/dmd-browser/>, and NHS England's Terminology Server. <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/dictionary-medicines-and-devices-dmd>, <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/nhs-dictionary-medicines-and-devices-dmd/release-dmd-files>, <https://isd.digital.nhs.uk/trud/users/guest/filters/0/categories/6/items/24/releases> (all read) | TRUD licence for this item is named "Open Government Licence for TRUD": "You must accept this licence when you subscribe to this item." Content "may be used" under "the terms and conditions of the Open Government Licence." "You must have an open account on TRUD to use the content." <https://isd.digital.nhs.uk/trud/users/guest/filters/0/categories/6/items/24/licences> (read) |
| **British National Formulary (BNF) and BNF for Children (BNFC)** | "BNF and BNFC are published jointly by BMJ Group, Pharmaceutical Press, RCPCH, and NPPG." | "Practical, evidence-based information for health professionals who prescribe, dispense, and administer medicines." Named in the brief as the licensed UK reference that carries dosing. | Online through MedicinesComplete, an app, and print (current: BNF 92, BNFC 2026-2027). <https://www.pharmaceuticalpress.com/bnf-publications/> (read). The NICE-hosted BNF site could not be opened from here. | **Licence needed.** "BNF content is copyright © BMJ Publishing Group Limited and Pharmaceutical Press Limited." "BNF and BNFC content is available for licensing through Pharmaceutical Press." Delivery "as a live feed to integrate with your internal systems", "full content files" or "extracts". <https://www.pharmaceuticalpress.com/services/content-licensing-and-integration/authorised-bnf-and-bnfc-licensees/> (read). NICE's terms add that BNF and BNFC content "cannot be used for artificial intelligence (AI) purposes without the express permission of the respective publishers." <https://www.nice.org.uk/terms-and-conditions> (read) |
| **NICE guidance** | National Institute for Health and Care Excellence | Guidance and advice; not a product list | <https://www.nice.org.uk/> | UK reuse under the "NICE UK Open Content Licence": content "is made available for reuse" "on a non-exclusive basis in the United Kingdom only". Outside the UK: "subject to a fee and licensing agreement". "NICE content cannot be used for AI purposes without written permission from NICE." <https://www.nice.org.uk/re-using-our-content>, <https://www.nice.org.uk/terms-and-conditions> (both read) |
| **Local area formularies** | Local NHS bodies; NICE guideline MPG1 covers how they are developed | Each area's own list of preferred medicines | No national file. NICE MPG1, <https://www.nice.org.uk/guidance/mpg1> (read), supports "developing formularies that reflect local needs" through "the local formulary decision-making group". One example found: NHS Northamptonshire ICB Formulary (title only), <https://blmk-n.communitypharmacy.org.uk/wp-content/uploads/sites/102/2024/05/NHS-Northamptonshire-ICB-Formulary.pdf> | Each body's own terms; not verified |
| **MHRA Products** (the regulator's register of product information) | Medicines and Healthcare products Regulatory Agency | Patient leaflets (PILs), Summaries of Product Characteristics (SPCs) and Public Assessment Reports. "We hold data for medicines licensed at a national (UK) level." | Website search only, <https://products.mhra.gov.uk/>; needs a browser with scripts, so it could not be searched from here. "We publish the most up-to-date information for a medicine according to its licence history." No download or API is mentioned on the pages read (<https://products.mhra.gov.uk/about/>, read). | **No licence stated** on the site or its About page. The GOV.UK guidance page that points to it says "All content is available under the Open Government Licence v3.0, except where otherwise stated" but says nothing about the SPC and PIL documents themselves. <https://www.gov.uk/guidance/find-product-information-about-medicines> (read) |
| **electronic medicines compendium (emc)** | "emc is managed and owned by Datapharm Ltd." | "more than 14,000 documents": SPCs and PILs, "checked and approved by either the UK or European government agencies which license medicines." The page does not say the collection is complete; it says each company "should update emc within 10 days" of an approved change. | Website, <https://www.medicines.org.uk/emc/about-the-emc> (read). Search works from here. | **Restricted.** "The material on the site must not be used, reproduced, linked to and/or sold for commercial benefit." Not to be used "for inclusion into healthcare and prescribing systems" or "to create or populate a database or knowledge bank". Licensing is by enquiry to Datapharm. <https://www.medicines.org.uk/emc/privacy-notice-and-legal> (read) |
| **Prescription Cost Analysis data** | NHSBSA | See section 1 | Open Data Portal; 52 of its 54 datasets are marked Open Government Licence 3.0. <https://opendata.nhsbsa.net/dataset> (read) | Open Government Licence 3.0 |
| **NHS website medicines pages** (nhs.uk) | Publisher not read (footer "© Crown copyright") | Patient-level pages per medicine; the title line gives common brand names ("Atorvastatin - Common brands: Lipitor") | <https://www.nhs.uk/medicines/atorvastatin/> (read) | Footer "© Crown copyright"; reuse terms not read |

The Open Government Licence itself is at <https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/>. That page was refused by the reading tool, so its own wording is not quoted here; the quotations above are how the NHSBSA, TRUD and the portals describe their use of it.

---

## 3. How medicines are classified for supply

As a classification scheme only.

**Three legal classes**, described by the MHRA in "Medicines: reclassify your product", <https://www.gov.uk/guidance/medicines-reclassify-your-product> (read; last updated 3 September 2026):
- **Prescription-only medicine (POM)** — "Medicines classified as 'prescription only' can only be obtained with a valid prescription."
- **Pharmacy medicine (P)** — "People can buy products classified as 'pharmacy medicines'", only from a pharmacy and with a pharmacist present.
- **General sales list medicine (GSL)** — "People can buy general sales list medicines from retail outlets such as corner shops and supermarkets."

The criteria are "laid down in the Human Medicines Regulations 2012, regulation 62(3)" for POM and regulation 62(5) for GSL (same page). The regulation text itself, <https://www.legislation.gov.uk/uksi/2012/1916/regulation/62>, was refused by the reading tool.

**Controlled drugs.** The Home Office publishes the "List of most commonly encountered drugs currently controlled under the misuse of drugs legislation", <https://www.gov.uk/government/publications/controlled-drugs-list--2/list-of-most-commonly-encountered-drugs-currently-controlled-under-the-misuse-of-drugs-legislation> (read; Open Government Licence v3.0 "except where otherwise stated"). For each substance it gives a **Class** under the Misuse of Drugs Act 1971 and a **Schedule** under the Misuse of Drugs Regulations 2001, and says "reference should also be made to the published Act and Regulations at legislation.gov.uk." The page does not define the classes or the schedules, and the Regulations' contents page, <https://www.legislation.gov.uk/uksi/2001/3998/contents>, was refused, so the five schedule headings are not quoted here.

**Where the product would read these from.** A dm+d product page shows a "Controlled drug category" for each generic product (seen: "No Controlled Drug Status" on <https://dmd-browser.nhsbsa.nhs.uk/vmp/view/21>, read). The POM / P / GSL class was not shown on that page; emc's search offers a "Legal Categories" filter (read). Where dm+d holds the legal class is in its Data Model document, which is a Word file that could not be opened here.

---

## 4. Naming

**Official names.** The recommended International Non-proprietary Name (rINN) is the official name; British Approved Names (BANs) that differed were changed to match. Source: a Chief Medical Officer letter published on the NHS Scotland publications site (file `cmo-2004-03.pdf`), <https://www.publications.scot.nhs.uk/files/cmo-2004-03.pdf> (read):
- "There is a requirement in both European and UK legislation to use rINNs for active substances in medicinal products."
- "Since 1 December 2003, where the names differ the rINN is the correct name."
- The two exceptions: "These are adrenaline (rINN epinephrine) and noradrenaline (rINN norepinephrine)." For these, the British names stay in use.

The letter carries a table of about a hundred former names and their replacements. Two of its rows concern the list in section 1: **Cholecalciferol → Colecalciferol** and **Thyroxine Sodium → Levothyroxine Sodium**. The former names matter for search, because clinicians still type them. The whole table should be loaded as search synonyms from the letter itself, not from this document. A trade-press item suggests the BNF later changed its handling of the two exceptions ("BNF updates drug names for adrenaline and noradrenaline", <https://www.thepharmacist.co.uk/in-practice/bnf-updates-drug-names-for-adrenaline-and-noradrenaline/>, title only); this needs checking.

**Names in the data.** The PCA list uses the BNF chemical substance name, which sometimes includes the salt ("Levothyroxine sodium", "Bisoprolol fumarate", "Metformin hydrochloride", "Sertraline hydrochloride"). dm+d names the generic product without the salt in some cases and with it in others: "Bisoprolol 5mg tablets", "Metformin 500mg tablets", "Sertraline 50mg tablets", but "Levothyroxine sodium 50microgram tablets" (dm+d browser page titles, section C). A names list must therefore be taken from one dataset and not mixed.

**Generic prescribing.** The PCA data has a field that records whether an item was prescribed generically (`PRESCRIBED_PREP_CLASS`, resource page, read). No page stating the national policy or the rate of generic prescribing was read; see "Could not verify".

**Names that differ from the United States.** None can be flagged. No source read in this session shows a United States name beside the British one; the one United States page tried (DailyMed) was refused. The only related fact on record is the British change above from "Cholecalciferol" to "Colecalciferol".

---

## 5. Electronic prescribing — context and open questions

Nothing in this section is verified. Both official pages tried were refused by the reading tool: <https://digital.nhs.uk/services/electronic-prescription-service> and <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/prescribing-and-dispensing/electronic-prescription-service-eps>. Web search returned these titles from NHS England's developer pages (through a mirror): "Electronic Prescription Service", "guidance for suppliers", "EPS prescriber developer guide", "Electronic Prescription Service - HL7 V3 API".

What is sourced: the national statistics exclude private prescriptions (PCA methodology note; Northern Ireland page). So the most-prescribed list describes NHS prescribing, not private practice.

Questions for the owner to settle before any prescribing feature is considered for this country:
1. Is the Electronic Prescription Service open to a third-party clinical assistant, or only to accredited prescribing systems? What does accreditation involve?
2. Does it cover England only? What do Scotland, Wales and Northern Ireland use?
3. Can a private (non-NHS) prescription be issued through it, and what are the rules for controlled drugs on private prescriptions?
4. Does the service require medicines to be identified by dm+d codes? (If so, a dm+d-based names list is a precondition.)
5. Is the product's first UK audience NHS general practice, private practice, or both? The answer changes which lists matter.

---

## 6. What a names list for the product would be

**The right source is dm+d.** It is the NHS standard for identifying medicines, it is refreshed weekly, and it is distributed under the Open Government Licence (section 2).

- **Format:** XML files in a weekly "subpack" from TRUD, plus a "supplementary subpack" with "BNF / ATC mapping files", a "historic code data file" and VTM ingredients; an AMPP-to-GTIN (barcode) mapping file is included (release page, read).
- **Update cycle:** weekly, on Mondays by the release dates seen; next release announced for 4:00am, Monday 12 October 2026 (TRUD, read).
- **Access:** a free TRUD account that accepts the "Open Government Licence for TRUD". NHS England also offers a Terminology Server and a syndication feed, <https://digital.nhs.uk/services/terminology-server> (linked from the release page, not opened).
- **Size:** not stated on any page read. Not verified.
- **What one generic-product record shows** (from <https://dmd-browser.nhsbsa.nhs.uk/vmp/view/21>, "Atorvastatin 20mg tablets", read): name; form ("Oral tablet"); route ("Oral"); the ingredient and strength; prescribing status ("Valid as a prescribable product"); controlled drug category; ATC code; BNF code; SNOMED codes with dates; and pack sizes with the Drug Tariff payment category ("Part VIIIA, Category M").
- **Levels:** the browser searches three types, "VTM, VMP, and AMP", with filters "Show Invalid, Hide Discontinued, Hide Parallel Import, and Hide Special Order" (<https://dmd-browser.nhsbsa.nhs.uk/search>, read). From the page titles: a VMP is the generic product ("Atorvastatin 20mg tablets"), an AMP is one supplier's product ("Lipitor 20mg tablets (Sigma Pharmaceuticals Plc)"), an AMPP is one pack of it ("Lipitor 10mg tablets (Sigma Pharmaceuticals Plc) 30 tablet").
- **What cannot be taken from it:** dosing, and any other clinical text. No dosing appears on the record read. The NHSBSA's About page links to separate "dose-based implementation guidance" (not opened); the page does not say dm+d itself carries dosing.

**Licensed sources of dosing that exist** (a licence is needed for each):
- British National Formulary and BNF for Children — licence from Pharmaceutical Press (section 2).
- emc (Datapharm) — SPC and leaflet text; licence by enquiry to Datapharm (section 2).
- NICE content — UK reuse under its own licence; AI use needs written permission (section 2).
- The SPC documents on the MHRA site are the official product information, but no reuse licence is stated for them (section 2). Treat as "ask the MHRA".

---

## A. How the Turkish product holds medicines (read from this repository)

The Turkish product has **two separate layers**.

### Layer 1 — the product list (what the doctor searches)

- File: `data/sgk-ilaclar.json`. **8,649 records.** File header: `kaynak` "SGK EK-4/A", `guncelleme` 2026-08-26, `titck` 2026-08-26.
- Type: `IlacKaydi` in `lib/ilac/ilacArama.ts`. Served by `app/api/doktor/ilac-ara/route.ts`, grouped by brand, then by pack.
- One record is one **reimbursed pack**.

| Field | Meaning | Records that have it |
|---|---|---|
| `ad` | Full product name as the payer writes it: brand, strength, pack | 8,649 |
| `marka` | Brand, cut from `ad` by the import script (the words before the first number) | 8,649 (4,713 distinct) |
| `sgk` | Reimbursed by the national payer (always true: the list is the reimbursement list) | 8,649 |
| `kamuNo` | The payer's product number | 8,648 |
| `barkod` | Barcode; the key used by the e-prescription system | 8,648 |
| `etkenMadde` | Active ingredient | 8,435 (2,368 distinct spellings) |
| `etkenKaynak` | Where the ingredient came from: `titck` (direct barcode match, 8,240) or `esdeger` (inherited from the equivalence group, 195) | 8,435 |
| `atc` | ATC code | 8,396 (1,278 distinct) |
| `esdegerGrubu` | The payer's equivalence group (interchangeable products) | 7,548 |
| `ruhsatAskida` | Licence-suspended code from the regulator | 62 |
| `form`, `doz` | Declared in the type | 0 — no record carries them; form and strength exist only inside the `ad` text |

Where the data came from, as the repository states it:
- `scripts/import-sgk-ilac.mjs` — the payer's (SGK) published reimbursement list "Bedeli Ödenecek İlaçlar Listesi" (EK-4/A) spreadsheets, consolidated list plus weekly change files.
- `scripts/import-titck-etken.mjs` — the regulator's (TİTCK) weekly "Ruhsatlı Beşeri Tıbbi Ürünler Listesi", joined by barcode to add active ingredient, ATC code and licence suspension. The script's notes say the 21.08.2026 list had 23.001 products and matched 8.213 of the 8.649 barcodes directly.

There is **no dosing text, no prescription-status field and no manufacturer field** in this layer.

### Layer 2 — the curated clinical table (what the safety card reads)

- `lib/asistan/turkishDrugs.ts`, entries in `lib/asistan/ilac/veri/*.ts` (12 files by therapeutic group), type `TürkishDrug` in `lib/asistan/ilac/tipler.ts`.
- **176 molecules**, per the comments in `core/eylemler/ilacUyari.ts` and `scripts/ilac-tablosu-inceleme.mts`.
- Fields: `name` (active ingredient), `brand[]` (common brand names), `dose` (adult dosing line), `pediatricDose` and structured `pediatrik`, `form`, `sgkCovered`, `sgkRestriction`, `category`, `siniflar` (class labels), `alerjiSinifi` (allergy groups), `contraindications[]`, `interactions[]` and structured `etkilesimler`, `yasKontrendikasyonAy`, `gebelik`, `emzirme`, `bobrekDozUyarisi`, `karacigerDozUyarisi`, `renkliRecete`, `notes`, and `kaynak` (source document, URL, verification state).
- Source, as the repository states it: each entry was read from the molecule's own TİTCK KÜB (the Turkish product information document). All 176 are marked "KÜB read"; none is marked as signed off by a physician.
- Prescription status is a third, small list: `lib/doktor/receteRengi.ts` maps active ingredients to red or green controlled prescriptions (12 and 19 ingredients, plus 6 marked uncertain), citing the regulator's announcements.

**So "Turkish depth" means two things:** a full product list with brand, ingredient, ATC, barcode, equivalence group and reimbursement (layer 1, from open official lists), and a hand-built clinical table with dosing for 176 molecules (layer 2, from official product documents read one by one).

---

## B. United Kingdom, field by field

"Seen" means the field was seen on an official page in this session. "Stated" means an official page says the dataset carries it. All dm+d rows: format XML, weekly, from TRUD, "Open Government Licence for TRUD" (section 2).

| Field (Turkish equivalent) | Official UK source | Evidence | Open? |
|---|---|---|---|
| Generic name (`etkenMadde`) | dm+d: the generic product (VMP) name and its ingredient; the supplementary pack's VTM ingredients | Seen: "Atorvastatin 20mg tablets"; ingredient "Atorvastatin calcium trihydrate, based on base substance, Atorvastatin 20 mg" | Open |
| Every commercial name (`marka`, `ad`) | dm+d: the supplier's product (AMP) and pack (AMPP) | Seen in page titles: "Lipitor 20mg tablets (Sigma Pharmaceuticals Plc)"; pack "Lipitor 10mg tablets (Sigma Pharmaceuticals Plc) 30 tablet" | Open |
| Manufacturer (none in Turkish data) | dm+d supplier, carried in the AMP name; "over 700 suppliers and wholesalers" | Seen. Note: suppliers include wholesalers and parallel importers (the browser has a "Hide Parallel Import" filter), so "supplier" is not always the maker. The licence holder is on the MHRA Products site, which has no download. | Open for supplier; licence holder not in an open file |
| Strength (`doz`, empty in Turkish data) | dm+d VMP ingredient and strength | Seen | Open |
| Form (`form`, empty in Turkish data) | dm+d VMP form | Seen: "Oral tablet"; "tablet.oral" | Open |
| Route (none) | dm+d VMP route | Seen: "Oral" | Open |
| ATC code (`atc`) | dm+d: shown on the VMP; "BNF / ATC mapping files" in the supplementary pack | Seen: "C10AA05" | Open |
| BNF code (none) | dm+d (as above); PCA and Open Data Portal files | Seen: "02120000" on the VMP; "0212000B0" for the chemical substance in PCA | Open |
| Controlled-drug class (`renkliRecete`) | dm+d "Controlled drug category" on the VMP; Home Office list for the legal basis | Seen: field present, value "No Controlled Drug Status" | Open |
| General Sale / Pharmacy / Prescription Only (none) | Expected in dm+d at pack level; emc shows "Legal Categories" | **Not seen** on the dm+d page read; the dm+d Data Model document could not be opened | Not verified |
| Reimbursement status (`sgk`) | Drug Tariff: dm+d shows the tariff payment category on the pack; Part VIIIA as monthly CSV/XLSX from the NHSBSA | Seen: "Part VIIIA, Category M" on the 28-tablet pack. What is excluded from NHS prescribing (the tariff's other parts) was not read | Open (NHSBSA site terms, Open Government Licence) |
| Local formulary status (none) | Each area's own formulary | No national file | **No open national source** |
| Barcode (`barkod`) | dm+d "mapping file between AMPP and GTIN" | Stated | Open |
| Payer product number (`kamuNo`) | No equivalent; the dm+d identifier (a SNOMED code) plays this role | Seen: codes on the VMP page | Open; see the SNOMED question under "Could not verify" |
| Equivalence group (`esdegerGrubu`) | dm+d: every AMP belongs to one VMP, which is the generic equivalent. PCA also carries a generic-equivalent BNF code | Seen in names; the parent/child links did not render on the pages read | Open |
| Licence suspended / discontinued (`ruhsatAskida`) | dm+d prescribing status and invalid / discontinued flags | Seen: "Valid as a prescribable product"; filters "Show Invalid", "Hide Discontinued" | Open |
| How often prescribed (none) | PCA annual data (section 1) | Seen for the top 10 | Open, Open Government Licence 3.0 |
| **Dosing text** (`dose`, `pediatrik`) | Product information (SPC) on the MHRA Products site or emc; the BNF | See below | **No open source** |
| Contraindications, interactions, pregnancy, breastfeeding, kidney and liver flags | Same documents | — | **No open source** |
| Allergy groups, class labels | Not a dataset; in the Turkish product these were built by hand | — | **No source** |

### Dosing text: reproduce or only link?

- **emc (Datapharm): may not be reproduced in a product without a licence.** "The material on the site must not be used, reproduced, linked to and/or sold for commercial benefit." Use is barred "for inclusion into healthcare and prescribing systems", "to create or populate a database or knowledge bank" "that includes material downloaded or otherwise obtained from the Website", and "to create additional information or summarise content for your own company or on behalf of another company." Even linking has a condition: Datapharm encourages links "for non-commercial use or benefit" and "we require such organisations and individuals to request permission to do so". "Datapharm's decision, on whether it is of commercial benefit, is final." <https://www.medicines.org.uk/emc/privacy-notice-and-legal> (read)
- **MHRA Products site: no terms found either way.** Neither the site nor its About page states a licence or who owns the copyright in the SPC and leaflet documents; it refers questions to MHRA Customer Services. The GOV.UK guidance page is under the Open Government Licence "except where otherwise stated" and is silent on the documents. Until the MHRA answers in writing, the safe reading is: **link to the product's page on the MHRA site, do not copy its text.**
- **BNF / BNFC: licence only** (section 2).

For this reason the commercial names in the sample file were taken from dm+d pages and not from emc, although emc's search works from here. As a plain observation, an emc search for "atorvastatin" returned 60 results, including Lipitor products listed under "Viatris (formerly Mylan or Upjohn)" (<https://www.medicines.org.uk/emc/search?q=atorvastatin>, read).

---

## C. Sample file: `gb-brand-generic-sample.csv`

Columns: `generic_name,commercial_name,manufacturer_if_shown,strength_and_form_if_shown,register_url`. 103 rows for the 10 medicines of section 1 (the brief asked for the first 30; only 10 ranks could be reached).

**Neither official register could be searched from here.** The MHRA Products site shows "Loading results..." without a browser. The dm+d browser's search returned an error to the reading tool, on both its current address (`services.nhsbsa.nhs.uk/dmd-browser`) and its older one (`dmd-browser.nhsbsa.nhs.uk`). Single product pages on the older address can be opened, and web search returns them by title.

What the file therefore holds:
- **102 rows copied from dm+d browser page titles as returned by web search** (70 product pages, 32 pack pages), for example "Actual Medicinal Product (AMP) - Lipitor 20mg tablets (Sigma Pharmaceuticals Plc)". `commercial_name` is the product name with its supplier exactly as the title gives it; `manufacturer_if_shown` is the bracketed supplier; `strength_and_form_if_shown` is the part of the name from the first number onward, cut by a script; `register_url` is that page. For pack pages the pack size was left out of the name.
- **1 row from the NHS website**: "Lipitor" as the common brand of atorvastatin.

Limits the owner should know:
- **It is not "all commercial names".** Web search returns about ten titles per query, and one strength was searched per medicine. dm+d holds every strength, form and supplier.
- **Only atorvastatin has a brand name in the file.** The searches were made with the generic name, so they returned suppliers' generic products ("Amlodipine 5mg tablets (Accord-UK Ltd)"). Brand names for the other nine would have come from the NHS website's "Common brands" line; those pages were refused by the reading tool. No brand name was typed from memory.
- **The page behind each title was not opened**, except one generic-product page (<https://dmd-browser.nhsbsa.nhs.uk/vmp/view/21>). The one product page tried (`amp/view/72804`) was refused. The link between "Lipitor" and atorvastatin rests on the NHS website title and the emc search, both read.
- The titles are a search engine's copy of the official pages and may lag behind dm+d; products shown may since have been discontinued.
- "Supplier" in dm+d includes wholesalers and parallel importers; it is not always the manufacturer.

---

## Recommendation for the owner

**Route: build the UK medicine list from dm+d, rank it with PCA, mark reimbursement from the Drug Tariff, and link out for product information. Do not hold dosing text until a licence is bought.**

### D. Import plan to reach the Turkish depth

None of these datasets can be fetched from this environment (downloads are blocked and the files are too large or in formats the reading tool cannot open). **The import must run where they can be downloaded**, and the resulting data file committed, as was done for `data/sgk-ilaclar.json`.

| Step | Dataset | Gives | Licence |
|---|---|---|---|
| 1 | dm+d weekly XML from TRUD (free account) | Generic product, supplier's product and pack names; supplier; ingredient and strength; form; route; ATC and BNF codes; controlled-drug category; prescribing status; Drug Tariff category; barcodes | Open Government Licence (attribution) |
| 2 | PCA Annual Statistics FY 2025/26 CSV, Open Data Portal | Items per chemical substance: the top 250, and a "commonly prescribed" order for search results | Open Government Licence 3.0 |
| 3 | Drug Tariff Part VIIIA monthly CSV, NHSBSA | The current Part VIIIA listing, to mark which generic packs are in the tariff and in which category (the file itself was not opened here) | Open Government Licence per NHSBSA site terms |
| 4 | The name table in the Chief Medical Officer letter (section 4) | Former British names as search synonyms | NHS Scotland publication; reuse terms not read |
| 5 | Link per product to the MHRA Products site | The official product information, by link only | None needed for a link; copying not cleared |

Compared with the Turkish product list:
- **Fields that will be full:** product name, brand or supplier name, generic name, strength, form, route, ATC code, BNF code, controlled-drug category, reimbursement category, barcode, equivalence (through the generic product), discontinued flag. Strength, form and route will be better than the Turkish list, where they exist only inside the name.
- **Fields that will be empty:** dosing; contraindications; interactions; pregnancy, breastfeeding, kidney and liver flags; allergy groups; local formulary status. POM / P / GSL is expected from dm+d but was not confirmed.
- **Roughly how many records:** not verified; no page read states the size of dm+d. The Turkish list is 8,649 reimbursed packs. dm+d covers every supplier's product and pack, wholesalers and parallel importers included, so expect it to be several times larger and expect to filter (hide discontinued, hide parallel imports, hide special orders: the same filters the official browser offers). Count the records in the first downloaded release before designing the search.
- **What needs a paid licence:** nothing in steps 1 to 5. Dosing does: the BNF and BNFC from Pharmaceutical Press, or emc content from Datapharm. Any use of NICE or BNF content with AI needs written permission as well.

### Cost in effort

- An import script of the same kind as `scripts/import-sgk-ilac.mjs` and `scripts/import-titck-etken.mjs`, reading XML in place of spreadsheets, plus a small PCA ranking script. The first-ten check in section 1 is the acceptance test for the ranking.
- A weekly refresh, since dm+d changes weekly and the Drug Tariff monthly.
- A decision on what a search result shows: the generic product first (how NHS prescribing works by default, to be confirmed), with brands beneath it.
- Three open items below should be written into the repository's open-commitments list by whoever takes this forward: produce the full top 250; get the MHRA's written answer on reusing product information; answer the electronic prescribing questions.

### What this route does not give

- **No dosing and no safety checks.** The Turkish layer 2 (176 molecules with dosing, interactions and contraindications) has no open UK equivalent. It would need a BNF licence, or the same hand-built work from product documents whose reuse terms are not yet cleared, plus physician sign-off.
- No answer on electronic prescribing (section 5).
- No local formulary status.
- Coverage of England's ranking only; the other nations publish their own.

---

## Could not verify

Each item names what was missing and why.

**Not reachable from this environment**
- The full PCA ranking: 240 of the 250 ranks. The CSV and Excel files cannot be downloaded or opened here; the portal's API is closed to automated readers.
- The layout of the PCA "National summary tables" Excel file (not opened).
- Scotland's `top10_2026_final.xlsx` and `prescription_cost_analysis_2026.xlsx` (Excel, not openable); Scotland's report PDF (closed to automated readers). Wales's spreadsheet.
- Search on the MHRA Products site (needs a browser) and on the dm+d browser (error). So "all commercial names" could not be produced for any medicine.
- OpenPrescribing's medicine pages and its dm+d pages (error); the NICE-hosted BNF site (error).
- dm+d's Word documents (Data Model, Technical Specification, Editorial Policy): not openable. They would confirm where the POM / P / GSL class is held and the record counts.
- The Drug Tariff Part VIIIA CSV (returned as unreadable).

**Refused by the reading tool's rate limit (HTTP 429), not retried**
- <https://dmd-browser.nhsbsa.nhs.uk/amp/view/72804> — to see the fields of a supplier's product record.
- <https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=cholecalciferol> — to show a United States name beside the British one.
- <https://digital.nhs.uk/services/electronic-prescription-service> and <https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/prescribing-and-dispensing/electronic-prescription-service-eps> — the Electronic Prescription Service.
- <https://www.legislation.gov.uk/uksi/2012/1916/regulation/62> — the legal text of the three classes.
- <https://www.legislation.gov.uk/uksi/2001/3998/contents> — the headings of controlled-drug Schedules 1 to 5.
- <https://www.nhs.uk/medicines/amlodipine/>, `/lansoprazole/`, `/ramipril/`, `/omeprazole/` — the "Common brands" line; the pages for the remaining five medicines were then not tried.
- <https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/> — the licence's own wording.
- <https://www.bennett.ox.ac.uk/what-is-the-dmd-the-nhs-dictionary-of-medicines-and-devices> — plain-language definitions and sizes for dm+d.
- <https://publichealthscotland.scot/services/scottish-drug-tariff> — the Scottish Drug Tariff. The Northern Ireland Drug Tariff pages were then not tried.

**Open points of substance**
- The brief describes the NHS Drug Tariff as covering England and Wales; the page read does not state its territory.
- The size of dm+d (number of generic products, supplier products and packs).
- Whether the SNOMED CT identifiers inside dm+d carry any condition beyond the Open Government Licence. The TRUD licence page mentions the "SNOMED CT UK Drug Extension" only as a contact topic.
- Whether MHRA product information (SPC, leaflet) may be reproduced. No terms were found; ask the MHRA.
- Reuse terms of the NHS website ("© Crown copyright" footer only) and of the Scottish CMO letter.
- The national position and rate of generic prescribing.
- Whether the BNF still treats adrenaline and noradrenaline as exceptions (a trade-press title suggests a change).
- Private prescribing: no source read describes how private prescriptions are written, recorded or counted, beyond their exclusion from the statistics.
- The Table 10 caption in the PCA summary says 2024/25 where the surrounding text says 2025/26; the full data file will settle which year the ten figures belong to.
- Quotations were relayed by a reading tool and some are shortened; check the linked page before relying on any of them in a contract.
