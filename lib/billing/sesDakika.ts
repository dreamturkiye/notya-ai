/**
 * STRIPE-NOTYA-AU-05 (Kaan, 2026-11-02) - live-voice minute caps by plan state. Pure rules + one read of the
 * account's subscription row. The usage itself is the country's own record (lib/ulke/uygulama/sesDakikaSiniri.ts).
 *
 *   trialing            -> the trial allowance (AU: 60 min in total), counted from the trial's start
 *   active / past_due   -> the paid allowance (AU: 150 min), counted from the current billing period's start
 *   anything else       -> no live subscription: the trial allowance, counted over the account's whole life
 *                          (a doctor must start the trial through Checkout to get more)
 *
 * Kept free of Stripe and of any text: the country live-assistant route imports it.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SesDakikaSiniri } from './ulkeTicari'

export type AbonelikOzeti = { status: string | null; trial_ends_at: string | null; current_period_start: string | null }
export type SesDonemTuru = 'deneme' | 'ucretli' | 'abonesiz'
export type SesDonemi = { tur: SesDonemTuru; /** First counted day, YYYY-MM-DD (UTC). */ baslangicGunu: string; limitDakika: number }

const GUN_MS = 24 * 60 * 60 * 1000
const DENEME_GUN = 15
const ODENEN = new Set(['active', 'past_due'])
const CANLI = new Set(['trialing', 'active', 'past_due'])

const gunu = (ms: number): string => new Date(ms).toISOString().slice(0, 10)
const zaman = (s: string | null | undefined): number | null => {
  const t = s ? Date.parse(s) : NaN
  return Number.isFinite(t) ? t : null
}

export function sesDonemi(ab: AbonelikOzeti | null, sinir: SesDakikaSiniri, simdi = Date.now()): SesDonemi {
  if (ab?.status === 'trialing') {
    const bas = zaman(ab.current_period_start) ?? (zaman(ab.trial_ends_at) !== null ? zaman(ab.trial_ends_at)! - DENEME_GUN * GUN_MS : simdi - DENEME_GUN * GUN_MS)
    return { tur: 'deneme', baslangicGunu: gunu(bas), limitDakika: sinir.denemeDakika }
  }
  if (ab && ODENEN.has(String(ab.status))) {
    const bas = zaman(ab.current_period_start) ?? simdi - 31 * GUN_MS
    return { tur: 'ucretli', baslangicGunu: gunu(bas), limitDakika: sinir.aylikDakika }
  }
  return { tur: 'abonesiz', baslangicGunu: '2000-01-01', limitDakika: sinir.denemeDakika }
}

export type SesKarari = { izin: boolean; tur: SesDonemTuru; limitDakika: number; kullanilanDakika: number }

export function sesKarari(donem: SesDonemi, kullanilanSaniye: number): SesKarari {
  const sn = Number.isFinite(kullanilanSaniye) && kullanilanSaniye > 0 ? kullanilanSaniye : 0
  return { izin: sn < donem.limitDakika * 60, tur: donem.tur, limitDakika: donem.limitDakika, kullanilanDakika: Math.floor(sn / 60) }
}

/** The account's most relevant subscription row: a live one first, else the newest. null = none. */
export async function abonelikOzetiOku(supabase: SupabaseClient, hesapId: string): Promise<AbonelikOzeti | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_start, updated_at')
    .eq('user_id', hesapId)
    .order('updated_at', { ascending: false })
    .limit(5)
  if (error) throw new Error('subscriptions read failed')
  const satirlar = (data ?? []) as AbonelikOzeti[]
  return satirlar.find((s) => CANLI.has(String(s.status))) ?? satirlar[0] ?? null
}
