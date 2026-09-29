/**
 * NOTYA-FISH-AYSE-01 — Ayşe Kaya (pediatri) speaks with Fish Haberci (female), not ElevenLabs.
 *
 * Locked with Kaan, 2026-09-29: Haberci / Turkey host female, speed 1.0, no emotion,
 * language locked to Turkish, a short [break] between sentences. Model is the free
 * developer tier (s2.1-pro-free) through 30 Nov 2026. Other specialists stay on ElevenLabs.
 */

export const FISH_HABER_SES_ID = '27d0d61d7dc8479da8dfd991ae3ad66b'
export const FISH_MODEL = 's2.1-pro-free'
export const FISH_ASR_MODEL = 'transcribe-1'
export const FISH_HIZ = 1
export const FISH_ORNEK_HZ = 24000

/** Multipart filename Fish's ASR decoder keys off, matching the blob's container. */
export function fishAsrDosyaAdi(mime: string): string {
  const t = String(mime || '').toLowerCase()
  if (t.includes('wav')) return 'tur.wav'
  if (t.includes('mpeg') || t.includes('mp3')) return 'tur.mp3'
  if (t.includes('mp4') || t.includes('m4a') || t.includes('aac')) return 'tur.m4a'
  if (t.includes('ogg')) return 'tur.ogg'
  return 'tur.webm'
}

/** Ayşe Kaya is a full Fish call (mic + TTS). Other specialists stay on ElevenLabs ConvAI. */
export function ayseFishTamMi(personaId: string | null | undefined, anahtar = process.env.FISH_API_KEY): boolean {
  return personaId === 'aysekaya' && Boolean(String(anahtar || '').trim())
}

/** Fish ASR may wrap turns in speaker / emotion tags — the brain gets plain Turkish. */
export function fishAsrMetni(ham: string | null | undefined): string {
  return String(ham || '')
    .replace(/<\|speaker:\d+\|>/g, ' ')
    .replace(/\[[^\]]{1,40}\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ETIKET = /\[[^\]]{0,120}\]/g

const BIR = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'] as const
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'] as const

/** Fish's news voice reads digits in English ("fifty seven"). Spell them in Turkish first. */
export function fishSayiOku(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n)
  if (n < 10) return BIR[n]
  if (n < 20) return n === 10 ? 'on' : `on ${BIR[n % 10]}`
  if (n < 100) {
    const o = ONLAR[Math.floor(n / 10)]
    const b = n % 10
    return b ? `${o} ${BIR[b]}` : o
  }
  if (n < 1000) {
    const y = Math.floor(n / 100)
    const k = n % 100
    const bas = y === 1 ? 'yüz' : `${BIR[y]} yüz`
    return k ? `${bas} ${fishSayiOku(k)}` : bas
  }
  const bin = Math.floor(n / 1000)
  const k = n % 1000
  const bas = bin === 1 ? 'bin' : `${BIR[bin]} bin`
  return k ? `${bas} ${fishSayiOku(k)}` : bas
}

export function fishRakamlariOku(metin: string): string {
  return String(metin || '')
    .replace(/\b(\d{1,2})[:.](\d{2})\b/g, (_, s, dk) => {
      const saat = fishSayiOku(Number(s))
      return dk === '00' ? saat : `${saat} ${fishSayiOku(Number(dk))}`
    })
    .replace(/\b(\d{1,4})[.,](\d)\b/g, (_, t, o) => `${fishSayiOku(Number(t))} virgül ${fishSayiOku(Number(o))}`)
    .replace(/\b(\d{1,4})\b/g, (_, d) => fishSayiOku(Number(d)))
}

/** Strip any bracket cue, then put one short pause between sentences. */
export function fishMetni(ham: string): string {
  const duz = fishRakamlariOku(String(ham || '').replace(ETIKET, ' ').replace(/[—–]/g, ',').replace(/\s+/g, ' ').trim())
  if (!duz) return ''
  const cumleler = duz.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean)
  return cumleler.join(' [break] ')
}

export function fishIstegi(metin: string): { model: string; govde: Record<string, unknown> } | null {
  const text = fishMetni(metin)
  if (!text || /^[.,;:!?…\-–—'"]+$/.test(text.replace(/\s|\[break\]/g, ''))) return null
  return {
    model: FISH_MODEL,
    govde: {
      text,
      reference_id: FISH_HABER_SES_ID,
      language: 'tr',
      format: 'pcm',
      sample_rate: 24000,
      temperature: 0.7,
      top_p: 0.7,
      normalize: false,
      latency: 'low',
      chunk_length: 120,
      prosody: { speed: FISH_HIZ, volume: 0, normalize_loudness: true },
    },
  }
}
