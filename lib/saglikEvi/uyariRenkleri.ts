/**
 * UYARI-RENKLERI (Kaan, 2026-11-25) — the semantic layer over the one alert palette (lib/doktor/chromeRenk.ts UYARI_RENK).
 * Pure; client and server. Decides, for anything that warns, whether it is a CLINICAL reading (acil / hekime_bildir /
 * dikkat — warm, rising) or an ADHERENCE lapse (missed dose, missed / late aşı, missed measurement, "işaretlenmedi" — the
 * calm slate family with an outline / dashed icon, never red). Every view asks here; no view picks a red by itself.
 * Never colour alone: each tone carries an icon shape and a word (patient words: lib/saglikEvi/sozler.ts; doctor words
 * below, clinical Turkish).
 */
import { UYARI_RENK, type UyariTonu } from '@/lib/doktor/chromeRenk'
import type { UyariDuzeyi } from './tipler'

export { UYARI_RENK }
export type { UyariTonu }

export type UyariAilesi = 'klinik' | 'uyum'

/** Rule-engine rules that are adherence lapses even when they reach the doctor (kritik medicine: two days unmarked). */
export const UYUM_KURALLARI: ReadonlySet<string> = new Set(['kritik_ilac'])

export function uyariAilesi(kural: string | null | undefined): UyariAilesi {
  return kural && UYUM_KURALLARI.has(kural) ? 'uyum' : 'klinik'
}

/**
 * The tone of one alert. Adherence rules → 'uyum' whatever their level; clinical rules keep their level; 'bilgi' (patient
 * only, friendly) has no warning tone (null → the view's neutral / teal look).
 */
export function uyariTonu(duzey: UyariDuzeyi | string, kural?: string | null): UyariTonu | null {
  if (uyariAilesi(kural) === 'uyum') return 'uyum'
  if (duzey === 'acil' || duzey === 'hekime_bildir' || duzey === 'dikkat') return duzey
  return null
}

/** Icon shape per tone: clinical = solid mark, adherence = outline / dashed ring (shape differs, not only colour). */
export const TON_IKONU: Record<UyariTonu, 'acil' | 'bildir' | 'dikkat' | 'kesikli'> = { acil: 'acil', hekime_bildir: 'bildir', dikkat: 'dikkat', uyum: 'kesikli' }

/** SVG path (24×24) per icon shape — shared by patient and doctor views so both sides draw the same marks. */
export const TON_IKON_YOLU: Record<UyariTonu, string> = {
  // exclamation in a filled octagon-ish badge
  acil: 'M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2zM12 7v6M12 16.6v.4',
  // bell
  hekime_bildir: 'M6 10a6 6 0 0 1 12 0c0 4.2 1.6 5.8 2 6.5H4c.4-.7 2-2.3 2-6.5zM10 19.5a2.2 2.2 0 0 0 4 0',
  // triangle
  dikkat: 'M12 3.5 21.5 20h-19zM12 9.5v5M12 17.3v.3',
  // dashed ring (drawn with stroke-dasharray by the views)
  uyum: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z',
}

/** Doctor-side words (clinical Turkish). */
export const HEKIM_TON_ETIKETI: Record<UyariTonu, string> = { acil: 'Acil', hekime_bildir: 'Hekime bildir', dikkat: 'Dikkat', uyum: 'Uyum' }

/** Highest tone of a set (clinical outranks adherence: acil > hekime_bildir > dikkat > uyum). */
const SIRA: Record<UyariTonu, number> = { acil: 3, hekime_bildir: 2, dikkat: 1, uyum: 0 }
export function enYuksekTon(tonlar: Array<UyariTonu | null | undefined>): UyariTonu | null {
  let en: UyariTonu | null = null
  for (const t of tonlar) if (t && (en == null || SIRA[t] > SIRA[en])) en = t
  return en
}

// ─── WCAG ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const kanal = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
function parlaklik(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => kanal(parseInt(h.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** WCAG 2.x contrast ratio of two #rrggbb colours. */
export function kontrastOrani(a: string, b: string): number {
  const x = parlaklik(a), y = parlaklik(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
