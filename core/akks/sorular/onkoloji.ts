import type { BankaKaynagi } from '../banka'

/** AKKS — Tıbbi Onkoloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'onkoloji',
  onek: 'ONK',
  metin: String.raw`
#1 kirmizi 3 - | febril nötropeni
S: Kemoterapi sonrası 10. günde ateş 38,6 °C, nötrofil 400/mm³. Yaklaşım?
+ febril nötropeni onkolojik acil ; 1 saat içinde geniş spektrumlu antipseudomonal antibiyotik ; kültürler ; MASCC risk skoru, düşük riskte seçilmiş hastada oral / ayaktan ; G-CSF profilaksi değerlendirmesi sonraki kürlerde
- antibiyotik 24 saat beklenir ; ateş düşürücü verip eve
#2 kirmizi 3 - | tümör lizis
S: Yüksek tümör yükü olan lenfomada kemoterapi başlanacak. Tümör lizis sendromundan korunma?
+ agresif IV hidrasyon ; allopurinol veya yüksek riskte rasburikaz ; elektrolit (K, P, Ca, ürik asit) ve böbrek fonksiyonu sık izlem ; G6PD eksikliğinde rasburikaz kontrendike
- hidrasyon gereksiz ; rasburikaz G6PD eksikliğinde güvenli
#3 kirmizi 3 - | spinal kord basısı
S: Prostat kanseri olan hastada yeni sırt ağrısı ve bacak güçsüzlüğü. Yaklaşım?
+ metastatik spinal kord basısı ; acil tüm omurga MR ; deksametazon hemen ; radyoterapi ve / veya cerrahi dekompresyon ; nörolojik prognoz erken tedaviye bağlı
- ağrı kesici ile izlem ; MR rutin randevuyla
#4 kirmizi 2 - | vena kava süperior
S: Akciğer kanserli hastada yüz-boyun ödemi, göğüste venöz dolgunluk. Yaklaşım?
+ vena kava süperior sendromu ; BT ile değerlendirme ; histolojik tanı tedaviden önce (stabilse) ; endovasküler stent semptomatik hızlı rahatlama ; radyoterapi / kemoterapi tümöre göre
- tanı öncesi körlemesine steroid her zaman ; stent kontrendike
#5 kirmizi 2 - | hiperkalsemi malignite
S: Meme kanserli hastada konfüzyon ve Ca 14 mg/dL. Tedavi?
+ malignite hiperkalsemisi ; IV hidrasyon ; zoledronik asit veya denosumab ; kalsitonin hızlı etki ; nedenin tedavisi
- tiyazid ; kalsiyum içeren sıvı
#6 kilavuz 3 sb-rehber-meme-kanseri | SB Meme Kanseri Klinik Rehberi (Revizyon 2024)
S: HER2 pozitif erken meme kanserinde adjuvan tedavinin temeli?
+ trastuzumab içeren tedavi (1 yıl) ; kemoterapi ile birlikte, seçilmiş vakada pertuzumab ; neoadjuvan tedavi sonrası rezidüde T-DM1 ; kardiyotoksisite (EKO / EF) izlemi
- HER2 pozitiflikte hedefe yönelik tedavi gereksiz ; EF izlemi gerekmez
#7 kilavuz 2 sb-rehber-meme-kanseri | hormon reseptör pozitif
S: Hormon reseptör pozitif premenopozal meme kanserinde adjuvan endokrin tedavi?
+ tamoksifen 5–10 yıl ; yüksek riskte over supresyonu + aromataz inhibitörü / tamoksifen ; aromataz inhibitörü tek başına premenopozalde uygun değil ; tamoksifende endometriyum ve VTE riski
- premenopozalde tek başına aromataz inhibitörü ; endokrin tedavi 6 ay
#8 ilac 3 - | immünoterapi yan etkileri
S: Immün kontrol noktası inhibitörü alan hastada ağır ishal (grade 3). Yaklaşım?
+ immün ilişkili kolit ; immünoterapiye ara verilmesi ; yüksek doz sistemik kortikosteroid ; enfeksiyon dışlama, gerekirse endoskopi ; steroid yanıtsızlığında infliksimab / vedolizumab
- loperamid ile immünoterapiye devam ; steroid immünoterapide kesin kontrendike
#9 ilac 2 - | kemoterapi bulantı
S: Yüksek emetojenik kemoterapide (sisplatin) bulantı-kusma profilaksisi?
+ NK1 antagonisti (aprepitant) + 5-HT3 antagonisti + deksametazon + olanzapin ; gecikmiş faz için sürdürme ; kurtarma ilaçları
- yalnız metoklopramid ; profilaksi gereksiz
#10 kirmizi 2 - | ekstravazasyon
S: Antrasiklin infüzyonu sırasında ekstravazasyon. Ne yaparsın?
+ infüzyonun durdurulması, kateterden aspirasyon ; soğuk uygulama ; antrasiklin için deksrazoksan (6 saat içinde) ; işaretleme ve izlem, plastik cerrahi değerlendirmesi
- sıcak uygulama antrasiklinde ; infüzyona devam
#11 kilavuz 3 sb-kp-kolorektal-kanser | SB Kolorektal Kanser KP
S: Evre III kolon kanserinde adjuvan tedavi?
+ oksaliplatin bazlı kemoterapi (FOLFOX / CAPOX) ; düşük riskte 3 ay CAPOX yeterli olabilir ; nöropati izlemi ; MSI / RAS değerlendirmesi metastatik hastalıkta
- adjuvan tedavi gereksiz ; RAS mutantta anti-EGFR
#12 ilac 3 - | DPD eksikliği
S: 5-FU / kapesitabin öncesi DPD eksikliği neden önemlidir?
+ DPD eksikliğinde ağır / ölümcül toksisite ; tedavi öncesi DPYD genotipleme / DPD fenotipleme ; kısmi eksiklikte doz azaltma, tam eksiklikte kaçınma
- DPD önemsiz ; tam eksiklikte standart doz
#13 kilavuz 2 sb-kp-prostat-kanseri | SB Prostat Kanseri KP
S: Metastatik hormona duyarlı prostat kanserinde tedavi?
+ androjen deprivasyon tedavisi ; ADT'ye ek: abirateron, enzalutamid, apalutamid veya dosetaksel ; kemik sağlığı (bisfosfonat / denosumab, D vitamini) ; metabolik izlem
- ADT tek başına tüm hastalarda yeterli ; kemik sağlığı önemsiz
#14 kirmizi 2 - | nötropenik enterokolit
S: Kemoterapi sonrası nötropenik hastada sağ alt kadran ağrısı ve ateş. Ne düşünürsün?
+ nötropenik enterokolit (tiflit) ; BT ; geniş spektrumlu antibiyotik (anaerop kapsamlı), barsak istirahati ; perforasyonda cerrahi
- apandisit, kolonoskopi ; antibiyotik gereksiz
#15 kilavuz 2 - | onkoloji palyatif
S: İleri evre kanserli hastada erken palyatif bakımın yararı?
+ semptom kontrolü ve yaşam kalitesi artışı ; bazı çalışmalarda sağkalım katkısı ; hedeflerin konuşulması / ileri bakım planlaması ; ailenin desteklenmesi
- palyatif bakım yalnız son günlerde ; aktif tedaviyle birlikte verilemez
#16 ilac 2 - | kanser ağrısı
S: Kanser ağrısında opioid başlangıcı ve yan etki yönetimi?
+ ağrı şiddetine göre ; morfin standart başlangıç, düzenli + kurtarma dozu ; profilaktik laksatif ; bulantı, sedasyon izlemi ; böbrek yetmezliğinde morfinden kaçınma
- bağımlılık korkusuyla opioid verilmez ; laksatif gereksiz
#17 kirmizi 2 - | kanser VTE
S: Aktif kanserli hastada DVT. Antikoagülasyon seçimi?
+ LMWH veya NOAK (apiksaban, edoksaban, rivaroksaban) ; GİS / genitoüriner kanserde NOAK kanama riski ; en az 6 ay, aktif kanserde sürdürme ; ilaç etkileşimleri
- warfarin ilk seçenek ; 1 ay yeterli
#18 kilavuz 3 - | akciğer kanseri biyobelirteç
S: Metastatik akciğer adenokarsinomunda tedavi öncesi hangi testler?
+ EGFR, ALK, ROS1, BRAF, KRAS G12C, MET, RET, NTRK (NGS) ; PD-L1 ekspresyonu ; sürücü mutasyonda hedefe yönelik tedavi ; mutasyon yoksa immünoterapi ± kemoterapi
- biyobelirteç gereksiz, herkese kemoterapi ; EGFR mutantta immünoterapi tek başına ilk seçenek
#19 sgk 2 sgk-sut | SUT onkoloji ilaç (güncel madde doğrulanacak)
S: Hedefe yönelik / immünoterapi ilaçlarının SGK geri ödemesinde genel çerçeve?
+ SUT'ta endikasyon ve basamak koşulları ; tıbbi onkoloji uzmanı içeren sağlık kurulu raporu ; biyobelirteç belgelenmesi ; bazı ilaçlar endikasyon dışı / özel izin ; güncel SUT'tan doğrulanmalı
- tüm onkoloji ilaçları raporsuz ; biyobelirteç belgesi gerekmez
#20 tuzak 2 - | alternatif tedavi
S: Kemoterapi alan hasta yüksek doz antioksidan / bitkisel tedavi kullanmak istiyor. Ne söylersin?
+ kanıtsız ; etkileşim (CYP), karaciğer toksisitesi, kemoterapinin etkinliğini azaltma riski ; onkoloğa bildirim ; dengeli beslenme
- bitkisel tedavi kemoterapinin yerine geçer ; doğal ürünler zararsız
#21 kirmizi 2 - | beyin metastazı
S: Kanser öyküsü olan hastada baş ağrısı, kusma ve yeni nöbet. Yaklaşım?
+ beyin metastazı şüphesi ; kontrastlı beyin MR ; ödemde deksametazon ; nöbette antiepileptik (profilaksi rutin değil) ; stereotaktik radyocerrahi / cerrahi / tüm beyin RT
- migren ; nöbet olmayanlara rutin antiepileptik
#22 ilac 2 - | antrasiklin kardiyotoksisite
S: Antrasiklin tedavisinde kardiyotoksisiteyi önleme?
+ kümülatif doz sınırı ; başlangıç ve izlem EKO (EF, GLS) ; KV risk faktörlerinin kontrolü ; deksrazoksan seçilmiş hastada ; trastuzumab ile birlikte risk artışı
- doz sınırı yok ; EKO gereksiz
#23 kilavuz 2 sb-kanser-tarama-standartlari | Ulusal Kanser Tarama Standartları
S: Türkiye'de ulusal kanser taramaları hangileridir?
+ serviks (HPV-DNA, 30–65 yaş, 5 yılda bir) ; meme (mamografi, 40–69 yaş, 2 yılda bir) ; kolorektal (FIT, 50–70 yaş, 2 yılda bir) ; KETEM aracılığıyla ücretsiz
- prostat taraması tüm erkeklerde ulusal program ; serviks taraması 18 yaşında başlar
#24 kirmizi 2 - | hiponatremi SIADH
S: Küçük hücreli akciğer kanserli hastada Na 122 ve konfüzyon. Ne düşünürsün?
+ SIADH ; idrar ozmolalitesi ve sodyumu ; semptomatik ağır hiponatremide hipertonik salin ; sıvı kısıtlaması, tolvaptan seçilmiş ; düzeltme hızı sınırı
- hızlı tam düzeltme ; bol hipotonik sıvı
#25 ilac 3 - | oral kemoterapi etkileşim
S: Oral tirozin kinaz inhibitörü kullanan hastada hangi etkileşimlere dikkat edilir?
+ CYP3A4 inhibitör / indükleyicileri (azoller, makrolid, rifampisin, sarı kantaron, greyfurt) ; mide asidi baskılayıcılar emilimi azaltabilir ; QT uzaması ; ilaç listesinin eczacı ile kontrolü
- etkileşim yoktur ; PPI her zaman güvenle eklenir
#26 kilavuz 2 - | onkolojik aşılama
S: Kemoterapi alan hastada aşılama önerileri?
+ inaktif influenza aşısı önerilir ; canlı aşılar kontrendike ; pnömokok aşısı ; mümkünse aşılar kemoterapi öncesi ; ev halkının aşılanması
- kemoterapide canlı aşılar güvenli ; influenza aşısı kontrendike
#27 tuzak 2 - | şeker kanseri
S: Kanser hastasına "şekeri tamamen kesersen tümör küçülür" demek doğru mu?
+ diyet şekerini kesmek tümörü küçültmez ; malnütrisyon riski ; dengeli beslenme ve diyetisyen ; ketojenik diyetin kanıtı sınırlı
- tüm karbonhidratlar kesilmeli ; açlık kemoterapiyi güçlendirir, herkese
#28 kirmizi 2 - | hiperviskozite
S: Multipl miyelomlu hastada baş ağrısı, görme bulanıklığı ve mukozal kanama. Ne düşünürsün?
+ hiperviskozite sendromu ; serum viskozitesi ; acil plazmaferez ; altta yatan miyelomun tedavisi ; transfüzyondan kaçınma (viskoziteyi artırır)
- hemen eritrosit transfüzyonu ; migren
#29 yaygin 2 - | kanser yorgunluğu
S: Kanser ilişkili yorgunlukta yaklaşım?
+ geri dönüşümlü nedenler: anemi, hipotiroidi, depresyon, uyku, ilaçlar, elektrolit ; egzersiz en güçlü kanıt ; psikososyal destek ; enerji koruma
- tam istirahat önerilir ; nedenler araştırılmaz
#30 kilavuz 2 - | genetik danışmanlık
S: Hangi kanser hastalarına germline genetik test önerilir?
+ genç yaşta tanı, ailede çoklu kanser ; over kanseri, erkek meme kanseri, pankreas kanseri, metastatik prostat ; üçlü negatif meme kanseri ; BRCA pozitifliğinde PARP inhibitörü ve aile taraması
- genetik test hiçbir kanserde gerekmez ; yalnız 70 yaş üstü
`,
} satisfies BankaKaynagi
