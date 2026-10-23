import test from 'node:test'
import assert from 'node:assert/strict'
import { rotaAcikMi } from './rotaKapisi'

test('static portrait images are reachable in a country build (AU-PORTRE-01: they 404ed behind the gate)', () => {
  const izin = { sayfalar: ['/asistan'], apiOnEkleri: ['/api/ulke/'] } as never
  assert.equal(rotaAcikMi(izin, '/portreler/au/paediatrics.webp'), true)
  assert.equal(rotaAcikMi(izin, '/doktor/hastalar'), false)
})
