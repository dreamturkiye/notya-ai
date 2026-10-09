/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: THE TOOLS AN ENGLISH-SPEAKING COUNTRY DOES NOT HAVE YET, AND WHY —
 * the marked slots, the same in all five countries.
 *
 * A machine may write the words of a checklist of the product's own and repeat a published formula. It may not write
 * a drug register, a vaccination schedule, a screening programme, a coding table, a certificate form, a referral
 * rule or a legal requirement, and it may not reproduce the wording of a published questionnaire. Wherever a tool
 * needs such content, a pack holds a SLOT instead: empty (`icerik: null`), switched off (`acik: false`), with a plain
 * description of what is missing and who must supply it. No screen reads a slot. Each slot is a row of "Needs local
 * content" in the country's record; when its content is supplied and signed, the tool joins the pack's list and
 * leaves this one (the pack check refuses a key that is both).
 *
 * `mekanizmaHazir: true` = the country kit already holds the tool's country-neutral mechanism under this key; only
 * the numbers or the content a country decides are missing.
 *
 * `ulke` is the country's name, put into the sentences that speak of its law, its register or its programmes.
 * Slots that belong to ONE country (a tool whose unit or scale does not fit there) are added by that country's pack.
 */
import type { AracYuvasi } from '@/lib/ulke/araclar/tipler'
import type { EnRol } from '../klinik/roller'

export const KLINISYEN = 'a local clinical lead, with the national source named'
export const HUKUK = 'a lawyer of the country, with the local clinical lead'
/** A published questionnaire: its wording belongs to its authors or to a rights holder. */
export const ANKET = 'the rights holder of the questionnaire, through the owner (licence terms for showing its original English wording in a commercial product); the local clinical lead confirms the version'

export const yuva = (anahtar: string, roller: readonly EnRol[] | null, eksik: string, kimden: string = KLINISYEN, mekanizmaHazir = false): AracYuvasi => ({ anahtar, acik: false, icerik: null, mekanizmaHazir, eksik, kimden, roller })

export function enAracYuvalari(ulke: string): readonly AracYuvasi[] {
  return [
    // ── base (every role) ──
    yuva('prescription', null, `Prescription drafting: the register of medicines authorised in ${ulke} (names, forms, strengths), the prescription form and its mandatory fields, and the rules for controlled medicines. Without the register no medicine can be offered or checked.`),
    yuva('visit-summary-document', null, `Visit and discharge summary as a document: the headings and mandatory fields of the summary a clinic in ${ulke} issues.`),
    yuva('diagnosis-coding', null, `Diagnosis coding: the coding edition in force in ${ulke} with its official titles. A coding table is reference content of an authority and is not written by a machine.`),
    yuva('medicine-interactions', null, `Medicine interactions: the interaction data itself (by active substance) from a licensed or official source, and the register of products and brand names sold in ${ulke} to search by.`),
    yuva('patient-certificates', null, `Certificates for patients: the forms a clinic in ${ulke} issues (sickness and fitness certificates, attendance notes), their fields and the periods the rules allow.`, HUKUK),
    yuva('test-requests', null, `Laboratory and imaging requests: the catalogue of tests offered locally, the units and reference ranges of the local laboratories, and the request form layout.`),
    yuva('end-of-visit', null, 'End-of-visit flow: it strings together prescription, certificate, follow-up appointment and the summary for the patient. It waits for the prescription and certificate slots above; the appointment and the summary exist already as screens of their own.'),

    // ── emergency medicine ──
    yuva('emergency-referral', ['emergency-medicine'], `Admission, referral and discharge package of an emergency department in ${ulke}: the documents that go with each, the levels of care a patient can be referred to, and who must be notified.`),

    // ── family medicine: all four rest on national programmes ──
    yuva('family-vaccination-screening', ['family-medicine'], `The vaccination schedule of ${ulke} with its catch-up rules, and its screening programmes (which examination, at which age, how often).`),
    yuva('family-chronic', ['family-medicine'], `Follow-up intervals for diabetes and high blood pressure in primary care, from the guidance followed in ${ulke}.`),
    yuva('family-referral', ['family-medicine'], `Referral and emergency triage in primary care: the referral routes of ${ulke}, the criteria for each, and the emergency number confirmed by a local source.`),
    yuva('family-follow-up-panel', ['family-medicine'], 'The follow-up panel of family medicine: it lists patients by the three tools above and has nothing to list until they exist.'),

    // ── paediatric surgery ──
    yuva('child-surgery-consent', ['paediatric-surgery'], `Consent for an operation on a child: the age below which a parent or guardian signs, who may sign, and the wording of the consent, under the law of ${ulke}.`, HUKUK),

    // ── internal medicine ──
    yuva('cardiovascular-risk', ['internal-medicine', 'cardiology'], `Ten-year cardiovascular risk: the risk calculator recommended in ${ulke}, with its calibration and its tables. A risk score calibrated for one population must not be shown in another.`),
    yuva('polypharmacy', ['internal-medicine'], `Review of medicines in older patients: the criteria in a licensed edition, and the register of medicines sold in ${ulke} to recognise each medicine by the name it has there.`),
    yuva('anticoagulation-review', ['internal-medicine'], `Anticoagulation review: the dose-reduction criteria of each anticoagulant as authorised in ${ulke} (age, weight, kidney function), targets and recheck intervals from the guidance followed there, and the local medicine names.`),

    // ── dermatology ──
    yuva('isotretinoin-pregnancy-prevention', ['dermatology'], `Pregnancy-prevention checks for isotretinoin: the programme the regulator of ${ulke} requires (tests, contraception, prescription validity).`),

    // ── endocrinology: the mechanism is in the kit; the numbers are local guidance and are not here ──
    yuva('lab-izlem', ['endocrinology'], `HbA1c and TSH follow-up: the thresholds between the bands (12 numbers: two HbA1c cut-offs, four TSH limits, six intervals in months) from the guidance followed in ${ulke}; the unit HbA1c is reported in there (per cent or mmol/mol: the kit's field has no unit choice yet); and the reference range the local laboratories report for TSH.`, KLINISYEN, true),
    yuva('dxa-tekrar', ['endocrinology'], `Bone densitometry repeat: the years between two scans for a low, a medium and a high risk band (3 numbers) from the guidance followed in ${ulke}.`, KLINISYEN, true),

    // ── infectious diseases ──
    yuva('viral-izlem', ['infectious-diseases'], `HIV and viral hepatitis follow-up: the months between two checks (3 numbers) from the guidance followed in ${ulke}.`, KLINISYEN, true),
    yuva('notifiable-diseases', ['infectious-diseases'], `Isolation and notification: the list of notifiable diseases in ${ulke}, to whom and by when each is reported, the report form, and isolation periods.`),

    // ── nephrology ──
    yuva('anemi-izlem', ['nephrology'], `Anaemia follow-up in chronic kidney disease: the target haemoglobin range, the lower limit and the months until the next check (6 numbers) from the guidance followed in ${ulke}, stated in the unit its laboratories report haemoglobin in.`, KLINISYEN, true),

    // ── rheumatology ──
    yuva('iltihap-lab-izlem', ['rheumatology'], `CRP and ESR follow-up: the thresholds between the bands and the months until the next check (7 numbers), with the reference ranges and the CRP unit the laboratories of ${ulke} use.`, KLINISYEN, true),
    yuva('basdai', ['rheumatology'], 'BASDAI (Bath Ankylosing Spondylitis Disease Activity Index): a published patient questionnaire of six questions. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it.', ANKET),

    // ── cardiology ──
    yuva('kardiyo-izlem', ['cardiology'], `High blood pressure, heart-failure and atrial-fibrillation follow-up: the clinic blood-pressure limits that raise a warning and the days until each next check (9 numbers), from the guidance followed in ${ulke}.`, KLINISYEN, true),

    // ── respiratory medicine ──
    yuva('cat-mmrc', ['respiratory-medicine'], 'COPD Assessment Test (CAT) with the mMRC breathlessness grade: CAT is a published questionnaire whose wording belongs to its rights holder. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it.', ANKET),
    yuva('lung-action-plan', ['respiratory-medicine'], `Written action plan for asthma and COPD: a sheet the PATIENT reads (what to do in each zone), with the emergency number and the stop-smoking service of ${ulke}. Every sentence is an instruction to a patient and must be supplied and signed by a local respiratory doctor.`),

    // ── gastroenterology ──
    yuva('ibd-skor', ['gastroenterology'], `Activity index follow-up (partial Mayo, Harvey-Bradshaw, IBS severity total): the cut-offs between remission, mild, moderate and severe and the months until the next check (13 numbers), as the guidance followed in ${ulke} states them.`, KLINISYEN, true),
    yuva('hepatit-izlem', ['gastroenterology'], `Hepatitis B and C follow-up: the months until the next check for a stable patient, one under active follow-up and one being assessed for treatment (3 numbers) from the guidance followed in ${ulke}.`, KLINISYEN, true),

    // ── obstetrics and gynaecology: every tool rests on a national schedule, a law or a reference table ──
    yuva('pregnancy-calendar', ['obstetrics-gynaecology'], `Pregnancy calendar: the antenatal visit schedule and the screening windows followed in ${ulke}. (Gestational-age arithmetic alone is universal; the tool is its schedule.)`),
    yuva('maternity-leave', ['obstetrics-gynaecology'], `Maternity leave dates and certificate: the periods the law of ${ulke} gives before and after birth, how they move with an early or late birth, and the certificate form.`, HUKUK),
    yuva('contraception-eligibility', ['obstetrics-gynaecology'], `Medical eligibility for contraception: the eligibility criteria in the edition used in ${ulke}, entered from the source and signed by a local clinician, and for emergency contraception the products authorised there. An eligibility table is not copied by a machine.`),
    yuva('obstetric-risk', ['obstetrics-gynaecology'], `Obstetric risk prompts and the caesarean indication note: the guidance followed in ${ulke} (who is offered which prophylaxis, in which window) and the form of the note its rules require.`),
    yuva('obstetric-follow-up-panel', ['obstetrics-gynaecology'], 'The follow-up panel of obstetrics and gynaecology: it lists patients by the antenatal and screening schedule above and has nothing to list until that exists.'),

    // ── neurology ──
    yuva('stroke-red-flags', ['neurology'], `Stroke and TIA red flags: the emergency number confirmed by a local source and the stroke pathway of the region (where a patient is sent, within which time window).`),
    yuva('midas', ['neurology'], 'MIDAS (Migraine Disability Assessment): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it.', ANKET),
    yuva('antiseizure-monitoring', ['neurology'], `Laboratory monitoring of antiseizure medicines: which tests, how soon after starting and how often, from the guidance followed in ${ulke}, and the register of medicines sold there to recognise each by name.`),

    // ── paediatrics ──
    yuva('growth-percentiles', ['paediatrics'], `Growth and percentiles: the growth charts used in ${ulke} (which standard, which charts, from which age) with their reference tables.`),
    yuva('vaccination-schedule', ['paediatrics'], `Vaccination schedule and catch-up: the immunisation schedule of ${ulke} with its catch-up rules.`),
    yuva('development-screening', ['paediatrics'], `Development and screening panel: the screening programme for children in ${ulke} (hearing, vision, supplements: which, at which age).`),
    yuva('mchat-rf', ['paediatrics'], 'M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised, with Follow-Up): a published questionnaire for parents. THE LICENCE QUESTION: the permission of its authors and their terms for use inside a product. No item is reproduced here; the scoring is not switched on without it.', ANKET),
    yuva('paediatric-follow-up-panel', ['paediatrics'], 'The follow-up panel of paediatrics: it lists patients by the vaccination schedule and the screening programme above and has nothing to list until they exist.'),

    // ── plastic surgery ──
    yuva('plastic-surgery-consent', ['plastic-surgery'], `Informed-consent checklist for a plastic-surgery procedure: the items and the wording the law of ${ulke} requires.`, HUKUK),

    // ── psychiatry ──
    yuva('phq9-gad7', ['psychiatry'], 'PHQ-9 and GAD-7: published patient questionnaires. THE LICENCE QUESTION: the terms of use of their owner for showing the original English wording inside a commercial product. No item is reproduced here; the scoring, and the safety prompt on the ninth item of PHQ-9, are not switched on without it.', ANKET),
    yuva('psychiatry-safety-triage', ['psychiatry'], `Safety and emergency triage: the emergency number and the crisis service confirmed by a local source, the referral path, the rules for involuntary admission in ${ulke}, and the wording of a crisis plan signed by a local psychiatrist.`),
    yuva('psychotropic-monitoring', ['psychiatry'], `Monitoring calendar of psychotropic medicines: which tests and how often for each class, from the guidance followed in ${ulke}, and the register of medicines sold there. A monitoring schedule by medicine is clinical reference content.`),

    // ── radiology ──
    yuva('critical-finding-notice', ['radiology'], `Critical-finding notice: who must be told, how fast, by which channel, under the rules of the institution and of ${ulke}.`),

    // ── urology ──
    yuva('ipss', ['urology'], 'IPSS (International Prostate Symptom Score): a published patient questionnaire. THE LICENCE QUESTION: whether and on which terms its English wording may be shown. No item is reproduced here; the scoring is not switched on without it.', ANKET),
    yuva('urology-emergency-triage', ['urology'], 'Haematuria and stone emergency triage: the emergency number confirmed by a local source and the referral path.'),

    // ── rehabilitation medicine ──
    yuva('rehabilitation-session-plan', ['rehabilitation-medicine'], `Session plan: any rule of ${ulke} on the number and frequency of sessions (a public programme or an insurer), and the form a plan is written in.`),
    yuva('pain-odi', ['rehabilitation-medicine'], 'Pain scale with the Oswestry Disability Index (ODI): ODI is a published patient questionnaire under licence. THE LICENCE QUESTION: the licence and its terms for the English version. No item is reproduced here; the scoring is not switched on without it.', ANKET),
    yuva('home-exercise', ['rehabilitation-medicine'], 'Home exercise sheet: a sheet the PATIENT reads (exercise names, how often, when to stop, whom to call). Every sentence is an instruction to a patient and must be supplied and signed by a local rehabilitation doctor.'),
  ]
}
