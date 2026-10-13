/**
 * NOTYA-ULKE-EN-01 — Australia: what the pack brings for the country kit's shared screens. CONTENT ONLY.
 * Reached only through countries/active/arayuz, read through lib/ulke/arayuz.
 *
 * Nothing is written here: the English language set (countries/_dil/en/arayuz.ts) assembles the catalogues, the role
 * names, the note templates, the tools and the landing copy in Australian spelling (en-AU) from what this country states in
 * ./ayarlar.ts.
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { enArayuz } from '../_dil/en/arayuz'
import { AU_GIRDI } from './ayarlar'

export const AU_ARAYUZ: UlkeArayuzu = enArayuz(AU_GIRDI)
