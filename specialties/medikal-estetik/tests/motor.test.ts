import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { lotGirdi } from '../engines/girdi'
import { ucuncuAyKontrol } from '../engines/izlem'
import { sogumaKaydi } from '../engines/kayit'

describe('medikal motor', () => {
  it('lot, üçüncü ay ve soğuma', () => {
    assert.equal('hata' in lotGirdi('2 mL', 'Dudak'), true)
    assert.equal('ozet' in lotGirdi('LOT-1', 'Dudak'), true)
    const u = ucuncuAyKontrol('2026-10-01')
    assert.equal('ad' in u && u.ad.includes('mL'), false)
    const s = sogumaKaydi('2026-10-01', '2026-10-01')
    assert.equal('uygun' in s && s.uygun, false)
  })
})
