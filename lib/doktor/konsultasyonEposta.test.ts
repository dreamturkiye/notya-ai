import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { epostaDurumMetni, konsultanAliciDogrula, konsultanEpostaTaslagi } from './konsultasyonEposta'

describe('konsultasyonEposta — alıcı, taslak, durum (cihaz postası)', () => {
  it('boş alıcı kabul; geçersiz reddedilir', () => {
    assert.deepEqual(konsultanAliciDogrula(''), { ok: true, alici: null })
    assert.deepEqual(konsultanAliciDogrula('  Dr.Gokhan@Gmail.com '), { ok: true, alici: 'dr.gokhan@gmail.com' })
    assert.equal(konsultanAliciDogrula('a@b').ok, false)
    assert.equal(konsultanAliciDogrula('a@b.com\nBcc:x').ok, false)
  })
  it('taslak portal linki ve hekim adını taşır', () => {
    const t = konsultanEpostaTaslagi('Dr. QA', { hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz' }, 'https://www.notya.io/konsultan/abc', 'a@b.com')
    assert.equal(t.alici, 'a@b.com')
    assert.match(t.konu, /Konsültasyon/)
    assert.match(t.metin, /Dr\. QA/)
    assert.match(t.metin, /https:\/\/www\.notya\.io\/konsultan\/abc/)
    assert.equal(t.portalLink, 'https://www.notya.io/konsultan/abc')
  })
  it('durum metinleri: e-posta açıldı, Gönder yeterli — posta programı adı sorulmaz / söylenmez; OAuth istemez', () => {
    assert.match(epostaDurumMetni('gonderildi', 'a@b.com'), /işaretlendi/)
    // NOTYA-KONSULT-GONDERIM-01 (Kaan, 2026-10-07, #559): the doctor is never asked — or told — which mail program.
    assert.equal(epostaDurumMetni('hazir', 'a@b.com'), 'E-postanız açıldı (a@b.com) — Gönder’e basmanız yeterli.')
    assert.doesNotMatch(epostaDurumMetni('hazir', 'a@b.com'), /Posta uygulamanız|Mac Mail|iPhone|Outlook|Gmail/)
    assert.match(epostaDurumMetni('yok'), /Defter|e-posta/)
    assert.match(epostaDurumMetni('hata'), /yeniden/)
    assert.doesNotMatch(epostaDurumMetni('hazir'), /bağlı değil|Gmail\/Outlook bağla/)
  })
})
