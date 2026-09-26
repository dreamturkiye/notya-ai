/**
 * ANESTEZI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, tanı yok, cerrahi sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')

describe('anestezi araçlar UI kilitleri', () => {
  it('kabuk branş kapısı + cerrahi sızıntısı yok', () => {
    const kabuk = oku('specialties/anestezi/ui/araclar/AnesteziAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun/)
    assert.match(kabuk, /Bu araç yalnızca anestezi için\./)
    assert.doesNotMatch(kabuk, /gc-preop|gogus-cerrahi-preop|bc-postop/)
  })
  it('ASA / ağrı doz dilini reddeder', () => {
    const asa = oku('specialties/anestezi/ui/araclar/AnesteziAsaAraci.tsx')
    const agri = oku('specialties/anestezi/ui/araclar/AnesteziAgriAraci.tsx')
    assert.match(asa, /ameliyathane anestezi makinesi HIS|ilaç dozu/)
    assert.match(agri, /analjezik mg|mg doz/)
    assert.doesNotMatch(asa + agri, /gc-preop|CAT\/mMRC/)
  })
})
