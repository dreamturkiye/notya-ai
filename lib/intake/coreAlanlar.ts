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
  dikey?: boolean   // seçenekler alt alta (Kaan 2026-09-10: alerji yok/var + açıklama)
}

export interface IntakeBolum {
  baslik: string
  alanlar: IntakeAlan[]
}

export const CORE_BOLUMLER: IntakeBolum[] = [
  {
    baslik: 'Kimlik Bilgileri',
    alanlar: [
      { id: 'tcKimlik', etiket: 'T.C. Kimlik Numarası', tur: 'text', zorunlu: true, placeholder: '11 haneli T.C. Kimlik No', yardim: 'Yalnızca doktorunuzla paylaşılır, KVKK kapsamında şifrelenerek saklanır.' },
      { id: 'ad', etiket: 'Adı', tur: 'text', zorunlu: true },
      { id: 'soyad', etiket: 'Soyadı', tur: 'text', zorunlu: true },
      { id: 'dogumTarihi', etiket: 'Doğum Tarihi', tur: 'date', zorunlu: true },
      { id: 'cinsiyet', etiket: 'Cinsiyet', tur: 'radio', zorunlu: true, secenekler: ['Kadın', 'Erkek'] },
      { id: 'dogumYeri', etiket: 'Doğum Yeri', tur: 'text', zorunlu: true },
    ],
  },
  {
    baslik: 'İletişim Bilgileri',
    alanlar: [
      { id: 'telefon', etiket: 'Cep Telefonu', tur: 'tel', zorunlu: true, placeholder: '05xx xxx xx xx' },
      { id: 'eposta', etiket: 'E-posta', tur: 'email', zorunlu: true },
      { id: 'adres', etiket: 'Adres', tur: 'textarea', zorunlu: true },
      { id: 'acilKisiAdi', etiket: 'Acil Durumda Aranacak Kişi (Ad Soyad)', tur: 'text', zorunlu: true },
      { id: 'acilKisiTelefon', etiket: 'Acil Durum Kişisi Telefonu', tur: 'tel', zorunlu: true },
      { id: 'acilKisiYakinlik', etiket: 'Yakınlık Derecesi', tur: 'text', zorunlu: true, placeholder: 'Örn. eş, anne, kardeş' },
    ],
  },
  {
    baslik: 'Sağlık Güvencesi',
    alanlar: [
      { id: 'sigortaTuru', etiket: 'Sağlık Güvenceniz', tur: 'radio', zorunlu: true, secenekler: ['Ücretli Hasta', 'Özel Sağlık Sigortası', 'Tamamlayıcı Sağlık Sigortası', 'Kurumsal Anlaşma', 'SGK'] },
      { id: 'sigortaSirketi', etiket: 'Özel Sigorta Şirketi', tur: 'text', zorunlu: true, placeholder: 'Yoksa "Yok" yazın' },
      { id: 'policeNo', etiket: 'Poliçe / Üyelik Numarası', tur: 'text', zorunlu: true, placeholder: 'Yoksa "Yok" yazın' },
      { id: 'kurumAdi', etiket: 'Kurum / İşveren Adı', tur: 'text', zorunlu: true, placeholder: 'Yoksa "Yok" yazın' },
    ],
  },
  {
    baslik: 'Sağlık Geçmişi',
    alanlar: [
      { id: 'kanGrubu', etiket: 'Kan Grubu', tur: 'radio', zorunlu: true, secenekler: ['Bilmiyorum', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'] },
      { id: 'kronikHastaliklar', etiket: 'Bilinen Kronik Hastalıklarınız', tur: 'checkbox-grup', zorunlu: true, secenekler: ['Diyabet', 'Hipertansiyon', 'Astım / KOAH', 'Kalp Hastalığı', 'Böbrek Hastalığı', 'Tiroid Hastalığı', 'Kanser', 'Yok'] },
      { id: 'gecirilmisAmeliyatlar', etiket: 'Geçirdiğiniz Ameliyatlar', tur: 'textarea', zorunlu: true, placeholder: 'Ameliyat adı ve yılı — yoksa "Yok" yazın' },
      { id: 'kullaniyorMu', etiket: 'Düzenli ilaç kullanıyor musunuz?', tur: 'radio', zorunlu: true, secenekler: ['Hayır', 'Evet'] },
      { id: 'kullanilanIlaclar', etiket: 'İlaç Adı ve Dozu', tur: 'textarea', zorunlu: true, placeholder: 'Yoksa "Yok" yazın' },
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
      { id: 'dogruBeyan', etiket: 'Verdiğim bilgilerin doğru olduğunu beyan ederim.', tur: 'radio', zorunlu: true, secenekler: ['Beyan ediyorum'] },
      { id: 'kvkkOnay', etiket: 'KVKK Aydınlatma Metni\'ni okudum, kişisel verilerimin ilgili mevzuat kapsamında işlenmesini kabul ediyorum.', tur: 'radio', zorunlu: true, secenekler: ['Kabul ediyorum'] },
      { id: 'iletisimOnay', etiket: 'Gerekli durumlarda tarafımla telefon veya SMS yoluyla iletişime geçilmesini kabul ediyorum.', tur: 'radio', secenekler: ['Kabul ediyorum'] },
    ],
  },
]

/** NOTYA-INTAKE-05: branşa göre çekirdek alan uyarlaması (Dr. Gökhan Mamur canlı test
 * geri bildirimi, 2026-09-02). Pediatride sağlık geçmişi ebeveynin serbest metinle
 * anlatacağı şekilde sadeleştirildi; sigara sorusu "ailede" bağlamına çevrildi, alkol
 * sorusu kaldırıldı. Diğer branşlar çekirdeği olduğu gibi kullanır. Alan id'leri
 * DEĞİŞMEDİ — eski gönderimlerle veri uyumluluğu korunur. */
export function coreBolumlerIcin(brans: string): IntakeBolum[] {
  if (brans !== 'pediatri') return CORE_BOLUMLER
  return CORE_BOLUMLER.map((bolum) => {
    if (bolum.baslik === 'Onay') {
      // #13 (2026-09-02): "doğru beyan" onayı yasal zorunluluk DEĞİL — pediatride kaldırıldı.
      // KVKK açık rıza (kvkkOnay) ise KVKK m.6 özel nitelikli veri (sağlık) için ZORUNLU ve kalıyor.
      return { ...bolum, alanlar: bolum.alanlar.filter((a) => a.id !== 'dogruBeyan') }
    }
    if (bolum.baslik !== 'Sağlık Geçmişi') return bolum
    return {
      ...bolum,
      alanlar: bolum.alanlar.flatMap((alan): IntakeAlan[] => {
        switch (alan.id) {
          case 'kronikHastaliklar':
            return [{ id: 'kronikHastaliklar', etiket: 'Özgeçmiş — Hastalık / Ameliyat', tur: 'textarea', zorunlu: true, placeholder: 'Çocuğunuzun geçirdiği hastalıklar, ameliyatlar ve yılları — yoksa "Yok" yazın' }]
          case 'gecirilmisAmeliyatlar':
            return [] // Özgeçmiş alanına birleştirildi
          case 'kullaniyorMu':
            return [] // Evet/Hayır ara sorusu kaldırıldı — doğrudan serbest metin
          case 'kullanilanIlaclar':
            return [{ id: 'kullanilanIlaclar', etiket: 'Kullanılan İlaç / Takviyeler', tur: 'textarea', zorunlu: true, placeholder: 'Düzenli kullanılan ilaç ve takviyeler (adı, dozu) — yoksa "Yok" yazın' }]
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
