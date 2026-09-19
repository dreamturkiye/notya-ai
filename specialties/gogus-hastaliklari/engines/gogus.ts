/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs Hastalıkları (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İnhaler önerileri yalnız SINIF düzeyinde; mcg / puff / gün hekimin.
 *  - Tanı kilidi yalnız hekimde: CAT/mMRC/GOLD grubu KARAR DESTEĞİDİR.
 *  - Tam SFT cihaz entegrasyonu YOK — elle girilen spirometri sayıları karar desteğidir.
 *  - Masif hemoptizi, hipoksi + solunum sıkıntısı, ani göğüs ağrısı + nefes darlığı → 112.
 *  - Canlı Medula e-imza yok; solunum raporu TASLAKTIR.
 *  - Göğüs cerrahisi / toraks OR / lobektomi planlama KAPSAM DIŞI (gogus-cerrahisi ayrı branş).
 */
export type Ref =
  | 'TTD'
  | 'GOLD'
  | 'GINA'
  | 'SB_SOLUNUM'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TTD: 'Türk Toraks Derneği (TTD) — ayaktan göğüs hastalıkları uygulama kaynakları; güncel metni hekim doğrular',
  GOLD: 'GOLD — KOAH mMRC/CAT semptom ve alevlenme grubu (ABE); grup KARAR DESTEĞİDİR, tanı değildir',
  GINA: 'GINA — astım kontrol düzeyi ve basamak mantığı; basamak / doz hekim seçer',
  SB_SOLUNUM: 'T.C. Sağlık Bakanlığı — tütün bırakma (ALO 171), tüberküloz ve solunum yolu bildirim düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — uzun süreli oksijen, nebulizatör ve solunum raporu koşulları; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); inhaler mcg / puff sayısı Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'CAT, mMRC ve GOLD grubu karar desteğidir. Tanı, ilaç sınıfı seçimi ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Masif hemoptizi, belirgin nefes darlığı ile düşük oksijen satürasyonu, ani tek taraflı göğüs ağrısı ile nefes darlığı veya stridor varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan göğüs hastalıkları muayenehanesi / polikliniği ürünü. Tam SFT cihaz entegrasyonu, toraks cerrahisi / ameliyathane planlaması (gogus-cerrahisi ayrı branş) ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
