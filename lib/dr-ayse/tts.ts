import { AYSE_TTS_SETTINGS, TR_VOICES } from '@/lib/asistan/elevenVoices'

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
      voice_settings: {
        stability: AYSE_TTS_SETTINGS.stability,
        similarity_boost: AYSE_TTS_SETTINGS.similarity_boost,
        style: 0,
        use_speaker_boost: AYSE_TTS_SETTINGS.use_speaker_boost,
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
