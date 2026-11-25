import type { BankaKaynagi } from '../banka'

/** AKKS — Beyin ve Sinir Cerrahisi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'beyin-cerrahisi',
  onek: 'BCR',
  metin: String.raw`
#1 kirmizi 3 - | epidural hematom
S: Kafa travması sonrası lusid aralık, ardından bilinç kötüleşmesi ve anizokori. Yaklaşım?
+ epidural hematom ; acil BT ; acil cerrahi boşaltma ; havayolu ve ICP önlemleri ; zaman kritik
- ertesi gün kontrol BT ; lomber ponksiyon
#2 kilavuz 2 - | GKS
S: Glasgow Koma Skalası bileşenleri ve ağır kafa travması tanımı?
+ göz açma (1–4), sözel yanıt (1–5), motor yanıt (1–6) ; GKS ≤8 ağır kafa travması, havayolu koruması (entübasyon) ; pupilla muayenesi ile birlikte ; seri değerlendirme
- GKS ≤13 her zaman entübasyon ; motor yanıt skorlanmaz
#3 kirmizi 3 - | ICP artışı
S: Ağır kafa travmalı hastada kafa içi basınç artışı bulguları. İlk önlemler?
+ başı 30° yükseltme, boyun nötral ; normokapni (hedef PaCO2 35–40), oksijenasyon ; hiperozmolar tedavi (mannitol / hipertonik salin) ; sedasyon-analjezi, normotermi ; cerrahi dekompresyon değerlendirmesi
- uzun süreli derin hiperventilasyon ; hipotonik sıvı
#4 kirmizi 3 - | SAK anevrizma
S: Anevrizmal SAK tanılı hastada ilk yönetim?
+ anevrizmanın erken güvenceye alınması (endovasküler koil veya klipleme) ; nimodipin (vazospazm) ; KB kontrolü (güvenceye alınana kadar) ; hidrosefali (EVD), hiponatremi, nöbet izlemi ; gecikmiş serebral iskemi izlemi
- tedavi 2 hafta ertelenir ; nimodipin gereksiz
#5 kirmizi 2 - | antikoagülan kafa travması
S: Warfarin kullanan yaşlı hastada hafif kafa travması, GKS 15. Yaklaşım?
+ antikoagülanlı hastada düşük eşikle BT ; INR ; kanama varsa hızlı geri döndürme (PCC + K vitamini) ; gözlem
- GKS 15 ise BT gereksiz ; TDP ilk seçenek tek başına
#6 kilavuz 2 - | kronik subdural hematom
S: Yaşlı hastada haftalar içinde gelişen konfüzyon ve hemiparezi; BT'de kronik subdural hematom. Tedavi?
+ semptomatik hematomda burr-hole drenaj ; antitrombotik ilaçların yönetimi ; tekrar riski, subdural dren ; seçilmiş vakada orta meningeal arter embolizasyonu
- demans, izlem ; asemptomatik küçük hematomda acil kraniotomi
#7 kirmizi 3 - | kauda ekuina
S: Bel fıtığı olan hastada üriner retansiyon ve perianal uyuşma. Ne yaparsın?
+ kauda ekuina sendromu ; acil MR ; acil cerrahi dekompresyon (48 saat içinde, mümkün olan en erken) ; mesane taraması
- fizik tedavi ; MR rutin randevu
#8 yaygin 2 - | lomber disk hernisi
S: Lomber disk hernisine bağlı radikülopatide cerrahi endikasyon?
+ ilk 6 hafta konservatif (çoğu düzelir) ; ilerleyici motor defisit, kauda ekuina → acil cerrahi ; 6–12 haftada yanıtsız şiddetli ağrı → elektif mikrodiskektomi ; MR-klinik uyumu
- tüm disk hernilerine hemen cerrahi ; MR'da herni görülmesi tek başına cerrahi endikasyonu
#9 kirmizi 2 - | servikal miyelopati
S: El becerisinde azalma, yürüme bozukluğu ve hiperrefleksi olan yaşlı hasta. Ne düşünürsün?
+ dejeneratif servikal miyelopati ; servikal MR ; orta-ağır / ilerleyici miyelopatide cerrahi dekompresyon ; travmadan kaçınma
- karpal tünel, el cerrahisi ; manipülasyon tedavisi
#10 kilavuz 3 sb-kp-epilepsi | SB Epilepsi KP 2021, epilepsi cerrahisi
S: Dirençli epilepsi tanımı ve cerrahi değerlendirme?
+ iki uygun ve tolere edilen antiepileptiğe rağmen nöbet devamı ; epilepsi merkezine sevk ; video-EEG, MR, nöropsikoloji ; mezial temporal skleroz cerrahisinde yüksek nöbetsizlik
- dirençli epilepsi için 10 ilaç denenmeli ; cerrahi her zaman son yıllarda
#11 kirmizi 3 - | beyin tümörü ödem
S: Beyin tümörüne bağlı ödem ve baş ağrısı olan hastada ilk tedavi?
+ deksametazon ; nöbet varsa antiepileptik (profilaksi rutin değil) ; MR ve histolojik tanı ; cerrahi / multidisipliner ; lenfoma şüphesinde biyopsi öncesi steroidden mümkünse kaçınma
- tüm hastalara profilaktik antiepileptik ; lenfoma şüphesinde steroid hemen
#12 kirmizi 2 - | şant disfonksiyonu
S: VP şantlı çocukta baş ağrısı, kusma ve uykuya meyil. Ne düşünürsün?
+ şant disfonksiyonu / enfeksiyonu ; BT / hızlı MR, şant serisi ; acil beyin cerrahisi ; enfeksiyonda şant sıvısı örneği
- viral gastroenterit ; ayaktan izlem
#13 yaygin 2 - | normal basınçlı hidrosefali
S: Yürüme bozukluğu, idrar kaçırma ve bilişsel bozulma olan yaşlıda değerlendirme?
+ normal basınçlı hidrosefali ; görüntüleme (ventrikülomegali) ; tap testi / lomber drenaj ile yanıt ; VP şant ; Parkinson / demans ayırıcı tanısı
- yaşlılık, tedavi edilemez ; tüm hastalara şant testsiz
#14 kirmizi 2 - | spinal kord yaralanması
S: Travma sonrası spinal kord yaralanması şüphesinde ilk yaklaşım?
+ omurga immobilizasyonu ; hemodinamik destek (OAB ≥85 ilk günler önerilir) ; MR ; erken dekompresyon (24 saat içinde) ; rutin yüksek doz metilprednizolon önerilmez
- rutin NASCIS metilprednizolon ; hipotansiyon önemsiz
#15 tuzak 2 - | steroid spinal travma
S: Akut spinal kord yaralanmasında yüksek doz metilprednizolon standart tedavi midir?
+ rutin kullanımı tartışmalı / çoğu kılavuz önermez ; enfeksiyon ve GİS kanama riski ; erken dekompresyon ve hemodinamik destek önceliklidir
- tüm hastalara 24 saat yüksek doz ; kanıtı kesin
#16 kirmizi 2 - | intraserebral kanama
S: Spontan intraserebral kanamada ilk yönetim?
+ KB düşürme (SKB yaklaşık 140 hedefi, aşırı düşüşten kaçınma) ; antikoagülan geri döndürme ; serebellar hematom / hidrosefalide cerrahi ; nöroyoğun bakım
- tromboliz ; antikoagülan sürdürülür
#17 kilavuz 2 - | kafa travması BT
S: Hafif kafa travmasında BT endikasyonu (erişkin)?
+ Kanada BT kafa kuralları ; GKS <15, açık / depresyon kırığı şüphesi, kafa tabanı kırığı bulguları ; kusma ≥2, yaş ≥65 ; antikoagülan kullanımı
- tüm kafa travmalarına BT ; antikoagülan önemsiz
#18 yaygin 2 - | trigeminal nevralji cerrahi
S: İlaca dirençli trigeminal nevraljide cerrahi seçenekler?
+ mikrovasküler dekompresyon (vasküler kompresyon, genç / uygun hasta) ; perkütan girişimler (radyofrekans, balon) ; stereotaktik radyocerrahi ; MR ile sekonder neden dışlanması
- cerrahi seçenek yok ; MR gereksiz
#19 kirmizi 2 - | spinal epidural abse
S: Diyabetik hastada ateş, şiddetli sırt ağrısı ve yeni bacak güçsüzlüğü. Ne düşünürsün?
+ spinal epidural abse ; acil kontrastlı MR ; acil cerrahi dekompresyon ve drenaj ; IV antibiyotik (S. aureus) ; kan kültürü
- mekanik bel ağrısı, NSAİİ ; MR randevuyla
#20 ilac 2 - | antiepileptik profilaksi travma
S: Ağır kafa travmasında antiepileptik profilaksisi?
+ erken (ilk 7 gün) posttravmatik nöbetleri azaltmak için kısa süreli profilaksi (levetirasetam / fenitoin) ; 7 günden uzun profilaksi geç nöbeti önlemez ; nöbet olursa tedavi
- ömür boyu profilaksi ; profilaksi geç epilepsiyi önler
#21 kilavuz 3 sb-kp-beyin-olumu-2025 | SB Beyin Ölümü KP 2025
S: Beyin ölümü tanısında apne testi nasıl yapılır?
+ ön koşullar (normotermi, normotansiyon, normokapni, preoksijenasyon) ; ventilatörden ayırma, oksijen desteği ; PaCO2 ≥60 mmHg veya bazalin 20 mmHg üzeri iken solunum yokluğu ; instabilitede test durdurulur, destekleyici test
- ön koşul gerekmez ; PaCO2 40'ta değerlendirilir
#22 kirmizi 2 - | kafa tabanı kırığı
S: Kafa travması sonrası rakun gözü, Battle bulgusu ve burundan berrak akıntı. Ne yapılmamalı?
+ kafa tabanı kırığı ; nazogastrik sonda ve nazal entübasyondan kaçınma ; BOS kaçağı izlemi (menenjit) ; BT
- burun tamponlanır ; NG sonda takılır
#23 sgk 2 sgk-sut | SUT nöroşirürji (güncel madde doğrulanacak)
S: Spinal enstrümantasyon malzemelerinin SGK tarafından karşılanmasında genel ilke?
+ SUT'ta tanımlı malzeme listesi ve endikasyonlar ; uzman hekim raporu / malzeme gerekçesi ; fark ücreti sınırları ; güncel SUT'tan doğrulanmalı
- tüm implantlar endikasyondan bağımsız ödenir ; rapor gerekmez
#24 yaygin 2 - | lomber spinal stenoz
S: Nörojenik kladikasyosu olan hastada tedavi?
+ konservatif: egzersiz (fleksiyon temelli), analjezi ; epidural steroid seçilmiş ; dirençli / ilerleyici semptomlarda dekompresif cerrahi ; vasküler kladikasyon ayırıcı tanısı
- ilk tedavi füzyon cerrahisi ; vasküler değerlendirme gereksiz
#25 kirmizi 3 - | herniasyon
S: Kafa travmalı hastada Cushing triadı (hipertansiyon, bradikardi, düzensiz solunum). Ne yaparsın?
+ beyin herniasyonu ; acil ICP düşürücü önlemler (hiperozmolar, kısa süreli hiperventilasyon köprü) ; acil cerrahi ; havayolu
- hipertansiyonu agresif düşürme tek tedavi ; ayaktan izlem
#26 tuzak 2 - | bel ağrısı füzyon
S: Kronik nonspesifik bel ağrısında lomber füzyon cerrahisi iyi bir seçenek midir?
+ nonspesifik kronik bel ağrısında füzyonun yoğun rehabilitasyona üstünlüğü sınırlı ; komplikasyon ve komşu segment hastalığı ; seçilmiş endikasyonlar (instabilite, spondilolistezis) dışında önerilmez
- tüm kronik bel ağrılarına füzyon ; MR'daki dejenerasyon füzyon endikasyonu
#27 kilavuz 2 - | çocuk kafa travması
S: Çocukta hafif kafa travmasında BT kararı?
+ PECARN kuralları ; radyasyon riski ; düşük riskte gözlem ; istismar şüphesi
- tüm çocuklara BT ; istismar sorgulanmaz
#28 kirmizi 2 - | myelopati tümör
S: Kanser hastasında yeni gelişen idrar retansiyonu ve bacaklarda güçsüzlük. Ne yaparsın?
+ metastatik spinal kord basısı ; acil tüm omurga MR ; deksametazon ; cerrahi / radyoterapi
- sistit, antibiyotik ; MR haftalar sonra
#29 yaygin 2 - | baş ağrısı tümör kırmızı bayrak
S: Baş ağrısında hangi kırmızı bayraklar görüntüleme gerektirir?
+ yeni başlangıçlı 50 yaş üstü ; nörolojik bulgu, papilödem ; sabah kusmalı / uykudan uyandıran ; ani gök gürültüsü ; kanser / immünsüpresyon öyküsü
- tüm baş ağrılarına MR ; kırmızı bayrak yoktur
#30 ilac 2 - | nimodipin
S: Anevrizmal SAK'ta nimodipin kullanımı?
+ oral nimodipin 60 mg 4 saatte bir, 21 gün ; nörolojik sonucu iyileştirir ; hipotansiyonda doz bölünmesi ; IV yerine oral tercih
- yalnız vazospazm geliştiğinde ; IV bolus rutin
`,
} satisfies BankaKaynagi
