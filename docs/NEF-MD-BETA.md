# NEF-MD-BETA — Nefroloji saha haftası checklist

**Ticket:** NEFROLOJI-EXCEPTIONAL-01 · Migration **069** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, nefroloji)

| Tile | Route | Kilit |
|------|-------|-------|
| eGFR / KDIGO şerit | `/doktor-tools/nef-egfr-kdigo` | Bant karar desteği; tanı/ESA doz yok |
| Diyaliz seans / takip | `/doktor-tools/nef-diyaliz` | Dates-only; makine HIS / UF yok |
| Anemi-CKD izlem | `/doktor-tools/nef-anemi` | ESA dozu yazılmaz |
| Kohort | `/doktor-tools/nef-kohort` | Hasta-güvenli hatırlatma + hekim ilaç checklist (mg yok) |

**Visibility:** yalnız `nefroloji`. Dahiliye CKD araçları bu grid'e sızmaz; nefro hekimi dahiliye kohortunu görmez.

## Portal

**Böbreklerim** `/bobreklerim` — Strong. Tanı / eGFR sayı / ESA doz yok. Acil → 112.

## Testler

```bash
npm run test:nef
npm run test:brans-sizmasi
```

## Intentional OUT

- Tam diyaliz makinesi HIS
- Tanı auto-lock
- Uydurma ESA dozu
- Canlı Medula e-imza

## MD week

- [ ] KDIGO G×A izlem aralıkları saha doğrulaması
- [ ] Anemi-CKD / ESA checklist metinleri
- [ ] Acil yönlendirme metinleri
- [ ] Portal hasta dili
