/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Yara / foto / onam / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { yaraSkorla, pansumanOneri } from '../engines/yara'
import { fotoSkorla } from '../engines/foto'
import { onamSkorla } from '../engines/onam'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { plastikKohortSatirlari } from '../engines/kohort'
import { dozVeyaTaniKilidiIceriyorMu } from '../engines/plastik'

describe('plastik yara', () => {
  it('yara/greft izlem karar desteği; doz reddi', () => {
    assert.ok(dozVeyaTaniKilidiIceriyorMu('500 mg antibiyotik'))
    const s = yaraSkorla({ tip: 'greft', bolge: 'sağ meme', pansumanTarihi: '2026-09-22' })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
  it('eksik bölge', () => {
    assert.equal(yaraSkorla({ tip: 'yara' }).tamamMi, false)
  })
  it('pansuman önerisi', () => {
    assert.equal(pansumanOneri('2026-09-19', 3), '2026-09-22')
  })
})

describe('plastik foto', () => {
  it('zaman çizgisi; PASI reddi', () => {
    const s = fotoSkorla({ tarih: '2026-09-19', etiket: 'Kontrol foto', sonrakiKontrol: '2026-10-01' })
    assert.ok(s.tamamMi)
    assert.equal(fotoSkorla({ tarih: '2026-09-19', etiket: 'PASI skor' }).tamamMi, false)
  })
})

describe('plastik onam', () => {
  it('checklist; doz/OR reddi', () => {
    const s = onamSkorla(['islem_amaci', 'yazili_onam'])
    assert.ok(s.tamamMi)
    assert.match(s.taslak, /TASLAK/)
    assert.equal(onamSkorla(['islem_amaci'], 'OR scheduling planı').tamamMi, false)
  })
})

describe('plastik acil', () => {
  it('flep kompromisi → hemen + hekim onayı', () => {
    const b = acilTara(['flep soluk ve soğuk, kapiller dolum yok'])
    assert.ok(b.some((x) => x.kod === 'flep_kompromisi'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('plastik kohort', () => {
  it('bayrak üretir', () => {
    const s = plastikKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01',
      gorevler: [{ kod: 'pansuman_izlem', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, fotoBekliyor: false,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('yara_greft_izlem') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})
