/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { skorlaVas, skorlaOdi, ODI_MADDELER } from '../engines/vasOdi'
import { seansPlani } from '../engines/seans'
import { egzersizRecetesi } from '../engines/egzersiz'
import { acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, ACIL_KODLARI, HASTA_ACIL_METNI } from '../engines/acil'
import { ftrKohortSatirlari, ftrRecallMesaji } from '../engines/kohort'
import { hastaDiliTemizMi, FTRM_NOTU } from '../engines/portal-ftrm'

describe('FTR VAS/ODI', () => {
  it('VAS 8 → şiddetli bant', () => {
    const s = skorlaVas(8)
    assert.equal(s.tamamMi, true)
    assert.equal(s.bant, 'siddetli')
  })

  it('ODI eksik madde yorumlanmaz', () => {
    const s = skorlaOdi([1, 1, 1, null, 1, 1, 1, 1, 1, 1])
    assert.equal(s.tamamMi, false)
    assert.equal(s.yuzde, null)
  })

  it('ODI 10 madde → yüzde', () => {
    const s = skorlaOdi(Array(10).fill(2))
    assert.equal(s.tamamMi, true)
    assert.equal(s.yuzde, 40)
    assert.equal(s.bant, 'orta')
    assert.equal(ODI_MADDELER.length, 10)
  })
})

describe('FTR seans / egzersiz', () => {
  it('seans planı ilaç yazmaz', () => {
    const s = seansPlani({ bolge: 'bel', modaliteler: ['TENS / elektroterapi'], seansSayisi: 10, haftalikSiklik: 3 })
    assert.equal(s.tamamMi, true)
    assert.match(s.ozet, /yazılmaz/)
    assert.doesNotMatch(s.ozet, /\bmg\b|\bmL\b/)
  })

  it('egzersiz reçetesi tamam', () => {
    const s = egzersizRecetesi([{ ad: 'Köprü (bridge)', set: 3, tekrar: 10 }])
    assert.equal(s.tamamMi, true)
    assert.match(s.ozet, /ilaç yok/)
  })
})

describe('FTR acil', () => {
  it('cauda eşleşmesi', () => {
    const b = acilTara(['Eyer bölgesinde uyuşukluk ve idrar kaçırma'])
    assert.ok(b.some((x) => x.kod === 'cauda_equina'))
    assert.ok(hekimOnayiGerekliMi(b))
  })

  it('intake etiketleri motor kodlarıyla birebir', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, ACIL_KODLARI.length)
  })

  it('hasta acil metni tanı ve doz taşımaz', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /\bmg\b|VAS|tanı/i)
  })
})

describe('FTR kohort / portal dili', () => {
  it('yüksek ODI bayrağı', () => {
    const satirlar = ftrKohortSatirlari([{
      patientId: 'p1', ad: 'Test', sonVasBant: null, sonOdiBant: 'siddetli',
      acikRiskBayraklari: [], sonrakiKontrol: null, gorevler: [], sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(satirlar[0].bayraklar.includes('olcek_yuksek'))
  })

  it('recall tanı/skor taşımaz', () => {
    const m = ftrRecallMesaji(['olcek_yuksek'])
    assert.ok(hastaDiliTemizMi(m.metin))
    assert.ok(hastaDiliTemizMi(FTRM_NOTU))
  })
})
