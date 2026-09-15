import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildIzlemCalendar,
  privateOverlay,
  sbMinimumFour,
} from '../engines/izlem-calendar'

describe('izlem-calendar', () => {
  it('late booker still receives izlem 1', () => {
    const visits = sbMinimumFour(16)
    const izlem1 = visits.find((v) => v.izlem_no === 1)
    assert.ok(izlem1)
    assert.equal(izlem1?.late_booking, true)
    assert.equal(izlem1?.sb_required, true)
    assert.equal(izlem1?.duration_min, 30)
    assert.equal(izlem1?.ga_or_pp_day, 16)
    assert.equal(visits.filter((v) => v.kind === 'sb_izlem').length, 4)
  })

  it('high risk densifies the private overlay versus düşük risk', () => {
    const low = privateOverlay('dusuk')
    const high = privateOverlay('yuksek')
    assert.ok(high.length > low.length)
    assert.ok(high.every((v) => v.checklist.includes('NST')))
  })

  it('lohusa episode returns six visits (3 hospital + 3 ASM)', () => {
    const visits = buildIzlemCalendar({
      risk_class: 'dusuk',
      booking_ga_weeks: 10,
      episode_status: 'lohusa',
    })
    assert.equal(visits.length, 6)
    assert.equal(visits.filter((v) => v.kind === 'lohusa_hastane').length, 3)
    assert.equal(visits.filter((v) => v.kind === 'lohusa_asm').length, 3)
  })
})
