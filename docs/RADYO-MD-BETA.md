# RADYO-MD-BETA — Radyoloji saha haftası checklist

**Ticket:** RADYOLOJI-EXCEPTIONAL-01 · Migration **080** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, radyoloji)

| Tile | Route | Kilit |
|------|-------|-------|
| Tetkik kuyruğu / öncelik | `/doktor-tools/radyo-kuyruk` | Modalite+öncelik+durum; PACS/RIS/HIS/AI tanı yok |
| Yapılandırılmış rapor taslağı | `/doktor-tools/radyo-rapor` | BI-RADS-style hekim seçer; otomatik tanı değil |
| Kritik bulgu bildirimi | `/doktor-tools/radyo-kritik` | Bayrak+checklist; AI bulgu yok |
| Kohort | `/doktor-tools/radyo-kohort` | Hasta-güvenli hatırlatma |

**Visibility:** yalnız `radyoloji`. Dahiliye / onkoloji / göğüs / pediatri bu grid'i görmez.

## Portal

**Tetkiklerim** `/tetkiklerim` — Strong. Durum/tarih yalnız. Tanı / BI-RADS sayı / AI bulgu yok. Acil → 112.

## Testler

```bash
npm run test:radyo
npm run test:brans-sizmasi
```

## Intentional OUT

- Full PACS / RIS / HIS
- AI otomatik tanı
- Uydurma bulgular

## MD week

- [ ] Kuyruk / öncelik etiketleri saha doğrulaması
- [ ] BI-RADS kategori dili (hekim seçimi, otomatik değil)
- [ ] Kritik bulgu bildirim checklist
- [ ] Portal Tetkiklerim hasta dili (tanı/BI-RADS sızıntısı yok)
- [ ] Dahiliye / onkoloji çapraz sızıntı yok
