import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NZ_KLINIK } from './klinik'
import { NZ_UZANTI } from './uzanti'

describe('NZ letter studio scaffold', () => {
  it('offers GP/referral/patient in NZ English; no AU care-plan/MBS', () => {
    assert.ok(NZ_KLINIK.mektupTalimati!('patient'))
    assert.match(NZ_KLINIK.mektupTalimati!('gp')!, /New Zealand English/)
    assert.equal(NZ_KLINIK.mektupTalimati!('tca'), null)
    assert.ok(NZ_UZANTI.pmsEntegrasyon)
  })
})
