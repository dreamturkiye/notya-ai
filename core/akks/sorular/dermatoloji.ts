import type { BankaKaynagi } from '../banka'

/** AKKS — Dermatoloji. 100 draft items (Claude, 2026-11-24). Needs clinician review before any item counts as final. */
export default {
  brans: 'dermatoloji',
  onek: 'DRM',
  metin: String.raw`
#1 yaygin 1 dernek-tdd | akne
S: 17 yaşında orta şiddette papülopüstüler aknesi olan hastada ilk basamak tedavi?
+ topikal retinoid + benzoil peroksit kombinasyonu ; gerekirse topikal antibiyotik yalnız BPO ile birlikte ; orta-şiddetli inflamatuvarda oral doksisiklin / tetrasiklin (sınırlı süre, ~3 ay) ; antibiyotik monoterapisi direnç nedeniyle önerilmez
- topikal antibiyotik tek başına uzun süreli ; ilk basamakta izotretinoin herkese
#2 ilac 3 dernek-tdd | izotretinoin
S: Kadın hastada oral izotretinoin başlarken nelere dikkat edilir?
+ teratojenite: gebelik önleme programı, başlamadan önce ve tedavi boyunca aylık gebelik testi ; tedavi sırasında ve bittikten 1 ay sonrasına kadar etkin kontrasepsiyon ; karaciğer enzimleri ve lipidler başlangıçta ve izlemde ; tetrasiklinlerle birlikte kullanılmaz (psödotümör serebri) ; ruh hali değişiklikleri sorgulanır
- gebelik testi gerekmez ; doksisiklin ile kombine edilir
#3 sgk 2 sgk-sut | SUT izotretinoin
S: Oral izotretinoin SGK'da nasıl reçete edilir?
+ dermatoloji uzmanı raporu / reçetesi gerekir ; kadın hastalarda TİTCK gebelik önleme programı belgeleri ; rapor süresi ve doz bilgisi ; güncel SUT ve TİTCK düzenlemelerinden doğrulanmalı
- her hekim raporsuz yazabilir ; gebelik önleme programı yalnız öneridir
#4 kilavuz 2 dernek-tdd-tum-yonleriyle-psoriasis | TDD Tüm Yönleriyle Psoriasis (Mayıs 2020)
S: Hafif-orta plak psoriasiste ilk basamak topikal tedavi?
+ topikal kortikosteroid ; D vitamini analoğu (kalsipotriol) ; kalsipotriol + betametazon kombinasyonu ; yüz / katlantılarda düşük potent steroid veya kalsinörin inhibitörü ; nemlendirici
- sistemik steroid ilk seçenek ; tüm hastalara biyolojik
#5 kilavuz 3 dernek-tdd-tum-yonleriyle-psoriasis | TDD Psoriasis (2020); sistemik tedavi
S: Orta-ağır psoriasiste klasik sistemik tedavi seçenekleri ve izlemi?
+ metotreksat (folik asit, karaciğer / hemogram izlemi) ; siklosporin (KB, böbrek fonksiyonu, kısa süreli) ; asitretin (teratojen, kadında uzun kontrasepsiyon) ; fototerapi (dar bant UVB) ; tedavi öncesi tarama (hepatit, TB biyolojikler için)
- sistemik kortikosteroid psoriasiste standart idame ; asitretin doğurganlık çağında rahatça verilir
#6 sgk 3 sgk-sut | SUT biyolojik ajanlar psoriasis (güncel madde doğrulanacak)
S: Psoriasiste biyolojik ajan için SGK geri ödeme koşulları genel olarak nelerdir?
+ orta-ağır hastalığın belgelenmesi (PASI / VYA ve DLQI eşikleri) ; klasik sistemik tedavilerin ve / veya fototerapinin yeterli süre başarısız olması, kontrendike ya da intolerans ; dermatoloji uzmanının yer aldığı sağlık kurulu raporu ; tedaviye yanıtın belirli aralıklarla PASI ile belgelenmesi ; ayrıntılar güncel SUT'tan doğrulanmalı
- ilk basamakta herkese biyolojik ödenir ; rapor gerekmez
#7 kirmizi 3 - | SJS/TEN
S: Lamotrijin başladıktan 2 hafta sonra ateş, mukozal erozyonlar ve yaygın atipik hedef lezyonlar, Nikolsky pozitif. Yaklaşım?
+ Stevens-Johnson / TEN ; şüpheli ilacın hemen kesilmesi ; SCORTEN ile şiddet ; yanık / yoğun bakım ünitesinde destek tedavisi ; göz, mukoza bakımı ve multidisipliner izlem
- ilaç dozu azaltılarak devam ; ayaktan izlem
#8 kirmizi 3 - | DRESS
S: Allopurinol başlandıktan 4 hafta sonra yaygın döküntü, yüz ödemi, ateş, eozinofili ve karaciğer enzim yüksekliği. Ne düşünürsün?
+ DRESS sendromu ; ilacın kesilmesi ; organ tutulumu değerlendirmesi (karaciğer, böbrek, tiroid izlemi) ; sistemik kortikosteroid ve uzun süreli azaltma ; HLA-B*58:01 ilişkisi
- viral döküntü, antihistaminik yeterli ; allopurinol dozu azaltılarak sürdürülür
#9 kirmizi 3 - | melanom ABCDE
S: Son 3 ayda büyüyen, renk değişimi gösteren, düzensiz kenarlı 8 mm pigmente lezyon. Yaklaşım?
+ melanom şüphesi (ABCDE, çirkin ördek yavrusu) ; dermoskopi ; tam kat eksizyonel biyopsi (dar sınırla) ; tüm deri muayenesi ; histopatolojiye göre geniş eksizyon ve evreleme
- lazer veya kriyoterapi ile yakılır ; shave biyopsi ile kısmen alınır
#10 kilavuz 3 - | melanom cerrahi sınır
S: Breslow kalınlığı 1,5 mm melanomda önerilen cerrahi sınır ve ek değerlendirme?
+ 1–2 cm cerrahi sınır (1,01–2 mm kalınlık için) ; sentinel lenf nodu biyopsisi önerilir (≥0,8 mm veya ülserasyon) ; evreleme ve multidisipliner konsey ; düzenli dermatolojik izlem
- 5 cm sınır standarttır ; sentinel lenf nodu biyopsisi gerekmez
#11 yaygin 2 - | bazal hücreli karsinom
S: Burun kanadında 6 mm inci renkli, telenjiektazili nodül. Tedavi?
+ bazal hücreli karsinom ; biyopsi ile doğrulama ; yüksek riskli bölgede (H bölgesi) Mohs mikrografik cerrahi tercih ; standart eksizyon alternatif ; yüzeyel tipte topikal tedaviler seçilmiş vakada
- yüzde rutin kriyoterapi ; metastaz sık, kemoterapi gerekir
#12 kirmizi 2 - | SCC
S: Yaşlı hastada güneş gören bölgede hızla büyüyen, ülsere, sert nodül. Yaklaşım?
+ skuamöz hücreli karsinom (veya keratoakantom) ; biyopsi ; cerrahi eksizyon uygun sınırla ; yüksek risk özellikleri (dudak, kulak, perinöral) ; lenf nodu muayenesi ; immünsüpresif hastada daha agresif
- aktinik keratozdur, nemlendirici ; biyopsi gereksiz
#13 yaygin 1 - | aktinik keratoz
S: Kafa derisinde çok sayıda aktinik keratozu olan hastada tedavi seçenekleri?
+ lezyon odaklı: kriyoterapi ; alan tedavisi: topikal 5-FU, imikimod, fotodinamik tedavi ; güneşten korunma ; kalınlaşmış / şüpheli lezyonda biyopsi (SCC)
- tedavi gerekmez, asla SCC'ye dönmez ; sistemik kemoterapi
#14 yaygin 1 - | atopik dermatit erişkin
S: Orta şiddetli atopik dermatiti olan erişkinde topikal tedavi?
+ düzenli emoliyent ; alevlenmede orta-güçlü topikal kortikosteroid ; proaktif tedavi (haftada 2 gün) ; yüz / katlantılarda topikal kalsinörin inhibitörü ; enfeksiyon bulgularında tedavi
- topikal steroid hiç kullanılmamalı ; sistemik steroid idame
#15 kilavuz 3 - | atopik dermatit sistemik
S: Topikal tedaviye yanıtsız ağır atopik dermatitte sistemik seçenekler?
+ fototerapi (dar bant UVB) ; siklosporin (kısa-orta süreli), metotreksat, azatioprin ; biyolojikler (dupilumab, tralokinumab) ; JAK inhibitörleri (güvenlik izlemi ile) ; sistemik kortikosteroid uzun süreli kullanılmaz (rebound)
- uzun süreli oral steroid standart ; JAK inhibitörlerinde izlem gerekmez
#16 yaygin 1 - | ürtiker akut
S: 2 gündür yaygın kaşıntılı kabarıklıkları olan, sistemik bulgusu olmayan hastada tedavi?
+ akut ürtiker ; ikinci kuşak H1 antihistaminik ; tetikleyici sorgulama (enfeksiyon, ilaç, besin) ; anjiyoödem / anafilaksi bulguları açısından bilgilendirme ; rutin kapsamlı laboratuvar gerekmez
- ilk seçenek birinci kuşak sedatif antihistaminik ; tüm hastalara alerji paneli
#17 kilavuz 2 - | kronik ürtiker
S: 6 haftadan uzun süren kronik spontan ürtikerde basamak tedavi?
+ ikinci kuşak antihistaminik standart doz ; yanıtsızlıkta dozun 4 katına kadar artırılması ; yanıtsızlıkta omalizumab ; dirençli vakada siklosporin ; NSAİİ gibi alevlendiricilerden kaçınma
- sürekli sistemik steroid ; kapsamlı tarama her hastaya
#18 yaygin 2 - | rozasea
S: Yüzde eritem, papülopüstüller ve flushing olan 45 yaşında kadında tedavi?
+ rozasea ; tetikleyicilerden kaçınma, güneşten korunma ; papülopüstüler formda topikal ivermektin, metronidazol, azelaik asit ; orta-ağırda düşük doz doksisiklin ; eritem için topikal brimonidin / oksimetazolin ; topikal steroidden kaçınma
- topikal steroid ilk seçenek ; akne gibi benzoil peroksit yüksek konsantrasyon
#19 tuzak 2 - | steroid yüz
S: Yüzdeki kızarıklık için aylardır güçlü topikal steroid kullanan hastada lezyonlar steroid kesince alevleniyor. Ne düşünürsün?
+ steroid kaynaklı rozasea / perioral dermatit (topikal steroid bağımlılığı) ; steroidin kesilmesi (gerekirse azaltarak) ; topikal metronidazol / kalsinörin inhibitörü, oral tetrasiklin ; hastanın bilgilendirilmesi
- steroidin potensini artır ; steroid kesilmemeli
#20 yaygin 2 - | tinea
S: Kasıkta kenarı aktif, ortası açılan halkasal kaşıntılı lezyon. Tanı ve tedavi?
+ tinea kruris ; KOH ile doğrulama ; topikal azol / terbinafin 2–4 hafta ; steroid-antifungal kombinasyonlarından kaçınma (tinea inkognito) ; ayak (tinea pedis) muayenesi
- güçlü steroidli krem ; oral flukonazol tek doz yeterli
#21 ilac 2 - | onikomikoz
S: Ayak tırnağında doğrulanmış dermatofit onikomikozunda tedavi?
+ tanının KOH / kültür ile doğrulanması ; oral terbinafin 12 hafta (ayak) ilk seçenek ; itrakonazol pulse alternatif ; karaciğer fonksiyonu ve ilaç etkileşimleri ; hafif / distal tutulumda topikal (amorolfin, siklopiroks)
- tanı doğrulamadan uzun süreli oral tedavi ; flukonazol 1 hafta yeterli
#22 yaygin 2 - | skabiyez
S: Ailede birden fazla kişide gece artan kaşıntı, parmak araları ve el bileğinde papüller. Tedavi?
+ skabiyez ; permetrin %5 krem, 1 hafta arayla 2 kez, boyundan aşağı ; tüm ev halkı ve temaslıların aynı anda tedavisi ; çamaşırların 60 °C'de yıkanması ; dirençli / kabuklu skabiyezde oral ivermektin
- yalnız semptomatik kişiler tedavi edilir ; topikal steroid ile kaşıntı tedavisi yeterli
#23 kirmizi 2 - | herpes zoster oftalmikus
S: Burun ucunda veziküller olan alın bölgesi zonası (Hutchinson belirtisi). Yaklaşım?
+ herpes zoster oftalmikus, göz tutulumu riski ; 72 saat içinde oral antiviral (valasiklovir / asiklovir) ; acil göz konsültasyonu ; ağrı yönetimi ; immünsüpresyonda IV tedavi
- yalnız topikal asiklovir ; göz muayenesi gereksiz
#24 ilac 2 - | zona tedavisi
S: Gövdede 2 gündür zona olan 65 yaşında hastada tedavi?
+ 72 saat içinde oral antiviral (valasiklovir 1 g x3, 7 gün) ; analjezi ; postherpetik nevralji riski yüksek yaşta ; böbrek fonksiyonuna göre doz ; zona aşısı korunmada (iyileşme sonrası)
- antiviral 1 hafta sonra başlansa da aynı etkili ; steroid tek tedavi
#25 yaygin 2 - | seboreik dermatit
S: Saçlı deri ve nazolabial olukta sarımsı yağlı skuamlı eritem. Tedavi?
+ seboreik dermatit ; ketokonazol şampuan / krem ; alevlenmede kısa süreli düşük potent steroid veya kalsinörin inhibitörü ; kronik-tekrarlayan seyir ; HIV / Parkinson ilişkisi ağır vakada
- güçlü steroid uzun süreli ; kalıcı tedavi vardır
#26 yaygin 2 - | vitiligo
S: El ve yüzde yeni gelişen vitiligo lezyonlarında tedavi seçenekleri?
+ topikal kortikosteroid / kalsinörin inhibitörü (yüz) ; topikal ruksolitinib (onaylı olduğu yerde) ; dar bant UVB fototerapi yaygın / aktif hastalıkta ; tiroid otoimmünitesi taraması ; güneşten korunma ve psikososyal destek
- vitiligo bulaşıcıdır ; tedavisi yoktur, hiçbir şey önerilmez
#27 yaygin 2 - | alopesi areata
S: Saçlı deride 2 adet yuvarlak sınırlı saçsız alan. Tedavi?
+ alopesi areata ; sınırlı hastalıkta intralezyonel steroid ; topikal güçlü steroid ; geniş / ağır hastalıkta JAK inhibitörleri (baricitinib, ritlesitinib) ; tiroid ve otoimmün eşlik ; kendiliğinden düzelme sık
- tinea kapitis, oral antifungal ; kalıcı saç kaybıdır
#28 yaygin 2 - | androgenetik alopesi
S: Erkek tipi saç dökülmesi olan 28 yaşında erkekte tedavi?
+ topikal minoksidil ; oral finasterid 1 mg (yan etki ve teratojenite — kadın partner temas) ; oral düşük doz minoksidil seçilmiş hastada ; saç ekimi seçenek ; tedavinin sürekliliği gerekli
- finasterid kadınlara rutin verilir ; tedavi kesilince kazanım sürer
#29 kirmizi 2 - | skatrisyel alopesi
S: Saçlı deride eritem, skar ve folikül ağızlarının kaybı ile giden saç dökülmesi. Yaklaşım?
+ skatrisyel alopesi (liken planopilaris, DLE, folikülitis dekalvans) ; trikoskopi ve biyopsi ; erken tedavi kalıcı kaybı sınırlar ; nedenine göre sistemik / topikal anti-inflamatuvar
- androgenetik alopesi, minoksidil ; biyopsi gereksiz
#30 kirmizi 3 - | pemfigus
S: Ağızda yaygın erozyonlar ve deride gevşek büller, Nikolsky pozitif. Ne düşünürsün?
+ pemfigus vulgaris ; biyopsi (histopatoloji + DİF) ve serolojik antikorlar (desmoglein) ; sistemik kortikosteroid + rituksimab / steroid koruyucu ajan ; enfeksiyon ve sıvı dengesi
- herpes, antiviral yeterli ; tanı için biyopsi gereksiz
#31 yaygin 2 - | büllöz pemfigoid
S: 80 yaşında hastada kaşıntılı gergin büller. Tanı ve tedavi?
+ büllöz pemfigoid ; biyopsi + DİF, BP180 / BP230 ; güçlü topikal steroid (klobetazol) yaygın hastalıkta da etkin ; doksisiklin, sistemik steroid seçenekleri ; DPP-4 inhibitörü ilişkisi sorgulanır
- ilk seçenek yüksek doz uzun süreli sistemik steroid tüm hastalara ; pemfigus ile aynı prognoz
#32 kirmizi 3 - | nekrotizan fasiit
S: Bacakta hızla yayılan, muayene bulgusuyla orantısız ağrılı selülit, krepitasyon ve sistemik toksisite. Ne yaparsın?
+ nekrotizan yumuşak doku enfeksiyonu ; acil cerrahi debridman ; geniş spektrumlu IV antibiyotik (klindamisin dahil) ; görüntüleme cerrahiyi geciktirmemeli ; yoğun bakım
- oral antibiyotikle evde izlem ; MR sonucu beklenerek cerrahi ertelenir
#33 yaygin 2 - | selülit
S: Alt ekstremitede tek taraflı sıcak, kızarık, ağrılı alan; sistemik bulgu yok. Tedavi?
+ selülit (genellikle streptokok) ; oral beta-laktam (sefaleksin / amoksisilin-klavulanat) ; ekstremite elevasyonu ; predispozan durumlar (tinea pedis, ödem) tedavisi ; abse / pürülan varsa MRSA kapsamı değerlendirilir
- bilateral bacak kızarıklığı tipik selülittir ; ilk seçenek kinolon
#34 yaygin 1 - | impetigo
S: Çocukta ağız çevresinde bal renkli kabuklu lezyonlar. Tedavi?
+ impetigo ; sınırlı lezyonda topikal mupirosin / fusidik asit ; yaygın lezyonda oral antistafilokokal antibiyotik ; hijyen, okuldan uzak kalma ; post-streptokokal GN farkındalığı
- topikal steroid ; tüm vakalara IV antibiyotik
#35 yaygin 2 - | siğil
S: El parmaklarında yaygın siğiller. Tedavi seçenekleri?
+ salisilik asit topikal ; kriyoterapi ; çoğu kendiliğinden geriler ; dirençli vakada immünoterapi / lazer ; immünsüpresif hastada dikkat
- antibiyotik ; tek seferde cerrahi eksizyon ilk seçenek
#36 yaygin 2 - | molluskum
S: 5 yaşında çocukta gövdede göbekli papüller (molluskum kontagiyozum). Yaklaşım?
+ çoğunlukla kendiliğinden düzelir (aylar-yıllar) ; ailenin bilgilendirilmesi ; isteğe göre küretaj, kriyoterapi, kantaridin, KOH ; atopik dermatit eşliğinde egzama tedavisi
- antibiyotik ; mutlaka cerrahi eksizyon
#37 kirmizi 2 - | sifiliz
S: Avuç içi ve ayak tabanını tutan bakır renkli makülopapüler döküntü ve ağız içi plaklar. Ne düşünürsün?
+ sekonder sifiliz ; VDRL / RPR ve treponemal test ; benzatin penisilin G IM ; HIV ve diğer CYBE taraması ; partner bildirimi / tedavisi, bildirim zorunlu
- ilaç erüpsiyonu, antihistaminik ; doksisiklin gebelikte ilk seçenek
#38 yaygin 2 - | genital siğil
S: Anogenital bölgede kondiloma akuminata. Tedavi?
+ HPV ; podofilotoksin, imikimod (hasta uygulamalı) ; kriyoterapi, elektrokoter, cerrahi ; gebelikte podofilin / podofilotoksin kontrendike ; HPV aşısı korunmada, CYBE taraması
- gebelikte podofilin güvenli ; tedaviyle virüs tamamen yok edilir
#39 kirmizi 2 - | eritema nodozum
S: Bacak ön yüzlerinde ağrılı, kırmızı subkutan nodüller. Ne araştırırsın?
+ eritema nodozum ; streptokok enfeksiyonu, sarkoidoz, tüberküloz, inflamatuvar bağırsak hastalığı, ilaçlar (OKS), gebelik, Behçet ; ASO, akciğer grafisi, PPD / IGRA ; altta yatan nedenin tedavisi, NSAİİ, istirahat
- selülit, antibiyotik ; neden araştırılmaz
#40 kilavuz 2 - | Behçet
S: Tekrarlayan oral aft, genital ülser ve papülopüstüler lezyonları olan genç erkekte tanı ve değerlendirme?
+ Behçet hastalığı (Türkiye'de sık) ; uluslararası kriterler, paterji testi ; göz (üveit), vasküler, nörolojik tutulum taraması ; mukokutanöz tedavi: kolşisin, topikal steroid, apremilast ; organ tutulumunda immünsüpresif, multidisipliner
- göz muayenesi gereksiz ; yalnız topikal tedavi tüm hastalarda yeterli
#41 ilac 3 - | metotreksat izlem
S: Psoriasis için metotreksat kullanan hastada güvenlik izlemi?
+ başlangıçta hemogram, karaciğer ve böbrek fonksiyonları, hepatit serolojisi ; folik asit desteği ; haftalık doz (günlük değil!) ; ilk aylarda sık, sonra 2–3 ayda bir laboratuvar ; trimetoprim-sülfametoksazol, NSAİİ etkileşimi ; gebelikte kontrendike, kontrasepsiyon
- metotreksat her gün alınır ; trimetoprim-sülfametoksazol ile güvenle kombine edilir
#42 ilac 3 - | biyolojik tarama
S: Biyolojik ajan başlamadan önce hangi taramalar yapılır?
+ latent tüberküloz (PPD / IGRA ve akciğer grafisi) ; hepatit B (HBsAg, anti-HBc), hepatit C, HIV ; canlı aşılardan kaçınma, aşıların güncellenmesi ; malignite ve aktif enfeksiyon değerlendirmesi ; latent TB'de profilaksi
- tarama gerekmez ; tedavi sırasında canlı aşı yapılabilir
#43 tuzak 2 - | sistemik steroid psoriasis
S: Psoriasis alevlenmesinde sistemik kortikosteroid vermek uygun mu?
+ sistemik steroid psoriasiste genellikle önerilmez ; kesildiğinde rebound ve püstüler / eritrodermik psoriasis riski ; uygun sistemik / biyolojik tedavi tercih edilir
- sistemik steroid psoriasis tedavisinin temelidir ; depo steroid enjeksiyonu önerilir
#44 kirmizi 3 - | eritrodermi
S: Vücudun %90'ından fazlasını tutan eritem ve deskuamasyon, titreme. Yaklaşım?
+ eritrodermi dermatolojik acil ; yatış, sıvı-elektrolit, ısı kaybı, enfeksiyon ; altta yatan neden: psoriasis, ilaç, atopik dermatit, kutanöz lenfoma ; şüpheli ilaçların kesilmesi, biyopsi
- ayaktan nemlendirici ; sistemik steroid tüm nedenlerde ilk seçenek
#45 yaygin 2 - | kontakt dermatit
S: Ellerde iş ilişkili tekrarlayan egzama. Değerlendirme?
+ irritan / alerjik kontakt dermatit ayrımı ; yama testi ; koruyucu eldiven, irritanlardan kaçınma, emoliyent ; topikal steroid ; meslek hastalığı değerlendirmesi
- yama testi gereksiz ; sistemik antibiyotik
#46 yaygin 2 - | hiperhidroz
S: Primer aksiller hiperhidrozda tedavi basamakları?
+ topikal alüminyum klorür ; topikal glikopironyum (mümkünse) ; botulinum toksini enjeksiyonu ; iyontoforez (palmoplantar) ; oral antikolinerjikler, mikrodalga / cerrahi seçilmiş
- ilk seçenek sempatektomi ; tedavisi yoktur
#47 yaygin 1 - | melazma
S: Gebelik sonrası yüzde simetrik kahverengi lekeler. Tedavi?
+ melazma ; geniş spektrumlu güneş koruyucu (görünür ışık dahil, demir oksitli) ; hidrokinon, üçlü kombinasyon (kısa süreli), azelaik asit, traneksamik asit ; tetikleyiciler (OKS) ; tekrarlama sık
- güçlü steroid uzun süreli ; lazer ilk seçenek ve kalıcı çözüm
#48 tuzak 3 - | hidrokinon
S: Melazmada hidrokinon kremi sürekli ve süresiz kullanılabilir mi?
+ hidrokinon aralıklı / sınırlı sürelerle (ör. 3–4 ay) kullanılmalı ; uzun süreli kullanımda eksojen okronozis riski ; idame için alternatifler (azelaik asit, retinoid, traneksamik asit) ; güneşten korunma
- hidrokinon yıllarca kesintisiz kullanılır ; yan etkisi yoktur
#49 kirmizi 2 - | nevüs değişimi gebelik
S: Gebe kadında konjenital nevüste belirgin değişiklik. Ne yaparsın?
+ gebelik nevüs değerlendirmesini ertelemek için neden değildir ; dermoskopi ; şüpheli lezyonda lokal anestezi ile eksizyon güvenlidir ; melanom gebelikte de görülebilir
- doğuma kadar beklenir ; gebelikte biyopsi yasak
#50 kilavuz 2 - | fototerapi
S: Dar bant UVB fototerapi hangi durumlarda kullanılır ve riskleri nelerdir?
+ psoriasis, atopik dermatit, vitiligo, mikozis fungoides vb. ; haftada 2–3 seans ; riskler: yanık, fotoyaşlanma, uzun dönemde deri kanseri riski (PUVA'ya göre düşük) ; fotosensitizan ilaçların sorgulanması
- fototerapinin hiçbir riski yoktur ; solaryum aynı etkiyi sağlar
#51 yaygin 2 - | liken planus
S: El bileklerinde kaşıntılı mor poligonal papüller ve ağızda beyaz retiküler çizgiler. Tedavi?
+ liken planus ; topikal güçlü steroid ; oral tutulumda topikal steroid / kalsinörin inhibitörü ; hepatit C ilişkisi sorgulanabilir ; erozif oral LP'de malignite izlemi
- antifungal tedavi ; ağız içi lezyonlar her zaman zararsız
#52 yaygin 2 - | pitriyazis rozea
S: Gövdede öncü madalyon plak ve ardından çam ağacı dağılımlı ovoid lezyonlar. Yaklaşım?
+ pitriyazis rozea ; kendiliğinden 6–8 haftada düzelir ; semptomatik kaşıntı tedavisi ; sekonder sifiliz ayırıcı tanısı (avuç içi, risk) ; gebelikte erken dönem dikkat
- tinea korporis, oral antifungal ; mutlaka sistemik steroid
#53 yaygin 2 - | pitriyazis versikolor
S: Gövdede hipo/hiperpigmente ince skuamlı maküller. Tedavi?
+ pitriyazis versikolor (Malassezia) ; topikal ketokonazol / selenyum sülfür ; yaygın / tekrarlayanda oral itrakonazol / flukonazol ; renk düzelmesi aylar sürebilir ; oral terbinafin etkisiz
- oral terbinafin ilk seçenek ; vitiligo, fototerapi
#54 kirmizi 2 - | anjiyoödem
S: Dudaklarda ani şişlik ve ürtiker, nefes darlığı yok. Hangi durumda acil?
+ havayolu tutulumu (stridor, ses değişikliği, dil şişliği) ; anafilaksi bulguları ; ACE inhibitörü / herediter anjiyoödem ayrımı (ürtikersiz) ; histaminerjik formda antihistaminik, gerekirse adrenalin
- tüm anjiyoödemler yalnız antihistaminik ile geçer ; ACE inhibitörüne devam
#55 yaygin 2 - | kaşıntı yaşlı
S: Deri lezyonu olmayan yaygın kaşıntısı olan yaşlı hastada değerlendirme?
+ kserozis (kuru cilt) sık neden, emoliyent ; sistemik nedenler: böbrek, karaciğer (kolestaz), tiroid, demir eksikliği, hematolojik (polisitemi, lenfoma) ; ilaç kaynaklı kaşıntı ; tetkik: hemogram, ferritin, böbrek-karaciğer, TSH
- yaşlılıkta kaşıntı normaldir, tetkik gereksiz ; sistemik steroid ilk seçenek
#56 ilac 2 - | antihistaminik gebelik
S: Ürtikeri olan gebede tercih edilecek antihistaminik?
+ loratadin ve setirizin gebelikte en çok veri olan ikinci kuşaklar ; en düşük etkili doz ; birinci kuşaklar (sedasyon) gerekirse ; kronik ürtikerde risk-yarar
- gebelikte antihistaminik asla kullanılmaz ; sistemik steroid ilk seçenek
#57 ilac 3 - | doksisiklin
S: Akne için doksisiklin kullanan hastaya ne önerirsin?
+ güneşe duyarlılık (fotosensitivite), güneş koruyucu ; özofagus irritasyonu: bol su ile, yatmadan önce değil ; 8 yaş altı ve gebelikte kontrendike ; izotretinoin ile birlikte verilmez ; süt / demir / antasit ile birlikte emilim azalır
- yatmadan hemen önce suyla almadan ; gebelikte güvenli
#58 kirmizi 2 - | kutanöz lenfoma
S: Yıllardır egzama tanısıyla izlenen, tedaviye dirençli, güneş görmeyen bölgelerde yama ve plaklar. Ne düşünürsün?
+ mikozis fungoides ; tekrarlayan biyopsiler (immünohistokimya, klonalite) ; evreleme ; deriye yönelik tedaviler (steroid, fototerapi) erken evrede ; hematoloji / onkoloji ile
- egzamadır, steroid potensini artır ; biyopsi gereksiz
#59 yaygin 2 - | hidradenitis
S: Aksilla ve kasıkta tekrarlayan ağrılı nodüller, sinüs traktları ve skarlar. Tedavi?
+ hidradenitis süpürativa ; Hurley evrelemesi ; kilo verme, sigara bırakma ; topikal klindamisin, oral tetrasiklin, klindamisin + rifampisin ; orta-ağırda adalimumab / sekukinumab ; cerrahi
- basit fronkül, tek seferlik drenaj yeterli ; tedavisi yoktur
#60 sgk 2 sgk-sut | SUT; dermatoloji biyolojik HS
S: Hidradenitis süpürativada adalimumab SGK ödemesi genel olarak hangi koşulla yapılır?
+ orta-ağır hastalığın belgelenmesi ; konvansiyonel tedavilere (antibiyotik vb.) yanıtsızlık ; dermatoloji uzmanının yer aldığı sağlık kurulu raporu ; yanıt değerlendirmesiyle devam ; güncel SUT'tan doğrulanmalı
- ilk basamakta ödenir ; rapor gerekmez
#61 tuzak 2 - | antibiyotik akne süresi
S: Akne için oral antibiyotiği 1 yıl kesintisiz kullanmak uygun mu?
+ oral antibiyotik genellikle en fazla 3–4 ay ; direnç gelişimi ; her zaman topikal retinoid / BPO ile birlikte ; idamede topikal retinoid ; yanıtsızlıkta izotretinoin değerlendirmesi
- 1 yıl ve üzeri monoterapi standart ; antibiyotik tek başına idame
#62 yaygin 2 - | fungal intertrigo / candida
S: Diyabetik obez hastada meme altında kırmızı, satellit püstüllü intertrigo. Tedavi?
+ kandidal intertrigo ; topikal azol ; bölgenin kuru tutulması ; diyabet kontrolü ; tekrarlayanda sistemik flukonazol
- güçlü steroid krem ; antibiyotik
#63 kirmizi 2 - | purpura / vaskülit
S: Bacaklarda ele gelen purpura, eklem ağrısı ve karın ağrısı olan çocuk. Değerlendirme?
+ IgA vasküliti (Henoch-Schönlein) ; idrar tahlili (hematüri, proteinüri) ve KB, böbrek izlemi ; karın ağrısında invajinasyon riski ; trombositopeni dışlanmalı (trombosit normal)
- trombositopeni, trombosit transfüzyonu ; idrar izlemi gereksiz
#64 yaygin 1 - | güneş koruyucu
S: Güneş koruyucu kullanımı konusunda hastaya ne önerirsin?
+ geniş spektrumlu (UVA + UVB), en az SPF 30 ; çıkıştan 15–30 dakika önce, yeterli miktarda ; 2 saatte bir ve terleme / yüzme sonrası yenileme ; gölge, kıyafet, şapka ; 6 ay altı bebekte güneşten fiziksel korunma
- SPF 50 bütün gün tek uygulama yeterli ; bulutlu havada gerekmez
#65 kilavuz 2 - | nevüs izlemi
S: Çok sayıda atipik nevüsü ve ailede melanom öyküsü olan hastada izlem?
+ yüksek risk ; düzenli tüm vücut deri muayenesi ve dijital dermoskopi ; kendi kendine deri muayenesi eğitimi ; güneşten korunma ; şüpheli lezyonların eksizyonu (tüm nevüslerin profilaktik çıkarımı değil)
- tüm nevüsler profilaktik olarak çıkarılmalı ; izlem gereksiz
#66 yaygin 2 - | seborreik keratoz
S: Yaşlı hastada gövdede yapışık görünümlü, verrüköz kahverengi lezyonlar. Yaklaşım?
+ seboreik keratoz, benign ; dermoskopi ile tanı ; tedavi gerekmez, istenirse kriyoterapi / küretaj ; ani çok sayıda çıkışı (Leser-Trélat) ve tanıdan şüphede biyopsi
- melanomdur, geniş eksizyon ; premalign lezyondur
#67 ilac 2 - | topikal steroid potens
S: Topikal kortikosteroid seçiminde vücut bölgesine göre nelere dikkat edilir?
+ yüz, göz kapağı, genital ve katlantılarda düşük potent ; avuç içi / ayak tabanında güçlü potent ; parmak ucu ünitesi ile miktar ; uzun süreli güçlü steroid yan etkileri (atrofi, stria, telenjiektazi) ; çocukta daha dikkatli
- yüzde klobetazol uzun süre ; potens bölgeden bağımsız
#68 kirmizi 3 - | stafilokokal haşlanmış deri
S: 3 yaşında çocukta ateş, yaygın hassas eritem ve yüzeyel soyulma, mukoza tutulumu yok. Ne düşünürsün?
+ stafilokokal haşlanmış deri sendromu ; yatış, IV antistafilokokal antibiyotik ; sıvı ve ağrı yönetimi ; TEN'den ayırım (mukoza tutulumu yok, yüzeyel ayrışma)
- TEN, ilacı kes ve steroid ; ayaktan topikal tedavi
#69 yaygin 2 - | pediküloz
S: Okul çocuğunda baş biti. Tedavi?
+ permetrin %1 veya dimetikon ; 7–10 gün sonra tekrar uygulama ; ince dişli tarakla sirke / bit taraması ; aile içi tarama ; eşyaların yıkanması
- saçların kazınması zorunlu ; lindan ilk seçenek
#70 yaygin 2 - | keloid
S: Kulak memesinde piercing sonrası gelişen keloid. Tedavi?
+ intralezyonel kortikosteroid ; cerrahi eksizyon tek başına yüksek nüks, adjuvan (steroid, radyoterapi, basınç) ile ; silikon jel ; kriyoterapi
- tek başına eksizyon kalıcı çözümdür ; tedavisi yoktur
#71 kirmizi 2 - | DLE / SLE
S: Yüzde skar bırakan diskoid plaklar. Değerlendirme?
+ diskoid lupus ; biyopsi ; sistemik lupus açısından tarama (ANA, hemogram, idrar) ; güneşten korunma, topikal / intralezyonel steroid, hidroksiklorokin ; sigara bırakma
- sistemik değerlendirme gereksiz ; güneş tedavi edicidir
#72 ilac 3 - | hidroksiklorokin
S: Hidroksiklorokin kullanan hastada göz izlemi nasıl olmalı?
+ başlangıçta göz muayenesi ; 5 yıl sonra yıllık retinopati taraması (risk faktörlerinde daha erken) ; doz ≤5 mg/kg gerçek vücut ağırlığı ; böbrek yetmezliği ve tamoksifen risk artırır
- göz izlemi gerekmez ; doz sınırı yok
#73 tuzak 2 - | antibiyotikli steroidli krem
S: Sınırları belirsiz kızarıklık için rutin üçlü (steroid + antifungal + antibiyotik) krem önerilir mi?
+ tanı konmadan kombinasyon kremler önerilmez ; tinea inkognito, kontakt sensitizasyon, steroid yan etkileri ; tanıya göre tek etkin madde ; gerekirse KOH
- üçlü krem her döküntüde güvenli seçenek ; tanıya gerek yok
#74 kirmizi 2 - | ilaç erüpsiyonu sabit
S: Aynı ilaç alındıkça aynı yerde tekrarlayan yuvarlak koyu mor plak. Tanı?
+ sabit ilaç erüpsiyonu ; sık nedenler: NSAİİ, TMP-SMX, tetrasiklin, parasetamol ; ilacın belirlenip kaçınılması ; büllöz / yaygın formda SJS ayırıcı tanısı
- mantar enfeksiyonu ; ilaç sorgulamaya gerek yok
#75 yaygin 2 - | dermatit çocuk bezi
S: Bebeğin bez bölgesinde katlantıları koruyan eritem. Tedavi?
+ irritan bez dermatiti ; sık bez değişimi, havalandırma ; çinko oksitli bariyer krem ; katlantı tutulumu / satellit lezyonda kandida, topikal azol ; güçlü steroidden kaçınma
- güçlü steroid krem ; antibiyotik
#76 kilavuz 3 dernek-tdd | psoriatik artrit
S: Psoriasis hastasında hangi bulgular psoriatik artrit açısından romatolojiye sevk gerektirir?
+ eklem ağrı / şişliği, sabah tutukluğu ; daktilit, entezit ; tırnak tutulumu artrit riskini artırır ; PEST gibi tarama anketleri ; erken DMARD / biyolojik ile eklem hasarının önlenmesi
- psoriasiste eklem değerlendirmesi gereksiz ; tırnak tutulumu önemsizdir
#77 yaygin 2 - | tinea kapitis
S: Çocukta saçlı deride skuamlı, kırık kıllı alopesik plak. Tedavi?
+ tinea kapitis ; topikal tedavi tek başına yetersiz ; oral griseofulvin veya terbinafin ; kerion da sistemik antifungalle (antibiyotik değil) ; aile / hayvan taraması
- yalnız topikal krem yeterli ; kerion drene edilir
#78 ilac 2 - | terbinafin etkileşim
S: Oral terbinafin başlarken dikkat edilecekler?
+ karaciğer hastalığında kontrendike / dikkat ; başlangıçta karaciğer enzimleri ; CYP2D6 inhibisyonu (bazı antidepresanlar, beta blokerler) ; tat kaybı, nadir ciddi deri reaksiyonları
- karaciğer hastalığı önemli değil ; etkileşim yoktur
#79 kirmizi 2 - | kutanöz leishmaniasis
S: Güneydoğu Anadolu'dan gelen hastada aylardır iyileşmeyen ağrısız ülsere nodül. Ne düşünürsün?
+ kutanöz leishmaniasis (şark çıbanı) Türkiye'de endemik bölgeler ; yayma / biyopsi ile amastigot ; intralezyonel antimon, kriyoterapi ; sistemik tedavi seçilmiş vakada ; bildirimi zorunlu hastalık
- bakteriyel enfeksiyon, uzun süreli antibiyotik ; bildirim gerekmez
#80 yaygin 2 - | hirsutizm
S: Hirsutizmi olan kadında hangi durumlar ileri inceleme gerektirir?
+ hızlı ilerleme, virilizasyon bulguları (klitoromegali, ses kalınlaşması) ; çok yüksek testosteron / DHEAS (tümör) ; Cushing bulguları ; PKOS sık neden ; tedavi: COC, antiandrojen, lazer epilasyon
- tüm hirsutizm kozmetiktir, tetkik gereksiz ; spironolakton gebelikte güvenli
#81 tuzak 3 - | gebelikte retinoid
S: Gebe kadında topikal retinoid (tretinoin) ile akne tedavisi uygun mu?
+ gebelikte topikal retinoidlerden kaçınılır ; oral izotretinoin kesin kontrendike ; azelaik asit, topikal eritromisin / klindamisin + BPO seçenekleri ; gerekirse oral eritromisin / azitromisin
- topikal tretinoin gebelikte tercih edilir ; tetrasiklin gebelikte verilir
#82 kirmizi 3 - | meningokoksemi
S: Ateşli genç erişkinde hızla yayılan, basmakla solmayan peteşi ve purpura. Ne yaparsın?
+ meningokoksemi acil ; beklemeden IV seftriakson ; sepsis resüsitasyonu ; temaslılara kemoprofilaksi ; bildirim
- viral döküntü, antihistaminik ; antibiyotik biyopsi sonucuna göre
#83 yaygin 2 - | ekzema dishidrotik
S: Avuç içi ve parmak yanlarında kaşıntılı derin veziküller. Tedavi?
+ dishidrotik egzama ; güçlü topikal steroid ; irritan / alerjen kaçınma, yama testi ; tinea pedis (id reaksiyonu) dışlanması ; dirençli vakalarda fototerapi / sistemik
- antibiyotik ; antifungal tek tedavi
#84 ilac 3 - | JAK inhibitörü uyarısı
S: Dermatolojide oral JAK inhibitörü başlarken hangi güvenlik konuları değerlendirilir?
+ 65 yaş üstü, sigara, kardiyovasküler risk ve malignite öyküsünde dikkat (MACE, malignite, VTE uyarıları) ; enfeksiyon taraması (TB, hepatit) ; lipid ve hemogram izlemi ; zona riski, aşılama ; gebelikte kontrendike
- güvenlik taraması gerekmez ; ilk basamak tüm atopik hastalara
#85 sgk 2 sgk-sut | SUT; dupilumab
S: Atopik dermatitte dupilumab SGK geri ödemesinde genel çerçeve nedir?
+ orta-ağır hastalığın skorlarla belgelenmesi (EASI vb.) ; topikal ve sistemik konvansiyonel tedavi (ör. siklosporin) yanıtsızlığı / kontrendikasyonu ; uzman hekimlerin yer aldığı sağlık kurulu raporu ; yanıt değerlendirmesi ile devam ; ayrıntılar güncel SUT'tan doğrulanmalı
- tüm atopik dermatitli hastalara raporsuz ödenir ; ilk basamak tedavidir
#86 yaygin 1 - | kserozis bebek
S: Kuru cildi olan bebeklerde banyo ve nemlendirme önerisi?
+ kısa ılık banyo, sabunsuz / pH dengeli temizleyici ; banyo sonrası 3 dakika içinde emoliyent ; parfümsüz ürünler ; atopik dermatit bulgularının izlemi
- günde birkaç kez uzun sıcak banyo ; parfümlü losyon
#87 kirmizi 2 - | ulkus bacak
S: Bacakta iyileşmeyen ülseri olan hastada ayırıcı tanı ve değerlendirme?
+ venöz, arteryel, nöropatik (diyabetik) ülser ayrımı ; ABI ölçümü (kompresyondan önce) ; uzun süreli iyileşmeyen ülserde biyopsi (malignite / Marjolin) ; pyoderma gangrenozum ayırıcı tanısı ; kompresyon venöz ülserde temel
- arteryel ülsere kompresyon ; biyopsi asla gerekmez
#88 kirmizi 3 - | pyoderma gangrenozum
S: Küçük travma sonrası hızla büyüyen, mor kenarlı, ağrılı ülser; ülseratif koliti var. Yaklaşım?
+ pyoderma gangrenozum ; debridmandan kaçınılmalı (paterji) ; sistemik / topikal steroid, siklosporin, biyolojikler ; altta yatan IBH tedavisi
- cerrahi debridman ; yalnız antibiyotik
#89 yaygin 2 - | kronik el egzaması meslek
S: Kuaförde kronik el egzaması. Hangi alerjenler sık ve ne önerirsin?
+ parafenilendiamin, persülfatlar, tiyoglikolatlar, nikel ; yama testi ; nitril eldiven ; irritan azaltma ; meslek değişikliği / meslek hastalığı değerlendirmesi
- lateks eldiven en uygunudur ; yama testi gereksiz
#90 yaygin 2 - | ilaç fotosensitivite
S: Hidroklorotiyazid kullanan hastada güneş gören bölgelerde döküntü. Ne düşünürsün?
+ ilaca bağlı fotosensitivite ; sık nedenler: tiyazidler, tetrasiklinler, amiodaron, NSAİİ ; ilaç değişimi, güneşten korunma ; uzun süreli HCTZ ile deri kanseri riski farkındalığı
- polimorf ışık erüpsiyonu, ilaçla ilgisi yok ; solaryum ile alıştırma
#91 tuzak 2 - | kortikosteroid-fobi
S: Atopik dermatitli çocuğun ailesi topikal steroidden çok korkuyor. Ne söylersin?
+ uygun potens, süre ve bölgede topikal steroid güvenlidir ; parmak ucu ünitesi ile miktar ; proaktif tedavi alevlenmeleri azaltır ; alternatif kalsinörin inhibitörleri ; yetersiz tedavi riski
- topikal steroid her zaman büyüme geriliği yapar ; kesinlikle kullanılmamalı
#92 kirmizi 2 - | herpetik egzama
S: Atopik dermatitli çocukta ani gelişen ağrılı, delikli (punched-out) erozyonlar ve ateş. Ne yaparsın?
+ eczema herpeticum ; acil sistemik antiviral (asiklovir) ; göz tutulumu değerlendirmesi ; sekonder bakteriyel enfeksiyon ; topikal steroid geçici ara
- topikal steroid dozunu artır ; antiviral gereksiz
#93 yaygin 2 - | lipom / epidermal kist
S: Sırtta yumuşak, hareketli, ağrısız subkutan kitle. Yaklaşım?
+ lipom olasılığı ; 5 cm üzeri, derin, hızlı büyüyen veya sert kitlede görüntüleme (sarkom) ; semptomatik / kozmetik eksizyon ; epidermal kistle ayırım (punktum)
- tüm kitleler lipomdur, görüntüleme asla gerekmez ; insizyonel biyopsi ilk adım
#94 kilavuz 3 sb-kp-epidermolizis-bulloza | SB Epidermolizis Bülloza KP (Ağustos 2025)
S: Epidermolizis bülloza tanılı bebekte bakım ilkeleri?
+ deriye sürtünme / travmadan kaçınma, yapışmayan pansumanlar ; büllerin steril iğneyle drenajı (tavanı korunarak) ; enfeksiyon, beslenme ve ağrı yönetimi ; multidisipliner izlem ve genetik danışmanlık ; skuamöz hücreli karsinom riski (distrofik tiplerde) izlemi
- yapışkan bant ile pansuman ; büllerin tavanı kesilip alınır
#95 yaygin 2 - | akne skarı
S: Atrofik akne skarlarında tedavi seçenekleri?
+ aktif akne kontrol altına alınmadan skar tedavisi önerilmez ; kimyasal peeling, mikroiğneleme, fraksiyonel lazer ; subsizyon, dolgu ; izotretinoin sonrası işlem zamanlaması güncel kanıtla bireysel
- aktif aknede derin lazer ; skarlar tamamen kaybolur garantisi
#96 kirmizi 2 - | ektima gangrenozum
S: Nötropenik hastada santral nekrotik siyah ülserli eritematöz lezyonlar. Ne düşünürsün?
+ ektima gangrenozum (Pseudomonas başta) ; kan kültürü, lezyon kültürü / biyopsi ; acil antipseudomonal IV antibiyotik ; sepsis yönetimi
- böcek ısırığı ; topikal tedavi
#97 yaygin 1 - | nemlendirici seçimi
S: Kuru cilt için nemlendirici seçiminde nelere dikkat edilir?
+ okluzif / humektan içerik (vazelin, gliserin, üre, seramid) ; parfümsüz, hipoalerjenik ; düzenli ve yeterli miktarda ; üre yüksek konsantrasyon bebek / irritasyonda dikkat
- parfümlü ürünler tercih edilmeli ; haftada bir uygulama yeterli
#98 tuzak 2 - | kriyoterapi pigmente lezyon
S: Şüpheli pigmente lezyonu kriyoterapi veya lazerle yok etmek uygun mu?
+ şüpheli pigmente lezyon histopatolojik tanı olmadan yok edilmemeli ; eksizyonel biyopsi ; ablasyon tanıyı ve evrelemeyi engeller
- lazer ile yakmak güvenlidir ; biyopsi gereksiz
#99 yaygin 2 - | perioral dermatit
S: Ağız çevresinde küçük papülopüstüller, dudak kenarında dar bir şerit korunmuş. Tedavi?
+ perioral dermatit ; topikal steroid ve ağır kozmetiklerin kesilmesi ; topikal metronidazol / eritromisin / pimekrolimus ; oral tetrasiklin (çocukta eritromisin)
- güçlü topikal steroid ; antifungal
#100 kilavuz 2 dernek-tdd | dermoskopi
S: Pigmente lezyon değerlendirmesinde dermoskopinin yeri nedir?
+ tanısal doğruluğu çıplak göze göre artırır ; ABCD kuralı, 7 nokta kontrol listesi ; dijital dermoskopik izlem ; şüphede eksizyon ; deneyim gerektirir
- dermoskopi biyopsinin yerine her zaman geçer ; tanısal değeri yoktur
`,
} satisfies BankaKaynagi
