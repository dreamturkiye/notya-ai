import { test } from 'node:test'
import assert from 'node:assert/strict'
import { konusuyorMu, rmsHesapla } from './fishVad'

test('RMS sessizlik ve konuşmayı ayırır', () => {
  assert.equal(rmsHesapla([]), 0)
  assert.ok(rmsHesapla([0, 0, 0]) < 0.001)
  assert.ok(rmsHesapla([0.5, -0.5, 0.5, -0.5]) > 0.4)
  assert.equal(konusuyorMu(0.001), false)
  assert.equal(konusuyorMu(0.05), true)
})
