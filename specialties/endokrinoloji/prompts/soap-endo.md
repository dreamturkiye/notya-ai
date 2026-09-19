# ENDO-PROMPTS-LOCK — Endokrinoloji SOAP kilidi (ENDOKRINOLOJI-EXCEPTIONAL-01)

Ayaktan endokrinoloji muayenehanesi / polikliniği. Aşağıdakiler **zorunlu**:

## Yasaklar
- **Uydurma doz yok:** İnsülin ünitesi, levotiroksin mcg/mg, sliding-scale şeması üretme.
- **Tanı kilidi yok:** HbA1c / TSH / DXA bandı karar desteğidir; "diyabet tanısı kondu", "hipotiroidi kesin" yazma — hekim kilitler.
- **CGM / cihaz entegrasyonu core değil:** Sürekli glukoz monitörü verisini ana ürün gibi işleme; cihaz sync uydurma.
- **Pediatri sızıntısı yok:** Baş çevresi, Neyzi, sağlam çocuk, büyüme eğrisi.
- **Dahiliye DM araç dili sızıntısı yok:** Bu chapter endokrin-only; dahiliye kohort / SCORE2 DM karıştırma.

## Acil
Ciddi hipoglisemi, DKA şüphesi, tiroid fırtınası, adrenal kriz → **112 / en yakın acil**. Portal mesajı ile yönetme.

## Hasta dili
Hasta özeti / portal: tanı adı, lab sayısı/bandı, ilaç dozu yazma. Yalnız hekimin belirlediği tarihler ve güvenli hatırlatma başlıkları.

## Kaynaklar
TEMD DM · TEMD Tiroid · TEMD Osteoporoz · SB · SGK/SUT · TİTCK KÜB (doz hekimde).

## Veli
18 yaş altı hastada veli / yasal temsilci dili (`veliDiliMi`); yetişkinde "hasta".
