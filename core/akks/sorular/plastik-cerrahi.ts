import type { BankaKaynagi } from '../banka'

/** AKKS — Plastik, Rekonstrüktif ve Estetik Cerrahi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'plastik-cerrahi',
  onek: 'PLS',
  metin: String.raw`
#1 kirmizi 3 - | yanık sıvı
S: 70 kg erişkinde %40 ikinci-üçüncü derece yanık. İlk 24 saat sıvı?
+ Parkland: 4 ml/kg/%TVYA Ringer laktat (11.200 ml), yarısı ilk 8 saatte ; idrar çıkışına göre (0,5 ml/kg/saat) titrasyon ; aşırı resüsitasyondan kaçınma ; yanık merkezine sevk ; inhalasyon yanığı
- birinci derece yanık da hesaba katılır ; sıvı kısıtlaması
#2 kirmizi 3 - | çevresel yanık
S: Göğüs ve bacakta çevresel tam kat yanık, ventilasyon zorlaşıyor. Ne yaparsın?
+ eskarotomi ; göğüste ventilasyonu, ekstremitede dolaşımı korumak için ; kompartman sendromu izlemi ; yanık merkezi
- elevasyon yeterli ; fasyotomi rutin her yanıkta
#3 yaygin 2 - | yanık ilk yardım
S: Haşlanma yanığında ilk yardım?
+ 20 dakika ılık / soğuk akan su (buz değil) ; takı ve giysilerin çıkarılması ; temiz örtü ; ağrı kontrolü ; yağ, diş macunu, yoğurt sürülmez
- buz uygulanır ; diş macunu sürülür
#4 kilavuz 2 - | yanık sevk kriterleri
S: Yanık merkezine sevk kriterleri nelerdir?
+ erişkinde >%20, çocukta >%10 kısmi kalınlık ; tam kat yanık ; yüz, el, ayak, genital, perine, büyük eklem ; elektrik, kimyasal, inhalasyon yanığı ; eşlik eden travma / komorbidite
- yalnız %50 üstü yanıklar sevk edilir ; yüz yanığı önemsiz
#5 ilac 2 - | lokal anestezik el
S: Parmak bloğunda adrenalinli lokal anestezik kullanılabilir mi?
+ güncel kanıt düşük konsantrasyon adrenalinin parmakta güvenli olduğunu gösterir (WALANT) ; periferik vasküler hastalıkta dikkat ; fentolamin kurtarma ; toplam doz hesabı
- adrenalin parmakta kesin kontrendike, nekroz yapar ; doz sınırı yok
#6 kirmizi 2 - | el fleksör tendon
S: Avuç içi kesisi sonrası parmak fleksiyonu yapamayan hasta. Yaklaşım?
+ fleksör tendon yaralanması ; nörovasküler muayene (dijital sinirler) ; el cerrahisine erken sevk, primer onarım ; erken kontrollü mobilizasyon rehabilitasyonu
- yara dikilip 6 hafta alçı ; tendon kendiliğinden iyileşir
#7 kirmizi 3 - | basınçlı enjeksiyon
S: Boya tabancasıyla parmağa yüksek basınçlı enjeksiyon yaralanması, giriş deliği küçük. Ne yaparsın?
+ küçük görünse de cerrahi acil ; acil cerrahi debridman ; amputasyon riski ; geniş spektrumlu antibiyotik, tetanoz
- küçük yara, pansuman ; izlem
#8 yaygin 2 - | yara bakımı
S: Kronik yarada iyileşmeyi geciktiren faktörler?
+ enfeksiyon / biyofilm ; iskemi, venöz yetmezlik ; diyabet, malnütrisyon, sigara ; basınç, ödem ; steroid / immünsüpresyon
- yara iyileşmesinde beslenme önemsiz ; sigara etkisiz
#9 kilavuz 2 - | basınç yarası
S: Evre 3–4 basınç yarasında tedavi?
+ basıncın kaldırılması (pozisyon, destek yüzeyi) ; debridman ; enfeksiyon / osteomyelit değerlendirmesi ; beslenme ; seçilmiş hastada flep rekonstrüksiyonu
- yalnız pansuman yeterli ; pozisyon değişimi gerekmez
#10 kirmizi 2 - | flep izlem
S: Serbest flep ameliyatı sonrası flep morarıyor ve kapiller dolum hızlı. Ne düşünürsün?
+ venöz tıkanıklık ; acil cerrahi re-eksplorasyon ; flep izlemi (renk, ısı, kapiller dolum, Doppler) ; zaman kritik
- normal ödem, 2 gün izle ; flep ısıtılıp beklenir
#11 yaygin 2 - | keloid
S: Keloid tedavisinde seçenekler?
+ intralezyonel steroid ; cerrahi + adjuvan (steroid / radyoterapi / basınç) ; silikon jel / tabaka ; kriyoterapi ; nüks sık
- tek başına eksizyon kalıcı ; radyoterapi kontrendike her durumda
#12 kilavuz 3 dernek-tprecd | meme rekonstrüksiyonu
S: Mastektomi sonrası meme rekonstrüksiyonu seçenekleri?
+ implant tabanlı (doku genişletici) ; otolog flep (DIEP, latissimus dorsi) ; immediat veya geç ; radyoterapi planı seçimi etkiler ; multidisipliner karar
- rekonstrüksiyon kanser tedavisini engeller, önerilmez ; radyoterapi seçimi etkilemez
#13 kirmizi 2 - | BIA-ALCL
S: Tekstürlü meme implantı olan kadında yıllar sonra tek taraflı geç seroma. Ne düşünürsün?
+ meme implantı ilişkili anaplastik büyük hücreli lenfoma (BIA-ALCL) ; USG eşliğinde sıvı aspirasyonu, CD30 ve sitoloji ; kapsülektomi + implant çıkarılması ; onkoloji
- normal seroma, drene edip izle ; tetkik gereksiz
#14 yaygin 2 - | dudak yarığı
S: Dudak-damak yarığı olan bebekte tedavi zamanlaması ve ekip?
+ multidisipliner ekip (plastik cerrahi, KBB, ortodonti, konuşma terapisi, genetik) ; dudak onarımı genellikle 3–6 ay ; damak onarımı 9–18 ay ; beslenme desteği (özel biberon) ; işitme izlemi (otitis media)
- onarım okul çağında ; işitme izlemi gereksiz
#15 kilavuz 2 - | deri kanseri eksizyon
S: Yüzde bazal hücreli karsinom eksizyonunda sınır?
+ düşük riskli BHK'de 4 mm sınır ; yüksek riskli bölge / sınırları belirsiz tümörde Mohs ; histopatolojik sınır kontrolü ; rekonstrüksiyon sınır kesinleştikten sonra (gerekirse)
- 1 cm sınır her BHK'de ; sınır kontrolü gereksiz
#16 ilac 3 - | antikoagülan cerrahi
S: Küçük deri cerrahisi öncesi warfarin kesilmeli mi?
+ çoğu küçük dermatolojik / plastik işlemde INR terapötik aralıktaysa kesilmez ; tromboembolik risk ; lokal hemostaz önlemleri ; büyük cerrahide köprüleme bireysel
- tüm cerrahilerde 1 hafta önce kesilir ; köprüleme her zaman gerekir
#17 kirmizi 2 - | ısırık el
S: Yumruk atarken dişe çarpan metakarpofalangeal eklem üzerinde küçük yara. Yaklaşım?
+ kavga ısırığı (fight bite) yüksek enfeksiyon / septik artrit riski ; eksplorasyon ve irrigasyon ; amoksisilin-klavulanat ; yara primer kapatılmaz ; tetanoz
- küçük yara, dikilip eve ; antibiyotik gereksiz
#18 yaygin 2 - | sigara cerrahi
S: Estetik ve rekonstrüktif cerrahi öncesi sigara neden bırakılmalı?
+ flep nekrozu, yara ayrışması, enfeksiyon riski ; en az 4 hafta önce bırakma ; nikotin replasmanı da vazokonstriksiyon yapar ; postop sürdürme
- sigara cerrahiyi etkilemez ; nikotin bandı risk taşımaz
#19 kirmizi 3 - | liposuction komplikasyon
S: Geniş hacimli liposuction sonrası nefes darlığı, taşikardi ve peteşi. Ne düşünürsün?
+ yağ embolisi / pulmoner emboli ; acil değerlendirme, oksijen, destek ; BT anjiyo ; lokal anestezik toksisitesi (tumescent) ayırıcı tanı
- normal postop ağrı ; analjezik ile eve
#20 sgk 2 sgk-sut | SUT estetik / rekonstrüktif (güncel madde doğrulanacak)
S: Estetik amaçlı ve rekonstrüktif cerrahinin SGK kapsamındaki farkı?
+ estetik amaçlı işlemler SGK kapsamı dışında ; rekonstrüktif (konjenital anomali, travma, kanser sonrası) işlemler kapsamda olabilir ; tıbbi gerekçenin belgelenmesi ; güncel SUT'tan doğrulanmalı
- tüm estetik işlemleri SGK öder ; rekonstrüksiyon hiçbir zaman kapsamda değil
#21 tuzak 2 - | aspirin cerrahi
S: Sekonder korunma için aspirin kullanan hastada küçük cerrahi öncesi aspirin her zaman kesilmeli mi?
+ sekonder korunmada aspirin genellikle sürdürülür (KV risk > kanama riski) ; kapalı alan / yüksek kanama riskli cerrahide bireysel ; kardiyoloji ile karar
- her cerrahide 10 gün önce kesilir ; risk değerlendirmesi gereksiz
#22 yaygin 2 - | skar revizyonu
S: Skar revizyonu için uygun zamanlama?
+ skar olgunlaşması 12–18 ay ; erken dönemde silikon, masaj, güneşten korunma ; hipertrofik skarda basınç ve steroid ; olgunlaşma sonrası revizyon
- 2 hafta sonra revizyon ; güneş koruma gereksiz
#23 kirmizi 2 - | nekrotizan fasiit
S: Nekrotizan fasiitte cerrahi ilkeler?
+ acil, agresif debridman (canlı dokuya kadar) ; 24–48 saatte tekrar görme ; geniş spektrumlu antibiyotik + klindamisin ; yara kapatma / rekonstrüksiyon sonradan
- tek debridman yeterli ; antibiyotik tek başına
#24 kilavuz 2 - | yüz yaralanması
S: Yüz laserasyonunun onarımında temel ilkeler?
+ iyi irrigasyon, minimal debridman (yüz iyi kanlanır) ; anatomik işaretler (vermilyon sınırı) önce hizalanır ; ince sütür (6/0), erken alma (5 gün) ; tetanoz, ısırıkta antibiyotik
- vermilyon hizalaması önemsiz ; kalın sütür 14 gün
#25 ilac 2 - | yanık topikal
S: Kısmi kalınlıkta yanıkta topikal tedavi seçimi?
+ gümüş içeren / modern yara örtüleri ; gümüş sülfadiazin yüzeyelde iyileşmeyi geciktirebilir ; enfeksiyon izlemi ; ağrı kontrolü ; tetanoz
- yanığa diş macunu ; sistemik antibiyotik profilaksisi rutin
#26 kirmizi 2 - | amputasyon replantasyon
S: Parmak amputasyonunda ampute parçanın korunması?
+ parça nemli gazlı beze sarılıp plastik torbaya, torba buzlu suya (doğrudan buz değil) ; acil replantasyon merkezi ; güdük basılı pansuman ; iskemi süresi kritik
- parça doğrudan buz içine ; kuru taşınır
#27 yaygin 2 - | karpal tünel cerrahi
S: Karpal tünel cerrahisi sonrası beklenen iyileşme?
+ gece semptomları erken düzelir ; uyuşma haftalar-aylar ; atrofi / ağır vakada kas gücü sınırlı geri döner ; erken parmak hareketi
- tüm semptomlar ilk gün tam düzelir ; 6 hafta alçı
#28 tuzak 2 - | yağ enjeksiyonu meme tarama
S: Meme yağ enjeksiyonu sonrası mamografi taraması önemini yitirir mi?
+ yağ nekrozu / kalsifikasyonlar tarama yorumunu etkileyebilir ama tarama sürer ; radyoloğa öykünün bildirilmesi ; gerekirse USG / MR ; deneyimli merkez
- tarama artık gereksiz ; mamografi kontrendike
#29 kirmizi 2 - | elektrik yanığı
S: Yüksek voltaj elektrik yanığında deri bulgusu küçük. Neden dikkatli olunmalı?
+ derin doku hasarı (buzdağı) ; aritmi için EKG ve monitörizasyon ; rabdomiyoliz (CK, miyoglobinüri), sıvı ; kompartman sendromu / fasyotomi
- küçük deri yanığı, pansumanla eve ; EKG gereksiz
#30 yaygin 2 - | jinekomasti
S: Ergen erkekte jinekomasti. Yaklaşım?
+ pubertal jinekomasti çoğunlukla geçicidir (1–2 yıl) ; ilaç / madde (anabolik, esrar), testis tümörü, karaciğer / tiroid değerlendirmesi ; kalıcı / semptomatik olanda cerrahi (liposuction / eksizyon) ; tek taraflı sert kitlede meme kanseri dışlanması
- tüm vakalara hemen cerrahi ; tetkik gereksiz
`,
} satisfies BankaKaynagi
