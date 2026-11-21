/**
 * SURE-SECIM-01 — duration is a quick choice; a prefilled number field is selected on focus so typing replaces it.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sayiAlaniMi, sayiAlaniOdak, tumunuSec } from './sayiGirdi'
import { HIZLI_SURELER, sureMetniCoz } from '@/components/doktor/SureSecici'

const alan = (ek: Record<string, unknown> = {}) => {
  let secildi = 0
  return { el: { tagName: 'INPUT', type: 'number', readOnly: false, disabled: false, getAttribute: () => null, select: () => { secildi++ }, ...ek }, sayi: () => secildi }
}

describe('number fields', () => {
  it('quick durations are 10/15/20/30/45/60; a typed duration commits only when it is a usable number', () => {
    assert.deepEqual([...HIZLI_SURELER], [10, 15, 20, 30, 45, 60])
    assert.equal(sureMetniCoz('30'), 30)
    assert.equal(sureMetniCoz(''), null, 'empty does not snap back to a default while typing')
    assert.equal(sureMetniCoz('2030'), null, 'the old appended value is refused')
    assert.equal(sureMetniCoz('3'), null)
    assert.equal(sureMetniCoz('90'), 90)
    assert.equal(sureMetniCoz('481'), null)
  })
  it('focus selects the whole prefilled value (and again after the tap, for iOS Safari)', () => {
    const a = alan()
    const g = globalThis as unknown as { window?: unknown }
    const eski = g.window
    const bekleyen: (() => void)[] = []
    g.window = { setTimeout: (f: () => void) => { bekleyen.push(f); return 0 } }
    try {
      tumunuSec({ currentTarget: a.el })
      assert.equal(a.sayi(), 1)
      bekleyen.forEach((f) => f())
      assert.equal(a.sayi(), 2)
    } finally { g.window = eski }
  })
  it('the frame-wide listener selects number fields only', () => {
    assert.equal(sayiAlaniMi(alan().el), true)
    assert.equal(sayiAlaniMi(alan({ type: 'text', getAttribute: (k: string) => (k === 'inputmode' ? 'decimal' : null) }).el), true)
    assert.equal(sayiAlaniMi(alan({ type: 'text' }).el), false)
    assert.equal(sayiAlaniMi(alan({ readOnly: true }).el), false)
    assert.equal(sayiAlaniMi(alan({ tagName: 'TEXTAREA' }).el), false)
    assert.equal(sayiAlaniMi(null), false)
    const a = alan(); sayiAlaniOdak({ target: a.el }); assert.ok(a.sayi() >= 1)
    const b = alan({ type: 'email' }); sayiAlaniOdak({ target: b.el }); assert.equal(b.sayi(), 0)
  })
})
