import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  belgeTurleriIcinBrans,
  belgeTuruIzinliMi,
  yenidoganTaburcuEpikriziBransiMi,
  YENIDOGAN_TABURCULUK_EPIKRIZI,
  ORTAK_BELGE_TURLERI,
} from './belgeTurleri'

describe('belgeTurleri — Yenidoğan Taburculuk Epikrizi (brans-alan-sızması)', () => {
  it('pediatri ve KD select’te görür; Epikriz’den hemen sonra', () => {
    for (const ham of ['pediatri', 'Çocuk Sağlığı ve Hastalıkları', 'kadin-dogum', 'kadin-hastaliklari-dogum']) {
      const liste = belgeTurleriIcinBrans(ham)
      assert.ok(liste.includes(YENIDOGAN_TABURCULUK_EPIKRIZI), ham)
      const epikriz = liste.indexOf('Epikriz')
      const yenidogan = liste.indexOf(YENIDOGAN_TABURCULUK_EPIKRIZI)
      assert.equal(yenidogan, epikriz + 1, `${ham}: Epikriz’den sonra`)
    }
  })

  it('dahiliye / kardiyoloji / göz select’te YOK', () => {
    for (const ham of ['dahiliye', 'kardiyoloji', 'göz', 'goz-hastaliklari', 'kulak-burun-bogaz', '']) {
      const liste = belgeTurleriIcinBrans(ham)
      assert.equal(liste.includes(YENIDOGAN_TABURCULUK_EPIKRIZI), false, ham || '(boş)')
      assert.deepEqual(
        liste.filter((t) => !(ORTAK_BELGE_TURLERI as readonly string[]).includes(t)),
        [],
        `${ham || 'boş'}: yalnız ortak`,
      )
    }
  })

  it('API kapısı: yabancı branş Yenidoğan türünü yükleyemez', () => {
    assert.equal(belgeTuruIzinliMi(YENIDOGAN_TABURCULUK_EPIKRIZI, 'pediatri'), true)
    assert.equal(belgeTuruIzinliMi(YENIDOGAN_TABURCULUK_EPIKRIZI, 'kadin-dogum'), true)
    assert.equal(belgeTuruIzinliMi(YENIDOGAN_TABURCULUK_EPIKRIZI, 'dahiliye'), false)
    assert.equal(belgeTuruIzinliMi(YENIDOGAN_TABURCULUK_EPIKRIZI, 'kardiyoloji'), false)
    assert.equal(belgeTuruIzinliMi('Lab Sonucu', 'kardiyoloji'), true)
    assert.equal(belgeTuruIzinliMi('Epikriz', 'dahiliye'), true)
  })

  it('yenidoganTaburcuEpikriziBransiMi yalnız pediatri + KD', () => {
    assert.equal(yenidoganTaburcuEpikriziBransiMi('pediatri'), true)
    assert.equal(yenidoganTaburcuEpikriziBransiMi('kadin-hastaliklari-dogum'), true)
    assert.equal(yenidoganTaburcuEpikriziBransiMi('dahiliye'), false)
    assert.equal(yenidoganTaburcuEpikriziBransiMi(null), false)
  })
})
