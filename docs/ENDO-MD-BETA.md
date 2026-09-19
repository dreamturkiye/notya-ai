# ENDO-MD-BETA — Endokrinoloji saha haftası checklist

**Ticket:** ENDOKRINOLOJI-EXCEPTIONAL-01 · Migration **067** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, endokrinoloji)

| Tile | Route | Kilit |
|------|-------|-------|
| HbA1c / tiroid izlem | `/doktor-tools/endo-lab-izlem` | Bant karar desteği; tanı/doz yok; CGM yok |
| Osteoporoz / DXA | `/doktor-tools/endo-dxa` | T-skor yorumu yok |
| İnsülin / tiroid rejim | `/doktor-tools/endo-rejim` | Dates-only; ünite/mcg yok |
| Kohort | `/doktor-tools/endo-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `endokrinoloji`. Dahiliye DM araçları bu grid'e sızmaz; endokrin hekimi dahiliye kohortunu görmez.

## Portal

**Hormonlarım** `/hormonlarim` — Strong. Tanı / HbA1c sayı / doz yok. Acil → 112.

## Testler

```bash
npm run test:endo
npm run test:brans-sizmasi
```

## Intentional OUT

- CGM cihaz entegrasyonu (core değil)
- Tanı auto-lock
- Uydurma insülin / levotiroksin dozu
- Canlı Medula e-imza

## MD week

- [ ] TEMD DM / Tiroid / OP izlem aralıkları saha doğrulaması
- [ ] Acil yönlendirme metinleri
- [ ] Portal hasta dili
