# Kadın Hastalıkları ve Doğum

Specialty chapter for Notya. Core `patients` / `visits` stay generic. Every SAT, NT, OGTT, Anti-D, G/P/A/Y/D/E, CRL, and EDD field lives in `specialty_records.payload` and is validated by `schema.ts`.

Citation policy: cite **role**, never dump copyrighted book text. Obstetrik gold = Williams 26. Jinekoloji gold = Berek & Novak 16–17. Ulusal TR muayenehane language = Temel KD 4 (Hacettepe). Zorunlu kamu = DÖBYR 2026 (HSGM Yayın No. 1402), Doğum Sonu Bakım, Riskli Gebelikler. e-Nabız / MBYS / e-Doğum are adapters only.

## How to register this manifest in the shell (not done here)

The live chapter registry is `lib/specialties/registry.ts` (`specialtyProfile('kadin-hastaliklari-dogum')` → `lib/specialties/kadin-dogum.ts`). To mount this folder:

1. Import `KADIN_DOGUM_MANIFEST` from `specialties/kadin-dogum` inside `lib/specialties/kadin-dogum.ts` (or a thin wrapper) and expose tabs/tools from the manifest.
2. Keep `app/api/doktor/gebelik/route.ts` a thin wrap — new KD logic stays in this folder.
3. Do not put SAT/NT/OGTT/Anti-D/G/P/A/CRL/EDD onto core patient/visit types.

This sandbox does **not** edit those shared files.

## Shared files that would need a change (listed, not edited)

| Path | Why |
|---|---|
| `package.json` | Add npm `zod`; optionally a test script that maps `pnpm test specialties/pediatri` to this folder. Schema uses an in-tree Zod-shaped `z` until that is allowed. |
| `package-lock.json` | Lockfile if zod is added. |
| `lib/specialties/registry.ts` | Wire `KADIN_DOGUM_MANIFEST` into `specialtyProfile`. |
| `lib/specialties/kadin-dogum.ts` | Existing research chapter (olgunluk: arastirma). Should eventually re-export this folder. |
| `lib/specialties/profile.ts` | Already has `sonAdetTarihi` / `fundusYuksekligi` as display keys — do not add SAT/CRL/EDD there. |
| `app/api/doktor/gebelik/route.ts` | Thin wrap only; do not grow. |
| Core patient/visit schema | Nullable `specialty_id` only if required — **stop and list the file** before touching. |
| `specialties/pediatri/**` | Frozen. No pediatrics Zod schema exists in that folder. Isolation uses `pediatriProbeSchema` in this specialty (GİDR/M-CHAT shaped) plus a grep guard. |

## Tests

```
pnpm test specialties/pediatri
pnpm test specialties/kadin-dogum
```

`pnpm test <path>` currently **appends** the path to the existing `tsx --test` file list in `package.json` (shared, not edited). Pediatrics tests therefore still run from `lib/clinical/mchatR.test.ts` (and siblings).

tsx treats a directory argument as an ESM import of `specialties/kadin-dogum/index.ts`. Until `package.json` can list `specialties/kadin-dogum/tests/*.test.ts`, `index.ts` loads `tests/load.ts` when `NODE_TEST_CONTEXT` is set so `pnpm test specialties/kadin-dogum` actually executes chapter tests. Direct glob also works:

```
npx tsx --test specialties/kadin-dogum/tests/schema-isolation.test.ts specialties/kadin-dogum/tests/pediatri-no-bleed.test.ts specialties/kadin-dogum/tests/sat-edd.test.ts specialties/kadin-dogum/tests/izlem-calendar.test.ts specialties/kadin-dogum/tests/test-windows.test.ts
```

## UI tabs (exported, not mounted)

`ui/*.tsx` export GebeKarti, IzlemTimeline, UsgGallery, TaramaPencereleri, JinekolojiKart. Mounting them in the doktor shell would require editing `lib/specialties/kadin-dogum.ts` (`sekmeler`) and/or `components/doktor/DoktorNav.tsx` / `components/doktor/HastaGebelik.tsx`. Those shared files are listed here and **not edited**.

## Bridge

`bridges/dogum-yenidogan.ts` is the handoff adapter. Pediatrics consumes the draft; this folder does not modify `specialties/pediatri/**`. No public newborn contract existed there, so the bridge exports `NewbornHandoff` and stops.