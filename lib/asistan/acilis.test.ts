import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ozgecmisAcilisiMi } from './acilis'

test('özgeçmiş açılışı tanınır, normal selam ve cevap karışmaz', () => {
  assert.equal(ozgecmisAcilisiMi('Ben Prof. Dr. Ayşe Kaya, Pediatri Uzmanıyım. Çocuk sağlığı alanında çalışıyorum.'), true)
  assert.equal(ozgecmisAcilisiMi('Ben Prof. Dr. Ayşe Kaya, pediatri uzmanıyım Hocam. Klinik destek sunuyorum.'), true)
  assert.equal(ozgecmisAcilisiMi('Merhaba Hocam. Nasıl yardımcı olabilirim?'), false)
  assert.equal(ozgecmisAcilisiMi('Elif üç gündür ateşli.'), false)
})
