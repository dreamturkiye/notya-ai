/**
 * NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — Australia: LINK-OUT TILES (`tur: 'baglanti'`). No field, no arithmetic,
 * nothing of a patient in the address, nothing kept (lib/ulke/araclar/tipler.ts, `AracTuru`). Each opens one
 * official page in a new tab; the mechanism is the kit's own (`lib/ulke/araclar/paket.ts` builds it from
 * `PaketAraci.baglanti` alone, so no entry in ./tanimlar.ts is needed). Listed, with every other key only this
 * country has, in countries/yasak-araclar.json.
 *
 *   au-growth-chart-reference   answers the founder's question #3: which growth-chart reference Australian
 *                                paediatric practice actually uses. It is not a calculator — no LMS percentile
 *                                data of WHO's, the paediatric endocrine society's or the CDC's was read or copied
 *                                into this product in this session — it names which chart applies by age and
 *                                opens the page a clinician reads the charts from.
 *
 * MACHINE-WRITTEN, UNREAD BY A CLINICIAN OF AUSTRALIA: on the worklist of the local clinical lead
 * (./onaysizAciklar.ts), the same as the other tools only this country has.
 *
 * NOTE: au-my-health-record is not a link in this file. It is the upload-conditions checklist in
 * ./myHealthRecord.ts. A tick is a note. Nothing is uploaded.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/**
 * WHICH GROWTH CHART APPLIES, BY AGE: read 2026-10-13 — Australian and New Zealand Society for Paediatric
 * Endocrinology and Diabetes (ANZSPED), "Growth / Growth Charts",
 * https://anzsped.org/clinical-resources-links/growth-growth-charts/: "Infants and children less than 2 years of
 * age – use the WHO growth standards"; for 2 to 18 years the page lists both ANZSPED's own endorsed charts for
 * Australia and New Zealand (boys and girls, last updated October 2025) and, separately, the CDC 2000 charts for 2
 * to 20 years, without stating which of the two takes precedence. The RACGP's preventive-care guideline (the
 * audit's earlier reading, docs/araclar-denetim/AU.md) allows CDC or WHO body-mass-index charts, consistent with
 * there being a genuine choice rather than one single national chart. THIS TOOL DOES NOT PLOT A PERCENTILE: no
 * chart's underlying data (WHO's, ANZSPED's or the CDC's LMS parameters) was read or copied into this product in
 * this session — Kidney Health Australia's and the Australasian Sports Commission's chart and table copyrights
 * (read by the earlier audit) are the reason such data is never ported by a machine. A clinician plots the
 * measurement on whichever chart their own practice has agreed to use.
 */
export const AU_GROWTH_CHART_REFERENCE: PaketAraci = {
  anahtar: 'au-growth-chart-reference',
  roller: null,
  hasta: { enCokYas: 18 },
  metin: {
    ad: m('Which growth chart to use'),
    aciklama: m('Under 2 years: use the WHO growth standards. From 2 to 18 years: ANZSPED, the region’s paediatric endocrinology and diabetes society, endorses its own charts for the region and separately lists the CDC 2000 charts; it does not say which of the two takes precedence — use whichever your practice has agreed to. This tile opens ANZSPED’s own page, where both sets of charts are linked.'),
    alanlar: {},
    hastaKapisi: m('For a patient under 18. This names which chart to use; it does not plot one.'),
    not: m('A reference, not a calculator: no percentile is worked out here. Read the measurement against the chart your practice uses.'),
    baglanti: m('Open ANZSPED’s growth charts page'),
  },
  baglanti: { adres: 'https://anzsped.org/clinical-resources-links/growth-growth-charts/' },
  lisans: { durum: 'serbest', kaynak: 'https://anzsped.org/clinical-resources-links/growth-growth-charts/ (read 2026-10-13): ANZSPED’s own page; a link-out tile reproduces none of its charts or data.' },
}

/**
 * PBS expenditure and prescriptions reports. The index was opened on 14 October 2026.
 * The tables were not copied: the site's copyright page, as quoted in docs/medicines/AUSTRALIA.md
 * from a reading on 9 October 2026, allows personal reference and reserves other rights.
 * Doctors only. Not a formulary and not a rank inside this product.
 */
export function auPbsRaporu(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-pbs-report-link',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('PBS expenditure and prescriptions (link)'),
      aciklama: m('Opens the Pharmaceutical Benefits Scheme page that lists the yearly expenditure and prescriptions reports. This product does not copy those tables.'),
      alanlar: {},
      not: m('The report index names a current file for 1 July 2024 to 30 June 2025. No drug name from it is stored here. Whether a medicine is right for this patient is the doctor\'s decision.'),
      baglanti: m('Open the PBS reports page'),
    },
    baglanti: { adres: 'https://www.pbs.gov.au/info/statistics/expenditure-prescriptions/pbs-expenditure-and-prescriptions' },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Pharmaceutical Benefits Scheme',
      kaynak: 'A link only. The report index was read 2026-10-14: https://www.pbs.gov.au/info/statistics/expenditure-prescriptions/pbs-expenditure-and-prescriptions. No table was copied. The copyright page (https://www.pbs.gov.au/general/copyright, last updated 6 July 2022) was read on 9 October 2026 and is quoted in docs/medicines/AUSTRALIA.md: personal reference, other rights reserved.',
      bildirim: m('A link to a Pharmaceutical Benefits Scheme page. This tile does not copy the reports. This product is not the Department\'s.'),
    },
  }
}

/**
 * The medicine-listing index. Opened 2026-10-15 (HTTP 200). No listing, restriction or price was copied.
 * The same copyright page as the report tile: personal reference, other rights reserved.
 * Doctors only.
 */
export function auPbsListesi(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-pbs-schedule-link',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('PBS medicine listings (link)'),
      aciklama: m('Opens the Pharmaceutical Benefits Scheme page that lists medicine listings. This product does not copy a listing, a restriction or a price.'),
      alanlar: {},
      not: m('A link only. Whether a medicine is right for this patient is the doctor\'s decision. Nothing is sent.'),
      baglanti: m('Open the PBS medicine listings'),
    },
    baglanti: { adres: 'https://www.pbs.gov.au/browse/medicine-listing' },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Pharmaceutical Benefits Scheme',
      kaynak: 'A link only. The listings index returned HTTP 200 on 15 October 2026: https://www.pbs.gov.au/browse/medicine-listing. No row was copied. The copyright page (https://www.pbs.gov.au/general/copyright, last updated 6 July 2022) was read on 9 October 2026 and is quoted in docs/medicines/AUSTRALIA.md: personal reference, other rights reserved.',
      bildirim: m('A link to a Pharmaceutical Benefits Scheme page. This tile does not copy the listings. This product is not the Department\'s.'),
    },
  }
}

/**
 * MBS Online. The home page returned HTTP 200 on 15 October 2026. No item and no fee was copied.
 * A notice granting commercial reuse of the schedule was not read, and none is claimed.
 * Doctors only.
 */
export function auMbsBaglantisi(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-mbs-online-link',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('MBS Online (link)'),
      aciklama: m('Opens MBS Online, where a practitioner looks up an item in the Medicare Benefits Schedule. This product does not copy an item, a fee or a rule.'),
      alanlar: {},
      not: m('A link only. Nothing is claimed and nothing is sent.'),
      baglanti: m('Open MBS Online'),
    },
    baglanti: { adres: 'https://www.mbsonline.gov.au/' },
    lisans: {
      durum: 'serbest',
      kaynak: 'A link only. https://www.mbsonline.gov.au/ returned HTTP 200 on 15 October 2026. No item and no fee was copied. A notice granting commercial reuse of the schedule was not read, and none is claimed.',
      bildirim: m('A link only. This tile does not copy the Medicare Benefits Schedule.'),
    },
  }
}

/**
 * The Australian cardiovascular disease risk calculator. The calculator page returned HTTP 200 on 15 October 2026.
 * The copyright page did not return a reuse grant, so no equation, coefficient or age band is stored.
 * General practice, general medicine, cardiology, endocrinology and geriatric medicine. Not paediatrics.
 */
export function auCvdBaglantisi(roller: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-cvd-risk-link',
    roller: [...roller],
    metin: {
      ad: m('Australian CVD risk calculator (link)'),
      aciklama: m('Opens the Australian cardiovascular disease risk calculator for health professionals. This product does not calculate a risk and does not copy the equation.'),
      alanlar: {},
      not: m('A link only. A result from the calculator is not kept here.'),
      baglanti: m('Open the Australian CVD risk calculator'),
    },
    baglanti: { adres: 'https://www.cvdcheck.org.au/calculator' },
    lisans: {
      durum: 'serbest',
      kaynak: 'A link only. https://www.cvdcheck.org.au/calculator returned HTTP 200 on 15 October 2026. https://www.cvdcheck.org.au/copyright did not return a reuse grant. No equation, coefficient or age band was copied.',
      bildirim: m('A link only. This tile does not copy the calculator or its equation.'),
    },
  }
}
