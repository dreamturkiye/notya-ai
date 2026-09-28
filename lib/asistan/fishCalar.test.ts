import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fishBirlestir, fishYeniCumleler } from './fishCalar'

test('ilk bitmiş cümle hemen söylenir, yarım cümle bekler, tam metin tekrar söylenmez', () => {
  const a = fishYeniCumleler('', 'Gerçekten kahve içemem', false)
  assert.deepEqual(a.soyle, [])
  const b = fishYeniCumleler(a.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz', false)
  assert.deepEqual(b.soyle, ['Gerçekten kahve içemem.'])
  const c = fishYeniCumleler(b.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz.', true)
  assert.deepEqual(c.soyle, ['Ama sohbet ederiz.'])
  const d = fishYeniCumleler(c.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz.', true)
  assert.deepEqual(d.soyle, [])
})

test('parça gelmeden biten tur tek klip kalır', () => {
  const t = fishYeniCumleler('', 'Bir. İki.', true)
  assert.deepEqual(t.soyle, ['Bir. İki.'])
})

test('delta ya parça ya da biriken metnin tamamıdır', () => {
  assert.equal(fishBirlestir('Gerçekten ', 'kahve'), 'Gerçekten kahve')
  assert.equal(fishBirlestir('Gerçekten kahve', 'Gerçekten kahve içemem.'), 'Gerçekten kahve içemem.')
  assert.equal(fishBirlestir('Gerçekten kahve', 'kahve'), 'Gerçekten kahve')
})
