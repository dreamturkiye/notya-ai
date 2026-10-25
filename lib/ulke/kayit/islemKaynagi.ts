/**
 * AU-QUICK-02 — PROCEDURE-CODE SOURCE (MBS item -> ACHI code). SERVER ONLY (reads a file; never import from a client component).
 *
 * File (path overridable with NOTYA_AU_ISLEM_ESLEME): data/au/mbs-to-achi.csv — UTF-8 CSV with a header row. Columns are
 * found by NAME, in any order, case-insensitive; extra columns are ignored:
 *   item     : a header containing "mbs" and "item" (e.g. "MBS Item", "MBS item number"), or exactly "item"
 *   aciklama : a header containing "description" and "mbs" (the Medicare item text), or "descriptor" (optional)
 *   achi     : a header containing "achi" and "code" (or exactly "achi"); a cell may hold several codes separated by ; , | or /
 *   edition  : a header containing "edition" (optional)
 * ACHI procedure descriptions (licensed by IHACPA) are never read: a column named like "ACHI description" is skipped.
 * Nothing here takes or returns a patient id; a search term is not logged. Missing file = `hazir() === false`.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

export type IslemSonucu = { item: string; aciklama: string; achi: { kod: string; surum: string }[]; esleme: 'var' | 'yok' }
export interface IslemKaynagi { hazir(): boolean; ara(sorgu: string, sinir?: number): IslemSonucu[] }

export const ISLEM_SORGU_AZAMI = 64
export const ISLEM_SORGU_EN_AZ = 2
export const ISLEM_SONUC_AZAMI = 25

const sade = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const kodAnahtari = (s: string) => s.toUpperCase().replace(/[\s.\-]/g, '')

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

/** CSV records (quoted cells may hold line breaks). Pure. */
function kayitlar(metin: string): string[][] {
  const out: string[][] = []; let cur = ''; let tirnak = false
  for (const ch of metin.replace(/^﻿/, '')) {
    if (ch === '"') tirnak = !tirnak
    if ((ch === '\n') && !tirnak) { if (cur.trim()) out.push(csvSatir(cur.replace(/\r$/, ''))); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(csvSatir(cur.replace(/\r$/, '')))
  return out
}

/** Pure. Finds the columns by header name; without an item column and an ACHI column nothing is read. */
export function islemEslemeOku(metin: string): { item: string; aciklama: string; achi: string[]; surum: string }[] {
  const k = kayitlar(metin)
  if (k.length < 2) return []
  const b = k[0].map((x) => x.toLowerCase())
  const bul = (f: (h: string) => boolean) => b.findIndex(f)
  const i = bul((h) => (h.includes('mbs') && h.includes('item')) || h === 'item')
  const a = bul((h) => h.includes('achi') && h.includes('code') && !h.includes('description')) >= 0 ? bul((h) => h.includes('achi') && h.includes('code') && !h.includes('description')) : bul((h) => h === 'achi')
  const d = bul((h) => (h.includes('description') && h.includes('mbs')) || h === 'descriptor' || h === 'mbs description')
  const e = bul((h) => h.includes('edition'))
  if (i < 0 || a < 0) return []
  const cikti: { item: string; aciklama: string; achi: string[]; surum: string }[] = []
  for (const c of k.slice(1)) {
    const item = (c[i] ?? '').trim()
    if (!/^\d{1,6}[A-Za-z]{0,2}$/.test(item)) continue
    const achi = (c[a] ?? '').split(/[;,|/\s]+/).map((x) => x.trim().toUpperCase()).filter((x) => /^[0-9A-Z-]{3,12}$/.test(x))
    cikti.push({ item, aciklama: d >= 0 ? (c[d] ?? '').replace(/\s+/g, ' ').trim() : '', achi, surum: e >= 0 ? (c[e] ?? '') : '' })
  }
  return cikti
}

/** Builds the provider from the file TEXT (null = absent). Pure: tests use it directly. */
export function islemKaynakKur(metin: string | null): IslemKaynagi {
  const harita = new Map<string, IslemSonucu & { _a: string; _achi: string[] }>()
  for (const r of metin ? islemEslemeOku(metin) : []) {
    const k = r.item.toUpperCase()
    const s = harita.get(k) ?? { item: r.item, aciklama: r.aciklama, achi: [], esleme: 'yok' as const, _a: '', _achi: [] }
    if (!s.aciklama && r.aciklama) s.aciklama = r.aciklama
    for (const kod of r.achi) if (!s.achi.some((x) => x.kod === kod)) s.achi.push({ kod, surum: r.surum })
    harita.set(k, s)
  }
  const satirlar = [...harita.values()].map((s) => ({ ...s, esleme: (s.achi.length ? 'var' : 'yok') as 'var' | 'yok', _a: sade(s.aciklama), _achi: s.achi.map((x) => kodAnahtari(x.kod)) }))
  const temiz = ({ _a, _achi, ...s }: (typeof satirlar)[number]): IslemSonucu => { void _a; void _achi; return s }
  return {
    hazir: () => satirlar.length > 0,
    ara: (sorgu, sinir = ISLEM_SONUC_AZAMI) => {
      const q = sorgu.trim().slice(0, ISLEM_SORGU_AZAMI)
      if (q.length < ISLEM_SORGU_EN_AZ) return []
      const kq = kodAnahtari(q), kelimeler = sade(q).split(/\s+/).filter(Boolean)
      const kodGibi = /^[0-9A-Z.\-]+$/i.test(q.replace(/\s/g, ''))
      const bulunan: { s: (typeof satirlar)[number]; puan: number }[] = []
      for (const s of satirlar) {
        let puan = 0
        if (kodGibi && s.item.toUpperCase() === q.toUpperCase().replace(/\s/g, '')) puan = 100
        else if (kodGibi && s._achi.includes(kq)) puan = 95
        else if (kodGibi && s.item.toUpperCase().startsWith(q.toUpperCase().replace(/\s/g, ''))) puan = 80
        else if (kodGibi && kq.length >= 4 && s._achi.some((x) => x.startsWith(kq))) puan = 70
        else if (kelimeler.every((w) => s._a.includes(w))) puan = 50
        if (puan) bulunan.push({ s, puan })
      }
      bulunan.sort((x, y) => y.puan - x.puan || x.s.item.localeCompare(y.s.item, 'en', { numeric: true }))
      return bulunan.slice(0, Math.max(1, Math.min(sinir, ISLEM_SONUC_AZAMI))).map((b) => temiz(b.s))
    },
  }
}

const oku = (yol: string): string | null => { try { return readFileSync(path.resolve(process.cwd(), yol), 'utf8') } catch { return null } }

let onbellek: IslemKaynagi | null = null
/** The provider for this deployment. A missing file is looked up again until it exists (a ready provider is kept). */
export function islemKaynagi(): IslemKaynagi {
  if (onbellek?.hazir()) return onbellek
  onbellek = islemKaynakKur(oku(process.env.NOTYA_AU_ISLEM_ESLEME || 'data/au/mbs-to-achi.csv'))
  return onbellek
}
