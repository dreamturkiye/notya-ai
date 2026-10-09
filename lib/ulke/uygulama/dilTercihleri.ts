/**
 * NOTYA-UZ-MUAYENE-01 — an account's language choices inside the signed-in application.
 *
 *   interface language   ulke_hesaplari.ui_language (migration 130)
 *   note language        hekim_dil_tercihleri.not_dili (migration 130)
 *   asked yet?           hekim_dil_tercihleri.soruldu_at
 *
 * A script is part of the language code (uz-Latn / uz-Cyrl), so "script" needs no field of its own.
 * Every read and write is scoped to the authenticated account's own id; nothing here takes an id from a request.
 * Values are narrowed to the languages the active pack offers inside the application — never another country's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DilKodu } from '../tipler'
import { uygulamaDiliMi, uygulamaDiliSec } from '../ulke'
import { ulkeTablosu } from './tablolar'

export type DilTercihleri = { arayuzDili: DilKodu; notDili: DilKodu; soruldu: boolean }

/** `arayuzHam` is the account's ulke_hesaplari.ui_language as already read by the caller. */
export async function dilTercihleriniOku(supabase: SupabaseClient, hesapId: string, arayuzHam: unknown): Promise<DilTercihleri> {
  const arayuzDili = uygulamaDiliSec(typeof arayuzHam === 'string' ? arayuzHam : null)
  const { data, error } = await ulkeTablosu(supabase, 'hekim_dil_tercihleri')
    .select('not_dili, soruldu_at')
    .eq('doctor_id', hesapId)
    .maybeSingle()
  // No row, or a database without migration 130: the question has not been answered; notes follow the interface.
  if (error || !data) return { arayuzDili, notDili: arayuzDili, soruldu: false }
  return {
    arayuzDili,
    notDili: uygulamaDiliMi(data.not_dili) ? data.not_dili : arayuzDili,
    soruldu: Boolean(data.soruldu_at),
  }
}

/** Writes both choices and marks the question answered. false = nothing usable was saved. */
export async function dilTercihleriniYaz(
  supabase: SupabaseClient,
  hesapId: string,
  secim: { arayuzDili: DilKodu; notDili: DilKodu },
): Promise<boolean> {
  const simdi = new Date().toISOString()
  const { error: tercihHatasi } = await ulkeTablosu(supabase, 'hekim_dil_tercihleri')
    .upsert({ doctor_id: hesapId, not_dili: secim.notDili, soruldu_at: simdi, updated_at: simdi }, { onConflict: 'doctor_id' })
  if (tercihHatasi) return false
  const { error: satirHatasi } = await ulkeTablosu(supabase, 'ulke_hesaplari').update({ ui_language: secim.arayuzDili, updated_at: simdi }).eq('id', hesapId)
  return !satirHatasi
}
