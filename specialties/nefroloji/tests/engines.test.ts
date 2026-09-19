/**
 * NEFROLOJI-EXCEPTIONAL-01 — eGFR / anemi / diyaliz / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { egfrSkorla, gEvre, aEvre } from '../engines/egfr'
import { anemiSkorla } from '../engines/anemi'
import { diyalizSkorla, diyalizHisIceriyorMu } from '../engines/diyaliz'
import { acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI } from '../engines/acil'
import { nefKohortSatirlari, nefRecallMesaji } from '../engines/kohort'
import { hastaDiliTemizMi } from '../engines/portal-bobreklerim'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('nefroloji egfr', () => {
  it('G3a × A2 turuncu', () => {
    const s = egfrSkorla(48, 120)
    assert.equal(s.tamamMi, true)
    assert.equal(s.g, 'G3a')
    assert.equal(s.a, 'A2')
    assert.equal(s.renk, 'turuncu')
    assert.ok(s.sonrakiAy === 6)
  })
  it('eksik eGFR yorumlanmaz', () => {
    assert.equal(egfrSkorla(null, 50).tamamMi, false)
  })
  it('g/a helpers', () => {
    assert.equal(gEvre(90), 'G1')
    assert.equal(aEvre(15), 'A1')
  })
})

describe('nefroloji anemi', () => {
  it('Hb düşük → sık izlem, ESA doz yok', () => {
    const s = anemiSkorla(9.2)
    assert.equal(s.tamamMi, true)
    assert.equal(s.bant, 'dusuk')
    assert.equal(s.sonrakiAy, 1)
    assert.match(s.ozet, /ESA dozu Notya yazılmaz/)
  })
})

describe('nefroloji diyaliz', () => {
  it('seans kaydı', () => {
    const s = diyalizSkorla({ modalite: 'hd', tarih: '2026-09-19', sonrakiSeans: '2026-09-21' })
    assert.equal(s.tamamMi, true)
    assert.match(s.ozet, /Hemodiyaliz/)
  })
  it('HIS sızıntısı yakalanır', () => {
    assert.equal(diyalizHisIceriyorMu('UF 2.5 L'), true)
  })
})

describe('nefroloji acil', () => {
  it('hiperkalemi → hemen + hekim onayı', () => {
    const b = acilTara(['potasyum 6.5 hiperkalemi'])
    assert.ok(b.some((x) => x.kod === 'hiperkalemi'))
    assert.equal(hekimOnayiGerekliMi(b), true)
  })
  it('intake etiketleri motor ile birebir', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, INTAKE_ACIL_SECENEKLERI.length)
  })
})

describe('nefroloji kohort', () => {
  it('bayrak sıralar', () => {
    const satirlar = nefKohortSatirlari([{
      patientId: '1', ad: 'Ali', sonKdigoRenk: 'kirmizi', acikRiskBayraklari: ['hiperkalemi'],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'egfr_izlem', due: '2026-01-01' }],
      sonVizit: '2026-08-01', portalVar: true,
    }], '2026-09-19')
    assert.ok(satirlar[0].bayraklar.includes('risk_acik'))
    assert.ok(satirlar[0].bayraklar.includes('kdigo_kirmizi'))
  })
  it('recall tanı taşımaz', () => {
    const m = nefRecallMesaji(['gecikmis_kontrol'])
    assert.ok(hastaDiliTemizMi(m.metin))
  })
})

describe('NEF prompts lock', () => {
  it('soap-nef kilidi ESA / HIS / tanı yasaklar', () => {
    const p = readFileSync(join(import.meta.dirname, '../prompts/soap-nef.md'), 'utf8')
    assert.match(p, /ESA/)
    assert.match(p, /Diyaliz makinesi HIS|HIS core/)
    assert.match(p, /Tanı kilidi yok/)
  })
})
