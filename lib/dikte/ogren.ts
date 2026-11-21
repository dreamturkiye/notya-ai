/**
 * DIKTE-TIBBI-01 (c) — the doctor's personal dictation vocabulary: which "heard → correct" pairs may be stored.
 *
 * A pair comes from the doctor correcting a misrecognised term (in the note on approval, or in the dictated transcript
 * before "Seansı Bitir"), or from the doctor typing it in Ayşe'nin hafızası. Rules (pure, tested):
 *   - TERMS ONLY: 1–4 words a side, letters / space / apostrophe / hyphen, ≤ 50 characters — no digits, so no dose,
 *     no date, no phone, no protocol number can ever be stored;
 *   - a protected word (laterality, negation, quantity, units — KORUNAN) may not be added, removed or changed:
 *     "sağ" → "sol" is a clinical correction, never a dictation pair;
 *   - learned automatically (not typed by the doctor) only when the two sides SOUND alike (edit distance ≤ 60 % of the
 *     longer form), the correct side contains a known medical / drug term, and the heard side is not itself a term —
 *     so a patient name, a finding that changed, or one term swapped for another is never learned.
 * Pairs are per doctor (doktor_dikte_sozlugu.doctor_id) and never shared.
 */
import { anahtar, mesafe } from './duzelt'
import { EKLER, KORUNAN } from './yaygin'

export const KISISEL_AZAMI = 500
const IZINLI = /^[\p{L}\p{M}][\p{L}\p{M}'’\- ]*$/u

export interface Cift { duyulan: string; dogru: string }

const kelimeler = (s: string) => s.trim().split(/\s+/).filter(Boolean)

function korunanlar(s: string): string {
  return kelimeler(anahtar(s)).filter((w) => KORUNAN.has(w)).sort().join(' ')
}

/** Shared shape check for both automatic and typed pairs. Returns a cleaned pair or null. */
export function ciftBicimi(duyulan: string, dogru: string): Cift | null {
  const d = String(duyulan || '').replace(/\s+/g, ' ').trim()
  const g = String(dogru || '').replace(/\s+/g, ' ').trim()
  if (d.length < 2 || g.length < 2 || d.length > 50 || g.length > 50) return null
  if (!IZINLI.test(d) || !IZINLI.test(g)) return null
  const dk = kelimeler(d)
  const gk = kelimeler(g)
  if (!dk.length || !gk.length || dk.length > 4 || gk.length > 4) return null
  if (anahtar(d) === anahtar(g)) return null
  if (korunanlar(d) !== korunanlar(g)) return null
  // a pair that is only protected words would rewrite them everywhere
  if (kelimeler(anahtar(d)).every((w) => KORUNAN.has(w))) return null
  return { duyulan: d, dogru: g }
}

/** Is this word (or the word with one suffix off) in the known-term set? */
export function terimMi(w: string, bilinen: (k: string) => boolean): boolean {
  const k = anahtar(w)
  if (k.length < 4) return false
  if (bilinen(k)) return true
  for (const e of EKLER) if (k.length - e.length >= 4 && k.endsWith(e) && bilinen(k.slice(0, -e.length))) return true
  return false
}

/** May this pair be LEARNED from a correction (not typed by the doctor)? */
export function otomatikCiftMi(c: Cift, bilinen: (k: string) => boolean): boolean {
  const b = ciftBicimi(c.duyulan, c.dogru)
  if (!b) return false
  const dd = anahtar(b.duyulan).replace(/ /g, '')
  const gg = anahtar(b.dogru).replace(/ /g, '')
  const uzun = Math.max(dd.length, gg.length)
  if (uzun < 4) return false
  if (mesafe(dd, gg, uzun) / uzun > 0.6) return false
  const dogruKelime = kelimeler(b.dogru).filter((w) => !KORUNAN.has(anahtar(w)))
  if (!dogruKelime.some((w) => terimMi(w, bilinen))) return false
  const duyulanKelime = kelimeler(b.duyulan).filter((w) => !KORUNAN.has(anahtar(w)))
  if (duyulanKelime.length && duyulanKelime.every((w) => terimMi(w, bilinen))) return false
  return true
}

/**
 * Word-level substitutions between a text before and after the doctor's edit: each changed run of 1–4 words replaced
 * by 1–4 words, with unchanged words on both sides (LCS on folded words). Insertions and deletions are ignored.
 */
export function degisenParcalar(once: string, sonra: string, azami = 1500): Cift[] {
  const a = kelimeler(String(once || '').replace(/[.,;:!?()"“”]/g, ' '))
  const b = kelimeler(String(sonra || '').replace(/[.,;:!?()"“”]/g, ' '))
  if (!a.length || !b.length || a.length > azami || b.length > azami) return []
  const ak = a.map(anahtar)
  const bk = b.map(anahtar)
  const n = a.length
  const m = b.length
  // LCS table, row by row from the end (Uint16 is enough; azami keeps it ≤ 4.5 MB)
  const L: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = ak[i] === bk[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out: Cift[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (ak[i] === bk[j]) { i++; j++; continue }
    const i0 = i
    const j0 = j
    while (i < n && j < m && ak[i] !== bk[j]) {
      if (L[i + 1][j] >= L[i][j + 1]) i++
      else j++
    }
    const silinen = a.slice(i0, i)
    const eklenen = b.slice(j0, j)
    if (silinen.length >= 1 && silinen.length <= 4 && eklenen.length >= 1 && eklenen.length <= 4) out.push({ duyulan: silinen.join(' '), dogru: eklenen.join(' ') })
  }
  return out
}

/** Pairs worth learning from one edit (deduplicated by heard key). */
export function duzeltmedenCiftler(once: string, sonra: string, bilinen: (k: string) => boolean): Cift[] {
  const gorulen = new Set<string>()
  const out: Cift[] = []
  for (const c of degisenParcalar(once, sonra)) {
    if (!otomatikCiftMi(c, bilinen)) continue
    const b = ciftBicimi(c.duyulan, c.dogru)!
    const k = anahtar(b.duyulan)
    if (gorulen.has(k)) continue
    gorulen.add(k)
    out.push(b)
  }
  return out
}
