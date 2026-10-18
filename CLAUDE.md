# Notya AI — agent instructions (Cursor + Claude)

This repo is a **commercial** multi-specialty product (~30 branşlar). Skills and rules under `.cursor/` are the standing source of truth for both Cursor agents and Claude. **Read the relevant skill before starting work on a section** — do not improvise product scope.

## Always-on rules

| Rule | Path |
|------|------|
| Doktor Araçları classify-before-add | `.cursor/rules/specialty-doktor-araclari.mdc` |
| Branş alan sızması (specialty fields must not leak) | `.cursor/rules/brans-alan-sizmasi.mdc` |
| Cross-specialty parity (core changes reach all 30 + 10 Özel Branşlar = 40, no exceptions) | `.cursor/rules/cross-specialty-parity.mdc` |
| Ülke paritesi (core/shared changes & features applied, country-adapted, across all 6 countries — no exceptions) | `.cursor/rules/ulke-paritesi-duzeltme.mdc` |
| Performans bütçesi (hard ceilings from PERF-SAGLAMLIK-2026-10 — checked per change, not per month) | `.cursor/rules/performans-butcesi-koruma.mdc` |

## Skills (open before the matching work)

| When | Skill |
|------|--------|
| Any Doktor Araçları / `/doktor-tools` / new tool tile | `.cursor/skills/specialty-doktor-araclari/SKILL.md` |
| Shared spine fix vs one branş | `.cursor/skills/cross-specialty-parity/SKILL.md` |
| Specialty field/vocab/section must not leak to other branşlar | `.cursor/skills/brans-alan-sizmasi/SKILL.md` |
| Universal chrome vs chapter content | `.cursor/skills/specialty-universal-vs-chapter/SKILL.md` |
| Sağlığım / hasta portalı | `.cursor/skills/specialty-hasta-portali/SKILL.md` |
| Specialty audit HTML / depth pills | `.cursor/skills/specialty-audit-report/SKILL.md` |
| Any API route/helper taking a patient, note, session or other patient-derived id | `.cursor/skills/hasta-izolasyon/SKILL.md` |
| Any Anthropic/Claude call (new route, new chapter, prompt change) | `.cursor/skills/ai-model-politikasi/SKILL.md` |
| Any report/form/identity field for a non-Turkey country module | `.cursor/skills/international-data-model-dogrulama/SKILL.md` |
| Any core/shared change, revision, or new feature not Turkey-only by law — before closing it (six-country application, country-adapted, + per-country status line) | `.cursor/skills/ulke-paritesi-duzeltme/SKILL.md` |
| Patient-file page, a portal/API hot path, task-sync, a hot-table query, or any new external call | `.cursor/skills/performans-butcesi-koruma/SKILL.md` |

## Branş alan sızması (short)

Something specific to **one** specialty must never render for another (Baş Çevresi / “veli” on KD = leak). Exception by law: “veli” wording follows the patient's **age** — every patient under 18 gets it in every branş (`veliDiliMi`); an adult never does. Gate chapter content; leave only truly universal fields in the shared spine. Full text: `.cursor/skills/brans-alan-sizmasi/SKILL.md`.

## Cross-specialty parity — 40 branches, no exceptions (short)

Any core update/feature that is not specialty-specific (Muayene ekranı, Reçete, Randevu,
Hasta kaydı, MBYS packages, Hasta portalı, Faturalama/tahsilat, shared consent flows, any
shared data model or workflow) must reach **all 30 medical branches and the 10 Özel
Branşlar at the same time — no exceptions**. The 10 Özel Branşlar (saç ekimi, estetik &
plastik cerrahi, medikal estetik, dermatoloji klinik, longevity, fizyoterapi, klinik
psikoloji, diyetisyen, ergoterapi, odyoloji) are collectively **"Özel Branşlar"**; the
multi-doctor umbrella product is **"Notya Klinik"** (not bare "Klinik"). One product, one
codebase — never a forked doctor experience. State up front, for every change, whether it
is core (must propagate to all 40) or specialty-specific (stays local). Full text:
`.cursor/skills/cross-specialty-parity/SKILL.md` (see "40-branş propagation" section).

## Ülke paritesi — six countries, applied, no exceptions (short)

Hardened 2026-10-18 (Kaan, verbatim intent): any core/shared change, revision, or new
feature that is not Turkey-only by law must be **applied** — built and shipped,
country-adapted — across **all six country versions (us, gb, ca, au, nz, uz)**, in the
same change set wherever feasible. Checking and logging a gap is no longer sufficient on
its own. This operates together with cross-specialty-parity's 40-branch rule above as a
**two-axis propagation requirement**: a core/shared Türkiye change must reach all 40
branches AND all 6 countries, country-adapted — not either one alone. Exempt (unchanged):
Turkey-only regulatory mechanics — MBYS, SGK/SUT/Medula, e-Nabız, e-Reçete, NVI, e-Fatura/
GİB, KVKK-specific mechanics. When the two-axis work can't land in one change set, it is
logged as a dated, owned entry in `docs/OPEN-COMMITMENTS.md` — never a silent deferral.
The same bar applies to a **branş-specific** Türkiye change too (that branş's own
implementation in each country, once that country has the branş built at some depth —
latent until then, not skipped). Full text: `.cursor/skills/ulke-paritesi-duzeltme/SKILL.md`.

## Doktor Araçları (short)

Most tools built during pediatri sprints are **base** and must remain identical for every specialty. Before adding anything to Araçlar, classify **and** name which specialties see it:

1. **Base** — same for all branşlar → `ORTAK_DOKTOR_ARACLARI`
2. **Specialty-only** → `BRANS_DOKTOR_ARACLARI` + gate (e.g. Hedef Boy = pediatri only — never kardiyoloji)
3. **New universal** → `ORTAK_DOKTOR_ARACLARI`

Commercial UI only — no internal audits or named beta-doctor copy on `/doktor-tools`. Full text: the skill above.
