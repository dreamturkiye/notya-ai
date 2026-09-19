/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma insülin / levotiroksin dozu YOK.
 *  - Tanı kilidi yalnız hekimde: HbA1c / TSH / DXA karar desteğidir.
 *  - CGM cihaz entegrasyonu core ürünü DEĞİLDİR (intentional Missing).
 *  - Ciddi hipoglisemi / DKA / tiroid fırtınası portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Dahiliye DM araçları bu chapter'a sızmaz (BRANS_… endokrinoloji only).
 */
export type Ref =
  | 'TEMD_DM'
  | 'TEMD_TIROID'
  | 'TEMD_OP'
  | 'SB_ENDO'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TEMD_DM: 'TEMD Diyabetes Mellitus Tanı, Tedavi ve İzlem Kılavuzu — izlem aralıkları karar desteği; tanı/doz hekimin',
  TEMD_TIROID: 'TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu — TSH/FT4 izlem; doz hekimin',
  TEMD_OP: 'TEMD Osteoporoz ve Metabolik Kemik Hastalıkları Kılavuzu — DXA tekrar aralığı karar desteği',
  SB_ENDO: 'T.C. Sağlık Bakanlığı — diyabet / tiroid / osteoporoz birinci basamak yönlendirme düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — endokrin rapor/endikasyon; güncel metin hekim doğrular',
  TITCK: 'TİTCK — KÜB; insülin ve levotiroksin dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'HbA1c / TSH / DXA izlem önerileri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Ciddi hipoglisemi (bilinç bulanıklığı / nöbet), diyabetik ketoasidoz şüphesi (kusma, derin nefes, bilinç değişikliği) veya tiroid fırtınası belirtileri varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan endokrinoloji muayenehanesi / polikliniği ürünü. CGM cihaz entegrasyonu, tanı kilidi ve uydurma insülin dozu bu bölümün kapsamı değildir.'

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
