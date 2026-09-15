import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  aktifGebelikDurumu,
  oncekiGebelikDurumMetni,
  oncekiGebelikleriFiltrele,
} from './gebelikDurum'

describe('gebelikDurum', () => {
  it('treats both aktif and gebe as an ongoing episode', () => {
    assert.equal(aktifGebelikDurumu('aktif'), true)
    assert.equal(aktifGebelikDurumu('gebe'), true)
    assert.equal(aktifGebelikDurumu('sonlandi'), false)
    assert.equal(aktifGebelikDurumu('tamamlandi'), false)
  })

  it('never labels an active pregnancy as Sonlandı', () => {
    assert.equal(oncekiGebelikDurumMetni('gebe'), 'Aktif gebelik')
    assert.equal(oncekiGebelikDurumMetni('aktif'), 'Aktif gebelik')
    assert.equal(oncekiGebelikDurumMetni('sonlandi'), 'Sonlandı')
    assert.equal(oncekiGebelikDurumMetni('tamamlandi'), 'Doğum')
    assert.notEqual(oncekiGebelikDurumMetni('gebe'), 'Sonlandı')
  })

  it('keeps the current episode out of previous-pregnancy lists', () => {
    const rows = [
      { id: 'cur', durum: 'gebe', tdt: '2027-02-02' },
      { id: 'old', durum: 'sonlandi', tdt: '2024-01-01' },
      { id: 'birth', durum: 'tamamlandi', tdt: '2023-06-01' },
      { id: 'still-active', durum: 'aktif', tdt: '2026-12-01' },
    ]
    const prev = oncekiGebelikleriFiltrele(rows, 'cur')
    assert.deepEqual(prev.map((r) => r.id), ['old', 'birth'])
    assert.ok(prev.every((r) => oncekiGebelikDurumMetni(r.durum) !== 'Aktif gebelik'))
  })
})
