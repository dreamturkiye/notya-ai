/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Pre-op / tüp-yara / patoloji / acil / kohort motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { preopSkorla, preopYasakIceriyorMu } from '../engines/preop'
import { tupYaraSkorla } from '../engines/tupYara'
import { patolojiSkorla, patolojiYasakIceriyorMu } from '../engines/patoloji'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { gcKohortSatirlari } from '../engines/kohort'
import { hastaDiliTemizMi } from '../engines/portal-takibim'

describe('gogus-cerrahisi preop', () => {
  it('checklist karar desteği; CAT/doz reddi', () => {
    assert.ok(preopYasakIceriyorMu('CAT 20'))
    assert.ok(preopYasakIceriyorMu('10 mg'))
    const s = preopSkorla(['sft_yapildi', 'goruntu_hazir'])
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik madde', () => {
    assert.equal(preopSkorla([]).tamamMi, false)
  })
})

describe('gogus-cerrahisi tup/yara', () => {
  it('tarih zorunlu', () => {
    assert.equal(tupYaraSkorla({ tip: 'toraks_tup', durum: 'izlemde' }).tamamMi, false)
    const s = tupYaraSkorla({ tip: 'toraks_tup', durum: 'izlemde', tarih: '2026-09-19', sonrakiKontrol: '2026-09-26' })
    assert.ok(s.tamamMi)
  })
})

describe('gogus-cerrahisi patoloji', () => {
  it('tanı reddi; tarih köprüsü OK', () => {
    assert.ok(patolojiYasakIceriyorMu('adenokarsinom tanı'))
    const s = patolojiSkorla({ ornekTarihi: '2026-09-01', hazir: true })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Tanı yazılmaz|hekim/i)
  })
})

describe('gogus-cerrahisi acil', () => {
  it('tansiyon pnömotoraks → hemen + hekim onayı', () => {
    const b = acilTara(['ani tek taraflı göğüs ağrısı ve nefes darlığı tansiyon pnömotoraks'])
    assert.ok(b.some((x) => x.kod === 'tansiyon_pnomotoraks'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('gogus-cerrahisi kohort', () => {
  it('bayrak üretir', () => {
    const s = gcKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', preopSayi: 0, tupYaraAktif: true, patolojiBekliyor: false,
      gorevler: [{ kod: 'kontrol_randevu', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('gecikmis_kontrol') || s[0].bayraklar.includes('preop_eksik'))
  })
})

describe('gogus-cerrahisi portal dil kilidi', () => {
  it('CAT/mMRC/tanı yasak', () => {
    assert.equal(hastaDiliTemizMi('Kontrol randevusu'), true)
    assert.equal(hastaDiliTemizMi('CAT skoru 18'), false)
    assert.equal(hastaDiliTemizMi('mMRC 3'), false)
    assert.equal(hastaDiliTemizMi('kanser tanısı'), false)
  })
})
