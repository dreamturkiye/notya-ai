/**
 * NOTYA-FISH-AYSE-01 — Ayşe Kaya (pediatri) speaks with Fish, not ElevenLabs.
 *
 * Locked with Kaan, 2026-09-28: haber sunucusu, speed 1.0, no emotion,
 * a short [break] between sentences. Model is the free developer tier
 * (s2.1-pro-free) through 30 Nov 2026. Other specialists stay on ElevenLabs.
 */

export const FISH_HABER_SES_ID = '27d0d61d7dc8479da8dfd991ae3ad66b'
export const FISH_MODEL = 's2.1-pro-free'
export const FISH_HIZ = 1
export const FISH_ORNEK_HZ = 24000

const ETIKET = /\[[^\]]{0,120}\]/g

/** Strip any bracket cue, then put one short pause between sentences. */
export function fishMetni(ham: string): string {
  const duz = String(ham || '').replace(ETIKET, ' ').replace(/\s+/g, ' ').trim()
  if (!duz) return ''
  const cumleler = duz.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean)
  return cumleler.join(' [break] ')
}

export function fishIstegi(metin: string): { model: string; govde: Record<string, unknown> } | null {
  const text = fishMetni(metin)
  if (!text) return null
  return {
    model: FISH_MODEL,
    govde: {
      text,
      reference_id: FISH_HABER_SES_ID,
      format: 'pcm',
      sample_rate: 24000,
      temperature: 0.7,
      top_p: 0.7,
      normalize: true,
      latency: 'low',
      chunk_length: 120,
      prosody: { speed: FISH_HIZ, volume: 0, normalize_loudness: true },
    },
  }
}
