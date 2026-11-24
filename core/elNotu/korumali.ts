/**
 * ESNEK-MUAYENE-A — protected reading classes (pure). Kaan, requirement 3: right/left, negation (Ø), numbers, doses, drug
 * names and allergies are NEVER auto-accepted below high confidence — they need a reading confirmation (secretary or
 * doctor). A protected word is accepted without a question only when BOTH independent reads agree on it exactly AND its
 * combined confidence is at least KORUMALI_ESIK; a drug name must also be a known drug (the build's drug list).
 *
 * The word lists cover the languages of all builds (Turkish, English, Uzbek Latin/Cyrillic, Russian): they are patterns,
 * never shown to anyone.
 */
import type { KorumaliTur } from './tipler'

export const KORUMALI_ESIK = 0.92
export const KELIME_ESIK = 0.8

const katla = (s: string) => s.toLocaleLowerCase('tr').replace(/[.,;:()]/g, '').trim()

const TARAF = new Set([
  'sağ', 'sag', 'sol', 'sğ', 'sl', 'bilateral', 'bil', 'bilat', 'iki', 'taraflı', 'sağda', 'solda', 'sağdan', 'soldan', 'sağı', 'solu',
  'r', 'l', 'rt', 'lt', 'right', 'left', 'bilat.', 'b/l', 'ipsilateral', 'kontralateral', 'contralateral',
  "o'ng", 'chap', 'ikki', 'ong', 'ўнг', 'чап', 'справа', 'слева', 'правый', 'левый', 'правая', 'левая', 'двусторонний',
])
const OLUMSUZ = new Set([
  'ø', '∅', 'Ø', 'yok', 'yoktur', 'olmayan', 'negatif', 'neg', '(-)', '-', 'saptanmadı', 'izlenmedi', 'değil', 'hayır',
  'no', 'none', 'nil', 'nad', 'absent', 'negative', 'denies', 'not', 'without', 'yoʻq', "yo'q", 'йўқ', 'нет', 'отр', 'отрицательный', 'без',
])
const ALERJI = /^(alerji|allerji|alj|allergy|allergies|allergic|nkda|nka|allergiya|аллергия|аллергия)/i
const DOZ_BIRIM = /(\d)\s*(mg|mcg|µg|g|gr|ml|cc|iu|ü|ünite|unit|units|tb|tab|tablet|kps|caps|damla|dml|drop|puf|puff|amp|fl|x|×|\/)/i
const SAYI = /\d/

/** The protected classes of one token, in its line context (a drug list lookup is injected by the build). */
export type IlacEslesmesi = (t: string) => { durum: 'tam' | 'yakin'; ad: string } | null

export function korumaliSiniflar(token: string, o: { oncekiAlerji?: boolean; ilac?: IlacEslesmesi } = {}): KorumaliTur[] {
  const t = token.trim()
  if (!t) return []
  const k = katla(t)
  const out = new Set<KorumaliTur>()
  if (TARAF.has(k) || /^(sa[gğ]|sol)(a|da|dan|ı|u|daki|dakı|dan)?$/i.test(k)) out.add('taraf')
  if (OLUMSUZ.has(t) || OLUMSUZ.has(k) || /^[øØ∅]/.test(t)) out.add('olumsuzluk')
  if (DOZ_BIRIM.test(t) || /^\d+\s*[x×]\s*\d+$/i.test(t)) out.add('doz')
  else if (SAYI.test(t)) out.add('sayi')
  if (ALERJI.test(k) || o.oncekiAlerji) out.add('alerji')
  if (o.ilac && k.length >= 4 && o.ilac(t)) out.add('ilac')
  return [...out]
}

/** Classes of every word of a line; a word after an allergy keyword inherits 'alerji' until the line ends. */
/** Unit abbreviations that collide with side abbreviations ("lt" = litre, not left) when they follow a number. */
const BIRIM_SONRASI = new Set(['lt', 'l', 'ml', 'cc'])

export function satirKorumali(kelimeler: string[], ilac?: IlacEslesmesi): KorumaliTur[][] {
  let alerjiBaglami = false
  return kelimeler.map((w, i) => {
    let s = korumaliSiniflar(w, { oncekiAlerji: alerjiBaglami, ilac })
    if (i > 0 && /\d/.test(kelimeler[i - 1]) && BIRIM_SONRASI.has(katla(w))) s = [...s.filter((x) => x !== 'taraf'), 'doz']
    if (ALERJI.test(katla(w))) alerjiBaglami = true
    return s
  })
}

/** Accept rule for a word. Protected → both reads agree AND confidence ≥ KORUMALI_ESIK (drug: must also be a known drug). */
export function kabulEdilirMi(g: { guven: number; uyum: boolean; korumali: KorumaliTur[]; bilinenIlac?: boolean }): boolean {
  if (!g.korumali.length) return g.guven >= KELIME_ESIK && g.uyum
  if (!g.uyum || g.guven < KORUMALI_ESIK) return false
  if (g.korumali.includes('ilac') && !g.bilinenIlac) return false
  return true
}
