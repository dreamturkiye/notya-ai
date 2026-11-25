import type { BankaKaynagi } from '../banka'

/** AKKS — Çocuk Cerrahisi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'cocuk-cerrahisi',
  onek: 'CCR',
  metin: String.raw`
#1 kirmizi 3 - | malrotasyon volvulus
S: Yenidoğanda safralı kusma. Yaklaşım?
+ cerrahi acil, malrotasyon / volvulus dışlanmalı ; acil üst GİS kontrast çalışması ; NG dekompresyon, IV sıvı ; acil Ladd prosedürü
- reflü, izlem ; ertesi gün kontrol
#2 kirmizi 2 - | invajinasyon
S: 9 aylık bebekte aralıklı şiddetli ağlama, kusma ve kanlı gaita. Tedavi?
+ invajinasyon ; USG ; peritonit / şok yoksa hidrostatik / pnömatik redüksiyon ; başarısızlık / perforasyonda cerrahi ; nüks izlemi
- gastroenterit, ORS ; kolonoskopi
#3 yaygin 2 - | pilor stenozu
S: 5 haftalık bebekte fışkırır kusma; tedavi?
+ USG (pilor kas kalınlığı / uzunluğu) ; hipokloremik metabolik alkalozun düzeltilmesi önce ; piloromiyotomi (açık / laparoskopik) ; acil değil, elektrolit düzeldikten sonra
- elektrolit düzeltilmeden acil cerrahi ; reflü ilacı
#4 yaygin 2 - | apandisit çocuk
S: Çocukta apandisit şüphesinde görüntüleme?
+ ilk tercih USG ; Pediatrik Apandisit Skoru ; tanısal olmayan USG'de seri muayene / MR ; BT radyasyon nedeniyle seçilmiş ; laparoskopik apendektomi
- tüm çocuklara BT ilk tercih ; analjezi verilmez
#5 kirmizi 3 - | testis torsiyonu çocuk
S: 12 yaşında ani skrotal ağrı. Yaklaşım?
+ torsiyon acil skrotal eksplorasyon ; TWIST skoru, Doppler tanıyı geciktirmemeli ; detorsiyon ve bilateral fiksasyon ; ilk 6 saat
- epididimit, antibiyotik ; Doppler için ertesi gün
#6 yaygin 2 - | inguinal herni çocuk
S: Prematüre bebekte inguinal herni; ne zaman ameliyat?
+ çocukta inguinal herni kendiliğinden kapanmaz, cerrahi ; inkarserasyon riski (özellikle prematüre / küçük bebek) nedeniyle erken elektif onarım ; inkarserasyonda redüksiyon ve 24–48 saatte onarım
- 2 yaşına kadar bekle ; meş ile onarım
#7 yaygin 2 - | umbilikal herni
S: 1 yaşında umbilikal herni. Ne zaman cerrahi?
+ çoğu 4–5 yaşa kadar kendiliğinden kapanır ; defekt >1,5–2 cm veya 4–5 yaş sonrası devam ederse cerrahi ; inkarserasyon nadir ; bant / para bağlama önerilmez
- hemen cerrahi ; para ile bastırma
#8 yaygin 2 - | inmemiş testis
S: Ele gelen inmemiş testiste orşiopeksi zamanlaması?
+ 6–18 ay arası orşiopeksi ; rutin USG gerekmez ; ele gelmeyen testiste tanısal laparoskopi ; hormonal tedavi önerilmez
- ergenliğe kadar bekle ; tüm vakalara hCG
#9 kirmizi 2 - | Hirschsprung
S: Kronik kabızlık, gecikmiş mekonyum ve distansiyon olan bebekte tanı?
+ Hirschsprung ; kontrastlı lavman (geçiş zonu) ; rektal emme biyopsisi (gangliyon hücre yokluğu) — altın standart ; enterokolit riski ; pull-through cerrahisi
- fonksiyonel kabızlık, laksatif ; biyopsi gereksiz
#10 kirmizi 3 - | NEK
S: Prematüre bebekte beslenme intoleransı, distansiyon ve kanlı gaita; grafide pnömatozis intestinalis. Yaklaşım?
+ nekrotizan enterokolit ; oral alımın kesilmesi, NG dekompresyon, IV antibiyotik ; seri grafi (perforasyon) ; perforasyonda cerrahi / peritoneal dren ; TPN
- beslemeye devam ; antibiyotik gereksiz
#11 kirmizi 2 - | özofagus atrezisi
S: Yenidoğanda aşırı salya, beslemede öksürük-siyanoz; NG sonda ilerlemiyor. Ne düşünürsün?
+ özofagus atrezisi ± TÖF ; grafide sondanın kıvrılması ; VACTERL anomalileri taraması ; üst kese aspirasyonu, oral beslenme yok ; cerrahi onarım
- beslemeye devam ; reflü
#12 kirmizi 2 - | KDH
S: Doğumda solunum sıkıntısı, skafoid karın, sol hemitoraksta barsak sesleri. Ne yapılmamalı?
+ konjenital diyafragma hernisi ; balon-maske ventilasyondan kaçınma (mide distansiyonu), erken entübasyon ; NG dekompresyon ; pulmoner hipertansiyon yönetimi ; stabilizasyon sonrası cerrahi
- balon-maske ile uzun ventilasyon ; acil cerrahi stabilizasyon öncesi
#13 yaygin 2 - | fimozis
S: Fizyolojik fimozis ve patolojik fimozis ayrımı ve tedavi?
+ fizyolojik fimozis yaşla düzelir, zorla geri çekme yapılmaz ; patolojik (skar, BXO) fimozisde topikal steroid / sünnet ; tekrarlayan balanit / İYE'de tedavi
- tüm fimoziste hemen sünnet ; zorla geri çekme önerilir
#14 kirmizi 2 - | yabancı cisim yutma
S: 3 yaşında çocuk iki adet mıknatıs yuttu. Yaklaşım?
+ çoklu mıknatıs barsak duvarları arasında perforasyon / fistül riski ; grafi ; endoskopik çıkarma (mümkünse) veya yakın izlem / cerrahi ; tek mıknatısta izlem
- kendiliğinden çıkar, izleme gerek yok ; laksatif verilir
#15 kirmizi 3 - | travma çocuk dalak
S: Künt karın travmalı stabil çocukta dalak laserasyonu. Tedavi?
+ hemodinamik stabil çocukta non-operatif yönetim standart ; yatak istirahati / izlem, seri hemoglobin ; instabilitede cerrahi / embolizasyon ; splenektomi sonrası aşılama (gerekirse)
- tüm dalak yaralanmalarına splenektomi ; izlem gereksiz
#16 yaygin 2 - | hipospadias
S: Hipospadiaslı bebekte sünnet yapılmalı mı?
+ sünnet yapılmamalı (prepisyum onarımda kullanılır) ; onarım genellikle 6–18 ay ; inmemiş testis eşliğinde DSD değerlendirmesi ; deneyimli merkez
- doğumdan sonra hemen sünnet ; DSD değerlendirmesi gereksiz
#17 kirmizi 2 - | çocuk yanık
S: Çocukta yanık sıvı resüsitasyonunun erişkinden farkı?
+ çocukta idame sıvısı (dekstrozlu) Parkland'a ek ; idrar hedefi 1 ml/kg/saat ; hipotermi ve hipoglisemi riski ; istismar şüphesi (patern) ; >%10 yanıkta resüsitasyon
- erişkinle aynı, idame gerekmez ; istismar sorgulanmaz
#18 kilavuz 2 sb-rehber-cocuk-yb | SB Çocuk YBÜ Rehberi
S: Cerrahi sonrası çocuk yoğun bakım kabul gerekçeleri?
+ solunum desteği ; hemodinamik instabilite ; büyük cerrahi / masif transfüzyon ; nörolojik izlem ; prematüre / küçük bebekte apne riski
- tüm çocuk cerrahi hastaları yoğun bakımda ; apne riski önemsiz
#19 yaygin 2 - | kistik hidroma / boyun kitlesi
S: Çocukta lateral boyun kitlesi ayırıcı tanısı?
+ reaktif lenfadenopati en sık ; brankiyal kist ; lenfatik malformasyon ; lenfoma (sert, büyüyen, B semptomları) ; USG ve gerekirse biyopsi
- tüm kitleler malign ; görüntüleme gereksiz
#20 ilac 2 - | analjezi çocuk postop
S: Çocukta postoperatif analjezi?
+ parasetamol + ibuprofen (kilo bazlı) ; rejyonel bloklar (kaudal) ; opioid gerekirse dikkatli izlemle ; kodein ve tramadol 12 yaş altında kaçınılır
- kodein ilk seçenek ; NSAİİ çocukta yasak
#21 kirmizi 2 - | ovaryan torsiyon çocuk
S: Kız çocukta ani karın ağrısı ve kusma; USG'de büyümüş over. Yaklaşım?
+ over torsiyonu ; Doppler akım olması dışlamaz ; acil laparoskopi, detorsiyon ve over koruma ; ooforektomiden kaçınma
- Doppler normalse dışlanır ; nekrotik görünümde rutin ooforektomi
#22 kilavuz 2 - | VUR cerrahi
S: Vezikoüreteral reflüde cerrahi / endoskopik tedavi endikasyonları?
+ profilaksiye rağmen tekrarlayan ateşli İYE ; yüksek derece reflü ve yeni skar ; endoskopik enjeksiyon veya üreteral reimplantasyon ; mesane-barsak disfonksiyonu tedavisi
- tüm VUR'lara cerrahi ; mesane disfonksiyonu önemsiz
#23 sgk 2 sgk-sut | SUT çocuk cerrahi (güncel madde doğrulanacak)
S: Çocuk cerrahisi işlemlerinde SGK faturalandırmasında genel çerçeve?
+ SUT işlem kodları ve yaşa göre farklılıklar ; yenidoğan / yoğun bakım ek ücretleri ; pakete dahil kalemler ; güncel SUT'tan doğrulanmalı
- çocuk işlemleri SGK kapsamında değil ; kod gerekmez
#24 tuzak 2 - | sünnet zamanı
S: Sünnet için tıbbi açıdan en uygun dönem ve kontrendikasyonlar nelerdir?
+ yenidoğan döneminde veya anestezi riskinin düşük olduğu dönemde ; hipospadias, epispadias, gömük penis kontrendikasyon ; kanama bozukluğu sorgulanması ; steril ortam ve deneyimli hekim
- hipospadiasta sünnet uygun ; kanama bozukluğu önemsiz
#25 kirmizi 2 - | Meckel
S: 2 yaşında ağrısız masif rektal kanama. Ne düşünürsün?
+ Meckel divertikülü ; Meckel sintigrafisi (Tc-99m perteknetat) ; resüsitasyon ; laparoskopik rezeksiyon
- hemoroid ; izlem
#26 yaygin 2 - | gastroşizis / omfalosel
S: Gastroşizis ve omfalosel farkı ve doğumdaki yaklaşım?
+ gastroşizis: kesesiz, umbilikus sağında, eşlik eden anomali az ; omfalosel: keseli, kromozomal / kardiyak anomali sık ; barsakların steril örtülmesi, ısı ve sıvı kaybı önleme ; cerrahi onarım
- omfalosel anomali taraması gerektirmez ; barsaklar açık bırakılır
#27 kirmizi 2 - | biliyer atrezi
S: 5 haftalık bebekte direkt hiperbilirubinemi ve akolik gaita. Yaklaşım?
+ biliyer atrezi ; USG, sintigrafi, gerekirse kolanjiyografi / biyopsi ; Kasai portoenterostomi ideal 60 günden önce ; transplant gereksinimi
- anne sütü sarılığı, izlem ; fototerapi
#28 tuzak 2 - | akut karın çocuk analjezi
S: Akut karın ağrılı çocuğa cerrahi değerlendirme öncesi analjezik vermek uygun mu?
+ erken analjezi tanıyı maskelemez ; opioid dahil ; çocuğun konforu ve muayene kolaylığı
- cerrah görene kadar analjezi verilmez ; analjezi apandisiti gizler
#29 yaygin 2 - | kistik böbrek / hidronefroz antenatal
S: Antenatal hidronefroz saptanan yenidoğanın izlemi?
+ postnatal USG (48 saat sonra, dehidratasyon dönemi geçtikten sonra) ; derece ve bilateralliğe göre ; posterior üretral valv şüphesinde (erkek, bilateral) acil VCUG ; profilaksi seçilmiş
- ilk gün USG kesin değerlendirme ; posterior üretral valv önemsiz
#30 kirmizi 2 - | posterior üretral valv
S: Erkek yenidoğanda bilateral hidronefroz, kalın duvarlı mesane ve zayıf idrar akımı. Ne düşünürsün?
+ posterior üretral valv ; mesane kateterizasyonu ; VCUG ; endoskopik valv ablasyonu ; böbrek fonksiyonu izlemi
- normal, izlem ; antibiyotik tek tedavi
`,
} satisfies BankaKaynagi
