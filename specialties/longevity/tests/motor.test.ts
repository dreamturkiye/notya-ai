import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aralikGirdi } from '../engines/girdi'
import { beklemeBitisi, reaksiyonSonrasiAralik } from '../engines/izlem'
import { guvenlikKaydi } from '../engines/kayit'
import { GUVENLIK_MADDELERI } from '../engines/long'

describe('longevity motor', () => {
  it('aralık, reaksiyon beklemesi ve güvenlik', () => {
    assert.equal('hata' in aralikGirdi(0), true)
    assert.equal(reaksiyonSonrasiAralik(true, 3)?.hata.includes('7'), true)
    assert.equal(reaksiyonSonrasiAralik(false, 3), null)
    const bek = beklemeBitisi(true, '2026-10-01')
    assert.equal(bek && 'gun' in bek && bek.gun, 7)
    assert.equal(beklemeBitisi(false, '2026-10-01'), null)
    assert.equal('hata' in guvenlikKaydi([GUVENLIK_MADDELERI[0]]), true)
    assert.equal('ozet' in guvenlikKaydi(GUVENLIK_MADDELERI.slice(0, 3)), true)
  })
})
