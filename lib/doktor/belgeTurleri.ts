/**
 * Belge kasası tür kataloğu.
 *
 * ORTAK = tüm branşlar. BRANŞ = yalnız adlandırılan branşlar (brans-alan-sızması).
 * Yenidoğan Taburculuk Epikrizi: hastane/YDYBÜ belgesi — pediatri + KD arşivinde;
 * Bebek Kartı yaşayan izlem panosudur, bu PDF oraya taşınmaz (Gökhan/Kaan 2026-09-20).
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { KLINIK_YENI_SLUGS, klinikSlugCoz } from '@/lib/specialties/klinikDikey'

/** Sabit etiket — vault category ve yükleme select ile aynı string. */
export const YENIDOGAN_TABURCULUK_EPIKRIZI = 'Yenidoğan Taburculuk Epikrizi'

/** Saç ekimi donör / alıcı görüntüsü. Yalnız sac-ekimi yükler. Kardiyoloji ve pediatri görmez. */
export const SAC_FOTO_KATEGORI = 'Saç ekimi fotoğrafı'

/** Hasta Hakları m.26. On Özel Branş yazar. Pediatri ve kardiyoloji görmez. */
export const IKI_NUSHA_KATEGORI = 'İki nüsha rızası'

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Çocuk Hasta Raporları (Araçlar → Hasta Raporları alt bölümü).
 * Pediatri + Çocuk Cerrahisi dışında hiçbir branşta anlamlı değil (brans-alan-sızması): bir kardiyoloji
 * ya da göz hastası için "kreşe başlayabilir" ya da "okul raporu" üretmek klinik olarak tutarsız —
 * .cursor/skills/specialty-doktor-araclari/SKILL.md "classify before add" → BRANS_DOKTOR_ARACLARI.
 */
export const COCUK_ISTIRAHAT_RAPORU = 'Çocuk İstirahat Raporu'
export const COCUK_SPOR_RAPORU = 'Çocuk Spor Yapabilir Raporu'
export const COCUK_KRESE_RAPORU = 'Çocuk Kreşe Başlayabilir Raporu'
export const COCUK_OKUL_RAPORU = 'Çocuk Okul Raporu'

export const COCUK_HASTA_RAPORU_TURLERI = [
  COCUK_ISTIRAHAT_RAPORU,
  COCUK_SPOR_RAPORU,
  COCUK_KRESE_RAPORU,
  COCUK_OKUL_RAPORU,
] as const

/**
 * Ortak kasa türü — EKG ve Röntgen ile aynı yer.
 * Her branş hastanın getirdiği eko raporunu dosyalar. Erişkin ASE okuması bu listede değil;
 * o kapı `etkinModalite` (yalnız kardiyoloji ve kalp damar cerrahisi).
 */
export const EKOKARDIYOGRAFI = 'Ekokardiyografi' as const

export const ORTAK_BELGE_TURLERI = [
  'Lab Sonucu',
  'Görüntüleme Raporu',
  'EKG',
  EKOKARDIYOGRAFI,
  'Röntgen',
  'İşitme testi',
  'Epikriz',
  'Reçete',
  // KONSULTASYON-01: meslektaştan gelen görüş raporu. "Sevk" yalnız gerçek SGK sevk belgesi içindir.
  'Konsültasyon raporu',
  'Sevk',
  'Muayene görüntüsü',
  'Muayene ses kaydı',
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
  { ad: COCUK_ISTIRAHAT_RAPORU, branslar: ['pediatri', 'cocuk-cerrahisi'] },
  { ad: COCUK_SPOR_RAPORU, branslar: ['pediatri', 'cocuk-cerrahisi'] },
  { ad: COCUK_KRESE_RAPORU, branslar: ['pediatri', 'cocuk-cerrahisi'] },
  { ad: COCUK_OKUL_RAPORU, branslar: ['pediatri', 'cocuk-cerrahisi'] },
]

/** Çocuk Hasta Raporları bu branşta mı — Araçlar alt bölümünün render kapısı (brans-alan-sızması). */
export function cocukHastaRaporuBransiMi(hamBrans: string | SpecialtyKey | null | undefined): boolean {
  const brans = typeof hamBrans === 'string' ? bransAnahtari(hamBrans) : hamBrans ?? null
  return brans === 'pediatri' || brans === 'cocuk-cerrahisi'
}

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
  if (ad === SAC_FOTO_KATEGORI) return klinikSlugCoz(typeof hamBrans === 'string' ? hamBrans : '') === 'sac-ekimi'
  if (ad === IKI_NUSHA_KATEGORI) {
    const slug = klinikSlugCoz(typeof hamBrans === 'string' ? hamBrans : '')
    return !!slug && (KLINIK_YENI_SLUGS as readonly string[]).includes(slug)
  }
  if (!ad) return true
  if ((ORTAK_BELGE_TURLERI as readonly string[]).includes(ad)) return true
  const ozel = BRANS_BELGE_TURLERI.find((t) => t.ad === ad)
  if (!ozel) return true // bilinmeyen serbest metin (eski kayıtlar) — engelleme
  const brans = typeof hamBrans === 'string' ? bransAnahtari(hamBrans) : hamBrans ?? null
  return !!(brans && ozel.branslar.includes(brans))
}
