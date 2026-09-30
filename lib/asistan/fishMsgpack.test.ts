import { test } from 'node:test'
import assert from 'node:assert/strict'
import { msgpackCoz, msgpackKodla } from './fishMsgpack'

test('msgpack: Fish start/text events round-trip with exact type tags', () => {
  const start = { event: 'start', request: { text: '', format: 'pcm', sample_rate: 24000, latency: 'low', chunk_length: 120, temperature: 0.7, normalize: false, prosody: { speed: 1, volume: 0, normalize_loudness: true }, references: null } }
  const b = msgpackKodla(start)
  assert.equal(b[0], 0x82) // fixmap 2
  assert.deepEqual(msgpackCoz(b), start)
  const t = msgpackKodla({ event: 'text', text: 'Merhaba Hocam. ' })
  assert.deepEqual(msgpackCoz(t), { event: 'text', text: 'Merhaba Hocam. ' })
})

test('msgpack: ints pick the smallest encoding, floats are float64, long strings use str8/16', () => {
  assert.deepEqual([...msgpackKodla(24000)], [0xcd, 0x5d, 0xc0])
  assert.deepEqual([...msgpackKodla(120)], [0x78])
  assert.deepEqual([...msgpackKodla(200)], [0xcc, 200])
  assert.deepEqual([...msgpackKodla(-1)], [0xff])
  assert.deepEqual([...msgpackKodla(-100)], [0xd0, 0x9c])
  assert.equal(msgpackKodla(0.7)[0], 0xcb)
  assert.equal(msgpackCoz(msgpackKodla(0.7)), 0.7)
  const uzun = 'ü'.repeat(100)
  assert.equal(msgpackKodla(uzun)[0], 0xd9)
  assert.equal(msgpackCoz(msgpackKodla(uzun)), uzun)
  const cokUzun = 'a'.repeat(70000)
  assert.equal(msgpackKodla(cokUzun)[0], 0xdb)
})

test('msgpack: binary audio (bin8/16/32) decodes to the same bytes', () => {
  for (const n of [10, 300, 70000]) {
    const ses = new Uint8Array(n).map((_, i) => i & 255)
    const olay = msgpackCoz(msgpackKodla({ event: 'audio', audio: ses })) as { event: string; audio: Uint8Array }
    assert.equal(olay.event, 'audio')
    assert.ok(olay.audio instanceof Uint8Array)
    assert.equal(olay.audio.byteLength, n)
    assert.equal(olay.audio[n - 1], (n - 1) & 255)
  }
})

test('msgpack: decoder reads float32, int64 and map16 written by other encoders', () => {
  const f32 = new Uint8Array([0xca, 0x3f, 0x80, 0x00, 0x00])
  assert.equal(msgpackCoz(f32), 1)
  const i64 = new Uint8Array([0xd3, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe])
  assert.equal(msgpackCoz(i64), -2)
  const harita: Record<string, number> = {}
  for (let i = 0; i < 20; i++) harita[`k${i}`] = i
  const b = msgpackKodla(harita)
  assert.equal(b[0], 0xde)
  assert.deepEqual(msgpackCoz(b), harita)
  assert.throws(() => msgpackCoz(new Uint8Array([0xc1])))
})
