/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: helpers the tool texts are written with, and the few lines many tools
 * share. No tool is defined here.
 *
 * A tool's words are written ONCE, as plain strings in en-GB spelling (`HamArac`); `araciBicimle` turns them into the
 * kit's shape in a country's form of English. MACHINE-WRITTEN: no clinician of any country has read a line.
 */
import type { AracLisansi, AracMetni, AracUyarlamasi, HastaKapisi, PaketAraci } from '@/lib/ulke/araclar/tipler'
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
 * The words of a tool THIS COUNTRY writes differently. Each replaces the set's and is used AS WRITTEN (the country's
 * own spelling). `ad`, `not`, `tarihler` and `secenekler` since NOTYA-ULKE-OZEL-01: a country may rename a tool and
 * relabel anything on its screen. The names of a field's options are given for the WHOLE field (they replace the
 * set's list for it, so a country that restates the options names exactly its own).
 */
export type EnDegisen = Partial<Pick<HamArac, 'alanlar' | 'uyarilar' | 'bantlar' | 'sayilar' | 'aciklama' | 'ad' | 'not' | 'tarihler' | 'secenekler'>>

/** A licence as a country of the set states it: the notice a rights holder requires, as one sentence in the country's own spelling. */
export type EnLisans = Omit<AracLisansi, 'bildirim'> & { bildirim?: string }

/**
 * NOTYA-ULKE-OZEL-01 — what ONE COUNTRY states about a tool of the set beside its words. Every field is optional: a
 * country that states none gets the tool exactly as the set wrote it.
 */
export type EnAracEki = {
  /** Who sees the tool here (already resolved to this country's roles), where it differs from the set's list. */
  roller?: readonly string[] | null
  sinif?: 'hekimler'
  /** The country's numbers and tables for the tool, each laboratory value with its unit. */
  parametreler?: PaketAraci['parametreler']
  tablolar?: PaketAraci['tablolar']
  /** The country's own bands or options. With its own bands, the band names are exactly the country's (`degisen.bantlar`). */
  uyarlama?: AracUyarlamasi
  /** For which patients the tool is, and the sentence that says so. */
  hasta?: { kapi: HastaKapisi; metin: string }
  lisans?: EnLisans
}

/** A licence in the kit's shape, in a country's form of English. */
export const lisansiBicimle = (l: EnLisans, bicim: EnBicim): AracLisansi => { const { bildirim, ...gerisi } = l; return bildirim ? { ...gerisi, bildirim: { [bicim]: bildirim } } : { ...gerisi } }

/**
 * A tool written once → the pack's entry, in a country's form of English. `degisen` = the words THIS COUNTRY writes
 * differently for the tool (a label that names the country's unit); they replace the set's and are used AS WRITTEN.
 * `ek` = what else this country states about the tool (who sees it, its numbers, its bands, its patients, its licence).
 */
export function araciBicimle(a: HamArac, bicim: EnBicim, degisen?: EnDegisen, ek?: EnAracEki): PaketAraci {
  const kendi = (s: Sozluk | undefined) => (s ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { [bicim]: v }])) : {})
  // The country's own bands replace the kit's, so their names are the country's alone; every other group is the set's with the country's words over it.
  const kendiBantlari = Boolean(ek?.uyarlama?.bantlar)
  const grup = (ad: 'alanlar' | 'sayilar' | 'bantlar' | 'uyarilar') => { const temel = ad === 'bantlar' && kendiBantlari ? undefined : cevir(a[ad], bicim); return temel || degisen?.[ad] ? { ...(temel ?? {}), ...kendi(degisen?.[ad]) } : undefined }
  const secenekler = a.secenekler || degisen?.secenekler ? { ...Object.fromEntries(Object.entries(a.secenekler ?? {}).map(([k, v]) => [k, cevir(v, bicim)!])), ...Object.fromEntries(Object.entries(degisen?.secenekler ?? {}).map(([k, v]) => [k, kendi(v)])) } : undefined
  const tarihler = a.tarihler || degisen?.tarihler ? { ...(cevir(a.tarihler, bicim) ?? {}), ...kendi(degisen?.tarihler) } : undefined
  const metin: AracMetni = {
    ad: { [bicim]: degisen?.ad ?? enYaz(a.ad, bicim) },
    aciklama: { [bicim]: degisen?.aciklama ?? enYaz(a.aciklama, bicim) },
    alanlar: grup('alanlar') ?? {},
    ...(secenekler ? { secenekler } : {}),
    ...(grup('sayilar') ? { sayilar: grup('sayilar') } : {}),
    ...(grup('bantlar') ? { bantlar: grup('bantlar') } : {}),
    ...(grup('uyarilar') ? { uyarilar: grup('uyarilar') } : {}),
    ...(tarihler ? { tarihler } : {}),
    not: { [bicim]: degisen?.not ?? enYaz(a.not, bicim) },
    ...(ek?.hasta ? { hastaKapisi: { [bicim]: ek.hasta.metin } } : {}),
  }
  return {
    anahtar: a.anahtar,
    roller: ek && ek.roller !== undefined ? ek.roller : a.roller,
    ...(ek?.sinif ? { sinif: ek.sinif } : {}),
    metin,
    ...(ek?.parametreler ? { parametreler: ek.parametreler } : {}),
    ...(ek?.tablolar ? { tablolar: ek.tablolar } : {}),
    ...(ek?.uyarlama ? { uyarlama: ek.uyarlama } : {}),
    ...(ek?.hasta ? { hasta: ek.hasta.kapi } : {}),
    ...(ek?.lisans ? { lisans: lisansiBicimle(ek.lisans, bicim) } : {}),
  }
}
