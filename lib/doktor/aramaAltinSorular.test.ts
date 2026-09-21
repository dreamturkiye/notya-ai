import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ALTIN_SORULAR } from './aramaAltinSorular'
import { sorguyuAyikla } from './hastaAramaFiltre'
import { aramaBolumuAc } from './aramaBolum'
import { kohortSatirUyar } from './aramaBolum'

const PAZAR = new Date('2026-09-20T15:00:00+03:00')

const SAHIP: Record<string, string> = {
  pediatri: 'pediatri',
  goz: 'goz-hastaliklari',
  kd: 'kadin-dogum',
  dahiliye: 'dahiliye',
  derm: 'dermatoloji',
}

const YABANCI = ['pediatri', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'dahiliye', 'dermatoloji']

describe('altın 150 — parser + kapalı dilim', () => {
  it('her branşta 30 soru', () => {
    for (const b of ['pediatri', 'goz', 'kd', 'dahiliye', 'derm'] as const) {
      assert.equal(ALTIN_SORULAR.filter((s) => s.brans === b).length, 30, b)
    }
  })

  for (const s of ALTIN_SORULAR) {
    it(`${s.brans} #${s.no}`, () => {
      const q = sorguyuAyikla(s.soru, PAZAR)
      assert.equal(q.bolumIstegi, s.bolumIstegi, `${s.soru} bolum=${q.bolumIstegi}`)
      if (s.bayrak) assert.ok(q.bayrakVe.includes(s.bayrak), `bayrak ${s.bayrak} in ${q.bayrakVe}`)
      if (s.yasMin != null) assert.equal(q.yas?.minAy, s.yasMin)
      if (s.yasMax != null) assert.equal(q.yas?.maxAy, s.yasMax)
      if (s.pencere) assert.equal(q.pencere?.etiket, s.pencere)
      if (s.minSeans) assert.equal(q.minSeans, s.minSeans)
      if (s.sayisalAlan) assert.ok(q.sayisal.some((x) => x.alan === s.sayisalAlan), `sayisal ${s.sayisalAlan}`)
      if (s.haric) assert.ok(q.haric.includes(s.haric))
      if (s.veyaMin) assert.ok(q.veya.length >= s.veyaMin, `veya ${q.veya.length}`)
      if (s.olcum) assert.equal(q.olcum, s.olcum)
      if (s.kirilim) assert.equal(q.kirilim, s.kirilim)
      if (s.ucDeger) assert.equal(q.ucDeger, true)
      if (s.portalYok) assert.equal(q.portalYok, true)
      if (s.hatirlatmaSay) assert.equal(q.hatirlatmaSay, true)
      if (s.ziyaretYok) assert.equal(q.ziyaretYok, true)

      if (s.bolumIstegi) {
        assert.equal(aramaBolumuAc(q, SAHIP[s.brans]), s.bolumIstegi === 'kd' ? 'kd' : s.bolumIstegi)
        for (const y of YABANCI) {
          const ac = aramaBolumuAc(q, y)
          if (s.bolumIstegi === 'pediatri' && (y === 'pediatri')) continue
          if (s.bolumIstegi === 'goz' && y === 'goz-hastaliklari') continue
          if (s.bolumIstegi === 'kd' && (y === 'kadin-hastaliklari-dogum' || y === 'kadin-dogum')) continue
          if (s.bolumIstegi === 'dahiliye' && y === 'dahiliye') continue
          if (s.bolumIstegi === 'derm' && y === 'dermatoloji') continue
          assert.equal(ac, 'kapali', `${s.soru} ${y} sızmamalı`)
        }
      } else {
        assert.equal(aramaBolumuAc(q, SAHIP[s.brans]), null)
      }
    })
  }

  it('kohort AND/OR + portal + 7 gün', () => {
    const qAnd = sorguyuAyikla('Sağlam çocuk izlemi kaçmış, aşı gecikmesi, portal açık olmayan', PAZAR)
    const ok = { bayraklar: ['izlem_kacti', 'asi_gecikti'], portalVar: false, patientId: '1' }
    const tek = { bayraklar: ['izlem_kacti'], portalVar: false, patientId: '2' }
    assert.equal(kohortSatirUyar(ok, qAnd, new Set()).ok, true)
    assert.equal(kohortSatirUyar(tek, qAnd, new Set()).ok, false)
    const qPortal = sorguyuAyikla('IVT gecikmiş portalı açık olmayan', PAZAR)
    assert.equal(kohortSatirUyar({ bayraklar: ['ivt_gecikti'], portalVar: true, patientId: '3' }, qPortal, new Set()).ok, false)
    assert.equal(kohortSatirUyar({ bayraklar: ['ivt_gecikti'], portalVar: false, patientId: '4' }, qPortal, new Set('4')).hatirlatilabilir, false)
  })
})
