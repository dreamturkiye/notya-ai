import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { UsgSeriesPayload, UsgStudyPayload } from '../schema'
import { lockSeriesToDating, markSouvenir3d4d, detailedAndGrowthPair } from '../imaging/usg-series'
import { isNstCategory } from '../imaging/nst-ctg'

function study(over: Partial<UsgStudyPayload> & Pick<UsgStudyPayload, 'id' | 'kind' | 'datingMethod'>): UsgStudyPayload {
  return {
    coreImageId: `core-${over.id}`,
    gaWeeksDays: { weeks: 20, days: 0 },
    fetusId: 'A',
    measurements: {
      crl: undefined,
      nt: undefined,
      nb: undefined,
      bpd: undefined,
      hc: undefined,
      ac: undefined,
      fl: undefined,
      efw: undefined,
      afi: undefined,
      cervixMm: undefined,
      pi: undefined,
      ri: undefined,
      dv: undefined,
    },
    kvkk_fetal_image_consent: true,
    dicomId: undefined,
    nonDiagnostic: undefined,
    kvkk_nipt_karyotype_consent: undefined,
    ...over,
  }
}

describe('imaging-usg', () => {
  it('USG series is locked to the episode dating method', () => {
    const series: UsgSeriesPayload = {
      episodeId: 'ep-1',
      datingMethod: 'sat',
      studies: [
        study({ id: 's1', kind: 'ayrintili_18_22', datingMethod: 'sat', gaWeeksDays: { weeks: 20, days: 0 } }),
        study({ id: 's2', kind: 'buyume', datingMethod: 'sat', gaWeeksDays: { weeks: 32, days: 0 } }),
      ],
    }
    assert.equal(lockSeriesToDating(series, 'sat'), true)
    assert.equal(lockSeriesToDating(series, 'crl'), false)
    const pair = detailedAndGrowthPair(series)
    assert.equal(pair.detailed?.id, 's1')
    assert.equal(pair.growth?.id, 's2')
  })

  it('3D/4D souvenir is nonDiagnostic', () => {
    const souvenir = markSouvenir3d4d(study({ id: 's3', kind: 'buyume', datingMethod: 'sat' }))
    assert.equal(souvenir.kind, '3d4d_hatira')
    assert.equal(souvenir.nonDiagnostic, true)
  })

  it('NST category is I | II | III', () => {
    assert.equal(isNstCategory('I'), true)
    assert.equal(isNstCategory('II'), true)
    assert.equal(isNstCategory('III'), true)
    assert.equal(isNstCategory('IV'), false)
  })
})
