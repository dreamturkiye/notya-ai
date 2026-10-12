/**
 * NOTYA-ULKE-INTAKE-02 — extra questions that bring each role toward the depth of a full intake, and the red-flag
 * box. MACHINE-WRITTEN. AWAITS A CLINICIAN OF EACH ROLE IN EACH COUNTRY. PATIENT-FACING.
 *
 * THE EMERGENCY NUMBER IS NOT HERE. The help line holds the token `{{ACIL}}`. The country pack replaces it with its
 * own sentence (one number: 911, 999, 000, 111 or 103) when the form is assembled. This file names no country and no number.
 *
 * A red-flag list is a machine's choice of everyday symptoms, not a signed triage rule and not an instruction beyond
 * the country's own sentence. The safety question on psychiatry and clinical psychology is the same: a clinician
 * reviews a "yes", and the clinic's procedure for an unattended form is still open.
 *
 * NO REFERENCE CONTENT. No drug, dose, schedule or score.
 */
import type { EnRol } from '../roller'
import { cok, eh, HICBIRI, kisa, s, type HamSecenek, type HamRol, type HamSoru } from './yardimci'

/** Replaced with the country's emergency sentence. Never a number of any country. */
export const ACIL_JETONU = '{{ACIL}}'

/** Used only when a pack forgets its sentence: no number, so the wrong country's number cannot be shown. */
export const VARSAYILAN_ACIL = 'If any of these is happening now, do not wait to finish this form. Seek emergency care at once. This form does not replace emergency care.'

const GUVENLIK = new Set<string>(['psychiatry', 'clinical-psychology'])

const kirmizi = (anahtar: string, secenekler: readonly HamSecenek[]): HamSoru => cok(
  anahtar,
  'Is any of these happening now?',
  [...secenekler.map((o) => ({ ...o })), HICBIRI()],
  { zorunlu: true, yardim: ACIL_JETONU, veliMetni: 'Is any of these happening to the child now?' },
)

const guvenlik = (anahtar: string): HamSoru => eh(
  anahtar,
  'In the last two weeks, have there been thoughts of suicide or of self-harm?',
  'A few words, if you can say',
  {
    zorunlu: true,
    yardim: `${ACIL_JETONU} A clinician reviews this answer before the visit.`,
    veliMetni: 'In the last two weeks, has the child spoken of suicide or of self-harm, or has anyone been worried about their safety?',
  },
)

const o = (...satirlar: readonly (readonly [string, string])[]): HamSecenek[] => satirlar.map(([anahtar, ad]) => s(anahtar, ad))

const gogus = o(
  ['chest', 'Chest pain or pressure'],
  ['breath', 'Sudden or severe shortness of breath'],
  ['faint', 'Fainting or loss of consciousness'],
  ['stroke', 'Face droop, trouble speaking, or sudden weakness'],
  ['bleed', 'Heavy bleeding'],
  ['throat', 'Swelling of the tongue or throat, or trouble breathing'],
)
const noro = o(
  ['face', 'Sudden face droop'],
  ['speech', 'Sudden trouble speaking'],
  ['weak', 'Sudden weakness of an arm or a leg'],
  ['vision', 'Sudden loss of vision or double vision'],
  ['headache', 'The worst headache of one\'s life, starting suddenly'],
  ['conscious', 'A change in consciousness or fainting'],
)
const karin = o(
  ['pain', 'Severe belly pain with fever or vomiting'],
  ['bleed', 'Heavy bleeding, in vomit or in the stool'],
  ['hernia', 'A bulge that will not go back and is painful or red'],
  ['wound', 'Fever, or a wound that is red or draining, after an operation'],
  ['block', 'Vomiting, and no stool or gas'],
)
const cilt = o(
  ['rash_fever', 'A widespread rash with fever'],
  ['throat', 'Trouble breathing, or swelling of the tongue or throat'],
  ['mouth_eyes', 'Sores in the mouth and eyes, with a rash'],
  ['blisters', 'Widespread blisters'],
  ['red_all', 'Redness spreading over most of the body'],
  ['painful_red', 'A very painful redness or swelling that is spreading quickly'],
)
const goz = o(
  ['vision', 'Sudden loss of vision'],
  ['flashes', 'New flashes of light'],
  ['curtain', 'A curtain or a shadow over the vision'],
  ['chemical', 'A chemical in the eye'],
  ['pain_red', 'A painful red eye'],
)
const kbb = o(
  ['hearing', 'Hearing lost suddenly'],
  ['one_ear', 'Hearing or ringing lost suddenly in one ear'],
  ['nose', 'A nosebleed that will not stop'],
  ['throat', 'Trouble breathing with swelling in the throat, or being unable to swallow'],
  ['dizzy', 'Dizziness together with double vision, trouble speaking, or weakness'],
  ['injury', 'A blow to the head, the face or the neck'],
)
const kadin = o(
  ['bleed', 'Vaginal bleeding that is heavy or unexpected'],
  ['head', 'Severe headache or a change in vision'],
  ['swelling', 'Sudden swelling of the hands or face'],
  ['baby', 'A baby moving much less'],
  ['waters', 'Waters breaking early, or regular strong contractions'],
  ['breath', 'Shortness of breath or chest pain'],
  ['pain', 'Severe belly or pelvic pain'],
)
const uro = o(
  ['blood', 'Blood in the urine that can be seen'],
  ['retention', 'Being unable to pass urine'],
  ['fever', 'Side or back pain with fever'],
  ['testis', 'Sudden severe pain in a testis'],
  ['erection', 'An erection that is lasting and painful'],
  ['injury', 'A blow to the groin or the pelvis'],
)
const kemik = o(
  ['compartment', 'Severe swelling with pain that cannot be borne'],
  ['pulse', 'A sudden loss of feeling, strength or pulse'],
  ['open', 'A bone visible through the skin'],
  ['joint', 'A hot or red joint with fever'],
  ['cauda', 'Back and leg pain with loss of control of urine or stool'],
  ['cold', 'A limb that has become cold, or has lost its pulse, after a dislocation'],
)
const nefes = o(
  ['breath', 'Severe shortness of breath, including at rest'],
  ['chest', 'Chest pain'],
  ['blood', 'Blood in the phlegm'],
  ['lips', 'Blue lips or struggling to breathe'],
  ['throat', 'Swelling of the tongue or throat'],
)
const psiki = o(
  ['now', 'Thoughts of suicide or of self-harm right now'],
  ['plan', 'A plan or an intent to act on those thoughts'],
  ['unsafe', 'Feeling unable to stay safe'],
  ['confused', 'Confusion, with a risk of coming to harm'],
  ['food', 'Almost no food or drink for a long time, and getting weaker'],
)
const cocuk = o(
  ['breath', 'Struggling to breathe, or blue lips'],
  ['floppy', 'Very floppy, hard to wake, or a fit'],
  ['rash', 'A rash that does not fade, with fever'],
  ['dehydrate', 'Very little urine, or no tears, with vomiting or diarrhoea'],
  ['bleed', 'Heavy bleeding'],
  ['pain', 'Pain that is getting quickly worse'],
)
const anestezi = o(
  ['breath', 'Trouble breathing or a feeling of choking'],
  ['allergy', 'Swelling or a widespread rash after a medicine, happening now'],
  ['chest', 'Sudden chest pain or fainting'],
  ['vomit', 'Shortness of breath after vomiting'],
)
const radyo = o(
  ['reaction', 'A previous severe reaction to contrast, and the same kind of test is planned'],
  ['pregnancy', 'A possible pregnancy and a test that uses radiation is planned'],
  ['breath', 'Trouble breathing or a change in consciousness'],
  ['bleed', 'Heavy bleeding'],
)
const genel = o(
  ['chest', 'Chest pain or pressure'],
  ['breath', 'Sudden or severe shortness of breath'],
  ['faint', 'Fainting or loss of consciousness'],
  ['stroke', 'Face droop, trouble speaking, or sudden weakness'],
  ['bleed', 'Heavy bleeding'],
  ['throat', 'Swelling of the tongue or throat, or trouble breathing'],
)

/** Everyday red-flag options for each shared role. "None of these" is added when the question is built. */
const KIRMIZI: Readonly<Record<EnRol, readonly HamSecenek[]>> = {
  'emergency-medicine': genel,
  'family-medicine': genel,
  anaesthesia: anestezi,
  neurosurgery: noro,
  'paediatric-surgery': cocuk,
  'internal-medicine': genel,
  dermatology: cilt,
  endocrinology: o(
    ['sugar', 'Symptoms that may be a very low or very high blood sugar, and feeling much worse'],
    ['chest', 'Chest pain or pressure'],
    ['breath', 'Sudden or severe shortness of breath'],
    ['faint', 'Fainting'],
    ['throat', 'Swelling of the tongue or throat'],
  ),
  'infectious-diseases': o(
    ['breath', 'Struggling to breathe'],
    ['stiff', 'A severe headache with a stiff neck and fever'],
    ['rash', 'A rash that does not fade, with fever'],
    ['confused', 'New confusion or being hard to wake'],
    ['bleed', 'Heavy bleeding'],
  ),
  gastroenterology: karin,
  'general-surgery': karin,
  'thoracic-surgery': nefes,
  'respiratory-medicine': nefes,
  ophthalmology: goz,
  'obstetrics-gynaecology': kadin,
  'cardiovascular-surgery': gogus,
  cardiology: gogus,
  otolaryngology: kbb,
  nephrology: o(
    ['none_urine', 'Passing no urine'],
    ['breath', 'Sudden shortness of breath or chest pain'],
    ['potassium', 'Severe weakness, or a very slow or irregular heartbeat'],
    ['fever', 'Fever with pain in the side, in someone who dialyses or has a transplant'],
    ['bleed', 'Heavy bleeding'],
  ),
  neurology: noro,
  oncology: o(
    ['fever', 'Fever while on treatment that lowers immunity'],
    ['breath', 'Sudden shortness of breath or chest pain'],
    ['bleed', 'Heavy bleeding or many new bruises'],
    ['confused', 'New confusion or being hard to wake'],
    ['cord', 'New weakness of the legs, or loss of control of urine or stool'],
  ),
  orthopaedics: kemik,
  paediatrics: cocuk,
  'plastic-surgery': o(
    ['bleed', 'Heavy bleeding from a wound'],
    ['breath', 'Trouble breathing or chest pain'],
    ['wound', 'A wound that is rapidly more red, swollen or painful, with fever'],
    ['flap', 'A reconstructed area that has become cold, pale or blue'],
  ),
  psychiatry: psiki,
  radiology: radyo,
  rheumatology: o(
    ['eye', 'A painful red eye with joint disease'],
    ['breath', 'Sudden shortness of breath or chest pain'],
    ['weak', 'Sudden weakness or a loss of feeling'],
    ['fever', 'A single hot joint with fever'],
    ['throat', 'Swelling of the tongue or throat'],
  ),
  urology: uro,
  'sports-medicine': o(
    ['chest', 'Chest pain, or fainting, during effort'],
    ['breath', 'Sudden shortness of breath'],
    ['head', 'A blow to the head with vomiting, confusion or worsening headache'],
    ['limb', 'A limb that is cold, pale or without a pulse'],
    ['neck', 'Neck pain after an injury, with weakness or numbness'],
  ),
  'rehabilitation-medicine': o(
    ['chest', 'Chest pain or sudden shortness of breath'],
    ['weak', 'New sudden weakness or loss of feeling'],
    ['autonomic', 'A pounding headache with flushing, in someone with a spinal injury'],
    ['urine', 'Being unable to pass urine'],
    ['fever', 'Fever with a new confusion'],
  ),
  'hair-transplant': o(
    ['bleed', 'Bleeding from the scalp that will not stop'],
    ['chest', 'Chest pain or sudden shortness of breath'],
    ['wound', 'Spreading redness, pus or fever'],
    ['faint', 'Fainting that does not recover quickly'],
  ),
  'aesthetic-surgery': o(
    ['bleed', 'Heavy bleeding or a rapidly growing swelling'],
    ['breath', 'Trouble breathing or chest pain'],
    ['wound', 'A wound or a treated area that is rapidly more painful, with fever'],
    ['vision', 'A change in vision after a facial procedure'],
  ),
  'aesthetic-medicine': o(
    ['vision', 'A change in vision after a facial treatment'],
    ['skin', 'Skin that has turned white, mottled or dusky after a treatment'],
    ['throat', 'Swelling of the tongue or throat, or trouble breathing'],
    ['chest', 'Chest pain or fainting'],
  ),
  'clinic-dermatology': cilt,
  longevity: genel,
  physiotherapy: kemik,
  'clinical-psychology': psiki,
  dietetics: o(
    ['sugar', 'Symptoms that may be a very low blood sugar, and feeling much worse'],
    ['vomit', 'Being unable to keep fluids down'],
    ['chest', 'Chest pain or sudden shortness of breath'],
    ['faint', 'Fainting'],
    ['throat', 'Swelling of the tongue or throat after food'],
  ),
  'occupational-therapy': o(
    ['chest', 'Chest pain or sudden shortness of breath'],
    ['weak', 'New sudden weakness or loss of feeling'],
    ['fall', 'A fall with a new inability to bear weight, or a blow to the head'],
    ['urine', 'Being unable to pass urine'],
  ),
  audiology: o(
    ['hearing', 'Hearing lost suddenly'],
    ['one_ear', 'Hearing or ringing lost suddenly in one ear'],
    ['dizzy', 'Spinning dizziness with double vision, trouble speaking, or weakness'],
    ['injury', 'A blow to the head or the ear'],
  ),
}

/**
 * A country's own role whose red-flag list must not be the list of the role it behaves like.
 * Australia's vascular surgery behaves like cardiovascular surgery for the note, but a patient must not be
 * shown that role's chest-pain list (the pack's own questions already avoid those phrases).
 */
const OZEL: Readonly<Record<string, readonly HamSecenek[]>> = {
  'vascular-surgery': o(
    ['limb', 'A limb that is cold, pale or without a pulse'],
    ['bleed', 'Bleeding that will not stop'],
    ['swelling', 'A rapidly growing painful swelling in a limb'],
    ['wound', 'Fever, or a wound that is red or draining, after an operation'],
    ['faint', 'Fainting'],
  ),
}

/** Red flag, two depth questions, and — for psychiatry and clinical psychology — the safety question. */
export function derinSorular(rol: string, onEk: string): HamSoru[] {
  const sec = OZEL[rol] ?? KIRMIZI[rol as EnRol] ?? genel
  const sorular: HamSoru[] = [
    kirmizi(`${onEk}_rf`, sec),
    eh(`${onEk}_x_worse`, 'Has the problem been getting worse?', 'Since when?'),
    kisa(`${onEk}_x_tried`, 'What has already been tried?'),
  ]
  if (GUVENLIK.has(rol)) sorular.push(guvenlik(`${onEk}_safety`))
  return sorular
}

/**
 * The role's own questions plus the depth questions. `gibi` chooses the red-flag list, unless this role has its
 * own list in `OZEL`. When `buRol` is that same role, keys keep the set's own prefix (`em_rf`). A New Zealand
 * copy already prefixes every key (`nz_uc_…`); depth keys keep that prefix (`nz_uc_rf`). Any other country's
 * own form uses the role key (`speech_pathology_rf`).
 */
export function ekleDerinlik(ham: HamRol, gibi: string, buRol: string): HamRol {
  const ilk = ham.sorular[0]?.anahtar ?? ''
  const nz = ilk.match(/^(nz_[a-z]+)_/)
  const onEk = buRol === gibi ? (ilk.split('_')[0] || 'q') : (nz?.[1] ?? buRol.replace(/-/g, '_'))
  const bayrak = OZEL[buRol] ? buRol : gibi
  const varMi = new Set(ham.sorular.map((q) => q.anahtar))
  const rfVar = ham.sorular.some((q) => q.anahtar.endsWith('_rf'))
  const ek = derinSorular(bayrak, onEk).filter((q) => !varMi.has(q.anahtar) && !(rfVar && q.anahtar.endsWith('_rf')))
  return ek.length ? { ...ham, sorular: [...ham.sorular, ...ek] } : ham
}
