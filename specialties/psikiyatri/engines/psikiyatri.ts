/**
 * PSIK-EXCEPTIONAL-01 — Ruh Sağlığı ve Hastalıkları (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler (bu bölümün tamamı için geçerli):
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / titrasyon hekimin.
 *  - Tanı kilidi yalnız hekimde: PHQ-9 / GAD-7 / CGI şiddet bandı KARAR DESTEĞİDİR, DSM-5-TR tanısı değildir.
 *  - Özkıyım / kendine zarar / şiddet riski portal mesajı ile yönetilmez → 112 veya en yakın acil.
 *  - Canlı Medula e-imza yok; yeşil/turuncu reçete ve psikotrop rapor çıktısı TASLAKTIR.
 *  - Kapalı servis / istemsiz yatış yönetimi bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TPD'
  | 'DSM5TR'
  | 'SB_RUHSAGLIGI'
  | 'SGK_SUT'
  | 'RECETE_YONETMELIK'
  | 'TITCK'
  | 'PHQ9_KAYNAK'
  | 'GAD7_KAYNAK'
  | 'CGI_KAYNAK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TPD: 'Türkiye Psikiyatri Derneği (TPD) — ayaktan psikiyatri uygulama kaynakları ve etik ilkeler; güncel metni hekim doğrular',
  DSM5TR: 'DSM-5-TR (Amerikan Psikiyatri Birliği, Tanı Ölçütleri Başvuru Kitabı, TR çeviri) — tanı ölçütleri yalnız hekim değerlendirmesiyle kullanılır; Notya tanı koymaz ve ölçütleri metin olarak çoğaltmaz',
  SB_RUHSAGLIGI: 'Sağlık Bakanlığı Ruh Sağlığı Daire Başkanlığı — Ulusal Ruh Sağlığı Eylem Planı ve toplum ruh sağlığı düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — psikotrop ilaç rapor/endikasyon koşulları; güncel metin hekim tarafından doğrulanır',
  RECETE_YONETMELIK: 'Reçete düzenleme mevzuatı — kontrole tabi ilaçlarda yeşil (uyuşturucu) ve turuncu (psikotrop) reçete; güncel liste TİTCK/SB kaynağından hekim tarafından teyit edilir',
  TITCK: 'TİTCK — kontrole tabi madde listeleri ve ürün kısa ürün bilgileri (KÜB); doz bilgisi Notya tarafından üretilmez',
  PHQ9_KAYNAK: 'Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med 2001;16:606–13. Türkçe geçerlilik-güvenilirlik çalışmaları klinik kullanımda yerleşiktir',
  GAD7_KAYNAK: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med 2006;166:1092–7. Türkçe geçerlilik-güvenilirlik çalışmaları klinik kullanımda yerleşiktir',
  CGI_KAYNAK: 'Guy W. ECDEU Assessment Manual for Psychopharmacology (1976) — Clinical Global Impression (CGI-S / CGI-I); klinisyen değerlendirmesidir, hasta doldurmaz',
}

/** Bölümün her yüzünde tekrar eden ürün kilidi metni (hekim yüzü). */
export const HEKIM_KILIT_METNI =
  'Ölçek sonuçları ve kontrol listeleri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

/** Ayaktan pratikte acil yönlendirme tek cümle (hekim yüzü). */
export const ACIL_YONLENDIRME_METNI =
  'Aktif özkıyım planı / niyeti, kendine zarar, başkasına yönelik şiddet riski veya akut psikotik ajitasyon varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil psikiyatri başvurusu.'

/** ISO gün aritmetiği — tüm psikiyatri motorlarında tek kaynak. */
export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function ayEkle(tarih: string, ay: number): string {
  const [y, m, d] = tarih.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10)
}

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}
