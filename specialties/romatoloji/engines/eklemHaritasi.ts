/**
 * ROMATOLOJI-EXCEPTIONAL-01 — 28 eklem haritası. SAF fonksiyon.
 * Hassas / şişkin işaret → TJC / SJC sayımı. Tanı yazılmaz.
 */
export const EKLEM_28 = [
  'sag_omuz', 'sol_omuz',
  'sag_dirsek', 'sol_dirsek',
  'sag_el_bilegi', 'sol_el_bilegi',
  'sag_MCP1', 'sag_MCP2', 'sag_MCP3', 'sag_MCP4', 'sag_MCP5',
  'sol_MCP1', 'sol_MCP2', 'sol_MCP3', 'sol_MCP4', 'sol_MCP5',
  'sag_PIP1', 'sag_PIP2', 'sag_PIP3', 'sag_PIP4', 'sag_PIP5',
  'sol_PIP1', 'sol_PIP2', 'sol_PIP3', 'sol_PIP4', 'sol_PIP5',
  'sag_diz', 'sol_diz',
] as const

export type Eklem28 = (typeof EKLEM_28)[number]

export const EKLEM_28_ETIKET: Record<Eklem28, string> = {
  sag_omuz: 'Sağ omuz', sol_omuz: 'Sol omuz',
  sag_dirsek: 'Sağ dirsek', sol_dirsek: 'Sol dirsek',
  sag_el_bilegi: 'Sağ el bileği', sol_el_bilegi: 'Sol el bileği',
  sag_MCP1: 'Sağ MCP1', sag_MCP2: 'Sağ MCP2', sag_MCP3: 'Sağ MCP3', sag_MCP4: 'Sağ MCP4', sag_MCP5: 'Sağ MCP5',
  sol_MCP1: 'Sol MCP1', sol_MCP2: 'Sol MCP2', sol_MCP3: 'Sol MCP3', sol_MCP4: 'Sol MCP4', sol_MCP5: 'Sol MCP5',
  sag_PIP1: 'Sağ PIP1', sag_PIP2: 'Sağ PIP2', sag_PIP3: 'Sağ PIP3', sag_PIP4: 'Sağ PIP4', sag_PIP5: 'Sağ PIP5',
  sol_PIP1: 'Sol PIP1', sol_PIP2: 'Sol PIP2', sol_PIP3: 'Sol PIP3', sol_PIP4: 'Sol PIP4', sol_PIP5: 'Sol PIP5',
  sag_diz: 'Sağ diz', sol_diz: 'Sol diz',
}

export interface EklemHaritaSonuc {
  tamamMi: boolean
  hassas: string[]
  siskin: string[]
  tjc: number
  sjc: number
  ozet: string
}

export function eklemSay(hassas: string[], siskin: string[]): EklemHaritaSonuc {
  const h = [...new Set(hassas.filter((x) => (EKLEM_28 as readonly string[]).includes(x)))]
  const s = [...new Set(siskin.filter((x) => (EKLEM_28 as readonly string[]).includes(x)))]
  return {
    tamamMi: true,
    hassas: h,
    siskin: s,
    tjc: h.length,
    sjc: s.length,
    ozet: `28 eklem haritası: TJC ${h.length}, SJC ${s.length} (karar desteği; tanı yazılmaz).`,
  }
}
