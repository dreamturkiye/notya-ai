import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { medicareKartGecerli, providerNoGecerli } from './kimlik'

describe('Medicare card number — checksum read 2026-10-19 from clearwater.com.au/code/medicare', () => {
  it('accepts a 10-digit card and the same card with a reference digit', () => {
    // 21234567 weighted 1,3,7,9,1,3,7,9 sums to 170, so the checksum digit is 0.
    assert.equal(medicareKartGecerli('2123456701'), true)
    assert.equal(medicareKartGecerli('2123 45670 1'), true)
    assert.equal(medicareKartGecerli('21234567011'), true)
  })

  it('rejects a wrong checksum, a first digit outside 2–6, and a short number', () => {
    assert.equal(medicareKartGecerli('2123456711'), false)
    assert.equal(medicareKartGecerli('1123456701'), false)
    assert.equal(medicareKartGecerli('212345670'), false)
    assert.equal(medicareKartGecerli(''), false)
    assert.equal(medicareKartGecerli('   '), false)
  })
})

describe('Medicare provider number — checksum read 2026-10-19 from clearwater.com.au/code/provider', () => {
  it('accepts stem 486674, location Y, check B', () => {
    assert.equal(providerNoGecerli('486674YB'), true)
    assert.equal(providerNoGecerli('486674 YB'), true)
  })

  it('rejects a wrong check character, a forbidden location letter, and a non-number', () => {
    assert.equal(providerNoGecerli('486674YA'), false)
    assert.equal(providerNoGecerli('486674IB'), false)
    assert.equal(providerNoGecerli('486674SB'), false)
    assert.equal(providerNoGecerli(''), false)
  })
})
