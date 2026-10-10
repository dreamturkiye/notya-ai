/**
 * NOTYA-ULKE-UYGULA-US — United States: THE MECHANISMS OF THE TOOLS ONLY THIS COUNTRY HAS. Arithmetic only: numbers
 * and keys, never a sentence (the words are in ./metinler.ts). Every key begins with "us-" and is listed for the
 * United States in countries/yasak-araclar.json, so no other country, no language set and no kit file can name one.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * EVERY TOOL HERE IS SWITCHED ON, by the owner's order of 2026-10-10 ("We will test as we go"), AND NONE HAS BEEN
 * SIGNED OFF BY A CLINICIAN of the United States: each stands on ./onayBekleyen.ts with what a clinician is asked.
 *
 * THE RULE THIS FILE WAS WRITTEN UNDER. Every formula, limit, band and criterion below is as its source prints it,
 * and each source was OPENED ON 2026-10-10 through a tool that returns the text of a page. Nothing is from memory.
 * The source stands beside the code; its own worked examples are the tests (./yeniAraclar.test.ts). A clinician
 * opens each source again before signing a tool off. The limits a field may be typed in (`sayi(key, least, most)`)
 * are input limits of the screen and say nothing clinical, except where a line says the source states them.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import { INC_CM, LB_KG } from '@/lib/ulke/araclar/birimler'
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, puan, sayi, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'

const EVET_HAYIR = ['evet', 'hayir'] as const

// ───────────────────────── 1. body mass index, adults ─────────────────────────

/**
 * BODY MASS INDEX of an adult, with the category the CDC prints for it.
 *
 * SOURCES (Centers for Disease Control and Prevention):
 *   [CDC-BMI-ABOUT]  "About Body Mass Index (BMI)" (Dec. 16, 2025), https://www.cdc.gov/bmi/about/index.html —
 *                    the formula, printed in metric units only: "BMI = weight (kg) / height (m)2".
 *   [CDC-BMI-CAT]    "Adult BMI Categories" (last reviewed March 19, 2024),
 *                    https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html — for adults 20 and older:
 *                    Underweight, less than 18.5; Healthy Weight, 18.5 to less than 25; Overweight, 25 to less than
 *                    30; Obesity, 30 or greater, in three classes: Class 1, 30 to less than 35; Class 2, 35 to less
 *                    than 40; Class 3 (Severe Obesity), 40 or greater.
 *   [CDC-BMI-CALC]   "Adult BMI Calculator" (last reviewed June 26, 2024),
 *                    https://www.cdc.gov/bmi/adult-calculator/index.html — for adults 20 and older; it takes feet,
 *                    inches and pounds, a height from 3 to 9 feet and a weight from 55 to 1,000 pounds.
 *
 * FEET, INCHES AND POUNDS are turned into meters and kilograms with the exact defined factors (1 in = 2.54 cm,
 * 1 lb = 0.45359237 kg: the kit's own constants), and the formula is the metric one the CDC prints. No formula in
 * pounds and inches was printed on a page read, so none is used.
 *
 * ROUNDING, AND WHERE IT COMES FROM. The CDC's worked example on [CDC-BMI-CAT] (an adult of 5 feet 9 inches) puts 125
 * pounds in "Healthy Weight" and 124 in "Underweight", 169 in "Overweight" and 168 in "Healthy Weight", 203 in Class 1
 * and 202 in "Overweight", 237 in Class 2 and 236 in Class 1, 271 in Class 3 and 270 in Class 2. Worked out exactly,
 * 125 pounds at that height is 18.46, below 18.5. The table is right only if THE BMI IS ROUNDED TO ONE DECIMAL PLACE
 * BEFORE IT IS PUT IN A CATEGORY (18.46 is then 18.5). So that is what this tool does, and the ten weights of that
 * table are its test. No page read says so in words: FOR A US CLINICIAN TO CONFIRM.
 */
export const US_BMI_BANTLARI = ['zayif', 'saglikli', 'fazla_kilolu', 'obezite_1', 'obezite_2', 'obezite_3'] as const
export const usBmiBandi = (bmi: number): (typeof US_BMI_BANTLARI)[number] => (bmi < 18.5 ? 'zayif' : bmi < 25 ? 'saglikli' : bmi < 30 ? 'fazla_kilolu' : bmi < 35 ? 'obezite_1' : bmi < 40 ? 'obezite_2' : 'obezite_3')
export const US_BMI: AracTanimi = {
  anahtar: 'us-bmi',
  tur: 'hesap',
  // the limits of height and weight are the ones [CDC-BMI-CALC] states for its own calculator
  alanlar: [sayi('boy_ft', 3, 9, { tam: true, birim: 'ft' }), sayi('boy_in', 0, 11.99, { birim: 'in' }), sayi('agirlik_lb', 55, 1000, { birim: 'lb' })],
  cikti: { sayilar: ['bmi'], bantlar: [...US_BMI_BANTLARI], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['kg/m2'],
  kaynak: 'Centers for Disease Control and Prevention. About Body Mass Index (BMI); Adult BMI Categories.',
  hesapla: (g) => {
    // every one of the three is typed, the inches too: a height of "5 feet" with the inches left empty is not read as 5 feet 0 inches
    if (!sayiMi(g.boy_ft) || !sayiMi(g.boy_in) || !sayiMi(g.agirlik_lb)) return BOS_SONUC
    const inc = g.boy_ft * 12 + g.boy_in
    if (g.boy_in < 0 || g.boy_in >= 12 || inc < 36 || inc > 108 || g.agirlik_lb < 55 || g.agirlik_lb > 1000) return BOS_SONUC
    const metre = (inc * INC_CM) / 100
    const bmi = Math.round(((g.agirlik_lb * LB_KG) / (metre * metre)) * 10) / 10
    return { tamam: true, sayilar: [{ anahtar: 'bmi', deger: bmi, ondalik: 1, birim: 'kg/m2' }], bant: usBmiBandi(bmi), uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 2. estimated GFR, CKD-EPI 2021 (creatinine) ─────────────────────────

/**
 * ESTIMATED GLOMERULAR FILTRATION RATE from serum creatinine, age and sex: the 2021 CKD-EPI creatinine equation.
 *
 * SOURCES:
 *   [NIDDK-EGFR]  National Institute of Diabetes and Digestive and Kidney Diseases, "eGFR Equations for Adults"
 *                 (last reviewed May 2025), https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults
 *                 — the equation as printed: eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^-1.200 × 0.9938^Age
 *                 × 1.012 [if female]; κ = 0.7 (female), 0.9 (male); α = -0.241 (female), -0.302 (male); SCr is
 *                 standardized serum creatinine in mg/dL; the result is in mL/min/1.73 m²; its table gives the
 *                 equation for age 18 and over. The page prints no worked example and no rounding rule.
 *   [NKF-TICKET]  National Kidney Foundation, "Example IT ticket: implement 2021 CKD-EPI equation to calculate eGFR
 *                 from creatinine", https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf
 *                 — the same four cases of the equation; the result reported in whole numbers ("Number of decimal
 *                 places zero"); under 18 years nothing is calculated; and EIGHT TEST CASES, which are this tool's test: age 18, male,
 *                 0.90 mg/dL = 127 and 0.91 = 125; age 18, female, 0.70 = 128 and 0.71 = 126; age 90, male, 0.50 = 97
 *                 and 1.50 = 44; age 90, female, 0.50 = 89 and 1.50 = 33.
 *
 * WHAT IS NOT HERE, each because no source read supplies it: the equation with cystatin C (printed on [NIDDK-EGFR],
 * with no test case on a page read); a GFR category or any other band; a result in mL/min without the body-surface
 * term (the audit asked for one beside it: it needs a body-surface formula, and no US source naming one was found);
 * the laboratory's reportable range ([NKF-TICKET] gives one for a laboratory report, which is not what this is).
 * The value is an estimate: [NIDDK-EGFR] says it "is not a precise measure of kidney function".
 */
export const usEgfr2021 = (kadin: boolean, yas: number, kreatininMgDl: number): number => {
  const kappa = kadin ? 0.7 : 0.9
  const alfa = kadin ? -0.241 : -0.302
  const oran = kreatininMgDl / kappa
  return 142 * Math.pow(Math.min(oran, 1), alfa) * Math.pow(Math.max(oran, 1), -1.2) * Math.pow(0.9938, yas) * (kadin ? 1.012 : 1)
}
export const US_EGFR: AracTanimi = {
  anahtar: 'us-egfr-ckd-epi-2021',
  tur: 'hesap',
  // age 18 and over is the source's ([NIDDK-EGFR], [NKF-TICKET]); creatinine is typed in the unit the pack states for it (mg/dL here)
  alanlar: [secim('cinsiyet', ['kadin', 'erkek']), sayi('yas', 18, 120, { tam: true }), sayi('kreatinin', 0.1, 30, { lab: 'kreatinin' })],
  cikti: { sayilar: ['egfr'], bantlar: [], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['mL/min/1.73m2'],
  kaynak: 'Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med. 2021;385(19):1737-1749, as published by the National Institute of Diabetes and Digestive and Kidney Diseases (eGFR Equations for Adults).',
  hesapla: (g) => {
    if ((g.cinsiyet !== 'kadin' && g.cinsiyet !== 'erkek') || !sayiMi(g.yas) || !sayiMi(g.kreatinin) || g.yas < 18 || g.kreatinin <= 0) return BOS_SONUC
    // whole numbers, as [NKF-TICKET] asks of a laboratory
    return { tamam: true, sayilar: [{ anahtar: 'egfr', deger: Math.round(usEgfr2021(g.cinsiyet === 'kadin', g.yas, g.kreatinin)), ondalik: 0, birim: 'mL/min/1.73m2' }], bant: null, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 3. pack-years, and the criteria for lung cancer screening ─────────────────────────

/**
 * PACK-YEARS OF SMOKING, and whether the three criteria the CDC lists for yearly lung cancer screening hold.
 *
 * SOURCE: Centers for Disease Control and Prevention, "Screening for Lung Cancer" (page dated May 12, 2026),
 *   https://www.cdc.gov/lung-cancer/screening/index.html — the page gives the recommendation as the U.S. Preventive
 *   Services Task Force's. Screening is for people who have a "20 pack-year or more smoking history", AND smoke now
 *   or have quit within the past 15 years, AND are between 50 and 80 years old. A pack-year is smoking an average of
 *   one pack of cigarettes a day for one year; the page's two examples, one pack a day for 20 years and two packs a
 *   day for 10 years, are each a 20 pack-year history (both are tests). Screening stops when the person turns 81,
 *   has not smoked in 15 or more years, or develops a health problem that makes surgery impossible or unwanted.
 *
 * HOW THE WORDS ARE READ. Between 50 and 80, and stopping at the 81st birthday: ages 50 to 80 in whole years. Quit
 * within the past 15 years, and stopping after 15 or more years without smoking: fewer than 15 years since quitting;
 * exactly 15 no longer holds.
 * Pack-years = packs a day × years smoked, as the two examples show. THE THIRD REASON TO STOP (the health problem) is
 * no number: it is said in the line under the result and decided by the doctor.
 *
 * NOT USED: the task force's own page (read the same day) says its work may not be built into a profit-making venture
 * without written permission of its agency. The CDC's page is the source here; the CDC's material is in the public
 * domain by its own notice (./metinler.ts). FOR A LAWYER: whether a recommendation restated on a CDC page is free of
 * the task force's terms.
 */
export const usPaketYil = (paketGun: number, yil: number): number => paketGun * yil
export const US_PAKET_YIL: AracTanimi = {
  anahtar: 'us-pack-years',
  tur: 'hesap',
  alanlar: [
    sayi('yas', 18, 120, { tam: true }),
    sayi('paket_gun', 0.05, 10),
    sayi('icilen_yil', 0.5, 100),
    secim('durum', ['iciyor', 'birakti']),
    sayi('birakali_yil', 0, 100, { kosul: { alan: 'durum', degerler: ['birakti'] } }),
  ],
  cikti: { sayilar: ['paket_yil'], bantlar: ['karsiliyor', 'karsilamiyor'], uyarilar: ['yas_disinda', 'paket_yil_az', 'birakali_uzun'], tarihler: [] },
  kaynak: 'Centers for Disease Control and Prevention. Screening for Lung Cancer.',
  hesapla: (g) => {
    if (!sayiMi(g.yas) || !sayiMi(g.paket_gun) || !sayiMi(g.icilen_yil) || (g.durum !== 'iciyor' && g.durum !== 'birakti')) return BOS_SONUC
    if (g.durum === 'birakti' && !sayiMi(g.birakali_yil)) return BOS_SONUC
    const paketYil = usPaketYil(g.paket_gun, g.icilen_yil)
    const uyarilar = [
      ...(g.yas < 50 || g.yas > 80 ? ['yas_disinda'] : []),
      ...(paketYil < 20 ? ['paket_yil_az'] : []),
      ...(g.durum === 'birakti' && (g.birakali_yil as number) >= 15 ? ['birakali_uzun'] : []),
    ]
    return { tamam: true, sayilar: [{ anahtar: 'paket_yil', deger: Math.round(paketYil * 10) / 10, ondalik: 1 }], bant: uyarilar.length ? 'karsilamiyor' : 'karsiliyor', uyarilar, tarihler: [] }
  },
}

// ───────────────────────── 4. blood sugar tests: the ranges the CDC prints ─────────────────────────

/**
 * ONE BLOOD SUGAR TEST RESULT against the ranges the CDC prints for that test. A classifier of one number: no
 * diagnosis, no target, no interval.
 *
 * SOURCE: Centers for Disease Control and Prevention, "Diabetes Testing" (May 15, 2024),
 *   https://www.cdc.gov/diabetes/diabetes-testing/index.html — its table, as printed:
 *     A1C                                  normal below 5.7%;           prediabetes 5.7–6.4%;        diabetes 6.5% or above
 *     Fasting blood sugar                  normal 99 mg/dL or below;    prediabetes 100–125 mg/dL;   diabetes 126 mg/dL or above
 *     Glucose tolerance test, 2-hour       normal 140 mg/dL or below;   prediabetes 140–199 mg/dL;   diabetes 200 mg/dL or above
 *     Random blood sugar                   (no range printed)           (no range printed)           diabetes 200 mg/dL or above
 *
 * TWO THINGS THE TABLE LEAVES OPEN, AND WHAT THIS TOOL DOES — BOTH FOR A US CLINICIAN:
 *   - 140 mg/dL at two hours stands in two columns (the normal one ends at it, the prediabetes one begins at it). This tool puts
 *     exactly 140 in the prediabetes range. The task force's statement on screening for prediabetes and type 2
 *     diabetes, read the same day (https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/screening-for-prediabetes-and-type-2-diabetes),
 *     prints that range as 140 to 199 mg/dL as well.
 *   - A value between two printed ranges (an A1C of 6.45%, a fasting value of 99.5 mg/dL) is in the LOWER one: a
 *     range begins at the number printed for its lower end.
 *   - A random value below 200 mg/dL has no category on the page: the tool says so and names none.
 */
export const US_GLUKOZ_TESTLERI = ['a1c', 'aclik', 'ogtt', 'rastgele'] as const
export const US_GLUKOZ_BANTLARI = ['normal', 'prediyabet', 'diyabet', 'rastgele_200_alti'] as const
export function usGlukozBandi(test: (typeof US_GLUKOZ_TESTLERI)[number], deger: number): (typeof US_GLUKOZ_BANTLARI)[number] {
  if (test === 'a1c') return deger >= 6.5 ? 'diyabet' : deger >= 5.7 ? 'prediyabet' : 'normal'
  if (test === 'aclik') return deger >= 126 ? 'diyabet' : deger >= 100 ? 'prediyabet' : 'normal'
  if (test === 'ogtt') return deger >= 200 ? 'diyabet' : deger >= 140 ? 'prediyabet' : 'normal'
  return deger >= 200 ? 'diyabet' : 'rastgele_200_alti'
}
export const US_GLUKOZ: AracTanimi = {
  anahtar: 'us-blood-sugar-ranges',
  tur: 'hesap',
  alanlar: [
    secim('test', US_GLUKOZ_TESTLERI),
    sayi('a1c', 3, 20, { birim: '%', kosul: { alan: 'test', degerler: ['a1c'] } }),
    sayi('glukoz', 20, 1500, { birim: 'mg/dL', kosul: { alan: 'test', degerler: ['aclik', 'ogtt', 'rastgele'] } }),
  ],
  cikti: { sayilar: [], bantlar: [...US_GLUKOZ_BANTLARI], uyarilar: [], tarihler: [] },
  kaynak: 'Centers for Disease Control and Prevention. Diabetes Testing.',
  hesapla: (g) => {
    const test = US_GLUKOZ_TESTLERI.find((t) => t === g.test)
    if (!test) return BOS_SONUC
    const deger = test === 'a1c' ? g.a1c : g.glukoz
    if (!sayiMi(deger) || deger <= 0) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: usGlukozBandi(test, deger), uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 5. fall risk: the three key questions ─────────────────────────

/**
 * FALL-RISK SCREENING of an adult of 65 or older by the three key questions of the CDC's STEADI algorithm.
 *
 * SOURCE: Centers for Disease Control and Prevention, National Center for Injury Prevention and Control, "STEADI:
 *   Algorithm for Fall Risk Screening, Assessment, and Intervention" (2019),
 *   https://www.cdc.gov/steadi/media/pdfs/STEADI-Algorithm-508.pdf — for community-dwelling adults 65 years and
 *   older. Three key questions (feels unsteady when standing or walking; worries about falling; has fallen in the
 *   past year). YES TO ANY ONE = screened at risk; no to all three = screened not at risk.
 *
 * The questions are worded by this pack in its own words (./metinler.ts), not copied. NOT HERE: the twelve-question
 * brochure the algorithm offers as the other way to screen (a score of 4 or more), and everything after the
 * screening step: the page read names the assessments (a timed walk, a chair stand, a balance test) and prints no
 * limit for any of them.
 */
export const US_DUSME_SORULARI = ['dengesiz', 'endise', 'dustu'] as const
export const US_DUSME: AracTanimi = {
  anahtar: 'us-fall-risk-screen',
  tur: 'olcek',
  alanlar: US_DUSME_SORULARI.map((k) => secim(k, EVET_HAYIR)),
  cikti: { sayilar: [], bantlar: ['riskli', 'riskli_degil'], uyarilar: [], tarihler: [] },
  kaynak: 'Centers for Disease Control and Prevention. STEADI: Algorithm for Fall Risk Screening, Assessment, and Intervention. 2019.',
  hesapla: (g) => {
    // all three are answered: a question left open is never read as "no"
    if (!US_DUSME_SORULARI.every((k) => g[k] === 'evet' || g[k] === 'hayir')) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: US_DUSME_SORULARI.some((k) => g[k] === 'evet') ? 'riskli' : 'riskli_degil', uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 6. ECOG performance status ─────────────────────────

/**
 * ECOG PERFORMANCE STATUS: the grade the doctor chooses, recorded. Six grades, 0 to 5, named here BY THEIR NUMBER
 * ONLY: the wording of each grade is not in the product, and the doctor reads it from the scale itself.
 *
 * SOURCE: ECOG-ACRIN Cancer Research Group, "ECOG Performance Status Scale",
 *   https://ecog-acrin.org/resources/ecog-performance-status/ — six grades numbered 0 to 5; the scale "circulates in
 *   the public domain"; the group asks that the scale's name stand above it and its citation and credit line below
 *   (the notice under every result: ./metinler.ts). Published as Oken MM, Creech RH, Tormey DC, Horton J, Davis TE,
 *   McFadden ET, Carbone PP. Toxicity and response criteria of the Eastern Cooperative Oncology Group. Am J Clin
 *   Oncol. 1982;5(6):649-655. The publication itself was not opened: this tool holds none of its wording.
 */
export const US_ECOG_DERECELERI = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'] as const
export const US_ECOG: AracTanimi = {
  anahtar: 'us-ecog-performance-status',
  tur: 'olcek',
  alanlar: [secim('derece', US_ECOG_DERECELERI)],
  cikti: { sayilar: [], bantlar: [...US_ECOG_DERECELERI], uyarilar: [], tarihler: [] },
  kaynak: 'Oken MM, Creech RH, Tormey DC, et al. Am J Clin Oncol. 1982;5(6):649-655.',
  hesapla: (g) => {
    const derece = US_ECOG_DERECELERI.find((d) => d === g.derece)
    return derece ? { tamam: true, sayilar: [], bant: derece, uyarilar: [], tarihler: [] } : BOS_SONUC
  },
}

// ───────────────────────── 7. PHQ-9: the total, and the range the form prints for it ─────────────────────────

/**
 * PHQ-9: nine items, each scored 0 to 3 by the patient on the form; the total, and the label the form prints for it.
 * THE WORDING OF THE ITEMS AND OF THE FOUR ANSWERS IS NOT IN THE PRODUCT: the screen shows "Item 1" to "Item 9", and
 * the doctor enters the score of each from the form in their hand.
 *
 * SOURCES:
 *   [PHQ9-FORM]  The PHQ-9 form as its owner issues it, in the copy the Agency for Healthcare Research and Quality
 *                hosts (form codes A2663B and A2662B, dated 10-04-2005),
 *                https://integrationacademy.ahrq.gov/sites/default/files/2021-09/PHQ-9.pdf — nine items; each box is
 *                worth 0, 1, 2 or 3; the points are added up to the total; "Interpretation of Total Score": 1-4
 *                Minimal depression; 5-9 Mild depression; 10-14 Moderate depression; 15-19 Moderately severe
 *                depression; 20-27 Severe depression. The last question on the form (how difficult the problems
 *                have made things) is not scored and is not part of the total.
 *   [PHQ9-ND]    The same form as issued by the North Dakota Department of Health and Human Services,
 *                https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf — the owner's
 *                permission line (./metinler.ts), and item 9 as the item on thoughts of self-harm.
 *
 * WHAT THE FORM LEAVES OPEN, AND WHAT THIS TOOL DOES — FOR A US CLINICIAN:
 *   - A TOTAL OF 0 has no label on the form (its table begins at 1): the tool shows the total and says so.
 *   - ITEM 9. The form prints no instruction for it. A total can hide it (a total of 3 reads "minimal" whether or not
 *     item 9 is among the points), so the tool says, beside the total, whenever item 9 is scored above 0. It says
 *     nothing else about it: what follows is the clinician's.
 *   - NOT HERE: the unscored last question; any diagnosis; any proposed action (the form read prints none).
 * No worked example is printed on the form: the two ends of every printed range are the test.
 */
export const US_PHQ9_MADDELERI = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'] as const
export const US_PHQ9_BANTLARI = ['sifir', 'minimal', 'hafif', 'orta', 'orta_ileri', 'siddetli'] as const
export const usPhq9Bandi = (toplam: number): (typeof US_PHQ9_BANTLARI)[number] => (toplam <= 0 ? 'sifir' : toplam <= 4 ? 'minimal' : toplam <= 9 ? 'hafif' : toplam <= 14 ? 'orta' : toplam <= 19 ? 'orta_ileri' : 'siddetli')
export const US_PHQ9: AracTanimi = {
  anahtar: 'us-phq-9',
  tur: 'olcek',
  // `numarali`: an item of a published questionnaire, shown by its number; the pack does not word it
  alanlar: US_PHQ9_MADDELERI.map((k) => puan(k, 0, 3, { numarali: true })),
  cikti: { sayilar: ['toplam'], bantlar: [...US_PHQ9_BANTLARI], uyarilar: ['madde9'], tarihler: [] },
  kaynak: 'PHQ-9 (Patient Health Questionnaire-9). Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues.',
  hesapla: (g) => {
    // all nine are scored: an item left open is never counted as 0
    const p = US_PHQ9_MADDELERI.map((k) => g[k])
    if (!p.every((x) => sayiMi(x) && Number.isInteger(x) && x >= 0 && x <= 3)) return BOS_SONUC
    const toplam = (p as number[]).reduce((t, x) => t + x, 0)
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 27 }], bant: usPhq9Bandi(toplam), uyarilar: (g.m9 as number) > 0 ? ['madde9'] : [], tarihler: [] }
  },
}

/** Every mechanism this country brings, in the order the grid shows the tools. */
export const US_TANIMLAR: readonly AracTanimi[] = [US_BMI, US_EGFR, US_PAKET_YIL, US_GLUKOZ, US_DUSME, US_PHQ9, US_ECOG]
