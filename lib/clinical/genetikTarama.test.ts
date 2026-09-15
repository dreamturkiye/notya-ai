import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ntDegerlendir, ileriAnneYasi } from './genetikTarama'

describe('genetikTarama', () => {
  it('flags NT at and above the conservative absolute threshold (3.5mm)', () => {
    assert.equal(ntDegerlendir(3.5, 12)!.bayrak, true)
    assert.equal(ntDegerlendir(4.2, 13)!.bayrak, true)
  })

  it('does not flag NT below the threshold', () => {
    assert.equal(ntDegerlendir(2.0, 12)!.bayrak, false)
  })

  it('refuses to evaluate NT outside the 11-14 week measurement window', () => {
    const r = ntDegerlendir(3.0, 16)
    assert.equal(r!.bayrak, false)
    assert.match(r!.not, /ölçüm penceresi/)
  })

  it('never returns a computed risk ratio field — recording only, by contract', () => {
    const r = ntDegerlendir(4.0, 12)
    assert.ok(r)
    assert.ok(!('risk' in r!) && !('oran' in r!))
  })

  it('flags advanced maternal age at 35, not before', () => {
    assert.equal(ileriAnneYasi(34), false)
    assert.equal(ileriAnneYasi(35), true)
    assert.equal(ileriAnneYasi(null), false)
  })
})
