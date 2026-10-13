/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: helpers the intake form's questions are written with. No question is
 * defined here; only the shapes the question files use, a few answers and detail labels many questions share, and the
 * step that turns a question written once (in en-GB spelling) into the kit's shape in a country's form of English.
 *
 * Sharing a LABEL between roles is not a leak: a label is a piece of text ("Which ones? A few words."). A QUESTION
 * belongs to the one set that lists it, and every question key is unique in the whole set (the kit's check).
 */
import type { FormBolumu, FormIncelemesi, Olcu, RolSorulari, Secenek, Soru } from '@/lib/ulke/intake/tipler'
import { enYaz, type EnBicim } from '../../varyant'

/** Every set today: written by a machine, read by no clinician of any country. */
export const MAKINE: FormIncelemesi = { makineYazimi: true, klinisyen: null }

export type HamSecenek = { anahtar: string; ad: string; tek?: boolean }
type Ek = { zorunlu?: boolean; kime?: 'yetiskin' | 'cocuk'; cinsiyet?: 'female' | 'male'; yardim?: string; veliMetni?: string }
export type HamSoru = Ek & {
  anahtar: string
  tur: Soru['tur']
  metin: string
  ayrinti?: string
  secenekler?: readonly HamSecenek[]
  olcu?: Olcu
  birim?: string
  enAz?: number
  enCok?: number
}
export type HamBolum = { anahtar: string; baslik: string; veliBasligi?: string; kime?: 'yetiskin' | 'cocuk'; sorular: readonly HamSoru[] }
export type HamRol = { baslik: string; veliBasligi?: string; sorular: readonly HamSoru[] }

/** An option of a choice. */
export const s = (anahtar: string, ad: string): HamSecenek => ({ anahtar, ad })
/** "None of these" — stands alone in a multiple choice. */
export const HICBIRI = (): HamSecenek => ({ anahtar: 'none', ad: 'None of these', tek: true })
/** Yes / no / I do not know, as a single choice. */
export const EVET_HAYIR_BILMIYORUM = (): HamSecenek[] => [s('yes', 'Yes'), s('no', 'No'), s('unknown', 'I do not know')]

export const tek = (anahtar: string, metin: string, secenekler: readonly HamSecenek[], ek: Ek = {}): HamSoru => ({ anahtar, tur: 'tek-secim', metin, secenekler, ...ek })
export const cok = (anahtar: string, metin: string, secenekler: readonly HamSecenek[], ek: Ek = {}): HamSoru => ({ anahtar, tur: 'cok-secim', metin, secenekler, ...ek })
export const kisa = (anahtar: string, metin: string, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'kisa-metin', metin, ...ek })
export const uzun = (anahtar: string, metin: string, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'uzun-metin', metin, ...ek })
/** Yes / no; `ayrinti` is the label of the line asked after "yes". */
export const eh = (anahtar: string, metin: string, ayrinti?: string, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'evet-hayir', metin, ...(ayrinti ? { ayrinti } : {}), ...ek })
export const gun = (anahtar: string, metin: string, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'tarih', metin, ...ek })
/** A measure in the PACK's unit (height, weight, temperature): the unit is never written into the question. */
export const olcu = (anahtar: string, metin: string, o: Olcu, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'sayi', olcu: o, metin, ...ek })
/** A number with a unit of the question's own (a count, a score). Never a measure a country reads in its own unit. */
export const sayi = (anahtar: string, metin: string, birim: string, enAz: number, enCok: number, ek: Ek = {}): HamSoru => ({ anahtar, tur: 'sayi', metin, birim, enAz, enCok, ...ek })

// ── labels of the detail line after "yes", shared by many questions ──
export const HANGILERI = 'Which ones? A few words.'
export const NE = 'What exactly? A few words.'
export const NE_ZAMAN = 'When, and why?'
export const TETKIK = 'Which test, when, and the result (as far as you know)'
export const KIMDE = 'Who, and which condition?'
export const ILAC_ADI = 'Name of the medicine (if you know it)'
export const DEGERLER = 'What are the readings usually?'

// ── units of a question's own ──
export const PUAN = 'out of 10'
export const KEZ = 'times'
export const HAFTA = 'weeks'
export const SAAT = 'hours'
export const BARDAK = 'glasses'

/** A question written once → the kit's question, in a country's form of English. */
export function soruyuBicimle(q: HamSoru, bicim: EnBicim): Soru {
  const m = (metin: string) => ({ [bicim]: enYaz(metin, bicim) })
  const ortak = {
    anahtar: q.anahtar,
    metin: m(q.metin),
    ...(q.veliMetni ? { veliMetni: m(q.veliMetni) } : {}),
    ...(q.yardim ? { yardim: m(q.yardim) } : {}),
    ...(q.zorunlu ? { zorunlu: true } : {}),
    ...(q.kime ? { kime: q.kime } : {}),
    ...(q.cinsiyet ? { cinsiyet: q.cinsiyet } : {}),
  }
  if (q.tur === 'tek-secim' || q.tur === 'cok-secim') return { ...ortak, tur: q.tur, secenekler: (q.secenekler ?? []).map((o): Secenek => ({ anahtar: o.anahtar, ad: m(o.ad), ...(o.tek ? { tek: true } : {}) })) }
  if (q.tur === 'evet-hayir') return { ...ortak, tur: 'evet-hayir', ...(q.ayrinti ? { ayrinti: m(q.ayrinti) } : {}) }
  if (q.tur === 'sayi') return q.olcu ? { ...ortak, tur: 'sayi', olcu: q.olcu } : { ...ortak, tur: 'sayi', birim: m(q.birim ?? ''), enAz: q.enAz ?? 0, enCok: q.enCok ?? 0 }
  return { ...ortak, tur: q.tur }
}

export function bolumuBicimle(b: HamBolum, bicim: EnBicim): FormBolumu {
  return { anahtar: b.anahtar, baslik: { [bicim]: enYaz(b.baslik, bicim) }, ...(b.veliBasligi ? { veliBasligi: { [bicim]: enYaz(b.veliBasligi, bicim) } } : {}), ...(b.kime ? { kime: b.kime } : {}), sorular: b.sorular.map((q) => soruyuBicimle(q, bicim)) }
}

export function roluBicimle(r: HamRol, bicim: EnBicim): RolSorulari {
  return { baslik: { [bicim]: enYaz(r.baslik, bicim) }, ...(r.veliBasligi ? { veliBasligi: { [bicim]: enYaz(r.veliBasligi, bicim) } } : {}), sorular: r.sorular.map((q) => soruyuBicimle(q, bicim)), inceleme: MAKINE }
}
