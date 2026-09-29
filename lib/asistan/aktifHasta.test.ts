import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { aktifHastaKullanilsinMi, kohortSorusuMu } from './aktifHasta'

const aktif = (mesaj: string, cozumTur: 'tek' | 'coklu' | 'yok' = 'yok', aramaSonucu = true, aktifHastaVar = true) =>
  aktifHastaKullanilsinMi({ aktifHastaVar, cozumTur, aramaSonucu, mesaj })

test('odaklı hasta varken adsız soru dosya açmaz (NOTYA-SES-DOSYA-ISTE-01)', () => {
  assert.equal(aktif('En son ne zaman geldi?'), false)
  assert.equal(aktif('Tansiyon takibini nasıl planlarsın?'), false)
  assert.equal(aktif('Son muayenede ateşi kaçtı?', 'coklu', true), false)
  assert.equal(aktif('Kaç kez geldi?'), false)
  assert.equal(aktif('Kaan Arioglu kaç yaşında?', 'tek', false), false)
})

test('takvim / bugün randevu açık hastanın dosyasına gitmez', () => {
  assert.equal(aktif('Bugün randevu var mı?'), false)
  assert.equal(aktif('do we have any appointments today'), false)
  assert.equal(aktif('Yarın 14:00 boş mu?'), false)
})

test('çok hastalı sorular arama olarak kalır', () => {
  for (const m of ['Bu hafta ateşli hastalarım kimler?', 'Kaç hasta gördük bu ay?', 'Hangi hastalar aşı bekliyor?', 'En çok yazdığım antibiyotik ne?', 'Tüm hastalarımda HbA1c ortalaması']) {
    assert.equal(kohortSorusuMu(m), true, m)
    assert.equal(aktif(m), false, m)
  }
})

test('açık hasta yoksa, ad eşleştiyse ya da ad birden çok hastaya uyuyorsa aktif hastaya dönülmez', () => {
  assert.equal(aktif('En son ne zaman geldi?', 'yok', true, false), false)
  assert.equal(aktif('Ayşe Yeşil ne zaman geldi?', 'tek', false), false)
  assert.equal(aktif('Ayşe ne zaman geldi?', 'coklu', false), false)
})

test('odak hiçbir mesajda dosyayı bağlama düşmez', () => {
  assert.equal(aktif('Ayşe, en son ne zaman geldi', 'tek', true), false)
  assert.equal(aktif('Umutcan kaç yaşında', 'tek', false), false)
})
