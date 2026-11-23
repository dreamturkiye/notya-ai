/**
 * ESNEK-MUAYENE-B — text helpers shared by the shadow-mode comparison, the overnight learning loop and the fark notu (pure,
 * no DOM, no server). The patterns cover the languages of all builds (Turkish, English, Uzbek Latin/Cyrillic, Russian) where a
 * pattern is needed; they are never shown to anyone.
 */

/** Case / diacritic folding for comparison (Turkish dotless ı and dotted İ first). */
export function katla(s: string): string {
  return String(s || '')
    .normalize('NFC')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
}

/** Words (letters / digits kept together, everything else splits). Symbols that carry clinical meaning stay tokens. */
export function kelimeler(s: string): string[] {
  return String(s || '')
    .replace(/([↑↓→Øø∅=+])/g, ' $1 ')
    .split(/[^\p{L}\p{N}↑↓→Øø∅=+./%-]+/u)
    .map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, ''))
    .filter(Boolean)
}

/**
 * Function words and visit boilerplate that carry no clinical content of their own (folded). A fact is what remains.
 * "normal" family words are not here: they are content ("kulak zarı normal").
 */
const DOLGU = new Set([
  've', 'ile', 'veya', 'ya', 'da', 'de', 'ki', 'bir', 'bu', 'su', 'o', 'icin', 'olarak', 'olan', 'oldugu', 'gibi', 'daha', 'cok', 'az',
  'mevcut', 'izlendi', 'izlenmektedir', 'saptandi', 'saptanmistir', 'goruldu', 'gorulmektedir', 'tespit', 'edildi', 'edilmistir', 'yapildi',
  'yapilmistir', 'mevcuttur', 'vardi', 'olmus', 'olup', 'ise', 'en', 'her', 'hasta', 'hastanin', 'hastada', 'muayenede', 'muayene', 'bulgu',
  'bulgular', 'bulgusu', 'degerlendirildi', 'degerlendirme', 'not', 'notu', 'son', 'ilk', 'gun', 'gundur', 'sikayeti', 'sikayet', 'ile',
  'and', 'or', 'the', 'a', 'an', 'of', 'with', 'is', 'was', 'were', 'noted', 'seen', 'found', 'present', 'patient', 'on', 'in', 'at', 'to',
  'va', 'bilan', 'uchun', 'и', 'с', 'в', 'на', 'по',
])
export const dolguMu = (k: string) => DOLGU.has(k)

/** Same-meaning words folded to one key (clinical register only; data, extend per build). */
const ES_ANLAM: Record<string, string> = {
  dogal: 'normal', olagan: 'normal', intakt: 'normal', tabii: 'normal', n: 'normal', normaldir: 'normal', normal: 'normal', wnl: 'normal',
  nad: 'normal', unremarkable: 'normal', norma: 'normal', норма: 'normal',
  bilat: 'bilateral', iki: 'bilateral', ikitarafli: 'bilateral',
}

/**
 * Content key of one word: folded, synonyms merged, Turkish suffixes cut by keeping a 5-letter stem for long words
 * ("submandibuler" ~ "submandibular" ~ "submandibulerde"). Short words stay whole ("taş", "ağrı").
 */
export function kok(w: string): string {
  const k = katla(w).replace(/[.'’`]/g, '')
  if (!k) return ''
  if (ES_ANLAM[k]) return ES_ANLAM[k]
  if (/^\d/.test(k)) return k
  return k.length > 6 ? k.slice(0, 5) : k
}

/** Clauses: lines, sentences and semicolon lists (a comma list stays one clause unless it is a finding list after a label). */
export function cumleler(metin: string): string[] {
  const out: string[] = []
  for (const satir of String(metin || '').split(/\n+/)) {
    for (const parca of satir.split(/(?<=[.!?…])\s+|;\s*/)) {
      const t = parca.trim()
      if (t) out.push(t)
    }
  }
  return out
}

/** "Label: rest" → label (≤ 4 words, starts with a letter, no digit) and rest. */
export function etiketAyir(cumle: string): { etiket: string | null; govde: string } {
  const m = /^\s*([\p{L}][\p{L} ()/&-]{0,34}?)\s*:\s*(.*)$/u.exec(cumle)
  if (!m) return { etiket: null, govde: cumle.trim() }
  const etiket = m[1].trim()
  if (etiket.split(/\s+/).length > 4 || /\d/.test(etiket)) return { etiket: null, govde: cumle.trim() }
  return { etiket, govde: m[2].trim() }
}

/** Numbers with their unit, normalized ("6 mm" → "6|mm", "6,5mm" → "6.5|mm", "12.12" → "12.12"). */
export function sayilar(metin: string): string[] {
  const out: string[] = []
  const r = /(\d+(?:[.,]\d+)*)\s*(mm|cm|mg|mcg|µg|g|gr|ml|cc|iu|ü|ünite|unit|kg|db|hz|%|°|x|×)?/gi
  let m: RegExpExecArray | null
  while ((m = r.exec(String(metin || '')))) out.push(`${m[1].replace(',', '.')}${m[2] ? '|' + katla(m[2]).replace('×', 'x') : ''}`)
  return out
}

/** Order-insensitive equality of two string lists. */
export function ayniKume(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const x = [...a].sort(), y = [...b].sort()
  return x.every((v, i) => v === y[i])
}

/** Today's date in a time zone (YYYY-MM-DD). */
export function gunAnahtari(t: Date, saatDilimi = 'Europe/Istanbul'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: saatDilimi }).format(t)
}

/** Hour + minute of a time in a time zone, as minutes after midnight. */
export function gunDakikasi(t: Date, saatDilimi = 'Europe/Istanbul'): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(t)
  const s = Number(p.find((x) => x.type === 'hour')?.value || 0) % 24
  const d = Number(p.find((x) => x.type === 'minute')?.value || 0)
  return s * 60 + d
}

export const saatMetni = (dk: number) => `${String(Math.floor(dk / 60) % 24).padStart(2, '0')}:${String(Math.round(dk % 60)).padStart(2, '0')}`

export function medyan(xs: number[]): number | null {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!s.length) return null
  const o = Math.floor(s.length / 2)
  return s.length % 2 ? s[o] : (s[o - 1] + s[o]) / 2
}
