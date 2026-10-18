# Notya AI — agent instructions (Cursor + Claude)

This repo is a **commercial** multi-specialty product (~30 branşlar). Skills and rules under `.cursor/` are the standing source of truth for both Cursor agents and Claude. **Read the relevant skill before starting work on a section** — do not improvise product scope.

## Always-on rules

| Rule | Path |
|------|------|
| Doktor Araçları classify-before-add | `.cursor/rules/specialty-doktor-araclari.mdc` |
| Branş alan sızması (specialty fields must not leak) | `.cursor/rules/brans-alan-sizmasi.mdc` |
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

## Ülke paritesi — six countries, applied, no exceptions (short)

Hardened 2026-10-18 (Kaan, verbatim intent): any core/shared change, revision, or new
feature that is not Turkey-only by law must be **applied** — built and shipped,
country-adapted — across **all six country versions (us, gb, ca, au, nz, uz)**, in the
same change set wherever feasible. Checking and logging a gap is no longer sufficient on
its own. This operates together with the `cross-specialty-parity` 40-branch rule as a
**two-axis propagation requirement**: a core/shared Türkiye change must reach all 40
branches AND all 6 countries, country-adapted — not either one alone. Exempt (unchanged):
Turkey-only regulatory mechanics — MBYS, SGK/SUT/Medula, e-Nabız, e-Reçete, NVI, e-Fatura/
GİB, KVKK-specific mechanics. When the two-axis work can't land in one change set, it is
logged as a dated, owned entry in `docs/OPEN-COMMITMENTS.md` — never a silent deferral.
Full text: `.cursor/skills/ulke-paritesi-duzeltme/SKILL.md`.

## Doktor Araçları (short)

Most tools built during pediatri sprints are **base** and must remain identical for every specialty. Before adding anything to Araçlar, classify **and** name which specialties see it:

1. **Base** — same for all branşlar → `ORTAK_DOKTOR_ARACLARI`
2. **Specialty-only** → `BRANS_DOKTOR_ARACLARI` + gate (e.g. Hedef Boy = pediatri only — never kardiyoloji)
3. **New universal** → `ORTAK_DOKTOR_ARACLARI`

Commercial UI only — no internal audits or named beta-doctor copy on `/doktor-tools`. Full text: the skill above.
