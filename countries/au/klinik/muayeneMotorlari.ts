/**
 * AU gold depth — per-role Muayene (visit) engines for the .ulke-native visit screen.
 *
 * Option A (AU-DEPTH-PARITY): not a mount of TR specialty engine trees (SGK/e-Nabız/Turkish
 * copy). Each role gets an AU-adapted visit checklist + linked Araçlar keys + AU-vs-TR note.
 * Clinical thresholds stay on cited tools; this panel invents no dose, score or pathway hours.
 *
 * Shown on the visit setup screen for the account's role. Dietetics keeps ADIME note headings
 * (soapKilitleri) and the meal-plan suite; this engine still lists its visit prompts.
 */
import type { Sunulan } from './asistanAdlari'

export type AuMuayeneMotoru = {
  rol: Sunulan
  /** Short title on the visit panel. */
  baslik: string
  /** Three clinician prompts for this visit (en-AU). */
  kontrol: readonly [string, string, string]
  /** Existing AU tool keys useful mid-visit (may be empty). */
  araclar: readonly string[]
  /** AU-vs-TR difference for auditors / clinical leads. */
  auTr: string
}

export const AU_MUAYENE_MOTORLARI: Readonly<Record<Sunulan, AuMuayeneMotoru>> = {
  'emergency-medicine': {
    rol: 'emergency-medicine',
    baslik: 'After-care plan',
    kontrol: ['Disposition and safety-net wording as said', 'Medicines or scripts named at discharge', 'Follow-up venue and timing as said'],
    araclar: ['au-emergency-medicine-review', 'au-emergency-medicine-flags', 'au-emergency-medicine-care-plan', 'au-emergency-medicine-care-goals'],
    auTr: 'AU: Triple Zero (000) + Australasian Triage Scale context; TR: 112 + Acil Tip engines. No ATS score stored here.',
  },
  'family-medicine': {
    rol: 'family-medicine',
    baslik: 'Your GP care plan',
    kontrol: ['Long-term conditions and medicines if said', 'Preventive or wellness items named today only', 'Safety-net and Triple Zero when relevant'],
    araclar: ['au-family-medicine-review', 'au-family-medicine-flags', 'au-wellness-plan', 'au-immunisation-schedule', 'au-family-medicine-care-plan', 'au-family-medicine-care-goals'],
    auTr: 'AU: RACGP Red Book / MBS items as links; wellness inside GP. TR: aile hekimliği engines + SGK. No MBS item copied.',
  },
  'anaesthesia': {
    rol: 'anaesthesia',
    baslik: 'Before your anaesthetic',
    kontrol: ['Fasting instructions as given — do not invent hours', 'Airway and allergy history if said', 'Post-anaesthetic advice as said'],
    araclar: ['au-anaesthesia-review', 'au-anaesthesia-flags', 'au-anaesthesia-care-plan', 'au-anaesthesia-care-goals'],
    auTr: 'AU: ANZCA fasting culture; peri-op checklists. TR: anestezi engines. No fasting hours invented here.',
  },
  'neurosurgery': {
    rol: 'neurosurgery',
    baslik: 'Neurosurgery care plan',
    kontrol: ['Neurological findings only as stated', 'Wound and drain plan as said', 'Red-flag headache pathway if used'],
    araclar: ['au-neurosurgery-review', 'au-neurosurgery-flags', 'au-neurosurgery-care-plan', 'au-neurosurgery-care-goals'],
    auTr: 'AU: RACS / NSA pathways as clinician judgment. TR: beyin-cerrahisi engines. No grade stored.',
  },
  'paediatric-surgery': {
    rol: 'paediatric-surgery',
    baslik: 'Your child\'s surgery plan',
    kontrol: ['Parent/guardian history source if said', 'Wound and feeding plan as said', 'When to return — Triple Zero if said'],
    araclar: ['au-paediatric-surgery-review', 'au-paediatric-surgery-flags', 'au-paediatric-surgery-care-plan', 'au-paediatric-surgery-care-goals'],
    auTr: 'AU: parent/guardian wording by age; RACS paediatric. TR: cocuk-cerrahisi. No dose invented.',
  },
  'internal-medicine': {
    rol: 'internal-medicine',
    baslik: 'Physician care plan',
    kontrol: ['Problem list and medicines if said', 'Home readings the physician asked for', 'Results to chase as said'],
    araclar: ['au-internal-medicine-review', 'au-internal-medicine-flags', 'au-internal-medicine-care-plan', 'au-internal-medicine-care-goals'],
    auTr: 'AU: RACP physician practice; PBS/MHR. TR: dahiliye engines + SGK. No score invented.',
  },
  'dermatology': {
    rol: 'dermatology',
    baslik: 'Skin care plan',
    kontrol: ['Lesion description as said — no score invented', 'Photograph consent if images kept', 'Review timing as said'],
    araclar: ['au-dermatology-review', 'au-dermatology-flags', 'au-dermatology-care-plan', 'au-dermatology-care-goals'],
    auTr: 'AU: ACD; photographs in practice record. TR: dermatoloji + Derim portal. No morphology score here.',
  },
  'endocrinology': {
    rol: 'endocrinology',
    baslik: 'Hormone care plan',
    kontrol: ['Home glucose or hormone readings if asked', 'Medicines exactly as said', 'Sick-day or safety advice if said'],
    araclar: ['au-endocrinology-review', 'au-endocrinology-flags', 'au-endocrinology-care-plan', 'au-endocrinology-care-goals'],
    auTr: 'AU: ADS/ESA practice; glucose mmol/L. TR: endokrinoloji engines. No target invented.',
  },
  'infectious-diseases': {
    rol: 'infectious-diseases',
    baslik: 'Infection care plan',
    kontrol: ['Course and precautions as said', 'Notifiable-disease pathway only if used and named', 'Review timing as said'],
    araclar: ['au-infectious-diseases-review', 'au-infectious-diseases-flags', 'au-infectious-diseases-care-plan', 'au-infectious-diseases-care-goals'],
    auTr: 'AU: CDNA notifiable list (doctors). TR: enfeksiyon + bildirim. No notice sent from this panel.',
  },
  'gastroenterology': {
    rol: 'gastroenterology',
    baslik: 'Digestive care plan',
    kontrol: ['Symptoms and alarm features as said', 'Prep instructions as given — no invented hours', 'Procedure or review plan as said'],
    araclar: ['au-gastroenterology-review', 'au-gastroenterology-flags', 'au-gastroenterology-care-plan', 'au-gastroenterology-care-goals'],
    auTr: 'AU: GESA; bowel-prep clinician wording. TR: gastroenteroloji engines. No prep hours invented.',
  },
  'general-surgery': {
    rol: 'general-surgery',
    baslik: 'Surgery care plan',
    kontrol: ['Indication and consent discussion if said', 'Wound and activity plan as said', 'Review timing as said'],
    araclar: ['au-general-surgery-review', 'au-general-surgery-flags', 'au-general-surgery-care-plan', 'au-general-surgery-care-goals'],
    auTr: 'AU: RACS. TR: genel-cerrahi engines. No protocol copied.',
  },
  'respiratory-medicine': {
    rol: 'respiratory-medicine',
    baslik: 'Breathing care plan',
    kontrol: ['Inhaler technique discussion if said', 'Oxygen or action-plan wording if said', 'Review and safety-net as said'],
    araclar: ['au-respiratory-medicine-review', 'au-respiratory-medicine-flags', 'au-respiratory-medicine-care-plan', 'au-respiratory-medicine-care-goals'],
    auTr: 'AU: TSANZ; inhaler technique clinician-owned. TR: gogus-hastaliklari. No spirometry band invented.',
  },
  'ophthalmology': {
    rol: 'ophthalmology',
    baslik: 'Eye care plan',
    kontrol: ['Vision or pressure numbers only if spoken', 'Drop regimen as said — no invented dose', 'Urgent vision-loss pathway if used'],
    araclar: ['au-ophthalmology-review', 'au-ophthalmology-flags', 'au-ophthalmology-care-plan', 'au-ophthalmology-care-goals'],
    auTr: 'AU: RANZCO; VA not interpreted on portal. TR: goz engines + Gözlerim. No IOP colour here.',
  },
  'obstetrics-gynaecology': {
    rol: 'obstetrics-gynaecology',
    baslik: 'Pregnancy or gynaecology plan',
    kontrol: ['Pregnancy status only if said', 'Bleeding/pain safety-net if used', 'Antenatal or gynaecology plan as said'],
    araclar: ['au-obstetrics-gynaecology-review', 'au-obstetrics-gynaecology-flags', 'au-obstetrics-gynaecology-care-plan', 'au-obstetrics-gynaecology-care-goals'],
    auTr: 'AU: RANZCOG; antenatal schedule clinician-owned. TR: kadin-dogum + Gebeliğim. No gestation calculator here.',
  },
  'cardiology': {
    rol: 'cardiology',
    baslik: 'Heart care plan',
    kontrol: ['Symptoms and home BP if said', 'CVD risk link is separate — not calculated here', 'Chest-pain safety-net if used'],
    araclar: ['au-cardiology-review', 'au-cardiology-flags', 'au-cvd-risk-link', 'au-cardiology-care-plan', 'au-cardiology-care-goals'],
    auTr: 'AU: CSANZ; Absolute CVD risk is link-out only. TR: kardiyoloji SCORE2-style engines. No equation copied.',
  },
  'otolaryngology': {
    rol: 'otolaryngology',
    baslik: 'ENT care plan',
    kontrol: ['Hearing/throat findings as said', 'Device or post-op advice as said', 'Airway bleeding pathway if used'],
    araclar: ['au-otolaryngology-review', 'au-otolaryngology-flags', 'au-otolaryngology-care-plan', 'au-otolaryngology-care-goals'],
    auTr: 'AU: ASOHNS. TR: KBB engines. No audiogram thresholds invented.',
  },
  'nephrology': {
    rol: 'nephrology',
    baslik: 'Kidney care plan',
    kontrol: ['Fluid and medicines as said', 'Dialysis access issues only if said', 'Hyperkalaemia pathway if used'],
    araclar: ['au-nephrology-review', 'au-nephrology-flags', 'au-nephrology-care-plan', 'au-nephrology-care-goals'],
    auTr: 'AU: ANZSN; eGFR not colour-banded here. TR: nefroloji engines. No CKD stage invented.',
  },
  'neurology': {
    rol: 'neurology',
    baslik: 'Neurology care plan',
    kontrol: ['Seizure or stroke features as said', 'Medicines exactly as said', 'Stroke/status pathway if used'],
    araclar: ['au-neurology-review', 'au-neurology-flags', 'au-neurology-care-plan', 'au-neurology-care-goals'],
    auTr: 'AU: ANZAN; stroke → Triple Zero. TR: noroloji engines. No NIHSS stored.',
  },
  'oncology': {
    rol: 'oncology',
    baslik: 'Oncology care plan',
    kontrol: ['Treatment intent as said — no dose', 'Supportive care as said', 'Febrile neutropenia pathway if used'],
    araclar: ['au-oncology-review', 'au-oncology-flags', 'au-oncology-care-plan', 'au-oncology-care-goals'],
    auTr: 'AU: COSA/MOGA; ECOG grade tool exists separately. TR: onkoloji + SUT. No dose here.',
  },
  'orthopaedics': {
    rol: 'orthopaedics',
    baslik: 'Bone and joint plan',
    kontrol: ['Neurovascular findings as said', 'Brace/weight-bearing as said', 'Compartment pathway if used'],
    araclar: ['au-orthopaedics-review', 'au-orthopaedics-flags', 'au-orthopaedics-care-plan', 'au-orthopaedics-care-goals'],
    auTr: 'AU: AOA; no concussion protocol copied. TR: ortopedi engines. No Ottawa rules stored.',
  },
  'paediatrics': {
    rol: 'paediatrics',
    baslik: 'Your child\'s care plan',
    kontrol: ['Growth numbers only if spoken — no invented percentile', 'Immunisation only doses named today', 'Fever/safety-net for Triple Zero if said'],
    araclar: ['au-paediatrics-review', 'au-paediatrics-flags', 'au-body-size', 'au-immunisation-schedule', 'au-immunisation-cohort', 'au-paediatrics-care-plan', 'au-paediatrics-care-goals'],
    auTr: 'AU: WHO growth + NIP; CDC/ANZSPED still open for 2–18. TR: pediatri engines (asi/buyume/doz). No invented percentile.',
  },
  'plastic-surgery': {
    rol: 'plastic-surgery',
    baslik: 'Reconstructive care plan',
    kontrol: ['Reconstructive plan as said', 'Wound care as said', 'Not the cosmetic cooling-off studio unless that role'],
    araclar: ['au-plastic-surgery-review', 'au-plastic-surgery-flags', 'au-plastic-surgery-care-plan', 'au-plastic-surgery-care-goals'],
    auTr: 'AU: ASPS; reconstructive ≠ cosmetic cooling-off. TR: plastik-cerrahi. No flap score here.',
  },
  'psychiatry': {
    rol: 'psychiatry',
    baslik: 'Psychiatry care plan',
    kontrol: ['Risk discussion as said — no score on note fields beyond K10 tool', 'Medicines exactly as said', 'Crisis pathway if used'],
    araclar: ['au-psychiatry-review', 'au-psychiatry-flags', 'au-psychiatry-care-plan', 'au-psychiatry-care-goals'],
    auTr: 'AU: RANZCP; K10 is separate screen tool. TR: psikiyatri. No diagnosis on portal.',
  },
  'radiology': {
    rol: 'radiology',
    baslik: 'Imaging prep plan',
    kontrol: ['Indication and prep as said', 'Contrast allergy history if said', 'Critical-result pathway if used'],
    araclar: ['au-radiology-review', 'au-radiology-flags', 'au-radiology-care-plan', 'au-radiology-care-goals'],
    auTr: 'AU: RANZCR; report explained by referrer. TR: radyoloji. No BIRADS stored.',
  },
  'rheumatology': {
    rol: 'rheumatology',
    baslik: 'Joint care plan',
    kontrol: ['Joint findings as said — no DAS', 'Infusion or medicine plan as said', 'Septic joint pathway if used'],
    araclar: ['au-rheumatology-review', 'au-rheumatology-flags', 'au-rheumatology-care-plan', 'au-rheumatology-care-goals'],
    auTr: 'AU: ARA; no DAS copied. TR: romatoloji. No score here.',
  },
  'urology': {
    rol: 'urology',
    baslik: 'Urology care plan',
    kontrol: ['Urinary findings as said', 'Catheter or device plan as said', 'Torsion pathway if used'],
    araclar: ['au-urology-review', 'au-urology-flags', 'au-urology-care-plan', 'au-urology-care-goals'],
    auTr: 'AU: USANZ. TR: uroloji. No lab number on portal.',
  },
  'sports-medicine': {
    rol: 'sports-medicine',
    baslik: 'Return-to-activity plan',
    kontrol: ['Injury mechanism as said', 'Return-to-activity wording as said — no invented day', 'Cervical/collapse pathway if used'],
    araclar: ['au-sports-medicine-review', 'au-sports-medicine-flags', 'au-sports-medicine-care-plan', 'au-sports-medicine-care-goals'],
    auTr: 'AU: ACSEP; no concussion protocol copied. TR: spor-hekimligi. No RTP day invented.',
  },
  'rehabilitation-medicine': {
    rol: 'rehabilitation-medicine',
    baslik: 'Rehabilitation plan',
    kontrol: ['Function goals as said', 'Home exercise plan as said', 'Autonomic crisis pathway if used'],
    araclar: ['au-rehabilitation-medicine-review', 'au-rehabilitation-medicine-flags', 'au-rehabilitation-medicine-care-plan', 'au-rehabilitation-medicine-care-goals'],
    auTr: 'AU: AFRM. TR: fizik-tedavi. No FIM copied.',
  },
  'aesthetic-surgery': {
    rol: 'aesthetic-surgery',
    baslik: 'Cosmetic surgery plan',
    kontrol: ['Cooling-off and consent timing — use cosmetic plan tool', 'Photograph consent if images', 'Post-op availability as said'],
    araclar: ['au-cosmetic-surgery-plan', 'au-aesthetic-surgery-flags', 'au-aesthetic-surgery-care-plan', 'au-aesthetic-surgery-care-goals'],
    auTr: 'AU: Medical Board cosmetic surgery guidelines (cooling-off). TR: estetik-cerrahi. Plan tool already exists.',
  },
  'aesthetic-medicine': {
    rol: 'aesthetic-medicine',
    baslik: 'Cosmetic care plan',
    kontrol: ['Non-surgical plan including hair transplant if relevant', 'Photograph consent if images', 'Vascular occlusion pathway if used'],
    araclar: ['au-nonsurgical-plan', 'au-aesthetic-medicine-flags', 'au-aesthetic-medicine-care-plan', 'au-aesthetic-medicine-care-goals'],
    auTr: 'AU: Board non-surgical + hair transplant under this role. TR: medikal-estetik/sac-ekimi. No filler dose.',
  },
  'physiotherapy': {
    rol: 'physiotherapy',
    baslik: 'Movement plan',
    kontrol: ['Functional findings as said — no medical diagnosis', 'Home exercise dose as said by the physiotherapist', 'Cauda/chest pathway if used'],
    araclar: ['au-physio-plan', 'au-physiotherapy-flags', 'au-physiotherapy-care-plan', 'au-physiotherapy-care-goals'],
    auTr: 'AU: APA; no medical diagnosis. TR: fizyoterapi. Session plan already exists; this adds coaching depth.',
  },
  'clinical-psychology': {
    rol: 'clinical-psychology',
    baslik: 'Session plan',
    kontrol: ['Session focus as said — no diagnosis on portal', 'Between-session practice as said', 'Safety pathway if used — no photograph line'],
    araclar: ['au-psychology-plan', 'au-clinical-psychology-flags', 'au-mental-health-screen', 'au-clinical-psychology-care-plan', 'au-clinical-psychology-care-goals'],
    auTr: 'AU: APS; no photograph line; K10 separate. TR: klinik-psikolog. No score on portal.',
  },
  'occupational-therapy': {
    rol: 'occupational-therapy',
    baslik: 'Daily-activity plan',
    kontrol: ['Occupational goals as said', 'Home/work task plan as said', 'Medical emergency pathway if used'],
    araclar: ['au-ot-plan', 'au-occupational-therapy-flags', 'au-occupational-therapy-care-plan', 'au-occupational-therapy-care-goals'],
    auTr: 'AU: OT Australia; no medical diagnosis. TR: ergoterapi.',
  },
  'audiology': {
    rol: 'audiology',
    baslik: 'Hearing care plan',
    kontrol: ['Hearing results stay in hearing tools', 'Device plan as said', 'Sudden hearing-loss pathway if used'],
    araclar: ['au-audiology-plan', 'au-audiology-flags', 'au-audiology-care-plan', 'au-audiology-care-goals'],
    auTr: 'AU: Audiology Australia; hearing figures stay in hearing tools. TR: odyoloji.',
  },
  'cardio-thoracic-surgery': {
    rol: 'cardio-thoracic-surgery',
    baslik: 'Chest surgery plan',
    kontrol: ['Operative findings as said', 'Drain/wound plan as said', 'Tamponade pathway if used'],
    araclar: ['au-cardio-thoracic-surgery-review', 'au-cardio-thoracic-surgery-flags', 'au-cardio-thoracic-surgery-care-plan', 'au-cardio-thoracic-surgery-care-goals'],
    auTr: 'AU: Board split cardio-thoracic (not TR thoracic alone). TR: gogus-cerrahisi.',
  },
  'vascular-surgery': {
    rol: 'vascular-surgery',
    baslik: 'Vascular care plan',
    kontrol: ['Limb/vascular findings as said', 'Walking or wound plan as said', 'Ischaemia/rupture pathway if used'],
    araclar: ['au-vascular-surgery-review', 'au-vascular-surgery-flags', 'au-vascular-surgery-care-plan', 'au-vascular-surgery-care-goals'],
    auTr: 'AU: Board vascular split. TR: kalp-damar-cerrahisi vessel half.',
  },
  'radiation-oncology': {
    rol: 'radiation-oncology',
    baslik: 'Radiotherapy plan',
    kontrol: ['Treatment site as said — no dose', 'Skin/nutrition care as said', 'Cord compression pathway if used'],
    araclar: ['au-radiation-oncology-review', 'au-radiation-oncology-flags', 'au-radiation-oncology-care-plan', 'au-radiation-oncology-care-goals'],
    auTr: 'AU: RANZCR RO; no dose stored. TR: covered under onkoloji chapter depth.',
  },
  'geriatric-medicine': {
    rol: 'geriatric-medicine',
    baslik: 'Later-life care plan',
    kontrol: ['Medicines list and falls if said', 'Cognition notes as said — no score invented', 'Sepsis/delirium pathway if used'],
    araclar: ['au-geriatric-medicine-review', 'au-geriatric-medicine-flags', 'au-geriatric-medicine-care-plan', 'au-geriatric-medicine-care-goals'],
    auTr: 'AU: ANZSGM; medicines list culture. TR: maps to dahiliye-like depth.',
  },
  'immunology-and-allergy': {
    rol: 'immunology-and-allergy',
    baslik: 'Allergy care plan',
    kontrol: ['Action plan discussion if said', 'Adrenaline device plan as said', 'Anaphylaxis pathway if used'],
    araclar: ['au-immunology-and-allergy-review', 'au-immunology-and-allergy-flags', 'au-immunology-and-allergy-care-plan', 'au-immunology-and-allergy-care-goals'],
    auTr: 'AU: ASCIA action plans clinician-owned. TR: immunology not a separate TR chapter key.',
  },
  'haematology': {
    rol: 'haematology',
    baslik: 'Blood care plan',
    kontrol: ['Bleeding or counts only if said — no invented band', 'Transfusion plan as said', 'Major haemorrhage pathway if used'],
    araclar: ['au-haematology-review', 'au-haematology-flags', 'au-haematology-care-plan', 'au-haematology-care-goals'],
    auTr: 'AU: HSANZ. TR: maps to dahiliye/onko adjacent.',
  },
  'pain-medicine': {
    rol: 'pain-medicine',
    baslik: 'Pain care plan',
    kontrol: ['Pain plan as said — no opioid arithmetic', 'Functional goals as said', 'Respiratory depression pathway if used'],
    araclar: ['au-pain-medicine-review', 'au-pain-medicine-flags', 'au-pain-medicine-care-plan', 'au-pain-medicine-care-goals'],
    auTr: 'AU: FPM ANZCA; no opioid dose invented. TR: maps to rehab/pain adjacent.',
  },
  'podiatry': {
    rol: 'podiatry',
    baslik: 'Foot care plan',
    kontrol: ['Foot findings as said', 'Footwear plan as said', 'Rapid infection pathway if used'],
    araclar: ['au-podiatry-review', 'au-podiatry-flags', 'au-podiatry-care-plan', 'au-podiatry-care-goals'],
    auTr: 'AU: Podiatry Board / APodA. TR: no direct pediatri equivalent — AU-only allied.',
  },
  'speech-pathology': {
    rol: 'speech-pathology',
    baslik: 'Speech and swallow plan',
    kontrol: ['Swallow/speech findings as said — IDDSI with dietetics tool if used', 'Home practice as said', 'Airway/choking pathway if used'],
    araclar: ['au-speech-pathology-review', 'au-speech-pathology-flags', 'au-speech-pathology-care-plan', 'au-speech-pathology-care-goals'],
    auTr: 'AU: SPA; IDDSI shared with dietetics. TR: no direct chapter — AU-only allied.',
  },
  'dietetics': {
    rol: 'dietetics',
    baslik: 'Dietetics visit (ADIME)',
    kontrol: ['Nutrition history and measures as said — ADIME headings on the note', 'Goals and intervention as agreed with the client', 'Safety: refeeding or anaphylaxis pathway if used'],
    araclar: ['au-dietetics-plan', 'au-mst-score', 'au-meal-plan', 'au-nutrition-goals', 'au-dietetics-flags'],
    auTr: 'AU: ADIME + Dietitians Australia scope; kJ not kcal; IDDSI shared with speech pathology. TR: diyetisyen chapter engines. No AUSNUT database.',
  },
}

export function auMuayeneMotoru(rol: string | null | undefined): AuMuayeneMotoru | null {
  if (!rol) return null
  return AU_MUAYENE_MOTORLARI[rol as Sunulan] ?? null
}
