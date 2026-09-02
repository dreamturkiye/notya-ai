# SIMPLICITY AUDIT — Doktor Vertical (2026-09-02)

Prensip (Kaan, 2026-09-02): Apple sadeliği + doğal insan düşüncesi. **Yakınsak fazlalık
iyidir** (aynı hedefe birden çok doğal yol: hasta dosyasına hastalar menüsünden DE
randevudan DA girilebilmeli). **Iraksak karmaşıklık kötüdür** (benzer işler için ayrı
kavramlar/ekranlar/butonlar). Hiçbir öneri bir "kolaylığı" kaldırmaz; yalnız kavram
sayısını azaltır.

## Bulgu: üst menüde 14 kalem
Asistan · Ana Sayfa · Randevular · Hastalar · Hasta Ekle · Belgeler · Görüntüleme ·
İlaçlar · Raporlar · İnceleme · Entegrasyonlar · Personel · Araçlar · SGK

Yaşlı bir doktor için 14 seçenek = karar yorgunluğu. Hedef: **5 kalem**.
Asistan · Randevular · Hastalar · Raporlar · Ayarlar

## Öneriler (numara ile onaylayın)

**Ö1 — Belgeler / Görüntüleme / İlaçlar üst menüden kalksın.** Bu üçü hasta-başına
veridir; üst menüden girince zaten önce hasta seçtiriyorlar. Doğal ev: hasta dosyası
sekmeleri (zaten var). Rotalar ve derin linkler KALIR (kolaylık kaybı yok), yalnız nav
kalemi gider. Etki: 3 kalem eksilir. Risk: düşük. Efor: küçük (nav dizisi).

**Ö2 — "Hasta Ekle" üst menüden kalksın; buton olarak kalsın.** Hastalar sayfasında
büyük "+ Hasta Ekle" butonu + randevu modalındaki kayıtsız akış + asistanın
CREATE_PATIENT aksiyonu = üç yakınsak yol zaten var. Rota kalır. Etki: 1 kalem. Risk:
düşük. Efor: küçük.

**Ö3 — "Ana Sayfa" ile "Randevular" birleşsin.** Doktorun gerçek "günü": bugünün
takvimi + Bugün/Yarın ajandası — bu zaten Randevular'ın kenar çubuğu. Ana Sayfa'daki
özet kartlar Randevular üstüne ince bir şerit olarak taşınır ya da Ana Sayfa
/randevular'a yönlenir. Etki: 1 kalem. Risk: orta (mevcut alışkanlık). Efor: orta.

**Ö4 — Entegrasyonlar · Personel · SGK · Araçlar → tek "Ayarlar" (⚙) altına.** Bunlar
günlük klinik akış değil, kurulum/idare işleridir; günde bir kez bile açılmazlar.
Tek dişli menüsü altında dört bölüm. Etki: 4 kalem → 1. Risk: düşük. Efor: küçük-orta.

**Ö5 — "İnceleme" kaldırılsın ya da Raporlar'a katılsın.** (İçeriğine göre: seans
inceleme ise Raporlar/Muayene Geçmişi zaten kapsıyor.) Karar öncesi 2 dakikalık içerik
kontrolü yapılır. Etki: 1 kalem. Risk: içeriğe bağlı.

**Ö6 — Araçlar içinde asistanla çakışanlar emekliye (v2).** ilac-interaksiyon (asistan
artık dosyadan proaktif uyarıyor), hatirlatma (cron + randevu akışı), hasta-portali
(intake linkleri) → asistan/akış karşıladıkça tek tek kaldır. Şimdi değil; kullanım
verisi biriksin. Etki: kavram sayısı zamanla azalır.

**Ö7 — Hasta dosyası sekmeleri (8) DOKUNULMAZ.** Özet, Muayene Geçmişi, Belgeler,
Görüntüleme, İlaçlar, Hasta Formu, Aşılar, Ayşe'ye Danış — hepsi tek hastanın bağlamında
ve klinik olarak ayrık. Birleştirme kolaylık kaybettirir. Öneri: olduğu gibi kalsın.

**Korunan yakınsak yollar (bilinçli fazlalık):** hasta dosyasına Hastalar menüsünden,
randevu kartındaki "Hasta Dosyasını Aç"tan, randevu modalından, asistan sohbetinden;
muayeneye randevudan (Muayeneyi Başlat) ve session/new'den; hasta eklemeye üç yoldan.
Bunların hiçbiri kaldırılmaz.

## Uygulama sırası (onay sonrası)
1. Ö1+Ö2+Ö4 tek PR (nav yeniden düzeni, ~1 saat).
2. Ö5 içerik kontrolü → aynı PR'a dahil ya da ayrı küçük PR.
3. Ö3 ayrı PR (Ana Sayfa kartlarının taşınması).
4. Ö6 v2 — OPEN-COMMITMENTS'ta izlenir.

Sonuç: 14 → 5 üst kalem; sıfır kaldırılan kolaylık; asistan "her şeye açılan tek doğal
kapı" olarak merkezde.
