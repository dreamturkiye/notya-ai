/**
 * ULKE-BRANS-DERINLIK-01 — Australia: specialty tools of general medicine, endocrinology, infectious diseases,
 * gastroenterology, nephrology, haematology, medical and radiation oncology, rheumatology, respiratory medicine,
 * immunology and allergy, and geriatric medicine. Australian laboratory units (mmol/L, µmol/L, g/L). See ./motor.ts.
 */
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'

const NOT = 'A result from what you entered, by the published method shown. It informs, it does not decide: the treating clinician weighs it with the whole patient and approves the note.'
const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })

export const DAHILIYE: readonly UzmanlikSatiri[] = [
  // ── general medicine ──
  {
    sekil: 'toplam', k: 'curb-65', roller: ['internal-medicine', 'respiratory-medicine', 'infectious-diseases'],
    ad: 'CURB-65 severity of community-acquired pneumonia', aciklama: 'Confusion, Urea, Respiratory rate, Blood pressure, age 65 or older.',
    not: `${NOT} Australian practice also uses SMART-COP for intensive respiratory or vasopressor support; site of care is a clinical decision.`,
    kaynak: 'Lim WS, van der Eerden MM, Laing R, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax 2003;58:377-82 (0–1 low, 2 moderate, 3–5 high severity).',
    alanlar: [t('konfuzyon', 'New confusion'), t('ure', 'Urea above 7 mmol/L'), t('solunum', 'Respiratory rate 30 per minute or more'), t('tansiyon', 'Systolic BP below 90 or diastolic 60 mmHg or less'), t('yas', 'Age 65 or older')],
    bantlar: [b(0, 'dusuk', '0–1 — low severity'), b(2, 'orta', '2 — moderate severity'), b(3, 'yuksek', '3–5 — high severity')],
    ornekler: [{ girdi: { yas: true }, toplam: 1, bant: 'dusuk' }, { girdi: { ure: true, yas: true }, toplam: 2, bant: 'orta' }, { girdi: { konfuzyon: true, ure: true, solunum: true, yas: true }, toplam: 4, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'corrected-calcium', roller: ['internal-medicine', 'endocrinology', 'nephrology'],
    ad: 'Albumin-adjusted calcium', aciklama: 'Adjusts total calcium for serum albumin in Australian units. Ionised calcium is preferred when available.',
    not: `${NOT} The adjustment is unreliable in kidney failure and critical illness; read with the laboratory's own interval.`,
    kaynak: 'Payne RB, Little AJ, Williams RB, Milner JR. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ 1973;4:643-6 (adjusted Ca = Ca + 0.02 × (40 − albumin g/L), mmol/L).',
    alanlar: [s('ca', 0.5, 5, 'mmol/L'), s('albumin', 5, 70, 'g/L')],
    etiketler: { ca: 'Total calcium', albumin: 'Albumin' },
    sayiAdlari: { duzeltilmis: 'Albumin-adjusted calcium' },
    sonucBirimleri: ['mmol/L'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'duzeltilmis', deger: yuvarla((g.ca as number) + 0.02 * (40 - (g.albumin as number)), 2), ondalik: 2, birim: 'mmol/L' }] }),
    ornekler: [{ girdi: { ca: 2.1, albumin: 30 }, sayilar: { duzeltilmis: 2.3 } }, { girdi: { ca: 2.4, albumin: 40 }, sayilar: { duzeltilmis: 2.4 } }],
  },
  {
    sekil: 'formul', k: 'anion-gap', roller: ['internal-medicine', 'nephrology', 'endocrinology'],
    ad: 'Anion gap (with albumin adjustment)', aciklama: 'Na − (Cl + HCO3). With albumin entered, the albumin-adjusted gap is shown as well.',
    not: `${NOT} Reference intervals depend on the laboratory's analyser; compare with its own range.`,
    kaynak: 'Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med 1998;26:1807-10 (adjusted AG = AG + 0.25 × (40 − albumin g/L)).',
    alanlar: [s('na', 100, 180, 'mmol/L'), s('cl', 60, 150, 'mmol/L'), s('hco3', 2, 50, 'mmol/L'), s('albumin', 5, 70, 'g/L', { istege: true })],
    etiketler: { na: 'Sodium', cl: 'Chloride', hco3: 'Bicarbonate', albumin: 'Albumin (optional)' },
    sayiAdlari: { ag: 'Anion gap', duzeltilmis: 'Albumin-adjusted anion gap' },
    sonucBirimleri: ['mmol/L'],
    hesap: (g) => {
      const ag = (g.na as number) - ((g.cl as number) + (g.hco3 as number))
      const sayilar = [{ anahtar: 'ag', deger: yuvarla(ag, 1), ondalik: 1, birim: 'mmol/L' }]
      if (sayiMi(g.albumin)) sayilar.push({ anahtar: 'duzeltilmis', deger: yuvarla(ag + 0.25 * (40 - (g.albumin as number)), 1), ondalik: 1, birim: 'mmol/L' })
      return { sayilar }
    },
    ornekler: [{ girdi: { na: 140, cl: 100, hco3: 24 }, sayilar: { ag: 16 } }, { girdi: { na: 135, cl: 98, hco3: 12, albumin: 20 }, sayilar: { ag: 25, duzeltilmis: 30 } }],
  },
  {
    sekil: 'formul', k: 'calculated-osmolality', roller: ['internal-medicine', 'endocrinology', 'nephrology'],
    ad: 'Calculated serum osmolality and osmolal gap', aciklama: '2 × Na + glucose + urea (mmol/L). With a measured osmolality, the osmolal gap is shown.',
    not: NOT,
    kaynak: 'Dorwart WV, Chalmers L. Comparison of methods for calculating serum osmolality from chemical concentrations, and the prognostic value of such calculations. Clin Chem 1975;21:190-4 (2Na + glucose + urea, SI units).',
    alanlar: [s('na', 100, 180, 'mmol/L'), s('glukoz', 0.5, 100, 'mmol/L'), s('ure', 0.5, 100, 'mmol/L'), s('olculen', 200, 450, 'mOsm/kg', { istege: true })],
    etiketler: { na: 'Sodium', glukoz: 'Glucose', ure: 'Urea', olculen: 'Measured osmolality (optional)' },
    sayiAdlari: { hesaplanan: 'Calculated osmolality', aralik: 'Osmolal gap' },
    sonucBirimleri: ['mOsm/kg'],
    hesap: (g) => {
      const h = 2 * (g.na as number) + (g.glukoz as number) + (g.ure as number)
      const sayilar = [{ anahtar: 'hesaplanan', deger: yuvarla(h, 0), ondalik: 0, birim: 'mOsm/kg' }]
      if (sayiMi(g.olculen)) sayilar.push({ anahtar: 'aralik', deger: yuvarla((g.olculen as number) - h, 0), ondalik: 0, birim: 'mOsm/kg' })
      return { sayilar }
    },
    ornekler: [{ girdi: { na: 140, glukoz: 5, ure: 5 }, sayilar: { hesaplanan: 290 } }, { girdi: { na: 130, glukoz: 30, ure: 10, olculen: 320 }, sayilar: { hesaplanan: 300, aralik: 20 } }],
  },
  // ── endocrinology ──
  {
    sekil: 'formul', k: 'homa-ir', roller: ['endocrinology'],
    ad: 'HOMA-IR (homeostasis model assessment of insulin resistance)', aciklama: 'Fasting glucose (mmol/L) × fasting insulin (mU/L) ÷ 22.5.',
    not: `${NOT} No diagnostic cut-off is shown: thresholds vary with population and insulin assay.`,
    kaynak: 'Matthews DR, Hosker JP, Rudenski AS, et al. Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man. Diabetologia 1985;28:412-9.',
    alanlar: [s('glukoz', 1, 40, 'mmol/L'), s('insulin', 0.5, 500, 'mU/L')],
    etiketler: { glukoz: 'Fasting glucose', insulin: 'Fasting insulin' },
    sayiAdlari: { homa: 'HOMA-IR' },
    hesap: (g) => ({ sayilar: [{ anahtar: 'homa', deger: yuvarla(((g.glukoz as number) * (g.insulin as number)) / 22.5, 2), ondalik: 2 }] }),
    ornekler: [{ girdi: { glukoz: 5, insulin: 10 }, sayilar: { homa: 2.22 } }],
  },
  {
    sekil: 'toplam', k: 'burch-wartofsky', roller: ['endocrinology', 'emergency-medicine'],
    ad: 'Burch–Wartofsky point scale for thyroid storm', aciklama: 'Temperature, central nervous system, gastrointestinal–hepatic, heart rate, heart failure, atrial fibrillation and precipitant.',
    not: `${NOT} Thyroid storm is a clinical diagnosis; treat on suspicion.`,
    kaynak: 'Burch HB, Wartofsky L. Life-threatening thyrotoxicosis: thyroid storm. Endocrinol Metab Clin North Am 1993;22:263-77 (≥45 highly suggestive, 25–44 impending, <25 unlikely).',
    alanlar: [
      c('ates', 'Temperature (°C)', [['n', 'Below 37.2', 0], ['5', '37.2–37.7', 5], ['10', '37.8–38.2', 10], ['15', '38.3–38.8', 15], ['20', '38.9–39.3', 20], ['25', '39.4–39.9', 25], ['30', '40.0 or higher', 30]]),
      c('mss', 'Central nervous system', [['0', 'Absent', 0], ['10', 'Mild (agitation)', 10], ['20', 'Moderate (delirium, psychosis, extreme lethargy)', 20], ['30', 'Severe (seizure, coma)', 30]]),
      c('gis', 'Gastrointestinal–hepatic', [['0', 'Absent', 0], ['10', 'Diarrhoea, nausea, vomiting or abdominal pain', 10], ['20', 'Unexplained jaundice', 20]]),
      c('nabiz', 'Heart rate (per minute)', [['n', 'Below 90', 0], ['5', '90–109', 5], ['10', '110–119', 10], ['15', '120–129', 15], ['20', '130–139', 20], ['25', '140 or more', 25]]),
      c('kky', 'Heart failure', [['0', 'Absent', 0], ['5', 'Mild (pedal oedema)', 5], ['10', 'Moderate (bibasal crackles)', 10], ['15', 'Severe (pulmonary oedema)', 15]]),
      t('af', 'Atrial fibrillation', 10), t('tetik', 'Precipitating event present', 10),
    ],
    bantlar: [b(0, 'olasi_degil', 'Below 25 — thyroid storm unlikely'), b(25, 'yaklasan', '25–44 — impending storm'), b(45, 'olasi', '45 or more — highly suggestive of thyroid storm')],
    ornekler: [{ girdi: { ates: '15', mss: '10', gis: '10', nabiz: '15', kky: '0', af: true }, toplam: 60, bant: 'olasi' }, { girdi: { ates: 'n', mss: '0', gis: '0', nabiz: '10', kky: '5' }, toplam: 15, bant: 'olasi_degil' }],
  },
  // ── infectious diseases ──
  {
    sekil: 'toplam', k: 'mascc', roller: ['infectious-diseases', 'oncology', 'haematology'],
    ad: 'MASCC risk index for febrile neutropenia', aciklama: 'Identifies adults with febrile neutropenia at low risk of serious complications. Higher is lower risk.',
    not: `${NOT} Outpatient management of a low-risk patient follows the local febrile-neutropenia pathway (eviQ in Australia).`,
    kaynak: 'Klastersky J, Paesmans M, Rubenstein EB, et al. The Multinational Association for Supportive Care in Cancer risk index. J Clin Oncol 2000;18:3038-51 (≥21 low risk).',
    toplamAdi: 'MASCC score',
    alanlar: [c('yuk', 'Burden of febrile neutropenia (symptoms)', [['yok', 'None or mild', 5], ['orta', 'Moderate', 3], ['agir', 'Severe or moribund', 0]]), t('hipotansiyon_yok', 'No hypotension (systolic above 90 mmHg)', 5), t('kopd_yok', 'No chronic obstructive pulmonary disease', 4), t('mantar_yok', 'Solid tumour, or haematological malignancy with no previous fungal infection', 4), t('dehidrasyon_yok', 'No dehydration needing IV fluids', 3), t('ayaktan', 'Outpatient at onset of fever', 3), t('yas', 'Age under 60', 2)],
    bantlar: [b(0, 'yuksek', 'Below 21 — not low risk'), b(21, 'dusuk', '21 or more — low risk')],
    ornekler: [{ girdi: { yuk: 'yok', hipotansiyon_yok: true, kopd_yok: true, mantar_yok: true, dehidrasyon_yok: true, ayaktan: true, yas: true }, toplam: 26, bant: 'dusuk' }, { girdi: { yuk: 'orta', hipotansiyon_yok: true, kopd_yok: true, mantar_yok: true }, toplam: 16, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'pitt-bacteraemia', roller: ['infectious-diseases'],
    ad: 'Pitt bacteraemia score', aciklama: 'Severity of acute illness in bloodstream infection, scored on the worst values within 48 hours of the positive culture.',
    not: NOT,
    kaynak: 'Paterson DL, Ko WC, Von Gottberg A, et al. International prospective study of Klebsiella pneumoniae bacteremia. Ann Intern Med 2004;140:26-32 (Pitt score; ≥4 = critically ill).',
    toplamAdi: 'Pitt score',
    alanlar: [c('ates', 'Temperature (°C)', [['n', '36.1–38.9', 0], ['1', '35.1–36.0 or 39.0–39.9', 1], ['2', '35.0 or less, or 40.0 or more', 2]]), t('hipotansiyon', 'Hypotension (drop >30/20 mmHg, systolic <90, or vasopressors)', 2), t('mv', 'Mechanical ventilation', 2), t('arrest', 'Cardiac arrest', 4), c('bilinc', 'Mental status', [['0', 'Alert', 0], ['1', 'Disorientated', 1], ['2', 'Stuporous', 2], ['4', 'Comatose', 4]])],
    bantlar: [b(0, 'dusuk', '0–3'), b(4, 'kritik', '4 or more — critically ill')],
    ornekler: [{ girdi: { ates: '1', hipotansiyon: true, bilinc: '1' }, toplam: 4, bant: 'kritik' }, { girdi: { ates: 'n', bilinc: '0' }, toplam: 0, bant: 'dusuk' }],
  },
  {
    sekil: 'formul', k: 'cockcroft-gault', roller: ['infectious-diseases', 'nephrology', 'geriatric-medicine'],
    ad: 'Creatinine clearance (Cockcroft–Gault)', aciklama: 'Estimated creatinine clearance for drug dosing, in Australian units (creatinine in µmol/L).',
    not: `${NOT} Medicine doses are adjusted from the product information and the Australian Medicines Handbook, not by this screen.`,
    kaynak: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron 1976;16:31-41 (CrCl = (140 − age) × weight × [0.85 if female] / (0.815 × creatinine µmol/L)).',
    alanlar: [s('yas', 18, 110, undefined, { tam: true }), s('kilo', 20, 300, 'kg'), s('kreatinin', 20, 2000, 'µmol/L'), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { yas: 'Age (years)', kilo: 'Weight', kreatinin: 'Serum creatinine', cinsiyet: 'Sex' },
    secenekEtiketleri: { cinsiyet: { erkek: 'Male', kadin: 'Female' } },
    sayiAdlari: { crcl: 'Creatinine clearance' },
    sonucBirimleri: ['mL/min'],
    hesap: (g) => {
      const v = ((140 - (g.yas as number)) * (g.kilo as number) * (g.cinsiyet === 'kadin' ? 0.85 : 1)) / (0.815 * (g.kreatinin as number))
      return { sayilar: [{ anahtar: 'crcl', deger: yuvarla(v, 0), ondalik: 0, birim: 'mL/min' }] }
    },
    ornekler: [{ girdi: { yas: 70, kilo: 70, kreatinin: 100, cinsiyet: 'erkek' }, sayilar: { crcl: 60 } }, { girdi: { yas: 80, kilo: 60, kreatinin: 120, cinsiyet: 'kadin' }, sayilar: { crcl: 31 } }],
  },
  // ── gastroenterology ──
  {
    sekil: 'toplam', k: 'glasgow-blatchford', roller: ['gastroenterology', 'emergency-medicine'],
    ad: 'Glasgow–Blatchford score (upper GI bleeding)', aciklama: 'Pre-endoscopy risk of needing intervention. Australian units: urea in mmol/L, haemoglobin in g/L.',
    not: `${NOT} A score of 0–1 identifies patients who may be suitable for outpatient management under the local pathway.`,
    kaynak: 'Blatchford O, Murray WR, Blatchford M. A risk score to predict need for treatment for upper-gastrointestinal haemorrhage. Lancet 2000;356:1318-21; Stanley AJ, et al. BMJ 2017;356:i6432 (0–1 very low risk).',
    alanlar: [
      c('ure', 'Urea (mmol/L)', [['n', 'Below 6.5', 0], ['2', '6.5–7.9', 2], ['3', '8.0–9.9', 3], ['4', '10.0–24.9', 4], ['6', '25 or more', 6]]),
      c('hb', 'Haemoglobin (g/L)', [['en', 'Male 130 or more / female 120 or more', 0], ['e1', 'Male 120–129', 1], ['k1', 'Female 100–119', 1], ['e3', 'Male 100–119', 3], ['6', 'Below 100 (either sex)', 6]]),
      c('sta', 'Systolic blood pressure (mmHg)', [['n', '110 or more', 0], ['1', '100–109', 1], ['2', '90–99', 2], ['3', 'Below 90', 3]]),
      t('nabiz', 'Pulse 100 per minute or more'), t('melena', 'Melaena'), t('senkop', 'Syncope', 2), t('karaciger', 'Hepatic disease', 2), t('kky', 'Cardiac failure', 2),
    ],
    bantlar: [b(0, 'cok_dusuk', '0–1 — very low risk'), b(2, 'dusuk_degil', '2 or more — not low risk')],
    ornekler: [{ girdi: { ure: 'n', hb: 'en', sta: 'n' }, toplam: 0, bant: 'cok_dusuk' }, { girdi: { ure: '4', hb: 'e3', sta: '1', nabiz: true, melena: true }, toplam: 10, bant: 'dusuk_degil' }],
  },
  {
    sekil: 'toplam', k: 'child-pugh', roller: ['gastroenterology', 'internal-medicine'],
    ad: 'Child–Pugh score (cirrhosis)', aciklama: 'Bilirubin, albumin, INR, ascites and encephalopathy, in Australian units.',
    not: NOT,
    kaynak: 'Pugh RN, Murray-Lyon IM, Dawson JL, Pietroni MC, Williams R. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg 1973;60:646-9 (class A 5–6, B 7–9, C 10–15).',
    alanlar: [
      c('bilirubin', 'Bilirubin (µmol/L)', [['1', 'Below 34', 1], ['2', '34–50', 2], ['3', 'Above 50', 3]]),
      c('albumin', 'Albumin (g/L)', [['1', 'Above 35', 1], ['2', '28–35', 2], ['3', 'Below 28', 3]]),
      c('inr', 'INR', [['1', 'Below 1.7', 1], ['2', '1.7–2.3', 2], ['3', 'Above 2.3', 3]]),
      c('asit', 'Ascites', [['1', 'None', 1], ['2', 'Mild / controlled', 2], ['3', 'Moderate–severe / refractory', 3]]),
      c('ensefalopati', 'Encephalopathy', [['1', 'None', 1], ['2', 'Grade 1–2', 2], ['3', 'Grade 3–4', 3]]),
    ],
    bantlar: [b(5, 'a', 'Class A (5–6)'), b(7, 'b', 'Class B (7–9)'), b(10, 'c', 'Class C (10–15)')],
    ornekler: [{ girdi: { bilirubin: '1', albumin: '1', inr: '1', asit: '1', ensefalopati: '1' }, toplam: 5, bant: 'a' }, { girdi: { bilirubin: '2', albumin: '2', inr: '2', asit: '2', ensefalopati: '1' }, toplam: 9, bant: 'b' }],
  },
  {
    sekil: 'formul', k: 'meld-na', roller: ['gastroenterology'],
    ad: 'MELD and MELD-Na', aciklama: 'Model for End-Stage Liver Disease from creatinine and bilirubin (µmol/L, converted), INR and sodium. Values below 1 are set to 1; creatinine is capped at 4 mg/dL and set to 4 with dialysis twice in the past week; sodium bounded 125–137.',
    not: NOT,
    kaynak: 'Kamath PS, Wiesner RH, Malinchoc M, et al. A model to predict survival in patients with end-stage liver disease. Hepatology 2001;33:464-70; Kim WR, Biggins SW, Kremers WK, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med 2008;359:1018-26 (MELD-Na applied when MELD above 11).',
    alanlar: [s('kreatinin', 20, 2000, 'µmol/L'), s('bilirubin', 2, 1000, 'µmol/L'), s('inr', 0.8, 10), s('na', 100, 170, 'mmol/L'), { anahtar: 'diyaliz', tur: 'isaret' }],
    etiketler: { kreatinin: 'Creatinine', bilirubin: 'Bilirubin', inr: 'INR', na: 'Sodium', diyaliz: 'Dialysis twice or more in the past week' },
    sayiAdlari: { meld: 'MELD', meld_na: 'MELD-Na' },
    hesap: (g) => {
      let cr = Math.max(1, (g.kreatinin as number) / 88.4)
      if (g.diyaliz === true || cr > 4) cr = 4
      const bil = Math.max(1, (g.bilirubin as number) / 17.1)
      const inr = Math.max(1, g.inr as number)
      const meld = 10 * (0.957 * Math.log(cr) + 0.378 * Math.log(bil) + 1.12 * Math.log(inr) + 0.643)
      const na = Math.min(137, Math.max(125, g.na as number))
      const mna = meld > 11 ? meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na) : meld
      return { sayilar: [{ anahtar: 'meld', deger: Math.round(meld), ondalik: 0 }, { anahtar: 'meld_na', deger: Math.round(mna), ondalik: 0 }] }
    },
    ornekler: [{ girdi: { kreatinin: 80, bilirubin: 10, inr: 1, na: 140 }, sayilar: { meld: 6, meld_na: 6 } }, { girdi: { kreatinin: 176.8, bilirubin: 51.3, inr: 1.5, na: 130 }, sayilar: { meld: 22, meld_na: 26 } }],
  },
  {
    sekil: 'formul', k: 'fib-4', roller: ['gastroenterology', 'family-medicine'],
    ad: 'FIB-4 index (liver fibrosis)', aciklama: 'Age, AST, ALT and platelet count. Shows the index and the usual rule-out / rule-in bands for advanced fibrosis.',
    not: `${NOT} For age 65 and over the lower cut-off is 2.0.`,
    kaynak: 'Sterling RK, Lissen E, Clumeck N, et al. Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection. Hepatology 2006;43:1317-25; McPherson S, et al. Am J Gastroenterol 2017;112:740-51 (below 1.30 [2.0 if 65+] low risk, above 2.67 high risk).',
    alanlar: [s('yas', 18, 110, undefined, { tam: true }), s('ast', 1, 5000, 'U/L'), s('alt', 1, 5000, 'U/L'), s('trombosit', 5, 1500, '×10⁹/L')],
    etiketler: { yas: 'Age (years)', ast: 'AST', alt: 'ALT', trombosit: 'Platelet count' },
    sayiAdlari: { fib4: 'FIB-4' },
    bantlar: [{ k: 'dusuk', e: 'Low risk of advanced fibrosis' }, { k: 'ara', e: 'Indeterminate — further assessment (e.g. elastography)' }, { k: 'yuksek', e: 'High risk of advanced fibrosis' }],
    hesap: (g) => {
      const f = ((g.yas as number) * (g.ast as number)) / ((g.trombosit as number) * Math.sqrt(g.alt as number))
      const alt = (g.yas as number) >= 65 ? 2.0 : 1.3
      return { sayilar: [{ anahtar: 'fib4', deger: yuvarla(f, 2), ondalik: 2 }], bant: f < alt ? 'dusuk' : f > 2.67 ? 'yuksek' : 'ara' }
    },
    ornekler: [{ girdi: { yas: 50, ast: 40, alt: 36, trombosit: 200 }, sayilar: { fib4: 1.67 }, bant: 'ara' }, { girdi: { yas: 40, ast: 25, alt: 25, trombosit: 250 }, sayilar: { fib4: 0.8 }, bant: 'dusuk' }],
  },
  {
    sekil: 'formul', k: 'truelove-witts', roller: ['gastroenterology'],
    ad: 'Truelove and Witts criteria (acute severe ulcerative colitis)', aciklama: 'Six or more bloody stools a day plus at least one sign of systemic toxicity defines acute severe colitis.',
    not: `${NOT} Acute severe colitis needs hospital assessment.`,
    kaynak: 'Truelove SC, Witts LJ. Cortisone in ulcerative colitis: final report on a therapeutic trial. BMJ 1955;2:1041-8.',
    alanlar: [s('diski', 0, 40, undefined, { tam: true }), { anahtar: 'kanli', tur: 'isaret' }, { anahtar: 'nabiz', tur: 'isaret' }, { anahtar: 'ates', tur: 'isaret' }, { anahtar: 'hb', tur: 'isaret' }, { anahtar: 'esr', tur: 'isaret' }],
    etiketler: { diski: 'Stools per day', kanli: 'Stools are bloody', nabiz: 'Heart rate above 90 per minute', ates: 'Temperature above 37.8 °C', hb: 'Haemoglobin below 105 g/L', esr: 'ESR above 30 mm/h (or CRP above 30 mg/L)' },
    sayiAdlari: { sistemik: 'Signs of systemic toxicity' },
    bantlar: [{ k: 'agir_degil', e: 'Criteria for acute severe colitis not met' }, { k: 'agir', e: 'Acute severe colitis by the criteria' }],
    hesap: (g) => {
      const n = ['nabiz', 'ates', 'hb', 'esr'].filter((k) => g[k] === true).length
      return { sayilar: [{ anahtar: 'sistemik', deger: n, ondalik: 0, enCok: 4 }], bant: (g.diski as number) >= 6 && g.kanli === true && n >= 1 ? 'agir' : 'agir_degil' }
    },
    ornekler: [{ girdi: { diski: 8, kanli: true, nabiz: true }, bant: 'agir' }, { girdi: { diski: 8, kanli: true }, bant: 'agir_degil' }],
  },
  // ── nephrology ──
  {
    sekil: 'formul', k: 'dialysis-adequacy', roller: ['nephrology'],
    ad: 'Haemodialysis adequacy (single-pool Kt/V and URR)', aciklama: 'Daugirdas second-generation equation from pre- and post-dialysis urea, session length, ultrafiltration and post-dialysis weight.',
    not: `${NOT} The prescription is the nephrologist's.`,
    kaynak: 'Daugirdas JT. Second generation logarithmic estimates of single-pool variable volume Kt/V: an analysis of error. J Am Soc Nephrol 1993;4:1205-13; KDOQI clinical practice guideline on haemodialysis adequacy, 2015 update. Am J Kidney Dis 2015;66:884-930 (minimum delivered spKt/V 1.2 thrice weekly).',
    alanlar: [s('on', 2, 80, 'mmol/L'), s('son', 0.5, 60, 'mmol/L'), s('saat', 1, 10, 'h'), s('uf', 0, 8, 'L'), s('kilo', 20, 250, 'kg')],
    etiketler: { on: 'Pre-dialysis urea', son: 'Post-dialysis urea', saat: 'Session length', uf: 'Ultrafiltration volume', kilo: 'Post-dialysis weight' },
    sayiAdlari: { ktv: 'spKt/V', urr: 'Urea reduction ratio' },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'yetersiz', e: 'spKt/V below 1.2 — below the minimum delivered dose' }, { k: 'yeterli', e: 'spKt/V 1.2 or more' }],
    hesap: (g) => {
      const R = (g.son as number) / (g.on as number)
      if (R >= 1) return null
      const ktv = -Math.log(R - 0.008 * (g.saat as number)) + (4 - 3.5 * R) * ((g.uf as number) / (g.kilo as number))
      return { sayilar: [{ anahtar: 'ktv', deger: yuvarla(ktv, 2), ondalik: 2 }, { anahtar: 'urr', deger: yuvarla((1 - R) * 100, 0), ondalik: 0, birim: '%' }], bant: ktv >= 1.2 ? 'yeterli' : 'yetersiz' }
    },
    ornekler: [{ girdi: { on: 25, son: 8, saat: 4, uf: 2.5, kilo: 70 }, sayilar: { ktv: 1.35, urr: 68 }, bant: 'yeterli' }],
  },
  {
    sekil: 'formul', k: 'fena', roller: ['nephrology', 'internal-medicine'],
    ad: 'Fractional excretion of sodium', aciklama: 'From urine and plasma sodium and creatinine as Australian laboratories report them (plasma creatinine µmol/L, urine creatinine mmol/L).',
    not: `${NOT} Unreliable after diuretics and in chronic kidney disease.`,
    kaynak: 'Espinel CH. The FENa test: use in the differential diagnosis of acute renal failure. JAMA 1976;236:579-81 (below 1% suggests a prerenal state; above 2% suggests intrinsic tubular injury).',
    alanlar: [s('idrar_na', 1, 300, 'mmol/L'), s('plazma_na', 100, 180, 'mmol/L'), s('idrar_kr', 0.5, 50, 'mmol/L'), s('plazma_kr', 20, 2000, 'µmol/L')],
    etiketler: { idrar_na: 'Urine sodium', plazma_na: 'Plasma sodium', idrar_kr: 'Urine creatinine', plazma_kr: 'Plasma creatinine' },
    sayiAdlari: { fena: 'FENa' },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'prerenal', e: 'Below 1% — consistent with a prerenal state' }, { k: 'ara', e: '1–2% — indeterminate' }, { k: 'intrinsik', e: 'Above 2% — consistent with intrinsic tubular injury' }],
    hesap: (g) => {
      const f = (((g.idrar_na as number) * (g.plazma_kr as number)) / ((g.plazma_na as number) * (g.idrar_kr as number) * 1000)) * 100
      return { sayilar: [{ anahtar: 'fena', deger: yuvarla(f, 2), ondalik: 2, birim: '%' }], bant: f < 1 ? 'prerenal' : f > 2 ? 'intrinsik' : 'ara' }
    },
    ornekler: [{ girdi: { idrar_na: 20, plazma_na: 140, idrar_kr: 10, plazma_kr: 200 }, sayilar: { fena: 0.29 }, bant: 'prerenal' }, { girdi: { idrar_na: 60, plazma_na: 135, idrar_kr: 5, plazma_kr: 400 }, sayilar: { fena: 3.56 }, bant: 'intrinsik' }],
  },
  // ── haematology ──
  {
    sekil: 'toplam', k: 'four-ts', roller: ['haematology', 'internal-medicine'],
    ad: '4Ts score for heparin-induced thrombocytopenia', aciklama: 'Thrombocytopenia, Timing, Thrombosis, oTher causes — pre-test probability of HIT.',
    not: `${NOT} A low score has a high negative predictive value; intermediate and high scores need laboratory testing and haematology advice.`,
    kaynak: 'Lo GK, Juhl D, Warkentin TE, et al. Evaluation of pretest clinical score (4 T\'s) for the diagnosis of heparin-induced thrombocytopenia in two clinical settings. J Thromb Haemost 2006;4:759-65 (0–3 low, 4–5 intermediate, 6–8 high).',
    alanlar: [
      c('trombositopeni', 'Thrombocytopenia', [['2', 'Fall above 50% and nadir 20 ×10⁹/L or more', 2], ['1', 'Fall 30–50%, or nadir 10–19', 1], ['0', 'Fall below 30%, or nadir below 10', 0]]),
      c('zaman', 'Timing of the fall', [['2', 'Clear onset day 5–10, or within 1 day with heparin in the past 30 days', 2], ['1', 'Consistent but unclear, onset after day 10, or within 1 day with heparin 30–100 days ago', 1], ['0', 'Fall within 4 days without recent heparin', 0]]),
      c('tromboz', 'Thrombosis or other sequelae', [['2', 'New proven thrombosis, skin necrosis, or acute systemic reaction after heparin bolus', 2], ['1', 'Progressive or recurrent thrombosis, non-necrotising skin lesions, or suspected thrombosis', 1], ['0', 'None', 0]]),
      c('diger', 'Other causes of thrombocytopenia', [['2', 'None apparent', 2], ['1', 'Possible', 1], ['0', 'Definite', 0]]),
    ],
    bantlar: [b(0, 'dusuk', '0–3 — low probability'), b(4, 'orta', '4–5 — intermediate probability'), b(6, 'yuksek', '6–8 — high probability')],
    ornekler: [{ girdi: { trombositopeni: '2', zaman: '2', tromboz: '0', diger: '1' }, toplam: 5, bant: 'orta' }, { girdi: { trombositopeni: '1', zaman: '0', tromboz: '0', diger: '0' }, toplam: 1, bant: 'dusuk' }],
  },
  {
    sekil: 'toplam', k: 'isth-dic', roller: ['haematology', 'internal-medicine'],
    ad: 'ISTH overt DIC score', aciklama: 'Only in a patient with an underlying disorder known to be associated with DIC.',
    not: NOT,
    kaynak: 'Taylor FB Jr, Toh CH, Hoots WK, Wada H, Levi M. Towards definition, clinical and laboratory criteria, and a scoring system for disseminated intravascular coagulation. Thromb Haemost 2001;86:1327-30 (≥5 compatible with overt DIC).',
    alanlar: [
      c('trombosit', 'Platelet count (×10⁹/L)', [['0', 'Above 100', 0], ['1', '50–100', 1], ['2', 'Below 50', 2]]),
      c('ddimer', 'Fibrin-related marker (e.g. D-dimer)', [['0', 'No increase', 0], ['2', 'Moderate increase', 2], ['3', 'Strong increase', 3]]),
      c('pt', 'Prolonged prothrombin time', [['0', 'Less than 3 seconds', 0], ['1', '3–6 seconds', 1], ['2', 'More than 6 seconds', 2]]),
      c('fibrinojen', 'Fibrinogen', [['0', '1.0 g/L or more', 0], ['1', 'Below 1.0 g/L', 1]]),
    ],
    bantlar: [b(0, 'degil', 'Below 5 — suggestive, not affirmative: repeat in 1–2 days'), b(5, 'dic', '5 or more — compatible with overt DIC')],
    ornekler: [{ girdi: { trombosit: '1', ddimer: '3', pt: '1', fibrinojen: '0' }, toplam: 5, bant: 'dic' }],
  },
  {
    sekil: 'toplam', k: 'khorana', roller: ['oncology', 'haematology'],
    ad: 'Khorana score (cancer-associated venous thromboembolism)', aciklama: 'Risk of VTE in ambulatory patients starting chemotherapy.',
    not: `${NOT} Thromboprophylaxis decisions follow eviQ and the treating team.`,
    kaynak: 'Khorana AA, Kuderer NM, Culakova E, Lyman GH, Francis CW. Development and validation of a predictive model for chemotherapy-associated thrombosis. Blood 2008;111:4902-7 (0 low, 1–2 intermediate, ≥3 high).',
    alanlar: [c('yer', 'Site of cancer', [['diger', 'Other', 0], ['yuksek', 'High risk: lung, lymphoma, gynaecological, bladder, testicular', 1], ['cok_yuksek', 'Very high risk: stomach, pancreas', 2]]), t('trombosit', 'Pre-chemotherapy platelets 350 ×10⁹/L or more'), t('hb', 'Haemoglobin below 100 g/L or an erythropoiesis-stimulating agent'), t('lokosit', 'Pre-chemotherapy leucocytes above 11 ×10⁹/L'), t('bmi', 'BMI 35 kg/m² or more')],
    bantlar: [b(0, 'dusuk', '0 — low'), b(1, 'orta', '1–2 — intermediate'), b(3, 'yuksek', '3 or more — high')],
    ornekler: [{ girdi: { yer: 'cok_yuksek', trombosit: true }, toplam: 3, bant: 'yuksek' }, { girdi: { yer: 'diger' }, toplam: 0, bant: 'dusuk' }],
  },
  // ── oncology and radiation oncology ──
  {
    sekil: 'formul', k: 'bsa-mosteller', roller: ['oncology', 'radiation-oncology'],
    ad: 'Body surface area (Mosteller)', aciklama: '√(height cm × weight kg / 3600).',
    not: `${NOT} Chemotherapy doses follow the eviQ protocol and the oncologist's order; capping is a protocol decision.`,
    kaynak: 'Mosteller RD. Simplified calculation of body-surface area (letter). N Engl J Med 1987;317:1098.',
    alanlar: [s('boy', 50, 250, 'cm'), s('kilo', 2, 300, 'kg')],
    etiketler: { boy: 'Height', kilo: 'Weight' },
    sayiAdlari: { bsa: 'Body surface area' },
    sonucBirimleri: ['m²'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'bsa', deger: yuvarla(Math.sqrt(((g.boy as number) * (g.kilo as number)) / 3600), 2), ondalik: 2, birim: 'm²' }] }),
    ornekler: [{ girdi: { boy: 170, kilo: 70 }, sayilar: { bsa: 1.82 } }, { girdi: { boy: 160, kilo: 55 }, sayilar: { bsa: 1.56 } }],
  },
  {
    sekil: 'formul', k: 'calvert-carboplatin', roller: ['oncology'],
    ad: 'Carboplatin dose by the Calvert formula', aciklama: 'Dose (mg) = target AUC × (GFR + 25). Enter the GFR estimate the protocol specifies.',
    not: `${NOT} Check the result against the eviQ protocol and the oncologist's order. Many protocols cap the GFR at 125 mL/min for patients with normal renal function (Cancer Care Ontario carboplatin drug monograph: maximum dose = AUC × 150 mg). Nothing is prescribed from this screen.`,
    kaynak: 'Calvert AH, Newell DR, Gumbrell LA, et al. Carboplatin dosage: prospective evaluation of a simple formula based on renal function. J Clin Oncol 1989;7:1748-56.',
    alanlar: [s('auc', 1, 10, 'mg/mL·min'), s('gfr', 5, 250, 'mL/min')],
    etiketler: { auc: 'Target AUC', gfr: 'GFR estimate (as the protocol specifies)' },
    sayiAdlari: { doz: 'Carboplatin dose' },
    sonucBirimleri: ['mg'],
    dozYazar: true,
    uyarilar: [{ k: 'yuksek_gfr', e: 'GFR above 125 mL/min entered — check whether the protocol caps the GFR before using the dose.' }],
    hesap: (g) => ({ sayilar: [{ anahtar: 'doz', deger: Math.round((g.auc as number) * ((g.gfr as number) + 25)), ondalik: 0, birim: 'mg', doz: true }], uyarilar: (g.gfr as number) > 125 ? ['yuksek_gfr'] : [] }),
    ornekler: [{ girdi: { auc: 5, gfr: 100 }, sayilar: { doz: 625 } }, { girdi: { auc: 6, gfr: 140 }, sayilar: { doz: 990 }, uyarilar: ['yuksek_gfr'] }],
  },
  {
    sekil: 'formul', k: 'bed-eqd2', roller: ['radiation-oncology'],
    ad: 'Biologically effective dose and EQD2', aciklama: 'From total dose, number of fractions and the α/β ratio of the tissue: BED = D(1 + d/(α/β)); EQD2 = BED / (1 + 2/(α/β)).',
    not: `${NOT} The α/β value is the clinician's choice for the tissue and endpoint.`,
    kaynak: 'Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy. Br J Radiol 1989;62:679-94.',
    alanlar: [s('doz', 0.5, 150, 'Gy'), s('fraksiyon', 1, 60, undefined, { tam: true }), s('ab', 0.5, 20, 'Gy')],
    etiketler: { doz: 'Total dose', fraksiyon: 'Number of fractions', ab: 'α/β ratio' },
    sayiAdlari: { fraksiyon_dozu: 'Dose per fraction', bed: 'BED', eqd2: 'EQD2' },
    sonucBirimleri: ['Gy'],
    hesap: (g) => {
      const D = g.doz as number, n = g.fraksiyon as number, ab = g.ab as number
      const d = D / n
      const bed = D * (1 + d / ab)
      return { sayilar: [{ anahtar: 'fraksiyon_dozu', deger: yuvarla(d, 2), ondalik: 2, birim: 'Gy' }, { anahtar: 'bed', deger: yuvarla(bed, 1), ondalik: 1, birim: 'Gy' }, { anahtar: 'eqd2', deger: yuvarla(bed / (1 + 2 / ab), 1), ondalik: 1, birim: 'Gy' }] }
    },
    ornekler: [{ girdi: { doz: 60, fraksiyon: 30, ab: 10 }, sayilar: { bed: 72, eqd2: 60 } }, { girdi: { doz: 20, fraksiyon: 5, ab: 3 }, sayilar: { fraksiyon_dozu: 4, bed: 46.7, eqd2: 28 } }],
  },
  {
    sekil: 'toplam', k: 'karnofsky', roller: ['radiation-oncology', 'oncology'],
    ad: 'Karnofsky performance status', aciklama: 'Record the performance status, 100 (normal) to 0 (dead), in steps of 10.',
    not: NOT,
    kaynak: 'Karnofsky DA, Burchenal JH. The clinical evaluation of chemotherapeutic agents in cancer. In: MacLeod CM, ed. Evaluation of Chemotherapeutic Agents. New York: Columbia University Press; 1949:191-205.',
    toplamAdi: 'KPS',
    alanlar: [c('kps', 'Status', [['100', '100 — normal, no complaints', 100], ['90', '90 — normal activity, minor symptoms', 90], ['80', '80 — normal activity with effort', 80], ['70', '70 — cares for self, unable to work', 70], ['60', '60 — needs occasional assistance', 60], ['50', '50 — needs considerable assistance and frequent care', 50], ['40', '40 — disabled, needs special care', 40], ['30', '30 — severely disabled', 30], ['20', '20 — very sick, active support needed', 20], ['10', '10 — moribund', 10], ['0', '0 — dead', 0]])],
    bantlar: [b(0, 'bagimli', '0–40 — unable to care for self'), b(50, 'yardim', '50–70 — unable to work, varying assistance'), b(80, 'aktif', '80–100 — able to carry on normal activity')],
    ornekler: [{ girdi: { kps: '70' }, toplam: 70, bant: 'yardim' }],
  },
  {
    sekil: 'toplam', k: 'gpa-brain-mets', roller: ['radiation-oncology'],
    ad: 'Graded Prognostic Assessment (brain metastases)', aciklama: 'Original GPA: age, KPS, extracranial metastases and number of brain metastases (0–4, half points).',
    not: `${NOT} Diagnosis-specific GPA versions exist for several primaries.`,
    kaynak: 'Sperduto PW, Berkey B, Gaspar LE, Mehta M, Curran W. A new prognostic index and comparison to three other indices for patients with brain metastases: an analysis of 1,960 patients in the RTOG database. Int J Radiat Oncol Biol Phys 2008;70:510-4.',
    toplamAdi: 'GPA',
    alanlar: [c('yas', 'Age', [['60', 'Over 60', 0], ['50', '50–60', 1], ['alt50', 'Under 50', 2]]), c('kps', 'KPS', [['alt70', 'Below 70', 0], ['70', '70–80', 1], ['90', '90–100', 2]]), c('ekm', 'Extracranial metastases', [['var', 'Present', 0], ['yok', 'None', 2]]), c('sayi', 'Number of brain metastases', [['3', 'More than 3', 0], ['2', '2–3', 1], ['1', '1', 2]])],
    donustur: { f: (x) => x / 2, ondalik: 1, enCok: 4 },
    bantlar: [b(0, 'g1', '0–1'), b(1.5, 'g2', '1.5–2.5'), b(3, 'g3', '3'), b(3.5, 'g4', '3.5–4')],
    ornekler: [{ girdi: { yas: '50', kps: '90', ekm: 'yok', sayi: '1' }, toplam: 3.5, bant: 'g4' }, { girdi: { yas: '60', kps: '70', ekm: 'var', sayi: '2' }, toplam: 1, bant: 'g1' }],
  },
  {
    sekil: 'formul', k: 'rpa-brain-mets', roller: ['radiation-oncology'],
    ad: 'RTOG recursive partitioning analysis class (brain metastases)', aciklama: 'Class I: KPS 70 or more, age under 65, controlled primary, no extracranial metastases. Class III: KPS below 70. Class II: all others.',
    not: NOT,
    kaynak: 'Gaspar L, Scott C, Rotman M, et al. Recursive partitioning analysis (RPA) of prognostic factors in three Radiation Therapy Oncology Group (RTOG) brain metastases trials. Int J Radiat Oncol Biol Phys 1997;37:745-51.',
    alanlar: [s('kps', 0, 100, undefined, { tam: true }), s('yas', 18, 110, undefined, { tam: true }), { anahtar: 'kontrollu', tur: 'isaret' }, { anahtar: 'ekm', tur: 'isaret' }],
    etiketler: { kps: 'KPS', yas: 'Age (years)', kontrollu: 'Primary tumour controlled', ekm: 'Extracranial metastases present' },
    sayiAdlari: { sinif: 'RPA class' },
    bantlar: [{ k: 'i', e: 'Class I' }, { k: 'ii', e: 'Class II' }, { k: 'iii', e: 'Class III' }],
    hesap: (g) => {
      const k = (g.kps as number) < 70 ? 3 : (g.yas as number) < 65 && g.kontrollu === true && g.ekm !== true ? 1 : 2
      return { sayilar: [{ anahtar: 'sinif', deger: k, ondalik: 0, enCok: 3 }], bant: ['i', 'ii', 'iii'][k - 1] }
    },
    ornekler: [{ girdi: { kps: 90, yas: 55, kontrollu: true }, bant: 'i' }, { girdi: { kps: 60, yas: 50, kontrollu: true }, bant: 'iii' }, { girdi: { kps: 80, yas: 70, kontrollu: true }, bant: 'ii' }],
  },
  // ── rheumatology ──
  {
    sekil: 'formul', k: 'cdai', roller: ['rheumatology'],
    ad: 'Clinical Disease Activity Index (rheumatoid arthritis)', aciklama: 'Swollen and tender joint counts (28) plus patient and evaluator global assessments (0–10).',
    not: NOT,
    kaynak: 'Aletaha D, Nell VP, Stamm T, et al. Acute phase reactants add little to composite disease activity indices for rheumatoid arthritis: validation of a clinical activity score. Arthritis Res Ther 2005;7:R796-806 (≤2.8 remission, ≤10 low, ≤22 moderate, >22 high).',
    alanlar: [s('sjc', 0, 28, undefined, { tam: true }), s('tjc', 0, 28, undefined, { tam: true }), s('hasta', 0, 10), s('hekim', 0, 10)],
    etiketler: { sjc: 'Swollen joint count (28)', tjc: 'Tender joint count (28)', hasta: 'Patient global assessment (0–10)', hekim: 'Evaluator global assessment (0–10)' },
    sayiAdlari: { cdai: 'CDAI' },
    bantlar: [{ k: 'remisyon', e: 'Remission (2.8 or less)' }, { k: 'dusuk', e: 'Low activity (2.9–10)' }, { k: 'orta', e: 'Moderate activity (10.1–22)' }, { k: 'yuksek', e: 'High activity (above 22)' }],
    hesap: (g) => {
      const v = (g.sjc as number) + (g.tjc as number) + (g.hasta as number) + (g.hekim as number)
      return { sayilar: [{ anahtar: 'cdai', deger: yuvarla(v, 1), ondalik: 1 }], bant: v <= 2.8 ? 'remisyon' : v <= 10 ? 'dusuk' : v <= 22 ? 'orta' : 'yuksek' }
    },
    ornekler: [{ girdi: { sjc: 4, tjc: 6, hasta: 5, hekim: 4 }, sayilar: { cdai: 19 }, bant: 'orta' }, { girdi: { sjc: 0, tjc: 1, hasta: 1, hekim: 0.5 }, sayilar: { cdai: 2.5 }, bant: 'remisyon' }],
  },
  {
    sekil: 'formul', k: 'basdai', roller: ['rheumatology'],
    ad: 'BASDAI (axial spondyloarthritis activity)', aciklama: 'Six patient ratings 0–10 from the BASDAI form; (Q1 + Q2 + Q3 + Q4 + (Q5 + Q6)/2) / 5.',
    not: NOT,
    kaynak: 'Garrett S, Jenkinson T, Kennedy LG, et al. A new approach to defining disease status in ankylosing spondylitis: the Bath Ankylosing Spondylitis Disease Activity Index. J Rheumatol 1994;21:2286-91 (4 or more suggests active disease).',
    alanlar: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((k) => s(k, 0, 10)),
    etiketler: { q1: 'Q1 Fatigue', q2: 'Q2 Spinal pain', q3: 'Q3 Peripheral joint pain or swelling', q4: 'Q4 Areas tender to touch or pressure', q5: 'Q5 Morning stiffness severity', q6: 'Q6 Morning stiffness duration' },
    sayiAdlari: { basdai: 'BASDAI' },
    bantlar: [{ k: 'aktif_degil', e: 'Below 4' }, { k: 'aktif', e: '4 or more — active disease' }],
    hesap: (g) => {
      const v = ((g.q1 as number) + (g.q2 as number) + (g.q3 as number) + (g.q4 as number) + ((g.q5 as number) + (g.q6 as number)) / 2) / 5
      return { sayilar: [{ anahtar: 'basdai', deger: yuvarla(v, 1), ondalik: 1 }], bant: v >= 4 ? 'aktif' : 'aktif_degil' }
    },
    ornekler: [{ girdi: { q1: 6, q2: 7, q3: 3, q4: 4, q5: 6, q6: 4 }, sayilar: { basdai: 5 }, bant: 'aktif' }],
  },
  {
    sekil: 'formul', k: 'asdas-crp', roller: ['rheumatology'],
    ad: 'ASDAS-CRP (axial spondyloarthritis)', aciklama: 'Back pain, morning stiffness duration, patient global and peripheral pain/swelling (0–10) with CRP in mg/L.',
    not: NOT,
    kaynak: 'Lukas C, Landewé R, Sieper J, et al. Ann Rheum Dis 2009;68:18-24; Machado P, et al. Ann Rheum Dis 2011;70:47-53 (<1.3 inactive, 1.3–<2.1 low, 2.1–3.5 high, >3.5 very high).',
    alanlar: [s('bel', 0, 10), s('sertlik', 0, 10), s('global', 0, 10), s('periferik', 0, 10), s('crp', 0, 300, 'mg/L')],
    etiketler: { bel: 'Back pain (0–10)', sertlik: 'Duration of morning stiffness (0–10)', global: 'Patient global (0–10)', periferik: 'Peripheral pain or swelling (0–10)', crp: 'CRP' },
    sayiAdlari: { asdas: 'ASDAS-CRP' },
    bantlar: [{ k: 'inaktif', e: 'Inactive disease (below 1.3)' }, { k: 'dusuk', e: 'Low disease activity (1.3 to below 2.1)' }, { k: 'yuksek', e: 'High disease activity (2.1–3.5)' }, { k: 'cok_yuksek', e: 'Very high disease activity (above 3.5)' }],
    hesap: (g) => {
      const v = 0.12 * (g.bel as number) + 0.06 * (g.sertlik as number) + 0.11 * (g.global as number) + 0.07 * (g.periferik as number) + 0.58 * Math.log((g.crp as number) + 1)
      return { sayilar: [{ anahtar: 'asdas', deger: yuvarla(v, 1), ondalik: 1 }], bant: v < 1.3 ? 'inaktif' : v < 2.1 ? 'dusuk' : v <= 3.5 ? 'yuksek' : 'cok_yuksek' }
    },
    ornekler: [{ girdi: { bel: 6, sertlik: 5, global: 6, periferik: 3, crp: 10 }, sayilar: { asdas: 3.3 }, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'acr-eular-ra-2010', roller: ['rheumatology'],
    ad: '2010 ACR/EULAR classification criteria for rheumatoid arthritis', aciklama: 'For a patient with at least one joint with definite synovitis not better explained by another disease. Six or more of 10 classifies as RA.',
    not: `${NOT} Classification criteria, not diagnostic criteria.`,
    kaynak: 'Aletaha D, Neogi T, Silman AJ, et al. 2010 rheumatoid arthritis classification criteria: an American College of Rheumatology/European League Against Rheumatism collaborative initiative. Ann Rheum Dis 2010;69:1580-8.',
    alanlar: [c('eklem', 'Joint involvement', [['0', '1 large joint', 0], ['1', '2–10 large joints', 1], ['2', '1–3 small joints', 2], ['3', '4–10 small joints', 3], ['5', 'More than 10 joints (at least 1 small)', 5]]), c('seroloji', 'Serology (RF / ACPA)', [['0', 'Both negative', 0], ['2', 'Low-positive', 2], ['3', 'High-positive (above 3× upper limit)', 3]]), t('akut_faz', 'Abnormal CRP or ESR'), t('sure', 'Symptoms for 6 weeks or more')],
    bantlar: [b(0, 'degil', 'Below 6 — criteria not met'), b(6, 'ra', '6 or more — classified as rheumatoid arthritis')],
    ornekler: [{ girdi: { eklem: '3', seroloji: '2', sure: true }, toplam: 6, bant: 'ra' }, { girdi: { eklem: '1', seroloji: '0', akut_faz: true }, toplam: 2, bant: 'degil' }],
  },
  // ── respiratory ──
  {
    sekil: 'formul', k: 'spirometry-copd', roller: ['respiratory-medicine', 'family-medicine'],
    ad: 'Spirometry: FEV1/FVC and COPD airflow grade', aciklama: 'Post-bronchodilator FEV1 and FVC (litres) and FEV1 % predicted. Shows the ratio and, where the ratio is below 0.7, the GOLD airflow-limitation grade.',
    not: `${NOT} A fixed ratio can over-call obstruction in older adults; the lower limit of normal from the report is preferred where available.`,
    kaynak: 'Lung Foundation Australia. The COPD-X Plan: clinical guidelines for the management of COPD (copdx.org.au), post-bronchodilator FEV1/FVC below 0.7; Global Initiative for Chronic Obstructive Lung Disease, 2024 Report (GOLD 1 ≥80%, 2 50–79%, 3 30–49%, 4 <30% predicted).',
    alanlar: [s('fev1', 0.1, 8, 'L'), s('fvc', 0.1, 10, 'L'), s('fev1_yuzde', 5, 160, '%')],
    etiketler: { fev1: 'Post-bronchodilator FEV1', fvc: 'Post-bronchodilator FVC', fev1_yuzde: 'FEV1 % predicted' },
    sayiAdlari: { oran: 'FEV1/FVC' },
    bantlar: [{ k: 'obstruksiyon_yok', e: 'Ratio 0.7 or more — no fixed-ratio airflow limitation' }, { k: 'gold1', e: 'GOLD 1 (mild)' }, { k: 'gold2', e: 'GOLD 2 (moderate)' }, { k: 'gold3', e: 'GOLD 3 (severe)' }, { k: 'gold4', e: 'GOLD 4 (very severe)' }],
    hesap: (g) => {
      const o = (g.fev1 as number) / (g.fvc as number)
      const y = g.fev1_yuzde as number
      const bant = o >= 0.7 ? 'obstruksiyon_yok' : y >= 80 ? 'gold1' : y >= 50 ? 'gold2' : y >= 30 ? 'gold3' : 'gold4'
      return { sayilar: [{ anahtar: 'oran', deger: yuvarla(o, 2), ondalik: 2 }], bant }
    },
    ornekler: [{ girdi: { fev1: 1.8, fvc: 3.2, fev1_yuzde: 60 }, sayilar: { oran: 0.56 }, bant: 'gold2' }, { girdi: { fev1: 3, fvc: 3.8, fev1_yuzde: 95 }, bant: 'obstruksiyon_yok' }],
  },
  {
    sekil: 'toplam', k: 'mmrc', roller: ['respiratory-medicine', 'cardio-thoracic-surgery'],
    ad: 'mMRC dyspnoea scale', aciklama: 'Record the breathlessness grade 0–4 from the history.',
    not: NOT,
    kaynak: 'Bestall JC, Paul EA, Garrod R, et al. Usefulness of the Medical Research Council (MRC) dyspnoea scale as a measure of disability in patients with chronic obstructive pulmonary disease. Thorax 1999;54:581-6.',
    toplamAdi: 'mMRC grade',
    alanlar: [c('derece', 'Grade', [['0', '0 — breathless only with strenuous exercise', 0], ['1', '1 — breathless hurrying on the level or walking up a slight hill', 1], ['2', '2 — walks slower than people of the same age, or stops for breath at own pace', 2], ['3', '3 — stops for breath after about 100 m or a few minutes on the level', 3], ['4', '4 — too breathless to leave the house, or breathless dressing', 4]])],
    ornekler: [{ girdi: { derece: '2' }, toplam: 2 }],
  },
  {
    sekil: 'toplam', k: 'bode', roller: ['respiratory-medicine'],
    ad: 'BODE index (COPD)', aciklama: 'Body mass index, airflow Obstruction, Dyspnoea and Exercise capacity (6-minute walk).',
    not: NOT,
    kaynak: 'Celli BR, Cote CG, Marin JM, et al. N Engl J Med 2004;350:1005-12 (quartiles 0–2, 3–4, 5–6, 7–10).',
    alanlar: [c('fev1', 'FEV1 % predicted', [['0', '65 or more', 0], ['1', '50–64', 1], ['2', '36–49', 2], ['3', '35 or less', 3]]), c('yuruyus', '6-minute walk distance (m)', [['0', '350 or more', 0], ['1', '250–349', 1], ['2', '150–249', 2], ['3', '149 or less', 3]]), c('mmrc', 'mMRC grade', [['0', '0–1', 0], ['1', '2', 1], ['2', '3', 2], ['3', '4', 3]]), c('bmi', 'BMI (kg/m²)', [['0', 'Above 21', 0], ['1', '21 or less', 1]])],
    bantlar: [b(0, 'q1', 'Quartile 1 (0–2)'), b(3, 'q2', 'Quartile 2 (3–4)'), b(5, 'q3', 'Quartile 3 (5–6)'), b(7, 'q4', 'Quartile 4 (7–10)')],
    ornekler: [{ girdi: { fev1: '1', yuruyus: '1', mmrc: '1', bmi: '0' }, toplam: 3, bant: 'q2' }],
  },
  // ── immunology and allergy ──
  {
    sekil: 'toplam', k: 'pen-fast', roller: ['immunology-and-allergy', 'infectious-diseases'],
    ad: 'PEN-FAST penicillin allergy decision rule', aciklama: 'For a reported penicillin allergy: Five years or less since the reaction, Anaphylaxis/angioedema or Severe cutaneous adverse reaction, and Treatment required. Developed in Australia.',
    not: `${NOT} A score below 3 identifies low-risk histories suitable for direct oral challenge under specialist protocols.`,
    kaynak: 'Trubiano JA, Vogrin S, Chua KYL, et al. Development and validation of a penicillin allergy clinical decision rule. JAMA Intern Med 2020;180:745-52 (0 very low, 1–2 low, 3 moderate, 4–5 high risk; <3 low risk).',
    alanlar: [t('bes_yil', 'Five years or less since the reaction', 2), t('anafilaksi', 'Anaphylaxis or angioedema, or severe cutaneous adverse reaction', 2), t('tedavi', 'Treatment required for the reaction')],
    bantlar: [b(0, 'cok_dusuk', '0 — very low risk'), b(1, 'dusuk', '1–2 — low risk'), b(3, 'orta', '3 — moderate risk'), b(4, 'yuksek', '4–5 — high risk')],
    ornekler: [{ girdi: { tedavi: true }, toplam: 1, bant: 'dusuk' }, { girdi: { bes_yil: true, anafilaksi: true, tedavi: true }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'anaphylaxis-grade', roller: ['immunology-and-allergy', 'emergency-medicine'],
    ad: 'Anaphylaxis severity grade (Brown)', aciklama: 'Grade the generalised hypersensitivity reaction as mild, moderate or severe. Developed in Australia.',
    not: `${NOT} Adrenaline is first-line for anaphylaxis (ASCIA guidance); grading follows treatment, it does not delay it.`,
    kaynak: 'Brown SGA. Clinical features and severity grading of anaphylaxis. J Allergy Clin Immunol 2004;114:371-6.',
    toplamAdi: 'Grade',
    alanlar: [c('derece', 'Grade', [['1', 'Mild — skin and subcutaneous tissues only (urticaria, erythema, angioedema)', 1], ['2', 'Moderate — respiratory, cardiovascular or gastrointestinal features (dyspnoea, stridor, wheeze, nausea, vomiting, dizziness, chest or throat tightness, abdominal pain)', 2], ['3', 'Severe — hypoxia (SpO2 ≤92%), hypotension (systolic <90 mmHg) or neurological compromise (confusion, collapse, loss of consciousness, incontinence)', 3]])],
    bantlar: [b(1, 'hafif', 'Mild'), b(2, 'orta', 'Moderate'), b(3, 'agir', 'Severe')],
    ornekler: [{ girdi: { derece: '3' }, bant: 'agir' }],
  },
  {
    sekil: 'formul', k: 'tryptase-rule', roller: ['immunology-and-allergy'],
    ad: 'Acute vs baseline tryptase (20% + 2 rule)', aciklama: 'An acute tryptase above 1.2 × baseline + 2 µg/L supports mast-cell activation.',
    not: NOT,
    kaynak: 'Valent P, Akin C, Arock M, et al. Definitions, criteria and global classification of mast cell disorders with special reference to mast cell activation syndromes: a consensus proposal. Int Arch Allergy Immunol 2012;157:215-25.',
    alanlar: [s('akut', 0.5, 500, 'µg/L'), s('bazal', 0.5, 200, 'µg/L')],
    etiketler: { akut: 'Acute tryptase (1–4 hours after onset)', bazal: 'Baseline tryptase (24 hours or more after recovery)' },
    sayiAdlari: { esik: 'Threshold (1.2 × baseline + 2)' },
    sonucBirimleri: ['µg/L'],
    bantlar: [{ k: 'destekler', e: 'Acute value above the threshold — supports mast-cell activation' }, { k: 'desteklemez', e: 'Acute value at or below the threshold' }],
    hesap: (g) => {
      const esik = 1.2 * (g.bazal as number) + 2
      return { sayilar: [{ anahtar: 'esik', deger: yuvarla(esik, 1), ondalik: 1, birim: 'µg/L' }], bant: (g.akut as number) > esik ? 'destekler' : 'desteklemez' }
    },
    ornekler: [{ girdi: { akut: 12, bazal: 5 }, sayilar: { esik: 8 }, bant: 'destekler' }, { girdi: { akut: 7, bazal: 5 }, bant: 'desteklemez' }],
  },
  {
    sekil: 'formul', k: 'uas7', roller: ['immunology-and-allergy', 'dermatology'],
    ad: 'Urticaria Activity Score over 7 days (UAS7)', aciklama: 'Enter each day\'s combined wheal (0–3) and itch (0–3) score from the patient\'s diary (0–6 per day). Total 0–42.',
    not: NOT,
    kaynak: 'Mlynek A, Zalewska-Janowska A, Martus P, et al. How to assess disease activity in patients with chronic urticaria? Allergy 2008;63:777-80; Zuberbier T, et al. The international EAACI/GA²LEN/EuroGuiDerm/APAAACI guideline for urticaria. Allergy 2022;77:734-66 (0 free, 1–6 well controlled, 7–15 mild, 16–27 moderate, 28–42 severe).',
    alanlar: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].map((k) => ({ anahtar: k, tur: 'puan' as const, enAz: 0, enCok: 6, tam: true })),
    etiketler: { g1: 'Day 1', g2: 'Day 2', g3: 'Day 3', g4: 'Day 4', g5: 'Day 5', g6: 'Day 6', g7: 'Day 7' },
    sayiAdlari: { uas7: 'UAS7' },
    bantlar: [{ k: 'yok', e: 'Itch- and hive-free (0)' }, { k: 'kontrollu', e: 'Well-controlled (1–6)' }, { k: 'hafif', e: 'Mild activity (7–15)' }, { k: 'orta', e: 'Moderate activity (16–27)' }, { k: 'agir', e: 'Severe activity (28–42)' }],
    hesap: (g) => {
      const v = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].reduce((t2, k) => t2 + (g[k] as number), 0)
      return { sayilar: [{ anahtar: 'uas7', deger: v, ondalik: 0, enCok: 42 }], bant: v === 0 ? 'yok' : v <= 6 ? 'kontrollu' : v <= 15 ? 'hafif' : v <= 27 ? 'orta' : 'agir' }
    },
    ornekler: [{ girdi: { g1: 3, g2: 3, g3: 2, g4: 2, g5: 3, g6: 2, g7: 3 }, sayilar: { uas7: 18 }, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'feno', roller: ['immunology-and-allergy', 'paediatrics'],
    ad: 'FeNO interpretation (eosinophilic airway inflammation)', aciklama: 'Fractional exhaled nitric oxide in ppb, interpreted by the adult or child cut-points of the clinical practice guideline.',
    not: NOT,
    kaynak: 'Dweik RA, Boggs PB, Erzurum SC, et al. An official ATS clinical practice guideline: interpretation of exhaled nitric oxide levels (FENO) for clinical applications. Am J Respir Crit Care Med 2011;184:602-15 (adults <25 low, 25–50 intermediate, >50 high; children <20, 20–35, >35 ppb).',
    alanlar: [s('feno', 1, 300, 'ppb'), sec('grup', ['yetiskin', 'cocuk'])],
    etiketler: { feno: 'FeNO', grup: 'Patient group' },
    secenekEtiketleri: { grup: { yetiskin: 'Adult', cocuk: 'Child under 12' } },
    sayiAdlari: { feno: 'FeNO' },
    sonucBirimleri: ['ppb'],
    bantlar: [{ k: 'dusuk', e: 'Low — eosinophilic inflammation less likely' }, { k: 'ara', e: 'Intermediate — interpret with the clinical context' }, { k: 'yuksek', e: 'High — eosinophilic inflammation likely' }],
    hesap: (g) => {
      const v = g.feno as number
      const [a, u] = g.grup === 'cocuk' ? [20, 35] : [25, 50]
      return { sayilar: [{ anahtar: 'feno', deger: v, ondalik: 0, birim: 'ppb' }], bant: v < a ? 'dusuk' : v > u ? 'yuksek' : 'ara' }
    },
    ornekler: [{ girdi: { feno: 60, grup: 'yetiskin' }, bant: 'yuksek' }, { girdi: { feno: 30, grup: 'cocuk' }, bant: 'ara' }],
  },
  // ── geriatric medicine ──
  {
    sekil: 'toplam', k: '4at', roller: ['geriatric-medicine', 'internal-medicine'],
    ad: '4AT rapid assessment for delirium', aciklama: 'Alertness, AMT4, attention (months backwards) and acute change or fluctuating course.',
    not: `${NOT} The 4AT is free to use; a positive screen needs clinical assessment for delirium and its causes.`,
    kaynak: 'Bellelli G, Morandi A, Davis DH, et al. Validation of the 4AT, a new instrument for rapid delirium screening: a study in 234 hospitalised older people. Age Ageing 2014;43:496-502 (≥4 possible delirium; 1–3 possible cognitive impairment; 0 delirium or severe cognitive impairment unlikely).',
    alanlar: [c('uyaniklik', 'Alertness', [['0', 'Normal, or mild sleepiness under 10 seconds after waking', 0], ['4', 'Clearly abnormal', 4]]), c('amt4', 'AMT4 (age, date of birth, place, year)', [['0', 'No mistakes', 0], ['1', '1 mistake', 1], ['2', '2 or more mistakes, or untestable', 2]]), c('dikkat', 'Attention (months of the year backwards)', [['0', '7 or more months correctly', 0], ['1', 'Starts but under 7 months, or refuses', 1], ['2', 'Untestable', 2]]), c('degisim', 'Acute change or fluctuating course', [['0', 'No', 0], ['4', 'Yes', 4]])],
    bantlar: [b(0, 'olasi_degil', '0 — delirium or severe cognitive impairment unlikely'), b(1, 'bilissel', '1–3 — possible cognitive impairment'), b(4, 'deliryum', '4 or more — possible delirium with or without cognitive impairment')],
    ornekler: [{ girdi: { uyaniklik: '0', amt4: '1', dikkat: '1', degisim: '4' }, toplam: 6, bant: 'deliryum' }, { girdi: { uyaniklik: '0', amt4: '1', dikkat: '0', degisim: '0' }, toplam: 1, bant: 'bilissel' }],
  },
  {
    sekil: 'toplam', k: 'rudas', roller: ['geriatric-medicine', 'family-medicine'],
    ad: 'Rowland Universal Dementia Assessment Scale (RUDAS)', aciklama: 'Australian cognitive screen designed to minimise cultural and language effects. Record each domain score from the RUDAS form; total 0–30.',
    not: `${NOT} A screen, not a diagnosis of dementia. Use a professional interpreter where needed.`,
    kaynak: 'Storey JE, Rowland JT, Basic D, Conforti DA, Dickson HG. The Rowland Universal Dementia Assessment Scale (RUDAS): a multicultural cognitive assessment scale. Int Psychogeriatr 2004;16:13-31 (22 or less suggests cognitive impairment).',
    alanlar: [i('bellek', 0, 8, 'Memory recall (0–8)'), i('beden', 0, 5, 'Body orientation (0–5)'), i('praksi', 0, 2, 'Praxis (0–2)'), i('cizim', 0, 3, 'Visuoconstructional drawing (0–3)'), i('yargi', 0, 4, 'Judgement (0–4)'), i('dil', 0, 8, 'Language (0–8)')],
    bantlar: [b(0, 'bozulma', '22 or less — suggests cognitive impairment'), b(23, 'normal', '23–30')],
    ornekler: [{ girdi: { bellek: 4, beden: 5, praksi: 1, cizim: 2, yargi: 3, dil: 6 }, toplam: 21, bant: 'bozulma' }],
  },
  {
    sekil: 'toplam', k: 'abbey-pain', roller: ['geriatric-medicine', 'pain-medicine', 'rehabilitation-medicine'],
    ad: 'Abbey Pain Scale (people who cannot verbalise)', aciklama: 'Six observed domains 0–3 (absent, mild, moderate, severe). Developed in Australia for people with dementia.',
    not: NOT,
    kaynak: 'Abbey J, Piller N, De Bellis A, et al. The Abbey pain scale: a 1-minute numerical indicator for people with end-stage dementia. Int J Palliat Nurs 2004;10:6-13 (0–2 no pain, 3–7 mild, 8–13 moderate, 14+ severe).',
    alanlar: [i('ses', 0, 3, 'Vocalisation (0–3)'), i('yuz', 0, 3, 'Facial expression (0–3)'), i('beden', 0, 3, 'Change in body language (0–3)'), i('davranis', 0, 3, 'Behavioural change (0–3)'), i('fizyolojik', 0, 3, 'Physiological change (0–3)'), i('fiziksel', 0, 3, 'Physical changes (0–3)')],
    bantlar: [b(0, 'yok', '0–2 — no pain'), b(3, 'hafif', '3–7 — mild'), b(8, 'orta', '8–13 — moderate'), b(14, 'agir', '14 or more — severe')],
    ornekler: [{ girdi: { ses: 2, yuz: 2, beden: 1, davranis: 2, fizyolojik: 1, fiziksel: 1 }, toplam: 9, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'clinical-frailty', roller: ['geriatric-medicine', 'internal-medicine'],
    ad: 'Clinical Frailty Scale level', aciklama: 'Record the level (1–9) judged from the patient\'s function two weeks before the acute illness. Level descriptions are read from the CFS chart.',
    not: NOT,
    kaynak: 'Rockwood K, Song X, MacKnight C, et al. A global clinical measure of fitness and frailty in elderly people. CMAJ 2005;173:489-95; Rockwood K, Theou O. Using the Clinical Frailty Scale in allocating scarce health care resources. Can Geriatr J 2020;23:210-5 (version 2.0).',
    toplamAdi: 'CFS level',
    alanlar: [c('duzey', 'Level', [['1', '1 — very fit', 1], ['2', '2 — fit', 2], ['3', '3 — managing well', 3], ['4', '4 — living with very mild frailty', 4], ['5', '5 — living with mild frailty', 5], ['6', '6 — living with moderate frailty', 6], ['7', '7 — living with severe frailty', 7], ['8', '8 — living with very severe frailty', 8], ['9', '9 — terminally ill', 9]])],
    bantlar: [b(1, 'saglam', '1–3 — not frail'), b(4, 'cok_hafif', '4 — very mild frailty'), b(5, 'kirilgan', '5–9 — frail')],
    ornekler: [{ girdi: { duzey: '6' }, toplam: 6, bant: 'kirilgan' }],
  },
]
