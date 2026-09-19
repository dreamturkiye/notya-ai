import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { acilTara, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, hekimOnayiGerekliMi } from '../engines/acil'
import fs from 'node:fs'
import path from 'node:path'

describe('GOGUS-EXCEPTIONAL-01 acil kapısı', () => {
  it('flags masif hemoptizi and hypoxia as hemen', () => {
    const a = acilTara(['Bol miktarda kanlı balgam çıkarıyorum'])
    assert.ok(a.some((x) => x.kod === 'masif_hemoptizi' && x.oncelik === 'hemen'))
    const b = acilTara(['Nefes alamıyorum, dudaklarım mor'])
    assert.ok(b.some((x) => x.kod === 'hipoksi_solunum'))
  })

  it('intake labels lock to engine options', () => {
    const kok = path.join(import.meta.dirname, '../../..')
    const brans = fs.readFileSync(path.join(kok, 'lib/intake/bransSorulari.ts'), 'utf8')
    for (const s of INTAKE_ACIL_SECENEKLERI) {
      assert.match(brans, new RegExp(s.etiket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
    assert.deepEqual(intakeAcilKodlari(['Bol miktarda kanlı balgam', 'Yok']), ['masif_hemoptizi'])
  })

  it('hekim onayı required for hemen flags', () => {
    assert.equal(hekimOnayiGerekliMi(acilTara([], ['masif_hemoptizi'])), true)
    assert.equal(hekimOnayiGerekliMi([]), false)
  })

  it('never invents thoracic surgery / OR language', () => {
    for (const b of acilTara(['Ani tek taraflı göğüs ağrısı ile nefes darlığı'])) {
      assert.doesNotMatch(b.eylem, /lobektomi|VATS|ameliyathane planla/i)
    }
  })
})
