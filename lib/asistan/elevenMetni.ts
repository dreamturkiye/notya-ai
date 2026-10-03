/**
 * NOTYA-SES-ELEVEN-NORMAL-01 (Boss / Dr. Gökhan, 2026-10-03) — ElevenLabs speech choke point.
 *
 * Every string Ayşe speaks through ElevenLabs (Custom LLM SSE deltas in lib/asistan/sesLlm.ts, and the
 * per-sentence cleaner in ayseCevapla when saglayici is elevenlabs) is rewritten here into spoken Turkish
 * medical language via lib/ses/tibbiSeslendirme.ts. Screen text, stored transcripts and model prompts stay
 * written. Idempotent: safe to run twice on the same string.
 */
import { tibbiSeslendir, type SeslendirmeSecenegi } from '@/lib/ses/tibbiSeslendirme'

/** Text handed to ElevenLabs TTS — abbreviations, units, numbers and dates as spoken Turkish. */
export function elevenMetni(ham: string, secenek: SeslendirmeSecenegi = {}): string {
  return tibbiSeslendir(String(ham || ''), secenek).replace(/\s+/g, ' ').trim()
}
