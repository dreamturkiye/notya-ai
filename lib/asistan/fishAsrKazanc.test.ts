import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asrKlipNormallestir, asrKlipDenetle } from './fishSes'

// NOTYA-SES-ASR-KAZANC-01
function wav(genlik: number, ms = 1500, hz = 16000): Uint8Array {
  const n = Math.floor((hz * ms) / 1000)
  const b = new Uint8Array(44 + n * 2)
  const v = new DataView(b.buffer)
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i) }
  yaz(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVE'); yaz(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, hz, true)
  v.setUint32(28, hz * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); yaz(36, 'data'); v.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin((i / hz) * 2 * Math.PI * 220) * genlik * 0x7fff), true)
  return b
}
const tepe = (b: Uint8Array) => { const v = new DataView(b.buffer, b.byteOffset); let m = 0; for (let o = 44; o + 1 < b.byteLength; o += 2) m = Math.max(m, Math.abs(v.getInt16(o, true))); return m / 0x8000 }

describe('asrKlipNormallestir', () => {
  it('lifts a quiet clip to a normal level', () => {
    const r = asrKlipNormallestir(wav(0.1))
    assert.ok(r.kazanc > 5 && r.kazanc <= 12)
    assert.ok(tepe(r.bayt) > 0.8 && tepe(r.bayt) <= 1)
  })
  it('caps the gain at 12x', () => {
    const r = asrKlipNormallestir(wav(0.01))
    assert.equal(r.kazanc, 12)
  })
  it('returns a loud clip untouched', () => {
    const b = wav(0.7)
    const r = asrKlipNormallestir(b)
    assert.equal(r.kazanc, 1)
    assert.equal(r.bayt, b)
  })
  it('returns near-silence untouched', () => {
    const b = wav(0.001)
    const r = asrKlipNormallestir(b)
    assert.equal(r.kazanc, 1)
    assert.equal(r.bayt, b)
  })
  it('returns a non-WAV untouched', () => {
    const b = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48])
    assert.equal(asrKlipNormallestir(b).bayt, b)
  })
  it('keeps the clip length and still passes the clip check', () => {
    const r = asrKlipNormallestir(wav(0.08))
    assert.equal(r.bayt.byteLength, wav(0.08).byteLength)
    assert.equal(asrKlipDenetle(r.bayt, 'audio/wav').uygun, true)
  })
})
