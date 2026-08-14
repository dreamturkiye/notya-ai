import { TR_VOICES } from '@/lib/asistan/elevenVoices'

/**
 * ConvAI / sandbox TTS: Eleven Flash v2.5 (official Agents defaults).
 * Docs: stability 0.5, similarity_boost 0.8, speed 1.0, model eleven_flash_v2_5.
 * optimize_streaming_latency: 3 (max opts with normalizer). Do not set to 1.
 * style kept at 0 for Flash — style exaggeration can stretch/warp prosody.
 */
export const AYSE_TTS_SETTINGS = {
  model_id: 'eleven_flash_v2_5' as const,
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0,
  speed: 1,
  optimize_streaming_latency: 3,
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
      voice_settings: {
        stability: AYSE_TTS_SETTINGS.stability,
        similarity_boost: AYSE_TTS_SETTINGS.similarity_boost,
        style: AYSE_TTS_SETTINGS.style,
        speed: AYSE_TTS_SETTINGS.speed,
      },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`ElevenLabs TTS ${resp.status}: ${err.slice(0, 200)}`)
  }

  return resp.arrayBuffer()
}
