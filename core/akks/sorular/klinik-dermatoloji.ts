import type { BankaKaynagi } from '../banka'

/** AKKS — Dermatoloji Merkezi (Özel Branşlar, klinik-dermatoloji). 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'klinik-dermatoloji',
  onek: 'KDR',
  metin: String.raw`
#1 yaygin 1 dernek-tdd | akne
S: Orta inflamatuvar aknede ilk basamak kombinasyon?
+ topikal retinoid + benzoil peroksit ; gerekirse oral doksisiklin 3 ay ; antibiyotik monoterapisinden kaçınma ; idamede topikal retinoid
- topikal antibiyotik tek başına süresiz ; ilk basamakta izotretinoin herkese
#2 ilac 3 - | izotretinoin
S: İzotretinoin başlarken kadın hastada gebelik önleme?
+ başlamadan önce negatif gebelik testi, tedavi süresince aylık test ; iki etkin kontrasepsiyon yöntemi, tedavi sonrası 1 ay ; TİTCK gebelik önleme programı ; lipid / karaciğer izlemi
- gebelik testi gereksiz ; tetrasiklinle kombinasyon
#3 kirmizi 3 - | melanom
S: Değişen, düzensiz renkli pigmente lezyon. Yaklaşım?
+ melanom şüphesi ; dermoskopi ; tam kat eksizyonel biyopsi ; tüm deri muayenesi ; histopatolojiye göre geniş eksizyon / sentinel
- lazer ile yakma ; shave biyopsi ile kısmi
#4 yaygin 2 dernek-tdd-tum-yonleriyle-psoriasis | TDD Psoriasis (2020)
S: Saçlı deri psoriasisinde tedavi?
+ topikal kortikosteroid (losyon / köpük / şampuan) ; kalsipotriol kombinasyonu ; keratolitik (salisilik asit) ; yaygın / dirençte sistemik
- sistemik steroid ; antifungal şampuan tek tedavi
#5 kirmizi 3 - | SJS
S: Yeni ilaç sonrası ateş, mukozal erozyonlar ve epidermal ayrışma. Ne yaparsın?
+ SJS / TEN ; ilacın hemen kesilmesi ; yanık / yoğun bakım ünitesine sevk ; SCORTEN ; göz ve mukoza bakımı
- antihistaminik ile ayaktan ; ilaca devam
#6 yaygin 2 - | rozasea
S: Papülopüstüler rozaseada tedavi?
+ topikal ivermektin / metronidazol / azelaik asit ; orta-ağırda doksisiklin ; tetikleyiciler, güneş koruma ; topikal steroidden kaçınma
- güçlü topikal steroid ; benzoil peroksit yüksek konsantrasyon
#7 kirmizi 2 - | herpes zoster oftalmikus
S: Burun ucunu da tutan alın zonası. Ne yaparsın?
+ göz tutulum riski (Hutchinson) ; oral antiviral ; acil göz konsültasyonu ; ağrı yönetimi
- topikal asiklovir yeterli ; göz muayenesi gereksiz
#8 yaygin 2 - | atopik dermatit
S: Atopik dermatitte proaktif tedavi nedir?
+ alevlenme kontrol edildikten sonra sık tutulan bölgelere haftada 2 gün topikal steroid / kalsinörin inhibitörü ; alevlenmeleri azaltır ; düzenli emoliyent
- sürekli günlük güçlü steroid ; emoliyent gereksiz
#9 ilac 2 - | topikal steroid
S: Yüz ve katlantılarda topikal steroid seçimi?
+ düşük potent steroid kısa süreli ; kalsinörin inhibitörü alternatif ; atrofi, telenjiektazi, perioral dermatit riski ; parmak ucu ünitesi
- klobetazol yüzde uzun süreli ; potens önemsiz
#10 yaygin 2 - | skabiyez
S: Skabiyezde tedavi?
+ permetrin %5, 1 hafta arayla 2 uygulama ; tüm ev halkı aynı anda ; çamaşırların yıkanması ; dirençli / kabuklu skabiyezde ivermektin
- yalnız hasta tedavi edilir ; steroid krem
#11 kirmizi 2 - | büllöz pemfigoid
S: Yaşlı hastada gergin büller ve kaşıntı. Tanı ve tedavi?
+ büllöz pemfigoid ; biyopsi + DİF ; güçlü topikal steroid ; DPP-4 inhibitörü sorgulama ; doksisiklin / sistemik steroid seçilmiş
- herpes ; biyopsi gereksiz
#12 kilavuz 2 - | biyolojik tarama
S: Psoriasiste biyolojik öncesi tarama?
+ latent TB (IGRA / PPD, grafi) ; HBV, HCV, HIV ; aşı durumu, canlı aşılardan kaçınma ; malignite / enfeksiyon öyküsü
- tarama gereksiz ; canlı aşı serbest
#13 sgk 2 sgk-sut | SUT biyolojik dermatoloji (güncel madde doğrulanacak)
S: Psoriasiste biyolojik için SGK raporunun genel koşulları?
+ PASI / VYA / DLQI eşikleri ; konvansiyonel sistemik / fototerapi yanıtsızlığı ; dermatoloji uzmanlı sağlık kurulu raporu ; yanıt değerlendirmesi ; güncel SUT'tan doğrulanmalı
- ilk basamak ödenir ; rapor gerekmez
#14 yaygin 2 - | vitiligo
S: Vitiligoda tedavi seçenekleri?
+ topikal steroid / kalsinörin inhibitörü ; topikal ruksolitinib (ruhsat durumuna göre) ; dar bant UVB ; tiroid taraması ; psikososyal destek
- tedavisi yok ; bulaşıcı
#15 tuzak 2 - | üçlü krem
S: Tanısı belirsiz döküntüye steroid-antifungal-antibiyotik kombine krem önerilir mi?
+ tanı olmadan önerilmez ; tinea inkognito ve sensitizasyon ; KOH ile tanı ; tek etkin madde
- üçlü krem her döküntüde güvenli ; tanı gereksiz
#16 kirmizi 2 - | meningokoksemi
S: Ateşli hastada basmakla solmayan peteşi ve purpura. Ne yaparsın?
+ meningokoksemi acil ; IV seftriakson beklemeden ; sepsis yönetimi ; temaslı profilaksisi
- viral döküntü ; antibiyotik biyopsi sonrası
#17 yaygin 2 - | onikomikoz
S: Ayak onikomikozunda tedavi?
+ KOH / kültür ile doğrulama ; oral terbinafin 12 hafta ; karaciğer fonksiyonu ve etkileşim ; hafif distalde topikal
- doğrulamasız uzun tedavi ; flukonazol 1 hafta
#18 kirmizi 2 - | DRESS
S: İlaç başlandıktan haftalar sonra döküntü, ateş, eozinofili ve karaciğer tutulumu. Ne yaparsın?
+ DRESS ; ilacın kesilmesi ; organ tutulumu değerlendirmesi ; sistemik steroid uzun azaltma ; izlem (tiroid, otoimmün)
- antihistaminik ile ayaktan ; ilaca devam
#19 ilac 2 - | metotreksat dozlama
S: Psoriasiste metotreksat kullanımında en kritik hasta güvenliği uyarısı?
+ haftada bir doz (günlük değil) ; folik asit ; laboratuvar izlemi ; TMP-SMX ve NSAİİ etkileşimi ; gebelikte kontrendike
- metotreksat günlük alınır ; TMP-SMX güvenli
#20 yaygin 2 - | alopesi areata
S: Sınırlı alopesi areatada tedavi?
+ intralezyonel steroid ; topikal güçlü steroid ; ağırda JAK inhibitörleri ; spontan iyileşme sık ; otoimmün eşlik
- kalıcı kayıp ; antifungal
#21 kirmizi 2 - | BHK yüksek risk
S: Burun kanadında BHK. Tedavi?
+ yüksek riskli bölge ; Mohs cerrahisi tercih ; standart eksizyon alternatif ; biyopsi ile doğrulama
- kriyoterapi ilk tercih ; biyopsi gereksiz
#22 yaygin 2 - | kronik ürtiker
S: Kronik spontan ürtikerde basamak tedavi?
+ ikinci kuşak antihistaminik ; 4 katına kadar doz ; omalizumab ; siklosporin ; NSAİİ kaçınma
- sürekli sistemik steroid ; geniş tarama herkese
#23 ilac 3 - | JAK inhibitör
S: Dermatolojide JAK inhibitörü başlarken güvenlik değerlendirmesi?
+ KV risk, malignite, VTE öyküsü (özellikle 65 yaş üstü, sigara) ; TB / hepatit taraması ; lipid / hemogram izlemi ; zona riski ve aşılama ; gebelik
- tarama gereksiz ; ilk basamak herkese
#24 tuzak 2 - | steroid bağımlılığı yüz
S: Yüzüne aylarca güçlü steroid süren hastada kesince alevlenme. Ne söylersin?
+ steroid kaynaklı rozasea / perioral dermatit ; steroidin kesilmesi (gerekirse azaltarak) ; topikal metronidazol / kalsinörin inhibitörü, oral tetrasiklin
- potens artır ; steroid sürsün
#25 yaygin 2 - | kutanöz leishmaniasis
S: Endemik bölgeden gelen hastada iyileşmeyen ülsere nodül. Yaklaşım?
+ kutanöz leishmaniasis ; yayma / biyopsi ; intralezyonel antimon / kriyoterapi ; bildirim zorunlu
- bakteriyel, uzun antibiyotik ; bildirim gereksiz
#26 kirmizi 2 - | eczema herpeticum
S: Atopik dermatitli çocukta ani delikli erozyonlar ve ateş. Ne yaparsın?
+ eczema herpeticum ; acil sistemik asiklovir ; göz tutulumu değerlendirmesi ; sekonder enfeksiyon
- steroid artır ; antiviral gereksiz
#27 yaygin 2 - | hidradenitis
S: Hidradenitis süpürativada tedavi?
+ Hurley evreleme ; kilo / sigara ; topikal klindamisin, oral tetrasiklin, klindamisin + rifampisin ; adalimumab / sekukinumab ; cerrahi
- tek seferlik drenaj kalıcı ; tedavisi yok
#28 ilac 2 - | antifungal oral etkileşim
S: Oral itrakonazol başlarken etkileşimler?
+ güçlü CYP3A4 inhibitörü: statinler (simvastatin), bazı antiaritmikler, benzodiazepinler ; kalp yetmezliğinde dikkat ; karaciğer izlemi ; asit baskılayıcılar emilimi azaltır
- etkileşim yok ; KY'de güvenli
#29 kilavuz 2 - | fototerapi
S: Dar bant UVB fototerapi endikasyon ve riskler?
+ psoriasis, atopik dermatit, vitiligo, MF ; haftada 2–3 seans ; yanık, fotoyaşlanma, deri kanseri riski ; fotosensitizan ilaç sorgulama
- risksiz ; solaryum eşdeğer
#30 kirmizi 2 - | nekrotizan fasiit
S: Hızla yayılan, orantısız ağrılı selülit ve toksisite. Ne yaparsın?
+ nekrotizan fasiit ; acil cerrahi debridman ; geniş spektrumlu antibiyotik + klindamisin ; görüntüleme cerrahiyi geciktirmemeli
- oral antibiyotik ; MR beklenir
`,
} satisfies BankaKaynagi
