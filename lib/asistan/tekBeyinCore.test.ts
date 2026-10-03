/**
 * NOTYA-TEK-BEYIN-CORE-01 — Pediatri Ayşe's thin-mouth + strong-brain setup is core for all 30
 * doktor specialties and all klinik experts (same three Custom-LLM agent copies).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PERSONAS, PERSONA_ORDER, SPECIALIST_TOTAL } from './personaEngine'
import { TEK_BEYIN_AJANLARI } from './tekBeyinAjanlari'
import { tabanAgentSec, klinikTabanAgentSec, klinikPersonaJeton, klinikSlugJetonndan } from './agentSec'
import { KlinikUzmanPersonas } from '@/lib/ai/personas/klinik_uzmanlar'
import { tekBeyinAcikMi } from './sesJetonu'
import { klinikSesSistemPromptu } from './klinikCevapla'

describe('NOTYA-TEK-BEYIN-CORE-01 — all specialties share Pediatri Ayşe mouth+brain path', () => {
  it('catalog still has 30 doktor specialists', () => {
    assert.equal(SPECIALIST_TOTAL, 30)
    assert.equal(PERSONA_ORDER.length, 30)
  })

  it('every doktor persona maps to a base agent that has a Custom-LLM copy', () => {
    const eksik: string[] = []
    for (const id of PERSONA_ORDER) {
      const p = PERSONAS[id]
      const taban = tabanAgentSec(p)
      if (!TEK_BEYIN_AJANLARI[taban]) eksik.push(`${id} → ${taban}`)
    }
    assert.deepEqual(eksik, [], `missing TEK_BEYIN copy: ${eksik.join(', ')}`)
  })

  it('every klinik expert maps to a base agent with a Custom-LLM copy + jeton slug round-trip', () => {
    const slugs = Object.keys(KlinikUzmanPersonas)
    assert.ok(slugs.length >= 10, `expected ≥10 klinik experts, got ${slugs.length}`)
    for (const slug of slugs) {
      const p = KlinikUzmanPersonas[slug]
      const taban = klinikTabanAgentSec(p.gender)
      assert.ok(TEK_BEYIN_AJANLARI[taban], `${slug} → ${taban}`)
      assert.ok(klinikSesSistemPromptu(slug))
      const pe = klinikPersonaJeton(slug)
      assert.equal(klinikSlugJetonndan(pe), slug)
    }
  })

  it('tek-beyin is ON for every doctor id by default (core)', () => {
    assert.equal(tekBeyinAcikMi('any-doctor-uuid'), true)
    assert.equal(tekBeyinAcikMi('any-doctor-uuid', 'off'), false)
  })
})
