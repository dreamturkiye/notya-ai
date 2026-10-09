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
]
