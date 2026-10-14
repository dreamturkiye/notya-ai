import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { akiEvreDegerlendir } from '@/specialties/uroloji/engines/kdigoAki'

describe('UROLOJI-KDIGO-AKI-01 obstrüktif AKI evrelemesi (karar desteği, tanı değil)', () => {
  const temelHasta = { yas: 70, krea: null, kreaBazal: null, kreaArtis48Saat: null, idrarMlKgSaat: null, idrarSuresiSaat: null, anuriSuresiSaat: null, rrtBaslandi: false }

  it('KDIGO 2012 Table 2 creatinine-fold boundaries: evre1/2/3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 2.6, kreaBazal: 1.2 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, krea: 4.0, kreaBazal: 1.2 }).evre, 'evre3')
  })

  it('absolute 48h rise ≥0.3 mg/dL triggers evre1 even without a known fold-baseline', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, kreaArtis48Saat: 0.4 }).evre, 'evre1')
  })

  it('RRT initiation alone is evre3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, rrtBaslandi: true }).evre, 'evre3')
  })

  it('anuria is common in obstruction — ≥12h alone is evre3', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, anuriSuresiSaat: 12 }).evre, 'evre3')
  })

  it('urine-output criteria across stages', () => {
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 8 }).evre, 'evre1')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.4, idrarSuresiSaat: 14 }).evre, 'evre2')
    assert.equal(akiEvreDegerlendir({ ...temelHasta, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 }).evre, 'evre3')
  })

  it('KDIGO worse-stage rule (p.21): whichever of creatinine/urine-output gives the higher stage wins', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2, idrarMlKgSaat: 0.2, idrarSuresiSaat: 26 })
    assert.equal(s.kreaEvre, 'evre1')
    assert.equal(s.idrarEvre, 'evre3')
    assert.equal(s.evre, 'evre3')
    assert.ok(s.uyarilar.includes('kreatinin_idrar_farkli_evre'))
  })

  it('pediatric patient is refused — adult-only tool', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, yas: 12, krea: 1, kreaBazal: 0.4 })
    assert.equal(s.tamamMi, false)
    assert.ok(s.uyarilar.includes('pediatrik_disi'))
  })

  it('no data → no stage, not a guessed evre1', () => {
    assert.equal(akiEvreDegerlendir(temelHasta).tamamMi, false)
  })

  it('wording is decision-support, no colour, no invented nefrostomi/stent order', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /yesil|sari|turuncu|kirmizi|green|yellow|orange|red/i)
  })

  it('is independent from the uroloji PSA/IPSS engines and from the CKD eGFR/ACR tools', () => {
    const s = akiEvreDegerlendir({ ...temelHasta, krea: 1.8, kreaBazal: 1.2 })
    assert.ok(!('eGFR' in (s as unknown as Record<string, unknown>)))
    assert.ok(!('tiyer' in (s as unknown as Record<string, unknown>)))
  })
})
