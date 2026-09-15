/**
 * Behçet, PsA, CTD skin. Do not edit a romatoloji specialty folder (none in this sprint).
 */
export type DermRomatolojiHandoff = {
  source: 'derm-romatoloji'
  kind: 'behcet' | 'psa' | 'ctd_skin'
  patient_id: string
  notes: string
}

export function draftDermRomatolojiHandoff(input: Omit<DermRomatolojiHandoff, 'source'>): DermRomatolojiHandoff {
  return { source: 'derm-romatoloji', ...input }
}
