/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Hastalıkları (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma antibiyotik dozu / mg / rejim invent YOK.
 *  - Tanı kilidi yalnız hekimde: CD4 / viral yük / izolasyon tipi karar desteğidir.
 *  - Hastane enfeksiyon kontrolü full HIS core ürünü DEĞİLDİR (intentional Missing).
 *  - Sepsis / menenjit / nekrotizan fasit şüphesi portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Visibility: enfeksiyon-hastaliklari only (BRANS_…).
 */
export type Ref =
  | 'KLIMIK'
  | 'SB_ATB'
  | 'SB_HIV'
  | 'SB_IZOLASYON'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  KLIMIK: 'KLİMİK (Türk Klinik Mikrobiyoloji ve İnfeksiyon Hastalıkları Derneği) — klinik pratik; tanı/doz hekimin',
  SB_ATB: 'T.C. Sağlık Bakanlığı Akılcı Antibiyotik Kullanımı — süre karar desteği; doz Notya üretmez',
  SB_HIV: 'T.C. SB HIV, tüberküloz, viral hepatit klinik protokolleri — izlem aralıkları karar desteği',
  SB_IZOLASYON: 'T.C. SB hastane enfeksiyon kontrolü / izolasyon ve sürveyans — ayaktan hatırlatma; full HIS out',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — enfeksiyon ilaç kısıtları; güncel metin hekim doğrular',
  TITCK: 'TİTCK — KÜB; antibiyotik / antiviral doz Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'İzolasyon tipi, ATB süre ve viral izlem önerileri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Yüksek ateş ile bilinç değişikliği, boyun sertliği, peteşiyal döküntü, nekrotizan yumuşak doku şüphesi veya sepsis bulgularında ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan enfeksiyon hastalıkları muayenehanesi / polikliniği ürünü. Hastane enfeksiyon kontrolü full HIS, tanı kilidi ve uydurma antibiyotik dozu bu bölümün kapsamı değildir.'

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
