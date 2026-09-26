/**
 * Marmara/Gazi-style clinic units. A visit is tagged with a unit.
 * Default genel-poliklinik / genel. Switching unit changes checklist and SOAP template.
 * Not separate apps.
 */
import type { ClinicUnit, VisitType } from '../types'

export type UnitProfile = {
  id: ClinicUnit
  label: string
  defaultVisitType: VisitType
  soapTemplate: 'genel' | 'islem' | 'fototerapi' | 'yama' | 'vision'
  checklist: string[]
}

export const CLINIC_UNIT_PROFILES: UnitProfile[] = [
  { id: 'genel', label: 'Genel poliklinik', defaultVisitType: 'genel-poliklinik', soapTemplate: 'genel', checklist: ['süre', 'kaşıntı', 'tetik', 'meslek', 'ilaç', 'fotodağılım', 'primer lezyon', 'harita', 'dermoskopi', 'skor', 'plan', 'sonraki foto'] },
  { id: 'psoriasis', label: 'Psoriasis ünitesi', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['PASI', 'BSA', 'DLQI', 'eklem', 'foto baseline'] },
  { id: 'fototerapi', label: 'Fototerapi', defaultVisitType: 'fototerapi', soapTemplate: 'fototerapi', checklist: ['cihaz', 'J/cm2', 'kümülatif', 'yanık', 'seans foto'] },
  { id: 'pediatrik', label: 'Pediatrik dermatoloji', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['pediatric_consent', 'hemangiom/egzama handoff'] },
  { id: 'sac', label: 'Saç ünitesi', defaultVisitType: 'sac', soapTemplate: 'genel', checklist: ['SALT', 'trikoskopi seri'] },
  { id: 'kontakt-yama', label: 'Kontakt / yama', defaultVisitType: 'allerji-yama', soapTemplate: 'yama', checklist: ['D0 uygulama', 'D2', 'D4', 'foto her okuma'] },
  { id: 'urtiker', label: 'Ürtiker', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['akut vs kronik >6hft', 'UAS7'] },
  { id: 'behcet-bagdokusu', label: 'Behçet / bağ dokusu', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['oral', 'genital', 'göz', 'paterji', 'ISG'] },
  { id: 'bullu', label: 'Büllü hastalıklar', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['biyopsi+DIF zorunlu', 'PDAI'] },
  { id: 'cerrahi', label: 'Dermatoşirürji', defaultVisitType: 'islem', soapTemplate: 'islem', checklist: ['SUT', 'islem_oncesi', 'islem_sonrasi', 'patoloji'] },
  { id: 'kozmetik', label: 'Kozmetik', defaultVisitType: 'kozmetik', soapTemplate: 'islem', checklist: ['Fitzpatrick', 'test spot', 'lot no', 'hekim lazer'] },
  { id: 'nevus-tumor', label: 'Nevüs / tümör', defaultVisitType: 'onkoloji-nevus', soapTemplate: 'vision', checklist: ['ugly duckling', 'dijital harita', 'dermoskopi', 'TBSE'] },
  { id: 'psikoderm', label: 'Psikodermatoloji', defaultVisitType: 'yandal', soapTemplate: 'genel', checklist: ['DLQI', 'tetik stres'] },
]

/**
 * Kontrol listesi maddeleri kayıtlı ziyaretlerde JSON anahtarıdır (değiştirilmez);
 * hekime görünen metin bu eşlemeden gelir.
 */
const CHECKLIST_ETIKET: Record<string, string> = {
  'sonraki foto': 'Sonraki fotoğraf',
  'foto baseline': 'Başlangıç fotoğrafı',
  'seans foto': 'Seans fotoğrafı',
  'foto her okuma': 'Her okumada fotoğraf',
  pediatric_consent: 'Veli onamı',
  'hemangiom/egzama handoff': 'Hemanjiyom / egzama devri',
  'trikoskopi seri': 'Trikoskopi serisi',
  'akut vs kronik >6hft': 'Akut / kronik (>6 hafta)',
  islem_oncesi: 'İşlem öncesi fotoğraf',
  islem_sonrasi: 'İşlem sonrası fotoğraf',
  'test spot': 'Test spot',
  'lot no': 'Lot no',
  'hekim lazer': 'Hekim lazeri',
  'ugly duckling': 'Çirkin ördek yavrusu işareti',
  'tetik stres': 'Tetikleyici stres',
  tetik: 'Tetikleyici',
}

export function checklistEtiketi(madde: string): string {
  return CHECKLIST_ETIKET[madde] ?? madde
}

export function unitForVisit(visitType: VisitType): ClinicUnit {
  const hit = CLINIC_UNIT_PROFILES.find((u) => u.defaultVisitType === visitType)
  return hit?.id ?? 'genel'
}

export function profileForUnit(unit: ClinicUnit): UnitProfile {
  return CLINIC_UNIT_PROFILES.find((u) => u.id === unit) ?? CLINIC_UNIT_PROFILES[0]
}
