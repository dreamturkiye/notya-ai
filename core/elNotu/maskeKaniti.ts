/**
 * ESNEK-READER-2 — server-side proof that an outbound picture is MASKED (pure). The device paints every identity box black
 * before anything leaves it (sayfaPaketi.ts); the server does not take that on trust: every box the package declares must
 * be solid black on the page picture and on every tile that covers it. A page with no box is accepted only under the
 * doctor's standing plain-sheet declaration (serbest). Used by the read route and the admin evaluation route.
 */
import type { Kutu, Rgba } from './tipler'

export type KanitSonucu = { tamam: true } | { tamam: false; neden: 'kutu_yok' | 'kutu_acik' | 'gecersiz' }

/** Mean luminance and the share of dark pixels inside the box (inset by 12 % so JPEG edge blur does not count). */
export function kutuKaranlik(r: Rgba, k: Kutu): { ort: number; karanlik: number; piksel: number } {
  const ix = (k.x1 - k.x0) * 0.12, iy = (k.y1 - k.y0) * 0.12
  const x0 = Math.max(0, Math.floor((k.x0 + ix) * r.w)), x1 = Math.min(r.w, Math.ceil((k.x1 - ix) * r.w))
  const y0 = Math.max(0, Math.floor((k.y0 + iy) * r.h)), y1 = Math.min(r.h, Math.ceil((k.y1 - iy) * r.h))
  let top = 0, kar = 0, n = 0
  const adim = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 4000)))
  for (let y = y0; y < y1; y += adim) for (let x = x0; x < x1; x += adim) {
    const i = (y * r.w + x) * 4
    const l = 0.299 * r.d[i] + 0.587 * r.d[i + 1] + 0.114 * r.d[i + 2]
    top += l; n++; if (l < 70) kar++
  }
  return { ort: n ? top / n : 255, karanlik: n ? kar / n : 0, piksel: n }
}

/**
 * Every declared box must be black on the picture. `bant` = the vertical extent of the picture on the page (tiles); boxes
 * outside it are skipped, boxes partly inside are checked on their visible part.
 */
export function maskeKaniti(r: Rgba, kutular: Kutu[], o: { serbest?: boolean; bant?: { y0: number; y1: number } } = {}): KanitSonucu {
  if (!r.w || !r.h || r.d.length < r.w * r.h * 4) return { tamam: false, neden: 'gecersiz' }
  if (!kutular.length) return o.serbest ? { tamam: true } : { tamam: false, neden: 'kutu_yok' }
  const bant = o.bant || { y0: 0, y1: 1 }
  const yuk = bant.y1 - bant.y0
  for (const k of kutular) {
    const y0 = Math.max(k.y0, bant.y0), y1 = Math.min(k.y1, bant.y1)
    if (y1 - y0 <= 0.002) continue
    const yerel = { x0: k.x0, x1: k.x1, y0: (y0 - bant.y0) / yuk, y1: (y1 - bant.y0) / yuk }
    const s = kutuKaranlik(r, yerel)
    if (s.piksel < 4) continue
    if (s.ort > 45 || s.karanlik < 0.9) return { tamam: false, neden: 'kutu_acik' }
  }
  return { tamam: true }
}
