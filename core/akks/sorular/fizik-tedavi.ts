import type { BankaKaynagi } from '../banka'

/** AKKS — Fiziksel Tıp ve Rehabilitasyon. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'fizik-tedavi',
  onek: 'FTR',
  metin: String.raw`
#1 yaygin 2 dernek-ftr | bel ağrısı
S: Akut nonspesifik bel ağrısında tedavi?
+ aktif kalma ve eğitim ; NSAİİ kısa süreli, kas gevşetici kısa süreli ; yatak istirahati önerilmez ; kırmızı bayraklar yoksa görüntüleme gerekmez ; yüzeyel ısı
- 2 hafta yatak istirahati ; ilk gün MR
#2 kilavuz 2 dernek-ftr | kronik bel ağrısı
S: 3 aydan uzun süren nonspesifik bel ağrısında kanıta dayalı yaklaşım?
+ egzersiz terapisi ; bilişsel davranışçı yaklaşım / multidisipliner rehabilitasyon ; NSAİİ / duloksetin seçilmiş ; uzun süreli opioid önerilmez ; pasif modalitelerin tek başına yarar sınırlı
- uzun süreli opioid ilk seçenek ; yalnız pasif fizik tedavi modaliteleri
#3 kirmizi 3 - | kırmızı bayraklar bel
S: Bel ağrısında hangi kırmızı bayraklar acil değerlendirme gerektirir?
+ kauda ekuina (eyer anestezisi, idrar / gaita), ilerleyici nörolojik defisit ; kanser öyküsü, açıklanamayan kilo kaybı ; ateş / immünsüpresyon (enfeksiyon) ; travma / osteoporoz (kırık) ; gece / istirahat ağrısı
- yaş önemsiz ; kanser öyküsü bel ağrısını etkilemez
#4 yaygin 2 - | diz OA rehabilitasyon
S: Diz osteoartritinde egzersiz programı?
+ kuadriseps ve kalça kas güçlendirme ; aerobik düşük etkili (yürüme, yüzme, bisiklet) ; kilo kaybı ; eğitim ve kendi kendine yönetim ; ağrıya göre dozlama
- OA'da egzersiz kıkırdağı yıpratır, önerilmez ; tam istirahat
#5 kilavuz 2 sb-kp-inme | inme rehabilitasyonu
S: İnme sonrası rehabilitasyona ne zaman başlanır?
+ medikal stabilite sonrası erken (ilk 24–48 saatten sonra) ; çok erken yoğun mobilizasyon (ilk 24 saat) önerilmez ; yutma değerlendirmesi ; spastisite, omuz ağrısı, DVT önleme ; görev odaklı tekrarlayıcı egzersiz
- rehabilitasyon 3 ay sonra başlar ; ilk 24 saatte yoğun mobilizasyon
#6 ilac 2 - | spastisite
S: İnme sonrası fokal üst ekstremite spastisitesinde tedavi?
+ germe, pozisyonlama, ortez ; fokal spastisitede botulinum toksini ; oral antispastikler (baklofen, tizanidin) jeneralize spastisitede, sedasyon yan etkisi ; fizyoterapi ile birlikte
- botulinum toksini tek başına yeterli, egzersiz gerekmez ; fokal spastisitede ilk seçenek yüksek doz oral baklofen
#7 kirmizi 2 - | DVT rehabilitasyon
S: Uzun immobil spinal kord yaralanmalı hastada tek taraflı bacak şişliği. Ne yaparsın?
+ DVT dışlanmalı (Doppler USG) ; tromboprofilaksi gözden geçirme ; heterotopik ossifikasyon ayırıcı tanısı ; tanı konana kadar masajdan kaçınma
- masaj ve egzersiz ile şişlik giderilir ; Doppler gereksiz
#8 kirmizi 3 - | otonomik disrefleksi
S: T4 spinal kord yaralanmalı hastada ani şiddetli baş ağrısı, KB 210/110, bradikardi. Ne yaparsın?
+ otonomik disrefleksi ; hastayı oturtma, sıkı giysileri gevşetme ; tetikleyiciyi bul (mesane distansiyonu — sonda, fekal impaksiyon) ; KB düşmezse kısa etkili antihipertansif ; T6 ve üstü lezyonlarda risk
- hastayı yatırıp bekleme ; beta bloker ilk seçenek
#9 yaygin 2 - | fibromiyalji
S: Fibromiyalji tedavisinde ilk basamak?
+ hasta eğitimi ; aerobik egzersiz (en güçlü kanıt) ; uyku hijyeni, BDT ; ilaç: amitriptilin, duloksetin, pregabalin ; opioidlerden kaçınma
- opioid ilk seçenek ; egzersiz zararlı
#10 kilavuz 2 dernek-ftr | osteoporoz egzersiz
S: Osteoporozlu hastada egzersiz önerileri?
+ ağırlık taşıyan ve dirençli egzersizler ; denge egzersizleri ve düşme önleme ; omurgada aşırı fleksiyon ve ani rotasyonlardan kaçınma ; postür ; kırık riskine göre bireysel
- osteoporozda egzersiz kırık yapar, yasak ; ağır fleksiyon egzersizleri önerilir
#11 yaygin 2 - | omuz sıkışma
S: Subakromiyal sıkışma sendromunda konservatif tedavi?
+ egzersiz (rotator manşet ve skapula stabilizasyonu) ; NSAİİ ; subakromiyal steroid enjeksiyonu kısa dönem ; aktivite modifikasyonu ; cerrahinin egzersize üstünlüğü kanıtlanmamış
- ilk tedavi cerrahi ; tekrarlayan steroid enjeksiyonu idame
#12 ilac 2 - | intraartiküler steroid
S: Diz eklemine intraartiküler steroid enjeksiyonunda dikkat edilecekler?
+ septik artrit dışlanmalı ; yılda 3–4 enjeksiyonu aşmama ; diyabetlide kan şekeri yükselmesi ; asepsi ; kısa-orta dönem yarar
- enfekte ekleme steroid ; sınırsız sayıda enjeksiyon
#13 kirmizi 2 - | ankilozan spondilit
S: 25 yaşında erkekte 3 aydan uzun süren, istirahatle artan, hareketle azalan bel ağrısı ve sabah tutukluğu. Ne düşünürsün?
+ inflamatuvar bel ağrısı, aksiyel spondiloartrit ; sakroiliak MR, HLA-B27, CRP ; NSAİİ ilk basamak, egzersiz ; romatoloji ile biyolojik değerlendirme
- mekanik bel ağrısı, yatak istirahati ; HLA-B27 tanı koydurur tek başına
#14 yaygin 2 - | servikal ağrı
S: Mekanik boyun ağrısında tedavi?
+ eğitim, aktif kalma ; egzersiz (boyun-skapula stabilizasyonu) ; kısa süreli NSAİİ ; manuel terapi egzersizle birlikte ; radikülopati / miyelopati kırmızı bayrakları
- uzun süreli boyunluk ; tüm hastalara MR
#15 kilavuz 2 sb-rehber-dmd | SB DMD Klinik Rehberi
S: Duchenne musküler distrofide rehabilitasyonun temel bileşenleri?
+ eklem hareket açıklığı ve kontraktür önleme (germe, gece ortezi) ; aşırı eksantrik / yorucu egzersizden kaçınma ; solunum ve kardiyak izlem ; skolyoz izlemi, mobilite cihazları ; multidisipliner ekip
- yoğun ağırlık antrenmanı önerilir ; kontraktür önleme gereksiz
#16 yaygin 2 - | karpal tünel konservatif
S: Hafif-orta karpal tünel sendromunda konservatif tedavi?
+ nötral bilek ateli (gece) ; aktivite modifikasyonu ; lokal steroid enjeksiyonu ; sinir kaydırma egzersizleri ; ağır / atrofide cerrahi
- ilk tedavi cerrahi ; atel gündüz ve gece sürekli ve süresiz
#17 ilac 2 - | NSAİİ yaşlı
S: Yaşlı kas-iskelet ağrılı hastada NSAİİ kullanımında nelere dikkat edilir?
+ en düşük doz, en kısa süre ; GİS koruma (PPI) risk varsa ; böbrek ve kardiyovasküler risk ; topikal NSAİİ tercih edilebilir ; antikoagülan etkileşimi
- yaşlıda sistemik NSAİİ en güvenli ; süresiz kullanım
#18 kirmizi 2 - | CRPS
S: El bileği kırığından sonra elde orantısız ağrı, ödem, renk ve terleme değişikliği. Ne düşünürsün?
+ kompleks bölgesel ağrı sendromu ; Budapest kriterleri ; erken fizyoterapi / ergoterapi, ayna terapisi ; ilaç: bisfosfonat, kortikosteroid kısa süreli, nöropatik ajanlar ; uzun immobilizasyondan kaçınma
- elin tamamen immobilizasyonu ; psikolojik, tedavi gerekmez
#19 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Kronik hastalığı olan erişkine fiziksel aktivite önerisi?
+ haftada 150–300 dk orta şiddette aerobik ; haftada ≥2 gün kas güçlendirme ; yaşlıda denge ; kişinin durumuna göre kademeli ; oturma süresini azaltma
- kronik hastalıkta egzersiz yasak ; yalnız haftada 30 dk
#20 tuzak 2 - | ultrason terapisi
S: Kronik bel ağrısında terapötik ultrason ve TENS tek başına etkili tedavi midir?
+ pasif modalitelerin tek başına uzun dönem etkinliği sınırlı ; aktif egzersiz programının temel olması ; modaliteler ek / kısa dönem ağrı için ; kanıta dayalı seçim
- 20 seans ultrason kalıcı çözüm ; egzersiz gereksiz
#21 yaygin 2 - | plantar fasiit
S: Sabah ilk adımda topuk ağrısı (plantar fasiit). Tedavi?
+ germe egzersizleri (plantar fasya, Aşil) ; uygun ayakkabı / topuk yastığı, gece ateli ; NSAİİ ; dirençte ESWT veya steroid enjeksiyonu (rüptür riski) ; çoğu 6–12 ayda düzelir
- ilk tedavi cerrahi ; tekrarlayan steroid enjeksiyonu
#22 kirmizi 2 - | dekübit
S: Hareketsiz hastada sakral bölgede derin doku hasarı. Önleme ve tedavi?
+ 2 saatte bir pozisyon değişimi, basınç dağıtan yatak ; beslenme (protein) ; nem / inkontinans yönetimi ; evreleme ve yara bakımı, enfeksiyonda debridman ; Braden ölçeği
- simit yastık önerilir ; pozisyon değişimi gerekmez
#23 sgk 2 sgk-sut | SUT fizik tedavi seansları (güncel madde doğrulanacak)
S: Fizik tedavi ve rehabilitasyon seanslarının SGK tarafından karşılanmasında genel kurallar nelerdir?
+ FTR uzmanı tarafından düzenlenen rapor / reçete ; tanıya göre yıllık seans sayısı sınırları ; aynı hastalık için tekrar koşulları ; güncel SUT'tan doğrulanmalı
- her hekim sınırsız seans yazar ; seans sınırı yok
#24 ilac 3 - | botulinum toksini
S: Spastisitede botulinum toksini uygulamasında dikkat edilecekler?
+ hedef kasların doğru seçimi (USG / EMG rehberliği) ; doz sınırları ve uzak yayılım riski (disfaji, solunum) ; etkinin 3–4 ayda azalması, aralıklı uygulama ; enjeksiyon sonrası germe / ortez / fizyoterapi
- doz sınırı yok ; tek enjeksiyon kalıcı etkili
#25 yaygin 2 - | yaşlıda düşme
S: Tekrarlayan düşmeleri olan yaşlı hastada değerlendirme?
+ çok faktörlü değerlendirme (ilaçlar, ortostatik hipotansiyon, görme, denge, kas gücü) ; Timed Up and Go ; denge ve kuvvet egzersizleri ; ev güvenliği ; osteoporoz tedavisi
- yaşlılıkta düşme normal, müdahale gerekmez ; sedatifler denge için yararlı
#26 kirmizi 2 - | radikülopati defisit
S: Bel fıtığına bağlı radikülopatide ilerleyici ayak düşüklüğü. Yaklaşım?
+ ilerleyici motor defisit ; acil MR ve beyin cerrahisi / ortopedi değerlendirmesi ; cerrahi dekompresyon ; konservatif tedavi bu tabloda yetersiz
- fizik tedavi ile 3 ay izlem ; traksiyon
#27 kilavuz 2 - | kardiyak rehabilitasyon
S: MI sonrası kardiyak rehabilitasyonun yararları ve içeriği?
+ mortalite ve tekrar yatışların azalması ; denetimli egzersiz (efor testine göre) ; risk faktörü yönetimi, eğitim ; psikososyal destek ; erken başlanması
- MI sonrası 6 ay tam istirahat ; rehabilitasyon yararsız
#28 yaygin 2 - | hemipleji omuz ağrısı
S: İnme sonrası hemiplejik omuz ağrısını önleme?
+ doğru pozisyonlama ve destek ; omuz subluksasyonunda askı / bant ; kolu çekerek transferden kaçınma ; hareket açıklığı egzersizleri ; gerekirse subakromiyal enjeksiyon / supraskapular blok
- kolundan çekerek kaldırma ; omuz tamamen hareketsiz bırakılır
#29 tuzak 2 - | kas gevşetici uzun süre
S: Kronik bel ağrısında kas gevşeticilerin aylarca sürekli kullanımı uygun mu?
+ kas gevşeticiler kısa süreli (akut) kullanım için ; uzun süreli kullanımda kanıt yok, sedasyon ve bağımlılık riski (bazıları) ; aktif rehabilitasyon temel
- aylarca sürekli kullanım standart ; yaşlıda güvenli
#30 kirmizi 2 - | heterotopik ossifikasyon
S: Kafa travması sonrası rehabilitasyonda kalçada ağrılı hareket kısıtlılığı ve ısı artışı. Ne düşünürsün?
+ heterotopik ossifikasyon ; DVT ve enfeksiyon ayırıcı tanısı ; ALP, kemik sintigrafisi / USG ; NSAİİ / bisfosfonat, eklem hareket açıklığının korunması ; olgunlaşmadan sonra cerrahi
- zorlu manipülasyon ; erken cerrahi eksizyon
`,
} satisfies BankaKaynagi
