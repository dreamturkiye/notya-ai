/**
 * GOZ-EXCEPTIONAL-01 — muayene düzeyi yapılandırılmış bulgular (goz_muayeneler.ek + rapd). Pure.
 * Refraksiyon: hekimin ölçtüğü sph / cyl / aks — Notya gözlük reçetesi üretmez, değer türetmez (no invented Rx).
 * Biyomikroskopi OD/OS: kapak, konjonktiva, kornea, ön kamara, iris, lens — gözlem metni, tanı yok.
 * Keratokonus: topografi notu + Kmax (hekim) + CXL tarihi. RAPD: yok / sağ / sol.
 * Şerit → Objektif: VA + GİB + RAPD + son göz dibi satırı (hekim tek dokunuşla nota yazar).
 */
import { vaGoster, enIyiUzak, type VaSeti } from './va'
import { fundusMetni, type FundusKayit } from './fundus'

export type Taraf = 'sag' | 'sol'
export type Rapd = 'yok' | 'sag' | 'sol'
export const RAPD_AD: Record<Rapd, string> = { yok: 'RAPD yok', sag: 'RAPD sağ (OD)', sol: 'RAPD sol (OS)' }

// ---------- Refraksiyon ----------
export interface RefraksiyonGoz { sph: number | null; cyl: number | null; aks: number | null }
export interface Refraksiyon { sag: RefraksiyonGoz; sol: RefraksiyonGoz; yontem: string | null }

const sayi = (v: unknown) => (v == null || String(v).trim() === '' ? null : Number(String(v).replace(',', '.').replace(/^\+/, '')))

/** Yalnız biçim ve olası aralık denetimi (yazım hatası yakalar); çeyrek dioptri yuvarlaması yapılmaz, değer değişmez. */
export function refraksiyonNormalize(g: Record<string, unknown> | null | undefined): { refraksiyon: Refraksiyon | null; hatalar: string[] } {
  const hatalar: string[] = []
  const goz = (t: Taraf): RefraksiyonGoz => {
    const x = (g?.[t] || {}) as Record<string, unknown>
    const ad = t === 'sag' ? 'OD' : 'OS'
    const sph = sayi(x.sph), cyl = sayi(x.cyl), aks = sayi(x.aks)
    const out: RefraksiyonGoz = { sph: null, cyl: null, aks: null }
    if (sph != null) { if (!Number.isFinite(sph) || sph < -30 || sph > 30) hatalar.push(`${ad} sferik −30…+30 D aralığında olmalı`); else out.sph = sph }
    if (cyl != null) { if (!Number.isFinite(cyl) || cyl < -15 || cyl > 15) hatalar.push(`${ad} silindir −15…+15 D aralığında olmalı`); else out.cyl = cyl }
    if (aks != null) { if (!Number.isInteger(aks) || aks < 0 || aks > 180) hatalar.push(`${ad} aks 0–180° tam sayı olmalı`); else out.aks = aks }
    if (out.cyl != null && out.cyl !== 0 && out.aks == null) hatalar.push(`${ad} silindir girildiyse aks da girilmeli`)
    return out
  }
  const r: Refraksiyon = { sag: goz('sag'), sol: goz('sol'), yontem: g?.yontem ? String(g.yontem).slice(0, 40) : null }
  const bos = (x: RefraksiyonGoz) => x.sph == null && x.cyl == null && x.aks == null
  return { refraksiyon: bos(r.sag) && bos(r.sol) ? null : r, hatalar }
}

const dp = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2).replace('.', ',')}`
export function refraksiyonGozMetni(x: RefraksiyonGoz | undefined): string {
  if (!x || (x.sph == null && x.cyl == null)) return '—'
  return [x.sph != null ? `${dp(x.sph)} sph` : null, x.cyl != null && x.cyl !== 0 ? `${dp(x.cyl)} cyl × ${x.aks ?? '?'}°` : null].filter(Boolean).join(' ')
}
export function refraksiyonMetni(r: Refraksiyon | null | undefined): string | null {
  if (!r) return null
  return `Refraksiyon${r.yontem ? ` (${r.yontem})` : ''} — OD: ${refraksiyonGozMetni(r.sag)}; OS: ${refraksiyonGozMetni(r.sol)}.`
}

// ---------- Biyomikroskopi ----------
export const BIYO_ALANLAR = [['kapak', 'Kapak'], ['konjonktiva', 'Konjonktiva'], ['kornea', 'Kornea'], ['onKamara', 'Ön kamara'], ['iris', 'İris / pupil'], ['lens', 'Lens']] as const
export type BiyoAlan = (typeof BIYO_ALANLAR)[number][0]
export type BiyoGoz = Partial<Record<BiyoAlan, string | null>>
export interface Biyomikroskopi { sag: BiyoGoz; sol: BiyoGoz; floresein: boolean | null }

const temiz = (s: unknown) => String(s ?? '').trim().slice(0, 200) || null

export function biyoNormalize(g: Record<string, unknown> | null | undefined): Biyomikroskopi | null {
  const goz = (t: Taraf): BiyoGoz => Object.fromEntries(BIYO_ALANLAR.map(([k]) => [k, temiz(((g?.[t] || {}) as Record<string, unknown>)[k])])) as BiyoGoz
  const b: Biyomikroskopi = { sag: goz('sag'), sol: goz('sol'), floresein: g?.floresein === true ? true : g?.floresein === false ? false : null }
  const dolu = (x: BiyoGoz) => Object.values(x).some(Boolean)
  return dolu(b.sag) || dolu(b.sol) ? b : null
}

/** "Her iki göz doğal" kısayolu — hekim alanı düzenleyebilir. */
export function normalBiyoGoz(): BiyoGoz {
  return { kapak: 'doğal', konjonktiva: 'sakin', kornea: 'saydam', onKamara: 'derin, sakin', iris: 'doğal, pupil yuvarlak, ışık refleksi +', lens: 'saydam' }
}

export function biyoMetni(b: Biyomikroskopi | null | undefined): string | null {
  if (!b) return null
  const goz = (ad: string, x: BiyoGoz) => {
    const p = BIYO_ALANLAR.filter(([k]) => x[k]).map(([k, a]) => `${a.toLocaleLowerCase('tr-TR')} ${x[k]}`)
    return `${ad}: ${p.join('; ') || 'kaydedilmedi'}`
  }
  return `Biyomikroskopi${b.floresein ? ' (floresein boyalı)' : ''} — ${goz('OD', b.sag)}; ${goz('OS', b.sol)}.`
}

// ---------- Keratokonus ----------
export interface Keratokonus { goz: Taraf | 'iki' | null; topoNot: string | null; kmaxSag: number | null; kmaxSol: number | null; cxlSag: string | null; cxlSol: string | null }
const tarih = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
export function keratokonusNormalize(g: Record<string, unknown> | null | undefined): { keratokonus: Keratokonus | null; hatalar: string[] } {
  const hatalar: string[] = []
  const k = (v: unknown, ad: string) => { const n = sayi(v); if (n == null) return null; if (!Number.isFinite(n) || n < 35 || n > 90) { hatalar.push(`${ad} Kmax 35–90 D aralığında olmalı`); return null } return n }
  const r: Keratokonus = {
    goz: g?.goz === 'sag' || g?.goz === 'sol' || g?.goz === 'iki' ? g.goz : null,
    topoNot: temiz(g?.topoNot), kmaxSag: k(g?.kmaxSag, 'OD'), kmaxSol: k(g?.kmaxSol, 'OS'), cxlSag: tarih(g?.cxlSag), cxlSol: tarih(g?.cxlSol),
  }
  return { keratokonus: r.topoNot || r.kmaxSag != null || r.kmaxSol != null || r.cxlSag || r.cxlSol ? r : null, hatalar }
}
export function keratokonusMetni(k: Keratokonus | null | undefined): string | null {
  if (!k) return null
  const p = [k.topoNot ? `topografi: ${k.topoNot}` : null, k.kmaxSag != null ? `Kmax OD ${String(k.kmaxSag).replace('.', ',')} D` : null, k.kmaxSol != null ? `Kmax OS ${String(k.kmaxSol).replace('.', ',')} D` : null, k.cxlSag ? `CXL OD ${k.cxlSag}` : null, k.cxlSol ? `CXL OS ${k.cxlSol}` : null].filter(Boolean)
  return `Kornea / keratokonus izlemi (hekim) — ${p.join('; ')}.`
}

// ---------- Ölçüm satırı + şerit → Objektif ----------
export interface OlcumSatiri { tarih: string; va: { sag?: VaSeti; sol?: VaSeti } | null; gib_sag: number | null; gib_sol: number | null; gib_yontem: string | null; rapd: string | null; ek?: { refraksiyon?: Refraksiyon | null } | null }

const yontemAd = (y: string | null) => (y ? ` (${y === 'nct' ? 'NCT' : y === 'applanasyon' ? 'aplanasyon' : y === 'tonopen' ? 'Tono-Pen' : y === 'icare' ? 'iCare' : y})` : '')

/** "Nota ekle (O)" satırı: VA sc/cc/yakın + GİB + RAPD + refraksiyon (kaydedildiyse). */
export function olcumNotaMetni(m: OlcumSatiri): string {
  const va = (m.va || {}) as { sag?: VaSeti; sol?: VaSeti }
  const vaSatir = (t: Taraf) => { const s = va[t] || {}; return [s.uzak_sc ? `sc ${vaGoster(s.uzak_sc)}` : '', s.uzak_cc ? `cc ${vaGoster(s.uzak_cc)}` : '', s.yakin ? `yakın ${s.yakin}` : ''].filter(Boolean).join(', ') || '—' }
  const parca = [`Görme keskinliği — OD: ${vaSatir('sag')}; OS: ${vaSatir('sol')}.`, `GİB${yontemAd(m.gib_yontem)} — OD: ${m.gib_sag ?? '—'} mmHg; OS: ${m.gib_sol ?? '—'} mmHg.`]
  if (m.rapd && (m.rapd === 'yok' || m.rapd === 'sag' || m.rapd === 'sol')) parca.push(`${RAPD_AD[m.rapd as Rapd]}.`)
  const ref = refraksiyonMetni(m.ek?.refraksiyon || null)
  if (ref) parca.push(ref)
  return parca.join(' ')
}

/** "Şeridi Objektif'e yaz": son ölçüm (en iyi uzak VA + GİB + RAPD) + son göz dibi satırı. Doz / tanı içermez. */
export function seritNotaMetni(g: { sonOlcum: OlcumSatiri | null; sonFundus: FundusKayit | null }): string | null {
  const parca: string[] = []
  if (g.sonOlcum) {
    const m = g.sonOlcum, va = (m.va || {}) as { sag?: VaSeti; sol?: VaSeti }
    const iyi = (t: Taraf) => vaGoster(enIyiUzak(va[t]))
    parca.push(`Vizit şeridi (${m.tarih}) — VA OD ${iyi('sag')}, OS ${iyi('sol')}; GİB${yontemAd(m.gib_yontem)} OD ${m.gib_sag ?? '—'} / OS ${m.gib_sol ?? '—'} mmHg${m.rapd === 'sag' || m.rapd === 'sol' || m.rapd === 'yok' ? `; ${RAPD_AD[m.rapd as Rapd]}` : ''}.`)
  }
  if (g.sonFundus) parca.push(fundusMetni(g.sonFundus))
  return parca.length ? parca.join(' ') : null
}
