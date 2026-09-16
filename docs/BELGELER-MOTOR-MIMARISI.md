# Notya Belgeler — Multi-Engine Medical AI (Architecture v2.1, as built)

**Status:** designed and BUILT 2026-09-15 (NOTYA-BELGE-01: step 0 + step 1 shipped). **Kaan decisions:** product spec locked (button *Asistana raporla*, taslak → hekim onayı → SOAP Objektif, Plan → Muayeneyi onayla + revizyon, disclaimer strip, quality fail → no tanılar, personas Ayşe/Mehmet/Elif, 30-branş input table, psikiyatri blocked); **no GPU host for now**; ship only commercially-licensed engines. Full research version with the eight review changes: chat file `NOTYA-BELGELER-MOTOR-MIMARISI-v2.1.md` (2026-09-15); this file is the repo truth.

## 1. Three tiers, one contract

Every engine — Claude vision (A), browser ONNX engines (B), a future GPU worker (C) — returns the same `MotorCiktisi` `{motor, surum, tier, dogrulanmis, labels:[{kod, p}], rapor?, kalite?, hata?}` on the **finding ontology** (`bulgu_kodu`), and the writer returns Kaan's locked JSON. UI, fusion, caps and the acil rule never know which tier ran.

| Tier | Runs on | V1 status | Cost |
|---|---|---|---|
| **A** Claude vision | Vercel route `POST /api/doktor/belgeler/analiz` (maxDuration 120) → Anthropic Sonnet | **LIVE, all 30 branşlar** — describe + tanı ≤ %70 (serbest ≤ %55) | tokens only |
| **B** browser engines | doctor's device, ONNX Runtime Web (WebGPU → WASM), models sha256-pinned + cached by `sw.js` | contract + runner shipped (`core/belgeler/tarayiciMotor.ts`); engine modules land one by one with ONNX export + golden set (see README_BELGELER.md); registry rows exist with `aktif=false` | €0 |
| **C** GPU worker | EU secure GPU, `analiz_isleri` polled queue | **not built** — trigger: paying doctor needs CT/MR volumes / WSI / echo EF, >500 analyses/month, or latency complaints from ≥3 practices. Never SaladCloud for patient images. | later |

## 2. Pipeline (as built)

```
vault belge ─► client de-id (canvas re-encode = EXIF gone, ≤1568px, blur/exposure metrics; audio → log-spectrogram PNG + metrics)
            ─► doctor confirms "görüntüde kimlik yok" (KVKK checkbox; PDFs go server-side from the vault)
            ─► Tier B engines (browser, when registered)  ∥  POST /analiz: router → Claude writer (persona) → fusion → validator → belge_analizleri
            ─► UI: özet (editable) · bulgular · olası tanılar (%, bant, destek/karşı) · resmi tanı kilidi · Onayla → notes.content_objektif
            ─► Plan düzenle → Muayeneyi onayla → notes.content_plan + muayene_revizyonlar; analiz locked
```

- **Router** `core/belgeler/router.ts`: 30 branşlar → accepted modalities, persona, Tier B engine list, pediatric flag; unlisted modality → `serbest` (describe only); psikiyatri `engelli`.
- **Ontology** `core/belgeler/ontoloji.ts`: ~110 codes (CXR, FUN, ECG, ECHO, DERM/YARA, SND, BONE, ICH/CT, US, MAMMO, PATH/YAYMA, OTO/ENDO/DENT, GEN) with Turkish label, ICD-10 hint and per-code **acil threshold**.
- **Fusion + validator** `core/belgeler/fusion.ts` (17 tests): ontology-only agreement (validated engines weight 1, others 0.5; validated p weighted double in fused p), `karsi[]` = engines that ran and stayed silent, keep if agree≥2 or validated p≥0.85; **cap table enforced in code**: 95 (≥2 validated agree) / 85 (one validated) / 70 (Claude/zero-shot only) / **60 + note when patient <16 yaş with adult-trained engine** / 70 phone derm without Fitzpatrick or single-field fundus / 55 serbest / **0 = no tanılar when kalite dusuk**; bands yüksek≥80 orta≥55; **acil by rule** from ontology thresholds (Claude may add, never remove). Every correction is stored (`fusion.duzeltmeler`).
- **Writer** `core/belgeler/yazar.ts`: persona system prompts (Ayşe pediatri, Mehmet kardiyoloji, Elif nöroloji/dahiliye, genel), strict JSON, sound rule (üfürüm var/yok/değerlendirilemedi; ral/wheezing/stridor; no valve grade), never writes identity, never claims engine > specialist; Claude's own codes are fused as an unvalidated Tier A engine.
- **Client de-id + audio** `core/belgeler/deid.ts`: EXIF strip by re-encode, downscale, Laplacian blur score; Web Audio → mono → Hann STFT → 128 log bands 40 Hz–4 kHz spectrogram PNG; metrics (sure, RMS, clipping %, SNR proxy) with quality rule (≥8 s, clipping <1 %, RMS, SNR).
- **Approve** `POST /api/doktor/belgeler/analiz/onayla`: `onayla` requires ≥1 hekim tanısı; appends a report block to the patient's latest note `content_objektif` (or given noteId), logs `not_duzenlemeleri` (the note learning log) + `muayene_revizyonlar` + `belge_revizyonlar`; `muayene_onayla` updates `content_plan` with revision and locks the analysis. Engine output never writes the note by itself.

## 3. Tables (migration 025, applied live 2026-09-15)

`belge_analizleri` (analysis per document: brans, modality_final, yas_ay, cinsiyet, de_id_hash, engine_set, durum, sonuc, motor_ciktilari immutable, fusion, hekim_tanisi, hekim_ozet, note_id, onaylandi_at) · `belge_revizyonlar` (doctor edits: ozet | hekim_tanisi | onay | muayene_onay) · `muayene_revizyonlar` (note objektif/plan revisions sourced from belge_analizi) · `motor_kayit` (engine registry: tier, license, ticari_kullanim, dogrulama_seti/auroc, weights_sha256, model_url, aktif). Seeded: `claude-vision` active; 7 Tier B engines registered inactive. **Only `aktif=true` AND `ticari_kullanim=true` engines count as validated in fusion — whatever the client claims.**

States: `taslak → hekim_duzenledi → onaylandi → muayene_onaylandi`, side exits `kalite_dusuk`, `modalite_uyusmazlik`, `hata`.

## 4. Surfaces

- `/dashboard/doktor/hastalar/[id]` → Belgeler (vault list) → **Asistana raporla** chip per document.
- `/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]`: media (DocumentViewer, audio playable) · modality select (branş-filtered) · klinik not · KVKK checkbox · Asistana raporla · disclaimer strip · acil banner · özet (editable) · bulgular · olası tanılar with %/bant/destek/karşı + "Resmi tanıya al" · resmi tanı (one per line, ICD-10 in parentheses) → Kilitle → **Onayla → Muayene Objektif** → Plan düzenle → **Muayeneyi onayla** · Sınırlar · **Motorlar** chips (tier, ✓ validated, ✗ error) with fused p and system corrections.

## 5. Engine catalog — capability × license (research 2026-09-15)

✅ commercial-safe under its terms · ⚠️ verify · ❌ non-commercial, eval-only. HAI-DEF = Google Health AI Developer Foundations terms.

| Modality | Tier B (browser, V1.5) | Tier C (GPU, later) | Eval-only / blocked |
|---|---|---|---|
| CXR | **TorchXRayVision** DenseNet (Apache-2.0 ✅, 18 labels), CheXzero (MIT ✅) | **Ark+** (fully open, Nature 2025 ✅), CXR Foundation (HAI-DEF ✅), MedGemma 1.5 (bbox + longitudinal ✅), MAIRA-2 ⚠️ | pediatric CXR: no commercial OSS → adult + cap 60 |
| Sound | **HeAR** int8 (HAI-DEF ✅) + our probes on ICBHI (crackle/wheeze), CirCor (murmur), Coswara/COUGHVID (cough) | — | voice pathology (describe only) |
| ECG | **PTB-XL** Inception1d (data CC-BY ✅) for digital exports | ECG digitizer (PhysioNet 2024 ✅), ECG-FM ⚠️ | — |
| Bone | **GRAZPEDWRI-DX** pediatric wrist YOLO (CC BY 4.0 data ✅), **FracAtlas** (CC BY 4.0 ✅), RSNA bone age ⚠️ weights | MedGemma bbox | MURA-derived weights ⚠️ (research data) |
| Fundus/OCT | — | MedGemma + MedSigLIP zero-shot DR (✅), VisionFM ⚠️ | **RETFound ❌ CC BY-NC** |
| Derm | Derm Foundation probes if ≤100 MB (HAI-DEF ✅) | MedSigLIP 79-class zero-shot ✅ | **HAM10000 heads ❌ CC BY-NC-SA** |
| CT/MR | — | **MedGemma 1.5 3D volumes** ✅, TotalSegmentator (Apache ✅), MedSAM2 (Apache ✅), RSNA ICH ports ⚠️ | — |
| Echo | — | describe only until Stanford permission | **EchoNet data ❌ non-commercial DUA** |
| Path | — | Path Foundation ✅, **H-optimus-0** (Apache ✅), MedGemma WSI ✅; Virchow2 / Prov-GigaPath ⚠️ | **UNI / CONCH ❌ CC BY-NC-ND** |
| US | — | SonoNet fetal planes ⚠️, USFM ⚠️, MedSAM2 ✅, MedGemma describe | — |
| Long tail (otoscopy, endoscopy, dental, smear, NST, EEG, gait) | MediaPipe Pose for gait (Apache ✅) | MedSigLIP zero-shot + MedGemma describe; Endo-FM, Kvasir-SEG, DENTEX to evaluate on demand | — |
| Psikiyatri | blocked | blocked | blocked |

Key research facts: MedGemma 1.5 4B (Jan 2026) interprets 3D CT/MR volumes, whole-slide pathology, longitudinal CXR and gives CXR bounding boxes — Tier C item, no longer "V2". HeAR (HAI-DEF, gated HF) is the acoustic foundation model; it returns embeddings, so each task needs a small probe trained on public sets.

## 6. Release gate and field rule

Engine goes `aktif=true` only with: ONNX export sha256, license text, golden-set AUROC per code (`motor_kayit`), and a row in `README_BELGELER.md`. Version bump must not lose >1 AUROC point on a routed code. `docs/MOTOR-UYUMLULUK.md` is field-only, same rule as Cihaz Köprüsü: "sahada test edildi" after a real doctor reviewed ≥20 drafts and the disagreement log (`belge_revizyonlar`) was read. Never retrain from doctor edits without review.

## 7. KVKK / regulatory

Tier B pixels never leave the device. Tier A sends a de-identified derivative (no EXIF, doctor-confirmed no burned-in identity) to Anthropic — the same processor that already receives note text; PDFs go vault-decrypted, doctor-scoped. TİTCK framing: clinical decision support with the physician in the loop — "taslak", tanı/tedavi hekime aittir, every draft traceable to engine + version + doctor action. Never market as "tanı koyar".

## 8. Open items (ledger NOTYA-BELGE-02..08)

Tier B engine modules (TXRV first, then HeAR probes, PTB-XL, GRAZPEDWRI) with model hosting on Supabase Storage; automatic OCR redaction + face blur (V1 = doctor checkbox); DICOM single-slice import; Supabase region confirmation; license letters to Stanford (EchoNet) and VisionFM authors; Ayşe/SOAP awareness of approved belge reports; beta checklist item.
