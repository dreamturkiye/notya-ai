/**
 * NOTYA-UZ-RANDEVU-01 — an account's WORKING PATTERN: working days, working hours, default appointment length and
 * breaks. Stored in `hekim_calisma_duzeni` (migration 135), one row per account.
 *
 * The norms are the ACTIVE PACK's (`uygulama.randevu`): the pattern an account has before it saves its own, and the
 * appointment lengths it may choose. The time zone is the pack's; minutes are wall-clock minutes of that zone.
 * PUBLIC HOLIDAYS are not known here at all: they are local content, and none is hard-coded.
 *
 * Every read and write is scoped to the authenticated account's own id; nothing here takes an id from a request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkePaketi } from '../ulke'
import { GUN_DK, saatCoz } from './zaman'

export type Mola = { bas: number; bit: number }
export type CalismaDuzeni = {
  /** ISO weekdays, ascending: 1 = Monday … 7 = Sunday. */
  gunler: number[]
  /** Minutes after local midnight. */
  baslangicDk: number
  bitisDk: number
  /** Default appointment length, minutes. */
  sureDk: number
  molalar: Mola[]
}

export const MOLA_AZAMI = 4

/** Appointment lengths an account may choose here. Empty where the pack has no appointments. */
export function sureSecenekleri(): readonly number[] {
  return ulkePaketi().uygulama?.randevu?.sureSecenekleri ?? []
}

/** The pack's own pattern, or null where the pack has none (the feature cannot work there). */
export function varsayilanDuzen(): CalismaDuzeni | null {
  const v = ulkePaketi().uygulama?.randevu?.varsayilan
  if (!v) return null
  const d = duzenCoz({ gunler: [...v.gunler], baslangic: v.baslangic, bitis: v.bitis, sureDk: v.sureDk, molalar: v.molalar.map((m) => ({ baslangic: m.baslangic, bitis: m.bitis })) })
  return d.tamam ? d.duzen : null
}

/**
 * What a client sent → a pattern, or the name of the field that is wrong. Times arrive as 'HH:MM'.
 * Rules: at least one working day; the day ends after it begins; the default length is one the pack offers;
 * each break lies inside the working hours, and breaks do not overlap.
 */
export function duzenCoz(g: Record<string, unknown>): { tamam: true; duzen: CalismaDuzeni } | { tamam: false; alan: 'gunler' | 'saatler' | 'sure' | 'molalar' } {
  const gunler = Array.isArray(g.gunler) ? [...new Set(g.gunler.map((x) => Number(x)))].sort((a, b) => a - b) : []
  if (!gunler.length || gunler.some((x) => !Number.isInteger(x) || x < 1 || x > 7)) return { tamam: false, alan: 'gunler' }
  const baslangicDk = saatCoz(g.baslangic)
  const bitisDk = saatCoz(g.bitis)
  if (baslangicDk === null || bitisDk === null || baslangicDk >= GUN_DK || bitisDk <= baslangicDk) return { tamam: false, alan: 'saatler' }
  const sureDk = Number(g.sureDk)
  if (!sureSecenekleri().includes(sureDk)) return { tamam: false, alan: 'sure' }
  if (g.molalar !== undefined && !Array.isArray(g.molalar)) return { tamam: false, alan: 'molalar' }
  const hamMolalar = (g.molalar as unknown[] | undefined) ?? []
  if (hamMolalar.length > MOLA_AZAMI) return { tamam: false, alan: 'molalar' }
  const molalar: Mola[] = []
  for (const h of hamMolalar) {
    const m = (h && typeof h === 'object' ? h : {}) as Record<string, unknown>
    const bas = saatCoz(m.baslangic)
    const bit = saatCoz(m.bitis)
    if (bas === null || bit === null || bit <= bas || bas < baslangicDk || bit > bitisDk) return { tamam: false, alan: 'molalar' }
    molalar.push({ bas, bit })
  }
  molalar.sort((a, b) => a.bas - b.bas)
  for (let i = 1; i < molalar.length; i++) if (molalar[i].bas < molalar[i - 1].bit) return { tamam: false, alan: 'molalar' }
  return { tamam: true, duzen: { gunler, baslangicDk, bitisDk, sureDk, molalar } }
}

/**
 * THE WORKING-HOURS RULE. true = the appointment [basDk, basDk + sureDk) on a day with ISO weekday `haftaGunu` lies
 * on a working day, wholly inside the working hours, and touches no break. An appointment that runs past midnight
 * is never inside working hours.
 */
export function mesaiIcinde(duzen: CalismaDuzeni, haftaGunu: number, basDk: number, sureDk: number): boolean {
  const bitDk = basDk + sureDk
  if (!duzen.gunler.includes(haftaGunu)) return false
  if (basDk < duzen.baslangicDk || bitDk > duzen.bitisDk) return false
  return !duzen.molalar.some((m) => basDk < m.bit && bitDk > m.bas)
}

type DuzenSatiri = { gunler: unknown; baslangic_dk: unknown; bitis_dk: unknown; sure_dk: unknown; molalar: unknown }

function satirdan(s: DuzenSatiri): CalismaDuzeni | null {
  const gunler = Array.isArray(s.gunler) ? s.gunler.map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 7).sort((a, b) => a - b) : []
  const baslangicDk = Number(s.baslangic_dk); const bitisDk = Number(s.bitis_dk); const sureDk = Number(s.sure_dk)
  if (!gunler.length || !Number.isInteger(baslangicDk) || !Number.isInteger(bitisDk) || bitisDk <= baslangicDk || !Number.isInteger(sureDk) || sureDk < 5) return null
  const molalar = (Array.isArray(s.molalar) ? s.molalar : [])
    .map((m) => ({ bas: Number((m as Mola | null)?.bas), bit: Number((m as Mola | null)?.bit) }))
    .filter((m) => Number.isInteger(m.bas) && Number.isInteger(m.bit) && m.bit > m.bas)
  return { gunler, baslangicDk, bitisDk, sureDk, molalar }
}

/**
 * The account's pattern. `kayitli` false = the account has saved none (or it cannot be read): the pack's own applies.
 * null = the country has no appointment norms at all.
 */
export async function calismaDuzeniniOku(supabase: SupabaseClient, hesapId: string): Promise<{ duzen: CalismaDuzeni; kayitli: boolean } | null> {
  const varsayilan = varsayilanDuzen()
  if (!varsayilan) return null
  const { data, error } = await supabase.from('hekim_calisma_duzeni').select('gunler, baslangic_dk, bitis_dk, sure_dk, molalar').eq('doctor_id', hesapId).maybeSingle()
  const duzen = !error && data ? satirdan(data as DuzenSatiri) : null
  return duzen ? { duzen, kayitli: true } : { duzen: varsayilan, kayitli: false }
}

/** Writes the caller's pattern. false = nothing was saved. */
export async function calismaDuzeniniYaz(supabase: SupabaseClient, hesapId: string, d: CalismaDuzeni): Promise<boolean> {
  const simdi = new Date().toISOString()
  const { error } = await supabase
    .from('hekim_calisma_duzeni')
    .upsert({ doctor_id: hesapId, gunler: d.gunler, baslangic_dk: d.baslangicDk, bitis_dk: d.bitisDk, sure_dk: d.sureDk, molalar: d.molalar, updated_at: simdi }, { onConflict: 'doctor_id' })
  return !error
}
