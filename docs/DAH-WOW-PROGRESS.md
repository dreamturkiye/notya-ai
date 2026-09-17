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

## Wave 2 — care loops
- A6. Server helpers moved to `app/api/doktor/dahiliye/_ortak.ts`; Wave 2+ server logic in `_wow2.ts` (route.ts may only export handlers). `gununNotunaEkle` gained an optional `alan` (default değerlendirme) so the ön anket can append to Subjektif.
- A7. Live smoke against Supabase (service role, read-only) caught `belge_analizleri.created_at` → fixed to `olusturuldu`. DB currently has no approved lab rows, so data-path smoke is covered by unit tests only.
- W2.1 DM closed loop — DONE: `engines/dmLoop.ts` (FIB-4 1,3/2,67 + age caveats, SGLT2/GLP-1 RA kardiyo-renal flags for KY/KBH/ASKVH/obezite, hipoglisemi riski SU/insülin + ≥65 or eGFR<45, yıllık FIB-4 + ayak foto görevleri, gastro sevk), `tests/dmLoop.test.ts`; aşı due from W2.6; "DM döngü" tab.
- W2.2 Anemi ladder — DONE: `engines/anemi.ts` (WHO eşik, MCV morfoloji, ferritin <30 / <100 inflamasyon, Mentzer, B12/folat, retikülosit → hemoliz paneli, KBH anemisi, pansitopeni/ GİS kanama sevk, Hb<7 → şerit kırmızı), `tests/anemi.test.ts`, table `dahiliye_anemi`, plan hekim kilidi.
- W2.3 Obezite / GLP-1 — DONE: `engines/obezite.ts` (VKİ, bel, TEMD basamak, bariatrik değerlendirme = sevk only, 3. ay %5 yanıt, ödeme onayı gerekçe metni; SGK kapsamı hekim doğrular), `tests/obezite.test.ts`, table `dahiliye_obezite` (ofis kilo → ev_kayitlari).
- W2.4 KETEM tarama — DONE: `engines/tarama.ts` (kolon both sexes, meme, serviks, erkek PSA bilgi satırı), reads `kadin_sagligi` dates (jine) + `dahiliye_tarama`; GGK pozitif → gastro sevk; `tests/tarama.test.ts`.
- W2.5 HT panel order set + chase — DONE: `engines/htPanel.ts` (11 kalem, only approved rows after istem date count, EKG via belge_analizleri modality ekg, >14 gün → takip görevi), table `dahiliye_lab_istemleri`, HT tab button.
- W2.6 Erişkin aşı takvimi — DONE: `engines/asi.ts` (grip sezon, PCV20 or PCV13→PPSV23 with 8-week short interval for immunsup/asplenia/KBH, zona ≥50 2 doz, Td 10 yıl, HBV seroloji-first 0-1-6, COVID MoH), `tests/asi.test.ts`, tables `dahiliye_asilar` + `dahiliye_asi_profil`; due chips beside KETEM; "görevlere ekle" → dahiliye_gorevleri. No vaccine doses/amounts.
- W2.7 Muayene öncesi anket — DONE: `engines/anket.ts` (card-based symptom list, range validation, alarms → şerit kırmızı, SOAP Subjektif taslağı), portal API `app/api/portal/hasta/[token]/dahiliye-anket/route.ts` (PIN-gated, no-store client, 3/gün limit, 112 metni), portal page `on-anket` + Takip kısayolu, table `dahiliye_anketler`, doctor "Ön anket" tab + "Subjektif'e ekle". Closes W1.5 portal entry (ölçümler `dahiliye_ev_kayitlari` kaynak=portal).
- UI: DahiliyeHome tabs grouped Kronik / Döngüler / Belge (all visible; hasta dosyası › Dahiliye › sekme = 2 taps). Migration 041.
