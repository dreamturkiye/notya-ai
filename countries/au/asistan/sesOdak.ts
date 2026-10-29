/**
 * AU-PEDIATRI-GOLD-01a — specialty voice lines for the Australian live assistant.
 *
 * Counterpart of TR specialistsCatalog `clinicalFocus` + ÇAYD-style red-flag spoken lines.
 * Injected into auAsistanKaynakBlogu (./kaynaklar.ts). Short bullets only (voice latency).
 * No dose arithmetic. No diagnosis for a particular patient. Emergency → Triple Zero (000).
 */
import type { Sunulan } from '../klinik/asistanAdlari'

export type AuSesOdak = {
  /** Clinical focus lines for this role (national-first practice). */
  readonly odak: readonly string[]
  /** One spoken emergency pathway line for this role. */
  readonly acil: string
}

const sifir = (ne: string) =>
  `If ${ne}, say to call Triple Zero (000) first, then give immediate steps in a few words. The clinician decides.`

export const AU_SES_ODAK: Readonly<Record<Sunulan, AuSesOdak>> = {
  'emergency-medicine': {
    odak: ['ACEM practice and Therapeutic Guidelines for antimicrobials.', 'Triage and disposition stay with the clinician.', 'Australian Approved Names for medicines.'],
    acil: sifir('airway compromise, anaphylaxis, cardiac arrest, major trauma or uncontrolled bleeding'),
  },
  'family-medicine': {
    odak: ['RACGP preventive activities and Australian Medicines Handbook.', 'NIP milestones and Handbook catch-up are reference only.', 'Wellness reviews are general practice, not a specialist title.'],
    acil: sifir('chest pain, stroke signs, severe breathlessness, anaphylaxis, or a fever in a baby under three months'),
  },
  anaesthesia: {
    odak: ['ANZCA professional documents and acute pain evidence.', 'Fasting and airway plans stay with the anaesthetist.', 'No dose is calculated here.'],
    acil: sifir('cannot intubate/cannot oxygenate, anaphylaxis under anaesthesia, or malignant hyperthermia suspicion'),
  },
  neurosurgery: {
    odak: ['RACS neurosurgery and Neurosurgical Society of Australasia sources.', 'Wound and drain plans stay in the note the surgeon keeps.'],
    acil: sifir('sudden severe headache with neurology change, fixed dilated pupil, or post-operative wound bursting with neurological decline'),
  },
  'paediatric-surgery': {
    odak: ['RACS paediatric surgery and RCH clinical practice guidelines as reference.', 'Guardian wording follows the child\'s age.'],
    acil: sifir('bilious vomiting in an infant, suspected testicular torsion, or airway obstruction after surgery'),
  },
  'internal-medicine': {
    odak: ['RACP adult medicine, Therapeutic Guidelines, Australian Medicines Handbook.', 'No laboratory panel is invented.'],
    acil: sifir('sepsis suspicion, acute coronary syndrome, or respiratory failure'),
  },
  dermatology: {
    odak: ['Australasian College of Dermatologists and Therapeutic Guidelines: Dermatology.', 'Images stay under Documents with consent.'],
    acil: sifir('anaphylaxis after a medicine or procedure, or rapidly progressive soft-tissue infection with systemic toxicity'),
  },
  endocrinology: {
    odak: ['Endocrine Society of Australia and Australian Diabetes Society sources.', 'Home readings stay in the clinician\'s note.'],
    acil: sifir('diabetic ketoacidosis suspicion, adrenal crisis, or severe hypoglycaemia with reduced consciousness'),
  },
  'infectious-diseases': {
    odak: ['ASID, CDNA national guidelines, Australian Immunisation Handbook.', 'Notifiable conditions differ by state — say which jurisdiction.'],
    acil: sifir('sepsis, meningism, or suspected viral haemorrhagic presentation'),
  },
  gastroenterology: {
    odak: ['GESA guidelines and Therapeutic Guidelines: Gastrointestinal.', 'Preparation instructions stay as given at the visit.'],
    acil: sifir('massive gastrointestinal bleeding, acute severe colitis with shock, or biliary sepsis'),
  },
  'general-surgery': {
    odak: ['RACS general surgery and General Surgeons Australia sources.', 'Wound care stays in the visit note.'],
    acil: sifir('peritonitis, airway-compromising neck haematoma, or uncontrolled post-operative bleeding'),
  },
  'respiratory-medicine': {
    odak: ['TSANZ, Australian Asthma Handbook, Lung Foundation Australia.', 'Inhaler technique is separate from this chat.'],
    acil: sifir('life-threatening asthma, tension pneumothorax suspicion, or massive haemoptysis'),
  },
  ophthalmology: {
    odak: ['RANZCO clinical statements and NHMRC glaucoma guidance.', 'Visual acuity figures stay on their own tool.'],
    acil: sifir('sudden vision loss, chemical eye injury, or orbital cellulitis with systemic toxicity'),
  },
  'obstetrics-gynaecology': {
    odak: ['RANZCOG practice and Australian Medicines Handbook in pregnancy.', 'Bleeding or pain that worries the patient is not a portal message.'],
    acil: sifir('heavy vaginal bleeding with shock, eclampsia, or shoulder dystocia'),
  },
  cardiology: {
    odak: ['CSANZ and Heart Foundation sources; CVD calculator stays a link-out.', 'No equation is copied here.'],
    acil: sifir('ST-elevation infarction suspicion, cardiac arrest, or cardiogenic shock'),
  },
  otolaryngology: {
    odak: ['ASOHNS practice sources.', 'Hearing figures stay in the hearing tool.'],
    acil: sifir('airway obstruction, post-tonsillectomy haemorrhage, or deep neck infection with sepsis'),
  },
  nephrology: {
    odak: ['Kidney Health Australia and RACP nephrology sources.', 'No eGFR colour band is invented here.'],
    acil: sifir('hyperkalaemia with ECG change, pulmonary oedema from fluid overload, or dialysis access life-threatening bleed'),
  },
  neurology: {
    odak: ['ANZAN practice sources.', 'Sudden weakness or seizure is not a portal message.'],
    acil: sifir('stroke signs, status epilepticus, or meningism with reduced consciousness'),
  },
  oncology: {
    odak: ['eviQ protocols as clinician reference; Cancer Council Australia.', 'No dose is named in spoken answers.'],
    acil: sifir('febrile neutropenia, tumour lysis with arrhythmia, or airway compression'),
  },
  orthopaedics: {
    odak: ['RACS orthopaedics and AOA sources.', 'No concussion protocol is copied.'],
    acil: sifir('compartment syndrome, neurovascular compromise after fracture, or septic arthritis with sepsis'),
  },
  paediatrics: {
    odak: ['RACP paediatrics, Australian Immunisation Handbook, RCH guidelines as reference.', 'WHO LMS growth figures are raw measurements only — invent no percentile in speech.', 'Fever under three months, sepsis and meningism are emergency pathways.'],
    acil: sifir('a fever in a baby under three months, petechiae with fever, severe respiratory distress, or anaphylaxis'),
  },
  'plastic-surgery': {
    odak: ['ASPS and RACS plastic surgery sources.', 'This is not the cosmetic-surgery booking plan.'],
    acil: sifir('flap failure with systemic toxicity, airway compromise after head and neck reconstruction, or uncontrolled bleed'),
  },
  psychiatry: {
    odak: ['RANZCP practice sources.', 'No score and no diagnosis is invented in speech.'],
    acil: sifir('immediate risk of suicide, homicide, or acute behavioural disturbance with medical instability'),
  },
  radiology: {
    odak: ['RANZCR standards.', 'No reporting category including BI-RADS is invented.'],
    acil: sifir('tension pneumothorax on imaging with instability, or contrast anaphylaxis'),
  },
  rheumatology: {
    odak: ['ARA practice sources.', 'No disease-activity score is invented.'],
    acil: sifir('septic arthritis suspicion, or anaphylaxis to an infusion'),
  },
  urology: {
    odak: ['USANZ practice sources.', 'No laboratory number is invented.'],
    acil: sifir('testicular torsion suspicion, Fournier gangrene, or clot retention with instability'),
  },
  'sports-medicine': {
    odak: ['ACSEP practice sources.', 'Return-to-play stays with the clinician.'],
    acil: sifir('suspected cervical spine injury, exertional collapse, or anaphylaxis on the field'),
  },
  'rehabilitation-medicine': {
    odak: ['RACP rehabilitation medicine sources.', 'No FIM or outcome measure is copied.'],
    acil: sifir('autonomic dysreflexia with crisis, or acute chest pain during therapy'),
  },
  'cardio-thoracic-surgery': {
    odak: ['RACS cardio-thoracic sources.', 'This is not the cardiology check.'],
    acil: sifir('post-operative tamponade suspicion, massive haemothorax, or airway emergency after chest surgery'),
  },
  'vascular-surgery': {
    odak: ['ANZSVS and RACS vascular sources.', 'This is not the cardiology check.'],
    acil: sifir('ruptured aneurysm suspicion, acute limb ischaemia, or anastomotic blow-out'),
  },
  'radiation-oncology': {
    odak: ['RANZCR radiation oncology and eviQ protocols as reference.', 'No dose is named in speech.'],
    acil: sifir('airway obstruction from tumour, spinal cord compression, or severe radiation reaction with systemic toxicity'),
  },
  'geriatric-medicine': {
    odak: ['RACP geriatric medicine and RACGP aged care guide.', 'Bring the medicines list — nothing is stored as a dose here.'],
    acil: sifir('delirium with medical instability, hip fracture with shock, or sepsis in a frail patient'),
  },
  'immunology-and-allergy': {
    odak: ['ASCIA anaphylaxis guidelines and action plans.', 'Australian Immunisation Handbook for vaccine allergy questions.'],
    acil: sifir('anaphylaxis — call Triple Zero (000), lie the person flat, and use adrenaline if an action plan says so'),
  },
  haematology: {
    odak: ['HSANZ and National Blood Authority patient blood management.', 'No laboratory number invented.'],
    acil: sifir('major haemorrhage, acute chest syndrome, or febrile neutropenia'),
  },
  'pain-medicine': {
    odak: ['ANZCA Faculty of Pain Medicine evidence.', 'No dose is named in speech.'],
    acil: sifir('opioid-induced respiratory depression, or anaphylaxis to an injected medicine'),
  },
  'aesthetic-surgery': {
    odak: ['Medical Board cosmetic surgery guidelines.', 'Cooling-off and consent timing stay on the booking plan tool.'],
    acil: sifir('airway compromise after facial procedures, or uncontrolled post-operative bleeding'),
  },
  'aesthetic-medicine': {
    odak: ['Medical Board non-surgical cosmetic guidelines; hair transplantation is named here.', 'Images stay in the practice record.'],
    acil: sifir('anaphylaxis after a filler or toxin, or vascular occlusion suspicion after filler'),
  },
  physiotherapy: {
    odak: ['Australian Physiotherapy Association guidelines.', 'No medical diagnosis.'],
    acil: sifir('suspected cauda equina, cervical fracture, or chest pain during exercise'),
  },
  'clinical-psychology': {
    odak: ['Australian Psychological Society evidence reviews.', 'No diagnosis invented; no photograph line.'],
    acil: sifir('immediate risk of suicide or harm to others — call Triple Zero (000) and stay with the person if safe'),
  },
  dietetics: {
    odak: [
      'Dietitians Australia — practising dietitian scope. You do not make a medical diagnosis.',
      'Malnutrition: MST score is recorded from the form (questions not spoken as a script); ≥2 usually prompts full assessment.',
      'Energy for Australian care: kilojoules (kJ), not kilocalories. Factors the dietitian chooses; estimates are a starting point to reassess.',
      'IDDSI food and drink levels are shared with speech pathology; do not alter framework level meaning.',
      'Australian Dietary Guidelines, Dietitians Australia competency standards, and NEMO support materials are binding for Australian practice; national sources win on conflict.',
      'United States depth: Dietary Guidelines for Americans, Academy of Nutrition and Dietetics Nutrition Care Manual, Evidence Analysis Library, and Nutrition Care Process — use when the client\'s care or report is US-oriented (intake may name usual place of care). Still do not invent a US licence claim.',
      'When AU and US guidance differ for the same client question, say both briefly and which applies to this care setting; the clinician decides.',
      'Lab values (HbA1c, glucose, lipids, albumin, ferritin, B12, folate, electrolytes): quote units as recorded; do not invent a reference interval or a diagnosis from a number alone.',
    ],
    acil: sifir('suspected refeeding syndrome with instability, anaphylaxis to a food challenge, or uncontrolled vomiting with reduced consciousness'),
  },
  'occupational-therapy': {
    odak: ['Occupational Therapy Australia professional standards.', 'No medical diagnosis.'],
    acil: sifir('acute chest pain during activity, or a fall with head injury and reduced consciousness'),
  },
  audiology: {
    odak: ['Audiology Australia practice standards and NAL sources.', 'Bring the device if used.'],
    acil: sifir('sudden hearing loss with neurological signs, or severe vertigo with new neurological deficit'),
  },
  podiatry: {
    odak: ['Australian Podiatry Association and diabetes-related foot disease guidelines.', 'Where a podiatrist prescribes, PBS rules stay with the clinician.'],
    acil: sifir('rapidly progressive foot infection with systemic toxicity, or acute Charcot with skin breach and fever'),
  },
  'speech-pathology': {
    odak: ['Speech Pathology Australia practice guidelines.', 'No therapy protocol copied.'],
    acil: sifir('acute airway obstruction, or choking with inability to breathe'),
  },
}

/** Prompt block for the live assistant. null = not an offered role. */
export function auSesOdakBlogu(rol: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(AU_SES_ODAK, rol)) return null
  const s = AU_SES_ODAK[rol as Sunulan]
  return [
    '=== CLINICAL FOCUS FOR THIS ROLE (spoken, short) ===',
    ...s.odak.map((x) => `• ${x}`),
    '=== EMERGENCY PATHWAY ===',
    `• ${s.acil}`,
  ].join('\n')
}
