/**
 * EV-VERISI-V2 — pure display helpers for the doctor's "Ev verisi" card (core: every branş; what is shown depends only on
 * what the patient logged). No data access: everything is derived from the card payload (lib/saglikEvi/evVerisi.ts).
 *  - one colour per measurement kind (consistent across the card), harmonious with the cream / pine look
 *  - the one-glance status sentence (calm / attention / urgent) at the top of the card
 *  - daily series over 28 days, the trend versus the previous 3 weeks, measurement days for the ring
 *  - a smooth (monotone cubic) SVG path that never overshoots the readings
 */
import type { EvVerisiKarti } from './evVerisi'
import { BAGLAM_ADI, OLCUM_TANIMLARI } from './olcumler'
import type { GlukozBaglami, OlcumTipi } from './tipler'
import { GUN_MS, trGun } from './zaman'
import { UYARI_RENK } from '@/lib/doktor/chromeRenk'

export type Metrik = EvVerisiKarti['metrikler'][number]
/** UYARI-RENKLERI: sakin = calm green; dikkat / bildir / acil = the clinical family (amber / coral / red); uyum = an
 *  adherence lapse (slate). */
export type Ton = 'sakin' | 'dikkat' | 'bildir' | 'acil' | 'uyum'

/** Ring colours match the patient's own Sağlığım rings (İlaç teal, Ölçüm sun) so both sides speak one language. */
export const HALKA_RENK = { ilac: '#0f9b8e', olcum: '#c08a2e' } as const
export const TON_RENK: Record<Ton, { ana: string; vurgu: string; yumusak: string }> = {
  sakin: { ana: '#2f6b4f', vurgu: '#2f6b4f', yumusak: 'rgba(47,107,79,0.08)' },
  dikkat: { ana: UYARI_RENK.dikkat.ana, vurgu: UYARI_RENK.dikkat.vurgu, yumusak: 'rgba(176,125,10,0.09)' },
  bildir: { ana: UYARI_RENK.hekime_bildir.ana, vurgu: UYARI_RENK.hekime_bildir.vurgu, yumusak: 'rgba(217,98,43,0.09)' },
  acil: { ana: UYARI_RENK.acil.ana, vurgu: UYARI_RENK.acil.vurgu, yumusak: 'rgba(200,40,31,0.10)' },
  uyum: { ana: UYARI_RENK.uyum.ana, vurgu: UYARI_RENK.uyum.vurgu, yumusak: 'rgba(110,118,153,0.10)' },
}
/** Ton of one alert on the doctor's card (adherence rules → uyum whatever their level). */
export function uyariTonuKart(u: { duzey: string; kural?: string | null }): Exclude<Ton, 'sakin'> {
  if (u.kural === 'kritik_ilac') return 'uyum'
  return u.duzey === 'acil' ? 'acil' : u.duzey === 'hekime_bildir' ? 'bildir' : 'dikkat'
}
/** Card ton → the shared palette key (UyariIsareti). */
export const TON_PALET: Record<Exclude<Ton, 'sakin'>, 'acil' | 'hekime_bildir' | 'dikkat' | 'uyum'> = { acil: 'acil', bildir: 'hekime_bildir', dikkat: 'dikkat', uyum: 'uyum' }
/** One colour per measurement kind; none of them is the ring teal / sun or the alert terracotta. */
export const METRIK_RENK: Record<OlcumTipi, string> = {
  glukoz: '#a2557a',
  kb: '#5f5ea8',
  nabiz: '#cc5f73',
  kilo: '#3d7ca6',
  spo2: '#2c8a9e',
  ates: '#c8742f',
  bel: '#6f8a3c',
  su: '#4a93c9',
}

export const metrikTipi = (anahtar: string) => anahtar.split(':')[0] as OlcumTipi
export const metrikRengi = (anahtar: string) => METRIK_RENK[metrikTipi(anahtar)] || '#6b5d50'

/** Plain clinical Turkish short name: "Tokluk şekeri", "Tansiyon", "Kilo". */
export function kisaAd(anahtar: string): string {
  const [tip, baglam] = anahtar.split(':') as [OlcumTipi, GlukozBaglami | undefined]
  if (tip === 'glukoz') return ({ aclik: 'Açlık şekeri', tokluk2: 'Tokluk şekeri', yatmadan: 'Yatmadan önce şeker', rastgele: 'Kan şekeri' } as Record<string, string>)[baglam || 'rastgele'] || `Kan şekeri · ${BAGLAM_ADI[baglam as GlukozBaglami] ?? ''}`
  if (tip === 'spo2') return 'Oksijen'
  return OLCUM_TANIMLARI[tip]?.ad ?? anahtar
}

/** Turkish number: decimal comma, the kind's own precision. */
export function sayi(x: number | null | undefined, ondalik = 0): string {
  if (x == null || !Number.isFinite(x)) return '—'
  return (Math.round(x * 10 ** ondalik) / 10 ** ondalik).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: ondalik })
}
const ondalikOf = (anahtar: string) => OLCUM_TANIMLARI[metrikTipi(anahtar)]?.ondalik ?? 0

/** The tile's hero value: the 7-day average (water: glasses per logged day), or the last reading when this week is empty. */
export function anaDeger(m: Metrik, simdiMs: number): { metin: string; aciklama: string; sayisal: number | null } {
  const od = ondalikOf(m.anahtar)
  if (metrikTipi(m.anahtar) === 'su') {
    const g = gunlukToplam(m, simdiMs, 7)
    if (g != null) return { metin: sayi(g, 0), aciklama: 'günlük ort., 7 gün', sayisal: g }
  }
  if (m.hafta.ort != null) {
    const metin = m.anahtar === 'kb' ? `${sayi(m.hafta.ort)}/${sayi(m.hafta.ort2)}` : sayi(m.hafta.ort, od)
    return { metin, aciklama: '7 günlük ortalama', sayisal: m.hafta.ort }
  }
  const son = m.noktalar[m.noktalar.length - 1]
  if (!son) return { metin: '—', aciklama: '', sayisal: null }
  const metin = m.anahtar === 'kb' ? `${sayi(son.deger)}/${sayi(son.deger2)}` : sayi(son.deger, od)
  return { metin, aciklama: `son ölçüm, ${new Date(son.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })}`, sayisal: son.deger }
}

function gunlukToplam(m: Metrik, simdiMs: number, gun: number): number | null {
  const sinir = simdiMs - gun * GUN_MS
  const top = new Map<string, number>()
  for (const n of m.noktalar) if (Date.parse(n.at) >= sinir) top.set(trGun(n.at), (top.get(trGun(n.at)) || 0) + n.deger)
  return top.size ? [...top.values()].reduce((a, b) => a + b, 0) / top.size : null
}

/** Change of the 7-day average versus the previous 3 weeks: "37 mg/dL artış" / "2 mg/dL düşüş" / "sabit" (< 2 % of the value). */
export function egilim(m: Metrik): { yon: -1 | 0 | 1; metin: string } | null {
  if (m.hafta.ort == null || m.onceki.ort == null || metrikTipi(m.anahtar) === 'su') return null
  const d = m.hafta.ort - m.onceki.ort
  const od = ondalikOf(m.anahtar)
  const yon: -1 | 0 | 1 = Math.abs(d) < Math.max(Math.abs(m.onceki.ort) * 0.02, 10 ** -od) ? 0 : d > 0 ? 1 : -1
  if (!yon) return { yon, metin: 'sabit' }
  const d2 = m.anahtar === 'kb' && m.hafta.ort2 != null && m.onceki.ort2 != null ? m.hafta.ort2 - m.onceki.ort2 : null
  const fark = d2 != null ? `${sayi(Math.abs(d))}/${sayi(Math.abs(d2))}` : sayi(Math.abs(d), od)
  return { yon, metin: `${fark} ${m.birim} ${yon > 0 ? 'artış' : 'düşüş'}` }
}

/** Is the 7-day average outside the target? (display tint only — the rules engine decides alerts) */
export function hedefDisi(m: Metrik): boolean {
  const o = m.hafta.ort
  if (o == null) return false
  if (m.hedefMax != null && o > m.hedefMax) return true
  if (m.hedefMin != null && o < m.hedefMin) return true
  return m.hedefMax2 != null && m.hafta.ort2 != null && m.hafta.ort2 > m.hedefMax2
}

/** UYARI-RENKLERI: the clinical level of one reading against the card's effective thresholds (display only). */
export function degerSeviyesi(m: Metrik, deger: number, deger2: number | null): 'acil' | 'hekime_bildir' | 'dikkat' | null {
  const e = m.esik || {}
  const ust = (a?: number, a2?: number) => (a != null && deger >= a) || (a2 != null && deger2 != null && deger2 >= a2)
  const alt = (a?: number) => a != null && deger < a
  if (ust(e.acilUst, e.acilUst2) || alt(e.acilAlt)) return 'acil'
  if (ust(e.bildirUst, e.bildirUst2) || alt(e.bildirAlt)) return 'hekime_bildir'
  if (ust(e.dikkatUst, e.dikkatUst2) || alt(e.dikkatAlt)) return 'dikkat'
  return null
}

export function degerHedefDisi(m: Metrik, deger: number, deger2: number | null): boolean {
  if (m.hedefMax != null && deger > m.hedefMax) return true
  if (m.hedefMin != null && deger < m.hedefMin) return true
  return m.hedefMax2 != null && deger2 != null && deger2 > m.hedefMax2
}

/** Daily means over the last `gun` days (oldest first); `x` is 0..1 across the window. */
export function gunlukSeri(m: Metrik, simdiMs: number, gun = 28): Array<{ x: number; y: number; y2: number | null; gun: string }> {
  const t0 = simdiMs - gun * GUN_MS
  const kova = new Map<string, { t: number; s: number; s2: number; n: number; n2: number }>()
  for (const n of m.noktalar) {
    const t = Date.parse(n.at)
    if (t < t0) continue
    const g = trGun(t)
    const k = kova.get(g) || { t: 0, s: 0, s2: 0, n: 0, n2: 0 }
    k.t += t; k.s += n.deger; k.n++
    if (n.deger2 != null) { k.s2 += n.deger2; k.n2++ }
    kova.set(g, k)
  }
  return [...kova.entries()]
    .map(([g, k]) => ({ x: Math.min(1, Math.max(0, (k.t / k.n - t0) / (gun * GUN_MS))), y: k.s / k.n, y2: k.n2 ? k.s2 / k.n2 : null, gun: g }))
    .sort((a, b) => a.x - b.x)
}

/** Days (of the last 7) with at least one reading — the Ölçüm ring. */
export function olcumGunleri(v: Pick<EvVerisiKarti, 'metrikler'>, simdiMs: number): number {
  const sinir = simdiMs - 7 * GUN_MS
  const g = new Set<string>()
  for (const m of v.metrikler) for (const n of m.noktalar) if (Date.parse(n.at) >= sinir) g.add(trGun(n.at))
  return Math.min(7, g.size)
}

/** Monotone cubic (Fritsch–Carlson) path through the points: smooth, never overshoots a reading. */
export function puruzsuzYol(p: Array<[number, number]>): string {
  if (!p.length) return ''
  if (p.length === 1) return `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  const n = p.length
  const dx: number[] = [], m: number[] = []
  for (let i = 0; i < n - 1; i++) { dx.push(p[i + 1][0] - p[i][0] || 1e-6); m.push((p[i + 1][1] - p[i][1]) / (dx[i])) }
  const t: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]))
  t.push(m[n - 2])
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${(p[i][0] + h).toFixed(1)} ${(p[i][1] + h * t[i]).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)} ${(p[i + 1][1] - h * t[i + 1]).toFixed(1)} ${p[i + 1][0].toFixed(1)} ${p[i + 1][1].toFixed(1)}`
  }
  return d
}

const DUZEY_SIRA: Record<string, number> = { acil: 0, hekime_bildir: 1, dikkat: 2 }
export const acikUyarilar = (v: Pick<EvVerisiKarti, 'uyarilar'>) =>
  v.uyarilar.filter((u) => !u.goruldu).sort((a, b) => (DUZEY_SIRA[a.duzey] ?? 3) - (DUZEY_SIRA[b.duzey] ?? 3) || b.tarih.localeCompare(a.tarih))

/** The metric an alert is about ('glukoz' alerts match the first glucose context the patient logs). */
export function uyariMetrigi(v: Pick<EvVerisiKarti, 'metrikler'>, metrik: string): Metrik | undefined {
  return v.metrikler.find((m) => m.anahtar === metrik) || v.metrikler.find((m) => metrikTipi(m.anahtar) === metrik)
}

/** Medicines not taken this week (doses due and not marked taken, skipped on purpose included). */
export function haftaninEksikDozlari(v: Pick<EvVerisiKarti, 'uyum'>): { toplam: number; ilaclar: string[] } {
  const ilaclar = v.uyum.ilaclar.filter((i) => i.hafta && i.hafta.beklenen > i.hafta.alinan)
  return { toplam: Math.max(0, v.uyum.hafta.beklenen - v.uyum.hafta.alinan), ilaclar: ilaclar.map((i) => i.ad) }
}

/**
 * The one-glance sentence: open alert first (most severe, newest), then low adherence, then a calm factual line.
 * Facts only — the doctor makes the clinical assessment.
 */
export function durumCumlesi(v: EvVerisiKarti, simdiMs: number): { ton: Ton; baslik: string; alt: string; metrik: string | null } {
  const acik = acikUyarilar(v)
  const daha = acik.length === 2 ? ' Bir uyarı daha var.' : acik.length > 2 ? ` ${acik.length - 1} uyarı daha var.` : ''
  if (acik.length) {
    const u = acik[0]
    const m = uyariMetrigi(v, u.metrik)
    const ton: Ton = uyariTonuKart(u)
    const ad = m ? kisaAd(m.anahtar) : kisaAd(u.metrik)
    const birim = m?.birim ?? OLCUM_TANIMLARI[metrikTipi(u.metrik)]?.birim ?? ''
    const od = ondalikOf(u.metrik)
    const ort = m ? anaDeger(m, simdiMs).metin : '—'
    const okunan = u.deger != null ? (u.deger2 != null ? `${sayi(u.deger)}/${sayi(u.deger2)}` : sayi(u.deger, od)) : null
    const once = m && m.onceki.ort != null ? (m.anahtar === 'kb' ? `${sayi(m.onceki.ort)}/${sayi(m.onceki.ort2)}` : sayi(m.onceki.ort, od)) : null
    const ret = (baslik: string, alt: string) => ({ ton, baslik, alt: (alt + daha).trim(), metrik: m?.anahtar ?? null })
    switch (u.kural) {
      case 'egilim_artis': return ret(`${ad} bu hafta yükseliyor — ort. ${ort} ${birim}`, once ? `Önceki 3 haftada ${once} ${birim} idi.` : '')
      case 'haftalik_yuksek': return ret(`${ad} bu hafta hedefin üstünde — ort. ${ort} ${birim}`, m?.hedefMax != null ? `Hedef ${sayi(m.hedefMax)}${m.hedefMax2 != null ? `/${sayi(m.hedefMax2)}` : ''} ${birim} altı.` : '')
      case 'kilo_artis': return ret(`Kilo son 3 günde arttı${okunan ? ` — ${okunan} kg` : ''}`, u.metin)
      case 'ates_3gun': return ret('Üç gündür ateş ölçülüyor', u.metin)
      case 'ates_bebek': return ret(`Bebekte ateş${okunan ? ` — ${okunan} °C` : ''}`, u.metin)
      case 'tekrar_dusuk_seker': return ret('Bu hafta tekrarlayan düşük şeker', u.metin)
      case 'kritik_ilac': return ret('Kritik ilaç iki gündür işaretlenmedi', u.metin)
      case 'cok_yuksek': case 'yuksek_bildir': case 'yuksek_dikkat': return ret(`${ad} yüksek ölçüldü${okunan ? ` — ${okunan} ${birim}` : ''}`, `${trTarihSaat(u.tarih)}.`)
      case 'cok_dusuk': case 'dusuk_bildir': case 'dusuk_dikkat': return ret(`${ad} düşük ölçüldü${okunan ? ` — ${okunan} ${birim}` : ''}`, `${trTarihSaat(u.tarih)}.`)
      default: return ret(u.metin, '')
    }
  }
  const toplamOlcum = v.metrikler.reduce((a, m) => a + m.hafta.n, 0)
  const uyumYuzde = v.uyum.hafta.yuzde
  if (!v.metrikler.length && !v.uyum.ilaclar.length) return { ton: 'sakin', baslik: 'Henüz ev verisi yok', alt: 'Hasta ölçüm girdiğinde ya da ilaçlarını işaretlediğinde burada görünür.', metrik: null }
  if (uyumYuzde != null && uyumYuzde < 70) return { ton: 'uyum', baslik: `İlaç uyumu bu hafta düşük — %${uyumYuzde}`, alt: `${v.uyum.hafta.beklenen - v.uyum.hafta.alinan} doz alınmadı.`, metrik: null }
  const parca = [toplamOlcum ? `Bu hafta ${toplamOlcum} ölçüm` : 'Bu hafta ölçüm girilmedi', uyumYuzde != null ? `ilaç uyumu %${uyumYuzde}` : null].filter(Boolean).join(', ')
  // Alerts already acknowledged with "Gördüm": say so plainly instead of claiming there is no trend.
  if (v.uyarilar.length) return { ton: 'sakin', baslik: 'Yeni uyarı yok', alt: `Son uyarıyı gördünüz (${trTarihSaat(v.uyarilar[0].tarih)}). ${parca}.`, metrik: null }
  return { ton: 'sakin', baslik: 'Son 7 günde dikkat gerektiren bir eğilim yok', alt: `${parca}.`, metrik: null }
}

export const trTarihSaat = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

/** "bugün 14:35" / "dün 21:10" / "21 Kas" — freshness of the newest reading. */
export function sonOlcumMetni(v: Pick<EvVerisiKarti, 'metrikler'>, simdiMs: number): string | null {
  let son = ''
  for (const m of v.metrikler) for (const n of m.noktalar) if (n.at > son) son = n.at
  if (!son) return null
  const g = trGun(son), bugun = trGun(simdiMs), dun = trGun(simdiMs - GUN_MS)
  const saat = new Date(son).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
  if (g === bugun) return `Son ölçüm bugün ${saat}`
  if (g === dun) return `Son ölçüm dün ${saat}`
  return `Son ölçüm ${new Date(son).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })}`
}

/** Tiles without a featured one: rows of at most 4, spread evenly (5 → 3 + 2, 7 → 4 + 3) on a 12-column grid. */
export function karoYayilimi(n: number): number[] {
  if (n <= 0) return []
  const satir = Math.ceil(n / 4)
  const out: number[] = []
  let kalan = n
  for (let r = 0; r < satir; r++) {
    const bu = Math.ceil(kalan / (satir - r))
    for (let i = 0; i < bu; i++) out.push(12 / bu)
    kalan -= bu
  }
  return out
}
