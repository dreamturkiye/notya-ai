import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ameliyatRitim } from '../engines/portal-cerrahi'

describe('estetik-cerrahi portal ritmi', () => {
  it('hasta ritmi greft, kcal, dB ve doz taşımaz', () => {
    const r = ameliyatRitim()
    assert.ok(r.length >= 2)
    assert.equal(r.some((s) => /\bgreft\b|\bkcal\b|\bdB\b|\bmL\b|\bünite\b|\bNeyzi\b/i.test(s)), false)
  })
})
