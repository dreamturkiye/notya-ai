import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { meslektasSelamSatiri } from './selam'

// NOTYA-SELAM-01: the 10th-session greeting never states a start hour that is not a morning.
const temel = { seans: 10, dahaOnceGosterildi: false, kuralSayisi: 3 }
describe('meslektasSelamSatiri start hour', () => {
  it('omits a 01:00 start', () => {
    const s = meslektasSelamSatiri({ ...temel, rutinBaslangic: '01:00' }) || ''
    assert.ok(s.length > 0)
    assert.ok(!s.includes('01:00'))
  })
  it('omits an evening start', () => {
    const s = meslektasSelamSatiri({ ...temel, rutinBaslangic: '17:00' }) || ''
    assert.ok(!s.includes('17:00'))
  })
  it('keeps a morning start', () => {
    const s = meslektasSelamSatiri({ ...temel, rutinBaslangic: '08:00' }) || ''
    assert.ok(s.includes('08:00'))
  })
  it('keeps working without a start hour', () => {
    const s = meslektasSelamSatiri({ ...temel, rutinBaslangic: null }) || ''
    assert.ok(s.includes('3'))
  })
})
