/**
 * NOTYA-ULKE-EN-01 — Canada (`ca`, served at /ca): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in Canadian spelling (en-CA). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in Canada — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge, or — where a source is cited beside it — what that source said on the day it was read. What each waits
 * on is listed in docs/COUNTRY-PACK-CANADA.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * ENGLISH ONLY. FRENCH IS ABSENT — WAITING ON KAAN. No screen, no visit note, no patient text and no instruction to
 * the model is written in French, and speech recognition listens for English only. Whether the product may be offered
 * in Quebec, or anywhere in Canada to French-speaking patients, without French is a legal and a commercial question
 * (docs/COUNTRY-PACK-CANADA.md); a French set would be a second language set (countries/_dil/fr/), not a change here.
 *
 * NOTYA-ULKE-UYGULA-CA (2026-10-10) — THE AUDIT'S DECISIONS FOR THIS COUNTRY, APPLIED HERE AND NOWHERE ELSE
 * (docs/araclar-denetim/CA.md and ca-kararlar.json; the second pass supersedes the first): its own role list
 * (./roller.ts), who sees which tool (`gorenler`), what a national source states for the shared tools that take a
 * country's (`uyarlama`, `degisen`), the licence state that was read (`lisanslar`), and two tools of its own
 * (./araclar/), SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF by the owner's order of the same day. Every statement
 * below that is new stands beside the source it was read from on that day. The fixes of the earlier localisation
 * audit (branch audit/ca, 2026-10-09) are folded in and marked "AUDIT 2026-10-09".
 *
 * NO PROVINCE SETTING EXISTS. Where a rule or a number is provincial, nothing is stated here and the tool shows its
 * result without it; each such case is named where it would have stood.
 *
 * The pack's light file (./index.ts) does not read this file any more: what it needs is in ./temel.ts and
 * ./roller.ts, which import types only. This file brings the arithmetic of the country's own tools.
 */
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { enRolSatirlari } from '../_dil/en/klinik/roller'
import { caKendiAraclari } from './araclar/metinler'
import { CA_TANIMLAR } from './araclar/tanimlar'
import { CA_ROLLER, CA_YENIDEN_ADLANANLAR } from './roller'
import { CA_BIRIMLER, CA_VELI_YASI } from './temel'

export { CA_BIRIMLER, CA_VELI_YASI } from './temel'

/** The doctor roles of this country (every role that is not an allied profession), from its own role list. */
export const CA_HEKIMLER: readonly string[] = hekimRolleri(enRolSatirlari(CA_ROLLER))

const KLINISYEN = 'a clinical lead in Canada'

// ── NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"), in every country: the ESI
// triage tool, the report outline that prints the BI-RADS categories, and both kidney tools. Each stays a slot
// (`kapali` below) until its fault is corrected in the kit or its licence is granted. The guard test
// lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if a pack switches one of them on. Evidence: the audits of the
// tools against national sources, docs/araclar-denetim/, "Second pass".
// THE DOSE CALCULATOR WAS THE FIFTH AND IS BACK ON HERE, by the owner's order later the same day ("Bring on all the
// tools built for the new 6 countries now. We will test as we go."). Its two faults were corrected in the kit (pull
// request #615: the volume is no longer rounded to 0.1 mL, a volume below 1 mL carries a caution, and no zero is
// written after the last figure: `dozYazimi` below), and the kit's guard list no longer holds it. ──
const EMIR_ESI = 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded.'
const EMIR_RAPOR = 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded.'
const EMIR_BOBREK = 'SAFETY, off by the owner\'s order of 2026-10-10: the tool shows "Low risk (green cell)" when no urine albumin result was typed, and the internal-medicine tool labels its referral flags as KDIGO criteria that the guideline does not state that way. Needed: both corrected in the kit (NOTYA-ULKE-ARAC-01b).'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = `the owner, with the rights holder's written permission; then ${KLINISYEN}`

export const CA_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-CA',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Federal and provincial rules are open.
    // Shown beside the box that unlocks recording. The version stamped on every visit is `surum` below: change both
    // together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // An optional free-text field, stored encrypted, never validated and never required.
    // AUDIT 2026-10-09 (the localisation audit, branch audit/ca): was "Provincial health card number". The three
    // territories issue health cards too, and the Government of Canada's own word is "health card" for every province
    // and territory, so the label no longer says "provincial". The NUMBER's own name and format still differ by province
    // and territory (unverified per province), and whether a product may ask for it at all is FOR A LAWYER (Ontario
    // restricts who may collect a health number). NEVER a Social Insurance Number: no screen asks for one.
    kimlikEtiketi: 'Health card number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'YYYY-MM-DD',
  },
  ulkeAdi: 'Canada',
  // UNVERIFIED: the word a senior hospital doctor goes by here.
  kidemliHekim: 'staff physician',
  // How each specialty is named in Canada, where it differs from the set's base name. The five names below are the
  // audit's "keep": each matches the Royal College of Physicians and Surgeons of Canada's list of disciplines, read
  // again on 2026-10-10, in the set's sentence case. THE SEVEN RENAMES of the audit follow them, each exactly as the
  // body cited writes it (./roller.ts → CA_YENIDEN_ADLANANLAR, where the source of each stands): among them the two
  // fixes of the localisation audit (AUDIT 2026-10-09: "General internal medicine" is a SUBSPECIALTY there, the
  // specialty is Internal Medicine; otolaryngology is written as the College writes it). None has been read by a
  // clinician of the country (checklist C1).
  rolAdlari: {
    anaesthesia: 'Anesthesiology',
    endocrinology: 'Endocrinology and metabolism',
    'respiratory-medicine': 'Respirology',
    radiology: 'Diagnostic radiology',
    'rehabilitation-medicine': 'Physical medicine and rehabilitation',
    ...CA_YENIDEN_ADLANANLAR,
  },
  // THE ROLE LIST OF THIS COUNTRY: the shared forty, with six disciplines and one profession of its own, each saying
  // which shared role it behaves like (./roller.ts). Nothing was taken out.
  roller: CA_ROLLER,
  veliYasi: CA_VELI_YASI,
  birimler: CA_BIRIMLER,
  surum: 'ca-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-CA': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from Canada (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in Canada report each value in: SI units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    // PROVINCIAL, AND READ FOR ONE PROVINCE OR ONE BODY EACH (docs/araclar-denetim/CA.md, second pass): haemoglobin
    // in g/L (British Columbia), PSA and C-reactive protein (Alberta), the urine albumin ratio in mg/mmol (Ontario),
    // lipids in mmol/L (the cardiovascular society's worksheet). NOTHING NEW WAS STATED BY THE JOB OF 2026-10-10: a
    // switched-on tool that reads a value needs a unit, so the earlier starting values stand, still unverified.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' },
    // C-REACTIVE PROTEIN in mg/L and PROSTATE-SPECIFIC ANTIGEN in µg/L (NOTYA-ULKE-ARAC-DUZELTME-01: each is a
    // statement of the pack). One province's laboratory each, as the country's audit read them.
    // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). Source read 2026-10-10: ISMP
    // Canada, "Do Not Use: Dangerous Abbreviations, Symbols and Dose Designations" (2006, reaffirmed 2018),
    // https://www.ismp-canada.org/download/ISMPC_List_of_Dangerous_Abbreviations.pdf — "Never use a zero by itself
    // after a decimal point. Use "X mg"." UNVERIFIED by a local clinical lead.
    // NO ROUNDING RULE IS STATED: the audit found one province's record system with a rule (Alberta) and no national
    // one, so the calculator shows what the arithmetic gives, says so, and cautions below 1 mL.
    dozYazimi: { sondaSifir: false },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      // THE AUDIT'S ONE "REMOVE": another country's triage scale. It stays off; emergency departments here use another
      // scale, whose owner requires permission for a product (not built: ./araclar/, the report of 2026-10-10).
      'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in Canada use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say. ' + EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'rapor-taslagi': { eksik: EMIR_RAPOR, kimden: HAK_SAHIBI },
    },
    // THE LICENCE STATE of the tools and placeholders whose terms were READ (docs/COUNTRY-PACK-HOWTO.md, "Country-only
    // tools and roles", point 5). "izin-gerekli" = permission needed: while it stands, the pack check refuses to switch
    // the tool on, and the screen and the server refuse it a second time. "serbest" = free, stated only where the
    // rights holder's own notice says so and that notice was read. EVERY OTHER TOOL AND PLACEHOLDER OF THE SET STATES
    // NOTHING (the country is still on countries/lisans-borcu.json): the report of 2026-10-10 lists them.
    lisanslar: {
      'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
      'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
      // FREE BY THE NOTICE PRINTED ON THE FORMS THEMSELVES, read 2026-10-10 on a copy of both forms
      // (https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf): "No permission required to
      // reproduce, translate, display or distribute", under the line that names the developers and an educational grant
      // from Pfizer Inc. The owner's own site refuses automated readers: A PERSON OPENS IT ONCE.
      // THE PLACEHOLDER STAYS A PLACEHOLDER. The forms read print no scoring table, so nothing was built from them. And
      // the Canadian Task Force on Preventive Health Care recommends against screening all adults for depression with a
      // questionnaire (the audit, 2.3): a tool built here is worded as one the doctor chooses to use for a patient
      // they are already concerned about, never as recommended screening.
      'phq9-gad7': { durum: 'serbest', hakSahibi: 'the developers named on the forms, Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues (educational grant from Pfizer Inc., which the audit read as the copyright holder)', kaynak: 'the permission line printed on the PHQ-9 and GAD-7 forms (https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf): read 2026-10-10' },
    },
    // ── NOTYA-ULKE-UYGULA-CA: WHO SEES A TOOL OF THE SET HERE, where the audit's decision differs from the set's list
    // (ca-kararlar.json → `visibilityChangesProposed`, and specialties[].toolsByKind.existing; existing tools only).
    // Every list names the set's own role first, then the roles the audit adds. Each widening is the audit's
    // recommendation for a local lead, not a fact from a source. ──
    gorenler: {
      // dose arithmetic by body weight (back on, see above): also family medicine and emergency medicine, for the children they see
      'doz-hesabi': ['paediatrics', 'family-medicine', 'emergency-medicine'],
      // antithrombotic treatment, review dates: also the other half of the split specialty, family medicine, internal medicine, cardiology and hematology
      'antikoagulan-vadeleri': ['cardiovascular-surgery', 'vascular-surgery', 'family-medicine', 'internal-medicine', 'cardiology', 'hematology'],
      // the two halves of the specialty this country split share its two lists
      'kalp-damar-preop': ['cardiovascular-surgery', 'vascular-surgery'],
      'greft-yara-izlem': ['cardiovascular-surgery', 'vascular-surgery'],
      // the hearing average: also the audiologist
      'odyometri-pta': ['otolaryngology', 'audiology'],
      // the four dermatology tools: also the dermatologist of a clinic (one specialty, two headings: ./roller.ts)
      pasi: ['dermatology', 'clinic-dermatology'],
      easi: ['dermatology', 'clinic-dermatology'],
      scorad: ['dermatology', 'clinic-dermatology'],
      'yama-okuma': ['dermatology', 'clinic-dermatology'],
      // wound, graft and flap follow-up: also the cosmetic-surgery clinic doctor
      'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
      // post-operative pain follow-up: also pain medicine
      'postop-agri': ['anaesthesia', 'pain-medicine'],
    },
    // NOT APPLIED, AND WHY. The audit also changes who would see 17 PLACEHOLDERS (the PHQ-9 with GAD-7, the kidney
    // tool, the family-medicine lists and others) and makes five base placeholders doctor-only. A placeholder is on no
    // screen, and the language set gives a country no way to restate a placeholder's roles: nothing a doctor sees
    // depends on it. "My templates" and "Consultations" of the core set are features this pack does not have (the
    // set has no texts for them), and a tool that is off today is not switched on by this job.
    //
    // ── WHAT A NATIONAL SOURCE STATES, for the shared tools that take a country's. Each was read on 2026-10-10. ──
    uyarlama: {
      // HEARING: THE FREQUENCIES AVERAGED AND THE GRADE TABLE, stated as this country's own. Limit for limit they are
      // what the kit shows by itself today, so nothing changes on a screen; stated here, they are Canada's with their
      // Canadian sources, and a later change of the kit's own does not move them.
      //   [CHMS]  Statistics Canada, Health Fact Sheets, "Hearing loss of Canadians, 2012 to 2015" (Canadian Health
      //           Measures Survey), https://www150.statcan.gc.ca/n1/pub/82-625-x/2016001/article/14658-eng.htm — a
      //           speech-frequency pure-tone average over 0.5, 1, 2 and 4 kHz; an average "greater than 15 decibels
      //           (dB)" is at least slight hearing loss, for adults (20 to 79) and for children and youth (6 to 19);
      //           the page says its ranges are those of the American speech and hearing association, which are the
      //           ranges the kit cites.
      //   [CAA]   fact sheet on the Canadian Academy of Audiology's site, "Degree of hearing loss" (no date, no author),
      //           https://canadianaudiology.ca/wp-content/uploads/fact-sheets/DegreeOfLoss.pdf — seven degrees: 0 to 15,
      //           16 to 25, 26 to 40, 41 to 55, 56 to 70, 71 to 90, 91 dB and above. WRITTEN ABOUT CHILDREN, and it names
      //           the second degree "Minimal Hearing Loss" where [CHMS] says "slight": the names on the screen stay the
      //           set's (`degisen` below). FOR A CANADIAN AUDIOLOGIST: the table for adults, and the word.
      // An average between two printed ranges (15.5 dB) is in the higher grade, as in the kit.
      // NOT STATED, so the kit's own stands: THE RULE FOR A DIFFERENCE BETWEEN THE EARS (more than 15 dB, from another
      // country's academy). No Canadian rule was found by the audit or by one more search on 2026-10-10.
      'odyometri-pta': {
        alanlar: { frekans: ['e05', 'e1', 'e2', 'e4'] },
        bantlar: { sayi: 'pta', satirlar: [{ ust: 15, dahil: true, bant: 'normal' }, { ust: 25, dahil: true, bant: 'hafifce' }, { ust: 40, dahil: true, bant: 'hafif' }, { ust: 55, dahil: true, bant: 'orta' }, { ust: 70, dahil: true, bant: 'orta_ileri' }, { ust: 90, dahil: true, bant: 'ileri' }, { ust: null, bant: 'cok_ileri' }] },
      },
    },
    degisen: {
      // THE NAMES OF THE HEARING GRADES (a country that states its own bands names them itself): the set's words.
      'odyometri-pta': { bantlar: { normal: 'Normal (up to 15 dB)', hafifce: 'Slight hearing loss (16 to 25 dB)', hafif: 'Mild hearing loss (26 to 40 dB)', orta: 'Moderate hearing loss (41 to 55 dB)', orta_ileri: 'Moderately severe hearing loss (56 to 70 dB)', ileri: 'Severe hearing loss (71 to 90 dB)', cok_ileri: 'Profound hearing loss (above 90 dB)' } },
      // PSA, THE LINE UNDER THE RESULT (the audit: "one line under the result, which this country's pack can add by
      // itself"). Canadian Urological Association, "UPDATE – 2022 Canadian Urological Association recommendations on
      // prostate cancer screening and early diagnosis", Can Urol Assoc J. 2022;16(4):E184-96,
      // https://cuaj.ca/index.php/journal/article/download/7851/5304/40922 — "The CUA does not recommend using PSAV
      // alone for clinical decision-making in men undergoing routine screening". The Canadian Task Force on Preventive
      // Health Care recommends against PSA screening (the audit): the tool prompts no screening and shows no threshold.
      'psa-hizi': { not: 'The Canadian Urological Association does not recommend using the rate of change alone for decisions in men having routine screening. A decision-support tool: diagnosis and treatment are the doctor\'s.' },
      // TWO ITEMS OF TWO PRE-OPERATIVE CHECKLISTS (the audit: both lists counted routine tests as items to complete).
      // Choosing Wisely Canada, Anesthesiology (Canadian Anesthesiologists' Society; last updated September 2025),
      // https://choosingwiselycanada.org/?p=1518 — do not order baseline laboratory studies, or a baseline chest X-ray,
      // for patients without symptoms before low-risk surgery (the list's items 1 and 3, in this file's words). The
      // items now count as done where nothing was indicated. FOR A CANADIAN SURGEON OR ANESTHESIOLOGIST.
      'cocuk-prepost-op': { alanlar: { laboratuvar: 'Pre-operative laboratory tests done, or none indicated', goruntu: 'Pre-operative imaging and its report seen, or none indicated' } },
      'genel-preop': { alanlar: { laboratuvar: 'Pre-operative laboratory tests done, or none indicated', goruntu: 'Pre-operative imaging and its report seen, or none indicated' } },
    },
    // NOT STATED, EACH BECAUSE NO NATIONAL SOURCE OPENED ON 2026-10-10 STATES IT (the tool then shows its result without it):
    //   RETURN TO SPORT, THE STEPS. Parachute, Return-to-Sport Strategy of the Canadian Guideline on Concussion in Sport,
    //     2nd edition (2024), https://pedsconcussion.com/wp-content/uploads/2024/03/Parachute-Return-to-Sport-and-School-Protocols-2024.pdf:
    //     steps 1, 2A, 2B and 3, then medical clearance, then 4, 5 and 6, at least 24 hours at each step. It states NO
    //     day counted from the injury for any step, and the kit's table holds only "the earliest day after the injury";
    //     it cannot hold the clearance either. And the terms for a product are unsettled: the guideline's page says it
    //     is "free to download and use" and nothing on adaptation or commercial use; the terms page it links to could not
    //     be opened (the reading tool refused the address; two searches did not find it). No table: the tool shows the
    //     days since the injury.
    //   EXPECTED HEIGHT, THE RANGE EITHER SIDE. No Canadian source states one (the audit: five searches; one more on
    //     2026-10-10). The tool shows the expected height alone.
    //   PSA, THE DAYS OF ITS CAUTION. The urologists' recommendations read above state no interval between two values
    //     for a rate of change. The kit's own 90 days stand (unsourced, as the kit says). FOR A CANADIAN UROLOGIST: keep
    //     it, move it, or switch it off.
    //   PASI, EASI, SCORAD, DAS28: BANDS. Canada's drug agency defines no severity by a PASI number and none by an EASI
    //     number (the audit, second pass); its two documents and the rheumatologists' 2012 table print the DAS28
    //     boundary at 3.2 differently, and the audit's decision is to change nothing. PASI shows its score and no
    //     severity word; EASI, SCORAD and DAS28 keep the published bands of the kit.
    //   KIDNEY REFERRAL, VACCINATION SCHEDULES, LABORATORY LIMITS: provincial; nothing stated; the tools that would read
    //     them are placeholders or off.
    //
    // UNIT NAMES THIS COUNTRY WRITES ITS OWN WAY.
    //   PSA: the urologists' recommendations (above) write ng/mL; a provincial laboratory reports µg/L (Alberta, the
    //   audit). The two are the same amount (a change of prefix, factor 1), so the label names both and no province's
    //   form is chosen for the country.
    //   ft: the unit of the country's own converter.
    birimAdlari: { 'ug/L': 'µg/L (= ng/mL)', 'ug/L/yil': 'µg/L (= ng/mL) per year', ft: 'ft' },
    // ── TOOLS ONLY THIS COUNTRY HAS: TWO, BOTH SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF (./araclar/; the list:
    // ./araclar/onayBekleyen.ts; the owner's order of 2026-10-10). The pack carries the arithmetic of each (`tanimlar`)
    // and its words, roles and licence (`araclar`).
    ek: {
      tanimlar: CA_TANIMLAR,
      araclar: caKendiAraclari({ hekimler: CA_HEKIMLER }),
    },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. From the numbers the North American numbering plan sets aside for fiction
    // (555-0100 to 555-0199 in every area code): it is not issued to anybody. Not checked against the plan's current
    // rules by anybody of the country.
    // AUDIT 2026-10-09: written as a number is written in Canada, area code and digit groups joined by hyphens (the
    // federal Translation Bureau's rule, as the localisation audit read it); it was in the international form
    // "+1 613 555 0123". The form accepts both.
    telefonOrnegi: '613-555-0123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for Canada; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
