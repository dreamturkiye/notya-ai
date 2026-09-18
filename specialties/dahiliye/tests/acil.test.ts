import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { BRANS_SORULARI } from '@/lib/intake/bransSorulari'
import {
  acilTara, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, HASTA_ACIL_METNI,
} from '../engines/acil'

const kok = path.join(import.meta.dirname, '../../..')

describe('DAH-EXCEPTIONAL-01 intake acil', () => {
  it('intake labels match INTAKE_ACIL_SECENEKLERI exactly', () => {
    const alan = BRANS_SORULARI.dahiliye.alanlar.find((a) => a.id === 'acilBelirtilerDahiliye')
    assert.ok(alan && alan.tur === 'checkbox-grup')
    const sec = (alan.secenekler || []).filter((s) => s !== 'Yok')
    assert.deepEqual(sec, INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
  })

  it('foreign branşlar do not get acilBelirtilerDahiliye', () => {
    for (const b of ['goz-hastaliklari', 'dermatoloji', 'pediatri', 'kadin-hastaliklari-dogum', 'kardiyoloji'] as const) {
      const ids = (BRANS_SORULARI[b]?.alanlar || []).map((a) => a.id)
      assert.ok(!ids.includes('acilBelirtilerDahiliye'), b)
    }
  })

  it('intakeAcilKodlari maps labels → codes', () => {
    const kodlar = intakeAcilKodlari(['Göğüs ağrısı veya baskı', 'Yok', 'Bayılma / bilinç kaybı'])
    assert.deepEqual(kodlar.sort(), ['bayilma', 'gogus_agrisi'].sort())
  })

  it('acilTara finds göğüs ağrısı as hemen', () => {
    const b = acilTara(['Göğüs ağrısı var, baskı gibi'])
    assert.ok(b.some((x) => x.kod === 'gogus_agrisi' && x.oncelik === 'hemen'))
  })

  it('hasta acil metni has 112, no diagnosis words', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /tanı|ICD|SCORE2/i)
  })

  it('engine file is pure (no fetch / supabase)', () => {
    const src = fs.readFileSync(path.join(kok, 'specialties/dahiliye/engines/acil.ts'), 'utf8')
    assert.doesNotMatch(src, /fetch\(|createClient|supabase/i)
  })
})
