/**
 * NOTYA-BELGE-DEID-03-b (2026-11-20) — identity removal for PDFs, ON THE DEVICE, before anything is sent to a model.
 *
 * A PDF has no pixels to mask until it is drawn, and its text layer carries the patient block verbatim. So every page is drawn on
 * the device (pdf.js, same-origin file under /pdfjs — never bundled, never a CDN) and masked with the SAME rules as a photograph
 * (kimlikMaske.ts, modality 'belge': label -> value, ID-like numbers, unreadable value after a label, no whole-band blackout so the
 * result table stays readable):
 *   - page with a text layer: the text layer IS the OCR (exact words and boxes, confidence 100); page 1 also gets the 2x header-band
 *     OCR pass, which catches a patient block printed as a picture on top of a typed report;
 *   - scanned page (no text layer): the standard two-pass OCR, exactly as for an image.
 * Only the masked page pictures leave the device (`gorsel.base64` = page 1, `gorsel.ekSayfalar` = pages 2..N). The server never turns
 * the vault original into a model block. Cannot be opened / too many pages / payload too big / OCR failed / no identity label found /
 * a page read with low confidence -> `maske.durum !== 'maskelendi'` and the caller does not send (stays in Belgeler for manual work).
 */
import { belgeDurumu, kimlikBulgulari, kimlikKutulari, satirlariBirlestir, type KimlikBulgulari, type MaskeSonuc, type OcrKelime, type OcrSatir } from './kimlikMaske'
import { ikiGecisliOku, varlikOnEki } from './ocrKimlik'
import type { DeIdGorsel, OtomatikDeId } from './deid'

/** More pages than this are not sent (the model would get only part of a lab report; the request body would be too big). */
export const PDF_AZAMI_SAYFA = 20
/** Total base64 characters of all masked pages; stays under the 4.5 MB serverless request body with JSON overhead. */
export const PDF_GIDEN_AZAMI_KARAKTER = 3_600_000
/** A page with fewer text-layer characters than this is treated as scanned (OCR). */
const METIN_KATMANI_ESIGI = 20

/** Send size per page count: few pages keep full vision resolution; long reports are encoded smaller to fit one request. */
export function sayfaKodlama(sayfaSayisi: number): { maxKenar: number; kalite: number } {
  if (sayfaSayisi <= 4) return { maxKenar: 1568, kalite: 0.85 }
  if (sayfaSayisi <= 10) return { maxKenar: 1400, kalite: 0.78 }
  return { maxKenar: 1280, kalite: 0.72 }
}

/** One text-layer run in canvas pixels. `yatay` = runs left-to-right (rotated runs become one box). */
export type MetinOgesi = { str: string; x0: number; y0: number; x1: number; y1: number; yatay: boolean }

/**
 * Text-layer runs -> OCR-shaped lines (pure; unit-tested). Words get proportional boxes inside their run; runs whose vertical centres
 * are within half a line height are one line. Confidence 100: the text layer is exact.
 */
export function metinKatmaniSatirlari(ogeler: MetinOgesi[]): OcrSatir[] {
  const kelimeler: OcrKelime[] = []
  for (const o of ogeler) {
    const str = String(o.str || '')
    if (!str.trim()) continue
    if (!o.yatay) { kelimeler.push({ text: str.trim(), x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, conf: 100 }); continue }
    const cw = (o.x1 - o.x0) / Math.max(1, str.length)
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(str))) kelimeler.push({ text: m[0], x0: o.x0 + m.index * cw, y0: o.y0, x1: o.x0 + (m.index + m[0].length) * cw, y1: o.y1, conf: 100 })
  }
  const satirlar: { cy: number; h: number; ks: OcrKelime[] }[] = []
  for (const k of [...kelimeler].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)) {
    const cy = (k.y0 + k.y1) / 2, h = Math.max(1, k.y1 - k.y0)
    const s = satirlar.find((x) => Math.abs(x.cy - cy) < 0.5 * Math.min(h, x.h))
    if (s) s.ks.push(k); else satirlar.push({ cy, h, ks: [k] })
  }
  return satirlar.map((s) => ({ kelimeler: s.ks.sort((a, b) => a.x0 - b.x0) }))
}

// ─── browser only ────────────────────────────────────────────────────────────────────────────────────────────────
type Viewport = { width: number; height: number; scale: number; convertToViewportPoint: (x: number, y: number) => number[] }
type TextItem = { str?: string; transform?: number[]; width?: number; height?: number }
type PdfSayfa = { getViewport: (o: { scale: number }) => Viewport; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: Viewport }) => { promise: Promise<void> }; getTextContent: () => Promise<{ items: TextItem[] }>; cleanup?: () => void }
type PdfBelge = { numPages: number; getPage: (n: number) => Promise<PdfSayfa>; destroy: () => Promise<void> }
type PdfModulu = { getDocument: (o: { data: Uint8Array; isEvalSupported?: boolean }) => { promise: Promise<PdfBelge> }; GlobalWorkerOptions: { workerSrc: string } }

let modulSozu: Promise<PdfModulu> | null = null
export function pdfModulu(): Promise<PdfModulu> {
  if (!modulSozu) {
    const taban = `${window.location.origin}${varlikOnEki()}/pdfjs`
    const s = (import(/* webpackIgnore: true */ `${taban}/pdf.min.mjs`) as Promise<PdfModulu>).then((m) => { m.GlobalWorkerOptions.workerSrc = `${taban}/pdf.worker.min.mjs`; return m })
    modulSozu = s
    s.catch(() => { if (modulSozu === s) modulSozu = null })
  }
  return modulSozu
}

function metinOgeleri(items: TextItem[], vp: Viewport): MetinOgesi[] {
  const out: MetinOgesi[] = []
  for (const it of items) {
    const t = it.transform
    if (!t || typeof it.str !== 'string' || !it.str.trim()) continue
    const [a, b, c, d, e, f] = t
    const yon = Math.hypot(a, b) || 1, yuk = Math.hypot(c, d) || Math.abs(it.height || 0) || 1
    const ux = a / yon, uy = b / yon, vx = c / yuk, vy = d / yuk
    const w = Math.abs(it.width || 0), h = yuk
    const koseler = [[e, f], [e + ux * w, f + uy * w], [e + vx * h, f + vy * h], [e + ux * w + vx * h, f + uy * w + vy * h]].map(([x, y]) => vp.convertToViewportPoint(x, y))
    const xs = koseler.map((p) => p[0]), ys = koseler.map((p) => p[1])
    out.push({ str: it.str, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), yatay: Math.abs(b) <= Math.abs(a) * 0.1 && a > 0 })
  }
  return out
}

async function sha256(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
  const h = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, '0')).join('')
}

function bosSonuc(durum: OtomatikDeId['maske']['durum'], sayfa = 0): OtomatikDeId {
  return { gorsel: { mime: 'image/jpeg', base64: '', hash: '', genislik: 0, yukseklik: 0, kalite: { bulanik: false, laplacianVar: 0, parlaklik: 0 } }, maske: { durum, kutuSayisi: 0, ustBant: false, sayfa }, bulgu: {} }
}

export async function pdfiOtomatikKimliksizlestir(dosya: Blob, o: { azamiSayfa?: number } = {}): Promise<OtomatikDeId> {
  let belge: PdfBelge
  try {
    const m = await pdfModulu()
    belge = await m.getDocument({ data: new Uint8Array(await dosya.arrayBuffer()), isEvalSupported: false }).promise
  } catch { return bosSonuc('pdf_okunamadi') } // damaged / password-protected / engine missing: nothing is sent
  try {
    const n = belge.numPages
    if (!n) return bosSonuc('pdf_okunamadi')
    if (n > (o.azamiSayfa ?? PDF_AZAMI_SAYFA)) return bosSonuc('cok_buyuk', n)
    const { maxKenar, kalite } = sayfaKodlama(n)
    const sayfalar: { base64: string; genislik: number; yukseklik: number }[] = []
    const sonuclar: MaskeSonuc[] = []
    let ocrBasarisiz = false, kutuSayisi = 0, toplam = 0
    let bulgu: KimlikBulgulari = {}
    for (let no = 1; no <= n; no++) {
      const sayfa = await belge.getPage(no)
      const ilk = sayfa.getViewport({ scale: 1 })
      const vp = sayfa.getViewport({ scale: Math.min(3, 2000 / Math.max(ilk.width, ilk.height)) })
      const tuval = document.createElement('canvas')
      tuval.width = Math.max(1, Math.round(vp.width)); tuval.height = Math.max(1, Math.round(vp.height))
      const ctx = tuval.getContext('2d')
      if (!ctx) return bosSonuc('pdf_okunamadi', n)
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tuval.width, tuval.height)
      await sayfa.render({ canvasContext: ctx, viewport: vp }).promise
      let satirlar: OcrSatir[] | null = null
      let ogeler: MetinOgesi[] = []
      try { ogeler = metinOgeleri((await sayfa.getTextContent()).items || [], vp) } catch { ogeler = [] }
      if (ogeler.reduce((t, x) => t + x.str.trim().length, 0) >= METIN_KATMANI_ESIGI) {
        satirlar = metinKatmaniSatirlari(ogeler)
        if (no === 1) { const bant = await ikiGecisliOku(tuval, { yalnizBant: true }).catch(() => null); satirlar = satirlariBirlestir(satirlar, bant) || satirlar }
      } else {
        satirlar = await ikiGecisliOku(tuval).catch(() => null)
        if (!satirlar) ocrBasarisiz = true
      }
      const r = satirlar ? kimlikKutulari(satirlar, { genislik: tuval.width, yukseklik: tuval.height, modalite: 'belge' }) : null
      if (r) { sonuclar.push(r); kutuSayisi += r.kutular.length }
      if (satirlar) { const b = kimlikBulgulari(satirlar); bulgu = { ...b, ...bulgu } }
      ctx.fillStyle = '#000'
      for (const k of r?.kutular || []) ctx.fillRect(Math.floor(k.x0), Math.floor(k.y0), Math.ceil(k.x1 - k.x0) + 1, Math.ceil(k.y1 - k.y0) + 1)
      const olcek = Math.min(1, maxKenar / Math.max(tuval.width, tuval.height))
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(tuval.width * olcek)); c.height = Math.max(1, Math.round(tuval.height * olcek))
      c.getContext('2d')!.drawImage(tuval, 0, 0, c.width, c.height)
      const base64 = c.toDataURL('image/jpeg', kalite).split(',')[1] || ''
      toplam += base64.length
      sayfalar.push({ base64, genislik: c.width, yukseklik: c.height })
      tuval.width = 0; tuval.height = 0; c.width = 0; c.height = 0 // release page memory early (phones)
      sayfa.cleanup?.()
      if (toplam > PDF_GIDEN_AZAMI_KARAKTER) return { ...bosSonuc('cok_buyuk', n), bulgu }
    }
    const karar = ocrBasarisiz ? 'ocr_basarisiz' : belgeDurumu(sonuclar)
    const durum: OtomatikDeId['maske']['durum'] = karar === 'ok' ? 'maskelendi' : karar === 'ocr_basarisiz' ? 'ocr_basarisiz' : 'dusuk_guven'
    const gorsel: DeIdGorsel = {
      mime: 'image/jpeg', base64: sayfalar[0].base64, hash: await sha256(sayfalar.map((s) => s.base64).join('')),
      genislik: sayfalar[0].genislik, yukseklik: sayfalar[0].yukseklik, kalite: { bulanik: false, laplacianVar: 0, parlaklik: 0 },
      ...(sayfalar.length > 1 ? { ekSayfalar: sayfalar.slice(1).map((s) => ({ mime: 'image/jpeg' as const, base64: s.base64 })) } : {}),
    }
    return { gorsel, maske: { durum, kutuSayisi, ustBant: false, sayfa: n }, bulgu }
  } catch {
    return bosSonuc('pdf_okunamadi')
  } finally {
    try { await belge.destroy() } catch { /* already gone */ }
  }
}
