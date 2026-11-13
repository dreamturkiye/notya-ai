/**
 * PREMATUR-ULKE-01 — THE SHAPES of the prematurity module in a country build: the follow-up protocol a pack states, the
 * history a doctor enters, the early-birth record of obstetrics and gynaecology. Types, constants and the two cleaning
 * functions only. Country-neutral: NO threshold, date rule, source or word of any country is in the kit — all of it is the
 * pack's (`PrematurProtokol`, `ErkenDogumProtokolu`), each rule with its own source and how that source was READ.
 *
 * THE RULE THIS MODULE IS BUILT ON (Kaan, 2026-11-13): a criterion is never invented. Where a country's authoritative
 * source could not be read and cited, the pack says `yerel: true` for that item: the screen then says "follow your local
 * protocol", shows the doctor's confirmation checklist, and produces no date and no threshold.
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { DuzeltmeKurali } from './yas'

export type Metin = BicimliMetin

/** birincil-okundu: read in the publication's own text · ikincil-ozet: read in a reliable summary, the primary text was not readable · dogrulanmadi: a citation only, the content was not read. */
export type KaynakDurumu = 'birincil-okundu' | 'ikincil-ozet' | 'dogrulanmadi'
export const KAYNAK_DURUMLARI: readonly KaynakDurumu[] = ['birincil-okundu', 'ikincil-ozet', 'dogrulanmadi']

export interface Kaynak {
  /** Short name: "AAP/AAO 2018". */
  kisa: string
  /** The citation as published. */
  tam: string
  durum: KaynakDurumu
  /** What was read and how, in the pack's words. */
  not?: Metin
}

export type GirdiAlani =
  | 'gestasyonHafta' // whole weeks of gestation at birth (32+4 → 32)
  | 'dogumKiloGr'
  | 'yasAy' // chronological calendar months (today)
  | 'nicuGun'
  | 'oksijen28Gun'
  | 'hsKkh'
  | 'ototoksik5Gun'
  | 'degisimTransfuzyonu'
  | 'ecmo'
  | 'ropSecili'
export const GIRDI_ALANLARI: readonly GirdiAlani[] = ['gestasyonHafta', 'dogumKiloGr', 'yasAy', 'nicuGun', 'oksijen28Gun', 'hsKkh', 'ototoksik5Gun', 'degisimTransfuzyonu', 'ecmo', 'ropSecili']

export interface KriterKosulu {
  alan: GirdiAlani
  op: '<' | '<=' | '>' | '>=' | 'dogru'
  deger?: number
  /** The condition as the screen shows it: "gestational age ≤ 32 weeks". */
  etiket: Metin
}

/** Any group (OR) of conditions that must all hold (AND). A group whose conditions all hold meets the criterion. */
export interface Kriter { herhangiBiri: KriterKosulu[][] }

export type ZamanNoktasi =
  | { tur: 'dogumdan-gun'; gun: number }
  | { tur: 'dogumdan-hafta'; hafta: number }
  /** Postmenstrual age = gestation + time since birth; reached when this week is complete. Not computable when gestation is not known. */
  | { tur: 'pma-hafta'; hafta: number }
  | { tur: 'kronolojik-ay'; ay: number }

export interface Zamanlama {
  kod: string
  etiket: Metin
  /** Produced only when all these conditions hold. */
  kosul?: KriterKosulu[]
  /** A condition field that is not known: 'dahil' = produce it anyway (with a note). Default 'haric'. */
  bilinmiyorsa?: 'dahil' | 'haric'
  bas?: ZamanNoktasi | null
  son?: ZamanNoktasi | null
}

export type KuralKategori = 'goz' | 'beyin' | 'isitme' | 'akciger' | 'kan' | 'kemik' | 'enfeksiyon' | 'diger'
export const KURAL_KATEGORILERI: readonly KuralKategori[] = ['goz', 'beyin', 'isitme', 'akciger', 'kan', 'kemik', 'enfeksiyon', 'diger']

export interface PrematurKural {
  kod: string
  kategori: KuralKategori
  baslik: Metin
  aciklama: Metin
  /**
   * FOLLOW YOUR LOCAL PROTOCOL. The pack could not read and cite its country's source for this item, so it states NO
   * criterion and NO date: the item is shown to every baby in the plan's scope as "follow your local protocol", with the
   * doctor's own confirmation. `kriter` is null and `zamanlamalar` is empty, and a rule with `yerel` and either is refused.
   */
  yerel?: true
  kriter: Kriter | null
  /** Empty = a flag only (criterion met / not met) with no date. */
  zamanlamalar: Zamanlama[]
  kaynaklar: Kaynak[]
  hekimNotu?: Metin
}

export interface PrematurUrunParametreleri {
  /** Tolerance after the start of a window that has no end. */
  gecikmeToleransGun: number
  /** "Coming up" = within this many days. */
  yaklasanGun: number
  /** An unmarked item overdue by more than this many days reads "no record — confirm", not "overdue" (NICU tests are often not recorded here). */
  gecikmeGorunurGun: number
  /** The plan is shown until this chronological month. */
  planUstAy: number
}
/** PRODUCT PARAMETERS, not clinical thresholds: the same in every country. */
export const URUN_PARAMETRELERI: PrematurUrunParametreleri = { gecikmeToleransGun: 14, yaklasanGun: 30, gecikmeGorunurGun: 180, planUstAy: 36 }

export interface PrematurProtokol {
  ulke: string
  /** The country's name, in the pack's words. */
  ad: Metin
  /** The day the table was checked against its sources. */
  surum: string
  duzeltme: DuzeltmeKurali
  /** The plan's scope: born before this week, or at most this many grams. */
  kapsam: { gestasyonHaftaKucuk: number; dogumKiloGrEnFazla: number; kaynak: Metin }
  urun: PrematurUrunParametreleri
  kurallar: PrematurKural[]
}

/** The newborn-intensive-care history a doctor enters (null = not known). */
export interface PrematurProfil {
  gestasyonHafta?: number | null
  /** Days beyond the whole week (0–6): 29+3 → hafta 29, gun 3. */
  gestasyonGunKalan?: number | null
  dogumKiloGr?: number | null
  nicuGun?: number | null
  oksijen28Gun?: boolean | null
  oksijen36Hafta?: boolean | null
  hsKkh?: boolean | null
  ototoksik5Gun?: boolean | null
  degisimTransfuzyonu?: boolean | null
  ecmo?: boolean | null
  ropSecili?: boolean | null
  /** Mother's history (a record, NOT a criterion). */
  antenatalSteroid?: boolean | null
  pprom?: boolean | null
  magnezyum?: boolean | null
}

export const PROFIL_BOOL_ALANLARI = ['oksijen28Gun', 'oksijen36Hafta', 'hsKkh', 'ototoksik5Gun', 'degisimTransfuzyonu', 'ecmo', 'ropSecili', 'antenatalSteroid', 'pprom', 'magnezyum'] as const

/** What came from the browser (or the database), cleaned by range and type: anything else is null. */
export function profilTemizle(ham: unknown): PrematurProfil {
  const r = (ham && typeof ham === 'object' && !Array.isArray(ham) ? ham : {}) as Record<string, unknown>
  const sayi = (v: unknown, min: number, max: number, tam = false): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? v : Number(String(v).trim())
    return Number.isFinite(n) && n >= min && n <= max && (!tam || Number.isInteger(n)) ? n : null
  }
  const bool = (v: unknown): boolean | null => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null)
  const hafta = sayi(r.gestasyonHafta, 20, 45, true)
  const p: PrematurProfil = {
    gestasyonHafta: hafta,
    // the days beyond the week are kept only with a week; 45 weeks + any days is out of range
    gestasyonGunKalan: hafta == null ? null : sayi(r.gestasyonGunKalan, 0, 6, true) ?? 0,
    dogumKiloGr: sayi(r.dogumKiloGr, 200, 7000),
    nicuGun: sayi(r.nicuGun, 0, 400),
  }
  if (p.gestasyonHafta === 45 && (p.gestasyonGunKalan ?? 0) > 0) p.gestasyonGunKalan = 0
  for (const a of PROFIL_BOOL_ALANLARI) (p as Record<string, unknown>)[a] = bool(r[a])
  return p
}

/** The doctor's own mark on one follow-up item. */
export type HekimDurumu = 'plana_alindi' | 'yapildi' | 'uygulanmaz'
export const HEKIM_DURUMLARI: readonly HekimDurumu[] = ['plana_alindi', 'yapildi', 'uygulanmaz']
export interface OgeKaydi { durum: HekimDurumu; tarih?: string | null; not?: string | null }
/** An item id: rule code, a colon, the timing code ("rop:first-pma", "local-hearing:local"). */
export const OGE_KIMLIGI = /^[a-z0-9-]{1,40}:[a-z0-9-]{1,40}$/
export const OGE_NOT_AZAMI = 300
