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
 *
 * NOTYA-ULKE-OZEL-01 — A COUNTRY'S OWN ROLE LIST. The forty keys below are what the five countries SHARE; a country
 * states only where it differs (`EnRolDegisimi`, in its own ayarlar.ts):
 *   cikar   shared roles this country does not have
 *   ekle    roles ONLY THIS COUNTRY has, each with the shared role it BEHAVES LIKE (`gibi`): it then writes its notes
 *           with that role's template and asks that role's intake questions, under its own name — unless the country
 *           brings the role's own fields (`sablon`) or its own questions (`form`).
 * A rename is `rolAdlari`, as before. A split is one role taken out and two added that behave like it; a merge is two
 * taken out and one added. A country that states no difference gets exactly the forty, as before this existed: the
 * same list object, the same role definitions. Which country differs how is recorded in countries/rol-eslemesi.json
 * (`ulkeyeOzel`) and held to the packs by lib/ulke/rolEslemesi.paket.test.ts.
 */
import type { NotBolumu, RolTanimi, RolTarafi } from '@/lib/ulke/arayuz/tipler'
import type { HamRol } from './hastaFormu/yardimci'
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
 * `degisim` = where this country's role list differs from the shared forty; a role it adds is named AS WRITTEN.
 */
export function enRolTanimlari(bicim: EnBicim, adlar: Readonly<Partial<Record<EnRol, string>>>, degisim?: EnRolDegisimi): readonly RolTanimi[] {
  if (!rolDegisimiVar(degisim)) return EN_ROL_SATIRLARI.map((r) => ({ anahtar: r.anahtar, taraf: r.taraf, ad: { [bicim]: adlar[r.anahtar] ?? enYaz(r.ad, bicim) } }))
  return enRolSatirlari(degisim).map((r) => (r.ek
    ? { anahtar: r.anahtar, taraf: r.taraf, ad: { [bicim]: r.ad }, ...(r.ek.gibi ? { gibi: r.ek.gibi } : {}) }
    : { anahtar: r.anahtar, taraf: r.taraf, ad: { [bicim]: adlar[r.anahtar as EnRol] ?? enYaz(r.ad, bicim) } }))
}

// ───────────────────────── NOTYA-ULKE-OZEL-01: a country's own role list ─────────────────────────

/** A role ONLY ONE COUNTRY has. Its key is internal like every role key: lower-case English words joined by hyphens. */
export type EnEkRol = {
  anahtar: string
  taraf: RolTarafi
  /** The role's name as THIS COUNTRY writes it, in the country's own spelling. Used as written. */
  ad: string
  /**
   * The SHARED role this one behaves like: its note template and its intake questions. null = it behaves like none:
   * the country then brings the role's own questions (`form`), and its notes use the general template unless it
   * brings fields of its own (`sablon`).
   */
  gibi: EnRol | null
  /** Where it stands in the list: before this role. Omitted = last of its kind (doctor, clinic doctor, allied profession). */
  once?: string
  /** true / false = its patients are children / are not. Omitted = as the role it behaves like. */
  cocuk?: boolean
  /** THE ROLE'S OWN NOTE FIELDS, in order: keys of the set's fields (./notSablonlari.ts → EN_ALANLAR) or of `EnRolDegisimi.alanlar`. */
  sablon?: readonly string[]
  /** THE ROLE'S OWN INTAKE QUESTIONS, written like the set's (./hastaFormu/yardimci.ts). Every question key is unique in the pack. */
  form?: HamRol
}

/** Where ONE COUNTRY's role list differs from the shared forty. Stated in the country's own folder; nothing here is a default. */
export type EnRolDegisimi = {
  /** Shared roles this country does not have. */
  cikar?: readonly EnRol[]
  /** Roles only this country has. */
  ekle?: readonly EnEkRol[]
  /** Note fields only this country has (for `EnEkRol.sablon`): key → section and label, in the country's own spelling. */
  alanlar?: Readonly<Record<string, { bolum: NotBolumu; ad: string }>>
}

const rolDegisimiVar = (d?: EnRolDegisimi): d is EnRolDegisimi => Boolean(d && ((d.cikar?.length ?? 0) > 0 || (d.ekle?.length ?? 0) > 0))

/** One role of a country's list: a shared row, or a row the country added (`ek`). */
export type EnRolSatiri = { anahtar: string; taraf: RolTarafi; ad: string; ek?: EnEkRol }

/**
 * A COUNTRY'S ROLE LIST: the shared forty without what it takes out, with what it adds — each added role before the
 * role it names (`once`), otherwise last of its kind, so that the three kinds stay together.
 */
export function enRolSatirlari(degisim?: EnRolDegisimi): readonly EnRolSatiri[] {
  if (!rolDegisimiVar(degisim)) return EN_ROL_SATIRLARI
  const cikan = new Set<string>(degisim.cikar ?? [])
  const liste: EnRolSatiri[] = EN_ROL_SATIRLARI.filter((r) => !cikan.has(r.anahtar)).map((r) => ({ anahtar: r.anahtar, taraf: r.taraf, ad: r.ad }))
  for (const ek of degisim.ekle ?? []) {
    const satir: EnRolSatiri = { anahtar: ek.anahtar, taraf: ek.taraf, ad: ek.ad, ek }
    let yer = ek.once ? liste.findIndex((r) => r.anahtar === ek.once) : -1
    if (yer < 0) { const sonuncu = liste.map((r) => r.taraf).lastIndexOf(ek.taraf); yer = sonuncu >= 0 ? sonuncu + 1 : liste.length }
    liste.splice(yer, 0, satir)
  }
  return liste
}

/**
 * THE ROLE KEYS OF A COUNTRY, in order: the value of its pack's `uygulama.roller`. A country that states no
 * difference gets the shared list itself (EN_ROLLER).
 */
export function enRolAnahtarlari(degisim?: EnRolDegisimi): readonly string[] {
  return rolDegisimiVar(degisim) ? enRolSatirlari(degisim).map((r) => r.anahtar) : EN_ROLLER
}

/** The roles of a country whose patients are children. */
export function enCocukRolleri(degisim?: EnRolDegisimi): readonly string[] {
  if (!rolDegisimiVar(degisim)) return EN_COCUK_ROLLERI
  const temel: readonly string[] = EN_COCUK_ROLLERI
  return enRolSatirlari(degisim).filter((r) => (r.ek ? r.ek.cocuk ?? (r.ek.gibi !== null && temel.includes(r.ek.gibi)) : temel.includes(r.anahtar))).map((r) => r.anahtar)
}

/** The shared roles a country's added roles behave like: their templates and question sets stay in the pack, also where the role itself is taken out. */
export const enGibiRolleri = (degisim?: EnRolDegisimi): readonly EnRol[] => [...new Set((degisim?.ekle ?? []).map((r) => r.gibi).filter((g): g is EnRol => g !== null))]

/** A role's name in a pack's form, from the roles the pack built. '' for anything that is not one of them. */
export const enRolAdi = (roller: readonly RolTanimi[], rol: string, bicim: EnBicim): string => roller.find((r) => r.anahtar === rol)?.ad[bicim] ?? ''
