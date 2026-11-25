import type { BankaKaynagi } from '../banka'

/** AKKS — Enfeksiyon Hastalıkları. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'enfeksiyon-hastaliklari',
  onek: 'ENF',
  metin: String.raw`
#1 kilavuz 2 dernek-klimik | toplum kökenli pnömoni
S: Ek hastalığı olmayan erişkinde ayaktan toplum kökenli pnömonide ampirik tedavi?
+ CURB-65 / klinik değerlendirme ile ayaktan uygunluk ; amoksisilin yüksek doz veya doksisiklin / makrolid (yerel direnç) ; komorbiditede beta-laktam + makrolid veya solunum kinolonu ; 5 gün, klinik yanıtla ; 48–72 saatte yeniden değerlendirme
- tüm hastalara kinolon ilk seçenek ; 14 gün standart
#2 kirmizi 3 - | bakteriyel menenjit
S: Erişkinde ateş, ense sertliği ve bilinç bulanıklığı. Ampirik tedavi?
+ kan kültürü sonrası beklemeden seftriakson + vankomisin ; 50 yaş üstü / immünsüpresede ampisilin (Listeria) ; antibiyotikle birlikte / hemen önce deksametazon ; görüntüleme gerekiyorsa antibiyotik geciktirilmez ; temaslı profilaksisi (meningokok)
- BT ve LP sonucu beklenip antibiyotik ; deksametazon antibiyotikten günler sonra
#3 ilac 2 - | akılcı antibiyotik
S: Akut viral üst solunum yolu enfeksiyonunda antibiyotik istemine nasıl yaklaşılır?
+ viral enfeksiyonda antibiyotik yararsız ; direnç ve yan etki ; semptomatik tedavi ve bakteriyel komplikasyon belirtileri konusunda bilgilendirme ; SB Akılcı İlaç Kullanımı ilkeleri ; gecikmeli reçete seçeneği
- hasta istiyorsa antibiyotik ; geniş spektrum önleyicidir
#4 kilavuz 2 - | HIV PEP
S: Mesleki iğne batması sonrası HIV temas sonrası profilaksi?
+ kaynak ve temas değerlendirmesi ; mümkünse 2 saat içinde, en geç 72 saat içinde PEP ; üçlü antiretroviral, 28 gün ; HBV / HCV değerlendirmesi ; başlangıç ve izlem testleri
- 1 hafta sonra başlanır ; tek ilaç yeterli
#5 kilavuz 3 - | latent TB
S: Biyolojik ajan başlanacak hastada latent tüberküloz saptandı. Yaklaşım?
+ aktif TB dışlanması (semptom, akciğer grafisi) ; latent TB tedavisi (izoniazid 9 ay veya rifampisin 4 ay vb. — ulusal rehbere göre) ; biyolojik ajan genellikle tedavinin ilk ayından sonra ; Verem Savaşı Dispanseri / ulusal kayıt
- latent TB tedavisi gereksiz ; aktif TB dışlanmadan tek ilaç
#6 kilavuz 3 - | aktif TB tedavisi
S: Duyarlı akciğer tüberkülozunda standart tedavi rejimi?
+ başlangıç fazı 2 ay HRZE ; idame fazı 4 ay HR ; doğrudan gözetimli tedavi (DGT) ; bildirim ve temaslı taraması ; karaciğer fonksiyonu ve göz (etambutol) izlemi
- tek ilaçla tedavi ; 2 ayda tedavi biter
#7 kirmizi 2 - | febril nötropeni
S: Febril nötropenide ampirik antibiyotik seçimi?
+ antipseudomonal beta-laktam (sefepim, piperasilin-tazobaktam, meropenem) ; 1 saat içinde ; MRSA / kateter / deri enfeksiyonu / instabilite varsa vankomisin eklenmesi ; risk (MASCC) değerlendirmesi
- seftriakson tek başına yeterli ; antibiyotik 24 saat sonra
#8 yaygin 2 - | C. difficile
S: Antibiyotik sonrası günde 6–8 sulu ishali olan hastada C. difficile tanısı ve tedavisi?
+ toksin / PCR testi (iki aşamalı) ; tetikleyici antibiyotiğin mümkünse kesilmesi ; oral fidaksomisin veya oral vankomisin ; metronidazol ilk seçenek değil ; temas izolasyonu, sabun-su ile el yıkama
- alkol bazlı el antiseptiği sporları öldürür ; IV vankomisin
#9 kirmizi 3 - | sıtma
S: Afrika seyahatinden dönen hastada ateş ve titreme. Ne yaparsın?
+ sıtma acil olarak dışlanmalı ; kalın-ince yayma / hızlı test (tekrarlayan) ; P. falciparum ağır sıtmada IV artesunat ; bildirim ; ağırlık bulguları (bilinç, hipoglisemi, asidoz, böbrek)
- grip, semptomatik ; tek negatif yayma dışlar
#10 kirmizi 2 - | KKKA
S: İç Anadolu'dan, kene ısırığı sonrası ateş, trombositopeni ve karaciğer enzim yüksekliği. Ne düşünürsün?
+ Kırım-Kongo kanamalı ateşi ; standart ve temas izolasyonu, personel koruması ; destek tedavisi, kan ürünleri ; ribavirin tartışmalı / erken dönemde ; bildirim zorunlu
- izolasyon gereksiz ; keneyi yakarak çıkarma
#11 ilac 2 - | penisilin alerjisi
S: Penisilin alerjisi öyküsü olan hastada alerji etiketine yaklaşım?
+ öykünün ayrıntılandırılması (reaksiyon tipi, zaman) ; düşük riskli öyküde direkt oral provokasyon ile etiket kaldırma ; anafilaksi / ağır kutanöz reaksiyonda kaçınma ve alerji uzmanı ; yanlış etiket geniş spektrum ve direnç artışı
- tüm penisilin alerjililerde sefalosporin kesin yasak ; etiket asla sorgulanmaz
#12 kilavuz 2 sb-asi-takvimi | erişkin aşılama
S: 65 yaş üstü erişkine hangi aşılar önerilir?
+ yıllık influenza ; pnömokok aşısı (konjuge ± polisakkarit, güncel öneri) ; Td / Tdap rapel (10 yılda bir) ; zona aşısı (rekombinant) ; COVID-19 güncel öneriler
- yaşlılarda aşı etkisiz ; canlı zona aşısı immünsüpresede güvenli
#13 kirmizi 2 - | nekrotizan fasiit
S: Nekrotizan yumuşak doku enfeksiyonunda antibiyotik ve cerrahi?
+ acil cerrahi debridman esas ; geniş spektrumlu antibiyotik (karbapenem / piperasilin-tazobaktam + vankomisin + klindamisin) ; klindamisin toksin üretimini baskılar ; tekrarlayan debridman
- yalnız antibiyotik ; cerrahi görüntüleme sonrası günler içinde
#14 yaygin 2 - | piyelonefrit
S: Ayaktan tedavi edilebilir akut piyelonefritte tedavi?
+ idrar kültürü ; yerel dirence göre oral kinolon (7 gün) veya TMP-SMX (14 gün) ya da başlangıçta tek doz parenteral ; nitrofurantoin / fosfomisin uygun değil ; 48–72 saatte yanıt yoksa görüntüleme
- nitrofurantoin piyelonefritte ilk seçenek ; kültür gereksiz
#15 kilavuz 2 - | brusella
S: Türkiye'de sık görülen brusellozda tedavi?
+ doksisiklin + rifampisin (6 hafta) veya doksisiklin + streptomisin / gentamisin ; spondilit / nörobrusellozda uzun ve üçlü tedavi ; çiğ süt / taze peynir sorgulaması ; bildirim
- tek ilaç 1 hafta ; çiğ süt güvenli
#16 kirmizi 2 - | infektif endokardit
S: Ateş, yeni üfürüm ve emboli bulguları olan hastada tanı yaklaşımı?
+ en az 3 set kan kültürü antibiyotik öncesi ; ekokardiyografi (TTE, gerekirse TEE) ; Duke kriterleri ; ampirik antibiyotik kültür sonrası ; cerrahi endikasyonlar (KY, apse, emboli)
- kan kültürü antibiyotikten sonra ; tek set kültür yeterli
#17 ilac 3 - | vankomisin izlem
S: Vankomisin tedavisinde düzey izlemi nasıl yapılır?
+ AUC temelli dozlama (AUC/MIC 400–600) veya çukur düzey ; böbrek fonksiyonu izlemi ; nefrotoksisite (piperasilin-tazobaktam ile birlikte risk artışı) ; obezite / böbrek yetmezliğinde doz ayarı
- düzey izlemi gerekmez ; böbrek fonksiyonu önemsiz
#18 yaygin 2 - | hepatit B
S: HBsAg pozitif hastada değerlendirme?
+ HBeAg / anti-HBe, HBV DNA, ALT, fibrozis değerlendirmesi ; tedavi endikasyonu (viral yük, ALT, fibrozis / siroz) ; tenofovir / entekavir ; aile taraması ve aşılama ; HCC taraması (risk grupları)
- tüm HBsAg pozitiflere interferon ; aile taraması gereksiz
#19 kilavuz 2 - | hepatit C
S: HCV RNA pozitif hastada güncel tedavi?
+ direkt etkili antiviraller (pangenotipik rejimler) ; yüksek kür oranı (>%95) ; tedavi öncesi fibrozis, HBV koenfeksiyonu (reaktivasyon), ilaç etkileşimleri ; SVR12 ile kür
- interferon + ribavirin standart ; tedavi yalnız sirozda
#20 sgk 2 sgk-sut | SUT antiviral (güncel madde doğrulanacak)
S: Kronik hepatit B/C antiviral tedavisinin SGK tarafından karşılanmasında genel koşul?
+ ilgili uzman (enfeksiyon / gastroenteroloji) raporu ; SUT'ta tanımlı laboratuvar kriterleri (HBV DNA, ALT, biyopsi / fibrozis) ; tedavi süresi ve izlem ; güncel SUT'tan doğrulanmalı
- raporsuz ödenir ; kriter gerekmez
#21 tuzak 2 - | antibiyotik süresi
S: Antibiyotik tedavisinin "kutu bitene kadar uzun süre" verilmesi direnci önler mi?
+ gereğinden uzun antibiyotik direnç ve yan etkiyi artırır ; birçok enfeksiyonda kısa süreli tedavi kanıtlanmış (ör. TKP 5 gün, sistit 3–5 gün) ; klinik yanıta göre süre
- tüm enfeksiyonlarda 14 gün ; kısa tedavi direnç yapar
#22 kirmizi 2 - | şarbon
S: Hayvancılık yapan hastada kolunda ağrısız siyah escharlı ülser ve çevresinde ödem. Ne düşünürsün?
+ kutanöz şarbon ; yara örneği (Gram, kültür / PCR) ; penisilin / doksisiklin / siprofloksasin ; bildirim ve hayvan teması araştırması ; sistemik bulguda IV kombinasyon
- örümcek ısırığı, topikal krem ; bildirim gereksiz
#23 kilavuz 2 - | el hijyeni
S: Hastane enfeksiyonlarını önlemede el hijyeninin 5 anı nedir?
+ hasta ile temastan önce ; aseptik işlemden önce ; vücut sıvısıyla temas riski sonrası ; hasta ile temastan sonra ; hastanın çevresiyle temastan sonra
- eldiven el hijyeninin yerine geçer ; yalnız işlem sonrası
#24 ilac 2 - | kinolon uyarıları
S: Florokinolonların ciddi yan etkileri nedeniyle kullanımı nasıl sınırlandırılmalı?
+ tendinopati / rüptür, periferik nöropati, aort anevrizması / diseksiyonu, disglisemi, QT ; hafif enfeksiyonlarda (basit sistit, sinüzit, bronşit) ilk seçenek değil ; yaşlı / steroid kullananda dikkat
- kinolonlar hafif enfeksiyonlarda ilk seçenek ; yan etki yoktur
#25 kirmizi 2 - | kızamık
S: Ateş, öksürük, konjonktivit ve yüzden başlayan makülopapüler döküntü olan aşısız çocuk. Yaklaşım?
+ kızamık ; solunum izolasyonu ; bildirim ve temaslı yönetimi (aşı / immünoglobulin) ; A vitamini ; komplikasyonlar (pnömoni, ensefalit)
- izolasyon gerekmez ; antibiyotik tedavisi
#26 yaygin 2 - | diyabetik ayak enfeksiyonu
S: Hafif diyabetik ayak enfeksiyonunda ampirik antibiyotik?
+ hafif enfeksiyon çoğunlukla gram pozitif ; oral sefaleksin / amoksisilin-klavulanat ; derin doku kültürü (sürüntü değil) ; vasküler değerlendirme, debridman ; osteomyelit dışlama
- yüzeyel sürüntü kültürüne göre geniş spektrum ; vasküler değerlendirme gereksiz
#27 tuzak 3 - | asemptomatik kandidüri
S: Kateterli hastada idrarda asemptomatik Candida üremesi tedavi edilmeli mi?
+ asemptomatik kandidüri genellikle tedavi edilmez ; kateter değişimi / çıkarılması ; tedavi: nötropenik, ürolojik girişim öncesi, düşük doğum ağırlıklı bebek ; gereksiz antifungal direnç yaratır
- tüm kandidürilerde flukonazol ; amfoterisin mesane irrigasyonu rutin
#28 kirmizi 2 - | kuduz profilaksi
S: Yarasa ile teması olan, ısırık izi görülmeyen kişide kuduz profilaksisi?
+ yarasa teması kategori III kabul edilir ; aşı + kuduz immünoglobulini ; SB Kuduz Proflaksisi rehberi ; yara yoksa da değerlendirme
- iz yoksa profilaksi gereksiz ; yalnız tetanoz
#29 ilac 2 - | antibiyotik gebelik
S: Gebelikte genellikle güvenli kabul edilen antibiyotikler hangileridir?
+ beta-laktamlar (penisilin, sefalosporin) ; azitromisin / eritromisin (bazı) ; nitrofurantoin (term yakını hariç) ; kaçınılacaklar: tetrasiklin, kinolonlar, aminoglikozid (seçilmiş), TMP-SMX (1. trimester / term)
- tetrasiklin gebelikte güvenli ; kinolon ilk seçenek
#30 kilavuz 2 - | izolasyon önlemleri
S: Akciğer tüberkülozu şüpheli hastada hangi izolasyon önlemi alınır?
+ solunum (havayolu) izolasyonu, negatif basınçlı oda ; personel N95 / FFP2 maske ; hastaya cerrahi maske ; tanı ve tedaviyle bulaştırıcılığın sona ermesine kadar
- damlacık izolasyonu yeterli ; cerrahi maske personeli korur
`,
} satisfies BankaKaynagi
