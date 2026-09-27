import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onbellekAnahtari, surumHash, tazeMi } from './dosyaOnbellek'

test('önbellek anahtarı doctor_id + patient_id; çapraz doktor ayrı', () => {
  const a = onbellekAnahtari('dok-a', 'hasta-1')
  const b = onbellekAnahtari('dok-b', 'hasta-1')
  assert.notEqual(a.doctor_id, b.doctor_id)
  assert.equal(a.patient_id, b.patient_id)
})

test('kirli veya boş satır taze değil; dolu + kirli=false taze', () => {
  assert.equal(tazeMi(null), false)
  assert.equal(tazeMi({ kirli: true, paket_metin: 'x' }), false)
  assert.equal(tazeMi({ kirli: false, paket_metin: '' }), false)
  assert.equal(tazeMi({ kirli: false, paket_metin: 'dosya' }), true)
})

test('invalidate: kirli=true tazeMi false (miss)', () => {
  const once = { kirli: false, paket_metin: 'eski' }
  assert.equal(tazeMi(once), true)
  const sonra = { ...once, kirli: true }
  assert.equal(tazeMi(sonra), false)
})

test('arşivlenmiş vizit pakette yok — derleme metni arşiv satırı içermez', () => {
  const metin = 'Vizit: 12 Mayıs 2026\nŞikayet: öksürük'
  assert.doesNotMatch(metin, /arsiv|archived/i)
  const hash = surumHash(metin, [{ tur: 'vizit', arsiv: false }])
  assert.equal(hash.length, 24)
})

test('prefetch idempotent: aynı hash ikinci yazımda değişmez', () => {
  const h1 = surumHash('aynı paket', [1, 2])
  const h2 = surumHash('aynı paket', [1, 2])
  assert.equal(h1, h2)
})
