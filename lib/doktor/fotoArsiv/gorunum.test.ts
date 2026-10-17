/**
 * FOTO-ARSIV-01 — zoom / pan / pinch arithmetic of the viewer and compare mode (pure; the browser only forwards pointer events).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { BASLANGIC_GORUNUMU, ciftDokunus, imlecteYakinlastir, kapsayicidanIceriye, kaydir, OLCEK_MAX, OLCEK_MIN, olcekSinirla, pinchUygula, sigdir, sinirla } from './gorunum'

const kap = { w: 400, h: 600 }
const icerik = sigdir(1200, 900, kap) // 400 x 300, letterboxed vertically
const yakin = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`)

describe('görünüm matematiği', () => {
  it('sığdırma: en-boy oranı korunur, kapsayıcıdan taşmaz', () => {
    assert.deepEqual(icerik, { w: 400, h: 300 })
    assert.deepEqual(sigdir(0, 10, kap), { w: 0, h: 0 })
  })
  it('ölçek sınırları 1..12', () => {
    assert.equal(olcekSinirla(0.2), OLCEK_MIN)
    assert.equal(olcekSinirla(99), OLCEK_MAX)
    assert.equal(olcekSinirla(NaN), 1)
  })
  it('1x: içerik ortalanır, kaydırma geri alınır', () => {
    const g = sinirla({ olcek: 1, x: 80, y: -50 }, kap, icerik)
    assert.equal(g.x, 0)
    assert.equal(g.y, 0)
  })
  it('yakınlaştırınca kaydırma içeriğin kenarında durur (boşluk açılmaz)', () => {
    const g = sinirla({ olcek: 3, x: 9999, y: 9999 }, kap, icerik)
    const sol = (kap.w - icerik.w) / 2 + g.x
    const ust = (kap.h - icerik.h) / 2 + g.y
    assert.ok(sol <= 1e-9 && ust <= 1e-9, 'sol/üst kenar kapsayıcıyı aşmamalı')
    const alt = sinirla({ olcek: 3, x: -9999, y: -9999 }, kap, icerik)
    assert.ok((kap.w - icerik.w) / 2 + alt.x + icerik.w * 3 >= kap.w - 1e-9)
    assert.ok((kap.h - icerik.h) / 2 + alt.y + icerik.h * 3 >= kap.h - 1e-9)
  })
  it('imleç noktası yakınlaştırmada yerinde kalır', () => {
    const imlec = { x: 250, y: 280 }
    const once = kapsayicidanIceriye(BASLANGIC_GORUNUMU, imlec, kap, icerik)!
    const g = imlecteYakinlastir({ ...BASLANGIC_GORUNUM() }, imlec, 3, kap, icerik)
    const sonra = kapsayicidanIceriye(g, imlec, kap, icerik)!
    yakin(once.x, sonra.x); yakin(once.y, sonra.y)
    assert.equal(g.olcek, 3)
  })
  it('sınırda yakınlaştırma 12x üstüne çıkmaz', () => {
    let g = { ...BASLANGIC_GORUNUMU }
    for (let i = 0; i < 30; i++) g = imlecteYakinlastir(g, { x: 200, y: 300 }, 1.5, kap, icerik)
    assert.equal(g.olcek, OLCEK_MAX)
  })
  it('pinch: parmak mesafesi oranında ölçeklenir ve orta noktayı izler', () => {
    const g = pinchUygula({ ...BASLANGIC_GORUNUMU }, [{ x: 150, y: 250 }, { x: 250, y: 250 }], [{ x: 100, y: 250 }, { x: 300, y: 250 }], kap, icerik)
    yakin(g.olcek, 2)
    const nokta = kapsayicidanIceriye(g, { x: 200, y: 250 }, kap, icerik)!
    yakin(nokta.x, 0.5, 1e-6)
    assert.deepEqual(pinchUygula(BASLANGIC_GORUNUMU, [{ x: 1, y: 1 }, { x: 1, y: 1 }], [{ x: 5, y: 5 }, { x: 9, y: 9 }], kap, icerik), BASLANGIC_GORUNUMU)
  })
  it('çift dokunuş: 2,5x yakınlaştırır, yakınken sığdırmaya döner', () => {
    const z = ciftDokunus({ ...BASLANGIC_GORUNUMU }, { x: 200, y: 300 }, kap, icerik)
    assert.equal(z.olcek, 2.5)
    assert.deepEqual(ciftDokunus(z, { x: 200, y: 300 }, kap, icerik), BASLANGIC_GORUNUMU)
  })
  it('kaydırma sınırlıdır; içerik dışı dokunuş null döner', () => {
    const g = kaydir({ olcek: 2, x: 0, y: 0 }, 5000, 5000, kap, icerik)
    assert.ok(g.x <= 0 || g.x === sinirla(g, kap, icerik).x)
    assert.equal(kapsayicidanIceriye(BASLANGIC_GORUNUMU, { x: 200, y: 10 }, kap, icerik), null)
    const orta = kapsayicidanIceriye(BASLANGIC_GORUNUMU, { x: 200, y: 300 }, kap, icerik)!
    yakin(orta.x, 0.5); yakin(orta.y, 0.5)
  })
})

function BASLANGIC_GORUNUM() { return { ...BASLANGIC_GORUNUMU } }
