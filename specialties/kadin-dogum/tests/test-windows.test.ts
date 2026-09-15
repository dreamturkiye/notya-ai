import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  antiDIndicated,
  evaluateWindowsAtWeeks,
  souvenir3d4d,
  windowStatus,
  TEST_WINDOWS,
} from '../engines/test-windows'
import { parseGaToken } from '../engines/dates'

describe('test-windows', () => {
  const ikili = TEST_WINDOWS.find((w) => w.id === 'ikili_nt')!

  it('window 11+0–13+6 is closed before 11+0', () => {
    assert.equal(windowStatus(ikili, parseGaToken('10+6'), false), 'not_yet')
  })

  it('window 11+0–13+6 is open at 11+0 and 13+6', () => {
    assert.equal(windowStatus(ikili, parseGaToken('11+0'), false), 'open')
    assert.equal(windowStatus(ikili, parseGaToken('13+6'), false), 'open')
  })

  it('missed 11+0–13+6 is overdue, not a silent skip', () => {
    assert.equal(windowStatus(ikili, parseGaToken('14+0'), false), 'overdue')
    const row = evaluateWindowsAtWeeks(14, 0).find((w) => w.id === 'ikili_nt')
    assert.equal(row?.status, 'overdue')
  })

  it('Anti-D only if Rh− IDC−', () => {
    assert.equal(antiDIndicated('D-', 'negative'), true)
    assert.equal(antiDIndicated('D-', 'positive'), false)
    assert.equal(antiDIndicated('D+', 'negative'), false)
    assert.equal(antiDIndicated('unknown', 'not_tested'), false)
  })

  it('3D/4D souvenir is flagged non-diagnostic', () => {
    const flag = souvenir3d4d(28)
    assert.equal(flag.eligible, true)
    assert.equal(flag.non_diagnostic, true)
    assert.equal(TEST_WINDOWS.find((w) => w.id === 'souvenir_3d4d')?.non_diagnostic, true)
  })
})
