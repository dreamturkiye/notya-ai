import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTRT, gunKaydirTRT } from '../../core/eylemler/types'
import { takvimSorusuCoz, takvimSorusuMu, sesGurultusuMu, takvimTakipCoz, takvimRecantMi, sonTakvimCevabiMi } from './takvimSorusu'

describe('takvimSorusu — clinic day lookup, not a chart question', () => {
  it('bugün / today / appointments today → today', () => {
    const bugun = bugunTRT()
    for (const m of [
      'Bugün randevu var mı?',
      'bugün randevularımız neler',
      'takvimde ne var',
      'do we have any appointments today',
      'Have we got appointments today',
    ]) {
      const c = takvimSorusuCoz(m)
      assert.ok(c, m)
      assert.equal(c!.tarih, bugun, m)
      assert.equal(c!.saat, null, m)
    }
  })

  it('yarın and a clock time', () => {
    const c = takvimSorusuCoz('Yarın 14:30 boş mu?')
    assert.ok(c)
    assert.equal(c!.tarih, gunKaydirTRT(1))
    assert.equal(c!.saat, '14:30')
  })

  it('kayıt niyeti ve hasta randevusu eşleşmez', () => {
    for (const m of [
      'kontrol randevusu yazıver',
      'randevu kartını hazırla',
      'Umutcan’ın randevusu',
      'nasılsınız',
      'aşıları tam mı',
    ]) {
      assert.equal(takvimSorusuMu(m), false, m)
    }
  })

  it('ASR "..." is noise; emin misin after a calendar line re-reads today', () => {
    assert.equal(sesGurultusuMu('...'), true)
    assert.equal(sesGurultusuMu('…'), true)
    assert.equal(sesGurultusuMu('eee'), true)
    assert.equal(sesGurultusuMu('Bugün randevu var mı?'), false)
    const son = '29 Eylül 2026 Salı takviminde randevu yok.'
    assert.equal(sonTakvimCevabiMi(son), true)
    assert.equal(sonTakvimCevabiMi('29 Eylül 2026 Salı takviminde 1 randevu: 10:00–10:20 Umutcan (muayene).'), true)
    assert.equal(sonTakvimCevabiMi('Bugün takviminizde randevu yok Hocam.'), true)
    assert.equal(takvimTakipCoz('...', son), null)
    const takip = takvimTakipCoz('Emin misin?', son)
    assert.ok(takip)
    assert.equal(takip!.tarih, bugunTRT())
    assert.equal(takvimTakipCoz('Emin misin?', 'Hocam, iyiyim.'), null)
    assert.equal(takvimRecantMi('Haklısınız Hocam; az önce randevu olmadığını ve tarihi kesinmiş gibi söyledim. Bunu doğrulamadan belirtmemeliydim. Randevu durumunu Ana Sayfa’daki bugünkü randevular bölümünden kontrol edelim.'), true)
    assert.equal(takvimRecantMi('Bugün takviminizde randevu yok Hocam.'), false)
  })
})
