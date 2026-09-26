/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi ve Travmatoloji (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: VAS / fonksiyon bandı KARAR DESTEĞİDİR; "artroz" / "kaynama yok"
 *    gibi tanılar Notya tarafından yazılmaz.
 *  - Kompartman, NV kayıp, açık kırık, septik eklem, kauda, çıkık+NV portal mesajı ile yönetilmez → 112.
 *  - Canlı Medula e-imza yok.
 *  - Ameliyathane planlama / OR scheduling / full HIS bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TOTBID'
  | 'SB_ORTO'
  | 'SGK_SUT'
  | 'TITCK'
  | 'VAS'
  | 'FONKSIYON'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TOTBID: 'Türk Ortopedi ve Travmatoloji Birliği Derneği (TOTBİD) — ayaktan ortopedi uygulama kaynakları; güncel metni hekim doğrular',
  SB_ORTO: 'T.C. Sağlık Bakanlığı — travma / kırık / acil ortopedi klinik protokolleri; ayaktan izlem yeterli değildir',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — protez, implant, ortopedik malzeme rapor koşulları; güncel metin hekim teyidi',
  TITCK: 'TİTCK — KÜB; ilaç dozu Notya tarafından üretilmez',
  VAS: 'VAS (Vizüel Analog Skala) 0–10 — ağrı şiddeti karar desteğidir; tanı değildir',
  FONKSIYON: 'Mini fonksiyon maddeleri — günlük aktivite kısıt şiddet bandı; tanı veya engellilik kararı değildir',
}

export const HEKIM_KILIT_METNI =
  'VAS ve fonksiyon bantları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Şiddetli şişlik + dayanılmaz ağrı (kompartman şüphesi), ani his/güç kaybı, açık kırık, ateşli sıcak eklem, bel+bacak+idrar/gaita kontrol kaybı veya çıkıkta nabız kaybı varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan ortopedi muayenehanesi / polikliniği ürünü. Ameliyathane planlaması, cerrahi HIS ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
