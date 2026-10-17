/** MUAYENE-EKLERI-01 — kill switch: varsayılan açık, tek değişkenle kapanır. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { muayeneEkleriAcikMi } from './bayrak'

describe('NOTYA_MUAYENE_EKLERI kill switch', () => {
  it('tanımsız / boş → AÇIK (varsayılan)', () => {
    assert.equal(muayeneEkleriAcikMi({}), true)
    assert.equal(muayeneEkleriAcikMi({ NOTYA_MUAYENE_EKLERI: '' }), true)
    assert.equal(muayeneEkleriAcikMi({ NOTYA_MUAYENE_EKLERI: 'on' }), true)
  })
  for (const v of ['off', 'OFF', ' off ', '0', 'false', 'kapali', 'Kapalı', 'disabled']) {
    it(`"${v}" → KAPALI`, () => assert.equal(muayeneEkleriAcikMi({ NOTYA_MUAYENE_EKLERI: v }), false))
  }
})
