import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kohortSorusuMu } from './aktifHasta'

// NOTYA-AYSE-KOHORT-01: the doctor's own question of 2026-09-20, fixed 09-21, must stay a practice question with a chart open.
const EVET = [
  'Son bir ay i\u00e7inde hangi antibiyoti\u011fi en fazla yazd\u0131m?',
  'Son bir ay i\u00e7inde en fazla hangi antibiyoti\u011fi re\u00e7ete ettim?',
  'Hangi antibiyoti\u011fi en fazla kulland\u0131m?',
  'Ge\u00e7en ay en \u00e7ok hangi antibiyoti\u011fi yazd\u0131m?',
  'Bu ay en s\u0131k hangi ilac\u0131 yazd\u0131m?',
  'Son bir ayda ka\u00e7 hastaya antibiyotik yazd\u0131m?',
  'Bu hafta en fazla hangi tan\u0131y\u0131 koydum?',
  // NOTYA-AYSE-ARAC-PARITE: a count of what the practice did inside a stated window (plural too).
  'Son bir ayda ka\u00e7 a\u015f\u0131 yapt\u0131k?',
  'Bu hafta ka\u00e7 a\u015f\u0131 yapt\u0131k?',
  'Ge\u00e7en ay ka\u00e7 a\u015f\u0131 uygulad\u0131k?',
  'Son 30 g\u00fcnde ka\u00e7 a\u015f\u0131 yapt\u0131m?',
  // 'son 30 gunde' is a window, not the dose word 'gunde'.
  'Son 30 g\u00fcnde hangi antibiyoti\u011fi en fazla yazd\u0131m?',
]
const HAYIR = [
  'Bu hastaya en fazla hangi antibiyoti\u011fi yazd\u0131m?',
  'Amoksisilin verdim, en fazla ka\u00e7 mg verilir?',
  'Umutcan son kilosu ka\u00e7?',
  // No window: with a chart open this stays a question about that chart.
  'Ka\u00e7 a\u015f\u0131 yapt\u0131k?',
  'Toplam ka\u00e7 a\u015f\u0131s\u0131 var',
  'Bu hastaya son bir ayda ka\u00e7 a\u015f\u0131 yapt\u0131k?',
  'Son bir ayda ka\u00e7 a\u015f\u0131s\u0131 yap\u0131ld\u0131?',
  'Parasetamol\u00fc g\u00fcnde en fazla ka\u00e7 kez verdim?',
]
describe('NOTYA-AYSE-KOHORT-01 practice ranking questions', () => {
  for (const s of EVET) it('practice question: ' + s, () => assert.equal(kohortSorusuMu(s), true))
  for (const s of HAYIR) it('not a practice question: ' + s, () => assert.equal(kohortSorusuMu(s), false))
})
