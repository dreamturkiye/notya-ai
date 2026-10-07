import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bargeSayaci, konusuyorMu, rmsHesapla, klipGonderilirMi, onTamponuKirp, tazeSileroP, FISH_BARGE_MS, FISH_SILERO_TAZELIK_MS } from './fishVad'

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
  assert.equal(FISH_BARGE_MS, 300)
  assert.ok(ms >= FISH_BARGE_MS)
  assert.deepEqual(bargeSayaci(ms, true, 0.03), { ms: 0, kes: false })
  assert.deepEqual(bargeSayaci(ms, false, 0.2), { ms: 0, kes: false })
})

test('NOTYA-AYSE-GURULTU-01: barge-in needs RMS AND Silero speech when Silero is up; without Silero the RMS rule', () => {
  // Smoke-alarm chirp: loud, Silero low → never cuts her.
  let ms = 0
  for (let i = 0; i < 20; i++) {
    const r = bargeSayaci(ms, true, 0.5, 50, 0.1)
    ms = r.ms
    assert.equal(r.kes, false)
  }
  // Doctor: loud AND speech → cuts after FISH_BARGE_MS.
  ms = 0
  let kes = false
  for (let i = 0; i < 10 && !kes; i++) {
    const r = bargeSayaci(ms, true, 0.2, 50, 0.8)
    ms = r.ms
    kes = r.kes
  }
  assert.equal(kes, true)
  // Speaker leak: Silero says speech, RMS low → no.
  assert.deepEqual(bargeSayaci(0, true, 0.03, 50, 0.95), { ms: 0, kes: false })
  // Silero unavailable (null) → today's RMS rule.
  assert.deepEqual(bargeSayaci(250, true, 0.2, 50, null), { ms: 300, kes: true })
})

test('NOTYA-AYSE-GURULTU-01: only a fresh Silero probability reaches the barge rule', () => {
  assert.equal(tazeSileroP({ p: 0.7, zaman: 1000 }, 1100), 0.7)
  assert.equal(tazeSileroP({ p: 0.7, zaman: 1000 }, 1000 + FISH_SILERO_TAZELIK_MS + 1), null)
  assert.equal(tazeSileroP(null, 1000), null)
})

test('tek tık / öksürük gönderilmez; gerçek tur gönderilir', () => {
  assert.deepEqual(klipGonderilirMi({ toplamMs: 900, sesliMs: 43 }), { gonder: false, neden: 'sesli_kisa' })
  assert.deepEqual(klipGonderilirMi({ toplamMs: 400, sesliMs: 300 }), { gonder: false, neden: 'toplam_kisa' })
  assert.deepEqual(klipGonderilirMi({ toplamMs: 1400, sesliMs: 500 }), { gonder: true, neden: null })
})

test('konuşma öncesi tampon 300 ms ile sınırlı — 40 sn sessizlik klibe girmez', () => {
  const hz = 16000
  const parcalar: Float32Array[] = []
  for (let i = 0; i < 400; i++) parcalar.push(new Float32Array(2048)) // ~51 s
  onTamponuKirp(parcalar, hz)
  let n = 0
  for (const p of parcalar) n += p.length
  assert.ok(n <= 2048 * 4, `kalan ${n}`)
  assert.ok(n >= Math.ceil(0.3 * hz), `kalan ${n}`)
})
