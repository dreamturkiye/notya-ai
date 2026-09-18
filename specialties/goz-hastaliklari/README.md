# Göz Hastalıkları

Specialty chapter for Notya, built for Turkish private-practice ophthalmologists (muayenehane poliklinik). Core `patients` / `visits` stay generic. Clinical truth lives in `goz_*` tables (migration `048_goz_chapter.sql`), the same doctrine as `dahiliye_*` / `derm_*`. Images stay in core `hasta_goruntulemeler`.

Citation policy: cite role/id/year, never book text. **TR first:** SGK SUT (4.2.33 verified line by line against the consolidated mevzuat.gov.tr text incl. RG-23/5/2026), TEMD DM 2026 (retinopathy screening, primary PDF), SB Ulusal Görme Taraması 2019/17 (secondary summary), TOD birimleri (members-only, hekim teyit). International (ICO DR 2017 Table 3a, EGS 5th) is depth only. When TR and international differ, both columns are shown (`catisma: true`) — never collapsed.

## Engines (pure, deterministic, tested)

| Engine | What it does | Source | Never does |
|---|---|---|---|
| `engines/va.ts` | Parses VA as written (0,8 · 6/12 · 20/40 · PS 1m · EH · IH · IHY), logMAR = −log10(decimal), ETDRS letters = −50×ΔlogMAR, copy-forward draft needing confirm | definition | invent logMAR for PS/EH/IH |
| `engines/glokom.ts` | GİB series vs hekim target per eye, GA/OCT due tasks from hekim intervals, regimen summary | TOD (hekim teyit), EGS 5 | titrate / suggest drops; invent intervals |
| `engines/dr.ts` | TEMD screening (T1 +5 y, T2 at diagnosis, pregnancy every trimester), TR vs ICO follow-up windows, referral urgency, dahiliye feedback line | TEMD 2026 §13.2.1, ICO 2017 T3a | stage from chat; collapse TEMD/ICO |
| `engines/antiVegf.ts` | Loading schedule (3 doses 4–6 wk; DMÖ aflibersept 2 mg 5), SGK gates (basamak, implant ≥1 ay / ≥3 ay / ≤4 yıl, ran↔afl switch needs beva loading, 8 mg idame ≥3 ay, MI/SVO), SUT 4.2.33(3) response class | SUT 4.2.33 | pick maintenance interval; dose |
| `engines/sgkRapor.ts` | Anti-VEGF başlangıç/idame, implant, katarakt bilgi notu drafts with 4.2.33(2) mandatory items and missing list; no TC, no dose, no stored patient name | SUT 4.2.33, EK-3/G (unverified → hekim) | lock without hekim |
| `engines/acil.ts` | Red flags: kimyasal yanık (hemen yıkama), ani görme kaybı, dekolman şüphesi, açı kapanması, penetran travma | TOD hasta bilgilendirme, TOD PAKG, TEMD T13.1 | delay 112 |
| `engines/klinik.ts` | Katarakt ön-op checklist (no IOL power), kuru göz / KL / alerjik konjonktivit cards (SUT 4.2.33.D), pediatric amblyopia/strabismus bridge | SUT, SB 2019/17 | patching hours; referral cut-offs |
| `engines/serit.ts` | Sticky strip + intake → Subjektif (hasta beyanı) + card hints | — | diagnose |
| `engines/fundus.ts` | TR göz dibi kaydı: dilate + OD/OS disk(3C)/damar/makula/perifer → SOAP metni; «normal» kısayolu | TR oftalmoskopi sırası | DR evresi / tanı |
| `engines/ayseGoruntu.ts` | OCT/fundus/ön segment checklist scaffold (dual-sign); fallback when vision fails | — | diagnose; invent stage |
| `imaging/dualSign.ts` | OCT/fundus/ön segment read: taslak → uzman onay/düzelt/red; asistan cannot approve | — | approve as asistan |
| `imaging/belgeKopru.ts` | Belge Tier A → dual-sign draft: fundus/OCT/dış göz only, OD/OS required, single-field fundus ≤%70, model "tanılar" → "olası bulgu — evre değildir" | Belge router (`goruntuOkumaKoprusu`) | write goz_dr; stage |
| `engines/muayene.ts` | RAPD, refraction sph/cyl/aks (as measured), biyomikroskopi OD/OS + normal shortcut, keratokonus topo/Kmax/CXL, note lines, "Şeridi Objektif'e yaz" | definition | invent Rx; round values |
| `engines/katarakt.ts` | Biometry the hekim enters (AL, K1/K2, aks, A-sabiti) with typo ranges; post-op 1. gün / 1. hafta + endoftalmi flag | — | **compute IOL power** (no formula anywhere) |
| `engines/rop.ts` | ROP card: PMA (definition), zon/evre/plus as entered (ICROP names), SB ≤32 hf / ≤1500 g criterion; pediatrik/ROP visibility gate by known age | SB 2019 | stage; invent screening interval |
| `engines/kohort.ts` | Göz kohort flags (geciken GA/OCT, planlı IVT 14 gün / geçmiş, DR tarama, kontrol) + patient-safe recall text | — | put diagnosis/values in patient messages |
| `engines/araclar.ts` | Araçlar helpers: VA/logMAR row + two-visit ETDRS Δ, EK-3/G search | engines/va, klinik | prices |
| `engines/glokom.ts` (+) | Gonyo Shaffer/Spaeth, pakimetri, GA/OCT device meta; **EGS 5 presets** "öneri — hekim kilitler" | EGS 5 (primary PDF 2026-09-18: II.1.4.2.7, FC V, II.3.3) | fill OCT interval (EGS gives none); apply silently |
| `engines/dr.ts` (+) | Fundus → DR handoff (hekim confirms; `hekimOnay === true`), laser log PRP/fokal/grid | — | stage from fundus text/image |
| `engines/antiVegf.ts` (+) | IVT odası checklist before "yapıldı" (onam, göz işareti = record eye, ilaç + lot, asepsi) | safe-surgery / time-out | antiseptic %, dose |
| `engines/acil.ts` (+) | Intake red-flag checkboxes → codes; "ağrılı kırmızı göz"; irrigation timer; printable action lists | TOD hasta bilgilendirme | pH targets, doses |

## Wiring

- Registry: `lib/specialties/goz-hastaliklari.ts` (VA/GİB first-class `olcumler`, Gözlerim portal module **Strong**).
- API: `app/api/doktor/goz/route.ts` (GET bundle; POST `adim`: olcum, olcum_nota, fundus, fundus_nota, glokom, dr, …) + `_ek.ts` (GOZ-EXCEPTIONAL-01: serit_nota, fundus_dr, lazer, biyomikroskopi, keratokonus, on_segment_nota, katarakt_postop, katarakt_nota, rop, acil_kayit, acil_nota, oct_olcum, hatirlatma, goruntu_okuma › belge_taslak / asistana_raporla). Every `_ek` step runs after `hasta()` ownership. Secretary = read-only (`sadeceDoktor`). Migration `053_goz_exceptional.sql` (additive, applied).
- Kohort: `app/api/doktor/goz/kohort` + `_kohort.ts` (doctor-scoped goz_* rows; recall = Sağlığım message + e-posta bildirimi + dönüş görevi).
- UI: `ui/GozHome.tsx` + `ui/GozKartlar.tsx` + `ui/GozKartlarEk.tsx` (acil şablon, Fundus→DR, lazer, IVT listesi, katarakt biyometri/post-op, biyomikroskopi, OCT kalınlık, ROP, hatırlatma, Asistana raporla). `ui/stil.ts` breaks the Kartlar↔Ek import cycle.
- Araçlar (göz-only, `BRANS_DOKTOR_ARACLARI`): `/doktor-tools/goz-va`, `goz-sut-vegf`, `goz-sgk-rapor`, `goz-gil-kod`, `goz-kohort` → `ui/araclar/*` behind `GozAracKabugu` (auth + `doktorAraciBransaUygun` + redirect).
- Belge bridge: `core/belgeler/tierA.ts` (one Tier A path shared by `/api/doktor/belgeler/analiz` and Göz › Görüntü) + Belge page card gated by `bransKurali().goruntuOkumaKoprusu`.
- Maturity: `olgunluk: 'beta-hazir'` — product Strong, pending MD sign-off (`docs/GOZ-MD-BETA.md`). Not `uzman-dogrulandi` until Boss/CEO confirms.
- Prompts lock: `prompts/` (system, soap-goz, asistan-ogrenme, tools) wired into SOAP, Ayşe chat, voice, style distiller; `next.config` traces the .md files.
- Portal: `app/portal/_components/GozlerimView.tsx`, `/portal/hasta/[token]/gozlerim`, demo `/portal/demo-goz`.
- Dahiliye bridge: open `sevkler(hedef='goz')` → DR card → "Sevki kapat" writes `dahiliye_dm.son_goz_dibi` and closes `dm_goz`.

## Tests

```
npm run test:goz                          # engines, exceptional, belgeKopru, uiRender, chapter, prompts lock, Gözlerim, portal registry
npx tsx scripts/goz-smoke.mts             # real API smoke (qa.goz@notya.ai, synthetic patients) — 57/0
npx tsx scripts/goz-exceptional-smoke.mts # every GOZ-EXCEPTIONAL-01 step (incl. live Tier A call) — 88/0
```
