/**
 * NOTYA-FISH-AYSE-01 — Ayşe Kaya (pediatri) speaks with Fish Haberci (female), not ElevenLabs.
 *
 * Locked with Kaan, 2026-09-29: Haberci / Turkey host female, speed 1.0, no emotion,
 * language locked to Turkish, a short [break] between sentences. TTS model for this
 * cadence preview is s2.1-pro (paid). Other specialists stay on ElevenLabs.
 */
import { tibbiSeslendir, type SeslendirmeSecenegi } from '@/lib/ses/tibbiSeslendirme'

export const FISH_HABER_SES_ID = '27d0d61d7dc8479da8dfd991ae3ad66b'
/** Models the hosted API accepts (docs.fish.audio TTS reference, read 2026-09-30). */
export const FISH_MODELLER = ['s2.1-pro', 's2-pro', 's1'] as const
export type FishModel = (typeof FISH_MODELLER)[number]
export const FISH_VARSAYILAN_MODEL: FishModel = 's2.1-pro'
/**
 * NOTYA-FISH-HIZ-01 (2026-09-30 matrix, docs/ARCH-FISH-TTS-LATENCY.md): s2-pro and s1 answered
 * ~50 ms sooner and finished ~500 ms sooner than s2.1-pro on the same six sentences. Voice quality
 * is Kaan's call by ear, so the model is switchable in Vercel (`NOTYA_FISH_MODEL`) without a deploy;
 * the default stays the locked s2.1-pro until he chooses.
 */
export function fishModel(deger: string | undefined = process.env.NOTYA_FISH_MODEL): FishModel {
  const d = String(deger ?? '').trim().toLowerCase()
  return (FISH_MODELLER as readonly string[]).includes(d) ? (d as FishModel) : FISH_VARSAYILAN_MODEL
}
export const FISH_MODEL = fishModel()
/** `latency: "low"` — measured equal to "balanced" and 1.4 s ahead of "normal" (TTFB 1 656 ms). */
export const FISH_GECIKME = 'low'
/**
 * Text chunk Fish synthesises at a time (100–300). 100 gave the earliest first audio on our
 * sentence-sized turns (216 vs 235 ms at 160, 227 at 200); total time did not change.
 */
export const FISH_PARCA = 100
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

function msgpackStr(metin: string): Uint8Array {
  const b = new TextEncoder().encode(metin)
  if (b.length > 31) throw new Error('fish asr str')
  const o = new Uint8Array(1 + b.length)
  o[0] = 0xa0 | b.length
  o.set(b, 1)
  return o
}

function msgpackBin(veri: Uint8Array): Uint8Array {
  const n = veri.byteLength
  let bas: Uint8Array
  if (n < 256) {
    bas = new Uint8Array([0xc4, n])
  } else if (n < 65536) {
    bas = new Uint8Array(3)
    bas[0] = 0xc5
    bas[1] = n >> 8
    bas[2] = n & 255
  } else {
    bas = new Uint8Array(5)
    bas[0] = 0xc6
    new DataView(bas.buffer).setUint32(1, n)
  }
  const o = new Uint8Array(bas.length + n)
  o.set(bas, 0)
  o.set(veri, bas.length)
  return o
}

function msgpackBirlestir(...parca: Uint8Array[]): Uint8Array {
  const n = parca.reduce((s, x) => s + x.length, 0)
  const o = new Uint8Array(n)
  let i = 0
  for (const x of parca) {
    o.set(x, i)
    i += x.length
  }
  return o
}

/**
 * Official Fish ASR body (Python SDK `asr.transcribe(..., language="tr")`):
 * MessagePack `{ audio, language: "tr", ignore_timestamps: true }`.
 * Product docs: pass an ISO code to pin the language on short clips.
 * Multipart `language` is accepted but auto-detect still won on live Turkish.
 */
export function fishAsrGovde(ses: Uint8Array): Uint8Array {
  return msgpackBirlestir(
    new Uint8Array([0x83]),
    msgpackStr('audio'),
    msgpackBin(ses),
    msgpackStr('language'),
    msgpackStr(FISH_ASR_DIL),
    msgpackStr('ignore_timestamps'),
    new Uint8Array([0xc3]),
  )
}

/**
 * Latin letters that never appear in Turkish. Kept as a backstop if Fish still
 * returns a non-Turkish transcript after language is pinned to `tr`.
 */
const YABANCI_LATIN = /[ŘřŽžÝýŮůĚěČčĎďŇňŤťŁłĄąĘęŃńŚśŹźŻżÑñØøÆæŒœßŸÿ]/g
/** Western accents that can appear once in a name (José); junk when they dominate the clip. */
const BATI_AKSAN = /[ÁÉÍÓÚÀÈÌÒÙÄËÏáéíóúàèìòùäëï]/g

/**
 * Backstop after language is pinned to `tr`. A transcript with no Latin letters — or dominated by
 * Arabic/Persian, Cyrillic, CJK, or non-Turkish Latin diacritics — is not Turkish speech.
 */
export function fishAsrDilUyumluMu(metin: string): boolean {
  const t = String(metin || '')
  const latin = (t.match(/[A-Za-zÇĞİÖŞÜçğıöşüâîûÂÎÛ]/g) || []).length
  // NOTYA-AYSE-GERI-03: a spoken number is written in digits — "14:30" is the doctor's answer to "Saat kaçta?",
  // "12,4" a weight. With no letters it was dropped as not-Turkish and the turn silently vanished.
  if (!latin) return /^\s*\d[\d\s:.,/-]*\s*$/.test(t)
  const yabanciYazi = (t.match(/[\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0900-\u097F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g) || []).length
  if (yabanciYazi * 2 >= latin) return false
  if ((t.match(YABANCI_LATIN) || []).length) return false
  const bati = (t.match(BATI_AKSAN) || []).length
  if (bati >= 3 || bati * 2 >= latin) return false
  return true
}

/** Native `/v1/asr` language_code is detected language, not the hint we sent. Empty/unknown is allowed. */
export function fishAsrDilKoduUyumluMu(kod: string | null | undefined): boolean {
  const k = String(kod || '').trim().toLowerCase()
  if (!k) return true
  return k === 'tr' || k.startsWith('tr-')
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

/**
 * NOTYA-TTS-BIRIM-01 (Kaan/Gokhan, 2026-10-01): Fish's news voice spells out clinical
 * unit abbreviations letter by letter ("kg" -> "ka ge") instead of the Turkish word
 * ("kilogram"). Each pattern requires the unit to immediately follow a digit, with only
 * optional whitespace between, so the eight patterns are naturally non-overlapping and
 * this must run BEFORE fishRakamlariOku -- the number is still numeric text here
 * ("13.3kg" -> "13.3 kilogram"), and digit-to-words runs second ("on üç virgül üç
 * kilogram").
 */
const BIRIM_ESLESME: ReadonlyArray<readonly [RegExp, string]> = [
  // NOTYA-TTS-BIRIM-02 (Kaan, canlı, 2026-10-01): "39°C" had no rule at all -- Fish's voice rendered
  // the bare degree sign + letter as something close to "çiş". Matched first, same "must run before
  // fishRakamlariOku" reasoning as the units below ("39.2°C" -> "39.2 derece" -> "otuz dokuz virgül iki derece").
  [/(\d)\s*\u00b0\s*c\b/gi, '$1 derece'],
  [/(\d)\s*\u00b0/g, '$1 derece'],
  [/(\d)\s*mcg\b/gi, '$1 mikrogram'],
  [/(\d)\s*mg\b/gi, '$1 miligram'],
  [/(\d)\s*kg\b/gi, '$1 kilogram'],
  [/(\d)\s*g\b/gi, '$1 gram'],
  [/(\d)\s*ml\b/gi, '$1 mililitre'],
  [/(\d)\s*lt\b/gi, '$1 litre'],
  [/(\d)\s*mm\b/gi, '$1 milimetre'],
  [/(\d)\s*cm\b/gi, '$1 santimetre'],
]

export function fishBirimleriOku(metin: string): string {
  let sonuc = String(metin || '')
  for (const [desen, degisim] of BIRIM_ESLESME) sonuc = sonuc.replace(desen, degisim)
  return sonuc
}

/**
 * THE choke point: every string Ayşe speaks through Fish — REST (fishIstegi: greeting, fallbacks, the page's own
 * read-aloud) and the live socket (fishWsMetinOlayi: the turn stream) — is turned into engine text here and nowhere
 * else. Strip any bracket cue, rewrite the text into spoken Turkish medical language (NOTYA-SES-NORMAL-01,
 * lib/ses/tibbiSeslendirme.ts: abbreviations, units, numbers, dates — deterministic, no model call), then put one
 * short pause between sentences. The screen text, the stored transcript and the `soz` events are NOT this text.
 * The medical layer reads every number and unit itself (fishBirimleriOku / fishRakamlariOku above are its
 * predecessors, kept for their callers and tests); it runs before the dash-to-comma step because a range is an en dash.
 */
export function fishMetni(ham: string, secenek: SeslendirmeSecenegi = {}): string {
  const duz = tibbiSeslendir(String(ham || '').replace(ETIKET, ' '), secenek).replace(/[—–]/g, ',').replace(/\s+/g, ' ').trim()
  if (!duz) return ''
  const cumleler = duz.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean)
  return cumleler.join(' [break] ')
}

export function fishIstegi(metin: string, secenek: SeslendirmeSecenegi = {}): { model: string; govde: Record<string, unknown> } | null {
  const text = fishMetni(metin, secenek)
  if (!text || /^[.,;:!?…\-–—'"]+$/.test(text.replace(/\s|\[break\]/g, ''))) return null
  return {
    model: fishModel(),
    govde: {
      text,
      reference_id: FISH_HABER_SES_ID,
      language: 'tr',
      format: 'pcm',
      sample_rate: 24000,
      temperature: 0.7,
      top_p: 0.7,
      normalize: false,
      latency: FISH_GECIKME,
      chunk_length: FISH_PARCA,
      prosody: { speed: FISH_HIZ, volume: 0, normalize_loudness: true },
    },
  }
}

/**
 * NOTYA-SES-ASR-KAZANC-01 (Kaan, 2026-10-02): live, Fish Transcribe-1 answered quiet Turkish clips in Chinese, Arabic or
 * Hindi even with the language pinned to tr, the clip was dropped as not Turkish and the doctor got silence. The retry sent
 * the same bytes again. A quiet clip is the classic trigger: bring a low-peak PCM16 WAV up to a normal level before ASR
 * (gain capped at 12x, clipping-safe). A clip that is loud enough, not a WAV, or silent is returned untouched (gain 1).
 */
export function asrKlipNormallestir(bayt: Uint8Array): { bayt: Uint8Array; kazanc: number } {
  const n = bayt.byteLength
  if (n < 48 || String.fromCharCode(bayt[0], bayt[1], bayt[2], bayt[3]) !== 'RIFF') return { bayt, kazanc: 1 }
  const v = new DataView(bayt.buffer, bayt.byteOffset, bayt.byteLength)
  let o = 12
  let bit = 16
  let veriBas = -1
  let veriBoy = 0
  while (o + 8 <= n) {
    const id = String.fromCharCode(bayt[o], bayt[o + 1], bayt[o + 2], bayt[o + 3])
    const boy = v.getUint32(o + 4, true)
    if (id === 'fmt ' && o + 24 <= n) bit = v.getUint16(o + 22, true) || 16
    else if (id === 'data') { veriBas = o + 8; veriBoy = Math.min(boy, n - veriBas); break }
    o += 8 + boy + (boy % 2)
  }
  if (veriBas < 0 || bit !== 16 || veriBoy < 2) return { bayt, kazanc: 1 }
  const sayi = Math.floor(veriBoy / 2)
  let tepe = 0
  for (let i = 0; i < sayi; i++) {
    const x = Math.abs(v.getInt16(veriBas + i * 2, true))
    if (x > tepe) tepe = x
  }
  const oran = tepe / 0x8000
  if (oran < 0.003 || oran >= 0.5) return { bayt, kazanc: 1 }
  const kazanc = Math.min(0.85 / oran, 12)
  const cikis = new Uint8Array(bayt)
  const w = new DataView(cikis.buffer, cikis.byteOffset, cikis.byteLength)
  for (let i = 0; i < sayi; i++) {
    const y = Math.round(v.getInt16(veriBas + i * 2, true) * kazanc)
    w.setInt16(veriBas + i * 2, Math.max(-32768, Math.min(32767, y)), true)
  }
  return { bayt: cikis, kazanc }
}
