/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: one text, five forms of English.
 *
 * A LANGUAGE SET holds the text a language has in common across countries. It belongs to no country: it imports no
 * country pack, reads no country code, and carries no country's content (scripts/ulke-duvarlari.mjs, rule D8). A
 * country pack takes the set in ITS OWN form of the language and adds what is the country's.
 *
 * THE FORMS are the language codes the packs use (lib/ulke/tipler.ts → DilKodu): en-GB, en-US, en-CA, en-AU, en-NZ.
 * Every text of the set is written once, in the spelling of en-GB; `enYaz(text, form)` writes it in another form with
 * the table of ./sozluk.ts and nothing else. Vocabulary that differs by COUNTRY (a role's title, the name of a
 * patient identifier, a consent sentence) is not spelling and is not here: it is the country pack's.
 *
 * Pure, and the same on the server and in the browser. Converting is one pass per text with two fixed patterns.
 */
import { KELIMELER, KOKLER, KORUNAN, type Kelime } from './sozluk'

export const EN_BICIMLER = ['en-GB', 'en-US', 'en-CA', 'en-AU', 'en-NZ'] as const
export type EnBicim = (typeof EN_BICIMLER)[number]
/** The form the set's texts are written in. */
export const EN_TEMEL: EnBicim = 'en-GB'

export const enBicimMi = (ham: unknown): ham is EnBicim => typeof ham === 'string' && (EN_BICIMLER as readonly string[]).includes(ham)

/** What a row's British spelling becomes in a form. The base itself for en-GB and en-NZ. */
function hedef(k: Pick<Kelime, 'gb' | 'us' | 'ca' | 'au'>, bicim: EnBicim): string {
  if (bicim === 'en-US') return k.us
  if (bicim === 'en-CA') return k.ca === 'us' ? k.us : k.gb
  if (bicim === 'en-AU') return k.au ?? k.gb
  return k.gb
}

type Tablo = { kelime: RegExp | null; kelimeler: ReadonlyMap<string, string>; kok: RegExp | null; kokler: ReadonlyMap<string, string> }

const kacis = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Longest first, so that a longer word or stem wins over one it contains. */
const uzundanKisaya = (a: string, b: string): number => b.length - a.length || (a < b ? -1 : 1)

/** Every whole word of the table with each ending written out, in each column. For tests and documentation. */
export function kelimeSatirlari(): readonly { gb: string; us: string; ca: string; au: string; belirsiz: boolean }[] {
  return KELIMELER.flatMap((k) => (k.ekler ?? ['']).map((ek) => ({
    gb: `${k.gb}${ek}`,
    us: `${k.us}${ek}`,
    ca: `${k.ca === 'us' ? k.us : k.gb}${ek}`,
    au: `${k.au ?? k.gb}${ek}`,
    belirsiz: k.belirsiz === true,
  })))
}

const TABLOLAR = new Map<EnBicim, Tablo>()
function tablo(bicim: EnBicim): Tablo {
  const hazir = TABLOLAR.get(bicim)
  if (hazir) return hazir
  const kelimeler = new Map<string, string>()
  for (const k of KELIMELER) for (const ek of k.ekler ?? ['']) {
    const yeni = `${hedef(k, bicim)}${ek}`
    if (yeni !== `${k.gb}${ek}`) kelimeler.set(`${k.gb}${ek}`, yeni)
  }
  const kokler = new Map<string, string>()
  for (const k of KOKLER) { const yeni = hedef(k, bicim); if (yeni !== k.gb) kokler.set(k.gb, yeni) }
  const t: Tablo = {
    kelime: kelimeler.size ? new RegExp(`(?<![A-Za-z])(${[...kelimeler.keys()].sort(uzundanKisaya).map(kacis).join('|')})(?![A-Za-z])`, 'gi') : null,
    kelimeler,
    kok: kokler.size ? new RegExp(`(${[...kokler.keys()].sort(uzundanKisaya).map(kacis).join('|')})`, 'gi') : null,
    kokler,
  }
  TABLOLAR.set(bicim, t)
  return t
}

/** The replacement in the capitals of what it replaces: "colour" → "color", "Colour" → "Color", "COLOUR" → "COLOR". */
function harfDuzeni(bulunan: string, yeni: string): string {
  if (bulunan.length > 1 && bulunan === bulunan.toUpperCase() && bulunan !== bulunan.toLowerCase()) return yeni.toUpperCase()
  if (bulunan[0] !== bulunan[0].toLowerCase()) return yeni[0].toUpperCase() + yeni.slice(1)
  return yeni
}

const KORUNAN_DESEN = new RegExp(`(?<![A-Za-z])(${KORUNAN.map(kacis).join('|')})(?![A-Za-z])`, 'gi')
const YER = '\u0000'
const YER_DESEN = new RegExp(`${YER}(\\d+)${YER}`, 'g')

/** One text of the set, written in a form. The base form comes back unchanged. */
export function enYaz(metin: string, bicim: EnBicim): string {
  const t = tablo(bicim)
  if (!t.kelime && !t.kok) return metin
  let s = metin
  if (t.kelime) s = s.replace(t.kelime, (m) => harfDuzeni(m, t.kelimeler.get(m.toLowerCase()) ?? m))
  if (t.kok) {
    // A protected word is set aside, the stems are written, and it is put back as it was.
    const saklanan: string[] = []
    s = s.replace(KORUNAN_DESEN, (m) => { saklanan.push(m); return `${YER}${saklanan.length - 1}${YER}` })
    s = s.replace(t.kok, (m) => harfDuzeni(m, t.kokler.get(m.toLowerCase()) ?? m))
    s = s.replace(YER_DESEN, (_m, i: string) => saklanan[Number(i)])
  }
  return s
}

/**
 * A whole catalogue (any depth of records and lists) written in a form: every string is converted, everything else
 * (numbers, booleans, null, functions) is handed on as it is. Keys are never touched: they are the kit's.
 */
export function enCevir<T>(deger: T, bicim: EnBicim): T {
  if (typeof deger === 'string') return enYaz(deger, bicim) as unknown as T
  if (Array.isArray(deger)) return deger.map((x) => enCevir(x, bicim)) as unknown as T
  if (deger && typeof deger === 'object') {
    const c: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(deger)) c[k] = enCevir(v, bicim)
    return c as T
  }
  return deger
}

/**
 * The spellings that must NOT be found in a text of `bicim`: for every row, each spelling the table has for ANOTHER
 * form where this form writes the word differently. Where a row is `belirsiz`, its American spelling is not hunted
 * (it is also a British word). `kokler` are the British stems, for the forms that write those words the American
 * way; the reverse cannot be hunted by stem (see ./sozluk.ts → ABD_TIBBI_YAZIMLAR, returned here as `tibbi`).
 * For tests.
 */
export function yabanciYazimlar(bicim: EnBicim, abdTibbi: readonly string[] = []): { kelimeler: readonly string[]; kokler: readonly string[]; tibbi: readonly string[] } {
  const kendi = new Set<string>()
  for (const k of KELIMELER) for (const ek of k.ekler ?? ['']) kendi.add(`${hedef(k, bicim)}${ek}`)
  const kelimeler = new Set<string>()
  for (const k of KELIMELER) for (const ek of k.ekler ?? ['']) {
    const adaylar = [k.gb, ...(k.belirsiz ? [] : [k.us]), ...(k.au && !k.belirsiz ? [k.au] : [])]
    for (const a of adaylar) if (!kendi.has(`${a}${ek}`)) kelimeler.add(`${a}${ek}`)
  }
  const kokler = KOKLER.filter((k) => hedef(k, bicim) !== k.gb).map((k) => k.gb)
  const ingilizYazar = KOKLER.every((k) => hedef(k, bicim) === k.gb)
  return { kelimeler: [...kelimeler].sort(), kokler, tibbi: ingilizYazar ? abdTibbi : [] }
}
