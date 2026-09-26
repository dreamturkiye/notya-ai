/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Araçlar SSR: AED doz yok, tanı yok, noroloji sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')

describe('beyin-cerrahisi araçlar UI kilitleri', () => {
  it('kabuk branş kapısı + noroloji sızıntısı yok', () => {
    const kabuk = oku('specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun/)
    assert.match(kabuk, /Bu araç yalnızca beyin cerrahisi için\./)
    assert.doesNotMatch(kabuk, /noro-migren|noro-inme|MIDAS/)
  })
  it('post-op / bilinç AED doz dilini reddeder', () => {
    const postop = oku('specialties/beyin-cerrahisi/ui/araclar/BcPostopAraci.tsx')
    const bilinc = oku('specialties/beyin-cerrahisi/ui/araclar/BcBilincAraci.tsx')
    assert.match(postop, /AED doz|ameliyathane\/HIS/)
    assert.match(bilinc, /AED doz|mg/)
    assert.doesNotMatch(postop + bilinc, /noro-migren|İnme \/ TIA/)
  })
})
