import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gopIsotretinoin, acitretinPregnancyBanYears } from '../engines/gop-isotretinoin'

describe('gop-isotretinoin', () => {
  it('blocks when two contraception or fresh hCG is missing', () => {
    const blocked = gopIsotretinoin({
      two_contraception: false,
      hcg_iso: '2026-01-01',
      hcg_negative: true,
      cycle_day: 2,
      rx_days: 30,
      start_iso: '2026-01-05',
      today_iso: '2026-01-05',
    })
    assert.equal(blocked.allowed, false)
  })

  it('blocks stale beta-hCG (≥14 days)', () => {
    const blocked = gopIsotretinoin({
      two_contraception: true,
      hcg_iso: '2025-12-01',
      hcg_negative: true,
      cycle_day: 2,
      rx_days: 30,
      start_iso: '2026-01-05',
      today_iso: '2026-01-05',
    })
    assert.equal(blocked.allowed, false)
    if (!blocked.allowed) assert.ok(blocked.blocks.some((b) => b.includes('14')))
  })

  it('allows a complete GÖP pack', () => {
    const ok = gopIsotretinoin({
      two_contraception: true,
      hcg_iso: '2026-01-03',
      hcg_negative: true,
      cycle_day: 2,
      rx_days: 30,
      start_iso: '2026-01-05',
      today_iso: '2026-01-05',
    })
    assert.equal(ok.allowed, true)
  })

  it('acitretin pregnancy ban is 3 years', () => {
    assert.equal(acitretinPregnancyBanYears(), 3)
  })
})
