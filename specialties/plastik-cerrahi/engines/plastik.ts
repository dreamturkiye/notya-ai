/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik, Rekonstrüktif ve Estetik Cerrahi ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK (antibiyotik / analjezik / lokal anestezik dozu Notya yazmaz).
 *  - Tanı kilidi yalnız hekimde: yara/greft izlem ve foto çizgisi karar desteğidir.
 *  - OR scheduling / full HIS YOK — ayaktan muayenehane ürünü.
 *  - Flep kompromisi / hematom / yara ayrışması portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Dermatoloji (PASI/Fitzpatrick/Derim) ve genel cerrahi bu chapter'a sızmaz (BRANS_… plastik-cerrahi only).
 */
export type Ref =
  | 'TPRECD'
  | 'SB_YARA'
  | 'SGK_SUT'
  | 'TITCK'
  | 'ASPS_TR'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TPRECD: 'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) klinik yaklaşımları — izlem; tanı/doz hekimin',
  SB_YARA: 'T.C. Sağlık Bakanlığı yara bakımı / enfeksiyon kontrolü yönlendirmeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — plastik işlem endikasyon; güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; lokal anestezik / antibiyotik dozu Notya tarafından üretilmez',
  ASPS_TR: 'Uluslararası plastik cerrahi derinliği — TPRECD üzerinden TR klinik bağlama uyarlanmış; tanı hekimde',
}

export const HEKIM_KILIT_METNI =
  'Foto zaman çizgisi, yara/greft izlem ve onam kontrol listesi karar desteğidir. Tanı, işlem endikasyonu, ilaç ve doz kararı hekimindir; Notya doz üretmez, tanı kilitlemez ve ameliyathane / HIS planlamaz.'

export const ACIL_YONLENDIRME_METNI =
  'Flep / greftte ani renk solukluğu veya morarma, hızla büyüyen şişlik (hematom), yüksek ateş ile yara kızarıklığı veya yara kenarlarının ayrılması varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan plastik cerrahi muayenehanesi / polikliniği ürünü. Ameliyathane planlaması, tam HIS, otomatik tanı kilidi ve uydurma doz bu bölümün kapsamı değildir. Dermatoloji skorları (PASI vb.) bu bölüme sızmaz.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** Doz / tanı-lock sızıntısı (araç + API kilidi). */
export function dozVeyaTaniKilidiIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|ml|IU)\b|doz şeması|tanı (kilit|kondu|kesin)|ICD-?\d|ameliyathane.?plan|OR.?schedul|HIS\b/i.test(metin)
}
