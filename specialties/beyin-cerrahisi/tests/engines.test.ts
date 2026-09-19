/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Post-op / bilinç / acil / görüntü / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { postopSkorla } from '../engines/postop'
import { bilincSkorla } from '../engines/bilinc'
import { goruntuSkorla } from '../engines/goruntu'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { bcKohortSatirlari } from '../engines/kohort'
import { aedDozIceriyorMu } from '../engines/beyin'

describe('beyin-cerrahisi postop', () => {
  it('checklist karar desteği; AED doz reddi', () => {
    assert.ok(aedDozIceriyorMu('levetirasetam 500 mg'))
    const s = postopSkorla(['yara_kontrol', 'kontrol_randevu'])
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik madde', () => {
    assert.equal(postopSkorla([]).tamamMi, false)
  })
})

describe('beyin-cerrahisi bilinc', () => {
  it('bayrak üretir; doz reddi', () => {
    const s = bilincSkorla({ bayraklar: ['nobet_gozlemi'], tarih: '2026-09-20' })
    assert.ok(s.tamamMi)
    assert.equal(bilincSkorla({ bayraklar: ['nobet_gozlemi'], not: 'AED dozu 500 mg' }).tamamMi, false)
  })
})

describe('beyin-cerrahisi goruntu', () => {
  it('köprü; tanı etiketi reddi', () => {
    const s = goruntuSkorla({ sonraki: '2026-10-01', etiket: 'Kontrol BT' })
    assert.ok(s.tamamMi)
    assert.equal(goruntuSkorla({ sonraki: '2026-10-01', etiket: 'glikom tanısı' }).tamamMi, false)
  })
})

describe('beyin-cerrahisi acil', () => {
  it('bilinç kaybı → hemen + hekim onayı', () => {
    const b = acilTara(['ani bilinç kaybı ve stupor'])
    assert.ok(b.some((x) => x.kod === 'bilinc_kaybi'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('beyin-cerrahisi kohort', () => {
  it('bayrak üretir', () => {
    const s = bcKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01',
      gorevler: [{ kod: 'postop_yara_kontrol', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, goruntuBekliyor: false,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('postop_izlem') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})
