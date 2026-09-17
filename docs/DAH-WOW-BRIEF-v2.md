# NOTYA-DAH-WOW v2 — İç hastalıkları / dahiliye wow sprint (revised brief, 2026-09-16)

Supersedes the v1 brief (15 game changers, unordered). Same repo, same goldens, same LOCKED SAFETY block — copied verbatim in §1. What changed: dependency-ordered waves with a QA gate each, an explicit SCORE2 source spec, an objective "Strong" rubric, six additional game changers from how a private muayenehane dahiliye actually spends the day, and quality-of-care nudges folded into existing cards.

Audit baseline (main @ 2026-09-16): V1 = `specialties/dahiliye/engines/dahiliye.ts` (139 lines: kbSinifla, htDegerlendir, dmDegerlendir, lipidDegerlendir, tiroidDegerlendir, CHECKUP_SABLONU, ilacGuvenlik, kirmiziBayraklar, SEVK_HEDEFLERI), `ui/DahiliyeHome.tsx` (110 lines), 7 tables (033: dahiliye_ht/dm/lipid/tiroid/checkup/gorevleri/kirmizi + shared sevkler), one test file. Pre-wow audit: 2 Strong · 6 Partial · 5 Thin · 11 Missing. Nothing from v1 brief has started.

READ FIRST (unchanged): https://notya-ai.vercel.app/dahiliye-presprint-audit.html · docs/README_DAHILIYE.md · docs/README_DAHILIYE_AUDIT.md · docs/OPEN-COMMITMENTS.md (DAH-01/02/AUDIT/WOW) · specialties/dahiliye/* (extend V1, never rebuild) · twins: specialties/kadin-dogum/, specialties/dermatoloji/prompts/, Tools SGK rapor (pediatri).

## 1. LOCKED SAFETY (verbatim, never violate)
- AI drafts; hekim locks tanı / evre / hedef KB / HbA1c / LDL / ilaç / SCORE risk category.
- Flag ≠ diagnosis. No insulin titration. Drug classes + "hekim dozu yazar" — no invented mg from memory.
- Labs ONLY from approved lab engine rows. No CKD stage without creatinine. No fake SCORE2 — ONLY the reviewed table/coefficients committed in repo with Kaynak dipnot (§3, Wave 1).
- Internist = chronic-disease manager + care coordinator (TİHUD). No ICU/sepsis/chemo/dializ Rx/coronary protocol/CGM robotics/bariatric OR. Sevk-quality only for those.
- Gebe banner stays; obstetri tools never run in dahiliye.
- Check-up packages = self-pay UX (SGK won't reimburse campaigns).
- Goldens: TIHUD2023 · HARRISON · TEMD_DM2026 · HT_UZLASI2025 · TEMD_HT2022 · TEMD_LIPID · TEMD_TIROID2025 · TEMD_OBEZITE2024 · TEMD_OSTEO2025 · TEMD_RAMAZAN · MoH HSGM HT 2025 · HYP · KETEM · SGK. ref_code only behind the clinician Kaynak toggle; never book text.

## 2. "Strong" rubric (objective — the post-sprint audit may only flip a domain to Strong when all six hold)
1. Pure engine under `specialties/dahiliye/engines/<domain>.ts` with unit tests (`tests/<domain>.test.ts`, in `npm test`).
2. Table(s) via migration; rows scoped by doctor_id/patient_id; approved-lab rows are the only lab input.
3. UI surface on DahiliyeHome (card or wow tab) reachable in ≤ 2 taps from the hasta dosyası.
4. Kaynak dipnot on every suggestion (ref_code from §1 goldens).
5. One smoke-path screenshot in `public/dahiliye-post-sprint-audit.html` (real qa.test data, no PHI).
6. Hekim lock on every clinical output (tanı/evre/hedef/ilaç class) — no auto-commit to the note.

**Prompts rubric (non-clinical artifacts, e.g. the `prompts/` lock) — distinct from the six-criterion clinical rubric above.** Added 2026-09-17 (DAH-PROMPTS-LOCK). For a prompts-only artifact, criteria 1–2 (engine + tests, table) are N/A by design. No engine or table is invented to satisfy them. Such a row is Strong only when all four of these hold:
- **(a) Exists and complete:** `system.md` + `tools.ts` + `soap-*.md` (+ `asistan-ogrenme.md`) are present and non-empty, and every tool maps to a real API step.
- **(b) Reviewed against the goldens:** checked against the same goldens as elsewhere (TİHUD / Harrison / TEMD / Uzlaşı + §1 locked safety). ref_codes only, no book text reproduced.
- **(c) Wired at runtime:** the prompts are loaded on the actual dahiliye call paths (SOAP generation, asistan chat, voice, learning), with the exact call sites cited. A prompt file sitting unused in the repo does not count.
- **(d) Hekim lock language** (criterion 6) is present in `system.md`.

## 3. Build order — four waves, each = PR(s) + `npx tsc --noEmit` clean + `npm test` green + Vercel production Ready before the next wave starts. Claude audits at wave boundaries only.

### Wave 0 — foundation (everything downstream reads from these; do first)
- W0.1 **prompts/ system lock** (v1 #15): `specialties/dahiliye/prompts/system.md` + `tools.ts` + `soap-*.md` citing TİHUD/Harrison/TEMD/Uzlaşı by role — derm/jine twin.
- W0.2 **Reçete → hasta_ilaclar auto-update on the muayene** (v1 #3, DAH-02 core): no fork; İlaçlar tab + eGFR warnings refresh immediately; includes the renkli/e-reçete flows shipped 2026-09-16 (lib/doktor/receteRengi.ts, Ayarlar › e-Reçete).
- W0.3 **Kronik kart contract**: one shape every card implements — `{ girdi (approved labs + hasta), degerlendir(), plan taslağı, hekimKilit[], kaynak[] }` + a shared `dahiliye_kart_kilitleri` table (card, field, value, locked_at, doctor_id). Prevents 15 cards inventing 15 lock mechanisms.
- W0.4 **Sticky "bugünkü vizit" strip skeleton**: KB · HbA1c Δ · LDL · eGFR · overdue (lab/aşı/tarama/ilaç izlem) · 1-tap "bugünkü plan"; reads from cards as they land in later waves.

### Wave 1 — biggest daily time-save; pure math on labs we already approve
- W1.1 **Sticky strip live + 1-tap bugünkü plan** (pain #2).
- W1.2 **SCORE2 / SCORE2-OP / SCORE2-Diabetes** (v1 #2) — SOURCE SPEC: ESC 2021 SCORE2 and SCORE2-OP, **high-risk region calibration (Türkiye is in the ESC high-risk region)**; SCORE2-Diabetes (ESC 2023) for DM 40–69 instead of forcing every diabetic into very-high; very-high bucket WITHOUT score for ASKVH / DM+TOD / severe CKD (HYP + TEMD). Commit the published coefficient tables to `engines/score2.ts`; tests must reproduce at least three published worked examples per model; Kaynak dipnot on the card. Output: risk category + LDL target suggest (TEMD/ESC) + **statin-intensity-vs-target gap**; hekim locks category and target.
- W1.3 **CKD KDIGO heatmap** (v1 #6): eGFR × UACR from approved rows only; stage + risk color; printable nefro sevk pack with last panel; no stage without creatinine.
- W1.4 **SGK ilaç raporu şablonları from cards** (v1 #9, pain #5): HT / DM / statin / DOAK templates pre-filled from active cards, twin of Tools pediatri SGK rapor shell; e-rapor packet reuse.
- W1.5 **Home logs — one table, two cards** (v1 #4 + #10 merged): `dahiliye_ev_kayitlari` (tip: kb | glukoz | kilo | nabız; value; measured_at; source: portal | hekim). Portal entry + series charts on HT and DM cards; white-coat rule; adherence note; feeds confirmed-HT logic. No PHI in public HTML.
- W1.6 **İlaç izlem takvimi** (NEW): monitoring tasks generated from hasta_ilaclar rows — metformin → yıllık B12 + eGFR; ACEi/ARB/MRA start or dose change → K⁺/Cr 1–2 hafta; statin start → ALT (and CK if symptomatic); levotiroksin doz değişimi → TSH 6–8 hafta; warfarin → INR cadence; amiodaron → TSH/ALT 6 ay; lityum/methotrexate → flag to prescriber. Pure rules table in `engines/ilacIzlem.ts` with tests; tasks land in dahiliye_gorevleri and the strip's "overdue" chip.

### Wave 2 — care loops
- W2.1 **DM closed loop** (v1 #5): ayak foto → Belgeler; grip/pnömokok/HBV due; yearly FIB-4 from approved ALT/AST/Plt/yaş → ≥1.3 dahiliye note / ≥2.67 gastro sevk (HYP). Add: **SGLT2/GLP-1 cardio-renal indication flags** (ASKVH, HF, CKD per TEMD/HYP) and **hypoglycemia risk flag** (sulfonylurea in ≥65 or eGFR < 45). Class suggest only.
- W2.2 **Anemi workup ladder** (v1 #7): ferritin/B12/folat/retikülosit → next-test engine; hekim locks plan.
- W2.3 **Obezite / TEMD GLP-1 pathway** (v1 #8): VKİ card, TEMD ladder, prior-auth narrative, class suggest.
- W2.4 **KETEM tarama due engine** (matrix): kolon FOBT 50–70 q2y or kolonoskopi q10y (both sexes), meme mamografi 40–69 q2y, serviks HPV 30–65 q5y — reuse jine chips, add erkek rows.
- W2.5 **HT başlangıç panel order set + missed-lab chase** (matrix): one click → panel; chase task if not resulted in 14 days.
- W2.6 **Erişkin aşı takvimi engine** (NEW): grip yıllık; pnömokok PCV/PPSV sequence by yaş and kronik hastalık; zona ≥50; Tdap 10 yıl; HBV seronegatif; COVID per MoH — HYP-based rules, due chips beside KETEM, tasks in gorevleri.
- W2.7 **Muayene öncesi hasta anketi** (NEW, portal): home KB/glukoz/kilo, ilaç uyumu (missed doses), semptom checklist per active card, sorular hekime → pre-fills SOAP Subjektif and the strip before the patient sits down. Same table as W1.5 for measurements; `dahiliye_anketler` for the rest.

### Wave 3 — breadth cards
- W3.1 **HF NYHA + GDMT checklist** (v1 #12): ACEi/ARNI · BB · MRA · SGLT2 tick list; sevk kardiyoloji triggers; no ICU.
- W3.2 **Antikoagülan kartı** (NEW): warfarin INR series + TTR; DOAK class check vs eGFR/yaş/kilo (class + "hekim dozu yazar"); bleeding-risk flags (HAS-BLED items as checklist, not a score claim); ties to W1.6 INR cadence.
- W3.3 **COPD / astım inhaler + spirometri belge** (v1 #13).
- W3.4 **Office GI mini** (v1 #11): GERD/IBS fast cards + NAFLD FIB-4 shared with W2.1; **H. pylori TR eradication** (bizmutlu dörtlü 14 gün, kontrol testi 4 hafta sonra, PPI kesildikten 2 hafta sonra) as class-level draft.
- W3.5 **EKG 1-tap TR rapor templates** (v1 #14): acil flags feed existing kırmızı gate.
- W3.6 **Tiroid deepen to Strong**: TI-RADS-style tarif via Belgeler, follow-up tasks; interventional stays sevk.
- W3.7 **Ramazan DM/HT rehberi** (NEW, TEMD_RAMAZAN): risk tier (düşük/orta/yüksek/çok yüksek) from active DM/HT card, ilaç/insülin zamanlama guidance as hekim-locked draft, hasta bilgilendirme yaprağı; seasonal toggle.
- W3.8 **Check-up package ledger + final merge report PDF** (v1 #1) — LAST on purpose: SKUs by yaş/cinsiyet, self-pay flag, panel/EKG/US tracked vs package, 1-tap merge PDF from approved labs + Belgeler + every card's locked summary.

### Wave 4 — close
- W4.1 **Kronik kohort paneli** (NEW): registry across the doctor's patients — HbA1c > 9, KB hedef dışı, LDL hedef dışı, eGFR < 45, overdue lab/aşı/tarama/ilaç izlem, no visit > 6 ay; 1-tap recall message via existing portal/Ayşe channel. Reads only card tables; no new clinical logic.
- W4.2 Quality nudges on every card: ≥65 → frailty + falls screen prompt; PHQ-2 prompt on chronic cards (HYP); HT strip shows measurement-technique checklist before "kontrolsüz" is declared.
- W4.3 Post-sprint audit HTML `public/dahiliye-post-sprint-audit.html` (KD chrome) flipping domains to Strong ONLY per §2; link from Araçlar; README_DAHILIYE + OPEN-COMMITMENTS (DAH-02 + DAH-WOW SHIPPED per wave); first real patient smoke path documented: KB → lab → raporla → Onayla → cards → SCORE/CKD/check-up.

## 4. Coverage domains that must be Strong at the end (rubric §2)
HT · DM · Lipid · Tiroid · Check-up · İlaç güvenliği (+ izlem takvimi) · Lab/Belgeler · Kırmızı+sevk · SCORE2/KVR · CKD · Anemi · Obezite/GLP-1 · HF/GDMT · Antikoagülan · Office GI · COPD/astım · Kanser tarama · Aşı takvimi · SGK rapor/e-reçete native · Portal home logs + ön anket · Kohort paneli · prompts/ lock.

## 5. Recorded for the NEXT sprint (ledger DAH-WOW-NEXT; do not build now)
Yaşlı polifarmasi deprescribing (STOPP/START) · hasta hedef kartı + Turkish eğitim yaprakları per condition · sigara bırakma paketi (ALO 171, SGK-reimbursed varenicline/bupropion rapor) · Vit D / B12 eksikliği with SGK rapor kuralları · e-Nabız geçmiş PDF → Belgeler import · gut/ürik asit card · osteoporoz DXA T-skoru card (TEMD_OSTEO, dxaGorevi exists).

## 6. Engineering shape (unchanged + additions)
Pure engines under `specialties/dahiliye/engines/*` with tests · `/api/doktor/dahiliye` adımlar extended or sibling routes · extend DahiliyeHome (never destroy V1 cards) · migrations per wave (039+: kart_kilitleri, ev_kayitlari, anketler, score2, ckd, anemi, obezite, hf, antikoagulan, gi, pulm, checkup_paketleri, ilac_izlem) · reuse hasta_ilaclar, lab_satirlar, belge_analizleri, sevkler, jine due chips, Tools SGK rapor shell, Belgeler vision, Ayarlar › e-Reçete · every new server-side Supabase client via the shared no-store client (guard test enforces) · commit style feat(dahiliye)/docs(dahiliye) · push main, keep origin/dev in sync · verify https://notya-ai.vercel.app Ready before claiming a wave done.

OUT OF SCOPE (sevk-only, never faked): ICU/sepsis bundles, chemo, dializ prescription, coronary cath protocol, CGM device stack, bariatric OR pathway, FRAX (licensed).

START WITH WAVE 0. Do not start Wave N+1 until Wave N's gate is green and Claude has audited it.
