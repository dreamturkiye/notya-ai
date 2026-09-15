import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { biyometriPersentil, hadlockEfw } from './fetalBiyometri'

describe('fetalBiyometri (INTERGROWTH-21st)', () => {
  it('matches the official table exactly at whole weeks (HC 20wk p50 = 172.5mm)', () => {
    const s = biyometriPersentil('hc', 172.5, 20)
    assert.ok(s)
    assert.equal(s!.p50, 172.5)
    assert.equal(s!.persentil, 50)
  })

  it('matches the official table at another parameter/week (FL 28wk p3 = 47.3mm)', () => {
    const s = biyometriPersentil('fl', 47.3, 28)
    assert.ok(s)
    assert.equal(s!.persentil, 3)
  })

  it('interpolates between whole weeks (HC 24.5wk near p50)', () => {
    const s = biyometriPersentil('hc', 225, 24.5)
    assert.ok(s)
    assert.ok(s!.persentil >= 45 && s!.persentil <= 55, `expected ~50th, got ${s!.persentil}`)
  })

  it('refuses out-of-range gestational age rather than guessing', () => {
    assert.equal(biyometriPersentil('hc', 100, 13), null)
    assert.equal(biyometriPersentil('hc', 100, 41), null)
  })

  it('flags low/high status at the extremes', () => {
    const dusuk = biyometriPersentil('ac', 173.3, 24) // tablodaki p3 değeri
    assert.equal(dusuk!.durum, 'dusuk')
    const yuksek = biyometriPersentil('ac', 209.0, 24) // tablodaki p97 değeri
    assert.equal(yuksek!.durum, 'yuksek')
  })

  it('computes a plausible Hadlock EFW', () => {
    const efw = hadlockEfw(300, 300, 60)
    assert.ok(efw && efw > 1800 && efw < 2600, `expected ~2100g, got ${efw}`)
  })
})
