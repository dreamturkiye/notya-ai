/**
 * BRANS-PAKETI — saç ekimi, estetik & plastik cerrahi, medikal estetik and dermatoloji kliniği signature modules.
 * Every timeline / checklist here is a STARTING TEMPLATE the treating physician accepts (and may edit once) before any
 * patient sees it — the physician is the reviewer (brans_paket_sablon.kabul_at). Sources and what could not be confirmed:
 * docs/kaynak/OZEL-BRANS-PAKETI-ARASTIRMA.md. No diagnosis, no drug dose, 112 on every acil line.
 */
import type { PaketModulTanimi } from '../bransPaketi'

// ─── Saç ekimi ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const SAC_EKIMI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'sac-zaman', brans: 'sac-ekimi', tur: 'zaman', baslik: 'Gün gün iyileşmem', baslangicEtiketi: 'İşlem günü',
    aciklama: 'İşlem gününüzden itibaren her gün ne yapacağınız. Hekiminizin size özel talimatı her zaman önce gelir.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'İlk gece', ayrinti: 'Başınızı yüksekte tutarak sırtüstü uyuyun. Ekim alanına dokunmayın, kaşımayın, şapka takmayın.' },
        { gun: 1, baslik: 'Kontrol ve ilk yıkama', ayrinti: 'İlk yıkama hekiminizin tarif ettiği şekilde yapılır (klinikte ya da evde). Ovmadan, bastırmadan.' },
        { gun: 2, baslik: 'Günlük nazik yıkama', ayrinti: 'Hekiminizin önerdiği şampuanla köpüğü avuç içiyle hafifçe yayıp ılık suyla durulayın. Havlu ile ovmayın, tampon yaparak kurulayın.' },
        { gun: 3, baslik: 'Şişlik', ayrinti: 'Alın ve göz çevresine inen şişlik bu günlerde sık görülür ve genelde geçer. Soğuk uygulama ekim alanına değil, alna yapılır.' },
        { gun: 7, baslik: 'Kabuklar yumuşuyor', ayrinti: 'Yıkamaya devam edin. Kabukları koparmayın; yıkamayla kendiliğinden dökülür.' },
        { gun: 10, baslik: 'Kabuklar dökülüyor', ayrinti: 'Kabukların çoğu bu günlerde dökülür. Kalan varsa hekiminize yazın.' },
        { gun: 14, baslik: 'Günlük hayata dönüş', ayrinti: 'Terleten spor, havuz, sauna ve deniz için hekiminizin onayını bekleyin. Doğrudan güneşten koruyun.' },
        { gun: 21, baslik: 'Geçici dökülme dönemi', ayrinti: 'Ekilen saçların bir kısmının dökülmesi bu dönemde beklenir ve geçicidir; kökler yerinde kalır.' },
        { gun: 56, baslik: 'Dökülme dönemi kapanıyor', ayrinti: 'Geçici dökülme genelde bu haftalarda tamamlanır.' },
        { gun: 90, baslik: '3. ay', ayrinti: 'Yeni saçlar ince ve tek tek çıkmaya başlar. Standart açılardan fotoğraf zamanı.' },
        { gun: 180, baslik: '6. ay', ayrinti: 'Belirgin çıkış ve kalınlaşma. Fotoğraf ve kontrol zamanı.' },
        { gun: 270, baslik: '9. ay', ayrinti: 'Saçlar kalınlaşmaya devam eder. Fotoğraf zamanı.' },
        { gun: 365, baslik: '12. ay', ayrinti: 'Sonucun büyük bölümü görünür; tepe bölgesinde olgunlaşma 12–18 aya uzayabilir. Fotoğraf ve kontrol zamanı.' },
      ],
    },
    kaynaklar: ['SAC-PRATIK', 'REPO-SAC-IZLEM'],
  },
  {
    kod: 'sac-foto', brans: 'sac-ekimi', tur: 'foto', baslik: 'Çıkış fotoğraflarım',
    aciklama: 'Aynı açılardan, aynı ışıkta çekilen fotoğraflar gelişimi en iyi gösterir. 3, 6, 9 ve 12. ayda hatırlatılır.',
    varsayilan: { acilar: ['Ön', 'Tepe', 'Sağ yan', 'Sol yan', 'Ense (donör)'], aylar: [3, 6, 9, 12], not: 'Saçınız kuru, taranmış; aynı pencere ışığında, telefon başınızdan bir kol boyu uzakta.' },
    kaynaklar: ['SAC-PRATIK'],
    fotoRizaMetni: 'Çıkış fotoğraflarımın hekimimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
  {
    kod: 'sac-ilac', brans: 'sac-ekimi', tur: 'hatirlatma', baslik: 'Hekimimin bakım planı',
    aciklama: 'Hekiminizin yazdığı bakım ve ilaç planı satırları. Saatli ilaç hatırlatmaları İlaç takvimi bölümündedir.',
    varsayilan: { maddeler: ['Hekiminizin planı burada görünür.'], not: 'Doz ve ilaç değişikliği hekiminizindir.' },
    kaynaklar: [],
    ayarlar: [{ id: 'satirlar', etiket: 'Plan satırları (her satır bir madde; doz yazılmaz — doz ilaç takvimindedir)', tur: 'satirlar' }],
  },
  {
    kod: 'sac-gunluk', brans: 'sac-ekimi', tur: 'gunluk', baslik: 'İyileşme günlüğüm',
    aciklama: 'İlk iki hafta günde bir kez işaretleyin. Önemli bir belirti olursa hekiminiz haberdar olur.',
    varsayilan: {
      alanlar: [
        { id: 'kasinti', etiket: 'Kaşıntı', tur: 'olcek' },
        { id: 'sislik', etiket: 'Şişlik', tur: 'olcek' },
        { id: 'akinti', etiket: 'Ekim ya da donör alanda kızarıklık, akıntı veya kötü koku', tur: 'evet' },
        { id: 'ates', etiket: 'Ateşim 38 °C veya üstü', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı, yüzde/dudakta şişlik', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: 'Nefes darlığı ya da yüzde/dudakta şişlik acildir: 112’yi arayın.', hekim: 'Saç ekimi sonrası: nefes darlığı / anjiyoödem bildirdi.' },
        { id: 'enfeksiyon', kosullar: [{ alan: 'akinti', evet: true }, { alan: 'ates', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateş ve akıntı bilgisini hekiminize ilettik. Bugün hekiminizi arayın.', hekim: 'Saç ekimi sonrası: ateş ≥ 38 °C + alan kızarıklık/akıntı.' },
        { id: 'akinti', kosullar: [{ alan: 'akinti', evet: true }], duzey: 'dikkat', hasta: 'Kızarıklık ya da akıntı bilgisini hekiminize ilettik; artarsa bugün arayın.', hekim: 'Saç ekimi sonrası: alan kızarıklık / akıntı.' },
      ],
    },
    kaynaklar: ['SAC-PRATIK'],
  },
]

// ─── Estetik & plastik cerrahi ──────────────────────────────────────────────────────────────────────────────────────
export const ESTETIK_CERRAHI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'cer-hazirlik', brans: 'estetik-cerrahi', tur: 'liste', baslik: 'Ameliyat öncesi hazırlığım', isaretlenir: true,
    aciklama: 'Cerrahınızın hazırlık listesi. Tamamladıklarınızı işaretleyin; cerrahınız görür.',
    varsayilan: {
      maddeler: [
        'Kullandığım tüm ilaçları, bitkisel ürün ve takviyeleri cerrahıma bildirdim (kan sulandırıcılar dahil — kesip kesmemeye cerrah karar verir).',
        'Sigara ve nikotin ürünlerini cerrahımın söylediği süre önce bıraktım.',
        'İstenen tahlil ve muayeneleri tamamladım, sonuçları ilettim.',
        'Ameliyat öncesi aç kalma saatini cerrahımdan öğrendim.',
        'Beni eve götürecek ve ilk gece yanımda kalacak bir yakınım var.',
        'Önden açılan rahat kıyafet ve korse / sütyen (önerildiyse) hazır.',
        'Onam formunu okudum, sorularımı sordum; düşünme süremi kullandım.',
      ],
    },
    kaynaklar: ['CERRAHI-PRATIK', 'REPO-CERRAHI-ONAM'],
    ayarlar: [{ id: 'satirlar', etiket: 'Bu hastaya ek hazırlık maddeleri (her satır bir madde)', tur: 'satirlar' }],
  },
  {
    kod: 'cer-zaman', brans: 'estetik-cerrahi', tur: 'zaman', baslik: 'İyileşme takvimim', baslangicEtiketi: 'Ameliyat günü',
    aciklama: 'Pansuman, kontrol ve korse günleri. Tarihleri cerrahınız kesinleştirir.',
    varsayilan: {
      adimlar: [
        { gun: 1, baslik: 'İlk kontrol / pansuman', ayrinti: 'Cerrahınızın söylediği saatte. Dren varsa miktarı günlüğe yazın.' },
        { gun: 7, baslik: 'Dikiş ve yara kontrolü', ayrinti: 'Dikişler bu dönemde kontrol edilir ya da alınır.' },
        { gun: 14, baslik: 'İkinci kontrol', ayrinti: 'Şişlik azalmaya başlar; korse kullanımını cerrahınızın söylediği gibi sürdürün.' },
        { gun: 42, baslik: '6. hafta', ayrinti: 'Korse ve egzersiz kısıtlamaları için cerrahınızın kararı.' },
        { gun: 90, baslik: '3. ay', ayrinti: 'Kontrol ve fotoğraf zamanı.' },
        { gun: 180, baslik: '6. ay', ayrinti: 'Kontrol ve fotoğraf zamanı.' },
        { gun: 365, baslik: '12. ay', ayrinti: 'Son değerlendirme; iz olgunlaşması bu süreye uzayabilir.' },
      ],
    },
    kaynaklar: ['REPO-CERRAHI-TAKVIM', 'CERRAHI-PRATIK'],
  },
  {
    kod: 'cer-gunluk', brans: 'estetik-cerrahi', tur: 'gunluk', baslik: 'İyileşme günlüğüm',
    aciklama: 'Her gün bir kez: ağrı, şişlik, dren ve korse. Önemli bir belirti olursa cerrahınız hemen haberdar olur.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
        { id: 'sislik', etiket: 'Şişlik', tur: 'olcek' },
        { id: 'dren', etiket: 'Dren miktarı (son 24 saat)', tur: 'sayi', min: 0, max: 2000, birim: 'mL', ayarKosulu: 'drenVar' },
        { id: 'korse', etiket: 'Korse / bası giysisi', tur: 'sayi', min: 0, max: 24, birim: 'saat' },
        { id: 'ates', etiket: 'Ateşim 38 °C veya üstü', tur: 'evet' },
        { id: 'yara', etiket: 'Yarada kızarıklık, akıntı ya da açılma', tur: 'evet' },
        { id: 'tek_sislik', etiket: 'Bir tarafta ani ve hızla artan şişlik / morarma', tur: 'evet' },
        { id: 'baldir', etiket: 'Bacakta (baldırda) tek taraflı şişlik, ağrı', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: 'Nefes darlığı ya da göğüs ağrısı acildir: hemen 112’yi arayın.', hekim: 'Post-op: nefes darlığı / göğüs ağrısı (emboli şüphesi).' },
        { id: 'baldir', kosullar: [{ alan: 'baldir', evet: true }], duzey: 'acil', hasta: 'Bacakta tek taraflı şişlik ve ağrı bugün değerlendirilmelidir: cerrahınızı arayın; ulaşamazsanız 112 / acil.', hekim: 'Post-op: tek taraflı baldır şişliği / ağrısı (DVT şüphesi).' },
        { id: 'hematom', kosullar: [{ alan: 'tek_sislik', evet: true }], duzey: 'acil', hasta: 'Bir tarafta hızla artan şişlik hemen değerlendirilmelidir: cerrahınızı şimdi arayın; ulaşamazsanız 112 / acil.', hekim: 'Post-op: ani tek taraflı artan şişlik (hematom şüphesi).' },
        { id: 'enfeksiyon', kosullar: [{ alan: 'ates', evet: true }, { alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateş ve yara bilgisini cerrahınıza ilettik. Bugün cerrahınızı arayın.', hekim: 'Post-op: ateş ≥ 38 °C + yara kızarıklık/akıntı.' },
        { id: 'agri', kosullar: [{ alan: 'agri', enAz: 8 }], duzey: 'hekime_bildir', hasta: 'Ağrınız yüksek görünüyor; bilgiyi cerrahınıza ilettik.', hekim: 'Post-op: ağrı ≥ 8/10.' },
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'dikkat', hasta: 'Ateş bilgisini cerrahınıza ilettik; sürerse bugün arayın.', hekim: 'Post-op: ateş ≥ 38 °C.' },
      ],
    },
    kaynaklar: ['CERRAHI-PRATIK', 'REPO-CERRAHI-EMBOLI'],
    ayarlar: [
      { id: 'drenVar', etiket: 'Dren var', tur: 'evet' },
      { id: 'korseSaat', etiket: 'Günlük korse hedefi (saat)', tur: 'sayi' },
    ],
  },
  {
    kod: 'cer-foto', brans: 'estetik-cerrahi', tur: 'foto', baslik: 'İyileşme fotoğraflarım',
    aciklama: 'Özel fotoğraflar — yalnız siz ve cerrahınız görür. İstediğiniz zaman silin.',
    varsayilan: { acilar: ['Ön', 'Sağ yan', 'Sol yan'], aylar: [1, 3, 6, 12] },
    kaynaklar: [],
    fotoRizaMetni: 'İyileşme fotoğraflarımın cerrahımla paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
]

// ─── Medikal estetik ────────────────────────────────────────────────────────────────────────────────────────────────
export const MEDIKAL_ESTETIK_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'est-takvim', brans: 'medikal-estetik', tur: 'zaman', baslik: 'İşlem takvimim', baslangicEtiketi: 'İşlem günü',
    aciklama: 'Kontrol ve rötuş zamanları. Tekrar işlem kararını hekiminiz verir.',
    varsayilan: {
      adimlar: [
        { gun: 1, baslik: 'İlk gün', ayrinti: 'Bakım talimatlarınıza uyun; morluk ve hafif şişlik sık görülür.' },
        { gun: 14, baslik: 'Kontrol / rötuş değerlendirmesi', ayrinti: 'Gerekirse rötuş kararı hekiminizdedir.' },
        { gun: 28, baslik: 'Sonuç değerlendirmesi', ayrinti: 'Fotoğrafla karşılaştırma.' },
        { gun: 105, baslik: 'Tekrar zamanı yaklaşabilir', ayrinti: 'Etkinin süresi kişiye ve işleme göre değişir; tekrar işlemi hekiminiz planlar.' },
      ],
    },
    kaynaklar: ['REPO-ESTETIK-TAKVIM', 'ESTETIK-PRATIK'],
  },
  {
    kod: 'est-bakim', brans: 'medikal-estetik', tur: 'liste', baslik: 'İşlem sonrası bakımım',
    aciklama: 'Hekiminizin bu işlem için bakım talimatları.',
    varsayilan: {
      maddeler: [
        'İşlem bölgesine ilk gün masaj yapmayın, bastırmayın.',
        'İlk 24 saat yoğun egzersiz, sauna, hamam ve solaryumdan kaçının.',
        'İlk saatlerde yüzüstü yatmayın (hekiminiz farklı söylemediyse).',
        'Makyaj ve cilt bakım ürünlerine dönüş için hekiminizin söylediği süreyi bekleyin.',
        'Güneşten koruyun.',
      ],
    },
    kaynaklar: ['ESTETIK-PRATIK'],
    ayarlar: [{ id: 'satirlar', etiket: 'Bu hastanın işlemine özel bakım maddeleri (şablonun yerine geçer)', tur: 'satirlar' }],
  },
  {
    kod: 'est-gunluk', brans: 'medikal-estetik', tur: 'gunluk', baslik: 'İşlem sonrası günlüğüm',
    aciklama: 'İlk günlerde işaretleyin. Önemli bir belirti olursa hekiminiz hemen haberdar olur.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
        { id: 'morluk', etiket: 'Morluk / şişlik', tur: 'olcek' },
        { id: 'renk', etiket: 'İşlem bölgesinde beyazlama, morumsu ağ görünümü ya da artan şiddetli ağrı', tur: 'evet' },
        { id: 'gorme', etiket: 'Görme bulanıklığı ya da görme kaybı', tur: 'evet' },
        { id: 'yutma', etiket: 'Yutma ya da nefes almada güçlük, göz kapağında düşme', tur: 'evet' },
        { id: 'enfeksiyon', etiket: 'Kızarıklık, ısı artışı, akıntı ya da ateş', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'gorme', kosullar: [{ alan: 'gorme', evet: true }], duzey: 'acil', hasta: 'Görme bulanıklığı ya da kaybı acildir: hemen 112’yi arayın ve hekiminize haber verin.', hekim: 'Medikal estetik sonrası: görme bulanıklığı / kaybı.' },
        { id: 'damar', kosullar: [{ alan: 'renk', evet: true }], duzey: 'acil', hasta: 'Beyazlama, morumsu ağ görünümü ya da artan şiddetli ağrı hemen değerlendirilmelidir: hekiminizi şimdi arayın; ulaşamazsanız 112 / acil.', hekim: 'Medikal estetik sonrası: beyazlama / livedo / artan ağrı (vasküler bayrak).' },
        { id: 'yutma', kosullar: [{ alan: 'yutma', evet: true }], duzey: 'acil', hasta: 'Yutma ya da nefes almada güçlük acildir: 112’yi arayın.', hekim: 'Medikal estetik sonrası: yutma / nefes güçlüğü veya pitoz.' },
        { id: 'enfeksiyon', kosullar: [{ alan: 'enfeksiyon', evet: true }], duzey: 'hekime_bildir', hasta: 'Kızarıklık ya da ateş bilgisini hekiminize ilettik. Bugün hekiminizi arayın.', hekim: 'Medikal estetik sonrası: enfeksiyon belirtisi.' },
      ],
    },
    kaynaklar: ['ESTETIK-PRATIK', 'REPO-ESTETIK-VASKULER'],
  },
]

// ─── Dermatoloji kliniği ────────────────────────────────────────────────────────────────────────────────────────────
export const KLINIK_DERMATOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'derm-foto', brans: 'klinik-dermatoloji', tur: 'foto', baslik: 'Cilt fotoğraf günlüğüm',
    aciklama: 'Takip edilen bölgenin aynı açı ve ışıkta fotoğrafı. Yorum ve değerlendirme hekiminizdedir.',
    varsayilan: { acilar: ['Bölge (yakın)', 'Bölge (uzak)'], not: 'Gün ışığında, flaşsız; her seferinde aynı mesafeden.' },
    kaynaklar: ['REPO-DERM-FOTO'],
    fotoRizaMetni: 'Cilt fotoğraflarımın hekimimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
  {
    kod: 'derm-uyum', brans: 'klinik-dermatoloji', tur: 'gunluk', baslik: 'Tedavi günlüğüm',
    aciklama: 'Tedavinizi uyguladığınız günleri ve cildinizin nasıl hissettiğini işaretleyin.',
    varsayilan: {
      alanlar: [
        { id: 'uyguladim', etiket: 'Tedavimi bugün uyguladım', tur: 'evet' },
        { id: 'gunes', etiket: 'Güneş koruyucu kullandım', tur: 'evet' },
        { id: 'tahris', etiket: 'Kuruluk / tahriş', tur: 'olcek' },
        { id: 'kasinti', etiket: 'Kaşıntı', tur: 'olcek' },
      ],
    },
    kaynaklar: ['REPO-DERM-TAKVIM'],
  },
  {
    kod: 'derm-izotretinoin', brans: 'klinik-dermatoloji', tur: 'hatirlatma', baslik: 'Tedavi izlem hatırlatmalarım',
    aciklama: 'Hekiminizin bu tedavi için planladığı tahlil ve kontrol hatırlatmaları.',
    varsayilanKapali: true,
    varsayilan: {
      maddeler: [
        'Hekiminizin istediği kan tahlillerini planlanan tarihlerde yaptırın.',
        'Gebelik olasılığı olan hastalarda hekiminizin planladığı gebelik testleri ve korunma tedavi boyunca ve sonrasında sürer.',
        'Ruh hâlinizde değişiklik fark ederseniz hekiminize hemen yazın. Kendinize zarar verme düşünceleri olursa 112’yi arayın.',
        'Dudak ve cilt kuruluğu için hekiminizin önerdiği bakım.',
      ],
      alanlar: [
        { id: 'ruh', etiket: 'Ruh hâlimde belirgin kötüleşme', tur: 'evet' },
        { id: 'zarar', etiket: 'Kendime zarar verme düşünceleri', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'zarar', kosullar: [{ alan: 'zarar', evet: true }], duzey: 'acil', hasta: 'Yalnız değilsiniz. Kendinize zarar verme düşünceleri acildir: şimdi 112’yi arayın ya da en yakın acile gidin.', hekim: 'İzotretinoin izlemi: kendine zarar düşüncesi bildirdi.' },
        { id: 'ruh', kosullar: [{ alan: 'ruh', evet: true }], duzey: 'hekime_bildir', hasta: 'Ruh hâlinizle ilgili bilgiyi hekiminize ilettik; hekiminiz sizinle iletişime geçebilir.', hekim: 'İzotretinoin izlemi: belirgin ruh hâli kötüleşmesi.' },
      ],
    },
    kaynaklar: ['MHRA-ISOTRETINOIN', 'TITCK-ISOTRETINOIN-DOGRULANAMADI'],
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel izlem satırları (ör. "Kan tahlili — 15 Ocak"; doz yazılmaz)', tur: 'satirlar' }],
  },
]
