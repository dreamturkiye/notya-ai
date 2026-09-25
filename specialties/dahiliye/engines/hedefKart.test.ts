import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { kbHedefCoz } from './hedefKart'

test('kbHedefCoz: check-up raporu biçimi {sbp, dbp} okunur (canlı hata: undefined mmHg)', () => {
  assert.deepEqual(kbHedefCoz({ sbp: 130, dbp: 80 }), { sbpUst: 130, dbpUst: 80 })
})

test('kbHedefCoz: Hedef kartı biçimi {sbpUst, dbpUst} aynen korunur; diyastolik yoksa null', () => {
  assert.deepEqual(kbHedefCoz({ sbpUst: 140, dbpUst: 90 }), { sbpUst: 140, dbpUst: 90 })
  assert.deepEqual(kbHedefCoz({ sbpUst: 140, dbpUst: null }), { sbpUst: 140, dbpUst: null })
  assert.deepEqual(kbHedefCoz({ sbp: '130', dbp: '' }), { sbpUst: 130, dbpUst: null })
})

test('kbHedefCoz: geçersiz / boş kilit → null (Hekiminiz belirleyecek)', () => {
  assert.equal(kbHedefCoz(null), null)
  assert.equal(kbHedefCoz({}), null)
  assert.equal(kbHedefCoz({ sbp: 'abc' }), null)
  assert.equal(kbHedefCoz('130/80'), null)
})
