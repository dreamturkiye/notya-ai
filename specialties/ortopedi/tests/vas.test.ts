import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { skorla, bantBul, sonrakiVasGun } from '../engines/vasFonksiyon'

describe('ORTOPEDI-EXCEPTIONAL-01 VAS/fonksiyon', () => {
  it('tam skor: hafif / orta / şiddetli bant', () => {
    const hafif = skorla(1, [0, 0, 0, 0])
    assert.equal(hafif.tamamMi, true)
    assert.equal(hafif.bant, 'hafif')
    assert.match(hafif.ozet, /karar desteği/)
    assert.doesNotMatch(hafif.ozet, /artroz|tanı koy/i)

    const orta = skorla(5, [2, 2, 2, 2])
    assert.equal(orta.bant, 'orta')

    const siddetli = skorla(9, [4, 4, 4, 4])
    assert.equal(siddetli.bant, 'siddetli')
  })

  it('eksik madde toplam yorumlanmaz', () => {
    const s = skorla(5, [2, 2, null, 2])
    assert.equal(s.tamamMi, false)
    assert.equal(s.bant, null)
    assert.match(s.ozet, /kısmi/)
  })

  it('bantBul eşikleri', () => {
    assert.equal(bantBul(0, 0), 'hafif')
    assert.equal(bantBul(5, 4), 'orta')
    assert.equal(bantBul(10, 16), 'siddetli')
  })

  it('sonrakiVasGun şiddete göre kısalır', () => {
    assert.ok(sonrakiVasGun('siddetli')! < sonrakiVasGun('orta')!)
    assert.ok(sonrakiVasGun('orta')! < sonrakiVasGun('hafif')!)
  })
})
