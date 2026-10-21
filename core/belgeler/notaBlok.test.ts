import test from 'node:test'
import assert from 'node:assert/strict'
import { afisTemizle, belgeAnahtari, blokSizMetin, bulguTemizle, celiskiler, icdKoru, notaBloklariUygula, temizBirlestir, type BlokGirdi } from './notaBlok'

const BANNER = 'Yapay zekâ taslak rapor üretir. Tanı ve tedavi kararı hekime aittir.'
const g = (id: string, o: Partial<BlokGirdi> = {}): BlokGirdi => ({ belgeId: id, etiket: 'Ultrason', tarih: '20.10.2026', yuklemeSirasi: 0, ozet: 'Tek canlı fetüs.', bulgular: ['Fetal kalp atımı izleniyor.', 'Yolk kesesi görüldü'], ...o })

test('banner sentence is never part of the note body', () => {
  const r = notaBloklariUygula('', [g('a', { ozet: `Özet. ${BANNER}`, bulgular: [`Bulgu bir. ${BANNER}`] })])
  assert.ok(!r.metin.includes('Yapay zekâ taslak'))
  assert.ok(!r.metin.includes('hekime aittir'))
  assert.equal(afisTemizle(`x ${BANNER}`), 'x')
})

test('findings join without double punctuation', () => {
  assert.equal(temizBirlestir(['Fetal kalp atımı izleniyor.', 'Yolk kesesi görüldü;', 'Plasenta fundal ,']), 'Fetal kalp atımı izleniyor; Yolk kesesi görüldü; Plasenta fundal.')
  const r = notaBloklariUygula('', [g('a')])
  assert.ok(!/\.;/.test(r.metin))
  assert.match(r.metin, /izleniyor; Yolk kesesi görüldü\./)
})

test('ICD code is kept on one line', () => {
  assert.equal(icdKoru('Gebelik (Z3A.\n08)'.replace('\n', ' ')), 'Gebelik (Z3A.08)')
  assert.equal(bulguTemizle('Gebelik haftası (Z3A.\n08) uyumlu'), 'Gebelik haftası (Z3A.08) uyumlu')
  const r = notaBloklariUygula('', [g('a', { hekimTanisi: ['Gebelik, 8. hafta (Z3A.\n08)'] })])
  assert.ok(r.metin.includes('(Z3A.08)'))
  assert.ok(!/Z3A\.\s*\n/.test(r.metin))
})

test('existing dictated value is kept; document value appended with a short discrepancy line', () => {
  const onceki = 'Fetal kalp atımı FHR 167/dk, ritmik.'
  const r = notaBloklariUygula(onceki, [g('a', { bulgular: ['FHR 164/dk izleniyor'] })])
  assert.ok(r.metin.startsWith(onceki))
  assert.ok(r.metin.includes('FHR 164/dk'))
  assert.match(r.metin, /Not: FHR için mevcut notta 167\/dk, belgede 164\/dk; ikisi de korundu\./)
  assert.equal(celiskiler(onceki, 'FHR 167/dk').length, 0)
})

test('heading uses the exam section label and date; target is objektif text only', () => {
  const r = notaBloklariUygula('Genel durum iyi.', [g('a')])
  assert.match(r.metin, /^Genel durum iyi\.\n\n— Belge değerlendirmesi \(Ultrason, 20\.10\.2026\) —/)
})

test('idempotent per document id: re-evaluation replaces its own block, never duplicates', () => {
  const ilk = notaBloklariUygula('Doktor yazısı.', [g('a')])
  const ayni = notaBloklariUygula(ilk.metin, [g('a')])
  assert.equal(ayni.metin, ilk.metin)
  assert.equal(ayni.degisti, false)
  const yeni = notaBloklariUygula(ilk.metin, [g('a', { bulgular: ['Yeni bulgu'] })])
  assert.equal((yeni.metin.match(/Belge değerlendirmesi/g) || []).length, 1)
  assert.ok(yeni.metin.includes('Yeni bulgu') && !yeni.metin.includes('Yolk kesesi'))
  assert.ok(yeni.metin.startsWith('Doktor yazısı.'))
  assert.equal(yeni.islemler[0].islem, 'degisti')
})

test('doctor text after a block survives replacement', () => {
  const ilk = notaBloklariUygula('', [g('a')]).metin + '\n\nHekim sonradan yazdı.'
  const yeni = notaBloklariUygula(ilk, [g('a', { bulgular: ['Değişti'] })])
  assert.ok(yeni.metin.endsWith('Hekim sonradan yazdı.'))
  assert.equal(blokSizMetin(yeni.metin).trim(), 'Hekim sonradan yazdı.')
})

test('N=4 batch: stable upload order, numbered labels, single pass, no duplicates', () => {
  const girdiler = [3, 1, 0, 2].map((i) => g(`d${i}`, { yuklemeSirasi: i, bulgular: [`Bulgu ${i}`] }))
  const r = notaBloklariUygula('Ön not.', girdiler)
  const basliklar = r.metin.match(/Ultrason \d\/4/g)
  assert.deepEqual(basliklar, ['Ultrason 1/4', 'Ultrason 2/4', 'Ultrason 3/4', 'Ultrason 4/4'])
  assert.ok(r.metin.indexOf('Bulgu 0') < r.metin.indexOf('Bulgu 1') && r.metin.indexOf('Bulgu 2') < r.metin.indexOf('Bulgu 3'))
  assert.equal(r.islemler.length, 4)
  const tekrar = notaBloklariUygula(r.metin, girdiler)
  assert.equal(tekrar.metin, r.metin)
})

test('N=4 batch ordered by exam time when every image has a readable time', () => {
  const t = ['2026-10-20T10:30:00', '2026-10-20T09:00:00', '2026-10-20T11:00:00', '2026-10-20T09:45:00']
  const r = notaBloklariUygula('', t.map((z, i) => g(`d${i}`, { yuklemeSirasi: i, sinavZamani: z, bulgular: [`Zaman ${z.slice(11, 16)}`] })))
  const sira = [...r.metin.matchAll(/Zaman (\d\d:\d\d)/g)].map((m) => m[1])
  assert.deepEqual(sira, ['09:00', '09:45', '10:30', '11:00'])
})

test('English and Russian headings for country builds', () => {
  assert.match(notaBloklariUygula('', [g('a')], 'en').metin, /— Document review \(Ultrason, 20\.10\.2026\) —/)
  assert.match(notaBloklariUygula('', [g('a')], 'ru').metin, /— Оценка документа/)
  assert.ok(belgeAnahtari('a') !== belgeAnahtari('b'))
})
