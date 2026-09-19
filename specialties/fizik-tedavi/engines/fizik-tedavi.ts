/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Fiziksel Tıp ve Rehabilitasyon (ayaktan) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma ilaç dozu YOK. Ev egzersizi tekrar/set hekim girdisidir; mg/ml yazılmaz.
 *  - Tanı kilidi yalnız hekimde: VAS/ODI bandı KARAR DESTEĞİDİR.
 *  - Cauda equina / kırık / enfeksiyon bayrakları portal mesajı ile yönetilmez → 112.
 *  - Tam hastane rehabilitasyon HIS kapsam dışı.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TFTRD'
  | 'SB_REHAB'
  | 'SGK_SUT'
  | 'TOD_OP'
  | 'VAS'
  | 'ODI'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TFTRD: 'Türkiye Fiziksel Tıp ve Rehabilitasyon Derneği — ayaktan FTR uygulama kaynakları; güncel metni hekim doğrular',
  SB_REHAB: 'T.C. Sağlık Bakanlığı — rehabilitasyon / engellilik değerlendirme protokolleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — fizik tedavi seans sayısı, ortez ve rapor koşulları; güncel metin hekim tarafından doğrulanır',
  TOD_OP: 'Türk Osteoporoz Derneği / TEMD ile örtüşen kemik sağlığı önerileri — FTR bağlamında sevk notu',
  VAS: 'Visual Analog Scale (VAS) 0–10 — ağrı şiddeti; band karar desteğidir, tanı değildir',
  ODI: 'Oswestry Disability Index (ODI) — bel engellilik; yüzde bandı karar desteğidir, tanı değildir',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); ilaç dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'VAS / ODI bandları ve seans planı karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya ilaç dozu üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Ani idrar / gaita kaçırma, eyer bölgesi uyuşukluğu, ilerleyici güç kaybı, ateşle birlikte bel ağrısı veya travma sonrası şiddetli ağrı varsa ayaktan seans yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan FTR muayenehanesi / polikliniği ürünü. Tam hastane rehabilitasyon HIS, tanı auto-lock ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
