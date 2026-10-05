import { TR_VOICES } from '@/lib/asistan/elevenVoices'

/**
 * REST / sandbox TTS. The live assistant does NOT use this path — ConvAI does.
 * The spoken voice is locked in lib/asistan/sesMotoru.ts (eleven_flash_v2_5,
 * expressive mode off, speed 1). optimize_streaming_latency is kept at 1 for
 * this helper; ElevenLabs now ignores the field on agents, and level 3 used to
 * slurry Turkish ("pediatre" for "pediatri"). Never use level 4 — it turns the
 * text normalizer OFF and mispronounces numbers/dates.
 *
 * Flash v2.5 does not spell numbers by default (ElevenLabs docs + community):
 * we pre-normalize via elevenMetni / tibbiSeslendir, and still ask the API for
 * apply_text_normalization + language_code=tr as a belt-and-braces fallback
 * (Enterprise enables Flash normalization; others ignore the flag safely).
 */
export const AYSE_TTS_SETTINGS = {
  model_id: 'eleven_flash_v2_5' as const,
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0,
  speed: 1.0,
  optimize_streaming_latency: 1,
  /** ISO 639-1 — helps non-multilingual Flash pick Turkish number rules when any digit leaks. */
  language_code: 'tr' as const,
  /** Prefer spelling numbers/dates when the account supports it (no-op otherwise). */
  apply_text_normalization: 'on' as const,
}

/** Prefer TR Ayşe Hanım voice over English Sarah/Jessica defaults. */
const DEFAULT_VOICE_ID = TR_VOICES.ayseHanim.voiceId

export function getDrAyseVoiceId(): string {
  return process.env.DR_AYSE_VOICE_ID || DEFAULT_VOICE_ID
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
  if (!apiKey) {
    throw new Error('ElevenLabs API key missing')
  }

  const voiceId = getDrAyseVoiceId()
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: AYSE_TTS_SETTINGS.model_id,
      optimize_streaming_latency: AYSE_TTS_SETTINGS.optimize_streaming_latency,
      language_code: AYSE_TTS_SETTINGS.language_code,
      apply_text_normalization: AYSE_TTS_SETTINGS.apply_text_normalization,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0,
        speed: AYSE_TTS_SETTINGS.speed,
        use_speaker_boost: true,
      },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`ElevenLabs TTS ${resp.status}: ${err.slice(0, 200)}`)
  }

  return resp.arrayBuffer()
}
