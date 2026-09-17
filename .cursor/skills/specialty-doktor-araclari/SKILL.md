---
name: specialty-doktor-araclari
description: >-
  Keeps Doktor Araçları (/doktor-tools) a commercial, specialty-scoped product
  surface: shared spine tools for every branş, real chapter clinical tools only
  for that doctor's specialty. Use when adding or editing araç cards, kohort
  panels, or any specialty tool under app/doktor-tools — and when fixing
  cross-leak or internal/dev artifacts leaking into the doctor UI (audit HTML,
  sprint jargon, named beta doctors).
---

# Specialty-scoped Doktor Araçları (commercial product)

Boss rules (verbatim intent):

> Doktor araclari specific specialty icin olmali.
> Goz hastaliklari araclarinda dahiliye olmamali
> KD'de goz hastaliklari araclari olmamli

> Bu application Dr. Gokhan'in ozel applikasyonu degil. Commercial application.

## One-line rule

**Shared clinical tools → every branş. Chapter clinical tools → that doctor's specialty only. Internal engineering artifacts → never on /doktor-tools.**

Same shape as hasta dosyası tabs and Sağlığım modules (`specialty-universal-vs-chapter`, `specialty-hasta-portali`).

## Commercial surface (non-negotiable)

`/doktor-tools` is what paying doctors see. It is **not** a private toolbox for one beta clinic and **not** an engineering dashboard.

**Never** put on the Araçlar grid (any branş):

- Sprint / wow / pre-sprint / post-sprint / gaps audit HTML
- Internal ticket ids (`JINE-04`, `DAH-WOW`, …) in titles or descriptions
- Named people in doctor-facing copy (`Gökhan paylaşımı`, `Gökhan pediatri revizyonu`, …)
- Repo-only docs that belong under `docs/` or static audit HTML for the team

Those files may stay in the repo for the team; they must not be linked from Doktor Araçları.

## Catalog (source of truth)

| File | Role |
|------|------|
| `lib/doktor/doktorAraclari.ts` | `ORTAK_DOKTOR_ARACLARI` + `BRANS_DOKTOR_ARACLARI` + `doktorAraclariListesi()` |
| `lib/doktor/doktorAraclari.test.ts` | Cross-leak + commercial-copy lock |
| `app/doktor-tools/page.tsx` | Renders **only** `doktorAraclariListesi(users.specialty)` |
| Chapter deep links | Guard with `doktorAraciBransaUygun(route, specialty)` (e.g. dahiliye-kohort) |

Do **not** hardcode the tool array in the page.

## Universal (every specialty)

e-Reçete, Epikriz, ICD-10, İlaç Etkileşimi, Hasta Raporları, Tetkik İstek, Hasta Portalı, SGK Medula, e-Nabız — `branslar: null`.

Pediatri **Hedef Boy** stays on its own gate (`usePediatriHedefBoy` / `pediatriHedefBoyBransi`).

## Chapter-only clinical tools (never cross-leak)

| Tile | `branslar` |
|------|------------|
| Dahiliye Kohort Paneli | `dahiliye` |

When a new chapter ships a **real clinical** tool:

1. Add it to `BRANS_DOKTOR_ARACLARI` with the correct `SpecialtyKey[]` and a doctor-facing title/desc.
2. Route must be an app page under `/doktor-tools/…` (not `.html` audit dumps).
3. Extend `doktorAraclari.test.ts`: owning branş sees it; ≥1 foreign branş does not; commercial-copy assertions still pass.
4. Guard the page with `doktorAraciBransaUygun` and redirect to `/doktor-tools`.

Free-text `users.specialty` resolves via `portalBransAnahtari` / `doktorAracBransi`.

## Anti-patterns

- Linking audit HTML from Araçlar “for that branş only” — still wrong; doctors should not see it.
- `Gökhan` / other personal names in tile titles or descriptions.
- Sprint jargon in the commercial UI.
- Showing chapter tools to aile/genel/pediatri “just in case”.
- Dumping all tools into one static array on the page.

## Checklist

```
- [ ] New araç is a real clinical product tool (not an audit/doc)
- [ ] ortak → ORTAK_…; chapter → BRANS_… with branslar set
- [ ] Copy has no person names / sprint jargon
- [ ] Test: owning branş sees it; ≥1 foreign branş does not
- [ ] Commercial-copy test still green
- [ ] Deep-link page guarded if chapter-only
```

## Related

- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md`
- `.cursor/skills/specialty-hasta-portali/SKILL.md`
- `.cursor/skills/cross-specialty-parity/SKILL.md`
