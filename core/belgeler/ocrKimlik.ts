/**
 * NOTYA-BELGE-DEID-02 — on-device OCR for burned-in identity text (browser only, no network call besides the
 * Tesseract language data the engine loads itself; image pixels never leave the device).
 * Engine: tesseract.js (already a dependency, also used by components/doktor/IdCardCapture.tsx), languages tur+eng.
 */
import type { OcrSatir } from './kimlikMaske'

type TessKelime = { text?: string; confidence?: number; bbox?: { x0: number; y0: number; x1: number; y1: number } }
type TessSatir = { words?: TessKelime[] }
type TessVeri = { lines?: TessSatir[]; blocks?: { paragraphs?: { lines?: TessSatir[] }[] }[] }

export const OCR_ZAMAN_ASIMI_MS = 30000

/** Returns the OCR lines, or null when the engine failed / timed out (caller must fall back to the doctor checkbox). */
export async function kimlikMetniOku(kaynak: HTMLCanvasElement, diller = 'tur+eng'): Promise<OcrSatir[] | null> {
  type Is = { recognize: (c: HTMLCanvasElement) => Promise<{ data: TessVeri }>; terminate: () => Promise<unknown> }
  const tutucu: { w: Is | null } = { w: null }
  try {
    const { createWorker } = await import('tesseract.js')
    tutucu.w = (await createWorker(diller)) as unknown as Is
    const sonuc = await Promise.race([
      tutucu.w.recognize(kaynak),
      new Promise<never>((_, red) => setTimeout(() => red(new Error('ocr timeout')), OCR_ZAMAN_ASIMI_MS)),
    ])
    const d = sonuc.data
    const satirlar: TessSatir[] = d.lines ?? (d.blocks ?? []).flatMap((b) => (b.paragraphs ?? []).flatMap((p) => p.lines ?? []))
    return satirlar.map((s) => ({
      kelimeler: (s.words ?? [])
        .filter((w) => w.bbox && (w.text ?? '').trim())
        .map((w) => ({ text: w.text as string, x0: w.bbox!.x0, y0: w.bbox!.y0, x1: w.bbox!.x1, y1: w.bbox!.y1, conf: w.confidence ?? 0 })),
    }))
  } catch {
    return null
  } finally {
    try { await tutucu.w?.terminate() } catch { /* ignore */ }
  }
}
