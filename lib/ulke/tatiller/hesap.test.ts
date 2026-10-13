import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ninciHaftaGunu, paskalya, sonHaftaGunu } from './hesap'

describe('public-day date rules', () => {
  it('Easter Sunday for 2026, 2027 and 2028', () => {
    assert.equal(paskalya(2026), '2026-04-05')
    assert.equal(paskalya(2027), '2027-03-28')
    assert.equal(paskalya(2028), '2028-04-16')
  })

  it('the third Monday of January 2026 is the 19th, and the last Monday of May 2026 is the 25th', () => {
    assert.equal(ninciHaftaGunu(2026, 1, 1, 3), '2026-01-19')
    assert.equal(sonHaftaGunu(2026, 5, 1), '2026-05-25')
  })
})
