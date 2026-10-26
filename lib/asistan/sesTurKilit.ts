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
export type SesSonSoz = { mesaj: string; soz: string; zaman: string }

function sozNorm(s: string): string {
  return String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR')
}

export function sesTurKilitAyniMi(mesaj: string, kilit: SesTurKilit | null | undefined, simdiMs = Date.now(), yalnizBirebir = false): boolean {
  if (!kilit?.mesaj || !kilit.zaman) return false
  const t = Date.parse(kilit.zaman)
  if (!Number.isFinite(t) || simdiMs - t > TTL_MS) return false
  const a = sozNorm(mesaj)
  const b = sozNorm(kilit.mesaj)
  if (!a || !b) return false
  if (a === b) return true
  // An answer to the assistant's question ("yarın saat 11.00'de") looks like the doctor's earlier line: only the same words count.
  if (yalnizBirebir) return false
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
  yalnizBirebir = false,
): Promise<boolean> {
  const claimId = randomUUID()
  const { data, error } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  if (error) throw error
  const baglam = baglamOku(data)
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  if (sesTurKilitAyniMi(mesaj, mevcut, Date.now(), yalnizBirebir)) return false
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

export async function sesTurKilidiBirak(sb: Sb, doktorId: string, oturumId: string, mesaj?: string, soylenen?: string): Promise<void> {
  const { data } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = { ...baglamOku(data) }
  const mevcut = baglam.sesTurKilit as SesTurKilit | undefined
  // (It used to pass `Date.now() + TTL_MS`, which made every lock look expired → this returned early and the lock was never released.)
  if (mesaj && mevcut && !sesTurKilitAyniMi(mesaj, mevcut, Date.now())) return
  delete baglam.sesTurKilit
  // SES-DUP-01: what this turn said, for the duplicate request that lost the lock (see sesSonSozBekle).
  if (mesaj && soylenen && soylenen.trim()) baglam.sesSonSoz = { mesaj: String(mesaj).slice(0, 500), soz: soylenen.slice(0, 1500), zaman: new Date().toISOString() } satisfies SesSonSoz
  await sb.from('asistan_sessions').update({ active_context: baglam }).eq('id', oturumId).eq('doctor_id', doktorId)
}

/** The session row `ses_turu_ac` returns alongside the claim — saves the separate history read AND ayseCevapla's re-read. */
export type SesOturumSatiri = { id: string; messages: unknown[]; active_context: Record<string, unknown>; persona_id: string | null; patient_id: string | null }
export type SesTuruAcSonucu = { yok: boolean; kazandi: boolean; oncekiKilit: SesTurKilit | null; satir: SesOturumSatiri | null }

/**
 * SES-LAT-02 (Kaan, 2026-10-26 — launch audit): the old claim was read + write + verify-read, three round trips
 * (~350–600 ms on cle1 ↔ Supabase) before a voice turn could start, and it ran AFTER a separate history read — four
 * trips in all. `ses_turu_ac` (migration 152) does the row lock, the claim and the row read in ONE statement under
 * FOR UPDATE, so it is also genuinely atomic (the optimistic dance only probabilistically was). SQL compares the
 * EXACT normalized fingerprint (`anahtar`, computed here — SQL lower() is not tr-TR aware); the fuzzy same-info
 * check (ayniIstekYeniBilgiYokMu) stays in TS on the returned previous lock, exactly as before:
 *   · live lock, same fingerprint        → kazandi=false (duplicate — loser)
 *   · live lock, different message       → claim steals it (a real second question must not be blocked)
 *   · claimed, but TS fuzzy says same    → demoted to loser by the caller (unless yalnizBirebir)
 * Falls back to the old three-trip path when the function is missing (a country DB the migration has not reached).
 * Any error throws — callers stay fail-closed.
 */
export async function sesTurunuAc(sb: Sb & { rpc?: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }> }, doktorId: string, oturumId: string, mesaj: string): Promise<SesTuruAcSonucu> {
  const claimId = randomUUID()
  if (typeof sb.rpc === 'function') {
    const { data, error } = await Promise.resolve(sb.rpc('ses_turu_ac', {
      p_oturum: oturumId, p_doktor: doktorId,
      p_mesaj: String(mesaj || '').slice(0, 500), p_anahtar: sesTurKilitAnahtar(mesaj), p_claim: claimId,
    })).catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : String(e), code: 'THROWN' } }))
    if (!error) {
      const r = (data || {}) as { yok?: boolean; kazandi?: boolean; oncekiKilit?: SesTurKilit | null; satir?: SesOturumSatiri | null }
      return { yok: Boolean(r.yok), kazandi: Boolean(r.kazandi), oncekiKilit: r.oncekiKilit ?? null, satir: r.satir ?? null }
    }
    // PGRST202: the function is not in this database yet — old path below. Any other error is a real failure.
    if (error.code !== 'PGRST202' && error.code !== 'THROWN' && !/ses_turu_ac/.test(String(error.message || ''))) throw new Error(String(error.message || 'ses_turu_ac'))
  }
  const { data: row, error } = await sb.from('asistan_sessions').select('id, messages, active_context, persona_id, patient_id').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  if (error) throw error
  if (!row) return { yok: true, kazandi: false, oncekiKilit: null, satir: null }
  const baglam = baglamOku(row)
  const oncekiKilit = (baglam.sesTurKilit as SesTurKilit | undefined) ?? null
  const kazandi = await sesTurKilidiAl(sb, doktorId, oturumId, mesaj, true)
  const r = row as unknown as SesOturumSatiri
  return { yok: false, kazandi, oncekiKilit, satir: { id: r.id, messages: Array.isArray(r.messages) ? r.messages : [], active_context: baglam, persona_id: r.persona_id ?? null, patient_id: r.patient_id ?? null } }
}

/** Test / log helper — normalized token fingerprint. */
export function sesTurKilitAnahtar(mesaj: string): string {
  return trAramaNormalize(String(mesaj || '')).replace(/\s+/g, ' ').trim().slice(0, 200)
}

/**
 * SES-DUP-01 (Kaan, 2026-10-25: "it writes but there is no speech"): ElevenLabs sends the same question twice and plays ONE
 * of the two replies. The loser of the lock used to answer with silence; when ElevenLabs picked that one, the doctor got the
 * text bubble (written by the winner) and no voice. The loser now waits for the winner's spoken words and says them.
 * Returns the words, or null when the winner said nothing within `bekleMs`. Reads only this session row (id AND doctor_id).
 */
export async function sesSonSozBekle(sb: Sb, doktorId: string, oturumId: string, mesaj: string, bekleMs = 12_000, aralikMs = 400, simdi: () => number = Date.now): Promise<string | null> {
  const basladi = simdi()
  const hedef = sozNorm(mesaj)
  while (simdi() - basladi < bekleMs) {
    await new Promise((r) => setTimeout(r, aralikMs))
    const { data } = await sb.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
    const s = baglamOku(data).sesSonSoz as SesSonSoz | undefined
    if (s?.soz && sozNorm(s.mesaj) === hedef && Date.parse(s.zaman) >= basladi - 1000) return s.soz
  }
  return null
}
