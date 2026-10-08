/**
 * NOTYA-UZ-MUAYENE-01 / NOTYA-UZ-BRANSLAR-01 — Uzbekistan: the product's 30 doctor specialties and the note template
 * each one writes with.
 *
 * Since NOTYA-UZ-BRANSLAR-01 (the owner, 2026-10-08: "build the Uzbek one completely") every specialty writes with
 * a template OF ITS OWN (./notSablonlari.ts), and so do the 10 clinic roles, which are not in this list because the
 * product's specialty list does not hold them. The general template stays, for an account that has chosen no role.
 *
 * NONE HAS BEEN SIGNED OFF. `yerelInceleyen` is null for every one: the templates were built by a machine and no
 * local reviewer has confirmed them (docs/COUNTRY-PACK-CHECKLIST.md C12, C14). Switching them on before a sign-off
 * was the owner's decision; the status table is in docs/COUNTRY-PACK-UZBEKISTAN.md.
 *
 * Keys are Notya's internal specialty identifiers (the same ones the core tables store in `sessions.specialty`);
 * the type is imported as a type only, so nothing of the file that defines it is loaded. Typing this list by the
 * product's own key type makes a specialty added to the product a type error here until it has a template.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { UZ_SABLONLAR, uzSablonMu as sablonMu } from './notSablonlari'

/** A template key: 'genel', or a role key. */
export type UzSablon = string

export type UzBrans = {
  /** true = the specialty writes with a template of its own. */
  kendiSablonuAcik: boolean
  /** The template its notes are written with today. */
  sablon: UzSablon
  /** Who confirmed the template locally. null = nobody yet. */
  yerelInceleyen: string | null
}

const kendi = (sablon: SpecialtyKey): UzBrans => ({ kendiSablonuAcik: true, sablon, yerelInceleyen: null })

export const UZ_BRANSLAR: Readonly<Record<SpecialtyKey, UzBrans>> = {
  pediatri: kendi('pediatri'),
  kardiyoloji: kendi('kardiyoloji'),
  noroloji: kendi('noroloji'),
  dahiliye: kendi('dahiliye'),
  psikiyatri: kendi('psikiyatri'),
  'genel-cerrahi': kendi('genel-cerrahi'),
  ortopedi: kendi('ortopedi'),
  dermatoloji: kendi('dermatoloji'),
  'kulak-burun-bogaz': kendi('kulak-burun-bogaz'),
  'goz-hastaliklari': kendi('goz-hastaliklari'),
  'kadin-hastaliklari-dogum': kendi('kadin-hastaliklari-dogum'),
  uroloji: kendi('uroloji'),
  radyoloji: kendi('radyoloji'),
  anestezi: kendi('anestezi'),
  'acil-tip': kendi('acil-tip'),
  'fizik-tedavi': kendi('fizik-tedavi'),
  'enfeksiyon-hastaliklari': kendi('enfeksiyon-hastaliklari'),
  endokrinoloji: kendi('endokrinoloji'),
  gastroenteroloji: kendi('gastroenteroloji'),
  nefroloji: kendi('nefroloji'),
  romatoloji: kendi('romatoloji'),
  onkoloji: kendi('onkoloji'),
  'gogus-hastaliklari': kendi('gogus-hastaliklari'),
  'gogus-cerrahisi': kendi('gogus-cerrahisi'),
  'plastik-cerrahi': kendi('plastik-cerrahi'),
  'beyin-cerrahisi': kendi('beyin-cerrahisi'),
  'kalp-damar-cerrahisi': kendi('kalp-damar-cerrahisi'),
  'cocuk-cerrahisi': kendi('cocuk-cerrahisi'),
  'aile-hekimligi': kendi('aile-hekimligi'),
  'spor-hekimligi': kendi('spor-hekimligi'),
}

/** Every template a note can be written with: the general one first (the default), then the 40 roles. */
export const UZ_ACIK_SABLONLAR: readonly UzSablon[] = UZ_SABLONLAR

export const uzSablonMu = (ham: unknown): ham is UzSablon => sablonMu(ham)
