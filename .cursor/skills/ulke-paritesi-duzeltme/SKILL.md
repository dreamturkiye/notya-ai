---
name: ulke-paritesi-duzeltme
description: >-
  Standing rule for every bug fix or UX fix to shared or Turkey UI/API/logic in
  Notya: a fix found and made in the Turkish product must be checked and, where
  it applies, landed in all six country versions (US, GB, CA, AU, NZ, UZ) in the
  same change set, with localized strings and each country's own data model.
  Use before closing ANY bug fix or UX fix, and when writing its commit/PR
  report (the report must carry a per-country status line). Answers "which of the
  six countries run this code, and does each one actually get the fix?"
---

# Ülke paritesi (Türkiye'de düzelttim ≠ altı ülkede düzeldi)

Boss rule (Kaan, 2026-10-16, after the Selin "İlaç ekle" batch-card fix): when we find
and fix a bug, **the same fix must be checked and applied across the six other country
versions in the same change set.** Sibling of `cross-specialty-parity` (fix reaches every
branş) — this one is the country axis. Verify against
`.cursor/skills/international-data-model-dogrulama/SKILL.md` for anything touching reports,
identity or legal fields.

## Trigger

Any bug fix or UX fix to shared code or Turkey-facing UI / API / logic: `components/`,
`core/`, `lib/`, `app/`. Run it before closing the fix. Feature work follows the country
packs' own tracks; **bug and UX fixes never get to skip this check.**

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

## Mandatory checklist (per country, all six)

Check what a country actually runs with read-only `git show origin/release/<cc>:<path>` or
`git grep -n <symbol> origin/release/<cc> -- <dir>`; never check a release branch out into a
shared worktree.

```
For each of us, gb, ca, au, nz, uz:
- [ ] Status: SHARED CODE (same file runs, fix applies once ported) | FORKED COPY (its own
      equivalent has the same defect → fix it there) | NOT APPLICABLE (feature absent) | EXEMPT (Turkey-only)
- [ ] Strings: every user-visible string the fix adds or touches comes from a localized source
      (country pack / injected copy object), never hardcoded Turkish. Turkish copy stays Turkish.
- [ ] Data model: required fields, identifiers, formats use THAT country's model (drug/dose/
      frequency keys, doctor ID, patient ID, dates/numbers). Never reuse Turkish keys, validators
      or formats as a placeholder (see international-data-model-dogrulama).
- [ ] Tests: the shared/pure logic is tested with non-Turkish keys and non-Turkish copy.
- [ ] Landing: the fix is in the same change set — or the gap is written into
      docs/OPEN-COMMITMENTS.md (date, waits on Kaan vs Claude). "Later" without an entry is forbidden.
```

If a fix cannot land in a country build in the same change set (separate branch), say so
explicitly and log it; do not report the fix as "done for all countries".

## Report rule

The commit/PR report **must include one status line per country**, e.g.
`us: shared (ported via cherry-pick, strings via pack) · gb: forked-and-fixed · ca: n/a (feature absent) · au: … · nz: … · uz: …`.
A report without it is incomplete.

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
