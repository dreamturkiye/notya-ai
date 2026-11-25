import type { BankaKaynagi } from '../banka'

/** AKKS — Radyoloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'radyoloji',
  onek: 'RAD',
  metin: String.raw`
#1 ilac 2 dernek-trd | kontrast nefropati
S: eGFR 28 olan hastaya IV iyotlu kontrast verilecek. Ne önerirsin?
+ eGFR <30'da risk artışı ; endikasyonun gözden geçirilmesi, alternatif tetkik ; IV izotonik hidrasyon ; en düşük kontrast dozu, düşük / izoozmolar ajan ; metformin kesilmesi, nefrotoksik ilaçlar
- N-asetilsistein kesin koruyucu, tek önlem ; kontrast sonrası diyaliz rutin
#2 ilac 3 - | kontrast alerjisi
S: Önceki iyotlu kontrastla orta şiddette ürtiker öyküsü olan hastada BT gerekli. Yaklaşım?
+ alternatif tetkik değerlendirmesi ; farklı kontrast ajan seçimi ; premedikasyon (steroid + antihistaminik) seçilmiş hastada ; resüsitasyon hazırlığı ; deniz ürünü alerjisi kontrast alerjisi değildir
- deniz ürünü alerjisi kontrast kontrendikasyonu ; premedikasyon reaksiyonu tamamen önler
#3 kilavuz 2 dernek-trd | gebelikte görüntüleme
S: Gebede apandisit şüphesinde görüntüleme sırası?
+ önce USG ; tanısal değilse kontrastsız MR ; MR yoksa ve gerekliyse BT esirgenmez (fetal doz çoğunlukla eşik altı) ; gadolinyumdan kaçınma
- gebelikte BT kesin kontrendike ; gadolinyumlu MR ilk seçenek
#4 kilavuz 2 - | gadolinyum
S: İleri böbrek yetmezliğinde gadolinyumlu MR riski nedir?
+ nefrojenik sistemik fibrozis (özellikle eski lineer ajanlar) ; makrosiklik grup II ajanlar daha güvenli ; eGFR <30'da endikasyon ve en düşük doz ; diyaliz hastasında MR sonrası diyaliz zamanlaması
- risk yoktur ; tüm gadolinyum ajanları eşit riskli
#5 kirmizi 3 - | MR güvenliği
S: Kalp pili olan hasta MR için gönderildi. Ne yaparsın?
+ cihazın MR koşullu olup olmadığının belgelenmesi ; MR-koşullu sistemde kardiyoloji ile programlama ve protokol ; koşullu değilse risk-yarar, alternatif tetkik ; metal yabancı cisim / implant sorgulaması
- tüm pilli hastalar güvenle MR'a girer ; sorgulama gerekmez
#6 kilavuz 2 - | radyasyon dozu çocuk
S: Çocuklarda BT isteminde nelere dikkat edilir?
+ ALARA ilkesi, gerekçelendirme ; mümkünse USG / MR alternatifi ; çocuk protokolleri (doz azaltma) ; tekrar tetkikten kaçınma
- çocukta erişkin protokolü ; radyasyon riski yoktur
#7 kirmizi 3 - | inme görüntüleme
S: Akut inme şüphesinde ilk görüntüleme ve zaman hedefi?
+ kontrastsız BT (kanama dışlama) kapıdan görüntülemeye ≤20–25 dk ; BT anjiyografi ile büyük damar tıkanıklığı ; seçilmiş hastada perfüzyon / MR ; trombolizi geciktirmeme
- MR tamamlanmadan tromboliz verilmez ; BT için kreatinin beklenir
#8 kilavuz 2 - | akciğer nodülü
S: Tesadüfen saptanan 6 mm solid akciğer nodülü (düşük riskli hasta). İzlem?
+ Fleischner önerileri ; düşük riskte 6–8 mm için 6–12 ayda BT, sonra 18–24 ay ; yüksek riskte daha sık ; nodül boyutu ve morfolojisine göre
- tüm nodüllere biyopsi ; izlem gereksiz
#9 kilavuz 2 - | tiroid nodülü USG
S: Tiroid USG'de nodül raporlamasında TI-RADS'ın yeri?
+ USG özelliklerine göre risk sınıflaması (ACR TI-RADS / EU-TIRADS) ; boyut eşiğine göre İİAB önerisi ; şüpheli lenf nodu ; standart raporlama
- tüm nodüllere biyopsi ; USG özellikleri önemsiz
#10 kirmizi 2 - | pulmoner emboli BT
S: Pulmoner emboli için BT anjiyografi istenmeden önce ne yapılmalı?
+ klinik olasılık değerlendirmesi ; düşük olasılıkta D-dimer ; böbrek fonksiyonu / kontrast riski ; gebelikte alternatif yaklaşım (V/Q, doz azaltma)
- tüm nefes darlıklarına BT anjiyo ; D-dimer yüksek olasılıkta dışlar
#11 yaygin 2 - | BI-RADS
S: Mamografi raporunda BI-RADS kategorileri nasıl yönetimi yönlendirir?
+ 0: ek görüntüleme ; 1–2: rutin tarama ; 3: kısa aralıklı izlem (6 ay) ; 4–5: biyopsi ; 6: kanıtlanmış malignite
- BI-RADS 3 hemen biyopsi ; BI-RADS 4 yıllık izlem
#12 kilavuz 2 dernek-trd | BI-RADS yoğun meme
S: Yoğun meme dokusunda tarama nasıl tamamlanır?
+ mamografinin duyarlılığı azalır ; ek USG veya seçilmiş risklerde MR ; yüksek riskli kadınlarda yıllık MR ; hastaya meme yoğunluğu bilgisi
- yoğun memede mamografi yeterli, ek tetkik asla ; MR herkese
#13 kirmizi 3 - | aort diseksiyon BT
S: Aort diseksiyonu şüphesinde tercih edilen görüntüleme?
+ EKG tetiklemeli BT anjiyografi ; instabil hastada TEE ; tip A/B sınıflaması raporlanır ; acil kalp-damar cerrahisi bildirimi
- düz grafi tanı koydurur ; kontrastsız BT yeterli
#14 yaygin 2 - | bel ağrısı görüntüleme
S: Kırmızı bayraksız mekanik bel ağrısında görüntüleme endikasyonu?
+ ilk 6 hafta rutin görüntüleme önerilmez ; kırmızı bayraklarda (kanser, enfeksiyon, kauda ekuina, ilerleyici defisit) MR ; asemptomatik disk bulguları sık ; gereksiz görüntüleme maliyet ve girişim artırır
- her bel ağrısına MR ; düz grafi tanıda yeterli
#15 kilavuz 2 - | radyolojik rapor kritik bulgu
S: Kritik bulgu saptandığında radyoloğun sorumluluğu nedir?
+ kritik bulgunun istem yapan hekime doğrudan ve zamanında iletilmesi ; iletişimin kayda geçirilmesi ; kurum protokolü ; yalnız rapora yazmak yetersiz
- rapora yazmak yeterli ; iletişim gerekmez
#16 kirmizi 2 - | serbest hava
S: Ayakta akciğer grafisinde diyafram altında serbest hava. Ne bildirirsin?
+ pnömoperitoneum, içi boş organ perforasyonu ; acil klinik bildirim ; yakın zamanda laparotomi / laparoskopi öyküsü yorumlanır ; BT ile kaynak
- normal bulgu ; rutin raporlama
#17 kilavuz 3 sb-kp-beyin-olumu-2025 | SB Beyin Ölümü Nöroradyolojik Tanı KP 2025
S: Beyin ölümünde destekleyici nöroradyolojik testlerin yeri?
+ klinik tanının destekleyicisi, mevzuatta tanımlı durumlarda ; BT anjiyografi / perfüzyon sintigrafisi / DSA / TCD ; intrakraniyal dolaşımın yokluğu ; protokoldeki teknik kriterler
- klinik muayene olmadan yalnız görüntülemeyle tanı ; destekleyici testler hiçbir durumda kullanılmaz
#18 yaygin 2 - | USG safra
S: Akut kolesistitin USG bulguları?
+ safra taşı ; duvar kalınlaşması (>3 mm), perikolesistik sıvı ; sonografik Murphy ; kese distansiyonu ; gerekirse HIDA
- taş yoksa kolesistit dışlanır ; BT ilk tercih
#19 ilac 2 - | metformin kontrast
S: Metformin kullanan, eGFR'si 60 olan hastada kontrastlı BT öncesi metformin kesilmeli mi?
+ eGFR ≥30 ve AKI yoksa metformin kesilmesi gerekmez (güncel öneriler) ; eGFR <30 veya AKI'de kesilir, 48 saat sonra böbrek fonksiyonu kontrolüyle başlanır ; arteriyel girişimde ek dikkat
- tüm hastalarda 48 saat önce kesilir ; böbrek fonksiyonu önemsiz
#20 kirmizi 2 - | travma BT
S: Politravma hastasında tüm vücut BT ne zaman yapılır?
+ hemodinamik olarak stabil / stabilize edilmiş hasta ; yüksek enerjili mekanizma ; instabil hastada önce resüsitasyon ve eFAST ; protokol (kafa, servikal, toraks, batın, pelvis)
- instabil hastada da BT öncelikli ; FAST gereksiz
#21 tuzak 2 - | düz grafi sinüzit
S: Akut sinüzit tanısı için Waters grafisi gerekli mi?
+ komplike olmayan akut rinosinüzit klinik tanıdır ; düz grafi önerilmez ; komplikasyon / cerrahi planlamada BT ; orbital / intrakraniyal şüphede kontrastlı BT / MR
- tüm sinüzitlere Waters grafisi ; düz grafi BT kadar duyarlı
#22 kilavuz 2 - | adrenal insidentaloma
S: BT'de tesadüfen saptanan 2 cm adrenal kitle. Değerlendirme?
+ kontrastsız BT dansitesi (<10 HU benign lipitten zengin adenom) ; washout ; hormonal değerlendirme (kortizol, metanefrin, aldosteron) ; büyük / şüpheli kitlede cerrahi
- hormon değerlendirmesi gereksiz ; tüm kitleler çıkarılır
#23 kirmizi 2 - | kafa travması BT
S: Hafif kafa travmalı erişkinde BT endikasyonu?
+ Kanada BT kafa kuralları ; GKS <15 (2. saatte), kafatası kırığı şüphesi, kusma ≥2, ≥65 yaş, antikoagülan ; tehlikeli mekanizma ; amnezi
- tüm kafa travmalarına BT ; antikoagülan önemsiz
#24 yaygin 2 - | karaciğer lezyonu
S: USG'de tesadüfen saptanan hiperekoik karaciğer lezyonu (hemanjiyom şüphesi). Ne önerirsin?
+ tipik görünüm ve düşük riskte izlem / ek tetkik gerekmeyebilir ; atipik / risk faktörlü hastada (siroz, malignite) kontrastlı MR ; malignite öyküsünde metastaz ayırıcı tanısı
- tüm lezyonlara biyopsi ; sirozlu hastada USG yeterli
#25 kilavuz 2 dernek-trd | radyasyon güvenliği personel
S: Floroskopi yapan personelin radyasyondan korunma ilkeleri?
+ zaman, mesafe, zırhlama ; kurşun önlük, tiroid koruyucu, gözlük ; dozimetre ile izlem ; doz sınırları mevzuatı
- korunmaya gerek yok ; dozimetre zorunlu değil
#26 ilac 3 - | gadolinyum gebelik emzirme
S: Emziren annede iyotlu / gadolinyumlu kontrast sonrası emzirmeye ara verilmeli mi?
+ süte geçen ve bebeğin emdiği miktar çok düşük ; emzirmeye ara vermek gerekmez (anne tercih ederse 12–24 saat sağıp atabilir) ; gebelikte gadolinyumdan kaçınma
- 48 saat emzirme kesilir ; gebelikte gadolinyum rutin
#27 kirmizi 2 - | ince barsak obstrüksiyonu BT
S: İnce barsak obstrüksiyonunda BT'de strangülasyon bulguları?
+ barsak duvarında kontrastlanma azalması / yokluğu ; mezenterik ödem / sıvı ; pnömatozis, portal venöz gaz ; kapalı ans, girdap işareti ; acil cerrahi bildirim
- strangülasyon BT ile gösterilemez ; yalnız düz grafi
#28 tuzak 2 - | MR menisküs yaşlı
S: Yaşlı hastada diz ağrısı için rutin MR, menisküs yırtığı saptanırsa artroskopi gerektirir mi?
+ yaşlıda MR'da dejeneratif menisküs yırtığı sık ve çoğu asemptomatik ; OA tanısında ayakta düz grafi yeterli ; MR bulgusu tek başına cerrahi endikasyonu değil
- MR'daki her yırtığa artroskopi ; OA tanısı için MR şart
#29 yaygin 2 - | DEXA
S: Osteoporoz taramasında DXA kimlere önerilir?
+ 65 yaş üstü kadın, 70 yaş üstü erkek ; risk faktörü olan postmenopozal kadın / genç erişkin ; kırılganlık kırığı ; uzun süreli steroid ; T skoru ve FRAX
- tüm 30 yaş üstü kadınlara yıllık ; Z skoru postmenopozalde tanı
#30 kilavuz 2 sb-kanser-tarama-standartlari | Ulusal Kanser Tarama Standartları
S: Türkiye'de akciğer kanseri taraması ulusal programda var mı ve düşük doz BT kimlere önerilir?
+ ulusal programdaki güncel durumun doğrulanması ; uluslararası kılavuzlarda yüksek riskli sigara içicilerde (yaş ve paket-yıl kriterleri) yıllık düşük doz BT ; sigara bırakma danışmanlığı ile birlikte ; yanlış pozitif ve aşırı tanı riski
- akciğer kanseri taraması akciğer grafisiyle yapılır ; tüm erişkinlere BT
`,
} satisfies BankaKaynagi
