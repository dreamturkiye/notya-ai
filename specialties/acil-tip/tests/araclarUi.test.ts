/**
 * ACIL-TIP-EXCEPTIONAL-01 — Araçlar SSR: doz yok, tanı yok, kardiyoloji/nöroloji sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')

describe('acil-tip araçlar UI kilitleri', () => {
  it('kabuk branş kapısı + kardiyoloji/nöroloji sızıntısı yok', () => {
    const kabuk = oku('specialties/acil-tip/ui/araclar/AtAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun/)
    assert.match(kabuk, /Bu araç yalnızca acil tıp için\./)
    assert.doesNotMatch(kabuk, /kardio-score|noro-migren|noro-inme/)
  })
  it('ESI / kritik yol bed board ve doz dilini reddeder', () => {
    const esi = oku('specialties/acil-tip/ui/araclar/AtEsiAraci.tsx')
    const kritik = oku('specialties/acil-tip/ui/araclar/AtKritikYolAraci.tsx')
    assert.match(esi, /bed board|HIS|tanı/)
    assert.match(kritik, /tanı kilidi|doz/)
    assert.doesNotMatch(esi + kritik, /kardio-score|SCORE2|MIDAS/)
  })
})
