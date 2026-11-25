import type { BankaKaynagi } from '../banka'

/** AKKS — Romatoloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'romatoloji',
  onek: 'ROM',
  metin: String.raw`
#1 kilavuz 2 dernek-romatoloji | romatoid artrit
S: Erken romatoid artritte tedavi stratejisi?
+ erken DMARD (metotreksat ilk seçenek) ; "hedefe yönelik tedavi" (remisyon / düşük aktivite, DAS28 / CDAI) ; köprü olarak kısa süreli düşük doz steroid ; 3–6 ayda hedefe ulaşılmazsa biyolojik / JAK inhibitörü ; folik asit, hepatit / TB tarama
- NSAİİ tek başına uzun süreli ; metotreksat günlük doz
#2 kirmizi 2 - | metotreksat toksisitesi
S: Haftalık yerine günlük metotreksat alan hastada mukozit ve pansitopeni. Yaklaşım?
+ metotreksat toksisitesi ; ilacın kesilmesi ; folinik asit (lökovorin) kurtarma ; hemogram, böbrek fonksiyonu, enfeksiyon yönetimi ; hasta eğitimi (haftalık doz)
- folik asit yeterli ; doz yarıya indirilip devam
#3 yaygin 2 - | gut atağı
S: Akut gut atağında tedavi?
+ NSAİİ veya kolşisin (düşük doz rejimi) veya kortikosteroid (oral / intraartiküler) ; atak sırasında kullanılan ürat düşürücü kesilmez ; tetikleyiciler ; tanı eklem sıvısında kristal ile
- atakta allopurinol kesilir ; yüksek doz kolşisin saatlik
#4 kilavuz 2 - | ürat düşürücü
S: Gutta ürat düşürücü tedavi endikasyonları ve hedef?
+ tekrarlayan atak (≥2/yıl), tofüs, ürat nefropatisi / taş, eklem hasarı ; hedef ürik asit <6 mg/dL (tofüste <5) ; allopurinol düşük dozla başlayıp titrasyon ; başlangıçta 3–6 ay kolşisin profilaksisi ; HLA-B*58:01 (riskli gruplar)
- ürik asit hedefi yok ; allopurinol yüksek dozla başlanır
#5 kirmizi 3 - | dev hücreli arterit
S: Yeni baş ağrısı, çene kladikasyosu ve ESH yüksekliği olan 70 yaşında hasta. Yaklaşım?
+ dev hücreli arterit ; görme kaybını önlemek için hemen yüksek doz glukokortikoid ; görme semptomunda IV pulse ; temporal arter USG / biyopsi tedaviyi geciktirmeden ; tosilizumab steroid koruyucu
- biyopsi sonucu beklenir ; NSAİİ yeterli
#6 yaygin 2 - | polimiyaljia romatika
S: 65 yaş üstü hastada omuz ve kalça kuşağında ağrı-tutukluk, ESH yüksek. Tedavi?
+ polimiyaljia romatika ; düşük doz prednizolon (12,5–25 mg) hızlı yanıt ; yavaş azaltma ; dev hücreli arterit semptomları sorgulanır ; kemik koruma
- yüksek doz 60 mg steroid standart ; yanıt yoksa tanı değiştirilmez
#7 kilavuz 3 - | SLE
S: SLE tanılı hastada tüm hastalara önerilen temel ilaç ve izlem?
+ hidroksiklorokin tüm hastalara (kontrendikasyon yoksa) ; göz taraması ; güneş koruma ; böbrek tutulumu için düzenli idrar / proteinüri ; steroid en düşük doz, steroid koruyucu ajanlar
- hidroksiklorokin yalnız ağır hastalıkta ; idrar izlemi gereksiz
#8 kilavuz 2 - | Behçet
S: Behçet hastalığında organ tutulumuna göre tedavi?
+ mukokutanöz: kolşisin, topikal steroid, apremilast ; göz (posterior üveit): azatioprin, anti-TNF, interferon ; vasküler / nörolojik: immünsüpresif, anti-TNF ; Türkiye'de sık, multidisipliner izlem
- tüm tutulumlar topikal tedaviyle ; vasküler tutulumda yalnız antikoagülan
#9 sgk 2 sgk-sut | SUT biyolojik DMARD (güncel madde doğrulanacak)
S: RA'da biyolojik DMARD için SGK geri ödeme genel koşulları?
+ konvansiyonel DMARD'lara (metotreksat dahil) yeterli süre yanıtsızlık ; hastalık aktivite skoru (DAS28) eşikleri ; romatoloji uzmanının yer aldığı sağlık kurulu raporu ; TB / hepatit taraması ; güncel SUT'tan doğrulanmalı
- tanı anında ilk seçenek olarak ödenir ; rapor gerekmez
#10 kirmizi 2 - | septik artrit vs gut
S: Ateşli, tek dizinde akut monoartrit. Hangi tetkik şart?
+ eklem aspirasyonu (Gram, kültür, hücre sayımı, kristal) ; septik artrit dışlanmadan intraartiküler steroid verilmez ; kristal varlığı enfeksiyonu dışlamaz ; ampirik antibiyotik şüphede
- kristal görülürse enfeksiyon dışlanır ; aspirasyon gereksiz, steroid enjekte et
#11 ilac 3 - | biyolojik enfeksiyon
S: Anti-TNF tedavisi alan hastada enfeksiyon riskini azaltmak için neler yapılır?
+ başlamadan önce latent TB ve hepatit B taraması ; aşıların güncellenmesi (inaktif aşılar), canlı aşılardan kaçınma ; ciddi enfeksiyonda ilacın geçici kesilmesi ; hasta eğitimi
- canlı aşılar güvenle yapılır ; tarama gereksiz
#12 kilavuz 2 - | aksiyel spondiloartrit
S: Aksiyel spondiloartritte tedavi basamakları?
+ NSAİİ ilk basamak (en az 2 NSAİİ, 4 hafta) ; egzersiz / fizyoterapi ; yanıtsızlıkta anti-TNF veya IL-17 inhibitörü ; konvansiyonel DMARD'lar aksiyel tutulumda etkisiz ; sistemik steroid önerilmez
- metotreksat aksiyel hastalıkta ilk seçenek ; uzun süreli sistemik steroid
#13 kirmizi 3 - | skleroderma renal kriz
S: Sistemik sklerozlu hastada ani hipertansiyon ve böbrek fonksiyon bozulması. Tedavi?
+ skleroderma renal krizi ; ACE inhibitörü (kaptopril) ilk ve hızlı ; yüksek doz steroid risk faktörü ; diyaliz gerekebilir ; kreatinin artsa da ACEİ sürdürülür
- ACEİ kontrendike ; yüksek doz steroid
#14 yaygin 2 - | Raynaud
S: Primer Raynaud fenomeninde tedavi ve sekonder neden araştırması?
+ soğuktan korunma, sigara bırakma ; KKB (nifedipin) ; sekonder nedenler: kapillaroskopi, ANA (skleroderma) ; dijital ülser / iskemide acil değerlendirme
- tetkik gereksiz ; beta bloker tedavi
#15 kilavuz 2 - | osteoporoz steroid
S: Uzun süreli glukokortikoid (≥3 ay, ≥2,5 mg prednizolon) kullanan hastada kemik koruma?
+ kalsiyum ve D vitamini ; FRAX (steroid düzeltmeli) ve DXA ; orta-yüksek riskte bisfosfonat ; en düşük steroid dozu
- kemik koruma gereksiz ; yalnız 20 mg üzeri steroidde
#16 kirmizi 2 - | ANCA vaskülit
S: Sinüzit, hemoptizi ve hematüri olan hastada c-ANCA pozitif. Yaklaşım?
+ granülomatozis polianjiitis ; organ tehdidi değerlendirmesi (böbrek, akciğer) ; biyopsi ; indüksiyon: glukokortikoid + rituksimab / siklofosfamid ; hızlı tanı ve tedavi
- antibiyotik ile sinüzit tedavisi yeterli ; biyopsi beklenip tedavi haftalarca ertelenir
#17 ilac 2 - | hidroksiklorokin
S: Hidroksiklorokin günlük doz sınırı ve göz izlemi?
+ ≤5 mg/kg/gün gerçek vücut ağırlığı ; başlangıç göz muayenesi ; 5 yıl sonra yıllık tarama (risk faktöründe erken) ; böbrek yetmezliğinde risk artışı
- doz sınırı yok ; göz izlemi gereksiz
#18 yaygin 2 - | fibromiyalji
S: Fibromiyalji tanısı ve tedavisi?
+ yaygın ağrı + yorgunluk / uyku / bilişsel semptomlar (ACR kriterleri) ; inflamatuvar hastalık dışlanır (ESH, CRP, TSH) ; aerobik egzersiz, eğitim, BDT ; amitriptilin / duloksetin / pregabalin ; opioidlerden kaçınma
- opioid ilk seçenek ; egzersiz zararlı
#19 kirmizi 2 - | gebelik RA ilaçları
S: Romatoid artritli kadın gebelik planlıyor, metotreksat kullanıyor. Ne önerirsin?
+ metotreksat teratojen, gebelikten en az 1–3 ay önce kesilmeli ; gebelikte uygun ilaçlar: hidroksiklorokin, sülfasalazin, düşük doz steroid, bazı anti-TNF'ler (sertolizumab) ; leflunomid için arınma (kolestiramin) ; planlı gebelik
- metotreksat gebelikte güvenli ; tüm ilaçlar kesilir, plan gerekmez
#20 tuzak 2 - | ANA pozitifliği
S: Spesifik semptomu olmayan kişide düşük titre ANA pozitifliği lupus tanısı koydurur mu?
+ düşük titre ANA sağlıklı bireylerde sık ; tanı klinik + spesifik antikorlarla (anti-dsDNA, anti-Sm) ; semptomsuz kişide rutin ANA istenmemeli ; gereksiz tedaviden kaçınma
- ANA pozitif = lupus ; ANA pozitiflere hidroksiklorokin başlanmalı
#21 kilavuz 2 - | psoriatik artrit
S: Psoriatik artritte tedavi?
+ periferik artritte konvansiyonel DMARD (metotreksat) ; aksiyel / entezit / daktilitte biyolojikler (anti-TNF, IL-17, IL-23) ; deri ve eklem birlikte değerlendirme ; NSAİİ semptomatik
- sistemik steroid uzun süreli ilk seçenek ; deri tutulumu dikkate alınmaz
#22 kirmizi 2 - | ailesel Akdeniz ateşi
S: Tekrarlayan ateş ve karın ağrısı atakları olan genç hastada ne düşünürsün, tedavi?
+ ailesel Akdeniz ateşi (Türkiye'de sık) ; klinik tanı (Tel-Hashomer / Livneh), MEFV genetik destekleyici ; ömür boyu kolşisin (amiloidozu önler) ; kolşisine dirençte anti-IL-1 ; proteinüri ile amiloidoz izlemi
- yalnız ataklarda analjezik ; kolşisin gebelikte mutlaka kesilir
#23 ilac 2 - | kolşisin etkileşim
S: Kolşisin kullanan hastaya klaritromisin verilecek. Risk nedir?
+ CYP3A4 / P-gp inhibitörleri (klaritromisin, siklosporin, azol) kolşisin toksisitesini artırır ; miyopati, pansitopeni, ölüm riski ; alternatif antibiyotik veya kolşisin dozu azaltma / ara verme ; böbrek fonksiyonu
- etkileşim yoktur ; doz artırılabilir
#24 yaygin 2 - | Sjögren
S: Ağız ve göz kuruluğu olan hastada Sjögren değerlendirmesi?
+ anti-Ro / La, Schirmer testi, tükürük bezi biyopsisi ; semptomatik tedavi (suni gözyaşı, pilokarpin) ; sistemik tutulum ve lenfoma riski izlemi
- kuruluk yaşa bağlı, tetkik gereksiz ; lenfoma riski yok
#25 kirmizi 2 - | miyozit
S: Proksimal kas güçsüzlüğü, CK yüksekliği ve heliotrop döküntü. Ne yaparsın?
+ dermatomiyozit ; EMG, MR, kas biyopsisi, miyozit antikorları ; malignite taraması (erişkin) ; glukokortikoid + steroid koruyucu ; disfaji / interstisyel akciğer hastalığı değerlendirmesi
- malignite taraması gereksiz ; fizik tedavi tek başına
#26 tuzak 2 - | glukozamin
S: Diz osteoartritinde glukozamin / kondroitin standart tedavi midir?
+ kanıt tutarsız, çoğu kılavuz rutin önermez ; egzersiz ve kilo kaybı temel ; topikal / oral NSAİİ ; intraartiküler steroid
- glukozamin kıkırdağı yeniler ; temel tedavi
#27 kilavuz 2 - | RA KV risk
S: RA hastalarında kardiyovasküler risk yönetimi?
+ RA KV riski artırır, risk hesaplamalarına çarpan (1,5) ; inflamasyon kontrolü ; lipid / KB yönetimi ; NSAİİ ve steroid en düşük ; sigara bırakma
- RA KV riski etkilemez ; yüksek doz steroid KV koruyucu
#28 kirmizi 2 - | erişkin Still
S: Yüksek ateş, somon renkli döküntü, artrit ve ferritin çok yüksek. Ne düşünürsün?
+ erişkin başlangıçlı Still hastalığı ; enfeksiyon ve malignite dışlanması ; makrofaj aktivasyon sendromu riski ; steroid, anti-IL-1 / IL-6
- viral döküntü, izlem ; ferritin önemsiz
#29 sgk 2 sgk-sut | SUT FMF anti-IL-1 (güncel madde doğrulanacak)
S: Kolşisine dirençli FMF'de anti-IL-1 tedavinin SGK'da karşılanmasında genel koşul?
+ maksimum tolere kolşisine rağmen atak / amiloidoz ; romatoloji / ilgili uzman sağlık kurulu raporu ; uyumun belgelenmesi ; güncel SUT'tan doğrulanmalı
- kolşisin denemeden ödenir ; rapor gerekmez
#30 yaygin 2 - | eklem enjeksiyon sıklığı
S: Aynı ekleme kortikosteroid enjeksiyonu hangi sıklıkla yapılabilir?
+ yılda 3–4'ten fazla önerilmez ; enjeksiyonlar arası en az 3 ay ; enfeksiyon dışlanmalı ; diyabetlide glisemik etki
- aylık sınırsız ; enfekte ekleme steroid
`,
} satisfies BankaKaynagi
