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
| `engines/ayseGoruntu.ts` | OCT/fundus/ön segment checklist scaffold (dual-sign) | — | diagnose; invent stage |
| `imaging/dualSign.ts` | OCT/fundus/ön segment read: taslak → uzman onay/düzelt/red; asistan cannot approve | — | Ayşe auto-read (intentionally off) |

## Wiring

- Registry: `lib/specialties/goz-hastaliklari.ts` (VA/GİB first-class `olcumler`, Gözlerim portal module **Strong**).
- API: `app/api/doktor/goz/route.ts` (GET bundle; POST `adim`: olcum, olcum_nota, fundus, fundus_nota, glokom, dr, …). Secretary = read-only (`sadeceDoktor`).
- UI: `ui/GozHome.tsx` + `ui/GozKartlar.tsx` — **Fundus** sekmesi (OD/OS 3C sırası) + VA/GİB şerit.
- Prompts lock: `prompts/` (system, soap-goz, asistan-ogrenme, tools) wired into SOAP, Ayşe chat, voice, style distiller; `next.config` traces the .md files.
- Portal: `app/portal/_components/GozlerimView.tsx`, `/portal/hasta/[token]/gozlerim`, demo `/portal/demo-goz`.
- Dahiliye bridge: open `sevkler(hedef='goz')` → DR card → "Sevki kapat" writes `dahiliye_dm.son_goz_dibi` and closes `dm_goz`.

## Tests

```
npm run test:goz              # engines, chapter, prompts lock, Gözlerim, portal registry
npx tsx scripts/goz-smoke.mts # real API smoke (qa.goz@notya.ai, synthetic patients)
```
