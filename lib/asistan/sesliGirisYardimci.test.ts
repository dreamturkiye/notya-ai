import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SESLI_GIRIS_DESTEKLENMIYOR_METNI,
  sesliGirisDesteklenmiyorMu,
  sesliGirisHataMetni,
} from './sesliGirisYardimci'

describe('sesliGirisDesteklenmiyorMu — "Ayşe\'ye Danış" panelinin Konuş düğmesi', () => {
  it('her iki önek de yoksa desteklenmiyor sayılır', () => {
    assert.equal(sesliGirisDesteklenmiyorMu({}), true)
  })
  it('SpeechRecognition (Chrome/Edge güncel) varsa desteklenir sayılır', () => {
    assert.equal(sesliGirisDesteklenmiyorMu({ SpeechRecognition: function () {} }), false)
  })
  it('yalnız webkitSpeechRecognition (Safari) varsa da desteklenir sayılır', () => {
    assert.equal(sesliGirisDesteklenmiyorMu({ webkitSpeechRecognition: function () {} }), false)
  })
})

describe('sesliGirisHataMetni — BUG B kök neden: onerror artık sessiz kalmaz', () => {
  it('mikrofon izni reddinde okunabilir, eyleme dönük bir cümle döner', () => {
    assert.ok(sesliGirisHataMetni('not-allowed').length > 0)
    assert.ok(sesliGirisHataMetni('service-not-allowed').length > 0)
    assert.match(sesliGirisHataMetni('not-allowed'), /izin/i)
  })
  it('mikrofon bulunamadı / ağ hatası / konuşma algılanmadı — her biri AYRI, boş olmayan bir mesaj', () => {
    const kodlar = ['audio-capture', 'network', 'no-speech']
    const mesajlar = kodlar.map(sesliGirisHataMetni)
    for (const m of mesajlar) assert.ok(m.length > 0)
    // Aynı kalıbın kopyalanmadığını (üç ayrı, anlamlı cümle) doğrula.
    assert.equal(new Set(mesajlar).size, kodlar.length)
  })
  it('kullanıcının kendi durdurması (aborted) hata değildir — boş döner, hekime sahte uyarı göstermez', () => {
    assert.equal(sesliGirisHataMetni('aborted'), '')
  })
  it('bilinmeyen veya boş kod da sessiz kalmaz — varsayılan, boş olmayan bir cevap verir (eski regresyon: onerror hiçbir mesaj göstermiyordu)', () => {
    assert.ok(sesliGirisHataMetni(undefined).length > 0)
    assert.ok(sesliGirisHataMetni(null).length > 0)
    assert.ok(sesliGirisHataMetni('').length > 0)
    assert.ok(sesliGirisHataMetni('beklenmeyen-kod').length > 0)
  })
})

describe('SESLI_GIRIS_DESTEKLENMIYOR_METNI', () => {
  it('boş değil ve "yazarak" alternatifini önerir — hekim asla kilitlenmez', () => {
    assert.match(SESLI_GIRIS_DESTEKLENMIYOR_METNI, /yaz/i)
  })
})
