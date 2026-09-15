import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { naegeleTahminiDogum, gebelikYasi, izlemDurumlari, gebelikUyarilari, kiloAlimHedefi } from './gebelik'

describe('gebelik', () => {
  it('computes Naegele EDD as SAT + 280 days', () => {
    assert.equal(naegeleTahminiDogum('2026-03-02'), '2026-12-07')
  })

  it('computes gestational age from SAT', () => {
    const y = gebelikYasi('2026-03-02', null, new Date('2026-09-14'))
    assert.ok(y)
    assert.equal(y!.hafta, 28)
    assert.equal(y!.gun, 0)
    assert.equal(y!.trimester, 3)
  })

  it('prefers USG-corrected TDT over SAT when both given', () => {
    const y = gebelikYasi('2026-03-02', '2026-12-14', new Date('2026-09-14'))
    assert.ok(y)
    assert.equal(y!.hafta, 27) // bir hafta geriye kayar
  })

  it('marks visit-window status correctly (done / missed / due / future)', () => {
    const t = izlemDurumlari(28, [10])
    assert.deepEqual(t.map((p) => p.durum), ['tamamlandi', 'gecikmis', 'zamani', 'ileride'])
  })

  it('flags hypertension, proteinuria, Rh-negative timing, and missed visits together', () => {
    const y = gebelikYasi('2026-03-02', null, new Date('2026-09-14'))!
    const uyarilar = gebelikUyarilari(
      y,
      { tarih: '2026-09-14', hafta: 28, tansiyonSistolik: 145, tansiyonDiastolik: 95, proteinuri: '+', fetalKalpAtimi: 145 },
      true,
      [{ tarih: '2026-05-10', hafta: 10 }]
    )
    const metinler = uyarilar.map((u) => u.metin).join(' | ')
    assert.match(metinler, /145\/95/)
    assert.match(metinler, /Proteinüri/)
    assert.match(metinler, /Rh negatif/)
    assert.match(metinler, /2\. İzlem/)
  })

  it('does not fire a hypertension alert for normal readings', () => {
    const y = gebelikYasi('2026-03-02', null, new Date('2026-09-14'))!
    const uyarilar = gebelikUyarilari(y, { tarih: '2026-09-14', hafta: 28, tansiyonSistolik: 118, tansiyonDiastolik: 76, fetalKalpAtimi: 140 }, false, [{ tarih: '2026-05-10', hafta: 10 }, { tarih: '2026-08-01', hafta: 22 }])
    assert.ok(!uyarilar.some((u) => /Tansiyon/.test(u.metin)))
  })

  it('sets weight-gain target by pre-pregnancy BMI category', () => {
    assert.deepEqual(kiloAlimHedefi(22), { alt: 11, ust: 16, etiket: 'Normal' })
    assert.deepEqual(kiloAlimHedefi(32), { alt: 5, ust: 9, etiket: 'Obez' })
    assert.equal(kiloAlimHedefi(null), null)
  })
})
