# Plastik Cerrahi — MD beta checklist

**Ticket:** PLASTIK-CERRAHI-EXCEPTIONAL-01 · Migration **074** · Olgunluk `beta-hazir`

## Araçlar (4 — specialty-only, plastik-cerrahi)

1. Foto zaman çizgisi köprü — `/doktor-tools/plastik-foto`
2. Yara / greft izlem — `/doktor-tools/plastik-yara`
3. Onam taslağı checklist — `/doktor-tools/plastik-onam`
4. Plastik kohort paneli — `/doktor-tools/plastik-kohort`

**Visibility:** yalnız `plastik-cerrahi`. Dermatoloji / genel-cerrahi / pediatri bu grid'i görmez.

## Portal

**Yaram** `/yaram` — Strong. Tanı / skor / doz yok. Acil → 112.

## Intentional OUT

- OR scheduling / full HIS
- Tanı auto-lock
- Uydurma doz (antibiyotik / lokal anestezik)

## MD week teyit

- [ ] Pansuman / dikiş alma aralıkları ünite protokolüne göre
- [ ] Flep / hematom acil yönlendirme dili
- [ ] Onam checklist maddeleri klinik forma uyumu
- [ ] Estetik vs rekonstrüktif hasta dili (portal genel yara dili)

## Test

```bash
npm run test:plastik
```

Live audit: https://notya-ai.vercel.app/plastik-exceptional-audit.html
