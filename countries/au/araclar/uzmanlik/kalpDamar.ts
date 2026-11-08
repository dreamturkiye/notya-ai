/**
 * ULKE-BRANS-DERINLIK-01 — Australia: specialty tools of cardiology, cardio-thoracic and vascular surgery, general
 * practice's cardiovascular work, and podiatry's vascular check. Each row: its roles (≤3), its published source, its
 * worked examples. See ./motor.ts.
 */
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { b, c, t, yuvarla, type UzmanlikSatiri } from './motor'

const NOT_KARAR = 'A score from what you entered, by the published method shown. It informs, it does not decide: the treating clinician weighs it with the whole patient and approves the note.'

export const KALP_DAMAR: readonly UzmanlikSatiri[] = [
  {
    sekil: 'toplam', k: 'cha2ds2-va', roller: ['cardiology', 'family-medicine', 'geriatric-medicine'],
    ad: 'CHA2DS2-VA stroke risk in atrial fibrillation',
    aciklama: 'The sex-independent stroke-risk score the Australian atrial fibrillation guideline recommends for non-valvular AF. Tick what applies; the total and the guideline\'s decision band are shown.',
    not: `${NOT_KARAR} Mechanical valves and moderate–severe mitral stenosis are outside this score.`,
    kaynak: 'NHFA CSANZ Atrial Fibrillation Guideline Working Group. National Heart Foundation of Australia and CSANZ: Australian Clinical Guidelines for the Diagnosis and Management of Atrial Fibrillation 2018. Heart Lung Circ 2018;27:1209-66 (CHA2DS2-VA: sex removed from CHA2DS2-VASc; anticoagulation recommended at ≥2, considered at 1).',
    alanlar: [t('chf', 'Congestive heart failure (or LV systolic dysfunction)'), t('htn', 'Hypertension'), c('yas', 'Age', [['alt65', 'Under 65', 0], ['65_74', '65 to 74', 1], ['75', '75 or older', 2]]), t('dm', 'Diabetes mellitus'), t('inme', 'Prior stroke, TIA or thromboembolism', 2), t('damar', 'Vascular disease (prior MI, peripheral arterial disease, aortic plaque)')],
    bantlar: [b(0, 'dusuk', '0 — anticoagulation not recommended'), b(1, 'orta', '1 — anticoagulation to be considered'), b(2, 'yuksek', '2 or more — anticoagulation recommended unless contraindicated')],
    ornekler: [
      { girdi: { yas: 'alt65' }, toplam: 0, bant: 'dusuk' },
      { girdi: { yas: '65_74', htn: true }, toplam: 2, bant: 'yuksek' },
      { girdi: { yas: '75', inme: true, dm: true, chf: true, htn: true, damar: true }, toplam: 8, bant: 'yuksek' },
      { girdi: { htn: true }, tamam: false },
    ],
  },
  {
    sekil: 'toplam', k: 'has-bled', roller: ['cardiology', 'haematology', 'family-medicine'],
    ad: 'HAS-BLED bleeding risk on anticoagulation',
    aciklama: 'Bleeding-risk score for patients with atrial fibrillation on, or considered for, oral anticoagulation. A high score flags modifiable risks to review, not a reason by itself to withhold anticoagulation.',
    not: `${NOT_KARAR} Address the modifiable items (blood pressure, labile INR, drugs, alcohol).`,
    kaynak: 'Pisters R, Lane DA, Nieuwlaat R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation: the Euro Heart Survey. Chest 2010;138:1093-100. Cited in the NHFA/CSANZ AF guideline 2018 (Heart Lung Circ 2018;27:1209-66). Score ≥3 = high risk.',
    alanlar: [t('htn', 'Hypertension (uncontrolled, systolic >160 mmHg)'), t('bobrek', 'Abnormal renal function (dialysis, transplant, creatinine ≥200 µmol/L)'), t('karaciger', 'Abnormal liver function (cirrhosis, or bilirubin >2× and AST/ALT >3× normal)'), t('inme', 'Prior stroke'), t('kanama', 'Prior major bleeding or predisposition'), t('inr', 'Labile INR (time in range <60%)'), t('yasli', 'Age over 65'), t('ilac', 'Drugs predisposing to bleeding (antiplatelets, NSAIDs)'), t('alkol', 'Alcohol ≥8 drinks a week')],
    bantlar: [b(0, 'dusuk', '0–2 — lower bleeding risk'), b(3, 'yuksek', '3 or more — high bleeding risk: review modifiable factors and follow up more closely')],
    ornekler: [{ girdi: { hicbiri: true }, toplam: 0, bant: 'dusuk' }, { girdi: { htn: true, yasli: true, ilac: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'heart-score', roller: ['cardiology', 'emergency-medicine', 'family-medicine'],
    ad: 'HEART score for undifferentiated chest pain',
    aciklama: 'History, ECG, Age, Risk factors and Troponin, 0–2 each. Bands of the derivation study for 6-week major adverse cardiac events.',
    not: `${NOT_KARAR} Use alongside the local chest-pain pathway; a low score does not rule out acute coronary syndrome on its own.`,
    kaynak: 'Six AJ, Backus BE, Kelder JC. Chest pain in the emergency room: value of the HEART score. Neth Heart J 2008;16:191-6; Backus BE, et al. Int J Cardiol 2013;168:2153-8 (0–3 low, 4–6 moderate, 7–10 high).',
    alanlar: [
      c('oyku', 'History', [['az', 'Slightly suspicious', 0], ['orta', 'Moderately suspicious', 1], ['cok', 'Highly suspicious', 2]]),
      c('ekg', 'ECG', [['normal', 'Normal', 0], ['nonspesifik', 'Non-specific repolarisation disturbance', 1], ['st', 'Significant ST deviation', 2]]),
      c('yas', 'Age', [['alt45', 'Under 45', 0], ['45_64', '45 to 64', 1], ['65', '65 or older', 2]]),
      c('risk', 'Risk factors', [['yok', 'No known risk factors', 0], ['bir_iki', '1–2 risk factors', 1], ['uc', '3 or more, or known atherosclerotic disease', 2]]),
      c('troponin', 'Initial troponin', [['normal', 'At or below the normal limit', 0], ['bir_uc', '1–3× the normal limit', 1], ['uc', 'More than 3× the normal limit', 2]]),
    ],
    bantlar: [b(0, 'dusuk', '0–3 — low risk'), b(4, 'orta', '4–6 — moderate risk'), b(7, 'yuksek', '7–10 — high risk')],
    ornekler: [
      { girdi: { oyku: 'az', ekg: 'normal', yas: 'alt45', risk: 'yok', troponin: 'normal' }, toplam: 0, bant: 'dusuk' },
      { girdi: { oyku: 'orta', ekg: 'nonspesifik', yas: '45_64', risk: 'bir_iki', troponin: 'normal' }, toplam: 4, bant: 'orta' },
      { girdi: { oyku: 'cok', ekg: 'st', yas: '65', risk: 'uc', troponin: 'uc' }, toplam: 10, bant: 'yuksek' },
    ],
  },
  {
    sekil: 'formul', k: 'qtc', roller: ['cardiology', 'psychiatry', 'emergency-medicine'],
    ad: 'Corrected QT interval (Bazett and Fridericia)',
    aciklama: 'Type the measured QT and the heart rate. Shows QTc by Bazett and by Fridericia, and flags the prolongation thresholds of the AHA/ACCF/HRS scientific statement.',
    not: `${NOT_KARAR} Bazett over-corrects at fast heart rates; Fridericia is shown beside it. Measure by hand on a lead with a clear T-wave end.`,
    kaynak: 'Bazett HC. Heart 1920;7:353-70; Fridericia LS. Acta Med Scand 1920;53:469-86. Thresholds: Rautaharju PM, et al. AHA/ACCF/HRS recommendations on ECG interpretation, part IV (the ST segment, T and U waves, and the QT interval). Circulation 2009;119:e241-50 (prolonged QTc ≥450 ms men, ≥460 ms women; ≥500 ms markedly prolonged).',
    alanlar: [{ anahtar: 'qt', tur: 'sayi', enAz: 200, enCok: 800, birim: 'ms' }, { anahtar: 'hiz', tur: 'sayi', enAz: 30, enCok: 220, birim: 'bpm' }, { anahtar: 'cinsiyet', tur: 'secim', secenekler: ['erkek', 'kadin'] }],
    etiketler: { qt: 'Measured QT interval', hiz: 'Heart rate', cinsiyet: 'Sex' },
    secenekEtiketleri: { cinsiyet: { erkek: 'Male', kadin: 'Female' } },
    sayiAdlari: { bazett: 'QTc (Bazett)', fridericia: 'QTc (Fridericia)', rr: 'RR interval' },
    sonucBirimleri: ['ms', 's'],
    bantlar: [{ k: 'normal', e: 'Below the prolongation threshold for sex' }, { k: 'uzun', e: 'Prolonged for sex' }, { k: 'belirgin', e: '500 ms or more — markedly prolonged' }],
    hesap: (g) => {
      const qt = g.qt as number, hiz = g.hiz as number
      const rr = 60 / hiz
      const bazett = Math.round(qt / Math.sqrt(rr))
      const frid = Math.round(qt / Math.cbrt(rr))
      const esik = g.cinsiyet === 'kadin' ? 460 : 450
      const bant = frid >= 500 || bazett >= 500 ? 'belirgin' : frid >= esik ? 'uzun' : 'normal'
      return { sayilar: [{ anahtar: 'bazett', deger: bazett, ondalik: 0, birim: 'ms' }, { anahtar: 'fridericia', deger: frid, ondalik: 0, birim: 'ms' }, { anahtar: 'rr', deger: yuvarla(rr, 3), ondalik: 3, birim: 's' }], bant }
    },
    ornekler: [
      { girdi: { qt: 400, hiz: 60, cinsiyet: 'erkek' }, sayilar: { bazett: 400, fridericia: 400 }, bant: 'normal' },
      { girdi: { qt: 400, hiz: 90, cinsiyet: 'kadin' }, sayilar: { bazett: 490, fridericia: 458 }, bant: 'normal' },
      { girdi: { qt: 480, hiz: 75, cinsiyet: 'erkek' }, sayilar: { bazett: 537, fridericia: 517 }, bant: 'belirgin' },
    ],
  },
  {
    sekil: 'toplam', k: 'nyha-class', roller: ['cardiology', 'cardio-thoracic-surgery', 'internal-medicine'],
    ad: 'NYHA functional class (heart failure)',
    aciklama: 'Record the New York Heart Association class from the history you took. The class is the record; the trend is read from kept results on the file.',
    not: `${NOT_KARAR} Symptom class, not severity of structural disease.`,
    kaynak: 'The Criteria Committee of the New York Heart Association. Nomenclature and Criteria for Diagnosis of Diseases of the Heart and Great Vessels. 9th ed. Boston: Little, Brown & Co; 1994. Used in the NHFA/CSANZ Guidelines for the Prevention, Detection and Management of Heart Failure in Australia 2018 (Heart Lung Circ 2018;27:1123-1208).',
    toplamAdi: 'NYHA class',
    alanlar: [c('sinif', 'Class', [['i', 'I — no limitation of ordinary physical activity', 1], ['ii', 'II — slight limitation; comfortable at rest', 2], ['iii', 'III — marked limitation; less than ordinary activity causes symptoms', 3], ['iv', 'IV — symptoms at rest or with any activity', 4]])],
    bantlar: [b(1, 'i', 'Class I'), b(2, 'ii', 'Class II'), b(3, 'iii', 'Class III'), b(4, 'iv', 'Class IV')],
    ornekler: [{ girdi: { sinif: 'iii' }, toplam: 3, bant: 'iii' }],
  },
  {
    sekil: 'toplam', k: 'ccs-angina', roller: ['cardiology', 'cardio-thoracic-surgery'],
    ad: 'CCS angina grade (exertional angina)',
    aciklama: 'Record the grade of exertional angina by the Campeau (CCS) classification from the history.',
    not: NOT_KARAR,
    kaynak: 'Campeau L. Grading of angina pectoris (letter). Circulation 1976;54:522-3.',
    toplamAdi: 'CCS grade',
    alanlar: [c('derece', 'Grade', [['i', 'I — angina only with strenuous, rapid or prolonged exertion', 1], ['ii', 'II — slight limitation of ordinary activity', 2], ['iii', 'III — marked limitation of ordinary activity', 3], ['iv', 'IV — angina with any activity or at rest', 4]])],
    bantlar: [b(1, 'i', 'Grade I'), b(2, 'ii', 'Grade II'), b(3, 'iii', 'Grade III'), b(4, 'iv', 'Grade IV')],
    ornekler: [{ girdi: { derece: 'ii' }, toplam: 2, bant: 'ii' }],
  },
  {
    sekil: 'formul', k: 'ppo-fev1', roller: ['cardio-thoracic-surgery', 'respiratory-medicine'],
    ad: 'Predicted postoperative FEV1 and DLCO (segment method)',
    aciklama: 'Type the preoperative FEV1 and DLCO as % predicted and the number of functional segments to be resected. Shows ppoFEV1% and ppoDLCO% by the anatomical segment method (19 segments).',
    not: `${NOT_KARAR} Perfusion scanning may be preferred for pneumonectomy. Low values call for cardiopulmonary exercise testing under the guideline algorithm.`,
    kaynak: 'Brunelli A, Kim AW, Berger KI, Addrizzo-Harris DJ. Physiologic evaluation of the patient with lung cancer being considered for resectional surgery: ACCP evidence-based clinical practice guidelines, 3rd ed. Chest 2013;143(5 Suppl):e166S-e190S (ppo = preop × (1 − resected segments / 19); both ppoFEV1 and ppoDLCO >60% = low risk; either <30% = high risk).',
    alanlar: [{ anahtar: 'fev1', tur: 'sayi', enAz: 10, enCok: 150, birim: '%' }, { anahtar: 'dlco', tur: 'sayi', enAz: 10, enCok: 150, birim: '%' }, { anahtar: 'segment', tur: 'sayi', enAz: 1, enCok: 19, tam: true }],
    etiketler: { fev1: 'Preoperative FEV1 (% predicted)', dlco: 'Preoperative DLCO (% predicted)', segment: 'Functional segments to be resected' },
    sayiAdlari: { ppo_fev1: 'ppoFEV1', ppo_dlco: 'ppoDLCO' },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'dusuk', e: 'Both above 60% — low risk for resection' }, { k: 'ara', e: 'Between 30% and 60% — further testing per the algorithm' }, { k: 'yuksek', e: 'Either below 30% — high risk' }],
    hesap: (g) => {
      const f = (g.fev1 as number) * (1 - (g.segment as number) / 19)
      const d = (g.dlco as number) * (1 - (g.segment as number) / 19)
      const bant = f > 60 && d > 60 ? 'dusuk' : f < 30 || d < 30 ? 'yuksek' : 'ara'
      return { sayilar: [{ anahtar: 'ppo_fev1', deger: yuvarla(f, 0), ondalik: 0, birim: '%' }, { anahtar: 'ppo_dlco', deger: yuvarla(d, 0), ondalik: 0, birim: '%' }], bant }
    },
    ornekler: [{ girdi: { fev1: 80, dlco: 75, segment: 5 }, sayilar: { ppo_fev1: 59, ppo_dlco: 55 }, bant: 'ara' }, { girdi: { fev1: 95, dlco: 90, segment: 2 }, sayilar: { ppo_fev1: 85, ppo_dlco: 81 }, bant: 'dusuk' }],
  },
  {
    sekil: 'toplam', k: 'thrcri', roller: ['cardio-thoracic-surgery'],
    ad: 'Thoracic Revised Cardiac Risk Index (ThRCRI)',
    aciklama: 'Cardiac risk before lung resection. Tick what applies.',
    not: `${NOT_KARAR} A score of 2 or more (or poor exercise tolerance, or new murmur/active cardiac condition) points to cardiology assessment under the guideline algorithm.`,
    kaynak: 'Brunelli A, Varela G, Salati M, et al. Recalibration of the revised cardiac risk index in lung resection candidates. Ann Thorac Surg 2010;90:199-203 (ischaemic heart disease 1.5, cerebrovascular disease 1.5, creatinine >2 mg/dL [177 µmol/L] 1, pneumonectomy 1.5; classes A 0, B 1–1.5, C 2–2.5, D >2.5).',
    toplamAdi: 'ThRCRI points',
    alanlar: [t('ihd', 'Ischaemic heart disease', 3), t('cvd', 'Cerebrovascular disease (stroke or TIA)', 3), t('kreatinin', 'Serum creatinine above 177 µmol/L', 2), t('pnomonektomi', 'Planned pneumonectomy', 3)],
    donustur: { f: (x) => x / 2, ondalik: 1, enCok: 5.5 },
    bantlar: [b(0, 'a', 'Class A (0)'), b(1, 'b', 'Class B (1–1.5)'), b(2, 'c', 'Class C (2–2.5)'), b(3, 'd', 'Class D (more than 2.5)')],
    ornekler: [{ girdi: { hicbiri: true }, toplam: 0, bant: 'a' }, { girdi: { ihd: true }, toplam: 1.5, bant: 'b' }, { girdi: { ihd: true, kreatinin: true }, toplam: 2.5, bant: 'c' }, { girdi: { ihd: true, cvd: true }, toplam: 3, bant: 'd' }],
  },
  {
    sekil: 'formul', k: 'abpi-tbi', roller: ['vascular-surgery', 'podiatry', 'family-medicine'],
    ad: 'Ankle–brachial and toe–brachial index',
    aciklama: 'Type the higher brachial systolic pressure, the higher ankle pressure (dorsalis pedis or posterior tibial) and, optionally, the toe pressure. Shows ABPI and TBI with the thresholds of the Australian diabetes-related foot disease guideline (IWGDF-adopted).',
    not: `${NOT_KARAR} An ABPI above 1.3 suggests incompressible vessels: use the toe pressure and TBI. Normal indices do not exclude peripheral arterial disease in diabetes.`,
    kaynak: 'Chuter V, Quigley F, Tosenovsky P, et al. Australian guideline on diagnosis and management of peripheral artery disease: part of the 2021 Australian evidence-based guidelines for diabetes-related foot disease. J Foot Ankle Res 2022;15:51, doi:10.1186/s13047-022-00550-7, adopting the IWGDF recommendations unchanged (read 2026-11-08): PAD is less likely with ABI 0.9–1.3 and TBI ≥0.75; urgent vascular imaging with ankle pressure <50 mmHg, ABI <0.5 or toe pressure <30 mmHg.',
    alanlar: [{ anahtar: 'brakiyal', tur: 'sayi', enAz: 50, enCok: 300, birim: 'mmHg' }, { anahtar: 'ayak_bilegi', tur: 'sayi', enAz: 0, enCok: 350, birim: 'mmHg' }, { anahtar: 'ayak_parmagi', tur: 'sayi', enAz: 0, enCok: 300, birim: 'mmHg', istege: true }],
    etiketler: { brakiyal: 'Higher brachial systolic pressure', ayak_bilegi: 'Higher ankle systolic pressure (this leg)', ayak_parmagi: 'Toe systolic pressure (optional)' },
    sayiAdlari: { abpi: 'ABPI', tbi: 'TBI' },
    bantlar: [{ k: 'olasi_degil', e: 'Indices in the range that makes PAD less likely' }, { k: 'pad', e: 'Index suggests peripheral arterial disease' }, { k: 'sikistirilamaz', e: 'ABPI above 1.3 — incompressible vessels: rely on toe pressure / TBI' }],
    uyarilar: [{ k: 'kritik', e: 'Ankle pressure below 50 mmHg, ABI below 0.5 or toe pressure below 30 mmHg — urgent vascular imaging and review under the guideline.' }],
    hesap: (g) => {
      const br = g.brakiyal as number
      const abpi = yuvarla((g.ayak_bilegi as number) / br, 2)
      const tp = sayiMi(g.ayak_parmagi) ? (g.ayak_parmagi as number) : null
      const tbi = tp === null ? null : yuvarla(tp / br, 2)
      const sayilar = [{ anahtar: 'abpi', deger: abpi, ondalik: 2 }, ...(tbi === null ? [] : [{ anahtar: 'tbi', deger: tbi, ondalik: 2 }])]
      let bant = abpi > 1.3 ? 'sikistirilamaz' : abpi < 0.9 ? 'pad' : 'olasi_degil'
      if (bant !== 'pad' && tbi !== null && tbi < 0.75) bant = 'pad'
      const uyarilar = (tp !== null && tp < 30) || abpi < 0.5 || (g.ayak_bilegi as number) < 50 ? ['kritik'] : []
      return { sayilar, bant, uyarilar }
    },
    ornekler: [
      { girdi: { brakiyal: 130, ayak_bilegi: 135 }, sayilar: { abpi: 1.04 }, bant: 'olasi_degil' },
      { girdi: { brakiyal: 130, ayak_bilegi: 125, ayak_parmagi: 95 }, sayilar: { abpi: 0.96, tbi: 0.73 }, bant: 'pad' },
      { girdi: { brakiyal: 140, ayak_bilegi: 105, ayak_parmagi: 70 }, sayilar: { abpi: 0.75, tbi: 0.5 }, bant: 'pad' },
      { girdi: { brakiyal: 120, ayak_bilegi: 200, ayak_parmagi: 60 }, sayilar: { abpi: 1.67, tbi: 0.5 }, bant: 'pad' },
      { girdi: { brakiyal: 150, ayak_bilegi: 60, ayak_parmagi: 25 }, sayilar: { abpi: 0.4, tbi: 0.17 }, bant: 'pad', uyarilar: ['kritik'] },
    ],
  },
  {
    sekil: 'toplam', k: 'rutherford-class', roller: ['vascular-surgery', 'podiatry'],
    ad: 'Rutherford category of chronic limb ischaemia',
    aciklama: 'Record the clinical category from the history and examination.',
    not: NOT_KARAR,
    kaynak: 'Rutherford RB, Baker JD, Ernst C, et al. Recommended standards for reports on lower-extremity ischaemia, revised version. J Vasc Surg 1997;26:517-38.',
    toplamAdi: 'Rutherford category',
    alanlar: [c('kategori', 'Category', [['0', '0 — asymptomatic', 0], ['1', '1 — mild claudication', 1], ['2', '2 — moderate claudication', 2], ['3', '3 — severe claudication', 3], ['4', '4 — ischaemic rest pain', 4], ['5', '5 — minor tissue loss', 5], ['6', '6 — major tissue loss', 6]])],
    bantlar: [b(0, 'asemptomatik', 'Asymptomatic'), b(1, 'kladikasyo', 'Claudication (categories 1–3)'), b(4, 'klti', 'Chronic limb-threatening ischaemia (categories 4–6)')],
    ornekler: [{ girdi: { kategori: '2' }, toplam: 2, bant: 'kladikasyo' }, { girdi: { kategori: '5' }, toplam: 5, bant: 'klti' }],
  },
  {
    sekil: 'toplam', k: 'ceap-clinical', roller: ['vascular-surgery'],
    ad: 'CEAP clinical class (chronic venous disease)',
    aciklama: 'Record the highest clinical class of the leg examined (2020 revision).',
    not: NOT_KARAR,
    kaynak: 'Lurie F, Passman M, Meisner M, et al. The 2020 update of the CEAP classification system and reporting standards. J Vasc Surg Venous Lymphat Disord 2020;8:342-52.',
    toplamAdi: 'C class',
    alanlar: [c('sinif', 'Clinical class', [['c0', 'C0 — no visible or palpable signs', 0], ['c1', 'C1 — telangiectasias or reticular veins', 1], ['c2', 'C2 — varicose veins', 2], ['c3', 'C3 — oedema', 3], ['c4', 'C4 — skin changes (pigmentation, eczema, lipodermatosclerosis, atrophie blanche, corona phlebectatica)', 4], ['c5', 'C5 — healed venous ulcer', 5], ['c6', 'C6 — active venous ulcer', 6]])],
    bantlar: [b(0, 'c0_2', 'C0–C2'), b(3, 'c3_4', 'C3–C4 — chronic venous insufficiency'), b(5, 'c5_6', 'C5–C6 — healed or active ulcer')],
    ornekler: [{ girdi: { sinif: 'c4' }, toplam: 4, bant: 'c3_4' }],
  },
  {
    sekil: 'toplam', k: 'wells-dvt', roller: ['vascular-surgery', 'internal-medicine', 'haematology'],
    ad: 'Wells score for deep vein thrombosis',
    aciklama: 'Pre-test probability of DVT (two-level). Tick what applies; "alternative diagnosis as likely" subtracts 2.',
    not: `${NOT_KARAR} "DVT likely" proceeds to ultrasound; "unlikely" to D-dimer under the local pathway.`,
    kaynak: 'Wells PS, Anderson DR, Rodger M, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med 2003;349:1227-35 (≥2 = DVT likely; <2 = DVT unlikely).',
    alanlar: [t('kanser', 'Active cancer (treatment within 6 months or palliative)'), t('paralizi', 'Paralysis, paresis or recent plaster immobilisation of the leg'), t('yatak', 'Bedridden ≥3 days or major surgery within 12 weeks'), t('hassasiyet', 'Localised tenderness along the deep venous system'), t('bacak', 'Entire leg swollen'), t('baldir', 'Calf swelling >3 cm compared with the other leg'), t('odem', 'Pitting oedema confined to the symptomatic leg'), t('kollateral', 'Collateral superficial veins (non-varicose)'), t('onceki', 'Previously documented DVT'), t('alternatif', 'Alternative diagnosis at least as likely as DVT', -2)],
    bantlar: [b(-2, 'olasi_degil', 'Under 2 — DVT unlikely'), b(2, 'olasi', '2 or more — DVT likely')],
    ornekler: [{ girdi: { alternatif: true }, toplam: -2, bant: 'olasi_degil' }, { girdi: { kanser: true, baldir: true }, toplam: 2, bant: 'olasi' }, { girdi: { odem: true, alternatif: true, kanser: true }, toplam: 0, bant: 'olasi_degil' }],
  },
]
