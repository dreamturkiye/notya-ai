/**
 * NOTYA-INTAKE-01 / NOTYA-INTAKE-03 / NOTYA-INTAKE-04 — branşa özel ek sorular,
 * lib/asistan/specialistsCatalog.ts içindeki 30 SpecialtyKey'in tamamı için.
 *
 * NOTYA-INTAKE-04: kullanıcı geri bildirimi — 29 branş formu pediatri'ye kıyasla "zayıf"
 * kaldı, örnek olarak göz-hastaliklari için tam bir Acıbadem/Medicana seviyesi soru seti verdi
 * (önceki muayene geçmişi, gözlük/lens kullanım detayı, semptom checklist'i, semptom sıklığı,
 * bilinen göz hastalıkları, ilgili kronik hastalıklar, geçirilmiş operasyonlar, aile öyküsü —
 * ~12-14 alan). Bu, tüm 29 branş için hedef yoğunluk: her branş artık aynı şablonu izliyor —
 * şikayet + semptom checklist + [bolum-basligi] "<Branş> Sağlığı Geçmişi" (bilinen hastalıklar +
 * geçirilmiş girişimler/ameliyatlar) + [bolum-basligi] "Aile Öyküsü". Pediatri zaten bu
 * yoğunluktaydı (NOTYA-INTAKE-03), değişmedi.
 *
 * Kaynak: lib/asistan/specialistsCatalog.ts içindeki clinicalFocus alanları (TR ulusal
 * rehberlere dayalı) + yaygın Türkiye özel hastane hasta bilgi formu pratiği + kullanıcının
 * göz-hastaliklari referans örneği.
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

const SIKAYET_SURESI_STANDART = { tur: 'radio' as const, secenekler: ['Bugün başladı', 'Bu hafta', 'Bu ay', 'Daha uzun süredir'] }

export const BRANS_SORULARI: Record<SpecialtyKey, IntakeBolum> = {
  pediatri: {
    baslik: 'Çocuğunuz Hakkında',
    alanlar: [
      { id: 'basvuruNedeniPed', etiket: 'Bugünkü geliş sebebiniz nedir?', tur: 'textarea', zorunlu: true, placeholder: 'Sizi bugün kliniğimize getiren en önemli nedeni yazınız.' },

      { id: 'baslikVeli', etiket: 'Veli / Yasal Vasi', tur: 'bolum-basligi' },
      { id: 'veliYakinligi', etiket: 'Yakınlığı', tur: 'radio', zorunlu: true, secenekler: ['Anne', 'Baba', 'Yasal Vasi'] },

      { id: 'baslikDogumGelisim', etiket: 'Doğum ve Gelişim', tur: 'bolum-basligi' },
      { id: 'gebelikKomplikasyonuPed', etiket: 'Gebelik sürecinde aşağıdakilerden biri yaşandı mı?', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Erken Doğum Riski', 'Enfeksiyon', 'Çoğul Gebelik', 'Tüp Bebek (IVF)', 'Sorun Yaşanmadı'] },
      { id: 'gebelikHaftasiPed', etiket: 'Gebelik Haftası', tur: 'radio', secenekler: ['37 hafta ve üzeri', '37 haftadan önce', 'Bilmiyorum'] },
      { id: 'dogumKilosuPed', etiket: 'Doğum Kilosu (gram)', tur: 'text' },
      { id: 'dogumBoyuPed', etiket: 'Doğum Boyu (cm)', tur: 'text' },
      { id: 'basCevresiPed', etiket: 'Baş Çevresi (cm)', tur: 'text' },
      { id: 'dogumSekliPed', etiket: 'Doğum Şekli', tur: 'radio', secenekler: ['Normal Doğum', 'Sezaryen'] },
      { id: 'dogumSonrasiPed', etiket: 'Doğum Sonrası', tur: 'checkbox-grup', secenekler: ['Yenidoğan Yoğun Bakım', 'Sarılık Nedeniyle Fototerapi', 'Solunum Desteği Aldı', 'Sorun Yaşanmadı'] },
    ],
  },

  kardiyoloji: {
    baslik: 'Kalp Sağlığınız Hakkında',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiKardiyo', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'semptomlarKardiyo', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Göğüs Ağrısı', 'Çarpıntı', 'Nefes Darlığı', 'Bayılma/Baygınlık Hissi', 'Bacaklarda Şişlik', 'Halsizlik', 'Soğuk Terleme', 'Yok'] },
      { id: 'gogusAgrisiNiteligi', etiket: 'Göğüs ağrınız varsa, niteliği nasıl?', tur: 'radio', secenekler: ['Batıcı', 'Baskı Hissi', 'Yanma', 'Ağrım Yok'] },
      { id: 'nefesDarligiZamani', etiket: 'Nefes darlığı ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla', 'İstirahatte de'] },
      { id: 'baslikKalpGecmisi', etiket: 'Kalp Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenKalpHastaliklari', etiket: 'Bilinen kalp hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Ritim Bozukluğu', 'Kalp Yetmezliği', 'Kapak Hastalığı', 'Koroner Arter Hastalığı', 'Geçirilmiş Kalp Krizi', 'Doğuştan Kalp Hastalığı', 'Yok'] },
      { id: 'riskFaktorleriKardiyo', etiket: 'Risk faktörleri', tur: 'checkbox-grup', secenekler: ['Hipertansiyon', 'Yüksek Kolesterol', 'Diyabet', 'Sigara', 'Obezite', 'Hareketsiz Yaşam', 'Yok'] },
      { id: 'oncekiGirisimlerKardiyo', etiket: 'Daha önce geçirdiğiniz girişimler', tur: 'checkbox-grup', secenekler: ['Stent / Anjiyoplasti', 'Bypass Ameliyatı', 'Kalp Pili', 'Kapak Ameliyatı', 'EKG / Efor Testi Yaptırdım', 'Yok'] },
      { id: 'kalpIlaclari', etiket: 'Şu anda kullandığınız kalp/tansiyon ilaçları', tur: 'textarea' },
      { id: 'baslikKardiyoAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKalpOykusu', etiket: 'Ailede kalp hastalığı öyküsü', tur: 'checkbox-grup', secenekler: ['55 Yaş Altı Kalp Krizi', 'Ani Ölüm', 'Ritim Bozukluğu', 'Kalp Yetmezliği', 'Yok', 'Bilmiyorum'] },
    ],
  },

  noroloji: {
    baslik: 'Nörolojik Şikayetleriniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiNoro', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'semptomlarNoro', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Baş Ağrısı', 'Baş Dönmesi', 'Uyuşma / Karıncalanma', 'Güçsüzlük', 'Denge Kaybı', 'Konuşma Bozukluğu', 'Bellek / Konsantrasyon Sorunu', 'Görme Değişikliği', 'Yok'] },
      { id: 'basAgrisiTipi', etiket: 'Baş ağrınız varsa, niteliği nasıl?', tur: 'radio', secenekler: ['Zonklayıcı', 'Sıkıştırıcı', 'Bıçak Saplanır Gibi', 'Baş Ağrım Yok'] },
      { id: 'bayilmaNobetNoro', etiket: 'Daha önce bayılma veya nöbet geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Bayılma', 'Nöbet / Kasılma', 'Her İkisi de'] },
      { id: 'baslikNoroGecmisi', etiket: 'Nörolojik Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenNorolojikHastaliklar', etiket: 'Bilinen nörolojik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Epilepsi', 'Migren', 'İnme / Felç Öyküsü', 'Parkinson', 'Multipl Skleroz (MS)', 'Nöropati', 'Yok'] },
      { id: 'goruntulemeTestNoro', etiket: 'Daha önce yaptırdığınız tetkikler', tur: 'checkbox-grup', secenekler: ['BT Çekildi', 'MR Çekildi', 'EEG Yapıldı', 'EMG Yapıldı', 'Hiçbiri'] },
      { id: 'kullanilanNorolojikIlaclar', etiket: 'Kullandığınız nörolojik ilaçlar', tur: 'textarea' },
      { id: 'baslikNoroAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileNorolojik', etiket: 'Ailede bilinen nörolojik hastalık', tur: 'checkbox-grup', secenekler: ['Epilepsi', 'İnme', 'Migren', 'Parkinson', 'MS', 'Alzheimer / Demans', 'Yok', 'Bilmiyorum'] },
    ],
  },

  dahiliye: {
    baslik: 'Genel Sağlık Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiDahiliye', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'genelSemptomlarDahiliye', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Halsizlik', 'Ateş', 'Gece Terlemesi', 'İştahsızlık', 'Kilo Değişimi', 'Baş Dönmesi', 'Eklem Ağrısı', 'Yok'] },
      { id: 'kiloDegisimi', etiket: 'Son 3 ayda istemsiz kilo kaybı/artışı oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Kilo kaybettim', 'Kilo aldım'] },
      { id: 'baslikDahiliyeGecmisi', etiket: 'Kronik Takip', tur: 'bolum-basligi' },
      { id: 'bilinenKronikTakip', etiket: 'Takip edilen kronik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Tiroid Hastalığı', 'Yüksek Kolesterol', 'Böbrek Hastalığı', 'Karaciğer Hastalığı', 'Yok'] },
      { id: 'kronikTakip', etiket: 'Son kontrol tarihiniz', tur: 'text' },
      { id: 'sonKanTahlili', etiket: 'Son kan tahlilinizin tarihi', tur: 'text' },
      { id: 'baslikDahiliyeAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileDahiliyeOykusu', etiket: 'Ailede bilinen hastalıklar', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Kalp Hastalığı', 'Kanser', 'Tiroid Hastalığı', 'Yok'] },
    ],
  },

  psikiyatri: {
    baslik: 'Ruh Sağlığınız Hakkında',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiPsik', etiket: 'Bu durum ne zamandır sürüyor?', tur: 'radio', secenekler: ['Birkaç gündür', 'Birkaç haftadır', 'Aylardır', 'Yıllardır'] },
      { id: 'duygudurumSemptomlari', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Üzüntü / Çökkünlük', 'Aşırı Endişe', 'Sinirlilik', 'İlgi Kaybı', 'Enerji Azlığı', 'Konsantrasyon Güçlüğü', 'Değersizlik Hissi', 'Yok'] },
      { id: 'uykuDuzeni', etiket: 'Uyku düzeninizde bir değişiklik var mı?', tur: 'radio', secenekler: ['Hayır', 'Uykusuzluk', 'Aşırı Uyku'] },
      { id: 'istahDegisimi', etiket: 'İştahınızda bir değişiklik oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Azaldı', 'Arttı'] },
      { id: 'baslikPsikGecmisi', etiket: 'Ruh Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'oncekiTaniPsik', etiket: 'Daha önce konulmuş tanılar', tur: 'checkbox-grup', secenekler: ['Depresyon', 'Anksiyete Bozukluğu', 'Bipolar Bozukluk', 'Panik Atak', 'Obsesif Kompulsif Bozukluk', 'Yeme Bozukluğu', 'Yok'] },
      { id: 'oncekiTedaviPsik', etiket: 'Daha önce aldığınız tedaviler', tur: 'checkbox-grup', secenekler: ['İlaç Tedavisi', 'Terapi / Psikoterapi', 'Hastane Yatışı', 'Hiçbiri'] },
      { id: 'stresKaynagi', etiket: 'Şu anda sizi en çok zorlayan konu nedir?', tur: 'textarea' },
      {
        id: 'guvenlikTarama', etiket: 'Son zamanlarda kendinize zarar verme veya yaşamınızı sonlandırma düşüncesi geldi mi?',
        tur: 'radio', zorunlu: true, secenekler: ['Hayır', 'Evet'],
        yardim: 'Bu soru rutin bir güvenlik taramasıdır ve yanıtınız doktorunuz tarafından hemen değerlendirilecektir.',
      },
      { id: 'baslikPsikAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'ailePsikOykusu', etiket: 'Ailede ruh sağlığı öyküsü', tur: 'checkbox-grup', secenekler: ['Depresyon', 'Anksiyete', 'Bipolar Bozukluk', 'Şizofreni', 'İntihar Öyküsü', 'Madde Bağımlılığı', 'Yok'] },
    ],
  },

  'genel-cerrahi': {
    baslik: 'Cerrahi Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiCerrahi', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'semptomlarCerrahi', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Karın Ağrısı', 'Şişlik / Kitle', 'Bulantı / Kusma', 'Kabızlık', 'İshal', 'Kanama', 'Ateş', 'Yok'] },
      { id: 'agriNiteligiCerrahi', etiket: 'Ağrınız varsa, niteliği nasıl?', tur: 'radio', secenekler: ['Keskin', 'Künt', 'Kramp Tarzı', 'Ağrım Yok'] },
      { id: 'baslikCerrahiGecmisi', etiket: 'Cerrahi Geçmiş', tur: 'bolum-basligi' },
      { id: 'oncekiAmeliyatlarDetay', etiket: 'Daha önce geçirdiğiniz ameliyatlar ve varsa komplikasyonları', tur: 'textarea' },
      { id: 'kanamaBozuklugu', etiket: 'Bilinen bir kanama/pıhtılaşma bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanSulandirici', etiket: 'Kan sulandırıcı ilaç kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikCerrahiAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileCerrahiOykusu', etiket: 'Ailede bilinen hastalıklar', tur: 'checkbox-grup', secenekler: ['Kolon Kanseri', 'Fıtık', 'Safra Kesesi Hastalığı', 'Kanama Bozukluğu', 'Yok'] },
    ],
  },

  ortopedi: {
    baslik: 'Kas-İskelet Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'agriBolgesi', etiket: 'Ağrı/şikayet hangi bölgede?', tur: 'text' },
      { id: 'agriSuresiOrtopedi', etiket: 'Bu ağrı ne zamandır var?', tur: 'radio', secenekler: ['Bugün başladı', 'Birkaç gündür', 'Birkaç haftadır', 'Aylardır / Kronik'] },
      { id: 'travmaOykusu', etiket: 'Bir düşme, çarpma veya travma sonucu mu başladı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'eslikEdenSemptomlarOrtopedi', etiket: 'Eşlik eden belirtiler', tur: 'checkbox-grup', secenekler: ['Şişlik', 'Kızarıklık', 'Isı Artışı', 'Hareket Kısıtlılığı', 'Uyuşma / Karıncalanma', 'Kilitlenme Hissi', 'Yok'] },
      { id: 'baslikOrtopediGecmisi', etiket: 'Kas-İskelet Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenOrtopedikHastaliklar', etiket: 'Bilinen kas-iskelet hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Osteoporoz', 'Artrit / Romatizma', 'Skolyoz', 'Disk Hernisi', 'Yok'] },
      { id: 'oncekiOrtopedikAmeliyat', etiket: 'Daha önce ortopedik bir ameliyat geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kullanilanYardimciCihaz', etiket: 'Kullandığınız ortez, protez veya yardımcı cihaz', tur: 'text' },
      { id: 'baslikOrtopediAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileOrtopedikOykusu', etiket: 'Ailede bilinen kas-iskelet hastalığı', tur: 'checkbox-grup', secenekler: ['Osteoporoz', 'Romatoid Artrit', 'Skolyoz', 'Yok'] },
    ],
  },

  dermatoloji: {
    baslik: 'Cilt Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiDerm', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'ciltTipi', etiket: 'Cilt Tipiniz', tur: 'radio', secenekler: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas'] },
      { id: 'lezyonOzellikleri', etiket: 'Lezyon/şikayetinizin özellikleri', tur: 'checkbox-grup', secenekler: ['Kaşıntı', 'Ağrı', 'Kanama', 'Büyüme', 'Renk Değişimi', 'Pullanma', 'Su Toplama', 'Yok'] },
      { id: 'gunesMaruziyeti', etiket: 'Yoğun güneşe maruz kalma veya güneş yanığı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikDermGecmisi', etiket: 'Cilt Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenDermHastaliklari', etiket: 'Bilinen cilt hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Egzama', 'Sedef (Psoriazis)', 'Ürtiker', 'Akne', 'Vitiligo', 'Yok'] },
      { id: 'aileCiltKanseri', etiket: 'Ailede cilt kanseri öyküsü var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'kullanilanUrunler', etiket: 'Kullandığınız kozmetik / cilt bakım ürünleri', tur: 'textarea' },
      { id: 'biliknCiltAlerjisi', etiket: 'Bilinen cilt alerjileriniz', tur: 'checkbox-grup', secenekler: ['İlaç', 'Kozmetik', 'Metal (Nikel vb.)', 'Bitkisel Ürün', 'Yok'] },
      { id: 'baslikDermAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileDermOykusu', etiket: 'Ailede bilinen cilt hastalığı', tur: 'checkbox-grup', secenekler: ['Cilt Kanseri', 'Sedef', 'Egzama', 'Vitiligo', 'Yok'] },
    ],
  },

  'kulak-burun-bogaz': {
    baslik: 'KBB Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiKBB', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'semptomlarKBB', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['İşitme Kaybı', 'Kulak Ağrısı', 'Kulak Akıntısı', 'Burun Tıkanıklığı', 'Burun Akıntısı', 'Koku Kaybı', 'Horlama', 'Ses Kısıklığı', 'Boğaz Ağrısı', 'Yok'] },
      { id: 'baslikKBBGecmisi', etiket: 'KBB Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenKBBHastaliklari', etiket: 'Bilinen KBB hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Kronik Sinüzit', 'Alerjik Rinit', 'Tonsillit (Bademcik)', 'Uyku Apnesi', 'Tinnitus (Kulak Çınlaması)', 'Yok'] },
      { id: 'oncekiKBBAmeliyat', etiket: 'Daha önce geçirdiğiniz KBB ameliyatları', tur: 'checkbox-grup', secenekler: ['Bademcik Ameliyatı', 'Sinüs Ameliyatı', 'Kulak Zarı Ameliyatı', 'Geniz Eti Ameliyatı', 'Yok'] },
      { id: 'baslikKBBAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKBBOykusu', etiket: 'Ailede bilinen KBB hastalığı', tur: 'checkbox-grup', secenekler: ['İşitme Kaybı', 'Alerji', 'Uyku Apnesi', 'Yok'] },
    ],
  },

  'goz-hastaliklari': {
    baslik: 'Göz Sağlığınız',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'oncekiGozMuayenesi', etiket: 'Daha önce göz muayenesi oldunuz mu?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
      { id: 'gozlukKullanimi', etiket: 'Gözlük kullanıyor musunuz?', tur: 'radio', secenekler: ['Evet, sürekli', 'Evet, ara sıra', 'Hayır', 'Eskiden kullanıyordum'] },
      { id: 'kontaktLensKullanimi', etiket: 'Kontakt lens kullanıyor musunuz?', tur: 'radio', secenekler: ['Evet, sürekli', 'Evet, ara sıra', 'Hayır', 'Eskiden kullanıyordum'] },
      { id: 'mevcutGozSikayetleri', etiket: 'Mevcut göz şikâyetleriniz', tur: 'checkbox-grup', secenekler: ['Bulanık Görme', 'Uzağı Görmede Zorluk', 'Yakını Görmede Zorluk', 'Göz Kuruluğu', 'Baş Ağrısı', 'Işığa Hassasiyet', 'Göz Kızarıklığı', 'Kaşıntı', 'Çift Görme'] },
      { id: 'bulanikGormeSikligi', etiket: 'Bulanık görme sıklığı', tur: 'radio', secenekler: ['Yok', 'Ara sıra', 'Sık sık', 'Sürekli', 'Bilmiyorum'] },
      { id: 'gormeZorluguMesafe', etiket: 'Görme zorluğu en çok hangi mesafede?', tur: 'radio', secenekler: ['Uzakta', 'Yakında', 'Her ikisinde', 'Belirgin değil'] },
      { id: 'ekGozSikayetleri', etiket: 'Belirttiğiniz şikayetler hakkında ek açıklama', tur: 'textarea' },
      { id: 'baslikGozGecmisi', etiket: 'Göz Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenGozHastaliklari', etiket: 'Bilinen göz hastalıkları', tur: 'checkbox-grup', secenekler: ['Glokom', 'Katarakt', 'Miyopi', 'Hipermetropi', 'Astigmat', 'Retina Hastalığı', 'Göz Kuruluğu', 'Yok'] },
      { id: 'kronikRahatsizliklarGoz', etiket: 'Göz sağlığını etkileyebilecek kronik rahatsızlıklar', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Tiroid Hastalığı', 'Astım', 'Romatizmal Hastalık', 'Kalp Hastalığı', 'Nörolojik Hastalık', 'Yok'] },
      { id: 'oncekiGozOperasyonlari', etiket: 'Daha önce geçirilmiş göz operasyonları veya tedaviler', tur: 'checkbox-grup', secenekler: ['Lazer Tedavisi', 'Katarakt Ameliyatı', 'Refraktif Cerrahi', 'Göz İçi Enjeksiyon', 'Göz Travması Tedavisi', 'Yok'] },
      { id: 'baslikGozAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileGozHastaligiOykusu', etiket: 'Ailede göz hastalığı öyküsü', tur: 'checkbox-grup', secenekler: ['Glokom', 'Katarakt', 'Retina Hastalığı', 'Miyopi', 'Keratokonus', 'Yok', 'Bilinmiyor'] },
    ],
  },

  'kadin-hastaliklari-dogum': {
    baslik: 'Kadın Sağlığı',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sonAdetTarihi', etiket: 'Son Adet Tarihiniz', tur: 'date' },
      { id: 'adetDuzeni', etiket: 'Adet düzeniniz nasıl?', tur: 'radio', secenekler: ['Düzenli', 'Düzensiz', 'Menopoza girdim'] },
      { id: 'semptomlarKadin', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Adet Öncesi Ağrı', 'Aşırı Kanama', 'Ara Kanama', 'Vajinal Akıntı', 'Kaşıntı / Yanma', 'Cinsel İlişkide Ağrı', 'Pelvik Ağrı', 'Yok'] },
      { id: 'gebelikSayisi', etiket: 'Toplam Gebelik Sayısı', tur: 'text' },
      { id: 'dogumSayisi', etiket: 'Doğum Sayısı', tur: 'text' },
      { id: 'dusukSayisi', etiket: 'Düşük / Kürtaj Sayısı', tur: 'text' },
      { id: 'dogumKontrolYontemi', etiket: 'Kullandığınız doğum kontrol yöntemi (varsa)', tur: 'text' },
      { id: 'gebelikSuphesi', etiket: 'Gebelik şüpheniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim'] },
      { id: 'baslikKadinGecmisi', etiket: 'Kadın Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenJinekolojikHastaliklar', etiket: 'Bilinen jinekolojik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Myom', 'Kist', 'Endometriozis', 'PKOS', 'HPV', 'Meme Hastalığı', 'Yok'] },
      { id: 'sonSmearMamografi', etiket: 'Son smear / mamografi tarihiniz', tur: 'text' },
      { id: 'baslikKadinAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKadinOykusu', etiket: 'Ailede bilinen kadın sağlığı öyküsü', tur: 'checkbox-grup', secenekler: ['Meme Kanseri', 'Yumurtalık Kanseri', 'Rahim Kanseri', 'PKOS', 'Erken Menopoz', 'Yok'] },
    ],
  },

  uroloji: {
    baslik: 'Ürolojik Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarUroloji', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Sık İdrara Çıkma', 'İdrarda Yanma', 'İdrarda Kan', 'Gece İdrara Çıkma', 'İdrar Yaparken Zorlanma', 'İdrar Kaçırma', 'Kasık / Bel Ağrısı', 'Yok'] },
      { id: 'bobrekTasi', etiket: 'Daha önce böbrek taşı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'prostatSikayeti', etiket: 'Prostatla ilgili şikayetiniz (erkek hastalar için)', tur: 'checkbox-grup', secenekler: ['Sık İdrara Çıkma', 'Zayıf İdrar Akışı', 'Tam Boşalamama Hissi', 'Yok', 'Uygun Değil'] },
      { id: 'baslikUrolojiGecmisi', etiket: 'Ürolojik Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenUrolojikHastaliklar', etiket: 'Bilinen ürolojik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Böbrek Taşı', 'İdrar Yolu Enfeksiyonu (Tekrarlayan)', 'Prostat Büyümesi', 'Mesane Hastalığı', 'Yok'] },
      { id: 'oncekiUrolojikGirisimler', etiket: 'Daha önce geçirdiğiniz girişimler', tur: 'checkbox-grup', secenekler: ['Taş Kırma (ESWL)', 'Sistoskopi', 'Prostat Ameliyatı', 'Böbrek Ameliyatı', 'Yok'] },
      { id: 'baslikUrolojiAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileUrolojikOykusu', etiket: 'Ailede bilinen ürolojik hastalık', tur: 'checkbox-grup', secenekler: ['Böbrek Taşı', 'Prostat Kanseri', 'Mesane Kanseri', 'Böbrek Hastalığı', 'Yok'] },
    ],
  },

  radyoloji: {
    baslik: 'Görüntüleme Öncesi Bilgiler',
    alanlar: [
      { id: 'basvuruNedeniRad', etiket: 'İstenen tetkik türü / çekim nedeni', tur: 'textarea', zorunlu: true },
      { id: 'kontrastAlerjisi', etiket: 'Daha önce kontrast madde alerjisi yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'gebelikOlasiligi', etiket: 'Gebelik olasılığınız var mı? (kadın hastalar için)', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim', 'Uygun değil'] },
      { id: 'metalImplant', etiket: 'Vücudunuzda bulunanlar', tur: 'checkbox-grup', secenekler: ['Pacemaker / ICD', 'Eklem Protezi', 'Cerrahi Klips / Plak', 'Diş İmplantı', 'Göz İçi Metal Parçacık Şüphesi', 'Yok'] },
      { id: 'bobrekFonksiyonu', etiket: 'Bilinen bir böbrek fonksiyon bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'baslikRadEk', etiket: 'Ek Bilgiler', tur: 'bolum-basligi' },
      { id: 'klostrofobiVarMi', etiket: 'Kapalı alan korkunuz var mı? (MR için)', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'oncekiGoruntulemeler', etiket: 'Daha önce çekilen tetkikler varsa belirtiniz', tur: 'textarea' },
    ],
  },

  anestezi: {
    baslik: 'Anestezi Öncesi Değerlendirme',
    alanlar: [
      { id: 'basvuruNedeniAnestezi', etiket: 'Planlanan işlem nedir?', tur: 'textarea', zorunlu: true },
      { id: 'oncekiAnesteziSorunu', etiket: 'Daha önce anestezi alırken bir sorun yaşadınız mı?', tur: 'textarea' },
      { id: 'aileAnesteziKomplikasyon', etiket: 'Ailede anesteziyle ilgili bilinen bir komplikasyon (malign hipertermi vb.) var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'aclikTeyit', etiket: 'İşlemden önce açlık süresine uyacağınızı onaylıyor musunuz?', tur: 'radio', secenekler: ['Evet'] },
      { id: 'disProtez', etiket: 'Takma diş, protez veya ağızda hareketli parça var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikAnesteziGecmisi', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'anesteziRiskFaktorleri', etiket: 'Aşağıdakilerden biri var mı?', tur: 'checkbox-grup', secenekler: ['Uyku Apnesi', 'Reflü', 'Astım / KOAH', 'Kalp Hastalığı', 'Sigara Kullanımı', 'Obezite', 'Yok'] },
      { id: 'kullanilanIlaclarAnestezi', etiket: 'Kullandığınız tüm ilaçlar', tur: 'textarea' },
      { id: 'gecirilmisAnestezi', etiket: 'Daha önce aldığınız anestezi türleri', tur: 'checkbox-grup', secenekler: ['Genel Anestezi', 'Bölgesel / Spinal Anestezi', 'Lokal Anestezi', 'Hiç Anestezi Almadım'] },
    ],
  },

  'acil-tip': {
    baslik: 'Acil Şikayet Bilgisi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'siddet', etiket: 'Şikayetin şiddeti (1: hafif — 10: dayanılmaz)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'baslamaSekli', etiket: 'Şikayet nasıl başladı?', tur: 'radio', secenekler: ['Aniden', 'Yavaş yavaş'] },
      { id: 'esliqSemptomlar', etiket: 'Eşlik eden belirtiler', tur: 'checkbox-grup', secenekler: ['Ateş', 'Nefes Darlığı', 'Göğüs Ağrısı', 'Bilinç Değişikliği', 'Kanama', 'Kusma', 'Yok'] },
      { id: 'benzerAtak', etiket: 'Daha önce benzer bir atak yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikAcilGecmisi', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenKronikDurumAcil', etiket: 'Bilinen kronik durumlarınız', tur: 'checkbox-grup', secenekler: ['Kalp Hastalığı', 'Diyabet', 'Astım / KOAH', 'Epilepsi', 'Kanama Bozukluğu', 'Yok'] },
      { id: 'allerjiAcil', etiket: 'Bilinen ilaç alerjileriniz', tur: 'text' },
    ],
  },

  'fizik-tedavi': {
    baslik: 'Fizik Tedavi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'agriSuresiFT', etiket: 'Bu ağrı ne zamandır var?', tur: 'radio', secenekler: ['Birkaç gündür', 'Birkaç haftadır', 'Aylardır', 'Yıllardır / Kronik'] },
      { id: 'agriNiteligiFT', etiket: 'Ağrınızın niteliği', tur: 'checkbox-grup', secenekler: ['Zonklayıcı', 'Batıcı', 'Yanıcı', 'Uyuşturucu', 'Sertlik / Tutukluk', 'Yok'] },
      { id: 'gunlukKisitlama', etiket: 'Günlük yaşam aktivitelerinizi ne kadar kısıtlıyor?', tur: 'radio', secenekler: ['Hiç', 'Az', 'Orta', 'Ciddi şekilde'] },
      { id: 'baslikFTGecmisi', etiket: 'Kas-İskelet Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenKasIskeletHastaliklari', etiket: 'Bilinen kas-iskelet hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Disk Hernisi', 'Artrit', 'Skolyoz', 'Kırık Öyküsü', 'Felç / İnme Sonrası', 'Spor Yaralanması', 'Yok'] },
      { id: 'oncekiFizikTedavi', etiket: 'Daha önce fizik tedavi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'ortezProtez', etiket: 'Kullandığınız ortez, protez veya yardımcı cihaz var mı?', tur: 'text' },
    ],
  },

  'enfeksiyon-hastaliklari': {
    baslik: 'Enfeksiyon Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'atesSuresi', etiket: 'Ateşiniz ne zamandır var?', tur: 'radio', secenekler: ['Bugün başladı', 'Birkaç gündür', '1 haftadan uzun'] },
      { id: 'semptomlarEnfeksiyon', etiket: 'Eşlik eden belirtiler', tur: 'checkbox-grup', secenekler: ['Titreme', 'Boğaz Ağrısı', 'Öksürük', 'İshal', 'Döküntü', 'Eklem Ağrısı', 'Yok'] },
      { id: 'seyahatOykusu', etiket: 'Son 1 ay içinde yurt dışı veya farklı bölgeye seyahatiniz oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'hayvanTemasi', etiket: 'Yakın zamanda hayvan teması (ısırık, çiziği vb.) oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikEnfeksiyonGecmisi', etiket: 'Bağışıklık ve Aşı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bagisiklikSorunu', etiket: 'Bilinen bir bağışıklık sistemi sorununuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'asiTakvimiGuncelYetiskin', etiket: 'Aşı takvimini güncel tutuyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
      { id: 'bilinenEnfeksiyonHastaliklari', etiket: 'Bilinen enfeksiyon hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Hepatit', 'Tüberküloz (Verem)', 'HIV', 'Tekrarlayan Enfeksiyonlar', 'Yok'] },
    ],
  },

  endokrinoloji: {
    baslik: 'Endokrin Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarEndokrin', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Aşırı Susama', 'Sık İdrara Çıkma', 'Açıklanamayan Kilo Değişimi', 'Yorgunluk', 'Sıcak / Soğuğa Dayanıksızlık', 'Saç Dökülmesi', 'Çarpıntı', 'Yok'] },
      { id: 'tiroidDiyabet', etiket: 'Bilinen tiroid veya diyabet hastalığınız varsa detay', tur: 'textarea' },
      { id: 'baslikEndokrinGecmisi', etiket: 'Endokrin Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenEndokrinHastaliklari', etiket: 'Bilinen endokrin hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Tip 1 Diyabet', 'Tip 2 Diyabet', 'Hipotiroidi', 'Hipertiroidi', 'Guatr', 'Osteoporoz', 'Yok'] },
      { id: 'kullanilanEndokrinIlaclar', etiket: 'Kullandığınız endokrin ilaçları', tur: 'textarea' },
      { id: 'baslikEndokrinAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileEndokrin', etiket: 'Ailede endokrin hastalık öyküsü', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Tiroid Hastalığı', 'Obezite', 'Yok'] },
    ],
  },

  gastroenteroloji: {
    baslik: 'Sindirim Sistemi Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'karinAgrisiBolgesi', etiket: 'Karın ağrınız hangi bölgede?', tur: 'text' },
      { id: 'semptomlarGastro', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Karın Ağrısı', 'Şişkinlik', 'Bulantı / Kusma', 'Kabızlık', 'İshal', 'Ekşime / Reflü', 'Gaz', 'Yok'] },
      { id: 'kanliDiski', etiket: 'Dışkınızda kan fark ettiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kiloKaybiGastro', etiket: 'İstemsiz kilo kaybınız oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'yutmaGuclugu', etiket: 'Yutma güçlüğü çekiyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikGastroGecmisi', etiket: 'Sindirim Sistemi Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenGastroHastaliklari', etiket: 'Bilinen sindirim sistemi hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Reflü (GÖRH)', 'İrritabl Bağırsak Sendromu', 'Crohn / Ülseratif Kolit', 'Çölyak', 'Karaciğer Hastalığı', 'Safra Kesesi Hastalığı', 'Yok'] },
      { id: 'baslikGastroAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileGastroOykusu', etiket: 'Ailede bilinen sindirim sistemi hastalığı', tur: 'checkbox-grup', secenekler: ['Kolon Kanseri', 'Crohn / Ülseratif Kolit', 'Çölyak', 'Karaciğer Hastalığı', 'Yok'] },
    ],
  },

  nefroloji: {
    baslik: 'Böbrek Sağlığınız',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarNefro', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['İdrar Renginde Değişim', 'İdrar Miktarında Azalma', 'Şişlik (Ödem)', 'Yorgunluk', 'İştahsızlık', 'Bel / Böğür Ağrısı', 'Yok'] },
      { id: 'baslikNefroGecmisi', etiket: 'Böbrek Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenBobrekHastaliklariNefro', etiket: 'Bilinen böbrek hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Kronik Böbrek Hastalığı', 'Böbrek Taşı', 'Tekrarlayan İdrar Yolu Enfeksiyonu', 'Polikistik Böbrek', 'Yok'] },
      { id: 'diyalizOykusu', etiket: 'Daha önce diyaliz tedavisi aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kanBasincTakibi', etiket: 'Kan basıncınızı düzenli takip ediyor musunuz?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
      { id: 'baslikNefroAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileBobrekOykusu', etiket: 'Ailede bilinen böbrek hastalığı', tur: 'checkbox-grup', secenekler: ['Kronik Böbrek Hastalığı', 'Polikistik Böbrek', 'Diyaliz Öyküsü', 'Yok'] },
    ],
  },

  romatoloji: {
    baslik: 'Eklem ve Romatolojik Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarRomato', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Eklem Ağrısı', 'Eklem Şişliği', 'Sabah Tutukluğu', 'Cilt Döküntüsü', 'Kas Ağrısı', 'Yorgunluk', 'Ateş', 'Yok'] },
      { id: 'sabahTutuklugu', etiket: 'Sabah tutukluğunuz varsa ne kadar sürüyor?', tur: 'text' },
      { id: 'etkilenenEklemler', etiket: 'Hangi eklemleriniz etkileniyor?', tur: 'text' },
      { id: 'baslikRomatoGecmisi', etiket: 'Romatolojik Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenRomatolojikHastaliklar', etiket: 'Bilinen romatolojik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Romatoid Artrit', 'Lupus', 'Ankilozan Spondilit', 'Gut', 'Fibromiyalji', 'Yok'] },
      { id: 'baslikRomatoAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileRomatolojik', etiket: 'Ailede bilinen romatolojik hastalık', tur: 'checkbox-grup', secenekler: ['Romatoid Artrit', 'Lupus', 'Psoriazis', 'Ankilozan Spondilit', 'Yok'] },
    ],
  },

  onkoloji: {
    baslik: 'Onkolojik Değerlendirme',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'taniTarihiTuru', etiket: 'Tanı tarihiniz ve türü', tur: 'textarea' },
      { id: 'tedaviAsamasi', etiket: 'Şu anda hangi tedavi aşamasındasınız?', tur: 'text' },
      { id: 'semptomlarOnkoloji', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Ağrı', 'Yorgunluk / Halsizlik', 'İştahsızlık', 'Kilo Kaybı', 'Bulantı', 'Nefes Darlığı', 'Ateş', 'Yok'] },
      { id: 'agriDuzeyi', etiket: 'Şu anki ağrı düzeyiniz (1-10)', tur: 'select', secenekler: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'baslikOnkolojiGecmisi', etiket: 'Tedavi Geçmişi', tur: 'bolum-basligi' },
      { id: 'oncekiOnkolojikTedaviler', etiket: 'Daha önce aldığınız tedaviler', tur: 'checkbox-grup', secenekler: ['Ameliyat', 'Kemoterapi', 'Radyoterapi', 'İmmünoterapi', 'Hormon Tedavisi', 'Yok'] },
      { id: 'baslikOnkolojiAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKanserOykusu', etiket: 'Ailede bilinen kanser öyküsü', tur: 'checkbox-grup', secenekler: ['Meme Kanseri', 'Kolon Kanseri', 'Akciğer Kanseri', 'Prostat Kanseri', 'Yumurtalık Kanseri', 'Diğer Kanser Türü', 'Yok'] },
    ],
  },

  'gogus-hastaliklari': {
    baslik: 'Solunum Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarGogus', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Öksürük', 'Balgam', 'Nefes Darlığı', 'Hırıltılı Solunum', 'Göğüs Ağrısı', 'Ateş', 'Kilo Kaybı', 'Yok'] },
      { id: 'balgamKan', etiket: 'Balgam çıkarıyor musunuz? Kan var mı?', tur: 'radio', secenekler: ['Hayır', 'Balgam var', 'Kanlı balgam var'] },
      { id: 'nefesDarligiGogus', etiket: 'Nefes darlığınız ne zaman oluyor?', tur: 'radio', secenekler: ['Hiç olmuyor', 'Eforla', 'İstirahatte de'] },
      { id: 'sigaraPaketYili', etiket: 'Sigara kullanıyorsanız, günde kaç adet ve kaç yıldır?', tur: 'text' },
      { id: 'baslikGogusGecmisi', etiket: 'Solunum Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'astimKoahTanisi', etiket: 'Bilinen astım veya KOAH tanınız var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'bilinenAkcigerHastaliklari', etiket: 'Bilinen akciğer hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Astım', 'KOAH', 'Bronşit', 'Zatürre Öyküsü', 'Tüberküloz', 'Uyku Apnesi', 'Yok'] },
      { id: 'baslikGogusAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileGogusOykusu', etiket: 'Ailede bilinen solunum hastalığı', tur: 'checkbox-grup', secenekler: ['Astım', 'KOAH', 'Akciğer Kanseri', 'Tüberküloz', 'Yok'] },
    ],
  },

  'gogus-cerrahisi': {
    baslik: 'Toraks Cerrahisi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarGogusCerrahi', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Göğüs Ağrısı', 'Nefes Darlığı', 'Öksürük', 'Kilo Kaybı', 'Balgamda Kan', 'Yok'] },
      { id: 'sigaraOykusuGogus', etiket: 'Sigara kullanım öykünüz', tur: 'text' },
      { id: 'oncekiAkcigerAmeliyati', etiket: 'Daha önce akciğer/göğüs ameliyatı geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'solunumTesti', etiket: 'Solunum fonksiyon testi (SFT) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikGogusCerrahiAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileGogusCerrahiOykusu', etiket: 'Ailede bilinen göğüs hastalığı', tur: 'checkbox-grup', secenekler: ['Akciğer Kanseri', 'KOAH', 'Tüberküloz', 'Yok'] },
    ],
  },

  'plastik-cerrahi': {
    baslik: 'Plastik Cerrahi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'islemAmaci', etiket: 'Görüşmenin amacı', tur: 'radio', secenekler: ['Estetik', 'Rekonstrüktif', 'İkisi de'] },
      { id: 'oncekiEstetikIslem', etiket: 'Daha önce geçirdiğiniz estetik işlemler', tur: 'checkbox-grup', secenekler: ['Botoks / Dolgu', 'Meme Estetiği', 'Liposuction', 'Rinoplasti (Burun)', 'Yüz Germe', 'Yok'] },
      { id: 'yaraIyilesmeSorunu', etiket: 'Yara iyileşmesinde sorun (keloit, geç iyileşme) yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sigaraPlastik', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'], yardim: 'Sigara yara iyileşmesini doğrudan etkiler.' },
      { id: 'baslikPlastikGecmisi', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'kanamaBozukluguPlastik', etiket: 'Bilinen bir kanama/pıhtılaşma bozukluğunuz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'keloitEgilimi', etiket: 'Keloit (aşırı skar) eğiliminiz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
    ],
  },

  'beyin-cerrahisi': {
    baslik: 'Nöroşirürji Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarBeyinCerrahi', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Baş Ağrısı', 'Bilinç Değişikliği', 'Güçsüzlük', 'Uyuşma', 'Denge Bozukluğu', 'Konuşma Bozukluğu', 'Görme Değişikliği', 'Yok'] },
      { id: 'goruntulemeVarMi', etiket: 'Elinizde bir BT/MR sonucu var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikBeyinCerrahiGecmisi', etiket: 'Nöroşirürjik Geçmiş', tur: 'bolum-basligi' },
      { id: 'bilinenNoroşirurjikHastaliklar', etiket: 'Bilinen nöroşirürjik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Beyin Tümörü', 'Kafa Travması Öyküsü', 'Hidrosefali', 'Omurga Hastalığı', 'Anevrizma', 'Yok'] },
      { id: 'oncekiBeyinAmeliyati', etiket: 'Daha önce beyin veya omurga ameliyatı geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },

  'kalp-damar-cerrahisi': {
    baslik: 'Kalp-Damar Cerrahisi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'semptomlarKDC', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Göğüs Ağrısı', 'Bacak Ağrısı', 'Bacakta Şişlik', 'Varis', 'Nefes Darlığı', 'Soğuk Ekstremite', 'Yok'] },
      { id: 'oncekiDamarAmeliyati', etiket: 'Daha önce kalp veya damar ameliyatı geçirdiniz mi?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'sigaraKDC', etiket: 'Sigara kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikKDCGecmisi', etiket: 'Damar Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenDamarHastaliklari', etiket: 'Bilinen damar hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Varis', 'Periferik Arter Hastalığı', 'Anevrizma', 'Derin Ven Trombozu', 'Yok'] },
      { id: 'baslikKDCAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKDCOykusu', etiket: 'Ailede bilinen kalp-damar hastalığı', tur: 'checkbox-grup', secenekler: ['Kalp Hastalığı', 'Anevrizma', 'Varis', 'Yok'] },
    ],
  },

  'cocuk-cerrahisi': {
    baslik: 'Çocuğunuzun Cerrahi Değerlendirmesi',
    alanlar: [
      { id: 'basvuruNedeniCC', etiket: 'Çocuğunuzun bugünkü şikayeti nedir?', tur: 'textarea', zorunlu: true },
      { id: 'semptomlarCC', etiket: 'Aşağıdakilerden hangilerini yaşıyor?', tur: 'checkbox-grup', secenekler: ['Karın Ağrısı', 'Şişlik / Kitle', 'Kusma', 'Kabızlık', 'Ateş', 'İştahsızlık', 'Yok'] },
      { id: 'dogustanAnomali', etiket: 'Doğuştan bilinen bir anomali var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'cocukOncekiAmeliyat', etiket: 'Çocuğunuz daha önce ameliyat oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'cocukAsiTakvimi', etiket: 'Aşı takvimi güncel mi?', tur: 'radio', secenekler: ['Evet', 'Hayır', 'Emin değilim'] },
      { id: 'baslikCCAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileCocukCerrahiOykusu', etiket: 'Ailede bilinen cerrahi ilgili hastalık', tur: 'checkbox-grup', secenekler: ['Doğuştan Anomali', 'Fıtık', 'Yok'] },
    ],
  },

  'aile-hekimligi': {
    baslik: 'Genel Sağlık Kontrolü',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'ziyaretAmaci', etiket: 'Bu bir genel sağlık kontrolü mü, yoksa belirli bir şikayet mi?', tur: 'radio', secenekler: ['Genel kontrol / check-up', 'Belirli bir şikayetim var'] },
      { id: 'genelSemptomlarAile', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Halsizlik', 'Baş Ağrısı', 'Eklem Ağrısı', 'Uyku Sorunu', 'Kilo Değişimi', 'Sindirim Sorunu', 'Yok'] },
      { id: 'guncelTaramalar', etiket: 'Güncel koruyucu tarama testleriniz (kolonoskopi, mamografi vb.)', tur: 'textarea' },
      { id: 'baskaAileHekimi', etiket: 'Başka bir yerde kayıtlı aile hekiminiz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'koruyucuAsiDurumu', etiket: 'Yetişkin aşı takviminiz güncel mi?', tur: 'radio', secenekler: ['Güncel', 'Eksik var', 'Emin değilim'] },
    ],
  },

  'spor-hekimligi': {
    baslik: 'Spor Hekimliği Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sporDaliSikligi', etiket: 'Yaptığınız spor dalı ve haftalık sıklığı', tur: 'text' },
      { id: 'semptomlarSpor', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Eklem Ağrısı', 'Kas Ağrısı', 'Şişlik', 'Hareket Kısıtlılığı', 'Çarpıntı', 'Nefes Darlığı', 'Yok'] },
      { id: 'sonSakatlik', etiket: 'Son sakatlık öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kalpTaramasi', etiket: 'Daha önce kalp taraması (EKG, efor testi) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikSporGecmisi', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenSporSakatligi', etiket: 'Bilinen sakatlık geçmişiniz', tur: 'checkbox-grup', secenekler: ['Bağ Yaralanması', 'Kas Yırtığı', 'Kırık Öyküsü', 'Tendon Sorunu', 'Yok'] },
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
