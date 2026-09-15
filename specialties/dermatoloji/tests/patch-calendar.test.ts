import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { patchStatus, plannedReads } from '../engines/patch-calendar'

describe('patch-calendar', () => {
  it('apply day 0 → read day 2 and day 4', () => {
    assert.deepEqual(plannedReads('2026-04-01'), { d2: '2026-04-03', d4: '2026-04-05' })
  })

  it('missed D2 is overdue, not a silent skip', () => {
    const course = {
      series: 'european_baseline' as const,
      appliedAt: '2026-04-01',
      readD2: null,
      readD4: null,
      photoIds: [],
      positives: [],
    }
    assert.equal(patchStatus(course, '2026-04-03'), 'open_d2')
    assert.equal(patchStatus(course, '2026-04-04'), 'overdue_d2')
  })

  it('missed D4 is overdue', () => {
    const course = {
      series: 'european_baseline' as const,
      appliedAt: '2026-04-01',
      readD2: '2026-04-03',
      readD4: null,
      photoIds: ['ph-d2'],
      positives: [],
    }
    assert.equal(patchStatus(course, '2026-04-06'), 'overdue_d4')
  })
})
