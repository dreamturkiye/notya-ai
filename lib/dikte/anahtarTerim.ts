/**
 * DIKTE-TIBBI-01 (a) — provider-side biasing: the keyterm list sent with an uploaded visit recording to ElevenLabs
 * Scribe (POST /v1/speech-to-text, `keyterms`; supported by scribe_v2 / scribe_v2_medical / scribe_v3).
 * Provider limits (ElevenLabs API reference, checked 2026-11-21): ≤ 1000 keyterms, each ≤ 50 characters and ≤ 5 words,
 * none of < > { } [ ] \ ; usage adds a 20 % surcharge on that transcription.
 *
 * Order: the doctor's own correct terms first (he said them), then the branş lexicon, then core. Pure.
 */
import type { Sozluk, KisiselCift } from './duzelt'
import { anahtar } from './duzelt'

export const ANAHTAR_TERIM_AZAMI = 1000
const YASAK = /[<>{}[\]\\]/

export function anahtarTerimler(g: { sozluk: Sozluk; kisisel?: KisiselCift[]; azami?: number }): string[] {
  const azami = Math.min(g.azami ?? ANAHTAR_TERIM_AZAMI, ANAHTAR_TERIM_AZAMI)
  const out: string[] = []
  const gorulen = new Set<string>()
  const ekle = (t: string) => {
    const s = String(t || '').replace(/\s+/g, ' ').trim()
    if (!s || s.length > 50 || YASAK.test(s) || s.split(' ').length > 5 || /\d/.test(s)) return
    const k = anahtar(s)
    if (k.replace(/ /g, '').length < 4 || gorulen.has(k)) return
    gorulen.add(k)
    out.push(s)
  }
  for (const c of g.kisisel || []) { if (out.length >= azami) break; ekle(c.dogru) }
  // branş terms sit after core terms in a merged lexicon: walk it from the end so the branş fills the list first
  const terimler = g.sozluk.terimler
  for (let i = terimler.length - 1; i >= 0 && out.length < azami; i--) ekle(terimler[i])
  return out.slice(0, azami)
}
