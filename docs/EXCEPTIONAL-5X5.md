# EXCEPTIONAL-5×5 — Psik / Dahiliye / KBB yol haritası

**Bar (Boss 2026-09-19):** Her branşın çıkışı en az  
https://notya-ai.vercel.app/psik-exceptional-audit.html  
seviyesinde olmalı — aynı sprint paketi, aynı dürüst skor.

**Referans sprintler:** PSIK-EXCEPTIONAL-01 · DAH-EXCEPTIONAL-01 · KBB-EXCEPTIONAL-01  
(KD ayrı derin chapter; bu programın barı KD değil, **psik exceptional audit**.)

---

## Çıkış kriteri (psik-exceptional-audit.html aynası)

Her branş ship’te şunlar **zorunlu**:

| Metrik | Hedef |
|--------|--------|
| Honest wow | **~93%** (pre-sprint ~8–12% → post) |
| Domains Strong | **≥15–16** clinic domains Strong |
| Thin | **0** |
| Partial | yalnız **olgunluk** (`beta-hazir`; `uzman-dogrulandi` MD week pending) |
| Missing | yalnız **intentional OUT** (OR HIS, tanı auto-lock, canlı Medula, uydurma doz, …) |
| Specialty Araçlar | **N tile — sabit değil.** Kaç useful/gerekli ise o kadar (bazı branş 3, bazı 5+). Boş filler araç yok. · `BRANS_…` · foreign-branş omit test |
| Portal | unique Strong modül (hasta-safe; tanı/skor/doz sızmaz) |
| Home | sticky şerit + çok sekme bölüm UI |
| Engines | branşa özel motorlar (psik kalitesi; sayı branşa göre) |
| Intake | branşa özel acil kutuları |
| Migration | idempotent + RLS + izolasyon envanteri |
| SOAP | `prompts/soap-*.md` kilit |
| Docs | `docs/<SLUG>-MD-BETA.md` |
| Audits | `public/<slug>-presprint-audit.html` + `public/<slug>-exceptional-audit.html` |
| Tests | motor + portal + araçlar + `test:brans-sizmasi` yeşil |
| Olgunluk | `beta-hazir` |
| Deploy | commit + push main+dev + Vercel Ready + live exceptional audit URL |

**Audit HTML asla** `/doktor-tools` grid’ine bağlanmaz.

---

## Sprint ritüeli (aynı yol haritası — branş başına)

1. **Presprint audit** (~10% baseline) — honest inventory  
2. **EXCEPTIONAL-01 design** — useful Araç set (3–N) + portal adı + intentional OUT + game-changer motorlar  
3. **Build** — migration → profile/registry → engines → Home → API → N Araçlar → portal Strong → prompts → tests  
4. **Exceptional audit HTML** (~93%, ≥15–16 Strong pattern)  
5. **MD-BETA** checklist  
6. **Ship** — migration apply · push · Ready · Boss retest URL  

Ekonomi: ortak kabuk (AracKabugu, aracUi, audit HTML şablonu, portal wiring) yeniden kullanılır; branş başına yalnız klinik motorlar + etiketler + 5 araç içeriği yazılır.

---

## 5 dalga × 5 branş

Zaten psik-barında: Pediatri · Derm · Göz · Dahiliye · Psik · KBB.  
23 baseline + KD exceptional kilit (audit’i psik barına çek) + 1 deepen = 25.

### Dalga 1 — SHIPPED (2026-09-19)
kardiyoloji · noroloji · uroloji · gogus-hastaliklari · kadin-hastaliklari-dogum  
Live: kardio / noro / uroloji / gogus / kd `-exceptional-audit.html` · tip `731fef5`  
Araç counts: kardio 4 · noro 4 · üro 4 · göğüs 5 · KD 5 (mevcut) — sabit 5 yok.

### Dalga 2
aile-hekimligi · ortopedi · fizik-tedavi · spor-hekimligi · endokrinoloji

### Dalga 3
gastroenteroloji · nefroloji · romatoloji · enfeksiyon-hastaliklari · onkoloji

### Dalga 4
genel-cerrahi · plastik-cerrahi · cocuk-cerrahisi · gogus-cerrahisi · beyin-cerrahisi  
*(OR / full HIS = intentional Missing)*

### Dalga 5
acil-tip · anestezi · radyoloji · kalp-damar-cerrahisi · deepen (en ince prior → psik audit barı)

---

## Dalga 1 — psik paketine birebir eşleme (örnek)

Her biri için: useful N Araç · Home · portal Strong · ~93% exceptional audit.

| Branş | Araçlar (taslak — ship’te kırpılabilir/çoğaltılabilir) | Portal | Signature motors |
|-------|--------------------------------------------------------|--------|------------------|
| kardiyoloji | SCORE2 · HT/KKY izlem · SGK rapor · Kohort (± EKG köprü) | Kalbim | risk şeridi, ilaç izlem, acil göğüs ağrısı |
| noroloji | İnme/TIA bayrak · Migren · İlaç izlem · Kohort (± SGK) | Nörolojimm | acil triyaj, kontrol |
| uroloji | IPSS · PSA izlem · Hematuri/taş acil · Kohort | Ürolojimm | skor + izlem + acil |
| gogus-hastaliklari | CAT/mMRC · Astım-KOAH plan · Kohort (± inhaler/SGK) | Akciğerlerim | aksiyon planı, kontrol |
| KD | Mevcut Araç seti korunur; psik-audit formatına kilitle + Thin kapat | mevcut | post-exceptional audit HTML |

---

## Başarı tanımı (Boss)

Dalga bitti sayılır ancak her 5 branş için live:

`https://notya-ai.vercel.app/<slug>-exceptional-audit.html`

psik ile aynı dil: **~93% · ≥15–16 Strong · N useful Araç · Strong portal · beta-hazir · intentional Missing only.**
