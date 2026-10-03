/**
 * NOTYA-BUYUME-KISA-01 / NOTYA-SES-ARKA-01 — aynı ses sorusu model bitmeden ikinci kez
 * Custom LLM'e düşmesin (açık mik + gecikmeli transcript → 2–3 aynı klinik balon).
 *
 * Kilit `asistan_sessions.active_context.sesTurKilit` üzerinde; TTL kısa.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { ayniIstekYeniBilgiYokMu } from '@/lib/asistan/sesTurKapisi'

const TTL_MS = 45_000

export type SesTurKilit = { mesaj: string; zaman: string }

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

/** Supabase client (loosely typed — avoid deep Postgrest generics). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = { from: (t: string) => any }

/** Atomik-ish claim: meşgulse false. */
export async function sesTurKilidiAl(
  sb: Sb,
  doktorId: string,
  oturumId: string,
  mesaj: string,
): Promise<boolean> {
  const { data } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = ((data as { active_context?: Record<string, unknown> | null } | null)?.active_context || {}) as Record<string, unknown>
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  if (sesTurKilitAyniMi(mesaj, mevcut)) return false
  const kilit: SesTurKilit = { mesaj: String(mesaj || '').slice(0, 500), zaman: new Date().toISOString() }
  await sb.from('asistan_sessions').update({ active_context: { ...baglam, sesTurKilit: kilit } }).eq('id', oturumId).eq('doctor_id', doktorId)
  return true
}

export async function sesTurKilidiBirak(sb: Sb, doktorId: string, oturumId: string, mesaj?: string): Promise<void> {
  const { data } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = { ...(((data as { active_context?: Record<string, unknown> | null } | null)?.active_context || {}) as Record<string, unknown>) }
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  if (mesaj && mevcut && !sesTurKilitAyniMi(mesaj, mevcut, Date.now() + TTL_MS)) return
  delete baglam.sesTurKilit
  await sb.from('asistan_sessions').update({ active_context: baglam }).eq('id', oturumId).eq('doctor_id', doktorId)
}

/** Test / log helper — normalized token fingerprint. */
export function sesTurKilitAnahtar(mesaj: string): string {
  return trAramaNormalize(String(mesaj || '')).replace(/\s+/g, ' ').trim().slice(0, 200)
}
