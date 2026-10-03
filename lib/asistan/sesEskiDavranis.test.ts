import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// NOTYA-SES-ESKI-01 (Kaan, 2026-10-02): Ayse on ElevenLabs behaves as before the Fish work. Two Fish-era additions made new problems there.
const oku = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
describe('ElevenLabs path keeps its pre-Fish behaviour', () => {
  it('a pause transcript is not answered with a bare period (it goes to the model, as before)', () => {
    const s = oku('lib/asistan/sesLlm.ts')
    assert.ok(!/mesaj && sesGurultusuMu\(mesaj\)/.test(s))
  })
  it('the screen poll adds the doctor line only on the Fish path (one source of the doctor bubble on ElevenLabs)', () => {
    const s = oku('components/asistan/AsistanOturumContext.tsx')
    assert.ok(/const soru = fishAcikRef\.current && hamSoru/.test(s))
  })
})
