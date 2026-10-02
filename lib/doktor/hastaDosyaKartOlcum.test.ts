import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bosKart, dosyaSoruCevap } from './hastaDosyaKart'

// NOTYA-OLCUM-TEK-01: one measurement asked, one measurement answered; a treatment question is not a vaccine question.
const kart = {
  ...bosKart(),
  olcum: 'Ate\u015f: 39 \u00b0C \u00b7 Tansiyon: 100/60 mmHg \u00b7 Nab\u0131z: 120/dk \u00b7 Solunum Say\u0131s\u0131: 25/dk \u00b7 Kilo: 21 kg \u00b7 Boy: 108 cm',
  sonRecete: 'Klacid 125 mg (12 Eyl\u00fcl 2026)',
}
describe('hasta dosya karti: tek olcum', () => {
  it('kilo only', () => {
    const c = dosyaSoruCevap('ay\u015fe ye\u015fil\u0027in en son kilosu ne kadard\u0131', kart) || ''
    assert.ok(c.includes('21 kg'))
    assert.ok(!c.includes('39') && !c.includes('108'))
  })
  it('boy only', () => {
    const c = dosyaSoruCevap('boyu ka\u00e7', kart) || ''
    assert.ok(c.includes('108 cm'))
    assert.ok(!c.includes('21 kg'))
  })
  it('ates only', () => {
    const c = dosyaSoruCevap('ate\u015fi ka\u00e7', kart) || ''
    assert.ok(c.includes('39'))
    assert.ok(!c.includes('21 kg'))
  })
  it('kilo and boy', () => {
    const c = dosyaSoruCevap('kilosu ve boyu ne', kart) || ''
    assert.ok(c.includes('21 kg') && c.includes('108 cm'))
    assert.ok(!c.includes('39'))
  })
  it('a general measurement question still gets everything', () => {
    const c = dosyaSoruCevap('son \u00f6l\u00e7\u00fcmleri neler', kart) || ''
    assert.ok(c.includes('21 kg') && c.includes('39') && c.includes('108 cm'))
  })
  it('a measurement the card does not hold goes to the model', () => {
    assert.equal(dosyaSoruCevap('ba\u015f \u00e7evresi ka\u00e7', kart), null)
  })
})
describe('hasta dosya karti: tedavi sorusu', () => {
  it('a garbled name that sounds like asi does not open the vaccine field', () => {
    const c = dosyaSoruCevap('A\u015f\u0131 ge\u00e7i\u015f ile en son biz hangi tedaviyi verdik?', kart) || ''
    assert.ok(c.includes('Klacid'))
    assert.ok(!c.toLowerCase().includes('a\u015f\u0131'))
  })
  it('a clear vaccine question still opens the vaccine field', () => {
    const c = dosyaSoruCevap('a\u015f\u0131 karnesi nas\u0131l', kart) || ''
    assert.ok(c.toLowerCase().includes('a\u015f\u0131'))
  })
  it('a general medical question does not return this patient last prescription', () => {
    assert.equal(dosyaSoruCevap('Otitis media tedavisi nedir?', kart), null)
  })
})

describe('hasta dosya karti: bos kart', () => {
  it('an empty card answers the asked measurement as kayıt yok, without the model', () => {
    const c = dosyaSoruCevap('kilosu kaç', { ...bosKart() }) || ''
    assert.ok(c.includes('kilo') && c.includes('kayıt yok'))
  })
})
