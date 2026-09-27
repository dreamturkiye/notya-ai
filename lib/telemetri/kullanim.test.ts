import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cihazKovasi, kullanimOlayiKur, olayPiiIcerirMi, sayfaTipi } from './kullanim'

test('sayfaTipi UUID ve adı yola gömmez', () => {
  assert.equal(sayfaTipi('/dashboard/doktor/hastalar/a1b2c3d4-e5f6-7890-abcd-ef1234567890'), 'hasta')
  assert.equal(sayfaTipi('/dashboard/doktor/hastalar'), 'hastalar')
  assert.equal(sayfaTipi('/dashboard/doktor/randevular'), 'randevular')
  assert.equal(sayfaTipi('/dashboard/doktor/notlar/a1b2c3d4-e5f6-7890-abcd-ef1234567890'), 'not')
  assert.equal(sayfaTipi('/dashboard/doktor'), 'ana')
})

test('olay kurucusu PII / hasta id / metin taşımaz', () => {
  const o = kullanimOlayiKur({
    yol: '/dashboard/doktor/hastalar/11111111-2222-4333-8444-555555555555?ad=Ayşe',
    oncekiYol: '/dashboard/doktor/randevular',
    sureMs: 1200,
    genislik: 390,
  })
  assert.equal(o.sayfa, 'hasta')
  assert.equal(o.onceki, 'randevular')
  assert.equal(o.cihaz, 'telefon')
  assert.equal(olayPiiIcerirMi(o), false)
  const t = JSON.stringify(o)
  assert.doesNotMatch(t, /11111111/)
  assert.doesNotMatch(t, /Ay[sş]e/i)
  assert.doesNotMatch(t, /patient/i)
})

test('cihaz kovası üç kova', () => {
  assert.equal(cihazKovasi(400), 'telefon')
  assert.equal(cihazKovasi(900), 'tablet')
  assert.equal(cihazKovasi(1400), 'masaustu')
})
