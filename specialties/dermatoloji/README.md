# Deri ve Zührevi Hastalıklar

Ground-up clinic model for Turkish dermatology (genel poliklinik + yandal üniteleri + işlem odası + fototerapi + görüntü). Not a reskin of pediatri or kadin-dogum.

Imaging is the axis. Photos live in the existing core `hasta_goruntulemeler` / `app/api/doktor/goruntuleme` API. This specialty stores only `coreImageId` + derm metadata. Never pixels. Never a second blob store. Never auto-delete.

The Asistan opens images **with** the uzman, drafts a visual read, and waits for doctor onay. Vision is decision support, never a diagnosis. Disclaimer: "Tarama destegi, tani degildir. Doktor onayi gerekir."

Asistan vision path: core görüntüleme + `specialties/dermatoloji/imaging/vision-tools.ts`. An isotretinoin course can hold month-0 and month-3 photos on the same series. An asistan draft VisionRead requires uzman onay (dual-sign). Asistan cannot self-approve.

Citation: cite **role**, never dump book text. Gold = Bolognia 5 (2024). Clinic/atlas = Andrews 14 TR. Ulusal = Temel Dermatoloji. Society = PSOKİD 2025, TDD AD 2018, TDD Akne, Behçet Alpsoy. Training = TUKMOS 2019. State = SUT 2026, GÖP KÜB, Ayakta Teşhis, solaryum yasağı, BZBH Form 014. KETEM is **not** skin cancer (breast/cervix/colon hints only).

## How to register this manifest in the shell (not done here)

`lib/specialties/registry.ts` currently returns `baselineProfile` for `dermatoloji`. To mount this folder:

1. Import `DERMATOLOJI_MANIFEST` from `specialties/dermatoloji` into a new `lib/specialties/dermatoloji.ts` (or a thin wrapper) and add it to `CHAPTERS`.
2. Mount tabs from the manifest (`LezyonKarti`, `VucutHaritasi`, `FotoDermoskopiGaleri`, …) in the doktor shell.
3. Wrap `app/api/doktor/goruntuleme` — do not invent a second store. Do not put PASI / Fitzpatrick / MED / GÖP / dermoscopy / ImageSeries onto core patient/visit types.

This sandbox does **not** edit those shared files.

## Shared files that would need a change (listed, not edited)

| Path | Why |
|---|---|
| `package.json` | npm `zod`; test script mapping `pnpm test specialties/dermatoloji`. Schema uses in-tree `z` until allowed. |
| `package-lock.json` | Lockfile if zod is added. |
| `lib/specialties/registry.ts` | Wire `DERMATOLOJI_MANIFEST` into `specialtyProfile('dermatoloji')`. |
| `lib/specialties/dermatoloji.ts` | Does not exist yet — would be the live chapter wrapper. |
| `lib/specialties/profile.ts` | Do not add PASI/Fitzpatrick/MED/GÖP there. |
| `lib/doktor/imagingModalities.ts` | Dermoscopy/clinical photo codes if the core modality list should name them. Wrap, don't fork. |
| `app/api/doktor/goruntuleme/route.ts` | Thin wrap only. |
| `components/doktor/DoktorNav.tsx` | Mount tabs. |
| Core patient/visit schema | Nullable `specialty_id` only if required — **stop and list the file**. |
| `specialties/pediatri/**` | Frozen. |
| `specialties/kadin-dogum/**` | Frozen for this sprint. |

## Tests

```
pnpm test specialties/pediatri
pnpm test specialties/kadin-dogum
pnpm test specialties/dermatoloji
```

tsx treats a directory argument as an import of `index.ts`. `NODE_TEST_CONTEXT` loads `tests/load.ts` via `createRequire` so chapter tests actually run.

## UI tabs (exported, not mounted)

`ui/*.tsx` export LezyonKarti, VucutHaritasi, FotoDermoskopiGaleri, BeforeAfterCompare, AsistanGorselPanel, SkorPaneli, FototerapiDefteri, YamaTakvimi. Mounting them would require `lib/specialties/registry.ts` / DoktorNav — listed, not edited.
