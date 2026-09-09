# Medula e-Reçete — araştırma ve uygulama kılavuzu (NOTYA-MEDULA)

Tarih: 2026-09-09. Kaynaklar: SGK "Medula Eczane Reçete ve Rapor Web Servisleri Kullanım Kılavuzu" v1.122
(03.09.2026, medeczane.sgk.gov.tr/doktor/faces/SaglikTesisiReceteVeRaporWebServisleri.pdf), test WSDL
(sgkt.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS?wsdl), imzalı XML şeması erecete.s1.xsd,
Muğla İSM "Özel hekimlerin dikkatine — e-Reçete Medula kayıt işlemi".

## Sahada durum (doğrulanmış)
- Özel hekim (muayenehane) SGK Sağlık SGM'de kaydolur, medeczane.sgk.gov.tr/doktor'dan **Medula Doktor**
  hesabı açar. Reçete ya Medula Doktor web uygulamasında ya da web servisi entegre bir yazılımla yazılır.
- Web servisi: SOAP 1.1 document/literal, ns `http://servisler.ws.eczane.gss.sgk.gov.tr`, JAX-WS sarmalayıcı
  (`<ser:metod><arg0>…</arg0></ser:metod>`), hekimin Medula kullanıcı adı/şifresi HTTP Basic (+ WSSE
  UsernameToken) ile **her istekte**. Alan sırası xs:sequence ile birebir olmak zorunda (aksi: "XML yapısı bozuk").
- 2016'dan beri gerçek ortamda yalnız **imzalı** metotlar (`imzaliEreceteGiris` vb.): XAdES-BES enveloping,
  RSA-SHA256, 5070 sayılı kanuna uygun **NES**, yalnız reçeteyi yazan hekim imzalar, imza doğrulaması SGK'da.
  → Sunucu tarafında imza atmak mümkün değil; imza doktorun cihazında (kart) veya mobil imzada atılır.
- Test ortamı kamuya açık: kullanıcı/şifre 99999999990, tesis 11068891, doktor TC 99999999990, hasta TC 99999999990.
  Test ortamı da NES ister (herhangi bir NES yeterli, doktor kontrolü yok).
- Kılavuz teknik detaydır, mevzuat değildir; SUT kuralları ayrı.

## Ne kanıtlandı (2026-09-09, scripts/_medula-smoke.mts ile)
- `ereceteSorgula` test ortamına gitti, auth kabul edildi, SGK iş kuralı cevabı döndü ("Reçete Numarası giriniz").
  → transport + kimlik + zarf + WSSE + alan sırası DOĞRU.
- `ereceteGiris` (imzasız) hâlâ `9999 — XML yapısı bozuk` döndürüyor. Alan sırası xsd2 ile birebir; olası
  sebepler: `barkod=0` parse aşamasında reddediliyor / `kisiDVO` beklentisi / liste sarmalaması. Sonraki adım:
  SGK'nın örnek dosyasıyla (`/doktor/faces/ornek/ornek_erecete.xml`) birebir karşılaştırma ve gerçek bir
  barkodla deneme.

## Kod
- `lib/medula/tipler.ts` — XSD'den tipler, kod tabloları (DOĞRULANACAK işaretli), test/gerçek adresleri.
- `lib/medula/receteHazirla.ts` — P1: onaylı ilaçlardan Medula taslağı; "2x1 10 gün" ayrıştırma, kullanım şekli,
  SUT/güvenlik uyarıları (yaş kısıtları, antibiyotik süre, PPİ 8 hafta, 3 kutu), `medulaMetni()` (kopyala),
  `ereceteXml()` (erecete.s1.xsd sırasında, imzalanacak veri).
- `lib/medula/soapIstemci.ts` — P3 istemci; `MEDULA_ORTAM` yoksa uyur. `ereceteGiris` yalnız test için;
  `imzaliEreceteGiris` hazır imzalı base64 alır.
- `app/api/doktor/medula/recete` — GET taslak+metin+uyarılar+xml; POST yalnız MEDULA_ORTAM=test iken test
  ortamına deneme. Yazdır sayfasında "📋 Medula için kopyala" + Ayşe uyarı kutusu.

## Bilerek yapılmayan / sınırlar
- Notya hasta TC'sini hash-only tutar → reçetede TC yok; doktor Medula'da hastayı seçer. P3'te TC gönderim
  anında girilir, saklanmaz.
- İlaç barkod eşlemesi yok (SGK ilaç listesi Yardımcı İşlemler WS'den 17:00-08:00 arasında tesis
  kimliğiyle çekilebilir — `aktifIlacListesiSorgula`). Barkod olmadan P3 gönderim mümkün değil; P1'de doktor
  Medula'da seçer.
- Kod tabloları (provizyon, alt tür, periyot birimi, kullanım şekli, branş) Tablo 9 ile doğrulanmadı.

## Yol haritası (2026-09-09 akşam revizyonu — Kaan'ın "ekran neden gerekli?" sorusu üzerine araştırıldı)
- SGK'nın kendi tanımı (e.sgk.gov.tr Uygulama Portalı): Medula Doktor Uygulaması = hekimin e-Reçete/e-Rapor **parolasını aldığı**,
  daha önce yazdığı reçete/raporları **görüntülediği** ve iade edilen reçeteye **ekleme yaptığı** uygulama. Reçete YAZMA formu
  değildir — kılavuz 1.53 ile ekleme bölümleri de web servise taşındı. Login sayfasında "Yeni Medula Hekim uygulaması"
  bağlantısı var (medeczane.sgk.gov.tr/hekim/) ama 2026-09-09 itibarıyla sunucu hatası veriyor (SRVE0255E) — izlenecek.
- Sonuç: **P2 "form doldurucu" diye bir hedef yok**; muayenehane hekimi e-reçeteyi ancak Medula web servisine entegre bir
  yazılımla (MBYS/entegratör — Wellopta sınıfı) ya da kâğıt reçeteyle yazar. Gerçek yol P3'tür ve SGK tarafında ek onay
  gerektirmez: hekimin Medula kullanıcı adı/şifresi (her istekte, Notya saklamaz) + NES imzası.
- **P1 (canlı):** Medula'ya hazır reçete + uyarılar + kopyala — mevcut yazılımı olan hekim için yapıştırma, olmayan için kâğıt.
- **P3-a (sıfır lisans, sunucu tarafı hazır):** `imzaliEreceteGiris` sarmalayıcı + `ereceteXml` (erecete.s1.xsd) mevcut.
  Kalan: ilaç barkod eşlemesi (`aktifIlacListesiSorgula`, hekimin tesis kimliği ile, 17:00–08:00) ve `ereceteGiris` test
  cevabının çözümü (SGK örnek XML ile diff).
- **P3-b (doktor cihazında imza):** küçük yerel imzalayıcı ajan (localhost) — tarayıcı XML'i gönderir, ajan NES kartıyla
  XAdES-BES enveloping / RSA-SHA256 imzalar, base64 döner; Notya `imzaliEreceteGiris` ile iletir. Açık kaynak XAdES
  kütüphanesiyle (xades4j / xmlsec) sıfır lisans; ticari alternatifler (ArkSigner, İmzager) yıllık lisans ister — Kaan'ın
  "ek maliyet yok" kuralı gereği açık kaynak. e-Devlet/UYAP/EKAP aynı deseni kullanır.
- **Gökhan'dan gereken artık ekran DEĞİL:** (1) bugün e-reçeteyi nasıl yazdığı (MBYS mi, kâğıt mı), (2) Medula Doktor
  kullanıcı adı/şifresi olup olmadığı, (3) NES kartı + hangi PC'de, (4) tesis kodu (ilaç listesi sorgusu için).
- Sözcük kuralı aynı: P3 canlı olana kadar "Medula'ya hazırlama"; sonrasında "Medula e-reçete gönderimi".
