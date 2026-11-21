/**
 * DIKTE-TIBBI-01 — drug-name targets for dictation repair, from the repo's SGK list (data/sgk-ilaclar.json, 8.666
 * products). SERVER ONLY (reads the file once per process; ~2 MB, parsed lazily on the first dictation that needs it).
 *
 * Targets: the first word of each brand (5+ letters, no digits — "AUGMENTIN", "PAROL") shown in title case, and each
 * active-ingredient word (5+ letters — "parasetamol", "amoksisilin") in lower case. The corrector only reaches for
 * these next to a dose / form / prescribing word (duzelt.ts, ILAC_BAGLAMI), so a drug is never invented from prose.
 */
import { readFileSync } from 'fs'
import path from 'path'
import { hedefIndeksiKur, type HedefIndeksi } from './duzelt'
import { YAYGIN, KORUNAN } from './yaygin'

let indeks: HedefIndeksi | null | undefined
let terimler: string[] = []

// The SGK list spells brands in ASCII capitals ("AUGMENTIN"): a Turkish-locale lower case would give "Augmentın".
const baslikHarf = (s: string) => s.charAt(0) + (/^[A-Z]+$/.test(s) ? s.slice(1).toLowerCase() : s.slice(1).toLocaleLowerCase('tr-TR'))
const fold = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')

/** Unique drug words (brands title-cased, ingredients lower-case). */
export function ilacTerimleri(): string[] {
  if (indeks === undefined) ilacIndeksi()
  return terimler
}

export function ilacIndeksi(): HedefIndeksi | null {
  if (indeks !== undefined) return indeks
  try {
    const ham = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8')) as { ilaclar?: { marka?: string; etkenMadde?: string }[] }
    const kume = new Map<string, string>()
    for (const i of ham.ilaclar || []) {
      const ilk = String(i.marka || '').split(/[\s,.()/%+-]+/).find(Boolean) || ''
      if (ilk.length >= 5 && /^[\p{L}]+$/u.test(ilk)) {
        const k = fold(ilk)
        if (!YAYGIN.has(k) && !KORUNAN.has(k) && !kume.has(k)) kume.set(k, baslikHarf(ilk))
      }
      for (const w of String(i.etkenMadde || '').split(/[\s,.()/%+-]+/)) {
        if (w.length < 6 || !/^[\p{L}]+$/u.test(w)) continue
        const k = fold(w)
        if (!YAYGIN.has(k) && !KORUNAN.has(k) && !kume.has(k)) kume.set(k, w.toLocaleLowerCase('tr-TR'))
      }
    }
    terimler = [...kume.values()]
    indeks = hedefIndeksiKur(terimler)
  } catch {
    indeks = null
    terimler = []
  }
  return indeks
}
