/**
 * ONKOLOJI-EXCEPTIONAL-01 — Tıbbi Onkoloji (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma kemoterapi / hedefe yönelik ilaç dozu YOK (eczane doz motoru OUT).
 *  - Tanı / evre kilidi yalnız hekimde: kür sayacı ve toksisite listesi karar desteğidir.
 *  - Canlı Medula e-imza YOK — SUT yalnızca taslak.
 *  - Febril nötropeni / spinal bası / tümör lizis portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Dahiliye WOW bu chapter'a sızmaz (BRANS_… onkoloji only).
 */
export type Ref =
  | 'TTOD'
  | 'SB_KANSER'
  | 'SGK_SUT'
  | 'TITCK'
  | 'ESMO_TR'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TTOD: 'Türk Tıbbi Onkoloji Derneği (TTOD) klinik yaklaşımları — izlem ve güvenlik; tanı/doz hekimin',
  SB_KANSER: 'T.C. Sağlık Bakanlığı ulusal kanser tarama ve tedavi yönlendirme düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — onkoloji ilaç/rapor endikasyon; güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; kemoterapi / hedefe yönelik ajan dozu Notya tarafından üretilmez',
  ESMO_TR: 'ESMO/NCCN derinliği — TTOD üzerinden TR ilaç erişimine uyarlanmış klinik bağlam; tanı hekimde',
}

export const HEKIM_KILIT_METNI =
  'Kür sayacı, toksisite kontrol listesi ve SUT taslağı karar desteğidir. Tanı, evre, ilaç ve doz kararı hekimindir; Notya doz üretmez, tanı/evre kilitlemez ve canlı Medula e-imza atmaz.'

export const ACIL_YONLENDIRME_METNI =
  'Febril nötropeni (ateş + düşkünlük), ani sırt ağrısı / bacak güçsüzlüğü (spinal bası şüphesi), şiddetli nefes darlığı, kontrolsüz kusma / dehidratasyon veya tümör lizis bulguları varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan tıbbi onkoloji muayenehanesi / polikliniği ürünü. Eczane kemoterapi doz motoru, tanı/evre auto-lock, uydurma doz ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
