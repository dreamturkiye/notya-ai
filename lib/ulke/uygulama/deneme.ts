/**
 * STRIPE-NOTYA-AU-05, trial model (Kaan, 2026-11-02) - the in-app free trial of a country build: the reads and the gates.
 * Rules: lib/billing/deneme.ts. Settings: lib/billing/ulkeTicari.ts (`deneme`; a country without it is never gated and
 * nothing here reads anything for it).
 *
 *   denemeOku          one round trip: the account row (created_at) and the subscription row in parallel, plus the
 *                      count of the account's visits only when asked (visit start and the status call).
 *   muayeneDenemeKapisi   visit start only (lib/ulke/uygulama/muayeneKaydi.ts): read-only and the 40-visit cap.
 *   denemeEngeli       the AI routes and live voice: read-only only. Cached per account for a minute on the instance, so
 *                      a busy doctor costs one read a minute at most, never one per request (performans-butcesi-koruma).
 *
 * Fail open, like every counter of a country build: a broken read never stops a clinic.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { abonelikOzetiOku } from '@/lib/billing/sesDakika'
import { denemeDurumu, denemeKarari, type DenemeDurumu, type DenemeRetKodu } from '@/lib/billing/deneme'
import { ulkeTicari, type UygulamaIciDeneme } from '@/lib/billing/ulkeTicari'
import { aktifUlke } from '@/lib/ulke/ulke'
import { cevap } from './cevap'
import { ulkeTablosu } from './tablolar'

export type DenemeOkuma = { ayar: UygulamaIciDeneme; durum: DenemeDurumu; muayeneSayisi: number | null }

export async function denemeOku(supabase: SupabaseClient, hesapId: string, ulke: string, secenek: { muayeneSay?: boolean; simdi?: number } = {}): Promise<DenemeOkuma | null> {
  const ayar = ulkeTicari(ulke)?.deneme
  if (!ayar) return null
  try {
    const [hesap, abonelik, sayim] = await Promise.all([
      ulkeTablosu(supabase, 'ulke_hesaplari').select('created_at').eq('id', hesapId).maybeSingle(),
      abonelikOzetiOku(supabase, hesapId),
      secenek.muayeneSay ? ulkeTablosu(supabase, 'ulke_muayeneler').select('id', { count: 'exact', head: true }).eq('doctor_id', hesapId) : Promise.resolve(null),
    ])
    if (hesap.error) throw new Error('account read failed')
    if (sayim && sayim.error) throw new Error('visit count failed')
    const durum = denemeDurumu({ ayar, hesapAcilis: (hesap.data as { created_at?: string } | null)?.created_at ?? null, abonelik, simdi: secenek.simdi })
    return { ayar, durum, muayeneSayisi: sayim ? Number(sayim.count ?? 0) : null }
  } catch {
    console.warn('[ulke/deneme] trial not checked')
    return null
  }
}

/** Visit start: null = go on; otherwise the refusal code (read-only, or the trial's visit cap reached). */
export async function muayeneDenemeKapisi(supabase: SupabaseClient, hesapId: string, ulke = aktifUlke(), simdi = Date.now()): Promise<DenemeRetKodu | null> {
  if (!ulkeTicari(ulke)?.deneme) return null
  const o = await denemeOku(supabase, hesapId, ulke, { muayeneSay: true, simdi })
  if (!o) return null
  return denemeKarari(o.durum, o.ayar, o.muayeneSayisi ?? undefined)
}

const ONBELLEK_MS = 60 * 1000
const onbellek = new Map<string, { kod: DenemeRetKodu | null; bitis: number }>()

/** Test hook. */
export function denemeOnbellekTemizle(): void {
  onbellek.clear()
}

/** AI generation and live voice: null = go on; otherwise 402 { code: 'DENEME_BITTI' } (the account is read-only). */
export async function denemeEngeli(supabase: SupabaseClient, hesapId: string, ulke = aktifUlke(), simdi = Date.now()): Promise<Response | null> {
  if (!ulkeTicari(ulke)?.deneme) return null
  const anahtar = `${ulke}:${hesapId}`
  const o = onbellek.get(anahtar)
  let kod: DenemeRetKodu | null
  if (o && o.bitis > simdi) kod = o.kod
  else {
    const okuma = await denemeOku(supabase, hesapId, ulke, { simdi })
    kod = okuma ? denemeKarari(okuma.durum, okuma.ayar) : null
    if (okuma) {
      onbellek.set(anahtar, { kod, bitis: simdi + ONBELLEK_MS })
      if (onbellek.size > 5000) onbellek.clear()
    }
  }
  return kod ? cevap({ code: kod }, 402) : null
}
