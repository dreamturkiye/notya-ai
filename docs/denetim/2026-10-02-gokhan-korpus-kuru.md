# Dr. Gökhan complaint corpus — regression run (2026-10-02)

**DRY RUN — a stand-in answered instead of the model. The live run against Luna was NOT done.**

What this run does prove: the harness, the corpus loader, the assertions, and every turn that a MODEL-FREE handler answered (identity, calendar, count, record tables, quick card, scope gate, chart open) — those answers are the product's own and are graded in full. What it cannot say anything about: any answer the model writes. Those turns are "not judged" unless something structural failed (route, forced tool, card, bound patient).

Corpus: 436 entries, 888 graded turns (an entry is graded once per surface it lists). Voice = `/api/asistan/fish-tur` with the transcript given as text: Fish ASR, TTS and turn-taking are not exercised.

## Summary

| surface | turns | PASS | FAIL | MANUAL | not judged |
|---|---|---|---|---|---|
| chat | 431 | 256 | **18** | 11 | 146 |
| panel | 21 | 5 | 0 | 0 | 16 |
| voice | 436 | 258 | **20** | 13 | 145 |

Total: 888 turns — 519 PASS, 38 FAIL, 24 MANUAL, 307 not judged (stand-in).

### By source

| source | turns | PASS | FAIL | MANUAL | not judged |
|---|---|---|---|---|---|
| docs/ayse-capability-regression-audit.md | 62 | 42 | 0 | 0 | 20 |
| docs/AYSE-KALITE-STANDARDI.md | 38 | 2 | **12** | 2 | 22 |
| docs/denetim/2026-09-26-qa-sentetik-bebek.md | 32 | 0 | 0 | 0 | 32 |
| docs/denetim/2026-10-02-ayse-eylem.md | 66 | 60 | 0 | 0 | 6 |
| docs/OPEN-COMMITMENTS.md | 378 | 227 | **22** | 10 | 119 |
| docs/qa/gokhan-gunluk-sorular.md | 133 | 75 | **7** | 14 | 37 |
| docs/qa/gokhan-yetenek-talepleri.md | 28 | 28 | 0 | 0 | 0 |
| lib/asistan/aktifHastaPratik.test.ts | 8 | 8 | 0 | 0 | 0 |
| lib/asistan/ayseRota.test.ts | 66 | 40 | **2** | 0 | 24 |
| lib/asistan/dosyaSorgu/denetim.test.ts | 6 | 6 | 0 | 0 | 0 |
| lib/asistan/kapsamKilidi.test.ts | 2 | 2 | 0 | 0 | 0 |
| lib/asistan/vizitOlcumSahne.test.ts | 19 | 17 | 0 | 0 | 2 |
| lib/doktor/hastaCozumleyici.test.ts | 10 | 2 | 0 | 0 | 8 |
| lib/doktor/pratikAnaliz.test.ts | 2 | 0 | 0 | 0 | 2 |
| lib/doktor/sesliSoz.test.ts | 10 | 8 | 0 | 0 | 2 |
| scripts/ayse-denetim/sorular-100.json | 206 | 106 | **11** | 4 | 85 |
| scripts/ayse-denetim/sorular-canli-0930.json | 12 | 12 | 0 | 0 | 0 |
| scripts/ayse-denetim/sorular-takip.json | 202 | 124 | **6** | 0 | 72 |

A turn is counted under every source file it cites, so the rows add up to more than the total.

### By category

| category | turns | PASS | FAIL | MANUAL | not judged |
|---|---|---|---|---|---|
| asi | 40 | 18 | 0 | 0 | 22 |
| dosya | 54 | 38 | **4** | 4 | 8 |
| eylem | 72 | 60 | 0 | 1 | 11 |
| hasta-cozum | 68 | 40 | 0 | 4 | 24 |
| ilac | 32 | 8 | 0 | 0 | 24 |
| ilk10 | 90 | 0 | 0 | 2 | 88 |
| izolasyon | 6 | 4 | 0 | 0 | 2 |
| kapsam | 44 | 44 | 0 | 0 | 0 |
| kimlik | 20 | 20 | 0 | 0 | 0 |
| lab | 30 | 0 | **1** | 4 | 25 |
| liste | 34 | 24 | **8** | 2 | 0 |
| muayene | 34 | 10 | **1** | 0 | 23 |
| olcum | 81 | 61 | **12** | 2 | 6 |
| sayim | 32 | 14 | **2** | 0 | 16 |
| ses | 8 | 4 | 0 | 1 | 3 |
| sohbet | 20 | 20 | 0 | 0 | 0 |
| takip | 141 | 84 | **8** | 0 | 49 |
| takvim | 72 | 70 | **2** | 0 | 0 |
| uygulama | 10 | 0 | 0 | 4 | 6 |

### By route that answered

| route | turns | PASS | FAIL | MANUAL | not judged |
|---|---|---|---|---|---|
| (yok) | 1 | 0 | 0 | 1 | 0 |
| arama | 58 | 52 | **4** | 2 | 0 |
| dosya-ac | 22 | 22 | 0 | 0 | 0 |
| gurultu | 2 | 2 | 0 | 0 | 0 |
| hizli-kart | 128 | 116 | **8** | 4 | 0 |
| kapsam | 22 | 22 | 0 | 0 | 0 |
| kayit | 83 | 67 | **16** | 0 | 0 |
| kimlik | 22 | 20 | **2** | 0 | 0 |
| model | 410 | 100 | **2** | 17 | 291 |
| oku | 3 | 1 | **2** | 0 | 0 |
| panel | 21 | 5 | 0 | 0 | 16 |
| takvim | 116 | 112 | **4** | 0 | 0 |

## Quality — measured against docs/AYSE-KALITE-STANDARDI.md

**Stand-in run: only the checks that need no model answer are comparable.** 457 of 888 turns were answered by a model-free handler and are judged; the other 431 were written by the stand-in and have no verdict. The numbers below say nothing about İlk-10 answers, summaries or anything else the model writes — the live pass measures those.

Quality score: **98** (5373 of 5481 verdicts passed). A verdict is one mechanical check applied to one answer; the checks measure form and wording, not whether a value is true.

### By rule

| rule | | verdicts | pass | fail | pass rate |
|---|---|---|---|---|---|
| Q-01 | Answer first | 433 | 433 | 0 | 100.0% |
| Q-02 | Specific | 59 | 37 | **22** | 62.7% |
| Q-03 | Source versus interpretation | — | — | — | no answer of this run was subject to it |
| Q-04 | Planned is not given | 433 | 433 | 0 | 100.0% |
| Q-05 | Never invent | — | — | — | not checked by the rubric |
| Q-06 | Dates | 220 | 204 | **16** | 92.7% |
| Q-07 | Right patient | 637 | 637 | 0 | 100.0% |
| Q-08 | Paediatrics | — | — | — | no answer of this run was subject to it |
| Q-09 | Safety first, without alarm | — | — | — | no answer of this run was subject to it |
| Q-10 | Privacy | — | — | — | not checked by the rubric |
| Q-11 | Tone | 1732 | 1732 | 0 | 100.0% |
| Q-20 | Length | 204 | 194 | **10** | 95.1% |
| Q-21 | Structure by question | — | — | — | no answer of this run was subject to it |
| Q-30 | The doctor must hear the answer | 432 | 426 | **6** | 98.6% |
| Q-31 | Speakable | 876 | 822 | **54** | 93.8% |
| Q-32 | Never silent | 455 | 455 | 0 | 100.0% |
| Q-33 | Latency budgets | — | — | — | not checked by the rubric |
| Q-40 | The corpus only grows | — | — | — | not checked by the rubric |
| Q-41 | Release gate | — | — | — | not checked by the rubric |

### By check

| check | verdicts | pass | fail | pass rate |
|---|---|---|---|---|
| Q-11 `bos-savusturma` | 433 | 433 | 0 | 100.0% |
| Q-01 `cevap-once` | 433 | 433 | 0 | 100.0% |
| Q-11 `ham-artik` | 433 | 433 | 0 | 100.0% |
| Q-07 `hasta-adi` | 204 | 204 | 0 | 100.0% |
| Q-20 `seri-tablo` | 28 | 28 | 0 | 100.0% |
| Q-30 `ses-anlati` | 216 | 216 | 0 | 100.0% |
| Q-31 `ses-bicim` | 219 | 219 | 0 | 100.0% |
| Q-31 `ses-birim` | 219 | 201 | **18** | 91.8% |
| Q-31 `ses-kimlik` | 219 | 219 | 0 | 100.0% |
| Q-31 `ses-tarih` | 219 | 183 | **36** | 83.6% |
| Q-30 `ses-uzunluk` | 216 | 210 | **6** | 97.2% |
| Q-32 `sessiz-degil` | 455 | 455 | 0 | 100.0% |
| Q-06 `takip-bugun` | 16 | 0 | **16** | 0.0% |
| Q-06 `tam-tarih` | 204 | 204 | 0 | 100.0% |
| Q-02 `tek-olcum` | 59 | 37 | **22** | 62.7% |
| Q-11 `turkce` | 433 | 433 | 0 | 100.0% |
| Q-20 `uzunluk` | 176 | 166 | **10** | 94.3% |
| Q-07 `yabanci-hasta` | 433 | 433 | 0 | 100.0% |
| Q-04 `yapilmadi` | 433 | 433 | 0 | 100.0% |
| Q-11 `yasak-ifade` | 433 | 433 | 0 | 100.0% |

### By category

| category | verdicts | pass | fail | pass rate |
|---|---|---|---|---|
| asi | 252 | 252 | 0 | 100.0% |
| dosya | 622 | 602 | **20** | 96.8% |
| eylem | 38 | 38 | 0 | 100.0% |
| hasta-cozum | 528 | 522 | **6** | 98.9% |
| ilac | 106 | 103 | **3** | 97.2% |
| izolasyon | 44 | 44 | 0 | 100.0% |
| kapsam | 22 | 22 | 0 | 100.0% |
| kimlik | 270 | 270 | 0 | 100.0% |
| lab | 12 | 12 | 0 | 100.0% |
| liste | 377 | 360 | **17** | 95.5% |
| muayene | 151 | 147 | **4** | 97.4% |
| olcum | 1018 | 972 | **46** | 95.5% |
| sayim | 154 | 154 | 0 | 100.0% |
| ses | 29 | 26 | **3** | 89.7% |
| takip | 1058 | 1051 | **7** | 99.3% |
| takvim | 800 | 798 | **2** | 99.8% |

### By surface

| surface | verdicts | pass | fail | pass rate |
|---|---|---|---|---|
| voice | 3410 | 3326 | **84** | 97.5% |
| chat | 2071 | 2047 | **24** | 98.8% |

### Violations — 108 failed verdict(s)

| id | surface | rule | check | text | why |
|---|---|---|---|---|---|
| L-SES-HASTA-01-KOHORT | voice | Q-30 | ses-uzunluk | spoken | 74 kelime söylendi (sınır 65, yaklaşık 25 sn) |
| L-SES-HASTA-01-KOHORT | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| L-SES-HASTA-01-KOHORT | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| L-AKTIF-SON | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| L-AKTIF-SON | chat | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| L-AKTIF-SON | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| L-AKTIF-SON | voice | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| L-AKTIF-TANSIYON | voice | Q-31 | ses-birim | spoken | okunmayan birim: "yüz otuz iki/sekse" |
| L-DOLGU-KILO | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| L-DOLGU-KILO | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| L-SAYFA-KILO | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| L-SAYFA-KILO | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| L-OKU-01 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "6 ay sonra kontrol" |
| L-OKU-01 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.08.2026" |
| L-BIRIM-02 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| L-DANIS-12AY | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.08.2025" |
| L-DANIS-15AY | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.11.2025" |
| L-DANIS-6AY | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "28.02.2025" |
| L-DANIS-SERI-1 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "04.09.2024" |
| L-DANIS-SERI-2 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| L-DANIS-TANSIYON | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "18.09.2026" |
| L-DANIS-TANSIYON | voice | Q-31 | ses-birim | spoken | okunmayan birim: "yüz otuz iki/sekse" |
| L-DANIS-TANSIYON-SERI | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "28.08.2025" |
| L-DANIS-TANSIYON-SERI | voice | Q-31 | ses-birim | spoken | okunmayan birim: "iyon yüz elli/doksa" |
| L-DANIS-ILK | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "28.08.2025" |
| L-DANIS-SON | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "18.09.2026" |
| L-DANIS-GECEN-YIL | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| L-DANIS-GECEN-YIL | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| L-KOHORT-01 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| L-KOHORT-02 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| L-KOHORT-04 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "yüz miligram/beş m" |
| G-08 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "48-72 saat içinde düzelmezse kontrol" |
| G-08 | chat | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| G-08 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "48-72 saat içinde düzelmezse kontrol" |
| G-08 | voice | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| G-20 | voice | Q-30 | ses-uzunluk | spoken | 107 kelime söylendi (sınır 65, yaklaşık 25 sn) |
| G-20 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| G-20 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| G-23 | voice | Q-30 | ses-uzunluk | spoken | 89 kelime söylendi (sınır 65, yaklaşık 25 sn) |
| G-23 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| G-23 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| G-40 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| G-40 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| G-41 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "n: doksan beş/altmı" |
| Y-016 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| Y-021 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "24.09.2026" |
| Y-022 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "24.09.2026" |
| Y-023 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "24.09.2026" |
| Y-041 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "48-72 saat içinde düzelmezse kontrol" |
| Y-041 | chat | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| Y-032 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| Y-033 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| Y-038 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| Y-041 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "48-72 saat içinde düzelmezse kontrol" |
| Y-041 | voice | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| Y-043 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| Y-066 | chat | Q-02 | tek-olcum | screen | sorulmayan ölçüm de verilmiş: boy, ateş, tansiyon |
| Y-069 | chat | Q-02 | tek-olcum | screen | sorulmayan ölçüm de verilmiş: boy, baş çevresi, ateş |
| Y-066 | voice | Q-02 | tek-olcum | spoken | sorulmayan ölçüm de verilmiş: boy, ateş, tansiyon |
| Y-066 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "n: doksan beş/altmı" |
| Y-068 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "24.09.2026" |
| Y-068 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "on doksan beş/altmı" |
| Y-069 | voice | Q-02 | tek-olcum | spoken | sorulmayan ölçüm de verilmiş: boy, baş çevresi, ateş |
| Y-087 | voice | Q-30 | ses-uzunluk | spoken | 96 kelime söylendi (sınır 65, yaklaşık 25 sn) |
| Y-087 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| Y-087 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| Y-088 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.08.2026" |
| Y-090 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| Y-090 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| Y-095 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| T-041 | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| T-041 | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| T-045 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| T-059 | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| T-059 | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| T-076 | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| T-076 | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| T-089 | voice | Q-30 | ses-uzunluk | spoken | 96 kelime söylendi (sınır 65, yaklaşık 25 sn) |
| T-089 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| T-089 | voice | Q-31 | ses-birim | spoken | okunmayan birim: "elli miligram/beş m" |
| R-OLCUM-1 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| R-OLCUM-2 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| R-OLCUM-3 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| R-OLCUM-4 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.08.2026" |
| R-OLCUM-5 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.09.2026" |
| R-MUAYENE-1 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "6 ay sonra kontrol" |
| R-MUAYENE-1 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "6 ay sonra kontrol" |
| R-MUAYENE-1 | voice | Q-30 | ses-uzunluk | spoken | 23 cümle söylendi (sınır 7) |
| R-MUAYENE-2 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| R-OLCUM-METIN | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "30.11.2025" |
| R-KART-KILO | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| R-KART-KILO | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| R-KAPSAM06-10 | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| R-KAPSAM06-10 | chat | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| R-KAPSAM06-10 | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "1 ay sonra kontrol" |
| R-KAPSAM06-10 | voice | Q-20 | uzunluk | screen | tek bilgilik cevap 3 cümle (sınır 2) |
| K-OLCUM-KILO | chat | Q-02 | tek-olcum | screen | kilo değerinin tarihi yok |
| K-OLCUM-KILO | voice | Q-02 | tek-olcum | spoken | kilo değerinin tarihi yok |
| K-OLCUM-G-KILO | chat | Q-02 | tek-olcum | screen | sorulmayan ölçüm de verilmiş: boy, baş çevresi |
| K-OLCUM-G-KILO | voice | Q-02 | tek-olcum | spoken | sorulmayan ölçüm de verilmiş: boy, baş çevresi |
| K-OLCUM-G-BOY | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "29.09.2026" |
| K-OLCUM-G-BAS | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "29.09.2026" |
| K-OLCUM-ATES | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "01.10.2026" |
| K-TARIH-SON | chat | Q-06 | takip-bugun | screen | takip süresi bugünle karşılaştırılmamış: "2 hafta sonra kontrol" |
| K-TARIH-SON | chat | Q-20 | uzunluk | screen | tek bilgilik cevap 5 cümle (sınır 2) |
| K-TARIH-SON | voice | Q-06 | takip-bugun | spoken | takip süresi bugünle karşılaştırılmamış: "2 hafta sonra kontrol" |
| K-TARIH-SON | voice | Q-20 | uzunluk | screen | tek bilgilik cevap 5 cümle (sınır 2) |
| K-TARIH-G18 | voice | Q-31 | ses-tarih | spoken | rakamla tarih: "29.09.2026" |

## FAIL — 22 turn(s)

| id | surface | sentence | source | route | tool / card | why | answer |
|---|---|---|---|---|---|---|---|
| G-21 | chat | aşı kaydı olan hastalarım kimler | docs/qa/gokhan-gunluk-sorular.md: #21; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01 | arama | — | içermeli: Emircan; içermemeli: \b0 hasta | Kayıtlarda 0 hasta. Filtre: Aşı. |
| G-21 | voice | aşı kaydı olan hastalarım kimler | docs/qa/gokhan-gunluk-sorular.md: #21; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01 | arama | — | içermeli: Emircan; içermemeli: \b0 hasta | 🔊 Kayıtlarda 0 hasta. Filtre: Aşı. |
| G-22 | chat | ilaç kullanan hastam var mı | docs/qa/gokhan-gunluk-sorular.md: #22; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01 | arama | — | içermeli: Emircan\|Nermin\|Ayşe\|Tarık; içermemeli: \b0 hasta | Kayıtlarda 0 hasta. Filtre: İlaç. |
| G-22 | voice | ilaç kullanan hastam var mı | docs/qa/gokhan-gunluk-sorular.md: #22; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01 | arama | — | içermeli: Emircan\|Nermin\|Ayşe\|Tarık; içermemeli: \b0 hasta | 🔊 Kayıtlarda 0 hasta. Filtre: İlaç. |
| G-28 | voice | MCV ve MCHC değerlerini oku *(after: Emircan'ın hemoglobin değeri kaçtı → ferritin sonucu ne → WBC kaç)* | docs/qa/gokhan-gunluk-sorular.md: #28 | oku | — | içermeli: \b75\b\|yetmiş beş | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| Y-021 | chat | Son ölçümleri neler? *(after: Kronik hastalığı var mı? → Gelen belgeler kutusunda bir şey var mı? → Sonraki randevusu ne zaman?)* | scripts/ayse-denetim/sorular-100.json: #21 | kayit | — | içermeli: 38,9 | **Ayşe Bozkurt — kilo, boy ve baş çevresi ölçümleri** (1 muayene) \| Tarih \| Kilo (kg) \| Boy (cm) \| Baş çevresi (cm) \| \| --- \| --- \| --- \| --- \| \| 24.09.2026 \| 19,4 \| 110 \| kayıt yok \| Baş çevresi: hiçbir kayıtta ölçüm yok. Yalnız dosyada kayıtlı… |
| Y-023 | chat | bu hastanın annesinin boyu kaç *(after: Sonraki randevusu ne zaman? → Son ölçümleri neler? → hastamızın ateşi kaçtı son muayenede)* | scripts/ayse-denetim/sorular-100.json: #23; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | kayit | — | içermeli: 168 | Ayşe Bozkurt — son boy 110 cm (24.09.2026). |
| Y-021 | voice | Son ölçümleri neler? *(after: Kronik hastalığı var mı? → Gelen belgeler kutusunda bir şey var mı? → Sonraki randevusu ne zaman?)* | scripts/ayse-denetim/sorular-100.json: #21 | kayit | — | içermeli: 38,9 | 🔊 Ayşe Bozkurt'un kilo, boy ve baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 1 kayıt var. Son kilo 19,4 kg (24.09.2026). Baş çevresi için kayıtlı ölçüm yok. 🖥 **Ayşe Bozkurt — kilo, boy ve baş çevresi ölçümleri** (1 muayene) \| Tarih \| Kilo (k… |
| Y-023 | voice | bu hastanın annesinin boyu kaç *(after: Sonraki randevusu ne zaman? → Son ölçümleri neler? → hastamızın ateşi kaçtı son muayenede)* | scripts/ayse-denetim/sorular-100.json: #23; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | kayit | — | içermeli: 168 | 🔊 Ayşe Bozkurt — son boy 110 cm (24.09.2026). |
| Y-063 | voice | Son SOAP notunu oku *(after: Daha önce aynı şikayetle geldi mi? → Gelişimi yaşına uygun mu? → Toplam kaç kez geldi?)* | scripts/ayse-denetim/sorular-100.json: #63 | oku | — | içermeli: otit\|kulak | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| Y-080 | chat | Tarık Özdemir'in randevusu ne zaman? *(after: bu hafta kaç randevum var → yarin sabah bosluk var mi → Bugün öğleden sonra 3'te yer var mı?)* | scripts/ayse-denetim/sorular-100.json: #80 | takvim | — | içermeli: {DUN}\|dün\|11[:.]30\|randevu\w* (yok\|bulunmuyor\|görünmüyor\|kay… | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-083 | chat | kaç tane hasta kaydım var toplam *(after: Tarık Özdemir'in randevusu ne zaman? → Olcay Santoro ne zaman gelecek? → Kaç hastam var?)* | scripts/ayse-denetim/sorular-100.json: #83 | model | — | rota model ≠ arama | Vekil yanıt Hocam. |
| Y-091 | chat | dün gelen ateşli çocuk *(after: Aşısı eksik olan hastalarım kimler? → Bu hafta tanı koyduğum pnömoni vakası kimdi? → kulak iltihabı olan çocuk kimdi)* | scripts/ayse-denetim/sorular-100.json: #91; lib/asistan/ayseRota.test.ts: Dün gelen ateşli çocuk kimdi? | hizli-kart | — | içermeli: Tarık | Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| Y-080 | voice | Tarık Özdemir'in randevusu ne zaman? *(after: bu hafta kaç randevum var → yarin sabah bosluk var mi → Bugün öğleden sonra 3'te yer var mı?)* | scripts/ayse-denetim/sorular-100.json: #80 | takvim | — | içermeli: {DUN}\|dün\|11[:.]30\|randevu\w* (yok\|bulunmuyor\|görünmüyor\|kay… | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-083 | voice | kaç tane hasta kaydım var toplam *(after: Tarık Özdemir'in randevusu ne zaman? → Olcay Santoro ne zaman gelecek? → Kaç hastam var?)* | scripts/ayse-denetim/sorular-100.json: #83 | model | — | rota model ≠ arama | 🔊 Vekil yanıt Hocam. |
| Y-091 | voice | dün gelen ateşli çocuk *(after: Aşısı eksik olan hastalarım kimler? → Bu hafta tanı koyduğum pnömoni vakası kimdi? → kulak iltihabı olan çocuk kimdi)* | scripts/ayse-denetim/sorular-100.json: #91; lib/asistan/ayseRota.test.ts: Dün gelen ateşli çocuk kimdi? | hizli-kart | — | içermeli: Tarık | 🔊 Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| T-025 | chat | peki Tarık Özdemir randevusu ne zaman? *(after: Bugün randevum var mı?)* | scripts/ayse-denetim/sorular-takip.json: #25 | takvim | — | içermeli: Tarık | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-025 | voice | peki Tarık Özdemir randevusu ne zaman? *(after: Bugün randevum var mı?)* | scripts/ayse-denetim/sorular-takip.json: #25 | takvim | — | içermeli: Tarık | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-042 | chat | boyu? *(after: Emircan Karaoğlu kaç kilo?)* | scripts/ayse-denetim/sorular-takip.json: #42 | kayit | — | içermeli: \d cm | Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| T-044 | chat | baş çevresi? *(after: Emircan Karaoğlu kaç kilo? → boyu? → persentili?)* | scripts/ayse-denetim/sorular-takip.json: #44 | kayit | — | içermeli: \d cm | Emircan Karaoğlu için kayıtlı baş çevresi ölçümü yok Hocam (son muayene). |
| T-042 | voice | boyu? *(after: Emircan Karaoğlu kaç kilo?)* | scripts/ayse-denetim/sorular-takip.json: #42 | kayit | — | içermeli: \d cm | 🔊 Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| T-044 | voice | baş çevresi? *(after: Emircan Karaoğlu kaç kilo? → boyu? → persentili?)* | scripts/ayse-denetim/sorular-takip.json: #44 | kayit | — | içermeli: \d cm | 🔊 Emircan Karaoğlu için kayıtlı baş çevresi ölçümü yok Hocam (son muayene). |

## FAIL on a defect the ledger already lists as OPEN — 16 turn(s)

Not new regressions: NOTYA-DANIS-OLCUM-07, NOTYA-ARAMA-DOGUM-NEGASYON-01, NOTYA-KALITE-STANDART-01e, NOTYA-VIZIT-TARIH-01.

| id | surface | sentence | source | route | tool / card | why | answer |
|---|---|---|---|---|---|---|---|
| L-DANIS-BOYU | chat | peki boyu? *(after: bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu)* | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-07 | kayit | — | içermeli: \b76 cm | Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| L-DANIS-BOYU | voice | peki boyu? *(after: bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu)* | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-07 | kayit | — | içermeli: \b76 cm | 🔊 Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| G-24 | chat | doğum tarihi kayıtlı olmayan hastam var mı | docs/qa/gokhan-gunluk-sorular.md: #24; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-DOGUM-NEGASYON-01 | kimlik | — | rota kimlik ≠ arama; içermeli: Olcay | Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? |
| G-24 | voice | doğum tarihi kayıtlı olmayan hastam var mı | docs/qa/gokhan-gunluk-sorular.md: #24; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-DOGUM-NEGASYON-01 | kimlik | — | rota kimlik ≠ arama; içermeli: Olcay | 🔊 Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? |
| K-OLCUM-KILO | chat | Kilosu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {P_SON_VIZIT} | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| K-OLCUM-KILO | voice | Kilosu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {P_SON_VIZIT} | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| K-OLCUM-G-KILO | chat | Kilosu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {G_V18}; içermemeli: 47,6 | Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg · Boy: 82 cm · Baş Çevresi: 47,6 cm. |
| K-OLCUM-G-KILO | voice | Kilosu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {G_V18}; içermemeli: 47,6 | 🔊 Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg, Boy: 82 cm, Baş Çevresi: 47,6 cm. 🖥 Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg · Boy: 82 cm · Baş Çevresi: 47,6 cm. |
| K-OLCUM-G-BOY | chat | Boyu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | Doruk Akyel — son boy 82 cm (29.09.2026). |
| K-OLCUM-G-BOY | voice | Boyu kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | 🔊 Doruk Akyel — son boy 82 cm (29.09.2026). |
| K-OLCUM-G-BAS | chat | Baş çevresi kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | Doruk Akyel — son baş çevresi 47,6 cm (29.09.2026). |
| K-OLCUM-G-BAS | voice | Baş çevresi kaç? | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | 🔊 Doruk Akyel — son baş çevresi 47,6 cm (29.09.2026). |
| K-TARIH-SON | chat | En son ne zaman geldi? | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | Doruk Akyel — dosyada son vizit: 29 Eylül 2026 — 18 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Dosyada plan ve takip: M-CHAT-R/F bir sonraki vizitte uygulanacak. Hepatit A 1. doz planlandı. İşitme değerlendirmesi için KBB konsültasyonu istendi. 2 hafta so… |
| K-TARIH-SON | voice | En son ne zaman geldi? | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | hizli-kart | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | 🔊 Doruk Akyel — dosyada son vizit: 29 Eylül 2026 — 18 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Dosyada plan ve takip: M-CHAT-R/F bir sonraki vizitte uygulanacak. Hepatit A 1. doz planlandı. İşitme değerlendirmesi için KBB konsültasyonu istendi. 2 hafta… |
| K-TARIH-G18 | chat | 18 aylık muayenesinde kaç kiloydu? | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | Doruk Akyel — 18 aylık muayene (29.09.2026): kilo 10,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| K-TARIH-G18 | voice | 18 aylık muayenesinde kaç kiloydu? | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | kayit | — | içermeli: {G_V18}; içermemeli: {G_GIRIS} | 🔊 Doruk Akyel — 18 aylık muayene (29.09.2026): kilo 10,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |

## MANUAL — 24 turn(s), to be read by a person

| id | surface | sentence | route | why manual | answer |
|---|---|---|---|---|---|
| L-DEVAM-01 | voice | devam et | model | A remainder exists only when the previous spoken turn was cut; with text input it usually is not. | 🔊 Vekil yanıt Hocam. |
| L-DANIS-GECEN-YIL | chat | geçen yıl kaç kiloydu | hizli-kart | OPEN in the ledger: the quick card answers with the LATEST weight. What the right answer is for "last year" is not written down. | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-GECEN-YIL | voice | geçen yıl kaç kiloydu | hizli-kart | OPEN in the ledger: the quick card answers with the LATEST weight. What the right answer is for "last year" is not written down. | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-GERI-02-EVET | voice | Evet | — | A spoken Evet commits the pending card. With a stand-in model the card has no value to commit; read the live answer. | 🔊 Şu alanlar boş: Alerji. Ekrandan doldurup onaylayın, ya da tarihi söyleyin. |
| G-14 | chat | Ayşe hastamı bul | model | The source calls "no patient" the design (NOTYA-HASTA-ODAK-01: the assistant's own name alone picks nobody); NOTYA-AYSE-GERI-01, later the same day, lets a patient called Ayşe resolve by first name when the name is not a… | Vekil yanıt Hocam. |
| G-14 | voice | Ayşe hastamı bul | model | The source calls "no patient" the design (NOTYA-HASTA-ODAK-01: the assistant's own name alone picks nobody); NOTYA-AYSE-GERI-01, later the same day, lets a patient called Ayşe resolve by first name when the name is not a… | 🔊 Vekil yanıt Hocam. |
| G-23 | chat | bu ay kayıt olan hastalarım | arama | OPEN in the ledger; the right answer depends on the day of the month the run is made. | Bu ay 5 hasta. Filtre: bu ay: 1. Tarık Özdemir (d.t. 25.02.2024) — bu ay · 2 yaş 7 ay · 01.10.2026 muayene · 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür · ilaç: Amoksisilin 250 mg/5 ml süspansiyon · ilaç: Amoksisilin 250 mg/5 ml süspansiyon. 2. Emircan Karaoğlu (d.t. 30.08.2024) — bu ay · 2 y… |
| G-23 | voice | bu ay kayıt olan hastalarım | arama | OPEN in the ledger; the right answer depends on the day of the month the run is made. | 🔊 Bu ay 5 hasta. Filtre: bu ay: 1) Tarık Özdemir — bu ay, 2 yaş 7 ay, 01.10.2026 muayene, 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür, ilaç: Amoksisilin 250 mg/5 ml süspansiyon, ilaç: Amoksisilin 250 mg/5 ml süspansiyon. 2) Emircan Karaoğlu — bu ay, 2 yaş 1 ay, belge özeti: Kalça USG: bilate… |
| G-29 | chat | Emircan'ın Hct değeri yüzde kaç | model | QUESTIONABLE in the source (how "%" is spoken); the fixture has no Hct row. | Vekil yanıt Hocam. |
| G-29 | voice | Emircan'ın Hct değeri yüzde kaç | model | QUESTIONABLE in the source (how "%" is spoken); the fixture has no Hct row. | 🔊 Vekil yanıt Hocam. |
| G-30 | chat | Emircan'ın topuk kanı sonuçları normal mi | model | Model judgement in the source. | Vekil yanıt Hocam. |
| G-30 | voice | Emircan'ın topuk kanı sonuçları normal mi | model | Model judgement in the source. | 🔊 Vekil yanıt Hocam. |
| G-41 | chat | Ayşe'nin hiç ateşi olmadı mı | hizli-kart | Not tested in the source; a negated question about a chart that does have a fever on record. | Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. |
| G-41 | voice | Ayşe'nin hiç ateşi olmadı mı | hizli-kart | Not tested in the source; a negated question about a chart that does have a fever on record. | 🔊 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. |
| G-45 | chat | Ayşe'yi aç | model | The source expects the persona-name guard (no chart); NOTYA-AYSE-GERI-01 later made "Ayşe'nin …" resolve the patient called Ayşe. Which rule covers the accusative is not written down. | Vekil yanıt Hocam. |
| G-45 | voice | Ayşe'yi aç | model | The source expects the persona-name guard (no chart); NOTYA-AYSE-GERI-01 later made "Ayşe'nin …" resolve the patient called Ayşe. Which rule covers the accusative is not written down. | 🔊 Vekil yanıt Hocam. |
| G-49 | chat | Ayşe için SOAP notu taslağı hazırla | model | Generative; model judgement in the source. | Ayşe Bozkurt için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| G-49 | voice | Ayşe için SOAP notu taslağı hazırla | model | Generative; model judgement in the source. | 🔊 Ayşe Bozkurt için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| Y-019 | chat | Gelen belgeler kutusunda bir şey var mı? | model | The fixture has no incoming-documents box; see Y-093. | Vekil yanıt Hocam. |
| Y-019 | voice | Gelen belgeler kutusunda bir şey var mı? | model | The fixture has no incoming-documents box; see Y-093. | 🔊 Vekil yanıt Hocam. |
| Y-093 | chat | Gelen belgelerde bekleyen var mı? | model | OPEN in the ledger: answered by the model with a menu deflection; should become a deterministic count. | Vekil yanıt Hocam. |
| Y-093 | voice | Gelen belgelerde bekleyen var mı? | model | OPEN in the ledger: answered by the model with a menu deflection; should become a deterministic count. | 🔊 Vekil yanıt Hocam. |
| K-G07 | chat | Daha önce aynı şikayetle geldi mi? | model | The last visit is a well-child visit with a language concern; whether the 12-month well-child visit counts as "the same complaint" is a human read. The rubric still judges the form. | Vekil yanıt Hocam. |
| K-G07 | voice | Daha önce aynı şikayetle geldi mi? | model | The last visit is a well-child visit with a language concern; whether the 12-month well-child visit counts as "the same complaint" is a human read. The rubric still judges the form. | 🔊 Vekil yanıt Hocam. |

## Every turn

| id | source | surface | sentence | route | tool / card | patient | verdict | answer |
|---|---|---|---|---|---|---|---|---|
| L-SAYIM-ANDA | docs/OPEN-COMMITMENTS.md: NOTYA-SAYIM-ANDA-01; scripts/ayse-denetim/sorular-canli-0930.json: #1 | chat | Hocam benim şu anda toplam kaç hastam var? | arama | — | — | PASS | Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| L-SAYIM-ANDA | docs/OPEN-COMMITMENTS.md: NOTYA-SAYIM-ANDA-01; scripts/ayse-denetim/sorular-canli-0930.json: #1 | voice | Hocam benim şu anda toplam kaç hastam var? | arama | — | — | PASS | 🔊 Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| L-1TO1-YAS | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | hastamız kaç yaşında | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| L-1TO1-YAS | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | hastamız kaç yaşında | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| L-1TO1-AC | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | Emircan Karaoğlu'nun dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| L-1TO1-AC | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | Emircan Karaoğlu'nun dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| L-1TO1-YOK | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | Kemal Sarıtaş'ın dosyasını aç | arama | — | — | PASS | Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| L-1TO1-YOK | docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | Kemal Sarıtaş'ın dosyasını aç | arama | — | — | PASS | 🔊 Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| C-2 | scripts/ayse-denetim/sorular-canli-0930.json: #2; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | chat | Bugün hiçbir randevumuz var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| C-3 | scripts/ayse-denetim/sorular-canli-0930.json: #3; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | chat | Peki yanım var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| C-2 | scripts/ayse-denetim/sorular-canli-0930.json: #2; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | voice | Bugün hiçbir randevumuz var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| C-3 | scripts/ayse-denetim/sorular-canli-0930.json: #3; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | voice | Peki yanım var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| C-4 | scripts/ayse-denetim/sorular-canli-0930.json: #4 | chat | Bugün randevum var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| C-5 | scripts/ayse-denetim/sorular-canli-0930.json: #5; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | chat | Peki xqzt var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| C-4 | scripts/ayse-denetim/sorular-canli-0930.json: #4 | voice | Bugün randevum var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| C-5 | scripts/ayse-denetim/sorular-canli-0930.json: #5; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | voice | Peki xqzt var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| C-6 | scripts/ayse-denetim/sorular-canli-0930.json: #6; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | chat | Yarın randevo var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| C-6 | scripts/ayse-denetim/sorular-canli-0930.json: #6; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-06 | voice | Yarın randevo var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| L-SES-TUR-BIRLESIK | docs/OPEN-COMMITMENTS.md: NOTYA-SES-TUR-01 | chat | İyiyim teşekkür ederim. Bugün randevumuz var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| L-SES-TUR-BIRLESIK | docs/OPEN-COMMITMENTS.md: NOTYA-SES-TUR-01 | voice | İyiyim teşekkür ederim. Bugün randevumuz var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| L-HASTA-01 | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-HASTA-01; lib/doktor/pratikAnaliz.test.ts: tekHastaSorusuMu: canlı vaka | chat | Emircan Karaoğlu'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim. | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-HASTA-01 | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-HASTA-01; lib/doktor/pratikAnaliz.test.ts: tekHastaSorusuMu: canlı vaka | voice | Emircan Karaoğlu'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim. | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-KIMLIK-ANNE | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925; lib/asistan/ayseRota.test.ts: Annesinin adı ne? | chat | Annesinin adı ne? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Anne adı: Elif (Hasta Bilgi Formu) |
| L-KIMLIK-ANNE | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925; lib/asistan/ayseRota.test.ts: Annesinin adı ne? | voice | Annesinin adı ne? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Anne… |
| L-KIMLIK-BABA | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | Babasının adı ne? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Baba adı: Serdar (Hasta Bilgi Formu) |
| L-KIMLIK-BABA | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | Babasının adı ne? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Baba… |
| L-KIMLIK-ANNETEL | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925; lib/asistan/dosyaSorgu/denetim.test.ts: Annesinin telefonu ne? | chat | Annesinin telefonu ne? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Annesinin telefonu: 0532 000 11 22 — Elif Karaoğlu (Hasta Bilgi Formu, veli) |
| L-KIMLIK-ANNETEL | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925; lib/asistan/dosyaSorgu/denetim.test.ts: Annesinin telefonu ne? | voice | Annesinin telefonu ne? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Anne… |
| L-KIMLIK-VELI | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | Velisi kim? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Veli / yasal temsilci: Elif Karaoğlu (anne) — 0532 000 11 22 (Hasta Bilgi Formu) |
| L-KIMLIK-VELI | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | Velisi kim? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Veli… |
| L-KIMLIK-DOGUMYERI | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | Doğum yeri neresi? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Doğum yeri: İzmir (Hasta Bilgi Formu) |
| L-KIMLIK-DOGUMYERI | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | Doğum yeri neresi? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğu… |
| L-KIMLIK-ADRES | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | Adresi ne? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Adres: QA Mahallesi 1. Sokak No: 1, İzmir (Hasta Bilgi Formu) |
| L-KIMLIK-ADRES | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | Adresi ne? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Adre… |
| L-KIMLIK-EPOSTA | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | E-posta adresi ne? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — E-posta: qa-veli@example.test (Hasta Bilgi Formu) |
| L-KIMLIK-EPOSTA | docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | E-posta adresi ne? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (E-po… |
| L-KIMLIK-DT | docs/OPEN-COMMITMENTS.md: STT mis-transcription investigated | chat | Emircan Karaoğlu'nun doğum tarihini verir misin? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Doğum tarihi: 30.08.2024 (hasta kartı) |
| L-KIMLIK-DT | docs/OPEN-COMMITMENTS.md: STT mis-transcription investigated | voice | Emircan Karaoğlu'nun doğum tarihini verir misin? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğu… |
| L-KIMLIK-DT-ASR | docs/OPEN-COMMITMENTS.md: STT mis-transcription investigated | chat | Emircan Kara oğlunun doğum tarihini verir misin? | kimlik | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — Doğum tarihi: 30.08.2024 (hasta kartı) |
| L-KIMLIK-DT-ASR | docs/OPEN-COMMITMENTS.md: STT mis-transcription investigated | voice | Emircan Kara oğlunun doğum tarihini verir misin? | kimlik | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğu… |
| L-SES-HASTA-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/hastaCozumleyici.test.ts: son muayenesinin özetini ve… | chat | Ayşe Bozkurt'un son muayenesinin özetini verir misin? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| L-SES-HASTA-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/hastaCozumleyici.test.ts: son muayenesinin özetini ve… | voice | Ayşe Bozkurt'un son muayenesinin özetini verir misin? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| L-SES-HASTA-01-ASR | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/hastaCozumleyici.test.ts: apostrofsuz ek, canlı ASR b… | chat | Ayşe Bozkurtun son muayenesinin özetini verir misin? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| L-SES-HASTA-01-ASR | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/hastaCozumleyici.test.ts: apostrofsuz ek, canlı ASR b… | voice | Ayşe Bozkurtun son muayenesinin özetini verir misin? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| L-SES-HASTA-01-KOHORT | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/sesliSoz.test.ts: Merhaba Ayşe, bu hafta ateşli hasta… | chat | Merhaba Ayşe, bu hafta ateşli hastalarım kimler | arama | — | — | PASS | Bu hafta 2 hasta. Filtre: bu hafta: 1. Tarık Özdemir (d.t. 25.02.2024) — bu hafta · 2 yaş 7 ay · 01.10.2026 muayene · 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür · ilaç: Amo… |
| L-SES-HASTA-01-KOHORT | docs/OPEN-COMMITMENTS.md: NOTYA-SES-HASTA-01; lib/doktor/sesliSoz.test.ts: Merhaba Ayşe, bu hafta ateşli hasta… | voice | Merhaba Ayşe, bu hafta ateşli hastalarım kimler | arama | — | — | PASS | 🔊 Bu hafta 2 hasta. Filtre: bu hafta: 1) Tarık Özdemir — bu hafta, 2 yaş 7 ay, 01.10.2026 muayene, 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür, ilaç: Amoksisilin 250 mg/5 m… |
| L-AKTIF-SON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01; docs/OPEN-COMMITMENTS.md: NOTYA-LUNA-ARAMA-01 | chat | En son ne zaman geldi? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| L-AKTIF-SON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01; docs/OPEN-COMMITMENTS.md: NOTYA-LUNA-ARAMA-01 | voice | En son ne zaman geldi? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| L-AKTIF-SON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01; docs/OPEN-COMMITMENTS.md: NOTYA-LUNA-ARAMA-01 | panel | En son ne zaman geldi? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| L-AKTIF-TANSIYON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01 | chat | Tansiyon takibini nasıl planlarsın? | hizli-kart | — | Nermin Aydoğan | PASS | Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. |
| L-AKTIF-TANSIYON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01 | voice | Tansiyon takibini nasıl planlarsın? | hizli-kart | — | Nermin Aydoğan | PASS | 🔊 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 … |
| L-AKTIF-TANSIYON | docs/OPEN-COMMITMENTS.md: NOTYA-AKTIF-HASTA-01 | panel | Tansiyon takibini nasıl planlarsın? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| L-DOLGU-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-DOLGU-01 | chat | Emircan, eee, Karaoğlu'nun dosyasına bak... şu anda kaç yaşında Emircan? | dosya-ac | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| L-DOLGU-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-DOLGU-01 | voice | Emircan, eee, Karaoğlu'nun dosyasına bak... şu anda kaç yaşında Emircan? | dosya-ac | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| L-DOLGU-KILO | lib/doktor/sesliSoz.test.ts: NOTYA-HASTA-ODAK-01: cümle ortasındaki hitap | chat | Peki Ayşe, Emircan Karaoğlu kaç kilo? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DOLGU-KILO | lib/doktor/sesliSoz.test.ts: NOTYA-HASTA-ODAK-01: cümle ortasındaki hitap | voice | Peki Ayşe, Emircan Karaoğlu kaç kilo? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DOLGU-HANE | lib/doktor/sesliSoz.test.ts: hanesini gösterir misin | chat | Eee, merhaba Ayşe Hocam. Bana, eee, Emirhan Karaoğlu'nun hanesini gösterir misin | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-DOLGU-HANE | lib/doktor/sesliSoz.test.ts: hanesini gösterir misin | voice | Eee, merhaba Ayşe Hocam. Bana, eee, Emirhan Karaoğlu'nun hanesini gösterir misin | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-ODAK-01 | docs/OPEN-COMMITMENTS.md: NOTYA-HASTA-ODAK-01; lib/doktor/sesliSoz.test.ts: Biraz koy. Ayşe, benim spesifik | chat | Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi. | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| L-ODAK-01 | docs/OPEN-COMMITMENTS.md: NOTYA-HASTA-ODAK-01; lib/doktor/sesliSoz.test.ts: Biraz koy. Ayşe, benim spesifik | voice | Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi. | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| L-ODAK-HITAP-1 | lib/doktor/hastaCozumleyici.test.ts: Ayşe, aşı karnesini gösterir misin?; lib/asistan/ayseRota.test.ts: Ayşe, … | chat | Ayşe, aşı karnesini gösterir misin? | model | — | — | not judged | Vekil yanıt Hocam. |
| L-ODAK-HITAP-1 | lib/doktor/hastaCozumleyici.test.ts: Ayşe, aşı karnesini gösterir misin?; lib/asistan/ayseRota.test.ts: Ayşe, … | voice | Ayşe, aşı karnesini gösterir misin? | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-2 | lib/asistan/ayseRota.test.ts: Ayşe Hanım otitte ilk seçenek ne?; lib/doktor/hastaCozumleyici.test.ts: Ayşe Han… | chat | Ayşe Hanım otitte ilk seçenek ne? | model | — | — | not judged | Vekil yanıt Hocam. |
| L-ODAK-HITAP-2 | lib/asistan/ayseRota.test.ts: Ayşe Hanım otitte ilk seçenek ne?; lib/doktor/hastaCozumleyici.test.ts: Ayşe Han… | voice | Ayşe Hanım otitte ilk seçenek ne? | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-3 | lib/asistan/ayseRota.test.ts: Merhaba Ayşe, nasılsın? | chat | Merhaba Ayşe, nasılsın? | model | — | — | PASS | Vekil yanıt Hocam. |
| L-ODAK-HITAP-3 | lib/asistan/ayseRota.test.ts: Merhaba Ayşe, nasılsın? | voice | Merhaba Ayşe, nasılsın? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-4 | lib/doktor/hastaCozumleyici.test.ts: Teşekkürler Ayşe | chat | Teşekkürler Ayşe | model | — | — | PASS | Vekil yanıt Hocam. |
| L-ODAK-HITAP-4 | lib/doktor/hastaCozumleyici.test.ts: Teşekkürler Ayşe | voice | Teşekkürler Ayşe | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| L-DOLGU-02 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-LATENCY-BULGULARI; lib/doktor/sesliSoz.test.ts: NOTYA-SES-DOLGU-02 | chat | Merhaba hocam bugün nasınsınız iyi misiniz? | model | — | — | PASS | Vekil yanıt Hocam. |
| L-DOLGU-02 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-LATENCY-BULGULARI; lib/doktor/sesliSoz.test.ts: NOTYA-SES-DOLGU-02 | voice | Merhaba hocam bugün nasınsınız iyi misiniz? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| L-SAYFA-KILO | docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01 | chat | kaç kilo | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-SAYFA-KILO | docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01 | voice | kaç kilo | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-SAYFA-BUYUME | docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01; docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 3. | chat | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-SAYFA-BUYUME | docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01; docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 3. | voice | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-ERKEN-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-ERKEN-01 | chat | Emircan Karaoğlu'nun dosyasını kısaca özetler misin | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-ERKEN-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-ERKEN-01 | voice | Emircan Karaoğlu'nun dosyasını kısaca özetler misin | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-OKU-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-OKU-01 | voice | Devamını ekranda görüyorum ama sen bana anlat | oku | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — son 3 muayene (toplam 15 onaylı muayene). 1. 30.08.2026. Şikayet: 24 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Koşuyor, merdiven çıkıyor, 2-3 kelimelik … |
| L-DEVAM-01 | docs/OPEN-COMMITMENTS.md: NOTYA-SES-DEVAM-01 | voice | devam et | model | — | Emircan Karaoğlu | MANUAL | 🔊 Vekil yanıt Hocam. |
| L-OZET-TAM | docs/OPEN-COMMITMENTS.md: NOTYA-SES-OZET-TAM-01; docs/qa/gokhan-gunluk-sorular.md: #53 | voice | Hastanın özetini oku | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-BIRIM-02 | docs/OPEN-COMMITMENTS.md: NOTYA-TTS-BIRIM-02; docs/qa/gokhan-gunluk-sorular.md: #54 | voice | Son muayenede ateşi kaçtı? | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-PLAN-01 | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-PLAN-01; docs/qa/gokhan-gunluk-sorular.md: #52; docs/OPEN-COMMITMEN… | chat | Bir tane Tesla elektrikli araba almayı planlıyorum. | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| L-PLAN-01 | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-PLAN-01; docs/qa/gokhan-gunluk-sorular.md: #52; docs/OPEN-COMMITMEN… | voice | Bir tane Tesla elektrikli araba almayı planlıyorum. | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| L-TUR-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01; docs/qa/gokhan-gunluk-sorular.md: #55 | chat | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-TUR-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01; docs/qa/gokhan-gunluk-sorular.md: #55 | voice | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-TUR-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01; docs/qa/gokhan-gunluk-sorular.md: #55 | panel | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| L-TUR-12AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | chat | Emircan Karaoğlu'nun 12 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-TUR-12AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | voice | Emircan Karaoğlu'nun 12 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-TUR-15AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | chat | Emircan Karaoğlu'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-TUR-15AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | voice | Emircan Karaoğlu'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-TUR-18AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | chat | Emircan Karaoğlu'nun 18 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-TUR-18AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | voice | Emircan Karaoğlu'nun 18 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-TUR-24AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | chat | Emircan Karaoğlu'nun 24 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-TUR-24AY | docs/OPEN-COMMITMENTS.md: NOTYA-DOSYA-SORU-TUR-01 | voice | Emircan Karaoğlu'nun 24 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-GECMIS | docs/OPEN-COMMITMENTS.md: çoklu-muayene sorgusu | chat | Bu hastanın geçmişini özetler misin? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-GECMIS | docs/OPEN-COMMITMENTS.md: çoklu-muayene sorgusu | voice | Bu hastanın geçmişini özetler misin? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-GECMIS | docs/OPEN-COMMITMENTS.md: çoklu-muayene sorgusu | panel | Bu hastanın geçmişini özetler misin? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| L-KAPSAM-05 | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05; lib/asistan/kapsamKilidi.test.ts: NOTYA-KAPSAM-05: canlı cümle | chat | Bugün İstanbul'da hava yağışlı mı? | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| L-KAPSAM-05 | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05; lib/asistan/kapsamKilidi.test.ts: NOTYA-KAPSAM-05: canlı cümle | voice | Bugün İstanbul'da hava yağışlı mı? | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| L-KAPSAM-05C | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05c | chat | Bugün kaç hastam var? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| L-KAPSAM-05C | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05c | voice | Bugün kaç hastam var? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| L-KAPSAM-06B | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06b | chat | Yarın yağmur yağacak mı | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| L-KAPSAM-06B | docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06b | voice | Yarın yağmur yağacak mı | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| L-EYLEM-HEPB | docs/OPEN-COMMITMENTS.md: doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi | chat | Doğum epikrizindeki Hepatit B dozunu kaydet | model | forced required; called asi_kaydi_ekle; card asi_kaydi_ekle (2 missing) | Emircan Karaoğlu | not judged | Emircan Karaoğlu için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| L-EYLEM-HEPB | docs/OPEN-COMMITMENTS.md: doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi | voice | Doğum epikrizindeki Hepatit B dozunu kaydet | model | forced required; called asi_kaydi_ekle; card asi_kaydi_ekle (2 missing) | Emircan Karaoğlu | not judged | 🔊 Emircan Karaoğlu için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| L-EYLEM-HEPB | docs/OPEN-COMMITMENTS.md: doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi | panel | Doğum epikrizindeki Hepatit B dozunu kaydet | panel | forced required; called asi_kaydi_ekle; card asi_kaydi_ekle (2 missing) | n/a | not judged | (empty) |
| L-GERI-03-BOS | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; lib/asistan/ayseRota.test.ts: Yarın hangi saatler boş?; docs/qa/… | chat | Yarın hangi saatler boş? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu var. |
| L-GERI-03-BOS | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; lib/asistan/ayseRota.test.ts: Yarın hangi saatler boş?; docs/qa/… | voice | Yarın hangi saatler boş? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, çalışma gününüz olarak işaretli değil Hocam; takviminizde 1 randevu var. 🖥 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu… |
| L-GERI-03-YABANCI | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; lib/asistan/ayseRota.test.ts: Ali Yılmaz için randevu oluştur; d… | chat | Ali Yılmaz için randevu oluştur | model | — | — | not judged | Vekil yanıt Hocam. |
| L-GERI-03-YABANCI | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; lib/asistan/ayseRota.test.ts: Ali Yılmaz için randevu oluştur; d… | voice | Ali Yılmaz için randevu oluştur | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| L-DANIS-12AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03; lib/asistan/vizitOlcumSahne.test.ts: kaç kiloydu | chat | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | kayit | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — 12 aylık muayene (30.08.2025): kilo 9,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-BOYU | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-07 | chat | peki boyu? | kayit | — | Emircan Karaoğlu | **FAIL** | Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| L-DANIS-12AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03; lib/asistan/vizitOlcumSahne.test.ts: kaç kiloydu | voice | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — 12 aylık muayene (30.08.2025): kilo 9,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-BOYU | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-07 | voice | peki boyu? | kayit | — | Emircan Karaoğlu | **FAIL** | 🔊 Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| L-DANIS-12AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03; lib/asistan/vizitOlcumSahne.test.ts: kaç kiloydu | panel | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | panel | — | n/a | PASS | Kayıt — 12 aylık muayene (30.08.2025): kilo 9,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-BOYU | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-07 | panel | peki boyu? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| L-DANIS-15AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | chat | 15 aylıkken kaç kiloydu | kayit | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| L-DANIS-15AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | voice | 15 aylıkken kaç kiloydu | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| L-DANIS-15AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | panel | 15 aylıkken kaç kiloydu | panel | — | n/a | PASS | Kayıt — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| L-DANIS-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | chat | 6 aylık kontrolde boyu kaçtı | kayit | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — 6 aylık muayene (28.02.2025): boy 67,5 cm. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | voice | 6 aylık kontrolde boyu kaçtı | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — 6 aylık muayene (28.02.2025): boy 67,5 cm. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-6AY | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | panel | 6 aylık kontrolde boyu kaçtı | panel | — | n/a | PASS | Kayıt — 6 aylık muayene (28.02.2025): boy 67,5 cm. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-NORMAL | lib/asistan/vizitOlcumSahne.test.ts: kilosu normal miydi?; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-04 | chat | 12 aylık muayenesinde kilosu normal miydi? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| L-DANIS-NORMAL | lib/asistan/vizitOlcumSahne.test.ts: kilosu normal miydi?; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-04 | voice | 12 aylık muayenesinde kilosu normal miydi? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| L-DANIS-SERI-1 | lib/asistan/vizitOlcumSahne.test.ts: kilo gelişimi; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | chat | kilo gelişimi | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo ölçümleri** (15 muayene; eskiden yeniye) \| Tarih \| Kilo \| Kaynak \| \| --- \| --- \| --- \| \| 04.09.2024 \| 3,2 kg \| muayene alanı \| \| 30.09.2024 \… |
| L-DANIS-SERI-1 | lib/asistan/vizitOlcumSahne.test.ts: kilo gelişimi; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | voice | kilo gelişimi | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — kilo ölçümlerini tarih sırasıyla ekrana getirdim Hocam; 15 kayıt var. İlk kilo 3,2 kg (04.09.2024), son kilo 12,8 kg (30.09.2026). 🖥 **Emircan Karaoğlu — kil… |
| L-DANIS-SERI-2 | lib/asistan/vizitOlcumSahne.test.ts: bütün muayenelerinde kilosu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-… | chat | bütün muayenelerinde kilosu | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo ölçümleri** (15 muayene) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 04.09.2024 \| 3,2 \| \| 30.09.2024 \| 4,3 \| \| 30.10.2024 \| 5,4 \| \| 30.12.2024 \… |
| L-DANIS-SERI-2 | lib/asistan/vizitOlcumSahne.test.ts: bütün muayenelerinde kilosu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-… | voice | bütün muayenelerinde kilosu | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun kilo ölçümlerini tablo olarak ekrana getirdim Hocam; 15 kayıt var. Son kilo 12,8 kg (30.09.2026). 🖥 **Emircan Karaoğlu — kilo ölçümleri** (15 muayene) \| T… |
| L-DANIS-SERI-2 | lib/asistan/vizitOlcumSahne.test.ts: bütün muayenelerinde kilosu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-… | panel | bütün muayenelerinde kilosu | panel | — | n/a | PASS | **Kayıt — kilo ölçümleri** (15 muayene; eskiden yeniye) \| Tarih \| Kilo \| Kaynak \| \| --- \| --- \| --- \| \| 04.09.2024 \| 3,2 kg \| muayene alanı \| \| 30.09.2024 \| 4,3 kg \|… |
| L-DANIS-TANSIYON | lib/asistan/vizitOlcumSahne.test.ts: son muayenede tansiyonu kaçtı; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCU… | chat | son muayenede tansiyonu kaçtı | kayit | — | Nermin Aydoğan | PASS | Nermin Aydoğan — son muayene (18.09.2026): tansiyon 132/84 mmHg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-TANSIYON | lib/asistan/vizitOlcumSahne.test.ts: son muayenede tansiyonu kaçtı; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCU… | voice | son muayenede tansiyonu kaçtı | kayit | — | Nermin Aydoğan | PASS | 🔊 Nermin Aydoğan — son muayene (18.09.2026): tansiyon 132/84 mmHg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-TANSIYON | lib/asistan/vizitOlcumSahne.test.ts: son muayenede tansiyonu kaçtı; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCU… | panel | son muayenede tansiyonu kaçtı | panel | — | n/a | PASS | Kayıt — son muayene (18.09.2026): tansiyon 132/84 mmHg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-TANSIYON-SERI | lib/asistan/vizitOlcumSahne.test.ts: tansiyon seyri; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-04 | chat | tansiyon seyri | kayit | — | Nermin Aydoğan | PASS | **Nermin Aydoğan — tansiyon ölçümleri** (4 muayene; eskiden yeniye) \| Tarih \| Tansiyon \| Kaynak \| \| --- \| --- \| --- \| \| 28.08.2025 \| 150/95 mmHg \| muayene alanı \| \| 16… |
| L-DANIS-TANSIYON-SERI | lib/asistan/vizitOlcumSahne.test.ts: tansiyon seyri; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-04 | voice | tansiyon seyri | kayit | — | Nermin Aydoğan | PASS | 🔊 Nermin Aydoğan — tansiyon ölçümlerini tarih sırasıyla ekrana getirdim Hocam; 4 kayıt var. İlk tansiyon 150/95 mmHg (28.08.2025), son tansiyon 132/84 mmHg (18.09.2026). 🖥 **Nerm… |
| L-DANIS-ILK | lib/asistan/vizitOlcumSahne.test.ts: ilk muayenede kaç kiloydu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | chat | ilk muayenede kaç kiloydu | kayit | — | Nermin Aydoğan | PASS | **Nermin Aydoğan — kilo ölçümleri** (ilk muayene; toplam 4 muayene kayıtlı) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 28.08.2025 \| 78 \| Yalnız dosyada kayıtlı değerler gösteri… |
| L-DANIS-ILK | lib/asistan/vizitOlcumSahne.test.ts: ilk muayenede kaç kiloydu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | voice | ilk muayenede kaç kiloydu | kayit | — | Nermin Aydoğan | PASS | 🔊 Nermin Aydoğan, ilk muayene (28.08.2025): kilo 78 kg. 🖥 **Nermin Aydoğan — kilo ölçümleri** (ilk muayene; toplam 4 muayene kayıtlı) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \|… |
| L-DANIS-SON | lib/asistan/vizitOlcumSahne.test.ts: son muayenede kaç kiloydu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | chat | son muayenede kaç kiloydu | kayit | — | Nermin Aydoğan | PASS | **Nermin Aydoğan — kilo ölçümleri** (son muayene; toplam 4 muayene kayıtlı) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 18.09.2026 \| 75,5 \| Yalnız dosyada kayıtlı değerler göste… |
| L-DANIS-SON | lib/asistan/vizitOlcumSahne.test.ts: son muayenede kaç kiloydu; docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03 | voice | son muayenede kaç kiloydu | kayit | — | Nermin Aydoğan | PASS | 🔊 Nermin Aydoğan, son muayene (18.09.2026): kilo 75,5 kg. 🖥 **Nermin Aydoğan — kilo ölçümleri** (son muayene; toplam 4 muayene kayıtlı) \| Tarih \| Kilo (kg) \| \| --- \| --- \| … |
| L-DANIS-GECEN-YIL | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-09 | chat | geçen yıl kaç kiloydu | hizli-kart | — | Emircan Karaoğlu | MANUAL | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-GECEN-YIL | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-09 | voice | geçen yıl kaç kiloydu | hizli-kart | — | Emircan Karaoğlu | MANUAL | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-KOHORT-01 | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-KOHORT-01; lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | chat | Son bir ay içinde hangi antibiyotiği en fazla yazdım? | arama | — | — | PASS | Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, Klacid 250… |
| L-KOHORT-01 | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-KOHORT-01; lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | voice | Son bir ay içinde hangi antibiyotiği en fazla yazdım? | arama | — | Emircan Karaoğlu | PASS | 🔊 Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, Klacid … |
| L-KOHORT-02 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | chat | Son bir ayda kaç hastaya antibiyotik yazdım? | arama | — | — | PASS | Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, Klacid 250… |
| L-KOHORT-02 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | voice | Son bir ayda kaç hastaya antibiyotik yazdım? | arama | — | Emircan Karaoğlu | PASS | 🔊 Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, Klacid … |
| L-KOHORT-03 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | chat | Bu hafta en fazla hangi tanıyı koydum? | arama | — | — | PASS | Bu hafta en çok koyduğun tanı Akut otitis media (1). Sıra: Akut otitis media 1, Otitis media, iyileşmiş 1 (toplam 2). |
| L-KOHORT-03 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | voice | Bu hafta en fazla hangi tanıyı koydum? | arama | — | Emircan Karaoğlu | PASS | 🔊 Bu hafta en çok koyduğun tanı Akut otitis media (1). Sıra: Akut otitis media 1, Otitis media, iyileşmiş 1 (toplam 2). |
| L-KOHORT-04 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | chat | Bu hastaya en fazla hangi antibiyotiği yazdım? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son reçete: Augmentin ES 600 mg/5 ml süspansiyon, Pedifen şurup (20 Eylül 2026). |
| L-KOHORT-04 | lib/asistan/aktifHastaPratik.test.ts: NOTYA-AYSE-KOHORT-01 | voice | Bu hastaya en fazla hangi antibiyotiği yazdım? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son reçete: Augmentin ES 600 mg/5 ml süspansiyon, Pedifen şurup (20 Eylül 2026). |
| L-GERI-02-EVET | docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-02 | voice | Evet | — | — | Deniz Aksoy | MANUAL | 🔊 Şu alanlar boş: Alerji. Ekrandan doldurup onaylayın, ya da tarihi söyleyin. |
| G-01 | docs/qa/gokhan-gunluk-sorular.md: #1 | chat | Emircan'ın dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| G-01 | docs/qa/gokhan-gunluk-sorular.md: #1 | voice | Emircan'ın dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| G-02 | docs/qa/gokhan-gunluk-sorular.md: #2; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | chat | Emircanın dosyası | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-02 | docs/qa/gokhan-gunluk-sorular.md: #2; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | voice | Emircanın dosyası | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-03 | docs/qa/gokhan-gunluk-sorular.md: #3 | chat | Karaoğlu'nun aşıları ne durumda | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızam… |
| G-03 | docs/qa/gokhan-gunluk-sorular.md: #3 | voice | Karaoğlu'nun aşıları ne durumda | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kı… |
| G-04 | docs/qa/gokhan-gunluk-sorular.md: #4; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | chat | Karaoğlunun aşıları | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| G-04 | docs/qa/gokhan-gunluk-sorular.md: #4; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | voice | Karaoğlunun aşıları | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| G-05 | docs/qa/gokhan-gunluk-sorular.md: #5 | chat | Bozkurt'un dosyasını getir | dosya-ac | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| G-05 | docs/qa/gokhan-gunluk-sorular.md: #5 | voice | Bozkurt'un dosyasını getir | dosya-ac | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| G-06 | docs/qa/gokhan-gunluk-sorular.md: #6; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | chat | bozkurtun dosyasını getir | dosya-ac | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| G-06 | docs/qa/gokhan-gunluk-sorular.md: #6; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-INDEKS-SUFFIX-01 | voice | bozkurtun dosyasını getir | dosya-ac | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| G-07 | docs/qa/gokhan-gunluk-sorular.md: #7 | chat | Tarık Özdemir'i açar mısın | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| G-07 | docs/qa/gokhan-gunluk-sorular.md: #7 | voice | Tarık Özdemir'i açar mısın | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| G-08 | docs/qa/gokhan-gunluk-sorular.md: #8 | chat | Özdemir'in son kontrolü ne zamandı | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| G-08 | docs/qa/gokhan-gunluk-sorular.md: #8 | voice | Özdemir'in son kontrolü ne zamandı | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| G-09 | docs/qa/gokhan-gunluk-sorular.md: #9 | chat | Olcay'ın kaydı var mı | model | — | Olcay Santoro | not judged | Vekil yanıt Hocam. |
| G-09 | docs/qa/gokhan-gunluk-sorular.md: #9 | voice | Olcay'ın kaydı var mı | model | — | Olcay Santoro | not judged | 🔊 Vekil yanıt Hocam. |
| G-10 | docs/qa/gokhan-gunluk-sorular.md: #10 | chat | Santoro diye bir hastam var mıydı | model | — | Olcay Santoro | not judged | Vekil yanıt Hocam. |
| G-10 | docs/qa/gokhan-gunluk-sorular.md: #10 | voice | Santoro diye bir hastam var mıydı | model | — | Olcay Santoro | not judged | 🔊 Vekil yanıt Hocam. |
| G-11 | docs/qa/gokhan-gunluk-sorular.md: #11 | chat | Emircn Karaoglu dosyasini ac | dosya-ac | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| G-11 | docs/qa/gokhan-gunluk-sorular.md: #11 | voice | Emircn Karaoglu dosyasini ac | dosya-ac | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| G-12 | docs/qa/gokhan-gunluk-sorular.md: #12 | chat | Emirçan Kara oğlu hastasını bul | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-12 | docs/qa/gokhan-gunluk-sorular.md: #12 | voice | Emirçan Kara oğlu hastasını bul | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-13 | docs/qa/gokhan-gunluk-sorular.md: #13 | chat | Olcay Santor diye hasta var mı | model | — | Olcay Santoro | not judged | Vekil yanıt Hocam. |
| G-13 | docs/qa/gokhan-gunluk-sorular.md: #13 | voice | Olcay Santor diye hasta var mı | model | — | Olcay Santoro | not judged | 🔊 Vekil yanıt Hocam. |
| G-14 | docs/qa/gokhan-gunluk-sorular.md: #14 | chat | Ayşe hastamı bul | model | — | Ayşe Bozkurt | MANUAL | Vekil yanıt Hocam. |
| G-14 | docs/qa/gokhan-gunluk-sorular.md: #14 | voice | Ayşe hastamı bul | model | — | Ayşe Bozkurt | MANUAL | 🔊 Vekil yanıt Hocam. |
| G-15 | docs/qa/gokhan-gunluk-sorular.md: #15; docs/qa/gokhan-gunluk-sorular.md: #44 | chat | hastamın dosyasını aç | arama | — | — | PASS | Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| G-15 | docs/qa/gokhan-gunluk-sorular.md: #15; docs/qa/gokhan-gunluk-sorular.md: #44 | voice | hastamın dosyasını aç | arama | — | — | PASS | 🔊 Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| G-16 | docs/qa/gokhan-gunluk-sorular.md: #16 | chat | Taırk Özdemir'in aşı karnesini göster | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir için kayıtlı aşı yok Hocam. |
| G-16 | docs/qa/gokhan-gunluk-sorular.md: #16 | voice | Taırk Özdemir'in aşı karnesini göster | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir için kayıtlı aşı yok Hocam. |
| G-17 | docs/qa/gokhan-gunluk-sorular.md: #17; docs/OPEN-COMMITMENTS.md: NOTYA-SAYIM-ANDA-01 | chat | şu anda toplam kaç hastam var | arama | — | — | PASS | Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| G-17 | docs/qa/gokhan-gunluk-sorular.md: #17; docs/OPEN-COMMITMENTS.md: NOTYA-SAYIM-ANDA-01 | voice | şu anda toplam kaç hastam var | arama | — | — | PASS | 🔊 Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| G-18 | docs/qa/gokhan-gunluk-sorular.md: #18 | chat | kaç hastam var | arama | — | — | PASS | Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| G-18 | docs/qa/gokhan-gunluk-sorular.md: #18 | voice | kaç hastam var | arama | — | — | PASS | 🔊 Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| G-19 | docs/qa/gokhan-gunluk-sorular.md: #19 | chat | 2 yaşından küçük hastalarım kimler | arama | — | — | PASS | Kayıtlarda 0 hasta. Filtre: 2 yaşından küçük. |
| G-19 | docs/qa/gokhan-gunluk-sorular.md: #19 | voice | 2 yaşından küçük hastalarım kimler | arama | — | — | PASS | 🔊 Kayıtlarda 0 hasta. Filtre: 2 yaşından küçük. |
| G-20 | docs/qa/gokhan-gunluk-sorular.md: #20 | chat | 1 yaşından büyük hastalarım kimler | arama | — | — | PASS | Kayıtlarda 4 hasta. Filtre: 1 yaşından büyük: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 1 yaşından büyük · 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene ·… |
| G-20 | docs/qa/gokhan-gunluk-sorular.md: #20 | voice | 1 yaşından büyük hastalarım kimler | arama | — | — | PASS | 🔊 Kayıtlarda 4 hasta. Filtre: 1 yaşından büyük: 1) Emircan Karaoğlu — 1 yaşından büyük, 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene.… |
| G-21 | docs/qa/gokhan-gunluk-sorular.md: #21; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01; docs/OPEN-… | chat | aşı kaydı olan hastalarım kimler | arama | — | — | **FAIL** | Kayıtlarda 0 hasta. Filtre: Aşı. |
| G-21 | docs/qa/gokhan-gunluk-sorular.md: #21; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01; docs/OPEN-… | voice | aşı kaydı olan hastalarım kimler | arama | — | — | **FAIL** | 🔊 Kayıtlarda 0 hasta. Filtre: Aşı. |
| G-22 | docs/qa/gokhan-gunluk-sorular.md: #22; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01 | chat | ilaç kullanan hastam var mı | arama | — | — | **FAIL** | Kayıtlarda 0 hasta. Filtre: İlaç. |
| G-22 | docs/qa/gokhan-gunluk-sorular.md: #22; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-PENCERE-VARSAYILAN-01 | voice | ilaç kullanan hastam var mı | arama | — | — | **FAIL** | 🔊 Kayıtlarda 0 hasta. Filtre: İlaç. |
| G-23 | docs/qa/gokhan-gunluk-sorular.md: #23; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-KAYIT-PENCERE-01 | chat | bu ay kayıt olan hastalarım | arama | — | — | MANUAL | Bu ay 5 hasta. Filtre: bu ay: 1. Tarık Özdemir (d.t. 25.02.2024) — bu ay · 2 yaş 7 ay · 01.10.2026 muayene · 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür · ilaç: Amoksisilin … |
| G-23 | docs/qa/gokhan-gunluk-sorular.md: #23; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-KAYIT-PENCERE-01 | voice | bu ay kayıt olan hastalarım | arama | — | — | MANUAL | 🔊 Bu ay 5 hasta. Filtre: bu ay: 1) Tarık Özdemir — bu ay, 2 yaş 7 ay, 01.10.2026 muayene, 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür, ilaç: Amoksisilin 250 mg/5 ml süspans… |
| G-24 | docs/qa/gokhan-gunluk-sorular.md: #24; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-DOGUM-NEGASYON-01 | chat | doğum tarihi kayıtlı olmayan hastam var mı | kimlik | — | — | **FAIL** | Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? |
| G-24 | docs/qa/gokhan-gunluk-sorular.md: #24; docs/OPEN-COMMITMENTS.md: NOTYA-ARAMA-DOGUM-NEGASYON-01 | voice | doğum tarihi kayıtlı olmayan hastam var mı | kimlik | — | — | **FAIL** | 🔊 Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? |
| G-25 | docs/qa/gokhan-gunluk-sorular.md: #25 | chat | Emircan'ın hemoglobin değeri kaçtı | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-26 | docs/qa/gokhan-gunluk-sorular.md: #26 | chat | ferritin sonucu ne | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-27 | docs/qa/gokhan-gunluk-sorular.md: #27 | chat | WBC kaç | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-28 | docs/qa/gokhan-gunluk-sorular.md: #28 | chat | MCV ve MCHC değerlerini oku | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-29 | docs/qa/gokhan-gunluk-sorular.md: #29 | chat | Emircan'ın Hct değeri yüzde kaç | model | — | Emircan Karaoğlu | MANUAL | Vekil yanıt Hocam. |
| G-25 | docs/qa/gokhan-gunluk-sorular.md: #25 | voice | Emircan'ın hemoglobin değeri kaçtı | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-26 | docs/qa/gokhan-gunluk-sorular.md: #26 | voice | ferritin sonucu ne | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-27 | docs/qa/gokhan-gunluk-sorular.md: #27 | voice | WBC kaç | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-28 | docs/qa/gokhan-gunluk-sorular.md: #28 | voice | MCV ve MCHC değerlerini oku | oku | — | Emircan Karaoğlu | **FAIL** | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| G-29 | docs/qa/gokhan-gunluk-sorular.md: #29 | voice | Emircan'ın Hct değeri yüzde kaç | model | — | Emircan Karaoğlu | MANUAL | 🔊 Vekil yanıt Hocam. |
| G-30 | docs/qa/gokhan-gunluk-sorular.md: #30 | chat | Emircan'ın topuk kanı sonuçları normal mi | model | — | Emircan Karaoğlu | MANUAL | Vekil yanıt Hocam. |
| G-30 | docs/qa/gokhan-gunluk-sorular.md: #30 | voice | Emircan'ın topuk kanı sonuçları normal mi | model | — | Emircan Karaoğlu | MANUAL | 🔊 Vekil yanıt Hocam. |
| G-31 | docs/qa/gokhan-gunluk-sorular.md: #31 | chat | Emircan'ın aşıları tam mı | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-31 | docs/qa/gokhan-gunluk-sorular.md: #31 | voice | Emircan'ın aşıları tam mı | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-32 | docs/qa/gokhan-gunluk-sorular.md: #32 | chat | Emircan'ın eksik aşısı var mı | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-32 | docs/qa/gokhan-gunluk-sorular.md: #32 | voice | Emircan'ın eksik aşısı var mı | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-33 | docs/qa/gokhan-gunluk-sorular.md: #33 | chat | Tarık'a hiç aşı yapıldı mı | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada aşı: kayıtlı aşı yok. |
| G-33 | docs/qa/gokhan-gunluk-sorular.md: #33 | voice | Tarık'a hiç aşı yapıldı mı | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada aşı: kayıtlı aşı yok. |
| G-34 | docs/qa/gokhan-gunluk-sorular.md: #34; lib/asistan/ayseRota.test.ts: Ayşe’nin son aşı tarihi ne; docs/OPEN-COM… | chat | Ayşe'nin son aşı tarihi ne | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| G-34 | docs/qa/gokhan-gunluk-sorular.md: #34; lib/asistan/ayseRota.test.ts: Ayşe’nin son aşı tarihi ne; docs/OPEN-COM… | voice | Ayşe'nin son aşı tarihi ne | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| G-35 | docs/qa/gokhan-gunluk-sorular.md: #35 | chat | Emircan'ın kullandığı ilaç var mı | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-35 | docs/qa/gokhan-gunluk-sorular.md: #35 | voice | Emircan'ın kullandığı ilaç var mı | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-36 | docs/qa/gokhan-gunluk-sorular.md: #36 | chat | Tarık'a daha önce antibiyotik yazdım mı | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| G-36 | docs/qa/gokhan-gunluk-sorular.md: #36 | voice | Tarık'a daha önce antibiyotik yazdım mı | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| G-37 | docs/qa/gokhan-gunluk-sorular.md: #37 | chat | Ayşe'nin reçete geçmişini göster | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| G-37 | docs/qa/gokhan-gunluk-sorular.md: #37 | voice | Ayşe'nin reçete geçmişini göster | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| G-38 | docs/qa/gokhan-gunluk-sorular.md: #38 | chat | yarın randevum var mı | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| G-38 | docs/qa/gokhan-gunluk-sorular.md: #38 | voice | yarın randevum var mı | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| G-39 | docs/qa/gokhan-gunluk-sorular.md: #39 | chat | bugün kaç hastam geliyor | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| G-39 | docs/qa/gokhan-gunluk-sorular.md: #39 | voice | bugün kaç hastam geliyor | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| G-40 | docs/qa/gokhan-gunluk-sorular.md: #40; docs/OPEN-COMMITMENTS.md: NOTYA-SES-KART-01 | chat | Emircan'ın bir sonraki kontrolü ne zaman | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| G-40 | docs/qa/gokhan-gunluk-sorular.md: #40; docs/OPEN-COMMITMENTS.md: NOTYA-SES-KART-01 | voice | Emircan'ın bir sonraki kontrolü ne zaman | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| G-41 | docs/qa/gokhan-gunluk-sorular.md: #41 | chat | Ayşe'nin hiç ateşi olmadı mı | hizli-kart | — | Ayşe Bozkurt | MANUAL | Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. |
| G-41 | docs/qa/gokhan-gunluk-sorular.md: #41 | voice | Ayşe'nin hiç ateşi olmadı mı | hizli-kart | — | Ayşe Bozkurt | MANUAL | 🔊 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Ki… |
| G-42 | docs/qa/gokhan-gunluk-sorular.md: #42 | chat | Emircan'ın allerjisi var mı | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| G-42 | docs/qa/gokhan-gunluk-sorular.md: #42 | voice | Emircan'ın allerjisi var mı | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| G-43 | docs/qa/gokhan-gunluk-sorular.md: #43 | chat | Olcay'ın kronik hastalığı var mı | hizli-kart | — | Olcay Santoro | PASS | Olcay Santoro — dosyada kronik hastalık: kayıt yok. |
| G-43 | docs/qa/gokhan-gunluk-sorular.md: #43 | voice | Olcay'ın kronik hastalığı var mı | hizli-kart | — | Olcay Santoro | PASS | 🔊 Olcay Santoro — dosyada kronik hastalık: kayıt yok. |
| G-45 | docs/qa/gokhan-gunluk-sorular.md: #45 | chat | Ayşe'yi aç | model | — | Ayşe Bozkurt | MANUAL | Vekil yanıt Hocam. |
| G-45 | docs/qa/gokhan-gunluk-sorular.md: #45 | voice | Ayşe'yi aç | model | — | Ayşe Bozkurt | MANUAL | 🔊 Vekil yanıt Hocam. |
| G-46 | docs/qa/gokhan-gunluk-sorular.md: #46 | chat | Bugün nasılsın Ayşe | model | — | — | PASS | Vekil yanıt Hocam. |
| G-46 | docs/qa/gokhan-gunluk-sorular.md: #46 | voice | Bugün nasılsın Ayşe | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-47 | docs/qa/gokhan-gunluk-sorular.md: #47 | chat | Sen neler yapabilirsin | model | — | — | PASS | Vekil yanıt Hocam. |
| G-47 | docs/qa/gokhan-gunluk-sorular.md: #47 | voice | Sen neler yapabilirsin | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-48 | docs/qa/gokhan-gunluk-sorular.md: #48 | chat | Teşekkürler, iyi çalışmalar | model | — | — | PASS | Vekil yanıt Hocam. |
| G-48 | docs/qa/gokhan-gunluk-sorular.md: #48 | voice | Teşekkürler, iyi çalışmalar | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-49 | docs/qa/gokhan-gunluk-sorular.md: #49 | chat | Ayşe için SOAP notu taslağı hazırla | model | forced required; called asi_kaydi_ekle; card asi_kaydi_ekle (2 missing) | Ayşe Bozkurt | MANUAL | Ayşe Bozkurt için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| G-49 | docs/qa/gokhan-gunluk-sorular.md: #49 | voice | Ayşe için SOAP notu taslağı hazırla | model | forced required; called asi_kaydi_ekle; card asi_kaydi_ekle (2 missing) | Ayşe Bozkurt | MANUAL | 🔊 Ayşe Bozkurt için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| G-50 | docs/qa/gokhan-gunluk-sorular.md: #50 | chat | Tarık'a son yazdığım notu oku | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| G-50 | docs/qa/gokhan-gunluk-sorular.md: #50 | voice | Tarık'a son yazdığım notu oku | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| G-K1 | docs/qa/gokhan-gunluk-sorular.md: #K1; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-01 | chat | Tesla almak istiyorum | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K2 | docs/qa/gokhan-gunluk-sorular.md: #K2 | chat | Peki Model Y mi Model 3 mü daha iyi | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K1 | docs/qa/gokhan-gunluk-sorular.md: #K1; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-01 | voice | Tesla almak istiyorum | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K2 | docs/qa/gokhan-gunluk-sorular.md: #K2 | voice | Peki Model Y mi Model 3 mü daha iyi | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K3 | docs/qa/gokhan-gunluk-sorular.md: #K3 | chat | Yarın hava nasıl olacak | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K3 | docs/qa/gokhan-gunluk-sorular.md: #K3 | voice | Yarın hava nasıl olacak | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K4 | docs/qa/gokhan-gunluk-sorular.md: #K4 | chat | Fenerbahçe maçı kaç kaç bitti | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K4 | docs/qa/gokhan-gunluk-sorular.md: #K4 | voice | Fenerbahçe maçı kaç kaç bitti | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K5A | docs/qa/gokhan-gunluk-sorular.md: #K5 | chat | Dolar kaç TL | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K5A | docs/qa/gokhan-gunluk-sorular.md: #K5 | voice | Dolar kaç TL | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K5B | docs/qa/gokhan-gunluk-sorular.md: #K5 | chat | bitcoin al mı | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K5B | docs/qa/gokhan-gunluk-sorular.md: #K5 | voice | bitcoin al mı | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K6 | docs/qa/gokhan-gunluk-sorular.md: #K6 | chat | Bana yemek tarifi ver | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| G-K6 | docs/qa/gokhan-gunluk-sorular.md: #K6 | voice | Bana yemek tarifi ver | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| G-K7 | docs/qa/gokhan-gunluk-sorular.md: #K7 | chat | Hasta ateşi hava sıcaklığına bağlı olabilir mi | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K7 | docs/qa/gokhan-gunluk-sorular.md: #K7 | voice | Hasta ateşi hava sıcaklığına bağlı olabilir mi | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-K8 | docs/qa/gokhan-gunluk-sorular.md: #K8 | chat | Amoksisilin 12 kg çocuk için doz | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K8 | docs/qa/gokhan-gunluk-sorular.md: #K8 | voice | Amoksisilin 12 kg çocuk için doz | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-K9 | docs/qa/gokhan-gunluk-sorular.md: #K9 | chat | Bugün kaç randevum var | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| G-K9 | docs/qa/gokhan-gunluk-sorular.md: #K9 | voice | Bugün kaç randevum var | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| G-K10A | docs/qa/gokhan-gunluk-sorular.md: #K10 | chat | Teşekkürler | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K10A | docs/qa/gokhan-gunluk-sorular.md: #K10 | voice | Teşekkürler | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-K10B | docs/qa/gokhan-gunluk-sorular.md: #K10 | chat | tamam | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K10B | docs/qa/gokhan-gunluk-sorular.md: #K10 | voice | tamam | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-K10C | docs/qa/gokhan-gunluk-sorular.md: #K10 | chat | tekrar söyler misin | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K10C | docs/qa/gokhan-gunluk-sorular.md: #K10 | voice | tekrar söyler misin | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| G-K11 | docs/qa/gokhan-gunluk-sorular.md: #K11 | chat | Sen kimsin | model | — | — | PASS | Vekil yanıt Hocam. |
| G-K11 | docs/qa/gokhan-gunluk-sorular.md: #K11 | voice | Sen kimsin | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| Y-001 | scripts/ayse-denetim/sorular-100.json: #1 | chat | Ayşe Bozkurt dosyasını aç | dosya-ac | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| Y-002 | scripts/ayse-denetim/sorular-100.json: #2 | chat | Bu hastayı bana kısaca özetler misin? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-003 | scripts/ayse-denetim/sorular-100.json: #3 | chat | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-004 | scripts/ayse-denetim/sorular-100.json: #4 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-005 | scripts/ayse-denetim/sorular-100.json: #5 | chat | Büyümesi nasıl gidiyor? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-006 | scripts/ayse-denetim/sorular-100.json: #6 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-007 | scripts/ayse-denetim/sorular-100.json: #7 | chat | Son muayeneden bu yana neler değişmiş? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-008 | scripts/ayse-denetim/sorular-100.json: #8 | chat | Daha önce aynı şikayetle geldi mi? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-009 | scripts/ayse-denetim/sorular-100.json: #9 | chat | Gelişimi yaşına uygun mu? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-010 | scripts/ayse-denetim/sorular-100.json: #10 | chat | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-011 | scripts/ayse-denetim/sorular-100.json: #11 | chat | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-012 | scripts/ayse-denetim/sorular-100.json: #12 | chat | Kan grubu ne? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-013 | scripts/ayse-denetim/sorular-100.json: #13 | chat | Alerjisi var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada alerji: kayıt yok. |
| Y-014 | scripts/ayse-denetim/sorular-100.json: #14 | chat | Kaç yaşında? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-015 | scripts/ayse-denetim/sorular-100.json: #15 | chat | Son tanısı neydi? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| Y-016 | scripts/ayse-denetim/sorular-100.json: #16 | chat | Son reçetede ne yazdık? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada son reçete: Klacid 250 mg/5 ml süspansiyon, Calpol süspansiyon (24 Eylül 2026). |
| Y-017 | scripts/ayse-denetim/sorular-100.json: #17 | chat | Klacid dozu neydi? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-018 | scripts/ayse-denetim/sorular-100.json: #18 | chat | Kronik hastalığı var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada kronik hastalık: kayıt yok. |
| Y-019 | scripts/ayse-denetim/sorular-100.json: #19 | chat | Gelen belgeler kutusunda bir şey var mı? | model | — | Ayşe Bozkurt | MANUAL | Vekil yanıt Hocam. |
| Y-020 | scripts/ayse-denetim/sorular-100.json: #20 | chat | Sonraki randevusu ne zaman? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. |
| Y-021 | scripts/ayse-denetim/sorular-100.json: #21 | chat | Son ölçümleri neler? | kayit | — | Ayşe Bozkurt | **FAIL** | **Ayşe Bozkurt — kilo, boy ve baş çevresi ölçümleri** (1 muayene) \| Tarih \| Kilo (kg) \| Boy (cm) \| Baş çevresi (cm) \| \| --- \| --- \| --- \| --- \| \| 24.09.2026 \| 19,4 \| 1… |
| Y-022 | scripts/ayse-denetim/sorular-100.json: #22; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | hastamızın ateşi kaçtı son muayenede | kayit | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — son muayene (24.09.2026): ateş 38,9 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-023 | scripts/ayse-denetim/sorular-100.json: #23; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | bu hastanın annesinin boyu kaç | kayit | — | Ayşe Bozkurt | **FAIL** | Ayşe Bozkurt — son boy 110 cm (24.09.2026). |
| Y-024 | scripts/ayse-denetim/sorular-100.json: #24 | chat | Kaçıncı ziyareti bu? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada vizit sayısı: 1 — 24 Eylül 2026 – 24 Eylül 2026. |
| Y-001 | scripts/ayse-denetim/sorular-100.json: #1 | voice | Ayşe Bozkurt dosyasını aç | dosya-ac | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| Y-002 | scripts/ayse-denetim/sorular-100.json: #2 | voice | Bu hastayı bana kısaca özetler misin? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-003 | scripts/ayse-denetim/sorular-100.json: #3 | voice | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-004 | scripts/ayse-denetim/sorular-100.json: #4 | voice | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-005 | scripts/ayse-denetim/sorular-100.json: #5 | voice | Büyümesi nasıl gidiyor? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-006 | scripts/ayse-denetim/sorular-100.json: #6 | voice | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-007 | scripts/ayse-denetim/sorular-100.json: #7 | voice | Son muayeneden bu yana neler değişmiş? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-008 | scripts/ayse-denetim/sorular-100.json: #8 | voice | Daha önce aynı şikayetle geldi mi? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-009 | scripts/ayse-denetim/sorular-100.json: #9 | voice | Gelişimi yaşına uygun mu? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-010 | scripts/ayse-denetim/sorular-100.json: #10 | voice | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-011 | scripts/ayse-denetim/sorular-100.json: #11 | voice | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-012 | scripts/ayse-denetim/sorular-100.json: #12 | voice | Kan grubu ne? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-013 | scripts/ayse-denetim/sorular-100.json: #13 | voice | Alerjisi var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada alerji: kayıt yok. |
| Y-014 | scripts/ayse-denetim/sorular-100.json: #14 | voice | Kaç yaşında? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-015 | scripts/ayse-denetim/sorular-100.json: #15 | voice | Son tanısı neydi? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| Y-016 | scripts/ayse-denetim/sorular-100.json: #16 | voice | Son reçetede ne yazdık? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada son reçete: Klacid 250 mg/5 ml süspansiyon, Calpol süspansiyon (24 Eylül 2026). |
| Y-017 | scripts/ayse-denetim/sorular-100.json: #17 | voice | Klacid dozu neydi? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-018 | scripts/ayse-denetim/sorular-100.json: #18 | voice | Kronik hastalığı var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada kronik hastalık: kayıt yok. |
| Y-019 | scripts/ayse-denetim/sorular-100.json: #19 | voice | Gelen belgeler kutusunda bir şey var mı? | model | — | Ayşe Bozkurt | MANUAL | 🔊 Vekil yanıt Hocam. |
| Y-020 | scripts/ayse-denetim/sorular-100.json: #20 | voice | Sonraki randevusu ne zaman? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. |
| Y-021 | scripts/ayse-denetim/sorular-100.json: #21 | voice | Son ölçümleri neler? | kayit | — | Ayşe Bozkurt | **FAIL** | 🔊 Ayşe Bozkurt'un kilo, boy ve baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 1 kayıt var. Son kilo 19,4 kg (24.09.2026). Baş çevresi için kayıtlı ölçüm yok. 🖥 **Ayş… |
| Y-022 | scripts/ayse-denetim/sorular-100.json: #22; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | hastamızın ateşi kaçtı son muayenede | kayit | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — son muayene (24.09.2026): ateş 38,9 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-023 | scripts/ayse-denetim/sorular-100.json: #23; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | bu hastanın annesinin boyu kaç | kayit | — | Ayşe Bozkurt | **FAIL** | 🔊 Ayşe Bozkurt — son boy 110 cm (24.09.2026). |
| Y-024 | scripts/ayse-denetim/sorular-100.json: #24 | voice | Kaçıncı ziyareti bu? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada vizit sayısı: 1 — 24 Eylül 2026 – 24 Eylül 2026. |
| Y-025 | scripts/ayse-denetim/sorular-100.json: #25 | chat | Tarik Ozdemir dosyasini ac | dosya-ac | — | Tarık Özdemir | PASS | Tarık Özdemir dosyası açık Hocam. Ne sormak istersiniz? |
| Y-026 | scripts/ayse-denetim/sorular-100.json: #26 | chat | ozetle | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-027 | scripts/ayse-denetim/sorular-100.json: #27 | chat | ilaclari neler | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-028 | scripts/ayse-denetim/sorular-100.json: #28 | chat | amoksisilin dozu ne kadardi | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-029 | scripts/ayse-denetim/sorular-100.json: #29 | chat | kaç gün verdik | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-030 | scripts/ayse-denetim/sorular-100.json: #30 | chat | asilari tam mi | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-031 | scripts/ayse-denetim/sorular-100.json: #31 | chat | kilosu kac | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49,5 cm. |
| Y-032 | scripts/ayse-denetim/sorular-100.json: #32 | chat | boyu | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir — son boy 92 cm (01.10.2026). |
| Y-033 | scripts/ayse-denetim/sorular-100.json: #33 | chat | bas cevresi | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir — son baş çevresi 49,5 cm (01.10.2026). |
| Y-034 | scripts/ayse-denetim/sorular-100.json: #34 | chat | persentili nasıl | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-035 | scripts/ayse-denetim/sorular-100.json: #35 | chat | kac yasinda | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada yaş: 2 yaşında. |
| Y-036 | scripts/ayse-denetim/sorular-100.json: #36 | chat | kaç aylık | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-037 | scripts/ayse-denetim/sorular-100.json: #37 | chat | kan grubu | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada kan grubu: A Rh-. |
| Y-038 | scripts/ayse-denetim/sorular-100.json: #38 | chat | penisilin alerjisi var mı | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada alerji: kayıt yok. Dosyada son reçete: Amoksisilin 250 mg/5 ml süspansiyon (1 Ekim 2026). |
| Y-039 | scripts/ayse-denetim/sorular-100.json: #39 | chat | tahlil sonuçları geldi mi | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-040 | scripts/ayse-denetim/sorular-100.json: #40 | chat | tanı neydi | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son tanı: Akut otitis media. |
| Y-041 | scripts/ayse-denetim/sorular-100.json: #41; docs/OPEN-COMMITMENTS.md: NOTYA-SES-KART-01 | chat | ne zaman kontrole çağırdık | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| Y-042 | scripts/ayse-denetim/sorular-100.json: #42; docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | chat | babasının telefonu | kimlik | — | Tarık Özdemir | PASS | Tarık Özdemir — Babasının telefonu ayrıca kayıtlı değil. Dosyadaki iletişim telefonu: 0535 000 44 55 (hasta kartı; kime ait olduğu yazılı değil). |
| Y-043 | scripts/ayse-denetim/sorular-100.json: #43 | chat | Ayşe, Tarık Özdemir'in son muayenesinde ateşi kaçtı | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-044 | scripts/ayse-denetim/sorular-100.json: #44; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | kendisi daha önce kulak enfeksiyonu geçirmiş mi | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-045 | scripts/ayse-denetim/sorular-100.json: #45 | chat | gözümden kaçan bir şey var mı | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-025 | scripts/ayse-denetim/sorular-100.json: #25 | voice | Tarik Ozdemir dosyasini ac | dosya-ac | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir dosyası açık Hocam. Ne sormak istersiniz? |
| Y-026 | scripts/ayse-denetim/sorular-100.json: #26 | voice | ozetle | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-027 | scripts/ayse-denetim/sorular-100.json: #27 | voice | ilaclari neler | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-028 | scripts/ayse-denetim/sorular-100.json: #28 | voice | amoksisilin dozu ne kadardi | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-029 | scripts/ayse-denetim/sorular-100.json: #29 | voice | kaç gün verdik | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-030 | scripts/ayse-denetim/sorular-100.json: #30 | voice | asilari tam mi | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-031 | scripts/ayse-denetim/sorular-100.json: #31 | voice | kilosu kac | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 … |
| Y-032 | scripts/ayse-denetim/sorular-100.json: #32 | voice | boyu | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son boy 92 cm (01.10.2026). |
| Y-033 | scripts/ayse-denetim/sorular-100.json: #33 | voice | bas cevresi | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son baş çevresi 49,5 cm (01.10.2026). |
| Y-034 | scripts/ayse-denetim/sorular-100.json: #34 | voice | persentili nasıl | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-035 | scripts/ayse-denetim/sorular-100.json: #35 | voice | kac yasinda | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada yaş: 2 yaşında. |
| Y-036 | scripts/ayse-denetim/sorular-100.json: #36 | voice | kaç aylık | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-037 | scripts/ayse-denetim/sorular-100.json: #37 | voice | kan grubu | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada kan grubu: A Rh-. |
| Y-038 | scripts/ayse-denetim/sorular-100.json: #38 | voice | penisilin alerjisi var mı | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada alerji: kayıt yok. Dosyada son reçete: Amoksisilin 250 mg/5 ml süspansiyon (1 Ekim 2026). |
| Y-039 | scripts/ayse-denetim/sorular-100.json: #39 | voice | tahlil sonuçları geldi mi | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-040 | scripts/ayse-denetim/sorular-100.json: #40 | voice | tanı neydi | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son tanı: Akut otitis media. |
| Y-041 | scripts/ayse-denetim/sorular-100.json: #41; docs/OPEN-COMMITMENTS.md: NOTYA-SES-KART-01 | voice | ne zaman kontrole çağırdık | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| Y-042 | scripts/ayse-denetim/sorular-100.json: #42; docs/OPEN-COMMITMENTS.md: NOTYA-BETA-0925 | voice | babasının telefonu | kimlik | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Tarık Özdemir için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Babasının … |
| Y-043 | scripts/ayse-denetim/sorular-100.json: #43 | voice | Ayşe, Tarık Özdemir'in son muayenesinde ateşi kaçtı | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-044 | scripts/ayse-denetim/sorular-100.json: #44; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | kendisi daha önce kulak enfeksiyonu geçirmiş mi | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-045 | scripts/ayse-denetim/sorular-100.json: #45 | voice | gözümden kaçan bir şey var mı | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-046 | scripts/ayse-denetim/sorular-100.json: #46 | chat | Emircan Karaoğlu | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-047 | scripts/ayse-denetim/sorular-100.json: #47 | chat | Aşıları tam mı, eksik aşısı var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-048 | scripts/ayse-denetim/sorular-100.json: #48 | chat | Sıradaki aşısı hangisi? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızam… |
| Y-049 | scripts/ayse-denetim/sorular-100.json: #49 | chat | KKK aşısını ne zaman yaptık? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-050 | scripts/ayse-denetim/sorular-100.json: #50 | chat | Hepatit B kaç doz olmuş? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-051 | scripts/ayse-denetim/sorular-100.json: #51 | chat | Son hemogram sonuçları ne? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-052 | scripts/ayse-denetim/sorular-100.json: #52 | chat | Ferritin kaç çıkmış? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-053 | scripts/ayse-denetim/sorular-100.json: #53 | chat | CRP bakılmış mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-054 | scripts/ayse-denetim/sorular-100.json: #54 | chat | Son tahlil ne zaman yapılmış? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-055 | scripts/ayse-denetim/sorular-100.json: #55 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-056 | scripts/ayse-denetim/sorular-100.json: #56 | chat | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-057 | scripts/ayse-denetim/sorular-100.json: #57 | chat | Persentili kaç? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-058 | scripts/ayse-denetim/sorular-100.json: #58 | chat | Sürekli ilaçları neler? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-059 | scripts/ayse-denetim/sorular-100.json: #59 | chat | Son muayeneden bu yana neler değişmiş? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-060 | scripts/ayse-denetim/sorular-100.json: #60 | chat | Daha önce aynı şikayetle geldi mi? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-061 | scripts/ayse-denetim/sorular-100.json: #61 | chat | Gelişimi yaşına uygun mu? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-062 | scripts/ayse-denetim/sorular-100.json: #62 | chat | Toplam kaç kez geldi? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-063 | scripts/ayse-denetim/sorular-100.json: #63 | chat | Son SOAP notunu oku | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| Y-064 | scripts/ayse-denetim/sorular-100.json: #64 | chat | Son vizitte ne not düşmüşüm? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| Y-046 | scripts/ayse-denetim/sorular-100.json: #46 | voice | Emircan Karaoğlu | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-047 | scripts/ayse-denetim/sorular-100.json: #47 | voice | Aşıları tam mı, eksik aşısı var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-048 | scripts/ayse-denetim/sorular-100.json: #48 | voice | Sıradaki aşısı hangisi? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kı… |
| Y-049 | scripts/ayse-denetim/sorular-100.json: #49 | voice | KKK aşısını ne zaman yaptık? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-050 | scripts/ayse-denetim/sorular-100.json: #50 | voice | Hepatit B kaç doz olmuş? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-051 | scripts/ayse-denetim/sorular-100.json: #51 | voice | Son hemogram sonuçları ne? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-052 | scripts/ayse-denetim/sorular-100.json: #52 | voice | Ferritin kaç çıkmış? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-053 | scripts/ayse-denetim/sorular-100.json: #53 | voice | CRP bakılmış mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-054 | scripts/ayse-denetim/sorular-100.json: #54 | voice | Son tahlil ne zaman yapılmış? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-055 | scripts/ayse-denetim/sorular-100.json: #55 | voice | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-056 | scripts/ayse-denetim/sorular-100.json: #56 | voice | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-057 | scripts/ayse-denetim/sorular-100.json: #57 | voice | Persentili kaç? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-058 | scripts/ayse-denetim/sorular-100.json: #58 | voice | Sürekli ilaçları neler? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-059 | scripts/ayse-denetim/sorular-100.json: #59 | voice | Son muayeneden bu yana neler değişmiş? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-060 | scripts/ayse-denetim/sorular-100.json: #60 | voice | Daha önce aynı şikayetle geldi mi? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-061 | scripts/ayse-denetim/sorular-100.json: #61 | voice | Gelişimi yaşına uygun mu? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-062 | scripts/ayse-denetim/sorular-100.json: #62 | voice | Toplam kaç kez geldi? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| Y-063 | scripts/ayse-denetim/sorular-100.json: #63 | voice | Son SOAP notunu oku | oku | — | Emircan Karaoğlu | **FAIL** | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| Y-064 | scripts/ayse-denetim/sorular-100.json: #64 | voice | Son vizitte ne not düşmüşüm? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| Y-065 | scripts/ayse-denetim/sorular-100.json: #65; docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01 | chat | İlaçları neler? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-066 | scripts/ayse-denetim/sorular-100.json: #66 | chat | kaç kilo | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. |
| Y-067 | scripts/ayse-denetim/sorular-100.json: #67 | chat | Aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| Y-068 | scripts/ayse-denetim/sorular-100.json: #68 | chat | son muayenede tansiyonu kaçtı | kayit | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — son muayene (24.09.2026): tansiyon 95/60 mmHg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-069 | scripts/ayse-denetim/sorular-100.json: #69 | chat | Tarık Özdemir'in kilosu kaç? | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49,5 cm. |
| Y-070 | scripts/ayse-denetim/sorular-100.json: #70 | chat | peki bu hastanın kan grubu | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-065 | scripts/ayse-denetim/sorular-100.json: #65; docs/OPEN-COMMITMENTS.md: NOTYA-SAYFA-HASTA-01 | voice | İlaçları neler? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-066 | scripts/ayse-denetim/sorular-100.json: #66 | voice | kaç kilo | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Ki… |
| Y-067 | scripts/ayse-denetim/sorular-100.json: #67 | voice | Aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| Y-068 | scripts/ayse-denetim/sorular-100.json: #68 | voice | son muayenede tansiyonu kaçtı | kayit | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — son muayene (24.09.2026): tansiyon 95/60 mmHg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| Y-069 | scripts/ayse-denetim/sorular-100.json: #69 | voice | Tarık Özdemir'in kilosu kaç? | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 … |
| Y-070 | scripts/ayse-denetim/sorular-100.json: #70 | voice | peki bu hastanın kan grubu | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-071 | scripts/ayse-denetim/sorular-100.json: #71; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05c | chat | Bugün kaç hastam var? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-072 | scripts/ayse-denetim/sorular-100.json: #72 | chat | Bugün kimler geliyor? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-073 | scripts/ayse-denetim/sorular-100.json: #73 | chat | Yarın randevum var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-074 | scripts/ayse-denetim/sorular-100.json: #74 | chat | peki cuma? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-075 | scripts/ayse-denetim/sorular-100.json: #75 | chat | haftaya nasıl görünüyor | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| Y-076 | scripts/ayse-denetim/sorular-100.json: #76 | chat | dün kim geldi | takvim | — | — | PASS | 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| Y-077 | scripts/ayse-denetim/sorular-100.json: #77 | chat | bu hafta kaç randevum var | takvim | — | — | PASS | Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 3 randevu. 1 Ekim Perşembe: 11:30–11:50 Tarık Özdemir (muayene). 2 Ekim Cuma: 16:00–16:20 Nermin Aydoğan (kontrol). 3 Ekim Cumartesi… |
| Y-078 | scripts/ayse-denetim/sorular-100.json: #78 | chat | yarin sabah bosluk var mi | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu var. |
| Y-079 | scripts/ayse-denetim/sorular-100.json: #79 | chat | Bugün öğleden sonra 3'te yer var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). İstediğiniz 15:00 boş. |
| Y-080 | scripts/ayse-denetim/sorular-100.json: #80 | chat | Tarık Özdemir'in randevusu ne zaman? | takvim | — | — | **FAIL** | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-081 | scripts/ayse-denetim/sorular-100.json: #81; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-100 | chat | Olcay Santoro ne zaman gelecek? | hizli-kart | — | Olcay Santoro | PASS | Olcay Santoro — dosyada plan ve takip: kayıt yok. Dosyada randevu: planlanmış randevu yok. |
| Y-082 | scripts/ayse-denetim/sorular-100.json: #82 | chat | Kaç hastam var? | arama | — | — | PASS | Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| Y-083 | scripts/ayse-denetim/sorular-100.json: #83 | chat | kaç tane hasta kaydım var toplam | model | — | Olcay Santoro | **FAIL** | Vekil yanıt Hocam. |
| Y-084 | scripts/ayse-denetim/sorular-100.json: #84 | chat | bu hafta kaç hasta muayene ettim | arama | — | — | PASS | Bu hafta 3 hasta: Tarık Özdemir, Emircan Karaoğlu, Nermin Aydoğan. Filtre: bu hafta. |
| Y-085 | scripts/ayse-denetim/sorular-100.json: #85 | chat | En son hangi hastayı gördüm? | arama | — | Tarık Özdemir | PASS | Son gördüğünüz hasta: Tarık Özdemir. |
| Y-086 | scripts/ayse-denetim/sorular-100.json: #86 | chat | Son kaydettiğim hasta kim? | arama | — | Olcay Santoro | PASS | Son kaydettiğiniz hasta: Olcay Santoro. |
| Y-087 | scripts/ayse-denetim/sorular-100.json: #87 | chat | Hastalarımı listele | arama | — | — | PASS | Kayıtlarda 5 hasta: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 muayene. 2. Nermin Aydoğan (d.t. … |
| Y-088 | scripts/ayse-denetim/sorular-100.json: #88; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-100 product question | chat | Aşısı eksik olan hastalarım kimler? | arama | — | — | PASS | Kayıtlarda 1 hasta. Ayrıca 2 hastada aşı kaydı hiç yok (eksik sayılmadı): Ayşe Bozkurt, Tarık Özdemir: 1. Emircan Karaoğlu — Aşı: Hep A 2. doz (30.08.2026) · D vitamini profilaksi … |
| Y-089 | scripts/ayse-denetim/sorular-100.json: #89 | chat | Bu hafta tanı koyduğum pnömoni vakası kimdi? | arama | — | — | PASS | Bu hafta 0 hasta. Filtre: bu hafta · Tanı. |
| Y-090 | scripts/ayse-denetim/sorular-100.json: #90 | chat | kulak iltihabı olan çocuk kimdi | arama | — | — | PASS | Kayıtlarda 2 hasta. Filtre: Kulak: 1. Emircan Karaoğlu (d.t. 30.08.2024) — Kulak · 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 muayene. 2… |
| Y-091 | scripts/ayse-denetim/sorular-100.json: #91; lib/asistan/ayseRota.test.ts: Dün gelen ateşli çocuk kimdi? | chat | dün gelen ateşli çocuk | hizli-kart | — | Olcay Santoro | **FAIL** | Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| Y-092 | scripts/ayse-denetim/sorular-100.json: #92 | chat | E-nabız'dan yeni gelen bir şey var mı? | model | — | Olcay Santoro | not judged | Vekil yanıt Hocam. |
| Y-093 | scripts/ayse-denetim/sorular-100.json: #93; docs/OPEN-COMMITMENTS.md: sorular-100 #93 | chat | Gelen belgelerde bekleyen var mı? | model | — | Olcay Santoro | MANUAL | Vekil yanıt Hocam. |
| Y-094 | scripts/ayse-denetim/sorular-100.json: #94 | chat | Bugün kaç reçete yazdım? | arama | — | — | PASS | Bugün 0 reçete (0 hasta). Filtre: bugün · İlaç. |
| Y-095 | scripts/ayse-denetim/sorular-100.json: #95 | chat | Son reçetem hangi hastaya? | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son reçete: Amoksisilin 250 mg/5 ml süspansiyon (1 Ekim 2026). |
| Y-096 | scripts/ayse-denetim/sorular-100.json: #96 | chat | Reçeteyi nereden yazdırırım? | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| Y-071 | scripts/ayse-denetim/sorular-100.json: #71; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-05c | voice | Bugün kaç hastam var? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-072 | scripts/ayse-denetim/sorular-100.json: #72 | voice | Bugün kimler geliyor? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-073 | scripts/ayse-denetim/sorular-100.json: #73 | voice | Yarın randevum var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-074 | scripts/ayse-denetim/sorular-100.json: #74 | voice | peki cuma? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-075 | scripts/ayse-denetim/sorular-100.json: #75 | voice | haftaya nasıl görünüyor | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| Y-076 | scripts/ayse-denetim/sorular-100.json: #76 | voice | dün kim geldi | takvim | — | — | PASS | 🔊 1 Ekim Perşembe 1 randevu var Hocam: 11:30 Tarık Özdemir muayene. 🖥 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| Y-077 | scripts/ayse-denetim/sorular-100.json: #77 | voice | bu hafta kaç randevum var | takvim | — | — | PASS | 🔊 Bu hafta (28 Eylül – 4 Ekim) takviminizde 3 randevu var Hocam. İlki 1 Ekim Perşembe 11:30 Tarık Özdemir. Ayrıntı ekranınızda. 🖥 Bu hafta (28 Eylül – 4 Ekim) haftası takviminde … |
| Y-078 | scripts/ayse-denetim/sorular-100.json: #78 | voice | yarin sabah bosluk var mi | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, çalışma gününüz olarak işaretli değil Hocam; takviminizde 1 randevu var. 🖥 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu… |
| Y-079 | scripts/ayse-denetim/sorular-100.json: #79 | voice | Bugün öğleden sonra 3'te yer var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 15:00 boş. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). İstediğiniz 15:… |
| Y-080 | scripts/ayse-denetim/sorular-100.json: #80 | voice | Tarık Özdemir'in randevusu ne zaman? | takvim | — | — | **FAIL** | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| Y-081 | scripts/ayse-denetim/sorular-100.json: #81; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-100 | voice | Olcay Santoro ne zaman gelecek? | hizli-kart | — | Olcay Santoro | PASS | 🔊 Olcay Santoro — dosyada plan ve takip: kayıt yok. Dosyada randevu: planlanmış randevu yok. |
| Y-082 | scripts/ayse-denetim/sorular-100.json: #82 | voice | Kaç hastam var? | arama | — | Olcay Santoro | PASS | 🔊 Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| Y-083 | scripts/ayse-denetim/sorular-100.json: #83 | voice | kaç tane hasta kaydım var toplam | model | — | Olcay Santoro | **FAIL** | 🔊 Vekil yanıt Hocam. |
| Y-084 | scripts/ayse-denetim/sorular-100.json: #84 | voice | bu hafta kaç hasta muayene ettim | arama | — | Olcay Santoro | PASS | 🔊 Bu hafta 3 hasta: Tarık Özdemir, Emircan Karaoğlu, Nermin Aydoğan. Filtre: bu hafta. |
| Y-085 | scripts/ayse-denetim/sorular-100.json: #85 | voice | En son hangi hastayı gördüm? | arama | — | Tarık Özdemir | PASS | 🔊 Son gördüğünüz hasta: Tarık Özdemir. |
| Y-086 | scripts/ayse-denetim/sorular-100.json: #86 | voice | Son kaydettiğim hasta kim? | arama | — | Olcay Santoro | PASS | 🔊 Son kaydettiğiniz hasta: Olcay Santoro. |
| Y-087 | scripts/ayse-denetim/sorular-100.json: #87 | voice | Hastalarımı listele | arama | — | Olcay Santoro | PASS | 🔊 Kayıtlarda 5 hasta: 1) Emircan Karaoğlu — 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — 46 yaş 1 ay, 18.09.2026… |
| Y-088 | scripts/ayse-denetim/sorular-100.json: #88; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-100 product question | voice | Aşısı eksik olan hastalarım kimler? | arama | — | Olcay Santoro | PASS | 🔊 Kayıtlarda 1 hasta. Ayrıca 2 hastada aşı kaydı hiç yok (eksik sayılmadı): Ayşe Bozkurt, Tarık Özdemir: 1) Emircan Karaoğlu — Aşı: Hep A 2. doz (30.08.2026), D vitamini profilaks… |
| Y-089 | scripts/ayse-denetim/sorular-100.json: #89 | voice | Bu hafta tanı koyduğum pnömoni vakası kimdi? | arama | — | Olcay Santoro | PASS | 🔊 Bu hafta 0 hasta. Filtre: bu hafta, Tanı. 🖥 Bu hafta 0 hasta. Filtre: bu hafta · Tanı. |
| Y-090 | scripts/ayse-denetim/sorular-100.json: #90 | voice | kulak iltihabı olan çocuk kimdi | arama | — | Olcay Santoro | PASS | 🔊 Kayıtlarda 2 hasta. Filtre: Kulak: 1) Emircan Karaoğlu — Kulak, 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Tarık Özdemir — Ku… |
| Y-091 | scripts/ayse-denetim/sorular-100.json: #91; lib/asistan/ayseRota.test.ts: Dün gelen ateşli çocuk kimdi? | voice | dün gelen ateşli çocuk | hizli-kart | — | Olcay Santoro | **FAIL** | 🔊 Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| Y-092 | scripts/ayse-denetim/sorular-100.json: #92 | voice | E-nabız'dan yeni gelen bir şey var mı? | model | — | Olcay Santoro | not judged | 🔊 Vekil yanıt Hocam. |
| Y-093 | scripts/ayse-denetim/sorular-100.json: #93; docs/OPEN-COMMITMENTS.md: sorular-100 #93 | voice | Gelen belgelerde bekleyen var mı? | model | — | Olcay Santoro | MANUAL | 🔊 Vekil yanıt Hocam. |
| Y-094 | scripts/ayse-denetim/sorular-100.json: #94 | voice | Bugün kaç reçete yazdım? | arama | — | Olcay Santoro | PASS | 🔊 Bugün 0 reçete (0 hasta). Filtre: bugün, İlaç. 🖥 Bugün 0 reçete (0 hasta). Filtre: bugün · İlaç. |
| Y-095 | scripts/ayse-denetim/sorular-100.json: #95 | voice | Son reçetem hangi hastaya? | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son reçete: Amoksisilin 250 mg/5 ml süspansiyon (1 Ekim 2026). |
| Y-096 | scripts/ayse-denetim/sorular-100.json: #96 | voice | Reçeteyi nereden yazdırırım? | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| Y-097 | scripts/ayse-denetim/sorular-100.json: #97 | chat | QA Test Hasta 2 dosyasını aç | arama | — | — | PASS | Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| Y-098 | scripts/ayse-denetim/sorular-100.json: #98 | chat | Selim Erkoç'un dosyasını aç | arama | — | — | PASS | Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| Y-099 | scripts/ayse-denetim/sorular-100.json: #99 | chat | Mehmet Yılmaz kaç yaşında? | model | — | — | not judged | Vekil yanıt Hocam. |
| Y-100 | scripts/ayse-denetim/sorular-100.json: #100; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | chat | Ayşe Bozkurt kaç yaşında | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-101 | scripts/ayse-denetim/sorular-100.json: #101 | chat | Ayşe kaç yaşında | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-102 | scripts/ayse-denetim/sorular-100.json: #102 | chat | ... | gurultu | — | Ayşe Bozkurt | PASS | (empty) |
| Y-103 | scripts/ayse-denetim/sorular-100.json: #103 | chat | Emircan Karaoglu'nun kaç aşısı var | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| Y-097 | scripts/ayse-denetim/sorular-100.json: #97 | voice | QA Test Hasta 2 dosyasını aç | arama | — | — | PASS | 🔊 Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| Y-098 | scripts/ayse-denetim/sorular-100.json: #98 | voice | Selim Erkoç'un dosyasını aç | arama | — | — | PASS | 🔊 Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| Y-099 | scripts/ayse-denetim/sorular-100.json: #99 | voice | Mehmet Yılmaz kaç yaşında? | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| Y-100 | scripts/ayse-denetim/sorular-100.json: #100; docs/OPEN-COMMITMENTS.md: NOTYA-SES-1TO1-02 | voice | Ayşe Bozkurt kaç yaşında | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-101 | scripts/ayse-denetim/sorular-100.json: #101 | voice | Ayşe kaç yaşında | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-102 | scripts/ayse-denetim/sorular-100.json: #102 | voice | ... | gurultu | — | Ayşe Bozkurt | PASS | (empty) |
| Y-103 | scripts/ayse-denetim/sorular-100.json: #103 | voice | Emircan Karaoglu'nun kaç aşısı var | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| T-001 | scripts/ayse-denetim/sorular-takip.json: #1 | chat | Bugün randevum var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-002 | scripts/ayse-denetim/sorular-takip.json: #2 | chat | Peki yarın? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-003 | scripts/ayse-denetim/sorular-takip.json: #3 | chat | Ya cuma? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-004 | scripts/ayse-denetim/sorular-takip.json: #4 | chat | Haftaya? | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| T-001 | scripts/ayse-denetim/sorular-takip.json: #1 | voice | Bugün randevum var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-002 | scripts/ayse-denetim/sorular-takip.json: #2 | voice | Peki yarın? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-003 | scripts/ayse-denetim/sorular-takip.json: #3 | voice | Ya cuma? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-004 | scripts/ayse-denetim/sorular-takip.json: #4 | voice | Haftaya? | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| T-005 | scripts/ayse-denetim/sorular-takip.json: #5 | chat | Yarın randevum var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-006 | scripts/ayse-denetim/sorular-takip.json: #6 | chat | Peki var mı? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-007 | scripts/ayse-denetim/sorular-takip.json: #7 | chat | e öbür gün? | takvim | — | — | PASS | 4 Ekim 2026 Pazar takviminde randevu yok. |
| T-005 | scripts/ayse-denetim/sorular-takip.json: #5 | voice | Yarın randevum var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-006 | scripts/ayse-denetim/sorular-takip.json: #6 | voice | Peki var mı? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-007 | scripts/ayse-denetim/sorular-takip.json: #7 | voice | e öbür gün? | takvim | — | — | PASS | 🔊 4 Ekim Pazar takviminizde randevu yok Hocam. 🖥 4 Ekim 2026 Pazar takviminde randevu yok. |
| T-008 | scripts/ayse-denetim/sorular-takip.json: #8 | chat | bugun randevum var mi | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-009 | scripts/ayse-denetim/sorular-takip.json: #9 | chat | peki yarin | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-010 | scripts/ayse-denetim/sorular-takip.json: #10 | chat | ya persembe | takvim | — | — | PASS | 8 Ekim 2026 Perşembe takviminde randevu yok. |
| T-008 | scripts/ayse-denetim/sorular-takip.json: #8 | voice | bugun randevum var mi | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-009 | scripts/ayse-denetim/sorular-takip.json: #9 | voice | peki yarin | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-010 | scripts/ayse-denetim/sorular-takip.json: #10 | voice | ya persembe | takvim | — | — | PASS | 🔊 8 Ekim Perşembe takviminizde randevu yok Hocam. 🖥 8 Ekim 2026 Perşembe takviminde randevu yok. |
| T-011 | scripts/ayse-denetim/sorular-takip.json: #11 | chat | Bugün kaç hastam var? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-012 | scripts/ayse-denetim/sorular-takip.json: #12 | chat | peki yarın? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-013 | scripts/ayse-denetim/sorular-takip.json: #13 | chat | kimler? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-011 | scripts/ayse-denetim/sorular-takip.json: #11 | voice | Bugün kaç hastam var? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-012 | scripts/ayse-denetim/sorular-takip.json: #12 | voice | peki yarın? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-013 | scripts/ayse-denetim/sorular-takip.json: #13 | voice | kimler? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-014 | scripts/ayse-denetim/sorular-takip.json: #14 | chat | Bu hafta kaç randevum var? | takvim | — | — | PASS | Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 3 randevu. 1 Ekim Perşembe: 11:30–11:50 Tarık Özdemir (muayene). 2 Ekim Cuma: 16:00–16:20 Nermin Aydoğan (kontrol). 3 Ekim Cumartesi… |
| T-015 | scripts/ayse-denetim/sorular-takip.json: #15 | chat | peki haftaya? | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| T-016 | scripts/ayse-denetim/sorular-takip.json: #16 | chat | bu hafta kimler geliyor? | takvim | — | — | PASS | Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 3 randevu. 1 Ekim Perşembe: 11:30–11:50 Tarık Özdemir (muayene). 2 Ekim Cuma: 16:00–16:20 Nermin Aydoğan (kontrol). 3 Ekim Cumartesi… |
| T-014 | scripts/ayse-denetim/sorular-takip.json: #14 | voice | Bu hafta kaç randevum var? | takvim | — | — | PASS | 🔊 Bu hafta (28 Eylül – 4 Ekim) takviminizde 3 randevu var Hocam. İlki 1 Ekim Perşembe 11:30 Tarık Özdemir. Ayrıntı ekranınızda. 🖥 Bu hafta (28 Eylül – 4 Ekim) haftası takviminde … |
| T-015 | scripts/ayse-denetim/sorular-takip.json: #15 | voice | peki haftaya? | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| T-016 | scripts/ayse-denetim/sorular-takip.json: #16 | voice | bu hafta kimler geliyor? | takvim | — | — | PASS | 🔊 Bu hafta (28 Eylül – 4 Ekim) takviminizde 3 randevu var Hocam. İlki 1 Ekim Perşembe 11:30 Tarık Özdemir. Ayrıntı ekranınızda. 🖥 Bu hafta (28 Eylül – 4 Ekim) haftası takviminde … |
| T-017 | scripts/ayse-denetim/sorular-takip.json: #17 | chat | yarın sabah boşluk var mı | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu var. |
| T-018 | scripts/ayse-denetim/sorular-takip.json: #18 | chat | peki öğleden sonra? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu var. |
| T-017 | scripts/ayse-denetim/sorular-takip.json: #17 | voice | yarın sabah boşluk var mı | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, çalışma gününüz olarak işaretli değil Hocam; takviminizde 1 randevu var. 🖥 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu… |
| T-018 | scripts/ayse-denetim/sorular-takip.json: #18 | voice | peki öğleden sonra? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, çalışma gününüz olarak işaretli değil Hocam; takviminizde 1 randevu var. 🖥 3 Ekim 2026 Cumartesi çalışma günü olarak işaretli değil; takvimde 1 randevu… |
| T-019 | scripts/ayse-denetim/sorular-takip.json: #19 | chat | Bugün saat 3'te yer var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). İstediğiniz 15:00 boş. |
| T-020 | scripts/ayse-denetim/sorular-takip.json: #20 | chat | peki yarın? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). İstediğiniz 15:00 boş. |
| T-019 | scripts/ayse-denetim/sorular-takip.json: #19 | voice | Bugün saat 3'te yer var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 15:00 boş. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). İstediğiniz 15:… |
| T-020 | scripts/ayse-denetim/sorular-takip.json: #20 | voice | peki yarın? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 15:00 boş. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). İstediğin… |
| T-021 | scripts/ayse-denetim/sorular-takip.json: #21 | chat | dün kim geldi | takvim | — | — | PASS | 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| T-022 | scripts/ayse-denetim/sorular-takip.json: #22 | chat | peki bugün? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-023 | scripts/ayse-denetim/sorular-takip.json: #23 | chat | ya yarın kimler? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-021 | scripts/ayse-denetim/sorular-takip.json: #21 | voice | dün kim geldi | takvim | — | — | PASS | 🔊 1 Ekim Perşembe 1 randevu var Hocam: 11:30 Tarık Özdemir muayene. 🖥 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| T-022 | scripts/ayse-denetim/sorular-takip.json: #22 | voice | peki bugün? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-023 | scripts/ayse-denetim/sorular-takip.json: #23 | voice | ya yarın kimler? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-024 | scripts/ayse-denetim/sorular-takip.json: #24 | chat | Bugün randevum var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-025 | scripts/ayse-denetim/sorular-takip.json: #25 | chat | peki Tarık Özdemir randevusu ne zaman? | takvim | — | — | **FAIL** | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-026 | scripts/ayse-denetim/sorular-takip.json: #26 | chat | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada randevu: 9 Ekim 2026 — kontrol. |
| T-024 | scripts/ayse-denetim/sorular-takip.json: #24 | voice | Bugün randevum var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-025 | scripts/ayse-denetim/sorular-takip.json: #25 | voice | peki Tarık Özdemir randevusu ne zaman? | takvim | — | — | **FAIL** | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-026 | scripts/ayse-denetim/sorular-takip.json: #26 | voice | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada randevu: 9 Ekim 2026 — kontrol. |
| T-027 | scripts/ayse-denetim/sorular-takip.json: #27; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | chat | Ayşe Bozkurt dosyasını aç | dosya-ac | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| T-028 | scripts/ayse-denetim/sorular-takip.json: #28; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | chat | aşıları? | kayit | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt için kayıtlı aşı yok Hocam. |
| T-029 | scripts/ayse-denetim/sorular-takip.json: #29; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | chat | eksik olan var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| T-030 | scripts/ayse-denetim/sorular-takip.json: #30; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | chat | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızam… |
| T-027 | scripts/ayse-denetim/sorular-takip.json: #27; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | voice | Ayşe Bozkurt dosyasını aç | dosya-ac | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt dosyası açık Hocam. Ne sormak istersiniz? |
| T-028 | scripts/ayse-denetim/sorular-takip.json: #28; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | voice | aşıları? | kayit | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt için kayıtlı aşı yok Hocam. |
| T-029 | scripts/ayse-denetim/sorular-takip.json: #29; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | voice | eksik olan var mı? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| T-030 | scripts/ayse-denetim/sorular-takip.json: #30; docs/OPEN-COMMITMENTS.md: NOTYA-KONUSMA-BAGLAMI-01 | voice | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kı… |
| T-031 | scripts/ayse-denetim/sorular-takip.json: #31 | chat | Emircan Karaoğlu son tahlili ne? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-032 | scripts/ayse-denetim/sorular-takip.json: #32 | chat | CRP kaç? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-033 | scripts/ayse-denetim/sorular-takip.json: #33 | chat | Peki hemogram? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-034 | scripts/ayse-denetim/sorular-takip.json: #34 | chat | bir önceki? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-031 | scripts/ayse-denetim/sorular-takip.json: #31 | voice | Emircan Karaoğlu son tahlili ne? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-032 | scripts/ayse-denetim/sorular-takip.json: #32 | voice | CRP kaç? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-033 | scripts/ayse-denetim/sorular-takip.json: #33 | voice | Peki hemogram? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-034 | scripts/ayse-denetim/sorular-takip.json: #34 | voice | bir önceki? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-035 | scripts/ayse-denetim/sorular-takip.json: #35 | chat | Ayşe Bozkurt reçetesi? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-036 | scripts/ayse-denetim/sorular-takip.json: #36 | chat | dozu? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-037 | scripts/ayse-denetim/sorular-takip.json: #37 | chat | kaç gün? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-035 | scripts/ayse-denetim/sorular-takip.json: #35 | voice | Ayşe Bozkurt reçetesi? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-036 | scripts/ayse-denetim/sorular-takip.json: #36 | voice | dozu? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-037 | scripts/ayse-denetim/sorular-takip.json: #37 | voice | kaç gün? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-038 | scripts/ayse-denetim/sorular-takip.json: #38 | chat | Tarık recetesi ne | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-039 | scripts/ayse-denetim/sorular-takip.json: #39 | chat | dozu | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-040 | scripts/ayse-denetim/sorular-takip.json: #40 | chat | kac gun verdik | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-038 | scripts/ayse-denetim/sorular-takip.json: #38 | voice | Tarık recetesi ne | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-039 | scripts/ayse-denetim/sorular-takip.json: #39 | voice | dozu | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-040 | scripts/ayse-denetim/sorular-takip.json: #40 | voice | kac gun verdik | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-041 | scripts/ayse-denetim/sorular-takip.json: #41 | chat | Emircan Karaoğlu kaç kilo? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-042 | scripts/ayse-denetim/sorular-takip.json: #42 | chat | boyu? | kayit | — | Emircan Karaoğlu | **FAIL** | Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| T-043 | scripts/ayse-denetim/sorular-takip.json: #43 | chat | persentili? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-044 | scripts/ayse-denetim/sorular-takip.json: #44 | chat | baş çevresi? | kayit | — | Emircan Karaoğlu | **FAIL** | Emircan Karaoğlu için kayıtlı baş çevresi ölçümü yok Hocam (son muayene). |
| T-041 | scripts/ayse-denetim/sorular-takip.json: #41 | voice | Emircan Karaoğlu kaç kilo? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-042 | scripts/ayse-denetim/sorular-takip.json: #42 | voice | boyu? | kayit | — | Emircan Karaoğlu | **FAIL** | 🔊 Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). |
| T-043 | scripts/ayse-denetim/sorular-takip.json: #43 | voice | persentili? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-044 | scripts/ayse-denetim/sorular-takip.json: #44 | voice | baş çevresi? | kayit | — | Emircan Karaoğlu | **FAIL** | 🔊 Emircan Karaoğlu için kayıtlı baş çevresi ölçümü yok Hocam (son muayene). |
| T-045 | scripts/ayse-denetim/sorular-takip.json: #45 | chat | Tarık Özdemir son muayenesinde ateşi kaçtı | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| T-046 | scripts/ayse-denetim/sorular-takip.json: #46 | chat | tanısı? | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son tanı: Akut otitis media. |
| T-047 | scripts/ayse-denetim/sorular-takip.json: #47 | chat | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son tanı: Otitis media, iyileşmiş. |
| T-045 | scripts/ayse-denetim/sorular-takip.json: #45 | voice | Tarık Özdemir son muayenesinde ateşi kaçtı | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| T-046 | scripts/ayse-denetim/sorular-takip.json: #46 | voice | tanısı? | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son tanı: Akut otitis media. |
| T-047 | scripts/ayse-denetim/sorular-takip.json: #47 | voice | peki Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son tanı: Otitis media, iyileşmiş. |
| T-048 | scripts/ayse-denetim/sorular-takip.json: #48 | chat | Emircan Karaoğlu ferritin kaç? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-049 | scripts/ayse-denetim/sorular-takip.json: #49 | chat | peki Tarık'ın? | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-048 | scripts/ayse-denetim/sorular-takip.json: #48 | voice | Emircan Karaoğlu ferritin kaç? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-049 | scripts/ayse-denetim/sorular-takip.json: #49 | voice | peki Tarık'ın? | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-050 | scripts/ayse-denetim/sorular-takip.json: #50 | chat | Kaç hastam var? | arama | — | — | PASS | Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| T-051 | scripts/ayse-denetim/sorular-takip.json: #51 | chat | bu hafta kaç hasta muayene ettim? | arama | — | — | PASS | Bu hafta 3 hasta: Tarık Özdemir, Emircan Karaoğlu, Nermin Aydoğan. Filtre: bu hafta. |
| T-052 | scripts/ayse-denetim/sorular-takip.json: #52 | chat | peki son 30 gün? | arama | — | — | PASS | Son 30 gun 5 hasta: Emircan Karaoğlu, Ayşe Bozkurt, Tarık Özdemir, Nermin Aydoğan, Olcay Santoro. Filtre: son 30 gun. |
| T-050 | scripts/ayse-denetim/sorular-takip.json: #50 | voice | Kaç hastam var? | arama | — | — | PASS | 🔊 Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| T-051 | scripts/ayse-denetim/sorular-takip.json: #51 | voice | bu hafta kaç hasta muayene ettim? | arama | — | — | PASS | 🔊 Bu hafta 3 hasta: Tarık Özdemir, Emircan Karaoğlu, Nermin Aydoğan. Filtre: bu hafta. |
| T-052 | scripts/ayse-denetim/sorular-takip.json: #52 | voice | peki son 30 gün? | arama | — | — | PASS | 🔊 Son 30 gun 5 hasta: Emircan Karaoğlu, Ayşe Bozkurt, Tarık Özdemir, Nermin Aydoğan, Olcay Santoro. Filtre: son 30 gun. |
| T-053 | scripts/ayse-denetim/sorular-takip.json: #53 | chat | Emircan Karaoğlu dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| T-054 | scripts/ayse-denetim/sorular-takip.json: #54 | chat | kan grubu? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada kan grubu: 0 Rh+. |
| T-055 | scripts/ayse-denetim/sorular-takip.json: #55 | chat | alerjisi? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| T-056 | scripts/ayse-denetim/sorular-takip.json: #56 | chat | peki Ayşe Bozkurt'un? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada alerji: kayıt yok. |
| T-053 | scripts/ayse-denetim/sorular-takip.json: #53 | voice | Emircan Karaoğlu dosyasını aç | dosya-ac | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu dosyası açık Hocam. Ne sormak istersiniz? |
| T-054 | scripts/ayse-denetim/sorular-takip.json: #54 | voice | kan grubu? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada kan grubu: 0 Rh+. |
| T-055 | scripts/ayse-denetim/sorular-takip.json: #55 | voice | alerjisi? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| T-056 | scripts/ayse-denetim/sorular-takip.json: #56 | voice | peki Ayşe Bozkurt'un? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada alerji: kayıt yok. |
| T-057 | scripts/ayse-denetim/sorular-takip.json: #57 | chat | aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-058 | scripts/ayse-denetim/sorular-takip.json: #58 | chat | peki Emircan'ın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-059 | scripts/ayse-denetim/sorular-takip.json: #59 | chat | kilosu? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-057 | scripts/ayse-denetim/sorular-takip.json: #57 | voice | aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-058 | scripts/ayse-denetim/sorular-takip.json: #58 | voice | peki Emircan'ın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-059 | scripts/ayse-denetim/sorular-takip.json: #59 | voice | kilosu? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-060 | scripts/ayse-denetim/sorular-takip.json: #60 | chat | Emircan Karaoğlu son vizitte ne not düşmüşüm? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| T-061 | scripts/ayse-denetim/sorular-takip.json: #61 | chat | peki bir öncekinde? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-060 | scripts/ayse-denetim/sorular-takip.json: #60 | voice | Emircan Karaoğlu son vizitte ne not düşmüşüm? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| T-061 | scripts/ayse-denetim/sorular-takip.json: #61 | voice | peki bir öncekinde? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-062 | scripts/ayse-denetim/sorular-takip.json: #62 | chat | Ayşe Bozkurt gelen belgeler kutusunda bir şey var mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-063 | scripts/ayse-denetim/sorular-takip.json: #63 | chat | peki Emircan'ın? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-062 | scripts/ayse-denetim/sorular-takip.json: #62 | voice | Ayşe Bozkurt gelen belgeler kutusunda bir şey var mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-063 | scripts/ayse-denetim/sorular-takip.json: #63 | voice | peki Emircan'ın? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-064 | scripts/ayse-denetim/sorular-takip.json: #64 | chat | Emircan Karaoğlu KKK aşısını ne zaman yaptık? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-065 | scripts/ayse-denetim/sorular-takip.json: #65 | chat | peki Hepatit B? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-066 | scripts/ayse-denetim/sorular-takip.json: #66 | chat | kaç doz? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-064 | scripts/ayse-denetim/sorular-takip.json: #64 | voice | Emircan Karaoğlu KKK aşısını ne zaman yaptık? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-065 | scripts/ayse-denetim/sorular-takip.json: #65 | voice | peki Hepatit B? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-066 | scripts/ayse-denetim/sorular-takip.json: #66 | voice | kaç doz? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-067 | scripts/ayse-denetim/sorular-takip.json: #67 | chat | Tarık Özdemir dosyasını aç | dosya-ac | — | Tarık Özdemir | PASS | Tarık Özdemir dosyası açık Hocam. Ne sormak istersiniz? |
| T-068 | scripts/ayse-denetim/sorular-takip.json: #68 | chat | ilaçları? | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-069 | scripts/ayse-denetim/sorular-takip.json: #69 | chat | dozu? | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-070 | scripts/ayse-denetim/sorular-takip.json: #70 | chat | kaç gün? | model | — | Tarık Özdemir | not judged | Vekil yanıt Hocam. |
| T-067 | scripts/ayse-denetim/sorular-takip.json: #67 | voice | Tarık Özdemir dosyasını aç | dosya-ac | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir dosyası açık Hocam. Ne sormak istersiniz? |
| T-068 | scripts/ayse-denetim/sorular-takip.json: #68 | voice | ilaçları? | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-069 | scripts/ayse-denetim/sorular-takip.json: #69 | voice | dozu? | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-070 | scripts/ayse-denetim/sorular-takip.json: #70 | voice | kaç gün? | model | — | Tarık Özdemir | not judged | 🔊 Vekil yanıt Hocam. |
| T-071 | scripts/ayse-denetim/sorular-takip.json: #71 | chat | kaç hastam var bugün? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-072 | scripts/ayse-denetim/sorular-takip.json: #72 | chat | peki yarın? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-073 | scripts/ayse-denetim/sorular-takip.json: #73 | chat | peki haftaya? | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| T-074 | scripts/ayse-denetim/sorular-takip.json: #74 | chat | kimler? | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| T-071 | scripts/ayse-denetim/sorular-takip.json: #71 | voice | kaç hastam var bugün? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-072 | scripts/ayse-denetim/sorular-takip.json: #72 | voice | peki yarın? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-073 | scripts/ayse-denetim/sorular-takip.json: #73 | voice | peki haftaya? | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| T-074 | scripts/ayse-denetim/sorular-takip.json: #74 | voice | kimler? | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| T-075 | scripts/ayse-denetim/sorular-takip.json: #75 | chat | Emircan Karaoğlu büyümesi nasıl? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-076 | scripts/ayse-denetim/sorular-takip.json: #76 | chat | kilosu? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-077 | scripts/ayse-denetim/sorular-takip.json: #77 | chat | peki Tarık'ın? | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49,5 cm. |
| T-075 | scripts/ayse-denetim/sorular-takip.json: #75 | voice | Emircan Karaoğlu büyümesi nasıl? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-076 | scripts/ayse-denetim/sorular-takip.json: #76 | voice | kilosu? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-077 | scripts/ayse-denetim/sorular-takip.json: #77 | voice | peki Tarık'ın? | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 … |
| T-078 | scripts/ayse-denetim/sorular-takip.json: #78 | chat | Emircan Karaoğlu asilari tam mi | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-079 | scripts/ayse-denetim/sorular-takip.json: #79 | chat | eksik olan var mi | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızam… |
| T-080 | scripts/ayse-denetim/sorular-takip.json: #80 | chat | siradaki hangisi | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızam… |
| T-078 | scripts/ayse-denetim/sorular-takip.json: #78 | voice | Emircan Karaoğlu asilari tam mi | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-079 | scripts/ayse-denetim/sorular-takip.json: #79 | voice | eksik olan var mi | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kı… |
| T-080 | scripts/ayse-denetim/sorular-takip.json: #80 | voice | siradaki hangisi | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kı… |
| T-081 | scripts/ayse-denetim/sorular-takip.json: #81 | chat | Ayşe Bozkurt son tanısı? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| T-082 | scripts/ayse-denetim/sorular-takip.json: #82 | chat | ya ilaçları? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-083 | scripts/ayse-denetim/sorular-takip.json: #83 | chat | e dozu? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-081 | scripts/ayse-denetim/sorular-takip.json: #81 | voice | Ayşe Bozkurt son tanısı? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| T-082 | scripts/ayse-denetim/sorular-takip.json: #82 | voice | ya ilaçları? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-083 | scripts/ayse-denetim/sorular-takip.json: #83 | voice | e dozu? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-084 | scripts/ayse-denetim/sorular-takip.json: #84 | chat | Emircan Karaoğlu son tahlili ne zaman? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-085 | scripts/ayse-denetim/sorular-takip.json: #85 | chat | sonuçları? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-086 | scripts/ayse-denetim/sorular-takip.json: #86 | chat | ferritin? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-084 | scripts/ayse-denetim/sorular-takip.json: #84 | voice | Emircan Karaoğlu son tahlili ne zaman? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-085 | scripts/ayse-denetim/sorular-takip.json: #85 | voice | sonuçları? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-086 | scripts/ayse-denetim/sorular-takip.json: #86 | voice | ferritin? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-087 | scripts/ayse-denetim/sorular-takip.json: #87 | chat | dozu? | model | — | — | not judged | Vekil yanıt Hocam. |
| T-087 | scripts/ayse-denetim/sorular-takip.json: #87 | voice | dozu? | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| T-088 | scripts/ayse-denetim/sorular-takip.json: #88 | chat | Bugün kaç hastam var? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-089 | scripts/ayse-denetim/sorular-takip.json: #89 | chat | kimler? | arama | — | — | PASS | Kayıtlarda 5 hasta: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 muayene. 2. Nermin Aydoğan (d.t. … |
| T-088 | scripts/ayse-denetim/sorular-takip.json: #88 | voice | Bugün kaç hastam var? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-089 | scripts/ayse-denetim/sorular-takip.json: #89 | voice | kimler? | arama | — | — | PASS | 🔊 Kayıtlarda 5 hasta: 1) Emircan Karaoğlu — 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — 46 yaş 1 ay, 18.09.2026… |
| T-090 | scripts/ayse-denetim/sorular-takip.json: #90 | chat | Emircan Karaoğlu ferritin kaç? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-091 | scripts/ayse-denetim/sorular-takip.json: #91 | chat | peki demir? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-092 | scripts/ayse-denetim/sorular-takip.json: #92 | chat | bir önceki? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| T-090 | scripts/ayse-denetim/sorular-takip.json: #90 | voice | Emircan Karaoğlu ferritin kaç? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-091 | scripts/ayse-denetim/sorular-takip.json: #91 | voice | peki demir? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-092 | scripts/ayse-denetim/sorular-takip.json: #92 | voice | bir önceki? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| T-093 | scripts/ayse-denetim/sorular-takip.json: #93 | chat | Bu hafta kaç randevum var? | takvim | — | — | PASS | Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 3 randevu. 1 Ekim Perşembe: 11:30–11:50 Tarık Özdemir (muayene). 2 Ekim Cuma: 16:00–16:20 Nermin Aydoğan (kontrol). 3 Ekim Cumartesi… |
| T-094 | scripts/ayse-denetim/sorular-takip.json: #94 | chat | peki haftaya? | takvim | — | — | PASS | Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| T-095 | scripts/ayse-denetim/sorular-takip.json: #95 | chat | ya bu hafta kimler? | takvim | — | — | PASS | Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 3 randevu. 1 Ekim Perşembe: 11:30–11:50 Tarık Özdemir (muayene). 2 Ekim Cuma: 16:00–16:20 Nermin Aydoğan (kontrol). 3 Ekim Cumartesi… |
| T-093 | scripts/ayse-denetim/sorular-takip.json: #93 | voice | Bu hafta kaç randevum var? | takvim | — | — | PASS | 🔊 Bu hafta (28 Eylül – 4 Ekim) takviminizde 3 randevu var Hocam. İlki 1 Ekim Perşembe 11:30 Tarık Özdemir. Ayrıntı ekranınızda. 🖥 Bu hafta (28 Eylül – 4 Ekim) haftası takviminde … |
| T-094 | scripts/ayse-denetim/sorular-takip.json: #94 | voice | peki haftaya? | takvim | — | — | PASS | 🔊 Haftaya (5 Ekim – 11 Ekim) takviminizde 1 randevu var Hocam: 9 Ekim Cuma 10:30 Emircan Karaoğlu kontrol. 🖥 Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma:… |
| T-095 | scripts/ayse-denetim/sorular-takip.json: #95 | voice | ya bu hafta kimler? | takvim | — | — | PASS | 🔊 Bu hafta (28 Eylül – 4 Ekim) takviminizde 3 randevu var Hocam. İlki 1 Ekim Perşembe 11:30 Tarık Özdemir. Ayrıntı ekranınızda. 🖥 Bu hafta (28 Eylül – 4 Ekim) haftası takviminde … |
| T-096 | scripts/ayse-denetim/sorular-takip.json: #96 | chat | Ayşe Bozkurt kaç yaşında? | hizli-kart | — | Ayşe Bozkurt | PASS | Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| T-097 | scripts/ayse-denetim/sorular-takip.json: #97 | chat | peki Tarık'ın? | hizli-kart | — | Tarık Özdemir | PASS | Tarık Özdemir — dosyada yaş: 2 yaşında. |
| T-098 | scripts/ayse-denetim/sorular-takip.json: #98 | chat | ya Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| T-096 | scripts/ayse-denetim/sorular-takip.json: #96 | voice | Ayşe Bozkurt kaç yaşında? | hizli-kart | — | Ayşe Bozkurt | PASS | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| T-097 | scripts/ayse-denetim/sorular-takip.json: #97 | voice | peki Tarık'ın? | hizli-kart | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — dosyada yaş: 2 yaşında. |
| T-098 | scripts/ayse-denetim/sorular-takip.json: #98 | voice | ya Emircan'ın? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| T-099 | scripts/ayse-denetim/sorular-takip.json: #99 | chat | Bugün randevum var mı? | takvim | — | — | PASS | 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-100 | scripts/ayse-denetim/sorular-takip.json: #100 | chat | Ayşe Bozkurt aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | Vekil yanıt Hocam. |
| T-101 | scripts/ayse-denetim/sorular-takip.json: #101 | chat | peki yarın randevu var mı? | takvim | — | Ayşe Bozkurt | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-099 | scripts/ayse-denetim/sorular-takip.json: #99 | voice | Bugün randevum var mı? | takvim | — | — | PASS | 🔊 Bugün, 2 Ekim Cuma, 1 randevu var Hocam: 16:00 Nermin Aydoğan kontrol. 🖥 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| T-100 | scripts/ayse-denetim/sorular-takip.json: #100 | voice | Ayşe Bozkurt aşıları tam mı? | model | — | Ayşe Bozkurt | not judged | 🔊 Vekil yanıt Hocam. |
| T-101 | scripts/ayse-denetim/sorular-takip.json: #101 | voice | peki yarın randevu var mı? | takvim | — | Ayşe Bozkurt | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| I-01 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 1.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Bu hastayı bana kısaca özetler misin? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-01 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 1.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Bu hastayı bana kısaca özetler misin? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-01 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 1.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Bu hastayı bana kısaca özetler misin? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-02 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 2.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Son muayeneden bu yana neler değişmiş? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-02 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 2.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Son muayeneden bu yana neler değişmiş? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-02 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 2.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Son muayeneden bu yana neler değişmiş? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-03 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 3.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-03 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 3.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Büyümesi nasıl gidiyor? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-03 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 3.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Büyümesi nasıl gidiyor? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-04 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 4.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-04 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 4.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-04 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 4.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-05 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 5.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-05 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 5.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-05 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 5.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-06 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 6.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-06 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 6.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-06 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 6.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Şu anda kullandığı ilaçlar neler ve dozları nedir? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-07 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 7.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Daha önce aynı şikayetle geldi mi? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-07 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 7.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Daha önce aynı şikayetle geldi mi? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-07 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 7.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Daha önce aynı şikayetle geldi mi? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-08 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 8.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Gelişimi yaşına uygun mu? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-08 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 8.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Gelişimi yaşına uygun mu? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-08 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 8.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Gelişimi yaşına uygun mu? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-09 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 9.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-09 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 9.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-09 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 9.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Bugün yapmam veya takip etmem gereken bir şey var mı? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| I-10 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 10.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | chat | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| I-10 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 10.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | voice | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| I-10 | docs/denetim/2026-09-26-qa-sentetik-bebek.md: ## 10.; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-STANDART-01 | panel | Gözümden kaçabilecek önemli bir şey var mı? | panel | — | n/a | not judged | {"speech":"Vekil yanıt Hocam."} |
| E-01 | docs/denetim/2026-10-02-ayse-eylem.md: \| 1 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Fıstık alerjisini ekle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-01 | docs/denetim/2026-10-02-ayse-eylem.md: \| 1 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Fıstık alerjisini ekle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-02 | docs/denetim/2026-10-02-ayse-eylem.md: \| 2 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Yumurta alerjisi var, dosyaya işle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-02 | docs/denetim/2026-10-02-ayse-eylem.md: \| 2 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Yumurta alerjisi var, dosyaya işle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-03 | docs/denetim/2026-10-02-ayse-eylem.md: \| 3 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Penisilin alerjisini kaldır | model | forced alerji_kaldir; called alerji_kaldir; card alerji_kaldir (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Alerjiyi kaldır hazırladım. "undefined" dosyada alerji olarak kayıtlı değil (kayıtlı: yok). Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-03 | docs/denetim/2026-10-02-ayse-eylem.md: \| 3 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Penisilin alerjisini kaldır | model | forced alerji_kaldir; called alerji_kaldir; card alerji_kaldir (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Alerjiyi kaldır hazırladım. "undefined" dosyada alerji olarak kayıtlı değil (kayıtlı: yok). Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-04 | docs/denetim/2026-10-02-ayse-eylem.md: \| 4 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Astım tanısını kronik hastalıklara ekle | model | forced kronik_hastalik_ekle; called kronik_hastalik_ekle; card kronik_hastalik_ekle (1 mis… | Deniz Aksoy | PASS | Deniz Aksoy için Kronik hastalık ekle hazırladım. Ama Kronik hastalık boş — ekrandaki karttan doldurup onaylayın. |
| E-04 | docs/denetim/2026-10-02-ayse-eylem.md: \| 4 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Astım tanısını kronik hastalıklara ekle | model | forced kronik_hastalik_ekle; called kronik_hastalik_ekle; card kronik_hastalik_ekle (1 mis… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kronik hastalık ekle hazırladım. Ama Kronik hastalık boş — ekrandaki karttan doldurup onaylayın. |
| E-05 | docs/denetim/2026-10-02-ayse-eylem.md: \| 5 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Kronik hastalıklarına epilepsi ekleyelim | model | forced kronik_hastalik_ekle; called kronik_hastalik_ekle; card kronik_hastalik_ekle (1 mis… | Deniz Aksoy | PASS | Deniz Aksoy için Kronik hastalık ekle hazırladım. Ama Kronik hastalık boş — ekrandaki karttan doldurup onaylayın. |
| E-05 | docs/denetim/2026-10-02-ayse-eylem.md: \| 5 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Kronik hastalıklarına epilepsi ekleyelim | model | forced kronik_hastalik_ekle; called kronik_hastalik_ekle; card kronik_hastalik_ekle (1 mis… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kronik hastalık ekle hazırladım. Ama Kronik hastalık boş — ekrandaki karttan doldurup onaylayın. |
| E-06 | docs/denetim/2026-10-02-ayse-eylem.md: \| 6 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Kilosunu 24,8 kilo olarak ekle | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-06 | docs/denetim/2026-10-02-ayse-eylem.md: \| 6 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Kilosunu 24,8 kilo olarak ekle | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-07 | docs/denetim/2026-10-02-ayse-eylem.md: \| 7 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Boyu 124 santim, kilosu 24,8; kaydet | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-07 | docs/denetim/2026-10-02-ayse-eylem.md: \| 7 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Boyu 124 santim, kilosu 24,8; kaydet | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-08 | docs/denetim/2026-10-02-ayse-eylem.md: \| 8 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Ateşi 38,2, kaydet | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-08 | docs/denetim/2026-10-02-ayse-eylem.md: \| 8 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Ateşi 38,2, kaydet | model | forced olcum_ekle; called olcum_ekle; card olcum_ekle | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Ölçüm ekle hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-09 | docs/denetim/2026-10-02-ayse-eylem.md: \| 9 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Baş çevresi 52 santim, kaydet | model | forced bas_cevresi_ekle; called bas_cevresi_ekle; card bas_cevresi_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Baş çevresi hazırladım. Ama Baş çevresi boş — ekrandaki karttan doldurup onaylayın. |
| E-09 | docs/denetim/2026-10-02-ayse-eylem.md: \| 9 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Baş çevresi 52 santim, kaydet | model | forced bas_cevresi_ekle; called bas_cevresi_ekle; card bas_cevresi_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Baş çevresi hazırladım. Ama Baş çevresi boş — ekrandaki karttan doldurup onaylayın. |
| E-10 | docs/denetim/2026-10-02-ayse-eylem.md: \| 10 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | chat | Amoksisilin 250 mg günde iki kez ilaçlarına ekle | model | forced ilac_ekle; called ilac_ekle; card ilac_ekle (3 missing) | Deniz Aksoy | not judged | Deniz Aksoy için İlaç ekle hazırladım. Ama İlaç, Doz, Kullanım boş — ekrandaki karttan doldurup onaylayın. |
| E-10 | docs/denetim/2026-10-02-ayse-eylem.md: \| 10 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | voice | Amoksisilin 250 mg günde iki kez ilaçlarına ekle | model | forced ilac_ekle; called ilac_ekle; card ilac_ekle (3 missing) | Deniz Aksoy | not judged | 🔊 Deniz Aksoy için İlaç ekle hazırladım. Ama İlaç, Doz, Kullanım boş — ekrandaki karttan doldurup onaylayın. |
| E-11 | docs/denetim/2026-10-02-ayse-eylem.md: \| 11 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Zyrtec şurup 5 mg akşamları, ilaçlarına ekle | model | forced ilac_ekle; called ilac_ekle; card ilac_ekle (3 missing) | Deniz Aksoy | PASS | Deniz Aksoy için İlaç ekle hazırladım. Ama İlaç, Doz, Kullanım boş — ekrandaki karttan doldurup onaylayın. |
| E-11 | docs/denetim/2026-10-02-ayse-eylem.md: \| 11 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Zyrtec şurup 5 mg akşamları, ilaçlarına ekle | model | forced ilac_ekle; called ilac_ekle; card ilac_ekle (3 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için İlaç ekle hazırladım. Ama İlaç, Doz, Kullanım boş — ekrandaki karttan doldurup onaylayın. |
| E-12 | docs/denetim/2026-10-02-ayse-eylem.md: \| 12 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Ventolini kes | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-12 | docs/denetim/2026-10-02-ayse-eylem.md: \| 12 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Ventolini kes | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-13 | docs/denetim/2026-10-02-ayse-eylem.md: \| 13 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Demir şurubunu keser misin | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-13 | docs/denetim/2026-10-02-ayse-eylem.md: \| 13 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Demir şurubunu keser misin | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-14 | docs/denetim/2026-10-02-ayse-eylem.md: \| 14 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Pulmicort dozunu günde bir keze düşür | model | forced ilac_doz_degistir; called ilac_doz_degistir; card ilac_doz_degistir (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için İlaç dozunu değiştir hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-14 | docs/denetim/2026-10-02-ayse-eylem.md: \| 14 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Pulmicort dozunu günde bir keze düşür | model | forced ilac_doz_degistir; called ilac_doz_degistir; card ilac_doz_degistir (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için İlaç dozunu değiştir hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-15 | docs/denetim/2026-10-02-ayse-eylem.md: \| 15 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | chat | Singulair dozunu 10 miligrama çıkar | model | forced ilac_doz_degistir; called ilac_doz_degistir; card ilac_doz_degistir (1 missing) | Deniz Aksoy | not judged | Deniz Aksoy için İlaç dozunu değiştir hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-15 | docs/denetim/2026-10-02-ayse-eylem.md: \| 15 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | voice | Singulair dozunu 10 miligrama çıkar | model | forced ilac_doz_degistir; called ilac_doz_degistir; card ilac_doz_degistir (1 missing) | Deniz Aksoy | not judged | 🔊 Deniz Aksoy için İlaç dozunu değiştir hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-16 | docs/denetim/2026-10-02-ayse-eylem.md: \| 16 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Dosyasına not al: annesi sigarayı bıraktı | model | forced dosya_notu_ekle; called dosya_notu_ekle; card dosya_notu_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Dosya notu hazırladım. Ama Not boş — ekrandaki karttan doldurup onaylayın. |
| E-16 | docs/denetim/2026-10-02-ayse-eylem.md: \| 16 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Dosyasına not al: annesi sigarayı bıraktı | model | forced dosya_notu_ekle; called dosya_notu_ekle; card dosya_notu_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Dosya notu hazırladım. Ama Not boş — ekrandaki karttan doldurup onaylayın. |
| E-17 | docs/denetim/2026-10-02-ayse-eylem.md: \| 17 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Şunu not düş: kontrolde EEG istenecek | model | forced dosya_notu_ekle; called dosya_notu_ekle; card dosya_notu_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Dosya notu hazırladım. Ama Not boş — ekrandaki karttan doldurup onaylayın. |
| E-17 | docs/denetim/2026-10-02-ayse-eylem.md: \| 17 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Şunu not düş: kontrolde EEG istenecek | model | forced dosya_notu_ekle; called dosya_notu_ekle; card dosya_notu_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Dosya notu hazırladım. Ama Not boş — ekrandaki karttan doldurup onaylayın. |
| E-18 | docs/denetim/2026-10-02-ayse-eylem.md: \| 18 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | chat | Hepatit B aşısı dün yapıldı, kaydet | model | forced asi_kaydi_ekle; called asi_kaydi_ekle; card asi_kaydi_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Aşı kaydı hazırladım. Uygulama tarihi: dün, 1 Ekim 2026 Perşembe. Ama Aşı boş — ekrandaki karttan doldurup onaylayın. |
| E-18 | docs/denetim/2026-10-02-ayse-eylem.md: \| 18 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | voice | Hepatit B aşısı dün yapıldı, kaydet | model | forced asi_kaydi_ekle; called asi_kaydi_ekle; card asi_kaydi_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Uygulama tarihi: dün, 1 Ekim 2026 Perşembe. Ama Aşı boş — ekrandaki karttan doldurup onaylayın. |
| E-19 | docs/denetim/2026-10-02-ayse-eylem.md: \| 19 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | chat | KKK bugün yapıldı, dosyaya işle | model | forced asi_kaydi_ekle; called asi_kaydi_ekle; card asi_kaydi_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Aşı kaydı hazırladım. Uygulama tarihi: bugün, 2 Ekim 2026 Cuma. Ama Aşı boş — ekrandaki karttan doldurup onaylayın. |
| E-19 | docs/denetim/2026-10-02-ayse-eylem.md: \| 19 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | voice | KKK bugün yapıldı, dosyaya işle | model | forced asi_kaydi_ekle; called asi_kaydi_ekle; card asi_kaydi_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Uygulama tarihi: bugün, 2 Ekim 2026 Cuma. Ama Aşı boş — ekrandaki karttan doldurup onaylayın. |
| E-20 | docs/denetim/2026-10-02-ayse-eylem.md: \| 20 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Doğum tarihini 12.03.2019 olarak düzelt | model | forced hasta_bilgisi_duzelt; called hasta_bilgisi_duzelt; card hasta_bilgisi_duzelt | Deniz Aksoy | PASS | Deniz Aksoy için Hasta bilgisini düzelt hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-20 | docs/denetim/2026-10-02-ayse-eylem.md: \| 20 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Doğum tarihini 12.03.2019 olarak düzelt | model | forced hasta_bilgisi_duzelt; called hasta_bilgisi_duzelt; card hasta_bilgisi_duzelt | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Hasta bilgisini düzelt hazırladım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-21 | docs/denetim/2026-10-02-ayse-eylem.md: \| 21 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Yarın saat 14:00 için kontrol randevusu oluştur | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:00. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-21 | docs/denetim/2026-10-02-ayse-eylem.md: \| 21 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Yarın saat 14:00 için kontrol randevusu oluştur | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:00. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-22 | docs/denetim/2026-10-02-ayse-eylem.md: \| 22 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Haftaya salı 10:30 kontrol randevusu ver | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: 6 Ekim 2026 Salı. Saat: 10:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-22 | docs/denetim/2026-10-02-ayse-eylem.md: \| 22 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Haftaya salı 10:30 kontrol randevusu ver | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: 6 Ekim 2026 Salı. Saat: 10:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-23 | docs/denetim/2026-10-02-ayse-eylem.md: \| 23 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Randevusunu perşembeye al | model | forced randevu_tasi; called randevu_tasi | Deniz Aksoy | PASS | Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? |
| E-23 | docs/denetim/2026-10-02-ayse-eylem.md: \| 23 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Randevusunu perşembeye al | model | forced randevu_tasi; called randevu_tasi | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için 2 randevu var Hocam: 1) 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? 🖥 Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. … |
| E-24 | docs/denetim/2026-10-02-ayse-eylem.md: \| 24 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Randevu saatini 15:30 olarak değiştir | model | forced randevu_tasi; called randevu_tasi | Deniz Aksoy | PASS | Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? |
| E-24 | docs/denetim/2026-10-02-ayse-eylem.md: \| 24 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Randevu saatini 15:30 olarak değiştir | model | forced randevu_tasi; called randevu_tasi | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için 2 randevu var Hocam: 1) 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? 🖥 Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. … |
| E-25 | docs/denetim/2026-10-02-ayse-eylem.md: \| 25 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Randevusunu iptal et | model | forced randevu_iptal; called randevu_iptal | Deniz Aksoy | PASS | Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? |
| E-25 | docs/denetim/2026-10-02-ayse-eylem.md: \| 25 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Randevusunu iptal et | model | forced randevu_iptal; called randevu_iptal | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için 2 randevu var Hocam: 1) 12 Ekim Pazartesi 21:27, 2. 21 Aralık Pazartesi 21:27. Hangisi? 🖥 Deniz Aksoy için 2 randevu var Hocam: 1. 12 Ekim Pazartesi 21:27, 2. … |
| E-26 | docs/denetim/2026-10-02-ayse-eylem.md: \| 26 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Deniz Aksoy'un fıstık alerjisini ekle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-26 | docs/denetim/2026-10-02-ayse-eylem.md: \| 26 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Deniz Aksoy'un fıstık alerjisini ekle | model | forced alerji_ekle; called alerji_ekle; card alerji_ekle (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Alerji ekle hazırladım. Ama Alerji boş — ekrandaki karttan doldurup onaylayın. |
| E-27 | docs/denetim/2026-10-02-ayse-eylem.md: \| 27 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | chat | Deniz Aksoy için yarın 11:00'e kontrol randevusu oluştur | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | not judged | Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 11:00. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-27 | docs/denetim/2026-10-02-ayse-eylem.md: \| 27 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03; docs/OPEN-COMMI… | voice | Deniz Aksoy için yarın 11:00'e kontrol randevusu oluştur | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | not judged | 🔊 Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 11:00. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-28 | docs/denetim/2026-10-02-ayse-eylem.md: \| 28 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Deniz Aksoy'un Ventolinini kes | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-28 | docs/denetim/2026-10-02-ayse-eylem.md: \| 28 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Deniz Aksoy'un Ventolinini kes | model | forced ilac_sonlandir; called ilac_sonlandir; card ilac_sonlandir (1 missing) | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için İlacı sonlandır hazırladım. Ama İlaç boş — ekrandaki karttan doldurup onaylayın. |
| E-29 | docs/denetim/2026-10-02-ayse-eylem.md: \| 29 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Fıstık alerjisini ekle | model | — | — | PASS | Vekil yanıt Hocam. |
| E-29 | docs/denetim/2026-10-02-ayse-eylem.md: \| 29 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Fıstık alerjisini ekle | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| E-30 | docs/denetim/2026-10-02-ayse-eylem.md: \| 30 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | 14:30 | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-30 | docs/denetim/2026-10-02-ayse-eylem.md: \| 30 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | 14:30 | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-31 | docs/denetim/2026-10-02-ayse-eylem.md: \| 31 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | 14:30 | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-31 | docs/denetim/2026-10-02-ayse-eylem.md: \| 31 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | 14:30 | model | forced kontrol_randevusu_olustur; called kontrol_randevusu_olustur; card kontrol_randevusu… | Deniz Aksoy | PASS | 🔊 Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:30. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-32 | docs/denetim/2026-10-02-ayse-eylem.md: \| 32 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Alerjisi var mı | hizli-kart | — | Deniz Aksoy | PASS | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-32 | docs/denetim/2026-10-02-ayse-eylem.md: \| 32 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Alerjisi var mı | hizli-kart | — | Deniz Aksoy | PASS | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-33 | docs/denetim/2026-10-02-ayse-eylem.md: \| 33 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | chat | Ventolini ne zaman kestik | model | — | Deniz Aksoy | PASS | Vekil yanıt Hocam. |
| E-33 | docs/denetim/2026-10-02-ayse-eylem.md: \| 33 \|; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-03 | voice | Ventolini ne zaman kestik | model | — | Deniz Aksoy | PASS | 🔊 Vekil yanıt Hocam. |
| R-ASI-1 | lib/asistan/ayseRota.test.ts: Aşılarını göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/qa/gokhan-y… | chat | Aşılarını göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| R-ASI-1 | lib/asistan/ayseRota.test.ts: Aşılarını göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/qa/gokhan-y… | voice | Aşılarını göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| R-ASI-2 | lib/asistan/ayseRota.test.ts: Aşı karnesini tablo olarak göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05;… | chat | Aşı karnesini tablo olarak göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| R-ASI-2 | lib/asistan/ayseRota.test.ts: Aşı karnesini tablo olarak göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05;… | voice | Aşı karnesini tablo olarak göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| R-ASI-3 | lib/asistan/ayseRota.test.ts: Emircan Karaoğlu aşı karnesini tablo olarak göster; docs/OPEN-COMMITMENTS.md: NO… | chat | Emircan Karaoğlu aşı karnesini tablo olarak göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| R-ASI-3 | lib/asistan/ayseRota.test.ts: Emircan Karaoğlu aşı karnesini tablo olarak göster; docs/OPEN-COMMITMENTS.md: NO… | voice | Emircan Karaoğlu aşı karnesini tablo olarak göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| R-ASI-4 | lib/asistan/ayseRota.test.ts: Toplam kaç aşısı var; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01; docs/ayse-ca… | chat | Toplam kaç aşısı var | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepatit B \| 29.… |
| R-ASI-4 | lib/asistan/ayseRota.test.ts: Toplam kaç aşısı var; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01; docs/ayse-ca… | voice | Toplam kaç aşısı var | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun aşı karnesini ekrana getirdim Hocam; 16 kayıt var. 🖥 **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \|… |
| R-OLCUM-1 | lib/asistan/ayseRota.test.ts: Bütün muayenelerdeki kilo ölçümlerini sırayla göster; docs/OPEN-COMMITMENTS.md: … | chat | Bütün muayenelerdeki kilo ölçümlerini sırayla göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo ölçümleri** (15 muayene) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 04.09.2024 \| 3,2 \| \| 30.09.2024 \| 4,3 \| \| 30.10.2024 \| 5,4 \| \| 30.12.2024 \… |
| R-OLCUM-1 | lib/asistan/ayseRota.test.ts: Bütün muayenelerdeki kilo ölçümlerini sırayla göster; docs/OPEN-COMMITMENTS.md: … | voice | Bütün muayenelerdeki kilo ölçümlerini sırayla göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun kilo ölçümlerini tablo olarak ekrana getirdim Hocam; 15 kayıt var. Son kilo 12,8 kg (30.09.2026). 🖥 **Emircan Karaoğlu — kilo ölçümleri** (15 muayene) \| T… |
| R-OLCUM-2 | lib/asistan/ayseRota.test.ts: Kilo, boy ve baş çevresi ölçümlerini tablo yap; docs/OPEN-COMMITMENTS.md: NOTYA-… | chat | Kilo, boy ve baş çevresi ölçümlerini tablo yap | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo, boy ve baş çevresi ölçümleri** (15 muayene) \| Tarih \| Kilo (kg) \| Boy (cm) \| Baş çevresi (cm) \| \| --- \| --- \| --- \| --- \| \| 04.09.2024 \| 3,2 … |
| R-OLCUM-2 | lib/asistan/ayseRota.test.ts: Kilo, boy ve baş çevresi ölçümlerini tablo yap; docs/OPEN-COMMITMENTS.md: NOTYA-… | voice | Kilo, boy ve baş çevresi ölçümlerini tablo yap | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun kilo, boy ve baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 15 kayıt var. Son kilo 12,8 kg (30.09.2026). 🖥 **Emircan Karaoğlu — kilo, boy ve b… |
| R-OLCUM-3 | lib/asistan/ayseRota.test.ts: Tüm antropometrik ölçümlerini göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-… | chat | Tüm antropometrik ölçümlerini göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo, boy ve baş çevresi ölçümleri** (15 muayene) \| Tarih \| Kilo (kg) \| Boy (cm) \| Baş çevresi (cm) \| \| --- \| --- \| --- \| --- \| \| 04.09.2024 \| 3,2 … |
| R-OLCUM-3 | lib/asistan/ayseRota.test.ts: Tüm antropometrik ölçümlerini göster; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-… | voice | Tüm antropometrik ölçümlerini göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun kilo, boy ve baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 15 kayıt var. Son kilo 12,8 kg (30.09.2026). 🖥 **Emircan Karaoğlu — kilo, boy ve b… |
| R-OLCUM-4 | lib/asistan/ayseRota.test.ts: Baş çevresi ölçümleri neler; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/… | chat | Baş çevresi ölçümleri neler | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — baş çevresi ölçümleri** (15 muayene) \| Tarih \| Baş çevresi (cm) \| \| --- \| --- \| \| 04.09.2024 \| 35 \| \| 30.09.2024 \| 37,2 \| \| 30.10.2024 \| 39 \| \|… |
| R-OLCUM-4 | lib/asistan/ayseRota.test.ts: Baş çevresi ölçümleri neler; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/… | voice | Baş çevresi ölçümleri neler | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 15 kayıt var. Son baş çevresi 48,9 cm (30.08.2026). 🖥 **Emircan Karaoğlu — baş çevresi ölçümler… |
| R-OLCUM-5 | lib/asistan/ayseRota.test.ts: Son muayenedeki boy ve kilo ölçümlerini göster; docs/OPEN-COMMITMENTS.md: NOTYA-… | chat | Son muayenedeki boy ve kilo ölçümlerini göster | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — kilo ve boy ölçümleri** (son muayene; toplam 15 muayene kayıtlı) \| Tarih \| Kilo (kg) \| Boy (cm) \| \| --- \| --- \| --- \| \| 30.09.2026 \| 12,8 \| kayıt yo… |
| R-OLCUM-5 | lib/asistan/ayseRota.test.ts: Son muayenedeki boy ve kilo ölçümlerini göster; docs/OPEN-COMMITMENTS.md: NOTYA-… | voice | Son muayenedeki boy ve kilo ölçümlerini göster | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu, son muayene (30.09.2026): kilo 12,8 kg. Boy için kayıtlı ölçüm yok. 🖥 **Emircan Karaoğlu — kilo ve boy ölçümleri** (son muayene; toplam 15 muayene kayıtlı) \|… |
| R-MUAYENE-1 | lib/asistan/ayseRota.test.ts: Son üç muayenesini özetle; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/qa… | chat | Son üç muayenesini özetle | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — son 3 muayene** (toplam 15 onaylı muayene) **1. 30.08.2026** - Şikayet: 24 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Koşuyor, merdiven çıkıyor, 2-3 kelim… |
| R-MUAYENE-1 | lib/asistan/ayseRota.test.ts: Son üç muayenesini özetle; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05; docs/qa… | voice | Son üç muayenesini özetle | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu, son 3 muayene. 30 Ağustos 2026 muayenesi. Şikayet: 24 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Koşuyor, merdiven çıkıyor, 2-3 kelimelik cümle kuruyor. İ… |
| R-MUAYENE-2 | lib/asistan/ayseRota.test.ts: Bütün muayenelerini tek tek özetle; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05… | chat | Bütün muayenelerini tek tek özetle | kayit | — | Emircan Karaoğlu | PASS | **Emircan Karaoğlu — 15 muayene** **1. 04.09.2024** - Şikayet: 5 günlük erkek bebek, rutin sağlam yenidoğan kontrolü için getirildi. Anne sütü alıyor, emmesi iyi. - Tanı: Sağlam ye… |
| R-MUAYENE-2 | lib/asistan/ayseRota.test.ts: Bütün muayenelerini tek tek özetle; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-05… | voice | Bütün muayenelerini tek tek özetle | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu'nun 15 muayenesinin özetini ekrana getirdim Hocam; 4 Eylül 2024 ile 30 Eylül 2026 arası. Sesli dinlemek isterseniz "bana anlat" deyin. 🖥 **Emircan Karaoğlu — 1… |
| R-OLCUM-METIN | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03; docs/qa/gokhan-yetenek-talepleri.md: from a single exam | chat | 15 aylık muayenesinde kilosu kaçtı? | kayit | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| R-OLCUM-METIN | docs/OPEN-COMMITMENTS.md: NOTYA-DANIS-OLCUM-03; docs/qa/gokhan-yetenek-talepleri.md: from a single exam | voice | 15 aylık muayenesinde kilosu kaçtı? | kayit | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| R-KART-KILO | lib/asistan/ayseRota.test.ts: Kilosu kaç?; lib/asistan/dosyaSorgu/denetim.test.ts: Kilosu kaç? | chat | Kilosu kaç? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-KART-KILO | lib/asistan/ayseRota.test.ts: Kilosu kaç?; lib/asistan/dosyaSorgu/denetim.test.ts: Kilosu kaç? | voice | Kilosu kaç? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-KART-ALERJI | lib/asistan/ayseRota.test.ts: Alerjisi var mı?; lib/asistan/dosyaSorgu/denetim.test.ts: Alerjisi var mı? | chat | Alerjisi var mı? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| R-KART-ALERJI | lib/asistan/ayseRota.test.ts: Alerjisi var mı?; lib/asistan/dosyaSorgu/denetim.test.ts: Alerjisi var mı? | voice | Alerjisi var mı? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| R-TAKVIM-BOS | lib/asistan/ayseRota.test.ts: Yarın 15:00 boş mu?; docs/qa/gokhan-yetenek-talepleri.md: free slots | chat | Yarın 15:00 boş mu? | takvim | — | Emircan Karaoğlu | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). İstediğiniz 15:00 boş. |
| R-TAKVIM-BOS | lib/asistan/ayseRota.test.ts: Yarın 15:00 boş mu?; docs/qa/gokhan-yetenek-talepleri.md: free slots | voice | Yarın 15:00 boş mu? | takvim | — | Emircan Karaoğlu | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 15:00 boş. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). İstediğin… |
| R-TAKVIM-KIM | lib/asistan/ayseRota.test.ts: Yarın kimler geliyor?; docs/qa/gokhan-yetenek-talepleri.md: list by day/patient | chat | Yarın kimler geliyor? | takvim | — | — | PASS | 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| R-TAKVIM-KIM | lib/asistan/ayseRota.test.ts: Yarın kimler geliyor?; docs/qa/gokhan-yetenek-talepleri.md: list by day/patient | voice | Yarın kimler geliyor? | takvim | — | — | PASS | 🔊 Yarın, 3 Ekim Cumartesi, 1 randevu var Hocam: 10:00 Ayşe Bozkurt kontrol. 🖥 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| R-KAPSAM | lib/asistan/ayseRota.test.ts: Bitcoin almalı mıyım? | chat | Bitcoin almalı mıyım? | kapsam | — | — | PASS | Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunuz v… |
| R-KAPSAM | lib/asistan/ayseRota.test.ts: Bitcoin almalı mıyım? | voice | Bitcoin almalı mıyım? | kapsam | — | — | PASS | 🔊 Hocam, ben yalnızca Notya'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum; bu konuda yardımcı olamam. Hastalarınız, randevularınız ya da klinik bir sorunu… |
| R-COUNT-ACIK-1 | lib/asistan/ayseRota.test.ts: En çok hangi şikayetle geldi; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01; docs… | chat | En çok hangi şikayetle geldi | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| R-COUNT-ACIK-1 | lib/asistan/ayseRota.test.ts: En çok hangi şikayetle geldi; docs/OPEN-COMMITMENTS.md: NOTYA-AYSE-GERI-01; docs… | voice | En çok hangi şikayetle geldi | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-1 | docs/ayse-capability-regression-audit.md: Randevu saatini değiştirmek istiyorum; lib/asistan/ayseRota.test.ts:… | chat | Randevu saatini değiştirmek istiyorum | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-1 | docs/ayse-capability-regression-audit.md: Randevu saatini değiştirmek istiyorum; lib/asistan/ayseRota.test.ts:… | voice | Randevu saatini değiştirmek istiyorum | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-2 | docs/ayse-capability-regression-audit.md: Aşı karnesini tablo olarak göster; lib/asistan/ayseRota.test.ts: Aşı… | chat | Aşı karnesini tablo olarak göster | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-2 | docs/ayse-capability-regression-audit.md: Aşı karnesini tablo olarak göster; lib/asistan/ayseRota.test.ts: Aşı… | voice | Aşı karnesini tablo olarak göster | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-3 | docs/ayse-capability-regression-audit.md: İlaç etkileşimi var mı kontrol et; lib/asistan/ayseRota.test.ts: İla… | chat | İlaç etkileşimi var mı kontrol et | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-3 | docs/ayse-capability-regression-audit.md: İlaç etkileşimi var mı kontrol et; lib/asistan/ayseRota.test.ts: İla… | voice | İlaç etkileşimi var mı kontrol et | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-4 | docs/ayse-capability-regression-audit.md: Epikriz hazırla; lib/asistan/ayseRota.test.ts: Epikriz hazırla; docs… | chat | Epikriz hazırla | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-4 | docs/ayse-capability-regression-audit.md: Epikriz hazırla; lib/asistan/ayseRota.test.ts: Epikriz hazırla; docs… | voice | Epikriz hazırla | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-5 | docs/ayse-capability-regression-audit.md: Otitte ilk seçenek tedavi nedir; lib/asistan/ayseRota.test.ts: Otitt… | chat | Otitte ilk seçenek tedavi nedir | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-5 | docs/ayse-capability-regression-audit.md: Otitte ilk seçenek tedavi nedir; lib/asistan/ayseRota.test.ts: Otitt… | voice | Otitte ilk seçenek tedavi nedir | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-6 | docs/ayse-capability-regression-audit.md: Ateşli çocukta parasetamol dozu nedir; lib/asistan/ayseRota.test.ts:… | chat | Ateşli çocukta parasetamol dozu nedir | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-6 | docs/ayse-capability-regression-audit.md: Ateşli çocukta parasetamol dozu nedir; lib/asistan/ayseRota.test.ts:… | voice | Ateşli çocukta parasetamol dozu nedir | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-7 | docs/ayse-capability-regression-audit.md: Tanı koymama yardım eder misin; lib/asistan/ayseRota.test.ts: Tanı k… | chat | Tanı koymama yardım eder misin | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-7 | docs/ayse-capability-regression-audit.md: Tanı koymama yardım eder misin; lib/asistan/ayseRota.test.ts: Tanı k… | voice | Tanı koymama yardım eder misin | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-8 | docs/ayse-capability-regression-audit.md: Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz; lib/asistan/a… | chat | Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | model | — | — | not judged | Vekil yanıt Hocam. |
| R-SAYIM-8 | docs/ayse-capability-regression-audit.md: Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz; lib/asistan/a… | voice | Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | model | — | — | not judged | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-1 | docs/ayse-capability-regression-audit.md: Burcu Yılmaz en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOTYA… | chat | Burcu Yılmaz en son ne zaman geldi? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-1 | docs/ayse-capability-regression-audit.md: Burcu Yılmaz en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOTYA… | voice | Burcu Yılmaz en son ne zaman geldi? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-2 | docs/ayse-capability-regression-audit.md: Mehmet Erdoğan en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOT… | chat | Mehmet Erdoğan en son ne zaman geldi? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-2 | docs/ayse-capability-regression-audit.md: Mehmet Erdoğan en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOT… | voice | Mehmet Erdoğan en son ne zaman geldi? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-3 | docs/ayse-capability-regression-audit.md: Ali Erdoğan kim?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06a | chat | Ali Erdoğan kim? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-3 | docs/ayse-capability-regression-audit.md: Ali Erdoğan kim?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06a | voice | Ali Erdoğan kim? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-4 | docs/ayse-capability-regression-audit.md: Faiz Demir bugün geldi mi; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06… | chat | Faiz Demir bugün geldi mi | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-4 | docs/ayse-capability-regression-audit.md: Faiz Demir bugün geldi mi; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06… | voice | Faiz Demir bugün geldi mi | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-5 | docs/ayse-capability-regression-audit.md: Kriptorşidizm ne zaman opere edilir?; docs/OPEN-COMMITMENTS.md: NOTY… | chat | Kriptorşidizm ne zaman opere edilir? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-5 | docs/ayse-capability-regression-audit.md: Kriptorşidizm ne zaman opere edilir?; docs/OPEN-COMMITMENTS.md: NOTY… | voice | Kriptorşidizm ne zaman opere edilir? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-6 | docs/ayse-capability-regression-audit.md: Araba tutması için ne önerirsin?; docs/OPEN-COMMITMENTS.md: NOTYA-KA… | chat | Araba tutması için ne önerirsin? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-6 | docs/ayse-capability-regression-audit.md: Araba tutması için ne önerirsin?; docs/OPEN-COMMITMENTS.md: NOTYA-KA… | voice | Araba tutması için ne önerirsin? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-7 | docs/ayse-capability-regression-audit.md: İlk seçim ne olmalı?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06a | chat | İlk seçim ne olmalı? | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-7 | docs/ayse-capability-regression-audit.md: İlk seçim ne olmalı?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06a | voice | İlk seçim ne olmalı? | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-8 | docs/ayse-capability-regression-audit.md: C-reactive protein yüksekliği nedenleri; docs/OPEN-COMMITMENTS.md: N… | chat | C-reactive protein yüksekliği nedenleri | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-8 | docs/ayse-capability-regression-audit.md: C-reactive protein yüksekliği nedenleri; docs/OPEN-COMMITMENTS.md: N… | voice | C-reactive protein yüksekliği nedenleri | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-9 | docs/ayse-capability-regression-audit.md: Otel dönüşü döküntü yapan şey ne olabilir; docs/OPEN-COMMITMENTS.md:… | chat | Otel dönüşü döküntü yapan şey ne olabilir | model | — | — | PASS | Vekil yanıt Hocam. |
| R-KAPSAM06-9 | docs/ayse-capability-regression-audit.md: Otel dönüşü döküntü yapan şey ne olabilir; docs/OPEN-COMMITMENTS.md:… | voice | Otel dönüşü döküntü yapan şey ne olabilir | model | — | — | PASS | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-10 | docs/ayse-capability-regression-audit.md: en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06b | chat | Emircan Karaoğlu en son ne zaman geldi? | hizli-kart | — | Emircan Karaoğlu | PASS | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| R-KAPSAM06-10 | docs/ayse-capability-regression-audit.md: en son ne zaman geldi?; docs/OPEN-COMMITMENTS.md: NOTYA-KAPSAM-06b | voice | Emircan Karaoğlu en son ne zaman geldi? | hizli-kart | — | Emircan Karaoğlu | PASS | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| K-G01 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Bu hastayı bana kısaca özetler misin? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G01 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Bu hastayı bana kısaca özetler misin? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G02 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Son muayeneden bu yana neler değişmiş? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G02 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Son muayeneden bu yana neler değişmiş? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G03 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Büyümesi nasıl gidiyor? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G03 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Büyümesi nasıl gidiyor? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G04 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G04 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G05 | docs/AYSE-KALITE-STANDARDI.md: Q-09; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G05 | docs/AYSE-KALITE-STANDARDI.md: Q-09; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G06 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G06 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Şu anda kullandığı ilaçlar neler ve dozları nedir? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G07 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Daha önce aynı şikayetle geldi mi? | model | — | Doruk Akyel | MANUAL | Vekil yanıt Hocam. |
| K-G07 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Daha önce aynı şikayetle geldi mi? | model | — | Doruk Akyel | MANUAL | 🔊 Vekil yanıt Hocam. |
| K-G08 | docs/AYSE-KALITE-STANDARDI.md: Q-04; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Gelişimi yaşına uygun mu? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G08 | docs/AYSE-KALITE-STANDARDI.md: Q-04; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Gelişimi yaşına uygun mu? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G09 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G09 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Bugün yapmam veya takip etmem gereken bir şey var mı? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-G10 | docs/AYSE-KALITE-STANDARDI.md: Q-09; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-G10 | docs/AYSE-KALITE-STANDARDI.md: Q-09; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Gözümden kaçabilecek önemli bir şey var mı? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-VIZIT-B12 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | 12 aylık muayenesini özetler misin? | model | — | Emircan Karaoğlu | not judged | Vekil yanıt Hocam. |
| K-VIZIT-B12 | docs/AYSE-KALITE-STANDARDI.md: Q-21; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | 12 aylık muayenesini özetler misin? | model | — | Emircan Karaoğlu | not judged | 🔊 Vekil yanıt Hocam. |
| K-VIZIT-G18 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | 18 aylık muayenesini özetler misin? | model | — | Doruk Akyel | not judged | Vekil yanıt Hocam. |
| K-VIZIT-G18 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | 18 aylık muayenesini özetler misin? | model | — | Doruk Akyel | not judged | 🔊 Vekil yanıt Hocam. |
| K-OLCUM-KILO | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Kilosu kaç? | hizli-kart | — | Emircan Karaoğlu | **FAIL** | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| K-OLCUM-KILO | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Kilosu kaç? | hizli-kart | — | Emircan Karaoğlu | **FAIL** | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| K-OLCUM-G-KILO | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Kilosu kaç? | hizli-kart | — | Doruk Akyel | **FAIL** | Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg · Boy: 82 cm · Baş Çevresi: 47,6 cm. |
| K-OLCUM-G-KILO | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Kilosu kaç? | hizli-kart | — | Doruk Akyel | **FAIL** | 🔊 Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg, Boy: 82 cm, Baş Çevresi: 47,6 cm. 🖥 Doruk Akyel — dosyada son ölçüm: Kilo: 10,8 kg · Boy: 82 cm · Baş Çevresi: 47,6 cm. |
| K-OLCUM-G-BOY | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Boyu kaç? | kayit | — | Doruk Akyel | **FAIL** | Doruk Akyel — son boy 82 cm (29.09.2026). |
| K-OLCUM-G-BOY | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Boyu kaç? | kayit | — | Doruk Akyel | **FAIL** | 🔊 Doruk Akyel — son boy 82 cm (29.09.2026). |
| K-OLCUM-G-BAS | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Baş çevresi kaç? | kayit | — | Doruk Akyel | **FAIL** | Doruk Akyel — son baş çevresi 47,6 cm (29.09.2026). |
| K-OLCUM-G-BAS | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Baş çevresi kaç? | kayit | — | Doruk Akyel | **FAIL** | 🔊 Doruk Akyel — son baş çevresi 47,6 cm (29.09.2026). |
| K-OLCUM-ATES | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | Son muayenede ateşi kaçtı? | kayit | — | Tarık Özdemir | PASS | Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| K-OLCUM-ATES | docs/AYSE-KALITE-STANDARDI.md: Q-02; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | Son muayenede ateşi kaçtı? | kayit | — | Tarık Özdemir | PASS | 🔊 Tarık Özdemir — son muayene (01.10.2026): ateş 38,7 °C. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| K-TARIH-SON | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | En son ne zaman geldi? | hizli-kart | — | Doruk Akyel | **FAIL** | Doruk Akyel — dosyada son vizit: 29 Eylül 2026 — 18 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Dosyada plan ve takip: M-CHAT-R/F bir sonraki vizitte uygulanacak. Hepatit A 1. … |
| K-TARIH-SON | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | En son ne zaman geldi? | hizli-kart | — | Doruk Akyel | **FAIL** | 🔊 Doruk Akyel — dosyada son vizit: 29 Eylül 2026 — 18 aylık erkek çocuk, rutin sağlam çocuk kontrolü. Dosyada plan ve takip: M-CHAT-R/F bir sonraki vizitte uygulanacak. Hepatit A … |
| K-TARIH-G18 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | chat | 18 aylık muayenesinde kaç kiloydu? | kayit | — | Doruk Akyel | **FAIL** | Doruk Akyel — 18 aylık muayene (29.09.2026): kilo 10,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| K-TARIH-G18 | docs/AYSE-KALITE-STANDARDI.md: Q-06; docs/OPEN-COMMITMENTS.md: NOTYA-KALITE-STANDART-01 | voice | 18 aylık muayenesinde kaç kiloydu? | kayit | — | Doruk Akyel | **FAIL** | 🔊 Doruk Akyel — 18 aylık muayene (29.09.2026): kilo 10,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |

## Sources

- `docs/OPEN-COMMITMENTS.md` — rows citing a live case (canlı / Kaan live / Dr. Gökhan / quoted sentences)
- `docs/qa/gokhan-gunluk-sorular.md` — all rows: daily-use set 1–55 and the scope table K1–K12
- `docs/qa/gokhan-yetenek-talepleri.md` — the five capabilities he reported lost
- `scripts/ayse-denetim/sorular-100.json` — the 100-question set (103 rows), report docs/denetim/2026-09-29-ayse-100*.md, 2026-09-30-kademe.md
- `scripts/ayse-denetim/sorular-takip.json` — the follow-up set (34 sequences, 101 rows), report docs/denetim/2026-09-30-ayse-takip.md
- `scripts/ayse-denetim/sorular-canli-0930.json` — the six sentences of the 09-30 live test
- `docs/denetim/2026-09-26-qa-sentetik-bebek.md` — the İlk-10 file questions of the dosyaSorgu audit (lib/asistan/dosyaSorgu/denetim/puanla.ts; also the 09-27 reports)
- `docs/denetim/2026-10-02-ayse-eylem.md` — the 33 action sentences of the live action audit (lib/asistan/tests/eylemDenetimi.ts)
- `docs/ayse-capability-regression-audit.md` — probe sentences of §4.2 (scope gate) and §4.3 (count template), cited by NOTYA-KAPSAM-06 / NOTYA-AYSE-GERI-01
- `lib/asistan/ayseRota.test.ts` — routing rows written from his capability list and the live wrong-chart incident
- `lib/doktor/hastaCozumleyici.test.ts` — header comments citing live cases (#504, NOTYA-HASTA-ODAK-01)
- `lib/doktor/sesliSoz.test.ts` — header comments citing live cases (NOTYA-SES-DOLGU-01/02, NOTYA-HASTA-ODAK-01)
- `lib/doktor/pratikAnaliz.test.ts` — header comment citing the live antibiotic question (NOTYA-AYSE-HASTA-01)
- `lib/asistan/kapsamKilidi.test.ts` — header comment citing the live weather sentence (NOTYA-KAPSAM-05)
- `lib/asistan/dosyaSorgu/denetim.test.ts` — single-fact questions of the Dr. Gökhan standard
- `lib/asistan/vizitOlcumSahne.test.ts` — header comment citing the live visit-measurement question (NOTYA-DANIS-OLCUM) and its variants
- `lib/asistan/aktifHastaPratik.test.ts` — the doctor's own practice-ranking question of 2026-09-20 and its variants (NOTYA-AYSE-KOHORT-01)
- `docs/AYSE-KALITE-STANDARDI.md` — the golden cases of the quality standard: the ten İlk-10 questions on the late-entry chart, visit summaries, single-measurement and visit-date questions (NOTYA-KALITE-STANDART-01)

## Live complaints that are not a sentence to Ayşe (not in the corpus)

- NOTYA-SES-TUR-01 / -02, GUNLUK #51 — microphone turn-taking and the cross-patient audio incident: audio layer, not reproducible with text input
- NOTYA-SES-SESSIZ-01, NOTYA-ASISTAN-KAPAT-01 — browser behaviour (voice goes silent when typing; close button)
- NOTYA-AYSE-ACILIS-01 — opening greeting with pending notes: needs the day-summary opener, not a doctor sentence
- NOTYA-SES-DEVAM-01 (browser half), NOTYA-AYSE-GERI-02a / -06a — continuation played by the browser after playback stops; needs a microphone
- NOTYA-SES-SLUR-01, NOTYA-SES-FISH-01, Fish voice rollback — speech quality: judged by ear
- STT mis-transcription (2026-10-01) — the recogniser itself; only the split-name TRANSCRIPT is in the corpus
- GUNLUK K12 — the opening greeting is not a doctor question
- KASA-BELGE-01, RANDEVU-IPTAL-REAKTIVASYON, RANDEVU-HASTA-ARAMA-TR, ONAY-SONRASI-DONUS, HASTA-FORMU-SIGORTA-OPSIYONEL, NOTYA-MUAYENEYE-DON-01, NOTYA-AVATAR-01 — page / form defects, no assistant turn
- NOTYA-RECETE-04, NOTYA-ILAC-SONLANDIR-01, NOTYA-CEK-DOGRULA, NOTYA-ASI-NOT, NOTYA-FISILTI-GIZLE, NOTYA-ARSIV — note approval and chart-page logic, no assistant turn
- MD-TABLO-FIX (markdownTablo.regresyon.test.ts) — rendering of a table in the chat bubble: a client component
