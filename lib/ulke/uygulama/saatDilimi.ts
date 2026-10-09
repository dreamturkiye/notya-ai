/**
 * NOTYA-ULKE-SABLON-01 — THE TIME ZONE AN ACCOUNT WORKS IN. A country may have several (the United States, Canada,
 * Australia); the pack lists them (`uygulama.saatDilimleri`) and names the default (`saatDilimi`). An account's own
 * choice is stored with the account (`ulke_hesaplari.saat_dilimi`, migration 130) and is always one of the pack's
 * list — a value that is not on it is read as the default and is never written.
 *
 * Everything the server computes in "the country's own day and hour" — today, the day's visit ceiling, the calendar,
 * working hours, the day and time an appointment is answered with — uses the ACCOUNT's zone.
 *
 * A country with ONE zone (Uzbekistan) is not asked anything and costs nothing: no query is made, the pack's zone is
 * the answer. Scoped to the authenticated account's own id and to this build's country; nothing here takes an id
 * from a request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkePaketi } from '../ulke'
import { ulkeTablosu } from './tablolar'

/** The zones an account of this country may choose. Always holds the pack's default. */
export function saatDilimleri(): readonly string[] {
  const p = ulkePaketi()
  const liste = p.uygulama?.saatDilimleri ?? []
  return liste.includes(p.saatDilimi) ? liste : [p.saatDilimi, ...liste]
}

/** true = `ham` is exactly one of the pack's zones. */
export function saatDilimiMi(ham: unknown): ham is string {
  return typeof ham === 'string' && saatDilimleri().includes(ham)
}

/** The account's zone: its own choice when it is on the pack's list, otherwise the pack's default. */
export async function hesapSaatDilimi(supabase: SupabaseClient, hesapId: string): Promise<string> {
  const varsayilan = ulkePaketi().saatDilimi
  if (saatDilimleri().length <= 1) return varsayilan
  const { data, error } = await ulkeTablosu(supabase, 'ulke_hesaplari').select('saat_dilimi').eq('id', hesapId).maybeSingle()
  const z = error ? null : (data as { saat_dilimi?: unknown } | null)?.saat_dilimi
  return saatDilimiMi(z) ? z : varsayilan
}

/** Writes the caller's zone. false = not one of the pack's zones, or nothing was saved. */
export async function hesapSaatDiliminiYaz(supabase: SupabaseClient, hesapId: string, dilim: unknown): Promise<boolean> {
  if (!saatDilimiMi(dilim)) return false
  const { data, error } = await ulkeTablosu(supabase, 'ulke_hesaplari').update({ saat_dilimi: dilim, updated_at: new Date().toISOString() }).eq('id', hesapId).select('id')
  return !error && Boolean((data as unknown[] | null)?.length)
}
