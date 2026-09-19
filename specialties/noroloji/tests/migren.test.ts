/**
 * NOROLOJI-EXCEPTIONAL-01 — MIDAS motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { skorla, migrenBanti } from '../engines/migren'

describe('noroloji migren / MIDAS', () => {
  it('eksik madde yorumlanmaz', () => {
    const s = skorla([1, 2, null, 0, 1])
    assert.equal(s.tamamMi, false)
    assert.equal(s.toplam, null)
  })

  it('tam skor bant üretir (karar desteği)', () => {
    const s = skorla([2, 3, 1, 2, 4])
    assert.equal(s.tamamMi, true)
    assert.equal(s.toplam, 12)
    assert.equal(s.bant, 'orta')
    assert.match(s.ozet, /karar desteği/i)
    assert.match(s.ozet, /hekimindir/i)
  })

  it('bant eşikleri', () => {
    assert.equal(migrenBanti(0), 'minimal')
    assert.equal(migrenBanti(6), 'hafif')
    assert.equal(migrenBanti(11), 'orta')
    assert.equal(migrenBanti(21), 'siddetli')
  })
})
