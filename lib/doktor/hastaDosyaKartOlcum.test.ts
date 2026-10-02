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
  it('a measurement the card does not carry is not answered by the card (the measurement route answers it)', () => {
    assert.equal(dosyaSoruCevap('ba\u015f \u00e7evresi ka\u00e7', kart), null)
    assert.equal(dosyaSoruCevap('ba\u015f \u00e7evresi ka\u00e7', { ...bosKart() }), null)
  })
})

// The measurement route ran first and found no stored weight / height; a card without it has nothing left to look up.
describe('hasta dosya karti: kartta olmayan olcum', () => {
  const vitalKart = { ...bosKart(), olcum: 'Ate\u015f: 39 \u00b0C \u00b7 Nab\u0131z: 120/dk' }
  const buyumeKart = { ...bosKart(), olcum: 'Kilo: 21 kg \u00b7 Boy: 108 cm' }
  it('a missing weight or height is kay\u0131t yok, and the other vitals are not printed', () => {
    assert.equal(dosyaSoruCevap('kilosu ka\u00e7', vitalKart), 'Dosyada kilo: kay\u0131t yok.')
    assert.equal(dosyaSoruCevap('boyu ka\u00e7', vitalKart), 'Dosyada boy: kay\u0131t yok.')
    assert.equal(dosyaSoruCevap('kilosu ve boyu ne', vitalKart), 'Dosyada kilo: kay\u0131t yok. Dosyada boy: kay\u0131t yok.')
  })
  it('a missing vital sign is left to the model', () => {
    for (const soru of ['ate\u015fi ka\u00e7', 'tansiyonu ka\u00e7', 'nabz\u0131 ka\u00e7t\u0131', 'spo2 ka\u00e7']) {
      assert.equal(dosyaSoruCevap(soru, buyumeKart), null, soru)
    }
    assert.equal(dosyaSoruCevap('tansiyonu ka\u00e7', vitalKart), null)
  })
  it('a device reading on the card (written without a colon) is a held measurement', () => {
    const cihazKart = { ...bosKart(), olcum: 'kilo 18.4 kg (20 Eyl 2026)' }
    assert.equal(dosyaSoruCevap('kaç kilo', cihazKart), 'Dosyada kilo: 18.4 kg (20 Eyl 2026).')
    assert.equal(dosyaSoruCevap('boyu kaç', cihazKart), 'Dosyada boy: kayıt yok.')
    assert.equal(dosyaSoruCevap('ateşi kaç', cihazKart), null)
  })
  it('asked together: the held one is answered, a missing weight is kay\u0131t yok, a missing vital is dropped', () => {
    assert.equal(dosyaSoruCevap('ate\u015fi ve kilosu ka\u00e7', vitalKart), 'Dosyada ate\u015f: 39 \u00b0C. Dosyada kilo: kay\u0131t yok.')
    assert.equal(dosyaSoruCevap('ate\u015fi ve kilosu ka\u00e7', buyumeKart), 'Dosyada kilo: 21 kg.')
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
  it('an empty card answers any asked measurement as kayıt yok, vital signs included', () => {
    assert.equal(dosyaSoruCevap('ateşi kaç', { ...bosKart() }), 'Dosyada ateş: kayıt yok.')
    assert.equal(dosyaSoruCevap('tansiyonu ve nabzı kaç', { ...bosKart() }), 'Dosyada tansiyon: kayıt yok. Dosyada nabız: kayıt yok.')
    assert.equal(dosyaSoruCevap('boyu kaç', { ...bosKart() }), 'Dosyada boy: kayıt yok.')
  })
  it('a general measurement question on an empty card keeps the whole line', () => {
    assert.equal(dosyaSoruCevap('son ölçümleri neler', { ...bosKart() }), 'Dosyada son ölçüm: kayıt yok.')
  })
})
