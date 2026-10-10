/**
 * NOTYA-ULKE-UYGULA-CA — Canada: THE MECHANISMS OF THE TOOLS ONLY THIS COUNTRY HAS. Arithmetic only: numbers and
 * keys, never a sentence (the words are in ./metinler.ts). Every key begins with "ca-" and is listed for Canada in
 * countries/yasak-araclar.json, so no other country, no language set and no kit file can name one.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * BOTH TOOLS ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF, by the owner's order of 2026-10-10 ("Bring on all the
 * tools built for the new 6 countries now. We will test as we go."). They stand on the list of such tools
 * (./onayBekleyen.ts) until a clinician of Canada has read them.
 *
 * THE RULE THIS FILE WAS WRITTEN UNDER. Every factor, formula and constant below is as its source prints it, and
 * each source was OPENED ON 2026-10-10 through a tool that returns the text of a page. Nothing is from memory. The
 * source stands beside the code; its own figures are the tests (./yeniAraclar.test.ts). A clinician opens each source
 * again. The limits a field may be typed in (`sayi(key, least, most)`) are input limits of the screen and say nothing
 * clinical, except where a line says the source states them.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, sayi, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'

// ───────────────────────── 1. unit converter: pounds, feet and inches ─────────────────────────

/**
 * POUNDS INTO KILOGRAMS, FEET AND INCHES INTO CENTIMETRES, by the definitions of Canadian law.
 *
 * SOURCES:
 *   [W-6]   Weights and Measures Act, R.S.C., 1985, c. W-6, Schedule II, "Canadian Units of Measurement" (current to
 *           2026-06-21; last amended 2021-04-19), https://laws-lois.justice.gc.ca/eng/acts/W-6/page-7.html —
 *           Measurement of length: the yard is 9 144/10 000 of a metre, the foot 1/3 of a yard, the inch 1/36 of a
 *           yard. Measurement of mass or weight: the pound is 45 359 237/100 000 000 of a kilogram.
 *   [ISMP]  ISMP Canada, SafeMedicationUse.ca newsletter "Know and Share Your Weight in Kilograms" (2017-05-10),
 *           https://safemedicationuse.ca/newsletter/newsletter_WeightKg.html — why the tool exists: a child's weight
 *           given as "18" was taken for pounds; the child weighed 18 kilograms, which the page gives as 40 pounds.
 *
 * So: 1 lb = 0.45359237 kg; 1 yd = 0.9144 m, hence 1 ft = 30.48 cm and 1 in = 2.54 cm. Each is exact, and each is the
 * constant the kit converts with (lib/ulke/araclar/birimler.ts): the test holds the two to each other.
 *
 * NOT HERE: degrees Fahrenheit. The audit proposed them; Schedule II defines no unit of temperature, and no official
 * Canadian page that prints the relation was opened (one search, none found). Ounces and stones are not here either:
 * the audit did not ask for them.
 *
 * HOW A HEIGHT IS READ. Feet and inches together (the inches below 12, and typed: "5 feet" with the inches left empty
 * is NOT read as 5 feet 0 inches), or inches alone as the whole height. A part that cannot be read gives no result
 * at all: a weight is never shown beside a height that was left half typed.
 */
export const CA_LB_KG = 45359237 / 100000000
export const CA_FT_CM = 9144 / 300
export const CA_IN_CM = 9144 / 3600
export const CA_BIRIM_CEVIRICI: AracTanimi = {
  anahtar: 'ca-unit-converter',
  tur: 'hesap',
  alanlar: [
    sayi('agirlik_lb', 0, 1500, { birim: 'lb', istege: true }),
    sayi('boy_ft', 0, 9, { birim: 'ft', tam: true, istege: true }),
    sayi('boy_in', 0, 120, { birim: 'in', istege: true }),
  ],
  cikti: { sayilar: ['kg', 'cm'], bantlar: [], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['kg', 'cm'],
  kaynak: 'Weights and Measures Act, R.S.C., 1985, c. W-6, Schedule II (Canadian Units of Measurement).',
  hesapla: (g) => {
    const lb = sayiMi(g.agirlik_lb), ft = sayiMi(g.boy_ft), inc = sayiMi(g.boy_in)
    if (!lb && !ft && !inc) return BOS_SONUC
    // feet without inches, or feet with 12 inches or more: not a height this tool reads
    if (ft && (!inc || (g.boy_in as number) >= 12)) return BOS_SONUC
    if ((lb && (g.agirlik_lb as number) < 0) || (ft && (g.boy_ft as number) < 0) || (inc && (g.boy_in as number) < 0)) return BOS_SONUC
    const sayilar = [
      ...(lb ? [{ anahtar: 'kg', deger: (g.agirlik_lb as number) * CA_LB_KG, ondalik: 2, anlamli: 3, birim: 'kg' }] : []),
      ...(inc ? [{ anahtar: 'cm', deger: (ft ? (g.boy_ft as number) * CA_FT_CM : 0) + (g.boy_in as number) * CA_IN_CM, ondalik: 1, birim: 'cm' }] : []),
    ]
    return { tamam: true, sayilar, bant: null, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 2. estimated GFR, CKD-EPI 2021 (creatinine) ─────────────────────────

/**
 * ESTIMATED GLOMERULAR FILTRATION RATE from serum creatinine, age and sex: the 2021 CKD-EPI creatinine equation.
 *
 * WHY IN CANADA (read 2026-10-10):
 *   [APL]         Alberta Precision Laboratories, Clinical Biochemistry, laboratory bulletin of 19 January 2026,
 *                 "Estimated Glomerular Filtration Rate (eGFR) Calculation Update for Adult Patients",
 *                 https://albertahealthservices.ca/assets/wf/lab/if-lab-hp-bulletin-2026-01-19-estimated-glomerular-filtration-rate-egfr-calculation-update-for-adult-patients.pdf
 *                 — from 20 January 2026 the 2021 CKD-EPI equation for adult patients (18 years and over); the
 *                 bulletin says the change is supported by several committees and names the Canadian Society of
 *                 Nephrology among them; the equation is "not validated for use in children or pregnant women". The bulletin names the equation
 *                 and does not print it. ONE PROVINCE'S LABORATORY: which equation the laboratories of the other
 *                 provinces report was not read, and the tool says so on its screen.
 *   [CMAJ]        Parekh RS, Perl J, Auguste B, Sood MM. Elimination of race in estimates of kidney function to
 *                 provide unbiased clinical management in Canada. CMAJ. 2022;194(11):E421-E423,
 *                 https://www.cmaj.ca/content/194/11/E421 — calls for the new equations in clinical practice in
 *                 Canada. It does not print the equation either.
 *
 * THE EQUATION (read 2026-10-10):
 *   [NIDDK-EGFR]  National Institute of Diabetes and Digestive and Kidney Diseases, "eGFR Equations for Adults"
 *                 (last reviewed May 2025), https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults
 *                 — as printed: eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^-1.200 × 0.9938^Age × 1.012 [if female];
 *                 κ = 0.7 (female), 0.9 (male); α = -0.241 (female), -0.302 (male); SCr is standardized serum
 *                 creatinine in mg/dL; the result is in mL/min/1.73 m²; for ages 18 and older. For SI units the page
 *                 gives one line: a serum creatinine in µmol/L is divided by 88.4 to give mg/dL. It prints no worked
 *                 example and no rounding rule.
 *   [NKF-TICKET]  National Kidney Foundation, "Example IT ticket: implement 2021 CKD-EPI equation to calculate eGFR
 *                 from creatinine", https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf
 *                 — the same four cases of the equation; the result in whole numbers; under 18 years nothing is
 *                 calculated; and EIGHT TEST CASES, which are this tool's test: age 18, male, 0.90 mg/dL = 127 and
 *                 0.91 = 125; age 18, female, 0.70 = 128 and 0.71 = 126; age 90, male, 0.50 = 97 and 1.50 = 44;
 *                 age 90, female, 0.50 = 89 and 1.50 = 33.
 *
 * CREATININE IN µmol/L. Laboratories here report it in µmol/L (the pack's own statement, ../ayarlar.ts →
 * labBirimleri.kreatinin, unverified province by province). The field is the kit's creatinine quantity: the number
 * typed in µmol/L is divided by 88.4 before the equation sees it (lib/ulke/araclar/birimler.ts), which is the one
 * conversion [NIDDK-EGFR] prints.
 *
 * WHAT IS NOT HERE, each because no source read supplies it: the equation with cystatin C (no test case on a page
 * read); a GFR category, a stage or any other band; a referral rule (provincial: the audit read two provinces with
 * two different lists); the laboratory's reportable range ([NKF-TICKET] gives one for a laboratory report, to be
 * approved by the laboratory's director, which is not what this is). The value is an estimate: [NIDDK-EGFR] says it
 * "is not a precise measure of kidney function".
 */
export const caEgfr2021 = (kadin: boolean, yas: number, kreatininMgDl: number): number => {
  const kappa = kadin ? 0.7 : 0.9
  const alfa = kadin ? -0.241 : -0.302
  const oran = kreatininMgDl / kappa
  return 142 * Math.pow(Math.min(oran, 1), alfa) * Math.pow(Math.max(oran, 1), -1.2) * Math.pow(0.9938, yas) * (kadin ? 1.012 : 1)
}
export const CA_EGFR: AracTanimi = {
  anahtar: 'ca-egfr-ckd-epi-2021',
  tur: 'hesap',
  // age 18 and over is the source's ([NIDDK-EGFR], [NKF-TICKET], [APL]); creatinine is typed in the unit the pack states for it (µmol/L here)
  alanlar: [secim('cinsiyet', ['kadin', 'erkek']), sayi('yas', 18, 120, { tam: true }), sayi('kreatinin', 0.1, 30, { lab: 'kreatinin' })],
  cikti: { sayilar: ['egfr'], bantlar: [], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['mL/min/1.73m2'],
  kaynak: 'Inker, Eneanya, Coresh, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749, as published by the National Institute of Diabetes and Digestive and Kidney Diseases (eGFR Equations for Adults).',
  hesapla: (g) => {
    if ((g.cinsiyet !== 'kadin' && g.cinsiyet !== 'erkek') || !sayiMi(g.yas) || !sayiMi(g.kreatinin)) return BOS_SONUC
    // under 18 years nothing is calculated ([NKF-TICKET]); a creatinine of zero or less is not a result
    if (!Number.isInteger(g.yas) || g.yas < 18 || g.kreatinin <= 0) return BOS_SONUC
    const egfr = caEgfr2021(g.cinsiyet === 'kadin', g.yas, g.kreatinin)
    if (!Number.isFinite(egfr)) return BOS_SONUC
    // whole numbers, as [NKF-TICKET] reports the result
    return { tamam: true, sayilar: [{ anahtar: 'egfr', deger: Math.round(egfr), ondalik: 0, birim: 'mL/min/1.73m2' }], bant: null, uyarilar: [], tarihler: [] }
  },
}

/** The mechanisms of the tools only this country has, in the order the grid shows them. */
export const CA_TANIMLAR: readonly AracTanimi[] = [CA_BIRIM_CEVIRICI, CA_EGFR]
