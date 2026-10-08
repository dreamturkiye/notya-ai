/**
 * NOTYA-UZ-BRANSLAR-01 — an account's ROLE inside the signed-in application: the doctor specialty, clinic doctor
 * role or clinic allied profession it works as. Stored in `hekim_rolu` (migration 134), one row per account.
 *
 * The list of roles is the ACTIVE PACK's (`uygulama.roller`); core knows no role by name. A value that is not on
 * that list — another country's key, a key the pack has dropped, anything typed by hand — is "no role", on the way
 * in and on the way out. Nothing falls back to a default role.
 *
 * Every read and write is scoped to the authenticated account's own id; nothing here takes an id from a request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkePaketi } from '../ulke'
import { ulkeTablosu } from './tablolar'

/** Roles an account may choose in this country. Empty where the pack has none. */
export function uygulamaRolleri(): readonly string[] {
  return ulkePaketi().uygulama?.roller ?? []
}

/** true = `ham` is exactly one of the active pack's roles. */
export function uygulamaRoluMu(ham: unknown): ham is string {
  return typeof ham === 'string' && uygulamaRolleri().includes(ham)
}

/** The account's role, or null: not chosen yet, not readable (a database without migration 134), or not a role here. */
export async function hekimRolunuOku(supabase: SupabaseClient, hesapId: string): Promise<string | null> {
  const { data, error } = await ulkeTablosu(supabase, 'hekim_rolu').select('rol').eq('doctor_id', hesapId).maybeSingle()
  if (error || !data) return null
  const rol = (data as { rol?: unknown }).rol
  return uygulamaRoluMu(rol) ? rol : null
}

/** Writes the caller's role. false = nothing was saved. The caller has already checked `rol` with uygulamaRoluMu. */
export async function hekimRolunuYaz(supabase: SupabaseClient, hesapId: string, rol: string): Promise<boolean> {
  if (!uygulamaRoluMu(rol)) return false
  const simdi = new Date().toISOString()
  const { error } = await ulkeTablosu(supabase, 'hekim_rolu').upsert({ doctor_id: hesapId, rol, secildi_at: simdi, updated_at: simdi }, { onConflict: 'doctor_id' })
  return !error
}
