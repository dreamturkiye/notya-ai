import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sogumaGun } from '../engines/girdi'
import { gecDonem, ucuncuAyTarihi } from '../engines/izlem'
import { nushaKaydi } from '../engines/kayit'

describe('cerrahi motor', () => {
  it('soğuma günü, üçüncü ay ve iki nüsha', () => {
    const g = sogumaGun('2026-10-01', '2026-10-08')
    assert.equal('gun' in g && g.gun, 7)
    assert.equal('hata' in sogumaGun('2026-10-08', '2026-10-01'), true)
    const u = ucuncuAyTarihi('2026-10-01')
    assert.equal('gun' in u && u.gun, 90)
    const donem = gecDonem('2026-10-01')
    assert.ok(Array.isArray(donem) && donem.map((x) => x.gun).join(',') === '90,180,365')
    assert.equal('hata' in nushaKaydi(true, false), true)
    assert.equal('ozet' in nushaKaydi(true, true), true)
  })
})
