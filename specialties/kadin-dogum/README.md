# Kadın Hastalıkları ve Doğum

Specialty chapter for Notya. Core `patients` / `visits` stay generic. Every SAT, NT, OGTT, Anti-D, G/P/A/Y/D/E, CRL, and EDD field lives in `specialty_records.payload` and is validated by `schema.ts`.

Citation policy: cite **role**, never dump copyrighted book text.

Dr. Gokhan Mamur ranking (Notya): TR kadın doğum hekimi pratik gold standard is **ACOG** (Practice Bulletin / Committee Opinion / OCC). Legal floor is **DÖBYR 2026** / Doğum Sonu Bakım / Riskli Gebelikler. Textbook depth is **Williams Obstetrik 26** (TR Tıraş/Çakıroğlu). Jinekoloji stays **Berek & Novak**. TR wording stays **Temel KD**. If ACOG and DÖBYR differ, show both columns (`sb_required` vs `acog_recommended`) with `conflict: true` and uiHint `yasal asgari vs klinik öneri` — never collapse.

## Dual calendar in the UI

`engines/izlem-calendar.ts` emits every planned visit with `sb_required`, `acog_recommended`, and `source: 'sb'|'acog'|'both'`. Overlay rows are `acog_overlay` (never `sb_required`). `ui/IzlemTimeline.tsx` is mounted on the gebelik tab via `HastaKdChapter`.

e-Nabız / MBYS / e-Doğum remain adapters only.

ACOG document numbers (PB/CO/CC) live in `protocols/acog-map.ts`, verified against the ACOG Combined List of Titles (September 2026). They are not on core types.

## How this manifest is registered in the shell

`lib/specialties/kadin-dogum.ts` imports `KADIN_DOGUM_MANIFEST` and `lib/specialties/registry.ts` serves it as `specialtyProfile('kadin-hastaliklari-dogum')`.

The hasta dosyası **Kadın Sağlığı & Gebelik** tab (`components/doktor/HastaGebelik.tsx`) mounts GebeKarti, IzlemTimeline, TaramaPencereleri, UsgGallery, UsgCompare, AsistanGorselPanel, and JinekolojiKart via `HastaKdChapter`. Live SAT/EDD are mapped from `/api/doktor/gebelik` into the specialty payload — they are not added to core patient/visit types.

`Deri & Lezyon` is a separate tab (`HastaDermatoloji`) for the dermatoloji chapter.

This sandbox no longer leaves the chapter unmounted.

## Shared files that were wired (this pass)

| Path | Why |
|---|---|
| `lib/specialties/registry.ts` | Serves KD + dermatoloji chapters. |
| `lib/specialties/kadin-dogum.ts` | Imports `KADIN_DOGUM_MANIFEST`; ACOG-first sources. |
| `lib/specialties/kadin-dogum-live.ts` | Maps `/api/doktor/gebelik` → specialty payload. |
| `components/doktor/HastaGebelik.tsx` | Mounts `HastaKdChapter`. |
| `app/dashboard/doktor/hastalar/[id]/page.tsx` | Deri & Lezyon tab. |
| `lib/doktor/bransAdlari.ts` | Dermatoloji resmi unvan. |
| `lib/specialties/profile.ts` | Unchanged — `sonAdetTarihi` stays a display key; SAT/CRL/EDD stay in specialty payload. |
| `app/api/doktor/gebelik/route.ts` | Unchanged thin wrap. |
| `specialties/pediatri/**` | Frozen. |

## Tests

```
npm run test:kd
npm run test:derm
npm run test:specialties
npm test
```

Chapter files are listed in `package.json` (`test:kd` / `test`). `index.ts` does not side-load `tests/load.ts`.

## UI tabs (mounted)

`ui/*.tsx` export GebeKarti, IzlemTimeline, UsgGallery, UsgCompare, TaramaPencereleri, JinekolojiKart, AsistanGorselPanel, NstStrip. They render on **Kadın Sağlığı & Gebelik** via `components/doktor/HastaKdChapter.tsx`.

## Asistan USG

Asistan USG uses core görüntüleme + `specialties/kadin-dogum/imaging/vision-tools.ts`. An 18–22w detailed scan and a later growth scan can be compared (`kd.compare_growth` / `UsgCompare`). A draft VisionRead needs uzman onay; asistan cannot self-approve. Disclaimer: "Ölçüm ve tarama destegi, tani degildir. Uzman onayi gerekir."

## Bridge

`bridges/dogum-yenidogan.ts` is the handoff adapter. Pediatrics consumes the draft; this folder does not modify `specialties/pediatri/**`. No public newborn contract existed there, so the bridge exports `NewbornHandoff` and stops.