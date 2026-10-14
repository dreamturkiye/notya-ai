/**
 * NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — Australia: LINK-OUT TILES (`tur: 'baglanti'`). No field, no arithmetic,
 * nothing of a patient in the address, nothing kept (lib/ulke/araclar/tipler.ts, `AracTuru`). Each opens one
 * official page in a new tab; the mechanism is the kit's own (`lib/ulke/araclar/paket.ts` builds it from
 * `PaketAraci.baglanti` alone, so no entry in ./tanimlar.ts is needed). Listed, with every other key only this
 * country has, in countries/yasak-araclar.json.
 *
 *   au-my-health-record         answers the founder's question #4: does Australia have an equivalent of Türkiye's
 *                                e-Nabız, and should the AU pack reference it. It does — My Health Record — and
 *                                this is that reference, built the same way e-Nabız is referenced for Türkiye
 *                                (lib/doktor/doktorAraclari.ts: a tile, not a data connection).
 *   au-growth-chart-reference   answers the founder's question #3: which growth-chart reference Australian
 *                                paediatric practice actually uses. It is not a calculator — no LMS percentile
 *                                data of WHO's, the paediatric endocrine society's or the CDC's was read or copied
 *                                into this product in this session — it names which chart applies by age and
 *                                opens the page a clinician reads the charts from.
 *
 * MACHINE-WRITTEN, UNREAD BY A CLINICIAN OF AUSTRALIA: both are on the worklist of the local clinical lead
 * (./onaysizAciklar.ts), the same as the other three tools only this country has.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/**
 * MY HEALTH RECORD: Australia's national electronic health record system, read 2026-10-13 — Australian Government
 * Department of Health, Disability and Ageing, "My Health Record",
 * https://www.health.gov.au/topics/health-technologies-and-digital-health/my-health-record: "My Health Record is a
 * national electronic health record system... holds an online summary of your key health information." The System
 * Operator is the Australian Digital Health Agency; privacy is overseen by the Office of the Australian Information
 * Commissioner. THE PAGE NAMES NO SINGLE LOGIN ADDRESS FOR A CLINICIAN: it says a healthcare provider accesses and
 * uploads through their own clinical software (not a browser login the way a consumer uses myGov), and points to
 * the Australian Digital Health Agency for provider-specific detail — not opened in this session. THIS TILE DOES
 * NOT CONNECT TO MY HEALTH RECORD: it only opens the Department's own explanatory page, the way Türkiye's product
 * references e-Nabız as a tile and not a data connection (lib/doktor/doktorAraclari.ts, key `enabiz`).
 */
export const AU_MY_HEALTH_RECORD: PaketAraci = {
  anahtar: 'au-my-health-record',
  roller: null,
  metin: {
    ad: m('My Health Record'),
    aciklama: m('Australia’s national electronic health record, run by the Australian Digital Health Agency: a patient’s own online summary of key health information (medicines, immunisations, pathology and imaging reports, hospital discharge summaries). A doctor accesses and uploads to it through their own clinical software, not through this product — Notya holds no connection to it and copies nothing to or from it.'),
    alanlar: {},
    not: m('This opens the Department of Health, Disability and Ageing’s own page about My Health Record. Nothing of this patient is sent anywhere.'),
    baglanti: m('Open the My Health Record page (health.gov.au)'),
  },
  baglanti: { adres: 'https://www.health.gov.au/topics/health-technologies-and-digital-health/my-health-record' },
  lisans: { durum: 'serbest', kaynak: 'https://www.health.gov.au/topics/health-technologies-and-digital-health/my-health-record (read 2026-10-13): the Department’s own page; a link-out tile reproduces none of its text.' },
}

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
