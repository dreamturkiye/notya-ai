/**
 * NOTYA-ULKE-UYGULA (gb) — United Kingdom: THE TOOLS ONLY THIS COUNTRY HAS. Their mechanisms, their words and their
 * licences, all in this folder: a wall (scripts/ulke-duvarlari.mjs, rules D3 and D7) keeps every other country, the
 * language set and the kit away from them, and every key carries this country's code ("gb-…").
 *
 * FROM THE AUDITED PROPOSALS (docs/araclar-denetim/gb-kararlar.json → `addTools`; docs/araclar-denetim/GB.md,
 * "The proposals"). A proposal was built ONLY where both hold:
 *   - its licence is free ON THE RIGHTS HOLDER'S OWN NOTICE, opened in this job's session (2026-10-10), and
 *   - its defining source was opened in the same session, and the tool is tested with that source's own worked
 *     examples (./gb-araclar.test.ts).
 * Three passed. Why each of the other twenty-one was not built is in the pull request's report.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF, by the owner's order of 2026-10-10 ("Bring on all the tools built for
 * the new 6 countries now. We will test as we go."). Machine-written; no clinician of the United Kingdom has read a
 * line. The list a clinician works through is ./onaysiz-araclar.json; a test holds it to this file exactly.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 *   gb-four-at               4AT, the rapid assessment test for delirium: four items, a total out of 12, three bands.
 *   gb-valproate-forms       valproate: when the risk acknowledgement form was last completed, and the day the annual
 *                            review falls due. Dates and ticks only.
 *   gb-fracture-risk-link    a link-out tile to the FRAX calculator on its owner's site. Nothing of FRAX is here.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { ayEkle, BOS_SONUC, gunMu, isaret, secim, tarih } from '@/lib/ulke/araclar/yardimci'

const D = 'en-GB'
const m = (metin: string) => ({ [D]: metin })

// ───────────────────────── 1. 4AT ─────────────────────────
/**
 * THE 4AT. Sources, each opened on 2026-10-10 on the test's own site:
 *   [4AT-GUIDE]  "User guide and scoring", https://www.the4at.com/userguide — the four items and the score of each
 *                answer: [1] Alertness 0 or 4; [2] AMT4 (age, date of birth, place, current year) 0 for no mistakes,
 *                1 for 1 mistake, 2 for 2 or more mistakes or untestable; [3] Attention, months of the year backwards,
 *                0 for 7 months or more correctly, 1 for a start that reaches fewer than 7 or a refusal to start, 2 for
 *                untestable; [4] Acute change or fluctuating course, No 0, Yes 4.
 *   [4AT-FAQ]    https://www.the4at.com/4at-faq — the total runs from 0 to 12 and is read in three categories: 0;
 *                1 to 3; 4 or above, which points to possible delirium and calls for a clinical assessment. The
 *                licence: "No permission, payment, or registration is required."
 *   [4AT-CASES]  "Worked cases", https://www.the4at.com/4atcases — six cases with the score of each item and the
 *                total: they are this tool's tests (./gb-araclar.test.ts).
 *   [4AT-REUSE]  https://www.the4at.com/attribution — the licence (Creative Commons Attribution 4.0; the page says
 *                it covers commercial use when its terms are followed) and the attribution an adaptation must carry
 *                (`lisans.bildirim` below, as the page gives it). This form shortens the labels of the items, so it
 *                is an adaptation and says so.
 * NATIONAL SOURCE THAT NAMES IT (read by the tools audit, not opened again): NICE CG103, recommendation 1.6.1.
 * THE SCORES ARE THE AUTHORS' AND ARE NOT CHANGED. The examiner asks and judges each item as the official test says.
 */
export const GB_4AT_PUANLARI = {
  uyaniklik: { normal: 0, anormal: 4 },
  amt4: { hatasiz: 0, bir_hata: 1, iki_veya_fazla: 2 },
  dikkat: { yedi_veya_fazla: 0, yediden_az: 1, test_edilemez: 2 },
  akut_degisim: { hayir: 0, evet: 4 },
} as const
type Madde4AT = keyof typeof GB_4AT_PUANLARI
const MADDELER_4AT = Object.keys(GB_4AT_PUANLARI) as Madde4AT[]

export const GB_FOUR_AT: AracTanimi = {
  anahtar: 'gb-four-at',
  tur: 'olcek',
  alanlar: MADDELER_4AT.map((k) => secim(k, Object.keys(GB_4AT_PUANLARI[k]))),
  cikti: { sayilar: ['toplam'], bantlar: ['olasi_deliryum', 'olasi_bilissel', 'olasi_degil'], uyarilar: [], tarihler: [] },
  kaynak: '4AT rapid clinical test for delirium, official version and user guide: https://www.the4at.com (opened 10 October 2026).',
  hesapla: (g) => {
    let toplam = 0
    for (const k of MADDELER_4AT) {
      const secilen = g[k]
      const puanlar: Readonly<Record<string, number>> = GB_4AT_PUANLARI[k]
      // every item is answered, or there is no score: an empty item is never counted as 0
      if (typeof secilen !== 'string' || !Object.prototype.hasOwnProperty.call(puanlar, secilen)) return BOS_SONUC
      toplam += puanlar[secilen]
    }
    // [4AT-FAQ]: 4 or above; 1–3; 0
    const bant = toplam >= 4 ? 'olasi_deliryum' : toplam >= 1 ? 'olasi_bilissel' : 'olasi_degil'
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 12 }], bant, uyarilar: [], tarihler: [] }
  },
}

const FOUR_AT: PaketAraci = {
  anahtar: 'gb-four-at',
  // every DOCTOR role of the country, and no allied profession: filled in by ./araclar.ts
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('4AT: rapid assessment test for delirium'),
    aciklama: m('The four items of the 4AT, each scored as its authors score it, and their total out of 12. Ask and judge each item as the official test describes it (the4at.com): the labels here are shortened. A score appears once all four items are answered.'),
    alanlar: {
      uyaniklik: m('[1] Alertness'),
      amt4: m('[2] AMT4: age, date of birth, place, current year'),
      dikkat: m('[3] Attention: the months of the year backwards, starting at December'),
      akut_degisim: m('[4] Acute change or fluctuating course: a significant change or fluctuation in alertness, cognition or other mental function, arising over the last 2 weeks and still evident in the last 24 hours'),
    },
    secenekler: {
      uyaniklik: {
        normal: m('Normal: fully alert and not agitated throughout, or mild sleepiness for less than 10 seconds after waking, then normal (0)'),
        anormal: m('Clearly abnormal: marked drowsiness, or agitation or hyperactivity (4)'),
      },
      amt4: { hatasiz: m('No mistakes (0)'), bir_hata: m('1 mistake (1)'), iki_veya_fazla: m('2 or more mistakes, or untestable (2)') },
      dikkat: {
        yedi_veya_fazla: m('Achieves 7 months or more correctly (0)'),
        yediden_az: m('Starts but scores fewer than 7 months, or refuses to start (1)'),
        test_edilemez: m('Untestable: cannot start because unwell, drowsy or inattentive (2)'),
      },
      akut_degisim: { hayir: m('No (0)'), evet: m('Yes (4)') },
    },
    sayilar: { toplam: m('4AT score') },
    bantlar: {
      olasi_deliryum: m('4 or above: possible delirium, with or without cognitive impairment'),
      olasi_bilissel: m('1 to 3: possible cognitive impairment'),
      olasi_degil: m('0: delirium or severe cognitive impairment unlikely (but delirium is still possible if the information is incomplete)'),
    },
    not: m('A screening test, not a diagnosis. A score of 4 or above calls for a clinical assessment; the diagnosis is the doctor\'s.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Alasdair MacLullich, Tracy Ryan and Helen Cash, the authors of the 4AT',
    kaynak: 'Creative Commons Attribution 4.0 (CC BY 4.0). The authors\' own pages, opened 2026-10-10: https://www.the4at.com/4at-faq (no permission, payment or registration is asked for) and https://www.the4at.com/attribution (sharing and adaptation, commercial use included, when the terms are followed).',
    // the attribution the authors ask of an adaptation, as their page gives it, with this form's changes described
    bildirim: m('Adapted from the 4AT © 2011–2014 Alasdair MacLullich, Tracy Ryan and Helen Cash. Licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Official and current version: https://www.the4at.com/. This version has been modified. Changes: the four items are shown as fields of an electronic form with shortened labels, and the form adds up the total. The published validation evidence for the official 4AT should not be assumed to apply to this modified version. No warranty is given as to accuracy or fitness for purpose.'),
  },
}

// ───────────────────────── 2. valproate: the forms and the annual review ─────────────────────────
/**
 * VALPROATE: WHEN THE RISK ACKNOWLEDGEMENT FORM WAS LAST COMPLETED. Source, opened on 2026-10-10:
 *   [VALPROATE]  Medicines and Healthcare products Regulatory Agency, "Valproate – reproductive risks", GOV.UK,
 *                published 10 June 2025, last updated 23 September 2025,
 *                https://www.gov.uk/guidance/valproate-reproductive-risks. What this tool takes from it:
 *     - the Annual Risk Acknowledgement Form is for female patients under 55, when valproate is started and "at
 *       annual review"; from the second review on, one specialist is enough;
 *     - a male patient under 55 who is started on valproate completes a Risk Acknowledgement Form of his own, once,
 *       at the start;
 *     - under 55, for both sexes, valproate is prescribed only when two specialists have agreed (the page gives the
 *       grounds); the Pregnancy Prevention Programme applies to any woman or girl able to have children.
 *   The page's own notice says its content is available under the Open Government Licence v3.0 unless stated
 *   otherwise. None of the regulator's forms is reproduced here.
 *
 * WHAT THE TOOL WORKS OUT: for a female patient, the day ONE YEAR after the form was last completed (the page speaks
 * of an annual review and states no other interval), and a warning once that day has passed. For a male patient no day:
 * the form is completed once. A form dated in the future is not a completed form: no result.
 * The page prints no worked example; the tests are plain dates (./gb-araclar.test.ts).
 * NOT IN THE TOOL: what the page says about patients of 55 and over (it links to a picture that was not read), who
 * counts as a specialist (the page leaves it to local decision), any medicine, dose or indication.
 */
export const GB_VALPROAT_YILLIK_AY = 12
export const GB_VALPROATE: AracTanimi = {
  anahtar: 'gb-valproate-forms',
  tur: 'takvim',
  alanlar: [
    secim('hasta', ['kadin', 'erkek']),
    tarih('form_tarihi'),
    isaret('iki_uzman'),
    { ...isaret('gebelik_onleme'), kosul: { alan: 'hasta', degerler: ['kadin'] } },
  ],
  cikti: { sayilar: [], bantlar: ['kadin_yillik', 'erkek_baslangic'], uyarilar: ['gozden_gecirme_gecikti'], tarihler: ['sonraki_yillik'] },
  kaynak: 'Medicines and Healthcare products Regulatory Agency. Valproate – reproductive risks. GOV.UK, published 10 June 2025, last updated 23 September 2025.',
  hesapla: (g, { bugun }) => {
    if ((g.hasta !== 'kadin' && g.hasta !== 'erkek') || !gunMu(g.form_tarihi)) return BOS_SONUC
    // a form dated after today has not been completed
    if (g.form_tarihi > bugun) return BOS_SONUC
    if (g.hasta === 'erkek') return { tamam: true, sayilar: [], bant: 'erkek_baslangic', uyarilar: [], tarihler: [] }
    const sonraki = ayEkle(g.form_tarihi, GB_VALPROAT_YILLIK_AY)
    return { tamam: true, sayilar: [], bant: 'kadin_yillik', uyarilar: bugun > sonraki ? ['gozden_gecirme_gecikti'] : [], tarihler: [{ anahtar: 'sonraki_yillik', tarih: sonraki }] }
  },
}

const VALPROATE: PaketAraci = {
  anahtar: 'gb-valproate-forms',
  roller: ['neurology', 'psychiatry', 'child-adolescent-psychiatry', 'family-medicine'],
  metin: {
    ad: m('Valproate: risk acknowledgement form and annual review'),
    aciklama: m('For a patient under 55 on valproate: the day the risk acknowledgement form was last completed and, for a female patient, the day one year later, when the annual review falls due. Dates and ticks only: no dose, no indication, and none of the regulator\'s forms is reproduced.'),
    alanlar: {
      hasta: m('The patient'),
      form_tarihi: m('Date the form was last completed and signed'),
      iki_uzman: m('Two specialists agreed, and it was recorded, when valproate was started'),
      gebelik_onleme: m('The conditions of the Pregnancy Prevention Programme are being followed (a woman or girl able to have children)'),
    },
    secenekler: {
      hasta: {
        kadin: m('Female patient under 55: Annual Risk Acknowledgement Form'),
        erkek: m('Male patient under 55: Risk Acknowledgement Form for male patients'),
      },
    },
    bantlar: {
      kadin_yillik: m('Female patient under 55: the form is completed when valproate is started and at each annual review'),
      erkek_baslangic: m('Male patient under 55: the form is completed once, when valproate is started'),
    },
    uyarilar: { gozden_gecirme_gecikti: m('More than a year has passed since the form was last completed: the annual review is overdue') },
    tarihler: { sonraki_yillik: m('One year after the form was last completed (annual review)') },
    not: m('A record of dates. Whether valproate is right for this patient, and what the regulator\'s current measures ask for, are for the prescriber to check in the regulator\'s own guidance.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Crown copyright (Medicines and Healthcare products Regulatory Agency)',
    kaynak: 'The notice on the page itself, opened 2026-10-10 (https://www.gov.uk/guidance/valproate-reproductive-risks): its content is available under the Open Government Licence v3.0 unless stated otherwise. The tool takes the names of the two forms and the yearly review; it reproduces no form.',
    bildirim: m('Source: Medicines and Healthcare products Regulatory Agency, "Valproate – reproductive risks" (GOV.UK, last updated 23 September 2025), available under the Open Government Licence v3.0.'),
  },
}

// ───────────────────────── 3. fracture risk: a link to the owner's calculator ─────────────────────────
/**
 * FRAX: A LINK AND NOTHING ELSE. The owner sells access for programs by the year (the tools audit read the plans:
 * https://www.fraxplus.org/frax-plus) and the algorithm may not be rebuilt, so NOTHING OF FRAX IS IN THIS PRODUCT: no
 * formula, no table, no call from a program. The tile opens the owner's own public calculator page in a new tab.
 * Opened on 2026-10-10: https://www.fraxplus.org/calculation-tool (title "Frax Calculator | FRAXplus®"),
 * https://www.fraxplus.org/faq and https://www.fraxplus.org/about — each carries the copyright line of Osteoporosis
 * Research Ltd, UK, and the line "FRAX® and FRAXplus® are registered trademarks."; none states terms about linking.
 * THE LICENCE STATE BELOW IS ABOUT THE LINK ALONE ("free": a link uses nothing of the owner's). FOR THE LAWYER: whether
 * a link from a commercial product needs the owner's word.
 * NATIONAL SOURCE THAT NAMES THE CALCULATOR (read by the tools audit, not opened again): NICE CG146.
 */
export const GB_FRAX_ADRESI = 'https://www.fraxplus.org/calculation-tool'
const FRAX: PaketAraci = {
  anahtar: 'gb-fracture-risk-link',
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('Fracture risk: the FRAX calculator (link)'),
    aciklama: m('Opens the FRAX fracture risk calculator on its owner\'s own site. The calculation is done there: nothing of the algorithm is in this product, and nothing is worked out here.'),
    alanlar: {},
    not: m('This opens another site in a new tab. Nothing from the patient file is sent to it, and nothing is kept here.'),
    baglanti: m('Open the FRAX calculator'),
  },
  baglanti: { adres: GB_FRAX_ADRESI },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Osteoporosis Research Ltd, UK',
    kaynak: 'A LINK ONLY: nothing of FRAX is implemented, reproduced or called by a program. The owner\'s pages opened 2026-10-10 (https://www.fraxplus.org/calculation-tool, /faq, /about) carry a copyright line and a trademark line and state no terms about linking. Access for programs is a paid plan and is not used.',
    bildirim: m('FRAX® and FRAXplus® are registered trademarks. The calculator belongs to Osteoporosis Research Ltd; this tile only links to it.'),
  },
}

/** The mechanisms of the tools only this country has (a link-out tile has none). */
export const GB_KENDI_TANIMLARI: readonly AracTanimi[] = [GB_FOUR_AT, GB_VALPROATE]
/** The tools only this country has, as the pack lists them, in the order the grid shows them. All switched on. */
export const GB_KENDI_ARACLARI: readonly PaketAraci[] = [FOUR_AT, FRAX, VALPROATE]
/** Every key that is this country's alone: the list of countries/yasak-araclar.json under "gb". */
export const GB_OZEL_ANAHTARLAR: readonly string[] = ['gb-four-at', 'gb-fracture-risk-link', 'gb-valproate-forms']
