# ENFEKSIYON-MD-BETA — Enfeksiyon Hastalıkları saha haftası checklist

**Ticket:** ENFEKSIYON-EXCEPTIONAL-01 · Migration **071** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, enfeksiyon-hastaliklari)

| Tile | Route | Kilit |
|------|-------|-------|
| İzolasyon / bildirim | `/doktor-tools/enfeksiyon-izolasyon` | Tanı yok; hastane HIS yok |
| Antibiyotik süre | `/doktor-tools/enfeksiyon-atb-sure` | Doz/mg/etken madde invent yok |
| HIV / viral izlem | `/doktor-tools/enfeksiyon-viral-izlem` | CD4/viral yorumu tanı değil |
| Kohort | `/doktor-tools/enfeksiyon-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `enfeksiyon-hastaliklari`. Dahiliye / pediatri / kardiyoloji / göğüs bu tile'ları görmez.

## Portal

**Enfeksiyon Takibim** `/enfeksiyon-takibim` — Strong. Tanı / CD4 sayı / doz yok. Acil → 112.

## Testler

```bash
npm run test:enfeksiyon
npm run test:brans-sizmasi
```

## Intentional OUT

- Hastane enfeksiyon kontrolü full HIS
- Tanı auto-lock
- Uydurma antibiyotik dozu / rejim invent
- Canlı Medula e-imza

## MD week

- [ ] ATB süre / viral izlem aralıkları saha doğrulaması
- [ ] İzolasyon / bildirim hatırlatma dili
- [ ] Acil yönlendirme metinleri
- [ ] Portal hasta dili
