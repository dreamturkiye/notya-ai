import type { BankaKaynagi } from '../banka'

/** AKKS — Üroloji. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'uroloji',
  onek: 'URO',
  metin: String.raw`
#1 yaygin 2 dernek-tud | renal kolik
S: Böbrek koliği olan hastada analjezi ve değerlendirme?
+ NSAİİ (diklofenak / ketoprofen) ilk seçenek, böbrek fonksiyonuna dikkat ; görüntüleme: kontrastsız düşük doz BT (gebelikte USG) ; distal ≤10 mm taşta medikal ekspulsif tedavi (tamsulosin) ; ateş + obstrüksiyonda acil dekompresyon
- ilk seçenek opioid ; ateşli obstrüktif taşta ESWL
#2 kirmizi 3 - | obstrüktif piyelonefrit
S: Üreter taşı, ateş ve hidronefroz olan hastada yaklaşım?
+ enfekte obstrükte böbrek ürolojik acil ; acil dekompresyon (JJ stent veya nefrostomi) ; IV antibiyotik, kültürler ; taş tedavisi enfeksiyon sonrası ertelenir
- antibiyotikle bekle, taşı kır ; ESWL acil
#3 kirmizi 3 - | testis torsiyonu
S: 15 yaşında ani skrotal ağrı, testis yukarıda ve yatay, kremaster refleksi yok. Yaklaşım?
+ testis torsiyonu ; tanıyı geciktirmeden acil skrotal eksplorasyon ; ideal ilk 6 saat ; bilateral orşiopeksi ; Doppler cerrahiyi geciktirmemeli
- antibiyotik ile epididimit tedavisi ; ertesi gün USG
#4 kilavuz 2 sb-kp-prostat-kanseri | SB Prostat Kanseri KP (baskı doğrulanacak)
S: PSA taraması konusunda hastaya nasıl danışmanlık yapılır?
+ 50 yaş civarından (risk grubunda 45) paylaşılan karar ; yarar ve aşırı tanı / tedavi riskleri ; PSA yüksekse tekrar ve MR (mpMR) sonrası biyopsi ; yaşam beklentisi
- herkese 40 yaşından itibaren yıllık zorunlu ; PSA yüksekse doğrudan radikal prostatektomi
#5 yaygin 2 - | BPH
S: Orta düzey alt üriner sistem semptomlu BPH'de medikal tedavi?
+ IPSS ; alfa bloker (tamsulosin) hızlı etki ; prostat büyükse (>40 ml) 5-alfa redüktaz inhibitörü, kombinasyon ; PSA ve idrar tahlili ; komplikasyonlarda cerrahi (TUR-P)
- tüm BPH'ye hemen cerrahi ; 5-ARİ PSA'yı etkilemez
#6 ilac 2 - | 5-ARİ PSA
S: Finasterid kullanan hastada PSA nasıl yorumlanır?
+ 5-ARİ PSA'yı yaklaşık %50 düşürür ; 6 aydan sonra değer iki katı alınarak yorumlanır ; yükselme eğilimi değerlendirilir
- PSA değişmez ; finasterid prostat kanserini tedavi eder
#7 kirmizi 2 - | akut üriner retansiyon
S: BPH'li hastada idrar yapamama ve suprapubik ağrı. Yaklaşım?
+ mesane kateterizasyonu ; tetikleyiciler (antikolinerjik, dekonjestan, kabızlık, alkol) ; alfa bloker başlayıp kateter çıkarma denemesi (TWOC) ; böbrek fonksiyonu, post-obstrüktif diürez izlemi
- diüretik verilir ; kateter takılmadan eve
#8 kirmizi 3 - | makroskopik hematüri
S: 65 yaşında sigara içen hastada ağrısız makroskopik hematüri. Değerlendirme?
+ mesane kanseri dışlanmalı ; sistoskopi ; BT ürografi ; idrar sitolojisi ; antikoagülan kullanımı olsa da değerlendirme yapılır
- İYE, antibiyotik ve takip ; antikoagülan kullanıyorsa tetkik gereksiz
#9 yaygin 2 - | basit sistit kadın
S: Gebe olmayan kadında komplike olmayan sistitte tedavi?
+ fosfomisin tek doz veya nitrofurantoin 5 gün ; yerel dirence göre TMP-SMX ; florokinolon ilk seçenek değil ; kültür tekrarlayan / komplike vakada
- florokinolon 14 gün ilk seçenek ; her vakaya kültür ve görüntüleme
#10 yaygin 2 - | tekrarlayan İYE
S: Yılda 3–4 sistit geçiren premenopozal kadında korunma?
+ davranışsal önlemler, sıvı ; postkoital veya sürekli düşük doz antibiyotik profilaksisi seçenekleri ; postmenopozal kadında vajinal östrojen ; immünoprofilaksi / D-manoz seçilmiş ; görüntüleme seçilmiş vakada
- kızılcık suyu kanıtlanmış kesin tedavi ; tüm vakalara sistoskopi
#11 ilac 2 - | erektil disfonksiyon
S: Erektil disfonksiyonda PDE5 inhibitörü başlarken nelere dikkat edilir?
+ nitrat kullanımı mutlak kontrendikasyon ; kardiyovasküler risk değerlendirmesi (ED KVH belirteci) ; alfa bloker ile hipotansiyon ; uygun kullanım eğitimi ; testosteron düşüklüğü sorgulanır
- nitrat ile birlikte güvenli ; KV değerlendirme gereksiz
#12 kilavuz 2 - | testosteron
S: Hipogonadizm şüphesinde testosteron tedavisine nasıl karar verilir?
+ semptomlar + iki ayrı sabah ölçümünde düşük total testosteron ; LH / FSH, prolaktin ; fertilite isteyen erkekte eksojen testosteron verilmez ; hematokrit ve PSA izlemi
- tek ölçümle tedavi ; fertilite isteyene testosteron
#13 kirmizi 2 - | priapizm
S: 4 saattir süren ağrılı ereksiyon. Yaklaşım?
+ iskemik priapizm ürolojik acil ; korpus kavernozumdan aspirasyon ve kan gazı ; intrakavernöz fenilefrin ; yanıtsızlıkta şant cerrahisi ; neden: ilaçlar, orak hücre
- soğuk uygulama ile eve ; 24 saat bekle
#14 yaygin 2 - | böbrek taşı korunma
S: Kalsiyum oksalat taşı olan hastada metabolik değerlendirme ve korunma?
+ günlük idrar >2–2,5 L sıvı ; normal kalsiyum, düşük sodyum ve hayvansal protein ; tekrarlayan taşta 24 saatlik idrar metabolik analizi ; hipositratüride potasyum sitrat ; tiyazid hiperkalsiüride
- kalsiyum kısıtlaması ; sıvı kısıtlaması
#15 kirmizi 2 - | Fournier
S: Diyabetik hastada perinede hızla yayılan ağrılı kızarıklık, krepitasyon ve sepsis. Ne yaparsın?
+ Fournier gangreni ; acil geniş cerrahi debridman ; geniş spektrumlu IV antibiyotik ; sepsis yönetimi ; tekrarlayan debridman
- oral antibiyotik ; cerrahi bekletilir
#16 yaygin 2 - | varikosel
S: Genç erkekte sol skrotal "solucan torbası" görünümü. Ne zaman tedavi?
+ varikosel ; infertilite + anormal semen, ağrı veya ergende testis büyüme geriliği ; mikrocerrahi varikoselektomi / embolizasyon ; ani gelişen sağ / sol varikoselde retroperitoneal kitle dışlanır
- tüm varikoseller ameliyat edilir ; ani sağ varikosel önemsiz
#17 kirmizi 2 - | testis kitlesi
S: Genç erkekte ağrısız sert testis kitlesi. Yaklaşım?
+ testis tümörü şüphesi ; skrotal USG ; tümör belirteçleri (AFP, β-hCG, LDH) ; radikal inguinal orşiektomi ; transskrotal biyopsi yapılmaz
- antibiyotik ile 2 hafta ; transskrotal biyopsi
#18 kilavuz 2 - | çocuk VUR
S: Ateşli İYE sonrası çocukta vezikoüreteral reflü tanısı konduğunda yaklaşım?
+ derece ve yaşa göre izlem / sürekli antibiyotik profilaksisi (seçilmiş) ; mesane-barsak disfonksiyonu tedavisi ; tekrarlayan ateşli İYE / yüksek derecede endoskopik veya cerrahi tedavi ; DMSA ile skar
- tüm VUR'larda hemen cerrahi ; profilaksi kimseye verilmez
#19 yaygin 2 - | inmemiş testis
S: Testisi skrotumda olmayan 9 aylık bebekte tedavi?
+ 6 aydan sonra kendiliğinden inme beklenmez ; 6–18 ay arasında orşiopeksi ; ele gelmeyen testiste laparoskopi ; rutin USG / hormon tedavisi önerilmez
- ergenliğe kadar beklenir ; tüm vakalara hCG
#20 ilac 3 - | antikolinerjik yaşlı OAB
S: Aşırı aktif mesanesi olan demanslı yaşlı hastada ilaç seçimi?
+ antikolinerjik yük — bilişsel kötüleşme riski ; mirabegron / vibegron tercih ; davranışsal tedavi ; rezidü idrar ve kabızlık izlemi
- oksibutinin ilk seçenek ; bilişsel risk yok
#21 kirmizi 2 - | böbrek travması
S: Künt travma sonrası makroskopik hematüri ve hemodinamik stabil hasta. Değerlendirme?
+ kontrastlı BT (gecikmiş faz) ; çoğu böbrek yaralanması konservatif ; instabilite / genişleyen hematomda cerrahi / embolizasyon ; yatak istirahati ve izlem
- tüm böbrek yaralanmalarında nefrektomi ; görüntüleme gereksiz
#22 kilavuz 2 - | üretra travması
S: Pelvik kırıklı hastada meatusta kan ve idrar yapamama. Ne yapılmamalı?
+ üretra yaralanması şüphesi ; körlemesine üretral kateterizasyon yapılmaz ; retrograd üretrografi ; suprapubik kateter
- zorla Foley takılır ; idrar sonra yapılır
#23 sgk 2 sgk-sut | SUT; ESWL / taş (güncel madde doğrulanacak)
S: ESWL seansları SGK'da hangi çerçevede karşılanır?
+ SUT'ta tanımlı işlem kodları ve seans / süre sınırları ; aynı taş için tekrar seans kuralları ; endikasyonun görüntülemeyle belgelenmesi ; güncel SUT'tan doğrulanmalı
- sınırsız seans ödenir ; görüntüleme gerekmez
#24 tuzak 2 - | prostatit antibiyotik
S: Kronik pelvik ağrı sendromunda (bakteriyel kanıt yok) uzun süreli tekrarlayan florokinolon kürleri önerilir mi?
+ kanıt olmadan tekrarlayan antibiyotik önerilmez ; multimodal yaklaşım (alfa bloker, pelvik taban fizyoterapisi, analjezi, psikososyal) ; florokinolon yan etkileri ; bakteriyel prostatit kültürle ayrılır
- 3 ay kesintisiz kinolon ; tüm pelvik ağrı enfeksiyondur
#25 yaygin 2 - | gece idrara çıkma
S: Yaşlı erkekte noktüri değerlendirmesi?
+ işeme günlüğü (noktürnal poliüri ayrımı) ; BPH, OAB, kalp yetmezliği, OSAS, diyabet ; akşam sıvı / kafein ; ilaçların zamanlaması (diüretik) ; desmopressin yaşlıda hiponatremi riski
- her noktüri BPH'dir, cerrahi ; yaşlıda desmopressin güvenli
#26 kirmizi 2 - | ürosepsis
S: Kateterli yaşlı hastada ateş, hipotansiyon ve konfüzyon. Yaklaşım?
+ ürosepsis / kateter ilişkili İYE ; kültürler, kateterin değiştirilmesi ; erken geniş spektrumlu antibiyotik ; sepsis resüsitasyonu ; obstrüksiyon dışlanması
- kateterden alınan eski torbadan kültür ; antibiyotik 24 saat beklenir
#27 kilavuz 3 dernek-tud | mesane kanseri
S: Kası invaze etmeyen yüksek riskli mesane tümörü TUR sonrası tedavi?
+ yeniden TUR (seçilmiş) ; intravezikal BCG indüksiyon ve idame ; düzenli sistoskopik izlem ; BCG'ye yanıtsızlıkta radikal sistektomi değerlendirmesi
- TUR sonrası izlem gerekmez ; intravezikal tedavi gereksiz
#28 ilac 2 - | alfa bloker katarakt
S: Tamsulosin kullanan hasta katarakt ameliyatı olacak. Ne söylersin?
+ intraoperatif floppy iris sendromu riski ; göz cerrahına bildirilmesi ; ilacın kesilmesi riski ortadan kaldırmaz ; planlı katarakt cerrahisi öncesi yeni alfa bloker başlamadan önce değerlendirme
- etkileşim yoktur ; ameliyattan önce kesince risk kaybolur
#29 yaygin 2 - | idrar kaçırma erkek
S: Radikal prostatektomi sonrası stres inkontinans. Seçenekler?
+ pelvik taban kas eğitimi ; zamanla düzelme (ilk yıl) ; kalıcı ağır vakada artifisiyel üriner sfinkter ; hafif-orta vakada erkek sling
- inkontinans hiç düzelmez, bez tek çözüm ; ilk ay cerrahi
#30 kirmizi 2 - | parafimozis
S: Sünnetsiz erkekte geri çekilen sünnet derisi geri gelmiyor, glans ödemli. Ne yaparsın?
+ parafimozis acil ; ödemin azaltılması (bası, buz) ve manuel redüksiyon ; başarısızlıkta dorsal insizyon ; sonrasında elektif sünnet
- 1 gün beklenir ; antibiyotik tek tedavi
`,
} satisfies BankaKaynagi
