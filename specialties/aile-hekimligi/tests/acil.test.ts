/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sevk/acil triyaj motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, ACIL_KODLARI, HASTA_ACIL_METNI,
} from '../engines/acil'

describe('aile hekimliği acil', () => {
  it('göğüs ağrısı ve nefes darlığını yakalar', () => {
    const b = acilTara(['Göğüs ağrım var ve ani nefes darlığım oldu'])
    assert.ok(b.some((x) => x.kod === 'gogus_agrisi'))
    assert.ok(b.some((x) => x.kod === 'ani_nefes'))
    assert.ok(hekimOnayiGerekliMi(b))
  })

  it('Türkçe İ büyük harfini yakalar', () => {
    const b = acilTara(['İki saattir yüz kayması var'])
    assert.ok(b.some((x) => x.kod === 'inme_bayrak'))
  })

  it('intake etiketleri motor kodlarıyla birebir', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, ACIL_KODLARI.length)
  })

  it('hasta acil metni tanı ve doz taşımaz', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /\bmg\b|tanı|HbA1c/i)
  })
})
