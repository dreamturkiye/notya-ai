/**
 * Fetal image + NIPT/karyotype require separate KVKK consents.
 * Never auto-delete.
 */
import type { UsgStudyPayload } from '../schema'

export function fetalImageBlocked(study: UsgStudyPayload): boolean {
  return !study.kvkk_fetal_image_consent
}

export function niptKaryotypeBlocked(study: UsgStudyPayload): boolean {
  return study.kvkk_nipt_karyotype_consent !== true
}

export function asistanMayExport(study: UsgStudyPayload, offBox: boolean): boolean {
  if (!offBox) return true
  return study.kvkk_fetal_image_consent && study.kvkk_nipt_karyotype_consent === true
}
