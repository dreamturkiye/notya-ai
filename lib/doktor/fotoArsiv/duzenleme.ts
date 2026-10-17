/**
 * FOTO-ARSIV-01 — non-destructive edit model of one clinical photo.
 *
 * The original bytes in the encrypted vault are NEVER modified. Everything below is a small parameter document that
 * travels with the photo (hasta_foto_meta.ozel_encrypted): adjustments (brightness, contrast, exposure, white balance,
 * saturation, rotate, crop) and vector annotations (arrow, circle, freehand, text, measurement, scale calibration).
 * Annotation coordinates are normalised (0..1) to the ORIGINAL image, so rotating or cropping later never moves them.
 *
 * Pure + client-safe: the viewer, the PDF report and the server validator all use this file.
 */
import { etiketleriTemizle } from './bolgeler'

// ─── Adjustments ─────────────────────────────────────────────────────────────────────────────────────────
export type Donus = 0 | 90 | 180 | 270

export interface Kirpma { x: number; y: number; w: number; h: number }

export interface Ayarlar {
  /** -100..100 */
  parlaklik: number
  /** -100..100 */
  kontrast: number
  /** -100..100  (maps to ±2 EV) */
  pozlama: number
  /** -100..100  (negative = cooler/bluer, positive = warmer) */
  sicaklik: number
  /** -100..100 */
  doygunluk: number
  dondur: Donus
  /** Crop rectangle in the ORIGINAL image's normalised space; null = full frame. */
  kirp: Kirpma | null
}

export const VARSAYILAN_AYARLAR: Readonly<Ayarlar> = Object.freeze({
  parlaklik: 0, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: 0, dondur: 0 as Donus, kirp: null,
})

export function varsayilanAyarlar(): Ayarlar {
  return { ...VARSAYILAN_AYARLAR }
}

const sayi = (x: unknown, alt: number, ust: number, varsayilan = 0): number => {
  const n = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(n)) return varsayilan
  return Math.min(ust, Math.max(alt, n))
}
const tam = (x: unknown, alt: number, ust: number): number => Math.round(sayi(x, alt, ust))

export const MIN_KIRPMA = 0.05

export function kirpmaDogrula(x: unknown): Kirpma | null {
  if (!x || typeof x !== 'object') return null
  const k = x as Record<string, unknown>
  const px = sayi(k.x, 0, 1), py = sayi(k.y, 0, 1)
  const pw = sayi(k.w, 0, 1), ph = sayi(k.h, 0, 1)
  const w = Math.min(pw, 1 - px), h = Math.min(ph, 1 - py)
  if (w < MIN_KIRPMA || h < MIN_KIRPMA) return null
  // A crop that is (practically) the full frame is no crop.
  if (px < 0.002 && py < 0.002 && w > 0.996 && h > 0.996) return null
  const yuvarla = (n: number) => Math.round(n * 10000) / 10000
  return { x: yuvarla(px), y: yuvarla(py), w: yuvarla(w), h: yuvarla(h) }
}

export function ayarlariDogrula(x: unknown): Ayarlar {
  const k = x && typeof x === 'object' ? (x as Record<string, unknown>) : {}
  const d = Number(k.dondur)
  const dondur: Donus = d === 90 || d === 180 || d === 270 ? d : 0
  return {
    parlaklik: tam(k.parlaklik, -100, 100),
    kontrast: tam(k.kontrast, -100, 100),
    pozlama: tam(k.pozlama, -100, 100),
    sicaklik: tam(k.sicaklik, -100, 100),
    doygunluk: tam(k.doygunluk, -100, 100),
    dondur,
    kirp: kirpmaDogrula(k.kirp),
  }
}

/** true when ANY adjustment differs from the untouched original ("Orijinale dön" is meaningful). */
export function ayarDegistiMi(a: Ayarlar): boolean {
  return a.parlaklik !== 0 || a.kontrast !== 0 || a.pozlama !== 0 || a.sicaklik !== 0 || a.doygunluk !== 0 || a.dondur !== 0 || a.kirp !== null
}

/** Only the tone/colour part (what the pixel pipeline needs). */
export function tonDegistiMi(a: Ayarlar): boolean {
  return a.parlaklik !== 0 || a.kontrast !== 0 || a.pozlama !== 0 || a.sicaklik !== 0 || a.doygunluk !== 0
}

// ─── Geometry: original-normalised space <-> rotated/cropped view space ──────────────────────────────────────
export interface Nokta { x: number; y: number }

/** Size (in source pixels) of the output frame after crop then rotation. */
export function cikisBoyutu(w: number, h: number, a: Pick<Ayarlar, 'dondur' | 'kirp'>): { w: number; h: number } {
  const cw = w * (a.kirp ? a.kirp.w : 1), ch = h * (a.kirp ? a.kirp.h : 1)
  return a.dondur === 90 || a.dondur === 270 ? { w: ch, h: cw } : { w: cw, h: ch }
}

/** Original-normalised point -> view-normalised point (0..1 inside the rotated, cropped frame). May fall outside 0..1 when cropped away. */
export function kaynaktanGorunume(p: Nokta, a: Pick<Ayarlar, 'dondur' | 'kirp'>): Nokta {
  const k = a.kirp
  const qx = k ? (p.x - k.x) / k.w : p.x
  const qy = k ? (p.y - k.y) / k.h : p.y
  switch (a.dondur) {
    case 90: return { x: 1 - qy, y: qx }
    case 180: return { x: 1 - qx, y: 1 - qy }
    case 270: return { x: qy, y: 1 - qx }
    default: return { x: qx, y: qy }
  }
}

/** Inverse of kaynaktanGorunume: where did a tap on the view land on the ORIGINAL image? */
export function gorunumdenKaynaga(p: Nokta, a: Pick<Ayarlar, 'dondur' | 'kirp'>): Nokta {
  let qx: number, qy: number
  switch (a.dondur) {
    case 90: qx = p.y; qy = 1 - p.x; break
    case 180: qx = 1 - p.x; qy = 1 - p.y; break
    case 270: qx = 1 - p.y; qy = p.x; break
    default: qx = p.x; qy = p.y
  }
  const k = a.kirp
  return k ? { x: k.x + qx * k.w, y: k.y + qy * k.h } : { x: qx, y: qy }
}

// ─── Annotations ─────────────────────────────────────────────────────────────────────────────────────────
export const NOTASYON_RENKLERI = ['kirmizi', 'sari', 'mavi', 'yesil', 'beyaz'] as const
export type NotasyonRengi = (typeof NOTASYON_RENKLERI)[number]
export const NOTASYON_RENK_KODU: Record<NotasyonRengi, string> = {
  kirmizi: '#e5484d', sari: '#f5c542', mavi: '#3b82f6', yesil: '#22a06b', beyaz: '#ffffff',
}

export type Notasyon =
  | { id: string; t: 'ok'; a: Nokta; b: Nokta; renk: NotasyonRengi }
  | { id: string; t: 'daire'; a: Nokta; b: Nokta; renk: NotasyonRengi }
  | { id: string; t: 'serbest'; noktalar: Nokta[]; renk: NotasyonRengi }
  | { id: string; t: 'metin'; p: Nokta; metin: string; renk: NotasyonRengi }
  | { id: string; t: 'olcum'; a: Nokta; b: Nokta; renk: NotasyonRengi }
  /** Scale calibration: the line a..b is `mm` millimetres long in reality (a ruler, a coin). */
  | { id: string; t: 'olcek'; a: Nokta; b: Nokta; mm: number }

export const NOTASYON_AZAMI = 60
export const SERBEST_NOKTA_AZAMI = 300
export const METIN_AZAMI = 80

const nokta = (x: unknown): Nokta | null => {
  if (!x || typeof x !== 'object') return null
  const n = x as Record<string, unknown>
  const px = Number(n.x), py = Number(n.y)
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null
  return { x: Math.round(Math.min(1, Math.max(0, px)) * 10000) / 10000, y: Math.round(Math.min(1, Math.max(0, py)) * 10000) / 10000 }
}
const renk = (x: unknown): NotasyonRengi => ((NOTASYON_RENKLERI as readonly string[]).includes(String(x)) ? (x as NotasyonRengi) : 'kirmizi')
const kimlik = (x: unknown, i: number): string => {
  const s = typeof x === 'string' ? x.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) : ''
  return s || `n${i + 1}`
}

export function notasyonlariDogrula(x: unknown): Notasyon[] {
  if (!Array.isArray(x)) return []
  const out: Notasyon[] = []
  const idler = new Set<string>()
  let olcekGoruldu = false
  for (let i = 0; i < x.length && out.length < NOTASYON_AZAMI; i++) {
    const n = x[i]
    if (!n || typeof n !== 'object') continue
    const r = n as Record<string, unknown>
    let id = kimlik(r.id, i)
    while (idler.has(id)) id = `${id}x`
    const a = nokta(r.a), b = nokta(r.b)
    switch (r.t) {
      case 'ok':
      case 'daire':
      case 'olcum':
        if (a && b) { idler.add(id); out.push({ id, t: r.t, a, b, renk: renk(r.renk) }) }
        break
      case 'olcek': {
        const mm = Number(r.mm)
        if (a && b && Number.isFinite(mm) && mm > 0 && mm <= 1000 && !olcekGoruldu) {
          olcekGoruldu = true
          idler.add(id)
          out.push({ id, t: 'olcek', a, b, mm: Math.round(mm * 100) / 100 })
        }
        break
      }
      case 'serbest': {
        if (!Array.isArray(r.noktalar)) break
        const pts = (r.noktalar as unknown[]).map(nokta).filter((p): p is Nokta => !!p).slice(0, SERBEST_NOKTA_AZAMI)
        if (pts.length >= 2) { idler.add(id); out.push({ id, t: 'serbest', noktalar: pts, renk: renk(r.renk) }) }
        break
      }
      case 'metin': {
        const p = nokta(r.p)
        const metin = typeof r.metin === 'string' ? Array.from(r.metin.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim()).slice(0, METIN_AZAMI).join('') : ''
        if (p && metin) { idler.add(id); out.push({ id, t: 'metin', p, metin, renk: renk(r.renk) }) }
        break
      }
      default:
    }
  }
  return out
}

// ─── Measurement ─────────────────────────────────────────────────────────────────────────────────────────
/** Length of a..b in SOURCE pixels (normalised coordinates are anisotropic, so w and h matter). */
export function pikselUzunlugu(a: Nokta, b: Nokta, w: number, h: number): number {
  return Math.hypot((b.x - a.x) * w, (b.y - a.y) * h)
}

/** Millimetres per source pixel from the calibration annotation, or null when the photo is not calibrated. */
export function mmPerPiksel(notasyonlar: Notasyon[], w: number, h: number): number | null {
  const o = notasyonlar.find((n): n is Extract<Notasyon, { t: 'olcek' }> => n.t === 'olcek')
  if (!o) return null
  const px = pikselUzunlugu(o.a, o.b, w, h)
  return px > 1 ? o.mm / px : null
}

export function olcumMm(a: Nokta, b: Nokta, w: number, h: number, mmPx: number): number {
  return pikselUzunlugu(a, b, w, h) * mmPx
}

/** "12,4 mm" below 10 cm, "1,2 cm" at and above. */
export function olcumMetni(mm: number): string {
  if (!Number.isFinite(mm) || mm < 0) return '—'
  if (mm >= 100) return `${(mm / 10).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} cm`
  return `${mm.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} mm`
}

/** Common reference objects offered for one-tap calibration. Diameters in mm. */
export const OLCEK_REFERANSLARI: readonly { id: string; etiket: string; mm: number }[] = [
  { id: 'cetvel-10', etiket: 'Cetvel 10 mm', mm: 10 },
  { id: 'cetvel-20', etiket: 'Cetvel 20 mm', mm: 20 },
  { id: 'cetvel-50', etiket: 'Cetvel 50 mm', mm: 50 },
  { id: 'bozuk-1tl', etiket: '1 TL (26,15 mm)', mm: 26.15 },
  { id: 'bozuk-50k', etiket: '50 kuruş (23 mm)', mm: 23 },
  { id: 'kredi-karti', etiket: 'Kart genişliği (85,6 mm)', mm: 85.6 },
]

// ─── The stored document ─────────────────────────────────────────────────────────────────────────────────
export const NOT_AZAMI = 2000

export interface FotoOzel {
  v: 1
  etiketler: string[]
  not: string
  ayarlar: Ayarlar
  notasyonlar: Notasyon[]
}

export function bosOzel(): FotoOzel {
  return { v: 1, etiketler: [], not: '', ayarlar: varsayilanAyarlar(), notasyonlar: [] }
}

export function ozelDogrula(x: unknown): FotoOzel {
  const k = x && typeof x === 'object' ? (x as Record<string, unknown>) : {}
  const not = typeof k.not === 'string' ? Array.from(k.not.replace(/\u0000/g, '')).slice(0, NOT_AZAMI).join('') : ''
  return { v: 1, etiketler: etiketleriTemizle(k.etiketler), not, ayarlar: ayarlariDogrula(k.ayarlar), notasyonlar: notasyonlariDogrula(k.notasyonlar) }
}
