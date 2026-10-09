/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the ROLES an account may work as, defined ONCE for the five
 * English-speaking countries: 30 doctor specialties, 5 clinic doctors, 5 clinic allied professions.
 *
 * ONE KEY SET. Every English pack uses exactly these 40 keys, in this order (the coordinator's condition of
 * 2026-10-09). A key is internal and never shown: lower-case English words joined by hyphens, in the set's base
 * spelling. How each key maps to the Turkish product's key and to the Uzbek pack's key — so that a fix made for one
 * specialty can be traced across countries — is countries/rol-eslemesi.json, explained in
 * docs/COUNTRY-PACK-ROLE-KEYS.md and held to all three sides by lib/ulke/rolEslemesi.test.ts.
 *
 * NAMES ARE THE COUNTRY'S. What a specialty is CALLED differs by country (general practice / family medicine,
 * anaesthetics / anesthesiology, respiratory medicine / pulmonology / respirology, physiotherapist / physical
 * therapist). The set holds a plain base name per role, written in en-GB spelling; a country pack replaces the ones
 * its own usage names differently (`adlar`), in its own spelling, and those are used AS WRITTEN.
 *
 * MACHINE-WRITTEN. The base names are from general knowledge. None was checked against any country's official list of
 * specialties, and no clinician has read them (docs/COUNTRY-PACK-CHECKLIST.md C1, E4, E11).
 */
import type { RolTanimi, RolTarafi } from '@/lib/ulke/arayuz/tipler'
import { enYaz, type EnBicim } from '../varyant'

type Satir = { anahtar: string; taraf: RolTarafi; ad: string }
const d = (anahtar: string, ad: string): Satir => ({ anahtar, taraf: 'doktor', ad })
const h = (anahtar: string, ad: string): Satir => ({ anahtar, taraf: 'klinik-hekim', ad })
const m = (anahtar: string, ad: string): Satir => ({ anahtar, taraf: 'klinik-muttefik', ad })

/** The 40 roles, in the order they are offered. Base names in en-GB spelling. */
export const EN_ROL_SATIRLARI = [
  // ── doctor specialties (30)
  d('emergency-medicine', 'Emergency medicine'),
  d('family-medicine', 'Family medicine'),
  d('anaesthesia', 'Anaesthesia'),
  d('neurosurgery', 'Neurosurgery'),
  d('paediatric-surgery', 'Paediatric surgery'),
  d('internal-medicine', 'Internal medicine'),
  d('dermatology', 'Dermatology'),
  d('endocrinology', 'Endocrinology'),
  d('infectious-diseases', 'Infectious diseases'),
  d('gastroenterology', 'Gastroenterology'),
  d('general-surgery', 'General surgery'),
  d('thoracic-surgery', 'Thoracic surgery'),
  d('respiratory-medicine', 'Respiratory medicine'),
  d('ophthalmology', 'Ophthalmology'),
  d('obstetrics-gynaecology', 'Obstetrics and gynaecology'),
  d('cardiovascular-surgery', 'Cardiac and vascular surgery'),
  d('cardiology', 'Cardiology'),
  d('otolaryngology', 'Otolaryngology (ENT)'),
  d('nephrology', 'Nephrology'),
  d('neurology', 'Neurology'),
  d('oncology', 'Oncology'),
  d('orthopaedics', 'Orthopaedic surgery'),
  d('paediatrics', 'Paediatrics'),
  d('plastic-surgery', 'Plastic surgery'),
  d('psychiatry', 'Psychiatry'),
  d('radiology', 'Radiology'),
  d('rheumatology', 'Rheumatology'),
  d('urology', 'Urology'),
  d('sports-medicine', 'Sport and exercise medicine'),
  d('rehabilitation-medicine', 'Rehabilitation medicine'),
  // ── clinic doctors (5)
  h('hair-transplant', 'Hair transplantation'),
  h('aesthetic-surgery', 'Cosmetic surgery'),
  h('aesthetic-medicine', 'Aesthetic medicine'),
  h('clinic-dermatology', 'Dermatology (clinic)'),
  h('longevity', 'Preventive and longevity medicine'),
  // ── clinic allied professions (5): named as the profession
  m('physiotherapy', 'Physiotherapist'),
  m('clinical-psychology', 'Clinical psychologist'),
  m('dietetics', 'Dietitian'),
  m('occupational-therapy', 'Occupational therapist'),
  m('audiology', 'Audiologist'),
] as const satisfies readonly Satir[]

export type EnRol = (typeof EN_ROL_SATIRLARI)[number]['anahtar']

/** The 40 role keys, in order. The value of every English pack's `uygulama.roller`. */
export const EN_ROLLER: readonly EnRol[] = EN_ROL_SATIRLARI.map((r) => r.anahtar)

export const enRolMu = (ham: unknown): ham is EnRol => typeof ham === 'string' && (EN_ROLLER as readonly string[]).includes(ham)

/** Which of the three kinds a role is. */
export const enRolTarafi = (rol: EnRol): RolTarafi => EN_ROL_SATIRLARI.find((r) => r.anahtar === rol)!.taraf

/** Roles whose patients are children: only there does an unknown age count as "below the guardian age". */
export const EN_COCUK_ROLLERI: readonly EnRol[] = ['paediatrics', 'paediatric-surgery']

/**
 * The roles as a pack hands them to the shared screens: key, kind, and the name in the pack's form of English.
 * `adlar` = the names THIS COUNTRY uses where they differ from the base, written in the country's own spelling.
 */
export function enRolTanimlari(bicim: EnBicim, adlar: Readonly<Partial<Record<EnRol, string>>>): readonly RolTanimi[] {
  return EN_ROL_SATIRLARI.map((r) => ({ anahtar: r.anahtar, taraf: r.taraf, ad: { [bicim]: adlar[r.anahtar] ?? enYaz(r.ad, bicim) } }))
}

/** A role's name in a pack's form, from the roles the pack built. '' for anything that is not one of them. */
export const enRolAdi = (roller: readonly RolTanimi[], rol: string, bicim: EnBicim): string => roller.find((r) => r.anahtar === rol)?.ad[bicim] ?? ''
