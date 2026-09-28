import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kendiSelamiMi, ozgecmisAcilisiMi } from './acilis'

test('özgeçmiş açılışı tanınır, normal selam ve cevap karışmaz', () => {
  assert.equal(ozgecmisAcilisiMi('Ben Prof. Dr. Ayşe Kaya, Pediatri Uzmanıyım. Çocuk sağlığı alanında çalışıyorum.'), true)
  assert.equal(ozgecmisAcilisiMi('Ben Prof. Dr. Ayşe Kaya, pediatri uzmanıyım Hocam. Klinik destek sunuyorum.'), true)
  assert.equal(ozgecmisAcilisiMi('Merhaba Hocam. Nasıl yardımcı olabilirim?'), false)
  assert.equal(ozgecmisAcilisiMi('Elif üç gündür ateşli.'), false)
})

test('kendi selamı doktor sorusu değildir', () => {
  assert.equal(kendiSelamiMi('Merhaba Kaan Hocam. Nasıl yardımcı olabilirim?'), true)
  assert.equal(kendiSelamiMi('Merhaba Hocam. Nasıl yardımcı olabilirim'), true)
  assert.equal(kendiSelamiMi('Elif’in ateşi devam ediyor mu?'), false)
  assert.equal(kendiSelamiMi('Merhaba. Elif üç gündür ateşli.'), false)
})
