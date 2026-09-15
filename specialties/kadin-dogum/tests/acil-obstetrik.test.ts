import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mgso4Pack, pphPack } from '../protocols/acil-obstetrik'
import { suggestPerinatology } from '../protocols/sevk-perinatoloji'
import { eDogumRequired } from '../protocols/olu-dogum'

describe('acil-obstetrik', () => {
  it('MgSO4 pack exposes a loading flag', () => {
    const pack = mgso4Pack({ at: '2026-06-01T10:00:00Z' })
    assert.equal(pack.loading, true)
    assert.ok(pack.next.some((n) => n.includes('loading')))
  })

  it('PPH requires estimated blood loss field', () => {
    const pack = pphPack({ at: '2026-06-01T12:00:00Z', ebl_ml: 900, atony: true })
    assert.equal(pack.ebl_ml, 900)
    assert.throws(() => pphPack({ at: 'x', ebl_ml: Number.NaN }))
  })

  it('sevk is true for monochorionic twins', () => {
    const r = suggestPerinatology({ chorionicity: 'mo/di' })
    assert.equal(r.sevk, true)
    assert.ok(r.reason.includes('monochorionic twins'))
  })

  it('e-Doğum required for stillbirth ≥22w or ≥500g', () => {
    assert.equal(eDogumRequired({ live_birth: true }), true)
    assert.equal(eDogumRequired({ live_birth: false, stillbirth: true, ga_weeks: 22 }), true)
    assert.equal(eDogumRequired({ live_birth: false, stillbirth: true, weight_g: 500 }), true)
    assert.equal(eDogumRequired({ live_birth: false, stillbirth: true, ga_weeks: 18, weight_g: 200 }), false)
  })
})
