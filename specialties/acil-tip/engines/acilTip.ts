/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Full ED bed board HIS / yatış boarding HIS YOK (intentional Missing).
 *  - Tanı kilidi yalnız hekimde: ESI / kritik yol karar desteğidir.
 *  - Uydurma ilaç doz YOK.
 *  - Kardiyoloji STEMI / nöroloji İnme araçları bu chapter'a sızmaz (BRANS_… acil-tip only).
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TATD'
  | 'SB_ACIL'
  | 'ESI'
  | 'ERC_TR'
  | 'ATLS_TR'
  | 'SGK_ACIL'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TATD: 'Türkiye Acil Tıp Derneği (TATD) klinik protokolleri — triyaj ve kritik yol; tanı/doz hekimin',
  SB_ACIL: 'T.C. Sağlık Bakanlığı Acil Servis klinik protokolleri ve triaj standartları',
  ESI: 'Emergency Severity Index (ESI) — seviye 1–5 karar desteği; tanı yazılmaz',
  ERC_TR: 'ERC resusitasyon eğitiminin TR acil pratiği — doz şeması Notya üretmez',
  ATLS_TR: 'ATLS Türkiye uygulamaları — travma yol bayrağı; tanı hekimde',
  SGK_ACIL: 'SGK acil işlem ve rapor kuralları — güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; ilaç doz Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'ESI seviyesi, kritik yol bayrakları ve sevk/yatış paket maddeleri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez, tanı kilitlemez ve ED bed board / boarding HIS yönetmez.'

export const ACIL_YONLENDIRME_METNI =
  'Ani kötüleşme, hava yolu tehdidi, kontrolsüz kanama, ani bilinç kaybı veya resus ihtiyacı varsa portal mesajı yeterli değildir: hemen resus / 112 protokolü uygulanır.'

export const KAPSAM_NOTU =
  'Acil tıp klinik ürünü. Full ED bed board HIS, yatış boarding HIS, tanı auto-lock ve uydurma dozlar bu bölümün kapsamı değildir. Kardiyoloji STEMI / nöroloji İnme araçları ayrı branştır.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** İlaç / mg doz sızıntısı (araç + API + portal kilidi). */
export function dozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|ml|IU)\b|doz şeması|adrenaline?\s*\d|atropine?\s*\d|amiodaron\s*\d|heparin\s*\d/i.test(metin)
}
