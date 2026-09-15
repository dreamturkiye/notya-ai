/**
 * Infantile hemangioma / diaper-infant eczema photo handoff types.
 * Do not edit specialties/pediatri.
 */
export type DermPediatriHandoff = {
  source: 'derm-pediatri'
  kind: 'infantile_hemangioma' | 'diaper_infant_eczema'
  child_patient_id: string
  photoCoreImageIds: string[]
  pediatric_consent: boolean
  notes: string
}

export function draftDermPediatriHandoff(input: Omit<DermPediatriHandoff, 'source'>): DermPediatriHandoff {
  return { source: 'derm-pediatri', ...input }
}
