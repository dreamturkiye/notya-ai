# Notya AI — agent instructions (Cursor + Claude)

This repo is a **commercial** multi-specialty product (~30 branşlar). Skills and rules under `.cursor/` are the standing source of truth for both Cursor agents and Claude. **Read the relevant skill before starting work on a section** — do not improvise product scope.

## Always-on rules

| Rule | Path |
|------|------|
| Doktor Araçları classify-before-add | `.cursor/rules/specialty-doktor-araclari.mdc` |
| Branş alan sızması (specialty fields must not leak) | `.cursor/rules/brans-alan-sizmasi.mdc` |
| Ülke paritesi (core/shared changes & features applied, country-adapted, across all 6 countries — no exceptions) | `.cursor/rules/ulke-paritesi-duzeltme.mdc` |
| Performans bütçesi (hard ceilings from PERF-SAGLAMLIK-2026-10 — checked per change, not per month) | `.cursor/rules/performans-butcesi-koruma.mdc` |
| **FOUNDER LOCK — Ses omurgası v2** (voice/text assistant path locked 2026-10-29: NO change of any size without Kaan's explicit written "go" for that change — stop and ask; hash manifest `lib/asistan/ses-kilit.json` enforced in build + tests) | `.cursor/rules/ses-omurga-kilidi.mdc` |

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
| Documents in the muayene flow (belgeleri ekle, Belgeler upload, Asistan image evaluation, note insertion) | `.cursor/skills/belge-otomatik-akis/SKILL.md` |
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

## Standing rule — one look in every country (Kaan, 2026-10-23, permanent)

"Our application look and feel and the pages cannot look different for each country. This is not acceptable. They must all look exactly the same." Every country build uses the SAME visual design, layout, components and page structure as Türkiye (main). Only language, voices, personas, reference books, laws/regulatory content, tools that exist by law and country data differ. A country-only visual or layout fork is a defect (share the Türkiye component with injected words/data instead). Full text: `.cursor/rules/gorunum-paritesi-ulke.mdc`.

## Standing rule — Vercel build economy (Kaan, 2026-10-23, permanent)

Every push to a release branch or `main` starts a Vercel build that costs money. Combine fixes into as few pushes as possible (one push per branch per batch), mark docs-only commits `[skip ci]`, never push "check" commits or empty redeploys, and touch a country branch only when the change applies to it.
