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
