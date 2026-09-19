# GOGUS-CERRAHISI-MD-BETA — Göğüs Cerrahisi saha haftası checklist

**Ticket:** GOGUS-CERRAHISI-EXCEPTIONAL-01 · Migration **076** · Olgunluk `beta-hazir`

**Ayrı branş:** `gogus-hastaliklari` (pulmonoloji) — CAT/mMRC/Akciğerlerim bu üründe **yok**.

## Araçlar (4 — specialty-only, gogus-cerrahisi)

| Tile | Route | Kilit |
|------|-------|-------|
| Pre-op solunum checklist | `/doktor-tools/gogus-cerrahi-preop` | Madde listesi; CAT/doz/OR yok |
| Toraks tüp / yara izlem | `/doktor-tools/gogus-cerrahi-tup-yara` | Tip+durum+tarih; tanı yok |
| Patoloji köprü | `/doktor-tools/gogus-cerrahi-patoloji` | Tarih+hazır; ICD/tanı yok |
| Kohort | `/doktor-tools/gogus-cerrahi-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `gogus-cerrahisi`. `gogus-hastaliklari` / genel-cerrahi / kardiyoloji bu grid'i görmez.

## Portal

**Göğüs Cerrahisi takibi** `/gogus-cerrahisi-takibim` — Strong. Tanı / CAT / doz yok. Acil → 112.

## Testler

```bash
npm run test:gogus-cerrahisi
npm run test:brans-sizmasi
```

## Intentional OUT

- Ameliyathane / full OR HIS
- Tanı auto-lock
- Uydurma dozlar

## MD week

- [ ] Pre-op checklist maddeleri saha doğrulaması
- [ ] Tüp çekim / yara izlem dili
- [ ] Patoloji köprü (tanı sızıntısı yok)
- [ ] Portal hasta dili (CAT/mMRC sızıntısı yok)
