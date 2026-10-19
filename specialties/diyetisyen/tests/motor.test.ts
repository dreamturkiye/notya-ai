import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kiloGirdi } from '../engines/girdi'
import { gecKontrol } from '../engines/izlem'
import { hekimKapisi } from '../engines/kayit'

describe('diyet motor', () => {
  it('kilo kapısı, 12. hafta ve hekim tanısı', () => {
    assert.equal('hata' in kiloGirdi(10), true)
    assert.equal('kiloKg' in kiloGirdi(70), true)
    const g = gecKontrol('2026-10-01')
    assert.equal('hafta' in g && g.hafta, 12)
    assert.equal('ad' in g && /kcal/i.test(g.ad), false)
    assert.equal('hata' in hekimKapisi(''), true)
  })
})
