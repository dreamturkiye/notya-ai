import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dosyaOncelik } from '../engines/dosya'
import { acilCumlesi, intakeAcilMi } from '../engines/acil'

describe('medikal-estetik dosya ve acil', () => {
  it('112, eksik rıza ve izlem sırası', () => {
    assert.equal(dosyaOncelik('112 cümlesi', true), '112')
    assert.equal(dosyaOncelik('', false), 'riza-eksik')
    assert.equal(dosyaOncelik(null, true), 'izlem')
  })
  it('acil cümlesi 112 taşır; Yok intake sayılmaz', () => {
    assert.match(acilCumlesi(), /112/)
    assert.equal(intakeAcilMi('Yok'), false)
  })
})
