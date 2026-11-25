import type { BankaKaynagi } from '../banka'

/** AKKS — Ergoterapi (Özel Branşlar, allied). 30 draft items (Claude, 2026-11-24). Scope: occupational therapist's legal
 *  role — no medical diagnosis or prescribing. Needs clinician review. */
export default {
  brans: 'ergoterapi',
  onek: 'ERG',
  metin: String.raw`
#1 kilavuz 2 yonetmelik-is-ve-gorev-tanimlari | İş ve Görev Tanımları Yönetmeliği
S: Ergoterapistin görev alanı ve sınırları?
+ günlük yaşam aktivitelerinde bağımsızlık, aktivite ve çevre uyarlaması ; değerlendirme ve müdahale planı ; tıbbi tanı ve ilaç yetkisi yok ; hekim ve ekiple iş birliği
- ergoterapist ilaç önerir ; tıbbi tanı koyar
#2 yaygin 2 - | inme sonrası GYA
S: İnme sonrası günlük yaşam aktivitelerinde ergoterapi?
+ GYA değerlendirmesi (FIM / Barthel) ; görev odaklı tekrarlayıcı eğitim ; yardımcı cihaz ve ev uyarlaması ; tek taraflı ihmal ve bilişsel değerlendirme ; bakım veren eğitimi
- her şeyi bakım veren yapsın ; değerlendirme gereksiz
#3 kirmizi 2 - | düşme riski ev
S: Evde düşme riski yüksek yaşlı danışan için ev değerlendirmesinde neler yapılır?
+ ev güvenliği (halı, aydınlatma, tutunma barları, banyo) ; yardımcı cihaz ; kişinin işlevsel değerlendirmesi ; ilaç / ortostatik değerlendirme için hekime yönlendirme
- düşme riski ev düzenlemesiyle ilgisiz ; yatak istirahati
#4 yaygin 2 - | el rehabilitasyonu
S: El yaralanması sonrası ergoterapide atel ve egzersiz?
+ cerrah protokolüne uygun koruyucu / dinamik atel ; ödem kontrolü ; kontrollü erken hareket ; skar yönetimi ; fonksiyonel aktivitelere dönüş
- protokolsüz erken zorlu hareket ; atel gereksiz
#5 kirmizi 2 - | atel bası
S: Atel kullanan danışanda parmaklarda morarma, uyuşma ve ağrı. Ne yaparsın?
+ dolaşım / sinir basısı şüphesi ; atelin hemen gevşetilmesi / çıkarılması ; sorun sürerse hekime acil yönlendirme ; atel uyumunun düzeltilmesi
- normal, atele devam ; ağrı kesici öner
#6 yaygin 2 - | otizm duyusal
S: Otizmli çocukta duyusal işlemleme güçlüklerine yaklaşım?
+ duyusal profil değerlendirmesi ; günlük rutin ve çevre uyarlamaları ; aile eğitimi ; kanıt düzeyi değişken müdahalelerde gerçekçi hedef ; multidisipliner
- duyusal entegrasyon tek başına otizmi tedavi eder ; aile katılımı gereksiz
#7 yaygin 2 - | serebral palsi
S: Serebral palsili çocukta ergoterapi hedefleri?
+ el fonksiyonu ve GYA bağımsızlığı ; zorunlu kullanım (CIMT) / iki el eğitimi ; atel ve pozisyonlama ; yardımcı teknoloji ; okul katılımı
- hedef yalnız pasif hareket ; aile eğitimi gereksiz
#8 kirmizi 2 - | yutma güvenliği
S: Beslenme sırasında öksürük ve boğulma yaşayan danışan. Ne yaparsın?
+ aspirasyon riski ; yutma değerlendirmesi için hekim / dil-konuşma terapistine yönlendirme ; uygun pozisyon ve kıvam (değerlendirmeye göre) ; acil boğulmada ilk yardım
- normal ; ince sıvıya devam
#9 yaygin 2 - | demans günlük yaşam
S: Demanslı bireyde günlük yaşamı destekleme stratejileri?
+ basit, yapılandırılmış rutinler ; çevre düzenlemesi (etiketler, güvenlik) ; bakım veren eğitimi ve destek ; anlamlı aktivite katılımı
- tüm aktiviteler elinden alınır ; bakım veren desteği gereksiz
#10 kilavuz 2 sb-rehber-geriatrik-sendromlar | SB Geriatrik Sendromlar Rehberi
S: Geriatrik bireyde işlevsel bağımsızlığın değerlendirilmesi?
+ temel ve enstrümantal GYA ölçekleri (Katz, Lawton) ; kırılganlık ve düşme riski ; bilişsel tarama ; ekip yaklaşımı
- değerlendirme gereksiz ; yalnız yaş belirleyici
#11 tuzak 2 - | pasif hareket
S: İnme rehabilitasyonunda yalnız pasif eklem hareketi yeterli midir?
+ aktif, görev odaklı ve tekrarlayıcı pratik nöroplastisite için temel ; pasif hareket kontraktür önleme için ek ; hedef odaklı yaklaşım
- yalnız pasif hareket yeterli ; aktif katılım gereksiz
#12 yaygin 2 - | iş rehabilitasyonu
S: Yaralanma sonrası işe dönüşte ergoterapistin rolü?
+ işlevsel kapasite değerlendirmesi ; iş yeri ergonomisi ve uyarlama ; kademeli işe dönüş ; hekim ve iş yeri iletişimi
- işe dönüş hekimin işi, ergoterapi gereksiz ; tam yükle hemen dönüş
#13 kirmizi 2 - | ruh sağlığı kriz
S: Ergoterapi seansında danışan intihar düşüncelerinden bahsediyor. Ne yaparsın?
+ risk ciddiye alınır ; güvenliğin sağlanması ; psikiyatri / acil yönlendirme ; ekip bilgilendirmesi ve kayıt
- konuyu değiştir ; gizli tut
#14 yaygin 2 - | omurilik yaralanması
S: Tetraplejik danışanda bağımsızlığı artırma?
+ lezyon seviyesine göre hedefler ; yardımcı cihazlar ve çevre kontrol sistemleri ; tekerlekli sandalye ve oturma sistemi ; basınç yarası önleme eğitimi ; otonomik disrefleksi farkındalığı
- bağımsızlık hedeflenmez ; basınç yarası eğitimi gereksiz
#15 kirmizi 2 - | otonomik disrefleksi
S: T5 yaralanmalı danışanda seans sırasında ani baş ağrısı ve terleme. Ne yaparsın?
+ otonomik disrefleksi ; oturtma, sıkı giysileri gevşetme ; mesane / bağırsak kontrolü ; acil sağlık ekibi
- yatırıp devam ; önemsiz
#16 yaygin 2 - | yardımcı teknoloji
S: Yardımcı teknoloji seçiminde ilkeler?
+ kişinin hedefleri ve işlevsel düzeyi ; çevre ve bakım veren ; deneme ve eğitim ; düzenli yeniden değerlendirme
- en pahalı cihaz en iyisidir ; deneme gereksiz
#17 sgk 1 - | ortez SGK
S: Ortez / yardımcı cihazların SGK tarafından karşılanması için gereken?
+ ilgili uzman hekim raporu / reçetesi ; SUT'ta tanımlı cihaz ve kullanım süreleri ; güncel SUT'tan doğrulanmalı
- ergoterapist doğrudan SGK raporu düzenler ; tüm cihazlar sınırsız
#18 yaygin 2 - | el yazısı çocuk
S: El yazısı güçlüğü olan çocukta değerlendirme?
+ ince motor, görsel-motor entegrasyon, postür ; dikkat ve duyusal faktörler ; sınıf uyarlamaları ; gerekirse dil / öğrenme güçlüğü için yönlendirme
- tembellik, daha çok yazdırın ; değerlendirme gereksiz
#19 tuzak 2 - | duyusal diyet kanıt
S: Ağırlıklı yelekler otizmde davranışı kesin düzeltir mi?
+ kanıt zayıf ve tutarsız ; bireysel değerlendirme ; gerçekçi hedef ve izlem ; kanıta dayalı müdahalelerle birlikte
- kanıtlı kesin tedavi ; herkese uygulanmalı
#20 kirmizi 2 - | istismar şüphesi
S: Ergoterapi alan çocukta açıklanamayan morluklar ve korku davranışları. Ne yaparsın?
+ istismar şüphesi ; kayıt ; yasal bildirim yükümlülüğü ; ekip ve sosyal hizmet ; çocuğun güvenliği
- aileye sor ve geç ; bildirim isteğe bağlı
#21 yaygin 2 - | Parkinson ergoterapi
S: Parkinson hastalığında ergoterapi?
+ GYA stratejileri (ipuçları, zamanlama "on" dönemi) ; düşme önleme ; el yazısı / ince motor ; ev uyarlaması ; bakım veren eğitimi
- ilaç dozunu ayarlama ; egzersiz zararlı
#22 kilavuz 2 sb-rehber-dmd | SB DMD Klinik Rehberi
S: DMD'li çocukta ergoterapi?
+ üst ekstremite fonksiyonunun korunması ; yardımcı cihaz ve tekerlekli sandalye uyarlamaları ; okul katılımı ; enerji koruma ; aşırı yorucu aktiviteden kaçınma
- yoğun ağırlık egzersizi ; uyarlama gereksiz
#23 yaygin 2 - | kronik ağrı aktivite
S: Kronik ağrıda aktivite düzenleme (pacing)?
+ aktivite-dinlenme dengesi ; kademeli artış ; hedef odaklı planlama ; aşırı aktivite-çöküş döngüsünü önleme
- ağrı geçene kadar tam istirahat ; ağrıya rağmen maksimum aktivite
#24 kirmizi 2 - | ani nörolojik değişiklik
S: Seans sırasında danışanda ani konuşma bozukluğu ve tek taraflı güçsüzlük. Ne yaparsın?
+ inme şüphesi (FAST) ; 112 ; başlangıç zamanının kaydı ; seansın durdurulması
- dinlenip seansa devam ; ertesi gün değerlendirme
#25 yaygin 2 - | hemiplejik omuz
S: Hemiplejik omuzun korunması?
+ doğru pozisyonlama ; transferde koldan çekmeme ; destek / askı ; hareket açıklığı
- koldan çekerek transfer ; omuz hareketsiz
#26 tuzak 2 - | tek değerlendirme
S: Tek seanslık değerlendirme ile uzun dönem müdahale planı kesinleştirilebilir mi?
+ ilk değerlendirme sonrası hedefler belirlenir ama düzenli yeniden değerlendirme şart ; ilerlemeye göre plan güncellenir ; standart ölçekler
- tek değerlendirme yeterli ; plan değiştirilmez
#27 yaygin 2 - | yaşlıda sürüş
S: Yaşlı veya nörolojik hastalığı olan bireyde araç kullanma güvenliği değerlendirmesinde ergoterapistin rolü?
+ bilişsel, görsel ve motor işlev değerlendirmesi ; hekime bilgi ; uyarlanmış araç / alternatif ulaşım ; mevzuat çerçevesi
- ergoterapist ehliyet iptal eder ; değerlendirme gereksiz
#28 kirmizi 2 - | basınç yarası
S: Tekerlekli sandalye kullanan danışanda sakral bölgede kızarıklık. Ne yaparsın?
+ basınç yarası başlangıcı ; oturma sistemi ve yastık değerlendirmesi ; basınç dağıtma, pozisyon değişimi ; hekim / yara bakım ekibine bildirim
- önemsiz, devam ; masaj
#29 yaygin 2 - | bilişsel rehabilitasyon
S: Travmatik beyin hasarı sonrası bilişsel rehabilitasyonda ergoterapi?
+ dikkat, bellek, yürütücü işlev stratejileri ; dış hafıza yardımcıları ; günlük yaşama aktarım ; aile eğitimi
- bilişsel sorunlar tedavi edilemez ; yalnız kâğıt kalem egzersizi
#30 kilavuz 2 dernek-ergoterapi | Ergoterapi Derneği meslek çerçevesi
S: Ergoterapide danışan merkezli yaklaşımın temel ilkesi?
+ danışanın kendi hedefleri ve anlamlı aktiviteleri ; ortak karar ; kültürel bağlam ; katılım odaklı sonuç ölçümü
- hedefleri yalnız terapist belirler ; aile katılımı gereksiz
`,
} satisfies BankaKaynagi
