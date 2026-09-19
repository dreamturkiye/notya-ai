# ANESTEZI-MD-BETA — Anestezi saha haftası checklist

**Ticket:** ANESTEZI-EXCEPTIONAL-01 · Migration **079** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, anestezi)

| Tile | Route | Kilit |
|------|-------|-------|
| ASA / pre-op checklist | `/doktor-tools/anestezi-asa` | Madde+ASA sınıfı+tarih; tanı/OR HIS/doz yok |
| Hava yolu notu | `/doktor-tools/anestezi-hava-yolu` | Bayrak+tarih; teknik/doz yok |
| Post-op ağrı izlem | `/doktor-tools/anestezi-agri` | Skor+bayrak; analjezik mg yok |
| Kohort | `/doktor-tools/anestezi-kohort` | ± alerji/ilaç; hasta-güvenli hatırlatma |

**Visibility:** yalnız `anestezi`. Genel cerrahi / göğüs cerrahisi / pediatri / kardiyoloji bu grid'i görmez.

## Portal

**Anestezi Öncesi** `/anestezi-oncesi` — Strong. Tanı / ASA skor yorumu / ilaç dozu yok. Acil → 112.

## Testler

```bash
npm run test:anestezi
npm run test:brans-sizmasi
```

## Intentional OUT

- Ameliyathane OR anestezi makinesi / full HIS
- Tanı auto-lock
- Uydurma ilaç dozları

## MD week

- [ ] ASA/pre-op checklist maddeleri saha doğrulaması
- [ ] Hava yolu bayrak dili
- [ ] Post-op ağrı skor dili (doz sızıntısı yok)
- [ ] Portal hasta dili (tanı/doz sızıntısı yok)
- [ ] Genel cerrahi / göğüs cerrahisi çapraz sızıntı yok
