/**
 * Canonical imaging / PACS modalities for hasta_goruntulemeler + Sağlığım filters.
 * UI may send display labels; we always persist the canonical `code`.
 */

export type ImagingModalityCode =
  | 'xray'
  | 'mri'
  | 'bt'
  | 'us'
  | 'pet'
  | 'ekg'
  | 'eko'
  | 'mamografi'
  | 'diger'

export type ImagingPortalKind = 'goruntuleme' | 'ekg' | 'diger'

export type ImagingModality = {
  code: ImagingModalityCode
  /** Doctor upload chip / stored display when needed */
  label: string
  /** Short Turkish label for patient portal */
  patientLabel: string
  portalKind: ImagingPortalKind
  color: string
}

/** Popular PACS-style modalities used in Turkish outpatient practice. */
export const IMAGING_MODALITIES: ImagingModality[] = [
  { code: 'xray', label: 'X-Ray', patientLabel: 'Röntgen', portalKind: 'goruntuleme', color: '#3b82f6' },
  { code: 'mri', label: 'MRI', patientLabel: 'MR', portalKind: 'goruntuleme', color: '#a855f7' },
  { code: 'bt', label: 'BT', patientLabel: 'BT (Tomografi)', portalKind: 'goruntuleme', color: '#f59e0b' },
  { code: 'us', label: 'Ultrason', patientLabel: 'Ultrason', portalKind: 'goruntuleme', color: '#22c55e' },
  { code: 'eko', label: 'EKO', patientLabel: 'EKO', portalKind: 'goruntuleme', color: '#0d9488' },
  { code: 'pet', label: 'PET-BT', patientLabel: 'PET-BT', portalKind: 'goruntuleme', color: '#64748b' },
  { code: 'ekg', label: 'EKG', patientLabel: 'EKG', portalKind: 'ekg', color: '#ef4444' },
  { code: 'mamografi', label: 'Mamografi', patientLabel: 'Mamografi', portalKind: 'goruntuleme', color: '#ec4899' },
  { code: 'diger', label: 'Diğer', patientLabel: 'Diğer görüntüleme', portalKind: 'diger', color: '#6b7280' },
]

const BY_CODE = new Map(IMAGING_MODALITIES.map((m) => [m.code, m]))

/** Map free-text / legacy UI labels → canonical code. */
export function normalizeImagingModality(raw: string | null | undefined): ImagingModalityCode {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  if (!t) return 'diger'

  if (/^(x-?ray|rontgen|röntgen|xr|grafi|pa\b)/.test(t) || t.includes('rontgen') || t.includes('xray')) {
    return 'xray'
  }
  if (/^(mri|mr\b|manyetik)/.test(t) || t.includes('mri')) return 'mri'
  if (/^(bt|ct|tomo)/.test(t) || t.includes('tomografi')) return 'bt'
  if (/^(us|usg|ultrason)/.test(t)) return 'us'
  if (/^(pet)/.test(t)) return 'pet'
  if (/^(ekg|ecg)/.test(t)) return 'ekg'
  if (/^(eko|echo|ekokardiy)/.test(t)) return 'eko'
  if (/^(mamografi|mammo)/.test(t)) return 'mamografi'
  if (BY_CODE.has(t as ImagingModalityCode)) return t as ImagingModalityCode
  return 'diger'
}

export function imagingModalityMeta(raw: string | null | undefined): ImagingModality {
  const code = normalizeImagingModality(raw)
  return BY_CODE.get(code) || IMAGING_MODALITIES[IMAGING_MODALITIES.length - 1]
}

export function imagingPortalKind(raw: string | null | undefined): ImagingPortalKind {
  return imagingModalityMeta(raw).portalKind
}

export function imagingDisplayLabel(raw: string | null | undefined, audience: 'doctor' | 'patient' = 'doctor'): string {
  const meta = imagingModalityMeta(raw)
  return audience === 'patient' ? meta.patientLabel : meta.label
}
