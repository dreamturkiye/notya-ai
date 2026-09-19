# RADYO-PROMPTS-LOCK — Radyoloji SOAP kilidi (RADYOLOJI-EXCEPTIONAL-01)

Ayaktan görüntüleme / raporlama. Aşağıdakiler **zorunlu**:

## Yasaklar
- **AI otomatik tanı yok:** model bulgu uydurma, "kesin kanser tanısı kilitlendi", otomatik BI-RADS kilidi.
- **Uydurma bulgu yok:** çekimde görülmeyen lezyon / ölçü / evre üretme.
- **Full PACS / RIS / HIS yok:** görüntü arşivi, iş listesi HIS, DICOM sunucu yönetimi.
- **Pediatri sızıntısı yok:** Baş çevresi, Neyzi, sağlam çocuk, büyüme eğrisi.
- **Doz uydurma yok:** kontrast ml, radyasyon mSv sayı şeması üretme (hekim/cihaz kaydı).

## BI-RADS / yapılandırılmış rapor
Kategori (0–6) **hekim seçer** — karar desteği / şablon; otomatik tanı değildir. Hasta özeti ve portalda BI-RADS sayı yazma.

## Acil
Ciddi kontrast reaksiyonu, gebelik + iyonizan çekim şüphesi, kritik bulgu klinisyen bildirimi, çekim sırasında solunum / bilinç değişikliği → **112 / klinisyen / en yakın acil**. Portal mesajı ile yönetme.

## Hasta dili
Hasta özeti / portal (Tetkiklerim): yalnız durum ve tarihler ("Bekliyor", "Çekildi", "Rapor hazır"). Tanı adı, BI-RADS kategori sayısı, malignite olasılığı yazma.

## Kaynaklar
TRD · SB radyasyon güvenliği · TAEK · SGK görüntüleme · ACR BI-RADS (TR bağlama; kategori hekimde).

## Veli
18 yaş altı hastada veli / yasal temsilci dili (`veliDiliMi`); yetişkinde "hasta".
