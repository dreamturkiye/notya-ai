import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  belgeTurleriIcinBrans,
  belgeTuruIzinliMi,
  yenidoganTaburcuEpikriziBransiMi,
  YENIDOGAN_TABURCULUK_EPIKRIZI,
  ORTAK_BELGE_TURLERI,
  COCUK_HASTA_RAPORU_TURLERI,
  COCUK_ISTIRAHAT_RAPORU,
  COCUK_SPOR_RAPORU,
  COCUK_KRESE_RAPORU,
  COCUK_OKUL_RAPORU,
  cocukHastaRaporuBransiMi,
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

  it('İşitme testi ortak kataloğda — tüm branş select’lerinde', () => {
    assert.ok((ORTAK_BELGE_TURLERI as readonly string[]).includes('İşitme testi'))
    assert.ok(belgeTurleriIcinBrans('pediatri').includes('İşitme testi'))
    assert.ok(belgeTurleriIcinBrans('dahiliye').includes('İşitme testi'))
    assert.equal(belgeTuruIzinliMi('İşitme testi', 'kulak-burun-bogaz'), true)
  })
})

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Çocuk Hasta Raporları (Araçlar → Hasta Raporları alt bölümü).
 * brans-alan-sızması: pediatri + çocuk cerrahisi dışında hiçbir branş bu 4 türü görmez/yükleyemez.
 */
describe('belgeTurleri — Çocuk Hasta Raporları (brans-alan-sızması)', () => {
  it('pediatri ve çocuk cerrahisi select’te 4 türün tamamını görür', () => {
    for (const ham of ['pediatri', 'Çocuk Sağlığı ve Hastalıkları', 'cocuk-cerrahisi', 'Çocuk Cerrahisi']) {
      const liste = belgeTurleriIcinBrans(ham)
      for (const tur of COCUK_HASTA_RAPORU_TURLERI) assert.ok(liste.includes(tur), `${ham}: ${tur}`)
    }
  })

  it('dahiliye / kardiyoloji / göz / KD select’te HİÇBİRİNİ görmez', () => {
    for (const ham of ['dahiliye', 'kardiyoloji', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', '']) {
      const liste = belgeTurleriIcinBrans(ham)
      for (const tur of COCUK_HASTA_RAPORU_TURLERI) assert.equal(liste.includes(tur), false, `${ham}: ${tur}`)
    }
  })

  it('API kapısı: yabancı branş hiçbir Çocuk Hasta Raporu türünü yükleyemez', () => {
    for (const tur of [COCUK_ISTIRAHAT_RAPORU, COCUK_SPOR_RAPORU, COCUK_KRESE_RAPORU, COCUK_OKUL_RAPORU]) {
      assert.equal(belgeTuruIzinliMi(tur, 'pediatri'), true, tur)
      assert.equal(belgeTuruIzinliMi(tur, 'cocuk-cerrahisi'), true, tur)
      assert.equal(belgeTuruIzinliMi(tur, 'dahiliye'), false, tur)
      assert.equal(belgeTuruIzinliMi(tur, 'kardiyoloji'), false, tur)
      assert.equal(belgeTuruIzinliMi(tur, 'goz-hastaliklari'), false, tur)
    }
  })

  it('cocukHastaRaporuBransiMi yalnız pediatri + çocuk cerrahisi', () => {
    assert.equal(cocukHastaRaporuBransiMi('pediatri'), true)
    assert.equal(cocukHastaRaporuBransiMi('cocuk-cerrahisi'), true)
    assert.equal(cocukHastaRaporuBransiMi('Çocuk Cerrahisi'), true)
    assert.equal(cocukHastaRaporuBransiMi('dahiliye'), false)
    assert.equal(cocukHastaRaporuBransiMi('kardiyoloji'), false)
    assert.equal(cocukHastaRaporuBransiMi(null), false)
    assert.equal(cocukHastaRaporuBransiMi(undefined), false)
  })
})
