---
name: belge-otomatik-akis
description: >-
  Standing workflow rule (Kaan + Dr. Gökhan, 2026-10-21) for documents in the muayene flow, identical for all 40 branches
  (30 medical + 10 Özel Branşlar) and all six country versions: post-dictation "belgeleri ekle" -> automatic on-device
  masking of the OUTBOUND copy -> automatic evaluation -> automatic insert into the muayene note. No per-document approval,
  no identity checkbox in the normal path, no revision page opened as a side effect. Batch-first (N documents, one note write).
  Use before touching the Ekler step, Belgeler vault upload, the Belgeler [belgeId] page, onayla route or note-insertion text.
---

# Belge otomatik akışı (upload -> mask -> evaluate -> note)

**The standard** (do not fork per specialty or country):

1. Doctor dictates -> "belgeleri ekle" step (`components/doktor/MuayeneEklerAdimi.tsx`) or uploads in Belgeler
   (`components/doktor/MuayeneEkleri.tsx`, multi-select). Any number of documents; bounded concurrency 3.
2. Per image: OCR on the full image + 2x header band (`core/belgeler/deid.ts`, `kimlikMaske.ts`). The doctor sees and the vault stores
   the ORIGINAL; only the outbound copy is masked. UI shows one quiet line (`deIdMetin().kopyadaGizli`), chips for what was found,
   and a non-blocking wrong-patient warning (`adKarsilastir`). Never block, never auto-reject.
3. Masking failed / low confidence / timeout -> the document is NOT sent and the flow is NOT blocked: "Kimlik gizlenemedi,
   otomatik değerlendirilmedi"; it stays in Belgeler for manual evaluation (fallback checkbox lives only there). Never send unmasked.
   PDFs/audio have no pixel masking: unchanged (not auto-sent), evaluated manually from Belgeler.
4. Evaluation result goes into the note through ONE pure module, `core/belgeler/notaBlok.ts` (`notaBloklariUygula`), one write per
   batch: labelled block "— Belge değerlendirmesi (Ultrason 1/4, <date>) —" appended to Fizik Muayene / Bulgular (objektif), stable
   order (exam time if every image has it, else upload order). Idempotent per document id (invisible key in the heading); re-evaluation
   replaces its own block. Existing note values are never overwritten (discrepancy line instead). The UI banner sentence
   ("Yapay zekâ taslak rapor üretir...") is never inserted. Findings are joined cleanly, ICD codes stay on one line.
5. Server writes: `lib/doktor/belgeNotaYaz.ts` / `POST /api/doktor/belgeler/analiz/otomatik-ekle`; Ekler-step path: `sessions/end`.
6. Per-specialty differences are DATA only: `core/belgeler/router.ts` (modalities/persona) and `core/belgeler/belgeAkisi.ts`
   (section targets). `core/belgeler/belgeAkisi.test.ts` fails if any of the 40 branches opts out or a specialty forks the step.

Country versions: same flow, localized copy (`deidMetin.ts`, `BlokDili` in notaBlok). Turkey-only regulatory features exempt.
The manual "Asistan ile değerlendir" button remains only for re-evaluation and for failed/masking-fallback documents.
