import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, INTAKE_ACIL_SECENEKLERI, HASTA_ACIL_METNI,
} from '@/specialties/spor-hekimligi/engines/acil'
import fs from 'node:fs'
import path from 'node:path'

describe('SPOR-HEKIMLIGI-EXCEPTIONAL-01 güvenlik / acil kapısı', () => {
  it('detects concussion red flags and exercise chest pain', () => {
    const a = acilTara(['Baş darbesi sonrası kusma ve çift görme'])
    assert.ok(a.some((x) => x.kod === 'konkusyon_kirmizi'))
    assert.equal(hekimOnayiGerekliMi(a), true)
    const b = acilTara(['Antrenmanda göğüs ağrısı'])
    assert.ok(b.some((x) => x.kod === 'egzersiz_gogus'))
  })

  it('intake labels match engine 1:1', () => {
    const intake = fs.readFileSync(path.join(process.cwd(), 'lib/intake/bransSorulari.ts'), 'utf8')
    const blok = intake.slice(intake.indexOf("'spor-hekimligi'"), intake.indexOf("'spor-hekimligi'") + 2500)
    for (const s of INTAKE_ACIL_SECENEKLERI) {
      assert.ok(blok.includes(s.etiket), s.etiket)
    }
  })

  it('patient emergency copy points to 112', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /doz|\bmg\b|doping/i)
  })
})
