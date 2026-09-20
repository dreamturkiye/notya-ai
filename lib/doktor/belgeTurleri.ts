/**
 * Belge kasası tür kataloğu.
 *
 * ORTAK = tüm branşlar. BRANŞ = yalnız adlandırılan branşlar (brans-alan-sızması).
 * Yenidoğan Taburculuk Epikrizi: hastane/YDYBÜ belgesi — pediatri + KD arşivinde;
 * Bebek Kartı yaşayan izlem panosudur, bu PDF oraya taşınmaz (Gökhan/Kaan 2026-09-20).
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'

/** Sabit etiket — vault category ve yükleme select ile aynı string. */
export const YENIDOGAN_TABURCULUK_EPIKRIZI = 'Yenidoğan Taburculuk Epikrizi'

export const ORTAK_BELGE_TURLERI = [
  'Lab Sonucu',
  'Görüntüleme Raporu',
  'EKG',
  'Röntgen',
  'Epikriz',
  'Reçete',
  // KONSULTASYON-01: meslektaştan gelen görüş raporu. "Sevk" yalnız gerçek SGK sevk belgesi içindir.
  'Konsültasyon raporu',
  'Sevk',
  'Diğer',
] as const

export type OrtakBelgeTuru = (typeof ORTAK_BELGE_TURLERI)[number]

/** Branşa özel kas türleri — UI select + POST doğrulama aynı listeyi kullanır. */
export const BRANS_BELGE_TURLERI: ReadonlyArray<{
  ad: string
  /** Kanonik SpecialtyKey — yabancı branş select’te ve API’de görmez. */
  branslar: readonly SpecialtyKey[]
  /** Epikriz’den hemen sonra (yenidoğan akışı). */
  epikrizSonrasi?: boolean
}> = [
  {
    ad: YENIDOGAN_TABURCULUK_EPIKRIZI,
    branslar: ['pediatri', 'kadin-hastaliklari-dogum'],
    epikrizSonrasi: true,
  },
]

export function yenidoganTaburcuEpikriziBransiMi(brans: SpecialtyKey | null | undefined): boolean {
  if (!brans) return false
  return BRANS_BELGE_TURLERI.some((t) => t.ad === YENIDOGAN_TABURCULUK_EPIKRIZI && t.branslar.includes(brans))
}

/** Yükleme select’i — branşsız/bilinmeyen = yalnız ortak. */
export function belgeTurleriIcinBrans(hamBrans: string | SpecialtyKey | null | undefined): string[] {
  const brans = typeof hamBrans === 'string' ? bransAnahtari(hamBrans) : hamBrans ?? null
  const ortak = [...ORTAK_BELGE_TURLERI]
  const ekstra = BRANS_BELGE_TURLERI.filter((t) => brans && t.branslar.includes(brans))
  if (!ekstra.length) return ortak
  const out: string[] = []
  for (const o of ortak) {
    out.push(o)
    if (o === 'Epikriz') {
      for (const e of ekstra.filter((x) => x.epikrizSonrasi)) out.push(e.ad)
    }
  }
  for (const e of ekstra.filter((x) => !x.epikrizSonrasi)) {
    if (!out.includes(e.ad)) out.push(e.ad)
  }
  return out
}

/** Seçilen tür bu branşta yüklenebilir mi? Boş/ortak → evet; branş-özel → kapı. */
export function belgeTuruIzinliMi(
  tur: string | null | undefined,
  hamBrans: string | SpecialtyKey | null | undefined,
): boolean {
  const ad = String(tur || '').trim()
  if (!ad) return true
  if ((ORTAK_BELGE_TURLERI as readonly string[]).includes(ad)) return true
  const ozel = BRANS_BELGE_TURLERI.find((t) => t.ad === ad)
  if (!ozel) return true // bilinmeyen serbest metin (eski kayıtlar) — engelleme
  const brans = typeof hamBrans === 'string' ? bransAnahtari(hamBrans) : hamBrans ?? null
  return !!(brans && ozel.branslar.includes(brans))
}
