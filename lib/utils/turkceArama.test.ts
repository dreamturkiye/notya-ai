/**
 * NOTYA-ARAMA-TR-01 regresyon testleri.
 *
 * Bu dosyanın var olma sebebi tek bir canlı hata: doktor "hasta iki" yazdı, sistemde kayıtlı
 * "Hasta Iki" (noktasız büyük I) bulunamadı, randevu yanlışlıkla kayıtsız açıldı. Türkçe I/i
 * katlaması sessizce bozulabilen türden bir şey — saf fonksiyon olarak burada kilitleniyor.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { trAramaNormalize, trIcerir, trAyniAd, trParcaEslesir } from './turkceArama'

test('dört I biçimi de aynı harfe katlanır', () => {
  const beklenen = 'i'
  for (const harf of ['I', 'ı', 'İ', 'i']) {
    assert.equal(trAramaNormalize(harf), beklenen, `${harf} → ${beklenen} olmalı`)
  }
})

test('canlı hata: "Hasta Iki" ile "hasta iki" eşleşir', () => {
  // Bu satır düzeltmeden önce false döndürüyordu.
  assert.equal(trIcerir('Hasta Iki', 'hasta iki'), true)
})

test('I/i yazımının her kombinasyonu kayıtlı hastayı bulur', () => {
  const kayitliAdlar = ['Hasta Iki', 'Hasta İki', 'HASTA IKI', 'hasta ıkı', 'Hasta iki']
  const yazimlar = ['iki', 'Iki', 'İki', 'IKI', 'ıkı', 'İKİ', 'ıKi']
  for (const ad of kayitliAdlar) {
    for (const q of yazimlar) {
      assert.equal(trIcerir(ad, q), true, `"${ad}" adı "${q}" aramasıyla bulunmalı`)
    }
  }
})

test('noktalı/noktasız I içeren gerçek adlar', () => {
  assert.equal(trIcerir('Işık Yılmaz', 'isik'), true)
  assert.equal(trIcerir('Işık Yılmaz', 'ışık'), true)
  assert.equal(trIcerir('Işık Yılmaz', 'IŞIK'), true)
  assert.equal(trIcerir('Işık Yılmaz', 'yilmaz'), true)
  assert.equal(trIcerir('İlknur Çınar', 'ilknur'), true)
  assert.equal(trIcerir('İlknur Çınar', 'ILKNUR'), true)
  assert.equal(trIcerir('İlknur Çınar', 'cinar'), true)
})

test('diğer Türkçe harfler de aksansız yazımla bulunur', () => {
  assert.equal(trAramaNormalize('Gökhan Şahin'), 'gokhan sahin')
  assert.equal(trIcerir('Gökhan Şahin', 'gokhan'), true)
  assert.equal(trIcerir('Gökhan Şahin', 'sahin'), true)
  assert.equal(trIcerir('Çağrı Öztürk', 'cagri ozturk'), true)
  assert.equal(trAramaNormalize('ÜZÜM ĞĞ'), 'uzum gg')
})

test('ayrışık (NFD) yazılmış İ de aynı sonuca katlanır', () => {
  const birlesik = 'İ' // İ
  const ayrisik = 'İ' // I + birleşen nokta
  assert.equal(trAramaNormalize(birlesik), trAramaNormalize(ayrisik))
  assert.equal(trAramaNormalize(ayrisik), 'i')
})

test('alakasız ad eşleşmez — katlama her şeyi eşitlemiyor', () => {
  assert.equal(trIcerir('Hasta Iki', 'hasta uc'), false)
  assert.equal(trIcerir('Ayşe Demir', 'mehmet'), false)
  assert.equal(trIcerir('Işık Yılmaz', 'ışıl'), false)
})

test('boş arama her şeyi eşler, boş metin hiçbir şeyi', () => {
  assert.equal(trIcerir('Hasta Iki', ''), true)
  assert.equal(trIcerir('Hasta Iki', '   '), true)
  assert.equal(trIcerir('', 'hasta'), false)
  assert.equal(trIcerir(null, 'hasta'), false)
  assert.equal(trIcerir(undefined, undefined), true)
})

test('boşluk ve baştaki/sondaki fazlalık sadeleşir', () => {
  assert.equal(trAramaNormalize('  Hasta   Iki  '), 'hasta iki')
  assert.equal(trIcerir('Hasta Iki', ' hasta  iki '), true)
})

test('trAyniAd yalnız tam (katlanmış) eşitlikte true', () => {
  assert.equal(trAyniAd('Hasta Iki', 'hasta iki'), true)
  assert.equal(trAyniAd('IŞIK YILMAZ', 'ışık yılmaz'), true)
  assert.equal(trAyniAd('Hasta Iki', 'Hasta'), false)
  assert.equal(trAyniAd('', ''), false)
})

test('trParcaEslesir ad/soyad önekiyle daraltır', () => {
  assert.equal(trParcaEslesir('Işık Yılmaz', 'yıl'), true)
  assert.equal(trParcaEslesir('Işık Yılmaz', 'yil'), true)
  assert.equal(trParcaEslesir('Hasta Iki', 'ik'), true)
  assert.equal(trParcaEslesir('Hasta Iki', 'ki'), true) // "iki" içinde geçiyor
  assert.equal(trParcaEslesir('Ayşe Demir', 'dem'), true)
  assert.equal(trParcaEslesir('Ayşe Demir', 'zor'), false)
  assert.equal(trParcaEslesir('Bilinmiyor', 'ilk', ['İlknur', 'Çınar']), true)
})
