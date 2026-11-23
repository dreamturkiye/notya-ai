/**
 * ESNEK-MUAYENE-A — browser glue for the El Notu reader (device side): file / photo / scanner PDF → RGBA rasters, the
 * canvas JPEG encoder and the on-device OCR adapter for core/elNotu/sayfaPaketi.ts, the re-encoded original (EXIF / GPS
 * stripped) for the vault, the content hash used as the source's idempotency key, and the crop + descriptor of a word for
 * the personal handwriting memory (cut from the MASKED page only).
 */
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import { kimlikMetniOku } from '@/core/belgeler/ocrKimlik'
import { pdfModulu } from '@/core/belgeler/pdfMaske'
import type { OcrAdaptoru, TuvalAdaptoru } from './sayfaPaketi'
import { griyeCevir, kontrastNormalize } from './onisleme'
import { tanimlayici } from './hafiza'
import type { Kutu, Rgba } from './tipler'

export const AZAMI_KENAR = 2600
export const EL_NOTU_AZAMI_SAYFA = 20

function tuvalOlustur(w: number, h: number): HTMLCanvasElement { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

export function rasterdenTuval(r: Rgba): HTMLCanvasElement {
  const c = tuvalOlustur(r.w, r.h)
  const ctx = c.getContext('2d')!
  const id = ctx.createImageData(r.w, r.h)
  id.data.set(r.d)
  ctx.putImageData(id, 0, 0)
  return c
}

function tuvaldenRaster(c: HTMLCanvasElement): Rgba {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
  return { w: c.width, h: c.height, d: new Uint8ClampedArray(d.buffer.slice(0)) }
}

export const tarayiciTuvali: TuvalAdaptoru = {
  async jpeg(r, kalite) { return rasterdenTuval(r).toDataURL('image/jpeg', kalite).split(',')[1] },
}

export const tarayiciOcr: OcrAdaptoru = async (r: Rgba): Promise<OcrSatir[] | null> => kimlikMetniOku(rasterdenTuval(r))

/** An image file → raster (≤ AZAMI_KENAR). */
export async function gorseliRastereCevir(dosya: Blob): Promise<Rgba> {
  const bmp = await createImageBitmap(dosya)
  const o = Math.min(1, AZAMI_KENAR / Math.max(bmp.width, bmp.height))
  const c = tuvalOlustur(Math.max(1, Math.round(bmp.width * o)), Math.max(1, Math.round(bmp.height * o)))
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return tuvaldenRaster(c)
}

/** A scanner / phone PDF → one raster per page (drawn on the device with the same pdf.js the document masking uses). */
export async function pdfiRastereCevir(dosya: Blob): Promise<Rgba[]> {
  const m = await pdfModulu()
  const belge = await m.getDocument({ data: new Uint8Array(await dosya.arrayBuffer()), isEvalSupported: false }).promise
  try {
    if (belge.numPages > EL_NOTU_AZAMI_SAYFA) throw new Error('cok_sayfa')
    const out: Rgba[] = []
    for (let no = 1; no <= belge.numPages; no++) {
      const s = await belge.getPage(no)
      const ilk = s.getViewport({ scale: 1 })
      const vp = s.getViewport({ scale: Math.min(4, AZAMI_KENAR / Math.max(ilk.width, ilk.height)) })
      const c = tuvalOlustur(Math.max(1, Math.round(vp.width)), Math.max(1, Math.round(vp.height)))
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
      await s.render({ canvasContext: ctx, viewport: vp }).promise
      out.push(tuvaldenRaster(c))
    }
    return out
  } finally { await belge.destroy().catch(() => undefined) }
}

export const pdfMi = (d: Blob, ad?: string) => d.type === 'application/pdf' || /\.pdf$/i.test(ad || '')

/** Any capture (photos, a multi-page PDF) → rasters in order. */
export async function dosyalariRastereCevir(dosyalar: File[]): Promise<Rgba[]> {
  const out: Rgba[] = []
  for (const f of dosyalar) {
    if (pdfMi(f, f.name)) out.push(...(await pdfiRastereCevir(f)))
    else if (f.type.startsWith('image/') || /\.(jpe?g|png|heic|webp)$/i.test(f.name)) out.push(await gorseliRastereCevir(f))
    if (out.length > EL_NOTU_AZAMI_SAYFA) break
  }
  return out.slice(0, EL_NOTU_AZAMI_SAYFA)
}

/** The page the doctor keeps (vault): re-encoded → no EXIF / GPS; ≤ 2400 px. */
export async function orijinalKopya(r: Rgba): Promise<{ mime: 'image/jpeg'; base64: string }> {
  const o = Math.min(1, 2400 / Math.max(r.w, r.h))
  const c = rasterdenTuval(r)
  if (o === 1) return { mime: 'image/jpeg', base64: c.toDataURL('image/jpeg', 0.86).split(',')[1] }
  const k = tuvalOlustur(Math.round(r.w * o), Math.round(r.h * o))
  k.getContext('2d')!.drawImage(c, 0, 0, k.width, k.height)
  return { mime: 'image/jpeg', base64: k.toDataURL('image/jpeg', 0.86).split(',')[1] }
}

/** SHA-256 hex over the rasters (the source's idempotency key: the same pages give the same source). */
export async function icerikOzeti(rasterler: Rgba[], ek = ''): Promise<string> {
  const parca: Uint8Array[] = []
  for (const r of rasterler) {
    // a 64x64 thumbnail per page is enough to identify the content and cheap to hash
    const c = rasterdenTuval(r), k = tuvalOlustur(64, 64)
    k.getContext('2d')!.drawImage(c, 0, 0, 64, 64)
    parca.push(new Uint8Array(k.getContext('2d')!.getImageData(0, 0, 64, 64).data.buffer))
  }
  parca.push(new TextEncoder().encode(ek))
  const birlesik = new Uint8Array(parca.reduce((t, p) => t + p.length, 0))
  let i = 0
  for (const p of parca) { birlesik.set(p, i); i += p.length }
  const h = await crypto.subtle.digest('SHA-256', birlesik)
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Load the masked page picture (served by /api/doktor/el-notu/gorsel) as a canvas for crops. */
export async function maskeliSayfaTuvali(blob: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob)
  const c = tuvalOlustur(bmp.width, bmp.height)
  c.getContext('2d')!.drawImage(bmp, 0, 0)
  return c
}

/** A word / line crop of the MASKED page + its memory descriptor (what a Doğrula answer teaches). */
export function ogrenmeKirpintisi(sayfa: HTMLCanvasElement, kutu: Kutu): { tanimlayici: number[]; enBoy: number; kirpinti: { mime: string; base64: string } } | null {
  const x0 = Math.max(0, Math.floor(kutu.x0 * sayfa.width)), y0 = Math.max(0, Math.floor(kutu.y0 * sayfa.height))
  const w = Math.min(sayfa.width - x0, Math.ceil((kutu.x1 - kutu.x0) * sayfa.width)), h = Math.min(sayfa.height - y0, Math.ceil((kutu.y1 - kutu.y0) * sayfa.height))
  if (w < 4 || h < 4) return null
  const c = tuvalOlustur(w, h)
  c.getContext('2d')!.drawImage(sayfa, x0, y0, w, h, 0, 0, w, h)
  const r = tuvaldenRaster(c)
  const t = tanimlayici(kontrastNormalize(griyeCevir(r)), { x0: 0, y0: 0, x1: 1, y1: 1 })
  if (!t) return null
  return { tanimlayici: t.v, enBoy: t.enBoy, kirpinti: { mime: 'image/jpeg', base64: c.toDataURL('image/jpeg', 0.85).split(',')[1] } }
}
