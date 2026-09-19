/**
 * KBB-EXCEPTIONAL-01 — Kulak Burun Boğaz Hastalıkları (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler (bu bölümün tamamı için geçerli):
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: otoskopi kontrol listesi ve odyometri PTA bandı KARAR DESTEĞİDİR,
 *    "kronik otitis media" / "Meniere" gibi tanılar Notya tarafından yazılmaz.
 *  - Ani işitme kaybı, durdurulamayan burun kanaması, hava yolu tehdidi, baş dönmesi + nörolojik bulgu
 *    ve travma portal mesajı ile yönetilmez → 112 veya en yakın acil.
 *  - Canlı Medula e-imza yok; işitme cihazı / rapor çıktısı TASLAKTIR.
 *  - Ameliyathane planlama, cerrahi HIS ve koklear implant cerrahi iş akışı bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TKBBD'
  | 'SB_KBB'
  | 'SGK_SUT'
  | 'TITCK'
  | 'ODYOLOJI_SINIFLAMA'
  | 'ISITME_CIHAZI_MEVZUAT'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TKBBD: 'Türk Kulak Burun Boğaz ve Baş Boyun Cerrahisi Derneği (TKBBD) — ayaktan KBB uygulama kaynakları ve uzlaşı metinleri; güncel metni hekim doğrular',
  SB_KBB: 'T.C. Sağlık Bakanlığı — yenidoğan işitme taraması, gürültüye bağlı işitme kaybı ve birinci basamak KBB yönlendirme düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — işitme cihazı, odyolojik tetkik ve KBB rapor/endikasyon koşulları; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); damla, sprey ve sistemik ilaç dozu Notya tarafından üretilmez',
  ODYOLOJI_SINIFLAMA: 'Saf ses ortalaması (PTA) şiddet sınıflaması — 0,5 / 1 / 2 / 4 kHz hava yolu eşiklerinin ortalaması; bant klinik karar desteğidir, tanı değildir',
  ISITME_CIHAZI_MEVZUAT: 'İşitme cihazı temini: SUT ve SGK medikal malzeme koşulları — odyolojik belge, uzman hekim raporu ve süre koşulları hekim tarafından teyit edilir',
}

/** Bölümün her yüzünde tekrar eden ürün kilidi metni (hekim yüzü). */
export const HEKIM_KILIT_METNI =
  'Otoskopi kontrol listesi, odyometri bandı ve manevra notları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

/** Ayaktan pratikte acil yönlendirme tek cümle (hekim yüzü). */
export const ACIL_YONLENDIRME_METNI =
  'Ani (72 saat içinde) tek taraflı işitme kaybı, durdurulamayan burun kanaması, nefes darlığı ile birlikte boğaz şişliği, nörolojik bulgu eşlik eden baş dönmesi veya baş-boyun travması varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

/** Bölüm kapsam notu — ürün sınırını her yüzde aynı cümleyle söyler. */
export const KAPSAM_NOTU =
  'Ayaktan KBB muayenehanesi / polikliniği ürünü. Ameliyathane planlaması, cerrahi HIS ve koklear implant cerrahi iş akışı bu bölümün kapsamı değildir.'

/** ISO gün aritmetiği — tüm KBB motorlarında tek kaynak. */
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

/** Kulak tarafı — hasta yüzünde de okunabilir Türkçe. */
export type Yan = 'sag' | 'sol' | 'iki'
export const YAN_AD: Record<Yan, string> = { sag: 'Sağ kulak', sol: 'Sol kulak', iki: 'İki kulak' }
export const YAN_LISTESI: Yan[] = ['sag', 'sol', 'iki']

export function yanGecerliMi(x: unknown): x is Yan {
  return x === 'sag' || x === 'sol' || x === 'iki'
}
