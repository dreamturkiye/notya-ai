---
name: specialty-doktor-araclari
description: >-
  Keeps Doktor Araçları (/doktor-tools) specialty-scoped: shared spine tools for
  every branş, chapter tiles only for that doctor's specialty. Use when adding
  or editing araç cards, audit HTML links, kohort panels, or any specialty tool
  under app/doktor-tools — and when fixing cross-leak (göz seeing dahiliye, KD
  seeing göz araçları).
---

# Specialty-scoped Doktor Araçları

Boss rule (verbatim):

> Doktor araclari specific specialty icin olmali.
> Goz hastaliklari araclarinda dahiliye olmamali
> KD'de goz hastaliklari araclari olmamli

## One-line rule

**Shared spine tools → every branş. Chapter tools → that doctor's specialty only.**

Same shape as hasta dosyası tabs and Sağlığım modules (`specialty-universal-vs-chapter`, `specialty-hasta-portali`).

## Catalog (source of truth)

| File | Role |
|------|------|
| `lib/doktor/doktorAraclari.ts` | `ORTAK_DOKTOR_ARACLARI` + `BRANS_DOKTOR_ARACLARI` + `doktorAraclariListesi()` |
| `lib/doktor/doktorAraclari.test.ts` | Cross-leak lock (göz≠dahiliye, KD≠göz, …) |
| `app/doktor-tools/page.tsx` | Renders **only** `doktorAraclariListesi(users.specialty)` |
| Chapter deep links | Guard with `doktorAraciBransaUygun(route, specialty)` (e.g. dahiliye-kohort) |

Do **not** hardcode the full tool array in the page. Do **not** show every audit HTML / kohort tile to every doctor.

## Universal (every specialty)

e-Reçete, Epikriz, ICD-10, İlaç Etkileşimi, Hasta Raporları, Tetkik İstek, Hasta Portalı, SGK Medula, e-Nabız — `branslar: null`.

Pediatri **Hedef Boy** stays on its own gate (`usePediatriHedefBoy` / `pediatriHedefBoyBransi`) — not a chapter audit tile.

## Chapter-only (never cross-leak)

| Tile family | `branslar` |
|-------------|------------|
| KD Audit (pre/post) | `kadin-hastaliklari-dogum` |
| Dahiliye Audit + Gaps + Kohort | `dahiliye` |
| Göz Audit (pre/post) | `goz-hastaliklari` |

When a new chapter ships a tool or audit HTML:

1. Add it to `BRANS_DOKTOR_ARACLARI` with the correct `SpecialtyKey[]`.
2. Extend `doktorAraclari.test.ts` so at least one *other* specialty asserts the tile is absent.
3. If the route is an app page (not static HTML), guard the page with `doktorAraciBransaUygun` and redirect to `/doktor-tools`.

Free-text `users.specialty` ("Göz Hastalıkları", "İç Hastalıkları", `kadin-dogum`) resolves via `portalBransAnahtari` / `doktorAracBransi` — reuse that; do not invent a second alias table on the page.

## Anti-patterns

- Dumping all audit HTML links into one static `tools` array on the page.
- `if (goz) hideDahiliye` one-offs instead of catalog `branslar`.
- Showing chapter tools to aile/genel/pediatri "just in case" — baseline gets **shared only** until that chapter owns the doctor.
- Claiming "specialty-specific" while the grid still lists another branş's audits.

## Checklist

```
- [ ] New araç: ortak → ORTAK_…; chapter → BRANS_… with branslar set
- [ ] Test: owning branş sees it; ≥1 foreign branş does not
- [ ] Page still calls doktorAraclariListesi (no inline full catalog)
- [ ] Deep-link page guarded if chapter-only
- [ ] No göz↔dahiliye / KD↔göz leak
```

## Related

- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md`
- `.cursor/skills/specialty-hasta-portali/SKILL.md`
- `.cursor/skills/cross-specialty-parity/SKILL.md` (shared spine fixes still reach every branş)
