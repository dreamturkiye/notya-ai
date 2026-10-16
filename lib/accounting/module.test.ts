import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { defaultDocTypeForDoctorType, isDocTypeAllowedForDoctorType } from './module'

describe('accounting/module — doctor type <-> doc type locking', () => {
  it('defaults serbest meslek to e-SMM and şirket to e-Arşiv', () => {
    assert.equal(defaultDocTypeForDoctorType('serbest_meslek'), 'esmm')
    assert.equal(defaultDocTypeForDoctorType('sirket'), 'earsiv')
  })

  it('only allows e-SMM for serbest meslek', () => {
    assert.equal(isDocTypeAllowedForDoctorType('esmm', 'serbest_meslek'), true)
    assert.equal(isDocTypeAllowedForDoctorType('efatura', 'serbest_meslek'), false)
    assert.equal(isDocTypeAllowedForDoctorType('earsiv', 'serbest_meslek'), false)
  })

  it('only allows e-Fatura/e-Arşiv for şirket, never e-SMM', () => {
    assert.equal(isDocTypeAllowedForDoctorType('efatura', 'sirket'), true)
    assert.equal(isDocTypeAllowedForDoctorType('earsiv', 'sirket'), true)
    assert.equal(isDocTypeAllowedForDoctorType('esmm', 'sirket'), false)
  })
})
