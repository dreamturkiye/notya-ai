import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  kadinDogumPayloadSchema,
  pediatriProbeSchema,
  type KadinDogumPayload,
} from '../schema'

function validKd(over: Partial<KadinDogumPayload> = {}): KadinDogumPayload {
  return {
    specialty: 'kadin-dogum',
    episode_id: 'ep-1',
    mother_patient_id: 'p-anne',
    fetuses: [{ label: 'A', status: 'ongoing' }],
    obstetric_score: { G: 1, P: 0, A: 0, Y: 0, D: 0, E: 0, prior_cs_count: 0, prior_cs_incision: 'none' },
    sat: '2026-01-15',
    edd_naegele: '2026-10-22',
    edd_crl: null,
    ga_locked: 'sat',
    plurality: 'singleton',
    chorionicity: null,
    ttts: false,
    rh: 'D+',
    idc_history: 'not_tested',
    anti_d: [],
    risk_class: 'dusuk',
    episode_status: 'gebe',
    lohusa_day: null,
    ...over,
  }
}

function fixture(name: string) {
  return JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', name), 'utf8'))
}

describe('schema isolation', () => {
  it('accepts a Kadın-Doğum episode payload', () => {
    const r = kadinDogumPayloadSchema.safeParse(validKd())
    assert.equal(r.success, true)
  })

  it('accepts bundled fixtures', () => {
    for (const name of ['gebe-dusuk-risk.json', 'gebe-rh-negatif.json', 'lohusa.json']) {
      const r = kadinDogumPayloadSchema.safeParse(fixture(name))
      assert.equal(r.success, true, name)
    }
  })

  it('rejects a GİDR/M-CHAT shaped pediatrics payload', () => {
    const r = kadinDogumPayloadSchema.safeParse({
      specialty: 'pediatri',
      child_patient_id: 'p-cocuk',
      gidr_basamak: '1-3 ay',
      mchat_cevaplar: {},
    })
    assert.equal(r.success, false)
  })

  it('pediatrics probe schema rejects a KD payload (SAT/EDD/Anti-D stay out of pediatrics)', () => {
    const r = pediatriProbeSchema.safeParse(validKd())
    assert.equal(r.success, false)
  })

  it('closing lohusa keeps the same episode_id', () => {
    const gebe = fixture('gebe-dusuk-risk.json')
    const lohusa = fixture('lohusa.json')
    assert.equal(gebe.episode_id, lohusa.episode_id)
    const r = kadinDogumPayloadSchema.safeParse(lohusa)
    assert.equal(r.success, true)
  })
})
