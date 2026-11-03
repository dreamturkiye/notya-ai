/**
 * AU-RIZA-01 (2026-11-03) - whose consent the recording box asks for, and what is stored for the audit.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rizaSurumuYaz, rizaVeliMi, VELI_EKI, VELI_RIZA_YASI } from './rizaVeli'

describe('rizaVeliMi: the parent / guardian sentence for a patient under 18', () => {
  it('under 18 on the day = guardian; 18 on the birthday itself = the patient', () => {
    assert.equal(VELI_RIZA_YASI, 18)
    assert.equal(rizaVeliMi('2010-06-15', '2026-11-03'), true)
    assert.equal(rizaVeliMi('2008-11-04', '2026-11-03'), true, 'one day before the 18th birthday')
    assert.equal(rizaVeliMi('2008-11-03', '2026-11-03'), false, 'the 18th birthday')
    assert.equal(rizaVeliMi('1980-01-01', '2026-11-03'), false)
    assert.equal(rizaVeliMi('2026-11-03', '2026-11-03'), true, 'a newborn')
  })
  it('an unknown or malformed birth date keeps the adult sentence (never a guess)', () => {
    for (const d of ['', null, undefined, 'x', '2027-01-01']) assert.equal(rizaVeliMi(d as string, '2026-11-03'), false, String(d))
  })
})

describe('rizaSurumuYaz: the stored version stamp says which sentence was confirmed', () => {
  it('the pack version, plus the guardian mark when the guardian sentence was shown', () => {
    assert.equal(rizaSurumuYaz('au-2026-10-24', false), 'au-2026-10-24')
    assert.equal(rizaSurumuYaz('au-2026-10-24', true), `au-2026-10-24${VELI_EKI}`)
  })
})
