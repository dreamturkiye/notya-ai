# ONKO-MD-BETA — Onkoloji saha haftası checklist

**Ticket:** ONKOLOJI-EXCEPTIONAL-01 · Migration **072** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, onkoloji)

| Tile | Route | Kilit |
|------|-------|-------|
| Tedavi döngü / kür sayacı | `/doktor-tools/onko-kur` | Sayı+tarih; mg/m²/AUC/BSA yok |
| Toksisite checklist | `/doktor-tools/onko-toksisite` | Grade tanı değildir; doz hekimde |
| SUT rapor taslağı | `/doktor-tools/onko-sut` | Canlı Medula e-imza yok |
| Kohort (± görüntü çizelgesi) | `/doktor-tools/onko-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `onkoloji`. Dahiliye / hematoloji / radyasyon onkolojisi bu grid'i görmez.

## Portal

**Tedavim** `/tedavim` — Strong. Tanı / evre / doz yok. Acil → 112.

## Testler

```bash
npm run test:onko
npm run test:brans-sizmasi
```

## Intentional OUT

- Eczane kemoterapi doz motoru
- Tanı / evre auto-lock
- Uydurma kemoterapi dozları
- Canlı Medula e-imza

## MD week

- [ ] Kür aralıkları / protokol etiketleri saha doğrulaması
- [ ] Toksisite listesi dili
- [ ] SUT taslak alanları
- [ ] Portal hasta dili (tanı/evre sızıntısı yok)
