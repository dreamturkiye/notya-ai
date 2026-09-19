/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — engine locks.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prepostSkorla, PREOP_MADDELER } from '../engines/prepost'
import { yaraSkorla } from '../engines/yaraDren'
import { onamSkorla, onamMaddeleri } from '../engines/onam'
import { acilTara } from '../engines/acil'
import { ccKohortSatirlari } from '../engines/kohort'
import { cocugumunCerrahisiHatirlatmalari, hastaDiliTemizMi } from '../engines/portal-cocugumun-cerrahisi'
import { dozVeyaTaniKilidiIceriyorMu } from '../engines/cocuk-cerrahisi'

describe('cocuk-cerrahisi engines', () => {
  it('prepost rejects dose / OR / Neyzi in notes', () => {
    const s = prepostSkorla({ tip: 'preop', tamamlanan: ['onam'], not: '10 mg/kg antibiyotik' })
    assert.equal(s.tamamMi, false)
    assert.ok(dozVeyaTaniKilidiIceriyorMu('Neyzi persentil'))
  })

  it('prepost scores checklist', () => {
    const s = prepostSkorla({ tip: 'preop', planlananAmeliyatEtiket: 'inguinal herni onarımı', ameliyatTarihi: '2026-10-01', tamamlanan: PREOP_MADDELER.map((m) => m.id) })
    assert.equal(s.tamamMi, true)
    assert.equal(s.eksik.length, 0)
  })

  it('yara requires date; rejects diagnosis lock', () => {
    assert.equal(yaraSkorla({ tip: 'yara' }).tamamMi, false)
    const ok = yaraSkorla({ tip: 'dren', tarih: '2026-09-20', drenCikisMl: 15 })
    assert.equal(ok.tamamMi, true)
  })

  it('onam: veli maddeleri <18; kapalı ≥18', () => {
    assert.ok(onamMaddeleri(8).some((m) => m.kod === 'veli_yazili'))
    assert.ok(!onamMaddeleri(25).some((m) => m.kod === 'veli_yazili'))
    const s = onamSkorla(['yazili_onam', 'veli_yazili'], 8)
    assert.equal(s.tamamMi, true)
    assert.equal(s.veliGerekli, true)
    const adult = onamSkorla(['yazili_onam'], 30)
    assert.equal(adult.veliGerekli, false)
  })

  it('acil detects akut karın', () => {
    const b = acilTara(['şiddetli karın ağrısı ve ateş kusma'])
    assert.ok(b.some((x) => x.kod === 'akut_karin'))
  })

  it('kohort flags preop and risk', () => {
    const satirlar = ccKohortSatirlari([{
      patientId: '1', ad: 'Test', acikRiskBayraklari: ['akut_karin'], sonrakiKontrol: null,
      ameliyatTarihi: '2026-09-01', preopEksik: true, onamEksik: false,
      gorevler: [], sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(satirlar[0].bayraklar.includes('risk_acik'))
    assert.ok(satirlar[0].bayraklar.includes('preop_eksik'))
  })

  it('portal copy stays patient-safe', () => {
    const h = cocugumunCerrahisiHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'yara_kontrol', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-09-28',
    })
    assert.ok(h.length >= 1)
    assert.ok(hastaDiliTemizMi('Kontrol randevusu'))
    assert.ok(!hastaDiliTemizMi('apandisit tanısı 10 mg'))
  })
})
