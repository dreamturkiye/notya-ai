import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanonikBul, kanonikBirimeCevir, kritikMi } from './kanonik'
import { sayiCoz, bayrakHesapla, trendHesapla, satirKur, trendCumlesi, uzlastir, panelOzeti } from './trend'

describe('kanonik', () => {
  it('Turkish and English aliases map; short keys do not over-match', () => {
    assert.equal(kanonikBul('Hemoglobin'), 'Hb'); assert.equal(kanonikBul('HGB'), 'Hb')
    assert.equal(kanonikBul('Açlık Kan Şekeri'), 'Glu'); assert.equal(kanonikBul('Glukoz (Açlık)'), 'Glu')
    assert.equal(kanonikBul('Kreatinin'), 'Kre'); assert.equal(kanonikBul('K'), 'K'); assert.equal(kanonikBul('Potasyum'), 'K')
    assert.equal(kanonikBul('Alanin Aminotransferaz (ALT)'), 'ALT'); assert.equal(kanonikBul('Nötrofil %'), 'NeuPct')
    assert.equal(kanonikBul('Troponin I (hs)'), 'Troponin'); assert.equal(kanonikBul('Bilinmeyen Test'), null)
  })
  it('doctor alias wins', () => { assert.equal(kanonikBul('SGPT özel', { 'sgpt özel': 'ALT' }), 'ALT') })
  it('unit conversion: mmol/L glucose → mg/dL; g/L Hb → g/dL; unknown unit → null', () => {
    assert.equal(Math.round(kanonikBirimeCevir('Glu', 5.5, 'mmol/L')!.deger), 99)
    assert.equal(kanonikBirimeCevir('Hb', 120, 'g/L')!.deger, 12)
    assert.equal(kanonikBirimeCevir('Glu', 5.5, 'furlong'), null)
    assert.equal(kanonikBirimeCevir('WBC', 7.2, '10^3/uL')!.deger, 7.2)
    assert.equal(kanonikBirimeCevir('CRP', 1.2, 'mg/dL')!.deger, 12)
  })
  it('criticals by rule', () => {
    assert.equal(kritikMi('K', 6.7, null).kritik, true); assert.equal(kritikMi('K', 4.2, null).kritik, false)
    assert.equal(kritikMi('Hb', 6.9, null).kritik, true); assert.equal(kritikMi('Troponin', null, 'Pozitif').kritik, true)
    assert.equal(kritikMi('ALT', 900, null).kritik, false)
  })
})

describe('parsing and flags', () => {
  it('Turkish decimals and comparators', () => {
    assert.deepEqual(sayiCoz('12,5'), { num: 12.5, text: null }); assert.equal(sayiCoz('<0,01').num, 0.01); assert.equal(sayiCoz('<0,01').text, '<0,01')
    assert.deepEqual(sayiCoz('Negatif'), { num: null, text: 'Negatif' })
  })
  it('flag from printed ref only; printed flag respected; no ref → unknown (never invented)', () => {
    assert.equal(bayrakHesapla(150, 70, 100, null), 'H'); assert.equal(bayrakHesapla(60, 70, 100, null), 'L'); assert.equal(bayrakHesapla(80, 70, 100, null), 'normal')
    assert.equal(bayrakHesapla(80, null, null, null), 'unknown'); assert.equal(bayrakHesapla(80, 70, 100, 'L'), 'L')
  })
})

describe('trend arithmetic', () => {
  it('rising / falling / stable / new_abn / new_normal / no_prior / unit_mismatch', () => {
    assert.equal(trendHesapla(60, 'H', { deger: 40, flag: 'normal' }, false).trend, 'new_abn')
    assert.equal(trendHesapla(35, 'normal', { deger: 60, flag: 'H' }, false).trend, 'new_normal')
    assert.equal(trendHesapla(102, 'normal', { deger: 100, flag: 'normal' }, false).trend, 'stable')
    assert.equal(trendHesapla(130, 'normal', { deger: 100, flag: 'normal' }, false).trend, 'rising')
    assert.equal(trendHesapla(70, 'normal', { deger: 100, flag: 'normal' }, false).trend, 'falling')
    assert.equal(trendHesapla(70, 'normal', null, false).trend, 'no_prior')
    assert.equal(trendHesapla(70, 'normal', { deger: 100 }, true).trend, 'unit_mismatch')
    assert.equal(trendHesapla(130, 'normal', { deger: 100, flag: 'normal' }, false).delta_pct, 30)
  })
  it('satirKur builds a full row with prior series and the templated sentence', () => {
    const s = satirKur({ raw_name: 'ALT', value: '78', unit: 'U/L', ref_low: '0', ref_high: '41', flag_printed: null, page: 1 },
      [{ canonical_key: 'ALT', kanonik_deger: 35, flag: 'normal', numune_tarihi: '2026-06-01' }, { canonical_key: 'ALT', kanonik_deger: 40, flag: 'normal', numune_tarihi: '2026-08-01' }])
    assert.equal(s.canonical_key, 'ALT'); assert.equal(s.flag, 'H'); assert.equal(s.trend, 'new_abn'); assert.equal(s.prior_value, 40); assert.equal(s.prior_series.length, 2)
    const c = trendCumlesi(s)!
    assert.ok(c.startsWith('Bu son tahlilde ALT 78 U/L (ref 0–41).')); assert.ok(c.includes('Önceki bakılarda')); assert.ok(c.includes('35–40 U/L'))
  })
  it('first panel sentence; unit mismatch sentence; critical flag', () => {
    const s = satirKur({ raw_name: 'Potasyum', value: '6,8', unit: 'mmol/L', ref_low: '3,5', ref_high: '5,1', flag_printed: null, page: 1 }, [])
    assert.equal(s.flag, 'critical'); assert.ok(s.kritik_neden?.includes('Potasyum')); assert.ok(trendCumlesi(s)!.includes('İlk kayıtlı'))
    const u = satirKur({ raw_name: 'Glukoz', value: '5,5', unit: 'nonsense', ref_low: null, ref_high: null, flag_printed: null, page: 1 }, [{ canonical_key: 'Glu', kanonik_deger: 95, flag: 'normal', numune_tarihi: '2026-01-01' }])
    assert.equal(u.trend, 'unit_mismatch'); assert.ok(trendCumlesi(u)!.includes('farklı birimde'))
  })
})

describe('reconciliation', () => {
  it('flags cells where structural and vision passes disagree; keeps vision-only rows', () => {
    const yapi = [{ raw_name: 'Hemoglobin', value: '12,5', unit: 'g/dL', ref_low: '12', ref_high: '16', flag_printed: null, page: 1 }, { raw_name: 'ALT', value: '78', unit: 'U/L', ref_low: '0', ref_high: '41', flag_printed: null, page: 1 }]
    const gorsel = [{ raw_name: 'HGB', value: '12.5', unit: 'g/dL', ref_low: '12', ref_high: '16', flag_printed: null, page: 1 }, { raw_name: 'ALT', value: '18', unit: 'U/L', ref_low: '0', ref_high: '41', flag_printed: null, page: 1 }, { raw_name: 'CRP', value: '3', unit: 'mg/L', ref_low: '0', ref_high: '5', flag_printed: null, page: 1 }]
    const r = uzlastir(yapi, gorsel)
    assert.equal(r.satirlar.length, 3); assert.equal(r.uyusmazlik.length, 1); assert.equal(r.uyusmazlik[0].raw_name, 'ALT')
    assert.equal(r.satirlar.find((s) => s.raw_name === 'CRP')?.kaynak, 'gorsel')
    const oz = panelOzeti(r.satirlar.map((h) => satirKur(h, []))); assert.equal(oz.toplam, 3)
  })
})
