# Medicines research — New Zealand (`nz`)

Status: research only, 2026-10-09. No code, no pack file and no medicine slot was changed. The New Zealand version still carries no medicine content and its medicine slots stay empty and switched off. This document is for the owner to decide from.

Files in this folder for New Zealand:

- `NEW-ZEALAND.md` — this document.
- `nz-most-prescribed.csv` — the official most-prescribed ranking, exactly as published (20 ranks; the target is 250, see section 1).
- `nz-brand-generic-sample.csv` — generic name with commercial names for the medicines of that ranking, each row copied from a fetched official page (section C).

## How to read this document

- Every medicine name here was copied from a page fetched in this session, and the page is linked beside it. Nothing was added, completed, corrected or reordered from memory.
- This document contains no dosing, indications, interactions, warnings or prescribing advice.
- Pages were read through a fetch tool that returns extracted text, not the raw page. Words inside quotation marks are the short passages that tool returned as quotations; everything else is a paraphrase of what the page said. Anyone relying on a licence sentence should open the linked page and read it in full.
- From this environment, direct downloads are blocked (the shell gets `403` from the outbound gateway for every public host tried), the fetch tool cuts long pages at roughly 90,000–112,000 characters and cannot open spreadsheets, and some sites refuse automated fetching. Each place where that stopped the work is named, and listed again under "Could not verify".

---

## 1. Most commonly prescribed medicines

### What was reached: Pharmac's Top 20 (data year 2023/24)

Main source: Pharmac, Year in Review, "Medicines prescription count" — <https://pharmac.govt.nz/news-and-resources/publications/year-in-review/top-20s/community-medicines> (the same table is served at <https://www.pharmac.govt.nz/news-and-resources/publications/corporate-publications/year-in-review/year-in-review/top-20s/community-medicines>).

- What is counted: the page's subtitle is "Number of funded prescriptions dispensed in 2023/2024 financial year." It covers funded medicines dispensed in the community. The column heading is "2024".
- What is left out, according to the page's footnote: medicines purchased by hospitals, and some products Pharmac buys directly and holds no prescription data for (the page names some hepatitis C medicines, risdiplam, most vaccines, COVID-19 treatments and vaccines, condoms, NRT and naloxone).
- Scale: "The total prescription count for 2023/24 was 58.5 million and the top 20 medicines account for 37% of the total."
- The figures are as published; they all end in "0,000", so they appear rounded.
- The page gives 20 ranks and no more. Pharmac's Year in Review index (<https://pharmac.govt.nz/news-and-resources/publications/year-in-review>) lists a section "Top 20s for 2023/24"; no longer Pharmac ranking was found.

| Rank | Medicine (as in source) | Therapeutic group (as in source) | Funded prescriptions, 2023/24 |
|---|---|---|---|
| 1 | Paracetamol | Analgesics | 3,720,000 |
| 2 | Atorvastatin | Lipid-modifying agents | 1,990,000 |
| 3 | Omeprazole | Antiulcerants | 1,770,000 |
| 4 | Ibuprofen | Non-steroidal anti-inflammatory | 1,300,000 |
| 5 | Amoxicillin | Antibacterial | 1,290,000 |
| 6 | Colecalciferol | Vitamins | 1,260,000 |
| 7 | Aspirin | Antithrombotics | 1,090,000 |
| 8 | Metoprolol succinate | Beta-adrenoceptor blockers | 920,000 |
| 9 | Salbutamol | Beta-adrenoceptor agonists | 840,000 |
| 10 | Candesartan cilexetil | Agents affecting the renin-angiotensin system | 790,000 |
| 11 | Amlodipine | Calcium channel blockers | 760,000 |
| 12 | Cetirizine hydrochloride | Antihistamines | 750,000 |
| 13 | Levothyroxine | Thyroid and antithyroid agents | 740,000 |
| 14 | Prednisone | Corticosteroids | 710,000 |
| 15 | Zopiclone | Sedatives and hypnotics | 670,000 |
| 16 | Docusate sodium with sennosides | Laxatives | 660,000 |
| 17 | Celecoxib | Non-Steroidal Anti-Inflammatory Drugs | 650,000 |
| 18 | Loratadine | Antihistamines | 620,000 |
| 19 | Codeine phosphate | Analgesics | 610,000 |
| 20 | Metformin hydrochloride | Diabetes | 580,000 |

The same 20 rows are in `nz-most-prescribed.csv`.

Checks made on this table:

- The page was opened three times in this session; all three readings gave the same 20 names and figures. On the third reading, ranks 1, 3, 6, 8, 10, 12, 13, 16, 19 and 20 were compared with the CSV, name and figure: all ten match.
- The page prints a total of 21,750,000 under the table. The 20 figures as printed add up to 21,720,000. The 30,000 difference is consistent with each row being rounded, but the page does not explain it.

### The owner's target is the top 250: 20 reached, 230 missing

The owner asked for the top 250 per country. Only 20 ranks could be copied from a source reachable here, so **230 ranks are missing**. No second ranking was spliced onto the Pharmac list, because the other sources count different things (see below).

The dataset that holds the full ranking exists and is openly licensed, but could not be opened from this environment:

- **Health New Zealand | Te Whatu Ora — Pharmaceutical Data web tool.** Description page: <https://www.tewhatuora.govt.nz/our-health-system/data-and-statistics/pharmaceutical-data-web-tool>. The page says the tool summarises medicines dispensed in community pharmacies (not hospitals) and funded by the New Zealand Government, drawn from the Pharmaceutical Collection; that it can be filtered by year, by medicine at chemical formulation, chemical, and therapeutic group levels 2 and 3, and by district; that it covers 2020 to 2024; that the data was extracted on 4 June 2025 and the page published on 14 August 2025; and that the aggregate data can be downloaded as a zipped package of CSV files from the tool's Data tab under "Downloads". It adds a quantity measure (Qty) beside the number of dispensings.
- Licence: the page states the work is owned by Health New Zealand and licensed for reuse under a Creative Commons Attribution 4.0 International License. Its requested citation is "Health New Zealand. 2025. Pharmaceutical Data web tool (data extracted from the Pharmaceutical Collection on 04 June 2025). Wellington: Health New Zealand."
- The tool's address, as printed in a Health New Zealand Official Information Act letter (reference HNZ00073871, 29 January 2025, <https://fyi.org.nz/request/29395/response/116910/attach/html/4/HNZ00073871%20Response%20Nikita%20Nahendra%20SB.pdf.html>), is `tewhatuora.shinyapps.io/pharmaceutical-data-web-tool/`. The fetch tool was refused there (robots exclusion) and the shell was refused by the gateway (403), so neither the tool nor its CSV package was read.
- What the measures mean, from a Health New Zealand letter (reference HNZ00013734, 18 April 2023, <https://fyi.org.nz/request/22111/response/84086/attach/html/4/OIA%20HNZ00013734.pdf.html>): the agency "does not hold data on pharmaceutical prescriptions."; it reports publicly funded dispensings in community pharmacies. "Initial dispensings" leave out repeats; counts of people remove double counting. Medicines not funded by Pharmac and prescriptions never dispensed are not in the data.
- The Ministry of Health itself pointed a requester who asked for the "top 250 most prescribed drugs by volume" to this web tool rather than supplying a list (reference H202208334, 2022, <https://fyi.org.nz/request/19758-prescription-drugs?unfold=1>).

**Steps that would produce the full 250, on a machine with ordinary internet access** (the file and column names inside the package were not seen and must be checked when it is opened):

1. Open the Pharmaceutical Data web tool, go to the Data tab, and download the zipped CSV package under "Downloads". Download the technical document from the Technical Information tab.
2. Take the chemical-level file, keep the latest year (2024), and sort by the dispensing measure chosen (all dispensings or initial dispensings — record which).
3. Copy the first 250 rows, names exactly as written, into `nz-most-prescribed.csv`, replacing the 20 Pharmac rows (do not mix the two: Pharmac counts funded prescriptions per financial year, the web tool counts dispensings per calendar year).
4. Record the citation and the CC BY 4.0 attribution with the file.

Other places checked for a longer ranking:

- Older Official Information Act requests asked Pharmac for the "top 100 dispensed" medicines for 2016 and 2017 (<https://fyi.org.nz/request/5293-request-regarding-the-top-dispensed-drugs-most-expensive-drugs-for-2016>, <https://fyi.org.nz/request/7732-dispensed-drugs-media-and-events-information-request>). The answers are PDF attachments whose addresses the fetch tool did not expose, so they were not read. They would be ten years old in any case.
- Health Quality & Safety Commission, Atlas of Healthcare Variation (<https://www.hqsc.govt.nz/our-data/atlas-of-healthcare-variation/>): it "highlights demographic and regional variation in the health conditions and health care that people receive in New Zealand." It lists medicine-related domains ("Community use of antibiotics", "Opioids", "Polypharmacy in people aged 65 and over") but publishes no ranking of most-dispensed medicines.

---

## 2. The country's "pharmacy lists"

### 2.1 Pharmac — the Pharmaceutical Schedule (what is funded)

- Publisher: Pharmac (Te Pātaka Whaioranga), the government's medicine funding agency.
- What it is: "The Schedule is a list of all government-funded medicines and the medical devices available in public hospitals." (<https://www.pharmac.govt.nz/pharmaceutical-schedule/about-the-schedule>). It carries the price and subsidy for each item and any rules or limits on access. The same page says "There's no information about medicines that **aren't** funded." and that the Schedule does not show medicine classifications or give prescribing advice.
- Sections seen on the resources page (<https://schedule.pharmac.govt.nz/>): Community (Section B), Hospital (Section H — the Hospital Medicines List, HML) and Ambulance (Section E). The October 2026 PDF also lists Section A General Rules, Section C Extemporaneous Compounds, Section D Special Foods and Section I National Immunisation Schedule.
- Section B is organised by therapeutic group (Alimentary Tract & Metabolism; Blood & Blood Forming Organs; Cardiovascular System; Dermatologicals; Genito Urinary System; Hormone Preparations – Systemic; Infections – Agents For Systemic Use; Musculoskeletal System; Nervous System; Oncology Agents & Immunosuppressants; Respiratory System & Allergies; Sensory Organs; Various). Under each chemical name it lists presentations (form and strength) and, in a column headed "Brand or Generic Manufacturer", the funded brand.
- Online search: Community <https://schedule.pharmac.govt.nz/ScheduleOnline.php>, Hospital <https://schedule.pharmac.govt.nz/HMLOnline.php>.
- Downloads: PDF <https://schedule.pharmac.govt.nz/latest/Schedule.pdf> and <https://schedule.pharmac.govt.nz/latest/HML.pdf>; Excel <https://schedule.pharmac.govt.nz/latest/CPSReporting.xlsx>; XML archive <https://schedule.pharmac.govt.nz/pub/schedule/archive/> (files named `Schedule_YYYY-MM.xml`; `Schedule_2026-10.xml` is listed at 2.9 MB) and <https://schedule.pharmac.govt.nz/pub/HML/archive/> for the hospital list. The archive goes back to 2006.
- Which format to load: the `/pub/` page (<https://schedule.pharmac.govt.nz/pub/>) says XML is the format for production systems and that the Excel reports are an alternate view generated from the XML that should not be loaded into production systems.
- Update cycle: "All Schedule resources updated monthly." and "All HML resources updated monthly." The README says publication is around the 23rd of the month before the Schedule takes effect.
- Identifiers: the README says that, apart from the pack ID (Pharmacode), Pharmac generates the identifiers itself and they "can occasionally change without notice."
- Reuse in a commercial product: the Schedule files are licensed under the Creative Commons Attribution 4.0 International licence. The October 2026 PDF states "This work is licensed under the Creative Commons Attribution 4.0 International licence." The data README (<https://schedule.pharmac.govt.nz/pub/HML/archive/README.html>) says the same of the files and asks that attribution to Pharmac be in writing and not reproduce the Pharmac logo. Pharmac's site copyright page (<https://pharmac.govt.nz/about-this-site/copyright>): "Pharmac licenses you to copy, distribute and adapt that content." under CC BY 4.0, with logos, photographs and third-party material excluded. Licence text: <https://creativecommons.org/licenses/by/4.0/>. CC BY 4.0 permits commercial use with attribution; Pharmac disclaims responsibility for errors in the files.

### 2.2 Medsafe — what is approved, and its legal classification

- Publisher: Medsafe, the New Zealand Medicines and Medical Devices Safety Authority (a business unit of the Ministry of Health).
- Product/Application Search: <https://www.medsafe.govt.nz/DbSearch/> (listed in Medsafe's site map; the fetch tool received an error page there, so its contents were not read).
- Data sheets and Consumer Medicine Information: search at <https://www.medsafe.govt.nz/DbSearch/InfoSearch> (by active ingredient or trade name, or by sponsor), and an alphabetical list at <https://www.medsafe.govt.nz/profs/Datasheet/datasheet.htm> (revised 7 October 2026) whose rows are trade name and dose form, each linking to a PDF. The page says these documents are "published here on behalf of pharmaceutical companies."
- Classification database: <https://www.medsafe.govt.nz/profs/class/classintro.asp> (page shows "Database updated: 25 September 2026"). Searched by substance name and/or classification; see section 3.
- Download: no bulk download of any Medsafe database was found. They are web search tools.
- Reuse in a commercial product (<https://www.medsafe.govt.nz/other/siteinfo.asp>, copyright statement dated 25 June 2012): Crown copyright material "may be reproduced for personal, academic or clinical use without formal permission or charge.", any use "must acknowledge the Medsafe web site as the source.", and it "must not be used in a commercial context without the written permission of Medsafe." Data sheets and Consumer Medicine Information are excluded from that: they belong to the sponsoring company; they may be reproduced for personal, clinical or academic use "provided the content is not changed in any way."; and for commercial use one "should contact the medicine sponsor for permission."

### 2.3 NZULM and NZMT — the naming and coding list

- What it is: the New Zealand Universal List of Medicines is "the standard source of commonly-used information about medicines in New Zealand." and "It is the primary naming and coding database for medicines in the NZ health sector" (<https://info.nzulm.org.nz/>, <https://info.nzulm.org.nz/about>). It "brings together medicines information from Medsafe, PHARMAC and the Pharmacy Guild".
- Publisher: "A service of the NZ Ministry of Health." Footer: "(c) Crown Copyright, New Zealand Ministry of Health - 2022." Health New Zealand describes it at <https://www.tewhatuora.govt.nz/our-health-system/digital-health/emedicines-and-the-new-zealand-e-prescription-service/nz-universal-list-of-medicines>.
- Contents, as listed by the site: each medicine's official name, official code number, approval status for New Zealand use, restrictions, subsidy status and level, and conditions. It also includes products on Pharmac's Hospital Medicines List, medicines supplied under Section 29 of the Medicines Act, and some common natural remedies.
- NZMT: the NZULM is built on the New Zealand Medicines Terminology, "the standard code system used to identify each medicine in the NZ Universal List of Medicines (NZULM)." (<https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/terminology-service/nzmt>). It has seven product types: Medicinal Product (MP), Medicinal Product Unit of Use (MPUU), Medicinal Product Pack (MPP), Trade Product (TP), Trade Product Unit of Use (TPUU), Trade Product Pack (TPP) and Containered Trade Product Pack (CTPP), with maps from trade products to medicinal products. The NZULM site says NZMT follows SNOMED International conventions.
- How it is obtained:
  - Monthly data set by request (<https://info.nzulm.org.nz/data-access>): "compiled from our database and distributed to interested parties on a monthly basis in CSV format." Access is for "anyone with a legitimate need."; one emails the NZULM team with name, organisation, phone number and intended use.
  - NZ Health Terminology Service (NZHTS), which takes NZMT content "once per month from the latest NZULM release": FHIR endpoint <https://nzhts.digital.health.nz/fhir>; an API key is requested from Health New Zealand's standards team. The September 2025 release note (<https://www.tewhatuora.govt.nz/assets/Health-services-and-programmes/Digital-health/NZ-Health-Terminology-Service/NZHTS-release-note-September-2025.pdf>) says the service is provided free to New Zealand health entities and their industry partners.
  - The New Zealand Formulary FHIR API (2.4 below).
  - Website search: the NZULM site says it is being shut down and that medicine searches have moved to `nzf.org.nz/nzulm` (not readable from here: robots exclusion).
- Reuse in a commercial product: the data-access page says the content is available "free of charge" under "very permissive licensing terms." and that using or downloading it means accepting licence terms that come inside the download package. The points the page itself gives: shared or adapted information "must attribute it, in writing, to the New Zealand Universal List of Medicines (NZULM)."; the disclaimer must travel with redistributed information; suppliers' own licences also apply (it names Pharmac content under a Creative Commons Attribution 3.0 NZ licence and Medsafe content under Medsafe's own copyright statement — see 2.2, which requires written permission for commercial use). **The full licence text was not seen**, because it is only inside the package.
- Size: no source reached states the number of products or records.

### 2.4 New Zealand Formulary (NZF) and NZF for Children (NZFC)

- What it is: "The NZF is an independent resource providing healthcare professionals with clinically validated medicines information" (<https://nzformulary.org/>). It "builds on the New Zealand Universal List of Medicines" and "incorporates information from the British National Formulary (BNF)." (<https://nzformulary.org/about>). The Ministry of Health's page adds that it includes "Stockley's interactions and BNF (British National Formulary) interaction summaries." (<https://www.health.govt.nz/our-work/digital-health/other-digital-health-initiatives/emedicines/new-zealand-formulary>).
- NZFC "contains information on the use of drugs for neonates, children, and adolescents up to 18 years of age" (<https://nzformulary.org/faq>).
- Publisher: the FHIR implementation guide names "New Zealand Medicines Formulary LP" (<https://build.fhir.org/ig/HL7NZ/nzf/index.html>).
- Update cycle: "The NZF and NZFC are updated each month"; online and PDF updates appear on the first working day of each month.
- Access: "available free of charge for all healthcare professionals prescribing, dispensing and administering medicines"; the website is "only accessible to people currently in New Zealand, the Cook Islands, Niue, and Tokelau."
- For software: a FHIR API. "This IG is to support retrieving formulary and medication information in New Zealand." It serves NZMT medication data combined with NZF, Pharmac and Medsafe data (funding, legal classifications, cautionary and advisory labels) and links to adult and child monographs, patient leaflets and Medsafe data sheets. Access is by request: "please use the email address fhir 'at' nzformulary.org with any questions or requests to access the data." The guide describes itself as "not an authorized publication; it is the continuous build for version 1.0.0."
- Reuse in a commercial product: the only rights statement on the pages reached is the footer "© All Rights Reserved." No open licence and no published reuse or API terms were found. NZF content therefore cannot be copied into the product without an agreement with the publisher; because it incorporates BNF content, the BNF's publisher's rights are also in play. The sites `nzf.org.nz` and `nzfchildren.org.nz` refused automated fetching, so any terms page there was not read.

### 2.5 Health New Zealand — Pharmaceutical Collection (what was actually dispensed)

Described in section 1. It is the dispensing-claims data behind the Pharmaceutical Data web tool; the aggregate tool output is CC BY 4.0. Health New Zealand's own page for the Collection refused automated fetching and was not read.

---

## 3. How medicines are classified for supply

This is the classification scheme only.

- Source: Medsafe, "The Medsafe Files – Episode 10: Medicines classification", published 7 June 2019 (<https://www.medsafe.govt.nz/profs/PUarticles/June2019/The-Medsafe-Files-Episode-10-Medicines-classification.htm>), and the classification database introduction (<https://www.medsafe.govt.nz/profs/class/classintro.asp>).
- Under the Medicines Act 1981, with the lists in Schedule 1 of the Medicines Regulations 1984:
  - **Prescription medicines** — "may be supplied only on the prescription of an authorised prescriber."
  - **Restricted medicines** (also called pharmacist-only) — sold without a prescription, but only by a registered pharmacist in a pharmacy, with the sale recorded.
  - **Pharmacy-only medicines** — sold only in a community or hospital pharmacy; any salesperson may make the sale.
  - **General sale** — medicines not listed in Schedule 1 are "deemed to be unclassified" and "may be sold from any outlet."
- Controlled drugs sit under the Misuse of Drugs Act 1975. Medsafe's classification database lists these classes beside the four above: Class A Controlled Drug; Class B1, B2 and B3 Controlled Drugs; Class C1 through C7 Controlled Drugs; and Temporary Class Drug.
- Who decides: the Medicines Classification Committee advises the Minister of Health's delegate, who makes the decision; the committee meets twice a year with secretarial support from Medsafe.
- How classification attaches: Schedule 1 "contains a list of active ingredients grouped under their respected classifications."; ingredients are usually listed under their International Non-proprietary Name; and for a product with several ingredients "the active ingredient with the most restrictive classification determines the classification of the medicine." The database page tells users to check the legislation itself, as the database is not the authoritative record.

---

## 4. Naming

- **The official name in health software** is the NZULM / NZMT name: the NZULM holds each medicine's "official name" and "official code number" and is "the primary naming and coding database for medicines in the NZ health sector" (<https://info.nzulm.org.nz/>).
- **The name on the Schedule** is the chemical name, with the salt where Pharmac lists it (from the Top 20: "Metoprolol succinate", "Candesartan cilexetil", "Cetirizine hydrochloride", "Codeine phosphate", "Metformin hydrochloride"), followed by brand names per presentation.
- **Legal classification** uses the International Non-proprietary Name (section 3).
- **Medsafe's position on naming** (<https://medsafe.govt.nz/profs/riss/INN.asp>, revised 3 May 2013): New Zealand law requires labels to name active ingredients but does not prescribe a naming system; "Medsafe has always accepted medicines and labelling that uses any of these nomenclature systems." (the page names BAN, USAN, AAN and INN). It gives two changes — thyroxine to levothyroxine, labelled so since January 1998, and amoxycillin to amoxicillin — and notes its search accepts synonyms (frusemide finds furosemide).
- **Health Quality & Safety Commission**, recommended International Non-proprietary Names (<https://hqsc.govt.nz/resources/resource-library/recommended-international-non-proprietary-names-rinns>): says there is no official change-over period, and that Medsafe "has advocated use of the INN (other than on products containing adrenaline and noradrenaline)." Its table of current term → INN: thyroxine → levothyroxine; amoxycillin → amoxicillin; frusemide → furosemide; bendrofluazide → bendroflumenthiazide; dothiepin → dosulepin; eformoterol → formoterol; methotrimeprazine → levopromazine; oestradiol → estradiol.

Consequences for the Top 20, from those sources only:

- "Levothyroxine" (rank 13) and "Amoxicillin" (rank 5) are the INN forms; older New Zealand material and some product names use "thyroxine" and "amoxycillin" (one current product is named "Amoxycillin Sandoz®", see section C). A search box should accept both spellings.
- **Names that differ from United States usage:** none of the sources fetched shows a United States name beside any of the 20 names, so no name is flagged here. This comparison needs a United States source placed beside this list; it was not done from memory.

---

## 5. Electronic prescribing — the New Zealand ePrescription Service (NZePS)

Context, from Health New Zealand's page (<https://www.tewhatuora.govt.nz/our-health-system/digital-health/emedicines-and-the-new-zealand-e-prescription-service/eprescriptions/eprescription-service>):

- "It enables a prescription to be generated by the prescriber, transmitted to the NZePS health information exchange broker" and downloaded at a community pharmacy.
- "The barcode on a paper prescription is a unique code." The pharmacy uses the barcode to dispense signature-exempt NZePS prescriptions.
- The page lists the prescribing systems connected: Medtech, MyPractice, Indici, Profile for Windows, Medimap, Elixir and Expect Maternity, and Waikato district's outpatient prescribing service, and says work continues with other providers.
- Changes to the Misuse of Drugs Regulations 1977 effective 22 December 2022 "allow signature-exempt prescriptions for controlled drug medicines to be made through the NZePS."
- Outside the exemption conditions a handwritten signature is still needed: "No. A physical (ink, wet) signature is still required".
- Signature-exempt prescribing requires a prescribing system with role-based access that meets "all other requirements for NZePS prescribing,".

Questions for the owner — nothing here is claimed:

1. Does Notya intend to produce prescriptions in New Zealand at all, or only to record what the doctor prescribed in their own practice system? If only to record, NZePS does not apply.
2. If it were to prescribe: what are the onboarding and conformance requirements for a new prescribing system, and does NZePS require medicines to be coded with NZMT codes from the NZULM? The page read does not say; Health New Zealand's NZePS team would have to be asked.
3. Is use of NZePS mandatory for any prescriber group? The page read does not say so.
4. The page mentions temporary rules with expiry dates (a Director-General authorisation said to expire on 31 October 2024, and temporary virtual-care rules to 31 October 2027). What is in force today should be confirmed with Health New Zealand before any feature is built on it.

---

## 6. What a names list for the product would be

| Question | Answer, with source |
|---|---|
| Which dataset is the right source of names? | The **NZULM** (with its NZMT codes) is the official naming and coding list: "the primary naming and coding database for medicines in the NZ health sector" (<https://info.nzulm.org.nz/>). It covers funded and unfunded products, hospital products and Section 29 medicines. |
| What can be used immediately, without asking anyone? | The **Pharmaceutical Schedule XML**, CC BY 4.0 (<https://schedule.pharmac.govt.nz/pub/schedule/archive/>). It holds chemical names, presentations and funded brands — but only funded medicines. |
| Size | Schedule community XML: 2.9 MB (October 2026). NZULM: not stated by any source reached. |
| Format | Schedule: XML (production format), Excel and PDF views. NZULM: monthly CSV by request; NZMT also through the NZHTS FHIR service; NZF FHIR API by request. |
| Update cycle | Schedule: monthly, published around the 23rd of the month before it takes effect. NZULM: "continuously updated", monthly CSV distribution; NZHTS refreshes NZMT monthly. |
| Licence | Schedule: CC BY 4.0, attribution to Pharmac in writing, no logo. NZULM: free, by request, licence terms inside the package (attribution to the NZULM in writing; suppliers' licences also apply) — full text not seen. |
| What cannot be taken from either | Dosing, indications, interactions and warnings. Neither is a clinical reference; the Schedule page says it gives no prescribing advice, and the NZULM site says it is "merely a window into the information available in NZULM" and not a prescribing or clinical decision support tool. |
| Sources of dosing that exist | (1) **Medsafe data sheets**, one per product, owned by each sponsor company — commercial use needs the sponsor's permission (2.2). (2) **New Zealand Formulary** and **NZF for Children** — "© All Rights Reserved.", incorporates BNF content; reuse needs an agreement with New Zealand Medicines Formulary LP (2.4). No openly licensed official dosing source was found. |

---

## A. How the Turkish product holds medicines (read-only inspection of this repository)

The Turkish product has two separate layers.

**Layer 1 — the product catalogue used by medicine search.** File `data/sgk-ilaclar.json` (1.9 MB), type `IlacKaydi` in `lib/ilac/ilacArama.ts`, served by `app/api/doktor/ilac-ara/route.ts`.

- Records: **8,649**, one per pack. File header: `guncelleme` 2026-08-26, `kaynak` "SGK EK-4/A", `titck` 2026-08-26.
- Fields and how many records carry them:

| Field | Meaning | Records filled |
|---|---|---|
| `ad` | full product name as the payer writes it (brand, strength, pack size, form in one string) | 8,649 |
| `marka` | commercial (brand) name, cut from `ad` before the first strength | 8,649 |
| `sgk` | reimbursed by the payer (always true: the list is the reimbursed list) | 8,649 |
| `kamuNo` | the payer's public product number | 8,648 |
| `barkod` | barcode (the key used by e-prescription) | 8,648 |
| `etkenMadde` | active ingredient (generic name) | 8,435 |
| `etkenKaynak` | how the ingredient was obtained: direct barcode match, or inherited from the equivalence group | 8,435 |
| `atc` | ATC code | 8,396 |
| `esdegerGrubu` | the payer's equivalent-medicines group | 7,548 |
| `ruhsatAskida` | licence-suspension code from the regulator | 62 |
| `form`, `doz` | declared in the type, **not filled** in the data | 0 |

- Where the data came from, as the repository states: the payer's published reimbursed-medicines list (SGK "Bedeli Ödenecek İlaçlar Listesi", EK-4/A spreadsheets) imported by `scripts/import-sgk-ilac.mjs`; then active ingredient and ATC joined by barcode from the regulator's weekly licensed-products list (TİTCK "Ruhsatlı Beşeri Tıbbi Ürünler Listesi") by `scripts/import-titck-etken.mjs`.
- Not in this layer: no separate strength, form or route fields (they sit inside the `ad` string), no prescription-status field, no dosing text.
- Search behaviour built on it: results are grouped by brand, then the doctor picks a presentation; search works by brand and by active ingredient.

**Layer 2 — a hand-curated clinical table used for warnings.** Type `TürkishDrug` in `lib/asistan/ilac/tipler.ts`, entries in `lib/asistan/ilac/veri/*.ts` (twelve therapeutic-group files), engine in `lib/asistan/turkishDrugs.ts`.

- Records: about **176 molecules** (count of source entries across the twelve files).
- Fields: active ingredient name; a list of common brand names; an adult dose line; a paediatric dose (free text and a structured form with unit, limits, age bands and the source's own sentence); form; reimbursement flag and restriction text; pharmacological class and class labels; allergy cross-reaction group; contraindications; interactions (free text and structured with severity); age contraindication; pregnancy and breastfeeding lines; kidney and liver dose flags; coloured-prescription category; notes; and a mandatory source (document, link, and how it was verified).
- Where it came from, as the repository states: each entry names its document — the regulator's product information (TİTCK KÜB) when it was fetched and read, or a named literature source; no entry is yet marked as signed off by a physician.

**Elsewhere:** dose suggestions on the "add medicine" screen (`app/api/doktor/ilaclar/doz-oner/route.ts`) and the interaction tool (`app/api/doktor/araclar/ilac-interaksiyon/route.ts`) are produced by a language model at request time, not read from a dataset. The table `hasta_ilaclar` holds each patient's own medicines (name, ingredient, dose, frequency, dates), not a catalogue.

So "Turkish depth" means: a full national product catalogue with brand, generic, ATC, barcode, payer number, reimbursement and equivalence group (Layer 1), plus a small sourced clinical table (Layer 2).

---

## B. New Zealand, field by field: which official dataset supplies it

| Field (Turkish equivalent) | New Zealand source | Format and licence | Status |
|---|---|---|---|
| Generic / chemical name (`etkenMadde`) | Pharmaceutical Schedule: chemical heading (seen in the PDF, e.g. "OMEPRAZOLE"). NZULM / NZMT: Medicinal Product. | Schedule XML, CC BY 4.0. NZULM monthly CSV by request, NZULM licence. | Open source exists. |
| Every brand name (`marka`) | Schedule: "Brand or Generic Manufacturer" column — funded brands only. NZULM / NZMT: Trade Product — all listed products. Medsafe: one data sheet per product names the product. | As above. Medsafe: web pages and PDFs only, no download. | Funded brands: open. All brands: NZULM (by request). |
| Supplier / sponsor of each brand | Medsafe data sheets name the sponsor (seen, section C). The Schedule's printed column mixes brand and manufacturer in one field; whether the XML has a separate supplier field was **not verified**. Whether the NZULM CSV carries the sponsor was **not verified**. | — | Partly open; needs checking in the files. |
| Strength and form (`ad` holds these in Turkish) | Schedule presentation line (seen: "Cap 10 mg", "Tab immediate-release 500 mg", "Oral liq 188 mcg per ml (7,500 iu per ml)"). NZMT: Medicinal Product Unit of Use / Trade Product Unit of Use. | Schedule XML CC BY 4.0; NZULM. | Open source exists. |
| Route | Not seen as a separate field in the Schedule text read. Whether NZULM carries it was **not verified**. | — | Unverified. |
| ATC code (`atc`) | The NZULM website offered "Search via WHO ATC hierarchy", so ATC is associated with NZULM entries; whether the monthly CSV includes it was **not verified**. The Schedule uses Pharmac's own therapeutic groups, not ATC. | NZULM. | Likely in NZULM; unverified. |
| Legal classification (no Turkish equivalent field) | Medsafe classification database (by ingredient). The NZF FHIR API is described as carrying "legal classifications". NZULM lists "restrictions". | Medsafe: web search only; commercial use needs Medsafe's written permission. NZF API: by request, terms not published. | **No open bulk source found.** |
| Approval status (`ruhsatAskida`) | NZULM: "approval status for NZ use". Medsafe Product/Application Search. | NZULM by request; Medsafe web only. | NZULM. |
| Funding status and restrictions (`sgk`) | Pharmaceutical Schedule (subsidy, rules, Special Authority forms); Hospital Medicines List. NZULM: "subsidy status and level, and conditions". | Schedule XML CC BY 4.0. | Open source exists. |
| Equivalent products (`esdegerGrubu`) | NZMT maps each Trade Product to its Medicinal Product; the Schedule groups brands under one chemical and presentation. | NZULM / NZHTS; Schedule. | Open source exists (as a grouping, not a payer code). |
| Pack identifier (`barkod`, `kamuNo`) | Pharmacode — the Schedule's pack ID. NZMT codes — long SNOMED-style identifiers (the NZMT page shows an example code, 10006151000116107). Barcode (GTIN): **not verified** in any source. | Schedule XML; NZULM. | Pharmacode and NZMT code: available. GTIN: unverified. |
| Dosing text (Layer 2 `dose`, `pediatrik`) | Medsafe data sheets (per product, sponsor-owned). New Zealand Formulary / NZF for Children. | See below. | **No open official source.** |
| Interactions, contraindications, pregnancy (Layer 2) | Same two sources. | See below. | **No open official source.** |

**Dosing text — may it be reproduced inside a product, or only linked?**

- **Medsafe data sheets.** Medsafe's copyright statement (<https://www.medsafe.govt.nz/other/siteinfo.asp>) excludes data sheets and Consumer Medicine Information from its own Crown-copyright permission: they belong to the sponsoring company. They may be reproduced for personal, clinical or academic use "provided the content is not changed in any way.", with credit to Medsafe or a link; for commercial use one "should contact the medicine sponsor for permission." The data-sheet search page repeats that commercial use requires permission from the sponsoring companies. For a commercial product this means: **linking to the data sheet is the safe route; reproducing its text needs permission from each sponsor, one company at a time.**
- **New Zealand Formulary and NZF for Children.** Footer "© All Rights Reserved." (<https://nzformulary.org/>); the content "incorporates information from the British National Formulary (BNF)."; the website is "only accessible to people currently in New Zealand, the Cook Islands, Niue, and Tokelau."; a FHIR API exists with access on request. No published terms allow copying. For a commercial product this means: **link only, unless an agreement is signed with New Zealand Medicines Formulary LP** (its terms and price are not published on the pages reached).

---

## C. Brand and generic sample (`nz-brand-generic-sample.csv`)

The request was for the first 30 medicines of the most-prescribed list. The list reached has 20, so the sample covers those 20.

Neither official register could be searched by medicine from this environment:

- The Schedule's online search page carries a very large embedded list ahead of its results, and the fetch tool cut the page before the results.
- Medsafe's Product/Application Search returned an error page to the fetch tool, and its data-sheet search is a form that cannot be submitted from here. An older search address that still appears in search engines now returns "page not found".
- The NZULM search has moved to a site that refuses automated fetching.

What could be reached, and is in the file (47 rows, 19 of the 20 medicines):

- **Pharmaceutical Schedule, October 2026 PDF** (<https://schedule.pharmac.govt.nz/latest/Schedule.pdf>) — only the first part of the PDF was readable (through "Alimentary Tract & Metabolism" and the start of "Blood & Blood Forming Organs"). Four of the 20 medicines fall there: Omeprazole, Colecalciferol, Docusate sodium with sennosides and Metformin hydrochloride. For these the rows are the Schedule's funded brands per presentation (14 rows). The Schedule prints one column, "Brand or Generic Manufacturer", so the manufacturer column is left empty for these rows. Two notes on how the PDF text reads: the brand for the three omeprazole capsule strengths is printed across two lines ("Omeprazole actavis" then "10", "20" or "40") and written in full in the Schedule's own notes as "Omeprazole actavis 10", "Omeprazole actavis 20", "Omeprazole actavis 40"; and one injection brand is printed across two lines as "Dr Reddy's" then "Omeprazole" and is recorded as "Dr Reddy's Omeprazole".
- **Medsafe data sheets** — for the other 16 medicines, data sheets were located by searching the Medsafe site and each PDF was opened; the product name, sponsor and strength/form were copied from its sections 1, 2, 3 and 8 (33 rows, 15 medicines). Only single-ingredient products were taken.
- **Aspirin (rank 7): no row.** No single-ingredient aspirin data sheet was found by the searches run, and the aspirin entries of the Schedule lie beyond the readable part of the PDF.

Limits of this sample — it is not "all brand names":

- For the 15 medicines taken from Medsafe, the rows are the data sheets that a site search surfaced (at most three per medicine), not every approved product. One data sheet that the search listed (Betaloc CR) returned "page not found" and is not in the file.
- A data sheet on the Medsafe site shows that the product has (or had) a data sheet; it does not show that the product is marketed or funded today.
- Brands differ between sources: the Schedule lists the funded brand, Medsafe lists what sponsors have filed.

---

## Recommendation for the owner

One route, in order:

1. **Names, generic-to-brand links, strength, form and funding — from the Pharmaceutical Schedule XML.** It is openly licensed (CC BY 4.0), needs nobody's permission, is small (2.9 MB) and is refreshed monthly. Add the Hospital Medicines List XML the same way. This gives New Zealand a searchable list by brand and by generic name, built the same way as the Turkish catalogue.
2. **In parallel, request the NZULM monthly data set** (free; an email stating who we are and what we will do with it). It is the official naming and coding list, includes unfunded products, and its NZMT codes are what New Zealand prescribing and dispensing systems use. Read the licence inside the package before shipping anything from it.
3. **Most-prescribed list: download the Pharmaceutical Data web tool's CSV package** (CC BY 4.0) where it can be downloaded, and cut the top 250 by dispensings for 2024, following the steps in section 1.
4. **No dosing in the product for New Zealand.** Show a link to the product's Medsafe data sheet and, for clinicians in New Zealand, to the New Zealand Formulary. Open a licensing conversation with New Zealand Medicines Formulary LP only if the owner decides dosing must be shown.

What it costs:

- Licences: none to pay for steps 1 and 3 (written attribution to Pharmac and to Health New Zealand). Step 2 is free but needs approval by email and acceptance of the NZULM licence. Dosing would need a negotiated agreement of unknown price (NZF) or permission from every sponsor (data sheets).
- Effort (an estimate, not sourced): one importer for the Schedule XML and one for the NZULM CSV, in the pattern of `scripts/import-sgk-ilac.mjs` and `scripts/import-titck-etken.mjs`; a monthly refresh; an attribution line in the product.

What it does not give: dosing, interactions, contraindications or any clinical text; the legal classification as open data; unfunded products until the NZULM data arrives; and anything about private-market sales, which no public dataset here covers.

## D. Import plan to reach the Turkish depth

The datasets cannot be fetched from this environment (downloads are blocked at the gateway and the fetch tool truncates large files and cannot open spreadsheets), so **the import has to run where they can be downloaded** — a developer machine or a build job with ordinary internet access. Nothing below was run.

| Step | Dataset | What it fills | Needs |
|---|---|---|---|
| 1 | Pharmaceutical Schedule community XML, current month (<https://schedule.pharmac.govt.nz/pub/schedule/archive/>), validated against Pharmac's published schema | generic (chemical) name; brand; strength and form; funded yes/no; funding restrictions; Pharmacode pack ID; Pharmac therapeutic group | Nothing. CC BY 4.0, attribution. |
| 2 | Hospital Medicines List XML (<https://schedule.pharmac.govt.nz/pub/HML/archive/>) | hospital-only products and their restrictions | Nothing. CC BY 4.0. |
| 3 | NZULM monthly CSV | official NZMT names and codes for every listed product (funded or not); Trade Product to Medicinal Product links (the equivalent of the Turkish equivalence group); approval status; subsidy status; possibly ATC and sponsor | Email request and acceptance of the NZULM licence. |
| 4 | Pharmaceutical Data web tool CSV package | the top-250 ranking by dispensings, to order search results and to fill `nz-most-prescribed.csv` | Nothing. CC BY 4.0, attribution. |
| 5 | Medsafe data sheet link per product | a link out, not text | Nothing for a link. |

How many records: **no source reached states a count**, so none is given here as fact. The only size seen is the community Schedule XML at 2.9 MB; the Turkish catalogue is 8,649 pack records in a 1.9 MB file. The count must be taken when the files are opened.

Which fields will be full after steps 1–3: generic name, brand name, strength and form, funding status and restrictions, pack identifier (Pharmacode, NZMT code), equivalence grouping, approval status.

Which will be unknown until the NZULM package is inspected: ATC code, sponsor as a separate field, route, barcode (GTIN).

Which will stay empty without a paid or negotiated licence: legal classification as data (Medsafe written permission, or the NZF API), and the whole clinical layer — dose lines, paediatric dosing, interactions, contraindications, pregnancy and breastfeeding. A New Zealand equivalent of the Turkish hand-curated clinical table would have to be written from sources that each permit it and signed off by a New Zealand-registered clinician; that is a separate decision and is not recommended here.

---

## Could not verify

- **Ranks 21–250 of the most-prescribed list.** The Pharmaceutical Data web tool and its CSV package could not be opened (robots exclusion for the fetch tool, gateway refusal for the shell). The names of the files and columns in the package are therefore unknown.
- **Pharmac's Top 20 page dates.** The page body says 2023/24, but the page shows "Last updated: 26 February 2024", which is before that year ended, and its metadata title mentions 2021/22. The data year is taken from the page body. Whether a 2024/25 edition exists was not established.
- **The NZULM licence text**, which is only inside the download package; and the NZULM's size, field list (ATC, sponsor, route, GTIN) and whether commercial use by a company outside New Zealand is approved.
- **Whether the Schedule XML has a separate supplier field**, and the XML's record count. Only the PDF and the directory listing were read.
- **Medsafe Product/Application Search** contents and whether any bulk extract exists; and which medicines are required to have a data sheet.
- **New Zealand Formulary terms of use and API licence terms.** `nzf.org.nz` and `nzfchildren.org.nz` refused automated fetching; `nzformulary.org` shows only "© All Rights Reserved."
- **Health New Zealand's Pharmaceutical Collection page** (refused automated fetching).
- **NZePS vendor requirements** (onboarding, conformance, required medicine coding) and whether NZePS is mandatory; and which of the temporary prescription rules on its page are in force today.
- **United States name differences** for the Top 20: no fetched source shows both names.
- **Brand lists are incomplete** (section C); aspirin has no row; the 1998–1999 dates for name changes come from a Medsafe page last revised in 2013.
- **Quotations** are as returned by the fetch tool; licence sentences should be re-read on the linked pages before anyone relies on them in a contract or a product notice.
