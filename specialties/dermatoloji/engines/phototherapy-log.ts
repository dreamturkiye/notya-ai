/**
 * Phototherapy log. NO solarium modality (ban 2018).
 * NB-UVB 311, BB-UVB, PUVA oral/bath, local PUVA, excimer 308, UVA1, MED test.
 */
export const PHOTO_DEVICES = [
  'nb-uvb-311',
  'bb-uvb',
  'puva-oral',
  'puva-bath',
  'local-puva',
  'excimer-308',
  'uva1',
] as const

export type PhotoDevice = (typeof PHOTO_DEVICES)[number]

export type PhotoSession = {
  date: string
  device: PhotoDevice
  j_cm2: number
  med_test?: boolean
  burn?: boolean
  sessionPhotoCoreImageId?: string
}

export function cumulativeJ(sessions: PhotoSession[], device?: PhotoDevice): number {
  const sum = sessions
    .filter((s) => device == null || s.device === device)
    .reduce((acc, s) => acc + s.j_cm2, 0)
  return Math.round(sum * 100) / 100
}

export function annualTbseDue(lastTbseIso: string | null, todayIso: string): boolean {
  if (!lastTbseIso) return true
  const last = Date.parse(lastTbseIso + 'T00:00:00Z')
  const today = Date.parse(todayIso + 'T00:00:00Z')
  return (today - last) / (365 * 86_400_000) >= 1
}

export const SOLARIUM_FORBIDDEN = true
