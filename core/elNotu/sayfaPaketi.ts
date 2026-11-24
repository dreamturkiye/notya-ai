/**
 * ESNEK-MUAYENE-A — one captured photo → the outbound page package (runs on the DEVICE; the evaluation harness runs the
 * same code in Node with a canvas adapter). Order matters for privacy: de-warp → quality gate → identity regions (template
 * position + OCR labels + rotated margins) → black them out on the page raster → ONLY THEN cut line / region crops and
 * descriptors from the masked raster. The original photo goes to the vault untouched (the doctor sees it); no unmasked
 * pixel is ever placed in the package.
 */
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import { murekkepMaskesi, renkliMurekkep, sayfayiHazirla } from './onisleme'
import { satirlariCikar, bolgeyeBagla } from './satir'
import { gizlilikKarari, maskeyiBoya, maskeliMi, type GizlilikKarari, type KenarOcr } from './gizlilik'
import { parmakIzi, sablonBul } from './sablon'
import { tanimlayici } from './hafiza'
import { bolgeMurekkebi } from './cizim'
import type { GorselBlok, SayfaPaketi, SatirPaketi } from './okuyucu'
import type { Gri, KaliteKarari, Kutu, Rgba, Sablon } from './tipler'

/** Raster ↔ encoded image, provided by the environment (browser canvas / @napi-rs/canvas). */
export type TuvalAdaptoru = {
  jpeg(r: Rgba, kalite: number): Promise<string> // base64
}
/** OCR of an RGBA raster (on-device tesseract). Null when the engine failed. */
export type OcrAdaptoru = (r: Rgba) => Promise<OcrSatir[] | null>

export type PaketSonucu =
  | { durum: 'tekrar'; kalite: KaliteKarari }
  | { durum: 'baslik_gerekli'; onizleme: GorselBlok; w: number; h: number; parmakIzi: number[]; enBoy: number; gizlilik: GizlilikKarari }
  | { durum: 'gizlenemedi'; gizlilik: GizlilikKarari }
  | {
    durum: 'hazir'
    paket: SayfaPaketi
    maskeliSayfa: GorselBlok & { w: number; h: number }
    gizlilik: GizlilikKarari
    sablon: Sablon | null
    sablonSkoru: number
    parmakIzi: number[]
    enBoy: number
    yontem: 'blob' | 'serit'
  }

function kirp(r: Rgba, k: Kutu, olcek: number, payY = 0): Rgba {
  const x0 = Math.max(0, Math.floor(k.x0 * r.w)), x1 = Math.min(r.w, Math.ceil(k.x1 * r.w))
  const hy = (k.y1 - k.y0) * r.h * payY
  const y0 = Math.max(0, Math.floor(k.y0 * r.h - hy)), y1 = Math.min(r.h, Math.ceil(k.y1 * r.h + hy))
  const w = Math.max(1, Math.round((x1 - x0) * olcek)), h = Math.max(1, Math.round((y1 - y0) * olcek))
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(r.w - 1, x0 + Math.floor(x / olcek)), sy = Math.min(r.h - 1, y0 + Math.floor(y / olcek))
    const i = (sy * r.w + sx) * 4, o = (y * w + x) * 4
    d[o] = r.d[i]; d[o + 1] = r.d[i + 1]; d[o + 2] = r.d[i + 2]; d[o + 3] = 255
  }
  return { w, h, d }
}

/**
 * Read B's crop keeps the lines above and below as context, but FADED towards white (and the target band untouched), so
 * the model sees where the line sits without transcribing its neighbours. `bant` = the line's rows inside the crop.
 */
export function baglamiSoldur(r: Rgba, bant: { y0: number; y1: number }, oran = 0.72): Rgba {
  const y0 = Math.max(0, Math.round(bant.y0)), y1 = Math.min(r.h, Math.round(bant.y1))
  for (let y = 0; y < r.h; y++) {
    if (y >= y0 && y < y1) continue
    for (let x = 0; x < r.w; x++) {
      const i = (y * r.w + x) * 4
      r.d[i] = r.d[i] + (255 - r.d[i]) * oran; r.d[i + 1] = r.d[i + 1] + (255 - r.d[i + 1]) * oran; r.d[i + 2] = r.d[i + 2] + (255 - r.d[i + 2]) * oran
    }
  }
  return r
}

/**
 * A line the on-device OCR read as PRINT (form labels, letterhead, stamp, legal footer): high-confidence words of ≥ 3
 * letters cover at least half of its width. Handwriting is not recognised at that confidence. Such strips are not sent.
 */
export function basiliSatirMi(k: Kutu, ocr: OcrSatir[] | null, w: number, h: number): boolean {
  if (!ocr?.length) return false
  const x0 = k.x0 * w, x1 = k.x1 * w, y0 = k.y0 * h, y1 = k.y1 * h
  let kapli = 0
  for (const l of ocr) for (const kel of l.kelimeler) {
    if (kel.conf < 80 || (kel.text.match(/\p{L}/gu) || []).length < 3) continue
    const cy = (kel.y0 + kel.y1) / 2
    if (cy < y0 || cy > y1) continue
    kapli += Math.max(0, Math.min(x1, kel.x1) - Math.max(x0, kel.x0))
  }
  return kapli >= (x1 - x0) * 0.5
}

function griRgba(g: Gri): Rgba {
  const d = new Uint8ClampedArray(g.w * g.h * 4)
  for (let i = 0; i < g.d.length; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g.d[i]; d[i * 4 + 3] = 255 }
  return { w: g.w, h: g.h, d }
}

function kucult(r: Rgba, maxKenar: number): Rgba {
  const o = Math.min(1, maxKenar / Math.max(r.w, r.h))
  return o === 1 ? r : kirp(r, { x0: 0, y0: 0, x1: 1, y1: 1 }, o)
}

/** The four margin strips rotated upright for OCR (foreign sheets intruding at an edge are often turned 90°). */
function kenarSeritleri(r: Rgba): { kenar: KenarOcr['kenar']; raster: Rgba; geri: (x: number, y: number) => { x: number; y: number } }[] {
  const out: ReturnType<typeof kenarSeritleri> = []
  const genislik = Math.round(r.w * 0.2), yukseklik = Math.round(r.h * 0.2)
  // right strip, rotated 90° counter-clockwise and clockwise → we try both by OCR-ing both orientations
  const dondur = (src: Rgba, sx0: number, sy0: number, sw: number, sh: number, saat: boolean) => {
    const w = sh, h = sw, d = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const kx = saat ? y : sw - 1 - y, ky = saat ? sh - 1 - x : x
      const i = ((sy0 + ky) * src.w + (sx0 + kx)) * 4, o = (y * w + x) * 4
      d[o] = src.d[i]; d[o + 1] = src.d[i + 1]; d[o + 2] = src.d[i + 2]; d[o + 3] = 255
    }
    return { w, h, d }
  }
  for (const saat of [true, false]) {
    const sx0 = r.w - genislik
    out.push({ kenar: 'sag', raster: dondur(r, sx0, 0, genislik, r.h, saat), geri: (x, y) => (saat ? { x: sx0 + y, y: r.h - 1 - x } : { x: sx0 + genislik - 1 - y, y: x }) })
    out.push({ kenar: 'sol', raster: dondur(r, 0, 0, genislik, r.h, saat), geri: (x, y) => (saat ? { x: y, y: r.h - 1 - x } : { x: genislik - 1 - y, y: x }) })
  }
  void yukseklik
  return out
}

export type PaketGirdisi = {
  foto: Rgba
  sayfa: number
  sablonlar: Sablon[]
  /** The doctor's standing "my plain sheets carry no identity" declaration. */
  serbestBeyan: boolean
  /** Regions the user marked on this page (after a 'baslik_gerekli' answer). */
  kullaniciBolgeleri?: Kutu[]
  tuval: TuvalAdaptoru
  ocr: OcrAdaptoru
  /** Margin OCR is skipped only in unit tests. */
  kenarOcrAtla?: boolean
}

export async function sayfaPaketiHazirla(g: PaketGirdisi): Promise<PaketSonucu> {
  let on = sayfayiHazirla(g.foto)
  if (!on.kalite.tamam) return { durum: 'tekrar', kalite: on.kalite }
  let izi = parmakIzi(on.normal, on.renkli)
  let enBoy = on.sayfa.w / on.sayfa.h
  let { sablon, skor } = sablonBul(izi, enBoy, g.sablonlar)
  if (sablon && Math.abs(sablon.enBoy - enBoy) > 0.01) {
    on = sayfayiHazirla(g.foto, { enBoy: sablon.enBoy })
    izi = parmakIzi(on.normal, on.renkli)
    enBoy = on.sayfa.w / on.sayfa.h
    skor = sablonBul(izi, enBoy, [sablon]).skor
  }
  const serbest = g.sablonlar.find((s) => s.tur === 'serbest') || null
  const ocr = await g.ocr(on.sayfa)
  let kenarOcr: KenarOcr[] | null = null
  if (!g.kenarOcrAtla) {
    kenarOcr = []
    for (const s of kenarSeritleri(on.sayfa)) {
      const sonuc = await g.ocr(s.raster)
      if (!sonuc) continue
      kenarOcr.push({
        kenar: s.kenar,
        satirlar: sonuc.map((l) => ({
          kelimeler: l.kelimeler.map((w) => {
            const a = s.geri(w.x0, w.y0), b = s.geri(w.x1, w.y1)
            return { ...w, x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }
          }),
        })),
      })
    }
  }
  const karar = gizlilikKarari({
    w: on.sayfa.w, h: on.sayfa.h, ocr, kenarOcr, sablon: sablon && skor > 0 ? sablon : null, sablonEslesmesi: skor,
    kullaniciBolgeleri: g.kullaniciBolgeleri, serbestBeyan: Boolean(serbest),
  })
  if (karar.durum === 'ocr_basarisiz') return { durum: 'gizlenemedi', gizlilik: karar }
  if (karar.durum === 'baslik_gerekli') {
    // preview for marking: the page with every region found so far already blacked out (no identity in the preview either)
    const on2 = { ...on.sayfa, d: new Uint8ClampedArray(on.sayfa.d) }
    maskeyiBoya(on2, karar.kutular)
    const k = kucult(on2, 900)
    return { durum: 'baslik_gerekli', onizleme: { mime: 'image/jpeg', base64: await g.tuval.jpeg(k, 0.7) }, w: k.w, h: k.h, parmakIzi: izi, enBoy, gizlilik: karar }
  }
  // ---- masked raster: everything below is cut from it ----
  const maskeli: Rgba = { w: on.sayfa.w, h: on.sayfa.h, d: new Uint8ClampedArray(on.sayfa.d) }
  maskeyiBoya(maskeli, karar.kutular)
  // the contrast-normalised page with the same boxes painted black (normalising after masking would let the black boxes
  // skew the paper estimate); the layout reads the ink of the unmasked normal but every masked box is excluded below
  const maskeliNormal: Gri = { w: on.normal.w, h: on.normal.h, d: new Uint8ClampedArray(on.normal.d) }
  for (const k of karar.kutular) {
    for (let y = Math.max(0, Math.floor(k.y0 * maskeliNormal.h)); y < Math.min(maskeliNormal.h, Math.ceil(k.y1 * maskeliNormal.h)); y++)
      for (let x = Math.max(0, Math.floor(k.x0 * maskeliNormal.w)); x < Math.min(maskeliNormal.w, Math.ceil(k.x1 * maskeliNormal.w)); x++) maskeliNormal.d[y * maskeliNormal.w + x] = 0
  }
  const murekkep = murekkepMaskesi(on.normal)
  const renkli = renkliMurekkep(maskeli)
  const aktifSablon = sablon && skor >= 0.62 ? sablon : null
  const bolgeler = aktifSablon?.cizimBolgeleri || []
  const haric = [...karar.kutular, ...bolgeler.map((b) => b.kutu)]
  const yer = satirlariCikar(murekkep, haric)
  const normalRgba = griRgba(maskeliNormal)
  const satirlar: SatirPaketi[] = []
  for (const s of yer.satirlar) {
    if (maskeliMi(s.kutu, karar.kutular, 0.35)) continue
    if (basiliSatirMi(s.kutu, ocr, on.sayfa.w, on.sayfa.h)) continue
    const yukPx = (s.kutu.y1 - s.kutu.y0) * maskeli.h
    const olcekA = Math.max(1, Math.min(3, 112 / Math.max(1, yukPx)))
    const genA = (s.kutu.x1 - s.kutu.x0) * maskeli.w * olcekA
    const oA = genA > 1800 ? olcekA * (1800 / genA) : olcekA
    const olcekB = Math.max(0.8, Math.min(2.2, 84 / Math.max(1, yukPx)))
    const kA = kirp(normalRgba, s.kutu, oA)
    // the line band inside B's crop (the context margin is clipped at the page edge, so it is not always symmetric)
    const payPx = (s.kutu.y1 - s.kutu.y0) * maskeli.h * 0.4
    const ustPx = Math.floor(s.kutu.y0 * maskeli.h) - Math.max(0, Math.floor(s.kutu.y0 * maskeli.h - payPx))
    const kB = baglamiSoldur(kirp(maskeli, s.kutu, olcekB, 0.4), { y0: ustPx * olcekB, y1: (ustPx + yukPx) * olcekB })
    satirlar.push({
      no: s.no, kutu: s.kutu, kelimeler: s.kelimeler,
      tanimlar: s.kelimeler.map((k) => tanimlayici(maskeliNormal, k)),
      gorselA: { mime: 'image/jpeg', base64: await g.tuval.jpeg(kA, 0.85) },
      gorselB: { mime: 'image/jpeg', base64: await g.tuval.jpeg(kB, 0.8) },
      bolgeId: bolgeler.length ? bolgeyeBagla(s.kutu, bolgeler, yer.cizgiler) : null,
    })
  }
  const bolgePaketleri = []
  for (const b of bolgeler) {
    const pay = 0.03
    const k = { x0: Math.max(0, b.kutu.x0 - pay), y0: Math.max(0, b.kutu.y0 - pay), x1: Math.min(1, b.kutu.x1 + pay), y1: Math.min(1, b.kutu.y1 + pay) }
    const ink = bolgeMurekkebi(renkli, b.kutu)
    const kr = kirp(maskeli, k, Math.min(2, 520 / Math.max(1, (k.x1 - k.x0) * maskeli.w)))
    bolgePaketleri.push({ ...b, murekkep: ink, gorsel: { mime: 'image/jpeg', base64: await g.tuval.jpeg(kr, 0.82) } })
  }
  const sayfaGorseli = kucult(maskeli, 1600)
  return {
    durum: 'hazir',
    paket: { sayfa: g.sayfa, sablonId: aktifSablon?.id ?? null, kalite: on.kalite, satirlar, bolgeler: bolgePaketleri },
    maskeliSayfa: { mime: 'image/jpeg', base64: await g.tuval.jpeg(sayfaGorseli, 0.82), w: sayfaGorseli.w, h: sayfaGorseli.h },
    gizlilik: karar, sablon: aktifSablon, sablonSkoru: skor, parmakIzi: izi, enBoy, yontem: yer.yontem,
  }
}

/** Shared size guard (the request body cap is 4.5 MB on the host). */
export const PAKET_AZAMI_KARAKTER = 4_000_000
export function paketBoyutu(p: SayfaPaketi, sayfa: GorselBlok): number {
  return sayfa.base64.length + p.satirlar.reduce((t, s) => t + s.gorselA.base64.length + s.gorselB.base64.length, 0) + p.bolgeler.reduce((t, b) => t + (b.gorsel?.base64.length || 0), 0)
}
