# Medicines research — Canada (`ca`)

Research only, written 2026-10-09 for the owner to decide on. No code and no pack file was changed; the
product's medicine slots for Canada stay empty and switched off.

**How to read this document**

- Every medicine name here and in the two CSV files was copied from a web page fetched in this session. The
  source link and the year of its data sit beside each list. Nothing was added, completed, corrected or
  reordered from memory. Where a source prints an odd spelling, the odd spelling is kept.
- Pages were read through an automated page reader (it returns the page's text). It cannot open Excel files,
  and several official sites refuse automated readers. Every such gap is listed under "Could not verify".
- This document contains no dosing, indications, interactions, warnings or prescribing advice. Product
  strengths appear only where they are part of how a register names a product.

Companion files:

- [`ca-most-prescribed.csv`](./ca-most-prescribed.csv) — 210 rows in 8 separate rankings (section 1).
- [`ca-brand-generic-sample.csv`](./ca-brand-generic-sample.csv) — 601 rows: generic name with the commercial
  names a register shows for it, for 30 medicines (section C).

---

## 1. Most commonly prescribed medicines

### The plain answer

**No official national ranking of individual medicines by number of prescriptions was found for Canada.**
The owner asked for a top 250. What exists, and what was reached, is this:

| What is ranked | By what | Ranks reached | Source type |
|---|---|---|---|
| Products (brand or manufacturer-prefixed names) | Number of prescriptions dispensed, national retail | **20** | Commercial (IQVIA) — SECONDARY |
| Therapeutic classes | Number of prescriptions dispensed, national retail | 10 | Commercial (IQVIA) — SECONDARY |
| Individual medicines | Number of people who received it, British Columbia public plan only | 10 | Official, one province |
| Therapeutic classes | Number of claimants, one federal program (NIHB) | 10 | Official, one program |
| Individual medicines | Public-plan drug **cost**, ten jurisdictions | 3 tables of 50 | Official (PMPRB) |
| Individual medicines | Public-plan expenditure, British Columbia | 10 | Official, one province |

So a list ranked by prescriptions stops at **20 of 250, and those 20 are products from a commercial source**.
From official sources there are **0 of 250** ranks by prescriptions. The official lists that are long (50 rows
each) rank by money, which is a different thing: the top of a cost ranking is dominated by expensive
specialty medicines, not by what is prescribed most often.

These rankings count different things and are **not** merged. The CSV keeps them as eight separate lists
(A to H); the rank restarts in each list and the `what_is_counted` column says, on every row, which list the
row belongs to and what was counted.

### What produced each list

**List A, B, C — PMPRB CompassRx (official; data year 2022/23; main source).**
The Patented Medicine Prices Review Board's *CompassRx, 10th edition: Annual Public Drug Plan Expenditure
Report, 2022/23*, published 2025-10-21, has a data companion page with five tables in plain HTML:
Table 1 "50 Top-Selling Medicines (Most Utilized Molecule/Strength/Form) by Drug Cost", Table 2 "Top 50
Patented Medicines by Drug Cost", Table 3 "Top 50 Multi-Source Generic Drugs by Drug Cost", Table 4 "Top 50
Single-Source Non-Patented Medicines by Drug Cost", Table 5 "Top 50 Manufacturers by Drug Cost".
Source: <https://www.canada.ca/en/patented-medicine-prices-review/services/npduis/analytical-studies/compassrx-10th-edition/data-companion-file.html>

- What is counted: drug cost accepted for reimbursement (including markups, before confidential rebates) in
  the public drug plans of British Columbia, Alberta, Saskatchewan, Manitoba, Ontario, New Brunswick, Nova
  Scotia, Prince Edward Island, Newfoundland and Labrador and Yukon. Quebec is not included; the NIHB program
  is excluded from this edition. Data come from CIHI's NPDUIS database.
  Source: <https://www.canada.ca/en/patented-medicine-prices-review/services/npduis/analytical-studies/compassrx-10th-edition.html>
- In the CSV: Table 3 (List A), Table 2 (List B) and Table 4 (List C), 150 rows. Table 3 is placed first
  because its entries are plain ingredient names. Table 1 is **not** in the CSV: its entries are
  molecule-plus-strength, it repeats medicines that are in Tables 2 to 4, and Table 5 ranks companies.
- Some Table 3 rows are group labels rather than one medicine, exactly as the source prints them:
  "Buprenorphine combinations", "Perindopril and diuretics", "Levodopa/decarboxylase inhibitor",
  "Timolol combinations".

**List D, E — British Columbia PharmaCare Trends (official; one province; data year 2023/2024).**
BC Ministry of Health, *PharmaCare Trends 2023/2024*, Table 16 "Top 10 drugs by number of PharmaCare
beneficiaries" and Table 15 "Top 10 drugs by PharmaCare expenditure". A beneficiary is "A B.C. resident with at
least one paid PharmaCare claim during the fiscal year." This is the only official table found that ranks
individual medicines by a count of people.
Source: <https://www2.gov.bc.ca/assets/gov/health/health-drug-coverage/pharmacare/pharmacare_trends_2023_2024.pdf>
(the 2022/2023 edition is at <https://www2.gov.bc.ca/assets/gov/health/health-drug-coverage/pharmacare/pharmacare_trends_2022_2023.pdf>)

**List F — Non-Insured Health Benefits annual report (official; one federal program; 2023 to 2024).**
Indigenous Services Canada, *NIHB Annual report 2023 to 2024*, Table 4.5 "NIHB Top ten therapeutic classes by
number of claimants". These are classes, not individual medicines. The report gives 959,207 eligible clients
as of March 31, 2024 and 583,416 pharmacy claimants. It also has Table 4.6, over-the-counter claims by
category (not copied).
Source: <https://www.sac-isc.gc.ca/eng/1742411301706/1742411337714>

**List G, H — IQVIA (SECONDARY: commercial, not official; data year 2025).**
IQVIA publishes free one-page summaries drawn from its CompuScript audit: "Top 20 Dispensed Drugs in Canada,
2025" and "Top 10 Therapeutic Classes in Canada, 2025". The count is "Estimated prescriptions dispensed in
Canadian retail pharmacies (excludes hospitals; includes new and refills)", in thousands, "Ethical market
only". The 20 entries are **products** (for example a brand and a manufacturer-prefixed generic of the same
molecule appear as separate rows), so this is not a ranking of molecules.
Sources: <https://www.iqvia.com/-/media/iqvia/pdfs/canada/2025-trends/english/top20dispensed_25.pdf>,
<https://www.iqvia.com/-/media/iqvia/pdfs/canada/2025-trends/english/top10therapeuticclasses_25.pdf>
(2024 edition: <https://www.iqvia.com/-/media/iqvia/pdfs/canada/2024-trends/english/top20dispensed_24.pdf>).
Copyright line on the 2025 page: "© 2026 IQVIA. All rights reserved."

### Official rankings that exist but are not in the CSV

- **CIHI, "Prescribed Drug Spending in Canada: A Focus on Public Drug Programs — Top 100 Drug Classes".**
  This is the hint the brief named. It ranks drug **classes** by public drug program **spending** (not
  individual medicines, not prescriptions). It is published only as an Excel file, which could not be opened
  here. Latest edition found: 2023 release with 2022 data
  (<https://www.cihi.ca/sites/default/files/document/prescribed-drug-spending-canada-top-100-drug-2022-data-tables-en.xlsx>,
  release page <https://www.cihi.ca/en/prescribed-drug-spending-in-canada-2023>). Since January 2025 CIHI
  publishes these tables through its Pharmaceutical Data Tool
  (<https://www.cihi.ca/en/pharmaceutical-data-tool>,
  <https://www.cihi.ca/sites/default/files/document/prescribed-drug-spending-pharm-data-tool-data-tables-en.xlsx>),
  also Excel only.
- **CIHI, *Drug Use Among Seniors in Canada, 2016*** (published 2018; people 65 and older with public drug
  program claims). Its Table 1 ranks ten drug classes by rate of use. The page reader returned them in this
  order and said it had condensed the table, so they are reported here and not in the CSV: HMG-CoA reductase
  inhibitors (statins); Proton pump inhibitors (PPIs); Angiotensin-converting enzyme (ACE) inhibitors,
  excluding combinations; Beta-blocking agents, selective; Dihydropyridine calcium channel blockers; Thyroid
  hormones; Angiotensin II antagonists, excluding combinations; Natural opium alkaloids; Biguanides;
  Benzodiazepine derivatives.
  Source: <https://www.cihi.ca/sites/default/files/document/drug-use-among-seniors-2016-en-web.pdf>
- **Statistics Canada, Canadian Health Measures Survey** (a survey of what people report taking, not a count
  of prescriptions). "Prescription medication use among Canadian adults, 2016 to 2019" (adults 18 to 79,
  medications taken in the past month) reports use by condition group only: high blood pressure 16%, high
  blood cholesterol 12%, mood disorders 10%.
  Source: <https://www150.statcan.gc.ca/n1/daily-quotidien/210628/dq210628e-eng.htm>.
  An older article (2007 to 2011 data) has a table of the top five medication **classes** by sex and age
  group: <https://www150.statcan.gc.ca/n1/pub/82-003-x/2014006/article/14032/tbl/tbl4-eng.htm>.
- **Ontario.** The Ontario Data Catalogue lists the "Ontario Drug Benefit (ODB) Database" (recipients,
  payment, claims) and states: "This data is not and will not be made available."
  Source: <https://data.ontario.ca/dataset/ontario-drug-benefit-odb-database>

### What would produce a true top 250, and who holds it

1. **IQVIA CompuScript** (commercial). IQVIA holds national retail dispensing estimates at product and
   molecule level; the free summary stops at 20 products. A molecule-level top 250 by prescriptions would be a
   purchased custom report. Step: ask IQVIA Canada for a quote and for the reuse terms (the free page is
   marked all rights reserved).
2. **CIHI NPDUIS** (official, public plans only). CIHI holds pan-Canadian claims-level prescription drug data
   from public drug programs (<https://www.cihi.ca/en/pharmaceutical-data-tool>). A ranking of chemicals by
   number of claims or claimants would have to be requested from CIHI; whether CIHI will produce it, at what
   cost, and whether it may be republished are questions to put to CIHI. It would cover publicly funded claims
   only, not all prescriptions.
3. **First step that costs nothing:** open the CIHI Excel files on an ordinary computer (they are public) and
   see how far their class and chemical tables go. They could not be opened from this environment.

---

## 2. Canada's "pharmacy lists"

Canada has one federal register of authorized products and many payer lists (one per province and territory,
plus federal programs). There is no single national formulary.

### Federal registers (Health Canada)

**Drug Product Database (DPD).** Health Canada's database of "drugs authorized for sale by Health Canada".
The overview page says it is updated nightly and that it carries product monographs for human drugs.
- Overview: <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database.html>
- Online query: <https://health-products.canada.ca/dpd-bdpp/index-eng.jsp>
- Data extract: "a series of compressed UTF-8 text files", "approximately 116 MB" uncompressed, with separate
  file sets for marketed, approved, cancelled and dormant products, "for human, veterinary, disinfectant and
  radiopharmaceutical use". Files on the page were marked "Last Updated 2026-10-05".
  <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/what-data-extract-drug-product-database.html>
- File structure (comma-separated, double-quoted; one table each for product, company, active ingredient,
  form, route, schedule, status, therapeutic class, packaging and more):
  <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/read-file-drug-product-database-data-extract.html>
- API (JSON or XML, English or French): <https://health-products.canada.ca/api/documentation/dpd-documentation-en.html>
- Licence: the dataset "Drug Product Database - All Files" is listed on the federal open data portal under the
  **Open Government Licence - Canada**, update frequency "Monthly":
  <https://open.canada.ca/data/en/dataset/bf55e42a-63cb-4556-bfd8-44f26e5a36fe>

**Canadian Clinical Drug Data Set (CCDD).** "a drug terminology and coding system" derived from the DPD, built
for e-prescribing and exchange between systems. Health Canada "will be the owner of the product with the
responsibility for publication and ongoing maintenance". It has three levels: Therapeutic Moiety (TM, the
ingredient), Non-proprietary Therapeutic Product (NTP, ingredient + strength + form, not brand-specific) and
Manufactured Product (MP, the brand-specific product, coded by DIN), with English and French descriptions.
- Open data record (publisher Health Canada, update "Monthly", CSV files, **Open Government Licence - Canada**):
  <https://open.canada.ca/data/en/dataset/3e0a7b9e-a5e9-4131-bde4-ac685a1f1a38>
- Files: <https://health-products.canada.ca/ccdd/tm>, <https://health-products.canada.ca/ccdd/ntp>,
  <https://health-products.canada.ca/ccdd/mp>, <https://health-products.canada.ca/ccdd/mp_ntp_tm_relationship_en>,
  <https://health-products.canada.ca/ccdd/mp_ntp_tm_relationship_fr>, data dictionary
  <https://health-products.canada.ca/ccdd/data_dictionary>
- Background: <https://infoscribe.infoway-inforoute.ca/x/4wCzE>; Canada Health Infoway also distributes it
  through its Terminology Gateway (login required): <https://sl.infoway-inforoute.ca/en/standards/canadian/ccdd>

**Licensed Natural Health Products Database (LNHPD).** Product-specific information on natural health
products licensed by Health Canada. Data extract as zipped text files ("approximately 30 MB" uncompressed);
the page says the extracts were "Last updated: September 28, 2017" and refers to separate LNHPD terms and
conditions for copyright. An API guide exists.
- <https://www.canada.ca/en/health-canada/services/drugs-health-products/natural-non-prescription/applications-submissions/product-licensing/licensed-natural-health-product-database-data-extract.html>
- <https://health-products.canada.ca/api/documentation/lnhpd-documentation-en.html>

**Prescription Drug List (PDL).** See section 3.

### The Open Government Licence – Canada (quoted)

Text: <https://open.canada.ca/en/open-government-licence-canada> ("This is version 2.0 of the Open Government
Licence – Canada.")

- Grant: a "worldwide, royalty-free, perpetual, non-exclusive licence" to "Copy, modify, publish, translate,
  adapt, distribute or otherwise use the Information in any medium, mode or format"; commercial use is
  included.
- Condition: acknowledge the source with the provider's attribution statement, or, where none is given, with:
  "Contains information licensed under the Open Government Licence – Canada."
- Not covered: "Personal Information;" "third party rights the Information Provider is not authorized to
  license;" "the names, crests, logos, or other official symbols of the Information Provider; and"
  "Information subject to other intellectual property rights, including patents, trade-marks and official
  marks."
- No endorsement may be implied, and "The Information is licensed "as is"".

A caution: the general terms of the canada.ca website say "you may not reproduce materials on this site, in
whole or in part, for the purposes of commercial redistribution" without "prior written permission from the
copyright administrator" (<https://www.canada.ca/en/transparency/terms.html>). The open-data records above
name the Open Government Licence for the DPD and CCDD datasets specifically. Before shipping, get one written
confirmation from Health Canada that the DPD and CCDD extracts may be used in a commercial product under that
licence (contact given on the DPD pages: hc.osip.sys-bppi.sc@canada.ca).

### Provincial and territorial public-plan formularies

Health Canada's own list of the programs:
<https://www.canada.ca/en/health-canada/services/health-care-system/pharmaceuticals/access-insurance-coverage-prescription-medicines/provincial-territorial-public-drug-benefit-programs.html>
(program names as that page labels them are in the second column).

| Jurisdiction | Program name on Health Canada's page | Formulary found | Status of the link |
|---|---|---|---|
| Ontario | Drug Benefit Program | Ontario Drug Benefit Formulary / Comparative Drug Index, "Formulary Search", version 2.17, effective September 29, 2026: <https://www.formulary.health.gov.on.ca/formulary/> | Opened and searched. Footer: "(c) King's Printer for Ontario 2023" |
| Quebec | Prescription Drug Insurance | RAMQ "Liste des médicaments", "la liste réglementaire de tous les formats des médicaments couverts": <https://www.ramq.gouv.qc.ca/fr/professionnels/pharmaciens/medicaments/Pages/liste-medicaments.aspx> | Opened. No copyright or reuse statement on the page |
| British Columbia | Pharmacare | PharmaCare Trends report (section 1). The formulary search page could not be opened | Not confirmed |
| Alberta | Prescription Drug Programs | Interactive Drug Benefit List (iDBL), hosted by Alberta Blue Cross: <https://ab.bluecross.ca/dbl/idbl_main1.php> | From search results; page not opened (refused, rate limit) |
| Manitoba | Pharmacare Program | Drug Benefits & Interchangeability Formulary: <https://www.gov.mb.ca/health/mdbif/> | From search results; not opened |
| New Brunswick | Prescription Drug Program | NB Drug Plans Formulary: <https://www.gnb.ca/en/topic/health-wellness/nb-drug-plans/drug-plans-formulary.html> | From search results; not opened |
| Nova Scotia | Pharmacare | Nova Scotia Formulary: <https://novascotia.ca/dhw/pharmacare/formulary.asp> | From search results; not opened |
| Saskatchewan | Drug Plan | Not found in this session | Not confirmed |
| Prince Edward Island | Drug Cost Assistance Programs | Not found in this session | Not confirmed |
| Newfoundland and Labrador | Pharmaceutical Services | Not found in this session | Not confirmed |
| Yukon | (no name given) | <https://yukon.ca/en/pharmacare> | From search results; not opened |
| Northwest Territories, Nunavut | (no name given) | Not found in this session | Not confirmed |

For every provincial list the same three facts are still needed before any reuse: whether a data file can be
downloaded, how often it changes, and the Crown-copyright terms of that province. Only Ontario's and Quebec's
pages were read, and neither shows a reuse licence.

CIHI publishes a cross-province table, "Formulary Coverage in the Pharmaceutical Data Tool" (published May 14,
2026), as an Excel file that could not be opened here:
<https://www.cihi.ca/sites/default/files/document/formulary-coverage-data-tool-data-table-en.xlsx>

### Federal payer list, reimbursement reviews, licensed compendium

- **NIHB Drug Benefit List** (Indigenous Services Canada; the drug list of the Non-Insured Health Benefits
  program). A page titled "Non-Insured Health Benefits: Drug benefit list" exists at
  <https://www.canada.ca/en/indigenous-services-canada/services/non-insured-health-benefits-first-nations-inuit/benefits-services-under-non-insured-health-benefits-program/drugs-pharmacy-benefits/drug-benefit-list.html>
  but refuses automated readers, so its contents, download and terms were not read.
- **Canada's Drug Agency (CDA-AMC, formerly CADTH) reimbursement reviews.** Search results show the report
  index at <https://www.cadth.ca/reimbursement-review-reports> and <https://www.cda-amc.ca>. The site could not
  be opened from this environment, so nothing about its content or terms is stated here.
- **Compendium of Pharmaceuticals and Specialties (CPS)** — Canadian Pharmacists Association; "The Canadian
  standard for drug and therapeutic content", with monographs for "thousands of products", sold by
  subscription in English and French. It is a licensed product; the page refers licensing questions to the
  association. <https://www.pharmacists.ca/products-services/cps-subscriptions/>

---

## 3. How medicines are classified for supply (classification scheme only)

**Federal: the Prescription Drug List.** It "identifies which medications are prescription drugs at the
federal level", under the Food and Drugs Act; it replaced Schedule F to the Food and Drug Regulations on
December 19, 2013; it has a list for human use and a list for veterinary use. Controlled substances are not
on it: "Instead, they are listed in the Schedules to the Controlled Drugs and Substances Act."
"Radiopharmaceutical drugs are also not on the Prescription Drug List."
- <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/prescription-drug-list.html>
- The list itself: <https://hpr-rps.hres.ca/pdl.php?lang=en>

**Federal: the schedule recorded on each product in the DPD.** The DPD assigns each product one or more of:
Prescription; Prescription Recommended; Non-Prescription; Ethical; Schedule C; Schedule D; Narcotics (CDSA I);
Narcotics (CDSA II); Controlled Drugs (CDSA I); Controlled Drugs (CDSA III); Controlled Drugs (CDSA IV);
Targeted Substances (CDSA I); Targeted Substances (CDSA IV); CDSA Recommended. The page ties these to the
Controlled Drugs and Substances Act schedules, the Narcotic Control Regulations, Part G of the Food and Drug
Regulations and the Benzodiazepines and Other Targeted Substances Regulations.
- <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/terminology.html>

**Provinces: the NAPRA National Drug Schedules (NDS).** Published by the National Association of Pharmacy
Regulatory Authorities. The NDS page offers a search by drug name, schedule (I, II, III, U) and footnote, and a
"Download the NDS" spreadsheet. It states that "the Health Canada PDL and the CSDA take precedence" where
they differ. Footer: "© Copyright National Association of Pharmacy Regulatory Authorities. All Rights
Reserved." No reuse terms are given, so the NDS list is **not** open data.
- <https://www.napra.ca/national-drug-schedules/>
- The definitions of Schedule I, II, III and Unscheduled, and the page saying which provinces follow the NDS,
  were not on the page that could be read (see "Could not verify").

**Quebec has its own regulation.** "Règlement sur les conditions et modalités de vente des médicaments"
(P-10, r. 12), under the Loi sur la pharmacie, "À jour au 1er juin 2026". Its schedules: Annexe I (human
medicines sold on prescription), Annexe II (sold without prescription, by a pharmacist, kept out of public
reach), Annexe III (sold without prescription under pharmacist supervision, may be in a public area of the
pharmacy), Annexe IV and V (veterinary).
- <https://www.legisquebec.gouv.qc.ca/fr/document/rc/P-10,%20r.%2012>

**Controlled substances.** The Controlled Drugs and Substances Act
(<https://laws-lois.justice.gc.ca/eng/acts/c-38.8/>) could not be opened (the site refuses automated
readers). What is stated above about it comes from the two Health Canada pages cited.

---

## 4. Naming

- **Official ingredient names follow INN.** Health Canada's DPD terminology page: "The International
  Nonproprietary Names (INN) is used as Health Canada's standard to assign the preferred name" to ingredients.
  <https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/terminology.html>
- **The product name on the register is the brand name.** Same page, "Product Name": "This is the brand name,
  as defined in subsection C.01.001(1) of the Food and Drug Regulations". The page does not define "proper
  name" or "common name"; those definitions were not verified.
- **The register is bilingual.** The DPD extract carries French columns beside the English ones (for example
  `BRAND_NAME_F`, `INGREDIENT_F`, `PHARMACEUTICAL_FORM_F`, `ROUTE_OF_ADMINISTRATION_F`, `SCHEDULE_F`), and the
  API takes `lang=fr`. "The CCDD files contain French descriptions since the December 2019 release."
  Sources: the DPD read-me page and <https://sl.infoway-inforoute.ca/en/standards/canadian/ccdd>
- **Differences from United States usage: none can be flagged.** The rule was to flag a difference only where
  the sources show both names, and no source fetched here shows a United States name beside the Canadian one.
  (For example, a Health Canada advisory uses only "salbutamol":
  <https://recalls-rappels.canada.ca/en/alert-recall/shortage-salbutamol-inhalers-canada>.)
- **Differences between Canadian sources that the lists do show** (useful for a names search):
  - The PMPRB table prints the WHO/ATC-style name "Oxycodone/paracetamol"; the Ontario formulary prints
    "OXYCODONE HCL & ACETAMINOPHEN", BC prints "acetaminophen/codeine/caffeine" (2022/2023 table), IQVIA prints
    "ACETAMINOPHEN". The same substance appears under two names depending on the source.
  - PMPRB prints "Mycophenolic acid", "Valproic acid", "Risedronic acid"; the Ontario formulary lists the same
    search under "MYCOPHENOLATE MOFETIL" and "MYCOPHENOLATE SODIUM".
  - BC and Ontario print the salt ("rosuvastatin calcium", "METFORMIN HCL", "amlodipine besylate",
    "salbutamol sulphate"); PMPRB prints the base name ("Rosuvastatin", "Metformin").
  - IQVIA's 2025 page prints "TEVA SALBTAMOL HFA" (its 2024 page prints "TEVA-SALBUTAMOL HFA"). The 2025
    spelling was read twice and is kept as printed.

---

## 5. Electronic prescribing (context and questions; no claims)

- **PrescribeIT.** A trade publication reported on 2026-02-18 that Canada Health Infoway announced PrescribeIT
  would shut down on May 29, citing low adoption (a government estimate of fewer than 5% of prescriptions)
  and no federal-provincial-territorial cost-sharing; more than $250 million had been spent since 2017. Infoway
  said a "national e-prescribing standard" would remain and that it "will continue to maintain the standard".
  Source (secondary, news): <https://www.canhealth.com/2026/02/18/infoway-pulls-the-plug-on-prescribeit/>.
  Whether the shutdown happened on that date was not checked.
- **Alberta.** The Pharmaceutical Information Network (PIN) is "a web-enabled application within the Alberta
  Netcare Electronic Health Record"; it holds dispensing data from community pharmacies and lists "the ability
  to create prescriptions" as a feature.
  <https://www.albertanetcare.ca/learningcentre/Pharmaceutical-Information-Network.htm>
- **The CCDD** has supporting e-prescribing in Canada as its stated focus (section 2), which is why it is the
  natural coding for any future prescription message.

Questions for the owner, to answer before any prescribing feature is designed for Canada:
1. Is a prescription printed on paper or faxed from the product enough for the first Canadian users? (The
   article above says most prescriptions still travel by fax or paper.)
2. Which province comes first? Drug information systems and their connection rules are provincial; only
   Alberta's was read here.
3. Does the national e-prescribing standard that replaces PrescribeIT have a published specification and a
   conformance process? Not read here.

---

## 6. What a names list for the product would be

**The right source for a searchable list of medicine names is the Canadian Clinical Drug Data Set, with the
Drug Product Database behind it.**

| | CCDD | DPD data extract |
|---|---|---|
| Publisher | Health Canada | Health Canada |
| What a row is | TM = ingredient; NTP = ingredient + strength + form; MP = brand product (by DIN) | One authorized product (DIN), with its ingredients, form, route, schedule, status, ATC, company, packaging |
| Names it gives | Generic (TM), generic clinical product (NTP), brand product (MP), each in English and French | Brand name and ingredient names in English and French |
| Format | CSV files | Zipped comma-separated text files; also a JSON/XML API |
| Size | Not stated on the pages read | "approximately 116 MB" uncompressed for all file sets; marketed set `allfiles.zip` listed at 1,479 KB |
| Update | "Monthly" | Online database updated nightly; open-data record says "Monthly"; files marked "Last Updated 2026-10-05" |
| Licence | Open Government Licence - Canada | Open Government Licence - Canada |

Record counts are not printed on any page that was read; they have to be counted when the files are
downloaded.

**What cannot be taken from them:** neither dataset has dosing, indications, contraindications, interactions,
pregnancy or renal and hepatic information. The DPD's `DOSAGE_VALUE` / `DOSAGE_UNIT` columns sit in the
active-ingredient table beside strength; they describe the product's composition, not how to prescribe it.

**Licensed sources of dosing (a licence is needed for each):**
- CPS — Canadian Pharmacists Association (<https://www.pharmacists.ca/products-services/cps-subscriptions/>).
  Its page also names "Lexidrug" as the interaction checker it bundles.
- Manufacturers' product monographs, reachable through the DPD online query. Whether they may be reproduced
  is covered in section B; treat them as link-only.
- Other commercial drug knowledge bases are sold to Canadian software vendors. None was checked in this
  session, so none is named here as verified.

---

## A. How the Turkish product holds medicines (read from this repository, read-only)

The Turkish product has **two layers**, and they are different things.

**Layer 1 — the product search list.** File `data/sgk-ilaclar.json`, type `IlacKaydi` in
`lib/ilac/ilacArama.ts`, built by `scripts/import-sgk-ilac.mjs`.
- **8,649 records**, one per reimbursed product pack. The file header says `kaynak: "SGK EK-4/A"` and
  `guncelleme: "2026-08-26"`; the import script reads SGK's published "Bedeli Ödenecek İlaçlar Listesi"
  spreadsheets and applies the weekly add/remove files.
- Fields: `ad` (full product name with strength, form and pack size), `marka` (brand, cut from the start of
  `ad`), `etkenMadde` (active ingredient; present on 8,435 records), `atc` (ATC code; 8,396 records),
  `etkenKaynak` (`titck` = matched by barcode to the regulator's licensed-products list, `esdeger` = inherited
  from the equivalence group), `barkod` (barcode), `kamuNo` (public payer number), `esdegerGrubu` (equivalent
  product group), `sgk` (reimbursed: true), `ruhsatAskida` (licence suspension code; 62 records). The type
  also allows `form` and `doz`, which no record in the file carries.

**Layer 2 — the clinical table.** Type `TürkishDrug` in `lib/asistan/ilac/tipler.ts`, data in twelve files
under `lib/asistan/ilac/veri/`, joined in `lib/asistan/turkishDrugs.ts`.
- **176 molecules.** Every entry names its source document; all 176 use the `kub()` constructor, which the
  code reserves for a regulator product summary (TİTCK KÜB) "that was actually fetched and read". No entry is
  marked as signed off by a physician.
- Fields: `name` (active ingredient), `brand[]` (common brand names), `dose` (adult dosing line),
  `pediatricDose` and structured `pediatrik` (range, unit, daily ceiling, age bands, the source's own
  sentence), `form`, `sgkCovered`, `sgkRestriction`, `category`, `siniflar` (class labels), `alerjiSinifi`
  (allergy cross-reactivity group), `contraindications[]`, `interactions[]` and structured `etkilesimler`
  (with severity), `yasKontrendikasyonAy` (minimum age), `gebelik` (pregnancy category and line), `emzirme`
  (lactation), `bobrekDozUyarisi` / `karacigerDozUyarisi` (renal and hepatic flags), `renkliRecete`
  (controlled-prescription colour), `notes`, `kaynak` (source document, URL, how verified).

So "Turkish depth" means: a full product list with brand, ingredient, ATC, pack identifier and reimbursement
(Layer 1, from two official datasets), and a much smaller hand-sourced clinical table (Layer 2, from regulator
documents). Layer 1 can be matched for Canada from open data. Layer 2 cannot.

---

## B. Canada, field by field

| Turkish field | Canadian equivalent | Official dataset and column | Format | Licence | Supplied? |
|---|---|---|---|---|---|
| `etkenMadde` — generic name | Ingredient name (INN-based), English and French | DPD `QRYM_ACTIVE_INGREDIENTS.INGREDIENT`, `INGREDIENT_F`; CCDD TM file | CSV text | OGL – Canada | Yes |
| `marka` — every brand name, with company | Brand name and DIN owner | DPD `QRYM_DRUG_PRODUCT.BRAND_NAME`, `BRAND_NAME_F`; `QRYM_COMPANIES.COMPANY_NAME`; CCDD MP file | CSV text | OGL – Canada | Yes |
| `ad` — product with strength and form | Strength, form, route | DPD `QRYM_ACTIVE_INGREDIENTS.STRENGTH`, `STRENGTH_UNIT`; `QRYM_FORM.PHARMACEUTICAL_FORM`; `QRYM_ROUTE.ROUTE_OF_ADMINISTRATION`; CCDD NTP formal name | CSV text | OGL – Canada | Yes |
| `atc` | ATC code and label | DPD `QRYM_THERAPEUTIC_CLASS.TC_ATC_NUMBER`, `TC_ATC` (the API notes the AHFS code "are no longer available") | CSV text | OGL – Canada | Yes |
| `barkod`, `kamuNo` — identifiers | DIN; pack UPC | DPD `DRUG_IDENTIFICATION_NUMBER`; `QRYM_PACKAGING.UPC` | CSV text | OGL – Canada | Yes (DIN always; UPC where filed) |
| `esdegerGrubu` — equivalents | Same-ingredient grouping | DPD `AI_GROUP_NO`; CCDD NTP (groups brand products under one non-proprietary product) | CSV text | OGL – Canada | Yes, as a grouping. It is not a statement of interchangeability; that is provincial |
| `ruhsatAskida` — licence status | Marketed, approved, dormant, cancelled | DPD `QRYM_STATUS.STATUS` | CSV text | OGL – Canada | Yes |
| `renkliRecete` — prescription and controlled status | Federal schedule | DPD `QRYM_SCHEDULE.SCHEDULE` (values in section 3) | CSV text | OGL – Canada | Yes, federal level |
| — | NAPRA schedule (I, II, III, U) | NAPRA National Drug Schedules spreadsheet | XLS | © NAPRA, all rights reserved; no reuse terms | **No open source**; permission needed |
| `sgk`, `sgkRestriction` — reimbursement | Provincial formulary status | One list per province (section 2); CIHI cross-province table (Excel) | Web search pages, PDF, Excel | Crown copyright of each province; CIHI terms not read | **No single open source.** Ontario's and Quebec's pages show no reuse licence |
| `dose`, `pediatrik`, `contraindications`, `interactions`, `gebelik`, `emzirme`, renal and hepatic flags | Product monograph text | Not in any dataset. Monographs are PDF documents attached to products in the DPD | PDF | See below | **Not supplied by any open dataset** |
| `kaynak` — source and how verified | — | To be recorded per record at import (dataset name, file date) | — | — | Yes, by design |

**May the product monograph on the DPD be reproduced inside a product, or only linked?**
What could be read:
- The DPD overview says the database provides product monographs for human drugs, and that "Generic drug
  manufacturers must update their PM to ensure it aligns with the Canadian Reference Product" — the documents
  are written by the manufacturers.
- Health Canada's FAQ on posted monographs says "Product Monographs may be accessed from Health Canada's Drug
  Product Database Online Query"; it contains no statement about copyright or reuse.
  <https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/dhp-mps/alt_formats/pdf/prodpharma/applic-demande/guide-ld/monograph/pm_qa_mp_qr-eng.pdf>
- The canada.ca terms say: "Some of the content on this site may be subject to the copyright of another
  party", and commercial redistribution needs "prior written permission from the copyright administrator".
  <https://www.canada.ca/en/transparency/terms.html>
- The Open Government Licence excludes "third party rights the Information Provider is not authorized to
  license".
- The DPD's own "Terms and Conditions" page, which the extract page points to "For information on copyright",
  could not be found or opened.

Conclusion for the owner: **no text was found that permits reproducing monograph content in a commercial
product. Treat monographs as link-only** (link each product to its DPD page) until Health Canada, or the
manufacturer for a given monograph, confirms otherwise in writing. This is a reading of the terms that could
be reached, not legal advice.

---

## C. Sample: generic name with every commercial name (third file)

[`ca-brand-generic-sample.csv`](./ca-brand-generic-sample.csv), columns
`generic_name,commercial_name,manufacturer_if_shown,strength_and_form_if_shown,register_url`.

**The Drug Product Database could not be searched from here.** Its API and its data files refuse automated
readers. Two requests were answered before the refusals began; they give the four DPD rows at the top of the
file (LIPITOR, four DINs, company "BGP PHARMA ULC", form "Tablet" for the first). That is all that could be
reached from the DPD itself.

**The rest of the sample comes from the Ontario Drug Benefit Formulary / Comparative Drug Index**, which is an
official provincial register that can be searched by generic name with a plain link and shows generic name,
brand name, manufacturer, strength and form. It lists products on Ontario's formulary (including ones marked
"Off-Formulary Interchangeable" or "Not a Benefit"), so it is close to, but **not the same as, every brand in
the DPD**. Formulary version shown on every result: "Version 2.17", "Last Updated 02/09/2026".

The 30 medicines are the first 30 entries of List A (PMPRB Table 3), in order. One search was run per entry;
`register_url` on each row is the exact search link.

| Rank | Entry in List A | Search term | Products the page reported | Rows in the file |
|---|---|---|---|---|
| 1 | Atorvastatin | atorvastatin | 123 | 31 |
| 2 | Rosuvastatin | rosuvastatin | 84 | 21 |
| 3 | Pantoprazole | pantoprazole | 35 | 35 |
| 4 | Amlodipine | amlodipine | 100 | 44 |
| 5 | Apixaban | apixaban | 38 | 19 |
| 6 | Pregabalin | pregabalin | 102 | 28 |
| 7 | Quetiapine | quetiapine | 128 | 33 |
| 8 | Candesartan | candesartan | 80 | 24 |
| 9 | Duloxetine | duloxetine | 40 | 20 |
| 10 | Buprenorphine combinations | buprenorphine | 13 | 5 |
| 11 | Escitalopram | escitalopram | 40 | 20 |
| 12 and 14 | Perindopril; Perindopril and diuretics | perindopril | 74 | 31 |
| 13 | Sertraline | sertraline | 49 | 17 |
| 15 | Gabapentin | gabapentin | 69 | 27 |
| 16 | Ramipril | ramipril | 79 | 21 |
| 17 | Aripiprazole | aripiprazole | 70 | 13 |
| 18 | Nabilone | nabilone | 10 | 7 |
| 19 | Lansoprazole | lansoprazole | 24 | 13 |
| 20 | Risperidone | risperidone | 82 | 14 |
| 21 | Mycophenolic acid | mycophenol | 24 | 14 |
| 22 | Fluticasone/salmeterol | salmeterol | 12 | 6 |
| 23 | Tamsulosin | tamsulosin | 10 | 10 |
| 24 | Hydromorphone | hydromorphone | 28 | 9 |
| 25 | Levodopa/decarboxylase inhibitor | levodopa | 33 | 12 |
| 26 | Olanzapine | olanzapine | 116 | 26 |
| 27 | Pirfenidone | pirfenidone | 15 | 8 |
| 28 | Metformin | metformin | 112 | 65 |
| 29 | Metoprolol | metoprolol | 28 | 14 |
| 30 | Oxycodone/paracetamol | oxycodone | 16 | 10 |

How to read the file:
- One row is one brand name from one manufacturer; the strengths and forms the page lists for it are joined in
  one cell. That is why "rows" is smaller than "products" (the page counts each strength as a product).
- A search returns combination products that contain the ingredient (for example the atorvastatin search also
  returns amlodipine-with-atorvastatin products), so some rows appear under two searches.
- Manufacturer is shown as the page shows it: sometimes a three-letter code ("APX"), sometimes the full name.
- Markers such as "(Off-Formulary Interchangeable)" and "(Not a Benefit)" are Ontario's coverage notes, kept
  where the reader placed them.
- The strings came through the automated page reader. Its layout of a cell varies between searches (the
  ramipril and tamsulosin rows show this). The file is a sample to show the shape of the data; at import the
  rows must be regenerated from the downloaded data files, not from this file.
- Worth noticing: the DPD names the company for Lipitor as "BGP PHARMA ULC" while Ontario's formulary shows
  "Upjohn Canada ULC". The two registers do not always agree on the company name.

---

## Recommendation for the owner

**One route: build the Canadian medicine list from Health Canada's two open datasets (CCDD for the names, DPD
for the product detail), show names and product facts only, and link out for everything clinical.**

### D. Import plan to reach the Turkish depth

1. **Datasets.** (a) DPD data extract, marketed set, optionally the approved set. (b) CCDD: the TM, NTP, MP
   files and the English and French MP-NTP-TM relationship files. Both under the Open Government Licence –
   Canada.
2. **Where it must run.** These files cannot be fetched from this research environment (direct downloads are
   blocked and the official sites refuse automated readers). The import has to run on a machine that can
   download them — a developer laptop or a CI job — the same way `scripts/import-sgk-ilac.mjs` is run for the
   Turkish list. A monthly re-run matches the stated update cycle.
3. **How many records.** Not stated on any page that was read, so no figure is given here. For scale only: the
   DPD extract is about 116 MB uncompressed across all sets, and one province's formulary returned 123 listed
   products for atorvastatin alone. The Turkish list has 8,649. Count the rows at the first import and record
   the number.
4. **Fields that will be full** (same depth as Turkish Layer 1): generic name in English and French; every
   brand name with its company; strength; form; route; ATC code; DIN; federal schedule (prescription, narcotic,
   controlled, targeted, non-prescription); marketed status; ingredient grouping for "same medicine, other
   brand".
5. **Fields that will be empty.** Provincial formulary coverage (no single open source); NAPRA schedule
   (copyright, no reuse terms); pack barcode where the manufacturer filed none; and **all of Turkish Layer 2**:
   adult and paediatric dosing, contraindications, interactions, pregnancy and lactation lines, renal and
   hepatic flags.
6. **What needs a licence or a written permission.** Dosing and other clinical text: CPS (Canadian
   Pharmacists Association) or another licensed knowledge base. Reproducing product-monograph text: permission
   not found, link only. NAPRA schedules: NAPRA's permission. Provincial formulary data: each province's terms.
   A most-prescribed ranking beyond the free 20: IQVIA or CIHI.

**Cost in effort (estimate):** one importer modelled on the Turkish one, plus a bilingual search index; a few
days of work for one developer, then a scheduled monthly refresh. **Cost in licences for this route:** none;
it requires the attribution line "Contains information licensed under the Open Government Licence – Canada."
and one written confirmation from Health Canada (section 2).

**What this route does not give:** any dosing or clinical decision content; any statement of what a province
reimburses; a ranking of what is prescribed most. The 210 ranked rows in the CSV can order a "common
medicines first" search only as a rough aid, and only with the caveat that most of them rank by cost.

---

## Could not verify

Stated plainly, so nothing here is mistaken for a checked fact.

1. **CIHI Excel tables** — the Top 100 Drug Classes (2022 data), the Pharmaceutical Data Tool spending and
   seniors tables, and the Formulary Coverage table. The page reader returns only "binary data" for Excel
   files and direct download from this environment is blocked. They hold class and chemical rankings by
   public-plan spending and use.
2. **Drug Product Database search** — the API and online query refused automated reading after two answers.
   No DPD ingredient search could be run; the brand sample therefore comes from Ontario's formulary.
3. **CCDD data files** — refused automated reading. Their structure is taken from the data dictionary page;
   no CCDD row was seen.
4. **DPD "Terms and Conditions" page** — not found. The monograph-reuse answer in section B rests on the
   general canada.ca terms and the licence text.
5. **NIHB Drug Benefit List page** — refuses automated readers.
6. **Controlled Drugs and Substances Act text** (Justice Laws site) — refuses automated readers.
7. **Canada's Drug Agency (cda-amc.ca)** — the site needed an access approval that was not given in time.
8. **NAPRA** — the page listing how each province applies the National Drug Schedules returned an error, and
   the definitions of Schedule I, II, III and Unscheduled were not on the page that opened.
9. **Five pages refused for rate limiting and not retried:** Alberta Drug Benefit List publications page; a BC
   PharmaCare formulary search address (never confirmed to be the right address); a legal commentary on
   product-monograph copyright; CIHI's terms of use; Ontario's copyright page. So the reuse terms of CIHI
   content and of Ontario's formulary are **not** known.
10. **Provincial formularies** for Saskatchewan, Prince Edward Island, Newfoundland and Labrador, the Northwest
    Territories and Nunavut were not found; those for Alberta, Manitoba, New Brunswick, Nova Scotia and Yukon
    are links from search results that were not opened.
11. **Record counts** for the DPD and the CCDD — not printed on any page read.
12. **Definitions of "proper name" and "common name"** — not on the Health Canada page that was read.
13. **United States names** — no fetched source shows them beside Canadian names, so no difference is flagged.
14. **Statistics Canada class tables** — the reader's copy of the 2007 to 2011 table had rows that looked
    wrong for some age groups, so no row from it is reproduced.
15. **PMPRB Table 4** — not re-read in the final check (the ten rows checked were from Tables 2 and 3).
    Table 1 is not used; the reader showed one name there spelled differently from Table 2.
16. **Whether a newer CompassRx edition exists** — a search found none after the 10th (published 2025-10-21).
17. **PrescribeIT** — the shutdown is reported by one trade publication; whether it happened on the stated
    date was not checked.
18. **Commercial dosing knowledge bases other than CPS** — none checked.
19. **All fidelity checks were made through the page reader**, which is itself software that can misread.
    The check performed is described in the pull request; a person opening the PMPRB page and comparing a few
    rows by eye would close this gap in minutes.
