import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pcmdenWav } from './fishMikrofon'
import { fishAsrDosyaAdi } from './fishSes'

test('Fish ASR dosya adı kapsayıcıya uyum', () => {
  assert.equal(fishAsrDosyaAdi('audio/wav'), 'tur.wav')
  assert.equal(fishAsrDosyaAdi('audio/webm;codecs=opus'), 'tur.webm')
  assert.equal(fishAsrDosyaAdi('audio/mp4'), 'tur.m4a')
  assert.equal(fishAsrDosyaAdi('audio/ogg;codecs=opus'), 'tur.ogg')
})

test('pcmdenWav RIFF mono 16-bit başlığı', async () => {
  const ornek = new Float32Array([0, 0.5, -0.5, 0])
  const blob = pcmdenWav([ornek], 16000)
  assert.equal(blob.type, 'audio/wav')
  const buf = new Uint8Array(await blob.arrayBuffer())
  assert.equal(buf.byteLength, 44 + 8)
  assert.equal(String.fromCharCode(...buf.slice(0, 4)), 'RIFF')
  assert.equal(String.fromCharCode(...buf.slice(8, 12)), 'WAVE')
})

/* ---- NOTYA-SES-TUR-01 ---- */

test('wavBirlestir: two WAV clips become one mono 16-bit clip under one header', async () => {
  const { wavBirlestir } = await import('./fishMikrofon')
  const a = pcmdenWav([new Float32Array([0.1, 0.2, 0.3])], 16000)
  const b = pcmdenWav([new Float32Array([0.4, 0.5])], 16000)
  const m = await wavBirlestir([a, b])
  const buf = new Uint8Array(await m.arrayBuffer())
  const v = new DataView(buf.buffer)
  assert.equal(m.type, 'audio/wav')
  assert.equal(buf.byteLength, 44 + 5 * 2)
  assert.equal(v.getUint32(24, true), 16000)
  assert.equal(v.getUint32(40, true), 10)
  assert.equal(v.getInt16(44 + 3 * 2, true), Math.trunc(0.4 * 0x7fff))
})

/** Fake AudioContext driving the ScriptProcessor path frame by frame under a fake clock. */
function sahteBaglam(hz: number) {
  const islem: { onaudioprocess: ((ev: { inputBuffer: { getChannelData: () => Float32Array } }) => void) | null; connect: () => void; disconnect: () => void } = {
    onaudioprocess: null, connect() {}, disconnect() {},
  }
  const dugum = { connect() {}, disconnect() {}, gain: { value: 1 } }
  const ctx = {
    state: 'running', sampleRate: hz, destination: {},
    createMediaStreamSource: () => dugum, createGain: () => ({ ...dugum, gain: { value: 1 } }),
    createScriptProcessor: () => islem, resume: async () => undefined,
  }
  return { ctx: ctx as unknown as AudioContext, islem }
}

test('defect 1: a first word that starts while the echo guard is still on is kept as pre-roll, the turn is registered', async () => {
  const { fishBirTurKaydet } = await import('./fishMikrofon')
  const hz = 16000
  const kareMs = (2048 / hz) * 1000 // 128 ms
  const { ctx, islem } = sahteBaglam(hz)
  const gercekNow = Date.now
  let simdi = 1_000_000
  Date.now = () => simdi
  try {
    let ajan = true
    const soz = fishBirTurKaydet({} as MediaStream, ctx, { iptal: () => false, ajanKonusuyorMu: () => ajan, bargeIn: () => { throw new Error('barge olmamalı') } })
    const kare = (genlik: number) => { islem.onaudioprocess!({ inputBuffer: { getChannelData: () => new Float32Array(2048).fill(genlik) } }); simdi += kareMs }
    // Ayşe's trailing padding still "playing": the doctor's onset at speech level (0.05 < barge 0.12) — old code wiped it.
    kare(0.05); kare(0.05); kare(0.05)
    ajan = false
    kare(0.05); kare(0.05); kare(0.05); kare(0.05)
    kare(0); kare(0); kare(0); kare(0)
    const klip = await soz
    assert.ok(klip, 'clip must be sent')
    assert.equal(klip!.blob.size, 44 + 10 * 2048 * 2, '300 ms pre-roll (2 frames) kept from under the guard + 4 voiced + 4 silent; old code: 8 frames')
    assert.ok(klip!.sesliMs >= 4 * kareMs)
    assert.equal(klip!.bitis, simdi - kareMs)
  } finally {
    Date.now = gercekNow
  }
})
