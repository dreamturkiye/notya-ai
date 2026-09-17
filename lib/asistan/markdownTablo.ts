/**
 * MD-TABLO — pipe-table parsing for HafifMarkdown (assistant answers showed "| SB | ACOG |" / "|---|---|" as raw text).
 * GitHub-style: a header row with pipes, then a separator row (-, ---, :--, --:, :-:), then body rows while lines contain "|".
 * Pure, no React; the component renders the result.
 */

export type Hizalama = 'sol' | 'orta' | 'sag'
export type Tablo = { baslik: string[]; hizalar: Hizalama[]; satirlar: string[][] }

const AYIRICI_RE = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?$/

/** "| a | b \| c |" → ["a", "b | c"] (escaped pipes stay in the cell). */
export function hucreler(satir: string): string[] {
  let s = satir.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1)
  return s.split(/(?<!\\)\|/).map((h) => h.replace(/\\\|/g, '|').trim())
}

export function ayiriciMi(satir: string): boolean {
  return AYIRICI_RE.test(satir.trim())
}

/** Does a table start at satirlar[i]? (header with a pipe + separator with the same or compatible column count) */
export function tabloBasiMi(satirlar: string[], i: number): boolean {
  const bas = satirlar[i]?.trim() || ''
  const ayr = satirlar[i + 1]
  return bas.includes('|') && !ayiriciMi(bas) && ayr !== undefined && ayiriciMi(ayr) && hucreler(ayr).length === hucreler(bas).length
}

/** Parse the table starting at i. Returns the table and the index of the first line after it. */
export function tabloOku(satirlar: string[], i: number): { tablo: Tablo; sonraki: number } {
  const baslik = hucreler(satirlar[i])
  const hizalar: Hizalama[] = hucreler(satirlar[i + 1]).map((h) => (h.startsWith(':') && h.endsWith(':') ? 'orta' : h.endsWith(':') ? 'sag' : 'sol'))
  const satirlarOut: string[][] = []
  let j = i + 2
  for (; j < satirlar.length; j++) {
    const t = satirlar[j].trim()
    if (!t || !t.includes('|')) break
    if (ayiriciMi(t)) continue
    const h = hucreler(t)
    // short rows are padded, long rows keep the extra text in the last column
    const hucre = h.length > baslik.length ? [...h.slice(0, baslik.length - 1), h.slice(baslik.length - 1).join(' | ')] : [...h, ...Array(baslik.length - h.length).fill('')]
    satirlarOut.push(hucre)
  }
  return { tablo: { baslik, hizalar, satirlar: satirlarOut }, sonraki: j }
}
