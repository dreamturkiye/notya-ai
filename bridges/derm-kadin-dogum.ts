/**
 * GÖP isotretinoin/acitretin, pregnancy psoriasis/AD, pemphigoid gestationis.
 * Do not edit specialties/kadin-dogum.
 */
export type DermKadinDogumHandoff = {
  source: 'derm-kadin-dogum'
  kind: 'gop_isotretinoin' | 'acitretin_ban' | 'pregnancy_psoriasis_ad' | 'pemphigoid_gestationis'
  mother_patient_id: string
  episode_id?: string
  notes: string
}

export function draftDermKdHandoff(input: Omit<DermKadinDogumHandoff, 'source'>): DermKadinDogumHandoff {
  return { source: 'derm-kadin-dogum', ...input }
}
