import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KAPI_ACMA_MS, KAPI_KUYRUK_MS, KAPI_RMS_TABAN, kapiAdimi, kapiAyariAcikMi, kapiBaslat, kapiKonusmaMi, type KapiDurumu } from './konusmaKapisi'
import { sdkMikrofonAkisi } from './elevenKapi'

/** Drive the gate with 32 ms Silero frames. Each frame: [p, rms]. */
function sur(kareler: Array<[number | null, number]>, ajan = true, d0: KapiDurumu = kapiBaslat(), t0 = 10_000) {
  let d = d0
  let t = t0
  const iz: boolean[] = []
  for (const [p, rms] of kareler) {
    t += 32
    d = kapiAdimi(d, { t, ajanKonusuyor: ajan, p, rms })
    iz.push(d.acik)
  }
  return { d, iz, t }
}
const tekrar = <T,>(n: number, x: T): T[] => Array.from({ length: n }, () => x)

test('gate: Ayşe silent → always open, whatever the room does', () => {
  const r = sur([...tekrar(20, [0.01, 0.0] as [number, number]), ...tekrar(20, [0.9, 0.3] as [number, number])], false)
  assert.ok(r.iz.every(Boolean))
  assert.equal(r.d.neden, 'ajan_susuyor')
})

test('gate: Ayşe starts speaking in silence → closes at once', () => {
  const sessiz = sur(tekrar(10, [0.02, 0.005] as [number, number]), false)
  const r = sur([[0.02, 0.005]], true, sessiz.d, sessiz.t)
  assert.equal(r.d.acik, false)
})

test('gate: smoke-alarm chirp / clap (loud, not speech) never opens it', () => {
  // A chirp: very loud for ~100 ms, Silero low.
  const r = sur([...tekrar(5, [0.05, 0.002] as [number, number]), ...tekrar(4, [0.12, 0.6] as [number, number]), ...tekrar(30, [0.05, 0.002] as [number, number])])
  assert.ok(r.iz.every((a) => !a), 'gate opened on a chirp')
})

test('gate: speaker leak (Silero says speech, RMS under the floor) never opens it', () => {
  const r = sur(tekrar(40, [0.95, KAPI_RMS_TABAN * 0.6] as [number, number]))
  assert.ok(r.iz.every((a) => !a))
})

test('gate: ~200 ms of real speech opens it, hangover keeps it, then it closes', () => {
  const konusma = tekrar(12, [0.9, 0.12] as [number, number])
  const r = sur([...tekrar(3, [0.02, 0.005] as [number, number]), ...konusma])
  const ilkAcik = r.iz.indexOf(true)
  assert.ok(ilkAcik > 3, 'opened before any speech')
  const acilisMs = (ilkAcik - 3) * 32
  assert.ok(acilisMs >= KAPI_ACMA_MS - 32 && acilisMs <= KAPI_ACMA_MS + 64, `opened after ${acilisMs} ms`)
  // A short dip inside the hysteresis keeps it open.
  const dip = sur([[0.4, 0.1], [0.4, 0.1], [0.9, 0.12]], true, r.d, r.t)
  assert.ok(dip.iz.every(Boolean))
  // Silence: open during the hangover, closed after it.
  const sus = sur(tekrar(30, [0.05, 0.003] as [number, number]), true, dip.d, dip.t)
  const kapanis = sus.iz.indexOf(false)
  assert.ok(kapanis > 0)
  assert.ok(kapanis * 32 >= KAPI_KUYRUK_MS - 64 && kapanis * 32 <= KAPI_KUYRUK_MS + 64, `closed after ${kapanis * 32} ms`)
})

test('gate: a 100 ms word fragment does not open it; a non-speech frame resets the count', () => {
  const r = sur([[0.02, 0.005], ...tekrar(3, [0.9, 0.12] as [number, number]), [0.1, 0.12], ...tekrar(3, [0.9, 0.12] as [number, number]), ...tekrar(10, [0.05, 0.003] as [number, number])])
  assert.ok(r.iz.every((a) => !a))
})

test('gate: fail open — unknown Silero (null / NaN) while Ayşe speaks is open', () => {
  const r = sur([[null, 0.0], [Number.NaN, 0.5]])
  assert.ok(r.iz.every(Boolean))
  assert.equal(r.d.neden, 'bilinmiyor')
})

test('gate: doctor already speaking when Ayşe starts → stays open (no clipped first words)', () => {
  const doktor = sur(tekrar(10, [0.9, 0.15] as [number, number]), false)
  const r = sur(tekrar(5, [0.9, 0.15] as [number, number]), true, doktor.d, doktor.t)
  assert.ok(r.iz.every(Boolean))
})

test('gate: a stalled tab cannot accumulate speech in one jump', () => {
  let d = kapiBaslat()
  d = kapiAdimi(d, { t: 1000, ajanKonusuyor: true, p: 0.02, rms: 0.002 })
  d = kapiAdimi(d, { t: 1032, ajanKonusuyor: true, p: 0.9, rms: 0.2 })
  d = kapiAdimi(d, { t: 4000, ajanKonusuyor: true, p: 0.9, rms: 0.2 })
  assert.equal(d.acik, false)
})

test('gate: detector frame needs both Silero and the RMS floor (hysteresis on Silero)', () => {
  assert.equal(kapiKonusmaMi(0.6, 0.2, false), true)
  assert.equal(kapiKonusmaMi(0.4, 0.2, false), false)
  assert.equal(kapiKonusmaMi(0.4, 0.2, true), true)
  assert.equal(kapiKonusmaMi(0.9, 0.01, true), false)
})

test('kill switch: default ON; kapali / off / 0 / false turn it off', () => {
  assert.equal(kapiAyariAcikMi(null), true)
  assert.equal(kapiAyariAcikMi(''), true)
  assert.equal(kapiAyariAcikMi('acik'), true)
  for (const v of ['kapali', 'KAPALI', 'kapalı', 'off', '0', 'false']) assert.equal(kapiAyariAcikMi(v), false, v)
})

test('SDK microphone stream: only a live audio stream counts; any other shape is "no gate"', () => {
  const canli = { getAudioTracks: () => [{ readyState: 'live' }] }
  assert.equal(sdkMikrofonAkisi({ input: { inputStream: canli } }), canli)
  assert.equal(sdkMikrofonAkisi({ input: { inputStream: { getAudioTracks: () => [{ readyState: 'ended' }] } } }), null)
  assert.equal(sdkMikrofonAkisi({ input: {} }), null)
  assert.equal(sdkMikrofonAkisi({}), null)
  assert.equal(sdkMikrofonAkisi(null), null)
  assert.equal(sdkMikrofonAkisi({ get input() { throw new Error('x') } }), null)
})
