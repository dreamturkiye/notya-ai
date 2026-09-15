import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  dermatolojiPayloadSchema,
  pediatriProbeSchema,
  kadinDogumProbeSchema,
} from '../schema'
import { kadinDogumPayloadSchema } from '../../kadin-dogum/schema'
import { validDerm } from './helpers'

describe('schema isolation', () => {
  it('accepts a dermatology episode payload', () => {
    const r = dermatolojiPayloadSchema.safeParse(validDerm())
    assert.equal(r.success, true)
  })

  it('photos store coreImageId only (no pixel fields on the schema)', () => {
    const r = dermatolojiPayloadSchema.safeParse(validDerm({
      photos: [{
        id: 'ph1',
        coreImageId: 'goruntu-abc',
        kind: 'klinik_yakin',
        lesionId: 'L1',
        capturedAt: '2026-03-01',
        region: 'extensor-elbow-L',
        genital_consent: false,
        pediatric_consent: false,
        education_anonymized: false,
        patient_share: false,
      }],
    }))
    assert.equal(r.success, true)
    if (r.success) {
      assert.equal('pixels' in r.data.photos[0], false)
      assert.equal('base64' in r.data.photos[0], false)
      assert.equal(r.data.photos[0].coreImageId, 'goruntu-abc')
    }
  })

  it('rejects a GİDR/M-CHAT shaped pediatrics payload', () => {
    const r = dermatolojiPayloadSchema.safeParse({
      specialty: 'pediatri',
      child_patient_id: 'p-cocuk',
      gidr_basamak: '1-3 ay',
      mchat_cevaplar: {},
    })
    assert.equal(r.success, false)
  })

  it('pediatrics probe schema rejects a derm payload', () => {
    assert.equal(pediatriProbeSchema.safeParse(validDerm()).success, false)
  })

  it('kadin-dogum schema rejects a derm payload (PASI/Fitzpatrick stay out)', () => {
    assert.equal(kadinDogumPayloadSchema.safeParse(validDerm()).success, false)
    assert.equal(kadinDogumProbeSchema.safeParse(validDerm()).success, false)
  })

  it('derm schema rejects a SAT/EDD kadin-dogum payload', () => {
    const r = dermatolojiPayloadSchema.safeParse({
      specialty: 'kadin-dogum',
      mother_patient_id: 'p-anne',
      sat: '2026-01-15',
      edd_naegele: '2026-10-22',
    })
    assert.equal(r.success, false)
  })
})
