/**
 * NOTYA-ULKE-ARAC-KBH-RISK-01 — `kbh-risk-kategorisi`, the chronic kidney disease risk-category tool that needs no
 * permission from KDIGO (see the file header of ./tanimlar/kbhRiskKategorisi.ts for the legal reasoning). Every
 * threshold below is the guideline's own, read on 2026-10-13 (this session); none is from memory.
 *
 *   [KDIGO-FULL] KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
 *     Kidney Int. 2024;105(4S):S117-S314 — https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
 *     Table 2 (p. S137): G1 >=90, G2 60-89, G3a 45-59, G3b 30-44, G4 15-29, G5 <15 (mL/min/1.73m2).
 *     Table 3 (p. S137): A1 <30, A2 30-300, A3 >300 mg/g; A1 <3, A2 3-30, A3 >30 mg/mmol.
 *   [KDIGO-2012] KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
 *     Kidney Int. Suppl. 2013;3(1) — https://kdigo.org/wp-content/uploads/2017/02/KDIGO_2012_CKD_GL.pdf
 *     frequency-of-monitoring grid (p. 8): the monotonic grouping this tool's composite tier is cross-checked
 *     against (see ./tanimlar/kbhRiskKategorisi.ts for the full table).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { birimAnahtari, birimdenKanonige, LAB_BIRIMLERI } from './birimler'
import { kitAraci } from './katalog'
import type { AracGirdisi, AracOrtami, AracTanimi } from './tipler'
import { KBH_RISK_TIYERLERI, kbhRiskTiyeri } from './tanimlar/kbhRiskKategorisi'
import { KDIGO_A, KDIGO_G } from './tanimlar/cerrahiDahiliyeDerm'

const O: AracOrtami = { bugun: '2026-10-13', p: {} }
const arac = (): AracTanimi => kitAraci('kbh-risk-kategorisi')!
const calis = (g: AracGirdisi) => arac().hesapla(g, O)
/** A value typed in `birim` -> the canonical value (mg/g) `g.acr` must carry, exactly as the kit's own form reader would hand it over (lib/ulke/araclar/girdi.ts). */
const mgG = (x: number) => x
const mmolDenMgG = (x: number) => birimdenKanonige(LAB_BIRIMLERI.albuminKreatinin, 'mg/mmol', x)!
const acrGirdisi = (deger: number, birim: 'mg/g' | 'mg/mmol') => ({ acr: birim === 'mg/g' ? mgG(deger) : mmolDenMgG(deger), [birimAnahtari('acr')]: birim })

describe('kbh-risk-kategorisi — not kdigo-evre/kdigo-serit, and not switched on anywhere', () => {
  it('is a distinct key from the two blocked tools, is in the kit, and is not one of their definitions', () => {
    assert.notEqual('kbh-risk-kategorisi', 'kdigo-evre')
    assert.notEqual('kbh-risk-kategorisi', 'kdigo-serit')
    assert.ok(kitAraci('kbh-risk-kategorisi'))
    assert.notEqual(kitAraci('kbh-risk-kategorisi'), kitAraci('kdigo-evre'))
    assert.notEqual(kitAraci('kbh-risk-kategorisi'), kitAraci('kdigo-serit'))
  })

  it('returns no colour key: its bands are the four plain words, none of them a colour name', () => {
    assert.deepEqual([...KBH_RISK_TIYERLERI], ['dusuk', 'orta', 'yuksek', 'cokYuksek'])
    for (const renk of ['yesil', 'sari', 'turuncu', 'kirmizi']) assert.ok(!KBH_RISK_TIYERLERI.includes(renk as never), renk)
  })
})

describe('kbh-risk-kategorisi — GFR categories, [KDIGO-FULL] Table 2, p. S137', () => {
  it('every G1-G5 boundary, with no albuminuria result (the ratio-missing warning, no tier)', () => {
    const g = (egfr: number) => calis({ egfr, acr: null })
    for (const [egfr, beklenen] of [[90, 'G1'], [89, 'G2'], [60, 'G2'], [59, 'G3a'], [45, 'G3a'], [44, 'G3b'], [30, 'G3b'], [29, 'G4'], [15, 'G4'], [14, 'G5']] as const) {
      const s = g(egfr)
      assert.equal(s.tamam, true, `eGFR ${egfr}`)
      assert.equal(s.bant, null, `eGFR ${egfr}: no albuminuria result, so no risk tier`)
      assert.deepEqual(s.uyarilar, [beklenen, 'acr_yok'], `eGFR ${egfr}`)
    }
  })

  it('an empty form (no eGFR at all) answers nothing', () => {
    const s = calis({ egfr: null, acr: null })
    assert.deepEqual([s.tamam, s.sayilar.length, s.bant, s.uyarilar.length, s.tarihler.length], [false, 0, null, 0, 0])
  })
})

describe('kbh-risk-kategorisi — albuminuria categories, [KDIGO-FULL] Table 3, p. S137, in the unit it was typed in', () => {
  it('mg/g: A1 "<30", A2 "30-300", A3 ">300" — a value exactly on a limit', () => {
    const a = (deger: number) => calis({ egfr: 95, ...acrGirdisi(deger, 'mg/g') }).uyarilar[1]
    assert.equal(a(29), 'A1'); assert.equal(a(30), 'A2'); assert.equal(a(300), 'A2'); assert.equal(a(301), 'A3')
  })

  it('mg/mmol: A1 "<3", A2 "3-30", A3 ">30" — as the guideline prints it for this unit, not a conversion from mg/g', () => {
    const a = (deger: number) => calis({ egfr: 95, ...acrGirdisi(deger, 'mg/mmol') }).uyarilar[1]
    assert.equal(a(2.9), 'A1'); assert.equal(a(3), 'A2'); assert.equal(a(30), 'A2'); assert.equal(a(31), 'A3')
    // the fault the kit's other kidney tools were corrected for (converting first, then comparing to the mg/g limits) would call 3 mg/mmol (26.5 mg/g) A1 and 31 mg/mmol (274 mg/g) A2 — this tool does neither
  })

  it('no risk tier, and no tool key held onto, for a unit the guideline prints no limits for', () => {
    const s = calis({ egfr: 95, acr: 50, [birimAnahtari('acr')]: 'mmol/L' })
    assert.deepEqual([s.tamam, s.bant], [false, null])
  })
})

describe('kbh-risk-kategorisi — composite risk tier: this tool\'s own arithmetic, cross-checked against [KDIGO-2012] p. 8/14 (not the chart image)', () => {
  it('the lowest tier: G1 or G2 with A1 (monitoring grid: "1 if CKD", the grid\'s lowest figure)', () => {
    assert.equal(calis({ egfr: 95, ...acrGirdisi(10, 'mg/g') }).bant, 'dusuk')
    assert.equal(calis({ egfr: 65, ...acrGirdisi(10, 'mg/g') }).bant, 'dusuk')
  })

  it('a middling tier: G1/A2, G2/A2 and G3a/A1 (monitoring grid: all three "1")', () => {
    assert.equal(calis({ egfr: 95, ...acrGirdisi(100, 'mg/g') }).bant, 'orta')
    assert.equal(calis({ egfr: 65, ...acrGirdisi(100, 'mg/g') }).bant, 'orta')
    assert.equal(calis({ egfr: 50, ...acrGirdisi(10, 'mg/g') }).bant, 'orta')
  })

  it('a higher tier: G3a/A2, G3b/A1, and G1/A3 or G2/A3 (monitoring grid: all four "2")', () => {
    assert.equal(calis({ egfr: 50, ...acrGirdisi(100, 'mg/g') }).bant, 'yuksek')
    assert.equal(calis({ egfr: 35, ...acrGirdisi(10, 'mg/g') }).bant, 'yuksek')
    assert.equal(calis({ egfr: 95, ...acrGirdisi(400, 'mg/g') }).bant, 'yuksek')
  })

  it('the highest tier: G4 or G5 whatever the albuminuria (monitoring grid: always its highest figure; the "refer" grid: always "refer")', () => {
    assert.equal(calis({ egfr: 25, ...acrGirdisi(10, 'mg/g') }).bant, 'cokYuksek')
    assert.equal(calis({ egfr: 10, ...acrGirdisi(10, 'mg/g') }).bant, 'cokYuksek')
    assert.equal(calis({ egfr: 25, ...acrGirdisi(400, 'mg/g') }).bant, 'cokYuksek')
  })

  it('monotonic: a worse GFR category, or a worse albuminuria category, never gives a lower tier than a better one', () => {
    const indeks = (t: string) => KBH_RISK_TIYERLERI.indexOf(t as never)
    for (let gi = 0; gi < KDIGO_G.length; gi++) for (let ai = 0; ai < KDIGO_A.length; ai++) {
      const kendi = indeks(kbhRiskTiyeri(KDIGO_G[gi], KDIGO_A[ai]))
      if (gi + 1 < KDIGO_G.length) assert.ok(indeks(kbhRiskTiyeri(KDIGO_G[gi + 1], KDIGO_A[ai])) >= kendi, `G${gi}->G${gi + 1} at A${ai}`)
      if (ai + 1 < KDIGO_A.length) assert.ok(indeks(kbhRiskTiyeri(KDIGO_G[gi], KDIGO_A[ai + 1])) >= kendi, `A${ai}->A${ai + 1} at G${gi}`)
    }
  })
})
