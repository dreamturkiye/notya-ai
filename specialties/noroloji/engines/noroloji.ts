/**
 * NOROLOJI-EXCEPTIONAL-01 — Nöroloji (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. AED / migren önleyici önerileri yalnız SINIF düzeyinde; mg hekimin.
 *  - Tanı kilidi yalnız hekimde: MIDAS bandı ve inme bayrağı KARAR DESTEĞİDİR.
 *  - İnme / TIA belirtileri portal mesajı ile yönetilmez → 112.
 *  - İnme ünitesi / inpatient stroke HIS kapsam dışı.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TND'
  | 'TBDHD'
  | 'SB_NORO'
  | 'SGK_SUT'
  | 'TITCK'
  | 'MIDAS'
  | 'AHA_ASA'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TND: 'Türk Nöroloji Derneği (TND) — ayaktan nöroloji uygulama kaynakları; güncel metni hekim doğrular',
  TBDHD: 'Türk Beyin Damar Hastalıkları Derneği — akut iskemik inme / TIA yönlendirme kaynakları',
  SB_NORO: 'T.C. Sağlık Bakanlığı — inme / nöroloji birinci basamak yönlendirme düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — nöroloji rapor/endikasyon koşulları; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); antiepileptik ve migren önleyici doz Notya tarafından üretilmez',
  MIDAS: 'Migraine Disability Assessment (MIDAS) — son 3 ay engellilik günleri; bant karar desteğidir, tanı değildir',
  AHA_ASA: 'AHA/ASA inme / TIA acil belirtileri (BE-FAST) — klinik karar desteği; tanı hekimindir',
}

export const HEKIM_KILIT_METNI =
  'İnme / TIA bayrakları ve MIDAS bandı karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Ani yüz kayması, konuşma bozukluğu, kol/bacak güçsüzlüğü, ani görme kaybı, ani şiddetli baş ağrısı veya bilinç değişikliği varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan nöroloji muayenehanesi / polikliniği ürünü. İnme ünitesi / yatan hasta inme HIS’i ve tanı kilidi bu bölümün kapsamı değildir.'

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
