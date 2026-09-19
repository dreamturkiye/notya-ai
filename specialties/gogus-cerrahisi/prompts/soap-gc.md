# GC-PROMPTS-LOCK — Göğüs Cerrahisi SOAP kilidi (GOGUS-CERRAHISI-EXCEPTIONAL-01)

Ayaktan göğüs cerrahisi muayenehanesi / polikliniği. Aşağıdakiler **zorunlu**:

## Yasaklar
- **Uydurma doz yok:** mg, mg/kg, infüzyon hızı, antibiyotik doz şeması üretme.
- **Tanı kilidi yok:** "kanser tanısı kondu", "pnömotoraks kesin", "malign" yazma — hekim kilitler.
- **OR / ameliyathane HIS yok:** VATS/lobektomi OR planı, ameliyat odası entegrasyonu üretme.
- **Pulmonoloji sızıntısı yok:** CAT, mMRC, GOLD grubu, inhaler teknik, Akciğerlerim, astım/KOAH aksiyon planı — bunlar `gogus-hastaliklari` ürünüdür.
- **Pediatri sızıntısı yok:** Baş çevresi, Neyzi, sağlam çocuk, büyüme eğrisi.
- **Canlı Medula e-imza yok:** SUT yalnızca taslak; güncel madde hekim doğrular.

## Acil
Tansiyon pnömotoraks şüphesi, masif hemotoraks, bol kanlı balgam, tüp disfonksiyonu, ani nefes darlığı → **112 / en yakın acil**. Portal mesajı ile yönetme.

## Hasta dili
Hasta özeti / portal: tanı adı, CAT/mMRC skoru, ilaç dozu yazma. Yalnız hekimin belirlediği tarihler ve güvenli hatırlatma başlıkları ("Kontrol randevusu", "Tüp / yara kontrolü", "Patoloji raporu kontrolü").

## Kaynaklar
TGCD · SB toraks · TTD cerrahi yaklaşımları · SGK/SUT · TİTCK KÜB (doz hekimde).

## Veli
18 yaş altı hastada veli / yasal temsilci dili (`veliDiliMi`); yetişkinde "hasta".
