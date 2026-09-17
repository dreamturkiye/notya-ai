# README_DAHILIYE — İç hastalıkları V1 (muayenehane dahiliye), NOTYA-DAH-01, 2026-09-16

**Goldens (ref_code, clinician "Kaynak" toggle only):** TIHUD2023 (TİHUD İç Hastalıkları 4. baskı) · HARRISON (20 TR) · TEMD_DM2026 · HT_UZLASI2025 (Türk Hipertansiyon Uzlaşı Raporu 2025) · TEMD_HT2022 · TEMD_LIPID (2021) · TEMD_TIROID2025 · TEMD_OBEZITE2024 · TEMD_OSTEO2025.
**Definition respected (TİHUD):** internist = chronic-disease manager + care coordinator. No hospitalist simulation.

## Locked rules in code
AI drafts; doctor locks tanı / evre / hedef KB / HbA1c hedef / LDL hedef / ilaç. Flag ≠ diagnosis. Never auto-start combination antihypertensives or insulin (the engine only names classes with "hekim dozu yazar"). No SCORE2 number (inputs only; no reviewed formula in repo). Kırılgan is a doctor checkbox and moves the Uzlaşı target bucket. eGFR/HbA1c/LDL/TSH/K/Hb come **only from the lab engine's approved rows** — no second parser, nothing invented; no CKD stage without creatinine.

## Modules (as built)
| # | Module | Rules encoded |
|---|---|---|
| 0 | Header chips | KB (red if not recorded today), HbA1c + Δ vs previous approved, LDL, eGFR, TSH, ilaç count (yellow ≥5 polifarmasi), red "!" on overdue task. Tabs Özet · HT · DM · Lipid · Tiroid · Check-up · İlaçlar · Sevk (Belgeler/Muayene are the existing tabs). Pregnant patient → banner "gebe — ilaçları gözden geçir"; obstetri tools never run here. |
| 1 | HT | Uzlaşı 2025 office classes (normal <120/80, artmış 120–139/80–89, HT ≥140/90, evre 1/2) and **targets by bucket** (18–79: 120–130/70–80, threshold ≥140/90 · ≥80: 130–140, ≥140 · kırılgan: 140–150, ≥160). HT counted "doğrulanmış" only with ≥2 elevated office readings or evre 2. Confirmed + untreated → **combo suggestion ACEi/ARB + KKB or + diuretic, doctor picks**; artmış → 3-month lifestyle task; **dirençli** (≥3 drugs incl. diuretic, off target — detected from hasta_ilaclar) → nefroloji sevk; sekonder HT checkbox → sevk note (no wizard). Başlangıç tetkik checklist → tasks. |
| 2 | DM | TEMD 2026: HbA1c task every 3 months off-goal / 6 at goal (doctor's goal, 7.0 note only); annual UACR+eGFR, göz dibi (auto **sevk to göz**), ayak, lipid as tasks when stale; eGFR<30 metformin / 30–44 dose / <20 SGLT2 warnings; class suggestions only; HbA1c ≥10 → "insülin gereksinimi değerlendir — asistan titrasyon yapmaz". Single glucose never diagnoses. |
| 3 | Lipid | LDL target is a doctor field (assistant says lower target "tartışılır", never locks 55/70); statin/ezetimib doctor; **ALT trend after statin start** from approved labs (>3×ÜSN → review; >1.5× → izlem); CK >1000 → stop; TG ≥500 → pancreatitis warning; yearly panel task when DM/HT/obezite. |
| 4 | Tiroid | TSH thresholds (>10 aşikâr, 4.5–10 subklinik, <0.1 baskılı → endokrin), 6–8 week TSH task after dose change, nodül → US belge → Asistana raporla + endokrin sevk (interventional out of office V1). |
| 5 | Check-up | Template (hemogram, glukoz, HbA1c, lipid, TSH, Kre/eGFR, ALT/AST, Na/K, EKG belge, CXR/batın US optional); interval chip 18–39: 1–2 yıl, ≥40: yıllık (doctor can silence); DXA reminder women ≥65 or early risk (TEMD_OSTEO2025). Flow: upload to Belgeler → Lab › Asistana raporla → Onayla → last muayene (existing lab engine). |
| 6 | İlaçlar | Reuses **hasta_ilaclar** (no fork); eGFR<30 text warnings for metformin / NSAİİ / DOAK / MRA / sülfonilüre — text only, not blocking; ≥5 active → polifarmasi. |
| 7 | Anemi/KC/böbrek | Reuse of lab raporla paragraphs (ferritin/B12/folat already canonical). |
| 8 | Red flags | Göğüs ağrısı + yeni EKG · K >6.0 · Hb <7 · eGFR drop >30% vs last · ateş + lökositoz → banner; **"acil / sevk" checkbox required** before proceeding; logged. |
| 9 | Sevk | kardiyoloji · endokrinoloji · nefroloji · gastroenteroloji · göğüs · göz · üroloji; short note + last approved lab panel attached. |
Shared: Belgeler image/lab/sound + Asistana raporla + Onayla; women's smear/mamografi due chips read from the jine task calendar (no duplicate engine).

## Data (migration 033)
dahiliye_ht (per-visit BP + engine draft + doctor evre/hedef) · dahiliye_dm · dahiliye_lipid · dahiliye_tiroid (one per patient) · dahiliye_checkup · dahiliye_gorevleri · sevkler · dahiliye_kirmizi. Reuse: hasta_ilaclar, lab_satirlar/lab_paneller (canonical_key/LOINC), belge_analizleri, muayene_revizyonlar.

## State machine
Lab/EKG/CXR → Belgeler (existing) → Asistana raporla → doctor edits → Onayla → last muayene (existing) → dahiliye cards read approved rows → engine draft (evre/plan/görev) → doctor locks (evre_hekim, hedef, ilaç sınıfı) → görevler + sevkler → next visit compares to prior approved rows (trend sentences from the lab engine). Kırmızı bayrak gate sits before Onayla via the Sevk tab checkbox.

## Files
`specialties/dahiliye/engines/dahiliye.ts` (5 test groups), API `/api/doktor/dahiliye` (adim kb | dm | lipid | tiroid | checkup | kirmizi | sevk | gorev; GET), UI `specialties/dahiliye/ui/DahiliyeHome.tsx` mounted as the "Dahiliye" tab (adult patients, doctor specialty dahiliye/aile/genel/yan dallar) in `lib/doktor/hastaDosyaSekmeleri.ts` + hasta dosyası page.

## Out of V1 (by ticket)
ICU/sepsis bundles, chemo, dialysis prescription, coronary protocol, full SCORE2, CGM, GLP-1 prior-auth, bariatric pathway, executive check-up sales package.

## Pre-wow audit
Shareable depth/gap report (before dahiliye wow sprint): [docs/README_DAHILIYE_AUDIT.md](./README_DAHILIYE_AUDIT.md) · https://notya-ai.vercel.app/dahiliye-presprint-audit.html

## DAH-WOW Wave 0–1 (2026-09-16)
- **Şerit**: sayfa üstünde sticky "BUGÜNKÜ VİZİT" (KB · HbA1c Δ · LDL · eGFR · gecikmiş) + 1-tap plan taslağı (kartlardan + gecikmiş görevlerden; nota yazmaz, kopyalanır).
- **KVR sekmesi**: ASKVH / DM+TOD / KBH kural kovası → LDL hedef önerisi → statin yoğunluk açığı; SCORE2 sayısal hesap `SCORE2_ONAYLI` doğrulamasına kadar kapalı. Kategori ve LDL hedefi hekim kilidi (`dahiliye_kart_kilitleri`).
- **KBH sekmesi**: KDIGO G×A (yalnız onaylı lab; UACR lab satırı yoksa hekim girişi), kronisite, hızlı düşüş, plan (RAS/SGLT2 sınıf), nefro sevk paketi (son panel eklenir).
- **Ev kayıt**: ev KB/glukoz/kilo; beyaz önlük / maskeli fenotip; hipoglisemi sayacı.
- **İzlem**: hasta_ilaclar → ilaç izlem görevleri (metformin B12/eGFR, ACEi/ARB K/Kre, statin ALT, levotiroksin TSH, warfarin INR, …).
- Prompts: `specialties/dahiliye/prompts/` (system lock, SOAP, tools).


## DAH-WOW Wave 1 kapanış — W1.4 (2026-09-16)
- **SGK rapor sekmesi**: HT / DM / statin / DOAK ilaç kullanım raporu taslağı aktif kartlardan (ofis KB serisi + hekim evresi; HbA1c serisi; LDL + KVR kilidi; endikasyon + CHA₂DS₂-VASc bileşenleri + INR geçmişi). Etken madde yalnız hasta_ilaclar'dan; eksik kanıt listesi + SUT kontrol listesi (hekim güncel metinle doğrular). Hekim onayı → `dahiliye_sgk_raporlari.durum=kilitli` + bugünkü nota satır. Yazdır/PDF ve e-Nabız/Medula zarfı (Tools › Hasta Raporları ile aynı `enabizSgkRapor`). Hasta adı ve T.C. saklanmaz. Migration 040.

## DAH-WOW Wave 2 — bakım döngüleri (2026-09-16)
Sekmeler artık gruplu: **Kronik** (Özet · HT · DM · DM döngü · Lipid · KVR · KBH · Tiroid) · **Döngüler** (Anemi · Obezite · Tarama/Aşı · İzlem · Ev kayıt · Ön anket) · **Belge** (Check-up · İlaçlar · SGK rapor · Sevk).
- **DM döngü**: yıllık FIB-4 (onaylı ALT/AST/Plt + yaş; ≥1,3 not, ≥2,67 gastro sevk), ayak foto → Belgeler görevi, SGLT2 / GLP-1 RA kardiyo-renal endikasyon bayrakları (KY, KBH, ASKVH, obezite), hipoglisemi riski (SU/insülin + ≥65 veya eGFR <45). Sınıf önerisi; doz/titrasyon yok.
- **Anemi**: Hb eşiği → MCV → ferritin / B12 / folat / retikülosit merdiveni; eksik test "sonraki test" olarak şeride; Hb <7 kırmızı; plan hekim kilidi.
- **Obezite**: VKİ + bel, TEMD basamağı, farmakoterapi sınıfları, bariatrik değerlendirme yalnız sevk, 3. ay %5 yanıt, ödeme onayı gerekçe metni.
- **Tarama/Aşı**: KETEM kolon/meme/serviks (kadında jine tarihleriyle ortak) + erişkin aşı takvimi (grip, pnömokok, zona, Td, HBV seroloji, COVID-19); due olanlar tek tıkla görevlere.
- **HT sekmesi**: 1-tık başlangıç paneli istemi; 14 günde onaylı sonuç gelmezse takip görevi.
- **Ön anket**: hasta Sağlığım › Takip › Muayene öncesi anket (PIN sonrası) — ev KB/glukoz/kilo `dahiliye_ev_kayitlari` (portal), uyum + semptom + sorular; alarm semptomu şeritte ⚑; "Subjektif'e ekle".
Migration 041. Server: `app/api/doktor/dahiliye/_wow2.ts`.
