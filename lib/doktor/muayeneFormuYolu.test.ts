/**
 * NOTYA-MUAYENEYE-DON-01 — dönüş bağlantısının iki kuralı:
 *  1) doğru muayene formuna gitmeli (hekimin düzenleyebildiği not sayfası),
 *  2) not GERÇEKTEN eklenmediyse hiç çıkmamalı — hekimi boş bir forma göndermeyelim.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { muayeneFormuYolu, MUAYENE_FORMUNA_DON, eklenenNotId } from './muayeneFormuYolu'

test('muayeneFormuYolu hekimin düzenleyebildiği not sayfasına gider', () => {
  assert.equal(muayeneFormuYolu('abc-123'), '/dashboard/doktor/notlar/abc-123')
})

test('muayeneFormuYolu id kaçışı yapar (bozuk id ile yol kırılmaz)', () => {
  assert.equal(muayeneFormuYolu('a/b?c'), '/dashboard/doktor/notlar/a%2Fb%3Fc')
})

test('etiket Türkçe ve tek kaynakta', () => {
  assert.equal(MUAYENE_FORMUNA_DON, 'Muayene Formuna Dön →')
})

test('eklenenNotId: notEkleme şekli — eklendiyse notId döner', () => {
  assert.equal(eklenenNotId({ notEkleme: { eklendi: true, notId: 'n1' } }), 'n1')
})

test('eklenenNotId: notEkleme eklenmediyse null (bağlantı çizilmez)', () => {
  assert.equal(eklenenNotId({ notEkleme: { eklendi: false, notId: null, sebep: 'Bugün muayene yok.' } }), null)
  // notId dolu olsa bile eklendi=false ise gösterilmez
  assert.equal(eklenenNotId({ notEkleme: { eklendi: false, notId: 'n1' } }), null)
})

test('eklenenNotId: düz { ok, notId } şekli — dahiliye/göz kartları', () => {
  assert.equal(eklenenNotId({ ok: true, notId: 'n2' }), 'n2')
  assert.equal(eklenenNotId({ ok: false, notId: 'n2' }), null)
  assert.equal(eklenenNotId({ ok: true, notId: null }), null)
})

test('eklenenNotId: nota dokunmayan adımlar bağlantı üretmez', () => {
  assert.equal(eklenenNotId({ ok: true, sayi: 3 }), null)
  assert.equal(eklenenNotId({}), null)
  assert.equal(eklenenNotId(null), null)
  assert.equal(eklenenNotId(undefined), null)
  assert.equal(eklenenNotId('hata'), null)
})
