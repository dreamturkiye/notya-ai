import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { eriskinVkiHesapla, eriskinVkiSiniflandir } from './eriskinVki'

describe('eriskinVki', () => {
  it('classifies WHO adult BMI bands', () => {
    assert.equal(eriskinVkiSiniflandir(17).etiket, 'Zayıf')
    assert.equal(eriskinVkiSiniflandir(22).etiket, 'Normal')
    assert.equal(eriskinVkiSiniflandir(27).etiket, 'Fazla kilolu')
    assert.equal(eriskinVkiSiniflandir(32).etiket, 'Obez (sınıf I)')
    assert.equal(eriskinVkiSiniflandir(37).etiket, 'Obez (sınıf II)')
    assert.equal(eriskinVkiSiniflandir(42).etiket, 'Obez (sınıf III)')
  })

  it('computes BMI from kilo/boy (62.8 kg, 160 cm → ~24.5 Normal)', () => {
    const r = eriskinVkiHesapla(62.8, 160)
    assert.ok(r)
    assert.equal(r!.sinif, 'normal')
    assert.ok(r!.deger >= 24.4 && r!.deger <= 24.6)
    assert.match(r!.ozet, /Normal/)
  })

  it('returns null for incomplete vitals', () => {
    assert.equal(eriskinVkiHesapla(null, 160), null)
    assert.equal(eriskinVkiHesapla(70, ''), null)
  })
})
