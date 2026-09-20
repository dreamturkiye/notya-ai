import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  belgeLabMi,
  belgeRontgenMi,
  belgeDegerlendirmeCtalari,
  belgeKategoriEtiket,
  belgeYenidoganTaburcuEpikriziMi,
} from './belgeTur'
import { YENIDOGAN_TABURCULUK_EPIKRIZI } from './belgeTurleri'

describe('belgeTur', () => {
  it('detects mock lab PDF by filename', () => {
    assert.equal(belgeLabMi({ fileName: 'Elif_Celik_Mock_Lab_Results.pdf', category: null }), true)
  })
  it('detects Lab Sonucu category', () => {
    assert.equal(belgeLabMi({ fileName: 'hemogram.pdf', category: 'Lab Sonucu' }), true)
  })
  it('does not treat röntgen as lab', () => {
    assert.equal(belgeLabMi({ fileName: 'chest_pa.jpg', category: 'Röntgen' }), false)
  })
  it('detects röntgen / x-ray filenames', () => {
    assert.equal(belgeRontgenMi({ fileName: 'chest_xray_pa.jpg', category: null }), true)
    assert.equal(belgeRontgenMi({ fileName: 'akciger_grafisi.png', category: 'Röntgen' }), true)
  })
  it('does not treat lab PDF as röntgen', () => {
    assert.equal(belgeRontgenMi({ fileName: 'Elif_Celik_Mock_Lab_Results.pdf', category: 'Lab Sonucu' }), false)
  })
  it('röntgen CTA is only Değerlendir (no lab button)', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Chest_Xray_PA.jpg',
      category: 'X-Ray',
      fileType: 'image/jpeg',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Değerlendir'])
    assert.equal(ctas[0]?.tur, 'rontgen')
  })
  it('lab CTA is only Değerlendir', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Lab_Results.pdf',
      category: 'Lab Sonucu',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Değerlendir'])
    assert.equal(ctas[0]?.tur, 'lab')
  })
  it('maps X-Ray category label to Röntgen', () => {
    assert.equal(belgeKategoriEtiket({ fileName: 'chest.jpg', category: 'X-Ray' }), 'Röntgen')
  })

  it('Yenidoğan Taburculuk Epikrizi: kategori + dosya adı; lab CTA yok', () => {
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({ fileName: 'x.pdf', category: YENIDOGAN_TABURCULUK_EPIKRIZI }),
      true,
    )
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({
        fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
        category: 'Epikriz',
      }),
      true,
    )
    assert.equal(
      belgeLabMi({
        fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
        category: 'Epikriz',
        fileType: 'application/pdf',
      }),
      false,
    )
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
      category: YENIDOGAN_TABURCULUK_EPIKRIZI,
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Asistana raporla'])
    assert.equal(
      belgeKategoriEtiket({ fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf', category: 'Epikriz' }),
      YENIDOGAN_TABURCULUK_EPIKRIZI,
    )
  })

  it('genel Epikriz PDF’inde ikincil lab CTA yok', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'genel_epikriz.pdf',
      category: 'Epikriz',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Asistana raporla'])
  })

  it('NTP / yenidoğan tarama lab dosyası taburculuk epikrizi sayılmaz', () => {
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({ fileName: 'yenidogan_tarama_panel.pdf', category: 'Lab Sonucu' }),
      false,
    )
  })
})
