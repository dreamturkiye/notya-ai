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
  it('paket; boarding HIS yok', () => {
    const s = sevkSkorla({ hedef: 'taburcu_takip', maddeler: ['taburcu_egitim', 'kontrol_randevu'] })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Boarding HIS yok/i)
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
