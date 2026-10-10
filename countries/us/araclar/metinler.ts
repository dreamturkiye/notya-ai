/**
 * NOTYA-ULKE-UYGULA-US — United States: THE WORDS, THE ROLES AND THE LICENCE of the tools only this country has
 * (their arithmetic: ./tanimlar.ts). Written in American spelling, as they would stand on the screen.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * ALL OF THESE TOOLS ARE SWITCHED ON, by the owner's order of 2026-10-10 ("Bring on all the tools built for the new 6
 * countries now. We will test as we go."), and NONE HAS A CLINICIAN'S SIGN-OFF: each stands on ./onayBekleyen.ts with
 * what a clinician of the United States is asked.
 *
 * MACHINE-WRITTEN AND UNREAD: no clinician and no native editor of the United States has read a line.
 *
 * LICENCE. A tool is stated "free" (`serbest`) only where the rights holder's own notice says so and that notice was
 * read on 2026-10-10; where the holder asks for a credit or a disclaimer, it is the notice under every result
 * (`bildirim`). "Free" is this job's reading of the page cited, not legal advice: FOR A LAWYER before a tool ships.
 *   [CDC-USE]    Centers for Disease Control and Prevention, "Use of Agency Materials" (last reviewed May 1, 2023),
 *                https://www.cdc.gov/other/agencymaterials.html — most of the information on its sites is in the
 *                public domain and may be used without permission; credit the agency; say that the use does not
 *                imply its endorsement; say the material is available from the agency at no charge; do not use its
 *                logo; material made by others may be restricted.
 *   [NIDDK-USE]  National Institute of Diabetes and Digestive and Kidney Diseases, "Copyright" (last reviewed May
 *                2024), https://www.niddk.nih.gov/copyright — most information on its site is free of copyright and
 *                may be reproduced; credit the institute; its content must not imply that it endorses a product.
 *   [ECOG]       ECOG-ACRIN Cancer Research Group, "ECOG Performance Status Scale",
 *                https://ecog-acrin.org/resources/ecog-performance-status/ — the scale is in the public domain and
 *                available for public use; the group asks for its name above the scale and its citation and credit
 *                line below.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { AracLisansi, AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { US_TANIMLAR } from './tanimlar'

const D = 'en-US'
const m = (metin: string): BicimliMetin => ({ [D]: metin })
const sozluk = (s: Readonly<Record<string, string>>): Readonly<Record<string, BicimliMetin>> => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, m(v)]))

const KARAR = 'A decision-support tool: diagnosis and treatment are the doctor\'s.'
const EVET_HAYIR = { evet: 'Yes', hayir: 'No' }

const CDC = 'Centers for Disease Control and Prevention (CDC)'
const CDC_KAYNAK = 'CDC, "Use of Agency Materials" (last reviewed May 1, 2023), https://www.cdc.gov/other/agencymaterials.html, read 2026-10-10'
/** The notice the CDC's terms ask for: the credit, where the material is, and that nothing here speaks for the agency. */
const cdcBildirimi = (sayfa: string): BicimliMetin => m(`Source: ${CDC}, "${sayfa}", available on the CDC website at no charge. Use of this material does not imply endorsement of this product by CDC, ATSDR, HHS or the United States Government.`)
const cdcLisansi = (sayfa: string): AracLisansi => ({ durum: 'serbest', hakSahibi: CDC, kaynak: CDC_KAYNAK, bildirim: cdcBildirimi(sayfa) })

const NIDDK_LISANSI: AracLisansi = {
  durum: 'serbest',
  hakSahibi: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), National Institutes of Health',
  kaynak: 'NIDDK, "Copyright" (last reviewed May 2024), https://www.niddk.nih.gov/copyright, read 2026-10-10',
  bildirim: m('Equation as published by the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), "eGFR Equations for Adults". NIDDK does not endorse this product.'),
}

/**
 * [PHQ]  THE OWNER'S OWN LINE, PRINTED ON THE FORM: "No permission required to reproduce, translate, display or
 *        distribute" — read on 2026-10-10 on the form as issued by the North Dakota Department of Health and Human
 *        Services (https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf) and in the LOINC
 *        record that carries the same notice for the companion form (https://cdn.loinc.org/70274-6), which names
 *        Pfizer Inc. as the copyright holder. An older printing of the form (the copy the scoring table was read on)
 *        says "All rights reserved. Reproduced with permission" instead. The owner's own site refuses automated
 *        readers: A PERSON OPENS IT ONCE. The product reproduces none of the form's wording.
 */
const PHQ_LISANSI: AracLisansi = {
  durum: 'serbest',
  hakSahibi: 'Pfizer Inc. (copyright); developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues',
  kaynak: 'the permission line printed on the PHQ-9 form (https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf) and in the LOINC record https://cdn.loinc.org/70274-6, read 2026-10-10',
  bildirim: m('PHQ-9. Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc.'),
}

const ECOG_LISANSI: AracLisansi = {
  durum: 'serbest',
  hakSahibi: 'ECOG-ACRIN Cancer Research Group',
  kaynak: 'ECOG-ACRIN Cancer Research Group, "ECOG Performance Status Scale", https://ecog-acrin.org/resources/ecog-performance-status/, read 2026-10-10',
  bildirim: m('ECOG Performance Status Scale. Developed by the Eastern Cooperative Oncology Group, now part of the ECOG-ACRIN Cancer Research Group, and published in 1982: Oken MM, Creech RH, Tormey DC, Horton J, Davis TE, McFadden ET, Carbone PP. Toxicity and response criteria of the Eastern Cooperative Oncology Group. Am J Clin Oncol. 1982;5(6):649-655.'),
}

/** The roles of this country a tool is for, handed in by ../ayarlar.ts (the role list is the country's own: ../roller.ts). */
export type UsRolleri = {
  /** Every doctor role of the pack: every role that is not an allied profession. */
  hekimler: readonly string[]
}

/**
 * THE TOOLS ONLY THIS COUNTRY HAS, complete: who would see each (the audit's decision, us-kararlar.json), every word
 * of its screen, the patients it is for, and its licence.
 */
export function usKendiAraclari(r: UsRolleri): readonly PaketAraci[] {
  return [
    {
      // CORE SET: every doctor role, and the dietitian (the audit's clinic list).
      anahtar: 'us-bmi',
      roller: [...r.hekimler, 'dietetics'],
      metin: {
        ad: m('Body mass index (adults)'),
        aciklama: m('From height in feet and inches and weight in pounds, the body mass index is worked out and placed in the category the CDC prints for adults. The index is rounded to one decimal place before it is placed.'),
        alanlar: sozluk({ boy_ft: 'Height: feet', boy_in: 'Height: inches (enter 0 if none)', agirlik_lb: 'Weight' }),
        sayilar: sozluk({ bmi: 'Body mass index' }),
        bantlar: sozluk({
          zayif: 'Underweight (less than 18.5)',
          saglikli: 'Healthy weight (18.5 to less than 25)',
          fazla_kilolu: 'Overweight (25 to less than 30)',
          obezite_1: 'Obesity, class 1 (30 to less than 35)',
          obezite_2: 'Obesity, class 2 (35 to less than 40)',
          obezite_3: 'Obesity, class 3 (40 or greater)',
        }),
        not: m('The index says nothing about body composition or health by itself; assessment and diagnosis are the doctor\'s.'),
        hastaKapisi: m('This tool is for adults aged 20 and over.'),
      },
      // adults 20 and older: the age the CDC states for these categories and for its calculator
      hasta: { enAzYas: 20 },
      lisans: cdcLisansi('Adult BMI Categories'),
    },
    {
      // CORE SET: every doctor role.
      anahtar: 'us-egfr-ckd-epi-2021',
      roller: [...r.hekimler], sinif: 'hekimler',
      metin: {
        ad: m('Estimated GFR (2021 CKD-EPI creatinine equation)'),
        aciklama: m('From serum creatinine, age and sex, the estimated glomerular filtration rate is worked out with the 2021 CKD-EPI creatinine equation and written as a whole number. No category and no stage is shown.'),
        alanlar: sozluk({ cinsiyet: 'Sex', yas: 'Age in years', kreatinin: 'Serum creatinine' }),
        secenekler: { cinsiyet: sozluk({ kadin: 'Female', erkek: 'Male' }) },
        sayilar: sozluk({ egfr: 'Estimated GFR' }),
        not: m('The value is an estimate, not a precise measure of kidney function. It is not a dose and not a stage: diagnosis, medicines and doses are the doctor\'s.'),
        hastaKapisi: m('This tool is for adults aged 18 and over: the equation is not used below that age.'),
      },
      hasta: { enAzYas: 18 },
      lisans: NIDDK_LISANSI,
    },
    {
      // CORE SET: every doctor role.
      anahtar: 'us-pack-years',
      roller: [...r.hekimler], sinif: 'hekimler',
      metin: {
        ad: m('Pack-years and lung cancer screening criteria'),
        aciklama: m('From packs smoked a day and years of smoking, the pack-years are worked out and held against the three criteria the CDC lists for yearly lung cancer screening: age 50 to 80, a history of 20 pack-years or more, and smoking now or having quit within the past 15 years.'),
        alanlar: sozluk({ yas: 'Age in years', paket_gun: 'Packs smoked a day, on average', icilen_yil: 'Years of smoking', durum: 'Smoking status', birakali_yil: 'Years since quitting' }),
        secenekler: { durum: sozluk({ iciyor: 'Smokes now', birakti: 'Has quit' }) },
        sayilar: sozluk({ paket_yil: 'Pack-years' }),
        bantlar: sozluk({ karsiliyor: 'The three criteria are met', karsilamiyor: 'The three criteria are not all met' }),
        uyarilar: sozluk({
          yas_disinda: 'Age is outside 50 to 80 years',
          paket_yil_az: 'The smoking history is below 20 pack-years',
          birakali_uzun: 'Quit 15 or more years ago',
        }),
        not: m('The criteria are the ones the CDC page lists. Screening also stops when a health problem makes surgery impossible or unwanted. Whether to screen is the doctor\'s decision with the patient.'),
      },
      lisans: cdcLisansi('Screening for Lung Cancer'),
    },
    {
      // CORE SET: every doctor role; and, from the audit's clinic list, the dietitian. (The audit also names podiatry,
      // which is not a role of this country yet: ../roller.ts.)
      anahtar: 'us-blood-sugar-ranges',
      roller: [...r.hekimler, 'dietetics'],
      metin: {
        ad: m('Blood sugar tests: normal, prediabetes and diabetes ranges'),
        aciklama: m('One test result is placed in the range the CDC prints for that test: A1C, fasting blood sugar, the 2-hour value of a glucose tolerance test, or a random blood sugar. One result is not a diagnosis.'),
        alanlar: sozluk({ test: 'Test', a1c: 'A1C', glukoz: 'Blood sugar' }),
        secenekler: { test: sozluk({ a1c: 'A1C', aclik: 'Fasting blood sugar', ogtt: 'Glucose tolerance test, 2-hour value', rastgele: 'Random blood sugar' }) },
        bantlar: sozluk({
          normal: 'In the range printed as normal',
          prediyabet: 'In the range printed for prediabetes',
          diyabet: 'In the range printed for diabetes',
          rastgele_200_alti: 'Below 200 mg/dL: no range is printed for a random value below that',
        }),
        not: m('The ranges are the ones the CDC page prints. The tool names a range, not a diagnosis; no target and no follow-up interval is given. Diagnosis and treatment are the doctor\'s.'),
      },
      lisans: cdcLisansi('Diabetes Testing'),
    },
    {
      // CORE SET: every doctor role; and the physical therapist and the occupational therapist (the audit's clinic list).
      anahtar: 'us-fall-risk-screen',
      roller: [...r.hekimler, 'physiotherapy', 'occupational-therapy'],
      metin: {
        ad: m('Fall-risk screening (three key questions)'),
        aciklama: m('The three key questions of the CDC\'s STEADI algorithm for adults aged 65 and over. A yes to any one of them is a positive screen. All three are answered before a result is shown.'),
        alanlar: sozluk({
          dengesiz: 'Does the patient feel unsteady when standing or walking?',
          endise: 'Does the patient worry about falling?',
          dustu: 'Has the patient fallen in the past year?',
        }),
        secenekler: { dengesiz: sozluk(EVET_HAYIR), endise: sozluk(EVET_HAYIR), dustu: sozluk(EVET_HAYIR) },
        bantlar: sozluk({ riskli: 'Screened at risk: at least one answer is yes', riskli_degil: 'Screened not at risk: all three answers are no' }),
        not: m('A screen, not an assessment: what follows a positive screen is the clinician\'s decision.'),
        hastaKapisi: m('This tool is for adults aged 65 and over.'),
      },
      hasta: { enAzYas: 65 },
      lisans: cdcLisansi('STEADI: Algorithm for Fall Risk Screening, Assessment, and Intervention'),
    },
    {
      // CORE SET: every doctor role; and, from the audit's clinic list, the clinical psychologist and the clinical social worker.
      anahtar: 'us-phq-9',
      roller: [...r.hekimler, 'clinical-psychology', 'clinical-social-work'],
      metin: {
        ad: m('PHQ-9: total score'),
        aciklama: m('Enter the score of each of the nine items of the PHQ-9 as the patient marked it on the form (0 to 3). The total is worked out and shown with the label the form prints for it. The wording of the items is not shown here: read it from the form.'),
        // the nine items are shown by their number: their wording belongs to the form
        alanlar: {},
        sayilar: sozluk({ toplam: 'Total score' }),
        bantlar: sozluk({
          sifir: 'Total 0: the form prints no label for a total of 0',
          minimal: 'Minimal depression (1 to 4), as the form labels the total',
          hafif: 'Mild depression (5 to 9), as the form labels the total',
          orta: 'Moderate depression (10 to 14), as the form labels the total',
          orta_ileri: 'Moderately severe depression (15 to 19), as the form labels the total',
          siddetli: 'Severe depression (20 to 27), as the form labels the total',
        }),
        uyarilar: sozluk({ madde9: 'Item 9 is scored above 0. The total does not show this: read item 9 itself.' }),
        not: m('A screening score, not a diagnosis. The last question of the form is not scored and is not part of the total. Assessment, diagnosis and what follows are the clinician\'s.'),
      },
      lisans: PHQ_LISANSI,
    },
    {
      // SPECIALTY TOOL (the audit: oncology, radiation oncology, hospice and palliative medicine).
      anahtar: 'us-ecog-performance-status',
      roller: ['oncology', 'radiation-oncology', 'hospice-palliative-medicine'],
      metin: {
        ad: m('ECOG Performance Status Scale'),
        aciklama: m('Records the ECOG performance status grade you choose, 0 to 5. The grades are named by their number only: read the wording of each grade from the scale itself.'),
        alanlar: sozluk({ derece: 'Grade' }),
        secenekler: { derece: sozluk({ d0: '0', d1: '1', d2: '2', d3: '3', d4: '4', d5: '5' }) },
        bantlar: sozluk({ d0: 'ECOG 0', d1: 'ECOG 1', d2: 'ECOG 2', d3: 'ECOG 3', d4: 'ECOG 4', d5: 'ECOG 5' }),
        not: m(KARAR),
      },
      lisans: ECOG_LISANSI,
    },
  ]
}

/** Names of the unit codes these tools show that the shared English set has no name for. */
export const US_KENDI_BIRIM_ADLARI: Readonly<Record<string, string>> = { ft: 'ft', 'kg/m2': 'kg/m²' }

/**
 * WHAT ../ayarlar.ts HANDS THE LANGUAGE SET FOR THESE TOOLS: the tools with their arithmetic (`ek`) and the names of
 * their units. `anahtarlar` = only these tools (to switch one off, name the others); absent = all of them.
 */
export function usAcilacakEk(r: UsRolleri, anahtarlar?: readonly string[]): { ek: { araclar: readonly PaketAraci[]; tanimlar: readonly AracTanimi[] }; birimAdlari: Readonly<Record<string, string>> } {
  const secili = (k: string) => !anahtarlar || anahtarlar.includes(k)
  return {
    ek: { araclar: usKendiAraclari(r).filter((p) => secili(p.anahtar)), tanimlar: US_TANIMLAR.filter((t) => secili(t.anahtar)) },
    birimAdlari: US_KENDI_BIRIM_ADLARI,
  }
}
