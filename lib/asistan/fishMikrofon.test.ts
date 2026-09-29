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
