/**
 * NOTYA-ULKE-01 — every country pack side by side. TESTS AND SCRIPTS ONLY.
 *
 * Application code must never import this file: it would put every country into one build. The wall check
 * (scripts/ulke-duvarlari.mjs) allows it only from *.test.ts(x), lib/ulke/testing/ and scripts/.
 */
import type { SizintiTerimi, UlkeKodu, UlkePaketi } from '@/lib/ulke/tipler'
import { TR_PAKETI } from './tr/index'
import { TR_SIZINTI_HARFLERI, TR_SIZINTI_TERIMLERI } from './tr/sizintiTerimleri'
import { UZ_PAKETI } from './uz/index'
import { UZ_SIZINTI_HARFLERI, UZ_SIZINTI_TERIMLERI } from './uz/sizintiTerimleri'

export type UlkeKaydi = { paket: UlkePaketi; sizintiTerimleri: readonly SizintiTerimi[]; sizintiHarfleri: string }

export const TUM_ULKELER: Record<UlkeKodu, UlkeKaydi> = {
  tr: { paket: TR_PAKETI, sizintiTerimleri: TR_SIZINTI_TERIMLERI, sizintiHarfleri: TR_SIZINTI_HARFLERI },
  uz: { paket: UZ_PAKETI, sizintiTerimleri: UZ_SIZINTI_TERIMLERI, sizintiHarfleri: UZ_SIZINTI_HARFLERI },
}
