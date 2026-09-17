import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { belgeLabMi, belgeRontgenMi, belgeDegerlendirmeCtalari, belgeKategoriEtiket } from './belgeTur'

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
  it('röntgen CTA is only Röntgeni değerlendir (no lab button)', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Chest_Xray_PA.jpg',
      category: 'X-Ray',
      fileType: 'image/jpeg',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Röntgeni değerlendir'])
  })
  it('lab CTA is only Laboratuvarı değerlendir', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Lab_Results.pdf',
      category: 'Lab Sonucu',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Laboratuvarı değerlendir'])
  })
  it('maps X-Ray category label to Röntgen', () => {
    assert.equal(belgeKategoriEtiket({ fileName: 'chest.jpg', category: 'X-Ray' }), 'Röntgen')
  })
})
