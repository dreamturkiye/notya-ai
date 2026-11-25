import type { BankaKaynagi } from '../banka'

/** AKKS — Nöroloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'noroloji',
  onek: 'NOR',
  metin: String.raw`
#1 kirmizi 3 sb-rehber-akut-iskemik-inme | SB Akut İskemik İnme Rehberi
S: Belirtileri 2 saat önce başlayan, sağ hemiparezi ve afazisi olan hastada yaklaşım?
+ acil inme kodu, BT / BT anjiyo ile kanama dışlama ve büyük damar tıkanıklığı ; kontrendikasyon yoksa 4,5 saat içinde IV tromboliz (alteplaz / tenekteplaz) ; büyük damar tıkanıklığında mekanik trombektomi (seçilmiş hastada 24 saate kadar) ; kan şekeri, KB yönetimi
- MR sonucu için tromboliz ertelenir ; KB tromboliz öncesi kontrol gerektirmez
#2 ilac 3 - | tromboliz KB
S: IV tromboliz öncesi ve sonrası kan basıncı hedefleri nelerdir?
+ tromboliz öncesi <185/110 mmHg ; tromboliz sonrası 24 saat <180/105 mmHg ; IV labetalol / nikardipin ; trombolizsiz hastada çok yüksek KB (>220/120) dışında agresif düşürmeden kaçınma
- tromboliz öncesi KB önemsiz ; tüm inmelerde KB hızla 120'ye düşürülür
#3 kilavuz 2 sb-kp-inme | sekonder korunma
S: Kardiyoembolik olmayan iskemik inme sonrası sekonder korunma?
+ antiplatelet (aspirin veya klopidogrel) ; minör inme / yüksek riskli TİA'da ilk 21 gün aspirin + klopidogrel ; yüksek yoğunluklu statin ; KB kontrolü ; semptomatik karotis darlığında (≥%70) erken endarterektomi
- tüm hastalara ömür boyu DAPT ; statin gerekmez
#4 kilavuz 2 sb-kp-migren-2025 | SB Migren KP Rev. 01 (Ağustos 2025)
S: Migren akut atak tedavisinde basamaklar nelerdir?
+ hafif-orta atakta NSAİİ / parasetamol ; orta-ağırda veya NSAİİ yanıtsızlığında triptan ; erken alım ; ayda 10 günden fazla akut ilaç kullanımında ilaç aşırı kullanım baş ağrısı riski ; bulantıda antiemetik
- opioid ilk seçenek ; triptan her gün kullanılabilir
#5 ilac 3 sb-kp-migren-2025 | SB Migren KP 2025, profilaksi
S: Migren profilaksisi kimlere ve hangi ilaçlarla?
+ ayda ≥4 atak gün / sakatlayıcı ataklar ; propranolol, topiramat, amitriptilin, flunarizin, kandesartan ; dirençli vakada CGRP monoklonal antikorları / onabotulinumtoksinA (kronik migren) ; topiramat / valproat doğurganlık çağında teratojenite
- valproat genç kadında ilk seçenek ; profilaksi ayda 1 atakta herkese
#6 kirmizi 3 - | SAK
S: Hayatının en şiddetli, ani başlayan (gök gürültüsü) baş ağrısı. Ne yaparsın?
+ subaraknoid kanama dışlanmalı ; acil beyin BT (ilk 6 saatte duyarlılık yüksek) ; BT normalse LP (ksantokromi) ; BT anjiyografi ; beyin cerrahisi / nöroradyoloji
- migren, analjezik ile taburcu ; LP gereksiz
#7 kirmizi 3 sb-kp-epilepsi | SB Epilepsi KP 2021, status
S: Erişkinde 5 dakikayı aşan konvülzif status epileptikusta basamak tedavi?
+ ABC, glukoz (tiamin önce) ; birinci basamak benzodiazepin (IV lorazepam / diazepam, IM midazolam) ; ikinci basamak levetirasetam, fosfenitoin / fenitoin veya valproat ; dirençli statusta anestezik ajanlar ve yoğun bakım
- 30 dakika beklenir ; ikinci basamak fenitoin hızlı IV push
#8 ilac 2 sb-kp-epilepsi | antiepileptik seçimi
S: Doğurganlık çağındaki kadında yeni tanı jeneralize epilepside ilaç seçimi?
+ valproattan mümkünse kaçınılır (teratojenite, nörogelişim) ; lamotrijin veya levetirasetam tercih ; folik asit ; enzim indükleyici ilaç-kontraseptif etkileşimi ; gebelikte düzey izlemi
- valproat ilk seçenek ; folik asit gereksiz
#9 yaygin 2 - | ilk nöbet
S: Provoke edilmemiş ilk jeneralize tonik-klonik nöbet geçiren erişkinde değerlendirme?
+ EEG ve beyin MR ; metabolik nedenler, ilaç / alkol ; tek nöbet sonrası tedavi kararı tekrar riskine göre (EEG / MR anormalliği) ; ehliyet ve güvenlik önerileri
- tek nöbette herkese ömür boyu tedavi ; görüntüleme gereksiz
#10 kilavuz 2 sb-kp-alzheimer-2025 | SB Alzheimer ve Demans KP Rev. 01 (2025)
S: Hafif-orta Alzheimer hastalığında farmakolojik tedavi?
+ kolinesteraz inhibitörleri (donepezil, rivastigmin, galantamin) ; orta-ağırda memantin (tek / kombine) ; bradikardi / senkop izlemi ; geri dönüşümlü nedenlerin (B12, tiroid, depresyon) dışlanması ; bakım veren desteği
- antipsikotikler ilk seçenek ; geri dönüşümlü nedenler araştırılmaz
#11 kirmizi 2 - | GBS
S: Viral enfeksiyon sonrası ayaklardan başlayan ilerleyici güçsüzlük, arefleksi. Yaklaşım?
+ Guillain-Barré sendromu ; solunum fonksiyonu (FVC) ve otonom izlemi ; LP (albüminositolojik disosiasyon), EMG ; IVIG veya plazmaferez ; solunum yetmezliği riskinde yoğun bakım
- steroid etkili tedavidir ; ayaktan izlem
#12 kirmizi 3 - | myastenik kriz
S: Myastenia graviste nefes darlığı ve yutma güçlüğü artmış hasta. Yaklaşım?
+ myastenik kriz ; FVC / NIF izlemi, gerekirse entübasyon ; IVIG veya plazmaferez ; tetikleyiciler (enfeksiyon, ilaçlar: aminoglikozid, florokinolon, magnezyum) ; yoğun bakım
- ayaktan piridostigmin dozu artırılır ; aminoglikozid ile enfeksiyon tedavisi
#13 yaygin 2 - | Parkinson
S: Yeni tanı Parkinson hastalığında tedaviye başlama?
+ semptomlar günlük yaşamı etkiliyorsa başlanır ; levodopa en etkili, yaşlıda tercih ; dopamin agonistleri / MAO-B inhibitörleri genç hastada seçenek ; dürtü kontrol bozukluğu (agonistler) ; egzersiz ve rehabilitasyon
- levodopa tedaviyi geciktirmek için asla verilmez ; tipik antipsikotikle halüsinasyon tedavisi
#14 kilavuz 3 - | MS
S: Relapsing-remitting MS tanısı nasıl konur ve tedavi ilkesi nedir?
+ McDonald kriterleri (zaman ve yerde yayılım, MR, BOS oligoklonal bant) ; atak tedavisinde yüksek doz IV metilprednizolon ; hastalık modifiye edici tedavi erken başlanır ; gebelik planlaması ve ilaç seçimi
- tek MR lezyonu tanı için yeterli ; DMT yalnız ileri evrede
#15 ilac 2 - | trigeminal nevralji
S: Trigeminal nevraljide ilk seçenek ilaç?
+ karbamazepin (veya okskarbazepin) ilk seçenek ; HLA-B*15:02 (Asya kökenli) ve hiponatremi, hemogram ; sekonder nedenler için MR (MS, tümör) ; dirençli vakada cerrahi / girişimsel
- opioid ilk seçenek ; MR gereksiz
#16 kirmizi 2 - | dev hücreli arterit
S: 72 yaşında yeni baş ağrısı, çene kladikasyosu, temporal hassasiyet ve görme bulanıklığı. Yaklaşım?
+ dev hücreli arterit ; görme kaybı riski nedeniyle hemen yüksek doz kortikosteroid ; ESH / CRP ; temporal arter biyopsisi veya USG (steroidi geciktirmeden) ; romatoloji / göz
- biyopsi sonucu gelene kadar steroid verilmez ; migren
#17 yaygin 2 - | gerilim tipi baş ağrısı
S: Bant tarzı, iki taraflı, hafif-orta baş ağrısı; tedavi ve profilaksi?
+ gerilim tipi baş ağrısı ; akutta parasetamol / NSAİİ ; ilaç aşırı kullanımından kaçınma ; sık ataklarda amitriptilin ; stres yönetimi, egzersiz
- opioid ; tüm hastalara görüntüleme
#18 kirmizi 2 - | kauda ekuina
S: Bel ağrısı, eyer anestezisi ve idrar retansiyonu. Ne yaparsın?
+ kauda ekuina sendromu ; acil lomber MR ; acil beyin / omurga cerrahisi ; erken dekompresyon prognozu iyileştirir
- analjezik ile ayaktan izlem ; fizik tedavi
#19 kilavuz 2 sb-kp-epilepsi | SB Epilepsi KP 2021, sosyal
S: Epilepsili hastaya araç kullanma konusunda ne söylenir?
+ ehliyet için belirli süre nöbetsizlik koşulu (mevzuata göre) ; nöbet riskli dönemde araç kullanmama ; ilaç değişikliği sırasında dikkat ; resmi mevzuat / sağlık raporu düzenlemelerine yönlendirme
- epilepsi tanılı kişi hiçbir koşulda ehliyet alamaz ; nöbet olsa da araç kullanabilir
#20 ilac 3 - | levodopa protein
S: Levodopa kullanan hastada "off" dönemleri artmış. İlaç ve beslenme açısından ne önerirsin?
+ yüksek protein öğünleri levodopa emilimini azaltır, dozu öğünden 30–60 dk önce ; doz sıklığının artırılması / uzatılmış salınım ; COMT / MAO-B inhibitörleri ekleme ; dirençli dalgalanmada ileri tedaviler (DBS)
- protein tamamen kesilir ; doz aniden kesilir
#21 kirmizi 3 - | nöroleptik malign sendrom
S: Haloperidol sonrası yüksek ateş, rijidite, bilinç değişikliği ve CK yüksekliği. Yaklaşım?
+ nöroleptik malign sendrom ; ilacın kesilmesi ; destek tedavisi, soğutma, hidrasyon ; dantrolen / bromokriptin ; yoğun bakım
- haloperidol dozu artırılır ; enfeksiyon, yalnız antibiyotik
#22 yaygin 2 - | karpal tünel
S: Gece uyandıran el uyuşması (ilk 3 parmak), Phalen pozitif. Tanı ve tedavi?
+ karpal tünel sendromu ; EMG ile doğrulama ve şiddet ; gece atel, aktivite modifikasyonu ; lokal steroid enjeksiyonu ; tenar atrofi / ağır vakada cerrahi
- servikal disk hernisi, tüm hastalara boyun cerrahisi ; EMG gereksiz
#23 tuzak 2 - | B12 nöropati folat
S: B12 eksikliğine bağlı nöropatide yalnız folik asit vermek uygun mu?
+ B12 eksikliğinde yalnız folat vermek hematolojik bulguları düzeltirken nörolojik hasarı ilerletebilir ; B12 replasmanı (IM / yüksek doz oral) ; nedenin araştırılması (pernisiyöz anemi, metformin, PPI)
- folik asit B12 yerine geçer ; B12 replasmanı gerekmez
#24 kilavuz 2 sb-kp-inme | TİA
S: TİA geçiren hastada değerlendirme aciliyeti nedir?
+ TİA yüksek erken inme riski taşır ; acil değerlendirme (24 saat içinde) ; beyin görüntüleme (MR difüzyon), damar görüntüleme (karotis) ; EKG / ritim izlemi (AF) ; erken sekonder korunma
- TİA geçti, rutin poliklinik randevusu 1 ay sonra ; görüntüleme gereksiz
#25 ilac 2 - | antiepileptik etkileşim
S: Karbamazepin kullanan hastada hangi ilaç etkileşimlerine dikkat edilir?
+ güçlü enzim indükleyici: oral kontraseptifler, warfarin, NOAK'lar, bazı antiretroviraller etkinliği azalır ; makrolidler / valproat ile düzey değişimi ; hiponatremi ; HLA-B*15:02 ile SJS riski
- etkileşim yoktur ; oral kontraseptif etkinliği değişmez
#26 kirmizi 2 - | serebral venöz tromboz
S: Oral kontraseptif kullanan genç kadında günlerdir artan baş ağrısı, papilödem ve nöbet. Ne düşünürsün?
+ serebral venöz tromboz ; MR venografi / BT venografi ; kanamalı enfarktta bile antikoagülasyon (LMWH) ; nöbet ve intrakraniyal basınç yönetimi ; OKS kesilmesi
- migren ; kanama varsa antikoagülasyon kesinlikle verilmez
#27 sgk 2 sgk-sut | SUT nöroloji (güncel madde doğrulanacak)
S: MS hastalık modifiye edici tedavileri için SGK raporu genel olarak nasıl düzenlenir?
+ nöroloji uzmanının yer aldığı sağlık kurulu raporu ; tanı kriterlerinin ve atak / MR aktivitesinin belgelenmesi ; basamak tedavi kuralları ; belirli aralıklarla yenileme ; güncel SUT'tan doğrulanmalı
- herhangi bir hekimin reçetesi yeterli ; rapor süresiz
#28 tuzak 2 - | bel ağrısı MR
S: Kırmızı bayrağı olmayan 2 haftalık akut mekanik bel ağrısında MR çekilmeli mi?
+ kırmızı bayrak yoksa erken görüntüleme önerilmez ; aktif kalma, analjezik ; 6 haftadan uzun süren veya nörolojik defisitte görüntüleme ; gereksiz MR asemptomatik bulgularla gereksiz girişimlere yol açar
- her bel ağrısına ilk gün MR ; yatak istirahati 2 hafta
#29 yaygin 2 - | huzursuz bacak
S: Akşamları bacaklarda hareket ettirme dürtüsü ve uyku bozukluğu. Değerlendirme ve tedavi?
+ huzursuz bacak sendromu ; ferritin (<75 µg/L ise demir) ; tetikleyici ilaçlar (antidepresan, antihistaminik) ; alfa-2-delta ligandları (gabapentin / pregabalin) ; dopamin agonistlerinde augmentasyon riski
- ferritin önemsiz ; yüksek doz dopamin agonisti uzun süreli ilk seçenek
#30 kirmizi 3 sb-kp-beyin-olumu-2025 | SB Beyin Ölümü Nöroradyolojik Tanı KP 2025
S: Beyin ölümü tanısında temel koşullar nelerdir?
+ geri dönüşümsüz koma, nedeni bilinen yapısal beyin hasarı ; beyin sapı reflekslerinin yokluğu ve apne testi ; hipotermi, sedatif, metabolik bozuklukların dışlanması ; mevzuatta belirlenen hekim kurulu ve gerektiğinde destekleyici testler
- tek hekimin kararı yeterli ; sedatif etkisi altındaki hastada tanı konabilir
`,
} satisfies BankaKaynagi
