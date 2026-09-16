/**
 * NOTYA-LAB-01 — Trend engine. All arithmetic lives here; the model only writes prose around these numbers.
 *  - flag: printed ref range only (H/L/normal); printed flag respected; no ref → 'unknown'. Never invented.
 *  - prior: THIS patient's prior APPROVED rows for the same canonical key (last 3–10), converted to canonical unit.
 *  - Δ / % / trend: rising | falling | stable | new_abn | new_normal | unit_mismatch | no_prior
 *  - critical: rule from kanonik.ts, computed before the model runs.
 *  - reconciliation: structural pass (CSV/XLSX/PDF text) vs vision pass, cell by cell → 'dogrulanacak' when they disagree.
 */
import { KANONIK, kanonikBirimeCevir, kanonikBul, kanonikTr, kritikMi, type KanonikAnahtar } from './kanonik'

export type HamSatir = { raw_name: string; value: string; unit: string | null; ref_low: string | null; ref_high: string | null; flag_printed: string | null; page: number | null; kaynak?: 'yapi' | 'gorsel' }

export type Bayrak = 'H' | 'L' | 'critical' | 'normal' | 'unknown'
export type Trend = 'rising' | 'falling' | 'stable' | 'new_abn' | 'new_normal' | 'unit_mismatch' | 'no_prior'

export type LabSatir = {
  raw_name: string
  canonical_key: KanonikAnahtar | null
  loinc: string | null
  value_num: number | null
  value_text: string | null
  unit: string | null
  /** value converted to canonical unit (null when not numeric or not convertible) */
  kanonik_deger: number | null
  kanonik_birim: string | null
  ref_low: number | null
  ref_high: number | null
  flag: Bayrak
  kritik: boolean
  kritik_neden: string | null
  prior_value: number | null
  prior_date: string | null
  prior_series: { tarih: string; deger: number }[]
  delta: number | null
  delta_pct: number | null
  trend: Trend
  page: number | null
  dogrulanacak: boolean       // extraction passes disagreed
  dogrulama_notu: string | null
  doctor_corrected: boolean
}

/** "12,5" → 12.5; "<0,01" → 0.01 with text kept; "Negatif" → null num. */
export function sayiCoz(v: string | null | undefined): { num: number | null; text: string | null } {
  if (v == null) return { num: null, text: null }
  const s = String(v).trim()
  if (!s) return { num: null, text: null }
  const m = s.replace(/\s/g, '').match(/^([<>]=?)?([-+]?\d+(?:[.,]\d+)?)$/)
  if (!m) return { num: null, text: s }
  const n = parseFloat(m[2].replace(',', '.'))
  return Number.isFinite(n) ? { num: n, text: m[1] ? s : null } : { num: null, text: s }
}

export function bayrakHesapla(deger: number | null, refLow: number | null, refHigh: number | null, printed: string | null): Bayrak {
  const p = (printed || '').trim().toUpperCase()
  if (/^(H|HH|↑|YÜKSEK|HIGH)$/.test(p)) return 'H'
  if (/^(L|LL|↓|DÜŞÜK|LOW)$/.test(p)) return 'L'
  if (deger == null) return 'unknown'
  if (refLow == null && refHigh == null) return /^(N|NORMAL)$/.test(p) ? 'normal' : 'unknown'
  if (refLow != null && deger < refLow) return 'L'
  if (refHigh != null && deger > refHigh) return 'H'
  return 'normal'
}

const STABIL_PCT = 5

export function trendHesapla(now: number | null, flag: Bayrak, prior: { deger: number; flag?: Bayrak } | null, unitMismatch: boolean): { trend: Trend; delta: number | null; delta_pct: number | null } {
  if (unitMismatch) return { trend: 'unit_mismatch', delta: null, delta_pct: null }
  if (now == null || !prior) return { trend: 'no_prior', delta: null, delta_pct: null }
  const delta = Math.round((now - prior.deger) * 1000) / 1000
  const delta_pct = prior.deger !== 0 ? Math.round(((now - prior.deger) / Math.abs(prior.deger)) * 1000) / 10 : null
  const abnNow = flag === 'H' || flag === 'L' || flag === 'critical'
  const abnPrior = prior.flag === 'H' || prior.flag === 'L' || prior.flag === 'critical'
  if (abnNow && !abnPrior && prior.flag) return { trend: 'new_abn', delta, delta_pct }
  if (!abnNow && abnPrior) return { trend: 'new_normal', delta, delta_pct }
  if (delta_pct != null && Math.abs(delta_pct) <= STABIL_PCT) return { trend: 'stable', delta, delta_pct }
  return { trend: delta > 0 ? 'rising' : 'falling', delta, delta_pct }
}

export type OncekiSatir = { canonical_key: string; kanonik_deger: number | null; flag: Bayrak; numune_tarihi: string }

/** Build one LabSatir from a raw extracted row + this patient's prior approved rows. */
export function satirKur(ham: HamSatir, oncekiler: OncekiSatir[], doktorAliaslari?: Record<string, string>): LabSatir {
  const key = kanonikBul(ham.raw_name, doktorAliaslari)
  const { num, text } = sayiCoz(ham.value)
  const refLow = sayiCoz(ham.ref_low).num, refHigh = sayiCoz(ham.ref_high).num
  let kanonik_deger: number | null = null, kanonik_birim: string | null = null, unitMismatch = false
  if (key && num != null) {
    const c = kanonikBirimeCevir(key, num, ham.unit)
    if (c) { kanonik_deger = Math.round(c.deger * 1000) / 1000; kanonik_birim = c.birim } else unitMismatch = true
  }
  let flag = bayrakHesapla(num, refLow, refHigh, ham.flag_printed)
  const kr = key ? kritikMi(key, kanonik_deger, text ?? ham.value) : { kritik: false as const }
  if (kr.kritik) flag = 'critical'
  const priors = key ? oncekiler.filter((o) => o.canonical_key === key && o.kanonik_deger != null).sort((a, b) => b.numune_tarihi.localeCompare(a.numune_tarihi)).slice(0, 10) : []
  const prior = priors[0] ? { deger: priors[0].kanonik_deger as number, flag: priors[0].flag } : null
  const t = trendHesapla(kanonik_deger, flag, prior, unitMismatch && priors.length > 0)
  return {
    raw_name: ham.raw_name.trim(), canonical_key: key, loinc: key ? (KANONIK[key].loinc ?? null) : null,
    value_num: num, value_text: text ?? (num == null ? ham.value : null), unit: ham.unit,
    kanonik_deger, kanonik_birim, ref_low: refLow, ref_high: refHigh, flag,
    kritik: kr.kritik, kritik_neden: kr.kritik ? kr.neden || null : null,
    prior_value: prior?.deger ?? null, prior_date: priors[0]?.numune_tarihi ?? null,
    prior_series: priors.map((p) => ({ tarih: p.numune_tarihi, deger: p.kanonik_deger as number })).reverse(),
    delta: t.delta, delta_pct: t.delta_pct, trend: t.trend, page: ham.page, dogrulanacak: false, dogrulama_notu: null, doctor_corrected: false,
  }
}

/** Required Turkish trend sentence, templated from numbers (never free-written by the model). */
export function trendCumlesi(s: LabSatir): string | null {
  if (!s.canonical_key || s.value_num == null) return null
  const ad = kanonikTr(s.canonical_key), birim = s.unit || s.kanonik_birim || ''
  const ref = s.ref_low != null || s.ref_high != null ? ` (ref ${s.ref_low ?? '—'}–${s.ref_high ?? '—'})` : ''
  const simdi = `Bu son tahlilde ${ad} ${s.value_num} ${birim}${ref}.`
  if (s.trend === 'no_prior' || !s.prior_series.length) return `${simdi} İlk kayıtlı ${ad} değeri.`
  if (s.trend === 'unit_mismatch') return `${simdi} Önceki bakılar farklı birimde; karşılaştırma yapılmadı.`
  const tarihler = s.prior_series.map((p) => new Date(p.tarih).toLocaleDateString('tr-TR')).join(', ')
  const degerler = s.prior_series.map((p) => p.deger)
  const aralik = degerler.length > 1 ? `${Math.min(...degerler)}–${Math.max(...degerler)}` : String(degerler[0])
  const yon = s.trend === 'rising' ? ' — yükseliyor' : s.trend === 'falling' ? ' — düşüyor' : s.trend === 'stable' ? ' — stabil' : s.trend === 'new_abn' ? ' — yeni bozulan' : s.trend === 'new_normal' ? ' — normale dönmüş' : ''
  return `${simdi} Önceki bakılarda (${tarihler}) ${ad} ${aralik} ${s.kanonik_birim || birim} idi${yon}${s.delta_pct != null ? ` (Δ ${s.delta_pct > 0 ? '+' : ''}${s.delta_pct}%)` : ''}.`
}

/** Reconcile two extraction passes cell by cell. Rows are matched by canonical key, else by normalized raw name. */
export function uzlastir(yapi: HamSatir[], gorsel: HamSatir[]): { satirlar: HamSatir[]; uyusmazlik: { raw_name: string; alan: string; yapi: string | null; gorsel: string | null }[] } {
  const keyOf = (r: HamSatir) => kanonikBul(r.raw_name) || r.raw_name.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()
  const g = new Map(gorsel.map((r) => [keyOf(r), r]))
  const uyusmazlik: { raw_name: string; alan: string; yapi: string | null; gorsel: string | null }[] = []
  const out: HamSatir[] = []
  const seen = new Set<string>()
  const eq = (a: string | null, b: string | null) => { const x = sayiCoz(a), y = sayiCoz(b); if (x.num != null && y.num != null) return Math.abs(x.num - y.num) < 1e-9; return (a || '').trim().toLocaleLowerCase('tr-TR') === (b || '').trim().toLocaleLowerCase('tr-TR') }
  for (const r of yapi) {
    const k = keyOf(r); seen.add(k)
    const v = g.get(k)
    if (!v) { out.push({ ...r, kaynak: 'yapi' }); continue }
    let dis = false
    for (const alan of ['value', 'unit', 'ref_low', 'ref_high'] as const) if (!eq(r[alan], v[alan])) { dis = true; uyusmazlik.push({ raw_name: r.raw_name, alan, yapi: r[alan], gorsel: v[alan] }) }
    out.push({ ...r, kaynak: dis ? undefined : 'yapi' })
  }
  for (const v of gorsel) { const k = keyOf(v); if (!seen.has(k)) out.push({ ...v, kaynak: 'gorsel' }) }
  return { satirlar: out, uyusmazlik }
}

export function panelOzeti(satirlar: LabSatir[]): { toplam: number; yuksek: number; dusuk: number; kritik: number; dogrulanacak: number; eslesmeyen: number } {
  return {
    toplam: satirlar.length,
    yuksek: satirlar.filter((s) => s.flag === 'H').length,
    dusuk: satirlar.filter((s) => s.flag === 'L').length,
    kritik: satirlar.filter((s) => s.kritik).length,
    dogrulanacak: satirlar.filter((s) => s.dogrulanacak).length,
    eslesmeyen: satirlar.filter((s) => !s.canonical_key).length,
  }
}

/**
 * NOTYA-LAB-04 — specialty computed lines. Arithmetic only; the writer must quote them verbatim.
 *  - Kre slope (nefroloji/dahiliye/uroloji/onkoloji): ≥2 priors → mg/dL per month over the series incl. current
 *  - Δ HbA1c (endokrin/aile/dahiliye/goz): prior HbA1c → absolute Δ in %-points
 *  - serial troponin (kardiyoloji/acil): all values with dates, rising/falling
 *  - Δ Hb / Δ Plt (hematoloji/onkoloji): vs last approved
 */
export function ozelHesaplar(satirlar: LabSatir[], bransKey: string): string[] {
  const out: string[] = []
  const bul = (k: string) => satirlar.find((s) => s.canonical_key === k)
  const ay = (a: string, b: string) => Math.max(1 / 30, (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  if (['nefroloji', 'dahiliye', 'uroloji', 'onkoloji', 'aile'].includes(bransKey)) {
    const k = bul('Kre')
    if (k && k.kanonik_deger != null && k.prior_series.length >= 2) {
      const first = k.prior_series[0]
      const months = ay(first.tarih, new Date().toISOString())
      const slope = Math.round(((k.kanonik_deger - first.deger) / months) * 1000) / 1000
      out.push(`Kreatinin eğimi: ${k.prior_series.length + 1} ölçümde ${first.deger} → ${k.kanonik_deger} mg/dL (${slope > 0 ? '+' : ''}${slope} mg/dL/ay, ${Math.round(months)} ay).`)
    }
  }
  if (['endokrinoloji', 'aile', 'dahiliye', 'goz'].includes(bransKey)) {
    const h = bul('HbA1c')
    if (h && h.kanonik_deger != null && h.prior_value != null) out.push(`Δ HbA1c: ${h.prior_value}% (${h.prior_date ? new Date(h.prior_date).toLocaleDateString('tr-TR') : 'önceki'}) → ${h.kanonik_deger}% (${h.kanonik_deger - h.prior_value > 0 ? '+' : ''}${Math.round((h.kanonik_deger - h.prior_value) * 10) / 10} puan).`)
  }
  if (['kardiyoloji', 'acil'].includes(bransKey)) {
    const tr = bul('Troponin')
    if (tr && tr.kanonik_deger != null && tr.prior_series.length >= 1) {
      const seri = [...tr.prior_series.map((p) => `${p.deger} (${new Date(p.tarih).toLocaleDateString('tr-TR')})`), `${tr.kanonik_deger} (bu panel)`]
      out.push(`Seri troponin: ${seri.join(' → ')} ${tr.kanonik_birim || ''} — ${tr.trend === 'rising' || tr.trend === 'new_abn' ? 'yükseliyor' : tr.trend === 'falling' || tr.trend === 'new_normal' ? 'düşüyor' : 'stabil'}.`)
    }
  }
  if (['hematoloji', 'onkoloji'].includes(bransKey)) {
    for (const key of ['Hb', 'Plt', 'Neu'] as const) {
      const s = bul(key)
      if (s && s.kanonik_deger != null && s.prior_value != null) out.push(`Δ ${kanonikTr(key)}: ${s.prior_value} → ${s.kanonik_deger} ${s.kanonik_birim || ''} (${s.delta_pct != null ? (s.delta_pct > 0 ? '+' : '') + s.delta_pct + '%' : ''}).`)
    }
  }
  return out
}
