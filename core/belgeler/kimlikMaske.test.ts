// Synthetic OCR fixture only — no real patient data.
import test from 'node:test'
import assert from 'node:assert/strict'
import { kimlikKutulari, type OcrSatir, type OcrKelime } from './kimlikMaske'

const W = 1000, H = 800
function satir(y: number, ...parcalar: string[]): OcrSatir {
  let x = 20
  const kelimeler: OcrKelime[] = parcalar.map((t) => { const w = { text: t, x0: x, y0: y, x1: x + t.length * 12, y1: y + 18, conf: 90 }; x += t.length * 12 + 14; return w })
  return { kelimeler }
}
const kapsar = (kutular: { x0: number; y0: number; x1: number; y1: number }[], s: OcrSatir, i: number) =>
  kutular.some((k) => k.x0 <= s.kelimeler[i].x0 && k.x1 >= s.kelimeler[i].x1 && k.y0 <= s.kelimeler[i].y0 && k.y1 >= s.kelimeler[i].y1)

test('ultrasound header: name, DOB, protocol, doctor masked; measurements and exam date kept', () => {
  const s1 = satir(10, 'Hasta:', 'AYSE', 'DEMIR', 'Doğum', 'Tarihi:', '01.02.1990')
  const s2 = satir(40, 'Protokol', 'No:', 'A-12345', 'Tarih:', '20.10.2026')
  const s3 = satir(70, 'Doktor:', 'Dr.', 'TEST', 'KISI')
  const s4 = satir(400, 'GA', '20w3d', 'LMP', '05.06.2026', 'EDD', '12.03.2027', 'FHR', '150', 'bpm', 'CRL', '5.1cm')
  const r = kimlikKutulari([s1, s2, s3, s4], { genislik: W, yukseklik: H, modalite: 'us' })
  assert.equal(r.durum, 'ok')
  assert.equal(r.ustBantUygulandi, true)
  assert.ok(kapsar(r.kutular, s1, 1) && kapsar(r.kutular, s1, 5) && kapsar(r.kutular, s2, 2) && kapsar(r.kutular, s3, 3))
  // clinical measurement row is below the band: nothing covers it
  for (let i = 0; i < s4.kelimeler.length; i++) assert.equal(kapsar(r.kutular, s4, i), false, s4.kelimeler[i].text)
  const band = r.kutular.find((k) => k.x0 === 0 && k.x1 === W)!
  assert.ok(band.y1 >= H * 0.2 && band.y1 <= H * 0.3)
})

test('non-header modality: exam date after "Tarih:" is not masked, value after DOB label is', () => {
  const s1 = satir(300, 'Tarih:', '20.10.2026', 'DOB:', '03/04/2015')
  const r = kimlikKutulari([s1], { genislik: W, yukseklik: H, modalite: 'derm' })
  assert.equal(kapsar(r.kutular, s1, 1), false)
  assert.equal(kapsar(r.kutular, s1, 3), true)
  assert.equal(r.ustBantUygulandi, false)
})

test('11-digit TC, 10-digit NHS, SSN and digit runs split across words are masked without a label', () => {
  const a = satir(300, '12345678901'); const b = satir(330, '943', '476', '5919'); const c = satir(360, '123-45-6789'); const d = satir(390, 'ABC1234')
  const r = kimlikKutulari([a, b, c, d], { genislik: W, yukseklik: H, modalite: 'derm' })
  assert.ok(kapsar(r.kutular, a, 0) && kapsar(r.kutular, c, 0) && kapsar(r.kutular, d, 0))
  assert.ok(b.kelimeler.every((_, i) => kapsar(r.kutular, b, i)))
})

test('English labels (Name/MRN/Referring) and label alone on a line mask the next line', () => {
  const s1 = satir(20, 'Patient', 'Name:', 'JOHN', 'DOE', 'MRN:', '00123')
  const s2 = satir(60, 'Referring', 'Physician:')
  const s3 = satir(90, 'Dr', 'Example', 'Person')
  const r = kimlikKutulari([s1, s2, s3], { genislik: W, yukseklik: H, modalite: 'us' })
  assert.ok(kapsar(r.kutular, s1, 2) && kapsar(r.kutular, s1, 3) && kapsar(r.kutular, s1, 5) && kapsar(r.kutular, s3, 1))
})

test('Uzbek / Russian labels are recognised', () => {
  const s1 = satir(20, 'Bemor:', 'TEST', 'ISM', 'ПИНФЛ:', '12345678901234')
  const r = kimlikKutulari([s1], { genislik: W, yukseklik: H, modalite: 'us' })
  assert.ok(kapsar(r.kutular, s1, 1) && kapsar(r.kutular, s1, 4))
})

test('confidence policy: no text on ultrasound or low confidence -> fallback; no text on a photo -> ok', () => {
  assert.equal(kimlikKutulari([], { genislik: W, yukseklik: H, modalite: 'us' }).durum, 'ocr_yok')
  assert.equal(kimlikKutulari([], { genislik: W, yukseklik: H, modalite: 'derm' }).durum, 'ok')
  const dusuk = satir(20, 'Hasta:', 'XXXX'); dusuk.kelimeler.forEach((w) => (w.conf = 20))
  assert.equal(kimlikKutulari([dusuk], { genislik: W, yukseklik: H, modalite: 'us' }).durum, 'dusuk_guven')
  // header text present but no identity label recognised on an ultrasound -> cannot be sure
  assert.equal(kimlikKutulari([satir(10, 'Siemens', 'ACUSON')], { genislik: W, yukseklik: H, modalite: 'us' }).durum, 'dusuk_guven')
})
