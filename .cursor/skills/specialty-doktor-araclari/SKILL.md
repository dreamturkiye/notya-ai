---
name: specialty-doktor-araclari
description: >-
  Standing rule for Doktor Araçları and for classifying any tool work in Notya:
  most tools built via pediatrics are base/shared across all ~30 specialties;
  every new araç must be classified before add as base (same for every branş),
  specialty-only, or a new universal tool — and, since Notya serves more than one
  country, in which countries it is valid. Use BEFORE starting work on Araçlar,
  /doktor-tools, chapter tools, or any specialty section that might add a tool —
  commercial product, no internal audits or named beta-doctor copy.
---

# Doktor Araçları — classify before you add (commercial, all branşlar)

Boss rules (verbatim intent):

> Doktor araclari specific specialty icin olmali.
> Goz hastaliklari araclarinda dahiliye olmamali
> KD'de goz hastaliklari araclari olmamli

> Bu application Dr. Gokhan'in ozel applikasyonu degil. Commercial application.

> Su ana kadar araclar pediatri uzerinden yapildi ama cogu arac zaten her specialty
> icin base ve ayni. Mesela ilac etkilesimi, epikriz uretimi vs Boyle araclar 30
> specialtidede degismiyorlar ve ayni kalmalilar.

> Bundan sonra araclar bolumune yaptigimiz her ek ya base ek olup multi specialtide
> kullanilicak, veya sadece bir specialtide kullanilicak veya hepsinde kullanilicak
> yeni bir arac olucak.

> Bundan boyle her araci boyle degerlendirmemiz ve ona gore eklememiz lazim.

> Ve mesela bu cocuk veya hicbir specialty'de gosterilmemeli. Such as Kardiolojide
> bunu bir arac olarak gostermek makes no sense. So boyle araclari yaparken hangi
> specialtyde gosterilmesi her zaman analiz edilmeli.

## Gate (before any Araçlar / tool change)

**Stop. Classify the araç. Name which specialties see it. Name which countries it is valid in. Then implement.**

Two questions, both answered before a tile exists:

1. **Core or which specialty?** — the bucket and the **visibility set**: either “all ~30” or a listed `SpecialtyKey[]`. “Built during pediatri sprint” is not a visibility answer.
2. **Which countries?** — the **country set**: an explicit list of country codes in the tool's required `ulkeler` field. There is no “all countries”. “It is a universal calculator” is not a country answer either: a tool enters a country only after that country's audit verdict and its clinical sign-off (below).

| Bucket | Meaning | Catalog | Who sees it |
|--------|---------|---------|-------------|
| **Base (shared spine)** | Same tool for every specialty — does not change by branş. Built historically via pediatri, but product is universal. Examples: ilaç etkileşimi, epikriz, e-reçete, ICD-10, tetkik, hasta portalı link, SGK Medula, e-Nabız, hasta raporları. | `ORTAK_DOKTOR_ARACLARI` (`branslar: null`) | All ~30 specialties |
| **Specialty-only** | Clinical tool for **named** branş(lar) only. Ask: *does this make sense in kardiyoloji / göz / KD / …?* If no → keep it out. Examples: Pediatri Hedef Boy (anne-baba → çocuk boyu — **never** kardiyoloji); Dahiliye Kohort. | `BRANS_DOKTOR_ARACLARI` + `branslar: […]` | Only those branşlar |
| **New universal** | A brand-new tool that every specialty will use the same way. | Add to `ORTAK_DOKTOR_ARACLARI` | All ~30 specialties |

**Visibility analysis (required for specialty-only and for anything child-/chapter-clinical):**

1. What clinical question does this tool answer?
2. Which branş(lar) ask that question every day?
3. Name ≥2 branşlar that must **not** see it (e.g. Hedef Boy → not kardiyoloji, not göz, not KD).
4. Encode that in `branslar` + deep-link guard + a test that foreign branş lists omit the route.

If unsure: default to **base** when the workflow is branş-agnostik (reçete, epikriz, etkileşim, kodlama). Do **not** fork a base tool into `specialties/<slug>/` just because the bug was reported from pediatri. Do **not** put a child/pediatri calculator on every specialty “just in case”.

## Which countries? (NOTYA-ULKE-01, Kaan 2026-10-08)

Notya runs one deployment per country from one repository (`docs/COUNTRY-PACK-CHECKLIST.md`, section F). A tool built for Türkiye must never appear in Uzbekistan by default, and an Uzbek tool must never appear in Türkiye.

| Verdict for a country | Meaning | What you do |
|---|---|---|
| **Remove** | Tied to another country's state or payer system (SGK, Medula, e-Nabız, SUT, MBYS …) | Leave the country out of `ulkeler`. Nothing else. |
| **Adapt** | Same purpose, local content needed (vaccination calendar, coding, drug names, document formats, region-calibrated risk scores) | Build the local content in that country's pack first; add the country only when it is ready and signed off. |
| **Keep** | Universal scale or calculator | Translate it and check units; then add the country. |
| **Add** | The country needs a tool others do not | New registry entry whose `ulkeler` names only that country. |

Two locks, one per side of the wall — a tool shows in a country only when **both** agree:

1. the tool names the country: `ulkeler: ['tr', …]` in `lib/doktor/doktorAraclari.ts` (required field);
2. the country's pack lists the route: `countries/<kod>/araclar.ts` (Türkiye) or the `araclar` list in `countries/<kod>/index.ts`.

Rules:

- A new tool starts **off everywhere except the country it was built for**. Never copy the list of countries from the tile above.
- A specialty's tools are switched on in a country with that specialty's local sign-off (checklist F7), not before.
- The deep-link guard already asks the country: `doktorAraciBransaUygun` returns false for a tool that is not valid here. A **shared** tool page that is valid in only some countries must call `doktorAracYoluUlkedeAcik` itself.
- Changing Türkiye's tools on purpose (new tile, new copy) → regenerate the snapshot in the same commit: `npm run ulke:arac-anlik`. `lib/doktor/doktorAraclariUlke.test.ts` otherwise fails — that is what stops another country's work from changing Türkiye by accident.
- Uzbekistan's proposed verdict for every existing tool: `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md` (proposal until a local clinical lead confirms).

## One-line product rule

**Shared clinical tools → every branş, identical. Chapter clinical tools → that doctor's specialty only. Internal engineering artifacts → never on /doktor-tools.**

## Commercial surface (non-negotiable)

`/doktor-tools` is what paying doctors see — not one clinic’s private toolbox, not an engineering dashboard.

**Never** on the Araçlar grid / landing:

- Full interactive studios embedded on the landing (e.g. Hedef Boy anne-baba UI) — open via a card → `/doktor-tools/hedef-boy`
- Sprint / wow / pre-sprint / post-sprint / gaps audit HTML
- Internal ticket ids in titles or descriptions (`JINE-04`, `DAH-WOW`, …)
- Named people in doctor-facing copy (`Gökhan …`)
- Repo-only docs / static audit HTML for the team

Keep those under `docs/` or repo paths; do not link them from Doktor Araçları.

## Catalog (source of truth)

| File | Role |
|------|------|
| `lib/doktor/doktorAraclari.ts` | `ORTAK_…` + `BRANS_…` (incl. Hedef Boy → `/doktor-tools/hedef-boy`) + `doktorAraclariListesi()`; every entry carries `branslar` **and** `ulkeler` |
| `lib/doktor/doktorAraclari.test.ts` | Cross-leak + commercial-copy + landing-is-cards-only lock |
| `lib/doktor/doktorAraclariUlke.test.ts` | Türkiye lists identical to the snapshot · every tool declares countries · the two locks agree |
| `countries/<kod>/araclar.ts` | The routes valid in that country (second lock) |
| `app/doktor-tools/page.tsx` | Card grid only — **never** mounts `HedefBoyAracPaneli` |
| `app/doktor-tools/hedef-boy/page.tsx` | Pediatri studio (opens when you use the card) |
| Chapter deep links | `doktorAraciBransaUygun` / `usePediatriHedefBoy` + redirect |

Do **not** hardcode the tool array on the page.

## How to add

**Base / new universal**

1. Implement under shared `app/doktor-tools/…` + `lib/` (not `specialties/<slug>/` unless truly chapter clinical).
2. Append to `ORTAK_DOKTOR_ARACLARI` with doctor-facing copy and an explicit `ulkeler`.
3. Add the route to each named country's pack list; for Türkiye run `npm run ulke:arac-anlik`.
4. Test: every branş list includes it; commercial-copy assertions stay green; `doktorAraclariUlke.test.ts` green.

**Specialty-only**

1. Append to `BRANS_DOKTOR_ARACLARI` with `branslar: [SpecialtyKey, …]` and an explicit `ulkeler`.
2. Route under `/doktor-tools/…` (app page, not `.html` audit).
3. Guard the page with `doktorAraciBransaUygun` (it checks the country too); redirect others to `/doktor-tools`.
4. Add the route to each named country's pack list; for Türkiye run `npm run ulke:arac-anlik`.
5. Test: owning branş sees it; ≥1 foreign branş does not; a country that is not named does not.

Free-text `users.specialty` → `doktorAracBransi` / `portalBransAnahtari`.

## Anti-patterns

- Treating a base tool as “pediatri-only” because it was built during a pediatri sprint.
- Showing a **child / pediatri** tool (Hedef Boy, büyüme studio, …) in kardiyoloji or any non-owning branş.
- Skipping visibility analysis (“which specialties see this?”) when adding a specialty-only tile.
- Showing another branş’s clinical tile (göz≠dahiliye, KD≠göz).
- Linking audit HTML “only for KD” — still wrong for commercial UI.
- Forking epikriz / ilaç etkileşimi / ICD-10 per specialty.
- Named beta doctors or sprint jargon in tile copy.
- Giving a tool every country “because it is universal” — each country is an explicit, audited entry.
- Adding a country to a tool whose content is another country's (SGK / SUT / Medula / e-Nabız, a national vaccination calendar, a region-calibrated risk score) without building the local content first.
- Adding a tool to one lock only (registry `ulkeler` without the pack list, or the reverse) — it stays hidden and the test fails.

## Checklist (paste into PR / commit notes)

```
- [ ] Bucket named: base | specialty-only | new-universal
- [ ] Visibility named: all ~30 OR explicit SpecialtyKey[] + ≥2 branşlar that must NOT see it
- [ ] Which countries? named: explicit `ulkeler` + the route in each named country's pack list; every other country's verdict (Remove / Adapt / Keep) noted
- [ ] Türkiye tool change on purpose → `npm run ulke:arac-anlik` in the same commit
- [ ] If base/universal: ORTAK_…; identical for all ~30
- [ ] If specialty-only: BRANS_… + branslar + deep-link guard + foreign-branş absence test
- [ ] Commercial copy: no person names, no sprint/audit jargon, no .html audit links
- [ ] Page still uses doktorAraclariListesi only; no embedded studios on landing
```

## Related

- `.cursor/rules/specialty-doktor-araclari.mdc` (always-on Cursor rule)
- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md`
- `.cursor/skills/specialty-hasta-portali/SKILL.md`
- `.cursor/skills/cross-specialty-parity/SKILL.md`
- `docs/COUNTRY-PACK-CHECKLIST.md` (section F — tools per country) · `docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md`
