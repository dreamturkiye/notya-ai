---
name: ulke-paritesi-duzeltme
description: >-
  Standing rule, hardened 2026-10-18, for every core/shared change, revision, or
  new feature to shared or Turkey UI/API/logic in Notya that is not Turkey-only
  by law: it must be APPLIED — built and shipped, country-adapted — in all six
  country versions (US, GB, CA, AU, NZ, UZ) in the same change set wherever
  feasible, with localized strings and each country's own data model. Checking
  and logging a gap is no longer sufficient on its own. Operates together with
  cross-specialty-parity's 40-branch rule as a two-axis propagation requirement.
  Use before closing ANY in-scope change, and when writing its commit/PR report
  (the report must carry a per-country status line: APPLIED / N/A / EXEMPT /
  OPEN GAP). Answers "which of the six countries run this, and does each one
  actually ship the country-adapted equivalent?"
---

# Ülke paritesi (Türkiye'de yaptım ≠ altı ülkede uygulandı)

Boss rule (Kaan, 2026-10-16, after the Selin "İlaç ekle" batch-card fix; **hardened
2026-10-18**, verbatim): "Also is the same rule for all the 6 countries going forward. Any
change in turkiye must be applied to all 6 country from now on based on that specific
countries, language, rules, regulations, government and medical institutions directives
and rules. no exceptions here any longer as well."

**What changed 2026-10-18.** Two things hardened at once, matching the same-day
`cross-specialty-parity` 40-branch hardening so both rules sit at the same bar:

- **Scope**: widened from "bug fix or UX fix" to **any core/shared change, revision, or
  new feature that is not Turkey-only by law**. The exemption list (Turkey-only
  regulatory mechanics: SGK/Medula/e-Nabız/e-Reçete/e-Fatura/KVKK-specific mechanics) is
  **unchanged** — only what counts as in-scope for everything that is *not* exempt has
  grown.
- **Strength**: widened from "checked" to **"applied, no exceptions."** Checking the six
  countries and recording a gap used to close the loop; it no longer does for in-scope
  work. The country-adapted equivalent must actually be **built and shipped** — adapted to
  that country's own language, laws/regulations, and government/medical-institution
  directives, cross-referenced against
  `.cursor/skills/international-data-model-dogrulama/SKILL.md` for how identity/report
  fields adapt — never a translated copy of the Turkish content. This is the same standard
  already proven today on the AU Tier-1 clinical-tools work: a mechanical port of
  non-Turkey-specific content travels directly; content with Turkey-specific
  regulatory/legal substance needs real per-country research, never a translated copy.

Sibling of `cross-specialty-parity` (fix reaches every branş) — this one is the country
axis, and the two now **operate together, not as alternatives**: a core/shared Türkiye
change must reach **both** (a) all 30 medical branches + 10 Özel Branşlar (40 total, per
`cross-specialty-parity`) **and** (b) all six countries, country-adapted (per this rule) —
in the same change set wherever feasible. When the two-axis work cannot land in one change
set, it is logged as an explicit, dated follow-up in `docs/OPEN-COMMITMENTS.md` with a
named owner (Kaan vs Claude) — never a silent deferral.

## Trigger

Any core/shared change, revision, or new feature to shared code or Turkey-facing UI / API
/ logic that is not Turkey-only by law: `components/`, `core/`, `lib/`, `app/`. Run it
before closing the change. **A change never gets to skip this check** unless it is
genuinely scoped entirely to Turkey-only regulatory mechanics (see Exempt, below) —
checking-and-flagging is no longer an acceptable substitute for applying it.

## The six countries (real identifiers, confirmed from the repo)

| Country | `NOTYA_COUNTRY` | Build branch | Pack |
|---------|-----------------|--------------|------|
| United States | `us` | `release/us` | `countries/us` |
| United Kingdom | `gb` | `release/gb` | `countries/gb` |
| Canada | `ca` | `release/ca` | `countries/ca` |
| Australia | `au` | `release/au` | `countries/au` |
| New Zealand | `nz` | `release/nz` | `countries/nz` |
| Uzbekistan | `uz` | `release/uz` | `countries/uz` |

Azerbaijan is **not** one of the six (settled in `ACCOUNTING-INTL-01`). Re-confirm with
`git ls-remote --heads origin 'release/*'` — do not trust this table over the repo.

How the versions are built: `main` has no `countries/` directory. Country builds are the
`release/<cc>` branches (`NOTYA_COUNTRY` selects the pack at build time via
`countries/active/*`), fed by cherry-picks from `main` (`cherry/<cc>-*`, `ulke-uygula/<cc>`).
Most core files (e.g. `components/core/EylemKarti.tsx`, `core/eylemler/*`) are
**byte-identical copies** of `main`'s, so a fix on `main` does NOT reach a country until it
is ported to that branch.

## Mandatory checklist (per country, all six) — APPLY, not just check

Check what a country actually runs with read-only `git show origin/release/<cc>:<path>` or
`git grep -n <symbol> origin/release/<cc> -- <dir>`; never check a release branch out into a
shared worktree.

```
For each of us, gb, ca, au, nz, uz:
- [ ] Status: SHARED CODE (same file runs, fix applies once ported) | FORKED COPY (its own
      equivalent has the same defect → fix it there) | NOT APPLICABLE (feature absent) | EXEMPT (Turkey-only)
- [ ] Applied, not just checked: for SHARED CODE / FORKED COPY, the country-adapted
      equivalent is actually built and shipped (ported/forked-and-fixed) in this change set
      — "confirmed it would need porting" is a finding, not a close.
- [ ] Strings: every user-visible string the fix adds or touches comes from a localized source
      (country pack / injected copy object), never hardcoded Turkish. Turkish copy stays Turkish.
- [ ] Data model: required fields, identifiers, formats use THAT country's model (drug/dose/
      frequency keys, doctor ID, patient ID, dates/numbers). Never reuse Turkish keys, validators
      or formats as a placeholder (see international-data-model-dogrulama).
- [ ] Country-specific substance (not a mechanical port): where the content carries
      Turkey-specific regulatory/legal substance, it was actually researched for that
      country's own language, laws/regulations and government/medical-institution
      directives — never a translated copy of the Turkish version.
- [ ] Tests: the shared/pure logic is tested with non-Turkish keys and non-Turkish copy.
- [ ] Landing: the fix is in the same change set — or the gap is written into
      docs/OPEN-COMMITMENTS.md with a date and a named owner (Kaan vs Claude). "Later"
      without a dated, owned entry is forbidden.
```

If a change cannot land in a country build in the same change set (separate branch), say
so explicitly and log it with a date and owner; do not report it as "done for all
countries" until the country-adapted equivalent is actually built and shipped there.

## Report rule

The commit/PR report **must include one status line per country**, each stating one of
**APPLIED** (built + shipped, country-adapted) / **N/A** (feature absent) / **EXEMPT**
(Turkey-only) / **OPEN GAP** (logged in `docs/OPEN-COMMITMENTS.md`, date + owner), e.g.
`us: APPLIED (ported via cherry-pick, strings via pack) · gb: APPLIED (forked-and-fixed) · ca: N/A (feature absent) · au: … · nz: … · uz: OPEN GAP (2026-10-18, owner: Claude)`.
A status of "checked" alone, with no APPLIED/N/A/EXEMPT/OPEN GAP resolution, is incomplete
— and a report without this line at all is incomplete.

## Exempt (Turkey-only regulatory features)

State "exempt" explicitly on the country lines; do not port or stub these:
MBYS / Muayeneyi Bildir, SGK / SUT / Medula (`lib/medula`, `lib/sgk`), e-Nabız (`lib/enabiz`),
e-Reçete, NVI / T.C. Kimlik doğrulama (`lib/nvi`), e-Fatura / e-Arşiv / GİB Portal
(`lib/accounting/ebelge`), KVKK-specific copy, Türkiye mevzuat takibi. Country equivalents
(AIR, NHS number, NPI, etc.) are separate features governed by their own research docs.

## Standing rule: Turkish untouched

The Turkish version stays exactly as it is unless the fix is genuinely shared code. Country
versions get their own localized copy — **never Turkish strings in a country build**, never a
translated Turkish field set. When making a shared component localizable, Turkish remains
the default value and Turkish behavior must not change (test it).

## Related

- `.cursor/skills/cross-specialty-parity/SKILL.md` — same discipline across branşlar.
- `.cursor/skills/international-data-model-dogrulama/SKILL.md` — country data models.
- `docs/OPEN-COMMITMENTS.md` — where unported items are recorded.
