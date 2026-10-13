/**
 * NOTYA-ULKE-UYGULA-AU — Australia: THE MECHANISMS OF THE TOOLS ONLY AUSTRALIA HAS. Arithmetic only: numbers and keys,
 * never a sentence. Each key carries the country's code ("au-…") and is listed for Australia in
 * countries/yasak-araclar.json, so no other country, no language set and no kit file can name one (wall rule D7).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * THE RULE THIS FILE WAS WRITTEN UNDER. A tool is here only if (1) its rights holder's OWN notice says it may be used
 * freely and that notice was read in the session that wrote it, and (2) the source that defines its arithmetic was
 * opened in the same session. Every number below stands beside the page it was read on, with the date. Nothing was
 * written from memory. NO CLINICIAN OF AUSTRALIA HAS READ ANY OF IT: every tool here is on the list of tools switched
 * on without a clinician's sign-off (./onaysizAciklar.ts).
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Three tools, each from the proposals of the audit (docs/araclar-denetim/au-kararlar.json, `addTools`):
 *   au-mental-health-screen   the total of the K10 and the score group the Australian Bureau of Statistics uses
 *   au-body-size              body mass index of an adult, and the waist measurement against two limits
 *   au-oncology-grading       a record of the ECOG performance status grade the doctor assessed
 */
import type { AracSayisi, AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, puan, sayi, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'

// ───────────────────────── 1. K10: the total score ─────────────────────────

/**
 * KESSLER PSYCHOLOGICAL DISTRESS SCALE (K10): the ten answers added up.
 *
 * LICENCE, the owner's own page, read 2026-10-10 — Ronald C. Kessler (Harvard Medical School), "K10 and K6 Scales",
 *   https://rckessler.scholars.harvard.edu/k10-and-k6-scales: "Use of the K6 and K10 is free and does not require any
 *   formal permission or approval." The page asks that the article be cited (Kessler RC, Barker PR, et al. Screening
 *   for serious mental illness in the general population. Arch Gen Psychiatry 2003;60(2):184-189) and that the
 *   copyright line be shown: both stand under every result (../araclar/metinler.ts → `lisans.bildirim`).
 * SCORING, the official Australian specification, read 2026-10-10 — Australian Bureau of Statistics, Information Paper
 *   4817.0.55.001, "Use of the Kessler Psychological Distress Scale in ABS Health Surveys, Australia, 2007-08",
 *   chapter "K10 Scoring" (released 4 April 2012),
 *   https://www.abs.gov.au/ausstats/abs@.nsf/lookup/4817.0.55.001chapter92007-08:
 *     - each answer is scored on five levels, from "none of the time" = 1 to "all of the time" = 5;
 *     - the minimum total is 10 and the maximum is 50;
 *     - the ABS groups the total into four levels: 10–15 low, 16–21 moderate, 22–29 high, 30–50 very high;
 *     - the same page prints OTHER groupings used in Australia (for primary care: 10–19, 20–24, 25–29, 30–50). The
 *       tool shows ONE, the Bureau's own, and its words say whose it is and that others exist.
 *     - a cross-check the page itself prints (a test holds it): where a survey scored the answers the other way round,
 *       the same four groups are 45–50, 39–44, 31–38 and 10–30.
 * NOT OPENED: the owner's own scoring sheet and the self-administered form (the reading tool would not fetch either
 *   address). So THE ITEMS ARE NOT WORDED HERE: each is a numbered field (`numarali`) and the doctor reads the item
 *   from the K10 form the patient filled in. No age limit was read on either page, and none is set.
 */
export const K10_MADDELERI = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'] as const
export const K10_GRUPLARI = ['dusuk', 'orta', 'yuksek', 'cok_yuksek'] as const
/** The Bureau's four groups over the total (10–15, 16–21, 22–29, 30–50). */
export const k10Grubu = (toplam: number): (typeof K10_GRUPLARI)[number] => (toplam <= 15 ? 'dusuk' : toplam <= 21 ? 'orta' : toplam <= 29 ? 'yuksek' : 'cok_yuksek')
export const AU_K10: AracTanimi = {
  anahtar: 'au-mental-health-screen',
  tur: 'olcek',
  alanlar: K10_MADDELERI.map((k) => puan(k, 1, 5, { numarali: true })),
  cikti: { sayilar: ['toplam'], bantlar: [...K10_GRUPLARI], uyarilar: [], tarihler: [] },
  kaynak: 'Kessler RC, Barker PR, et al. Arch Gen Psychiatry 2003;60(2):184-189. Score groups: Australian Bureau of Statistics, Information Paper 4817.0.55.001 (2012), chapter "K10 Scoring".',
  hesapla: (g) => {
    const p = K10_MADDELERI.map((k) => g[k])
    // ALL TEN OR NOTHING: an item left empty is never counted as "none of the time".
    if (!p.every((x): x is number => sayiMi(x) && Number.isInteger(x) && x >= 1 && x <= 5)) return BOS_SONUC
    const toplam = p.reduce((a, b) => a + b, 0)
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 50 }], bant: k10Grubu(toplam), uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 2. Body mass index and waist measurement (adults) ─────────────────────────

/**
 * BODY MASS INDEX of an adult, and the waist measurement against the two limits printed for each sex.
 *
 * LICENCE, the rights holder's own page, read 2026-10-10 — Australian Institute of Health and Welfare, "Copyright"
 *   (last updated 11/08/2023), https://www.aihw.gov.au/copyright: material on the site is "released under a Creative
 *   Commons BY 4.0 (CC-BY 4.0) licence"; where it is modified the Institute asks for the line "Based on Australian
 *   Institute of Health and Welfare material." — it stands under every result (../araclar/metinler.ts).
 * THE ARITHMETIC AND THE LIMITS, read 2026-10-10 — AIHW, "Risk factors to health: Overweight and obesity",
 *   https://www.aihw.gov.au/reports/risk-factors/risk-factors-to-health/contents/overweight-and-obesity:
 *     - "Your BMI is your body weight in kilograms, divided by the square of your height in meters."
 *     - its worked example (a test): 75 kg and 175 cm give 24.5;
 *     - adults: less than 18.5 underweight; 18.5 to less than 25 normal weight range; 25 to less than 30 overweight;
 *       30 or more obese;
 *     - the index "can be used for both men and women, aged 18 or older" — so the tool is gated to patients of 18
 *       and over (the pack states the gate and its sentence);
 *     - waist: men 94 cm (increased risk) and 102 cm (substantially increased risk); women 80 cm and 88 cm; and the
 *       page says whom the figures are for: Caucasian men, and Caucasian and Asian women. The pack's words repeat that.
 *   WHICH SIDE THE LIMIT ITSELF FALLS ON is not on that table. Read 2026-10-10 on the Department of Health, Disability
 *   and Ageing's page "Body mass index (BMI) and waist measurement",
 *   https://www.health.gov.au/topics/overweight-and-obesity/bmi-and-waist: "94 cm or more", "102 cm or more",
 *   "80 cm or more", "88 cm or more". So a waist AT the limit is past it.
 * ONE CHOICE OF THIS FILE, for a clinician: the index is rounded to one decimal place — the precision both pages print
 *   (the Department's table runs "18.5 to 24.9", "25 to 29.9") — and the class is read from the rounded figure, so the
 *   number on the screen and the class beside it can never disagree. Neither page states a rounding rule.
 * NOT IN THE TOOL: the Department's three classes of obesity (its page's copyright notice could not be read: the site
 *   refuses automated readers); lower limits for people of particular backgrounds (the RACGP's preventive-care
 *   guideline gives some, per the audit; not opened in this session); children (another classification); pregnancy.
 */
export const BMI_SINIFLARI = ['zayif', 'normal', 'fazla', 'obez'] as const
export const bmiSinifi = (bmi: number): (typeof BMI_SINIFLARI)[number] => (bmi < 18.5 ? 'zayif' : bmi < 25 ? 'normal' : bmi < 30 ? 'fazla' : 'obez')
/** The two waist limits for each sex, in centimetres: "increased risk" and "substantially increased risk" from this measurement upward. */
export const BEL_SINIRLARI = { erkek: { artmis: 94, cok_artmis: 102 }, kadin: { artmis: 80, cok_artmis: 88 } } as const
const ondaBir = (x: number) => Math.round(x * 10) / 10
export const AU_BEDEN: AracTanimi = {
  anahtar: 'au-body-size',
  tur: 'hesap',
  alanlar: [
    sayi('agirlik', 20, 400, { olcu: 'agirlik' }),
    sayi('boy', 100, 250, { olcu: 'boy' }),
    secim('cinsiyet', ['erkek', 'kadin'], true),
    // the waist is read against a limit of the patient's sex: the field is there only once the sex is chosen
    sayi('bel', 30, 250, { olcu: 'boy', istege: true, kosul: { alan: 'cinsiyet', degerler: ['erkek', 'kadin'] } }),
  ],
  cikti: { sayilar: ['bmi', 'bel'], bantlar: [...BMI_SINIFLARI], uyarilar: ['bel_artmis_erkek', 'bel_cok_artmis_erkek', 'bel_artmis_kadin', 'bel_cok_artmis_kadin'], tarihler: [] },
  sonucBirimleri: ['kg/m2'],
  sonucOlculeri: ['boy'],
  kaynak: 'Australian Institute of Health and Welfare, "Risk factors to health: Overweight and obesity".',
  hesapla: (g) => {
    if (!sayiMi(g.agirlik) || !sayiMi(g.boy) || g.agirlik <= 0 || g.boy <= 0) return BOS_SONUC
    const metre = g.boy / 100
    const bmi = ondaBir(g.agirlik / (metre * metre))
    const sayilar: AracSayisi[] = [{ anahtar: 'bmi', deger: bmi, ondalik: 1, birim: 'kg/m2' }]
    const uyarilar: string[] = []
    if (sayiMi(g.bel) && (g.cinsiyet === 'erkek' || g.cinsiyet === 'kadin')) {
      const sinir = BEL_SINIRLARI[g.cinsiyet]
      sayilar.push({ anahtar: 'bel', deger: g.bel, ondalik: 1, olcu: 'boy' })
      if (g.bel >= sinir.cok_artmis) uyarilar.push(`bel_cok_artmis_${g.cinsiyet}`)
      else if (g.bel >= sinir.artmis) uyarilar.push(`bel_artmis_${g.cinsiyet}`)
    }
    return { tamam: true, sayilar, bant: bmiSinifi(bmi), uyarilar, tarihler: [] }
  },
}

// ───────────────────────── 3. ECOG performance status: a record of the grade ─────────────────────────

/**
 * ECOG PERFORMANCE STATUS: the grade the doctor assessed, recorded. The tool works nothing out.
 *
 * LICENCE AND SPECIFICATION, the group's own page, read 2026-10-10 — ECOG-ACRIN Cancer Research Group, "ECOG
 *   Performance Status Scale", https://ecog-acrin.org/scale: "The ECOG Performance Status Scale circulates in the
 *   public domain and is therefore available for public use." The page asks for the scale's name, its citation (Oken
 *   MM, Creech RH, Tormey DC, et al. Am J Clin Oncol 1982) and a credit to the group: they stand under every result.
 *   The scale has six grades, 0 to 5.
 * WHY IN AUSTRALIA, read 2026-10-10 — Cancer Institute NSW, eviQ, "Anti-cancer drug patient assessment tool", version
 *   7 (last reviewed October 2023): the assessment asks the assessor to "Rate the patient's ECOG Score". eviQ is a
 *   state body's service: whether other states record the same way is for an oncologist (the audit says so too).
 * THE GRADES ARE NAMED BY THEIR NUMBER ONLY: the wording of each grade is not reproduced, and the doctor reads it from
 *   the scale. The side-effect grading the audit proposed beside it (CTCAE) is NOT built: its terms were not read.
 */
export const ECOG_DERECELERI = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'] as const
export const AU_ECOG: AracTanimi = {
  anahtar: 'au-oncology-grading',
  tur: 'olcek',
  alanlar: [secim('derece', ECOG_DERECELERI)],
  cikti: { sayilar: [], bantlar: [...ECOG_DERECELERI], uyarilar: [], tarihler: [] },
  kaynak: 'Oken MM, Creech RH, Tormey DC, et al. Am J Clin Oncol 1982. ECOG Performance Status Scale, ECOG-ACRIN Cancer Research Group.',
  hesapla: (g) => {
    const d = g.derece
    if (typeof d !== 'string' || !(ECOG_DERECELERI as readonly string[]).includes(d)) return BOS_SONUC
    return { tamam: true, sayilar: [], bant: d, uyarilar: [], tarihler: [] }
  },
}

/** The mechanisms only Australia has, in the order the grid shows their tools. */
export const AU_TANIMLAR: readonly AracTanimi[] = [AU_BEDEN, AU_K10, AU_ECOG]
