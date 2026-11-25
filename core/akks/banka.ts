/**
 * AKKS question bank — compact authoring format (one file per branş under core/akks/sorular/), parsed here. Pure.
 *
 *   #<no> <kategori> <zorluk 1-3> <registry id | -> [| edition / section note]
 *   S: <question, as a colleague would ask Ayşe>
 *   + <expected key point> ; <key point> ; ...
 *   - <must-not-say> ; <must-not-say> ; ...
 *
 * Every item is a DRAFT written by Claude (2026-11-24) and counts as final only after clinician review (Dr. Gökhan / the
 * panel) — review status lives in the database (akks_soru_inceleme), bound to the item's content hash (`ozet`), so an
 * edited item drops back to "taslak". Items are original, written in TUS / yan dal style; no exam question is copied.
 */
import { createHash } from 'node:crypto'
import { KATEGORILER, type Kategori, type SoruMaddesi, type Zorluk } from './tipler'

export interface BankaKaynagi {
  brans: string
  /** Id prefix, e.g. "PED" → PED-001. */
  onek: string
  metin: string
}

/** Kaan's targets for this run: 100 per priority branş, ≥ 30 for every other branş (the rest is OPEN-COMMITMENTS AKKS-BANKA-100). */
export const ONCELIKLI_BRANSLAR = ['pediatri', 'kulak-burun-bogaz', 'kadin-hastaliklari-dogum', 'dermatoloji', 'diyetisyen'] as const
export const HEDEF = { oncelikli: 100, diger: 30 } as const

const ozetle = (x: string) => createHash('sha256').update(x, 'utf8').digest('hex')

export function maddeOzeti(m: Pick<SoruMaddesi, 'soru' | 'anahtarlar' | 'soylememeli' | 'kaynak'>): string {
  return ozetle(JSON.stringify([m.soru, m.anahtarlar, m.soylememeli, m.kaynak.id, m.kaynak.not])).slice(0, 16)
}

/** Tracking set: stable per item (depends on its id only, never on the other items). ≈20% of a priority branş, ≈1/6 elsewhere. */
export function izlemeMi(id: string, brans: string): boolean {
  const h = parseInt(ozetle(`akks-izleme:${id}`).slice(0, 8), 16)
  return (ONCELIKLI_BRANSLAR as readonly string[]).includes(brans) ? h % 5 === 0 : h % 6 === 0
}

const bol = (s: string) => s.split(/\s;\s/).map((x) => x.trim()).filter(Boolean)

export function bankaCoz(k: BankaKaynagi): { maddeler: SoruMaddesi[]; hatalar: string[] } {
  const maddeler: SoruMaddesi[] = []
  const hatalar: string[] = []
  const bloklar = k.metin.split(/\n(?=#\d+\s)/).map((b) => b.trim()).filter((b) => b.startsWith('#'))
  for (const blok of bloklar) {
    const satirlar = blok.split('\n').map((s) => s.trim()).filter(Boolean)
    const bas = /^#(\d+)\s+(\S+)\s+([123])\s+(\S+)(?:\s*\|\s*(.+))?$/.exec(satirlar[0])
    if (!bas) { hatalar.push(`${k.brans}: bad header "${satirlar[0].slice(0, 60)}"`); continue }
    const id = `${k.onek}-${bas[1].padStart(3, '0')}`
    const kategori = bas[2] as Kategori
    if (!(KATEGORILER as readonly string[]).includes(kategori)) hatalar.push(`${id}: unknown category ${bas[2]}`)
    const soru = satirlar.find((s) => s.startsWith('S:'))?.slice(2).trim() || ''
    const anahtarlar = satirlar.filter((s) => s.startsWith('+')).flatMap((s) => bol(s.slice(1)))
    const soylememeli = satirlar.filter((s) => s.startsWith('- ')).flatMap((s) => bol(s.slice(1)))
    if (soru.length < 15) hatalar.push(`${id}: question missing / too short`)
    if (anahtarlar.length < 2) hatalar.push(`${id}: needs ≥ 2 key points`)
    if (soylememeli.length < 1) hatalar.push(`${id}: needs ≥ 1 must-not-say`)
    if (maddeler.some((m) => m.id === id)) hatalar.push(`${id}: duplicate id`)
    const kaynak = { id: bas[4] === '-' ? null : bas[4], not: bas[5]?.trim() || null }
    const m = { id, brans: k.brans, kategori, zorluk: Number(bas[3]) as Zorluk, soru, anahtarlar, soylememeli, kaynak, izleme: izlemeMi(id, k.brans), ozet: '' }
    m.ozet = maddeOzeti(m)
    maddeler.push(m)
  }
  return { maddeler, hatalar }
}
