/**
 * NOTYA-ULKE-UYGULA-US — United States: THE ROLE LIST OF THIS COUNTRY, where it differs from the forty roles the
 * English-speaking packs share (countries/_dil/en/klinik/roller.ts). Applied from the audit of 2026-10-10
 * (docs/araclar-denetim/US.md, Part 3, and us-kararlar.json → `specialties`, `clinicSpecialties`, on the branch
 * araclar-denetim/us). THIS FILE CHANGES THE UNITED STATES ONLY.
 *
 * Plain data and one pure function: type-only imports, so that the pack's light file (./index.ts) can read it.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * NAMES. A role this country adds or renames is written EXACTLY AS THE BODY CITED WRITES IT (capital letters
 * included), each read again on 2026-10-10:
 *   [ABMS]  American Board of Medical Specialties, "Specialty and Subspecialty Certificates",
 *           https://www.abms.org/member-boards/specialty-subspecialty-certificates/
 *   [CMS]   Centers for Medicare & Medicaid Services, "CMS Specialty Codes/Healthcare Provider Taxonomy Crosswalk"
 *           (specialty codes as of April 1, 2003; taxonomy of July 2004),
 *           https://cms.gov/Medicare/Provider-Enrollment-and-Certification/MedicareProviderSupEnroll/Downloads/taxonomy.pdf
 *   [BLS]   Bureau of Labor Statistics, Occupational Outlook Handbook, Healthcare Occupations,
 *           https://www.bls.gov/ooh/healthcare/home.htm (as the audit read it on 2026-10-10; not opened again)
 * The 25 specialties the audit keeps are left as they were, in the set's sentence case: the two styles stand side by
 * side on the screen until a native editor chooses one.
 *
 * WHICH SHARED ROLE AN ADDED ROLE BEHAVES LIKE (`gibi`: its note template and its intake questions) IS THIS JOB'S
 * CHOICE OF THE NEAREST ROLE, NOT A FINDING OF THE AUDIT. Each waits on a clinician of that specialty in the United
 * States. No tool is inherited through it: every tool names its roles (./ayarlar.ts → `gorenler`).
 *
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE: nobody in the United States has read this list.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { EnRol, EnRolDegisimi } from '../_dil/en/klinik/roller'

/**
 * THE FIVE RENAMES of the audit (the key of each role stays; only the name shown changes), each as [ABMS] writes the
 * certificate, or — for oncology, which is on no board list under one name — as [CMS] writes the specialty:
 *   thoracic-surgery        "Thoracic surgery"             → "Thoracic and Cardiac Surgery"  [ABMS, American Board of Thoracic Surgery]
 *   respiratory-medicine    "Pulmonology"                  → "Pulmonary Disease"             [ABMS, American Board of Internal Medicine; CMS]
 *   cardiovascular-surgery  "Cardiac and vascular surgery" → "Vascular Surgery"              [ABMS, American Board of Surgery; CMS]
 *   oncology                "Oncology"                     → "Hematology/Oncology"           [CMS] (ABMS has "Medical Oncology" and "Hematology": a US oncologist chooses)
 *   radiology               "Radiology"                    → "Diagnostic Radiology"          [ABMS, American Board of Radiology; CMS]
 * Heart surgery moves with the name: the board's certificate for it is the thoracic one, so the checklist before a
 * heart or vascular operation is shown to both roles (./ayarlar.ts → `gorenler`). A US surgeon confirms.
 */
export const US_YENIDEN_ADLANANLAR: Readonly<Partial<Record<EnRol, string>>> = {
  'thoracic-surgery': 'Thoracic and Cardiac Surgery',
  'respiratory-medicine': 'Pulmonary Disease',
  'cardiovascular-surgery': 'Vascular Surgery',
  oncology: 'Hematology/Oncology',
  radiology: 'Diagnostic Radiology',
}

/**
 * WHERE THE ROLE LIST DIFFERS FROM THE SHARED FORTY: one role taken out, twelve added (ten doctor specialties, two
 * professions of a clinic). 40 − 1 + 12 = 51 roles.
 */
export const US_ROLLER: EnRolDegisimi = {
  // REMOVED: "Dermatology (clinic)". There is one specialty, Dermatology [ABMS], and the doctor role carries it.
  cikar: ['clinic-dermatology'],
  ekle: [
    // ── TEN DOCTOR SPECIALTIES the audit found on [ABMS] and missing here. Each name is the certificate's.
    { anahtar: 'allergy-immunology', taraf: 'doktor', ad: 'Allergy and Immunology', gibi: 'internal-medicine' },
    { anahtar: 'geriatric-medicine', taraf: 'doktor', ad: 'Geriatric Medicine', gibi: 'internal-medicine' },
    { anahtar: 'pain-medicine', taraf: 'doktor', ad: 'Pain Medicine', gibi: 'rehabilitation-medicine' },
    { anahtar: 'sleep-medicine', taraf: 'doktor', ad: 'Sleep Medicine', gibi: 'respiratory-medicine' },
    { anahtar: 'colon-rectal-surgery', taraf: 'doktor', ad: 'Colon and Rectal Surgery', gibi: 'general-surgery' },
    { anahtar: 'radiation-oncology', taraf: 'doktor', ad: 'Radiation Oncology', gibi: 'oncology' },
    // its patients are children: an unknown age counts as below the guardian age, as in pediatrics
    { anahtar: 'child-adolescent-psychiatry', taraf: 'doktor', ad: 'Child and Adolescent Psychiatry', gibi: 'psychiatry', cocuk: true },
    { anahtar: 'addiction-medicine', taraf: 'doktor', ad: 'Addiction Medicine', gibi: 'psychiatry' },
    { anahtar: 'hospice-palliative-medicine', taraf: 'doktor', ad: 'Hospice and Palliative Medicine', gibi: 'internal-medicine' },
    { anahtar: 'reproductive-endocrinology-infertility', taraf: 'doktor', ad: 'Reproductive Endocrinology and Infertility', gibi: 'obstetrics-gynaecology' },
    // ── TWO PROFESSIONS of a clinic, each beside a profession the set already has and framed the same way: the
    // instruction to the model names the profession, says the colleague is not a doctor, and writes the
    // professional's own assessment as it was said.
    // The therapy rule names this profession beside physical and occupational therapists (42 CFR 410.61, as the audit
    // read it). Its note keeps the occupational therapist's fields that are not about the hand or the home.
    { anahtar: 'speech-language-pathology', taraf: 'klinik-muttefik', ad: 'Speech-Language Pathologist', gibi: 'occupational-therapy', sablon: ['referral_diagnosis', 'functional_status', 'daily_activities', 'session_content', 'assistive_devices', 'rehab_goals'] },
    { anahtar: 'clinical-social-work', taraf: 'klinik-muttefik', ad: 'Licensed Clinical Social Worker', gibi: 'clinical-psychology' },
  ],
}

/**
 * NOT ADDED, AND WHY. The audit's verdict for all six is "add"; each waits on the kit, and nothing is half-added.
 *
 * NURSE PRACTITIONER and PHYSICIAN ASSISTANT [CMS] ("first to add"). They work in every specialty, so each is a
 * title beside a specialty, and an account of the kit has ONE role: it cannot say "nurse practitioner in
 * cardiology", and the tools they should see are "the tools of the specialty they work in" (the audit's own words).
 * Until the kit can hold a profession AND a specialty on one account, such a colleague chooses the specialty they
 * work in.
 *
 * PODIATRY, OPTOMETRY, CHIROPRACTIC [CMS] and the NURSE MIDWIFE [CMS: "Certified Nurse Midwife"]. The kit has two
 * openings for the instruction to the model and no third: a physician's, and "a health professional and not a
 * doctor" who makes no medical diagnosis and writes a referring doctor's diagnosis "only in the field meant for it".
 * The second was written for the therapist, the dietitian and the audiologist. Read out for these four (this job
 * read the instruction the pack would hand the model for each), it tells the model that a podiatrist or an
 * optometrist is not a doctor and diagnoses nothing, and it names a field their note would not have. What each may
 * diagnose and treat is set state by state: FOR A US CLINICIAN AND A LAWYER, and for the kit a third opening (a
 * practitioner who is not a physician and has a scope of their own). Adding each afterwards is one line here, one in
 * countries/rol-eslemesi.json, and the tools the audit names for it (`gorenler` in ./ayarlar.ts).
 */
export const US_EKLENMEYEN_MESLEKLER: readonly string[] = ['nurse-practitioner', 'physician-assistant', 'podiatry', 'optometry', 'chiropractic', 'nurse-midwifery']

/**
 * A ROLE KEY THIS COUNTRY NO LONGER HAS → THE NEAREST ROLE IT STILL HAS. An account is stored with its role's key
 * (the kit's table `hekim_rolu`). The kit reads a key that is no longer on the pack's list as "no role chosen":
 * the account loads, sees the base tools and the general note template, and is asked for its role again
 * (lib/ulke/uygulama/rol.ts). THE KIT HAS NO PLACE TO APPLY THIS MAP BY ITSELF; it is the country's statement of
 * where each such account belongs, for the one-time update of the United States' own database on the day it exists
 * (no database and no account exists for this country today), and for a kit that later reads it.
 */
export const US_ROL_GOCU: Readonly<Record<string, string>> = {
  // "Dermatology (clinic)" was a second name for the one specialty
  'clinic-dermatology': 'dermatology',
}

/**
 * The role an account stored with `ham` works as in this country: the key itself where it is a role here, the
 * nearest remaining role where this country took the key out, otherwise null (not a role of this country at all).
 */
export function usRolunuCoz(ham: unknown, roller: readonly string[]): string | null {
  if (typeof ham !== 'string' || !ham) return null
  if (roller.includes(ham)) return ham
  const yeni = Object.prototype.hasOwnProperty.call(US_ROL_GOCU, ham) ? US_ROL_GOCU[ham] : null
  return yeni !== null && roller.includes(yeni) ? yeni : null
}
