/**
 * NOTYA-ULKE-UYGULA-NZ — New Zealand: THE MECHANISMS OF THE TOOLS ONLY THIS COUNTRY HAS. Country-neutral in form
 * (fields, pure arithmetic that returns numbers and keys, the citation); every word a doctor reads is in ./araclar.ts.
 * No other country can reach this folder (wall rule D3), and every key below is listed for New Zealand in
 * countries/yasak-araclar.json (wall rule D7).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * EVERY NUMBER BELOW WAS READ FROM ITS SOURCE ON 2026-10-10, through a reading tool that returns the text of a
 * page, and is cited beside the line that uses it. Nothing here is written from memory. NO CLINICIAN OF NEW
 * ZEALAND HAS READ ANY OF IT: the three tools are switched on by the owner's order of 2026-10-10 ("Bring on all
 * the tools ... We will test as we go") and are listed in ./onaysiz.ts as switched on WITHOUT a clinician's
 * sign-off. A clinician opens each source again before relying on the tool.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 *   nz-bmi-waist        body mass index, its class, and the waist figures of the adult weight-management guideline
 *   nz-smoking-abc      a record of the three steps of the stop-smoking guidelines (no score, no number)
 *   nz-psa-thresholds   a PSA result against the guidance's abnormal level for the man's age, and the row of its
 *                       referral table that the entries match
 *
 * WHAT IS DELIBERATELY NOT HERE (docs/araclar-denetim/NZ.md): no "meets the funding criteria" answer of any kind (a
 * payer tool); nothing that takes ethnicity or a deprivation score (the patient file holds neither); no instrument
 * whose rights holder asks for permission.
 */
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, isaret, kontrolListesi, metin, sayi, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'

// ───────────────────────── nz-bmi-waist ─────────────────────────

/**
 * SOURCE (OPENED 2026-10-10, read twice): Ministry of Health. 2017. Clinical Guidelines for Weight Management in New
 * Zealand Adults. Wellington: Ministry of Health. ISBN 978-1-98-853916-4 (online).
 * https://health.govt.nz/system/files/2017-11/clinical-guidelines-for-weight-management-in-new-zealand-adultsv2.pdf
 * Licence, as the document itself states: Creative Commons Attribution 4.0 International.
 *
 * WHAT THE SOURCE PRINTS, and what is built from it:
 *   - the index: "a simple weight to height ratio (kg/m²)" — weight in kilograms divided by the square of the
 *     height in metres;
 *   - Table 2, classification by BMI (kg/m²): underweight below 18.5; normal weight 18.5–24.9; overweight
 *     25.0–29.9; obese class I 30.0–34.9, class II 35.0–39.9, class III ≥ 40.0;
 *   - Table 2, its waist-circumference columns: men 94–102 cm and > 102 cm; women 80–88 cm and > 88 cm; and the
 *     text: disease risk is considered high above 88 cm for women and above 102 cm for men.
 *
 * THREE DECISIONS OF THIS IMPLEMENTATION, EACH FOR A LOCAL CLINICIAN:
 *   1. THE CLASS IS READ FROM THE INDEX ROUNDED TO ONE DECIMAL PLACE, which is also the figure shown. The table
 *      prints its limits to one place (24.9, then 25.0), so only a rounded figure always falls in a class.
 *   2. THE LOWER WAIST FIGURE IS INCLUSIVE (a man's waist of exactly 94 cm, a woman's of exactly 80 cm, is in the
 *      lower band), as the table's column prints the range (94–102); a sentence of the text says over 94 and 80.
 *      The more cautious of the two readings was taken. The upper figure is exclusive in both places.
 *   3. THE TABLE'S DISEASE-RISK WORDS PER CELL (increased, high, very high …) ARE NOT REPRODUCED: the text the reading
 *      tool returned does not show which word stands under which waist column. The tool names the waist band only.
 * NOT TAKEN FROM THE SOURCE, because the source states no figure for it: an age limit of adulthood (the patient gate
 * in ./araclar.ts rests on the companion guideline for children and young people, which covers ages 2 to 18).
 * ETHNICITY: the guideline discusses cut-off points for Māori, Pacific and Asian peoples; this tool takes no
 * ethnicity and applies one set of figures (docs/araclar-denetim/NZ.md reports what the guideline says).
 * The source prints NO worked example; the tests use the table's own limits and one worked example of a New Zealand
 * health-information page (./araclar.test.ts says which, and where it differs by 0.1).
 */
export const NZ_BMI = {
  /** Table 2: below this, underweight. */
  zayifAlti: 18.5,
  /** Table 2: the highest index of each class, as printed to one decimal place; above the last, class III (40.0 or more). */
  normalUst: 24.9,
  fazlaKiloluUst: 29.9,
  obez1Ust: 34.9,
  obez2Ust: 39.9,
  /** Table 2, waist circumference in centimetres: the lower band begins AT `alt`, the upper band is ABOVE `ust`. */
  bel: { erkek: { alt: 94, ust: 102 }, kadin: { alt: 80, ust: 88 } },
} as const

/** The index as it is shown and classified: kilograms over metres squared, to one decimal place. */
export const nzBmi = (kg: number, cm: number): number => Math.round((kg / ((cm / 100) * (cm / 100))) * 10) / 10

/** The class of Table 2 for an index already rounded to one decimal place. */
export function nzBmiSinifi(bmi: number): 'zayif' | 'normal' | 'fazla_kilolu' | 'obez_1' | 'obez_2' | 'obez_3' {
  if (bmi < NZ_BMI.zayifAlti) return 'zayif'
  if (bmi <= NZ_BMI.normalUst) return 'normal'
  if (bmi <= NZ_BMI.fazlaKiloluUst) return 'fazla_kilolu'
  if (bmi <= NZ_BMI.obez1Ust) return 'obez_1'
  if (bmi <= NZ_BMI.obez2Ust) return 'obez_2'
  return 'obez_3'
}

export const NZ_BMI_WAIST: AracTanimi = {
  anahtar: 'nz-bmi-waist',
  tur: 'hesap',
  alanlar: [
    sayi('kilo', 20, 400, { olcu: 'agirlik' }),
    sayi('boy', 100, 250, { olcu: 'boy' }),
    // The waist is optional. Its figures differ for men and women, so a waist WITHOUT the sex gives no result at all:
    // a missing input is never read as a reassuring one.
    sayi('bel', 30, 300, { olcu: 'boy', istege: true }),
    secim('cinsiyet', ['kadin', 'erkek'], true),
  ],
  cikti: { sayilar: ['bmi'], bantlar: ['zayif', 'normal', 'fazla_kilolu', 'obez_1', 'obez_2', 'obez_3'], uyarilar: ['bel_alt_bant', 'bel_ust_bant'], tarihler: [] },
  sonucBirimleri: ['kg/m2'],
  kaynak: 'Ministry of Health. 2017. Clinical Guidelines for Weight Management in New Zealand Adults. Wellington: Ministry of Health.',
  hesapla: (g) => {
    if (!sayiMi(g.kilo) || !sayiMi(g.boy) || g.boy <= 0) return BOS_SONUC
    const belVar = sayiMi(g.bel)
    const sinir = g.cinsiyet === 'erkek' ? NZ_BMI.bel.erkek : g.cinsiyet === 'kadin' ? NZ_BMI.bel.kadin : null
    if (belVar && !sinir) return BOS_SONUC
    const bmi = nzBmi(g.kilo, g.boy)
    const uyarilar = belVar && sinir ? ((g.bel as number) > sinir.ust ? ['bel_ust_bant'] : (g.bel as number) >= sinir.alt ? ['bel_alt_bant'] : []) : []
    return { tamam: true, sayilar: [{ anahtar: 'bmi', deger: bmi, ondalik: 1, birim: 'kg/m2' }], bant: nzBmiSinifi(bmi), uyarilar, tarihler: [] }
  },
}

// ───────────────────────── nz-smoking-abc ─────────────────────────

/**
 * SOURCE (OPENED 2026-10-10, read twice): Ministry of Health. 2021. The New Zealand Guidelines for Helping People to
 * Stop Smoking: 2021 Update. Wellington: Ministry of Health. ISBN 978-1-99-100741-4 (online).
 * https://health.govt.nz/system/files/2014-06/the-new-zealand-guidelines-for-helping-people-to-stop-smoking-2021.pdf
 * Licence, as the document itself states: Creative Commons Attribution 4.0 International.
 *
 * WHAT THE SOURCE PRINTS: its ABC pathway as three bullets — ask about and document every person's smoking status;
 * give brief advice to stop to every person who smokes; strongly encourage every person who smokes to use cessation
 * support and offer help to access it, and refer to, or provide, that support to everyone who accepts. It names no
 * questionnaire and no score, and no interval for asking again.
 *
 * WHAT IS BUILT: A RECORD. Three ticks for the three steps and a fourth for the second sentence of the third bullet
 * (the person accepted and was referred or given support); the status itself in the doctor's own words. No number is
 * worked out, nothing is interpreted, and the tool proposes no date.
 */
export const NZ_SMOKING_ABC: AracTanimi = kontrolListesi({
  anahtar: 'nz-smoking-abc',
  maddeler: ['soruldu', 'kisa_tavsiye', 'destek_onerildi', 'destek_saglandi'],
  ek: [metin('durum')],
  kaynak: 'Ministry of Health. 2021. The New Zealand Guidelines for Helping People to Stop Smoking: 2021 Update. Wellington: Ministry of Health.',
})

// ───────────────────────── nz-psa-thresholds ─────────────────────────

/**
 * SOURCE (OPENED 2026-10-10, read three times): Ministry of Health. 2015. Prostate Cancer Management and Referral
 * Guidance. Wellington: Ministry of Health (published September 2015).
 * https://www.health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf
 * Licence, as the document itself states: Creative Commons Attribution 4.0 International.
 *
 * WHAT THE SOURCE PRINTS, and what is built from it:
 *   TABLE 1, the abnormal PSA level in µg/L by age group:
 *       men aged ≤ 70 years   ≥ 4.0        men aged 71–75 years   ≥ 10.0        men aged ≥ 76 years   ≥ 20.0
 *   NOTE 2.2: a raised result is confirmed by a repeat test after 6 to 12 weeks; the exceptions are a raised PSA
 *       with an abnormal digital rectal examination, or with one of the red flags.
 *   TABLE 3, the criteria for referral to a urology or radiation oncology service — eight lines in three groups:
 *       Immediate referral (should be seen within 24 hours)
 *         1  PSA ≥ 10 µg/L AND severe back pain AND acute neurological symptoms (cord or cauda equina compression)
 *       Urgent referral (should be seen within 14 days)
 *         2  PSA ≥ 10 µg/L AND renal failure
 *         3  PSA ≥ 10 µg/L AND bone pain (new onset, progressive and severe)
 *         4  PSA ≥ 10 µg/L AND macroscopic haematuria
 *         5  PSA ≥ 10 µg/L AND the prostate feels hard and/or irregular on digital rectal examination
 *       Routine referral (should be seen within 6–8 weeks)
 *         6  PSA between 4 and 10 µg/L AND macroscopic haematuria (in the absence of infection)
 *         7  PSA < 10 µg/L AND the prostate feels hard and/or irregular on digital rectal examination
 *         8  two clearly abnormal PSA results 6–12 weeks apart (abnormal as Table 1 defines it)
 *
 * THE TOOL ANSWERS TWO THINGS AND NOTHING ELSE: whether the result is at or above Table 1's level for the age typed
 * (the band), and WHICH GROUP OF TABLE 3 the entries match — the most urgent one, where more than one line matches.
 * Entries that match no line raise nothing: that is not a finding, and the tool never says that no referral is needed.
 *
 * TWO DECISIONS OF THIS IMPLEMENTATION, EACH FOR A LOCAL UROLOGIST:
 *   1. LINE 6, PSA between 4 and 10: read as 4.0 or more and below 10 (at 10 and above, line 4 applies; the table does
 *      not say on which side exactly 4 falls, and Table 1 calls 4.0 abnormal).
 *   2. LINE 8 is a tick the doctor makes: the tool is handed one result and cannot see two.
 * The guidance states NO rate of change of PSA. The source prints no worked example; the tests walk every row of
 * both tables with the tables' own figures (./araclar.test.ts).
 */
export const NZ_PSA = {
  /** Table 1: [oldest age of the band in whole years (null = no upper end), the level from which a result is abnormal, in µg/L]. */
  yasBantlari: [[70, 4.0], [75, 10.0], [null, 20.0]] as readonly (readonly [number | null, number])[],
  /** Table 3: the level from which the immediate and urgent lines apply, and below which line 7 applies. */
  yuksek: 10,
  /** Table 3, line 6: the lower end of its range of 4 to 10. */
  hematuriAlt: 4,
} as const

/** Table 1: the abnormal level for a man of this age in whole years, in µg/L. */
export const nzPsaEsigi = (yas: number): number => NZ_PSA.yasBantlari.find(([ust]) => ust === null || yas <= ust)![1]

export const NZ_PSA_THRESHOLDS: AracTanimi = {
  anahtar: 'nz-psa-thresholds',
  tur: 'hesap',
  alanlar: [
    sayi('yas', 0, 130, { tam: true, birim: 'yil' }),
    sayi('psa', 0, 1000, { lab: 'psa' }),
    isaret('dre_anormal'), isaret('sirt_noro'), isaret('bobrek_yetmezligi'), isaret('kemik_agrisi'), isaret('hematuri'), isaret('iki_anormal'),
  ],
  cikti: { sayilar: ['esik'], bantlar: ['anormal', 'esik_alti'], uyarilar: ['sevk_hemen', 'sevk_ivedi', 'sevk_rutin', 'tekrar'], tarihler: [] },
  // The level of Table 1 is written in µg/L, the unit the guidance prints and the one this pack states for PSA.
  sonucBirimleri: ['ug/L'],
  kaynak: 'Ministry of Health. 2015. Prostate Cancer Management and Referral Guidance. Wellington: Ministry of Health.',
  hesapla: (g) => {
    if (!sayiMi(g.yas) || !Number.isInteger(g.yas) || !sayiMi(g.psa)) return BOS_SONUC
    const esik = nzPsaEsigi(g.yas)
    const anormal = g.psa >= esik
    const dre = g.dre_anormal === true, hematuri = g.hematuri === true
    // the four red flags of the guidance (its Table 2), as the form has them
    const kirmiziBayrak = g.sirt_noro === true || g.bobrek_yetmezligi === true || g.kemik_agrisi === true || hematuri
    const yuksek = g.psa >= NZ_PSA.yuksek
    let sevk: string | null = null
    if (yuksek && g.sirt_noro === true) sevk = 'sevk_hemen' // line 1
    else if (yuksek && (g.bobrek_yetmezligi === true || g.kemik_agrisi === true || hematuri || dre)) sevk = 'sevk_ivedi' // lines 2 to 5
    else if ((g.psa >= NZ_PSA.hematuriAlt && !yuksek && hematuri) || (!yuksek && dre) || g.iki_anormal === true) sevk = 'sevk_rutin' // lines 6 to 8
    // Note 2.2: a raised result is repeated after 6 to 12 weeks to confirm it — unless the examination is abnormal or a
    // red flag is present. Not said again once the doctor has ticked that two results stand.
    const tekrar = anormal && !dre && !kirmiziBayrak && g.iki_anormal !== true
    return { tamam: true, sayilar: [{ anahtar: 'esik', deger: esik, ondalik: 1, birim: 'ug/L' }], bant: anormal ? 'anormal' : 'esik_alti', uyarilar: [...(sevk ? [sevk] : []), ...(tekrar ? ['tekrar'] : [])], tarihler: [] }
  },
}

export const NZ_TANIMLAR: readonly AracTanimi[] = [NZ_BMI_WAIST, NZ_SMOKING_ABC, NZ_PSA_THRESHOLDS]
