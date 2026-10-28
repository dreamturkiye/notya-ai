/**
 * AU-PEDIATRI-GOLD-01a — SOAP locks cover every offered role; foreign role gets none;
 * paediatrics lock forbids inventing percentiles; note instruction carries the lock.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_ASISTAN_ADLARI } from './asistanAdlari'
import { AU_KLINIK } from './index'
import { AU_SOAP_KILITLERI, auSoapKilidi } from './soapKilitleri'

const D = 'en-AU' as const

describe('AU SOAP locks (GOLD-01a)', () => {
  it('every offered role has a lock; unknown role has none', () => {
    for (const rol of Object.keys(AU_ASISTAN_ADLARI)) {
      assert.ok(AU_SOAP_KILITLERI[rol as keyof typeof AU_SOAP_KILITLERI], rol)
      const blok = auSoapKilidi(rol)
      assert.ok(blok && /AUSTRALIAN SOAP LOCK/.test(blok), rol)
      assert.match(blok!, /UNBREAKABLE RULES/)
      assert.match(blok!, /Triple Zero \(000\)/)
    }
    assert.equal(auSoapKilidi('no-such-role'), null)
    assert.equal(auSoapKilidi('hair-transplant'), null)
  })

  it('paediatrics lock keeps growth and immunisation honest; cardiology does not get head circumference rules', () => {
    const p = auSoapKilidi('paediatrics')!
    assert.match(p, /percentile/i)
    assert.match(p, /Immunisation/)
    const c = auSoapKilidi('cardiology')!
    assert.doesNotMatch(c, /head circumference/i)
    assert.doesNotMatch(c, /percentile/i)
  })

  it('notTalimati for each offered role includes the SOAP lock', () => {
    for (const rol of Object.keys(AU_ASISTAN_ADLARI)) {
      const t = AU_KLINIK.notTalimati(D, rol)
      assert.ok(t, rol)
      assert.match(t!, /AUSTRALIAN SOAP LOCK/, rol)
    }
  })

  it('allied lock forbids medical diagnosis', () => {
    assert.match(auSoapKilidi('physiotherapy')!, /not a medical diagnosis/i)
    assert.match(auSoapKilidi('clinical-psychology')!, /not a medical diagnosis/i)
  })
})
