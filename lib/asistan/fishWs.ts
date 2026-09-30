/**
 * NOTYA-FISH-WS-01 — Fish TTS live socket protocol (docs.fish.audio, "Text to Speech (WebSocket)",
 * read 2026-09-29): `wss://api.fish.audio/v1/tts/live`, `Authorization: Bearer`, optional `model`
 * header, MessagePack frames. Client events: `{event:"start", request:{…TTSRequest}}`,
 * `{event:"text", text}`, `{event:"flush"}`, `{event:"stop"}`. Server events: `{event:"audio",
 * audio:<bin>}`, `{event:"finish", reason:"stop"|"error"}`, `{event:"log", message}`.
 * `sample_rate: null` means the format default (44100) — we pin 24000 like the REST route.
 *
 * Fish has no scoped / ephemeral keys, so the socket lives on the server (fish-tur route) and
 * PCM is relayed to the browser as base64 SSE events on the existing turn stream.
 */
import { fishBirlestir, fishYeniCumleler } from '@/lib/asistan/fishCalar'
import { FISH_HABER_SES_ID, FISH_HIZ, FISH_MODEL, FISH_ORNEK_HZ, fishMetni } from '@/lib/asistan/fishSes'
import { msgpackCoz, msgpackKodla, type MsgpackDeger } from '@/lib/asistan/fishMsgpack'

export const FISH_WS_URL = 'wss://api.fish.audio/v1/tts/live'
/** Socket open + first audio bound. Beyond this the turn falls back to per-sentence REST. */
export const FISH_WS_ACILIS_MS = 4000
/** Audio drain after the last text: Fish must finish before the SSE closes. */
export const FISH_WS_BITIS_MS = 25_000

/** `NOTYA_FISH_WS` — default ON; `0` / `false` reverts to per-sentence REST without a deploy of code. */
export function fishWsAcikMi(deger: string | undefined = process.env.NOTYA_FISH_WS): boolean {
  const d = String(deger ?? '').trim().toLowerCase()
  return d !== '0' && d !== 'false' && d !== 'off'
}

export function fishWsBaslangic(): { event: 'start'; request: { [k: string]: MsgpackDeger } } {
  return {
    event: 'start',
    request: {
      text: '',
      reference_id: FISH_HABER_SES_ID,
      format: 'pcm',
      sample_rate: FISH_ORNEK_HZ,
      latency: 'low',
      chunk_length: 160,
      temperature: 0.7,
      top_p: 0.7,
      normalize: false,
      prosody: { speed: FISH_HIZ, volume: 0, normalize_loudness: true },
    },
  }
}

export function fishWsModel(): string { return FISH_MODEL }

/** One finished word-group → one text event. Trailing space: Fish's guide says "send complete words with spaces". */
export function fishWsMetinOlayi(cumle: string): { event: 'text'; text: string } | null {
  const t = fishMetni(cumle).replace(/\s*\[break\]\s*/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t || /^[.,;:!?…\-–—'"]+$/.test(t)) return null
  return { event: 'text', text: `${t} ` }
}

export const FISH_WS_DUR = { event: 'stop' } as const
export const FISH_WS_FLUSH = { event: 'flush' } as const

export function fishWsKodla(olay: MsgpackDeger): Uint8Array { return msgpackKodla(olay) }

export type FishWsOlay =
  | { tur: 'audio'; ses: Uint8Array }
  | { tur: 'finish'; neden: string }
  | { tur: 'log'; mesaj: string }
  | { tur: 'bilinmeyen'; event: string }

export function fishWsOlayCoz(ham: Uint8Array): FishWsOlay {
  let v: MsgpackDeger
  try { v = msgpackCoz(ham) } catch { return { tur: 'bilinmeyen', event: 'bozuk' } }
  if (!v || typeof v !== 'object' || Array.isArray(v) || v instanceof Uint8Array) return { tur: 'bilinmeyen', event: 'bozuk' }
  const event = typeof v.event === 'string' ? v.event : ''
  if (event === 'audio') return { tur: 'audio', ses: v.audio instanceof Uint8Array ? v.audio : new Uint8Array(0) }
  if (event === 'finish') return { tur: 'finish', neden: typeof v.reason === 'string' ? v.reason : '' }
  if (event === 'log') return { tur: 'log', mesaj: typeof v.message === 'string' ? v.message : '' }
  return { tur: 'bilinmeyen', event }
}

/**
 * Server-side cutter — send complete words as Luna streams, not finished sentences.
 * `islenen.length` is the offset handed to Fish (used by `ses_dus` REST fallback).
 */
export class KelimeKesici {
  birikim = ''
  islenen = ''
  ekle(parca: string, bitir = false): string[] {
    this.birikim = fishBirlestir(this.birikim, parca)
    const kalan = this.birikim.slice(this.islenen.length)
    if (bitir) {
      const t = kalan.replace(/\s+/g, ' ').trim()
      this.islenen = this.birikim
      return t ? [t] : []
    }
    const son = kalan.lastIndexOf(' ')
    if (son < 0) return []
    const ham = kalan.slice(0, son + 1)
    this.islenen += ham
    const t = ham.replace(/\s+/g, ' ').trim()
    return t ? [t] : []
  }
  bitir(): string[] { return this.ekle('', true) }
}

/** Sentence cutter kept for REST `ses_dus` tests and any non-WS path. */
export class CumleKesici {
  birikim = ''
  islenen = ''
  ekle(parca: string, bitir = false): string[] {
    this.birikim = fishBirlestir(this.birikim, parca)
    const r = fishYeniCumleler(this.islenen, this.birikim, bitir)
    this.islenen = r.islenen
    return r.soyle
  }
  bitir(): string[] { return this.ekle('', true) }
}

/** Turn-stream SSE events added for the socket path (the browser ignores unknown `t`). */
export type FishTurSesOlayi =
  | { t: 'ses_hazir' }
  | { t: 'ses'; b: string }
  | { t: 'ses_bit' }
  | { t: 'soz_bit' }
  | { t: 'ses_dus'; islenen: number }
  | { t: 'stt'; m: string }
  | { t: 'atlandi'; neden: string }
  | { t: 'kapat'; m: string }

export function pcmBase64(b: Uint8Array): string {
  return Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString('base64')
}

/** Browser side: base64 → bytes without Buffer. */
export function base64Pcm(s: string): Uint8Array {
  const bin = atob(s)
  const o = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i)
  return o
}

/**
 * Browser fallback offset after `ses_dus`: text before `islenen` was handed to the socket (some of
 * it may have played), text after it is spoken via REST. Never past the end of the transcript.
 */
export function sesDusKesimi(birikim: string, islenen: number): string {
  const n = Math.max(0, Math.min(birikim.length, Math.floor(islenen)))
  return birikim.slice(0, n)
}
