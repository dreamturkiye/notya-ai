/**
 * WHATSAPP-API-01 — Meta messaging tiers as a hard send limit (rolling 24h, per doctor's number).
 *
 * A new WhatsApp Business number starts at TIER_250 (250 business-initiated conversations per rolling 24h) and Meta
 * raises it to 1K / 10K / 100K / unlimited with quality and volume. Notya never exceeds the tier it last read from
 * Meta; when the limit is reached the message is reported as "not sent" and the dispatcher falls back to e-posta.
 *
 * The counter is a rolling 24h sum of hour buckets reserved atomically in Postgres (migration 169,
 * whatsapp_kota_al — advisory lock per doctor). It counts MESSAGES, Meta counts unique recipients: counting messages
 * is the conservative side. Fail closed: if the counter cannot be reached nothing is sent.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Where every number starts, before Meta has told us otherwise (unverified business). */
export const BASLANGIC_LIMIT = 250

const TIER_LIMITLERI: Record<string, number> = {
  TIER_50: 50,
  TIER_250: 250,
  TIER_1K: 1_000,
  TIER_2K: 2_000,
  TIER_10K: 10_000,
  TIER_100K: 100_000,
  TIER_UNLIMITED: 1_000_000,
}

/** Meta's `messaging_limit_tier` → numeric limit. Unknown or missing → the starting tier (never more). */
export function tierLimiti(tier: string | null | undefined): number {
  const t = String(tier || '').trim().toUpperCase()
  return TIER_LIMITLERI[t] ?? BASLANGIC_LIMIT
}

/** Sade Türkçe etiket (kartta gösterilir). */
export function tierEtiketi(tier: string | null | undefined): string {
  return `günde ${tierLimiti(tier).toLocaleString('tr-TR')} mesaja kadar`
}

/** Turkey utility template price used for the (indicative) cost line of the usage block, USD per message. */
export const TR_UTILITY_USD = 0.0009

export type KotaSonucu = { ok: true; kullanilan: number } | { ok: false; neden: 'limit' | 'hata'; kullanilan: number }

export async function kotaAl(sb: SupabaseClient, doktorId: string, limit: number): Promise<KotaSonucu> {
  try {
    const { data, error } = await sb.rpc('whatsapp_kota_al', { p_doctor: doktorId, p_limit: limit })
    if (error || !data || typeof data !== 'object') return { ok: false, neden: 'hata', kullanilan: 0 }
    const d = data as { ok?: boolean; kullanilan?: number }
    const kullanilan = Number(d.kullanilan) || 0
    return d.ok === true ? { ok: true, kullanilan } : { ok: false, neden: 'limit', kullanilan }
  } catch {
    return { ok: false, neden: 'hata', kullanilan: 0 }
  }
}

/** Meta refused the message before accepting it → the reservation goes back. Best effort. */
export async function kotaIade(sb: SupabaseClient, doktorId: string): Promise<void> {
  try { await sb.rpc('whatsapp_kota_iade', { p_doctor: doktorId }) } catch { /* the counter errs on the safe side */ }
}

/** Messages counted in the last 24h (hour buckets, conservative) — for the usage block. */
export async function son24Saat(sb: SupabaseClient, doktorId: string, simdi: Date = new Date()): Promise<number> {
  try {
    const sinir = new Date(simdi.getTime() - 25 * 3600_000).toISOString()
    const { data, error } = await sb.from('whatsapp_kota_saatlik').select('saat, adet').eq('doctor_id', doktorId).gte('saat', sinir)
    if (error || !data) return 0
    const kesit = simdi.getTime() - 24 * 3600_000
    return data.filter((r) => Date.parse(String(r.saat)) + 3600_000 > kesit).reduce((t, r) => t + (Number(r.adet) || 0), 0)
  } catch {
    return 0
  }
}

/** Messages in the current calendar month (Turkey) from the hour buckets — for the Klinik/Hastane usage line. */
export async function buAy(sb: SupabaseClient, doktorId: string, simdi: Date = new Date()): Promise<number> {
  try {
    const tr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit' }).format(simdi)
    const bas = new Date(Date.parse(`${tr}-01T00:00:00+03:00`)).toISOString()
    const { data, error } = await sb.from('whatsapp_kota_saatlik').select('adet').eq('doctor_id', doktorId).gte('saat', bas)
    if (error || !data) return 0
    return data.reduce((t, r) => t + (Number(r.adet) || 0), 0)
  } catch {
    return 0
  }
}
