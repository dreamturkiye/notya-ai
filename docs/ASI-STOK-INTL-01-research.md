# NOTYA-ASI-STOK-BARKOD-01 Phase 2 — per-country vaccine barcode / digital-registry / lot-tracking-law research

Status date: 2026-10-16. Scope: the same 6 non-Turkey country modules confirmed from this repo's
own branches (`release/au`, `release/ca`, `release/gb`, `release/nz`, `release/us`, `release/uz` —
each with a matching `ulke-uygula/<cc>` overlay branch), the same set independently confirmed by
both `docs/ASI-ONAM-INTL-01-research.md` (NOTYA-ASI-ONAM-01) and the `ACCOUNTING-INTL-01` entry in
this file's own history. Every country's internal specialty key stays `pediatri`/`aile-hekimligi`/
`enfeksiyon-hastaliklari`/`kadin-hastaliklari-dogum`/`dahiliye` — confirmed by `lib/asi/stok/modul.ts`
comparing against `SpecialtyKey` (the canonical, non-localized 30-branş enum resolved via
`portalBransAnahtari()`), the same fact `asi-onam`'s research independently verified by reading
each `release/<cc>:lib/specialties/registry.ts` directly. **This means
`ASI_STOK_VARSAYILAN_ACIK_BRANSLAR` needs zero translation or country-specific edit** — only the
*displayed* branş label is localized per country, by a layer this module never touches, and the
module's own branş-gate logic already works unchanged on every country build.

This document covers three separate questions per country, each researched independently (not
assumed): (1) the barcode/data-carrier standard on vaccine packaging — is it GS1, like Turkey's
İTS encoding my Phase 1 `gs1Coz()` parser already handles, or something else; (2) whether a
national digital immunization-record system equivalent to e-Nabız exists to mark records
export-ready for; (3) the legal requirement (if any) to record the vaccine lot/batch number.

Confidence scale (same as `docs/ASI-ONAM-INTL-01-research.md` / `ARCH-NOTYA-ACCOUNTING-<CC>.md`):
**VERIFIED** (primary official source, fetched/quoted directly) / **BEST-EFFORT** (one authoritative
official source found, but the country is sub-nationally fragmented and only one jurisdiction was
checked) / **MODERATE** (the underlying system/framework is confirmed to exist but a key detail —
exact statute text, or a specific page — could not be fetched directly) / **UNCONFIRMED** (no
citable official source found for that specific question).

## AU — Australia

- **Barcode: VERIFIED — GS1.** TGA's binding standard TGO 106 ("Standard for Serialisation and
  Data Matrix Codes — Medicines") requires a **GS1 DataMatrix**: "No other method of serialising
  complies with the standard" —
  [tga.gov.au/standard-serialisation-and-data-matrix-codes-medicines](https://www.tga.gov.au/standard-serialisation-and-data-matrix-codes-medicines).
  A serialised primary pack's DataMatrix carries GTIN + batch number + expiry date + serial number
  — exactly the AI01/AI10/AI17/AI21 set my `gs1Coz()` parser (`lib/asi/stok/barkod.ts`) already
  decodes. Not vaccine-specific on this page, but applies to medicines generally and vaccines are
  medicines under the TGA's own remit.
- **Digital registry: VERIFIED — national, and reporting is legally mandatory.** The
  **Australian Immunisation Register (AIR)**, run by Services Australia, is a real national
  system providers submit encounters to via API after PRODA/OAuth registration —
  [air.claiming.com.au/docs/introduction/overview](https://air.claiming.com.au/docs/introduction/overview/).
  Reporting to it has been progressively made a **legal mandate** — confirmed by multiple official
  Dept. of Health notices: "Mandatory reporting changes to the Australian Immunisation Register
  (AIR) from 1 March 2025" —
  [health.gov.au/news/mandatory-reporting-changes-to-the-australian-immunisation-register-air-from-1-march-2025](https://www.health.gov.au/news/mandatory-reporting-changes-to-the-australian-immunisation-register-air-from-1-march-2025),
  with earlier mandatory-reporting milestones from 1 July 2021 and 1 March 2024. This is the one
  country of the six with a real, named, API-reachable, legally-mandatory e-Nabız-equivalent.
- **Lot-tracking law: VERIFIED.** Batch number is one of the fields AIR requires per dose —
  primary-health-network guidance explicitly reminds providers to "make sure correct batch numbers
  [are] entered" in AIR —
  [ama.com.au/gpnn/.../make-sure-correct-batch-numbers-entered-air](https://www.ama.com.au/gpnn/issue-21-number-20/articles/make-sure-correct-batch-numbers-entered-air) —
  and the mandatory-reporting mandate above makes that a legal, not just best-practice,
  requirement for every covered dose.

## CA — Canada

- **Barcode: VERIFIED — GS1, but only a voluntary implementation target, not compulsory law.**
  The Public Health Agency of Canada's own standard —
  [canada.ca/.../bar-code-standards-vaccine-products-canada-update-2014-2015](https://www.canada.ca/en/public-health/services/publications/healthy-living/bar-code-standards-vaccine-products-canada-update-2014-2015.html) —
  specifies **GS1** at every packaging level: primary (vial/syringe) gets a 2D GS1 DataMatrix with
  GTIN + lot number (expiry optional); secondary (carton) gets GS1 DataMatrix/DataBar/GS1-128 with
  GTIN + lot + expiry; case level gets linear GS1-128. The document itself frames these as
  voluntary targets manufacturers were expected to reach by 2017, not a binding mandate — still
  GS1-compatible with my existing `gs1Coz()` parser either way.
- **Digital registry: VERIFIED absence of a single national one — provincial/territorial only.**
  The Canadian Immunization Guide states plainly that records go to the provincial/territorial
  registry "where one exists" and that "all provinces and territories **should** develop and
  maintain electronic immunization registries" (aspirational, not a federal mandate) —
  [canada.ca/.../page-12-immunization-records](https://www.canada.ca/en/public-health/services/publications/healthy-living/canadian-immunization-guide-part-1-key-immunization-information/page-12-immunization-records.html).
  There is no e-Nabız-equivalent at the Canada-wide level this product could export to; a true
  equivalent would have to be per-province (e.g. Ontario, BC each run their own), which is its own
  13-jurisdiction research project, explicitly not attempted this round.
- **Lot-tracking law: VERIFIED (federal clinical guidance, not binding statute, but the standard
  cited across all provinces).** The same Canadian Immunization Guide page lists "lot number of
  the product and expiry date" as a required field at all three record locations (the
  patient's personal record, the provider's own chart, and the registry).

## GB — United Kingdom (release/gb)

- **Barcode: MODERATE.** GS1 UK's **Scan4Safety** programme establishes GS1 GTIN barcode scanning
  across NHS trusts for medicines and devices —
  [gs1uk.org/knowledge-hub/standards/how-gs1-uk-enables-scan4safety-for-the-nhs](https://www.gs1uk.org/knowledge-hub/standards/how-gs1-uk-enables-scan4safety-for-the-nhs) —
  confirming GS1 is the UK health system's general barcode standard. **Not independently verified
  for vaccine-vial-level packaging specifically** in this pass (Scan4Safety's own public material
  is framed around hospital procurement/medicines administration generally, not a vaccine-specific
  packaging mandate) — downgraded from VERIFIED to MODERATE for that reason.
- **Digital registry: VERIFIED to exist, but devolved/fragmented, not one UK-wide e-Nabız.**
  Scotland has a real, API-reachable one: the **Vaccination API** into the Clinical Data
  Repository (CDR), fed by the Vaccination Management Tool and GP IT systems —
  [nds.nhs.scot/service-catalogue/api-catalogue/vaccinations](https://nds.nhs.scot/service-catalogue/api-catalogue/vaccinations/).
  England runs a different arrangement — GP practices must share vaccination status with the local
  **Child Health Information Service** and other NHS-England-specified systems, under a
  **contractual** (GP contract letter / NHS England guidance), not statutory, requirement from
  April 2024 —
  [pulsetoday.co.uk/.../vaccination-and-immunisation-record-keeping-requirements-are-tightened](https://www.pulsetoday.co.uk/news/clinical-areas/immunology-and-vaccines/vaccination-and-immunisation-record-keeping-requirements-are-tightened).
  Wales/NI not checked. There is no single UK-wide export target to build one `enabiz`-style
  package generator against — a GB pack would need to pick a devolved nation (most likely England,
  the largest `release/gb` market) and build against whichever system that nation's providers
  actually use, which is its own follow-on scoping decision, not assumed here.
- **Lot-tracking law: VERIFIED (contractual mandate, England).** The same April-2024 requirement
  explicitly requires each vaccination-event record to include "batch number, expiry date, and
  vaccine name," with a narrow exception only for reliable verbal histories where the batch number
  genuinely isn't available.

## NZ — New Zealand

- **Barcode: MODERATE.** New Zealand's Ministry of Health (Manatū Hauora / Te Whatu Ora) publishes
  an official standard, **HISO 10063 — GS1 Standards** —
  [health.govt.nz/publication/hiso-10063-gs1-standards](https://www.health.govt.nz/publication/hiso-10063-gs1-standards) —
  confirming GS1 is NZ's sanctioned health-sector barcode standard. The publication's own body text
  (GTIN format, which packaging levels, vaccine-specific scope) could not be fetched directly in
  this pass — the listing page returned only the Ministry's general publications index, not the
  document itself — so this stays **MODERATE**, not VERIFIED, on the specific GS1 encoding details.
- **Digital registry: MODERATE — a real national one exists; mandatory-reporting status not
  independently confirmed.** The **National Immunisation Register (NIR)** is described directly by
  Te Whatu Ora/Health NZ as a national system recording children's immunisations, used so
  "authorised health professionals can...quickly check which vaccines a child has received" —
  [tewhatuora.govt.nz/.../about-national-immunisation-register](https://www.tewhatuora.govt.nz/health-services-and-programmes/vaccine-information/national-immunisation-registers/national-immunisation-register/about-national-immunisation-register/).
  This is a real, national (not fragmented, unlike CA/GB/US) e-Nabız-style target — but whether
  provider reporting to it is a legal mandate, and exactly how data is submitted
  (API vs. manual), is not stated on the page fetched, so that piece is **MODERATE**, flagged for
  confirmation rather than guessed.
- **Lot-tracking law: MODERATE.** Health NZ's own standard "NIR3 Immunisation Event Form" and the
  "NIP8898 Vaccination recording form" both exist as official forms (confirmed by their filenames
  on tewhatuora.govt.nz), strongly implying lot/batch recording is standard practice, but the
  specific statutory or Immunisation-Handbook text mandating it was not independently fetched in
  this pass (the Handbook's own consent/record-keeping chapter text was the same gap
  `ASI-ONAM-INTL-01` flagged for NZ) — **MODERATE, not VERIFIED**.

## US — United States

- **Barcode: VERIFIED recommendation, explicitly voluntary adoption.** The CDC states it
  "currently advises vaccine 2D barcodes of various types to use the **GS1 General Specifications**
  standard," encoding product identification, lot number and expiration date —
  [cdc.gov/iis/2d-barcodes/index.html](https://www.cdc.gov/iis/2d-barcodes/index.html). The page
  frames scanning as something that "can replace manual entry," i.e. an option, not a mandate —
  so GS1-compatible (my parser needs no change), but adoption/scanning itself is not compulsory.
- **Digital registry: VERIFIED absence of a single national one.** The CRS report "Immunization
  Information Systems: Overview and Current Issues" (R47024) is explicit: **63 separate state,
  local, territorial and tribal IISs**, each under its own jurisdiction's law, with CDC supporting
  via grants/standards and receiving only de-identified aggregate data for national monitoring;
  federal-level IIS participation is "voluntary," though jurisdiction-level mandates vary (e.g.
  COVID-19 doses generally required reporting within 72 hours under the CDC Provider Agreement) —
  [everycrsreport.com/reports/R47024.html](https://www.everycrsreport.com/reports/R47024.html).
  Same pattern `ASI-ONAM-INTL-01` found for US consent law: federal piece confirmed, the
  state-by-state piece is its own 50-jurisdiction project not attempted here.
- **Lot-tracking law: VERIFIED — federal statute, specific citation.** The National Childhood
  Vaccine Injury Act, **42 U.S.C. § 300aa-25(a)**, requires every provider who administers a
  Vaccine-Injury-Table-listed vaccine to record in the patient's permanent medical record (or an
  accessible office log): the date given, **"the vaccine manufacturer and lot number of the
  vaccine,"** and the administering provider's name/address/title —
  [law.cornell.edu/uscode/text/42/300aa-25](https://www.law.cornell.edu/uscode/text/42/300aa-25).
  This is the single clearest, most directly-on-point legal citation found across all six countries.

## UZ — Uzbekistan

- **Barcode: BEST-EFFORT, vaccines not explicitly confirmed.** Uzbekistan runs a real, named,
  mandatory national pharmaceutical track-and-trace system, **Asl Belgisi** (operated by CRPT
  Turon, under Decree 149), requiring a **GS1 DataMatrix** (GTIN + serial number + verification
  key/code, human-readable batch/lot + expiry) on imported medicines and medical devices, phased in
  from September–November 2022 —
  [optelgroup.com/.../uzbekistan-asl-belgisi-update-mandatory-serialization-of-pharmaceutical-products](https://www.optelgroup.com/en/blog/uzbekistan-asl-belgisi-update-mandatory-serialization-of-pharmaceutical-products/).
  The source describes "medicines and medical devices" generically and does not name vaccines
  specifically, so GS1 applicability to vaccine packaging is a reasonable inference (vaccines are
  medicines) but **not independently confirmed as vaccine-specific** — downgraded to BEST-EFFORT.
- **Digital registry: MODERATE.** A real, officially-published FHIR Implementation Guide,
  **"Uzbekistan Digital Health Platform"** (publisher: uzinfocom.org, Uzbekistan's state
  information-technology agency), defines a dedicated immunization data model — a
  `uz-core-immunization` StructureDefinition and an `immunization-identifier` NamingSystem, per the
  IG's own published resource list (`build.fhir.org/ig/uzinfocom-org/digital-health-ig`, resource
  filenames `StructureDefinition-uz-core-immunization.html` and
  `NamingSystem-immunization-identifier.json.html`, found via search listing). This is strong,
  concrete evidence of a real national digital immunization data standard — but the IG's page
  bodies (exact workflow, whether lot/batch is a modeled field, whether submission is mandatory)
  could not be fetched directly in this research pass (blocked by this environment's fetch
  provenance rule on a URL reached only via a second hop, not a direct search/prior-fetch result) —
  **MODERATE, not VERIFIED**, pending a pass that fetches the IG's StructureDefinition pages
  directly rather than only the search-result titles.
- **Lot-tracking law: UNCONFIRMED.** No citable official source was found for an
  immunization-specific lot/batch record-keeping mandate — only the general Asl Belgisi
  pharmaceutical-serialization system above, which is about traceability through the supply chain,
  not a clinical charting requirement. **Per the brief's own instruction, no legal claim is made
  for UZ beyond this honest gap.**

## What is and isn't implemented this round

The core engine (`lib/asi/stok/motor.ts`, `lib/asi/stok/barkod.ts`'s `gs1Coz()` GS1 AI parser,
`lib/asi/stok/tipler.ts`) needed **zero code changes** to support all six countries: every country
above uses GS1 (or, for UZ, GS1-compatible) encoding on the AIs `01`/`17`/`10`/`21` my parser
already decodes, and the branş-gate (`ASI_STOK_VARSAYILAN_ACIK_BRANSLAR`) compares against the
same non-localized `SpecialtyKey` enum every country build shares. `lib/asi/stok/intl/ulkePaketleri.ts`
(this same branch) registers one `AsiStokUlkePaketi` per country, encoding exactly the three
researched facts above (barcode standard + confidence, digital-registry existence/scope/confidence,
lot-tracking-law confidence) as explicit, cited data — not a rebuild of the engine, and not a new
vaccine-content dataset (unlike `NOTYA-ASI-ONAM-01`, this feature was never going to need one: a
clinic's own stock is whatever it actually has on hand, not a pre-vetted national catalog).

**Not implemented this round, deliberately**: (1) no release/<cc> branch was touched — this pack
lives on the shared trunk only, exactly where `asi-onam`'s own Phase 2 pack landed, so the next
pass that actually ships a country build decides how/when to merge trunk forward into
`release/<cc>`; (2) no country gets a live "export to [registry]" button or package generator —
AU's AIR is the one country where that would be straightforward (a real, reachable, mandatory API)
and is the best Phase-3 candidate; CA/GB/US are structurally fragmented (provincial/devolved/state)
and would need a jurisdiction chosen first; NZ's NIR submission mechanism and UZ's IG workflow need
their MODERATE gaps closed before any export code is written against them; (3) UZ's vaccine-specific
barcode applicability and NZ's HISO 10063 body text and mandatory-reporting status remain open
research gaps, not guessed past. See `docs/OPEN-COMMITMENTS.md` (`ASI-STOK-INTL-*`) for the
itemized next steps.
