/**
 * KLINIK-AYNA-01 — Klinik dikeyi doktor omurgasına bağlanır; ayrı SOAP/dosya kopyası yok.
 *
 * Landing 10 dal (`components/klinik-landing/content.ts`):
 *   Hekim klinik: saç ekimi, medikal estetik, longevity (+ dermatoloji / estetik-cerrahi = mevcut TUS chapter)
 *   Müttefik (29.03.2025): fizyoterapi, klinik-psikolog, diyetisyen, ergoterapi, odyoloji
 *
 * Estetik & Plastik Cerrahi → `plastik-cerrahi` (TPRECD chapter, kopya yok).
 * Klinik dermatoloji → `dermatoloji` (TDD chapter, kopya yok).
 * Fizyoterapi ≠ FTR; klinik-psikolog ≠ psikiyatri; odyoloji ≠ KBB.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const KLINIK_HEKIM_SLUGS = ['sac-ekimi', 'medikal-estetik', 'longevity'] as const
export const KLINIK_MUTTEFIK_SLUGS = [
  'fizyoterapi',
  'klinik-psikolog',
  'diyetisyen',
  'ergoterapi',
  'odyoloji',
] as const
export const KLINIK_YENI_SLUGS = [...KLINIK_HEKIM_SLUGS, ...KLINIK_MUTTEFIK_SLUGS] as const

export type KlinikYeniSlug = (typeof KLINIK_YENI_SLUGS)[number]

/** Landing slug → kanonik SpecialtyKey (TUS chapter reuse). */
export const KLINIK_ALIAS: Record<string, SpecialtyKey> = {
  'estetik-cerrahi': 'plastik-cerrahi',
  'estetik & plastik cerrahi': 'plastik-cerrahi',
  'estetik ve plastik cerrahi': 'plastik-cerrahi',
}

export const KLINIK_ETIKET: Record<KlinikYeniSlug, string> = {
  'sac-ekimi': 'Saç Ekimi',
  'medikal-estetik': 'Medikal Estetik',
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
  'medikal estetik': 'medikal-estetik',
  'medikal-estetik': 'medikal-estetik',
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
  return YENI_SET.has(k) || k === 'plastik-cerrahi' || k === 'dermatoloji'
}

/** Ham etiket / slug → kanonik anahtar; bilinmeyen → null. */
export function klinikSlugCoz(ham: string | null | undefined): SpecialtyKey | null {
  const t = String(ham || '').trim().toLocaleLowerCase('tr-TR')
  if (!t) return null
  if (KLINIK_ALIAS[t]) return KLINIK_ALIAS[t]
  if (ETIKET_SLUG[t]) return ETIKET_SLUG[t]
  if (YENI_SET.has(t)) return t as SpecialtyKey
  return null
}

/** Onboarding / profil kaydı: Türkçe etiket veya slug → kanonik slug. */
export function klinikUzmanlikNorm(ham: string | null | undefined): string {
  return klinikSlugCoz(ham) || String(ham || '').trim()
}

/** Müttefik meslek reçete / Medula / ICD tanı kodlayıcı görmez (29.03.2025 — tanı hekimde). */
export function muttefikAracGizliMi(route: string): boolean {
  return RECETE_ARAC_YOLLARI.has(route)
}

export const MUTTEFIK_TANI_KILIT =
  'Bu meslek grubu tanı koyamaz. Hekim tanısı referansı olmadan tanı, ICD kilidi veya reçete yazılmaz. Seans notu yalnızca yapılan uygulamayı ve hekimin planını belgeler.'

export const KLINIK_HEKIM_KILIT =
  'Greft sayısı, ünite, mL ve doz KARAR DESTEĞİDİR — hekim kilitler. Uydurma doz / uydurma greft / uydurma form adı YASAK. Vasküler oklüzyon, anafilaksi, donor nekroz, IV reaksiyon: 112.'
