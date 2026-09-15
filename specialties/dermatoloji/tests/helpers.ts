import type { DermatolojiPayload } from '../schema'

export function validDerm(over: Partial<DermatolojiPayload> = {}): DermatolojiPayload {
  return {
    specialty: 'dermatoloji',
    episode_id: 'ep-derm-1',
    patient_id: 'p-deri-1',
    visit_type: 'genel-poliklinik',
    unit: 'genel',
    patient_derm: {
      fitzpatrick: 'III',
      occupation: 'öğretmen',
      phototype: 'III',
      atopic: false,
      family_atopy: false,
    },
    lesions: [{ id: 'L1', region: 'extensor-elbow-L', morphology: 'plaque' }],
    photos: [],
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
    ...over,
  }
}
