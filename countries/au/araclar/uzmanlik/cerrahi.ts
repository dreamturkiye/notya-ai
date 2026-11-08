/**
 * ULKE-BRANS-DERINLIK-01 — Australia: specialty tools of general, paediatric, plastic and cosmetic surgery, urology,
 * orthopaedics, ophthalmology, otolaryngology, dermatology, non-surgical cosmetic medicine, paediatrics and radiology.
 * Each row: its roles (≤3), its published source, its worked examples. See ./motor.ts.
 */
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'

const NOT = 'A result from what you entered, by the published method shown. It informs, it does not decide: the treating clinician weighs it with the whole patient and approves the note.'
const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })

export const CERRAHI: readonly UzmanlikSatiri[] = [
  // ── general and paediatric surgery ──
  {
    sekil: 'toplam', k: 'alvarado', roller: ['general-surgery', 'paediatric-surgery'],
    ad: 'Alvarado score (acute appendicitis)', aciklama: 'Migration of pain, anorexia, nausea/vomiting, right-iliac-fossa tenderness, rebound, temperature, leucocytosis and left shift.',
    not: `${NOT} Imaging and surgical review follow local pathways.`,
    kaynak: 'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Ann Emerg Med 1986;15:557-64 (1–4 unlikely, 5–6 possible, 7–8 probable, 9–10 very probable).',
    alanlar: [t('goc', 'Migration of pain to the right iliac fossa'), t('anoreksi', 'Anorexia'), t('bulanti', 'Nausea or vomiting'), t('hassasiyet', 'Tenderness in the right iliac fossa', 2), t('rebound', 'Rebound tenderness'), t('ates', 'Temperature 37.3 °C or more'), t('lokosit', 'Leucocytosis above 10 ×10⁹/L', 2), t('sola_kayma', 'Neutrophil left shift (above 75%)')],
    bantlar: [b(0, 'olasi_degil', '0–4 — appendicitis unlikely'), b(5, 'olasi', '5–6 — possible'), b(7, 'muhtemel', '7–8 — probable'), b(9, 'cok_muhtemel', '9–10 — very probable')],
    ornekler: [{ girdi: { goc: true, anoreksi: true, hassasiyet: true, lokosit: true, sola_kayma: true }, toplam: 7, bant: 'muhtemel' }, { girdi: { bulanti: true, ates: true }, toplam: 2, bant: 'olasi_degil' }],
  },
  {
    sekil: 'toplam', k: 'bisap', roller: ['general-surgery', 'gastroenterology'],
    ad: 'BISAP score (acute pancreatitis)', aciklama: 'Bedside Index for Severity in Acute Pancreatitis, within 24 hours of presentation. Urea threshold in Australian units.',
    not: NOT,
    kaynak: 'Wu BU, Johannes RS, Sun X, et al. The early prediction of mortality in acute pancreatitis: a large population-based study. Gut 2008;57:1698-703 (BUN >25 mg/dL ≈ urea >8.9 mmol/L; ≥3 associated with higher mortality).',
    alanlar: [t('ure', 'Urea above 8.9 mmol/L'), t('bilinc', 'Impaired mental status'), t('sirs', 'SIRS (2 or more criteria)'), t('yas', 'Age over 60'), t('plevral', 'Pleural effusion on imaging')],
    bantlar: [b(0, 'dusuk', '0–2'), b(3, 'yuksek', '3–5 — higher risk of mortality')],
    ornekler: [{ girdi: { ure: true, sirs: true, yas: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'glasgow-imrie', roller: ['general-surgery', 'gastroenterology'],
    ad: 'Modified Glasgow (Imrie) criteria (acute pancreatitis)', aciklama: 'Eight criteria within 48 hours (PANCREAS). Three or more predict severe pancreatitis.',
    not: NOT,
    kaynak: 'Blamey SL, Imrie CW, O\'Neill J, Gilmour WH, Carter DC. Prognostic factors in acute pancreatitis. Gut 1984;25:1340-6.',
    toplamAdi: 'Criteria met',
    alanlar: [t('pao2', 'PaO2 below 8 kPa'), t('yas', 'Age over 55'), t('notrofil', 'White cell count above 15 ×10⁹/L'), t('kalsiyum', 'Calcium below 2 mmol/L'), t('ure', 'Urea above 16 mmol/L'), t('enzim', 'LDH above 600 U/L or AST above 200 U/L'), t('albumin', 'Albumin below 32 g/L'), t('glukoz', 'Glucose above 10 mmol/L')],
    bantlar: [b(0, 'hafif', '0–2 — mild predicted'), b(3, 'agir', '3 or more — severe predicted')],
    ornekler: [{ girdi: { yas: true, ure: true, glukoz: true }, toplam: 3, bant: 'agir' }],
  },
  {
    sekil: 'toplam', k: 'boey', roller: ['general-surgery'],
    ad: 'Boey score (perforated peptic ulcer)', aciklama: 'Major medical illness, preoperative shock and perforation of more than 24 hours.',
    not: NOT,
    kaynak: 'Boey J, Choi SK, Poon A, Alagaratnam TT. Risk stratification in perforated duodenal ulcers: a prospective validation of predictive factors. Ann Surg 1987;205:22-6.',
    alanlar: [t('hastalik', 'Major medical illness'), t('sok', 'Preoperative shock (systolic below 100 mmHg)'), t('sure', 'Perforation for more than 24 hours')],
    ornekler: [{ girdi: { sok: true, sure: true }, toplam: 2 }],
  },
  {
    sekil: 'toplam', k: 'hinchey', roller: ['general-surgery'],
    ad: 'Hinchey classification (perforated diverticulitis)', aciklama: 'Record the class from imaging or operative findings.',
    not: NOT,
    kaynak: 'Hinchey EJ, Schaal PG, Richards GK. Treatment of perforated diverticular disease of the colon. Adv Surg 1978;12:85-109.',
    toplamAdi: 'Hinchey class',
    alanlar: [c('sinif', 'Class', [['1', 'I — pericolic abscess', 1], ['2', 'II — pelvic, intra-abdominal or retroperitoneal abscess', 2], ['3', 'III — generalised purulent peritonitis', 3], ['4', 'IV — generalised faecal peritonitis', 4]])],
    bantlar: [b(1, 'i', 'Class I'), b(2, 'ii', 'Class II'), b(3, 'iii', 'Class III'), b(4, 'iv', 'Class IV')],
    ornekler: [{ girdi: { sinif: '3' }, bant: 'iii' }],
  },
  {
    sekil: 'toplam', k: 'paediatric-appendicitis', roller: ['paediatric-surgery', 'paediatrics'],
    ad: 'Paediatric Appendicitis Score', aciklama: 'For children with suspected appendicitis.',
    not: `${NOT} Ultrasound and surgical review follow the local paediatric pathway.`,
    kaynak: 'Samuel M. J Pediatr Surg 2002;37:877-81 (≤3 low, 4–6 intermediate, ≥7 high likelihood).',
    alanlar: [t('oksuruk', 'Pain in the right lower quadrant on coughing, percussion or hopping', 2), t('anoreksi', 'Anorexia'), t('ates', 'Fever 38 °C or more'), t('bulanti', 'Nausea or vomiting'), t('hassasiyet', 'Right-lower-quadrant tenderness', 2), t('lokosit', 'Leucocytosis above 10 ×10⁹/L'), t('notrofil', 'Neutrophilia (above 7.5 ×10⁹/L)'), t('goc', 'Migration of pain')],
    bantlar: [b(0, 'dusuk', '0–3 — low'), b(4, 'orta', '4–6 — intermediate'), b(7, 'yuksek', '7–10 — high')],
    ornekler: [{ girdi: { oksuruk: true, hassasiyet: true, lokosit: true, goc: true }, toplam: 6, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'twist', roller: ['urology', 'paediatric-surgery', 'emergency-medicine'],
    ad: 'TWIST score (testicular torsion)', aciklama: 'Testicular Workup for Ischaemia and Suspected Torsion.',
    not: `${NOT} Suspected torsion is a surgical emergency; do not delay exploration for imaging when suspicion is high.`,
    kaynak: 'Barbosa JA, Tiseo BC, Barayan GA, et al. Development and initial validation of a scoring system to diagnose testicular torsion in children. J Urol 2013;189:1859-64 (0–2 low, 3–4 intermediate, 5–7 high risk).',
    alanlar: [t('sislik', 'Testicular swelling', 2), t('sert', 'Hard testis', 2), t('kremaster', 'Absent cremasteric reflex'), t('bulanti', 'Nausea or vomiting'), t('yuksek', 'High-riding testis')],
    bantlar: [b(0, 'dusuk', '0–2 — low risk'), b(3, 'orta', '3–4 — intermediate risk'), b(5, 'yuksek', '5–7 — high risk')],
    ornekler: [{ girdi: { sislik: true, sert: true, kremaster: true }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'maintenance-fluids', roller: ['paediatrics', 'paediatric-surgery'],
    ad: 'Maintenance fluid volume (Holliday–Segar)', aciklama: 'Daily and hourly maintenance volume from weight: 100 mL/kg for the first 10 kg, 50 mL/kg for the next 10 kg, 20 mL/kg thereafter.',
    not: `${NOT} The fluid type, any restriction and monitoring follow the local paediatric fluid guideline; nothing is ordered here.`,
    kaynak: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatr 1957;19:823-32.',
    alanlar: [s('kilo', 1, 150, 'kg')],
    etiketler: { kilo: 'Weight' },
    sayiAdlari: { gunluk: 'Daily volume', saatlik: 'Hourly rate' },
    sonucBirimleri: ['mL', 'mL/h'],
    hesap: (g) => {
      const w = g.kilo as number
      const gun = Math.min(w, 10) * 100 + Math.max(0, Math.min(w, 20) - 10) * 50 + Math.max(0, w - 20) * 20
      return { sayilar: [{ anahtar: 'gunluk', deger: Math.round(gun), ondalik: 0, birim: 'mL' }, { anahtar: 'saatlik', deger: yuvarla(gun / 24, 0), ondalik: 0, birim: 'mL/h' }] }
    },
    ornekler: [{ girdi: { kilo: 8 }, sayilar: { gunluk: 800, saatlik: 33 } }, { girdi: { kilo: 25 }, sayilar: { gunluk: 1600, saatlik: 67 } }],
  },
  {
    sekil: 'toplam', k: 'westley-croup', roller: ['paediatrics', 'family-medicine'],
    ad: 'Westley croup score', aciklama: 'Level of consciousness, cyanosis, stridor, air entry and retractions.',
    not: NOT,
    kaynak: 'Westley CR, Cotton EK, Brooks JG. Am J Dis Child 1978;132:484-7 (≤2 mild, 3–7 moderate, 8–11 severe, ≥12 impending respiratory failure).',
    alanlar: [c('bilinc', 'Level of consciousness', [['0', 'Normal', 0], ['5', 'Disorientated', 5]]), c('siyanoz', 'Cyanosis', [['0', 'None', 0], ['4', 'With agitation', 4], ['5', 'At rest', 5]]), c('stridor', 'Stridor', [['0', 'None', 0], ['1', 'With agitation', 1], ['2', 'At rest', 2]]), c('hava', 'Air entry', [['0', 'Normal', 0], ['1', 'Decreased', 1], ['2', 'Markedly decreased', 2]]), c('cekilme', 'Retractions', [['0', 'None', 0], ['1', 'Mild', 1], ['2', 'Moderate', 2], ['3', 'Severe', 3]])],
    bantlar: [b(0, 'hafif', '0–2 — mild'), b(3, 'orta', '3–7 — moderate'), b(8, 'agir', '8–11 — severe'), b(12, 'yetmezlik', '12 or more — impending respiratory failure')],
    ornekler: [{ girdi: { bilinc: '0', siyanoz: '0', stridor: '2', hava: '1', cekilme: '2' }, toplam: 5, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'pecarn-head', roller: ['paediatrics', 'emergency-medicine', 'paediatric-surgery'],
    ad: 'PECARN head injury rule (children)', aciklama: 'For children with GCS 14–15 within 24 hours of head trauma. Separate predictors for under 2 years and 2 years or older.',
    not: `${NOT} Observation versus CT in the intermediate group depends on clinician experience, multiple findings, worsening, age under 3 months and parental preference.`,
    kaynak: 'Kuppermann N, Holmes JF, Dayan PS, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study. Lancet 2009;374:1160-70.',
    alanlar: [sec('yas', ['alt2', 'ust2']), { anahtar: 'gcs_ams', tur: 'isaret' }, { anahtar: 'kirik', tur: 'isaret' }, { anahtar: 'hematom', tur: 'isaret' }, { anahtar: 'bilinc_kaybi', tur: 'isaret' }, { anahtar: 'mekanizma', tur: 'isaret' }, { anahtar: 'davranis', tur: 'isaret' }, { anahtar: 'kusma', tur: 'isaret' }, { anahtar: 'bas_agrisi', tur: 'isaret' }],
    etiketler: { yas: 'Age group', gcs_ams: 'GCS 14 or other signs of altered mental status', kirik: 'Palpable skull fracture (under 2) or signs of basal skull fracture (2 or older)', hematom: 'Occipital, parietal or temporal scalp haematoma (under 2)', bilinc_kaybi: 'Loss of consciousness (5 seconds or more under 2; any 2 or older)', mekanizma: 'Severe mechanism of injury', davranis: 'Not acting normally per parent (under 2)', kusma: 'Vomiting (2 or older)', bas_agrisi: 'Severe headache (2 or older)' },
    secenekEtiketleri: { yas: { alt2: 'Under 2 years', ust2: '2 years or older' } },
    sayiAdlari: { bulgu: 'Predictors present' },
    bantlar: [{ k: 'ct_onerilir', e: 'CT recommended by the rule' }, { k: 'gozlem', e: 'Observation versus CT — clinical decision' }, { k: 'ct_gerekmez', e: 'CT not recommended by the rule (very low risk)' }],
    hesap: (g) => {
      const kucuk = g.yas === 'alt2'
      const yuksek = ['gcs_ams', 'kirik'].filter((k) => g[k] === true).length
      const ara = (kucuk ? ['hematom', 'bilinc_kaybi', 'mekanizma', 'davranis'] : ['bilinc_kaybi', 'mekanizma', 'kusma', 'bas_agrisi']).filter((k) => g[k] === true).length
      return { sayilar: [{ anahtar: 'bulgu', deger: yuksek + ara, ondalik: 0 }], bant: yuksek ? 'ct_onerilir' : ara ? 'gozlem' : 'ct_gerekmez' }
    },
    ornekler: [{ girdi: { yas: 'alt2' }, bant: 'ct_gerekmez' }, { girdi: { yas: 'alt2', hematom: true }, bant: 'gozlem' }, { girdi: { yas: 'ust2', gcs_ams: true }, bant: 'ct_onerilir' }, { girdi: { yas: 'ust2', hematom: true }, bant: 'ct_gerekmez' }],
  },
  // ── plastic and cosmetic surgery ──
  {
    sekil: 'formul', k: 'burns-fluid', roller: ['plastic-surgery', 'emergency-medicine'],
    ad: 'Burns resuscitation fluid estimate', aciklama: 'Weight × %TBSA × the mL/kg/% factor your burns protocol uses; half in the first 8 hours from the time of burn.',
    not: `${NOT} Titrate to urine output and clinical response under the burns service protocol; nothing is ordered here.`,
    kaynak: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci 1968;150:874-94 (Parkland: 4 mL/kg/%TBSA over 24 hours, half in the first 8 hours). The factor is selectable because burns protocols differ.',
    alanlar: [s('kilo', 2, 300, 'kg'), s('tbsa', 1, 100, '%'), sec('katsayi', ['2', '3', '4'])],
    etiketler: { kilo: 'Weight', tbsa: 'Burn area (%TBSA, partial and full thickness)', katsayi: 'Protocol factor (mL/kg/%TBSA)' },
    secenekEtiketleri: { katsayi: { '2': '2 mL/kg/%', '3': '3 mL/kg/%', '4': '4 mL/kg/% (Parkland)' } },
    sayiAdlari: { toplam: '24-hour estimate', ilk8: 'First 8 hours', sonraki16: 'Next 16 hours' },
    sonucBirimleri: ['mL'],
    hesap: (g) => {
      const v = (g.kilo as number) * (g.tbsa as number) * Number(g.katsayi)
      return { sayilar: [{ anahtar: 'toplam', deger: Math.round(v), ondalik: 0, birim: 'mL' }, { anahtar: 'ilk8', deger: Math.round(v / 2), ondalik: 0, birim: 'mL' }, { anahtar: 'sonraki16', deger: Math.round(v / 2), ondalik: 0, birim: 'mL' }] }
    },
    ornekler: [{ girdi: { kilo: 70, tbsa: 30, katsayi: '4' }, sayilar: { toplam: 8400, ilk8: 4200 } }, { girdi: { kilo: 80, tbsa: 25, katsayi: '3' }, sayilar: { toplam: 6000 } }],
  },
  {
    sekil: 'toplam', k: 'vancouver-scar', roller: ['plastic-surgery', 'aesthetic-surgery', 'dermatology'],
    ad: 'Vancouver Scar Scale', aciklama: 'Vascularity, pigmentation, pliability and height. Total 0–13.',
    not: NOT,
    kaynak: 'Sullivan T, Smith J, Kermode J, McIver E, Courtemanche DJ. Rating the burn scar. J Burn Care Rehabil 1990;11:256-60.',
    alanlar: [i('vaskuler', 0, 3, 'Vascularity (0–3)'), i('pigment', 0, 2, 'Pigmentation (0–2)'), i('esneklik', 0, 5, 'Pliability (0–5)'), i('yukseklik', 0, 3, 'Height (0–3)')],
    ornekler: [{ girdi: { vaskuler: 2, pigment: 1, esneklik: 3, yukseklik: 2 }, toplam: 8 }],
  },
  {
    sekil: 'toplam', k: 'baker-contracture', roller: ['plastic-surgery', 'aesthetic-surgery'],
    ad: 'Baker grade of capsular contracture (breast implant)', aciklama: 'Record the grade on examination.',
    not: NOT,
    kaynak: 'Spear SL, Baker JL Jr. Classification of capsular contracture after prosthetic breast reconstruction. Plast Reconstr Surg 1995;96:1119-23.',
    toplamAdi: 'Baker grade',
    alanlar: [c('derece', 'Grade', [['1', 'I — soft, natural', 1], ['2', 'II — slightly firm, looks normal', 2], ['3', 'III — firm and visibly abnormal', 3], ['4', 'IV — hard, painful, cold and distorted', 4]])],
    bantlar: [b(1, 'i', 'Grade I'), b(2, 'ii', 'Grade II'), b(3, 'iii', 'Grade III'), b(4, 'iv', 'Grade IV')],
    ornekler: [{ girdi: { derece: '3' }, bant: 'iii' }],
  },
  {
    sekil: 'toplam', k: 'pressure-injury-stage', roller: ['plastic-surgery', 'rehabilitation-medicine', 'geriatric-medicine'],
    ad: 'Pressure injury stage', aciklama: 'Record the stage of the worst pressure injury examined.',
    not: NOT,
    kaynak: 'Edsberg LE, Black JM, Goldberg M, et al. Revised National Pressure Ulcer Advisory Panel pressure injury staging system. J Wound Ostomy Continence Nurs 2016;43:585-97.',
    toplamAdi: 'Stage',
    alanlar: [c('evre', 'Stage', [['1', 'Stage 1 — non-blanchable erythema of intact skin', 1], ['2', 'Stage 2 — partial-thickness skin loss with exposed dermis', 2], ['3', 'Stage 3 — full-thickness skin loss', 3], ['4', 'Stage 4 — full-thickness skin and tissue loss', 4], ['5', 'Unstageable — obscured full-thickness loss', 5], ['6', 'Deep tissue pressure injury', 6]])],
    bantlar: [b(1, 'e1', 'Stage 1'), b(2, 'e2', 'Stage 2'), b(3, 'e3', 'Stage 3'), b(4, 'e4', 'Stage 4'), b(5, 'evrelenemez', 'Unstageable'), b(6, 'dtpi', 'Deep tissue pressure injury')],
    ornekler: [{ girdi: { evre: '2' }, bant: 'e2' }],
  },
  {
    sekil: 'toplam', k: 'dysmorphic-concern', roller: ['aesthetic-surgery', 'aesthetic-medicine', 'plastic-surgery'],
    ad: 'Dysmorphic Concern Questionnaire (DCQ)', aciklama: 'Seven items 0–3 from the DCQ form (wording read from the form). Australian-developed screen for body dysmorphic concern, used before cosmetic procedures.',
    not: `${NOT} The Medical Board of Australia's cosmetic guidelines expect assessment for underlying psychological conditions such as body dysmorphic disorder before cosmetic surgery; a positive screen calls for assessment and referral, not a diagnosis.`,
    kaynak: 'Oosthuizen P, Lambert T, Castle DJ. Dysmorphic concern: prevalence and associations with clinical variables. Aust N Z J Psychiatry 1998;32:129-32; Mancuso SG, Knoesen NP, Castle DJ. The Dysmorphic Concern Questionnaire: a screening measure for body dysmorphic disorder. Aust N Z J Psychiatry 2010;44:535-42 (9 or more indicates concern warranting assessment).',
    toplamAdi: 'DCQ total',
    alanlar: Array.from({ length: 7 }, (_, k) => i(`m${k + 1}`, 0, 3)),
    bantlar: [b(0, 'dusuk', 'Below 9'), b(9, 'yuksek', '9 or more — dysmorphic concern: assess before proceeding')],
    ornekler: [{ girdi: { m1: 2, m2: 2, m3: 1, m4: 1, m5: 2, m6: 1, m7: 1 }, toplam: 10, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'regnault-ptosis', roller: ['aesthetic-surgery', 'plastic-surgery'],
    ad: 'Regnault classification of breast ptosis', aciklama: 'Nipple position relative to the inframammary fold.',
    not: NOT,
    kaynak: 'Regnault P. Breast ptosis: definition and treatment. Clin Plast Surg 1976;3:193-203.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['0', 'None', 0], ['p', 'Pseudoptosis — nipple above the fold, gland below', 1], ['1', 'Grade 1 — nipple at the fold', 2], ['2', 'Grade 2 — nipple below the fold, above the lower pole', 3], ['3', 'Grade 3 — nipple at the lower pole, pointing down', 4]])],
    bantlar: [b(0, 'yok', 'No ptosis'), b(1, 'psodo', 'Pseudoptosis'), b(2, 'd1', 'Grade 1'), b(3, 'd2', 'Grade 2'), b(4, 'd3', 'Grade 3')],
    ornekler: [{ girdi: { derece: '2' }, bant: 'd2' }],
  },
  // ── dermatology and non-surgical cosmetic medicine ──
  {
    sekil: 'formul', k: 'dermoscopy-tds', roller: ['dermatology'],
    ad: 'Dermoscopy ABCD rule (Total Dermoscopy Score)', aciklama: 'Asymmetry (0–2), Border (0–8 segments), Colours (1–6) and Differential structures (1–5): TDS = A×1.3 + B×0.1 + C×0.5 + D×0.5.',
    not: `${NOT} Excision decisions rest on the whole dermoscopic and clinical picture.`,
    kaynak: 'Stolz W, Riemann A, Cognetta AB, et al. ABCD rule of dermatoscopy: a new practical method for early recognition of malignant melanoma. Eur J Dermatol 1994;4:521-7 (below 4.75 benign; 4.75–5.45 suspicious; above 5.45 highly suspicious for melanoma).',
    alanlar: [s('a', 0, 2, undefined, { tam: true }), s('b', 0, 8, undefined, { tam: true }), s('c', 1, 6, undefined, { tam: true }), s('d', 1, 5, undefined, { tam: true })],
    etiketler: { a: 'Asymmetry (axes, 0–2)', b: 'Border abrupt cut-off (segments, 0–8)', c: 'Colours present (1–6)', d: 'Differential structures (1–5)' },
    sayiAdlari: { tds: 'Total Dermoscopy Score' },
    bantlar: [{ k: 'benign', e: 'Below 4.75 — benign range' }, { k: 'supheli', e: '4.75–5.45 — suspicious' }, { k: 'cok_supheli', e: 'Above 5.45 — highly suspicious' }],
    hesap: (g) => {
      const v = (g.a as number) * 1.3 + (g.b as number) * 0.1 + (g.c as number) * 0.5 + (g.d as number) * 0.5
      return { sayilar: [{ anahtar: 'tds', deger: yuvarla(v, 2), ondalik: 2 }], bant: v < 4.75 ? 'benign' : v <= 5.45 ? 'supheli' : 'cok_supheli' }
    },
    ornekler: [{ girdi: { a: 2, b: 8, c: 4, d: 3 }, sayilar: { tds: 6.9 }, bant: 'cok_supheli' }, { girdi: { a: 0, b: 2, c: 2, d: 2 }, sayilar: { tds: 2.2 }, bant: 'benign' }],
  },
  {
    sekil: 'toplam', k: 'seven-point-checklist', roller: ['dermatology', 'family-medicine'],
    ad: 'Seven-point dermoscopy checklist', aciklama: 'Three major criteria (2 points each) and four minor (1 point each). Three or more is suspicious.',
    not: NOT,
    kaynak: 'Argenziano G, Fabbrocini G, Carli P, et al. Epiluminescence microscopy for the diagnosis of doubtful melanocytic skin lesions: comparison of the ABCD rule of dermatoscopy and a new 7-point checklist based on pattern analysis. Arch Dermatol 1998;134:1563-70.',
    alanlar: [t('ag', 'Atypical pigment network', 2), t('ortu', 'Blue-whitish veil', 2), t('damar', 'Atypical vascular pattern', 2), t('cizgi', 'Irregular streaks'), t('pigment', 'Irregular pigmentation (blotches)'), t('nokta', 'Irregular dots or globules'), t('regresyon', 'Regression structures')],
    bantlar: [b(0, 'dusuk', '0–2'), b(3, 'supheli', '3 or more — suspicious')],
    ornekler: [{ girdi: { ag: true, nokta: true }, toplam: 3, bant: 'supheli' }],
  },
  {
    sekil: 'formul', k: 'salt-alopecia', roller: ['dermatology', 'aesthetic-medicine'],
    ad: 'SALT score (alopecia areata)', aciklama: 'Percentage of hair loss in each scalp area, weighted: vertex 40%, right and left sides 18% each, posterior 24%.',
    not: NOT,
    kaynak: 'Olsen EA, Hordinsky MK, Price VH, et al. Alopecia areata investigational assessment guidelines, part II. J Am Acad Dermatol 2004;51:440-7.',
    alanlar: [s('tepe', 0, 100, '%'), s('sag', 0, 100, '%'), s('sol', 0, 100, '%'), s('arka', 0, 100, '%')],
    etiketler: { tepe: 'Vertex — % hair loss', sag: 'Right side — % hair loss', sol: 'Left side — % hair loss', arka: 'Posterior — % hair loss' },
    sayiAdlari: { salt: 'SALT score' },
    sonucBirimleri: ['%'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'salt', deger: yuvarla(0.4 * (g.tepe as number) + 0.18 * (g.sag as number) + 0.18 * (g.sol as number) + 0.24 * (g.arka as number), 1), ondalik: 1, birim: '%' }] }),
    ornekler: [{ girdi: { tepe: 50, sag: 20, sol: 20, arka: 10 }, sayilar: { salt: 29.6 } }],
  },
  {
    sekil: 'toplam', k: 'fitzpatrick', roller: ['dermatology', 'aesthetic-medicine'],
    ad: 'Fitzpatrick skin phototype', aciklama: 'Record the phototype from the history of burning and tanning.',
    not: `${NOT} Relevant to sun protection advice and to laser, light and peel settings.`,
    kaynak: 'Fitzpatrick TB. The validity and practicality of sun-reactive skin types I through VI. Arch Dermatol 1988;124:869-71.',
    toplamAdi: 'Phototype',
    alanlar: [c('tip', 'Phototype', [['1', 'I — always burns, never tans', 1], ['2', 'II — usually burns, tans minimally', 2], ['3', 'III — sometimes burns, tans gradually', 3], ['4', 'IV — burns minimally, tans well', 4], ['5', 'V — rarely burns, tans profusely', 5], ['6', 'VI — never burns', 6]])],
    bantlar: [b(1, 't1', 'Type I'), b(2, 't2', 'Type II'), b(3, 't3', 'Type III'), b(4, 't4', 'Type IV'), b(5, 't5', 'Type V'), b(6, 't6', 'Type VI')],
    ornekler: [{ girdi: { tip: '2' }, bant: 't2' }],
  },
  {
    sekil: 'toplam', k: 'glogau', roller: ['aesthetic-medicine'],
    ad: 'Glogau photoageing classification', aciklama: 'Record the photoageing group.',
    not: NOT,
    kaynak: 'Glogau RG. Semin Cutan Med Surg 1996;15:134-8.',
    toplamAdi: 'Glogau group',
    alanlar: [c('grup', 'Group', [['1', 'I — no wrinkles', 1], ['2', 'II — wrinkles in motion', 2], ['3', 'III — wrinkles at rest', 3], ['4', 'IV — only wrinkles', 4]])],
    bantlar: [b(1, 'i', 'Group I'), b(2, 'ii', 'Group II'), b(3, 'iii', 'Group III'), b(4, 'iv', 'Group IV')],
    ornekler: [{ girdi: { grup: '3' }, bant: 'iii' }],
  },
  {
    sekil: 'toplam', k: 'hair-loss-pattern', roller: ['aesthetic-medicine', 'dermatology'],
    ad: 'Pattern hair loss stage (Norwood–Hamilton / Ludwig)', aciklama: 'Record the male (Norwood–Hamilton I–VII) or female (Ludwig I–III) stage before a hair-restoration plan.',
    not: NOT,
    kaynak: 'Norwood OT. Male pattern baldness: classification and incidence. South Med J 1975;68:1359-65; Ludwig E. Classification of the types of androgenetic alopecia (common baldness) occurring in the female sex. Br J Dermatol 1977;97:247-54.',
    toplamAdi: 'Stage',
    alanlar: [c('evre', 'Stage', [['n1', 'Norwood I', 1], ['n2', 'Norwood II', 2], ['n3', 'Norwood III', 3], ['n4', 'Norwood IV', 4], ['n5', 'Norwood V', 5], ['n6', 'Norwood VI', 6], ['n7', 'Norwood VII', 7], ['l1', 'Ludwig I', 11], ['l2', 'Ludwig II', 12], ['l3', 'Ludwig III', 13]])],
    bantlar: [b(1, 'norwood_erken', 'Norwood I–III'), b(4, 'norwood_ileri', 'Norwood IV–VII'), b(11, 'ludwig', 'Ludwig I–III')],
    ornekler: [{ girdi: { evre: 'n4' }, bant: 'norwood_ileri' }, { girdi: { evre: 'l2' }, bant: 'ludwig' }],
  },
  // ── urology ──
  {
    sekil: 'formul', k: 'prostate-volume-psad', roller: ['urology', 'radiology'],
    ad: 'Prostate volume (ellipsoid) and PSA density', aciklama: 'Volume = length × width × height × 0.52 (cm, from ultrasound or MRI). With PSA (µg/L) entered, PSA density is shown.',
    not: `${NOT} Biopsy and MRI decisions follow the Australian prostate cancer early-detection guideline and the urologist.`,
    kaynak: 'Terris MK, Stamey TA. Determination of prostate volume by transrectal ultrasound. J Urol 1991;145:984-7 (ellipsoid π/6 ≈ 0.52); Benson MC, Whang IS, Pantuck A, et al. Prostate specific antigen density: a means of distinguishing benign prostatic hypertrophy and prostate cancer. J Urol 1992;147:815-6 (0.15 as a commonly used threshold).',
    alanlar: [s('uzunluk', 1, 15, 'cm'), s('genislik', 1, 15, 'cm'), s('yukseklik', 1, 15, 'cm'), s('psa', 0.01, 1000, 'µg/L', { istege: true })],
    etiketler: { uzunluk: 'Length', genislik: 'Width', yukseklik: 'Height (antero-posterior)', psa: 'PSA (optional)' },
    sayiAdlari: { hacim: 'Volume', psad: 'PSA density' },
    sonucBirimleri: ['mL'],
    bantlar: [{ k: 'alt', e: 'PSA density below 0.15' }, { k: 'ust', e: 'PSA density 0.15 or more' }],
    hesap: (g) => {
      const v = (g.uzunluk as number) * (g.genislik as number) * (g.yukseklik as number) * 0.52
      const sayilar = [{ anahtar: 'hacim', deger: yuvarla(v, 0), ondalik: 0, birim: 'mL' }]
      if (!sayiMi(g.psa)) return { sayilar }
      const d = (g.psa as number) / v
      return { sayilar: [...sayilar, { anahtar: 'psad', deger: yuvarla(d, 2), ondalik: 2 }], bant: d >= 0.15 ? 'ust' : 'alt' }
    },
    ornekler: [{ girdi: { uzunluk: 5, genislik: 4.5, yukseklik: 4 }, sayilar: { hacim: 47 } }, { girdi: { uzunluk: 4, genislik: 4, yukseklik: 3, psa: 6 }, sayilar: { hacim: 25, psad: 0.24 }, bant: 'ust' }],
  },
  {
    sekil: 'toplam', k: 'guys-stone', roller: ['urology'],
    ad: 'Guy\'s stone score (percutaneous nephrolithotomy)', aciklama: 'Record the grade from CT before PCNL.',
    not: NOT,
    kaynak: 'Thomas K, Smith NC, Hegarty N, Glass JM. The Guy\'s stone score — grading the complexity of percutaneous nephrolithotomy procedures. Urology 2011;78:277-81.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['1', 'I — solitary stone in mid/lower pole or pelvis, simple anatomy', 1], ['2', 'II — solitary upper-pole stone, multiple stones in simple anatomy, or solitary stone in abnormal anatomy', 2], ['3', 'III — multiple stones in abnormal anatomy, calyceal diverticulum, or partial staghorn', 3], ['4', 'IV — staghorn, or any stone in spina bifida or spinal injury', 4]])],
    bantlar: [b(1, 'i', 'Grade I'), b(2, 'ii', 'Grade II'), b(3, 'iii', 'Grade III'), b(4, 'iv', 'Grade IV')],
    ornekler: [{ girdi: { derece: '4' }, bant: 'iv' }],
  },
  // ── orthopaedics and sport ──
  {
    sekil: 'formul', k: 'ottawa-knee', roller: ['orthopaedics', 'emergency-medicine', 'sports-medicine'],
    ad: 'Ottawa knee rule', aciklama: 'Knee X-ray after acute injury is indicated if any criterion is present (adults).',
    not: NOT,
    kaynak: 'Stiell IG, Greenberg GH, Wells GA, et al. Prospective validation of a decision rule for the use of radiography in acute knee injuries. JAMA 1996;275:611-5.',
    alanlar: [{ anahtar: 'yas', tur: 'isaret' }, { anahtar: 'patella', tur: 'isaret' }, { anahtar: 'fibula', tur: 'isaret' }, { anahtar: 'fleksiyon', tur: 'isaret' }, { anahtar: 'yuk', tur: 'isaret' }],
    etiketler: { yas: 'Age 55 or older', patella: 'Isolated tenderness of the patella', fibula: 'Tenderness at the head of the fibula', fleksiyon: 'Unable to flex to 90°', yuk: 'Unable to bear weight four steps, immediately and in the department' },
    sayiAdlari: { bulgu: 'Criteria present' },
    bantlar: [{ k: 'gerekmez', e: 'No criterion — X-ray not indicated by the rule' }, { k: 'gerekli', e: 'X-ray indicated' }],
    hesap: (g) => {
      const n = ['yas', 'patella', 'fibula', 'fleksiyon', 'yuk'].filter((k) => g[k] === true).length
      return { sayilar: [{ anahtar: 'bulgu', deger: n, ondalik: 0, enCok: 5 }], bant: n ? 'gerekli' : 'gerekmez' }
    },
    ornekler: [{ girdi: { hicbiri: true }, bant: 'gerekmez' }, { girdi: { fibula: true }, bant: 'gerekli' }],
  },
  {
    sekil: 'toplam', k: 'kellgren-lawrence', roller: ['orthopaedics', 'rheumatology'],
    ad: 'Kellgren–Lawrence radiographic grade (osteoarthritis)', aciklama: 'Record the grade from the plain radiograph.',
    not: NOT,
    kaynak: 'Kellgren JH, Lawrence JS. Radiological assessment of osteo-arthrosis. Ann Rheum Dis 1957;16:494-502.',
    toplamAdi: 'KL grade',
    alanlar: [c('derece', 'Grade', [['0', '0 — no features', 0], ['1', '1 — doubtful narrowing, possible osteophyte', 1], ['2', '2 — definite osteophytes, possible narrowing', 2], ['3', '3 — multiple osteophytes, definite narrowing, some sclerosis', 3], ['4', '4 — large osteophytes, marked narrowing, severe sclerosis, deformity', 4]])],
    ornekler: [{ girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'gustilo-anderson', roller: ['orthopaedics', 'plastic-surgery'],
    ad: 'Gustilo–Anderson classification (open fractures)', aciklama: 'Record the type; final typing is made at debridement.',
    not: `${NOT} Antibiotic prophylaxis follows Therapeutic Guidelines and local protocols.`,
    kaynak: 'Gustilo RB, Anderson JT. Prevention of infection in the treatment of one thousand and twenty-five open fractures of long bones. J Bone Joint Surg Am 1976;58:453-8; Gustilo RB, Mendoza RM, Williams DN. J Trauma 1984;24:742-6 (type III subdivisions).',
    toplamAdi: 'Type',
    alanlar: [c('tip', 'Type', [['1', 'I — wound under 1 cm, clean', 1], ['2', 'II — wound 1–10 cm, without extensive soft-tissue damage', 2], ['3a', 'IIIA — adequate soft-tissue coverage despite extensive damage', 3], ['3b', 'IIIB — periosteal stripping, needs flap cover', 4], ['3c', 'IIIC — arterial injury needing repair', 5]])],
    bantlar: [b(1, 'i', 'Type I'), b(2, 'ii', 'Type II'), b(3, 'iiia', 'Type IIIA'), b(4, 'iiib', 'Type IIIB'), b(5, 'iiic', 'Type IIIC')],
    ornekler: [{ girdi: { tip: '3b' }, bant: 'iiib' }],
  },
  {
    sekil: 'toplam', k: 'beighton', roller: ['orthopaedics', 'sports-medicine', 'physiotherapy'],
    ad: 'Beighton score (joint hypermobility)', aciklama: 'Nine points: little finger, thumb, elbow and knee on each side, and forward flexion.',
    not: `${NOT} Thresholds for generalised hypermobility depend on age (≥6 pre-pubertal, ≥5 to age 50, ≥4 over 50).`,
    kaynak: 'Beighton P, Solomon L, Soskolne CL. Articular mobility in an African population. Ann Rheum Dis 1973;32:413-8; Malfait F, et al. The 2017 international classification of the Ehlers–Danlos syndromes. Am J Med Genet C Semin Med Genet 2017;175:8-26.',
    alanlar: [t('serce_sag', 'Right little finger passive dorsiflexion beyond 90°'), t('serce_sol', 'Left little finger passive dorsiflexion beyond 90°'), t('bas_sag', 'Right thumb passively to the forearm'), t('bas_sol', 'Left thumb passively to the forearm'), t('dirsek_sag', 'Right elbow hyperextension beyond 10°'), t('dirsek_sol', 'Left elbow hyperextension beyond 10°'), t('diz_sag', 'Right knee hyperextension beyond 10°'), t('diz_sol', 'Left knee hyperextension beyond 10°'), t('govde', 'Palms flat on the floor with knees straight')],
    ornekler: [{ girdi: { serce_sag: true, serce_sol: true, dirsek_sag: true, dirsek_sol: true, govde: true }, toplam: 5 }],
  },
  {
    sekil: 'formul', k: 'acwr', roller: ['sports-medicine'],
    ad: 'Acute:chronic workload ratio', aciklama: 'This week\'s training load divided by the average weekly load of the last four weeks (same unit, e.g. session-RPE × minutes).',
    not: `${NOT} One input to load management, not an injury predictor on its own.`,
    kaynak: 'Gabbett TJ. The training–injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med 2016;50:273-80 (0.8–1.3 described as the lower-risk range; above 1.5 a higher-risk range).',
    alanlar: [s('akut', 0, 100000), s('h1', 0, 100000), s('h2', 0, 100000), s('h3', 0, 100000), s('h4', 0, 100000)],
    etiketler: { akut: 'Load this week', h1: 'Load, week 1 (most recent)', h2: 'Load, week 2', h3: 'Load, week 3', h4: 'Load, week 4' },
    sayiAdlari: { kronik: 'Chronic (4-week average)', oran: 'Acute:chronic ratio' },
    bantlar: [{ k: 'dusuk', e: 'Below 0.8 — under-loading relative to recent weeks' }, { k: 'hedef', e: '0.8–1.3' }, { k: 'artmis', e: 'Above 1.3 to 1.5' }, { k: 'yuksek', e: 'Above 1.5 — spike relative to recent weeks' }],
    hesap: (g) => {
      const kr = ((g.h1 as number) + (g.h2 as number) + (g.h3 as number) + (g.h4 as number)) / 4
      if (kr <= 0) return null
      const o = (g.akut as number) / kr
      return { sayilar: [{ anahtar: 'kronik', deger: yuvarla(kr, 0), ondalik: 0 }, { anahtar: 'oran', deger: yuvarla(o, 2), ondalik: 2 }], bant: o < 0.8 ? 'dusuk' : o <= 1.3 ? 'hedef' : o <= 1.5 ? 'artmis' : 'yuksek' }
    },
    ornekler: [{ girdi: { akut: 1500, h1: 1000, h2: 1000, h3: 900, h4: 1100 }, sayilar: { kronik: 1000, oran: 1.5 }, bant: 'artmis' }],
  },
  {
    sekil: 'formul', k: 'cooper-vo2', roller: ['sports-medicine'],
    ad: 'Estimated VO2max from the Cooper 12-minute run', aciklama: 'VO2max (mL/kg/min) = (distance in metres − 504.9) / 44.73.',
    not: NOT,
    kaynak: 'Cooper KH. A means of assessing maximal oxygen intake: correlation between field and treadmill testing. JAMA 1968;203:201-4.',
    alanlar: [s('mesafe', 600, 5000, 'm')],
    etiketler: { mesafe: 'Distance covered in 12 minutes' },
    sayiAdlari: { vo2: 'Estimated VO2max' },
    sonucBirimleri: ['mL/kg/min'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'vo2', deger: yuvarla(((g.mesafe as number) - 504.9) / 44.73, 1), ondalik: 1, birim: 'mL/kg/min' }] }),
    ornekler: [{ girdi: { mesafe: 2800 }, sayilar: { vo2: 51.3 } }],
  },
  // ── ophthalmology ──
  {
    sekil: 'formul', k: 'areds-simple', roller: ['ophthalmology'],
    ad: 'AREDS simplified severity scale (AMD)', aciklama: 'One point per eye for large drusen and for pigment abnormalities; one point for bilateral intermediate drusen with no large drusen. Five-year risk of advanced AMD by the source.',
    not: NOT,
    kaynak: 'Ferris FL, Davis MD, Clemons TE, et al. A simplified severity scale for age-related macular degeneration: AREDS report no. 18. Arch Ophthalmol 2005;123:1570-4 (0: 0.5%, 1: 3%, 2: 12%, 3: 25%, 4: 50% five-year risk).',
    alanlar: [{ anahtar: 'druzen_sag', tur: 'isaret' }, { anahtar: 'druzen_sol', tur: 'isaret' }, { anahtar: 'pigment_sag', tur: 'isaret' }, { anahtar: 'pigment_sol', tur: 'isaret' }, { anahtar: 'orta_iki', tur: 'isaret' }],
    etiketler: { druzen_sag: 'Right eye: large drusen (≥125 µm)', druzen_sol: 'Left eye: large drusen (≥125 µm)', pigment_sag: 'Right eye: pigment abnormalities', pigment_sol: 'Left eye: pigment abnormalities', orta_iki: 'Intermediate drusen in both eyes and no large drusen in either' },
    sayiAdlari: { skor: 'Severity score' },
    bantlar: [{ k: 's0', e: 'Score 0 — about 0.5% five-year risk' }, { k: 's1', e: 'Score 1 — about 3%' }, { k: 's2', e: 'Score 2 — about 12%' }, { k: 's3', e: 'Score 3 — about 25%' }, { k: 's4', e: 'Score 4 — about 50%' }],
    hesap: (g) => {
      const buyuk = ['druzen_sag', 'druzen_sol'].filter((k) => g[k] === true).length
      let n = buyuk + ['pigment_sag', 'pigment_sol'].filter((k) => g[k] === true).length
      if (g.orta_iki === true && buyuk === 0) n += 1
      n = Math.min(4, n)
      return { sayilar: [{ anahtar: 'skor', deger: n, ondalik: 0, enCok: 4 }], bant: `s${n}` }
    },
    ornekler: [{ girdi: { druzen_sag: true, pigment_sag: true }, sayilar: { skor: 2 }, bant: 's2' }, { girdi: { orta_iki: true }, bant: 's1' }],
  },
  {
    sekil: 'toplam', k: 'dr-severity', roller: ['ophthalmology', 'endocrinology'],
    ad: 'International clinical diabetic retinopathy severity', aciklama: 'Record the retinopathy level of the worse eye; note macular oedema separately.',
    not: `${NOT} Screening intervals follow the Australian diabetic retinopathy guideline and the treating eye care professional.`,
    kaynak: 'Wilkinson CP, Ferris FL 3rd, Klein RE, et al. Ophthalmology 2003;110:1677-82.',
    toplamAdi: 'Level',
    alanlar: [c('duzey', 'Level', [['0', 'No apparent retinopathy', 0], ['1', 'Mild non-proliferative (microaneurysms only)', 1], ['2', 'Moderate non-proliferative', 2], ['3', 'Severe non-proliferative', 3], ['4', 'Proliferative', 4]]), t('makula_odem', 'Diabetic macular oedema present', 0)],
    bantlar: [b(0, 'yok', 'No apparent retinopathy'), b(1, 'hafif', 'Mild NPDR'), b(2, 'orta', 'Moderate NPDR'), b(3, 'agir', 'Severe NPDR'), b(4, 'pdr', 'Proliferative DR')],
    uyarilar: [{ k: 'makula', e: 'Macular oedema recorded — refer under the guideline.', kosul: (_x, g) => g.makula_odem === true }],
    ornekler: [{ girdi: { duzey: '2', makula_odem: true }, bant: 'orta', uyarilar: ['makula'] }],
  },
  {
    sekil: 'toplam', k: 'ocular-trauma-score', roller: ['ophthalmology', 'emergency-medicine'],
    ad: 'Ocular Trauma Score', aciklama: 'Initial visual acuity points minus points for rupture, endophthalmitis, perforating injury, retinal detachment and RAPD.',
    not: NOT,
    kaynak: 'Kuhn F, Maisiak R, Mann L, et al. The Ocular Trauma Score (OTS). Ophthalmol Clin North Am 2002;15:163-5 (raw 0–44 category 1, 45–65 2, 66–80 3, 81–91 4, 92–100 5).',
    toplamAdi: 'OTS raw score',
    alanlar: [c('gk', 'Initial visual acuity', [['nlp', 'No light perception', 60], ['lp', 'Light perception or hand motion', 70], ['d1', '1/200 to 19/200 (≈ 6/1200 to 6/63)', 80], ['d2', '20/200 to 20/50 (≈ 6/60 to 6/15)', 90], ['d3', '20/40 or better (≈ 6/12 or better)', 100]]), t('ruptur', 'Globe rupture', -23), t('endoftalmi', 'Endophthalmitis', -17), t('perforan', 'Perforating injury', -14), t('rd', 'Retinal detachment', -11), t('rapd', 'Relative afferent pupillary defect', -10)],
    bantlar: [b(-1000, 'k1', 'Category 1 (0–44)'), b(45, 'k2', 'Category 2 (45–65)'), b(66, 'k3', 'Category 3 (66–80)'), b(81, 'k4', 'Category 4 (81–91)'), b(92, 'k5', 'Category 5 (92–100)')],
    ornekler: [{ girdi: { gk: 'lp', ruptur: true, rapd: true }, toplam: 37, bant: 'k1' }, { girdi: { gk: 'd3' }, toplam: 100, bant: 'k5' }],
  },
  {
    sekil: 'toplam', k: 'van-herick', roller: ['ophthalmology'],
    ad: 'Van Herick anterior chamber angle grade', aciklama: 'Peripheral anterior chamber depth as a fraction of corneal thickness at the slit lamp.',
    not: `${NOT} Gonioscopy confirms the angle.`,
    kaynak: 'Van Herick W, Shaffer RN, Schwartz A. Estimation of width of angle of anterior chamber: incidence and significance of the narrow angle. Am J Ophthalmol 1969;68:626-9.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['4', '4 — depth equal to or more than corneal thickness', 4], ['3', '3 — ¼ to ½ corneal thickness', 3], ['2', '2 — ¼ corneal thickness', 2], ['1', '1 — less than ¼ corneal thickness', 1], ['0', '0 — closed', 0]])],
    bantlar: [b(0, 'kapali_risk', '0–2 — narrow: gonioscopy indicated'), b(3, 'acik', '3–4 — open')],
    ornekler: [{ girdi: { derece: '1' }, bant: 'kapali_risk' }],
  },
  // ── otolaryngology ──
  {
    sekil: 'toplam', k: 'lund-mackay', roller: ['otolaryngology', 'radiology'],
    ad: 'Lund–Mackay CT score (chronic rhinosinusitis)', aciklama: 'Each sinus 0 (clear), 1 (partial) or 2 (complete opacification); osteomeatal complex 0 or 2; both sides. Total 0–24.',
    not: NOT,
    kaynak: 'Lund VJ, Mackay IS. Staging in rhinosinusitis. Rhinology 1993;31:183-4.',
    alanlar: ['sag', 'sol'].flatMap((y) => [i(`maksiller_${y}`, 0, 2, `Maxillary (${y === 'sag' ? 'right' : 'left'})`), i(`on_etmoid_${y}`, 0, 2, `Anterior ethmoid (${y === 'sag' ? 'right' : 'left'})`), i(`arka_etmoid_${y}`, 0, 2, `Posterior ethmoid (${y === 'sag' ? 'right' : 'left'})`), i(`sfenoid_${y}`, 0, 2, `Sphenoid (${y === 'sag' ? 'right' : 'left'})`), i(`frontal_${y}`, 0, 2, `Frontal (${y === 'sag' ? 'right' : 'left'})`), c(`omk_${y}`, `Osteomeatal complex (${y === 'sag' ? 'right' : 'left'})`, [['0', 'Not occluded', 0], ['2', 'Occluded', 2]])]),
    ornekler: [{ girdi: { maksiller_sag: 2, on_etmoid_sag: 1, arka_etmoid_sag: 1, sfenoid_sag: 0, frontal_sag: 1, omk_sag: '2', maksiller_sol: 1, on_etmoid_sol: 1, arka_etmoid_sol: 0, sfenoid_sol: 0, frontal_sol: 0, omk_sol: '0' }, toplam: 9 }],
  },
  {
    sekil: 'toplam', k: 'house-brackmann', roller: ['otolaryngology', 'neurology'],
    ad: 'House–Brackmann facial nerve grade', aciklama: 'Record the grade of facial nerve function.',
    not: NOT,
    kaynak: 'House JW, Brackmann DE. Facial nerve grading system. Otolaryngol Head Neck Surg 1985;93:146-7.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['1', 'I — normal', 1], ['2', 'II — mild dysfunction', 2], ['3', 'III — moderate dysfunction', 3], ['4', 'IV — moderately severe dysfunction', 4], ['5', 'V — severe dysfunction', 5], ['6', 'VI — total paralysis', 6]])],
    bantlar: [b(1, 'i', 'Grade I'), b(2, 'ii', 'Grade II'), b(3, 'iii', 'Grade III'), b(4, 'iv', 'Grade IV'), b(5, 'v', 'Grade V'), b(6, 'vi', 'Grade VI')],
    ornekler: [{ girdi: { derece: '4' }, bant: 'iv' }],
  },
  {
    sekil: 'toplam', k: 'brodsky-tonsil', roller: ['otolaryngology', 'paediatrics'],
    ad: 'Brodsky tonsil size grade', aciklama: 'Proportion of the oropharyngeal airway occupied by the tonsils.',
    not: NOT,
    kaynak: 'Brodsky L. Modern assessment of tonsils and adenoids. Pediatr Clin North Am 1989;36:1551-69.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['0', '0 — within the tonsillar fossa', 0], ['1', '1 — under 25% of the airway', 1], ['2', '2 — 25–50%', 2], ['3', '3 — 50–75%', 3], ['4', '4 — over 75%', 4]])],
    ornekler: [{ girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'mcisaac', roller: ['family-medicine', 'otolaryngology', 'paediatrics'],
    ad: 'Centor score with McIsaac age adjustment (sore throat)', aciklama: 'Fever, absent cough, tender anterior cervical nodes, tonsillar swelling or exudate, and age.',
    not: `${NOT} Australian guidance limits antibiotics for sore throat; people at high risk of acute rheumatic fever follow the Australian ARF/RHD guideline regardless of this score.`,
    kaynak: 'McIsaac WJ, White D, Tannenbaum D, Low DE. A clinical score to reduce unnecessary antibiotic use in patients with sore throat. CMAJ 1998;158:75-83.',
    alanlar: [t('ates', 'Temperature above 38 °C'), t('oksuruk_yok', 'Absence of cough'), t('lenf', 'Tender, swollen anterior cervical nodes'), t('tonsil', 'Tonsillar swelling or exudate'), c('yas', 'Age', [['3_14', '3–14 years', 1], ['15_44', '15–44 years', 0], ['45', '45 years or older', -1]])],
    bantlar: [b(-1, 'dusuk', '0 or less'), b(1, 'orta', '1–3'), b(4, 'yuksek', '4 or more')],
    ornekler: [{ girdi: { ates: true, oksuruk_yok: true, lenf: true, tonsil: true, yas: '3_14' }, toplam: 5, bant: 'yuksek' }, { girdi: { yas: '45' }, toplam: -1, bant: 'dusuk' }],
  },
  // ── radiology ──
  {
    sekil: 'formul', k: 'adrenal-washout', roller: ['radiology', 'endocrinology'],
    ad: 'Adrenal washout (CT)', aciklama: 'Absolute and relative percentage washout from unenhanced, enhanced (60–70 s) and delayed (15 min) attenuation in HU.',
    not: NOT,
    kaynak: 'Caoili EM, Korobkin M, Francis IR, et al. Radiology 2002;222:629-33 (absolute ≥60% or relative ≥40% consistent with adenoma).',
    alanlar: [s('kontrastsiz', -100, 200, 'HU', { istege: true }), s('kontrastli', -100, 400, 'HU'), s('gec', -100, 400, 'HU')],
    etiketler: { kontrastsiz: 'Unenhanced attenuation (optional)', kontrastli: 'Enhanced attenuation (60–70 s)', gec: 'Delayed attenuation (15 min)' },
    sayiAdlari: { mutlak: 'Absolute washout', goreli: 'Relative washout' },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'adenom', e: 'Washout consistent with adenoma' }, { k: 'belirsiz', e: 'Washout not in the adenoma range' }],
    hesap: (g) => {
      const E = g.kontrastli as number, D = g.gec as number
      if (E === 0) return null
      const goreli = ((E - D) / E) * 100
      const sayilar = [{ anahtar: 'goreli', deger: yuvarla(goreli, 0), ondalik: 0, birim: '%' }]
      let mutlak: number | null = null
      if (sayiMi(g.kontrastsiz) && E !== g.kontrastsiz) { mutlak = ((E - D) / (E - (g.kontrastsiz as number))) * 100; sayilar.unshift({ anahtar: 'mutlak', deger: yuvarla(mutlak, 0), ondalik: 0, birim: '%' }) }
      return { sayilar, bant: (mutlak !== null && mutlak >= 60) || goreli >= 40 ? 'adenom' : 'belirsiz' }
    },
    ornekler: [{ girdi: { kontrastsiz: 20, kontrastli: 80, gec: 40 }, sayilar: { mutlak: 67, goreli: 50 }, bant: 'adenom' }, { girdi: { kontrastli: 100, gec: 80 }, sayilar: { goreli: 20 }, bant: 'belirsiz' }],
  },
  {
    sekil: 'formul', k: 'ct-effective-dose', roller: ['radiology'],
    ad: 'CT effective dose estimate from DLP', aciklama: 'Effective dose ≈ DLP × region coefficient (adult). An estimate for the record, not a patient-specific dose.',
    not: `${NOT} Coefficients are adult values; paediatric coefficients differ.`,
    kaynak: 'American Association of Physicists in Medicine. The measurement, reporting, and management of radiation dose in CT. AAPM Report No. 96 (2008), table of k coefficients (mSv per mGy·cm): head 0.0021, neck 0.0059, chest 0.014, abdomen and pelvis 0.015.',
    alanlar: [s('dlp', 1, 20000, 'mGy·cm'), sec('bolge', ['bas', 'boyun', 'gogus', 'karin'])],
    etiketler: { dlp: 'Dose–length product', bolge: 'Region' },
    secenekEtiketleri: { bolge: { bas: 'Head', boyun: 'Neck', gogus: 'Chest', karin: 'Abdomen and pelvis' } },
    sayiAdlari: { doz: 'Estimated effective dose' },
    sonucBirimleri: ['mSv'],
    hesap: (g) => {
      const k = ({ bas: 0.0021, boyun: 0.0059, gogus: 0.014, karin: 0.015 } as Record<string, number>)[g.bolge as string]
      return { sayilar: [{ anahtar: 'doz', deger: yuvarla((g.dlp as number) * k, 1), ondalik: 1, birim: 'mSv' }] }
    },
    ornekler: [{ girdi: { dlp: 1000, bolge: 'bas' }, sayilar: { doz: 2.1 } }, { girdi: { dlp: 500, bolge: 'karin' }, sayilar: { doz: 7.5 } }],
  },
  {
    sekil: 'toplam', k: 'bosniak', roller: ['radiology', 'urology'],
    ad: 'Bosniak classification of cystic renal masses (2019)', aciklama: 'Record the class from CT or MRI features.',
    not: NOT,
    kaynak: 'Silverman SG, Pedrosa I, Ellis JH, et al. Bosniak classification of cystic renal masses, version 2019: an update proposal and needs assessment. Radiology 2019;292:475-88.',
    toplamAdi: 'Class',
    alanlar: [c('sinif', 'Class', [['1', 'I', 1], ['2', 'II', 2], ['2f', 'IIF', 3], ['3', 'III', 4], ['4', 'IV', 5]])],
    bantlar: [b(1, 'i', 'Class I — benign'), b(2, 'ii', 'Class II — benign'), b(3, 'iif', 'Class IIF — follow-up imaging'), b(4, 'iii', 'Class III — indeterminate'), b(5, 'iv', 'Class IV — likely malignant')],
    ornekler: [{ girdi: { sinif: '2f' }, bant: 'iif' }],
  },
]
