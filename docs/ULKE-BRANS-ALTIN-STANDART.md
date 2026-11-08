# Country × specialty gold standard — the Pediatri reference (ULKE-BRANS-DERINLIK-2026-11)

Founder order (Kaan, 2026-11-08): every specialization offered in every country build must reach the Turkish "golden"
Pediatri depth, including roles that exist only in one country, each with that country's own references.

This file defines the bar. It was built by reading the live Pediatri implementation on `main` (60edf1636), not from
memory. The scoring of every role in every country against it is in `docs/ULKE-BRANS-DERINLIK-DENETIMI-2026-11.md`.

## What Pediatri has on main (the evidence)

| Area | Pediatri on main | Code |
|---|---|---|
| Profile | `PEDIATRI_PROFILE`, `olgunluk: 'uzman-dogrulandi'` (built with a practising pediatrician 2026-09-10 → 09-14) | `lib/specialties/pediatri.ts`, `registry.ts` `CHAPTERS` |
| Muayene / SOAP | Ateş-first vitals with baş çevresi gated to children, pediatric prompt notes (no self-computed percentiles, Tanner MPH as estimate, no percentile-based diagnosis), veli wording by age | `olcumler`, `promptNotlari`, `lib/specialties/kapsam.ts`, `hitap.ts` |
| Doktor Araçları | 7 specialty-only tiles: Hedef Boy, Büyüme & Persentil, Doz Hesaplayıcı (mg/kg), Aşı Takvimi & Telafi, Gelişim & Tarama Paneli, M-CHAT-R/F, Pediatri Kohort Paneli | `lib/doktor/doktorAraclari.ts` (`branslar: ['pediatri']`), `specialties/pediatri/ui/araclar/*` |
| Engines | büyüme, doz, aşı planı, gelişim planı, kohort, sağlam çocuk, girdi — each with tests | `specialties/pediatri/engines/*`, `specialties/pediatri/tests/*` |
| Scores and scales | Neyzi 2015 LMS percentiles, M-CHAT-R/F (16–30 months), GİDR developmental screen (1–24 months), Tanner mid-parental height — deterministic, each with its published source | `hesaplayicilar`, `lib/clinical/{buyumeEgrisi,mchatR,gelisimTaramasi,hedefBoy}.ts` |
| References feeding Ayşe | National binding sources (SB aşı takvimi 2025, TPK guidelines, ÇAYD protocols, SB/TTD pediatric protocols, SGK rules) + international depth texts (Nelson, Harriet Lane, Oski/Rudolph) — "national first, international for depth, national wins on conflict" | `lib/asistan/turkishSpecialtyRefs.ts` (`TURKISH_REFS`, `SECONDARY_TEXTBOOKS`), `ekKaynaklar` |
| Intake form | Branch-keyed pediatric question set (16 questions) under the shared core, veli section by age | `lib/intake/bransSorulari.ts` (`pediatri`), `lib/intake/coreAlanlar.ts` |
| Hasta portalı | Büyüme + hedef boy module (Partial, gated) and Aşı Bilgilendirme module with its own route (Strong) | `portal` in the profile, `lib/portal/moduller.ts` |
| Consent | Dijital Aşı Onam Sistemi, Pediatri-only gate | `lib/asi/onam/*` (`asiOnamBransKapisi.ts`) |
| Documents / reports | Baseline documents + aşı karnesi PDF and sharing | `belgeler`, `lib/asi/karnePdf.tsx`, `karnePaylasim.ts` |
| Prescription / order presets | mg/kg dose engine with ceiling warning, aşı lot/stock | `specialties/pediatri/engines/doz.ts`, `lib/asi/stok`, `asiLotYeri.ts` |
| Patient-file views | Büyüme Eğrileri, M-CHAT-R/F, Gelişim Taraması tabs behind the branch gate | `sekmeler`, `lib/doktor/hastaDosyaSekmeleri.ts` |
| Leak tests | Present for pediatri, absent for ≥3 foreign branches (30/30 loop) | `lib/specialties/brans-alan-sizmasi*.test.ts`, `lib/doktor/doktorAraclari.test.ts` |
| Specialist validation | Built and validated with a practising pediatrician; open specialist-review items listed in the profile | `olgunluk`, `specialistReview` |

## The checklist (weights total 100)

| ID | Item | Weight | Strong (1.0) | Partial (0.6) | Thin (0.3) | Missing (0) |
|---|---|---|---|---|---|---|
| K1 | Muayene / SOAP sections and vocabulary | 15 | Role's own note fields + a per-role SOAP lock in the instruction to the model | Role's own note fields | Fields borrowed from a mapped role | General template only |
| K2 | Doktor Araçları — specialty tools and calculators | 15 | ≥6 clinical role-specific tools | 3–5 clinical tools, or 1–2 plus the full per-role structural set | 1–2 tools, or only structural/templated tools | None |
| K3 | Scores and scales (deterministic, sourced) | 10 | ≥4 | 2–3 | 1 | 0 |
| K4 | National references and books feeding Ayşe | 12 | Country authorities + books, national first | Country authorities only | Only tool citations | Nothing |
| K5 | Intake-form questions | 8 | Specialist-validated branch-depth set | Role's own set (≥6 questions) | Borrowed/relabelled set, or <6 own | None |
| K6 | Hasta portalı module | 10 | Own gated module + demo fixture | Per-role chapter or bolt-on | Shared shell only | Nothing |
| K7 | Specialty consent form | 6 | Own consent system, branch-gated | A role-specific consent record/tool | — | None |
| K8 | Report and document types | 6 | Specialty documents with print and share | Role-specific printed records | Generic visit note / patient summary only | None |
| K9 | Prescription and order presets | 5 | Specialty dose engine + presets | Specialty presets | One related tool (dose, regimen, duration) | None |
| K10 | Patient-file specialty views | 5 | Own gated tabs | One specialty view | Generic follow-up view | None |
| K11 | Leak gate and tests both directions | 4 | Role-specific leak test (present for owner, absent for others) | Kit-level gate and pack leak scan only | — | None |
| K12 | Specialist validation | 4 | Signed off by a practising clinician of that specialty in that country | Partial review | — | None |

Overall pill per role: **Strong ≥85**, **Partial 55–84**, **Thin 20–54**, **Missing <20** (no own content: falls back to a mapped
role or the general template). Pediatri on main scores 100 by construction (the bar).

## Rules that bind the work, not just the score

- Country content is re-sourced per country, never translated from Türkiye (`ulke-paritesi-duzeltme`,
  `cross-specialty-parity` "Six-country propagation" §3). Every reference is verified on the web before it ships; an
  unverified title is left out and listed as unverified.
- A role a country's regulator does not recognise is not offered there (regulatory recognition gate). The gate is
  re-checked per country in the audit; a failing role is flagged, never built.
- Specialty content stays gated to its role, with leak tests; the shared spine stays shared (`brans-alan-sizmasi`).
- One look in every country: shared Türkiye components with injected words and data, no country-only visual fork
  (`gorunum-paritesi-ulke`).
- Clinical content is conservative and guideline-sourced; no diagnosis or treatment automation beyond what Pediatri
  already does; the clinician approves everything. The country kit's note fields hold only what was said at the
  visit — no reference values, schedules, scores or doses (countries/_dil/en/klinik/notSablonlari.ts header).
- AU: assistant code and prompts never change; references, templates, tools and data only.
- FOUNDER LOCK: `lib/asistan/ses-kilit.json` and every file it hashes are untouched.
- K12 cannot be closed by Claude: every new clinical text in every language needs review by a practising clinician of
  that specialty in that country before it is marketed there (OPEN-COMMITMENTS `ULKE-BRANS-KLINISYEN-01`).
