import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { specialtyProfile } from '../../../lib/specialties/registry'
import { payloadFromGebelikApi } from '../../../lib/specialties/kadin-dogum-live'
import { payloadFromGoruntuleme } from '../../../lib/specialties/dermatoloji-live'
import { kadinDogumPayloadSchema } from '../schema'

describe('live chapter wiring', () => {
  it('registry serves kadin-dogum and dermatoloji chapters, not baseline', () => {
    const kd = specialtyProfile('kadin-hastaliklari-dogum')
    assert.equal(kd.olgunluk, 'arastirma')
    assert.ok(kd.sekmeler.some((s) => s.bilesen === 'HastaGebelik'))
    assert.ok(kd.sekmeler.some((s) => s.bilesen === 'GebeKarti'))
    assert.ok(kd.ekKaynaklar.some((k) => k.includes('ACOG')))

    const derm = specialtyProfile('dermatoloji')
    assert.notEqual(derm.olgunluk, 'baseline')
    assert.ok(derm.sekmeler.some((s) => s.bilesen === 'HastaDermatoloji'))
    assert.ok(derm.goruntu?.modaliteler.includes('dermatoskopi'))
  })

  it('gebelik API adapter keeps SAT on the specialty payload', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-1',
        sat: '2026-01-15',
        tdt: '2026-10-22',
        tdt_kaynak: 'sat',
        gravida: 1,
        para: 0,
        abortus: 0,
        yasayan: 0,
        rh_negatif: false,
        durum: 'aktif',
        dogum_tarihi: null,
      },
      yas: { hafta: 12, gun: 0 },
    })
    assert.ok(payload)
    assert.equal(payload?.sat, '2026-01-15')
    assert.equal(payload?.specialty, 'kadin-dogum')
    assert.equal(kadinDogumPayloadSchema.safeParse(payload).success, true)
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'child_patient_id'), false)
  })

  it('görüntüleme adapter stores coreImageId only', () => {
    const payload = payloadFromGoruntuleme('p-deri', [
      { id: 'img-1', modalite: 'diger', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-09-01' },
    ])
    assert.equal(payload.specialty, 'dermatoloji')
    assert.equal(payload.photos[0]?.coreImageId, 'img-1')
    assert.equal(payload.lesions.length, 1)
  })
})
