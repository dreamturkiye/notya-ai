import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iosMu, sileroKullanilirMi } from './fishSilero'
import { FISH_SES_SIZLIGI_MS, FISH_SES_SIZLIGI_SILERO_MS, kareKonusmasi, klipGonderilirMi, sessizlikKuyrugu, sileroKonusuyorMu, turAdimi, turBaslat, type SileroOlasilik } from './fishVad'

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

test('silero: opt-in — off by default, NEXT_PUBLIC_NOTYA_SILERO=1 enables, iOS also needs the iOS flag', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari'
  const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15'
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
  assert.equal(iosMu(iphone), true)
  assert.equal(iosMu(ipad, 5), true)
  assert.equal(iosMu(ipad, 0), false)
  assert.equal(sileroKullanilirMi({ ua: chrome }), false)
  assert.equal(sileroKullanilirMi({ ua: chrome, genel: undefined }), false)
  assert.equal(sileroKullanilirMi({ ua: chrome, genel: '1' }), true)
  assert.equal(sileroKullanilirMi({ ua: chrome, genel: '0' }), false)
  assert.equal(sileroKullanilirMi({ ua: iphone, genel: '1' }), false)
  assert.equal(sileroKullanilirMi({ ua: iphone, genel: '1', ios: '1' }), true)
  assert.equal(sileroKullanilirMi({ ua: iphone, ios: '1' }), false)
})

/** Drive the turn machine with 32 ms Silero frames (512 samples @ 16 kHz); `gecikme` stretches the wall clock between frames. */
function sileroTuru(olasiliklar: number[], gecikmeMs = 32) {
  let tur = turBaslat()
  let onceki = false
  let simdi = 100_000
  let bitir: 'sessizlik' | 'azami' | null = null
  let kareSayisi = 0
  for (const p of olasiliklar) {
    simdi += gecikmeMs
    kareSayisi += 1
    const silero: SileroOlasilik = { p, zaman: simdi }
    const kare = kareKonusmasi({ rms: 0.001, silero, onceki, simdi })
    onceki = kare.ses
    const adim = turAdimi(tur, { ses: kare.ses, kaynak: kare.kaynak, simdi, kareMs: 32 })
    tur = adim.durum
    if (adim.bitir) { bitir = adim.bitir; break }
  }
  return { tur, bitir, kareSayisi }
}

test('silero gate: 1.2 s of speech (with two hysteresis dips) closes on the 350 ms tail and passes the junk gate', () => {
  const sessiz = (n: number) => Array.from({ length: n }, () => 0.05)
  const konusma = Array.from({ length: 38 }, (_, i) => (i === 12 || i === 25 ? 0.4 : 0.85)) // 38 × 32 ms ≈ 1216 ms, dips stay inside hysteresis
  const r = sileroTuru([...sessiz(8), ...konusma, ...sessiz(30)])
  assert.equal(r.bitir, 'sessizlik')
  assert.equal(r.tur.kaynak, 'silero')
  assert.ok(r.tur.sesliMs >= 1150 && r.tur.sesliMs <= 1280, `sesli ${r.tur.sesliMs}`)
  // closes at the first frame ≥ 350 ms after speech ended: 11–12 silent frames, not the whole 30
  assert.ok(r.kareSayisi >= 8 + 38 + 11 && r.kareSayisi <= 8 + 38 + 13, `kare ${r.kareSayisi}`)
  const toplamMs = r.kareSayisi * 32 + 300 // + pre-roll
  assert.deepEqual(klipGonderilirMi({ toplamMs, sesliMs: r.tur.sesliMs }), { gonder: true, neden: null })
})

test('silero gate: late frames (main thread busy) still credit wall-clock voiced time; a 100 ms blip is junk', () => {
  const konusma = Array.from({ length: 38 }, () => 0.9)
  const gec = sileroTuru([...konusma, ...Array.from({ length: 10 }, () => 0.05)], 96) // every frame 3× late
  assert.equal(gec.bitir, 'sessizlik')
  assert.ok(gec.tur.sesliMs >= 3500, `sesli ${gec.tur.sesliMs}`) // nominal count would say 1216
  const blip = sileroTuru([...Array.from({ length: 3 }, () => 0.9), ...Array.from({ length: 30 }, () => 0.05)])
  assert.equal(blip.bitir, 'sessizlik')
  assert.deepEqual(klipGonderilirMi({ toplamMs: 300 + blip.kareSayisi * 32, sesliMs: blip.tur.sesliMs }), { gonder: false, neden: 'sesli_kisa' })
})
