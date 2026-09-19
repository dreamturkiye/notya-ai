import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, HASTA_ACIL_METNI,
} from '../engines/acil'

describe('ORTOPEDI-EXCEPTIONAL-01 kırmızı bayrak kapısı', () => {
  it('kompartman / NV / açık kırık yakalar', () => {
    const b = acilTara(['alçı çok sıkı, dayanılmaz ağrı ve şişlik'])
    assert.ok(b.some((x) => x.kod === 'kompartman'))
    assert.equal(hekimOnayiGerekliMi(b), true)
  })

  it('intake etiketleri INTAKE_ACIL_SECENEKLERI ile 1:1', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, INTAKE_ACIL_SECENEKLERI.length)
  })

  it('hasta acil metni 112 içerir, tanı dili yok', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /artroz|kaynama|tanı/i)
  })
})
