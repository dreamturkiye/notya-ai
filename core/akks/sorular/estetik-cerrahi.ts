import type { BankaKaynagi } from '../banka'

/** AKKS — Estetik Cerrahi Merkezi (Özel Branşlar). 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'estetik-cerrahi',
  onek: 'EST',
  metin: String.raw`
#1 kilavuz 2 yonetmelik-guzellik-estetik-kuruluslari | Güzellik ve Estetik Amaçlı Sağlık Kuruluşları Yönetmeliği
S: Estetik cerrahi işlemlerin yapılabileceği yer ve yetki konusunda temel kural?
+ cerrahi işlemler yalnız ruhsatlı sağlık kuruluşlarında, uygun ameliyathane koşullarında ; ilgili uzmanlık alanındaki hekimler ; güzellik salonlarında tıbbi işlem yapılamaz ; mevzuatın güncel metninden doğrulanmalı
- güzellik salonunda liposuction yapılabilir ; yetki gerekmez
#2 yaygin 2 - | hasta seçimi
S: Estetik cerrahide hasta seçiminde psikolojik değerlendirme neden önemlidir?
+ beden dismorfik bozukluk taraması ; gerçekçi olmayan beklentiler ; tekrarlayan cerrahi talebi ; gerektiğinde psikiyatri yönlendirmesi ; cerrahi reddetme hakkı
- her talep karşılanmalı ; psikolojik değerlendirme gereksiz
#3 kirmizi 3 - | VTE profilaksi
S: Abdominoplasti planlanan, OKS kullanan obez hastada VTE riski. Yaklaşım?
+ Caprini risk skoru ; mekanik ve gerekirse farmakolojik profilaksi ; OKS'nin riski artırdığı ; erken mobilizasyon ; kombine işlemlerde risk artışı
- profilaksi gereksiz ; OKS önemsiz
#4 kirmizi 3 - | liposuction güvenliği
S: Büyük hacimli liposuctionda güvenlik ilkeleri?
+ hacim sınırları (ofis ortamında sınırlı aspirat) ; tumescent lidokain dozu (mg/kg) ; sıvı dengesi ; yağ embolisi / VTE farkındalığı ; uzun süreli kombine işlemlerden kaçınma
- sınırsız hacim tek seansta ; lidokain dozu önemsiz
#5 kirmizi 3 - | BBL yağ embolisi
S: Gluteal yağ enjeksiyonunda (BBL) ölümcül komplikasyon riski nasıl azaltılır?
+ yağ embolisi ölümcül risk ; yalnız subkutan düzlemde enjeksiyon, kas içine değil ; uygun kanül ve teknik (USG rehberliği) ; acil müdahale hazırlığı
- kas içi derin enjeksiyon daha güvenli ; risk yoktur
#6 yaygin 2 - | rinoplasti
S: Rinoplasti öncesi değerlendirme?
+ estetik ve fonksiyonel (nazal tıkanıklık) değerlendirme ; septum, valv, konka ; psikolojik beklenti ; sigara bırakma ; antikoagülan / takviye sorgulama
- yalnız estetik değerlendirme yeterli ; fonksiyon önemsiz
#7 kirmizi 2 - | rinoplasti sonrası kanama / septal hematom
S: Rinoplasti sonrası burunda şiddetli ağrı ve septumda şişlik. Ne yaparsın?
+ septal hematom ; acil drenaj ; abse ve kıkırdak nekrozu riski (semer burun) ; antibiyotik
- normal ödem ; buz yeterli
#8 kilavuz 3 dernek-tprecd | meme implantı
S: Meme implantı uygulanan hastaya uzun dönem izlemde ne anlatılır?
+ implantlar ömür boyu cihaz değildir, revizyon olasılığı ; kapsüler kontraktür, rüptür ; BIA-ALCL (özellikle tekstürlü) ve geç seroma farkındalığı ; silikon implantta sessiz rüptür için görüntüleme ; meme kanseri taramasının sürdürülmesi
- implant ömür boyu sorunsuzdur ; tarama gereksiz
#9 kirmizi 2 - | geç seroma
S: Implantlı hastada yıllar sonra tek taraflı meme şişliği. Ne yaparsın?
+ BIA-ALCL dışlanmalı ; USG, sıvı aspirasyonu, sitoloji ve CD30 ; onkoloji / multidisipliner ; kapsülektomi
- drene edip izle ; tetkik gereksiz
#10 ilac 2 - | sigara ve cerrahi
S: Abdominoplasti / meme küçültme öncesi sigara neden bırakılmalı?
+ flep nekrozu ve yara ayrışması riski ; en az 4 hafta önce ve sonra ; nikotin replasmanı da vazokonstriksiyon ; cotinine testi bazı merkezlerde
- sigaranın etkisi yok ; nikotin bandı güvenli
#11 kirmizi 2 - | anestezi güvenliği
S: Ofis tabanlı estetik cerrahide anestezi güvenliği?
+ ASA sınıflaması, uygun hasta seçimi ; monitörizasyon ve resüsitasyon ekipmanı ; anestezi uzmanı / yetkin ekip ; taburculuk kriterleri ; acil sevk planı
- monitörsüz derin sedasyon ; ASA önemsiz
#12 yaygin 2 - | blefaroplasti
S: Blefaroplasti öncesi değerlendirme?
+ kuru göz, görme, ptozis değerlendirmesi ; tiroid oftalmopatisi ; antikoagülan ; retrobulber hematom riski ve postop uyarı
- göz muayenesi gereksiz ; ptozis önemsiz
#13 kirmizi 3 - | retrobulber hematom
S: Blefaroplasti sonrası ani göz ağrısı, proptozis ve görme kaybı. Ne yaparsın?
+ retrobulber hematom — görme kaybı riski ; acil lateral kantotomi / kantoliz ; sütürlerin açılması ; acil göz konsültasyonu
- soğuk uygulama ve izlem ; ertesi gün kontrol
#14 yaygin 2 - | abdominoplasti sonrası seroma
S: Abdominoplasti sonrası seroma yönetimi?
+ sık komplikasyon ; aspirasyon (tekrarlayan) ; kompresyon giysisi ; kronik seromda kapsül / cerrahi ; enfeksiyon bulguları
- tedavi gerekmez her zaman ; kompresyon zararlı
#15 tuzak 2 - | kombine işlem
S: Tek seansta çok sayıda büyük estetik işlem (liposuction + abdominoplasti + meme + BBL) yapmak güvenli midir?
+ ameliyat süresi ve kombine işlemler VTE ve komplikasyon riskini artırır ; süre sınırlaması, aşamalı planlama ; hasta güvenliği öncelikli
- süre sınırı yok ; tek seansta hepsi daha güvenli
#16 sgk 1 - | estetik SGK
S: Estetik cerrahi işlemleri ve komplikasyonları SGK açısından nasıl değerlendirilir?
+ estetik amaçlı işlemler SGK kapsamında değil ; komplikasyonların tedavisi mevzuata göre değerlendirilir ; rekonstrüktif endikasyonların belgelenmesi ; güncel SUT / mevzuattan doğrulanmalı
- tüm estetik işlemleri SGK öder ; rekonstrüktif işlem yok
#17 yaygin 2 - | meme küçültme
S: Meme küçültme ameliyatı öncesi değerlendirme?
+ semptomlar (sırt-boyun ağrısı, intertrigo) ; yaşa göre meme görüntüleme ; emzirme ve duyu değişikliği riski ; meme başı nekrozu riski ; sigara
- görüntüleme gereksiz ; emzirme etkilenmez
#18 kirmizi 2 - | postop enfeksiyon implant
S: Meme implantı sonrası 10. günde kızarıklık, ateş ve akıntı. Yaklaşım?
+ implant enfeksiyonu ; kültür, IV antibiyotik ; çoğunlukla implant çıkarılması gerekir ; seroma / hematom ayırıcı tanısı
- oral antibiyotikle her zaman kurtarılır ; izlem
#19 ilac 2 - | antikoagülan estetik
S: Elektif estetik cerrahi öncesi bitkisel takviyelerin sorgulanması neden önemli?
+ balık yağı, ginkgo, sarımsak, E vitamini kanamayı artırabilir ; sarı kantaron anestezi ilaçlarıyla etkileşir ; genellikle 1–2 hafta önce kesilmesi ; tam ilaç öyküsü
- bitkisel ürünler etkisiz, sorgulanmaz ; aspirin önemsiz
#20 kirmizi 2 - | lokal anestezik toksisite
S: Tumescent liposuction sonrası saatler içinde konfüzyon ve aritmi. Ne düşünürsün?
+ geç lidokain toksisitesi (pik düzey saatler sonra) ; lipid emülsiyon, ALS ; monitörizasyon ; doz hesabı ve gözlem süresi
- işlem bitince risk yok ; taburcu
#21 yaygin 2 - | yüz germe
S: Yüz germe sonrası en sık erken komplikasyon ve önleme?
+ hematom (en sık) ; KB kontrolü, öksürük / kusma önleme ; erkeklerde risk yüksek ; fasiyal sinir hasarı (nadir) farkındalığı ; sigara
- KB önemsiz ; hematom nadir
#22 kirmizi 2 - | fasiyal sinir
S: Yüz germe sonrası tek taraflı ağız köşesi hareketinde zayıflık. Ne söylersin?
+ marjinal mandibuler dal etkilenmesi olası ; çoğu nöropraksi, aylar içinde düzelir ; lokal anestezik etkisi ilk saatlerde ayırt edilir ; kalıcıysa değerlendirme / onarım
- kalıcıdır ; hemen cerrahi
#23 tuzak 2 - | estetik turizm
S: Uçuştan hemen sonra büyük estetik cerrahi ve ameliyattan 1 gün sonra uzun uçuş güvenli mi?
+ uzun uçuş + cerrahi VTE riskini artırır ; cerrahi sonrası yeterli süre (genellikle 1–2 hafta, büyük işlemlerde daha uzun) ; profilaksi ve mobilizasyon ; postop izlem planı
- ertesi gün uzun uçuş güvenli ; profilaksi gereksiz
#24 yaygin 2 - | skar
S: Estetik cerrahi skarlarının iyileşmesini optimize etme?
+ gerginliksiz kapama ; silikon jel / tabaka ; güneşten korunma ; hipertrofik skarda steroid ; olgunlaşma 12–18 ay
- güneş skarı iyileştirir ; ilk ay revizyon
#25 kirmizi 2 - | anafilaksi ameliyathane
S: Estetik cerrahide antibiyotik profilaksisi sonrası hipotansiyon ve bronkospazm. Ne yaparsın?
+ anafilaksi ; tetikleyicinin kesilmesi ; IV adrenalin titrasyonu (veya IM) ; sıvı, oksijen ; triptaz ve sonrasında alerji değerlendirmesi
- yalnız antihistaminik ; işleme devam
#26 kilavuz 2 - | aydınlatılmış onam
S: Estetik cerrahide aydınlatılmış onamın özellikleri?
+ alternatifler, riskler (genel ve işleme özgü), beklenen sonuç ; revizyon olasılığı ; ücret ; düşünme süresi ; yazılı belge ve anlaşılır dil
- aynı gün imzalatıp hemen ameliyat ; risk listesi gereksiz
#27 yaygin 2 - | ileri yaş
S: 70 yaşında hasta estetik cerrahi istiyor. Değerlendirme?
+ yaş tek başına kontrendikasyon değil ; komorbidite ve kırılganlık değerlendirmesi ; anestezi riski ; gerçekçi beklenti
- 65 üstü kesin kontrendike ; değerlendirme gereksiz
#28 kirmizi 2 - | GLP-1 kullanan hasta
S: Semaglutid kullanan hasta elektif estetik cerrahi için geldi. Anestezi açısından dikkat?
+ gastrik boşalma gecikmesi, aspirasyon riski ; anesteziyle birlikte ilacın kesilme / açlık planı (güncel öneriler) ; hızlı kilo kaybı sonrası beslenme durumu ; kilo stabilizasyonu sonrası vücut şekillendirme
- GLP-1 anesteziyi etkilemez ; kilo kaybı sürerken cerrahi ideal
#29 tuzak 2 - | vücut şekillendirme kilo kaybı
S: Liposuction obezite tedavisinde kilo verme yöntemi midir?
+ liposuction kilo verme yöntemi değil, kontur düzeltmedir ; ideal kiloya yakın hastalarda ; metabolik yararı yok ; obezitede yaşam tarzı / medikal / bariatrik
- liposuction obezite tedavisidir ; metabolik hastalığı iyileştirir
#30 yaygin 2 - | postop ağrı
S: Estetik cerrahi sonrası ağrı yönetimi?
+ multimodal analjezi (parasetamol, NSAİİ uygunsa) ; uzun etkili lokal anestezik / bloklar ; opioid gerekirse kısa süre ; bulantı-kusma profilaksisi
- yalnız opioid ; NSAİİ her zaman yasak
`,
} satisfies BankaKaynagi
