import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sayiCoz, kiloCoz, cmCoz, tarihCoz, gebelikHaftasiCoz, gramCoz, ayEkle, tamAy, yasMetni, tarihGoster } from '../engines/girdi'

describe('pediatri girdi — Türk kliniğinin yazdığı biçimler sessizce normalleşir', () => {
  it('sayılar: virgül ondalık, nokta binlik', () => {
    assert.equal(sayiCoz('3,5'), 3.5)
    assert.equal(sayiCoz('3.5'), 3.5)
    assert.equal(sayiCoz(' 12 '), 12)
    assert.equal(sayiCoz('1.250,5'), 1250.5)
    assert.equal(sayiCoz('3.500'), 3500)
    assert.equal(sayiCoz(''), null)
    assert.equal(sayiCoz('abc'), null)
  })
  it('kilo: kg / gr / birimsiz gram', () => {
    assert.equal(kiloCoz('3,5'), 3.5)
    assert.equal(kiloCoz('3,5 kg'), 3.5)
    assert.equal(kiloCoz('3500'), 3.5)
    assert.equal(kiloCoz('3500 gr'), 3.5)
    assert.equal(kiloCoz('3.500 g'), 3.5)
    assert.equal(kiloCoz('850 g'), 0.85)
    assert.equal(kiloCoz('18'), 18)
    assert.equal(kiloCoz('0'), null)
    assert.equal(gramCoz('1,85 kg'), 1850)
  })
  it('cm: cm / m / mm', () => {
    assert.equal(cmCoz('112'), 112)
    assert.equal(cmCoz('112,5 cm'), 112.5)
    assert.equal(cmCoz('1,12 m'), 112)
    assert.equal(cmCoz('1.12'), 112)
    assert.equal(cmCoz('450 mm'), 45)
  })
  it('tarih: gg.aa.yyyy ve türevleri, geçersiz gün reddedilir', () => {
    assert.equal(tarihCoz('12.03.2024'), '2024-03-12')
    assert.equal(tarihCoz('12/3/24'), '2024-03-12')
    assert.equal(tarihCoz('12-03-2024'), '2024-03-12')
    assert.equal(tarihCoz('2024-03-12'), '2024-03-12')
    assert.equal(tarihCoz('12,03,2024'), '2024-03-12')
    assert.equal(tarihCoz('12032024'), '2024-03-12')
    assert.equal(tarihCoz('31.02.2024'), null)
    assert.equal(tarihCoz('dün'), null)
    assert.equal(tarihGoster('2024-03-12'), '12.03.2024')
  })
  it('gebelik haftası: 32+4 · 32 4/7 · 32', () => {
    assert.equal(gebelikHaftasiCoz('32+4'), 32.57)
    assert.equal(gebelikHaftasiCoz('32 4/7'), 32.57)
    assert.equal(gebelikHaftasiCoz('32'), 32)
    assert.equal(gebelikHaftasiCoz('12'), null)
  })
  it('takvim: ay sonu sabitlenir, tamamlanmış ay, yaş metni', () => {
    assert.equal(ayEkle('2024-01-31', 1), '2024-02-29')
    assert.equal(ayEkle('2024-03-15', 12), '2025-03-15')
    assert.equal(tamAy('2024-03-15', '2024-05-14'), 1)
    assert.equal(tamAy('2024-03-15', '2024-05-15'), 2)
    assert.equal(yasMetni('2024-03-15', '2024-03-25'), '10 günlük')
    assert.equal(yasMetni('2024-03-15', '2025-06-20'), '15 aylık')
    assert.equal(yasMetni('2020-03-15', '2026-06-20'), '6 yaş 3 ay')
  })
})
