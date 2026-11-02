import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ulkeTicari } from './ulkeTicari'
import { gunlukNotLimiti } from './ucretsizPlan'

describe('AU freemium note-only (does not touch founding)', () => {
  it('AU ships ucretsiz.gunlukNot=5 while founding seat config stays 20', () => {
    const a = ulkeTicari('au')
    assert.ok(a?.ucretsiz)
    assert.equal(a!.ucretsiz!.gunlukNot, 5)
    assert.equal(a!.kurucu?.koltuk, 20)
  })

  it('other countries have no freemium wedge', () => {
    for (const k of ['us', 'gb', 'ca', 'nz', 'uz', 'tr', null, '']) {
      assert.equal(ulkeTicari(k)?.ucretsiz, undefined)
    }
  })

  it('live subscription keeps full pack ceiling; abonesiz uses freemium', async () => {
    const sb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [{ status: 'active', trial_ends_at: null, current_period_start: '2026-11-01' }], error: null }),
            }),
          }),
        }),
      }),
    } as never
    assert.equal(await gunlukNotLimiti(sb, 'u1', 'au', 200), 200)

    const sbYok = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    } as never
    assert.equal(await gunlukNotLimiti(sbYok, 'u1', 'au', 200), 5)
  })
})
