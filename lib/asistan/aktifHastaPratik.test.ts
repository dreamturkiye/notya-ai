import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { acikDosyaDisiSoruMu, aktifHastaKullanilsinMi, kohortSorusuMu, ziyaretleTarifMi } from './aktifHasta'

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

// NOTYA-KORPUS-KALAN-01 (Y-083, Y-091): with a chart open, the panel count in the doctor's own wording and a patient
// described by a visit inside a time window are questions about the practice, not about the open chart.
const KALAN_SAYIM = [
  'kaç tane hasta kaydım var toplam',
  'Kaç tane hastam var?',
  'Toplam kaç adet hasta var',
  'hasta kaydım kaç tane',
]
const KALAN_TARIF = [
  'dün gelen ateşli çocuk',
  'Dün gelen ateşli bebek',
  'bu hafta gördüğüm öksürüklü hasta',
  'geçen hafta muayene ettiğim ishalli çocuk',
  'bugün gelen kulak ağrılı kız',
]
const KALAN_HAYIR = [
  // No time window: the sentence stays with the open chart.
  'Ateşi olan çocuk için ne önerirsin',
  'gelen hasta için reçete hazırla',
  // The sentence points at this patient.
  'Bu çocuk dün gelen hasta mıydı',
  'Dün ateşi kaçtı?',
  'Dün geldiğinde kilosu kaçtı',
  'Kaç tane aşısı var',
  'Hasta kaydını güncelle',
]
describe('NOTYA-KORPUS-KALAN-01 panel count and a patient described by a visit', () => {
  for (const s of KALAN_SAYIM) it('panel count: ' + s, () => assert.equal(kohortSorusuMu(s), true))
  for (const s of KALAN_TARIF) {
    it('described by a visit — not the open chart, and not a count question: ' + s, () => {
      assert.equal(ziyaretleTarifMi(s), true)
      assert.equal(acikDosyaDisiSoruMu(s), true)
      // Nobody found → the model, never a "Dün 0 hasta" sentence (NOTYA-AYSE-GERI-01).
      assert.equal(kohortSorusuMu(s), false)
      assert.equal(aktifHastaKullanilsinMi({ aktifHastaVar: true, cozumTur: 'yok', aramaSonucu: false, mesaj: s }), false)
    })
  }
  for (const s of KALAN_HAYIR) it('stays with the open chart: ' + s, () => assert.equal(acikDosyaDisiSoruMu(s), false))
})
