/**
 * AU-QUICK-01 — DIAGNOSIS-CODE SOURCE. SERVER ONLY (reads files; never import from a client component).
 *
 * One interface, two providers:
 *   - `acikKaynak`  : the OPEN data — a WHO ICD-10 tabular list and the open ICD-10 -> ICD-10-AM mapping — read from
 *                     OPTIONAL files. No data ships in the repository: the files are not present until the licence
 *                     question in docs/OPEN-COMMITMENTS.md (AU-QUICK-01) is answered. Missing file = `hazir() === false`
 *                     = the screen shows its empty state and the Quick access tile is not drawn.
 *   - `lisansliKaynak`: THE SEAM for the licensed ICD-10-AM Electronic Code Lists. Not built: it reports not ready.
 *                     Implement `TaniKaynagi` against the licensed lists and select it with NOTYA_AU_TANI_SAGLAYICI=lisansli
 *                     (or `saglayici: 'lisansli'` in countries/au/uzanti/taniKodlari.ts). Nothing else changes.
 *
 * Files (paths overridable with NOTYA_AU_TANI_WHO and NOTYA_AU_TANI_ESLEME):
 *   data/au/icd10-who-2019.txt     UTF-8, one code per line: CODE <TAB or ;> DESCRIPTION   (e.g. "X00.0<TAB>Some title")
 *   data/au/icd10-to-icd10am.csv   UTF-8 CSV with a header row naming the columns `icd10`, `icd10am`, `edition`
 *                                  (extra columns ignored). ICD-10-AM DESCRIPTIONS are licensed and are never read.
 * Nothing here takes or returns a patient id; a search term is not logged.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

export type TaniEslemesi = { kodAm: string; surum: string; aciklamaAm?: string }
export type TaniSonucu = { kod: string; aciklama: string; eslemeler: TaniEslemesi[]; esleme: 'var' | 'yok' }
export interface TaniKaynagi {
  /** true = there is data to search. */
  hazir(): boolean
  ara(sorgu: string, sinir?: number): TaniSonucu[]
  kodu(kod: string): TaniSonucu | null
}

export const TANI_SORGU_AZAMI = 64
export const TANI_SORGU_EN_AZ = 2
export const TANI_SONUC_AZAMI = 25

const sade = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const kodAnahtari = (s: string) => s.toUpperCase().replace(/[\s.]/g, '')

function bol(satir: string): string[] {
  const i = satir.search(/[\t;]/)
  return i < 0 ? [satir] : [satir.slice(0, i), satir.slice(i + 1)]
}

/** Pure. Lines that do not start with a plausible ICD-10 code are skipped, never guessed. */
export function whoListesiOku(metin: string): { kod: string; aciklama: string }[] {
  const cikti: { kod: string; aciklama: string }[] = []
  for (const ham of metin.replace(/^﻿/, '').split(/\r?\n/)) {
    const [k, a] = bol(ham.trim())
    const kod = (k ?? '').trim().toUpperCase()
    if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(kod) || !a || !a.trim()) continue
    cikti.push({ kod, aciklama: a.trim() })
  }
  return cikti
}

function csvSatir(s: string): string[] {
  const o: string[] = []; let h = ''; let tirnak = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (tirnak) { if (c === '"') { if (s[i + 1] === '"') { h += '"'; i++ } else tirnak = false } else h += c }
    else if (c === '"') tirnak = true
    else if (c === ',') { o.push(h); h = '' }
    else h += c
  }
  o.push(h)
  return o.map((x) => x.trim())
}

/** Pure. Needs a header naming `icd10`, `icd10am`, `edition`; without it nothing is read. */
export function eslemeOku(metin: string): { icd10: string; kodAm: string; surum: string }[] {
  const satirlar = metin.replace(/^﻿/, '').split(/\r?\n/).filter((s) => s.trim())
  if (!satirlar.length) return []
  const b = csvSatir(satirlar[0]).map((x) => x.toLowerCase())
  const a = b.indexOf('icd10'), m = b.indexOf('icd10am'), e = b.indexOf('edition')
  if (a < 0 || m < 0 || e < 0) return []
  const cikti: { icd10: string; kodAm: string; surum: string }[] = []
  for (const s of satirlar.slice(1)) {
    const c = csvSatir(s)
    const icd10 = (c[a] ?? '').toUpperCase(), kodAm = (c[m] ?? '').toUpperCase(), surum = c[e] ?? ''
    if (icd10 && kodAm) cikti.push({ icd10, kodAm, surum })
  }
  return cikti
}

/** Builds the open provider from file TEXTS (null = file absent). Pure: tests use it directly. */
export function acikKaynakKur(whoMetni: string | null, eslemeMetni: string | null): TaniKaynagi {
  const liste = whoMetni ? whoListesiOku(whoMetni) : []
  const esleme = new Map<string, TaniEslemesi[]>()
  for (const r of eslemeMetni ? eslemeOku(eslemeMetni) : []) {
    const k = kodAnahtari(r.icd10)
    const l = esleme.get(k) ?? []
    if (!l.some((x) => x.kodAm === r.kodAm && x.surum === r.surum)) l.push({ kodAm: r.kodAm, surum: r.surum })
    esleme.set(k, l)
  }
  const satirlar: (TaniSonucu & { _a: string; _k: string; _am: string })[] = liste.map((r) => {
    const eslemeler = esleme.get(kodAnahtari(r.kod)) ?? []
    return { kod: r.kod, aciklama: r.aciklama, eslemeler, esleme: eslemeler.length ? 'var' : 'yok', _a: sade(r.aciklama), _k: kodAnahtari(r.kod), _am: eslemeler.map((x) => kodAnahtari(x.kodAm)).join(' ') }
  })
  const temiz = ({ _a, _k, _am, ...s }: (typeof satirlar)[number]): TaniSonucu => { void _a; void _k; void _am; return s }
  return {
    hazir: () => satirlar.length > 0,
    kodu: (kod) => { const k = kodAnahtari(kod); const s = satirlar.find((x) => x._k === k); return s ? temiz(s) : null },
    ara: (sorgu, sinir = TANI_SONUC_AZAMI) => {
      const q = sorgu.trim().slice(0, TANI_SORGU_AZAMI)
      if (q.length < TANI_SORGU_EN_AZ) return []
      const kq = kodAnahtari(q), kelimeler = sade(q).split(/\s+/).filter(Boolean)
      const kodGibi = /^[A-Z][0-9A-Z.]*$/i.test(q.replace(/\s/g, ''))
      const bulunan: { s: (typeof satirlar)[number]; puan: number }[] = []
      for (const s of satirlar) {
        let puan = 0
        if (kodGibi && s._k === kq) puan = 100
        else if (kodGibi && s._k.startsWith(kq)) puan = 80
        else if (kodGibi && s._am.split(' ').some((x) => x.startsWith(kq))) puan = 70
        else if (kelimeler.every((w) => s._a.includes(w))) puan = 50
        if (puan) bulunan.push({ s, puan })
      }
      bulunan.sort((x, y) => y.puan - x.puan || x.s.kod.localeCompare(y.s.kod))
      return bulunan.slice(0, Math.max(1, Math.min(sinir, TANI_SONUC_AZAMI))).map((b) => temiz(b.s))
    },
  }
}

/** THE SEAM: the licensed ICD-10-AM Electronic Code Lists. Not built; reports not ready until someone implements it. */
export const lisansliKaynak: TaniKaynagi = { hazir: () => false, ara: () => [], kodu: () => null }

const oku = (yol: string): string | null => { try { return readFileSync(path.resolve(process.cwd(), yol), 'utf8') } catch { return null } }

let onbellek: { anahtar: string; kaynak: TaniKaynagi } | null = null
/** The provider for this deployment. Missing files are looked up again until they exist (a ready provider is kept). */
export function taniKaynagi(saglayici: 'acik' | 'lisansli' = 'acik'): TaniKaynagi {
  const secim = process.env.NOTYA_AU_TANI_SAGLAYICI === 'lisansli' ? 'lisansli' : saglayici
  if (secim === 'lisansli') return lisansliKaynak
  if (onbellek?.kaynak.hazir()) return onbellek.kaynak
  const kaynak = acikKaynakKur(oku(process.env.NOTYA_AU_TANI_WHO || 'data/au/icd10-who-2019.txt'), oku(process.env.NOTYA_AU_TANI_ESLEME || 'data/au/icd10-to-icd10am.csv'))
  onbellek = { anahtar: 'acik', kaynak }
  return kaynak
}
