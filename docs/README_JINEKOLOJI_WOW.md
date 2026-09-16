# README_JINEKOLOJI_WOW — NOTYA-JINE-04 / KD-05 (2026-09-16)

Closes the specialty audit “wow bar”: CYBH treatment, full contraception/EC, menoraji ladder, USG+SUT, Anti-D loop, e-Doğum wizard, package ledger, CS defense, ürojine/IOTA, infertilite+, şiddet/KOK yıllık, portal reminders.

## Engines
- `engines/cybh-tedavi.ts` — CDC 2021 TR regimens, NAAT packs, TOC, partner printable, HSV 36w
- `engines/kontrasepsiyon-mec.ts` — method MEC, EC (LNG/UPA/Cu), postpartum start catalog
- `engines/kd-klinik-wow.ts` — menoraji ladder, Anti-D, USG templates+SUT, e-Doğum, CS pack, package, ürojine, IOTA, infertilite sevk, şiddet, KOK yıllık

## UI
`JinekolojiWowSekmeler.tsx` tabs mounted in `JinekolojiSpine` (after V2). Portal: `JinekolojiPortalView` on Sağlığım takip.

## API
`/api/doktor/jinekoloji` adımlar: `cybh_tedavi | acil_kb | yontem_mec | postpartum_kb | menoraji_tedavi | usg_rapor | anti_d_loop | e_dogum | paket | cs_savunma | urojine | onkoloji_iota | infertilite_sevk | siddet | kok_yillik | hsv_36`

## Storage
Migration `035_kd_jine_wow_sprint.sql` — `kd_wow_kayitlari` + tedavi jsonb columns.

## Still adapter-only (by design)
Live e-Nabız / e-Doğum HTTP write, e-imza hardware, IVF lab robotics — field maps and format packets ship (`lib/enabiz`, `docs/README_ENABIZ_FORMAT.md`); wire adapters separately (KD-03 / USS P4).
