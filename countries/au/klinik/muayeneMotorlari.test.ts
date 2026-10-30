/**
 * AU gold depth — per-role Muayene engines cover every offered role with AU-vs-TR notes.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_ASISTAN_ADLARI } from './asistanAdlari'
import { AU_MUAYENE_MOTORLARI, auMuayeneMotoru } from './muayeneMotorlari'
import { AU_PORTAL_BOLUMLERI } from '../portalBolumleri'

describe('AU Muayene motors', () => {
  it('one motor per offered role (44), matching portal chapters and assistant personas', () => {
    const roller = Object.keys(AU_ASISTAN_ADLARI).sort()
    assert.equal(roller.length, 44)
    assert.deepEqual(Object.keys(AU_MUAYENE_MOTORLARI).sort(), roller)
    assert.deepEqual(Object.keys(AU_PORTAL_BOLUMLERI).sort(), roller)
  })

  it('each motor has three prompts, AU-vs-TR note, and never invents a dose word in prompts', () => {
    for (const [rol, m] of Object.entries(AU_MUAYENE_MOTORLARI)) {
      assert.equal(m.kontrol.length, 3, rol)
      assert.ok(m.auTr.includes('AU:'), rol)
      assert.ok(m.auTr.includes('TR:'), rol)
      for (const satir of m.kontrol) {
        assert.equal(/\bmg\b|\bmcg\b|\bIU\b/i.test(satir), false, `${rol}: ${satir}`)
      }
    }
  })

  it('resolver returns null for unknown / empty role', () => {
    assert.equal(auMuayeneMotoru(null), null)
    assert.equal(auMuayeneMotoru('hair-transplant'), null)
    assert.equal(auMuayeneMotoru('cardiology')?.rol, 'cardiology')
  })
})
