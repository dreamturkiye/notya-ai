/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: SCORE2 bandı KARAR DESTEĞİDİR, "koroner arter hastalığı" yazılmaz.
 *  - Göğüs baskısı, ani nefes darlığı, bayılma, inme bulgusu portal mesajı ile yönetilmez → 112.
 *  - Canlı Medula e-imza yok; rapor çıktısı TASLAKTIR.
 *  - Cath lab planlama / invaziv laboratuvar HIS bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TKD'
  | 'ESC_TKD'
  | 'SGK_SUT'
  | 'SB_AKS'
  | 'TITCK'
  | 'SCORE2_ESC'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TKD: 'Türk Kardiyoloji Derneği (TKD) — ESC kılavuzlarının resmi TR yayını ve yorumu; güncel metni hekim doğrular',
  ESC_TKD: 'ESC/TKD kılavuzları — AKS, hipertansiyon, kalp yetersizliği, atriyal fibrilasyon, dislipidemi; hekim kilidi',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — kardiyak ilaç, stent, rapor/endikasyon koşulları; güncel metin hekim teyidi',
  SB_AKS: 'T.C. Sağlık Bakanlığı — göğüs ağrısı / AKS acil protokolleri; ayaktan izlem yeterli değildir',
  TITCK: 'TİTCK — KÜB; ilaç dozu Notya tarafından üretilmez',
  SCORE2_ESC: 'ESC 2021 SCORE2 (ehab309) — 10 yıllık KV olay riski; Türkiye yüksek risk bölgesi; bant karar desteğidir, tanı değildir',
}

export const HEKIM_KILIT_METNI =
  'SCORE2 bandı, HT/KKY izlem özeti ve rapor taslakları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Baskı tarzı göğüs ağrısı, ani / şiddetli nefes darlığı, bayılma, yüz kayması / konuşma bozukluğu veya ani güçsüzlük varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan kardiyoloji muayenehanesi / polikliniği ürünü. Cath lab planlama, invaziv laboratuvar HIS ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
