/**
 * NOTYA-BELGE-DEID-02 — on-device OCR for burned-in identity text (browser only; image pixels never leave the device).
 * Engine: tesseract.js (languages tur+eng), SELF-HOSTED from /tesseract (worker, wasm core, language data).
 *
 * NOTYA-BELGE-OTO-02 (2026-10-22): the first live run showed NO image was ever evaluated: the engine's default CDN
 * downloads (jsdelivr core / tessdata host) are blocked by the app CSP (connect-src / worker-src), so every OCR call
 * failed and every image was skipped ("Kimlik gizlenemedi"). Assets are now same-origin (public/tesseract) and ONE shared
 * worker serves all images (serialised queue, retried once, released after an idle period).
 */
import type { OcrSatir } from './kimlikMaske'

type TessKelime = { text?: string; confidence?: number; bbox?: { x0: number; y0: number; x1: number; y1: number } }
type TessSatir = { words?: TessKelime[] }
type TessVeri = { lines?: TessSatir[]; blocks?: { paragraphs?: { lines?: TessSatir[] }[] }[] }
type Is = { recognize: (c: HTMLCanvasElement) => Promise<{ data: TessVeri }>; terminate: () => Promise<unknown> }

export const OCR_ZAMAN_ASIMI_MS = 60000
export const OCR_BASLATMA_ZAMAN_ASIMI_MS = 90000
const BOSTA_BIRAKMA_MS = 120000
const DILLER = 'tur+eng'

/** Same-origin engine files (never a CDN): public/tesseract/{worker.min.js, tesseract-core*.wasm.js, lang/*.traineddata.gz}. */
export function tesseractVarliklari(origin: string = typeof window !== 'undefined' ? window.location.origin : ''): { workerPath: string; corePath: string; langPath: string; gzip: boolean } {
  const k = `${origin}/tesseract`
  return { workerPath: `${k}/worker.min.js`, corePath: k, langPath: `${k}/lang`, gzip: true }
}

function zamanla<T>(p: Promise<T>, ms: number, ad: string): Promise<T> {
  return Promise.race([p, new Promise<never>((_, red) => setTimeout(() => red(new Error(`${ad} timeout`)), ms))])
}

let isciSozu: Promise<Is> | null = null
let sira: Promise<unknown> = Promise.resolve()
let bostaZamanlayici: ReturnType<typeof setTimeout> | null = null

function isciAl(): Promise<Is> {
  if (!isciSozu) {
    const s = (async () => {
      const { createWorker } = await import('tesseract.js')
      const olustur = createWorker as unknown as (d: string, oem: number, o: Record<string, unknown>) => Promise<Is>
      return zamanla(olustur(DILLER, 1, tesseractVarliklari()), OCR_BASLATMA_ZAMAN_ASIMI_MS, 'ocr init')
    })()
    isciSozu = s
    s.catch(() => { if (isciSozu === s) isciSozu = null })
  }
  return isciSozu
}

async function isciyiBirak(): Promise<void> {
  const s = isciSozu
  isciSozu = null
  if (bostaZamanlayici) { clearTimeout(bostaZamanlayici); bostaZamanlayici = null }
  try { await (await s)?.terminate() } catch { /* ignore */ }
}

function bostaBirakmayiPlanla(): void {
  if (bostaZamanlayici) clearTimeout(bostaZamanlayici)
  bostaZamanlayici = setTimeout(() => { void isciyiBirak() }, BOSTA_BIRAKMA_MS)
}

/** Starts the engine in the background (e.g. when the "belgeleri ekle" step opens) so the first image does not wait for it. */
export function ocrIsit(): void {
  if (typeof window === 'undefined') return
  void isciAl().then(() => bostaBirakmayiPlanla()).catch(() => undefined)
}

async function oku(kaynak: HTMLCanvasElement): Promise<OcrSatir[] | null> {
  for (let deneme = 0; deneme < 2; deneme++) {
    try {
      const w = await isciAl()
      const sonuc = await zamanla(w.recognize(kaynak), OCR_ZAMAN_ASIMI_MS, 'ocr')
      bostaBirakmayiPlanla()
      const d = sonuc.data
      const satirlar: TessSatir[] = d.lines ?? (d.blocks ?? []).flatMap((b) => (b.paragraphs ?? []).flatMap((p) => p.lines ?? []))
      return satirlar.map((s) => ({
        kelimeler: (s.words ?? [])
          .filter((w2) => w2.bbox && (w2.text ?? '').trim())
          .map((w2) => ({ text: w2.text as string, x0: w2.bbox!.x0, y0: w2.bbox!.y0, x1: w2.bbox!.x1, y1: w2.bbox!.y1, conf: w2.confidence ?? 0 })),
      }))
    } catch {
      await isciyiBirak() // a broken / timed-out worker is replaced by a fresh one on the retry
    }
  }
  return null
}

/** Returns the OCR lines, or null when the engine failed / timed out twice (caller must skip the auto flow / use the checkbox). */
export function kimlikMetniOku(kaynak: HTMLCanvasElement, _diller: string = DILLER): Promise<OcrSatir[] | null> {
  void _diller
  const is = sira.then(() => oku(kaynak))
  sira = is.catch(() => null)
  return is
}
