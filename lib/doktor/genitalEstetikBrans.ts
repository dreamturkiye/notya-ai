/**
 * GENITAL-ESTETIK-01 — WHO HAS THE PACKAGE, AND WHICH PART. Client-safe: the patient file's tab button, its mount, the
 * operation-note template registry and every server route read these ONE decisions (by the doctor's own users.specialty,
 * never a request parameter).
 *
 *   'tam'     Kadın Hastalıkları ve Doğum: everything — the genital-aesthetic operation-note templates, consent and
 *             instruction sheets, energy-based sessions, the injection log with lot recall, whitening, all outcome
 *             measures (FSFI, FGSIS, COPS-L) and the protected photo documentation.
 *   'cerrahi' Plastik cerrahi and the Özel Branş "Estetik & Plastik Cerrahi" (owner's decision, Kaan, 2026-11-06): the
 *             SURGICAL part only — the four operation-note templates (with the indication field and the under-18 block),
 *             their consent forms and instruction sheets, the COPS-L body-image prompt and the protected photos.
 *   null      Every other branch sees nothing of it (brans-alan-sizmasi).
 *
 * Energy-based sessions on the vaginal canal, intravaginal / labial injections, genital whitening and the sexual-function
 * and genital self-image questionnaires (FSFI, FGSIS) stay gynaecological chapter content: KD only.
 */
import { kadinDogumBransi } from '@/lib/doktor/hastaDosyaSekmeleri'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import type { GeOlcek } from '@/lib/clinical/genitalEstetik'

export type GeKapsam = 'tam' | 'cerrahi'

/** Plastik cerrahi (any stored spelling) or the Özel Branş "Estetik & Plastik Cerrahi" — never medikal estetik. */
export function plastikGenitalBransi(specialtyHam: string | null | undefined): boolean {
  const ozel = klinikSlugCoz(specialtyHam)
  if (ozel) return ozel === 'estetik-cerrahi'
  return bransAnahtari(specialtyHam) === 'plastik-cerrahi'
}

export function genitalEstetikKapsami(specialtyHam: string | null | undefined): GeKapsam | null {
  if (kadinDogumBransi(specialtyHam)) return 'tam'
  return plastikGenitalBransi(specialtyHam) ? 'cerrahi' : null
}

/** Does this doctor have the package at all (the tab, the photos, the templates)? */
export const genitalEstetikBransi = (specialtyHam: string | null | undefined): boolean => genitalEstetikKapsami(specialtyHam) !== null

/** Records only obstetrics and gynaecology keeps. */
export const GE_YALNIZ_KD_TURLERI = ['enerji', 'enjeksiyon', 'beyazlatma'] as const
/** The outcome measures of the surgical part: the body-image screen before a genital-aesthetic operation. */
export const GE_CERRAHI_OLCEKLERI: readonly GeOlcek[] = ['cops_l']

/** The instruments a doctor of this scope records. */
export const geOlcekleriKapsam = (kapsam: GeKapsam | null, hepsi: readonly GeOlcek[]): readonly GeOlcek[] =>
  kapsam === 'tam' ? hepsi : kapsam === 'cerrahi' ? hepsi.filter((o) => GE_CERRAHI_OLCEKLERI.includes(o)) : []

/** May a doctor of this scope write a record of this kind (and, for an outcome measure, this instrument)? */
export function geKayitAcik(kapsam: GeKapsam | null, tur: string, olcek?: unknown): boolean {
  if (!kapsam) return false
  if (kapsam === 'tam') return true
  if ((GE_YALNIZ_KD_TURLERI as readonly string[]).includes(tur)) return false
  if (tur === 'olcek') return typeof olcek === 'string' && (GE_CERRAHI_OLCEKLERI as readonly string[]).includes(olcek)
  return true
}
