/**
 * FOTO-AI-01 — evaluation harness: fixture format.
 *
 * A fixture set is a JSON file that holds CASES, never images. Images stay OUTSIDE the repository (a folder on the
 * evaluator's machine, e.g. Dr. Gökhan's), referenced by file name; the repository only ever contains synthetic fixtures
 * whose model answers are scripted (`yanit`), so the unit tests need no network and no photo.
 *
 *   {
 *     "surum": 1,
 *     "ad": "pediatri-dermatoloji-ilk-set",
 *     "olgular": [
 *       {
 *         "id": "olgu-001",                         // unique, no patient data
 *         "not": "free text for the evaluator",     // optional, never sent to the model
 *         "mod": "genel" | "pediatrik",             // which prompt/red-flag set to use
 *         "yas": "7 yaşında" | null,                // optional age text sent to the model (never a birth date)
 *         "veliDili": true | false,                 // minor patient -> true (veliDiliMi)
 *         "gorsel": "olgu-001.jpg",                 // file name inside --gorsel-dizini; absent in scripted (--sahte) mode
 *         "beklenen": {                             // the evaluator's reference reading; every key optional
 *           "bolge": "kol-sag" | null,              // null = the region cannot be identified
 *           "degerlendirilebilir": true | false,    // false = the correct behaviour is to ABSTAIN
 *           "kirmiziBayrak": ["peteshi-purpura"],   // codes that are truly present (var/olasi expected); [] = none present
 *           "kalite": "iyi" | "orta" | "yetersiz"
 *         },
 *         "yanit": { ... }                          // scripted raw model answer (--sahte mode and tests only)
 *       }
 *     ]
 *   }
 */
import { bolgeIdMi } from '@/lib/doktor/fotoArsiv/bolgeler'
import { bayrakKodlari, type FotoMod } from '../sema'

export interface Beklenen {
  bolge?: string | null
  degerlendirilebilir?: boolean
  kirmiziBayrak?: string[]
  kalite?: 'iyi' | 'orta' | 'yetersiz'
}

export interface Olgu {
  id: string
  not?: string
  mod: FotoMod
  yas: string | null
  veliDili: boolean
  gorsel?: string
  beklenen: Beklenen
  yanit?: unknown
}

export interface OlguSeti { surum: 1; ad: string; olgular: Olgu[] }

export function olguSetiDogrula(ham: unknown): { set?: OlguSeti; hatalar: string[] } {
  const hatalar: string[] = []
  if (!ham || typeof ham !== 'object') return { hatalar: ['Fixture bir JSON nesnesi olmalı.'] }
  const k = ham as Record<string, unknown>
  if (k.surum !== 1) hatalar.push('"surum": 1 olmalı.')
  if (!Array.isArray(k.olgular) || !k.olgular.length) hatalar.push('"olgular" boş olmayan bir dizi olmalı.')
  const olgular: Olgu[] = []
  const gorulen = new Set<string>()
  for (const [i, o] of (Array.isArray(k.olgular) ? (k.olgular as unknown[]) : []).entries()) {
    const yer = `olgular[${i}]`
    if (!o || typeof o !== 'object') { hatalar.push(`${yer}: nesne olmalı.`); continue }
    const r = o as Record<string, unknown>
    const id = typeof r.id === 'string' ? r.id.trim() : ''
    if (!/^[A-Za-z0-9_.-]{1,60}$/.test(id)) { hatalar.push(`${yer}: "id" 1-60 karakter (harf, rakam, _ . -) olmalı.`); continue }
    if (gorulen.has(id)) hatalar.push(`${yer}: "${id}" tekrar ediyor.`)
    gorulen.add(id)
    if (r.mod !== 'genel' && r.mod !== 'pediatrik') { hatalar.push(`${id}: "mod" genel | pediatrik olmalı.`); continue }
    const mod = r.mod as FotoMod
    const b = r.beklenen && typeof r.beklenen === 'object' ? (r.beklenen as Record<string, unknown>) : {}
    const beklenen: Beklenen = {}
    if ('bolge' in b) {
      if (b.bolge === null || (typeof b.bolge === 'string' && bolgeIdMi(b.bolge))) beklenen.bolge = b.bolge as string | null
      else hatalar.push(`${id}: beklenen.bolge bilinmeyen bir bölge kimliği.`)
    }
    if ('degerlendirilebilir' in b) {
      if (typeof b.degerlendirilebilir === 'boolean') beklenen.degerlendirilebilir = b.degerlendirilebilir
      else hatalar.push(`${id}: beklenen.degerlendirilebilir true/false olmalı.`)
    }
    if ('kirmiziBayrak' in b) {
      const kodlar = bayrakKodlari(mod)
      if (Array.isArray(b.kirmiziBayrak) && b.kirmiziBayrak.every((x) => typeof x === 'string' && kodlar.includes(x))) beklenen.kirmiziBayrak = b.kirmiziBayrak as string[]
      else hatalar.push(`${id}: beklenen.kirmiziBayrak, "${mod}" modunda geçerli kodların dizisi olmalı (${kodlar.join(', ')}).`)
    }
    if ('kalite' in b) {
      if (b.kalite === 'iyi' || b.kalite === 'orta' || b.kalite === 'yetersiz') beklenen.kalite = b.kalite
      else hatalar.push(`${id}: beklenen.kalite iyi | orta | yetersiz olmalı.`)
    }
    if (typeof r.gorsel === 'string' && !/^[\w. -]{1,120}$/.test(r.gorsel)) { hatalar.push(`${id}: "gorsel" yalnız dosya adı olmalı (yol değil).`); continue }
    olgular.push({
      id, mod, beklenen,
      yas: typeof r.yas === 'string' && r.yas.length <= 40 ? r.yas : null,
      veliDili: r.veliDili === true,
      ...(typeof r.not === 'string' ? { not: r.not.slice(0, 400) } : {}),
      ...(typeof r.gorsel === 'string' ? { gorsel: r.gorsel } : {}),
      ...('yanit' in r ? { yanit: r.yanit } : {}),
    })
  }
  if (hatalar.length) return { hatalar }
  return { set: { surum: 1, ad: typeof k.ad === 'string' ? k.ad.slice(0, 80) : 'adsiz', olgular }, hatalar: [] }
}
