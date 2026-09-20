import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bitisSaati, gunlukOzetMetni, slotlarCakisiyorMu } from './gunlukOzet'

describe('gunlukOzet — o günün saatleri', () => {
  it('09:00–09:15 ile 09:00 isteği çakışır; 09:15 boştur', () => {
    assert.equal(slotlarCakisiyorMu('09:00', '09:15', '09:00', '09:15'), true)
    assert.equal(slotlarCakisiyorMu('09:15', '09:30', '09:00', '09:15'), false)
  })

  it('boş gün + istenen saat → boş der', () => {
    const o = gunlukOzetMetni({ tarih: '2026-09-25', satirlar: [], istenenSaat: '09:00' })
    assert.equal(o.cakisiyor, false)
    assert.match(o.metin, /randevu yok/)
    assert.match(o.metin, /09:00 boş/)
  })

  it('dolu slota isimle çakışma yazar — izinsizlik yok', () => {
    const o = gunlukOzetMetni({
      tarih: '2026-09-25',
      satirlar: [{ saat: '09:00', bitisSaat: '09:15', hastaAdi: 'Ayşe Metin', tur: 'muayene' }],
      istenenSaat: '09:00',
      istenenSureDk: 15,
    })
    assert.equal(o.cakisiyor, true)
    assert.match(o.metin, /Ayşe Metin/)
    assert.match(o.metin, /DOLU/)
    assert.doesNotMatch(o.metin, /iznim|yetkim yok/i)
  })

  it('bitiş saati süreye göre', () => {
    assert.equal(bitisSaati('09:00', 15), '09:15')
    assert.equal(bitisSaati('09:45', 20), '10:05')
  })
})
