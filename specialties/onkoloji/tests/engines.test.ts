/**
 * ONKOLOJI-EXCEPTIONAL-01 — Kür / toksisite / acil / SUT motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kurSkorla, kurDozIceriyorMu } from '../engines/kur'
import { toksisiteSkorla } from '../engines/toksisite'
import { sutTaslagi } from '../engines/sut'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { onkoKohortSatirlari } from '../engines/kohort'
import { akiEvreDegerlendir } from '../engines/kdigoAki'

describe('onkoloji kur', () => {
  it('kür sayacı karar desteği; doz reddi', () => {
    assert.ok(kurDozIceriyorMu('75 mg/m2'))
    const s = kurSkorla({ mevcutKur: 2, toplamKur: 6, sonrakiKurTarihi: '2026-10-10' })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik kür numarası', () => {
    assert.equal(kurSkorla({}).tamamMi, false)
  })
})

describe('onkoloji toksisite', () => {
  it('liste üretir', () => {
    const s = toksisiteSkorla(['bulanti_kusma', 'notropeni_risk'])
    assert.ok(s.tamamMi)
    assert.equal(s.secilen.length, 2)
  })
})

describe('onkoloji sut', () => {
  it('taslak; doz ve evre kilidi yok', () => {
    const s = sutTaslagi({ amac: 'tedavi_raporu', endikasyonOzet: 'Hekim endikasyon özeti yeterli uzunlukta' })
    assert.ok(s.tamamMi)
    assert.match(s.taslak, /TASLAK|e-imza yok/i)
    assert.equal(sutTaslagi({ amac: 'ilac_raporu', endikasyonOzet: '75 mg/m2 protokol' }).tamamMi, false)
  })
})

describe('onkoloji acil', () => {
  it('febril nötropeni → hemen + hekim onayı', () => {
    const b = acilTara(['kemoterapi sonrası ateş 38.5 ve halsizlik'])
    assert.ok(b.some((x) => x.kod === 'febril_notropeni'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('onkoloji kohort', () => {
  it('bayrak üretir', () => {
    const s = onkoKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', sonrakiKur: '2026-01-01',
      gorevler: [{ kod: 'kur_sonraki', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, goruntuBekliyor: false,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('kur_gecikmis') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})

describe('onkoloji kdigoAki', () => {
  const temelHasta = { yas: 55, krea: null, kreaBazal: null, kreaArtis48Saat: null, idrarMlKgSaat: null, idrarSuresiSaat: null, anuriSuresiSaat: null, rrtBaslandi: false }

  it('KDIGO 2012 Table 2 creatinine-fold boundaries: evre1/2/3 (nefrotoksik kür izlemi)', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 2.6, kreaBazal: 1.2 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 4.0, kreaBazal: 1.2 }).evre, 'evre3')
  })

  it('RRT initiation alone is evre3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, rrtBaslandi: true }).evre, 'evre3')
  })

  it('worse-stage rule: creatinine and urine output can disagree, higher wins', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 })
    assert.equal(s.evre, 'evre3')
    assert.ok(s.uyarilar.includes('kreatinin_idrar_farkli_evre'))
  })

  it('pediatric patient is refused — adult-only tool', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, yas: 9, krea: 2, kreaBazal: 0.8 })
    assert.equal(s.tamamMi, false)
    assert.ok(s.uyarilar.includes('pediatrik_disi'))
  })

  it('wording is decision-support, no colour, no invented dose/azaltma', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /yesil|sari|turuncu|kirmizi|green|yellow|orange|red|\bmg\b/i)
  })
})
