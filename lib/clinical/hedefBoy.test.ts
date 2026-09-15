import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseBoyGirdi,
  hesaplaHedefBoy,
  formatBoyCm,
  cinsiyetHedefBoy,
} from './hedefBoy'

function cmOf(raw: string | number) {
  const r = parseBoyGirdi(raw)
  assert.equal(r.ok, true, String(raw))
  return r.ok ? r.cm : 0
}

describe('hedefBoy (mid-parental height)', () => {
  it('parses centimetres and metres the way TR clinics type them', () => {
    assert.equal(cmOf('182'), 182)
    assert.equal(cmOf('1.82'), 182)
    assert.equal(cmOf('1,79 m'), 179)
    assert.equal(cmOf('165cm'), 165)
    assert.equal(cmOf('1.82cm'), 182)
  })

  it('Tanner: boy (180 + 165 + 13) / 2 = 179 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: 165, babaBoy: 180, cinsiyet: 'erkek' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 179)
      assert.equal(r.sonuc.altCm, 170.5)
      assert.equal(r.sonuc.ustCm, 187.5)
      assert.equal(r.sonuc.formul, '(baba + anne + 13) / 2')
    }
  })

  it('Tanner: girl (180 + 165 − 13) / 2 = 166 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: '1.65', babaBoy: '1.80', cinsiyet: 'Kadın' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 166)
      assert.equal(r.sonuc.cinsiyet, 'kiz')
    }
  })

  it('refuses missing child sex and out-of-range adult height', () => {
    assert.equal(hesaplaHedefBoy({ anneBoy: 165, babaBoy: 180, cinsiyet: null }).ok, false)
    assert.equal(parseBoyGirdi('90').ok, false)
    assert.equal(parseBoyGirdi('250').ok, false)
  })

  it('TR clinic example: baba 1.82 m, anne 1.79 m, erkek → 187 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: '1.79', babaBoy: '1.82', cinsiyet: 'erkek' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 187)
      assert.equal(r.sonuc.anneCm, 179)
      assert.equal(r.sonuc.babaCm, 182)
    }
  })

  it('maps TR gender labels and formats cm + metres', () => {
    assert.equal(cinsiyetHedefBoy('kız'), 'kiz')
    assert.equal(cinsiyetHedefBoy('Erkek'), 'erkek')
    assert.equal(formatBoyCm(182), '182 cm (1,82 m)')
  })
})
