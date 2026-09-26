/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İlaç önerileri yalnız sınıf düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: pre-op / yara / patoloji bantları KARAR DESTEĞİDİR.
 *  - Akut karın, GI kanama, strangüle fıtık, anastomoz kaçağı şüphesi portal mesajı ile yönetilmez → 112.
 *  - Canlı Medula e-imza yok.
 *  - Ameliyathane planlama / OR scheduling / full surgical HIS bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TCD'
  | 'SB_CERRAHI'
  | 'TKRCD'
  | 'UTACD'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TCD: 'Türk Cerrahi Derneği (TCD) klinik kılavuz ve konsensüsleri; güncel metni hekim doğrular',
  SB_CERRAHI: 'T.C. Sağlık Bakanlığı — ameliyathane güvenliği / cerrahi klinik protokolleri; ayaktan izlem yeterli değildir',
  TKRCD: 'Türk Kolon ve Rektum Cerrahisi Derneği (TKRCD) ilgili rehberler — TR uygulama derinliği',
  UTACD: 'Ulusal Travma ve Acil Cerrahi Derneği (UTACD) travma yaklaşımları (TR)',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği — cerrahi paket, ameliyat ve rapor kuralları; güncel metin hekim teyidi',
  TITCK: 'TİTCK — KÜB; ilaç dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'Pre-op, yara/dren ve patoloji hatırlatmaları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Şiddetli karın ağrısı + ateş/kusma, bol kanama, sıkışmış fıtık, ameliyat sonrası ateş + kötüleşen karın, gaz-gaita çıkaramama ile kusma varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan genel cerrahi muayenehanesi / polikliniği ürünü. Ameliyathane planlaması, tam cerrahi HIS ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
