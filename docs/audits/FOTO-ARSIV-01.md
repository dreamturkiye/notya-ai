# FOTO-ARSIV-01 / FOTO-AI-01 — audit note (2026-10-16, branch `feature/foto-arsivi`)

Scope: the "Fotoğraflar" tab of the patient file and Ayşe's photo evaluation. Everything below is what was *checked*, not what is claimed to work for a doctor.

## Classification

* Universal tab (id `fotograflar`, right after `konsultasyon`), every branş and every age — like Konsültasyonlar. Not a Doktor Araçları tile. No specialty field lives in the shared tab: `istemci.test.ts` fails if a pediatric word is hard-wired into `components/doktor/fotoArsivi/*`.
* Pediatric vocabulary and checks exist only in `lib/doktor/muayeneEk/foto/*` behind `fotoModu` (pediatri / çocuk cerrahisi) and the "veli" wording follows `veliDiliMi` (patient age). Psikiyatri has image analysis closed.
* Staff: `sekreter` and `hasta_danismani` cannot reach any `/api/doktor/hasta-foto/**` route; `asistan` can view/tag/annotate but not call the AI routes. Doctor scoping on every id (foreign id = 404), audit log on open / report / AI / feedback / edit, no signed URLs, EXIF stripped on every byte stream, nothing stored in the browser.

## What was verified, and how

| Layer | How | Result |
|---|---|---|
| Zoom/pan/pinch, tone pipeline, timeline, adjustments, annotations, measurement | unit tests (`gorunum`, `piksel`, `duzenleme`, `zamanCizelgesi`) | pass |
| Routes, ownership, roles, EXIF, thumbnails, AI cache / privacy / repair / closure, feedback, kill switches, "Yüklenen dosyalar" no-regression | `lib/security/hasta-izolasyon.test.ts` (in-memory DB, mocked model) | pass |
| Structured AI output, calibration, learning, harness arithmetic, PDF text | `foto.test.ts`, `harness.test.ts`, `meta.test.ts`, `raporPdf.test.ts` | pass |
| Browser behaviour | Chromium via Playwright at 390x844 (touch emulation, DPR 2) and 1280x800, synthetic JPEGs, API mocked in the browser (throwaway page, not committed): list, region filter, Turkish case-insensitive search, lazy thumbnails (23 of 90 tiles fetched with 248 photos), paging, viewer, adjustments saved as parameters, "Orijinale dön", annotations + calibrated mm, wheel zoom, arrow-key same-region navigation, stars/tags, Ayşe panel (banner, red flag, "Doktor incelemesi gerekir", model + prompt version, Kabul), compare side by side + slider with shared zoom and "47 gün arayla", change analysis, pre-save quality gate (nothing uploaded while the gate is open; "Yine de kaydet"), batch tag, PDF download | 58/58 scripted checks + 3/3 large-archive checks, no console errors |

Screenshots: `docs/audits/screenshots-foto-arsivi/` (`NN-name-390.png` / `-1280.png`; `16-buyuk-arsiv-mobil.png` = 248-photo archive).

## NOT verified

No real phone, no real clinical photograph, no real model call, no real Supabase, migration 174 not applied. The pinch gesture was driven with mouse/wheel events and the shared `useJestler` logic is covered only by the pure maths tests. The AI panel was rendered from a hand-written response, so it shows layout, not model quality. See OPEN-COMMITMENTS FOTO-ARSIV-01..09 and FOTO-AI-02.
