/**
 * ROMATOLOJI-EXCEPTIONAL-01 — DAS28 / BASDAI / lab / acil / SUT motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { das28Skorla, basdaiSkorla, das28Banti, basdaiToplam } from '../engines/das28Basdai'
import { labSkorla, crpBanti } from '../engines/labIzlem'
import { eklemSay, EKLEM_28 } from '../engines/eklemHaritasi'
import { biyolojikSutKontrol, biyolojikDozIceriyorMu } from '../engines/biyolojikSut'
import { acilTara, hekimOnayiGerekliMi, INTAKE_ACIL_SECENEKLERI } from '../engines/acil'
import { romaKohortSatirlari } from '../engines/kohort'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('romatoloji das28Basdai', () => {
  it('DAS28-CRP bantları karar desteği', () => {
    const s = das28Skorla({ tjc: 2, sjc: 1, crp: 5, pga: 20, varyant: 'crp' })
    assert.ok(s.tamamMi)
    assert.ok(s.toplam != null && s.toplam > 0)
    assert.match(s.ozet, /karar desteği|hekim/i)
    assert.equal(das28Banti(2.0), 'remisyon')
    assert.equal(das28Banti(5.5), 'yuksek')
  })

  it('eksik TJC yorumlanmaz', () => {
    const s = das28Skorla({ tjc: null, sjc: 1, crp: 5, pga: 20, varyant: 'crp' })
    assert.equal(s.tamamMi, false)
  })

  it('BASDAI 6 madde', () => {
    assert.equal(basdaiToplam([2, 2, 2, 2, 2, 2]), 2)
    const s = basdaiSkorla([5, 5, 5, 5, 5, 5])
    assert.ok(s.tamamMi)
    assert.equal(s.bant, 'orta')
  })
})

describe('romatoloji lab / eklem', () => {
  it('CRP bant', () => {
    assert.equal(crpBanti(3), 'hedef_yakin')
    assert.equal(crpBanti(25), 'yuksek')
    const s = labSkorla('crp', 12)
    assert.ok(s.tamamMi)
    assert.equal(s.bant, 'dikkat')
  })

  it('28 eklem sayımı', () => {
    const h = eklemSay([EKLEM_28[0], EKLEM_28[1]], [EKLEM_28[0]])
    assert.equal(h.tjc, 2)
    assert.equal(h.sjc, 1)
  })
})

describe('romatoloji biyolojik SUT', () => {
  it('doz reddi', () => {
    assert.ok(biyolojikDozIceriyorMu('etanercept 50 mg haftada'))
    assert.ok(!biyolojikDozIceriyorMu('TNF inhibitörü'))
  })

  it('hekim kilidi + endikasyon', () => {
    const s = biyolojikSutKontrol({
      endikasyon: 'ra', etkenSinif: 'TNF inhibitörü', oncekiCsDmard: true,
      tbTarama: true, hbvTarama: true, hcvTarama: true, akcigerGrafisi: true,
      canliAsiBilgi: true, hekimKilit: true,
    })
    assert.ok(s.tamamMi)
    assert.equal(s.eksikler.length, 0)
  })
})

describe('romatoloji acil', () => {
  it('septik artrit → hemen + hekim onayı', () => {
    const b = acilTara(['ateşli sıcak eklem şiş'])
    assert.ok(b.some((x) => x.kod === 'septik_artrit'))
    assert.ok(hekimOnayiGerekliMi(b))
  })

  it('intake etiketleri bransSorulari ile kilitli', () => {
    const src = readFileSync(join(process.cwd(), 'lib/intake/bransSorulari.ts'), 'utf8')
    for (const s of INTAKE_ACIL_SECENEKLERI) {
      assert.ok(src.includes(s.etiket), s.etiket)
    }
  })
})

describe('romatoloji kohort', () => {
  it('bayrak üretir', () => {
    const s = romaKohortSatirlari([{
      patientId: '1', ad: 'A', sonSkorBant: 'yuksek', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'lab_crp', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('skor_yuksek'))
  })
})
