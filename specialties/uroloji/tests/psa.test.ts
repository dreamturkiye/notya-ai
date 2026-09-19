import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  skorla, skorlaSeri, bantBul, sonrakiPsaGun, PSA_BANT_AD, PSA_HIZ_MIN_GUN,
} from '@/specialties/uroloji/engines/psa'

describe('UROLOJI-EXCEPTIONAL-01 PSA izlem (karar desteği, tanı değil)', () => {
  it('bands follow decision-support ranges', () => {
    assert.equal(bantBul(1.2), 'dusuk')
    assert.equal(bantBul(3.0), 'sinir')
    assert.equal(bantBul(5.5), 'yuksek')
    assert.equal(bantBul(12), 'cok_yuksek')
  })

  it('single value summary never claims cancer diagnosis', () => {
    const s = skorla(4.2, [], 55)
    assert.match(s.ozet, /karar desteği/)
    assert.match(s.ozet, /tanı hekimin/)
    assert.doesNotMatch(s.ozet, /kanser|malign|prostat kanseri/i)
    assert.equal(s.dipnot.ref, 'PSA_IZLEM')
  })

  it('velocity needs two dated points', () => {
    const s = skorlaSeri([
      { tarih: '2026-01-01', deger: 3.0 },
      { tarih: '2026-07-01', deger: 4.5 },
    ], 60)
    assert.ok(s.hizNgMlYil != null)
    assert.match(s.hizNot, /ng\/mL\/yıl/)
    assert.doesNotMatch(s.ozet, /kanser/i)
  })

  it('short interval notes caution', () => {
    const s = skorlaSeri([
      { tarih: '2026-09-01', deger: 3.0 },
      { tarih: '2026-09-15', deger: 3.5 },
    ])
    assert.ok(s.hizNgMlYil != null)
    assert.match(s.hizNot, new RegExp(String(PSA_HIZ_MIN_GUN)))
  })

  it('out of range rejected', () => {
    assert.equal(skorla(-1).deger, null)
    assert.equal(skorla(2000).deger, null)
    assert.equal(skorla(null).deger, null)
  })

  it('retest calendar and band labels stay decision-support', () => {
    assert.equal(sonrakiPsaGun('dusuk'), 365)
    assert.equal(sonrakiPsaGun('yuksek'), 90)
    assert.equal(sonrakiPsaGun('cok_yuksek'), 30)
    assert.ok(Object.values(PSA_BANT_AD).every((a) => /karar desteği/.test(a)))
  })
})
