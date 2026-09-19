/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Pre-op / greft-yara / antikoag / acil / kohort motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { preopSkorla, preopYasakIceriyorMu } from '../engines/preop'
import { greftYaraSkorla } from '../engines/greftYara'
import { antikoagSkorla, antikoagYasakIceriyorMu } from '../engines/antikoag'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { kdcKohortSatirlari } from '../engines/kohort'
import { hastaDiliTemizMi } from '../engines/portal-damar'

describe('kalp-damar-cerrahisi preop', () => {
  it('checklist karar desteği; SCORE2/doz reddi', () => {
    assert.ok(preopYasakIceriyorMu('SCORE2'))
    assert.ok(preopYasakIceriyorMu('10 mg'))
    const s = preopSkorla(['goruntu_hazir', 'anestezi_degerlendirme'])
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik madde', () => {
    assert.equal(preopSkorla([]).tamamMi, false)
  })
})

describe('kalp-damar-cerrahisi greft/yara', () => {
  it('tarih zorunlu', () => {
    assert.equal(greftYaraSkorla({ tip: 'greft', durum: 'izlemde' }).tamamMi, false)
    const s = greftYaraSkorla({ tip: 'greft', durum: 'izlemde', tarih: '2026-09-19', sonrakiKontrol: '2026-09-26' })
    assert.ok(s.tamamMi)
  })
})

describe('kalp-damar-cerrahisi antikoag', () => {
  it('doz reddi; vade OK', () => {
    assert.ok(antikoagYasakIceriyorMu('5 mg warfarin'))
    assert.ok(antikoagYasakIceriyorMu('INR hedef 2-3'))
    const s = antikoagSkorla({ sinif: 'doac', sonrakiKontrol: '2026-10-01' })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Do[zs] yazılmaz|hekim/i)
  })
})

describe('kalp-damar-cerrahisi acil', () => {
  it('akut ekstremite → hemen + hekim onayı', () => {
    const b = acilTara(['ani soğuk ayak şiddetli ağrı akut ekstremite'])
    assert.ok(b.some((x) => x.kod === 'akut_ekstremite_iskemi'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('kalp-damar-cerrahisi kohort', () => {
  it('bayrak üretir', () => {
    const s = kdcKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', preopSayi: 0, greftYaraAktif: true, antikoagVade: false,
      gorevler: [{ kod: 'kontrol_randevu', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('gecikmis_kontrol') || s[0].bayraklar.includes('preop_eksik'))
  })
})

describe('kalp-damar-cerrahisi portal dil kilidi', () => {
  it('SCORE2/Kalbim/tanı/doz yasak', () => {
    assert.equal(hastaDiliTemizMi('Kontrol randevusu'), true)
    assert.equal(hastaDiliTemizMi('SCORE2 skoru'), false)
    assert.equal(hastaDiliTemizMi('Kalbim'), false)
    assert.equal(hastaDiliTemizMi('tanı kondu'), false)
    assert.equal(hastaDiliTemizMi('5 mg'), false)
  })
})
