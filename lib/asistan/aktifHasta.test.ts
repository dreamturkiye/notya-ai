import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { aktifHastaKullanilsinMi, dosyaAcmaIstegiMi, hastaAtifiMu, kohortSorusuMu } from './aktifHasta'

const aktif = (mesaj: string, cozumTur: 'tek' | 'coklu' | 'yok' = 'yok', aramaSonucu = true, aktifHastaVar = true) =>
  aktifHastaKullanilsinMi({ aktifHastaVar, cozumTur, aramaSonucu, mesaj })

test('açık hasta varken adsız soru o hastaya gider (NOTYA-AKTIF-HASTA-01, Kaan 2026-09-29: 09-25 kuralı geri)', () => {
  assert.equal(aktif('En son ne zaman geldi?'), true)
  assert.equal(aktif('Tansiyon takibini nasıl planlarsın?'), true)
  assert.equal(aktif('Son muayenede ateşi kaçtı?', 'coklu', true), true)
  assert.equal(aktif('Kaç kez geldi?'), true)
  assert.equal(aktif('Merhaba Ayşe, nasılsınız?', 'yok', false), true) // page focus binds too (NOTYA-SAYFA-HASTA-01)
  assert.equal(aktif('Kaan Arioglu kaç yaşında?', 'tek', false), false) // a name in this message wins
})

test('takvim / bugün randevu açık hastanın dosyasına gitmez', () => {
  assert.equal(aktif('Bugün randevu var mı?'), false)
  assert.equal(aktif('do we have any appointments today'), false)
  assert.equal(aktif('Yarın 14:00 boş mu?'), false)
})

test('çok hastalı sorular arama olarak kalır', () => {
  for (const m of ['Bu hafta ateşli hastalarım kimler?', 'Kaç hasta gördük bu ay?', 'Hangi hastalar aşı bekliyor?', 'En çok yazdığım antibiyotik ne?', 'Tüm hastalarımda HbA1c ortalaması', 'Bu hafta tanı koyduğum pnömoni vakası kimdi?', 'kulak iltihabı olan çocuk kimdi', 'dün gelen ateşli vaka']) {
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

test('NOTYA-SES-AKTIF-HASTA-01: atıf (hastamız / bu hasta / kendisi) aktif hastaya döner', () => {
  for (const m of ['Ah hastamız kaç yaşında hocam?', 'Bu hastanın son aşısı ne?', 'Kendisi en son ne zaman geldi?', 'Dosyadaki hastanın ilaçları?', 'O kaç kilo?']) {
    assert.equal(hastaAtifiMu(m), true, m)
    assert.equal(aktif(m, 'yok', false), true, m)
  }
  assert.equal(aktif('Hastamız kaç yaşında?', 'yok', false, false), false) // no active patient
  assert.equal(aktif('Hastamız kaç yaşında?', 'tek', false), false) // a name already resolved
  assert.equal(aktif('Hastamız kaç yaşında?', 'yok', true), true) // a 0-hit filter search is not an answer with a patient open
  assert.equal(hastaAtifiMu('Kaç hastam var?'), false)
  assert.equal(hastaAtifiMu('Bu hafta ateşli hastalarım kimler?'), false)
  assert.equal(hastaAtifiMu('O zaman yarın görüşürüz'), false)
})

test('dosya açma isteği tanınır', () => {
  for (const m of ["Kaan Arıoğlu'nun dosyasını açar mısın", 'Ayşe Yeşil kartını getir', 'Mehmet Yılmaz kaydına bakalım', 'dosyasını göster']) assert.equal(dosyaAcmaIstegiMi(m), true, m)
  for (const m of ['Kaan Arıoğlu kaç yaşında?', 'Nasılsınız?', 'Kaç hastam var?']) assert.equal(dosyaAcmaIstegiMi(m), false, m)
})

test('NOTYA-LUNA-ARAMA-01: İlk 10 dosya sorusu (iyelik ekli) aktif hastaya atıftır', () => {
  for (const m of ['Aşıları tam mı?', 'Büyümesi nasıl gidiyor?', 'Şu anda kullandığı ilaçlar neler?', 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', 'Bu hastayı bana kısaca özetler misin?']) {
    assert.equal(hastaAtifiMu(m), true, m)
    assert.equal(aktif(m, 'yok', false), true, m)
    assert.equal(aktif(m, 'yok', false, false), false, `${m} — açık hasta yok`)
  }
  for (const m of ['Nasılsınız?', 'Kaç kilo?', 'Bu hafta ateşli hastalarım kimler?']) assert.equal(hastaAtifiMu(m), false, m)
})
