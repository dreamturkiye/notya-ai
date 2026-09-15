# Deri ve Zührevi Hastalıklar

Ground-up clinic model for Turkish dermatology (genel poliklinik + yandal üniteleri + işlem odası + fototerapi + görüntü). Not a reskin of pediatri or kadin-dogum.

Imaging is the axis. Photos live in the existing core `hasta_goruntulemeler` / `app/api/doktor/goruntuleme` API. This specialty stores only `coreImageId` + derm metadata. Never pixels. Never a second blob store. Never auto-delete.

The Asistan opens images **with** the uzman, drafts a visual read, and waits for doctor onay. Vision is decision support, never a diagnosis. Disclaimer: "Tarama destegi, tani degildir. Doktor onayi gerekir."

Asistan vision path: core görüntüleme + `specialties/dermatoloji/imaging/vision-tools.ts`. An isotretinoin course can hold month-0 and month-3 photos on the same series. An asistan draft VisionRead requires uzman onay (dual-sign). Asistan cannot self-approve.

Citation: cite **role**, never dump book text. Gold = Bolognia 5 (2024). Clinic/atlas = Andrews 14 TR. Ulusal = Temel Dermatoloji. Society = PSOKİD 2025, TDD AD 2018, TDD Akne, Behçet Alpsoy. Training = TUKMOS 2019. State = SUT 2026, GÖP KÜB, Ayakta Teşhis, solaryum yasağı, BZBH Form 014. KETEM is **not** skin cancer (breast/cervix/colon hints only).

## How this manifest is registered in the shell

`lib/specialties/dermatoloji.ts` wraps `DERMATOLOJI_MANIFEST`. `specialtyProfile('dermatoloji')` is no longer `baselineProfile`.

The hasta dosyası **Deri & Lezyon** tab is `components/doktor/HastaDermatoloji.tsx`. It loads `app/api/doktor/goruntuleme?hastaId=` and maps rows to `coreImageId` + derm metadata (LezyonKarti, VucutHaritasi, FotoDermoskopiGaleri, BeforeAfterCompare, AsistanGorselPanel, SkorPaneli, YamaTakvimi, FototerapiDefteri). No second blob store. No PASI/Fitzpatrick on core patient types.

## Shared files that would need a change (listed, not edited)

| Path | Why |
|---|---|
| `package.json` | npm `zod`; test script mapping `pnpm test specialties/dermatoloji`. Schema uses in-tree `z` until allowed. |
| `package-lock.json` | Lockfile if zod is added. |
| `lib/specialties/registry.ts` | Wired: `specialtyProfile('dermatoloji')` → `DERMATOLOJI_PROFILE`. |
| `lib/specialties/dermatoloji.ts` | Live chapter wrapper (created). |
| `components/doktor/HastaDermatoloji.tsx` | Hasta dosyası Deri & Lezyon tab. |
| `app/dashboard/doktor/hastalar/[id]/page.tsx` | Mounts the Deri & Lezyon tab. |
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

## UI tabs (mounted)

`ui/*.tsx` export LezyonKarti, VucutHaritasi, FotoDermoskopiGaleri, BeforeAfterCompare, AsistanGorselPanel, SkorPaneli, FototerapiDefteri, YamaTakvimi. They render on the hasta dosyası **Deri & Lezyon** tab via `HastaDermatoloji`.
