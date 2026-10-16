import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { topluSablonMetni, TOPLU_SABLON_ETIKETI, TOPLU_ACIL_SATIRI, TOPLU_SMS_VAZGEC_SATIRI } from './sablonlar'

const YASAK_KELIMELER = /\bdoz\b|\d+\s*mg\b|\bml\b|tanı|teşhis|reçete|ilaç adı|sonuc(u|ları)|pozitif|negatif/i

describe('toplu şablonlar — klinik içerik yok, her zaman düzenlenebilir başlangıç metni', () => {
  for (const anahtar of ['asi_stok_geldi', 'randevu_genel', 'genel_bilgi', 'serbest'] as const) {
    it(`${anahtar}: klinik bilgi (tanı/doz/ilaç) içermez`, () => {
      const { metin } = topluSablonMetni(anahtar, { doktorAdi: 'Dr. Ayşe Yılmaz' })
      assert.doesNotMatch(metin, YASAK_KELIMELER)
    })
  }

  it('asi_stok_geldi: aşı markası/üretici değil, sadece stoğun geldiğini söyler', () => {
    const { konu, metin } = topluSablonMetni('asi_stok_geldi', {})
    assert.equal(konu, 'Aşınız geldi')
    assert.match(metin, /stoğumuza geldi/)
    assert.doesNotMatch(metin, /Pfizer|Sinovac|AstraZeneca|Moderna/i)
  })

  it('her şablonun kısa, insan-okur bir etiketi var', () => {
    for (const anahtar of ['asi_stok_geldi', 'randevu_genel', 'genel_bilgi', 'serbest'] as const) {
      assert.ok(TOPLU_SABLON_ETIKETI[anahtar].length > 0)
    }
  })

  it('TOPLU_ACIL_SATIRI her mesaja eklenecek 112 cümlesiyle aynı', () => {
    assert.match(TOPLU_ACIL_SATIRI, /112/)
  })

  it("TOPLU_SMS_VAZGEC_SATIRI STOP kelimesini açıkça söyler (sadece webhook'un tanıması yetmez, hasta bilmeli)", () => {
    assert.match(TOPLU_SMS_VAZGEC_SATIRI, /STOP/)
  })

  it('doktor adı verilmezse metin doktor adı olmadan da tutarlı kalır', () => {
    const { metin } = topluSablonMetni('genel_bilgi', { doktorAdi: null })
    assert.doesNotMatch(metin, /—\s*$/)
  })
})
