import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bargeSayaci, konusuyorMu, rmsHesapla, FISH_BARGE_MS } from './fishVad'

test('RMS sessizlik ve konuşmayı ayırır', () => {
  assert.equal(rmsHesapla([]), 0)
  assert.ok(rmsHesapla([0, 0, 0]) < 0.001)
  assert.ok(rmsHesapla([0.5, -0.5, 0.5, -0.5]) > 0.4)
  assert.equal(konusuyorMu(0.001), false)
  assert.equal(konusuyorMu(0.05), true)
})

test('barge-in speaker sızıntısında kesmez, doktor mikrofonda süreyle keser', () => {
  assert.deepEqual(bargeSayaci(0, true, 0.03), { ms: 0, kes: false })
  let s = bargeSayaci(0, true, 0.2)
  assert.equal(s.kes, false)
  s = bargeSayaci(s.ms, true, 0.2)
  assert.equal(s.kes, false)
  let ms = 0
  let kes = false
  for (let i = 0; i < 10; i++) {
    const r = bargeSayaci(ms, true, 0.2)
    ms = r.ms
    kes = r.kes
  }
  assert.equal(kes, true)
  assert.ok(ms >= FISH_BARGE_MS)
  assert.deepEqual(bargeSayaci(ms, true, 0.03), { ms: 0, kes: false })
  assert.deepEqual(bargeSayaci(ms, false, 0.2), { ms: 0, kes: false })
})
