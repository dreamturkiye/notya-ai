/**
 * Clinic units. Default genel-kd. Switching unit changes checklist and SOAP template.
 * Not separate apps.
 */
import type { ClinicUnit, VisitType } from '../types'

export type UnitProfile = {
  id: ClinicUnit
  label: string
  defaultVisitType: VisitType
  soapTemplate: 'gebe' | 'jinekoloji' | 'usg' | 'nst' | 'travay' | 'vision' | 'okul'
  checklist: string[]
}

export const CLINIC_UNIT_PROFILES: UnitProfile[] = [
  { id: 'genel-kd', label: 'Genel KD poliklinik', defaultVisitType: 'gebe', soapTemplate: 'gebe', checklist: ['SAT', 'GA', 'BP', 'SF', 'FHR', 'pencere', 'USG ids'] },
  { id: 'perinatoloji', label: 'Perinatoloji', defaultVisitType: 'perinatoloji-sevk', soapTemplate: 'usg', checklist: ['Doppler', 'EFW', 'sevk nedeni'] },
  { id: 'infertilite', label: 'İnfertilite / REI', defaultVisitType: 'infertilite', soapTemplate: 'jinekoloji', checklist: ['LMP', 'AMH', 'HSG', 'semen'] },
  { id: 'kolposkopi', label: 'Kolposkopi', defaultVisitType: 'kolposkopi', soapTemplate: 'jinekoloji', checklist: ['HPV', 'image archive', 'ASCCP-like TR pathway'] },
  { id: 'urojinekoloji', label: 'Ürojinekoloji', defaultVisitType: 'jinekoloji', soapTemplate: 'jinekoloji', checklist: ['POP-Q', 'incontinence'] },
  { id: 'jineonkoloji', label: 'Jineonkoloji', defaultVisitType: 'jinekoloji', soapTemplate: 'jinekoloji', checklist: ['CA-125', 'IOTA', 'EMB'] },
  { id: 'gebe-okulu', label: 'Gebe okulu', defaultVisitType: 'gebe-okulu', soapTemplate: 'okul', checklist: ['attendance', 'certificate', 'SB bildirim'] },
  { id: 'travay-salon', label: 'Travay / salon', defaultVisitType: 'travay', soapTemplate: 'travay', checklist: ['partogram', 'Bishop', 'oxytocin', 'NST'] },
]

export function unitForRisk(risk: 'dusuk' | 'orta' | 'yuksek', sevk: boolean): ClinicUnit {
  if (risk === 'yuksek' || sevk) return 'perinatoloji'
  return 'genel-kd'
}
