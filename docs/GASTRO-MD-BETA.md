# GASTRO-MD-BETA — Gastroenteroloji saha haftası checklist

**Ticket:** GASTROENTEROLOJI-EXCEPTIONAL-01 · Migration **068** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, gastroenteroloji)

| Tile | Route | Kilit |
|------|-------|-------|
| IBD / IBS skor | `/doktor-tools/gastro-ibd-ibs` | Bant karar desteği; tanı/doz yok |
| Endoskopi belge köprüsü | `/doktor-tools/gastro-endoskopi` | HIS / ameliyathane yok |
| HBV / HCV izlem | `/doktor-tools/gastro-hepatit` | Antiviral doz yok |
| Kohort | `/doktor-tools/gastro-kohort` | Hasta-güvenli hatırlatma; PPI/biyolojik dates-only |

**Visibility:** yalnız `gastroenteroloji`. Dahiliye FIB-4 / GGK araçları bu grid'e sızmaz; gastro hekimi dahiliye kohortunu görmez.

## Portal

**Sindirimim** `/sindirimim` — Strong. Tanı / skor / doz yok. Acil → 112.

## Testler

```bash
npm run test:gastro
npm run test:brans-sizmasi
```

## Intentional OUT

- Tam endoskopi suite / HIS / ameliyathane
- Tanı auto-lock
- Uydurma antiviral / PPI / biyolojik dozu
- Canlı Medula e-imza

## MD week

- [ ] TGD IBD/IBS skor eşikleri saha doğrulaması
- [ ] HBV/HCV izlem aralıkları
- [ ] Acil yönlendirme metinleri
- [ ] Portal hasta dili
