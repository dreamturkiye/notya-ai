import type { BankaKaynagi } from '../banka'

/** AKKS — Ortopedi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'ortopedi',
  onek: 'ORT',
  metin: String.raw`
#1 kirmizi 3 - | kompartman sendromu
S: Tibia kırığı sonrası alçıdaki hastada pasif germeyle artan, analjeziye dirençli şiddetli ağrı. Yaklaşım?
+ akut kompartman sendromu ; alçı / bandajın hemen gevşetilmesi ; kompartman basıncı ölçümü (gerekirse) ; acil fasyotomi ; nabız varlığı dışlamaz
- analjezik dozu artırılıp izlenir ; ekstremite kalp seviyesinin çok üstüne kaldırılır
#2 kirmizi 3 - | açık kırık
S: Açık tibia kırığında acil yaklaşım?
+ erken IV antibiyotik (ideal 1 saat içinde) ; tetanoz profilaksisi ; yaranın steril örtülmesi, fotoğraf ; acil debridman ve stabilizasyon ; nörovasküler muayene
- antibiyotik ameliyattan sonraya ; yara acilde yıkanıp primer kapatılır
#3 yaygin 2 - | Ottawa ayak bileği
S: Ayak bileği burkulmasında grafi ne zaman çekilir?
+ Ottawa ayak bileği kuralları ; malleollerin arka kenar / ucunda hassasiyet, 5. metatars kaidesi veya naviküler hassasiyet ; 4 adım yük verememe ; kural negatifse grafi gerekmez
- her burkulmaya grafi ; uzun süreli alçı immobilizasyon standart
#4 kirmizi 3 - | kalça kırığı yaşlı
S: Düşme sonrası kalça ağrısı ve dış rotasyonda kısalık olan 82 yaşında hasta. Yaklaşım?
+ proksimal femur kırığı ; analjezi (fasya iliaka bloğu) ; 24–48 saat içinde cerrahi ; tromboprofilaksi, deliryum önleme, ortogeriatrik bakım ; osteoporoz tedavisi ve düşme önleme
- yaşlıda konservatif yatak istirahati standart ; cerrahi 1 haftadan sonra
#5 kirmizi 2 - | septik artrit
S: Diz ekleminde akut ağrılı şişlik, ateş ve hareket kısıtlılığı. Ne yaparsın?
+ septik artrit dışlanmalı ; antibiyotik öncesi eklem aspirasyonu (Gram, kültür, hücre sayısı, kristal) ; ampirik IV antibiyotik ; cerrahi / artroskopik lavaj ; protez ekleminde ortopedi acil
- antibiyotik başlayıp aspirasyonu sonra yap ; NSAİİ ile eve
#6 kirmizi 2 - | çocuk septik kalça
S: 4 yaşında ateşli çocuk topallıyor, kalçasını hareket ettirmiyor. Ne düşünürsün?
+ septik artrit ve geçici sinovit ayrımı (Kocher kriterleri: ateş, yük verememe, ESH, lökosit, CRP) ; USG ile efüzyon ; şüphede aspirasyon ; acil drenaj ve antibiyotik
- geçici sinovit, NSAİİ ile eve ; aspirasyon gereksiz
#7 yaygin 2 - | gonartroz
S: Diz osteoartritinde konservatif tedavi basamakları?
+ kilo verme ve egzersiz (kuadriseps güçlendirme) temel ; topikal NSAİİ, parasetamol, kısa süreli oral NSAİİ ; intraartiküler steroid alevlenmede ; dirençte artroplasti değerlendirmesi
- ilk basamak artroskopik debridman ; glukozamin ana tedavi
#8 tuzak 2 - | artroskopik debridman
S: Dejeneratif menisküs yırtığı ve osteoartriti olan 60 yaşında hastaya artroskopik menisektomi önerir misin?
+ dejeneratif menisküs yırtığında artroskopi fizyoterapiye üstün değil ; önce egzersiz / fizyoterapi ; mekanik kilitlenme gibi seçilmiş durumlar istisna ; OA'da artroskopik lavaj önerilmez
- tüm dejeneratif yırtıklara artroskopi ; artroskopi OA ilerlemesini durdurur
#9 kilavuz 3 sb-kp-total-diz | SB Total Diz Artroplastisi KP (2022)
S: Total diz artroplastisi sonrası tromboprofilaksi?
+ farmakolojik profilaksi (LMWH / NOAK / aspirin protokole göre) en az 10–14 gün, genellikle 35 güne kadar uzatılabilir ; mekanik profilaksi ; erken mobilizasyon ; kanama riski değerlendirmesi
- profilaksi gerekmez ; 1 gün yeterli
#10 kilavuz 3 sb-kp-total-kalca | SB Total Kalça Artroplastisi KP (2022)
S: Total kalça artroplastisi sonrası erken dönem komplikasyonlar ve önlemler?
+ dislokasyon (kalça önlemleri yaklaşıma göre) ; VTE, enfeksiyon (profilaksi) ; periprostetik kırık ; bacak boyu eşitsizliği ; erken mobilizasyon ve rehabilitasyon
- ilk hafta yük verilmez ; antibiyotik profilaksisi gereksiz
#11 yaygin 2 - | omuz çıkığı
S: Ön omuz çıkığında redüksiyon öncesi ve sonrası yapılması gerekenler?
+ redüksiyon öncesi grafi (kırık) ve nörovasküler muayene (aksiller sinir) ; uygun sedasyon / analjeziyle redüksiyon ; sonrası grafi ve nörovasküler kontrol ; genç hastada nüks riski, rehabilitasyon
- grafi çekmeden zorla redüksiyon ; nörovasküler muayene gereksiz
#12 kirmizi 2 - | skafoid kırığı
S: Elin üzerine düşme sonrası anatomik enfiye çukurunda hassasiyet, grafi normal. Yaklaşım?
+ skafoid kırığı şüphesi ; başparmak dahil atel / alçı ; 10–14 günde tekrar grafi veya erken MR / BT ; avasküler nekroz ve kaynamama riski
- grafi normal, kırık dışlandı ; immobilizasyon gereksiz
#13 yaygin 2 - | distal radius kırığı
S: Yaşlı kadında düşme sonrası distal radius kırığı. Değerlendirme?
+ redüksiyon kriterleri (radyal kısalık, eğim, eklem içi basamak) ; alçı veya cerrahi tespit (fonksiyonel talep) ; kırılganlık kırığı → osteoporoz değerlendirmesi ; median sinir ve kompartman izlemi
- osteoporoz değerlendirmesi gereksiz ; tüm kırıklara cerrahi
#14 yaygin 2 - | gelişimsel kalça displazisi
S: 3 aylık bebekte kalça USG'de Graf tip IIb saptandı. Tedavi?
+ abdüksiyon cihazı (Pavlik bandajı) ; USG ile izlem ; bacakları gergin kundaklamadan kaçınma ; tedaviye yanıtsızlıkta kapalı / açık redüksiyon
- izlem yeterli, tedavi gerekmez ; sıkı kundak tedavi edici
#15 kirmizi 3 - | spinal kord bası
S: Kanser öyküsü olan hastada yeni sırt ağrısı ve bacaklarda güçsüzlük. Yaklaşım?
+ metastatik spinal kord basısı ; acil tüm omurga MR ; yüksek doz deksametazon ; radyoterapi / cerrahi dekompresyon acil ; mobilizasyonun kısıtlanması
- fizik tedavi ; MR rutin randevuyla
#16 yaygin 2 - | lateral epikondilit
S: Tenisçi dirseğinde tedavi?
+ çoğu kendini sınırlar (6–12 ay) ; aktivite modifikasyonu, eksantrik egzersiz, fizyoterapi ; bant / ortez ; steroid enjeksiyonu kısa dönem yarar, uzun dönemde nüks ; cerrahi dirençli vakada
- ilk tedavi cerrahi ; tekrarlayan steroid enjeksiyonu idame
#17 kirmizi 2 - | Aşil rüptürü
S: Sprint sırasında topuğuna tekme yemiş gibi ağrı; Thompson testi pozitif. Yaklaşım?
+ Aşil tendon rüptürü ; ekin pozisyonunda immobilizasyon / fonksiyonel ortez ; cerrahi veya konservatif (fonksiyonel rehabilitasyon) seçenekleri benzer sonuç ; florokinolon / steroid öyküsü
- burkulma, elastik bandaj ; Thompson testi önemsiz
#18 ilac 2 - | florokinolon tendon
S: Florokinolon kullanan yaşlı hastada topuk ağrısı başladı. Ne yaparsın?
+ florokinolona bağlı tendinopati / rüptür riski ; ilacın kesilmesi ve alternatif antibiyotik ; steroid ve yaşlılık riski artırır ; tendon istirahati
- ilaca devam, analjezik ekle ; steroid enjeksiyonu
#19 yaygin 2 - | skolyoz
S: Okul taramasında 12 yaşında kızda skolyoz şüphesi. Değerlendirme?
+ Adams öne eğilme testi, skolyometre ; ayakta tüm omurga grafisi, Cobb açısı ; iskelet olgunluğu (Risser) ; 25–40° büyüyen çocukta korse, >45–50° cerrahi değerlendirme ; ağrı / nörolojik bulguda MR
- tüm skolyozlarda cerrahi ; korse ilerlemeyi etkilemez
#20 kirmizi 2 - | kayan femur başı epifizi
S: 13 yaşında obez çocukta diz ağrısı ve topallama, kalça iç rotasyonu kısıtlı. Ne düşünürsün?
+ femur başı epifiz kayması ; diz ağrısı kalçadan yansıyabilir ; kalça grafisi (AP ve kurbağa bacağı) ; yük vermenin kısıtlanması ve acil cerrahi tespit (in situ vida) ; karşı kalça izlemi
- diz grafisi normal, büyüme ağrısı ; fizik tedavi
#21 kilavuz 2 - | osteoporotik kırık sonrası
S: Kırılganlık kırığı geçiren hastada sekonder kırık önleme?
+ kırık liaison hizmeti yaklaşımı ; DXA ve sekonder nedenler ; antiosteoporotik tedavi (bisfosfonat vb.) ; kalsiyum / D vitamini ; düşme riski değerlendirmesi
- kırık iyileşince ek işlem gerekmez ; DXA gereksiz
#22 ilac 2 - | NSAİİ kırık iyileşmesi
S: Kırıklı hastada kısa süreli NSAİİ kullanımı kaynamayı bozar mı?
+ kısa süreli NSAİİ kullanımının klinik kaynama üzerine etkisi sınırlı ; yüksek riskli kaynamada (ör. sigara, kaynamama riski) dikkat ; multimodal analjezi ; GİS / böbrek riskleri
- NSAİİ kırıkta kesinlikle yasak ; opioid tek seçenek
#23 kirmizi 3 - | pelvik kırık
S: Yüksek enerjili travma, pelvik instabilite ve hipotansiyon. İlk müdahale?
+ pelvik kemer / çarşaf ile pelvik bağlama ; masif transfüzyon, traneksamik asit ; anjiyoembolizasyon veya preperitoneal paketleme ; eksternal fiksasyon ; üretra yaralanması şüphesinde sonda takılmaz
- pelvis tekrar tekrar sıkıştırılarak muayene ; rutin üretral sonda
#24 yaygin 2 - | ön çapraz bağ
S: Futbolda diz dönme hareketi sonrası "pop" sesi, hemartroz. Değerlendirme?
+ ön çapraz bağ yırtığı şüphesi ; Lachman testi ; MR ; aktif genç sporcuda rekonstrüksiyon, düşük talepte rehabilitasyon ; eşlik eden menisküs / kıkırdak hasarı
- burkulma, bandaj ve spor ; Lachman önemsiz
#25 tuzak 2 - | kas iskelet istirahat
S: Akut bel ağrısında yatak istirahati önerilir mi?
+ yatak istirahati önerilmez ; aktif kalma iyileşmeyi hızlandırır ; kırmızı bayrak yoksa görüntüleme gerekmez ; NSAİİ / kısa süreli kas gevşetici
- 2 hafta tam yatak istirahati ; tüm hastalara MR
#26 yaygin 2 - | karpal tünel cerrahi
S: Tenar atrofisi ve sürekli uyuşması olan karpal tünel sendromunda tedavi?
+ ileri / ağır KTS ; EMG ile doğrulama ; karpal tünel gevşetme cerrahisi ; konservatif tedavi ağır vakada yetersiz
- yalnız gece ateli ; atrofi kendiliğinden düzelir
#27 sgk 2 sgk-sut | SUT ortopedik malzeme (güncel madde doğrulanacak)
S: Ortez / protez ve implantların SGK tarafından karşılanmasında genel kural nedir?
+ SUT eki listelerde tanımlı malzemeler ; ilgili uzman hekim raporu / sağlık kurulu ; kullanım süresi ve yenileme koşulları ; fark ücreti sınırları ; güncel SUT'tan doğrulanmalı
- tüm implantlar sınırsız ödenir ; rapor gerekmez
#28 kirmizi 2 - | osteomyelit
S: Diyabetik ayak ülserinde prob kemiğe değiyor. Ne düşünürsün?
+ osteomyelit olasılığı yüksek ; grafi, MR ; kemik biyopsisi / kültür ile hedefe yönelik uzun süreli antibiyotik ; debridman / cerrahi ; glisemik kontrol ve vasküler değerlendirme
- yüzeyel sürüntü kültürüne göre kısa antibiyotik ; vasküler değerlendirme gereksiz
#29 yaygin 2 - | donuk omuz
S: Diyabetik hastada aktif ve pasif omuz hareketlerinde global kısıtlılık. Tedavi?
+ adeziv kapsülit ; fizyoterapi, germe ; intraartiküler steroid erken dönemde yarar ; dirençli vakada hidrodilatasyon / manipülasyon / artroskopik gevşetme ; seyir uzun (1–3 yıl)
- rotator manşet yırtığı, acil cerrahi ; tam immobilizasyon
#30 kirmizi 2 - | çocuk kırığı istismar
S: 6 aylık yürümeyen bebekte femur spiral kırığı. Ne düşünmelisin?
+ yürümeyen çocukta femur kırığı istismar şüphesi ; iskelet survey ; adli bildirim ve sosyal hizmet ; osteogenezis imperfekta ayırıcı tanısı
- sıradan kaza, alçı ile eve ; bildirim gerekmez
`,
} satisfies BankaKaynagi
