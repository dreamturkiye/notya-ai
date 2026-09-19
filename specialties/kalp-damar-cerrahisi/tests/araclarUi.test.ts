/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Araç UI kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../../..', rel), 'utf8')

describe('kalp-damar-cerrahisi araçlar UI kilitleri', () => {
  it('kabuk branş guard + kardiyoloji yönlendirme', () => {
    const kabuk = oku('specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun/)
    assert.match(kabuk, /kalp damar cerrahisi/i)
  })
  it('preop/antikoag: uydurma doz şeması yok; yasak uyarıları serbest', () => {
    const preop = oku('specialties/kalp-damar-cerrahisi/ui/araclar/KdcPreopAraci.tsx')
    const ak = oku('specialties/kalp-damar-cerrahisi/ui/araclar/KdcAntikoagAraci.tsx')
    assert.doesNotMatch(preop, /\b\d+\s*mg\b|doz şeması/)
    assert.match(preop, /SCORE2 yok|doz \/ SCORE2/)
    assert.match(ak, /yazılmaz/)
    assert.doesNotMatch(ak, /warfarin\s*\d+|5\s*mg\s*bid|doz şeması:/)
  })
})
