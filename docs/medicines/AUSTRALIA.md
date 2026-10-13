# Medicines research — Australia (`au`)

Research date: 2026-10-09. Status: **research only, for the owner to decide on**. No code and no pack file was changed; the product's medicine slots for Australia stay empty and switched off.

Companion files:

- `docs/medicines/au-most-prescribed.csv` — the official ranking, 50 rows (section 1).
- `docs/medicines/au-brand-generic-sample.csv` — brand and generic names for the first 30 medicines of that ranking, as far as they could be reached (section C).

## How to read this document

- Every medicine name here was copied from a page fetched in this session. Nothing was added, completed, corrected or reordered from memory. The source link and the data year sit beside each list.
- There is **no dosing, indication, interaction, warning or prescribing advice** in this document or in the two CSV files. Where an official table prints clinical or dose-related columns, only the existence of the column is noted.
- Pages were read through a fetch tool that returns the page as extracted text. Quoted fragments are short and are given as the tool returned them. Where a page could not be read (blocked, rate limited, binary, truncated), that is said in "Could not verify" at the end, with what the page holds.
- "PBS" is the Pharmaceutical Benefits Scheme (the national reimbursement scheme). "RPBS" is the Repatriation Pharmaceutical Benefits Scheme (veterans). "TGA" is the Therapeutic Goods Administration (the regulator). "ADHA" is the Australian Digital Health Agency.

---

## 1. Most commonly prescribed medicines

### The official ranking

**Main source:** PBS Expenditure and Prescriptions Report, 1 July 2024 to 30 June 2025, Department of Health, Disability and Ageing (contact block: "PBS Analytics and Modelling Section"). Report page last updated 22 December 2025.

- Report page: <https://www.pbs.gov.au/info/statistics/expenditure-prescriptions/expenditure-prescriptions-report-1-july-2024-30-june-2025>
- Tables (PDF, 2.6 MB): <https://www.pbs.gov.au/statistics/expenditure-prescriptions/2024-2025/Expenditure-prescriptions-report-tables-2024-25.PDF>
- Tables (Excel, 459 KB): <https://www.pbs.gov.au/statistics/expenditure-prescriptions/2024-2025/Expenditure-prescriptions-report-tables-2024-25.XLSX>

**Table used:** "Table 6(a): Top 50 PBS Drugs (by Active Ingredient) by Highest Total Prescription Volume, 2024-25", sub-heading "Section 85 and Section 100, including Prescriber Bag and under co-payment prescriptions" (page 17 of the PDF).

**Data year:** financial year 2024-25 (1 July 2024 to 30 June 2025).

**What is counted:**

- Prescriptions dispensed under the PBS, general schedule (Section 85) and special programs (Section 100), including Prescriber Bag supplies.
- **Under co-payment prescriptions are included.** These are PBS prescriptions priced below the patient co-payment, where the government pays nothing. The report's Figure 1 footnote says suppliers have been required "from 1 April 2012" to give the government "data on PBS prescriptions that are priced below the general copayment level (under copayment)". The PBS statistics notes define them as "those where the government contribution is zero" (<https://www.pbs.gov.au/statistics/dos-and-dop/files/dos-and-dop-explanatory-notes.pdf>).
- The table's columns are: PBS Subsidised Prescriptions, Under Co-Payment Prescriptions, Total Prescription Volume, Government Cost. The CSV carries the **Total Prescription Volume** column. In the rows read, subsidised plus under co-payment equals the total (for example rank 1: 9,479,981 + 6,565,517 = 16,045,498).
- **RPBS:** the sub-heading of Table 6(a) does not mention RPBS. In the tables that could be read, RPBS items are named only in Tables 2(c) and 2(d) ("PBS Section 85 and S100 and RPBS items for DVA patients"); the contents page also titles Tables 15 and 16 "PBS/RPBS". Whether veterans' RPBS-only items are inside Table 6(a) is not stated in the part of the report that could be read.
- The names are active ingredients in capitals, as the PBS prints them. Fixed combinations are written with a plus sign ("AMOXICILLIN + CLAVULANIC ACID").

**How many ranks:** the official report publishes **50** ranks by prescription volume. The owner asked for the top 250. **200 ranks are missing**, and they are not filled from anywhere else. See "How to reach 250" below.

The 50 rows are in `docs/medicines/au-most-prescribed.csv`. First ten, exactly as in the source:

| Rank | Name as in source | Total Prescription Volume |
|---|---|---|
| 1 | ROSUVASTATIN | 16,045,498 |
| 2 | ATORVASTATIN | 11,114,671 |
| 3 | PANTOPRAZOLE | 10,821,092 |
| 4 | ESOMEPRAZOLE | 7,797,551 |
| 5 | ESCITALOPRAM | 6,468,288 |
| 6 | PERINDOPRIL | 6,273,225 |
| 7 | SERTRALINE | 6,170,213 |
| 8 | METFORMIN | 6,060,865 |
| 9 | CEFALEXIN | 5,099,619 |
| 10 | AMOXICILLIN | 4,937,222 |

### Other rankings in the same report (not copied into the CSV)

The report's contents page lists these related tables (same PDF):

- Table 5(b): Top 50 PBS Drugs by Highest **Subsidised** Prescriptions — "excluding under co-payment prescriptions". This is a different count from Table 6(a), so the two were not merged.
- Table 5(a): Top 50 PBS Drugs by Highest Government Cost.
- Table 5(f): Top 50 PBS **Brands** by Highest Subsidised Prescriptions — copied in section C, because it pairs brand names with active ingredients.
- Table 5(e): Top 50 PBS Brands by Highest Government Cost. Table 3(d) and 3(e): Top 25 drugs and Top 25 brands by patient count.
- Table 6(b): Top 10 drugs per age group and gender. Table 7: Top 50 ATC Level 2 drug groups by prescription volume.

### Secondary source (cross-check only)

**SECONDARY — derived from Department of Health, Disability and Ageing PBS data:** "Top 10 drugs 2024–25", Australian Prescriber, <https://australianprescriber.tg.org.au/articles/top-10-drugs-2024%E2%80%9325.html>. Its Table 2 is titled "Top 10 PBS and RPBS drugs by prescription counts"; the article states the period 1 July 2024 to 30 June 2025, based on date of supply, source "Department of Health, Disability and Ageing, October 2025", and that prescription figures include under co-payment prescriptions.

- Its ten names are in the same order as ranks 1 to 10 above (printed in lower case: rosuvastatin, atorvastatin, pantoprazole, esomeprazole, escitalopram, perindopril, sertraline, metformin, cefalexin, amoxicillin).
- Its counts are slightly higher (rank 1: 16,313,366 against 16,045,498) because it counts PBS **and RPBS**. It is therefore a different count and was not used in the CSV.
- The article also has a table of usage expressed as defined daily doses per 1000 population per day. That column exists; no figures were copied.
- Its footnotes say the tables leave out items dispensed under the Opioid Dependence Treatment Community Pharmacy Program, and that counts may be affected by 60-day prescriptions introduced on 1 September 2023, 1 March 2024 and 1 September 2024.
- Licence of the article: CC BY-NC-ND 4.0 (non-commercial, no derivatives) — it cannot be reused in a commercial product.

### How to reach 250 ranks

No official published table goes beyond 50. The dataset that can produce 250 is the PBS **Date of Supply** statistics (<https://www.pbs.gov.au/info/statistics/dos-and-dop/dos-and-dop>):

| File | Format, size | Updated |
|---|---|---|
| Monthly Date of Supply report, July 2022 – July 2026 — <https://www.pbs.gov.au/statistics/dos-and-dop/files/dos-jul-2022-to-jul-2026.xlsx> | XLSX, 104 MB | monthly (September 2026) |
| Supplementary report, July 2024 – June 2025 — <https://www.pbs.gov.au/statistics/dos-and-dop/files/dos-jul-2024-to-jun-2025-phrmcy-type.csv> | CSV, 17.5 MB | September 2025, no further updates |
| PBS item drug map — <https://www.pbs.gov.au/statistics/dos-and-dop/files/pbs-item-drug-map.csv> | CSV, 836 KB | September 2026 |
| Explanatory notes — <https://www.pbs.gov.au/statistics/dos-and-dop/files/dos-and-dop-explanatory-notes.pdf> | PDF, 83 KB | — |

The page says totals are provided "by PBS item code, ATC5 code, drug name, patient category, drug type category, script type (under/above co-payment) and month of supply", that "The Date of Supply report includes data on under co-payment prescriptions", and that it covers PBS and "RPBS-listed items". The item drug map's header row, as fetched, is `ITEM_CODE,DRUG_NAME,FORM/STRENGTH,ATC5_Code`.

Steps, to be run on a machine that can download the files (they could not be downloaded here — see "Could not verify"):

1. Download the monthly Date of Supply XLSX (or the 2024-25 supplementary CSV).
2. Keep the months of one whole financial year.
3. Sum the prescriptions column by `DRUG_NAME`, across all item codes, patient categories and both script types.
4. Sort descending and take ranks 1 to 250.
5. Record in the output that the count is PBS **and RPBS**, by date of supply, including under co-payment — that is what this dataset holds. It is not the same count as Table 6(a). The whole list 1–250 must come from this one dataset; ranks 51–250 must not be appended to the 50 above.

The explanatory notes add caveats to carry with any derived list: the data are pharmacy claims "submitted by pharmacies through the Services Australia PBS claiming system (PBS Online)"; "This does not include medicines supplied through some special arrangements under Section 100"; the most recent two months are not published; and "From time to time there may be significant revisions to previously published data."

Also found: the data.gov.au dataset "Pharmaceutical Benefits Scheme (PBS) - Item Report" (<https://data.gov.au/data/dataset/14b536d4-eb6a-485d-bf87-2e6e77ddbac1>), licence Creative Commons Attribution 3.0 Australia, last updated 10/08/2023, described as historical (1992–2014) data per State/Territory. It is too old to be the ranking.

---

## 2. The country's "pharmacy lists"

Each entry: who publishes it, what it holds, where, how it is obtained and updated, and the reuse terms as the fetched pages state them.

### 2.1 Schedule of Pharmaceutical Benefits (the PBS Schedule)

- **Publisher:** Department of Health, Disability and Ageing. <https://www.pbs.gov.au/>
- **What it is:** the list of medicines the government subsidises and the rules for prescribing and dispensing them. The department's news item says the PBS API "contains the full dataset of the PBS Schedule, including details of the medicines subsidised by the Australian Government" and "the conditions for their prescribing and dispensing" (<https://www.pbs.gov.au/info/news/2024/12/new-pbs-schedule-data-api-and-api-csv-files>).
- **Update cycle:** "The PBS Schedule is updated on the first day of every month" (<https://www.pbs.gov.au/browse/publications>).
- **How it is published (October 2026 issue, as listed on the publications page):**
  - PDFs: General Schedule (8.1 MB), Highly Specialised Drugs Program (5 MB), Efficient Funding of Chemotherapy (1 MB), Growth Hormone Program, IVF Program, Botulinum Toxin Program, Palliative Care Items, Prescriber Bag, Summary of Changes, and the Repatriation Schedule.
  - **PBS API CSV files** (ZIP, 5 MB): <https://www.pbs.gov.au/publication/schedule/2026/10/2026-10-01-PBS-API-CSV-files.zip?variant=3> — "all the PBS API endpoints (tables) in CSV format".
  - **PBS API:** <https://data.pbs.gov.au/api/pbs-api.html>. Public API: "This API always displays the current PBS Schedule data and is freely available to everyone"; no login; "rate-limited to one request per twenty seconds", shared among all users; JSON (default) or CSV; the past 12 months of schedules are also available (<https://data.pbs.gov.au/api/api-public.html>, <https://data.pbs.gov.au/api/api-faq.html>). API catalogue: <https://data-api-portal.health.gov.au/apis>. Data Model and Data Dictionary v3.7.8 are linked from the API page.
  - **Embargo API** for software vendors: early access before a new Schedule takes effect, "only provided to Software Developers for the purposes of updating prescribing, dispensing and claiming software", by application, "at the discretion of the Department" (<https://data.pbs.gov.au/downloads/downloads.html>, <https://data.pbs.gov.au/api/api-embargo.html>). The lead time is given as "approximately four (4) weeks" on the downloads page and "approximately two weeks" in the FAQ — the two pages disagree.
  - The older XML and text extracts: "The API has replaced all existing formats (XML and text files) of PBS schedule data distribution" (<https://data.pbs.gov.au/data-distribution/data-distribution.html>). An older download page (last updated 1 May 2024) still lists them (<https://www.pbs.gov.au/info/browse/download>).
- **Reuse terms:** the PBS website's copyright page (<https://www.pbs.gov.au/general/copyright>, last updated 6 July 2022) reads: "The material contained on this website is copyright material." "It may be reproduced in part for personal use as general reference material only," "provided any copyright and disclaimer notices remain intact." "Apart from these general uses and the uses permitted under the Copyright Act 1968 (Cth)," "all rights are reserved." No Creative Commons licence is named. The API pages, the API FAQ and the news item state **no** separate terms of use. So the published terms do not grant commercial reuse, even though the department runs an API program for prescribing-software developers. **This must be confirmed in writing with the department before the data is put in a product** (contact given on the data distribution page: HPP.Support@Health.gov.au).

### 2.2 Repatriation Schedule of Pharmaceutical Benefits (RPBS)

- **Publisher:** published on the PBS site with each monthly issue (Repatriation Schedule PDF, 789 KB). <https://www.pbs.gov.au/browse/rpbs>
- **What it is:** "The benefits listed in this Schedule may only be prescribed to Department of Veterans' Affairs beneficiaries" — holders of the gold, white or orange repatriation cards.
- **Terms:** same PBS website copyright as 2.1.

### 2.3 Australian Register of Therapeutic Goods (ARTG)

- **Publisher:** Therapeutic Goods Administration. <https://www.tga.gov.au/resources/artg>
- **What it is:** "Search medicines, medical devices and biologicals that can be supplied within Australia." Results include "product name and formulation details, sponsor (company) and manufacturer details, Consumer Medicine Information (CMI) and Product Information (PI)"; "Not all CMI and PI documents are available."
- **Size:** the search page reported "97004 result(s) found" on the research date. That is every kind of therapeutic good, not medicines only.
- **Download and update cycle:** not stated on the page that could be read. The page mentions an "ARTG search visualisation tool for advanced search functionality". No bulk export was confirmed.
- **Reuse terms:** the TGA copyright page could not be read (the site blocks automated reading of that page). Not verified.

### 2.4 Product Information and Consumer Medicine Information documents (TGA)

- **Publisher:** written by each medicine's sponsor (company), published by the TGA.
- **Terms:** "Access Terms for Product Information and Consumer Medicine Information Documents ('Licence')", <https://www.ebs.tga.gov.au/ebs/picmi/picmirepository.nsf/pdf>. Clause 2.1: "We grant to You a perpetual, non-exclusive, royalty-free, world-wide, irrevocable and non-transferable licence" to "download, store in cache, display, print and copy a single copy or part of a single copy." Clause 2.2: for any other use, "You must seek the permission of the Sponsor." Clause 3.1: "You are responsible for making Your own enquiries to determine whether any PI Document or CMI Document is accurate, up to date and fit for Your purposes."
- **Meaning for the product:** the documents may be linked to. Reproducing their text (which is where official dosing lives) inside a product is outside the single-copy licence and needs each sponsor's permission.

### 2.5 Australian Medicines Terminology (AMT), within SNOMED CT-AU

- **Publisher:** National Clinical Terminology Service (NCTS), "operated by the Australian Digital Health Agency". <https://www.healthterminologies.gov.au/>
- **What it is:** "a formal subset of SNOMED CT-AU" "providing unique codes and terminology for accurately describing all commonly used medicines in Australia" (<https://implementer.digitalhealth.gov.au/resources/services/national-clinical-terminology-service>). It is updated monthly to reflect changes to the PBS and the ARTG (same page, paraphrased by the fetch tool).
- **Size:** a SNOMED International page dated 2019 lists "Australian Medicines Terminology (AMT) drug extension (116 000 concepts)" "including machine-readable strengths and pack sizes" (<https://conf.spaces.snomed.org/wiki/spaces/MCC/pages/131343236/Australia>). A current count was not found.
- **Download and update cycle:** "SNOMED-CT is updated and released monthly"; the last six monthly releases are offered in "native RF2 distribution format"; "You must be logged in to download these bundles" (<https://www.healthterminologies.gov.au/access-clinical-terminology/access-snomed-ct-au/snomed-ct-au-releases/>). Latest release note seen: 30 September 2026.
- **Registration and licence:** an account (individual or organisation) and acceptance of two agreements — the "SNOMED CT Affiliate License Agreement" and the Agency's "Australian National Terminology Licence Agreement". "The acceptance of these license agreements will provide free access to SNOMED CT and national extensions and derivatives" (<https://www.healthterminologies.gov.au/access-clinical-terminology/licensing/>). Registered users must "answer a short Statement of Usage survey annually each June" as "a condition of continued access" (<https://www.healthterminologies.gov.au/registration-terms/>).
- **Terms that matter for a commercial product** (Australian National Terminology Licence Agreement, <https://www.healthterminologies.gov.au/library/DH_2400_2016_AustralianNationalTerminologyLicenceAgreement_v20160809.pdf>, clause numbers as the fetch tool reported them — to be read in full by whoever signs):
  - The licence is "worldwide, non-exclusive, non-transferable" (cl. 2.1), and the licensee may incorporate the terminology into its products and sublicense it to end users "to the extent necessary for the End Users to use the Licensee Products" (cl. 2.1.3, 2.1.5).
  - "no licence fees, charges, usage fees or royalties are payable" at the start (cl. 7.1); fees may be introduced later (cl. 7.2).
  - Updates must be incorporated promptly — 30 days for live clinical use, 90 days otherwise (cl. 6.2).
  - A prescribed attribution notice and the version and date of the terminology must be shown (cl. 8.3); a register of sublicences must be kept (cl. 8.7); live clinical users must run a risk-monitoring process (cl. 8.6).
  - Users of a public-facing system may not extract "any substantial portion" of the terminology (cl. 2.2.4).
  - The licensing page adds that using SNOMED CT outside Australia, or in a mobile application, requires contacting SNOMED International (info@snomed.org).

### 2.6 State public-hospital formularies

These decide what may be started in public hospitals. They are not national and not the community prescribing list.

- **Queensland — List of Approved Medicines (LAM):** "The official statewide formulary for medicines approved for use in all Queensland Health public hospitals and institutions", "created, maintained and reviewed by the Queensland Health Medicines Advisory Committee (QHMAC)". Searchable online; a static printable list exists for people without a Queensland Health login. Copyright "© The State of Queensland 2026 (Queensland Health)"; copyright statement at <https://www.health.qld.gov.au/global/copyright-statement>. Source: <https://www.health.qld.gov.au/clinical-practice/guidelines-procedures/medicines/approved-list/about>
- **Western Australia — Statewide Medicines Formulary (SMF):** "a single list of approved medicines which can be initiated by prescribers across the WA health system", hosted on Formulary One, which is "accessible to WA Health employees". No licence statement on the page. Source: <https://health.wa.gov.au/Articles/U_Z/WA-Statewide-Medicines-Formulary>
- **New South Wales — NSW Medicines Formulary:** maintained by the NSW Medicines Formulary Committee, covering medicines "approved for initiation in inpatients in NSW public hospitals and health services"; outcomes are "available to all NSW Health clinicians on the Formulary online platform". Source: <https://cec.health.nsw.gov.au/__data/assets/pdf_file/0009/719550/NSW-Medicines-Formulary-Committee-Process.PDF> (Version 2, December 2023).
- Victoria, South Australia, Tasmania, the Northern Territory and the ACT were not researched.

### 2.7 Licensed clinical references (commercial; these hold dosing)

- **Australian Medicines Handbook (AMH)** — Australian Medicines Handbook Pty Ltd. The multi-user licence is "a non-exclusive, non-transferrable, revocable multi-user licence to access or use the Product", for the licensee's "own internal purposes"; the user may not "modify or create derivative works based upon the Product" nor "sell, license, sublicense, lease, rent, distribute, disclose, permit access to, or transfer to any third party". Source: <https://shop.amh.net.au/about/termsandconditions/multi>. A data or integration licence is not described there; it would have to be negotiated with AMH.
- **Therapeutic Guidelines** — Therapeutic Guidelines Limited. "Copyright in the material accessible from the Platforms is owned by us or our licensors." No part may be "reproduced, stored in a retrieval system, scanned or transmitted in any form" without "the permission of the copyright owner"; the organisation may charge fees to commercial enterprises, negotiate licence agreements, or refuse. Source: <https://www.tg.org.au/copyright-permission>
- **MIMS** — MIMS Australia Pty Ltd. "MIMS Integrated is the MIMS knowledge you trust, integrated into your clinical software", offered to "third-party software developers"; modules named on the page: Product listings, Full product information, Abbreviated product information, The Pill Identifier, Consumer medicines information, and Clinical Decision Support Modules (names only). "Customers require MIMS Integrated subscriptions". Source: <https://mims.com.au/index.php/products/mims-integrated>. The developer API terms forbid users to "Scrape, build databases, or otherwise create permanent copies of such content" (<https://developer.mims.com/au/Home/TermsAU>).

### 2.8 PBS statistics

The expenditure report and the Date of Supply files in section 1. They describe what is dispensed; they are not a list a doctor prescribes from.

---

## 3. How medicines are classified for supply

A classification scheme only. No substance lists were copied.

- **The national standard:** the Poisons Standard, also cited as the "Standard for the Uniform Scheduling of Medicines and Poisons". The most recent edition found is the "Therapeutic Goods (Poisons Standard—June 2026) Instrument 2026" — alternative citation "Standard for the Uniform Scheduling of Medicines and Poisons No. 48" — dated 27 May 2026, commencing 1 June 2026, "made under paragraph 52D(2)(b) of the Therapeutic Goods Act 1989". Source: <https://www.legislation.gov.au/F2026L00633/asmade/2026-05-28/text/original/epub/OEBPS/document_1/document_1.html>. A later edition may exist; that was not checked.
- **What it does:** "This instrument lists poisons in 10 Schedules according to the degree of control recommended to be exercised" "over their availability to the public."
- **The schedules, headings as printed in the instrument:**

| Schedule | Heading in the instrument |
|---|---|
| 1 | Blank ("This Schedule is intentionally blank.") |
| 2 | Pharmacy medicines |
| 3 | Pharmacist only medicines |
| 4 | Prescription only medicines and prescription animal remedies |
| 5 | Caution |
| 6 | Poisons |
| 7 | Dangerous poisons |
| 8 | Controlled drugs |
| 9 | Prohibited substances |
| 10 | Substances of such danger to health as to warrant prohibition of supply and use |

- **Who gives it legal force:** the states and territories. The instrument describes its schedules "as recommendations to Australian States and Territories", says "The scheduling of poisons is implemented through relevant State and Territory legislation", and "For the legal definitions, however, it is necessary to check with each relevant State or Territory authority."
- **State variation, two examples found:**
  - South Australia: "The Poisons Standard is adopted by reference in the Controlled Substances (Poisons) Regulations 2026" "(regulation 3), excluding sections 54(1) and (2), 57, 58, 59, 60 and 64; and appendices B, D and J." Its page calls Schedule 8 "Controlled drugs (drugs of dependence)". Source: <https://www.sahealth.sa.gov.au/wps/wcm/connect/Public%20Content/SA%20Health%20Internet/About%20us/Legislation/Controlled%20substances%20legislation/Scheduling%20of%20medicines%20and%20poisons>
  - New South Wales has an extra tier inside Schedule 4: some prescription-only medicines are "regulated as Schedule 4D (S4D) medicines in the Medicines, Poisons and Therapeutic Goods Regulation 2026", with the page stating that new NSW medicines legislation takes over from 5 November 2026. Source: <https://www.health.nsw.gov.au/pharmaceutical/Pages/medicine-laws-schedule-4d.aspx> (current as at 7 July 2026).
- **For the product:** the schedule of a medicine is a national recommendation plus eight sets of state and territory rules. No machine-readable official file that gives the schedule per product was found (see section B).

---

## 4. Naming

### Which names are official

- Australia's official ingredient names are the Australian Approved Names (the fetched article uses the abbreviation "AANs"). The TGA "has updated some medicine and ingredient names to be consistent" "with International Non-proprietary Names (INNs) wherever possible." Source: "Changing Australian medicine names", Australian Prescriber 2017;40:98–100, <https://australianprescriber.tg.org.au/articles/changing-australian-medicine-names.html> (SECONDARY to the TGA's own list, which could not be read).
- **Timing, from the same article:** changes began in April 2016; most had a four-year transition; a short list had seven years with dual labelling.
- **Dual labelling:** "dual labelling will be required. This will consist of the new INN name and the old approved name in parentheses afterwards." Example in the article: "furosemide (frusemide)" until 2023.
- **Permanent dual names:** "Adrenaline and noradrenaline will now always be known dually as 'adrenaline (epinephrine)' and 'noradrenaline (norepinephrine)'."
- **The PBS's own list of renamed ingredients** (PBS, 2017; the document says more than 200 active ingredients were renamed): <https://www.pbs.gov.au/news/2017/05/ihin-files/international-harmonisation-of-ingredient-names-pbs-changes.pdf>. Pairs printed there include, exactly as shown: frusemide → furosemide (frusemide); lignocaine → lidocaine (lignocaine); eformoterol → formoterol (eformoterol); thyroxine sodium → levothyroxine sodium; amoxycillin → amoxicillin; cephalexin → cefalexin monohydrate; cyclosporin → ciclosporin; oestradiol → estradiol; dexamphetamine sulfate → dexamfetamine sulfate; indomethacin → indometacin. The full table of 35 pairs is in that document.

### What this means for the top list

- The ranking in section 1 uses the new names: CEFALEXIN (rank 9), AMOXICILLIN (rank 10), LEVOTHYROXINE (rank 41).
- **Old names survive inside brand names.** The official brand table (section C) prints "APO-Cephalexin®" for CEFALEXIN, "APO-Amoxycillin®" for AMOXICILLIN and "APO-Frusemide®" for FUROSEMIDE. A search box must find a medicine under both spellings.
- The PBS writes salts and forms in the product line, not in the drug name: for example "metformin hydrochloride 500 mg tablet", "candesartan cilexetil 8 mg tablet", "perindopril arginine 5 mg tablet" and "perindopril erbumine 4 mg tablet" under METFORMIN, CANDESARTAN and PERINDOPRIL (PBS medicine search pages, section C).

### Names that differ from United States usage

Only where a fetched source shows both names. The source is the Australian Prescriber article above, which says: "Some medicine names will not change because the INN is already being used in Australia." "Examples include paracetamol, glibenclamide and salbutamol" "...in many other countries they are known as acetaminophen, glyburide and albuterol." The article says "many other countries"; it does not name the United States.

| In the Australian top list | Other name shown by the source |
|---|---|
| PARACETAMOL (rank 45); PARACETAMOL + CODEINE (rank 25) | acetaminophen |
| SALBUTAMOL (rank 16) | albuterol |

Adrenaline (epinephrine) and noradrenaline (norepinephrine) carry both names permanently but are not in the top 50. No other name in the list was flagged, because no fetched source shows a second name for it.

### Active ingredient prescribing

Source: Australian Commission on Safety and Quality in Health Care, "Active ingredient prescribing — User guide for Australian prescribers", December 2020, <https://www.safetyandquality.gov.au/sites/default/files/2020-12/active_ingredient_prescribing_-_user_guide_for_australian_prescribers.pdf> (licence CC BY-NC-ND 4.0).

- "From 1 February 2021 most prescriptions generated for supply under the PBS and the RPBS must meet" the active-ingredient requirements to be eligible for subsidy. Legal basis named in the guide: the "National Health (Pharmaceutical Benefits) Amendment (Active Ingredient Prescribing) Regulations 2019" and the matching veterans' instrument.
- The prescription states the active ingredient "(followed by a brand if indicated as necessary by the prescriber)".
- Out of scope, as listed in the guide: "Handwritten prescriptions"; "Computer generated paper-based National Residential Medication Charts"; "Prescriptions generated through a free text function within prescribing software"; "Medicines containing four or more active ingredients"; items in the "Various" section of the PBS and RPBS schedules.
- Two official lists steer the brand question: the List of Excluded Medicinal Items (LEMI), a "List of medicines and supplementary pharmaceuticals to be prescribed by brand name only", and the List of Medicines for Brand Consideration (LMBC), a "List of medicines prescribers should consider prescribing by brand name in addition to active ingredient name."
- **For the product:** any Australian prescription output would have to lead with the active ingredient. This is a design constraint, not something this research switches on.

---

## 5. Electronic prescribing — context and open questions

What the Department of Health, Disability and Ageing page says (<https://www.health.gov.au/our-work/electronic-prescribing>):

- An electronic prescription "is a secure, and convenient, alternative to paper prescriptions"; paper remains an option.
- The patient receives a token (usually a QR code) by SMS or email, or uses an Active Script List: "The ASL is a token management solution which securely stores electronic prescriptions in one place."
- "The NPDS is Australia's secure, government-funded system" for transferring prescriptions — the National Prescription Delivery Service, run by Fred IT Group through the eRx Script Exchange under a government contract, launched 1 July 2023.
- Prescribers and pharmacists "must use clinical software that meets the Electronic Prescribing Conformance Scheme", maintained by the Australian Digital Health Agency.
- "Electronic prescribing by default replaces the earlier plan for mandatory electronic prescribing"; the page gives no date.
- Legal basis named: the National Health (Pharmaceutical Benefits) Regulations 2017, plus state and territory laws.

The ADHA developer site lists the documents a software maker works through (titles only, <https://developer.digitalhealth.gov.au/resources/electronic-prescribing/faqs>): "Electronic Prescribing - Connecting Systems - Conformance Profile v3.0.1", "Electronic Prescribing - Conformance Test Specifications - Prescribing Systems v3.0.3", "Electronic Prescribing - Declaration of Conformance v2.0", "Electronic Prescribing - National Requirements for Electronic Prescriptions v1.0", "Electronic Prescribing - NPDS and ASLR", "Electronic Prescribing Sunset Dates for Conformance Profiles", "HI Service - Additional requirements for Electronic Prescribing".

Questions for the owner — none of these is answered here:

1. Does Notya intend to issue Australian prescriptions at all, or only to record the medicines a doctor mentions in a note? Only the first brings the conformance scheme into play.
2. If it does: who performs the conformance testing and declaration, and what does connecting to the NPDS and the Healthcare Identifiers Service require of a foreign company?
3. Is a medicine list keyed to PBS item codes and AMT codes a requirement of the conformance profile? The documents were not read.
4. Does the embargo API (section 2.1) accept a vendor whose software is not yet a conformant prescribing system?

---

## 6. What a names list for the product would be

| Candidate | What it gives | Size | Format, update | Licence |
|---|---|---|---|---|
| **PBS Schedule — PBS API CSV files** | Every subsidised medicine: generic name, brand name, form and strength, route, responsible company, item code, restriction level, ATC code, AMT codes | ZIP 5 MB per month; record count not verified | CSV (or JSON through the API); first day of every month | Website copyright "all rights are reserved" apart from personal reference use; no API terms published — **ask the department** |
| **AMT (SNOMED CT-AU)** | All commonly used medicines, subsidised or not, with coded generic and trade concepts, "machine-readable strengths and pack sizes" | "116 000 concepts" (2019 figure) | RF2; monthly; login required | Free on registration and acceptance of two licence agreements; obligations in 2.5 |
| **ARTG** | Everything that may legally be supplied, with sponsor | 97,004 entries of all kinds | Web search; bulk export not confirmed | Not verified |

**The right first source for a searchable NAMES list is the PBS API CSV file set**: it is one small monthly download, it already pairs each generic name with every subsidised brand, and it is the list Australian doctors actually prescribe against. Its gap is medicines that are not subsidised (private prescriptions, most pharmacy and pharmacist-only products); AMT fills that gap.

**What could not be taken from any of them: dosing.** The PBS data dictionary shows supply limits (maximum quantity, number of repeats) and restriction text, which are reimbursement rules, not dosing, and must not be presented as dosing. The licensed sources of dosing that exist, by name — **a licence is needed for each**: the Australian Medicines Handbook (Australian Medicines Handbook Pty Ltd), Therapeutic Guidelines (Therapeutic Guidelines Limited), MIMS (MIMS Australia Pty Ltd). The sponsors' Product Information documents on the TGA site also hold dosing, under the single-copy terms in 2.4.

---

## A. How the Turkish product holds medicines (read-only inspection of this repository)

Nothing under `countries/` or `lib/ulke/` was read for this section. There are three separate things.

### A.1 The product catalogue — `data/sgk-ilaclar.json`

- **Records: 8,649.** One record per reimbursed **pack** (per barcode), not per molecule.
- **File header:** `kaynak: "SGK EK-4/A"`, `guncelleme: "2026-08-26"`, `titck: "2026-08-26"`.
- **Where the data came from, as the repository says:** `scripts/import-sgk-ilac.mjs` turns the SGK "Bedeli Ödenecek İlaçlar Listesi" (EK-4/A) spreadsheets into this file. `scripts/import-titck-etken.mjs` then joins, by barcode, the TİTCK "Ruhsatlı Beşeri Tıbbi Ürünler Listesi" to add the active ingredient and the ATC code, because the SGK list carries no active ingredient.
- **Fields of a record, with how many of the 8,649 records have each:**

| Field | Meaning | Filled |
|---|---|---|
| `ad` | Full product name as SGK writes it — brand, strength, form and pack size in one string | 8,649 |
| `marka` | Brand: the leading words of `ad` before the strength, cut out by the import script | 8,649 |
| `sgk` | Reimbursed by SGK (true) | 8,649 |
| `kamuNo` | SGK public number | 8,648 |
| `barkod` | Barcode — the join key, and what e-reçete records | 8,648 |
| `etkenMadde` | Active ingredient (from TİTCK) | 8,435 |
| `etkenKaynak` | How the ingredient was matched: `titck` (direct barcode) or `esdeger` (inherited within an equivalence group) | 8,435 |
| `atc` | ATC code (from TİTCK) | 8,396 |
| `esdegerGrubu` | SGK equivalent-medicine group | 7,548 |
| `ruhsatAskida` | TİTCK licence-suspension code | 62 |

- The type `IlacKaydi` (`lib/ilac/ilacArama.ts`) also declares `form` and `doz`, but **no record in the file has either**. Strength and form exist only inside the `ad` text. **This file has no dosing, no prescription-status field and no route field.**
- **How it is used:** `app/api/doktor/ilac-ara/route.ts` searches brand, active ingredient and product name with typo tolerance and returns results grouped by brand, each brand carrying its packs (`sunumlar`) with barcode, equivalence group, ingredient, ATC and suspension flag.

### A.2 The curated clinical table — `lib/asistan/ilac/veri/*.ts`

- **Records: 176 molecules** in 12 files by therapeutic area (analjezik 12, antibiyotik 17, antiinfektif 15, dermRomatoloji 11, endokrin 17, gastrointestinal 13, hematoloji 7, kadinDogum 14, kardiyovaskuler 23, noropsikiyatri 24, solunumAlerji 16, urolojiDiger 7).
- **Type `TürkishDrug` (`lib/asistan/ilac/tipler.ts`), every field:** `name` (active ingredient, Turkish spelling); `brand[]` (common Turkish brand names); `dose` (adult posology line); `pediatricDose` (free text); `pediatrik` (structured paediatric dosing with units, ceilings, age bands and the source's own sentence); `form`; `sgkCovered`; `sgkRestriction`; `category`; `siniflar[]` (class labels); `alerjiSinifi[]`; `contraindications[]`; `interactions[]`; `etkilesimler[]` (structured interactions with severity); `yasKontrendikasyonAy`; `gebelik` (pregnancy category and line); `emzirme`; `bobrekDozUyarisi`; `karacigerDozUyarisi`; `renkliRecete`; `notes`; `kaynak` (source document, URL, and how it was verified).
- **Where the data came from, as the repository says:** each entry names its source. `kub()` is used only when the TİTCK KÜB (the Turkish product information document) "was actually fetched and read"; `literatur()` is for a named non-KÜB source. All 176 entries use `kub()`. No entry carries the "physician verified" status — the type file says so itself.

### A.3 The controlled-prescription classification — `lib/doktor/receteRengi.ts`

A short hand-kept list, matched by active ingredient, that sorts a medicine into normal, green or red prescription (TİTCK controlled medicines). It is the Turkish counterpart of "which Poisons Standard schedule".

### What "Turkish depth" therefore means

- **Depth 1 (catalogue):** generic name + every commercial name + pack-level product line + ATC + reimbursed flag + equivalence group + barcode. This is what the owner's example ("the generic name as well as the commercial names like Lipitor") describes, and it is what official Australian data can supply (section B).
- **Depth 2 (clinical table):** dosing, contraindications, interactions, pregnancy. In Türkiye this was written by reading the official product documents one molecule at a time. It is not a dataset import in either country.

---

## B. Australia, field by field: which official dataset supplies it

PBS API field names are from the PBS API Data Dictionary v3.7.8 (<https://data.pbs.gov.au/download/api/files/PBS-API-V3-Data-Dictionary-v3.7.8.pdf>). The fetch tool read only the first part of that document; the detailed sections for restrictions, prescribing texts, programs and schedules were cut off.

| Field (Turkish equivalent) | Official Australian source | Dataset, field | Format | Licence |
|---|---|---|---|---|
| Active ingredient (`etkenMadde`) | PBS Schedule | `/items`: `drug_name`, `li_drug_name` | CSV / JSON | PBS terms — to be confirmed (2.1) |
| | AMT | medicinal product concepts (`concept_type_code` MP) | RF2 | NCTS licences (2.5) |
| Every brand name (`marka`) | PBS Schedule | `/items`: `brand_name` | CSV / JSON | PBS terms |
| | AMT | trade product concepts (`concept_type_code` TPP, TPUU) | RF2 | NCTS licences |
| Sponsor / company | PBS Schedule | `/items`: `manufacturer_code`, `organisation_id` → `/organisations`: `name`, `abn`, address | CSV / JSON | PBS terms |
| | ARTG | sponsor on each entry | web search | not verified |
| Strength and form (inside `ad`) | PBS Schedule | `/items`: `schedule_form`, `li_form`; `pack_size`, `unit_of_measure` | CSV / JSON | PBS terms |
| | AMT | "machine-readable strengths and pack sizes" | RF2 | NCTS licences |
| Route | PBS Schedule | `/items`: `manner_of_administration`, `moa_preferred_term` | CSV / JSON | PBS terms |
| ATC code (`atc`) | PBS Schedule | `/atc-codes`, `/item-atc-relationships` | CSV / JSON | PBS terms |
| | PBS statistics | item drug map: `ITEM_CODE,DRUG_NAME,FORM/STRENGTH,ATC5_Code` | CSV, 836 KB | PBS terms |
| Reimbursed (`sgk`) and restriction level | PBS Schedule | presence in `/items`; `benefit_type_code` (U Unrestricted, R Restricted, A Authority Required, S Authority Required: Streamlined); `program_code`; `/restrictions` | CSV / JSON | PBS terms |
| Reimbursement item code (`kamuNo`) | PBS Schedule | `/items`: `pbs_code` | CSV / JSON | PBS terms |
| AMT identifiers | PBS Schedule | `/amt-items`: `amt_code`, `concept_type_code` (MP, MPP, MPUU, TPP, TPUU), `preferred_term` | CSV / JSON | PBS terms + NCTS licences for the codes' meaning |
| Equivalence between brands (`esdegerGrubu`) | PBS Schedule | brand-equivalence flag shown on PBS item pages ("a" = "Brand equivalent"); `/items`: `therapeutic_group_id`, `formulary`, `innovator_indicator` | web page; CSV / JSON | PBS terms. The API field that carries the "a" flag was **not identified** |
| Withdrawn or ending (`ruhsatAskida`) | PBS Schedule | `/items`: `non_effective_date`, `supply_only_indicator` (delisting, not licence status) | CSV / JSON | PBS terms |
| ARTG number | **not in the PBS data** (no ARTG field in the part of the dictionary that was read) | ARTG entry ID | web search; bulk export not confirmed | not verified |
| Poisons Standard schedule (`renkliRecete`) | **no open official dataset found** | The Poisons Standard is a legal text listing substances per schedule, with state variation (section 3). No per-product machine-readable file was found | — | — |
| Barcode (`barkod`) | **no open official source found** | No barcode field in the part of the PBS data dictionary that was read | — | — |
| Dosing text (`dose`, `pediatrik`) | **no open official dataset** | Sponsor Product Information on the TGA site; AMH; Therapeutic Guidelines; MIMS | PDF / licensed data | PI: single copy only, other use needs the sponsor's permission (2.4). The others need a licence |

**Dosing text specifically.** The official Product Information on the TGA site may be **linked**. Under its access terms the user may "download, store in cache, display, print and copy a single copy or part of a single copy", and for anything else "You must seek the permission of the Sponsor." Reproducing PI text inside the product is therefore not covered. The Turkish method of reading the official document and writing a short line with a citation would be a judgment call under these terms and needs legal advice before any text is written.

---

## C. Brand and generic names — sample, and the official brand ranking

### C.1 The sample file

`docs/medicines/au-brand-generic-sample.csv`, 57 rows, columns `generic_name,commercial_name,manufacturer_if_shown,strength_and_form_if_shown,register_url`. Every row was copied from a page fetched in this session. A brand that appears on both a PBS item page and in the report's brand table has one row for each source.

**The PBS medicine search could only be partly read from here.** The PBS site lists each medicine by form and strength, with every subsidised brand on the item page. Fetching those pages was stopped by rate limiting (HTTP 429) after two item pages had been read. So the sample is **not** "all brand names" for the 30 medicines. What it holds:

1. **Two complete PBS item pages** (all brands for that one form and strength):
   - ROSUVASTATIN, "rosuvastatin 20 mg tablet" — 11 brands. <https://www.pbs.gov.au/medicine/item/2574L-13588E>
   - PANTOPRAZOLE, "pantoprazole 40 mg enteric tablet, 30" — 12 brands. <https://www.pbs.gov.au/medicine/search?term=8007K-8008L-11681T-12277E-14330F-14362X-14394N>
2. **The official brand table of the PBS report** (Table 5(f), section C.2) — for each of the first 30 medicines, the brands that appear in the national top 50 brands.

Coverage of the first 30 medicines:

- Brands reached for 21: rosuvastatin, atorvastatin, pantoprazole, esomeprazole, escitalopram, perindopril, sertraline, cefalexin, amoxicillin, amlodipine, apixaban, telmisartan, candesartan, pregabalin, salbutamol, mirtazapine, irbesartan, amitriptyline, paracetamol + codeine, semaglutide, prednisolone.
- **No brand reached for 9:** metformin, venlafaxine, amoxicillin + clavulanic acid, oxycodone, perindopril + amlodipine, doxycycline, ramipril, fluoxetine, bisoprolol.

Notes on the rows:

- The PBS item page shows no company name beside a brand, so `manufacturer_if_shown` is empty throughout. The company is in the PBS data (`manufacturer_code`, section B).
- On the rosuvastatin page each brand cell carried the page's brand-equivalence flag glued to the name (for example "Crosuva 20a", "Crestora"; legend: "a" = "Brand equivalent"). The flag was removed. Each cleaned name was confirmed on a second fetched page: the PBS A–Z brand listing (<https://www.pbs.gov.au/browse/medicine-listing-with-brand?initial=r&type=brand>: "Rosuvastatin Lupin", "Rosuvastatin RBX", "Rosuvastatin Sandoz", "ROSUVASTATIN-WGR"), Table 5(f) ("APX-Rosuvastatin®", "Cavstat®", "Crestor®", "Rosuvastatin Sandoz®"), or the PBS search page's own suggestions ("Blooms Rosuvastatin"). "Crosuva 20", "Pharmacor Rosuvastatin 20" and "APO-ROSUVASTATIN" end in a digit or a capital before the flag, so the flag is unambiguous.
- Rows taken from Table 5(f) keep the "®" sign as the report prints it, and have no strength or form because the table gives none.

The forms and strengths the PBS lists for 26 of the 30 medicines were read from the PBS search pages (names only), and show how many item pages a full import covers: rosuvastatin 4, atorvastatin 4, pantoprazole 3, esomeprazole 4, escitalopram 3, perindopril 6, sertraline 2, metformin 5, cefalexin 4, amoxicillin 7, amlodipine 2, apixaban 4 rows (two strengths), telmisartan 2, candesartan 4, pregabalin 4, salbutamol 6, mirtazapine 6, venlafaxine 3, amoxicillin + clavulanic acid 4, irbesartan 3, oxycodone 13, amitriptyline 3, perindopril + amlodipine 4, doxycycline 6, paracetamol + codeine 2, ramipril 8. Search URL pattern: `https://www.pbs.gov.au/search?term=<name>&analyse=false&search-type=medicines`.

### C.2 Official ranking of brands — PBS report Table 5(f)

"Table 5(f): Top 50 PBS Brands by Highest Subsidised Prescriptions, 2024-25", sub-heading "Section 85 and Section 100, excluding under co-payment prescriptions and EFC". Data year 2024-25. Source: <https://www.pbs.gov.au/statistics/expenditure-prescriptions/2024-2025/Expenditure-prescriptions-report-tables-2024-25.PDF> (page 15). **This counts subsidised prescriptions only, so it is a different count from the ranking in section 1.** Copied exactly as returned, including the "®" signs:

| Rank | Brand Name | Drug Name | PBS Subsidised Prescriptions |
|---|---|---|---|
| 1 | Eliquis® | APIXABAN | 4,235,181 |
| 2 | Ozempic® | SEMAGLUTIDE | 2,819,445 |
| 3 | APX-Rosuvastatin® | ROSUVASTATIN | 2,708,291 |
| 4 | APO-Atorvastatin® | ATORVASTATIN | 2,511,956 |
| 5 | Vyvanse® | LISDEXAMFETAMINE | 2,196,196 |
| 6 | Jardiance® | EMPAGLIFLOZIN | 2,034,932 |
| 7 | Zempreon CFC-Free with dose counter® | SALBUTAMOL | 2,004,490 |
| 8 | Forxiga® | DAPAGLIFLOZIN | 1,915,722 |
| 9 | Rosuvastatin Sandoz® | ROSUVASTATIN | 1,852,075 |
| 10 | Xarelto® | RIVAROXABAN | 1,731,956 |
| 11 | APO-Esomeprazole® | ESOMEPRAZOLE | 1,606,430 |
| 12 | Doubluts® | DUTASTERIDE + TAMSULOSIN | 1,536,570 |
| 13 | Lipitor® | ATORVASTATIN | 1,469,593 |
| 14 | Pantoprazole Sandoz® | PANTOPRAZOLE | 1,413,773 |
| 15 | Atorvastatin SZ® | ATORVASTATIN | 1,359,320 |
| 16 | Palexia SR® | TAPENTADOL | 1,293,512 |
| 17 | APX-PANTOPRAZOLE® | PANTOPRAZOLE | 1,273,707 |
| 18 | Crestor® | ROSUVASTATIN | 1,188,573 |
| 19 | APO-Cephalexin® | CEFALEXIN | 1,185,522 |
| 20 | Somac® | PANTOPRAZOLE | 1,176,578 |
| 21 | Prolia® | DENOSUMAB | 1,161,398 |
| 22 | Esopreze® | ESOMEPRAZOLE | 1,130,573 |
| 23 | Sozol® | PANTOPRAZOLE | 1,087,355 |
| 24 | APO-Frusemide® | FUROSEMIDE | 1,048,154 |
| 25 | Cavstat® | ROSUVASTATIN | 1,002,368 |
| 26 | APO-Pregabalin® | PREGABALIN | 949,033 |
| 27 | Escitalopram Sandoz® | ESCITALOPRAM | 933,085 |
| 28 | APO-Sertraline® | SERTRALINE | 922,065 |
| 29 | APX-Mirtazapine® | MIRTAZAPINE | 913,730 |
| 30 | Atorvachol® | ATORVASTATIN | 883,273 |
| 31 | Xalatan® | LATANOPROST | 871,047 |
| 32 | Trajenta® | LINAGLIPTIN | 866,746 |
| 33 | APX-Paracetamol/Codeine® | PARACETAMOL + CODEINE | 855,222 |
| 34 | Hylo-Forte® | HYALURONATE SODIUM | 854,186 |
| 35 | APO-Irbesartan® | IRBESARTAN | 824,883 |
| 36 | Entresto® | SACUBITRIL + VALSARTAN | 821,450 |
| 37 | Osteomol 665 Paracetamol® | PARACETAMOL | 816,775 |
| 38 | APO-Candesartan® | CANDESARTAN | 792,999 |
| 39 | Panafcortelone® | PREDNISOLONE | 792,512 |
| 40 | APO-Perindopril® | PERINDOPRIL | 764,751 |
| 41 | Ritalin LA® | METHYLPHENIDATE | 740,811 |
| 42 | Nexium® | ESOMEPRAZOLE | 733,418 |
| 43 | APO-Telmisartan® | TELMISARTAN | 727,621 |
| 44 | ARDIX GLICLAZIDE 60mg MR® | GLICLAZIDE | 721,651 |
| 45 | Amlodipine Sandoz® | AMLODIPINE | 692,617 |
| 46 | Eleuphrat® | BETAMETHASONE DIPROPIONATE | 689,082 |
| 47 | APO-Amoxycillin® | AMOXICILLIN | 686,894 |
| 48 | Salpraz® | PANTOPRAZOLE | 686,070 |
| 49 | APO-Pantoprazole® | PANTOPRAZOLE | 674,203 |
| 50 | APX-Amitriptyline® | AMITRIPTYLINE | 672,532 |

This table was read once and not re-checked row by row against a second fetch (the ten-row check was done on the main list, section 1).

---

## D. Import plan to reach the Turkish depth

**The datasets could not be fetched from the environment this research ran in**: direct downloads from pbs.gov.au were refused by the network policy, the fetch tool cannot open ZIP or XLSX files, the Date of Supply files are 17.5 MB to 104 MB, and the AMT bundle needs a login. **The import must run on a machine that can download them.**

| Step | Dataset | Needs | Records | Fields it fills |
|---|---|---|---|---|
| 1 | PBS API CSV files (monthly ZIP, 5 MB) | Written confirmation of reuse terms from the department; no registration | Not verified. One row per brand × form and strength × item code. For scale only: the PBS item drug map is 836 KB at roughly 50–70 bytes a row, which suggests somewhere above ten thousand item codes including historical ones — an estimate from file size, not a count | Generic name, every subsidised brand, form and strength, route, company, PBS item code, restriction level, program, ATC code, AMT codes |
| 2 | PBS Date of Supply (monthly XLSX or yearly CSV) | Same terms | Aggregated to one row per drug name | Prescription count → the top-250 ranking and search ordering |
| 3 | AMT in SNOMED CT-AU (monthly RF2) | NCTS registration; two licence agreements; yearly usage survey; update, attribution and sublicence-register duties | "116 000 concepts" (2019 figure) | Medicines that are not subsidised (private prescriptions, pharmacy and pharmacist-only products); coded generic-to-brand links; strengths and pack sizes |
| 4 | ARTG | A bulk route was not confirmed; terms not verified | 97,004 entries of all kinds | ARTG number, sponsor, link to the PI and CMI documents |

**After steps 1–3 a record would be full for:** generic name, commercial names, form and strength, route, company, ATC code, reimbursed flag with restriction level, PBS item code, AMT codes, popularity rank. That matches the Turkish catalogue (A.1) and adds route, restriction level and company, which the Turkish file does not have.

**Empty after import, with the reason:**

- Barcode — no open official source found.
- Poisons Standard schedule — no machine-readable official source found; the national text plus state rules would have to be mapped by hand per substance, or licensed inside a commercial data product.
- ARTG number — until a bulk ARTG route is confirmed.
- Licence-suspension status — the PBS data gives delisting dates only.
- **Dosing and every other clinical field of the Turkish curated table (A.2)** — not available from any open official dataset. Licensed sources: AMH, Therapeutic Guidelines, MIMS. The TGA-published Product Information may be linked, not reproduced.

**Work, in the repository's own terms:** steps 1 and 2 are the same shape as the two existing Turkish scripts (`scripts/import-sgk-ilac.mjs`, `scripts/import-titck-etken.mjs`) — read a published file, join on a key, write one JSON file — with PBS item code in place of barcode. Step 3 is larger (RF2 is a relational release format). No effort in days is claimed here.

---

## Recommendation for the owner

**One route: build the Australian catalogue from the PBS API CSV files, ordered by the PBS Date of Supply counts, after getting the department's reuse terms in writing.**

1. **Ask first (one email).** Write to the department's PBS data contact (HPP.Support@Health.gov.au) and ask for the terms under which PBS Schedule data from the public API and the API CSV files may be used inside commercial clinical software, and whether Notya qualifies for the embargo API. The published website terms allow personal reference use only; the API pages publish no terms.
2. **Import where downloads work.** Run the import (section D, steps 1 and 2) on a machine with open internet. Output: one JSON file in the shape of `data/sgk-ilaclar.json`, plus a regenerated top-250 list from the Date of Supply data.
3. **Second pass, optional.** Register with the NCTS and add AMT for medicines outside the PBS.
4. **Keep dosing out.** Ship names only. If dosing is wanted later, it is a commercial licence (MIMS Integrated is the one sold to software developers; AMH and Therapeutic Guidelines would each need a negotiated licence) or a per-sponsor permission. Prices were not published on the pages read.

**What it costs:** no fee for the PBS data or for AMT on the pages read; one written permission; one registration with two licence agreements and ongoing duties (updates within 30 or 90 days, attribution notice, sublicence register, yearly survey); the import work in section D; a monthly refresh, because the Schedule changes on the first of every month.

**What it does not give:** dosing, interactions, contraindications, the Poisons Standard schedule per product, barcodes, and any right to issue Australian electronic prescriptions (section 5).

---

## Could not verify

**Not reachable from here:**

- **Direct downloads from pbs.gov.au** — refused by the network policy of this environment (proxy answered 403). Everything from the PBS was read through the page-fetch tool instead.
- **PBS report, pages after 18** — the PDF text was cut off part-way through Table 6(b). Not read: Tables 6(c) onward, 7 to 20, and **Appendix 2 "Technical Notes" (page 49)**, which is where the report would define its counting basis (date of supply or processing; whether RPBS is inside Table 6(a)). The Excel version came back as binary data.
- **PBS Date of Supply files** (104 MB XLSX; 17.5 MB CSV for 2024-25) — too large; the CSV fetch failed. This is why the ranking stops at 50 and **200 of the requested 250 ranks are missing**. The item drug map CSV was read for its header and first rows only.
- **PBS API CSV ZIP and the API itself** — not opened. Record counts for the PBS Schedule are therefore not verified.
- **PBS API Data Dictionary** — only the first part was read; the sections on restrictions, prescribing texts, programs and schedules were cut off. Whether any field holds an ARTG number, a barcode or the brand-equivalence flag is not settled.
- **PBS medicine search and item pages — rate limited (HTTP 429).** Refused and not retried: the search pages for semaglutide, fluoxetine, bisoprolol and prednisolone; the item pages for rosuvastatin 40 mg, 5 mg and 10 mg, atorvastatin 10 mg, 20 mg and 40 mg, esomeprazole 20 mg enteric tablet, escitalopram 10 mg tablet and metformin 500 mg tablet. After that no further item pages were requested. This is why the brand sample is partial.
- **healthdirect medicine page for paracetamol** — refused by the same rate limit; not retried.
- **TGA website** — the site blocks automated reading of most pages. Not read: the TGA copyright page; the scheduling basics page; the TGA's own list "Updating medicine ingredient names — list of affected ingredients"; ARTG search results for a product name; the ARTG visualisation tool. The naming section therefore rests on the Australian Prescriber article and the PBS's 2017 list.
- **ADHA website** (digitalhealth.gov.au electronic prescribing page and conformance register) — blocked. The conformance documents themselves were not read; only their titles.
- **AMT release files** — need an NCTS login. The AMT concept model (the definitions of MP, MPUU, MPP, TPP, TPUU, CTPP) was not read from an NCTS document; the type codes appear here only as the PBS data dictionary lists them.
- **SNOMED CT Affiliate License Agreement** — not read.

**Not established:**

- Whether Table 6(a) counts by date of supply and whether it includes RPBS items.
- Whether a newer Poisons Standard than June 2026 is in force. A TGA page that was reachable still named June 2024 as current, so that page is out of date.
- The current number of AMT concepts and of PBS items and brands.
- The commercial reuse terms of PBS Schedule data, ARTG data and TGA web content.
- Any ranking from the Australian Institute of Health and Welfare — a search found no AIHW table that ranks medicines by prescriptions; none was fetched.
- Whether the United States names in section 4 are specifically United States names: the source says "many other countries".
- State formularies of Victoria, South Australia, Tasmania, the Northern Territory and the ACT.
- Prices of AMH, Therapeutic Guidelines and MIMS licences.

## Verification record

The main source (the PBS report PDF) was opened a second time, after the CSV was written, and Table 6(a) was read again independently as `rank|name|total`. All 50 rows of `au-most-prescribed.csv` were compared with that second reading by a script: **50 of 50 identical, 0 differences**. Ten rows checked character by character: ranks 1 (ROSUVASTATIN, 16,045,498), 5 (ESCITALOPRAM, 6,468,288), 9 (CEFALEXIN, 5,099,619), 19 (AMOXICILLIN + CLAVULANIC ACID, 3,391,613), 23 (PERINDOPRIL + AMLODIPINE, 2,887,008), 25 (PARACETAMOL + CODEINE, 2,844,913), 36 (METOPROLOL TARTRATE, 2,406,425), 39 (DUTASTERIDE + TAMSULOSIN, 2,213,355), 42 (BUDESONIDE + FORMOTEROL, 2,146,794) and 50 (DAPAGLIFLOZIN, 1,915,899) — all identical. Both readings went through the same text-extraction tool, so this confirms the copy, not the tool.
