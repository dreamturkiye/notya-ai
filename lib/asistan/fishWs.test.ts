import { test } from 'node:test'
import assert from 'node:assert/strict'
import { msgpackKodla } from './fishMsgpack'
import { CumleKesici, KelimeKesici, FISH_WS_DUR, FISH_WS_URL, base64Pcm, fishWsAcikMi, fishWsBaslangic, fishWsMetinOlayi, fishWsOlayCoz, pcmBase64, sesDusKesimi, sesDusOfseti, wsSessizBittiMi } from './fishWs'
import { FISH_HABER_SES_ID, FISH_ORNEK_HZ } from './fishSes'

test('ws: start event carries the documented TTSRequest fields, pinned to our PCM/24k/low profile', () => {
  const s = fishWsBaslangic()
  assert.equal(FISH_WS_URL, 'wss://api.fish.audio/v1/tts/live')
  assert.equal(s.event, 'start')
  assert.equal(s.request.text, '')
  assert.equal(s.request.format, 'pcm')
  assert.equal(s.request.sample_rate, FISH_ORNEK_HZ)
  assert.equal(s.request.latency, 'low')
  assert.equal(s.request.chunk_length, 100)
  assert.equal(s.request.reference_id, FISH_HABER_SES_ID)
  assert.deepEqual(s.request.prosody, { speed: 1, volume: 0, normalize_loudness: true })
  assert.deepEqual(FISH_WS_DUR, { event: 'stop' })
})

test('ws: text events are one sentence with a trailing space; [break] and punctuation-only are dropped', () => {
  assert.deepEqual(fishWsMetinOlayi('Merhaba Hocam.'), { event: 'text', text: 'Merhaba Hocam. ' })
  assert.equal(fishWsMetinOlayi('...'), null)
  assert.equal(fishWsMetinOlayi(''), null)
  const t = fishWsMetinOlayi('Bir. İki.')?.text || ''
  assert.doesNotMatch(t, /\[break\]/)
})

test('ws: server events decode — audio bytes, finish reason, log, unknown', () => {
  const ses = new Uint8Array([1, 2, 3, 4])
  const a = fishWsOlayCoz(msgpackKodla({ event: 'audio', audio: ses }))
  assert.equal(a.tur, 'audio')
  if (a.tur === 'audio') assert.deepEqual([...a.ses], [1, 2, 3, 4])
  assert.deepEqual(fishWsOlayCoz(msgpackKodla({ event: 'finish', reason: 'stop' })), { tur: 'finish', neden: 'stop' })
  assert.deepEqual(fishWsOlayCoz(msgpackKodla({ event: 'finish', reason: 'error' })), { tur: 'finish', neden: 'error' })
  assert.deepEqual(fishWsOlayCoz(msgpackKodla({ event: 'log', message: 'x' })), { tur: 'log', mesaj: 'x' })
  assert.equal(fishWsOlayCoz(msgpackKodla({ event: 'other' })).tur, 'bilinmeyen')
  assert.equal(fishWsOlayCoz(new Uint8Array([0xc1])).tur, 'bilinmeyen')
})

test('ws: feature flag defaults ON and only 0/false/off revert to REST', () => {
  assert.equal(fishWsAcikMi(undefined), true)
  assert.equal(fishWsAcikMi('1'), true)
  assert.equal(fishWsAcikMi('0'), false)
  assert.equal(fishWsAcikMi('false'), false)
  assert.equal(fishWsAcikMi('off'), false)
})

test('ws: word cutter feeds Fish as tokens arrive, not after a period; flushes the tail at the end', () => {
  const k = new KelimeKesici()
  assert.deepEqual(k.ekle('Merhaba'), [])
  assert.deepEqual(k.ekle(' Hocam'), ['Merhaba'])
  assert.deepEqual(k.ekle(' bugün'), ['Hocam'])
  assert.deepEqual(k.bitir(), ['bugün'])
  assert.equal(k.islenen, k.birikim)
})

test('ws: server cutter emits finished sentences as deltas arrive, flushes the tail at the end', () => {
  const k = new CumleKesici()
  assert.deepEqual(k.ekle('Merhaba '), [])
  assert.deepEqual(k.ekle('Hocam. Bugün '), ['Merhaba Hocam.'])
  assert.deepEqual(k.ekle('üç hasta var'), [])
  assert.deepEqual(k.bitir(), ['Bugün üç hasta var'])
  assert.equal(k.islenen, k.birikim)
})

test('ws: ses_dus offset — text before it was handed to Fish, the rest is spoken via REST', () => {
  const k = new KelimeKesici()
  k.ekle('Merhaba Hocam Bugün üç hasta var ')
  assert.equal(k.islenen, 'Merhaba Hocam Bugün üç hasta var ')
  const birikim = 'Merhaba Hocam Bugün üç hasta var Sonra kontrol.'
  assert.equal(sesDusKesimi(birikim, k.islenen.length), 'Merhaba Hocam Bugün üç hasta var ')
  assert.equal(sesDusKesimi('kısa', 99), 'kısa')
  assert.equal(sesDusKesimi('kısa', -3), '')
})

test('ws: text handed to a socket that returned no audio was not spoken — the REST fallback starts at 0 (NOTYA-AYSE-OZET-01)', () => {
  const birikim = 'Emircan Karaoğlu, 30 Ağustos 2025 tarihli muayene. Aşı yapılmış.'
  // No chunk came back: nothing was heard, whatever was handed to the socket.
  assert.equal(sesDusOfseti(false, birikim.length), 0)
  assert.equal(sesDusKesimi(birikim, sesDusOfseti(false, birikim.length)), '')
  // Audio did come back: the text handed to the socket is not repeated.
  assert.equal(sesDusOfseti(true, 31), 31)
  assert.equal(sesDusOfseti(true, Number.NaN), 0)
  assert.equal(sesDusOfseti(true, -4), 0)
  // A socket that ended without an error and without one byte of audio for real text is a failed socket.
  assert.equal(wsSessizBittiMi(0, birikim), true)
  assert.equal(wsSessizBittiMi(48_000, birikim), false)
  assert.equal(wsSessizBittiMi(0, ''), false)
  assert.equal(wsSessizBittiMi(0, ' . '), false, 'punctuation is never sent to Fish — no audio is expected for it')
})

test('ws: PCM base64 relay round-trips odd-length chunks', () => {
  const pcm = new Uint8Array([0, 255, 128, 7, 9])
  const b64 = pcmBase64(pcm)
  assert.deepEqual([...base64Pcm(b64)], [...pcm])
})
