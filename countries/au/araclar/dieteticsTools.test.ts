/**
 * AU clinical dietetics suite — specialty-only; foreign roles omit every key.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { hesabinAraci } from '@/lib/ulke/araclar/paket'
import { AU_ARAYUZ } from '../arayuz'
import {
  AU_DIYET_ANAHTARLARI,
  AU_ENERJI_PROTEIN,
  AU_ENTERAL,
  AU_IDDSI,
  AU_KILO_DEGISIM,
  AU_MST,
  AU_NUTRITION_GOALS,
  AU_NUTRITION_LABS,
  AU_REFEEDING,
  auDieteticsAraclari,
  yuvarlaKj,
  yuvarlaProtein,
  yuzdeKiloDegisim,
} from './dieteticsTools'

const A = AU_ARAYUZ.araclar as UlkeAraclari
const O = { bugun: '2026-10-28', p: {} }
const kos = (t: typeof AU_MST, g: Record<string, unknown>) => t.hesapla(g as never, O)

describe('AU clinical dietetics Araçlar (beta suite)', () => {
  it('eight specialty-only tools are wired for dietetics alone', () => {
    assert.equal(AU_DIYET_ANAHTARLARI.length, 8)
    assert.equal(auDieteticsAraclari().length, 8)
    for (const k of AU_DIYET_ANAHTARLARI) {
      const p = A.araclar.find((x) => x.anahtar === k)
      assert.ok(p, k)
      const expected = k === 'au-iddsi-record' ? ['dietetics', 'speech-pathology'] : ['dietetics']
      assert.deepEqual(p!.roller, expected, k)
      assert.ok(hesabinAraci(A, 'dietetics', k), `dietetics sees ${k}`)
      assert.equal(hesabinAraci(A, 'cardiology', k), null, `cardiology omits ${k}`)
      assert.equal(hesabinAraci(A, 'paediatrics', k), null, `paediatrics omits ${k}`)
      assert.equal(hesabinAraci(A, 'clinical-psychology', k), null, `psychology omits ${k}`)
      if (k === 'au-iddsi-record') assert.ok(hesabinAraci(A, 'speech-pathology', k), 'speech sees IDDSI')
      else assert.equal(hesabinAraci(A, 'speech-pathology', k), null, `speech omits ${k}`)
    }
  })

  it('MST: score 0–1 low band; ≥2 at-risk band; out of range incomplete', () => {
    assert.equal(kos(AU_MST, { toplam: 1 }).bant, 'dusuk')
    assert.equal(kos(AU_MST, { toplam: 2 }).bant, 'risk')
    assert.equal(kos(AU_MST, { toplam: 5 }).bant, 'risk')
    assert.equal(kos(AU_MST, { toplam: 6 }).tamam, false)
    assert.equal(kos(AU_MST, {}).tamam, false)
  })

  it('weight change: 10% loss flags; gain and flat do not', () => {
    assert.equal(yuzdeKiloDegisim(70, 63), -10)
    const kayip = kos(AU_KILO_DEGISIM, { onceki: 70, simdi: 63 })
    assert.equal(kayip.tamam, true)
    assert.equal(kayip.bant, 'azaldi_cok')
    assert.deepEqual(kayip.uyarilar, ['kayip_onemli'])
    const artis = kos(AU_KILO_DEGISIM, { onceki: 70, simdi: 72 })
    assert.equal(artis.bant, 'artti')
    assert.deepEqual(artis.uyarilar, [])
  })

  it('energy/protein: kJ rounding to 100, protein to 5; Australian kJ not kcal', () => {
    assert.equal(yuvarlaKj(8750), 8800)
    assert.equal(yuvarlaProtein(73), 75)
    const r = kos(AU_ENERJI_PROTEIN, { kilo: 70, kj_kg: 125, protein_kg: 1.2 })
    assert.equal(r.tamam, true)
    assert.equal(r.sayilar.find((s) => s.anahtar === 'enerji_kj')?.deger, 8800)
    assert.equal(r.sayilar.find((s) => s.anahtar === 'enerji_kj')?.birim, 'kJ')
    assert.equal(r.sayilar.find((s) => s.anahtar === 'protein_g')?.deger, 85)
    assert.deepEqual(r.uyarilar, ['baslangic'])
    assert.match(A.araclar.find((p) => p.anahtar === 'au-energy-protein')!.metin.aciklama['en-AU']!, /kilojoule/i)
    assert.doesNotMatch(A.araclar.find((p) => p.anahtar === 'au-energy-protein')!.metin.aciklama['en-AU']!, /\bkcal\b/i)
  })

  it('IDDSI: records levels; warns when test not ticked; empty incomplete', () => {
    const ok = kos(AU_IDDSI, { icecek: 'd2', yiyecek: 'f5', test_yapildi: true })
    assert.equal(ok.tamam, true)
    assert.deepEqual(ok.uyarilar, [])
    const uyari = kos(AU_IDDSI, { icecek: 'd0' })
    assert.deepEqual(uyari.uyarilar, ['test_yok'])
    assert.equal(kos(AU_IDDSI, {}).tamam, false)
  })

  it('refeeding: ticks raise warning; yok alone is clean', () => {
    const risk = kos(AU_REFEEDING, { bmi_dusuk: true, az_alim: true })
    assert.deepEqual(risk.uyarilar, ['refeeding'])
    assert.equal(kos(AU_REFEEDING, { yok: true }).uyarilar.length, 0)
    assert.equal(kos(AU_REFEEDING, { bmi_dusuk: true, yok: true }).tamam, false)
  })

  it('enteral rate: volume ÷ hours', () => {
    const r = kos(AU_ENTERAL, { hacim: 1200, saat: 20 })
    assert.equal(r.sayilar.find((s) => s.anahtar === 'hiz')?.deger, 60)
    assert.equal(r.sayilar.find((s) => s.anahtar === 'hiz')?.birim, 'mL/h')
  })

  it('nutrition goals: at least one goal preferred', () => {
    assert.deepEqual(kos(AU_NUTRITION_GOALS, {}).uyarilar, ['hedef_yok'])
    const g = kos(AU_NUTRITION_GOALS, { alim: true, aile: true })
    assert.equal(g.sayilar[0].deger, 2)
    assert.deepEqual(g.uyarilar, [])
  })

  it('nutrition labs: records typed values only; empty warns; no diagnosis band', () => {
    assert.deepEqual(kos(AU_NUTRITION_LABS, {}).uyarilar, ['lab_yok'])
    const r = kos(AU_NUTRITION_LABS, { hba1c: 7.2, albumin: 32, ferritin: 18, potasyum: 3.4 })
    assert.equal(r.tamam, true)
    assert.equal(r.bant, null)
    assert.deepEqual(r.uyarilar, ['lab_kayit'])
    assert.equal(r.sayilar.find((s) => s.anahtar === 'dolu')?.deger, 4)
    assert.equal(r.sayilar.find((s) => s.anahtar === 'albumin')?.birim, 'g/L')
    assert.equal(r.sayilar.find((s) => s.anahtar === 'ferritin')?.birim, 'ug/L')
    const p = A.araclar.find((x) => x.anahtar === 'au-nutrition-labs')!
    assert.deepEqual(p.roller, ['dietetics'])
    assert.equal(p.metin.bantlar, undefined)
    assert.match(p.metin.uyarilar!.lab_kayit['en-AU']!, /not a diagnosis/i)
    assert.doesNotMatch(p.metin.aciklama['en-AU']!, /\bnormal range\b/i)
  })

  it('copy never invents a prescribed calorie target or medical diagnosis', () => {
    const metin = JSON.stringify(auDieteticsAraclari().map((p) => p.metin))
    assert.doesNotMatch(metin, /\bkcal target\b/i)
    assert.match(metin, /Not a diagnosis|not a diagnosis|Not a malnutrition diagnosis/)
  })
})
