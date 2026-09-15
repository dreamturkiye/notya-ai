import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pasi } from '../engines/score-calculator'
import { dermatolojiPayloadSchema } from '../schema'
import { sarkCibaniFollowUpOverdue } from '../protocols/endemic-bzbh'

describe('scores', () => {
  it('PASI fixture scores orta-range (≥10)', () => {
    const raw = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'psoriasis-orta.json'), 'utf8'))
    const { pasi_regions: r, ...payload } = raw
    assert.equal(dermatolojiPayloadSchema.safeParse(payload).success, true)
    const score = pasi(r)
    assert.equal(score, 12.9)
    assert.ok(score >= 10)
  })

  it('şark çıbanı follow-up is overdue after 3 months inside the first year', () => {
    assert.equal(sarkCibaniFollowUpOverdue({
      startIso: '2026-01-01',
      lastVisitIso: '2026-01-01',
      todayIso: '2026-04-15',
    }), true)
    assert.equal(sarkCibaniFollowUpOverdue({
      startIso: '2026-01-01',
      lastVisitIso: '2026-04-01',
      todayIso: '2026-04-15',
    }), false)
  })
})
