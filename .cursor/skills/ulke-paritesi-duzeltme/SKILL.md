---
name: ulke-paritesi-duzeltme
description: >-
  Standing rule for every change to the Turkish doctor product in Notya: the
  same change is applied to all six countries (US, GB, CA, AU, NZ, UZ) in the
  same change, in that country's language and under that country's own laws,
  government, and medical institutions. No deferred country and no Turkey-only
  close. Use before closing any such change, and when writing its commit/PR
  report (one status line per country).
---

# Ülke paritesi (Türkiye'de düzelttim ≠ altı ülkede düzeldi)

Boss rule (Kaan, 2026-10-16, tightened 2026-10-18): a change made in Türkiye is not
done until **the same change has been applied in all six countries in the same change**.
Sibling of `cross-specialty-parity` (a core doctor change is 1:1 across every branş and
the 10 Özel Branşlar) — this one is the country axis. Verify against
`.cursor/skills/international-data-model-dogrulama/SKILL.md` for anything touching reports,
identity or legal fields.

## Trigger

Any change to shared code or Turkey-facing UI / API / logic: `components/`, `core/`,
`lib/`, `app/`. Features, revisions, and bug fixes all follow this. Run it before closing
the change. There is no track where a Turkey change waits for a later country pass.

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
- [ ] The change is in that country's build in this same change. Status is SHARED CODE
      (ported) or FORKED COPY (its own file now has the equivalent). "Later" is not a status.
- [ ] Strings: every user-visible string comes from that country's language. Never hardcoded
      Turkish in a country build. Turkish copy on main stays Turkish.
- [ ] Law and institutions: wording, identifiers, and workflows follow THAT country's
      government, regulator, and medical institutions. Never reuse SGK, Medula, e-Nabız,
      KVKK, NVI, GİB, or Turkish field keys as a placeholder
      (see international-data-model-dogrulama).
- [ ] Tests: the shared logic is tested with that country's keys and copy.
```

A country line that says "follow-up", "exempt", or "see OPEN-COMMITMENTS" means the change
is not finished. Do not report it as done.

## Report rule

The commit/PR report **must include one status line per country**, e.g.
`us: ported, English, own payer rail · gb: forked-and-fixed, NHS wording · ca: ported · au: ported · nz: ported · uz: ported, own MOH source`.
A report that leaves any country as follow-up, exempt, or n/a is incomplete. The change is not done.

## Turkish institutions are not copied — the country's own are required

MBYS, SGK / SUT / Medula, e-Nabız, e-Reçete, NVI, e-Fatura / GİB, and KVKK text stay in
Türkiye. They are not an excuse to skip a country. In the same change, each country gets
the equivalent step under its own authority (its health-record system, its payer, its
prescribing rail, its identity check, its invoice regime, its privacy law), written in
its language and sourced from that authority. If the Turkish change was the mechanism
around one of those rails, the country pack gets that mechanism on its rail, not a stub
of the Turkish rail and not a blank "exempt".

## Standing rule: Turkish untouched

The Turkish version stays exactly as it is unless the fix is genuinely shared code. Country
versions get their own localized copy — **never Turkish strings in a country build**, never a
translated Turkish field set. When making a shared component localizable, Turkish remains
the default value and Turkish behavior must not change (test it).

## Related

- `.cursor/skills/cross-specialty-parity/SKILL.md` — same discipline across branşlar.
- `.cursor/skills/international-data-model-dogrulama/SKILL.md` — country data models.
- `docs/OPEN-COMMITMENTS.md` — not a place to park a country that this rule required in the same change.
