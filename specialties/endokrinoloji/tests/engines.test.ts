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
