import type { BankaKaynagi } from '../banka'

/** AKKS — Medikal Estetik (Özel Branşlar). 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'medikal-estetik',
  onek: 'MES',
  metin: String.raw`
#1 kirmizi 3 titck-kub | hyaluronik asit dolgu vasküler oklüzyon
S: Glabellaya hyaluronik asit dolgu sırasında ciltte beyazlama ve ardından livedo görünümü. Ne yaparsın?
+ vasküler oklüzyon ; enjeksiyonun durdurulması ; yüksek doz hiyalüronidaz tekrarlayan uygulama ; masaj, ılık kompres ; görme bozukluğu varsa acil göz / inme değerlendirmesi
- izle ve bekle ; soğuk uygulama
#2 kirmizi 3 - | dolgu körlük
S: Burun dolgusu sonrası ani görme kaybı ve göz ağrısı. Ne yaparsın?
+ retinal arter embolisi — acil ; hemen göz hastalıkları / inme merkezi ; hiyalüronidaz (HA dolguda) ; zaman kritik ; önleme: yüksek riskli bölgelerde kanül, aspirasyon sınırlı güvence, düşük basınç
- ertesi gün kontrol ; yalnız masaj
#3 ilac 2 titck-kub | botulinum toksin
S: Botulinum toksini uygulamasında kontrendikasyonlar?
+ gebelik ve emzirme ; nöromüsküler hastalık (myastenia, Lambert-Eaton) ; enjeksiyon bölgesinde enfeksiyon ; aminoglikozid etkileşimi ; ürüne bilinen alerji
- gebelikte güvenli ; myastenia gravis endikasyondur
#4 kirmizi 2 - | ptozis botulinum
S: Alın botulinum uygulaması sonrası göz kapağı düşüklüğü. Ne yapılır?
+ kapak ptozisi (levator etkilenmesi) ; geçicidir (haftalar) ; apraklonidin damla semptomatik ; önleme: orbital kenara uzak enjeksiyon, doz
- kalıcıdır ; cerrahi gerekir
#5 yaygin 2 - | dolgu seçimi
S: Kalıcı dolgu yerine geri dönüşümlü hyaluronik asit dolgunun avantajı?
+ hiyalüronidazla geri döndürülebilirlik ; komplikasyon yönetimi kolay ; kalıcı dolgularda geç granülom ve çıkarılması güç komplikasyonlar ; hasta bilgilendirmesi
- kalıcı dolgular daha güvenli ; HA geri döndürülemez
#6 kilavuz 2 yonetmelik-guzellik-estetik-kuruluslari | Güzellik ve Estetik Amaçlı Sağlık Kuruluşları Yönetmeliği
S: Botulinum toksini ve dolgu uygulamalarını Türkiye'de kim yapabilir?
+ hekimler (yönetmelik / sertifika gereklilikleri) ; ruhsatlı sağlık kuruluşları ; güzellik salonunda / hekim olmayan kişiler yapamaz ; güncel mevzuattan doğrulanmalı
- estetisyen enjeksiyon yapabilir ; ruhsat gerekmez
#7 kirmizi 2 - | dolgu enfeksiyon / biyofilm
S: Dolgu sonrası haftalar içinde ağrılı, kırmızı nodüller. Yaklaşım?
+ enfeksiyon / biyofilm ; antibiyotik (gerekirse kombinasyon) ; fluktuasyonda drenaj ; HA dolguda hiyalüronidaz (enfeksiyon kontrolüyle) ; steroid enfeksiyon dışlanmadan verilmez
- hemen intralezyonel steroid ; izlem
#8 ilac 3 - | hiyalüronidaz
S: Hiyalüronidaz kullanımında dikkat edilecekler?
+ alerji riski (arı alerjisi öyküsü), deri testi elektif kullanımda ; acil oklüzyonda test beklenmez ; yüksek dozlar ; anafilaksi hazırlığı
- oklüzyonda alerji testi sonucu beklenir ; doz minimal tutulur her durumda
#9 yaygin 2 - | kimyasal peeling
S: Koyu ciltte (Fitzpatrick IV–V) orta derin peeling riskleri?
+ postinflamatuvar hiperpigmentasyon riski ; ön hazırlık (güneş koruma, depigmentan) ; yüzeyel peeling tercih ; herpes öyküsünde antiviral profilaksi ; izotretinoin sonrası bekleme
- koyu ciltte derin fenol peeling ilk tercih ; güneş koruma gereksiz
#10 kirmizi 2 - | lazer yanığı
S: Lazer epilasyon sonrası bölgede bül ve yanık. Tedavi?
+ yanık bakımı (soğutma, yara bakımı) ; enfeksiyon önleme ; güneşten koruma (hiperpigmentasyon) ; parametrelerin ve cilt tipinin gözden geçirilmesi
- yanık üzerine tekrar lazer ; diş macunu
#11 ilac 2 - | izotretinoin ve işlemler
S: İzotretinoin kullanan / yeni bırakmış hastada lazer ve peeling yapılabilir mi?
+ güncel kanıt bazı yüzeyel işlemlerin dikkatle yapılabileceğini gösterir ; agresif ablatif lazer / derin peeling için genellikle bekleme ; skar riski bireysel ; hasta bilgilendirmesi
- izotretinoin sırasında derin peeling güvenli ; hiçbir işlem 5 yıl yapılamaz
#12 yaygin 2 - | mezoterapi / PRP
S: Yüz gençleştirmede PRP ve mezoterapi ürünlerinin kanıt düzeyi?
+ kanıt sınırlı ve heterojen ; ürün içeriği ve ruhsat durumunun kontrolü (TİTCK) ; steril teknik, enfeksiyon (atipik mikobakteri) riski ; gerçekçi beklenti
- kanıtı kesin ; ruhsatsız kokteyller güvenli
#13 kirmizi 2 - | atipik mikobakteri
S: Mezoterapi sonrası aylar içinde iyileşmeyen nodül ve sinüsler. Ne düşünürsün?
+ atipik mikobakteri enfeksiyonu ; biyopsi / kültür (özel besiyeri) ; uzun süreli kombine antibiyotik ; enfeksiyon hastalıkları ; kaynak araştırması
- steroid enjeksiyonu ; standart kısa antibiyotik yeterli
#14 tuzak 2 - | aspirasyon güvencesi
S: Dolgu öncesi negatif aspirasyon damar içi enjeksiyonu güvenle dışlar mı?
+ negatif aspirasyon güvenilir değildir ; anatomik bilgi, kanül / düşük hacim / yavaş enjeksiyon ; tehlikeli bölgelere dikkat ; acil kit (hiyalüronidaz) hazır
- negatif aspirasyon tam güvence ; acil kit gereksiz
#15 yaygin 2 - | botulinum hiperhidroz
S: Aksiller hiperhidrozda botulinum toksini uygulaması?
+ intradermal enjeksiyon ; etki 4–9 ay ; Minor testi ile alan belirleme ; kontrendikasyonlar ; topikal tedavilere yanıtsızlıkta
- kalıcı tedavi ; kas içine derin
#16 sgk 1 - | medikal estetik SGK
S: Medikal estetik işlemlerin SGK kapsamı?
+ estetik amaçlı işlemler kapsam dışında ; tıbbi endikasyonlu bazı uygulamalar (ör. hiperhidroz, spastisite için botulinum) ayrı koşullara tabi ; güncel SUT'tan doğrulanmalı
- tüm botoks uygulamalarını SGK öder ; rapor ile estetik dolgu ödenir
#17 kirmizi 2 - | anafilaksi muayenehane
S: Medikal estetik muayenehanesinde anafilaksi hazırlığı?
+ adrenalin (IM) erişilebilir, doz bilgisi ; oksijen, havayolu ekipmanı ; personel eğitimi ; 112 / sevk protokolü
- adrenalin gereksiz ; antihistaminik yeterli
#18 ilac 2 - | lidokainli dolgu
S: Lidokain içeren dolgularda nelere dikkat edilir?
+ lidokain alerjisi (nadir) sorgulama ; toplam lokal anestezik doz (blok + dolgu) ; kardiyak hastalıkta dikkat
- lidokain dozu önemsiz ; alerji sorgulanmaz
#19 yaygin 2 - | herpes profilaksi
S: Perioral dolgu / lazer öncesi herpes öyküsü olan hastada ne yapılır?
+ antiviral profilaksi (valasiklovir) işlem öncesi başlayarak ; aktif lezyonda işlem ertelenir ; hasta bilgilendirmesi
- aktif uçukta işlem yapılır ; profilaksi gereksiz
#20 kirmizi 2 - | gecikmiş inflamatuvar reaksiyon
S: HA dolgudan aylar sonra viral enfeksiyon / aşı sonrası dolgu bölgesinde şişlik. Yaklaşım?
+ gecikmiş inflamatuvar reaksiyon ; enfeksiyon dışlama ; antihistaminik / kısa süreli oral steroid ; gerekirse hiyalüronidaz ; izlem
- kalıcı hasar, cerrahi ; hemen antibiyotik ve drenaj her vakada
#21 tuzak 2 - | gebelikte estetik
S: Gebe hastaya botulinum toksini veya dolgu uygulanabilir mi?
+ gebelik ve emzirmede güvenlik verisi yetersiz, elektif uygulamalar ertelenir ; topikal retinoid / bazı peeling ajanlarından kaçınma ; güneş koruma güvenli
- gebelikte botoks güvenli ; dolgu gebelikte önerilir
#22 yaygin 2 - | iplik askı
S: İplik askı (thread lift) uygulamasının komplikasyonları?
+ asimetri, çukurlaşma, ipliğin palpe olması / ekstrüzyonu ; enfeksiyon ; sinir / parotis hasarı riski ; etkinin sınırlı ve geçici olması ; hasta seçimi
- komplikasyonsuz kalıcı yüz germe ; enfeksiyon riski yok
#23 kirmizi 2 - | botulizm iatrojenik
S: Yüksek doz / ruhsatsız botulinum sonrası yaygın güçsüzlük, yutma güçlüğü ve diplopi. Ne yaparsın?
+ iatrojenik botulizm ; acil hastane, solunum izlemi ; antitoksin ; bildirim ; ürün kaynağının araştırılması
- geçer, evde izle ; yalnız fizik tedavi
#24 ilac 2 - | antikoagülan dolgu
S: Antikoagülan kullanan hastada dolgu uygulaması?
+ morarma / hematom riski artışı ; antikoagülan kendi başına kesilmez ; kanül tercihi, bası ; hastanın bilgilendirilmesi
- antikoagülanı 1 hafta kes ; risk yok
#25 yaygin 2 - | melazma tedavisi medikal estetik
S: Melazmada lazer / peeling tedavisinin yeri?
+ ilk basamak güneş koruma ve topikal (hidrokinon, üçlü kombinasyon, azelaik asit, traneksamik asit) ; lazer / peeling dikkatli, rebound / PIH riski ; oral traneksamik asit seçilmiş (tromboz riski değerlendirmesi)
- yüksek enerjili lazer ilk seçenek ; güneş koruma gereksiz
#26 kirmizi 2 - | dolgu nodül
S: Dolgu sonrası sert, ağrısız nodül. Ayırıcı tanı?
+ ürün birikimi / yanlış düzlem ; enfeksiyon / biyofilm ; granülom ; HA'da hiyalüronidaz, masaj ; enfeksiyonda antibiyotik
- tüm nodüller enfeksiyondur, drene et ; steroid her vakada ilk
#27 kilavuz 2 titck-kub | ürün güvenliği
S: Medikal estetikte kullanılan ürünlerin güvenilirliği nasıl kontrol edilir?
+ TİTCK ruhsatı / tıbbi cihaz kaydı, ÜTS ; resmi tedarik zinciri ; KÜB / kullanım talimatı ; lot kaydı ve izlenebilirlik
- internetten alınan ürünler güvenli ; kayıt gereksiz
#28 yaygin 2 - | aydınlatılmış onam
S: Dolgu uygulamasında onam formunda yer alması gerekenler?
+ ürün ve beklenen süre ; riskler: morarma, asimetri, nodül, enfeksiyon, vasküler oklüzyon ve körlük (nadir) ; alternatifler ; fotoğraf onayı
- körlük riski belirtilmez ; sözlü onam yeterli
#29 tuzak 2 - | botulinum direnç
S: Sık ve yüksek dozda botulinum toksini uygulaması direnç gelişimine yol açabilir mi?
+ nötralizan antikor gelişimi (nadir) ; gereksiz sık "rötuş" ve yüksek dozlardan kaçınma ; en düşük etkili doz ve aralıklar (genellikle ≥3 ay)
- direnç hiçbir zaman gelişmez ; 2 haftada bir rötuş önerilir
#30 kirmizi 2 - | vazovagal / LAST ayrımı
S: Enjeksiyon sırasında hasta bayılır gibi oldu. Ayırıcı tanı?
+ vazovagal ; anafilaksi (ürtiker, bronkospazm, hipotansiyon) ; lokal anestezik toksisitesi ; hipoglisemi ; vital bulgular ve uygun müdahale
- her zaman vazovagal, işleme devam ; değerlendirme gereksiz
`,
} satisfies BankaKaynagi
