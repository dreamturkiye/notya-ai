# GOGUS-MD-BETA — Göğüs Hastalıkları uzman doğrulama kontrol listesi

**Sprint:** GOGUS-EXCEPTIONAL-01 · olgunluk `beta-hazir` → hedef `uzman-dogrulandi`  
**Canlı audit:** https://notya-ai.vercel.app/gogus-exceptional-audit.html  
**Portal:** Akciğerlerim `/akcigerlerim`

## Hazırlık

- [ ] `npm run test:gogus` yeşil
- [ ] Migration `061_gogus_exceptional.sql` uygulandı (hasta_gogus, gogus_skor, gogus_gorevleri, gogus_risk + RLS)
- [ ] Araçlar grid’de 5 göğüs kartı: CAT/mMRC · Aksiyon planı · İnhaler · SGK solunum · Kohort
- [ ] `gogus-cerrahisi` hesabında bu 5 kart **yok**
- [ ] Hasta dosyası › Göğüs sekmesi yalnız göğüs hastalıkları hekiminde

## 5 günlük MD beta

| Gün | Odak | Not |
|-----|------|-----|
| 1 | CAT / mMRC + GOLD grubu (karar desteği) | Tanı kilidi yok; skor SOAP’a taslak |
| 2 | Astım / KOAH aksiyon planı | mcg/puff yazılmıyor mu? |
| 3 | İnhaler teknik + kohort hatırlatma | Hasta mesajında skor/tanı yok |
| 4 | SGK solunum taslağı (USOT / nebul) | T.C. yok; Medula e-imza yok |
| 5 | Portal Akciğerlerim + acil bayraklar | 112 dili; CAT/GOLD hasta yüzünde yok |

## Bilinçli OUT (MD’ye söyle)

- Tam SFT cihaz / PFT makinesi entegrasyonu yok (elle giriş var)
- Tanı auto-lock yok
- Uydurma doz yok
- Toraks cerrahisi / OR (`gogus-cerrahisi`) ayrı branş — bu üründe yok

## Çıkış

Uzman onayından sonra profil `olgunluk: 'uzman-dogrulandi'` (ayrı PR).
