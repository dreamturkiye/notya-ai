import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  personelAdSoyadAyir,
  personelAdSoyadBirlesik,
  personelGorunenAd,
  personelKisaAd,
} from './personelAd'

describe('NOTYA-SEKRETER-01 personelAd', () => {
  it('ad + soyad birleştirir', () => {
    assert.equal(personelAdSoyadBirlesik('Ayşe', 'Yılmaz'), 'Ayşe Yılmaz')
    assert.equal(personelAdSoyadBirlesik('  Ayşe  ', '  '), 'Ayşe')
  })

  it('eski ad_soyad alanını ayırır', () => {
    assert.deepEqual(personelAdSoyadAyir('Ayşe Yılmaz'), { ad: 'Ayşe', soyad: 'Yılmaz' })
    assert.deepEqual(personelAdSoyadAyir('Fatma Nur Demir'), { ad: 'Fatma', soyad: 'Nur Demir' })
    assert.deepEqual(personelAdSoyadAyir('Ayşe'), { ad: 'Ayşe', soyad: '' })
  })

  it('görünen ad ve kısa ad', () => {
    assert.equal(personelGorunenAd({ ad: 'Ayşe', soyad: 'Yılmaz' }), 'Ayşe Yılmaz')
    assert.equal(personelGorunenAd({ adSoyad: 'Ayşe Yılmaz' }), 'Ayşe Yılmaz')
    assert.equal(personelKisaAd({ ad: 'Ayşe', soyad: 'Yılmaz' }), 'Ayşe')
    assert.equal(personelKisaAd({ adSoyad: 'Ayşe Yılmaz' }), 'Ayşe')
  })
})
