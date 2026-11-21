/**
 * BUYUME-GRAFIK-V2 (Kaan, 2026-11-20) — pure helpers for the growth-curve cards (Büyüme Eğrileri tab, pediatri only):
 * the default age window for the child's age, readable age / value ticks, and the percentile trend of the child's own
 * measurements. No reference tables are imported here (client-safe, a few hundred bytes): the percentile of each
 * measurement is computed by the API (lib/clinical/buyumeEgrisi.ts, Neyzi) and arrives on the point.
 *
 * The trend is the statistical position of the measurements only — never a diagnosis; the doctor interprets.
 */

/** The seven reference lines; crossing them is what "major line" means in the crossing count (studio + chart). */
export const MAJOR_PERSENTILLER = [3, 10, 25, 50, 75, 90, 97] as const

/**
 * NOTYA-KADEMELI-01d: in the first months a large newborn settling toward the middle is physiological catch-down,
 * so a crossing that starts before this age is flagged with that caveat (same constant as the pediatri engine).
 */
export const KAYMA_BASLANGIC_AY = 6

/** Signed number of major lines between two percentiles (+ up, − down). */
export function cizgiGecisi(pOnce: number, pSonra: number): number {
  const alt = Math.min(pOnce, pSonra), ust = Math.max(pOnce, pSonra)
  const n = MAJOR_PERSENTILLER.filter((c) => c > alt && c < ust).length
  return pSonra >= pOnce ? n : -n
}

// ─── Age window ──────────────────────────────────────────────────────────────────────────────────────────

/** Windows the chart snaps to (months). */
export const YAS_PENCERELERI = [6, 12, 24, 36, 60, 120, 216] as const

export interface YasPenceresi {
  /** Upper bound of the default (zoomed) view, months. */
  varsayilanUst: number
  /** Upper bound of the full reference range, months. */
  tamUst: number
  /** True when the default view is narrower than the full range (the toggle is offered). */
  daraltilmis: boolean
}

/**
 * The smallest window that holds the child's current age and every measurement with a little room on the right
 * (≥ 1 month, ~20 % of the age, ≤ 12 months). A 2-month-old gets 0–6, a 10-month-old 0–12, a 20-month-old 0–24.
 * Never wider than the full range the reference curves were drawn to.
 */
export function yasPenceresi(mevcutYasAy: number | null | undefined, olcumAylari: number[], tamUst: number): YasPenceresi {
  const tam = Math.max(1, tamUst)
  const referans = Math.max(0, mevcutYasAy ?? 0, ...olcumAylari.filter((a) => Number.isFinite(a)))
  if (mevcutYasAy == null && !olcumAylari.length) return { varsayilanUst: tam, tamUst: tam, daraltilmis: false }
  const gerek = referans + Math.min(12, Math.max(1, referans * 0.2))
  const pencere = YAS_PENCERELERI.find((p) => p >= gerek) ?? tam
  const varsayilanUst = Math.min(tam, pencere)
  return { varsayilanUst, tamUst: tam, daraltilmis: varsayilanUst < tam - 0.01 }
}

export interface YasTiki { ay: number; etiket: string }

/**
 * Age ticks for a window [0, ust]: whole months up to 3 years (step 1 / 2 / 3 / 6), whole years beyond.
 * `birim` names the unit the labels are in, for the axis caption.
 */
export function yasTikleri(ust: number): { tikler: YasTiki[]; birim: 'ay' | 'yas' } {
  if (ust <= 36) {
    const adim = ust <= 6 ? 1 : ust <= 12 ? 2 : ust <= 24 ? 3 : 6
    const tikler: YasTiki[] = []
    for (let a = 0; a <= ust + 1e-9; a += adim) tikler.push({ ay: a, etiket: String(a) })
    return { tikler, birim: 'ay' }
  }
  const adimYil = ust <= 120 ? 1 : 2
  const tikler: YasTiki[] = []
  for (let y = 0; y * 12 <= ust + 1e-9; y += adimYil) tikler.push({ ay: y * 12, etiket: String(y) })
  return { tikler, birim: 'yas' }
}

/** 3–6 round value ticks covering [min, max] (steps 1 / 2 / 2.5 / 5 × 10^k). */
export function degerTikleri(min: number, max: number, hedef = 4): { tikler: number[]; altSinir: number; ustSinir: number } {
  if (!(max > min)) { const v = Number.isFinite(min) ? min : 0; return { tikler: [v], altSinir: v - 1, ustSinir: v + 1 } }
  const kaba = (max - min) / Math.max(1, hedef)
  const us = Math.pow(10, Math.floor(Math.log10(kaba)))
  // The round step nearest to the rough one (log distance), so the tick count stays close to `hedef`.
  const adim = [1, 2, 2.5, 5, 10].map((k) => k * us).reduce((a, b) => (Math.abs(Math.log(b / kaba)) < Math.abs(Math.log(a / kaba)) ? b : a))
  const altSinir = Math.floor(min / adim + 1e-9) * adim
  const ustSinir = Math.ceil(max / adim - 1e-9) * adim
  const tikler: number[] = []
  for (let v = altSinir; v <= ustSinir + adim * 1e-6; v += adim) tikler.push(Math.round(v * 1000) / 1000)
  return { tikler, altSinir, ustSinir }
}

// ─── Percentile trend ────────────────────────────────────────────────────────────────────────────────────

export interface EgilimNoktasi { ay: number; persentil?: number | null }

export type PersentilEgilimi =
  | { tur: 'yok' }
  | { tur: 'kanal'; pIlk: number; pSon: number }
  | { tur: 'kayma'; yon: 'yukari' | 'asagi'; cizgi: number; pOnce: number; pSon: number; onceAy: number; erken: boolean }

/**
 * Trend of the child's own measurements (≥ 2 with a percentile). The latest point is compared with every earlier
 * one; if it sits ≥ 2 major lines away from any of them the largest such crossing is returned (flag). Otherwise the
 * child is tracking a channel.
 * NOTYA-KADEMELI-01d: once there are ≥ 2 points from KAYMA_BASLANGIC_AY on, only those are compared — a birth value
 * is history, never the start of a drift. Before that, all points count and a crossing that starts in the first
 * months carries `erken` (may be physiological catch-up / catch-down).
 */
export function persentilEgilimi(noktalar: EgilimNoktasi[], esik = 2): PersentilEgilimi {
  const tum = noktalar
    .filter((n): n is { ay: number; persentil: number } => typeof n.persentil === 'number' && Number.isFinite(n.persentil))
    .slice()
    .sort((a, b) => a.ay - b.ay)
  const gec = tum.filter((n) => n.ay >= KAYMA_BASLANGIC_AY)
  const s = gec.length >= 2 ? gec : tum
  if (s.length < 2) return { tur: 'yok' }
  const son = s[s.length - 1]
  let en: { cizgi: number; onceki: { ay: number; persentil: number } } | null = null
  for (const o of s.slice(0, -1)) {
    const c = cizgiGecisi(o.persentil, son.persentil)
    if (Math.abs(c) >= esik && (!en || Math.abs(c) > Math.abs(en.cizgi))) en = { cizgi: c, onceki: o }
  }
  if (!en) return { tur: 'kanal', pIlk: s[0].persentil, pSon: son.persentil }
  return {
    tur: 'kayma', yon: en.cizgi < 0 ? 'asagi' : 'yukari', cizgi: Math.abs(en.cizgi),
    pOnce: en.onceki.persentil, pSon: son.persentil, onceAy: en.onceki.ay, erken: en.onceki.ay < KAYMA_BASLANGIC_AY,
  }
}

// ─── Turkish text (the chart's default words) ────────────────────────────────────────────────────────────

/** "52. persentil"; the extremes read "<1." / ">99." rather than a misleading 0 or 100. */
export function persentilEtiketi(p: number): string {
  if (p < 1) return '<1. persentil'
  if (p > 99) return '>99. persentil'
  return `${Math.round(p)}. persentil`
}

/** Short form for tight spots: "52.", "<1.", ">99.". */
export function persentilKisaEtiket(p: number): string {
  if (p < 1) return '<1.'
  if (p > 99) return '>99.'
  return `${Math.round(p)}.`
}

/** Outside the 3–97 band (drawn as the outer band). */
export function bantDisiMi(p: number): boolean {
  return p < 3 || p > 97
}

/** Turkish decimal comma, at most `basamak` decimals ("5,1", "3,25", "57"). */
export function sayiTR(v: number, basamak = 1): string {
  return v.toLocaleString('tr-TR', { maximumFractionDigits: basamak, minimumFractionDigits: 0 })
}

/** Value with unit, precision by unit: kg two decimals under 10 kg, else one. */
export function degerMetni(v: number, birim: string): string {
  const basamak = birim === 'kg' && v < 10 ? 2 : 1
  return `${sayiTR(v, basamak)} ${birim}`
}

/** "Doğum", "15 günlük", "1 ay 29 günlük" (under 6 months), "4 aylık", "2 yaş 3 aylık" — age at a measurement. */
export function yasMetni(ay: number): string {
  if (ay < 0.25) return 'Doğum'
  if (ay < 1) return `${Math.max(1, Math.round(ay * 30.44))} günlük`
  let tam = Math.floor(ay + 1e-6)
  let gun = Math.round((ay - tam) * 30.44)
  if (gun >= 30) { tam += 1; gun = 0 }
  if (ay < 6) return gun >= 3 ? `${tam} ay ${gun} günlük` : `${tam} aylık`
  if (ay < 24) return `${tam} aylık`
  const yil = Math.floor(ay / 12), kalan = Math.floor(ay % 12)
  return kalan > 0 ? `${yil} yaş ${kalan} aylık` : `${yil} yaşında`
}

/** One-line trend note for the card; null when there is nothing to say (< 2 points with a percentile). */
export function egilimMetni(e: PersentilEgilimi): { metin: string; uyari: boolean } | null {
  if (e.tur === 'yok') return null
  if (e.tur === 'kanal') return { metin: 'Persentil kanalında ilerliyor', uyari: false }
  const yon = e.yon === 'asagi' ? 'aşağı' : 'yukarı'
  const ek = e.erken ? ' · ilk aylarda fizyolojik olabilir' : ''
  return { metin: `${e.cizgi} ana persentil çizgisi ${yon} (${persentilKisaEtiket(e.pOnce)} → ${persentilKisaEtiket(e.pSon)})${ek}`, uyari: true }
}
