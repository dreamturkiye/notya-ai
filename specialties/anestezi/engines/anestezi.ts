/**
 * ANESTEZI-EXCEPTIONAL-01 — Anesteziyoloji (ayaktan / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Ameliyathane OR anestezi makinesi / full HIS entegrasyonu YOK (intentional Missing).
 *  - Tanı kilidi yalnız hekimde: checklist / bayrak karar desteğidir.
 *  - Uydurma ilaç / analjezik / anestezik doz YOK.
 *  - Genel cerrahi / göğüs cerrahisi araçları bu chapter'a sızmaz (BRANS_… anestezi only).
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TARD'
  | 'SB_ANESTEZI'
  | 'SGK_ANESTEZI'
  | 'TITCK'
  | 'ASA_TR'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TARD: 'Türk Anesteziyoloji ve Reanimasyon Derneği (TARD) klinik yaklaşımları — izlem ve güvenlik; tanı/doz hekimin',
  SB_ANESTEZI: 'T.C. Sağlık Bakanlığı ameliyathane, sedasyon ve anestezi güvenlik protokolleri',
  SGK_ANESTEZI: 'SGK anestezi işlem ve rapor kuralları — güncel metin hekim doğrular; canlı e-imza yok',
  TITCK: 'TİTCK — KÜB; anestezik / analjezik doz Notya tarafından üretilmez',
  ASA_TR: 'ASA fiziksel durum sınıflaması — karar desteği; tanı ve işlem planı hekimde',
}

export const HEKIM_KILIT_METNI =
  'ASA/pre-op kontrol listesi, hava yolu notu ve post-op ağrı bayrakları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez, tanı kilitlemez ve ameliyathane anestezi makinesi HIS yönetmez.'

export const ACIL_YONLENDIRME_METNI =
  'Zor hava yolu şüphesi, anafilaksi / ciddi alerji, malign hipertermi şüphesi, aspirasyon veya ani solunum yetmezliği varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan anestezi polikliniği / pre-op değerlendirme ürünü. Ameliyathane anestezi makinesi HIS, otomatik tanı kilidi ve uydurma ilaç dozları bu bölümün kapsamı değildir. Genel cerrahi / göğüs cerrahisi araçları ayrı branştır.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** Anestezik / analjezik mg doz sızıntısı (araç + API + portal kilidi). */
export function dozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|ml|µg\/kg|mg\/kg)\b|propofol\s*\d|fentan(?:yl|il)\s*\d|remifentan(?:il|yl)\s*\d|morfin\s*\d|tramadol\s*\d|sevofluran\s*\d|rokuronyum\s*\d|anestezik dozu|analjezik dozu/i.test(metin)
}
