import type { BankaKaynagi } from '../banka'

/** AKKS — Kulak Burun Boğaz. 100 draft items (Claude, 2026-11-24). Needs clinician review before any item counts as final. */
export default {
  brans: 'kulak-burun-bogaz',
  onek: 'KBB',
  metin: String.raw`
#1 yaygin 1 dernek-kbb-bbc | akut rinosinüzit
S: Erişkinde 4 gündür burun tıkanıklığı, renkli akıntı ve yüz ağrısı var, ateşi yok. Antibiyotik başlar mısın?
+ ilk 10 gün içinde çoğunlukla viral rinosinüzit ; semptomatik tedavi: serum fizyolojik yıkama, analjezik, intranazal steroid ; bakteriyel düşündüren: 10 günü aşan, ağır (≥39 °C ve pürülan akıntı 3–4 gün) veya iki fazlı seyir ; bakteriyelde ilk seçenek amoksisilin ± klavulanat
- her renkli akıntıda antibiyotik gerekir ; ilk seçenek florokinolon
#2 kirmizi 3 - | rinosinüzit komplikasyonu
S: Sinüzit tablosundaki hastada periorbital ödem, diplopi ve görmede azalma gelişti. Yaklaşım?
+ orbital komplikasyon (subperiostal abse / orbital selülit) ; acil kontrastlı BT (gerekirse MR) ; IV antibiyotik ; göz konsültasyonu ; abse veya görme kaybında acil cerrahi drenaj
- oral antibiyotikle ayaktan izlem ; dekonjestan yeterli
#3 kirmizi 3 - | intrakraniyal komplikasyon
S: Frontal sinüzitli hastada şiddetli baş ağrısı, kusma ve ense sertliği gelişti. Ne düşünürsün?
+ menenjit, epidural / subdural abse, beyin absesi, kavernöz sinüs trombozu ; acil kontrastlı BT / MR ; IV geniş spektrumlu antibiyotik ; beyin cerrahisi ve enfeksiyon ile ortak ; Pott puffy tümör ayırıcı tanıda
- migren atağıdır ; ayaktan oral tedavi
#4 yaygin 2 dernek-kbb-bbc | kronik rinosinüzit
S: Kronik rinosinüzit tanısı nasıl konur ve ilk basamak tedavi nedir?
+ 12 haftadan uzun süren semptomlar (tıkanıklık, akıntı, yüz ağrısı, koku kaybı) ; endoskopi veya BT ile objektif bulgu ; intranazal kortikosteroid ve salin irigasyonu ilk basamak ; nazal polipte kısa süreli oral steroid seçeneği ; medikal tedaviye yanıtsızlıkta endoskopik sinüs cerrahisi
- tanı yalnız semptomla konur, objektif bulgu gerekmez ; uzun süreli dekonjestan sprey önerilir
#5 tuzak 2 - | rinitis medikamentoza
S: Hasta 6 aydır her gün oksimetazolin burun spreyi kullanıyor. Ne önerirsin?
+ rinitis medikamentoza ; topikal dekonjestan 3–5 günden uzun kullanılmamalı ; spreyin kesilmesi, geçişte intranazal steroid ; altta yatan rinit / septum deviasyonu değerlendirmesi
- güvenlidir, sürekli kullanılabilir ; dozu artırmak gerekir
#6 yaygin 1 - | alerjik rinit ARIA
S: Persistan orta-ağır alerjik riniti olan erişkinde ilk tercih edilecek tedavi?
+ intranazal kortikosteroid en etkili tek ajan ; ikinci kuşak oral / intranazal antihistaminik eklenebilir ; intranazal steroid + azelastin kombinasyonu ; alerjen kaçınma ; uygun hastada alerjen immünoterapi
- birinci kuşak antihistaminik ilk seçenek ; uzun süreli sistemik steroid / depo steroid enjeksiyonu
#7 kirmizi 3 - | ani işitme kaybı
S: 45 yaşında hasta sabah uyandığında sağ kulakta ani işitme kaybı fark etti, kulak muayenesi normal. Ne yaparsın?
+ ani sensörinöral işitme kaybı acil kabul edilir ; odyometri ile sensörinöral kaybın doğrulanması ; sistemik kortikosteroid mümkün olan en erken (ilk 2 hafta) ; yanıtsızlıkta / kontrendikasyonda intratimpanik steroid ; retrokoklear patoloji için MR (IAC)
- serumen / tuba disfonksiyonudur, izlem ; rutin antiviral tek tedavi
#8 kilavuz 2 sb-rehber-eriskin-isitme-2026 | SB Erişkinlerde İşitme Kayıpları Klinik Rehberi 2026
S: Asimetrik sensörinöral işitme kaybı olan erişkinde hangi tetkik yapılır?
+ asimetrik SNİK ve tek taraflı tinnitusta vestibüler şvannom dışlanmalı ; kontrastlı iç kulak yolu MR ; odyometri ve konuşma ayırt etme ; ABR MR yapılamıyorsa
- asimetrik kayıp yaşlılığa bağlıdır, tetkik gerekmez ; düz grafi yeterli
#9 yaygin 2 - | dış kulak yolu iltihabı
S: Yüzücüde ağrılı dış kulak yolu ödemi ve akıntı. Tedavi?
+ akut otitis eksterna ; topikal antibiyotik ± steroid damla ilk seçenek ; kulak yolu temizliği, gerekirse fitil ; ağrı kontrolü ; sistemik antibiyotik yalnız kulak dışına yayılım / immünsüpresyonda
- ilk seçenek oral antibiyotik ; zar perforasyonu şüphesinde aminoglikozidli damla güvenlidir
#10 kirmizi 3 - | nekrotizan otitis eksterna
S: 70 yaşında diyabetik hastada haftalardır geçmeyen şiddetli kulak ağrısı, dış kulak yolunda granülasyon dokusu. Ne düşünürsün?
+ nekrotizan (malign) otitis eksterna ; Pseudomonas sık etken ; BT / MR, kültür ; uzun süreli antipseudomonal sistemik antibiyotik ; kranial sinir tutulumu (fasiyal) açısından izlem ; glisemik kontrol
- basit otitis eksterna, damla yeterli ; biyopsi ve görüntüleme gereksiz
#11 yaygin 2 - | seröz otitis media çocuk
S: 4 yaşında çocukta 3 aydır süren bilateral efüzyonlu otitis media ve hafif iletim tipi kayıp. Yaklaşım?
+ 3 ay boyunca izlem ve işitme değerlendirmesi ; kalıcı efüzyonda belirgin işitme kaybı, konuşma gecikmesi veya risk faktörlerinde ventilasyon tüpü ; adenoid hipertrofisi varsa adenoidektomi değerlendirilir ; antibiyotik, antihistaminik, dekonjestan, steroid rutin önerilmez
- uzun süreli antibiyotik ilk seçenek ; tüm vakalara hemen tüp
#12 kirmizi 2 - | kolesteatom
S: Kronik kokulu kulak akıntısı ve atik retraksiyon cebi olan hastada ne düşünürsün?
+ kolesteatom ; temporal kemik BT ; cerrahi tedavi (mastoidektomi / timpanomastoidektomi) ; komplikasyonlar: fasiyal paralizi, labirent fistülü, intrakraniyal yayılım ; düzenli izlem
- damla tedavisi kolesteatomu tedavi eder ; cerrahi gerekmez
#13 kirmizi 3 - | mastoidit
S: Otitli çocukta kulak arkasında kızarıklık, şişlik ve kulak kepçesinde öne itilme var. Yaklaşım?
+ akut mastoidit ; yatış ve IV antibiyotik ; kontrastlı temporal BT (abse, intrakraniyal komplikasyon) ; miringotomi ± tüp ; abse / komplikasyonda mastoidektomi
- oral antibiyotikle evde izlem ; görüntüleme gereksiz
#14 yaygin 2 - | periferik fasiyal paralizi
S: 35 yaşında hastada 1 gün önce başlayan tek taraflı periferik fasiyal paralizi, başka bulgu yok. Tedavi?
+ Bell paralizisi düşünülür ; ilk 72 saatte oral kortikosteroid ; ciddi vakalarda antiviral eklenmesi tartışılır ; göz koruması (suni gözyaşı, gece kapama) ; kulak, parotis, Ramsay Hunt (vezikül) açısından muayene ; 3–4 haftada düzelme yoksa ileri tetkik
- yalnız antiviral yeterlidir ; göz koruma gereksiz
#15 kirmizi 2 - | Ramsay Hunt
S: Kulakta veziküller, şiddetli ağrı ve fasiyal paralizi olan hastada tedavi?
+ Ramsay Hunt sendromu (VZV) ; antiviral (valasiklovir / asiklovir) + kortikosteroid ; göz koruması ; işitme ve denge değerlendirmesi ; Bell paralizisine göre prognoz daha kötü
- yalnız steroid ; topikal antibiyotik yeterli
#16 yaygin 2 - | BPPV
S: Yatakta dönerken saniyeler süren baş dönmesi atakları olan hastada tanı ve tedavi?
+ benign paroksismal pozisyonel vertigo ; Dix-Hallpike testi (posterior kanal) ; Epley manevrası ; vestibüler supresanlar rutin önerilmez ; atipik nistagmus / nörolojik bulguda santral neden araştırılır
- uzun süreli betahistin ilk tedavi ; MR her hastada zorunlu
#17 kirmizi 3 - | santral vertigo
S: Akut sürekli vertigo ile gelen 68 yaşında hipertansif hastada HINTS muayenesinde baş itme testi normal, yön değiştiren nistagmus var. Ne düşünürsün?
+ santral neden (serebellar / beyin sapı inmesi) düşündürür ; acil nöroloji ve difüzyon MR ; erken BT iskemiyi dışlamaz ; inme protokolü
- vestibüler nörittir ; betahistin ile taburcu
#18 yaygin 2 - | Meniere
S: Tekrarlayan saatler süren vertigo, dalgalı alçak frekans işitme kaybı, tinnitus ve kulakta dolgunluk. Tedavi?
+ Meniere hastalığı ; tuz kısıtlaması, yaşam tarzı ; betahistin yaygın kullanılır (kanıt sınırlı) ; diüretik seçenek ; dirençli vakalarda intratimpanik steroid / gentamisin, cerrahi
- tanı için MR'da tümör görülmesi gerekir ; her hastaya labirentektomi
#19 yaygin 1 - | tonsillofarenjit Centor
S: Erişkinde boğaz ağrısı; antibiyotik kararı nasıl verilir?
+ Centor / McIsaac skoru ; skor yüksekse hızlı antijen testi / kültür ; GAS doğrulanırsa penisilin V veya amoksisilin 10 gün ; viral farenjitte antibiyotik verilmez ; analjezi
- her boğaz ağrısına antibiyotik ; ilk seçenek azitromisin
#20 kirmizi 3 - | peritonsiller abse
S: Tonsillitli hastada trismus, sıcak patates sesi ve uvula deviasyonu var. Yaklaşım?
+ peritonsiller abse ; iğne aspirasyonu veya insizyon-drenaj ; IV / oral antibiyotik (anaerop kapsamlı) ; hidrasyon ve analjezi ; derin boyun enfeksiyonu şüphesinde BT
- yalnız oral antibiyotik ile 1 hafta izlem ; acil tonsillektomi her vakada zorunlu
#21 kirmizi 3 - | derin boyun enfeksiyonu
S: Diş ağrısı sonrası ağız tabanında sertlik, dilin yukarı itilmesi ve yutkunma güçlüğü. Ne düşünürsün?
+ Ludwig anjini ; havayolu tehdidi, havayolu güvenliği öncelikli ; IV geniş spektrumlu antibiyotik ; kontrastlı BT ; gerekirse cerrahi drenaj / trakeotomi
- ağız gargarası ile evde izlem ; hasta sırtüstü yatırılıp muayene edilir
#22 kilavuz 2 - | tonsillektomi endikasyonları (Paradise)
S: Tekrarlayan tonsillit nedeniyle tonsillektomi endikasyonu nedir?
+ Paradise kriterleri: son 1 yılda ≥7, son 2 yılda yılda ≥5 veya son 3 yılda yılda ≥3 belgelenmiş atak ; belgelenmiş ataklar (ateş, eksüda, LAP, GAS pozitifliği) ; peritonsiller abse öyküsü ; obstrüktif uyku apnesi ayrı endikasyon
- yılda bir boğaz ağrısı tonsillektomi endikasyonudur ; belgelenme gerekmez
#23 ilac 3 - | tonsillektomi sonrası analjezi
S: 6 yaşında çocukta tonsillektomi sonrası ağrı kontrolünde hangi ilaçlar kullanılır?
+ parasetamol ve ibuprofen önerilir (ibuprofen kanama riskini anlamlı artırmaz) ; kodein 18 yaş altı tonsillektomi sonrası kontrendike ; tramadol 12 yaş altında önerilmez ; yeterli sıvı alımı
- kodein ilk seçenek ; ibuprofen kesinlikle yasak
#24 kirmizi 3 - | tonsillektomi sonrası kanama
S: Tonsillektomiden 7 gün sonra ağızdan taze kan gelen hasta. Ne yaparsın?
+ sekonder post-tonsillektomi kanaması ; acil değerlendirme, damar yolu, hemogram, kan grubu ; küçük pıhtı / sızıntıda bile yatış ve gözlem ; aktif kanamada ameliyathanede kontrol ; çocukta hipovolemi bulguları geç çıkar
- az kanama ise evde buz yeterli ; aspirin ile kontrol
#25 yaygin 2 - | OSAS çocuk
S: 5 yaşında horlama, tanıklı apneler ve gündüz davranış sorunu olan, tonsiller hipertrofisi olan çocuk. Yaklaşım?
+ çocukta obstrüktif uyku apnesi ; polisomnografi altın standart (komorbiditelerde özellikle) ; adenotonsillektomi birinci basamak tedavi ; hafif vakalarda intranazal steroid / montelukast ; obezite, kraniyofasiyal anomali değerlendirmesi
- çocukta horlama her zaman normaldir ; ilk tedavi CPAP
#26 kilavuz 2 - | OSAS erişkin
S: Erişkinde orta-ağır OSAS tanısı konduğunda tedavi seçenekleri nelerdir?
+ PAP (CPAP) tedavisi birinci basamak ; kilo verme, alkol / sedatiflerden kaçınma, pozisyon tedavisi ; seçilmiş hastada ağız içi apareyler ; cerrahi seçilmiş anatomik obstrüksiyonda ; kardiyovasküler risklerin yönetimi
- tüm hastalara önce uvulopalatofaringoplasti ; benzodiazepin uykuyu düzenler
#27 kirmizi 3 - | boyun kitlesi erişkin
S: 55 yaşında sigara içen hastada 4 haftadır ağrısız, sert, 3 cm boyun kitlesi var. Yaklaşım?
+ erişkinde kalıcı boyun kitlesi aksi kanıtlanana kadar malignite ; tam baş-boyun muayenesi ve endoskopi ; kontrastlı BT / MR ; USG eşliğinde ince iğne aspirasyonu ; açık biyopsiden önce primer odak araştırılır
- antibiyotik ver, 3 ay sonra kontrol ; ilk adım açık eksizyonel biyopsi
#28 kirmizi 3 - | ses kısıklığı
S: 60 yaşında sigara içen hastada 4 haftadır geçmeyen ses kısıklığı. Ne yaparsın?
+ 3–4 haftayı aşan ses kısıklığında larinks muayenesi (laringoskopi) şart ; larinks kanseri dışlanmalı ; şüpheli lezyonda biyopsi ; sigara bırakma ; reflü tanısı muayene öncesi konmamalı
- reflü tedavisi verip 3 ay beklenir ; ampirik antibiyotik
#29 kilavuz 3 sb-kp-tiroid-kanseri | SB Tiroid Kanseri KP (baskı doğrulanacak)
S: 2 cm, TI-RADS yüksek şüpheli tiroid nodülü olan hastada ilk adım?
+ boyun USG ile nodül ve lenf nodu değerlendirmesi ; TSH ; USG eşliğinde ince iğne aspirasyon biyopsisi ; Bethesda sistemine göre sonuç ve yönetim ; endokrinoloji / genel cerrahi / KBB ortak
- sintigrafi ilk adımdır ; biyopsi gerekmez, hemen total tiroidektomi
#30 yaygin 1 - | epistaksis
S: Anterior epistaksisi olan erişkinde ilk müdahale?
+ öne eğilerek burun kanatlarına 10–15 dakika kesintisiz bası ; görülen kanama odağına koter (gümüş nitrat) ; gerekirse anterior tampon ; hipertansiyon, antikoagülan kullanımı sorgulanır ; tekrarlayanlarda nemlendirme
- başı geriye yatırarak kanı yutması ; tüm hastalara posterior tampon
#31 kirmizi 2 - | posterior epistaksis
S: Anterior tamponla durmayan, 70 yaşında antikoagülan kullanan hastada ağır burun kanaması. Yaklaşım?
+ posterior kanama olasılığı ; hemodinamik değerlendirme, hemogram, koagülasyon ; posterior tampon / balon ; antikoagülan yönetimi ilgili branşla ; dirençli vakada sfenopalatin arter ligasyonu / embolizasyon
- antikoagülanı herkesde kalıcı kesmek ; eve gönderip ertesi gün kontrol
#32 kirmizi 3 - | juvenil anjiyofibrom
S: 14 yaşında erkek çocukta tekrarlayan tek taraflı burun kanaması ve burun tıkanıklığı. Ne düşünürsün?
+ juvenil nazofaringeal anjiyofibrom ; kontrastlı BT / MR ; biyopsi KONTRENDİKE (ağır kanama) ; preoperatif embolizasyon ve cerrahi
- poliklinikte biyopsi alınır ; alerjik rinittir
#33 yaygin 2 - | tinnitus
S: Bilateral subjektif tinnitusu olan, odyometride bilateral simetrik yüksek frekans kaybı olan hastada yaklaşım?
+ odyometrik değerlendirme ; kaybın amplifikasyonu (işitme cihazı) tinnitusu azaltabilir ; bilişsel davranışçı terapi, ses terapisi ; ilaç tedavisinin kanıtı sınırlı ; pulsatil / tek taraflı tinnitusta görüntüleme
- tinnitus için kanıtlanmış ilaç tedavisi vardır, uzun süreli verilmeli ; tek taraflı tinnitusta tetkik gereksiz
#34 kirmizi 2 - | pulsatil tinnitus
S: Kalp atımıyla senkron tek taraflı tinnitusu olan hastada ne yaparsın?
+ vasküler neden (glomus tümörü, dural AV fistül, sigmoid sinüs anomalileri, karotis darlığı) ; otoskopide retrotimpanik kitle ; kontrastlı BT / MR, MR anjiyografi ; idiyopatik intrakraniyal hipertansiyon ayırıcı tanısı
- tinnitus her zaman zararsızdır ; betahistin başlanır
#35 yaygin 2 - | serumen
S: Serumen tıkacı olan hastada ne zaman kulak lavajı yapılmaz?
+ timpanik membran perforasyonu / ventilasyon tüpü öyküsü ; kulak cerrahisi öyküsü ; aktif otitis eksterna ; tek işiten kulak (dikkat) ; alternatif mikroskop altında aspirasyon / serumen yumuşatıcılar
- perforasyonu olan kulakta lavaj güvenlidir ; pamuklu çubukla temizlik önerilir
#36 kirmizi 2 - | kulakta pil
S: 3 yaşında çocuğun burnuna düğme pil kaçtı. Ne yaparsın?
+ düğme pil acil çıkarılmalı (doku nekrozu, septum perforasyonu) ; burun / kulağa damla verilmez ; erken endoskopik çıkarım ; çıkarım sonrası hasar kontrolü
- ertesi güne randevu ; burun damlası ile kendiliğinden çıkması beklenir
#37 kirmizi 3 - | özofagusta pil
S: 2 yaşında çocuk düğme pil yuttu, grafide özofagusta. Yaklaşım?
+ özofagustaki düğme pil acil endoskopik çıkarım gerektirir (2 saat içinde ciddi yanık) ; çıkarım öncesi uygun yaşta bal / sukralfat yanığı azaltabilir ; aort-özofagus fistülü gibi geç komplikasyonlar ; mideye geçmişse koşullara göre izlem
- kendiliğinden geçmesi beklenir ; kusturulur
#38 yaygin 2 - | laringofaringeal reflü
S: Boğazda takılma hissi, sık boğaz temizleme olan hastada LPR tanısı nasıl konur, tedavi?
+ tanı çoğunlukla klinik + laringoskopi bulguları ; diyet ve yaşam tarzı ; PPI deneme tedavisi (8–12 hafta) sınırlı kanıtla ; kırmızı bayraklar: disfaji, kilo kaybı, odinofaji, hemoptizi → endoskopi
- kırmızı bayraklı hastada da yalnız PPI ; tanı için tek başına pH-metre zorunlu
#39 kirmizi 3 - | stridor erişkin
S: Erişkinde ilerleyici stridor ve dispne. İlk öncelik?
+ havayolunun güvence altına alınması öncelikli ; anestezi ile birlikte, gerekirse uyanık fiberoptik / trakeotomi ; neden: tümör, bilateral vokal kord paralizisi, anjiyoödem, enfeksiyon ; sedasyondan kaçınma
- önce rutin BT için radyolojiye gönderilir ; sedatif ile rahatlatılır
#40 kirmizi 3 - | anjiyoödem ACE
S: ACE inhibitörü kullanan hastada dil ve dudakta hızla artan şişlik. Yaklaşım?
+ bradikinin aracılı anjiyoödem ; havayolu değerlendirmesi ve güvenliği ; adrenalin / antihistaminik / steroid yanıtı sınırlı olabilir ; ACE inhibitörünün kesilmesi ve tekrar verilmemesi ; ciddi vakada ikatibant / C1 inhibitör / TDP seçenekleri
- ACE inhibitörüne devam edilir ; yalnız antihistaminik yeterli
#41 yaygin 2 - | koku kaybı
S: Viral enfeksiyon sonrası 3 aydır koku kaybı olan hastada ne önerirsin?
+ koku eğitimi (olfaktör eğitim) önerilir ; diğer nedenler (KRS, polip, travma, nörodejeneratif) değerlendirilir ; endoskopi ; kalıcı / açıklanamayan kayıpta MR ; gaz / yangın / bozuk besin güvenliği uyarısı
- tedavisi yoktur, hiçbir şey önerilmez ; uzun süreli oral steroid rutin
#42 kilavuz 2 sb-rehber-cocuk-isitme-2026 | SB Çocuklarda İşitme Kayıpları Klinik Rehberi 2026
S: Bilateral ağır-çok ileri sensörinöral işitme kaybı olan 10 aylık bebekte yaklaşım?
+ erken işitme cihazı ve odyolojik izlem ; yetersiz yarar sağlanırsa koklear implant değerlendirmesi ; implant için erken yaş (genellikle 12 ay civarı ve sonrası, merkez kriterlerine göre) ; görüntüleme (BT / MR) ve etiyoloji (genetik, CMV) ; dil-konuşma rehabilitasyonu
- implant için okul çağı beklenmeli ; işitme cihazı denemesi gereksiz
#43 sgk 2 sgk-sut | SUT işitme cihazı (güncel madde doğrulanacak)
S: SGK işitme cihazı geri ödemesi için genel koşullar nelerdir?
+ odyometrik olarak belgelenmiş işitme kaybı ve ilgili uzman (KBB) raporu ; SUT'ta yaş gruplarına göre farklı koşullar ve ödeme tutarları ; yenileme için belirli süre koşulu ; ayrıntılar güncel SUT'tan doğrulanmalı
- reçetesiz eczaneden alınır ve SGK öder ; yenileme her yıl yapılabilir
#44 sgk 3 sgk-sut | SUT koklear implant
S: Koklear implant SGK tarafından hangi süreçle karşılanır?
+ SUT'ta tanımlı odyolojik ve tıbbi kriterler ; yetkili merkezde sağlık kurulu raporu ; işitme cihazından yeterli fayda görmeme ; implant sonrası rehabilitasyon ve dış ünite yenileme koşulları ; güncel SUT'tan doğrulanmalı
- herhangi bir özel muayenehane raporu ile ödenir ; kriter gerekmez
#45 yaygin 2 - | otoskleroz
S: 30 yaşında kadında ilerleyici bilateral iletim tipi işitme kaybı, zar normal, stapes refleksleri yok. Tanı ve tedavi?
+ otoskleroz ; odyometride Carhart çentiği ; işitme cihazı veya stapedotomi seçenekleri ; gebelikte ilerleme olabilir ; ailesel yatkınlık
- timpanik zar perforasyonudur ; tüp takılır
#46 kirmizi 2 - | travmatik perforasyon
S: Tokat sonrası kulak zarı perforasyonu, işitme azalması ve baş dönmesi var. Yaklaşım?
+ çoğu travmatik perforasyon kendiliğinden iyileşir ; kulağa su kaçırmama ; vertigo / sensörinöral kayıp varsa perilenf fistülü olasılığı, acil değerlendirme ; odyometri ; adli bildirim gerekebilir
- tüm perforasyonlara hemen timpanoplasti ; kulak damlası (ototoksik) rutin
#47 ilac 3 - | ototoksik ilaçlar
S: Ototoksisite açısından izlenmesi gereken başlıca ilaç grupları hangileridir?
+ aminoglikozidler ; sisplatin ; loop diüretikleri (yüksek doz) ; makrolidler / salisilatlar (genellikle geri dönüşlü) ; riskli tedavilerde başlangıç ve izlem odyometrisi
- ototoksisite yalnız aminoglikozidlerde görülür ; aminoglikozid ototoksisitesi her zaman geri döner
#48 ilac 2 - | perforasyonda damla
S: Timpanik membran perforasyonu olan kronik otitte hangi kulak damlası tercih edilir?
+ ototoksik olmayan kinolon (siprofloksasin / ofloksasin) damla ; aminoglikozid içeren damlalardan kaçınılır ; kulak temizliği (aspirasyon) ; suya karşı koruma
- gentamisinli damla perforasyonda ilk seçenek ; alkollü damla önerilir
#49 yaygin 1 - | septum deviasyonu
S: Septum deviasyonu nedeniyle burun tıkanıklığı olan hastada cerrahi endikasyon?
+ semptomatik, medikal tedaviye yanıtsız tıkanıklık ; muayene ve endoskopide deviasyonun semptomla uyumu ; eşlik eden konka hipertrofisi / alerjik rinit değerlendirmesi ; septoplasti
- asemptomatik deviasyonda bile cerrahi ; 10 yaş altında rutin septoplasti
#50 kirmizi 2 - | septal hematom
S: Burun travması sonrası septumda şişlik ve tam tıkanıklık. Ne yaparsın?
+ septal hematom ; acil drenaj ; tampon ve antibiyotik ; tedavi edilmezse abse, kıkırdak nekrozu, semer burun ; nazal kemik kırığı ayrı değerlendirilir
- 1 hafta ödem inmesi beklenir ; buz yeterli
#51 yaygin 2 - | nazal kırık
S: Nazal kemik kırığında redüksiyon zamanlaması nasıldır?
+ ödem nedeniyle değerlendirme 3–5 gün sonra tekrar ; kapalı redüksiyon genellikle ilk 1–2 hafta (çocukta daha erken) ; septal hematom dışlanmalı ; rutin grafi tedavi kararını değiştirmez
- yalnız grafi ile karar verilir ; 6 hafta sonra kapalı redüksiyon
#52 kirmizi 3 - | temporal kemik kırığı
S: Kafa travması sonrası kulaktan berrak sıvı gelen ve fasiyal paralizi gelişen hasta. Yaklaşım?
+ temporal kemik kırığı ve BOS otoresi ; yüksek çözünürlüklü temporal BT ; fasiyal paralizinin ani mi gecikmiş mi olduğu (ani tam paralizide cerrahi dekompresyon değerlendirmesi) ; menenjit riski ; kulağa bir şey konulmaz
- kulak tamponlanıp yıkanır ; fasiyal paralizi her zaman kendiliğinden düzelir
#53 yaygin 2 - | tükürük bezi taşı
S: Yemek sırasında artan submandibuler şişlik ve ağrı. Tanı ve tedavi?
+ sialolitiazis (submandibuler bez sık) ; USG ; hidrasyon, sialogog, masaj ; taş çıkarımı / sialendoskopi ; tekrarlayanda bez eksizyonu
- tükürük bezi tümörüdür, hemen parotidektomi ; antibiyotik tek tedavi
#54 kirmizi 3 - | parotis kitlesi
S: Parotiste hızlı büyüyen, ağrılı kitle ve aynı tarafta fasiyal güçsüzlük. Ne düşünürsün?
+ fasiyal sinir tutulumu malignite düşündürür ; MR / USG ve ince iğne aspirasyonu ; açık insizyonel biyopsiden kaçınılır ; parotidektomi ve onkoloji ; pleomorfik adenom çoğunlukla ağrısız ve yavaş büyür
- parotitis, antibiyotik ve izlem ; açık biyopsi ilk adım
#55 yaygin 2 - | parotit
S: Kabakulak aşısız 7 yaşında çocukta iki taraflı parotis şişliği. Ne yaparsın?
+ kabakulak olasılığı ; destek tedavi, analjezi ; okula izolasyon (şişlik başlangıcından itibaren 5 gün) ; komplikasyonlar: orşit, menenjit, pankreatit, işitme kaybı ; bildirim
- antibiyotik başlanır ; işitme izlemi gereksiz
#56 kilavuz 3 dernek-kbb-bbc | larinks kanseri
S: Erken evre (T1) glottik larinks kanserinde tedavi seçenekleri?
+ radyoterapi veya transoral lazer mikrocerrahi benzer onkolojik sonuç ; ses kalitesi ve hasta tercihi ; multidisipliner tümör konseyi ; sigara bırakma
- erken evrede total larenjektomi standarttır ; kemoterapi tek başına
#57 kirmizi 3 - | nazofarenks kanseri
S: Erişkinde tek taraflı efüzyonlu otitis media ve boyunda LAP. Ne yapmalısın?
+ erişkinde tek taraflı efüzyonda nazofarenks muayenesi (endoskopi) şart ; nazofarenks karsinomu dışlanmalı ; şüphede biyopsi ve MR ; EBV ilişkisi
- tüp takıp izlem yeterli ; nazofarenks muayenesi gereksiz
#58 yaygin 2 - | vestibüler nörit
S: Viral enfeksiyon sonrası günlerce süren şiddetli vertigo, işitme normal, baş itme testi patolojik. Tedavi?
+ vestibüler nörit ; kısa süreli vestibüler supresan (ilk günler) ; erken dönemde kortikosteroid tartışmalı/kullanılabilir ; vestibüler rehabilitasyon erken başlanmalı ; HINTS ile santral neden dışlanmalı
- haftalarca vestibüler supresan ; mobilizasyondan kaçınılması
#59 tuzak 2 - | betahistin BPPV
S: BPPV'li hastaya uzun süreli betahistin tedavisi yeterli midir?
+ BPPV'nin etkin tedavisi repozisyon manevralarıdır ; betahistin ve vestibüler supresanlar BPPV'de rutin önerilmez ; yanıtsız / atipik vakada ileri değerlendirme
- BPPV'de betahistin manevralardan üstündür ; manevralar tehlikelidir
#60 ilac 2 - | intranazal steroid çocuk
S: Alerjik riniti olan 5 yaşında çocukta intranazal steroid güvenli midir?
+ yaş onayı olan intranazal steroidler (ör. mometazon, flutikazon furoat) önerilen dozda güvenlidir ; düşük sistemik biyoyararlanım ; uzun süreli kullanımda büyüme izlemi ; doğru uygulama tekniği (septuma doğru değil)
- çocukta intranazal steroid büyümeyi durdurur, kontrendike ; depo steroid enjeksiyonu tercih edilir
#61 ilac 3 - | dekonjestan riskleri
S: Hipertansif ve BPH'li hastada oral psödoefedrin içeren soğuk algınlığı ilacı uygun mu?
+ oral dekonjestanlar kan basıncını artırabilir, kontrolsüz hipertansiyonda kaçınılır ; BPH'de idrar retansiyonu riski ; MAO inhibitörü etkileşimi ; alternatif salin ve kısa süreli topikal dekonjestan
- hipertansiyonda güvenlidir ; uzun süreli kullanılabilir
#62 yaygin 2 - | horlama erişkin
S: Basit horlama yakınması olan erişkinde ilk değerlendirme?
+ OSAS açısından sorgulama (STOP-BANG, Epworth) ; gerekirse polisomnografi ; kilo, alkol, pozisyon ; burun / farinks muayenesi ; OSAS dışlanmadan horlama cerrahisi yapılmaz
- tüm horlayanlara doğrudan cerrahi ; polisomnografi gereksiz
#63 kirmizi 2 - | vokal kord paralizisi
S: Tiroidektomi sonrası ses kısıklığı ve aspirasyon gelişen hasta. Yaklaşım?
+ rekürren laringeal sinir hasarı ; laringoskopi ile değerlendirme ; bilateral paralizide havayolu tehlikesi ; ses terapisi, enjeksiyon laringoplasti seçenekleri ; aspirasyon riski yönetimi
- ses kısıklığı her zaman entübasyona bağlı, izlem ; muayene gereksiz
#64 yaygin 2 - | vokal nodül
S: Sesini yoğun kullanan öğretmende bilateral vokal nodül. İlk tedavi?
+ ses terapisi birinci basamak ; ses hijyeni, hidrasyon ; reflü / alerji gibi katkı yapanların yönetimi ; cerrahi dirençli vakalarda
- ilk tedavi cerrahidir ; tam ses istirahati süresiz
#65 kilavuz 2 - | çocuk ventilasyon tüpü
S: Tekrarlayan akut otitis media için ventilasyon tüpü endikasyonu nedir?
+ son 6 ayda 3 veya son 1 yılda 4 atak (en az biri son 6 ayda) ; efüzyonun eşlik etmesi ; tüpler ataklar arasında efüzyon yoksa önerilmez ; risk faktörleri (konuşma gecikmesi vb.)
- her akut otitte tüp ; tüp takılan çocuk asla yüzemez
#66 kirmizi 3 - | retrofaringeal abse
S: 3 yaşında çocukta ateş, boyun hareketinde kısıtlılık, tortikolis ve salya. Ne düşünürsün?
+ retrofaringeal abse ; lateral boyun grafisi / kontrastlı BT ; IV antibiyotik ; havayolu takibi, gerekirse drenaj ; çocuk acil / KBB
- tortikolis kas spazmıdır, myorelaksan ; ayaktan izlem
#67 yaygin 2 - | akut tonsillit çocuk antibiyotik
S: GAS farenjiti tanısı konan, penisilin alerjisi olmayan 8 yaşında çocukta tedavi süresi?
+ amoksisilin veya penisilin V 10 gün ; uyum sorunu varsa tek doz IM benzatin penisilin G ; semptom geçse de tedavi tamamlanır ; romatizmal ateşten korunma
- 3 gün yeterli ; tedavi semptom geçince kesilir
#68 tuzak 2 - | tonsillektomi sonrası diyet
S: Tonsillektomi sonrası buz ve soğuk yiyecek dışında hiçbir şey verilmemeli, yumuşak gıdaya 2 hafta geçilmemeli mi?
+ katı / normal diyete erken geçiş iyileşmeyi geciktirmez, ağrı toleransına göre ; yeterli sıvı alımı en önemli ; aşırı sıcak, sert keskin gıdalardan ilk günlerde kaçınma ; analjezi düzenli
- 2 hafta yalnız soğuk sıvı ; sıvı kısıtlaması
#69 kirmizi 2 - | koanal atrezi
S: Yenidoğan ağladığında pembeleşiyor, sakinleşince siyanoz gelişiyor. Ne düşünürsün?
+ bilateral koanal atrezi ; nazal kateter geçirilemez ; BT ile tanı ; ağız havayolu (McGovern) ile güvence ; CHARGE sendromu açısından değerlendirme ; cerrahi
- normal yenidoğan ; burun damlası ile taburcu
#70 yaygin 2 - | laringomalazi
S: 2 aylık bebekte inspiratuar stridor, beslenme sırasında ve sırtüstü artıyor, kilo alımı iyi. Yaklaşım?
+ laringomalazi en sık neden ; çoğu kendiliğinden düzelir ; fleksibl laringoskopi ile tanı ; alarm bulguları: büyüme geriliği, apne, siyanoz, beslenme güçlüğü → cerrahi (supraglottoplasti) değerlendirme ; reflü eşlik edebilir
- tüm vakalara trakeotomi ; stridor her zaman astımdır
#71 ilac 2 - | antibiyotik sinüzit alerji
S: Akut bakteriyel rinosinüzitte penisilin alerjisi (anafilaksi öyküsü) olan erişkinde seçenek?
+ beta-laktamdan kaçınılır ; doksisiklin veya solunum florokinolonu (levofloksasin / moksifloksasin) seçenek ; makrolid direnci nedeniyle ilk seçenek değil ; florokinolonun ciddi yan etkileri nedeniyle dikkatli kullanım
- sefalosporin güvenle verilir ; amoksisilin-klavulanat verilir
#72 kirmizi 3 - | invaziv fungal sinüzit
S: Kontrolsüz diyabetik / nötropenik hastada yüz ağrısı, burunda siyah kabuk ve damakta nekroz. Ne yaparsın?
+ akut invaziv fungal sinüzit (mukormikoz) ; acil endoskopi ve biyopsi ; acil cerrahi debridman ; IV amfoterisin B (lipozomal) ; altta yatan durumun düzeltilmesi
- bakteriyel sinüzit, oral antibiyotik ; biyopsi gereksiz
#73 yaygin 2 - | nazal polip
S: Bilateral nazal polipozisi olan hastada aspirin ile solunum yakınmaları artıyor. Ne düşünürsün?
+ AERD (Samter triadı: astım, nazal polip, NSAİİ intoleransı) ; NSAİİ'lerden kaçınma ; intranazal steroid, cerrahi ; dirençli vakada biyolojikler (anti-IL4R vb.) veya aspirin desensitizasyonu ; astımın birlikte yönetimi
- tek taraflı polip her zaman benigndir ; aspirin dozunu artırmak
#74 kirmizi 3 - | tek taraflı polip
S: Tek taraflı nazal kitle ve kanlı akıntısı olan erişkinde yaklaşım?
+ tek taraflı nazal kitle malignite / inverted papillom dışlanana kadar şüpheli ; endoskopi, BT / MR ; biyopsi (vasküler lezyon dışlandıktan sonra) ; ensefalosel / anjiyofibrom ayırıcı tanısı
- alerjik polip, steroid sprey ; tetkik gerekmez
#75 yaygin 1 - | kulak ağrısı yansıyan
S: Kulak muayenesi normal, kulak ağrısı yakınan 60 yaşında sigara içen hasta. Ne düşünmelisin?
+ yansıyan (refere) otalji ; TME, diş sorunları ; farinks / larinks / dil kökü malignitesi dışlanmalı ; tam baş-boyun muayenesi ve gerekirse endoskopi
- kulak normal olduğu için analjezik ile taburcu ; otitis eksterna damlası
#76 kilavuz 2 sb-rehber-eriskin-isitme-2026 | SB Erişkin İşitme Kayıpları Rehberi 2026; gürültü
S: Gürültüye bağlı işitme kaybı odyometride nasıl görünür ve nasıl önlenir?
+ 4 kHz civarında çentik (bilateral simetrik) ; kalıcı ve ilerleyici, geri dönüşsüz ; kulak koruyucu, gürültü maruziyetinin azaltılması ; işyeri işitme koruma programları ve periyodik odyometri ; meslek hastalığı bildirimi
- gürültü kaybı alçak frekanslarda başlar ; ilaç tedavisi ile geri döner
#77 yaygin 2 - | presbiakuzi
S: 75 yaşında hastada yavaş ilerleyen bilateral işitme azalması. Yaklaşım?
+ presbiakuzi ; odyometri ; işitme cihazı (yaşam kalitesi, bilişsel sağlık) ; iletişim stratejileri ; asimetri / ani kayıp varsa ileri tetkik
- yaşlılıkta işitme kaybının tedavisi yok ; cihaz demansı artırır
#78 ilac 3 - | intratimpanik gentamisin
S: Meniere'de intratimpanik gentamisin tedavisinin riski nedir?
+ vestibüler ablasyon amaçlı, dirençli vakalarda ; sensörinöral işitme kaybı riski ; titrasyon (düşük doz aralıklı) ; tek işiten kulakta ve bilateral hastalıkta dikkat
- işitme riski yoktur ; ilk basamak tedavidir
#79 kirmizi 2 - | kulak travması othematom
S: Kulak kepçesine darbe sonrası fluktuan şişlik. Ne yaparsın?
+ othematom (aurikuler hematom) ; drenaj (aspirasyon / insizyon) ; sonrasında baskılı pansuman / bolster ; tedavisizlikte karnabahar kulak ; perikondrit açısından izlem
- kendiliğinden geçmesi beklenir ; masaj
#80 yaygin 2 - | perikondrit
S: Kulak piercingi sonrası kulak kepçesinde ağrılı kızarıklık ve şişlik (lob hariç). Tedavi?
+ aurikuler perikondrit ; Pseudomonas kapsayan antibiyotik (ör. siprofloksasin) ; abse varsa drenaj ; kıkırdak nekrozu riski
- kloksasilin / sefaleksin tek başına yeterli ; ılık kompres
#81 kirmizi 3 - | trakeotomi acil
S: Trakeotomili hastada kanül çıktı, solunum sıkıntısı var. İlk adım?
+ yardım çağır ; oksijen yüz ve stomadan ; olgun stomada aynı / bir küçük kanülün yeniden takılması ; takılamıyorsa stomadan veya üstten oksijenasyon / entübasyon algoritması ; kanül tıkanıklığında iç kanül değişimi ve aspirasyon
- hasta acil servise yönlendirilip beklenir ; rastgele delikten kanül zorlanır
#82 yaygin 2 - | aftöz stomatit
S: Tekrarlayan ağrılı oral aftları olan hastada değerlendirme?
+ tekrarlayan aftöz stomatit ; demir, B12, folat, çölyak ; Behçet hastalığı (genital ülser, göz, deri) sorgulanır ; topikal steroid / analjezik ; 3 haftayı aşan tek ülserde biyopsi (malignite)
- 3 aydır iyileşmeyen ülser afttır ; sistemik steroid rutin
#83 kirmizi 3 - | oral kavite kanseri
S: Dil kenarında 4 haftadır iyileşmeyen, sert kenarlı ülser. Yaklaşım?
+ oral skuamöz hücreli karsinom şüphesi ; biyopsi ; boyun muayenesi, görüntüleme ; risk faktörleri sigara, alkol ; multidisipliner tedavi
- travmatik ülser, gargara ; 3 ay izlem
#84 yaygin 1 - | halitozis
S: Ağız kokusu yakınmasında KBB değerlendirmesi?
+ en sık neden ağız içi (dil kaplaması, periodontal hastalık) ; tonsil kriptleri / tonsillolit, kronik sinüzit ; sistemik nedenler (reflü, diyabet, böbrek / karaciğer) ; diş hekimi ile birlikte
- halitozis her zaman midedendir ; antibiyotik
#85 ilac 2 - | antibiyotik dış kulak çocuk
S: Ventilasyon tüpü olan çocukta otoreye ilk tedavi?
+ topikal kinolon damla (ototoksik olmayan) ; oral antibiyotik rutin değil, sistemik bulgu varsa ; kulak temizliği ; suya karşı koruma
- oral antibiyotik ilk seçenek ; aminoglikozidli damla
#86 kirmizi 2 - | mastoidit sonrası venöz tromboz
S: Otitli çocukta inatçı ateş, baş ağrısı ve papilödem. Ne düşünürsün?
+ lateral (sigmoid) sinüs trombozu, otitik hidrosefali ; kontrastlı MR / MR venografi ; IV antibiyotik, mastoidektomi ; antikoagülasyon multidisipliner kararla
- migren ; oral antibiyotik ile taburcu
#87 yaygin 2 - | fasiyal sinir prognozu
S: Bell paralizisinde prognozu kötü gösteren bulgular nelerdir?
+ tam paralizi ; 3 haftada iyileşme başlamaması ; ileri yaş, diyabet, hipertansiyon ; ENoG'de belirgin dejenerasyon ; Ramsay Hunt etiyolojisi
- tüm vakalar tamamen düzelir ; prognoz değerlendirmesi gereksiz
#88 sgk 2 sgk-sut | SUT; KBB cerrahi paket
S: SGK'lı hastaya özel hastanede yapılan tonsillektomide hastadan alınabilecek ilave ücret konusunda genel çerçeve nedir?
+ SGK ile anlaşmalı özel hastanelerde SUT'taki işlem bedeli kurumdan, ilave ücret mevzuattaki üst sınırlar içinde hastadan alınabilir ; acil hal, yoğun bakım gibi istisnalarda ilave ücret alınamaz ; ayrıntılar güncel SUT ve ilgili yönetmelikten doğrulanmalı
- özel hastanede sınırsız ilave ücret alınabilir ; acil durumda da ilave ücret serbest
#89 tuzak 3 - | antibiyotik profilaksi otit
S: Tekrarlayan akut otitis media olan çocukta uzun süreli antibiyotik profilaksisi önerir misin?
+ uzun süreli antibiyotik profilaksisi direnç nedeniyle önerilmez ; risk faktörlerinin (pasif sigara, emzik, kreş) azaltılması ; pnömokok ve influenza aşıları ; endikasyonu varsa ventilasyon tüpü
- 6 ay sürekli amoksisilin standarttır ; aşılar etkisizdir
#90 kirmizi 2 - | travmatik kulak barotravma
S: Uçuş sonrası şiddetli kulak ağrısı, işitme kaybı ve vertigo. Ne düşünürsün?
+ barotravma ; orta kulak barotravması sık ve çoğu kendiliğinden düzelir ; vertigo ve sensörinöral kayıp varsa iç kulak barotravması / perilenf fistülü acil değerlendirme ; odyometri ; zorlu Valsalva'dan kaçınma
- yalnız dekonjestan ; dalışa devam edebilir
#91 yaygin 2 - | timpanoplasti
S: Kuru kronik santral perforasyonu olan hastada timpanoplasti endikasyonu?
+ tekrarlayan akıntı, işitme kaybı, suya girme isteği ; kuru kulak tercih edilir ; odyometri ve BT (kolesteatom şüphesinde) ; çocukta yaşa göre karar
- tüm perforasyonlar kendiliğinden kapanır ; aktif akıntıda acil timpanoplasti
#92 ilac 2 - | antihistaminik yaşlı
S: Alerjik riniti olan 78 yaşında hastada hangi antihistaminik grubundan kaçınılır?
+ birinci kuşak antihistaminikler (antikolinerjik, sedasyon, düşme, deliryum riski — Beers) ; ikinci kuşak tercih ; intranazal steroid ilk seçenek ; prostat / glokom etkileşimleri
- birinci kuşak yaşlıda en güvenlisidir ; dozu artırılabilir
#93 kirmizi 3 - | boyun travması
S: Boyuna penetran yaralanma, ses değişikliği ve subkutan amfizem. Yaklaşım?
+ havayolu / larinks-trakea yaralanması şüphesi ; ATLS, öncelik havayolu ; platizmayı geçen yaralanmada cerrahi değerlendirme ; BT anjiyografi, endoskopi ; yaraya poliklinikte sondaj yapılmaz
- yarayı lokal anestezi ile poliklinikte sütürle ; sondaj ile derinlik araştır
#94 yaygin 2 - | dizfaji
S: Yaşlı hastada katı ve sıvılarda yutma güçlüğü, yemekte öksürük. Değerlendirme?
+ orofaringeal disfaji, aspirasyon riski ; fleksibl endoskopik yutma değerlendirmesi (FEES) / videofloroskopi ; nörolojik nedenler (inme, Parkinson) ; Zenker divertikülü ; yutma terapisi ve diyet modifikasyonu
- yaşlılığa bağlı, değerlendirme gereksiz ; PPI ile tedavi
#95 kilavuz 2 - | tiroglossal kist
S: Çocukta boyun orta hatta, dil çıkarmakla hareket eden kistik kitle. Tedavi?
+ tiroglossal kanal kisti ; USG ile normal tiroid dokusunun varlığı ; Sistrunk ameliyatı (hyoid orta kısmı dahil) ; enfeksiyon döneminde önce antibiyotik
- basit kist eksizyonu yeterli ; insizyon-drenaj kesin tedavidir
#96 tuzak 2 - | adenoidektomi alerjik rinit
S: Alerjik riniti olan ama adenoid hipertrofisi olmayan çocukta burun tıkanıklığı için adenoidektomi önerilir mi?
+ adenoid hipertrofisi olmadan adenoidektomi endikasyonu yoktur ; alerjik rinit medikal tedavi (intranazal steroid, antihistaminik) ; endoskopi ile adenoid boyutu ; gereksiz cerrahiden kaçınma
- tüm burun tıkanıklıklarına adenoidektomi ; alerjik rinit cerrahiyle tamamen geçer
#97 kirmizi 2 - | iyatrojenik sinir hasarı
S: Boyun cerrahisi sonrası omuz kaldırmada güçsüzlük. Hangi sinir?
+ spinal aksesuar sinir hasarı ; trapez kas güçsüzlüğü, kanat skapula ; EMG ile değerlendirme ; erken tanıda cerrahi onarım seçenekleri, fizyoterapi
- uzun torasik sinir, izlem gerekmez ; hasar her zaman geçicidir
#98 yaygin 2 - | alerji testi
S: Alerjik rinit tanısında deri prik testi ne zaman yapılır?
+ immünoterapi düşünülen, tanı belirsiz veya kaçınma önlemleri planlanan hastada ; antihistaminikler test öncesi kesilmeli ; spesifik IgE alternatif ; sonuçların klinikle uyumu
- herkese test zorunlu ; antihistaminik kesmeye gerek yok
#99 ilac 3 - | alerjen immünoterapi
S: Alerjen immünoterapi (SCIT) uygulanırken nelere dikkat edilir?
+ yalnız resüsitasyon imkânı olan ortamda ve eğitimli hekimce ; enjeksiyon sonrası en az 30 dakika gözlem ; kontrolsüz astım kontrendikasyon ; beta bloker kullanımı risk ; adrenalin hazır
- evde kendi kendine uygulanır ; gözlem gerekmez
#100 kilavuz 2 dernek-kbb-bbc | sinüs BT endikasyonu
S: Akut rinosinüzitte paranazal sinüs BT ne zaman istenir?
+ komplikasyon şüphesi (orbital / intrakraniyal) ; cerrahi planlama ; kronik / tekrarlayan rinosinüzitte tanı ; komplikasyonsuz akut rinosinüzitte rutin BT önerilmez ; düz grafi yerine BT
- her akut sinüzite BT ; düz sinüs grafisi tanıda yeterlidir
`,
} satisfies BankaKaynagi
