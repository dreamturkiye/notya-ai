/**
 * NOTYA-BUYUME-KISA-01 / NOTYA-SES-ARKA-01 / NOTYA-SES-TEK-CEVAP-01 —
 * aynı ses sorusu model bitmeden ikinci kez Custom LLM / Fish'e düşmesin
 * (açık mik + gecikmeli transcript → 2–3 aynı klinik balon).
 *
 * Kilit `asistan_sessions.active_context.sesTurKilit` üzerinde; TTL kısa.
 * Claim-id + yeniden okuma: read-modify-write yarışında yalnız bir tur kazanır.
 */
import { randomUUID } from 'node:crypto'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { ayniIstekYeniBilgiYokMu } from '@/lib/asistan/sesTurKapisi'

const TTL_MS = 45_000

export type SesTurKilit = { mesaj: string; zaman: string; claimId?: string }

function sozNorm(s: string): string {
  return String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR')
}

export function sesTurKilitAyniMi(mesaj: string, kilit: SesTurKilit | null | undefined, simdiMs = Date.now()): boolean {
  if (!kilit?.mesaj || !kilit.zaman) return false
  const t = Date.parse(kilit.zaman)
  if (!Number.isFinite(t) || simdiMs - t > TTL_MS) return false
  const a = sozNorm(mesaj)
  const b = sozNorm(kilit.mesaj)
  if (!a || !b) return false
  if (a === b) return true
  return ayniIstekYeniBilgiYokMu(mesaj, kilit.mesaj)
}

function baglamOku(row: unknown): Record<string, unknown> {
  return (((row as { active_context?: Record<string, unknown> | null } | null)?.active_context) || {}) as Record<string, unknown>
}

/** Supabase client (loosely typed — avoid deep Postgrest generics). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = { from: (t: string) => any }

/**
 * Claim: meşgulse false. Yazımdan sonra yeniden okuyup claimId doğrular —
 * iki eşzamanlı Custom LLM / fish-tur ikisi de true alamaz.
 * Hata durumunda çağıran fail-closed (false) kullanmalı.
 */
export async function sesTurKilidiAl(
  sb: Sb,
  doktorId: string,
  oturumId: string,
  mesaj: string,
): Promise<boolean> {
  const claimId = randomUUID()
  const { data, error } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  if (error) throw error
  const baglam = baglamOku(data)
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  if (sesTurKilitAyniMi(mesaj, mevcut)) return false
  const kilit: SesTurKilit = {
    mesaj: String(mesaj || '').slice(0, 500),
    zaman: new Date().toISOString(),
    claimId,
  }
  const { error: yazErr } = await sb.from('asistan_sessions').update({ active_context: { ...baglam, sesTurKilit: kilit } }).eq('id', oturumId).eq('doctor_id', doktorId)
  if (yazErr) throw yazErr
  const { data: tekrar, error: okuErr } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  if (okuErr) throw okuErr
  const yazilan = baglamOku(tekrar).sesTurKilit as SesTurKilit | undefined
  if (yazilan?.claimId === claimId) return true
  // Başka tur üzerine yazdı — aynı soruysa kaybettik; farklı soruysa da çifte beyin açma.
  return false
}

export async function sesTurKilidiBirak(sb: Sb, doktorId: string, oturumId: string, mesaj?: string): Promise<void> {
  const { data } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = { ...baglamOku(data) }
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  if (mesaj && mevcut && !sesTurKilitAyniMi(mesaj, mevcut, Date.now() + TTL_MS)) return
  delete baglam.sesTurKilit
  await sb.from('asistan_sessions').update({ active_context: baglam }).eq('id', oturumId).eq('doctor_id', doktorId)
}

/** Test / log helper — normalized token fingerprint. */
export function sesTurKilitAnahtar(mesaj: string): string {
  return trAramaNormalize(String(mesaj || '')).replace(/\s+/g, ' ').trim().slice(0, 200)
}
