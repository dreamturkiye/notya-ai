import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { timpanometriNotu, timpTipiGecerliMi, TIMP_TIP_AD, TIMP_TIPLERI } from '../engines/timpanometri'

describe('KBB-EXCEPTIONAL-01 timpanometri (Jerger karar desteği)', () => {
  it('accepts A / B / C / Ad and rejects invented types', () => {
    for (const t of TIMP_TIPLERI) assert.equal(timpTipiGecerliMi(t), true, t)
    assert.equal(timpTipiGecerliMi('As'), false)
    assert.equal(timpTipiGecerliMi('efuzyon'), false)
    assert.equal(Object.keys(TIMP_TIP_AD).length, 4)
  })

  it('writes a bilateral note without locking a diagnosis', () => {
    const s = timpanometriNotu({
      kulaklar: [
        { yan: 'sag', tip: 'A' },
        { yan: 'sol', tip: 'B' },
      ],
    })
    assert.equal(s.eksikler.length, 0)
    assert.match(s.metin, /Sağ/)
    assert.match(s.metin, /Sol/)
    assert.match(s.metin, /Tip A/)
    assert.match(s.metin, /Tip B/)
    assert.match(s.metin, /karar desteği/)
    assert.doesNotMatch(s.metin, /efüzyon tanısı|perforasyon tanısı|otitis media tanısı/i)
  })

  it('empty selection is not interpreted as a normal ear', () => {
    const s = timpanometriNotu({ kulaklar: [{ yan: 'sag', tip: null }] })
    assert.ok(s.eksikler.length)
    assert.match(s.eksikler[0], /seçilmedi/)
    assert.doesNotMatch(s.metin, /Tip A/)
  })
})
