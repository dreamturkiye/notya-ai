import type { BankaKaynagi } from '../banka'

/** AKKS — Anesteziyoloji ve Reanimasyon. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'anestezi',
  onek: 'ANS',
  metin: String.raw`
#1 kilavuz 2 dernek-tard | preoperatif açlık
S: Elektif cerrahide preoperatif açlık süreleri nedir?
+ berrak sıvı 2 saat ; anne sütü 4 saat ; formül / hafif yemek 6 saat ; yağlı / ağır yemek 8 saat ; GLP-1 agonisti kullananlarda gastrik boşalma gecikmesi riski
- tüm hastalar 12 saat su dahil aç ; GLP-1 kullanımı önemsiz
#2 kirmizi 3 - | malign hipertermi
S: Sevofluran ve süksinilkolin sonrası EtCO2'de açıklanamayan artış, rijidite, taşikardi ve ateş. Yaklaşım?
+ malign hipertermi ; tetikleyici ajanların kesilmesi, %100 O2 yüksek akım ; dantrolen 2,5 mg/kg IV, tekrarlanabilir ; soğutma, hiperkalemi / asidoz tedavisi ; yoğun bakım ve aile danışmanlığı
- volatil ajana devam ; dantrolen yalnız ateş 41 °C olunca
#3 kirmizi 3 - | zor havayolu
S: Entübe edilemeyen, maske ile ventile edilemeyen (CICO) hasta. Ne yaparsın?
+ zor havayolu algoritması ; yardım çağır ; supraglottik havayolu ile oksijenasyon denemesi ; başarısızsa acil önden boyun erişimi (skalpel krikotirotomi) ; tekrarlayan entübasyon denemelerinden kaçınma
- entübasyon denemesine devam ; uyandırmayı bekle
#4 kirmizi 3 - | lokal anestezik toksisitesi
S: Blok sonrası perioral uyuşma, nöbet ve aritmi. Ne düşünürsün?
+ lokal anestezik sistemik toksisitesi (LAST) ; enjeksiyonun durdurulması, havayolu, nöbet kontrolü (benzodiazepin) ; %20 lipid emülsiyon (1,5 ml/kg bolus + infüzyon) ; modifiye ALS (düşük doz adrenalin) ; propofol kardiyak instabilitede uygun değil
- yüksek doz adrenalin standart ; lipid emülsiyon kontrendike
#5 ilac 2 - | lokal anestezik maks doz
S: Lidokain ve bupivakainin maksimum dozları?
+ lidokain yaklaşık 4,5 mg/kg (adrenalinle 7 mg/kg) ; bupivakain yaklaşık 2–2,5 mg/kg ; yağsız vücut ağırlığına göre ; aspirasyon, bölünmüş enjeksiyon, USG rehberliği
- bupivakain 10 mg/kg güvenli ; doz hesabı gerekmez
#6 kilavuz 2 - | ASA sınıflaması
S: ASA fiziksel durum sınıflamasında ASA III nedir?
+ ciddi sistemik hastalık, fonksiyonel kısıtlılık ; örnek: kontrolsüz diyabet / HT, morbid obezite (VKİ ≥40), KOAH, düzenli diyaliz ; ASA IV yaşamı sürekli tehdit eden hastalık ; risk değerlendirmesine katkı
- ASA III sağlıklı hasta ; ASA yalnız yaşa göre belirlenir
#7 ilac 3 - | antikoagülan nöroaksiyel
S: Profilaktik LMWH alan hastada spinal anestezi zamanlaması?
+ profilaktik dozdan sonra en az 12 saat ; terapötik dozdan sonra 24 saat ; kateter çıkarıldıktan sonra sonraki doz için bekleme süresi ; NOAK'lar için ilaç / böbrek fonksiyonuna özgü süreler ; spinal hematom riski
- LMWH'den 1 saat sonra spinal ; NOAK zamanlaması önemsiz
#8 kirmizi 2 - | anafilaksi intraoperatif
S: İndüksiyondan sonra ani hipotansiyon, bronkospazm ve yaygın eritem. Yaklaşım?
+ perioperatif anafilaksi (kas gevşetici, antibiyotik, lateks, klorheksidin) ; tetikleyicinin kesilmesi, %100 O2 ; IV adrenalin titre (50–100 mcg erişkin) ; sıvı ; triptaz ölçümü ve sonrasında alerji testi
- yalnız antihistaminik ; triptaz gereksiz
#9 ilac 2 - | süksinilkolin kontrendikasyon
S: Süksinilkolinin kontrendike olduğu durumlar?
+ hiperkalemi riski: yanık (24–48 saat sonrası), uzun immobilizasyon, denervasyon, nöromüsküler hastalıklar ; malign hipertermi öyküsü ; psödokolinesteraz eksikliğinde uzamış blok ; rokuronyum + sugammadeks alternatif
- yanıklı hastada güvenli ; MH öyküsü önemsiz
#10 kilavuz 2 dernek-tard | PONV
S: Postoperatif bulantı-kusma riski yüksek hastada profilaksi?
+ Apfel risk skoru ; çok modlu profilaksi (deksametazon, ondansetron, droperidol vb.) ; volatil ajan / N2O yerine TİVA ; opioid koruyucu analjezi ; hidrasyon
- profilaksi gerekmez ; risk skoru önemsiz
#11 kirmizi 2 - | postoperatif solunum depresyonu
S: Opioid PCA alan hastada solunum sayısı 6/dk, uyandırılamıyor. Ne yaparsın?
+ opioid solunum depresyonu ; PCA'nın durdurulması, havayolu, oksijen, ventilasyon desteği ; nalokson titre ; tekrarlayan doz / infüzyon gerekebilir (yarı ömür) ; izlem
- PCA dozu azaltılıp izlenir ; nalokson tek doz yeterli her zaman
#12 kilavuz 2 sb-kp-sezaryen | SB Sezaryen KP (2022); obstetrik anestezi
S: Sezaryende neden genellikle rejyonel anestezi tercih edilir?
+ aspirasyon ve zor havayolu riski genel anestezide yüksek ; anne uyanık, bebekle temas ; fetüse ilaç geçişi az ; acil durumda genel anestezi (hızlı seri indüksiyon) ; spinal hipotansiyon yönetimi (fenilefrin)
- genel anestezi her zaman tercih ; spinal sonrası hipotansiyon tedavi edilmez
#13 ilac 2 - | multimodal analjezi
S: Postoperatif multimodal analjezinin bileşenleri?
+ parasetamol ve NSAİİ (kontrendikasyon yoksa) ; rejyonel / lokal anestezi teknikleri ; opioid koruyucu ajanlar (deksametazon, ketamin, gabapentinoid seçilmiş) ; opioid kurtarma dozları
- yalnız opioid ; NSAİİ tüm hastalarda kontrendike
#14 kirmizi 3 - | perioperatif MI riski
S: 6 hafta önce ilaç salınımlı stent takılan hasta elektif kalça protezi için geldi. Ne önerirsin?
+ elektif cerrahinin DAPT süresi tamamlanana kadar ertelenmesi (en az 6 ay; AKS'de 12) ; ertelenemezse aspirine devam, P2Y12 kesilmesi kardiyolojiyle ; stent trombozu riski ; perioperatif kardiyoloji konsültasyonu
- tüm antiplateletler kesilip cerrahi yapılır ; stent 6 haftada güvenli
#15 ilac 2 - | beta bloker perioperatif
S: Uzun süredir beta bloker kullanan hastada cerrahi günü ne yapılır?
+ beta bloker sürdürülür (rebound taşikardi / iskemi) ; cerrahi günü başlanmaz (yüksek doz yeni başlangıç zararlı) ; hipotansiyon / bradikardi izlemi
- cerrahi öncesi kesilir ; ameliyat sabahı yüksek doz başlanır
#16 ilac 2 - | ACEİ ameliyat günü
S: ACE inhibitörü kullanan hastada ameliyat sabahı ilaç alınmalı mı?
+ indüksiyonda hipotansiyon riski nedeniyle genellikle 24 saat önce kesilmesi düşünülür ; hipertansiyon / KY durumuna göre bireysel ; postop erken yeniden başlanması
- hiçbir antihipertansif ameliyat öncesi kesilmez, ACEİ dahil her koşulda ; ACEİ'nin anestezide etkisi yok
#17 kirmizi 2 - | aspirasyon
S: İndüksiyon sırasında mide içeriği aspirasyonu oldu. Yaklaşım?
+ trendelenburg / yan çevirme, aspirasyon ; entübasyon ve bronkoskopi (partikül) ; PEEP ile oksijenasyon desteği ; profilaktik antibiyotik / steroid rutin önerilmez ; izlem
- rutin antibiyotik ve steroid ; ekstübe edip eve
#18 kilavuz 2 sb-protokol-eriskin-yb | SB Erişkin YBÜ Kabul ve Taburculuk Protokolü
S: Erişkin hastanın yoğun bakım kabul kriterleri genel olarak nelerdir?
+ organ desteği gereksinimi (mekanik ventilasyon, vazopresör, RRT) ; yakın izlem gereken instabil hasta ; geri dönüşümlü durum ve fayda beklentisi ; protokoldeki seviye (I–III) kriterleri
- tüm postop hastalar yoğun bakıma ; fayda değerlendirmesi gereksiz
#19 ilac 3 - | sugammadeks
S: Rokuronyum bloğunun geri döndürülmesinde sugammadeks ve neostigmin farkı?
+ sugammadeks aminosteroid kas gevşeticileri kapsüller, derin blokta da etkili ; neostigmin derin blokta etkisiz, antikolinerjik gerekir ; nöromüsküler izlem (TOF) ; sugammadeks hormonal kontraseptif etkisini azaltır (ek yöntem 7 gün)
- neostigmin derin blokta etkili ; sugammadeks kontraseptifi etkilemez
#20 kirmizi 2 - | postspinal baş ağrısı
S: Spinal anestezi sonrası ayağa kalkınca artan baş ağrısı. Tedavi?
+ postdural ponksiyon baş ağrısı ; hidrasyon, analjezi, kafein ; dirençte epidural kan yaması ; nörolojik bulguda başka neden (SVT, subdural) dışlanır
- yatak istirahati koruyucu ; kan yaması kontrendike
#21 yaygin 2 - | OSAS anestezi
S: OSAS'lı hastada anestezi riski ve önlemler?
+ STOP-BANG ile tarama ; zor havayolu ve postoperatif solunum depresyonu riski ; opioid azaltma, rejyonel teknikler ; evdeki CPAP'ın postop kullanımı ; uygun izlemli yatak
- OSAS anesteziyi etkilemez ; postop yüksek doz opioid
#22 ilac 2 - | ketamin
S: Ketaminin anestezide avantaj ve dezavantajları?
+ hemodinamik stabilite, bronkodilatasyon ; analjezik ve opioid koruyucu ; ortaya çıkış reaksiyonları (benzodiazepinle azalır) ; sekresyon artışı ; kafa içi basınç endişesi güncel verilerle sınırlı
- ketamin bronkospazm yapar, astımda kontrendike ; hemodinamiyi her zaman çökertir
#23 kilavuz 2 sb-guvenli-cerrahi-kontrol-listesi | SB Güvenli Cerrahi Kontrol Listesi
S: Anestezi öncesi "giriş" aşamasında neler doğrulanır?
+ hasta kimliği, işlem, taraf işaretlemesi, onam ; anestezi cihaz / ilaç kontrolü, pulse oksimetre ; alerji ; zor havayolu / aspirasyon riski ; kan kaybı riski ve hazırlık
- kontrol listesi cerrahi bittikten sonra doldurulur ; alerji sorgulaması gerekmez
#24 kirmizi 3 - | masif transfüzyon
S: Masif transfüzyon gereken travma hastasında kan ürünü oranı ve komplikasyonlar?
+ dengeli transfüzyon (ES:TDP:trombosit yaklaşık 1:1:1) ; traneksamik asit ; hipokalsemi, hiperkalemi, hipotermi, asidoz izlemi ; viskoelastik testlerle yönlendirme
- yalnız eritrosit ve kristaloid ; kalsiyum izlemi gereksiz
#25 ilac 2 - | propofol infüzyon sendromu
S: Yoğun bakımda uzun süreli yüksek doz propofol infüzyonunda hangi sendrom gelişebilir?
+ propofol infüzyon sendromu ; metabolik asidoz, rabdomiyoliz, hiperkalemi, aritmi, kardiyak yetmezlik ; >4 mg/kg/saat ve >48 saat risk ; laktat / CK izlemi, infüzyonun kesilmesi
- propofol uzun süre yüksek dozda risksiz ; asidoz beklenen normal
#26 tuzak 2 - | gece yarısı aç diyabetik
S: Tip 1 diyabetli hastada ameliyat sabahı bazal insülin tamamen kesilmeli mi?
+ bazal insülin kesilmemeli (DKA riski), genellikle doz azaltılarak sürdürülür ; perioperatif glukoz izlemi ; uzun cerrahide değişken hızlı insülin-glukoz infüzyonu ; listede öne alma
- tüm insülinler kesilir ; tip 1'de insülinsiz açlık güvenli
#27 kirmizi 2 - | lateks alerjisi
S: Lateks alerjisi olan hastada ameliyathane hazırlığı?
+ lateks içermeyen ortam ve malzeme ; listenin ilk vakası ; tüm ekibin bilgilendirilmesi ; anafilaksi hazırlığı
- standart eldivenle devam ; premedikasyon reaksiyonu tamamen önler
#28 ilac 2 - | yaşlı hasta premedikasyon
S: Yaşlı hastada benzodiazepin premedikasyonu riskleri?
+ postoperatif deliryum ve bilişsel disfonksiyon riski ; düşme, solunum depresyonu ; rutin premedikasyondan kaçınma ; non-farmakolojik anksiyete yönetimi
- tüm yaşlılara midazolam premedikasyon ; deliryum riski yok
#29 kilavuz 2 - | çocuk anestezisi üst solunum yolu enfeksiyonu
S: Üst solunum yolu enfeksiyonu olan çocukta elektif anestezi ertelenmeli mi?
+ aktif / son 2 hafta içindeki enfeksiyonda perioperatif solunum olayları riski artar ; ateş, alt solunum yolu bulgusu, pürülan akıntıda erteleme ; hafif semptomda risk-yarar ; mümkünse supraglottik havayolu tercih
- her burun akıntısında 6 hafta erteleme ; risk yoktur
#30 sgk 2 sgk-sut | SUT anestezi işlemleri (güncel madde doğrulanacak)
S: Anestezi işlemlerinin SGK faturalandırmasında hekimin bilmesi gereken genel ilke?
+ SUT eki işlem listesinde tanımlı anestezi kodları ve süre / tür ; anestezi kaydının tam doldurulması (ASA, süre, ilaçlar) ; paket işlemlere dahil olan / ayrıca faturalanan kalemler ; güncel SUT'tan doğrulanmalı
- anestezi kaydı tutmak zorunlu değil ; her işlem ayrıca faturalanır
`,
} satisfies BankaKaynagi
