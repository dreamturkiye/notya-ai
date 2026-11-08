/**
 * ULKE-BRANS-DERINLIK-10 (2026-11-08) — specialty documents Türkiye did not have yet: odyogram, timpanogram, spirometri,
 * Holter, uyku testi (PSG), semen analizi, görme alanı, EMG / sinir iletim, psikometrik ölçek. Offered only to the branches
 * that assess them (brans-alan-sizmasi, both ways), each with a copy-what-is-printed reading line, and the four Özel
 * Branşlar that assess their own documents get their own rule instead of the PDF-only default.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { MODALITE_TR, type Modalite } from './ontoloji'
import { bransAnahtari, bransKurali, etkinModalite } from './router'
import { kullaniciPromptu } from './yazar'

const YENI: Modalite[] = ['odyogram', 'timpanogram', 'spirometri', 'holter', 'psg', 'semen', 'perimetri', 'emg', 'psikometri']

test('each new document has a Turkish label and goes to the branches that assess it', () => {
  for (const m of YENI) assert.ok(MODALITE_TR[m].length > 2, m)
  const sahip: Record<string, Modalite[]> = {
    kbb: ['odyogram', 'timpanogram', 'psg'], kardiyoloji: ['holter'], gogus: ['spirometri', 'psg'], noroloji: ['emg', 'psg'],
    kadin_dogum: ['semen'], uroloji: ['semen'], goz: ['perimetri'], psikiyatri: ['psikometri'], ftr: ['emg'],
    odyoloji: ['odyogram', 'timpanogram'], klinik_psikoloji: ['psikometri'],
  }
  for (const [b, ms] of Object.entries(sahip)) for (const m of ms) assert.equal(etkinModalite(b, m).serbest, false, `${b}/${m}`)
})

test('leak both ways: a branch that does not assess a document gets the free description, never the specialty reading', () => {
  for (const [b, m] of [['dermatoloji', 'odyogram'], ['kardiyoloji', 'semen'], ['ortopedi', 'psikometri'], ['goz', 'spirometri'], ['kbb', 'holter'], ['psikiyatri', 'emg']] as const) {
    assert.deepEqual(etkinModalite(b, m), { modalite: 'serbest', serbest: true }, `${b}/${m}`)
  }
})

test('Özel Branşlar: odyoloji, klinik psikoloji, fizyoterapi, ergoterapi have their own rule; medical branches keep theirs', () => {
  assert.equal(bransAnahtari('Odyoloji'), 'odyoloji')
  assert.equal(bransAnahtari('Klinik Psikoloji'), 'klinik_psikoloji')
  assert.equal(bransAnahtari('klinik-psikolog'), 'klinik_psikoloji')
  assert.equal(bransAnahtari('Fizyoterapi'), 'fizyoterapi')
  assert.equal(bransAnahtari('Ergoterapi'), 'ergoterapi')
  assert.equal(bransAnahtari('Psikiyatri'), 'psikiyatri')
  assert.equal(bransAnahtari('Fiziksel Tıp ve Rehabilitasyon'), 'ftr')
  assert.equal(bransAnahtari('Kulak Burun Boğaz'), 'kbb')
  assert.ok(bransKurali('odyoloji').modaliteler.includes('odyogram'))
  assert.ok(!bransKurali('fizyoterapi').modaliteler.includes('odyogram'))
  assert.equal(bransKurali('psikiyatri').engelli, true, 'psikiyatri stays without engines')
})

test('the reading line copies printed values and computes no grade, score or diagnosis', () => {
  const odyo = kullaniciPromptu({ brans: 'kbb', modality_final: 'odyogram' }, null, [])
  assert.match(odyo, /dB HL/); assert.match(odyo, /derecesi basılı değilse hesaplama/)
  const psk = kullaniciPromptu({ brans: 'psikiyatri', modality_final: 'psikometri' }, null, [])
  assert.match(psk, /puan hesaplama, tanı koyma/)
  assert.doesNotMatch(kullaniciPromptu({ brans: 'kbb', modality_final: 'otoskopi' }, null, []), /ODYOGRAM/)
})
