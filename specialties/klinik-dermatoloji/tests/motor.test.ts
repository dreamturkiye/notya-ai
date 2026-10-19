import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { lazerAralik } from '../engines/girdi'
import { seansAraligi } from '../engines/izlem'
import { fotoSaklama } from '../engines/kayit'

describe('derm motor', () => {
  it('14–90 aralık ve foto saklama', () => {
    assert.equal('hata' in lazerAralik(3), true)
    assert.equal('gun' in seansAraligi(28), true)
    assert.equal('hata' in fotoSaklama(false, '2026-10-01', '6'), true)
    const s = fotoSaklama(true, '2026-10-01', '6')
    assert.equal('bitis' in s, true)
  })
})
