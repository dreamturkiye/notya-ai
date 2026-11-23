/**
 * ESNEK-MUAYENE-A — drawings on a known form (pure): which anatomical regions carry the doctor's pen marks, and which side.
 *
 * A KBB form has printed drawings (ear drums, nose / septum, oral cavity, larynx, neck) that the doctor marks with a pen:
 * an "N" under an ear drum, a circle on the neck, an arrow from "SD." to the septum, hatching on a drum. The template maps
 * each drawing to an anatomy key and a side; the side of a finding is decided by that geometry, never by a model (right /
 * left is a protected class). A region with no pen ink and no annotation linked to it can have no finding (never invent).
 */
import type { CizimBolgesi, CizimBulgusu, CizimIsareti, Kutu, Maske, Taraf } from './tipler'

/** Share of the region's pixels that are coloured pen ink (the print is grey) or, for black pens, very dark thin strokes. */
export function bolgeMurekkebi(renkli: Maske, kutu: Kutu): number {
  const x0 = Math.max(0, Math.floor(kutu.x0 * renkli.w)), x1 = Math.min(renkli.w, Math.ceil(kutu.x1 * renkli.w))
  const y0 = Math.max(0, Math.floor(kutu.y0 * renkli.h)), y1 = Math.min(renkli.h, Math.ceil(kutu.y1 * renkli.h))
  let n = 0, t = 0
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { t++; n += renkli.d[y * renkli.w + x] }
  return t ? n / t : 0
}

/** Minimum pen-ink share for a region to count as marked (0.04% ≈ a small "N" in a drum-sized region). */
export const ISARET_ESIGI = 0.0004

export type BolgeDurumu = CizimBolgesi & { murekkep: number; bagliSatirlar: number[] }

export function bolgeDurumlari(bolgeler: CizimBolgesi[], renkli: Maske, satirBolgeleri: { no: number; bolgeId: string | null | undefined }[]): BolgeDurumu[] {
  return bolgeler.map((b) => ({
    ...b,
    murekkep: bolgeMurekkebi(renkli, b.kutu),
    bagliSatirlar: satirBolgeleri.filter((s) => s.bolgeId === b.id).map((s) => s.no),
  }))
}

/** A region the reader may describe: pen ink inside it, or an annotation line linked to it. */
export const isaretliMi = (b: Pick<BolgeDurumu, 'murekkep' | 'bagliSatirlar'>) => b.murekkep >= ISARET_ESIGI || b.bagliSatirlar.length > 0

const ISARETLER: CizimIsareti[] = ['yazi', 'ok', 'daire', 'tarama', 'cizgi', 'normal_isareti', 'nokta']

/**
 * Model findings → accepted findings. Drops: unknown region ids, unmarked regions, empty text. The side always comes from
 * the template region. A finding is auto-accepted only at ≥ 0.85 confidence; otherwise it becomes a Doğrula ('cizim').
 */
export function bulgulariDogrula(ham: unknown, durumlar: BolgeDurumu[]): CizimBulgusu[] {
  const liste = Array.isArray(ham) ? ham : Array.isArray((ham as { bulgular?: unknown })?.bulgular) ? (ham as { bulgular: unknown[] }).bulgular : []
  const out: CizimBulgusu[] = []
  for (const x of liste as Record<string, unknown>[]) {
    const id = String(x?.bolgeId ?? x?.bolge ?? '')
    const b = durumlar.find((d) => d.id === id)
    if (!b || !isaretliMi(b)) continue
    const bulgu = String(x?.bulgu ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
    if (!bulgu) continue
    const isaret = ISARETLER.includes(x?.isaret as CizimIsareti) ? (x.isaret as CizimIsareti) : 'yazi'
    const g = Number(x?.g ?? x?.guven ?? 0)
    const guven = Number.isFinite(g) ? Math.max(0, Math.min(1, g)) : 0
    out.push({ bolgeId: b.id, anatomi: b.anatomi, taraf: b.taraf as Taraf, bulgu, isaret, guven, kabul: guven >= 0.85, kutu: b.kutu })
  }
  return out
}
