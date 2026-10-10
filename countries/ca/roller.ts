/**
 * NOTYA-ULKE-UYGULA-CA — Canada: THE ROLE LIST OF THIS COUNTRY, where it differs from the forty roles the
 * English-speaking packs share (countries/_dil/en/klinik/roller.ts). Applied from the audit of 2026-10-10
 * (docs/araclar-denetim/CA.md, Part 3, and ca-kararlar.json → `specialties`, `clinicSpecialties`).
 * THIS FILE CHANGES CANADA ONLY.
 *
 * Plain data and one pure function: type-only imports, so that the pack's light file (./index.ts) can read it.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * NAMES. A role this country adds or renames is written EXACTLY AS THE BODY CITED WRITES IT (capital letters and the
 * hyphen included), each read again on 2026-10-10:
 *   [RC]    Royal College of Physicians and Surgeons of Canada, "Information by discipline",
 *           https://www.royalcollege.ca/en/standards-and-accreditation/information-by-discipline.html — the lists
 *           under its headings "Specialty", "Subspecialty" and "AFC-Diploma". The page shows no date.
 *   [CIHI]  Canadian Institute for Health Information, "Health Workforce in Canada, 2019 to 2023: Overview —
 *           Methodology Notes" (2025), Table 1 and the appendix "first year of regulation, by province and territory",
 *           https://www.cihi.ca/sites/default/files/document/health-workforce-canada-2019-2023-overview-meth-notes-en.pdf
 * The roles the audit keeps are left as they were, in the set's sentence case: the two styles stand side by side on
 * the screen until a native editor chooses one.
 *
 * WHICH SHARED ROLE AN ADDED ROLE BEHAVES LIKE (`gibi`: its note template and its intake questions) IS THIS JOB'S
 * CHOICE OF THE NEAREST ROLE, NOT A FINDING OF THE AUDIT. Each waits on a clinician of that discipline in Canada. No
 * tool is inherited through it: every tool names its roles (./ayarlar.ts → `gorenler`).
 *
 * THAT EACH ADDED DISCIPLINE IS COMMON IN OFFICE PRACTICE IN CANADA is the audit's judgement, not a statement of a
 * source. QUEBEC certifies its own specialists and is out of scope.
 *
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE: nobody in Canada has read this list.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { EnRol, EnRolDegisimi } from '../_dil/en/klinik/roller'

/**
 * THE SEVEN RENAMES of the audit (the key of each role stays; only the name shown changes).
 *
 * Four doctor specialties, each as [RC] writes the discipline:
 *   internal-medicine       "General internal medicine"             → "Internal Medicine"   [RC, Specialty] ("General
 *                           Internal Medicine" is a separate SUBSPECIALTY there)
 *   cardiovascular-surgery  "Cardiac and vascular surgery"          → "Cardiac Surgery"     [RC, Specialty] (no discipline
 *                           of both exists: Vascular Surgery is a specialty of its own and is added below — the SPLIT)
 *   otolaryngology          "Otolaryngology, head and neck surgery" → "Otolaryngology-Head and Neck Surgery" [RC, Specialty]
 *   oncology                "Oncology"                              → "Medical Oncology"    [RC, Subspecialty] (the role's
 *                           tools, treatment cycles and side effects, are a medical oncologist's)
 *
 * Three clinic roles:
 *   clinic-dermatology      "Dermatology (clinic)"                  → "Dermatology"         [RC, Specialty]. The name is the
 *                           same as the specialty's; the two stand under different headings of the role question
 *                           ("Medical specialty", "Clinic doctor") and see the same dermatology tools.
 *   longevity               "Preventive and longevity medicine"     → "Longevity medicine". The audit's decision is only
 *                           that the word "Preventive" goes: [RC] has a specialty "Public Health and Preventive
 *                           Medicine", which is another thing. NOT A DISCIPLINE ON [RC]; THE FINAL WORDING IS FOR A
 *                           LOCAL LEAD AND A LAWYER.
 *   clinical-psychology     "Clinical psychologist"                 → "Psychologist". [CIHI] names the profession
 *                           "Psychologists" (regulated in every province and territory but Yukon, by its appendix);
 *                           the singular is this product's way of naming a profession. The protected title in each
 *                           province was not read: FOR A LAWYER.
 */
export const CA_YENIDEN_ADLANANLAR: Readonly<Partial<Record<EnRol, string>>> = {
  'internal-medicine': 'Internal Medicine',
  'cardiovascular-surgery': 'Cardiac Surgery',
  otolaryngology: 'Otolaryngology-Head and Neck Surgery',
  oncology: 'Medical Oncology',
  'clinic-dermatology': 'Dermatology',
  longevity: 'Longevity medicine',
  'clinical-psychology': 'Psychologist',
}

/**
 * WHERE THE ROLE LIST DIFFERS FROM THE SHARED FORTY: nothing taken out, seven added (six doctor disciplines, one
 * profession of a clinic). 40 + 7 = 47 roles.
 */
export const CA_ROLLER: EnRolDegisimi = {
  cikar: [],
  ekle: [
    // ── THE SPLIT. "Cardiac and vascular surgery" is two specialties on [RC]. The shared key stays and is named
    // "Cardiac Surgery" (above); this is the other half, placed right after it. Both write with the same template.
    { anahtar: 'vascular-surgery', taraf: 'doktor', ad: 'Vascular Surgery', gibi: 'cardiovascular-surgery', once: 'cardiology' },
    // ── FIVE SUBSPECIALTIES the audit found on [RC] and missing here. Each name is the list's.
    { anahtar: 'clinical-immunology-allergy', taraf: 'doktor', ad: 'Clinical Immunology and Allergy', gibi: 'internal-medicine' },
    { anahtar: 'geriatric-medicine', taraf: 'doktor', ad: 'Geriatric Medicine', gibi: 'internal-medicine' },
    { anahtar: 'hematology', taraf: 'doktor', ad: 'Hematology', gibi: 'internal-medicine' },
    // its note is nearest to the rehabilitation physician's (function, pain, examination, program): this job's choice
    { anahtar: 'pain-medicine', taraf: 'doktor', ad: 'Pain Medicine', gibi: 'rehabilitation-medicine' },
    { anahtar: 'reproductive-endocrinology', taraf: 'doktor', ad: 'Gynecologic Reproductive Endocrinology and Infertility', gibi: 'obstetrics-gynaecology' },
    // ── ONE PROFESSION OF A CLINIC. [CIHI] names it "Psychotherapists/counselling therapists"; the singular is this
    // product's way of naming a profession. By [CIHI]'s appendix the profession is regulated in FIVE provinces only
    // (Prince Edward Island, Nova Scotia, New Brunswick, Quebec, Ontario) and in no other province or territory:
    // WHETHER THE TITLE MAY BE OFFERED IN A PROVINCE THAT DOES NOT REGULATE IT, AND UNDER WHICH WORD, IS FOR A LAWYER.
    // An allied profession: the instruction to the model names the profession, says the colleague is not a doctor and
    // makes no medical diagnosis.
    { anahtar: 'psychotherapy', taraf: 'klinik-muttefik', ad: 'Psychotherapist / counselling therapist', gibi: 'clinical-psychology' },
  ],
}

/**
 * NOT ADDED, AND WHY (the audit's verdict is "add"): NURSE PRACTITIONER ([CIHI]: "Nurse practitioners"). The audit
 * sees the role in primary care, with the tools of family medicine. The kit has two openings for the instruction to
 * the model and no third: a physician's ("You are an experienced staff physician", the role named as a specialty),
 * and an allied profession's ("a health professional and not a doctor", with the rule "Make no medical diagnosis").
 * Neither describes this profession: under the first the product would name a nurse practitioner as a physician;
 * under the second the note would leave out an assessment the audit expects the role to make. What a nurse
 * practitioner may do also differs by province (the audit: "a local lead and a lawyer confirm before any work
 * starts"). Until the kit can frame such a profession, a nurse practitioner has no role of their own here.
 * Reported to the owner; nothing is switched on for the role.
 */
export const CA_EKLENMEYEN_MESLEKLER: readonly string[] = ['nurse-practitioner']

/**
 * A ROLE KEY THIS COUNTRY NO LONGER HAS → THE NEAREST ROLE IT STILL HAS. An account is stored with its role's key
 * (the kit's table `hekim_rolu`); the kit reads a key that is not on the pack's list as "no role chosen"
 * (lib/ulke/uygulama/rol.ts). CANADA TOOK NO SHARED KEY OUT, so this map is empty and every account stored with one
 * of the forty keys loads with its role: the split kept the key "cardiovascular-surgery" (now named "Cardiac
 * Surgery") and added "vascular-surgery" beside it. A vascular surgeon who chose the old combined role is shown as
 * "Cardiac Surgery" until they choose "Vascular Surgery" in their settings: no stored account says which half it
 * was. The map and the function stand so that a later removal has one place to be written in, with its test.
 */
export const CA_ROL_GOCU: Readonly<Record<string, string>> = {}

/**
 * The role an account stored with `ham` works as in this country: the key itself where it is a role here, the
 * nearest remaining role where this country took the key out, otherwise null (not a role of this country at all).
 */
export function caRolunuCoz(ham: unknown, roller: readonly string[]): string | null {
  if (typeof ham !== 'string' || !ham) return null
  if (roller.includes(ham)) return ham
  const yeni = Object.prototype.hasOwnProperty.call(CA_ROL_GOCU, ham) ? CA_ROL_GOCU[ham] : null
  return yeni !== null && roller.includes(yeni) ? yeni : null
}
