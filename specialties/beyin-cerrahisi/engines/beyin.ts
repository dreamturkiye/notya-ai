/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin ve Sinir Cerrahisi (ayaktan) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Ameliyathane OR / full HIS entegrasyonu YOK (intentional Missing).
 *  - Tanı kilidi yalnız hekimde: checklist / bayrak karar desteğidir.
 *  - Uydurma AED / antiepileptik doz YOK.
 *  - Nöroloji Migren / İnme araçları bu chapter'a sızmaz (BRANS_… beyin-cerrahisi only).
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TND_NOROS'
  | 'SB_KAFA'
  | 'SGK_NOROS'
  | 'TITCK'
  | 'AANS_TR'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TND_NOROS: 'Türk Nöroşirürji Derneği (TND) klinik yaklaşımları — izlem ve güvenlik; tanı/doz hekimin',
  SB_KAFA: 'T.C. Sağlık Bakanlığı kafa travması / spinal travma klinik protokolleri',
  SGK_NOROS: 'SGK nöroşirürji işlem ve rapor kuralları — güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; AED / analjezik doz Notya tarafından üretilmez',
  AANS_TR: 'Uluslararası nöroşirürji derinliği — TND üzerinden TR ayaktan bağlama uyarlanmış; tanı hekimde',
}

export const HEKIM_KILIT_METNI =
  'Post-op kontrol listesi, görüntü köprüsü ve nöbet/bilinç bayrakları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya AED dozu üretmez, tanı kilitlemez ve ameliyathane HIS yönetmez.'

export const ACIL_YONLENDIRME_METNI =
  'Ani bilinç kaybı / kötüleşme, yeni fokal güçsüzlük, şiddetli baş ağrısı + kusma, cerrahi yara sızıntısı / ateş veya ani konuşma bozukluğu varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan nöroşirürji muayenehanesi / polikliniği ürünü. Ameliyathane / tam HIS, otomatik tanı kilidi ve uydurma AED dozları bu bölümün kapsamı değildir. Nöroloji Migren/İnme araçları ayrı branştır.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** AED / mg doz sızıntısı (araç + API + portal kilidi). */
export function aedDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|ml)\b|AED dozu|antiepileptik dozu|levetirasetam\s*\d|valproat\s*\d|fenitoin\s*\d|karbamazepin\s*\d/i.test(metin)
}
