/**
 * GOZ-EXCEPTIONAL-01 — Katarakt: biyometri kaydı (hekim girer) + post-op 1. gün / 1. hafta mini kartı. Pure.
 * GİL GÜCÜ HESAPLANMAZ — hiçbir formül (SRK/T, Barrett, Haigis…) yok; biyometri yalnız saklanır ve metne yazılır.
 * Aralık kontrolleri yazım hatası yakalamak içindir (fizyolojik olabilirlik), klinik eşik değildir.
 */
import type { Dipnot } from '../protocols/sources'

export interface Biyometri {
  alMm: number | null
  k1D: number | null
  k2D: number | null
  kAks: number | null
  aSabiti: number | null
  cihaz: string | null
  tarih: string | null
}

const AKLIK: Array<[keyof Biyometri, string, number, number]> = [
  ['alMm', 'Aksiyel uzunluk (mm)', 15, 40],
  ['k1D', 'K1 (D)', 30, 60],
  ['k2D', 'K2 (D)', 30, 60],
  ['kAks', 'K aksı (°)', 0, 180],
  ['aSabiti', 'A-sabiti', 110, 125],
]

const sayi = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(String(v).replace(',', '.'))) ? Number(String(v).replace(',', '.')) : NaN)

/** Serbest girdiden biyometri: sayı değilse / aralık dışıysa hata döner (kaydetmez). */
export function biyometriNormalize(g: Record<string, unknown> | null | undefined): { biyometri: Biyometri; hatalar: string[] } {
  const hatalar: string[] = []
  const b: Biyometri = { alMm: null, k1D: null, k2D: null, kAks: null, aSabiti: null, cihaz: null, tarih: null }
  for (const [k, ad, alt, ust] of AKLIK) {
    const v = sayi(g?.[k])
    if (v == null) continue
    if (Number.isNaN(v)) { hatalar.push(`${ad} sayı değil`); continue }
    if (v < alt || v > ust) { hatalar.push(`${ad} ${v} olağan ölçüm aralığı (${alt}–${ust}) dışında — yazımı kontrol edin`); continue }
    ;(b as unknown as Record<string, number>)[k] = v
  }
  b.cihaz = g?.cihaz ? String(g.cihaz).trim().slice(0, 80) || null : null
  b.tarih = typeof g?.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.tarih) ? g.tarih : null
  return { biyometri: b, hatalar }
}

export function biyometriTamMi(b: Biyometri | null | undefined): boolean {
  return !!b && b.alMm != null && b.k1D != null && b.k2D != null && b.aSabiti != null
}

const v1 = (n: number | null, b = 2) => (n == null ? '—' : String(Math.round(n * 10 ** b) / 10 ** b).replace('.', ','))

/** Nota / rapor satırı — yalnız ölçülen değerler; GİL gücü yazılmaz. */
export function biyometriMetni(b: Biyometri | null | undefined, gozAd: string): string {
  if (!b || (b.alMm == null && b.k1D == null && b.k2D == null)) return `${gozAd} biyometri: kayıt yok`
  const k = b.kAks != null ? ` @ ${v1(b.kAks, 0)}°` : ''
  return `${gozAd} biyometri${b.tarih ? ` (${b.tarih}${b.cihaz ? `, ${b.cihaz}` : ''})` : b.cihaz ? ` (${b.cihaz})` : ''}: AL ${v1(b.alMm)} mm, K1 ${v1(b.k1D)} D, K2 ${v1(b.k2D)} D${k}, A-sabiti ${v1(b.aSabiti, 1)}. GİL tipi ve gücü hekim tarafından seçilir.`
}

// ---------- Post-op mini kart ----------
export type PostopZaman = 'gun1' | 'hafta1'
export interface PostopKayit { tarih: string | null; va: string | null; gib: number | null; kornea: string | null; endoftalmiBayrak: boolean; not: string | null }
export const POSTOP_AD: Record<PostopZaman, string> = { gun1: 'Post-op 1. gün', hafta1: 'Post-op 1. hafta' }

export function postopNormalize(g: Record<string, unknown> | null | undefined): PostopKayit {
  const gib = sayi(g?.gib)
  return {
    tarih: typeof g?.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.tarih) ? g.tarih : null,
    va: g?.va ? String(g.va).trim().slice(0, 20) || null : null,
    gib: gib == null || Number.isNaN(gib) || gib < 0 || gib > 90 ? null : gib,
    kornea: g?.kornea ? String(g.kornea).trim().slice(0, 120) || null : null,
    endoftalmiBayrak: g?.endoftalmiBayrak === true,
    not: g?.not ? String(g.not).trim().slice(0, 240) || null : null,
  }
}

/** Hekimin işaretlediği bayrağı acil diline çevirir; eşik/sayı üretmez. */
export function postopUyarilari(p: Partial<Record<PostopZaman, PostopKayit | null>>): { acil: string[]; dipnotlar: Dipnot[] } {
  const acil: string[] = []
  for (const z of ['gun1', 'hafta1'] as const) {
    if (p[z]?.endoftalmiBayrak) acil.push(`${POSTOP_AD[z]}: hekim endoftalmi şüphesi işaretledi — aynı gün değerlendirme; beklemeden acil yönetim (tedavi kararı hekimin).`)
  }
  return { acil, dipnotlar: acil.length ? [{ ref: 'KANSKI', not: 'Post-op endoftalmi — acil yaklaşım ilkesi, ders kitabı derinliği; kurum protokolü hekim teyit eder' }] : [] }
}

export function postopMetni(z: PostopZaman, p: PostopKayit, gozAd: string): string {
  const parca = [p.va ? `VA ${p.va}` : null, p.gib != null ? `GİB ${p.gib} mmHg` : null, p.kornea ? `kornea ${p.kornea}` : null, p.endoftalmiBayrak ? 'ENDOFTALMİ ŞÜPHESİ (hekim)' : null, p.not].filter(Boolean)
  return `${gozAd} ${POSTOP_AD[z]}${p.tarih ? ` (${p.tarih})` : ''}: ${parca.join('; ') || 'kayıt yok'}.`
}
