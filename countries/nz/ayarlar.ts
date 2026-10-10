/**
 * NOTYA-ULKE-EN-01 — New Zealand (`nz`, served at /nz): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in New Zealand spelling (en-NZ). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in New Zealand — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-NEW-ZEALAND.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOTYA-ULKE-DENETIM-NZ (2026-10-09): the settings marked "SOURCE-CHECKED" below were compared with an official
 * New Zealand source on that day by the localisation audit (its document, docs/COUNTRY-AUDIT-NEW-ZEALAND.md, is on
 * the branch audit/nz). A source check is a machine reading a public page. It is NOT a person of New Zealand
 * confirming the setting, and the mark above stands until one has.
 *
 * NOTYA-ULKE-UYGULA-NZ (2026-10-10): the decisions of the tools-and-specialties audit (docs/araclar-denetim/NZ.md,
 * nz-kararlar.json) applied to this pack: its own role list (NZ_ROLLER), who sees which tool (`gorenler`), the
 * country's numbers for the tools that take one (`parametreler`), and — in ./arayuz.ts with ./araclar/ — the tools
 * only this country has. A line marked "OPENED 2026-10-10" was read from its source on that day through a reading
 * tool that returns the text of a page; a clinician of New Zealand opens the source again before relying on it.
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { EnRolDegisimi } from '../_dil/en/klinik/roller'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value; what the law on the consent of minors means for this product's wording and for the
 * form a parent fills in is a legal question.
 * SOURCE-CHECKED: the Care of Children Act 2004, section 36, gives a consent to treatment by a child "of or over the
 * age of 16 years" the effect of an adult's. What applies below 16, and to which treatments, stays for a lawyer.
 */
export const NZ_VELI_YASI = 16

/**
 * Units a clinic in New Zealand records in: SI. Unverified with a local clinical lead (checklist C8, E3).
 * SOURCE-CHECKED: body weight in kilograms (the national data standard for cardiovascular risk assessment, which
 * records height in metres; the national medication charting standard doses per kilogram). Centimetres for height on
 * a clinic screen and °C for temperature were not found stated on an official page: for a local clinical lead.
 */
export const NZ_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

/**
 * THE ROLE LIST OF NEW ZEALAND: the shared forty, with thirteen roles only this country has. NO SHARED ROLE IS TAKEN
 * OUT, so an account stored under any of the forty keys still loads (./nz.test.ts holds that).
 *
 * NAMES. The nine doctor roles are vocational scopes of practice, written exactly as the Medical Council of New
 * Zealand's list writes them. OPENED 2026-10-10: Medical Council of New Zealand, "Types of vocational scope",
 * https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/
 * (36 scopes). The four allied professions are regulated under the Health Practitioners Competence Assurance Act;
 * the role is named as the PROFESSION, as the set names its five (the regulator's own wording for the regulated
 * activity is beside each). OPENED 2026-10-10: Ministry of Health, "Responsible authorities", last updated 26 January
 * 2026, https://www.health.govt.nz/regulation-legislation/health-practitioners/responsible-authorities
 *
 * WHICH SHARED ROLE EACH BEHAVES LIKE (`gibi`: its note template and its intake questions) IS A MACHINE'S CHOICE of
 * the nearest shared role. UNVERIFIED — FOR A LOCAL CLINICAL LEAD, role by role. Tools are never inherited: each
 * tool names its roles (`gorenler` below). Where the HEADING a patient would read above the borrowed questions names
 * another profession ("For your family doctor" for an occupational physician's patient), the role asks the same questions
 * under a heading of this country's own: ./klinik/hastaFormu.ts (server half; eleven of the thirteen roles).
 *
 * THREE PROFESSIONS THE AUDIT NAMES ARE NOT ADDED, BECAUSE THE KIT CANNOT ADDRESS THEM YET: the nurse practitioner,
 * the midwife and the optometrist. The nearest shared role of each is a DOCTOR's (general practice, obstetrics and
 * gynaecology, ophthalmology), and the kit's one opening for a professional who is not a doctor tells the model to
 * make no medical diagnosis and to write a referring doctor's diagnosis only in the field meant for it — a field a
 * doctor's template does not have, and an instruction that does not describe how these three professions practise
 * here. A role of a profession that is not a doctor's therefore behaves like another such profession, never like a
 * doctor's role (./nz.test.ts holds that). They wait on the kit: an opening of their own, and templates of their own
 * read by a local clinician. (The same decision was taken for the United States on 2026-10-10.) Whether the product should serve each added profession, and what a
 * profession that is not a doctor may read of a record, are the owner's and a lawyer's questions.
 */
export const NZ_ROLLER: EnRolDegisimi = {
  cikar: [],
  ekle: [
    // ── vocational scopes the shared set does not have (doctor roles) ──
    { anahtar: 'urgent-care-medicine', taraf: 'doktor', ad: 'Urgent care medicine', gibi: 'emergency-medicine' },
    { anahtar: 'rural-hospital-medicine', taraf: 'doktor', ad: 'Rural hospital medicine', gibi: 'family-medicine' },
    { anahtar: 'musculoskeletal-medicine', taraf: 'doktor', ad: 'Musculoskeletal medicine', gibi: 'rehabilitation-medicine' },
    { anahtar: 'occupational-medicine', taraf: 'doktor', ad: 'Occupational medicine', gibi: 'family-medicine' },
    { anahtar: 'pain-medicine', taraf: 'doktor', ad: 'Pain medicine', gibi: 'rehabilitation-medicine' },
    { anahtar: 'sexual-health-medicine', taraf: 'doktor', ad: 'Sexual health medicine', gibi: 'family-medicine' },
    { anahtar: 'family-planning-reproductive-health', taraf: 'doktor', ad: 'Family planning and reproductive health', gibi: 'obstetrics-gynaecology' },
    { anahtar: 'palliative-medicine', taraf: 'doktor', ad: 'Palliative medicine', gibi: 'internal-medicine' },
    { anahtar: 'oral-maxillofacial-surgery', taraf: 'doktor', ad: 'Oral and maxillofacial surgery', gibi: 'plastic-surgery' },
    // ── regulated professions the shared set does not have (clinic allied professions) ──
    // the regulator's wording: "Practice of podiatry" (Podiatrists Board)
    { anahtar: 'podiatry', taraf: 'klinik-muttefik', ad: 'Podiatrist', gibi: 'physiotherapy' },
    // "Osteopathy" (Osteopathic Council)
    { anahtar: 'osteopathy', taraf: 'klinik-muttefik', ad: 'Osteopath', gibi: 'physiotherapy' },
    // "Practice of chiropractic" (Chiropractic Board)
    { anahtar: 'chiropractic', taraf: 'klinik-muttefik', ad: 'Chiropractor', gibi: 'physiotherapy' },
    // "Psychotherapy services" (Psychotherapists Board)
    { anahtar: 'psychotherapy', taraf: 'klinik-muttefik', ad: 'Psychotherapist', gibi: 'clinical-psychology' },
  ],
}

const KLINISYEN = 'a clinical lead in New Zealand'

// ── NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"), in every country: the ESI
// triage tool, the report outline that prints the BI-RADS categories, and both kidney tools. Each stays a slot
// (`kapali` below) until its licence is granted or settled. The guard test
// lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if a pack switches one of them on. Evidence: the audits of the
// tools against national sources, docs/araclar-denetim/, "Second pass".
// THE DOSE CALCULATOR IS BACK ON (Kaan, 2026-10-10, later the same day: "Bring on all the tools ... We will test as
// we go"): its two faults were corrected in the kit (pull request #615: the volume is no longer rounded to 0.1 mL, a
// small volume carries a caution, and an amount is written by this pack's `dozYazimi`), and the guard list no longer
// holds it. ──
const EMIR_ESI = 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded.'
const EMIR_RAPOR = 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded.'
const EMIR_BOBREK = 'Off by the owner\'s order of 2026-10-10. The two faults the audits confirmed (a risk cell shown with no urine albumin result; limits applied after converting the unit) were corrected in the kit on 2026-10-10; the tool stays off because the licence of the KDIGO grid for commercial software is unsettled. Needed: the rights holder\'s terms, read and recorded by the owner.'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = `the owner, with the rights holder's written permission; then ${KLINISYEN}`

export const NZ_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-NZ',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Shown beside the box that unlocks recording.
    // The version stamped on every visit is `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // An optional free-text field, stored encrypted, never validated and never required. Whether a private clinic
    // records it in this product is open (for a lawyer: the rule on unique identifiers of the health privacy code).
    // SOURCE-CHECKED: the identifier is called the "NHI number" (National Health Index). It has seven characters, in
    // two forms that exist side by side: three letters, three digits and a check digit; and, issued from 1 July 2026,
    // three letters, two digits, a letter and a check letter. It is NOT a number of digits only.
    kimlikEtiketi: 'NHI number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    // SOURCE-CHECKED: day, month, year (the national medication charting standard: "day/month/year format").
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'New Zealand',
  // The word a senior doctor goes by here. SOURCE-CHECKED: the medical council describes vocational registration as
  // "specialist registration". Hospitals also say "consultant" and "senior medical officer": for a local clinical lead.
  kidemliHekim: 'specialist',
  // HOW EACH SPECIALTY IS NAMED IN NEW ZEALAND, where it differs from the set's base name: as the Medical Council of
  // New Zealand's list of vocational scopes writes it (OPENED 2026-10-10, the address beside NZ_ROLLER above).
  //   "General practice", "Internal medicine", "Otolaryngology, head and neck surgery", "Plastic and reconstructive
  //   surgery", "Diagnostic and interventional radiology", "Cardiothoracic surgery" and "Vascular surgery" are scopes
  //   of that list, written as it writes them. "Medical oncology" is not a scope: the list names it as an area inside
  //   the scope "Internal medicine" (its "Radiation oncology" is a separate scope, which this pack does not have).
  //   TWO RENAMES ARE MORE THAN A NAME (the audit's decision): New Zealand joins heart and chest surgery in ONE scope
  //   and has vessel surgery as another. The shared role "thoracic-surgery" is therefore "Cardiothoracic surgery"
  //   here and also sees the heart-operation checklist (`gorenler`); the shared role "cardiovascular-surgery" is
  //   "Vascular surgery". An account stored under either key keeps its key. FOR A LOCAL CLINICAL LEAD.
  //   The dermatology clinic role is the same scope as the doctor role, and is named as the scope ("Dermatology").
  // UNVERIFIED, FOR A LOCAL CLINICAL LEAD AND A LAWYER: "Cosmetic medicine", "Cosmetic surgery" and "Hair
  // transplantation" are clinic types, not vocational scopes, and none may ever be worded as a specialty; eight roles
  // of the set (endocrinology, cardiology …) are areas of "Internal medicine", not scopes of their own.
  rolAdlari: {
    'family-medicine': 'General practice',
    'internal-medicine': 'Internal medicine',
    'thoracic-surgery': 'Cardiothoracic surgery',
    'cardiovascular-surgery': 'Vascular surgery',
    otolaryngology: 'Otolaryngology, head and neck surgery',
    oncology: 'Medical oncology',
    'plastic-surgery': 'Plastic and reconstructive surgery',
    radiology: 'Diagnostic and interventional radiology',
    'aesthetic-medicine': 'Cosmetic medicine',
    'clinic-dermatology': 'Dermatology',
  },
  roller: NZ_ROLLER,
  veliYasi: NZ_VELI_YASI,
  birimler: NZ_BIRIMLER,
  surum: 'nz-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-NZ': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from New Zealand (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // THE UNIT LABORATORIES IN NEW ZEALAND REPORT EACH VALUE IN: SI units (checklist C8). The kit converts from the unit
    // stated here with fixed factors; a wrong unit here is a wrong result. UNVERIFIED with a local laboratory.
    //   OPENED 2026-10-10 — prostate-specific antigen in µg/L: Ministry of Health, "Prostate Cancer Management and
    //     Referral Guidance" (September 2015), Table 1, whose column of abnormal levels is in µg/L,
    //     https://www.health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf
    //   OPENED 2026-10-10 — HbA1c in mmol/mol: Ministry of Health, "Diabetic Retinal Screening, Grading, Monitoring and
    //     Referral Guidance" (March 2016), which writes every HbA1c value in mmol/mol (for example a limit of 64 mmol/mol),
    //     https://www.tewhatuora.govt.nz/assets/Publications/Diabetes/diabetic-retinal-screening-grading-monitoring-referral-guidance-mar16.pdf
    //     No switched-on tool reads HbA1c today; the unit is stated so that the day one does, it is this one.
    //   AS THE AUDITS READ THEM (not opened again on 2026-10-10): creatinine in µmol/L, cholesterol in mmol/L and the
    //     urine albumin-to-creatinine ratio in mg/mmol (the national data standard for cardiovascular risk
    //     assessment; bpacnz); haemoglobin in g/L (a Health New Zealand laboratory's reference intervals);
    //     C-reactive protein in mg/L (Pharmac's forms). Glucose in mmol/L was found stated on no official page.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', hba1c: 'mmol/mol', crp: 'mg/L', psa: 'ug/L' },
    // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). The dose calculator is
    // switched on in this pack, so this setting is on a doctor's screen. OPENED 2026-10-10: Health Quality & Safety
    // Commission, National Medication Safety Expert Advisory Group, poster "Not to use: error-prone abbreviations,
    // symbols and dose designations" (May 2012),
    // https://www.hqsc.govt.nz/assets/Medication-Safety/Alerts-PR/Poster-error-prone-abbreviations-not-to-use.pdf
    // — "never write a zero after a decimal point". UNVERIFIED by a local clinical lead.
    dozYazimi: { sondaSifir: false },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      // SOURCE-CHECKED: emergency departments here use the Australasian triage scale (Health New Zealand's public page
      // on emergency department triage), not the Emergency Severity Index. The audit's verdict for this tool is
      // "remove": it stays off here whatever becomes of its licence.
      'esi-triyaj': { eksik: 'Emergency departments in New Zealand use the Australasian triage scale, with five categories; the Emergency Severity Index is a different scale, so a tool that records an ESI level is kept off here. Needed: the decision of a local emergency physician whether a triage record belongs in this product at all, and, if it does, a tool for the scale used here with its content supplied and signed locally. ' + EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: 'Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol, and the referral list read for New Zealand is another than the one the tool prints: which referral prompts a doctor here should see is for a local nephrologist to say. ' + EMIR_BOBREK, kimden: HAK_SAHIBI },
      'kdigo-serit': { eksik: 'The same as the internal-medicine kidney tool: laboratories here report the urine albumin-to-creatinine ratio in mg/mmol. ' + EMIR_BOBREK, kimden: HAK_SAHIBI },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in New Zealand use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole. ' + EMIR_RAPOR, kimden: HAK_SAHIBI },
    },
    // UNIT NAMES ONLY THIS PACK NEEDS: the units of its own tools (./araclar/).
    birimAdlari: { 'kg/m2': 'kg/m²', yil: 'years' },
    // ── WORDS OF A SHARED TOOL THIS COUNTRY WRITES DIFFERENTLY. MACHINE-WRITTEN, for a local clinician to read. ──
    degisen: {
      // The caution names this country's own number of days (`parametreler` below), and the description says what the
      // national guidance does with two results. The guidance: the address beside `labBirimleri` above.
      'psa-hizi': {
        aciklama: 'From two measurements and their dates, the change in a year is worked out. No threshold and no grade is shown. The prostate cancer guidance of the Ministry of Health (2015) states no rate of change: it asks for a repeat test after 6 to 12 weeks to confirm a raised result.',
        uyarilar: { kisa_aralik: 'The measurements are less than 6 weeks apart: read the result with caution' },
      },
      // The national growth charts predict adult height another way; the tool says so and shows no range (below).
      'hedef-boy': {
        aciklama: 'From the height of the father and of the mother, an estimate of the child\'s adult height is worked out (the mid-parental method). It is an estimate, not a promise, and no range is shown around it. The New Zealand–WHO growth charts predict adult height another way, from the child\'s own height centile: this tool does not do that.',
      },
    },
    // ── THE COUNTRY'S NUMBERS for the shared tools that take one (docs/araclar-denetim/DUZELTMELER.md). ──
    parametreler: {
      // PSA: THE CAUTION ABOUT TWO RESULTS CLOSE TOGETHER appears when they are FEWER THAN 42 DAYS apart (the kit's own
      // number is 90). 42 days = 6 weeks, the earliest repeat the national guidance asks for: "men should always have
      // a repeat PSA test after 6–12 weeks" — so a repeat taken 6 to 12 weeks (42 to 84 days) after the first no
      // longer raises the caution, and one taken sooner than the guidance asks still does. OPENED 2026-10-10: Ministry
      // of Health, "Prostate Cancer Management and Referral Guidance" (September 2015), Note 2.2 (the address beside
      // `labBirimleri` above). The guidance states NO rate of change at all. FOR A LOCAL UROLOGIST.
      'psa-hizi': { kisa_aralik_gun: 42 },
      // EXPECTED HEIGHT: NO RANGE IS STATED (`aralik_cm` is left out on purpose), so the tool shows the mid-parental
      // figure and no range. OPENED 2026-10-10: Ministry of Health, New Zealand–WHO Growth Charts, Fact Sheet 6 (July
      // 2010), https://www.tewhatuora.govt.nz/assets/For-the-health-sector/Specific-life-stage/child-health/Growth-Charts-v2/factsheet-6-growth-charts-well-child.pdf
      // — it predicts adult height from the child's own recent height centile and gives a spread for THAT prediction
      // (6 cm either side for boys, with 80 per cent probability); it names no parents' heights and no
      // mid-parental method. That figure belongs to another method and is NOT put here.
      //
      // NOTHING IS STATED, AND WHY, for three more shared tools (each then behaves as the kit's own, sourced, default):
      //   rtp-basamak    NO STEPS. ACC's national concussion guideline has them, but ACC's terms (OPENED 2026-10-10,
      //                  https://www.acc.co.nz/terms-of-use/disclaimer-copyright, last published 14 March 2024) keep
      //                  commercial use and republishing for ACC's permission. The tool shows the days since the injury.
      //   odyometri-pta  NO GRADE TABLE, FREQUENCIES OR ASYMMETRY RULE of New Zealand: the audit and one more search on
      //                  2026-10-10 found no table of a New Zealand body. The tool shows the kit's cited table.
      //   pasi, easi, scorad, das28   NO BANDS of a New Zealand body: Pharmac's figures are funding criteria, not
      //                  severity bands, and the one article read (bpacnz, 2025) gives no number for mild eczema.
    },
    // ── WHO SEES A SHARED TOOL HERE, where it differs from the set's list (the audit's decisions: nz-kararlar.json,
    // `specialties[].tools` and `clinicSpecialties[].tools`, existing tools only). A tool that is not named here is
    // seen by the roles the set names for it. MACHINE-APPLIED; FOR A LOCAL CLINICAL LEAD. ──
    gorenler: {
      'kritik-yol': ['emergency-medicine', 'urgent-care-medicine', 'rural-hospital-medicine'],
      'postop-agri': ['anaesthesia', 'pain-medicine'],
      'yara-dren-izlem': ['paediatric-surgery', 'general-surgery', 'oral-maxillofacial-surgery'],
      'genel-preop': ['general-surgery', 'oral-maxillofacial-surgery'],
      // the dermatology clinic role is the same scope as the doctor role: it sees the same four tools
      pasi: ['dermatology', 'clinic-dermatology'],
      easi: ['dermatology', 'clinic-dermatology'],
      scorad: ['dermatology', 'clinic-dermatology'],
      'yama-okuma': ['dermatology', 'clinic-dermatology'],
      // most courses are prescribed in general practice and urgent care
      'antibiyotik-sure': ['family-medicine', 'infectious-diseases', 'urgent-care-medicine'],
      'inhaler-teknik': ['family-medicine', 'respiratory-medicine', 'paediatrics'],
      // heart surgery belongs to "Cardiothoracic surgery" here (the shared role thoracic-surgery); the checklist
      // names heart AND vascular operations, so "Vascular surgery" keeps it
      'kalp-damar-preop': ['thoracic-surgery', 'cardiovascular-surgery'],
      'odyometri-pta': ['otolaryngology', 'audiology'],
      'kirik-alci-takip': ['orthopaedics', 'urgent-care-medicine'],
      'vas-fonksiyon': ['orthopaedics', 'musculoskeletal-medicine', 'physiotherapy', 'osteopathy', 'chiropractic'],
      'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
      'sakatlik-gunlugu': ['sports-medicine', 'musculoskeletal-medicine', 'physiotherapy'],
      // children here are mostly seen outside paediatrics
      'doz-hesabi': ['emergency-medicine', 'family-medicine', 'paediatric-surgery', 'paediatrics', 'urgent-care-medicine', 'rural-hospital-medicine'],
    },
    // THE LICENCE STATE of the two tools whose rights holder requires permission (docs/COUNTRY-PACK-HOWTO.md, "Country-only
    // tools and roles", point 5): "izin-gerekli" = permission needed. While it stands, the pack check refuses to switch
    // either tool on, and the screen and the server refuse it a second time.
    // NO OTHER SHARED TOOL'S LICENCE IS STATED: "free" is written only where the rights holder's own notice says so and
    // was read (the three tools of this country's own state theirs: ./araclar/araclar.ts). What the audit found for
    // the others is in docs/araclar-denetim/NZ.md, "Licence terms, as read".
    lisanslar: {
      'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
      'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
    },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. A SHAPE, NOT A NUMBER: this job knows of no range New Zealand reserves for
    // fiction with certainty, so the example shows the form of a mobile number with X in place of digits. It cannot be
    // dialled and can be nobody's. A number from a reserved range, if a local source names one, may replace it.
    // The audit of 2026-10-09 found no official page that reserves a range for fiction. The spacing follows the
    // government's own example of an international number ("+64 4 456 2390").
    telefonOrnegi: '+64 2X XXX XXXX',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    // SOURCE-CHECKED: the government's writing guidance uses "$" alone where only New Zealand dollars are meant.
    // Whether an amount must be shown with or without goods and services tax is for a lawyer.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for New Zealand; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
