'use client'

/**
 * NOTYA-ULKE-EKLER-01 — the pages of a PDF as pictures, ON THE DEVICE, so that a PDF goes through exactly the same
 * identity masking as a photograph (a PDF has no pixels to mask until it is drawn). The engine is a same-origin file
 * (public/pdfjs, served under the build's path prefix) loaded at run time — never bundled, never fetched from a CDN.
 * A PDF that cannot be opened or drawn gives no pictures, and then nothing of it is sent.
 */
import { ulkeYolOnEki } from '@/lib/ulke/yol'

type PdfSayfa = { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> }; cleanup?: () => void }
type PdfBelge = { numPages: number; getPage: (n: number) => Promise<PdfSayfa>; destroy: () => Promise<void> }
type PdfModulu = { getDocument: (o: { data: Uint8Array }) => { promise: Promise<PdfBelge> }; GlobalWorkerOptions: { workerSrc: string } }

const EN_UZUN_KENAR = 2000

export async function pdfSayfalariniCiz(dosya: Blob, azamiSayfa: number): Promise<{ sayfalar: Blob[]; toplam: number }> {
  const taban = `${window.location.origin}${ulkeYolOnEki()}/pdfjs`
  const modul = (await import(/* webpackIgnore: true */ `${taban}/pdf.min.mjs`)) as PdfModulu
  modul.GlobalWorkerOptions.workerSrc = `${taban}/pdf.worker.min.mjs`
  const belge = await modul.getDocument({ data: new Uint8Array(await dosya.arrayBuffer()) }).promise
  try {
    const sayfalar: Blob[] = []
    for (let n = 1; n <= Math.min(belge.numPages, azamiSayfa); n++) {
      const sayfa = await belge.getPage(n)
      const ilk = sayfa.getViewport({ scale: 1 })
      const gorunum = sayfa.getViewport({ scale: Math.min(3, EN_UZUN_KENAR / Math.max(ilk.width, ilk.height)) })
      const tuval = document.createElement('canvas')
      tuval.width = Math.max(1, Math.round(gorunum.width)); tuval.height = Math.max(1, Math.round(gorunum.height))
      const ctx = tuval.getContext('2d')
      if (!ctx) throw new Error('canvas')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tuval.width, tuval.height)
      await sayfa.render({ canvasContext: ctx, viewport: gorunum }).promise
      const png = await new Promise<Blob | null>((coz) => tuval.toBlob((b) => coz(b), 'image/png'))
      if (!png) throw new Error('toBlob')
      sayfalar.push(png)
      sayfa.cleanup?.()
    }
    return { sayfalar, toplam: belge.numPages }
  } finally {
    try { await belge.destroy() } catch { /* already gone */ }
  }
}
