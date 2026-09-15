import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeImage,
  asistanSelfApproveBlocked,
  uzmanOnay,
  VISION_DISCLAIMER,
} from '../imaging/vision-tools'

describe('vision-tools', () => {
  it('analyze_image returns draft only', () => {
    const read = analyzeImage({
      assetIds: ['ph1'],
      task: 'morfoloji',
      actor: 'asistan',
      observations: 'plaque, silvery scale, extensor elbow',
    })
    assert.equal(read.status, 'draft')
    assert.equal(read.approved_by, null)
    assert.equal(read.disclaimer, VISION_DISCLAIMER)
  })

  it('dual-sign cannot self-approve as asistan', () => {
    const read = analyzeImage({
      assetIds: ['ph1'],
      task: 'abcde_gozlem',
      actor: 'asistan',
      observations: 'ugly duckling candidate',
    })
    assert.equal(asistanSelfApproveBlocked(read, 'asistan'), true)
    const blocked = uzmanOnay(read, 'asistan')
    assert.equal(blocked.ok, false)
    const signed = uzmanOnay(read, 'uzman')
    assert.equal(signed.ok, true)
    if (signed.ok) {
      assert.equal(signed.read.status, 'onayli')
      assert.equal(signed.read.approved_by, 'uzman')
    }
  })
})
