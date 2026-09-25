import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { aktifHastaKullanilsinMi, kohortSorusuMu } from './aktifHasta'

const aktif = (mesaj: string, cozumTur: 'tek' | 'coklu' | 'yok' = 'yok', aramaSonucu = true, aktifHastaVar = true) =>
  aktifHastaKullanilsinMi({ aktifHastaVar, cozumTur, aramaSonucu, mesaj })

test('açık hasta varken adsız soru o hastaya gider (Dr. Gökhan)', () => {
  assert.equal(aktif('En son ne zaman geldi?'), true)
  assert.equal(aktif('Tansiyon takibini nasıl planlarsın?'), true)
  assert.equal(aktif('Son muayenede ateşi kaçtı?', 'coklu', true), true)
  assert.equal(aktif('Kaç kez geldi?'), true)
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

test('NOTYA-SES-DOLGU-01: açık hasta varken tek arama sonucu adla bulunmuş hastanın yerine geçmez', () => {
  assert.equal(aktif('Ayşe, en son ne zaman geldi', 'tek', true), true)
  assert.equal(aktif('Umutcan kaç yaşında', 'tek', false), false)
})
