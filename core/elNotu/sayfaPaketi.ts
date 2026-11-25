/**
 * ESNEK-MUAYENE-A — one captured photo → the outbound page package (runs on the DEVICE; the evaluation harness runs the
 * same code in Node with a canvas adapter). Order matters for privacy: de-warp → quality gate → identity regions (template
 * position + OCR labels + rotated margins) → black them out on the page raster → ONLY THEN cut line boxes, region crops,
 * descriptors and the reader's page tiles from the masked raster. The original photo goes to the vault untouched (the doctor sees it); no unmasked
 * pixel is ever placed in the package.
 */
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import { murekkepMaskesi, renkliMurekkep, sayfayiHazirla } from './onisleme'
import { satirlariCikar, bolgeyeBagla, yerlesimBul } from './satir'
import { gizlilikKarari, maskeyiBoya, maskeliMi, serbestBaslikKutulari, tasmaKutulari, SABLON_ESIK, type GizlilikKarari, type KenarOcr } from './gizlilik'
import { parmakIzi, sablonBul } from './sablon'
import { sablonKaydi, sablonuYerlestir } from './kayit'
import { tanimlayici } from './hafiza'
import { bolgeMurekkebi } from './cizim'
import type { GorselBlok, SayfaPaketi, SatirPaketi, SayfaParcasi } from './okuyucu'
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
    /** How the template was placed: layout fingerprint, printed anchors (kayit.ts), or none. */
    sablonYontemi: 'iz' | 'capa' | null
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

/** Long edge of the whole-page picture (the vault copy and the reader's overview). */
export const SAYFA_KENAR = 1600
/** Width of a tile (never wider than the page itself: tiles are never upscaled). */
export const PARCA_GENISLIK = 1600
/**
 * Vision models shrink a picture above roughly a megapixel before reading it (≈ 1.15 MP / 1568 px long edge on one
 * provider, a 768 px short side on another), so a whole page loses resolution exactly where the scrawl needs it.
 */
export const MODEL_PIKSEL = 1_150_000
/**
 * Tallest tile (px at tile width). ESNEK-A-EVAL 2026-11-24 (GPT-6 Luna-Pro, the production reader): a provider that scales
 * a picture to a 768 px short side shrinks a 2-band tile of a phone photo; bands ≤ ~560 px tall reach the model at the
 * photo's own resolution (3–4 bands on a typical portrait page, the request cap allows 4).
 */
export const PARCA_YUKSEKLIK = 560

/**
 * Overlapping horizontal bands of the MASKED page, each at most ~1 MP at tile width — only when the page is larger than
 * what a model reads at full resolution. Never single lines: the reader keeps the context of whole paragraphs.
 */
export async function sayfaParcalari(maskeli: Rgba, tuval: TuvalAdaptoru): Promise<SayfaParcasi[]> {
  const genislik = Math.min(PARCA_GENISLIK, maskeli.w)
  const olcek = genislik / maskeli.w
  const toplam = genislik * maskeli.h * olcek
  if (toplam <= MODEL_PIKSEL) return []
  const pay = 0.04
  const yuk = maskeli.h * olcek
  // the smallest n whose bands (1/n of the page + both overlaps) stay within PARCA_YUKSEKLIK and ~1 MP, at most 4
  let n = 2
  while (n < 4 && (yuk * (1 / n + 2 * pay) > PARCA_YUKSEKLIK || genislik * yuk * (1 / n + 2 * pay) > 1_000_000)) n++
  const out: SayfaParcasi[] = []
  for (let i = 0; i < n; i++) {
    const y0 = Math.max(0, i / n - pay), y1 = Math.min(1, (i + 1) / n + pay)
    const k = kirp(maskeli, { x0: 0, y0, x1: 1, y1 }, olcek)
    out.push({ gorsel: { mime: 'image/jpeg', base64: await tuval.jpeg(k, 0.86) }, y0: Math.round(y0 * 1000) / 1000, y1: Math.round(y1 * 1000) / 1000 })
  }
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
  // no fingerprint match: a template with printed anchors (the registry forms, kayit.ts) is placed by the labels the OCR
  // read — the template is moved onto THIS photo (header band, drawings and their note areas in page coordinates)
  let kayitYontemi: 'iz' | 'capa' | null = sablon && skor >= SABLON_ESIK ? 'iz' : null
  if (!kayitYontemi) {
    let enIyi: { s: Sablon; k: NonNullable<ReturnType<typeof sablonKaydi>> } | null = null
    for (const s of g.sablonlar) {
      if (s.tur !== 'formlu' || !s.capalar?.length) continue
      const k = sablonKaydi(s, ocr, on.sayfa.w, on.sayfa.h)
      if (k && (!enIyi || k.capa > enIyi.k.capa)) enIyi = { s, k }
    }
    if (enIyi) { sablon = sablonuYerlestir(enIyi.s, enIyi.k.donusum, enIyi.k.cizimDonusumu); skor = enIyi.k.skor; kayitYontemi = 'capa' }
  }
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
  // identity the regions above cannot see (handwriting is not read on the device, so by place): a patient's name written as
  // the heading of a plain sheet, and an identity entry running on past its box — found on the UNMASKED ink, painted below
  const murekkep = murekkepMaskesi(on.normal)
  {
    const elSatirlari = yerlesimBul(murekkep).satirlar
    if (karar.neden === 'serbest') karar.kutular.push(...serbestBaslikKutulari(elSatirlari))
    // an entry running on past a FORM's identity block (a template band, label rows, a region the user marked)
    else if (karar.kutular.length) karar.kutular.push(...tasmaKutulari(elSatirlari, karar.kutular))
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
  const renkli = renkliMurekkep(maskeli)
  const aktifSablon = sablon && skor >= SABLON_ESIK ? sablon : null
  const bolgeler = aktifSablon?.cizimBolgeleri || []
  const haric = [...karar.kutular, ...bolgeler.map((b) => b.kutu)]
  const yer = satirlariCikar(murekkep, haric)
  const satirlar: SatirPaketi[] = []
  for (const s of yer.satirlar) {
    if (maskeliMi(s.kutu, karar.kutular, 0.35)) continue
    if (basiliSatirMi(s.kutu, ocr, on.sayfa.w, on.sayfa.h)) continue
    // reader v2 reads the whole page: a device line travels as numbers only (box, word boxes, shape descriptors for the
    // doctor's handwriting memory) — it is where a Doğrula question's crop is cut from the masked page
    satirlar.push({
      no: s.no, kutu: s.kutu, kelimeler: s.kelimeler,
      tanimlar: s.kelimeler.map((k) => tanimlayici(maskeliNormal, k)),
      bolgeId: bolgeler.length ? bolgeyeBagla(s.kutu, bolgeler, yer.cizgiler) : null,
    })
  }
  const bolgePaketleri = []
  for (const b of bolgeler) {
    const pay = 0.03
    // the drawing together with the area where the physician writes about it
    const d = b.notKutusu ? { x0: Math.min(b.kutu.x0, b.notKutusu.x0), y0: Math.min(b.kutu.y0, b.notKutusu.y0), x1: Math.max(b.kutu.x1, b.notKutusu.x1), y1: Math.max(b.kutu.y1, b.notKutusu.y1) } : b.kutu
    const k = { x0: Math.max(0, d.x0 - pay), y0: Math.max(0, d.y0 - pay), x1: Math.min(1, d.x1 + pay), y1: Math.min(1, d.y1 + pay) }
    const ink = bolgeMurekkebi(renkli, b.kutu)
    const kr = kirp(maskeli, k, Math.min(2, 520 / Math.max(1, (k.x1 - k.x0) * maskeli.w)))
    bolgePaketleri.push({ ...b, murekkep: ink, gorsel: { mime: 'image/jpeg', base64: await g.tuval.jpeg(kr, 0.82) } })
  }
  const sayfaGorseli = kucult(maskeli, SAYFA_KENAR)
  const parcalar = await sayfaParcalari(maskeli, g.tuval)
  return {
    durum: 'hazir',
    paket: { sayfa: g.sayfa, sablonId: aktifSablon?.id ?? null, kalite: on.kalite, satirlar, bolgeler: bolgePaketleri, parcalar, gizlilikKutulari: karar.kutular, serbest: karar.kutular.length === 0 && Boolean(serbest) },
    maskeliSayfa: { mime: 'image/jpeg', base64: await g.tuval.jpeg(sayfaGorseli, 0.82), w: sayfaGorseli.w, h: sayfaGorseli.h },
    gizlilik: karar, sablon: aktifSablon, sablonSkoru: skor, parmakIzi: izi, enBoy, yontem: yer.yontem, sablonYontemi: aktifSablon ? kayitYontemi : null,
  }
}

/** Shared size guard (the request body cap is 4.5 MB on the host). */
export const PAKET_AZAMI_KARAKTER = 4_000_000
export function paketBoyutu(p: SayfaPaketi, sayfa: GorselBlok): number {
  return sayfa.base64.length + (p.parcalar || []).reduce((t, x) => t + x.gorsel.base64.length, 0) + p.bolgeler.reduce((t, b) => t + (b.gorsel?.base64.length || 0), 0)
}
