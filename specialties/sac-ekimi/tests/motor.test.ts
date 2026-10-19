import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { donorGirdi } from '../engines/girdi'
import { dokulmePenceresi, sonucIzlemi } from '../engines/izlem'
import { fotoSaklama } from '../engines/kayit'

describe('sac motor', () => {
  it('donör kapısı, dökülme penceresi ve saklama', () => {
    assert.equal('hata' in donorGirdi(0, 40), true)
    assert.equal('hata' in donorGirdi(20, 40), false)
    const d = dokulmePenceresi('2026-10-01')
    assert.ok(Array.isArray(d) && d.length === 2)
    assert.equal(d[0].ad.includes('greft'), false)
    const sonuc = sonucIzlemi('2026-10-01')
    assert.ok(Array.isArray(sonuc) && sonuc.map((x) => x.gun).join(',') === '180,365')
    assert.equal(Array.isArray(sonuc) && sonuc.some((x) => /greft/i.test(x.ad)), false)
    const saklama = fotoSaklama(true, '2026-10-01', '12')
    assert.equal('bitis' in saklama && Boolean(saklama.bitis && /^\d{4}-\d{2}-\d{2}$/.test(saklama.bitis)), true)
    assert.equal('hata' in fotoSaklama(true, '2026-10-01', '5'), true)
    assert.equal('hata' in fotoSaklama(false, '2026-10-01', ''), true)
  })
})
