# Deri ve Zührevi Hastalıklar

Ground-up clinic model for Turkish dermatology (genel poliklinik + yandal üniteleri + işlem odası + fototerapi + görüntü). Not a reskin of pediatri or kadin-dogum.

Imaging is the axis. Photos live in the existing core `hasta_goruntulemeler` / `app/api/doktor/goruntuleme` API. This specialty stores only `coreImageId` + derm metadata. Never pixels. Never a second blob store. Never auto-delete.

The Asistan opens images **with** the uzman, drafts a visual read, and waits for doctor onay. Vision is decision support, never a diagnosis. Disclaimer: "Tarama destegi, tani degildir. Doktor onayi gerekir."

Asistan vision path: core görüntüleme + `specialties/dermatoloji/imaging/vision-tools.ts`. An isotretinoin course can hold month-0 and month-3 photos on the same series. An asistan draft VisionRead requires uzman onay (dual-sign). Asistan cannot self-approve.

Belge Tier A → dual-sign bridge (DERM-EXCEPTIONAL-01): `imaging/belgeKopru.ts` (pure) turns a Belge kasası analysis — or a de-identified Deri › Görüntü photo sent through the same `core/belgeler/tierA.ts` path — into a **draft** `derm_vision_reads` row via `POST /api/doktor/dermatoloji` `action: 'goruntu-okuma'` (`eylem: 'belge_taslak' | 'asistana_raporla'`). Modalities `derm` / `dermatoskopi` / `yara` only. A body region is required (a read is per lesion; "tüm vücut" is rejected — TBSE is its own flow), unknown Fitzpatrick caps confidence at ≤70%, model diagnoses are written as "olası bulgu — tanı değildir", and an errored / low-quality analysis is refused in favour of the morphology checklist scaffold. The shared Belge page bridge box stays göz-only (`bransKurali.goruntuOkumaKoprusu`); the derm bridge lives in `ui/BelgeAnalizOzet.tsx` ("Görüntü okumasına aktar"), so OD/OS never reaches a derm screen. Migration `054_derm_exceptional.sql`.

Sağlığım › **Derim** is Strong. `engines/portal-derim.ts` (pure) turns doctor-triggered clinical work into patient-safe reminders — monthly blood test (β-hCG) due, phototherapy session, patch test D2/D4, wound/suture/biopsy check, total body skin exam, follow-up photo — with geciken / yaklaşan flags. Titles come from the task **code**, never from the doctor's own task text, and `hastaDiliTemizMi` blocks scores (PASI/EASI/SCORAD/DLQI/SALT), doses (mg, mg/kg, J/cm²), drug names and diagnoses.

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
npm run test:derm
npm run test:specialties
npm run test:brans-sizmasi
npm run test:izolasyon
npm test
```

Runtime smoke (real `next start`, QA doctor `qa.derm@notya.ai`, synthetic patients deleted afterwards):

```
npx tsx scripts/derm-prompts-smoke.mts
npx tsx scripts/derm-exceptional-smoke.mts
```

MD field week checklist: `docs/DERM-MD-BETA.md`. Exit audit: `public/derm-exceptional-audit.html` (never linked from Doktor Araçları).

Chapter files are listed in `package.json`. `index.ts` does not side-load `tests/load.ts`.

## UI tabs (mounted)

`ui/*.tsx` export LezyonKarti, VucutHaritasi, FotoDermoskopiGaleri, BeforeAfterCompare, AsistanGorselPanel, SkorPaneli, FototerapiDefteri, YamaTakvimi. They render on the hasta dosyası **Deri & Lezyon** tab via `HastaDermatoloji`.
