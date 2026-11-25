import type { BankaKaynagi } from '../banka'

/** AKKS — Göğüs Cerrahisi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'gogus-cerrahisi',
  onek: 'GCH',
  metin: String.raw`
#1 kirmizi 3 - | tansiyon pnömotoraks
S: Travma sonrası hipotansiyon, trakea deviasyonu ve tek taraflı solunum sesi yokluğu. Ne yaparsın?
+ tansiyon pnömotoraks klinik tanıdır ; grafi beklemeden iğne dekompresyonu veya parmak torakostomi ; ardından göğüs tüpü ; ABCDE
- önce BT ; yalnız oksijen
#2 kirmizi 3 - | masif hemotoraks
S: Göğüs tüpü takıldıktan hemen sonra 1500 ml kan drene oldu. Yaklaşım?
+ masif hemotoraks ; acil torakotomi endikasyonu (ilk drenaj ≥1500 ml veya 2–4 saat boyunca ≥200 ml/saat) ; resüsitasyon, masif transfüzyon ; cerrahi ekip
- tüpü klemple ve bekle ; ayaktan izlem
#3 yaygin 2 - | göğüs tüpü bakımı
S: Göğüs tüpü takılı hastada izlem ve çıkarma kriterleri?
+ hava kaçağı yokluğu ; drenaj miktarı azalması (genellikle <200–300 ml/gün, seröz) ; akciğer ekspansiyonunun grafide doğrulanması ; tüpün transport sırasında rutin klemplenmemesi
- hava kaçağı devam ederken çıkarma ; tüp rutin klemplenir
#4 kilavuz 3 - | akciğer kanseri operabilite
S: Evre I küçük hücreli dışı akciğer kanserinde cerrahi öncesi değerlendirme?
+ PET-BT ve mediastinal evreleme (EBUS gerekirse) ; solunum fonksiyonu (FEV1, DLCO) ve postoperatif tahmini değerler ; kardiyopulmoner egzersiz testi sınırda hastada ; lobektomi / segmentektomi (küçük periferik tümörde) ; VATS / robotik
- evreleme olmadan pnömonektomi ; DLCO gereksiz
#5 kirmizi 2 - | ampiyem
S: Parapnömonik efüzyonda pH 7,0 ve pürülan sıvı. Tedavi?
+ ampiyem ; göğüs tüpü ile drenaj ; antibiyotik ; lokülasyonda intraplevral fibrinolitik + DNaz ; yanıtsızlıkta VATS dekortikasyon
- yalnız oral antibiyotik ; drenaj gereksiz
#6 yaygin 2 - | spontan pnömotoraks cerrahi
S: İkinci kez aynı tarafta spontan pnömotoraks geçiren hastada tedavi?
+ tekrarlayan pnömotoraksta cerrahi (VATS bül rezeksiyonu + plörodezis) ; mesleki risk (pilot, dalgıç) ilk atakta da cerrahi ; sigara bırakma
- her nüks yalnız aspirasyonla ; dalış güvenli
#7 kirmizi 2 - | özofagus perforasyonu
S: Şiddetli kusma sonrası göğüs ağrısı ve subkutan amfizem. Ne düşünürsün?
+ Boerhaave sendromu ; suda çözünür kontrastlı özofagografi / BT ; oral alımın kesilmesi, geniş spektrumlu antibiyotik, antifungal ; erken cerrahi onarım / stent ; mediastinit riski
- MI, nitrat ; oral beslenmeye devam
#8 kilavuz 2 - | soliter pulmoner nodül
S: 1,5 cm solid, düzensiz kenarlı akciğer nodülü olan sigara içen hasta. Yaklaşım?
+ yüksek malignite olasılığı ; PET-BT ; doku tanısı (BT eşliğinde biyopsi) veya doğrudan cerrahi rezeksiyon ; multidisipliner konsey
- 2 yıl sonra kontrol ; antibiyotik deneme
#9 kirmizi 2 - | flail chest
S: Çoklu kot kırığı ve paradoksal göğüs hareketi olan travma hastası. Tedavi?
+ yelken göğüs ; altta yatan akciğer kontüzyonu ; etkin analjezi (epidural / rejyonel blok) ; solunum desteği / NIV / entübasyon gerektiğinde ; seçilmiş hastada cerrahi kot fiksasyonu
- göğsü bandajla sıkıca sarma ; analjezi gereksiz
#10 yaygin 2 - | kot kırığı yaşlı
S: Yaşlı hastada 3 kot kırığı. Neden dikkatli izlem gerekir?
+ yaşlıda morbidite / mortalite artışı (pnömoni, solunum yetmezliği) ; agresif multimodal analjezi ve rejyonel blok ; spirometri teşviki, mobilizasyon ; yatış eşiği düşük
- kot kırığı yaşlıda önemsiz ; bandaj ile sıkı sarma
#11 kilavuz 2 - | mediastinal kitle
S: Ön mediastende kitle saptanan genç erkekte ayırıcı tanı?
+ "4T": timoma, teratom / germ hücreli tümör, (terrible) lenfoma, tiroid ; tümör belirteçleri (AFP, β-hCG, LDH) ; myastenia sorgulanması ; anestezide havayolu kompresyonu riski
- tüm kitleler timoma, doğrudan cerrahi ; belirteç gereksiz
#12 kirmizi 3 - | anestezi mediastinal kitle
S: Büyük ön mediastinal kitlesi olan hastaya genel anestezi verilecek. Risk nedir?
+ indüksiyonda havayolu / vasküler kolaps riski ; spontan solunumun korunması, uyanık değerlendirme ; mümkünse lokal anestezi altında tanı ; ECMO hazırlığı yüksek riskte
- kas gevşetici ile rutin indüksiyon güvenli ; risk yoktur
#13 yaygin 2 - | hiperhidroz sempatektomi
S: Palmar hiperhidrozda torakal sempatektominin yeri?
+ konservatif tedavilere dirençli vakada ; VATS sempatektomi ; kompansatuvar terleme önemli yan etki ; hastanın ayrıntılı bilgilendirilmesi
- ilk basamak tedavi ; yan etkisi yoktur
#14 kirmizi 2 - | trakeal stenoz
S: Uzun süre entübe kalmış hastada taburculuk sonrası ilerleyici stridor. Ne düşünürsün?
+ postentübasyon trakeal stenoz ; BT / bronkoskopi ; endoskopik dilatasyon / stent veya trakeal rezeksiyon ; astım olarak yanlış tanılanabilir
- astım, inhaler ; görüntüleme gereksiz
#15 kilavuz 2 - | plörodezis malign efüzyon
S: Malign plevral efüzyonda tekrarlayan sıvı birikimine yaklaşım?
+ semptomatik efüzyonda terapötik torasentez ; tekrarlayanda tünelli plevral kateter veya talk plörodezis ; akciğer ekspansiyonu (sıkışmış akciğerde kateter) ; yaşam beklentisi ve hasta tercihi
- haftalık tekrar torasentez ömür boyu ; sıkışmış akciğerde plörodezis
#16 ilac 2 - | postop analjezi torakotomi
S: Torakotomi sonrası ağrı kontrolü?
+ torakal epidural veya paravertebral / erektör spina bloğu ; multimodal analjezi (parasetamol, NSAİİ) ; kronik post-torakotomi ağrısının önlenmesi ; spirometri teşviki
- yalnız oral parasetamol ; ağrı kontrolü solunumu etkilemez
#17 kirmizi 2 - | bronkoplevral fistül
S: Lobektomi sonrası günler içinde ani balgam artışı, ateş ve plevral boşlukta yeni hava-sıvı seviyesi. Ne düşünürsün?
+ bronkoplevral fistül ; drenaj, antibiyotik ; bronkoskopi ; cerrahi / endoskopik kapama ; aspirasyonu önlemek için hastayı etkilenen taraf aşağı yatırma
- pnömoni, yalnız oral antibiyotik ; hastayı sağlam taraf aşağı yatırma
#18 tuzak 2 - | göğüs tüpü klempleme
S: Hasta transferi sırasında göğüs tüpü rutin olarak klemplenmeli mi?
+ hava kaçağı olan tüpün klemplenmesi tansiyon pnömotoraksa yol açabilir ; rutin klempleme önerilmez ; şişe göğüs seviyesinin altında tutulur ; çıkarma öncesi seçilmiş klempleme denemesi kontrollü
- transferde her zaman klemplenir ; şişe göğüs seviyesinin üzerinde
#19 yaygin 2 - | pektus ekskavatum
S: Pektus ekskavatumlu ergende cerrahi endikasyon?
+ Haller indeksi >3,25 ; kardiyopulmoner semptom / bası ; psikososyal etki ; Nuss prosedürü (genellikle ergenlikte)
- tüm vakalar kozmetiktir, asla ameliyat ; 3 yaşında ameliyat
#20 kirmizi 2 - | aort yaralanması
S: Yüksek hızlı kaza sonrası grafide mediasten genişlemesi. Ne yaparsın?
+ künt aort yaralanması şüphesi ; BT anjiyografi ; KB / kalp hızı kontrolü ; TEVAR ; kalp-damar / göğüs cerrahisi
- normal, ayaktan ; KB yüksek tutulur
#21 kilavuz 2 sb-kp-koah | akciğer volüm azaltma
S: Ağır amfizemde akciğer volüm azaltıcı tedavi kimlere düşünülür?
+ üst lob ağırlıklı heterojen amfizem ; optimal medikal tedavi ve pulmoner rehabilitasyon sonrası ; sigara bırakılmış ; cerrahi veya endobronşiyal valf ; transplant değerlendirmesi
- sigara içenlerde de uygun ; tüm KOAH'lılara
#22 yaygin 2 - | tüp torakostomi yeri
S: Göğüs tüpü güvenli üçgen nedir?
+ pektoralis majör lateral kenarı, latissimus dorsi ön kenarı ve meme başı hizası (5. ICS) ; kotun üst kenarından girme (nörovasküler demet) ; künt diseksiyon ; trokar kullanımından kaçınma
- kotun alt kenarından girilir ; trokar ile rutin
#23 kirmizi 2 - | şilotoraks
S: Toraks cerrahisi sonrası tüpten süt beyazı drenaj. Ne düşünürsün?
+ şilotoraks ; sıvıda trigliserid (>110 mg/dL) / şilomikron ; orta zincirli yağ diyeti veya TPN, oktreotid ; yüksek debide duktus torasikus ligasyonu / embolizasyon
- ampiyem, antibiyotik ; normal diyet
#24 sgk 2 sgk-sut | SUT torasik cerrahi paket (güncel madde doğrulanacak)
S: Göğüs cerrahisi işlemlerinin SGK faturalandırmasında genel ilke?
+ SUT'ta tanımlı işlem / paket kodları ; pakete dahil olan malzeme ve hizmetler ; ayrıca faturalanabilen kalemler (bazı stapler / malzeme) ; güncel SUT'tan doğrulanmalı
- her kalem paketten bağımsız faturalanır ; işlem kodu gerekmez
#25 kirmizi 3 - | tracheostomi kanama
S: Trakeostomili hastada kanülden küçük "uyarıcı" kanama sonrası masif kanama. Ne düşünürsün?
+ trakeoinnominat fistül ; kafın aşırı şişirilmesi / parmak ile innominat arterin sternuma bastırılması ; acil cerrahi ; uyarıcı kanamada acil bronkoskopi / değerlendirme
- küçük kanama önemsiz ; kanül çıkarılıp izlem
#26 tuzak 2 - | KOAH ameliyat riski
S: FEV1 düşük olan hastada akciğer rezeksiyonu kararı yalnız FEV1'e göre verilir mi?
+ FEV1 ve DLCO birlikte, postoperatif tahmini değerler ; sınırda hastada kardiyopulmoner egzersiz testi (VO2maks) ; kardiyak risk ; sublober rezeksiyon seçeneği
- yalnız FEV1 yeterli ; DLCO gereksiz
#27 yaygin 2 - | timoma myastenia
S: Myastenia gravisli hastada timektomi endikasyonu?
+ timoma varlığında timektomi ; timomasız jeneralize AChR pozitif MG'de (genellikle 18–65 yaş) timektomi semptom ve ilaç gereksinimini azaltır ; operasyon öncesi MG kontrolü ; perioperatif kriz riski
- timektomi yalnız oküler MG'de ; MG kontrolsüzken ameliyat
#28 kirmizi 2 - | yabancı cisim aspirasyonu
S: Erişkinde yabancı cisim aspirasyonu şüphesinde yaklaşım?
+ BT ; bronkoskopi (fleksibl / rijit) ile çıkarma ; komplikasyonlar (postobstrüktif pnömoni) ; tam tıkanmada Heimlich / acil havayolu
- antibiyotik yeterli ; grafi normalse dışlanır
#29 kilavuz 2 - | VATS
S: VATS'ın açık torakotomiye göre avantajları?
+ daha az ağrı ; kısa hastanede kalış ; daha az komplikasyon ; benzer onkolojik sonuç (uygun hastada) ; erken mobilizasyon
- VATS onkolojik olarak kesin daha kötü ; tüm vakalar açık yapılmalı
#30 kirmizi 2 - | diafragma yaralanması
S: Sol torakoabdominal penetran yaralanmada diafragma yaralanmasından şüphe. Tanı?
+ BT duyarlılığı sınırlı ; tanısal laparoskopi / torakoskopi ; atlanan yaralanma geç herniasyon ; onarım
- normal BT diafragma yaralanmasını kesin dışlar ; izlem
`,
} satisfies BankaKaynagi
