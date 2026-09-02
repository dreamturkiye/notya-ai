/**
 * NOTYA-INTAKE-01 / NOTYA-INTAKE-03 — branşa özel ek sorular, lib/asistan/specialistsCatalog.ts
 * içindeki 30 SpecialtyKey'in tamamı için. CORE_BOLUMLER (coreAlanlar.ts) her hastaya aynen
 * sorulur; burada yalnızca o branşın ayırıcı tanı için gerçekten önem taşıyan ek soruları var.
 *
 * Her branşın İLK sorusu artık aynı: "Bugünkü başvuru nedeniniz nedir?" — Acıbadem/Medicana/
 * Amerikan Hastanesi formlarının çoğunda bile atlanan, ama doktorun hastayı 30 saniyede
 * anlaması için tek en kritik alan (bkz. coreAlanlar.ts NOTYA-INTAKE-03 notu).
 *
 * Pediatri kasıtlı olarak çok daha kapsamlı ve çok bölümlü ('bolum-basligi' ayraçlarıyla):
 * veli bilgisi, sağlık özeti, doğum/gelişim, beslenme/aşı, aile/yaşam — bir yetişkin kardiyoloji
 * formunda karşılığı olmayan kategoriler. Bu, hem kullanıcının açık talebi hem de araştırılan
 * referans (Acıbadem/Medicana/Amerikan Hastanesi pediatri formları + Apple HIG sadelik ilkesi)
 * karşılaştırmasının sonucu — hedef "Acıbadem kadar kapsamlı" değil, "Acıbadem'in klinik
 * kapsamı + Apple'ın 3-5 dakikalık doldurma deneyimi".
 *
 * Kaynak: lib/asistan/specialistsCatalog.ts içindeki clinicalFocus alanları (TR ulusal
 * rehberlere dayalı) + yaygın Türkiye özel hastane hasta bilgi formu pratiği.
 */
import type { IntakeBolum } from './coreAlanlar'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

const BASVURU_NEDENI = {
  id: 'basvuruNedeni',
  etiket: 'Bugünkü başvuru nedeniniz nedir?',
  tur: 'textarea' as const,
  zorunlu: true,
  placeholder: 'Sizi bugün kliniğe getiren ana şikayeti kısaca yazın.',
}

export const BRANS_SORULARI: Record<SpecialtyKey, IntakeBolum> = {
  pediatri: {
    baslik: 'Çocuğunuz Hakkında',
    alanlar: [
      { id: 'basvuruNedeniPed', etiket: 'Bugünkü geliş sebebiniz nedir?', tur: 'textarea', zorunlu: true, placeholder: 'Sizi bugün kliniğimize getiren en önemli nedeni yazınız.' },
      { id: 'sikayetSuresiPed', etiket: 'Bu şikayet ne zamandır devam ediyor?', tur: 'radio', secenekler: ['Bugün başladı', '2-3 gündür', '1 haftadır', '1 aydan uzun'] },

      { id: 'baslikVeli', etiket: 'Veli / Yasal Vasi', tur: 'bolum-basligi' },
      { id: 'veliYakinligi', etiket: 'Yakınlığı', tur: 'radio', zorunlu: true, secenekler: ['Anne', 'Baba', 'Yasal Vasi'] },

      { id: 'baslikSaglikOzeti', etiket: 'Sağlık Özeti', tur: 'bolum-basligi' },
      { id: 'kronikHastaliklarPed', etiket: 'Çocuğunuzda aşağıdakilerden biri var mı?', tur: 'checkbox-grup', secenekler: ['Astım', 'Diyabet', 'Epilepsi', 'Doğuştan Kalp Hastalığı', 'Böbrek Hastalığı', 'Genetik Hastalık', 'Gelişim Geriliği', 'Otizm Spektrum Bozukluğu', 'DEHB', 'Yok'] },
      { id: 'oncekiYatisAmeliyatPed', etiket: 'Daha önce…', tur: 'checkbox-grup', secenekler: ['Hastaneye Yattı', 'Ameliyat Oldu', 'Yenidoğan Yoğun Bakımda Kaldı', 'Kan Transfüzyonu Aldı', 'Hiçbiri'] },
      { id: 'duzenliIlacPed', etiket: 'Düzenli ilaç kullanıyor mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'ilacAdiPed', etiket: 'İlaç Adı', tur: 'text', yardim: 'Yalnızca "Evet" ise doldurun.' },
      { id: 'alerjiPed', etiket: 'Alerji', tur: 'checkbox-grup', secenekler: ['Yok', 'İlaç', 'Gıda', 'Polen', 'Ev Tozu', 'Hayvan', 'Lateks', 'Diğer'] },

      { id: 'baslikDogumGelisim', etiket: 'Doğum ve Gelişim', tur: 'bolum-basligi' },
      { id: 'gebelikKomplikasyonuPed', etiket: 'Gebelik sürecinde aşağıdakilerden biri yaşandı mı?', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Erken Doğum Riski', 'Enfeksiyon', 'Çoğul Gebelik', 'Tüp Bebek (IVF)', 'Sorun Yaşanmadı'] },
      { id: 'gebelikHaftasiPed', etiket: 'Gebelik Haftası', tur: 'radio', secenekler: ['37 hafta ve üzeri', '37 haftadan önce', 'Bilmiyorum'] },
      { id: 'dogumKilosuPed', etiket: 'Doğum Kilosu (gram)', tur: 'text' },
      { id: 'dogumSekliPed', etiket: 'Doğum Şekli', tur: 'radio', secenekler: ['Normal Doğum', 'Sezaryen'] },
      { id: 'dogumSonrasiPed', etiket: 'Doğum Sonrası', tur: 'checkbox-grup', secenekler: ['Yenidoğan Yoğun Bakım', 'Sarılık Nedeniyle Fototerapi', 'Solunum Desteği Aldı', 'Sorun Yaşanmadı'] },
      { id: 'gelisimUygunMuPed', etiket: 'Yaşına uygun gelişim gösteriyor mu?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
      { id: 'gelisimDetayPed', etiket: 'Varsa işaretleyiniz', tur: 'checkbox-grup', secenekler: ['Konuşma Gecikmesi', 'Yürüme Gecikmesi', 'Öğrenme Güçlüğü', 'Fizik Tedavi Alıyor', 'Konuşma Terapisi Alıyor', 'Ergoterapi Alıyor'] },

      { id: 'baslikBeslenmeAsi', etiket: 'Beslenme ve Aşılar', tur: 'bolum-basligi' },
      { id: 'beslenmePed', etiket: 'Beslenme', tur: 'checkbox-grup', secenekler: ['Anne Sütü', 'Mama', 'Karışık', 'Yaşına Uygun Normal Beslenme'] },
      { id: 'istahPed', etiket: 'İştah', tur: 'radio', secenekler: ['Çok iyi', 'Normal', 'Az', 'Çok az'] },
      { id: 'vitaminDPed', etiket: 'Vitamin D', tur: 'radio', secenekler: ['Kullanıyor', 'Kullanmıyor', 'Bilmiyorum'] },
      { id: 'demirDestegiPed', etiket: 'Demir Desteği', tur: 'radio', secenekler: ['Kullanıyor', 'Kullanmıyor'] },
      { id: 'asiTakvimiPed', etiket: 'Aşılar', tur: 'radio', zorunlu: true, secenekler: ['Ulusal aşı takvimi tam', 'Eksik aşı var', 'Emin değilim'] },
      { id: 'ekAsilarPed', etiket: 'Ek Aşılar', tur: 'checkbox-grup', secenekler: ['Rotavirüs', 'Menenjit', 'HPV (uygunsa)', 'Grip', 'Hiçbiri'] },

      { id: 'baslikAileYasam', etiket: 'Aile ve Yaşam', tur: 'bolum-basligi' },
      { id: 'aileOykusuPed', etiket: 'Ailede aşağıdaki hastalıklardan biri var mı?', tur: 'checkbox-grup', secenekler: ['Astım', 'Alerji', 'Diyabet', 'Hipertansiyon', 'Kalp Hastalığı', 'Epilepsi', 'Tiroid Hastalığı', 'Kanser', 'Genetik Hastalık', 'Akraba Evliliği', 'Yok'] },
      { id: 'evOrtamiPed', etiket: 'Ev Ortamı', tur: 'checkbox-grup', secenekler: ['Evde Sigara İçiliyor', 'Evcil Hayvan Var', 'Kreşe Gidiyor', 'Okula Gidiyor'] },
      { id: 'ekranSuresiPed', etiket: 'Günlük Ekran Süresi', tur: 'radio', secenekler: ['1 saatten az', '1-2 saat', '2-4 saat', '4 saatten fazla'] },
      { id: 'uykuPed', etiket: 'Uyku', tur: 'radio', secenekler: ['Yaşına uygun', 'Uyku problemi var'] },
    ],
  },
  kardiyoloji: {
    baslik: 'Kalp Sağlığınız Hakkında',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'gogusAgrisi', etiket: 'Göğüs ağrısı yaşıyor musunuz? Ne zaman, ne sıklıkla?', tur: 'textarea' },
      { id: 'carpinti', etiket: 'Çarpıntı hissediyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Bazen', 'Sık sık'] },
      { id: 'nefesDarligi', etiket: 'Nefes darlığı ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla', 'İstirahatte de'] },
      { id: 'bilinenKalpHastaligi', etiket: 'Bilinen bir kalp hastalığınız (ritim bozukluğu, kapak, damar tıkanıklığı) var mı?', tur: 'textarea' },
      { id: 'aileErkenKalp', etiket: 'Ailede 55 yaş altı kalp krizi veya ani ölüm öyküsü var mı?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Bilmiyorum'] },
      { id: 'kolesterol', etiket: 'Bilinen yüksek kolesterolünüz var mı?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Bilmiyorum'] },
      { id: 'kalpIlaclari', etiket: 'Şu anda kullandığınız kalp/tansiyon ilaçları', tur: 'textarea' },
    ],
  },
  noroloji: {
    baslik: 'Nörolojik Şikayetleriniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'basAgrisiSikligi', etiket: 'Baş ağrısı sıklığınız ve tipi', tur: 'textarea' },
      { id: 'bayilmaNobet', etiket: 'Daha önce bayılma veya nöbet geçirdiniz mi?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
      { id: 'uyusmaGucsuzluk', etiket: 'Vücudunuzda uyuşma, karıncalanma veya güçsüzlük var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'hafizaSikayeti', etiket: 'Hafıza veya konsantrasyonla ilgili bir şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'dengeSorunu', etiket: 'Denge kaybı veya yürüme güçlüğü yaşıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileNorolojik', etiket: 'Ailede bilinen nörolojik hastalık (epilepsi, Parkinson, MS vb.) var mı?', tur: 'textarea' },
    ],
  },
  dahiliye: {
    baslik: 'Genel Sağlık Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'kiloDegisimi', etiket: 'Son 3 ayda istemsiz kilo kaybı/artışı oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Kilo kaybettim', 'Kilo aldım'] },
      { id: 'halsizlikAtes', etiket: 'Halsizlik, ateş veya gece terlemesi var mı?', tur: 'textarea' },
      { id: 'kronikTakip', etiket: 'Takip edilen bir kronik hastalığınız varsa, en son ne zaman kontrol oldunuz?', tur: 'text' },
      { id: 'sonKanTahlili', etiket: 'Son kan tahlilinizin tarihi (biliyorsanız)', tur: 'text' },
    ],
  },
  psikiyatri: {
    baslik: 'Ruh Sağlığınız Hakkında',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'uykuDuzeni', etiket: 'Uyku düzeninizde bir değişiklik var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
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
      BASVURU_NEDENI,
      { id: 'oncekiAmeliyatlarDetay', etiket: 'Daha önce geçirdiğiniz ameliyatlar ve varsa komplikasyonları', tur: 'textarea' },
      { id: 'kanamaBozuklugu', etiket: 'Bilinen bir kanama/pıhtılaşma bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanSulandirici', etiket: 'Kan sulandırıcı (aspirin, coumadin vb.) ilaç kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  ortopedi: {
    baslik: 'Kas-İskelet Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'agriBolgesi', etiket: 'Ağrı/şikayet hangi bölgede?', tur: 'text' },
      { id: 'travmaOykusu', etiket: 'Bir düşme, çarpma veya travma sonucu mu başladı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sislikKizariklik', etiket: 'Bölgede şişlik, kızarıklık veya ısı artışı var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'hareketKisitliligi', etiket: 'Hareket kısıtlılığı yaşıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'oncekiOrtopedikAmeliyat', etiket: 'Daha önce ortopedik bir ameliyat geçirdiniz mi?', tur: 'textarea' },
    ],
  },
  dermatoloji: {
    baslik: 'Cilt Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'ciltTipi', etiket: 'Cilt Tipiniz', tur: 'radio', secenekler: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas'] },
      { id: 'gunesMaruziyeti', etiket: 'Yoğun güneşe maruz kalma veya güneş yanığı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileCiltKanseri', etiket: 'Ailede cilt kanseri öyküsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'kullanilanUrunler', etiket: 'Kullandığınız kozmetik / cilt bakım ürünleri', tur: 'textarea' },
      { id: 'biliknCiltAlerjisi', etiket: 'Bilinen bir cilt alerjiniz var mı?', tur: 'textarea' },
    ],
  },
  'kulak-burun-bogaz': {
    baslik: 'KBB Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'isitmeKaybi', etiket: 'İşitme kaybı fark ettiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kulakAgrisiAkinti', etiket: 'Kulak ağrısı veya akıntısı var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'burunTikanikligi', etiket: 'Burun tıkanıklığı veya akıntısı ne kadar süredir var?', tur: 'text' },
      { id: 'horlama', etiket: 'Horlama veya uyku sırasında nefes durması şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sesKisikligi', etiket: 'Ses kısıklığınız ne kadar süredir var?', tur: 'text' },
    ],
  },
  'goz-hastaliklari': {
    baslik: 'Göz Sağlığınız',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'gozlukLens', etiket: 'Gözlük veya lens kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gozAgrisiKizariklik', etiket: 'Göz ağrısı, kızarıklık veya ışığa hassasiyet var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileGlokom', etiket: 'Ailede glokom veya başka bir göz hastalığı öyküsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'diyabetVarMi', etiket: 'Bilinen diyabetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'], yardim: 'Diyabet retina taraması sıklığını etkiler.' },
    ],
  },
  'kadin-hastaliklari-dogum': {
    baslik: 'Kadın Sağlığı',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sonAdetTarihi', etiket: 'Son Adet Tarihiniz', tur: 'date' },
      { id: 'gebelikSayisi', etiket: 'Toplam Gebelik Sayısı', tur: 'text' },
      { id: 'dogumSayisi', etiket: 'Doğum Sayısı', tur: 'text' },
      { id: 'dusukSayisi', etiket: 'Düşük / Kürtaj Sayısı', tur: 'text' },
      { id: 'dogumKontrolYontemi', etiket: 'Kullandığınız doğum kontrol yöntemi (varsa)', tur: 'text' },
      { id: 'gebelikSuphesi', etiket: 'Gebelik şüpheniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim'] },
    ],
  },
  uroloji: {
    baslik: 'Ürolojik Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'idrarYanmaSiklik', etiket: 'İdrar yaparken yanma veya sık idrara çıkma var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanliIdrar', etiket: 'İdrarınızda kan gördünüz mü?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'bobrekTasi', etiket: 'Daha önce böbrek taşı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'prostatSikayeti', etiket: 'Prostatla ilgili bir şikayetiniz var mı? (erkek hastalar için)', tur: 'textarea' },
    ],
  },
  radyoloji: {
    baslik: 'Görüntüleme Öncesi Bilgiler',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'kontrastAlerjisi', etiket: 'Daha önce kontrast madde alerjisi yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gebelikOlasiligi', etiket: 'Gebelik olasılığınız var mı? (kadın hastalar için)', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim', 'Uygun değil'] },
      { id: 'metalImplant', etiket: 'Vücudunuzda metal implant, pil (pacemaker) veya protez var mı?', tur: 'textarea' },
      { id: 'bobrekFonksiyonu', etiket: 'Bilinen bir böbrek fonksiyon bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
    ],
  },
  anestezi: {
    baslik: 'Anestezi Öncesi Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'oncekiAnesteziSorunu', etiket: 'Daha önce anestezi alırken bir sorun yaşadınız mı?', tur: 'textarea' },
      { id: 'aileAnesteziKomplikasyon', etiket: 'Ailede anesteziyle ilgili bilinen bir komplikasyon (malign hipertermi vb.) var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'aclikTeyit', etiket: 'İşlemden önce açlık süresine uyacağınızı onaylıyor musunuz?', tur: 'radio', secenekler: ['Evet'] },
      { id: 'disProtez', etiket: 'Takma diş, protez veya ağızda hareketli parça var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'acil-tip': {
    baslik: 'Acil Şikayet Bilgisi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'siddet', etiket: 'Şikayetin şiddeti (1: hafif — 10: dayanılmaz)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'esliqSemptomlar', etiket: 'Eşlik eden başka bir belirti var mı?', tur: 'textarea' },
      { id: 'benzerAtak', etiket: 'Daha önce benzer bir atak yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'fizik-tedavi': {
    baslik: 'Fizik Tedavi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'gunlukKisitlama', etiket: 'Günlük yaşam aktivitelerinizi ne kadar kısıtlıyor?', tur: 'radio', secenekler: ['Hiç', 'Az', 'Orta', 'Ciddi şekilde'] },
      { id: 'oncekiFizikTedavi', etiket: 'Daha önce fizik tedavi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'ortezProtez', etiket: 'Kullandığınız ortez, protez veya yardımcı cihaz var mı?', tur: 'text' },
    ],
  },
  'enfeksiyon-hastaliklari': {
    baslik: 'Enfeksiyon Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'seyahatOykusu', etiket: 'Son 1 ay içinde yurt dışı veya farklı bölgeye seyahatiniz oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'hayvanTemasi', etiket: 'Yakın zamanda hayvan teması (ısırık, çiziği vb.) oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'bagisiklikSorunu', etiket: 'Bilinen bir bağışıklık sistemi sorununuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'asiTakvimiGuncelYetiskin', etiket: 'Aşı takvimini güncel tutuyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
    ],
  },
  endokrinoloji: {
    baslik: 'Endokrin Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'tiroidDiyabet', etiket: 'Bilinen tiroid veya diyabet hastalığınız var mı?', tur: 'textarea' },
      { id: 'kiloDegisimiEndokrin', etiket: 'Son zamanlarda açıklanamayan bir kilo değişimi oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Kilo kaybettim', 'Kilo aldım'] },
      { id: 'susamaSiklıkİdrar', etiket: 'Aşırı susama veya sık idrara çıkma şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileEndokrin', etiket: 'Ailede endokrin hastalık (diyabet, tiroid vb.) öyküsü var mı?', tur: 'textarea' },
    ],
  },
  gastroenteroloji: {
    baslik: 'Sindirim Sistemi Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'diskilamaDegisimi', etiket: 'Dışkılama alışkanlığınızda bir değişiklik oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanliDiski', etiket: 'Dışkınızda kan fark ettiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kiloKaybiGastro', etiket: 'İstemsiz kilo kaybınız oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'yutmaGuclugu', etiket: 'Yutma güçlüğü çekiyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  nefroloji: {
    baslik: 'Böbrek Sağlığınız',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'idrarDegisimi', etiket: 'İdrar renginizde veya miktarınızda bir değişiklik oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'odem', etiket: 'Bacaklarınızda veya vücudunuzda şişlik (ödem) var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'diyalizOykusu', etiket: 'Daha önce diyaliz tedavisi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanBasincTakibi', etiket: 'Kan basıncınızı düzenli takip ediyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
    ],
  },
  romatoloji: {
    baslik: 'Eklem ve Romatolojik Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sabahTutuklugu', etiket: 'Sabah tutukluğu yaşıyor musunuz? Ne kadar sürüyor?', tur: 'text' },
      { id: 'ciltDokuntusu', etiket: 'Eşlik eden bir cilt döküntüsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'aileRomatolojik', etiket: 'Ailede romatolojik hastalık öyküsü var mı?', tur: 'textarea' },
    ],
  },
  onkoloji: {
    baslik: 'Onkolojik Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'taniTarihiTuru', etiket: 'Tanı tarihiniz ve türü', tur: 'textarea' },
      { id: 'tedaviAsamasi', etiket: 'Şu anda hangi tedavi aşamasındasınız?', tur: 'text' },
      { id: 'kemoRadyoOykusu', etiket: 'Daha önce kemoterapi veya radyoterapi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'agriDuzeyi', etiket: 'Şu anki ağrı düzeyiniz (1-10)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    ],
  },
  'gogus-hastaliklari': {
    baslik: 'Solunum Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'balgamKan', etiket: 'Balgam çıkarıyor musunuz? Kan var mı?', tur: 'radio', secenekler: ['Hayır', 'Balgam var', 'Kanlı balgam var'] },
      { id: 'nefesDarligiGogus', etiket: 'Nefes darlığınız ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla', 'İstirahatte de'] },
      { id: 'sigaraPaketYili', etiket: 'Sigara kullanıyorsanız, günde kaç adet ve kaç yıldır?', tur: 'text' },
      { id: 'astimKoahTanisi', etiket: 'Bilinen astım veya KOAH tanınız var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'gogus-cerrahisi': {
    baslik: 'Toraks Cerrahisi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sigaraOykusuGogus', etiket: 'Sigara kullanım öykünüz', tur: 'text' },
      { id: 'oncekiAkcigerAmeliyati', etiket: 'Daha önce akciğer/göğüs ameliyatı geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'solunumTesti', etiket: 'Solunum fonksiyon testi (SFT) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'plastik-cerrahi': {
    baslik: 'Plastik Cerrahi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'islemAmaci', etiket: 'Görüşmenin amacı', tur: 'radio', secenekler: ['Estetik', 'Rekonstrüktif', 'İkisi de'] },
      { id: 'oncekiEstetikIslem', etiket: 'Daha önce estetik bir işlem/ameliyat oldunuz mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'yaraIyilesmeSorunu', etiket: 'Yara iyileşmesinde sorun (keloit, geç iyileşme) yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sigaraPlastik', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'], yardim: 'Sigara yara iyileşmesini doğrudan etkiler.' },
    ],
  },
  'beyin-cerrahisi': {
    baslik: 'Nöroşirürji Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'bilincDegisikligi', etiket: 'Bilinç kaybı veya bulanıklığı yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gucsuzlukUyusmaBeyin', etiket: 'Kol/bacakta güçsüzlük veya uyuşma var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'goruntulemeVarMi', etiket: 'Elinizde bir BT/MR sonucu var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'kalp-damar-cerrahisi': {
    baslik: 'Kalp-Damar Cerrahisi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'bacakAgrisiSislik', etiket: 'Bacaklarınızda ağrı, şişlik veya varis şikayetiniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'oncekiDamarAmeliyati', etiket: 'Daha önce kalp veya damar ameliyatı geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sigaraKDC', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'cocuk-cerrahisi': {
    baslik: 'Çocuğunuzun Cerrahi Değerlendirmesi',
    alanlar: [
      { id: 'basvuruNedeniCC', etiket: 'Çocuğunuzun bugünkü şikayeti nedir?', tur: 'textarea', zorunlu: true },
      { id: 'dogustanAnomali', etiket: 'Doğuştan bilinen bir anomali var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'cocukOncekiAmeliyat', etiket: 'Çocuğunuz daha önce ameliyat oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'cocukAsiTakvimi', etiket: 'Aşı takvimi güncel mi?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
    ],
  },
  'aile-hekimligi': {
    baslik: 'Genel Sağlık Kontrolü',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'ziyaretAmaci', etiket: 'Bu bir genel sağlık kontrolü mü, yoksa belirli bir şikayet mi?', tur: 'radio', secenekler: ['Genel kontrol / check-up', 'Belirli bir şikayetim var'] },
      { id: 'guncelTaramalar', etiket: 'Güncel koruyucu tarama testleriniz (kolonoskopi, mamografi vb.)', tur: 'textarea' },
      { id: 'baskaAileHekimi', etiket: 'Başka bir yerde kayıtlı aile hekiminiz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },
  'spor-hekimligi': {
    baslik: 'Spor Hekimliği Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sporDaliSikligi', etiket: 'Yaptığınız spor dalı ve haftalık sıklığı', tur: 'text' },
      { id: 'sonSakatlik', etiket: 'Son sakatlık öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kalpTaramasi', etiket: 'Daha önce kalp taraması (EKG, efor testi) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
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
