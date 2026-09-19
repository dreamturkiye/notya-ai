# BEYIN-MD-BETA — Beyin Cerrahisi saha haftası checklist

**Ticket:** BEYIN-CERRAHISI-EXCEPTIONAL-01 · Migration **077** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, beyin-cerrahisi)

| Tile | Route | Kilit |
|------|-------|-------|
| Nöro post-op checklist | `/doktor-tools/bc-postop` | Madde+tarih; tanı/OR/HIS/AED doz yok |
| Görüntü belge köprü | `/doktor-tools/bc-goruntu` | Tarih+etiket; AI tanı yok |
| Nöbet / bilinç izlem | `/doktor-tools/bc-bilinc` | Bayrak+tarih; AED doz yok |
| Kohort | `/doktor-tools/bc-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `beyin-cerrahisi`. Nöroloji (Migren/İnme) / genel-cerrahi / pediatri bu grid'i görmez.

## Portal

**Beyin Cerrahisi takibi** `/beyin-takibi` — Strong. Tanı / AED doz / migren-inme skoru yok. Acil → 112.

## Testler

```bash
npm run test:beyin
npm run test:brans-sizmasi
```

## Intentional OUT

- Ameliyathane OR / full HIS
- Tanı auto-lock
- Uydurma AED dozları

## MD week

- [ ] Post-op checklist maddeleri saha doğrulaması
- [ ] Nöbet/bilinç bayrak dili
- [ ] Görüntü köprü etiketleri
- [ ] Portal hasta dili (tanı/AED sızıntısı yok)
- [ ] Noroloji çapraz sızıntı yok
