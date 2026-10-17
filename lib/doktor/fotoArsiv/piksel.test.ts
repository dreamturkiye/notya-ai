/**
 * FOTO-ARSIV-01 — client tone pipeline (exposure, white balance, brightness, contrast, saturation) on plain RGBA arrays.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calismaBoyutu, CALISMA_AZAMI_KENAR, kanalTablolari, tonuUygula } from './piksel'

const sifir = { parlaklik: 0, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: 0 }
const kare = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a])

describe('ton hattı', () => {
  it('varsayılan ayarlar pikselleri değiştirmez', () => {
    const v = kare(120, 80, 200); tonuUygula(v, sifir)
    assert.deepEqual([...v], [120, 80, 200, 255])
    const t = kanalTablolari(sifir)
    for (let i = 0; i < 256; i++) assert.equal(t.r[i], i)
  })
  it('pozlama + açar, - karartır; alfa korunur', () => {
    const a = kare(100, 100, 100, 77); tonuUygula(a, { ...sifir, pozlama: 50 })
    assert.ok(a[0] > 100 && a[3] === 77)
    const b = kare(100, 100, 100); tonuUygula(b, { ...sifir, pozlama: -50 })
    assert.ok(b[0] < 100)
  })
  it('sıcaklık: + kırmızıyı artırıp maviyi azaltır, - tersini yapar', () => {
    const s = kare(128, 128, 128); tonuUygula(s, { ...sifir, sicaklik: 60 })
    assert.ok(s[0] > 128 && s[2] < 128)
    const c = kare(128, 128, 128); tonuUygula(c, { ...sifir, sicaklik: -60 })
    assert.ok(c[0] < 128 && c[2] > 128)
  })
  it('doygunluk -100 gri yapar, + renk farkını büyütür', () => {
    const g = kare(200, 100, 50); tonuUygula(g, { ...sifir, doygunluk: -100 })
    assert.ok(Math.abs(g[0] - g[1]) <= 1 && Math.abs(g[1] - g[2]) <= 1)
    const k = kare(200, 100, 50); tonuUygula(k, { ...sifir, doygunluk: 60 })
    assert.ok(k[0] - k[2] > 150)
  })
  it('kontrast orta tonu sabit tutar, uçları iter; değerler 0..255 içinde kalır', () => {
    const o = kare(128, 128, 128); tonuUygula(o, { ...sifir, kontrast: 80 })
    assert.ok(Math.abs(o[0] - 128) <= 2)
    const u = new Uint8ClampedArray([30, 30, 30, 255, 230, 230, 230, 255]); tonuUygula(u, { ...sifir, kontrast: 80, pozlama: 100, parlaklik: 100 })
    assert.ok([...u].every((n) => n >= 0 && n <= 255))
    const d = new Uint8ClampedArray([60, 60, 60, 255, 200, 200, 200, 255]); tonuUygula(d, { ...sifir, kontrast: 70 })
    assert.ok(d[0] < 60 && d[4] > 200)
  })
  it('çalışma boyutu sınırlıdır ve en-boy oranını korur', () => {
    assert.deepEqual(calismaBoyutu(100, 50), { w: 100, h: 50 })
    const b = calismaBoyutu(6000, 3000)
    assert.equal(b.w, CALISMA_AZAMI_KENAR)
    assert.equal(b.h, CALISMA_AZAMI_KENAR / 2)
    assert.deepEqual(calismaBoyutu(8000, 4000, 1000), { w: 1000, h: 500 })
  })
})
