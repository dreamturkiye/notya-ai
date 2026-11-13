/**
 * PREMATUR-ULKE-01 — WHAT A PACK BRINGS for the prematurity module: its follow-up table, its early-birth thresholds, WHICH ROLES
 * work with each of the two records, and the words of the two screens (./metin.ts). A pack that states none has no prematurity
 * tile. The kit holds no number, no source and no sentence of any country.
 */
import type { DilKodu } from '../tipler'
import type { ErkenDogumProtokolu } from './erkenDogum'
import type { PrematurMetni } from './metin'
import type { PrematurProtokol } from './tipler'

export interface PrematurPaketi {
  /** The baby's follow-up table. */
  protokol: PrematurProtokol
  /** The early-birth thresholds. */
  erkenDogum: ErkenDogumProtokolu
  /** The role keys that open each record: the baby's plan (paediatrics) and the early-birth record (obstetrics and gynaecology). */
  roller: { bebek: readonly string[]; gebelik: readonly string[] }
  /** Every word of both screens, once per language form of the pack. */
  metinler: Readonly<Partial<Record<DilKodu, PrematurMetni>>>
}

/** The tile keys (the baby's plan, the list of the doctor's babies, the early-birth record): the kit's catalogue (lib/ulke/araclar/katalog.ts) and the pack list them. */
export const PREMATUR_ARACLARI = { bebek: 'prematur-takip', kohort: 'prematur-kohort', gebelik: 'erken-dogum' } as const
/** Routes of the two records. */
export const PREMATUR_API = '/api/ulke/prematur'
export const ERKEN_DOGUM_API = '/api/ulke/erken-dogum'
/** The cohort lists never read more rows than this for one doctor. */
export const KOHORT_AZAMI = 300
