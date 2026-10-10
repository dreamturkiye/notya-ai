/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE TOOLS THE COUNTRY DOES NOT HAVE YET, AND WHY — the marked slots.
 *
 * A machine may translate a checklist of the product's own and repeat a published formula. It may not write a drug
 * register, a vaccination calendar, a screening programme, a coding table, a certificate form, a referral rule or a
 * legal requirement. Wherever a tool needs such content, the Uzbek pack holds a SLOT instead: empty (`icerik: null`),
 * switched off (`acik: false`), with a plain description of what is missing and who must supply it. No screen reads
 * a slot. Each slot is a row of "Needs local content" in docs/COUNTRY-PACK-UZBEKISTAN.md and of
 * docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md; when its content is supplied and signed, the tool joins ./temel.ts or a
 * ./rol*.ts file and leaves this list (the pack check refuses a key that is both).
 *
 * `mekanizmaHazir: true` = the country kit already holds the tool's country-neutral mechanism under this key.
 */
import type { AracYuvasi } from '@/lib/ulke/araclar/tipler'
import { UZ_HEKIM_ROLLERI } from '../../klinik/rolListesi'

const KLINISYEN = 'a local clinical lead, with the national source named'
const HUKUK = 'a lawyer in Uzbekistan, with the local clinical lead'
/** A published questionnaire: its wording belongs to its authors or to a rights holder. */
const ANKET = 'the rights holder of the questionnaire, through the owner; the local clinical lead confirms the versions'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = 'the owner, with the rights holder\'s written permission; then a local clinical lead'
/** The fault both kidney tools share (NOTYA-ULKE-ARAC-01b). */
const BOBREK_EMRI = 'SAFETY, off by the owner\'s order of 2026-10-10: the tool shows the low-risk (green) cell when no urine albumin result was typed, and the internal-medicine tool labels its referral flags as KDIGO criteria that the guideline does not state that way. Needed: both corrected in the kit (NOTYA-ULKE-ARAC-01b).'

/** Every doctor role of the pack (../../klinik/rolListesi.ts): who sees a tool of the core set once it exists. */
const HEKIMLER: readonly string[] = UZ_HEKIM_ROLLERI

const yuva = (anahtar: string, roller: readonly string[] | null, eksik: string, kimden: string = KLINISYEN, mekanizmaHazir = false): AracYuvasi => ({ anahtar, acik: false, icerik: null, mekanizmaHazir, eksik, kimden, roller })

export const UZ_ARAC_YUVALARI: readonly AracYuvasi[] = [
  // ── THE CORE SET OF EVERY DOCTOR ROLE (the audit of 2026-10-10, section 2.1, second pass): five placeholders that
  // were written "for every role". A prescription, a diagnosis code, a certificate and a laboratory request are a
  // doctor's: the two allied professions and an account without a role are not among those who would see them. ──
  yuva('recete', HEKIMLER, 'Prescription drafting: the register of medicines authorised in Uzbekistan (names, forms, strengths), the prescription form and its mandatory fields, the language rule, and the rules for controlled medicines. Without the register no medicine can be offered or checked.'),
  // ── base (every role): dropped from the core set by the audit until their source is found; unchanged ──
  yuva('muayene-ozeti-belgesi', null, 'Visit and discharge summary as a document: the headings and mandatory fields of the summary an Uzbek clinic issues, in Uzbek and Russian, and whether a state form number applies.'),
  yuva('tani-kodlama', HEKIMLER, 'Diagnosis coding: the coding edition in force in Uzbekistan and its official titles in Uzbek and Russian. A coding table is reference content of an authority and is not written by a machine.'),
  yuva('ilac-etkilesimi', null, 'Medicine interactions: the interaction data itself (by active substance) from a licensed or official source, and the register of products and brand names sold in Uzbekistan to search by.'),
  yuva('hasta-belgeleri', HEKIMLER, 'Certificates for patients: the forms an Uzbek outpatient clinic issues (temporary incapacity certificate, fitness and attendance certificates), their numbers, fields and the periods the rules allow.', HUKUK),
  yuva('tetkik-istek', HEKIMLER, 'Laboratory and imaging requests: the catalogue of tests offered locally with their names in Uzbek and Russian, units and reference ranges of the local laboratories, and the request form layout.'),
  yuva('muayene-sonu', HEKIMLER, 'End-of-visit flow: it strings together prescription, certificate, follow-up appointment and the summary for the patient. It waits for the prescription and certificate slots above; the appointment and the summary exist already as screens of their own.'),

  // ── emergency medicine ──
  yuva('acil-sevk', ['acil-tip'], 'Admission, referral and discharge package of an emergency department: the documents that go with each, the levels of care a patient can be referred to, and who must be notified.'),

  // ── family medicine: all four tools rest on national programmes ──
  yuva('aile-asi-tarama', ['aile-hekimligi'], 'The national vaccination calendar of Uzbekistan with its catch-up rules, and the national screening programme (which examination, at which age, how often).'),
  yuva('aile-kronik', ['aile-hekimligi'], 'Follow-up intervals for diabetes and hypertension in primary care, from the national primary-care protocols.'),
  yuva('aile-sevk', ['aile-hekimligi'], 'Referral and emergency triage in primary care: the referral levels of the Uzbek system, the criteria for each, and the emergency number confirmed by a local source.'),
  yuva('aile-kohort', ['aile-hekimligi'], 'The follow-up panel of family medicine: it lists patients by the three tools above and has nothing to list until they exist.'),

  // ── paediatric surgery ──
  yuva('cocuk-onam-veli', ['cocuk-cerrahisi'], 'Consent for an operation on a child: the age below which a parent or guardian signs, who may sign, and the wording of the consent, under Uzbek law.', HUKUK),

  // ── internal medicine ──
  yuva('kv-risk-score2', ['dahiliye', 'kardiyoloji'], 'Ten-year cardiovascular risk (SCORE2 family): the risk region Uzbekistan belongs to, with the calibrated tables of that region. The pre-split application is set to another country\'s region and its numbers must not be shown here.'),
  yuva('polifarmasi', ['dahiliye'], 'Review of medicines in patients aged 65 and over (STOPP/START criteria): the criteria in a licensed edition, and the register of medicines sold in Uzbekistan to recognise each medicine by name. RECLASSIFIED from "keep": on inspection the tool recognises medicines by the names and brands of another country.'),
  yuva('antikoagulan', ['dahiliye'], 'Anticoagulation review: the dose-reduction criteria of each anticoagulant as authorised in Uzbekistan (age, weight, kidney function), INR targets and recheck intervals from the national protocol, and the local medicine names. RECLASSIFIED from "keep": the tool carries label criteria and intervals of another country.'),

  // ── dermatology ──
  yuva('izotretinoin-gebelik-onleme', ['dermatoloji', 'klinik-dermatoloji'], 'Pregnancy-prevention checks for isotretinoin: the programme the Uzbek regulator requires (tests, contraception, prescription validity).'),

  // ── endocrinology: the mechanism is in the kit; the numbers are local guidance and are not here ──
  yuva('lab-izlem', ['endokrinoloji'], 'HbA1c and TSH follow-up: the thresholds between the bands (12 numbers: two HbA1c cut-offs, four TSH limits, six intervals in months) from the national diabetes and thyroid protocols, with the reference range the local laboratories report for TSH.', KLINISYEN, true),
  yuva('dxa-tekrar', ['endokrinoloji'], 'Bone densitometry repeat: the years between two scans for a low, a medium and a high risk band (3 numbers) from the national osteoporosis protocol.', KLINISYEN, true),

  // ── infectious diseases ──
  yuva('viral-izlem', ['enfeksiyon-hastaliklari'], 'HIV and viral hepatitis follow-up: the months between two checks (3 numbers) from the national HIV and hepatitis protocols.', KLINISYEN, true),
  yuva('enfeksiyon-bildirim', ['enfeksiyon-hastaliklari'], 'Isolation and notification: the list of notifiable diseases in Uzbekistan, to whom and by when each is reported, the report form, and isolation periods from the national rules.'),

  // ── nephrology ──
  yuva('anemi-izlem', ['nefroloji'], 'Anaemia follow-up in chronic kidney disease: the target haemoglobin range, the lower limit and the months until the next check (6 numbers) from the national nephrology protocol; and the unit the local laboratories report haemoglobin in.', KLINISYEN, true),

  // ── rheumatology ──
  yuva('iltihap-lab-izlem', ['romatoloji'], 'CRP and ESR follow-up: the thresholds between the bands and the months until the next check (7 numbers), with the reference ranges the local laboratories use.', KLINISYEN, true),
  yuva('basdai', ['romatoloji'], 'BASDAI (Bath Ankylosing Spondylitis Disease Activity Index): a published patient questionnaire of six questions. Needed: the authorised Uzbek and Russian versions and, where its owner requires one, the licence. The wording is not translated by a machine. The DAS28 half of the pre-split application\'s tool is switched on; this half is not.', ANKET),

  // ── cardiology ──
  yuva('kardiyo-izlem', ['kardiyoloji'], 'Hypertension, heart-failure and atrial-fibrillation follow-up: the office blood-pressure limits that raise a warning and the days until each next check (9 numbers), from the national cardiology protocols.', KLINISYEN, true),

  // ── chest diseases ──
  yuva('cat-mmrc', ['gogus-hastaliklari'], 'COPD Assessment Test (CAT) with the mMRC dyspnoea grade: CAT is a published questionnaire whose wording belongs to its rights holder. Needed: the authorised Uzbek and Russian translations and the licence to use them. The wording is not translated by a machine; the scoring is not switched on without it.', ANKET),
  yuva('akciger-aksiyon-plani', ['gogus-hastaliklari'], 'Written action plan for asthma and COPD: a sheet the PATIENT reads (what to do in the green, yellow and red zone), with the emergency number and the local stop-smoking service. RECLASSIFIED from "keep": every sentence is an instruction to a patient and must be supplied and signed by a local chest physician.'),

  // ── gastroenterology ──
  yuva('ibd-skor', ['gastroenteroloji'], 'Activity index follow-up (partial Mayo, Harvey-Bradshaw, IBS severity total): the cut-offs between remission, mild, moderate and severe and the months until the next check (13 numbers), as the local gastroenterology protocols state them.', KLINISYEN, true),
  yuva('hepatit-izlem', ['gastroenteroloji'], 'Hepatitis B and C follow-up: the months until the next check for a stable patient, one under active follow-up and one being assessed for treatment (3 numbers) from the national hepatitis programme.', KLINISYEN, true),

  // ── obstetrics and gynaecology: every tool rests on a national protocol, a law or a reference table ──
  yuva('gebelik-takvimi', ['kadin-hastaliklari-dogum'], 'Pregnancy calendar: the antenatal visit schedule and the screening windows of the Uzbek antenatal protocol. (Gestational-age arithmetic alone is universal; the tool is its schedule.)'),
  yuva('dogum-analik-raporu', ['kadin-hastaliklari-dogum'], 'Maternity leave dates and certificate: the periods Uzbek labour law gives before and after birth, how they move with an early or late birth, and the certificate form.', HUKUK),
  yuva('kontrasepsiyon-mec', ['kadin-hastaliklari-dogum'], 'Medical eligibility for contraception: the WHO eligibility table entered from the WHO edition and signed by a local clinician, and for emergency contraception the products and doses authorised in Uzbekistan. RECLASSIFIED from "keep": the pre-split tool carries a simplified rule set with doses and notes of another country\'s market; an eligibility table is not copied by a machine.'),
  yuva('obstetrik-risk', ['kadin-hastaliklari-dogum'], 'Obstetric risk prompts and the caesarean indication note: the local protocol (who is offered which prophylaxis, in which window) and the form of the note Uzbek rules require.'),
  yuva('kd-kohort', ['kadin-hastaliklari-dogum'], 'The follow-up panel of obstetrics and gynaecology: it lists patients by the antenatal and screening schedule above and has nothing to list until that exists.'),

  // ── neurology ──
  yuva('inme-kirmizi-bayrak', ['noroloji'], 'Stroke and TIA red flags: the emergency number confirmed by a local source and the stroke pathway of the region (where a patient is sent, within which time window).'),
  yuva('midas', ['noroloji'], 'MIDAS (Migraine Disability Assessment): a published patient questionnaire. Needed: the authorised Uzbek and Russian versions and the licence. The wording is not translated by a machine; the scoring is not switched on without it.', ANKET),
  yuva('antiepileptik-izlem', ['noroloji'], 'Laboratory monitoring of antiseizure medicines: which tests, how soon after starting and how often, from the national protocol, and the register of medicines sold in Uzbekistan to recognise each by name. RECLASSIFIED from "keep": the pre-split tool recognises medicines by the names and brands of another country and cites that country\'s regulator.'),

  // ── paediatrics ──
  yuva('buyume-persentil', ['pediatri'], 'Growth and percentiles: the growth standard used in Uzbekistan (WHO standards to be confirmed) with its reference tables. The pre-split tool also carries a national reference of another country, which must not be shown here.'),
  yuva('asi-takvimi', ['pediatri'], 'Vaccination calendar and catch-up: the national immunisation calendar of Uzbekistan with its catch-up rules.'),
  yuva('gelisim-tarama', ['pediatri'], 'Development and screening panel: the national screening programme for children (hearing, vision, supplements: which, at which age).'),
  yuva('mchat-rf', ['pediatri'], 'M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised, with Follow-Up): a published questionnaire for parents. Needed: the authorised Uzbek and Russian versions and the permission of its authors. The wording is not translated by a machine; the scoring is not switched on without it.', ANKET),
  yuva('pediatri-kohort', ['pediatri'], 'The follow-up panel of paediatrics: it lists patients by the vaccination calendar and the screening programme above and has nothing to list until they exist.'),

  // ── plastic surgery ──
  yuva('plastik-onam', ['plastik-cerrahi', 'estetik-cerrahi'], 'Informed-consent checklist for a plastic-surgery procedure: the items and the wording Uzbek law requires.', HUKUK),

  // ── psychiatry ──
  yuva('phq9-gad7', ['psikiyatri'], 'PHQ-9 and GAD-7: published patient questionnaires. Needed: the authorised Uzbek and Russian versions (and the terms of use of their owner). The wording is not translated by a machine; the scoring, and the safety prompt on the ninth item of PHQ-9, are not switched on without it.', ANKET),
  yuva('psikiyatri-guvenlik-triyaj', ['psikiyatri'], 'Safety and emergency triage: the emergency number confirmed by a local source, the referral path, the rules for involuntary admission, and the wording of a crisis plan signed by a local psychiatrist.'),
  yuva('psikotrop-izlem', ['psikiyatri'], 'Monitoring calendar of psychotropic medicines: which tests and how often for each class, from the national protocol, and the register of medicines sold in Uzbekistan. RECLASSIFIED from "keep": a monitoring schedule by medicine is clinical reference content.'),

  // ── radiology ──
  yuva('radyo-kritik-bildirim', ['radyoloji'], 'Critical-finding notice: who must be told, how fast, by which channel, under the local rules of the institution and the country.'),

  // ── urology ──
  yuva('ipss', ['uroloji'], 'IPSS (International Prostate Symptom Score): a published patient questionnaire. Needed: the authorised Uzbek and Russian versions and the permission to use them. The wording is not translated by a machine; the scoring is not switched on without it.', ANKET),
  yuva('uroloji-acil-triyaj', ['uroloji'], 'Haematuria and stone emergency triage: the emergency number confirmed by a local source and the referral path.'),

  // ── physical medicine and rehabilitation ──
  yuva('ftr-seans-plani', ['fizik-tedavi'], 'Session plan: any local rule on the number and frequency of sessions (state or insurer), and the form a plan is written in.'),
  yuva('vas-odi', ['fizik-tedavi'], 'Pain scale with the Oswestry Disability Index (ODI): ODI is a published patient questionnaire under licence. Needed: the authorised Uzbek and Russian versions and the licence. The wording is not translated by a machine; the scoring is not switched on without it.', ANKET),
  yuva('ev-egzersiz', ['fizik-tedavi'], 'Home exercise sheet: a sheet the PATIENT reads (exercise names, how often, when to stop, whom to call). Every sentence is an instruction to a patient and must be supplied and signed by a local rehabilitation physician.'),

  // ── NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"). These five were switched on
  // until that day; each stays a slot until its fault is corrected in the kit or its licence is granted. Their words
  // are kept in ./rol1.ts, ./rol2.ts and ./rol5.ts and are taken off the list of tools in ./index.ts
  // (UZ_KAPALI_ARACLAR). Evidence: the audits of the tools against national sources, docs/araclar-denetim/, "Second
  // pass" (branches araclar-denetim/<code>). lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if one is switched on. ──
  { ...yuva('esi-triyaj', ['acil-tip'], 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded; and a local emergency physician confirms that this is the triage scale emergency departments in Uzbekistan work with.', HAK_SAHIBI, true), lisans: { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' } },
  yuva('kdigo-evre', ['dahiliye'], `${BOBREK_EMRI} The unit of the urine albumin-to-creatinine ratio (mg/g here) is still to be confirmed with the local laboratories.`, KLINISYEN, true),
  yuva('kdigo-serit', ['nefroloji'], `${BOBREK_EMRI} The unit of the urine albumin-to-creatinine ratio (mg/g here) is still to be confirmed with the local laboratories.`, KLINISYEN, true),
  yuva('doz-hesabi', ['pediatri'], 'SAFETY, off by the owner\'s order of 2026-10-10: the tool rounds the volume of one dose to 0.1 mL and shows only the rounded figure (0.16 mL is shown as 0.2 mL), and it prints trailing zeros ("5.0 mL"), which can be misread as ten times the dose. Needed: both corrected in the kit (NOTYA-ULKE-ARAC-01b).', KLINISYEN, true),
  { ...yuva('rapor-taslagi', ['radyoloji'], 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded; and a local radiologist confirms whether mammography is reported in these categories in Uzbekistan.', HAK_SAHIBI, true), lisans: { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' } },
]
