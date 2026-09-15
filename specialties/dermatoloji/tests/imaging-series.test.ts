import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PhotoAsset } from '../schema'
import { hasOverviewAndCloseup, sameRegion } from '../imaging/capture-protocol'
import { attachPhotoToTimepoint, timepointAt } from '../imaging/series'
import { pairBeforeAfter } from '../imaging/before-after'
import { pinNode, emptyMap } from '../imaging/total-body-map'

function photo(over: Partial<PhotoAsset> & Pick<PhotoAsset, 'id' | 'kind' | 'capturedAt'>): PhotoAsset {
  return {
    coreImageId: `core-${over.id}`,
    lesionId: 'L1',
    region: 'extensor-elbow-L',
    genital_consent: false,
    pediatric_consent: false,
    education_anonymized: false,
    patient_share: false,
    ...over,
  }
}

describe('imaging-series', () => {
  it('series timepoint month-0 and month-3 exist on the fixture', () => {
    const series = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'lesion-photo-series.json'), 'utf8'))
    assert.ok(timepointAt(series, 'month-0'))
    assert.ok(timepointAt(series, 'month-3'))
    const grown = attachPhotoToTimepoint(series, 'month-1', 'ph-m1', '2026-02-10')
    assert.equal(timepointAt(grown, 'month-1')?.photoIds[0], 'ph-m1')
  })

  it('before-after interval is 90 days when dates are 10 Jan → 10 Apr', () => {
    const before = photo({ id: 'ph-m0-yakin', kind: 'islem_oncesi', capturedAt: '2026-01-10' })
    const after = photo({ id: 'ph-m3-yakin', kind: 'islem_sonrasi', capturedAt: '2026-04-10' })
    const pair = pairBeforeAfter(before, after, 'L1')
    assert.equal('intervalDays' in pair && pair.intervalDays, 90)
  })

  it('rejects before-after when region mismatches', () => {
    const before = photo({ id: 'a', kind: 'klinik_yakin', capturedAt: '2026-01-10' })
    const after = photo({ id: 'b', kind: 'klinik_yakin', capturedAt: '2026-04-10', region: 'scalp' })
    const pair = pairBeforeAfter(before, after, 'L1')
    assert.equal('ok' in pair && pair.ok, false)
    assert.equal(sameRegion(before, after).ok, false)
  })

  it('overview + close-up required; total-body map pins by node id', () => {
    const photos = [
      photo({ id: 'g', kind: 'klinik_genel', capturedAt: '2026-01-10' }),
      photo({ id: 'y', kind: 'klinik_yakin', capturedAt: '2026-01-10' }),
    ]
    assert.equal(hasOverviewAndCloseup(photos, 'L1').ok, true)
    const map = pinNode(emptyMap('fotofinder', 6), 'node-L1')
    assert.deepEqual(map.nodeIds, ['node-L1'])
  })
})
