# Romatoloji MD Beta Checklist — ROMATOLOJI-EXCEPTIONAL-01

Olgunluk: **beta-hazir**. Uzman-doğrulandı MD week pending.

## Araçlar (4 — specialty-only, romatoloji)

1. DAS28 / BASDAI — aktivite bandı karar desteği; tanı değil
2. Biyolojik SUT checklist — TB/HBV/HCV; doz / yükleme / infüzyon HIS yok
3. Lab izlem / eklem haritası — CRP/ESR + 28 eklem TJC/SJC
4. Romatoloji kohort paneli — 1-tap hasta-güvenli hatırlatma

**Visibility:** yalnız `romatoloji`. Ortopedi / FTR / dahiliye tile'ları sızmaz.

## Portal

**Romatizmam** `/romatizmam` — Strong. Tanı / DAS28 sayı / doz yok. Acil → 112.

## Intentional OUT

- İnfüzyon süiti / HIS randevu
- Tanı auto-lock
- Uydurma biyolojik doz / canlı Medula e-imza

## Test

```bash
npm run test:roma
```
