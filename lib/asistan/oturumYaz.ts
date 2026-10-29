/**
 * SES-OMURGA-V2 (F) — the one writer of the shared assistant session (asistan_sessions).
 *
 * History is APPEND-ONLY and active_context is merged FIELD BY FIELD (asistan_gecmis_ekle, migration 183): a turn
 * appends its own lines and sets only the keys it owns, so two overlapping turns (a background answer after a cut,
 * a voice turn and a text turn, a supersede race) can no longer erase each other's lines or the other turn's keys.
 * The old writer copied a turn-start snapshot of the whole array and the whole object back (lost updates) and cut the
 * stored history to 20 messages; the stored history is now capped at 300, the model still gets a short window.
 *
 * A voice request carries its turn identity (`ses`): the database refuses the write when a newer request for the same
 * call and turn position exists — only the request ElevenLabs actually plays reaches the history.
 *
 * Falls back to a read-modify-write when the function is not in the database (a country DB the migration has not
 * reached yet). HASTA-IZOLASYON-01: every read and write is narrowed by id AND doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const SAKLANAN_GECMIS_AZAMI = 300

export interface GecmisEkleGirdisi {
  oturumId: string
  doktorId: string
  /** Lines to append (in order). */
  yeni: unknown[]
  /** active_context keys this turn sets (merged over the live object). */
  yama?: Record<string, unknown>
  /** active_context keys this turn removes (applied before `yama`). */
  sil?: string[]
  /** ISO time the turn started — a page focus newer than this is kept (NOTYA-SAYFA-HASTA-01). */
  turBas?: string | null
  hastaYaz?: string | null
  hastaNull?: boolean
  persona?: string | null
  /** Persona switch: the history restarts with these lines. */
  sifirla?: boolean
  /** Voice turn identity: refused when superseded; on success the turn is marked answered with what was spoken. */
  ses?: { cagri: string; tur: number; seq: number; soz?: string | null } | null
}

export type GecmisEkleSonucu = { yazildi: boolean; ustune?: boolean; yedek?: boolean }

type Rpcli = { rpc?: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }> }

function fonksiyonYokMu(e: { message?: string; code?: string } | null | undefined, ad: string): boolean {
  if (!e) return false
  const m = String(e.message || '')
  return e.code === 'PGRST202' || e.code === '42883' || m.includes(ad) || /desteklenmeyen rpc/.test(m)
}

export async function gecmisEkle(sb: SupabaseClient, g: GecmisEkleGirdisi): Promise<GecmisEkleSonucu> {
  const istemci = sb as unknown as Rpcli
  if (typeof istemci.rpc === 'function') {
    const r = await Promise.resolve(istemci.rpc('asistan_gecmis_ekle', {
      p_oturum: g.oturumId, p_doktor: g.doktorId, p_yeni: g.yeni, p_yama: g.yama || {}, p_sil: g.sil || [],
      p_tur_bas: g.turBas ?? null, p_hasta_yaz: g.hastaYaz ?? null, p_hasta_null: Boolean(g.hastaNull),
      p_persona: g.persona ?? null, p_sifirla: Boolean(g.sifirla),
      p_cagri: g.ses?.cagri ?? null, p_tur: g.ses?.tur ?? null, p_seq: g.ses?.seq ?? null, p_soz: g.ses?.soz ?? null,
      p_azami: SAKLANAN_GECMIS_AZAMI,
    })).catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : String(e), code: 'THROWN' } }))
    if (!r.error) {
      const d = (r.data || {}) as { yazildi?: boolean; ustune?: boolean }
      return { yazildi: Boolean(d.yazildi), ...(d.ustune ? { ustune: true } : {}) }
    }
    if (!fonksiyonYokMu(r.error, 'asistan_gecmis_ekle')) throw new Error(String(r.error.message || 'asistan_gecmis_ekle'))
  }
  // Fallback: read-modify-write (no supersede check — the old database has no turn registry either).
  const { data, error } = await sb.from('asistan_sessions').select('messages, active_context').eq('id', g.oturumId).eq('doctor_id', g.doktorId).maybeSingle()
  if (error) throw error
  if (!data) return { yazildi: false, yedek: true }
  const satir = data as { messages?: unknown[] | null; active_context?: Record<string, unknown> | null }
  const ac: Record<string, unknown> = { ...(satir.active_context || {}) }
  const yama = { ...(g.yama || {}) }
  const sayfa = ac.odakKaynak === 'sayfa' && ac.currentPatientId != null && String(ac.odakZaman || '') > String(g.turBas || '')
  if (sayfa) for (const k of ['currentPatientId', 'patientName', 'odakKaynak', 'odakZaman', 'sesDevam']) delete yama[k]
  for (const k of g.sil || []) delete ac[k]
  const mesajlar = [...(g.sifirla ? [] : (Array.isArray(satir.messages) ? satir.messages : [])), ...g.yeni].slice(-SAKLANAN_GECMIS_AZAMI)
  const guncelle: Record<string, unknown> = { messages: mesajlar, active_context: { ...ac, ...yama } }
  if (g.persona) guncelle.persona_id = g.persona
  if (sayfa) guncelle.patient_id = ac.currentPatientId
  else if (g.hastaYaz) guncelle.patient_id = g.hastaYaz
  else if (g.hastaNull) guncelle.patient_id = null
  await sb.from('asistan_sessions').update(guncelle).eq('id', g.oturumId).eq('doctor_id', g.doktorId)
  return { yazildi: true, yedek: true }
}

/**
 * Windowed read of a session (the ses-ekran poll, 2 per second during a call): the last `pencere` lines and the
 * context, not the whole stored history. Null when the row is not this doctor's.
 */
export async function oturumPenceresi(sb: SupabaseClient, oturumId: string, doktorId: string, pencere = 40): Promise<{ id: string; messages: unknown[]; active_context: Record<string, unknown> } | null> {
  const istemci = sb as unknown as Rpcli
  if (typeof istemci.rpc === 'function') {
    const r = await Promise.resolve(istemci.rpc('asistan_oturum_pencere', { p_oturum: oturumId, p_doktor: doktorId, p_pencere: pencere }))
      .catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : String(e), code: 'THROWN' } }))
    if (!r.error) {
      const d = r.data as { id?: string; messages?: unknown[]; active_context?: Record<string, unknown> } | null
      return d && d.id ? { id: d.id, messages: Array.isArray(d.messages) ? d.messages : [], active_context: d.active_context || {} } : null
    }
    if (!fonksiyonYokMu(r.error, 'asistan_oturum_pencere')) throw new Error(String(r.error.message || 'asistan_oturum_pencere'))
  }
  const { data } = await sb.from('asistan_sessions').select('id, messages, active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  if (!data) return null
  const d = data as { id: string; messages?: unknown[] | null; active_context?: Record<string, unknown> | null }
  return { id: d.id, messages: (Array.isArray(d.messages) ? d.messages : []).slice(-pencere), active_context: d.active_context || {} }
}
