import type { BankaKaynagi } from '../banka'

/** AKKS — Genel Cerrahi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'genel-cerrahi',
  onek: 'GCR',
  metin: String.raw`
#1 yaygin 2 - | akut apandisit
S: Göbek çevresinden sağ alt kadrana göç eden ağrı, ateş ve lökositoz. Değerlendirme ve tedavi?
+ Alvarado / AIR skoru ; USG (çocuk / gebe / genç kadın), BT erişkinde ; laparoskopik apendektomi standart ; seçilmiş komplike olmayan vakada antibiyotik tedavisi seçeneği ; perforasyon / abse yönetimi
- tanı için mutlaka BT, tüm gebelerde ; analjezi tanıyı maskeler, verilmez
#2 tuzak 2 - | analjezi akut karın
S: Akut karın ağrılı hastaya cerrahi değerlendirmeden önce analjezik vermek tanıyı maskeler mi?
+ erken analjezi (opioid dahil) tanısal doğruluğu bozmaz ; hasta konforu için önerilir ; muayene bulguları korunur
- cerrah görene kadar analjezi verilmemeli ; opioid peritonit bulgularını yok eder
#3 kirmizi 3 - | perforasyon
S: Ani şiddetli epigastrik ağrı, tahta karın ve diyafram altında serbest hava. Yaklaşım?
+ peptik ülser perforasyonu ; sıvı resüsitasyonu, NG dekompresyon, IV antibiyotik, PPI ; acil cerrahi (onarım / omentopeksi) ; sepsis izlemi
- konservatif PPI ile ayaktan izlem ; oral beslenmeye devam
#4 kirmizi 3 - | mekanik ince barsak tıkanıklığı
S: Geçirilmiş batın operasyonu olan hastada kusma, distansiyon ve gaz-gaita çıkaramama. Yaklaşım?
+ adezyon kaynaklı ince barsak obstrüksiyonu ; sıvı-elektrolit, NG dekompresyon ; BT ile strangülasyon / iskemi bulguları ; iskemi / peritonit varsa acil cerrahi ; suda çözünür kontrast ile tanı-tedavi
- laksatif verilir ; strangülasyon bulgusunda da 1 hafta konservatif
#5 kirmizi 3 - | akut mezenter iskemi
S: Fizik muayene bulgusuyla orantısız şiddetli karın ağrısı olan AF'li yaşlı hasta. Ne düşünürsün?
+ akut mezenter iskemi ; acil BT anjiyografi ; antikoagülasyon (heparin) ; acil revaskülarizasyon / nekrotik barsak rezeksiyonu ; laktat normal olsa da dışlanmaz
- gastrit, PPI ile eve ; laktat normalse iskemi dışlanır
#6 yaygin 2 - | akut kolesistit
S: Sağ üst kadran ağrısı, Murphy pozitif, ateş, USG'de duvar kalınlaşması ve taş. Tedavi?
+ akut taşlı kolesistit (Tokyo kriterleri) ; antibiyotik, sıvı, analjezi ; erken laparoskopik kolesistektomi (ideal 72 saat, uygun hastada 7 gün içinde) ; yüksek riskli hastada perkütan kolesistostomi
- 6 hafta sonra rutin ameliyat zorunlu ; antibiyotik gereksiz
#7 kirmizi 2 - | kolanjit
S: Ateş, sarılık ve sağ üst kadran ağrısı (Charcot triadı). Yaklaşım?
+ akut kolanjit ; antibiyotik, sıvı ; ERCP ile biliyer drenaj (şiddete göre acil / erken) ; sepsis yönetimi
- yalnız oral antibiyotik ; drenaj gereksiz
#8 yaygin 2 - | akut pankreatit
S: Akut pankreatitin ilk 48 saat yönetimi?
+ şiddet değerlendirmesi (revize Atlanta, BISAP) ; hedefe yönelik ılımlı sıvı (aşırı agresif sıvıdan kaçınma) ; erken oral / enteral beslenme ; rutin profilaktik antibiyotik önerilmez ; biliyer nedende kolanjit varsa ERCP
- rutin profilaktik karbapenem ; günlerce aç bırakma
#9 kilavuz 2 sb-guvenli-cerrahi-kontrol-listesi | SB Güvenli Cerrahi Kontrol Listesi
S: Güvenli Cerrahi Kontrol Listesi hangi aşamaları içerir?
+ anestezi öncesi (giriş) ; cilt insizyonu öncesi (zaman aşımı / mola) ; hasta ameliyathaneden çıkmadan önce (çıkış) ; hasta kimliği, taraf, işlem, alerji, antibiyotik profilaksisi, malzeme sayımı
- kontrol listesi yalnız büyük ameliyatlarda ; taraf işaretlemesi gereksiz
#10 ilac 2 - | cerrahi profilaksi
S: Temiz-kontamine elektif kolesistektomide antibiyotik profilaksisi?
+ insizyondan önce 60 dk içinde tek doz (sefazolin) ; uzun operasyonda tekrar doz ; 24 saati aşan profilaksi önerilmez ; düşük riskli laparoskopik kolesistektomide rutin profilaksi gerekmeyebilir
- postoperatif 7 gün antibiyotik ; profilaksi insizyondan sonra
#11 yaygin 2 - | inguinal herni
S: Asemptomatik / minimal semptomatik inguinal hernide erkekte yaklaşım?
+ minimal semptomatik erkekte dikkatli bekleme seçeneği ; semptomatikte meş ile onarım (açık Lichtenstein veya laparoskopik) ; kadında femoral herni riski nedeniyle onarım ; boğulma bulguları konusunda bilgilendirme
- tüm hernilere meşsiz primer onarım ; boğulmuş herni elle zorla redükte edilir
#12 kirmizi 3 - | boğulmuş herni
S: Bilinen kasık fıtığı sertleşti, ağrılı ve kızarık, kusma var. Ne yaparsın?
+ boğulmuş (strangüle) herni ; acil cerrahi ; redüksiyon denenmez (iskemik barsak) ; sıvı, NG, antibiyotik ; barsak canlılığı değerlendirmesi
- elle zorla redükte edilip eve ; elektif listeye alınır
#13 kilavuz 3 sb-kp-kolorektal-kanser | SB Kolorektal Kanser KP
S: Türkiye'de kolorektal kanser taraması nasıl yapılır?
+ 50–70 yaş arası ; 2 yılda bir gaitada gizli kan (FIT) ; pozitifse kolonoskopi ; ailesel risklerde daha erken ve kolonoskopi ile ; 10 yılda bir kolonoskopi alternatif
- tarama 70 yaşından sonra başlar ; pozitif FIT'te tekrar FIT yeterli
#14 kirmizi 2 - | alt GİS kanama
S: Hemodinamik stabil, masif olmayan rektal kanaması olan yaşlı hastada değerlendirme?
+ resüsitasyon ve risk skorlaması ; üst GİS kaynağı dışlama (hematokezya + instabilite) ; kolonoskopi (hazırlık sonrası 24 saat içinde) ; aktif kanamada BT anjiyografi / embolizasyon
- tüm hastalara acil kolektomi ; kolonoskopi gereksiz
#15 kirmizi 3 - | travma ATLS
S: Trafik kazası sonrası gelen hipotansif hastada ilk değerlendirme?
+ ATLS: ABCDE, havayolu ve servikal koruma ; kanama kontrolü, iki geniş damar yolu, kan ürünleri (masif transfüzyon protokolü) ; eFAST ; hemodinamik instabil ve pozitif FAST'ta acil laparotomi ; traneksamik asit ilk 3 saatte
- instabil hastada BT için radyolojiye gönderme ; büyük hacim kristaloid ile hedef normal KB
#16 yaygin 2 - | perianal abse
S: Perianal ağrılı fluktuan şişlik. Tedavi?
+ perianal abse ; insizyon ve drenaj (antibiyotik tek başına yetersiz) ; immünsüpresyon / diyabet / selülitte antibiyotik ; fistül gelişimi açısından izlem ; nekrotizan enfeksiyon bulguları
- yalnız antibiyotik ; fluktuasyon beklenmeden antibiyotikle evde izlem
#17 yaygin 2 - | hemoroid
S: Grade 2 iç hemoroidi olan hastada tedavi?
+ lif ve sıvı, defekasyon alışkanlığı ; topikal tedaviler semptomatik ; band ligasyonu (grade 1–3) ; cerrahi (hemoroidektomi) ileri grade / dirençte ; rektal kanamada yaşa göre kolonoskopi
- tüm hemoroidlere hemoroidektomi ; 50 yaş üstü kanamada kolonoskopi gereksiz
#18 kirmizi 2 - | divertikülit
S: Sol alt kadran ağrısı, ateş; BT'de komplike olmayan divertikülit. Tedavi?
+ immünkompetan ve sistemik bulgusu olmayan komplike olmayan divertikülitte seçilmiş hastada antibiyotiksiz izlem ; aksi halde antibiyotik ; abse (>3–4 cm) perkütan drenaj ; perforasyon / peritonitte cerrahi ; iyileşme sonrası kolonoskopi (seçilmiş)
- her divertikülitte acil kolektomi ; tüm vakalarda IV antibiyotik zorunlu
#19 kilavuz 3 sb-rehber-meme-kanseri | SB Meme Kanseri Klinik Rehberi (Revizyon 2024)
S: Mamografide BI-RADS 4 lezyonu olan hastada sonraki adım?
+ görüntüleme eşliğinde kor iğne biyopsisi ; histopatoloji ve immünohistokimya (ER/PR/HER2/Ki-67) ; multidisipliner konsey ; BI-RADS 3'te kısa aralıklı izlem
- 1 yıl sonra mamografi ; doğrudan mastektomi
#20 kilavuz 3 sb-kp-mide-kanseri | SB Mide Kanseri KP
S: Mide kanseri tanısı konan hastada evreleme ve tedavi planı?
+ BT (toraks-batın-pelvis), EUS (seçilmiş), tanısal laparoskopi (lokal ileri) ; perioperatif kemoterapi (FLOT) lokal ileri hastalıkta ; gastrektomi + D2 lenf nodu diseksiyonu ; multidisipliner konsey
- evreleme yapmadan doğrudan cerrahi ; D2 diseksiyon gereksiz
#21 ilac 2 - | tromboprofilaksi cerrahi
S: Majör abdominal kanser cerrahisi sonrası VTE profilaksisi?
+ Caprini ile risk değerlendirmesi ; LMWH ve mekanik profilaksi ; majör kanser cerrahisinde uzatılmış profilaksi (yaklaşık 4 hafta) ; kanama riskine göre zamanlama ; erken mobilizasyon
- profilaksi taburculukta biter ; aspirin LMWH ile eşdeğer
#22 kirmizi 2 - | anastomoz kaçağı
S: Kolorektal rezeksiyon sonrası 5. günde ateş, taşikardi, karın ağrısı. Ne düşünürsün?
+ anastomoz kaçağı ; BT (kontrastlı) ; sepsis yönetimi, antibiyotik ; abse drenajı veya relaparotomi / stoma ; erken tanı mortaliteyi azaltır
- atelektazi, spirometri yeterli ; oral beslenmeye devam
#23 kilavuz 2 - | ERAS
S: Kolorektal cerrahide ERAS protokolünün temel bileşenleri?
+ preoperatif bilgilendirme, uzun açlıktan kaçınma, karbonhidrat yükleme ; minimal invaziv cerrahi, opioid koruyucu multimodal analjezi ; erken oral beslenme ve mobilizasyon ; rutin NG / dren kullanmama ; normotermi ve dengeli sıvı
- 12 saat aç bırakma ve rutin NG tüp ; postop 5 gün yatak istirahati
#24 tuzak 2 - | gece yarısından sonra aç
S: Elektif cerrahide hastayı gece yarısından itibaren tamamen aç-susuz bırakmak gerekli mi?
+ katı gıda için yaklaşık 6 saat, berrak sıvı için 2 saat açlık yeterli ; uzun açlık dehidratasyon ve insülin direnci ; karbonhidrat içecekleri ERAS'ta ; aspirasyon riski yüksek hastada bireysel
- tüm hastalar 12 saat su dahil aç kalmalı ; berrak sıvı 2 saat önce aspirasyona yol açar
#25 yaygin 2 - | pilonidal sinüs
S: Sakrokoksigeal bölgede tekrarlayan akıntılı pilonidal sinüs. Tedavi?
+ akut abse: insizyon-drenaj ; kronikte cerrahi (flep teknikleri / orta hat dışı kapama nüksü azaltır) ; minimal invaziv seçenekler ; kıl temizliği
- yalnız antibiyotik kalıcı tedavi ; orta hatta primer kapama en düşük nüks
#26 kirmizi 3 - | yanık
S: Vücudunun %30'unda ikinci-üçüncü derece yanık olan 70 kg erişkin. İlk sıvı tedavisi?
+ Parkland: 4 ml x kg x %TVYA Ringer laktat 24 saatte (yarısı ilk 8 saatte) ; 70 kg için 8400 ml ; idrar çıkışına göre titrasyon (0,5 ml/kg/saat) ; inhalasyon yanığı ve havayolu ; yanık merkezine sevk
- yanığa diş macunu / buz ; yanıkta sıvı kısıtlaması
#27 sgk 2 sgk-sut | SUT; obezite cerrahisi (güncel madde doğrulanacak)
S: Obezite cerrahisinin SGK tarafından karşılanmasında genel koşullar nelerdir?
+ VKİ eşikleri (ör. ≥40 veya komorbiditeyle ≥35) ve yaş sınırları ; sağlık kurulu raporu (ilgili uzmanlar) ; medikal tedavi denemesi ; yetkili merkez ; güncel SUT ve SB protokolünden doğrulanmalı
- VKİ 28 olan herkese ödenir ; rapor gerekmez
#28 kilavuz 3 sb-kp-obezite-metabolik-cerrahi-2026 | SB Obezite ve Metabolik Cerrahi KP 2026
S: Metabolik cerrahi sonrası uzun dönem izlemde neler yapılır?
+ ömür boyu vitamin-mineral desteği (B12, demir, kalsiyum / D, multivitamin) ; laboratuvar izlemi (anemi, kemik) ; beslenme ve psikolojik destek ; gebelik planlaması (ilk 12–18 ay ertelenmesi) ; komplikasyonlar (darlık, ülser, dumping)
- vitamin desteği 3 ay yeterli ; ameliyat sonrası hemen gebelik önerilir
#29 kirmizi 2 - | tiroidektomi sonrası hematom
S: Tiroidektomi sonrası saatler içinde boyunda hızla artan şişlik ve solunum sıkıntısı. Ne yaparsın?
+ boyun hematomu, havayolu tehdidi ; yatak başında yara açılıp hematom boşaltılması ; ardından ameliyathanede kanama kontrolü ; havayolu desteği
- BT çekip beklenir ; buz uygulanır
#30 yaygin 2 - | safra taşı asemptomatik
S: Tesadüfen saptanan asemptomatik safra kesesi taşında kolesistektomi gerekir mi?
+ asemptomatik taşlarda rutin profilaktik kolesistektomi önerilmez ; istisnalar: porselen kese, büyük taş (>3 cm), kese polipi ≥10 mm, seçilmiş yüksek risk ; semptomlar konusunda bilgilendirme
- tüm taşlar hemen ameliyat edilir ; ursodeoksikolik asit tüm taşları eritir
`,
} satisfies BankaKaynagi
