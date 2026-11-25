import type { BankaKaynagi } from '../banka'

/** AKKS — Diyetisyen (Özel Branşlar). 100 draft items (Claude, 2026-11-24). Scope: Tıbbi Beslenme Tedavisi within the
 *  dietitian's legal role (yonetmelik-is-ve-gorev-tanimlari) — no prescribing. Needs clinician review before counting. */
export default {
  brans: 'diyetisyen',
  onek: 'DYT',
  metin: String.raw`
#1 kilavuz 1 hsgm-tuber-2022 | TÜBER 2022, Sağlıklı Yemek Tabağı
S: Sağlıklı erişkin için TÜBER'e göre dengeli tabak önerisi nasıl anlatılır?
+ dört besin grubu dengesi (süt grubu, et-yumurta-kurubaklagil, sebze-meyve, ekmek-tahıl) ; tabağın yaklaşık yarısı sebze-meyve ; tam tahıl tercihi ; su ana içecek, şeker ve tuz kısıtlaması ; TÜBER 2022 Türkiye'ye özgü referans
- karbonhidratlar tamamen çıkarılmalı ; tek besin grubuyla beslenme önerilir
#2 kilavuz 2 hsgm-tuber-2022 | TÜBER 2022, tuz
S: Erişkinde günlük tuz tüketimi için Türkiye önerisi nedir ve nasıl azaltılır?
+ günlük tuz 5 g'ın altında ; işlenmiş gıdalar, ekmek, peynir, turşu, salça gizli tuz kaynakları ; etiket okuma (sodyum) ; baharat / limon ile lezzetlendirme ; Türkiye'de tuz tüketimi önerinin belirgin üzerinde
- günde 10–12 g tuz sağlıklıdır ; deniz tuzu / kaya tuzu sodyum içermez
#3 yaygin 2 - | obezite tıbbi beslenme tedavisi
S: VKİ 32 olan, eşlik eden hastalığı olmayan erişkinde kilo kaybı hedefi ve enerji açığı nasıl planlanır?
+ 6 ayda başlangıç ağırlığının %5–10'u kaybı hedefi ; günlük yaklaşık 500–750 kcal enerji açığı ; bireyselleştirilmiş, sürdürülebilir diyet modeli (Akdeniz tipi vb.) ; fiziksel aktivite ve davranış değişikliği ; kilo koruma planı
- haftada 3–4 kg kayıp hedeflenmeli ; 800 kcal altı diyet tüm hastalara standart
#4 kirmizi 2 - | yeniden beslenme sendromu
S: Uzun süre çok az yemiş, ağır malnütrisyonlu hastada beslenmeye başlarken en önemli risk nedir?
+ yeniden beslenme sendromu ; hipofosfatemi, hipokalemi, hipomagnezemi ; düşük enerjiyle başlayıp kademeli artış ; tiamin desteği beslenmeden önce (hekimle) ; elektrolitlerin yakın izlemi, hekim / beslenme ekibi ile birlikte
- hemen tam enerji gereksinimiyle başlanır ; elektrolit izlemi gereksiz
#5 kilavuz 2 - | tip 2 diyabet karbonhidrat
S: Tip 2 diyabetli bireyde tıbbi beslenme tedavisinin temel ilkeleri nelerdir?
+ bireyselleştirilmiş enerji ve karbonhidrat miktarı ; karbonhidrat kalitesi: lif, tam tahıl, düşük glisemik yük ; öğün dağılımının ilaç / insülinle uyumu (hekim tedavisine göre) ; kilo kaybı fazla kilolularda remisyon şansını artırır ; şekerli içeceklerden kaçınma
- diyabetlide meyve tamamen yasak ; tek tip "diyabet diyeti" herkese
#6 ilac 2 - | warfarin K vitamini
S: Warfarin kullanan hastaya yeşil yapraklı sebzeleri tamamen yasaklamalı mıyız?
+ yasaklama değil, K vitamini alımında tutarlılık ; ani artış / azalış INR'yi değiştirir ; diyet değişikliğinde hekime / INR izlemine bilgi ; greyfurt, bazı bitkisel ürünler (ginkgo, sarı kantaron) etkileşimi
- warfarin kullanan yeşil sebze hiç yememeli ; bitkisel çaylar güvenlidir
#7 ilac 2 - | MAOİ tiramin
S: MAO inhibitörü kullanan hastaya hangi besinlerden kaçınması söylenmeli?
+ tiramin içeriği yüksek besinler: olgunlaştırılmış peynirler, fermente / kürlenmiş et (sucuk, pastırma), soya sosu, fıçı bira ; hipertansif kriz riski ; tazelik ve saklama koşulları ; ilaç kesildikten sonra da belirli süre dikkat
- tiraminin MAOİ ile ilişkisi yoktur ; taze süt kesinlikle yasak
#8 ilac 2 - | levotiroksin
S: Levotiroksin kullanan hastaya öğün zamanlaması konusunda ne önerilir?
+ aç karnına, kahvaltıdan 30–60 dakika önce su ile ; kalsiyum, demir, soya, yüksek lif emilimi azaltır, en az 4 saat ara ; kahve emilimi azaltabilir ; düzenli aynı saatte alım
- süt ile birlikte alınması emilimi artırır ; zamanlama önemsizdir
#9 ilac 2 - | metformin B12
S: Uzun süredir metformin kullanan diyabetli hastada beslenme açısından hangi mikrobesin izlenmeli?
+ B12 vitamini eksikliği riski ; düzeyinin hekim tarafından izlenmesi ; hayvansal kaynaklı besinler ; nöropati bulgularında değerlendirme
- metformin B12'yi artırır ; B12 izlemi gerekmez
#10 kirmizi 3 - | anoreksiya nervoza
S: Kilo vermek için başvuran, VKİ 15,5, adetleri kesilmiş 17 yaşında kız. Yaklaşım?
+ yeme bozukluğu (anoreksiya nervoza) şüphesi ; kilo verme diyeti verilmez ; tıbbi değerlendirme için acil hekim (bradikardi, elektrolit, yatış kriterleri) ; psikiyatri ile multidisipliner tedavi ; yeniden beslenme sendromu riski
- düşük kalorili diyet verilir ; aileye bilgi verilmeden izlenir
#11 kilavuz 2 - | KBH protein
S: Diyaliz öncesi evre 4 kronik böbrek hastalığında protein alımı önerisi?
+ diyaliz öncesi ileri evrede kontrollü protein (yaklaşık 0,55–0,8 g/kg/gün, nefroloğun hedefine göre) ; yeterli enerji ile malnütrisyondan kaçınma ; fosfor, potasyum ve sodyum kısıtlaması laboratuvara göre ; bitkisel ağırlıklı beslenmenin yeri
- tüm KBH evrelerinde yüksek protein ; diyaliz hastasında da protein kısıtlanır
#12 kilavuz 2 sb-kp-diyaliz | diyaliz hastası
S: Hemodiyaliz hastasında protein ve sıvı önerisi?
+ diyalizde protein gereksinimi artar (yaklaşık 1,0–1,2 g/kg/gün) ; sıvı kısıtlaması: idrar çıkışı + yaklaşık 500 ml ; potasyum ve fosfor kontrolü, fosfor bağlayıcıların öğünle (hekim tedavisi) ; diyalizler arası kilo artışının izlenmesi
- diyaliz hastasında protein kısıtlanmalı ; sınırsız sıvı
#13 yaygin 2 - | hiperkalemi besin
S: Potasyumu yüksek diyaliz hastasına hangi besinler için dikkat önerilir ve hangi pişirme yöntemleri yardımcı olur?
+ yüksek potasyumlu besinler: muz, kayısı, kuru meyve, patates, domates, kurubaklagil ; sebzeleri doğrayıp suda bekletme / haşlayıp suyunu dökme ; tuz yerine geçen potasyum klorürlü ürünlerden kaçınma ; laboratuvara göre bireysel
- tuz yerine "az sodyumlu tuz" (KCl) önerilir ; tüm sebze ve meyveler yasak
#14 kilavuz 2 - | çölyak glutensiz diyet
S: Çölyak tanısı konan hastaya glutensiz diyette nelere dikkat edilmeli?
+ buğday, arpa, çavdar ve bunların türevleri çıkarılır ; yulaf yalnız glutensiz sertifikalı ve tolere ediliyorsa ; çapraz bulaşma önlemleri ; etiket okuma, glutensiz logo ; demir, folat, B12, D vitamini, kalsiyum izlemi
- az miktar gluten zarar vermez ; tanı öncesi glutensiz diyete başlanmalı
#15 tuzak 2 - | glutensiz diyet herkese
S: Çölyak veya gluten duyarlılığı olmayan birine kilo vermek için glutensiz diyet önerir misin?
+ glutensiz diyetin çölyak dışı kişide kilo kaybı veya sağlık üstünlüğü kanıtı yoktur ; glutensiz ürünler daha pahalı, bazıları yağ / şeker yüksek ; çölyak testinden önce glutensiz diyete başlamak tanıyı zorlaştırır
- glutensiz diyet herkes için daha sağlıklı ; gluten tüm bireylerde inflamasyon yapar
#16 yaygin 2 - | gebelik beslenmesi
S: Gebelikte enerji ve ağırlık artışı önerileri nasıl planlanır?
+ ilk trimesterde ek enerji gereksinimi çok az ; 2. ve 3. trimesterde yaklaşık +340 / +450 kcal ; gebelik öncesi VKİ'ye göre ağırlık artışı hedefleri ; folat, demir, iyot, D vitamini (hekimin desteklerine uyum) ; çiğ / az pişmiş et, çiğ süt ürünlerinden kaçınma (listeria, toksoplazma)
- "iki kişilik yemek" ; gebelikte kilo verme diyeti uygulanır
#17 ilac 2 - | gebelikte kafein / balık
S: Gebelikte kafein ve balık tüketimi konusunda ne önerilir?
+ kafein günlük yaklaşık 200 mg'ın altında ; haftada 2–3 porsiyon düşük cıvalı balık ; yüksek cıvalı büyük balıklardan (köpek balığı, kılıç) kaçınma ; omega-3 yararı
- gebelikte balık tamamen yasak ; sınırsız kahve
#18 kilavuz 2 - | GDM beslenme
S: Gestasyonel diyabetli gebede beslenme planı nasıl olmalı?
+ karbonhidrat kısıtlaması değil kontrolü ve dağılımı (3 ana + 2–3 ara öğün) ; kompleks karbonhidrat, lif, protein dengesi ; yetersiz enerji / ketozdan kaçınma ; kan şekeri izlemiyle hekim / ekip uyumu ; doğum sonrası tip 2 diyabet riski
- karbonhidrat tamamen kesilir ; kilo kaybı hedeflenir
#19 yaygin 2 - | emziren anne
S: Emziren annede beslenme önerileri?
+ ek enerji gereksinimi (yaklaşık +330–400 kcal ilk 6 ay) ; yeterli sıvı ; çeşitli ve dengeli beslenme, besin kısıtlaması rutin gerekmez ; alkolden kaçınma, kafein sınırlı ; iyot ve D vitamini
- emzirirken kurubaklagil ve sebze yasak ; çok düşük kalorili diyetle hızlı kilo verme
#20 kilavuz 1 hsgm-tuber-2022 | TÜBER, tamamlayıcı beslenme
S: Tamamlayıcı beslenmeye geçişte temel öneriler nelerdir?
+ 6. ayda başlanır, anne sütü sürdürülür ; demirden zengin besinler ; tek tek, kademeli yeni besin ; tuz ve şeker eklenmez, 1 yaş altı bal ve inek sütü (ana içecek) verilmez ; boğulma riski olan besinlerden kaçınma
- 3. ayda tamamlayıcı beslenme ; ilk besin şekerli muhallebi
#21 kirmizi 2 - | bebek bal
S: Aile 8 aylık bebeğin öksürüğü için bal vermek istiyor. Ne söylersin?
+ 1 yaş altında bal verilmez ; infant botulizmi riski ; öksürük için hekime yönlendirme ; 1 yaştan sonra bal kullanılabilir
- az miktar bal güvenlidir ; pastörize bal riski ortadan kaldırır
#22 yaygin 2 - | çocuk obezite
S: 10 yaşında obez çocukta beslenme yaklaşımı?
+ aile temelli yaklaşım ; çocukta katı enerji kısıtlı diyet yerine davranış değişikliği ve büyümeyi bozmadan ağırlık koruma / yavaş kayıp ; şekerli içecek, atıştırmalık, ekran süresinin azaltılması ; fiziksel aktivite ; komorbiditeler için hekim değerlendirmesi
- 1000 kcal diyet ve tartı baskısı ; çocuk tek başına sorumlu tutulur
#23 kilavuz 2 dernek-turk-hipertansiyon-uzlasi-2025 | Türk Hipertansiyon Uzlaşı Raporu 2025
S: Hipertansiyonu olan hastada beslenme önerileri?
+ DASH / Akdeniz tipi beslenme ; tuz <5 g/gün ; potasyumdan zengin sebze-meyve (böbrek fonksiyonu uygunsa) ; kilo kaybı, alkolün sınırlanması ; düzenli fiziksel aktivite
- tuz kısıtlaması gereksiz ; potasyum takviyesi tüm hastalara
#24 kilavuz 2 - | dislipidemi
S: LDL kolesterolü yüksek bireyde beslenme önerileri?
+ doymuş yağ enerjinin <%10'u, trans yağlardan kaçınma ; çözünür lif (yulaf, kurubaklagil), bitkisel steroller ; zeytinyağı, kuruyemiş, balık ; kilo kontrolü ; diyet ilaç tedavisinin yerine geçmez (hekim kararı)
- yumurta kesinlikle yasak ; diyet her zaman statinin yerine geçer
#25 tuzak 2 - | yumurta kolesterol
S: Kolesterolü yüksek hastaya yumurtayı tamamen yasaklamalı mıyız?
+ diyet kolesterolünün kan LDL'si üzerindeki etkisi doymuş / trans yağa göre sınırlı ; sağlıklı bireyde günde 1 yumurta genellikle kabul edilir ; genel beslenme kalıbı önemli ; diyabet / yüksek riskte bireysel
- yumurta tamamen yasaklanmalı ; yumurta sarısı tek kolesterol kaynağıdır
#26 yaygin 2 - | yağlı karaciğer
S: Metabolik ilişkili yağlı karaciğer hastalığında (MASLD) beslenme önerisi?
+ %7–10 kilo kaybı yağlanmayı ve inflamasyonu azaltır ; Akdeniz tipi beslenme ; fruktoz / şekerli içecek kısıtlaması ; alkolden kaçınma ; fiziksel aktivite
- karaciğer detoks ürünleri tedavidir ; hızlı açlık diyeti önerilir
#27 kirmizi 2 - | hızlı kilo kaybı safra taşı
S: Çok düşük kalorili diyetle hızlı kilo veren hastada sağ üst kadran ağrısı. Ne düşünürsün?
+ hızlı kilo kaybı safra taşı riskini artırır ; hekime yönlendirme (kolesistit, kolanjit dışlanmalı) ; kilo kaybı hızının ayarlanması ; ağrı ateş ve sarılıkta acil başvuru
- normal bir yan etki, diyete devam ; yağsız diyet tedavi eder
#28 kilavuz 3 sb-kp-obezite-metabolik-cerrahi-2026 | SB Obezite ve Metabolik Cerrahi KP 2026
S: Sleeve gastrektomi sonrası beslenme aşamaları nasıl planlanır?
+ berrak sıvı → tam sıvı → püre → yumuşak → normal kıvam aşamaları ; protein öncelikli (yaklaşık 60–80 g/gün veya kiloya göre) ; küçük porsiyon, yavaş yeme, sıvıyı öğünden ayrı ; yaşam boyu multivitamin-mineral, B12, demir, kalsiyum / D (ekip protokolü) ; dumping ve dehidratasyon izlemi
- ilk hafta normal diyete geçilir ; vitamin desteği gerekmez
#29 kirmizi 3 - | bariatrik tiamin
S: Bariatrik cerrahi sonrası sürekli kusan hastada nörolojik bulgular başladı. Ne düşünürsün?
+ tiamin (B1) eksikliği / Wernicke ensefalopatisi riski ; acil hekime yönlendirme, parenteral tiamin (glukozdan önce) ; dehidratasyon ve elektrolit ; kusmanın nedeninin araştırılması (darlık)
- normal bir süreç, sıvı diyete devam ; şekerli sıvı ile kendiliğinden düzelir
#30 yaygin 2 - | dumping
S: Gastrik bypass sonrası tatlı yedikten kısa süre sonra çarpıntı, terleme ve ishal. Öneriler?
+ erken dumping sendromu ; basit şekerlerden kaçınma ; sıvıyı öğünlerden ayrı (30 dk) ; küçük sık öğün, protein ve lif ; geç dumpingde reaktif hipoglisemi farkındalığı
- tatlıyı sıvıyla birlikte almak ; yüksek şekerli içecek
#31 kilavuz 2 - | enteral beslenme
S: Yutma güçlüğü olan inme hastasında enteral beslenme ne zaman düşünülür?
+ oral alım güvenli / yeterli değilse ; kısa süreli (genellikle <4–6 hafta) nazogastrik, uzun süreli PEG ; aspirasyon riski, baş elevasyonu ; enerji-protein gereksinimi hesaplanması ; yutma terapisi ekiple
- yutma testi yapılmadan sıvı verilir ; tüm hastalara ilk gün PEG
#32 sgk 2 sgk-sut | SUT enteral beslenme ürünleri (güncel madde doğrulanacak)
S: Enteral beslenme ürünlerinin SGK tarafından karşılanması için genel koşullar nelerdir?
+ SUT'ta tanımlı tıbbi endikasyonlar (malnütrisyon / risk, yutma bozukluğu vb.) ; ilgili uzman hekimlerce düzenlenen rapor ; beslenme değerlendirmesinin belgelenmesi ; süre ve miktar sınırları ; ayrıntılar güncel SUT'tan doğrulanmalı
- diyetisyen tek başına rapor düzenler ; herkese sınırsız ödenir
#33 sgk 1 - | diyetisyen hizmeti
S: Serbest çalışan diyetisyen danışmanlık hizmetlerinin SGK tarafından karşılanması konusunda genel durum nedir?
+ serbest muayenehane / ofis diyetisyen danışmanlığı genellikle SGK geri ödemesi kapsamında değildir ; hastanelerde verilen beslenme hizmetleri kurum işlemi olarak ; hastaya ücretlendirme konusunda şeffaflık ; güncel mevzuattan doğrulanmalı
- tüm diyetisyen seansları SGK'ca ödenir ; diyetisyen e-reçete ile ilaç yazabilir
#34 kilavuz 1 yonetmelik-is-ve-gorev-tanimlari | İş ve Görev Tanımları Yönetmeliği
S: Diyetisyenin görev ve yetki sınırları açısından ilaç / takviye önerisi konusunda ne bilinmelidir?
+ diyetisyen tıbbi beslenme tedavisi planlar ve uygular ; ilaç reçete etme yetkisi yoktur ; tıbbi tanı konmaz, hekime yönlendirme ; hekimle işbirliği ve ekip çalışması
- diyetisyen ilaç dozunu değiştirebilir ; diyetisyen tanı koyar
#35 tuzak 2 - | detoks
S: Hasta 7 günlük "detoks suyu" kürüyle karaciğerini temizlemek istiyor. Ne söylersin?
+ detoks diyetlerinin bilimsel kanıtı yoktur ; karaciğer ve böbrekler vücudu zaten temizler ; enerji ve protein yetersizliği, sıvı-elektrolit riski ; sürdürülebilir dengeli beslenme
- detoks kürü toksinleri atar ; yalnız meyve suyu ile beslenme güvenlidir
#36 tuzak 2 - | alkali diyet
S: "Alkali diyet kanseri önler, kan pH'sını değiştirir" iddiası için ne dersin?
+ diyet kan pH'sını anlamlı değiştirmez (tampon sistemleri) ; idrar pH'sı değişebilir ama bu kanseri önlemez ; sebze-meyveden zengin beslenmenin yararı pH'dan bağımsız ; kanıta dayalı bilgi
- alkali su kanseri tedavi eder ; et tüketimi kanı asitleştirip kanser yapar
#37 yaygin 2 - | aralıklı oruç
S: Aralıklı oruç (16:8) kilo vermede klasik enerji kısıtlamasından üstün müdür?
+ kilo kaybı benzer, temel belirleyici toplam enerji açığı ; bazı kişilerde uyumu kolaylaştırabilir ; diyabette insülin / sülfonilüre kullananlarda hipoglisemi riski (hekimle) ; gebelik, yeme bozukluğu öyküsü, çocuklarda önerilmez
- aralıklı oruç tüm hastalıklar için üstündür ; diyabetli hastada ilaç ayarı gerekmez
#38 kirmizi 2 - | Ramazan diyabet
S: İnsülin kullanan tip 1 diyabetli hasta Ramazan'da oruç tutmak istiyor. Ne yaparsın?
+ tip 1 diyabet yüksek riskli grup ; hekimle (endokrinoloji) önceden değerlendirme ve tedavi ayarı ; sık kan şekeri ölçümü, hipoglisemi / hiperglisemi durumunda orucu bozma kuralları ; sahurda kompleks karbonhidrat, iftarda dengeli, yeterli sıvı
- oruç güvenlidir, insülin değişmez ; hipoglisemide oruca devam edilir
#39 yaygin 2 - | vejetaryen / vegan
S: Vegan beslenen hastada hangi besin ögeleri açısından dikkat gerekir?
+ B12 vitamini (takviye gerekli) ; demir, çinko, kalsiyum, iyot, D vitamini ; omega-3 (EPA/DHA) ; protein çeşitliliği (kurubaklagil, tahıl) ; gebelik ve çocukluk döneminde ek dikkat
- vegan beslenmede hiçbir takviye gerekmez ; B12 bitkisel kaynaklardan yeterli alınır
#40 kilavuz 2 sb-kp-demir | demir eksikliği beslenme
S: Demir eksikliği anemisi olan kadına beslenme önerileri?
+ hem demir kaynakları (kırmızı et, tavuk, balık) ; hem olmayan demir (kurubaklagil, yeşil yapraklı) ile C vitamini ; çay / kahveyi öğünden ayrı tüketme ; tanı ve demir tedavisi hekim tarafından, beslenme destekleyici
- yalnız ıspanak ile anemi tedavi edilir ; demir ilacını çayla birlikte alın
#41 yaygin 2 - | osteoporoz beslenme
S: Postmenopozal osteoporozda beslenme önerileri?
+ yeterli kalsiyum (yaklaşık 1000–1200 mg/gün, öncelik besinden) ; D vitamini (hekim değerlendirmesiyle) ; yeterli protein ; tuz, alkol, aşırı kafein sınırlaması ; düşme önleme ve egzersiz
- protein kemiği eritir, kısıtlanmalı ; yüksek doz kalsiyum takviyesi herkese
#42 kilavuz 2 - | IBS düşük FODMAP
S: İrritabl bağırsak sendromunda düşük FODMAP diyeti nasıl uygulanır?
+ tanının hekimce konmuş olması ; eliminasyon (2–6 hafta) → yeniden ekleme → kişiselleştirme ; uzun süreli katı eliminasyondan kaçınma ; diyetisyen eşliğinde ; ilk basamakta genel öneriler (öğün düzeni, lif)
- düşük FODMAP ömür boyu katı uygulanır ; alarm bulgularında tanısız diyet
#43 kirmizi 2 - | alarm bulguları GİS
S: Diyet danışmanlığına gelen hastada kilo kaybı, rektal kanama ve gece uyandıran ishal var. Ne yaparsın?
+ alarm bulguları ; diyet önerisinden önce hekime yönlendirme ; organik hastalık (İBH, malignite) dışlanmalı ; diyet tedavisi tanıya göre
- düşük FODMAP diyeti başlanır ; probiyotikle izlem
#44 yaygin 2 - | İBH beslenme
S: Crohn hastasında beslenme yaklaşımı?
+ malnütrisyon ve mikrobesin eksikliklerinin (demir, B12, D, çinko) taranması ; alevlenmede bireysel tolere edilen diyet ; striktür varsa düşük lif / kalıntı ; çocuklarda eksklüzif enteral beslenme remisyon indüksiyonunda ; kanıtsız katı eliminasyon diyetlerinden kaçınma
- tüm Crohn hastaları ömür boyu lifsiz beslenmeli ; tek bir "Crohn diyeti" tedavi eder
#45 yaygin 1 - | kabızlık erişkin
S: Fonksiyonel kabızlığı olan erişkine beslenme önerileri?
+ lif alımının kademeli artırılması (25–30 g/gün) ; yeterli sıvı ; kuru erik / kivi gibi besinler ; düzenli fiziksel aktivite ve tuvalet alışkanlığı ; alarm bulgularında hekime yönlendirme
- lif birden çok artırılır, sıvı kısıtlanır ; laksatif çaylar sürekli kullanılır
#46 kilavuz 2 dernek-temd-dm | TEMD DM Kılavuzu (güncel baskı doğrulanacak)
S: Karbonhidrat sayımı hangi hastalar için uygundur?
+ çoklu doz insülin / insülin pompası kullanan tip 1 (ve seçilmiş tip 2) hastalar ; insülin / karbonhidrat oranı hekimle belirlenir ; porsiyon ve etiket eğitimi ; yağ / protein yüksek öğünlerin glisemiye etkisi
- karbonhidrat sayımı yalnız tip 2 içindir ; diyetisyen insülin dozunu tek başına belirler
#47 kirmizi 2 - | hipoglisemi
S: İnsülin kullanan hastaya hipoglisemi (KŞ < 70 mg/dL) durumunda ne yapması öğretilir?
+ 15 g hızlı etkili karbonhidrat (glukoz tableti, meyve suyu, şeker) ; 15 dakika sonra tekrar ölçüm ; düzelince kompleks karbonhidrat / öğün ; bilinç bozukluğunda ağızdan bir şey verilmez, glukagon / acil ; çikolata gibi yağlı besinler yavaş etkili
- çikolata ilk tercih ; bilinci bulanık hastaya ağızdan şeker
#48 ilac 3 - | GLP-1 agonist beslenme
S: GLP-1 agonisti kullanan hastada beslenme açısından nelere dikkat edilmeli?
+ iştah azalması nedeniyle yeterli protein alımı (kas kaybını önleme) ; küçük porsiyon, yağlı / büyük öğünlerden kaçınma (bulantı) ; yeterli sıvı (dehidratasyon) ; direnç egzersizi ; ilaç dozu hekim kararı
- protein kısıtlanır ; ilaç varken diyete gerek yok
#49 yaygin 2 - | sporcu beslenmesi
S: Dayanıklılık sporcusunda yarış öncesi ve sırasında karbonhidrat önerisi?
+ yarıştan önceki günlerde yeterli karbonhidrat (glikojen depolama) ; 60 dakikayı aşan egzersizde saatte yaklaşık 30–60 g (uzunlarda 90 g'a kadar) ; sıvı-elektrolit ; yarışta yeni ürün denenmemesi
- egzersiz sırasında karbonhidrat gereksiz ; yalnız su yeterli her mesafede
#50 tuzak 2 - | protein tozu
S: Rekreasyonel spor yapan sağlıklı gence yüksek doz protein tozu gerekli midir?
+ yeterli besinle protein gereksinimi çoğunlukla karşılanır (yaklaşık 1,2–2,0 g/kg/gün antrenmana göre) ; takviye zorunlu değil ; kontamine / dopingli ürün riski ; böbrek hastalığında dikkat
- herkes için 3–4 g/kg protein şart ; takviyeler denetimsiz bile güvenli
#51 kirmizi 2 - | enerji içeceği
S: Lise öğrencisi günde 3 enerji içeceği tüketiyor, çarpıntısı var. Ne önerirsin?
+ yüksek kafein ve şeker ; çarpıntı nedeniyle hekim değerlendirmesi ; çocuk ve ergenlerde enerji içecekleri önerilmez ; uyku, beslenme düzeni
- sporcu olduğu için uygundur ; kafeinin üst sınırı yoktur
#52 yaygin 2 - | yaşlı malnütrisyon
S: 80 yaşında kilo kaybeden hastada malnütrisyon taraması ve öneriler?
+ MNA veya NRS-2002 gibi tarama araçları ; enerji ve protein yoğunluğunu artırma, ara öğün ; ağız-diş sorunları, yutma, depresyon, ilaçlar ; gerekirse oral beslenme desteği (hekimle) ; sarkopeni için protein ve egzersiz
- yaşlılıkta kilo kaybı normaldir ; protein kısıtlanmalı
#53 kilavuz 2 sb-rehber-geriatrik-sendromlar | SB Geriatrik Sendromlar Rehberi
S: Sarkopenide beslenme yaklaşımı nedir?
+ yeterli protein (yaşlıda yaklaşık 1,0–1,2 g/kg/gün, hastalıkta daha fazla) ; öğünlere dağıtılmış protein, lösin kaynakları ; D vitamini ; direnç egzersizi ile birlikte ; böbrek fonksiyonu
- yaşlıda protein kısıtlaması ; egzersiz gereksiz
#54 kilavuz 2 - | kanser hastası beslenme
S: Kemoterapi alan, kilo kaybeden hastada beslenme önerileri?
+ malnütrisyon taraması ve erken müdahale ; enerji-protein yoğun küçük sık öğün ; bulantı, mukozit, tat değişikliğine yönelik öneriler ; gerekirse oral nütrisyonel destek / enteral ; kanıtsız "kanser diyetleri" ve kısıtlamalardan kaçınma
- şekeri kesmek tümörü aç bırakır ; aç kalarak kemoterapi önerilir
#55 tuzak 3 - | şeker kanseri besler
S: Kanser hastası "şeker tümörü besler" diye tüm karbonhidratları kesmek istiyor. Ne söylersin?
+ diyetteki şekeri kesmek tümör büyümesini durdurmaz ; tüm hücreler glukoz kullanır ; katı karbonhidrat kısıtlaması malnütrisyonu artırır ; eklenmiş şekeri sınırlamak genel sağlık için makul ; onkoloji ekibiyle uyum
- tüm karbonhidratlar kesilmeli ; ketojenik diyet kanseri tedavi eder
#56 kirmizi 2 - | nötropenik diyet
S: Nötropenik hastaya güvenli gıda hijyeni önerileri?
+ gıda güvenliği ilkeleri (pişirme, çapraz bulaşmanın önlenmesi) ; çiğ / az pişmiş et-yumurta, pastörize olmayan süt ürünlerinden kaçınma ; katı "nötropenik diyetin" ek yararı kanıtlanmamış ; merkez protokolüne uyum
- çiğ et ve çiğ süt güvenli ; tüm taze sebze-meyve yasak
#57 yaygin 2 - | gut
S: Gut hastasına beslenme önerileri?
+ kilo kontrolü ; sakatat, kırmızı et, bazı deniz ürünlerinin sınırlanması ; fruktozlu içecekler ve alkolden (özellikle bira) kaçınma ; yeterli sıvı ; düşük yağlı süt ürünleri yararlı ; ilaç tedavisi hekim kararı
- tüm sebzeler (ıspanak vb.) kesin yasak ; diyet tek başına ilaçsız tedavi eder
#58 kirmizi 2 - | gıda alerjisi
S: Yer fıstığı alerjisi olan çocuk için aileye beslenme danışmanlığında neler önemli?
+ alerjenin kesin eliminasyonu ve etiket okuma (iz uyarısı) ; çapraz bulaşma ; adrenalin otoenjektör ve acil planı (hekim) ; besin yetersizliği oluşmaması için dengeli alternatifler ; okul / bakıcı bilgilendirmesi
- az miktar yer fıstığı tolerans geliştirir, ev denemesi önerilir ; etiket okumaya gerek yok
#59 yaygin 2 - | laktoz intoleransı
S: Laktoz intoleransı olan hastada süt ürünleri tamamen kesilmeli mi?
+ çoğu kişi küçük miktarları tolere eder ; yoğurt, peynir daha iyi tolere edilir ; laktozsuz süt seçenekleri ; kalsiyum ve D vitamini alımının korunması ; süt proteini alerjisinden ayrımı
- tüm süt ürünleri kesilir ; laktoz intoleransı süt alerjisiyle aynıdır
#60 yaygin 2 - | gebelik bulantı
S: Gebelikte bulantısı olan kadına beslenme önerileri?
+ küçük sık öğünler, kuru karbonhidratlı atıştırmalar ; yağlı ve kokulu yiyeceklerden kaçınma ; sıvıyı öğün aralarında ; zencefil ; kilo kaybı, sıvı alamama, ketonüride hekime (hiperemezis)
- aç kalmak bulantıyı azaltır ; hiperemezis bulgularında beslenme önerisiyle izlem
#61 kilavuz 2 - | PKOS beslenme
S: PKOS'lu fazla kilolu kadında beslenme yaklaşımı?
+ %5–10 kilo kaybı ovulasyon ve metabolik parametreleri iyileştirebilir ; dengeli, düşük glisemik yüklü, lifli beslenme ; tek bir "PKOS diyeti" yok ; fiziksel aktivite ; insülin direnci ve metabolik izlem hekimle
- PKOS'ta tüm süt ve gluten kesilmeli ; ketojenik diyet tek doğru yöntem
#62 yaygin 2 - | hipertiroidi / hashimoto iyot
S: Hashimoto tiroiditi olan hastaya iyot ve gluten konusunda ne önerirsin?
+ iyotlu tuz normal miktarda ; yüksek doz iyot takviyesi / yosun ürünlerinden kaçınma ; çölyak eşlik etmiyorsa glutensiz diyetin kanıtı yok ; dengeli beslenme ; levotiroksin zamanlaması
- iyotlu tuz tamamen kesilmeli ; Hashimoto'da herkes glutensiz beslenmeli
#63 kirmizi 2 - | bulimia
S: Kilo kontrolü için kustuğunu söyleyen hastada ne yaparsın?
+ bulimia nervoza şüphesi ; hekime / psikiyatriye yönlendirme ; elektrolit bozuklukları (hipokalemi) riski ; yargılamadan iletişim ; diyet kısıtlaması döngüyü artırabilir
- düşük kalorili diyetle kusma azalır ; tıbbi değerlendirme gereksiz
#64 kilavuz 2 hsgm-tuber-2022 | TÜBER, su
S: Sağlıklı erişkinde günlük sıvı gereksinimi nasıl önerilir?
+ yaklaşık erkekte 2,5 L, kadında 2,0 L toplam su (besinler dahil, TÜBER) ; iklim ve aktiviteye göre artış ; yaşlıda susama hissi azalır ; kalp / böbrek yetmezliğinde hekimin kısıtlamasına uyum
- herkes en az 5 litre içmeli ; kalp yetmezliğinde sınırsız sıvı
#65 ilac 2 - | greyfurt etkileşimi
S: Greyfurt suyu hangi ilaçlarla etkileşir ve hastaya nasıl anlatılır?
+ CYP3A4 inhibisyonu ile bazı statinler (simvastatin), kalsiyum kanal blokerleri, bazı immünsüpresifler ; ilaç düzeyinin artması ve yan etki ; ilaç listesini hekim / eczacıyla kontrol ; etkileşim saatler boyu sürer
- greyfurt hiçbir ilaçla etkileşmez ; ilaçtan 1 saat ayırmak yeterli
#66 ilac 2 - | bitkisel ürün
S: Kemoterapi alan hasta yüksek doz bitkisel ürünler (zerdeçal, yeşil çay ekstresi) kullanmak istiyor. Ne önerirsin?
+ ilaç etkileşimi ve karaciğer toksisitesi riski ; onkoloji ekibiyle paylaşılmadan kullanılmaması ; besin olarak normal miktarlar ile ekstre / takviye ayrımı ; kanıt düzeyi
- doğal olduğu için zararsız ; kemoterapinin yerine geçer
#67 kirmizi 2 - | aşırı A vitamini
S: Gebelik planlayan kadın yüksek doz A vitamini takviyesi kullanıyor. Ne söylersin?
+ yüksek doz preformed A vitamini (retinol) teratojenik ; gebelikte / planlamada yüksek doz takviye önerilmez ; karaciğer gibi çok yüksek retinol içeren besinler sınırlı ; beta-karoten güvenli ; hekime bilgi
- yüksek doz A vitamini gebelikte yararlıdır ; ciğer her gün tüketilmeli
#68 yaygin 2 - | D vitamini takviye
S: Erişkin hastada D vitamini düzeyi düşük; diyetisyen olarak rolün nedir?
+ besin kaynakları (yağlı balık, yumurta, zenginleştirilmiş ürünler) ve güneşlenme önerileri ; takviye dozu ve tedavi hekim kararı ; aşırı doz toksisitesi (hiperkalsemi) farkındalığı ; kalsiyum alımı
- diyetisyen yüksek doz D vitamini tedavisi başlar ; D vitamininin üst sınırı yoktur
#69 kilavuz 2 - | kalp yetmezliği
S: Kalp yetmezliği olan hastada beslenme önerileri?
+ sodyum kısıtlaması (bireysel) ; sıvı kısıtlaması hekimin önerisine göre ; günlük tartı ile ani kilo artışının izlenmesi ; kaşeksi / malnütrisyon riski, yeterli protein ; potasyum ilaçlara göre (hekimle)
- sınırsız sıvı ve tuz ; tartı takibi gereksiz
#70 yaygin 2 - | karaciğer sirozu
S: Karaciğer sirozlu hastada protein alımı kısıtlanmalı mı?
+ sirozda protein kısıtlaması rutin önerilmez, malnütrisyon sık ; yaklaşık 1,2–1,5 g/kg/gün protein ; gece geç atıştırmalık (kompleks karbonhidrat) ; asitte sodyum kısıtlaması ; ensefalopatide bile uzun süreli protein kısıtlaması önerilmez
- tüm siroz hastalarında protein kesilmeli ; gece açlığı önerilir
#71 tuzak 2 - | KBH muz yasağı
S: Her kronik böbrek hastasına muz, domates, patates yasaklanmalı mı?
+ potasyum kısıtlaması yalnız hiperkalemi veya risk varsa ve laboratuvara göre ; gereksiz kısıtlama besin kalitesini düşürür ; erken evrede bitkisel besinlerden zengin beslenme yararlı olabilir ; bireysel planlama
- tüm KBH evrelerinde potasyumlu besinler yasak ; laboratuvar sonucu önemsiz
#72 yaygin 2 - | böbrek taşı
S: Kalsiyum oksalat taşı olan hastaya beslenme önerileri?
+ günlük idrar çıkışı >2–2,5 L olacak kadar sıvı ; diyetle kalsiyumu kısıtlamamak (normal alım) ; sodyum ve hayvansal proteini azaltma ; yüksek oksalatlı besinleri kalsiyumla birlikte / ölçülü tüketme ; C vitamini yüksek doz takviyesinden kaçınma
- kalsiyum tamamen kesilmeli ; sıvı kısıtlanmalı
#73 kirmizi 3 - | disfaji kıvam
S: Yutma güçlüğü olan hastada kıvam ayarı nasıl yapılır?
+ yutma değerlendirmesine (KBB / dil-konuşma terapisti) göre ; IDDSI kıvam basamakları ; sıvıların koyulaştırılması aspirasyonu azaltabilir ; dik oturuş, ağız hijyeni ; dehidratasyon ve malnütrisyon izlemi
- değerlendirme olmadan ince sıvı verilir ; kıvam herkes için aynıdır
#74 yaygin 2 - | sağlıklı atıştırmalık çocuk
S: Okul çağı çocuğun beslenme çantası için öneriler?
+ tam tahıllı ekmek, peynir / yumurta, sebze-meyve ; su veya süt (şekerli içecek değil) ; paketli, yüksek şeker-tuz-yağ içeren ürünlerin sınırlanması ; kahvaltının önemi
- her gün paketli kek ve meyve suyu ; kahvaltı gereksiz
#75 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Kilo yönetiminde fiziksel aktivite önerisi diyetle nasıl birleştirilir?
+ erişkinde haftada en az 150–300 dk orta şiddette aktivite ; haftada 2 gün kas güçlendirme ; oturma süresinin azaltılması ; kilo korumada aktivitenin rolü büyük ; hekim engeli varsa değerlendirme
- yalnız diyet yeterli, egzersiz gereksiz ; haftada 30 dk yeterlidir
#76 tuzak 2 - | kahvaltı metabolizma
S: "Kahvaltıyı atlamak metabolizmayı kalıcı olarak yavaşlatır" bilgisi doğru mu?
+ kahvaltı atlamanın metabolizmayı kalıcı yavaşlattığına dair güçlü kanıt yok ; toplam enerji ve beslenme kalitesi belirleyici ; kahvaltı kişiye göre plana dahil edilir ; çocuklarda düzenli kahvaltı önerilir
- kahvaltı atlayan kesinlikle kilo alır ; günde 6 öğün metabolizmayı hızlandırır
#77 yaygin 2 - | tip 1 diyabet çocuk
S: Tip 1 diyabetli çocukta beslenme planlaması nasıl olmalı?
+ büyüme ve gelişimi destekleyen yeterli enerji ; karbonhidrat sayımı ve insülin uyumu (hekim / ekip) ; okul ve egzersiz planlaması, hipoglisemi önlemleri ; ailenin eğitimi ; şeker tamamen yasak değil, planlı
- çocuğa düşük kalorili diyet ; tatlılar kesinlikle yasak
#78 kirmizi 2 - | ketojenik diyet
S: Ketojenik diyeti kimler uygulamamalı ve nasıl izlenmeli?
+ tıbbi ketojenik diyet dirençli epilepside ekip eşliğinde ; tip 1 diyabet, pankreatit, karaciğer yetmezliği, yağ metabolizması bozuklukları, gebelikte uygun değil ; SGLT2 inhibitörü kullanımında ketoasidoz riski ; lipid, böbrek taşı izlemi
- herkes için güvenli ; SGLT2 kullananlarda da ketojenik diyet önerilir
#79 sgk 2 sgk-sut | SUT metabolik hastalık ürünleri
S: Fenilketonürili çocukta özel tıbbi amaçlı ürünler SGK'ca nasıl karşılanır?
+ SUT'ta metabolik hastalıklar için özel tıbbi amaçlı ürün hükümleri ; ilgili uzman (çocuk metabolizma) raporu ; diyetisyen tarafından fenilalanin kısıtlı diyet planı ; kan fenilalanin düzeyi izlemiyle ; güncel SUT'tan doğrulanmalı
- diyetisyen tek başına rapor yazar ; ürünler ödenmez
#80 kilavuz 3 hsgm-yenidogan-metabolik-tarama | Ulusal Yenidoğan Tarama (baskı doğrulanacak)
S: Fenilketonüride beslenme tedavisinin temel ilkeleri nelerdir?
+ yaşam boyu fenilalanin kısıtlı diyet ; fenilalaninsiz protein karışımları (özel tıbbi ürün) ; kan Phe düzeyi hedeflerine göre ayarlama ; aspartam içeren ürünlerden kaçınma ; gebelikte (maternal PKU) sıkı kontrol
- diyet okul çağında bırakılır ; aspartam güvenlidir
#81 yaygin 2 - | kronik pankreatit
S: Kronik pankreatitli hastada beslenme önerileri?
+ alkolün tamamen bırakılması ; enzim replasmanı (hekim) ile normal / yeterli yağ alımı ; küçük sık öğün ; yağda eriyen vitaminler ve malnütrisyon izlemi ; diyabet gelişimi
- yağ tamamen kesilmeli ; az miktar alkol serbest
#82 tuzak 2 - | yağsız diyet kalp
S: Kalp sağlığı için tüm yağların kısıtlandığı çok düşük yağlı diyet önerilir mi?
+ yağın türü miktarından daha önemli ; doymamış yağlar (zeytinyağı, kuruyemiş, balık) yararlı ; doymuş ve trans yağların azaltılması ; Akdeniz diyeti kanıtı
- tüm yağlar kalbe zararlıdır ; zeytinyağı sınırlanmalı
#83 yaygin 2 - | gastrostomi evde
S: Evde PEG ile beslenen hastanın bakımında beslenme açısından önemli noktalar?
+ beslenme sırasında ve sonrasında baş yüksekliği (30–45°) ; tüpün beslenme öncesi / sonrası su ile yıkanması ; ilaçların uygun şekilde (ezilebilirlik) eczacı/hekimle ; sıvı, kilo ve tolerans izlemi ; stoma bakımı
- düz yatarken beslenme ; tüp yıkanmaz
#84 kirmizi 2 - | dehidratasyon yaşlı
S: Yaşlı hastada az sıvı alımı, konfüzyon ve idrar azalması. Ne yaparsın?
+ dehidratasyon şüphesi ; hekime acil yönlendirme ; sıvı alımını artıracak öneriler ancak tıbbi değerlendirmeyle ; susama hissi azalması, ilaçlar (diüretik)
- evde beslenme önerisiyle izlem yeterli ; sıvı kısıtlaması
#85 ilac 2 - | lityum tuz
S: Lityum kullanan hastaya tuz ve sıvı konusunda ne önerilir?
+ tuz ve sıvı alımında tutarlılık ; ani tuz kısıtlaması / dehidratasyon lityum düzeyini artırır (toksisite) ; ishal-kusma-yoğun terlemede hekime bilgi ; kafein değişiklikleri
- lityum kullanan hasta tuzu tamamen kesmeli ; sıvı kısıtlaması önerilir
#86 ilac 2 - | statin ve besin
S: Statin kullanan hastaya beslenme açısından ne önerirsin?
+ kalp dostu beslenme ilaçla birlikte sürer ; greyfurt (bazı statinlerle) etkileşimi ; kırmızı maya pirinci gibi takviyelerin ilaçla birlikte kullanılmaması ; kas ağrısında hekime bilgi
- statin varken diyet gereksiz ; kırmızı maya pirinci statinle birlikte önerilir
#87 kilavuz 2 - | gebelikte vejetaryen
S: Vejetaryen gebede beslenme planında nelere dikkat edilir?
+ demir ve B12 (hekimin takviyeleri) ; iyot, kalsiyum, D vitamini ; protein çeşitliliği ve yeterliliği ; omega-3 (DHA) kaynakları ; ağırlık artışının izlenmesi
- vejetaryen gebede hiçbir eksiklik olmaz ; vegan anneye B12 gerekmez
#88 yaygin 2 - | çocuk iştahsızlık
S: "Çocuğum hiç yemiyor" diyen ailenin 3 yaşındaki normal büyüyen çocuğu için ne önerirsin?
+ büyüme eğrisi normalse çoğu algılanan iştahsızlıktır ; sorumluluk paylaşımı (ebeveyn ne / ne zaman, çocuk ne kadar) ; zorlama ve ödül olarak yiyecekten kaçınma ; süt / meyve suyu ile doyurmanın önlenmesi ; büyüme geriliğinde hekime
- çocuğu zorla yedirmek ; iştah açıcı şurup önerilir
#89 kirmizi 2 - | demir çocuk inek sütü
S: 18 aylık çocuk günde 1 litreden fazla inek sütü içiyor, solgun. Ne önerirsin?
+ aşırı inek sütü demir eksikliği anemisine yol açar ; günlük süt yaklaşık 500 ml ile sınırlama ; demirden zengin besinler ; anemi için hekim değerlendirmesi
- sütü artırmak anemiyi düzeltir ; günde 1,5 litre süt idealdir
#90 kilavuz 2 - | kistik fibrozis
S: Kistik fibrozisli çocukta beslenme yaklaşımı?
+ yüksek enerji gereksinimi (yaşa göre %110–200) ; yağ kısıtlaması yapılmaz, enzim replasmanı (hekim) ile ; yağda eriyen vitaminler (A, D, E, K) ; tuz desteği (terle kayıp) ; büyüme yakın izlemi
- düşük yağlı diyet ; tuz kısıtlaması
#91 yaygin 2 - | menopoz beslenme
S: Menopoz dönemindeki kadın için beslenme önerileri?
+ kilo artışı ve visseral yağlanmaya karşı enerji dengesi ; kalsiyum ve D vitamini, protein ; kardiyovasküler risk için Akdeniz tipi beslenme ; fitoöstrojen takviyelerinin kanıtı sınırlı ; fiziksel aktivite
- soya takviyesi HRT'nin yerine kesin geçer ; protein kısıtlanmalı
#92 tuzak 2 - | gece yemek kilo
S: "Akşam 6'dan sonra yemek kesinlikle kilo aldırır" bilgisi doğru mu?
+ kilo alımını belirleyen temel faktör toplam enerji dengesidir ; geç saatte yüksek enerjili atıştırma alışkanlığı sorun olabilir ; vardiyalı çalışan / diyabetli bireyde öğün planı kişisel ; uyku ve reflü açısından yatmadan hemen önce ağır yemekten kaçınma
- saat 18'den sonra yenen her şey yağa dönüşür ; akşam yemeği tamamen kaldırılmalı
#93 kirmizi 2 - | yetersiz enerji sporcu
S: Kadın sporcuda adet düzensizliği, stres kırığı ve düşük kilo. Ne düşünürsün?
+ sporda göreceli enerji yetersizliği (RED-S / kadın sporcu triadı) ; enerji alımının artırılması ; hekim değerlendirmesi (kemik sağlığı, hormon) ; yeme bozukluğu taraması
- antrenmanı artırıp kalori azaltmak ; adet düzensizliği sporcuda normaldir
#94 yaygin 2 - | yaşlı yutkunma protein
S: Diş protezi uyumsuz, et çiğneyemeyen yaşlıda protein alımı nasıl artırılır?
+ yumurta, yoğurt, peynir, kıyma, balık, kurubaklagil püreleri ; kıvam ayarlı protein kaynakları ; diş hekimine yönlendirme ; gerekirse oral nütrisyonel destek (hekimle) ; öğünlere protein dağıtımı
- protein gereksinimi yaşlıda azalır ; yalnız çorba ile beslenme yeterli
#95 kilavuz 2 sb-kp-diyabet | SB Diyabet Klinik Protokolleri (2019), Bölüm 7 Beslenme
S: SB diyabet protokolüne göre diyabetin önlenmesinde beslenme önerileri nelerdir?
+ prediyabette %5–7 kilo kaybı ; haftada en az 150 dk fiziksel aktivite ; lif, tam tahıl, sebze-meyve ; şekerli içecek ve rafine karbonhidrat sınırlaması ; yaşam tarzı müdahalesinin ilaçtan etkili olabileceği
- prediyabette beslenme önemsizdir ; şekerli içecek sınırı yok
#96 ilac 3 - | tube feeding fenitoin
S: Enteral beslenen hastada fenitoin kullanımı varsa beslenmeyle ilgili ne bilinmeli?
+ enteral formüller fenitoin emilimini azaltır ; beslenmeye ilaç öncesi / sonrası ara verilmesi (genellikle 1–2 saat) ekip protokolü ; ilaç düzeyinin hekim tarafından izlenmesi ; eczacı ile işbirliği
- etkileşim yoktur ; ilaç formülün içine karıştırılır
#97 yaygin 2 - | anksiyete stres yeme
S: Stresle aşırı yeme yaşayan hastada beslenme danışmanlığı?
+ duygusal yeme farkındalığı, tetikleyicilerin belirlenmesi ; düzenli öğün ve yeterli doygunluk ; katı yasaklardan kaçınma ; tıkınırcasına yeme bozukluğu şüphesinde psikiyatri / psikolog yönlendirmesi
- çok katı diyet ile irade geliştirilir ; psikolojik destek gereksiz
#98 tuzak 2 - | bağırsak temizliği
S: Hasta sağlık için düzenli kolon hidroterapisi / bağırsak temizliği yaptırmak istiyor. Ne dersin?
+ rutin kolon temizliğinin sağlık yararı kanıtlanmamış ; perforasyon, elektrolit bozukluğu, enfeksiyon riski ; lifli beslenme ve yeterli sıvı ; tıbbi endikasyon (kolonoskopi hazırlığı) dışında önerilmez
- kolon temizliği toksinleri atar ve kilo verdirir ; haftada bir yapılmalı
#99 kilavuz 2 - | tansiyon gebelik preeklampsi diyet
S: Preeklampsi riski olan gebede tuz kısıtlaması önerilir mi?
+ preeklampsiyi önlemek için katı tuz kısıtlaması önerilmez ; dengeli beslenme, yeterli kalsiyum (düşük alımda takviye hekim kararı) ; kilo artışının izlenmesi ; aspirin profilaksisi hekim kararı
- tuz tamamen kesilmeli ; diyetisyen aspirin başlar
#100 kirmizi 3 - | sınır dışı talep
S: Hasta, hekime danışmadan diyabet ilacını bırakıp yalnız diyetle devam etmek istiyor. Diyetisyen olarak ne yaparsın?
+ ilaç kesme kararı hekime aittir ; hastayı hekimine yönlendirme ; beslenme planının ilaçla uyumu ; olası hiperglisemi / ketoasidoz riski ; ekip içi iletişim
- ilacı bırakmasını onaylamak ; diyetisyen ilaç dozunu azaltır
`,
} satisfies BankaKaynagi
