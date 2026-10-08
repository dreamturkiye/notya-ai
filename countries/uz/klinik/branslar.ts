/**
 * NOTYA-UZ-MUAYENE-01 — Uzbekistan: specialties and the note template each one uses.
 *
 * The whole list is here, structured, from day one (Kaan, 2026-10-08: all 30 specialties) — and every specialty
 * template except pediatrics is OFF: every other specialty writes with the one general template for now. Pediatrics
 * is on by Kaan's decision for this first slice; it has NOT been signed off by a local reviewer, and no other
 * specialty gets a template of its own before its reviewer signs it off (docs/COUNTRY-PACK-CHECKLIST.md C12, C14).
 * The official Uzbek names of the specialties are not here yet (checklist C1): nothing shows this list.
 *
 * Keys are Notya's internal specialty identifiers (the same ones the core tables store in `sessions.specialty`);
 * the type is imported as a type only, so nothing of the file that defines it is loaded.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** The two templates that exist. 'genel' is also the identifier stored for a general visit. */
export type UzSablon = 'pediatri' | 'genel'

export type UzBrans = {
  /** true = the specialty writes with a template of its own. */
  kendiSablonuAcik: boolean
  /** The template its notes are written with today. */
  sablon: UzSablon
}

const genel: UzBrans = { kendiSablonuAcik: false, sablon: 'genel' }

export const UZ_BRANSLAR: Readonly<Record<SpecialtyKey, UzBrans>> = {
  pediatri: { kendiSablonuAcik: true, sablon: 'pediatri' },
  kardiyoloji: genel,
  noroloji: genel,
  dahiliye: genel,
  psikiyatri: genel,
  'genel-cerrahi': genel,
  ortopedi: genel,
  dermatoloji: genel,
  'kulak-burun-bogaz': genel,
  'goz-hastaliklari': genel,
  'kadin-hastaliklari-dogum': genel,
  uroloji: genel,
  radyoloji: genel,
  anestezi: genel,
  'acil-tip': genel,
  'fizik-tedavi': genel,
  'enfeksiyon-hastaliklari': genel,
  endokrinoloji: genel,
  gastroenteroloji: genel,
  nefroloji: genel,
  romatoloji: genel,
  onkoloji: genel,
  'gogus-hastaliklari': genel,
  'gogus-cerrahisi': genel,
  'plastik-cerrahi': genel,
  'beyin-cerrahisi': genel,
  'kalp-damar-cerrahisi': genel,
  'cocuk-cerrahisi': genel,
  'aile-hekimligi': genel,
  'spor-hekimligi': genel,
}

/** Templates a doctor can choose on the visit screen: the general one first (the default), then the signed-off ones. */
export const UZ_ACIK_SABLONLAR: readonly UzSablon[] = ['genel', ...new Set(Object.values(UZ_BRANSLAR).filter((b) => b.kendiSablonuAcik).map((b) => b.sablon))]

export const uzSablonMu = (ham: unknown): ham is UzSablon => typeof ham === 'string' && (UZ_ACIK_SABLONLAR as readonly string[]).includes(ham)
