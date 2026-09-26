import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asistaniAcMi, asistaniKapatMi } from './uyandirSoz'

describe('sesle uyandır sözleri', () => {
  it('asistanı aç açar, açık ve açma açmaz', () => {
    assert.equal(asistaniAcMi('Asistanı aç'), true)
    assert.equal(asistaniAcMi('asistanı ac lütfen'), true)
    assert.equal(asistaniAcMi('Asistan aç'), true)
    assert.equal(asistaniAcMi('asistanı açık'), false)
    assert.equal(asistaniAcMi('asistanı açma'), false)
    assert.equal(asistaniAcMi('merhaba'), false)
  })

  it('asistanı kapat kapatır, aç ile karışmaz', () => {
    assert.equal(asistaniKapatMi('Asistanı kapat'), true)
    assert.equal(asistaniKapatMi('asistan kapat'), true)
    assert.equal(asistaniKapatMi('Asistanı aç'), false)
    assert.equal(asistaniAcMi('Asistanı kapat'), false)
  })
})
