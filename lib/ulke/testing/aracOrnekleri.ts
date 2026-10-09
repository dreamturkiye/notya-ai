/**
 * NOTYA-ULKE-ARACLAR-01 — sample inputs for a tool of the kit, for tests: the same list every time it is asked.
 * Tests only (lib/ulke/testing/).
 */
import type { AracAlani, AracGirdisi, AracTanimi } from '../araclar/tipler'

/** Deterministic inputs for a tool: empty, everything at its first value, everything at its last, and a spread of mixes. */
export function ornekGirdiler(t: AracTanimi, adet = 40): AracGirdisi[] {
  const deger = (a: AracAlani, n: number): number | string | boolean | null => {
    if (a.tur === 'isaret') return n % 2 === 0
    if (a.tur === 'secim') return a.secenekler![n % a.secenekler!.length]
    if (a.tur === 'tarih') return `2026-${String((n % 12) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}`
    const enAz = a.enAz ?? 0, enCok = a.enCok ?? 100
    const x = enAz + ((enCok - enAz) * (n % 11)) / 10
    return a.tam || a.tur === 'puan' ? Math.round(x) : Math.round(x * 10) / 10
  }
  const bos = Object.fromEntries(t.alanlar.map((a) => [a.anahtar, a.tur === 'isaret' ? false : null]))
  const liste: AracGirdisi[] = [bos, Object.fromEntries(t.alanlar.map((a) => [a.anahtar, deger(a, 0)])), Object.fromEntries(t.alanlar.map((a) => [a.anahtar, deger(a, 10)]))]
  for (let i = 1; i <= adet; i++) liste.push(Object.fromEntries(t.alanlar.map((a, j) => [a.anahtar, (i * 7 + j * 3) % 5 === 0 && a.tur !== 'isaret' ? null : deger(a, i * 3 + j * 5 + (i % 2 ? j : 0))])))
  return liste
}
