/**
 * Obstetrik USG protocol helpers. Images live in the core imaging blob (JPEG/DICOM handle).
 * Never auto-delete. KVKK fetal-image consent is a required flag on each study.
 */
export type FetusLabel = 'A' | 'B'

export type UsgModality = 'tvusg' | 'tas' | 'nt' | 'ayrintili' | 'growth' | 'doppler' | '3d4d'

export type UsgMeasurements = {
  CRL?: number
  BPD?: number
  HC?: number
  AC?: number
  FL?: number
  EFW?: number
  NT?: number
  AFI?: number
  cervix_mm?: number
  PI?: number
  RI?: number
}

export type UsgReportTemplate = 't1_nt' | 'detailed' | 'growth' | 'doppler' | '3d4d_non_diagnostic'

export type UsgStudy = {
  id: string
  blob_handle: string
  mime: 'image/jpeg' | 'application/dicom'
  ga_weeks: number
  ga_days: number
  dating_method: 'sat' | 'crl'
  fetus: FetusLabel
  modality: UsgModality
  measurements: UsgMeasurements
  non_diagnostic: boolean
  kvkk_fetal_image_consent: boolean
  report_template: UsgReportTemplate
}

export const LOW_RISK_USG_SET = [
  { id: 'early_tvusg', label: 'Erken TVUSG sac/yolk/FKA, ektopik dışla' },
  { id: 'nt_11_14', label: '11–14 CRL+NT' },
  { id: 'anomaly_18_22', label: '18–22 anomali' },
  { id: 't3_growth', label: '3. trimester büyüme / prezentasyon / AFI / plasenta' },
] as const

export function markSouvenir3d4d(
  study: Omit<UsgStudy, 'non_diagnostic' | 'report_template' | 'modality'>,
): UsgStudy {
  return {
    ...study,
    modality: '3d4d',
    non_diagnostic: true,
    report_template: '3d4d_non_diagnostic',
  }
}

export function galleryKey(study: Pick<UsgStudy, 'ga_weeks' | 'ga_days' | 'dating_method' | 'fetus'>): string {
  return `${study.fetus}|${study.dating_method}|${study.ga_weeks}+${study.ga_days}`
}

export function groupGallery(studies: UsgStudy[]): Record<string, UsgStudy[]> {
  const out: Record<string, UsgStudy[]> = {}
  for (const s of studies) {
    const k = galleryKey(s)
    ;(out[k] ??= []).push(s)
  }
  return out
}

/** Doppler is not routine — IUGR, PE, Rh, monochorionic twins, anemia suspicion only. */
export function dopplerIndicated(flags: {
  iugr?: boolean
  pe?: boolean
  rh_isoimmunization?: boolean
  monochorionic?: boolean
  anemia_suspicion?: boolean
}): boolean {
  return Boolean(flags.iugr || flags.pe || flags.rh_isoimmunization || flags.monochorionic || flags.anemia_suspicion)
}

export const USG_NEVER_AUTO_DELETE = true
