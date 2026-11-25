import type { BankaKaynagi } from '../banka'

/** AKKS — Gastroenteroloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'gastroenteroloji',
  onek: 'GAS',
  metin: String.raw`
#1 kilavuz 2 dernek-tgd | H. pylori eradikasyonu
S: Türkiye'de (yüksek klaritromisin direnci) H. pylori ilk basamak eradikasyon tedavisi?
+ klaritromisin direnci yüksek bölgede standart üçlü tedavi önerilmez ; bizmutlu dörtlü tedavi (PPI + bizmut + tetrasiklin + metronidazol) 14 gün ; eradikasyonun üre nefes / gaita antijen testiyle doğrulanması (PPI kesildikten 2 hafta sonra) ; uyum
- PPI + klaritromisin + amoksisilin 7 gün ilk seçenek ; eradikasyon kontrolü gereksiz
#2 kirmizi 3 - | varis kanaması
S: Sirozlu hastada hematemez ve hipotansiyon. İlk yaklaşım?
+ resüsitasyon, restriktif transfüzyon (Hb 7–8) ; vazoaktif ajan (terlipressin / oktreotid) hemen ; profilaktik antibiyotik (seftriakson) ; 12 saat içinde endoskopik band ligasyonu ; dirençte TIPS
- Hb 12 hedef liberal transfüzyon ; antibiyotik gereksiz
#3 yaygin 2 - | GÖRH
S: Alarm bulgusu olmayan tipik reflü yakınmasında ilk yaklaşım?
+ 8 haftalık PPI deneme tedavisi ; yaşam tarzı (kilo, baş yükseltme, geç yemek) ; alarm bulgularında (disfaji, kilo kaybı, kanama, anemi, ileri yaş yeni başlangıç) endoskopi ; en düşük etkili dozla idame / kesme
- tüm reflülere hemen endoskopi ; ömür boyu yüksek doz PPI
#4 kirmizi 2 - | disfaji
S: İlerleyici katı gıda disfajisi ve kilo kaybı olan 60 yaşında hasta. Yaklaşım?
+ özofagus kanseri dışlanmalı ; acil / öncelikli üst endoskopi ve biyopsi ; beslenme durumu ; akalazya, peptik darlık ayırıcı tanı
- reflü, PPI ile 3 ay ; endoskopi gereksiz
#5 kilavuz 2 - | IBS
S: İrritabl barsak sendromu tanısı ve ilk tedavi?
+ Roma IV kriterleri ; alarm bulgularının yokluğu ; sınırlı tetkik (hemogram, CRP, çölyak serolojisi, gerekirse fekal kalprotektin) ; diyet (düşük FODMAP), lif, antispazmodik ; tipine göre (konstipasyon / diyare) tedavi
- tüm hastalara kolonoskopi ; IBS tanısı dışlama tanısı değil, alarm bulgusunda bile konur
#6 kirmizi 2 - | ülseratif kolit akut ağır
S: Günde 8 kanlı dışkılama, taşikardi ve ateşi olan ülseratif kolit hastası. Yaklaşım?
+ akut ağır ülseratif kolit (Truelove-Witts) ; yatış, IV kortikosteroid ; enfeksiyon dışlama (C. difficile, CMV) ; VTE profilaksisi ; 3. günde yanıtsızlıkta kurtarma tedavisi (infliksimab / siklosporin) veya kolektomi
- ayaktan oral mesalazin ; antidiyareik verilir
#7 kilavuz 2 dernek-tgd | Crohn
S: Orta-ağır Crohn hastalığında tedavi stratejisi?
+ remisyon indüksiyonu: kortikosteroid (budesonid ileoçekal hafif-orta) ; steroid koruyucu immünomodülatör / biyolojik (anti-TNF, vedolizumab, ustekinumab) ; erken biyolojik yüksek riskte ; sigara bırakma ; mukozal iyileşme hedefi
- uzun süreli steroid idame ; sigara Crohn'u iyileştirir
#8 sgk 2 sgk-sut | SUT biyolojik İBH (güncel madde doğrulanacak)
S: İBH'de biyolojik ajanların SGK tarafından karşılanmasında genel koşullar?
+ konvansiyonel tedaviye yanıtsızlık / intolerans ; gastroenteroloji uzmanının yer aldığı sağlık kurulu raporu ; aktivite skorları ve endoskopik bulgular ; TB / HBV taraması ; güncel SUT'tan doğrulanmalı
- tanı anında herkese ödenir ; rapor gerekmez
#9 kirmizi 2 - | akut hepatit
S: ALT 2500 U/L, INR 2,1 ve bilinç değişikliği olan hasta. Ne düşünürsün?
+ akut karaciğer yetmezliği ; etiyoloji (parasetamol, viral, ilaç, otoimmün, Wilson) ; parasetamolde N-asetilsistein (parasetamol dışı da yararlı olabilir) ; transplant merkezine erken sevk ; hipoglisemi, ensefalopati izlemi
- ayaktan izlem ; sedatiflerle ajitasyon tedavisi
#10 yaygin 2 - | MASLD
S: Metabolik ilişkili yağlı karaciğer hastalığında fibrozis değerlendirmesi?
+ FIB-4 ile birinci basamak risk değerlendirmesi ; ara / yüksek riskte elastografi ; kilo kaybı (%7–10) ; KV risk yönetimi ; ileri fibrozisde hepatoloji
- USG'de yağlanma fibrozisi gösterir ; tüm hastalara biyopsi
#11 kilavuz 2 - | siroz asit
S: Yeni asiti olan sirozlu hastada değerlendirme?
+ tanısal parasentez (hücre sayımı, albümin — SAAG, kültür) ; SBP dışlanması (PMN ≥250) ; sodyum kısıtlaması, spironolakton ± furosemid ; NSAİİ'den kaçınma
- parasentez gereksiz ; sıvı kısıtlaması tek tedavi
#12 kirmizi 2 - | SBP
S: Asitli sirozlu hastada parasentezde PMN 400/mm³. Tedavi?
+ spontan bakteriyel peritonit ; 3. kuşak sefalosporin (seftriakson) ; 1. ve 3. günde IV albümin (hepatorenal sendrom önleme) ; sekonder peritonit dışlanması ; sonrasında sekonder profilaksi
- kültür sonucu beklenir ; albümin gereksiz
#13 ilac 2 - | hepatik ensefalopati
S: Hepatik ensefalopati tedavisi?
+ tetikleyicilerin araştırılması (enfeksiyon, kanama, konstipasyon, ilaç, elektrolit) ; laktüloz (2–3 yumuşak dışkı / gün) ; rifaksimin ekleme / sekonder profilaksi ; protein kısıtlaması önerilmez
- uzun süreli protein kısıtlaması ; benzodiazepin ile ajitasyon tedavisi
#14 kilavuz 3 sb-kp-kolorektal-kanser | SB Kolorektal Kanser KP
S: Kolonoskopide çıkarılan adenomatöz poliplerden sonra kontrol kolonoskopi aralığı?
+ 1–2 küçük (<10 mm) tübüler adenomda 7–10 yıl ; 3–4 küçük adenomda 3–5 yıl ; ileri adenom (≥10 mm, villöz, yüksek dereceli displazi) veya ≥5 adenomda 3 yıl ; kaliteli kolonoskopi
- her polipten sonra yıllık kolonoskopi ; ileri adenomda 10 yıl
#15 kirmizi 3 - | kolanjit ERCP
S: Koledok taşı ve kolanjit bulguları olan hastada ERCP zamanlaması?
+ ağır kolanjitte acil (24 saat içinde, septik şokta daha erken) biliyer drenaj ; orta kolanjitte erken ; antibiyotik ve sıvı ; sonrasında kolesistektomi
- ERCP 2 hafta sonra ; antibiyotik tek başına yeterli
#16 yaygin 2 - | dispepsi
S: Alarm bulgusu olmayan 35 yaşında dispepsili hastada yaklaşım?
+ test et ve tedavi et (H. pylori, yüksek prevalansta) ; negatifse PPI deneme ; alarm bulgusu / ileri yaşta endoskopi ; NSAİİ kullanımı sorgulanır
- tüm genç dispeptiklere endoskopi ; H. pylori testi gereksiz
#17 ilac 3 - | PPI klopidogrel
S: Klopidogrel kullanan hastada GİS koruma için PPI seçimi?
+ omeprazol / esomeprazol CYP2C19 etkileşimi (teorik) ; pantoprazol tercih edilebilir ; DAPT'li yüksek GİS kanama riskinde PPI önerilir
- klopidogrel kullanana PPI kesinlikle verilmez ; omeprazol en uygun
#18 kirmizi 2 - | akut pankreatit etyoloji
S: Akut pankreatit sonrası etiyoloji araştırması?
+ safra taşı (USG) ; alkol ; trigliserid (>1000 mg/dL) ; kalsiyum, ilaçlar ; tekrarlayan / açıklanamayan vakada EUS / MRCP, ileri yaşta tümör
- etyoloji araştırması gereksiz ; trigliserid önemsiz
#19 kilavuz 2 - | çölyak erişkin
S: Erişkinde çölyak şüphesinde tanı?
+ glutenli diyet sürerken tTG-IgA ve total IgA ; pozitif serolojide duodenal biyopsi (erişkinde standart) ; glutensiz diyet ; demir, folat, D vitamini, osteoporoz değerlendirmesi
- test öncesi glutensiz diyet ; HLA testi tanı koydurur
#20 yaygin 2 - | kronik diyare
S: 4 haftadan uzun süren diyarede ilk tetkikler?
+ hemogram, CRP, TSH, çölyak serolojisi ; gaita mikroskopisi / kültür / parazit, fekal kalprotektin ; alarm bulgularında kolonoskopi ve biyopsi (mikroskopik kolit) ; ilaçlar (metformin, PPI)
- antidiyareik verip izlem ; kalprotektin önemsiz
#21 tuzak 2 - | PPI ömür boyu
S: Endikasyonu gözden geçirilmeden PPI'nın yıllarca sürdürülmesi uygun mu?
+ endikasyonun düzenli gözden geçirilmesi ; mümkünse en düşük doz / ihtiyaç halinde / kesme ; uzun süreli kullanımda B12, Mg, enfeksiyon, kırık riskleri ; Barrett gibi gerçek endikasyonlarda sürdürme
- PPI tamamen risksiz ; herkes süresiz kullanmalı
#22 kirmizi 2 - | kostik
S: Kostik madde içen erişkinde yaklaşım?
+ kusturma, nötralize etme, NG sonda yok ; havayolu değerlendirmesi ; 12–24 saat (genellikle) içinde endoskopi ile hasar derecelendirme ; perforasyon şüphesinde BT ; uzun dönem darlık riski
- kusturulur ; süt / asit ile nötralize
#23 kilavuz 2 - | Barrett
S: Barrett özofagusu tanısı konan hastada izlem?
+ displazisiz Barrett'te 3–5 yılda bir endoskopik izlem (uzunluğa göre) ; düşük / yüksek dereceli displazide endoskopik eradikasyon ; PPI ; Seattle protokolü biyopsi
- izlem gereksiz ; displazisiz Barrett'te özofajektomi
#24 yaygin 2 - | otoimmün hepatit
S: Otoimmün hepatit tanısı ve tedavisi?
+ yüksek transaminaz, IgG yüksekliği, otoantikorlar (ANA, ASMA) ; karaciğer biyopsisi ; prednizolon / budesonid + azatioprin ; TPMT ; uzun süreli idame
- tanıda biyopsi gereksiz ; antiviral tedavi
#25 ilac 2 - | azatioprin TPMT
S: Azatioprin başlamadan önce ve tedavi sırasında neler yapılır?
+ TPMT (± NUDT15) aktivitesi ; hemogram ve karaciğer enzimleri izlemi ; allopurinol ile etkileşim (doz azaltma) ; cilt kanseri / lenfoma farkındalığı, güneş koruma
- TPMT gereksiz ; allopurinol ile güvenle tam doz
#26 kirmizi 2 - | üst GİS kanama risk
S: Üst GİS kanamada Glasgow-Blatchford skorunun kullanımı?
+ skor 0–1 düşük risk: ayaktan endoskopi ile yönetilebilir ; yüksek skorda yatış ve 24 saat içinde endoskopi ; endoskopi sonrası Forrest sınıflaması ve PPI
- tüm hastalar yoğun bakıma ; skor kullanılmaz
#27 tuzak 3 - | metronidazol C. diff
S: C. difficile enfeksiyonunun ilk atağında metronidazol ilk seçenek midir?
+ güncel kılavuzlarda ilk seçenek oral fidaksomisin veya oral vankomisin ; metronidazol yalnız bunlar ulaşılamazsa hafif vakada ; tekrarlayan vakada fidaksomisin / fekal mikrobiyota transferi
- metronidazol tüm vakalarda ilk seçenek ; IV vankomisin etkili
#28 yaygin 2 - | hemokromatoz
S: Transferrin satürasyonu %60, ferritin 900 µg/L olan hastada değerlendirme?
+ HFE genotipleme (C282Y) ; karaciğer hasarı / fibrozis değerlendirmesi ; flebotomi tedavisi ; birinci derece akraba taraması ; inflamasyon / alkol / metabolik nedenler ayırıcı tanı
- demir takviyesi ; tedavi gereksiz
#29 kirmizi 2 - | hepatorenal sendrom
S: Asitli sirozlu hastada kreatinin hızla yükseliyor, hipovolemi dışlanmış. Ne düşünürsün?
+ hepatorenal sendrom-AKI ; diüretiklerin kesilmesi, albümin ile hacim genişletme ; terlipressin + albümin ; nefrotoksiklerden kaçınma ; transplant değerlendirmesi
- furosemid dozu artırılır ; NSAİİ ile ağrı tedavisi
#30 kilavuz 2 - | HCC taraması
S: Sirozlu hastada hepatoselüler karsinom taraması nasıl yapılır?
+ 6 ayda bir USG ± AFP ; HBV taşıyıcılarında risk gruplarına göre (siroz olmadan da) ; şüpheli nodülde çok fazlı BT / MR (LI-RADS) ; tedavi seçenekleri evreye göre
- yıllık tarama yeterli ; tarama yalnız AFP ile
`,
} satisfies BankaKaynagi
