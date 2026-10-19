import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { neyziRed } from '../engines/girdi'
import { blokKontrol } from '../engines/izlem'
import { gyaKaydi } from '../engines/kayit'

describe('ergo motor', () => {
  it('Neyzi reddi, blok kontrolü ve GYA', () => {
    assert.ok(neyziRed('Neyzi persentil'))
    assert.equal(neyziRed('giyinme'), null)
    const b = blokKontrol('2026-10-01')
    assert.equal('gun' in b && b.gun, 14)
    assert.equal('hata' in gyaKaydi('inme Neyzi', ['Giyinme']), true)
    assert.equal('ozet' in gyaKaydi('inme', ['Giyinme']), true)
  })
})
