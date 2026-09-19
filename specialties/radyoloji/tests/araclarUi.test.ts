/**
 * RADYOLOJI-EXCEPTIONAL-01 — Araçlar SSR: AI tanı yok, PACS yok, yabancı branş sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')

describe('radyoloji araçlar UI kilitleri', () => {
  it('kabuk branş kapısı + yabancı branş sızıntısı yok', () => {
    const kabuk = oku('specialties/radyoloji/ui/araclar/RadyoAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun/)
    assert.match(kabuk, /Bu araç yalnızca radyoloji için\./)
    assert.doesNotMatch(kabuk, /dahiliye-score2|onko-|gogus-cat/)
  })
  it('rapor / kritik AI tanı dilini reddeder', () => {
    const rapor = oku('specialties/radyoloji/ui/araclar/RadyoRaporAraci.tsx')
    const kritik = oku('specialties/radyoloji/ui/araclar/RadyoKritikAraci.tsx')
    assert.match(rapor, /otomatik tanı|AI|BI-RADS/)
    assert.match(kritik, /AI tanı|uydurma/)
    assert.doesNotMatch(rapor + kritik, /PACS sunucu|DICOM HIS/)
  })
})
