/**
 * ESNEK-READER-2 — server half of the masking proof: decode every outbound picture of a page (the whole page + its tiles)
 * and check that each identity box the device declared is solid black on it (core/elNotu/maskeKaniti.ts). A page that
 * fails is refused before any model sees it.
 */
import jpeg from 'jpeg-js'
import { maskeKaniti, type KanitSonucu } from '@/core/elNotu/maskeKaniti'
import type { GorselBlok, SayfaPaketi } from '@/core/elNotu/okuyucu'
import type { Rgba } from '@/core/elNotu/tipler'

function coz(g: GorselBlok): Rgba | null {
  if (!/^image\/jpe?g$/.test(g.mime)) return null
  try {
    const im = jpeg.decode(Buffer.from(g.base64, 'base64'), { useTArray: true, maxMemoryUsageInMB: 256, formatAsRGBA: true })
    return { w: im.width, h: im.height, d: new Uint8ClampedArray(im.data.buffer, im.data.byteOffset, im.data.byteLength) }
  } catch { return null }
}

/** Proof for one page. `zorunlu` = refuse a package that carries no box list (the evaluation route; the read route accepts an older client's package). */
export function sayfaMaskeKaniti(paket: SayfaPaketi, sayfa: GorselBlok, zorunlu: boolean): KanitSonucu | { tamam: true; eski: true } {
  if (!Array.isArray(paket.gizlilikKutulari)) return zorunlu ? { tamam: false, neden: 'kutu_yok' } : { tamam: true, eski: true }
  const resimler: { r: Rgba | null; bant?: { y0: number; y1: number } }[] = [{ r: coz(sayfa) }, ...(paket.parcalar || []).map((t) => ({ r: coz(t.gorsel), bant: { y0: t.y0, y1: t.y1 } }))]
  for (const x of resimler) {
    if (!x.r) return { tamam: false, neden: 'gecersiz' }
    const k = maskeKaniti(x.r, paket.gizlilikKutulari, { serbest: paket.serbest === true, bant: x.bant })
    if (!k.tamam) return k
  }
  return { tamam: true }
}
