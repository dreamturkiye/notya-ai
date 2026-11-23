/**
 * ESNEK-MUAYENE-B — what Notya NEVER learns (Kaan, 2026-11-23, approved design): right/left, doses, numbers, allergies,
 * negation and patient identity are always read fresh from the source. No learned rule, lexicon entry or style preference
 * may carry, create, remove or change any of them.
 *
 *  - `ogrenilemezMi(metin)`  → true when a candidate's text touches a never-learned class (refused at creation).
 *  - `korumaliImza(metin)`   → the multiset of never-learned tokens in a text; a learned transformation must leave it
 *                              exactly unchanged on every past approved note (the regression guard's hard rule).
 *
 * Built on the El Notu reader's protected classes (core/elNotu/korumali.ts — read only, never changed here) plus identity
 * patterns. Pure.
 */
import { korumaliSiniflar } from '@/core/elNotu/korumali'
import type { KorumaliTur } from '@/core/elNotu/tipler'
import { katla, kelimeler } from './metinAraclari'

/** Never-learned classes (drug NAMES are not in Kaan's list; their doses are). */
export const OGRENILMEZ: KorumaliTur[] = ['taraf', 'olumsuzluk', 'sayi', 'doz', 'alerji']

const TC = /\b\d{11}\b/
const TELEFON = /(?:\+?\d[\s-]?){10,}/
const EPOSTA = /[^\s@]+@[^\s@]+\.[^\s@]+/
const KIMLIK_SOZ = /\b(tc|t\.c\.|kimlik|protokol\s*no|dosya\s*no|hasta\s*adı|adı\s*soyadı|doğum\s*tarihi|telefon|adres|nhs|medicare|sin|ssn|pinfl)\b/i
/** Negation / allergy words that korumaliSiniflar knows only as single tokens — also caught inside phrases. */
const OLUMSUZ_EK = /(^|[^\p{L}])(yok|yoktur|saptanmad|izlenmed|negatif|değil|degil|olmayan|none|nil|no|denies|absent|нет|yo['ʻ’]?q)([^\p{L}]|$)/iu
const ALERJI_SOZ = /(alerj|allerj|allerg|аллерг|nkda|nka)/i

/** The never-learned classes of each token of a text. */
export function korumaliTokenler(metin: string): { token: string; siniflar: KorumaliTur[] }[] {
  const out: { token: string; siniflar: KorumaliTur[] }[] = []
  let alerjiBaglami = false
  for (const w of kelimeler(metin)) {
    const s = korumaliSiniflar(w, { oncekiAlerji: alerjiBaglami }).filter((x) => OGRENILMEZ.includes(x))
    if (ALERJI_SOZ.test(w)) alerjiBaglami = true
    if (s.length) out.push({ token: w, siniflar: s })
  }
  return out
}

/**
 * True when a text (a candidate's key, meaning, before or after) touches a never-learned class or identity. `adlar` = the
 * name parts of the patient(s) the evidence came from (the server passes them): a candidate carrying one is refused.
 */
export function ogrenilemezMi(metin: string | null | undefined, adlar: string[] = []): boolean {
  const t = String(metin || '')
  if (!t.trim()) return false
  if (/\d/.test(t)) return true
  if (TC.test(t) || TELEFON.test(t) || EPOSTA.test(t) || KIMLIK_SOZ.test(t)) return true
  if (adlar.length) {
    const ad = new Set(adlar.map((a) => katla(a).trim()).filter((a) => a.length >= 2))
    if (kelimeler(t).some((w) => ad.has(katla(w)))) return true
  }
  if (OLUMSUZ_EK.test(t) || ALERJI_SOZ.test(t)) return true
  if (/[↑↓Øø∅]/.test(t)) return true
  return korumaliTokenler(t).length > 0
}

/**
 * The multiset of never-learned tokens (folded, with their class). Two texts with the same signature carry the same sides,
 * negations, numbers, doses and allergy statements.
 */
export function korumaliImza(metin: string | null | undefined): string[] {
  const out: string[] = []
  for (const { token, siniflar } of korumaliTokenler(String(metin || ''))) for (const s of siniflar) out.push(`${s}:${katla(token)}`)
  return out.sort()
}

export function imzaAyniMi(a: string, b: string): boolean {
  const x = korumaliImza(a), y = korumaliImza(b)
  return x.length === y.length && x.every((v, i) => v === y[i])
}
