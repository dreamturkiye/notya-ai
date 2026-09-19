import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  skorla, bantBul, sonrakiIpssGun, IPSS_MADDELER, IPSS_BANT_AD,
} from '@/specialties/uroloji/engines/ipss'

describe('UROLOJI-EXCEPTIONAL-01 IPSS (şiddet karar desteği)', () => {
  it('7 items 0–5 sum to 0–35', () => {
    assert.equal(IPSS_MADDELER.length, 7)
    const s = skorla([1, 1, 1, 1, 1, 1, 1])
    assert.equal(s.toplam, 7)
    assert.equal(s.tamamMi, true)
    assert.equal(s.bant, 'hafif')
  })

  it('bands follow mild / moderate / severe ranges', () => {
    const beklenen: Array<[number, string]> = [
      [0, 'hafif'], [7, 'hafif'], [8, 'orta'], [19, 'orta'], [20, 'siddetli'], [35, 'siddetli'],
    ]
    for (const [t, bant] of beklenen) assert.equal(bantBul(t), bant, `${t}`)
  })

  it('missing item is never averaged away', () => {
    const s = skorla([2, 2, null, 2, 2, 2, 2])
    assert.equal(s.tamamMi, false)
    assert.equal(s.eksikMadde, 1)
    assert.equal(s.bant, null)
    assert.match(s.ozet, /yorumlanmaz/)
  })

  it('summary is decision support and never claims BPH diagnosis', () => {
    const s = skorla([4, 4, 4, 4, 4, 4, 4], 3)
    assert.match(s.ozet, /karar desteği|şiddet/)
    assert.match(s.ozet, /tanı hekimin/)
    assert.doesNotMatch(s.ozet, /BPH|prostat büyümesi tanısı|prostat kanseri/i)
    assert.equal(s.qol, 3)
    assert.equal(s.dipnot.ref, 'IPSS')
  })

  it('QoL is separate from total', () => {
    const s = skorla([0, 0, 0, 0, 0, 0, 0], 6)
    assert.equal(s.toplam, 0)
    assert.equal(s.qol, 6)
  })

  it('retest calendar tightens for severe band', () => {
    assert.equal(sonrakiIpssGun('hafif'), 365)
    assert.equal(sonrakiIpssGun('orta'), 180)
    assert.equal(sonrakiIpssGun('siddetli'), 90)
    assert.ok(Object.values(IPSS_BANT_AD).every((a) => /şiddet|düzey/.test(a)))
  })
})
