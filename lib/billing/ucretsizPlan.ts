/**
 * AU-GAP-CLOSE-02 — resolve the daily visit ceiling for freemium (note-only) vs paid/trial.
 * Founding invite and paid Sesli Pro keep the pack's full `gunlukMuayeneLimiti`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { abonelikOzetiOku } from './sesDakika'
import { ulkeTicari } from './ulkeTicari'

const CANLI = new Set(['trialing', 'active', 'past_due'])

/**
 * Daily SOAP visit limit for this account in `ulke`.
 * - Live subscription (trial or paid) → pack ceiling (`tamLimit`)
 * - No live sub + country has `ucretsiz` → freemium `gunlukNot`
 * - Otherwise → pack ceiling (countries without freemium unchanged)
 * Fail open on subscription read errors → pack ceiling (never block a clinic on a broken billing read).
 */
export async function gunlukNotLimiti(
  supabase: SupabaseClient,
  hesapId: string,
  ulke: string,
  tamLimit: number,
): Promise<number> {
  const ucretsiz = ulkeTicari(ulke)?.ucretsiz
  if (!ucretsiz) return tamLimit
  try {
    const ab = await abonelikOzetiOku(supabase, hesapId)
    if (ab && CANLI.has(String(ab.status))) return tamLimit
    return Math.max(0, Math.min(ucretsiz.gunlukNot, tamLimit))
  } catch {
    return tamLimit
  }
}
