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
 * Alan şeması TÜRKÇE, çünkü form doğrudan hastaya gösteriliyor — İngilizce id/type dışında her
 * şey hastanın göreceği metin.
 */

export type IntakeAlanTuru = 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea' | 'radio' | 'checkbox-grup'

export interface IntakeAlan {
  id: string
  etiket: string
  tur: IntakeAlanTuru
  zorunlu?: boolean
  secenekler?: string[]
  placeholder?: string
  yardim?: string
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
      { id: 'dogumYeri', etiket: 'Doğum Yeri', tur: 'text' },
    ],
  },
  {
    baslik: 'İletişim Bilgileri',
    alanlar: [
      { id: 'telefon', etiket: 'Cep Telefonu', tur: 'tel', zorunlu: true, placeholder: '05xx xxx xx xx' },
      { id: 'eposta', etiket: 'E-posta', tur: 'email' },
      { id: 'adres', etiket: 'Adres', tur: 'textarea' },
      { id: 'acilKisiAdi', etiket: 'Acil Durumda Aranacak Kişi (Ad Soyad)', tur: 'text', zorunlu: true },
      { id: 'acilKisiTelefon', etiket: 'Acil Durum Kişisi Telefonu', tur: 'tel', zorunlu: true },
      { id: 'acilKisiYakinlik', etiket: 'Yakınlık Derecesi', tur: 'text', placeholder: 'Örn. eş, anne, kardeş' },
    ],
  },
  {
    baslik: 'Sağlık Güvencesi',
    alanlar: [
      { id: 'sigortaTuru', etiket: 'Sağlık Güvenceniz', tur: 'radio', zorunlu: true, secenekler: ['SGK', 'Özel Sağlık Sigortası', 'Kurumsal Anlaşma (İşveren)', 'Güvencem Yok / Kendim Ödeyeceğim'] },
      { id: 'sigortaSirketi', etiket: 'Özel Sigorta Şirketi', tur: 'text', yardim: 'Yalnızca özel sağlık sigortanız varsa doldurun.' },
      { id: 'policeNo', etiket: 'Poliçe / Üyelik Numarası', tur: 'text' },
      { id: 'kurumAdi', etiket: 'Kurum / İşveren Adı', tur: 'text', yardim: 'Yalnızca kurumsal anlaşmanız varsa doldurun.' },
    ],
  },
  {
    baslik: 'Sağlık Geçmişi',
    alanlar: [
      { id: 'kanGrubu', etiket: 'Kan Grubu', tur: 'select', secenekler: ['0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', 'Bilmiyorum'] },
      { id: 'kronikHastaliklar', etiket: 'Bilinen Kronik Hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Diyabet', 'Hipertansiyon', 'Astım / KOAH', 'Kalp Hastalığı', 'Böbrek Hastalığı', 'Tiroid Hastalığı', 'Kanser', 'Yok'] },
      { id: 'gecirilmisAmeliyatlar', etiket: 'Geçirdiğiniz Ameliyatlar', tur: 'textarea', placeholder: 'Ameliyat adı ve yılı' },
      { id: 'kullanilanIlaclar', etiket: 'Düzenli Kullandığınız İlaçlar', tur: 'textarea', placeholder: 'İlaç adı ve dozu' },
      { id: 'alerjiler', etiket: 'Bilinen İlaç / Gıda Alerjileriniz', tur: 'textarea' },
      { id: 'aileOykusu', etiket: 'Aile Sağlık Öyküsü', tur: 'textarea', placeholder: 'Anne/baba/kardeşte bilinen ciddi hastalıklar' },
      { id: 'sigara', etiket: 'Sigara Kullanımı', tur: 'radio', secenekler: ['Kullanmıyorum', 'Kullanıyorum', 'Bıraktım'] },
      { id: 'alkol', etiket: 'Alkol Kullanımı', tur: 'radio', secenekler: ['Kullanmıyorum', 'Ara sıra', 'Düzenli kullanıyorum'] },
    ],
  },
  {
    baslik: 'Onay',
    alanlar: [
      { id: 'kvkkOnay', etiket: 'KVKK Aydınlatma Metni\'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.', tur: 'radio', zorunlu: true, secenekler: ['Kabul ediyorum'] },
      { id: 'tedaviOnay', etiket: 'Verdiğim bilgilerin doğru olduğunu ve tedavi sürecinde kullanılmasını onaylıyorum.', tur: 'radio', zorunlu: true, secenekler: ['Onaylıyorum'] },
    ],
  },
]
