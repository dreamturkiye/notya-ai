import type { BankaKaynagi } from '../banka'

/** AKKS — Spor Hekimliği. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'spor-hekimligi',
  onek: 'SPR',
  metin: String.raw`
#1 kirmizi 3 - | sporda ani kardiyak arrest
S: Maç sırasında yere yığılan sporcu. İlk müdahale?
+ kardiyak arrest kabul et ; hemen KPR ve OED (otomatik eksternal defibrilatör) ; 112 ; nöbet benzeri hareketler arresti gizleyebilir ; acil eylem planı
- nöbet sanıp dili çekme ; OED gelene kadar beklemek
#2 kilavuz 2 - | sporcu ön değerlendirme
S: Sporcu ön katılım değerlendirmesinde kardiyak tarama?
+ kişisel / aile öyküsü (ani ölüm, senkop, efor göğüs ağrısı) ; fizik muayene (üfürüm, Marfan) ; EKG (ESC yaklaşımı, sporcu EKG yorumlama kriterleri) ; anormal bulguda EKO / ileri tetkik
- öykü gereksiz ; tüm sporculara rutin MR
#3 kirmizi 2 - | beyin sarsıntısı
S: Kafa darbesi sonrası baş dönmesi ve konfüzyon yaşayan futbolcu. Yaklaşım?
+ beyin sarsıntısı şüphesi ; aynı gün oyuna dönüş yok ; SCAT değerlendirmesi ; kırmızı bayrakta (kötüleşme, kusma, nöbet) acil görüntüleme ; kademeli oyuna dönüş protokolü
- semptomlar geçerse aynı maçta oyuna döner ; tam karanlık odada haftalarca istirahat
#4 kilavuz 2 - | kademeli oyuna dönüş
S: Beyin sarsıntısı sonrası kademeli oyuna dönüş protokolü?
+ 24–48 saat göreceli istirahat sonrası semptom sınırlı aktivite ; aşamalı artış (hafif aerobik → spora özgü → temassız → tam temas → maç) ; her aşama en az 24 saat, semptom olursa geri dönülür ; tıbbi onay
- semptom varken tam temas ; 1 gün sonra maç
#5 kirmizi 2 - | ısı çarpması
S: Sıcak havada maraton koşucusu bilinç bulanıklığıyla yığıldı, rektal ısı 41 °C. Tedavi?
+ egzersizle ilişkili ısı çarpması ; hızlı soğuk su immersiyonu (soğut, sonra taşı) ; ABC ; hiponatremi ayırıcı tanısı ; komplikasyon izlemi
- antipiretik ; önce hastaneye taşı, sonra soğut
#6 kirmizi 2 - | egzersiz hiponatremi
S: Uzun yarışta aşırı su içen koşucuda bulantı, konfüzyon ve nöbet. Ne düşünürsün?
+ egzersizle ilişkili hiponatremi ; serum sodyum ; semptomatikte hipertonik salin ; hipotonik sıvı verilmez ; susuzluğa göre içme önerisi
- bol hipotonik IV sıvı ; dehidratasyon kesin
#7 yaygin 2 - | ayak bileği burkulması
S: Lateral ayak bileği burkulmasında tedavi ve dönüş?
+ Ottawa kuralları ile grafi kararı ; erken fonksiyonel tedavi (PEACE & LOVE / koruma, kademeli yük) ; propriosepsiyon ve kuvvet egzersizleri ; bant / ortez nüksü azaltır
- uzun süreli alçı ; propriosepsiyon gereksiz
#8 yaygin 2 - | ön çapraz bağ
S: ÖÇB yırtığı olan genç futbolcuda tedavi?
+ rekonstrüksiyon (pivot sporlara dönüş isteyen) ; ameliyat öncesi ödem azalması ve tam ekstansiyon ; uzun rehabilitasyon (9–12 ay) ; dönüş kriterleri (kuvvet, fonksiyonel testler) ; önleme programları
- 6 haftada maça dönüş ; rehabilitasyon gereksiz
#9 kilavuz 2 - | anti-doping
S: Sporcuya ilaç reçete ederken doping açısından nelere dikkat edilir?
+ WADA Yasaklılar Listesi (güncel yıl) ; Türkiye Doping ile Mücadele Komisyonu ; yasaklı madde gerekiyorsa Tedavi Amaçlı Kullanım İstisnası (TUE) ; takviyelerde kontaminasyon riski ; sporcunun kendi sorumluluğu
- hekim reçetesi doping kuralından muaf tutar ; takviyeler güvenli
#10 ilac 2 - | doping yasaklı
S: Hangi yaygın ilaçlar sporcu için yasaklı olabilir?
+ sistemik glukokortikoidler (yarışma içi, uygulama yoluna göre) ; diüretikler (maskeleme) ; bazı beta-2 agonistler (doz / türe göre), psödoefedrin eşik üstü ; beta blokerler bazı sporlarda ; güncel liste kontrolü
- diüretikler serbest ; tüm inhalerler yasak
#11 kirmizi 2 - | egzersiz göğüs ağrısı
S: Genç sporcuda efor sırasında göğüs ağrısı ve senkop. Ne yaparsın?
+ spor kısıtlanır ; EKG, EKO ; HCM, koroner anomali, aritmi araştırması ; kardiyoloji sevki ; aile taraması gerekirse
- egzersize devam ; anksiyete
#12 yaygin 2 - | kadın sporcu RED-S
S: Adet düzensizliği ve stres kırığı olan kadın sporcuda değerlendirme?
+ sporda göreceli enerji yetersizliği (RED-S) ; enerji alımının artırılması, diyetisyen ; kemik sağlığı (DXA) ; yeme bozukluğu taraması ; antrenman yükü düzenleme
- adet düzensizliği sporcuda normal ; OKS tek tedavi
#13 yaygin 2 - | stres kırığı
S: Koşucuda kademeli artan tibia ağrısı, nokta hassasiyet. Yaklaşım?
+ stres kırığı şüphesi ; erken dönemde grafi normal olabilir, MR ; yük azaltma, kademeli dönüş ; yüksek riskli lokalizasyonlar (femur boynu, naviküler) ; enerji ve D vitamini değerlendirmesi
- grafi normalse koşuya devam ; MR gereksiz
#14 kirmizi 3 - | femur boynu stres kırığı
S: Koşucuda kasık ağrısı, MR'da femur boynu gerilim tarafı stres kırığı. Ne yaparsın?
+ yüksek riskli stres kırığı ; yük vermenin kesilmesi ; ortopedi — cerrahi tespit değerlendirmesi ; deplase olursa avasküler nekroz riski
- ağrı kesiciyle koşuya devam ; fizik tedavi tek başına
#15 yaygin 2 - | patellar tendinopati
S: Voleybolcuda patella alt kutbunda ağrı. Tedavi?
+ patellar tendinopati ; yük yönetimi ; izometrik → eksantrik / ağır yavaş direnç egzersizleri ; steroid enjeksiyonu önerilmez (rüptür) ; PRP / ESWT seçilmiş
- tam istirahat ; tendon içine steroid enjeksiyonu
#16 ilac 2 - | NSAİİ sporcu
S: Sporcularda yarış öncesi rutin NSAİİ kullanımı uygun mu?
+ rutin profilaktik NSAİİ önerilmez ; böbrek hasarı (dehidratasyonla), GİS riski ; hiponatremi ilişkisi ; ağrıyı maskeleyip yaralanmayı artırma
- her yarıştan önce NSAİİ ; dehidratasyonda güvenli
#17 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Çocuk ve ergenler için fiziksel aktivite önerisi?
+ günde ortalama en az 60 dk orta-yüksek şiddette aktivite ; haftada 3 gün kas ve kemik güçlendirme ; ekran süresinin sınırlanması ; yaşa uygun çeşitli aktiviteler
- haftada 60 dk yeterli ; çocuklarda kuvvet antrenmanı yasak
#18 tuzak 2 - | çocuk ağırlık antrenmanı
S: Çocuklarda ağırlık / kuvvet antrenmanı büyüme plaklarına zarar verir mi?
+ uygun denetimli ve tekniğe dayalı kuvvet antrenmanı çocuklarda güvenli ve yararlı ; maksimal kaldırışlar ve kötü teknikten kaçınma ; aşamalı yük ; büyüme plak yaralanmaları çoğunlukla kaza / kötü denetim ile
- çocuklarda kuvvet antrenmanı boy uzamasını durdurur ; kesinlikle yasak
#19 kirmizi 2 - | omuz çıkığı sporcu
S: Genç sporcuda ilk ön omuz çıkığı sonrası nüks riski ve yaklaşım?
+ genç temas sporcusunda nüks riski yüksek ; redüksiyon sonrası MR (Bankart) ; rehabilitasyon veya erken cerrahi stabilizasyon seçenekleri ; aksiller sinir muayenesi
- nüks riski düşük, izlem yeterli ; sinir muayenesi gereksiz
#20 yaygin 2 - | hamstring
S: Sprint sırasında arka uyluk ağrısı (hamstring zorlanması). Tedavi?
+ derece ve yer değerlendirmesi (MR seçilmiş) ; erken kademeli yük, eksantrik egzersiz (Nordic) ; sprint öncesi kriterlere dayalı dönüş ; nüks önleme
- uzun süreli tam istirahat ; masaj ve sıcak tek tedavi
#21 ilac 3 - | astım sporcu
S: Egzersizle bronkokonstriksiyonu olan sporcuda tedavi ve doping?
+ egzersiz öncesi kısa etkili beta-2 agonist veya düşük doz İKS-formoterol ; sık kullanımda İKS ; salbutamol / formoterol / salmeterol izin verilen doz sınırları (WADA) ; tanının objektif testle belgelenmesi
- tüm beta-2 agonistler yasak ; tanı belgesi gereksiz
#22 kirmizi 2 - | rabdomiyoliz egzersiz
S: Yoğun antrenman sonrası şiddetli kas ağrısı ve koyu idrar. Ne yaparsın?
+ egzersizle ilişkili rabdomiyoliz ; CK, böbrek fonksiyonu, elektrolit ; IV hidrasyon ; orak hücre taşıyıcılığı, ilaç / takviye sorgulama ; kademeli dönüş
- normal kas ağrısı, antrenmana devam ; NSAİİ
#23 sgk 1 - | spor hekimliği rapor
S: Lisans için "sporcu sağlık raporu" kim tarafından düzenlenir?
+ ilgili spor federasyonu ve mevzuatın belirlediği hekimler / sağlık kuruluşları ; branşa göre ek tetkik gereksinimi ; rapor geçerlilik süresi ; güncel mevzuattan doğrulanmalı
- her rapor SGK tarafından ödenir ; rapor hiçbir branşta gerekmez
#24 yaygin 2 - | aşırı antrenman
S: Performans düşüşü, yorgunluk ve uyku bozukluğu olan sporcuda ne düşünürsün?
+ aşırı antrenman / fonksiyonel aşırı yüklenme ; diğer nedenlerin dışlanması (anemi, tiroid, enfeksiyon, RED-S, depresyon) ; dinlenme ve yük azaltma ; periyodizasyon
- antrenmanı artır ; tetkik gereksiz
#25 kilavuz 2 - | geriatrik egzersiz
S: Yaşlı erişkinde egzersiz reçetesi?
+ aerobik + kuvvet + denge ; düşme önleme ; kademeli başlama ; kronik hastalığa göre uyarlama, gerekirse kardiyak değerlendirme
- yaşlıda kuvvet egzersizi zararlı ; denge önemsiz
#26 kirmizi 2 - | spleen sporcu mononükleoz
S: Enfeksiyöz mononükleoz geçiren sporcu ne zaman temas sporlarına döner?
+ dalak rüptürü riski (ilk 3–4 hafta en yüksek) ; en az 3 hafta temas / zorlayıcı sporlardan uzak ; semptomlar geçtikten sonra kademeli ; splenomegali değerlendirmesi
- ateş geçince ertesi gün temas sporu ; risk yoktur
#27 tuzak 2 - | statik germe ısınma
S: Patlayıcı güç gerektiren sporlarda ısınmada uzun statik germe önerilir mi?
+ uzun statik germe kısa süreli kuvvet / güç performansını azaltabilir ; dinamik ısınma tercih ; statik germe soğumada / ayrı seanslarda
- yarış öncesi 10 dk statik germe en iyi ; ısınma gereksiz
#28 yaygin 2 - | kreatin
S: Sporcunun kreatin takviyesi kullanmasına yaklaşım?
+ kreatin monohidrat kısa süreli yüksek şiddetli performansta kanıtlı ve sağlıklı bireyde genelde güvenli ; böbrek hastalığında dikkat ; kontaminasyon riski — sertifikalı ürün ; yeterli sıvı
- kreatin dopingdir ; sağlıklı böbrekte kesin hasar
#29 kirmizi 2 - | servikal travma sporcu
S: Temaslı sporda boyun yaralanması, kollarda uyuşma. Saha yaklaşımı?
+ servikal omurga koruması ; nörolojik muayene ; kask / omuz pedi uygun teknikle ; acil görüntüleme ve sevk ; geçici nöropraksi bile değerlendirme gerektirir
- sporcuyu ayağa kaldır ve yürüt ; aynı maçta dönüş
#30 ilac 2 - | enjeksiyon sporcu steroid
S: Sporcuda yarışmadan önce lokal kortikosteroid enjeksiyonunda doping kuralı?
+ WADA kurallarında yarışma içi glukokortikoid enjeksiyonları uygulama yoluna göre yasaklı (güncel liste) ; bekleme süreleri ; gerekirse TUE ; tendon içine enjeksiyondan kaçınma
- lokal enjeksiyonlar her zaman serbest ; TUE gerekmez
`,
} satisfies BankaKaynagi
