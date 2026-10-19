import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dbGirdi } from '../engines/girdi'
import { altiAyCihaz, esikEgimi } from '../engines/izlem'
import { raporKaydi } from '../engines/kayit'

describe('odyo motor', () => {
  it('dB kapısı, eğim ve hekim raporu', () => {
    assert.equal('hata' in dbGirdi(400), true)
    assert.equal('db' in dbGirdi(30), true)
    const e = esikEgimi(20, 40)
    assert.equal('ozet' in e && e.ozet.includes('yükseldi'), true)
    assert.match('ozet' in e ? e.ozet : '', /tanı değildir/)
    assert.match(raporKaydi(false).ozet, /raporu yok/)
    const ay = altiAyCihaz(true, '2026-10-01')
    assert.equal(ay && 'gun' in ay && ay.gun, 180)
    assert.equal(ay && 'ad' in ay && /\bdB\b/.test(ay.ad), false)
    assert.equal(altiAyCihaz(false, '2026-10-01'), null)
  })
})
