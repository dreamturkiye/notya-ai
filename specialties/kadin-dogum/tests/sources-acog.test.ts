import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PROTOCOL_SOURCES, citeProtocol, UI_HINT_YASAL_VS_KLINIK } from '../protocols/sources'
import { ACOG_MAP } from '../protocols/acog-map'
import { TEST_WINDOWS, aneuploidyScreenDual } from '../engines/test-windows'

describe('acog citations', () => {
  it('sources.ts includes role pratik_altin_standart_tr_hekim for ACOG', () => {
    const acog = PROTOCOL_SOURCES.find((s) => s.id === 'acog')
    assert.equal(acog?.role, 'pratik_altin_standart_tr_hekim')
    assert.equal(PROTOCOL_SOURCES.find((s) => s.id === 'williams-26')?.role, 'obstetrik_ders_kitabi')
    assert.equal(PROTOCOL_SOURCES.find((s) => s.id === 'dobyr-2026')?.role, 'yasal_taban_sb')
  })

  it('citeProtocol leads with ACOG then DÖBYR then Williams', () => {
    const cites = citeProtocol('obstetrik')
    assert.equal(cites[0], 'acog')
    assert.equal(cites[1], 'dobyr-2026')
    assert.equal(cites[2], 'williams-26')
    assert.ok(cites.includes('temel-kd-4'))
  })

  it('ACOG map rows use needsLookup and do not invent bulletin numbers', () => {
    assert.ok(ACOG_MAP.length >= 10)
    assert.ok(ACOG_MAP.every((row) => row.pbNumber === null && row.needsLookup === true))
    assert.ok(ACOG_MAP.some((row) => row.topic === 'izlem_sikligi'))
    assert.ok(ACOG_MAP.some((row) => row.topic === 'aneuploidy_screening'))
  })

  it('NIPT vs SUT ikili/üçlü is a dual recommendation, not a collapse', () => {
    const dual = aneuploidyScreenDual()
    assert.equal(dual.conflict, true)
    assert.equal(dual.uiHint, UI_HINT_YASAL_VS_KLINIK)
    assert.ok(dual.sb_required.tests.some((t) => t.includes('P.901.120')))
    assert.ok(dual.acog_recommended.tests.some((t) => t.includes('NIPT')))
    assert.equal(TEST_WINDOWS.find((w) => w.id === 'nipt_optional')?.acog_aligned, true)
    assert.equal(TEST_WINDOWS.find((w) => w.id === 'triple_quad_afp')?.acog_aligned, false)
  })
})
