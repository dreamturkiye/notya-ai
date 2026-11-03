import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_KLINIK } from './klinik'
import { UZ_UZANTI } from './uzanti'

describe('UZ letter studio scaffold', () => {
  it('offers usual-doctor/referral/patient letters; no AU care-plan/MBS', () => {
    assert.ok(UZ_KLINIK.mektupTalimati!('gp'))
    assert.match(UZ_KLINIK.mektupTalimati!('gp')!, /Uzbekistan/)
    assert.equal(UZ_KLINIK.mektupTalimati!('ccmp'), null)
    assert.ok(UZ_UZANTI.mektup)
    assert.match(UZ_UZANTI.mektup!.baslik, /Xat/)
  })
})
