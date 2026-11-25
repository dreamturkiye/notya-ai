import type { BankaKaynagi } from '../banka'

/** AKKS — Dahiliye. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'dahiliye',
  onek: 'DAH',
  metin: String.raw`
#1 kilavuz 2 sb-kp-diyabet | SB Diyabet KP (Versiyon 1.0, 2019), Bölüm 2 Tip 2
S: Yeni tanı tip 2 diyabetli, aterosklerotik KVH'si olan hastada başlangıç tedavisi?
+ yaşam tarzı + metformin ; KVH kanıtlı hastada glisemiden bağımsız SGLT2 inhibitörü veya GLP-1 RA ; HbA1c hedefi bireysel (çoğu hastada <%7) ; böbrek fonksiyonuna göre doz
- yalnız sülfonilüre ; KVH'de SGLT2i / GLP-1 RA önerilmez
#2 kirmizi 3 - | DKA erişkin
S: Erişkinde DKA tedavisinin temel adımları?
+ izotonik sıvı resüsitasyonu ; potasyum ≥3,3 mmol/L ise IV insülin infüzyonu (altındaysa önce potasyum) ; glukoz 200–250 mg/dL'ye inince dekstrozlu sıvı ; anyon açığı kapanana kadar insülin ; tetikleyici araştırma
- potasyum düşükken insülin başlanır ; rutin bikarbonat
#3 kirmizi 2 - | hiponatremi
S: Na 118 mmol/L, nöbet geçiren hastada tedavi?
+ ağır semptomatik hiponatremi ; %3 hipertonik salin bolus (100–150 ml, tekrarlanabilir) ; ilk saatlerde 4–6 mmol/L artış ; 24 saatte 8–10 mmol/L'yi aşmamak (ozmotik demiyelinizasyon) ; nedenin araştırılması
- hızlı tam düzeltme ; semptomatikte sıvı kısıtlaması tek başına
#4 ilac 2 - | metformin böbrek
S: eGFR'ye göre metformin kullanımı nasıl ayarlanır?
+ eGFR ≥45 standart ; 30–45 arasında doz azaltma ve yeni başlamama ; eGFR <30 kontrendike ; kontrastlı tetkik / akut hastalıkta geçici kesme ; B12 izlemi
- eGFR 20'de tam doz ; böbrek fonksiyonu önemsiz
#5 kilavuz 2 sb-kp-kbh | SB KBH KP (2020), Bölüm 13 Sevk
S: KBH hastası hangi durumlarda nefrolojiye sevk edilir?
+ eGFR <30 ml/dk ; belirgin albüminüri (ACR >300 mg/g) ; hızlı eGFR düşüşü ; dirençli hipertansiyon, hiperkalemi ; açıklanamayan hematüri / herediter böbrek hastalığı
- tüm KBH hastaları yalnız diyaliz döneminde sevk edilir ; albüminüri önemsiz
#6 kilavuz 2 sb-kp-demir | SB Demir Eksikliği Anemisi KP (2020)
S: Erişkin erkekte demir eksikliği anemisi saptandığında ne yapılır?
+ erkek ve postmenopozal kadında GİS kanama kaynağı araştırılır ; üst ve alt endoskopi ; çölyak taraması ; oral demir (gün aşırı dozlama emilimi artırabilir) ; yanıtsızlık / intoleransta IV demir
- yalnız demir verilip neden araştırılmaz ; tüm hastalara IV demir ilk seçenek
#7 kirmizi 3 - | sepsis
S: Ateş, hipotansiyon (OAB <65) ve laktat 4 mmol/L olan hastada ilk saat tedavisi?
+ septik şok ; kültürler alınıp ilk saatte geniş spektrumlu antibiyotik ; 30 ml/kg kristaloid ; sıvıya yanıtsız hipotansiyonda norepinefrin ; kaynak kontrolü, laktat tekrarı
- antibiyotik kültür sonucuna göre başlanır ; dopamin ilk vazopresör
#8 yaygin 2 - | hipotiroidi
S: Primer hipotiroidi tanılı yaşlı koroner hastasında levotiroksin başlangıcı?
+ yaşlı / koroner hastada düşük dozla başlayıp kademeli artırma (12,5–25 mcg) ; 6–8 haftada TSH ile titrasyon ; aç karnına, demir / kalsiyumdan ayrı ; aşırı tedaviden (AF, osteoporoz) kaçınma
- tam doz (1,6 mcg/kg) hemen ; TSH izlemi gerekmez
#9 kirmizi 2 - | adrenal kriz
S: Uzun süreli steroid kullanan hasta ilacı aniden bırakmış; hipotansiyon, kusma, hiponatremi. Yaklaşım?
+ adrenal kriz ; hemen IV hidrokortizon 100 mg (testi beklemeden) ; izotonik sıvı, glukoz ; tetikleyici araştırma ; hasta eğitimi (stres dozu)
- tanı testi sonucu beklenir ; yalnız sıvı yeterli
#10 ilac 3 - | NSAİİ riskleri
S: Yaşlı, KBH ve kalp yetmezliği olan hastada NSAİİ kullanımı?
+ böbrek fonksiyon bozulması, sıvı retansiyonu, KY alevlenmesi ; GİS kanama riski (gastroprotektif gerekebilir) ; ACEİ + diüretik + NSAİİ ("üçlü darbe") akut böbrek hasarı ; parasetamol tercih
- NSAİİ yaşlıda en güvenli analjeziktir ; ACEİ + diüretik + NSAİİ güvenli
#11 kilavuz 2 hsgm-hyp-ht-kilavuzu-2025 | HYP HT Tarama ve İzlem Kılavuzu 2025
S: Hipertansiyon tanısı için ofis dışı ölçümün yeri nedir?
+ tanının doğrulanmasında ev KB ölçümü veya ambulatuvar KB izlemi ; beyaz önlük ve maskeli hipertansiyonun saptanması ; doğru ölçüm tekniği (manşon, dinlenme) ; ev ölçümünde eşik 135/85
- tek ofis ölçümü tanı koydurur ; ev ölçümünde eşik 160/100
#12 yaygin 2 - | hiperkalsemi
S: Ca 13 mg/dL, bilinç bulanıklığı olan hastada tedavi?
+ IV izotonik sıvı ile hidrasyon ; bisfosfonat (zoledronik asit) ; kalsitonin hızlı etki ; neden: malignite / hiperparatiroidi (PTH, PTHrP) ; diüretik yalnız hacim yüklemesi sonrası
- tiyazid diüretik ile kalsiyum düşürülür ; kalsiyum takviyesine devam
#13 kirmizi 2 - | üst GİS kanama
S: Melena ve hipotansiyonla gelen hastada ilk yaklaşım?
+ resüsitasyon, iki geniş damar yolu ; restriktif transfüzyon (Hb <7, KVH'de <8) ; IV PPI ; 24 saat içinde endoskopi (instabilde daha erken) ; Glasgow-Blatchford skoru
- liberal transfüzyon hedef Hb 12 ; endoskopi 1 hafta sonra
#14 ilac 2 - | PPI uzun süre
S: Endikasyonsuz uzun süreli PPI kullanımının riskleri?
+ C. difficile ve enterik enfeksiyonlar ; hipomagnezemi, B12 eksikliği ; kırık riski artışı ; endikasyon gözden geçirilip azaltma / kesme (deprescribing)
- PPI tamamen risksizdir ; ömür boyu herkes kullanmalı
#15 kilavuz 2 sb-kp-hipertansiyon | SB HT KP
S: Diyabetik ve albüminürisi olan hipertansif hastada ilk tercih antihipertansif?
+ ACEİ veya ARB ; KB hedefi genellikle <130/80 (tolere edilirse) ; KKB veya tiyazid ile kombinasyon ; potasyum / kreatinin izlemi ; SGLT2i böbrek koruma
- beta bloker ilk seçenek ; ACEİ + ARB birlikte
#16 kirmizi 3 - | anafilaksi erişkin
S: Erişkinde anafilaksinin ilk tedavisi?
+ IM adrenalin 0,5 mg (1 mg/ml) uyluk lateraline ; 5–15 dk'da tekrarlanabilir ; sırtüstü / bacaklar yukarı, oksijen, IV sıvı ; antihistaminik / steroid ikincil ; bifazik reaksiyon için gözlem
- ilk tedavi IV steroid ; adrenalin subkutan
#17 tuzak 2 - | asemptomatik bakteriüri yaşlı
S: Sondası olmayan, semptomu olmayan yaşlı hastada idrar kültüründe üreme varsa tedavi edilir mi?
+ asemptomatik bakteriüri yaşlıda tedavi edilmez ; gereksiz antibiyotik direnç ve C. difficile ; istisnalar: gebelik, ürolojik girişim öncesi ; konfüzyon tek başına İYE kanıtı değil
- tüm pozitif kültürler tedavi edilmeli ; konfüzyonlu yaşlıda bakteriüri = İYE
#18 yaygin 2 - | osteoporoz
S: Postmenopozal osteoporozda (T skoru −2,8) tedavi?
+ kalsiyum ve D vitamini yeterliliği ; ilk seçenek oral bisfosfonat ; denosumab alternatif (kesilince rebound) ; çok yüksek riskte anabolik (teriparatid) ; düşme önleme
- yalnız kalsiyum yeterli ; denosumab ani kesilebilir
#19 ilac 3 - | warfarin etkileşim
S: Warfarin kullanan hastaya antibiyotik verilecek. Nelere dikkat edilir?
+ TMP-SMX, metronidazol, florokinolon, makrolidler INR'yi artırabilir ; INR'nin yakın izlemi ; mümkünse etkileşimi az olan antibiyotik ; kanama bulguları konusunda bilgilendirme
- antibiyotiklerle etkileşim yoktur ; INR izlemi gerekmez
#20 kirmizi 2 - | febril nötropeni
S: Kemoterapi alan hastada ateş 38,5 °C, nötrofil 300/mm³. Yaklaşım?
+ febril nötropeni acil ; kültürler sonrası 1 saat içinde antipseudomonal beta-laktam ; MASCC risk değerlendirmesi ; instabilde yoğun bakım ; düşük riskte seçilmiş hastada oral tedavi
- antibiyotik 24 saat beklenir ; rektal muayene / ısı
#21 kilavuz 2 sb-kp-kbh | SB KBH KP, Bölüm 14 İlaç
S: KBH'de kaçınılması gereken / doz ayarı gereken ilaçlar?
+ NSAİİ'lerden kaçınma ; metformin, NOAK, bazı antibiyotikler (eGFR'ye göre) ; magnezyum / fosfat içeren laksatif-lavmanlar ; kontrast madde öncesi risk değerlendirmesi ; gadolinyum (ileri KBH)
- KBH'de doz ayarı gerekmez ; fosfatlı lavman güvenli
#22 yaygin 2 - | hiperürisemi
S: Asemptomatik hiperürisemide (ürik asit 8,5) ürat düşürücü tedavi başlanır mı?
+ asemptomatik hiperürisemide rutin ürat düşürücü önerilmez ; yaşam tarzı ; gut atağı / tofüs / taşta tedavi ; ilaç nedenleri (tiyazid)
- herkese allopurinol ; gut atağı sırasında allopurinol hemen başlanmalı ve kesilmeli
#23 kirmizi 3 - | hipertansif acil
S: KB 230/130, göğüs ağrısı ve akciğer ödemi olan hasta. Yaklaşım?
+ hipertansif acil (organ hasarı) ; yoğun bakımda IV titre edilebilir ajan ; ilk saatte KB'yi %25'ten fazla düşürmeme (aort diseksiyonu hariç) ; organ hasarına göre ajan (nitrogliserin, loop diüretik) ; dil altı nifedipin önerilmez
- dil altı nifedipin ; KB hemen normale indirilir
#24 sgk 2 sgk-sut | SUT; SGLT2 / GLP-1 (güncel madde doğrulanacak)
S: GLP-1 reseptör agonistlerinin SGK geri ödemesi genel olarak hangi koşullara bağlıdır?
+ belirli VKİ ve önceki tedavi (metformin ± diğer) yetersizliği kriterleri ; endokrinoloji / iç hastalıkları uzmanı raporu ; obezite tek başına endikasyonda ödeme kapsamı sınırlı ; güncel SUT'tan doğrulanmalı
- kilo vermek isteyen herkese ödenir ; pratisyen raporu yeterli
#25 yaygin 2 - | B12 eksikliği
S: Makrositer anemi ve B12 düşüklüğü olan hastada tedavi?
+ nedenin araştırılması (pernisiyöz anemi — intrinsik faktör antikoru, metformin, PPI, diyet) ; IM siyanokobalamin yükleme ; malabsorbsiyon yoksa yüksek doz oral seçenek ; nörolojik bulgularda yoğun tedavi
- yalnız folik asit ; tedavi 1 ay sonra kesilir
#26 kirmizi 2 - | AKI
S: Hastanede yatan hastada kreatinin 48 saatte 1,0'dan 2,1 mg/dL'ye çıktı. Yaklaşım?
+ KDIGO ile akut böbrek hasarı ; prerenal / renal / postrenal ayırımı (sıvı durumu, idrar, USG) ; nefrotoksik ilaçların kesilmesi ; ilaç dozlarının ayarı ; diyaliz endikasyonları (dirençli hiperkalemi, asidoz, sıvı yüklenmesi, üremi)
- NSAİİ ile devam ; kontrastlı BT ile değerlendirme rutin
#27 ilac 2 - | insülin başlangıç
S: Oral ajanlarla HbA1c %9,8 olan tip 2 diyabetlide bazal insülin nasıl başlanır?
+ bazal insülin 10 IU veya 0,1–0,2 IU/kg/gün ; açlık glukozuna göre 3 günde bir titrasyon ; metformin sürdürülür ; hipoglisemi eğitimi ; GLP-1 RA alternatif / kombinasyon
- tüm oral ajanlar kesilir ; titrasyon yapılmaz
#28 tuzak 2 - | rutin vitamin D tarama
S: Risk faktörü olmayan sağlıklı erişkinlerde rutin D vitamini düzeyi taraması önerilir mi?
+ risk faktörü olmayanlarda rutin tarama önerilmez ; risk gruplarında (osteoporoz, malabsorbsiyon, KBH) ölçüm ; gereksiz yüksek doz takviye toksisitesi
- herkese her yıl D vitamini ölçümü ; 50.000 IU haftalık süresiz
#29 kirmizi 2 - | PE şüphesi skorlama
S: Nefes darlığı olan hastada pulmoner emboli olasılığı düşük; nasıl dışlarsın?
+ Wells / Geneva ile klinik olasılık ; düşük olasılıkta PERC veya D-dimer ; yaşa göre ayarlı D-dimer (>50 yaş: yaş x 10) ; D-dimer pozitif / yüksek olasılıkta BT pulmoner anjiyografi
- yüksek olasılıkta D-dimer normalse PE dışlanır ; tüm hastalara BT
#30 yaygin 2 - | kronik öksürük
S: Sigara içmeyen, akciğer grafisi normal erişkinde 8 haftadan uzun süren öksürük. Sık nedenler?
+ üst hava yolu öksürük sendromu (postnazal akıntı) ; astım / eozinofilik bronşit ; GÖRH ; ACE inhibitörü kullanımı ; sırayla ampirik tedavi / tetkik
- tüm hastalara antibiyotik ; ACEİ öksürüğe neden olmaz
`,
} satisfies BankaKaynagi
