# Dijital Aşı Onam içeriği — klinik inceleme ve imza formu (Dr. Gökhan Mamur)

> Durum: **ONAYSIZ** — yapay zekâ klinik onay vermez. Bu form Dr. Gökhan'ın birkaç dakikada gözden geçirmesi için hazırlandı.
> Kaynak dosya: `lib/asi/onam/asiOnamIcerigi.ts` (sürüm: bu belgenin üretildiği commit). Takvim: `lib/asi/ulusalAsiTakvimi.ts`.
> Hazırlanma tarihi: 2026-10-17. Metinler veri setinden otomatik aktarılmıştır (elle yazılmadı); formdaki "Veliye gösterilen metin" bölümleri birebir sistemdeki metindir.

## Nasıl kullanılır

1. Her aşı için "Veliye gösterilen metin"i okuyun, "Teyit edilecekler" maddelerine bakın.
2. **Onay** veya **Düzeltme gerekli** kutusunu işaretleyin; düzeltme varsa yan boşluğa yazın.
3. Sonunda genel onay satırını imzalayın/yazın. Sonra tek değişiklik: `ASI_ONAM_KLINIK_ONAYI` içinde `onayli: true`, `onaylayan`, `tarih`, `surum` (lib/asi/onam/asiOnamIcerigi.ts).

## Genel durum (bu inceleme sırasında yapılan çapraz kontrol)

Kontrol edilen: ulusal takvim zamanlaması (2, 4, 6, 18. ay 6'lı karma; 12. ay KPA/KKK/Suçiçeği; 18-24. ay Hep A; 48. ay KKK-2/DaBT-İPA; 13 yaş Td) veri setiyle tutarlı çıktı. Kaynaklar: Sağlık Bakanlığı güncellemesini aktaran Anadolu Ajansı haberi (Nisan 2025) ve KLİMİK 2026 sunumu (14 Nisan 2025 yürürlük, 6'lı karma 2-4-6-18. ay). Birincil SB sayfaları (asi.saglik.gov.tr, hsgm.saglik.gov.tr) bu ortamdan okunamadı; bu yüzden resmî takvim tablosunu Dr. Gökhan'ın kendi gözüyle teyit etmesi gerekir. Açık kalan: Suçiçeği 2. doz (48. ay, Eylül 2026) resmî yazıyla doğrulanamadı.

Açık yanlış (kesin hata) bulunmadı, bu yüzden metinlerde değişiklik yapılmadı. Aşağıdaki maddeler **eksik/ürüne bağlı** olabilecek noktalardır; karar hekime aittir.

## Tüm aşılarda ortak onam cümlesi (her aşıda aynen gösterilir)

> Bu aşı(lar) hakkında yukarıdaki bilgileri okudum / bana okundu, sorularım yanıtlandı. Aşının yapılmasını kendi isteğimle (veya velisi/yasal temsilcisi olduğum çocuk için) kabul ediyorum. İstediğim zaman aşıyı reddetme hakkım olduğu anlatıldı.

- [ ] Onay   - [ ] Düzeltme gerekli: ______________________________

## Aşı bazında inceleme

### 1. Hepatit B

- **Takvimdeki yeri:** Doğumda (ilk 72 saat) (1. doz (monovalan))
- **Veliye gösterilen metin — Korur:** Hepatit B virüsünün yol açtığı karaciğer iltihabı ve bu virüsün uzun dönemde yol açabileceği kronik karaciğer hastalığından korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde hassasiyet, kızarıklık veya şişlik
  - Hafif ateş
  - Huzursuzluk / uyku hali
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - Doğum dozu + 2/4/6/18. ay (6'lı karma içinde) şeması doğru mu? (1. ay tekil doz 2025 güncellemesiyle kalktı; yalnız <2000 g bebekte 1. ayda tekli doz verilir.)
  - Metne "maya / bileşenlere aşırı duyarlılık" uyarısı eklensin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 2. BCG (Verem)

- **Takvimdeki yeri:** 2. ayın sonu (Tek doz)
- **Veliye gösterilen metin — Korur:** Tüberküloz (verem) hastalığının ağır/yaygın (menenjit, miliyer) biçimlerinden korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Uygulama yerinde kızarıklık, küçük şişlik ve zamanla iz (skar) bırakan bir yara
  - Nadiren bölgesel lenf bezi şişliği
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - Takvimde 2. ay sonu; metin bu yaşla uyumlu mu?
  - Ülsere/iz bırakan yara ve lenfadenit tarifi yeterli mi? Bağışıklık yetmezliği / HIV maruziyeti kontrendikasyonu metne eklensin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 3. 6'lı Karma (DaBT-İPA-Hib-HepB)

- **Takvimdeki yeri:** 2. ayın sonu (1. doz); 4. ayın sonu (2. doz); 6. ayın sonu (3. doz); 18. ay (Rapel)
- **Veliye gösterilen metin — Korur:** Difteri, boğmaca (pertussis), tetanoz, çocuk felci (polio), Haemophilus influenzae tip b (Hib) menenjiti/zatürresi ve Hepatit B'den korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet
  - Ateş
  - Huzursuzluk, iştahsızlık, uyku hali
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 2/4/6/18. ay şeması (SB, 14 Nisan 2025 sonrası) doğru mu?
  - Nadir ama ciddi olaylar (yüksek ateş, uzamış ağlama, febril konvülsiyon, hipotonik-hiporesponsif epizod) için "hemen başvurun" cümlesi eklensin mi?
  - Ürün (Hexaxim/Hexyon, Infanrix Hexa) bazlı KÜB ile yan etki sıklıkları uyuşuyor mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 4. KPA (Konjuge Pnömokok)

- **Takvimdeki yeri:** 2. ayın sonu (1. doz); 4. ayın sonu (2. doz); 12. ay (Rapel)
- **Veliye gösterilen metin — Korur:** Pnömokok bakterisinin yol açtığı zatürre, kan zehirlenmesi (sepsis) ve menenjitten korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet
  - Ateş
  - Huzursuzluk, iştahsızlık
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 2, 4, 12. ay (2+1) şeması doğru mu?
  - Stoklanan ürün (PCV13 / PCV15 / PCV20) KÜB yan etki listesi ile uyumlu mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 5. OPA (Oral Polio)

- **Takvimdeki yeri:** 6. ayın sonu (1. doz); 18. ay (2. doz)
- **Veliye gösterilen metin — Korur:** Çocuk felci (polio) hastalığından korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Genellikle yan etkisi görülmez
  - Nadiren hafif ishal
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - Şu an yalnız "genellikle yan etkisi görülmez" yazıyor: çok nadir aşıya bağlı felç (VAPP) ve bağışıklığı baskılı hane içi temas riski metne eklensin mi? (Oral polio KÜB/WHO standardı)
  - Takvimde 6. ve 18. ay; 2025 güncellemesinden sonra hâlâ geçerli mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 6. KKK (Kızamık-Kızamıkçık-Kabakulak)

- **Takvimdeki yeri:** 12. ay (1. doz); 48. ay (2. doz)
- **Veliye gösterilen metin — Korur:** Kızamık, kızamıkçık (rubella) ve kabakulaktan korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Uygulamadan 1-2 hafta sonra hafif ateş ve döküntü olabilir
  - Enjeksiyon yerinde hassasiyet
  - Nadiren eklem ağrısı (özellikle büyük çocuk/erişkinde)
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 1. doz 12. ay, 2. doz 48. ay şeması doğru mu?
  - Febril konvülsiyon, nadiren trombositopeni (ITP), yumurta alerjisi, gebelik/bağışıklık yetmezliği kontrendikasyonu metne eklensin mi?
  - "Eklem ağrısı (büyük çocuk/erişkinde)" ifadesi uygun mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 7. Suçiçeği (Varisella)

- **Takvimdeki yeri:** 12. ay (1. doz); 48. ay (2. doz)
- **Veliye gösterilen metin — Korur:** Suçiçeği (varisella) hastalığından ve bu hastalığın nadir ama ağır komplikasyonlarından korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde kızarıklık, şişlik
  - Hafif ateş
  - Nadiren uygulama yerinde hafif döküntü
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 1. doz 12. ay; 2. doz 48. ay (Eylül 2026, 49-72 ay telafi) yalnızca basın kaynaklı — resmî yazı numarası bulunamadı, hekim teyit eder.
  - Aşı sonrası nadir suçiçeği benzeri döküntü ve aşılıdan bağışıklığı baskılı kişiye geçiş uyarısı eklensin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 8. Hepatit A

- **Takvimdeki yeri:** 18. ay (1. doz); 24. ay (2. doz)
- **Veliye gösterilen metin — Korur:** Hepatit A virüsünün yol açtığı karaciğer iltihabından korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde hassasiyet, kızarıklık
  - Hafif ateş
  - Baş ağrısı, iştahsızlık
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 18. ve 24. ay (2 doz) şeması doğru mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 9. DaBT-İPA (4'lü Karma)

- **Takvimdeki yeri:** 48. ay (Rapel)
- **Veliye gösterilen metin — Korur:** Difteri, boğmaca (pertussis), tetanoz ve çocuk felcinden (polio) korumayı pekiştirir (rapel).
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde kızarıklık, şişlik, hassasiyet
  - Ateş
  - Huzursuzluk
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 48. ay rapel — SB değişikliği ile uyumlu mu?
  - Rapel sonrası geniş bölgesel şişlik (kol/bacak) uyarısı eklensin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 10. Td (Tetanoz-Difteri, erişkin tip)

- **Takvimdeki yeri:** 13 yaş (Rapel)
- **Veliye gösterilen metin — Korur:** Tetanoz ve difteriden korumayı pekiştirir (rapel); erişkin tip, boğmaca bileşeni içermez.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde ağrı, kızarıklık, şişlik
  - Nadiren hafif ateş
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - 13 yaş (8. sınıf) Td rapel — SB takvimiyle uyumlu mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 11. Rotavirüs

- **Takvimdeki yeri:** Ulusal takvim dışı (özel, ücretli) — önerilen dönem: 2-6. ay (ilk doz en geç 12. hafta). Ağızdan; markaya göre 2 veya 3 doz. Takvim dışı — özel.
- **Veliye gösterilen metin — Korur:** Rotavirüsün yol açtığı ağır ishal ve kusmadan korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Geçici huzursuzluk, hafif ishal
  - Nadiren kusma
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - Yan etki listesinde invajinasyon (barsak tıkanması) YOK: nadir ama bilinen risk, "şiddetli karın ağrısı/kanlı dışkı/kusmada hemen başvurun" cümlesi eklensin mi? (Rotarix/RotaTeq KÜB standardı)
  - İlk doz üst sınırı: takvim dosyasında "en geç 12. hafta" yazıyor; stoklanan ürünün KÜB sınırı (ilk doz yaşı, son doz 24/32. hafta) ile aynı mı?
  - Markaya göre 2 veya 3 doz ifadesi doğru mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 12. Meningokok ACWY (konjuge)

- **Takvimdeki yeri:** Ulusal takvim dışı (özel, ücretli) — önerilen dönem: 9-12. aydan itibaren (markaya göre değişir). Menactra/Menveo/Nimenrix. Takvim dışı — özel.
- **Veliye gösterilen metin — Korur:** A, C, W, Y serogruplarına bağlı meningokok menenjiti ve kan zehirlenmesinden korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde ağrı, kızarıklık, şişlik
  - Hafif ateş
  - Baş ağrısı, huzursuzluk
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - "9-12. aydan itibaren (markaya göre değişir)" — stoklanan ürün (Menactra/Menveo/Nimenrix) için asgari yaş KÜB'e göre doğru mu?
  - Doz sayısı yaşa göre; metinde belirtilsin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 13. Meningokok B

- **Takvimdeki yeri:** Ulusal takvim dışı (özel, ücretli) — önerilen dönem: 2. aydan itibaren. Bexsero vb. Takvim dışı — özel.
- **Veliye gösterilen metin — Korur:** B serogrubuna bağlı meningokok menenjiti ve kan zehirlenmesinden korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde ağrı, kızarıklık, şişlik
  - Ateş (özellikle küçük bebekte sık)
  - Huzursuzluk, iştahsızlık
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - Ateş sıklığı ve aşı sonrası parasetamol önerisi metne eklensin mi?
  - 2. aydan itibaren başlama ve doz şeması (ürün KÜB) doğru mu?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 14. İnfluenza (Grip)

- **Takvimdeki yeri:** Ulusal takvim dışı (özel, ücretli) — önerilen dönem: 6. aydan itibaren, her yıl. İlk aşılamada 4 hafta arayla 2 doz. Takvim dışı — özel.
- **Veliye gösterilen metin — Korur:** Mevsimsel grip (influenza) virüsünden ve komplikasyonlarından korur; her yıl güncellenir.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde hassasiyet
  - Hafif ateş, kas ağrısı
  - Halsizlik
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - İlk kez aşılanan <9 yaş çocukta 4 hafta arayla 2 doz ifadesi doğru mu?
  - Yumurta alerjisi / ürün (inaktif vs. canlı atenüe nazal) ayrımı metne eklensin mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

### 15. HPV

- **Takvimdeki yeri:** Ulusal takvim dışı (özel, ücretli) — önerilen dönem: Adölesan dönem (9 yaş+). Takvim dışı — özel; ulusal programa alınması gündemde, güncel durumu kontrol edin.
- **Veliye gösterilen metin — Korur:** İnsan papilloma virüsünün (HPV) yol açtığı rahim ağzı kanseri ve diğer HPV ile ilişkili kanserler ile genital siğillerden korur.
- **Veliye gösterilen metin — Sık yan etkiler:**
  - Enjeksiyon yerinde ağrı, kızarıklık, şişlik
  - Baş ağrısı
  - Nadiren bayılma hissi (uygulama sonrası 15 dk gözlem önerilir)
- **Kaynak (sistemde yazan):** T.C. Sağlık Bakanlığı Genişletilmiş Bağışıklama Programı + WHO aşı bilgilendirme materyalleri (standart içerik; ürün bazlı kullanma talimatı ile birlikte doktor onayından geçmelidir — bkz. pediatri.ts specialistReview).
- **Teyit edilecekler:**
  - "Genital siğillerden korur" ifadesi ürüne bağlı: dörtlü/dokuzlu aşıda doğru, iki değerlikli üründe doğru DEĞİL. Stoklanan ürüne göre düzeltilsin mi?
  - Doz sayısı yaşa göre (9-14 yaş 2 doz, ≥15 yaş 3 doz) metne eklensin mi?
  - Ulusal takvim dışı durumu (Ağustos 2026 itibarıyla ücretsiz programa alınmamış görünüyor) güncel mi?
- **Karar:** [ ] Onay    [ ] Düzeltme gerekli    Not: ______________________________

## Genel onay

- [ ] Yukarıdaki 15 aşının metinlerini inceledim; işaretlediğim düzeltmeler yapıldıktan sonra yayın için klinik olarak uygundur.
- Ad: Dr. Gökhan Mamur   Tarih: ____ / ____ / ________   İmza: ____________________

## Hâlâ insan gerektiren

- Dr. Gökhan: her aşı için yukarıdaki kararlar ve imza (yapay zekâ bunu veremez). Stoklanan ürünlerin KÜB/KT metniyle yan etki sıklıkları karşılaştırılmalı.
- Düzeltmeler işaretlenirse Claude metni günceller, sürüm etiketi değişir ve onay yeni sürüm için tekrar alınır.
