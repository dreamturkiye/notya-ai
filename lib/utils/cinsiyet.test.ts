/**
 * CINSIYET-NORMAL-01 (2026-11-20) — every stored sex variant resolves to the canonical value, so no clinical
 * consumer (growth curve, percentile, target height, lab reference) silently drops a patient.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cinsiyetGop, cinsiyetKanonik, cinsiyetKodu, cinsiyetSakla, cinsiyetTr } from './cinsiyet'

describe('cinsiyetKanonik — every stored variant', () => {
  const kadin = [
    'Kadın', 'kadın', 'KADIN', 'kadin', 'Kız', 'kız', 'KIZ', 'kiz', 'K', 'k', ' Kadın ', 'Kız/Kadın', 'K (Kadın)', 'Kız çocuk',
    'female', 'Female', 'FEMALE', 'F', 'f', 'woman', 'girl',
    'ayol', 'Qiz', 'аёл', 'қиз', 'женский', 'Ж', 'девочка',
  ]
  const erkek = [
    'Erkek', 'erkek', 'ERKEK', 'E', 'e', ' Erkek ', 'Erkek çocuk', 'oğlan',
    'male', 'Male', 'MALE', 'M', 'm', 'man', 'boy',
    'erkak', 'O‘g‘il', "o'g'il", 'эркак', 'мужской', 'М', 'мальчик',
  ]
  for (const v of kadin) it(`"${v}" → female`, () => assert.equal(cinsiyetKanonik(v), 'female'))
  for (const v of erkek) it(`"${v}" → male`, () => assert.equal(cinsiyetKanonik(v), 'male'))

  it('empty / unknown / contradictory → null', () => {
    for (const v of [null, undefined, '', '   ', 'diğer', 'other', 'unknown', 'belirtilmemiş', 'male/female', 'K/E', 'X']) {
      assert.equal(cinsiyetKanonik(v as string | null | undefined), null, String(v))
    }
  })
})

describe('country builds read without Turkish forms', () => {
  it('{ turkce: false }: English / Uzbek / Russian resolve, Turkish forms do not', () => {
    for (const v of ['female', 'F', 'ayol', 'женский']) assert.equal(cinsiyetKanonik(v, { turkce: false }), 'female', v)
    for (const v of ['male', 'M', 'erkak', 'мужской']) assert.equal(cinsiyetKanonik(v, { turkce: false }), 'male', v)
    for (const v of ['Kadın', 'Kadin', 'Kız', 'K', 'Erkek', 'E']) assert.equal(cinsiyetKanonik(v, { turkce: false }), null, v)
  })
})

describe('derived helpers keep their contracts', () => {
  it('cinsiyetSakla writes canonical values only', () => {
    assert.equal(cinsiyetSakla('Kadın'), 'female')
    assert.equal(cinsiyetSakla('Erkek'), 'male')
    assert.equal(cinsiyetSakla('K'), 'female')
    assert.equal(cinsiyetSakla(''), null)
  })
  it('cinsiyetKodu → K / E (MBYS, reports)', () => {
    assert.equal(cinsiyetKodu('female'), 'K')
    assert.equal(cinsiyetKodu('Kadın'), 'K')
    assert.equal(cinsiyetKodu('male'), 'E')
    assert.equal(cinsiyetKodu('Erkek'), 'E')
    assert.equal(cinsiyetKodu(null), null)
  })
  it('cinsiyetTr: Turkish display unchanged for canonical rows, unknown text shown as typed', () => {
    assert.equal(cinsiyetTr('female'), 'Kadın')
    assert.equal(cinsiyetTr('male'), 'Erkek')
    assert.equal(cinsiyetTr('Kız'), 'Kadın')
    assert.equal(cinsiyetTr('E'), 'Erkek')
    assert.equal(cinsiyetTr(''), '')
    assert.equal(cinsiyetTr('Diğer'), 'Diğer')
  })
  it('cinsiyetGop stays conservative for unknown', () => {
    assert.equal(cinsiyetGop('Kadın'), 'female')
    assert.equal(cinsiyetGop('E'), 'male')
    assert.equal(cinsiyetGop(''), 'unknown')
  })
})
