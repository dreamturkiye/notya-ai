import type { BankaKaynagi } from '../banka'

/** AKKS — Göğüs Hastalıkları. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'gogus-hastaliklari',
  onek: 'GHS',
  metin: String.raw`
#1 kilavuz 2 sb-kp-astim | SB Astım KP; GINA güncel
S: Erişkin hafif astımda güncel tedavi önerisi (yalnız SABA'ya karşı)?
+ yalnız SABA tedavisi önerilmez ; ihtiyaç halinde düşük doz İKS-formoterol (tercih edilen yol) ; alternatif düzenli düşük doz İKS + ihtiyaçta SABA ; inhaler tekniği ve uyum
- yalnız salbutamol en güvenli yaklaşım ; LABA tek başına
#2 tuzak 2 - | LABA monoterapi
S: Astımda uzun etkili beta agonist tek başına (İKS olmadan) kullanılabilir mi?
+ astımda LABA monoterapisi ciddi atak / ölüm riski nedeniyle kontrendike ; her zaman İKS ile birlikte ; KOAH'ta LABA monoterapisi farklı
- astımda LABA tek başına yeterli ; İKS gereksiz
#3 kilavuz 2 sb-kp-koah | SB KOAH KP; GOLD güncel
S: KOAH'ta başlangıç inhaler tedavisi nasıl seçilir?
+ GOLD ABE gruplaması ; çoğu semptomatik hastada LAMA + LABA ; eozinofil ≥300 ve sık alevlenmede İKS eklenmesi ; sigara bırakma, aşılar, pulmoner rehabilitasyon
- İKS tek başına ilk seçenek ; sigara bırakma ikincil
#4 kirmizi 2 - | KOAH alevlenme
S: KOAH alevlenmesinde hastaneye yatış ve tedavi?
+ kısa etkili bronkodilatörler ; sistemik steroid 5 gün ; pürülan balgamda antibiyotik ; kontrollü oksijen (SpO2 %88–92) ; hiperkapnik solunum yetmezliğinde NIV
- yüksek akım oksijen ; steroid 14 gün
#5 kilavuz 2 - | spirometri
S: KOAH tanısında spirometrik kriter?
+ bronkodilatör sonrası FEV1/FVC <0,70 ; semptom ve risk faktörü ; şiddet FEV1 % beklenen ile ; reversibilite testi astım ayrımında
- spirometri gereksiz, grafiyle tanı ; bronkodilatör öncesi değer yeterli
#6 kirmizi 3 - | pulmoner emboli tedavi
S: Hemodinamik stabil, RV disfonksiyonu olmayan PE'de tedavi?
+ düşük riskli PE ; antikoagülasyon (NOAK tercih) ; seçilmiş hastada ayaktan tedavi (sPESI 0) ; süre: provoke 3 ay, provoke edilmemiş uzun süreli değerlendirme ; tromboliz endike değil
- tüm PE'lerde tromboliz ; 1 hafta antikoagülasyon
#7 kilavuz 3 - | latent TB / aktif TB
S: Akciğer tüberkülozu şüphesinde tanı?
+ balgam ARB yayma, kültür ve hızlı moleküler test (GeneXpert — rifampisin direnci) ; akciğer grafisi / BT ; HIV testi ; bildirim, Verem Savaşı Dispanseri ; temaslı taraması
- tek negatif yayma TB'yi dışlar ; bildirim gerekmez
#8 kirmizi 2 - | pnömotoraks
S: Uzun boylu genç erkekte ani göğüs ağrısı ve nefes darlığı; grafide büyük primer spontan pnömotoraks. Tedavi?
+ semptomatik büyük pnömotoraksta iğne aspirasyonu veya küçük çaplı göğüs tüpü ; minimal semptomatikte konservatif izlem seçeneği ; tekrarlayanda cerrahi (VATS) ; sigara bırakma, uçuş / dalış önerileri
- tüm vakalarda hemen torakotomi ; dalış güvenli
#9 yaygin 2 - | KOAH sigara bırakma
S: Sigara bırakmada farmakoterapi seçenekleri?
+ vareniklin (en etkili) ; nikotin replasman (kombinasyon) ; bupropion ; davranışsal destek, Sigara Bırakma Polikliniği / ALO 171 ; nöropsikiyatrik güvenlik verileri güven verici
- e-sigara kanıtlanmış ilk seçenek tedavi ; ilaç gereksiz, irade yeterli
#10 kirmizi 2 - | hemoptizi
S: Masif hemoptizi olan hastada ilk yaklaşım?
+ havayolu güvenliği, kanayan tarafı aşağı yatırma ; resüsitasyon ; BT anjiyografi ve bronkoskopi ; bronşiyal arter embolizasyonu ; cerrahi seçilmiş
- kanayan taraf yukarı yatırılır ; ayaktan izlem
#11 ilac 2 - | inhaler teknik
S: Kontrolsüz astımda ilaç artırmadan önce neler kontrol edilir?
+ inhaler tekniği ; uyum ; tetikleyiciler (alerjen, sigara, mesleki) ; komorbiditeler (rinit, reflü, obezite, OSAS) ; doğru tanı
- doğrudan oral steroid idame ; teknik kontrolü gereksiz
#12 kilavuz 3 - | ağır astım biyolojik
S: Ağır eozinofilik astımda biyolojik tedavi seçenekleri?
+ yüksek doz İKS-LABA'ya rağmen kontrolsüzlük ; anti-IL5 / IL5R (mepolizumab, benralizumab), anti-IL4R (dupilumab), anti-IgE (omalizumab), anti-TSLP ; fenotipleme (eozinofil, IgE, FeNO) ; oral steroid azaltma hedefi
- tüm ağır astımlılara uzun süreli oral steroid ; fenotipleme gereksiz
#13 sgk 2 sgk-sut | SUT inhaler / biyolojik (güncel madde doğrulanacak)
S: KOAH ve astımda inhaler kombinasyonların ve biyolojiklerin SGK geri ödemesinde genel kural?
+ uzman hekim raporu (göğüs hastalıkları / alerji) belirli kombinasyonlar için ; spirometri ve basamak tedavi belgelenmesi ; biyolojiklerde sağlık kurulu ve laboratuvar kriterleri ; güncel SUT'tan doğrulanmalı
- tüm inhalerler raporsuz ; biyolojikler ilk basamak
#14 kirmizi 2 - | plevral efüzyon
S: Tek taraflı plevral efüzyonda torasentez ve Light kriterleri?
+ tanısal torasentez ; protein ve LDH oranları ile eksüda / transüda ; pH, glukoz, hücre, sitoloji, kültür ; parapnömonik efüzyonda pH <7,2 drenaj ; malignite şüphesi
- tüm efüzyonlar diüretikle tedavi ; torasentez gereksiz
#15 yaygin 2 - | OSAS
S: Gündüz uykululuğu ve horlaması olan obez hastada değerlendirme?
+ STOP-BANG, Epworth ; polisomnografi / ev tipi uyku testi ; orta-ağır OSAS'ta CPAP ; kilo kaybı ; araç kullanma güvenliği
- tanı için polisomnografi gereksiz ; benzodiazepin uyku için
#16 kilavuz 2 sb-kp-pnomokonyoz | SB Pnömokonyoz Protokolü
S: Kot kumlama / taş işçiliği yapan hastada silikozis şüphesinde yaklaşım?
+ mesleki öykü ; akciğer grafisi (ILO sınıflaması) / BT ; solunum fonksiyon testi ; maruziyetin sonlandırılması ; meslek hastalığı bildirimi, TB riski
- mesleki öykü önemsiz ; maruziyete devam edebilir
#17 kirmizi 2 - | interstisyel akciğer hastalığı
S: Kuru öksürük, efor dispnesi ve bazal "velcro" ralleri olan yaşlı hastada değerlendirme?
+ interstisyel akciğer hastalığı ; YRBT ; solunum fonksiyonu ve DLCO ; bağ dokusu hastalığı / maruziyet değerlendirmesi ; İPF'de antifibrotik (nintedanib / pirfenidon), multidisipliner tartışma
- KOAH, bronkodilatör ; İPF'de yüksek doz steroid
#18 ilac 2 - | İKS yan etkileri
S: İnhaler kortikosteroid kullanan hastaya hangi yan etkiler konusunda bilgi verilir?
+ oral kandidiyazis, disfoni — ağız çalkalama, spacer ; yüksek dozda sistemik etki (kemik, katarakt) ; KOAH'ta pnömoni riski ; en düşük etkili doz
- İKS'nin hiçbir yan etkisi yoktur ; ağız çalkalama gereksiz
#19 kirmizi 2 - | gebelikte astım
S: Gebe astımlı hasta ilaçlarını bebeğe zarar vermesin diye bırakmış. Ne söylersin?
+ kontrolsüz astım anne ve fetüs için daha büyük risk ; İKS (budesonid) ve SABA gebelikte güvenle kullanılır ; ilaçların sürdürülmesi ; alevlenmede sistemik steroid de gerektiğinde verilir
- gebelikte tüm inhalerler kesilmeli ; kontrolsüz astım fetüsü etkilemez
#20 tuzak 2 - | antibiyotik akut bronşit
S: Sağlıklı erişkinde akut bronşite antibiyotik verilmeli mi?
+ akut bronşit çoğunlukla viral, antibiyotik önerilmez ; öksürük 3 hafta sürebilir ; semptomatik tedavi ; pnömoni bulgularında değerlendirme
- tüm bronşitlere azitromisin ; renkli balgam antibiyotik gerektirir
#21 kilavuz 3 sb-kp-koah | SB KOAH KP, uzun süreli oksijen
S: KOAH'ta uzun süreli oksijen tedavisi endikasyonu?
+ istirahatte PaO2 ≤55 mmHg veya SpO2 ≤%88 ; PaO2 55–60 ve kor pulmonale / polisitemi ; günde en az 15 saat ; sigara içenlerde yangın riski ; SGK cihaz raporu
- tüm KOAH'lılara oksijen ; günde 2 saat yeterli
#22 kirmizi 3 - | akciğer kanseri şüphesi
S: Sigara içen 60 yaşında hastada 3 haftadır hemoptizi ve kilo kaybı. Yaklaşım?
+ akciğer kanseri şüphesi ; akciğer grafisi ve toraks BT ; bronkoskopi / biyopsi ; hızlı tanı yolu ; PET-BT ile evreleme
- antibiyotik ve 2 ay sonra kontrol ; grafi normalse kanser dışlanır
#23 ilac 3 - | teofilin
S: Teofilin kullanan hastada toksisite riskini artıran durumlar?
+ dar terapötik aralık ; siprofloksasin, eritromisin, simetidin etkileşimi (düzey artışı) ; karaciğer yetmezliği, KY ; sigara bırakma düzeyi artırır ; düzey izlemi
- teofilin güvenli, düzey gereksiz ; sigara bırakmanın etkisi yok
#24 yaygin 2 - | kronik öksürük
S: Kronik öksürükte üst hava yolu öksürük sendromu, astım ve reflü dışında hangi neden düşünülür?
+ ACE inhibitörü ; eozinofilik bronşit ; boğmaca (uzamış) ; TB, bronşektazi, akciğer kanseri (sigara içende) ; yabancı cisim
- tüm kronik öksürüklere antibiyotik ; ACEİ öksürük yapmaz
#25 kirmizi 2 - | boğmaca
S: Erişkinde 3 haftadır nöbetler halinde öksürük ve öksürük sonrası kusma. Ne düşünürsün?
+ boğmaca ; PCR / kültür (erken dönemde) ; makrolid tedavisi ve temaslılara profilaksi (özellikle bebek / gebe) ; bildirim
- viral öksürük, tedavi gereksiz ; temaslılar önemsiz
#26 kilavuz 2 - | pulmoner rehabilitasyon
S: KOAH'ta pulmoner rehabilitasyonun yararları?
+ dispne ve egzersiz kapasitesinde iyileşme ; yaşam kalitesi artışı ; alevlenme sonrası yatışları azaltma ; egzersiz + eğitim + beslenme + psikososyal
- yararsızdır ; yalnız ağır hastalara
#27 tuzak 2 - | mukolitik
S: Tüm KOAH hastalarına rutin mukolitik / ekspektoran verilmeli mi?
+ rutin kullanım önerilmez ; sık alevlenme ve balgam üretimi olan seçilmiş hastada (N-asetilsistein, karbosistein) alevlenmeyi azaltabilir ; temel tedavi bronkodilatör
- tüm KOAH'lılara mukolitik temel tedavi ; bronkodilatör gereksiz
#28 kirmizi 2 - | sarkoidoz
S: Bilateral hiler LAP, eritema nodozum ve ateşi olan genç kadın. Ne düşünürsün?
+ Löfgren sendromu (akut sarkoidoz) ; iyi prognoz, çoğu kendiliğinden düzelir ; NSAİİ ; lenfoma / TB ayırıcı tanısı ; göz, kalp, kalsiyum değerlendirmesi
- lenfoma kesin, kemoterapi ; tüm sarkoidozlara uzun süreli steroid
#29 ilac 2 - | aşılar KOAH
S: KOAH hastasına önerilen aşılar?
+ yıllık influenza ; pnömokok ; COVID-19 ; Tdap ; RSV (yaşlı / risk grubu, güncel öneriler)
- KOAH'ta aşılar alevlenme yapar ; influenza aşısı kontrendike
#30 kilavuz 2 dernek-ttd | TTD pnömoni
S: Hastaneye yatırılan toplum kökenli pnömoni hastasında ampirik tedavi?
+ beta-laktam (seftriakson / amoksisilin-klavulanat) + makrolid veya solunum kinolonu tek başına ; ağır pnömonide yoğun bakım kriterleri ; risk faktörüne göre Pseudomonas / MRSA kapsamı ; 5–7 gün
- tüm yatanlara karbapenem ; 21 gün tedavi
`,
} satisfies BankaKaynagi
