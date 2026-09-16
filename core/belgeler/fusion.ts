/**
 * NOTYA-BELGE-01 — Fusion and confidence.
 * Replaces "keep if agree>=2 or max(p)>=0.85" with ontology-based, engine-gated fusion plus a cap table that is
 * enforced in code (the validator), never trusted from the model.
 *
 * Cap table (Kaan spec v2.1):
 *   validated engines, ≥2 agree                          95
 *   single validated engine                              85
 *   Claude describe / zero-shot only                     70
 *   adult-trained engine, patient < 16 yaş               60 + sinirlar note
 *   single-field fundus / phone derm photo (Fitzpatrick?) 70
 *   quality dusuk                                        no tanılar
 * Bands: yüksek ≥80, orta ≥55, else düşük (locked).
 * acil_bayrak is set by RULE from ontology thresholds; Claude may add, never remove.
 */
import { acilEsik, bulguTr, gecerliKod, type Modalite } from './ontoloji'
import type { BelgeRaporu, FusionSonuc, FuzedBulgu, GuvenBant, MotorCiktisi, Tani } from './types'

const AGREE_ESIK = 2
const TEK_MOTOR_ESIK = 0.85
const ONEMSIZ_P = 0.2   // below this an engine that ran counts as "karşı" for that code

export function bant(pct: number): GuvenBant {
  return pct >= 80 ? 'yüksek' : pct >= 55 ? 'orta' : 'düşük'
}

export type CapGirdi = {
  modalite: Modalite
  yasAy?: number | null
  motorlar: MotorCiktisi[]
  fused: FuzedBulgu[]
  kalite: 'iyi' | 'orta' | 'dusuk'
  fitzpatrickBilinmiyor?: boolean
  tekAlanFundus?: boolean
}

/** The maximum guven_pct any tanı may carry, with the reasons that lowered it. */
export function capHesapla(g: CapGirdi): { cap: number; sinirlar: string[] } {
  const sinirlar: string[] = []
  if (g.kalite === 'dusuk') return { cap: 0, sinirlar: ['Görüntü/kayıt kalitesi düşük — tanı önerisi üretilmedi.'] }
  const dogrulanmis = g.motorlar.filter((m) => m.dogrulanmis && !m.hata)
  let cap = 70
  if (dogrulanmis.length >= 1) {
    const ikiUyum = g.fused.some((f) => f.agree >= AGREE_ESIK && f.sources.filter((s) => dogrulanmis.some((m) => m.motor === s)).length >= 2)
    cap = ikiUyum ? 95 : 85
  } else {
    sinirlar.push('Yalnız genel görsel değerlendirme (doğrulanmış özel motor çalışmadı) — güven en çok %70.')
  }
  const pediatrik = typeof g.yasAy === 'number' && g.yasAy < 16 * 12
  if (pediatrik && dogrulanmis.length >= 1) {
    cap = Math.min(cap, 60)
    sinirlar.push('Erişkin verisiyle eğitilmiş motor; hasta 16 yaş altı — güven en çok %60.')
  }
  if (g.modalite === 'fundus' && g.tekAlanFundus) { cap = Math.min(cap, 70); sinirlar.push('Tek alan fundus fotoğrafı — güven en çok %70.') }
  if ((g.modalite === 'derm' || g.modalite === 'yara') && g.fitzpatrickBilinmiyor !== false) { cap = Math.min(cap, 70); sinirlar.push('Telefon fotoğrafı; deri tipi (Fitzpatrick) bilinmiyor — güven en çok %70.') }
  if (g.modalite === 'serbest') { cap = Math.min(cap, 55); sinirlar.push('Branş için tanımlı yüksek değerli girdi değil — yalnızca tarif.') }
  return { cap, sinirlar }
}

/** Ontology-based fusion. Engines that ran on the modality but did not raise a code become "karşı". */
export function fuse(motorlar: MotorCiktisi[]): FuzedBulgu[] {
  const calisan = motorlar.filter((m) => !m.hata)
  const kodlar = new Map<string, { p: number[]; agree: number; sources: string[] }>()
  for (const m of calisan) {
    const agirlik = m.dogrulanmis ? 1 : 0.5
    for (const l of m.labels) {
      if (!gecerliKod(l.kod)) continue
      const p = Math.max(0, Math.min(1, l.p))
      const e = kodlar.get(l.kod) || { p: [], agree: 0, sources: [] }
      e.p.push(p)
      if (p >= 0.5) { e.agree += agirlik; e.sources.push(m.motor) }
      kodlar.set(l.kod, e)
    }
  }
  const out: FuzedBulgu[] = []
  for (const [kod, e] of kodlar) {
    const maxP = Math.max(...e.p)
    const dogrulanmisMax = Math.max(0, ...calisan.filter((m) => m.dogrulanmis).flatMap((m) => m.labels.filter((l) => l.kod === kod).map((l) => l.p)))
    const tut = e.agree >= AGREE_ESIK || dogrulanmisMax >= TEK_MOTOR_ESIK || (e.agree >= 1 && maxP >= 0.5)
    if (!tut) continue
    const karsi = calisan
      .filter((m) => !e.sources.includes(m.motor))
      .filter((m) => { const l = m.labels.find((x) => x.kod === kod); return !l || l.p < ONEMSIZ_P })
      .map((m) => m.motor)
    // fused p: mean of supporting engines, validated engines weighted double
    const agirlikli = calisan.flatMap((m) => m.labels.filter((l) => l.kod === kod && l.p >= 0.5).map((l) => ({ p: l.p, w: m.dogrulanmis ? 2 : 1 })))
    const p = agirlikli.length ? agirlikli.reduce((s, x) => s + x.p * x.w, 0) / agirlikli.reduce((s, x) => s + x.w, 0) : maxP
    out.push({ kod, label_tr: bulguTr(kod), p: Math.round(p * 100) / 100, agree: e.agree, sources: e.sources, karsi })
  }
  return out.sort((a, b) => b.p - a.p)
}

/** acil by rule: any code above its ontology threshold */
export function acilKurali(fused: FuzedBulgu[]): { acil: boolean; nedenler: string[] } {
  const nedenler = fused.filter((f) => { const e = acilEsik(f.kod); return e !== undefined && f.p >= e }).map((f) => f.label_tr)
  return { acil: nedenler.length > 0, nedenler }
}

export function fusionYap(motorlar: MotorCiktisi[], g: Omit<CapGirdi, 'fused' | 'motorlar'>): FusionSonuc {
  const fused = fuse(motorlar)
  const { cap, sinirlar } = capHesapla({ ...g, motorlar, fused })
  const { acil, nedenler } = acilKurali(fused)
  return { fused, acilBayrak: acil, acilNedenler: nedenler, capPct: cap, sinirlar, kalite: g.kalite }
}

/**
 * Validator: enforce caps, bands, acil rule and the quality rule on the model's JSON. The model is never
 * trusted for these. Returns a corrected report plus what was changed (for the audit trail).
 */
export function raporuDogrula(r: BelgeRaporu, f: FusionSonuc): { rapor: BelgeRaporu; duzeltmeler: string[] } {
  const duzeltmeler: string[] = []
  const rapor: BelgeRaporu = { ...r, tanilar: [...(r.tanilar || [])], sinirlar: [...(r.sinirlar || [])], bulgular: [...(r.bulgular || [])], hekim_tanisi: [...(r.hekim_tanisi || [])], engines_used: [...(r.engines_used || [])] }
  if (f.kalite === 'dusuk') {
    if (rapor.tanilar.length) duzeltmeler.push(`kalite düşük → ${rapor.tanilar.length} tanı silindi`)
    rapor.tanilar = []
    rapor.kalite = 'dusuk'
  }
  rapor.tanilar = rapor.tanilar.map((t): Tani => {
    let pct = Math.round(Number(t.guven_pct) || 0)
    if (pct > f.capPct) { duzeltmeler.push(`${t.ad}: %${pct} → cap %${f.capPct}`); pct = f.capPct }
    if (pct > 95) pct = 95
    if (pct < 0) pct = 0
    return { ...t, guven_pct: pct, guven_bant: bant(pct), destek: t.destek || [], karsi: t.karsi || [] }
  })
  if (f.acilBayrak && !rapor.acil_bayrak) { rapor.acil_bayrak = true; duzeltmeler.push(`acil bayrağı kuralla açıldı: ${f.acilNedenler.join(', ')}`) }
  for (const s of f.sinirlar) if (!rapor.sinirlar.includes(s)) rapor.sinirlar.push(s)
  if (!rapor.hekim_tanisi) rapor.hekim_tanisi = []
  return { rapor, duzeltmeler }
}
