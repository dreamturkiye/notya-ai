# Country × specialty depth audit against the Pediatri gold standard (ULKE-BRANS-DERINLIK-2026-11)

**Banner:** pre-work audit 2026-11-08 (Phase 1), with a status column updated after each build wave. **Latest checkpoint: the third job of 2026-11-08 (section below): AU mean 78 → 89.7 with 37 of 44 roles ≥90; UZ 58 → 81.2 (29 of 42 ≥90 once Kaan switches the prepared UZ assistant on).** Scope: every role offered
at sign-up in us, gb, ca, au, nz, uz — 290 roles — scored against `docs/ULKE-BRANS-ALTIN-STANDART.md` (12 items, weights total 100).
Read from the live branch tips: release/us d61b7b29c, release/gb f39eaf778, release/ca 296902230, release/au 858f91015, release/nz 7c88a7ddb, release/uz 4a3c459ec; main 60edf1636.

**Method.** A script loaded each country pack exactly as its build does (`NOTYA_COUNTRY=<cc>`, `countries/active/*`) and
read, per role: whose note template it uses (own / mapped `gibi` / general), whose intake questions, every tool it sees
and which of them are role-specific (visible to ≤3 roles) and clinical (not the templated per-role structural set), the
citation of each tool, and the reference block the live assistant receives (`canliAsistan.kaynakBlogu`). Scores are computed
from that data by fixed rules (scratch: `derinlik/skor.py`), so they can be re-run after each wave. No item is scored above
what the code shows; K12 (specialist validation) is Missing everywhere because no clinician of any of the six countries has
signed off country content.

**Verdict.** No role in any country reaches the Pediatri bar. Australia is the deepest build (per-role national sources and
books for the assistant, per-role SOAP locks, flags/care-plan/review tools and portal chapters for all 44 roles) but its
per-role tools are mostly a templated structural set, scales are few, and nothing is clinician-validated: 0 Strong, 12 Partial.
The earlier AU-40-PEDIATRI-AUDIT-03 claim of "44/44 Strong" is not supported by this method. The other five countries have
an own note template, an own intake set and 1–4 tools for each shared role, no references feeding an assistant (GB and CA
run the live assistant with an empty reference block; US, NZ and UZ have no live assistant), and a shared portal shell.
Every role that exists only in one country falls back to a mapped role's template and questions and has no own tool: those
are the Missing rows and the first gaps to close.

**Post-wave-1 (2026-11-08, same method):** every Missing row is closed — each country-only role now writes with note fields
of its own kind and (except UZ) asks intake questions of its own, with leak tests both directions; GB and CA roles gained
their country's verified practice sources for the live assistant. No role reaches Strong: per-role clinical tools and scales
(K2/K3), portal chapters (K6), specialty consent/report/prescription/views (K7–K10) and clinician validation (K12) remain
the gap, logged as ULKE-BRANS-DERINLIK-01..08, ULKE-BRANS-KLINISYEN-01 and ULKE-BRANS-GATE-01 in docs/OPEN-COMMITMENTS.md.
Wave commits: release/us 85f5316cb, release/gb 71e74d677, release/ca 57de04fcc, release/nz b53d6523e, release/au 074fa789e, release/uz 0067e1e3f.

## Depth wave of 2026-11-08 (third job): shared infrastructure, Uzbekistan first, then Australia — status checkpoint

Kaan's order (relayed 2026-11-08): AU and UZ first, bar 90+ against Pediatri; then the scope change "build the Uzbek ones as high
as you can get them" (UZ first, a live UZ assistant through country data and config, the founder lock untouched).

**Scoring rules re-checked before the work.** The two rules of the second job only count real, wired artifacts: K7 counts a
role-specific consent record (`-consent`, `-rozilik`) that is a tool visible to that role only; K8 counts a role's own report or
conclusion (`-report`, `-xulosa`) marked `yazdirilir`, which `components/ulke/uygulama/Araclar.tsx` and `AracKayitlari.tsx` print
through `YazdirKagidi` with the BELGE-NO-01 number and verification QR (`/api/ulke/belge`), the print words present in en-AU and in
all three UZ forms. Re-running the extraction on the unchanged release tips gives the same baseline: **AU 78, UZ 58** — no
correction was needed. **Rules added this job (each reads a real artifact):** K1 Strong also where the role's note instruction
carries its own SOAP lock (UZ); K6 Strong = the role's own patient chapter AND the portal demo fixture renders it; K9 Strong = the
role's own dose engine AND its own order presets, Partial = order presets only; K10 Strong = the patient file's specialty tab
exists for the role (pack words + at least two of the role's own scores or calculators), Partial = one; K4 for UZ needs a
"BOOKS" section (no length shortcut), and is scored twice: as shipped (no assistant consumes it) and "after the go" (the prepared
block, if Kaan switches the assistant on — ULKE-UZ-CANLI-01).

**Built (shared, all six country builds, one look):** the specialty dose engine and per-role order presets
(`lib/ulke/araclar/dozMotoru.ts`: per kg, per m² with Mosteller when no area is entered, fixed dose; the clinician enters every
amount, concentration and ceiling — the founder rule of `specialties/pediatri/engines/doz.ts`; order presets are item names
only); the patient file's specialty tab (`lib/ulke/araclar/uzmanlikSekmesi.ts`, `components/ulke/uygulama/UzmanlikSekmesi.tsx`,
loaded with next/dynamic, sharing one read of the kept results with the Tools card through `kayitOkuma.ts`); the portal demo
fixture (`lib/ulke/portal/demo.ts`) and the doctor's preview on the patient-access card, drawn with the patient page's own
view; language-aware patient chapters (`lib/ulke/portal/bolum.ts`). Leak tests both ways: `lib/ulke/araclar/uzmanlikDerinlik.paket.test.ts`
(run for every country), `lib/ulke/araclar/dozMotoru.test.ts`. **UZ:** SOAP lock per role in three forms
(`countries/uz/klinik/soapKilitleri.ts`), dose/order tools (`countries/uz/uygulama/araclar/kendi/uzmanlik/dozSiparis.ts`),
patient chapters and preview words (`countries/uz/uygulama/portalBolumleri.ts`), the live assistant's settings and per-role
sources (`countries/uz/klinik/canli.ts`, `kaynaklar.ts`) — NOT switched on, see ULKE-UZ-CANLI-01. **AU:** dose/order tools
(`countries/au/araclar/uzmanlik/dozSiparis.ts`), GPCCMP and MHTP records (`mbs.ts`), four practice notes corrected after a web
check (DERINLIK-13). AU assistant code and prompts: untouched. Founder lock: no hashed file changed.

| Country | Roles | Mean before → after | ≥90 before → after | Note |
|---|---|---|---|---|
| au | 44 | 78 → 89.7 | 0 → 37 | the 7 allied professions stop at 88 (K9 Partial: no medicine-dose engine — ULKE-BRANS-K9-MUTTEFIK) |
| uz | 42 | 58 → 81.2 | 0 → 0 | after Kaan's go on the assistant: mean 89.0, **29 / 42 ≥90** |
| us | 51 | 28.7 → 29.7 | 0 → 0 | shared infrastructure only (the specialty tab shows each role's own scores where it has any); per-role content OPEN |
| gb | 53 | 34.4 → 35.3 | 0 → 0 | as us |
| ca | 47 | 35.3 → 36.4 | 0 → 0 | as us |
| nz | 53 | 28.5 → 29.3 | 0 → 0 | as us |

Commits (one per branch, pushed 2026-11-08): release/uz d0e36609d, release/au b3d0f2f59, release/gb 105ff2494, release/ca 572e9b51d,
release/nz e3261c1b9, release/us 5b1c3ff7d. Tests on every branch: `npm run test:ses` passes (lock manifest unchanged); tsc at its
baseline (au 13, uz 2, gb 2, ca 2, nz 2, us 0); the country suite has no new failure against the same-tip baseline other than two
load-sensitive tests that fail the same way on the untouched tips (Turkish-text ceiling script, one voice leak test), and fixes the
stale English country records.

**What stands between the remaining roles and 90.** AU: K5 Strong and K12 need a practising specialist's sign-off
(ULKE-BRANS-KLINISYEN-01); for the 7 allied roles also the K9 decision. UZ: the live assistant (Kaan's go on the locked voice route,
ULKE-UZ-CANLI-01) for every role; then for 13 roles DERINLIK-14 (own intake questions for 7 roles, more sourced scores for 4, a book
for 2); K5 Strong and K12 need Uzbek clinicians. No role in any country can reach 100 without clinician validation.

**Sources opened this job** — UZ: MoH national clinical protocols (gov.uz/ssv files on api-portal.gov.uz): order No. 195 of
14.06.2024 (annex of eleven protocols: arterial hypertension, chronic IHD, asthma, COPD, diabetes types 1 and 2, viral cirrhosis,
hepatitis B with/without delta, hepatitis C, antenatal care, family-planning guide), order No. 107 of 29.03.2024 (children's
Hodgkin lymphoma), order No. 401 of 25.12.2024 (gestational diabetes, sarcoidosis, influenza/ARVI, developmental hip dislocation,
ovarian cancer, atopic dermatitis), order No. 180 of 23.06.2025 (type 2 diabetes, acne); GEOTAR-Media "Национальные руководства"
confirmed on geotar.ru, labirint.ru, mmbook.ru and medical-university library lists (kirovgma.ru, dgmu.ru, medbibl.igma.ru,
rsmu.ru). Form 025's approving order: not found (lex.uz, gov.uz; three searches) — not shipped. AU: MBS Online "Upcoming
Changes to Chronic Disease Management Framework – GPCCMPs"; RACGP "Changes to MBS mental health items from 1 November 2025";
Medical Board of Australia cosmetic guidelines (1 July 2023) and its BDD-screening FAQ; COPE 2023 GP summary; Cancer Care Ontario
carboplatin monograph; Mosteller 1987 (PubMed 3657876).

### Australia — per role after this wave

| Role | Before | After | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `emergency-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `family-medicine` | 81 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `anaesthesia` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `neurosurgery` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `paediatric-surgery` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `internal-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `dermatology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `endocrinology` | 79 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `infectious-diseases` | 79 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `gastroenterology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `general-surgery` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `cardio-thoracic-surgery` | 79 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `respiratory-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `ophthalmology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `obstetrics-gynaecology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `vascular-surgery` | 79 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `cardiology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `otolaryngology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `nephrology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `neurology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `oncology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `radiation-oncology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `orthopaedics` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `paediatrics` | 81 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `plastic-surgery` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `psychiatry` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `radiology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `rheumatology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `urology` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `sports-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `rehabilitation-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `geriatric-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `immunology-and-allergy` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `haematology` | 79 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `pain-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `aesthetic-surgery` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `aesthetic-medicine` | 78 | 90 | S | S | S | S | P | S | P | S | S | S | S | M |
| `physiotherapy` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `clinical-psychology` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `dietetics` | 79 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `occupational-therapy` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `audiology` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `podiatry` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |
| `speech-pathology` | 78 | 88 | S | S | S | S | P | S | P | S | P | S | S | M |

### Uzbekistan — per role after this wave

| Role | Before | After | After the go | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `acil-tip` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `aile-hekimligi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `anestezi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `beyin-cerrahisi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `cocuk-cerrahisi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `dahiliye` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `dermatoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `endokrinoloji` | 60 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `enfeksiyon-hastaliklari` | 60 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `gastroenteroloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `genel-cerrahi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `gogus-cerrahisi` | 55 | 78 | 86 | S | S | P | T | P | S | P | S | S | S | S | M |
| `gogus-hastaliklari` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `goz-hastaliklari` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `kadin-hastaliklari-dogum` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `kalp-damar-cerrahisi` | 56 | 78 | 86 | S | S | P | T | P | S | P | S | S | S | S | M |
| `damar-cerrahisi` | 58 | 80 | 88 | S | S | S | T | T | S | P | S | S | S | S | M |
| `kardiyoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `kulak-burun-bogaz` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `nefroloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `noroloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `onkoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `ortopedi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `pediatri` | 60 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `plastik-cerrahi` | 59 | 82 | 86 | S | S | S | T | P | S | P | S | S | S | S | M |
| `psikiyatri` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `radyoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `romatoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `uroloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `spor-hekimligi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `fizik-tedavi` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `alerji-immunoloji` | 57 | 80 | 88 | S | S | S | T | T | S | P | S | S | S | S | M |
| `reproduktoloji` | 57 | 80 | 88 | S | S | S | T | T | S | P | S | S | S | S | M |
| `cocuk-norolojisi` | 57 | 80 | 88 | S | S | S | T | T | S | P | S | S | S | S | M |
| `narkoloji` | 47 | 76 | 84 | S | S | P | T | T | S | P | S | S | S | S | M |
| `diyetoloji` | 53 | 76 | 84 | S | S | P | T | T | S | P | S | S | S | S | M |
| `surdoloji` | 57 | 80 | 88 | S | S | S | T | T | S | P | S | S | S | S | M |
| `estetik-cerrahi` | 59 | 82 | 86 | S | S | S | T | P | S | P | S | S | S | S | M |
| `medikal-estetik` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `klinik-dermatoloji` | 59 | 82 | 90 | S | S | S | T | P | S | P | S | S | S | S | M |
| `fizyoterapi` | 59 | 80 | 88 | S | S | S | T | P | S | P | S | P | S | S | M |
| `klinik-psikolog` | 59 | 80 | 88 | S | S | S | T | P | S | P | S | P | S | S | M |


## Depth wave of 2026-11-08 (second job): Australia and Uzbekistan — status checkpoint

Same extraction (`cikar.mts`, now also reading whether a role tool prints) and the same scoring script with two rule
additions that only recognise real artifacts: **K7** also counts a role's consent record keyed `rozilik` (Uzbek), and **K8** is
Strong when the role has its own specialty report/conclusion (`-report` / `-xulosa`) that prints on the letterhead with the
BELGE-NO-01 document number and verification QR (print and share). **K11** is Strong for every AU and UZ role: each role's new
tools are held by a role-specific leak test both ways (`countries/au/araclar/uzmanlik/uzmanlik.test.ts`,
`countries/uz/uygulama/araclar/kendi/uzmanlik/uzmanlik.test.ts`). Commits: release/au d7b74b6e6 (tools, consent, report) and 280951046 (tick-only scores ask for their fields); release/uz 569aa9faa.

| Country | Roles | Mean before → after | ≥90 before → after | Strong/Partial/Thin/Missing after |
|---|---|---|---|---|
| au | 44 | 55 → 78 | 0 → 0 | 0 / 44 / 0 / 0 |
| uz | 42 | 30 → 58 | 0 → 0 | 0 / 40 / 2 / 0 |

**Why no role reaches 90 yet.** AU: K6 (portal module with demo fixture), K9 (specialty dose engine + presets) and K10 (own
patient-file tabs) need new shared infrastructure; K5 Strong and K12 need a practising specialist's sign-off. Ceiling without
those: 92.8 with all of K6/K9/K10 Strong. UZ: additionally K1 (no per-role SOAP lock in the note instruction) and K4 (no live
assistant, so no reference block has a consumer) — without an assistant the UZ ceiling is about 87. Logged as ULKE-BRANS-DERINLIK-02/-03/-05/-09.

### Australia — per role after this wave

| Role | Before | After | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `emergency-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `family-medicine` | 68 | 81 | S | S | S | S | P | P | P | S | T | P | S | M | wave 2026-11-08: specialty tools + consent + report |
| `anaesthesia` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `neurosurgery` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `paediatric-surgery` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `internal-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `dermatology` | 58 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `endocrinology` | 54 | 79 | S | S | S | S | P | P | P | S | T | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `infectious-diseases` | 54 | 79 | S | S | S | S | P | P | P | S | T | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `gastroenterology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `general-surgery` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `cardio-thoracic-surgery` | 54 | 79 | S | S | S | S | P | P | P | S | T | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `respiratory-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `ophthalmology` | 56 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `obstetrics-gynaecology` | 74 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `vascular-surgery` | 56 | 79 | S | S | S | S | P | P | P | S | T | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `cardiology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `otolaryngology` | 56 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `nephrology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `neurology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `oncology` | 56 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `radiation-oncology` | 57 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `orthopaedics` | 54 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `paediatrics` | 68 | 81 | S | S | S | S | P | P | P | S | T | P | S | M | wave 2026-11-08: specialty tools + consent + report |
| `plastic-surgery` | 58 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `psychiatry` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `radiology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `rheumatology` | 56 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `urology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `sports-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `rehabilitation-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `geriatric-medicine` | 54 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `immunology-and-allergy` | 50 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `haematology` | 56 | 79 | S | S | S | S | P | P | P | S | T | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `pain-medicine` | 54 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `aesthetic-surgery` | 58 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `aesthetic-medicine` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `physiotherapy` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `clinical-psychology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `dietetics` | 70 | 79 | S | S | S | S | P | P | P | S | M | P | S | M | wave 2026-11-08: specialty tools + consent + report |
| `occupational-therapy` | 48 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `audiology` | 56 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `podiatry` | 50 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |
| `speech-pathology` | 52 | 78 | S | S | S | S | P | P | P | S | M | T | S | M | wave 2026-11-08: specialty tools + consent + report |

### Uzbekistan — per role after this wave

| Role | Before | After | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `acil-tip` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `aile-hekimligi` | 34 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `anestezi` | 34 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `beyin-cerrahisi` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `cocuk-cerrahisi` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `dahiliye` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `dermatoloji` | 46 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `endokrinoloji` | 27 | 60 | P | S | S | T | P | T | P | S | T | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `enfeksiyon-hastaliklari` | 27 | 60 | P | S | S | T | P | T | P | S | T | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `gastroenteroloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `genel-cerrahi` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `gogus-cerrahisi` | 26 | 55 | P | S | P | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `gogus-hastaliklari` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `goz-hastaliklari` | 32 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `kadin-hastaliklari-dogum` | 55 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `kalp-damar-cerrahisi` | 32 | 56 | P | S | P | T | P | T | P | S | T | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `damar-cerrahisi` | 31 | 58 | P | S | S | T | T | T | P | S | T | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `kardiyoloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `kulak-burun-bogaz` | 37 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `nefroloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `noroloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `onkoloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `ortopedi` | 32 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `pediatri` | 38 | 60 | P | S | S | T | P | T | P | S | T | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `plastik-cerrahi` | 35 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `psikiyatri` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `radyoloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `romatoloji` | 32 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `uroloji` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `spor-hekimligi` | 29 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `fizik-tedavi` | 30 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `alerji-immunoloji` | 20 | 57 | P | S | S | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `reproduktoloji` | 20 | 57 | P | S | S | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `cocuk-norolojisi` | 20 | 57 | P | S | S | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `narkoloji` | 20 | 47 | P | P | P | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `diyetoloji` | 25 | 53 | P | S | P | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `surdoloji` | 31 | 57 | P | S | S | T | T | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `estetik-cerrahi` | 35 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `medikal-estetik` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `klinik-dermatoloji` | 46 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `fizyoterapi` | 30 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |
| `klinik-psikolog` | 26 | 59 | P | S | S | T | P | T | P | S | M | M | S | M | wave 2026-11-08: specialty tools + consent + report |


## Per-country summary

| Country | Roles | Mean (before) | Strong / Partial / Thin / Missing (before) | Mean (after) | Strong / Partial / Thin / Missing (after) |
|---|---|---|---|---|---|
| United States (us) | 51 | 27 | 0 / 1 / 41 / 9 | 29 | 0 / 1 / 50 / 0 |
| United Kingdom (gb) | 53 | 26 | 0 / 1 / 41 / 11 | 34 | 0 / 1 / 52 / 0 |
| Canada (ca) | 47 | 28 | 0 / 1 / 39 / 7 | 35 | 0 / 1 / 46 / 0 |
| Australia (au) | 44 | 54 | 0 / 12 / 32 / 0 | 55 | 0 / 15 / 29 / 0 |
| New Zealand (nz) | 53 | 27 | 0 / 1 / 41 / 11 | 29 | 0 / 1 / 52 / 0 |
| Uzbekistan (uz) | 42 | 29 | 0 / 1 / 36 / 5 | 30 | 0 / 1 / 41 / 0 |

Role counts verified against the live branches (`uygulama.roller` of each pack): US 51, GB 53, CA 47, AU 44, NZ 53, UZ 42 —
identical to the sign-up lists in the brief.

## Regulatory recognition gate — country-only roles (re-checked 2026-11-08)

| Country | Role(s) | Regulator source (opened this session) | Result |
|---|---|---|---|
| us | Allergy and Immunology; Geriatric Medicine; Pain Medicine; Sleep Medicine; Colon and Rectal Surgery; Hospice and Palliative Medicine; Reproductive Endocrinology and Infertility; Radiation Oncology; Child and Adolescent Psychiatry; Addiction Medicine | ABMS, "Specialty and Subspecialty Certificates", abms.org/member-boards/specialty-subspecialty-certificates/ (each found as a specialty or subspecialty certificate; Addiction Medicine under the American Board of Preventive Medicine) | PASS |
| us | Speech-Language Pathologist | ASHA, "Occupational Licensure Reform", asha.org/advocacy/occupational-licensure/ (licensure requirements for SLPs across the states and DC) | PASS |
| us | Licensed Clinical Social Worker | ASWB, "Spotlight on Regulation" (aswb.org PDF): social work regulated in all 50 states and DC; clinical licence category | PASS |
| gb | Clinical oncology; Genito-urinary medicine; Community sexual and reproductive health; Occupational medicine; Old age psychiatry; Oral and maxillo-facial surgery; Audio vestibular medicine; Palliative medicine; Allergy; Haematology; Geriatric medicine; Child and adolescent psychiatry | The Postgraduate Medical Education and Training Order of Council 2010, Schedule "Recognised specialities within the United Kingdom", legislation.gov.uk/uksi/2010/473/schedule (point-in-time 2020-12-31). Note: the Order names "Community sexual health and reproduction"; the pack writes "Community sexual and reproductive health" (naming check for a UK lead) | PASS |
| gb | Podiatrist; Speech and language therapist | HCPC, "The professions", hcpc-uk.org/about-us/who-we-regulate/the-professions/ (protected titles Chiropodist/Podiatrist; Speech and language therapist) | PASS |
| ca | Respirology; Clinical Immunology and Allergy; Geriatric Medicine; Hematology; Pain Medicine; Gynecologic Reproductive Endocrinology and Infertility; Vascular Surgery | Royal College of Physicians and Surgeons of Canada, Specialty Committees Table B (news.royalcollege.ca PDF) | PASS |
| ca | Psychotherapist / counselling therapist | CCPA, "The profession", ccpa-accp.ca/profession/: psychotherapist title + controlled act regulated in Ontario and Quebec; Counselling Therapist title in NS, NB, PEI; unregulated or in process elsewhere | PASS with a flag: the title a member may use depends on the province (local lawyer) |
| au | Cardio-thoracic surgery; Vascular surgery; Radiation oncology; Geriatric medicine; Immunology and allergy; Haematology; Pain medicine | Medical Board of Australia list of specialties (effective 22 Sep 2025) — opened by the AU role audit on 2026-10-10 (countries/au/klinik/rolListesi.ts); this session could not reopen the PDF (URL not on the fetch allowlist): UNVERIFIED THIS SESSION, relies on the 2026-10-10 reading | PASS (prior reading) |
| au | Podiatrist | Ahpra, "Specialties and specialty fields" (podiatric surgery under the Podiatry Board): podiatry is a registered profession | PASS |
| au | Speech pathologist | Ahpra professions list (prior reading 2026-10-10) + AHPA "self-regulated profession" | PASS (self-regulated) |
| au | Non-surgical cosmetic procedures | Ahpra news 2025-09-02, "Putting patients first: New guidelines for cosmetic procedures" (guidelines for practitioners who perform non-surgical cosmetic procedures, effective 2 Sep 2025) — a regulated practice area, not a specialty | PASS (practice area under general registration) |
| nz | Urgent care medicine; Rural hospital medicine; Musculoskeletal medicine; Occupational medicine; Pain medicine; Sexual health medicine; Family planning and reproductive health; Palliative medicine; Oral and maxillofacial surgery | Medical Council of NZ, "Types of vocational scope", mcnz.org.nz (36 vocational scopes; all nine present) | PASS |
| nz | Osteopath; Chiropractor; Psychotherapist; Podiatrist | Manatū Hauora, "Responsible authorities" (HPCA Act 2003): Osteopathic Council, Chiropractic Board, Psychotherapists Board, Podiatrists Board | PASS |
| uz | Narkologiya; Reproduktologiya; Bolalar nevrologiyasi; Diyetologiya; Surdologiya; Allergologiya va klinik immunologiya; Qon tomirlar xirurgiyasi; Tibbiy kosmetologiya | MoH order "Tibbiy faoliyat amalga oshiriladigan tibbiy ixtisosliklar turlari nomenklaturasini tasdiqlash to'g'risida", reg. No. 3303, 12.05.2021, lex.uz/docs/5422572 (version amended 2023): all present | PASS |
| uz | Jismoniy reabilitatsiya mutaxassisi (non-doctor physiotherapist) | Same order names the field inside "Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya)" (a doctor specialty); no independent non-doctor licence (UZ-OZEL-BRANS-REGULATORY-01) | PASS with a flag (medium confidence, unchanged) |

**Shared roles that fail a strict recognition test (flagged, not built):** no regulator of the six lists a "longevity" or
"hair transplantation" specialty. NZ's 36 vocational scopes (opened above) have neither, nor "cosmetic medicine"; the UK
schedule has neither; ABMS and the Royal College of Canada list neither. AU and UZ already dropped or folded them. In US,
GB, CA and NZ, `longevity` and `hair-transplant` (and NZ `aesthetic-medicine` "Cosmetic medicine") are practised by registered
doctors under general or another specialist registration, so the UZ worked example ("fold into the licence that covers it")
applies: a product decision for Kaan with local counsel (OPEN-COMMITMENTS `ULKE-BRANS-GATE-01`). No new depth was built for them.

**Recognised scopes not offered (market gap, not a gate failure):** NZ vascular surgery and radiation oncology are MCNZ
vocational scopes but have no NZ role; CA lists Palliative Medicine, Occupational Medicine and Child and Adolescent Psychiatry
(subspecialties) with no CA role. Logged in `ULKE-BRANS-GATE-01`.

## References per role — what each country feeds the assistant today

| Country | Reference block for the assistant | Country-specific? |
|---|---|---|
| au | Per-role Australian authorities (≥4) + books (AU/ANZ first, international depth), 44/44 roles; 15 roles have no verified Australian-authored book (AU-KITAP-01) | Yes (verified 2026-10-22 by the AU job) |
| gb | Live assistant on; `kaynakBlogu` returns null for every role (before this job) | — |
| ca | Live assistant on; `kaynakBlogu` returns null for every role (before this job) | — |
| us, nz, uz | No live assistant in the pack; references would have no consumer. Only tool citations (`kaynak`) are shown | Tool citations only |

Tool citations in all five non-AU packs name each tool's published source; none was found citing Turkish or another
country's body for a country parameter (the packs' parameter sources are their own national bodies, e.g. NIDDK for US units).

## Per-role scores

Pills per checklist item (S = Strong, P = Partial, T = Thin, M = Missing). "Content" = whose note template the role uses.
"Fit" = clinical fit of a mapping, this job's reading. "Status" = what the build waves changed.

### United States (us) — 51 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Emergency medicine (`emergency-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Family medicine (`family-medicine`) | 37 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Anesthesiology (`anaesthesia`) | 34 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Neurosurgery (`neurosurgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Pediatric surgery (`paediatric-surgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Internal medicine (`internal-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dermatology (`dermatology`) | 40 | Thin | P | P | P | T | P | T | M | T | M | M | P | M | own | — | open |
| Endocrinology (`endocrinology`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Infectious disease (`infectious-diseases`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Gastroenterology (`gastroenterology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| General surgery (`general-surgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Thoracic and Cardiac Surgery (`thoracic-surgery`) | 30 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Pulmonary Disease (`respiratory-medicine`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Ophthalmology (`ophthalmology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Obstetrics and gynecology (`obstetrics-gynaecology`) | 55 | Partial | P | S | S | T | P | T | P | P | M | M | P | M | own | — | open |
| Vascular Surgery (`cardiovascular-surgery`) | 32 | Thin | P | P | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Cardiology (`cardiology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Otolaryngology (ENT) (`otolaryngology`) | 37 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Nephrology (`nephrology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Neurology (`neurology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Hematology/Oncology (`oncology`) | 37 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Orthopedic surgery (`orthopaedics`) | 32 | Thin | P | P | M | M | P | T | M | P | M | M | P | M | own | — | open |
| Pediatrics (`paediatrics`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Plastic surgery (`plastic-surgery`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Psychiatry (`psychiatry`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Diagnostic Radiology (`radiology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Rheumatology (`rheumatology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Urology (`urology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Sports medicine (`sports-medicine`) | 29 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Physical medicine and rehabilitation (`rehabilitation-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Allergy and Immunology (`allergy-immunology`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss allergen exposure, reaction history, testing and immunotherapy | wave 1: own note fields + own intake questions + leak tests |
| Geriatric Medicine (`geriatric-medicine`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | partial — misses function, falls, cognition, polypharmacy review | wave 1: own note fields + own intake questions + leak tests |
| Pain Medicine (`pain-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to rehabilitation-medicine | partial — rehabilitation fields miss pain history, analgesic and opioid record | wave 1: own note fields + own intake questions + leak tests |
| Sleep Medicine (`sleep-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to respiratory-medicine | partial — respiratory fields miss sleep history and sleep-study findings | wave 1: own note fields + own intake questions + leak tests |
| Colon and Rectal Surgery (`colon-rectal-surgery`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to general-surgery | good — general-surgery fields fit; colorectal specifics (bowel, continence) missing | wave 1: own note fields + own intake questions + leak tests |
| Radiation Oncology (`radiation-oncology`) | 30 → 38 | Thin | T | P | T | T | T | T | M | T | M | M | P | M | mapped to oncology | partial — oncology fields miss radiotherapy course, dose fractions as stated, skin/toxicity | wave 1: own note fields + own intake questions + leak tests |
| Child and Adolescent Psychiatry (`child-adolescent-psychiatry`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to psychiatry | partial — adult psychiatry fields miss development, school and family context | wave 1: own note fields + own intake questions + leak tests |
| Addiction Medicine (`addiction-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to psychiatry | partial — psychiatry fields; substance-specific history, withdrawal and treatment programme missing | wave 1: own note fields + own intake questions + leak tests |
| Hospice and Palliative Medicine (`hospice-palliative-medicine`) | 25 → 34 | Thin | T | T | T | T | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss symptom burden, goals of care, advance care planning | wave 1: own note fields + own intake questions + leak tests |
| Reproductive Endocrinology and Infertility (`reproductive-endocrinology-infertility`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to obstetrics-gynaecology | partial — obstetric fields miss fertility history, partner factors, cycle monitoring | wave 1: own note fields + own intake questions + leak tests |
| Hair transplantation (`hair-transplant`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Cosmetic surgery (`aesthetic-surgery`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Aesthetic medicine (`aesthetic-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Preventive and longevity medicine (`longevity`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Physical therapist (`physiotherapy`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Clinical psychologist (`clinical-psychology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dietitian (`dietetics`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Occupational therapist (`occupational-therapy`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Audiologist (`audiology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Speech-Language Pathologist (`speech-language-pathology`) | 23 → 27 | Thin | P | T | M | M | T | T | M | T | M | M | P | M | own | own template; intake borrowed from occupational therapy (wrong focus) | wave 1: own note fields + own intake questions + leak tests |
| Licensed Clinical Social Worker (`clinical-social-work`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to clinical-psychology | partial — psychology fields miss psychosocial needs, resources and safeguarding | wave 1: own note fields + own intake questions + leak tests |

### United Kingdom (gb) — 53 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Emergency medicine (`emergency-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| General practice (`family-medicine`) | 30 → 37 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Anaesthetics (`anaesthesia`) | 34 → 37 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Neurosurgery (`neurosurgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Paediatric surgery (`paediatric-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| General (internal) medicine (`internal-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Dermatology (`dermatology`) | 40 → 43 | Thin | P | P | P | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Endocrinology and diabetes mellitus (`endocrinology`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Infectious diseases (`infectious-diseases`) | 21 → 28 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Gastroenterology (`gastroenterology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| General surgery (`general-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Cardio-thoracic surgery (`thoracic-surgery`) | 30 → 37 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Respiratory medicine (`respiratory-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Ophthalmology (`ophthalmology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Obstetrics and gynaecology (`obstetrics-gynaecology`) | 55 → 59 | Partial | P | S | S | T | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Vascular surgery (`cardiovascular-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Cardiology (`cardiology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Otolaryngology (`otolaryngology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Renal medicine (`nephrology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Neurology (`neurology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Medical oncology (`oncology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Clinical oncology (`clinical-oncology`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to oncology | partial — oncology fields miss radiotherapy course | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Trauma and orthopaedic surgery (`orthopaedics`) | 32 → 39 | Thin | P | P | M | M | P | T | M | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Paediatrics (`paediatrics`) | 38 → 42 | Thin | P | P | T | T | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Plastic surgery (`plastic-surgery`) | 35 → 43 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| General psychiatry (`psychiatry`) | 21 → 28 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Clinical radiology (`radiology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Rheumatology (`rheumatology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Urology (`urology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Sport and exercise medicine (`sports-medicine`) | 29 → 33 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Rehabilitation medicine (`rehabilitation-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Geriatric medicine (`geriatric-medicine`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | partial — misses function, falls, cognition, polypharmacy review | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Haematology (`haematology`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss blood counts, transfusion, anticoagulation | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Allergy (`allergy`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss allergen exposure and testing | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Genito-urinary medicine (`genito-urinary-medicine`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to infectious-diseases | partial — infectious-disease fields miss sexual history and partner notification | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Community sexual and reproductive health (`community-sexual-reproductive-health`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to obstetrics-gynaecology | partial — obstetric template; contraception focus missing | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Occupational medicine (`occupational-medicine`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — no work history, exposure, fitness-for-work fields | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Child and adolescent psychiatry (`child-adolescent-psychiatry`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to psychiatry | partial — adult psychiatry fields miss development, school and family context | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Old age psychiatry (`old-age-psychiatry`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to psychiatry | partial — psychiatry fields miss cognition and carer context | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Oral and maxillo-facial surgery (`oral-maxillofacial-surgery`) | 23 → 34 | Thin | P | T | M | M | T | T | M | T | M | M | P | M | own | GB own template; NZ mapped to plastic surgery (partial) | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Palliative medicine (`palliative-medicine`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss symptom burden and goals of care | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Audio vestibular medicine (`audio-vestibular-medicine`) | 30 → 37 | Thin | P | T | T | T | T | T | M | T | M | M | P | M | own | own template; intake borrowed from audiology | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Hair transplantation (`hair-transplant`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Cosmetic surgery (`aesthetic-surgery`) | 35 → 43 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Aesthetic medicine (`aesthetic-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Preventive and longevity medicine (`longevity`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Physiotherapist (`physiotherapy`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Clinical psychologist (`clinical-psychology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Dietitian (`dietetics`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Occupational therapist (`occupational-therapy`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Audiologist (`audiology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Podiatrist (`podiatry`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to physiotherapy | weak — physiotherapy fields miss foot/vascular/neuropathy assessment | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Speech and language therapist (`speech-language-therapy`) | 23 → 34 | Thin | P | T | M | M | T | T | M | T | M | M | P | M | own | own template; intake borrowed from occupational therapy (wrong focus) | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |

### Canada (ca) — 47 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Emergency medicine (`emergency-medicine`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Family medicine (`family-medicine`) | 32 → 39 | Thin | P | P | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Anesthesiology (`anaesthesia`) | 34 → 37 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Neurosurgery (`neurosurgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Pediatric surgery (`paediatric-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Internal Medicine (`internal-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Dermatology (`dermatology`) | 40 → 43 | Thin | P | P | P | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Endocrinology and metabolism (`endocrinology`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Infectious diseases (`infectious-diseases`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Gastroenterology (`gastroenterology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| General surgery (`general-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Thoracic surgery (`thoracic-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Respirology (`respiratory-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Ophthalmology (`ophthalmology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Obstetrics and gynecology (`obstetrics-gynaecology`) | 55 → 59 | Partial | P | S | S | T | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Cardiac Surgery (`cardiovascular-surgery`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Vascular Surgery (`vascular-surgery`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to cardiovascular-surgery | partial — cardiac+vascular template carries cardiac exam | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Cardiology (`cardiology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Otolaryngology-Head and Neck Surgery (`otolaryngology`) | 37 → 40 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Nephrology (`nephrology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Neurology (`neurology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Medical Oncology (`oncology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Orthopedic surgery (`orthopaedics`) | 32 → 39 | Thin | P | P | M | M | P | T | M | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Pediatrics (`paediatrics`) | 34 → 37 | Thin | P | T | T | T | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Plastic surgery (`plastic-surgery`) | 35 → 43 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Psychiatry (`psychiatry`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Diagnostic radiology (`radiology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Rheumatology (`rheumatology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Urology (`urology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Sport and exercise medicine (`sports-medicine`) | 29 → 33 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Physical medicine and rehabilitation (`rehabilitation-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Clinical Immunology and Allergy (`clinical-immunology-allergy`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — same as US allergy and immunology | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Geriatric Medicine (`geriatric-medicine`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | partial — misses function, falls, cognition, polypharmacy review | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Hematology (`hematology`) | 14 → 30 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine template | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Pain Medicine (`pain-medicine`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to rehabilitation-medicine | partial — rehabilitation fields miss pain history, analgesic and opioid record | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Gynecologic Reproductive Endocrinology and Infertility (`reproductive-endocrinology`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to obstetrics-gynaecology | partial — obstetric fields miss fertility work-up | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| Hair transplantation (`hair-transplant`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Cosmetic surgery (`aesthetic-surgery`) | 35 → 43 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Aesthetic medicine (`aesthetic-medicine`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Dermatology (`clinic-dermatology`) | 46 → 49 | Thin | P | S | P | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Longevity medicine (`longevity`) | 27 → 34 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Physiotherapist (`physiotherapy`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Psychologist (`clinical-psychology`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Dietitian (`dietetics`) | 26 → 33 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Occupational therapist (`occupational-therapy`) | 21 → 28 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Audiologist (`audiology`) | 32 → 36 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | wave 1: country practice sources for the live assistant |
| Psychotherapist / counselling therapist (`psychotherapy`) | 19 → 34 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to clinical-psychology | partial — clinical-psychology template | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |

### Australia (au) — 44 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Emergency medicine (`emergency-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| General practice (`family-medicine`) | 68 | Partial | S | S | P | S | P | P | M | T | T | P | P | M | own | — | open |
| Anaesthesia (`anaesthesia`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Neurosurgery (`neurosurgery`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Paediatric surgery (`paediatric-surgery`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| General medicine (`internal-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Dermatology (`dermatology`) | 58 | Partial | S | P | P | S | P | P | M | T | M | T | P | M | own | — | open |
| Endocrinology (`endocrinology`) | 54 | Thin | S | P | M | S | P | P | M | T | T | T | P | M | own | — | open |
| Infectious diseases (`infectious-diseases`) | 54 | Thin | S | P | M | S | P | P | M | T | T | T | P | M | own | — | open |
| Gastroenterology and hepatology (`gastroenterology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| General surgery (`general-surgery`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Cardio-thoracic surgery (`cardio-thoracic-surgery`) | 54 | Thin | S | P | M | S | P | P | M | T | T | T | P | M | own | — | open |
| Respiratory and sleep medicine (`respiratory-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Ophthalmology (`ophthalmology`) | 56 | Partial | S | P | T | S | P | P | M | T | M | T | P | M | own | — | open |
| Obstetrics and gynaecology (`obstetrics-gynaecology`) | 74 | Partial | S | S | S | S | P | P | P | P | M | T | P | M | own | — | open |
| Vascular surgery (`vascular-surgery`) | 48 → 56 | Thin → Partial | P | P | M | S | P | P | M | T | T | T | P | M | mapped to cardiovascular-surgery | partial — cardiac+vascular template carries cardiac exam | wave 1: own note fields + leak tests (data only) |
| Cardiology (`cardiology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Otolaryngology – head and neck surgery (`otolaryngology`) | 56 | Partial | S | P | T | S | P | P | M | T | M | T | P | M | own | — | open |
| Nephrology (`nephrology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Neurology (`neurology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Medical oncology (`oncology`) | 56 | Partial | S | P | T | S | P | P | M | T | M | T | P | M | own | — | open |
| Radiation oncology (`radiation-oncology`) | 47 → 57 | Thin → Partial | P | P | T | S | T | P | M | T | M | T | P | M | mapped to oncology | partial — oncology fields miss radiotherapy course, dose fractions as stated, skin/toxicity | wave 1: own note fields + own intake questions + leak tests (data only) |
| Orthopaedic surgery (`orthopaedics`) | 54 | Thin | S | P | M | S | P | P | M | P | M | T | P | M | own | — | open |
| Paediatrics and child health (`paediatrics`) | 68 | Partial | S | S | P | S | P | P | M | T | T | P | P | M | own | — | open |
| Plastic surgery (`plastic-surgery`) | 58 | Partial | S | P | M | S | P | P | P | P | M | T | P | M | own | — | open |
| Psychiatry (`psychiatry`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Radiology (`radiology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Rheumatology (`rheumatology`) | 56 | Partial | S | P | T | S | P | P | M | T | M | T | P | M | own | — | open |
| Urology (`urology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Sport and exercise medicine (`sports-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Rehabilitation medicine (`rehabilitation-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Geriatric medicine (`geriatric-medicine`) | 46 → 54 | Thin | P | P | M | S | P | P | M | T | M | T | P | M | mapped to internal-medicine | partial — misses function, falls, cognition, polypharmacy review | wave 1: own note fields + leak tests (data only) |
| Immunology and allergy (`immunology-and-allergy`) | 42 → 50 | Thin | P | T | M | S | P | P | M | T | M | T | P | M | mapped to internal-medicine | weak — internal-medicine template | wave 1: own note fields + leak tests (data only) |
| Haematology (`haematology`) | 48 → 56 | Thin → Partial | P | P | M | S | P | P | M | T | T | T | P | M | mapped to internal-medicine | weak — internal-medicine fields miss blood counts, transfusion, anticoagulation | wave 1: own note fields + leak tests (data only) |
| Pain medicine (`pain-medicine`) | 46 → 54 | Thin | P | P | M | S | P | P | M | T | M | T | P | M | mapped to rehabilitation-medicine | partial — rehabilitation fields miss pain history, analgesic and opioid record | wave 1: own note fields + leak tests (data only) |
| Cosmetic surgery (`aesthetic-surgery`) | 58 | Partial | S | P | M | S | P | P | P | P | M | T | P | M | own | — | open |
| Non-surgical cosmetic procedures (`aesthetic-medicine`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Physiotherapist (`physiotherapy`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Psychologist (`clinical-psychology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Dietitian (`dietetics`) | 70 | Partial | S | S | S | S | P | P | M | T | M | P | P | M | own | — | open |
| Occupational therapist (`occupational-therapy`) | 48 | Thin | S | T | M | S | P | P | M | T | M | T | P | M | own | — | open |
| Audiologist (`audiology`) | 56 | Partial | S | P | T | S | P | P | M | T | M | T | P | M | own | — | open |
| Podiatrist (`podiatry`) | 42 → 50 | Thin | P | T | M | S | P | P | M | T | M | T | P | M | mapped to physiotherapy | weak — physiotherapy fields miss foot/vascular/neuropathy assessment | wave 1: own note fields + leak tests (data only) |
| Speech pathologist (`speech-pathology`) | 52 | Thin | S | P | M | S | P | P | M | T | M | T | P | M | own | — | open |

### New Zealand (nz) — 53 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Emergency medicine (`emergency-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| General practice (`family-medicine`) | 38 | Thin | P | P | T | T | P | T | M | T | T | M | P | M | own | — | open |
| Anaesthesia (`anaesthesia`) | 34 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Neurosurgery (`neurosurgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Paediatric surgery (`paediatric-surgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Internal medicine (`internal-medicine`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dermatology (`dermatology`) | 40 | Thin | P | P | P | T | P | T | M | T | M | M | P | M | own | — | open |
| Endocrinology (`endocrinology`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Infectious diseases (`infectious-diseases`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Gastroenterology (`gastroenterology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| General surgery (`general-surgery`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Cardiothoracic surgery (`thoracic-surgery`) | 30 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Respiratory medicine (`respiratory-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Ophthalmology (`ophthalmology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Obstetrics and gynaecology (`obstetrics-gynaecology`) | 55 | Partial | P | S | S | T | P | T | P | P | M | M | P | M | own | — | open |
| Vascular surgery (`cardiovascular-surgery`) | 32 | Thin | P | P | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Cardiology (`cardiology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Otolaryngology, head and neck surgery (`otolaryngology`) | 37 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Nephrology (`nephrology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Neurology (`neurology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Medical oncology (`oncology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Orthopaedic surgery (`orthopaedics`) | 27 | Thin | P | T | M | M | P | T | M | P | M | M | P | M | own | — | open |
| Paediatrics (`paediatrics`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Plastic and reconstructive surgery (`plastic-surgery`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Psychiatry (`psychiatry`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Diagnostic and interventional radiology (`radiology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Rheumatology (`rheumatology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Urology (`urology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Sport and exercise medicine (`sports-medicine`) | 29 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Rehabilitation medicine (`rehabilitation-medicine`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Urgent care medicine (`urgent-care-medicine`) | 25 | Thin | T | P | M | M | T | T | M | T | T | M | P | M | mapped to emergency-medicine | good — emergency template fits | open |
| Rural hospital medicine (`rural-hospital-medicine`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to family-medicine | partial — family-medicine template | wave 1: own note fields + own intake questions + leak tests |
| Musculoskeletal medicine (`musculoskeletal-medicine`) | 22 → 31 | Thin | T | T | M | T | T | T | M | T | M | M | P | M | mapped to rehabilitation-medicine | partial — rehabilitation template | wave 1: own note fields + own intake questions + leak tests |
| Occupational medicine (`occupational-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to family-medicine | weak — no work history, exposure, fitness-for-work fields | wave 1: own note fields + own intake questions + leak tests |
| Pain medicine (`pain-medicine`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to rehabilitation-medicine | partial — rehabilitation fields miss pain history, analgesic and opioid record | wave 1: own note fields + own intake questions + leak tests |
| Sexual health medicine (`sexual-health-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to family-medicine | partial — family-medicine template | wave 1: own note fields + own intake questions + leak tests |
| Family planning and reproductive health (`family-planning-reproductive-health`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to obstetrics-gynaecology | partial — obstetric template; contraception focus missing | wave 1: own note fields + own intake questions + leak tests |
| Palliative medicine (`palliative-medicine`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to internal-medicine | weak — internal-medicine fields miss symptom burden and goals of care | wave 1: own note fields + own intake questions + leak tests |
| Oral and maxillofacial surgery (`oral-maxillofacial-surgery`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to plastic-surgery | GB own template; NZ mapped to plastic surgery (partial) | wave 1: own note fields + own intake questions + leak tests |
| Hair transplantation (`hair-transplant`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Cosmetic surgery (`aesthetic-surgery`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Cosmetic medicine (`aesthetic-medicine`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dermatology (`clinic-dermatology`) | 46 | Thin | P | S | P | T | P | T | M | T | M | M | P | M | own | — | open |
| Preventive and longevity medicine (`longevity`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Physiotherapist (`physiotherapy`) | 29 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Clinical psychologist (`clinical-psychology`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dietitian (`dietetics`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Occupational therapist (`occupational-therapy`) | 21 | Thin | P | M | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Audiologist (`audiology`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Podiatrist (`podiatry`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to physiotherapy | weak — physiotherapy fields miss foot/vascular/neuropathy assessment | wave 1: own note fields + own intake questions + leak tests |
| Osteopath (`osteopathy`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to physiotherapy | partial — physiotherapy template | wave 1: own note fields + own intake questions + leak tests |
| Chiropractor (`chiropractic`) | 14 → 23 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to physiotherapy | partial — physiotherapy template | wave 1: own note fields + own intake questions + leak tests |
| Psychotherapist (`psychotherapy`) | 19 → 27 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to clinical-psychology | partial — clinical-psychology template | wave 1: own note fields + own intake questions + leak tests |

### Uzbekistan (uz) — 42 roles

| Role | Score | Pill | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | K11 | K12 | Content | Fit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shoshilinch tibbiy yordam (`acil-tip`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Oilaviy shifokorlik (`aile-hekimligi`) | 34 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Anesteziologiya va reanimatologiya (`anestezi`) | 34 | Thin | P | P | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Neyroxirurgiya (`beyin-cerrahisi`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Bolalar xirurgiyasi (`cocuk-cerrahisi`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Terapiya (`dahiliye`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dermatovenerologiya (`dermatoloji`) | 46 | Thin | P | S | P | T | P | T | M | T | M | M | P | M | own | — | open |
| Endokrinologiya (`endokrinoloji`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Yuqumli kasalliklar (`enfeksiyon-hastaliklari`) | 27 | Thin | P | T | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Gastroenterologiya (`gastroenteroloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Xirurgiya (`genel-cerrahi`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Torakal xirurgiya (`gogus-cerrahisi`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Pulmonologiya (`gogus-hastaliklari`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Oftalmologiya (`goz-hastaliklari`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Akusherlik va ginekologiya (`kadin-hastaliklari-dogum`) | 55 | Partial | P | S | S | T | P | T | P | P | M | M | P | M | own | — | open |
| Kardioxirurgiya (`kalp-damar-cerrahisi`) | 32 | Thin | P | P | M | M | P | T | M | T | T | M | P | M | own | — | open |
| Qon tomirlar xirurgiyasi (`damar-cerrahisi`) | 25 → 31 | Thin | T | P | M | M | T | T | M | T | T | M | P | M | mapped to kalp-damar-cerrahisi | partial — cardiac+vascular template | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Kardiologiya (`kardiyoloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Otorinolaringologiya (LOR) (`kulak-burun-bogaz`) | 37 | Thin | P | P | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Nefrologiya (`nefroloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Nevrologiya (`noroloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Onkologiya (`onkoloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Travmatologiya va ortopediya (`ortopedi`) | 32 | Thin | P | P | M | M | P | T | M | P | M | M | P | M | own | — | open |
| Pediatriya (`pediatri`) | 38 | Thin | P | P | T | T | P | T | M | T | T | M | P | M | own | — | open |
| Plastik xirurgiya (`plastik-cerrahi`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Psixiatriya (`psikiyatri`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Tibbiy radiologiya (`radyoloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Revmatologiya (`romatoloji`) | 32 | Thin | P | T | T | T | P | T | M | T | M | M | P | M | own | — | open |
| Urologiya (`uroloji`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Sport tibbiyoti (`spor-hekimligi`) | 29 | Thin | P | T | M | T | P | T | M | T | M | M | P | M | own | — | open |
| Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya) (`fizik-tedavi`) | 30 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Allergologiya va klinik immunologiya (`alerji-immunoloji`) | 14 → 20 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to dahiliye | weak — dahiliye template | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Reproduktologiya (`reproduktoloji`) | 14 → 20 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to kadin-hastaliklari-dogum | partial — obstetric template | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Bolalar nevrologiyasi (`cocuk-norolojisi`) | 14 → 20 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to noroloji | partial — adult neurology template; development missing | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Narkologiya (`narkoloji`) | 14 → 20 | Missing → Thin | T | M | M | M | T | T | M | T | M | M | P | M | mapped to psikiyatri | partial — psychiatry template; substance history and withdrawal missing | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Diyetologiya (`diyetoloji`) | 19 → 25 | Missing → Thin | T | T | M | M | T | T | M | T | M | M | P | M | mapped to diyetisyen | good — dietetics template (doctor role) | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Surdologiya (`surdoloji`) | 25 → 31 | Thin | T | T | T | T | T | T | M | T | M | M | P | M | mapped to odyoloji | good — audiology template (doctor role) | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| Plastik xirurgiya (`estetik-cerrahi`) | 35 | Thin | P | P | M | M | P | T | P | P | M | M | P | M | own | — | open |
| Tibbiy kosmetologiya (`medikal-estetik`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Dermatovenerologiya (`klinik-dermatoloji`) | 46 | Thin | P | S | P | T | P | T | M | T | M | M | P | M | own | — | open |
| Jismoniy reabilitatsiya mutaxassisi (`fizyoterapi`) | 30 | Thin | P | P | M | M | P | T | M | T | M | M | P | M | own | — | open |
| Klinik psixolog (`klinik-psikolog`) | 26 | Thin | P | T | M | M | P | T | M | T | M | M | P | M | own | — | open |

## Gaps ranked by commercial priority

Priority = commercial weight of the role among likely private-market buyers (3 high, 2 medium, 1 low) × (100 − score),
+50% where the role falls back to a mapped or generic template. Top 60 across the six countries:

| # | Country | Role | Score | Weight | Falls back? | Biggest missing items | Status |
|---|---|---|---|---|---|---|---|
| 1 | us | Child and Adolescent Psychiatry | 14 | 3 | yes — mapped to psychiatry | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 2 | us | Licensed Clinical Social Worker | 14 | 3 | yes — mapped to clinical-psychology | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 3 | gb | Child and adolescent psychiatry | 14 | 3 | yes — mapped to psychiatry | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 4 | ca | Psychotherapist / counselling therapist | 19 | 3 | yes — mapped to clinical-psychology | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 5 | nz | Psychotherapist | 19 | 3 | yes — mapped to clinical-psychology | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 6 | nz | Urgent care medicine | 25 | 3 | yes — mapped to emergency-medicine | K3, K4, K7, K10 | open |
| 7 | us | Allergy and Immunology | 14 | 2 | yes — mapped to internal-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 8 | us | Pain Medicine | 14 | 2 | yes — mapped to rehabilitation-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 9 | us | Sleep Medicine | 14 | 2 | yes — mapped to respiratory-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 10 | us | Addiction Medicine | 14 | 2 | yes — mapped to psychiatry | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 11 | gb | Allergy | 14 | 2 | yes — mapped to internal-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 12 | gb | Genito-urinary medicine | 14 | 2 | yes — mapped to infectious-diseases | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 13 | gb | Old age psychiatry | 14 | 2 | yes — mapped to psychiatry | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 14 | gb | Podiatrist | 14 | 2 | yes — mapped to physiotherapy | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 15 | ca | Clinical Immunology and Allergy | 14 | 2 | yes — mapped to internal-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 16 | ca | Hematology | 14 | 2 | yes — mapped to internal-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 17 | nz | Sexual health medicine | 14 | 2 | yes — mapped to family-medicine | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 18 | nz | Family planning and reproductive health | 14 | 2 | yes — mapped to obstetrics-gynaecology | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 19 | nz | Podiatrist | 14 | 2 | yes — mapped to physiotherapy | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 20 | nz | Osteopath | 14 | 2 | yes — mapped to physiotherapy | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 21 | nz | Chiropractor | 14 | 2 | yes — mapped to physiotherapy | K2, K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 22 | uz | Allergologiya va klinik immunologiya | 14 | 2 | yes — mapped to dahiliye | K2, K3, K4, K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 23 | uz | Reproduktologiya | 14 | 2 | yes — mapped to kadin-hastaliklari-dogum | K2, K3, K4, K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 24 | uz | Bolalar nevrologiyasi | 14 | 2 | yes — mapped to noroloji | K2, K3, K4, K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 25 | uz | Narkologiya | 14 | 2 | yes — mapped to psikiyatri | K2, K3, K4, K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 26 | us | Geriatric Medicine | 19 | 2 | yes — mapped to internal-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 27 | us | Colon and Rectal Surgery | 19 | 2 | yes — mapped to general-surgery | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 28 | us | Reproductive Endocrinology and Infertility | 19 | 2 | yes — mapped to obstetrics-gynaecology | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 29 | gb | Geriatric medicine | 19 | 2 | yes — mapped to internal-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 30 | gb | Haematology | 19 | 2 | yes — mapped to internal-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 31 | gb | Community sexual and reproductive health | 19 | 2 | yes — mapped to obstetrics-gynaecology | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 32 | ca | Geriatric Medicine | 19 | 2 | yes — mapped to internal-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 33 | ca | Pain Medicine | 19 | 2 | yes — mapped to rehabilitation-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 34 | ca | Gynecologic Reproductive Endocrinology and Infertility | 19 | 2 | yes — mapped to obstetrics-gynaecology | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests; country practice sources for the live assistant |
| 35 | nz | Pain medicine | 19 | 2 | yes — mapped to rehabilitation-medicine | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 36 | nz | Oral and maxillofacial surgery | 19 | 2 | yes — mapped to plastic-surgery | K3, K4, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 37 | uz | Diyetologiya | 19 | 2 | yes — mapped to diyetisyen | K3, K4, K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 38 | us | Psychiatry | 21 | 3 | no | K2, K3, K4, K7, K9, K10 | open |
| 39 | gb | General psychiatry | 21 | 3 | no | K2, K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 40 | nz | Internal medicine | 21 | 3 | no | K2, K3, K4, K7, K9, K10 | open |
| 41 | nz | Musculoskeletal medicine | 22 | 2 | yes — mapped to rehabilitation-medicine | K3, K7, K9, K10 | wave 1: own note fields + own intake questions + leak tests |
| 42 | uz | Surdologiya | 25 | 2 | yes — mapped to odyoloji | K7, K9, K10 | wave 1: own note fields (uz-Latn/uz-Cyrl/ru); intake still borrowed (ULKE-BRANS-DERINLIK-04) |
| 43 | us | Internal medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 44 | us | Cardiology | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 45 | us | Aesthetic medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 46 | us | Physical therapist | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 47 | us | Clinical psychologist | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 48 | us | Dietitian | 26 | 3 | no | K3, K4, K7, K9, K10 | open |
| 49 | gb | General (internal) medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 50 | gb | Cardiology | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 51 | gb | Aesthetic medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 52 | gb | Physiotherapist | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 53 | gb | Clinical psychologist | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 54 | gb | Dietitian | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 55 | ca | Internal Medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 56 | ca | Cardiology | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 57 | ca | Psychiatry | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 58 | ca | Aesthetic medicine | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 59 | ca | Physiotherapist | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |
| 60 | ca | Psychologist | 26 | 3 | no | K3, K4, K7, K9, K10 | wave 1: country practice sources for the live assistant |

## Sources (code and external)

- Gold standard: `docs/ULKE-BRANS-ALTIN-STANDART.md`. Extraction and scoring scripts: scratchpad `derinlik/cikar.mts`, `skor.py`, `rapor.py`.
- Packs: `countries/<cc>/`, the shared English set `countries/_dil/en/`, the kit `lib/ulke/`. AU references: `countries/au/asistan/kaynaklar.ts`.
- External sources opened this session are listed in the gate table above and in each wave's reference data file.

