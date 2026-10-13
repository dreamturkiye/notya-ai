---
name: specialty-doktor-araclari
description: >-
  Standing rule for Doktor Araçları and for classifying any tool work in Notya:
  most tools built via pediatrics are base/shared across all ~30 specialties;
  every new araç must be classified before add as base (same for every branş),
  specialty-only, or a new universal tool. Use BEFORE starting work on Araçlar,
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

**Stop. Classify the araç. Name which specialties see it. Then implement.**

Do not add a tile until (1) the bucket is named and (2) the **visibility set** is explicit — either “all ~30” or a listed `SpecialtyKey[]`. “Built during pediatri sprint” is not a visibility answer.

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
| `lib/doktor/doktorAraclari.ts` | `ORTAK_…` + `BRANS_…` (incl. Hedef Boy → `/doktor-tools/hedef-boy`) + `doktorAraclariListesi()` |
| `lib/doktor/doktorAraclari.test.ts` | Cross-leak + commercial-copy + landing-is-cards-only lock |
| `app/doktor-tools/page.tsx` | Card grid only — **never** mounts `HedefBoyAracPaneli` |
| `app/doktor-tools/hedef-boy/page.tsx` | Pediatri studio (opens when you use the card) |
| Chapter deep links | `doktorAraciBransaUygun` / `usePediatriHedefBoy` + redirect |

Do **not** hardcode the tool array on the page.

## How to add

**Base / new universal**

1. Implement under shared `app/doktor-tools/…` + `lib/` (not `specialties/<slug>/` unless truly chapter clinical).
2. Append to `ORTAK_DOKTOR_ARACLARI` with doctor-facing copy.
3. Test: every branş list includes it; commercial-copy assertions stay green.

**Specialty-only**

1. Append to `BRANS_DOKTOR_ARACLARI` with `branslar: [SpecialtyKey, …]`.
2. Route under `/doktor-tools/…` (app page, not `.html` audit).
3. Guard the page with `doktorAraciBransaUygun`; redirect others to `/doktor-tools`.
4. Test: owning branş sees it; ≥1 foreign branş does not.

Free-text `users.specialty` → `doktorAracBransi` / `portalBransAnahtari`.

## Anti-patterns

- Treating a base tool as “pediatri-only” because it was built during a pediatri sprint.
- Showing a **child / pediatri** tool (Hedef Boy, büyüme studio, …) in kardiyoloji or any non-owning branş.
- Skipping visibility analysis (“which specialties see this?”) when adding a specialty-only tile.
- Showing another branş’s clinical tile (göz≠dahiliye, KD≠göz).
- Linking audit HTML “only for KD” — still wrong for commercial UI.
- Forking epikriz / ilaç etkileşimi / ICD-10 per specialty.
- Named beta doctors or sprint jargon in tile copy.

## Checklist (paste into PR / commit notes)

```
- [ ] Bucket named: base | specialty-only | new-universal
- [ ] Visibility named: all ~30 OR explicit SpecialtyKey[] + ≥2 branşlar that must NOT see it
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
