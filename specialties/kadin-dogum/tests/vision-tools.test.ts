import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeUsg,
  asistanSelfApproveBlocked,
  uzmanOnay,
  VISION_DISCLAIMER,
} from '../imaging/vision-tools'

describe('kd vision-tools', () => {
  it('analyze_usg returns draft only', () => {
    const read = analyzeUsg({
      studyIds: ['s1'],
      task: 'anomali_checklist',
      actor: 'asistan',
      findings: '18–22w survey; dating sat',
    })
    assert.equal(read.status, 'draft')
    assert.equal(read.approved_by, null)
    assert.equal(read.disclaimer, VISION_DISCLAIMER)
  })

  it('asistan cannot self-approve a VisionRead', () => {
    const read = analyzeUsg({
      studyIds: ['s1'],
      task: 'buyume_efw',
      actor: 'asistan',
      findings: 'EFW serial',
    })
    assert.equal(asistanSelfApproveBlocked(read, 'asistan'), true)
    const blocked = uzmanOnay(read, 'asistan')
    assert.equal(blocked.ok, false)
    const signed = uzmanOnay(read, 'uzman')
    assert.equal(signed.ok, true)
    if (signed.ok) {
      assert.equal(signed.read.status, 'uzman_onayli')
      assert.equal(signed.read.approved_by, 'uzman')
    }
  })
})
