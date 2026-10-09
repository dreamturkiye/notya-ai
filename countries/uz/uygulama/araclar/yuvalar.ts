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

const KLINISYEN = 'a local clinical lead, with the national source named'
const HUKUK = 'a lawyer in Uzbekistan, with the local clinical lead'

const yuva = (anahtar: string, roller: readonly string[] | null, eksik: string, kimden: string = KLINISYEN, mekanizmaHazir = false): AracYuvasi => ({ anahtar, acik: false, icerik: null, mekanizmaHazir, eksik, kimden, roller })

export const UZ_ARAC_YUVALARI: readonly AracYuvasi[] = [
  // ── base (every role) ──
  yuva('recete', null, 'Prescription drafting: the register of medicines authorised in Uzbekistan (names, forms, strengths), the prescription form and its mandatory fields, the language rule, and the rules for controlled medicines. Without the register no medicine can be offered or checked.'),
  yuva('muayene-ozeti-belgesi', null, 'Visit and discharge summary as a document: the headings and mandatory fields of the summary an Uzbek clinic issues, in Uzbek and Russian, and whether a state form number applies.'),
  yuva('tani-kodlama', null, 'Diagnosis coding: the coding edition in force in Uzbekistan and its official titles in Uzbek and Russian. A coding table is reference content of an authority and is not written by a machine.'),
  yuva('ilac-etkilesimi', null, 'Medicine interactions: the interaction data itself (by active substance) from a licensed or official source, and the register of products and brand names sold in Uzbekistan to search by.'),
  yuva('hasta-belgeleri', null, 'Certificates for patients: the forms an Uzbek outpatient clinic issues (temporary incapacity certificate, fitness and attendance certificates), their numbers, fields and the periods the rules allow.', HUKUK),
  yuva('tetkik-istek', null, 'Laboratory and imaging requests: the catalogue of tests offered locally with their names in Uzbek and Russian, units and reference ranges of the local laboratories, and the request form layout.'),
  yuva('muayene-sonu', null, 'End-of-visit flow: it strings together prescription, certificate, follow-up appointment and the summary for the patient. It waits for the prescription and certificate slots above; the appointment and the summary exist already as screens of their own.'),

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
  yuva('izotretinoin-gebelik-onleme', ['dermatoloji'], 'Pregnancy-prevention checks for isotretinoin: the programme the Uzbek regulator requires (tests, contraception, prescription validity).'),

  // ── endocrinology: the mechanism is in the kit; the numbers are local guidance and are not here ──
  yuva('lab-izlem', ['endokrinoloji'], 'HbA1c and TSH follow-up: the thresholds between the bands (12 numbers: two HbA1c cut-offs, four TSH limits, six intervals in months) from the national diabetes and thyroid protocols, with the reference range the local laboratories report for TSH.', KLINISYEN, true),
  yuva('dxa-tekrar', ['endokrinoloji'], 'Bone densitometry repeat: the years between two scans for a low, a medium and a high risk band (3 numbers) from the national osteoporosis protocol.', KLINISYEN, true),

  // ── infectious diseases ──
  yuva('viral-izlem', ['enfeksiyon-hastaliklari'], 'HIV and viral hepatitis follow-up: the months between two checks (3 numbers) from the national HIV and hepatitis protocols.', KLINISYEN, true),
  yuva('enfeksiyon-bildirim', ['enfeksiyon-hastaliklari'], 'Isolation and notification: the list of notifiable diseases in Uzbekistan, to whom and by when each is reported, the report form, and isolation periods from the national rules.'),

  // ── gastroenterology ──
  yuva('ibd-skor', ['gastroenteroloji'], 'Activity index follow-up (partial Mayo, Harvey-Bradshaw, IBS severity total): the cut-offs between remission, mild, moderate and severe and the months until the next check (13 numbers), as the local gastroenterology protocols state them.', KLINISYEN, true),
  yuva('hepatit-izlem', ['gastroenteroloji'], 'Hepatitis B and C follow-up: the months until the next check for a stable patient, one under active follow-up and one being assessed for treatment (3 numbers) from the national hepatitis programme.', KLINISYEN, true),
]
