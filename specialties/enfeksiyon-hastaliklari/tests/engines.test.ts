/**
 * ENFEKSIYON-EXCEPTIONAL-01 — ATB / viral / izolasyon / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { atbHesapla, atbDozIceriyorMu, atbGorevleri } from '../engines/atbSure'
import { viralPlanla } from '../engines/viralIzlem'
import { izolasyonPlanla, izolasyonGorevleri } from '../engines/izolasyon'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { enfKohortSatirlari } from '../engines/kohort'

describe('enfeksiyon atbSure', () => {
  it('süre → bitiş; doz reddi', () => {
    const s = atbHesapla('2026-09-01', 7)
    assert.ok(s.tamamMi)
    assert.equal(s.kart.bitis, '2026-09-08')
    assert.ok(atbDozIceriyorMu('500 mg bid'))
    assert.ok(!atbDozIceriyorMu('7 gün kontrol'))
    assert.equal(atbGorevleri(s.kart).length, 1)
  })

  it('eksik başlangıç yorumlanmaz', () => {
    assert.equal(atbHesapla(null, 7).tamamMi, false)
  })
})

describe('enfeksiyon viralIzlem', () => {
  it('HIV viral ~3 ay', () => {
    const p = viralPlanla('hiv_viral', '2026-06-01', '2026-09-19')
    assert.ok(p.tamamMi)
    assert.equal(p.sonrakiTarih, '2026-09-01')
  })
})

describe('enfeksiyon izolasyon', () => {
  it('bitiş görevi', () => {
    const p = izolasyonPlanla({ tip: 'temas', baslangic: '2026-09-01', bitis: '2026-09-10' })
    assert.ok(p.tamamMi)
    assert.equal(izolasyonGorevleri(p.kart).length, 1)
  })
})

describe('enfeksiyon acil', () => {
  it('sepsis → hemen + hekim onayı', () => {
    const b = acilTara(['ateş ve hipotansiyon sepsis şüphesi'])
    assert.ok(b.some((x) => x.kod === 'sepsis_suphesi'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('enfeksiyon kohort', () => {
  it('bayrak üretir', () => {
    const s = enfKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'atb_bitis', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('atb_bitis_gecikmis') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})
