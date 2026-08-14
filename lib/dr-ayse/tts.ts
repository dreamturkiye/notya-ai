import { TR_VOICES } from '@/lib/asistan/elevenVoices'

/**
 * ConvAI / sandbox TTS: Eleven Flash v2.5.
 * stability 0.55, similarity_boost 0.75, speed 1.0, style 0.
 * optimize_streaming_latency: 1 — level 3 was causing slurry artifacts on Turkish
 * (blended words, collapsed endings like “pediatre” instead of “pediatri”).
 */
export const AYSE_TTS_SETTINGS = {
  model_id: 'eleven_flash_v2_5' as const,
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0,
  speed: 1.0,
  optimize_streaming_latency: 1,
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
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0,
        speed: 1.0,
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
