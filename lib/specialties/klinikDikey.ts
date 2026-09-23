/**
 * Klinik dikeyi — Doktor’dan ayrı kategori (Mali / Avukat / Doktor ile aynı katman).
 *
 * Landing 10 dal (`components/klinik-landing/content.ts`):
 *   Hekim klinik: saç ekimi, estetik-cerrahi, medikal-estetik, klinik-dermatoloji, longevity
 *   Müttefik (29.03.2025): fizyoterapi, klinik-psikolog, diyetisyen, ergoterapi, odyoloji
 *
 * TUS alias YOK. dermatoloji (TDD) ≠ klinik-dermatoloji. plastik-cerrahi ≠ estetik-cerrahi.
 * Fizyoterapi ≠ FTR; klinik-psikolog ≠ psikiyatri; odyoloji ≠ KBB.
 */

export const KLINIK_HEKIM_SLUGS = [
  'sac-ekimi',
  'estetik-cerrahi',
  'medikal-estetik',
  'klinik-dermatoloji',
  'longevity',
] as const

export const KLINIK_MUTTEFIK_SLUGS = [
  'fizyoterapi',
  'klinik-psikolog',
  'diyetisyen',
  'ergoterapi',
  'odyoloji',
] as const

export const KLINIK_YENI_SLUGS = [...KLINIK_HEKIM_SLUGS, ...KLINIK_MUTTEFIK_SLUGS] as const

export type KlinikYeniSlug = (typeof KLINIK_YENI_SLUGS)[number]

/** Landing marketing slug → Klinik kanonik dal. `dermatoloji` yalnız landing; ürün slug’ı klinik-dermatoloji. */
export const KLINIK_LANDING_ALIAS: Record<string, KlinikYeniSlug> = {
  'sac-ekimi': 'sac-ekimi',
  'estetik-cerrahi': 'estetik-cerrahi',
  'medikal-estetik': 'medikal-estetik',
  dermatoloji: 'klinik-dermatoloji',
  'klinik-dermatoloji': 'klinik-dermatoloji',
  longevity: 'longevity',
  fizyoterapi: 'fizyoterapi',
  'klinik-psikolog': 'klinik-psikolog',
  diyetisyen: 'diyetisyen',
  ergoterapi: 'ergoterapi',
  odyoloji: 'odyoloji',
}

export const KLINIK_ETIKET: Record<KlinikYeniSlug, string> = {
  'sac-ekimi': 'Saç Ekimi',
  'estetik-cerrahi': 'Estetik & Plastik Cerrahi',
  'medikal-estetik': 'Medikal Estetik',
  'klinik-dermatoloji': 'Dermatoloji (Klinik)',
  longevity: 'Longevity & Wellness',
  fizyoterapi: 'Fizyoterapi',
  'klinik-psikolog': 'Klinik Psikoloji',
  diyetisyen: 'Diyetisyen',
  ergoterapi: 'Ergoterapi',
  odyoloji: 'Odyoloji',
}

const ETIKET_SLUG: Record<string, KlinikYeniSlug> = {
  'sac ekimi': 'sac-ekimi',
  'saç ekimi': 'sac-ekimi',
  'sac-ekimi': 'sac-ekimi',
  'estetik-cerrahi': 'estetik-cerrahi',
  'estetik & plastik cerrahi': 'estetik-cerrahi',
  'estetik ve plastik cerrahi': 'estetik-cerrahi',
  'medikal estetik': 'medikal-estetik',
  'medikal-estetik': 'medikal-estetik',
  'klinik-dermatoloji': 'klinik-dermatoloji',
  'klinik dermatoloji': 'klinik-dermatoloji',
  'klinik dermatolojisi': 'klinik-dermatoloji',
  longevity: 'longevity',
  'longevity & wellness': 'longevity',
  'longevity ve wellness': 'longevity',
  fizyoterapi: 'fizyoterapi',
  'klinik psikoloji': 'klinik-psikolog',
  'klinik-psikolog': 'klinik-psikolog',
  'klinik psikolog': 'klinik-psikolog',
  psikoloji: 'klinik-psikolog',
  diyetisyen: 'diyetisyen',
  'beslenme ve diyet': 'diyetisyen',
  ergoterapi: 'ergoterapi',
  odyoloji: 'odyoloji',
}

const HEKIM_SET = new Set<string>(KLINIK_HEKIM_SLUGS)
const MUTTEFIK_SET = new Set<string>(KLINIK_MUTTEFIK_SLUGS)
const YENI_SET = new Set<string>(KLINIK_YENI_SLUGS)

const RECETE_ARAC_YOLLARI = new Set([
  '/doktor-tools/erecete',
  '/doktor-tools/ilac-interaksiyon',
  '/doktor-tools/sgk-medula',
  '/doktor-tools/enabiz',
  '/doktor-tools/sgk-rapor',
  '/doktor-tools/tetkik',
  '/doktor-tools/icd10',
])

export function klinikYeniSlugMu(ham: string | null | undefined): ham is KlinikYeniSlug {
  return YENI_SET.has(String(ham || '').trim())
}

export function muttefikMeslekMi(ham: string | null | undefined): boolean {
  const k = klinikSlugCoz(ham)
  return !!k && MUTTEFIK_SET.has(k)
}

export function hekimKlinikMi(ham: string | null | undefined): boolean {
  const k = klinikSlugCoz(ham)
  return !!k && HEKIM_SET.has(k)
}

export function klinikDikeyMi(ham: string | null | undefined): boolean {
  const k = klinikSlugCoz(ham)
  if (!k) return false
  return YENI_SET.has(k)
}

/**
 * Ham etiket / slug → Klinik dal.
 * Çıplak `dermatoloji` / `Dermatoloji` TUS’tur — burada çözülmez (Derim sızıntısı yok).
 */
export function klinikSlugCoz(ham: string | null | undefined): KlinikYeniSlug | null {
  const t = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (!t) return null
  if (ETIKET_SLUG[t]) return ETIKET_SLUG[t]
  if (YENI_SET.has(t)) return t as KlinikYeniSlug
  return KLINIK_LANDING_ALIAS[t] && t !== 'dermatoloji' ? KLINIK_LANDING_ALIAS[t] : null
}

export function klinikLandingSlugCoz(ham: string | null | undefined): KlinikYeniSlug | null {
  const t = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (!t) return null
  return klinikSlugCoz(t) || KLINIK_LANDING_ALIAS[t] || null
}

export function klinikUzmanlikNorm(ham: string | null | undefined): string {
  return klinikSlugCoz(ham) || String(ham || '').trim()
}

export function muttefikAracGizliMi(route: string): boolean {
  return RECETE_ARAC_YOLLARI.has(route)
}

export const MUTTEFIK_TANI_KILIT =
  '29.03.2025 md.16: tanı koyamaz; hekim tanısı + tedavi planı olmadan uygulama yok. Her işlemde yazılı rıza (iki nüsha). Tetkik istenemez, takviye satılamaz. Seans notu yapılan uygulamayı belgeler — ICD/reçete yok. Kayıt md.18 elektronik muhafaza (KVKK m.6).'

export const KLINIK_HEKIM_KILIT =
  'Ayakta Teşhis md.24 + Hasta Hakları m.26: elektronik kayıt, iki nüsha rıza. Greft/ünite/mL KARAR DESTEĞİDİR — hekim kilitler. Foto için ayrı KVKK rızası. Uydurma doz/greft YASAK. Vasküler oklüzyon, anafilaksi, donor nekroz, IV reaksiyon: 112.'
