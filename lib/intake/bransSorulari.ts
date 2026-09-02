/**
 * NOTYA-INTAKE-01 — branşa özel ek sorular, lib/asistan/specialistsCatalog.ts'deki 30
 * SpecialtyKey'in tamamı için. CORE_BOLUMLER (coreAlanlar.ts) her hastaya aynen sorulur; burada
 * yalnızca o branşın ayırıcı tanı için gerçekten önem taşıyan ek soruları var.
 *
 * Pediatri kasıtlı olarak çok daha kapsamlı: doğum öyküsü, beslenme, aşı, gelişim — bir yetişkin
 * kardiyoloji formunda karşılığı olmayan bir kategori. Bu, kullanıcının açık talebiydi: "Pediatri
 * çok daha detaylı olacak, kardiyoloji formuna göre çocuğun yaşına dayalı."
 *
 * Kaynak: lib/asistan/specialistsCatalog.ts içindeki clinicalFocus alanları (TR ulusal
 * rehberlere dayalı, Prof. Dr. persona tanımları için zaten araştırılmış) + yaygın Türkiye özel
 * hastane (Amerikan Hastanesi, Medicana tarzı) hasta bilgi formu pratiği. Bu bir v1 — bir branş
 * sorusu eksik/yanlış hissettirirse dosya tek bir yerden düzeltilir.
 */
import type { IntakeBolum } from './coreAlanlar'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const BRANS_SORULARI: Record<SpecialtyKey, IntakeBolum> = {
  pediatri: {
    baslik: 'Çocuğunuz Hakkında',
    alanlar: [
      { id: 'dogumHaftasi', etiket: 'Doğum Haftası', tur: 'select', secenekler: ['Term (37+ hafta)', 'Preterm (37 haftadan önce)', 'Bilmiyorum'] },
      { id: 'dogumKilosu', etiket: 'Doğum Kilosu (gram)', tur: 'text' },
      { id: 'dogumSekli', etiket: 'Doğum Şekli', tur: 'radio', secenekler: ['Normal (vajinal)', 'Sezaryen'] },
      { id: 'emzirme', etiket: 'Beslenme', tur: 'radio', secenekler: ['Anne sütü', 'Mama', 'Karışık', 'Normal beslenmeye geçti'] },
      { id: 'asiTakvimiGuncel', etiket: 'Aşı takvimi güncel mi?', tur: 'radio', zorunlu: true, secenekler: ['Evet, güncel', 'Hayır, eksik var', 'Emin değilim'] },
      { id: 'gelisimEndisesi', etiket: 'Konuşma, yürüme veya genel gelişimle ilgili bir endişeniz var mı?', tur: 'textarea' },
      { id: 'kresOkul', etiket: 'Kreş / Okul Durumu', tur: 'text' },
      { id: 'kardesSayisi', etiket: 'Kardeş Sayısı', tur: 'text' },
      { id: 'gebelikKomplikasyon', etiket: 'Annenin gebelik sürecinde bilinen bir komplikasyon oldu mu?', tur: 'textarea' },
    ],
  },
  kardiyoloji: {
    baslik: 'Kalp Sağlığınız Hakkında',
    alanlar: [
      { id: 'gogusAgrisi', etiket: 'Göğüs ağrısı yaşıyor musunuz? Ne zaman, ne sıklıkla?', tur: 'textarea' },
      { id: 'carpinti', etiket: 'Çarpıntı hissediyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Bazen', 'Sık sık'] },
      { id: 'nefesDarligi', etiket: 'Nefes darlığı ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla (yürürken/merdivende)', 'İstirahat halinde de'] },
      { id: 'bilinenKalpHastaligi', etiket: 'Bilinen bir kalp hastalığınız (ritim bozukluğu, kapak, damar tıkanıklığı) var mı?', tur: 'textarea' },
      { id: 'aileErkenKalp', etiket: 'Ailede 55 yaş altı kalp krizi veya ani ölüm öyküsü var mı?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Bilmiyorum'] },
      { id: 'kolesterol', etiket: 'Bilinen yüksek kolesterolünüz var mı?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Bilmiyorum'] },
      { id: 'kalpIlaclari', etiket: 'Şu anda kullandığınız kalp/tansiyon ilaçları', tur: 'textarea' },
    ],
  },
  noroloji: {
    baslik: 'Nörolojik Şikayetleriniz',
    alanlar: [
      { id: 'basAgrisiSikligi', etiket: 'Baş ağrısı sıklığınız ve tipi', tur: 'textarea' },
      { id: 'bayilmaNobet', etiket: 'Daha önce bayılma veya nöbet geçirdiniz mi?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
      { id: 'uyusmaGucsuzluk', etiket: 'Vücudunuzda uyuşma, karıncalanma veya güçsüzlük var mı?', tur: 'textarea' },
      { id: 'hafizaSikayeti', etiket: 'Hafıza veya konsantrasyonla ilgili bir şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'dengeSorunu', etiket: 'Denge kaybı veya yürüme güçlüğü yaşıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileNorolojik', etiket: 'Ailede bilinen nörolojik hastalık (epilepsi, Parkinson, MS vb.) var mı?', tur: 'textarea' },
    ],
  },
  dahiliye: {
    baslik: 'Genel Sağlık Şikayetiniz',
    alanlar: [
      { id: 'sikayetSuresi', etiket: 'Şikayetiniz ne zaman başladı?', tur: 'text' },
      { id: 'kiloDegisimi', etiket: 'Son 3 ayda istemsiz kilo kaybı/artışı oldu mu?', tur: 'text' },
      { id: 'halsizlikAtes', etiket: 'Halsizlik, ateş veya gece terlemesi var mı?', tur: 'textarea' },
      { id: 'kronikTakip', etiket: 'Takip edilen bir kronik hastalığınız varsa, en son ne zaman kontrol oldunuz?', tur: 'text' },
      { id: 'sonKanTahlili', etiket: 'Son kan tahlilinizin tarihi (biliyorsanız)', tur: 'text' },
    ],
  },
  psikiyatri: {
    baslik: 'Ruh Sağlığınız Hakkında',
    alanlar: [
      { id: 'suankiDurum', etiket: 'Son birkaç haftadır kendinizi nasıl hissediyorsunuz?', tur: 'textarea' },
      { id: 'uykuDuzeni', etiket: 'Uyku düzeninizde bir değişiklik var mı?', tur: 'textarea' },
      { id: 'istahDegisimi', etiket: 'İştahınızda bir değişiklik oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Azaldı', 'Arttı'] },
      { id: 'oncekiTedavi', etiket: 'Daha önce psikiyatrik tedavi gördünüz mü veya ilaç kullandınız mı?', tur: 'textarea' },
      { id: 'stresKaynagi', etiket: 'Şu anda sizi en çok zorlayan konu nedir?', tur: 'textarea' },
      {
        id: 'guvenlikTarama',
        etiket: 'Son zamanlarda kendinize zarar verme veya yaşamınızı sonlandırma düşüncesi geldi mi?',
        tur: 'radio',
        zorunlu: true,
        secenekler: ['Hayır', 'Evet'],
        yardim: 'Bu soru rutin bir güvenlik taramasıdır ve yanıtınız doktorunuz tarafından hemen değerlendirilecektir.',
      },
    ],
  },
  'genel-cerrahi': {
    baslik: 'Cerrahi Değerlendirme',
    alanlar: [
      { id: 'sikayetVeSuresi', etiket: 'Şikayetiniz nedir, ne zamandır sürüyor?', tur: 'textarea' },
      { id: 'oncekiAmeliyatlarDetay', etiket: 'Daha önce geçirdiğiniz ameliyatlar ve varsa komplikasyonları', tur: 'textarea' },
      { id: 'kanamaBozuklugu', etiket: 'Bilinen bir kanama/pıhtılaşma bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanSulandirici', etiket: 'Kan sulandırıcı (aspirin, coumadin vb.) ilaç kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  ortopedi: {
    baslik: 'Kas-İskelet Şikayetiniz',
    alanlar: [
      { id: 'agriBolgesi', etiket: 'Ağrı/şikayet hangi bölgede?', tur: 'text' },
      { id: 'travmaOykusu', etiket: 'Bir düşme, çarpma veya travma sonucu mu başladı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sislikKizariklik', etiket: 'Bölgede şişlik, kızarıklık veya ısı artışı var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'hareketKisitliligi', etiket: 'Hareket kısıtlılığı yaşıyor musunuz?', tur: 'textarea' },
      { id: 'oncekiOrtopedikAmeliyat', etiket: 'Daha önce ortopedik bir ameliyat geçirdiniz mi?', tur: 'textarea' },
    ],
  },
  dermatoloji: {
    baslik: 'Cilt Şikayetiniz',
    alanlar: [
      { id: 'sikayetSuresiDerm', etiket: 'Cilt şikayetiniz ne zaman başladı?', tur: 'text' },
      { id: 'ciltTipi', etiket: 'Cilt Tipiniz', tur: 'select', secenekler: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas'] },
      { id: 'gunesMaruziyeti', etiket: 'Yoğun güneşe maruz kalma veya güneş yanığı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileCiltKanseri', etiket: 'Ailede cilt kanseri öyküsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'kullanilanUrunler', etiket: 'Kullandığınız kozmetik / cilt bakım ürünleri', tur: 'textarea' },
      { id: 'biliknCiltAlerjisi', etiket: 'Bilinen bir cilt alerjiniz var mı?', tur: 'textarea' },
    ],
  },
  'kulak-burun-bogaz': {
    baslik: 'KBB Şikayetiniz',
    alanlar: [
      { id: 'isitmeKaybi', etiket: 'İşitme kaybı fark ettiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kulakAgrisiAkinti', etiket: 'Kulak ağrısı veya akıntısı var mı?', tur: 'textarea' },
      { id: 'burunTikanikligi', etiket: 'Burun tıkanıklığı veya akıntısı ne kadar süredir var?', tur: 'text' },
      { id: 'horlama', etiket: 'Horlama veya uyku sırasında nefes durması şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sesKisikligi', etiket: 'Ses kısıklığınız ne kadar süredir var?', tur: 'text' },
    ],
  },
  'goz-hastaliklari': {
    baslik: 'Göz Sağlığınız',
    alanlar: [
      { id: 'gormeDegisimi', etiket: 'Görme keskinliğinizde son zamanlarda bir değişiklik oldu mu?', tur: 'textarea' },
      { id: 'gozlukLens', etiket: 'Gözlük veya lens kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gozAgrisiKizariklik', etiket: 'Göz ağrısı, kızarıklık veya ışığa hassasiyet var mı?', tur: 'textarea' },
      { id: 'aileGlokom', etiket: 'Ailede glokom veya başka bir göz hastalığı öyküsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'diyabetVarMi', etiket: 'Bilinen diyabetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'], yardim: 'Diyabet retina taraması sıklığını etkiler.' },
    ],
  },
  'kadin-hastaliklari-dogum': {
    baslik: 'Kadın Sağlığı',
    alanlar: [
      { id: 'sonAdetTarihi', etiket: 'Son Adet Tarihiniz', tur: 'date' },
      { id: 'gebelikSayisi', etiket: 'Toplam Gebelik Sayısı', tur: 'text' },
      { id: 'dogumSayisi', etiket: 'Doğum Sayısı', tur: 'text' },
      { id: 'dusukSayisi', etiket: 'Düşük / Kürtaj Sayısı', tur: 'text' },
      { id: 'dogumKontrolYontemi', etiket: 'Kullandığınız doğum kontrol yöntemi (varsa)', tur: 'text' },
      { id: 'sonSmear', etiket: 'Son smear (Pap-smear) testinizin tarihi', tur: 'text' },
      { id: 'gebelikSuphesi', etiket: 'Gebelik şüpheniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim'] },
    ],
  },
  uroloji: {
    baslik: 'Ürolojik Şikayetiniz',
    alanlar: [
      { id: 'idrarYanmaSiklik', etiket: 'İdrar yaparken yanma veya sık idrara çıkma var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanliIdrar', etiket: 'İdrarınızda kan gördünüz mü?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'bobrekTasi', etiket: 'Daha önce böbrek taşı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'prostatSikayeti', etiket: 'Prostatla ilgili bir şikayetiniz var mı? (erkek hastalar için)', tur: 'textarea' },
    ],
  },
  radyoloji: {
    baslik: 'Görüntüleme Öncesi Bilgiler',
    alanlar: [
      { id: 'kontrastAlerjisi', etiket: 'Daha önce kontrast madde (ilaçlı film çekimi) alerjisi yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gebelikOlasiligi', etiket: 'Gebelik olasılığınız var mı? (kadın hastalar için)', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim', 'Uygun değil'] },
      { id: 'metalImplant', etiket: 'Vücudunuzda metal implant, pil (pacemaker) veya protez var mı?', tur: 'textarea' },
      { id: 'bobrekFonksiyonu', etiket: 'Bilinen bir böbrek fonksiyon bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
    ],
  },
  anestezi: {
    baslik: 'Anestezi Öncesi Değerlendirme',
    alanlar: [
      { id: 'oncekiAnesteziSorunu', etiket: 'Daha önce anestezi alırken bir sorun yaşadınız mı?', tur: 'textarea' },
      { id: 'aileAnesteziKomplikasyon', etiket: 'Ailede anesteziyle ilgili bilinen bir komplikasyon (malign hipertermi vb.) var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'aclikTeyit', etiket: 'İşlemden önce açlık süresine uyacağınızı onaylıyor musunuz?', tur: 'radio', secenekler: ['Evet'] },
      { id: 'disProtez', etiket: 'Takma diş, protez veya ağızda hareketli parça var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'acil-tip': {
    baslik: 'Acil Şikayet Bilgisi',
    alanlar: [
      { id: 'baslamaZamani', etiket: 'Şikayetiniz tam olarak ne zaman başladı?', tur: 'text', zorunlu: true },
      { id: 'siddet', etiket: 'Şikayetin şiddeti (1: hafif — 10: dayanılmaz)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'esliqSemptomlar', etiket: 'Eşlik eden başka bir belirti var mı?', tur: 'textarea' },
      { id: 'benzerAtak', etiket: 'Daha önce benzer bir atak yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'fizik-tedavi': {
    baslik: 'Fizik Tedavi Değerlendirmesi',
    alanlar: [
      { id: 'agriBolgesiSuresi', etiket: 'Ağrı bölgesi ve süresi', tur: 'textarea' },
      { id: 'gunlukKisitlama', etiket: 'Günlük yaşam aktivitelerinizi ne kadar kısıtlıyor?', tur: 'radio', secenekler: ['Hiç', 'Az', 'Orta', 'Ciddi şekilde'] },
      { id: 'oncekiFizikTedavi', etiket: 'Daha önce fizik tedavi aldınız mı?', tur: 'textarea' },
      { id: 'ortezProtez', etiket: 'Kullandığınız ortez, protez veya yardımcı cihaz var mı?', tur: 'text' },
    ],
  },
  'enfeksiyon-hastaliklari': {
    baslik: 'Enfeksiyon Değerlendirmesi',
    alanlar: [
      { id: 'atesSuresi', etiket: 'Ateşiniz ne zamandır var?', tur: 'text' },
      { id: 'seyahatOykusu', etiket: 'Son 1 ay içinde yurt dışı veya farklı bölgeye seyahatiniz oldu mu?', tur: 'textarea' },
      { id: 'hayvanTemasi', etiket: 'Yakın zamanda hayvan teması (ısırık, çiziği vb.) oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'bagisiklikSorunu', etiket: 'Bilinen bir bağışıklık sistemi sorununuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'asiTakvimiGuncelYetiskin', etiket: 'Aşı takvimini güncel tutuyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
    ],
  },
  endokrinoloji: {
    baslik: 'Endokrin Değerlendirme',
    alanlar: [
      { id: 'tiroidDiyabet', etiket: 'Bilinen tiroid veya diyabet hastalığınız var mı?', tur: 'textarea' },
      { id: 'kiloDegisimiEndokrin', etiket: 'Son zamanlarda açıklanamayan bir kilo değişimi oldu mu?', tur: 'text' },
      { id: 'susamaSiklıkİdrar', etiket: 'Aşırı susama veya sık idrara çıkma şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileEndokrin', etiket: 'Ailede endokrin hastalık (diyabet, tiroid vb.) öyküsü var mı?', tur: 'textarea' },
    ],
  },
  gastroenteroloji: {
    baslik: 'Sindirim Sistemi Şikayetiniz',
    alanlar: [
      { id: 'karinAgrisiBolgesi', etiket: 'Karın ağrınız hangi bölgede?', tur: 'text' },
      { id: 'diskilamaDegisimi', etiket: 'Dışkılama alışkanlığınızda bir değişiklik oldu mu?', tur: 'textarea' },
      { id: 'kanliDiski', etiket: 'Dışkınızda kan fark ettiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kiloKaybiGastro', etiket: 'İstemsiz kilo kaybınız oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'yutmaGuclugu', etiket: 'Yutma güçlüğü çekiyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  nefroloji: {
    baslik: 'Böbrek Sağlığınız',
    alanlar: [
      { id: 'bilinenBobrekHastaligi', etiket: 'Bilinen bir böbrek hastalığınız var mı?', tur: 'textarea' },
      { id: 'idrarDegisimi', etiket: 'İdrar renginizde veya miktarınızda bir değişiklik oldu mu?', tur: 'textarea' },
      { id: 'odem', etiket: 'Bacaklarınızda veya vücudunuzda şişlik (ödem) var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'diyalizOykusu', etiket: 'Daha önce diyaliz tedavisi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanBasincTakibi', etiket: 'Kan basıncınızı düzenli takip ediyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
    ],
  },
  romatoloji: {
    baslik: 'Eklem ve Romatolojik Şikayetiniz',
    alanlar: [
      { id: 'eklemAgrisiSuresi', etiket: 'Eklem ağrısı/şişliği ne kadar süredir var?', tur: 'text' },
      { id: 'sabahTutuklugu', etiket: 'Sabah tutukluğu yaşıyor musunuz? Ne kadar sürüyor?', tur: 'text' },
      { id: 'ciltDokuntusu', etiket: 'Eşlik eden bir cilt döküntüsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileRomatolojik', etiket: 'Ailede romatolojik hastalık öyküsü var mı?', tur: 'textarea' },
    ],
  },
  onkoloji: {
    baslik: 'Onkolojik Değerlendirme',
    alanlar: [
      { id: 'taniTarihiTuru', etiket: 'Tanı tarihiniz ve türü', tur: 'textarea' },
      { id: 'tedaviAsamasi', etiket: 'Şu anda hangi tedavi aşamasındasınız?', tur: 'text' },
      { id: 'kemoRadyoOykusu', etiket: 'Daha önce kemoterapi veya radyoterapi aldınız mı?', tur: 'textarea' },
      { id: 'agriDuzeyi', etiket: 'Şu anki ağrı düzeyiniz (1-10)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    ],
  },
  'gogus-hastaliklari': {
    baslik: 'Solunum Şikayetiniz',
    alanlar: [
      { id: 'oksurukSuresi', etiket: 'Öksürüğünüz ne kadar süredir var?', tur: 'text' },
      { id: 'balgamKan', etiket: 'Balgam çıkarıyor musunuz? Kan var mı?', tur: 'textarea' },
      { id: 'nefesDarligiGogus', etiket: 'Nefes darlığınız ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla', 'İstirahatte de'] },
      { id: 'sigaraPaketYili', etiket: 'Sigara kullanıyorsanız, günde kaç adet ve kaç yıldır?', tur: 'text' },
      { id: 'astimKoahTanisi', etiket: 'Bilinen astım veya KOAH tanınız var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'gogus-cerrahisi': {
    baslik: 'Toraks Cerrahisi Değerlendirmesi',
    alanlar: [
      { id: 'gogusCerrahiSikayet', etiket: 'Şikayetiniz nedir?', tur: 'textarea' },
      { id: 'sigaraOykusuGogus', etiket: 'Sigara kullanım öykünüz', tur: 'text' },
      { id: 'oncekiAkcigerAmeliyati', etiket: 'Daha önce akciğer/göğüs ameliyatı geçirdiniz mi?', tur: 'textarea' },
      { id: 'solunumTesti', etiket: 'Solunum fonksiyon testi (SFT) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'plastik-cerrahi': {
    baslik: 'Plastik Cerrahi Değerlendirmesi',
    alanlar: [
      { id: 'islemAmaci', etiket: 'Görüşmenin amacı', tur: 'radio', secenekler: ['Estetik', 'Rekonstrüktif (travma/hastalık sonrası)', 'İkisi de'] },
      { id: 'oncekiEstetikIslem', etiket: 'Daha önce estetik bir işlem/ameliyat oldunuz mu?', tur: 'textarea' },
      { id: 'yaraIyilesmeSorunu', etiket: 'Yara iyileşmesinde sorun (keloit, geç iyileşme) yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sigaraPlastik', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'], yardim: 'Sigara yara iyileşmesini doğrudan etkiler.' },
    ],
  },
  'beyin-cerrahisi': {
    baslik: 'Nöroşirürji Değerlendirmesi',
    alanlar: [
      { id: 'basAgrisiTravma', etiket: 'Baş ağrısı veya kafa travması öykünüz var mı?', tur: 'textarea' },
      { id: 'bilincDegisikligi', etiket: 'Bilinç kaybı veya bulanıklığı yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gucsuzlukUyusmaBeyin', etiket: 'Kol/bacakta güçsüzlük veya uyuşma var mı?', tur: 'textarea' },
      { id: 'goruntulemeVarMi', etiket: 'Elinizde bir BT/MR sonucu var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'kalp-damar-cerrahisi': {
    baslik: 'Kalp-Damar Cerrahisi Değerlendirmesi',
    alanlar: [
      { id: 'bacakAgrisiSislik', etiket: 'Bacaklarınızda ağrı, şişlik veya varis şikayetiniz var mı?', tur: 'textarea' },
      { id: 'gogusAgrisiKDC', etiket: 'Göğüs ağrısı yaşıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'oncekiDamarAmeliyati', etiket: 'Daha önce kalp veya damar ameliyatı geçirdiniz mi?', tur: 'textarea' },
      { id: 'sigaraKDC', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'cocuk-cerrahisi': {
    baslik: 'Çocuğunuzun Cerrahi Değerlendirmesi',
    alanlar: [
      { id: 'cocukSikayetSuresi', etiket: 'Çocuğunuzun şikayeti nedir, ne zamandır var?', tur: 'textarea' },
      { id: 'dogustanAnomali', etiket: 'Doğuştan bilinen bir anomali var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'cocukOncekiAmeliyat', etiket: 'Çocuğunuz daha önce ameliyat oldu mu?', tur: 'textarea' },
      { id: 'cocukAsiTakvimi', etiket: 'Aşı takvimi güncel mi?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
    ],
  },
  'aile-hekimligi': {
    baslik: 'Genel Sağlık Kontrolü',
    alanlar: [
      { id: 'ziyaretAmaci', etiket: 'Bu bir genel sağlık kontrolü mü, yoksa belirli bir şikayet mi?', tur: 'radio', secenekler: ['Genel kontrol / check-up', 'Belirli bir şikayetim var'] },
      { id: 'sonCheckup', etiket: 'Son genel sağlık kontrolünüzün tarihi', tur: 'text' },
      { id: 'guncelTaramalar', etiket: 'Güncel koruyucu tarama testleriniz (kolonoskopi, mamografi vb.)', tur: 'textarea' },
      { id: 'baskaAileHekimi', etiket: 'Başka bir yerde kayıtlı aile hekiminiz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'spor-hekimligi': {
    baslik: 'Spor Hekimliği Değerlendirmesi',
    alanlar: [
      { id: 'sporDaliSikligi', etiket: 'Yaptığınız spor dalı ve haftalık sıklığı', tur: 'text' },
      { id: 'sonSakatlik', etiket: 'Son sakatlık öykünüz var mı?', tur: 'textarea' },
      { id: 'kalpTaramasi', etiket: 'Daha önce kalp taraması (EKG, efor testi) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'performansHedefi', etiket: 'Bu görüşmedeki hedefiniz nedir?', tur: 'textarea' },
    ],
  },
}

export const BRANS_ETIKETLERI: Record<SpecialtyKey, string> = {
  pediatri: 'Pediatri (Çocuk Sağlığı)',
  kardiyoloji: 'Kardiyoloji',
  noroloji: 'Nöroloji',
  dahiliye: 'İç Hastalıkları (Dahiliye)',
  psikiyatri: 'Psikiyatri',
  'genel-cerrahi': 'Genel Cerrahi',
  ortopedi: 'Ortopedi ve Travmatoloji',
  dermatoloji: 'Dermatoloji',
  'kulak-burun-bogaz': 'Kulak Burun Boğaz',
  'goz-hastaliklari': 'Göz Hastalıkları',
  'kadin-hastaliklari-dogum': 'Kadın Hastalıkları ve Doğum',
  uroloji: 'Üroloji',
  radyoloji: 'Radyoloji',
  anestezi: 'Anesteziyoloji ve Reanimasyon',
  'acil-tip': 'Acil Tıp',
  'fizik-tedavi': 'Fiziksel Tıp ve Rehabilitasyon',
  'enfeksiyon-hastaliklari': 'Enfeksiyon Hastalıkları',
  endokrinoloji: 'Endokrinoloji ve Metabolizma',
  gastroenteroloji: 'Gastroenteroloji',
  nefroloji: 'Nefroloji',
  romatoloji: 'Romatoloji',
  onkoloji: 'Tıbbi Onkoloji',
  'gogus-hastaliklari': 'Göğüs Hastalıkları',
  'gogus-cerrahisi': 'Göğüs Cerrahisi',
  'plastik-cerrahi': 'Plastik, Rekonstrüktif ve Estetik Cerrahi',
  'beyin-cerrahisi': 'Beyin ve Sinir Cerrahisi',
  'kalp-damar-cerrahisi': 'Kalp ve Damar Cerrahisi',
  'cocuk-cerrahisi': 'Çocuk Cerrahisi',
  'aile-hekimligi': 'Aile Hekimliği',
  'spor-hekimligi': 'Spor Hekimliği',
}
