/**
 * NOTYA-ULKE-UYGULA (gb) — United Kingdom: WHAT THIS COUNTRY STATES ABOUT ITS TOOLS. The audited decisions
 * (docs/araclar-denetim/gb-kararlar.json and GB.md, "Second pass" first) applied to this country alone: who sees
 * which tool, the country's own numbers for the shared tools that take them, the tools kept off, licence states,
 * and the tools only this country has (./kendiAraclari.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN. EVERY NUMBER BELOW WAS TAKEN FROM A SOURCE OPENED IN THIS JOB'S
 * SESSION (2026-10-10), named beside it with its address; none was written from memory. No clinician, lawyer or
 * native editor of the United Kingdom has read a line, and no body named here has reviewed or endorsed anything.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NICE. Two items below are taken from NICE guidance, by the owner's order of 2026-10-10 ("Bring on the NICE tables. We
 * will do a lawyer review later."). Each is marked "NICE-KAYNAKLI" where it stands and listed in ./nice-kaynakli.json
 * (file, line, guidance, what was taken) FOR THE LAWYER: NICE's own terms say its content may not be used for AI
 * purposes without written permission, and that use outside the United Kingdom needs its agreement
 * (docs/araclar-denetim/GB.md, "Licence terms, as read").
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { enRolSatirlari } from '../_dil/en/klinik/roller'
import { GB_KENDI_ARACLARI, GB_KENDI_TANIMLARI } from './kendiAraclari'
import { GB_ROLLER } from './roller'

const KLINISYEN = 'a clinical lead in the United Kingdom'

/** THE DOCTOR ROLES of this country, in its order: every role that is not an allied profession (the class "hekimler"). */
export const GB_HEKIM_ROLLERI: readonly string[] = enRolSatirlari(GB_ROLLER).filter((r) => r.taraf !== 'klinik-muttefik').map((r) => r.anahtar)

// ── TOOLS THAT STAY OFF BY THE OWNER'S ORDER (Kaan, 2026-10-10): the ESI triage tool, the report outline that prints
// the BI-RADS categories, and both kidney tools. The guard test lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if
// a pack switches one of them on. THE DOSE CALCULATOR IS BACK ON by the owner's order of the same day ("Bring on all
// the tools ... We will test as we go."): its fault was corrected in the kit (pull request #615) and it was on in
// this pack before it was switched off; it is no longer listed here. ──
const EMIR_ESI = 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded.'
const EMIR_RAPOR = 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded.'
const EMIR_BOBREK = 'Off by the owner\'s order of 2026-10-10, and it stays off. The two faults the audits found (a risk cell shown when no urine albumin result was typed; referral lines labelled as criteria) were corrected in the kit on 2026-10-10, and the albuminuria limits are now applied as printed for the unit the value was typed in. Still open: the licence of the KDIGO grid is not settled, and no clinician of the United Kingdom has read the tool. Needed: the owner\'s word.'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = `the owner, with the rights holder's written permission; then ${KLINISYEN}`

export const GB_ARACLAR: EnUlkeGirdisi['araclar'] = {
  // UNVERIFIED BY A PERSON: the unit laboratories in the United Kingdom report each value in (checklist C8). The kit
  // converts from the unit stated here with fixed factors; a wrong unit here is a wrong result.
  // NICE-KAYNAKLI: THREE UNITS (NG203, NG12). mg/mmol, g/L and µg/L are written here as NICE writes them; read by the
  // earlier jobs named below, not opened again in this job. A unit only: no table and no threshold.
  // LOCALISATION AUDIT 2026-10-09, each read on an official page by that audit (branch audit/gb,
  // docs/COUNTRY-AUDIT-UNITED-KINGDOM.md has the links): urine albumin-to-creatinine ratio mg/mmol and haemoglobin g/L
  // (NICE NG203), creatinine µmol/L (an NHS laboratory), glucose and cholesterol mmol/L (nhs.uk).
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' },
  // C-REACTIVE PROTEIN in mg/L and PROSTATE-SPECIFIC ANTIGEN in µg/L (NOTYA-ULKE-ARAC-DUZELTME-01: each is now a
  // statement of the pack). PSA: NICE writes "micrograms/litre" (NICE guideline NG12, draft for consultation of
  // October 2021, Table 1, https://www.nice.org.uk/guidance/ng12/documents/draft-guideline-4, read 2026-10-10 by the
  // tools-correction job; the audit read the same unit in the current NG12). CRP: that laboratories here report mg/L
  // is NOT confirmed by a source read (the audit says so).
  // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). Source read 2026-10-10 by the
  // tools-correction job: MHRA, "Best practice guidance on the labelling and packaging of medicines" (2026), section 4.3.2,
  // https://assets.publishing.service.gov.uk/media/6a4770118effd97622f53be5/Best_practice_guidance_labelling_MHRA_Final_July_2026.pdf
  // — "Trailing zeros should not appear i.e., 2.5 mg and NOT 2.50 mg." It is guidance on labels; the BNF's page on
  // prescription writing was not found by the audit. UNVERIFIED by a local clinical lead. THE DOSE CALCULATOR READS IT.
  dozYazimi: { sondaSifir: false },
  kapali: {
    'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several, and the tools audit found that it is not the scale the national sources of the United Kingdom name (REMOVE for this country: it stays off). ' + EMIR_ESI, kimden: HAK_SAHIBI },
    'kdigo-evre': { eksik: 'The referral lines of the tool follow the list of the KDIGO guideline. The national guideline on chronic kidney disease (NICE NG203) has categories in mg/mmol and a referral list of its own, which the tools audit of 2026-10-10 found different (docs/araclar-denetim/GB.md): a doctor here follows the national list. Needed: a clinical decision on which list the tool shows. ' + EMIR_BOBREK, kimden: KLINISYEN },
    'kdigo-serit': { eksik: 'The same grid as the general-medicine kidney tool, without referral lines. The tools audit proposes one kidney tool for this country, not two. ' + EMIR_BOBREK, kimden: KLINISYEN },
    'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in the United Kingdom use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole. ' + EMIR_RAPOR, kimden: HAK_SAHIBI },
  },

  // ───────────────────────── WHO SEES WHICH TOOL HERE (decisions: `proposedSpecialties`, and Part 3 of GB.md) ─────────────────────────
  // A tool that is not named below is seen by the roles the shared set gives it. Only existing tools; none is switched on by this.
  gorenler: {
    // THE CORE: every DOCTOR role (clinic doctors included; not the allied professions). With it every doctor role has
    // a tool whose result can be kept, so every doctor role gets the follow-up list (the set works that out).
    'antibiyotik-sure': 'hekimler',
    // general practice, the largest group of doctors here, saw no tool but the patient's page
    'inhaler-teknik': ['respiratory-medicine', 'family-medicine', 'paediatrics'],
    'antikoagulan-vadeleri': ['cardiovascular-surgery', 'cardiology', 'family-medicine', 'internal-medicine', 'geriatric-medicine', 'haematology'],
    'rtp-basamak': ['sports-medicine', 'family-medicine', 'emergency-medicine'],
    // hearing and balance: the ear specialties, general practice where the audit names it, and the audiologist
    'odyometri-pta': ['otolaryngology', 'audio-vestibular-medicine', 'audiology'],
    'otoskopi-notu': ['otolaryngology', 'audio-vestibular-medicine', 'family-medicine', 'audiology'],
    'vertigo-notu': ['otolaryngology', 'audio-vestibular-medicine', 'family-medicine', 'neurology', 'emergency-medicine', 'audiology'],
    // heart operations belong to cardio-thoracic surgery here, vascular operations to vascular surgery: both see the list
    'kalp-damar-preop': ['thoracic-surgery', 'cardiovascular-surgery'],
    // the two oncology specialties, and haematology for the cycle counter
    'kur-sayaci': ['oncology', 'clinical-oncology', 'haematology'],
    'toksisite-listesi': ['oncology', 'clinical-oncology'],
    'genel-preop': ['general-surgery', 'oral-maxillofacial-surgery'],
    'yara-dren-izlem': ['paediatric-surgery', 'general-surgery', 'oral-maxillofacial-surgery'],
  },

  // ───────────────────────── THE COUNTRY'S OWN NUMBERS FOR SHARED TOOLS ─────────────────────────
  uyarlama: {
    // HEARING: FIVE FREQUENCIES AND FOUR DESCRIPTORS. Source opened 2026-10-10: British Society of Audiology,
    // "Recommended Procedure: Pure-tone air-conduction and bone-conduction threshold audiometry with and without
    // masking", August 2018 (review due 2023), section 9 "Audiometric descriptors",
    // https://www.thebsa.org.uk/wp-content/uploads/2024/01/Recommended-Procedure-Pure-Tone-Audiometry-2018.pdf
    //   - the average of the air-conduction thresholds at 250, 500, 1000, 2000 and 4000 Hz (the kit averages four);
    //   - mild 21 to 40, moderate 41 to 70, severe 71 to 95, profound "In excess of 95" dB HL (the kit's own table,
    //     an American one, has seven grades and calls up to 15 dB normal);
    //   - the document names NO descriptor for an average of 20 dB or below, and none is invented here;
    //   - a frequency with no response is given the value 130 dB HL (the field takes up to 130).
    // AN AVERAGE BETWEEN TWO WHOLE NUMBERS (20.4, 40.6) falls in a gap the document does not speak of: it is placed in
    // the HIGHER descriptor, as the kit does with its own table (never called less than it may be). For a clinician.
    // © British Society of Audiology 2018: the document allows whole reproduction for education and not-for-profit
    // use and asks for written permission otherwise. Four ranges named with their source: FOR THE LAWYER.
    'odyometri-pta': {
      alanlar: { frekans: ['e025', 'e05', 'e1', 'e2', 'e4'] },
      bantlar: { sayi: 'pta', satirlar: [{ ust: 20, dahil: true, bant: 'bsa_yok' }, { ust: 40, dahil: true, bant: 'bsa_hafif' }, { ust: 70, dahil: true, bant: 'bsa_orta' }, { ust: 95, dahil: true, bant: 'bsa_ileri' }, { ust: null, bant: 'bsa_cok_ileri' }] },
    },
    // NICE-KAYNAKLI: DAS28 BANDS. Source opened 2026-10-10: NICE technology appraisal guidance TA195 (rheumatoid
    // arthritis after the failure of a TNF inhibitor; the title and number as the tools audit recorded them), section 2
    // "Clinical need and practice", paragraph 2.10, https://www.nice.org.uk/guidance/ta195/chapter/2-clinical-need-and-practice
    //   - greater than 5.1 high disease activity; between 3.2 and 5.1 moderate; less than 3.2 low; less than 2.6 remission.
    // The same four cut-points as the kit's own bands; stated here so that this country's bands stand on its national source.
    das28: { bantlar: { sayi: 'das28', satirlar: [{ ust: 2.6, bant: 'remisyon' }, { ust: 3.2, bant: 'dusuk' }, { ust: 5.1, dahil: true, bant: 'orta' }, { ust: null, bant: 'yuksek' }] } },
  },
  parametreler: {
    // EXPECTED HEIGHT: 7 cm EITHER SIDE. Sources opened 2026-10-10: UK growth charts, boys 2–18 years and girls 2–18
    // years (© RCPCH 2012), https://www.sign.ac.uk/media/1436/boys_2-18_years_growth_chart.pdf and
    // https://www.rcpch.ac.uk/sites/default/files/Girls_2-18_years_growth_chart.pdf — on both, four children out of
    // five reach an adult height within "±7 cm" of the mid-parental target height.
    // NOT THE SAME TARGET: the charts read their target from the parents' centiles, with a regression adjustment; the
    // kit works the target out with the simple rule (13 cm). The description below says so. For a paediatrician.
    'hedef-boy': { aralik_cm: 7 },
    // HEARING ASYMMETRY: NOTHING STATED. The national rule (NICE NG98, 1.3.2) compares single adjacent frequencies of
    // the two ears; this tool knows the other ear by its average only and cannot hold that rule. The kit's own rule
    // (averages more than 15 dB apart) therefore stands, and the description says what the tool cannot check.
    // PSA, THE CAUTION ON TWO VALUES CLOSE TOGETHER: NOTHING STATED. No national source opened states a number of days;
    // the kit's 90 days stand until a urologist of the country decides (docs/araclar-denetim/DUZELTMELER.md, fault 14).
  },
  tablolar: {
    // RETURN AFTER CONCUSSION: SIX STAGES, TWO OF THEM WITH AN EARLIEST DAY. Source opened 2026-10-10: "UK Concussion
    // Guidelines for Non-Elite (Grassroots) Sport", November 2024,
    // https://cdn.healthiertogether.nhs.uk/docs/680f52949de2dde32c2c7a15_uk-concussion-guidelines-for-grassroots-non-elite-sport---november-2024-update-061124084139.pdf
    // (the same text as a web page: https://sportandrecreation.org.uk/campaigns-and-policy/concussion/concussion-guidelines-for-grassroots-sport-html-version)
    //   - the day of the concussion is day 0;
    //   - stage 5 cannot start until day 15 at the earliest (14 days free of symptoms at rest come first);
    //   - stage 6, competition: "NOT before day 21";
    //   - stages 1 to 4 have NO earliest day in the guideline (0 below = none): it says only, as a guide, that no stage
    //     lasts less than one day, and that the first 24 to 48 hours are relative rest.
    // WHAT A TABLE OF EARLIEST DAYS CANNOT HOLD: the 14 days free of symptoms. The words below say so on the screen.
    // The guideline carries no reuse statement (the web copy stands on a page marked © Sport + Recreation Alliance): FOR THE LAWYER.
    'rtp-basamak': { basamaklar: { satirlar: [{ basamak: 'asama1', en_erken_gun: 0 }, { basamak: 'asama2', en_erken_gun: 0 }, { basamak: 'asama3', en_erken_gun: 0 }, { basamak: 'asama4', en_erken_gun: 0 }, { basamak: 'asama5', en_erken_gun: 15 }, { basamak: 'asama6', en_erken_gun: 21 }] } },
  },

  // ───────────────────────── THE WORDS THAT GO WITH THOSE NUMBERS (this country's own, in British spelling) ─────────────────────────
  degisen: {
    'odyometri-pta': {
      // NICE-KAYNAKLI: the last sentence names NICE guideline NG98 (Hearing loss in adults: assessment and management;
      // the title as the tools audit recorded it), recommendation 1.3.2, opened 2026-10-10 at
      // https://www.nice.org.uk/guidance/NG98/chapter/recommendations — "15 dB or more at any 2 adjacent test frequencies",
      // using 0.5, 1, 2, 4 and 8 kHz. The tool does NOT apply the rule; the sentence says so.
      aciklama: 'The average of the air-conduction thresholds at 0.25, 0.5, 1, 2 and 4 kHz, with the descriptor the British Society of Audiology gives that average (recommended procedure for pure-tone audiometry, 2018), the change from an earlier measurement and the difference from the other ear. An average that falls between two whole numbers is placed in the higher descriptor. Where there is no response at a frequency, that procedure gives the reading the value 130 dB HL. The descriptors shown are the Society\'s, not those of the papers named under the result. The two ears are compared by their averages only: NICE guideline NG98 (recommendation 1.3.2) speaks of an asymmetry of 15 dB or more at any 2 adjacent test frequencies (0.5, 1, 2, 4 and 8 kHz), which this tool cannot check.',
      alanlar: { e025: 'Threshold at 0.25 kHz' },
      bantlar: {
        bsa_yok: 'No descriptor: the procedure cited names none for an average of 20 dB HL or below',
        bsa_hafif: 'Mild hearing loss (21 to 40 dB HL)',
        bsa_orta: 'Moderate hearing loss (41 to 70 dB HL)',
        bsa_ileri: 'Severe hearing loss (71 to 95 dB HL)',
        bsa_cok_ileri: 'Profound hearing loss (in excess of 95 dB HL)',
      },
      not: 'The descriptors are not to be the only ground for providing hearing support; the type of hearing loss and the diagnosis are the doctor\'s.',
    },
    // NICE-KAYNAKLI: THE NAMES OF THE FOUR DAS28 BANDS AND THE CREDIT (TA195, paragraph 2.10; source and address above, with the limits).
    das28: {
      aciklama: 'Worked out from the number of tender and of swollen joints out of 28, the patient\'s global assessment (0 to 100) and a marker of inflammation. The four bands are the ones NICE gives for DAS28 scores (technology appraisal guidance TA195, paragraph 2.10).',
      bantlar: { remisyon: 'Remission (below 2.6)', dusuk: 'Low disease activity (2.6 to below 3.2)', orta: 'Moderate disease activity (3.2 to 5.1)', yuksek: 'High disease activity (above 5.1)' },
    },
    'hedef-boy': {
      aciklama: 'From the height of the father and of the mother, an estimate of the child\'s adult height is worked out with the simple rule: the two heights are added, 13 cm is added for a boy or taken off for a girl, and the sum is halved. The range is 7 cm either side: the figure the UK growth charts for ages 2 to 18 (Royal College of Paediatrics and Child Health, 2012) print for their mid-parental target height, within which four children out of five end up. The charts read their target from the parents\' centiles with a regression adjustment, so their target can differ from this one, most of all where a parent is very tall or very short. It is an estimate, not a promise.',
    },
    'rtp-basamak': {
      ad: 'Return to activity and sport after concussion',
      aciklama: 'For a concussion: from the date of the injury (day 0), the days since it and the earliest day of the stage you choose, after the UK Concussion Guidelines for Non-Elite (Grassroots) Sport (November 2024). The guideline sets an earliest day for two stages only: stage 5 cannot start until day 15, and stage 6 is not reached before day 21. Both also need 14 days free of symptoms at rest, which this tool cannot check. As a guide, no stage lasts less than one day. The tool is for concussion, not for other injuries.',
      alanlar: { yaralanma: 'Date of the concussion (day 0)', basamak: 'Stage' },
      secenekler: { basamak: GB_ASAMALAR() },
      bantlar: GB_ASAMALAR(),
      sayilar: { gun: 'Days since the concussion (the day of the concussion is day 0)' },
      uyarilar: { erken: 'Today is before the earliest day of this stage' },
      tarihler: { en_erken: 'Earliest day of this stage' },
      not: 'The stage is the doctor\'s decision. The earliest day is a minimum, not a clearance: stages 5 and 6 also need 14 days free of symptoms at rest.',
    },
  },

  // ───────────────────────── LICENCE STATES ─────────────────────────
  // "Free" is stated ONLY where the rights holder's own notice says so and was opened in this session: that is so for the
  // tools only this country has (./kendiAraclari.ts). For the shared tools NOTHING IS STATED but the two below, whose
  // rights holder requires permission ("izin-gerekli"): while it stands, the pack check refuses to switch either on,
  // and the screen and the server refuse it a second time. What the audit found for every other tool is in the
  // pull request's report and in docs/araclar-denetim/GB.md ("Licence terms, as read").
  lisanslar: {
    'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
    'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
  },

  // ───────────────────────── THE TOOLS ONLY THIS COUNTRY HAS: switched on (./kendiAraclari.ts, ./onaysiz-araclar.json) ─────────────────────────
  ek: {
    araclar: GB_KENDI_ARACLARI.map((p) => (p.sinif === 'hekimler' ? { ...p, roller: GB_HEKIM_ROLLERI } : p)),
    tanimlar: GB_KENDI_TANIMLARI,
  },
}

/**
 * THE SIX STAGES of the UK concussion guideline, in this job's own short words after the guideline's summary of its
 * stages (source and address above). The stage's earliest day, where the guideline sets one, is in the name.
 */
function GB_ASAMALAR(): Record<string, string> {
  return {
    asama1: 'Stage 1: relative rest for 24 to 48 hours',
    asama2: 'Stage 2: daily activities introduced gradually; light physical activity',
    asama3: 'Stage 3: increasing tolerance for mental and exercise activities',
    asama4: 'Stage 4: return to study or work; training without risk of head impact',
    asama5: 'Stage 5: full work or education, and full training (not before day 15)',
    asama6: 'Stage 6: return to sports competition (not before day 21)',
  }
}
