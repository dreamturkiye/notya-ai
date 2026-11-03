import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { GB_KLINIK } from './klinik'
import { GB_UZANTI } from './uzanti'

describe('GB letter studio scaffold', () => {
  it('offers GP/referral/patient in British English; no AU care-plan/MBS', () => {
    assert.ok(GB_KLINIK.mektupTalimati!('gp'))
    assert.match(GB_KLINIK.mektupTalimati!('gp')!, /British English/)
    assert.equal(GB_KLINIK.mektupTalimati!('gpmp'), null)
    assert.equal(GB_KLINIK.mbsOneriTalimati, undefined)
    assert.ok(GB_UZANTI.mektup)
    assert.doesNotMatch(JSON.stringify(GB_UZANTI.pmsEntegrasyon), /Best Practice|Genie|Gentu/)
  })
})
