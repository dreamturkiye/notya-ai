/**
 * ANESTEZI-EXCEPTIONAL-01 — ASA / hava yolu / ağrı / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asaSkorla } from '../engines/asa'
import { havaYoluSkorla } from '../engines/havaYolu'
import { agriSkorla } from '../engines/agri'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { anesteziKohortSatirlari } from '../engines/kohort'
import { dozIceriyorMu } from '../engines/anestezi'

describe('anestezi asa', () => {
  it('checklist karar desteği; doz reddi', () => {
    assert.ok(dozIceriyorMu('propofol 200 mg'))
    const s = asaSkorla(['anamnez_tamam', 'kontrol_randevu'], 'II')
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik madde', () => {
    assert.equal(asaSkorla([]).tamamMi, false)
  })
})

describe('anestezi hava yolu', () => {
  it('bayrak üretir; doz reddi', () => {
    const s = havaYoluSkorla({ bayraklar: ['mallampati_kaydi'], tarih: '2026-09-20' })
    assert.ok(s.tamamMi)
    assert.equal(havaYoluSkorla({ bayraklar: ['mallampati_kaydi'], not: 'propofol 100 mg' }).tamamMi, false)
  })
})

describe('anestezi agri', () => {
  it('skor + bayrak; doz reddi', () => {
    const s = agriSkorla({ bayraklar: ['agri_skala_kaydi'], agriSkor: 4, tarih: '2026-09-20' })
    assert.ok(s.tamamMi)
    assert.equal(agriSkorla({ bayraklar: ['agri_skala_kaydi'], not: 'morfin 10 mg' }).tamamMi, false)
  })
})

describe('anestezi acil', () => {
  it('zor hava yolu → hemen + hekim onayı', () => {
    const b = acilTara(['zor hava yolu ve cannot ventilate'])
    assert.ok(b.some((x) => x.kod === 'zor_hava_yolu_acil'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('anestezi kohort', () => {
  it('bayrak üretir (alerji + gecikmiş)', () => {
    const s = anesteziKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01',
      gorevler: [{ kod: 'asa_kontrol_randevu', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, alerjiIlacBayrak: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('alerji_ilac'))
    assert.ok(s[0].bayraklar.includes('asa_eksik') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})
