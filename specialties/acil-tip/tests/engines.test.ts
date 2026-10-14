/**
 * ACIL-TIP-EXCEPTIONAL-01 — ESI / kritik yol / sevk / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { esiSkorla } from '../engines/esi'
import { kritikYolSkorla } from '../engines/kritikYol'
import { sevkSkorla } from '../engines/sevk'
import { acilTara, hekimOnayiGerekliMi, INTAKE_ACIL_SECENEKLERI } from '../engines/acil'
import { atKohortSatirlari } from '../engines/kohort'
import { dozIceriyorMu } from '../engines/acilTip'
import { akiEvreDegerlendir } from '../engines/kdigoAki'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('acil-tip esi', () => {
  it('seviye + kaynak; doz reddi', () => {
    assert.ok(dozIceriyorMu('adrenaline 1 mg'))
    const s = esiSkorla({ seviye: 2, kaynaklar: ['yuksek_risk'] })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
    assert.equal(esiSkorla({ seviye: 2, kaynaklar: [], not: 'adrenaline 1 mg' }).tamamMi, false)
  })
  it('ESI 1 requires resus kaynak', () => {
    assert.equal(esiSkorla({ seviye: 1, kaynaklar: ['kaynak_yok'] }).tamamMi, false)
    assert.ok(esiSkorla({ seviye: 1, kaynaklar: ['resus_hemen'] }).tamamMi)
  })
})

describe('acil-tip kritik yol', () => {
  it('bayrak + madde; tanı kilidi yok', () => {
    const s = kritikYolSkorla({ yollar: ['stemi'], maddeler: ['saat_kaydi', 'ekg_10dk'] })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Tanı kilidi yoktur|hekim/i)
  })
})

describe('acil-tip sevk', () => {
  it('paket; yatış bekletme HIS yok', () => {
    const s = sevkSkorla({ hedef: 'taburcu_takip', maddeler: ['taburcu_egitim', 'kontrol_randevu'] })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Yatış bekletme HIS yok/i)
  })
})

describe('acil-tip acil', () => {
  it('hava yolu → hemen + hekim onayı', () => {
    const b = acilTara(['hava yolu tehdidi ve stridor'])
    assert.ok(b.some((x) => x.kod === 'hava_yolu_tehdit'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
  it('intake etiketleri intake dosyası ile birebir', () => {
    const intake = readFileSync(join(import.meta.dirname, '../../../lib/intake/bransSorulari.ts'), 'utf8')
    for (const s of INTAKE_ACIL_SECENEKLERI) {
      assert.ok(intake.includes(s.etiket), s.etiket)
    }
  })
})

describe('acil-tip kohort', () => {
  it('bayrak üretir', () => {
    const s = atKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01',
      gorevler: [{ kod: 'taburcu_kontrol', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, esiSeviye: 2, kritikYolVar: false, sevkVar: false,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('esi_yuksek') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})

describe('acil-tip kdigoAki', () => {
  const temelHasta = { yas: 45, krea: null, kreaBazal: null, kreaArtis48Saat: null, idrarMlKgSaat: null, idrarSuresiSaat: null, anuriSuresiSaat: null, rrtBaslandi: false }

  it('KDIGO 2012 Table 2 creatinine-fold boundaries: evre1/2/3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 }).evre, 'evre1') // 1.5x
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 2.6, kreaBazal: 1.2 }).evre, 'evre2') // 2.17x
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 4.0, kreaBazal: 1.2 }).evre, 'evre3') // 3.3x
  })

  it('absolute 48h rise ≥0.3 mg/dL triggers evre1 even without a known fold-baseline', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, kreaArtis48Saat: 0.4 })
    assert.equal(s.evre, 'evre1')
  })

  it('RRT initiation alone is evre3 (KDIGO Table 2, Stage 3)', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, rrtBaslandi: true }).evre, 'evre3')
  })

  it('urine-output criteria: <0.5 mL/kg/h for 6-12h → evre1; ≥12h → evre2; <0.3 for ≥24h or anuria ≥12h → evre3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 8 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 14 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 }).evre, 'evre3')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, anuriSuresiSaat: 13 }).evre, 'evre3')
  })

  it('KDIGO worse-stage rule (p.21): whichever of creatinine/urine-output gives the higher stage wins', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 })
    assert.equal(s.kreaEvre, 'evre1')
    assert.equal(s.idrarEvre, 'evre3')
    assert.equal(s.evre, 'evre3')
    assert.ok(s.uyarilar.includes('kreatinin_idrar_farkli_evre'))
  })

  it('pediatric patient is refused — adult-only tool', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, yas: 10, krea: 2, kreaBazal: 0.8 })
    assert.equal(s.tamamMi, false)
    assert.ok(s.uyarilar.includes('pediatrik_disi'))
  })

  it('no data → no stage, not a guessed evre1', () => {
    assert.equal(akiEvreDegerlendir(temelHasta).tamamMi, false)
  })

  it('wording is decision-support, no colour', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /yesil|sari|turuncu|kirmizi|green|yellow|orange|red/i)
  })

  it('is independent from the CKD eGFR/ACR categories (different inputs, different file)', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.ok(!('eGFR' in (s as unknown as Record<string, unknown>)))
    assert.ok(!('tiyer' in (s as unknown as Record<string, unknown>)))
  })
})
