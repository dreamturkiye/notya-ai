import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeStopaj, GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK, STOPAJ_YOK_GERCEK_KISI_NOTU } from './stopaj'

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

  it('pins the statutory serbest meslek rate to %20 (GVK md. 94/2-b) in one constant', () => {
    assert.equal(GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK, 2000)
  })

  it('states plainly when stopaj is NOT withheld and keeps KDV in the net amount', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 10000, totalKurus: 110000, buyerIsKurumsal: false })
    assert.equal(r.note, STOPAJ_YOK_GERCEK_KISI_NOTU)
    assert.match(r.note, /Stopaj .* kesilmedi/)
    assert.match(r.note, /gerçek kişi/)
    assert.match(r.note, /yalnızca KDV/)
    assert.equal(r.netKurus, 110000)
  })

  it('computes stopaj on the KDV-exclusive matrah, never on the KDV-inclusive total', () => {
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 20000, totalKurus: 120000, buyerIsKurumsal: true })
    assert.equal(r.stopajKurus, 20000)
    assert.equal(r.netKurus, 100000)
  })

  it('does not apply stopaj to a zero matrah and notes a manual override', () => {
    const r0 = computeStopaj({ docType: 'esmm', matrahKurus: 0, kdvKurus: 0, totalKurus: 0, buyerIsKurumsal: true })
    assert.equal(r0.stopajKurus, 0)
    const r = computeStopaj({ docType: 'esmm', matrahKurus: 100000, kdvKurus: 0, totalKurus: 100000, buyerIsKurumsal: true, rateBpOverride: 1500 })
    assert.match(r.note, /elle verilen/)
  })
})
