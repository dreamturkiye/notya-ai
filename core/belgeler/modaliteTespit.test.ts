/**
 * NOTYA-BELGE-TUR-01 (2026-11-20) — the note heading names what the document actually is (the evaluator's detected modality),
 * never a branch default. Live repro: pediatri, hip ultrasound report (Graf) headed "Röntgen (akciğer grafisi)".
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { belgeEtiketi, GENEL_BELGE_ETIKETI, modaliteMetindenKod, tespitMetni } from './modaliteTespit'
import { notaBloklariUygula } from './notaBlok'

test('ultrasound report: label = detected type, code = us (even when the stored code was the old chest X-ray default)', () => {
  assert.equal(belgeEtiketi('Kalça ultrasonu (Graf yöntemi)', 'cxr'), 'Kalça ultrasonu (Graf yöntemi)')
  assert.equal(belgeEtiketi('kalça USG raporu', 'serbest'), 'Kalça USG raporu')
  assert.equal(modaliteMetindenKod('Kalça ultrasonu (Graf yöntemi)'), 'us')
  assert.equal(modaliteMetindenKod('Hip ultrasound report'), 'us')
  assert.equal(modaliteMetindenKod('УЗИ тазобедренных суставов'), 'us')
  const { metin } = notaBloklariUygula('', [{ belgeId: 'b1', etiket: belgeEtiketi('Kalça ultrasonu (Graf yöntemi)', 'cxr'), tarih: '20.11.2026', yuklemeSirasi: 0, ozet: 'Graf tip Ia.' }], 'tr')
  assert.match(metin, /Belge değerlendirmesi \(Kalça ultrasonu \(Graf yöntemi\), 20\.11\.2026\)/)
  assert.doesNotMatch(metin, /akciğer grafisi/i)
})

test('chest X-ray: detected text kept; a bare code from the writer is shown by its name', () => {
  assert.equal(belgeEtiketi('Akciğer grafisi (PA)', 'cxr'), 'Akciğer grafisi (PA)')
  assert.equal(belgeEtiketi('cxr', 'serbest'), 'Röntgen (akciğer grafisi)')
  assert.equal(modaliteMetindenKod('Akciğer grafisi (PA)'), 'cxr')
  assert.equal(modaliteMetindenKod('Chest X-ray PA'), 'cxr')
  assert.equal(modaliteMetindenKod('Рентген органов грудной клетки'), 'cxr')
  assert.equal(modaliteMetindenKod('Kalça grafisi'), 'xr_kemik')
})

test('lab report: labelled as what it is, not as imaging; no modality code is invented', () => {
  assert.equal(belgeEtiketi('Laboratuvar raporu (hemogram)', 'serbest'), 'Laboratuvar raporu (hemogram)')
  assert.equal(modaliteMetindenKod('Laboratuvar raporu (hemogram)'), null)
  assert.equal(modaliteMetindenKod('Tam kan sayımı'), null)
})

test('unknown type: safe generic label per language, never a wrong specific default', () => {
  for (const bos of ['', null, undefined, 'serbest', 'Serbest görüntü', 'bilinmiyor', 'unknown', 'other', '—']) {
    assert.equal(belgeEtiketi(bos as string, 'serbest'), 'Görüntüleme raporu', String(bos))
    assert.equal(belgeEtiketi(bos as string, 'auto'), 'Görüntüleme raporu', String(bos))
  }
  assert.equal(belgeEtiketi('', 'serbest', 'en'), GENEL_BELGE_ETIKETI.en)
  assert.equal(belgeEtiketi('', 'cxr', 'en'), 'Imaging report') // Turkish modality names never reach a country note
  assert.equal(belgeEtiketi('', 'us', 'ru'), GENEL_BELGE_ETIKETI.ru)
  // manual path with a doctor-chosen code and no writer text: the doctor's choice is named (Türkiye)
  assert.equal(belgeEtiketi('', 'us'), 'Ultrason')
})

test('display text is one clean line', () => {
  assert.equal(tespitMetni('  "kalça\nultrasonu."  '), 'Kalça ultrasonu')
  assert.ok(tespitMetni('x'.repeat(200)).length <= 60)
})

test('static: no note writer labels a document from the stored code alone, and auto uploads get no branch default', () => {
  const oku = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')
  for (const f of ['lib/doktor/belgeNotaYaz.ts', 'app/api/doktor/belgeler/analiz/onayla/route.ts']) {
    assert.match(oku(f), /belgeEtiketi\(/, f)
    assert.doesNotMatch(oku(f), /etiket:\s*MODALITE_TR\[/, `${f} labels from the stored code (wrong for unclassified uploads)`)
  }
  const rota = oku('app/api/doktor/belgeler/analiz/route.ts')
  assert.doesNotMatch(rota, /varsayilanGoruntuModalitesi\(/, 'auto uploads must not be forced to the branch default modality')
  assert.match(rota, /modaliteOtomatik/)
  assert.match(rota, /modaliteMetindenKod/)
})
