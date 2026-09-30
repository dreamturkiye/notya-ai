import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bitisSaati, gunlukKonusmaMetni, gunlukOzetMetni, slotlarCakisiyorMu } from './gunlukOzet'

describe('gunlukOzet — o günün saatleri', () => {
  it('09:00–09:15 ile 09:00 isteği çakışır; 09:15 boştur', () => {
    assert.equal(slotlarCakisiyorMu('09:00', '09:15', '09:00', '09:15'), true)
    assert.equal(slotlarCakisiyorMu('09:15', '09:30', '09:00', '09:15'), false)
  })

  it('boş gün + istenen saat → boş der', () => {
    const o = gunlukOzetMetni({ tarih: '2026-09-25', satirlar: [], istenenSaat: '09:00' })
    assert.equal(o.cakisiyor, false)
    assert.match(o.metin, /randevu yok/)
    assert.match(o.metin, /^25 Eylül 2026 Cuma takviminde/)
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

  it('sözlü biçim kısa: 0 / 1 / 3+ randevu', () => {
    assert.match(gunlukKonusmaMetni({ tarih: '2026-09-25', satirlar: [] }), /randevu yok Hocam/)
    const bir = gunlukKonusmaMetni({
      tarih: '2026-09-25',
      satirlar: [{ saat: '09:00', bitisSaat: '09:20', hastaAdi: 'Ali Kaya', tur: 'muayene' }],
    })
    assert.match(bir, /1 randevu/)
    assert.match(bir, /09:00 Ali Kaya/)
    const cok = gunlukKonusmaMetni({
      tarih: '2026-09-25',
      satirlar: [
        { saat: '09:00', bitisSaat: '09:20', hastaAdi: 'Ali', tur: 'muayene' },
        { saat: '10:00', bitisSaat: '10:20', hastaAdi: 'Veli', tur: 'kontrol' },
        { saat: '11:00', bitisSaat: '11:20', hastaAdi: 'Ayşe', tur: 'muayene' },
      ],
    })
    assert.match(cok, /3 randevu/)
    assert.match(cok, /Ayrıntı ekranınızda/)
    assert.doesNotMatch(cok, /Veli/)
  })
})

describe('sözlü biçim — gün adı doktorun saat dilimine göre (NOTYA-TAKVIM-TZ-01)', () => {
  const AN = new Date('2026-09-29T23:35:00Z') // Tue 19:35 US Eastern, already Wed in TRT
  it('"Bugün / Yarın" is decided in tz and the resolved day is spoken', () => {
    const ny = gunlukKonusmaMetni({ tarih: '2026-09-29', satirlar: [], tz: 'America/New_York', simdi: AN })
    assert.match(ny, /^Bugün, 29 Eylül Salı, takviminizde randevu yok Hocam\./)
    const yarin = gunlukKonusmaMetni({ tarih: '2026-09-30', satirlar: [{ saat: '09:00', bitisSaat: '09:20', hastaAdi: 'Ali Kaya', tur: 'muayene' }], tz: 'America/New_York', simdi: AN })
    assert.match(yarin, /^Yarın, 30 Eylül Çarşamba, 1 randevu var Hocam/)
    const trt = gunlukKonusmaMetni({ tarih: '2026-09-30', satirlar: [], tz: 'Europe/Istanbul', simdi: AN })
    assert.match(trt, /^Bugün, 30 Eylül Çarşamba,/)
    assert.match(gunlukKonusmaMetni({ tarih: '2026-10-15', satirlar: [], tz: 'America/New_York', simdi: AN }), /^15 Ekim Perşembe takviminizde/)
  })
})
