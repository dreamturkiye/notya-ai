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

  it('citeProtocol leads with SB/TR then ACOG (TR-first overrides prior ACOG-first ranking)', () => {
    const cites = citeProtocol('obstetrik')
    assert.equal(cites[0], 'dobyr-2026')
    assert.equal(cites[1], 'temel-kd-4')
    assert.equal(cites[2], 'acog')
    assert.equal(cites[3], 'williams-26')
    assert.ok(cites.indexOf('dobyr-2026') < cites.indexOf('acog'))
  })

  it('ACOG map rows use verified September 2026 titles-list numbers', () => {
    assert.ok(ACOG_MAP.length >= 10)
    assert.ok(ACOG_MAP.every((row) => row.needsLookup === false && Number.isInteger(row.pbNumber)))
    assert.equal(ACOG_MAP.find((row) => row.topic === 'izlem_sikligi')?.pbNumber, 8)
    assert.equal(ACOG_MAP.find((row) => row.topic === 'gdm_ogtt')?.pbNumber, 190)
    assert.equal(ACOG_MAP.find((row) => row.topic === 'preeclampsia_hypertension')?.pbNumber, 222)
    assert.equal(ACOG_MAP.find((row) => row.topic === 'gbs')?.pbNumber, 797)
    assert.equal(ACOG_MAP.find((row) => row.topic === 'fetal_surveillance_nst_bpp_doppler')?.pbNumber, 229)
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
