import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { crlToEdd, crlToGa, currentGa, naegeleEdd } from '../engines/sat-edd'

describe('sat-edd', () => {
  it('Naegele EDD is SAT + 280 days', () => {
    assert.equal(naegeleEdd('2026-01-15'), '2026-10-22')
  })

  it('SAT lock uses SAT even when a CRL EDD exists', () => {
    const r = currentGa({
      sat: '2026-01-15',
      edd_naegele: '2026-10-22',
      edd_crl: '2026-10-18',
      ga_locked: 'sat',
    }, '2026-04-09')
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.method, 'sat')
      assert.equal(r.weeks, 12)
      assert.equal(r.days, 0)
      assert.equal(r.edd, '2026-10-22')
    }
  })

  it('CRL lock prefers revised EDD over SAT', () => {
    const r = currentGa({
      sat: '2026-01-15',
      edd_naegele: '2026-10-22',
      edd_crl: '2026-10-18',
      ga_locked: 'crl',
    }, '2026-10-18')
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.method, 'crl')
      assert.equal(r.weeks, 40)
      assert.equal(r.days, 0)
      assert.equal(r.edd, '2026-10-18')
    }
  })

  it('SAT unknown requires USG dating', () => {
    const r = currentGa({
      sat: null,
      edd_naegele: null,
      edd_crl: null,
      ga_locked: 'sat',
    }, '2026-04-09')
    assert.deepEqual(r, { ok: false, reason: 'sat_unknown_require_usg' })
  })

  it('CRL mm produces GA and a revised EDD', () => {
    const ga = crlToGa(60)
    assert.equal(ga.weeks >= 11 && ga.weeks <= 13, true)
    const edd = crlToEdd(60, '2026-04-01')
    assert.match(edd, /^\d{4}-\d{2}-\d{2}$/)
  })
})
