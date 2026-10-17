/**
 * FOTO-AI-01 — specialty and age awareness of the photo evaluation, WITHOUT leaks (brans-alan-sizmasi).
 *
 * Pediatric vocabulary and pediatric red-flag checks exist only for pediatri and çocuk cerrahisi. Every other branş
 * gets the generic, dermatology-neutral set. Wording toward the family ("veli") follows the PATIENT'S AGE, not the
 * branş: a minor gets it in every branş, an adult never does (lib/specialties/kapsam.ts veliDiliMi).
 * Pure + client-safe.
 */
import type { FotoMod } from './sema'

/** core/belgeler/router.ts keys that own the pediatric photo vocabulary. */
const PEDIATRIK_ANAHTARLAR: ReadonlySet<string> = new Set(['pediatri', 'cocuk_cerrahisi'])

export function fotoModu(bransAnahtari: string | null | undefined): FotoMod {
  return PEDIATRIK_ANAHTARLAR.has(String(bransAnahtari || '')) ? 'pediatrik' : 'genel'
}

/** Branşlar for which image analysis is closed altogether (core/belgeler/router.ts `engelli`). */
export function fotoAiKapaliBrans(bransAnahtari: string | null | undefined): boolean {
  return String(bransAnahtari || '') === 'psikiyatri'
}

export type YasGrubu = 'bilinmiyor' | 'yenidogan' | 'bebek' | 'cocuk' | 'ergen' | 'yetiskin'

export function yasGunu(dogumIso: string | null | undefined, simdiMs: number = Date.now()): number | null {
  if (!dogumIso) return null
  const t = Date.parse(dogumIso)
  if (!Number.isFinite(t)) return null
  const g = Math.floor((simdiMs - t) / 86_400_000)
  return g < 0 ? null : g
}

export function yasGrubu(dogumIso: string | null | undefined, simdiMs: number = Date.now()): YasGrubu {
  const g = yasGunu(dogumIso, simdiMs)
  if (g == null) return 'bilinmiyor'
  if (g < 28) return 'yenidogan'
  if (g < 365.25 * 2) return 'bebek'
  if (g < 365.25 * 12) return 'cocuk'
  if (g < 365.25 * 18) return 'ergen'
  return 'yetiskin'
}

/** "5 günlük", "3 aylık", "7 yaşında" — the only age detail a model ever sees (no birth date). */
export function yasMetni(dogumIso: string | null | undefined, simdiMs: number = Date.now()): string | null {
  const g = yasGunu(dogumIso, simdiMs)
  if (g == null) return null
  if (g < 60) return `${g} günlük`
  if (g < 365.25 * 2) return `${Math.floor(g / 30.44)} aylık`
  return `${Math.floor(g / 365.25)} yaşında`
}

/** Pediatric-only terms: must never appear in the generic prompt or in a generic-mode red-flag set. */
export const PEDIATRIK_ANAHTAR_KELIMELER: readonly string[] = [
  'bez dermatiti', 'hemanjiyom', 'el-ayak-ağız', 'neonatal', 'yenidoğan', 'bebek', 'moluskum', 'infantil', 'veli',
]
