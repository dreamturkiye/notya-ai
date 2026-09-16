# README_YENIDOGAN — Taburcu paketi + Ulusal Yenidoğan Tarama + Bebek izlem

Notya is **clinic checklist + colleague tooling**. It is **not** a device, **not** a national registry, and **does not replace e-Nabız**.

Apply `lib/db/migrations/036_yenidogan_taburcu.sql` on preview/prod (shared Supabase) **before** persistence QA. Do not merge this PR until that coordinator preview audit. (`035` on main is already `035_kd_jine_wow_sprint.sql`.)

## Reused from 029 vs newly added in 036

**Reused (do not recreate):** `dogum_olaylari`, `bebek_kartlari` (`yenidogan_tarama` jsonb), `taburcu_checklist` (`maddeler` jsonb + `istisna` + `kapatildi`). Spine taburcu gate in `dogum-spine.ts` stays.

**036 additive only (`IF NOT EXISTS` / `ADD COLUMN`):** `bebek_gorevleri`, `asi_dozlari`, `lohusa_checklist`; `taburcu_checklist.red_json` + `onaylayan`; `bebek_kartlari.preterm` / `lbw` / `kan_grubu`; `lab_paneller.panel_type` + `sample_no` + NTP index.

## Product split

| Persona | Owns |
|---|---|
| Kadın-doğum | Birth event, first heel sample (NTP-1), lohusa |
| Ayşe / pediatri | Baby after discharge (Bebek kartı timeline, NTP results, izlem / aşı) |

Canlı doğum **always** creates `bebek_kartlari` linked to anne (non-negotiable). Pediatrics tree under `specialties/pediatri` stays frozen; this package uses `lib/clinical/yenidogan`, `bridges/dogum-yenidogan.ts`, and `components/doktor/HastaBebekKarti.tsx`.

Klinik + Jinekoloji ofis spine (`StickyJineStrip`, `BugunkuJineMuayene`, `SevkCta`) and `DogumSpine` are unchanged. Taburcu/Bebek UI is mounted only in Doğum/Lohusa context (`HastaGebelik` lohusa mode).

## Legal/program → product (not legal advice)

Cite dual when sources disagree; never merge columns.

- **Ulusal Yenidoğan Tarama Programı (SB HSGM):** FKU, KHT, biotinidaz, KF, KAH, SMA
- Two heel samples: **NTP-1** before hospital discharge (after oral feeds, ideally ≥48h); **NTP-2** day 3–5 at ASM
- **Screening positive ≠ diagnosis.** Copy everywhere: `Tarama pozitif tanı değildir. Konfirmasyon ve klinik değerlendirme gerekir.`
- Discharge also: HepB dose 1, vitamin K 1 mg IM, hearing screen, pulse-ox CHD screen
- **Bebek izlem (SB):** birth, days 1–10, day 15, day 41, months 2, 3, 4, 6, 9
- D vitamin 400 IU (3 drops) from week 1 until age 2
- Iron prophylaxis month 4 (day 60 if preterm/LBW)
- Hip US if GKD risk; else ~3–6 weeks via family physician
- Lohusa: hospital + home/clinic ~day 2–5, 13–17, 30–40 (DSBYR 4th window also notes 30–42 — shown, not collapsed)

### Dual-cite (do not merge)

| Topic | SB / yasal taban | Overlay / brief |
|---|---|---|
| 9th-month izlem | SB bebek izlem ~270th day window | Brief lists day 250 |
| HepA-2 | SB GBP 24th month | Vaccine months line is 2/4/6/12/18 |
| HepB-2 | V1 kod list HEPB1–3 (classic 0/1/6) | 2025 6'lı karma removed month-1 monovalent HepB except HBsAg+ |
| Lohusa 4 | DSBYR 30–42 | Brief 30–40 |

V1 **mandatory** vaccine codes (SB GBP only — no paid extras):  
`HEPB1 HEPB2 HEPB3 BCG DABTIPA_HIB1-4 KPA1-4 OPA1-2 KKK1 VARICELLA HEPA1-2`

## Gate

Kadın-doğum cannot press **Taburcuyu tamamla** unless NTP-1, HepB-1, VitK, and işitme are checked **or** the doctor records `erken_taburcu` / `redd` / `sevk` + reason (tasks generated for missing items).

Parental refuse: `status=red`, timestamp, who recorded. Calendar rows are **never** silently dropped.

## NTP lab

Results live under Belgeler `kind=lab` `panel_type=yenidogan_tarama` on the **BEBEK**, never the mother.

Same engine: extract → interpret → doctor edit → **Onayla** → last bebek muayene SOAP Objective.

Canonical keys: `ntp_pku`, `ntp_tsh`, `ntp_biotinidaz`, `ntp_irt`, `ntp_17ohp`, `ntp_sma`  
Flags: `normal | sinir | pozitif_suphe | yetersiz_ornek | tekrar`  
`sample_no`: `1 | 2 | tekrar`

Interpret (code, then writer):

- All normal → “Tarama negatif. Klinik izlem devam.”
- One borderline → “Tekrar örnek / konfirmasyon. Tanı koyma.”
- TSH high → congenital hypothyroidism suspicion; venous TFT urgent; treatment must not wait; tarama≠tanı
- SMA / PKU positive → sevk metabolizma/nöromusküler; no automatic diet or drug
- Inadequate sample → new draw task, not a diagnosis

Plan suggestions only: tekrar topuk, venöz TSH, metabolizma konsült.

## Files

- Migration `036_yenidogan_taburcu.sql` — extras listed above; RLS doctor-scoped on new tables
- Engine `lib/clinical/yenidogan/*` (gate, calendar, NTP yorum)
- Persist `lib/doktor/yenidoganKayit.ts` (hooked from `POST /api/doktor/gebelik` action `sonlandir` and spine `dogum_kaydet`)
- API `GET/POST /api/doktor/yenidogan`
- KD UI `specialties/kadin-dogum/ui/TaburcuPaketi.tsx` + `LohusaPaketi.tsx` (Anne \| Bebek in lohusa mode)
- Ped/Ayşe UI `components/doktor/HastaBebekKarti.tsx` (hasta dosyası sekmesi **Bebek kartı**)
- Tests `specialties/kadin-dogum/tests/yenidogan.test.ts` — `npm run test:kd` / `npm run test:yenidogan`

## Out of scope V1

e-Nabız / e-Doğum live submit, national screening lab HL7 in, aneuploidy calculators, PhishSimAi, paid extra vaccines as mandatory, unlocking frozen `specialties/pediatri`.
