import type { BankaKaynagi } from '../banka'

/** AKKS — Acil Tıp. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'acil-tip',
  onek: 'ACL',
  metin: String.raw`
#1 kirmizi 3 - | KPR
S: Tanıklı kardiyak arrest, monitörde VF. İlk adımlar?
+ yüksek kaliteli göğüs kompresyonu (100–120/dk, 5–6 cm, tam geri dönüş) ; en kısa sürede defibrilasyon ; 3. şoktan sonra adrenalin 1 mg ve amiodaron 300 mg ; geri dönüşümlü nedenler (4H-4T) ; minimal kesinti
- defibrilasyondan önce 5 dakika KPR şart ; VF'de atropin
#2 kirmizi 3 - | asistoli
S: Nabızsız asistoli ritminde tedavi?
+ şoklanamayan ritim, defibrilasyon yapılmaz ; KPR ve en kısa sürede adrenalin 1 mg, 3–5 dk'da bir ; 4H-4T araştırması ; havayolu, kapnografi
- asistolide defibrilasyon ; atropin rutin
#3 kirmizi 3 - | anafilaksi
S: Arı sokması sonrası hipotansiyon ve bronkospazm. İlk tedavi?
+ IM adrenalin 0,5 mg (erişkin) uyluk lateraline ; tekrarlanabilir ; oksijen, sıvı bolus ; dirençli şokta IV adrenalin infüzyonu ; antihistaminik / steroid ikinci planda, gözlem
- ilk tedavi IV antihistaminik ; adrenalin subkutan
#4 kilavuz 2 dernek-tatd | triaj
S: Türkiye acil servislerinde triaj nasıl yapılır?
+ SB acil servis yönetmeliği renk kodlu triaj (kırmızı-sarı-yeşil) ; hayati bulgular ve şikâyet ciddiyetine göre ; tekrar değerlendirme ; triaj kararının kaydı
- triaj geliş sırasına göre ; yeşil alan hastası hiç değerlendirilmez
#5 kirmizi 3 - | sepsis
S: Ateş, taşikardi, hipotansiyon ve bilinç değişikliği olan hastada ilk saat?
+ septik şok ; kültür sonrası 1 saat içinde geniş spektrumlu antibiyotik ; 30 ml/kg kristaloid ; laktat ; OAB ≥65 için norepinefrin ; kaynak kontrolü
- antibiyotik kültür sonucuna göre ; hipotansiyonda önce dopamin
#6 kirmizi 2 - | göğüs ağrısı EKG
S: Göğüs ağrılı hastada EKG ne zaman çekilmeli?
+ başvurudan sonra 10 dakika içinde ; STEMI ve eşdeğerleri (posterior MI, yeni LBBB değerlendirmesi, de Winter) ; seri EKG ; yüksek duyarlı troponin algoritmaları
- EKG troponin sonucundan sonra ; normal ilk EKG AKS'yi dışlar
#7 kirmizi 3 - | tansiyon pnömotoraks
S: Travma hastasında solunum sıkıntısı, tek taraflı solunum seslerinde azalma, hipotansiyon ve trakeal deviasyon. Ne yaparsın?
+ tansiyon pnömotoraks klinik tanıdır ; grafi beklenmeden iğne dekompresyonu (4–5. ICS orta-ön aksiller veya 2. ICS MKL) ; ardından göğüs tüpü ; ABCDE
- önce akciğer grafisi ; entübasyon tek başına çözer
#8 ilac 3 - | parasetamol zehirlenme
S: 4 saat önce 15 g parasetamol alan 60 kg hasta. Yaklaşım?
+ toksik doz (>150 mg/kg) ; 4. saat serum düzeyi ve nomogram ; N-asetilsistein (düzey beklenirken 8 saati geçecekse hemen) ; 1–2 saat içinde aktif kömür seçeneği ; karaciğer fonksiyonları, Zehir Danışma (114)
- semptom yoksa NAC gerekmez ; kusturma
#9 kirmizi 3 - | organofosfat
S: Tarım ilacı içen hastada miyozis, salya, bronkore, bradikardi. Tedavi?
+ organofosfat zehirlenmesi (kolinerjik kriz) ; dekontaminasyon ve personel koruması ; atropin titrasyonu (bronkore kuruyana kadar) ; pralidoksim ; havayolu, nöbet için benzodiazepin
- atropin kontrendike ; süksinilkolin ile entübasyon tercih
#10 kirmizi 2 - | CO zehirlenmesi
S: Sobalı evde baş ağrısı, bulantı olan aile; pulse oksimetre %98. Ne yaparsın?
+ karbonmonoksit zehirlenmesi şüphesi ; pulse oksimetre güvenilmez, COHb ölçümü ; %100 normobarik oksijen ; ciddi vakada hiperbarik oksijen (bilinç kaybı, nörolojik bulgu, gebelik, yüksek COHb) ; diğer aile bireyleri ve ev
- SpO2 normal, CO dışlandı ; oda havasında taburcu
#11 kilavuz 2 sb-travma-protokolu | SB Travma KP (baskı doğrulanacak)
S: Kanayan travma hastasında traneksamik asit kullanımı?
+ ilk 3 saat içinde 1 g IV (10 dk), ardından 8 saatte 1 g ; 3 saatten sonra yarar yok / zarar olası ; masif kanama protokolüyle birlikte
- 24. saatte verilebilir ; yalnız kafa travmasında
#12 kirmizi 2 - | servikal travma
S: Bilinci açık, nörolojik muayenesi normal, düşük riskli travma hastasında servikal görüntüleme gerekir mi?
+ Kanada servikal omurga kuralı / NEXUS ; düşük risk ve kriterleri sağlayan hastada görüntüleme gerekmez ; yüksek risk / kriter dışı hastada BT ; immobilizasyonun gereksiz uzatılmaması
- tüm travmalara servikal BT ; NEXUS kriterleri geçerli değil
#13 kirmizi 3 - | hipoglisemi
S: Bilinci kapalı, kan şekeri 35 mg/dL olan hastada tedavi?
+ IV dekstroz (%10–20; %50 dikkatle) ; damar yolu yoksa IM / intranazal glukagon ; alkolik / malnütre hastada tiamin ; nedenin araştırılması (sülfonilüre — uzun gözlem)
- ağızdan şekerli su ; sülfonilüreye bağlı hipoglisemide hemen taburcu
#14 yaygin 2 - | baş dönmesi acil
S: Acil serviste akut sürekli vertigo olan hastada santral nedeni ayırt etmek için hangi muayene?
+ HINTS (baş itme, nistagmus, skew) ; nörolojik muayene, yürüyüş ; risk faktörleri ; erken MR difüzyon duyarlılığı sınırlı, klinik muayene önemli
- BT normalse inme dışlanır ; tüm vertigolar periferik
#15 kirmizi 2 - | hipotermi
S: Kar altında bulunan, vücut sıcaklığı 28 °C olan hastada arrest. Yaklaşım?
+ ağır hipotermi ; "ısıtılmadan ölü sayılmaz" ilkesi ; KPR sürdürülür, ECLS / ekstrakorporeal ısıtma ; 30 °C altında defibrilasyon / ilaç kısıtlaması (protokole göre) ; dikkatli transfer (VF tetiklenmesi)
- 28 °C'de hemen ölüm ilanı ; agresif hareket ettirme
#16 ilac 2 - | tetanoz profilaksisi
S: Kirli yarası olan, aşı öyküsü belirsiz hastada tetanoz profilaksisi?
+ tetanoz aşısı (Td) ; aşı öyküsü bilinmeyen / <3 doz ve kirli yarada tetanoz immünoglobulini ; yara bakımı ve debridman ; aşı takviminin tamamlanması
- yalnız immünoglobulin ; temiz yarada TIG herkese
#17 kirmizi 3 - | kuduz
S: Sahipsiz köpek ısırığı olan hastada kuduz profilaksisi?
+ yaranın bol su ve sabunla 15 dk yıkanması ; kategori III temasta kuduz aşısı + kuduz immünoglobulini (yara içi ve çevresine) ; SB Kuduz Proflaksisi rehberine göre aşı şeması ; bildirim ve hayvan gözlemi (mümkünse)
- hayvan sağlıklı görünüyorsa profilaksi gereksiz ; yara primer sıkı sütürle kapatılır her zaman
#18 kirmizi 2 - | ısı çarpması
S: Sıcak havada egzersiz sonrası bilinç bulanıklığı ve 41 °C ateş. Tedavi?
+ ısı çarpması ; hızlı soğutma (soğuk su immersiyonu en etkili) ; ABC, sıvı ; antipiretikler etkisiz ; rabdomiyoliz, DİK, böbrek hasarı izlemi
- parasetamol ile ateş düşürme ; yavaş soğutma tercih
#19 kirmizi 2 - | KOAH alevlenme
S: KOAH alevlenmesi, pH 7,28, PaCO2 65 mmHg. Tedavi?
+ kontrollü oksijen (SpO2 %88–92) ; kısa etkili bronkodilatörler ; sistemik steroid (5 gün) ; antibiyotik (pürülan balgam) ; NIV (akut hiperkapnik solunum yetmezliği)
- yüksek akım %100 O2 ; NIV kontrendike
#20 ilac 2 - | ağrı acil
S: Renal kolikte acil serviste ilk analjezik?
+ IV / IM NSAİİ (ör. diklofenak, ketorolak) ilk seçenek ; böbrek fonksiyonu ve kanama riski ; yetersizse opioid ; antispazmodiklerin ek yararı sınırlı
- ilk seçenek yalnız antispazmodik ; NSAİİ böbrek koliğinde kontrendike
#21 kirmizi 2 - | ektopik acil
S: Doğurganlık çağında kadın karın ağrısı ve hipotansiyonla geldi. İlk düşünmen gereken?
+ rüptüre ektopik gebelik ; gebelik testi ; FAST / USG ile serbest sıvı ; resüsitasyon ve acil jinekoloji ; Rh durumu
- gebelik testi gereksiz ; gastroenterit
#22 kirmizi 3 - | aort anevrizma rüptürü
S: Yaşlı erkekte ani bel / karın ağrısı, senkop ve pulsatil kitle. Yaklaşım?
+ rüptüre AAA ; permisif hipotansiyon ; acil yatak başı USG / stabilse BT anjiyo ; acil vasküler cerrahi / EVAR ; masif transfüzyon hazırlığı
- renal kolik, analjezik ; agresif sıvıyla normotansiyon
#23 kilavuz 2 sb-kp-epilepsi | SB Epilepsi KP 2021
S: Acil serviste nöbetin durdurulması için ilk ilaç?
+ benzodiazepin: IV lorazepam / diazepam, damar yolu yoksa IM / intranazal midazolam ; 5. dakikada başlanır ; 2. doz sonrası ikinci basamak (levetirasetam / valproat / fosfenitoin) ; glukoz kontrolü
- ilk seçenek fenitoin ; 20 dk beklenir
#24 tuzak 2 - | rutin bikarbonat arrest
S: Kardiyak arrestte rutin sodyum bikarbonat verilmeli mi?
+ rutin bikarbonat önerilmez ; hiperkalemi, trisiklik antidepresan zehirlenmesi gibi özel durumlarda ; etkin KPR ve ventilasyon asidozu düzeltir
- tüm arrestlerde 10. dakikada bikarbonat ; bikarbonat sağkalımı artırır
#25 kirmizi 2 - | inme taklitçileri
S: Ani hemiparezi ile gelen hastada inme dışı nedenleri dışlamak için ilk bakılacak?
+ kapiller kan şekeri (hipoglisemi) ; nöbet sonrası Todd paralizisi ; migren aurası, konversiyon ; görüntüleme ile kanama ayrımı
- kan şekeri gereksiz ; tüm hemiparezilere tromboliz
#26 ilac 3 - | trisiklik zehirlenme
S: Amitriptilin zehirlenmesinde geniş QRS (>100 ms) ve hipotansiyon. Tedavi?
+ IV sodyum bikarbonat (serum pH 7,45–7,55) ; havayolu ve nöbet kontrolü (benzodiazepin) ; fizostigmin / flumazenil kontrendike ; hipotansiyonda sıvı ve vazopresör
- fizostigmin ; flumazenil ile uyandırma
#27 kirmizi 2 - | pediatrik dehidratasyon
S: Acil serviste ağır dehidrate 15 kg çocukta ilk sıvı?
+ 20 ml/kg izotonik kristaloid bolus (300 ml) ; damar yolu açılamazsa intraosseöz ; tekrar değerlendirme ve tekrar bolus ; glukoz kontrolü
- hipotonik sıvı bolusu ; damar yolu olmadan ORS ile bekle
#28 sgk 1 - | acil hal
S: SGK'lı hastadan acil hallerde ilave ücret alınabilir mi?
+ mevzuatta tanımlı acil hallerde özel hastaneler ilave ücret alamaz ; acil halin tıbbi kayıtla belgelenmesi ; tanımlar SGK / SB mevzuatında ; güncel düzenlemeden doğrulanmalı
- acil hasta her durumda ilave ücret öder ; acil hal tanımı yok
#29 kirmizi 2 - | subaraknoid kanama acil
S: Ani başlayan şiddetli baş ağrısında Ottawa SAK kuralının yeri?
+ nörolojik defisiti olmayan, 15 yaş üstü hastada SAK riskini değerlendirme ; kural negatifse SAK olasılığı çok düşük ; pozitifse BT ve gerekirse LP / BTA ; ilk 6 saatte BT yüksek duyarlı
- kural tüm hastalarda görüntüleme yerine geçer ; BT normalse SAK her zaman dışlanır
#30 kirmizi 2 - | adli olgu
S: Acil serviste darp edilmiş hasta. Hekimin yükümlülüğü?
+ adli olgu bildirimi (adli makamlara) ; ayrıntılı muayene ve adli rapor (lezyonların tarifi) ; delillerin korunması ; aile içi şiddette güvenlik ve sosyal hizmet
- hasta istemezse kayıt tutulmaz ; adli rapor yalnız ölümde
`,
} satisfies BankaKaynagi
