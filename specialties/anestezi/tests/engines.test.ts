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
import { akiEvreDegerlendir } from '../engines/kdigoAki'

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

describe('anestezi kdigoAki', () => {
  const temelHasta = { yas: 60, krea: null, kreaBazal: null, kreaArtis48Saat: null, idrarMlKgSaat: null, idrarSuresiSaat: null, anuriSuresiSaat: null, rrtBaslandi: false }

  it('KDIGO 2012 Table 2 creatinine-fold boundaries: evre1/2/3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 2.6, kreaBazal: 1.2 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 4.0, kreaBazal: 1.2 }).evre, 'evre3')
  })

  it('RRT initiation alone is evre3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, rrtBaslandi: true }).evre, 'evre3')
  })

  it('urine-output criteria across stages', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 8 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 14 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 }).evre, 'evre3')
  })

  it('worse-stage rule: creatinine and urine output can disagree, higher wins', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 })
    assert.equal(s.evre, 'evre3')
    assert.ok(s.uyarilar.includes('kreatinin_idrar_farkli_evre'))
  })

  it('pediatric patient is refused — adult-only tool', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, yas: 8, krea: 2, kreaBazal: 0.8 })
    assert.equal(s.tamamMi, false)
    assert.ok(s.uyarilar.includes('pediatrik_disi'))
  })

  it('wording is decision-support, no colour', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /yesil|sari|turuncu|kirmizi|green|yellow|orange|red/i)
  })
})
