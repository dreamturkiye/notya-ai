# KALP-DAMAR-CERRAHISI-MD-BETA — Kalp Damar Cerrahisi saha haftası checklist

**Ticket:** KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 · Migration **081** · Olgunluk `beta-hazir`

**Ayrı branş:** `kardiyoloji` — SCORE2 / Kalbim / HT-KKY bu üründe **yok** (ve tersi).

## Araçlar (4 — specialty-only, kalp-damar-cerrahisi)

| Tile | Route | Kilit |
|------|-------|-------|
| Pre-op risk checklist | `/doktor-tools/kdc-preop` | Madde listesi; SCORE2/doz/OR yok |
| Greft / yara izlem | `/doktor-tools/kdc-greft-yara` | Tip+durum+tarih; tanı yok |
| Antikoagülan izlem vadeleri | `/doktor-tools/kdc-antikoag` | Sınıf+vade; mg/INR hedef yok |
| Kohort | `/doktor-tools/kdc-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `kalp-damar-cerrahisi`. `kardiyoloji` / genel-cerrahi / göğüs-cerrahisi bu grid'i görmez.

## Portal

**Damar Cerrahisi takibi** `/damar-cerrahisi-takibi` — Strong. Tanı / SCORE2 / doz yok. Acil → 112.

## Testler

```bash
npm run test:kalp-damar
npm run test:brans-sizmasi
```

## Intentional OUT

- Ameliyathane / full OR HIS
- Tanı auto-lock
- Uydurma antikoagülan dozları

## MD week

- [ ] Pre-op checklist maddeleri saha doğrulaması
- [ ] Greft / yara izlem dili
- [ ] Antikoagülan vade (doz sızıntısı yok)
- [ ] Portal hasta dili (SCORE2/Kalbim sızıntısı yok)
