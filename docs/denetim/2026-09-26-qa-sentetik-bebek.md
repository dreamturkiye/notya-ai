# Ayşe dosya sorgulama standardı — canlı denetim (2026-09-26, qa-sentetik-bebek)

NOTYA-AYSE-STANDART-01 · ortam: https://www.notya.io · kural puanı 59/61. Yalnız QA / sentetik hasta. Kural puanı biçim ve dil kurallarını ölçer; klinik doğruluğu hekim okur.

| # | Soru | Puan | Süre | Kalan kural |
|---|------|------|------|-------------|
| 1 | Bu hastayı bana kısaca özetler misin? | 7/7 | 32.9 sn | — |
| 2 | Son muayeneden bu yana neler değişmiş? | 6/6 | 18.9 sn | — |
| 3 | Büyümesi nasıl gidiyor? | 5/5 | 17.1 sn | — |
| 4 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | 6/6 | 18.1 sn | — |
| 5 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | 6/6 | 14.3 sn | — |
| 6 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | 6/6 | 18.0 sn | — |
| 7 | Daha önce aynı şikayetle geldi mi? | 6/6 | 18.6 sn | — |
| 8 | Gelişimi yaşına uygun mu? | 5/5 | 17.0 sn | — |
| 9 | Bugün yapmam veya takip etmem gereken bir şey var mı? | 6/7 | 25.0 sn | "Dikkat / Eksik kayıt / Takip" bölümü (ya da "saptamadım") |
| 10 | Gözümden kaçabilecek önemli bir şey var mı? | 6/7 | 21.0 sn | "yapılmadı / uygulanmadı" yerine "kayıt bulamadım" |

## 1. Bu hastayı bana kısaca özetler misin?

Sentetik Bebek Test, 13 aylık erkek çocuk — işte kısa klinik tablo:

**Kimlik & Natal:**
Miadında normal spontan vajinal doğum. Bir kez bronşiyolit geçirmiş, başka özgeçmiş yok.

**Son İki Vizit (her ikisi de 06.09.2026):**
- 1. vizitte sağ AOM + viral ÜSYE tanısı; amoksisilin-klavulanat 90 mg/kg/gün + ibuprofen başlanmış.
- 2. vizitte AOM gerilemiş ancak bilateral pürülan akıntı + maksiller sinüs hassasiyetiyle **akut bakteriyel rinosinüzit** tanısı konulmuş; sefuroksim aksetil 30 mg/kg/gün 10 gün planlanmış, 5. gün kontrolü önerilmiş — ancak bu vizite dair kayıt dosyada görünmüyor.

**Aktif İlaçlar:**
- Coumadin (varfarin) 5 mg/gün
- İbuprofen 10 mg/kg/doz (gerektiğinde)
- Amoksisilin-klavulanat 90 mg/kg/gün (reçete edilmiş)

**Alerji:** Kayıt yok — "alerjisi yok" anlamına gelmiyor, sorgulanmalı.

**Büyüme:** Tek ölçüm — 10,2 kg (p42, z −0,21); eğilim değerlendirmek için yeterli veri yok.

**Gelişim:** GİDR tarama kaydı dosyada yok; 6–9 aylık pencere kaçmış.

**Aşı:** Aşı tablosunda hiç kayıt yok. Vizit notunda "SB GBP 2025 takvimine uygun ve tam" yazıyor — ama bu beyan, tabloda kayıtlı doz yok. Hepatit B, BCG, DaBT-İPA-Hib (3 doz), KPA (2 doz + rapel), OPA, KKK ve Suçiçeği dahil 11 doz için uygulama belgesi dosyada bulunmuyor.

⚠ **Dikkat — üç açık güvenlik konusu:**
- Coumadin + ibuprofen birlikte → GI kanama riski artmış; mümkünse parasetamol tercih edilmeli.
- Coumadin + antibiyotik (amoksisilin-klavulanat / sefuroksim) → INR yükselmesi; antibiyotik başlangıcından 3–5 gün sonra INR kontrolü zorunlu.
- 16.09.2026 için planlanan kulak kontrolü ve 5. gün sinüzit kontrolüne dair izlem kaydı görünmüyor — yapıldıysa kayıt eksik, yapılmadıysa hasta kaçmış olabilir.

## 2. Son muayeneden bu yana neler değişmiş?

Sentetik Bebek Test için "son muayene" aslında iki ayrı vizit — ikisi de **06.09.2026** tarihli.

Sistem bu soruyu tek vizit varmış gibi değerlendiriyor; ancak dosyada aynı güne ait iki ayrı muayene notu var. Onları kronolojik karşılaştırmalı okuyunca şu tablo çıkıyor:

---

**Vizit 1 → Vizit 2 (aynı gün, 06.09.2026) arası değişim:**

- **AOM:** Sağ kulak zarı hiperemik + bombeleşmiş → 2. vizitte normale dönmüş ✅
- **Şikayet:** Kulak çekiştirme / huzursuzluk geçmiş → bilateral pürülan akıntı + maksiller hassasiyet eklenmiş
- **Tanı değişimi:** AOM + viral ÜSYE → **Akut Bakteriyel Rinosinüzit** (bilateral maksiller)
- **İlaç değişimi:** Amoksisilin-klavulanat devam → plana **sefuroksim aksetil** eklenmiş (tolerans gerekçesiyle)
- **Ateş:** 38,4 °C → 37,9 °C (hafif gerilemiş)

---

**06.09.2026 sonrası — bugüne (26.09.2026) kadar:**

Dosyada **hiç yeni kayıt yok.** Yani:

- Planlanan **5. gün kontrolü** (≈ 11.09.2026) → gerçekleştiğine dair kayıt yok
- Planlanan **10. gün kulak kontrolü** (≈ 16.09.2026) → gerçekleştiğine dair kayıt yok
- Sefuroksim tedavisi tamamlandı mı? → **kayıt yok**
- INR takibi yapıldı mı? → **kayıt yok**
- Kilo, aşı, gelişim güncellemesi → **kayıt yok**

---

⚠ **Dikkat:**
20 gündür izlem kaydı görünmüyor. Varfarin kullanan bir bebekte antibiyotik sonrası INR kontrolü yapılıp yapılmadığı kritik — dosyada yanıt yok. Kontroller kaçtıysa bugünkü vizitte değerlendirmek gerekebilir.

## 3. Büyümesi nasıl gidiyor?

Sentetik Bebek Test için büyüme değerlendirmesi şu an **tek ölçümle sınırlı.**

---

**Mevcut veri:**

- **06.09.2026 (13 aylık):** Kilo **10,2 kg** → Neyzi 2015 erkek referansına göre **p42, z −0,21**
- Boy ölçümü: **kayıt yok**
- Baş çevresi: **kayıt yok**

---

**Ne söyleyebiliyoruz, ne söyleyemiyoruz:**

- Kilonun yaşa göre persentili ortalamanın hemen altında, **normal aralıkta** — tek başına endişe verici değil.
- Ancak **tek ölçüm** var; persentil yönü (yükseliyor mu, kayıyor mu?), büyüme hızı (g/hafta veya cm/yıl), kilo-boy orantısı **hesaplanamıyor.**
- Anne-baba boyu dosyada yok → **hedef boy hesabı yapılamıyor.**

---

⚠ **Eksik & Takip:**
- Boy ve baş çevresi bugünkü vizitte ölçülüp kaydedilmeli — 13 aylık erkekte baş çevresi hâlâ rutin.
- Bir önceki sağlıklı çocuk vizitine ait kilo kaydı yoksa **persentil kayması** gözden kaçabilir.
- Büyüme eğrisini anlamlı değerlendirmek için en az 2–3 ardışık ölçüm gerekiyor.

Bugün boy ve baş çevresi ölçüldüyse söyleyin, kartları hemen hazırlayayım Hocam.

## 4. Aşıları yaşına göre tam mı? Eksik aşısı var mı?

Sentetik Bebek Test'in aşı tablosunda **hiç kayıtlı doz yok.**

---

**Durum özeti:**

Vizit notunda "SB GBP 2025 takvimine uygun ve tam" yazıyor — ancak bu **veli beyanı**, uygulandığı belgelenmiş doz yok. Aşı kartı ya da epikriz dosyaya yüklenmemiş.

---

**13 aylık erkek çocukta beklenen / eksik görünen dozlar:**

| Aşı | Beklenen | Durum |
|---|---|---|
| Hepatit B | 3 doz (D0, 1.ay, 6.ay) | Kayıt yok |
| BCG | 1 doz (2.ay) | Kayıt yok |
| DaBT-İPA-Hib | 3 doz + rapel (2-4-6.ay, 18.ay) | 3 doz kayıt yok; rapel henüz erken |
| KPA | 2 doz + rapel (2-4.ay, 12.ay) | Kayıt yok |
| OPA | 1 doz (6.ay) | Kayıt yok |
| KKK | 1 doz (12.ay) | Kayıt yok |
| Suçiçeği | 1 doz (12.ay) | Kayıt yok |

**Toplam: 11 doz için uygulama belgesi yok.**

---

**Risk bazlı / takvim dışı (ayrıca konuşulabilir):**
- Meningokok ACWY, Meningokok B, İnfluenza → kayıt yok, endikasyon değerlendirmesi ayrıca yapılabilir.

---

⚠ **Önerim:**
Aile aşı karnesi veya e-Nabız kaydını getirdiyse **Gelen Belgeler** menüsünden dosyaya yükleyip buraya dosyalayabilirsiniz. Yoksa beyan üzerine aşıları sisteme işleyebilirim — hangisini, hangi tarihte yapıldığını söylerseniz kartları hazırlarım Hocam.

## 5. Son lab sonuçlarında dikkat etmem gereken bir şey var mı?

Sentetik Bebek Test için onaylı lab sonucu dosyada **hiç yok.**

---

**Durum:**

- Tetkik istendiğine dair kayıt: **yok**
- Sonuç: **yok**
- Değerlendirilecek parametre: **yok**

---

**Ancak mevcut klinik tabloya göre istenmesi düşünülebilecekler:**

- **INR / PT** — Varfarin kullanıyor, antibiyotik başlandı; 3–5 gün sonra kontrol zorunlu. 20 gündür kayıt yok, yapıldıysa sonuç dosyaya girmemiş.
- **Tam kan sayımı** — Tekrarlayan enfeksiyon + 13 aylık → demir eksikliği anemisi taraması için uygun yaş penceresi.
- **Ferritin / serum demiri** — TKS ile birlikte değerlendirilebilir.

---

⚠ **Kritik:**
INR takibinin yapılıp yapılmadığı belirsiz — varfarin kullanan bir bebekte bu boşluk güvenlik riski. Bugünkü vizitte INR sonucunu sormak ve gerekirse istemek öncelikli olabilir Hocam.

## 6. Şu anda kullandığı ilaçlar neler ve dozları nedir?

Sentetik Bebek Test'in aktif ilaç kaydında **2 ilaç** görünüyor.

---

**1. Coumadin (Varfarin) 5 mg**
- Doz: **5 mg/gün**
- Kullanım: 2×1
- Başlangıç: 06.09.2026
- ⚠ **13 aylık, 10,2 kg bir bebek için bu doz son derece yüksek.** Pediatrik varfarin dozu genellikle [doz hekim tarafından belirlenir] → 10,2 kg için **[doz hekim tarafından belirlenir]** aralığı beklenir. Yetişkin dozu olan 5 mg burada ciddi kanama riski taşır. INR takibi yapılmadan devam edilmesi güvenli değil.

---

**2. İbuprofen 10 mg/kg/doz (~102 mg)**
- Kullanım: 6–8 saatte bir, gerektiğinde (ateş ≥38,5 °C veya ağrı)
- Başlangıç: 06.09.2026
- Durum: Aktif kayıtta var; ancak akut endikasyon için reçete edilmişti — hâlâ kullanılıp kullanılmadığı belirsiz.
- ⚠ **Varfarin ile birlikte GI kanama riskini artırır.** Mümkünse parasetamol tercih edilmeli.

---

**Tamamlananlar (aktif sayılmadı):**
- Amoksisilin-klavulanat — 10 günlük kür, **20.09.2026'da süresi doldu.** Kesildiğine dair ayrı kayıt yok.

---

⚠ **Öncelikli iki konu Hocam:**
1. Coumadin 5 mg dozu pediatrik için kritik düzeyde yüksek görünüyor — reçete eden hekim kim, endikasyon ne, güncel INR değeri var mı? Bugün mutlaka sorgulanmalı.
2. İbuprofen + varfarin kombinasyonu devam ediyorsa en kısa sürede kesilmeli.

## 7. Daha önce aynı şikayetle geldi mi?

Sentetik Bebek Test **daha önce aynı şikayetlerle gelmiş** — kayıtta iki vizit var, ikisi de aynı gün (06.09.2026).

---

**Vizit 1 — 06.09.2026**
- **Şikayet:** Huzursuzluk, sağ kulağı çekiştirme, ateş (38.4 °C)
- **Eşlik eden:** Burun akıntısı, hafif öksürük
- **Tanı:** Akut Otitis Media (sağ) + Viral ÜSYE
- **Tedavi:** Amoksisilin-klavulanat 10 gün, ibuprofen, nazal SF

---

**Vizit 2 — 06.09.2026**
- **Şikayet:** Sarı burun akıntısı, öksürük, hafif ateş (37.9 °C)
- **Tanı:** Akut Bakteriyel Rinosinüzit (bilateral maksiller) + Varfarin izlemi
- **Tedavi:** Sefuroksim aksetil 30 mg/kg/gün 10 gün, nazal SF

---

**Patern:**
- Her iki vizitte de **ateş + öksürük + burun akıntısı** ortak.
- AOM → sinüzit progresyonu: antibiyotik yanıtı kısmi, tablo ÜSYE zemininde tekrarlıyor.
- İki vizit aynı güne ait — ayrı epizodlar değil, **aynı hastalığın seyri** olarak değerlendirilmeli.

---

⚠ **Dikkat:**
- Tekrarlayan/dirençli üst solunum yolu enfeksiyonu + otit kombinasyonu 13 aylık bebekte **immün yetmezlik, adenoid hipertrofisi veya anatomik yatkınlık** açısından sorgulanmayı hak edebilir.
- Sefuroksim kürünün tamamlanıp tamamlanmadığına dair **kontrol viziti kaydı yok** — 5. gün kontrolü planlanmıştı, geldiyse kaydedilmemiş Hocam.

## 8. Gelişimi yaşına uygun mu?

Sentetik Bebek Test için dosyada **hiç gelişimsel tarama sonucu yok.**

---

**Tarama durumu:**

- GİDR (6–9 ay penceresi): **kayıt yok, pencere geçmiş**
- M-CHAT-R/F (16–30 ay): henüz erken, ama takipte tutulmalı
- İşitme taraması sonucu: **kayıt yok**
- Görme taraması sonucu: **kayıt yok**
- Ebeveyn gelişim kaygısı: vizit notlarında **yazılmamış**

---

**13 aylık erkek çocukta beklenen gelişim basamakları:**

| Alan | Beklenen | Kayıt |
|---|---|---|
| Motor (kaba) | Tutunarak/bağımsız yürüme | Yok |
| Motor (ince) | Parmak ucu tutma (pincer) | Yok |
| Dil | 1–3 anlamlı kelime | Yok |
| Sosyal | İsme yanıt, el sallama, taklit | Yok |
| Bilişsel | Nesne kalıcılığı, basit oyun | Yok |

---

**Yorum:**
Vizit notlarında gelişime dair **hiçbir değerlendirme yok.** "Uygun" ya da "gecikmiş" demek mümkün değil — veri yok.

---

⚠ **Önerim Hocam:**
Bu vizitte GİDR ile hızlı değerlendirme yapılabilir. Araçlar → **Gelişim & Tarama Paneli** üzerinden formu açıp işaretlerseniz muayene notuna otomatik ekleniyor. Ebeveyne günlük yaşam soruları sormak 3–4 dakika alır, kayıt için yeterli.

## 9. Bugün yapmam veya takip etmem gereken bir şey var mı?

Sentetik Bebek Test için bugün **öncelikli birkaç kritik konu** var Hocam.

---

**1) ACİL / BUGÜN**

**⚠ INR kontrolü**
- Varfarin 5 mg/gün kullanıyor; amoksisilin-klavulanat kürü 20.09'da bitti, sefuroksim başlandı.
- Her iki antibiyotik varfarin etkisini artırır → INR takibi **zorunlu**, dosyada sonuç yok.
- Bugün istenmediyse acilen istenmeli.

**⚠ Coumadin 5 mg dozu**
- 13 aylık, 10.2 kg bebek için yetişkin dozu — endikasyon ve reçete eden hekim bugün sorgulanmalı.

**⚠ İbuprofen kullanımı**
- Varfarin ile GI kanama riski → hâlâ kullanılıyorsa parasetamole geçilmeli.

**⚠ 5. gün kontrolü**
- Vizit 2'de "5. gün kontrol" planlanmıştı (≈11.09.2026) — kontrol viziti kaydı yok. Sinüzit yanıtı değerlendirilmemiş.

---

**2) YAKIN ZAMANDA**

**Aşı durumu — kritik**
Dosyada hiç aşı kaydı yok. Vizit notunda "GBP'ye uygun ve tam" yazıyor ancak uygulandığına dair belge/kayıt sisteme girmemiş.

Zamanı geçmiş ve kaydı olmayan aşılar:
- Hepatit B 1. doz
- BCG
- DaBT-İPA-Hib 1–2–3. doz
- KPA 1–2. doz + rapel
- OPA 1. doz
- KKK 1. doz
- Suçiçeği 1. doz

→ Aşı karnesi bugün görülüp kayıtlar sisteme işlenebilir; yapılmamışsa telafi planı oluşturulmalı.

**Gelişimsel tarama**
- GİDR penceresi (6–9 ay) geçmiş, kayıt yok.
- Bugünkü vizitte hızlı değerlendirme yapılabilir → Araçlar › **Gelişim & Tarama Paneli**

---

**3) RUTİN**

- Boy ölçümü yok — büyüme eğrisi izlenemiyor, bugün eklenmeli.
- Demir / ferritin: 13 ay tarama yaşı, henüz istenmemiş.
- D vitamini durumu: kayıt yok.

---

Hangi konudan başlayalım Hocam? INR ve Coumadin dozu en öncelikli görünüyor.

## 10. Gözümden kaçabilecek önemli bir şey var mı?

Sentetik Bebek Test için sistematik taradım — işte tablo Hocam:

---

**1) ⚠ Coumadin 5 mg — en kritik mesele**
13 aylık, 10.2 kg bebekte yetişkin dozu varfarin. Endikasyon belirsiz, INR takibi yok, reçete eden hekim kayıtta yok. Bugün çözülmeden geçilmemeli.

---

**2) ⚠ Tamamlanmamış takipler**
- Vizit 2'de planlanan **5. gün kontrolü** (≈11.09) — vizit kaydı yok.
- **Sefuroksim kürü** tamamlandı mı? Sinüzit yanıtı belgelenmemiş.
- **INR** hiç istenmemiş; iki antibiyotik kürü varfarin etkisini artırdı.

---

**3) ⚠ Aşı kaydı sıfır**
Vizit notunda "GBP'ye uygun ve tam" yazıyor ama sistemde tek aşı kaydı yok. Ya hiç yapılmadı ya da başka merkezde yapılıp buraya aktarılmadı. 13 ayda bu tabloda **pnömokok, KKK, suçiçeği** dahil 10+ doz eksik görünüyor.

---

**4) ⚠ İbuprofen + Varfarin**
Aktif ilaç listesinde ikisi birlikte duruyor. GI kanama riski — hâlâ kullanılıyorsa bugün parasetamole çevrilmeli.

---

**5) Gelişim & tarama boşluğu**
- GİDR penceresi (6–9 ay) kayıtsız geçmiş.
- İşitme, görme, D vitamini, demir — hiçbirinin sonucu yok.
- Tekrarlayan otit + sinüzit: **işitme kaybı riski** açısından odyoloji değerlendirmesi düşünülebilir.

---

**6) Tekrarlayan enfeksiyon paterni**
2 ayda AOM → sinüzit progresyonu. Bu yaşta tekrarlayan üst solunum enfeksiyonu + otit kombinasyonu:
- Adenoid hipertrofisi
- Primer immün yetmezlik (özellikle IgA, IgG alt grupları)
- Varfarin endikasyonu bilinmiyorsa altta yatan kardiyak/hematolojik hastalık

açısından sorgulanmalı.

---

**7) Boy ölçümü hiç girilmemiş**
Persentil ve büyüme hızı izlenemiyor; 13 aylık bebekte standart.

---

**Öncelik sırası:**
1. Coumadin dozu + endikasyon + INR
2. Aşı karnesi görme / kayıt
3. Kontrol viziti / sinüzit yanıtı
4. İbuprofen kesmek
5. Gelişim taraması + boy

Hepsi için kart hazırlayabilirim Hocam — nereden başlayalım?
