import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { taniKacagi } from '../engines/girdi'
import { cerceveGozden, siklikGun } from '../engines/izlem'
import { cerceveKaydi } from '../engines/kayit'

describe('psikolog motor', () => {
  it('DSM kaçağı, sıklık günü ve çerçeve', () => {
    assert.ok(taniKacagi('DSM notu'))
    assert.equal(taniKacagi('BDT'), null)
    const g = siklikGun('haftalık')
    assert.equal('gun' in g && g.gun, 7)
    const c = cerceveGozden('2026-10-01')
    assert.equal('gun' in c && c.gun, 56)
    assert.equal('ad' in c && /DSM/i.test(c.ad), false)
    assert.equal('hata' in cerceveKaydi('reçete yaz'), true)
    assert.equal('yaklasim' in cerceveKaydi('ACT'), true)
  })
})
