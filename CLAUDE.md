# Notya AI — agent instructions (Cursor + Claude)

This repo is a **commercial** multi-specialty product (~30 branşlar). Skills and rules under `.cursor/` are the standing source of truth for both Cursor agents and Claude. **Read the relevant skill before starting work on a section** — do not improvise product scope.

## Always-on rules

| Rule | Path |
|------|------|
| Doktor Araçları classify-before-add | `.cursor/rules/specialty-doktor-araclari.mdc` |

## Skills (open before the matching work)

| When | Skill |
|------|--------|
| Any Doktor Araçları / `/doktor-tools` / new tool tile | `.cursor/skills/specialty-doktor-araclari/SKILL.md` |
| Shared spine fix vs one branş | `.cursor/skills/cross-specialty-parity/SKILL.md` |
| Universal chrome vs chapter content | `.cursor/skills/specialty-universal-vs-chapter/SKILL.md` |
| Sağlığım / hasta portalı | `.cursor/skills/specialty-hasta-portali/SKILL.md` |
| Specialty audit HTML / depth pills | `.cursor/skills/specialty-audit-report/SKILL.md` |
| Any API route/helper taking a patient, note, session or other patient-derived id | `.cursor/skills/hasta-izolasyon/SKILL.md` |

## Doktor Araçları (short)

Most tools built during pediatri sprints are **base** and must remain identical for every specialty. Before adding anything to Araçlar, classify **and** name which specialties see it:

1. **Base** — same for all branşlar → `ORTAK_DOKTOR_ARACLARI`
2. **Specialty-only** → `BRANS_DOKTOR_ARACLARI` + gate (e.g. Hedef Boy = pediatri only — never kardiyoloji)
3. **New universal** → `ORTAK_DOKTOR_ARACLARI`

Commercial UI only — no internal audits or named beta-doctor copy on `/doktor-tools`. Full text: the skill above.
