/**
 * NOTYA-INTAKE-01 — hasta bilgi formu: tip tanımları + her branş için ORTAK (core) alanlar.
 *
 * Mimari karar: 30 ayrı tam form yerine TEK ortak çekirdek (kimlik, iletişim, sigorta, sağlık
 * geçmişi, KVKK onayı) + lib/intake/bransSorulari.ts içinde her branşa özel EK sorular. Bir
 * kardiyoloji hastası TC Kimlik/alerji/sigorta sorularını pediatri hastasıyla aynı şekilde
 * yanıtlar; yalnızca "branşa özel" bölüm değişir. 30 forma bakım yapmak yerine 1 çekirdek + 30
 * küçük ek modül bakımı — aynı bilgiyi iki kez tanımlamamak, gelecekte bir alan eklenince 30
 * yerde değil 1 yerde değişmek için.
 *
 * NOTYA-INTAKE-03 — tasarım prensipleri (Acıbadem/Medicana/Amerikan Hastanesi karşılaştırması +
 * Apple HIG sadelik ilkesi üzerinden gözden geçirildi):
 *   - 'checkbox-grup' ve 'radio' alanları render katmanında (web + PDF) 2-3 sütunlu ızgarada,
 *     serbest metin yerine işaretlenerek dolduruluyor — "15-20 seçenek tek sütunda" anti-pattern'i
 *     yok. Yatay Evet/Hayır tercih ediliyor, dikey liste değil.
 *   - 'bolum-basligi' tipi: bir branş bölümü içinde alt başlık (örn. pediatri "Doğum ve Gelişim")
 *     — input almaz, yalnızca tarama hızını artıran görsel ayraç.
 *   - Her branşın ilk sorusu artık "Bugünkü başvuru nedeniniz nedir?" (bkz. bransSorulari.ts) —
 *     Acıbadem/Medicana formlarında bile sıkça atlanan, ama bir doktorun 30 saniyede hastayı
 *     anlaması için en kritik tek alan.
 *   - Hedef: Acıbadem'in klinik kapsamı + Apple'ın 3-5 dakikalık doldurma deneyimi. Daha fazla
 *     soru değil, daha akıllı soru.
 *
 * Alan şeması TÜRKÇE, çünkü form doğrudan hastaya gösteriliyor — İngilizce id/type dışında her
 * şey hastanın göreceği metin.
 */

export type IntakeAlanTuru = 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea' | 'radio' | 'checkbox-grup' | 'bolum-basligi'

export interface IntakeAlan {
  id: string
  etiket: string
  tur: IntakeAlanTuru
  zorunlu?: boolean
  secenekler?: string[]
  placeholder?: string
  yardim?: string
  desen?: string
  desenHata?: string
  dikey?: boolean   // seçenekler alt alta (Kaan 2026-09-10: alerji yok/var + açıklama)
  /** Show this field only when another answer matches (e.g. Hamileyim → gebelik haftası). */
  gosterEger?: { alanId: string; deger: string }
}

export interface IntakeBolum {
  baslik: string
  alanlar: IntakeAlan[]
  /**
   * VELI-YASAL-ONAM — bölüm yalnız formdaki doğum tarihine göre reşit olmayan hastada görünür (ve yalnız o zaman
   * doğrulanır / kaydedilir). Karar kapsam.ts → veliOnamGerekliMi (yaş, branştan bağımsız); doğum tarihi girilmeden
   * bölüm çizilmez. Bkz. lib/intake/dogrula.ts → intakeBolumGorunur.
   */
  veliKosulu?: { dogumAlanId: string }
}

/**
 * VELI-YASAL-ONAM (Kaan 2026-09-17): "18 yaşını doldurmamış her çocukta klinik kayıt ve tıbbi onam için veli / yasal
 * temsilci bilgisi alınır. Pratik kural: Ad, soyad, yakınlık (anne, baba, vasi), telefon; mümkünse kimlik teyidi."
 * Eskiden yalnız pediatri branş bölümündeydi (yakınlık Anne/Baba/Diğer + "Diğer" metni); artık ortak omurgada, her
 * branşta aynı, YAŞ güdümlü (veliKosulu → veliOnamGerekliMi) — erişkin hastada hiç çizilmez. Reşit olmayanda zorunlu;
 * yalnız kimlik teyidi isteğe bağlı ("mümkünse"). veliYakinligi / veliDigerAdSoyad id'leri eski pediatri
 * gönderimleriyle aynı (hastaDosyaDerleyici "veli beyanı" kararı veliYakinligi'ne bakar).
 */
export const VELI_BOLUMU: IntakeBolum = {
  baslik: 'Veli / Yasal Temsilci',
  veliKosulu: { dogumAlanId: 'dogumTarihi' },
  alanlar: [
    { id: 'veliAd', etiket: 'Veli / Yasal Temsilcinin Adı', tur: 'text', zorunlu: true, yardim: '18 yaşından küçük hastalarda muayene ve tıbbi onam için veli / yasal temsilci bilgisi gereklidir.' },
    { id: 'veliSoyad', etiket: 'Veli / Yasal Temsilcinin Soyadı', tur: 'text', zorunlu: true },
    { id: 'veliYakinligi', etiket: 'Veli / Yasal Temsilcinin Yakınlığı', tur: 'radio', zorunlu: true, secenekler: ['Anne', 'Baba', 'Vasi', 'Diğer'] },
    { id: 'veliDigerAdSoyad', etiket: 'Yakınlığı (Diğer ise)', tur: 'text', placeholder: 'Örn. anneanne, bakıcı, koruyucu aile', yardim: 'Yalnız "Diğer" seçildiyse doldurun.' },
    { id: 'veliTelefon', etiket: 'Veli / Yasal Temsilcinin Telefonu', tur: 'tel', zorunlu: true, placeholder: '05xx xxx xx xx' },
    { id: 'veliKimlikTeyidi', etiket: 'Kimlik Teyidi (isteğe bağlı)', tur: 'checkbox-grup', secenekler: ['Kimlik teyidi yapıldı'], yardim: 'Form klinikte dolduruluyorsa ve veli / yasal temsilcinin kimliği görüldüyse işaretleyin. Uzaktan dolduruyorsanız boş bırakın; teyit muayenede yapılır.' },
  ],
}

export const CORE_BOLUMLER: IntakeBolum[] = [
  {
    baslik: 'Kimlik Bilgileri',
    alanlar: [
      // Kaan (2026-09-13): "ne az ne de fazla" — tam 11 hane zorunlu. desen istemci+sunucuda uygulanır.
      { id: 'tcKimlik', etiket: 'T.C. Kimlik Numarası', tur: 'text', zorunlu: true, placeholder: '11 haneli T.C. Kimlik No', desen: '^[0-9]{11}$', desenHata: 'T.C. Kimlik Numarası tam 11 haneli rakam olmalıdır.', yardim: 'Yalnızca doktorunuzla paylaşılır, KVKK kapsamında şifrelenerek saklanır.' },
      { id: 'ad', etiket: 'Adı', tur: 'text', zorunlu: true },
      { id: 'soyad', etiket: 'Soyadı', tur: 'text', zorunlu: true },
      { id: 'dogumTarihi', etiket: 'Doğum Tarihi', tur: 'date', zorunlu: true },
      { id: 'cinsiyet', etiket: 'Cinsiyet', tur: 'radio', zorunlu: true, secenekler: ['Kadın', 'Erkek'] },
      { id: 'dogumYeri', etiket: 'Doğum Yeri', tur: 'text', zorunlu: true },
      // Kaan (2026-09-13): anne/baba adı ve medeni durum eksikti — Türk sağlık formu geleneği
      { id: 'babaAdi', etiket: 'Baba Adı', tur: 'text', zorunlu: true },
      { id: 'anneAdi', etiket: 'Ana Adı', tur: 'text', zorunlu: true },
      { id: 'medeniDurum', etiket: 'Medeni Durum', tur: 'radio', zorunlu: true, secenekler: ['Bekâr', 'Evli', 'Boşanmış', 'Dul'] },
    ],
  },
  VELI_BOLUMU,
  {
    baslik: 'İletişim Bilgileri',
    alanlar: [
      { id: 'telefon', etiket: 'Cep Telefonu', tur: 'tel', zorunlu: true, placeholder: '05xx xxx xx xx' },
      { id: 'eposta', etiket: 'E-posta', tur: 'email', zorunlu: true },
      { id: 'adres', etiket: 'Adres', tur: 'textarea', zorunlu: true },
      { id: 'il', etiket: 'Şehir', tur: 'text', placeholder: 'Örn. İstanbul' },  // Kaan 2026-09-10: isteğe bağlı; Özet › Şehir buradan dolar
    ],
  },
  // ACIL-KISI (Kaan 2026-09-17): Türk sağlık pratiğinde yerleşik (yatış formu "hasta yakını", Kişisel Sağlık Bilgi
  // Formu, e-Nabız "Acil Durumda Aranacak Kişi Listesi") — ama HER YERDE İSTEĞE BAĞLI, asla zorunlu değil (kalıcı
  // kural). Her branş, her yaş. Veli bölümünden ayrı: veli = hukuki temsil/onam, bu = yalnız iletişim.
  // Alan id'leri İletişim Bilgileri'ndeki eski (zorunlu) alanlarla aynı — eski gönderimler aynı etiketle okunur.
  {
    baslik: 'Acil Durumda Aranacak Kişi (isteğe bağlı)',
    alanlar: [
      { id: 'acilKisiAdi', etiket: 'Acil Durumda Aranacak Kişi (Ad Soyad)', tur: 'text', yardim: 'Zorunlu değil — dilerseniz boş bırakabilirsiniz.' },
      { id: 'acilKisiYakinlik', etiket: 'Acil Durum Kişisinin Yakınlık Derecesi', tur: 'text', placeholder: 'Örn. eş, anne, baba, kardeş, arkadaş' },
      { id: 'acilKisiTelefon', etiket: 'Acil Durum Kişisi Telefonu', tur: 'tel', placeholder: '05xx xxx xx xx' },
    ],
  },
  {
    baslik: 'Sağlık Güvencesi',
    alanlar: [
      { id: 'sigortaTuru', etiket: 'Sağlık Güvenceniz', tur: 'radio', zorunlu: true, secenekler: ['Ücretli Hasta', 'Özel Sağlık Sigortası', 'Tamamlayıcı Sağlık Sigortası', 'Kurumsal Anlaşma', 'SGK'] },
      // NOTYA-INTAKE-08 (Dr. Gökhan, 2026-09-17): 'Yoksa "Yok" yazın' ipucu olan alanlar ZORUNLU DEĞİL.
      // Hastaların çoğunun özel sigortası yok; zorunlu tutmak hastayı "Yok" yazmaya zorlayan bir
      // geçici çözüme itiyordu. Boş bırakmak ile "Yok" yazmak aynı bilgiyi taşır — alan isteğe bağlı.
      { id: 'sigortaSirketi', etiket: 'Özel Sigorta Şirketi', tur: 'text', placeholder: 'Yoksa "Yok" yazın' },
      { id: 'policeNo', etiket: 'Poliçe / Üyelik Numarası', tur: 'text', placeholder: 'Yoksa "Yok" yazın' },
      { id: 'kurumAdi', etiket: 'Kurum / İşveren Adı', tur: 'text', placeholder: 'Yoksa "Yok" yazın' },
    ],
  },
  {
    baslik: 'Sağlık Geçmişi',
    alanlar: [
      { id: 'kanGrubu', etiket: 'Kan Grubu', tur: 'radio', zorunlu: true, secenekler: ['Bilmiyorum', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'] },
      { id: 'kronikHastaliklar', etiket: 'Bilinen Kronik Hastalıklarınız', tur: 'checkbox-grup', zorunlu: true, secenekler: ['Diyabet', 'Hipertansiyon', 'Astım / KOAH', 'Kalp Hastalığı', 'Böbrek Hastalığı', 'Tiroid Hastalığı', 'Kanser', 'Yok'] },
      // Aynı gerekçe (NOTYA-INTAKE-08): 'yoksa "Yok" yazın' ipucu → alan isteğe bağlı.
      { id: 'gecirilmisAmeliyatlar', etiket: 'Geçirdiğiniz Ameliyatlar', tur: 'textarea', placeholder: 'Ameliyat adı ve yılı — yoksa "Yok" yazın' },
      { id: 'kullaniyorMu', etiket: 'Düzenli ilaç kullanıyor musunuz?', tur: 'radio', zorunlu: true, secenekler: ['Hayır', 'Evet'] },
      { id: 'kullanilanIlaclar', etiket: 'İlaç Adı ve Dozu', tur: 'textarea', placeholder: 'Yoksa "Yok" yazın' },
      { id: 'alerjiVarMi', etiket: 'Bilinen Alerjileriniz', tur: 'radio', zorunlu: true, dikey: true, secenekler: ['Bilinen alerjisi yok', 'Bilinen alerjisi var'] },
      { id: 'alerjiAciklama', etiket: 'Alerji açıklaması', tur: 'textarea', placeholder: 'İlaç, gıda veya diğer bilinen alerjileri yazın', yardim: 'Yalnız "Bilinen alerjisi var" seçildiyse doldurun.' },
      { id: 'aileOykusu', etiket: 'Aile Sağlık Öyküsü', tur: 'textarea', zorunlu: true, placeholder: 'Anne/baba/kardeşte bilinen ciddi hastalıklar' },
      { id: 'sigara', etiket: 'Sigara Kullanımı', tur: 'radio', zorunlu: true, secenekler: ['Kullanmıyorum', 'Kullanıyorum', 'Bıraktım'] },
      { id: 'alkol', etiket: 'Alkol Kullanımı', tur: 'radio', zorunlu: true, secenekler: ['Kullanmıyorum', 'Ara sıra', 'Düzenli kullanıyorum'] },
    ],
  },
  {
    baslik: 'Onay',
    alanlar: [
      { id: 'kvkkOnay', etiket: 'KVKK Aydınlatma Metni\'ni okudum, kişisel verilerimin ilgili mevzuat kapsamında işlenmesini kabul ediyorum.', tur: 'radio', zorunlu: true, secenekler: ['Kabul ediyorum'] },
      { id: 'iletisimOnay', etiket: 'Gerekli durumlarda tarafımla telefon veya SMS yoluyla iletişime geçilmesini kabul ediyorum.', tur: 'radio', secenekler: ['Kabul ediyorum'] },
    ],
  },
]

/** NOTYA-FORM-ONAY-SON (Gökhan): Onay (KVKK) bölümü her zaman formun EN SONUNDA olmalı —
 * core'un sonundaydı ama branş soruları (pediatride doğum/gelişim) sonradan eklenince ortada kalıyordu.
 * Hastanın gördüğü tam bölüm listesi: çekirdek + branş bölümü, onay sonda (web formu + testler). */
export function intakeFormBolumleri(coreBolumler: IntakeBolum[], bransBolumu: IntakeBolum | null): IntakeBolum[] {
  const bolumler = [...coreBolumler, ...(bransBolumu ? [bransBolumu] : [])]
  return [...bolumler.filter((b) => b.baslik !== 'Onay'), ...bolumler.filter((b) => b.baslik === 'Onay')]
}

/** NOTYA-INTAKE-05: branşa göre çekirdek alan uyarlaması (Dr. Gökhan Mamur canlı test
 * geri bildirimi, 2026-09-02). Pediatride sağlık geçmişi ebeveynin serbest metinle
 * anlatacağı şekilde sadeleştirildi; sigara sorusu "ailede" bağlamına çevrildi, alkol
 * sorusu kaldırıldı. Diğer branşlar çekirdeği olduğu gibi kullanır. Alan id'leri
 * DEĞİŞMEDİ — eski gönderimlerle veri uyumluluğu korunur. */
export function coreBolumlerIcin(brans: string): IntakeBolum[] {
  if (brans !== 'pediatri') return CORE_BOLUMLER
  return CORE_BOLUMLER.map((bolum) => {
    if (bolum.baslik !== 'Sağlık Geçmişi') return bolum
    return {
      ...bolum,
      alanlar: bolum.alanlar.flatMap((alan): IntakeAlan[] => {
        switch (alan.id) {
          case 'kronikHastaliklar':
            // NOTYA-INTAKE-08: 'yoksa "Yok" yazın' ipucu olan alanlar isteğe bağlı (core ile hizalı).
            return [{ id: 'kronikHastaliklar', etiket: 'Özgeçmiş — Hastalık / Ameliyat', tur: 'textarea', placeholder: 'Çocuğunuzun geçirdiği hastalıklar, ameliyatlar ve yılları — yoksa "Yok" yazın' }]
          case 'gecirilmisAmeliyatlar':
            return [] // Özgeçmiş alanına birleştirildi
          case 'kullaniyorMu':
            return [] // Evet/Hayır ara sorusu kaldırıldı — doğrudan serbest metin
          case 'kullanilanIlaclar':
            return [{ id: 'kullanilanIlaclar', etiket: 'Kullanılan İlaç / Takviyeler', tur: 'textarea', placeholder: 'Düzenli kullanılan ilaç ve takviyeler (adı, dozu) — yoksa "Yok" yazın' }]
          case 'alerjiler':
          case 'alerjiVarMi':
            // Core ile hizalı (2026-09-08): checkbox yerine yok/var + açıklama.
            return [
              { id: 'alerjiVarMi', etiket: 'Bilinen Alerjiler', tur: 'radio', zorunlu: true, dikey: true, secenekler: ['Bilinen alerjisi yok', 'Bilinen alerjisi var'] },
              { id: 'alerjiAciklama', etiket: 'Alerji açıklaması', tur: 'textarea', placeholder: 'İlaç, gıda veya diğer bilinen alerjileri yazın', yardim: 'Yalnız "Bilinen alerjisi var" seçildiyse doldurun.' },
            ]
          case 'alerjiAciklama':
            return [] // yukarıda alerjiVarMi ile birlikte üretildi
          case 'sigara':
            return [{ id: 'sigara', etiket: 'Ailede Sigara Kullanımı', tur: 'radio', zorunlu: true, secenekler: ['Evet', 'Hayır'] }]
          case 'alkol':
            return [] // pediatrik formda anlamsız
          default:
            return [alan]
        }
      }),
    }
  })
}
