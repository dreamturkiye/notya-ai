/**
 * NOTYA-FISH-KEEPALIVE-01 — one undici Agent for every Fish HTTP call (ASR + REST TTS).
 * Node's default agent drops idle sockets after 4 s; a doctor's turn is ASR → LLM (1–3 s) →
 * TTS, then silence between turns, so nearly every call paid TCP + TLS again. Keep sockets
 * warm for the life of the lambda instance. Server-only (undici is a Node package).
 */
import { Agent, fetch as undiciFetch } from 'undici'

export const FISH_KEEPALIVE_MS = 60_000
export const FISH_KEEPALIVE_AZAMI_MS = 120_000
export const FISH_BAGLANTI_SAYISI = 4

let ajan: Agent | null = null

export function fishAjan(): Agent {
  if (!ajan) {
    ajan = new Agent({
      keepAliveTimeout: FISH_KEEPALIVE_MS,
      keepAliveMaxTimeout: FISH_KEEPALIVE_AZAMI_MS,
      connections: FISH_BAGLANTI_SAYISI,
      pipelining: 1,
    })
  }
  return ajan
}

export type FishYanit = Awaited<ReturnType<typeof undiciFetch>>

export function fishFetch(url: string, init: Parameters<typeof undiciFetch>[1] = {}): Promise<FishYanit> {
  return undiciFetch(url, { ...init, dispatcher: fishAjan() })
}
