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
/** ASR language is pinned to Turkish on every call — Fish's auto-detect mislabels short Turkish clips. */
export const FISH_ASR_DIL = 'tr'
export const FISH_ASR_ZAMAN_MS = 20_000
/** One retry on network error / 5xx. 4xx is never retried (same clip, same answer). */
export const FISH_ASR_YENIDEN = 1
/** Junk-clip gate (server side, before Fish is called). */
export const FISH_KLIP_MIN_MS = 600
export const FISH_KLIP_MIN_RMS = 0.006
/** Non-WAV containers (webm/opus, m4a) cannot be measured here: size stands in for duration. */
export const FISH_KLIP_MIN_BAYT = 2048
export const FISH_KLIP_AZAMI_BAYT = 3 * 1024 * 1024
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

/** Multipart body for POST /v1/asr — language always Turkish, never auto-detect. */
export function fishAsrFormu(ses: Blob, ad: string): FormData {
  const giden = new FormData()
  giden.append('audio', ses, ad)
  giden.append('language', FISH_ASR_DIL)
  giden.append('ignore_timestamps', 'true')
  return giden
}

/**
 * Fish auto-detects the language regardless of the `language` hint (docs: "Optional hint. The language is
 * auto-detected regardless"). A transcript with no Latin letters — or dominated by Arabic/Persian, Cyrillic,
 * CJK, Greek, Hebrew script — is a mislabelled clip, not Turkish speech: dropped, never fed to the brain.
 */
export function fishAsrDilUyumluMu(metin: string): boolean {
  const t = String(metin || '')
  const latin = (t.match(/[A-Za-zÇĞİÖŞÜçğıöşüâîû]/g) || []).length
  if (!latin) return false
  const yabanci = (t.match(/[\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0900-\u097F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g) || []).length
  return yabanci * 2 < latin
}

/** Network failure (null) or a 5xx is retried once; anything else is final. */
export function fishAsrYenidenDenenirMi(durum: number | null): boolean {
  return durum === null || durum >= 500
}

export type KlipDenetim = { uygun: boolean; neden: string | null; sureMs: number | null; rms: number | null; bayt: number }

/**
 * Drop clips that would only cost an ASR call: empty / malformed, shorter than
 * FISH_KLIP_MIN_MS, or near-silent. WAV (our PCM path) is measured; other
 * containers fall back to a size check.
 */
export function asrKlipDenetle(bayt: Uint8Array, mime: string): KlipDenetim {
  const n = bayt.byteLength
  if (!n) return { uygun: false, neden: 'bos', sureMs: null, rms: null, bayt: 0 }
  if (n > FISH_KLIP_AZAMI_BAYT) return { uygun: false, neden: 'cok_uzun', sureMs: null, rms: null, bayt: n }
  const wav = String(mime || '').toLowerCase().includes('wav') || (n >= 12 && String.fromCharCode(bayt[0], bayt[1], bayt[2], bayt[3]) === 'RIFF')
  if (!wav) {
    if (n < FISH_KLIP_MIN_BAYT) return { uygun: false, neden: 'kisa_bayt', sureMs: null, rms: null, bayt: n }
    return { uygun: true, neden: null, sureMs: null, rms: null, bayt: n }
  }
  const v = new DataView(bayt.buffer, bayt.byteOffset, bayt.byteLength)
  const oku4 = (o: number) => String.fromCharCode(bayt[o], bayt[o + 1], bayt[o + 2], bayt[o + 3])
  if (n < 44 || oku4(0) !== 'RIFF' || oku4(8) !== 'WAVE') return { uygun: false, neden: 'bozuk', sureMs: null, rms: null, bayt: n }
  let o = 12
  let hz = 0
  let kanal = 1
  let bit = 16
  let veriBas = -1
  let veriBoy = 0
  while (o + 8 <= n) {
    const id = oku4(o)
    const boy = v.getUint32(o + 4, true)
    if (id === 'fmt ' && o + 24 <= n) {
      kanal = v.getUint16(o + 10, true) || 1
      hz = v.getUint32(o + 12, true)
      bit = v.getUint16(o + 22, true) || 16
    } else if (id === 'data') {
      veriBas = o + 8
      veriBoy = Math.min(boy, n - veriBas)
      break
    }
    o += 8 + boy + (boy % 2)
  }
  if (veriBas < 0 || !hz || bit !== 16 || veriBoy < 2) return { uygun: false, neden: 'bozuk', sureMs: null, rms: null, bayt: n }
  const ornekSayisi = Math.floor(veriBoy / 2 / kanal)
  const sureMs = Math.round((ornekSayisi / hz) * 1000)
  let kare = 0
  for (let i = 0; i < ornekSayisi * kanal; i++) {
    const x = v.getInt16(veriBas + i * 2, true) / 0x8000
    kare += x * x
  }
  const rms = Math.sqrt(kare / Math.max(1, ornekSayisi * kanal))
  if (sureMs < FISH_KLIP_MIN_MS) return { uygun: false, neden: 'kisa', sureMs, rms, bayt: n }
  if (rms < FISH_KLIP_MIN_RMS) return { uygun: false, neden: 'sessiz', sureMs, rms, bayt: n }
  return { uygun: true, neden: null, sureMs, rms, bayt: n }
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
