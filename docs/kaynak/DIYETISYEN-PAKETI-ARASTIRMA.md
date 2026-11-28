# Diyetisyen package — research note and source register (BRANS-PAKETI, 2026-11-27)

Order follows CLAUDE.md "what Turkish doctors use": Turkish law / regulator → Turkish societies → the international
guideline Turkish clinicians actually use (latest edition) → textbooks. Everything below was read in this session unless
marked **NOT CONFIRMED**. Source ids are the ones used in code (`kaynaklar: [...]`).

**2026-11-28:** every NOT CONFIRMED source below was verified — results, corrections and the list still NOT REACHABLE
ONLINE are in **§ Source verification** at the end; the status column below is the pre-verification state.

## Legal scope of the dietitian in Türkiye
- **YONETMELIK-2014** — Sağlık Meslek Mensupları ile Sağlık Hizmetlerinde Çalışan Diğer Meslek Mensuplarının İş ve Görev
  Tanımlarına Dair Yönetmelik, RG 22.05.2014 / 29007, Ek-2 "Diyetisyen" (read via a university mirror of the RG text):
  energy / nutrient needs and healthy-eating programmes; **diet therapy planned, applied and followed "hekimin
  yönlendirmesine göre"**; malnutrition prevention and reporting to the physician; enteral / parenteral participation;
  food service duties. Consequence in code: the physician's diagnosis is required for every diagnosis-bound template
  (`taniSablonuCikti` → `taniReferansi` lock); the dietitian never diagnoses, never writes a drug or supplement dose.
- Amendments checked: 20.11.2021 (anaesthesia / imaging / emergency technicians, biomedical engineer, gerontologist) and
  06.09.2025 (anaesthesia technician, dental prosthesis, mammography / nurse-aide / midwife-aide repealed, health-care
  technician, nuclear-medicine technician) — **neither changes the diyetisyen text** (checked: alomaliye.com copy of the
  06.09.2025 RG; memurlar.net for 2021). The RG page itself (resmigazete.gov.tr) could not be fetched by the tool.
- The existing repo lock `MUTTEFIK_TANI_KILIT` (allied professions: no diagnosis, no tests, written consent) is kept.
- **Türkiye Diyetisyenler Derneği practice guidance — NOT CONFIRMED** (no current practice document found in this session).

## Food groups and plate
- **TUBER-2022** — Türkiye Beslenme Rehberi (TÜBER) 2022, T.C. Sağlık Bakanlığı HSGM, Yayın No 1031, Ankara
  (hsgm.saglik.gov.tr PDF, read). Groups used for the shopping list: Süt ve ürünleri; Et, yumurta, kurubaklagiller;
  Taze sebze; Taze meyve; Ekmek ve tahıllar; Yağlar; Şekerler (+ "Diğer" for unclassified items). Olives / nuts are put
  with fats as in the Turkish exchange lists dietitians use — a dietitian-facing grouping choice, shown on the plan
  preview. Tabağım plate lines are a generic balanced-plate description the dietitian reviews/edits before acceptance.

## Obesity, waist, loss rate, eating disorders, HOMA-IR (TEMD)
- **TEMD-OBEZITE-2024** — TEMD Obezite Tanı ve Tedavi Kılavuzu 2024, 11. baskı (çevrimiçi), Kasım 2024 (file.temd.org.tr, read):
  - § 1.5 bel çevresi: Türkiye'de abdominal obezite eşiği **kadın ≥ 90 cm, erkek ≥ 100 cm** → `BEL_ESIGI`.
  - § 6.1.1: "haftada 0,5–1,0 kg ağırlık kaybı", "günlük enerji ihtiyacı 500–1000 kcal kadar azaltılarak" →
    `guvenliKayip`; protein enerjinin ~%12–15'i, her öğünde.
  - Değerlendirme (TEMD önerisi, Kanıt A): "**Yeme bozuklukları ve depresyon her obezite hastasında mutlaka incelenmeli**"
    → SCOFF module in the diyetisyen package.
  - § 5.6 laboratuvar: "**İnsülin ve İnsülin Direnci ölçümünün tanı, tedavi planı ve takip açısından yararı yoktur.**"
    → **HOMA-IR is omitted** from the lab panel and the longevity biomarkers (no computed index anywhere); a fasting
    insulin the physician did order is shown as recorded, like any result. The insulin-resistance template states it.
  - MASLD bölümü: "fruktozdan fakir hipokalorik diyet"; makro oran değişikliğinin kalori azaltımının ötesinde ek yararı
    gösterilmemiş → MASLD template.
- Bel/boy oranı ≥ 0,5: international support (Ashwell & Gibson, BMJ Open 2016); TEMD sets no WHtR cut-off — labelled as such.
- Energy: Mifflin–St Jeor (Am J Clin Nutr 1990;51:241-7), equation printed on screen; activity factor chosen by the dietitian.
- The "1000 kcal açık REE altına iner" line is a plain consistency check, **not** a cited floor.

## Thyroid
- **TEMD-TIROID-2025** — TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu, 8. baskı Nisan 2025 (read): Tablo 1.3 — T4
  absorption reduced by kalsiyum karbonat, demir sülfat, omeprazol / lansoprazol, kolestiramin, sukralfat…
  The administration timing text of the hypothyroidism chapter was beyond what the tool could read — **NOT CONFIRMED**.
- **TITCK-KUB-LT4** — TİTCK-approved KÜB, Euthyrox 25 mcg (2020): "sabahları aç karnına, kahvaltıdan yarım saat önce";
  kalsiyum ve demir tuzlarıyla **en az 2 saat** ara; soya emilimi azaltabilir. → `levotiroksinGunPlani` (+30 min, +2 h).
- Coffee: not in the KÜB; UCLA Endocrine Center patient guidance says wait 60 min → shown as "en az 30–60 dakika"
  (international support, no Turkish figure). Gluten-free diet / selenium: deliberately not in the template.

## PCOS
- **PCOS-2023** — 2023 International Evidence-based Guideline for the Assessment and Management of PCOS (Teede et al.;
  summary MJA 2024;221(7), read via insightplus.mja.com.au): healthy eating + physical activity recommended (benefit
  even without weight loss), **no specific diet type** named, awareness of weight stigma, screening for depression,
  anxiety and in some cases eating disorders. Full text on PMC/PubMed was behind a browser check — quoted from the summary.

## Diabetes, GLP-1, metformin
- **ADA-SOC-2026** — ADA Standards of Care in Diabetes 2026 (already in the registry `ada-soc-2026`; secondary summary read):
  8.14 counselling/monitoring so people losing weight get adequate protein and micronutrients; 5.23 avoid protein
  insufficiency; 3.4 Mediterranean / low-carbohydrate patterns. **Metformin–B12**: the long-standing Section 9
  recommendation on periodic B12 measurement — the 2026 recommendation number **NOT CONFIRMED** in this session.
- **TEMD-DIYABET** — TEMD diabetes guide: Turkish first source for T2DM; **edition / text NOT CONFIRMED** in this session
  (referenced, not quoted). Same for **TEMD-DISLIPIDEMI**. **ESC-DISLIPIDEMI** = registry `esc-dislipidemi-2019`.
- **GLP1-ORTAK-2025** — "Nutritional Priorities to Support GLP-1 Therapy for Obesity", joint advisory ACLM / ASN / OMA /
  TOS, 30 May 2025 (Am J Lifestyle Med, Am J Clin Nutr, Obesity Pillars, Obesity; obesity.org page read): adequate protein
  + strength training to preserve lean mass, GI side-effect management, micronutrient sufficiency. The advisory page
  gives **no numeric protein target** → the target is set by the dietitian per patient (`proteinHedefG`).
  Severe / back-radiating abdominal pain as an urgent sign: GLP-1 RA product labelling (pancreatitis warning) — acil flag.
- **Current Turkish practice around GLP-1 RA users — NOT CONFIRMED**: no Turkish society nutrition position for GLP-1
  users was found in this session; TEMD Obezite 2024 § 6.4.2 covers the drugs' dosing (not nutrition).

## Gestational diabetes
- **SB-DOGUM-ONCESI** — T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi (2018 edition listed on the WHO policy
  platform). Screening / diagnosis are the obstetrician's under the SB protocol; the template only says so. **A newer SB
  edition and its exact OGTT text NOT CONFIRMED** in this session. PUDER pregnancy-diabetes guide exists (TR Dizin) — not read.

## Eating-disorder screening
- **SCOFF-TR** — SCOFF (Morgan, Reid & Lacey, BMJ 1999;319:1467; ≥ 2 = positive). Turkish validation: Aydemir Ö, Köksal B,
  Yalın Sapmaz Ş, Yüceyar H — Turkish form of the SCOFF, Anadolu Psikiyatri Dergisi (ISSN 1302-6631): n = 50 female
  medical students, Cronbach α 0,74, one factor, r = 0,52 with EAT. No separate Turkish cut-off reported → original ≥ 2.
  **The exact published Turkish item wording could not be retrieved**: the five items in code are a faithful translation,
  delivered as part of the module template the dietitian accepts (edit once — wording can be aligned to the published
  form; item count is locked). Patient never sees a score; positive → professional alert (`paket-tarama:*`, hidden from
  the patient's Bugün), same thank-you text for everyone.

## What is NOT done (by design)
No calorie counter, no automated food recognition (cost zero, Kaan's scope), no supplement or drug dose anywhere, no
HOMA-IR, no gamification of weight (bransAyari `oyunDisi: ['kilo','bel']` keeps weight/waist out of streak, badges, karne).

## Source verification (Claude, 2026-11-27/28 — Kaan "Bunları doğrula"; WebSearch + WebFetch only)

| Item | Result | Source · edition · URL (read) | Finding | Change |
|---|---|---|---|---|
| TEMD-TIROID-2025 timing text | CONFIRMED (+ correction) | TEMD *Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu*, 8. Baskı Nisan 2025, ISBN 978-625-95378-1-8 — https://file.temd.org.tr/Uploads/publications/guides/documents/tiroid2025_11042025.pdf (2026-11-28) | Bölüm 7 p. 91: LT4 "öğünden en az 30 dakika önce bir miktar su ile"; bedtime 3–4 h after the last meal; iron / calcium "en az 4 saat ara" | Turkish society text is stricter than the KÜB (2 h) and satisfies it → **4 h** in `ilacBesin.ts` (+240 min), diyet-tiroid note, sablonlar.ts; test updated. Registry `dernek-temd-tiroid` |
| TEMD-DIYABET | NEWER EDITION INDICATED (2026) — NOT REACHABLE ONLINE | KLİMİK talk (June 2026) cites the TEMD DM guide "2026" | Not read; nothing in the diyetisyen templates quotes it | none |
| TEMD-DISLIPIDEMI | NOT FOUND (no current TEMD lipid guide surfaced; ESC/EAS 2019 + 2025 focused update is in the registry) | — | — | none |
| SB-DOGUM-ONCESI (GDM) | CONFIRMED for 2018 · 2026 edition listed, NOT REACHABLE | SB *Doğum Öncesi Bakım Yönetim Rehberi* 2018, Yayın No 925 (WHO copy) — https://platform.who.int/docs/default-source/mca-documents/policy-documents/guideline/TUR-MN-21-01-GUIDELINE-2018-tur-Antenatal-Care-Management-Guidelines.pdf | 50 g screen at 24–28 w (p. 20); 75 g OGTT for risk groups / after a positive screen, repeat at 24–28 w if first negative (p. 13). PUDER guide not read | none (template only says screening is the obstetrician's) |
| ADA-SOC-2026 metformin–B12 recommendation number | NOT CONFIRMED (number) | ADA SoC 2026 (registry `ada-soc-2026`); the PMC section pages found were the Introduction only | International; wording in code cites "Bölüm 9" without a number — unchanged | none |
| GLP-1 Turkish practice | NOT FOUND (no Turkish society nutrition position for GLP-1 RA users) | — | Joint ACLM/ASN/OMA/TOS advisory 2025 stays, labelled international | none |
| Türkiye Diyetisyenler Derneği practice guidance | NOT FOUND | searches returned course material and the 2014 Yönetmelik only | Legal scope stays on YONETMELIK-2014 | none |
| SCOFF-TR | CITATION CONFIRMED · Turkish items NOT REACHABLE ONLINE | Aydemir Ö, Köksal B, Yalın Sapmaz Ş, Yüceyar H. "Kadın üniversite öğrencilerinde **REZZY** Yeme Bozuklukları Ölçeği Türkçe formunun güvenilirlik ve geçerliliği", Anadolu Psikiyatri Derg 2015;16(Özel Sayı 1):31–35, doi:10.5455/apd.174219 (citation as printed in https://dergipark.org.tr/en/pub/bujss/article/956702 and https://dergipark.org.tr/en/download/article-file/1840295) | Turkish name of the form is **REZZY**; scoring "her 'evet' yanıtı için 1 puan", ≥ 2 = risk group, max 5 — matches the code. The five published Turkish items were not printed in any reachable source (journal full text not online; thesis appendices truncated: Gedik, Acıbadem, Başkent open-access theses tried) | Code comment corrected (`specialties/diyetisyen/engines/tarama.ts`); items unchanged — align word for word in the Chrome pass |
