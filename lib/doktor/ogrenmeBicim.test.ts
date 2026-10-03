import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ogrenmeyeDeger } from './hafiza'

// NOTYA-OGRENME-GATE-01: style and format requests are learnable, small talk and patient questions are not.
const EVET = [
  'Ay\u015fe, cevaplar\u0131n\u0131 madde madde ver.',
  'Notlar\u0131m\u0131 daha k\u0131sa yaz l\u00fctfen.',
  'Bana \u00f6zetleri tablo halinde g\u00f6ster.',
  'Ben ate\u015fli \u00e7ocuklarda \u00f6nce parasetamol tercih ederim.',
  'Bundan sonra re\u00e7ete notlar\u0131n\u0131 k\u0131sa yaz.',
  'Her zaman \u00f6nce alerjiyi kontrol et.',
  'Kahveyi \u00e7ok s\u00fctl\u00fc ve \u00e7ok \u015fekerli severim.',
  'Bana Hocam diye hitap et l\u00fctfen.',
]
const HAYIR = [
  'Tamam te\u015fekk\u00fcrler.',
  'Bu hastan\u0131n kilosu ka\u00e7?',
  'Umutcan son randevusu ne zaman?',
]
describe('NOTYA-OGRENME-GATE-01 learning gate', () => {
  for (const s of EVET) it('learnable: ' + s, () => assert.equal(ogrenmeyeDeger(s), true))
  for (const s of HAYIR) it('not learnable: ' + s, () => assert.equal(ogrenmeyeDeger(s), false))
})
