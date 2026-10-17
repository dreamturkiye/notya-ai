/**
 * FOTO-ARSIV-01 — client-side tone/colour pipeline for non-destructive adjustments (no server cost).
 *
 * Works on a plain RGBA typed array so it runs in a canvas ImageData, in a Worker, or in a unit test. Safari does not
 * support `CanvasRenderingContext2D.filter`, and white balance cannot be expressed with CSS filters at all, so the
 * viewer does the maths itself on a bounded working copy of the photo; the vault original is never touched.
 *
 * Order: exposure -> white balance -> brightness -> contrast (per-channel LUT), then saturation (per pixel).
 */
import type { Ayarlar } from './duzenleme'

export type TonAyari = Pick<Ayarlar, 'parlaklik' | 'kontrast' | 'pozlama' | 'sicaklik' | 'doygunluk'>

/** Per-channel 256-entry tables. Exposed for tests. */
export function kanalTablolari(a: TonAyari): { r: Uint8ClampedArray; g: Uint8ClampedArray; b: Uint8ClampedArray } {
  const ev = (a.pozlama / 100) * 2 // +-2 EV
  const kazanc = Math.pow(2, ev)
  const sic = a.sicaklik / 100
  // Warm: more red, less blue. A modest +-18 % swing is enough to correct a typical indoor colour cast.
  const kR = 1 + 0.18 * sic
  const kB = 1 - 0.18 * sic
  const ekle = (a.parlaklik / 100) * 80
  const c = a.kontrast / 100
  const kontrastCarpani = c >= 0 ? 1 + c * 1.2 : 1 + c * 0.9
  const tablo = (kanalKazanci: number): Uint8ClampedArray => {
    const t = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) {
      let v = i * kazanc * kanalKazanci
      v += ekle
      v = (v - 128) * kontrastCarpani + 128
      t[i] = Math.round(v)
    }
    return t
  }
  return { r: tablo(kR), g: tablo(1), b: tablo(kB) }
}

/** In place. `veri` is RGBA (like ImageData.data). */
export function tonuUygula(veri: Uint8ClampedArray, a: TonAyari): void {
  const { r: tr, g: tg, b: tb } = kanalTablolari(a)
  const s = 1 + a.doygunluk / 100
  const doygun = a.doygunluk !== 0
  for (let i = 0; i + 3 < veri.length; i += 4) {
    let r = tr[veri[i]], g = tg[veri[i + 1]], b = tb[veri[i + 2]]
    if (doygun) {
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      r = l + (r - l) * s
      g = l + (g - l) * s
      b = l + (b - l) * s
    }
    veri[i] = r
    veri[i + 1] = g
    veri[i + 2] = b
  }
}

/** Longest side the viewer processes at; larger photos are processed at this size, the original stays untouched. */
export const CALISMA_AZAMI_KENAR = 3072

export function calismaBoyutu(w: number, h: number, azami = CALISMA_AZAMI_KENAR): { w: number; h: number } {
  const oran = Math.min(1, azami / Math.max(w, h, 1))
  return { w: Math.max(1, Math.round(w * oran)), h: Math.max(1, Math.round(h * oran)) }
}
