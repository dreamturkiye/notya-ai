/** Letter studio parity — US pack offers PCP/referral/patient; no AU Medicare care-plan. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { US_KLINIK } from './klinik'
import { US_UZANTI } from './uzanti'
import { MEKTUP_TURLERI } from '@/lib/ulke/mektup/sabitler'

describe('US letter studio parity', () => {
  it('offers three letter kinds and refuses AU care-plan kinds', () => {
    for (const t of MEKTUP_TURLERI) {
      assert.ok(US_KLINIK.mektupTalimati!(t))
      assert.match(US_KLINIK.mektupTalimati!(t)!, /American English/)
    }
    assert.equal(US_KLINIK.mektupTalimati!('gpmp'), null)
    assert.equal(US_KLINIK.mbsOneriTalimati, undefined)
  })
  it('uzanti draws letter + export without AU PMS vendor names', () => {
    assert.ok(US_UZANTI.mektup)
    assert.ok(US_UZANTI.pmsEntegrasyon)
    assert.equal(US_UZANTI.bakimPlani, undefined)
    assert.doesNotMatch(JSON.stringify(US_UZANTI.pmsEntegrasyon), /Best Practice|Genie|Gentu/)
  })
})
