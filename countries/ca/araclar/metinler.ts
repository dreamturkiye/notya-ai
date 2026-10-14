/**
 * NOTYA-ULKE-UYGULA-CA — Canada: THE WORDS, THE ROLES AND THE LICENCE of the tools only this country has (their
 * arithmetic: ./tanimlar.ts). Written in Canadian spelling, as they stand on the screen.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * BOTH TOOLS ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF (the owner's order of 2026-10-10; ./onayBekleyen.ts).
 * MACHINE-WRITTEN AND UNREAD: no clinician and no native editor of Canada has read a line.
 *
 * LICENCE. A tool is stated "free" (`serbest`) only where the rights holder's own notice says so and that notice was
 * read on 2026-10-10; what the holder asks for is the notice under every result (`bildirim`). "Free" is this job's
 * reading of the page cited, not legal advice: FOR A LAWYER.
 *   [SI/97-5]    Reproduction of Federal Law Order, SI/97-5 (current to 2026-06-14),
 *                https://laws-lois.justice.gc.ca/eng/regulations/SI-97-5/page-1.html — anyone may reproduce
 *                enactments of the Government of Canada "without charge or request for permission", provided due
 *                diligence is exercised in ensuring accuracy and the reproduction is not represented as an official
 *                version. The unit converter takes four fractions from Schedule II of the Weights and Measures Act.
 *   [NIDDK-USE]  National Institute of Diabetes and Digestive and Kidney Diseases, "Copyright" (last reviewed May
 *                2024), https://www.niddk.nih.gov/copyright — most information on its site is free of copyright and
 *                may be reproduced; content reproduced without changes acknowledges the institute as the source; its
 *                content must not be used to imply that it stands behind a product, or to recommend treatment.
 *                The equation of the eGFR tool is taken from the institute's page as printed.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { AracLisansi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'

const D = 'en-CA'
const m = (metin: string): BicimliMetin => ({ [D]: metin })
const sozluk = (s: Readonly<Record<string, string>>): Readonly<Record<string, BicimliMetin>> => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, m(v)]))

const YASA_LISANSI: AracLisansi = {
  durum: 'serbest',
  hakSahibi: 'Government of Canada (federal enactments)',
  kaynak: 'Reproduction of Federal Law Order, SI/97-5 (current to 2026-06-14), https://laws-lois.justice.gc.ca/eng/regulations/SI-97-5/page-1.html, read 2026-10-10',
  bildirim: m('Factors as defined in Schedule II of the Weights and Measures Act (R.S.C., 1985, c. W-6). This is not an official version of the Act.'),
}

const NIDDK_LISANSI: AracLisansi = {
  durum: 'serbest',
  hakSahibi: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), National Institutes of Health',
  kaynak: 'NIDDK, "Copyright" (last reviewed May 2024), https://www.niddk.nih.gov/copyright, read 2026-10-10',
  bildirim: m('Equation as published by the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), "eGFR Equations for Adults". NIDDK has not reviewed this product and does not stand behind it.'),
}

/** The roles of this country a tool is for, handed in by ../ayarlar.ts (the role list is the country's own: ../roller.ts). */
export type CaRolleri = {
  /** Every doctor role of the pack: every role that is not an allied profession. */
  hekimler: readonly string[]
}

/**
 * THE TOOLS ONLY THIS COUNTRY HAS, complete: who sees each (the audit's decision, ca-kararlar.json → `coreSet`), every
 * word of its screen, the patients it is for, and its licence. BOTH ARE IN THE PACK'S LIST OF SWITCHED-ON TOOLS
 * (../ayarlar.ts → `ek.araclar`).
 */
export function caKendiAraclari(r: CaRolleri): readonly PaketAraci[] {
  return [
    {
      // CORE SET, EVERY ROLE (a base tool): the doctor roles and the allied professions alike. Classified as the
      // tools rule asks: it holds no clinical content and answers the same question for every role (a weight or a
      // height a patient gives in pounds, feet and inches).
      anahtar: 'ca-unit-converter',
      roller: null,
      metin: {
        ad: m('Unit converter: pounds, feet and inches'),
        aciklama: m('Turns a weight in pounds into kilograms, and a height in feet and inches into centimetres, with the exact factors Canadian law defines the pound and the yard by. Fill in the weight, the height, or both. For a height, enter feet and inches together, or inches alone.'),
        alanlar: sozluk({ agirlik_lb: 'Weight (optional)', boy_ft: 'Height: feet (optional)', boy_in: 'Height: inches (enter 0 if there are none)' }),
        sayilar: sozluk({ kg: 'Weight', cm: 'Height' }),
        not: m('A conversion of the numbers you enter and nothing else: nothing is measured, and no dose is worked out.'),
      },
      lisans: YASA_LISANSI,
    },
    {
      // CORE SET, EVERY DOCTOR ROLE (not the allied professions): the audit's "the 35 doctor roles", which is every
      // doctor role of today's list. Adults only: the equation is for ages 18 and older.
      anahtar: 'ca-egfr-ckd-epi-2021',
      roller: [...r.hekimler], sinif: 'hekimler',
      metin: {
        ad: m('Estimated GFR (2021 CKD-EPI creatinine equation)'),
        aciklama: m('From serum creatinine, age and sex, the estimated glomerular filtration rate is worked out with the 2021 CKD-EPI creatinine equation and written as a whole number. No category, no stage and no referral rule is shown. The figure on a laboratory report may come from another equation: check which equation your laboratory reports. The equation is not validated for use in children or in pregnancy.'),
        alanlar: sozluk({ cinsiyet: 'Sex', yas: 'Age in years', kreatinin: 'Serum creatinine' }),
        secenekler: { cinsiyet: sozluk({ kadin: 'Female', erkek: 'Male' }) },
        sayilar: sozluk({ egfr: 'Estimated GFR' }),
        not: m('The value is an estimate, not a precise measure of kidney function. It is not a stage and not a dose: diagnosis, medicines and doses are the doctor\'s.'),
        hastaKapisi: m('This tool is for adults aged 18 and over: the equation is not used below that age.'),
      },
      hasta: { enAzYas: 18 },
      lisans: NIDDK_LISANSI,
    },
    caNarkotik(r.hekimler),
    caPrescribeIt(r.hekimler),
  ]
}

/** A record of the written narcotic order, from the regulation opened on 14 October 2026. Nothing is sent. */
export function caNarkotik(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'ca-narcotic-note',
    roller: [...hekimler], sinif: 'hekimler',
    metin: {
      ad: m('Narcotic order: points the regulation names'),
      aciklama: m('A record of the points the Narcotic Control Regulations name for a written narcotic order or prescription: written, signed by a practitioner, dated, a stated amount, and the person named or the animal identified. Diacetylmorphine (heroin) is signed and dated by a practitioner of medicine or a nurse practitioner. A verbal prescription narcotic may be a verbal order. The book a pharmacist keeps is not on this list.'),
      alanlar: sozluk({
        yazili: 'Written order or prescription',
        imza: 'Signed by a practitioner',
        tarihli: 'Dated',
        miktar: 'States an amount of the narcotic',
        ad: 'Names the person, or identifies the animal',
      }),
      sayilar: sozluk({ isaretli: 'Points recorded' }),
      not: m('A record of those points. It is not a prescription, nothing is printed and nothing is sent. Targeted-substance regulations, the controlled-drug part of the food and drug regulations, and provincial rules were not opened. It does nothing else. Whether to write the order is the doctor\'s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Government of Canada (federal enactments)',
      kaynak: 'Narcotic Control Regulations, C.R.C., c. 1041 (current to 2026-09-21), https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1041/FullText.html, read 2026-10-14',
      bildirim: m('Points from the Narcotic Control Regulations (C.R.C., c. 1041), sections 2 and 31. This is not an official version.'),
    },
  }
}

/** A link only. The homepage was read on 14 October 2026. No call is made. */
export function caPrescribeIt(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'ca-prescribeit-link',
    roller: [...hekimler], sinif: 'hekimler',
    metin: {
      ad: m('PrescribeIT (link)'),
      aciklama: m('Opens the PrescribeIT page. This product does not call that service and does not sign in.'),
      alanlar: {},
      not: m('The page says the national prescribing standard is reached by joining its standards working group. This product has not joined. Nothing from the patient file is sent. It does nothing else. Whether to use the service is the doctor\'s decision.'),
      baglanti: m('Open the PrescribeIT page'),
    },
    baglanti: { adres: 'https://www.prescribeit.ca/' },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'PrescribeIT',
      kaynak: 'A link only. https://www.prescribeit.ca/, read 2026-10-14',
      bildirim: m('A link to the PrescribeIT page. This tile does not copy that page and does not call the service.'),
    },
  }
}
