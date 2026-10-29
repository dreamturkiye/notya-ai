/**
 * AU-DIETETICS-ADIME-01 — Clinical Dietitian note uses ADIME section titles and PES fields.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_ARAYUZ } from '../arayuz'
import { alanAdi, bolumAdi, sablonAlanlari } from '@/lib/ulke/arayuz/notSablonu'
import { auSoapKilidi } from './soapKilitleri'

describe('AU dietetics ADIME note template', () => {
  const v = AU_ARAYUZ.notSablonlari
  const roller = AU_ARAYUZ.roller
  /** AU guardian age — used only so sablonAlanlari can run; adult path needs no patient. */
  const veliYasi = 16

  it('dietetics section headings are ADIME-shaped, not plain SOAP for allied', () => {
    assert.equal(bolumAdi(v, roller, 'dietetics', 's', 'en-AU'), 'A — Assessment (history)')
    assert.equal(bolumAdi(v, roller, 'dietetics', 'o', 'en-AU'), 'A — Assessment (measures)')
    assert.equal(bolumAdi(v, roller, 'dietetics', 'a', 'en-AU'), 'D — Nutrition diagnosis')
    assert.equal(bolumAdi(v, roller, 'dietetics', 'p', 'en-AU'), 'I / M-E — Intervention & monitoring')
  })

  it('physiotherapy does not receive dietetics ADIME titles', () => {
    // Allied roles share a "Professional assessment" heading on A only; S/O/P fall back to the catalogue.
    assert.notEqual(bolumAdi(v, roller, 'physiotherapy', 'a', 'en-AU'), 'D — Nutrition diagnosis')
    assert.notEqual(bolumAdi(v, roller, 'physiotherapy', 's', 'en-AU'), 'A — Assessment (history)')
    assert.equal(bolumAdi(v, roller, 'physiotherapy', 'a', 'en-AU'), 'Professional assessment')
  })

  it('dietetics fields include PES diagnosis, intervention and monitoring prompts', () => {
    const keys = sablonAlanlari(v, roller, veliYasi, 'dietetics')
    assert.ok(keys.includes('nutrition_diagnosis'))
    assert.ok(keys.includes('nutrition_intervention'))
    assert.ok(keys.includes('monitoring_evaluation'))
    assert.ok(keys.includes('diet_history'))
    const tani = alanAdi(v, 'nutrition_diagnosis', 'en-AU')
    assert.ok(tani)
    assert.match(tani!, /PES|problem.*etiology|signs\/symptoms/i)
  })

  it('soap lock names ADIME sections for dietetics only', () => {
    const k = auSoapKilidi('dietetics')!
    assert.match(k, /ADIME Assessment/)
    assert.match(k, /Nutrition Diagnosis/)
    assert.match(k, /Intervention and Monitoring/)
    assert.doesNotMatch(auSoapKilidi('physiotherapy')!, /ADIME/)
  })
})
