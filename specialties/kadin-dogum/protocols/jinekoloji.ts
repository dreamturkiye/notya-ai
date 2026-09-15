/**
 * Jinekoloji visit type — separate from gebe card, same specialty folder.
 * Adolescent gyn: do not edit the pediatrics folder.
 */
export type JinekolojiReminder = {
  id: string
  label: string
  interval: string
  notes: string
}

export const CERVIX_SCREENING: JinekolojiReminder[] = [
  { id: 'hpv-dna-national', label: 'Ulusal HPV-DNA', interval: '30–65 yaş, 5 yılda bir', notes: 'KETEM/ASM ücretsiz' },
  { id: 'clinic-pap', label: 'Klinik Pap', interval: '21+ her 3 yıl veya ko-test', notes: 'kolposkopi görüntü arşivi' },
]

export const BREAST_SCREENING: JinekolojiReminder[] = [
  { id: 'mammo', label: 'Mamografi', interval: '40–69 q2y', notes: 'KETEM refer' },
]

export const CONTRACEPTION = [
  'RİA takma/çıkarma',
  'implant',
  'OKS etkileşimleri',
  'Acil kontrasepsiyon',
  'Lohusalık zamanlaması',
] as const

export const REI_PACK = [
  'cycle/REI',
  'AUB',
  'PCOS Rotterdam',
  'amenorrhea',
  'menopause MHT',
  'infertility AMH HSG semen IUI/IVF refer',
] as const

export const POP_Q = ['POP-Q', 'incontinence', 'pessary'] as const

export const SURGICAL_PACKETS = [
  'hysteroscopy',
  'lap myomectomy',
  'TAH',
  'TVT',
  'consent + op note',
] as const

export const ONCO_TRIAGE = ['CA-125', 'IOTA', 'EMB', 'ASCUS/HSIL'] as const

export const GEBE_OKULU = {
  id: 'gebe-okulu',
  notes: 'Gebe okulu attendance — Reg Dec 2024',
}

export function dueCervixScreen(input: { age: number; last_hpv_year?: number; last_pap_year?: number; now_year: number }): string[] {
  const due: string[] = []
  if (input.age >= 30 && input.age <= 65) {
    if (input.last_hpv_year == null || input.now_year - input.last_hpv_year >= 5) due.push('hpv-dna-national')
  }
  if (input.age >= 21) {
    if (input.last_pap_year == null || input.now_year - input.last_pap_year >= 3) due.push('clinic-pap')
  }
  return due
}

export function dueMammo(input: { age: number; last_mammo_year?: number; now_year: number }): boolean {
  if (input.age < 40 || input.age > 69) return false
  return input.last_mammo_year == null || input.now_year - input.last_mammo_year >= 2
}

export function cycleNote(lmpIso: string | null, todayIso: string): { day: number | null; label: string } {
  if (!lmpIso) return { day: null, label: 'SAT bilinmiyor' }
  const a = Date.parse(todayIso + 'T00:00:00Z')
  const b = Date.parse(lmpIso + 'T00:00:00Z')
  const day = Math.floor((a - b) / 86_400_000) + 1
  return { day, label: `Siklusun ${day}. günü` }
}
