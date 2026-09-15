/**
 * Map core hasta_goruntulemeler rows into a dermatology specialty payload.
 * PASI / Fitzpatrick / dermoscopy stay here — never on core patient/visit types.
 * Photos are coreImageId only.
 */
import { dermatolojiPayloadSchema, type DermatolojiPayload, type PhotoAsset } from '../../specialties/dermatoloji/schema'

export type LiveGoruntuRow = {
  id: string
  modalite?: string | null
  vucut_bolgesi?: string | null
  goruntuleme_tarihi?: string | null
  created_at?: string | null
}

function photoKind(modalite: string | null | undefined): PhotoAsset['kind'] {
  const m = (modalite || '').toLowerCase()
  if (m.includes('derm')) return 'dermoskopi_polarize'
  if (m === 'us') return 'klinik_yakin'
  return 'klinik_genel'
}

export function payloadFromGoruntuleme(patientId: string, rows: LiveGoruntuRow[]): DermatolojiPayload {
  const photos: PhotoAsset[] = rows.map((r) => ({
    id: r.id,
    coreImageId: r.id,
    kind: photoKind(r.modalite),
    lesionId: null,
    capturedAt: (r.goruntuleme_tarihi || r.created_at || '1970-01-01').slice(0, 10),
    region: r.vucut_bolgesi || 'unspecified',
    genital_consent: false,
    pediatric_consent: false,
    education_anonymized: false,
    patient_share: false,
  }))
  const raw = {
    specialty: 'dermatoloji' as const,
    episode_id: `derm-${patientId}`,
    patient_id: patientId,
    visit_type: 'genel-poliklinik' as const,
    unit: 'genel' as const,
    patient_derm: {
      fitzpatrick: 'III' as const,
      occupation: '',
      phototype: 'III' as const,
      atopic: false,
      family_atopy: false,
    },
    lesions: photos.length
      ? photos.map((p, i) => ({
          id: `L${i + 1}`,
          region: p.region,
          morphology: 'unspecified',
        }))
      : [],
    photos,
    image_series: [],
    before_after: [],
    vision_reads: [],
    total_body_map: null,
    bedside_tests: [],
    patch_courses: [],
    hair_workup: null,
    bullous_workup: null,
    behcet_card: null,
    admission: null,
  }
  const parsed = dermatolojiPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('dermatoloji live payload failed schema')
  }
  return parsed.data
}
