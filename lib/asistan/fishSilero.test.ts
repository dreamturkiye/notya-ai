import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iosMu, sileroKullanilirMi } from './fishSilero'
import { FISH_SES_SIZLIGI_MS, FISH_SES_SIZLIGI_SILERO_MS, kareKonusmasi, sessizlikKuyrugu, sileroKonusuyorMu } from './fishVad'

test('silero: hysteresis — enters at 0.5, stays until below 0.35', () => {
  assert.equal(sileroKonusuyorMu(0.49, false), false)
  assert.equal(sileroKonusuyorMu(0.5, false), true)
  assert.equal(sileroKonusuyorMu(0.4, true), true)
  assert.equal(sileroKonusuyorMu(0.34, true), false)
  assert.equal(sileroKonusuyorMu(NaN, true), false)
})

test('silero: frame gate uses Silero when fresh, RMS when stale or missing; tail 350 vs 600', () => {
  const simdi = 10_000
  const a = kareKonusmasi({ rms: 0.001, silero: { p: 0.9, zaman: simdi - 40 }, onceki: false, simdi })
  assert.deepEqual(a, { ses: true, kaynak: 'silero' })
  const b = kareKonusmasi({ rms: 0.05, silero: { p: 0.1, zaman: simdi - 40 }, onceki: false, simdi })
  assert.deepEqual(b, { ses: false, kaynak: 'silero' })
  const c = kareKonusmasi({ rms: 0.05, silero: { p: 0.1, zaman: simdi - 900 }, onceki: false, simdi })
  assert.deepEqual(c, { ses: true, kaynak: 'rms' })
  const d = kareKonusmasi({ rms: 0.05, silero: null, onceki: false, simdi })
  assert.equal(d.kaynak, 'rms')
  assert.equal(sessizlikKuyrugu('silero'), FISH_SES_SIZLIGI_SILERO_MS)
  assert.equal(sessizlikKuyrugu('rms'), FISH_SES_SIZLIGI_MS)
  assert.equal(FISH_SES_SIZLIGI_SILERO_MS, 350)
})

test('silero: iOS stays on RMS unless explicitly enabled; global kill switch wins', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari'
  const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15'
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
  assert.equal(iosMu(iphone), true)
  assert.equal(iosMu(ipad, 5), true)
  assert.equal(iosMu(ipad, 0), false)
  assert.equal(sileroKullanilirMi({ ua: iphone }), false)
  assert.equal(sileroKullanilirMi({ ua: iphone, ios: '1' }), true)
  assert.equal(sileroKullanilirMi({ ua: chrome }), true)
  assert.equal(sileroKullanilirMi({ ua: chrome, genel: '0' }), false)
})
