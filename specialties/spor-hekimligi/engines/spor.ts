/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor hekimliği (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: RTP basamağı ve sakatlık şiddet bandı KARAR DESTEĞİDİR.
 *  - Konküzyon kırmızı bayrakları, egzersiz göğüs ağrısı, senkop, şüpheli kırık+nöro, kompartman
 *    portal mesajı ile yönetilmez → 112 veya en yakın acil.
 *  - Takım kadrosu HIS / doping panelleri (çekirdek ürün) bu ürünün kapsamı değildir.
 *  - Ortopedi / FTR araç gridlerine sızmaz (specialty-only spor-hekimligi).
 */
export type Ref =
  | 'TSHD'
  | 'SB_SPOR'
  | 'TOTBID_SPOR'
  | 'RTP_BASAMAK'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TSHD: 'Türkiye Spor Hekimliği Derneği — ayaktan sporcu değerlendirme ve dönüş-to-play kaynakları; güncel metni hekim doğrular',
  SB_SPOR: 'T.C. Sağlık Bakanlığı — sporcu sağlık kurulu mevzuatı ve muayene standartları',
  TOTBID_SPOR: 'TOTBİD + Spor Hekimliği Derneği — spor yaralanması ortak yaklaşımları (karar desteği)',
  RTP_BASAMAK: 'Return-to-play basamakları (0–5) — klinik karar desteğidir; dönüş kararı ve tanı hekimindir',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — spor hekimliği işlem / rapor çerçevesi; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); ilaç dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'RTP basamağı ve sakatlık şiddet bandı karar desteğidir. Tanı, ilaç, doz ve spora dönüş kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Konküzyon kırmızı bayrakları, egzersiz sırasında göğüs ağrısı / bayılma, şüpheli kırık ile nörolojik bulgu veya kompartman şüphesi varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan spor hekimliği muayenehanesi / polikliniği ürünü. Takım kadrosu HIS, doping panelleri (çekirdek ürün) ve tanı auto-lock bu bölümün kapsamı değildir.'

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
