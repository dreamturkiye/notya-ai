/**
 * NOTYA-SES-KILIT-01 (Kaan / Dr. Gökhan, 2026-09-27).
 *
 * The slur and the "slows right down, then rushes to catch up" came back because the
 * ConvAI agent — not the REST helper in lib/dr-ayse/tts.ts — is what the doctor hears.
 * Eleven v3 Conversational (expressive mode, on by default for that model) changes
 * speed and stability on its own: [slow], rushes, collapsed Turkish endings. Flash v2.5
 * at a fixed speed is the setting that already stopped this once. optimize_streaming_latency
 * is now a no-op on ElevenLabs' side, so it can no longer be the fix.
 *
 * Every signed-url mint re-reads the agent and, if it has drifted, patches it back
 * before the call starts. A dashboard change cannot stick.
 */
import { AYSE_TTS_SETTINGS } from '@/lib/dr-ayse/tts'

export const SES_MODEL_ID = 'eleven_flash_v2_5' as const

/** Fixed delivery. Speed is exactly 1 — v3's "acting" is not allowed on a clinical voice. */
export const SES_TTS_KILIT = {
  model_id: SES_MODEL_ID,
  expressive_mode: false,
  speed: 1,
  stability: AYSE_TTS_SETTINGS.stability,
  similarity_boost: AYSE_TTS_SETTINGS.similarity_boost,
  optimize_streaming_latency: AYSE_TTS_SETTINGS.optimize_streaming_latency,
  suggested_audio_tags: [] as [],
}

export type SesTtsGorunen = {
  model_id?: string
  voice_id?: string
  agent_output_audio_format?: string
  expressive_mode?: boolean
  speed?: number | null
  stability?: number | null
  similarity_boost?: number | null
  suggested_audio_tags?: unknown[] | null
}

const ONBELLEK_MS = 60_000
const ZAMAN_MS = 2_500
const onbellek = new Map<string, number>()

function yakin(a: unknown, b: number): boolean {
  return typeof a === 'number' && Math.abs(a - b) < 0.001
}

/** True when the live agent is not the known-good Flash delivery. */
export function ttsKilitGerekli(tts: SesTtsGorunen | null | undefined): boolean {
  if (!tts) return true
  if (tts.model_id !== SES_MODEL_ID) return true
  if (tts.expressive_mode === true) return true
  if (!yakin(tts.speed ?? 1, SES_TTS_KILIT.speed)) return true
  if (!yakin(tts.stability, SES_TTS_KILIT.stability)) return true
  if (!yakin(tts.similarity_boost, SES_TTS_KILIT.similarity_boost)) return true
  if (Array.isArray(tts.suggested_audio_tags) && tts.suggested_audio_tags.length > 0) return true
  return false
}

/** Test-only: the in-memory "already locked" window. */
export function sesMotoruOnbelleginiSil(): void {
  onbellek.clear()
}

export type SesMotorSonuc = { once: string; degisti: boolean }

/**
 * Read the agent. If TTS has drifted off Flash / fixed speed, PATCH it back.
 * Failure never blocks the call — the player fix and the speech gate still apply —
 * but the drift is logged so it cannot pass silently.
 */
export async function sesMotorunuSabitle(agentId: string, apiKey: string, fetchFn: typeof fetch = fetch): Promise<SesMotorSonuc> {
  if (!agentId || !apiKey) return { once: 'yok', degisti: false }
  const simdi = Date.now()
  const son = onbellek.get(agentId)
  if (son && simdi - son < ONBELLEK_MS) return { once: 'onbellek', degisti: false }

  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  const baslik = { 'xi-api-key': apiKey, 'content-type': 'application/json' }
  try {
    const getir = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: baslik, cache: 'no-store', signal: kontrol.signal,
    })
    if (!getir.ok) {
      console.error('[ses-motoru] okunamadı', agentId, getir.status)
      return { once: 'okunamadi', degisti: false }
    }
    const ajan = await getir.json() as { conversation_config?: { tts?: SesTtsGorunen } }
    const tts = ajan?.conversation_config?.tts
    const once = `model=${tts?.model_id || '-'} expressive=${tts?.expressive_mode === true} speed=${tts?.speed ?? '-'} stability=${tts?.stability ?? '-'}`
    if (!ttsKilitGerekli(tts)) {
      onbellek.set(agentId, simdi)
      return { once, degisti: false }
    }
    console.error('[ses-motoru] sapma, Flash kilidine alınıyor', agentId, once)
    // Only the fields we own. Spreading the whole TTS object has been rejected
    // (read-only keys); voice_id is kept on both attempts so a failed first write
    // cannot reset the persona's voice.
    const kilit = {
      ...SES_TTS_KILIT,
      ...(tts?.voice_id ? { voice_id: tts.voice_id } : {}),
      ...(tts?.agent_output_audio_format ? { agent_output_audio_format: tts.agent_output_audio_format } : {}),
    }
    const govde = (formatla: boolean) => JSON.stringify({
      conversation_config: {
        tts: formatla ? kilit : { ...SES_TTS_KILIT, ...(tts?.voice_id ? { voice_id: tts.voice_id } : {}) },
      },
    })
    let yama = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH', headers: baslik, body: govde(true), signal: kontrol.signal,
    })
    if (!yama.ok) {
      const hata = await yama.text().catch(() => '')
      console.error('[ses-motoru] tam yama reddedildi, dar yama', agentId, yama.status, hata.slice(0, 240))
      yama = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH', headers: baslik, body: govde(false), signal: kontrol.signal,
      })
    }
    if (!yama.ok) {
      const hata = await yama.text().catch(() => '')
      console.error('[ses-motoru] kilit yazılamadı', agentId, yama.status, hata.slice(0, 240))
      return { once, degisti: false }
    }
    onbellek.set(agentId, simdi)
    return { once, degisti: true }
  } catch (e) {
    console.error('[ses-motoru]', e instanceof Error ? e.name : 'hata')
    return { once: 'hata', degisti: false }
  } finally {
    clearTimeout(zaman)
  }
}
