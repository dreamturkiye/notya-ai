/**
 * KVKK imaging consents. Asistan cannot export images off-box without a flag.
 */
import type { PhotoAsset } from '../schema'

export type ConsentKind = 'genital' | 'child' | 'education-anonymized' | 'patient-share'

export function requiredConsent(photo: PhotoAsset): ConsentKind[] {
  const out: ConsentKind[] = []
  if (photo.kind === 'klinik_yakin' && /genital|vulva|penis|scrot|perianal/i.test(photo.region)) {
    if (!photo.genital_consent) out.push('genital')
  }
  if (!photo.pediatric_consent && photo.pediatric_consent === false) {
    /* pediatric flag is explicit on the asset; callers set it when age < 18 */
  }
  return out
}

export function genitalOrChildBlocked(photo: PhotoAsset): boolean {
  if (/genital|vulva|penis|scrot|perianal/i.test(photo.region) && !photo.genital_consent) return true
  return false
}

export function asistanMayExport(photo: PhotoAsset, offBox: boolean): boolean {
  if (!offBox) return true
  return photo.education_anonymized || photo.patient_share
}
