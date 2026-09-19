/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefroloji (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma ESA / eritropoietin dozu YOK.
 *  - Tanı kilidi yalnız hekimde: eGFR / KDIGO / Hb karar desteğidir.
 *  - Tam diyaliz makinesi HIS core ürünü DEĞİLDİR (intentional Missing).
 *  - Hiperkalemi / aşırı sıvı / üremik acil portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Dahiliye CKD araçları bu chapter'a sızmaz (BRANS_… nefroloji only).
 */
export type Ref =
  | 'TND_KBH'
  | 'TND_DIYALIZ'
  | 'KDIGO_TND'
  | 'SB_NEF'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TND_KBH: 'Türk Nefroloji Derneği — kronik böbrek hastalığı klinik kılavuz / konsensus; eGFR×UACR karar desteği',
  TND_DIYALIZ: 'Türk Nefroloji Derneği — diyaliz klinik pratik; seans tarihleri; makine HIS core değil',
  KDIGO_TND: 'KDIGO ilkelerinin Türk Nefroloji Derneği pratiğindeki uyarlamaları — G×A ısı haritası',
  SB_NEF: 'T.C. Sağlık Bakanlığı — KBH ve diyaliz klinik protokolleri / yönlendirme',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — diyaliz / ESA rapor; güncel metin hekim doğrular; doz Notya yazmaz',
  TITCK: 'TİTCK — KÜB; ESA / fosfat bağlayıcı dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'eGFR / KDIGO / Hb izlem önerileri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya ESA dozu üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Ciddi hiperkalemi şüphesi, ani nefes darlığı / aşırı ödem, üremik acil belirtileri (bilinç değişikliği, konvülsiyon) varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan nefroloji muayenehanesi / polikliniği ürünü. Tam diyaliz makinesi HIS, tanı kilidi ve uydurma ESA dozu bu bölümün kapsamı değildir.'

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
