import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gebelikHaftasiPedCoz, pediDogumBirlesik, pediIntakeDogumAlanlari } from './pediIntakeDogum'

describe('NOTYA-CEK-HASTA-01 pediIntakeDogum', () => {
  it('intake seçeneklerinden prematüre / term hafta çözer', () => {
    assert.equal(gebelikHaftasiPedCoz('37 haftadan önce'), 34)
    assert.ok((gebelikHaftasiPedCoz('37-38 hafta') ?? 0) >= 37)
    assert.equal(gebelikHaftasiPedCoz('39 hafta ve üstü'), 39)
    assert.equal(gebelikHaftasiPedCoz('32+4'), 32.57)
    assert.equal(gebelikHaftasiPedCoz('Hatırlamıyorum'), null)
  })

  it('form alanlarından doğum kilosu + hafta okur; kart öncelikli birleşir', () => {
    const a = pediIntakeDogumAlanlari({
      gebelikHaftasiPed: '37 haftadan önce',
      dogumKilosuPed: '1480 g',
    })
    assert.equal(a.gebelikHaftasi, 34)
    assert.equal(a.dogumKiloGr, 1480)
    const bir = pediDogumBirlesik({ gebelikHaftasi: 31, dogumKiloGr: null }, a)
    assert.equal(bir.gebelikHaftasi, 31)
    assert.equal(bir.dogumKiloGr, 1480)
  })
})
