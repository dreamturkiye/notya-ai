import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { planBaslangici, FISH_ILK_ONCE_SN, FISH_PLAN_ONCE_SN, FISH_UYANIK_GENLIK } from './fishCalar'

// NOTYA-SES-UYANIK-01
describe('planBaslangici', () => {
  it('starts the very first sound ahead of the clock', () => {
    assert.equal(planBaslangici({ zaman: 0, simdi: 3, ilkParca: true, sonBitis: -Infinity }), 3 + FISH_ILK_ONCE_SN)
  })
  it('starts the first sound after a long gap ahead of the clock', () => {
    assert.equal(planBaslangici({ zaman: 0, simdi: 40, ilkParca: true, sonBitis: 12 }), 40 + FISH_ILK_ONCE_SN)
  })
  it('does not delay the next sentence of the same answer', () => {
    assert.equal(planBaslangici({ zaman: 0, simdi: 14, ilkParca: true, sonBitis: 13.5 }), 14 + FISH_PLAN_ONCE_SN)
  })
  it('keeps chunks of one sentence back to back', () => {
    assert.equal(planBaslangici({ zaman: 20, simdi: 18, ilkParca: false, sonBitis: -Infinity }), 20)
  })
  it('the keep-alive is far below audibility', () => {
    assert.ok(FISH_UYANIK_GENLIK < 0.001 && FISH_UYANIK_GENLIK > 1 / 32768)
  })
})
