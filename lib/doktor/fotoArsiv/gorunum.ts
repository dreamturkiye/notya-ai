/**
 * FOTO-ARSIV-01 — zoom / pan maths shared by the single viewer and the synchronised compare view.
 *
 * `Gorunum` is a transform of the content box inside its container: translate(x, y) scale(olcek), origin top-left.
 * `olcek` is relative to the "fit" size (1 = the photo fits the viewport), so two photos of different resolution show
 * the same relative area at the same transform — that is what keeps a before/after pair aligned while zooming.
 * Pure + client-safe.
 */
export interface Gorunum { olcek: number; x: number; y: number }
export interface Kutu { w: number; h: number }

export const OLCEK_MIN = 1
export const OLCEK_MAX = 12

export const BASLANGIC_GORUNUMU: Readonly<Gorunum> = Object.freeze({ olcek: 1, x: 0, y: 0 })

export function olcekSinirla(o: number): number {
  return Math.min(OLCEK_MAX, Math.max(OLCEK_MIN, Number.isFinite(o) ? o : 1))
}

/**
 * Clamp the pan so the (scaled) content never leaves a gap bigger than needed: if the scaled content is smaller than
 * the container on an axis it is centred, otherwise its edges stay at or beyond the container's edges.
 * `icerik` is the content box at olcek 1 (already fitted into the container).
 */
export function sinirla(g: Gorunum, kap: Kutu, icerik: Kutu): Gorunum {
  const olcek = olcekSinirla(g.olcek)
  const cw = icerik.w * olcek, ch = icerik.h * olcek
  const bosX = (kap.w - icerik.w) / 2, bosY = (kap.h - icerik.h) / 2
  // content origin at olcek 1 is (bosX, bosY); with the transform its top-left is (bosX + x, bosY + y)
  const sinir = (deger: number, kapBoyu: number, icBoyu: number, bos: number): number => {
    if (icBoyu <= kapBoyu) return (kapBoyu - icBoyu) / 2 - bos
    const min = kapBoyu - icBoyu - bos // right/bottom edge flush
    const max = -bos // left/top edge flush
    return Math.min(max, Math.max(min, deger))
  }
  return { olcek, x: sinir(g.x, kap.w, cw, bosX), y: sinir(g.y, kap.h, ch, bosY) }
}

/** Zoom by `carpan` keeping the container point `imlec` (container coordinates) fixed. */
export function imlecteYakinlastir(g: Gorunum, imlec: { x: number; y: number }, carpan: number, kap: Kutu, icerik: Kutu): Gorunum {
  const yeni = olcekSinirla(g.olcek * carpan)
  const oran = yeni / g.olcek
  const bosX = (kap.w - icerik.w) / 2, bosY = (kap.h - icerik.h) / 2
  // point under the cursor in content-at-scale-1 coordinates:  (imlec - (bos + t)) / olcek
  // keep it fixed:  imlec - (bos + t') = (imlec - (bos + t)) * oran
  const x = imlec.x - bosX - (imlec.x - bosX - g.x) * oran
  const y = imlec.y - bosY - (imlec.y - bosY - g.y) * oran
  return sinirla({ olcek: yeni, x, y }, kap, icerik)
}

export interface Parmak { x: number; y: number }

/** Two-finger gesture: scale by the ratio of finger distances and follow the midpoint. */
export function pinchUygula(g: Gorunum, onceki: [Parmak, Parmak], simdi: [Parmak, Parmak], kap: Kutu, icerik: Kutu): Gorunum {
  const d0 = Math.hypot(onceki[1].x - onceki[0].x, onceki[1].y - onceki[0].y)
  const d1 = Math.hypot(simdi[1].x - simdi[0].x, simdi[1].y - simdi[0].y)
  if (d0 < 1 || d1 < 1) return g
  const m0 = { x: (onceki[0].x + onceki[1].x) / 2, y: (onceki[0].y + onceki[1].y) / 2 }
  const m1 = { x: (simdi[0].x + simdi[1].x) / 2, y: (simdi[0].y + simdi[1].y) / 2 }
  const yakin = imlecteYakinlastir(g, m0, d1 / d0, kap, icerik)
  return sinirla({ ...yakin, x: yakin.x + (m1.x - m0.x), y: yakin.y + (m1.y - m0.y) }, kap, icerik)
}

export function kaydir(g: Gorunum, dx: number, dy: number, kap: Kutu, icerik: Kutu): Gorunum {
  return sinirla({ ...g, x: g.x + dx, y: g.y + dy }, kap, icerik)
}

/** Fit a w x h image inside a container (contain). */
export function sigdir(w: number, h: number, kap: Kutu): Kutu {
  if (w <= 0 || h <= 0 || kap.w <= 0 || kap.h <= 0) return { w: 0, h: 0 }
  const oran = Math.min(kap.w / w, kap.h / h)
  return { w: w * oran, h: h * oran }
}

/** Double-tap: zoom to 2.5x around the point, or back to fit when already zoomed. */
export function ciftDokunus(g: Gorunum, imlec: { x: number; y: number }, kap: Kutu, icerik: Kutu): Gorunum {
  if (g.olcek > 1.05) return { ...BASLANGIC_GORUNUMU }
  return imlecteYakinlastir(g, imlec, 2.5, kap, icerik)
}

/** Content-normalised (0..1) coordinate of a container point under the current transform; null outside the content. */
export function kapsayicidanIceriye(g: Gorunum, p: { x: number; y: number }, kap: Kutu, icerik: Kutu): { x: number; y: number } | null {
  const bosX = (kap.w - icerik.w) / 2, bosY = (kap.h - icerik.h) / 2
  const cx = (p.x - bosX - g.x) / g.olcek
  const cy = (p.y - bosY - g.y) / g.olcek
  if (icerik.w <= 0 || icerik.h <= 0) return null
  const nx = cx / icerik.w, ny = cy / icerik.h
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null
  return { x: nx, y: ny }
}
