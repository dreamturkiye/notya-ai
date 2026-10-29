import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BURADAYIM_SOZU, duraklamaKarari } from './duraklama'

// NOTYA-SES-ESKI-02
describe('duraklamaKarari', () => {
  it('the default and Fish keep the silent route', () => {
    assert.equal(duraklamaKarari(undefined, false), 'sessiz')
    assert.equal(duraklamaKarari('fish', false), 'sessiz')
    assert.equal(duraklamaKarari('fish', true), 'sessiz')
  })
  it('SES-OMURGA-V2: ElevenLabs no longer sends a pause to the model (skip_turn on the route)', () => {
    assert.equal(duraklamaKarari('elevenlabs', false), 'sessiz') // SES-OMURGA-V2: a pause never reaches the model
  })
  it('ElevenLabs right after a calendar answer gets the fixed line, never the model', () => {
    assert.equal(duraklamaKarari('elevenlabs', true), 'buradayim')
    assert.equal(BURADAYIM_SOZU, 'Buradayım Hocam.')
  })
})
describe('the ElevenLabs route and the brain are wired to it', () => {
  const oku = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
  it('the Custom LLM route tells the brain the provider', () => {
    assert.ok(/kanal: \'ses\', saglayici: \'elevenlabs\'/.test(oku('lib/asistan/sesLlm.ts')))
  })
  it('the brain asks the decision before it swallows a pause', () => {
    assert.ok(/duraklamaKarari\(g\.saglayici/.test(oku('lib/asistan/ayseCevapla.ts')))
  })
})
