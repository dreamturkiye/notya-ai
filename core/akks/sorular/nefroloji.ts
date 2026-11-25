import type { BankaKaynagi } from '../banka'

/** AKKS — Nefroloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'nefroloji',
  onek: 'NEF',
  metin: String.raw`
#1 kilavuz 2 sb-kp-kbh | SB KBH KP (Versiyon 1.0, 2020), Bölüm 3 Evreler
S: Kronik böbrek hastalığı tanısı ve evrelemesi?
+ 3 aydan uzun süren böbrek hasarı veya eGFR <60 ; GFR (G1–G5) ve albüminüri (A1–A3) evreleri ; KDIGO ısı haritası ile risk ; neden araştırması
- tek kreatinin ölçümü KBH tanısı koydurur ; albüminüri evrelemede yer almaz
#2 kilavuz 2 hsgm-bobrek-programi-2025 | Türkiye Böbrek Hastalıkları Programı 2025-2030
S: KBH taraması kimlere yapılmalı?
+ diyabet, hipertansiyon, KVH ; ailede böbrek hastalığı, obezite, ileri yaş ; eGFR ve idrar albümin/kreatinin oranı ; birinci basamakta düzenli izlem
- tüm toplumda yıllık böbrek biyopsisi ; yalnız kreatinin yeterli
#3 ilac 2 - | KBH SGLT2i
S: Diyabetik olmayan albüminürik KBH'de SGLT2 inhibitörünün yeri?
+ eGFR ≥20 ve albüminüride böbrek ve KV koruma (diyabetten bağımsız) ; maksimum tolere RAS blokajına ek ; başlangıçta eGFR'de beklenen geçici düşüş ; hacim kaybı ve öglisemik DKA farkındalığı
- yalnız diyabetlilerde ; ilk eGFR düşüşünde hemen kesilir
#4 kirmizi 3 - | hiperkalemi
S: K 6,8 mmol/L ve EKG değişikliği olan KBH hastasında acil tedavi?
+ IV kalsiyum ; insülin + glukoz, salbutamol ; potasyum bağlayıcılar (patiromer / SZC) ; dirençte acil hemodiyaliz ; potasyum yükselten ilaçların gözden geçirilmesi
- yalnız diyet önerisi ; kalsiyum verilmez
#5 kilavuz 2 - | diyaliz endikasyonları
S: Acil diyaliz endikasyonları nelerdir?
+ dirençli hiperkalemi ; ağır metabolik asidoz ; diüretiğe yanıtsız sıvı yüklenmesi / akciğer ödemi ; üremik komplikasyonlar (perikardit, ensefalopati) ; diyalizle uzaklaştırılabilen zehirlenmeler (AEIOU)
- yalnız kreatinin 5 üzeri olunca ; perikardit diyaliz endikasyonu değil
#6 kilavuz 2 sb-kp-diyaliz | SB Diyaliz Yöntemi Seçimi KP
S: Diyaliz yöntemi seçiminde hastaya hangi seçenekler anlatılmalı?
+ hemodiyaliz (merkez / ev), periton diyalizi, koruyucu tedavi, ön-emptif transplantasyon ; erken bilgilendirme ve ortak karar ; damar yolu (AVF) erken planlama ; yaşam tarzı ve komorbiditeler
- yalnız merkez hemodiyalizi anlatılır ; AVF diyaliz başladıktan sonra planlanır
#7 ilac 3 - | renal anemi
S: KBH anemisinde ESA tedavisi öncesi ve sırasında nelere dikkat edilir?
+ demir eksikliğinin düzeltilmesi (ferritin, TSAT) ; Hb hedefi genellikle 10–11,5 g/dL, >13 hedeflenmez (inme, tromboz) ; HT kontrolü ; diğer anemi nedenleri ; HIF-PH inhibitörleri seçenek
- Hb hedefi 14–15 ; demir değerlendirmesi gereksiz
#8 sgk 2 sgk-sut | SUT ESA / fosfat bağlayıcı (güncel madde doğrulanacak)
S: KBH'de eritropoetin ve fosfat bağlayıcıların SGK geri ödemesinde genel koşullar?
+ laboratuvar değerlerinin (Hb, ferritin, fosfor) belgelenmesi ; nefroloji uzmanı / ilgili hekim raporu ; doz ve süre kuralları ; güncel SUT'tan doğrulanmalı
- raporsuz ve sınırsız ödenir ; laboratuvar gerekmez
#9 kirmizi 2 - | nefrotik sendrom erişkin
S: Erişkinde yeni nefrotik sendrom (proteinüri 8 g/gün, ödem). Yaklaşım?
+ böbrek biyopsisi (erişkinde çoğunlukla) ; sekonder nedenler (diyabet, amiloidoz, lupus, ilaçlar, malignite, hepatit) ; anti-PLA2R (membranöz) ; tromboz riski (albümin çok düşükse antikoagülasyon), lipid, ödem yönetimi ; RAS blokajı
- erişkinde biyopsisiz uzun süreli yüksek doz steroid ; tromboz riski yok
#10 kirmizi 3 - | hızlı ilerleyen GN
S: Günler içinde kreatinin yükselişi, hematüri, eritrosit silendirleri ve hemoptizi. Ne yaparsın?
+ hızlı ilerleyen glomerülonefrit / pulmoner-renal sendrom ; ANCA, anti-GBM, kompleman ; acil böbrek biyopsisi ; yüksek doz steroid + siklofosfamid / rituksimab, gerekirse plazmaferez ; tedavi biyopsiyi beklemeden başlayabilir
- rutin poliklinik izlemi ; biyopsi sonucu haftalar sonra tedavi
#11 yaygin 2 - | KBH hipertansiyon
S: KBH'de kan basıncı hedefi ve tercih?
+ tolere edilirse SKB <120–130 (bireysel) ; albüminüride ACEİ / ARB maksimum tolere doz ; tuz kısıtlaması ; potasyum / kreatinin izlemi (başlangıçta %30'a kadar artış kabul)
- ACEİ + ARB kombinasyonu ; kreatinin %10 artınca ACEİ kesilir
#12 ilac 2 - | ilaç dozlama KBH
S: KBH'de ilaç dozu ayarlanırken hangi formül ve ilkeler kullanılır?
+ eGFR (CKD-EPI) veya Cockcroft-Gault (ilaç etiketine göre) ; doz azaltma veya aralık uzatma ; nefrotoksiklerden kaçınma ; düzey izlemi gereken ilaçlar
- KBH'de doz ayarı gereksiz ; tüm ilaçlar yarı doz
#13 kirmizi 2 - | kontrast AKI
S: KBH evre 4 hastaya acil koroner anjiyografi gerekiyor. Ne önerirsin?
+ acil endikasyonda kontrast esirgenmez ; izotonik hidrasyon ; en düşük kontrast miktarı ; nefrotoksik ilaçların geçici kesilmesi ; işlem sonrası kreatinin izlemi
- KBH'de anjiyografi kesin kontrendike ; profilaktik diyaliz rutin
#14 kilavuz 2 - | MKB bozukluğu
S: KBH mineral kemik bozukluğunda izlem ve tedavi?
+ kalsiyum, fosfor, PTH, ALP, D vitamini izlemi ; fosfor yüksekliğinde diyet ve fosfat bağlayıcı ; kalsiyum yüklenmesinden kaçınma ; sekonder hiperparatiroidide aktif D vitamini / kalsimimetik
- kalsiyum bazlı bağlayıcı sınırsız ; PTH izlemi gereksiz
#15 tuzak 2 - | fosfat lavman
S: KBH hastasında kabızlık için sodyum fosfat lavmanı uygun mu?
+ fosfat içeren laksatif / lavmanlar akut fosfat nefropatisi ve hiperfosfatemi riski ; KBH'de kaçınılır ; laktüloz / PEG alternatif ; magnezyum içeren ürünlerde de dikkat
- fosfat lavmanı KBH'de güvenli ; magnezyum laksatifler sınırsız
#16 kirmizi 2 - | rabdomiyoliz
S: Uzun süre yerde kalmış yaşlı hastada CK 40.000 U/L ve koyu idrar. Tedavi?
+ rabdomiyoliz ; agresif IV izotonik sıvı (idrar çıkışı 200–300 ml/saat hedef) ; hiperkalemi, hipokalsemi izlemi ; kompartman sendromu ; diyaliz endikasyonları
- sıvı kısıtlanır ; rutin bikarbonat ve mannitol kesin gerekli
#17 yaygin 2 - | böbrek kisti
S: USG'de tesadüfen saptanan basit böbrek kisti. Yaklaşım?
+ Bosniak I basit kist benigndir, izlem gerekmez ; komplike kistlerde BT / MR ile Bosniak sınıflaması ; bilateral çoklu kistte ADPKD değerlendirmesi
- tüm kistler malign potansiyelli, cerrahi ; BT her basit kistte
#18 kilavuz 3 - | ADPKD
S: Otozomal dominant polikistik böbrek hastalığında tedavi seçenekleri?
+ KB kontrolü (ACEİ / ARB) ; bol su ; hızlı ilerleme riskinde tolvaptan (karaciğer izlemi) ; intrakraniyal anevrizma taraması (aile öyküsü) ; genetik danışmanlık
- tolvaptan herkese izlemsiz ; anevrizma taraması gereksiz
#19 kirmizi 2 - | lupus nefriti
S: SLE hastasında proteinüri 1,5 g/gün ve aktif idrar sedimenti. Yaklaşım?
+ böbrek biyopsisi (sınıf) ; sınıf III / IV / V'te immünsüpresif indüksiyon (mikofenolat veya siklofosfamid + steroid) ; hidroksiklorokin ; RAS blokajı ; yeni ajanlar (belimumab, vokosporin)
- biyopsisiz yalnız NSAİİ ; hidroksiklorokin kesilir
#20 ilac 2 - | lityum böbrek
S: Uzun süreli lityum kullanımının böbrek etkileri ve izlem?
+ nefrojenik diyabetes insipidus ; kronik interstisyel nefrit, eGFR düşüşü ; düzenli kreatinin, düzey izlemi ; NSAİİ / ACEİ / diüretik etkileşimi
- böbrek etkisi yoktur ; izlem gereksiz
#21 kilavuz 2 - | transplant immünsüpresyon
S: Böbrek nakilli hastada takrolimus düzeyini etkileyen ilaç etkileşimleri?
+ CYP3A4 inhibitörleri (makrolid, azol antifungal, diltiazem, greyfurt) düzeyi artırır ; indükleyiciler (rifampisin, karbamazepin) azaltır ; nefrotoksisite ; transplant merkezine bildirim ve düzey izlemi
- klaritromisin güvenle eklenir ; düzey izlemi gereksiz
#22 kirmizi 2 - | AKI postrenal
S: Yaşlı erkekte oligüri ve kreatinin artışı, mesane globu. İlk adım?
+ postrenal obstrüksiyon ; mesane kateterizasyonu / USG ile hidronefroz ; post-obstrüktif diürez izlemi ; nedenin tedavisi (BPH)
- diüretik verilir ; kateter kontrendike
#23 yaygin 2 - | hematüri izole
S: Genç erişkinde kalıcı izole mikroskopik glomerüler hematüri (proteinüri yok, KB normal). İzlem?
+ IgA nefropatisi / ince bazal membran olasılığı ; yıllık KB, proteinüri ve eGFR izlemi ; proteinüri / HT / eGFR düşüşünde biyopsi ; aile öyküsü
- hemen biyopsi ; izlem gereksiz
#24 tuzak 2 - | KBH protein yüksek
S: KBH'li hastaya kas kaybını önlemek için yüksek protein diyeti önerilir mi?
+ diyaliz öncesi ileri KBH'de yüksek protein önerilmez ; yaklaşık 0,6–0,8 g/kg/gün (bireysel) ; diyalizde ihtiyaç artar ; diyetisyen ile
- tüm KBH'lilere 2 g/kg protein ; diyalizde protein kısıtlanır
#25 kirmizi 2 - | renal arter darlığı
S: Genç kadında dirençli hipertansiyon ve abdominal üfürüm. Ne düşünürsün?
+ fibromusküler displazi / renal arter darlığı ; Doppler USG / BT-MR anjiyografi ; FMD'de anjiyoplasti ; ACEİ başlangıcında kreatinin artışına dikkat
- esansiyel HT, tetkik gereksiz ; ACEİ sonrası kreatinin artışı önemsiz
#26 ilac 2 - | metformin diyaliz
S: Hemodiyaliz hastasında metformin kullanılabilir mi?
+ eGFR <30 ve diyalizde metformin kontrendike (laktik asidoz) ; alternatif: insülin, DPP-4 inhibitörü (linagliptin doz ayarsız) ; hipoglisemi riski (insülin klirensi azalmış)
- diyaliz metformini temizler, güvenli ; sülfonilüre ilk seçenek
#27 kilavuz 2 sb-kp-kbh | SB KBH KP, Bölüm 12 İzlem
S: KBH hastalarının izlem sıklığı neye göre belirlenir?
+ GFR ve albüminüri kategorisine göre (KDIGO risk ısı haritası) ; yüksek riskte yılda 3–4 kez ; komplikasyon izlemi (anemi, MKB, asidoz) ; aşılama (HBV, influenza, pnömokok)
- tüm KBH'liler 2 yılda bir ; aşılama gereksiz
#28 kirmizi 2 - | periton diyaliz peritonit
S: Periton diyalizi hastasında bulanık diyalizat ve karın ağrısı. Yaklaşım?
+ PD peritoniti ; diyalizat hücre sayımı (>100/µL, %50 PMN), Gram ve kültür ; ampirik intraperitoneal antibiyotik (gram pozitif + negatif kapsam) ; kateter çıkış yeri / tünel enfeksiyonu ; yanıtsızlıkta kateter çıkarılması
- oral antibiyotik ile ayaktan ; kültür gereksiz
#29 yaygin 2 - | metabolik asidoz KBH
S: KBH'de serum bikarbonat 18 mmol/L. Tedavi?
+ oral sodyum bikarbonat ile bikarbonat >22 hedef ; KBH progresyonu ve kemik-kas kaybını azaltabilir ; sodyum / sıvı yükü izlemi ; diyetle meyve-sebze (potasyum izlemiyle)
- asidoz önemsiz ; IV bikarbonat bolus rutin
#30 tuzak 2 - | NSAİİ KBH
S: KBH evre 3 hastada kısa süreli ibuprofen güvenli mi?
+ KBH'de NSAİİ'lerden mümkünse kaçınılır ; AKI, hiperkalemi, sıvı retansiyonu riski ; ACEİ / diüretikle "üçlü darbe" ; parasetamol ve topikal NSAİİ alternatif
- KBH'de NSAİİ tamamen güvenli ; uzun süreli kullanılabilir
`,
} satisfies BankaKaynagi
