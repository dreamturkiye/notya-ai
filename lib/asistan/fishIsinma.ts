/**
 * NOTYA-FISH-HAVUZ-01 — session warm-up for the Fish REST path (server-only).
 *
 * Measured 2026-09-30 (Mac → api.fish.audio, docs/ARCH-FISH-TTS-LATENCY.md): the first TTS on a
 * fresh undici agent had 738 ms TTFB; after one `GET /v1/tts` on the same agent (gateway answers
 * 404 `no_route` in ~160 ms, nothing billed) the next TTS had 214 ms — the same as a warm call.
 * A tiny real TTS ("Hm.") warmed no better (298 ms) and costs characters, so the warm-up is the GET.
 * Never throws — warm-up is best effort.
 */
import { fishFetch } from '@/lib/asistan/fishBaglanti'

export const FISH_ISINMA_URL = 'https://api.fish.audio/v1/tts'
export const FISH_ISINMA_ZAMAN_MS = 4000

export type FishIsinmaSonucu = { isinma_ms: number; durum: number | null; hata: string | null }

export async function fishIsinma(anahtar: string, fetcher: typeof fishFetch = fishFetch): Promise<FishIsinmaSonucu> {
  const t0 = Date.now()
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), FISH_ISINMA_ZAMAN_MS)
  try {
    const yanit = await fetcher(FISH_ISINMA_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${anahtar}` },
      signal: kontrol.signal,
    })
    await yanit.text().catch(() => '')
    // 404 is the expected gateway answer for GET; only a transport failure counts as a miss.
    return { isinma_ms: Date.now() - t0, durum: yanit.status, hata: null }
  } catch (e) {
    return { isinma_ms: Date.now() - t0, durum: null, hata: e instanceof Error ? e.name : 'hata' }
  } finally {
    clearTimeout(zaman)
  }
}
