import type { BankaKaynagi } from '../banka'

/** AKKS — Odyoloji (Özel Branşlar, allied). 30 draft items (Claude, 2026-11-24). Scope: audiologist's legal role — no
 *  medical diagnosis or prescribing; medical red flags → ENT. Needs clinician review. */
export default {
  brans: 'odyoloji',
  onek: 'ODY',
  metin: String.raw`
#1 kirmizi 3 - | ani işitme kaybı
S: Danışan 2 gün önce başlayan tek taraflı ani işitme kaybı ile geldi. Ne yaparsın?
+ ani sensörinöral işitme kaybı acil kabul edilir ; odyometri ile kaybın tipinin belirlenmesi ; aynı gün KBB'ye acil yönlendirme (erken steroid tedavisi) ; işitme cihazı denemesi bekletilir
- işitme cihazı satıp izle ; 1 ay sonra kontrol
#2 kilavuz 2 sb-rehber-cocuk-isitme-2026 | SB Çocuklarda İşitme Kayıpları Klinik Rehberi 2026
S: Yenidoğan işitme taramasında 1-3-6 ilkesi nedir?
+ 1. aya kadar tarama ; 3. aya kadar tanısal değerlendirme ; 6. aya kadar müdahale (cihaz / erken eğitim) ; risk faktörlü bebeklerde izlem
- tanı 2 yaşında ; müdahale okul çağında
#3 yaygin 2 - | tarama yöntemleri
S: Yenidoğan işitme taramasında OAE ve AABR farkı?
+ OAE koklear (dış tüy hücresi) fonksiyonu ; AABR işitme yolunu beyin sapına kadar değerlendirir ; YYBÜ bebeklerinde AABR (nöropati riski) ; "refer" sonucu tanısal ABR'ye
- OAE işitsel nöropatiyi saptar ; YYBÜ bebeklerinde yalnız OAE yeterli
#4 kirmizi 2 - | asimetrik kayıp
S: Odyometride asimetrik sensörinöral kayıp ve tek taraflı tinnitus saptandı. Ne yaparsın?
+ retrokoklear patoloji (vestibüler şvannom) şüphesi ; KBB'ye yönlendirme ve MR ; konuşma ayırt etme skorları ; cihaz kararı tıbbi değerlendirme sonrası
- yaşa bağlı, cihaz ver ; yönlendirme gereksiz
#5 yaygin 2 - | presbiakuzi cihaz
S: Yaşa bağlı işitme kaybı olan danışanda cihaz uygulaması?
+ odyometri, konuşma testleri ; bilateral kayıpta iki kulağa cihaz ; gerçek kulak ölçümü (REM) ile doğrulama ; danışmanlık ve uyum süreci ; işitme kaybı ve bilişsel sağlık ilişkisi
- tek kulağa cihaz her zaman yeterli ; doğrulama ölçümü gereksiz
#6 kirmizi 2 - | kulak akıntısı
S: Cihaz kalıbı alınacak danışanda kulak akıntısı ve ağrı var. Ne yaparsın?
+ aktif enfeksiyon / perforasyon şüphesi ; işlem ertelenir ; KBB değerlendirmesi ; tedavi sonrası kalıp
- kalıp alınır ; damla önerilir
#7 yaygin 2 - | timpanometri
S: Timpanometride tip B eğri ne anlama gelir?
+ düz eğri: orta kulak efüzyonu veya perforasyon / tüp (hacme göre) ; dış kulak yolu hacmi ile ayırım ; KBB yönlendirmesi ; çocukta seröz otit
- normal orta kulak ; sensörinöral kayıp tanısı
#8 kilavuz 2 sb-rehber-eriskin-isitme-2026 | SB Erişkinlerde İşitme Kayıpları Klinik Rehberi 2026
S: Gürültüye bağlı işitme kaybının odyometrik özelliği?
+ 4 kHz civarında çentik ; bilateral simetrik ; kalıcı ve geri dönüşsüz ; kulak koruyucu ve işitme koruma programı
- alçak frekanslarda başlar ; geri dönüşlüdür
#9 yaygin 2 - | koklear implant aday
S: Koklear implant adaylığı için odyolojik değerlendirme?
+ ileri-çok ileri sensörinöral kayıp ; uygun cihaz denemesine rağmen yetersiz konuşma anlama ; çocukta erken değerlendirme ; KBB ve görüntüleme ile ekip kararı ; rehabilitasyon planı
- implant yalnız erişkinlere ; cihaz denemesi gereksiz
#10 kirmizi 2 - | vertigo nörolojik
S: Vestibüler test sırasında danışanda konuşma bozukluğu ve tek taraflı güçsüzlük gelişti. Ne yaparsın?
+ inme şüphesi ; testin durdurulması ; 112 ; başlangıç zamanının kaydı
- testi tamamla ; dinlenmeyle geçer
#11 yaygin 2 - | tinnitus yönetimi
S: Kronik tinnitusta odyolojik yaklaşım?
+ odyolojik değerlendirme ; işitme kaybı varsa cihaz ; ses terapisi, danışmanlık ; BDT yönlendirmesi ; pulsatil / tek taraflı tinnitusta KBB
- tinnitusu tedavi eden ilaç var ; pulsatil tinnitus önemsiz
#12 tuzak 2 - | cihaz yasak çocuk
S: Hafif işitme kaybı olan okul çocuğunda cihaz veya FM sistemi gereksiz midir?
+ hafif kayıp bile dil, akademik başarı ve dikkat üzerinde etkili olabilir ; cihaz / uzaktan mikrofon (FM) sistemi değerlendirmesi ; sınıf düzenlemesi ; izlem
- hafif kayıp önemsiz ; cihaz zararlı
#13 kirmizi 2 - | ototoksik ilaç izlemi
S: Sisplatin alacak hastada odyolojik izlem nasıl planlanır?
+ tedavi öncesi bazal odyometri (yüksek frekans dahil) ; tedavi sırasında periyodik izlem ; değişiklik onkoloji ekibine bildirilir ; çocuklarda özellikle önemli
- izlem gereksiz ; odyolog ilaç dozunu değiştirir
#14 yaygin 2 - | serumen
S: Odyolojik test öncesi serumen tıkacı saptandı. Ne yaparsın?
+ test sonuçlarını etkiler ; temizlik için uygun yönlendirme (KBB / yetkili) ; perforasyon öyküsünde lavaj yapılmaz ; temizlik sonrası test
- tıkaçla test yapılır ; pamuklu çubuk önerilir
#15 kilavuz 2 hsgm-yenidogan-isitme-taramasi | Ulusal Yenidoğan İşitme Taraması Uygulama Rehberi (baskı doğrulanacak)
S: Yenidoğan işitme taramasında geç başlangıçlı kayıp için risk faktörleri?
+ YYBÜ'de uzun yatış, ototoksik ilaç ; konjenital CMV ; aile öyküsü ; kraniyofasiyal anomaliler, hiperbilirubinemi (kan değişimi) ; tarama geçse de izlem
- tarama geçen bebeğe izlem gereksiz ; CMV önemsiz
#16 sgk 2 sgk-sut | SUT işitme cihazı (güncel madde doğrulanacak)
S: İşitme cihazının SGK tarafından karşılanması için gereken belge?
+ KBB uzmanının (veya ilgili kurulun) raporu ve odyometri ; SUT'ta yaş gruplarına göre koşullar ve yenileme süresi ; güncel SUT'tan doğrulanmalı
- odyolog tek başına rapor düzenler ; her yıl yenilenir
#17 yaygin 2 - | işitsel nöropati
S: OAE normal, ABR anormal çocuk. Ne düşünürsün?
+ işitsel nöropati spektrum bozukluğu ; konuşma anlama genellikle ses eşiklerinden kötü ; YYBÜ öyküsü, hiperbilirubinemi ; KBB / ekip, cihaz yanıtı değişken, implant değerlendirmesi
- normal işitme ; yalnız OAE yeterli
#18 kirmizi 2 - | BPPV manevra kontrendikasyon
S: Repozisyon manevrası yapılacak danışanda nelere dikkat edilir?
+ boyun sorunları (servikal instabilite, ağır servikal hastalık) ; vertebrobaziler yetmezlik bulguları ; santral vertigo şüphesinde KBB / nöroloji ; atipik nistagmusta manevra yerine yönlendirme
- risk yoktur, herkese ; santral bulgular önemsiz
#19 yaygin 2 - | çocuk davranışsal odyometri
S: 9 aylık bebekte işitme eşiği nasıl belirlenir?
+ görsel pekiştirmeli odyometri (VRA) ; elektrofizyolojik testler (ABR / ASSR) ; timpanometri ; ebeveyn gözlemi tek başına yetersiz
- saf ses odyometrisi ; ebeveyn "duyuyor" diyorsa test gereksiz
#20 tuzak 2 - | reçetesiz cihaz
S: Değerlendirme yapılmadan reçetesiz "kişisel ses yükseltici" kullanımı güvenli mi?
+ altta yatan tıbbi nedenlerin atlanma riski (ani kayıp, tümör, enfeksiyon) ; uygun olmayan amplifikasyon ; odyolojik değerlendirme ve gerekirse KBB ; seçilmiş hafif kayıplarda OTC cihazlar dikkatle
- değerlendirmeye gerek yok ; tüm kayıplar aynıdır
#21 kirmizi 2 - | çocuk konuşma gecikmesi
S: 2 yaşında konuşma gecikmesi olan çocuk dil terapisine yönlendirilmiş. Odyolojik değerlendirme gerekir mi?
+ her konuşma gecikmesinde işitme değerlendirmesi şart ; seröz otit / kalıcı kayıp ; erken müdahale ; otizm taraması için yönlendirme
- konuşma gecikmesinde işitme önemsiz ; 5 yaşında değerlendirme
#22 yaygin 2 - | gürültü koruma
S: Gürültülü işyerinde çalışanlar için işitme koruma programı?
+ maruziyet ölçümü ve azaltma ; kulak koruyucu seçimi ve eğitimi ; periyodik odyometri ; meslek hastalığı bildirim süreçleri
- koruyucu gereksiz ; test yalnız işe girişte
#23 yaygin 2 - | cihaz uyum sorunu
S: Yeni işitme cihazına uyum sağlayamayan yaşlı danışan. Yaklaşım?
+ kademeli kullanım ve danışmanlık ; ayarların gerçek kulak ölçümüyle doğrulanması ; beklenti yönetimi ; el becerisi / bilişsel sorunlara göre cihaz seçimi ; işitsel rehabilitasyon
- cihaz uymuyorsa bırak ; ayar gereksiz
#24 kilavuz 2 dernek-odyoloji | Odyologlar Derneği önerileri
S: Odyolojik değerlendirmede maskeleme neden gereklidir?
+ kulaklar arası geçişi (cross-hearing) engellemek ; asimetrik kayıplarda doğru eşik ; iletim tipi kayıplarda kemik yolu ; maskeleme kuralları
- maskeleme gereksiz ; asimetrik kayıpta önemsiz
#25 kirmizi 2 - | dış kulak yolu kitlesi
S: Kalıp alımı sırasında dış kulak yolunda kitle görüldü. Ne yaparsın?
+ işlemin durdurulması ; KBB'ye yönlendirme ; malignite / kolesteatom olasılığı
- kitle üzerine kalıp alınır ; önemsiz
#26 yaygin 2 - | otoskleroz
S: Odyometride iletim tipi kayıp ve Carhart çentiği, stapes refleksleri yok. Ne düşünürsün?
+ otoskleroz olasılığı ; KBB yönlendirmesi ; cerrahi (stapedotomi) veya cihaz seçenekleri
- sensörinöral kayıp ; KBB gereksiz
#27 tuzak 2 - | çocukta cihaz yaşı
S: Konjenital işitme kaybı olan bebekte cihaz için 2 yaş beklenmeli mi?
+ beklenmemeli, tanı sonrası mümkün olan en erken (aylar içinde) ; kritik dil gelişim dönemi ; düzenli ayar ve izlem ; implant değerlendirmesi gerekirse
- 2 yaşa kadar bekle ; bebekte cihaz zararlı
#28 yaygin 2 - | vestibüler rehabilitasyon
S: Kronik dengesizlikte vestibüler rehabilitasyon?
+ adaptasyon, habitüasyon, denge egzersizleri ; düşme önleme ; tıbbi nedenlerin KBB / nöroloji ile değerlendirilmesi ; ev programı
- vestibüler supresan ilaç uzun süre ; egzersiz zararlı
#29 sgk 1 - | koklear implant dış ünite
S: Koklear implant dış ünite yenilemesinin SGK tarafından karşılanmasında genel koşul?
+ SUT'ta belirtilen süre ve koşullar ; yetkili merkez / uzman raporu ; teknik arıza belgesi ; güncel SUT'tan doğrulanmalı
- her yıl yenilenir ; rapor gerekmez
#30 kirmizi 2 - | ani kayıp çocuk
S: Okul çağında çocukta kafa travması sonrası ani işitme kaybı ve baş dönmesi. Ne yaparsın?
+ temporal kemik kırığı / perilenf fistülü olasılığı ; acil KBB / acil servis yönlendirmesi ; test sonrası bekletilmez
- normal, izle ; cihaz önerisi
`,
} satisfies BankaKaynagi
