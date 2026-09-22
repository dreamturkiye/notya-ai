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
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'

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

      // Veli / Yasal Vasi alt başlığı buradaydı — VELI-YASAL-ONAM ile ortak omurgaya taşındı (coreAlanlar.ts →
      // VELI_BOLUMU): her branşta, yalnız reşit olmayan hastada. Pediatride erişkin hastaya da artık çıkmaz.

      { id: 'baslikDogumGelisim', etiket: 'Doğum ve Gelişim', tur: 'bolum-basligi' },
      { id: 'gebelikKomplikasyonuPed', etiket: 'Gebelik sürecinde aşağıdakilerden biri yaşandı mı?', tur: 'checkbox-grup', zorunlu: true, secenekler: ['Diyabet', 'Hipertansiyon', 'Erken Doğum Riski', 'Enfeksiyon', 'Çoğul Gebelik', 'Tüp Bebek (IVF)', 'Sorun Yaşanmadı'] },
      { id: 'gebelikHaftasiPed', etiket: 'Gebelik Haftası', tur: 'radio', zorunlu: true, secenekler: ['37 haftadan önce', '37-38 hafta', '39 hafta ve üstü', 'Hatırlamıyorum'] },
      { id: 'dogumKilosuPed', etiket: 'Doğum Kilosu (gram)', tur: 'text', zorunlu: true },
      { id: 'dogumBoyuPed', etiket: 'Doğum Boyu (cm)', tur: 'text', zorunlu: true },
      { id: 'basCevresiPed', etiket: 'Baş Çevresi (cm)', tur: 'text', placeholder: 'Hatırladığınız kadarıyla' },
      { id: 'anneBoyPed', etiket: 'Anne boyu (isteğe bağlı)', tur: 'text', placeholder: 'Örn. 165 veya 1.65', yardim: 'Hedef boy hesabı için. Zorunlu değil — doktor Araçlar › Hedef Boy’dan da girebilir.' },
      { id: 'babaBoyPed', etiket: 'Baba boyu (isteğe bağlı)', tur: 'text', placeholder: 'Örn. 182 veya 1.82', yardim: 'Hedef boy hesabı için. Zorunlu değil.' },
      { id: 'dogumSekliPed', etiket: 'Doğum Şekli', tur: 'radio', zorunlu: true, secenekler: ['Normal Doğum', 'Sezaryen'] },
      { id: 'dogumSonrasiPed', etiket: 'Doğum Sonrası', tur: 'radio', zorunlu: true, secenekler: ['Sorun Yaşanmadı', 'Sorun Yaşandı'] },
      { id: 'dogumSonrasiAciklamaPed', etiket: 'Doğum sonrası yaşanan sorun (açıklama)', tur: 'textarea', placeholder: 'Örn. sarılık nedeniyle fototerapi, yenidoğan yoğun bakım, solunum desteği…', yardim: 'Yalnız "Sorun Yaşandı" seçildiyse doldurun.' },
    ],
  },

  kardiyoloji: {
    baslik: 'Kalp Sağlığınız Hakkında',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiKardiyo', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      // KARDIO-EXCEPTIONAL-01 — kırmızı bayrak kutucukları. Etiketler
      // specialties/kardiyoloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerKardio', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Göğüs ağrısı veya baskı', 'Ani / şiddetli nefes darlığı', 'Bayılma veya bilinç kaybı', 'Yüz kayması, konuşma bozukluğu veya ani güçsüzlük', 'Çarpıntı ile birlikte baygınlık veya baş dönmesi', 'Ani bacak şişliği veya nefes darlığı ile birlikte şişlik', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // NOROLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/noroloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerNoro', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ani yüz kayması veya asimetri', 'Ani konuşma bozukluğu veya kelime bulamama', 'Ani kol veya bacak güç kaybı', 'Ani görme kaybı veya çift görme', 'Hayatınızın en şiddetli baş ağrısı (aniden)', 'Bilinç değişikliği veya bayılma', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // DAH-EXCEPTIONAL-01 — acil kutucukları (göz `acilBelirtiler` / derm deseni). Etiketler
      // specialties/dahiliye/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerDahiliye', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Göğüs ağrısı veya baskı', 'Ani / şiddetli nefes darlığı', 'Yüz kayması, konuşma bozukluğu veya ani güçsüzlük', 'Bayılma / bilinç kaybı', 'Ciddi kanama (kusma, siyah dışkı, bol idrar kanı)', 'Şiddetli hipoglisemi (şeker düşmesi) şüphesi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // PSIK-EXCEPTIONAL-01 — kırmızı bayrak kutuları. Etiketler specialties/psikiyatri/engines/acil.ts
      // INTAKE_ACIL_SECENEKLERI ile BİREBİR aynı olmalı (test: specialties/psikiyatri/tests/acil.test.ts).
      // Yalnız psikiyatri branşında; başka branşa taşınmaz (brans-alan-sizmasi).
      {
        id: 'acilBelirtilerPsik', etiket: 'Şu anda aşağıdakilerden herhangi biri var mı?', tur: 'checkbox-grup',
        secenekler: [
          'Yaşamımı sonlandırma düşüncesi',
          'Kendime zarar verme düşüncesi veya davranışı',
          'Başkasına zarar verme korkusu veya düşüncesi',
          'Olmayan sesler duyma, aşırı huzursuzluk veya kontrolü kaybetme hissi',
          'İlacımı kendi kararımla bıraktım',
          'Yok',
        ],
        yardim: 'Bu maddelerden biri varsa formu göndermeyi beklemeyin: 112’yi arayın veya en yakın acile başvurun. Bu form acil başvurunun yerine geçmez.',
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
      // GENEL-CERRAHI-EXCEPTIONAL-01 — kırmızı bayrak kutucukları. Etiketler
      // specialties/genel-cerrahi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerGenelCerrahi', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Şiddetli karın ağrısı ile ateş veya kusma', 'Bol miktarda kanama (kusma veya gaita ile)', 'Fıtık sıkıştı, geri girmiyor veya kızarık/ağrılı', 'Ameliyat sonrası ateş veya yarada kızarıklık / irin', 'Ameliyat sonrası karın ağrısı ile ateş (kötüleşme)', 'Kusma ile birlikte gaz veya gaita çıkaramama', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ORTOPEDI-EXCEPTIONAL-01 — kırmızı bayrak kutucukları. Etiketler
      // specialties/ortopedi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerOrtopedi', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Şiddetli şişlik ile dayanılmaz ağrı (kompartman şüphesi)', 'Ani his, güç veya nabız kaybı', 'Açık kırık / kemik dışarıda görünmesi', 'Ateş ile sıcak veya kızarık eklem', 'Bel ve bacak ağrısı ile idrar veya gaita kontrol kaybı', 'Çıkık ile birlikte soğukluk veya nabız kaybı', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // DERM-EXCEPTIONAL-01 · madde 15 — acil kutucukları (göz `acilBelirtiler` deseni). Etiketler
      // specialties/dermatoloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı;
      // `intakeAcilKodlari()` eşleşmeyi etiket metniyle yapıyor (testle kilitli).
      { id: 'acilBelirtilerDerm', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Yaygın döküntü ile birlikte ateş', 'Nefes darlığı / dilde veya boğazda şişlik', 'Ağızda ve gözde yara ile birlikte döküntü', 'Vücutta yaygın su toplaması (bül)', 'Vücudun tamamına yayılan kızarıklık', 'Hızla yayılan, çok ağrılı kızarıklık / şişlik', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
      { id: 'yeniIlacDerm', etiket: 'Son 8 hafta içinde yeni bir ilaca başladınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'], yardim: 'Antibiyotik, ağrı kesici, epilepsi ilacı, gut ilacı, bitkisel takviye dahil.' },
      { id: 'yeniIlacListesiDerm', etiket: 'Yeni başlanan ilaçlar ve başlama tarihleri', tur: 'textarea', placeholder: 'Örn. 12 Mart’ta antibiyotik, 20 Mart’ta ağrı kesici…', yardim: 'Yalnız “Evet” seçtiyseniz doldurun. Doz yazmanız gerekmez; kutuyu getirmeniz yeterli.' },
      { id: 'gunesMaruziyeti', etiket: 'Yoğun güneşe maruz kalma veya güneş yanığı öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikDermGecmisi', etiket: 'Cilt Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenDermHastaliklari', etiket: 'Bilinen cilt hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Egzama', 'Sedef (Psoriazis)', 'Ürtiker', 'Akne', 'Vitiligo', 'Yok'] },
      // Fototerapi / yama öyküsü: kümülatif doz ve tekrar kür kararı hekimin, ama önceki kürler poliklinikte sorulur.
      { id: 'fototerapiOykusuDerm', etiket: 'Daha önce ışık tedavisi (fototerapi / PUVA) aldınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'fototerapiDetayDerm', etiket: 'Işık tedavisi aldıysanız: kaç yıl önce, kaç seans ve yanık oldu mu?', tur: 'textarea', placeholder: 'Örn. 2 yıl önce yaklaşık 30 seans, bir kez yanık oldu.', yardim: 'Hatırladığınız kadarıyla yazın. Solaryum tedavi değildir ve kullanılmaz.' },
      { id: 'yamaTestiOykusuDerm', etiket: 'Daha önce alerji yama testi (sırta bant) yapıldı mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] },
      { id: 'yamaTestiSonucuDerm', etiket: 'Yama testinde çıkan maddeler (biliyorsanız)', tur: 'textarea', placeholder: 'Örn. nikel, koku karışımı…' },
      { id: 'sistemikTedaviOykusuDerm', etiket: 'Cilt hastalığınız için daha önce hangi tedavileri aldınız?', tur: 'checkbox-grup', secenekler: ['Sadece krem / merhem', 'Işık tedavisi (fototerapi)', 'Ağızdan hap tedavi', 'İğne / damar yoluyla tedavi (biyolojik)', 'Hiçbiri'], yardim: 'Rapor ve geri ödeme için önceki tedavi basamakları gerekir; ilaç adını hatırlamıyorsanız boş bırakın.' },
      { id: 'gebelikDurumuDerm', etiket: 'Gebelik durumu / planı (sizin için geçerliyse)', tur: 'checkbox-grup', secenekler: ['Gebe değilim', 'Gebe olabilirim / şüphem var', 'Gebeyim', 'Emziriyorum', 'Yakın dönemde gebelik planlıyorum', 'Bu soru bana uygun değil'], yardim: 'Bazı cilt tedavileri gebelikte kullanılamaz; bu yüzden soruyoruz. Karar ve test planı doktorunuzdadır.' },
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
      // KBB-EXCEPTIONAL-01 — kırmızı bayrak kutucukları (derm / psikiyatri `acilBelirtiler*` deseni). Etiketler
      // specialties/kulak-burun-bogaz/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı;
      // `intakeAcilKodlari()` eşleşmeyi etiket metniyle yapıyor (testle kilitli).
      { id: 'acilBelirtilerKbb', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Aniden başlayan işitme kaybı', 'Tek kulakta aniden başlayan işitme kaybı veya çınlama', 'Durdurulamayan burun kanaması', 'Nefes darlığı ile birlikte boğazda şişlik veya yutamama', 'Baş dönmesi ile birlikte çift görme, konuşma bozukluğu veya güç kaybı', 'Baş, yüz veya boyun bölgesine darbe / travma', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
      { id: 'semptomlarKBB', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['İşitme Kaybı', 'Kulak Ağrısı', 'Kulak Akıntısı', 'Kulak Çınlaması', 'Kulakta Dolgunluk', 'Baş Dönmesi / Denge Sorunu', 'Burun Tıkanıklığı', 'Burun Akıntısı', 'Burun Kanaması', 'Koku Kaybı', 'Horlama', 'Uykuda Nefes Durması (yakınının fark ettiği)', 'Ses Kısıklığı', 'Boğaz Ağrısı', 'Yutma Güçlüğü', 'Yok'] },
      { id: 'basDonmesiKBB', etiket: 'Baş dönmeniz varsa nasıl tarif edersiniz?', tur: 'radio', secenekler: ['Baş dönmem yok', 'Dönme hissi (etraf dönüyor gibi)', 'Dengesizlik / sallanma', 'Göz kararması', 'Emin değilim'], yardim: 'Yalnızca baş dönmesi yaşıyorsanız doldurun.' },
      { id: 'basDonmesiTetikleyiciKBB', etiket: 'Baş dönmeniz ne zaman oluyor?', tur: 'checkbox-grup', secenekler: ['Yatakta dönünce veya kalkınca', 'Başımı yukarı kaldırınca', 'Ataklar hâlinde, kendiliğinden geçiyor', 'Sürekli var', 'Bu soru bana uygun değil'] },
      { id: 'burunKanamasiKBB', etiket: 'Burun kanamanız varsa ne sıklıkta oluyor?', tur: 'radio', secenekler: ['Kanamam yok', 'Ayda birden az', 'Ayda birkaç kez', 'Haftada birkaç kez', 'Neredeyse her gün'] },
      { id: 'kanSulandiriciKBB', etiket: 'Kan sulandırıcı veya aspirin türü ilaç kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Bilmiyorum'], yardim: 'Burun kanaması ve işlem planı için sorulur. İlaç adını hatırlamıyorsanız kutuyu getirmeniz yeterli; doz yazmanız gerekmez.' },
      { id: 'gurultuMaruziyetiKBB', etiket: 'Gürültülü ortamda çalışıyor veya sık sık yüksek sese maruz kalıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Eskiden'] },
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
      { id: 'acilBelirtiler', etiket: 'Son günlerde bunlardan biri oldu mu? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ani görme kaybı', 'Işık çakması', 'Perde / gölge inmesi', 'Kimyasal madde teması', 'Ağrılı kızarıklık', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile / muayenehaneye başvurun. Kimyasal temasta gözünüzü hemen bol temiz suyla yıkayın.' },
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
      // KD-EXCEPTIONAL-01 — kırmızı bayrak kutucukları (psik / derm `acilBelirtiler*` deseni).
      // Etiketler DÖBYR tehlike işaretleri + ofis jinekoloji acil; tanı değildir, 112 yönlendirmesi.
      { id: 'acilBelirtilerKd', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Vajinal kanama', 'Şiddetli baş ağrısı veya görme bozukluğu', 'Ani el-yüz şişliği', 'Bebek hareketlerinde azalma', 'Erken su gelmesi veya düzenli şiddetli kasılmalar', 'Nefes darlığı veya göğüs ağrısı', 'Şiddetli karın / pelvik ağrı', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile / doğumhaneye başvurun. Bu form acil başvurunun yerine geçmez.' },
      { id: 'sonAdetTarihi', etiket: 'Son Adet Tarihiniz', tur: 'date' },
      { id: 'adetDuzeni', etiket: 'Adet düzeniniz nasıl?', tur: 'radio', secenekler: ['Düzenli', 'Düzensiz', 'Hamileyim', 'Menopoza girdim'] },
      { id: 'semptomlarKadin', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Adet Öncesi Ağrı', 'Aşırı Kanama', 'Ara Kanama', 'Vajinal Akıntı', 'Kaşıntı / Yanma', 'Cinsel İlişkide Ağrı', 'Pelvik Ağrı', 'Yok'] },
      { id: 'gebelikSayisi', etiket: 'Toplam Gebelik Sayısı', tur: 'text' },
      { id: 'dogumSayisi', etiket: 'Doğum Sayısı', tur: 'text' },
      { id: 'dusukSayisi', etiket: 'Düşük / Kürtaj Sayısı', tur: 'text' },
      { id: 'dogumKontrolYontemi', etiket: 'Kullandığınız doğum kontrol yöntemi (varsa)', tur: 'text' },
      { id: 'gebelikSuphesi', etiket: 'Gebelik şüpheniz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim', 'Hamileyim'] },
      { id: 'gebelikHaftasi', etiket: 'Kaçıncı gebelik haftasındasınız?', tur: 'text', placeholder: 'Örn. 12', yardim: 'Bilinen gebelik haftanızı yazın.', gosterEger: { alanId: 'gebelikSuphesi', deger: 'Hamileyim' }, zorunlu: true },
      { id: 'baslikKadinGecmisi', etiket: 'Kadın Sağlığı Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenJinekolojikHastaliklar', etiket: 'Bilinen jinekolojik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Myom', 'Kist', 'Endometriozis', 'PKOS', 'HPV', 'Meme Hastalığı', 'Diğer', 'Yok'] },
      { id: 'jinekolojikHastalikDiger', etiket: 'Diğer jinekolojik hastalık (açıklama)', tur: 'text', placeholder: 'Kısaca yazın', gosterEger: { alanId: 'bilinenJinekolojikHastaliklar', deger: 'Diğer' }, zorunlu: true },
      { id: 'sonSmearTarihi', etiket: 'Son smear tarihiniz', tur: 'text', placeholder: 'Örn. 03.2025 veya yaptırmadım' },
      { id: 'sonMamografiTarihi', etiket: 'Son mamografi tarihiniz', tur: 'text', placeholder: 'Örn. 03.2025 veya yaptırmadım' },
      { id: 'baslikKadinAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileKadinOykusu', etiket: 'Ailede bilinen kadın sağlığı öyküsü', tur: 'checkbox-grup', secenekler: ['Meme Kanseri', 'Yumurtalık Kanseri', 'Rahim Kanseri', 'PKOS', 'Erken Menopoz', 'Yok'] },
    ],
  },

  uroloji: {
    baslik: 'Ürolojik Şikayetiniz',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'acilBelirtilerUroloji', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Gözle görülür idrar kanaması', 'İdrar yapamama / mesaneyi boşaltamama', 'Yan veya bel ağrısı ile ateş', 'Testiste ani şiddetli ağrı (torsiyon şüphesi)', 'Uzamış veya ağrılı ereksiyon (priapizm)', 'Üretra veya pelvis bölgesine darbe / travma', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      { id: 'acilBelirtilerRadyo', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Daha önce ciddi kontrast reaksiyonu / anafilaksi', 'Gebelik olasılığı var ve iyonizan çekim planlanıyor', 'Çekim sırasında nefes darlığı veya bilinç değişikliği', 'Doktorunuz kritik bulgu için acil iletişim istedi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun / klinisyeni bilgilendirin.' },
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
      // ANESTEZI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/anestezi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerAnestezi', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Zor nefes alma veya boğulma hissi', 'Ciddi ilaç alerjisi / şişlik / döküntü (şu an)', 'Yüksek ateş ve kas sertliği (anestezi sonrası şüphe)', 'Kusma sonrası nefes darlığı / aspirasyon şüphesi', 'Ani göğüs ağrısı veya bayılma', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ACIL-TIP-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/acil-tip/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerAcilTip', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Nefes alamıyorum veya boğulma hissi', 'Bayılma / bilinç kaybı veya yanıtsızlık', 'Kontrol edilemeyen kanama', 'Şiddetli nefes darlığı veya morarma', 'Çok düşük tansiyon / soğuk ter / şok hissi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // FIZIK-TEDAVI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/fizik-tedavi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerFtr', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Eyer / oturak bölgesinde uyuşukluk veya idrar-gaita kaçırma', 'İlerleyici güç kaybı veya ayak düşürme', 'Travma sonrası yük bindirememe / kırık şüphesi', 'Ateş ile birlikte bel, sırt veya eklem ağrısı', 'Gece ağrısı, açıklanamayan kilo kaybı veya bilinen kanser ile bel ağrısı', 'Yüksek enerjili travma (trafik, yüksekten düşme) sonrası şiddetli ağrı', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ENFEKSIYON-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/enfeksiyon-hastaliklari/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerEnfeksiyon', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Yüksek ateş ile bilinç bulanıklığı veya aşırı halsizlik', 'Boyun sertliği, ışığa bakamama veya mor noktalı döküntü', 'Hızla yayılan cilt / yumuşak doku şişliği veya şiddetli ağrı', 'Nefes darlığı ile yaygın döküntü veya alerjik şok şüphesi', 'Ateş ile tansiyon düşüklüğü veya organ yetmezliği şüphesi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ENDOKRINOLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/endokrinoloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerEndo', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ciddi hipoglisemi veya bilinç bulanıklığı', 'Kusma, derin nefes veya bilinç değişikliği (ketoasidoz şüphesi)', 'Ateş, çarpıntı ve aşırı ajitasyon (tiroid fırtınası şüphesi)', 'Ani halsizlik / tansiyon düşüklüğü (adrenal kriz şüphesi)', 'Çok yüksek kan şekeri ile aşırı susama / bilinç bulanıklığı', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // GASTROENTEROLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/gastroenteroloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerGastro', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Kanlı kusma veya siyah / kanlı dışkı', 'Ani şiddetli karın ağrısı / sert karın', 'Şiddetli epigastrik ağrı ve kusma (pankreatit şüphesi)', 'Bilinç bulanıklığı / konfüzyon (karaciğer hastasında)', 'Yemek takıldı / yutamıyorum', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // NEFROLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/nefroloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerNef', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Şiddetli halsizlik veya çarpıntı (yüksek potasyum şüphesi)', 'Ani nefes darlığı veya aşırı şişlik', 'Bilinç bulanıklığı veya nöbet (üremik acil şüphesi)', 'Diyaliz erişiminde kanama / enfeksiyon veya kaçırılan seans', 'İdrarın birden azalması veya kesilmesi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ROMATOLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/romatoloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerRoma', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ateş ile birlikte sıcak veya kızarık eklem', 'Şiddetli yaygın eklem ağrısı / alevlenme ile ateş', 'Ani nefes darlığı veya göğüs ağrısı', 'Bilinç değişikliği, bayılma veya ani güç kaybı', 'Yaygın döküntü ile birlikte ateş', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // ONKOLOJI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/onkoloji/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerOnko', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ateş ile birlikte aşırı halsizlik (febril nötropeni şüphesi)', 'Ani sırt ağrısı ve bacak güçsüzlüğü / idrar tutamama', 'Şiddetli nefes darlığı veya göğüs sıkışması', 'Kontrolsüz kusma veya ağızdan sıvı alamama', 'Durmayan / bol kanama', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      { id: 'sikayetSuresiGogus', etiket: 'Bu şikayet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      // GOGUS-EXCEPTIONAL-01 — kırmızı bayrak kutucukları. Etiketler
      // specialties/gogus-hastaliklari/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerGogus', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Bol miktarda kanlı balgam', 'Belirgin nefes darlığı, morarma veya düşük oksijen', 'Ani tek taraflı göğüs ağrısı ile nefes darlığı', 'Nefes borusunda tıkanma / stridor hissi', 'Şiddetli alerjik reaksiyon (şişlik, nefes darlığı)', 'Göğüs ağrısı ile nefes darlığı veya baskı hissi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      { id: 'acilBelirtilerGogusCerrahi', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ani tek taraflı göğüs ağrısı ile nefes darlığı', 'Bol kanlı balgam veya ağızdan bol kan', 'Toraks tüpü / drenin yerinden çıkması veya tıkanması', 'Ameliyat sonrası ani / belirgin nefes darlığı', 'Yara çevresinde hızla artan kızarıklık, irin veya ateş', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // PLASTIK-CERRAHI-EXCEPTIONAL-01 — acil kutucukları. Etiketler specialties/plastik-cerrahi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'baslikPlastikAcil', etiket: 'Acil belirtiler (şimdi)', tur: 'bolum-basligi' },
      { id: 'acilBelirtilerPlastik', etiket: 'Aşağıdakilerden hangileri şu anda var?', tur: 'checkbox-grup', secenekler: [
        'Yara/greftte ani solukluk, morarma veya soğukluk',
        'Hızla büyüyen gergin şişlik (hematom şüphesi)',
        'Yara çevresinde kızarıklık, ateş veya irinli akıntı',
        'Yara kenarlarının açılması / dikişlerin ayrılması',
        'Durmayan / bol kanama',
      ], yardim: 'Bu belirtilerde 112 veya en yakın acil — portal mesajı yeterli değildir.' },
    ],
  },

  'beyin-cerrahisi': {
    baslik: 'Nöroşirürji Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'acilBelirtilerBeyin', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ani bilinç kaybı veya belirgin bilinç kötüleşmesi', 'Yeni kol/bacak güçsüzlüğü veya felç hissi', 'Şiddetli baş ağrısı ve kusma', 'Cerrahi yara sızıntısı veya ateş', 'Ani konuşma bozukluğu', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — etiketler engines/acil.ts INTAKE_ACIL_SECENEKLERI ile birebir.
      { id: 'acilBelirtilerKDC', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Ani soğuk / soluk el veya ayak ile şiddetli ağrı', 'Greft veya bypass hattında ani tıkanma şüphesi', 'Bol kanama veya greft bölgesinde hızla büyüyen şişlik', 'Ani yırtıcı göğüs veya sırt ağrısı', 'Ameliyat sonrası ani göğüs ağrısı veya nefes darlığı', 'Yara çevresinde hızla artan kızarıklık, irin veya ateş', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      { id: 'acilBelirtilerAile', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Göğüs ağrısı veya baskı', 'Ani / şiddetli nefes darlığı', 'Bilinç değişikliği veya bayılma', 'Şiddetli veya durmayan kanama', 'Ani yüz kayması, konuşma bozukluğu veya güç kaybı', 'Ağır alerjik reaksiyon (nefes / şişme)', 'Ani şiddetli karın ağrısı', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
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
      // SPOR-HEKIMLIGI-EXCEPTIONAL-01 — kırmızı bayrak kutucukları. Etiketler
      // specialties/spor-hekimligi/engines/acil.ts → INTAKE_ACIL_SECENEKLERI ile birebir aynı olmalı.
      { id: 'acilBelirtilerSpor', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Baş darbesi sonrası kusma, bilinç kaybı, nöbet veya çift görme', 'Egzersiz / antrenman sırasında göğüs ağrısı', 'Efor veya spor sırasında bayılma', 'Şüpheli kırık ile uyuşma veya güç kaybı', 'Aşırı gergin şişlik / kompartman şüphesi', 'Boyun veya omurga travması şüphesi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.' },
      { id: 'semptomlarSpor', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Eklem Ağrısı', 'Kas Ağrısı', 'Şişlik', 'Hareket Kısıtlılığı', 'Çarpıntı', 'Nefes Darlığı', 'Yok'] },
      { id: 'sonSakatlik', etiket: 'Son sakatlık öykünüz var mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'kalpTaramasi', etiket: 'Daha önce kalp taraması (EKG, efor testi) yaptırdınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
      { id: 'baslikSporGecmisi', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'bilinenSporSakatligi', etiket: 'Bilinen sakatlık geçmişiniz', tur: 'checkbox-grup', secenekler: ['Bağ Yaralanması', 'Kas Yırtığı', 'Kırık Öyküsü', 'Tendon Sorunu', 'Yok'] },
    ],
  },

  'sac-ekimi': {
    baslik: 'Saç Ekimi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sacSikayetSuresi', etiket: 'Saç seyrelmesi / dökülme ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'acilBelirtilerSac', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Yeni ekim alanında hızla yayılan kızarıklık, ateş veya irin', 'Ani yüz şişmesi veya nefes darlığı (ilaç / anestezi sonrası)', 'Kontrolsüz kanama', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112’yi arayın veya kliniği acil arayın.' },
      { id: 'semptomlarSac', etiket: 'Aşağıdakilerden hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Tepe açılması', 'Ön saç çizgisi gerilemesi', 'Yaygın seyrelme', 'Kaşıntı / kepek', 'Yok'] },
      { id: 'baslikSacGecmisi', etiket: 'Saç ve İşlem Geçmişi', tur: 'bolum-basligi' },
      { id: 'oncekiSacIslem', etiket: 'Daha önce saç ekimi veya PRP yapıldı mı?', tur: 'checkbox-grup', secenekler: ['FUE', 'DHI', 'Safir FUE', 'PRP', 'Yok'] },
      { id: 'sacIlac', etiket: 'Kullandığınız saç ilaçları (finasterid, minoksidil vb.)', tur: 'textarea' },
    ],
  },

  'medikal-estetik': {
    baslik: 'Medikal Estetik Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'estetikHedef', etiket: 'Bugünkü işlem hedefiniz nedir?', tur: 'checkbox-grup', secenekler: ['Botoks', 'Dolgu', 'PRP / mezoterapi', 'Lazer', 'Diğer', 'Henüz karar vermedim'] },
      { id: 'acilBelirtilerEstetik', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['İşlem sonrası görme kaybı veya ani şiddetli ağrı (dolgu)', 'Yüzde solukluk / livedo (vasküler oklüzyon şüphesi)', 'Nefes darlığı, yaygın kurdeşen, dil-dudak şişmesi', 'Yok'], yardim: 'Bunlardan biri şu an varsa formu beklemeyin: 112.’yi arayın.' },
      { id: 'baslikEstetikGecmis', etiket: 'İşlem Geçmişi', tur: 'bolum-basligi' },
      { id: 'oncekiEstetik', etiket: 'Daha önce geçirdiğiniz estetik işlemler', tur: 'checkbox-grup', secenekler: ['Botoks', 'Hyaluronik asit dolgu', 'İplik', 'Lazer', 'Yok'] },
      { id: 'estetikAlerji', etiket: 'Bilinen alerji veya herpes öyküsü', tur: 'textarea' },
    ],
  },

  longevity: {
    baslik: 'Longevity & Wellness',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'longevityHedef', etiket: 'Bugünkü başvurunuzun odağı', tur: 'checkbox-grup', secenekler: ['IV destek', 'Hormon değerlendirmesi', 'Check-up / biyobelirteç', 'Uyku / enerji', 'Diğer'] },
      { id: 'acilBelirtilerLongevity', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['IV sırasında nefes darlığı, yaygın kaşıntı veya tansiyon düşmesi', 'Göğüs ağrısı', 'Bayılma', 'Yok'], yardim: 'IV reaksiyon şüphesinde formu beklemeyin: 112.’yi arayın.' },
      { id: 'baslikLongevityGecmis', etiket: 'Sağlık Geçmişi', tur: 'bolum-basligi' },
      { id: 'kronikLongevity', etiket: 'Bilinen kronik hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Hipertansiyon', 'Diyabet', 'Tiroid', 'Böbrek', 'Yok'] },
    ],
  },

  fizyoterapi: {
    baslik: 'Fizyoterapi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'hekimTaniFizyo', etiket: 'Sizi yönlendiren hekimin tanısı (zorunlu — fizyoterapist tanı koymaz)', tur: 'textarea', zorunlu: true, placeholder: 'Hekim adı ve tanı / rapor özeti' },
      { id: 'acilBelirtilerFizyo', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Eyer tarzı uyuşukluk veya idrar / gaita kaçırma (cauda şüphesi)', 'Egzersiz sırasında göğüs ağrısı veya bayılma', 'İlerleyici güç kaybı veya ani düşme', 'Yok'], yardim: 'Bunlardan biri varsa formu beklemeyin: 112 veya hekiminize acil dönün.' },
      { id: 'semptomlarFizyo', etiket: 'Yakınmanız', tur: 'checkbox-grup', secenekler: ['Bel / boyun ağrısı', 'Eklem ağrısı', 'Denge sorunu', 'Felç sonrası', 'Spor sakatlığı', 'Yok'] },
    ],
  },

  'klinik-psikolog': {
    baslik: 'Klinik Psikoloji',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'acilBelirtilerPsikolog', etiket: 'Şu anda bunlardan biri var mı? (varsa işaretleyin)', tur: 'checkbox-grup', secenekler: ['Kendine zarar verme veya intihar düşüncesi', 'Başkasına zarar verme düşüncesi', 'Gerçeği değerlendirmede belirgin bozulma', 'Yok'], yardim: 'Krizde formu beklemeyin: 112 veya en yakın acil / psikiyatri.' },
      { id: 'semptomlarPsikolog', etiket: 'Hangilerini yaşıyorsunuz?', tur: 'checkbox-grup', secenekler: ['Kaygı', 'Çökkünlük', 'Uyku sorunu', 'Panik', 'Travma anıları', 'Yok'] },
      { id: 'oncekiTerapi', etiket: 'Daha önce psikoterapi veya psikiyatri takibi oldu mu?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
    ],
  },

  diyetisyen: {
    baslik: 'Beslenme Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'hekimTaniDiyet', etiket: 'Hekim tanısı / sevk nedeni (tıbbi beslenme için)', tur: 'textarea', placeholder: 'Örn. tip 2 DM — hekim adı' },
      { id: 'acilBelirtilerDiyet', etiket: 'Şu anda bunlardan biri var mı?', tur: 'checkbox-grup', secenekler: ['Kontrolsüz kusma veya bilinç değişikliği (diyabet şüphesi)', 'Ağır alerjik reaksiyon', 'Yok'], yardim: 'Acilde formu beklemeyin: 112.' },
      { id: 'hedefDiyet', etiket: 'Beslenme hedefiniz', tur: 'checkbox-grup', secenekler: ['Kilo', 'Diyabet', 'Kolesterol', 'Gebelik', 'Spor', 'Diğer'] },
    ],
  },

  ergoterapi: {
    baslik: 'Ergoterapi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'hekimTaniErgo', etiket: 'Hekim tanısı / sevk (ergoterapist tanı koymaz)', tur: 'textarea', zorunlu: true },
      { id: 'gyaZorluk', etiket: 'Günlük yaşamda zorlandığınız alanlar', tur: 'checkbox-grup', secenekler: ['Giyinme', 'Yemek', 'Banyo', 'Yazı / okul', 'İş', 'Oyun', 'Yok'] },
      { id: 'acilBelirtilerErgo', etiket: 'Şu anda bunlardan biri var mı?', tur: 'checkbox-grup', secenekler: ['Ani güç kaybı veya konuşma bozukluğu', 'Kontrolsüz nöbet', 'Yok'], yardim: 'Acilde 112.' },
    ],
  },

  odyoloji: {
    baslik: 'Odyoloji Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'acilBelirtilerOdyo', etiket: 'Şu anda bunlardan biri var mı?', tur: 'checkbox-grup', secenekler: ['Saatler / günler içinde ani işitme kaybı', 'Yüz felci ile birlikte işitme kaybı', 'Akıntılı, ağrılı kulak + ateş', 'Yok'], yardim: 'Ani işitme kaybında KBB acil — formu beklemeyin.' },
      { id: 'semptomlarOdyo', etiket: 'Yakınmanız', tur: 'checkbox-grup', secenekler: ['İşitme azalması', 'Çınlama', 'Denge', 'Cihaz ayarı', 'Çocuk tarama', 'Yok'] },
      { id: 'oncekiOdyo', etiket: 'Daha önce odyometri veya cihaz kullanıldı mı?', tur: 'radio', secenekler: ['Hayır', 'Evet'] },
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
  'kadin-hastaliklari-dogum': KADIN_HASTALIKLARI_DOGUM_ETIKETI,
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
  'sac-ekimi': 'Saç Ekimi',
  'medikal-estetik': 'Medikal Estetik',
  longevity: 'Longevity & Wellness',
  fizyoterapi: 'Fizyoterapi',
  'klinik-psikolog': 'Klinik Psikoloji',
  diyetisyen: 'Diyetisyen',
  ergoterapi: 'Ergoterapi',
  odyoloji: 'Odyoloji',
}
