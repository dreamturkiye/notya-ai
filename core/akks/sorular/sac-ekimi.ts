import type { BankaKaynagi } from '../banka'

/** AKKS — Saç Ekimi (Özel Branşlar). 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'sac-ekimi',
  onek: 'SAC',
  metin: String.raw`
#1 kilavuz 2 yonetmelik-sac-ekimi-birimleri | Saç Ekimi Birimleri Hakkında Yönetmelik
S: Türkiye'de saç ekimi işlemini kimler yapabilir?
+ yönetmelikte tanımlı yetkili hekimler (ilgili uzmanlıklar / sertifikalı tabipler) ; ruhsatlı saç ekimi birimlerinde ; tıbbi olmayan personelin greft çıkarma / ekme yapamaması ; mevzuatın güncel metninden doğrulanmalı
- teknisyen hekimsiz ekim yapabilir ; ruhsat gerekmez
#2 yaygin 2 - | aday seçimi
S: Saç ekimi için uygun aday kimdir?
+ androgenetik alopesinin stabil / öngörülebilir olması ; yeterli donör alan yoğunluğu ; gerçekçi beklenti ; çok genç hastada ilerleyici kayıp riski ; medikal tedavi (minoksidil / finasterid) ile birlikte
- 20 yaşında yoğun ön hat ekimi her zaman uygundur ; donör alan önemsiz
#3 kirmizi 2 - | skatrisyel alopesi
S: Saç dökülmesi olan hastada saçlı deride eritem, perifoliküler skuam ve folikül ağızlarında kayıp var. Ekim yapar mısın?
+ skatrisyel alopesi (liken planopilaris, FFA) şüphesi ; aktif hastalıkta ekim yapılmaz ; trikoskopi ve biyopsi, dermatoloji ; hastalık en az 1–2 yıl inaktif olmadan ekim önerilmez
- hemen ekim yapılır ; biyopsi gereksiz
#4 kilavuz 2 - | FUE / FUT
S: FUE ve FUT tekniklerinin farkı?
+ FUE: tek tek folikül ünitesi çıkarımı, noktasal skarlar ; FUT: şerit eksizyonu, lineer skar, daha fazla greft ; donör alan kapasitesinin korunması ; hastaya göre seçim
- FUE skar bırakmaz ; donör kapasitesi sınırsız
#5 ilac 2 - | finasterid
S: Saç ekimi sonrası finasterid kullanımında hastaya ne anlatılır?
+ mevcut saçların korunması için medikal tedavi önemli ; cinsel yan etkiler (nadir, çoğunlukla geri dönüşlü) ve post-finasterid farkındalığı ; PSA'yı yaklaşık yarıya düşürür ; gebe kadınların kırık tabletle temasından kaçınma
- ekim sonrası medikal tedavi gereksiz ; PSA etkilenmez
#6 kirmizi 2 - | antikoagülan
S: Antikoagülan kullanan hasta saç ekimi istiyor. Yaklaşım?
+ endikasyonu hekimiyle değerlendirme, elektif işlem ; kanama riski ; kesme / köprüleme kararı reçete eden hekimle ; aspirin, takviyeler (balık yağı, ginkgo) sorgulanır
- antikoagülan kendi kararınla kesilir ; sorgulama gereksiz
#7 ilac 3 - | lokal anestezik doz
S: Saç ekiminde lokal anestezik toksisitesini önleme?
+ maksimum doz hesabı (lidokain ±adrenalin, bupivakain) ; bölünmüş enjeksiyon, aspirasyon ; uzun seanslarda kümülatif doz ; LAST belirtileri ve lipid emülsiyon hazırlığı ; acil ekipman
- doz sınırı yok ; lipid emülsiyon gereksiz
#8 yaygin 2 - | postop bakım
S: Saç ekimi sonrası ilk günlerde bakım önerileri?
+ greftlere travmadan kaçınma ; yıkama protokolü ; ödem için baş yüksekliği ; şok dökülme (2–8 hafta) beklenir, yeni saç 3–4. ayda ; güneş, sigara, alkol, egzersiz kısıtlaması
- greftler ilk gün ovalanarak yıkanır ; dökülme başarısızlık işaretidir
#9 kirmizi 2 - | postop enfeksiyon
S: Ekim sonrası 5. günde alıcı alanda püstüller, ağrı ve kızarıklık. Ne yaparsın?
+ folikülit / enfeksiyon değerlendirmesi ; kültür gerekirse ; topikal / oral antibiyotik ; selülit / abse bulgularında acil değerlendirme ; steril koşullar
- normal iyileşme, izlem ; topikal steroid
#10 kirmizi 3 - | nekroz
S: Yoğun ekim sonrası alıcı alanda koyulaşan, kabuklaşan geniş alan. Ne düşünürsün?
+ alıcı alan nekrozu (aşırı yoğun ekim, sigara, adrenalin) ; yara bakımı, enfeksiyon kontrolü ; plastik cerrahi değerlendirmesi ; önleme: yoğunluk sınırı
- normal kabuk ; kendiliğinden düzelir, takip gereksiz
#11 tuzak 2 - | aşırı greft
S: Donör alan kapasitesini aşacak sayıda greftle tek seansta tam yoğunluk vaat etmek uygun mu?
+ donör alan sınırlı ve yenilenmez ; aşırı hasat donörde seyrekleşme / "aşırı hasat" görünümü ; gerçekçi planlama, gelecek kayıplar için rezerv ; etik bilgilendirme
- donör sınırsızdır ; tek seansta 8000 greft herkese
#12 yaygin 2 - | kadın saç dökülmesi
S: Kadın tipi saç dökülmesinde değerlendirme?
+ demir (ferritin), tiroid, androjen bulguları (PKOS) ; telogen effluvium ayırıcı tanısı ; topikal / oral minoksidil, spironolakton (kontrasepsiyonla) ; ekim seçilmiş vakada
- tetkik gereksiz ; tüm kadınlara finasterid
#13 kirmizi 2 - | telogen effluvium
S: Doğumdan 3 ay sonra yaygın saç dökülmesi olan kadın ekim istiyor. Ne söylersin?
+ postpartum telogen effluvium, çoğunlukla 6–12 ayda kendiliğinden düzelir ; ekim endike değil ; demir / tiroid değerlendirmesi ; güvence
- hemen ekim ; kalıcı kayıp
#14 ilac 2 - | minoksidil
S: Topikal minoksidil kullanımında hastaya ne anlatılır?
+ ilk aylarda geçici dökülme artışı olabilir ; etkisi 4–6 ayda görülür ; kesilince kazanım kaybolur ; irritasyon / kontakt dermatit ; kadında yüzde kıllanma
- 2 haftada sonuç ; kesildikten sonra etki sürer
#15 kilavuz 2 - | PRP
S: Saç dökülmesinde PRP'nin yeri?
+ androgenetik alopesi için yardımcı tedavi, kanıt orta düzeyde ve heterojen ; standart protokol yok ; medikal tedavinin yerine geçmez ; hasta bilgilendirmesi
- PRP kesin kalıcı tedavidir ; ekim yerine geçer
#16 kirmizi 2 - | sistemik hastalık
S: Kontrolsüz diyabeti ve hipertansiyonu olan hasta ekim için başvurdu. Yaklaşım?
+ preoperatif tıbbi değerlendirme ; kontrolsüz diyabet / HT'de erteleme ve optimizasyon ; yara iyileşmesi ve kanama riski ; ilgili hekim onayı
- değerlendirmesiz işlem ; KB önemsiz
#17 yaygin 2 - | sakal / kaş ekimi
S: Kaş ekiminde dikkat edilecek noktalar?
+ saç yönü ve açısının doğal yerleştirilmesi ; ince tek kıllı greftler ; ekilen kılların saç gibi uzaması, düzenli kesim ; nedenin (alopesi areata, tirotoksikoz, trikotillomani) dışlanması
- aktif alopesi areatada ekim ; açının önemi yok
#18 ilac 2 - | dutasterid
S: Dutasterid saç dökülmesinde kullanılabilir mi?
+ Türkiye'de saç dökülmesi endikasyonu ruhsatına göre değerlendirilmeli (endikasyon dışı kullanım kuralları) ; finasteride göre daha güçlü 5-ARİ ; cinsel yan etki, PSA etkisi ; kadınlarda teratojen
- tüm kadınlara güvenle ; PSA etkilemez
#19 kirmizi 2 - | vazovagal
S: Lokal anestezi sırasında hasta solgunlaştı, bradikardi ve bayılma. Ne yaparsın?
+ vazovagal senkop olası, ancak LAST ve anafilaksi dışlanmalı ; işlemin durdurulması, Trendelenburg, havayolu ; vital izlem ; acil ekipman ve protokol
- işleme devam ; ayağa kaldır
#20 kilavuz 2 yonetmelik-sac-ekimi-birimleri | Saç Ekimi Birimleri Yönetmeliği
S: Saç ekimi biriminde bulunması zorunlu acil müdahale olanakları nelerdir?
+ yönetmelikte belirtilen acil ilaç ve ekipman (defibrilatör, oksijen, havayolu) ; resüsitasyon eğitimi ; sevk protokolü ; güncel yönetmelik metninden doğrulanmalı
- acil ekipman gereksiz ; sevk planı yok
#21 tuzak 2 - | yaş sınırı
S: 19 yaşında başlangıç evresinde saç dökülmesi olan erkeğe hemen ön hat ekimi önerilir mi?
+ genç yaşta kaybın ilerleme paterni belirsiz ; önce medikal tedavi ve izlem ; erken ekim ilerleyen kayıpla doğal olmayan görünüm riski ; uzun dönem plan
- 19 yaş ideal, ekim hemen yapılır ; medikal tedavi gereksiz
#22 yaygin 2 - | trikotillomani
S: Saç yolma öyküsü olan, düzensiz sınırlı seyreklik alanları olan genç hasta ekim istiyor. Yaklaşım?
+ trikotillomani olasılığı ; trikoskopi ; psikiyatri / psikoterapi (BDT) yönlendirmesi ; altta yatan durum tedavi edilmeden ekim önerilmez
- ekim tedavidir ; psikiyatrik değerlendirme gereksiz
#23 kirmizi 2 - | anestezik alerji
S: Lokal anestezik "alerjisi" öyküsü olan hastada ne yaparsın?
+ öykünün ayrıntılandırılması (çoğu vazovagal / adrenalin etkisi) ; gerçek alerji nadir ; alerji değerlendirmesi / farklı sınıf anestezik ; acil hazırlık
- öyküyü yok sayıp aynı ajan ; işlem iptal her durumda
#24 sgk 1 - | SGK kapsam
S: Saç ekimi SGK tarafından karşılanır mı?
+ estetik amaçlı saç ekimi SGK kapsamı dışındadır ; yanık / travma sonrası rekonstrüktif durumlar ayrıca değerlendirilir ; hastaya ücretlendirme ve onam ; güncel mevzuattan doğrulanmalı
- tüm saç ekimleri SGK kapsamında ; rapor ile ödenir
#25 yaygin 2 - | aydınlatılmış onam
S: Saç ekimi aydınlatılmış onamında neler yer almalı?
+ beklenen sonuçlar ve süre (12–18 ay) ; riskler: enfeksiyon, skar, şok dökülme, folikülit, donör seyrekleşmesi, ek seans gereksinimi ; alternatifler (medikal tedavi) ; yazılı ve anlaşılır
- garanti %100 sonuç ; riskler belirtilmez
#26 ilac 2 - | sedasyon
S: Saç ekiminde oral / IV sedasyon kullanılacaksa nelere dikkat edilir?
+ yetkin personel ve monitörizasyon ; solunum depresyonu riski ; resüsitasyon ekipmanı ve antidotlar ; taburculuk kriterleri, refakatçi
- izlemsiz sedasyon ; refakatçi gereksiz
#27 kirmizi 2 - | postop ağrı göz şişliği
S: Ekim sonrası 3. günde alın ve göz çevresinde şişlik. Ne yapmalı?
+ beklenen ödem, genellikle kendiliğinden geçer ; soğuk uygulama, baş yüksekliği ; enfeksiyon / selülit bulgularından ayırt etme (ateş, ağrı, kızarıklık) ; görme sorunu varsa acil
- antibiyotik rutin ; acil cerrahi
#28 tuzak 2 - | ekim kellik tedavisi
S: "Saç ekimi saç dökülmesini durdurur" demek doğru mu?
+ ekim mevcut hastalığın ilerlemesini durdurmaz ; yerli saçların kaybı sürebilir ; medikal tedavi ile koruma ; uzun dönem plan
- ekim kalıcı olarak dökülmeyi durdurur ; medikal tedavi gereksiz
#29 yaygin 2 - | donör alan seyrekleşmesi
S: Önceki ekim sonrası donör alanda belirgin seyrekleşme olan hasta tekrar ekim istiyor. Yaklaşım?
+ donör kapasitesinin değerlendirilmesi (trikoskopi) ; aşırı hasat riski ; vücut kılı / sakal donörü seçilmiş ; gerçekçi beklenti, kamuflaj seçenekleri (SMP)
- donör sınırsız, tekrar yoğun ekim ; değerlendirme gereksiz
#30 kirmizi 2 - | denetimsiz merkez
S: Hasta yurt dışı veya ruhsatsız merkezde yapılan ekim sonrası enfeksiyon ve nekrozla geldi. Ne yaparsın?
+ tıbbi tedavi önceliği (enfeksiyon, yara bakımı) ; gerekirse plastik cerrahi ; kayıt ve uygun bildirim ; hasta güvenliği eğitimi
- tedavi reddedilir ; yalnız topikal krem
`,
} satisfies BankaKaynagi
