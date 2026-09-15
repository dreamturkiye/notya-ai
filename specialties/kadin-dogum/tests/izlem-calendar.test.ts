import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildIzlemCalendar,
  privateOverlay,
  sbMinimumFour,
  evaluateCadence,
  visitCountAdequacy,
} from '../engines/izlem-calendar'
import { UI_HINT_YASAL_VS_KLINIK } from '../protocols/sources'

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
    assert.ok(low.every((v) => v.sb_required === false))
    assert.ok(low.every((v) => v.acog_recommended === true))
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

  it('low-risk at 30w exposes both sb_required and acog_recommended (SB may not be due; ACOG q2w is due)', () => {
    const cal = buildIzlemCalendar({
      risk_class: 'dusuk',
      booking_ga_weeks: 10,
      episode_status: 'gebe',
    })
    const at30 = cal.filter((v) => Math.abs(v.ga_or_pp_day - 30) <= 1)
    assert.ok(at30.some((v) => v.sb_required))
    assert.ok(at30.some((v) => v.acog_recommended))
    assert.ok(at30.some((v) => v.source === 'acog' && v.sb_required === false))

    const cadence = evaluateCadence({
      ga_weeks: 30,
      completed_sb_izlem: [1, 2, 3],
      risk_class: 'dusuk',
    })
    assert.equal(cadence.sb_required.due, false)
    assert.equal(cadence.acog_recommended.due, true)
    assert.equal(cadence.conflict, true)
    assert.equal(cadence.uiHint, UI_HINT_YASAL_VS_KLINIK)
  })

  it('4 SB visits can satisfy sb_required while acog_recommended still wants more', () => {
    const row = visitCountAdequacy({
      completed_sb_izlem: 4,
      completed_acog_visits: 4,
      risk_class: 'dusuk',
    })
    assert.equal(row.sb_required.enough, true)
    assert.equal(row.acog_recommended.enough, false)
    assert.equal(row.conflict, true)
    assert.equal(row.uiHint, UI_HINT_YASAL_VS_KLINIK)
    assert.ok(row.acog_recommended.min > 4)
  })
})
