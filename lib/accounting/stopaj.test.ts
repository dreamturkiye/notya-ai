import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeStopaj, GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK } from './stopaj'

describe('accounting/stopaj', () => {
  it('never applies to efatura/earsiv (şirket sales), regardless of buyer type', () => {
    const r1 = computeStopaj({ docType: 'efatura', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true })
    assert.equal(r1.applicable, false)
    assert.equal(r1.stopajKurus, 0)
    assert.equal(r1.netKurus, 110000)

    const r2 = computeStopaj({ docType: 'earsiv', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true })
    assert.equal(r2.applicable, false)
  })

  it('does not apply to e-SMM when the buyer is a gerçek kişi (the default/common case)', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: false })
    assert.equal(r.applicable, false)
    assert.equal(r.rateBp, 0)
    assert.equal(r.stopajKurus, 0)
    assert.equal(r.netKurus, 110000)
    assert.ok(r.note.length > 0)
  })

  it('applies %20 (2000bp) stopaj to e-SMM when the buyer is marked kurumsal', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true })
    assert.equal(r.applicable, true)
    assert.equal(r.rateBp, GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK)
    assert.equal(r.stopajKurus, 20000) // 100000 * 0.20
    assert.equal(r.netKurus, 100000 + 10000 - 20000) // matrah + kdv - stopaj
  })

  it('rounds stopaj to the nearest kuruş', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 333, kdvKurus: 33, totalKurus: 366, buyerIsKurumsal: true })
    assert.equal(r.stopajKurus, Math.round((333 * 2000) / 10000))
  })

  it('honors rateBpOverride instead of the default constant', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true, rateBpOverride: 1500 })
    assert.equal(r.rateBp, 1500)
    assert.equal(r.stopajKurus, 15000)
  })

  it('ignores a negative or non-integer override and falls back to the default rate', () => {
    const r1 = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true, rateBpOverride: -5 })
    assert.equal(r1.rateBp, GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK)
    const r2 = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: true, rateBpOverride: 12.5 })
    assert.equal(r2.rateBp, GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK)
  })
})
