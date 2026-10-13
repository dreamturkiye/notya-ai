/**
 * Runs once per country. A pack with a public-day list closes free rows on a full day.
 * A pack with no list is skipped. The working-pattern rule is not changed.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gunSatirlari } from '@/components/ulke/uygulama/Takvim'
import { ulkePaketi } from '../ulke'

const DUZEN = { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '12:00', sureDk: 60, molalar: [] as { baslangic: string; bitis: string }[] }

describe('calendar public days', () => {
  const k = ulkePaketi().resmiGunler

  it('a full public day offers no free row; a plain Friday still does', () => {
    if (!k) return
    const dolu = k.gunler(k.varsayilan, '2026-01-01', '2026-12-31').find((g) => !g.yarim)
    assert.ok(dolu, 'the pack lists a full public day in 2026')
    assert.equal(gunSatirlari(DUZEN, dolu.tarih, []).some((s) => s.tur === 'bos'), false)
    assert.equal(k.gunler(k.varsayilan, '2026-10-16', '2026-10-16').length, 0)
    assert.equal(gunSatirlari(DUZEN, '2026-10-16', []).some((s) => s.tur === 'bos'), true)
  })
})
