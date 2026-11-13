# Prematurity module (Pediatri + Kadın Hastalıkları ve Doğum)

Ordered by Kaan, 2026-11-13. Classification: **branş-specific** — Pediatri and Kadın Doğum (KD) only. Türkiye only for now; the six country builds
are logged as PREMATUR-ULKE-01 in `docs/OPEN-COMMITMENTS.md`. Nothing here touches the voice/text assistant path (FOUNDER LOCK) or model policy.

## Decision support, not record

* **Decision support (derived, never stored):** the follow-up plan (which item applies, target dates, overdue / due state), corrected age, the KD
  "criterion met / not met / data missing" indicators, the cervical-length trend. They are recomputed on every read from the sources below.
* **Record (stored, doctor-entered):** the NICU history profile and the doctor's own mark per follow-up item (`pedi_prematur_kayit`), the KD preterm-birth
  record (`gebelikler.erken_dogum`: cervical-length log, previous spontaneous preterm birth, PPROM, steroid course dates, magnesium, progesterone as a fact),
  and the summary carried to the baby card (`bebek_kartlari.erken_dogum_ozeti`).
* The engines propose **no dose, no drug, no order, no referral, no cerclage**. Nothing is sent to a patient: the KD flag `erken_dogum_riski` is clinical only
  (`kdHatirlatilabilir` filters it out of every parent/patient message).

## Tools

| Branş | Tool | Where |
|---|---|---|
| Pediatri | Prematüre takip planı | `/doktor-tools/pedi-prematur-takip`; patient-file tab "Prematüre Planı" (only pediatri, only < 37 months, only preterm / ≤ 1500 g) |
| Pediatri | Düzeltilmiş yaş ve büyüme | `/doktor-tools/pedi-duzeltilmis-yas`; the growth studio, the patient-file growth chart and the developmental screening use the same corrected-age function |
| Pediatri | Prematüre kohort paneli | `/doktor-tools/pedi-prematur-kohort` (read-only list of the doctor's own preterm babies with overdue / upcoming items) |
| KD | Erken doğum risk paneli | `/doktor-tools/kd-erken-dogum`; link from the KD kohort panel |
| KD → Pediatri | hand-off | the KD discharge packet (`gebelik/dogum` `dogum_kaydet`, `olusturCanliDogum`) carries gestational week at birth (from the doctor's entry, else from SAT / corrected TDT at the birth date — never silently 40), steroid yes/no, PPROM and magnesium onto the baby card; the pediatri plan pre-fills from it and the doctor's own entry always overrides it |
| Pediatri | Vaccine plan | already used chronological age, Hep B < 2000 g and BCG < 34 weeks; added a doctor-confirmation note when GA < 37 weeks and birth weight is not on file |

## Rules and what was actually read

Verification levels shown in the UI next to every item: **birincil-okundu** (primary text read), **ikincil-ozet** (read in a reliable summary; the primary text was
not readable — the doctor confirms), **dogrulanmadi** (citation only; the content was not read, so the engine produces no date and no threshold from it).

Corrected age = chronological age − (40 weeks − GA). Applies when GA < 37 weeks and chronological age < 24 months; vaccines always use chronological age.
Negative corrected age means Neyzi/WHO curves do not apply (Fenton needed — see "Not shipped").

Pediatri (`lib/clinical/prematur/protokolTR.ts`, country-neutral engine + injected table):

* ROP screening — Türkiye ROP guideline 2016 and AAP/AAO/AAPOS/AACO 2018: primary read. Criteria GA ≤ 32 weeks or ≤ 1500 g; first exam PMA 30–31 weeks if GA < 27, otherwise postnatal week 4.
* Cranial ultrasound — AAP Hand 2020 (summary read); AAN/CNS 2002 citation only (dogrulanmadi).
* Hearing — JCIH 2019 (summary read): NICU > 5 days / exchange transfusion / ototoxic > 5 days → audiology by 9 months; ECMO → by 3 months.
* BPD criterion and RSV prophylaxis eligibility — AAP 2014 policy and TND (summary read). The RSV line uses today's age, not the season-start age (stated on the row); national reimbursement criteria are for the doctor to confirm.
* Iron — SB Bebek-Çocuk İzlem Protokolleri, 2nd month for 5 months (summary read).
* Bone metabolism — AAP 2013 citation only (dogrulanmadi): the row produces **no date and no threshold**.

KD (`specialties/kadin-dogum/engines/erkenDogum.ts`):

* Short cervix — ACOG PB 234 (2021), transvaginal < 25 mm at 16–24 weeks (read via the AAFP summary, ikincil-ozet); FIGO 2015 ≤ 25 mm (read via Norman 2020 quote, ikincil-ozet).
  The UI shows both because they differ at exactly 25 mm.
* SMFM Consult #70 (2024), primary read: ≤ 25 mm; ≤ 20 mm before 24+0 weeks → progesterone evaluation; 21–25 mm shared decision; < 10 mm cerclage by shared decision. Scope: singleton, no previous spontaneous preterm birth.
* Antenatal corticosteroids — ACOG CO 713 (2017), summary read: 24+0–33+6; 23+0 by family decision; 34+0–36+6 betamethasone if no previous course; repeat course > 14 days after the previous.
* Magnesium (ACOG CO 455) and PPROM (ACOG PB 217): citation only — shown as the doctor's record, no threshold generated.
* No published shortening-rate threshold exists, so the trend shows values and differences only.
* Product parameters (not clinical): overdue is shown up to 180 days; 14-day tolerance; "yaklaşan" = within 30 days; plan runs to chronological 36 months.

## Not shipped

* **Fenton / Olsen preterm growth charts.** Official open data tables could not be fetched (egress policy) and numbers are never typed from memory. Below corrected
  age 0 the growth studio says "Fenton/Olsen bu sürümde bulunmuyor" and plots nothing. Logged in `docs/OPEN-COMMITMENTS.md` (PREMATUR-FENTON-01).
* Country builds (us, gb, ca, au, nz, uz): PREMATUR-ULKE-01.

## Data and isolation

Migration `199_prematur_modul.sql` (rollback `geri-al/199_prematur_modul.geri-al.sql`), applied to the Türkiye project only: two jsonb columns and `pedi_prematur_kayit`
(RLS on, restrictive doctor-scoped policy, no anon grant). Number 199 because 197 is on main and 198 is the country-only Ayşe migration on the release branches.
All routes use the service role, so doctor scoping is in code: `pediHasta` / `hastaSahibiMi` for the patient, `.eq('doctor_id', …)` for every row; foreign ids answer 404;
the KD route answers 403 to every other branş. Cross-doctor tests: `lib/security/hasta-izolasyon.test.ts` (6 new cases); leak tests: `specialties/pediatri/tests/prematurSizinti.test.ts`.

## Tests

`lib/clinical/prematur/*.test.ts` (corrected age 24–42 weeks, birth-date boundaries, term unaffected, follow-up dates, thresholds),
`specialties/pediatri/tests/{buyumeDuzeltilmis,prematurKohort,prematurSizinti,asiPlan}.test.ts`, `specialties/kadin-dogum/tests/erkenDogum.test.ts`,
`lib/doktor/doktorAraclari.test.ts` (tiles, deep-link guards, foreign-branş absence).
