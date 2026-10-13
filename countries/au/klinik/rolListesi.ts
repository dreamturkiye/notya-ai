/**
 * NOTYA-ULKE-UYGULA-AU — Australia: WHERE ITS ROLE LIST DIFFERS FROM THE SHARED FORTY — the keys, kinds, names and
 * the shared role each of its own roles behaves like. LIGHT: plain data, type-only imports. The pack's settings
 * (../index.ts, loaded by the middleware and the browser) read the role KEYS from here; the note fields and the
 * intake questions the two split roles and the other new roles bring are in ./roller.ts, which builds on this list.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-APPLIED FROM THE AUDIT'S DECISIONS (docs/araclar-denetim/au-kararlar.json, `specialties` and
 * `clinicSpecialties`). NOBODY IN AUSTRALIA HAS READ IT: no clinician, no lawyer. The names are the regulator's
 * wording, opened again on 2026-10-10; whether a role is wanted, and which shared role it should behave like, is
 * for a local clinical lead.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * THE OFFICIAL NAMES. Source opened 2026-10-10: Medical Board of Australia, "List of specialties, fields of specialty
 * practice and related specialist titles" (effective 22 September 2025),
 * https://www.ahpra.gov.au/documents/default.aspx?record=WD10%2f106&dbid=AP&chksum=07LyDUkqqYa5O5LXuqbSzg%3d%3d
 *   - under "Surgery": "Cardio-thoracic surgery" and "Vascular surgery" are two fields. The shared set divides the
 *     same work as "Thoracic surgery" and "Cardiac and vascular surgery": in Australia heart surgery sits with chest
 *     surgery. So this pack SPLITS along the Board's line: both shared roles are taken out and two roles are added.
 *   - under "Physician": "Geriatric medicine", "Haematology", "Immunology and allergy" (and "Medical oncology",
 *     "Gastroenterology and hepatology": renamed in ../ayarlar.ts, the keys are kept).
 *   - specialties of their own: "Pain medicine", "Radiation oncology".
 * The allied professions. Source opened 2026-10-10: Ahpra, "Professions and divisions" (page reviewed 11/04/2025),
 * https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Professions-and-Divisions.aspx — "Podiatrist" is
 * one of the sixteen regulated professions; speech pathology is not on that list. Its name here is the profession's
 * own: Allied Health Professions Australia, "Speech Pathology", https://www.ahpa.com.au/speech-pathology (opened
 * 2026-10-10: "a self-regulated profession"; practitioners are "speech pathologists").
 *
 * REMOVED: "Dermatology (clinic)". "Dermatology" is a recognised specialty and the doctor list has it; a second role
 * with the same word, offered to doctors who are not dermatologists, is taken out (decision: remove).
 *
 * WHICH SHARED ROLE EACH NEW ROLE BEHAVES LIKE (`gibi`) is this job's reading of "the nearest", for a local clinical
 * lead to confirm. It is recorded for every country in countries/rol-eslemesi.json (`ulkeyeOzel.au`).
 */
import type { EnRol } from '../../_dil/en/klinik/roller'
import type { RolTarafi } from '@/lib/ulke/arayuz/tipler'

/** A role only Australia has, as the light list states it. */
export type AuEkRol = { anahtar: string; taraf: RolTarafi; ad: string; gibi: EnRol; once?: EnRol }

/** Shared roles Australia does not have: the two it splits along the Medical Board's line, and the one it removes. */
export const AU_CIKAN_ROLLER = ['thoracic-surgery', 'cardiovascular-surgery', 'clinic-dermatology'] as const satisfies readonly EnRol[]

/** Roles only Australia has, in the order they are added. Names exactly as the source above writes them. */
export const AU_EK_ROLLER = [
  // THE SPLIT. Each half stands where the shared role it comes from stood.
  { anahtar: 'cardio-thoracic-surgery', taraf: 'doktor', ad: 'Cardio-thoracic surgery', gibi: 'thoracic-surgery', once: 'respiratory-medicine' },
  { anahtar: 'vascular-surgery', taraf: 'doktor', ad: 'Vascular surgery', gibi: 'cardiovascular-surgery', once: 'cardiology' },
  // RECOGNISED IN AUSTRALIA, absent from the shared forty. How common each is in private practice was not verified.
  { anahtar: 'radiation-oncology', taraf: 'doktor', ad: 'Radiation oncology', gibi: 'oncology', once: 'orthopaedics' },
  { anahtar: 'geriatric-medicine', taraf: 'doktor', ad: 'Geriatric medicine', gibi: 'internal-medicine' },
  { anahtar: 'immunology-and-allergy', taraf: 'doktor', ad: 'Immunology and allergy', gibi: 'internal-medicine' },
  { anahtar: 'haematology', taraf: 'doktor', ad: 'Haematology', gibi: 'internal-medicine' },
  { anahtar: 'pain-medicine', taraf: 'doktor', ad: 'Pain medicine', gibi: 'rehabilitation-medicine' },
  // ALLIED PROFESSIONS, named as the profession.
  { anahtar: 'podiatry', taraf: 'klinik-muttefik', ad: 'Podiatrist', gibi: 'physiotherapy' },
  { anahtar: 'speech-pathology', taraf: 'klinik-muttefik', ad: 'Speech pathologist', gibi: 'occupational-therapy' },
] as const satisfies readonly AuEkRol[]

export type AuEkRolAnahtari = (typeof AU_EK_ROLLER)[number]['anahtar']

/** The light form of the difference: enough for the role KEYS and their order (../index.ts). */
export const AU_ROL_LISTESI = { cikar: AU_CIKAN_ROLLER, ekle: AU_EK_ROLLER } as const

/**
 * A STORED ACCOUNT THAT STILL HOLDS A KEY AUSTRALIA NO LONGER HAS. What the kit does with such a key, today: it is
 * "no role" (lib/ulke/uygulama/rol.ts) — the account loads, sees the base tools, writes with the general template,
 * and is asked once more which role it works in. Nothing is lost and nothing falls back to a role nobody chose.
 * THE NEAREST REMAINING ROLE for each such key is stated here, for the one-time change of stored rows the owner may
 * order (the kit has no step that applies such a mapping when an account signs in):
 *   thoracic-surgery        → cardio-thoracic-surgery   (the same work, under the Board's name)
 *   cardiovascular-surgery  → vascular-surgery          (as the decisions file records the rename; a HEART surgeon
 *                                                        belongs in cardio-thoracic-surgery and chooses it)
 *   clinic-dermatology      → null                      (no remaining role is a safe guess: "Dermatology" is a
 *                                                        specialist's field. The account chooses again.)
 */
export const AU_ESKI_ROL_ESLEMESI: Readonly<Record<(typeof AU_CIKAN_ROLLER)[number], AuEkRolAnahtari | null>> = {
  'thoracic-surgery': 'cardio-thoracic-surgery',
  'cardiovascular-surgery': 'vascular-surgery',
  'clinic-dermatology': null,
}
