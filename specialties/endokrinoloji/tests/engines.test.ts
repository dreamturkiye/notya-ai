/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Lab / DXA / acil motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { labSkorla, hba1cBanti, tshBanti } from '../engines/labIzlem'
import { dxaPlanla } from '../engines/dxa'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { rejimNormalize, rejimDozIceriyorMu, rejimGorevleri } from '../engines/rejim'
import { endoKohortSatirlari } from '../engines/kohort'
import { kbhRiskDegerlendir, gKategorisi, aKategorisi, kbhRiskTiyeri } from '../engines/kdigoKbhRisk'

describe('endokrinoloji labIzlem', () => {
  it('HbA1c bantları karar desteği', () => {
    assert.equal(hba1cBanti(6.5), 'hedef_yakin')
    assert.equal(hba1cBanti(8), 'dikkat')
    assert.equal(hba1cBanti(10), 'yuksek')
    const s = labSkorla('hba1c', 9.2)
    assert.ok(s.tamamMi)
    assert.equal(s.bant, 'yuksek')
    assert.ok(s.sonrakiAy === 3)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })

  it('eksik değer yorumlanmaz', () => {
    const s = labSkorla('hba1c', null)
    assert.equal(s.tamamMi, false)
    assert.equal(s.bant, null)
  })

  it('TSH bant', () => {
    assert.equal(tshBanti(2), 'hedef_yakin')
    assert.equal(tshBanti(6), 'dikkat')
    assert.equal(tshBanti(12), 'yuksek')
  })
})

describe('endokrinoloji dxa', () => {
  it('yüksek risk 1 yıl', () => {
    const p = dxaPlanla('2024-01-01', 'yuksek', '2026-09-19')
    assert.ok(p.tamamMi)
    assert.equal(p.sonrakiTarih, '2025-01-01')
  })
})

describe('endokrinoloji acil', () => {
  it('hipoglisemi → hemen + hekim onayı', () => {
    const b = acilTara(['kan şekerim düştü bilinç bulanık'])
    assert.ok(b.some((x) => x.kod === 'ciddi_hipoglisemi'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('endokrinoloji rejim', () => {
  it('dates-only; doz reddi', () => {
    assert.ok(rejimDozIceriyorMu('10 IU sabah'))
    assert.ok(!rejimDozIceriyorMu('sabah açlık kontrolü'))
    const g = rejimGorevleri(rejimNormalize({ insulinKontrol: '2026-10-01', tiroidKontrol: '2026-11-01' }))
    assert.equal(g.length, 2)
  })
})

describe('endokrinoloji kohort', () => {
  it('bayrak üretir', () => {
    const s = endoKohortSatirlari([{
      patientId: '1', ad: 'A', sonHba1cBant: 'yuksek', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'lab_hba1c', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('hba1c_yuksek'))
    assert.ok(s[0].bayraklar.includes('gecikmis_kontrol') || s[0].bayraklar.includes('lab_izlem_gecikmis'))
  })
})

describe('endokrinoloji kdigoKbhRisk', () => {
  it('G/A category boundaries match KDIGO 2024 Table 2/3', () => {
    assert.equal(gKategorisi(95), 'G1')
    assert.equal(gKategorisi(75), 'G2')
    assert.equal(gKategorisi(50), 'G3a')
    assert.equal(gKategorisi(35), 'G3b')
    assert.equal(gKategorisi(20), 'G4')
    assert.equal(gKategorisi(10), 'G5')
    assert.equal(aKategorisi(10), 'A1')
    assert.equal(aKategorisi(150), 'A2')
    assert.equal(aKategorisi(500), 'A3')
  })

  it('risk tier is monotonic: a worse category never lowers the tier', () => {
    const G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'] as const
    const A = ['A1', 'A2', 'A3'] as const
    const TIER_RANK = { dusuk: 0, orta: 1, yuksek: 2, cokYuksek: 3 }
    for (let gi = 0; gi < G.length; gi++) {
      for (let ai = 0; ai < A.length; ai++) {
        const here = TIER_RANK[kbhRiskTiyeri(G[gi], A[ai])]
        if (gi + 1 < G.length) assert.ok(TIER_RANK[kbhRiskTiyeri(G[gi + 1], A[ai])] >= here, `${G[gi + 1]}×${A[ai]} must not be lower than ${G[gi]}×${A[ai]}`)
        if (ai + 1 < A.length) assert.ok(TIER_RANK[kbhRiskTiyeri(G[gi], A[ai + 1])] >= here, `${G[gi]}×${A[ai + 1]} must not be lower than ${G[gi]}×${A[ai]}`)
      }
    }
  })

  it('lowest cell (G1×A1) is dusuk; worst cell (G5×A3) is cokYuksek', () => {
    assert.equal(kbhRiskTiyeri('G1', 'A1'), 'dusuk')
    assert.equal(kbhRiskTiyeri('G5', 'A3'), 'cokYuksek')
  })

  it('no tier without ACR — eGFR alone gives the GFR category only, never a guessed tier', () => {
    const s = kbhRiskDegerlendir({ eGFR: 50, acr: null })
    assert.equal(s.tamamMi, true)
    assert.equal(s.g, 'G3a')
    assert.equal(s.tiyer, null)
  })

  it('full result names both categories and the tier, decision-support wording', () => {
    const s = kbhRiskDegerlendir({ eGFR: 50, acr: 150 })
    assert.equal(s.g, 'G3a')
    assert.equal(s.a, 'A2')
    assert.equal(s.tiyer, 'yuksek')
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /yesil|sari|turuncu|kirmizi|green|yellow|orange|red/i)
  })

  it('missing/out-of-range eGFR → tamamMi false, no category guessed', () => {
    assert.equal(kbhRiskDegerlendir({ eGFR: null, acr: 50 }).tamamMi, false)
    assert.equal(kbhRiskDegerlendir({ eGFR: 300, acr: 50 }).tamamMi, false)
  })
})
