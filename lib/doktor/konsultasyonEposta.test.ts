import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { epostaDurumMetni, konsultanAliciDogrula } from './konsultasyonEposta'

describe('konsultasyonEposta — alıcı ve durum metni', () => {
  it('boş alıcı kabul; geçersiz reddedilir', () => {
    assert.deepEqual(konsultanAliciDogrula(''), { ok: true, alici: null })
    assert.deepEqual(konsultanAliciDogrula('  Dr.Gokhan@Gmail.com '), { ok: true, alici: 'dr.gokhan@gmail.com' })
    assert.equal(konsultanAliciDogrula('a@b').ok, false)
    assert.equal(konsultanAliciDogrula('a@b.com\nBcc:x').ok, false)
  })
  it('durum metinleri hekime yol gösterir', () => {
    assert.match(epostaDurumMetni('gonderildi', 'a@b.com'), /gönderildi/)
    assert.match(epostaDurumMetni('bagli_degil'), /İletişim/)
    assert.match(epostaDurumMetni('yok'), /Defter|e-posta/)
    assert.match(epostaDurumMetni('hata'), /yeniden/)
  })
})
