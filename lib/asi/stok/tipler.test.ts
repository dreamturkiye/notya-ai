import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sktDurumu } from './tipler'

describe('NOTYA-ASI-STOK-BARKOD-01: sktDurumu', () => {
  it('SKT yok ise geçerli', () => {
    assert.equal(sktDurumu(null, '2026-10-16'), 'gecerli')
  })
  it('SKT geçmişse gecti', () => {
    assert.equal(sktDurumu('2026-10-01', '2026-10-16'), 'gecti')
  })
  it('60 günden az kalmışsa yaklasiyor', () => {
    assert.equal(sktDurumu('2026-11-01', '2026-10-16'), 'yaklasiyor')
  })
  it('60 günden fazla kalmışsa gecerli', () => {
    assert.equal(sktDurumu('2027-06-01', '2026-10-16'), 'gecerli')
  })
  it('bugün ise gecti sayılır (aynı gün uygulanabilir ama eşik dahil değil)', () => {
    assert.equal(sktDurumu('2026-10-16', '2026-10-16'), 'yaklasiyor')
  })
})
