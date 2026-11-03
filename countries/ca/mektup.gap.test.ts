import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CA_KLINIK } from './klinik'
import { CA_UZANTI } from './uzanti'

describe('CA letter studio scaffold', () => {
  it('offers family-physician/referral/patient; no AU care-plan/MBS', () => {
    assert.ok(CA_KLINIK.mektupTalimati!('gp'))
    assert.match(CA_KLINIK.mektupTalimati!('gp')!, /Canadian English/)
    assert.equal(CA_KLINIK.mektupTalimati!('mhcp'), null)
    assert.ok(CA_UZANTI.mektup)
  })
})
