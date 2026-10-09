/**
 * NOTYA-ULKE-EN-01 — United Kingdom: what the pack brings for the country kit's shared screens. CONTENT ONLY.
 * Reached only through countries/active/arayuz, read through lib/ulke/arayuz.
 *
 * Nothing is written here: the English language set (countries/_dil/en/arayuz.ts) assembles the catalogues, the role
 * names, the note templates, the tools and the landing copy in British spelling from what this country states in
 * ./ayarlar.ts.
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { enArayuz } from '../_dil/en/arayuz'
import { GB_GIRDI } from './ayarlar'

export const GB_ARAYUZ: UlkeArayuzu = enArayuz(GB_GIRDI)
