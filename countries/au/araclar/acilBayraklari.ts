/**
 * AU-PEDIATRI-GOLD-01a — red-flag (acil) pathway tools for every offered Australian role.
 *
 * CLASSIFIED: specialty-only. Each tool's `roller` is exactly one role.
 * Tick → warning `acil`. Copy names Triple Zero (000). No diagnosis, no dose, no emergency
 * number inside the mechanism (pack portal copy carries 000). Same bayrak shape as the kit's
 * birinci-acil-bayrak / inme-bayraklari (lib/ulke/araclar/tanimlar/bosluklar.ts).
 *
 * TGA advice on checklist tools that restate clinician ticks remains OPEN (AU-LAUNCH-01b).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, isaret, isaretliler } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../klinik/asistanAdlari'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

type Satir = {
  rol: Sunulan
  anahtar: string
  ad: string
  aciklama: string
  isaretler: readonly string[]
  etiket: Readonly<Record<string, string>>
}

const S: readonly Satir[] = [
  { rol: 'emergency-medicine', anahtar: 'au-emergency-medicine-flags', ad: 'Emergency medicine danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Call Triple Zero (000) when life is at risk. No triage scale is stored.', isaretler: ['havayolu', 'anafilaksi', 'gogus', 'inme', 'kanama', 'travma'], etiket: { havayolu: 'Airway at risk', anafilaksi: 'Anaphylaxis', gogus: 'Chest pain or cardiac arrest risk', inme: 'Stroke signs', kanama: 'Uncontrolled bleeding', travma: 'Major trauma' } },
  { rol: 'family-medicine', anahtar: 'au-family-medicine-flags', ad: 'General practice danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note naming Triple Zero (000). No diagnosis is stored.', isaretler: ['gogus', 'inme', 'nefes', 'anafilaksi', 'ates_bebek', 'bilinc'], etiket: { gogus: 'Chest pain', inme: 'Stroke signs', nefes: 'Severe breathlessness', anafilaksi: 'Anaphylaxis', ates_bebek: 'Fever in a baby under 3 months', bilinc: 'Reduced consciousness' } },
  { rol: 'anaesthesia', anahtar: 'au-anaesthesia-flags', ad: 'Anaesthesia danger signs', aciklama: 'Tick signs you found under anaesthesia. A tick raises an emergency pathway note. No dose is stored.', isaretler: ['cico', 'anafilaksi', 'mh', 'kanama', 'aspirasyon'], etiket: { cico: 'Cannot intubate / cannot oxygenate', anafilaksi: 'Anaphylaxis', mh: 'Malignant hyperthermia suspicion', kanama: 'Uncontrolled bleeding', aspirasyon: 'Aspiration with desaturation' } },
  { rol: 'neurosurgery', anahtar: 'au-neurosurgery-flags', ad: 'Neurosurgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Nothing is booked.', isaretler: ['pupil', 'bilinc', 'yara', 'bas'], etiket: { pupil: 'Fixed dilated pupil', bilinc: 'Falling consciousness', yara: 'Wound bursting with decline', bas: 'Sudden severe headache with change' } },
  { rol: 'paediatric-surgery', anahtar: 'au-paediatric-surgery-flags', ad: 'Paediatric surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note for Triple Zero (000).', isaretler: ['safra', 'torsiyon', 'havayolu', 'sepsis'], etiket: { safra: 'Bilious vomiting in an infant', torsiyon: 'Suspected testicular torsion', havayolu: 'Airway obstruction after surgery', sepsis: 'Sepsis after surgery' } },
  { rol: 'internal-medicine', anahtar: 'au-internal-medicine-flags', ad: 'General medicine danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['sepsis', 'gogus', 'solunum', 'bilinc'], etiket: { sepsis: 'Sepsis suspicion', gogus: 'Acute coronary syndrome suspicion', solunum: 'Respiratory failure', bilinc: 'Reduced consciousness' } },
  { rol: 'dermatology', anahtar: 'au-dermatology-flags', ad: 'Dermatology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['anafilaksi', 'nekroz', 'sepsis'], etiket: { anafilaksi: 'Anaphylaxis after medicine or procedure', nekroz: 'Rapid soft-tissue necrosis', sepsis: 'Skin infection with systemic toxicity' } },
  { rol: 'endocrinology', anahtar: 'au-endocrinology-flags', ad: 'Endocrinology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No dose is stored.', isaretler: ['dka', 'adrenal', 'hipo'], etiket: { dka: 'Diabetic ketoacidosis suspicion', adrenal: 'Adrenal crisis suspicion', hipo: 'Severe hypoglycaemia with reduced consciousness' } },
  { rol: 'infectious-diseases', anahtar: 'au-infectious-diseases-flags', ad: 'Infectious diseases danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['sepsis', 'menenjit', 'kanama'], etiket: { sepsis: 'Sepsis', menenjit: 'Meningism with fever', kanama: 'Viral haemorrhagic suspicion' } },
  { rol: 'gastroenterology', anahtar: 'au-gastroenterology-flags', ad: 'Gastroenterology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['kanama', 'kolit', 'safra'], etiket: { kanama: 'Massive gastrointestinal bleeding', kolit: 'Acute severe colitis with shock', safra: 'Biliary sepsis' } },
  { rol: 'general-surgery', anahtar: 'au-general-surgery-flags', ad: 'General surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['periton', 'boyun', 'kanama'], etiket: { periton: 'Peritonitis', boyun: 'Neck haematoma threatening airway', kanama: 'Uncontrolled post-operative bleeding' } },
  { rol: 'respiratory-medicine', anahtar: 'au-respiratory-medicine-flags', ad: 'Respiratory danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['astim', 'pnomo', 'hemoptizi'], etiket: { astim: 'Life-threatening asthma', pnomo: 'Tension pneumothorax suspicion', hemoptizi: 'Massive haemoptysis' } },
  { rol: 'ophthalmology', anahtar: 'au-ophthalmology-flags', ad: 'Ophthalmology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['gorme', 'kimyasal', 'orbital'], etiket: { gorme: 'Sudden vision loss', kimyasal: 'Chemical eye injury', orbital: 'Orbital cellulitis with toxicity' } },
  { rol: 'obstetrics-gynaecology', anahtar: 'au-obstetrics-gynaecology-flags', ad: 'Obstetrics and gynaecology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Not a portal message.', isaretler: ['kanama', 'eklampsi', 'distosi'], etiket: { kanama: 'Heavy bleeding with shock', eklampsi: 'Eclampsia', distosi: 'Shoulder dystocia' } },
  { rol: 'cardiology', anahtar: 'au-cardiology-flags', ad: 'Cardiology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. The CVD calculator stays a link-out.', isaretler: ['stemi', 'arrest', 'sok'], etiket: { stemi: 'ST-elevation infarction suspicion', arrest: 'Cardiac arrest', sok: 'Cardiogenic shock' } },
  { rol: 'otolaryngology', anahtar: 'au-otolaryngology-flags', ad: 'Ear, nose and throat danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['havayolu', 'kanama', 'boyun'], etiket: { havayolu: 'Airway obstruction', kanama: 'Post-tonsillectomy haemorrhage', boyun: 'Deep neck infection with sepsis' } },
  { rol: 'nephrology', anahtar: 'au-nephrology-flags', ad: 'Nephrology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No eGFR colour is stored.', isaretler: ['hiper_k', 'odem', 'fistul'], etiket: { hiper_k: 'Hyperkalaemia with ECG change', odem: 'Pulmonary oedema from overload', fistul: 'Life-threatening dialysis-access bleed' } },
  { rol: 'neurology', anahtar: 'au-neurology-flags', ad: 'Neurology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Not a portal message.', isaretler: ['inme', 'status', 'menenjit'], etiket: { inme: 'Stroke signs', status: 'Status epilepticus', menenjit: 'Meningism with reduced consciousness' } },
  { rol: 'oncology', anahtar: 'au-oncology-flags', ad: 'Medical oncology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No dose is stored.', isaretler: ['febril', 'tls', 'havayolu'], etiket: { febril: 'Febrile neutropenia', tls: 'Tumour lysis with arrhythmia', havayolu: 'Airway compression' } },
  { rol: 'orthopaedics', anahtar: 'au-orthopaedics-flags', ad: 'Orthopaedic danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No concussion protocol is copied.', isaretler: ['kompartman', 'damar', 'septik'], etiket: { kompartman: 'Compartment syndrome', damar: 'Neurovascular compromise', septik: 'Septic arthritis with sepsis' } },
  { rol: 'paediatrics', anahtar: 'au-paediatrics-flags', ad: 'Paediatrics danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note naming Triple Zero (000). Growth and immunisation stay on their own tools.', isaretler: ['ates_bebek', 'petesi', 'nefes', 'anafilaksi', 'menenjit', 'sepsis'], etiket: { ates_bebek: 'Fever under 3 months', petesi: 'Petechiae with fever', nefes: 'Severe respiratory distress', anafilaksi: 'Anaphylaxis', menenjit: 'Meningism', sepsis: 'Sepsis suspicion' } },
  { rol: 'plastic-surgery', anahtar: 'au-plastic-surgery-flags', ad: 'Plastic surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Not the cosmetic booking plan.', isaretler: ['flap', 'havayolu', 'kanama'], etiket: { flap: 'Flap failure with toxicity', havayolu: 'Airway compromise after reconstruction', kanama: 'Uncontrolled bleeding' } },
  { rol: 'psychiatry', anahtar: 'au-psychiatry-flags', ad: 'Psychiatry safety signs', aciklama: 'Tick signs you found. A tick raises a safety pathway note. No score and no diagnosis is stored.', isaretler: ['intihar', 'siddet', 'psikoz', 'tibbi'], etiket: { intihar: 'Immediate suicide risk', siddet: 'Immediate harm to others', psikoz: 'Acute behavioural disturbance', tibbi: 'Medical instability with mental-state change' } },
  { rol: 'radiology', anahtar: 'au-radiology-flags', ad: 'Radiology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No reporting category is stored.', isaretler: ['pnomo', 'kontrast', 'kanama'], etiket: { pnomo: 'Tension pneumothorax with instability', kontrast: 'Contrast anaphylaxis', kanama: 'Active major haemorrhage on imaging' } },
  { rol: 'rheumatology', anahtar: 'au-rheumatology-flags', ad: 'Rheumatology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No score is stored.', isaretler: ['septik', 'anafilaksi'], etiket: { septik: 'Septic arthritis suspicion', anafilaksi: 'Anaphylaxis to an infusion' } },
  { rol: 'urology', anahtar: 'au-urology-flags', ad: 'Urology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No laboratory number is stored.', isaretler: ['torsiyon', 'fournier', 'retansiyon'], etiket: { torsiyon: 'Testicular torsion suspicion', fournier: 'Fournier gangrene suspicion', retansiyon: 'Clot retention with instability' } },
  { rol: 'sports-medicine', anahtar: 'au-sports-medicine-flags', ad: 'Sport and exercise danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No concussion protocol is copied.', isaretler: ['boyun', 'collaps', 'anafilaksi'], etiket: { boyun: 'Suspected cervical spine injury', collaps: 'Exertional collapse', anafilaksi: 'Anaphylaxis on the field' } },
  { rol: 'rehabilitation-medicine', anahtar: 'au-rehabilitation-medicine-flags', ad: 'Rehabilitation medicine danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No outcome measure is copied.', isaretler: ['adr', 'gogus'], etiket: { adr: 'Autonomic dysreflexia crisis', gogus: 'Acute chest pain during therapy' } },
  { rol: 'cardio-thoracic-surgery', anahtar: 'au-cardio-thoracic-surgery-flags', ad: 'Cardio-thoracic surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Not the cardiology check.', isaretler: ['tamponad', 'hemotoraks', 'havayolu'], etiket: { tamponad: 'Tamponade suspicion', hemotoraks: 'Massive haemothorax', havayolu: 'Airway emergency after chest surgery' } },
  { rol: 'vascular-surgery', anahtar: 'au-vascular-surgery-flags', ad: 'Vascular surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Not the cardiology check.', isaretler: ['ruture', 'iskemi', 'anastomoz'], etiket: { ruture: 'Ruptured aneurysm suspicion', iskemi: 'Acute limb ischaemia', anastomoz: 'Anastomotic blow-out' } },
  { rol: 'radiation-oncology', anahtar: 'au-radiation-oncology-flags', ad: 'Radiation oncology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No dose is stored.', isaretler: ['havayolu', 'omurilik', 'toksisite'], etiket: { havayolu: 'Airway obstruction from tumour', omurilik: 'Spinal cord compression', toksisite: 'Severe reaction with systemic toxicity' } },
  { rol: 'geriatric-medicine', anahtar: 'au-geriatric-medicine-flags', ad: 'Geriatric medicine danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['deliryum', 'kalca', 'sepsis'], etiket: { deliryum: 'Delirium with medical instability', kalca: 'Hip fracture with shock', sepsis: 'Sepsis in a frail patient' } },
  { rol: 'immunology-and-allergy', anahtar: 'au-immunology-and-allergy-flags', ad: 'Immunology and allergy danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. ASCIA action plans stay with the clinician.', isaretler: ['anafilaksi', 'havayolu', 'sok'], etiket: { anafilaksi: 'Anaphylaxis', havayolu: 'Airway compromise from allergy', sok: 'Shock from allergy' } },
  { rol: 'haematology', anahtar: 'au-haematology-flags', ad: 'Haematology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No laboratory number is stored.', isaretler: ['kanama', 'gogus', 'febril'], etiket: { kanama: 'Major haemorrhage', gogus: 'Acute chest syndrome', febril: 'Febrile neutropenia' } },
  { rol: 'pain-medicine', anahtar: 'au-pain-medicine-flags', ad: 'Pain medicine danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No dose is stored.', isaretler: ['solunum', 'anafilaksi'], etiket: { solunum: 'Opioid-induced respiratory depression', anafilaksi: 'Anaphylaxis to an injected medicine' } },
  { rol: 'aesthetic-surgery', anahtar: 'au-aesthetic-surgery-flags', ad: 'Cosmetic surgery danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Cooling-off stays on the booking plan.', isaretler: ['havayolu', 'kanama', 'enfeksiyon'], etiket: { havayolu: 'Airway compromise after facial surgery', kanama: 'Uncontrolled bleeding', enfeksiyon: 'Severe infection with toxicity' } },
  { rol: 'aesthetic-medicine', anahtar: 'au-aesthetic-medicine-flags', ad: 'Non-surgical cosmetic danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. Hair transplantation is named on this role.', isaretler: ['anafilaksi', 'vaskuler', 'gorme'], etiket: { anafilaksi: 'Anaphylaxis after filler or toxin', vaskuler: 'Vascular occlusion suspicion after filler', gorme: 'Visual change after periocular filler' } },
  { rol: 'physiotherapy', anahtar: 'au-physiotherapy-flags', ad: 'Physiotherapy danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No medical diagnosis is stored.', isaretler: ['cauda', 'boyun', 'gogus'], etiket: { cauda: 'Suspected cauda equina', boyun: 'Suspected cervical fracture', gogus: 'Chest pain during exercise' } },
  { rol: 'clinical-psychology', anahtar: 'au-clinical-psychology-flags', ad: 'Clinical psychology safety signs', aciklama: 'Tick signs you found. A tick raises a safety pathway note. No score and no photograph line.', isaretler: ['intihar', 'siddet', 'tibbi'], etiket: { intihar: 'Immediate suicide risk', siddet: 'Immediate harm to others', tibbi: 'Medical emergency during a session' } },
  { rol: 'dietetics', anahtar: 'au-dietetics-flags', ad: 'Dietetics danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No calorie target is stored.', isaretler: ['refeeding', 'anafilaksi'], etiket: { refeeding: 'Refeeding risk with instability', anafilaksi: 'Anaphylaxis to a food challenge' } },
  { rol: 'occupational-therapy', anahtar: 'au-occupational-therapy-flags', ad: 'Occupational therapy danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No medical diagnosis is stored.', isaretler: ['gogus', 'dusme'], etiket: { gogus: 'Acute chest pain during activity', dusme: 'Fall with head injury and reduced consciousness' } },
  { rol: 'audiology', anahtar: 'au-audiology-flags', ad: 'Audiology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['ani_isitme', 'vertigo'], etiket: { ani_isitme: 'Sudden hearing loss with neurological signs', vertigo: 'Severe vertigo with new neurological deficit' } },
  { rol: 'podiatry', anahtar: 'au-podiatry-flags', ad: 'Podiatry danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note.', isaretler: ['enfeksiyon', 'charcot'], etiket: { enfeksiyon: 'Rapid foot infection with toxicity', charcot: 'Acute Charcot with skin breach and fever' } },
  { rol: 'speech-pathology', anahtar: 'au-speech-pathology-flags', ad: 'Speech pathology danger signs', aciklama: 'Tick signs you found. A tick raises an emergency pathway note. No therapy protocol is copied.', isaretler: ['havayolu', 'bogulma'], etiket: { havayolu: 'Acute airway obstruction', bogulma: 'Choking with inability to breathe' } },
]

function bayrakTanimi(anahtar: string, isaretler: readonly string[]): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [...isaretler.map(isaret), isaret('yok')],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['acil'], tarihler: [] },
    kaynak: 'Triple Zero (000) is Australia\'s primary emergency number. This tool records clinician ticks only; it copies no protocol and stores no diagnosis.',
    hesapla: (g) => {
      const secili = isaretliler(g, isaretler)
      const yok = g.yok === true
      if ((yok && secili.length > 0) || (!yok && secili.length === 0)) return BOS_SONUC
      return {
        tamam: true,
        sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: isaretler.length }],
        bant: null,
        uyarilar: secili.length ? ['acil'] : [],
        tarihler: [],
      }
    },
  }
}

export const AU_ACIL_TANIMLAR: readonly AracTanimi[] = S.map((s) => bayrakTanimi(s.anahtar, s.isaretler))

function paket(s: Satir): PaketAraci {
  const alanlar: Record<string, ReturnType<typeof m>> = { yok: m('None of these signs') }
  for (const k of s.isaretler) alanlar[k] = m(s.etiket[k] ?? k)
  return {
    anahtar: s.anahtar,
    roller: [s.rol],
    metin: {
      ad: m(s.ad),
      aciklama: m(s.aciklama),
      alanlar,
      uyarilar: {
        acil: m('Emergency pathway: call Triple Zero (000) when life or limb is at immediate risk, then give the immediate steps. The clinician decides. Nothing is sent from this screen.'),
      },
      sayilar: { isaretli: m('Signs ticked') },
      not: m('A record of signs you ticked. Not a diagnosis. Regulatory advice on checklist tools remains pending (AU-LAUNCH-01b).'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak: 'https://www.triplezero.gov.au/ (read 2026-10-28): Triple Zero (000) is Australia\'s primary emergency number. Clinician ticks only; no protocol copied.',
      bildirim: m('Call Triple Zero (000) for a life-threatening emergency. This screen stores ticks only.'),
    },
  }
}

export function auAcilBayraklari(): readonly PaketAraci[] {
  return S.map(paket)
}

export const AU_ACIL_ANAHTARLARI: readonly string[] = S.map((s) => s.anahtar)

/** Role → tool key (for tests: foreign roles omit another role's flags). */
export const AU_ACIL_ROL_ANAHTAR: Readonly<Record<Sunulan, string>> = Object.fromEntries(
  S.map((s) => [s.rol, s.anahtar]),
) as Record<Sunulan, string>
