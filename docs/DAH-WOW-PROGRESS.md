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

## Wave 3 — breadth cards
- A8. Structural DB smoke (read-only, service role) for `_wow2` + `_wow3` passed with no PostgREST errors.
- A9. DOAK: labeling "azaltılmış doz kriterleri" are flagged as text only (no mg); HAS-BLED shown as a checklist with no total score (brief). CHA₂DS₂-VASc total is computed only inside the SGK DOAK rapor from hekim-ticked components.
- A10. Ramazan tiers follow TEMD Ramazan / IDF-DAR categories as rule buckets (no IDF-DAR 2021 point calculator — point weights not cited from memory); insulin guidance is "hekim düzenler" with no % or unit numbers (test enforces).
- A11. TI-RADS: ACR TI-RADS points and size thresholds encoded as "TI-RADS tarzı tarif" (TEMD_TIROID2025 dipnot); İİAB/ablation = endokrin sevki only.
- W3.1 HF NYHA + GDMT — DONE: `engines/hf.ts` (EF kategori, 4 sütun from hasta_ilaclar, K/eGFR/nabız/SBP/NSAİİ/ndhp-KKB/TZD uyarıları, 3 günde >2 kg, NT-proBNP >%30, kardiyoloji sevk: NYHA III–IV, EF ≤35, yatış, EF bilinmiyor), `tests/hf.test.ts`, table `dahiliye_hf`, "KY" tab.
- W3.2 Antikoagülan kartı — DONE: `engines/antikoagulan.ts` (Rosendaal TTR, INR kontrol aralığı 1/2/4 hafta, INR ≥9 kırmızı, Cockcroft-Gault, DOAK uygunluk, mekanik kapak + DOAK kırmızı, HAS-BLED checklist, etkileşimler), `tests/antikoagulan.test.ts`, table `dahiliye_antikoagulan`, INR görevi → dahiliye_gorevleri (W1.6 ile hizalı).
- W3.3 KOAH / astım — DONE: `engines/pulm.ts` (FEV1/FVC, BD yanıtı, GOLD 1–4, ABE, eozinofil ≥300 ICS, astım 4-soru kontrolü, SABA-only uyarı, inhaler teknik checklist, spirometri görevi, sevk), table `dahiliye_pulm`, "Solunum" tab.
- W3.4 Office GI — DONE: `engines/gi.ts` (GÖRH alarm/≥60 → endoskopi, PPI 8 hafta sınıf; İBS Roma IV + alarm; MASLD FIB-4 shared from dmLoop; H. pylori bizmutlu dörtlü 14 gün class-level, kontrol testi max(bitiş+28, PPI kesim+14) + görev), `tests/pulmGi.test.ts`, table `dahiliye_gi`.
- W3.5 EKG 1-tap templates — DONE: `engines/ekg.ts` (6 şablon, QTc Bazett/Fridericia, acil: STE, yeni LBBB+GA, VT, Mobitz II/tam blok, <40/>150, QTc >500, preeksitasyon+AF, GA+STD), acil → 409 unless "acil / sevk" onayı, logged to `dahiliye_kirmizi`; hekim onayı → nota; table `dahiliye_ekg`.
- W3.6 Tiroid deepen — DONE: `engines/tiroidNodul.ts` + `tests/ekgNodul.test.ts`; table `dahiliye_tiroid_nodul` (multiple nodules), US izlem görevleri, endokrin sevki with tarif, low TSH → sintigrafi notu; rendered under Tiroid tab. Tiroid V1 card unchanged.
- W3.7 Ramazan DM/HT — DONE: `engines/ramazan.ts` (4 kademe, oruç önerisi, sınıf düzeyi zamanlama, oruç bozma <70 / >300, hasta yaprağı yazdır), table `dahiliye_ramazan` (yil + aktif = seasonal toggle), risk hekim kilidi.
- W3.8 Check-up ledger + merge report — DONE: `engines/checkupPaket.ts` (5 SKU by yaş/cinsiyet, self-pay enforced by DB check `odeme='kendi_odemeli'`, kalem completion only from approved labs / belge_analizleri after package date or hekim tick, birleşik rapor sections: onaylı lab + onaylı belge özetleri + kart kilitleri, TASLAK stamp until hekim kilidi), `tests/ramazanCheckup.test.ts`, table `dahiliye_checkup_paketleri`, print/PDF; rendered under Check-up tab (V1 check-up card untouched).
- Migration 042. Server `app/api/doktor/dahiliye/_wow3.ts`; UI `specialties/dahiliye/ui/DahiliyeWow3.tsx`; new "Kartlar" tab group.
