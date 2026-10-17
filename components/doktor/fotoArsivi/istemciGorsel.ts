/**
 * FOTO-ARSIV-01 — canvas helpers of the photo archive (browser only).
 *  - adjusted frame (crop -> rotate -> tone) on a bounded working copy; the vault original is never touched
 *  - vector annotations drawn from normalised ORIGINAL coordinates (arrow, circle, freehand, text, measurement, scale)
 *  - EXIF-free derivatives (a canvas re-encode carries no metadata) for AI and the PDF report, and thumbnails
 */
import {
  cikisBoyutu, kaynaktanGorunume, mmPerPiksel, NOTASYON_RENK_KODU, olcumMetni, olcumMm, tonDegistiMi,
  type Ayarlar, type Notasyon,
} from '@/lib/doktor/fotoArsiv/duzenleme'
import { calismaBoyutu, tonuUygula } from '@/lib/doktor/fotoArsiv/piksel'
import { kaliteKarari, kaliteOlc, kucultRgba, type KaliteKarari } from '@/lib/doktor/fotoArsiv/goruntuKalitesi'

export function tuval(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

export const bitmapBoyutu = (b: ImageBitmap | HTMLCanvasElement): { w: number; h: number } => ({ w: b.width, h: b.height })

/** The frame the viewer shows: crop, then rotation, then tone — at most `azami` px on the long side. */
export function kareCiz(bitmap: ImageBitmap, a: Ayarlar, azami = 3072): HTMLCanvasElement {
  const bw = bitmap.width, bh = bitmap.height
  const k = a.kirp
  const sx = k ? k.x * bw : 0, sy = k ? k.y * bh : 0
  const sw = k ? k.w * bw : bw, sh = k ? k.h * bh : bh
  const tam = cikisBoyutu(bw, bh, a)
  const kucuk = calismaBoyutu(Math.round(tam.w), Math.round(tam.h), azami)
  const oran = tam.w > 0 ? kucuk.w / tam.w : 1
  const c = tuval(kucuk.w, kucuk.h)
  const ctx = c.getContext('2d', { willReadFrequently: tonDegistiMi(a) })
  if (!ctx) return c
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((a.dondur * Math.PI) / 180)
  ctx.drawImage(bitmap, sx, sy, sw, sh, -(sw * oran) / 2, -(sh * oran) / 2, sw * oran, sh * oran)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (tonDegistiMi(a)) {
    const veri = ctx.getImageData(0, 0, c.width, c.height)
    tonuUygula(veri.data, a)
    ctx.putImageData(veri, 0, 0)
  }
  return c
}

export interface CizimKutusu { x0: number; y0: number; w: number; h: number }

interface CizimSecenekleri {
  /** device px per drawing unit; 1 on screen at DPR 1, outW/900 in exports */
  birim: number
  orijinal: { w: number; h: number }
  secili?: string | null
}

const ok = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, kalin: number) => {
  const aci = Math.atan2(by - ay, bx - ax)
  const bas = kalin * 5
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - bas * Math.cos(aci - Math.PI / 7), by - bas * Math.sin(aci - Math.PI / 7))
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - bas * Math.cos(aci + Math.PI / 7), by - bas * Math.sin(aci + Math.PI / 7))
  ctx.stroke()
}

function etiketYaz(ctx: CanvasRenderingContext2D, metin: string, x: number, y: number, boyut: number, renk: string) {
  ctx.font = `600 ${boyut}px system-ui, -apple-system, 'Segoe UI', sans-serif`
  ctx.textBaseline = 'bottom'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, boyut / 4)
  ctx.strokeStyle = 'rgba(0,0,0,0.78)'
  ctx.strokeText(metin, x, y)
  ctx.fillStyle = renk
  ctx.fillText(metin, x, y)
}

/** Draws every annotation of a photo inside `kutu` (the rendered frame in canvas px). */
export function notasyonlariCiz(ctx: CanvasRenderingContext2D, notasyonlar: readonly Notasyon[], a: Pick<Ayarlar, 'dondur' | 'kirp'>, kutu: CizimKutusu, s: CizimSecenekleri): void {
  if (!notasyonlar.length) return
  const mmPx = mmPerPiksel(notasyonlar as Notasyon[], s.orijinal.w, s.orijinal.h)
  const kalin = Math.max(1.5, 2.6 * s.birim)
  const P = (p: { x: number; y: number }) => {
    const v = kaynaktanGorunume(p, a)
    return { x: kutu.x0 + v.x * kutu.w, y: kutu.y0 + v.y * kutu.h }
  }
  ctx.save()
  ctx.beginPath(); ctx.rect(kutu.x0, kutu.y0, kutu.w, kutu.h); ctx.clip()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const n of notasyonlar) {
    const secili = s.secili === n.id
    const renk = n.t === 'olcek' ? '#ffffff' : NOTASYON_RENK_KODU[n.renk]
    ctx.strokeStyle = renk; ctx.fillStyle = renk; ctx.lineWidth = kalin
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = kalin * 1.2
    ctx.setLineDash([])
    if (n.t === 'ok') { const A = P(n.a), B = P(n.b); ok(ctx, A.x, A.y, B.x, B.y, kalin) }
    else if (n.t === 'daire') {
      const A = P(n.a), B = P(n.b)
      ctx.beginPath(); ctx.ellipse((A.x + B.x) / 2, (A.y + B.y) / 2, Math.max(1, Math.abs(B.x - A.x) / 2), Math.max(1, Math.abs(B.y - A.y) / 2), 0, 0, Math.PI * 2); ctx.stroke()
    } else if (n.t === 'serbest') {
      ctx.beginPath()
      n.noktalar.forEach((p, i) => { const q = P(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y) })
      ctx.stroke()
    } else if (n.t === 'metin') {
      const q = P(n.p)
      ctx.shadowBlur = 0
      etiketYaz(ctx, n.metin, q.x, q.y, 15 * s.birim, renk)
    } else if (n.t === 'olcum' || n.t === 'olcek') {
      const A = P(n.a), B = P(n.b)
      if (n.t === 'olcek') ctx.setLineDash([6 * s.birim, 4 * s.birim])
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
      ctx.setLineDash([])
      const aci = Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2
      const t = 5 * s.birim
      for (const U of [A, B]) { ctx.beginPath(); ctx.moveTo(U.x - Math.cos(aci) * t, U.y - Math.sin(aci) * t); ctx.lineTo(U.x + Math.cos(aci) * t, U.y + Math.sin(aci) * t); ctx.stroke() }
      ctx.shadowBlur = 0
      const metin = n.t === 'olcek' ? `${olcumMetni(n.mm)} referans` : mmPx ? olcumMetni(olcumMm(n.a, n.b, s.orijinal.w, s.orijinal.h, mmPx)) : 'ölçek yok'
      etiketYaz(ctx, metin, (A.x + B.x) / 2 + 4 * s.birim, (A.y + B.y) / 2 - 4 * s.birim, 13 * s.birim, renk)
    }
    if (secili) {
      ctx.shadowBlur = 0; ctx.setLineDash([4 * s.birim, 3 * s.birim]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1 * s.birim
      const pts = n.t === 'serbest' ? n.noktalar : n.t === 'metin' ? [n.p] : [n.a, n.b]
      const xs = pts.map((p) => P(p).x), ys = pts.map((p) => P(p).y)
      const m = 8 * s.birim
      ctx.strokeRect(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m)
    }
  }
  ctx.restore()
}

export function blobaCevir(c: HTMLCanvasElement, tur = 'image/jpeg', kalite = 0.85): Promise<Blob | null> {
  return new Promise((coz) => c.toBlob((b) => coz(b), tur, kalite))
}

const dataUrlOku = (b: Blob): Promise<string> => new Promise((coz, red) => {
  const r = new FileReader()
  r.onload = () => coz(String(r.result))
  r.onerror = () => red(new Error('okunamadı'))
  r.readAsDataURL(b)
})

/**
 * Downscaled, metadata-free JPEG of the ORIGINAL (no tone changes, no annotations) as a data URL. This is the only form
 * of a photo that ever reaches the AI routes. A canvas re-encode carries no EXIF/GPS; the server strips again.
 */
export async function turevUret(bitmap: ImageBitmap, azamiKenar = 1280, kalite = 0.85): Promise<string> {
  const k = calismaBoyutu(bitmap.width, bitmap.height, azamiKenar)
  const c = tuval(k.w, k.h)
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Tuval açılamadı')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, c.width, c.height)
  let q = kalite
  for (let i = 0; i < 5; i++) {
    const b = await blobaCevir(c, 'image/jpeg', q)
    if (b && b.size <= 2_300_000) return dataUrlOku(b)
    q -= 0.15
  }
  throw new Error('Görsel yeterince küçültülemedi')
}

/** Thumbnail <= 150 KB: 320 px long side, JPEG quality lowered until it fits. */
export async function kucukResimUret(bitmap: ImageBitmap): Promise<{ blob: Blob; w: number; h: number }> {
  const k = calismaBoyutu(bitmap.width, bitmap.height, 320)
  const c = tuval(k.w, k.h)
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Tuval açılamadı')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, c.width, c.height)
  let q = 0.74
  let b: Blob | null = null
  for (let i = 0; i < 5; i++) {
    b = await blobaCevir(c, 'image/jpeg', q)
    if (b && b.size <= 150_000) break
    q -= 0.12
  }
  if (!b || b.size > 150_000) throw new Error('Küçük resim üretilemedi')
  return { blob: b, w: c.width, h: c.height }
}

/** Client-side first-pass quality read (blur / dark / blown / low contrast / tiny). Thresholds are untuned on real photos. */
export function bitmapKalitesi(bitmap: ImageBitmap): KaliteKarari {
  const k = calismaBoyutu(bitmap.width, bitmap.height, 512)
  const c = tuval(k.w, k.h)
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { durum: 'iyi', sorunlar: [], oneri: null }
  ctx.drawImage(bitmap, 0, 0, c.width, c.height)
  const d = ctx.getImageData(0, 0, c.width, c.height)
  const kucuk = kucultRgba(d.data, c.width, c.height, 512)
  return kaliteKarari(kaliteOlc(kucuk.veri, kucuk.w, kucuk.h), bitmap.width, bitmap.height)
}

/** The photo as the doctor sees it (adjusted + annotated) for the PDF report; JPEG data URL, bounded in size. */
export async function disaAktarGorseli(bitmap: ImageBitmap, a: Ayarlar, notasyonlar: readonly Notasyon[], azamiKenar = 1100, kalite = 0.8): Promise<string> {
  const kare = kareCiz(bitmap, a, azamiKenar)
  const c = tuval(kare.width, kare.height)
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Tuval açılamadı')
  ctx.drawImage(kare, 0, 0)
  notasyonlariCiz(ctx, notasyonlar, a, { x0: 0, y0: 0, w: c.width, h: c.height }, { birim: c.width / 900, orijinal: { w: bitmap.width, h: bitmap.height } })
  const b = await blobaCevir(c, 'image/jpeg', kalite)
  if (!b) throw new Error('Görsel hazırlanamadı')
  return dataUrlOku(b)
}
