/**
 * Pregnancy supplements and vaccines. Do not call the pediatric immunization API.
 */
export type SupplementPlan = {
  id: string
  label: string
  window: string
  notes: string
}

export const PREGNANCY_SUPPLEMENTS: SupplementPlan[] = [
  { id: 'folate', label: 'Folik asit 400–800 µg', window: 'Konsepsiyon öncesi – 12. hafta', notes: 'NTD öyküsü / valproat / DM varsa 4–5 mg' },
  { id: 'iron', label: 'Demir', window: 'Genelde 16. hafta → postpartum 3. ay', notes: 'Doz anemiye göre; SB akış şeması' },
  { id: 'vitd', label: 'D vitamini', window: 'DÖBYR akış şeması', notes: 'IU uydurulmaz — DÖBYR şemasına bakınız' },
]

export const PREGNANCY_VACCINES: SupplementPlan[] = [
  { id: 'td', label: 'Td 1–3 doz öyküye göre', window: 'geçmiş öyküye göre', notes: 'pediatrik aşı takvimi değildir' },
  { id: 'tdap', label: 'Tdap', window: '27–36. hafta', notes: 'Maternal boğmaca koruması' },
  { id: 'influenza', label: 'İnfluenza (grip)', window: 'Eylül–Nisan', notes: 'Mevsimsel grip aşısı' },
  { id: 'anti_d', label: 'Anti-D', window: '28. hafta + yenidoğan Rh(+) / kanama / işlem sonrası', notes: 'Yalnız Rh(−) İDC(−)' },
]

export const TERATOGEN_STUB = ['ACEI', 'statin', 'isotretinoin', 'warfarin', 'valproate'] as const

export const LACTATION_SAFETY_STUB = {
  id: 'lactation-safety',
  notes: 'Postpartum lactation safety stub — cite Temel KD / Williams; do not invent a full Hale table.',
}

export function folateDoseUg(flags: { ntd_history?: boolean; valproate?: boolean; dm?: boolean }): { min: number; max: number } {
  if (flags.ntd_history || flags.valproate || flags.dm) return { min: 4000, max: 5000 }
  return { min: 400, max: 800 }
}
