/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: helpers the tool texts are written with, and the few lines many tools
 * share. No tool is defined here.
 *
 * A tool's words are written ONCE, as plain strings in en-GB spelling (`HamArac`); `araciBicimle` turns them into the
 * kit's shape in a country's form of English. MACHINE-WRITTEN: no clinician of any country has read a line.
 */
import type { AracMetni, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { EnRol } from '../klinik/roller'
import { enYaz, type EnBicim } from '../varyant'

type Sozluk = Readonly<Record<string, string>>

/** Every word of one tool's screen, written once. Records are keyed by the keys of the kit's definition. */
export type HamArac = {
  /** A key of the kit's catalogue (lib/ulke/araclar/katalog.ts). */
  anahtar: string
  /** null = BASE: every role. A list = these roles only. Said for every tool, never left open. */
  roller: readonly EnRol[] | null
  ad: string
  aciklama: string
  alanlar?: Sozluk
  secenekler?: Readonly<Record<string, Sozluk>>
  sayilar?: Sozluk
  bantlar?: Sozluk
  uyarilar?: Sozluk
  tarihler?: Sozluk
  /** The line under every result: what the tool is not. */
  not: string
}

// ── the line under a result: what the tool is not ──
export const KARAR = 'A decision-support tool: diagnosis and treatment are the doctor\'s.'
export const DOZSUZ = 'A decision-support tool: diagnosis, medicines and doses are the doctor\'s.'

// ── labels many lists share ──
export const ISARETLI_MADDE = 'Items selected'
export const ISARETLI_BULGU = 'Findings selected'
export const TAMAMLANAN = 'Items completed'
export const SONRAKI_KONTROL_TARIHI = 'Date of the next check (optional)'
export const SONRAKI_KONTROL = 'Next check'
export const GOZLEM_TARIHI = 'Date of the observation'

/** "Follow-up task: …" — a list's own item, repeated as something to come back to. */
export const gorev = (ne: string): string => `Follow-up task: ${ne}`
/** Options whose names are their own keys (levels 1 to 5, classes I to V). */
export const kendiAdi = (anahtarlar: readonly string[]): Sozluk => Object.fromEntries(anahtarlar.map((k) => [k, k]))

const cevir = (s: Sozluk | undefined, bicim: EnBicim) => (s ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { [bicim]: enYaz(v, bicim) }])) : undefined)

/**
 * A tool written once → the pack's entry, in a country's form of English. `degisen` = the words THIS COUNTRY writes
 * differently for the tool (a label that names the country's unit); they replace the set's and are used AS WRITTEN.
 */
export function araciBicimle(a: HamArac, bicim: EnBicim, degisen?: Partial<Pick<HamArac, 'alanlar' | 'uyarilar' | 'bantlar' | 'sayilar' | 'aciklama'>>): PaketAraci {
  const kendi = (s: Sozluk | undefined) => (s ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { [bicim]: v }])) : {})
  const grup = (ad: 'alanlar' | 'sayilar' | 'bantlar' | 'uyarilar') => { const temel = cevir(a[ad], bicim); return temel || degisen?.[ad] ? { ...(temel ?? {}), ...kendi(degisen?.[ad]) } : undefined }
  const metin: AracMetni = {
    ad: { [bicim]: enYaz(a.ad, bicim) },
    aciklama: { [bicim]: degisen?.aciklama ?? enYaz(a.aciklama, bicim) },
    alanlar: grup('alanlar') ?? {},
    ...(a.secenekler ? { secenekler: Object.fromEntries(Object.entries(a.secenekler).map(([k, v]) => [k, cevir(v, bicim)!])) } : {}),
    ...(grup('sayilar') ? { sayilar: grup('sayilar') } : {}),
    ...(grup('bantlar') ? { bantlar: grup('bantlar') } : {}),
    ...(grup('uyarilar') ? { uyarilar: grup('uyarilar') } : {}),
    ...(a.tarihler ? { tarihler: cevir(a.tarihler, bicim) } : {}),
    not: { [bicim]: enYaz(a.not, bicim) },
  }
  return { anahtar: a.anahtar, roller: a.roller, metin }
}
