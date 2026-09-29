import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTRT, gunKaydirTRT } from '../../core/eylemler/types'
import { takvimSorusuCoz, takvimSorusuMu } from './takvimSorusu'

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
})
