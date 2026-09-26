/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kalp ve Damar Cerrahisi (ayaktan) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Ameliyathane / full OR HIS YOK.
 *  - Uydurma antikoagülan / ilaç dozu YOK (yalnız izlem vadeleri).
 *  - Tanı kilidi yalnız hekimde.
 *  - Canlı Medula e-imza YOK.
 *  - Akut ekstremite iskemisi / greft trombozu / majör kanama portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - kardiyoloji SCORE2 / Kalbim / HT-KKY bu chapter'a SIZMAZ (ve tersi).
 */
export type Ref =
  | 'TKDCD'
  | 'SB_KV'
  | 'TKD_DAMAR'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TKDCD: 'Türk Kalp ve Damar Cerrahisi Derneği klinik yaklaşımları — izlem ve güvenlik; tanı/doz hekimin',
  SB_KV: 'T.C. Sağlık Bakanlığı kardiyak / vasküler cerrahi ve perioperatif yönlendirme düzenlemeleri',
  TKD_DAMAR: 'Türk Damar Cerrahisi / periferik arter hastalıkları konsensüsleri — tanı hekimde',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — kalp-damar cerrahi paket/rapor; güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; antikoagülan dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'Pre-op risk kontrol listesi, greft/yara izlem ve antikoagülasyon vade hatırlatmaları karar desteğidir. Tanı, cerrahi karar ve doz hekimindir; Notya doz üretmez, tanı kilitlemez ve ameliyathane HIS entegre etmez. SCORE2 / Kalbim bu bölümde yoktur.'

export const ACIL_YONLENDIRME_METNI =
  'Ani soğuk/soluk ekstremite, şiddetli bacak ağrısı, greft bölgesinde ani şişlik/kanama veya antikoagülan altında majör kanama şüphesi varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan kalp-damar cerrahisi muayenehanesi / polikliniği ürünü. Tam ameliyathane HIS, otomatik tanı kilidi, uydurma antikoagülan dozu, canlı Medula e-imza ve kardiyoloji SCORE2/Kalbim bu bölümün kapsamı değildir.'

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
