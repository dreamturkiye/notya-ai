import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pasi } from '../engines/score-calculator'
import { dermatolojiPayloadSchema } from '../schema'

describe('scores', () => {
  it('PASI fixture scores orta-range (≥10)', () => {
    const raw = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'psoriasis-orta.json'), 'utf8'))
    const { pasi_regions: r, ...payload } = raw
    assert.equal(dermatolojiPayloadSchema.safeParse(payload).success, true)
    const score = pasi(r)
    assert.equal(score, 12.9)
    assert.ok(score >= 10)
  })
})
