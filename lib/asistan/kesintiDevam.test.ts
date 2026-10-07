import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  KESINTI_BEKLE_MS, KESINTI_SES_KANIT_MS, cumleBasi, devamMetni, doktorKonustu, elevenKalan, fishKalan, kalanGeldi, kesildi,
  kesintiBaslat, kesintiDevamMesaji, kesintiKalani, kesintiMesajiMi, kesintiTik, sesKaresi,
} from './kesintiDevam'

const CEVAP = 'Ateşi üç gündür sürüyor. Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.'

test('resume: no doctor words in 1.5 s → continues once from the cut sentence', () => {
  let d = kesildi(kesintiBaslat(), { cevap: '41', t: 1000, kalan: 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.' })
  let r = kesintiTik(d, 1000 + KESINTI_BEKLE_MS - 1)
  assert.equal(r.devam, null)
  r = kesintiTik(r.durum, 1000 + KESINTI_BEKLE_MS)
  assert.equal(r.devam, 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  d = r.durum
  assert.equal(kesintiTik(d, 9000).devam, null, 'exactly once')
  // The same answer is never resumed twice.
  d = kesildi(doktorKonustu(d), { cevap: '41', t: 9000, kalan: 'x y' })
  assert.equal(kesintiTik(d, 20_000).devam, null)
})

test('resume: doctor transcript inside the window cancels it', () => {
  let d = kesildi(kesintiBaslat(), { cevap: '7', t: 0, kalan: 'Kontrolü cuma yapalım.' })
  d = doktorKonustu(d)
  assert.equal(kesintiTik(d, 5000).devam, null)
})

test('resume: sustained local speech after the cut cancels it; a blip does not', () => {
  let d = kesildi(kesintiBaslat(), { cevap: '8', t: 0, kalan: 'Kontrolü cuma yapalım.' })
  d = sesKaresi(d, { t: 100, sesli: true })
  d = sesKaresi(d, { t: 132, sesli: true })
  assert.ok(d.bekleyen, 'a 32 ms blip keeps the resume')
  for (let t = 164; t <= 164 + KESINTI_SES_KANIT_MS; t += 32) d = sesKaresi(d, { t, sesli: true })
  assert.equal(d.bekleyen, null)
  assert.equal(kesintiTik(d, 5000).devam, null)
})

test('resume: speech evidence from before the cut does not count', () => {
  let d = kesildi(kesintiBaslat(), { cevap: '9', t: 1000, kalan: 'Kontrolü cuma yapalım.' })
  for (let t = 0; t < 1000; t += 32) d = sesKaresi(d, { t, sesli: true })
  assert.ok(d.bekleyen)
})

test('resume: a resumed answer cut again is not resumed (no loop) until the doctor speaks', () => {
  let d = kesildi(kesintiBaslat(), { cevap: 'a', t: 0, kalan: 'Bir. İki.' })
  d = kesintiTik(d, KESINTI_BEKLE_MS).durum
  assert.equal(d.zincir, true)
  d = kesildi(d, { cevap: 'b', t: 5000, kalan: 'İki.' })
  assert.equal(d.bekleyen, null)
  d = doktorKonustu(d)
  d = kesildi(d, { cevap: 'c', t: 9000, kalan: 'Üç.' })
  assert.equal(kesintiTik(d, 9000 + KESINTI_BEKLE_MS).devam, 'Üç.')
})

test('resume: remainder arriving after the cut (ElevenLabs correction) is used; none known → nothing said', () => {
  let d = kesildi(kesintiBaslat(), { cevap: '12', t: 0, kalan: null })
  d = kalanGeldi(d, { cevap: '13', kalan: 'Kontrolü cuma yapalım.' })
  assert.equal(kesintiTik(d, KESINTI_BEKLE_MS).devam, 'Kontrolü cuma yapalım.')
  const bos = kesildi(kesintiBaslat(), { cevap: '14', t: 0, kalan: null })
  assert.equal(kesintiTik(bos, KESINTI_BEKLE_MS).devam, null)
  assert.equal(kesildi(kesintiBaslat(), { cevap: '15', t: 0, kalan: ' . ' }).bekleyen?.kalan, null)
})

test('cut point: the cut sentence is said again from its start', () => {
  const i = CEVAP.indexOf('dozunu')
  assert.equal(cumleBasi(CEVAP, i), CEVAP.indexOf('Parasetamol'))
  assert.equal(devamMetni(CEVAP, i), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(devamMetni(CEVAP, 3), CEVAP)
  assert.equal(devamMetni(CEVAP, CEVAP.length), null)
})

test('ElevenLabs correction: original vs played prefix → remainder from the cut sentence', () => {
  assert.equal(elevenKalan(CEVAP, 'Ateşi üç gündür sürüyor. Parasetamol dozunu'), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(elevenKalan(CEVAP, 'Ateşi üç gündür sürüyor.'), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(elevenKalan(CEVAP.replace('sürüyor. ', 'sürüyor.  '), 'Ateşi üç gündür sürüyor. Parasetamol'), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(elevenKalan(CEVAP, CEVAP), null)
  assert.equal(elevenKalan(CEVAP, 'tamamen başka bir metin'), null)
  assert.equal(elevenKalan('', 'x'), null)
})

test('Fish: remainder from the sentence that was playing, or estimated from seconds of a stream', () => {
  assert.equal(fishKalan(CEVAP, { metin: 'Parasetamol dozunu kiloya göre ayarladım.', sn: 1.2 }), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(fishKalan(CEVAP, { metin: 'yok böyle bir cümle', sn: 1 }), null)
  assert.equal(fishKalan(CEVAP, { metin: null, sn: 2.5 }), 'Parasetamol dozunu kiloya göre ayarladım. Kontrolü cuma yapalım.')
  assert.equal(fishKalan(CEVAP, null), null)
})

test('hidden nudge: Turkish instruction carries the remainder; recognised and parsed back', () => {
  const m = kesintiDevamMesaji('Kontrolü cuma yapalım.')
  assert.ok(kesintiMesajiMi(m))
  assert.match(m, /Sözün yanlışlıkla kesildi/)
  assert.equal(kesintiKalani(m), 'Kontrolü cuma yapalım.')
  assert.equal(kesintiMesajiMi('Kontrolü cuma yapalım.'), false)
  assert.equal(kesintiKalani('[kesinti-devam] tırnak yok'), null)
  assert.equal(kesintiKalani('devam et'), null)
})
