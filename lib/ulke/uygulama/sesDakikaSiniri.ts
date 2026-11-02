/**
 * STRIPE-NOTYA-AU-05 (Kaan, 2026-11-02) - the live-voice minute cap of a country build, enforced at CALL START only.
 *
 * Pricing/limits only (Kaan's written approval, docs/SES-KILIT-ONAYLARI.md 2026-11-02): no change to the voice
 * architecture, routing, prompts, streaming or turns. The gate sits in the call-start route in front of the locked
 * opener; a call that is already running is never cut. The cap is the country's (lib/billing/ulkeTicari.ts);
 * a country without one is not gated at all.
 *
 *   sesDakikaKapisi   call start: the subscription row, the voice-seconds rows of the period and the account's founder
 *                     exemption flag (migration 186), read in parallel (one round trip, three small indexed reads) -
 *                     never on the per-turn path. An exempt account has no cap (null).
 *   cagriSuresiYaz    call end: the browser posts the call token once; the seconds are bounded by the token's own
 *                     issue time, so a browser cannot report more than the call could have lasted. Stored as the
 *                     task `canli-ses` in the country's usage record (ulke_kullanim_olcumu, adds atomically).
 *
 * Fail open, like every other counter of a country build: a broken read never stops a clinic.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { abonelikOzetiOku, sesDonemi, sesKarari, type SesKarari } from '@/lib/billing/sesDakika'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { canliJetonuDogrula, JETON_OMRU_MS } from '@/lib/ulke/asistan/jeton'
import { kullanimEkle } from './kullanimOlcumu'
import { ulkeTablosu } from './tablolar'

export const SES_GOREVI = 'canli-ses'
/** The provider ends a call at 120 minutes. */
const CAGRI_AZAMI_SN = 120 * 60

/** null = no cap in this country (or the reads failed: fail open). */
export async function sesDakikaKapisi(supabase: SupabaseClient, hesapId: string, ulke: string, simdi = Date.now()): Promise<SesKarari | null> {
  const sinir = ulkeTicari(ulke)?.sesDakika
  if (!sinir) return null
  try {
    // The widest window any plan state can need is the account's whole life; the rows are one per day, so read them
    // all with the subscription in parallel and filter by the period here.
    const [ab, kullanim, hesap] = await Promise.all([
      abonelikOzetiOku(supabase, hesapId),
      ulkeTablosu(supabase, 'ulke_kullanim_olcumu').select('gun, saniye').eq('doctor_id', hesapId).eq('gorev', SES_GOREVI),
      ulkeTablosu(supabase, 'ulke_hesaplari').select('ozel_muafiyet').eq('id', hesapId).maybeSingle(),
    ])
    // Founder exemption (Kaan, 2026-11-02): neither the trial's nor the paid plan's minutes apply.
    if (!hesap.error && (hesap.data as { ozel_muafiyet?: boolean } | null)?.ozel_muafiyet === true) return null
    if (kullanim.error) throw new Error('usage read failed')
    const donem = sesDonemi(ab, sinir, simdi)
    const sn = ((kullanim.data ?? []) as Array<{ gun: string; saniye: number | string }>)
      .filter((r) => String(r.gun) >= donem.baslangicGunu)
      .reduce((t, r) => t + (Number(r.saniye) || 0), 0)
    return sesKarari(donem, sn)
  } catch {
    console.warn('[ulke/ses-dakika] cap not checked')
    return null
  }
}

/** The seconds to record for a call: the browser's own count, never more than the token's age or the provider's limit. */
export function cagriSaniyesi(g: { verildi: number; simdi: number; bildirilen: unknown }): number {
  const sunucu = Math.max(0, Math.min((g.simdi - g.verildi) / 1000, CAGRI_AZAMI_SN))
  const b = typeof g.bildirilen === 'number' && Number.isFinite(g.bildirilen) && g.bildirilen >= 0 ? g.bildirilen : sunucu
  return Math.round(Math.min(b, sunucu))
}

/** When the token was minted (ms), read from a token canliJetonuDogrula already accepted. */
function verilisZamani(jeton: string): number | null {
  try {
    const v = JSON.parse(Buffer.from(jeton.split('.')[0], 'base64url').toString('utf8')) as { exp?: unknown }
    return typeof v.exp === 'number' ? v.exp - JETON_OMRU_MS : null
  } catch {
    return null
  }
}

const kapananlar = new Set<string>()

/** Call end. true = recorded. Each call (token `c`) is counted once per server instance; the browser sends once. */
export async function cagriSuresiYaz(supabase: SupabaseClient, ulke: string, ham: unknown, bildirilen: unknown, simdi = Date.now()): Promise<boolean> {
  if (!ulkeTicari(ulke)?.sesDakika) return false
  const j = canliJetonuDogrula(ham, ulke, simdi)
  if (!j || typeof ham !== 'string') return false
  const anahtar = `${j.hesapId}:${j.cagri ?? ham.slice(-24)}`
  if (kapananlar.has(anahtar)) return false
  const verildi = verilisZamani(ham)
  if (verildi === null) return false
  kapananlar.add(anahtar)
  if (kapananlar.size > 5000) kapananlar.clear()
  const saniye = cagriSaniyesi({ verildi, simdi, bildirilen })
  await kullanimEkle(supabase, j.hesapId, SES_GOREVI, { saniye })
  return true
}
