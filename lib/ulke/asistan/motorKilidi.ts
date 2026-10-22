/**
 * AU-CANLI-01 — the agent's delivery and VOICE are re-read and, if they have drifted, written back before every call
 * (Türkiye's lib/asistan/sesMotoru.ts, NOTYA-SES-KILIT-01, for a country). Two things are held:
 *
 *   1. the delivery — Flash v2.5, fixed speed 1, no expressive mode (a dashboard change cannot stick), and
 *   2. the VOICE — the agent's voice must be the pack's voice for that agent's gender. This is how "exactly two
 *      voices, never a third" is kept true in the provider's account and not only in this repository.
 *
 * A failed read or write never blocks the call (the call then starts as the agent is) but is logged by kind, never with
 * a body: the provider's error text may quote the prompt.
 */
import { SES_MODEL_ID, SES_SES_AYARLARI } from '../uygulama/sesSentez'

export type MotorGorunen = {
  model_id?: string
  voice_id?: string
  expressive_mode?: boolean
  speed?: number | null
  stability?: number | null
  similarity_boost?: number | null
  suggested_audio_tags?: unknown[] | null
  agent_output_audio_format?: string
}

const yakin = (a: unknown, b: number): boolean => typeof a === 'number' && Math.abs(a - b) < 0.001

/** true = the agent is not the known-good delivery with the pack's voice. */
export function motorKilidiGerekli(tts: MotorGorunen | null | undefined, sesId: string): boolean {
  if (!tts) return true
  if (tts.model_id !== SES_MODEL_ID) return true
  if (tts.voice_id !== sesId) return true
  if (tts.expressive_mode === true) return true
  if (!yakin(tts.speed ?? 1, SES_SES_AYARLARI.speed)) return true
  if (!yakin(tts.stability, SES_SES_AYARLARI.stability)) return true
  if (!yakin(tts.similarity_boost, SES_SES_AYARLARI.similarity_boost)) return true
  if (Array.isArray(tts.suggested_audio_tags) && tts.suggested_audio_tags.length > 0) return true
  return false
}

/** The fields this code owns, and no others (spreading the whole object has been refused by the provider). */
export function motorKilidiGovdesi(sesId: string, gorunen?: MotorGorunen | null) {
  return {
    conversation_config: {
      tts: {
        model_id: SES_MODEL_ID,
        voice_id: sesId,
        expressive_mode: false,
        speed: SES_SES_AYARLARI.speed,
        stability: SES_SES_AYARLARI.stability,
        similarity_boost: SES_SES_AYARLARI.similarity_boost,
        suggested_audio_tags: [] as [],
        ...(gorunen?.agent_output_audio_format ? { agent_output_audio_format: gorunen.agent_output_audio_format } : {}),
      },
    },
  }
}

const ADRES = 'https://api.elevenlabs.io/v1/convai/agents'
const ZAMAN_MS = 2_500
const ONBELLEK_MS = 60_000
const onbellek = new Map<string, number>()

export function motorOnbelleginiSil(): void {
  onbellek.clear()
}

export type MotorSonuc = { durum: 'tamam' | 'onbellek' | 'okunamadi' | 'yazilamadi' | 'yok'; degisti: boolean }

export async function motoruSabitle(ajan: string, sesId: string, anahtar: string, fetchFn: typeof fetch = fetch): Promise<MotorSonuc> {
  if (!ajan || !sesId || !anahtar) return { durum: 'yok', degisti: false }
  const simdi = Date.now()
  const son = onbellek.get(`${ajan}:${sesId}`)
  if (son && simdi - son < ONBELLEK_MS) return { durum: 'onbellek', degisti: false }
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  const baslik = { 'xi-api-key': anahtar, 'content-type': 'application/json' }
  try {
    const getir = await fetchFn(`${ADRES}/${ajan}`, { headers: baslik, cache: 'no-store', signal: kontrol.signal })
    if (!getir.ok) { console.error(`[ulke/asistan] agent read answered ${getir.status}`); return { durum: 'okunamadi', degisti: false } }
    const veri = (await getir.json()) as { conversation_config?: { tts?: MotorGorunen } }
    const tts = veri?.conversation_config?.tts
    if (!motorKilidiGerekli(tts, sesId)) { onbellek.set(`${ajan}:${sesId}`, simdi); return { durum: 'tamam', degisti: false } }
    console.error('[ulke/asistan] agent drifted from the pack voice or delivery; writing it back')
    const yama = await fetchFn(`${ADRES}/${ajan}`, { method: 'PATCH', headers: baslik, body: JSON.stringify(motorKilidiGovdesi(sesId, tts)), signal: kontrol.signal })
    if (!yama.ok) { console.error(`[ulke/asistan] agent write answered ${yama.status}`); return { durum: 'yazilamadi', degisti: false } }
    onbellek.set(`${ajan}:${sesId}`, simdi)
    return { durum: 'tamam', degisti: true }
  } catch (e) {
    console.error(`[ulke/asistan] agent lock: ${e instanceof Error ? e.name : typeof e}`)
    return { durum: 'okunamadi', degisti: false }
  } finally {
    clearTimeout(zaman)
  }
}

/** The one-time WebSocket address of a call. null = the provider did not give one. */
export async function imzaliAdresAl(ajan: string, anahtar: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const r = await fetchFn(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(ajan)}`, {
      headers: { 'xi-api-key': anahtar }, cache: 'no-store', signal: AbortSignal.timeout(8_000),
    })
    if (!r.ok) { console.error(`[ulke/asistan] signed url answered ${r.status}`); return null }
    const v = (await r.json()) as { signed_url?: unknown }
    return typeof v.signed_url === 'string' && v.signed_url.startsWith('wss://') ? v.signed_url : null
  } catch (e) {
    console.error(`[ulke/asistan] signed url: ${e instanceof Error ? e.name : typeof e}`)
    return null
  }
}
