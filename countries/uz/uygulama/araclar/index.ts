/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: the TOOLS of the country build. What the pack brings for the kit's tools area
 * (lib/ulke/araclar/tipler.ts → UlkeAraclari): which of the kit's tools are switched on, WHICH ROLES SEE EACH, every
 * word of their screens in the three forms, the names of units, and the slots of what is still missing.
 *
 *   ./metinler.ts   the tools area's own words (grid, search, what every tool screen shares)
 *   ./temel.ts      BASE tools: the same for all 40 roles
 *   ./rol1.ts …     ROLE tools, in the order of the pack's role list; each names its roles
 *   ./yuvalar.ts    tools that wait for local content: marked, empty, switched off
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. Every title, label, band name and warning in this folder
 * was written by a machine: Uzbek in Latin script and Russian directly, and UZBEK IN CYRILLIC SCRIPT DERIVED FROM
 * THE LATIN TEXT BY RULE, letter by letter, with a short list of loan-word spellings. Nobody who speaks Uzbek or
 * Russian as a first language, and no clinician, has read a line of it (`inceleme.klinisyen` is null). A rule
 * cannot know every loan word's spelling: the Cyrillic form in particular must be read before a doctor relies on it.
 *
 * WHAT IS AND IS NOT HERE. The lists are the product's own checklists, translated; the arithmetic is the kit's and
 * cites its published source. There is NO national reference content: no vaccination calendar, drug list, dosing
 * table, protocol or reference range of an authority. Tools that need one are slots (./yuvalar.ts).
 * The items of published questionnaires are NOT translated here: where a scale's wording belongs to its authors,
 * the screen shows item numbers and the doctor reads the authorised form.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Verdict per tool of the pre-split application, and what was done: docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md.
 */
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { UZ_ARACLAR_METINLERI } from './metinler'
import { UZ_TEMEL_ARACLAR } from './temel'
import { UZ_ROL_ARACLARI_1 } from './rol1'
import { UZ_ARAC_YUVALARI } from './yuvalar'

export const UZ_ARACLAR: UlkeAraclari = {
  metinler: UZ_ARACLAR_METINLERI,
  araclar: [...UZ_TEMEL_ARACLAR, ...UZ_ROL_ARACLARI_1],
  // No switched-on tool shows a unit of its own yet.
  birimler: {},
  // No switched-on tool reads a laboratory value yet. A unit is stated here in the same change that switches such a tool on.
  labBirimleri: {},
  yuvalar: UZ_ARAC_YUVALARI,
  inceleme: { makineYazimi: true, klinisyen: null },
}
