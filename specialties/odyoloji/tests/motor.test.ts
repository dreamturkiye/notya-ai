import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dbGirdi } from '../engines/girdi'
import { esikEgimi } from '../engines/izlem'
import { raporKaydi } from '../engines/kayit'

describe('odyo motor', () => {
  it('dB kapısı, eğim ve hekim raporu', () => {
    assert.equal('hata' in dbGirdi(400), true)
    assert.equal('db' in dbGirdi(30), true)
    const e = esikEgimi(20, 40)
    assert.equal('ozet' in e && e.ozet.includes('yükseldi'), true)
    assert.match('ozet' in e ? e.ozet : '', /tanı değildir/)
    assert.match(raporKaydi(false).ozet, /raporu yok/)
  })
})
