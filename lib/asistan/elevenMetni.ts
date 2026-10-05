/**
 * NOTYA-SES-ELEVEN-NORMAL-01 + NOTYA-SES-LAB-NEFES-01 + NOTYA-SES-SAYI-NET-01
 * (Boss / Dr. Gökhan — number slur on Flash is a Beta QoS blocker).
 *
 * Every string Ayşe speaks through ElevenLabs (Custom LLM SSE deltas in lib/asistan/sesLlm.ts, and the
 * per-sentence cleaner in ayseCevapla when saglayici is elevenlabs) is rewritten here into spoken Turkish
 * medical language via lib/ses/tibbiSeslendirme.ts. Screen text, stored transcripts and model prompts stay
 * written.
 *
 * After unit expansion, dense lab lists ("… gram desilitre, ferritin … nanogram mililitre") are split into
 * short spoken beats so Flash does not rush a long chain of numbers+units in one delta (slur / rush).
 *
 * ElevenLabs Flash v2.5 does not normalize numbers by default (docs + Reddit: spell digits yourself;
 * Multilingual v2 is better but we stay on Flash for latency). Any digit / superscript / µ that still
 * reaches the engine becomes an English "digit island" and slurs. The final sweeper spells leftovers.
 * Idempotent: safe to run twice on the same string.
 */
import { sayiOku, tibbiSeslendir, type SeslendirmeSecenegi } from '@/lib/ses/tibbiSeslendirme'
import { BIRIM_SOZLUGU } from '@/lib/ses/tibbiSeslendirmeSozluk'

function kacis(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Spoken unit readings, longest first — "enternasyonel ünite" before "ünite", "miligram" before "gram". */
const BIRIM_OKUNUSLARI = [...new Set(BIRIM_SOZLUGU.map((b) => b.soz.trim()).filter((s) => s.length >= 2))]
  .sort((a, b) => b.length - a.length || a.localeCompare(b, 'tr'))

const BIRIM_SONU = BIRIM_OKUNUSLARI.map(kacis).join('|')

const BIRLER = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'] as const
const USLU: Readonly<Record<string, string>> = {
  '⁰': 'sıfır', '¹': 'bir', '²': 'iki', '³': 'üç', '⁴': 'dört',
  '⁵': 'beş', '⁶': 'altı', '⁷': 'yedi', '⁸': 'sekiz', '⁹': 'dokuz',
}

/** One digit (ASCII or superscript) → Turkish word. */
function haneOku(ch: string): string {
  if (USLU[ch]) return USLU[ch]
  const n = Number(ch)
  return Number.isInteger(n) && n >= 0 && n <= 9 ? BIRLER[n] : ch
}

/**
 * After a spoken unit, a comma (or semicolon) starting the next lab/vital value becomes a sentence end
 * so SesYayKapisi can breathe between numbers. Plain talk ("Merhaba Hocam, ben Ayşe") is untouched —
 * left side must end in a unit reading.
 */
export function labNefesAyir(metin: string): string {
  const s = String(metin || '')
  if (!s.trim() || !BIRIM_SONU) return s
  // unit [short Turkish suffix] ,|; nextLetter  →  unit[suffix]. NextLetter
  const desen = new RegExp(`(${BIRIM_SONU})(\\p{L}{0,5})?(\\s*)[,;](\\s+)(\\p{L})`, 'giu')
  return s.replace(desen, (_h, birim: string, ek: string | undefined, _s1: string, s2: string, harf: string) => {
    return `${birim}${ek || ''}.${s2}${harf.toLocaleUpperCase('tr-TR')}`
  })
}

/**
 * NOTYA-SES-SAYI-NET-01 — last line of defence before Flash.
 * Spells every remaining digit / superscript so the engine never sees a numeric island.
 * Letter+digit codes ("H1234", "V1234") keep the letters and read each digit as a word.
 * Bare digit runs of 1–4 use cardinal Turkish; 5+ (ids that leaked past kimlik koruma) are digit-by-digit.
 */
export function kalanRakamlariOku(metin: string): string {
  let s = String(metin || '')
  if (!s) return s
  // Digits glued to a superscript exponent (leaked "10³") before stripping lone superscripts.
  s = s.replace(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹])/gu, (_h, dig: string, us: string) => {
    const usSoz = haneOku(us)
    if (dig === '10') return `on üssü ${usSoz}`
    const taban = /^\d{1,4}$/.test(dig) ? sayiOku(Number(dig)) : [...dig].map(haneOku).join(' ')
    return `${taban} üssü ${usSoz}`
  })
  // Lone superscripts (belt-and-braces).
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/gu, (ch) => haneOku(ch))
  // Alphanumeric lot / vaccine codes: H1234 → H bir iki üç dört
  s = s.replace(/(?<![\p{L}\p{N}])(\p{L}{1,4})(\d{2,})(?![\p{L}\p{N}])/gu, (_h, harf: string, rakam: string) => {
    return `${harf} ${[...rakam].map(haneOku).join(' ')}`
  })
  // Bare leftover digit runs (and rare decimals that escaped).
  s = s.replace(/(?<![\p{L}\p{N}])(\d+(?:[.,]\d+)?)(?![\p{L}\p{N}])/gu, (_h, ham: string) => {
    if (/^\d{5,}$/.test(ham)) return [...ham].map(haneOku).join(' ')
    if (/^\d+$/.test(ham)) {
      const n = Number(ham)
      return Number.isInteger(n) && n <= 9999 ? sayiOku(n) : [...ham].map(haneOku).join(' ')
    }
    // "1,02" style that somehow leaked — read digit groups around the separator as words.
    return ham.replace(/\d/g, (d) => haneOku(d)).replace(/[.,]/g, ' virgül ')
  })
  return s.replace(/\s+/g, ' ').trim()
}

/** True when spoken text still holds a digit or numeric superscript — Flash will slur. */
export function rakamKaldiMi(okunus: string): boolean {
  return /[\d⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(String(okunus || ''))
}

/** Text handed to ElevenLabs TTS — abbreviations, units, numbers and dates as spoken Turkish, breath-paced, digit-free. */
export function elevenMetni(ham: string, secenek: SeslendirmeSecenegi = {}): string {
  const okunus = tibbiSeslendir(String(ham || ''), secenek).replace(/\s+/g, ' ').trim()
  const nefes = labNefesAyir(okunus).replace(/\s+/g, ' ').trim()
  return kalanRakamlariOku(nefes)
}
