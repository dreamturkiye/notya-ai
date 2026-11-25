import type { BankaKaynagi } from '../banka'

/** AKKS — Fizyoterapi (Özel Branşlar, allied). 30 draft items (Claude, 2026-11-24). Scope: physiotherapist's legal role —
 *  no diagnosis of medical disease, no prescribing; red flags → physician. Needs clinician review. */
export default {
  brans: 'fizyoterapi',
  onek: 'FZT',
  metin: String.raw`
#1 kirmizi 3 - | kırmızı bayraklar
S: Bel ağrısıyla gelen danışanda hangi bulgular fizyoterapi yerine acil hekim değerlendirmesi gerektirir?
+ eyer anestezisi, idrar / gaita kontrolünde bozulma (kauda ekuina) ; ilerleyici nörolojik defisit ; kanser öyküsü, açıklanamayan kilo kaybı ; ateş / enfeksiyon ; ciddi travma
- kırmızı bayrakta tedaviye devam ; nörolojik muayene gereksiz
#2 yaygin 2 - | akut bel ağrısı egzersiz
S: Akut nonspesifik bel ağrısında fizyoterapi yaklaşımı?
+ eğitim ve güvence ; aktif kalma, kademeli aktivite ; ağrıya göre egzersiz ; yatak istirahati önerilmez ; pasif modaliteler tek başına değil
- 2 hafta yatak istirahati ; yalnız pasif cihaz tedavisi
#3 kilavuz 2 yonetmelik-is-ve-gorev-tanimlari | İş ve Görev Tanımları Yönetmeliği
S: Fizyoterapistin görev ve yetki sınırları?
+ hekimin tanısı / yönlendirmesi doğrultusunda fizyoterapi ve rehabilitasyon planı ; ilaç reçete edemez, tıbbi tanı koyamaz ; değerlendirme, tedavi ve kayıt ; hekimle iş birliği
- fizyoterapist ilaç önerebilir ; tanı koyar
#4 yaygin 2 - | diz OA egzersiz
S: Diz osteoartritinde egzersiz programı?
+ kuadriseps ve kalça abdüktör güçlendirme ; aerobik düşük etkili ; kilo kontrolü desteği ; eğitim ; ağrı kılavuzlu dozlama
- egzersiz kıkırdağı yıpratır ; tam istirahat
#5 kirmizi 2 - | DVT şüphesi
S: Ortopedik cerrahi sonrası rehabilitasyondaki hastada tek taraflı baldır şişliği ve ağrı. Ne yaparsın?
+ DVT şüphesi ; egzersiz / masajın durdurulması ; hekime acil yönlendirme (Doppler) ; PE bulguları (nefes darlığı) acil
- masajla şişliği azalt ; egzersize devam
#6 kilavuz 2 sb-kp-total-diz | SB Total Diz Artroplastisi KP
S: Total diz protezi sonrası erken rehabilitasyon hedefleri?
+ erken mobilizasyon (cerrahi gününden itibaren protokole göre) ; diz ekstansiyonu ve fleksiyon açıklığı ; kuadriseps aktivasyonu ; yürüme eğitimi ve yardımcı cihaz ; ödem ve ağrı yönetimi
- 2 hafta yatak istirahati ; ekstansiyon kısıtlılığı önemsiz
#7 kilavuz 2 sb-kp-inme | inme rehabilitasyonu
S: İnme sonrası üst ekstremite rehabilitasyonunda kanıta dayalı yaklaşımlar?
+ görev odaklı tekrarlayıcı pratik ; zorunlu kullanım (CIMT) seçilmiş hastada ; ayna terapisi ; spastisite yönetimi ve pozisyonlama ; omuz koruma
- hemiplejik kolu çekerek transfer ; pasif hareket tek başına yeterli
#8 kirmizi 2 - | otonomik disrefleksi
S: Spinal kord yaralanmalı (T4) danışanda seans sırasında şiddetli baş ağrısı ve yüksek KB. Ne yaparsın?
+ otonomik disrefleksi ; oturtma, sıkı giysileri gevşetme ; mesane / bağırsak tetikleyicisini kontrol ; acil hekim / sağlık ekibi ; seansı durdur
- yatırıp egzersize devam ; önemsiz
#9 yaygin 2 - | omuz sıkışma
S: Subakromiyal ağrı sendromunda egzersiz?
+ rotator manşet ve skapula stabilizasyon egzersizleri ; postür ; aktivite modifikasyonu ; ağrı izlemli kademeli yükleme
- tam immobilizasyon ; egzersiz zararlı
#10 kirmizi 2 - | kardiyak semptom
S: Egzersiz sırasında göğüs ağrısı ve nefes darlığı yaşayan danışan. Ne yaparsın?
+ egzersizin hemen durdurulması ; vital bulgular ; kardiyak olay şüphesinde 112 ; OED ve acil plan ; hekim değerlendirmesi olmadan devam yok
- ağrıya rağmen devam ; dinlenip aynı seansta sürdürme
#11 yaygin 2 - | fibromiyalji
S: Fibromiyaljide fizyoterapi?
+ aerobik egzersiz en güçlü kanıt ; kademeli artış ; eğitim ve ağrı nörobilimi ; uyku ve stres yönetimi desteği
- egzersiz zararlı ; yalnız pasif modalite
#12 tuzak 2 - | pasif modaliteler
S: Kronik bel ağrısında ultrason / TENS tek başına etkili midir?
+ tek başına uzun dönem etkinliği sınırlı ; aktif egzersiz temel ; modaliteler kısa süreli ek ; kanıta dayalı seçim
- 20 seans ultrason kalıcı çözüm ; egzersiz gereksiz
#13 kilavuz 2 sb-rehber-dmd | SB DMD Klinik Rehberi
S: DMD'li çocukta fizyoterapi ilkeleri?
+ germe ve gece ortezleri ile kontraktür önleme ; aşırı eksantrik / yorucu egzersizden kaçınma ; solunum fizyoterapisi ; mobilite cihazları ; multidisipliner ekip
- yoğun ağırlık antrenmanı ; germe gereksiz
#14 yaygin 2 - | osteoporoz egzersiz
S: Osteoporozlu danışanda egzersiz önerileri ve kaçınılacak hareketler?
+ ağırlık taşıyan ve direnç egzersizleri ; denge ve düşme önleme ; omurgada derin fleksiyon / ani rotasyondan kaçınma ; postür
- osteoporozda egzersiz yasak ; mekik ve ağır fleksiyon önerilir
#15 kirmizi 2 - | servikal manipülasyon riski
S: Servikal manipülasyon öncesi hangi durumlar risklidir?
+ vertebrobaziler yetmezlik bulguları (baş dönmesi, diplopi, dizartri, disfaji, düşme atakları) ; servikal instabilite (RA, Down sendromu, travma) ; antikoagülan, osteoporoz ; şüphede hekim yönlendirmesi
- risk yoktur ; herkese uygulanır
#16 yaygin 2 - | ayak bileği burkulması
S: Ayak bileği burkulması sonrası rehabilitasyon?
+ erken kontrollü yükleme ; hareket açıklığı ; propriosepsiyon / denge ; kuvvet ; spora dönüş kriterleri
- uzun immobilizasyon ; denge eğitimi gereksiz
#17 kilavuz 2 - | kardiyak rehabilitasyon
S: MI sonrası kardiyak rehabilitasyonda fizyoterapistin rolü?
+ hekimin efor testi / risk sınıflamasına göre egzersiz reçetesi ; denetimli aerobik ve direnç ; semptom ve vital izlem ; eğitim
- efor değerlendirmesi olmadan yüksek şiddet ; izlem gereksiz
#18 yaygin 2 - | KOAH pulmoner rehabilitasyon
S: KOAH'ta pulmoner rehabilitasyon bileşenleri?
+ aerobik ve kuvvet egzersizleri ; solunum teknikleri (dudak büzme) ; hava yolu temizleme ; satürasyon izlemi ; eğitim
- KOAH'ta egzersiz kontrendike ; satürasyon izlemi gereksiz
#19 kirmizi 2 - | ilerleyici güçsüzlük
S: Rehabilitasyondaki danışanda haftalar içinde ilerleyen bacak güçsüzlüğü ve yeni idrar sorunu. Ne yaparsın?
+ olası spinal kord / kauda ekuina / nörolojik hastalık ; hekime acil yönlendirme ; tedavinin durdurulması ; kayıt
- güçlendirme egzersizini artır ; normal
#20 yaygin 2 - | karpal tünel
S: Karpal tünel sendromunda konservatif fizyoterapi?
+ gece nötral atel ; sinir / tendon kaydırma egzersizleri ; aktivite modifikasyonu ; ağır / atrofide hekime (cerrahi) yönlendirme
- atrofide de yalnız egzersiz ; sürekli atel
#21 tuzak 2 - | kinezyo bant
S: Kinezyolojik bantlamanın kanıt düzeyi?
+ sınırlı ve tutarsız kanıt ; aktif egzersizin yerine geçmez ; kısa süreli ek olabilir ; cilt irritasyonu
- kalıcı tedavi ; egzersizden üstün
#22 kilavuz 2 sb-kp-total-kalca | SB Total Kalça Artroplastisi KP
S: Total kalça protezi sonrası dislokasyon önleme önlemleri?
+ cerrahi yaklaşıma göre (posterior: aşırı fleksiyon, addüksiyon, iç rotasyondan kaçınma) ; yükseltilmiş oturak ; güvenli transfer eğitimi ; cerrah protokolüne uyum
- ilk gün derin çömelme ; önlem gereksiz
#23 sgk 1 - | fizyoterapi SGK
S: Fizyoterapi seanslarının SGK tarafından karşılanması için gerekenler?
+ FTR uzmanı / yetkili hekim raporu ve reçetesi ; tanıya göre seans sınırları ; yetkili kuruluş ; güncel SUT'tan doğrulanmalı
- fizyoterapist doğrudan SGK raporu düzenler ; sınırsız seans
#24 yaygin 2 - | düşme önleme
S: Yaşlıda düşme önleme egzersiz programı?
+ denge ve kuvvet egzersizleri (Otago gibi kanıtlı programlar) ; yürüme eğitimi ; ev güvenliği önerileri ; ilaç / ortostatik değerlendirme için hekime yönlendirme
- yaşlıda egzersiz düşmeyi artırır ; yalnız yürüteç yeterli
#25 kirmizi 2 - | kanser hastası
S: Kemik metastazı olan danışanda egzersiz programında dikkat?
+ patolojik kırık riski ; onkoloji / hekimle risk değerlendirmesi ; etkilenen bölgeye yüksek yük / bükülmeden kaçınma ; trombosit, anemi, enfeksiyon durumu
- metastazda yüksek yüklü egzersiz ; hekimle iletişim gereksiz
#26 yaygin 2 - | hemiplejik omuz
S: İnme sonrası hemiplejik omuz ağrısını önleme?
+ doğru pozisyonlama ve destek ; kolundan çekmeme ; subluksasyonda askı / bant ; hareket açıklığı
- kolundan çekerek kaldırma ; omuz hareketsiz
#27 tuzak 2 - | statik germe
S: Patlayıcı sporlarda ısınmada uzun statik germe önerilir mi?
+ kısa süreli güç performansını azaltabilir ; dinamik ısınma tercih ; statik germe soğuma / ayrı seans
- maçtan önce uzun statik germe ideal ; ısınma gereksiz
#28 kirmizi 2 - | gebelik egzersiz
S: Gebe danışanda egzersizi durdurma belirtileri?
+ vajinal kanama, amniyon sıvısı gelişi ; düzenli ağrılı kasılmalar ; göğüs ağrısı, baş dönmesi, baş ağrısı, baldır ağrısı / şişliği ; hekime yönlendirme
- belirtilere rağmen devam ; gebelikte egzersiz yasak
#29 yaygin 2 - | pelvik taban
S: Stres inkontinansta pelvik taban kas eğitimi?
+ denetimli program, en az 3 ay ; doğru kas aktivasyonu (biofeedback) ; günlük tekrar ; yanıtsızlıkta hekim / ürojinekoloji
- 1 hafta yeterli ; ilaç önerisi fizyoterapistten
#30 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Kronik hastalığı olan erişkine fiziksel aktivite önerisi nasıl verilir?
+ haftada 150–300 dk orta şiddet aerobik ; haftada ≥2 gün kuvvet ; kademeli başlama ; hekimin kısıtlamalarına uyum
- kronik hastalıkta egzersiz yasak ; haftada 10 dk
`,
} satisfies BankaKaynagi
