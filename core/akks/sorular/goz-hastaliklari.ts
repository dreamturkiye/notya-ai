import type { BankaKaynagi } from '../banka'

/** AKKS — Göz Hastalıkları. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'goz-hastaliklari',
  onek: 'GOZ',
  metin: String.raw`
#1 kirmizi 3 - | akut açı kapanması
S: Ani şiddetli göz ağrısı, bulanık görme, ışık etrafında halolar, bulantı; göz kırmızı, pupilla orta dilate. Yaklaşım?
+ akut açı kapanması glokomu ; GİB ölçümü ; topikal beta bloker, alfa agonist, pilokarpin ; sistemik asetazolamid / mannitol ; lazer periferik iridotomi (diğer göze de profilaktik)
- midriyatik damla ; gastroenterit tanısıyla takip
#2 kirmizi 3 - | santral retinal arter tıkanıklığı
S: Ani ağrısız tek taraflı görme kaybı, fundusta kiraz kırmızısı makula. Ne yaparsın?
+ santral retinal arter tıkanıklığı ; inme eşdeğeri, acil inme değerlendirmesi ; dev hücreli arterit dışlanması (yaşlıda ESH / CRP) ; embolik kaynak araştırması (karotis, kardiyak) ; zaman kritik
- rutin poliklinik randevusu ; yalnız göz damlası
#3 kirmizi 2 - | retina dekolmanı
S: Yeni başlayan uçuşmalar, ışık çakmaları ve görme alanında perde. Yaklaşım?
+ retina yırtığı / dekolmanı ; dilate fundus muayenesi aynı gün ; yırtıkta lazer / kriyopeksi, dekolmanda cerrahi ; makula tutulmadan acil
- vitreus uçuşmaları zararsız, izlem ; 1 ay sonra kontrol
#4 kirmizi 3 - | kimyasal yanık
S: Göze alkali madde kaçan hastada ilk müdahale?
+ hemen bol irrigasyon (en az 30 dk, pH nötr olana kadar) ; topikal anestezik sonrası kapak altı forniksin temizlenmesi ; pH kontrolü ; ardından oftalmoloji acil değerlendirme
- önce oftalmoloji muayenesi için beklenir ; nötralize edici asit damlatılır
#5 tuzak 2 - | steroidli damla kırmızı göz
S: Nedeni belirsiz kırmızı göze steroidli antibiyotik damla vermek uygun mu?
+ tanı olmadan steroidli damla verilmez ; herpetik keratit kötüleşir, glokom ve katarakt riski ; biyomikroskopik muayene ; floresein boyama
- steroidli damla tüm kırmızı gözlerde güvenli ; antibiyotikle birlikteyse sorun yok
#6 yaygin 2 - | viral konjonktivit
S: Sulu akıntı, preauriküler LAP ve tek gözden diğerine geçen kırmızılık. Yaklaşım?
+ adenoviral konjonktivit ; destekleyici (soğuk kompres, suni gözyaşı) ; bulaştırıcılık ve hijyen ; antibiyotik gereksiz ; görme azalması / psödomembran / keratitte göz uzmanı
- topikal antibiyotik rutin ; steroid ilk seçenek
#7 kilavuz 2 sb-kp-diyabet | SB Diyabet KP 2019, Bölüm 4.4 Retinopati
S: Tip 2 diyabetlide diyabetik retinopati taraması nasıl yapılır?
+ tanı anında dilate fundus muayenesi ; retinopati yoksa yıllık (seçilmişlerde 1–2 yıl) ; gebelikte trimesterde bir ; glisemi, KB, lipid kontrolü ; DME / proliferatif retinopatide anti-VEGF / lazer
- ilk muayene tanıdan 5 yıl sonra ; görme iyiyse muayene gereksiz
#8 kilavuz 3 sb-kp-rop-2026 | SB ROP KP 2026
S: Prematüre retinopatisi taraması kimlere yapılır?
+ belirli gestasyon haftası ve doğum ağırlığı altındaki bebekler (Türkiye protokol eşiklerine göre) ; risk faktörleri (oksijen, sepsis) varsa daha büyük bebekler ; ilk muayene zamanlaması postnatal / postmenstrüel haftaya göre ; tedavi: lazer / anti-VEGF
- yalnız 28 hafta altı taranır ; taramaya taburculukta başlanır
#9 yaygin 2 - | primer açık açılı glokom
S: GİB 26 mmHg, optik disk çukurlaşması ve görme alanı defekti olan hastada tedavi?
+ primer açık açılı glokom ; prostaglandin analoğu ilk seçenek ; hedef GİB ; görme alanı ve OCT ile izlem ; yetersizlikte ek damla, SLT lazer, cerrahi
- görme normalse tedavi gerekmez ; tedavi görme kaybını geri döndürür
#10 ilac 2 - | topikal beta bloker
S: Astımlı hastada glokom için timolol damla verilir mi?
+ topikal beta blokerler sistemik emilimle bronkospazm yapabilir ; astım / KOAH ve bradikardide kaçınılır ; nazolakrimal oklüzyon ; alternatif prostaglandin analoğu
- göz damlası sistemik etki yapmaz ; astımda güvenli
#11 kirmizi 2 - | optik nörit
S: Göz hareketiyle artan ağrı ve görme kaybı, RAPD pozitif genç kadın. Yaklaşım?
+ optik nörit ; MS açısından beyin MR ; IV metilprednizolon iyileşmeyi hızlandırır (uzun dönem görme değişmez) ; oral düşük doz prednizon tek başına önerilmez ; NMOSD / MOG antikor
- oral düşük doz prednizon tek başına ; MR gereksiz
#12 kirmizi 2 - | papilödem
S: Baş ağrısı ve bilateral optik disk ödemi. Ne yaparsın?
+ papilödem, kafa içi basınç artışı ; acil beyin görüntüleme (MR + venografi) ; sonra LP açılış basıncı ; İİH (idiyopatik) tanısı dışlama ile ; görme alanı izlemi
- migren, analjezik ; LP görüntülemeden önce
#13 yaygin 2 - | katarakt
S: Görmesi günlük yaşamını etkileyen kataraktlı hastada cerrahi zamanlaması?
+ fonksiyonel bozulma cerrahi kararı belirler ; fakoemülsifikasyon + göz içi lens ; biyometri ; antikoagülan genellikle kesilmez (topikal / sub-Tenon anestezi) ; alfa bloker (tamsulosin) — floppy iris riski
- katarakt "olgunlaşana" kadar beklenmeli ; tamsulosin önemsiz
#14 kilavuz 3 sb-kp-katarakt-2017 | SB Katarakt Cerrahisi KP (Mayıs 2017)
S: Katarakt cerrahisi sonrası endoftalmi bulguları ve yaklaşım?
+ ağrı, görme azalması, hipopiyon (genellikle ilk günler) ; acil göz değerlendirmesi ; vitreus örneği ve intravitreal antibiyotik ; ağır vakada vitrektomi ; intrakameral antibiyotik profilaksisi
- normal postop inflamasyon, kontrol 1 hafta sonra ; yalnız topikal damla
#15 yaygin 2 - | yaş tip YBMD
S: Yaşa bağlı makula dejenerasyonunda ani metamorfopsi. Tedavi?
+ neovasküler (yaş) YBMD ; OCT / anjiyografi ; intravitreal anti-VEGF ; erken tedavi görmeyi korur ; kuru tipte AREDS2 desteği (seçilmiş)
- vitamin desteği yaş tipi tedavi eder ; izlem yeterli
#16 sgk 2 sgk-sut | SUT anti-VEGF (güncel madde doğrulanacak)
S: İntravitreal anti-VEGF tedavisinin SGK tarafından karşılanmasında genel koşullar nelerdir?
+ endikasyonların (yaş YBMD, DME, RVO) OCT / anjiyografiyle belgelenmesi ; göz hastalıkları uzmanı / sağlık kurulu raporu ; doz sayısı ve izlem kuralları ; güncel SUT'tan doğrulanmalı
- herkese raporsuz ; sınırsız enjeksiyon ödenir
#17 kirmizi 2 - | herpetik keratit
S: Floresein boyamada dendritik ülser görülen hasta. Tedavi?
+ herpes simpleks epitelyal keratit ; topikal antiviral (gansiklovir jel) veya oral asiklovir ; steroid verilmez ; izlem
- steroidli damla ; antibiyotik yeterli
#18 kirmizi 3 - | kontakt lens keratit
S: Kontakt lens kullanan hastada ağrılı kırmızı göz ve kornea infiltratı. Yaklaşım?
+ bakteriyel (Pseudomonas) / Acanthamoeba keratit ; lens kullanımının bırakılması ; kornea kazıntısı / kültür ; yoğun topikal antibiyotik ; acil göz değerlendirmesi
- lense devam, suni gözyaşı ; steroid damla
#19 yaygin 2 - | kuru göz
S: Kuru göz yakınmasında ilk basamak?
+ suni gözyaşları (koruyucusuz), kapak hijyeni ; çevre / ekran düzenlemeleri ; meibomian disfonksiyonda sıcak kompres ; dirençte siklosporin, punktal tıkaç ; ilaç kaynaklı nedenler
- steroid damla uzun süreli ; tedavi gerekmez
#20 kirmizi 2 - | orbital selülit
S: Göz kapağı ödemi, proptozis, ağrılı ve kısıtlı göz hareketleri, ateş. Yaklaşım?
+ orbital selülit ; kontrastlı orbita BT ; IV antibiyotik ; KBB (sinüzit) konsültasyonu ; abse / görme tehdidinde cerrahi
- preseptal selülit gibi oral antibiyotik ; sıcak kompres
#21 yaygin 2 - | şaşılık çocuk
S: 2 yaşında çocukta içe kayma. Ne yaparsın?
+ şaşılık ve ambliyopi riski ; sikloplejik refraksiyon ve fundus ; gözlük / kapama tedavisi ; retinoblastom gibi organik nedenlerin dışlanması ; erken tedavi
- büyüyünce düzelir, beklenir ; muayene okul çağında
#22 kirmizi 3 - | lökokori
S: Fotoğrafta bebeğin gözünde beyaz pupilla refleksi. Ne düşünürsün?
+ lökokori — retinoblastom dışlanmalı ; acil göz değerlendirmesi ; konjenital katarakt, ROP, Coats ; genetik danışmanlık
- flaş yansıması, önemsiz ; 6 ay sonra kontrol
#23 ilac 3 - | hidroksiklorokin göz
S: Hidroksiklorokin kullanan hastada retinal toksisite taraması?
+ başlangıç muayenesi ; 5 yıl sonra yıllık tarama (risk faktörlerinde erken) ; OCT ve görme alanı ; doz ≤5 mg/kg/gün gerçek ağırlık
- tarama gerekmez ; yalnız görme şikâyeti olunca
#24 ilac 2 - | midriyatik
S: Fundus muayenesi için pupilla dilatasyonunda risk nedir?
+ dar açılı gözde açı kapanması tetiklenebilir (nadir) ; açı değerlendirmesi (van Herick) ; araç kullanma uyarısı ; risk küçük, gerekli muayeneden kaçınılmamalı
- dilatasyon her hastada kontrendike ; risk yoktur
#25 yaygin 2 - | hordeolum / şalazyon
S: Göz kapağında ağrısız, kalıcı nodül. Tedavi?
+ şalazyon ; sıcak kompres, kapak masajı ; kalıcıda intralezyonel steroid veya insizyon-küretaj ; tekrarlayan / atipik lezyonda biyopsi (sebase karsinom)
- sistemik antibiyotik ; tekrarlayan lezyon asla biyopsi gerektirmez
#26 kirmizi 2 - | travmatik hifema
S: Göze top çarpması sonrası ön kamarada kan. Yaklaşım?
+ hifema ; başı yüksek istirahat, göz kalkanı ; GİB izlemi ; antikoagülan / NSAİİ'den kaçınma ; orak hücre taraması, yeniden kanama izlemi ; göz uzmanı
- aspirin ile ağrı tedavisi ; izlem gereksiz
#27 tuzak 2 - | göz bandı kornea abrazyonu
S: Kornea abrazyonunda göz bandı (pansuman) iyileşmeyi hızlandırır mı?
+ rutin göz kapama iyileşmeyi hızlandırmaz ; topikal antibiyotik ; topikal anestezik reçete edilmez (toksik) ; kontakt lens kullanıcısında Pseudomonas kapsamı
- topikal anestezik damla evde kullanım için reçete edilir ; göz bandı zorunlu
#28 kilavuz 2 dernek-tod | TOD önerileri; ani görme kaybı
S: Ağrısız ani görme kaybının başlıca nedenleri?
+ santral retinal arter / ven tıkanıklığı ; vitreus hemorajisi ; retina dekolmanı ; iskemik optik nöropati (dev hücreli arterit) ; acil değerlendirme
- yorgunluk, istirahat ; tüm nedenler zararsız
#29 yaygin 1 - | presbiyopi
S: 45 yaşında yakın görme güçlüğü. Açıklama ve çözüm?
+ presbiyopi, yaşa bağlı akomodasyon kaybı ; yakın gözlüğü / multifokal / lens seçenekleri ; tam göz muayenesi (glokom taraması) ; ilaç damlaları yeni seçenek, sınırlı
- göz hastalığı, ameliyat şart ; muayene gereksiz
#30 kirmizi 2 - | dev hücreli arterit göz
S: 75 yaşında hastada ani tek taraflı görme kaybı, baş ağrısı ve çene ağrısı. Ne yaparsın?
+ arteritik anterior iskemik optik nöropati ; ESH / CRP ve beklemeden yüksek doz steroid ; diğer gözü korumak için acil ; temporal arter biyopsisi
- biyopsi sonucu beklenir ; aspirin yeterli
`,
} satisfies BankaKaynagi
