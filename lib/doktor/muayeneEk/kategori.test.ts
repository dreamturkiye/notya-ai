import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { goruntuTipi, kasaKategorisi } from './kategori'

describe('kasa kategorisi', () => {
  it('temel eşleme belgeTurleri ile aynı yazım', () => {
    assert.equal(kasaKategorisi('lab', {}), 'Lab Sonucu')
    assert.equal(kasaKategorisi('ekg', {}), 'EKG')
    assert.equal(kasaKategorisi('foto', {}), 'Muayene görüntüsü')
    assert.equal(kasaKategorisi('diger', {}), 'Diğer')
  })
  it('röntgen PDF raporu → Görüntüleme Raporu; film → Röntgen', () => {
    assert.equal(kasaKategorisi('rontgen', { fileType: 'application/pdf' }), 'Görüntüleme Raporu')
    assert.equal(kasaKategorisi('rontgen', { fileType: 'image/jpeg' }), 'Röntgen')
  })
  it('yenidoğan taburculuk epikrizi yalnız pediatri / KD', () => {
    assert.equal(kasaKategorisi('epikriz', { dosyaAdi: 'yenidogan_taburcu.pdf', brans: 'pediatri' }), 'Yenidoğan Taburculuk Epikrizi')
    assert.equal(kasaKategorisi('epikriz', { dosyaAdi: 'yenidogan_taburcu.pdf', brans: 'kardiyoloji' }), 'Epikriz')
  })
  it('görüntü bölümü yönlendirmesi', () => {
    assert.equal(goruntuTipi('Röntgen'), 'xr'); assert.equal(goruntuTipi('EKG'), 'ekg'); assert.equal(goruntuTipi('Lab Sonucu'), null)
  })
})
