/**
 * NOTYA-ULKE-EN-01 — United States (`us`, served at /us): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in American spelling (en-US). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in the United States — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-UNITED-STATES.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * READ AGAINST OFFICIAL SOURCES ON 2026-10-09 (NOTYA-ULKE-DENETIM-US, docs/COUNTRY-AUDIT-UNITED-STATES.md): where a
 * line below says "source:", a machine read that page on that day and the value agrees with it. That is not a person
 * of the country confirming it: the block above still holds, and nothing legal or clinical is settled by it.
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 18 is a starting value: the age of majority and the rules on a minor's own consent differ by state;
 * what that means for this product's wording and for the form a parent fills in is a legal question.
 * What the audit of 2026-10-09 read: the federal privacy rule leaves a minor's consent to state law
 * (hhs.gov/hipaa/for-professionals/faq/personal-representatives-and-minors); Nebraska sets majority at 19
 * (nebraskalegislature.gov/laws/statutes.php?statute=43-2101); Oregon lets a minor of 15 consent to medical
 * treatment (ORS 109.640). One number cannot be right in every state: FOR A LAWYER.
 */
export const US_VELI_YASI = 18

/** Units a clinic in the United States records in: pounds, inches, degrees Fahrenheit. A CLINICAL-SAFETY SETTING, unverified
 * with a local clinical lead (checklist C8, E3): the kit converts with exact factors, and a wrong unit here is a wrong result.
 * FOR A LOCAL CLINICAL LEAD (audit of 2026-10-09): these are the units a PATIENT states on the intake form. For a
 * clinician's own entries the Emergency Nurses Association asks for weights "in kilograms only" and names other
 * safety bodies that ask the same (ena.org/sites/default/files/2025-08/Weighing%20All%20Patients%20in%20Kilograms%20Position%20Statement.pdf).
 * The kit has ONE unit setting for both; no live tool of this pack takes a body weight, and a test holds that. */
export const US_BIRIMLER: Birimler = { agirlik: 'lb', boy: 'in', sicaklik: 'F' }

const KLINISYEN = 'a clinical lead in the United States'

export const US_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-US',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). RECORDING-CONSENT LAW DIFFERS BY STATE (some
    // states require the consent of everyone recorded): this sentence must not be relied on in any state until a lawyer
    // has read it for that state. Shown beside the box that unlocks recording. The version stamped on every visit is
    // `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // UNVERIFIED WORDING, DELIBERATELY NEUTRAL (for example a clinic's own record number). An optional free-text field,
    // stored encrypted, never validated and never required. NEVER A SOCIAL SECURITY NUMBER: no screen asks for one.
    kimlikEtiketi: 'Patient identifier',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'MM/DD/YYYY',
  },
  ulkeAdi: 'the United States',
  // The word a senior hospital doctor goes by here. Source: the glossary of the body that accredits residency
  // programs defines "attending physician" (acgme.org/globalassets/pdfs/ab_acgmeglossary.pdf, read 2026-10-09).
  kidemliHekim: 'attending physician',
  // How each specialty is named in the United States, where it differs from the set's base name. READ ON 2026-10-09
  // AGAINST TWO OFFICIAL LISTS (checklist C1): the certificates of the specialty boards
  // (abms.org/member-boards/specialty-subspecialty-certificates) and Medicare's list of specialties
  // (cms.gov/Medicare/Provider-Enrollment-and-Certification/MedicareProviderSupEnroll/Downloads/taxonomy.pdf).
  // Each name below is on at least one of them. "Pulmonary disease" is the name on BOTH (it was "Pulmonology", the
  // everyday word, which is on neither). Where the two lists differ from each other, and for the five clinic roles
  // that are on no list, see the audit document: FOR A LOCAL CLINICAL LEAD. No clinician has read any of these.
  rolAdlari: {
    anaesthesia: 'Anesthesiology',
    'infectious-diseases': 'Infectious disease',
    'respiratory-medicine': 'Pulmonary disease',
    'sports-medicine': 'Sports medicine',
    'rehabilitation-medicine': 'Physical medicine and rehabilitation',
    physiotherapy: 'Physical therapist',
  },
  veliYasi: US_VELI_YASI,
  birimler: US_BIRIMLER,
  surum: 'us-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-US': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from the United States (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // The unit laboratories in the United States report each value in: conventional units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result. Sources read 2026-10-09:
    // albumin-to-creatinine ratio in mg/g (niddk.nih.gov/health-information/professionals/advanced-search/quick-reference-uacr-gfr);
    // creatinine in mg/dL (niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults);
    // glucose in mg/dL (cdc.gov/diabetes/diabetes-testing); cholesterol in mg/dL (cdc.gov/cholesterol/about);
    // hemoglobin in g/dL (medlineplus.gov/ency/article/003645.htm). STILL UNVERIFIED with a local clinical lead.
    labBirimleri: { albuminKreatinin: 'mg/g', hemoglobin: 'g/dL', kreatinin: 'mg/dL', glukoz: 'mg/dL', kolesterol: 'mg/dL' },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      'doz-hesabi': { eksik: 'UNIT SAFETY. This pack measures body weight in pounds; the tool multiplies a dose stated per kilogram by the body weight. The kit converts a weight typed in pounds exactly, but a screen that shows the weight in pounds beside a dose per kilogram invites the very error the tool exists to prevent. Needed: a clinical decision on whether weight for dosing is entered in kilograms only in the United States, and a weight field in the kit that can be fixed to kilograms whatever the pack\'s unit.', kimden: KLINISYEN },
    },
    // THE C-REACTIVE PROTEIN FIELD OF DAS28 TAKES mg/L (the formula's unit). Laboratories here may report mg/dL
    // (the National Library of Medicine's page for patients states results in mg/dL:
    // medlineplus.gov/lab-tests/c-reactive-protein-crp-test, read 2026-10-09): the label says which unit the field
    // takes and how to get there. UNVERIFIED with a local clinical lead.
    degisen: { das28: { alanlar: { crp: 'C-reactive protein (in mg/L; multiply a value in mg/dL by 10)' } } },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED by anybody of the country. Read on 2026-10-09 at the plan's administrator:
    // a number is ten digits written NXX-NXX-XXXX (nanpa.com/about), and 555-0100 to 555-0199 are "fictitious,
    // non-working numbers" kept for entertainment and advertising (nanpa.com/numbering/555-line-numbers), so it is
    // issued to nobody. WRITTEN THE NATIONAL WAY, as a person here writes a number of their own country; it was
    // "+1 202 555 0123", the form for calling from abroad. A number typed with +1 is accepted all the same.
    telefonOrnegi: '202-555-0123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for the United States; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
