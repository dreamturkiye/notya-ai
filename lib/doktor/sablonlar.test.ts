/**
 * ARACLAR-CILA-01 Faz 4 — hekime özel hızlı şablonların saf yardımcıları.
 * İçerik hekimin kendi metnidir: burada yalnız kırpma, boş şablonun reddi ve sıralama sınanır.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sablonTemizle, sablonSatirlari, sablonSirala, SABLON_SINIRLARI } from './sablonlar'

describe('sablonTemizle', () => {
  it('adı olmayan şablon kaydedilmez', () => {
    assert.equal(sablonTemizle({}), null)
    assert.equal(sablonTemizle({ ad: '   ' }), null)
    assert.equal(sablonTemizle(null), null)
  })

  it('camelCase ve snake_case gövdeyi aynı alanlara yazar', () => {
    assert.deepEqual(sablonTemizle({ ad: 'ÜSYE', receteTaslagi: 'a', kontrolAraligi: '3 gün' }), {
      ad: 'ÜSYE', tani: null, recete_taslagi: 'a', kontrol_araligi: '3 gün', notlar: null,
    })
    assert.deepEqual(sablonTemizle({ ad: 'ÜSYE', recete_taslagi: 'b', kontrol_araligi: '1 hafta' })?.recete_taslagi, 'b')
  })

  it('boş alanlar null olur, uzunluk tavanı uygulanır', () => {
    const t = sablonTemizle({ ad: 'x'.repeat(200), tani: '', notlar: 'y'.repeat(5000) })!
    assert.equal(t.ad.length, SABLON_SINIRLARI.ad)
    assert.equal(t.tani, null)
    assert.equal(t.notlar!.length, SABLON_SINIRLARI.notlar)
  })
})

describe('sablonSatirlari', () => {
  it('yalnız dolu alanlar; her satır hekimin kendi metni olarak etiketli', () => {
    const s = sablonSatirlari({ ad: 'ÜSYE', tani: 'Akut nazofarenjit', recete_taslagi: 'satır1\nsatır2', kontrol_araligi: '3 gün', notlar: null })
    assert.deepEqual(s, [
      'Tanı (hekim): Akut nazofarenjit',
      'Reçete taslağı (hekimin kendi şablonu): satır1 · satır2',
      'Kontrol aralığı: 3 gün',
    ])
  })
  it('içerik yoksa satır yok (boş blok nota yazılmaz)', () => {
    assert.deepEqual(sablonSatirlari({ ad: 'boş', tani: null, recete_taslagi: null, kontrol_araligi: null, notlar: null }), [])
  })
})

describe('sablonSirala', () => {
  it('sık kullanılan üstte; eşitlikte son kullanım, sonra tr-TR ada göre', () => {
    const liste = [
      { ad: 'Çocuk', kullanim_sayisi: 2, son_kullanim: '2026-09-01' },
      { ad: 'Astım', kullanim_sayisi: 9, son_kullanim: null },
      { ad: 'Bel ağrısı', kullanim_sayisi: 2, son_kullanim: '2026-09-10' },
      { ad: 'Ateş', kullanim_sayisi: 2, son_kullanim: '2026-09-10' },
    ]
    assert.deepEqual(sablonSirala(liste).map((x) => x.ad), ['Astım', 'Ateş', 'Bel ağrısı', 'Çocuk'])
  })
})
