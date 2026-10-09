/**
 * NOTYA-ULKE-EN-01 — spelling checks for English text. TESTS ONLY (the set's own, and each English pack's).
 *
 *   temelYazimSorunlari(text)          a text of the SET (written in en-GB): it holds no American spelling, and every
 *                                      word that LOOKS like one of the families the forms disagree on (-ise, -yse,
 *                                      -our) is a row of the table, so that no form is left with the base spelling
 *                                      by accident. A word that only looks like one (promise, hour) is on a short list.
 *   bicimYazimSorunlari(text, form)    a text as a pack SHOWS it in a form: it holds no spelling the table gives to
 *                                      another form.
 *   tumMetinler(value)                 every string of a catalogue, at any depth, with its path.
 */
import { ABD_TIBBI_YAZIMLAR, KELIMELER, KORUNAN } from '../sozluk'
import { yabanciYazimlar, type EnBicim } from '../varyant'

/** Words that END like a family the forms disagree on and are written the same in every form. */
export const ISE_GORUNUMLU: readonly string[] = [
  'advise', 'advised', 'advises', 'advising', 'exercise', 'exercised', 'exercises', 'exercising', 'promise', 'promised', 'promises', 'promising',
  'otherwise', 'likewise', 'clockwise', 'anticlockwise', 'counterclockwise', 'wise', 'raise', 'raised', 'raises', 'raising', 'rise', 'rises', 'rising',
  'arise', 'arises', 'arising', 'precise', 'concise', 'expertise', 'premise', 'premises', 'surprise', 'surprised', 'surprises', 'surprising',
  'revise', 'revised', 'revises', 'revising', 'supervise', 'supervised', 'supervises', 'supervising', 'noise', 'noises', 'praise', 'disguise',
  'compromise', 'compromised', 'compromises', 'compromising', 'comprise', 'comprised', 'comprises', 'comprising', 'enterprise', 'enterprises',
  'improvise', 'devise', 'devised', 'advertise', 'advertised', 'advertising', 'excise', 'excised', 'incise', 'incised', 'bruise', 'bruised', 'bruises', 'bruising',
  'crises', 'diagnoses', 'prognoses', 'bases', 'emphases', 'paralysis', 'analysis', 'dialysis', 'urinalysis', 'disease', 'diseases', 'increase', 'decrease',
  'cruise', 'poise', 'liaise', 'liaised', 'liaising', 'appraise', 'appraised', 'reprise', 'demise', 'despise', 'chastise', 'circumcise', 'circumcised',
  'cerise', 'mayonnaise', 'turquoise', 'tortoise', 'malaise', 'vise', 'guise', 'apprise', 'braise', 'franchise', 'merchandise', 'treatise', 'paradise',
  'anise', 'chemise', 'valise', 'televise', 'televised', 'uprising', 'enterprising', 'unpromising', 'reappraise', 'improvisation',
]

export const IZE_HER_YERDE: readonly string[] = ['size', 'sized', 'sizes', 'sizing', 'resize', 'resized', 'resizes', 'resizing', 'oversized', 'undersized', 'prize', 'prizes', 'prized', 'seize', 'seized', 'seizes', 'seizing', 'capsize', 'capsized', 'downsize', 'downsized', 'downsizing', 'assize', 'baize', 'maize']

export const OUR_GORUNUMLU: readonly string[] = [
  'our', 'ours', 'your', 'yours', 'hour', 'hours', 'hourly', 'four', 'fours', 'pour', 'pours', 'poured', 'pouring', 'tour', 'tours', 'toured', 'touring',
  'detour', 'detours', 'contour', 'contours', 'contoured', 'contouring', 'sour', 'flour', 'devour', 'devoured', 'scour', 'scoured', 'dour', 'glamour', 'velour', 'paramour',
]

const kacis = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const kelimeler = (metin: string): string[] => metin.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []

const TABLO_GB = new Set(KELIMELER.flatMap((k) => (k.ekler ?? ['']).map((ek) => `${k.gb}${ek}`.toLowerCase())))

function bulunanlar(metin: string, aranan: readonly string[], kelimeOlarak: boolean): string[] {
  if (!aranan.length) return []
  const desen = kelimeOlarak
    ? new RegExp(`(?<![A-Za-z])(${[...aranan].sort((a, b) => b.length - a.length).map(kacis).join('|')})(?![A-Za-z])`, 'gi')
    : new RegExp(`(${[...aranan].sort((a, b) => b.length - a.length).map(kacis).join('|')})`, 'gi')
  return [...new Set((metin.match(desen) ?? []).map((x) => x.toLowerCase()))]
}

/** What is wrong with the spelling of a text AS A PACK SHOWS IT in `bicim`. Empty = nothing. */
const KORUNAN_DESEN = new RegExp(`(?<![A-Za-z])(${[...KORUNAN].sort((x, y) => y.length - x.length).map(kacis).join('|')})(?![A-Za-z])`, 'gi')
/** A text without its protected names: a name is written as it is in every form, so no check reads it. */
export const korunansiz = (metin: string): string => metin.replace(KORUNAN_DESEN, ' ')

export function bicimYazimSorunlari(ham: string, bicim: EnBicim): string[] {
  const metin = korunansiz(ham)
  const y = yabanciYazimlar(bicim, ABD_TIBBI_YAZIMLAR)
  const s: string[] = []
  for (const k of bulunanlar(metin, y.kelimeler, true)) s.push(`"${k}" is another form's spelling (not ${bicim})`)
  for (const k of bulunanlar(metin, y.kokler, false)) s.push(`"${k}…" is the British stem (not ${bicim})`)
  for (const k of bulunanlar(metin, y.tibbi, true)) s.push(`"${k}" is the American spelling (not ${bicim})`)
  return s
}

/** What is wrong with the spelling of a text OF THE SET, written in the base form (en-GB). Empty = nothing. */
export function temelYazimSorunlari(metin: string): string[] {
  const s = bicimYazimSorunlari(metin, 'en-GB')
  for (const k of new Set(kelimeler(korunansiz(metin)))) {
    if (TABLO_GB.has(k)) continue
    if (/is(e|ed|es|ing|ation|ations)$/.test(k) && k.length > 5 && !ISE_GORUNUMLU.includes(k)) s.push(`"${k}" ends like an -ise word and is not in the spelling table (countries/_dil/en/sozluk.ts) nor on the list of words that only look like one`)
    else if (/iz(e|ed|es|ing|ation|ations)$/.test(k) && !IZE_HER_YERDE.includes(k)) s.push(`"${k}" is written with -ize: the set is written in en-GB (-ise), and the table makes the other forms`)
    else if (/yz(e|ed|es|ing)$/.test(k)) s.push(`"${k}" is written with -yze: the set is written in en-GB (-yse)`)
    else if (/our(s|ed|ing|ful|ite|ites|able|al|hood|ly|less|er|ers)?$/.test(k) && !OUR_GORUNUMLU.includes(k)) s.push(`"${k}" ends like an -our word and is not in the spelling table nor on the list of words that only look like one`)
    else if (k === 'analyses') s.push('"analyses" is a noun (the same everywhere) or a verb (analyzes elsewhere): write around it')
  }
  return s
}

/** Every string of a catalogue with its path. Functions and non-strings are skipped. */
export function tumMetinler(deger: unknown, yer = ''): { yer: string; metin: string }[] {
  if (typeof deger === 'string') return [{ yer, metin: deger }]
  if (Array.isArray(deger)) return deger.flatMap((x, i) => tumMetinler(x, `${yer}[${i}]`))
  if (deger && typeof deger === 'object') return Object.entries(deger).flatMap(([k, v]) => tumMetinler(v, yer ? `${yer}.${k}` : k))
  return []
}
