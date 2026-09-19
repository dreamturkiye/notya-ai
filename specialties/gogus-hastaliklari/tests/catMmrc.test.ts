import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { catMmrcDegerlendir, catTopla, goldGrupHesapla, goldEvreHesapla } from '../engines/catMmrc'

describe('GOGUS-EXCEPTIONAL-01 CAT/mMRC', () => {
  it('CAT totals 8 complete items; incomplete rejects', () => {
    assert.deepEqual(catTopla([1, 1, 1, 1, 1, 1, 1, 1]), { toplam: 8, tamam: true, eksik: 0 })
    assert.equal(catTopla([1, 1, 1, null, 1, 1, 1, 1]).tamam, false)
  })

  it('GOLD group A/B/E from symptoms and exacerbations', () => {
    assert.equal(goldGrupHesapla({ mmrc: 0, cat: 5, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 0 }), 'A')
    assert.equal(goldGrupHesapla({ mmrc: 2, cat: 5, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 0 }), 'B')
    assert.equal(goldGrupHesapla({ mmrc: 0, cat: 12, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 0 }), 'B')
    assert.equal(goldGrupHesapla({ mmrc: 0, cat: 5, ortaAlevlenme12Ay: 2, yatisliAlevlenme12Ay: 0 }), 'E')
    assert.equal(goldGrupHesapla({ mmrc: 0, cat: 5, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 1 }), 'E')
  })

  it('GOLD stage from FEV1% only (decision support)', () => {
    assert.equal(goldEvreHesapla(85), 1)
    assert.equal(goldEvreHesapla(55), 2)
    assert.equal(goldEvreHesapla(35), 3)
    assert.equal(goldEvreHesapla(20), 4)
    assert.equal(goldEvreHesapla(null), null)
  })

  it('ozet never claims diagnosis or dose', () => {
    const s = catMmrcDegerlendir({ catToplam: 14, mmrc: 2, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 0 })
    assert.equal(s.grup, 'B')
    assert.match(s.ozet, /karar desteği/)
    assert.doesNotMatch(s.ozet, /tanı kondu|mg|mcg|puff/i)
  })
})
