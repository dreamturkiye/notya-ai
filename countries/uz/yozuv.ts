/**
 * NOTYA-UZ-BRANSLAR-01 — Uzbekistan: script conversion for NAMES, by rule. Uzbek Latin → Uzbek Cyrillic, and
 * Uzbek Cyrillic → the spelling a Russian text uses for the same name.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE CONVERSION. AWAITS A NATIVE READER. Everything this file returns is derived by rule, letter by letter;
 * nobody who reads Uzbek or Russian as a first language has checked a single result. A rule cannot know where a
 * loan word keeps «ц» or «ь», or how a family prefers its name written in Russian. Callers must treat the result
 * as a draft and mark it as machine-derived wherever it is documented.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Why it exists. The pack already folds both scripts onto one skeleton for SEARCH (./arama.ts) — a lossy fold that
 * is never shown. Showing a name needs the other direction, which the pack did not have. It is used for the
 * assistant names of ./klinik/asistanAdlari.ts only (the owner's list is in Uzbek Latin and is the single source);
 * sentences of the application are NOT converted — their Cyrillic form is written by hand in the catalogues.
 *
 * Pure. No table of exceptions on purpose: a hand-made exception would be a hand-made spelling, and the spellings
 * are the owner's to decide.
 */

const TEK: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
  p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'ц', w: 'в',
}
const CIFT: Record<string, string> = { sh: 'ш', ch: 'ч', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е' }
const UNLU = new Set(['a', 'e', 'i', 'o', 'u'])
/** oʻ / gʻ are written with U+02BB; people also type the ASCII apostrophe, a backtick or a typographic quote. */
const OKINA = /[ʻ'`‘’]/
/** The tutuq belgisi, U+02BC. */
const TUTUQ = 'ʼ'

const buyukMu = (h: string) => h !== h.toLowerCase() && h === h.toUpperCase()
const harfMi = (h: string | undefined) => !!h && /\p{L}/u.test(h)

/** Uzbek in Latin script → Uzbek in Cyrillic script, by rule. Anything that is not a Latin letter is kept as it is. */
export function uzKirillga(ham: string): string {
  const s = String(ham ?? '').normalize('NFC')
  let cikti = ''
  for (let i = 0; i < s.length; ) {
    const h = s[i]
    const k = h.toLowerCase()
    const sonraki = s[i + 1] ?? ''
    const yaz = (kiril: string, uzunluk: number) => { cikti += buyukMu(h) ? kiril.toUpperCase() : kiril; i += uzunluk }
    if ((k === 'o' || k === 'g') && OKINA.test(sonraki)) { yaz(k === 'o' ? 'ў' : 'ғ', 2); continue }
    if (h === TUTUQ) { cikti += 'ъ'; i += 1; continue }
    const cift = CIFT[k + sonraki.toLowerCase()]
    if (cift) { yaz(cift, 2); continue }
    if (k === 'e') {
      // «э» at the start of a word and after a vowel, «е» after a consonant.
      const onceki = s[i - 1]?.toLowerCase()
      yaz(!harfMi(onceki) || UNLU.has(onceki as string) ? 'э' : 'е', 1)
      continue
    }
    if (k in TEK) { yaz(TEK[k], 1); continue }
    cikti += h
    i += 1
  }
  return cikti
}

const RUSCHA: Record<string, string> = { ў: 'у', қ: 'к', ғ: 'г', ҳ: 'х', Ў: 'У', Қ: 'К', Ғ: 'Г', Ҳ: 'Х' }

/** A NAME in Uzbek Cyrillic → the letters a Russian text has for it (the four Uzbek-only letters are replaced). */
export function uzRuschaYozuvga(kirill: string): string {
  return [...String(kirill ?? '')].map((h) => RUSCHA[h] ?? h).join('')
}
