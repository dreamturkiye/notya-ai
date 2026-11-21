/**
 * NOTYA-BELGE-DEID-03-b — PDF identity removal: text layer -> masking boxes (pure part). Synthetic fixture only — no real patient data.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { metinKatmaniSatirlari, sayfaKodlama, PDF_AZAMI_SAYFA, PDF_GIDEN_AZAMI_KARAKTER, type MetinOgesi } from './pdfMaske'
import { kimlikKutulari, type Kutu } from './kimlikMaske'

const W = 1414, H = 2000
const run = (str: string, x0: number, y0: number, yatay = true): MetinOgesi => ({ str, x0, y0, x1: x0 + str.length * 14, y1: y0 + 22, yatay })
const ortu = (kutular: Kutu[], k: { x0: number; y0: number; x1: number; y1: number }) => kutular.some((b) => b.x0 <= k.x0 + 1 && b.x1 >= k.x1 - 1 && b.y0 <= k.y0 + 1 && b.y1 >= k.y1 - 1)

test('text layer of a lab report: runs become words on lines; patient block masked, results readable', () => {
  const ogeler = [
    run('ÖRNEK TIP LABORATUVARI', 400, 60),
    run('Hasta Adı Soyadı:', 80, 200), run('AYSE YILMAZ', 340, 201), run('Numune Tarihi: 12.11.2026', 800, 200),
    run('TC Kimlik No: 12345678901', 80, 240), run('Cinsiyet: K', 800, 240),
    run('Doğum Tarihi: 03.04.2015', 80, 280),
    run('Tetkik Adı   Sonuç   Birim   Referans', 80, 380),
    run('Hemoglobin   12.3   g/dL   11.5-15.5', 80, 420),
    run('Trombosit   250   10^3/uL   150-450', 80, 460),
  ]
  const satirlar = metinKatmaniSatirlari(ogeler)
  const ad = satirlar.find((s) => s.kelimeler.some((k) => k.text === 'AYSE'))!
  assert.ok(ad.kelimeler.some((k) => k.text === 'Numune'), 'runs on the same baseline are one line')
  assert.ok(satirlar.every((s) => s.kelimeler.every((k) => k.conf === 100)))
  const r = kimlikKutulari(satirlar, { genislik: W, yukseklik: H, modalite: 'belge' })
  assert.equal(r.durum, 'ok')
  assert.equal(r.ustBantUygulandi, false)
  const kelime = (t: string) => satirlar.flatMap((s) => s.kelimeler).find((k) => k.text === t)!
  for (const t of ['AYSE', 'YILMAZ', '12345678901', '03.04.2015']) assert.ok(ortu(r.kutular, kelime(t)), `${t} masked`)
  for (const t of ['12.11.2026', 'Hemoglobin', '12.3', '11.5-15.5', 'Trombosit', '250', '150-450', 'Sonuç', 'K']) assert.equal(ortu(r.kutular, kelime(t)), false, `${t} readable`)
})

test('a rotated run is one box; empty runs are ignored', () => {
  const s = metinKatmaniSatirlari([{ str: 'Hasta: X Y', x0: 10, y0: 100, x1: 32, y1: 400, yatay: false }, run('   ', 0, 0)])
  assert.equal(s.length, 1)
  assert.equal(s[0].kelimeler.length, 1)
})

test('send size: few pages full resolution, long reports smaller; limits stay under the request body cap', () => {
  assert.deepEqual(sayfaKodlama(1), { maxKenar: 1568, kalite: 0.85 })
  assert.ok(sayfaKodlama(8).maxKenar < 1568 && sayfaKodlama(20).maxKenar < sayfaKodlama(8).maxKenar)
  assert.equal(PDF_AZAMI_SAYFA, 20)
  assert.ok(PDF_GIDEN_AZAMI_KARAKTER < 4_000_000)
})
