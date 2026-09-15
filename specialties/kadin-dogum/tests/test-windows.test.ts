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

  it('doctor-facing window titles are Turkish (abbreviations stay)', () => {
    const byId = Object.fromEntries(TEST_WINDOWS.map((w) => [w.id, w.label]))
    assert.equal(byId.uterin_doppler, 'Uterin arter Doppler (PE/IUGR endikasyonu varsa)')
    assert.equal(byId.ogtt_gdm, '75g OGTT veya 50+100, CBC, IDC (Rh− ise)')
    assert.equal(byId.nst_bpp_growth, 'NST / BPP / büyüme USG / UA–MCA Doppler (endikasyon varsa)')
    assert.equal(byId.gbs_prezentasyon, 'GBS (protokole göre) + prezentasyon USG')
    assert.equal(byId.souvenir_3d4d, '24–32. hafta 3D/4D hatıra')
    const copy = TEST_WINDOWS.flatMap((w) => [w.label, ...(w.notes || []), w.acog_note || '']).join('\n')
    assert.doesNotMatch(copy, /\bindicated\b/i)
    assert.doesNotMatch(copy, /\bas indicated\b/i)
    assert.doesNotMatch(copy, /\bif protocol\b/i)
    assert.doesNotMatch(copy, /\bif Rh/i)
    assert.doesNotMatch(copy, /\bfree β-hCG\b/)
    assert.doesNotMatch(copy, /\bper protocol\b/i)
    assert.doesNotMatch(copy, /\bout of pocket\b/i)
    assert.doesNotMatch(copy, /\bdiagnosis not screening\b/i)
  })
})
