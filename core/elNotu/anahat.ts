/**
 * ESNEK-READER-2 — the STRUCTURE PRIOR of a doctor's handwritten notes (pure, country-neutral; words are data).
 *
 * A physician writes his history pages in a stable outline (Turkish history pages: complaint / timeline, Sistemik
 * hastalık, Sürekli ilaç, İlaç alerjisi, Alerjik nedenler, Sigara, Su/sıvı, ÖS, tanı, plan …). Knowing that outline is a
 * large part of how a human reads a scrawl. The reader gets it as a READING AID only: fields may be missing, reordered or
 * abbreviated, and a heading that is not written is never added (the prompt says so, the consensus and the invention
 * guard enforce it).
 *
 * The outline is learned per doctor from texts he confirmed (Doğrula-complete sources) and, when shadow mode is on, the
 * secretary's typed notes of the same visits: a heading = the text before ":" / "-" at the start of a line, or a line that
 * starts with a known seed heading. Headings that recur (≥ 25 % of the texts, at least 2 texts) are kept in their median
 * order. With too few texts, the build's default outline for the branş is used.
 */
import { kelimeAnahtari, benzerlik } from './uzlastir'

export type AnahatAlani = {
  /** Display name of the field as the doctor writes it (e.g. "Sigara"). */
  ad: string
  /** Clinical kind: decides how much an unclear word here matters (Doğrula priority). */
  tur: 'oyku' | 'sistemik' | 'ilac' | 'alerji' | 'aliskanlik' | 'ozgecmis' | 'muayene' | 'tetkik' | 'tani' | 'plan' | 'diger'
  /** Other spellings / abbreviations of the heading (folded matching). */
  esler?: string[]
  /** Every word written in this field (after its heading, continuation lines included) is protected — drug allergy. */
  korumali?: 'alerji'
}

export type Anahat = { alanlar: AnahatAlani[]; kaynak: 'hekim' | 'varsayilan'; metinSayisi: number }

/** Field kinds where an unclear word changes clinical meaning (asked before anything else that is not protected). */
export const KRITIK_TURLER: ReadonlySet<AnahatAlani['tur']> = new Set(['ilac', 'alerji', 'tani', 'plan', 'sistemik', 'tetkik'])

const bas = (s: string) => kelimeAnahtari(s).replace(/\s+/g, ' ').trim()

/** The field of a heading text (folded, fuzzy on the first word), or null. */
export function alanBul(baslik: string, alanlar: AnahatAlani[]): AnahatAlani | null {
  const b = bas(baslik)
  if (!b) return null
  // exact / prefix first (so "Alerjik nedenler" never lands in "İlaç alerjisi" through its fuzzy alias), then fuzzy
  for (const a of alanlar) for (const e of [a.ad, ...(a.esler || [])]) { const k = bas(e); if (k && (b === k || b.startsWith(k + ' '))) return a }
  for (const a of alanlar) for (const e of [a.ad, ...(a.esler || [])]) {
    const k = bas(e)
    if (!k) continue
    if (b === k || b.startsWith(k + ' ') || (k.length >= 4 && b.length >= 4 && benzerlik(b.split(' ')[0], k.split(' ')[0]) >= 0.8 && (k.split(' ').length === 1 || b.includes(k.split(' ')[1]?.slice(0, 3) || '')))) return a
  }
  return null
}

const BASLIK = /^\s*[-•*]?\s*([\p{L}ÖöÇçŞşĞğÜüİı][\p{L}\s./ÖöÇçŞşĞğÜüİı]{0,28}?)\s*[:\-–=]\s*/u

/**
 * Learn the outline from confirmed texts. `varsayilan` = the build's default outline (seed data) — it names the kinds and
 * supplies spellings; a heading of the doctor that matches no default field is kept as kind 'diger'.
 */
export function anahatOgren(metinler: string[], varsayilan: AnahatAlani[], enAz = 3): Anahat {
  const temiz = metinler.map((m) => String(m || '').replace(/⟦[^⟧]*⟧/g, ' ')).filter((m) => m.trim().length > 20)
  if (temiz.length < enAz) return { alanlar: varsayilan, kaynak: 'varsayilan', metinSayisi: temiz.length }
  const sayim = new Map<string, { alan: AnahatAlani; metin: Set<number>; sira: number[] }>()
  temiz.forEach((m, mi) => {
    const satirlar = m.split(/\n+/)
    satirlar.forEach((s, si) => {
      const konum = si / Math.max(1, satirlar.length - 1)
      const hm = s.match(BASLIK)
      const aday = hm ? hm[1] : s.trim().split(/\s+/).slice(0, 3).join(' ')
      const alan = alanBul(aday, varsayilan) || (hm ? { ad: hm[1].trim(), tur: 'diger' as const } : null)
      if (!alan) return
      const anah = bas(alan.ad)
      const kayit = sayim.get(anah) || { alan, metin: new Set<number>(), sira: [] }
      if (!kayit.metin.has(mi)) { kayit.metin.add(mi); kayit.sira.push(konum) }
      sayim.set(anah, kayit)
    })
  })
  const esik = Math.max(2, Math.ceil(temiz.length * 0.25))
  const medyan = (x: number[]) => { const s = [...x].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
  const alanlar = [...sayim.values()].filter((k) => k.metin.size >= esik).sort((a, b) => medyan(a.sira) - medyan(b.sira)).map((k) => k.alan)
  if (alanlar.length < 3) return { alanlar: varsayilan, kaynak: 'varsayilan', metinSayisi: temiz.length }
  return { alanlar, kaynak: 'hekim', metinSayisi: temiz.length }
}

/** Prompt block (English instructions; field names in the doctor's language). */
export function anahatBlogu(a: Anahat): string {
  if (!a.alanlar.length) return ''
  const kim = a.kaynak === 'hekim' ? "THIS physician's notes (learned from his confirmed pages)" : 'Notes of this specialty'
  return `${kim} usually follow this outline — a READING AID only: fields may be missing, reordered, abbreviated or written as a symbol; never add a field that is not written:\n${a.alanlar.map((x, i) => `${i + 1}. ${x.ad}${x.esler?.length ? ` (also written: ${x.esler.slice(0, 4).join(', ')})` : ''}`).join('\n')}`
}
