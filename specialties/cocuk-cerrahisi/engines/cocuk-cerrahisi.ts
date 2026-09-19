/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuk Cerrahisi (ayaktan) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK.
 *  - Tanı kilidi yalnız hekimde.
 *  - Akut karın, strangüle fıtık, post-op kötüleşme portal mesajı ile yönetilmez → 112.
 *  - OR scheduling / full HIS / canlı Medula e-imza yok.
 *  - Pediatri Neyzi / büyüme / Hedef Boy chapter içeriği YOK.
 */
export type Ref =
  | 'CCD'
  | 'SB_CERRAHI'
  | 'TCD'
  | 'SGK_SUT'
  | 'TITCK'
  | 'VELI_ONAM'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  CCD: 'Çocuk Cerrahisi Derneği klinik pratik kaynakları; güncel metni hekim doğrular',
  SB_CERRAHI: 'T.C. Sağlık Bakanlığı — cerrahi güvenlik / çocuk cerrahisi klinik protokolleri',
  TCD: 'Türk Cerrahi Derneği ilgili konsensuslar (yetişkin genel cerrahi sızmaz; yalnız ortak güvenlik dili)',
  SGK_SUT: 'SGK SUT — cerrahi paket / rapor kuralları; güncel metin hekim teyidi',
  TITCK: 'TİTCK — KÜB; ilaç dozu Notya tarafından üretilmez',
  VELI_ONAM: 'Türk hukuku — 18 yaşını doldurmamış hastada veli/yasal temsilci onamı (VELI-YASAL-ONAM); yaşa göre',
}

export const HEKIM_KILIT_METNI =
  'Pre/post-op, yara/dren ve onam checklist karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Şiddetli karın ağrısı + ateş/kusma, sıkışmış fıtık, ameliyat sonrası ateş ile kötüleşme veya gaz-gaita çıkaramama ile kusma varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan çocuk cerrahisi muayenehanesi / polikliniği ürünü. OR scheduling, full HIS, pediatri büyüme/Neyzi studio ve canlı Medula e-imza bu bölümün kapsamı değildir.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** Tanı / doz / OR / Neyzi sızıntısı. */
export function dozVeyaTaniKilidiIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug)\b|doz şeması|OR slot|ameliyathane plan|HIS randevu|tanı kilit|ICD-?\d|Neyzi|Hedef Boy|persentil eğrisi/i.test(metin)
}
