# DAH-WOW progress (Claude, autonomous run from 2026-09-16)

Brief: `docs/DAH-WOW-BRIEF-v2.md`. One line per item: DONE / SKIPPED (why). Gate per wave: `npx tsc --noEmit` clean + `npm test` green + Vercel production Ready.

## Assumptions (recorded, no questions asked)
- A1. Tests: `package.json` test script already globs `specialties/dahiliye/tests/*.test.ts`; new test files are picked up by the glob (not appended again, to avoid running twice).
- A2. New tables enable RLS with no policies: all access is via the service-role client in `/api/doktor/dahiliye` (scoped by doctor_id/patient_id) or the PIN-gated portal API.
- A3. SUT article numbers are NOT cited from memory. SGK rapor kontrol lists say "SUT … hekim güncel metinle doğrular"; ref_code `SGK`.
- A4. Goldens extended in `engines/dahiliye.ts` Ref: TEMD_RAMAZAN · HSGM_HT2025 · HYP · KETEM · SGK (as in brief §1 and prompts/system.md).
- A5. "PDF" outputs = print-ready HTML + browser "PDF olarak kaydet" (no server PDF dependency added).

## Wave 1 (remaining)
- W1.1 şerit live — DONE (Wave 0+1 core, #268)
- W1.2 KVR / SCORE2 — DONE as rule bucket; SCORE2 numeric stays behind `SCORE2_ONAYLI=false` (not flipped). SCORE2-OP / SCORE2-Diabetes — SKIPPED (ledgered DAH-SCORE2-OP/DIABETES): published coefficient tables not available offline to cite verbatim in a source comment.
- W1.3 CKD KDIGO — DONE (#268)
- W1.4 SGK ilaç raporu şablonları — DONE: `engines/sgkRapor.ts` (HT/DM/statin/DOAK; etken madde only from hasta_ilaclar; labs only approved; CHA₂DS₂-VASc from hekim-ticked items; mekanik kapak blocks DOAK lock), `tests/sgkRapor.test.ts`, migration 040 `dahiliye_sgk_raporlari` (no name / no T.C. stored), adım `sgkrapor` + `sgkkilit`, "SGK rapor" tab (print, e-Nabız/Medula zarfı via `enabizSgkRapor`, hekim kimliği from Ayarlar › e-Reçete).
- W1.5 home logs — DONE hekim entry (#268); portal entry lands with W2.7.
- W1.6 ilaç izlem takvimi — DONE (#268)
