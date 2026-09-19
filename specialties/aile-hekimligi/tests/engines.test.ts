/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aşı/tarama + kronik paket motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asiTaramaGorevleri, asiTaramaOzeti } from '../engines/asiTarama'
import { kronikIzlemGorevleri, kronikOzeti } from '../engines/kronik'
import { aileSeridi } from '../engines/serit'
import { aileKohortSatirlari, aileRecallMesaji } from '../engines/kohort'
import { hastaDiliTemizMi, SAGLIK_PAKETIM_NOTU, AILE_IPUCLARI } from '../engines/portal-saglik-paketim'

describe('aile asi/tarama + kronik', () => {
  it('aşı/tarama görevleri doz/lot yazmaz', () => {
    const g = asiTaramaGorevleri(['grip', 'kolon'], '2026-09-19')
    assert.ok(g.length >= 2)
    assert.doesNotMatch(JSON.stringify(g), /\bmg\b|lot/i)
    assert.doesNotMatch(asiTaramaOzeti(['grip']), /\bmg\b|tanı/i)
  })

  it('kronik paket doz ve hedef sayı yazmaz', () => {
    const g = kronikIzlemGorevleri(['dm', 'ht'], '2026-09-19')
    assert.ok(g.length >= 2)
    assert.doesNotMatch(JSON.stringify(g), /\bmg\b|HbA1c\s*\d|mmHg/i)
    assert.doesNotMatch(kronikOzeti(['dm'], '2026-12-19'), /\bmg\b/)
  })

  it('şerit açık bayrakta kırmızı üretir', () => {
    const s = aileSeridi({
      bugun: '2026-09-19',
      asiTaramaSayi: 1,
      kronikPaketler: ['dm'],
      riskBayraklari: ['gogus_agrisi'],
      riskHekimOnay: false,
      sonrakiKontrol: null,
      gorevler: [],
      planlar: [],
    })
    assert.ok(s.kirmizi.length)
    assert.equal(s.chips.find((c) => c.ad === 'Sevk/acil bayrak')?.durum, 'kotu')
  })

  it('kohort hatırlatması klinik bilgi taşımaz', () => {
    const satirlar = aileKohortSatirlari([{
      patientId: 'p1', ad: 'Ali', acikRiskBayraklari: ['gogus_agrisi'],
      sonrakiKontrol: '2026-09-01', gorevler: [{ kod: 'asi_tarama_grip', due: '2026-09-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(satirlar[0].bayraklar.includes('risk_acik'))
    const m = aileRecallMesaji(satirlar[0].bayraklar)
    assert.doesNotMatch(m.metin, /tanı|diyabet|HbA1c|\bmg\b/i)
    assert.match(m.metin, /112/)
  })

  it('portal hasta dili temiz', () => {
    assert.ok(hastaDiliTemizMi(SAGLIK_PAKETIM_NOTU))
    for (const x of AILE_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })
})
