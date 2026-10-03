/**
 * NOTYA-SES-ARKA-01 — LLM öncesi ses tur kapısı.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  tekrarIstegiMi,
  sonCevapEkoMu,
  ayniIstekYeniBilgiYokMu,
  arkaPlanIstekDegilMi,
  sesTurKapisi,
} from './sesTurKapisi'
import { asistaniKapatMi } from './uyandirSoz'

const LAB_SORU = 'Umut Can Türkoğlu’nun son laboratuvar tahlillerinde özellik arz eden bir durum var mı? Çok kısa anlatmanı istiyorum.'
const LAB_CEVAP = 'Son laboratuvarında Hb 12.4 g/dL, ferritin 32 ng/mL; demir eksikliği izlemi uygun. Diğer değerler belirgin özellik göstermiyor Hocam.'
const ASI_SORU = 'Umutcan Türkoğlu aşıları neler?'
const ASI_CEVAP = 'Umutcan Türkoğlu — dosyada aşı: Hib, KKK, suçiçeği, meningokok, Hepatit A.'

const oturumLab = [
  { role: 'user', content: LAB_SORU, kanal: 'ses' },
  { role: 'assistant', content: LAB_CEVAP },
]

describe('NOTYA-SES-ARKA-01 tekrarIstegiMi', () => {
  it('açık tekrar komutlarını tanır', () => {
    assert.equal(tekrarIstegiMi('Tekrar et Hocam'), true)
    assert.equal(tekrarIstegiMi('Yine anlat lütfen'), true)
    assert.equal(tekrarIstegiMi('Bir daha söyle'), true)
    assert.equal(tekrarIstegiMi('Lab sonuçlarını oku'), false)
  })
})

describe('NOTYA-SES-ARKA-01 asistanım kapat', () => {
  it('Asistanım kapat veda sayılır', () => {
    assert.equal(asistaniKapatMi('Asistanım kapat.'), true)
    assert.equal(asistaniKapatMi('Asistanı kapat.'), true)
  })
})

describe('NOTYA-SES-ARKA-01 eko + aynı istek', () => {
  it('son cevabın büyük kısmı transcript ise eko', () => {
    assert.equal(sonCevapEkoMu(LAB_CEVAP, LAB_CEVAP), true)
    assert.equal(sonCevapEkoMu('Son laboratuvarında Hb 12.4 ferritin 32 demir eksikliği izlemi', LAB_CEVAP), true)
    assert.equal(sonCevapEkoMu(ASI_SORU, LAB_CEVAP), false)
  })
  it('bulanık aynı lab sorusu yeni bilgi yok', () => {
    assert.equal(ayniIstekYeniBilgiYokMu(LAB_SORU, LAB_SORU), true)
    assert.equal(ayniIstekYeniBilgiYokMu(
      'Umut Can Türkoğlu son laboratuvar tahlillerinde özellik arz eden durum var mı kısa anlat',
      LAB_SORU,
    ), true)
    assert.equal(ayniIstekYeniBilgiYokMu('Umutcan’ın aşıları neler?', LAB_SORU), false)
  })
})

describe('NOTYA-SES-ARKA-01 arka plan', () => {
  it('istek izi olmayan kısa konuşmayı eler', () => {
    assert.equal(arkaPlanIstekDegilMi('tamam tamam geliyorum'), true)
    assert.equal(arkaPlanIstekDegilMi('hemen geliyorum bekle'), true)
    assert.equal(arkaPlanIstekDegilMi('Umutcan’ın Hb kaç?'), false)
    assert.equal(arkaPlanIstekDegilMi('Ayşe laboratuvarı oku'), false)
    // Eylem komutu (Fish kart yolu) arka plan sayılmaz
    assert.equal(arkaPlanIstekDegilMi('Penisilin alerjisini dosyaya gir'), false)
    assert.equal(arkaPlanIstekDegilMi('Rıdvan Dilmen’in büyümesi yaşına uygun mu'), false)
  })
})

describe('NOTYA-SES-ARKA-01 sesTurKapisi', () => {
  it('birebir tekrar → devam_oku (model yok)', () => {
    const k = sesTurKapisi({ mesaj: LAB_SORU, oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'devam_oku')
    assert.equal(k.neden, 'birebir_tekrar')
  })
  it('bulanık aynı istek → sessiz', () => {
    const k = sesTurKapisi({
      mesaj: 'Umut Can Türkoğlu son laboratuvar tahlillerinde özellik var mı kısa anlat Hocam',
      oturumMesajlari: oturumLab,
    })
    assert.equal(k.tip, 'sessiz')
    assert.equal(k.neden, 'ayni_istek')
  })
  it('TTS eko → sessiz', () => {
    const k = sesTurKapisi({ mesaj: LAB_CEVAP, oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'sessiz')
    assert.equal(k.neden, 'eko_tts')
  })
  it('arka plan → sessiz', () => {
    const k = sesTurKapisi({ mesaj: 'hemen geliyorum bekle', oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'sessiz')
    assert.equal(k.neden, 'arka_plan')
  })
  it('Evet/Hayır kart turu → model', () => {
    assert.equal(sesTurKapisi({ mesaj: 'Evet', oturumMesajlari: oturumLab }).tip, 'model')
    assert.equal(sesTurKapisi({ mesaj: 'Hayır', oturumMesajlari: oturumLab }).tip, 'model')
  })
  it('devam et (kalan yok) → model', () => {
    assert.equal(sesTurKapisi({ mesaj: 'devam et', oturumMesajlari: oturumLab }).tip, 'model')
    assert.equal(sesTurKapisi({ mesaj: 'devam et', oturumMesajlari: oturumLab }).neden, 'devam_istegi')
  })
  it('açık tekrar isteği → model (beyaz liste)', () => {
    const k = sesTurKapisi({ mesaj: 'Tekrar et Hocam', oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'model')
    assert.equal(k.neden, 'tekrar_istegi')
  })
  it('yeni klinik soru → model', () => {
    const k = sesTurKapisi({ mesaj: ASI_SORU, oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'model')
  })
  it('asistanım kapat → veda', () => {
    const k = sesTurKapisi({ mesaj: 'Asistanım kapat.', oturumMesajlari: oturumLab })
    assert.equal(k.tip, 'veda')
  })
  it('pause EL’ye model bırakır (SES-ESKI-02)', () => {
    assert.equal(sesTurKapisi({ mesaj: '...', oturumMesajlari: oturumLab }).tip, 'model')
    assert.equal(sesTurKapisi({ mesaj: 'eee', oturumMesajlari: [] }).neden, 'duraklama_el')
  })
  it('yazılı tur ses replay sayılmaz', () => {
    const yazili = [
      { role: 'user', content: LAB_SORU },
      { role: 'assistant', content: LAB_CEVAP },
    ]
    assert.equal(sesTurKapisi({ mesaj: LAB_SORU, oturumMesajlari: yazili }).tip, 'model')
  })
})

describe('NOTYA-SES-ARKA-01 wired into Custom LLM', () => {
  it('sesLlm sesTurKapisi kullanır', () => {
    const s = readFileSync(join(process.cwd(), 'lib/asistan/sesLlm.ts'), 'utf8')
    assert.ok(/sesTurKapisi\(/.test(s))
    assert.ok(/asistaniKapatMi\(mesaj\)/.test(s))
  })
})
