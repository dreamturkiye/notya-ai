import type { EvalResult } from './eval'
import { PHOTO_DEVICES } from '../engines/phototherapy-log'

export function evaluatePhototherapy(device: string): EvalResult {
  const allowed = (PHOTO_DEVICES as readonly string[]).includes(device)
  return {
    triage: allowed ? 'routine' : 'urgent',
    next: allowed
      ? ['indication report', 'MED test', 'J/cm2 log', 'annual TBSE']
      : ['solarium forbidden (2018)', 'choose NB-UVB/PUVA/excimer/UVA1'],
    citations: ['sut-2026', 'solaryum-2018'],
    photoPlan: ['optional session photo'],
  }
}
