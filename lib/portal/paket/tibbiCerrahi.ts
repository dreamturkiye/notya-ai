/**
 * BRANS-PAKETI Phase 2 batch (b) — surgical branşlar: genel cerrahi, ortopedi, beyin cerrahisi, göğüs cerrahisi,
 * plastik cerrahi, kalp-damar cerrahisi, üroloji, KBB, göz, çocuk cerrahisi, anestezi.
 * Pattern: a post-op timeline that opens when the doctor enters the operation day (`baslangicGerekli`) + a recovery
 * diary that follows that date (`baslangicModulu`) and closes after recovery (`sonGun`); shared post-op red flags
 * (lib/portal/paket/ortak.ts) plus the branş's own (neuro deficit, flap colour, bleeding after tonsillectomy, sudden
 * vision loss…). Pre-procedure timelines use negative days (anestezi, radyoloji, kolonoskopi). Fasting hours are the
 * doctor's own settings, never written into a template. Physician-accepted templates; no diagnosis, no dose.
 */
import type { PaketAdim, PaketAlan, PaketAyarAlani, PaketBayrak, PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, ANAFILAKSI_ALANI, ANAFILAKSI_BAYRAGI, POSTOP_ALANLAR, POSTOP_BAYRAKLAR } from './ortak'

interface PostopGirdi {
  brans: PaketModulTanimi['brans']
  onek: string
  baslik?: string
  aciklama?: string
  adimlar: PaketAdim[]
  ekAlanlar?: PaketAlan[]
  ekBayraklar?: PaketBayrak[]
  ayarlar?: PaketAyarAlani[]
  sonGun?: number
  not?: string
  kaynaklar: string[]
}

/** The post-op timeline + recovery diary pair every surgical branş shares (one look, one set of shared flags). */
function postop(o: PostopGirdi): PaketModulTanimi[] {
  const zaman = `${o.onek}-zaman`
  return [
    {
      kod: zaman, brans: o.brans, tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Ameliyat günü',
      baslik: o.baslik || 'Ameliyat sonrası gün gün',
      aciklama: o.aciklama || 'Ameliyat gününüzden itibaren her gün ne yapacağınız. Hekiminizin size özel talimatı her zaman önce gelir.',
      varsayilan: { adimlar: o.adimlar, ...(o.not ? { not: o.not } : {}) },
      kaynaklar: o.kaynaklar,
    },
    {
      kod: `${o.onek}-iyilesme`, brans: o.brans, tur: 'gunluk', baslangicModulu: zaman, baslangicGerekli: true, sonGun: o.sonGun ?? 42,
      baslik: 'İyileşme günlüğüm',
      aciklama: 'Her gün bir dakika. Tehlike işaretlerinden birini seçerseniz ne yapacağınızı hemen gösterir; ateşinizi Bugün sayfasına da girebilirsiniz.',
      varsayilan: { alanlar: [...POSTOP_ALANLAR, ...(o.ekAlanlar || [])], bayraklar: [...(o.ekBayraklar || []), ...POSTOP_BAYRAKLAR] },
      ...(o.ayarlar ? { ayarlar: o.ayarlar } : {}),
      kaynaklar: o.kaynaklar,
    },
  ]
}

// ─── Genel cerrahi ──────────────────────────────────────────────────────────────────────────────────────────────────
export const GENEL_CERRAHI_PAKETI: readonly PaketModulTanimi[] = postop({
  brans: 'genel-cerrahi', onek: 'gc',
  adimlar: [
    { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Hekiminizin izin verdiği ilk fırsatta yataktan kalkıp kısa yürüyüşler yapın; derin nefes egzersizleri akciğerlerinizi korur.' },
    { gun: 1, baslik: 'Beslenmeye dönüş', ayrinti: 'Hekiminizin önerisine göre sıvılardan başlayıp normal beslenmeye geçin. Gaz çıkarmak bağırsakların çalıştığını gösterir.' },
    { gun: 2, baslik: 'Yara bakımı', ayrinti: 'Pansumanı hekiminizin tarif ettiği şekilde koruyun; duş izni için hekiminize sorun.' },
    { gun: 7, baslik: 'Kontrol ve dikişler', ayrinti: 'Dikiş ya da zımbalar çoğunlukla 7–14. günlerde alınır; randevunuzu kontrol edin.' },
    { gun: 14, baslik: 'Hafif aktivite', ayrinti: 'Yürüyüşleri artırın. Ağır kaldırma ve karın kaslarını zorlayan hareketler için hekiminizin onayını bekleyin.' },
    { gun: 28, baslik: 'Günlük hayata dönüş', ayrinti: 'Masa başı işe dönüş çoğu ameliyattan sonra bu dönemde mümkündür; hekiminize sorun.' },
    { gun: 42, baslik: 'Altıncı hafta', ayrinti: 'Spor ve ağır işe dönüş bu dönemde hekiminizle konuşulur.' },
  ],
  ekAlanlar: [
    { id: 'gaz', etiket: 'Gaz ve dışkı çıkaramıyorum, karnım şişti ve kusuyorum', tur: 'evet' },
    { id: 'dren', etiket: 'Dren miktarı', tur: 'sayi', min: 0, max: 2000, birim: 'ml', ayarKosulu: 'drenVar' },
  ],
  ekBayraklar: [
    { id: 'gaz', kosullar: [{ alan: 'gaz', evet: true }], duzey: 'acil', hasta: `Gaz-dışkı çıkaramamak, şişlik ve kusma bağırsak tıkanıklığı olabilir: ${ACIL_112}`, hekim: 'Ameliyat sonrası günlük: gaz-gaita çıkışı yok + distansiyon + kusma (ileus / obstrüksiyon?).' },
  ],
  ayarlar: [{ id: 'drenVar', etiket: 'Hastada dren var (günlükte dren miktarı sorulsun)', tur: 'evet' }],
  kaynaklar: ['ERAS-SOCIETY', 'TCD'],
})

// ─── Ortopedi ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const ORTOPEDI_PAKETI: readonly PaketModulTanimi[] = [
  ...postop({
    brans: 'ortopedi', onek: 'ort', sonGun: 90,
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Ameliyatlı kolunuzu ya da bacağınızı hekiminizin söylediği şekilde yüksekte tutun; ayak bileği pompalama hareketlerine başlayın.' },
      { gun: 1, baslik: 'Hareketlenme', ayrinti: 'Fizyoterapistinizin gösterdiği şekilde yardımcı cihazla (koltuk değneği, yürüteç) yürüyün; ne kadar yük vereceğinizi hekiminiz belirler.' },
      { gun: 3, baslik: 'Şişlik ve soğuk uygulama', ayrinti: 'Şişlik için soğuk uygulamayı bir beze sararak 15–20 dakika yapın; doğrudan cilde koymayın.' },
      { gun: 14, baslik: 'Dikiş kontrolü', ayrinti: 'Yara kontrolü ve dikişlerin alınması. Ev egzersizlerinizi sürdürün.' },
      { gun: 21, baslik: 'Egzersizleri artırma', ayrinti: 'Hareket açıklığı ve kas gücü egzersizleri hekiminizin ya da fizyoterapistinizin planına göre artar.' },
      { gun: 42, baslik: 'Altıncı hafta kontrolü', ayrinti: 'Röntgen ve yük verme kararı. Araç kullanmaya dönüşü hekiminize sorun.' },
      { gun: 90, baslik: 'Üçüncü ay', ayrinti: 'Güçlendirme ve günlük aktivitelere tam dönüş; spor için hekiminizin onayı.' },
    ],
    ekAlanlar: [
      { id: 'hareket', etiket: 'Hareket kolaylığı (0 çok zor – 10 çok kolay)', tur: 'olcek' },
      { id: 'dolasim', etiket: 'Ameliyatlı kol / bacakta uyuşma, solukluk ya da morarma; alçı çok sıkı', tur: 'evet' },
    ],
    ekBayraklar: [
      { id: 'dolasim', kosullar: [{ alan: 'dolasim', evet: true }], duzey: 'acil', hasta: `Uyuşma, solukluk ya da morarma dolaşım sorunu olabilir; beklemeden ${ACIL_112}`, hekim: 'Ortopedi günlüğü: nörovasküler bulgu / sıkı alçı (kompartman?).' },
    ],
    kaynaklar: ['TOTBID', 'NICE-NG157'],
  }),
  {
    kod: 'ort-egzersiz', brans: 'ortopedi', tur: 'program', baslangicModulu: 'ort-zaman', baslangicGerekli: true, sonGun: 120, baslik: 'Ev egzersiz programım',
    aciklama: 'Hekiminizin ya da fizyoterapistinizin verdiği egzersizler. Ağrısız sınırda yapın ve işaretleyin.',
    varsayilan: {
      maddeler: [
        'Ayak bileği pompalama (gün içinde sık sık)',
        'Uyluk kasını sıkma (diz düz)',
        'Topuk kaydırma (dizi yavaşça bükme)',
        'Düz bacak kaldırma',
      ],
      not: 'Hekiminiz satırları ameliyatınıza göre değiştirir. Keskin ya da artan ağrıda egzersizi bırakın.',
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel egzersiz satırları (tekrar ve süre yazılabilir)', tur: 'satirlar' }],
    kaynaklar: ['TOTBID'],
  },
  {
    kod: 'ort-alci', brans: 'ortopedi', tur: 'liste', varsayilanKapali: true, baslik: 'Alçı ve atel bakımım',
    aciklama: 'Alçı ya da atel takılıyken dikkat edilecekler.',
    varsayilan: {
      maddeler: [
        'Alçıyı ıslatmayın; duşta su geçirmez kılıf kullanın.',
        'Alçının içine bir şey sokmayın, kaşımayın.',
        'Parmaklarınızı sık sık oynatın; ilk günler yüksekte tutun.',
        'Parmaklarda morarma, soğukluk, uyuşma, artan ağrı ya da alçının çok sıkması: hemen acile başvurun ya da 112’yi arayın.',
      ],
    },
    kaynaklar: ['TOTBID'],
  },
]

// ─── Beyin cerrahisi ────────────────────────────────────────────────────────────────────────────────────────────────
export const BEYIN_CERRAHISI_PAKETI: readonly PaketModulTanimi[] = postop({
  brans: 'beyin-cerrahisi', onek: 'bc',
  adimlar: [
    { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Yakın izlem altındasınız. Ağrı, bulantı ya da yeni bir şikâyeti hemen ekibe söyleyin.' },
    { gun: 1, baslik: 'İlk yürüyüş', ayrinti: 'Hekiminizin izniyle, yardım alarak kısa yürüyüşler yapın.' },
    { gun: 3, baslik: 'Taburculuğa hazırlık', ayrinti: 'Yaranızı kuru tutun; hekiminiz izin verene kadar yarayı ıslatmayın.' },
    { gun: 10, baslik: 'Dikiş kontrolü', ayrinti: 'Yara kontrolü ve dikişlerin alınması.' },
    { gun: 14, baslik: 'Hafif aktivite', ayrinti: 'Eğilme, ağır kaldırma ve araç kullanma için hekiminizin onayını bekleyin.' },
    { gun: 42, baslik: 'Altıncı hafta kontrolü', ayrinti: 'İşe ve sporlara dönüş hekiminizle konuşulur.' },
  ],
  ekAlanlar: [
    { id: 'noro', etiket: 'Yeni güçsüzlük, uyuşma, konuşma ya da görme bozukluğu', tur: 'evet' },
    { id: 'basagri', etiket: 'Giderek artan baş ağrısı, kusma ya da uykuya eğilim', tur: 'evet' },
    { id: 'nobet', etiket: 'Nöbet', tur: 'evet' },
    { id: 'kacirma', etiket: 'İdrar ya da dışkı kaçırma, kasıklarda uyuşma', tur: 'evet' },
    { id: 'berrak', etiket: 'Yaradan ya da burundan berrak, su gibi sıvı gelmesi', tur: 'evet' },
  ],
  ekBayraklar: [
    { id: 'noro', kosullar: [{ alan: 'noro', evet: true }], duzey: 'acil', hasta: `Yeni güçsüzlük, uyuşma ya da konuşma bozukluğu acildir: ${ACIL_112}`, hekim: 'Beyin cerrahisi günlüğü: yeni nörolojik defisit.' },
    { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'acil', hasta: `Artan baş ağrısı, kusma ya da uyku hali acildir: ${ACIL_112}`, hekim: 'Beyin cerrahisi günlüğü: artan baş ağrısı / kusma / bilinç (KİBAS?).' },
    { id: 'nobet', kosullar: [{ alan: 'nobet', evet: true }], duzey: 'acil', hasta: `Nöbet geçiren kişiyi yan yatırın ve ${ACIL_112}`, hekim: 'Beyin cerrahisi günlüğü: nöbet.' },
    { id: 'kacirma', kosullar: [{ alan: 'kacirma', evet: true }], duzey: 'acil', hasta: `İdrar ya da dışkı kaçırma ve kasıkta uyuşma acildir: ${ACIL_112}`, hekim: 'Beyin cerrahisi günlüğü: sfinkter kaybı / eyer anestezisi (kauda ekina?).' },
    { id: 'berrak', kosullar: [{ alan: 'berrak', evet: true }], duzey: 'hekime_bildir', hasta: 'Berrak sıvı gelmesini hekiminize ilettik; bugün ulaşın. Baş ağrısı ve ateş eklenirse acile gidin.', hekim: 'Beyin cerrahisi günlüğü: berrak sızıntı (BOS kaçağı?).' },
  ],
  kaynaklar: ['TNCD'],
})

// ─── Göğüs cerrahisi ────────────────────────────────────────────────────────────────────────────────────────────────
export const GOGUS_CERRAHISI_PAKETI: readonly PaketModulTanimi[] = [
  ...postop({
    brans: 'gogus-cerrahisi', onek: 'gcs',
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Solunum egzersizi cihazınızı (triflo) uyanık olduğunuz her saat kullanın; öksürürken yastıkla göğsünüzü destekleyin.' },
      { gun: 1, baslik: 'Hareketlenme', ayrinti: 'Hekiminizin izniyle yürüyün; yürümek akciğerinizin açılmasına yardım eder.' },
      { gun: 3, baslik: 'Dren', ayrinti: 'Göğüs tüpü hekiminizin kararıyla çekilir; tüp yerini kuru tutun.' },
      { gun: 7, baslik: 'Evde ilk hafta', ayrinti: 'Solunum egzersizlerini ve yürüyüşleri sürdürün. Ameliyat tarafındaki omzunuzu hareket ettirin.' },
      { gun: 14, baslik: 'Dikiş ve kontrol', ayrinti: 'Yara kontrolü ve dikişlerin alınması.' },
      { gun: 42, baslik: 'Altıncı hafta', ayrinti: 'Ağır kaldırma, spor ve işe dönüş hekiminizle konuşulur.' },
    ],
    ekAlanlar: [
      { id: 'cilt', etiket: 'Göğüs ya da boyun derisinin altında çıtırtı ve artan şişlik', tur: 'evet' },
      { id: 'kan', etiket: 'Öksürükle bir kaşıktan fazla kan gelmesi', tur: 'evet' },
    ],
    ekBayraklar: [
      { id: 'kan', kosullar: [{ alan: 'kan', evet: true }], duzey: 'acil', hasta: `Öksürükle kan gelmesi acildir: ${ACIL_112}`, hekim: 'Göğüs cerrahisi günlüğü: hemoptizi.' },
      { id: 'cilt', kosullar: [{ alan: 'cilt', evet: true }], duzey: 'hekime_bildir', hasta: 'Derideki çıtırtıyı hekiminize ilettik; bugün ulaşın. Nefes darlığı eklenirse 112’yi arayın.', hekim: 'Göğüs cerrahisi günlüğü: cilt altı amfizem artışı.' },
    ],
    kaynaklar: ['ERAS-TORASIK-2019', 'TGCD'],
  }),
  {
    kod: 'gcs-solunum', brans: 'gogus-cerrahisi', tur: 'program', baslangicModulu: 'gcs-zaman', baslangicGerekli: true, sonGun: 42, baslik: 'Solunum egzersizlerim',
    aciklama: 'Akciğerinizin açılması için günlük egzersizler. Yaptıkça işaretleyin.',
    varsayilan: {
      maddeler: [
        'Triflo egzersizi (uyanıkken her saat)',
        'Derin nefes ve destekli öksürük',
        'Ameliyat tarafında omuz hareketleri',
        'Gün içinde en az üç kısa yürüyüş',
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel egzersiz satırları', tur: 'satirlar' }],
    kaynaklar: ['ERAS-TORASIK-2019'],
  },
]

// ─── Plastik cerrahi ────────────────────────────────────────────────────────────────────────────────────────────────
export const PLASTIK_CERRAHI_PAKETI: readonly PaketModulTanimi[] = [
  ...postop({
    brans: 'plastik-cerrahi', onek: 'pla',
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Ameliyat bölgesini hekiminizin söylediği şekilde yüksekte tutun; pansumana dokunmayın.' },
      { gun: 2, baslik: 'İlk pansuman', ayrinti: 'Pansuman hekiminizin planına göre değiştirilir. Flep ya da greft bölgesine bası yapmayın.' },
      { gun: 7, baslik: 'Yara kontrolü', ayrinti: 'Dikiş ve greft kontrolü. Sigara içmeyin; iyileşmeyi belirgin şekilde bozar.' },
      { gun: 14, baslik: 'Dikişlerin alınması', ayrinti: 'Çoğu dikiş bu dönemde alınır. Yara izini güneşten koruyun.' },
      { gun: 42, baslik: 'Altıncı hafta', ayrinti: 'İz bakımı (masaj, silikon) için hekiminizin önerisini uygulayın.' },
    ],
    ekAlanlar: [{ id: 'flep', etiket: 'Flep ya da greft bölgesinde koyulaşma, morarma ya da solukluk', tur: 'evet' }],
    ekBayraklar: [
      { id: 'flep', kosullar: [{ alan: 'flep', evet: true }], duzey: 'acil', hasta: `Flep ya da greft renginin değişmesi saatler içinde müdahale gerektirebilir: hemen hekiminizi arayın; ulaşamıyorsanız ${ACIL_112}`, hekim: 'Plastik cerrahi günlüğü: flep / greft renk değişikliği (dolaşım bozukluğu?).' },
    ],
    kaynaklar: ['TPRECD'],
  }),
  {
    kod: 'pla-foto', brans: 'plastik-cerrahi', tur: 'foto', serbestEtiket: true, baslik: 'Yara fotoğraf günlüğüm',
    aciklama: 'Yaranın aynı mesafe ve ışıkta fotoğrafı. Bölgenin adını yazın; değerlendirme hekiminizdedir.',
    varsayilan: { acilar: ['Yakın', 'Uzak'], not: 'Gün ışığında, flaşsız; pansuman açıkken ve yalnız hekiminiz izin verdiyse çekin.' },
    kaynaklar: ['TPRECD'],
    fotoRizaMetni: 'Yara fotoğraflarımın hekimimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
]

// ─── Kalp ve damar cerrahisi ────────────────────────────────────────────────────────────────────────────────────────
export const KALP_DAMAR_CERRAHISI_PAKETI: readonly PaketModulTanimi[] = [
  ...postop({
    brans: 'kalp-damar-cerrahisi', onek: 'kdc', sonGun: 90,
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Yoğun bakımda yakın izlemdesiniz.' },
      { gun: 1, baslik: 'Servise geçiş', ayrinti: 'Solunum egzersizleri ve kısa yürüyüşler başlar.' },
      { gun: 5, baslik: 'Taburculuk', ayrinti: 'Yaralarınızı kuru ve temiz tutun; günlük kısa yürüyüşleri sürdürün.' },
      { gun: 7, baslik: 'Göğüs kemiğini koruma', ayrinti: 'Kollarınızla ağır kaldırmayın, itme-çekme yapmayın; öksürürken yastığa sarılın.' },
      { gun: 14, baslik: 'Dikiş kontrolü', ayrinti: 'Göğüs ve bacak yaralarının kontrolü.' },
      { gun: 42, baslik: 'Altıncı hafta', ayrinti: 'Araç kullanma ve hafif işe dönüş hekiminizle konuşulur. Kalp rehabilitasyonu programı için hekiminize sorun.' },
      { gun: 90, baslik: 'Üçüncü ay', ayrinti: 'Göğüs kemiği büyük ölçüde iyileşmiştir; ağır işler hekiminizin onayıyla.' },
    ],
    ekAlanlar: [
      { id: 'sternum', etiket: 'Göğüs kemiğinde tıkırtı ya da hareket hissi', tur: 'evet' },
      { id: 'carpinti', etiket: 'Çarpıntı ya da düzensiz kalp atımı', tur: 'evet' },
    ],
    ekBayraklar: [
      { id: 'sternum', kosullar: [{ alan: 'sternum', evet: true }], duzey: 'hekime_bildir', hasta: 'Göğüs kemiğindeki hissi hekiminize ilettik; bugün ulaşın.', hekim: 'KDC günlüğü: sternal instabilite hissi.' },
      { id: 'carpinti', kosullar: [{ alan: 'carpinti', evet: true }], duzey: 'hekime_bildir', hasta: 'Çarpıntıyı hekiminize ilettik. Nabzınızı Bugün sayfasına girin; bayılma ya da göğüs ağrısı eklenirse 112’yi arayın.', hekim: 'KDC günlüğü: çarpıntı / düzensiz ritim (postop AF?).' },
    ],
    kaynaklar: ['TKDCD', 'ESC-EACTS'],
  }),
  {
    kod: 'kdc-yuruyus', brans: 'kalp-damar-cerrahisi', tur: 'gunluk', durum: { tani: /periferik arter|klodikasyon|bacak damar/i, icd: /^(I70\.2|I73\.9)/ }, baslik: 'Yürüme günlüğüm',
    aciklama: 'Ağrısız yürüyebildiğiniz mesafeyi kaydedin. Düzenli yürüyüş bacak dolaşımını geliştirir.',
    varsayilan: {
      alanlar: [
        { id: 'mesafe', etiket: 'Ağrı başlamadan yürüdüğüm mesafe', tur: 'sayi', min: 0, max: 20000, birim: 'metre' },
        { id: 'sure', etiket: 'Toplam yürüyüş süresi', tur: 'sayi', min: 0, max: 300, birim: 'dakika' },
        { id: 'istirahat', etiket: 'Dinlenirken ayakta ağrı, soğukluk, renk değişikliği ya da yeni yara', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'istirahat', kosullar: [{ alan: 'istirahat', evet: true }], duzey: 'acil', hasta: `Dinlenirken ayakta ağrı, soğukluk ya da renk değişikliği dolaşımın kesildiğini gösterebilir: ${ACIL_112}`, hekim: 'Yürüme günlüğü: istirahat ağrısı / soğukluk / renk değişikliği (kritik iskemi?).' },
      ],
      not: 'Hekiminizin önerisine göre ağrı başlayınca kısa dinlenip yürümeye devam edin. Sigara bacak damarlarının en büyük düşmanıdır.',
    },
    kaynaklar: ['ESC-PAAD-2024', 'TKDCD'],
  },
]

// ─── Üroloji ────────────────────────────────────────────────────────────────────────────────────────────────────────
export const UROLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'uro-isem', brans: 'uroloji', tur: 'gunluk', varsayilanKapali: true, baslik: 'İşeme günlüğüm',
    aciklama: 'Hekiminizin istediği günlerde idrara çıkma sayınızı ve içtiğiniz sıvıyı kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'gunduz', etiket: 'Gündüz idrara çıkma sayısı', tur: 'sayi', min: 0, max: 50 },
        { id: 'gece', etiket: 'Gece idrara kalkma sayısı', tur: 'sayi', min: 0, max: 20 },
        { id: 'sivi', etiket: 'İçtiğim sıvı', tur: 'sayi', min: 0, max: 30, birim: 'bardak' },
        { id: 'sikisma', etiket: 'Sıkışma hissi', tur: 'olcek' },
        { id: 'kacirma', etiket: 'İdrar kaçırdım', tur: 'evet' },
        { id: 'kan', etiket: 'İdrarda kan', tur: 'evet' },
        { id: 'yapamama', etiket: 'İdrar yapamıyorum, mesanem dolu ve ağrılı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'yapamama', kosullar: [{ alan: 'yapamama', evet: true }], duzey: 'acil', hasta: `İdrar yapamamak acildir: en yakın acil servise gidin ya da ${ACIL_112}`, hekim: 'İşeme günlüğü: akut idrar retansiyonu.' },
        { id: 'kan', kosullar: [{ alan: 'kan', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrardaki kanı hekiminize ilettik; değerlendirilmesi gerekir. Pıhtı nedeniyle idrar yapamazsanız acile gidin.', hekim: 'İşeme günlüğü: hematüri.' },
      ],
    },
    kaynaklar: ['EAU-ASUS', 'TUD'],
  },
  {
    kod: 'uro-tas', brans: 'uroloji', tur: 'gunluk', durum: { tani: /ta[sş]|nefrolit|[uü]rolit|üreter/i, icd: /^(N20|N23)/ }, baslik: 'Taş ağrısı günlüğüm',
    aciklama: 'Böbrek ya da idrar yolu taşında ağrıyı ve uyarı işaretlerini kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Yan ağrısı', tur: 'olcek' },
        { id: 'ates', etiket: '38 °C ve üzeri ateş ya da titreme', tur: 'evet' },
        { id: 'kusma', etiket: 'Kusma nedeniyle sıvı alamıyorum', tur: 'evet' },
        { id: 'dustu', etiket: 'Taş düştü', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'acil', hasta: `Taş ağrısıyla birlikte ateş ya da titreme, tıkalı böbrekte enfeksiyon olabilir: ${ACIL_112}`, hekim: 'Taş günlüğü: ateş / titreme (obstrüktif piyelonefrit?).' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Sıvı alamadığınızı hekiminize ilettik; bugün ulaşın ya da acile gidin.', hekim: 'Taş günlüğü: oral alım yok.' },
        { id: 'agri', kosullar: [{ alan: 'agri', enAz: 8 }], duzey: 'hekime_bildir', hasta: 'Şiddetli ağrınızı hekiminize ilettik. Ağrı kesiciyle geçmiyorsa acile başvurun.', hekim: 'Taş günlüğü: ağrı ≥ 8/10.' },
      ],
      not: 'Düşen taşı saklayıp kontrolde hekiminize getirin; analizi tekrarlamayı önlemeye yardım eder.',
    },
    kaynaklar: ['EAU-TAS', 'TUD'],
  },
  {
    kod: 'uro-sonda', brans: 'uroloji', tur: 'liste', varsayilanKapali: true, baslik: 'Sonda bakımım',
    aciklama: 'Sonda takılıyken enfeksiyonu önlemek için.',
    varsayilan: {
      maddeler: [
        'Sondaya dokunmadan önce ve sonra ellerinizi yıkayın.',
        'Torbayı mesane seviyesinin altında tutun, hortumu bükmeyin.',
        'Torbayı yere değdirmeyin; dolunca boşaltın.',
        'Sonda giriş yerini her gün su ve sabunla nazikçe temizleyin.',
        'Sondadan idrar gelmiyor ve karın ağrısı varsa ya da ateş, titreme olursa hekiminize hemen ulaşın.',
      ],
    },
    kaynaklar: ['EAU-ASUS', 'SB-ENFEKSIYON-KONTROL'],
  },
]

// ─── Kulak burun boğaz ──────────────────────────────────────────────────────────────────────────────────────────────
export const KBB_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'kbb-acil', brans: 'kulak-burun-bogaz', tur: 'liste', baslik: 'Beklemeden başvurun',
    aciklama: 'Kulak, burun ve boğazla ilgili hemen değerlendirilmesi gereken durumlar.',
    varsayilan: {
      maddeler: [
        'Bir kulakta aniden başlayan işitme kaybı ya da tıkanıklık hissi: aynı gün KBB hekimine ya da acile.',
        'Yüzün bir yarısında ani güçsüzlük (yüz felci): aynı gün.',
        'Konuşma bozukluğu ya da güçsüzlükle birlikte şiddetli baş dönmesi: 112.',
        'Nefes almayı ya da yutmayı zorlaştıran boğaz şişliği: 112.',
      ],
    },
    kaynaklar: ['AAO-HNS-ANI-ISITME-2019', 'TKBB'],
  },
  ...postop({
    brans: 'kulak-burun-bogaz', onek: 'kbb-tonsil', sonGun: 21, baslik: 'Bademcik ameliyatı sonrası',
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Soğuk, yumuşak yiyecekler ve bol sıvı. Ağrı kesiciyi hekiminizin tarif ettiği saatlerde düzenli kullanın.' },
      { gun: 1, baslik: 'Sıvı almayı sürdürün', ayrinti: 'Yutmak acıtsa da sık sık sıvı almak iyileşmeyi hızlandırır ve kanamayı azaltır.' },
      { gun: 3, baslik: 'Kulak ağrısı', ayrinti: 'Boğazdan kulağa yansıyan ağrı sık görülür ve geçicidir.' },
      { gun: 5, baslik: 'Beyaz örtü', ayrinti: 'Ameliyat yerinde beyaz-sarı örtü iyileşmenin parçasıdır; ağız kokusu olabilir.' },
      { gun: 7, baslik: 'Kabukların düştüğü günler', ayrinti: '5–10. günler arasında kabuklar düşerken kanama olasılığı artar; ağır aktiviteden kaçının.' },
      { gun: 14, baslik: 'İyileşme', ayrinti: 'Normal beslenmeye ve günlük hayata dönüş.' },
    ],
    ekAlanlar: [
      { id: 'kanama', etiket: 'Ağızdan taze kan gelmesi (tükürükte ince çizgiden fazla)', tur: 'evet' },
      { id: 'sivi', etiket: 'Sıvı alamıyorum ya da idrar azaldı', tur: 'evet' },
    ],
    ekBayraklar: [
      { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Bademcik ameliyatından sonra kanama acildir: oturun, kanı yutmayın, tükürün ve hemen ${ACIL_112}`, hekim: 'Tonsillektomi günlüğü: postoperatif kanama.' },
      { id: 'sivi', kosullar: [{ alan: 'sivi', evet: true }], duzey: 'hekime_bildir', hasta: 'Sıvı alamadığınızı hekiminize ilettik; bugün ulaşın.', hekim: 'Tonsillektomi günlüğü: yetersiz oral alım.' },
    ],
    kaynaklar: ['AAO-HNS-TONSIL-2019', 'TKBB'],
  }),
  ...postop({
    brans: 'kulak-burun-bogaz', onek: 'kbb-burun', sonGun: 30, baslik: 'Burun ve sinüs ameliyatı sonrası',
    adimlar: [
      { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Başınızı yüksekte tutun. Burnunuzu sümkürmeyin; hapşırırken ağzınızı açın.' },
      { gun: 1, baslik: 'Burun yıkama', ayrinti: 'Burun yıkamaya hekiminizin önerdiği zaman ve yöntemle başlayın.' },
      { gun: 7, baslik: 'Tampon ve atel kontrolü', ayrinti: 'Tampon ya da atel hekiminizin planına göre çıkarılır.' },
      { gun: 14, baslik: 'Kabuklar azalıyor', ayrinti: 'Burun tıkanıklığı ve kabuklanma giderek azalır; yıkamayı sürdürün.' },
      { gun: 30, baslik: 'Bir ay', ayrinti: 'Spor ve uçak yolculuğu için hekiminizin onayını alın.' },
    ],
    ekAlanlar: [
      { id: 'kanama', etiket: 'Durmayan burun kanaması', tur: 'evet' },
      { id: 'goz', etiket: 'Göz çevresinde şişlik ya da görme bozukluğu', tur: 'evet' },
      { id: 'berrak', etiket: 'Burundan tek taraflı, berrak su gibi akıntı', tur: 'evet' },
    ],
    ekBayraklar: [
      { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Durmayan burun kanamasında öne eğilip burnun yumuşak kısmını sıkın ve ${ACIL_112}`, hekim: 'Burun ameliyatı günlüğü: durmayan epistaksis.' },
      { id: 'goz', kosullar: [{ alan: 'goz', evet: true }], duzey: 'acil', hasta: `Göz çevresinde şişlik ya da görme bozukluğu acildir: ${ACIL_112}`, hekim: 'Burun ameliyatı günlüğü: orbital bulgu.' },
      { id: 'berrak', kosullar: [{ alan: 'berrak', evet: true }], duzey: 'hekime_bildir', hasta: 'Berrak akıntıyı hekiminize ilettik; bugün ulaşın.', hekim: 'Burun ameliyatı günlüğü: tek taraflı berrak rinore (BOS kaçağı?).' },
    ],
    kaynaklar: ['EPOS-2020', 'TKBB'],
  }),
  {
    kod: 'kbb-yikama', brans: 'kulak-burun-bogaz', tur: 'program', varsayilanKapali: true, baslik: 'Burun yıkama programım',
    aciklama: 'Hekiminizin önerdiği burun yıkama. Yaptıkça işaretleyin.',
    varsayilan: { maddeler: ['Sabah burun yıkama', 'Akşam burun yıkama'], not: 'Kaynamış ve ılıtılmış ya da steril su kullanın; şişeyi her kullanımdan sonra yıkayıp kurutun.' },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel satırlar', tur: 'satirlar' }],
    kaynaklar: ['EPOS-2020'],
  },
]

// ─── Göz hastalıkları ───────────────────────────────────────────────────────────────────────────────────────────────
export const GOZ_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'goz-zaman', brans: 'goz-hastaliklari', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Ameliyat günü', baslik: 'Göz ameliyatı sonrası gün gün',
    aciklama: 'Ameliyat gününüzden itibaren her gün ne yapacağınız. Hekiminizin size özel talimatı her zaman önce gelir.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Göz kapağını ya da koruyucuyu çıkarmayın; dinlenin.' },
        { gun: 1, baslik: 'İlk kontrol ve damlalar', ayrinti: 'Damlalarınızı hekiminizin çizelgesine göre başlayın; iki damla arasında birkaç dakika bekleyin.' },
        { gun: 7, baslik: 'İlk hafta', ayrinti: 'Gözünüzü ovmayın, geceleri koruyucu takın. Havuz, deniz ve göz makyajından kaçının.' },
        { gun: 28, baslik: 'Bir ay', ayrinti: 'Damlaların azaltılma planı hekiminizdedir; kendiniz bırakmayın.' },
        { gun: 42, baslik: 'Gözlük ölçüsü', ayrinti: 'Yeni gözlük ölçüsü genellikle bu dönemde alınır.' },
      ],
    },
    kaynaklar: ['TOD', 'RCOPHTH-KATARAKT'],
  },
  {
    kod: 'goz-iyilesme', brans: 'goz-hastaliklari', tur: 'gunluk', baslangicModulu: 'goz-zaman', baslangicGerekli: true, sonGun: 42, baslik: 'Göz iyileşme günlüğüm',
    aciklama: 'Her gün bir dakika. Tehlike işaretlerinden birini seçerseniz ne yapacağınızı hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'damla', etiket: 'Damlalarımı çizelgeye göre kullandım', tur: 'evet' },
        { id: 'rahatsizlik', etiket: 'Batma ya da rahatsızlık', tur: 'olcek' },
        { id: 'gorme', etiket: 'Görmede ani azalma', tur: 'evet' },
        { id: 'agri', etiket: 'Giderek artan göz ağrısı', tur: 'evet' },
        { id: 'perde', etiket: 'Işık çakması, uçuşan cisimlerde artış ya da görme alanına perde inmesi', tur: 'evet' },
        { id: 'kizariklik', etiket: 'Artan kızarıklık ya da akıntı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'gorme', kosullar: [{ alan: 'gorme', evet: true }], duzey: 'acil', hasta: `Ameliyattan sonra görmede ani azalma acildir: hekiminizi arayın ya da ${ACIL_112}`, hekim: 'Göz günlüğü: ani görme azalması.' },
        { id: 'agri', kosullar: [{ alan: 'agri', evet: true }], duzey: 'acil', hasta: `Artan göz ağrısı acil değerlendirilmelidir: bugün beklemeden hekiminize ulaşın ya da ${ACIL_112}`, hekim: 'Göz günlüğü: artan ağrı (endoftalmi?).' },
        { id: 'perde', kosullar: [{ alan: 'perde', evet: true }], duzey: 'acil', hasta: `Görme alanına perde inmesi acildir: ${ACIL_112}`, hekim: 'Göz günlüğü: fotopsi / perde (retina dekolmanı?).' },
        { id: 'kizariklik', kosullar: [{ alan: 'kizariklik', evet: true }], duzey: 'hekime_bildir', hasta: 'Kızarıklığı hekiminize ilettik; bugün ulaşın.', hekim: 'Göz günlüğü: artan kızarıklık / akıntı.' },
      ],
    },
    kaynaklar: ['TOD', 'RCOPHTH-KATARAKT'],
  },
  {
    kod: 'goz-damla', brans: 'goz-hastaliklari', tur: 'hatirlatma', baslangicModulu: 'goz-zaman', baslangicGerekli: true, baslik: 'Damla kullanma kurallarım',
    aciklama: 'Damlalarınızın saatleri İlaç takvimi bölümündedir; hatırlatmaları oradan açabilirsiniz.',
    varsayilan: {
      maddeler: [
        'Damlatmadan önce ellerinizi yıkayın.',
        'İki farklı damla arasında en az beş dakika bekleyin.',
        'Şişenin ucunu gözünüze ve kirpiklerinize değdirmeyin.',
        'Damladan sonra gözünüzü kapatıp iç köşeye hafifçe bir dakika bastırın.',
      ],
    },
    kaynaklar: ['TOD'],
  },
  {
    kod: 'goz-amsler', brans: 'goz-hastaliklari', tur: 'gunluk', durum: { tani: /makula|amd\b|sar[ıi] nokta/i, icd: /^H35\.3/ }, baslik: 'Amsler kontrolüm',
    aciklama: 'Her gözü ayrı ayrı kapatarak ızgaraya bakın. Değişikliği erken fark etmek görmeyi korur.',
    varsayilan: {
      alanlar: [
        { id: 'kontrol', etiket: 'Her gözü ayrı ayrı kapatarak kontrol ettim', tur: 'evet' },
        { id: 'carpik', etiket: 'Çizgilerde yeni eğrilik, bulanıklık ya da boş alan', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'carpik', kosullar: [{ alan: 'carpik', evet: true }], duzey: 'hekime_bildir', hasta: 'Yeni değişikliği hekiminize ilettik; bugün ya da en geç yarın değerlendirilmeniz gerekir.', hekim: 'Amsler günlüğü: yeni metamorfopsi / skotom.' },
      ],
    },
    kaynaklar: ['TOD-RETINA', 'AAO-AMD'],
  },
]

// ─── Çocuk cerrahisi (veli only) ────────────────────────────────────────────────────────────────────────────────────
export const COCUK_CERRAHISI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'cc-zaman', brans: 'cocuk-cerrahisi', tur: 'zaman', yas: 'cocuk', baslangicGerekli: true, baslangicEtiketi: 'Ameliyat günü', baslik: 'Çocuğumun ameliyat sonrası günleri',
    aciklama: 'Çocuğunuzun ameliyat gününden itibaren her gün ne yapacağınız. Hekiminizin talimatı her zaman önce gelir.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Ameliyat günü', ayrinti: 'Çocuğunuz uyanınca hekiminizin izin verdiği zamanda sıvılarla başlayın.' },
        { gun: 1, baslik: 'Evde ilk gün', ayrinti: 'Ağrı kesiciyi hekiminizin tarif ettiği saatlerde verin; oyun ve masal dikkatini dağıtmaya yardım eder.' },
        { gun: 2, baslik: 'Yara bakımı', ayrinti: 'Pansumanı kuru tutun; banyo için hekiminize sorun.' },
        { gun: 7, baslik: 'Kontrol', ayrinti: 'Yara kontrolü. Sorularınızı önceden not edin.' },
        { gun: 14, baslik: 'Okula ve oyuna dönüş', ayrinti: 'Koşma, tırmanma ve bisiklet için hekiminizin onayını bekleyin.' },
      ],
    },
    kaynaklar: ['TCCD'],
  },
  {
    kod: 'cc-iyilesme', brans: 'cocuk-cerrahisi', tur: 'gunluk', yas: 'cocuk', baslangicModulu: 'cc-zaman', baslangicGerekli: true, sonGun: 28, baslik: 'Çocuğumun iyileşme günlüğü',
    aciklama: 'Her gün bir dakika. Tehlike işaretlerinden birini seçerseniz ne yapmanız gerektiğini hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Ağrı (çocuğunuzun ifadesine göre)', tur: 'olcek' },
        { id: 'ates', etiket: '38 °C ve üzeri ateş', tur: 'evet' },
        { id: 'yara', etiket: 'Yarada artan kızarıklık, akıntı ya da açılma', tur: 'evet' },
        { id: 'kusma', etiket: 'Tekrarlayan kusma', tur: 'evet' },
        { id: 'idrar', etiket: 'Sekiz saattir idrar yapmadı', tur: 'evet' },
        { id: 'karin', etiket: 'Karnı şiş, sert ve çok ağrılı', tur: 'evet' },
        { id: 'halsiz', etiket: 'Çok halsiz, uyandırmakta zorlanıyorum', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'karin', kosullar: [{ alan: 'karin', evet: true }], duzey: 'acil', hasta: `Şiş, sert ve çok ağrılı karın acildir: ${ACIL_112}`, hekim: 'Çocuk cerrahisi günlüğü: akut batın bulgusu.' },
        { id: 'halsiz', kosullar: [{ alan: 'halsiz', evet: true }], duzey: 'acil', hasta: `Çok halsiz ya da uyandırılması zor bir çocuk acil değerlendirilmelidir: ${ACIL_112}`, hekim: 'Çocuk cerrahisi günlüğü: letarji.' },
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrar azalmasını hekiminize ilettik; bugün ulaşın. Sıvıyı az az ve sık verin.', hekim: 'Çocuk cerrahisi günlüğü: 8 saattir idrar yok.' },
        { id: 'ates-yara', kosullar: [{ alan: 'ates', evet: true }, { alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateş ve yara değişikliğini hekiminize ilettik; bugün ulaşın.', hekim: 'Çocuk cerrahisi günlüğü: ateş + yara bulgusu.' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Kusmayı hekiminize ilettik.', hekim: 'Çocuk cerrahisi günlüğü: tekrarlayan kusma.' },
        { id: 'yara', kosullar: [{ alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Yaradaki değişikliği hekiminize ilettik.', hekim: 'Çocuk cerrahisi günlüğü: yara bulgusu.' },
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateşi hekiminize ilettik.', hekim: 'Çocuk cerrahisi günlüğü: ≥ 38 °C ateş.' },
      ],
    },
    kaynaklar: ['TCCD', 'NICE-NG143'],
  },
]

// ─── Anestezi ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const ANESTEZI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'ane-hazirlik', brans: 'anestezi', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Ameliyat günü', baslik: 'Ameliyata hazırlığım',
    aciklama: 'Ameliyat gününüze kadar gün gün hazırlık ve ertesi gün dikkat edilecekler.',
    varsayilan: {
      adimlar: [
        { gun: -7, baslik: 'Bir hafta önce', ayrinti: 'Kullandığınız tüm ilaçları (bitkisel ürünler dahil) anestezi hekiminize bildirin; kan sulandırıcıları ne zaman bırakacağınızı sorun.' },
        { gun: -3, baslik: 'Hazırlık', ayrinti: 'Sigara içiyorsanız bırakmak için en iyi zaman. Günübirlik işlemdeyseniz sizi eve götürecek ve gece yanınızda kalacak birini ayarlayın.' },
        { gun: -1, baslik: 'Ameliyattan önceki gün', ayrinti: 'Aç kalma saatlerinizi kontrol edin (Aç kalma talimatım bölümü). Hafif bir akşam yemeği yiyin.' },
        { gun: 0, baslik: 'Ameliyat sabahı', ayrinti: 'Takı, makyaj, oje ve lensleri çıkarın. Hekiminizin “alın” dediği ilaçları az suyla alın.' },
        { gun: 1, baslik: 'Ertesi gün', ayrinti: 'Genel anestezi ya da sedasyondan sonra 24 saat araç kullanmayın, önemli karar ve imza vermeyin, alkol almayın.' },
      ],
    },
    kaynaklar: ['ASA-ACLIK-2023', 'TARD'],
  },
  {
    kod: 'ane-aclik', brans: 'anestezi', tur: 'hatirlatma', baslangicModulu: 'ane-hazirlik', baslangicGerekli: true, sonGun: 0, baslik: 'Aç kalma talimatım',
    aciklama: 'Aç kalma saatlerinizi anestezi hekiminiz belirler. Bu saatlere uyun.',
    varsayilan: {
      maddeler: [
        'Berrak sıvı: su, sütsüz çay, posasız meyve suyu. Süt ve ayran berrak sıvı değildir.',
        'Sakız ve sigara için anestezi hekiminizin talimatına uyun; sakızı ameliyata girmeden önce mutlaka ağzınızdan çıkarın.',
        'Saatlere uyulmazsa güvenliğiniz için ameliyatınız ertelenebilir.',
        'Şeker hastalığınız varsa sabah ilaçlarınızı ve şeker ölçümünüzü hekiminize sorun.',
      ],
    },
    ayarlar: [
      { id: 'katiSaat', etiket: 'Katı gıda en son (SS:DD)', tur: 'saat' },
      { id: 'berrakSaat', etiket: 'Su ve berrak sıvılar en son (SS:DD)', tur: 'saat' },
    ],
    kaynaklar: ['ASA-ACLIK-2023', 'TARD'],
  },
  {
    kod: 'ane-sonrasi', brans: 'anestezi', tur: 'gunluk', baslangicModulu: 'ane-hazirlik', baslangicGerekli: true, enErkenGun: 0, sonGun: 3, baslik: 'Anestezi sonrası ilk günler',
    aciklama: 'İlk üç gün kendinizi nasıl hissettiğinizi kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'bulanti', etiket: 'Bulantı', tur: 'olcek' },
        { id: 'bogaz', etiket: 'Boğaz ağrısı ya da ses kısıklığı', tur: 'evet' },
        { id: 'basagri', etiket: 'Belden iğne sonrası, ayağa kalkınca artan ve yatınca geçen baş ağrısı', tur: 'evet' },
        { id: 'bacak', etiket: 'Belden iğne sonrası bacaklarda yeni güçsüzlük, uyuşma ya da sırtta artan ağrı', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
        ANAFILAKSI_ALANI,
      ],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'bacak', kosullar: [{ alan: 'bacak', evet: true }], duzey: 'acil', hasta: `Belden iğne sonrası bacakta yeni güçsüzlük ya da uyuşma acildir: ${ACIL_112}`, hekim: 'Anestezi sonrası: nöroaksiyel blok sonrası yeni motor / duyu kaybı (epidural hematom?).' },
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Nefes darlığı ya da göğüs ağrısı acildir: ${ACIL_112}`, hekim: 'Anestezi sonrası: nefes darlığı / göğüs ağrısı.' },
        { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'hekime_bildir', hasta: 'Baş ağrınızı anestezi hekiminize ilettik; yatarak dinlenin ve sıvı alın.', hekim: 'Anestezi sonrası: postüral baş ağrısı (PDPH?).' },
      ],
    },
    kaynaklar: ['TARD'],
  },
]
