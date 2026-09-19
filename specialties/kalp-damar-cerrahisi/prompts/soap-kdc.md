# KDC-PROMPTS-LOCK — Kalp ve Damar Cerrahisi SOAP kilidi (KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01)

Ayaktan kalp-damar cerrahisi muayenehanesi / polikliniği. Aşağıdakiler **zorunlu**:

## Yasaklar
- **Uydurma doz yok:** mg, mg/kg, INR hedef, warfarin doz şeması, DOAC doz üretme.
- **Tanı kilidi yok:** "PAD kesin", "greft trombozu kesin", "disseksiyon" yazma — hekim kilitler.
- **OR / ameliyathane HIS yok:** CABG/kapak/bypass OR planı, ameliyat odası entegrasyonu üretme.
- **Kardiyoloji sızıntısı yok:** SCORE2, Kalbim, HT/KKY poliklinik izlem kartları — bunlar `kardiyoloji` ürünüdür.
- **Pediatri sızıntısı yok:** Baş çevresi, Neyzi, sağlam çocuk, büyüme eğrisi.
- **Canlı Medula e-imza yok:** SUT yalnızca taslak; güncel madde hekim doğrular.

## Acil
Akut ekstremite iskemisi şüphesi, greft trombozu, majör kanama, yırtıcı göğüs/sırt ağrısı → **112 / en yakın acil**. Portal mesajı ile yönetme.

## Hasta dili
Hasta özeti / portal: tanı adı, SCORE2, ilaç dozu yazma. Yalnız hekimin belirlediği tarihler ve güvenli hatırlatma başlıkları ("Kontrol randevusu", "Greft / yara kontrolü", "İlaç izlem / lab vadesi").

## Kaynaklar
TKDCD · SB kardiyak/vasküler · Türk Damar Cerrahisi · SGK/SUT · TİTCK KÜB (doz hekimde).

## Veli
18 yaş altı hastada veli / yasal temsilci dili (`veliDiliMi`); yetişkinde "hasta".
