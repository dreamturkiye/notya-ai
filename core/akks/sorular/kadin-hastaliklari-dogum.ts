import type { BankaKaynagi } from '../banka'

/** AKKS — Kadın Hastalıkları ve Doğum. 100 draft items (Claude, 2026-11-24). Needs clinician review before any item counts as final. */
export default {
  brans: 'kadin-hastaliklari-dogum',
  onek: 'KD',
  metin: String.raw`
#1 kilavuz 1 sb-dobyr | SB Doğum Öncesi Bakım Yönetim Rehberi (baskı doğrulanacak)
S: SB Doğum Öncesi Bakım rehberine göre sağlıklı gebede en az kaç izlem önerilir ve zamanlaması nedir?
+ en az 4 doğum öncesi izlem ; ilki 14. gebelik haftasından önce ; 18–24. hafta, 28–32. hafta ve 36–38. hafta ; risk saptanan gebede izlem sıklığı artırılır
- tek izlem yeterlidir ; ilk izlem 20. haftadan sonra yapılır
#2 kilavuz 1 sb-dobyr | folik asit
S: Gebelik planlayan kadına folik asit desteği nasıl önerilir?
+ gebelikten en az 1 ay önce başlayıp ilk trimester sonuna kadar ; günlük 400 mcg ; nöral tüp defekti öyküsü, antiepileptik kullanımı, diyabet, obezite gibi yüksek riskte 4–5 mg ; gebelik saptandığında başlamak geç kalmış olabilir
- yalnız gebelik saptandıktan sonra başlanır ; yüksek riskte de 400 mcg yeterli
#3 kilavuz 2 sb-dobyr | demir ve D vitamini desteği
S: Türkiye'de gebelikte rutin demir ve D vitamini desteği nasıl uygulanır?
+ SB programı: gebeliğin 4. ayından (yaklaşık 16. hafta) itibaren demir desteği, doğum sonrası 3 ay sürer ; günlük 40–60 mg elementer demir ; D vitamini desteği (yaklaşık 12. haftadan itibaren, doğum sonrası 6 ay, 1200 IU/gün) ; anemide tedavi dozları ; güncel program metninden doğrulanmalı
- gebelikte demir desteği önerilmez ; D vitamini gebelikte kontrendikedir
#4 kilavuz 2 sb-dobyr | gestasyonel diyabet taraması
S: Gestasyonel diyabet taraması ne zaman ve nasıl yapılır?
+ risk faktörü yoksa 24–28. haftalar arasında ; 75 g OGTT (tek aşamalı) veya 50 g tarama + 100 g OGTT (iki aşamalı) yaklaşımı ; yüksek riskli gebede ilk vizitte açlık glukozu / HbA1c ile pregestasyonel diyabet taraması ; tanı eşiklerinin kullanılan yönteme göre uygulanması
- tarama 36. haftada yapılır ; HbA1c GDM tanısında tek başına yeterli
#5 ilac 2 - | GDM tedavisi
S: Diyetle hedeflere ulaşamayan gestasyonel diyabetli gebede ilk tercih edilen farmakolojik tedavi nedir?
+ insülin birinci seçenek ; glisemik hedefler: açlık <95 mg/dL, 1. saat <140, 2. saat <120 mg/dL ; metformin seçilmiş hastada alternatif, plasentayı geçer ; doğum sonrası 4–12. haftada 75 g OGTT ile yeniden değerlendirme
- sülfonilüreler ilk seçenektir ; doğum sonrası tarama gerekmez
#6 kirmizi 3 sb-riskli-gebelikler | preeklampsi ağır özellikler
S: 34 haftalık gebede KB 165/112 mmHg, baş ağrısı ve epigastrik ağrı var. Yaklaşım?
+ ağır özellikli preeklampsi ; magnezyum sülfat ile nöbet profilaksisi ; akut ağır hipertansiyon tedavisi (IV labetalol, oral nifedipin veya hidralazin) ; laboratuvar: trombosit, karaciğer enzimleri, kreatinin (HELLP) ; 34 hafta üzerinde stabilizasyon sonrası doğum planı
- KB düşürülüp eve gönderilir ; magnezyum yerine diazepam
#7 kilavuz 2 sb-riskli-gebelikler | preeklampsi profilaksisi
S: Preeklampsi açısından yüksek riskli gebede aspirin profilaksisi nasıl verilir?
+ düşük doz aspirin (75–150 mg/gün) ; 12–16. haftadan (ideal 16. haftadan önce) başlanır ; 36. haftaya kadar sürdürülür ; yüksek risk: önceki preeklampsi, kronik HT, diyabet, böbrek / otoimmün hastalık, çoğul gebelik
- 30. haftadan sonra başlanır ; yüksek doz (500 mg) aspirin önerilir
#8 ilac 3 - | magnezyum toksisitesi
S: Magnezyum sülfat infüzyonu alan preeklamptik hastada patella refleksleri alınamıyor ve solunum sayısı 10/dk. Ne yaparsın?
+ magnezyum toksisitesi ; infüzyonun durdurulması ; antidot kalsiyum glukonat (%10, 10 ml IV yavaş) ; serum magnezyum düzeyi, solunum desteği ; oligüride (böbrek yetmezliği) birikim riski
- infüzyon hızı artırılır ; antidot naloksondur
#9 kirmizi 3 sb-acil-obstetrik-bakim | postpartum kanama
S: Vajinal doğum sonrası 800 ml kanama ve gevşek uterus. İlk adımlar?
+ yardım çağır, iki geniş damar yolu, sıvı ; bimanuel uterus masajı ; uterotonikler: oksitosin, ardından metilergonovin (HT yoksa), karboprost / misoprostol ; traneksamik asit (1 g IV, ilk 3 saatte) ; kan ürünleri, mesane boşaltma, 4T (tonus, travma, doku, trombin) değerlendirmesi
- ilk adım histerektomi ; hipertansif hastaya metilergonovin
#10 kilavuz 2 sb-acil-obstetrik-bakim | üçüncü evrenin aktif yönetimi
S: Postpartum kanamanın önlenmesinde doğumun üçüncü evresi nasıl yönetilir?
+ bebeğin doğumundan sonra profilaktik uterotonik (oksitosin 10 IU IM/IV) ; kontrollü kord traksiyonu ; plasenta sonrası uterus tonusunun değerlendirilmesi ; geç kord klempi (1–3 dk) yenidoğan için önerilir
- uterotonik plasenta çıktıktan 1 saat sonra verilir ; rutin fundal bası (Kristeller)
#11 kirmizi 3 - | ektopik gebelik
S: Son adet 7 hafta önce, vajinal lekelenme ve tek taraflı pelvik ağrı, beta-hCG 2500 mIU/ml, TVUSG'de intrauterin gebelik yok. Ne düşünürsün?
+ ektopik gebelik şüphesi (diskriminatif zon üzerinde boş uterus) ; hemodinami ve batın içi kanama değerlendirmesi ; rüptür / instabilitede acil cerrahi ; stabil, uygun kriterlerde metotreksat seçeneği ; Rh negatifse anti-D
- 2 hafta sonra kontrol USG ; düşük tehdidi, istirahat önerilir
#12 ilac 3 - | metotreksat ektopik
S: Ektopik gebelikte metotreksat tedavisi için uygun hasta kriterleri nelerdir?
+ hemodinamik stabil, rüptür bulgusu yok ; beta-hCG düzeyi düşük (genellikle <5000) ; kitle küçük, fetal kalp atımı yok ; izlem uyumu ; kontrendikasyonlar: emzirme, karaciğer / böbrek / kemik iliği bozukluğu, immün yetmezlik
- fetal kalp atımı olan büyük ektopikte ilk seçenek ; tedavi sonrası beta-hCG izlemi gerekmez
#13 kilavuz 2 - | Rh immünoprofilaksi
S: Rh negatif, antikor negatif gebede anti-D immünoglobulin ne zaman uygulanır?
+ 28. haftada rutin antenatal profilaksi ; Rh pozitif bebek doğumundan sonra 72 saat içinde ; düşük, ektopik, invaziv girişim, travma, vajinal kanama sonrası ; fetomaternal kanama miktarına göre ek doz (Kleihauer)
- yalnız ilk gebelikte gerekir ; doğumdan 2 hafta sonra verilir
#14 kirmizi 2 - | azalmış fetal hareket
S: 36 haftalık gebe bebeğinin hareketlerinin azaldığını söylüyor. Yaklaşım?
+ aynı gün değerlendirme ; NST (CTG) ; USG ile fetal büyüme, amniyon sıvısı (gerekirse Doppler) ; anormal bulguda doğum kararı ; kaygı veren tekrarlayan başvurular ciddiye alınır
- normaldir, ertesi hafta kontrole gelsin ; evde soğuk su içip sayması yeterli
#15 kirmizi 3 - | plasenta dekolmanı
S: 32 haftalık gebede ani karın ağrısı, sertleşmiş uterus ve vajinal kanama. Ne düşünürsün?
+ plasenta dekolmanı ; maternal hemodinami, koagülasyon (DİK) ; fetal kalp izlemi ; maternal / fetal tehlikede acil doğum ; USG dekolmanı dışlamaz
- plasenta previa gibi dijital muayene yapılır ; tokoliz ile izlenir
#16 kirmizi 2 - | plasenta previa
S: 30 haftalık gebede ağrısız parlak kırmızı vajinal kanama. İlk yapılmaması gereken nedir?
+ plasenta previa dışlanmadan dijital vajinal muayene yapılmaz ; USG ile plasenta yerleşimi ; maternal stabilizasyon, kan hazırlığı ; antenatal kortikosteroid (gebelik haftasına göre) ; Rh negatifse anti-D
- hemen dijital muayene ile servikal açıklık bakılır ; ayaktan izlem
#17 kilavuz 2 - | antenatal kortikosteroid
S: Erken doğum tehdidinde antenatal kortikosteroid hangi haftalarda önerilir?
+ 24–34. haftalar arasında, 7 gün içinde doğum riski olan gebede ; betametazon 12 mg IM, 24 saat arayla 2 doz (veya deksametazon) ; seçilmiş durumlarda 23 hafta ve 34–36+6 hafta tartışılabilir ; magnezyum sülfat 32 hafta altında fetal nöroproteksiyon
- 37. haftada rutin verilir ; tek doz yeterli
#18 ilac 2 - | tokoliz
S: Erken doğum tehdidinde tokolitik tedavinin amacı ve seçenekleri nelerdir?
+ amaç kortikosteroid etkisi ve transfer için 48 saat kazanmak ; nifedipin veya atosiban ; indometazin 32 hafta altında kısa süreli ; uzun süreli idame tokoliz önerilmez ; kontrendikasyonlar: koryoamniyonit, dekolman, fetal distres
- tokoliz 37. haftaya kadar sürdürülür ; ritodrin ilk seçenektir
#19 kirmizi 3 - | PPROM
S: 30 haftalık gebede erken membran rüptürü, enfeksiyon bulgusu yok. Yaklaşım?
+ ekspektan yönetim ; latent dönem antibiyotiği (ör. ampisilin + eritromisin / azitromisin) ; antenatal kortikosteroid ; 32 hafta altında magnezyum nöroproteksiyon ; koryoamniyonit bulgularının izlemi, 34. haftada doğum planı
- amoksisilin-klavulanat ilk seçenek (NEK riski) ; tokoliz ile 37 haftaya kadar
#20 yaygin 1 - | bulantı kusma gebelik
S: 9 haftalık gebede bulantı-kusma; ilk basamak tedavi?
+ diyet önerileri, sık az öğün ; doksilamin-piridoksin kombinasyonu ilk basamak ; dirençli vakada antihistaminik / metoklopramid / ondansetron (risk-yarar) ; hiperemezis bulgularında (kilo kaybı, ketonüri, dehidratasyon) IV sıvı, tiamin
- gebelikte hiçbir antiemetik kullanılamaz ; hiperemeziste dekstrozdan önce tiamin gereksiz
#21 yaygin 2 - | gebelikte İYE
S: Gebelikte asemptomatik bakteriüri tedavi edilmeli mi?
+ gebelikte asemptomatik bakteriüri taranır ve tedavi edilir ; piyelonefrit ve erken doğum riskini azaltır ; kültüre göre amoksisilin, sefaleksin, nitrofurantoin (term yakını hariç), fosfomisin ; tedavi sonrası kontrol kültürü
- gebelikte asemptomatik bakteriüri tedavi edilmez ; kinolon ilk seçenek
#22 ilac 3 - | gebelikte kontrendike ilaçlar
S: Gebelikte kontrendike olan başlıca ilaçlar hangileridir?
+ ACE inhibitörleri / ARB (2–3. trimester fetotoksik) ; warfarin (embriyopati), heparin tercih ; izotretinoin ve diğer retinoidler ; valproat, metotreksat ; tetrasiklinler ; 3. trimesterde NSAİİ (duktus kapanması)
- ACE inhibitörü gebelikte ilk seçenek antihipertansiftir ; LMWH gebelikte kontrendikedir
#23 ilac 2 - | gebelikte hipertansiyon
S: Kronik hipertansiyonu olan gebede güvenli antihipertansifler nelerdir?
+ metildopa ; labetalol ; nifedipin (uzun etkili) ; ACE inhibitörü / ARB kesilir ; hedef KB yaklaşık 110–140/85 mmHg
- ACE inhibitörüne devam edilir ; diüretik ilk seçenek
#24 kirmizi 3 - | eklampsi
S: Doğum sonrası 2. günde jeneralize nöbet geçiren lohusa. Ne yaparsın?
+ eklampsi (postpartum) ; havayolu, sol yan pozisyon ; magnezyum sülfat yükleme ve idame ; ağır hipertansiyon tedavisi ; diğer nedenler (SVT, PRES) için görüntüleme gerekirse
- diazepam ilk seçenek ; postpartum eklampsi olmaz
#25 yaygin 2 - | anemi gebelik
S: 26 haftalık gebede Hb 9,5 g/dL, ferritin düşük. Tedavi?
+ demir eksikliği anemisi ; oral demir tedavi dozu (yaklaşık 100–200 mg elementer demir/gün veya gün aşırı) ; yanıtsızlık / intolerans / ileri gebelikte IV demir ; 2–4 haftada yanıt değerlendirmesi ; talasemi taşıyıcılığı ayırıcı tanısı
- gebelikte IV demir kontrendikedir ; Hb 9,5 normaldir
#26 kilavuz 2 sb-kanser-tarama-standartlari | Ulusal Kanser Tarama Standartları (baskı doğrulanacak)
S: Türkiye'de serviks kanseri taraması hangi yaş aralığında ve nasıl yapılır?
+ 30–65 yaş arası kadınlar ; HPV-DNA testi (gerekirse smear ile) ; 5 yılda bir ; KETEM ve aile hekimliği aracılığıyla ücretsiz ; pozitif sonuçlarda kolposkopi algoritması
- tarama 18 yaşında her yıl smear ile ; 65 yaş sonrası herkes sürdürür
#27 kilavuz 2 sb-kanser-tarama-standartlari | meme kanseri taraması
S: Türkiye ulusal meme kanseri taramasında mamografi önerisi nedir?
+ 40–69 yaş kadınlar ; 2 yılda bir mamografi ; KETEM aracılığıyla ; yüksek riskli kadınlarda (BRCA vb.) daha erken ve MR ile özel tarama
- 30 yaşından itibaren her yıl mamografi tüm kadınlara ; ulusal tarama USG ile yapılır
#28 yaygin 2 - | anormal smear ASC-US
S: 35 yaşında kadında smear ASC-US, HPV yüksek risk pozitif. Sonraki adım?
+ kolposkopi ; HPV 16/18 genotip pozitifliği riski artırır ; kolposkopik biyopsi ile CIN değerlendirmesi ; HPV negatif ASC-US'de rutin taramaya dönüş / izlem
- 6 ay antibiyotik ve tekrar smear ; doğrudan histerektomi
#29 kilavuz 2 - | HPV aşısı
S: HPV aşısı kimlere önerilir?
+ ideal olarak cinsel aktivite öncesi, 9–14 yaş (2 doz) ; 15 yaş ve üzeri 3 doz ; 26 yaşa kadar yakalama, seçilmiş 27–45 yaş paylaşılan karar ; aşılı kadınlarda da tarama sürer ; ulusal programdaki güncel durum doğrulanmalı
- aşılanan kadınlar taramaya gerek duymaz ; erkeklere önerilmez
#30 yaygin 2 - | PKOS
S: Düzensiz adet, hirsutizm ve over USG'de çok sayıda folikül olan 24 yaşında kadında tanı ve tedavi?
+ Rotterdam kriterleri (2/3: oligo-anovulasyon, klinik / biyokimyasal hiperandrojenizm, polikistik over morfolojisi) ; diğer nedenlerin dışlanması (TSH, prolaktin, 17-OHP) ; yaşam tarzı ve kilo verme ; gebelik istemiyorsa kombine oral kontraseptif ; metabolik tarama (glukoz, lipid)
- tanı için USG tek başına yeterli ; tüm hastalara metformin ilk seçenek
#31 ilac 2 - | ovulasyon indüksiyonu
S: Gebelik isteyen PKOS'lu kadında ovulasyon indüksiyonunda ilk tercih edilen ajan nedir?
+ letrozol ilk seçenek (klomifene göre daha yüksek canlı doğum) ; klomifen sitrat alternatif ; yaşam tarzı / kilo verme ; folikül izlemi ve çoğul gebelik riski ; yanıtsızlıkta gonadotropin / laparoskopik over drilling
- ilk seçenek doğrudan IVF ; metformin tek başına letrozolden üstün
#32 kirmizi 3 - | over torsiyonu
S: 25 yaşında ani başlayan şiddetli tek taraflı pelvik ağrı, bulantı-kusma, 6 cm adneksiyal kitle. Ne yaparsın?
+ over torsiyonu ; Doppler akım varlığı torsiyonu dışlamaz ; acil laparoskopi ; detorsiyon ve overin korunması (renk koyu olsa da) ; ooforektomi istisnai
- Doppler normalse torsiyon dışlanır ; nekrotik görünümde rutin ooforektomi
#33 yaygin 2 - | basit over kisti
S: Premenopozal kadında 4 cm basit görünümlü asemptomatik over kisti. Yaklaşım?
+ fonksiyonel kist olasılığı yüksek ; 6–12 hafta sonra USG kontrol ; rutin CA-125 premenopozalde gerekmez ; şüpheli özellikler (solid alan, papiller yapı, asit) varsa ileri değerlendirme ; IOTA kuralları
- hemen kistektomi ; tüm kistlerde CA-125 ve BT
#34 kirmizi 3 - | postmenopozal kanama
S: 58 yaşında menopozdan 6 yıl sonra vajinal kanama. Yaklaşım?
+ endometriyum kanseri dışlanmalı ; TVUSG ile endometriyal kalınlık (≤4 mm düşük risk) ; endometriyal biyopsi (pipelle) / histeroskopi ; kalıcı / tekrarlayan kanamada kalınlıktan bağımsız örnekleme
- hormon dengesizliği, progesteron verilir ; 6 ay izlem
#35 yaygin 2 - | anormal uterin kanama
S: 42 yaşında ağır menstrüel kanama, Hb 10. Değerlendirme?
+ PALM-COEIN sınıflaması ; gebelik testi, hemogram, ferritin, TSH ; TVUSG (myom, polip, adenomiyozis) ; 45 yaş üstü / risk faktörlerinde endometriyal örnekleme ; tedavi: LNG-RİA, traneksamik asit, NSAİİ, hormonal, cerrahi
- ilk seçenek histerektomi ; değerlendirme gerekmez
#36 kilavuz 2 - | myom
S: Semptomatik myomu olan ve fertilite isteyen 34 yaşında kadında seçenekler?
+ medikal: traneksamik asit, NSAİİ, hormonal ; GnRH analoğu preoperatif kısa süreli ; myomektomi (laparoskopik / histeroskopik submüköz) ; uterin arter embolizasyonu fertilite isteyenlerde tartışmalı ; hasta tercihi ve myom yerleşimi
- fertilite isteyen kadına histerektomi ; myomlar her zaman malignleşir
#37 yaygin 2 - | endometriozis
S: Dismenore ve disparoniden yakınan 28 yaşında kadında endometriozis şüphesinde ilk tedavi?
+ klinik tanı ile ampirik medikal tedavi başlanabilir ; NSAİİ ; progestinler (dienogest) veya kombine oral kontraseptif ; yanıtsızlık / endometrioma / infertilitede laparoskopi ; TVUSG / MR ile derin endometriozis
- tanı için mutlaka laparoskopi gerekir, ampirik tedavi verilmez ; GnRH analoğu süresiz
#38 ilac 2 - | kombine oral kontraseptif kontrendikasyonları
S: Kombine hormonal kontrasepsiyonun mutlak kontrendikasyonları nelerdir?
+ auralı migren ; 35 yaş üstü ve günde ≥15 sigara ; VTE öyküsü / trombofili ; kontrolsüz hipertansiyon ; meme kanseri ; doğum sonrası ilk 3 hafta (emzirmeyen), aktif karaciğer hastalığı
- auralı migren COC endikasyonudur ; sigara içen 40 yaşında kadın için ilk seçenek
#39 ilac 2 - | acil kontrasepsiyon
S: Korunmasız ilişkiden 3 gün sonra başvuran kadına acil kontrasepsiyon seçenekleri?
+ bakır RİA (5 gün içinde, en etkili) ; ulipristal asetat (120 saat içinde) ; levonorgestrel 1,5 mg (72 saat içinde, erken alındıkça etkili) ; vücut ağırlığı etkinliği etkileyebilir ; düzenli kontrasepsiyon danışmanlığı
- acil kontrasepsiyon düşüğe yol açar ; 7 gün sonra da levonorgestrel aynı etkili
#40 yaygin 1 - | vajinal akıntı
S: Kötü kokulu gri-beyaz akıntı, pH 5, whiff testi pozitif. Tanı ve tedavi?
+ bakteriyel vajinoz (Amsel kriterleri) ; metronidazol oral veya vajinal / klindamisin vajinal ; gebelikte semptomatik olan tedavi edilir ; partner tedavisi rutin gerekmez
- partner rutin tedavi edilir ; flukonazol tedavidir
#41 yaygin 1 - | vulvovajinal kandidiyazis
S: Gebe olmayan kadında ilk vulvovajinal kandidiyazis atağında tedavi?
+ tek doz oral flukonazol 150 mg veya topikal azol ; gebelikte topikal azol (7 gün), oral flukonazol önerilmez ; tekrarlayan (yılda ≥4) vakada kültür ve idame tedavisi ; diyabet sorgulama
- gebelikte oral flukonazol ilk seçenek ; partner rutin tedavi edilir
#42 kirmizi 2 - | PID
S: Alt karın ağrısı, servikal hareket hassasiyeti ve ateşi olan 22 yaşında kadın. Yaklaşım?
+ pelvik inflamatuvar hastalık ; gebelik testi ; ampirik tedavi gecikmemeli: seftriakson + doksisiklin + metronidazol ; ağır tablo, tubo-ovaryan abse, gebelik veya oral tedavi yanıtsızlığında yatış ; partner tedavisi ve CYBE taraması
- kültür sonucu beklenir ; RİA mutlaka çıkarılır
#43 tuzak 2 - | RİA ve PID
S: PID tanısı konan RİA'lı hastada RİA'nın hemen çıkarılması gerekir mi?
+ hafif-orta PID'de RİA çıkarılmadan tedavi edilebilir ; 48–72 saatte klinik düzelme yoksa çıkarılması düşünülür ; hasta istemi ; RİA PID için kontrendikasyon değil, aktif enfeksiyonda takılmaz
- her durumda RİA hemen çıkarılır ; RİA'lı kadına antibiyotik verilmez
#44 kilavuz 2 - | menopoz HRT
S: 51 yaşında vazomotor yakınmaları olan, rahmi olan sağlıklı kadında HRT önerisi?
+ 60 yaş altı / menopozdan sonraki 10 yıl içinde başlanan HRT'de yarar-risk genellikle olumlu ; rahmi olan kadında östrojen + progestojen (endometriyal koruma) ; transdermal östrojen VTE riski açısından tercih edilebilir ; kontrendikasyonlar: meme kanseri, VTE, aktif karaciğer hastalığı, açıklanamayan kanama ; bireysel değerlendirme ve yıllık gözden geçirme
- rahmi olan kadına yalnız östrojen ; HRT her kadında kalp hastalığını önlemek için başlanır
#45 tuzak 2 - | WHI sonrası
S: WHI çalışmasından sonra HRT hiçbir kadına verilmemeli mi?
+ WHI sonrası yeniden analizler zamanlama hipotezini destekledi ; uygun seçilmiş genç postmenopozal kadında semptom tedavisi için HRT uygundur ; en düşük etkili doz ve gerekli süre ; kardiyovasküler korunma amaçlı başlanmaz
- HRT tüm kadınlarda kontrendikedir ; HRT kardiyovasküler korunma için önerilir
#46 kirmizi 3 - | over kanseri şüphesi
S: 62 yaşında kadında karın şişkinliği, erken doyma ve pelvik kitle, asit. Yaklaşım?
+ over kanseri şüphesi ; CA-125, RMI hesaplama ; BT / MR ile evreleme ; jinekolojik onkoloji merkezine sevk ; perkütan kitle biyopsisi rutin önerilmez (evre I yayılım)
- IBS, diyet önerisi ; tüm kitlelere perkütan biyopsi
#47 kilavuz 3 sb-kp-sezaryen | SB Sezaryen KP (Haziran 2022)
S: Sezaryende profilaktik antibiyotik ne zaman uygulanmalıdır?
+ cilt insizyonundan önce 60 dakika içinde ; 1. kuşak sefalosporin (sefazolin 2 g, obezde 3 g) ; kord klempinden sonra verilmesi önerilmez ; doğum eylemindeki / membran rüptürlü kadında azitromisin eklenmesi tartışılabilir
- kord klemplendikten sonra verilir ; antibiyotik gereksiz
#48 kilavuz 2 sb-kp-sezaryen | sezaryen sonrası vajinal doğum
S: Bir kez alt segment transvers sezaryen geçirmiş gebede vajinal doğum (VBAC) mümkün mü?
+ uygun seçilmiş hastada VBAC denemesi seçenektir ; başarı oranı yaklaşık %60–80 ; uterus rüptürü riski (~%0,5–1) ; sürekli fetal izlem ve acil sezaryen imkânı olan merkez ; klasik / T insizyon öyküsünde kontrendike
- bir kez sezaryen olan her zaman sezaryen olur ; prostaglandinle indüksiyon güvenlidir
#49 kirmizi 3 - | kord sarkması
S: Membran rüptürü sonrası fetal bradikardi ve vajende kord palpe ediliyor. Ne yaparsın?
+ kord prolapsusu ; yardım çağır, acil sezaryen ; prezente kısmın elle yukarı itilmesi / mesane doldurma ; diz-dirsek veya Trendelenburg ; kordun manipüle edilmemesi
- kordu geri yerleştirmeye çalış ; NST ile 30 dk izle
#50 kirmizi 3 - | omuz distosisi
S: Baş doğduktan sonra omuz takıldı (kaplumbağa belirtisi). Ne yaparsın?
+ omuz distosisi ; yardım çağır ; McRoberts manevrası + suprapubik bası ; iç rotasyon manevraları, arka kolun doğurtulması ; fundal bası yapılmaz, aşırı baş traksiyonundan kaçınılır
- fundal bası (Kristeller) uygulanır ; başa kuvvetli traksiyon
#51 yaygin 2 - | doğum indüksiyonu
S: Komplike olmayan gebelikte postterm nedeniyle indüksiyon ne zaman önerilir?
+ 41. hafta civarında indüksiyon önerilir (41+0–42+0) ; servikal olgunluk (Bishop skoru) ; olgunlaşmamış serviks için prostaglandin / mekanik yöntem ; 41 hafta sonrası fetal iyilik izlemi
- 43. haftaya kadar beklenir ; tüm gebeler 37. haftada indüklenir
#52 kirmizi 2 - | koryoamniyonit
S: Doğum eylemindeki gebede 38,8 °C ateş, maternal taşikardi ve kötü kokulu amniyon sıvısı. Yaklaşım?
+ intraamniyotik enfeksiyon (koryoamniyonit) ; geniş spektrumlu antibiyotik (ampisilin + gentamisin) ; doğumun hızlandırılması (sezaryen yalnız obstetrik endikasyonla) ; yenidoğan ekibinin bilgilendirilmesi
- antibiyotik doğumdan sonraya bırakılır ; koryoamniyonit tek başına acil sezaryen endikasyonu
#53 kilavuz 2 - | GBS
S: Grup B streptokok için intrapartum antibiyotik profilaksisi kimlere verilir?
+ 35–37. haftada GBS kolonizasyonu saptanan gebeler ; bu gebelikte GBS bakteriürisi ; önceki bebekte GBS hastalığı ; durum bilinmiyorsa risk faktörleri (erken doğum, uzamış rüptür ≥18 saat, ateş) ; penisilin / ampisilin, alerjide sefazolin / klindamisin (duyarlılıkla)
- tüm gebelere rutin oral antibiyotik ; sezaryen planlanan, eylemde olmayan, membranı sağlam gebeye profilaksi
#54 yaygin 2 - | düşük
S: 8 haftalık gebede tam olmayan düşük; hemodinami stabil. Yönetim seçenekleri?
+ ekspektan, medikal (misoprostol) veya cerrahi (vakum aspirasyon) seçenekleri ; hasta tercihi ve klinik duruma göre ; ağır kanama / enfeksiyonda cerrahi ; Rh negatifse anti-D değerlendirmesi ; psikolojik destek
- tüm düşüklerde küretaj zorunlu ; misoprostol kontrendike
#55 yaygin 2 - | tekrarlayan gebelik kaybı
S: Üç ardışık erken gebelik kaybı yaşayan kadında hangi tetkikler yapılır?
+ antifosfolipid antikor sendromu (lupus antikoagülanı, antikardiyolipin, anti-β2GP1) ; uterin anomali değerlendirmesi (3D USG / histeroskopi) ; parental karyotip (seçilmiş) ; TSH, glukoz ; kalıtsal trombofili rutin taranmaz
- tüm hastalara rutin kalıtsal trombofili paneli ve tedavisi ; progesteron her vakada etkili
#56 ilac 3 - | APS gebelik
S: Obstetrik antifosfolipid sendromu tanılı gebede tedavi?
+ düşük doz aspirin ; profilaktik dozda düşük molekül ağırlıklı heparin ; gebelik boyunca ve postpartum 6 hafta ; tromboz öyküsünde terapötik doz ; warfarin gebelikte kullanılmaz
- warfarin ilk seçenek ; tedaviye gerek yok
#57 kirmizi 2 - | molar gebelik
S: 10 haftalık gebede kanama, beta-hCG çok yüksek, USG'de kar fırtınası görünümü. Yönetim?
+ komplet mol hidatiform ; vakum aspirasyon ile boşaltma ; histopatoloji ; boşaltma sonrası haftalık beta-hCG izlemi ve normalleşme sonrası takip ; izlem süresince güvenilir kontrasepsiyon
- beta-hCG izlemi gerekmez ; medikal düşük (misoprostol) ilk seçenek
#58 kilavuz 2 - | prenatal tarama
S: İlk trimester kombine tarama testi neleri içerir?
+ 11–14. haftada ense saydamlığı (NT) ; serum PAPP-A ve serbest β-hCG ; maternal yaşla birlikte risk hesabı ; yüksek riskte invaziv tanı (CVS / amniyosentez) veya NIPT ; NIPT tarama testidir, tanı değil
- NIPT tanı testidir, pozitifse sonlandırma yapılır ; NT 20. haftada ölçülür
#59 yaygin 2 - | kanama 1. trimester
S: 6 haftalık gebede hafif vajinal kanama, beta-hCG 1200, USG'de gebelik görülmüyor. Ne yaparsın?
+ yeri belirsiz gebelik ; 48 saat sonra beta-hCG tekrarı ; uygun artış ve diskriminatif zona ulaşınca USG ; ektopik bulguları açısından bilgilendirme ; hemodinamik instabilitede acil değerlendirme
- düşük kesin, küretaj yapılır ; ektopik dışlanmadan metotreksat
#60 kirmizi 3 - | HELLP
S: 36 haftalık preeklamptik gebede trombosit 75.000, AST/ALT yüksek, hemoliz bulguları. Yaklaşım?
+ HELLP sendromu ; maternal stabilizasyon, magnezyum sülfat ; doğum (gebelik haftası nedeniyle) ; koagülasyon, karaciğer hematomu açısından izlem ; trombosit düzeyine göre anestezi planı
- 40. haftaya kadar izlem ; trombosit yükseltmek için rutin steroid yeterli
#61 yaygin 2 - | gebelikte tiroid
S: Hipotiroidi nedeniyle levotiroksin kullanan kadın gebe kaldı. Ne yapmalı?
+ gebelik saptanır saptanmaz levotiroksin dozu yaklaşık %25–30 artırılır (haftada 2 ek doz) ; TSH 4 haftada bir izlem ; trimester spesifik hedefler ; doğum sonrası gebelik öncesi doza dönüş
- gebelikte doz azaltılır ; TSH izlemi gerekmez
#62 sgk 2 sgk-sut | SUT tüp bebek (güncel madde doğrulanacak)
S: SGK'nın yardımcı üreme tedavisi (IVF) ödemesi için genel koşullar nelerdir?
+ kadının yaş sınırı (40 yaş altı) ; belirli süre evlilik ve genel sağlık sigortalılığı / prim gün koşulu ; diğer tedavi yöntemlerinin başarısız olması ve tıbbi endikasyonun sağlık kurulu raporuyla belgelenmesi ; ödenen deneme sayısının sınırlı olması ; ayrıntılar güncel SUT'tan doğrulanmalı
- her yaşta sınırsız deneme ödenir ; rapor gerekmez
#63 sgk 2 sgk-sut | SUT; doğum yöntemi
S: SGK geri ödemesinde normal doğum ve sezaryen konusunda hekimin bilmesi gereken genel çerçeve nedir?
+ işlem bedelleri SUT ekinde tanımlı ; sezaryen endikasyonunun tıbbi kayıtta belgelenmesi ; SB'nin normal doğumu teşvik politikaları ve sezaryen oranı izlemi ; ayrıntılar güncel SUT ve SB düzenlemelerinden doğrulanmalı
- isteğe bağlı sezaryen için endikasyon yazmak gerekmez ; sezaryen için SGK ödeme yapmaz
#64 tuzak 2 - | rutin epizyotomi
S: İlk doğumunu yapan kadında rutin epizyotomi önerilir mi?
+ rutin epizyotomi önerilmez ; seçici / endikasyonla (fetal distres, operatif doğum) ; mediolateral teknik tercih ; perine koruma teknikleri
- tüm primiparlara rutin epizyotomi ; median epizyotomi 3.–4. derece yırtığı azaltır
#65 tuzak 2 - | rutin perine tıraşı / lavman
S: Doğum eyleminde rutin perine tıraşı ve lavman yapılmalı mı?
+ rutin perine tıraşı ve lavman önerilmez ; enfeksiyonu azaltmaz ; kadının konforu ve tercihi ; doğumda serbest pozisyon ve oral sıvı alımı desteklenir
- enfeksiyonu önlemek için rutin lavman ; eylemde oral alım tamamen yasak
#66 kilavuz 2 sb-dogum-sonu-bakim | Doğum Sonu Bakım Yönetim Rehberi
S: SB doğum sonu bakımında lohusa en az kaç kez izlenir?
+ doğum sonrası en az 3 izlem (yaygın uygulama: ilk 24 saat içinde, 2–5. gün, 30–42. gün) ; kanama, enfeksiyon, KB, emzirme ve ruh hali değerlendirmesi ; kontrasepsiyon danışmanlığı ; doğum sonrası depresyon taraması ; güncel rehberden doğrulanmalı
- doğum sonrası izlem gerekmez ; tek kontrol 6. ayda
#67 kirmizi 2 - | postpartum depresyon / psikoz
S: Doğumdan 1 hafta sonra uykusuzluk, konfüzyon, halüsinasyon ve bebeğe zarar verme düşünceleri. Yaklaşım?
+ postpartum psikoz psikiyatrik acildir ; anne ve bebeğin güvenliği ; acil psikiyatri ve genellikle yatış ; bipolar bozukluk öyküsü sorgulanır ; organik nedenlerin dışlanması
- doğum hüznüdür, kendiliğinden geçer ; anne evde bebekle yalnız bırakılır
#68 ilac 2 - | emzirmede ilaçlar
S: Emziren annede güvenle kullanılabilecek analjezikler hangileridir?
+ parasetamol ve ibuprofen güvenli ; kodein önerilmez (ultra hızlı metabolizör, bebekte solunum depresyonu) ; aspirin yüksek doz kaçınılır ; LactMed gibi güncel kaynaklarla kontrol
- emzirirken hiçbir ilaç kullanılamaz ; kodein ilk seçenek
#69 yaygin 2 - | mastit
S: Emziren annede memede ağrılı kızarıklık ve 38,5 °C ateş. Tedavi?
+ laktasyonel mastit ; emzirmenin / sütün boşaltılmasının sürdürülmesi ; analjezi, soğuk uygulama ; 12–24 saatte düzelmezse antistafilokokal antibiyotik (sefaleksin / dikloksasilin) ; fluktuasyonda abse, USG ve drenaj
- emzirme kesilmeli ; antibiyotik sürecinde süt atılmalı
#70 kirmizi 3 - | postpartum VTE
S: Sezaryen sonrası 5. günde tek taraflı bacak şişliği ve nefes darlığı. Yaklaşım?
+ derin ven trombozu / pulmoner emboli ; ileri tetkik (Doppler USG, BT pulmoner anjiyo veya V/Q) ; şüphede tetkik beklerken terapötik LMWH ; emziren annede LMWH / warfarin güvenli ; risk değerlendirmesi ve tromboprofilaksi
- D-dimer normal sonuçla dışlanır ; DOAC emziren annede ilk seçenek
#71 kilavuz 2 - | gebelikte tromboprofilaksi
S: Sezaryen sonrası hangi hastalarda LMWH profilaksisi verilir?
+ VTE risk değerlendirmesi tüm gebe / lohusalarda ; acil sezaryen ve ek risk faktörlerinde (obezite, ileri yaş, preeklampsi, enfeksiyon) postpartum LMWH ; süre risk düzeyine göre (10 gün – 6 hafta) ; erken mobilizasyon, hidrasyon
- hiçbir sezaryende profilaksi gerekmez ; aspirin LMWH'nin yerine geçer
#72 yaygin 2 - | infertilite değerlendirme
S: 1 yıldır gebe kalamayan çiftte ilk değerlendirme?
+ 35 yaş üstünde 6 ay sonra değerlendirme ; semen analizi ; ovulasyon (luteal progesteron, adet öyküsü), over rezervi (AMH) ; tubal açıklık (HSG) ; TSH, prolaktin
- yalnız kadın değerlendirilir ; semen analizi en son yapılır
#73 ilac 3 - | OHSS
S: IVF sonrası karın şişkinliği, kilo artışı, oligüri ve asit gelişen hasta. Ne düşünürsün?
+ over hiperstimülasyon sendromu ; hematokrit, elektrolit, böbrek fonksiyonu, USG ; sıvı dengesi, tromboprofilaksi ; ağır vakada yatış, parasentez ; önlemede GnRH agonist tetikleme / freeze-all
- bol diüretik verilir ; acil laparotomi ile over çıkarılır
#74 kirmizi 2 - | maternal sepsis
S: Doğum sonrası 3. günde ateş, taşikardi, hipotansiyon ve kötü kokulu lohia. Yaklaşım?
+ maternal sepsis (endometrit) ; sepsis paketi: kültürler, laktat, ilk saatte geniş spektrumlu IV antibiyotik ; sıvı resüsitasyonu ; kaynak kontrolü (retansiyon, abse) ; obstetrik erken uyarı skoru
- oral antibiyotikle eve gönder ; antibiyotik kültür sonucu beklenerek başlanır
#75 yaygin 2 - | gebelikte aşılar
S: Gebelikte hangi aşılar önerilir, hangileri kontrendikedir?
+ inaktive influenza aşısı önerilir ; tetanoz-difteri (Td) aşısı (SB programına göre) ; boğmaca (Tdap) önerileri güncel programa göre ; canlı aşılar (KKK, suçiçeği) gebelikte kontrendike ; gebelik öncesi kızamıkçık bağışıklığı
- gebelikte influenza aşısı kontrendikedir ; KKK gebelikte güvenle yapılır
#76 kirmizi 3 - | gebelikte travma
S: 30 haftalık gebe trafik kazası geçirdi, stabil görünüyor. Değerlendirme?
+ maternal stabilizasyon önceliklidir, uterusu sola itme ; en az 4 saat (gerekirse 24 saat) CTG izlemi ; dekolman bulguları ; Rh negatifse anti-D (Kleihauer) ; gerekli görüntüleme gebelik nedeniyle esirgenmez
- stabil ise CTG gerekmez ; BT gebelikte kesin kontrendike
#77 kilavuz 2 - | intrauterin gelişme geriliği
S: 32 haftalık gebede tahmini fetal ağırlık 3. persentilin altında. Yaklaşım?
+ fetal büyüme kısıtlılığı ; umbilikal arter Doppler (AEDF / REDF), MCA, duktus venozus ; amniyon sıvısı ve NST ; doğum zamanlaması Doppler bulgularına göre ; preeklampsi ve diğer nedenlerin değerlendirilmesi
- term'e kadar beklenir ; Doppler gereksiz
#78 tuzak 3 - | yatak istirahati
S: Erken doğum riski olan veya preeklampsili gebeye katı yatak istirahati önerilmeli mi?
+ rutin katı yatak istirahati erken doğumu / preeklampsiyi önlemede etkili değildir ; VTE, kas kaybı, psikososyal zarar riski ; kısa servikste progesteron, seçilmiş vakada serklaj
- tam yatak istirahati erken doğumu önler ; tüm gebeler 3. trimesterde yatmalı
#79 ilac 2 - | progesteron kısa serviks
S: 22 haftada tesadüfen serviks uzunluğu 15 mm saptanan tekil gebede ne önerirsin?
+ vajinal progesteron ; serklaj seçilmiş hastalarda (önceki erken doğum öyküsü) ; enfeksiyon değerlendirmesi ; pesser kanıtı tartışmalı
- yatak istirahati ; 17-OHPC tüm gebelere rutin
#80 kirmizi 2 - | amniyotik sıvı embolisi
S: Doğum sırasında ani hipoksi, hipotansiyon ve koagülopati gelişen hasta. Ne düşünürsün?
+ amniyotik sıvı embolisi ; KPR ve ileri yaşam desteği ; DİK yönetimi, kan ürünleri ; 4 dakikada yanıt yoksa perimortem sezaryen (20 haftanın üstünde) ; yoğun bakım
- vazovagal reaksiyon, izlem ; perimortem sezaryen kontrendike
#81 yaygin 2 - | gebelikte kaşıntı
S: 32 haftalık gebede avuç içi ve ayak tabanında belirgin kaşıntı, döküntü yok. Ne düşünürsün?
+ intrahepatik gebelik kolestazı ; safra asitleri ve karaciğer enzimleri ; ursodeoksikolik asit semptomları azaltır ; safra asidi düzeyine göre doğum zamanlaması (ölü doğum riski) ; doğum sonrası düzelme
- kuru cilt, nemlendirici yeterli ; safra asidi ölçümü gereksiz
#82 ilac 2 - | antiepileptik gebelik
S: Lamotrijin kullanan epileptik kadın gebelik planlıyor. Öneriler?
+ gebelik öncesi nöroloji ile tedavinin gözden geçirilmesi ; valproattan kaçınılması ; yüksek doz folik asit (4–5 mg) ; gebelikte lamotrijin düzeyi düşer, düzey izlemi ve doz ayarı ; ani ilaç kesilmemesi
- gebelik saptanınca antiepileptik kesilir ; valproat gebelikte tercih edilir
#83 kirmizi 2 - | gebelikte baş ağrısı
S: 3. trimesterde ani başlayan çok şiddetli baş ağrısı ve görme bozukluğu. Ne düşünürsün?
+ preeklampsi / eklampsi ; serebral venöz tromboz, subaraknoid kanama, PRES ; KB ölçümü, proteinüri, laboratuvar ; nörolojik bulguda görüntüleme (MR / BT) ; acil değerlendirme
- gebelik migreni, parasetamol ve eve ; görüntüleme gebelikte yasak
#84 yaygin 2 - | dismenore
S: Primer dismenore yakınması olan 18 yaşında kadında ilk tedavi?
+ NSAİİ (adet başlangıcından veya hemen önce) ; kombine oral kontraseptif ; ısı uygulaması, egzersiz ; yanıtsızlıkta sekonder nedenler (endometriozis) araştırılır
- ilk seçenek opioid ; tanısal laparoskopi her hastaya
#85 kilavuz 2 - | amenore
S: 25 yaşında 6 aydır adet görmeyen kadında ilk tetkikler?
+ gebelik testi ; TSH, prolaktin ; FSH / LH, östradiol ; androjen düzeyleri (hiperandrojenizm bulgusu varsa) ; progesteron challenge ; hipotalamik amenore (kilo, egzersiz, stres) sorgulanır
- gebelik testi gereksiz ; ilk tetkik hipofiz MR
#86 kirmizi 2 - | hiperprolaktinemi
S: Galaktore ve amenore ile gelen hastada prolaktin 120 ng/ml. Yaklaşım?
+ ilaçlar, hipotiroidi, gebelik dışlanmalı ; hipofiz MR (prolaktinoma) ; kabergolin birinci seçenek ; makroadenomda görme alanı ; makroprolaktin değerlendirmesi
- MR gereksiz ; ilk tedavi cerrahi
#87 yaygin 2 - | pelvik organ prolapsusu
S: Semptomatik evre 2 sistoseli olan 60 yaşında kadında seçenekler?
+ pelvik taban kas eğitimi ; vajinal pesser ; vajinal östrojen (atrofide) ; cerrahi onarım semptom ve hasta tercihine göre ; transvajinal meş kullanımı sınırlı ve dikkatli
- tüm hastalara meşle onarım ; asemptomatik hafif prolapsusta cerrahi
#88 yaygin 2 - | stres inkontinans
S: Öksürme ve hapşırmayla idrar kaçıran kadında ilk basamak tedavi?
+ pelvik taban kas egzersizleri (en az 3 ay, denetimli) ; kilo verme, sıvı / kafein düzenlemesi ; mesane günlüğü ; yanıtsızlıkta midüretral sling ; sıkışma tipi ile karışık inkontinansın ayrımı
- ilk tedavi antikolinerjik ; hemen cerrahi
#89 ilac 3 - | antikolinerjik yaşlı
S: Aşırı aktif mesanesi olan 78 yaşında kadında antikolinerjik ilaç seçerken nelere dikkat edersin?
+ antikolinerjik yük ve bilişsel bozulma riski ; mirabegron alternatif (KB izlemi) ; dar açılı glokom, idrar retansiyonu kontrendikasyonlar ; davranışsal tedavi ve mesane eğitimi önce
- oksibutinin yaşlıda en güvenli seçenek ; bilişsel risk yoktur
#90 kilavuz 3 sb-rehber-meme-kanseri | SB Meme Kanseri Klinik Rehberi (Revizyon 2024)
S: BRCA1 mutasyonu taşıyan 35 yaşında kadına önerilecek risk azaltıcı yaklaşımlar?
+ 25 yaş civarından itibaren yıllık meme MR, 30 yaşından itibaren MR + mamografi ; risk azaltıcı salpingo-ooferektomi (BRCA1'de 35–40 yaş, doğurganlık tamamlandıktan sonra) ; risk azaltıcı mastektomi seçeneği ; genetik danışmanlık ve aile taraması
- yalnız 50 yaşından sonra mamografi yeterli ; ooferektomi 60 yaşından sonra
#91 kirmizi 2 - | vulvar lezyon
S: 70 yaşında kadında kaşıntılı, beyaz, kalınlaşmış vulvar lezyon ve yeni gelişen ülser. Yaklaşım?
+ liken sklerozus zemininde vulvar kanser şüphesi ; biyopsi ; liken sklerozusta güçlü topikal steroid (klobetazol) ; uzun süreli izlem
- mantar enfeksiyonu, antifungal krem ; biyopsi gereksiz
#92 yaygin 1 - | kontrasepsiyon seçimi
S: Emziren, doğumdan 6 hafta sonra kontrasepsiyon isteyen kadına öneriler?
+ yalnız progestinli yöntemler (mini hap, implant, enjeksiyon) uygun ; RİA (bakır / LNG) ; laktasyonel amenore yöntemi koşulları (ilk 6 ay, tam emzirme, adet yok) ; kombine yöntemler emzirmede genellikle 6 haftadan / 6 aydan sonra (kriterlere göre)
- emzirirken hiçbir yöntem gerekmez ; kombine oral kontraseptif ilk seçenek
#93 ilac 2 - | enzim indükleyici etkileşim
S: Rifampisin veya karbamazepin kullanan kadında oral kontraseptifin etkinliği değişir mi?
+ enzim indükleyiciler kombine ve progestinli hapların etkinliğini azaltır ; RİA (bakır / LNG) veya depo MPA önerilir ; tedavi bittikten sonra 28 gün ek yöntem ; acil kontrasepsiyonda bakır RİA tercih
- etkileşim yoktur ; doz iki katına çıkarılarak sorun çözülür
#94 kirmizi 3 - | servikal kanser semptomu
S: 45 yaşında kadında postkoital kanama ve serviks üzerinde kırılgan lezyon. Ne yaparsın?
+ servikal kanser şüphesi ; lezyondan biyopsi (smear sonucunu beklemeden) ; kolposkopi ; evreleme ; jinekolojik onkoloji sevki
- servisit, antibiyotik ve 3 ay sonra kontrol ; normal smear kanseri dışlar
#95 tuzak 2 - | rutin smear gebelik
S: Gebede servikal tarama zamanı gelmişse gebelik süresince smear / HPV testi yapılabilir mi?
+ taraması gelmiş gebede servikal sitoloji güvenle yapılabilir ; kolposkopi gebelikte güvenlidir, endoservikal küretaj yapılmaz ; yüksek dereceli lezyonun tedavisi çoğunlukla doğum sonrasına ertelenir (invaziv kanser dışlanarak)
- gebelikte smear düşüğe yol açar, yapılmaz ; CIN 2-3 gebelikte hemen konizasyonla tedavi edilir
#96 yaygin 2 - | gebelikte reflü / kabızlık
S: Gebelikte mide yanması için hangi tedaviler güvenlidir?
+ yaşam tarzı ve diyet ; antasitler (kalsiyum / magnezyum içeren, kısa süreli) ; H2 blokerler ve PPI gerektiğinde kullanılabilir ; sodyum bikarbonat ve alüminyum yüksek dozdan kaçınma
- gebelikte PPI kesin kontrendike ; sodyum bikarbonat ilk seçenek
#97 kilavuz 2 - | çoğul gebelik
S: Monokoryonik diamniyotik ikiz gebelikte izlem özellikleri nelerdir?
+ koryonisitenin ilk trimesterde belirlenmesi ; 16. haftadan itibaren 2 haftada bir USG ; ikizden ikize transfüzyon sendromu (TTTS) ve selektif büyüme kısıtlılığı izlemi ; fetal tıp merkezi ile işbirliği ; doğum zamanlaması (genellikle 36–37. hafta)
- dikoryonik gibi aylık izlem yeterli ; TTTS dikoryonik ikizde sık
#98 kirmizi 2 - | travay distosi
S: Aktif doğum eyleminde 4 saattir servikal açıklık ilerlemiyor, membranlar açık, kontraksiyonlar yeterli. Yaklaşım?
+ aktif fazda duraklama (6 cm üzeri, yeterli kontraksiyonla ≥4 saat) ; sefalopelvik uyumsuzluk / malpozisyon değerlendirmesi ; sezaryen endikasyonu ; yetersiz kontraksiyonda oksitosin ; fetal iyilik izlemi
- 12 saat daha beklenir ; fundal bası uygulanır
#99 ilac 2 - | oksitosin
S: Doğum eyleminde oksitosin kullanımında en önemli riskler nelerdir?
+ uterus hiperstimülasyonu / taşisistoli ve fetal distres ; uterus rüptürü (özellikle skarlı uterus) ; su intoksikasyonu (yüksek doz, uzun süre) ; düşük dozla başlayıp titrasyon, sürekli CTG
- oksitosin bolus olarak hızla verilir ; CTG izlemi gerekmez
#100 tuzak 3 - | rutin USG sayısı
S: Komplike olmayan gebelikte her vizitte USG yapılması gebelik sonuçlarını iyileştirir mi?
+ rutin önerilen USG'ler: ilk trimester (tarih / NT), 18–22. hafta ayrıntılı anomali taraması ; düşük riskli gebelikte 3. trimester rutin USG'nin perinatal sonucu iyileştirdiğine dair kanıt sınırlı ; endikasyonla ek USG ; gereksiz tetkik maliyet ve kaygı yaratır
- her vizitte USG perinatal mortaliteyi azaltır ; anomali taraması gerekmez
`,
} satisfies BankaKaynagi
