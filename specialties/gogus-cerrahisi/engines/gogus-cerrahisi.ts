/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Ameliyathane / full OR HIS YOK.
 *  - Uydurma ilaç dozu YOK.
 *  - Tanı kilidi yalnız hekimde: pre-op / tüp-yara / patoloji köprü karar desteğidir.
 *  - Canlı Medula e-imza YOK.
 *  - Tansiyon pnömotoraks / masif hemotoraks portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - gogus-hastaliklari CAT/mMRC/GOLD/inhaler/Akciğerlerim BURAYA SIZMAZ.
 */
export type Ref =
  | 'TGCD'
  | 'SB_TORAKS'
  | 'TTD_CERRAHI'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TGCD: 'Türk Göğüs Cerrahisi Derneği (TGCD) klinik yaklaşımları — izlem ve güvenlik; tanı/doz hekimin',
  SB_TORAKS: 'T.C. Sağlık Bakanlığı toraks travması / tüp torakostomi yönlendirme düzenlemeleri',
  TTD_CERRAHI: 'Türk Toraks Derneği + TGCD akciğer kanseri cerrahi yaklaşımları — tanı hekimde',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — torasik cerrahi paket/rapor; güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; ilaç dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'Pre-op solunum checklist, toraks tüp/yara izlem ve patoloji köprü karar desteğidir. Tanı, cerrahi karar ve doz hekimindir; Notya doz üretmez, tanı kilitlemez ve ameliyathane / OR HIS entegre etmez.'

export const ACIL_YONLENDIRME_METNI =
  'Ani tek taraflı göğüs ağrısı ve nefes darlığı (tansiyon pnömotoraks şüphesi), bol kanlı balgam / masif hemotoraks şüphesi, tüp sonrası ani nefes darlığı veya yara çevresinde hızla artan kızarıklık/ateş varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan göğüs cerrahisi muayenehanesi / polikliniği ürünü. Ameliyathane / full OR HIS, tanı auto-lock, uydurma doz, canlı Medula e-imza ve gogus-hastaliklari CAT/mMRC/Akciğerlerim bu bölümün kapsamı değildir.'

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
