/**
 * NOTYA-SES-ELEVEN-NORMAL-01 + NOTYA-SES-LAB-NEFES-01 (Boss / Dr. Gökhan, 2026-10-03).
 *
 * Every string Ayşe speaks through ElevenLabs (Custom LLM SSE deltas in lib/asistan/sesLlm.ts, and the
 * per-sentence cleaner in ayseCevapla when saglayici is elevenlabs) is rewritten here into spoken Turkish
 * medical language via lib/ses/tibbiSeslendirme.ts. Screen text, stored transcripts and model prompts stay
 * written.
 *
 * After unit expansion, dense lab lists ("… gram desilitre, ferritin … nanogram mililitre") are split into
 * short spoken beats so Flash does not rush a long chain of numbers+units in one delta (slur / rush).
 * Idempotent: safe to run twice on the same string.
 */
import { tibbiSeslendir, type SeslendirmeSecenegi } from '@/lib/ses/tibbiSeslendirme'
import { BIRIM_SOZLUGU } from '@/lib/ses/tibbiSeslendirmeSozluk'

function kacis(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Spoken unit readings, longest first — "enternasyonel ünite" before "ünite", "miligram" before "gram". */
const BIRIM_OKUNUSLARI = [...new Set(BIRIM_SOZLUGU.map((b) => b.soz.trim()).filter((s) => s.length >= 2))]
  .sort((a, b) => b.length - a.length || a.localeCompare(b, 'tr'))

const BIRIM_SONU = BIRIM_OKUNUSLARI.map(kacis).join('|')

/**
 * After a spoken unit, a comma starting the next lab value becomes a sentence end so SesYayKapisi
 * can breathe between numbers. Plain talk ("Merhaba Hocam, ben Ayşe") is untouched — left side
 * must end in a unit reading.
 */
export function labNefesAyir(metin: string): string {
  const s = String(metin || '')
  if (!s.trim() || !BIRIM_SONU) return s
  // unit [short Turkish suffix] , nextLetter  →  unit[suffix]. NextLetter
  const desen = new RegExp(`(${BIRIM_SONU})(\\p{L}{0,5})?(\\s*),(\\s+)(\\p{L})`, 'giu')
  return s.replace(desen, (_h, birim: string, ek: string | undefined, _s1: string, s2: string, harf: string) => {
    return `${birim}${ek || ''}.${s2}${harf.toLocaleUpperCase('tr-TR')}`
  })
}

/** Text handed to ElevenLabs TTS — abbreviations, units, numbers and dates as spoken Turkish, breath-paced. */
export function elevenMetni(ham: string, secenek: SeslendirmeSecenegi = {}): string {
  const okunus = tibbiSeslendir(String(ham || ''), secenek).replace(/\s+/g, ' ').trim()
  return labNefesAyir(okunus).replace(/\s+/g, ' ').trim()
}
