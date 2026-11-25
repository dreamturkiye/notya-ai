import type { BankaKaynagi } from '../banka'

/** AKKS — Pediatri. 100 draft items (Claude, 2026-11-24). Needs clinician review before any item counts as final. */
export default {
  brans: 'pediatri',
  onek: 'PED',
  metin: String.raw`
#1 yaygin 1 dernek-tpk | TPK akut gastroenterit yaklaşımı
S: 14 aylık, 2 gündür sulu ishal ve kusması olan, hafif dehidrate çocukta ilk tedavi yaklaşımın nedir?
+ ağızdan rehidrasyon tedavisi (ORS, düşük ozmolariteli) ilk seçenek ; hafif-orta dehidratasyonda 3–4 saatte yaklaşık 50–100 ml/kg ORS ; emzirme ve yaşa uygun beslenme kesilmeden sürdürülür ; çinko desteği önerilebilir ; ağır dehidratasyon / ORS'yi tolere edememe → IV sıvı
- rutin antibiyotik başlanmalı ; loperamid gibi antimotilite ajanları önerilir ; beslenme 24 saat kesilmeli
#2 yaygin 1 dernek-tpk | ateşli çocuk
S: 3 yaşında, 39 °C ateşi olan, genel durumu iyi, odağı olmayan çocukta ateş düşürücü kullanımı nasıl olmalı?
+ amaç çocuğun konforu, ateşin kendisi tedavi hedefi değil ; parasetamol 10–15 mg/kg/doz 4–6 saatte bir ; ibuprofen 5–10 mg/kg/doz 6–8 saatte bir ; dönüşümlü / kombine kullanım rutin önerilmez ; kırmızı bayrakların ebeveyne anlatılması
- aspirin kullanılabilir ; ateş 38'i geçince mutlaka antibiyotik ; soğuk su / alkol ile silme önerilir
#3 kirmizi 2 dernek-tpk | ateşli küçük bebek
S: 6 haftalık bebek 38,3 °C ateşle getirildi, emmesi iyi görünüyor. Yaklaşımın ne olur?
+ 3 aydan küçük ateşli bebek ciddi bakteriyel enfeksiyon açısından yüksek risklidir ; tam kan sayımı, CRP/prokalsitonin, idrar tahlili ve idrar kültürü, kan kültürü ; risk değerlendirmesine göre BOS incelemesi ; hastaneye yatırarak değerlendirme / gerekirse ampirik parenteral antibiyotik ; genel durumun iyi görünmesi güvence vermez
- evde ateş düşürücü ile izlem yeterli ; idrar tetkiki gereksiz
#4 kilavuz 2 sb-asi-takvimi | SB Ulusal Aşı Takvimi (güncel baskı doğrulanacak)
S: Rutin takvimine uygun aşılanmış 12 aylık sağlıklı çocuğa bu ay hangi aşılar yapılır?
+ KKK (kızamık-kızamıkçık-kabakulak) 1. doz ; suçiçeği aşısı ; konjuge pnömokok (KPA) rapel dozu ; aşı takviminin güncel baskısına göre kontrol edilmeli
- 12. ayda BCG tekrarlanır ; KKK 9. ayda rutin yapılır
#5 kilavuz 2 sb-asi-takvimi | SB GBP
S: Hepatit B aşısı Türkiye rutin takviminde hangi aylarda yapılır?
+ doğumda (ilk 24 saat içinde) ; 1. ayın sonunda ; 6. ayın sonunda ; HBsAg pozitif anneden doğan bebeğe doğumda aşı + HBIG
- HBsAg pozitif anne bebeğinde yalnız aşı yeterli, HBIG gerekmez ; ilk doz 2. ayda yapılır
#6 kirmizi 2 - | bronşiolit, AAP 2014 / TTD
S: 4 aylık bebekte bronşiolit; hangi bulgular hastaneye yatış gerektirir?
+ apne öyküsü ; oksijen satürasyonunun düşük olması (yaklaşık <%90–92) ; belirgin solunum sıkıntısı / çekilmeler, takipne ; beslenememe / dehidratasyon ; prematürite, <3 ay, KKH, KAH gibi risk faktörleri yatış eşiğini düşürür
- her bronşiolitte sistemik steroid verilmeli ; antibiyotik rutin başlanır
#7 tuzak 2 - | AAP 2014 bronşiolit kılavuzu
S: Bronşiolitli bebekte rutin nebül salbutamol ve sistemik steroid önerir misin?
+ rutin salbutamol önerilmez ; sistemik kortikosteroid önerilmez ; tedavi destekleyici: burun temizliği, beslenme desteği, gerekirse oksijen ; hipertonik salin yalnız yatan hastada seçilmiş durumlarda tartışılabilir
- her bronşiolitte salbutamol denemesi standarttır ; deksametazon yatış süresini kısaltır, rutin verilmeli
#8 yaygin 2 dernek-kbb-bbc | akut otitis media
S: 3 yaşında, 1 gündür kulak ağrısı ve 38 °C ateşi olan, tek taraflı bombe zarı olan çocukta antibiyotik başlar mısın?
+ 2 yaş üstü, tek taraflı, ağır olmayan AOM'de 48–72 saat izlem (bekle-gör) seçeneği ; analjezi (parasetamol/ibuprofen) ; izlem güvencesi yoksa / ağır bulguda yüksek doz amoksisilin (80–90 mg/kg/gün) ; düzelme yoksa yeniden değerlendirme
- her AOM'de hemen antibiyotik zorunludur ; ilk seçenek seftriakson
#9 ilac 2 - | KÜB
S: 18 kg çocuk için yüksek doz amoksisilin günlük toplam dozu ve bölünmesi nedir?
+ 80–90 mg/kg/gün ; 18 kg için yaklaşık 1440–1620 mg/gün ; iki eşit dozda (12 saatte bir) ; erişkin maksimum dozunu aşmamak
- 18 kg için günde 3 g ; tek doz halinde verilir
#10 kirmizi 3 sb-kp-epilepsi | SB Epilepsi Klinik Protokolü 2021, status
S: 2 yaşında çocuk 6 dakikadır jeneralize nöbet geçiriyor, damar yolu yok. Ne yaparsın?
+ havayolu, solunum, dolaşım ve kan şekeri kontrolü ; 5 dakikayı geçen nöbette benzodiazepin ; damar yolu yoksa intranazal / bukkal midazolam veya rektal diazepam ; ikinci doz benzodiazepine yanıt yoksa ikinci basamak (levetirasetam, fenitoin/fosfenitoin veya valproat) ; 112 / acil sevk
- nöbetin kendiliğinden durması için 15 dakika beklenir ; ağıza bir şey sokulur
#11 yaygin 2 sb-kp-epilepsi | febril nöbet
S: 18 aylık çocukta 2 dakika süren, jeneralize, ilk basit febril nöbet; ailenin ne bilmesi gerekir ve tetkik gerekir mi?
+ basit febril nöbet iyi seyirlidir, epilepsi riski düşük artış ; rutin EEG ve beyin görüntülemesi gerekmez ; ateşin nedeni araştırılır ; menenjit bulgusu varsa LP değerlendirilir ; profilaktik antiepileptik önerilmez ; ateş düşürücü nöbeti önlemez
- her febril nöbette EEG ve MR çekilmeli ; sürekli fenobarbital profilaksisi başlanmalı
#12 kirmizi 3 - | menenjit
S: 8 aylık bebekte ateş, huzursuzluk, kabarık fontanel ve peteşiyal döküntü var. İlk adımlar?
+ bakteriyel menenjit / meningokoksemi acil düşünülür ; kan kültürü alıp geciktirmeden ampirik IV antibiyotik (seftriakson ± vankomisin) ; dolaşım desteği, sıvı ; LP antibiyotiği geciktirmemeli ; temaslılara kemoprofilaksi
- LP yapılmadan antibiyotik başlanmamalı ; ayaktan oral antibiyotik ile izlem
#13 kilavuz 2 sb-kp-demir | SB Demir Eksikliği Anemisi KP 2020
S: Term sağlıklı bebeklerde Türkiye'de demir profilaksisi ne zaman, hangi dozda verilir?
+ "Demir Gibi Türkiye" programı ; 4. aydan 12. aya kadar ; 1 mg/kg/gün elementer demir ; prematüre / düşük doğum ağırlıklılarda daha erken (2. ay) ve daha yüksek doz
- term bebekte doğumdan itibaren 6 mg/kg/gün ; demir profilaksisi önerilmez
#14 kilavuz 1 - | SB Bebeklere D Vitamini Desteği Programı
S: Yenidoğanda D vitamini profilaksisi Türkiye'de nasıl uygulanır?
+ yaşamın ilk günlerinden itibaren ; 400 IU/gün ; en az 1 yaşına kadar ; anne sütü alan ve formülle beslenen bebeklerde de verilir
- yalnız formül alan bebeklere verilir ; 5000 IU/gün profilaksi dozudur
#15 yaygin 2 - | yenidoğan sarılığı
S: 3 günlük, term, anne sütü alan bebekte sarılık; değerlendirmede neye bakarsın?
+ ilk 24 saatte başlayan sarılık patolojiktir ; total ve direkt bilirubin ölçümü, saat-spesifik normogram / fototerapi eşikleri ; risk faktörleri: kan grubu uyuşmazlığı, G6PD, prematürite, hemoliz ; direkt bilirubin yüksekliği kolestaz açısından ileri inceleme ; emzirmenin sürdürülmesi ve kilo kaybının değerlendirilmesi
- anne sütü kesilmeli ve mama verilmeli ; güneşe çıkarmak fototerapinin yerine geçer
#16 kirmizi 2 - | uzamış sarılık
S: 3 haftalık bebekte sarılık sürüyor, gaitası açık renkli. Ne düşünürsün?
+ uzamış sarılıkta direkt bilirubin mutlaka bakılır ; akolik gaita biliyer atrezi açısından alarm ; erken tanı önemli (Kasai için ilk 60 gün) ; acil pediatrik gastroenteroloji / cerrahi değerlendirme
- anne sütü sarılığıdır, izlem yeterli ; fototerapi başlanır
#17 yaygin 2 - | AAP / TPK İYE
S: 2 yaşında kız çocukta ilk ateşli idrar yolu enfeksiyonu; tetkik ve tedavi?
+ idrar örneği uygun yöntemle (kateter / orta akım) ve kültür ; genel durumu iyi ise oral antibiyotik (yerel dirence göre, ör. 2. kuşak sefalosporin / amoksisilin-klavulanat) ; 7–14 gün ; ilk ateşli İYE sonrası üriner USG ; rutin VCUG ilk ateşli İYE'de önerilmez (USG anormal / tekrarlayan İYE hariç)
- torba idrarla pozitif kültür tanı için yeterli ; her ilk İYE'de VCUG zorunlu
#18 kirmizi 2 - | invajinasyon
S: 10 aylık bebekte aralıklı şiddetli karın ağrısı atakları, kusma ve çilek jölesi gaita. Yaklaşım?
+ invajinasyon düşünülür ; acil batın USG (hedef / donut görünümü) ; peritonit / şok yoksa hidrostatik veya pnömatik redüksiyon ; başarısızlık / perforasyonda cerrahi ; çocuk cerrahisi ile birlikte
- gastroenterit olarak ORS ile eve gönderilir ; lavman ile evde izlenir
#19 kirmizi 2 - | DKA
S: 9 yaşında çocuk poliüri, polidipsi, kusma ve derin hızlı solunumla geldi, kan şekeri 480 mg/dL. İlk değerlendirme?
+ diyabetik ketoasidoz düşünülür ; kan gazı, keton, elektrolitler ; sıvı tedavisi kontrollü (serebral ödem riski) ; insülin infüzyonu sıvıdan sonra başlanır, bolus insülin verilmez ; potasyum izlemi ve replasmanı ; yoğun bakım / deneyimli merkeze sevk
- hızlı ve bol hipotonik sıvı verilir ; bikarbonat rutin verilir ; insülin IV bolusla başlanır
#20 kilavuz 2 hsgm-tip1-diyabet-birinci-basamak | HSGM Birinci Basamak Tip 1 Diyabet Rehberi 2018
S: Tip 1 diyabetli 12 yaşında çocukta yıllık izlemde hangi taramalar yapılır?
+ HbA1c (yılda en az 3–4 kez) ; tiroid fonksiyonları ve otoimmün tiroidit ; çölyak taraması ; mikroalbüminüri, göz dibi, lipid profili (yaş / süreye göre) ; büyüme, puberte ve psikososyal değerlendirme
- tip 1 diyabette tarama gerekmez ; metformin ilk seçenektir
#21 ilac 2 - | KÜB, parasetamol
S: 12 kg çocukta parasetamolün güvenli günlük maksimum dozu nedir?
+ 10–15 mg/kg/doz ; günlük en fazla 60 mg/kg (kısa süreli ve yakın izlemle 75 mg/kg'ı aşmamak) ; 12 kg için yaklaşık 720 mg/gün ; doz aralığı en az 4–6 saat ; kombine ürünlerde gizli parasetamole dikkat
- 12 kg çocukta günde 1500 mg güvenlidir ; 2 saatte bir verilebilir
#22 ilac 3 - | kodein uyarısı (TİTCK / EMA)
S: 8 yaşında çocukta tonsillektomi sonrası ağrı için kodein yazabilir miyim?
+ kodein 12 yaş altında kontrendike ; tonsillektomi / adenoidektomi sonrası 18 yaş altında kontrendike ; ultra hızlı metabolizörlerde solunum depresyonu / ölüm riski ; parasetamol ve ibuprofen tercih edilir
- 8 yaşında düşük dozda kodein güvenlidir ; tramadol 12 yaş altında rutin önerilir
#23 ilac 2 - | ondansetron
S: 4 yaşında gastroenteritli çocukta kusma nedeniyle ORS'yi tolere edemiyor; antiemetik kullanır mısın?
+ ORS'yi kolaylaştırmak için tek doz oral ondansetron (yaklaşık 0,15 mg/kg) kullanılabilir ; metoklopramid çocuklarda ekstrapiramidal yan etki nedeniyle önerilmez ; QT uzaması riski olan hastada dikkat ; ardından ORS'ye devam
- metoklopramid ilk seçenektir ; antiemetik verilince ORS gerekmez
#24 ilac 2 - | ibuprofen kontrendikasyonları
S: Su çiçeği geçiren 5 yaşındaki çocukta ateş için ibuprofen verilir mi?
+ suçiçeğinde ibuprofen / NSAİİ invaziv grup A streptokok ve ciddi deri-yumuşak doku enfeksiyonu riski nedeniyle önerilmez ; parasetamol tercih edilir ; aspirin Reye sendromu riski nedeniyle kontrendike ; dehidratasyonda NSAİİ'den kaçınılır
- suçiçeğinde aspirin ilk seçenektir ; ibuprofen tercih edilmeli
#25 tuzak 2 - | AAP 2019 yerfıstığı
S: Atopik dermatiti olan 5 aylık bebekte yerfıstığı ve yumurtayı 3 yaşına kadar geciktirelim mi?
+ alerjen besinlerin geciktirilmesi önerilmez ; 4–6 ay arasında tamamlayıcı beslenmeyle erken tanıştırma alerji riskini azaltır ; ağır egzaması / yumurta alerjisi olan bebekte tanıştırma öncesi alerji değerlendirmesi düşünülebilir ; tam yerfıstığı boğulma riski nedeniyle verilmez (ezme / un formu)
- 3 yaşına kadar yerfıstığından kaçınılmalı ; bütün yerfıstığı verilebilir
#26 kilavuz 1 hsgm-tuber-2022 | TÜBER 2022, anne sütü
S: Anne sütü ve tamamlayıcı beslenmede güncel öneri nedir?
+ ilk 6 ay yalnız anne sütü ; 6. aydan itibaren uygun tamamlayıcı besinler ; emzirmenin 2 yaş ve sonrasına kadar sürdürülmesi ; 1 yaş altında bal ve inek sütü (ana içecek olarak) verilmez
- 4. ayda rutin olarak mamaya geçilmeli ; 6 aylık bebeğe bal verilebilir
#27 yaygin 2 - | kabızlık
S: 3 yaşında fonksiyonel kabızlığı olan, fekal impaksiyonlu çocukta tedavi?
+ dezimpaksiyon: oral polietilen glikol (yüksek doz) ilk seçenek ; idame PEG (yaklaşık 0,4–0,8 g/kg/gün) aylarca ; tuvalet eğitimi, davranışsal öneriler ; lif ve sıvı ; organik neden kırmızı bayrakları (mekonyum gecikmesi, büyüme geriliği) sorgulanır
- tedavi birkaç günde kesilir ; rutin lavman tek tedavidir
#28 kirmizi 2 - | Hirschsprung
S: Term yenidoğan 48 saattir mekonyum çıkarmadı, batın distandü. Ne düşünürsün?
+ Hirschsprung hastalığı, mekonyum ileusu (kistik fibrozis) akla gelmeli ; düz batın grafisi ve kontrastlı lavman ; rektal biyopsi ile tanı ; çocuk cerrahisine erken sevk ; enterokolit riski
- normaldir, 1 hafta beklenir ; laksatif başlanır ve taburcu edilir
#29 yaygin 2 sb-kp-astim | SB Astım KP; GINA
S: 7 yaşında ayda 3–4 gece öksürükle uyanan, haftada 3 kez salbutamol kullanan çocukta tedavi basamağı?
+ kontrolsüz astım ; düzenli düşük doz inhale kortikosteroid başlanır ; inhaler tekniği (spacer) ve uyum kontrolü ; tetikleyicilerden kaçınma ; 4–8 hafta sonra kontrol değerlendirmesi
- yalnız salbutamol yeterlidir ; uzun etkili beta agonist tek başına başlanır
#30 kirmizi 3 sb-kp-astim | ağır astım atağı
S: 6 yaşında astımlı çocuk konuşamayacak kadar nefes darlığı, SpO2 %88, sessiz akciğer. Ne yaparsın?
+ ağır / hayatı tehdit eden atak ; oksijen ; sık / sürekli salbutamol + ipratropium ; sistemik kortikosteroid ; IV magnezyum sülfat düşünülür ; yoğun bakım / üst merkez değerlendirmesi
- sessiz akciğer iyileşme işaretidir ; sedatif verilir
#31 kilavuz 2 - | AAP 2017 hipertansiyon
S: Çocuklarda kan basıncı ölçümü ve hipertansiyon tanısı nasıl konur?
+ 3 yaşından itibaren yıllık kan basıncı ölçümü ; yaş, cinsiyet ve boy persentiline göre değerlendirme ; 13 yaş üstünde erişkin eşikleri (130/80) ; tanı için üç ayrı vizitte yüksek değer ; uygun manşon boyutu
- çocukta 140/90 altı her zaman normaldir ; tek ölçüm tanı için yeterli
#32 kirmizi 2 - | testis torsiyonu
S: 13 yaşında erkek çocukta ani başlayan şiddetli skrotal ağrı ve bulantı. Yaklaşım?
+ testis torsiyonu acil olarak düşünülür ; kremaster refleksi kaybı ; Doppler USG tanıyı geciktirmemeli ; acil üroloji / çocuk cerrahisi, ideal olarak ilk 6 saatte detorsiyon ; epididimit ayırıcı tanıda
- analjezik verip ertesi gün kontrol ; antibiyotik başlayıp izlem
#33 yaygin 1 - | büyüme izlemi
S: 2 yaşında çocuğun ağırlığı 3. persentilin altında, boyu 25. persentilde. Nasıl değerlendirirsin?
+ ağırlık-boy oranı / VKİ değerlendirilir, akut malnütrisyon ; büyüme eğrisinde persentil kayması önemli ; beslenme öyküsü, besin alımı, psikososyal durum ; organik nedenler: çölyak, İYE, kronik hastalık için seçilmiş tetkik ; Türkiye referans eğrileri (Neyzi) / WHO
- tek ölçümle büyüme geriliği tanısı konur ; tüm çocuklara kapsamlı endokrin tetkiki yapılır
#34 kilavuz 2 - | çölyak ESPGHAN 2020
S: Çölyak tanısı çocuklarda nasıl konur?
+ glutenli diyet sürerken doku transglutaminaz IgA ve total IgA ; IgA eksikliğinde IgG bazlı testler ; tTG-IgA normalin 10 katından yüksek ve ayrı örnekte EMA pozitifse biyopsisiz tanı (ESPGHAN 2020) mümkün ; diğer durumlarda duodenal biyopsi ; tanıdan önce glutensiz diyete başlanmaz
- test öncesi glutensiz diyete geçilmeli ; HLA-DQ2 pozitifliği tanı koydurur
#35 yaygin 2 dernek-tpk | streptokokal farenjit
S: 6 yaşında çocukta ateş, eksüdatif tonsillit, ön servikal LAP, öksürük yok. Tedavi?
+ grup A streptokok için hızlı antijen testi / boğaz kültürü ; doğrulanırsa penisilin V veya amoksisilin 10 gün ; tek doz IM benzatin penisilin alternatif ; penisilin alerjisinde makrolid / 1. kuşak sefalosporin (alerji tipine göre) ; romatizmal ateşin önlenmesi amaç
- 3 yaş altında rutin antibiyotik ; 5 günlük azitromisin ilk seçenektir
#36 tuzak 2 - | öksürük şurupları
S: 2 yaşında viral üst solunum yolu enfeksiyonu olan çocukta öksürük şurubu veya dekonjestan önerir misin?
+ 2 yaş altında (ve genel olarak küçük çocukta) reçetesiz öksürük-soğuk algınlığı ilaçları önerilmez ; etkinlik kanıtı yok, toksisite riski ; 1 yaş üstünde bal öksürükte rahatlatabilir ; burun temizliği, sıvı
- dekstrometorfan + psödoefedrin kombinasyonu güvenlidir ; antihistaminik her çocuğa verilir
#37 kirmizi 2 - | Kawasaki
S: 3 yaşında çocuk 6 gündür ateşli, konjonktivit, çilek dili, ellerinde ödem ve döküntü. Ne düşünür, ne yaparsın?
+ Kawasaki hastalığı ; IVIG (2 g/kg) ve aspirin ; ekokardiyografi ile koroner değerlendirme ; ideal olarak ilk 10 gün içinde tedavi ; inkomplet Kawasaki olasılığı
- viral döküntü, semptomatik izlem ; aspirin çocukta asla verilmez (Kawasaki dahil)
#38 kilavuz 2 sb-asi-takvimi | SB GBP, HPV / rotavirüs (güncel baskı doğrulanacak)
S: Aşı takviminde son yıllarda yapılan değişiklikleri hekim olarak nereden ve nasıl takip etmeliyim?
+ T.C. Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü güncel aşı takvimi ; değişiklikler genelge / duyuru ile yürürlüğe girer ; takvimdeki aşı ve yaşların güncel baskıdan doğrulanması ; özel / risk grubu aşılarının ayrıca değerlendirilmesi
- aşı takvimi 2010'dan beri değişmedi ; CDC takvimi Türkiye için birebir geçerlidir
#39 yaygin 2 - | atopik dermatit
S: 1 yaşında orta şiddette atopik dermatiti olan bebekte basamak tedavisi?
+ düzenli nemlendirici, tetikleyicilerden kaçınma ; alevlenmede düşük-orta potent topikal kortikosteroid kısa süreli ; yüz ve katlantılarda düşük potent steroid veya topikal kalsinörin inhibitörü (yaş sınırlarına dikkat) ; enfekte egzamada antibiyotik ; besin alerjisi testleri yalnız öykü destekliyorsa
- topikal steroid çocukta hiç kullanılmamalı ; tüm bebeklere besin eliminasyon diyeti
#40 kirmizi 2 - | anafilaksi
S: 5 yaşında 20 kg çocuk yer fıstığı yedikten sonra yaygın ürtiker, stridor ve hipotansiyon geliştirdi. İlk tedavi?
+ anafilaksi ; IM adrenalin 0,01 mg/kg (1 mg/ml'den), 20 kg için 0,2 mg, uyluk lateraline ; gerekirse 5–15 dakikada tekrar ; oksijen, sıvı, yatış / gözlem ; antihistaminik ve steroid ikinci planda ; adrenalin otoenjektör reçetesi ve eğitim
- ilk tedavi IV antihistaminik ; adrenalin subkutan verilir
#41 ilac 2 - | ORS
S: Ağırlığı 10 kg olan hafif-orta dehidrate çocuğa ilk 4 saatte ne kadar ORS verirsin?
+ yaklaşık 50–100 ml/kg ; 10 kg için 500–1000 ml ; küçük ve sık yudumlarla ; devam eden kayıplar için her ishalde yaklaşık 10 ml/kg ek ; 4 saat sonra yeniden değerlendirme
- tek seferde 1 litre içirilir ; kola veya meyve suyu ORS yerine geçer
#42 ilac 3 - | gentamisin
S: Yenidoğan sepsisinde ampirik tedavi ve aminoglikozid kullanımında nelere dikkat edilir?
+ erken başlangıçlı sepsiste ampisilin + gentamisin ; gentamisin doz aralığı gestasyon yaşı / postnatal yaşa göre ; düzey izlemi ve böbrek fonksiyonu ; ototoksisite / nefrotoksisite ; kültür sonuçlarına göre daraltma
- tüm yenidoğanlarda 8 saatte bir aynı doz ; vankomisin ilk seçenektir
#43 kirmizi 2 - | yabancı cisim aspirasyonu
S: 2 yaşında çocuk oyun oynarken ani öksürük nöbeti geçirdi, şimdi tek taraflı wheezing var. Ne düşünürsün?
+ yabancı cisim aspirasyonu ; normal akciğer grafisi dışlamaz (ekspiryum / dekübitus grafisi yardımcı) ; şüphede rijit bronkoskopi ; antibiyotik / bronkodilatörle geçiştirilmemeli
- astım başlangıcıdır, salbutamol yeterli ; grafi normalse yabancı cisim dışlanır
#44 yaygin 2 sb-rehber-cocuk-isitme-2026 | SB Çocuklarda İşitme Kayıpları Klinik Rehberi 2026
S: Yenidoğan işitme taramasında sağ kulaktan "refer" sonucu alındı. Sonraki adım?
+ tekrar tarama (OAE / AABR) ; tekrar başarısızsa odyolojik tanısal değerlendirme (ABR) ; tanının ideal olarak 3 aya kadar konması, müdahalenin 6 aya kadar başlaması (1-3-6 ilkesi) ; risk faktörlü bebeklerde geç başlangıçlı kayıp için izlem
- tek kulak refer önemsizdir ; 1 yaşında tekrar bakılır
#45 kilavuz 2 hsgm-yenidogan-metabolik-tarama | Ulusal Yenidoğan Tarama Programı (baskı doğrulanacak)
S: Ulusal yenidoğan taramasında topuk kanıyla hangi hastalıklar taranır?
+ fenilketonüri ; konjenital hipotiroidi ; biyotinidaz eksikliği ; kistik fibrozis ; SMA ve diğer eklenen hastalıklar için güncel program kapsamı doğrulanmalı
- topuk kanı yalnız fenilketonüri içindir ; kistik fibrozis taranmaz
#46 kirmizi 2 - | konjenital hipotiroidi
S: Topuk kanı TSH yüksek gelen 10 günlük bebekte ne yaparsın?
+ venöz serbest T4 ve TSH ile doğrulama ; doğrulanırsa beklemeden levotiroksin (yaklaşık 10–15 mcg/kg/gün) ; erken tedavi nörogelişim için kritik ; çocuk endokrinolojisi ile izlem
- 6 ay sonra tekrar bakılır ; tedavi için tiroid sintigrafisi beklenmeli
#47 yaygin 2 - | enürezis
S: 7 yaşında monosemptomatik gece enürezisi olan çocukta yaklaşım?
+ öykü, idrar tahlili (glukozüri, enfeksiyon) ; davranışsal öneriler, akşam sıvı kısıtlama, ödüllendirme ; enürezis alarmı birinci basamak ; desmopressin (oral / dil altı) seçenek, sıvı kısıtlamasıyla, hiponatremi riski ; suçlama / ceza önerilmez
- 5 yaş altında ilaç başlanmalı ; desmopressin nazal sprey ilk seçenektir
#48 tuzak 2 - | desmopressin nazal formu
S: Enürezis için desmopressin nazal sprey yazmamda sakınca var mı?
+ enürezis için nazal form hiponatremi riski nedeniyle önerilmez ; oral tablet / dil altı form tercih edilir ; akşam dozdan 1 saat önce ve 8 saat sonrasına kadar sıvı kısıtlaması ; kusma / ishal döneminde ara verilmesi
- nazal sprey en güvenli formdur ; sıvı kısıtlaması gerekmez
#49 ilac 2 - | demir zehirlenmesi
S: 2 yaşında çocuk annesinin demir tabletlerinden yuttu. Yaklaşım?
+ yutulan elementer demir miktarı (mg/kg) hesaplanır ; yaklaşık 20 mg/kg altı genellikle hafif, 60 mg/kg üstü ciddi toksisite ; serum demir düzeyi (4–6. saat) ; aktif kömür demiri bağlamaz ; ciddi toksisitede deferoksamin ; Ulusal Zehir Danışma Merkezi (114)
- aktif kömür verilir ; ipeka şurubu ile kusturulur
#50 kirmizi 3 - | çocuk istismarı
S: 4 aylık bebekte farklı iyileşme evrelerinde çok sayıda morluk ve açıklanamayan femur kırığı var. Ne yaparsın?
+ çocuk istismarı şüphesi ; iskelet survey, göz dibi (retinal kanama), kafa görüntüleme ; adli bildirim yükümlülüğü ; çocuğun güvenliği için hastaneye yatış ; Çocuk İzlem Merkezi / sosyal hizmet ile işbirliği
- aileye güvence verip eve gönderme ; kırık nedeniyle yalnız ortopediye yönlendirme
#51 yaygin 2 - | gastroözofageal reflü
S: 2 aylık bebekte beslenme sonrası sık kusma var, kilo alımı iyi, huzursuzluk yok. Tedavi gerekir mi?
+ fizyolojik reflü (mutlu kusan bebek) ; güvence ve beslenme önerileri, aşırı beslemekten kaçınma ; PPI / H2 bloker rutin önerilmez ; alarm bulguları: safralı / fışkırır tarzda kusma, kilo kaybı, hematemez ; pilor stenozu ayırıcı tanısı
- tüm kusan bebeklere PPI başlanır ; yatış pozisyonu yüzüstü olmalı
#52 kirmizi 2 - | pilor stenozu
S: 5 haftalık erkek bebekte giderek artan fışkırır tarzda safrasız kusma ve aç görünüm. Ne düşünürsün?
+ hipertrofik pilor stenozu ; batın USG ; hipokloremik hipokalemik metabolik alkaloz ; sıvı-elektrolit düzeltildikten sonra piloromiyotomi ; çocuk cerrahisi
- reflüdür, mama değişimi yeterli ; acil cerrahi elektrolitler düzeltilmeden yapılır
#53 kirmizi 3 - | malrotasyon
S: 3 günlük yenidoğanda safralı kusma. Yaklaşım?
+ safralı kusma cerrahi acil kabul edilir ; malrotasyon / volvulus dışlanmalı ; acil üst GİS kontrast çalışması ; nazogastrik dekompresyon, oral alım kesilir, IV sıvı ; acil çocuk cerrahisi
- reflüdür ; ertesi gün kontrol
#54 kilavuz 2 sb-kp-astim | SB Astım KP; inhaler tekniği
S: 3 yaşında çocuk için inhaler cihaz seçimi nasıl yapılır?
+ ölçülü doz inhaler + maskeli spacer (aerosol odacığı) ; 4 yaş civarından sonra ağızlıklı spacer ; kuru toz inhalerler genellikle 5–6 yaş üstü ; nebülizer rutin idame için zorunlu değil
- 3 yaşında kuru toz inhaler ilk seçenek ; spacer gereksiz
#55 ilac 2 - | antibiyotik penisilin alerjisi
S: Ampisilin sonrası ürtikeri olan çocukta sefalosporin verebilir miyim?
+ gecikmiş, ağır olmayan döküntü / izole ürtiker öyküsünde farklı yan zincirli sefalosporinler genellikle kullanılabilir ; anafilaksi / ağır kutanöz reaksiyon (SJS/TEN, DRESS) öyküsünde kaçınılır ve alerji uzmanı ; gerçek penisilin alerjisi sıklıkla aşırı tanılanır, değerlendirme ve etiket kaldırma önemli
- penisilin alerjisinde tüm sefalosporinler kesin kontrendikedir ; SJS öyküsünde aynı sınıftan başka ilaç denenebilir
#56 kirmizi 2 - | hipoglisemi yenidoğan
S: Diyabetik anne bebeği 2. saatte kan şekeri 35 mg/dL, asemptomatik. Ne yaparsın?
+ yenidoğan hipoglisemisi ; erken besleme (anne sütü / gerekirse formül), oral dekstroz jel seçeneği ; tekrar ölçüm ; semptomatik veya düzelmeyen hipoglisemide IV dekstroz ; makrozomi, polisitemi, hipokalsemi açısından da izlem
- asemptomatikse ölçüm tekrarlanmaz ; hipertonik %50 dekstroz bolus
#57 yaygin 1 - | diş çıkarma
S: Diş çıkaran bebekte yüksek ateş ve ishal diş çıkarmaya bağlanabilir mi?
+ diş çıkarma hafif huzursuzluk, salya artışı yapabilir ; yüksek ateş (≥38,5–39 °C) ve ishal diş çıkarmaya bağlanmamalı, başka neden aranmalı ; lokal anestezikli jeller (benzokain, lidokain) küçük çocukta önerilmez ; amber kolye boğulma riski
- yüksek ateş diş çıkarmanın olağan bulgusu ; benzokain jel önerilir
#58 sgk 2 sgk-sut | SUT palivizumab maddesi (güncel metin doğrulanacak)
S: RSV profilaksisi (palivizumab) için SGK geri ödeme koşulları genel olarak nelerdir?
+ SUT'ta belirtilen risk grupları: belirli gestasyon haftası altındaki prematüreler, bronkopulmoner displazi, hemodinamik açıdan anlamlı konjenital kalp hastalığı ; uzman hekim / sağlık kurulu raporu ; RSV sezonunda aylık dozlar, sezon başına sınırlı doz ; ayrıntılar SUT'un güncel metninden doğrulanmalı
- tüm bebeklere SGK tarafından ödenir ; reçete için rapor gerekmez
#59 sgk 2 sgk-sut | SUT özel tıbbi amaçlı diyet ürünleri
S: İnek sütü proteini alerjisi olan bebekte amino asit bazlı mama SGK'ya nasıl yazdırılır?
+ özel tıbbi amaçlı diyet ürünleri SUT kapsamında rapor ile ; tanının ilgili uzman (çocuk alerji / çocuk gastroenteroloji vb.) tarafından konması ve raporlanması ; önce genellikle yoğun hidrolize formül, yanıtsızlık / ağır tablo varsa amino asit bazlı formül ; rapor süresi ve yenileme koşulları SUT'tan doğrulanmalı
- her pratisyen hekim raporsuz yazabilir ; amino asit mama ilk seçenek olarak herkese
#60 tuzak 3 - | inek sütü alerjisi keçi sütü
S: İnek sütü proteini alerjili bebekte keçi sütü veya soya mama alternatif midir?
+ keçi / koyun sütü yüksek çapraz reaktivite nedeniyle uygun değildir ; soya formül 6 aydan küçükte önerilmez, seçilmiş büyük bebeklerde tartışılabilir ; yoğun hidrolize formül ilk seçenek ; emziren annede diyetten süt ürünlerinin çıkarılması
- keçi sütü güvenli alternatiftir ; kısmi hidrolize (HA) mama tedavi için yeterlidir
#61 yaygin 2 - | baş ağrısı
S: 10 yaşında çocukta tekrarlayan baş ağrısı; görüntüleme ne zaman gerekir?
+ kırmızı bayraklar: uykudan uyandıran / sabah kusmalı ağrı, nörolojik muayene bulgusu, ağrı karakterinde değişiklik, 3 yaş altı, papilödem, büyüme / davranış değişikliği ; normal muayeneli tipik migren / gerilim tipi baş ağrısında rutin görüntüleme gerekmez ; baş ağrısı günlüğü, tetikleyiciler ; akut tedavide ibuprofen / parasetamol
- tüm çocuk baş ağrılarında BT çekilmeli ; çocukta migren olmaz
#62 kirmizi 3 sb-kp-migren-2025 | SB Migren KP Rev. 01 (2025), Çocuk ve Ergende Migren
S: 9 yaşında migren tanılı çocukta ayda 6–8 atak oluyor, okul kaybı var. Profilaksi?
+ sık / sakatlayıcı ataklarda profilaksi düşünülür ; yaşam tarzı, uyku, tetikleyici yönetimi ve davranışsal tedavi ; ilaç seçenekleri (ör. propranolol, topiramat, amitriptilin, flunarizin) kontrendikasyonlara göre ; ilaç aşırı kullanımı baş ağrısı sorgulanır ; çocuk nörolojisi ile birlikte
- profilaksi çocukta hiç kullanılmaz ; ergotaminler çocukta ilk seçenek
#63 ilac 2 - | ADHD metilfenidat
S: DEHB tanılı 8 yaşında çocukta metilfenidat başlamadan önce neleri değerlendirirsin?
+ kardiyak öykü, ani ölüm aile öyküsü, kalp muayenesi ; kan basıncı, nabız, boy ve kilo başlangıç değerleri ; tik, anksiyete, uyku, iştah ; izlemde büyüme ve kan basıncı takibi ; Türkiye'de raporla (çocuk psikiyatrisi) reçetelenir
- tüm çocuklara rutin EKO zorunludur ; büyüme izlemi gerekmez
#64 yaygin 2 - | otizm taraması
S: 18 aylık çocukta otizm taraması nasıl yapılır?
+ 18 ve 24. aylarda M-CHAT-R/F gibi standart tarama ; erken uyarı bulguları: göz teması, adıyla seslenince bakmama, ortak dikkat, işaret etme yokluğu, dil gerilemesi ; pozitif taramada takip görüşmesi ve çocuk psikiyatrisi / gelişimsel pediatri sevki ; işitme değerlendirmesi
- 3 yaşından önce otizm taranmaz ; KKK aşısı otizme yol açar
#65 tuzak 1 - | KKK ve otizm
S: Aile KKK aşısının otizme yol açtığını duymuş, aşıyı ertelemek istiyor. Ne söylersin?
+ KKK ile otizm arasında ilişki yoktur, kaynak makale geri çekilmiştir ; büyük çalışmalar ilişki göstermemiştir ; aşılamamanın kızamık riski ve ciddi komplikasyonları ; aileyle empatik iletişim, aşı reddi kaydı
- KKK aşısı otizm riskini artırabilir ; aşıyı ayrı ayrı yapmak daha güvenlidir
#66 kirmizi 2 - | dehidratasyon şiddeti
S: Gastroenteritli bebekte ağır dehidratasyonun bulguları nelerdir?
+ letarji / bilinç bulanıklığı ; çok çökük gözler, gözyaşı yokluğu ; deri turgorunun çok yavaş dönmesi ; kapiller dolum zamanının uzaması, zayıf nabız ; sıvı içememe ; acil IV / IO sıvı (20 ml/kg izotonik bolus)
- ağır dehidratasyonda yalnız ORS ; hipotonik sıvı bolusu
#67 ilac 2 - | IV sıvı
S: Çocuklarda idame IV sıvı seçimi nasıl olmalı?
+ idame için izotonik sıvı (ör. %0,9 NaCl veya dengeli kristaloid, dekstrozlu) hiponatremi riskini azaltır ; Holliday-Segar ile hacim hesabı ; elektrolit ve kilo izlemi ; ADH salgısı artmış durumlarda sıvı kısıtlaması
- idame sıvısı rutin olarak %0,18 NaCl gibi hipotonik sıvı olmalı ; elektrolit izlemi gerekmez
#68 yaygin 2 - | fizyolojik fimozis
S: 3 yaşında erkek çocukta sünnet derisi geri çekilemiyor, şikâyeti yok. Ne önerirsin?
+ fizyolojik fimozis bu yaşta normaldir ; zorla geri çekme önerilmez ; balanit / üriner enfeksiyon / balon yapma yoksa izlem ; gerekirse topikal steroid ; patolojik fimozis (skar) ayrı değerlendirilir
- hemen cerrahi gerekir ; zorla geri çekilmesi öğretilir
#69 kirmizi 2 - | inmemiş testis
S: 8 aylık erkek bebekte sağ testis skrotumda ele gelmiyor. Ne zaman cerrahi?
+ 6 aydan sonra kendiliğinden inme beklenmez ; orşiopeksi ideal olarak 6–18 ay arası ; rutin görüntüleme (USG) gerekmez ; bilateral ele gelmeyen testiste DSD / endokrin değerlendirme ; fertilite ve malignite riski
- ergenliğe kadar beklenir ; hormon tedavisi ilk seçenek
#70 kilavuz 2 hsgm-tuber-2022 | TÜBER 2022; obezite
S: 9 yaşında VKİ 97. persentilin üzerinde olan çocukta değerlendirme ve tedavi?
+ obezite tanısı yaş-cinsiyete göre VKİ persentili ; komorbidite taraması: kan basıncı, açlık glukoz / HbA1c, lipid profili, ALT ; endokrin / genetik nedenler için boy kısalığı, dismorfizm sorgulanır ; aile temelli yaşam tarzı değişikliği, ekran süresi, fiziksel aktivite ; ağır vakalarda multidisipliner yaklaşım
- obez çocukta önce rutin olarak ilaç başlanır ; tüm obez çocuklarda kortizol ve tiroid zorunlu tedavi gerektirir
#71 yaygin 2 - | kısa boy
S: 6 yaşında çocuk boyu 3. persentilin altında, büyüme hızı normal, kemik yaşı geride, ailede geç ergenlik var. Ne düşünürsün?
+ yapısal büyüme ve ergenlik gecikmesi olasılığı ; ailesel kısa boy ayırıcı tanısı ; hedef boy hesabı ; büyüme hızının izlenmesi ; büyüme hızı düşükse / orantısızlıkta endokrin ve sistemik tetkik
- tüm kısa çocuklara büyüme hormonu başlanır ; kemik yaşı gereksizdir
#72 kirmizi 2 - | erken puberte
S: 6 yaşında kız çocukta meme gelişimi ve hızlı boy uzaması başladı. Yaklaşım?
+ kızlarda 8 yaşından önce puberte bulguları erken puberte ; kemik yaşı, LH/FSH, östradiol, gerekirse GnRH uyarı testi ; santral erken puberte doğrulanırsa beyin MR ; GnRH analoğu tedavisi değerlendirilir ; çocuk endokrinolojisi
- normal varyasyondur, izlem yeterli ; tetkik gerekmez
#73 ilac 2 - | antibiyotik süre
S: Toplum kökenli pnömonili, genel durumu iyi 4 yaşında çocukta ilk seçenek ve süre?
+ yüksek doz amoksisilin ilk seçenek ; 5 günlük tedavi çoğu ayaktan hastada yeterli (güncel kanıt) ; atipik pnömoni şüphesinde (genellikle 5 yaş üstü) makrolid ; 48–72 saatte yanıt değerlendirmesi ; hipoksemi / solunum sıkıntısında yatış
- ilk seçenek seftriakson IM ; tüm çocuklara makrolid eklenir
#74 tuzak 2 - | siprofloksasin çocuk
S: 10 yaşında çocukta basit sistit için siprofloksasin ilk seçenek midir?
+ florokinolonlar çocuklarda ilk seçenek değildir, eklem / tendon ve diğer yan etkiler ; yerel dirence göre nitrofurantoin, TMP-SMX, oral sefalosporin ; florokinolon dirençli patojen / başka seçenek olmadığında ; kültür ile yönlendirme
- siprofloksasin çocukta ilk seçenektir ; kültür gereksiz
#75 kirmizi 2 - | HÜS
S: Kanlı ishal sonrası 5. günde solukluk, idrar azalması ve peteşi gelişen 3 yaşında çocuk?
+ hemolitik üremik sendrom (STEC) ; tam kan (trombositopeni, şistositler), LDH, böbrek fonksiyonu ; destek tedavisi, sıvı-elektrolit, gerektiğinde diyaliz ; STEC enfeksiyonunda antibiyotik ve antimotilite ajanlarından kaçınılır ; nefroloji / üst merkez sevki
- kanlı ishalde rutin antibiyotik ; loperamid başlanır
#76 yaygin 2 - | nefrotik sendrom
S: 4 yaşında çocukta yaygın ödem, ağır proteinüri ve hipoalbüminemi. İlk tedavi?
+ çocukluk çağı idiyopatik nefrotik sendrom (çoğunlukla minimal değişiklik) ; oral prednizolon (yaklaşık 60 mg/m²/gün, ardından azaltılarak) ; tromboz ve enfeksiyon (peritonit) riski ; tuz kısıtlaması, ödem yönetimi ; tipik vakada başlangıçta biyopsi gerekmez
- ilk basamakta tüm çocuklara böbrek biyopsisi ; sıvı serbest, diüretik rutin
#77 kilavuz 2 sb-asi-takvimi | aşı kontrendikasyonları
S: Hafif üst solunum yolu enfeksiyonu ve 37,8 °C ateşi olan bebeğe planlanan aşılar yapılır mı?
+ hafif hastalık aşılamaya engel değildir ; orta-ağır akut hastalıkta erteleme ; gerçek kontrendikasyonlar: önceki dozla anafilaksi, canlı aşılarda ağır immün yetmezlik / gebelik ; gereksiz ertelemeler aşı kaçırmaya yol açar
- her ateşli bebekte aşı 2 hafta ertelenir ; antibiyotik kullanan çocuğa aşı yapılmaz
#78 ilac 2 - | kortikosteroid krup
S: 2 yaşında havlar tarzda öksürük ve istirahatte stridoru olmayan hafif krup; tedavi?
+ tek doz oral deksametazon (0,15–0,6 mg/kg) hafif krupta da önerilir ; istirahatte stridor / orta-ağır krupta nebül adrenalin + gözlem ; nemli hava kanıtı zayıf ; epiglottit / bakteriyel trakeit ayırıcı tanısı
- antibiyotik ilk tedavidir ; salbutamol krupta etkilidir
#79 kirmizi 3 - | epiglottit
S: 4 yaşında aşısız çocukta ani yüksek ateş, salya akması, öne eğilmiş oturuş ve boğuk ses. Ne yaparsın?
+ epiglottit şüphesi ; çocuğu ajite etmeden, boğaz muayenesi zorlamadan ; havayolu güvenliği için anestezi / KBB ile ameliyathane ortamı ; IV antibiyotik (seftriakson) ; Hib aşısızlığı risk faktörü
- dil basacağıyla boğaz muayenesi yapılır ; yatırılıp kan alınır
#80 yaygin 1 - | gelişimsel kalça displazisi
S: Yenidoğanda gelişimsel kalça displazisi taraması nasıl yapılır?
+ Ortolani ve Barlow ile fizik muayene ; risk faktörlerinde (makat geliş, aile öyküsü) veya pozitif muayenede kalça USG ; Türkiye'de yaygın uygulama tüm bebeklerde 4–6 hafta civarı Graf yöntemi ile USG ; tanıda abdüksiyon cihazı (Pavlik) ; kundaklamadan (bacakları gerili sarma) kaçınılması
- kalça USG 1 yaşında yapılır ; sıkı kundak önerilir
#81 sgk 1 sgk-sut | SUT; rapor süreleri
S: Uzun süreli ilaç kullanımı gereken çocuk hastada SGK ilaç kullanım raporu en fazla ne süreyle düzenlenir?
+ ilaç kullanım raporları genellikle en fazla 1 yıl süreli düzenlenir ; ilacın SUT'taki özel koşulları (uzman, kurul, ek kriterler) ayrıca uygulanır ; rapor elektronik ortamda (e-rapor) ; güncel SUT eki ve ilacın maddesinden doğrulanmalı
- ilaç raporları süresizdir ; rapor kâğıt olarak eczaneye götürülür, e-rapor yoktur
#82 kirmizi 2 - | ITP
S: 4 yaşında viral enfeksiyon sonrası yaygın peteşi, trombosit 8.000/mm³, kanaması yok, diğer seriler normal. Yaklaşım?
+ akut immün trombositopeni olasılığı ; periferik yayma ile lösemi / diğer nedenlerin dışlanması ; kanama yoksa dikkatli izlem bir seçenektir ; anlamlı kanamada IVIG veya kortikosteroid ; travmadan ve NSAİİ / aspirinden kaçınma
- trombosit transfüzyonu rutin yapılır ; tüm vakalara kemik iliği biyopsisi zorunlu
#83 kirmizi 3 - | lösemi
S: 5 yaşında çocukta 3 haftadır solukluk, kemik ağrısı, hepatosplenomegali ve yaygın ekimozlar. Ne yaparsın?
+ akut lösemi akla gelmeli ; tam kan ve periferik yayma acilen ; kemik iliği incelemesi için çocuk hematoloji-onkoloji sevki ; tümör lizis bulguları açısından değerlendirme ; steroid tanı öncesi verilmemeli
- büyüme ağrısıdır ; tanı öncesi steroid başlanır
#84 yaygin 2 - | demir eksikliği tedavi
S: 2 yaşında Hb 9,2 g/dL, MCV düşük, ferritin düşük çocukta tedavi?
+ oral elementer demir 3–6 mg/kg/gün ; aç karnına / C vitaminiyle, süt ile birlikte değil ; aşırı inek sütü tüketimi (>500 ml/gün) sorgulanır ; 4 hafta sonra Hb yanıtı ; Hb normale döndükten sonra depoları doldurmak için yaklaşık 3 ay daha
- Hb normale gelince demir hemen kesilir ; ilk seçenek IV demir
#85 tuzak 2 - | talasemi taşıyıcılığı
S: Mikrositer anemili, ferritini normal, Mentzer indeksi düşük çocuğa demir başlar mısın?
+ talasemi taşıyıcılığı akla gelmeli ; hemoglobin elektroforezi (HbA2) ; gereksiz demir tedavisinden kaçınılır ; ailenin taranması ve genetik danışmanlık
- tüm mikrositer anemiler demir eksikliğidir ; ferritin normal olsa da yüksek doz demir verilir
#86 kirmizi 2 - | zehirlenme parasetamol
S: 3 yaşında çocuk bilinmeyen miktarda parasetamol şurubu içti. Ne yaparsın?
+ alınan dozun mg/kg tahmini ; 4. saatte serum parasetamol düzeyi ve Rumack-Matthew nomogramı ; toksik doz şüphesinde N-asetilsistein ; karaciğer fonksiyon testleri ; Ulusal Zehir Danışma Merkezi (114)
- asemptomatikse düzey bakılmaz ; aktif kömür her durumda 12. saatte verilir
#87 kilavuz 2 - | AAP güvenli uyku
S: Ani bebek ölümü sendromundan korunmak için ailelere ne öneririz?
+ bebeği sırtüstü yatırmak ; sert, düz yatak, yatakta yastık / yorgan / oyuncak olmaması ; ebeveynle aynı odada ama ayrı yatakta ; sigara dumanından korunma ; emzirme ve emzik koruyucu
- yüzüstü yatış reflüyü önlediği için önerilir ; ebeveyn yatağında uyumak riski azaltır
#88 yaygin 2 - | konjonktivit
S: 4 yaşında çocukta iki taraflı pürülan konjonktivit; tedavi?
+ bakteriyel konjonktivit çoğunlukla kendini sınırlar ; topikal antibiyotik damla iyileşmeyi hızlandırabilir ; el hijyeni ; kırmızı bayraklar: görme azalması, fotofobi, periorbital selülit, yenidoğan konjonktiviti ; steroidli damla önerilmez
- steroidli antibiyotik damla ilk seçenek ; sistemik antibiyotik her vakada
#89 kirmizi 2 - | periorbital selülit
S: 6 yaşında çocukta göz kapağında şişlik, ağrılı göz hareketi ve proptozis var. Ne yaparsın?
+ orbital selülit (preseptalden ayırt edilmeli) ; acil kontrastlı orbita BT ; IV antibiyotik ; göz ve KBB konsültasyonu, abse varsa cerrahi drenaj ; görme ve pupilla takibi
- oral antibiyotikle ayaktan izlem ; sıcak kompres yeterli
#90 ilac 2 - | antihistaminik bebek
S: 6 aylık bebekte ürtiker için hangi antihistaminikler kullanılabilir?
+ ikinci kuşak antihistaminikler (ör. setirizin, desloratadin) yaş onayına göre tercih edilir ; birinci kuşak sedatif antihistaminikler küçük bebekte solunum depresyonu / paradoksal etki riski ; ürtikerin tetikleyicisi araştırılır ; anafilaksi bulguları sorgulanır
- birinci kuşak antihistaminikler en güvenlisidir ; prometazin 2 yaş altında önerilir
#91 tuzak 3 - | prometazin
S: 18 aylık bebekte kusma için prometazin fitil kullanabilir miyim?
+ prometazin 2 yaş altında ölümcül solunum depresyonu riski nedeniyle kontrendikedir ; antiemetik gerekirse ondansetron ; altta yatan neden ve hidrasyon değerlendirmesi
- düşük doz prometazin bebekte güvenlidir ; metoklopramid ilk seçenek
#92 kirmizi 2 - | ensefalit
S: 7 yaşında ateş, bilinç değişikliği, davranış bozukluğu ve fokal nöbet. Ampirik tedavi?
+ ensefalit, özellikle HSV ensefaliti düşünülür ; beklemeden IV asiklovir ; menenjit kapsamı için ampirik antibiyotik ; LP (HSV PCR), MR, EEG ; yoğun bakım izlemi
- asiklovir PCR sonucu beklenerek başlanır ; antipiretik ve izlem yeterli
#93 yaygin 2 - | idrar tahlili hematüri
S: Rutin idrar tahlilinde mikroskopik hematüri saptanan, asemptomatik 8 yaşında çocuk?
+ tekrar idrar tahlilleri ile kalıcılığın doğrulanması ; kan basıncı ve proteinüri değerlendirmesi ; idrar mikroskopisi (eritrosit morfolojisi, silendirler) ; aile öyküsü (Alport, ince bazal membran) ; proteinüri / hipertansiyon / böbrek fonksiyon bozukluğunda nefrolojiye sevk
- tek tahlilde sistoskopi ; her çocukta böbrek biyopsisi
#94 kilavuz 2 sb-rehber-cocuk-yb | SB Çocuk YBÜ Rehberi
S: Çocuk acilde hangi hastalar çocuk yoğun bakım değerlendirmesi gerektirir?
+ solunum yetmezliği / ventilasyon ihtiyacı ; şok / inotrop gereksinimi ; bilinç bozukluğu (GKS düşüklüğü), status epileptikus ; ağır metabolik bozukluklar (DKA, ağır elektrolit) ; erken uyarı skorları (PEWS) ile kötüleşmenin izlenmesi
- tüm ateşli çocuklar yoğun bakımda izlenir ; yoğun bakım yalnız ventile hastalar içindir
#95 yaygin 2 - | kolik
S: 6 haftalık, iyi kilo alan bebekte günde 3 saati aşan ağlama nöbetleri; aileye ne önerirsin?
+ infantil kolik kendini sınırlar, genellikle 3–4 ayda düzelir ; organik neden kırmızı bayrakları (ateş, kusma, kilo alamama) dışlanır ; ebeveyn desteği, sarsılmış bebek sendromu riskine karşı uyarı ; simetikon / rutin mama değişimi kanıtı zayıf ; bazı vakalarda L. reuteri seçenek
- tüm kolikli bebeklerde PPI başlanır ; bebek ağlarken sallanarak susturulur
#96 ilac 3 - | valproat, teratojenite
S: Valproat kullanan epileptik ergen kızda doğum kontrol ve teratojenite açısından ne konuşmalısın?
+ valproat belirgin teratojeniktir (nöral tüp defekti, nörogelişimsel etkiler) ; doğurganlık çağındaki kızlarda mümkünse alternatif antiepileptik, değilse gebelik önleme programı ; folik asit desteği ; enzim indükleyici antiepileptiklerin hormonal kontraseptiflerle etkileşimi ; çocuk nörolojisi ile karar
- valproat gebelikte en güvenli antiepileptiktir ; doğum kontrolü konuşulmaz
#97 sgk 2 sgk-sut | SUT büyüme hormonu
S: Büyüme hormonu tedavisi SGK'da nasıl yazdırılır?
+ endikasyonların (GH eksikliği, Turner, Prader-Willi, KBY vb.) SUT'ta tanımlı olması ; çocuk endokrinolojisi uzmanının yer aldığı sağlık kurulu raporu ; uyarı testleri ve kemik yaşı gibi tanı kriterlerinin belgelenmesi ; tedavide yıllık büyüme yanıtı ile devam kriterleri ; ayrıntılar güncel SUT'tan doğrulanmalı
- her kısa boylu çocuğa pratisyen raporuyla yazılır ; tanı testi gerekmez
#98 tuzak 2 - | rutin göğüs grafisi
S: Wheezing ile gelen ilk bronşiolit atağındaki bebekte rutin akciğer grafisi ve kan tetkiki gerekir mi?
+ tipik bronşiolitte rutin akciğer grafisi önerilmez ; rutin kan tetkiki / viral panel gerekmez ; grafi ağır hastalık, beklenmeyen kötüleşme, yoğun bakım ihtiyacında ; gereksiz grafi antibiyotik kullanımını artırır
- her bronşiolitte grafi ve CRP şarttır ; grafideki infiltrat antibiyotik gerektirir
#99 kirmizi 2 - | senkop çocuk
S: 13 yaşında çocuk koşarken bayıldı. Ne düşünürsün?
+ egzersiz sırasında senkop kardiyak nedeni (HCM, uzun QT, aritmi, koroner anomali) düşündürür ; EKG ve ekokardiyografi ; ailede ani ölüm öyküsü ; değerlendirme tamamlanana kadar sporun kısıtlanması ; çocuk kardiyolojisi
- vazovagal senkoptur, güvence yeterli ; egzersize hemen devam edebilir
#100 kilavuz 1 - | Türkiye referans eğrileri
S: Türk çocuklarının büyüme değerlendirmesinde hangi referanslar kullanılabilir?
+ Neyzi ve arkadaşlarının Türk çocukları büyüme referansları ; 0–5 yaş için WHO büyüme standartları da kullanılır ; prematürelerde düzeltilmiş yaş ve uygun eğriler (Fenton / INTERGROWTH) ; seri ölçümler ve persentil kanalı izlenir
- tek ölçüm yeterlidir ; prematürede kronolojik yaş kullanılır
`,
} satisfies BankaKaynagi
