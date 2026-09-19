/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma antiviral / PPI / biyolojik dozu YOK.
 *  - Tanı kilidi yalnız hekimde: IBD/IBS skoru ve hepatit bandı karar desteğidir.
 *  - Tam endoskopi suite / HIS / ameliyathane core ürünü DEĞİLDİR (intentional Missing).
 *  - GI kanama / akut karın / ensefalopati portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Dahiliye FIB-4 / GGK araçları bu chapter'a sızmaz (BRANS_… gastroenteroloji only).
 */
export type Ref =
  | 'TGD_IBD'
  | 'TGD_IBS'
  | 'TGD_ENDO'
  | 'TKAD_HBV'
  | 'TKAD_HCV'
  | 'SB_GI'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TGD_IBD: 'Türk Gastroenteroloji Derneği (TGD) — IBD klinik kullanım; skor karar desteği, tanı/doz hekimin',
  TGD_IBS: 'TGD / Roma çerçevesi — IBS semptom şiddeti karar desteği; tanı hekimin',
  TGD_ENDO: 'TGD endoskopi kalite / takip aralıkları — belge köprüsü; HIS suite core değil',
  TKAD_HBV: 'Türk Karaciğer Araştırmaları Derneği (TKAD) / SB — HBV izlem vadeleri; antiviral doz hekimin',
  TKAD_HCV: 'TKAD / SB — HCV izlem vadeleri; antiviral doz hekimin',
  SB_GI: 'T.C. Sağlık Bakanlığı — GI kanama / akut karın birinci basamak yönlendirme',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — biyolojik / antiviral / endoskopi rapor; güncel metin hekim doğrular',
  TITCK: 'TİTCK — KÜB; PPI / biyolojik / antiviral dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'IBD/IBS skorları ve HBV/HCV izlem önerileri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Aktif GI kanama (hematemez / melena / hematokezya), akut karın, şiddetli pankreatit şüphesi veya hepatik ensefalopati belirtileri varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan gastroenteroloji muayenehanesi / polikliniği ürünü. Tam endoskopi suite / HIS, tanı kilidi ve uydurma antiviral / PPI / biyolojik dozu bu bölümün kapsamı değildir.'

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
