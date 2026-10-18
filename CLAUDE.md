# Notya AI — agent instructions (Cursor + Claude)

This repo is a **commercial** multi-specialty product: **30 medical branches** (`lib/doktor/specialties.ts`) plus **10 Özel Branşlar** (`lib/specialties/klinikDikey.ts`). Skills and rules under `.cursor/` are the standing source of truth for both Cursor agents and Claude. **Read the relevant skill before starting work on a section** — do not improvise product scope.

## Always-on rules

| Rule | Path |
|------|------|
| Ortak omurga (30 branş + 10 Özel Branşlar, tek hekim uygulaması) | `.cursor/rules/ortak-omurga-paritesi.mdc` |
| Doktor Araçları classify-before-add | `.cursor/rules/specialty-doktor-araclari.mdc` |
| Branş alan sızması (specialty fields must not leak) | `.cursor/rules/brans-alan-sizmasi.mdc` |
| Ülke paritesi (any Turkey change applied to us/gb/ca/au/nz/uz in the same change, each under its own law and language) | `.cursor/rules/ulke-paritesi-duzeltme.mdc` |
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
| Any Turkey change — before closing it (six countries in the same change, one status line each) | `.cursor/skills/ulke-paritesi-duzeltme/SKILL.md` |
| Patient-file page, a portal/API hot path, task-sync, a hot-table query, or any new external call | `.cursor/skills/performans-butcesi-koruma/SKILL.md` |

## Ortak omurga (short)

A core change to the doctor application — muayene, reçete, randevu, hasta kaydı, MBYS, hasta portalı shell, faturalama / tahsilat, a general aşı onam, any shared workflow or data model — lands **1:1** for all 30 medical branches and all 10 Özel Branşlar in the same change. The doctor application stays one product. Specialty screens stay in their branch. That same change then lands in us, gb, ca, au, nz, and uz in the same change, each in that country’s language and under that country’s own government and medical institutions. No country is left for later. Full text: `.cursor/rules/ortak-omurga-paritesi.mdc` and `.cursor/rules/ulke-paritesi-duzeltme.mdc`.

## Branş alan sızması (short)

Something specific to **one** specialty must never render for another (Baş Çevresi / “veli” on KD = leak). Exception by law: “veli” wording follows the patient's **age** — every patient under 18 gets it in every branş (`veliDiliMi`); an adult never does. Gate chapter content; leave only truly universal fields in the shared spine. Full text: `.cursor/skills/brans-alan-sizmasi/SKILL.md`.

## Doktor Araçları (short)

Most tools built during pediatri sprints are **base** and must remain identical for every specialty. Before adding anything to Araçlar, classify **and** name which specialties see it:

1. **Base** — same for all branşlar → `ORTAK_DOKTOR_ARACLARI`
2. **Specialty-only** → `BRANS_DOKTOR_ARACLARI` + gate (e.g. Hedef Boy = pediatri only — never kardiyoloji)
3. **New universal** → `ORTAK_DOKTOR_ARACLARI`

Commercial UI only — no internal audits or named beta-doctor copy on `/doktor-tools`. Full text: the skill above.
