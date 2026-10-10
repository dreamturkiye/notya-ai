/**
 * NOTYA-ULKE-EN-01 — Australia (`au`, served at /au): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in Australian spelling (en-AU). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) read this. The pack's light settings file
 * (./index.ts) reads only ./temel.ts and ./klinik/rolListesi.ts, so that it stays plain data.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in Australia — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Where a line names a source, a machine
 * opened that page on the date given and nobody of the country has read what it took from it. What each waits on is
 * listed in docs/COUNTRY-PACK-AUSTRALIA.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOTYA-ULKE-UYGULA-AU (2026-10-10) — the decisions of the tools audit for Australia, applied to this pack alone
 * (docs/araclar-denetim/AU.md, docs/araclar-denetim/au-kararlar.json), with the fixes of the localisation audit of
 * 2026-10-09 (branch audit/au) folded in:
 *   ROLES       a role list of Australia's own (./klinik/rolListesi.ts, ./klinik/roller.ts); names in the wording of
 *               the Medical Board of Australia's list
 *   WHO SEES    `araclar.gorenler`: which role sees which tool of the shared set here
 *   NUMBERS     `araclar.parametreler`: the range of the expected height; the PSA caution
 *   UNITS       `araclar.labBirimleri`, each with the page it was read on
 *   OWN TOOLS   `araclar.ek`: the tools only Australia has (./araclar/)
 */
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { enRolSatirlari } from '../_dil/en/klinik/roller'
import { auEkAraclar } from './araclar/metinler'
import { AU_TANIMLAR } from './araclar/tanimlar'
import { AU_ROLLER } from './klinik/roller'
import { AU_BIRIMLER, AU_VELI_YASI } from './temel'

export { AU_BIRIMLER, AU_VELI_YASI } from './temel'

const KLINISYEN = 'a clinical lead in Australia'

// ── NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"), in every country: the ESI
// triage tool, the report outline that prints the BI-RADS categories, and both kidney tools. Each stays a slot
// (`kapali` below) until its licence is granted or settled. The guard test
// lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if a pack switches one of them on. Evidence: the audits of the
// tools against national sources, docs/araclar-denetim/, "Second pass".
// THE DOSE CALCULATOR IS ON AGAIN since the owner's later order of the same day ("Bring on all the tools ... We will
// test as we go"): its two faults were corrected in the kit (docs/araclar-denetim/DUZELTMELER.md, fault 1) and the
// guard list no longer holds it. ──
const EMIR_ESI = 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded.'
const EMIR_RAPOR = 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded.'
const EMIR_BOBREK = 'Off by the owner\'s order of 2026-10-10. The faults found in the tool (a risk colour shown with no urine albumin result; referral flags the guideline does not state that way; limits compared after converting the unit) were corrected in the kit the same day; the tool stays off because the licence of the risk grid is unsettled and no clinician has read it. Needed: the rights holder\'s terms, recorded, and a nephrologist\'s reading.'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = `the owner, with the rights holder's written permission; then ${KLINISYEN}`

// ── WHO SEES A TOOL: the roles of this pack, worked out from its own role list so that a role added later is not forgotten. ──
const SATIRLAR = enRolSatirlari(AU_ROLLER)
/** Roles whose patients are children: no tool for adults is given to them. */
const COCUK_ROLLERI: readonly string[] = ['paediatrics', 'paediatric-surgery']
/** "Every doctor role that treats adults" (the audit's core set): every doctor and clinic-doctor role but the two whose patients are children. */
const YETISKIN_HEKIMLERI = hekimRolleri(SATIRLAR).filter((r) => !COCUK_ROLLERI.includes(r))

export const AU_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-AU',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Recording is governed by state and territory
    // law, which differs. Shown beside the box that unlocks recording. The version stamped on every visit is `surum`
    // below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // THE LABEL is the name of the national data element ("Medicare card number", AIHW METEOR 270101, N(11); read for
    // the localisation audit of 2026-10-09, branch audit/au, docs/COUNTRY-AUDIT-AUSTRALIA.md, A12). One card may list
    // several people, so the number printed on a card is not, alone, one person. It is a government related
    // identifier (Privacy Act 1988, APP 9: an organisation must not adopt one as its own identifier of a person).
    // FOR A LAWYER: whether this product may hold it at all. An optional free-text field, stored encrypted, never
    // validated, never required and never searched by. NEVER ADD a field for the Individual Healthcare Identifier or
    // for a tax file number.
    kimlikEtiketi: 'Medicare card number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'Australia',
  // The word a senior doctor goes by here: the Medical Board registers "specialists" (specialist registration; a
  // general practitioner's title is "specialist general practitioner"). Hospital usage ("consultant") NOT checked.
  kidemliHekim: 'specialist',
  // HOW EACH ROLE OF THE SHARED SET IS NAMED IN AUSTRALIA, where it differs from the set's base name. The doctor names
  // are the wording of the Medical Board of Australia's "List of specialties, fields of specialty practice and related
  // specialist titles" (effective 22 September 2025; opened 2026-10-10,
  // https://www.ahpra.gov.au/documents/default.aspx?record=WD10%2f106&dbid=AP&chksum=07LyDUkqqYa5O5LXuqbSzg%3d%3d),
  // the dash of the otolaryngology field included. Not read by a clinician of the country.
  //   - "Cardio-thoracic surgery" and "Vascular surgery" are roles of Australia's own (a split: ./klinik/rolListesi.ts).
  //   - 'oncology' is "Medical oncology": the list has that field and, as a specialty of its own, "Radiation oncology"
  //     (added in ./klinik/rolListesi.ts). There is no "Oncology" on it.
  //   - THE CLINIC ROLES ARE NOT SPECIALTIES OF THE LIST. 'aesthetic-medicine' is named by the regulator's own words
  //     for the area of work, "non-surgical cosmetic procedures" (Ahpra, "New cosmetic procedure guidelines", 3 June
  //     2025, https://www.ahpra.gov.au/News/2025-06-03-New-cosmetic-procedure-guidelines, opened 2026-10-10). A role
  //     name is an area of work, never a title: the title "surgeon" is protected by law here. "Hair transplantation"
  //     and "Preventive and longevity medicine" keep the set's names: UNVERIFIED, for a lawyer and the owner.
  //   - 'clinical-psychology' is "Psychologist": that is the regulated profession (Ahpra, "Professions and divisions",
  //     page reviewed 11/04/2025, opened 2026-10-10); the narrower title depends on an endorsement.
  rolAdlari: {
    'family-medicine': 'General practice',
    'internal-medicine': 'General medicine',
    gastroenterology: 'Gastroenterology and hepatology',
    'respiratory-medicine': 'Respiratory and sleep medicine',
    otolaryngology: 'Otolaryngology – head and neck surgery',
    oncology: 'Medical oncology',
    paediatrics: 'Paediatrics and child health',
    'aesthetic-medicine': 'Non-surgical cosmetic procedures',
    'clinical-psychology': 'Psychologist',
  },
  // AUSTRALIA'S OWN ROLE LIST: where it differs from the shared forty (./klinik/roller.ts).
  roller: AU_ROLLER,
  veliYasi: AU_VELI_YASI,
  birimler: AU_BIRIMLER,
  surum: 'au-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-AU': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from Australia (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // THE UNIT LABORATORIES IN AUSTRALIA REPORT EACH VALUE IN (checklist C8). The kit converts from the unit stated
    // here with fixed factors; a wrong unit here is a wrong result. Each was read on the page named, on 2026-10-10;
    // none was confirmed by a laboratory or a clinician of the country.
    //   albuminKreatinin  mg/mmol — Kidney Health Australia, "Chronic Kidney Disease (CKD) Management in Primary
    //                     Care", 5th edition (2024): "uACR <3.0 mg/mmol",
    //                     https://kidney.org.au/wp-content/uploads/2025/11/KHA-CKD-Handbook-5th-Ed-July2024.pdf
    //   hemoglobin        g/L — the same handbook: "Hb 100 – 115 g/L"
    //   kreatinin         µmol/L — Kidney Health Australia, eGFR calculator (the unit under its "Serum Creatinine"
    //                     field), https://kidney.org.au/health-professionals/egfr-calculator
    //   glukoz            mmol/L — the same handbook ("6-8 mmol/L fasting"); RACGP, Guidelines for preventive
    //                     activities in general practice, "Diabetes" (as of 28/06/2024): "FBG (5.5–6.9 mmol/L)"
    //   kolesterol        mmol/L — NOT READ ON ANY PAGE in that session (neither page above prints a lipid value):
    //                     a starting value, as before. No tool that is switched on reads it.
    //   crp               mg/L — PathWest (Western Australia's public pathology service), test directory, CRP:
    //                     reference interval "<5.0", reported in mg/L,
    //                     https://pathwesttd.health.wa.gov.au/testdirectory/testdetail.aspx?TestID=141 (one state's
    //                     laboratory)
    //   psa               µg/L — Prostate Cancer Foundation of Australia, "2026 Guidelines for the Early Detection of
    //                     Prostate Cancer in Australia: Summary of Recommendations" (approved 18 May 2026): every
    //                     value is written in µg/L,
    //                     https://www.prostate.org.au/wp-content/uploads/2026/08/2026-Guidelines-for-the-Early-Detection-of-Prostate-Cancer-Summary-of-Recommendations.pdf
    //   hba1c             per cent OR mmol/mol: the doctor chooses the unit beside the number — RCPA Manual, "HbA1c":
    //                     "3.5 - 6.0% (15-42 mmol/mol)", https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/H/HbA1c;
    //                     the handbook and the RACGP page above write both units too. No tool that is switched on
    //                     reads it yet: it is stated for the day one does.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L', hba1c: ['%', 'mmol/mol'] },
    // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). Source read 2026-10-10:
    // Australian Commission on Safety and Quality in Health Care, "Recommendations for safe use of medicines terminology"
    // (November 2024), https://www.safetyandquality.gov.au/sites/default/files/2024-12/recommendations-for-safe-use-of-medicines-terminology.pdf
    // — "Do not use trailing zeros. For example, use '5' not '5.0' for doses of medicines expressed in whole numbers."
    // UNVERIFIED by a local clinical lead.
    dozYazimi: { sondaSifir: false },
    // The body mass index of Australia's own tool is written in kilograms per square metre.
    birimAdlari: { 'kg/m2': 'kg/m²' },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      // REMOVED FOR AUSTRALIA by the audit's decision ("remove"): it is not this country's scale. It stays a slot only
      // because every tool of the shared set that is not on is recorded as one; it is never to be switched on here.
      'esi-triyaj': { eksik: 'NOT AUSTRALIA\'S SCALE: removed for Australia. Emergency departments here use the Australasian Triage Scale, which belongs to the Australasian College for Emergency Medicine and needs the College\'s permission before a tool may carry it. ' + EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: 'Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol, and the national handbook for primary care writes its categories as below 3.0, 3.0 to 30 and above 30 mg/mmol and has a colour chart of its own that differs from the international grid in two cells; the handbook may not be reproduced without its publisher\'s written permission. Needed: a nephrologist\'s decision on which chart applies here, and that permission. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'The same as the general-medicine kidney tool: the national handbook\'s categories in mg/mmol and its own colour chart, which needs its publisher\'s permission. A nephrologist may prefer the international grid; the screen must then say which grid it shows. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in Australia use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole. ' + EMIR_RAPOR, kimden: HAK_SAHIBI },
    },
    // WORDS OF A SHARED TOOL THIS COUNTRY WRITES DIFFERENTLY.
    degisen: {
      // The national guideline gives a yearly rate of change no place: said where the tool is described. Source read
      // 2026-10-10 (the summary of recommendations named under `labBirimleri.psa`): the words "PSA velocity" and a
      // yearly rate do not appear in it; it works with levels by age and risk, a repeat test, and PSA density.
      'psa-hizi': { aciklama: 'From two measurements and their dates, the change in a year is worked out. No threshold and no grade is shown. The summary of recommendations of the 2026 Australian guidelines for the early detection of prostate cancer does not use a yearly rate of change.' },
    },
    // NUMBERS AUSTRALIA STATES for a tool of the shared set that leaves one to the country.
    parametreler: {
      // THE RANGE OF THE EXPECTED HEIGHT: 8.5 cm either side. Source read 2026-10-10: The Royal Children's Hospital
      // Melbourne, Primary Care Liaison, "Short stature" (guideline reviewed in July 2025),
      // https://www.rch.org.au/primary-care-liaison/prereferral_guidelines/Short_stature/ — "the normal range for
      // final height is 8.5 cm on either side of the calculated value"; its formula is the kit's (plus or minus 13 cm,
      // divided by 2). A CHILDREN'S HOSPITAL OF ONE STATE, not a national body: the national paediatric endocrine
      // society's growth-chart page (https://anzsped.org/clinical-resources-links/growth-growth-charts/, opened the
      // same day) states no range. For a paediatrician to confirm.
      'hedef-boy': { aralik_cm: 8.5 },
      // THE CAUTION ABOUT TWO PSA RESULTS CLOSE TOGETHER IS OFF (0 = never). The kit's default raises it under 90 days,
      // a figure with no source; the national guideline itself asks for the test to be repeated "within 1-3 months"
      // (the summary of recommendations named above, recommendations 5.3 to 5.8; read 2026-10-10), so the caution
      // would stand on every repeat the guideline asks for.
      'psa-hizi': { kisa_aralik_gun: 0 },
    },
    // NOT SUPPLIED, because no source that could be used was found on 2026-10-10 (the tool then behaves as the kit
    // documents, with the kit's own cited source):
    //   - HEARING AVERAGE (frequencies, grade table, asymmetry rule): the Government's hearing program averages 0.5, 1
    //     and 2 kHz and sets a funding threshold, not grades (Hearing Services Program, service and device
    //     requirements; "Minimum Hearing Loss Threshold Guidelines", effective 1 July 2022); the national data
    //     standard for the degree of hearing impairment refuses automated readers; a Senate report's table names no
    //     frequencies; an AIHW report prints one territory's standard beside the WHO's. No Australian asymmetry rule
    //     was found.
    //   - RETURN TO SPORT (steps and earliest days): the national concussion guidelines belong to the Australian
    //     Sports Commission, whose copyright page (https://www.ausport.gov.au/legal_information/copyright) says:
    //     "This licence does not provide for the commercial or derivative use of ASC copyright material." So no step
    //     is copied: the tool shows the days since the injury and says that no steps are set.
    //   - PASI, EASI, SCORAD, DAS28 BANDS: the dermatologists' college (consensus adaptation, May 2024) classes
    //     psoriasis by the treatment it needs and uses PASI above 10 as one of four criteria for systemic therapy, not
    //     as bands; the limits the subsidy rules use are payer rules and are not put on a clinical score.
    // WHO SEES A TOOL OF THE SHARED SET HERE, where it differs from the set's list (the audit's decisions, Part 3):
    gorenler: {
      // "check inhaler technique at every opportunity": general practice and paediatrics, not only the respiratory physician
      'inhaler-teknik': ['respiratory-medicine', 'family-medicine', 'paediatrics'],
      // children are seen in general practice; NEVER a role whose patients are adults only
      'hedef-boy': ['paediatrics', 'family-medicine'],
      'doz-hesabi': ['paediatrics', 'family-medicine'],
      // THE SPLIT: the chest tools go with cardio-thoracic surgery, the graft tool with vascular surgery, and the
      // pre-operative checklist of heart and vascular operations with both halves
      'toraks-preop': ['cardio-thoracic-surgery'],
      'toraks-tup-yara': ['cardio-thoracic-surgery'],
      'kalp-damar-preop': ['cardio-thoracic-surgery', 'vascular-surgery'],
      'greft-yara-izlem': ['vascular-surgery'],
      'antikoagulan-vadeleri': ['cardio-thoracic-surgery', 'vascular-surgery', 'haematology'],
      // the roles Australia adds take the record lists the audit names for them
      'kur-sayaci': ['oncology', 'radiation-oncology', 'haematology'],
      'toksisite-listesi': ['oncology', 'radiation-oncology'],
      'postop-agri': ['anaesthesia', 'pain-medicine'],
      'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
      // audiologists measure it: the allied profession sees the tool the set gives to the surgeon only
      'odyometri-pta': ['otolaryngology', 'audiology'],
    },
    // THE LICENCE STATE of the two tools whose rights holder requires permission (docs/COUNTRY-PACK-HOWTO.md, "Country-only
    // tools and roles", point 5): "izin-gerekli" = permission needed. While it stands, the pack check refuses to switch
    // either tool on, and the screen and the server refuse it a second time.
    // NO OTHER TOOL OF THE SHARED SET HAS A LICENCE STATED HERE: "free" is written only where the rights holder's own
    // notice was read, and for the tools of the shared set none was (the audit's list: docs/araclar-denetim/AU.md,
    // "Licence terms, as read"). The three tools of Australia's own state theirs in ./araclar/metinler.ts.
    lisanslar: {
      'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
      'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
    },
    // THE TOOLS ONLY AUSTRALIA HAS (./araclar/): switched on by the owner's order of 2026-10-10, each on the list of
    // tools switched on without a clinician's sign-off (./araclar/onaysizAciklar.ts).
    ek: {
      araclar: auEkAraclar({
        yetiskinHekimleriVePsikolog: [...YETISKIN_HEKIMLERI, 'clinical-psychology'],
        onkoloji: ['oncology', 'radiation-oncology'],
      }),
      tanimlar: AU_TANIMLAR,
    },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. One of the mobile numbers the communications regulator sets aside for
    // creative works (0491 570 006, 0491 570 110, 0491 570 156 to 159): it is not issued to anybody. Not checked
    // against the regulator's current list by anybody of the country.
    telefonOrnegi: '+61 491 570 006',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for Australia; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
