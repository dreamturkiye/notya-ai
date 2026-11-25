import type { BankaKaynagi } from '../banka'

/** AKKS — Endokrinoloji ve Metabolizma. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'endokrinoloji',
  onek: 'END',
  metin: String.raw`
#1 kilavuz 2 dernek-temd-dm | TEMD DM Kılavuzu (güncel baskı doğrulanacak)
S: Diyabet tanı kriterleri nelerdir?
+ açlık plazma glukozu ≥126 mg/dL ; OGTT 2. saat ≥200 mg/dL ; HbA1c ≥%6,5 (standardize yöntem) ; semptom + rastgele glukoz ≥200 ; semptomsuz hastada tekrar ile doğrulama
- tek parmak ucu ölçümü tanı koydurur ; HbA1c ≥%5,7 diyabet
#2 kilavuz 2 sb-kp-diyabet | SB Diyabet KP 2019, Tip 2
S: Tip 2 diyabette HbA1c hedefi nasıl belirlenir?
+ çoğu erişkinde <%7 ; genç / komorbiditesiz hastada daha sıkı (<%6,5) hipoglisemi olmadan ; yaşlı, kırılgan, hipoglisemi riski yüksekte daha esnek (<%8) ; bireyselleştirme
- herkes için <%5,5 ; yaşlıda sıkı kontrol zorunlu
#3 ilac 3 - | SGLT2 riskleri
S: SGLT2 inhibitörü kullanan hastada dikkat edilecek yan etkiler?
+ öglisemik DKA (özellikle cerrahi, açlık, ketojenik diyet, insülin azaltımı) ; genital mantar enfeksiyonu ; hacim kaybı ; cerrahi öncesi 3–4 gün kesilmesi ; KY ve KBH'de kardiyorenal yarar
- normal glukozda DKA olmaz ; cerrahi öncesi kesmek gerekmez
#4 ilac 2 - | GLP-1 RA
S: GLP-1 reseptör agonisti başlarken nelere dikkat edilir?
+ yavaş doz titrasyonu (GİS yan etkileri) ; medüller tiroid kanseri / MEN2 öyküsünde kontrendike ; pankreatit öyküsünde dikkat ; anestezi öncesi gastrik boşalma gecikmesi ; KVH'de kanıtlı yarar
- MEN2'de güvenli ; tam dozla başlanır
#5 kirmizi 3 - | tiroid fırtınası
S: Hipertiroidili hastada ateş, taşikardi, ajitasyon ve kalp yetmezliği. Tedavi?
+ tiroid fırtınası (Burch-Wartofsky) ; beta bloker (propranolol) ; tiyonamid (PTU / metimazol) ; tiyonamidden en az 1 saat sonra iyot ; hidrokortizon ; yoğun bakım, tetikleyici
- iyot tiyonamidden önce ; aspirin ile ateş düşürme
#6 yaygin 2 - | Graves
S: Graves hastalığında tedavi seçenekleri?
+ antitiroid ilaç (metimazol; gebeliğin ilk trimesterinde PTU) ; radyoaktif iyot (gebelikte kontrendike, oftalmopatide dikkat) ; tiroidektomi ; beta bloker semptomatik ; agranülositoz uyarısı
- RAİ gebelikte güvenli ; metimazol ile ateş-boğaz ağrısında devam
#7 kirmizi 2 - | agranülositoz
S: Metimazol kullanan hastada ateş ve boğaz ağrısı. Ne yaparsın?
+ agranülositoz şüphesi ; ilacın hemen kesilmesi ve acil hemogram ; nötropenide geniş spektrumlu antibiyotik ; PTU'ya geçilmez (çapraz reaksiyon) ; hasta eğitimi
- ilaca devam, antibiyotik ekle ; PTU'ya geç
#8 kilavuz 2 dernek-temd-tiroid | TEMD Tiroid Kılavuzu
S: Subklinik hipotiroidide (TSH 7, sT4 normal) tedavi kararı?
+ tekrar ölçümle doğrulama ; TSH >10'da genellikle tedavi ; 7–10 arasında semptom, anti-TPO, gebelik planı, KV risk ve yaşa göre bireysel ; yaşlıda daha yüksek TSH kabul edilebilir ; gebelik planlayanda tedavi eşiği düşük
- TSH 4,5 üzerindeki herkese tedavi ; yaşlıda tam doz hemen
#9 kirmizi 3 - | miksödem koma
S: Hipotiroidili yaşlı hastada hipotermi, bilinç bozukluğu ve hiponatremi. Yaklaşım?
+ miksödem koması ; IV levotiroksin (± liotironin) ; hidrokortizon (adrenal yetmezlik dışlanana kadar) ; destek tedavisi, pasif ısıtma, hiponatremi ; yoğun bakım
- oral levotiroksin düşük doz ; hızlı aktif ısıtma
#10 kilavuz 2 - | tiroid nodülü
S: Tiroid nodülü saptanan ötiroid hastada değerlendirme?
+ TSH ; boyun USG (TI-RADS) ; boyut ve özelliklere göre İİAB ; Bethesda sınıflaması ; TSH düşükse sintigrafi (sıcak nodül genellikle benign)
- tüm nodüllere sintigrafi ilk adım ; TSH gereksiz
#11 kilavuz 2 dernek-temd-dm | osteoporoz
S: Osteoporoz tanısı ve tedavi endikasyonu?
+ DXA T skoru ≤ −2,5 ; kırılganlık kırığı (vertebra / kalça) varsa DXA'dan bağımsız tanı ; FRAX ile yüksek risk ; tedavi: bisfosfonat, denosumab, anabolikler ; kalsiyum / D vitamini
- osteopenide herkese ilaç ; kalça kırığı olsa da DXA normalse tedavi gerekmez
#12 ilac 3 - | denosumab kesme
S: Denosumab tedavisini bırakmak isteyen hastaya ne söylersin?
+ kesilmesi rebound kemik kaybı ve çoklu vertebra kırığı riski ; dozlar geciktirilmemeli ; bırakılacaksa bisfosfonat ile geçiş ; hipokalsemi (böbrek yetmezliği) izlemi
- güvenle aniden bırakılabilir ; geçiş tedavisi gerekmez
#13 kirmizi 2 - | hiperkalsemi
S: Ca 11,8 mg/dL, PTH yüksek, asemptomatik hasta. Değerlendirme?
+ primer hiperparatiroidi ; 24 saat idrar kalsiyumu (ailesel hipokalsiürik hiperkalsemi) ; DXA, böbrek USG (taş) ; cerrahi endikasyonları (yaş <50, Ca >1 mg/dL üst sınırın üzerinde, osteoporoz, taş, eGFR <60) ; lokalizasyon (sintigrafi / USG)
- kalsiyum kısıtlaması tedavidir ; tiyazid başlanır
#14 kirmizi 3 - | adrenal yetmezlik
S: Hipotansiyon, hiponatremi, hiperkalemi ve hiperpigmentasyonu olan hastada tanı ve tedavi?
+ primer adrenal yetmezlik ; sabah kortizol ve ACTH, ACTH uyarı testi ; krizde hemen IV hidrokortizon ; idamede hidrokortizon + fludrokortizon ; stres dozu eğitimi, acil kart
- tanı testleri bitene kadar steroid verilmez ; idamede fludrokortizon gereksiz
#15 kilavuz 2 - | Cushing taraması
S: Cushing sendromu şüphesinde tarama testleri?
+ eksojen steroid kullanımının dışlanması ; gece tükürük kortizolü ; 1 mg deksametazon supresyon testi ; 24 saatlik idrar serbest kortizolü ; pozitifse ACTH ile ayırıcı tanı
- tek rastgele sabah kortizolü tanı koydurur ; ilk adım hipofiz MR
#16 kirmizi 2 - | feokromositoma
S: Paroksismal baş ağrısı, terleme, çarpıntı ve dirençli hipertansiyon. Değerlendirme?
+ plazma serbest veya idrar fraksiyone metanefrinler ; pozitifse görüntüleme ; cerrahi öncesi alfa blokaj (önce), sonra beta bloker ; genetik değerlendirme
- beta bloker alfa blokerden önce ; görüntüleme ilk adım
#17 kilavuz 2 - | primer aldosteronizm
S: Hangi hipertansif hastalarda primer aldosteronizm taranır?
+ dirençli hipertansiyon, hipokalemi (spontan / diüretikle) ; adrenal insidentaloma ; erken yaşta hipertansiyon / inme ailesi ; OSAS ; aldosteron / renin oranı
- yalnız hipokalemisi olanlarda ; tarama gereksiz
#18 ilac 2 - | levotiroksin emilim
S: Levotiroksin dozuna rağmen TSH yükselen hastada neler sorgulanır?
+ uyum ve alım zamanı (aç karnına) ; demir, kalsiyum, PPI, soya etkileşimi ; çölyak / atrofik gastrit / H. pylori ; gebelik, kilo artışı ; yeni ilaçlar (östrojen)
- doz hemen iki katına ; emilimi etkileyen faktör yok
#19 sgk 2 sgk-sut | SUT insülin pompası / sensör (güncel madde doğrulanacak)
S: İnsülin pompası ve sürekli glukoz izlem sensörlerinin SGK'da karşılanmasında genel koşullar?
+ tip 1 diyabet ve belirli klinik kriterler (hipoglisemi, HbA1c, yaş) ; endokrinoloji uzmanı içeren sağlık kurulu raporu ; eğitim ve uyum ; güncel SUT'tan doğrulanmalı
- tip 2'li herkese ödenir ; rapor gerekmez
#20 kilavuz 2 dernek-temd-diyabet-teknolojileri-2025 | TEMD Diyabet Teknolojileri Kılavuzu (Nisan 2025)
S: Sürekli glukoz izleminde "hedef aralıkta geçen süre" (TIR) hedefi nedir?
+ 70–180 mg/dL aralığında >%70 ; 70 altı <%4, 54 altı <%1 ; 250 üstü <%5 ; yaşlı / yüksek riskte daha esnek hedefler
- TIR hedefi %30 ; hipoglisemi süresi önemsiz
#21 kirmizi 2 - | HHS
S: Yaşlı tip 2 diyabetlide glukoz 900 mg/dL, ozmolalite yüksek, ketoz yok, bilinç bulanık. Tedavi?
+ hiperozmolar hiperglisemik durum ; agresif sıvı replasmanı öncelik ; insülin sıvıdan sonra, düşük doz ; sodyum ve ozmolalite yavaş düzeltme ; tromboz profilaksisi
- yüksek doz insülin bolusu sıvıdan önce ; hipotonik sıvı hızla
#22 yaygin 2 - | prolaktinoma
S: Mikroprolaktinomada tedavi?
+ kabergolin ilk seçenek ; prolaktin ve semptom izlemi ; makroprolaktin ve ilaç nedenleri dışlanmalı ; gebelik planlamasında ilacın kesilmesi ve izlem
- ilk seçenek cerrahi ; tüm mikroadenomlara radyoterapi
#23 tuzak 2 - | T3 tedavisi rutin
S: Hipotiroidide rutin olarak levotiroksin + liotironin kombinasyonu önerilir mi?
+ standart tedavi levotiroksin monoterapisi ; kombinasyon rutin önerilmez, seçilmiş semptomatik hastada deneme ; T3 aritmi riski ; tiroid hormonu kilo verme için kullanılmaz
- tüm hastalara T3 eklenmeli ; kilo vermek için tiroid hormonu
#24 kilavuz 2 - | gebelik tiroid
S: Gebelikte hipotiroidi tedavisinde TSH hedefleri?
+ trimester spesifik referans aralıkları ; genellikle TSH <2,5 mU/L hedef (ilk trimester) ; gebelikte levotiroksin gereksinimi artar ; 4 haftada bir izlem
- gebelikte TSH izlemi gerekmez ; doz azaltılır
#25 kirmizi 2 - | hipoglisemi sülfonilüre
S: Glibenklamid kullanan yaşlı hastada tekrarlayan hipoglisemi. Yaklaşım?
+ sülfonilüre hipoglisemisi uzun sürebilir, gözlem / yatış ; glukoz desteği, gerekirse oktreotid ; ilacın kesilmesi, yaşlıda hipoglisemi riski düşük ajanlara geçiş ; böbrek fonksiyonu
- tek glukoz verip taburcu ; glibenklamid yaşlıda tercih
#26 ilac 2 - | steroid kaynaklı hiperglisemi
S: Sabah prednizolon başlanan diyabetli hastada öğleden sonra hiperglisemi. Yönetim?
+ prednizolonun glisemik etkisi öğleden sonra / akşam pik ; sabah NPH insülin (steroid dozuna göre) ; glukoz izlemi ; steroid azaltılırken insülin azaltılması
- yalnız akşam bazal insülin ; steroid kesilirse insülin aynı dozda sürer
#27 yaygin 2 - | obezite farmakoterapi
S: Obezite farmakoterapisi kimlere düşünülür?
+ VKİ ≥30 veya komorbiditeyle ≥27 ; yaşam tarzı değişikliğine ek ; GLP-1 RA (semaglutid), GLP-1/GIP (tirzepatid), orlistat ; 12–16 haftada yanıt değerlendirmesi ; gebelikte kontrendike
- VKİ 24'te ilaç ; yaşam tarzı gereksiz
#28 kilavuz 2 - | hipogonadizm erkek
S: Erkek hipogonadizminde testosteron tedavisinin kontrendikasyonları?
+ prostat / meme kanseri ; hematokrit >%50–54 ; tedavi edilmemiş ağır OSAS, kontrolsüz KY ; fertilite isteği (spermatogenezi baskılar) ; PSA ve hematokrit izlemi
- fertilite isteyene testosteron ; hematokrit izlemi gereksiz
#29 kirmizi 2 - | hipofiz apopleksisi
S: Ani şiddetli baş ağrısı, görme kaybı ve oftalmopleji olan hipofiz adenomlu hasta. Ne yaparsın?
+ hipofiz apopleksisi ; acil MR ; hemen hidrokortizon ; görme kaybında acil cerrahi dekompresyon ; hipofiz hormon değerlendirmesi
- migren ; steroid kontrendike
#30 tuzak 2 - | HbA1c anemi
S: Demir eksikliği anemisi veya hemoglobinopatisi olan hastada HbA1c güvenilir mi?
+ hemoglobinopati, demir eksikliği, hemoliz, böbrek yetmezliği, gebelik HbA1c'yi yanıltabilir ; glukoz ölçümleri / fruktozamin / CGM ile değerlendirme ; laboratuvar yöntemi
- HbA1c her durumda güvenilir ; aneminin etkisi yoktur
`,
} satisfies BankaKaynagi
